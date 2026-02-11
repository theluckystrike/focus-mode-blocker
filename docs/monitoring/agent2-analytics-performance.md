# Agent 2 — Custom Analytics & Performance Monitoring

> **Phase 11 — Crash Analytics & Monitoring**
> Focus Mode - Blocker v1.0.0 | Chrome MV3 | Privacy-First Architecture

---

## Section 3: Custom Analytics System for Focus Mode

### 3.1 Local-First Analytics Engine

All analytics data for free-tier users stays entirely on-device. No network requests, no external endpoints, no telemetry of any kind. The rolling window caps at 500 events to keep storage bounded.

**File: `src/background/analytics-engine.ts`**

```typescript
/**
 * analytics-engine.ts — FocusModeAnalytics
 *
 * Privacy-first analytics that stores ALL data locally for free-tier users.
 * 500-event rolling window. Zero external requests on free tier.
 * Batched storage writes to avoid thrashing chrome.storage.local.
 */

// ── Event Type Definitions ─────────────────────────────────────────

export type FocusEventType =
  // Session lifecycle
  | 'session_start'
  | 'session_end'
  | 'session_complete'
  | 'session_abandoned'
  // Blocking
  | 'block_triggered'
  | 'block_page_shown'
  // Focus Score
  | 'focus_score_calculated'
  // Streaks
  | 'streak_updated'
  // Timer
  | 'timer_started'
  | 'timer_paused'
  | 'timer_completed'
  // Nuclear mode
  | 'nuclear_mode_activated'
  | 'nuclear_mode_ended'
  // Paywall / monetization
  | 'paywall_shown'
  | 'paywall_dismissed'
  | 'paywall_converted'
  // Settings
  | 'settings_changed'
  // Onboarding
  | 'onboarding_slide'
  | 'onboarding_complete'
  // Errors
  | 'error';

// ── Event Payload Interfaces ───────────────────────────────────────

export interface SessionStartPayload {
  sessionType: 'focus' | 'break' | 'long_break';
  plannedDurationMs: number;
}

export interface SessionEndPayload {
  sessionType: 'focus' | 'break' | 'long_break';
  actualDurationMs: number;
  completed: boolean;
}

export interface BlockTriggeredPayload {
  /** Count only — never the domain for privacy. */
  blockedCount: number;
  ruleSource: 'static' | 'dynamic' | 'nuclear';
}

export interface FocusScorePayload {
  score: number;
  factors: {
    sessionCompletion: number;
    streakBonus: number;
    blockAdherence: number;
    consistency: number;
  };
}

export interface StreakUpdatedPayload {
  currentStreak: number;
  milestoneReached: boolean;
  milestone?: number;
}

export interface PaywallShownPayload {
  /** Trigger IDs T1–T10 from the monetization spec. */
  triggerId: string;
  context: string;
}

export interface SettingsChangedPayload {
  /** Which setting changed — never the actual value for privacy. */
  settingKey: string;
}

export interface OnboardingSlidePayload {
  slideNumber: number;
  totalSlides: number;
}

export interface ErrorPayload {
  fingerprint: string;
  message: string;
  category: 'storage' | 'network' | 'runtime' | 'api' | 'content_script' | 'unknown';
  stack?: string;
}

export type AnalyticsPayload =
  | SessionStartPayload
  | SessionEndPayload
  | BlockTriggeredPayload
  | FocusScorePayload
  | StreakUpdatedPayload
  | PaywallShownPayload
  | SettingsChangedPayload
  | OnboardingSlidePayload
  | ErrorPayload
  | Record<string, unknown>;

// ── Stored Event Shape ─────────────────────────────────────────────

export interface AnalyticsEvent {
  id: string;
  type: FocusEventType;
  payload: AnalyticsPayload;
  timestamp: number;
  sessionId: string;
  instanceId: string;
  version: string;
}

// ── Storage Key Constants ──────────────────────────────────────────

const STORAGE_KEYS = {
  EVENTS: 'analytics_events',
  INSTANCE_ID: 'analytics_instance_id',
  SESSION_ID: 'analytics_session_id',
  WRITE_LOCK: 'analytics_write_lock',
} as const;

const MAX_EVENTS = 500;
const BATCH_FLUSH_INTERVAL_MS = 5_000;
const EXTENSION_VERSION = chrome.runtime.getManifest().version;

// ── Main Analytics Class ───────────────────────────────────────────

export class FocusModeAnalytics {
  private static instance: FocusModeAnalytics | null = null;

  private instanceId: string = '';
  private sessionId: string = '';
  private eventBuffer: AnalyticsEvent[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private isFlushing: boolean = false;
  private initialized: boolean = false;

  // Listeners for telemetry sender (Pro tier)
  private onEventListeners: Array<(events: AnalyticsEvent[]) => void> = [];

  private constructor() {}

  /** Singleton access. */
  static getInstance(): FocusModeAnalytics {
    if (!FocusModeAnalytics.instance) {
      FocusModeAnalytics.instance = new FocusModeAnalytics();
    }
    return FocusModeAnalytics.instance;
  }

  /** Initialize on service worker activation. */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.instanceId = await this.getOrCreateInstanceId();
    this.sessionId = crypto.randomUUID();
    this.initialized = true;

    // Persist session ID so content scripts can reference it
    await chrome.storage.session.set({
      [STORAGE_KEYS.SESSION_ID]: this.sessionId,
    });
  }

  // ── Public API ─────────────────────────────────────────────────

  /** Record an analytics event. Batched writes coalesce rapid events. */
  async record(type: FocusEventType, payload: AnalyticsPayload = {}): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    const event: AnalyticsEvent = {
      id: crypto.randomUUID(),
      type,
      payload,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      instanceId: this.instanceId,
      version: EXTENSION_VERSION,
    };

    this.eventBuffer.push(event);
    this.scheduleFlush();
  }

  /** Convenience: record a Focus Mode session start. */
  async recordSessionStart(
    sessionType: 'focus' | 'break' | 'long_break',
    plannedDurationMs: number
  ): Promise<void> {
    await this.record('session_start', { sessionType, plannedDurationMs });
  }

  /** Convenience: record a Focus Mode session end. */
  async recordSessionEnd(
    sessionType: 'focus' | 'break' | 'long_break',
    actualDurationMs: number,
    completed: boolean
  ): Promise<void> {
    await this.record(completed ? 'session_complete' : 'session_abandoned', {
      sessionType,
      actualDurationMs,
      completed,
    });
  }

  /** Convenience: record a block event (count only, no domain). */
  async recordBlock(
    blockedCount: number,
    ruleSource: 'static' | 'dynamic' | 'nuclear'
  ): Promise<void> {
    await this.record('block_triggered', { blockedCount, ruleSource });
  }

  /** Convenience: record a Focus Score calculation. */
  async recordFocusScore(score: number, factors: FocusScorePayload['factors']): Promise<void> {
    await this.record('focus_score_calculated', { score, factors });
  }

  /** Convenience: record a streak update. */
  async recordStreak(
    currentStreak: number,
    milestoneReached: boolean,
    milestone?: number
  ): Promise<void> {
    await this.record('streak_updated', { currentStreak, milestoneReached, milestone });
  }

  /** Convenience: record a paywall impression. */
  async recordPaywallShown(triggerId: string, context: string): Promise<void> {
    await this.record('paywall_shown', { triggerId, context });
  }

  /** Convenience: record an error. */
  async recordError(
    fingerprint: string,
    message: string,
    category: ErrorPayload['category'],
    stack?: string
  ): Promise<void> {
    await this.record('error', { fingerprint, message, category, stack });
  }

  /** Get all stored events (for local dashboard display). */
  async getEvents(filter?: {
    type?: FocusEventType;
    since?: number;
    limit?: number;
  }): Promise<AnalyticsEvent[]> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.EVENTS);
    let events: AnalyticsEvent[] = result[STORAGE_KEYS.EVENTS] ?? [];

    if (filter?.type) {
      events = events.filter((e) => e.type === filter.type);
    }
    if (filter?.since) {
      events = events.filter((e) => e.timestamp >= filter.since!);
    }
    if (filter?.limit) {
      events = events.slice(-filter.limit);
    }

    return events;
  }

  /** Get aggregate counts grouped by event type. */
  async getEventCounts(since?: number): Promise<Record<string, number>> {
    const events = await this.getEvents(since ? { since } : undefined);
    const counts: Record<string, number> = {};
    for (const event of events) {
      counts[event.type] = (counts[event.type] ?? 0) + 1;
    }
    return counts;
  }

  /** Subscribe to new events (used by telemetry sender). */
  onEvents(listener: (events: AnalyticsEvent[]) => void): () => void {
    this.onEventListeners.push(listener);
    return () => {
      this.onEventListeners = this.onEventListeners.filter((l) => l !== listener);
    };
  }

  /** Force flush pending events to storage immediately. */
  async flush(): Promise<void> {
    await this.flushToStorage();
  }

  /** Get the current session ID. */
  getSessionId(): string {
    return this.sessionId;
  }

  /** Get the anonymous instance ID. */
  getInstanceId(): string {
    return this.instanceId;
  }

  // ── Private Helpers ────────────────────────────────────────────

  /** Get or create a persistent anonymous instance ID. */
  private async getOrCreateInstanceId(): Promise<string> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.INSTANCE_ID);
    if (result[STORAGE_KEYS.INSTANCE_ID]) {
      return result[STORAGE_KEYS.INSTANCE_ID];
    }

    const newId = crypto.randomUUID();
    await chrome.storage.local.set({ [STORAGE_KEYS.INSTANCE_ID]: newId });
    return newId;
  }

  /** Schedule a batched write. Coalesces rapid events into one write. */
  private scheduleFlush(): void {
    if (this.flushTimer !== null) return;

    this.flushTimer = setTimeout(async () => {
      this.flushTimer = null;
      await this.flushToStorage();
    }, BATCH_FLUSH_INTERVAL_MS);
  }

  /** Write buffered events to chrome.storage.local with rolling window. */
  private async flushToStorage(): Promise<void> {
    if (this.isFlushing || this.eventBuffer.length === 0) return;

    this.isFlushing = true;
    const eventsToFlush = [...this.eventBuffer];
    this.eventBuffer = [];

    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.EVENTS);
      const stored: AnalyticsEvent[] = result[STORAGE_KEYS.EVENTS] ?? [];

      // Append new events
      const combined = [...stored, ...eventsToFlush];

      // Enforce rolling window: keep only the most recent MAX_EVENTS
      const trimmed =
        combined.length > MAX_EVENTS ? combined.slice(combined.length - MAX_EVENTS) : combined;

      await chrome.storage.local.set({ [STORAGE_KEYS.EVENTS]: trimmed });

      // Notify telemetry listeners (for Pro tier opt-in sender)
      if (this.onEventListeners.length > 0) {
        for (const listener of this.onEventListeners) {
          try {
            listener(eventsToFlush);
          } catch {
            // Never let a listener crash the analytics engine
          }
        }
      }
    } catch (error) {
      // Put events back in the buffer so they are not lost
      this.eventBuffer = [...eventsToFlush, ...this.eventBuffer];
      console.error('[FocusModeAnalytics] Flush failed:', error);
    } finally {
      this.isFlushing = false;
    }
  }
}

// ── Singleton Export ───────────────────────────────────────────────

export const analytics = FocusModeAnalytics.getInstance();
```

---

### 3.2 Pro Tier Optional Telemetry

Only active for Pro users who explicitly opt in via Settings. All data is anonymized before transmission: hashed instance ID, no domains, no PII. Respects opt-out immediately by clearing the send queue.

**File: `src/background/telemetry-sender.ts`**

```typescript
/**
 * telemetry-sender.ts — TelemetrySender
 *
 * Sends anonymized, batched analytics to the server for Pro users
 * who have explicitly opted in. Respects opt-out immediately.
 * Uses chrome.alarms for reliable background scheduling.
 */

import { analytics, type AnalyticsEvent } from './analytics-engine';

// ── Configuration ──────────────────────────────────────────────────

const TELEMETRY_CONFIG = {
  /** Server endpoint for event ingestion. */
  ENDPOINT: 'https://api.focusmodeblocker.com/v1/events',

  /** API key header name. */
  API_KEY_HEADER: 'X-FM-API-Key',

  /** Flush when the queue reaches this size. */
  BATCH_SIZE: 20,

  /** Maximum events to re-queue on failure. Prevents unbounded growth. */
  MAX_QUEUE_SIZE: 50,

  /** Alarm name for periodic flush. */
  ALARM_NAME: 'telemetry_flush',

  /** Alarm period in minutes (chrome.alarms minimum is 1 minute). */
  ALARM_PERIOD_MINUTES: 1,

  /** Request timeout in milliseconds. */
  REQUEST_TIMEOUT_MS: 10_000,

  /** Storage key for the telemetry opt-in flag. */
  OPT_IN_KEY: 'telemetry_opt_in',

  /** Storage key for the cached API key. */
  API_KEY_STORAGE: 'telemetry_api_key',

  /** Storage key for the pending queue (survives SW restarts). */
  QUEUE_STORAGE: 'telemetry_queue',
} as const;

// ── Anonymization ──────────────────────────────────────────────────

async function hashInstanceId(instanceId: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(instanceId + '_focusmode_salt_v1');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function anonymizeEvent(
  event: AnalyticsEvent,
  hashedId: string
): Record<string, unknown> {
  return {
    id: event.id,
    type: event.type,
    payload: event.payload,
    timestamp: event.timestamp,
    sessionId: event.sessionId,
    instanceId: hashedId,
    version: event.version,
  };
}

// ── Telemetry Sender Class ─────────────────────────────────────────

export class TelemetrySender {
  private static instance: TelemetrySender | null = null;

  private queue: AnalyticsEvent[] = [];
  private hashedInstanceId: string = '';
  private apiKey: string = '';
  private isOptedIn: boolean = false;
  private isInitialized: boolean = false;
  private unsubscribeAnalytics: (() => void) | null = null;

  private constructor() {}

  static getInstance(): TelemetrySender {
    if (!TelemetrySender.instance) {
      TelemetrySender.instance = new TelemetrySender();
    }
    return TelemetrySender.instance;
  }

  /** Initialize the telemetry sender. Checks opt-in state. */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Load opt-in state
    const result = await chrome.storage.local.get([
      TELEMETRY_CONFIG.OPT_IN_KEY,
      TELEMETRY_CONFIG.API_KEY_STORAGE,
      TELEMETRY_CONFIG.QUEUE_STORAGE,
    ]);

    this.isOptedIn = result[TELEMETRY_CONFIG.OPT_IN_KEY] === true;
    this.apiKey = result[TELEMETRY_CONFIG.API_KEY_STORAGE] ?? '';
    this.queue = result[TELEMETRY_CONFIG.QUEUE_STORAGE] ?? [];

    if (this.isOptedIn && this.apiKey) {
      await this.activate();
    }

    // Listen for opt-in/opt-out changes
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;

      if (TELEMETRY_CONFIG.OPT_IN_KEY in changes) {
        const newValue = changes[TELEMETRY_CONFIG.OPT_IN_KEY].newValue;
        if (newValue === true) {
          this.handleOptIn();
        } else {
          this.handleOptOut();
        }
      }
    });

    this.isInitialized = true;
  }

  // ── Public API ─────────────────────────────────────────────────

  /** Check if telemetry is currently active. */
  isActive(): boolean {
    return this.isOptedIn && this.apiKey !== '';
  }

  /** Get the current queue size. */
  getQueueSize(): number {
    return this.queue.length;
  }

  /** Force send pending events now. */
  async sendNow(): Promise<boolean> {
    return this.flushQueue();
  }

  // ── Opt-in / Opt-out ──────────────────────────────────────────

  private async handleOptIn(): Promise<void> {
    this.isOptedIn = true;

    // Reload API key in case it was set alongside opt-in
    const result = await chrome.storage.local.get(TELEMETRY_CONFIG.API_KEY_STORAGE);
    this.apiKey = result[TELEMETRY_CONFIG.API_KEY_STORAGE] ?? '';

    if (this.apiKey) {
      await this.activate();
    }
  }

  private async handleOptOut(): Promise<void> {
    this.isOptedIn = false;

    // Immediately clear the queue — respect opt-out instantly
    this.queue = [];
    await chrome.storage.local.remove(TELEMETRY_CONFIG.QUEUE_STORAGE);

    // Stop listening for new analytics events
    if (this.unsubscribeAnalytics) {
      this.unsubscribeAnalytics();
      this.unsubscribeAnalytics = null;
    }

    // Remove the periodic alarm
    await chrome.alarms.clear(TELEMETRY_CONFIG.ALARM_NAME);
  }

  // ── Activation ────────────────────────────────────────────────

  private async activate(): Promise<void> {
    // Hash the instance ID for anonymization
    this.hashedInstanceId = await hashInstanceId(analytics.getInstanceId());

    // Subscribe to new analytics events
    if (!this.unsubscribeAnalytics) {
      this.unsubscribeAnalytics = analytics.onEvents((events) => {
        this.enqueue(events);
      });
    }

    // Set up periodic flush alarm (minimum 1 minute for chrome.alarms)
    await chrome.alarms.create(TELEMETRY_CONFIG.ALARM_NAME, {
      periodInMinutes: TELEMETRY_CONFIG.ALARM_PERIOD_MINUTES,
    });

    // Listen for the alarm
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === TELEMETRY_CONFIG.ALARM_NAME) {
        this.flushQueue();
      }
    });
  }

  // ── Queue Management ──────────────────────────────────────────

  private async enqueue(events: AnalyticsEvent[]): Promise<void> {
    if (!this.isOptedIn) return;

    this.queue.push(...events);

    // Cap queue size to prevent unbounded growth
    if (this.queue.length > TELEMETRY_CONFIG.MAX_QUEUE_SIZE) {
      this.queue = this.queue.slice(-TELEMETRY_CONFIG.MAX_QUEUE_SIZE);
    }

    // Persist queue for survival across SW restarts
    await chrome.storage.local.set({
      [TELEMETRY_CONFIG.QUEUE_STORAGE]: this.queue,
    });

    // Flush if batch size reached
    if (this.queue.length >= TELEMETRY_CONFIG.BATCH_SIZE) {
      await this.flushQueue();
    }
  }

  private async flushQueue(): Promise<boolean> {
    if (!this.isOptedIn || this.queue.length === 0 || !this.apiKey) {
      return true;
    }

    const batch = this.queue.splice(0, TELEMETRY_CONFIG.BATCH_SIZE);
    const anonymized = batch.map((e) => anonymizeEvent(e, this.hashedInstanceId));

    try {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        TELEMETRY_CONFIG.REQUEST_TIMEOUT_MS
      );

      const response = await fetch(TELEMETRY_CONFIG.ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [TELEMETRY_CONFIG.API_KEY_HEADER]: this.apiKey,
        },
        body: JSON.stringify({ events: anonymized }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      // Success — persist updated queue
      await chrome.storage.local.set({
        [TELEMETRY_CONFIG.QUEUE_STORAGE]: this.queue,
      });

      return true;
    } catch (error) {
      // Re-queue the failed batch (prepend so they go out first next time)
      this.queue = [...batch, ...this.queue];

      // Enforce max queue size after re-queue
      if (this.queue.length > TELEMETRY_CONFIG.MAX_QUEUE_SIZE) {
        this.queue = this.queue.slice(-TELEMETRY_CONFIG.MAX_QUEUE_SIZE);
      }

      await chrome.storage.local.set({
        [TELEMETRY_CONFIG.QUEUE_STORAGE]: this.queue,
      });

      console.warn('[TelemetrySender] Flush failed, re-queued:', error);
      return false;
    }
  }
}

// ── Singleton Export ───────────────────────────────────────────────

export const telemetrySender = TelemetrySender.getInstance();
```

---

### 3.3 Server-Side Analytics (Node.js)

Express-based endpoint for Pro tier event ingestion and dashboard queries. PostgreSQL storage with fingerprint-based error deduplication.

**File: `server/analytics-server.ts`**

```typescript
/**
 * analytics-server.ts — Focus Mode Analytics Server
 *
 * Express endpoint for Pro tier telemetry ingestion.
 * PostgreSQL storage with dashboard query endpoints.
 * Handles event ingestion, error deduplication, and reporting.
 */

import express, { Request, Response, NextFunction } from 'express';
import { Pool, PoolClient } from 'pg';
import crypto from 'crypto';

// ── Configuration ──────────────────────────────────────────────────

const CONFIG = {
  PORT: parseInt(process.env.PORT ?? '3100', 10),
  DB_URL: process.env.DATABASE_URL ?? 'postgresql://localhost:5432/focusmode_analytics',
  API_KEYS: new Set((process.env.API_KEYS ?? '').split(',').filter(Boolean)),
  MAX_BATCH_SIZE: 100,
  RATE_LIMIT_PER_MINUTE: 60,
};

// ── Database Pool ──────────────────────────────────────────────────

const pool = new Pool({ connectionString: CONFIG.DB_URL });

// ── Rate Limiter (in-memory, per instance) ─────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(instanceId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(instanceId);

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(instanceId, { count: 1, resetAt: now + 60_000 });
    return true;
  }

  if (entry.count >= CONFIG.RATE_LIMIT_PER_MINUTE) {
    return false;
  }

  entry.count++;
  return true;
}

// Clean up stale rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now >= entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60_000);

// ── Express App ────────────────────────────────────────────────────

const app = express();
app.use(express.json({ limit: '1mb' }));

// ── Auth Middleware ─────────────────────────────────────────────────

function authenticate(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-fm-api-key'] as string | undefined;

  if (!apiKey || !CONFIG.API_KEYS.has(apiKey)) {
    res.status(401).json({ error: 'Invalid API key' });
    return;
  }

  next();
}

// ── Event Type Definitions (server-side mirror) ────────────────────

interface IncomingEvent {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  timestamp: number;
  sessionId: string;
  instanceId: string;
  version: string;
}

interface IngestBody {
  events: IncomingEvent[];
}

// ── POST /v1/events — Event Ingestion ──────────────────────────────

app.post('/v1/events', authenticate, async (req: Request, res: Response) => {
  const body = req.body as IngestBody;

  if (!body.events || !Array.isArray(body.events)) {
    res.status(400).json({ error: 'Missing events array' });
    return;
  }

  if (body.events.length > CONFIG.MAX_BATCH_SIZE) {
    res.status(400).json({ error: `Batch exceeds max size of ${CONFIG.MAX_BATCH_SIZE}` });
    return;
  }

  if (body.events.length === 0) {
    res.status(200).json({ accepted: 0 });
    return;
  }

  // Rate limit by instance ID (from first event)
  const instanceId = body.events[0].instanceId;
  if (!checkRateLimit(instanceId)) {
    res.status(429).json({ error: 'Rate limit exceeded' });
    return;
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let accepted = 0;

    for (const event of body.events) {
      if (!event.id || !event.type || !event.timestamp || !event.instanceId) {
        continue; // Skip malformed events
      }

      // Route events to appropriate tables
      if (event.type === 'error') {
        await ingestError(client, event);
      } else if (
        event.type === 'session_start' ||
        event.type === 'session_complete' ||
        event.type === 'session_abandoned' ||
        event.type === 'session_end'
      ) {
        await ingestSessionEvent(client, event);
      }

      // All events go to the general analytics_events table
      await ingestGeneralEvent(client, event);
      accepted++;
    }

    await client.query('COMMIT');
    res.status(200).json({ accepted });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Ingest] Transaction failed:', error);
    res.status(500).json({ error: 'Ingestion failed' });
  } finally {
    client.release();
  }
});

// ── Ingestion Helpers ──────────────────────────────────────────────

async function ingestGeneralEvent(client: PoolClient, event: IncomingEvent): Promise<void> {
  await client.query(
    `INSERT INTO analytics_events (id, event_type, payload, event_timestamp, session_id, instance_id, version)
     VALUES ($1, $2, $3, to_timestamp($4 / 1000.0), $5, $6, $7)
     ON CONFLICT (id) DO NOTHING`,
    [
      event.id,
      event.type,
      JSON.stringify(event.payload),
      event.timestamp,
      event.sessionId,
      event.instanceId,
      event.version,
    ]
  );
}

async function ingestSessionEvent(client: PoolClient, event: IncomingEvent): Promise<void> {
  const payload = event.payload as Record<string, unknown>;

  if (event.type === 'session_start') {
    await client.query(
      `INSERT INTO focus_sessions (id, instance_id, session_type, planned_duration_ms, started_at, version)
       VALUES ($1, $2, $3, $4, to_timestamp($5 / 1000.0), $6)
       ON CONFLICT (id) DO NOTHING`,
      [
        event.sessionId,
        event.instanceId,
        payload.sessionType ?? 'focus',
        payload.plannedDurationMs ?? 0,
        event.timestamp,
        event.version,
      ]
    );
  } else if (event.type === 'session_complete' || event.type === 'session_abandoned') {
    await client.query(
      `UPDATE focus_sessions
       SET actual_duration_ms = $1,
           completed = $2,
           ended_at = to_timestamp($3 / 1000.0),
           focus_score = $4
       WHERE id = $5`,
      [
        payload.actualDurationMs ?? 0,
        event.type === 'session_complete',
        event.timestamp,
        payload.score ?? null,
        event.sessionId,
      ]
    );
  }
}

async function ingestError(client: PoolClient, event: IncomingEvent): Promise<void> {
  const payload = event.payload as Record<string, unknown>;
  const fingerprint = (payload.fingerprint as string) ?? 'unknown';
  const message = (payload.message as string) ?? '';
  const category = (payload.category as string) ?? 'unknown';

  // Upsert the deduplicated error record
  await client.query(
    `INSERT INTO errors (fingerprint, message, category, first_seen, last_seen, occurrence_count, latest_version)
     VALUES ($1, $2, $3, to_timestamp($4 / 1000.0), to_timestamp($4 / 1000.0), 1, $5)
     ON CONFLICT (fingerprint)
     DO UPDATE SET
       last_seen = GREATEST(errors.last_seen, to_timestamp($4 / 1000.0)),
       occurrence_count = errors.occurrence_count + 1,
       latest_version = $5`,
    [fingerprint, message, category, event.timestamp, event.version]
  );

  // Record the individual occurrence
  await client.query(
    `INSERT INTO error_occurrences (id, fingerprint, instance_id, session_id, occurred_at, version, stack)
     VALUES ($1, $2, $3, $4, to_timestamp($5 / 1000.0), $6, $7)
     ON CONFLICT (id) DO NOTHING`,
    [
      event.id,
      fingerprint,
      event.instanceId,
      event.sessionId,
      event.timestamp,
      event.version,
      (payload.stack as string) ?? null,
    ]
  );
}

// ── Dashboard API Endpoints ────────────────────────────────────────

// GET /api/errors — Top errors by version
app.get('/api/errors', authenticate, async (req: Request, res: Response) => {
  const version = req.query.version as string | undefined;
  const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 200);

  let query = `
    SELECT fingerprint, message, category, first_seen, last_seen,
           occurrence_count, latest_version
    FROM errors
  `;
  const params: unknown[] = [];

  if (version) {
    query += ' WHERE latest_version = $1';
    params.push(version);
  }

  query += ' ORDER BY occurrence_count DESC LIMIT $' + (params.length + 1);
  params.push(limit);

  const result = await pool.query(query, params);
  res.json({ errors: result.rows });
});

// GET /api/errors/trend — Error count over time
app.get('/api/errors/trend', authenticate, async (req: Request, res: Response) => {
  const days = Math.min(parseInt(req.query.days as string, 10) || 30, 90);
  const fingerprint = req.query.fingerprint as string | undefined;

  let query = `
    SELECT date_trunc('day', occurred_at) AS day,
           COUNT(*) AS count
    FROM error_occurrences
    WHERE occurred_at >= NOW() - INTERVAL '1 day' * $1
  `;
  const params: unknown[] = [days];

  if (fingerprint) {
    query += ' AND fingerprint = $2';
    params.push(fingerprint);
  }

  query += ' GROUP BY day ORDER BY day';

  const result = await pool.query(query, params);
  res.json({ trend: result.rows });
});

// GET /api/sessions — Focus session completion rates
app.get('/api/sessions', authenticate, async (req: Request, res: Response) => {
  const days = Math.min(parseInt(req.query.days as string, 10) || 30, 90);

  const result = await pool.query(
    `SELECT
       session_type,
       COUNT(*) AS total,
       COUNT(*) FILTER (WHERE completed = true) AS completed,
       ROUND(AVG(actual_duration_ms)) AS avg_duration_ms,
       ROUND(AVG(focus_score)::numeric, 1) AS avg_focus_score
     FROM focus_sessions
     WHERE started_at >= NOW() - INTERVAL '1 day' * $1
       AND ended_at IS NOT NULL
     GROUP BY session_type
     ORDER BY session_type`,
    [days]
  );

  res.json({ sessions: result.rows });
});

// GET /api/retention — Daily and weekly active users
app.get('/api/retention', authenticate, async (req: Request, res: Response) => {
  const days = Math.min(parseInt(req.query.days as string, 10) || 30, 90);

  const dailyResult = await pool.query(
    `SELECT date_trunc('day', event_timestamp) AS day,
            COUNT(DISTINCT instance_id) AS active_users
     FROM analytics_events
     WHERE event_timestamp >= NOW() - INTERVAL '1 day' * $1
     GROUP BY day
     ORDER BY day`,
    [days]
  );

  const weeklyResult = await pool.query(
    `SELECT date_trunc('week', event_timestamp) AS week,
            COUNT(DISTINCT instance_id) AS active_users
     FROM analytics_events
     WHERE event_timestamp >= NOW() - INTERVAL '1 day' * $1
     GROUP BY week
     ORDER BY week`,
    [days]
  );

  res.json({
    daily: dailyResult.rows,
    weekly: weeklyResult.rows,
  });
});

// GET /api/paywall — Conversion funnel by trigger
app.get('/api/paywall', authenticate, async (req: Request, res: Response) => {
  const days = Math.min(parseInt(req.query.days as string, 10) || 30, 90);

  const result = await pool.query(
    `SELECT
       payload->>'triggerId' AS trigger_id,
       COUNT(*) FILTER (WHERE event_type = 'paywall_shown') AS shown,
       COUNT(*) FILTER (WHERE event_type = 'paywall_dismissed') AS dismissed,
       COUNT(*) FILTER (WHERE event_type = 'paywall_converted') AS converted
     FROM analytics_events
     WHERE event_type IN ('paywall_shown', 'paywall_dismissed', 'paywall_converted')
       AND event_timestamp >= NOW() - INTERVAL '1 day' * $1
     GROUP BY trigger_id
     ORDER BY shown DESC`,
    [days]
  );

  res.json({ funnels: result.rows });
});

// ── Health Check ───────────────────────────────────────────────────

app.get('/health', async (_req: Request, res: Response) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'unhealthy' });
  }
});

// ── Start Server ───────────────────────────────────────────────────

app.listen(CONFIG.PORT, () => {
  console.log(`[Analytics Server] Listening on port ${CONFIG.PORT}`);
});

export { app, pool };
```

---

### 3.4 Database Schema

Complete PostgreSQL migration for Focus Mode analytics tables with proper indexes for the dashboard queries.

**File: `server/migrations/001_focus_mode_analytics.sql`**

```sql
-- 001_focus_mode_analytics.sql
-- Focus Mode - Blocker analytics schema
-- Phase 11: Crash Analytics & Monitoring

BEGIN;

-- ── General Analytics Events ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS analytics_events (
    id              UUID PRIMARY KEY,
    event_type      VARCHAR(64) NOT NULL,
    payload         JSONB NOT NULL DEFAULT '{}',
    event_timestamp TIMESTAMPTZ NOT NULL,
    session_id      UUID NOT NULL,
    instance_id     VARCHAR(64) NOT NULL,
    version         VARCHAR(20) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for dashboard queries: filter by type and time range
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_time
    ON analytics_events (event_type, event_timestamp DESC);

-- Index for retention queries: distinct instance_id per day
CREATE INDEX IF NOT EXISTS idx_analytics_events_instance_time
    ON analytics_events (instance_id, event_timestamp DESC);

-- Index for paywall funnel: filter by type and extract triggerId
CREATE INDEX IF NOT EXISTS idx_analytics_events_paywall
    ON analytics_events (event_type, event_timestamp)
    WHERE event_type IN ('paywall_shown', 'paywall_dismissed', 'paywall_converted');

-- ── Focus Sessions ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS focus_sessions (
    id                  UUID PRIMARY KEY,
    instance_id         VARCHAR(64) NOT NULL,
    session_type        VARCHAR(20) NOT NULL DEFAULT 'focus',
    planned_duration_ms INTEGER NOT NULL DEFAULT 0,
    actual_duration_ms  INTEGER,
    completed           BOOLEAN,
    focus_score         REAL,
    started_at          TIMESTAMPTZ NOT NULL,
    ended_at            TIMESTAMPTZ,
    version             VARCHAR(20) NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for session completion queries
CREATE INDEX IF NOT EXISTS idx_focus_sessions_type_started
    ON focus_sessions (session_type, started_at DESC);

-- Index for per-user session history
CREATE INDEX IF NOT EXISTS idx_focus_sessions_instance
    ON focus_sessions (instance_id, started_at DESC);

-- ── Errors (Deduplicated by Fingerprint) ───────────────────────────

CREATE TABLE IF NOT EXISTS errors (
    fingerprint      VARCHAR(128) PRIMARY KEY,
    message          TEXT NOT NULL,
    category         VARCHAR(32) NOT NULL DEFAULT 'unknown',
    first_seen       TIMESTAMPTZ NOT NULL,
    last_seen        TIMESTAMPTZ NOT NULL,
    occurrence_count INTEGER NOT NULL DEFAULT 1,
    latest_version   VARCHAR(20) NOT NULL,
    resolved         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for top errors dashboard
CREATE INDEX IF NOT EXISTS idx_errors_count
    ON errors (occurrence_count DESC)
    WHERE resolved = FALSE;

-- Index for version-filtered queries
CREATE INDEX IF NOT EXISTS idx_errors_version
    ON errors (latest_version, occurrence_count DESC);

-- ── Error Occurrences (Individual Events) ──────────────────────────

CREATE TABLE IF NOT EXISTS error_occurrences (
    id           UUID PRIMARY KEY,
    fingerprint  VARCHAR(128) NOT NULL REFERENCES errors(fingerprint),
    instance_id  VARCHAR(64) NOT NULL,
    session_id   UUID NOT NULL,
    occurred_at  TIMESTAMPTZ NOT NULL,
    version      VARCHAR(20) NOT NULL,
    stack        TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for error trend queries
CREATE INDEX IF NOT EXISTS idx_error_occurrences_time
    ON error_occurrences (occurred_at DESC);

-- Index for per-fingerprint drilldown
CREATE INDEX IF NOT EXISTS idx_error_occurrences_fingerprint
    ON error_occurrences (fingerprint, occurred_at DESC);

-- ── Retention Helper View ──────────────────────────────────────────

CREATE OR REPLACE VIEW daily_active_users AS
SELECT
    date_trunc('day', event_timestamp) AS day,
    COUNT(DISTINCT instance_id) AS active_users
FROM analytics_events
GROUP BY day
ORDER BY day DESC;

CREATE OR REPLACE VIEW weekly_active_users AS
SELECT
    date_trunc('week', event_timestamp) AS week,
    COUNT(DISTINCT instance_id) AS active_users
FROM analytics_events
GROUP BY week
ORDER BY week DESC;

-- ── Paywall Funnel Helper View ─────────────────────────────────────

CREATE OR REPLACE VIEW paywall_funnel AS
SELECT
    payload->>'triggerId' AS trigger_id,
    COUNT(*) FILTER (WHERE event_type = 'paywall_shown') AS shown,
    COUNT(*) FILTER (WHERE event_type = 'paywall_dismissed') AS dismissed,
    COUNT(*) FILTER (WHERE event_type = 'paywall_converted') AS converted,
    CASE
        WHEN COUNT(*) FILTER (WHERE event_type = 'paywall_shown') > 0
        THEN ROUND(
            100.0 * COUNT(*) FILTER (WHERE event_type = 'paywall_converted')
            / COUNT(*) FILTER (WHERE event_type = 'paywall_shown'), 1
        )
        ELSE 0
    END AS conversion_rate_pct
FROM analytics_events
WHERE event_type IN ('paywall_shown', 'paywall_dismissed', 'paywall_converted')
GROUP BY trigger_id
ORDER BY shown DESC;

COMMIT;
```

---

## Section 4: Performance Monitoring for Focus Mode

### 4.1 Memory Leak Detection

Monitors service worker heap usage at 1-minute intervals via `chrome.alarms`. Applies linear regression to detect sustained growth trends that indicate a memory leak.

**File: `src/background/memory-monitor.ts`**

```typescript
/**
 * memory-monitor.ts — MemoryMonitor
 *
 * Detects memory leaks in the Focus Mode service worker.
 * 1-minute sampling via chrome.alarms. Linear regression trend analysis:
 * if heap grows >100KB/min sustained over 10 samples, flags a leak.
 *
 * Focus Mode specific concerns:
 *  - Analytics rolling window growth (should cap at 500 events)
 *  - Blocklist rule array growth
 *  - Timer callback accumulation
 *  - Message handler / storage listener accumulation
 */

import { analytics } from './analytics-engine';

// ── Types ──────────────────────────────────────────────────────────

interface MemorySample {
  timestamp: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
}

interface MemoryStatus {
  current: MemorySample | null;
  trend: 'stable' | 'growing' | 'leaking' | 'unknown';
  growthRateKBPerMin: number;
  samples: number;
  warnings: string[];
}

type MemorySeverity = 'info' | 'warning' | 'critical';

interface MemoryAlert {
  severity: MemorySeverity;
  message: string;
  usedMB: number;
  timestamp: number;
}

// ── Constants ──────────────────────────────────────────────────────

const MEMORY_CONFIG = {
  ALARM_NAME: 'memory_monitor_sample',
  SAMPLE_INTERVAL_MINUTES: 1,
  MAX_SAMPLES: 60,               // Keep 1 hour of samples
  WARNING_THRESHOLD_MB: 50,
  CRITICAL_THRESHOLD_MB: 100,
  LEAK_RATE_KB_PER_MIN: 100,     // >100KB/min = potential leak
  LEAK_MIN_SAMPLES: 10,          // Need 10 consecutive samples to confirm
  STORAGE_KEY: 'memory_samples',
  ALERTS_KEY: 'memory_alerts',
} as const;

// ── Linear Regression ──────────────────────────────────────────────

function linearRegression(
  points: Array<{ x: number; y: number }>
): { slope: number; intercept: number; r2: number } {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: 0, r2: 0 };

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (const { x, y } of points) {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return { slope: 0, intercept: sumY / n, r2: 0 };

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // R-squared (coefficient of determination)
  const yMean = sumY / n;
  let ssRes = 0;
  let ssTot = 0;
  for (const { x, y } of points) {
    const predicted = slope * x + intercept;
    ssRes += (y - predicted) ** 2;
    ssTot += (y - yMean) ** 2;
  }
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

  return { slope, intercept, r2 };
}

// ── MemoryMonitor Class ────────────────────────────────────────────

export class MemoryMonitor {
  private static instance: MemoryMonitor | null = null;

  private samples: MemorySample[] = [];
  private alerts: MemoryAlert[] = [];
  private initialized: boolean = false;
  private alertCallbacks: Array<(alert: MemoryAlert) => void> = [];

  private constructor() {}

  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  /** Start monitoring. Call once during service worker initialization. */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Restore persisted samples from previous SW activations
    const result = await chrome.storage.local.get([
      MEMORY_CONFIG.STORAGE_KEY,
      MEMORY_CONFIG.ALERTS_KEY,
    ]);
    this.samples = result[MEMORY_CONFIG.STORAGE_KEY] ?? [];
    this.alerts = result[MEMORY_CONFIG.ALERTS_KEY] ?? [];

    // Set up the recurring alarm
    await chrome.alarms.create(MEMORY_CONFIG.ALARM_NAME, {
      periodInMinutes: MEMORY_CONFIG.SAMPLE_INTERVAL_MINUTES,
    });

    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === MEMORY_CONFIG.ALARM_NAME) {
        this.takeSample();
      }
    });

    // Take an initial sample immediately
    await this.takeSample();

    this.initialized = true;
  }

  // ── Public API ─────────────────────────────────────────────────

  /** Get current memory status and trend analysis. */
  getStatus(): MemoryStatus {
    if (this.samples.length === 0) {
      return {
        current: null,
        trend: 'unknown',
        growthRateKBPerMin: 0,
        samples: 0,
        warnings: [],
      };
    }

    const current = this.samples[this.samples.length - 1];
    const warnings: string[] = [];

    // Check absolute thresholds
    const usedMB = current.usedJSHeapSize / (1024 * 1024);
    if (usedMB >= MEMORY_CONFIG.CRITICAL_THRESHOLD_MB) {
      warnings.push(`CRITICAL: Heap usage at ${usedMB.toFixed(1)}MB (threshold: ${MEMORY_CONFIG.CRITICAL_THRESHOLD_MB}MB)`);
    } else if (usedMB >= MEMORY_CONFIG.WARNING_THRESHOLD_MB) {
      warnings.push(`WARNING: Heap usage at ${usedMB.toFixed(1)}MB (threshold: ${MEMORY_CONFIG.WARNING_THRESHOLD_MB}MB)`);
    }

    // Trend analysis via linear regression
    const { trend, growthRateKBPerMin } = this.analyzeTrend();

    if (trend === 'leaking') {
      warnings.push(
        `LEAK DETECTED: Heap growing at ${growthRateKBPerMin.toFixed(1)}KB/min ` +
        `sustained over ${this.samples.length} samples`
      );
    }

    return {
      current,
      trend,
      growthRateKBPerMin,
      samples: this.samples.length,
      warnings,
    };
  }

  /** Get recent memory alerts. */
  getAlerts(limit: number = 20): MemoryAlert[] {
    return this.alerts.slice(-limit);
  }

  /** Subscribe to memory alerts. Returns unsubscribe function. */
  onAlert(callback: (alert: MemoryAlert) => void): () => void {
    this.alertCallbacks.push(callback);
    return () => {
      this.alertCallbacks = this.alertCallbacks.filter((cb) => cb !== callback);
    };
  }

  /** Get raw samples for charting. */
  getSamples(): MemorySample[] {
    return [...this.samples];
  }

  // ── Sampling ──────────────────────────────────────────────────

  private async takeSample(): Promise<void> {
    try {
      // performance.measureUserAgentSpecificMemory() is available in
      // service workers with cross-origin isolation, but is not universally
      // supported. Fall back to performance.memory where available.
      let usedJSHeapSize = 0;
      let totalJSHeapSize = 0;

      if ('memory' in performance) {
        const mem = (performance as unknown as { memory: {
          usedJSHeapSize: number;
          totalJSHeapSize: number;
        }}).memory;
        usedJSHeapSize = mem.usedJSHeapSize;
        totalJSHeapSize = mem.totalJSHeapSize;
      } else if ('measureUserAgentSpecificMemory' in performance) {
        try {
          const measurement = await (
            performance as unknown as {
              measureUserAgentSpecificMemory(): Promise<{ bytes: number }>;
            }
          ).measureUserAgentSpecificMemory();
          usedJSHeapSize = measurement.bytes;
          totalJSHeapSize = measurement.bytes;
        } catch {
          // API not available in this context
          return;
        }
      } else {
        // No memory API available — skip this sample
        return;
      }

      const sample: MemorySample = {
        timestamp: Date.now(),
        usedJSHeapSize,
        totalJSHeapSize,
      };

      this.samples.push(sample);

      // Enforce rolling window
      if (this.samples.length > MEMORY_CONFIG.MAX_SAMPLES) {
        this.samples = this.samples.slice(-MEMORY_CONFIG.MAX_SAMPLES);
      }

      // Check for threshold alerts
      await this.checkThresholds(sample);

      // Persist samples
      await chrome.storage.local.set({
        [MEMORY_CONFIG.STORAGE_KEY]: this.samples,
      });
    } catch (error) {
      console.warn('[MemoryMonitor] Sample failed:', error);
    }
  }

  // ── Trend Analysis ────────────────────────────────────────────

  private analyzeTrend(): { trend: 'stable' | 'growing' | 'leaking'; growthRateKBPerMin: number } {
    if (this.samples.length < MEMORY_CONFIG.LEAK_MIN_SAMPLES) {
      return { trend: 'stable', growthRateKBPerMin: 0 };
    }

    // Use the most recent LEAK_MIN_SAMPLES samples for trend
    const recentSamples = this.samples.slice(-MEMORY_CONFIG.LEAK_MIN_SAMPLES);
    const startTime = recentSamples[0].timestamp;

    // Convert to points: x = minutes since first sample, y = KB
    const points = recentSamples.map((s) => ({
      x: (s.timestamp - startTime) / 60_000,
      y: s.usedJSHeapSize / 1024,
    }));

    const { slope, r2 } = linearRegression(points);

    // slope is KB per minute
    const growthRateKBPerMin = slope;

    if (
      growthRateKBPerMin > MEMORY_CONFIG.LEAK_RATE_KB_PER_MIN &&
      r2 > 0.7 // High correlation = consistent linear growth
    ) {
      return { trend: 'leaking', growthRateKBPerMin };
    }

    if (growthRateKBPerMin > 10) {
      return { trend: 'growing', growthRateKBPerMin };
    }

    return { trend: 'stable', growthRateKBPerMin };
  }

  // ── Threshold Alerts ──────────────────────────────────────────

  private async checkThresholds(sample: MemorySample): Promise<void> {
    const usedMB = sample.usedJSHeapSize / (1024 * 1024);

    let alert: MemoryAlert | null = null;

    if (usedMB >= MEMORY_CONFIG.CRITICAL_THRESHOLD_MB) {
      alert = {
        severity: 'critical',
        message: `Heap usage critical: ${usedMB.toFixed(1)}MB`,
        usedMB,
        timestamp: sample.timestamp,
      };
    } else if (usedMB >= MEMORY_CONFIG.WARNING_THRESHOLD_MB) {
      alert = {
        severity: 'warning',
        message: `Heap usage elevated: ${usedMB.toFixed(1)}MB`,
        usedMB,
        timestamp: sample.timestamp,
      };
    }

    // Check for leak-based alert
    const { trend, growthRateKBPerMin } = this.analyzeTrend();
    if (trend === 'leaking' && !alert) {
      alert = {
        severity: 'warning',
        message: `Memory leak detected: ${growthRateKBPerMin.toFixed(1)}KB/min growth rate`,
        usedMB,
        timestamp: sample.timestamp,
      };
    }

    if (alert) {
      this.alerts.push(alert);

      // Cap alerts history
      if (this.alerts.length > 100) {
        this.alerts = this.alerts.slice(-100);
      }

      await chrome.storage.local.set({
        [MEMORY_CONFIG.ALERTS_KEY]: this.alerts,
      });

      // Record to analytics
      await analytics.recordError(
        `memory_${alert.severity}`,
        alert.message,
        'runtime'
      );

      // Notify subscribers
      for (const cb of this.alertCallbacks) {
        try {
          cb(alert);
        } catch {
          // Never let a callback crash the monitor
        }
      }
    }
  }
}

// ── Singleton Export ───────────────────────────────────────────────

export const memoryMonitor = MemoryMonitor.getInstance();
```

---

### 4.2 CPU Usage Tracking

Wraps expensive Chrome APIs and Focus Mode operations to measure execution time against performance budgets. Aggregates stats (count, average, max) per operation.

**File: `src/background/cpu-monitor.ts`**

```typescript
/**
 * cpu-monitor.ts — CPUMonitor
 *
 * Wraps Chrome APIs and Focus Mode operations to measure execution
 * time against performance budgets. Alerts on slow operations.
 *
 * Performance budgets:
 *  - chrome.storage.local.get    <20ms
 *  - chrome.storage.local.set    <50ms
 *  - declarativeNetRequest       <100ms
 *  - Focus Score calculation     <5ms
 *  - Blocklist URL matching      <1ms per check
 *  - Rule generation             <50ms for 100 sites
 *  - Analytics event recording   <1ms
 */

import { analytics } from './analytics-engine';

// ── Types ──────────────────────────────────────────────────────────

interface OperationBudget {
  name: string;
  budgetMs: number;
}

interface OperationStats {
  name: string;
  count: number;
  totalMs: number;
  avgMs: number;
  maxMs: number;
  minMs: number;
  budgetMs: number;
  violations: number;
  lastViolationMs: number | null;
  lastExecutedAt: number;
}

interface TimingResult<T> {
  result: T;
  durationMs: number;
  overBudget: boolean;
}

// ── Performance Budgets ────────────────────────────────────────────

const BUDGETS: Record<string, OperationBudget> = {
  // Chrome API budgets
  'storage.local.get': { name: 'storage.local.get', budgetMs: 20 },
  'storage.local.set': { name: 'storage.local.set', budgetMs: 50 },
  'storage.sync.get': { name: 'storage.sync.get', budgetMs: 50 },
  'storage.sync.set': { name: 'storage.sync.set', budgetMs: 100 },
  'declarativeNetRequest.updateDynamicRules': {
    name: 'declarativeNetRequest.updateDynamicRules',
    budgetMs: 100,
  },
  'tabs.query': { name: 'tabs.query', budgetMs: 50 },
  'alarms.create': { name: 'alarms.create', budgetMs: 20 },
  'alarms.get': { name: 'alarms.get', budgetMs: 10 },

  // Focus Mode operation budgets
  'focusScore.calculate': { name: 'focusScore.calculate', budgetMs: 5 },
  'blocklist.matchUrl': { name: 'blocklist.matchUrl', budgetMs: 1 },
  'blocklist.generateRules': { name: 'blocklist.generateRules', budgetMs: 50 },
  'analytics.record': { name: 'analytics.record', budgetMs: 1 },
  'popup.render': { name: 'popup.render', budgetMs: 500 },
  'blockPage.render': { name: 'blockPage.render', budgetMs: 200 },
  'contentScript.inject': { name: 'contentScript.inject', budgetMs: 100 },
  'message.roundTrip': { name: 'message.roundTrip', budgetMs: 50 },
} as const;

// ── Constants ──────────────────────────────────────────────────────

const SLOW_OP_THRESHOLD_MS = 100;
const STATS_STORAGE_KEY = 'cpu_monitor_stats';
const MAX_STATS_ENTRIES = 50;

// ── CPUMonitor Class ───────────────────────────────────────────────

export class CPUMonitor {
  private static instance: CPUMonitor | null = null;

  private stats: Map<string, OperationStats> = new Map();
  private initialized: boolean = false;
  private slowOpCallbacks: Array<(op: string, durationMs: number, budgetMs: number) => void> = [];

  private constructor() {}

  static getInstance(): CPUMonitor {
    if (!CPUMonitor.instance) {
      CPUMonitor.instance = new CPUMonitor();
    }
    return CPUMonitor.instance;
  }

  /** Initialize and restore persisted stats. */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const result = await chrome.storage.local.get(STATS_STORAGE_KEY);
    const persisted: OperationStats[] = result[STATS_STORAGE_KEY] ?? [];

    for (const stat of persisted) {
      this.stats.set(stat.name, stat);
    }

    this.initialized = true;
  }

  // ── Core Timing API ────────────────────────────────────────────

  /**
   * Time an async operation against its budget.
   * Records stats and fires alerts on violations.
   */
  async time<T>(operationName: string, fn: () => Promise<T>): Promise<TimingResult<T>> {
    const budget = BUDGETS[operationName]?.budgetMs ?? SLOW_OP_THRESHOLD_MS;
    const start = performance.now();

    let result: T;
    try {
      result = await fn();
    } catch (error) {
      const durationMs = performance.now() - start;
      this.recordTiming(operationName, durationMs, budget);
      throw error;
    }

    const durationMs = performance.now() - start;
    const overBudget = durationMs > budget;

    this.recordTiming(operationName, durationMs, budget);

    return { result, durationMs, overBudget };
  }

  /**
   * Time a synchronous operation against its budget.
   */
  timeSync<T>(operationName: string, fn: () => T): TimingResult<T> {
    const budget = BUDGETS[operationName]?.budgetMs ?? SLOW_OP_THRESHOLD_MS;
    const start = performance.now();

    let result: T;
    try {
      result = fn();
    } catch (error) {
      const durationMs = performance.now() - start;
      this.recordTiming(operationName, durationMs, budget);
      throw error;
    }

    const durationMs = performance.now() - start;
    const overBudget = durationMs > budget;

    this.recordTiming(operationName, durationMs, budget);

    return { result, durationMs, overBudget };
  }

  // ── Chrome API Wrappers ────────────────────────────────────────

  /** Timed wrapper for chrome.storage.local.get. */
  async storageLocalGet(keys: string | string[]): Promise<Record<string, unknown>> {
    const { result } = await this.time('storage.local.get', () =>
      chrome.storage.local.get(keys)
    );
    return result;
  }

  /** Timed wrapper for chrome.storage.local.set. */
  async storageLocalSet(items: Record<string, unknown>): Promise<void> {
    await this.time('storage.local.set', () =>
      chrome.storage.local.set(items)
    );
  }

  /** Timed wrapper for chrome.declarativeNetRequest.updateDynamicRules. */
  async updateDynamicRules(options: chrome.declarativeNetRequest.UpdateRuleOptions): Promise<void> {
    await this.time('declarativeNetRequest.updateDynamicRules', () =>
      chrome.declarativeNetRequest.updateDynamicRules(options)
    );
  }

  /** Timed wrapper for chrome.tabs.query. */
  async tabsQuery(queryInfo: chrome.tabs.QueryInfo): Promise<chrome.tabs.Tab[]> {
    const { result } = await this.time('tabs.query', () =>
      chrome.tabs.query(queryInfo)
    );
    return result;
  }

  /** Timed wrapper for chrome.alarms.create. */
  async alarmsCreate(name: string, alarmInfo: chrome.alarms.AlarmCreateInfo): Promise<void> {
    await this.time('alarms.create', () =>
      chrome.alarms.create(name, alarmInfo)
    );
  }

  // ── Stats API ─────────────────────────────────────────────────

  /** Get stats for a specific operation. */
  getOperationStats(name: string): OperationStats | null {
    return this.stats.get(name) ?? null;
  }

  /** Get all operation stats. */
  getAllStats(): OperationStats[] {
    return Array.from(this.stats.values());
  }

  /** Get operations that have exceeded their budget. */
  getViolations(): OperationStats[] {
    return this.getAllStats().filter((s) => s.violations > 0);
  }

  /** Subscribe to slow operation alerts. */
  onSlowOperation(
    callback: (op: string, durationMs: number, budgetMs: number) => void
  ): () => void {
    this.slowOpCallbacks.push(callback);
    return () => {
      this.slowOpCallbacks = this.slowOpCallbacks.filter((cb) => cb !== callback);
    };
  }

  /** Persist current stats to storage. Call periodically. */
  async persistStats(): Promise<void> {
    const statsArray = this.getAllStats().slice(-MAX_STATS_ENTRIES);
    await chrome.storage.local.set({ [STATS_STORAGE_KEY]: statsArray });
  }

  /** Reset all collected stats. */
  reset(): void {
    this.stats.clear();
  }

  // ── Internal ──────────────────────────────────────────────────

  private recordTiming(name: string, durationMs: number, budgetMs: number): void {
    let stat = this.stats.get(name);

    if (!stat) {
      stat = {
        name,
        count: 0,
        totalMs: 0,
        avgMs: 0,
        maxMs: 0,
        minMs: Infinity,
        budgetMs,
        violations: 0,
        lastViolationMs: null,
        lastExecutedAt: 0,
      };
      this.stats.set(name, stat);
    }

    stat.count++;
    stat.totalMs += durationMs;
    stat.avgMs = stat.totalMs / stat.count;
    stat.maxMs = Math.max(stat.maxMs, durationMs);
    stat.minMs = Math.min(stat.minMs, durationMs);
    stat.lastExecutedAt = Date.now();

    if (durationMs > budgetMs) {
      stat.violations++;
      stat.lastViolationMs = durationMs;

      // Alert on slow operations
      for (const cb of this.slowOpCallbacks) {
        try {
          cb(name, durationMs, budgetMs);
        } catch {
          // Never let a callback crash the monitor
        }
      }

      // Record to analytics if significantly over budget
      if (durationMs > SLOW_OP_THRESHOLD_MS) {
        analytics.recordError(
          `slow_op_${name}`,
          `${name} took ${durationMs.toFixed(1)}ms (budget: ${budgetMs}ms)`,
          'runtime'
        ).catch(() => {
          // Best-effort analytics recording
        });
      }
    }
  }
}

// ── Singleton Export ───────────────────────────────────────────────

export const cpuMonitor = CPUMonitor.getInstance();
```

---

### 4.3 Service Worker Startup Timing

Measures every phase of service worker initialization from first instruction to fully operational. Stores the last 50 startup timings for trend analysis.

**File: `src/background/startup-timing.ts`**

```typescript
/**
 * startup-timing.ts — StartupTiming
 *
 * Marks and measures every phase of service worker startup:
 *   sw_start -> config_loaded -> storage_loaded -> rules_loaded ->
 *   alarms_set -> listeners_registered -> initialization_complete
 *
 * Stores the last 50 startup timings. Alerts if total startup >500ms.
 * Focus Mode specific: tracks time to restore active session after SW restart.
 */

import { analytics } from './analytics-engine';

// ── Types ──────────────────────────────────────────────────────────

interface StartupPhase {
  name: string;
  startedAt: number;
  endedAt: number | null;
  durationMs: number | null;
}

interface StartupRecord {
  id: string;
  timestamp: number;
  phases: StartupPhase[];
  totalDurationMs: number | null;
  sessionRestored: boolean;
  sessionRestoreMs: number | null;
  overBudget: boolean;
}

// ── Constants ──────────────────────────────────────────────────────

const STARTUP_CONFIG = {
  STORAGE_KEY: 'startup_timings',
  MAX_RECORDS: 50,
  BUDGET_MS: 500,
  PHASE_ORDER: [
    'sw_start',
    'config_loaded',
    'storage_loaded',
    'rules_loaded',
    'alarms_set',
    'listeners_registered',
    'initialization_complete',
  ] as const,
} as const;

type StartupPhaseName = (typeof STARTUP_CONFIG.PHASE_ORDER)[number] | 'session_restored';

// ── StartupTiming Class ────────────────────────────────────────────

export class StartupTiming {
  private static instance: StartupTiming | null = null;

  private currentRecord: StartupRecord | null = null;
  private phases: Map<string, StartupPhase> = new Map();
  private swStartTime: number = 0;
  private records: StartupRecord[] = [];
  private initialized: boolean = false;

  private constructor() {}

  static getInstance(): StartupTiming {
    if (!StartupTiming.instance) {
      StartupTiming.instance = new StartupTiming();
    }
    return StartupTiming.instance;
  }

  /**
   * Call this as the VERY FIRST line of the service worker entry point.
   * Captures the earliest possible timestamp.
   */
  markStart(): void {
    this.swStartTime = performance.now();
    this.currentRecord = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      phases: [],
      totalDurationMs: null,
      sessionRestored: false,
      sessionRestoreMs: null,
      overBudget: false,
    };

    this.phases.clear();
    this.addPhase('sw_start', this.swStartTime);
  }

  /** Mark a phase as started. */
  markPhaseStart(name: StartupPhaseName): void {
    if (!this.currentRecord) return;
    this.addPhase(name, performance.now());
  }

  /** Mark a phase as completed. */
  markPhaseEnd(name: StartupPhaseName): void {
    const phase = this.phases.get(name);
    if (!phase) return;

    phase.endedAt = performance.now();
    phase.durationMs = phase.endedAt - phase.startedAt;
  }

  /**
   * Mark a phase start + end in a single call.
   * Useful for phases that are a single await.
   */
  async timePhase<T>(name: StartupPhaseName, fn: () => Promise<T>): Promise<T> {
    this.markPhaseStart(name);
    try {
      const result = await fn();
      this.markPhaseEnd(name);
      return result;
    } catch (error) {
      this.markPhaseEnd(name);
      throw error;
    }
  }

  /**
   * Mark that an active focus session was restored after SW restart.
   */
  markSessionRestored(): void {
    if (!this.currentRecord) return;

    const elapsed = performance.now() - this.swStartTime;
    this.currentRecord.sessionRestored = true;
    this.currentRecord.sessionRestoreMs = elapsed;
  }

  /**
   * Call when all initialization is complete.
   * Finalizes the record and persists it.
   */
  async markComplete(): Promise<void> {
    if (!this.currentRecord) return;

    const totalDurationMs = performance.now() - this.swStartTime;
    this.addPhase('initialization_complete', performance.now());

    this.currentRecord.totalDurationMs = totalDurationMs;
    this.currentRecord.phases = Array.from(this.phases.values());
    this.currentRecord.overBudget = totalDurationMs > STARTUP_CONFIG.BUDGET_MS;

    // Load existing records if not yet loaded
    if (!this.initialized) {
      const result = await chrome.storage.local.get(STARTUP_CONFIG.STORAGE_KEY);
      this.records = result[STARTUP_CONFIG.STORAGE_KEY] ?? [];
      this.initialized = true;
    }

    // Append and trim
    this.records.push(this.currentRecord);
    if (this.records.length > STARTUP_CONFIG.MAX_RECORDS) {
      this.records = this.records.slice(-STARTUP_CONFIG.MAX_RECORDS);
    }

    // Persist
    await chrome.storage.local.set({
      [STARTUP_CONFIG.STORAGE_KEY]: this.records,
    });

    // Alert if over budget
    if (this.currentRecord.overBudget) {
      await analytics.recordError(
        'slow_startup',
        `Service worker startup took ${totalDurationMs.toFixed(0)}ms (budget: ${STARTUP_CONFIG.BUDGET_MS}ms)`,
        'runtime'
      );
    }

    // Reset for next potential restart
    this.currentRecord = null;
    this.phases.clear();
  }

  // ── Query API ─────────────────────────────────────────────────

  /** Get the most recent startup record. */
  getLatest(): StartupRecord | null {
    if (this.records.length === 0) return null;
    return this.records[this.records.length - 1];
  }

  /** Get all stored startup records. */
  getRecords(): StartupRecord[] {
    return [...this.records];
  }

  /** Get average startup time across stored records. */
  getAverageStartupMs(): number {
    const completed = this.records.filter((r) => r.totalDurationMs !== null);
    if (completed.length === 0) return 0;

    const total = completed.reduce((sum, r) => sum + r.totalDurationMs!, 0);
    return total / completed.length;
  }

  /** Get the percentage of startups that exceeded the budget. */
  getOverBudgetRate(): number {
    if (this.records.length === 0) return 0;
    const overBudget = this.records.filter((r) => r.overBudget).length;
    return (overBudget / this.records.length) * 100;
  }

  /** Get average duration per phase across all records. */
  getPhaseAverages(): Record<string, number> {
    const phaseTotals: Record<string, { sum: number; count: number }> = {};

    for (const record of this.records) {
      for (const phase of record.phases) {
        if (phase.durationMs === null) continue;

        if (!phaseTotals[phase.name]) {
          phaseTotals[phase.name] = { sum: 0, count: 0 };
        }
        phaseTotals[phase.name].sum += phase.durationMs;
        phaseTotals[phase.name].count++;
      }
    }

    const averages: Record<string, number> = {};
    for (const [name, { sum, count }] of Object.entries(phaseTotals)) {
      averages[name] = sum / count;
    }
    return averages;
  }

  // ── Internal ──────────────────────────────────────────────────

  private addPhase(name: string, startedAt: number): void {
    this.phases.set(name, {
      name,
      startedAt,
      endedAt: null,
      durationMs: null,
    });
  }
}

// ── Singleton Export ───────────────────────────────────────────────

export const startupTiming = StartupTiming.getInstance();
```

**Usage in the service worker entry point (`src/background/index.ts`):**

```typescript
import { startupTiming } from './startup-timing';

// FIRST LINE — capture the earliest possible timestamp
startupTiming.markStart();

// ... imports ...

async function initializeServiceWorker(): Promise<void> {
  // Phase: load configuration
  const config = await startupTiming.timePhase('config_loaded', async () => {
    return loadConfig();
  });

  // Phase: load storage state
  const state = await startupTiming.timePhase('storage_loaded', async () => {
    return loadStorageState();
  });

  // Phase: set up declarativeNetRequest rules
  await startupTiming.timePhase('rules_loaded', async () => {
    await setupBlockingRules(state.blocklist);
  });

  // Phase: set up chrome.alarms
  await startupTiming.timePhase('alarms_set', async () => {
    await setupAlarms();
  });

  // Phase: register all message/event listeners
  await startupTiming.timePhase('listeners_registered', async () => {
    registerListeners();
  });

  // Check if there was an active session to restore
  if (state.activeSession) {
    await restoreActiveSession(state.activeSession);
    startupTiming.markSessionRestored();
  }

  // All done
  await startupTiming.markComplete();
}

initializeServiceWorker();
```

---

### 4.4 Content Script Injection Timing

Tracks injection phases for `detector.js`, `blocker.js`, and `tracker.js`. Measures navigation-to-block latency and reports slow injections.

**File: `src/background/injection-timing.ts`**

```typescript
/**
 * injection-timing.ts — InjectionTiming
 *
 * Tracks content script injection timing for detector.js, blocker.js,
 * and tracker.js. Measures navigation-to-block latency.
 * Reports slow injections (>200ms).
 *
 * Note: With declarativeNetRequest, blocking happens at the network
 * level (near-instant). This module tracks the content-script-based
 * fallback path and overlay injection timing.
 */

import { analytics } from './analytics-engine';
import { cpuMonitor } from './cpu-monitor';

// ── Types ──────────────────────────────────────────────────────────

type ContentScriptName = 'detector' | 'blocker' | 'tracker';

interface InjectionRecord {
  id: string;
  script: ContentScriptName;
  tabId: number;
  url: string; // Origin only — never the full path for privacy
  phases: {
    navigationDetectedAt: number;
    injectionStartedAt: number | null;
    injectionCompletedAt: number | null;
    scriptReadyAt: number | null;
    blockPageShownAt: number | null;
  };
  totalMs: number | null;
  injectionMs: number | null;
  blockLatencyMs: number | null;
  slow: boolean;
  timestamp: number;
}

interface InjectionStats {
  script: ContentScriptName;
  count: number;
  avgInjectionMs: number;
  avgBlockLatencyMs: number;
  maxInjectionMs: number;
  slowCount: number;
  slowRate: number;
}

// ── Constants ──────────────────────────────────────────────────────

const INJECTION_CONFIG = {
  STORAGE_KEY: 'injection_timings',
  MAX_RECORDS: 200,
  SLOW_THRESHOLD_MS: 200,
  BLOCK_LATENCY_BUDGET_MS: 100, // With DNR, block should be near-instant
} as const;

// ── InjectionTiming Class ──────────────────────────────────────────

export class InjectionTiming {
  private static instance: InjectionTiming | null = null;

  private activeInjections: Map<string, InjectionRecord> = new Map();
  private records: InjectionRecord[] = [];
  private initialized: boolean = false;

  private constructor() {}

  static getInstance(): InjectionTiming {
    if (!InjectionTiming.instance) {
      InjectionTiming.instance = new InjectionTiming();
    }
    return InjectionTiming.instance;
  }

  /** Initialize and load persisted records. */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const result = await chrome.storage.local.get(INJECTION_CONFIG.STORAGE_KEY);
    this.records = result[INJECTION_CONFIG.STORAGE_KEY] ?? [];
    this.initialized = true;
  }

  // ── Recording API (called from background service worker) ─────

  /**
   * Mark that a navigation was detected that requires content script injection.
   * Returns an injection ID for tracking subsequent phases.
   */
  startTracking(script: ContentScriptName, tabId: number, url: string): string {
    const id = crypto.randomUUID();

    // Store origin only for privacy
    let origin: string;
    try {
      origin = new URL(url).origin;
    } catch {
      origin = 'unknown';
    }

    const record: InjectionRecord = {
      id,
      script,
      tabId,
      url: origin,
      phases: {
        navigationDetectedAt: performance.now(),
        injectionStartedAt: null,
        injectionCompletedAt: null,
        scriptReadyAt: null,
        blockPageShownAt: null,
      },
      totalMs: null,
      injectionMs: null,
      blockLatencyMs: null,
      slow: false,
      timestamp: Date.now(),
    };

    this.activeInjections.set(id, record);
    return id;
  }

  /** Mark that chrome.scripting.executeScript was called. */
  markInjectionStart(id: string): void {
    const record = this.activeInjections.get(id);
    if (record) {
      record.phases.injectionStartedAt = performance.now();
    }
  }

  /** Mark that chrome.scripting.executeScript resolved. */
  markInjectionComplete(id: string): void {
    const record = this.activeInjections.get(id);
    if (record) {
      record.phases.injectionCompletedAt = performance.now();
    }
  }

  /** Mark that the content script sent a "ready" message. */
  markScriptReady(id: string): void {
    const record = this.activeInjections.get(id);
    if (record) {
      record.phases.scriptReadyAt = performance.now();
    }
  }

  /** Mark that the block page / overlay was shown to the user. */
  markBlockPageShown(id: string): void {
    const record = this.activeInjections.get(id);
    if (record) {
      record.phases.blockPageShownAt = performance.now();
    }
  }

  /**
   * Finalize the injection record.
   * Call after all phases are complete or after a timeout.
   */
  async finalize(id: string): Promise<InjectionRecord | null> {
    const record = this.activeInjections.get(id);
    if (!record) return null;

    this.activeInjections.delete(id);

    // Calculate durations
    const navTime = record.phases.navigationDetectedAt;

    if (record.phases.injectionCompletedAt && record.phases.injectionStartedAt) {
      record.injectionMs =
        record.phases.injectionCompletedAt - record.phases.injectionStartedAt;
    }

    if (record.phases.blockPageShownAt) {
      record.blockLatencyMs = record.phases.blockPageShownAt - navTime;
    }

    const lastPhase = record.phases.blockPageShownAt
      ?? record.phases.scriptReadyAt
      ?? record.phases.injectionCompletedAt;

    if (lastPhase) {
      record.totalMs = lastPhase - navTime;
    }

    record.slow = (record.totalMs ?? 0) > INJECTION_CONFIG.SLOW_THRESHOLD_MS;

    // Store
    this.records.push(record);
    if (this.records.length > INJECTION_CONFIG.MAX_RECORDS) {
      this.records = this.records.slice(-INJECTION_CONFIG.MAX_RECORDS);
    }

    await chrome.storage.local.set({
      [INJECTION_CONFIG.STORAGE_KEY]: this.records,
    });

    // Alert on slow injections
    if (record.slow) {
      await analytics.recordError(
        `slow_injection_${record.script}`,
        `${record.script}.js injection took ${record.totalMs?.toFixed(0)}ms`,
        'runtime'
      );
    }

    return record;
  }

  // ── Content Script Message Handler ────────────────────────────

  /**
   * Handle timing messages from content scripts.
   * Content scripts send these via chrome.runtime.sendMessage:
   *   { type: 'injection_timing', injectionId, phase, timestamp }
   */
  handleTimingMessage(message: {
    injectionId: string;
    phase: 'ready' | 'block_shown';
  }): void {
    if (message.phase === 'ready') {
      this.markScriptReady(message.injectionId);
    } else if (message.phase === 'block_shown') {
      this.markBlockPageShown(message.injectionId);
      // Auto-finalize after block page is shown
      this.finalize(message.injectionId);
    }
  }

  // ── Stats API ─────────────────────────────────────────────────

  /** Get aggregate stats per content script. */
  getStats(): InjectionStats[] {
    const scripts: ContentScriptName[] = ['detector', 'blocker', 'tracker'];
    const stats: InjectionStats[] = [];

    for (const script of scripts) {
      const scriptRecords = this.records.filter((r) => r.script === script);
      if (scriptRecords.length === 0) continue;

      const withInjection = scriptRecords.filter((r) => r.injectionMs !== null);
      const withBlock = scriptRecords.filter((r) => r.blockLatencyMs !== null);
      const slowRecords = scriptRecords.filter((r) => r.slow);

      stats.push({
        script,
        count: scriptRecords.length,
        avgInjectionMs:
          withInjection.length > 0
            ? withInjection.reduce((sum, r) => sum + r.injectionMs!, 0) / withInjection.length
            : 0,
        avgBlockLatencyMs:
          withBlock.length > 0
            ? withBlock.reduce((sum, r) => sum + r.blockLatencyMs!, 0) / withBlock.length
            : 0,
        maxInjectionMs:
          withInjection.length > 0
            ? Math.max(...withInjection.map((r) => r.injectionMs!))
            : 0,
        slowCount: slowRecords.length,
        slowRate: (slowRecords.length / scriptRecords.length) * 100,
      });
    }

    return stats;
  }

  /** Get recent records for display. */
  getRecords(limit: number = 50): InjectionRecord[] {
    return this.records.slice(-limit);
  }

  /** Clean up stale active injections (older than 30 seconds). */
  cleanupStale(): void {
    const cutoff = performance.now() - 30_000;
    for (const [id, record] of this.activeInjections) {
      if (record.phases.navigationDetectedAt < cutoff) {
        this.activeInjections.delete(id);
      }
    }
  }
}

// ── Singleton Export ───────────────────────────────────────────────

export const injectionTiming = InjectionTiming.getInstance();
```

---

### 4.5 Focus Mode Performance Dashboard Data

Aggregates all performance data into a single interface for the Options page performance panel.

**File: `src/background/performance-dashboard.ts`**

```typescript
/**
 * performance-dashboard.ts — PerformanceDashboard
 *
 * Aggregates data from all monitoring subsystems into a single
 * interface for the Options page performance display.
 *
 * Metrics:
 *  - Average popup load time
 *  - Average block page load time
 *  - Storage usage (bytes used vs quota)
 *  - Average Focus Score calculation time
 *  - Blocking effectiveness (% of blocked navigations caught)
 *  - Memory trend and alerts
 *  - Service worker startup timing
 *  - Content script injection timing
 */

import { memoryMonitor } from './memory-monitor';
import { cpuMonitor } from './cpu-monitor';
import { startupTiming } from './startup-timing';
import { injectionTiming } from './injection-timing';
import { analytics } from './analytics-engine';

// ── Dashboard Data Types ───────────────────────────────────────────

export interface PerformanceSummary {
  /** Timestamp when this summary was generated. */
  generatedAt: number;

  /** Popup rendering performance. */
  popup: {
    avgLoadMs: number;
    maxLoadMs: number;
    budgetMs: number;
    overBudgetRate: number;
  };

  /** Block page rendering performance. */
  blockPage: {
    avgLoadMs: number;
    maxLoadMs: number;
    budgetMs: number;
    overBudgetRate: number;
  };

  /** Storage usage statistics. */
  storage: {
    bytesUsed: number;
    quotaBytes: number;
    usagePercent: number;
    analyticsEventCount: number;
  };

  /** Focus Score calculation performance. */
  focusScore: {
    avgCalcMs: number;
    maxCalcMs: number;
    budgetMs: number;
  };

  /** Blocking effectiveness. */
  blocking: {
    totalBlocked: number;
    avgRuleUpdateMs: number;
    maxRuleUpdateMs: number;
    ruleUpdateBudgetMs: number;
  };

  /** Memory status. */
  memory: {
    currentMB: number;
    trend: string;
    growthRateKBPerMin: number;
    alertCount: number;
  };

  /** Service worker startup. */
  startup: {
    avgMs: number;
    lastMs: number | null;
    budgetMs: number;
    overBudgetRate: number;
    phaseAverages: Record<string, number>;
  };

  /** Content script injection. */
  injection: {
    scripts: Array<{
      name: string;
      avgMs: number;
      maxMs: number;
      slowRate: number;
    }>;
  };

  /** Overall health score (0–100). */
  healthScore: number;
  healthLabel: 'excellent' | 'good' | 'fair' | 'poor';
}

// ── PerformanceDashboard Class ─────────────────────────────────────

export class PerformanceDashboard {
  private static instance: PerformanceDashboard | null = null;

  private constructor() {}

  static getInstance(): PerformanceDashboard {
    if (!PerformanceDashboard.instance) {
      PerformanceDashboard.instance = new PerformanceDashboard();
    }
    return PerformanceDashboard.instance;
  }

  /** Generate a complete performance summary. */
  async generateSummary(): Promise<PerformanceSummary> {
    const [storageData, analyticsEvents] = await Promise.all([
      this.getStorageUsage(),
      analytics.getEvents(),
    ]);

    // CPU stats
    const popupStats = cpuMonitor.getOperationStats('popup.render');
    const blockPageStats = cpuMonitor.getOperationStats('blockPage.render');
    const focusScoreStats = cpuMonitor.getOperationStats('focusScore.calculate');
    const ruleUpdateStats = cpuMonitor.getOperationStats(
      'declarativeNetRequest.updateDynamicRules'
    );

    // Memory status
    const memStatus = memoryMonitor.getStatus();
    const memAlerts = memoryMonitor.getAlerts();

    // Startup timing
    const startupRecords = startupTiming.getRecords();
    const latestStartup = startupTiming.getLatest();

    // Injection stats
    const injStats = injectionTiming.getStats();

    // Block count from analytics
    const blockEvents = analyticsEvents.filter((e) => e.type === 'block_triggered');
    const totalBlocked = blockEvents.reduce((sum, e) => {
      const payload = e.payload as { blockedCount?: number };
      return sum + (payload.blockedCount ?? 1);
    }, 0);

    // Build summary
    const summary: PerformanceSummary = {
      generatedAt: Date.now(),

      popup: {
        avgLoadMs: popupStats?.avgMs ?? 0,
        maxLoadMs: popupStats?.maxMs ?? 0,
        budgetMs: 500,
        overBudgetRate: popupStats
          ? (popupStats.violations / Math.max(popupStats.count, 1)) * 100
          : 0,
      },

      blockPage: {
        avgLoadMs: blockPageStats?.avgMs ?? 0,
        maxLoadMs: blockPageStats?.maxMs ?? 0,
        budgetMs: 200,
        overBudgetRate: blockPageStats
          ? (blockPageStats.violations / Math.max(blockPageStats.count, 1)) * 100
          : 0,
      },

      storage: {
        bytesUsed: storageData.bytesUsed,
        quotaBytes: storageData.quotaBytes,
        usagePercent: storageData.quotaBytes > 0
          ? (storageData.bytesUsed / storageData.quotaBytes) * 100
          : 0,
        analyticsEventCount: analyticsEvents.length,
      },

      focusScore: {
        avgCalcMs: focusScoreStats?.avgMs ?? 0,
        maxCalcMs: focusScoreStats?.maxMs ?? 0,
        budgetMs: 5,
      },

      blocking: {
        totalBlocked,
        avgRuleUpdateMs: ruleUpdateStats?.avgMs ?? 0,
        maxRuleUpdateMs: ruleUpdateStats?.maxMs ?? 0,
        ruleUpdateBudgetMs: 100,
      },

      memory: {
        currentMB: memStatus.current
          ? memStatus.current.usedJSHeapSize / (1024 * 1024)
          : 0,
        trend: memStatus.trend,
        growthRateKBPerMin: memStatus.growthRateKBPerMin,
        alertCount: memAlerts.length,
      },

      startup: {
        avgMs: startupTiming.getAverageStartupMs(),
        lastMs: latestStartup?.totalDurationMs ?? null,
        budgetMs: 500,
        overBudgetRate: startupTiming.getOverBudgetRate(),
        phaseAverages: startupTiming.getPhaseAverages(),
      },

      injection: {
        scripts: injStats.map((s) => ({
          name: s.script,
          avgMs: s.avgInjectionMs,
          maxMs: s.maxInjectionMs,
          slowRate: s.slowRate,
        })),
      },

      healthScore: 0,
      healthLabel: 'excellent',
    };

    // Calculate overall health score
    const { score, label } = this.calculateHealthScore(summary);
    summary.healthScore = score;
    summary.healthLabel = label;

    return summary;
  }

  /** Get a lightweight status check (no storage reads). */
  getQuickStatus(): {
    memoryTrend: string;
    cpuViolations: number;
    lastStartupMs: number | null;
  } {
    return {
      memoryTrend: memoryMonitor.getStatus().trend,
      cpuViolations: cpuMonitor.getViolations().length,
      lastStartupMs: startupTiming.getLatest()?.totalDurationMs ?? null,
    };
  }

  // ── Internal Helpers ──────────────────────────────────────────

  private async getStorageUsage(): Promise<{
    bytesUsed: number;
    quotaBytes: number;
  }> {
    try {
      const bytesUsed = await chrome.storage.local.getBytesInUse();
      // chrome.storage.local quota is 10MB for extensions
      const quotaBytes = 10 * 1024 * 1024;
      return { bytesUsed, quotaBytes };
    } catch {
      return { bytesUsed: 0, quotaBytes: 10 * 1024 * 1024 };
    }
  }

  /**
   * Calculate an overall health score (0–100) based on all metrics.
   * Deducts points for budget violations, memory issues, and slow operations.
   */
  private calculateHealthScore(
    summary: PerformanceSummary
  ): { score: number; label: 'excellent' | 'good' | 'fair' | 'poor' } {
    let score = 100;

    // Popup performance (up to -15 points)
    if (summary.popup.avgLoadMs > summary.popup.budgetMs) {
      score -= 15;
    } else if (summary.popup.avgLoadMs > summary.popup.budgetMs * 0.8) {
      score -= 5;
    }

    // Block page performance (up to -15 points)
    if (summary.blockPage.avgLoadMs > summary.blockPage.budgetMs) {
      score -= 15;
    } else if (summary.blockPage.avgLoadMs > summary.blockPage.budgetMs * 0.8) {
      score -= 5;
    }

    // Storage usage (up to -10 points)
    if (summary.storage.usagePercent > 80) {
      score -= 10;
    } else if (summary.storage.usagePercent > 60) {
      score -= 5;
    }

    // Focus Score calculation (up to -10 points)
    if (summary.focusScore.avgCalcMs > summary.focusScore.budgetMs) {
      score -= 10;
    }

    // Rule update latency (up to -10 points)
    if (summary.blocking.avgRuleUpdateMs > summary.blocking.ruleUpdateBudgetMs) {
      score -= 10;
    }

    // Memory health (up to -20 points)
    if (summary.memory.trend === 'leaking') {
      score -= 20;
    } else if (summary.memory.trend === 'growing') {
      score -= 10;
    }
    if (summary.memory.currentMB > 100) {
      score -= 10;
    } else if (summary.memory.currentMB > 50) {
      score -= 5;
    }

    // Startup time (up to -10 points)
    if (summary.startup.avgMs > summary.startup.budgetMs) {
      score -= 10;
    } else if (summary.startup.avgMs > summary.startup.budgetMs * 0.8) {
      score -= 3;
    }

    // Injection timing (up to -10 points)
    const maxSlowRate = Math.max(
      0,
      ...summary.injection.scripts.map((s) => s.slowRate)
    );
    if (maxSlowRate > 20) {
      score -= 10;
    } else if (maxSlowRate > 5) {
      score -= 5;
    }

    // Clamp to 0–100
    score = Math.max(0, Math.min(100, score));

    let label: 'excellent' | 'good' | 'fair' | 'poor';
    if (score >= 90) label = 'excellent';
    else if (score >= 70) label = 'good';
    else if (score >= 50) label = 'fair';
    else label = 'poor';

    return { score, label };
  }
}

// ── Singleton Export ───────────────────────────────────────────────

export const performanceDashboard = PerformanceDashboard.getInstance();
```

**Message handler for Options page requests (`src/background/index.ts`):**

```typescript
import { performanceDashboard } from './performance-dashboard';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_PERFORMANCE_SUMMARY') {
    performanceDashboard.generateSummary().then((summary) => {
      sendResponse({ success: true, data: summary });
    }).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep channel open for async response
  }

  if (message.type === 'GET_QUICK_STATUS') {
    const status = performanceDashboard.getQuickStatus();
    sendResponse({ success: true, data: status });
    return false; // Synchronous response
  }
});
```

**Content script timing reporter (added to each content script):**

```typescript
/**
 * timing-reporter.ts — Content Script Timing Reporter
 *
 * Include at the top of detector.js, blocker.js, and tracker.js.
 * Reports injection timing back to the service worker.
 */

const INJECTION_ID = document.documentElement.dataset.fmInjectionId;

function reportTiming(phase: 'ready' | 'block_shown'): void {
  if (!INJECTION_ID) return;

  try {
    chrome.runtime.sendMessage({
      type: 'injection_timing',
      injectionId: INJECTION_ID,
      phase,
      timestamp: performance.now(),
    });
  } catch {
    // Service worker may not be ready — timing data is best-effort
  }
}

// Report ready immediately
reportTiming('ready');

export { reportTiming };
```
