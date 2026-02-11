# Section 7: Debug Mode System for Focus Mode

Complete debug infrastructure for Focus Mode - Blocker, covering structured logging, remote debugging, support tooling, and a hidden debug panel for diagnostics.

---

## 7.1 Debug Logger

**File:** `src/shared/debug-logger.ts`

A category-based, circular-buffer logger that outputs to the console only when debug mode is enabled. Warnings and errors always output regardless of debug state.

```typescript
// src/shared/debug-logger.ts

/**
 * DebugLogger — Structured, category-based logging for Focus Mode - Blocker.
 *
 * - Three log levels: log (info), warn, error
 * - 12 category channels covering every Focus Mode context
 * - Circular buffer capped at 1,000 entries
 * - Debug mode toggle persisted in chrome.storage.local
 * - PII sanitization on every entry before storage or output
 * - console.* output gated by debug flag (warn/error always output)
 */

export type LogLevel = 'log' | 'warn' | 'error';

export type LogCategory =
  | 'blocking'
  | 'timer'
  | 'score'
  | 'streak'
  | 'storage'
  | 'license'
  | 'paywall'
  | 'messaging'
  | 'notifications'
  | 'nuclear'
  | 'analytics'
  | 'sync';

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: Record<string, unknown>;
  context?: string; // 'background' | 'popup' | 'content' | 'options' | 'block-page'
}

// Fields that must never appear in log data
const SENSITIVE_PATTERNS: RegExp[] = [
  /password/i,
  /token/i,
  /secret/i,
  /api[_-]?key/i,
  /authorization/i,
  /cookie/i,
  /session[_-]?id/i,
  /email/i,
  /license[_-]?key/i,
  /stripe[_-]?key/i,
  /credit[_-]?card/i,
  /cvv/i,
  /ssn/i,
];

// Value patterns to redact inline
const SENSITIVE_VALUE_PATTERNS: RegExp[] = [
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // email addresses
  /sk_(live|test)_[a-zA-Z0-9]{20,}/g, // Stripe secret keys
  /pk_(live|test)_[a-zA-Z0-9]{20,}/g, // Stripe publishable keys
  /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g, // JWTs
  /[A-Za-z0-9+/]{40,}={0,2}/g, // Base64 tokens (40+ chars)
];

const MAX_BUFFER_SIZE = 1_000;
const STORAGE_KEY_DEBUG = 'focusmode_debug_enabled';
const STORAGE_KEY_REMOTE = 'focusmode_remote_debug';

class DebugLogger {
  private buffer: LogEntry[] = [];
  private debugEnabled = false;
  private remoteEnabled = false;
  private context: string = 'unknown';
  private onRemoteLog: ((entry: LogEntry) => void) | null = null;
  private initialized = false;

  /**
   * Initialize the logger. Call once per context (background, popup, etc.).
   */
  async init(context: string): Promise<void> {
    this.context = context;

    try {
      const result = await chrome.storage.local.get([
        STORAGE_KEY_DEBUG,
        STORAGE_KEY_REMOTE,
      ]);
      this.debugEnabled = result[STORAGE_KEY_DEBUG] === true;
      this.remoteEnabled = result[STORAGE_KEY_REMOTE] === true;
    } catch {
      // Storage unavailable — default to off
      this.debugEnabled = false;
      this.remoteEnabled = false;
    }

    // Listen for debug toggle changes in real time
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      if (changes[STORAGE_KEY_DEBUG]) {
        this.debugEnabled = changes[STORAGE_KEY_DEBUG].newValue === true;
      }
      if (changes[STORAGE_KEY_REMOTE]) {
        this.remoteEnabled = changes[STORAGE_KEY_REMOTE].newValue === true;
      }
    });

    this.initialized = true;
  }

  /**
   * Register a callback for remote log streaming.
   */
  setRemoteHandler(handler: (entry: LogEntry) => void): void {
    this.onRemoteLog = handler;
  }

  /**
   * Core logging method.
   */
  private write(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: Record<string, unknown>
  ): void {
    const sanitizedData = data ? this.sanitize(data) : undefined;
    const sanitizedMessage = this.sanitizeString(message);

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      category,
      message: sanitizedMessage,
      data: sanitizedData,
      context: this.context,
    };

    // Circular buffer — drop oldest when full
    if (this.buffer.length >= MAX_BUFFER_SIZE) {
      this.buffer.shift();
    }
    this.buffer.push(entry);

    // Console output: warn/error always; log only when debug mode is on
    if (level === 'error') {
      console.error(`[FM:${category}]`, sanitizedMessage, sanitizedData ?? '');
    } else if (level === 'warn') {
      console.warn(`[FM:${category}]`, sanitizedMessage, sanitizedData ?? '');
    } else if (this.debugEnabled) {
      console.log(`[FM:${category}]`, sanitizedMessage, sanitizedData ?? '');
    }

    // Stream to remote debug if enabled
    if (this.remoteEnabled && this.onRemoteLog) {
      try {
        this.onRemoteLog(entry);
      } catch {
        // Never let remote logging break the extension
      }
    }
  }

  // ── Public API: three log levels ──────────────────────────────────────

  log(category: LogCategory, message: string, data?: Record<string, unknown>): void {
    this.write('log', category, message, data);
  }

  warn(category: LogCategory, message: string, data?: Record<string, unknown>): void {
    this.write('warn', category, message, data);
  }

  error(category: LogCategory, message: string, data?: Record<string, unknown>): void {
    this.write('error', category, message, data);
  }

  // ── Buffer access ─────────────────────────────────────────────────────

  /**
   * Return all buffered entries, optionally filtered.
   */
  getEntries(filter?: {
    level?: LogLevel;
    category?: LogCategory;
    since?: number;
    limit?: number;
  }): LogEntry[] {
    let entries = [...this.buffer];

    if (filter?.level) {
      entries = entries.filter((e) => e.level === filter.level);
    }
    if (filter?.category) {
      entries = entries.filter((e) => e.category === filter.category);
    }
    if (filter?.since) {
      entries = entries.filter((e) => e.timestamp >= filter.since!);
    }

    // Most recent first
    entries.reverse();

    if (filter?.limit) {
      entries = entries.slice(0, filter.limit);
    }

    return entries;
  }

  /**
   * Clear the buffer.
   */
  clear(): void {
    this.buffer = [];
  }

  /**
   * Get the current buffer size.
   */
  get size(): number {
    return this.buffer.length;
  }

  /**
   * Check if debug mode is currently enabled.
   */
  get isDebugEnabled(): boolean {
    return this.debugEnabled;
  }

  // ── Debug mode toggle ─────────────────────────────────────────────────

  async enableDebug(): Promise<void> {
    this.debugEnabled = true;
    await chrome.storage.local.set({ [STORAGE_KEY_DEBUG]: true });
  }

  async disableDebug(): Promise<void> {
    this.debugEnabled = false;
    await chrome.storage.local.set({ [STORAGE_KEY_DEBUG]: false });
  }

  async toggleDebug(): Promise<boolean> {
    if (this.debugEnabled) {
      await this.disableDebug();
    } else {
      await this.enableDebug();
    }
    return this.debugEnabled;
  }

  // ── Sanitization ──────────────────────────────────────────────────────

  /**
   * Deep-sanitize an object, redacting sensitive fields and values.
   */
  private sanitize(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      // Redact keys that match sensitive patterns
      if (SENSITIVE_PATTERNS.some((p) => p.test(key))) {
        result[key] = '[REDACTED]';
        continue;
      }

      if (typeof value === 'string') {
        result[key] = this.sanitizeString(value);
      } else if (Array.isArray(value)) {
        result[key] = value.map((item) =>
          typeof item === 'object' && item !== null
            ? this.sanitize(item as Record<string, unknown>)
            : typeof item === 'string'
              ? this.sanitizeString(item)
              : item
        );
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.sanitize(value as Record<string, unknown>);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Redact sensitive patterns within a string value.
   */
  private sanitizeString(str: string): string {
    let result = str;
    for (const pattern of SENSITIVE_VALUE_PATTERNS) {
      result = result.replace(pattern, '[REDACTED]');
    }
    return result;
  }
}

// ── Singleton export ──────────────────────────────────────────────────────

export const debugLogger = new DebugLogger();
export default debugLogger;
```

### Usage Examples

```typescript
import { debugLogger } from '@/shared/debug-logger';

// Initialize in service worker
await debugLogger.init('background');

// Blocking category
debugLogger.log('blocking', 'Rule created for site', {
  ruleId: 101,
  urlFilter: '||reddit.com',
});

// Timer category
debugLogger.log('timer', 'Pomodoro session started', {
  type: 'focus',
  durationMs: 25 * 60 * 1000,
  alarmName: 'focusmode_timer_end',
});

debugLogger.warn('timer', 'Timer drift detected', {
  expectedMs: 1500000,
  actualMs: 1506200,
  driftMs: 6200,
});

// Score category
debugLogger.log('score', 'Focus Score recalculated', {
  previousScore: 72,
  newScore: 78,
  factors: { sessionCompletion: 0.9, streakBonus: 0.1, consistency: 0.85 },
});

// Streak category
debugLogger.log('streak', 'Daily check completed', {
  currentStreak: 14,
  milestone: false,
  gracePeriodUsed: false,
});

// Storage category
debugLogger.log('storage', 'Blocklist saved', {
  entryCount: 8,
  bytesUsed: 1240,
  quotaRemaining: 5242880 - 1240,
});

// License category — sensitive data auto-redacted
debugLogger.log('license', 'Validation complete', {
  tier: 'pro',
  licenseKey: 'lk_live_abc123xyz', // auto-redacted in output
  expiresAt: '2026-03-15T00:00:00Z',
  cached: true,
});

// Paywall category
debugLogger.log('paywall', 'Trigger evaluated', {
  triggerId: 'T3',
  triggerName: 'blocklist_limit',
  shown: true,
  currentCount: 10,
  limit: 10,
});

// Messaging category
debugLogger.log('messaging', 'Message sent', {
  type: 'START_FOCUS_SESSION',
  from: 'popup',
  to: 'background',
  payloadSize: 128,
});

// Notifications category
debugLogger.log('notifications', 'Notification created', {
  id: 'session_complete_001',
  title: 'Focus Session Complete',
  frequencyLimitHit: false,
});

// Nuclear category
debugLogger.warn('nuclear', 'Nuclear mode activated', {
  durationMinutes: 120,
  blockedSiteCount: 8,
  tamperResistant: true,
});

// Analytics category
debugLogger.log('analytics', 'Event recorded', {
  event: 'session_completed',
  windowSize: '24h',
  totalInWindow: 3,
});

// Sync category
debugLogger.log('sync', 'Pro sync completed', {
  direction: 'pull',
  conflictsResolved: 0,
  itemsSynced: 15,
});

// Error — always outputs to console
debugLogger.error('blocking', 'Failed to update declarativeNetRequest rules', {
  errorMessage: 'Rule limit exceeded',
  currentRuleCount: 5001,
  attemptedAdd: 1,
});
```

---

## 7.2 Remote Debug Manager

**File:** `src/background/remote-debug.ts`

WebSocket-based remote debugging for live diagnostics during support sessions. Connects to a debug server, registers the session, and responds to a whitelisted set of commands.

```typescript
// src/background/remote-debug.ts

import { debugLogger, type LogEntry, type LogCategory, type LogLevel } from '@/shared/debug-logger';

/**
 * RemoteDebugManager — WebSocket-based remote debugging for Focus Mode.
 *
 * - Connects to a debug server with session registration
 * - Whitelisted command set (no arbitrary code execution)
 * - Auto-reconnect with exponential backoff (max 5 attempts)
 * - Streams live logs when connected
 * - Provides sanitized state snapshots
 */

interface RemoteCommand {
  id: string;
  type:
    | 'get_logs'
    | 'get_state'
    | 'get_storage'
    | 'get_rules'
    | 'get_timers'
    | 'reload'
    | 'ping';
  params?: Record<string, unknown>;
}

interface RemoteResponse {
  id: string;
  type: string;
  success: boolean;
  data?: unknown;
  error?: string;
}

interface FocusModeStateSnapshot {
  session: {
    active: boolean;
    type: 'focus' | 'break' | null;
    remainingMs: number;
    paused: boolean;
  };
  blocklist: {
    count: number;
    activeRulesCount: number;
  };
  focusScore: number;
  streakCount: number;
  licenseTier: 'free' | 'pro' | 'lifetime';
  nuclearMode: {
    active: boolean;
    expiresAt: number | null;
  };
  lastErrors: LogEntry[];
}

// Allowed command types — strict whitelist
const ALLOWED_COMMANDS = new Set<string>([
  'get_logs',
  'get_state',
  'get_storage',
  'get_rules',
  'get_timers',
  'reload',
  'ping',
]);

const DEBUG_SERVER_URL = 'wss://debug.focusmodeblocker.com/ws';
const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY_MS = 1_000;

class RemoteDebugManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private enabled = false;
  private sessionId: string | null = null;

  /**
   * Start remote debugging. Connects to the WebSocket server.
   */
  async start(): Promise<void> {
    this.enabled = true;
    this.reconnectAttempts = 0;

    // Register the debug logger remote handler for live streaming
    debugLogger.setRemoteHandler((entry) => this.streamLog(entry));

    await this.connect();
  }

  /**
   * Stop remote debugging. Closes the WebSocket cleanly.
   */
  stop(): void {
    this.enabled = false;
    this.reconnectAttempts = MAX_RECONNECT_ATTEMPTS; // Prevent reconnect
    debugLogger.setRemoteHandler(() => {}); // No-op handler

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Debug session ended');
      this.ws = null;
    }

    this.sessionId = null;
    debugLogger.log('analytics', 'Remote debug session ended');
  }

  /**
   * Check if currently connected.
   */
  get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  // ── Private: Connection management ────────────────────────────────────

  private async connect(): Promise<void> {
    if (!this.enabled) return;

    try {
      const manifest = chrome.runtime.getManifest();
      const extensionId = chrome.runtime.id;

      const url = `${DEBUG_SERVER_URL}?extId=${extensionId}&version=${manifest.version}`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.register();
        debugLogger.log('analytics', 'Remote debug connected', {
          server: DEBUG_SERVER_URL,
        });
      };

      this.ws.onmessage = (event: MessageEvent) => {
        this.handleMessage(event.data as string);
      };

      this.ws.onclose = (event: CloseEvent) => {
        debugLogger.warn('analytics', 'Remote debug disconnected', {
          code: event.code,
          reason: event.reason,
        });
        this.ws = null;
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        debugLogger.error('analytics', 'Remote debug WebSocket error');
        // onclose will fire after onerror, triggering reconnect
      };
    } catch (err) {
      debugLogger.error('analytics', 'Failed to create WebSocket', {
        errorMessage: err instanceof Error ? err.message : String(err),
      });
      this.scheduleReconnect();
    }
  }

  private register(): void {
    const manifest = chrome.runtime.getManifest();
    this.sessionId = `${chrome.runtime.id}-${Date.now()}`;

    this.send({
      id: 'register',
      type: 'register' as any,
      success: true,
      data: {
        sessionId: this.sessionId,
        extensionId: chrome.runtime.id,
        version: manifest.version,
        timestamp: Date.now(),
      },
    });
  }

  private scheduleReconnect(): void {
    if (!this.enabled || this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        debugLogger.warn('analytics', 'Max reconnect attempts reached, giving up');
      }
      return;
    }

    const delay = BASE_RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    debugLogger.log('analytics', 'Scheduling reconnect', {
      attempt: this.reconnectAttempts,
      delayMs: delay,
    });

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  // ── Private: Message handling ─────────────────────────────────────────

  private handleMessage(raw: string): void {
    let command: RemoteCommand;

    try {
      command = JSON.parse(raw) as RemoteCommand;
    } catch {
      debugLogger.warn('analytics', 'Invalid remote command JSON', {
        rawLength: raw.length,
      });
      return;
    }

    // Security: reject unknown commands
    if (!ALLOWED_COMMANDS.has(command.type)) {
      this.send({
        id: command.id,
        type: command.type,
        success: false,
        error: `Command not allowed: ${command.type}`,
      });
      debugLogger.warn('analytics', 'Blocked disallowed remote command', {
        type: command.type,
      });
      return;
    }

    this.executeCommand(command);
  }

  private async executeCommand(command: RemoteCommand): Promise<void> {
    try {
      let data: unknown;

      switch (command.type) {
        case 'get_logs':
          data = this.handleGetLogs(command.params);
          break;

        case 'get_state':
          data = await this.handleGetState();
          break;

        case 'get_storage':
          data = await this.handleGetStorage();
          break;

        case 'get_rules':
          data = await this.handleGetRules();
          break;

        case 'get_timers':
          data = await this.handleGetTimers();
          break;

        case 'reload':
          this.send({
            id: command.id,
            type: command.type,
            success: true,
            data: { message: 'Reloading extension...' },
          });
          // Small delay to allow the response to be sent
          setTimeout(() => chrome.runtime.reload(), 500);
          return;

        case 'ping':
          data = { pong: true, timestamp: Date.now() };
          break;

        default:
          throw new Error(`Unhandled command: ${command.type}`);
      }

      this.send({
        id: command.id,
        type: command.type,
        success: true,
        data,
      });
    } catch (err) {
      this.send({
        id: command.id,
        type: command.type,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // ── Command handlers ──────────────────────────────────────────────────

  private handleGetLogs(
    params?: Record<string, unknown>
  ): LogEntry[] {
    const filter: {
      level?: LogLevel;
      category?: LogCategory;
      since?: number;
      limit?: number;
    } = {};

    if (params?.level && typeof params.level === 'string') {
      filter.level = params.level as LogLevel;
    }
    if (params?.category && typeof params.category === 'string') {
      filter.category = params.category as LogCategory;
    }
    if (params?.since && typeof params.since === 'number') {
      filter.since = params.since as number;
    }
    filter.limit = typeof params?.limit === 'number' ? params.limit : 200;

    return debugLogger.getEntries(filter);
  }

  private async handleGetState(): Promise<FocusModeStateSnapshot> {
    const storage = await chrome.storage.local.get([
      'focusSession',
      'blocklist',
      'focusScore',
      'streak',
      'licenseTier',
      'nuclearMode',
    ]);

    const rules = await chrome.declarativeNetRequest.getDynamicRules();

    const lastErrors = debugLogger.getEntries({
      level: 'error',
      limit: 5,
    });

    const session = storage.focusSession || {};
    const nuclearMode = storage.nuclearMode || {};

    return {
      session: {
        active: session.active ?? false,
        type: session.type ?? null,
        remainingMs: session.remainingMs ?? 0,
        paused: session.paused ?? false,
      },
      blocklist: {
        count: Array.isArray(storage.blocklist) ? storage.blocklist.length : 0,
        activeRulesCount: rules.length,
      },
      focusScore: storage.focusScore ?? 0,
      streakCount: storage.streak?.count ?? 0,
      licenseTier: storage.licenseTier ?? 'free',
      nuclearMode: {
        active: nuclearMode.active ?? false,
        expiresAt: nuclearMode.expiresAt ?? null,
      },
      lastErrors,
    };
  }

  private async handleGetStorage(): Promise<Record<string, unknown>> {
    const all = await chrome.storage.local.get(null);

    // Sanitize: remove sensitive keys entirely
    const sensitiveKeys = [
      'licenseKey',
      'stripeCustomerId',
      'authToken',
      'refreshToken',
    ];
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(all)) {
      if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private async handleGetRules(): Promise<chrome.declarativeNetRequest.Rule[]> {
    return chrome.declarativeNetRequest.getDynamicRules();
  }

  private async handleGetTimers(): Promise<chrome.alarms.Alarm[]> {
    return chrome.alarms.getAll();
  }

  // ── Private: Send helpers ─────────────────────────────────────────────

  private send(response: RemoteResponse): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    try {
      this.ws.send(JSON.stringify(response));
    } catch {
      debugLogger.warn('analytics', 'Failed to send remote response');
    }
  }

  private streamLog(entry: LogEntry): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    try {
      this.ws.send(
        JSON.stringify({
          id: `log-${entry.timestamp}`,
          type: 'log_stream',
          success: true,
          data: entry,
        })
      );
    } catch {
      // Silently fail — never break the extension for remote logging
    }
  }
}

// ── Singleton export ──────────────────────────────────────────────────────

export const remoteDebugManager = new RemoteDebugManager();
export default remoteDebugManager;
```

### Integration with Service Worker

```typescript
// In src/background/service-worker.ts

import { debugLogger } from '@/shared/debug-logger';
import { remoteDebugManager } from '@/background/remote-debug';

// On startup
chrome.runtime.onInstalled.addListener(async () => {
  await debugLogger.init('background');

  // Check if remote debug was previously enabled
  const { focusmode_remote_debug } = await chrome.storage.local.get('focusmode_remote_debug');
  if (focusmode_remote_debug) {
    await remoteDebugManager.start();
  }
});

// Listen for toggle from popup/options
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'TOGGLE_REMOTE_DEBUG') {
    if (msg.enabled) {
      remoteDebugManager.start().then(() => sendResponse({ ok: true }));
    } else {
      remoteDebugManager.stop();
      sendResponse({ ok: true });
    }
    return true; // async sendResponse
  }
});
```

---

## 7.3 Support Tools & Log Export

**File:** `src/popup/support-tools.ts`

Generates debug bundles for support tickets, provides one-click log export, and renders a support UI in the Options page "About" section.

```typescript
// src/popup/support-tools.ts

import { debugLogger, type LogEntry } from '@/shared/debug-logger';

/**
 * SupportTools — Debug bundle creation, export, and support ticket generation
 * for Focus Mode - Blocker.
 *
 * - Gathers extension info, browser info, Focus Mode state, logs, perf stats
 * - All state is sanitized: no domains, no license keys, no PII
 * - Exports as downloadable JSON file
 * - Ctrl+Shift+D keyboard shortcut for quick export
 * - Renders support UI in Options page "About" section
 */

interface DebugBundle {
  generatedAt: string;
  extension: {
    id: string;
    version: string;
    name: string;
    manifestVersion: number;
  };
  browser: {
    userAgent: string;
    platform: string;
    language: string;
    screenWidth: number;
    screenHeight: number;
    devicePixelRatio: number;
    timezone: string;
  };
  focusModeState: {
    sessionActive: boolean;
    sessionType: string | null;
    paused: boolean;
    blocklistCount: number;
    activeRulesCount: number;
    focusScore: number;
    streakCount: number;
    licenseTier: string;
    nuclearModeActive: boolean;
  };
  recentLogs: LogEntry[];
  performance: {
    startupTimeMs: number | null;
    memorySamples: Array<{ timestamp: number; usedJSHeapSize: number }>;
  };
  storageUsage: {
    bytesInUse: number;
    quota: number;
    percentUsed: number;
  };
}

class SupportTools {
  private keyboardShortcutRegistered = false;

  /**
   * Create a complete debug bundle with all Focus Mode context.
   */
  async createDebugBundle(): Promise<DebugBundle> {
    const [extensionInfo, browserInfo, focusState, storageUsage, perfStats] =
      await Promise.all([
        this.getExtensionInfo(),
        this.getBrowserInfo(),
        this.getFocusModeState(),
        this.getStorageUsage(),
        this.getPerformanceStats(),
      ]);

    const recentLogs = debugLogger.getEntries({ limit: 100 });

    return {
      generatedAt: new Date().toISOString(),
      extension: extensionInfo,
      browser: browserInfo,
      focusModeState: focusState,
      recentLogs,
      performance: perfStats,
      storageUsage,
    };
  }

  /**
   * Export the debug bundle as a downloadable JSON file.
   */
  async exportDebugBundle(): Promise<void> {
    const bundle = await this.createDebugBundle();
    const json = JSON.stringify(bundle, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `focusmode-debug-${timestamp}.json`;

    // Create and click a download link
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 1000);

    debugLogger.log('analytics', 'Debug bundle exported', { filename });
  }

  /**
   * Generate a support ticket payload (user description + debug bundle).
   */
  async createSupportTicket(
    userDescription: string
  ): Promise<{ description: string; bundle: DebugBundle }> {
    const bundle = await this.createDebugBundle();

    return {
      description: userDescription.trim(),
      bundle,
    };
  }

  /**
   * Register Ctrl+Shift+D keyboard shortcut for quick export.
   * Call once in popup or options page initialization.
   */
  registerKeyboardShortcut(): void {
    if (this.keyboardShortcutRegistered) return;

    document.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        this.exportDebugBundle();
      }
    });

    this.keyboardShortcutRegistered = true;
  }

  // ── Private: Data gatherers ───────────────────────────────────────────

  private async getExtensionInfo(): Promise<DebugBundle['extension']> {
    const manifest = chrome.runtime.getManifest();
    return {
      id: chrome.runtime.id,
      version: manifest.version,
      name: manifest.name ?? 'Focus Mode - Blocker',
      manifestVersion: manifest.manifest_version,
    };
  }

  private async getBrowserInfo(): Promise<DebugBundle['browser']> {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenWidth: screen.width,
      screenHeight: screen.height,
      devicePixelRatio: window.devicePixelRatio,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  private async getFocusModeState(): Promise<DebugBundle['focusModeState']> {
    try {
      const storage = await chrome.storage.local.get([
        'focusSession',
        'blocklist',
        'focusScore',
        'streak',
        'licenseTier',
        'nuclearMode',
      ]);

      // Get active rules count via message to background
      let activeRulesCount = 0;
      try {
        const response = await chrome.runtime.sendMessage({
          type: 'GET_ACTIVE_RULES_COUNT',
        });
        activeRulesCount = response?.count ?? 0;
      } catch {
        // Background may not be running
      }

      const session = storage.focusSession || {};
      const nuclearMode = storage.nuclearMode || {};

      return {
        sessionActive: session.active ?? false,
        sessionType: session.type ?? null,
        paused: session.paused ?? false,
        blocklistCount: Array.isArray(storage.blocklist)
          ? storage.blocklist.length
          : 0,
        activeRulesCount,
        focusScore: storage.focusScore ?? 0,
        streakCount: storage.streak?.count ?? 0,
        licenseTier: storage.licenseTier ?? 'free',
        nuclearModeActive: nuclearMode.active ?? false,
      };
    } catch {
      return {
        sessionActive: false,
        sessionType: null,
        paused: false,
        blocklistCount: 0,
        activeRulesCount: 0,
        focusScore: 0,
        streakCount: 0,
        licenseTier: 'free',
        nuclearModeActive: false,
      };
    }
  }

  private async getStorageUsage(): Promise<DebugBundle['storageUsage']> {
    try {
      const bytesInUse = await chrome.storage.local.getBytesInUse(null);
      const quota = chrome.storage.local.QUOTA_BYTES ?? 10_485_760; // 10 MB default
      return {
        bytesInUse,
        quota,
        percentUsed: Number(((bytesInUse / quota) * 100).toFixed(2)),
      };
    } catch {
      return { bytesInUse: 0, quota: 10_485_760, percentUsed: 0 };
    }
  }

  private async getPerformanceStats(): Promise<DebugBundle['performance']> {
    let startupTimeMs: number | null = null;
    let memorySamples: Array<{ timestamp: number; usedJSHeapSize: number }> = [];

    try {
      const storage = await chrome.storage.local.get([
        'focusmode_startup_time',
        'focusmode_memory_samples',
      ]);
      startupTimeMs = storage.focusmode_startup_time ?? null;
      memorySamples = Array.isArray(storage.focusmode_memory_samples)
        ? storage.focusmode_memory_samples.slice(-10) // Last 10 samples
        : [];
    } catch {
      // Unavailable
    }

    return { startupTimeMs, memorySamples };
  }
}

// ── Singleton export ──────────────────────────────────────────────────────

export const supportTools = new SupportTools();
export default supportTools;
```

### Support UI Component for Options Page

```typescript
// src/popup/support-ui.ts

import { supportTools } from '@/popup/support-tools';
import { debugLogger } from '@/shared/debug-logger';

/**
 * SupportUI — Renders the support tools section in the Options page "About" tab.
 *
 * Components:
 * - "Export Debug Logs" button
 * - "Enable Debug Mode" toggle
 * - "Report an Issue" textarea + submit
 * - Privacy notice
 */

export class SupportUI {
  private container: HTMLElement;
  private issueTextarea: HTMLTextAreaElement | null = null;
  private submitButton: HTMLButtonElement | null = null;
  private debugToggle: HTMLInputElement | null = null;
  private statusMessage: HTMLElement | null = null;

  constructor(containerSelector: string) {
    const el = document.querySelector(containerSelector);
    if (!el) {
      throw new Error(`SupportUI container not found: ${containerSelector}`);
    }
    this.container = el as HTMLElement;
  }

  /**
   * Render the full support UI into the container.
   */
  async render(): Promise<void> {
    const isDebugEnabled = debugLogger.isDebugEnabled;

    this.container.innerHTML = `
      <div class="support-tools" style="padding: 16px 0;">
        <h3 style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #1a1a2e;">
          Support & Diagnostics
        </h3>

        <!-- Export Button -->
        <div style="margin-bottom: 16px;">
          <button id="support-export-btn"
            style="
              display: inline-flex; align-items: center; gap: 8px;
              padding: 10px 20px; border: 1px solid #e0e0e0; border-radius: 8px;
              background: #f8f9fa; color: #1a1a2e; font-size: 14px;
              cursor: pointer; transition: background 0.2s;
            ">
            Export Debug Logs
          </button>
          <span style="margin-left: 8px; font-size: 12px; color: #888;">
            Ctrl+Shift+D
          </span>
        </div>

        <!-- Debug Mode Toggle -->
        <div style="margin-bottom: 16px; display: flex; align-items: center; gap: 12px;">
          <label style="font-size: 14px; color: #1a1a2e; cursor: pointer;"
                 for="support-debug-toggle">
            Enable Debug Mode
          </label>
          <input type="checkbox" id="support-debug-toggle"
            ${isDebugEnabled ? 'checked' : ''}
            style="
              width: 18px; height: 18px; cursor: pointer;
              accent-color: #6c5ce7;
            " />
        </div>

        <!-- Report an Issue -->
        <div style="margin-bottom: 12px;">
          <label style="display: block; font-size: 14px; font-weight: 500;
                        color: #1a1a2e; margin-bottom: 8px;"
                 for="support-issue-text">
            Report an Issue
          </label>
          <textarea id="support-issue-text"
            placeholder="Describe what happened, what you expected, and any steps to reproduce..."
            rows="4"
            style="
              width: 100%; padding: 10px 12px; border: 1px solid #e0e0e0;
              border-radius: 8px; font-size: 14px; font-family: inherit;
              resize: vertical; box-sizing: border-box;
            "></textarea>
        </div>

        <button id="support-submit-btn"
          style="
            padding: 10px 20px; border: none; border-radius: 8px;
            background: #6c5ce7; color: white; font-size: 14px;
            cursor: pointer; transition: background 0.2s;
          ">
          Submit Report
        </button>

        <!-- Status -->
        <div id="support-status" style="margin-top: 12px; font-size: 13px; color: #27ae60;
                                         display: none;"></div>

        <!-- Privacy Note -->
        <p style="margin-top: 16px; font-size: 12px; color: #999; line-height: 1.5;">
          Debug logs never contain personal data, passwords, or browsing history.
          Only extension state and anonymized diagnostic information is included.
        </p>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    // Export button
    const exportBtn = document.getElementById('support-export-btn');
    exportBtn?.addEventListener('click', async () => {
      exportBtn.textContent = 'Exporting...';
      (exportBtn as HTMLButtonElement).disabled = true;
      try {
        await supportTools.exportDebugBundle();
        this.showStatus('Debug bundle downloaded successfully.');
      } catch (err) {
        this.showStatus('Failed to export. Please try again.', true);
      } finally {
        exportBtn.textContent = 'Export Debug Logs';
        (exportBtn as HTMLButtonElement).disabled = false;
      }
    });

    // Debug toggle
    this.debugToggle = document.getElementById(
      'support-debug-toggle'
    ) as HTMLInputElement;
    this.debugToggle?.addEventListener('change', async () => {
      const enabled = this.debugToggle!.checked;
      if (enabled) {
        await debugLogger.enableDebug();
        this.showStatus('Debug mode enabled. Detailed logs will appear in the console.');
      } else {
        await debugLogger.disableDebug();
        this.showStatus('Debug mode disabled.');
      }
    });

    // Issue textarea
    this.issueTextarea = document.getElementById(
      'support-issue-text'
    ) as HTMLTextAreaElement;

    // Submit button
    this.submitButton = document.getElementById(
      'support-submit-btn'
    ) as HTMLButtonElement;
    this.submitButton?.addEventListener('click', () => this.handleSubmit());

    // Status element
    this.statusMessage = document.getElementById('support-status');
  }

  private async handleSubmit(): Promise<void> {
    const description = this.issueTextarea?.value?.trim();
    if (!description) {
      this.showStatus('Please describe the issue before submitting.', true);
      return;
    }

    if (this.submitButton) {
      this.submitButton.textContent = 'Submitting...';
      this.submitButton.disabled = true;
    }

    try {
      const ticket = await supportTools.createSupportTicket(description);

      // Send ticket to background for submission to support endpoint
      await chrome.runtime.sendMessage({
        type: 'SUBMIT_SUPPORT_TICKET',
        payload: ticket,
      });

      if (this.issueTextarea) {
        this.issueTextarea.value = '';
      }
      this.showStatus('Report submitted. Thank you for helping us improve Focus Mode!');
    } catch (err) {
      this.showStatus(
        'Failed to submit report. Your debug bundle has been downloaded instead.',
        true
      );
      // Fallback: download the bundle so the user has it
      await supportTools.exportDebugBundle();
    } finally {
      if (this.submitButton) {
        this.submitButton.textContent = 'Submit Report';
        this.submitButton.disabled = false;
      }
    }
  }

  private showStatus(message: string, isError = false): void {
    if (!this.statusMessage) return;
    this.statusMessage.textContent = message;
    this.statusMessage.style.color = isError ? '#e74c3c' : '#27ae60';
    this.statusMessage.style.display = 'block';

    setTimeout(() => {
      if (this.statusMessage) {
        this.statusMessage.style.display = 'none';
      }
    }, 5000);
  }
}
```

---

## 7.4 Focus Mode Debug Panel

Hidden debug panel in the Options page, accessible by clicking the version number 5 times. Provides live log viewing, storage inspection, rule and alarm listing, performance metrics, message bus monitoring, Focus Score testing, and manual error triggering.

```typescript
// src/popup/debug-panel.ts

import { debugLogger, type LogCategory, type LogLevel, type LogEntry } from '@/shared/debug-logger';

/**
 * DebugPanel — Hidden diagnostic panel for Focus Mode - Blocker.
 *
 * Activation: click the version number in Options page 5 times.
 *
 * Features:
 * - Live log viewer with category/level filters
 * - Storage inspector (sanitized)
 * - Active declarativeNetRequest rules viewer
 * - Active alarms viewer
 * - Performance metrics display
 * - Message bus monitor (recent inter-context messages)
 * - Focus Score calculator tester
 * - Manual error trigger for testing the monitoring pipeline
 */

const ACTIVATION_CLICKS = 5;
const ACTIVATION_TIMEOUT_MS = 3_000;

const LOG_CATEGORIES: LogCategory[] = [
  'blocking', 'timer', 'score', 'streak', 'storage', 'license',
  'paywall', 'messaging', 'notifications', 'nuclear', 'analytics', 'sync',
];

const LOG_LEVELS: LogLevel[] = ['log', 'warn', 'error'];

export class DebugPanel {
  private panel: HTMLElement | null = null;
  private clickCount = 0;
  private clickTimer: ReturnType<typeof setTimeout> | null = null;
  private refreshInterval: ReturnType<typeof setInterval> | null = null;
  private isVisible = false;
  private selectedCategory: LogCategory | 'all' = 'all';
  private selectedLevel: LogLevel | 'all' = 'all';

  /**
   * Attach to the version number element to listen for activation gesture.
   */
  attachToVersionElement(selector: string): void {
    const versionEl = document.querySelector(selector);
    if (!versionEl) return;

    versionEl.addEventListener('click', () => {
      this.clickCount++;

      if (this.clickTimer) {
        clearTimeout(this.clickTimer);
      }

      if (this.clickCount >= ACTIVATION_CLICKS) {
        this.clickCount = 0;
        this.toggle();
        return;
      }

      this.clickTimer = setTimeout(() => {
        this.clickCount = 0;
      }, ACTIVATION_TIMEOUT_MS);
    });
  }

  /**
   * Toggle panel visibility.
   */
  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Show the debug panel.
   */
  show(): void {
    if (this.panel) {
      this.panel.style.display = 'block';
      this.isVisible = true;
      this.refreshAll();
      this.startAutoRefresh();
      return;
    }

    this.createPanel();
    this.isVisible = true;
    this.refreshAll();
    this.startAutoRefresh();
  }

  /**
   * Hide the debug panel.
   */
  hide(): void {
    if (this.panel) {
      this.panel.style.display = 'none';
    }
    this.isVisible = false;
    this.stopAutoRefresh();
  }

  /**
   * Destroy the panel and clean up.
   */
  destroy(): void {
    this.stopAutoRefresh();
    if (this.panel) {
      this.panel.remove();
      this.panel = null;
    }
    this.isVisible = false;
  }

  // ── Private: Panel creation ───────────────────────────────────────────

  private createPanel(): void {
    this.panel = document.createElement('div');
    this.panel.id = 'focusmode-debug-panel';
    this.panel.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: #0d1117; color: #c9d1d9; font-family: 'SF Mono', Menlo, monospace;
      font-size: 12px; z-index: 999999; overflow: hidden;
      display: flex; flex-direction: column;
    `;

    this.panel.innerHTML = `
      <!-- Header -->
      <div style="
        display: flex; align-items: center; justify-content: space-between;
        padding: 12px 16px; background: #161b22; border-bottom: 1px solid #30363d;
        flex-shrink: 0;
      ">
        <span style="font-weight: 700; font-size: 14px; color: #58a6ff;">
          Focus Mode Debug Panel
        </span>
        <button id="debug-panel-close" style="
          background: none; border: 1px solid #30363d; color: #c9d1d9;
          padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;
        ">Close</button>
      </div>

      <!-- Tab Bar -->
      <div id="debug-tabs" style="
        display: flex; gap: 0; background: #161b22;
        border-bottom: 1px solid #30363d; flex-shrink: 0; overflow-x: auto;
      ">
        <button class="debug-tab active" data-tab="logs"
          style="padding: 8px 16px; background: #0d1117; border: none;
                 border-bottom: 2px solid #58a6ff; color: #58a6ff;
                 cursor: pointer; font-size: 12px; font-family: inherit;
                 white-space: nowrap;">
          Logs
        </button>
        <button class="debug-tab" data-tab="storage"
          style="padding: 8px 16px; background: none; border: none;
                 border-bottom: 2px solid transparent; color: #8b949e;
                 cursor: pointer; font-size: 12px; font-family: inherit;
                 white-space: nowrap;">
          Storage
        </button>
        <button class="debug-tab" data-tab="rules"
          style="padding: 8px 16px; background: none; border: none;
                 border-bottom: 2px solid transparent; color: #8b949e;
                 cursor: pointer; font-size: 12px; font-family: inherit;
                 white-space: nowrap;">
          Rules
        </button>
        <button class="debug-tab" data-tab="alarms"
          style="padding: 8px 16px; background: none; border: none;
                 border-bottom: 2px solid transparent; color: #8b949e;
                 cursor: pointer; font-size: 12px; font-family: inherit;
                 white-space: nowrap;">
          Alarms
        </button>
        <button class="debug-tab" data-tab="perf"
          style="padding: 8px 16px; background: none; border: none;
                 border-bottom: 2px solid transparent; color: #8b949e;
                 cursor: pointer; font-size: 12px; font-family: inherit;
                 white-space: nowrap;">
          Performance
        </button>
        <button class="debug-tab" data-tab="messages"
          style="padding: 8px 16px; background: none; border: none;
                 border-bottom: 2px solid transparent; color: #8b949e;
                 cursor: pointer; font-size: 12px; font-family: inherit;
                 white-space: nowrap;">
          Messages
        </button>
        <button class="debug-tab" data-tab="score"
          style="padding: 8px 16px; background: none; border: none;
                 border-bottom: 2px solid transparent; color: #8b949e;
                 cursor: pointer; font-size: 12px; font-family: inherit;
                 white-space: nowrap;">
          Score Tester
        </button>
        <button class="debug-tab" data-tab="trigger"
          style="padding: 8px 16px; background: none; border: none;
                 border-bottom: 2px solid transparent; color: #8b949e;
                 cursor: pointer; font-size: 12px; font-family: inherit;
                 white-space: nowrap;">
          Error Trigger
        </button>
      </div>

      <!-- Tab Content -->
      <div id="debug-content" style="flex: 1; overflow-y: auto; padding: 16px;">
        <!-- Populated dynamically -->
      </div>
    `;

    document.body.appendChild(this.panel);
    this.bindPanelEvents();
  }

  private bindPanelEvents(): void {
    // Close button
    document.getElementById('debug-panel-close')?.addEventListener('click', () => {
      this.hide();
    });

    // Escape key
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });

    // Tab switching
    document.getElementById('debug-tabs')?.addEventListener('click', (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target.classList.contains('debug-tab')) return;

      const tab = target.dataset.tab;
      if (!tab) return;

      // Update active tab styling
      document.querySelectorAll('.debug-tab').forEach((t) => {
        (t as HTMLElement).style.borderBottomColor = 'transparent';
        (t as HTMLElement).style.color = '#8b949e';
        (t as HTMLElement).style.background = 'none';
        t.classList.remove('active');
      });
      target.style.borderBottomColor = '#58a6ff';
      target.style.color = '#58a6ff';
      target.style.background = '#0d1117';
      target.classList.add('active');

      this.renderTab(tab);
    });
  }

  // ── Tab rendering ─────────────────────────────────────────────────────

  private renderTab(tab: string): void {
    const content = document.getElementById('debug-content');
    if (!content) return;

    switch (tab) {
      case 'logs':
        this.renderLogsTab(content);
        break;
      case 'storage':
        this.renderStorageTab(content);
        break;
      case 'rules':
        this.renderRulesTab(content);
        break;
      case 'alarms':
        this.renderAlarmsTab(content);
        break;
      case 'perf':
        this.renderPerfTab(content);
        break;
      case 'messages':
        this.renderMessagesTab(content);
        break;
      case 'score':
        this.renderScoreTab(content);
        break;
      case 'trigger':
        this.renderTriggerTab(content);
        break;
    }
  }

  // ── Logs Tab ──────────────────────────────────────────────────────────

  private renderLogsTab(container: HTMLElement): void {
    const entries = this.getFilteredLogs();

    const categoryOptions = ['all', ...LOG_CATEGORIES]
      .map(
        (c) =>
          `<option value="${c}" ${c === this.selectedCategory ? 'selected' : ''}>${c}</option>`
      )
      .join('');

    const levelOptions = ['all', ...LOG_LEVELS]
      .map(
        (l) =>
          `<option value="${l}" ${l === this.selectedLevel ? 'selected' : ''}>${l}</option>`
      )
      .join('');

    container.innerHTML = `
      <div style="display: flex; gap: 12px; margin-bottom: 12px; align-items: center;">
        <label style="color: #8b949e;">Category:</label>
        <select id="debug-log-category" style="
          background: #161b22; color: #c9d1d9; border: 1px solid #30363d;
          border-radius: 4px; padding: 4px 8px; font-family: inherit;
        ">${categoryOptions}</select>

        <label style="color: #8b949e;">Level:</label>
        <select id="debug-log-level" style="
          background: #161b22; color: #c9d1d9; border: 1px solid #30363d;
          border-radius: 4px; padding: 4px 8px; font-family: inherit;
        ">${levelOptions}</select>

        <button id="debug-log-clear" style="
          background: #da3633; color: white; border: none; border-radius: 4px;
          padding: 4px 12px; cursor: pointer; font-size: 12px; margin-left: auto;
        ">Clear</button>

        <span style="color: #8b949e;">${entries.length} entries</span>
      </div>

      <div id="debug-log-entries" style="font-size: 11px; line-height: 1.6;">
        ${entries.length === 0 ? '<div style="color: #484f58;">No log entries.</div>' : ''}
        ${entries
          .map((e) => {
            const time = new Date(e.timestamp).toLocaleTimeString('en-US', {
              hour12: false,
              fractionalSecondDigits: 3,
            } as Intl.DateTimeFormatOptions);
            const levelColor =
              e.level === 'error'
                ? '#f85149'
                : e.level === 'warn'
                  ? '#d29922'
                  : '#8b949e';
            const dataStr = e.data ? ` ${JSON.stringify(e.data)}` : '';
            return `<div style="
              padding: 2px 0; border-bottom: 1px solid #21262d;
              word-break: break-all;
            ">
              <span style="color: #484f58;">${time}</span>
              <span style="color: ${levelColor}; font-weight: 600;
                           text-transform: uppercase; margin: 0 4px;">
                ${e.level}
              </span>
              <span style="color: #58a6ff;">[${e.category}]</span>
              <span style="color: #c9d1d9;">${this.escapeHtml(e.message)}</span>
              ${dataStr ? `<span style="color: #7ee787;">${this.escapeHtml(dataStr)}</span>` : ''}
            </div>`;
          })
          .join('')}
      </div>
    `;

    // Bind filter events
    document.getElementById('debug-log-category')?.addEventListener('change', (e) => {
      this.selectedCategory = (e.target as HTMLSelectElement).value as LogCategory | 'all';
      this.renderLogsTab(container);
    });

    document.getElementById('debug-log-level')?.addEventListener('change', (e) => {
      this.selectedLevel = (e.target as HTMLSelectElement).value as LogLevel | 'all';
      this.renderLogsTab(container);
    });

    document.getElementById('debug-log-clear')?.addEventListener('click', () => {
      debugLogger.clear();
      this.renderLogsTab(container);
    });
  }

  private getFilteredLogs(): LogEntry[] {
    const filter: { level?: LogLevel; category?: LogCategory; limit?: number } = {
      limit: 500,
    };
    if (this.selectedCategory !== 'all') {
      filter.category = this.selectedCategory;
    }
    if (this.selectedLevel !== 'all') {
      filter.level = this.selectedLevel;
    }
    return debugLogger.getEntries(filter);
  }

  // ── Storage Tab ───────────────────────────────────────────────────────

  private async renderStorageTab(container: HTMLElement): Promise<void> {
    container.innerHTML = '<div style="color: #8b949e;">Loading storage...</div>';

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'DEBUG_GET_STORAGE',
      });

      const storage = response?.data ?? {};
      const formatted = JSON.stringify(storage, null, 2);

      container.innerHTML = `
        <div style="margin-bottom: 8px; color: #8b949e;">
          Sanitized chrome.storage.local contents:
        </div>
        <pre style="
          background: #161b22; padding: 12px; border-radius: 6px;
          border: 1px solid #30363d; overflow: auto; max-height: calc(100vh - 200px);
          white-space: pre-wrap; word-break: break-all;
        ">${this.escapeHtml(formatted)}</pre>
      `;
    } catch (err) {
      container.innerHTML = `<div style="color: #f85149;">
        Failed to load storage: ${err instanceof Error ? err.message : String(err)}
      </div>`;
    }
  }

  // ── Rules Tab ─────────────────────────────────────────────────────────

  private async renderRulesTab(container: HTMLElement): Promise<void> {
    container.innerHTML = '<div style="color: #8b949e;">Loading rules...</div>';

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'DEBUG_GET_RULES',
      });

      const rules: chrome.declarativeNetRequest.Rule[] = response?.data ?? [];

      if (rules.length === 0) {
        container.innerHTML = '<div style="color: #484f58;">No active rules.</div>';
        return;
      }

      container.innerHTML = `
        <div style="margin-bottom: 8px; color: #8b949e;">
          ${rules.length} active declarativeNetRequest rule(s):
        </div>
        ${rules
          .map(
            (rule) => `
          <div style="
            background: #161b22; padding: 10px 12px; border-radius: 6px;
            border: 1px solid #30363d; margin-bottom: 8px;
          ">
            <div><span style="color: #8b949e;">ID:</span> <span style="color: #d2a8ff;">${rule.id}</span></div>
            <div><span style="color: #8b949e;">Priority:</span> ${rule.priority}</div>
            <div><span style="color: #8b949e;">Action:</span> <span style="color: #f85149;">${rule.action.type}</span></div>
            <div><span style="color: #8b949e;">Condition:</span>
              <pre style="margin: 4px 0 0; color: #7ee787; font-size: 11px;">${this.escapeHtml(JSON.stringify(rule.condition, null, 2))}</pre>
            </div>
          </div>
        `
          )
          .join('')}
      `;
    } catch (err) {
      container.innerHTML = `<div style="color: #f85149;">
        Failed to load rules: ${err instanceof Error ? err.message : String(err)}
      </div>`;
    }
  }

  // ── Alarms Tab ────────────────────────────────────────────────────────

  private async renderAlarmsTab(container: HTMLElement): Promise<void> {
    container.innerHTML = '<div style="color: #8b949e;">Loading alarms...</div>';

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'DEBUG_GET_ALARMS',
      });

      const alarms: chrome.alarms.Alarm[] = response?.data ?? [];

      if (alarms.length === 0) {
        container.innerHTML = '<div style="color: #484f58;">No active alarms.</div>';
        return;
      }

      container.innerHTML = `
        <div style="margin-bottom: 8px; color: #8b949e;">
          ${alarms.length} active alarm(s):
        </div>
        ${alarms
          .map((alarm) => {
            const scheduledTime = new Date(alarm.scheduledTime).toLocaleString();
            const period = alarm.periodInMinutes
              ? `${alarm.periodInMinutes} min`
              : 'one-shot';
            return `
            <div style="
              background: #161b22; padding: 10px 12px; border-radius: 6px;
              border: 1px solid #30363d; margin-bottom: 8px;
            ">
              <div><span style="color: #8b949e;">Name:</span> <span style="color: #d2a8ff;">${this.escapeHtml(alarm.name)}</span></div>
              <div><span style="color: #8b949e;">Scheduled:</span> ${scheduledTime}</div>
              <div><span style="color: #8b949e;">Period:</span> ${period}</div>
            </div>
          `;
          })
          .join('')}
      `;
    } catch (err) {
      container.innerHTML = `<div style="color: #f85149;">
        Failed to load alarms: ${err instanceof Error ? err.message : String(err)}
      </div>`;
    }
  }

  // ── Performance Tab ───────────────────────────────────────────────────

  private async renderPerfTab(container: HTMLElement): Promise<void> {
    container.innerHTML = '<div style="color: #8b949e;">Loading performance data...</div>';

    try {
      const storage = await chrome.storage.local.get([
        'focusmode_startup_time',
        'focusmode_memory_samples',
        'focusmode_perf_metrics',
      ]);

      const startupTime = storage.focusmode_startup_time ?? 'N/A';
      const memorySamples: Array<{ timestamp: number; usedJSHeapSize: number }> =
        storage.focusmode_memory_samples ?? [];
      const perfMetrics = storage.focusmode_perf_metrics ?? {};

      const latestMemory = memorySamples.length > 0
        ? `${(memorySamples[memorySamples.length - 1].usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`
        : 'N/A';

      container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px;">
          <div style="background: #161b22; padding: 12px; border-radius: 6px; border: 1px solid #30363d;">
            <div style="color: #8b949e; margin-bottom: 4px;">Startup Time</div>
            <div style="font-size: 24px; font-weight: 700; color: #58a6ff;">
              ${typeof startupTime === 'number' ? `${startupTime}ms` : startupTime}
            </div>
          </div>

          <div style="background: #161b22; padding: 12px; border-radius: 6px; border: 1px solid #30363d;">
            <div style="color: #8b949e; margin-bottom: 4px;">JS Heap (Latest)</div>
            <div style="font-size: 24px; font-weight: 700; color: #7ee787;">
              ${latestMemory}
            </div>
          </div>

          <div style="background: #161b22; padding: 12px; border-radius: 6px; border: 1px solid #30363d;">
            <div style="color: #8b949e; margin-bottom: 4px;">Memory Samples</div>
            <div style="font-size: 24px; font-weight: 700; color: #d2a8ff;">
              ${memorySamples.length}
            </div>
          </div>

          <div style="background: #161b22; padding: 12px; border-radius: 6px; border: 1px solid #30363d;">
            <div style="color: #8b949e; margin-bottom: 4px;">Log Buffer</div>
            <div style="font-size: 24px; font-weight: 700; color: #d29922;">
              ${debugLogger.size} / 1000
            </div>
          </div>
        </div>

        ${Object.keys(perfMetrics).length > 0 ? `
          <div style="margin-top: 16px;">
            <div style="color: #8b949e; margin-bottom: 8px;">Additional Metrics:</div>
            <pre style="
              background: #161b22; padding: 12px; border-radius: 6px;
              border: 1px solid #30363d; overflow: auto;
              white-space: pre-wrap; word-break: break-all;
            ">${this.escapeHtml(JSON.stringify(perfMetrics, null, 2))}</pre>
          </div>
        ` : ''}

        ${memorySamples.length > 0 ? `
          <div style="margin-top: 16px;">
            <div style="color: #8b949e; margin-bottom: 8px;">Memory Trend (last ${memorySamples.length} samples):</div>
            <div style="display: flex; align-items: flex-end; gap: 2px; height: 80px; background: #161b22;
                        padding: 8px; border-radius: 6px; border: 1px solid #30363d;">
              ${this.renderMemoryBars(memorySamples)}
            </div>
          </div>
        ` : ''}
      `;
    } catch (err) {
      container.innerHTML = `<div style="color: #f85149;">
        Failed to load performance data: ${err instanceof Error ? err.message : String(err)}
      </div>`;
    }
  }

  private renderMemoryBars(
    samples: Array<{ timestamp: number; usedJSHeapSize: number }>
  ): string {
    const maxMem = Math.max(...samples.map((s) => s.usedJSHeapSize));
    if (maxMem === 0) return '';

    return samples
      .slice(-50) // Show last 50 samples
      .map((s) => {
        const heightPct = (s.usedJSHeapSize / maxMem) * 100;
        return `<div style="
          flex: 1; min-width: 3px; background: #238636;
          height: ${heightPct}%; border-radius: 1px;
        " title="${(s.usedJSHeapSize / 1024 / 1024).toFixed(1)} MB"></div>`;
      })
      .join('');
  }

  // ── Messages Tab ──────────────────────────────────────────────────────

  private renderMessagesTab(container: HTMLElement): void {
    const messageEntries = debugLogger.getEntries({
      category: 'messaging',
      limit: 100,
    });

    container.innerHTML = `
      <div style="margin-bottom: 8px; color: #8b949e;">
        Recent inter-context messages (${messageEntries.length} entries):
      </div>
      ${messageEntries.length === 0
        ? '<div style="color: #484f58;">No messages recorded. Enable debug mode to capture messages.</div>'
        : ''}
      ${messageEntries
        .map((e) => {
          const time = new Date(e.timestamp).toLocaleTimeString('en-US', {
            hour12: false,
            fractionalSecondDigits: 3,
          } as Intl.DateTimeFormatOptions);
          const msgType = (e.data?.type as string) ?? 'unknown';
          const from = (e.data?.from as string) ?? '?';
          const to = (e.data?.to as string) ?? '?';
          return `<div style="
            padding: 6px 8px; border-bottom: 1px solid #21262d;
            display: flex; gap: 12px; align-items: center;
          ">
            <span style="color: #484f58; flex-shrink: 0;">${time}</span>
            <span style="color: #d2a8ff; font-weight: 600; flex-shrink: 0;
                         min-width: 200px;">${this.escapeHtml(msgType)}</span>
            <span style="color: #8b949e;">${this.escapeHtml(from)} -> ${this.escapeHtml(to)}</span>
          </div>`;
        })
        .join('')}
    `;
  }

  // ── Score Tester Tab ──────────────────────────────────────────────────

  private renderScoreTab(container: HTMLElement): void {
    container.innerHTML = `
      <div style="margin-bottom: 12px; color: #8b949e;">
        Test Focus Score calculations with custom inputs:
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; max-width: 500px;">
        <div>
          <label style="color: #8b949e; font-size: 11px;">Sessions Completed Today</label>
          <input id="score-sessions" type="number" value="3" min="0" max="50"
            style="width: 100%; padding: 6px 8px; background: #161b22; color: #c9d1d9;
                   border: 1px solid #30363d; border-radius: 4px; font-family: inherit;
                   box-sizing: border-box;" />
        </div>
        <div>
          <label style="color: #8b949e; font-size: 11px;">Sessions Abandoned</label>
          <input id="score-abandoned" type="number" value="0" min="0" max="50"
            style="width: 100%; padding: 6px 8px; background: #161b22; color: #c9d1d9;
                   border: 1px solid #30363d; border-radius: 4px; font-family: inherit;
                   box-sizing: border-box;" />
        </div>
        <div>
          <label style="color: #8b949e; font-size: 11px;">Current Streak (days)</label>
          <input id="score-streak" type="number" value="7" min="0" max="365"
            style="width: 100%; padding: 6px 8px; background: #161b22; color: #c9d1d9;
                   border: 1px solid #30363d; border-radius: 4px; font-family: inherit;
                   box-sizing: border-box;" />
        </div>
        <div>
          <label style="color: #8b949e; font-size: 11px;">Block Attempts Resisted</label>
          <input id="score-resisted" type="number" value="5" min="0" max="200"
            style="width: 100%; padding: 6px 8px; background: #161b22; color: #c9d1d9;
                   border: 1px solid #30363d; border-radius: 4px; font-family: inherit;
                   box-sizing: border-box;" />
        </div>
        <div>
          <label style="color: #8b949e; font-size: 11px;">Focus Minutes Today</label>
          <input id="score-minutes" type="number" value="75" min="0" max="1440"
            style="width: 100%; padding: 6px 8px; background: #161b22; color: #c9d1d9;
                   border: 1px solid #30363d; border-radius: 4px; font-family: inherit;
                   box-sizing: border-box;" />
        </div>
        <div>
          <label style="color: #8b949e; font-size: 11px;">Days Active (last 7)</label>
          <input id="score-active-days" type="number" value="5" min="0" max="7"
            style="width: 100%; padding: 6px 8px; background: #161b22; color: #c9d1d9;
                   border: 1px solid #30363d; border-radius: 4px; font-family: inherit;
                   box-sizing: border-box;" />
        </div>
      </div>

      <button id="score-calculate" style="
        margin-top: 12px; padding: 8px 20px; background: #238636; color: white;
        border: none; border-radius: 4px; cursor: pointer; font-size: 12px;
      ">Calculate Score</button>

      <div id="score-result" style="
        margin-top: 16px; padding: 16px; background: #161b22;
        border: 1px solid #30363d; border-radius: 6px; display: none;
      "></div>
    `;

    document.getElementById('score-calculate')?.addEventListener('click', () => {
      this.calculateTestScore();
    });
  }

  private calculateTestScore(): void {
    const getValue = (id: string): number =>
      Number((document.getElementById(id) as HTMLInputElement)?.value ?? 0);

    const sessionsCompleted = getValue('score-sessions');
    const sessionsAbandoned = getValue('score-abandoned');
    const streak = getValue('score-streak');
    const resistedAttempts = getValue('score-resisted');
    const focusMinutes = getValue('score-minutes');
    const activeDays = getValue('score-active-days');

    // Focus Score formula (0-100)
    const totalSessions = sessionsCompleted + sessionsAbandoned;
    const completionRate = totalSessions > 0 ? sessionsCompleted / totalSessions : 0;
    const streakBonus = Math.min(streak / 30, 1); // Max bonus at 30-day streak
    const consistencyFactor = activeDays / 7;
    const focusTimeFactor = Math.min(focusMinutes / 120, 1); // Max at 2 hours
    const resistanceFactor = Math.min(resistedAttempts / 20, 1); // Max at 20 resisted

    // Weighted calculation
    const weights = {
      completion: 0.30,
      streak: 0.15,
      consistency: 0.20,
      focusTime: 0.25,
      resistance: 0.10,
    };

    const rawScore =
      completionRate * weights.completion +
      streakBonus * weights.streak +
      consistencyFactor * weights.consistency +
      focusTimeFactor * weights.focusTime +
      resistanceFactor * weights.resistance;

    const finalScore = Math.round(rawScore * 100);

    const resultEl = document.getElementById('score-result');
    if (!resultEl) return;

    resultEl.style.display = 'block';
    resultEl.innerHTML = `
      <div style="font-size: 36px; font-weight: 700; color: ${
        finalScore >= 80 ? '#238636' : finalScore >= 50 ? '#d29922' : '#f85149'
      }; margin-bottom: 12px;">
        ${finalScore} / 100
      </div>
      <div style="display: grid; gap: 6px; font-size: 11px;">
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #8b949e;">Completion Rate (${(weights.completion * 100).toFixed(0)}%)</span>
          <span style="color: #c9d1d9;">${(completionRate * 100).toFixed(1)}% = ${(completionRate * weights.completion * 100).toFixed(1)} pts</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #8b949e;">Streak Bonus (${(weights.streak * 100).toFixed(0)}%)</span>
          <span style="color: #c9d1d9;">${(streakBonus * 100).toFixed(1)}% = ${(streakBonus * weights.streak * 100).toFixed(1)} pts</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #8b949e;">Consistency (${(weights.consistency * 100).toFixed(0)}%)</span>
          <span style="color: #c9d1d9;">${(consistencyFactor * 100).toFixed(1)}% = ${(consistencyFactor * weights.consistency * 100).toFixed(1)} pts</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #8b949e;">Focus Time (${(weights.focusTime * 100).toFixed(0)}%)</span>
          <span style="color: #c9d1d9;">${(focusTimeFactor * 100).toFixed(1)}% = ${(focusTimeFactor * weights.focusTime * 100).toFixed(1)} pts</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #8b949e;">Resistance (${(weights.resistance * 100).toFixed(0)}%)</span>
          <span style="color: #c9d1d9;">${(resistanceFactor * 100).toFixed(1)}% = ${(resistanceFactor * weights.resistance * 100).toFixed(1)} pts</span>
        </div>
      </div>
    `;
  }

  // ── Error Trigger Tab ─────────────────────────────────────────────────

  private renderTriggerTab(container: HTMLElement): void {
    container.innerHTML = `
      <div style="margin-bottom: 12px; color: #8b949e;">
        Manually trigger test errors to verify the monitoring pipeline is working.
        These errors are tagged as test errors and will not affect real metrics.
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px; max-width: 400px;">
        <button class="debug-trigger-btn" data-error="uncaught" style="
          padding: 8px 16px; background: #161b22; border: 1px solid #30363d;
          color: #c9d1d9; border-radius: 4px; cursor: pointer; text-align: left;
          font-family: inherit; font-size: 12px;
        ">
          Uncaught Error
          <span style="display: block; color: #484f58; font-size: 11px;">
            Throws an unhandled error in the current context
          </span>
        </button>

        <button class="debug-trigger-btn" data-error="promise" style="
          padding: 8px 16px; background: #161b22; border: 1px solid #30363d;
          color: #c9d1d9; border-radius: 4px; cursor: pointer; text-align: left;
          font-family: inherit; font-size: 12px;
        ">
          Unhandled Promise Rejection
          <span style="display: block; color: #484f58; font-size: 11px;">
            Creates an unhandled promise rejection
          </span>
        </button>

        <button class="debug-trigger-btn" data-error="storage" style="
          padding: 8px 16px; background: #161b22; border: 1px solid #30363d;
          color: #c9d1d9; border-radius: 4px; cursor: pointer; text-align: left;
          font-family: inherit; font-size: 12px;
        ">
          Storage Error
          <span style="display: block; color: #484f58; font-size: 11px;">
            Simulates a storage quota exceeded error
          </span>
        </button>

        <button class="debug-trigger-btn" data-error="network" style="
          padding: 8px 16px; background: #161b22; border: 1px solid #30363d;
          color: #c9d1d9; border-radius: 4px; cursor: pointer; text-align: left;
          font-family: inherit; font-size: 12px;
        ">
          Network Error
          <span style="display: block; color: #484f58; font-size: 11px;">
            Simulates a failed fetch request
          </span>
        </button>

        <button class="debug-trigger-btn" data-error="blocking" style="
          padding: 8px 16px; background: #161b22; border: 1px solid #30363d;
          color: #c9d1d9; border-radius: 4px; cursor: pointer; text-align: left;
          font-family: inherit; font-size: 12px;
        ">
          Blocking Rule Error
          <span style="display: block; color: #484f58; font-size: 11px;">
            Simulates a declarativeNetRequest rule failure
          </span>
        </button>

        <button class="debug-trigger-btn" data-error="score" style="
          padding: 8px 16px; background: #161b22; border: 1px solid #30363d;
          color: #c9d1d9; border-radius: 4px; cursor: pointer; text-align: left;
          font-family: inherit; font-size: 12px;
        ">
          Focus Score NaN
          <span style="display: block; color: #484f58; font-size: 11px;">
            Produces a NaN Focus Score calculation
          </span>
        </button>
      </div>

      <div id="trigger-status" style="
        margin-top: 12px; padding: 8px 12px; background: #161b22;
        border: 1px solid #30363d; border-radius: 4px; display: none;
        color: #d29922;
      "></div>
    `;

    container.querySelectorAll('.debug-trigger-btn').forEach((btn) => {
      btn.addEventListener('click', (e: Event) => {
        const errorType = (e.currentTarget as HTMLElement).dataset.error;
        if (errorType) this.triggerTestError(errorType);
      });
    });
  }

  private triggerTestError(type: string): void {
    const statusEl = document.getElementById('trigger-status');

    const showStatus = (msg: string): void => {
      if (statusEl) {
        statusEl.textContent = msg;
        statusEl.style.display = 'block';
        setTimeout(() => {
          statusEl.style.display = 'none';
        }, 3000);
      }
    };

    switch (type) {
      case 'uncaught':
        showStatus('Triggering uncaught error...');
        setTimeout(() => {
          throw new Error('[FM_TEST] Test uncaught error for monitoring pipeline');
        }, 100);
        break;

      case 'promise':
        showStatus('Triggering unhandled promise rejection...');
        Promise.reject(new Error('[FM_TEST] Test unhandled promise rejection'));
        break;

      case 'storage':
        showStatus('Triggering storage error...');
        debugLogger.error('storage', '[FM_TEST] Storage quota exceeded', {
          bytesInUse: 10_485_760,
          quota: 10_485_760,
          operation: 'set',
          isTest: true,
        });
        break;

      case 'network':
        showStatus('Triggering network error...');
        debugLogger.error('license', '[FM_TEST] Network error during license validation', {
          url: 'https://api.focusmodeblocker.com/v1/validate',
          status: 0,
          errorMessage: 'Failed to fetch',
          isTest: true,
        });
        break;

      case 'blocking':
        showStatus('Triggering blocking rule error...');
        debugLogger.error('blocking', '[FM_TEST] Failed to update declarativeNetRequest rules', {
          errorMessage: 'Rule limit exceeded',
          ruleCount: 5001,
          isTest: true,
        });
        break;

      case 'score':
        showStatus('Triggering Focus Score NaN...');
        debugLogger.error('score', '[FM_TEST] Focus Score calculation resulted in NaN', {
          rawScore: NaN,
          factors: { completion: undefined, streak: null },
          isTest: true,
        });
        break;
    }
  }

  // ── Auto-refresh ──────────────────────────────────────────────────────

  private startAutoRefresh(): void {
    this.stopAutoRefresh();
    this.refreshInterval = setInterval(() => {
      if (!this.isVisible) return;
      // Only auto-refresh the logs tab (most dynamic)
      const activeTab = document.querySelector('.debug-tab.active') as HTMLElement;
      if (activeTab?.dataset.tab === 'logs') {
        const content = document.getElementById('debug-content');
        if (content) this.renderLogsTab(content);
      }
    }, 2_000);
  }

  private stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  private refreshAll(): void {
    const activeTab = document.querySelector('.debug-tab.active') as HTMLElement;
    const tabName = activeTab?.dataset.tab ?? 'logs';
    this.renderTab(tabName);
  }

  // ── Utility ───────────────────────────────────────────────────────────

  private escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

// ── Singleton export ──────────────────────────────────────────────────────

export const debugPanel = new DebugPanel();
export default debugPanel;
```

### Integration in Options Page

```typescript
// In src/popup/options.ts (initialization)

import { debugPanel } from '@/popup/debug-panel';
import { SupportUI } from '@/popup/support-ui';
import { supportTools } from '@/popup/support-tools';
import { debugLogger } from '@/shared/debug-logger';

// Initialize debug logger for options context
await debugLogger.init('options');

// Register Ctrl+Shift+D shortcut
supportTools.registerKeyboardShortcut();

// Attach debug panel activation to version number (5 clicks)
debugPanel.attachToVersionElement('#version-number');

// Initialize support UI in the About section
const supportUI = new SupportUI('#about-support-section');
await supportUI.render();
```

### Background Message Handlers for Debug Panel

```typescript
// In src/background/service-worker.ts — add these message handlers

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  switch (msg.type) {
    case 'DEBUG_GET_STORAGE': {
      chrome.storage.local.get(null).then((data) => {
        // Sanitize sensitive keys
        const sensitiveKeys = ['licenseKey', 'stripeCustomerId', 'authToken', 'refreshToken'];
        const sanitized: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(data)) {
          if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk.toLowerCase()))) {
            sanitized[key] = '[REDACTED]';
          } else {
            sanitized[key] = value;
          }
        }
        sendResponse({ data: sanitized });
      });
      return true;
    }

    case 'DEBUG_GET_RULES': {
      chrome.declarativeNetRequest.getDynamicRules().then((rules) => {
        sendResponse({ data: rules });
      });
      return true;
    }

    case 'DEBUG_GET_ALARMS': {
      chrome.alarms.getAll().then((alarms) => {
        sendResponse({ data: alarms });
      });
      return true;
    }

    case 'GET_ACTIVE_RULES_COUNT': {
      chrome.declarativeNetRequest.getDynamicRules().then((rules) => {
        sendResponse({ count: rules.length });
      });
      return true;
    }

    case 'SUBMIT_SUPPORT_TICKET': {
      // Forward to support API
      fetch('https://api.focusmodeblocker.com/v1/support/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg.payload),
      })
        .then((res) => res.json())
        .then((result) => sendResponse({ ok: true, ticketId: result.ticketId }))
        .catch((err) =>
          sendResponse({ ok: false, error: err instanceof Error ? err.message : String(err) })
        );
      return true;
    }
  }
});
```

---

# Section 8: Best Practices & Checklist for Focus Mode

Production-ready guidelines, error classification, cost optimization, and manifest configuration for Focus Mode - Blocker's crash analytics and monitoring infrastructure.

---

## 8.1 Implementation Checklist

Use this checklist to verify complete monitoring coverage before each release.

### Error Tracking

- [ ] **Global error handlers** registered in all contexts (service worker `onerror` / `onunhandledrejection`, content script `window.addEventListener('error')`, popup `window.onerror`)
- [ ] **Content script error capture** — errors in detector.js, blocker.js, and tracker.js are caught and forwarded to the background via `chrome.runtime.sendMessage`
- [ ] **UI error boundaries** — popup (380x500-580px), block page (full-page), options page (8 sections), and onboarding (5 slides) each have try/catch rendering wrappers
- [ ] **Promise rejection handling** — every `async` call chain in the 18 service worker modules has rejection handling; `onunhandledrejection` is the safety net
- [ ] **Context enrichment** — every error includes: extension version, context (background/popup/content/options/block-page), user tier (free/pro/lifetime), session state, timestamp
- [ ] **Source maps** — production builds generate source maps uploaded to the error tracking service but NOT bundled in the CRX; `hidden-source-map` webpack/vite devtool setting
- [ ] **Error deduplication** — fingerprint by message + stack trace top 3 frames; group by normalized patterns; cap identical errors at 10 per rolling hour

### Performance Monitoring

- [ ] **Service worker startup timing** — measure from `chrome.runtime.onInstalled` / `onStartup` to module initialization complete; record in `chrome.storage.local`
- [ ] **Memory monitoring** — sample `performance.memory.usedJSHeapSize` every 60 seconds in the service worker; store last 50 samples in a circular buffer
- [ ] **Content script injection timing** — measure time from `document_start` to DOM manipulation complete for detector.js and blocker.js
- [ ] **API latency tracking** — measure round-trip time for license validation, Stripe API calls, and sync operations; alert on p95 > 3s

### Alerting

- [ ] **Error spike detection** — alert when error count exceeds 3x the rolling 24-hour average within any 15-minute window
- [ ] **New error alerts** — immediate notification for any error fingerprint not seen in the last 7 days
- [ ] **Critical threshold** — page the on-call if CRITICAL-severity errors exceed 5 in any 5-minute window
- [ ] **Alert cooldown** — minimum 30 minutes between repeated alerts for the same fingerprint; escalate if count continues rising

### Privacy & Compliance

- [ ] **PII scrubbing** — all user-entered domains, email addresses, and license keys are redacted before any data leaves the device
- [ ] **Field redaction** — sensitive storage keys (`licenseKey`, `stripeCustomerId`, `authToken`, `refreshToken`) are replaced with `[REDACTED]` in debug bundles
- [ ] **Session replay consent** — if session replay is ever added, it must be opt-in only, with explicit consent stored in `chrome.storage.local`
- [ ] **GDPR compliance** — error data retained for maximum 90 days; user can request deletion via support ticket; no cross-device tracking without consent

### Debug Support

- [ ] **Debug mode toggle** — `chrome.storage.local` key `focusmode_debug_enabled` controls verbose console output; toggled via Options page or `Ctrl+Shift+D`
- [ ] **Log export** — one-click JSON debug bundle download from Options page "About" section; includes sanitized state, last 100 log entries, and performance stats
- [ ] **Remote debug** — WebSocket-based remote debug manager with whitelisted commands only; auto-reconnect with exponential backoff (max 5 attempts)
- [ ] **Support tickets** — user description + debug bundle submitted to API; fallback to local JSON download if network fails

### Testing

- [ ] **Development error tracking** — 100% sampling of all errors, transactions, and replays in development builds
- [ ] **Staging monitoring** — staging environment mirrors production monitoring config with elevated sampling (100% errors, 50% transactions)
- [ ] **Source map verification** — CI pipeline validates that uploaded source maps correctly resolve minified stack traces before publishing to Chrome Web Store
- [ ] **Alert testing** — manual error trigger buttons in the hidden debug panel (5-click activation) test the full monitoring pipeline end-to-end

---

## 8.2 Error Classification for Focus Mode

**File:** `src/shared/error-classifier.ts`

Classifies errors into four severity tiers to drive alerting and prioritization. Includes Focus Mode-specific patterns for blocking, timer, score, streak, and notification failures.

```typescript
// src/shared/error-classifier.ts

/**
 * ErrorClassifier — Categorize errors by severity for Focus Mode - Blocker.
 *
 * Severity levels:
 *   CRITICAL — alert immediately, potential data loss or core feature broken
 *   HIGH     — fix within 24 hours, feature degraded
 *   MEDIUM   — fix in next release, non-critical functionality affected
 *   LOW      — cosmetic or non-impactful, address when convenient
 *
 * Classification uses pattern matching against error messages and a
 * category-based override system for Focus Mode-specific scenarios.
 */

export type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface ClassifiedError {
  severity: ErrorSeverity;
  originalMessage: string;
  matchedPattern: string;
  category: string;
  shouldAlert: boolean;
  shouldPage: boolean;
}

interface ClassificationRule {
  pattern: RegExp;
  severity: ErrorSeverity;
  category: string;
  description: string;
}

// ── Classification rules ordered by severity (highest first) ────────────

const CLASSIFICATION_RULES: ClassificationRule[] = [
  // ─── CRITICAL: Alert immediately ──────────────────────────────────────
  {
    pattern: /Cannot read propert(y|ies) of (undefined|null)/i,
    severity: 'critical',
    category: 'runtime',
    description: 'Null/undefined property access — likely missing data or broken reference',
  },
  {
    pattern: /undefined is not (a function|an object)/i,
    severity: 'critical',
    category: 'runtime',
    description: 'Type error — calling non-function or accessing non-object',
  },
  {
    pattern: /Maximum call stack size exceeded/i,
    severity: 'critical',
    category: 'runtime',
    description: 'Infinite recursion — stack overflow',
  },
  {
    pattern: /out of memory/i,
    severity: 'critical',
    category: 'runtime',
    description: 'Memory exhaustion — extension likely non-functional',
  },
  {
    pattern: /declarativeNetRequest.*(?:fail|error|invalid)/i,
    severity: 'critical',
    category: 'blocking',
    description: 'Blocking rule failure — sites may not be blocked',
  },
  {
    pattern: /(?:QUOTA_BYTES|quota).*exceeded/i,
    severity: 'critical',
    category: 'storage',
    description: 'Storage quota exceeded — data loss risk',
  },
  {
    pattern: /blocking.*fail/i,
    severity: 'critical',
    category: 'blocking',
    description: 'Site blocking failure — core feature broken',
  },
  {
    pattern: /block.*page.*(?:inject|render|display).*fail/i,
    severity: 'critical',
    category: 'blocking',
    description: 'Block page failed to render — user sees unblocked site',
  },
  {
    pattern: /nuclear.*(?:fail|bypass|tamper)/i,
    severity: 'critical',
    category: 'nuclear',
    description: 'Nuclear mode failure — tamper resistance compromised',
  },

  // ─── HIGH: Fix soon ──────────────────────────────────────────────────
  {
    pattern: /(?:network|net::).*error/i,
    severity: 'high',
    category: 'network',
    description: 'Network connectivity issue',
  },
  {
    pattern: /failed to fetch/i,
    severity: 'high',
    category: 'network',
    description: 'Fetch request failed — API unreachable',
  },
  {
    pattern: /timeout|timed?\s*out/i,
    severity: 'high',
    category: 'network',
    description: 'Request or operation timeout',
  },
  {
    pattern: /permission.*denied/i,
    severity: 'high',
    category: 'permissions',
    description: 'Chrome permission denied — feature may not work',
  },
  {
    pattern: /license.*(?:validation|verify|check).*(?:fail|error)/i,
    severity: 'high',
    category: 'license',
    description: 'License validation failure — Pro features may be locked',
  },
  {
    pattern: /stripe.*(?:error|fail)/i,
    severity: 'high',
    category: 'license',
    description: 'Stripe API error — payment/subscription issue',
  },
  {
    pattern: /timer.*drift.*(?:[5-9]\d{3}|\d{5,})/i,
    severity: 'high',
    category: 'timer',
    description: 'Timer drift exceeds 5 seconds — session timing unreliable',
  },
  {
    pattern: /focus\s*score.*NaN/i,
    severity: 'high',
    category: 'score',
    description: 'Focus Score calculated as NaN — display and history broken',
  },
  {
    pattern: /alarm.*(?:fail|not\s*created|missing)/i,
    severity: 'high',
    category: 'timer',
    description: 'Chrome alarm creation failure — timer will not fire',
  },
  {
    pattern: /service\s*worker.*(?:crash|terminate|kill)/i,
    severity: 'high',
    category: 'runtime',
    description: 'Service worker crashed — all background operations stopped',
  },
  {
    pattern: /paywall.*(?:fail|error|crash)/i,
    severity: 'high',
    category: 'paywall',
    description: 'Paywall display failure — revenue impact',
  },

  // ─── MEDIUM: Next release ─────────────────────────────────────────────
  {
    pattern: /deprecated/i,
    severity: 'medium',
    category: 'compatibility',
    description: 'Deprecated API usage — will break in future Chrome versions',
  },
  {
    pattern: /streak.*(?:calculation|compute|update).*(?:error|fail)/i,
    severity: 'medium',
    category: 'streak',
    description: 'Streak calculation error — gamification data may be wrong',
  },
  {
    pattern: /notification.*permission.*denied/i,
    severity: 'medium',
    category: 'notifications',
    description: 'Notification permission denied — user will not get alerts',
  },
  {
    pattern: /sync.*(?:conflict|fail|error)/i,
    severity: 'medium',
    category: 'sync',
    description: 'Pro sync failure — data may not be current across devices',
  },
  {
    pattern: /render.*(?:error|fail)/i,
    severity: 'medium',
    category: 'ui',
    description: 'Non-critical UI render failure',
  },
  {
    pattern: /migration.*(?:error|fail)/i,
    severity: 'medium',
    category: 'storage',
    description: 'Storage migration error — old data format may persist',
  },
  {
    pattern: /onboarding.*(?:error|fail)/i,
    severity: 'medium',
    category: 'ui',
    description: 'Onboarding flow error — new user experience degraded',
  },

  // ─── LOW: Cosmetic ────────────────────────────────────────────────────
  {
    pattern: /ResizeObserver loop/i,
    severity: 'low',
    category: 'ui',
    description: 'ResizeObserver loop — benign browser warning',
  },
  {
    pattern: /non-passive event listener/i,
    severity: 'low',
    category: 'ui',
    description: 'Non-passive event listener — minor scroll performance',
  },
  {
    pattern: /CSS.*(?:invalid|unknown|unsupported)/i,
    severity: 'low',
    category: 'ui',
    description: 'CSS compatibility issue — minor visual glitch',
  },
  {
    pattern: /sound.*(?:play|audio).*(?:fail|error)/i,
    severity: 'low',
    category: 'notifications',
    description: 'Sound playback failure — notification sound missing',
  },
  {
    pattern: /favicon.*(?:error|fail|404)/i,
    severity: 'low',
    category: 'ui',
    description: 'Favicon load failure — cosmetic only',
  },
];

/**
 * Classify an error message into a severity level.
 */
export function classifyError(message: string): ClassifiedError {
  const normalizedMessage = message.trim();

  for (const rule of CLASSIFICATION_RULES) {
    if (rule.pattern.test(normalizedMessage)) {
      return {
        severity: rule.severity,
        originalMessage: normalizedMessage,
        matchedPattern: rule.pattern.source,
        category: rule.category,
        shouldAlert: rule.severity === 'critical' || rule.severity === 'high',
        shouldPage: rule.severity === 'critical',
      };
    }
  }

  // Default: MEDIUM for unrecognized errors (we want to know about them)
  return {
    severity: 'medium',
    originalMessage: normalizedMessage,
    matchedPattern: 'none',
    category: 'unknown',
    shouldAlert: false,
    shouldPage: false,
  };
}

/**
 * Batch classify multiple errors and return a severity summary.
 */
export function classifyErrors(messages: string[]): {
  classified: ClassifiedError[];
  summary: Record<ErrorSeverity, number>;
} {
  const classified = messages.map(classifyError);

  const summary: Record<ErrorSeverity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const c of classified) {
    summary[c.severity]++;
  }

  return { classified, summary };
}

/**
 * Check if an error message matches a Focus Mode-specific critical pattern.
 * Use this for fast-path checks in error handlers.
 */
export function isCriticalFocusModeError(message: string): boolean {
  const criticalPatterns = [
    /declarativeNetRequest/i,
    /quota.*exceeded/i,
    /blocking.*fail/i,
    /nuclear.*(?:fail|bypass)/i,
    /Cannot read propert/i,
    /Maximum call stack/i,
    /out of memory/i,
  ];

  return criticalPatterns.some((p) => p.test(message));
}

/**
 * Get the recommended response action for a severity level.
 */
export function getResponseAction(severity: ErrorSeverity): {
  alert: boolean;
  page: boolean;
  logLevel: 'error' | 'warn' | 'log';
  retentionDays: number;
  sampleRate: number;
} {
  switch (severity) {
    case 'critical':
      return {
        alert: true,
        page: true,
        logLevel: 'error',
        retentionDays: 90,
        sampleRate: 1.0, // 100%
      };
    case 'high':
      return {
        alert: true,
        page: false,
        logLevel: 'error',
        retentionDays: 60,
        sampleRate: 1.0, // 100%
      };
    case 'medium':
      return {
        alert: false,
        page: false,
        logLevel: 'warn',
        retentionDays: 30,
        sampleRate: 0.5, // 50%
      };
    case 'low':
      return {
        alert: false,
        page: false,
        logLevel: 'log',
        retentionDays: 7,
        sampleRate: 0.1, // 10%
      };
  }
}
```

### Usage in Error Handlers

```typescript
import { classifyError, isCriticalFocusModeError } from '@/shared/error-classifier';
import { debugLogger } from '@/shared/debug-logger';

// In the global error handler (service worker)
self.addEventListener('error', (event: ErrorEvent) => {
  const classified = classifyError(event.message);

  debugLogger[classified.severity === 'low' ? 'log' : 'error'](
    classified.category as any,
    `[${classified.severity.toUpperCase()}] ${event.message}`,
    {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      severity: classified.severity,
      matchedPattern: classified.matchedPattern,
    }
  );

  // Fast-path critical check for immediate escalation
  if (isCriticalFocusModeError(event.message)) {
    // Send to alerting service immediately
    chrome.runtime.sendMessage({
      type: 'CRITICAL_ERROR',
      payload: classified,
    });
  }
});
```

---

## 8.3 Cost Optimization

**File:** `src/config/sampling.ts`

Dynamic sampling configuration that reduces monitoring costs in production while maintaining full visibility in development and staging. Includes Focus Mode-specific overrides to ensure paywall and license errors are always captured.

```typescript
// src/config/sampling.ts

/**
 * Sampling configuration for Focus Mode - Blocker monitoring.
 *
 * Environments:
 *   production  — cost-optimized, captures all errors but samples transactions/replays
 *   staging     — elevated sampling for QA validation
 *   development — 100% everything for full debugging
 *
 * Dynamic adjustment:
 *   When error rate exceeds 1,000/hr, reduce transaction sampling to 1%
 *   to prevent cost blowout during incidents.
 *
 * Focus Mode overrides:
 *   Paywall (T1-T10) and license errors always sampled at 100% regardless
 *   of environment or dynamic adjustment — revenue-critical paths.
 */

export type Environment = 'production' | 'staging' | 'development';

export interface SamplingConfig {
  /** Percentage of errors to capture (0-1) */
  errorRate: number;
  /** Percentage of transactions/performance traces to capture (0-1) */
  transactionRate: number;
  /** Percentage of session replays to capture (0-1) */
  replayRate: number;
  /** Percentage of analytics events to capture (0-1) */
  analyticsRate: number;
}

export interface DynamicSamplingState {
  currentErrorCount: number;
  windowStartTime: number;
  isThrottled: boolean;
  originalConfig: SamplingConfig;
}

// ── Static configurations per environment ───────────────────────────────

const ENVIRONMENT_CONFIGS: Record<Environment, SamplingConfig> = {
  production: {
    errorRate: 1.0,        // 100% of errors
    transactionRate: 0.1,  // 10% of transactions
    replayRate: 0.01,      // 1% of session replays
    analyticsRate: 1.0,    // 100% of analytics events
  },
  staging: {
    errorRate: 1.0,        // 100% of errors
    transactionRate: 0.5,  // 50% of transactions
    replayRate: 0.1,       // 10% of session replays
    analyticsRate: 1.0,    // 100% of analytics events
  },
  development: {
    errorRate: 1.0,        // 100% of errors
    transactionRate: 1.0,  // 100% of transactions
    replayRate: 1.0,       // 100% of session replays
    analyticsRate: 1.0,    // 100% of analytics events
  },
};

// ── Dynamic sampling thresholds ─────────────────────────────────────────

const ERROR_RATE_THRESHOLD = 1_000;       // errors per hour
const THROTTLED_TRANSACTION_RATE = 0.01;  // 1% when throttled
const THROTTLE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// ── Focus Mode override categories (always 100%) ────────────────────────

const ALWAYS_SAMPLE_CATEGORIES = new Set([
  'paywall',   // All 10 paywall triggers (T1-T10) — revenue critical
  'license',   // License validation, tier changes, expiry — revenue critical
]);

class SamplingManager {
  private config: SamplingConfig;
  private environment: Environment;
  private dynamicState: DynamicSamplingState;

  constructor() {
    this.environment = this.detectEnvironment();
    this.config = { ...ENVIRONMENT_CONFIGS[this.environment] };
    this.dynamicState = {
      currentErrorCount: 0,
      windowStartTime: Date.now(),
      isThrottled: false,
      originalConfig: { ...this.config },
    };
  }

  /**
   * Get the current sampling config.
   */
  getConfig(): Readonly<SamplingConfig> {
    return { ...this.config };
  }

  /**
   * Get the current environment.
   */
  getEnvironment(): Environment {
    return this.environment;
  }

  /**
   * Check if a given event category should always be sampled at 100%.
   */
  isAlwaysSampled(category: string): boolean {
    return ALWAYS_SAMPLE_CATEGORIES.has(category);
  }

  /**
   * Decide whether to sample an event based on current config and category.
   */
  shouldSample(
    type: 'error' | 'transaction' | 'replay' | 'analytics',
    category?: string
  ): boolean {
    // Focus Mode overrides: paywall and license always captured
    if (category && this.isAlwaysSampled(category)) {
      return true;
    }

    const rate = this.getRateForType(type);
    if (rate >= 1.0) return true;
    if (rate <= 0) return false;

    return Math.random() < rate;
  }

  /**
   * Record an error occurrence for dynamic sampling adjustment.
   * Call this every time an error is captured.
   */
  recordError(): void {
    const now = Date.now();

    // Reset window if expired
    if (now - this.dynamicState.windowStartTime > THROTTLE_WINDOW_MS) {
      this.dynamicState.windowStartTime = now;
      this.dynamicState.currentErrorCount = 0;

      // Un-throttle if we were throttled
      if (this.dynamicState.isThrottled) {
        this.config = { ...this.dynamicState.originalConfig };
        this.dynamicState.isThrottled = false;
      }
    }

    this.dynamicState.currentErrorCount++;

    // Activate throttling if threshold exceeded
    if (
      !this.dynamicState.isThrottled &&
      this.dynamicState.currentErrorCount > ERROR_RATE_THRESHOLD
    ) {
      this.activateThrottling();
    }
  }

  /**
   * Get the current dynamic sampling state (for monitoring dashboards).
   */
  getDynamicState(): Readonly<DynamicSamplingState> {
    return { ...this.dynamicState };
  }

  /**
   * Force a specific environment (useful for testing).
   */
  setEnvironment(env: Environment): void {
    this.environment = env;
    this.config = { ...ENVIRONMENT_CONFIGS[env] };
    this.dynamicState.originalConfig = { ...this.config };
    this.dynamicState.isThrottled = false;
  }

  // ── Private ───────────────────────────────────────────────────────────

  private getRateForType(type: 'error' | 'transaction' | 'replay' | 'analytics'): number {
    switch (type) {
      case 'error':
        return this.config.errorRate;
      case 'transaction':
        return this.config.transactionRate;
      case 'replay':
        return this.config.replayRate;
      case 'analytics':
        return this.config.analyticsRate;
    }
  }

  private activateThrottling(): void {
    this.dynamicState.isThrottled = true;

    // Reduce transaction sampling to prevent cost blowout
    this.config.transactionRate = THROTTLED_TRANSACTION_RATE;

    // Errors always stay at 100% — we need them for incident response
    // Analytics stay at current rate
    // Replays can be reduced too
    this.config.replayRate = Math.min(this.config.replayRate, 0.005); // cap at 0.5%

    console.warn(
      '[FM:sampling] Dynamic throttling activated — error rate exceeded',
      ERROR_RATE_THRESHOLD,
      'per hour. Transaction sampling reduced to',
      `${THROTTLED_TRANSACTION_RATE * 100}%`
    );
  }

  private detectEnvironment(): Environment {
    // Chrome extensions can use update_url to determine environment
    // Extensions loaded unpacked (development) have no update_url
    const manifest = chrome.runtime.getManifest();

    if (!('update_url' in manifest)) {
      return 'development';
    }

    // Check for staging flag in storage (set during build)
    // Default to production for store-distributed extensions
    try {
      const url = new URL((manifest as any).update_url);
      if (url.hostname.includes('staging')) {
        return 'staging';
      }
    } catch {
      // Invalid URL — assume production
    }

    return 'production';
  }
}

// ── Singleton export ──────────────────────────────────────────────────────

export const samplingManager = new SamplingManager();
export default samplingManager;
```

### Usage with Error Tracking

```typescript
import { samplingManager } from '@/config/sampling';
import { classifyError } from '@/shared/error-classifier';
import { debugLogger } from '@/shared/debug-logger';

// When an error is captured
function handleError(message: string, category: string): void {
  // Record for dynamic sampling adjustment
  samplingManager.recordError();

  // Check if we should sample this event
  if (!samplingManager.shouldSample('error', category)) {
    return; // Dropped by sampling
  }

  const classified = classifyError(message);

  // Always log locally
  debugLogger.error(category as any, message, {
    severity: classified.severity,
    sampled: true,
  });

  // Send to external error tracking service
  sendToErrorTracker({
    message,
    severity: classified.severity,
    category,
    environment: samplingManager.getEnvironment(),
  });
}

// For transactions (performance traces)
function shouldTraceTransaction(category: string): boolean {
  return samplingManager.shouldSample('transaction', category);
}
```

### Sampling Rate Summary Table

| Environment | Errors | Transactions | Replays | Analytics |
|-------------|--------|--------------|---------|-----------|
| Production  | 100%   | 10%          | 1%      | 100%      |
| Staging     | 100%   | 50%          | 10%     | 100%      |
| Development | 100%   | 100%         | 100%    | 100%      |
| Throttled*  | 100%   | 1%           | 0.5%    | 100%      |

\* Throttled mode activates when error rate exceeds 1,000/hr.

**Focus Mode Overrides:** `paywall` and `license` categories are always sampled at 100% regardless of environment or throttling state. These are revenue-critical paths covering all 10 paywall triggers (T1-T10), license validation, tier changes ($4.99/mo Pro, $49.99 Lifetime), and Stripe API interactions.

---

## 8.4 Manifest Configuration for Monitoring

The following changes to `manifest.json` are required to support error tracking endpoints, remote debugging, and CSP adjustments for Focus Mode - Blocker's monitoring infrastructure.

```jsonc
// manifest.json — additions for crash analytics & monitoring
{
  "manifest_version": 3,
  "name": "Focus Mode - Blocker",
  "version": "1.0.0",

  // ... existing permissions ...

  "permissions": [
    "storage",
    "alarms",
    "declarativeNetRequest",
    "notifications",
    "tabs",
    "activeTab"
    // No additional permissions needed for monitoring — fetch() works
    // from the service worker without extra permissions as long as
    // host_permissions covers the endpoints.
  ],

  "host_permissions": [
    // Existing host permissions for site blocking
    "<all_urls>",

    // Error tracking service (e.g., Sentry)
    "https://*.ingest.sentry.io/*",

    // Focus Mode API (license validation, support tickets, analytics)
    "https://api.focusmodeblocker.com/*",

    // Remote debug server (WebSocket upgrade uses HTTPS origin)
    "https://debug.focusmodeblocker.com/*",

    // Stripe API (payment processing)
    "https://api.stripe.com/*"
  ],

  "content_security_policy": {
    "extension_pages": [
      // Default MV3 CSP with additions for monitoring
      "script-src 'self';",
      "object-src 'self';",

      // Allow connections to error tracking and monitoring endpoints
      "connect-src",
        "'self'",
        "https://*.ingest.sentry.io",
        "https://api.focusmodeblocker.com",
        "wss://debug.focusmodeblocker.com",
        "https://api.stripe.com",
      ";"
    ].join(" ")
  },

  // The actual valid JSON format for manifest.json:
  // "content_security_policy": {
  //   "extension_pages": "script-src 'self'; object-src 'self'; connect-src 'self' https://*.ingest.sentry.io https://api.focusmodeblocker.com wss://debug.focusmodeblocker.com https://api.stripe.com;"
  // }

  "background": {
    "service_worker": "src/background/service-worker.ts",
    "type": "module"
  },

  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["src/content/detector.js"],
      "run_at": "document_start"
    },
    {
      "matches": ["<all_urls>"],
      "js": ["src/content/blocker.js"],
      "run_at": "document_start"
    },
    {
      "matches": ["<all_urls>"],
      "js": ["src/content/tracker.js"],
      "run_at": "document_idle"
    }
  ]
}
```

### CSP Explanation

| Directive | Value | Purpose |
|-----------|-------|---------|
| `script-src` | `'self'` | Only scripts from the extension package (MV3 default, no remote scripts) |
| `object-src` | `'self'` | Block plugin content from external sources |
| `connect-src 'self'` | Extension origin | Internal messaging and storage access |
| `connect-src https://*.ingest.sentry.io` | Sentry | Error event ingestion (DSN-based, no auth headers needed) |
| `connect-src https://api.focusmodeblocker.com` | Focus Mode API | License validation, support tickets, analytics, sync |
| `connect-src wss://debug.focusmodeblocker.com` | Debug server | WebSocket remote debugging (gated by debug flag) |
| `connect-src https://api.stripe.com` | Stripe | Payment processing for Pro ($4.99/mo) and Lifetime ($49.99) |

### Important Notes

1. **`<all_urls>` in host_permissions** is already required for site blocking via `declarativeNetRequest`. The monitoring endpoints are covered by this wildcard, but listing them explicitly documents the dependency.

2. **Content scripts** do not have their own CSP in MV3. Content script network requests inherit the page's CSP, so errors from content scripts should be forwarded to the service worker via `chrome.runtime.sendMessage` rather than sent directly to Sentry.

3. **WebSocket (`wss://`)** for remote debugging requires the `connect-src` CSP directive. The `wss://` scheme is covered by listing the HTTPS origin.

4. **No `unsafe-eval` or `unsafe-inline`** is needed. All monitoring code runs from the extension bundle. Source maps are uploaded separately to Sentry during the build process.

5. **Sentry DSN** is embedded in the extension code (not a secret — it only allows sending events). The Sentry auth token for source map uploads lives only in CI/CD environment variables, never in the extension.

### Build Configuration for Source Maps

```typescript
// vite.config.ts — relevant monitoring configuration

import { defineConfig } from 'vite';
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig(({ mode }) => ({
  build: {
    // Generate source maps for error tracking but don't include in CRX
    sourcemap: mode === 'production' ? 'hidden' : true,

    rollupOptions: {
      input: {
        'service-worker': 'src/background/service-worker.ts',
        popup: 'src/popup/popup.ts',
        options: 'src/popup/options.ts',
        'block-page': 'src/popup/block-page.ts',
        onboarding: 'src/popup/onboarding.ts',
        detector: 'src/content/detector.ts',
        blocker: 'src/content/blocker.ts',
        tracker: 'src/content/tracker.ts',
      },
    },
  },

  plugins: [
    // Upload source maps to Sentry during production builds
    mode === 'production' &&
      sentryVitePlugin({
        org: 'focusmode',
        project: 'focus-mode-blocker',
        authToken: process.env.SENTRY_AUTH_TOKEN, // CI/CD only
        release: {
          name: `focus-mode-blocker@${process.env.npm_package_version}`,
        },
        sourcemaps: {
          assets: './dist/**/*.js.map',
          // Delete source maps after upload — they must not be in the CRX
          filesToDeleteAfterUpload: './dist/**/*.js.map',
        },
      }),
  ].filter(Boolean),
}));
```

This ensures source maps are uploaded to Sentry for readable stack traces in error reports, but the `.map` files are removed from the build output before packaging the CRX file. This prevents exposing source code to end users while maintaining full debuggability in the monitoring dashboard.
