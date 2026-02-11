# Phase 11 — Agent 1: Error Tracking Architecture & Sentry Integration

> Focus Mode - Blocker v1.0.0 | Manifest V3 Chrome Extension
> Crash Analytics & Monitoring — Production-Ready Implementation

---

## Table of Contents

1. [Error Tracking Architecture for Focus Mode](#1-error-tracking-architecture-for-focus-mode)
   - 1.1 [Service Worker Error Handler](#11-service-worker-error-handler)
   - 1.2 [Content Script Error Capture](#12-content-script-error-capture)
   - 1.3 [Popup/Options/Block Page Error Handling](#13-popupoptionsblock-page-error-handling)
   - 1.4 [Background Message Handler Integration](#14-background-message-handler-integration)
   - 1.5 [Error Context Enrichment](#15-error-context-enrichment)
2. [Sentry Integration for Focus Mode](#2-sentry-integration-for-focus-mode)
   - 2.1 [Service Worker Sentry Setup](#21-service-worker-sentry-setup)
   - 2.2 [Content Script Sentry (Lightweight)](#22-content-script-sentry-lightweight)
   - 2.3 [Source Map Configuration](#23-source-map-configuration)
   - 2.4 [Focus Mode Breadcrumbs](#24-focus-mode-breadcrumbs)
   - 2.5 [Release Tracking Script](#25-release-tracking-script)

---

## 1. Error Tracking Architecture for Focus Mode

### 1.1 Service Worker Error Handler

**File: `src/background/error-handler.ts`**

The ErrorTracker class is the central nervous system for all crash analytics in Focus Mode - Blocker. It runs inside the MV3 service worker (`src/background/service-worker.js`), captures errors from the background context and from forwarded content-script / UI-page reports, deduplicates them via fingerprinting, enriches them with Focus Mode session state, and flushes batches to the configured endpoint (or falls back to `chrome.storage.local` when the network is unavailable).

```typescript
// src/background/error-handler.ts
// ─────────────────────────────────────────────────────────────────────
// Focus Mode - Blocker — Service Worker Error Handler
// Captures, deduplicates, enriches, batches, and ships error reports.
// ─────────────────────────────────────────────────────────────────────

import { getFocusModeErrorContext, type FocusModeErrorContext } from '../shared/error-context';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

/** Severity mirrors Sentry levels so they map 1-to-1 on ingest. */
export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info';

/** The origin tells us which execution context produced the error. */
export type ErrorSource =
  | 'service-worker'
  | 'content-detector'
  | 'content-blocker'
  | 'content-tracker'
  | 'popup'
  | 'options'
  | 'block-page'
  | 'onboarding'
  | 'offscreen';

/** A single, fully-enriched error report ready for batching. */
export interface ErrorReport {
  /** Stable hash for dedup — see `computeFingerprint`. */
  fingerprint: string;
  /** ISO-8601 timestamp of first occurrence in this batch. */
  timestamp: string;
  /** How many identical errors (same fingerprint) collapsed into this one. */
  occurrences: number;
  /** Error severity level. */
  severity: ErrorSeverity;
  /** Which execution context produced this error. */
  source: ErrorSource;
  /** The error message text. Already privacy-scrubbed. */
  message: string;
  /** Stack trace string (if available). Privacy-scrubbed. */
  stack: string | null;
  /** Specific error class name, e.g. "TypeError". */
  name: string;
  /** Focus Mode state snapshot at the time of the error. */
  context: FocusModeErrorContext;
  /** Extension version from manifest. */
  extensionVersion: string;
  /** Chrome version string. */
  browserVersion: string;
  /** Platform: "win" | "mac" | "linux" | "chromeos" | etc. */
  platform: string;
  /** Optional extra metadata from caller. */
  metadata?: Record<string, string | number | boolean>;
}

/** Shape of the batch payload sent to the ingest endpoint. */
export interface ErrorBatchPayload {
  batchId: string;
  sentAt: string;
  extensionId: string;
  reports: ErrorReport[];
}

/** Configuration for the ErrorTracker. */
export interface ErrorTrackerConfig {
  /** Remote ingest endpoint URL. */
  endpoint: string;
  /** Maximum errors held in memory before an automatic flush. */
  maxQueueSize: number;
  /** Flush interval in seconds (uses chrome.alarms — minimum 30s). */
  flushIntervalSec: number;
  /** When true, errors are logged to console instead of shipped. */
  debugMode: boolean;
  /** Maximum number of errors stored in chrome.storage.local fallback. */
  maxStorageFallback: number;
  /** Sampling rate 0-1. 1 = send everything. */
  sampleRate: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const DEFAULT_CONFIG: ErrorTrackerConfig = {
  endpoint: 'https://errors.focusmode.app/api/v1/ingest',
  maxQueueSize: 50,
  flushIntervalSec: 30,
  debugMode: false,
  maxStorageFallback: 200,
  sampleRate: 1.0,
};

const ALARM_NAME = 'focus-mode-error-flush';
const STORAGE_KEY = 'fm_pending_errors';

/** Domains / substrings that must never appear in error payloads. */
const PRIVACY_SCRUB_PATTERNS: RegExp[] = [
  // License keys follow the pattern FM-XXXX-XXXX-XXXX
  /FM-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}/gi,
  // Stripe tokens
  /sk_(live|test)_[A-Za-z0-9]+/g,
  // Email-like strings
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
];

/* ------------------------------------------------------------------ */
/*  Utility helpers                                                   */
/* ------------------------------------------------------------------ */

/**
 * Generate a stable fingerprint from error name + message + first
 * meaningful stack frame. Two identical errors in the same location
 * will always share a fingerprint, which powers deduplication.
 */
function computeFingerprint(
  name: string,
  message: string,
  stack: string | null,
  source: ErrorSource
): string {
  // Grab the first non-empty stack frame that references our extension
  let firstFrame = '';
  if (stack) {
    const lines = stack.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (
        trimmed.startsWith('at ') &&
        (trimmed.includes('chrome-extension://') || trimmed.includes('/src/'))
      ) {
        // Normalise away column numbers so minor build shifts don't split fingerprints
        firstFrame = trimmed.replace(/:\d+:\d+\)?$/, '');
        break;
      }
    }
  }
  const raw = `${source}|${name}|${message}|${firstFrame}`;
  // Simple FNV-1a 32-bit hash — tiny, deterministic, good enough for dedup
  let hash = 0x811c9dc5;
  for (let i = 0; i < raw.length; i++) {
    hash ^= raw.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/**
 * Scrub privacy-sensitive content from a string.
 * - Removes license keys, Stripe tokens, email addresses.
 * - Removes anything that looks like a full URL (to prevent leaking
 *   blocked site domains).  Extension URLs are preserved.
 */
function scrubPrivacy(input: string): string {
  let result = input;
  for (const pattern of PRIVACY_SCRUB_PATTERNS) {
    result = result.replace(pattern, '[REDACTED]');
  }
  // Scrub full http(s) URLs except our extension URLs
  result = result.replace(
    /https?:\/\/(?!chrome-extension:)[^\s"'`,;)}\]]+/gi,
    '[REDACTED_URL]'
  );
  return result;
}

/** Read the extension version once from the manifest. Cached. */
let _extensionVersion: string | null = null;
function getExtensionVersion(): string {
  if (_extensionVersion) return _extensionVersion;
  try {
    const manifest = chrome.runtime.getManifest();
    _extensionVersion = manifest.version;
  } catch {
    _extensionVersion = 'unknown';
  }
  return _extensionVersion!;
}

/** Parse the Chrome browser version from the user-agent string. */
function getBrowserVersion(): string {
  const match = navigator.userAgent.match(/Chrome\/([\d.]+)/);
  return match ? match[1] : 'unknown';
}

/** Get the OS platform via chrome.runtime.getPlatformInfo (cached). */
let _platform: string | null = null;
async function getPlatform(): Promise<string> {
  if (_platform) return _platform;
  try {
    const info = await chrome.runtime.getPlatformInfo();
    _platform = info.os;
  } catch {
    _platform = 'unknown';
  }
  return _platform!;
}

/** Generate a simple batch ID (timestamp + random suffix). */
function generateBatchId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `${ts}-${rand}`;
}

/* ------------------------------------------------------------------ */
/*  ErrorTracker                                                      */
/* ------------------------------------------------------------------ */

export class ErrorTracker {
  private config: ErrorTrackerConfig;
  private queue: Map<string, ErrorReport> = new Map();
  private isInitialised = false;
  private isFlushing = false;
  private platform = 'unknown';

  constructor(config: Partial<ErrorTrackerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /* ---------------------------------------------------------------- */
  /*  Lifecycle                                                       */
  /* ---------------------------------------------------------------- */

  /**
   * Initialise the tracker: attach global listeners, set up flush
   * alarm, and rehydrate any errors that were persisted to storage
   * while the service worker was previously asleep.
   */
  async init(): Promise<void> {
    if (this.isInitialised) return;

    this.platform = await getPlatform();

    // 1. Attach global error listeners on the service worker scope
    this.attachGlobalListeners();

    // 2. Set up recurring flush alarm (minimum interval = 30s in MV3)
    this.setupFlushAlarm();

    // 3. Rehydrate any errors that were saved to storage on last shutdown
    await this.rehydrateFromStorage();

    this.isInitialised = true;

    if (this.config.debugMode) {
      console.log('[ErrorTracker] Initialised.', {
        queueSize: this.queue.size,
        config: this.config,
      });
    }
  }

  /**
   * Attach error / unhandledrejection / chrome.runtime.onError
   * listeners on the ServiceWorkerGlobalScope.
   */
  private attachGlobalListeners(): void {
    // — Global uncaught errors —
    self.addEventListener('error', (event: ErrorEvent) => {
      this.captureError(event.error ?? event.message, {
        source: 'service-worker',
        severity: 'error',
        metadata: {
          filename: event.filename ?? 'unknown',
          lineno: event.lineno ?? 0,
          colno: event.colno ?? 0,
        },
      });
    });

    // — Unhandled promise rejections —
    self.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const errorObj =
        reason instanceof Error
          ? reason
          : new Error(typeof reason === 'string' ? reason : JSON.stringify(reason));
      this.captureError(errorObj, {
        source: 'service-worker',
        severity: 'error',
        metadata: { type: 'unhandled_promise_rejection' },
      });
    });

    // — Chrome runtime last-error after API calls —
    // This is checked manually (see wrapChromeCall), but we also
    // listen to onStartup / onInstalled in case something goes wrong
    // early in the lifecycle.
    chrome.runtime.onStartup?.addListener(() => {
      if (chrome.runtime.lastError) {
        this.captureError(new Error(chrome.runtime.lastError.message), {
          source: 'service-worker',
          severity: 'warning',
          metadata: { trigger: 'runtime.onStartup' },
        });
      }
    });
  }

  /**
   * Create a recurring chrome.alarms alarm that fires every
   * `flushIntervalSec` seconds to trigger batch flush.
   */
  private setupFlushAlarm(): void {
    const periodInMinutes = Math.max(this.config.flushIntervalSec / 60, 0.5);

    chrome.alarms.create(ALARM_NAME, {
      delayInMinutes: periodInMinutes,
      periodInMinutes,
    });

    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === ALARM_NAME) {
        this.flush();
      }
    });
  }

  /**
   * On service worker wake, pull any errors that were persisted to
   * chrome.storage.local and merge them into the in-memory queue.
   */
  private async rehydrateFromStorage(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEY);
      const pending: ErrorReport[] = result[STORAGE_KEY] ?? [];
      if (pending.length === 0) return;

      for (const report of pending) {
        if (this.queue.has(report.fingerprint)) {
          // Merge occurrence count
          const existing = this.queue.get(report.fingerprint)!;
          existing.occurrences += report.occurrences;
        } else {
          this.queue.set(report.fingerprint, report);
        }
      }

      // Clear the persisted copy
      await chrome.storage.local.remove(STORAGE_KEY);

      if (this.config.debugMode) {
        console.log(`[ErrorTracker] Rehydrated ${pending.length} error(s) from storage.`);
      }
    } catch (e) {
      // Storage read itself failed — not much we can do
      console.warn('[ErrorTracker] Failed to rehydrate from storage:', e);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Public API                                                      */
  /* ---------------------------------------------------------------- */

  /**
   * Primary entry point. Captures an error (or string), enriches it,
   * deduplicates via fingerprint, and queues it for the next batch.
   *
   * If the queue exceeds `maxQueueSize`, an immediate flush is
   * triggered.
   */
  async captureError(
    error: Error | string,
    options: {
      source?: ErrorSource;
      severity?: ErrorSeverity;
      metadata?: Record<string, string | number | boolean>;
    } = {}
  ): Promise<void> {
    // Sampling gate
    if (Math.random() > this.config.sampleRate) return;

    const {
      source = 'service-worker',
      severity = 'error',
      metadata,
    } = options;

    // Normalise into an Error object
    const err = typeof error === 'string' ? new Error(error) : error;

    // Privacy-scrub message and stack
    const message = scrubPrivacy(err.message || 'Unknown error');
    const stack = err.stack ? scrubPrivacy(err.stack) : null;
    const name = err.name || 'Error';

    const fingerprint = computeFingerprint(name, message, stack, source);

    // Dedup: if this fingerprint already exists, just bump count
    if (this.queue.has(fingerprint)) {
      const existing = this.queue.get(fingerprint)!;
      existing.occurrences += 1;
      // Upgrade severity if new occurrence is more severe
      if (severityWeight(severity) > severityWeight(existing.severity)) {
        existing.severity = severity;
      }
      return;
    }

    // Enrich with Focus Mode context
    let context: FocusModeErrorContext;
    try {
      context = await getFocusModeErrorContext();
    } catch {
      context = getEmptyContext();
    }

    const report: ErrorReport = {
      fingerprint,
      timestamp: new Date().toISOString(),
      occurrences: 1,
      severity,
      source,
      message,
      stack,
      name,
      context,
      extensionVersion: getExtensionVersion(),
      browserVersion: getBrowserVersion(),
      platform: this.platform,
      metadata,
    };

    this.queue.set(fingerprint, report);

    if (this.config.debugMode) {
      console.log('[ErrorTracker] Captured:', report);
    }

    // If queue is at capacity, flush immediately
    if (this.queue.size >= this.config.maxQueueSize) {
      this.flush();
    }
  }

  /**
   * Capture an error forwarded from a content script or UI page via
   * the REPORT_ERROR message.  The payload is a serialised error (no
   * real Error object survives structured-clone across contexts).
   */
  async captureFromMessage(payload: {
    message: string;
    name?: string;
    stack?: string | null;
    source: ErrorSource;
    severity?: ErrorSeverity;
    metadata?: Record<string, string | number | boolean>;
  }): Promise<void> {
    const err = new Error(payload.message);
    err.name = payload.name ?? 'Error';
    if (payload.stack) err.stack = payload.stack;

    await this.captureError(err, {
      source: payload.source,
      severity: payload.severity ?? 'error',
      metadata: payload.metadata,
    });
  }

  /**
   * Flush all queued errors to the remote endpoint. If the network
   * request fails, errors are persisted to chrome.storage.local so
   * they survive a service worker shutdown and get retried on next
   * wake.
   */
  async flush(): Promise<void> {
    if (this.queue.size === 0 || this.isFlushing) return;
    this.isFlushing = true;

    const reports = Array.from(this.queue.values());
    this.queue.clear();

    const payload: ErrorBatchPayload = {
      batchId: generateBatchId(),
      sentAt: new Date().toISOString(),
      extensionId: chrome.runtime.id,
      reports,
    };

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Ingest responded ${response.status}`);
      }

      if (this.config.debugMode) {
        console.log(`[ErrorTracker] Flushed ${reports.length} report(s).`);
      }
    } catch (networkError) {
      // Network failed — persist to storage for retry on next wake
      if (this.config.debugMode) {
        console.warn('[ErrorTracker] Flush failed, persisting to storage:', networkError);
      }
      await this.persistToStorage(reports);
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Persist error reports to chrome.storage.local, respecting the
   * `maxStorageFallback` cap to avoid consuming excessive disk.
   */
  private async persistToStorage(reports: ErrorReport[]): Promise<void> {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEY);
      let existing: ErrorReport[] = result[STORAGE_KEY] ?? [];

      existing = existing.concat(reports);

      // Cap total stored errors — keep newest
      if (existing.length > this.config.maxStorageFallback) {
        existing = existing.slice(existing.length - this.config.maxStorageFallback);
      }

      await chrome.storage.local.set({ [STORAGE_KEY]: existing });
    } catch (e) {
      console.warn('[ErrorTracker] Storage fallback failed:', e);
    }
  }

  /**
   * Manually drain the queue (e.g. when extension is about to update
   * or service worker receives a "suspend" hint).
   */
  async drainAndPersist(): Promise<void> {
    if (this.queue.size === 0) return;
    const reports = Array.from(this.queue.values());
    this.queue.clear();
    await this.persistToStorage(reports);
  }

  /** Return current queue depth (useful for tests / debug UI). */
  get queueSize(): number {
    return this.queue.size;
  }
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function severityWeight(s: ErrorSeverity): number {
  switch (s) {
    case 'fatal':   return 4;
    case 'error':   return 3;
    case 'warning': return 2;
    case 'info':    return 1;
    default:        return 0;
  }
}

function getEmptyContext(): FocusModeErrorContext {
  return {
    sessionState: 'unknown',
    timerRemainingSec: null,
    sessionCount: 0,
    focusScore: null,
    streakCount: 0,
    streakAtRisk: false,
    licenseTier: 'unknown',
    licenseExpiry: null,
    blockedSitesCount: 0,
    nuclearModeActive: false,
    activeSchedule: false,
    installedDays: 0,
  };
}

/* ------------------------------------------------------------------ */
/*  Singleton                                                         */
/* ------------------------------------------------------------------ */

/**
 * Singleton instance — import this from anywhere in the background
 * context. Call `errorTracker.init()` once during service worker
 * bootstrap.
 */
export const errorTracker = new ErrorTracker();

/**
 * Convenience wrapper for chrome API calls that checks lastError.
 * Usage:
 *   const tabs = await wrapChromeCall(() => chrome.tabs.query({active: true}));
 */
export async function wrapChromeCall<T>(
  fn: () => Promise<T>,
  callName?: string
): Promise<T> {
  try {
    const result = await fn();
    if (chrome.runtime.lastError) {
      errorTracker.captureError(
        new Error(chrome.runtime.lastError.message ?? 'Unknown chrome API error'),
        {
          source: 'service-worker',
          severity: 'warning',
          metadata: { chromeApi: callName ?? 'unknown' },
        }
      );
    }
    return result;
  } catch (e) {
    errorTracker.captureError(e instanceof Error ? e : new Error(String(e)), {
      source: 'service-worker',
      severity: 'error',
      metadata: { chromeApi: callName ?? 'unknown' },
    });
    throw e;
  }
}
```

---

### 1.2 Content Script Error Capture

**File: `src/content/error-capture.ts`**

Content scripts (detector.js, blocker.js, tracker.js) run in the context of every page the user visits. This module must be extremely lean (under 1 KB minified) and must only capture errors that originate from the Focus Mode extension itself, never from the host page.

```typescript
// src/content/error-capture.ts
// ─────────────────────────────────────────────────────────────────────
// Focus Mode - Blocker — Content Script Error Capture
// Ultra-lightweight error forwarder (<1KB minified).
// Filters to extension-only errors, forwards via REPORT_ERROR message.
// ─────────────────────────────────────────────────────────────────────

/**
 * The content script that imports this module must set SCRIPT_NAME
 * before calling `initContentErrorCapture()`.
 *
 *   import { initContentErrorCapture } from './error-capture';
 *   initContentErrorCapture('detector');
 */

type ContentScriptName = 'detector' | 'blocker' | 'tracker';

/** Shape of the REPORT_ERROR message sent to the background. */
interface ErrorPayload {
  action: 'REPORT_ERROR';
  data: {
    message: string;
    name: string;
    stack: string | null;
    source: string;
    severity: string;
    metadata: Record<string, string | number | boolean>;
    timestamp: string;
  };
}

/** Matches URLs that belong to our extension. */
const EXT_URL_PREFIX = `chrome-extension://${chrome.runtime.id}`;

/** LocalStorage key used as fallback when service worker is inactive. */
const LS_FALLBACK_KEY = 'fm_pending_content_errors';
const LS_FALLBACK_MAX = 20;

/**
 * Determine whether a stack trace (or filename) originates from this
 * extension. Host-page errors are ignored entirely.
 */
function isOurError(stack: string | undefined, filename?: string): boolean {
  if (filename && filename.startsWith(EXT_URL_PREFIX)) return true;
  if (stack && stack.includes(EXT_URL_PREFIX)) return true;
  return false;
}

/**
 * Send error payload to background via chrome.runtime.sendMessage.
 * If the service worker is asleep or unreachable, fall back to
 * localStorage so errors can be recovered later.
 */
function sendToBackground(payload: ErrorPayload): void {
  try {
    chrome.runtime.sendMessage(payload, (response) => {
      // chrome.runtime.lastError is set if the service worker was
      // unreachable (e.g. during update, or killed by the browser)
      if (chrome.runtime.lastError) {
        storeInLocalFallback(payload);
      }
    });
  } catch {
    storeInLocalFallback(payload);
  }
}

/**
 * Persist error payload to localStorage as a fallback.
 * Capped at LS_FALLBACK_MAX entries (FIFO eviction).
 */
function storeInLocalFallback(payload: ErrorPayload): void {
  try {
    const raw = localStorage.getItem(LS_FALLBACK_KEY);
    const queue: ErrorPayload['data'][] = raw ? JSON.parse(raw) : [];
    queue.push(payload.data);
    // FIFO cap
    while (queue.length > LS_FALLBACK_MAX) queue.shift();
    localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(queue));
  } catch {
    // localStorage may be disabled on some pages — silently fail
  }
}

/**
 * Attempt to flush any errors that were saved in localStorage fallback.
 * Called once on initialisation so that errors from a previous page load
 * where the service worker was unavailable still get shipped.
 */
function flushLocalFallback(): void {
  try {
    const raw = localStorage.getItem(LS_FALLBACK_KEY);
    if (!raw) return;
    const queue: ErrorPayload['data'][] = JSON.parse(raw);
    if (queue.length === 0) return;

    // Send as a single batch message
    chrome.runtime.sendMessage(
      { action: 'REPORT_ERRORS_BATCH', data: queue },
      (response) => {
        if (!chrome.runtime.lastError && response?.ok) {
          localStorage.removeItem(LS_FALLBACK_KEY);
        }
      }
    );
  } catch {
    // Ignore — will retry next time
  }
}

/* ------------------------------------------------------------------ */
/*  Specific error category helpers                                   */
/* ------------------------------------------------------------------ */

/**
 * Track a block page rendering failure — called from blocker.js when
 * the motivational block page fails to render or inject.
 */
export function trackBlockPageError(error: Error, detail?: string): void {
  sendToBackground({
    action: 'REPORT_ERROR',
    data: {
      message: error.message,
      name: error.name,
      stack: error.stack ?? null,
      source: 'content-blocker',
      severity: 'error',
      metadata: {
        category: 'block_page_render',
        detail: detail ?? '',
      },
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Track a detector script issue — e.g. MutationObserver failing,
 * URL match logic throwing.
 */
export function trackDetectorError(error: Error, detail?: string): void {
  sendToBackground({
    action: 'REPORT_ERROR',
    data: {
      message: error.message,
      name: error.name,
      stack: error.stack ?? null,
      source: 'content-detector',
      severity: 'error',
      metadata: {
        category: 'detector_failure',
        detail: detail ?? '',
      },
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Track a tracker injection or data-gathering problem.
 */
export function trackTrackerError(error: Error, detail?: string): void {
  sendToBackground({
    action: 'REPORT_ERROR',
    data: {
      message: error.message,
      name: error.name,
      stack: error.stack ?? null,
      source: 'content-tracker',
      severity: 'warning',
      metadata: {
        category: 'tracker_injection',
        detail: detail ?? '',
      },
      timestamp: new Date().toISOString(),
    },
  });
}

/* ------------------------------------------------------------------ */
/*  Init                                                              */
/* ------------------------------------------------------------------ */

/**
 * Call once per content script to wire up global error and
 * unhandledrejection listeners filtered to extension-only errors.
 *
 * @param scriptName - Which content script is loading this module.
 *
 * Usage (at the top of detector.js):
 *   import { initContentErrorCapture } from './error-capture';
 *   initContentErrorCapture('detector');
 */
export function initContentErrorCapture(scriptName: ContentScriptName): void {
  const sourceTag = `content-${scriptName}` as const;

  // --- Global error listener (synchronous throws) ---
  window.addEventListener('error', (event: ErrorEvent) => {
    if (!isOurError(event.error?.stack, event.filename)) return;

    sendToBackground({
      action: 'REPORT_ERROR',
      data: {
        message: event.message ?? 'Unknown content script error',
        name: event.error?.name ?? 'Error',
        stack: event.error?.stack ?? null,
        source: sourceTag,
        severity: 'error',
        metadata: {
          filename: event.filename ?? '',
          lineno: event.lineno ?? 0,
          colno: event.colno ?? 0,
        },
        timestamp: new Date().toISOString(),
      },
    });
  });

  // --- Unhandled promise rejections ---
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const err = reason instanceof Error ? reason : new Error(String(reason));

    // Only forward if the stack references our extension code
    if (!isOurError(err.stack)) return;

    sendToBackground({
      action: 'REPORT_ERROR',
      data: {
        message: err.message,
        name: err.name,
        stack: err.stack ?? null,
        source: sourceTag,
        severity: 'error',
        metadata: { type: 'unhandled_promise_rejection' },
        timestamp: new Date().toISOString(),
      },
    });
  });

  // --- Flush any fallback errors from previous page loads ---
  flushLocalFallback();
}
```

**Integration with each content script:**

```typescript
// src/content/detector.js — first lines
import { initContentErrorCapture, trackDetectorError } from './error-capture';
initContentErrorCapture('detector');

// Wrap critical sections:
try {
  // ... URL matching / MutationObserver logic ...
} catch (e) {
  trackDetectorError(e instanceof Error ? e : new Error(String(e)), 'url_match');
}
```

```typescript
// src/content/blocker.js — first lines
import { initContentErrorCapture, trackBlockPageError } from './error-capture';
initContentErrorCapture('blocker');

// Wrap block page injection:
try {
  // ... inject motivational block page ...
} catch (e) {
  trackBlockPageError(e instanceof Error ? e : new Error(String(e)), 'page_inject');
}
```

```typescript
// src/content/tracker.js — first lines
import { initContentErrorCapture, trackTrackerError } from './error-capture';
initContentErrorCapture('tracker');

// Wrap time-tracking logic:
try {
  // ... idle detection / time accumulation ...
} catch (e) {
  trackTrackerError(e instanceof Error ? e : new Error(String(e)), 'idle_detect');
}
```

---

### 1.3 Popup/Options/Block Page Error Handling

**File: `src/shared/ui-error-handler.ts`**

The UIErrorHandler serves the popup (380x500-580px, 6 states), the options page (8 navigation sections), the block page (full-page motivational display), and the onboarding flow (5 slides). Each UI surface registers with its page type and receives context-aware error capture tuned to the exact features rendered in that page.

```typescript
// src/shared/ui-error-handler.ts
// ─────────────────────────────────────────────────────────────────────
// Focus Mode - Blocker — UI Page Error Handler
// Unified error capture for popup, options, block page, onboarding.
// ─────────────────────────────────────────────────────────────────────

import type { ErrorSource, ErrorSeverity } from '../background/error-handler';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export type UIPageType = 'popup' | 'options' | 'block-page' | 'onboarding';

/** Maps UIPageType to its ErrorSource tag in the backend. */
const PAGE_SOURCE_MAP: Record<UIPageType, ErrorSource> = {
  'popup':      'popup',
  'options':    'options',
  'block-page': 'block-page',
  'onboarding': 'onboarding',
};

/** Specific UI feature categories for fine-grained tracking. */
export type UIFeatureCategory =
  // Popup features
  | 'timer_display'
  | 'focus_score_ring'
  | 'blocklist_management'
  | 'stats_tab'
  | 'session_controls'
  | 'popup_state_transition'
  // Block page features
  | 'motivational_quote'
  | 'block_page_stats'
  | 'back_to_work_button'
  | 'block_page_render'
  // Options page features
  | 'settings_save'
  | 'schedule_config'
  | 'sound_selection'
  | 'blocklist_import_export'
  | 'license_management'
  | 'notification_preferences'
  | 'data_export'
  | 'theme_selection'
  // Onboarding features
  | 'slide_navigation'
  | 'first_block_setup'
  | 'onboarding_completion'
  | 'permission_request'
  // Generic
  | 'general';

/** Serialised error payload for the REPORT_ERROR message. */
interface UIErrorPayload {
  action: 'REPORT_ERROR';
  data: {
    message: string;
    name: string;
    stack: string | null;
    source: ErrorSource;
    severity: ErrorSeverity;
    metadata: Record<string, string | number | boolean>;
    timestamp: string;
  };
}

/* ------------------------------------------------------------------ */
/*  UIErrorHandler                                                    */
/* ------------------------------------------------------------------ */

export class UIErrorHandler {
  private pageType: UIPageType;
  private source: ErrorSource;
  private buffer: UIErrorPayload[] = [];
  private maxBuffer = 25;
  private isAttached = false;

  constructor(pageType: UIPageType) {
    this.pageType = pageType;
    this.source = PAGE_SOURCE_MAP[pageType];
  }

  /* ---------------------------------------------------------------- */
  /*  Lifecycle                                                       */
  /* ---------------------------------------------------------------- */

  /**
   * Attach global error listeners and beforeunload flush handler.
   * Call once when the UI page loads.
   */
  init(): void {
    if (this.isAttached) return;

    // Global error listener
    window.addEventListener('error', (event: ErrorEvent) => {
      this.captureRaw({
        message: event.message ?? 'Unknown UI error',
        name: event.error?.name ?? 'Error',
        stack: event.error?.stack ?? null,
        severity: 'error',
        category: 'general',
        metadata: {
          filename: event.filename ?? '',
          lineno: event.lineno ?? 0,
          colno: event.colno ?? 0,
        },
      });
    });

    // Unhandled promise rejection listener
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const err = reason instanceof Error ? reason : new Error(String(reason));
      this.captureRaw({
        message: err.message,
        name: err.name,
        stack: err.stack ?? null,
        severity: 'error',
        category: 'general',
        metadata: { type: 'unhandled_promise_rejection' },
      });
    });

    // Flush remaining buffer when the page is closing
    window.addEventListener('beforeunload', () => {
      this.flushSync();
    });

    // Also flush on visibilitychange to hidden (covers popup close
    // which doesn't always fire beforeunload)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flushSync();
      }
    });

    this.isAttached = true;
  }

  /* ---------------------------------------------------------------- */
  /*  Public capture API                                              */
  /* ---------------------------------------------------------------- */

  /**
   * Capture a categorised error from a specific UI feature.
   *
   * Usage:
   *   uiErrorHandler.capture(err, 'timer_display', { state: 'active' });
   */
  capture(
    error: Error | string,
    category: UIFeatureCategory,
    extra?: Record<string, string | number | boolean>
  ): void {
    const err = typeof error === 'string' ? new Error(error) : error;
    this.captureRaw({
      message: err.message,
      name: err.name,
      stack: err.stack ?? null,
      severity: 'error',
      category,
      metadata: extra ?? {},
    });
  }

  /**
   * Capture a warning (non-fatal issue that degrades UX).
   */
  warn(
    message: string,
    category: UIFeatureCategory,
    extra?: Record<string, string | number | boolean>
  ): void {
    this.captureRaw({
      message,
      name: 'Warning',
      stack: null,
      severity: 'warning',
      category,
      metadata: extra ?? {},
    });
  }

  /* ---------------------------------------------------------------- */
  /*  Popup-specific helpers                                          */
  /* ---------------------------------------------------------------- */

  /** Timer display failed to render or update. */
  captureTimerError(error: Error, popupState?: string): void {
    this.capture(error, 'timer_display', {
      popup_state: popupState ?? 'unknown',
    });
  }

  /** Focus Score ring SVG rendering or calculation error. */
  captureFocusScoreError(error: Error): void {
    this.capture(error, 'focus_score_ring');
  }

  /** Blocklist add/remove/edit failed in the popup blocklist tab. */
  captureBlocklistError(error: Error, operation: 'add' | 'remove' | 'edit'): void {
    this.capture(error, 'blocklist_management', { operation });
  }

  /** Stats tab chart or data rendering error. */
  captureStatsError(error: Error): void {
    this.capture(error, 'stats_tab');
  }

  /** Popup state transition error (e.g. default -> active_session). */
  captureStateTransitionError(error: Error, from: string, to: string): void {
    this.capture(error, 'popup_state_transition', {
      from_state: from,
      to_state: to,
    });
  }

  /* ---------------------------------------------------------------- */
  /*  Block page-specific helpers                                     */
  /* ---------------------------------------------------------------- */

  /** Motivational quote failed to load or render. */
  captureQuoteError(error: Error): void {
    this.capture(error, 'motivational_quote');
  }

  /** Block page stats (streak, Focus Score) display error. */
  captureBlockPageStatsError(error: Error): void {
    this.capture(error, 'block_page_stats');
  }

  /** "Back to Work" button click handler or navigation error. */
  captureBackToWorkError(error: Error): void {
    this.capture(error, 'back_to_work_button');
  }

  /** Block page render/injection error. */
  captureBlockPageRenderError(error: Error): void {
    this.capture(error, 'block_page_render');
  }

  /* ---------------------------------------------------------------- */
  /*  Options page-specific helpers                                   */
  /* ---------------------------------------------------------------- */

  /** Settings save (chrome.storage.sync.set) error. */
  captureSettingsSaveError(error: Error, section?: string): void {
    this.capture(error, 'settings_save', { section: section ?? '' });
  }

  /** Schedule configuration error (time picker, day selector). */
  captureScheduleError(error: Error): void {
    this.capture(error, 'schedule_config');
  }

  /** Focus/break sound selection or playback error. */
  captureSoundError(error: Error, soundId?: string): void {
    this.capture(error, 'sound_selection', { sound_id: soundId ?? '' });
  }

  /* ---------------------------------------------------------------- */
  /*  Onboarding-specific helpers                                     */
  /* ---------------------------------------------------------------- */

  /** Slide navigation error (e.g. swipe handler, step indicator). */
  captureSlideError(error: Error, slideIndex: number): void {
    this.capture(error, 'slide_navigation', { slide_index: slideIndex });
  }

  /** First-block setup error (initial blocklist config). */
  captureFirstBlockSetupError(error: Error): void {
    this.capture(error, 'first_block_setup');
  }

  /** Onboarding completion callback error. */
  captureOnboardingCompletionError(error: Error): void {
    this.capture(error, 'onboarding_completion');
  }

  /* ---------------------------------------------------------------- */
  /*  Internal                                                        */
  /* ---------------------------------------------------------------- */

  private captureRaw(params: {
    message: string;
    name: string;
    stack: string | null;
    severity: ErrorSeverity;
    category: UIFeatureCategory;
    metadata: Record<string, string | number | boolean>;
  }): void {
    const payload: UIErrorPayload = {
      action: 'REPORT_ERROR',
      data: {
        message: params.message,
        name: params.name,
        stack: params.stack,
        source: this.source,
        severity: params.severity,
        metadata: {
          ...params.metadata,
          page_type: this.pageType,
          ui_category: params.category,
        },
        timestamp: new Date().toISOString(),
      },
    };

    this.buffer.push(payload);

    // Immediate send for fatal / high-severity errors
    if (params.severity === 'fatal') {
      this.flushAsync();
      return;
    }

    // Flush if buffer is full
    if (this.buffer.length >= this.maxBuffer) {
      this.flushAsync();
    }
  }

  /**
   * Async flush — sends each buffered error to the background via
   * chrome.runtime.sendMessage.
   */
  private async flushAsync(): Promise<void> {
    if (this.buffer.length === 0) return;
    const batch = this.buffer.splice(0);

    // If we have multiple, send as a batch
    if (batch.length > 1) {
      try {
        await chrome.runtime.sendMessage({
          action: 'REPORT_ERRORS_BATCH',
          data: batch.map((p) => p.data),
        });
      } catch {
        // Service worker unreachable — errors are lost (UI is closing anyway)
      }
    } else {
      try {
        await chrome.runtime.sendMessage(batch[0]);
      } catch {
        // Same fallback reasoning as above
      }
    }
  }

  /**
   * Synchronous flush via sendMessage (fire-and-forget). Used in
   * beforeunload where we cannot await.
   */
  private flushSync(): void {
    if (this.buffer.length === 0) return;
    const batch = this.buffer.splice(0);

    try {
      if (batch.length > 1) {
        chrome.runtime.sendMessage({
          action: 'REPORT_ERRORS_BATCH',
          data: batch.map((p) => p.data),
        });
      } else {
        chrome.runtime.sendMessage(batch[0]);
      }
    } catch {
      // Best-effort — page is unloading
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Factory helpers for each page                                     */
/* ------------------------------------------------------------------ */

/**
 * Create and initialise a UIErrorHandler for the popup.
 * Call at the top of popup/main.ts:
 *
 *   import { createPopupErrorHandler } from '../shared/ui-error-handler';
 *   const errHandler = createPopupErrorHandler();
 */
export function createPopupErrorHandler(): UIErrorHandler {
  const handler = new UIErrorHandler('popup');
  handler.init();
  return handler;
}

/** For the options page (options/main.ts). */
export function createOptionsErrorHandler(): UIErrorHandler {
  const handler = new UIErrorHandler('options');
  handler.init();
  return handler;
}

/** For the block page (block-page/main.ts). */
export function createBlockPageErrorHandler(): UIErrorHandler {
  const handler = new UIErrorHandler('block-page');
  handler.init();
  return handler;
}

/** For the onboarding flow (onboarding/main.ts). */
export function createOnboardingErrorHandler(): UIErrorHandler {
  const handler = new UIErrorHandler('onboarding');
  handler.init();
  return handler;
}
```

**Usage in each page:**

```typescript
// src/popup/main.ts
import { createPopupErrorHandler } from '../shared/ui-error-handler';

const errHandler = createPopupErrorHandler();

// Wrap timer rendering
function updateTimerDisplay(remainingSec: number): void {
  try {
    const minutes = Math.floor(remainingSec / 60);
    const seconds = remainingSec % 60;
    timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  } catch (e) {
    errHandler.captureTimerError(
      e instanceof Error ? e : new Error(String(e)),
      getCurrentPopupState() // 'default' | 'active_session' | 'post_session' etc.
    );
  }
}

// Wrap Focus Score ring update
function renderFocusScoreRing(score: number): void {
  try {
    // ... SVG arc calculation, animation ...
  } catch (e) {
    errHandler.captureFocusScoreError(e instanceof Error ? e : new Error(String(e)));
  }
}
```

```typescript
// src/block-page/main.ts
import { createBlockPageErrorHandler } from '../shared/ui-error-handler';

const errHandler = createBlockPageErrorHandler();

// Wrap motivational quote display
async function showMotivationalQuote(): Promise<void> {
  try {
    const quote = await getRandomQuote();
    quoteElement.textContent = quote.text;
    authorElement.textContent = `— ${quote.author}`;
  } catch (e) {
    errHandler.captureQuoteError(e instanceof Error ? e : new Error(String(e)));
    // Graceful fallback — show a default quote
    quoteElement.textContent = 'Stay focused. You\'ve got this.';
    authorElement.textContent = '';
  }
}
```

```typescript
// src/options/main.ts
import { createOptionsErrorHandler } from '../shared/ui-error-handler';

const errHandler = createOptionsErrorHandler();

// Wrap settings persistence
async function saveSettings(section: string, data: Record<string, unknown>): Promise<void> {
  try {
    await chrome.storage.sync.set({ [section]: data });
  } catch (e) {
    errHandler.captureSettingsSaveError(
      e instanceof Error ? e : new Error(String(e)),
      section
    );
    showToast('Failed to save settings. Please try again.');
  }
}
```

---

### 1.4 Background Message Handler Integration

This section shows how the `REPORT_ERROR` and `REPORT_ERRORS_BATCH` message types integrate with Focus Mode - Blocker's existing 22 message types in the service worker message router.

**Integration into `src/background/service-worker.js`:**

```typescript
// src/background/service-worker.js (relevant additions)
// ─────────────────────────────────────────────────────────────────────
// Focus Mode - Blocker — Service Worker Message Router
// Integration of REPORT_ERROR / REPORT_ERRORS_BATCH with existing
// 22 message types.
// ─────────────────────────────────────────────────────────────────────

import { errorTracker } from './error-handler';

// Initialise error tracking on service worker boot (before other modules)
errorTracker.init().catch((e) => {
  console.warn('[ServiceWorker] ErrorTracker init failed:', e);
});

// ─── Existing message listener (extended) ───

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { action, data } = message;

  switch (action) {
    // ─── Existing Focus Mode message types (22 total) ───
    case 'GET_SETTINGS':
      handleGetSettings(sendResponse);
      return true;

    case 'UPDATE_BLOCKLIST':
      handleUpdateBlocklist(data, sendResponse);
      return true;

    case 'START_SESSION':
      handleStartSession(data, sendResponse);
      return true;

    case 'END_SESSION':
      handleEndSession(data, sendResponse);
      return true;

    case 'GET_FOCUS_SCORE':
      handleGetFocusScore(sendResponse);
      return true;

    case 'CHECK_LICENSE':
      handleCheckLicense(sendResponse);
      return true;

    // ... remaining 16 existing message types ...

    // ─── NEW: Error reporting messages (2 new types) ───

    case 'REPORT_ERROR':
      handleReportError(data, sender);
      sendResponse({ ok: true });
      return false; // synchronous response

    case 'REPORT_ERRORS_BATCH':
      handleReportErrorsBatch(data, sender);
      sendResponse({ ok: true });
      return false;

    default:
      // Unknown message type — log as warning for debugging
      errorTracker.captureError(
        new Error(`Unknown message action: ${action}`),
        { source: 'service-worker', severity: 'warning' }
      );
      sendResponse({ error: 'Unknown action' });
      return false;
  }
});

/* ------------------------------------------------------------------ */
/*  Error message handlers                                            */
/* ------------------------------------------------------------------ */

/**
 * Handle a single REPORT_ERROR from content script, popup, options,
 * block page, or onboarding.
 */
function handleReportError(
  data: {
    message: string;
    name?: string;
    stack?: string | null;
    source: string;
    severity?: string;
    metadata?: Record<string, string | number | boolean>;
    timestamp?: string;
  },
  sender: chrome.runtime.MessageSender
): void {
  // Enrich with sender tab information (if from content script)
  const enrichedMetadata: Record<string, string | number | boolean> = {
    ...(data.metadata ?? {}),
  };

  if (sender.tab?.id) {
    enrichedMetadata['sender_tab_id'] = sender.tab.id;
    // Do NOT include sender.tab.url — privacy: blocked domains must not leak
  }
  if (sender.frameId !== undefined) {
    enrichedMetadata['sender_frame_id'] = sender.frameId;
  }

  errorTracker.captureFromMessage({
    message: data.message,
    name: data.name,
    stack: data.stack,
    source: data.source as any,
    severity: (data.severity as any) ?? 'error',
    metadata: enrichedMetadata,
  });
}

/**
 * Handle REPORT_ERRORS_BATCH — an array of error payloads, typically
 * flushed from a content-script localStorage fallback or a UI page
 * closing via beforeunload.
 */
function handleReportErrorsBatch(
  data: Array<{
    message: string;
    name?: string;
    stack?: string | null;
    source: string;
    severity?: string;
    metadata?: Record<string, string | number | boolean>;
    timestamp?: string;
  }>,
  sender: chrome.runtime.MessageSender
): void {
  if (!Array.isArray(data)) return;

  for (const item of data) {
    handleReportError(item, sender);
  }
}

/* ------------------------------------------------------------------ */
/*  Process pending errors on service worker startup                  */
/* ------------------------------------------------------------------ */

/**
 * When the service worker wakes up (due to an alarm, message, or
 * event), it calls errorTracker.init() which rehydrates persisted
 * errors from chrome.storage.local. This ensures errors captured
 * while the worker was asleep (via content script localStorage
 * fallback or storage persistence) are not lost.
 *
 * The rehydration is handled internally by ErrorTracker.init() —
 * see Section 1.1 `rehydrateFromStorage`.
 */

// Flush errors before the service worker is suspended
// (Chrome does not guarantee a "suspend" event, but runtime.onSuspend
//  is available in some contexts)
chrome.runtime.onSuspend?.addListener(() => {
  errorTracker.drainAndPersist();
});

// On extension update, drain and persist so no errors are lost
chrome.runtime.onUpdateAvailable?.addListener(() => {
  errorTracker.drainAndPersist();
});
```

**Complete message type registry (24 total with new additions):**

| # | Action | Direction | Handler |
|---|--------|-----------|---------|
| 1 | `GET_SETTINGS` | UI -> BG | Return user settings |
| 2 | `UPDATE_BLOCKLIST` | UI -> BG | Add/remove blocked sites |
| 3 | `START_SESSION` | UI -> BG | Start focus session |
| 4 | `END_SESSION` | UI -> BG | End focus session |
| 5 | `GET_FOCUS_SCORE` | UI -> BG | Return current Focus Score |
| 6 | `CHECK_LICENSE` | UI -> BG | Validate license tier |
| 7 | `GET_STATS` | UI -> BG | Return session statistics |
| 8 | `GET_STREAK` | UI -> BG | Return streak data |
| 9 | `TOGGLE_NUCLEAR` | UI -> BG | Activate/deactivate nuclear mode |
| 10 | `UPDATE_SCHEDULE` | UI -> BG | Set focus schedule |
| 11 | `GET_BLOCKLIST` | UI -> BG | Return current blocklist |
| 12 | `PAUSE_SESSION` | UI -> BG | Pause active session |
| 13 | `RESUME_SESSION` | UI -> BG | Resume paused session |
| 14 | `GET_SESSION_STATE` | UI -> BG | Return current session state |
| 15 | `UPDATE_SETTINGS` | UI -> BG | Persist settings change |
| 16 | `GET_ONBOARDING_STATE` | UI -> BG | Check onboarding progress |
| 17 | `COMPLETE_ONBOARDING` | UI -> BG | Mark onboarding as done |
| 18 | `LOG_ANALYTICS` | CS/UI -> BG | Record an analytics event |
| 19 | `GET_BLOCK_INFO` | CS -> BG | Block page requests data to display |
| 20 | `SITE_DETECTED` | CS -> BG | Detector found a blocked site |
| 21 | `TRACKER_HEARTBEAT` | CS -> BG | Tracker sends time-on-site ping |
| 22 | `CHECK_PAYWALL` | UI -> BG | Evaluate paywall trigger conditions |
| **23** | **`REPORT_ERROR`** | **CS/UI -> BG** | **Single error report (new)** |
| **24** | **`REPORT_ERRORS_BATCH`** | **CS/UI -> BG** | **Batched error reports (new)** |

---

### 1.5 Error Context Enrichment

**File: `src/shared/error-context.ts`**

Every error report is enriched with a snapshot of Focus Mode - Blocker's current state. This context makes errors actionable: an engineer can immediately see whether the error happened during an active session, whether nuclear mode was on, what the user's license tier is, and so on, without needing to reproduce the exact state.

```typescript
// src/shared/error-context.ts
// ─────────────────────────────────────────────────────────────────────
// Focus Mode - Blocker — Error Context Enrichment
// Gathers a privacy-safe snapshot of extension state at error time.
// ─────────────────────────────────────────────────────────────────────

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

/** Possible session states in Focus Mode. */
export type SessionState =
  | 'idle'
  | 'focusing'
  | 'break'
  | 'long-break'
  | 'paused'
  | 'unknown';

/** License tier as surfaced to the error reporting system. */
export type LicenseTier = 'free' | 'pro' | 'lifetime' | 'unknown';

/**
 * A privacy-safe snapshot of Focus Mode state attached to every
 * error report.
 *
 * PRIVACY RULES:
 * - NEVER include blocked site domain names or URLs.
 * - NEVER include the user's license key or Stripe customer ID.
 * - NEVER include personally identifiable information.
 * - Counts and enum states only.
 */
export interface FocusModeErrorContext {
  /** Current session state. */
  sessionState: SessionState;
  /** Seconds remaining on the current timer leg (null if idle). */
  timerRemainingSec: number | null;
  /** Total completed focus sessions today. */
  sessionCount: number;
  /** Current Focus Score 0-100 (null if not yet calculated). */
  focusScore: number | null;
  /** Current streak count in days. */
  streakCount: number;
  /** Whether the streak is at risk of breaking today. */
  streakAtRisk: boolean;
  /** License tier (free / pro / lifetime). */
  licenseTier: LicenseTier;
  /** License expiry ISO date string (null for free / lifetime). */
  licenseExpiry: string | null;
  /** Number of sites on the blocklist (count only, never domains). */
  blockedSitesCount: number;
  /** Whether nuclear mode is currently active. */
  nuclearModeActive: boolean;
  /** Whether a focus schedule is currently active. */
  activeSchedule: boolean;
  /** Days since extension was installed (for cohort analysis). */
  installedDays: number;
}

/* ------------------------------------------------------------------ */
/*  Storage key constants (must match the main extension storage)     */
/* ------------------------------------------------------------------ */

const STORAGE_KEYS = {
  SESSION_STATE:   'fm_session_state',
  TIMER_END:       'fm_timer_end_time',
  SESSION_COUNT:   'fm_session_count_today',
  FOCUS_SCORE:     'fm_focus_score',
  STREAK:          'fm_streak',
  STREAK_LAST_DAY: 'fm_streak_last_active_day',
  LICENSE:         'fm_license',
  BLOCKLIST:       'fm_blocklist',
  NUCLEAR:         'fm_nuclear_mode',
  SCHEDULE:        'fm_active_schedule',
  INSTALL_DATE:    'fm_install_date',
} as const;

/* ------------------------------------------------------------------ */
/*  Context builder                                                   */
/* ------------------------------------------------------------------ */

/**
 * Gather the current Focus Mode error context from chrome.storage.
 *
 * This function is designed to be as resilient as possible: if any
 * individual piece of state fails to read, it uses a safe default
 * rather than throwing.
 *
 * Call from the background (service worker) where chrome.storage
 * access is reliable. Content scripts and UI pages should let the
 * background gather context via the REPORT_ERROR handler.
 */
export async function getFocusModeErrorContext(): Promise<FocusModeErrorContext> {
  const context: FocusModeErrorContext = {
    sessionState: 'unknown',
    timerRemainingSec: null,
    sessionCount: 0,
    focusScore: null,
    streakCount: 0,
    streakAtRisk: false,
    licenseTier: 'unknown',
    licenseExpiry: null,
    blockedSitesCount: 0,
    nuclearModeActive: false,
    activeSchedule: false,
    installedDays: 0,
  };

  try {
    // Read all needed keys in a single call to minimise overhead
    const result = await chrome.storage.local.get([
      STORAGE_KEYS.SESSION_STATE,
      STORAGE_KEYS.TIMER_END,
      STORAGE_KEYS.SESSION_COUNT,
      STORAGE_KEYS.FOCUS_SCORE,
      STORAGE_KEYS.STREAK,
      STORAGE_KEYS.STREAK_LAST_DAY,
      STORAGE_KEYS.LICENSE,
      STORAGE_KEYS.BLOCKLIST,
      STORAGE_KEYS.NUCLEAR,
      STORAGE_KEYS.SCHEDULE,
      STORAGE_KEYS.INSTALL_DATE,
    ]);

    // --- Session state ---
    context.sessionState = mapSessionState(result[STORAGE_KEYS.SESSION_STATE]);

    // --- Timer remaining ---
    const timerEnd = result[STORAGE_KEYS.TIMER_END];
    if (timerEnd && typeof timerEnd === 'number') {
      const remaining = Math.max(0, Math.round((timerEnd - Date.now()) / 1000));
      context.timerRemainingSec = remaining;
    }

    // --- Session count today ---
    context.sessionCount = safeNumber(result[STORAGE_KEYS.SESSION_COUNT], 0);

    // --- Focus Score ---
    const rawScore = result[STORAGE_KEYS.FOCUS_SCORE];
    if (typeof rawScore === 'number' && rawScore >= 0 && rawScore <= 100) {
      context.focusScore = Math.round(rawScore);
    }

    // --- Streak ---
    const streakData = result[STORAGE_KEYS.STREAK];
    if (streakData && typeof streakData === 'object') {
      context.streakCount = safeNumber(streakData.count, 0);
    } else if (typeof streakData === 'number') {
      context.streakCount = streakData;
    }

    // --- Streak at risk ---
    const lastActiveDay = result[STORAGE_KEYS.STREAK_LAST_DAY];
    if (lastActiveDay && typeof lastActiveDay === 'string') {
      context.streakAtRisk = isStreakAtRisk(lastActiveDay);
    }

    // --- License ---
    const license = result[STORAGE_KEYS.LICENSE];
    if (license && typeof license === 'object') {
      context.licenseTier = mapLicenseTier(license.tier);
      // Only include expiry month/year for debugging, never the full date
      if (license.expiresAt) {
        const d = new Date(license.expiresAt);
        context.licenseExpiry = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      }
    }

    // --- Blocklist count (NEVER include actual domains) ---
    const blocklist = result[STORAGE_KEYS.BLOCKLIST];
    if (Array.isArray(blocklist)) {
      context.blockedSitesCount = blocklist.length;
    }

    // --- Nuclear mode ---
    const nuclear = result[STORAGE_KEYS.NUCLEAR];
    if (nuclear && typeof nuclear === 'object') {
      context.nuclearModeActive = nuclear.active === true;
    } else {
      context.nuclearModeActive = nuclear === true;
    }

    // --- Active schedule ---
    const schedule = result[STORAGE_KEYS.SCHEDULE];
    if (schedule && typeof schedule === 'object') {
      context.activeSchedule = schedule.enabled === true;
    }

    // --- Install age ---
    const installDate = result[STORAGE_KEYS.INSTALL_DATE];
    if (installDate) {
      const install = new Date(installDate);
      const now = new Date();
      context.installedDays = Math.floor(
        (now.getTime() - install.getTime()) / (1000 * 60 * 60 * 24)
      );
    }
  } catch (e) {
    // If the entire storage read fails, return the default context
    // with 'unknown' values rather than crashing the error reporter
    console.warn('[ErrorContext] Failed to gather context:', e);
  }

  return context;
}

/* ------------------------------------------------------------------ */
/*  Lightweight context for content scripts / UI pages                */
/* ------------------------------------------------------------------ */

/**
 * A minimal context gatherer that can be called from content scripts
 * or UI pages using chrome.storage.session (faster, no disk I/O).
 *
 * This is intentionally limited — the full context is gathered by
 * the background error handler when it processes REPORT_ERROR.
 */
export async function getMinimalContext(): Promise<Partial<FocusModeErrorContext>> {
  try {
    // chrome.storage.session is in-memory and fast
    const result = await chrome.storage.session.get([
      STORAGE_KEYS.SESSION_STATE,
      STORAGE_KEYS.NUCLEAR,
    ]);
    return {
      sessionState: mapSessionState(result[STORAGE_KEYS.SESSION_STATE]),
      nuclearModeActive: result[STORAGE_KEYS.NUCLEAR] === true,
    };
  } catch {
    return {};
  }
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function mapSessionState(raw: unknown): SessionState {
  const valid: SessionState[] = ['idle', 'focusing', 'break', 'long-break', 'paused'];
  if (typeof raw === 'string' && valid.includes(raw as SessionState)) {
    return raw as SessionState;
  }
  return 'unknown';
}

function mapLicenseTier(raw: unknown): LicenseTier {
  const valid: LicenseTier[] = ['free', 'pro', 'lifetime'];
  if (typeof raw === 'string' && valid.includes(raw as LicenseTier)) {
    return raw as LicenseTier;
  }
  return 'unknown';
}

function safeNumber(val: unknown, fallback: number): number {
  return typeof val === 'number' && Number.isFinite(val) ? val : fallback;
}

/**
 * Determine if the streak is at risk: the last active day is
 * yesterday or earlier, and the user hasn't completed a session today.
 */
function isStreakAtRisk(lastActiveDayStr: string): boolean {
  try {
    const lastActive = new Date(lastActiveDayStr);
    const today = new Date();
    // Zero-out time for date comparison
    lastActive.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.floor(
      (today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
    );
    // At risk if last active day was yesterday (diff = 1)
    // Already broken if diff >= 2, but we still flag it
    return diffDays >= 1;
  } catch {
    return false;
  }
}
```

---

## 2. Sentry Integration for Focus Mode

### 2.1 Service Worker Sentry Setup

**File: `src/background/sentry-init.ts`**

Sentry must be configured specifically for the MV3 service worker environment: no DOM access, no XMLHttpRequest, and the `makeFetchTransport` must be used. The `beforeSend` hook is critical for privacy: it scrubs license keys and blocked site domains from every event before it leaves the device.

```typescript
// src/background/sentry-init.ts
// ─────────────────────────────────────────────────────────────────────
// Focus Mode - Blocker — Sentry Initialisation for Service Worker
// MV3-compatible Sentry setup with privacy-first filtering.
// ─────────────────────────────────────────────────────────────────────

import * as Sentry from '@sentry/browser';
import {
  makeFetchTransport,
  defaultStackParser,
  dedupeIntegration,
  functionToStringIntegration,
  inboundFiltersIntegration,
} from '@sentry/browser';
import { getFocusModeErrorContext, type FocusModeErrorContext } from '../shared/error-context';

/* ------------------------------------------------------------------ */
/*  Configuration constants                                           */
/* ------------------------------------------------------------------ */

/** Sentry DSN — set via build environment variable. */
const SENTRY_DSN = process.env.SENTRY_DSN ?? '__SENTRY_DSN__';

/** Current extension version from manifest. */
const EXTENSION_VERSION = chrome.runtime.getManifest().version;

/** Environment tag derived from build mode. */
const ENVIRONMENT: 'production' | 'staging' | 'development' =
  process.env.NODE_ENV === 'production'
    ? 'production'
    : process.env.NODE_ENV === 'staging'
      ? 'staging'
      : 'development';

/** Privacy scrubbing patterns (same as error-handler.ts). */
const SCRUB_PATTERNS = {
  licenseKey: /FM-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}/gi,
  stripeToken: /sk_(live|test)_[A-Za-z0-9]+/g,
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  externalUrl: /https?:\/\/(?!chrome-extension:)[^\s"'`,;)}\]]+/gi,
};

/* ------------------------------------------------------------------ */
/*  Focus Score band calculation (for tagging)                        */
/* ------------------------------------------------------------------ */

function focusScoreBand(score: number | null): string {
  if (score === null || score === undefined) return 'none';
  if (score >= 90) return 'excellent';  // 90-100
  if (score >= 70) return 'good';       // 70-89
  if (score >= 50) return 'fair';       // 50-69
  if (score >= 30) return 'poor';       // 30-49
  return 'critical';                     // 0-29
}

/* ------------------------------------------------------------------ */
/*  Privacy scrubbing                                                 */
/* ------------------------------------------------------------------ */

/**
 * Deep-scrub a string of all privacy-sensitive content.
 */
function scrubString(input: string): string {
  let result = input;
  result = result.replace(SCRUB_PATTERNS.licenseKey, '[REDACTED_LICENSE]');
  result = result.replace(SCRUB_PATTERNS.stripeToken, '[REDACTED_STRIPE]');
  result = result.replace(SCRUB_PATTERNS.email, '[REDACTED_EMAIL]');
  result = result.replace(SCRUB_PATTERNS.externalUrl, '[REDACTED_URL]');
  return result;
}

/**
 * Recursively scrub all string values in an object. Returns a new
 * object (does not mutate the original).
 */
function scrubObject(obj: Record<string, unknown>): Record<string, unknown> {
  const scrubbed: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      scrubbed[key] = scrubString(value);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      scrubbed[key] = scrubObject(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      scrubbed[key] = value.map((item) =>
        typeof item === 'string'
          ? scrubString(item)
          : item && typeof item === 'object'
            ? scrubObject(item as Record<string, unknown>)
            : item
      );
    } else {
      scrubbed[key] = value;
    }
  }
  return scrubbed;
}

/**
 * Scrub stack frames: remove any frames that don't belong to our
 * extension, and scrub filenames in remaining frames.
 */
function scrubStackFrames(
  frames: Sentry.StackFrame[] | undefined
): Sentry.StackFrame[] | undefined {
  if (!frames) return frames;
  return frames.map((frame) => ({
    ...frame,
    filename: frame.filename ? scrubString(frame.filename) : frame.filename,
    abs_path: frame.abs_path ? scrubString(frame.abs_path) : frame.abs_path,
  }));
}

/* ------------------------------------------------------------------ */
/*  Sentry initialisation                                             */
/* ------------------------------------------------------------------ */

/**
 * Initialise Sentry for the Focus Mode service worker.
 *
 * Call once at the top of service-worker.js, before any other module
 * initialisation:
 *
 *   import { initSentry } from './sentry-init';
 *   initSentry();
 */
export function initSentry(): void {
  if (SENTRY_DSN === '__SENTRY_DSN__') {
    console.warn('[Sentry] No DSN configured — Sentry is disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,

    // ── Release & Environment ──
    release: `focus-mode-blocker@${EXTENSION_VERSION}`,
    environment: ENVIRONMENT,

    // ── Transport: must use fetch in MV3 service workers ──
    transport: makeFetchTransport,
    stackParser: defaultStackParser,

    // ── Integrations: only non-DOM integrations ──
    integrations: [
      dedupeIntegration(),
      functionToStringIntegration(),
      inboundFiltersIntegration(),
    ],

    // Don't use the default BrowserTracing (needs DOM)
    // Don't use Replay (needs DOM)

    // ── Sampling ──
    sampleRate: 1.0,                // Capture 100% of errors
    tracesSampleRate: 0.1,          // Sample 10% of transactions

    // ── Max breadcrumbs ──
    maxBreadcrumbs: 50,

    // ── beforeSend: privacy filter + extension-only filter ──
    beforeSend(event: Sentry.Event, hint: Sentry.EventHint): Sentry.Event | null {
      // 1. Only send errors that originate from our extension
      if (!isExtensionError(event, hint)) {
        return null; // Drop the event
      }

      // 2. Scrub the error message
      if (event.message) {
        event.message = scrubString(event.message);
      }

      // 3. Scrub exception values and stack traces
      if (event.exception?.values) {
        for (const exception of event.exception.values) {
          if (exception.value) {
            exception.value = scrubString(exception.value);
          }
          if (exception.stacktrace?.frames) {
            exception.stacktrace.frames = scrubStackFrames(
              exception.stacktrace.frames
            );
          }
        }
      }

      // 4. Scrub breadcrumb messages and data
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((crumb) => ({
          ...crumb,
          message: crumb.message ? scrubString(crumb.message) : crumb.message,
          data: crumb.data
            ? (scrubObject(crumb.data as Record<string, unknown>) as Record<string, string>)
            : crumb.data,
        }));
      }

      // 5. Scrub extra and contexts
      if (event.extra) {
        event.extra = scrubObject(event.extra as Record<string, unknown>);
      }
      if (event.contexts) {
        event.contexts = scrubObject(
          event.contexts as Record<string, unknown>
        ) as typeof event.contexts;
      }

      return event;
    },

    // ── beforeBreadcrumb: filter noisy breadcrumbs ──
    beforeBreadcrumb(breadcrumb: Sentry.Breadcrumb): Sentry.Breadcrumb | null {
      // Drop fetch breadcrumbs to external URLs (only keep our ingest calls)
      if (breadcrumb.category === 'fetch' || breadcrumb.category === 'xhr') {
        const url = breadcrumb.data?.url as string | undefined;
        if (url && !url.includes('focusmode.app') && !url.includes('sentry.io')) {
          return null;
        }
      }
      // Drop console breadcrumbs in production (too noisy)
      if (breadcrumb.category === 'console' && ENVIRONMENT === 'production') {
        return null;
      }
      return breadcrumb;
    },
  });

  // ── Set initial tags ──
  Sentry.setTag('extension_id', chrome.runtime.id);
  Sentry.setTag('manifest_version', '3');

  // ── Async context enrichment ──
  enrichSentryContext();
}

/**
 * Check whether an error event originated from our extension code,
 * not from a third-party library or the browser itself.
 */
function isExtensionError(event: Sentry.Event, hint: Sentry.EventHint): boolean {
  const extensionUrlPrefix = `chrome-extension://${chrome.runtime.id}`;

  // Check the original exception
  const originalException = hint.originalException;
  if (originalException instanceof Error && originalException.stack) {
    if (originalException.stack.includes(extensionUrlPrefix)) return true;
  }

  // Check stack frames in the event
  const frames = event.exception?.values?.[0]?.stacktrace?.frames;
  if (frames) {
    for (const frame of frames) {
      if (frame.filename?.includes(extensionUrlPrefix)) return true;
      if (frame.abs_path?.includes(extensionUrlPrefix)) return true;
    }
  }

  // If we cannot determine origin, err on the side of sending
  // (the privacy scrubber has already cleaned sensitive data)
  if (!frames && !originalException) return true;

  return false;
}

/**
 * Asynchronously gather Focus Mode context and apply it as Sentry
 * tags / user context. Called once on init and can be refreshed
 * periodically (e.g. on session state change).
 */
export async function enrichSentryContext(): Promise<void> {
  try {
    const ctx = await getFocusModeErrorContext();

    Sentry.setTags({
      license_tier: ctx.licenseTier,
      session_active: ctx.sessionState === 'focusing' || ctx.sessionState === 'break',
      session_state: ctx.sessionState,
      focus_score_band: focusScoreBand(ctx.focusScore),
      streak_length: ctx.streakCount,
      nuclear_mode: ctx.nuclearModeActive,
      blocked_sites_count: ctx.blockedSitesCount,
      install_age_days: ctx.installedDays,
    });

    // Set a pseudo user ID based on install date + extension ID
    // (no real PII — just for grouping issues by "user")
    Sentry.setUser({
      id: `${chrome.runtime.id}-${ctx.installedDays}`,
    });
  } catch {
    // Non-fatal — Sentry will still work without custom tags
  }
}

/**
 * Utility: capture an error through both our ErrorTracker and Sentry.
 * Use this in critical code paths where you want dual reporting.
 */
export function captureWithSentry(
  error: Error,
  extra?: Record<string, unknown>
): void {
  Sentry.withScope((scope) => {
    if (extra) {
      scope.setExtras(extra);
    }
    Sentry.captureException(error);
  });
}

/**
 * Refresh Sentry context tags. Call this whenever Focus Mode state
 * changes significantly (session start/end, nuclear mode toggle, etc.)
 */
export { enrichSentryContext as refreshSentryContext };
```

---

### 2.2 Content Script Sentry (Lightweight)

**File: `src/content/sentry-content.ts`**

Content scripts run on every page the user visits, so Sentry must be configured with aggressive sampling to avoid overwhelming the ingest endpoint. We also filter strictly to Focus Mode extension code.

```typescript
// src/content/sentry-content.ts
// ─────────────────────────────────────────────────────────────────────
// Focus Mode - Blocker — Lightweight Sentry for Content Scripts
// Low sample rate, strict extension-only filtering.
// ─────────────────────────────────────────────────────────────────────

import * as Sentry from '@sentry/browser';
import {
  makeFetchTransport,
  defaultStackParser,
  dedupeIntegration,
  inboundFiltersIntegration,
} from '@sentry/browser';

/* ------------------------------------------------------------------ */
/*  Configuration                                                     */
/* ------------------------------------------------------------------ */

const SENTRY_DSN = process.env.SENTRY_DSN ?? '__SENTRY_DSN__';
const EXTENSION_VERSION = chrome.runtime.getManifest().version;
const EXT_URL_PREFIX = `chrome-extension://${chrome.runtime.id}`;

const ENVIRONMENT: 'production' | 'staging' | 'development' =
  process.env.NODE_ENV === 'production'
    ? 'production'
    : process.env.NODE_ENV === 'staging'
      ? 'staging'
      : 'development';

/** Privacy scrub: remove any non-extension URL. */
function scrubExternalUrls(input: string): string {
  return input.replace(
    /https?:\/\/(?!chrome-extension:)[^\s"'`,;)}\]]+/gi,
    '[REDACTED_URL]'
  );
}

/* ------------------------------------------------------------------ */
/*  Init                                                              */
/* ------------------------------------------------------------------ */

/**
 * Initialise Sentry in a content script context.
 *
 * @param scriptName - 'detector' | 'blocker' | 'tracker'
 *
 * Usage (top of detector.js):
 *   import { initContentSentry } from './sentry-content';
 *   initContentSentry('detector');
 */
export function initContentSentry(
  scriptName: 'detector' | 'blocker' | 'tracker'
): void {
  if (SENTRY_DSN === '__SENTRY_DSN__') return;

  Sentry.init({
    dsn: SENTRY_DSN,
    release: `focus-mode-blocker@${EXTENSION_VERSION}`,
    environment: ENVIRONMENT,

    transport: makeFetchTransport,
    stackParser: defaultStackParser,

    integrations: [
      dedupeIntegration(),
      inboundFiltersIntegration(),
      // No BrowserTracing, no Replay — keep it minimal
    ],

    // ── Aggressive sampling for content scripts ──
    sampleRate: 0.5,              // 50% of errors
    tracesSampleRate: 0.01,       // 1% of transactions (very low)

    maxBreadcrumbs: 10,           // Minimal breadcrumbs in content scripts

    // ── Extension-only filter ──
    beforeSend(event, hint) {
      // Strict filter: only send if a stack frame references our extension
      const frames = event.exception?.values?.[0]?.stacktrace?.frames;
      const originalErr = hint.originalException;

      let hasExtensionFrame = false;

      if (frames) {
        hasExtensionFrame = frames.some(
          (f) =>
            f.filename?.includes(EXT_URL_PREFIX) ||
            f.abs_path?.includes(EXT_URL_PREFIX)
        );
      }

      if (
        !hasExtensionFrame &&
        originalErr instanceof Error &&
        originalErr.stack
      ) {
        hasExtensionFrame = originalErr.stack.includes(EXT_URL_PREFIX);
      }

      if (!hasExtensionFrame) return null; // Drop non-extension errors

      // Scrub external URLs from all string fields
      if (event.message) {
        event.message = scrubExternalUrls(event.message);
      }
      if (event.exception?.values) {
        for (const exc of event.exception.values) {
          if (exc.value) exc.value = scrubExternalUrls(exc.value);
        }
      }

      return event;
    },

    // ── Drop all fetch/XHR breadcrumbs (host page noise) ──
    beforeBreadcrumb(breadcrumb) {
      if (
        breadcrumb.category === 'fetch' ||
        breadcrumb.category === 'xhr' ||
        breadcrumb.category === 'console'
      ) {
        return null;
      }
      return breadcrumb;
    },
  });

  // Set content script identity tags
  Sentry.setTag('content_script', scriptName);
  Sentry.setTag('extension_id', chrome.runtime.id);
  Sentry.setTag('manifest_version', '3');
}

/**
 * Capture an error through content-script Sentry with script context.
 */
export function captureContentError(
  error: Error,
  scriptName: string,
  extra?: Record<string, unknown>
): void {
  Sentry.withScope((scope) => {
    scope.setTag('content_script', scriptName);
    if (extra) scope.setExtras(extra);
    Sentry.captureException(error);
  });
}
```

---

### 2.3 Source Map Configuration

Source maps allow Sentry to display original TypeScript source code in stack traces. They must be uploaded during the build process and then deleted from the distribution bundle for security (so users cannot inspect the original source).

#### Webpack Configuration

**File: `webpack.config.js` (relevant Sentry plugin section)**

```javascript
// webpack.config.js — Sentry source map plugin for Focus Mode - Blocker
// ─────────────────────────────────────────────────────────────────────

const { sentryWebpackPlugin } = require('@sentry/webpack-plugin');
const packageJson = require('./package.json');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const version = packageJson.version; // e.g. "1.0.0"

  return {
    // Enable source maps for production (hidden — not exposed in bundle)
    devtool: isProduction ? 'hidden-source-map' : 'inline-source-map',

    entry: {
      'background/service-worker': './src/background/service-worker.js',
      'content/detector':          './src/content/detector.js',
      'content/blocker':           './src/content/blocker.js',
      'content/tracker':           './src/content/tracker.js',
      'popup/main':                './src/popup/main.ts',
      'options/main':              './src/options/main.ts',
      'block-page/main':           './src/block-page/main.ts',
      'onboarding/main':           './src/onboarding/main.ts',
    },

    output: {
      path: __dirname + '/dist',
      filename: '[name].js',
      // Chrome extensions use chrome-extension:// protocol
      // The URL prefix must match what Sentry sees in stack traces
    },

    // ... other webpack config (loaders, resolve, etc.) ...

    plugins: [
      // ── Sentry Webpack Plugin ──
      // Only in production builds to avoid polluting dev with releases
      ...(isProduction
        ? [
            sentryWebpackPlugin({
              org: process.env.SENTRY_ORG,        // e.g. "focus-mode"
              project: process.env.SENTRY_PROJECT, // e.g. "blocker-extension"
              authToken: process.env.SENTRY_AUTH_TOKEN,

              release: {
                name: `focus-mode-blocker@${version}`,
                // Automatically finalise the release after upload
                finalize: true,
              },

              sourcemaps: {
                // Upload all .js and .map files from dist/
                assets: './dist/**',

                // URL prefix: Chrome extensions load from
                // chrome-extension://<extension-id>/
                // We use a wildcard so it matches any extension ID
                // (production, staging, dev all have different IDs)
                urlPrefix: 'chrome-extension://~/',

                // CRITICAL: Delete source maps from dist/ after upload.
                // They must NOT ship in the .crx / .zip published to
                // the Chrome Web Store — this would expose our source.
                filesToDeleteAfterUpload: './dist/**/*.map',
              },

              // Tag commits for Sentry release tracking
              setCommits: {
                auto: true,
              },

              // Fail the build if source maps cannot be uploaded
              // (ensures we never ship without Sentry tracking)
              errorHandler: (err) => {
                console.error('[Sentry] Source map upload failed:', err);
                process.exit(1);
              },

              // Only upload for tagged releases
              disable: !isProduction,

              // Telemetry opt-out
              telemetry: false,
            }),
          ]
        : []),
    ],
  };
};
```

#### Vite Configuration (Alternative)

**File: `vite.config.ts` (relevant Sentry plugin section)**

```typescript
// vite.config.ts — Sentry source map plugin for Focus Mode - Blocker
// ─────────────────────────────────────────────────────────────────────

import { defineConfig } from 'vite';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  const version = process.env.npm_package_version ?? '1.0.0';

  return {
    build: {
      // Generate source maps for production (not inlined)
      sourcemap: isProduction ? 'hidden' : true,

      rollupOptions: {
        input: {
          'service-worker': resolve(__dirname, 'src/background/service-worker.js'),
          'detector':       resolve(__dirname, 'src/content/detector.js'),
          'blocker':        resolve(__dirname, 'src/content/blocker.js'),
          'tracker':        resolve(__dirname, 'src/content/tracker.js'),
          'popup':          resolve(__dirname, 'src/popup/main.ts'),
          'options':        resolve(__dirname, 'src/options/main.ts'),
          'block-page':     resolve(__dirname, 'src/block-page/main.ts'),
          'onboarding':     resolve(__dirname, 'src/onboarding/main.ts'),
        },
        output: {
          dir: 'dist',
          entryFileNames: '[name].js',
        },
      },
    },

    plugins: [
      // ── Sentry Vite Plugin ──
      ...(isProduction
        ? [
            sentryVitePlugin({
              org: process.env.SENTRY_ORG,
              project: process.env.SENTRY_PROJECT,
              authToken: process.env.SENTRY_AUTH_TOKEN,

              release: {
                name: `focus-mode-blocker@${version}`,
                finalize: true,
              },

              sourcemaps: {
                assets: './dist/**',
                urlPrefix: 'chrome-extension://~/',
                filesToDeleteAfterUpload: './dist/**/*.map',
              },

              setCommits: {
                auto: true,
              },

              telemetry: false,

              // In Vite, the plugin runs during build — fail on error
              errorHandler: (err) => {
                console.error('[Sentry] Source map upload failed:', err);
                process.exit(1);
              },
            }),
          ]
        : []),
    ],
  };
});
```

**Key points about source map security:**

1. `devtool: 'hidden-source-map'` (Webpack) or `sourcemap: 'hidden'` (Vite) generates `.map` files but does **not** add `//# sourceMappingURL` comments to the output JS. This means browsers loading the extension cannot find the source maps.

2. `filesToDeleteAfterUpload` removes all `.map` files from the `dist/` directory after they have been uploaded to Sentry. The published extension bundle never contains source maps.

3. The `urlPrefix: 'chrome-extension://~/'` uses Sentry's tilde (`~`) wildcard, which matches any extension ID. This is necessary because production, staging, and development builds each receive a different Chrome extension ID.

---

### 2.4 Focus Mode Breadcrumbs

**File: `src/shared/sentry-breadcrumbs.ts`**

Breadcrumbs trace the user's journey through Focus Mode features leading up to an error. They are the most important debugging signal when triaging crash reports.

Every breadcrumb follows strict privacy rules: no domain names, no URLs, no license keys, no personal data. Only counts, enum states, and durations.

```typescript
// src/shared/sentry-breadcrumbs.ts
// ─────────────────────────────────────────────────────────────────────
// Focus Mode - Blocker — Sentry Breadcrumb Tracking
// Privacy-safe user action trail for crash diagnostics.
// ─────────────────────────────────────────────────────────────────────

import * as Sentry from '@sentry/browser';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

/**
 * Breadcrumb categories corresponding to Focus Mode features.
 * These appear in the Sentry issue detail breadcrumb timeline.
 */
type BreadcrumbCategory =
  | 'session'
  | 'timer'
  | 'blocklist'
  | 'focus-score'
  | 'streak'
  | 'paywall'
  | 'nuclear'
  | 'settings'
  | 'block-page'
  | 'navigation'
  | 'lifecycle';

/* ------------------------------------------------------------------ */
/*  Core breadcrumb helper                                            */
/* ------------------------------------------------------------------ */

/**
 * Add a Focus Mode breadcrumb to Sentry.
 *
 * All breadcrumbs use the 'info' level by default. Use 'warning' for
 * actions that are unusual or might indicate a problem path.
 */
function addBreadcrumb(
  category: BreadcrumbCategory,
  message: string,
  data?: Record<string, string | number | boolean>,
  level: Sentry.SeverityLevel = 'info'
): void {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level,
    timestamp: Date.now() / 1000, // Sentry expects seconds
  });
}

/* ------------------------------------------------------------------ */
/*  Session breadcrumbs                                               */
/* ------------------------------------------------------------------ */

/** User started a new focus session. */
export function breadcrumbSessionStart(durationMin: number, sessionNumber: number): void {
  addBreadcrumb('session', 'Focus session started', {
    duration_min: durationMin,
    session_number: sessionNumber,
  });
}

/** User ended a focus session (completed or manually stopped). */
export function breadcrumbSessionEnd(
  completed: boolean,
  actualDurationMin: number,
  sessionNumber: number
): void {
  addBreadcrumb('session', completed ? 'Focus session completed' : 'Focus session stopped early', {
    completed,
    actual_duration_min: actualDurationMin,
    session_number: sessionNumber,
  });
}

/** Break started (short or long). */
export function breadcrumbBreakStart(type: 'short' | 'long', durationMin: number): void {
  addBreadcrumb('session', `${type === 'long' ? 'Long' : 'Short'} break started`, {
    break_type: type,
    duration_min: durationMin,
  });
}

/** Timer tick — recorded every 5 minutes to show progression without
 *  flooding breadcrumbs. */
export function breadcrumbTimerCheckpoint(remainingMin: number, state: string): void {
  addBreadcrumb('timer', 'Timer checkpoint', {
    remaining_min: remainingMin,
    state,
  });
}

/* ------------------------------------------------------------------ */
/*  Blocklist breadcrumbs                                             */
/* ------------------------------------------------------------------ */

/**
 * Blocklist modified. PRIVACY: only include the count delta and new
 * total, NEVER the actual domain names.
 */
export function breadcrumbBlocklistAdd(newTotal: number): void {
  addBreadcrumb('blocklist', 'Site added to blocklist', {
    total_sites: newTotal,
  });
}

export function breadcrumbBlocklistRemove(newTotal: number): void {
  addBreadcrumb('blocklist', 'Site removed from blocklist', {
    total_sites: newTotal,
  });
}

export function breadcrumbBlocklistBulkImport(importedCount: number, newTotal: number): void {
  addBreadcrumb('blocklist', 'Bulk blocklist import', {
    imported_count: importedCount,
    total_sites: newTotal,
  });
}

/* ------------------------------------------------------------------ */
/*  Focus Score breadcrumbs                                           */
/* ------------------------------------------------------------------ */

/** Focus Score recalculated. */
export function breadcrumbFocusScoreCalculated(
  score: number,
  previousScore: number | null
): void {
  addBreadcrumb('focus-score', 'Focus Score calculated', {
    score,
    previous_score: previousScore ?? 0,
    delta: previousScore !== null ? score - previousScore : 0,
  });
}

/* ------------------------------------------------------------------ */
/*  Streak breadcrumbs                                                */
/* ------------------------------------------------------------------ */

/** Streak milestone reached (every 7 days, or specific milestones). */
export function breadcrumbStreakMilestone(streakDays: number): void {
  addBreadcrumb('streak', 'Streak milestone reached', {
    streak_days: streakDays,
  });
}

/** Streak broken. */
export function breadcrumbStreakBroken(previousStreak: number): void {
  addBreadcrumb('streak', 'Streak broken', {
    previous_streak: previousStreak,
  }, 'warning');
}

/** Streak extended (daily check-in). */
export function breadcrumbStreakExtended(streakDays: number): void {
  addBreadcrumb('streak', 'Streak extended', {
    streak_days: streakDays,
  });
}

/* ------------------------------------------------------------------ */
/*  Paywall breadcrumbs                                               */
/* ------------------------------------------------------------------ */

/**
 * Paywall trigger shown. Includes which trigger (T1-T10) but NOT
 * the feature attempted or any user data.
 */
export function breadcrumbPaywallShown(triggerId: string): void {
  addBreadcrumb('paywall', 'Paywall trigger shown', {
    trigger_id: triggerId,
  });
}

/** User dismissed paywall. */
export function breadcrumbPaywallDismissed(triggerId: string): void {
  addBreadcrumb('paywall', 'Paywall dismissed', {
    trigger_id: triggerId,
  });
}

/** User clicked upgrade from paywall. */
export function breadcrumbPaywallUpgradeClicked(triggerId: string): void {
  addBreadcrumb('paywall', 'Paywall upgrade clicked', {
    trigger_id: triggerId,
  });
}

/* ------------------------------------------------------------------ */
/*  Nuclear mode breadcrumbs                                          */
/* ------------------------------------------------------------------ */

/** Nuclear mode activated. */
export function breadcrumbNuclearActivated(durationMin: number): void {
  addBreadcrumb('nuclear', 'Nuclear mode activated', {
    duration_min: durationMin,
  }, 'warning');
}

/** Nuclear mode deactivated (timer expired or manual). */
export function breadcrumbNuclearDeactivated(reason: 'expired' | 'manual'): void {
  addBreadcrumb('nuclear', 'Nuclear mode deactivated', {
    reason,
  });
}

/* ------------------------------------------------------------------ */
/*  Settings breadcrumbs                                              */
/* ------------------------------------------------------------------ */

/**
 * A setting was changed. PRIVACY: only include the setting key and
 * a generalised value type, never the actual value (which might
 * contain domains, names, etc.).
 */
export function breadcrumbSettingsChanged(
  settingKey: string,
  section: string
): void {
  addBreadcrumb('settings', 'Setting changed', {
    setting_key: settingKey,
    section,
  });
}

/** Sound preference changed. */
export function breadcrumbSoundChanged(soundCategory: 'focus' | 'break' | 'notification'): void {
  addBreadcrumb('settings', 'Sound changed', {
    sound_category: soundCategory,
  });
}

/** Schedule updated. */
export function breadcrumbScheduleUpdated(enabled: boolean): void {
  addBreadcrumb('settings', 'Schedule updated', {
    enabled,
  });
}

/* ------------------------------------------------------------------ */
/*  Block page breadcrumbs                                            */
/* ------------------------------------------------------------------ */

/**
 * Block page was shown. PRIVACY: only include a count, never the
 * blocked URL or domain.
 */
export function breadcrumbBlockPageShown(totalBlocksToday: number): void {
  addBreadcrumb('block-page', 'Block page shown', {
    total_blocks_today: totalBlocksToday,
  });
}

/** User clicked "Back to Work" on the block page. */
export function breadcrumbBackToWorkClicked(): void {
  addBreadcrumb('block-page', 'Back to Work clicked');
}

/* ------------------------------------------------------------------ */
/*  Navigation / lifecycle breadcrumbs                                */
/* ------------------------------------------------------------------ */

/** Popup opened with a specific state. */
export function breadcrumbPopupOpened(state: string): void {
  addBreadcrumb('navigation', 'Popup opened', {
    popup_state: state,
  });
}

/** Options page section navigated to. */
export function breadcrumbOptionsNavigated(section: string): void {
  addBreadcrumb('navigation', 'Options section viewed', {
    section,
  });
}

/** Onboarding slide viewed. */
export function breadcrumbOnboardingSlide(slideIndex: number, totalSlides: number): void {
  addBreadcrumb('navigation', 'Onboarding slide viewed', {
    slide_index: slideIndex,
    total_slides: totalSlides,
  });
}

/** Onboarding completed. */
export function breadcrumbOnboardingCompleted(): void {
  addBreadcrumb('lifecycle', 'Onboarding completed');
}

/** Extension installed. */
export function breadcrumbExtensionInstalled(version: string): void {
  addBreadcrumb('lifecycle', 'Extension installed', {
    version,
  });
}

/** Extension updated. */
export function breadcrumbExtensionUpdated(fromVersion: string, toVersion: string): void {
  addBreadcrumb('lifecycle', 'Extension updated', {
    from_version: fromVersion,
    to_version: toVersion,
  });
}

/** Service worker started. */
export function breadcrumbServiceWorkerStarted(): void {
  addBreadcrumb('lifecycle', 'Service worker started');
}
```

**Integration examples across Focus Mode modules:**

```typescript
// src/background/timer-engine.js — session lifecycle
import {
  breadcrumbSessionStart,
  breadcrumbSessionEnd,
  breadcrumbBreakStart,
  breadcrumbTimerCheckpoint,
} from '../shared/sentry-breadcrumbs';

function startSession(durationMin: number): void {
  const sessionNumber = getCompletedSessionCount() + 1;
  breadcrumbSessionStart(durationMin, sessionNumber);
  // ... timer logic ...
}

function onTimerComplete(): void {
  breadcrumbSessionEnd(true, getActualDuration(), getSessionNumber());
  // ... completion logic ...
}

// Every 5 minutes during a session:
function onTimerTick(remainingSec: number): void {
  if (remainingSec % 300 === 0) { // every 5 min
    breadcrumbTimerCheckpoint(
      Math.round(remainingSec / 60),
      getCurrentState()
    );
  }
}
```

```typescript
// src/background/blocklist-manager.js — blocklist changes
import { breadcrumbBlocklistAdd, breadcrumbBlocklistRemove } from '../shared/sentry-breadcrumbs';

async function addToBlocklist(/* domain omitted from breadcrumb */): Promise<void> {
  // ... add logic ...
  const newTotal = await getBlocklistCount();
  breadcrumbBlocklistAdd(newTotal); // count only, never the domain
}
```

```typescript
// src/background/streak-tracker.js — streak events
import {
  breadcrumbStreakMilestone,
  breadcrumbStreakBroken,
  breadcrumbStreakExtended,
} from '../shared/sentry-breadcrumbs';

function extendStreak(newCount: number): void {
  breadcrumbStreakExtended(newCount);
  // Check for milestones: 7, 14, 21, 30, 60, 90, 180, 365
  const milestones = [7, 14, 21, 30, 60, 90, 180, 365];
  if (milestones.includes(newCount)) {
    breadcrumbStreakMilestone(newCount);
  }
}
```

---

### 2.5 Release Tracking Script

**File: `scripts/create-sentry-release.sh`**

This script is designed for the Focus Mode - Blocker CI/CD pipeline. It creates a Sentry release, uploads source maps from the build output, associates git commits for traceability, deploys the release to the correct environment, and cleans up source maps from the distribution bundle.

The script is idempotent and safe to re-run: it checks for existing releases and handles partial failures gracefully.

```bash
#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
# scripts/create-sentry-release.sh
# Focus Mode - Blocker — Sentry Release Creation for CI/CD
#
# Creates a Sentry release, uploads source maps, associates commits,
# deploys to environment, and deletes source maps from dist/.
#
# Prerequisites:
#   - sentry-cli installed (npm install -g @sentry/cli)
#   - SENTRY_AUTH_TOKEN set in CI environment
#   - SENTRY_ORG set in CI environment
#   - SENTRY_PROJECT set in CI environment
#
# Usage:
#   ./scripts/create-sentry-release.sh [environment]
#
# Examples:
#   ./scripts/create-sentry-release.sh production
#   ./scripts/create-sentry-release.sh staging
#   SENTRY_DRY_RUN=1 ./scripts/create-sentry-release.sh production
# ─────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Color output helpers ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# ── Configuration ──

# Environment: production (default), staging, development
ENVIRONMENT="${1:-production}"

# Project root (script lives in <root>/scripts/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Read version from package.json
VERSION=$(node -p "require('${PROJECT_ROOT}/package.json').version" 2>/dev/null)
if [[ -z "${VERSION}" ]]; then
  log_error "Could not read version from package.json"
  exit 1
fi

# Release name follows Sentry convention: project@version
RELEASE="focus-mode-blocker@${VERSION}"

# Distribution directory containing built assets
DIST_DIR="${PROJECT_ROOT}/dist"

# URL prefix for Chrome extension source maps
# The tilde (~) is a Sentry wildcard that matches any host/protocol prefix
URL_PREFIX="chrome-extension://~/"

# Dry run mode (set SENTRY_DRY_RUN=1 to preview without executing)
DRY_RUN="${SENTRY_DRY_RUN:-0}"

# ── Validation ──

log_info "Focus Mode - Blocker — Sentry Release Script"
log_info "─────────────────────────────────────────────"
log_info "Release:     ${RELEASE}"
log_info "Environment: ${ENVIRONMENT}"
log_info "Dist dir:    ${DIST_DIR}"
log_info "URL prefix:  ${URL_PREFIX}"
echo ""

# Check required environment variables
MISSING_VARS=0
for var in SENTRY_AUTH_TOKEN SENTRY_ORG SENTRY_PROJECT; do
  if [[ -z "${!var:-}" ]]; then
    log_error "Required environment variable ${var} is not set."
    MISSING_VARS=1
  fi
done

if [[ "${MISSING_VARS}" -eq 1 ]]; then
  echo ""
  log_error "Set the following environment variables before running:"
  log_error "  export SENTRY_AUTH_TOKEN=<your-sentry-auth-token>"
  log_error "  export SENTRY_ORG=<your-sentry-org-slug>"
  log_error "  export SENTRY_PROJECT=<your-sentry-project-slug>"
  exit 1
fi

# Check sentry-cli is installed
if ! command -v sentry-cli &> /dev/null; then
  log_error "sentry-cli is not installed."
  log_error "Install it with: npm install -g @sentry/cli"
  log_error "Or:              curl -sL https://sentry.io/get-cli/ | bash"
  exit 1
fi

# Check dist directory exists and has files
if [[ ! -d "${DIST_DIR}" ]]; then
  log_error "Distribution directory not found: ${DIST_DIR}"
  log_error "Run the build first: npm run build"
  exit 1
fi

JS_COUNT=$(find "${DIST_DIR}" -name "*.js" | wc -l | tr -d ' ')
MAP_COUNT=$(find "${DIST_DIR}" -name "*.js.map" | wc -l | tr -d ' ')

log_info "Found ${JS_COUNT} JavaScript file(s) and ${MAP_COUNT} source map(s) in dist/"

if [[ "${MAP_COUNT}" -eq 0 ]]; then
  log_warn "No source maps found in ${DIST_DIR}."
  log_warn "Ensure your build generates source maps (hidden-source-map)."
  log_warn "Continuing without source maps..."
fi

# Validate environment value
case "${ENVIRONMENT}" in
  production|staging|development)
    ;;
  *)
    log_error "Invalid environment: ${ENVIRONMENT}"
    log_error "Must be one of: production, staging, development"
    exit 1
    ;;
esac

# ── Dry run guard ──

run_cmd() {
  if [[ "${DRY_RUN}" -eq 1 ]]; then
    log_warn "[DRY RUN] Would execute: $*"
  else
    "$@"
  fi
}

# ── Step 1: Create the Sentry release ──

echo ""
log_info "Step 1/5: Creating Sentry release ${RELEASE}..."

run_cmd sentry-cli releases new "${RELEASE}" \
  --org "${SENTRY_ORG}" \
  --project "${SENTRY_PROJECT}"

log_ok "Release created."

# ── Step 2: Associate commits ──

log_info "Step 2/5: Associating git commits..."

# Get the commit range. If this is a tagged release, use the tag.
# Otherwise, associate the current HEAD.
CURRENT_COMMIT=$(git -C "${PROJECT_ROOT}" rev-parse HEAD 2>/dev/null || echo "unknown")
log_info "Current commit: ${CURRENT_COMMIT}"

run_cmd sentry-cli releases set-commits "${RELEASE}" \
  --org "${SENTRY_ORG}" \
  --auto \
  --ignore-missing

log_ok "Commits associated."

# ── Step 3: Upload source maps ──

log_info "Step 3/5: Uploading source maps..."

if [[ "${MAP_COUNT}" -gt 0 ]]; then
  run_cmd sentry-cli sourcemaps upload \
    --org "${SENTRY_ORG}" \
    --project "${SENTRY_PROJECT}" \
    --release "${RELEASE}" \
    --url-prefix "${URL_PREFIX}" \
    --validate \
    "${DIST_DIR}"

  log_ok "Source maps uploaded (${MAP_COUNT} file(s))."
else
  log_warn "Skipped — no source maps to upload."
fi

# ── Step 4: Finalise and deploy ──

log_info "Step 4/5: Finalising release and deploying to ${ENVIRONMENT}..."

run_cmd sentry-cli releases finalize "${RELEASE}" \
  --org "${SENTRY_ORG}"

run_cmd sentry-cli releases deploys "${RELEASE}" new \
  --org "${SENTRY_ORG}" \
  --env "${ENVIRONMENT}"

log_ok "Release finalised and deployed to ${ENVIRONMENT}."

# ── Step 5: Delete source maps from dist ──

log_info "Step 5/5: Cleaning up source maps from dist/..."

if [[ "${MAP_COUNT}" -gt 0 ]]; then
  if [[ "${DRY_RUN}" -eq 1 ]]; then
    log_warn "[DRY RUN] Would delete ${MAP_COUNT} .map file(s) from ${DIST_DIR}"
  else
    find "${DIST_DIR}" -name "*.js.map" -type f -delete
    REMAINING=$(find "${DIST_DIR}" -name "*.js.map" | wc -l | tr -d ' ')
    if [[ "${REMAINING}" -eq 0 ]]; then
      log_ok "All source maps deleted from dist/."
    else
      log_warn "${REMAINING} source map(s) could not be deleted."
    fi
  fi
else
  log_info "No source maps to clean up."
fi

# ── Summary ──

echo ""
log_info "═══════════════════════════════════════════════"
log_ok   "Sentry release complete!"
log_info "═══════════════════════════════════════════════"
log_info "Release:     ${RELEASE}"
log_info "Environment: ${ENVIRONMENT}"
log_info "Commit:      ${CURRENT_COMMIT}"
log_info "Source maps: ${MAP_COUNT} uploaded, then deleted from dist/"
if [[ "${DRY_RUN}" -eq 1 ]]; then
  log_warn "This was a DRY RUN — no changes were made to Sentry."
fi
echo ""
log_info "View in Sentry:"
log_info "  https://sentry.io/organizations/${SENTRY_ORG}/releases/${RELEASE}/"
echo ""
```

**CI/CD integration (GitHub Actions):**

```yaml
# .github/workflows/release.yml (relevant job)
# ─────────────────────────────────────────────────────────────────────
# Focus Mode - Blocker — Release workflow with Sentry integration
# ─────────────────────────────────────────────────────────────────────

name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build-and-release:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history needed for sentry-cli set-commits

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build extension (production)
        run: npm run build
        env:
          NODE_ENV: production
          SENTRY_DSN: ${{ secrets.SENTRY_DSN }}

      - name: Install sentry-cli
        run: npm install -g @sentry/cli

      - name: Create Sentry release & upload source maps
        run: ./scripts/create-sentry-release.sh production
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG: ${{ secrets.SENTRY_ORG }}
          SENTRY_PROJECT: ${{ secrets.SENTRY_PROJECT }}

      - name: Verify no source maps in dist
        run: |
          MAP_COUNT=$(find dist -name "*.js.map" | wc -l | tr -d ' ')
          if [ "$MAP_COUNT" -gt 0 ]; then
            echo "ERROR: Source maps still present in dist/"
            exit 1
          fi
          echo "OK: No source maps in dist/"

      - name: Package extension
        run: |
          cd dist
          zip -r ../focus-mode-blocker-${{ github.ref_name }}.zip .
          cd ..

      - name: Upload to Chrome Web Store
        uses: mnao305/chrome-extension-upload@v5.0.0
        with:
          file-path: focus-mode-blocker-${{ github.ref_name }}.zip
          extension-id: ${{ secrets.CHROME_EXTENSION_ID }}
          client-id: ${{ secrets.CHROME_CLIENT_ID }}
          client-secret: ${{ secrets.CHROME_CLIENT_SECRET }}
          refresh-token: ${{ secrets.CHROME_REFRESH_TOKEN }}
          publish: false  # Submit for review, don't auto-publish

      - name: Notify Sentry of deployment
        run: |
          VERSION=$(node -p "require('./package.json').version")
          sentry-cli releases deploys "focus-mode-blocker@${VERSION}" new \
            --env production \
            --name "Chrome Web Store submission ${{ github.ref_name }}"
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG: ${{ secrets.SENTRY_ORG }}
```

**Local development usage:**

```bash
# Preview what the script would do without making changes
SENTRY_DRY_RUN=1 ./scripts/create-sentry-release.sh staging

# Create a staging release (after building with staging config)
NODE_ENV=staging npm run build
./scripts/create-sentry-release.sh staging

# Create a production release
NODE_ENV=production npm run build
./scripts/create-sentry-release.sh production

# Verify sentry-cli can authenticate
sentry-cli info
```

**Required CI/CD secrets:**

| Secret | Description | Example |
|--------|-------------|---------|
| `SENTRY_AUTH_TOKEN` | Sentry API auth token with `project:releases` and `org:read` scopes | `sntrys_eyJ...` |
| `SENTRY_ORG` | Sentry organization slug | `focus-mode` |
| `SENTRY_PROJECT` | Sentry project slug | `blocker-extension` |
| `SENTRY_DSN` | Sentry DSN (baked into the build) | `https://abc123@o123.ingest.sentry.io/456` |
| `CHROME_EXTENSION_ID` | Chrome Web Store extension ID | `abcdefghijklmnopqrstuvwxyz` |
| `CHROME_CLIENT_ID` | Google API OAuth client ID | `123456.apps.googleusercontent.com` |
| `CHROME_CLIENT_SECRET` | Google API OAuth client secret | `GOCSPX-...` |
| `CHROME_REFRESH_TOKEN` | Google API OAuth refresh token | `1//0abc...` |

---

## Architecture Summary

The error tracking and Sentry integration for Focus Mode - Blocker follows a layered architecture:

```
                    +─────────────────────────────────+
                    |         Sentry Cloud             |
                    |   (sentry.io / self-hosted)      |
                    +──────────────┬──────────────────+
                                   |
                         HTTPS POST (batched)
                                   |
          +────────────────────────┴────────────────────────+
          |              Service Worker (Background)         |
          |                                                  |
          |  +──────────────+     +───────────────────+     |
          |  | ErrorTracker |     | Sentry SDK (init) |     |
          |  | (batching,   |     | (makeFetchTransport|     |
          |  |  dedup,      |     |  beforeSend,      |     |
          |  |  storage     |     |  breadcrumbs)     |     |
          |  |  fallback)   |     +───────────────────+     |
          |  +──────┬───────+                                |
          |         |                                        |
          |    REPORT_ERROR /                                |
          |    REPORT_ERRORS_BATCH                           |
          |         |                                        |
          +─────────┼────────────────────────────────────────+
                    |
     ┌──────────────┼──────────────┐
     |              |              |
+────┴─────+  +─────┴────+  +─────┴──────+
| Content  |  | Popup /  |  | Block     |
| Scripts  |  | Options  |  | Page /    |
| (detector|  | Page     |  | Onboarding|
|  blocker |  |          |  |           |
|  tracker)|  +──────────+  +───────────+
|          |
| error-   |  ui-error-handler.ts
| capture  |  (per-page factory)
| .ts      |
| (<1KB)   |
+──────────+
```

**Key design decisions:**

1. **Dual reporting**: The custom `ErrorTracker` and Sentry SDK run in parallel. ErrorTracker provides fast, batched, privacy-scrubbed error reports to our own ingest endpoint. Sentry provides deep crash analytics, source-mapped stack traces, and release tracking.

2. **Privacy-first**: All error payloads are scrubbed of blocked domains, license keys, email addresses, and external URLs before leaving the device. The `beforeSend` hook in Sentry acts as a final privacy gate. The `FocusModeErrorContext` only contains counts and enum values, never user-identifiable data.

3. **MV3 constraints**: The service worker has no DOM access and can be killed at any time. The `ErrorTracker` persists unsent errors to `chrome.storage.local` and rehydrates them on next wake. The flush alarm uses `chrome.alarms` (minimum 30-second interval). Sentry uses `makeFetchTransport` instead of XHR.

4. **Content script minimalism**: `error-capture.ts` is designed to be under 1 KB minified. It only captures errors originating from the extension (filtered by `chrome.runtime.id`), forwards them to the background via `REPORT_ERROR`, and falls back to `localStorage` when the service worker is unreachable.

5. **Source map security**: Source maps are generated during the production build, uploaded to Sentry, and immediately deleted from the distribution bundle. They are never shipped in the `.crx` / `.zip` uploaded to the Chrome Web Store.
