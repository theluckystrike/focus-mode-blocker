# INTEGRATION ARCHITECTURE: Focus Mode - Blocker Monitoring
## Agent 5 — Phase 11: Crash Analytics & Monitoring

> **Date:** February 11, 2026 | **Status:** Complete
> **Scope:** Monitoring integration across all execution contexts, storage schema, privacy architecture, error recovery, and performance budgets

---

## 5.1 Monitoring Architecture Overview

The monitoring system integrates across every execution context in the Focus Mode - Blocker extension. All error and performance data flows through a centralized `ErrorTracker` in the service worker, which manages local persistence, optional remote delivery, and debug tooling.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     FOCUS MODE - BLOCKER MONITORING                        │
│                        Architecture Overview                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  SERVICE WORKER (18 modules)                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ blocklist-   │  │ timer-       │  │ focus-       │  │ streak-      │   │
│  │ manager      │  │ engine       │  │ score        │  │ tracker      │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                 │                 │                 │             │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌──────┴───────┐  ┌──────┴───────┐   │
│  │ license-     │  │ analytics-   │  │ notification-│  │ rule-        │   │
│  │ cache        │  │ collector    │  │ manager      │  │ engine       │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                 │                 │                 │             │
│         ▼                 ▼                 ▼                 ▼             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      error-handler.ts (Agent 1)                     │   │
│  │                         ErrorTracker                                │   │
│  │  ┌──────────┐  ┌──────────────┐  ┌──────────────┐                  │   │
│  │  │ Error    │  │ Fingerprint  │  │ Severity     │                  │   │
│  │  │ Queue    │  │ Dedup        │  │ Classifier   │                  │   │
│  │  │ (max 50) │  │ Engine       │  │ (C/H/M/L)   │                  │   │
│  │  └────┬─────┘  └──────────────┘  └──────────────┘                  │   │
│  └───────┼────────────────────────────────────────────────────────────┘   │
│          │                                                                 │
│  ┌───────┼────────────────────────────────────────────────────────────┐   │
│  │       ▼     NEW: Monitoring Modules (Agent 2)                      │   │
│  │  ┌──────────┐  ┌──────────────┐  ┌──────────────┐                  │   │
│  │  │ memory-  │  │ cpu-         │  │ startup-     │                  │   │
│  │  │ monitor  │  │ monitor      │  │ timing       │                  │   │
│  │  └────┬─────┘  └──────┬───────┘  └──────┬───────┘                  │   │
│  └───────┼───────────────┼───────────────┼────────────────────────────┘   │
│          │               │               │                                 │
│          ▼               ▼               ▼                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Local Analytics Engine                           │   │
│  │              (500-event rolling window, <500KB)                     │   │
│  └──────────┬──────────────────────────┬──────────────────────────────┘   │
│             │                          │                                   │
│  ┌──────────▼──────────┐   ┌──────────▼──────────────┐                    │
│  │  chrome.storage     │   │  DebugLogger             │                    │
│  │  .local             │   │  (1000-entry circular    │                    │
│  │  (persistent)       │   │   buffer, in-memory)     │                    │
│  └─────────────────────┘   └──────────┬──────────────┘                    │
│                                       │                                    │
│                            ┌──────────▼──────────────┐                    │
│                            │  Export / Remote Debug   │                    │
│                            │  (JSON download or       │                    │
│                            │   remote stream)         │                    │
│                            └─────────────────────────┘                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL CONTEXTS                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CONTENT SCRIPTS (3)                                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                                   │
│  │ detector │ │ blocker  │ │ tracker  │                                   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘                                   │
│       │            │            │                                           │
│       ▼            ▼            ▼                                           │
│  ┌──────────────────────────────────────┐                                  │
│  │  chrome.runtime.sendMessage          │                                  │
│  │  { type: "REPORT_ERROR", data }      │─────────────> ErrorTracker       │
│  └──────────────────────────────────────┘                                  │
│                                                                             │
│  UI PAGES (Popup / Options / Block Page / Onboarding)                      │
│  ┌──────────────────────────────────────┐                                  │
│  │  UIErrorHandler                      │                                  │
│  │  - window.onerror                    │                                  │
│  │  - window.onunhandledrejection       │                                  │
│  │  - try/catch wrappers               │                                  │
│  └────────────┬─────────────────────────┘                                  │
│               │                                                             │
│               ▼                                                             │
│  ┌──────────────────────────────────────┐                                  │
│  │  chrome.runtime.sendMessage          │                                  │
│  │  { type: "REPORT_ERRORS_BATCH",     │─────────────> ErrorTracker       │
│  │    data: ErrorData[] }               │                                  │
│  └──────────────────────────────────────┘                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                     REMOTE DELIVERY (Pro + Opt-In Only)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ErrorTracker ──> Batch Sender ──┬──> Sentry (errors, Pro + opt-in)        │
│                                  │                                          │
│                                  ├──> Telemetry Server (events, Pro)        │
│                                  │                                          │
│                                  └──> Re-queue on failure (max 100)        │
│                                                                             │
│  Batch Sender triggers via chrome.alarms:                                  │
│    - "monitoring:flush" every 5 minutes                                    │
│    - "monitoring:retry" every 15 minutes (for failed sends)                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Summary

| Source | Transport | Destination | Condition |
|--------|-----------|-------------|-----------|
| Service worker modules | Direct function call | ErrorTracker | Always |
| Content scripts (3) | `REPORT_ERROR` message | ErrorTracker | Always |
| UI pages (4) | `REPORT_ERRORS_BATCH` message | ErrorTracker | Always |
| ErrorTracker | chrome.storage.local | Local Analytics | Always |
| ErrorTracker | Sentry SDK batch | Sentry | Pro + telemetryOptIn |
| ErrorTracker | fetch() batch | Telemetry Server | Pro + telemetryOptIn |
| MemoryMonitor | Direct function call | Local Analytics | Always |
| CPUMonitor | Direct function call | Local Analytics | Always |
| StartupTiming | Direct function call | Local Analytics | Always |
| DebugLogger | In-memory circular buffer | Export/Remote Debug | Debug mode enabled |

---

## 5.2 Service Worker Module Integration

Each of the 18 service worker modules hooks into the monitoring system at specific failure points. The table below maps every module to the errors it reports, the severity level, and which monitoring subsystem captures it.

### Existing Modules (Pre-Phase 11)

| Module | Monitored Events | Severity | Capture Method |
|--------|-----------------|----------|----------------|
| `blocklist-manager.ts` | Add/remove failures, storage write errors, duplicate detection edge cases | Medium | try/catch wrapping, ErrorTracker.capture() |
| `timer-engine.ts` | Alarm creation failures, timer drift (>2s), session crash mid-countdown, pause/resume state corruption | Critical | Alarm listener validation, drift detection in tick handler |
| `focus-score.ts` | Calculation errors, NaN results, out-of-range scores (<0 or >100), division by zero in weighted factors | High | Result validation wrapper, range-check assertions |
| `streak-tracker.ts` | Streak calculation errors, date boundary edge cases, storage read/write failures | High | try/catch wrapping, date validation |
| `license-cache.ts` | API validation failures, network errors, cache miss on expired TTL, malformed response | High | fetch() error handling, response validation |
| `analytics-collector.ts` | Storage quota approaching (>80%), rolling window overflow, malformed event data | Medium | Quota monitoring, event schema validation |
| `notification-manager.ts` | Permission denied, display failures, click handler errors | Low | chrome.notifications callback errors |
| `rule-engine.ts` | declarativeNetRequest failures, MAX_RULES limit reached (5000 dynamic), rule ID conflicts | Critical | updateDynamicRules() error callback, rule count monitoring |
| `message-handler.ts` | Unknown message types, handler exceptions, response timeout | Medium | Default case logging, handler try/catch |
| `storage-manager.ts` | Quota exceeded, read failures, write failures, migration errors | Critical | chrome.storage error callbacks, quota checks |
| `session-manager.ts` | State corruption, concurrent session conflicts, restore failures after SW restart | Critical | State validation on every transition |
| `nuclear-mode.ts` | Tamper detection failures, rule bypass attempts, timer desync | Critical | Integrity checks, alarm validation |
| `paywall-manager.ts` | Trigger evaluation errors (T1-T10), display failures, state tracking errors | Medium | try/catch on trigger evaluation |
| `ambient-sounds.ts` | Audio playback failures, offscreen document creation errors, resource load failures | Low | Offscreen API error handling |
| `schedule-manager.ts` | Cron parsing errors, alarm scheduling failures, timezone edge cases | Medium | Schedule validation, alarm creation error handling |
| `onboarding-manager.ts` | State machine errors, step completion failures, storage errors | Low | State transition validation |

### New Monitoring Modules (Phase 11)

| Module | Purpose | Key Metrics | Storage Key |
|--------|---------|-------------|-------------|
| `error-handler.ts` | Central error collection, deduplication, fingerprinting, severity classification, batch sending | Error count, error rate, unique errors, top fingerprints | `monitoring.errorQueue`, `monitoring.pendingErrors` |
| `memory-monitor.ts` | Periodic memory sampling (every 60s), leak detection (monotonic increase over 10+ samples), heap limit warnings | `usedJSHeapSize`, `totalJSHeapSize`, `jsHeapSizeLimit`, leak score | `monitoring.memorySamples` |
| `cpu-monitor.ts` | API call timing (`performance.now()` wrapping), slow operation detection (>100ms), aggregate stats | p50/p95/p99 latency per operation, slow operation count | `monitoring.cpuStats` |
| `startup-timing.ts` | Service worker boot measurement (install, activate, first-message timestamps), cold vs warm start classification | Boot duration, time-to-first-message, startup type | `monitoring.startupHistory` |

### Module-to-Monitor Wiring

```
┌─────────────────────────────────────────────────────────┐
│                  Service Worker Bootstrap                │
│                                                         │
│  1. startup-timing.ts records install/activate times    │
│  2. error-handler.ts initializes ErrorTracker           │
│  3. memory-monitor.ts starts sampling interval          │
│  4. cpu-monitor.ts wraps chrome.* API calls             │
│  5. All existing modules get try/catch augmentation     │
│  6. startup-timing.ts records first-message time        │
│                                                         │
│  On SW restart (crash recovery):                        │
│  1. startup-timing.ts detects cold start                │
│  2. error-handler.ts loads pending errors from storage  │
│  3. session-manager.ts restores active session          │
│  4. timer-engine.ts re-creates alarms                   │
│  5. error-handler.ts logs recovery event                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Error Capture Patterns

Each existing module is augmented with one of three error capture patterns:

**Pattern A: Synchronous try/catch wrapper**
Used for: `blocklist-manager`, `focus-score`, `streak-tracker`, `paywall-manager`
```typescript
// Before (no monitoring)
function calculateScore(factors: ScoreFactors): number {
  const weighted = factors.sessionTime * 0.4 + factors.blockedAttempts * 0.3 + ...;
  return Math.round(weighted);
}

// After (with monitoring)
function calculateScore(factors: ScoreFactors): number {
  try {
    const weighted = factors.sessionTime * 0.4 + factors.blockedAttempts * 0.3 + ...;
    const score = Math.round(weighted);
    if (isNaN(score) || score < 0 || score > 100) {
      ErrorTracker.capture(new RangeError(`Invalid score: ${score}`), {
        severity: 'high',
        module: 'focus-score',
        context: { factors, score }
      });
      return Math.max(0, Math.min(100, score || 0)); // Clamp and fallback
    }
    return score;
  } catch (err) {
    ErrorTracker.capture(err, { severity: 'high', module: 'focus-score' });
    return 0; // Safe fallback
  }
}
```

**Pattern B: Async/Promise error boundary**
Used for: `license-cache`, `storage-manager`, `analytics-collector`, `rule-engine`
```typescript
// Wrap async operations with error boundary
async function updateBlockingRules(sites: string[]): Promise<void> {
  const opTimer = CPUMonitor.startOperation('rule-engine:updateRules');
  try {
    await chrome.declarativeNetRequest.updateDynamicRules({ addRules, removeRuleIds });
    opTimer.success();
  } catch (err) {
    opTimer.failure();
    ErrorTracker.capture(err, {
      severity: 'critical',
      module: 'rule-engine',
      context: { siteCount: sites.length, ruleCount: addRules.length }
    });
    throw err; // Re-throw so caller can handle
  }
}
```

**Pattern C: Event listener error boundary**
Used for: `message-handler`, `notification-manager`, `timer-engine`
```typescript
// Wrap chrome.runtime.onMessage listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    handleMessage(message, sender, sendResponse);
  } catch (err) {
    ErrorTracker.capture(err, {
      severity: 'medium',
      module: 'message-handler',
      context: { messageType: message?.type, senderId: sender?.id }
    });
    sendResponse({ success: false, error: 'Internal error' });
  }
  return true; // Keep channel open for async response
});
```

---

## 5.3 Message Type Integration

Focus Mode's existing message system uses 22 message types for inter-context communication. Phase 11 adds 6 new monitoring-specific types, bringing the total to 28.

### Existing Message Types (22)

| # | Type | Direction | Purpose |
|---|------|-----------|---------|
| 1 | `START_SESSION` | Popup -> BG | Begin focus session |
| 2 | `STOP_SESSION` | Popup -> BG | End focus session |
| 3 | `PAUSE_SESSION` | Popup -> BG | Pause active session |
| 4 | `RESUME_SESSION` | Popup -> BG | Resume paused session |
| 5 | `GET_SESSION_STATE` | Popup -> BG | Request current session |
| 6 | `SESSION_TICK` | BG -> Popup | Timer update broadcast |
| 7 | `SESSION_COMPLETE` | BG -> Popup | Session finished |
| 8 | `ADD_SITE` | Popup -> BG | Add site to blocklist |
| 9 | `REMOVE_SITE` | Popup -> BG | Remove site from blocklist |
| 10 | `GET_BLOCKLIST` | Popup -> BG | Request current blocklist |
| 11 | `GET_FOCUS_SCORE` | Popup -> BG | Request Focus Score |
| 12 | `GET_STREAK` | Popup -> BG | Request streak data |
| 13 | `VALIDATE_LICENSE` | Popup -> BG | Check license tier |
| 14 | `ACTIVATE_NUCLEAR` | Popup -> BG | Enable Nuclear Mode |
| 15 | `CHECK_NUCLEAR` | CS -> BG | Query nuclear status |
| 16 | `BLOCK_SITE` | BG -> CS | Trigger site blocking |
| 17 | `SHOW_PAYWALL` | BG -> Popup | Trigger paywall display |
| 18 | `GET_SETTINGS` | Options -> BG | Request settings |
| 19 | `UPDATE_SETTINGS` | Options -> BG | Save settings |
| 20 | `PLAY_SOUND` | Popup -> BG | Start ambient sound |
| 21 | `STOP_SOUND` | Popup -> BG | Stop ambient sound |
| 22 | `ONBOARDING_STEP` | Onboarding -> BG | Record onboarding progress |

### New Monitoring Message Types (6)

| # | Type | Direction | Payload | Purpose |
|---|------|-----------|---------|---------|
| 23 | `REPORT_ERROR` | CS -> BG | `{ error: ErrorData }` | Single error from content script |
| 24 | `REPORT_ERRORS_BATCH` | UI -> BG | `{ errors: ErrorData[] }` | Batched errors from UI pages |
| 25 | `REPORT_PERFORMANCE` | Any -> BG | `{ metric: PerformanceMetric }` | Performance observation |
| 26 | `GET_DEBUG_LOGS` | UI -> BG | `{ filter?: LogFilter }` | Request filtered debug logs |
| 27 | `TOGGLE_DEBUG_MODE` | UI -> BG | `{ enabled: boolean }` | Enable/disable debug mode |
| 28 | `GET_HEALTH_STATUS` | UI -> BG | `{}` | Request system health snapshot |

### Message Type Definitions

```typescript
// --- Error Reporting ---

interface ErrorData {
  fingerprint: string;           // SHA-256 hash of message + stack top frame
  message: string;               // Error message (PII-scrubbed)
  stack?: string;                // Sanitized stack trace (no file:// paths)
  severity: 'critical' | 'high' | 'medium' | 'low';
  module: string;                // Source module name
  context?: Record<string, unknown>; // Structured context (no PII)
  timestamp: number;             // Date.now()
  version: string;               // Extension version from manifest
  browser: string;               // navigator.userAgent (parsed)
  sessionActive: boolean;        // Was a focus session active?
  focusMode: 'pomodoro' | 'stopwatch' | 'none';
}

// --- Performance Reporting ---

interface PerformanceMetric {
  name: string;                  // e.g., "rule-engine:updateRules"
  duration: number;              // Milliseconds
  type: 'api-call' | 'render' | 'storage' | 'network' | 'startup';
  timestamp: number;
}

// --- Debug Logs ---

interface LogFilter {
  level?: 'debug' | 'info' | 'warn' | 'error';
  module?: string;
  since?: number;                // Timestamp
  limit?: number;                // Max entries to return (default 100)
}

interface DebugLogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  module: string;
  message: string;
  data?: unknown;
  timestamp: number;
}

// --- Health Status ---

interface HealthStatus {
  uptime: number;                // Seconds since SW activation
  startupType: 'cold' | 'warm';
  startupDuration: number;       // Milliseconds
  memoryUsage: {
    usedMB: number;
    totalMB: number;
    limitMB: number;
    leakScore: number;           // 0-100 (0 = no leak detected)
  };
  errorRate: {
    last5min: number;
    last1hr: number;
    topFingerprint: string | null;
  };
  storageUsage: {
    usedBytes: number;
    quotaBytes: number;
    percentUsed: number;
  };
  activeSession: boolean;
  blockedSiteCount: number;
  ruleCount: number;
}
```

### Message Handler Integration

The existing `message-handler.ts` gains a new monitoring case block:

```typescript
// Inside the main message handler switch
case 'REPORT_ERROR':
  ErrorTracker.capture(message.data.error);
  sendResponse({ success: true });
  break;

case 'REPORT_ERRORS_BATCH':
  for (const error of message.data.errors) {
    ErrorTracker.capture(error);
  }
  sendResponse({ success: true, count: message.data.errors.length });
  break;

case 'REPORT_PERFORMANCE':
  CPUMonitor.record(message.data.metric);
  sendResponse({ success: true });
  break;

case 'GET_DEBUG_LOGS':
  const logs = DebugLogger.query(message.data.filter);
  sendResponse({ success: true, logs });
  break;

case 'TOGGLE_DEBUG_MODE':
  DebugLogger.setEnabled(message.data.enabled);
  sendResponse({ success: true, debugMode: message.data.enabled });
  break;

case 'GET_HEALTH_STATUS':
  const status = await buildHealthStatus();
  sendResponse({ success: true, status });
  break;
```

---

## 5.4 Storage Schema Additions

Phase 11 adds 10 new keys under the `monitoring.*` namespace in `chrome.storage.local`. These are isolated from existing Focus Mode storage keys to prevent conflicts and enable clean migration.

### New Storage Keys

```typescript
interface MonitoringStorage {
  // --- Identity ---
  'monitoring.instanceId': string;
  // UUID v4, generated on first install, persists across updates.
  // Used as anonymous device identifier for telemetry correlation.
  // Never contains PII. Example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

  // --- Error Queue ---
  'monitoring.errorQueue': ErrorData[];
  // Pending errors awaiting batch send to Sentry/telemetry.
  // Max 50 entries. Oldest evicted when full (FIFO).
  // Flushed every 5 minutes via chrome.alarms "monitoring:flush".
  // Only populated when Pro + telemetryOptIn = true.

  'monitoring.pendingErrors': ErrorData[];
  // Errors that failed to send (network error, server error).
  // Max 100 entries. Oldest evicted when full.
  // Retried every 15 minutes via chrome.alarms "monitoring:retry".
  // Cleared after 3 failed retry cycles per error.

  // --- Performance Data ---
  'monitoring.startupHistory': TimingData[];
  // Last 50 service worker startup records.
  // Each entry: { type, installTime, activateTime, firstMessageTime, duration, date }
  // Used for startup performance trending in debug panel.

  'monitoring.memorySamples': MemorySample[];
  // Last 60 memory samples (1 per minute = 1 hour window).
  // Each entry: { usedMB, totalMB, limitMB, timestamp }
  // Used for leak detection (10+ consecutive increases = warning).

  'monitoring.cpuStats': Record<string, OperationStats>;
  // Aggregated timing stats per operation name.
  // Each entry: { count, totalMs, minMs, maxMs, p50Ms, p95Ms, p99Ms, lastUpdated }
  // Keys are operation names like "rule-engine:updateRules".
  // Pruned to top 50 operations by count on each flush.

  // --- Settings ---
  'monitoring.debugMode': boolean;
  // Default: false. Enables verbose logging to DebugLogger circular buffer.
  // Toggled via options page or keyboard shortcut (Ctrl+Shift+D in popup).
  // When false, only warn/error level entries are logged.

  'monitoring.remoteDebug': boolean;
  // Default: false. Pro only. Enables remote debug log streaming.
  // When true, debug logs are sent to the telemetry server in real-time.
  // Requires both Pro license and explicit user activation.

  'monitoring.telemetryOptIn': boolean;
  // Default: false. Pro only. Controls all remote error/event sending.
  // Set during onboarding (Pro) or in options page.
  // When false, ALL monitoring data stays local regardless of Pro status.
  // Must be explicitly toggled by user; never auto-enabled.

  'monitoring.sessionReplayConsent': boolean;
  // Default: false. Pro only. Enables extension UI session replay.
  // Records DOM mutations on popup, options, block page, onboarding ONLY.
  // NEVER records content on user web pages.
  // Requires telemetryOptIn = true as a prerequisite.
}
```

### Supporting Type Definitions

```typescript
interface TimingData {
  type: 'cold' | 'warm';
  installTime: number;         // performance.now() at install event
  activateTime: number;        // performance.now() at activate event
  firstMessageTime: number;    // performance.now() at first onMessage
  duration: number;            // activateTime - installTime (ms)
  date: string;                // ISO 8601 date string
}

interface MemorySample {
  usedMB: number;
  totalMB: number;
  limitMB: number;
  timestamp: number;
}

interface OperationStats {
  count: number;
  totalMs: number;
  minMs: number;
  maxMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  lastUpdated: number;
}
```

### Storage Budget

| Key | Max Entries | Estimated Size | Eviction Policy |
|-----|------------|----------------|-----------------|
| `monitoring.instanceId` | 1 | ~40 bytes | Never evicted |
| `monitoring.errorQueue` | 50 | ~50 KB | FIFO (oldest first) |
| `monitoring.pendingErrors` | 100 | ~100 KB | FIFO + TTL (3 retry cycles) |
| `monitoring.startupHistory` | 50 | ~5 KB | FIFO |
| `monitoring.memorySamples` | 60 | ~3 KB | Sliding window (1 hour) |
| `monitoring.cpuStats` | 50 operations | ~10 KB | Top-50 by count |
| `monitoring.debugMode` | 1 | ~10 bytes | N/A |
| `monitoring.remoteDebug` | 1 | ~10 bytes | N/A |
| `monitoring.telemetryOptIn` | 1 | ~10 bytes | N/A |
| `monitoring.sessionReplayConsent` | 1 | ~10 bytes | N/A |
| **Total** | — | **~168 KB** | — |

The DebugLogger circular buffer (1000 entries) is held in memory only and does not persist to `chrome.storage.local` under normal operation. At ~200 bytes per entry, this adds ~200 KB to service worker memory usage. Combined with the ~168 KB of persisted storage, total monitoring footprint is well within the 500 KB budget.

### Storage Migration

When upgrading from a pre-Phase-11 version, the monitoring storage initializer runs once:

```typescript
async function initializeMonitoringStorage(): Promise<void> {
  const existing = await chrome.storage.local.get('monitoring.instanceId');
  if (!existing['monitoring.instanceId']) {
    await chrome.storage.local.set({
      'monitoring.instanceId': crypto.randomUUID(),
      'monitoring.errorQueue': [],
      'monitoring.pendingErrors': [],
      'monitoring.startupHistory': [],
      'monitoring.memorySamples': [],
      'monitoring.cpuStats': {},
      'monitoring.debugMode': false,
      'monitoring.remoteDebug': false,
      'monitoring.telemetryOptIn': false,
      'monitoring.sessionReplayConsent': false,
    });
  }
}
```

---

## 5.5 Privacy Architecture

Focus Mode - Blocker follows a strict privacy-first design. The monitoring system extends this commitment with clear data classification and flow rules.

### Data Classification Matrix

| Data Category | Free Tier | Pro (opt-out) | Pro (opt-in) | Never Sent |
|--------------|-----------|---------------|--------------|------------|
| Error logs (local) | Local only | Local only | Local + Sentry | — |
| Performance metrics | Local only | Local only | Local + telemetry | — |
| Focus Score history | Local only | Local only | Aggregate only | Raw scores |
| Streak data | Local only | Local only | Aggregate only | Raw dates |
| Session history | Local only | Local only | Count + duration only | Details |
| Debug logs | Local only | Local only | Optional remote stream | — |
| Session replay | N/A | N/A | Extension UI only | — |
| Blocked domains | — | — | — | Always local |
| Browsing history | — | — | — | Never collected |
| License keys | — | — | — | Never in telemetry |
| Email/username | — | — | — | Never collected |
| IP address | — | — | Proxy recommended | — |

### What Sentry Receives (Pro + Opt-In Only)

```typescript
// Sentry event payload after scrubbing
{
  fingerprint: "sha256:abc123...",       // Error identity hash
  message: "Failed to update rules",     // Generic error message
  stack: [                                // Sanitized stack frames
    { function: "updateBlockingRules", file: "rule-engine.js", line: 42 },
    { function: "handleAddSite", file: "message-handler.js", line: 108 }
  ],
  tags: {
    version: "1.0.0",
    browser: "Chrome/122",
    severity: "critical",
    module: "rule-engine"
  },
  extra: {
    sessionActive: true,
    focusMode: "pomodoro",
    siteCount: 5,                        // Count, not the actual domains
    ruleCount: 10                         // Count, not the actual rules
  }
  // NO: domains, URLs, email, license key, browsing data, IP
}
```

### What Telemetry Server Receives (Pro + Opt-In Only)

```typescript
// Anonymous usage event
{
  instanceId: "hashed:xyz789...",        // SHA-256 of monitoring.instanceId
  events: [
    { type: "session_complete", count: 3, avgDuration: 1500 },
    { type: "focus_score_avg", value: 72 },
    { type: "feature_used", flags: ["pomodoro", "nuclear", "ambient"] },
    { type: "error_rate", count: 2, period: "1h" }
  ],
  version: "1.0.0",
  timestamp: 1707609600000
  // NO: domains, URLs, specific times, browsing data, PII
}
```

### PII Scrubbing Pipeline

Before any error data leaves the extension, it passes through the scrubbing pipeline:

```
Raw Error
    │
    ▼
┌─────────────────────┐
│ 1. Stack Sanitizer   │  Remove file:// paths, replace with relative module names
├─────────────────────┤
│ 2. Message Scrubber  │  Regex remove: URLs, emails, domains, IP addresses
├─────────────────────┤
│ 3. Context Filter    │  Remove: blocklist contents, license keys, user IDs
├─────────────────────┤
│ 4. Domain Stripper   │  Replace any domain in message with "[DOMAIN]"
├─────────────────────┤
│ 5. Size Limiter      │  Truncate stack to 10 frames, message to 500 chars
└─────────────────────┘
    │
    ▼
Sanitized ErrorData → Ready for remote send
```

### Consent Flow

```
Install → Free tier (all local, no prompts)
    │
    ▼
Upgrade to Pro → Onboarding shows telemetry opt-in screen
    │
    ├─── User declines → telemetryOptIn = false (all stays local)
    │
    └─── User accepts → telemetryOptIn = true
              │
              ├─── Error reporting enabled (Sentry)
              ├─── Anonymous usage events enabled
              │
              └─── Optional: Session replay consent (separate toggle)
                        │
                        ├─── Decline → sessionReplayConsent = false
                        └─── Accept → Extension UI replay only
```

---

## 5.6 Error Recovery Strategies

Focus Mode must maintain blocking and session continuity through common failure scenarios. Each scenario below describes the failure, detection method, recovery action, and monitoring response.

### Scenario 1: Service Worker Crash During Active Session

**Failure:** Chrome terminates the service worker while a Pomodoro timer is running.

**Detection:** On SW restart, `startup-timing.ts` detects a cold start. `session-manager.ts` checks `chrome.storage.session` for active session state.

**Recovery:**
1. `startup-timing.ts` records cold start event with crash flag
2. `session-manager.ts` loads session from `chrome.storage.session` (survives SW restarts)
3. `timer-engine.ts` recalculates remaining time from `session.startTime` + `session.duration` - `Date.now()`
4. `timer-engine.ts` re-creates the chrome.alarm with corrected remaining time
5. `rule-engine.ts` verifies blocking rules are still active (declarativeNetRequest persists independently)
6. `ErrorTracker` logs a `critical` error: "Service worker crash during active session, recovered"

**User impact:** Timer may show a brief stutter (1-3 seconds); blocking is uninterrupted because declarativeNetRequest rules persist independently of the service worker.

### Scenario 2: Storage Quota Exceeded

**Failure:** `chrome.storage.local.set()` throws `QUOTA_BYTES_PER_ITEM` or `QUOTA_BYTES` error.

**Detection:** Storage operations wrapped with error handling that checks for quota-related error messages.

**Recovery:**
1. `ErrorTracker` logs a `critical` storage quota error
2. `analytics-collector.ts` prunes the oldest 50% of analytics events from the rolling window
3. `monitoring.pendingErrors` is cleared (sacrifice retry queue to free space)
4. `monitoring.memorySamples` is trimmed to last 30 entries
5. `monitoring.startupHistory` is trimmed to last 25 entries
6. Retry the original write operation
7. If still failing, alert user via notification: "Focus Mode storage is full. Some history has been cleared."

**User impact:** Older analytics and monitoring history is lost; current session and blocking are unaffected.

### Scenario 3: declarativeNetRequest Rule Failure

**Failure:** `chrome.declarativeNetRequest.updateDynamicRules()` rejects (malformed rule, rule limit exceeded, internal error).

**Detection:** Promise rejection from the API call, caught in `rule-engine.ts` error boundary.

**Recovery:**
1. `ErrorTracker` logs a `critical` error with rule details (count, not content)
2. If rule limit exceeded (MAX_NUMBER_OF_DYNAMIC_RULES = 5000):
   - Calculate actual needed rules vs limit
   - Alert user: "Blocking limit reached. Remove some sites or upgrade to Pro for optimized rules."
3. If malformed rule:
   - Log the rule structure (without domains) for debugging
   - Skip the problematic rule, apply remaining valid rules
   - Alert user: "One site could not be blocked. Please try removing and re-adding it."
4. If internal Chrome error:
   - Retry once after 1-second delay
   - If retry fails, log for next startup attempt

**User impact:** Individual sites may fail to block; bulk operations fail gracefully with partial application.

### Scenario 4: Timer Alarm Lost

**Failure:** `chrome.alarms.get()` returns undefined for an alarm that should exist (Chrome garbage collected it or SW restarted without proper alarm restoration).

**Detection:** Periodic alarm health check runs every 30 seconds during active sessions; also detected on any `chrome.alarms.onAlarm` handler invocation.

**Recovery:**
1. `timer-engine.ts` detects missing alarm during health check
2. Loads session state from `chrome.storage.session`
3. Recalculates remaining time
4. Creates new alarm with corrected delay
5. `ErrorTracker` logs a `high` error: "Timer alarm lost, re-created from session state"
6. If session state is also missing, log `critical` and end the session cleanly

**User impact:** Timer continues with at most 30 seconds of untracked time. Blocking remains active throughout.

### Scenario 5: Network Failure (Telemetry)

**Failure:** `fetch()` to Sentry or telemetry server fails (network error, timeout, 5xx response).

**Detection:** fetch() promise rejection or non-2xx response status.

**Recovery:**
1. Move failed batch from `monitoring.errorQueue` to `monitoring.pendingErrors`
2. Increment retry counter on each failed error entry
3. Schedule retry via `chrome.alarms` "monitoring:retry" (15-minute interval)
4. On retry: attempt to send oldest pending errors first
5. After 3 failed retry cycles per error, discard the error entry
6. `DebugLogger` logs each failure/retry for diagnostic visibility

**User impact:** None. Telemetry failures are completely invisible to the user. Local monitoring continues unaffected.

### Scenario 6: Content Script Injection Failure

**Failure:** Content script fails to inject on a page (CSP restriction, chrome:// page, extension page, PDF viewer).

**Detection:** `chrome.scripting.executeScript()` rejection or content script runtime error before message channel is established.

**Recovery:**
1. `ErrorTracker` logs a `medium` error with the tab URL scheme (not full URL)
2. Fall back to declarativeNetRequest-only blocking (no visual overlay)
3. If the page is a known non-injectable context (chrome://, about:, file://), suppress the error (expected behavior)
4. Add the URL scheme to an in-memory exclusion list to avoid repeated injection attempts

**User impact:** Blocked sites still show the block page via declarativeNetRequest redirect; the content script overlay is not visible. No functional impact on blocking.

### Recovery Priority Matrix

| Scenario | Severity | Auto-Recover? | User Notification | Data Loss |
|----------|----------|--------------|-------------------|-----------|
| SW crash during session | Critical | Yes | None (seamless) | Timer accuracy (~1-3s) |
| Storage quota exceeded | Critical | Yes | Warning notification | Older analytics |
| Rule update failure | Critical | Partial | Alert if limit reached | None |
| Timer alarm lost | High | Yes | None (seamless) | Timer accuracy (~30s) |
| Network failure (telemetry) | Low | Yes (retry queue) | None | Old telemetry after 3 retries |
| Content script injection | Medium | Yes (fallback) | None | Overlay not shown |

---

## 5.7 Monitoring Performance Budget

The monitoring system must not degrade the user experience. All monitoring operations are budgeted to ensure negligible impact on Focus Mode's core functionality.

### Per-Operation Budgets

| Operation | Budget | Measurement Method | Enforcement |
|-----------|--------|-------------------|-------------|
| Error capture (ErrorTracker.capture) | <1ms | `performance.now()` delta | CPUMonitor self-check |
| Analytics event recording | <2ms | `performance.now()` delta | CPUMonitor self-check |
| Memory monitoring sample | <5ms | `performance.now()` delta | Skip sample if over budget |
| Debug log entry | <0.5ms | `performance.now()` delta | Drop entry if over budget |
| CPU monitoring wrapper overhead | <0.1ms | Benchmarked at build time | Compile-time validation |
| Health status snapshot build | <10ms | `performance.now()` delta | Cache for 5 seconds |
| Telemetry batch send (fetch) | <100ms | Non-blocking, fire-and-forget | Timeout at 5 seconds |
| Storage write (monitoring data) | <20ms | `performance.now()` delta | Debounced (5s interval) |

### Aggregate Budgets

| Metric | Budget | Rationale |
|--------|--------|-----------|
| Total monitoring storage (chrome.storage.local) | <500 KB | ~5% of chrome.storage.local quota (5 MB) |
| Total in-memory footprint (DebugLogger + buffers) | <500 KB | ~5% of SW memory budget (10 MB) |
| Monitoring overhead per user action | <5ms | Imperceptible to user |
| Network bandwidth per flush cycle (5 min) | <10 KB | Negligible on any connection |
| chrome.alarms slots used by monitoring | 2 | "monitoring:flush" + "monitoring:retry" |
| chrome.storage.local write frequency | 1 per 5 min | Batched writes to avoid I/O contention |

### Critical Path Protection

Monitoring must NEVER block or delay these operations:

1. **Site blocking** (declarativeNetRequest) — Rule updates happen before any monitoring writes
2. **Timer ticks** — Alarm handlers execute session logic before logging
3. **Popup rendering** — UI loads without waiting for monitoring data
4. **Session start/stop** — State persistence takes priority over error logging

```
User Action → Core Logic → State Persistence → Monitoring (async, non-blocking)
     │              │               │                    │
     │              │               │                    └── Can be dropped
     │              │               └── Must complete
     │              └── Must complete
     └── Response sent immediately
```

### Self-Monitoring

The monitoring system monitors itself to prevent runaway resource consumption:

```typescript
// Self-check runs every 5 minutes
async function monitoringSelfCheck(): Promise<void> {
  // 1. Check monitoring storage size
  const storageUsage = await estimateMonitoringStorageSize();
  if (storageUsage > 400_000) { // 400 KB warning threshold
    pruneMonitoringData(); // Aggressively trim oldest entries
  }

  // 2. Check error rate (circuit breaker)
  const recentErrors = ErrorTracker.getRecentCount(5 * 60 * 1000); // Last 5 min
  if (recentErrors > 100) {
    ErrorTracker.enableSampling(0.1); // Only capture 10% of errors
    DebugLogger.warn('monitoring', 'High error rate detected, sampling enabled');
  } else {
    ErrorTracker.disableSampling();
  }

  // 3. Check DebugLogger buffer size
  if (DebugLogger.getEntryCount() > 900) { // Near 1000 limit
    DebugLogger.pruneOldest(200); // Remove oldest 200 entries
  }
}
```

### Performance Validation

During development and CI, monitoring overhead is validated with automated benchmarks:

| Test | Assertion | Runs In |
|------|-----------|---------|
| Error capture latency | 1000 captures in <1 second | Unit test |
| Memory sample overhead | 100 samples in <500ms | Unit test |
| Debug log throughput | 10,000 entries in <5 seconds | Unit test |
| Storage write batch | 50 errors written in <100ms | Integration test |
| Full monitoring init | Cold start adds <50ms to SW boot | E2E benchmark |
| Popup load with monitoring | <200ms total (monitoring adds <20ms) | E2E benchmark |

---

## Appendix A: Alarm Registration Summary

Focus Mode uses `chrome.alarms` for scheduled operations. Phase 11 adds 2 monitoring alarms to the existing set.

| Alarm Name | Interval | Purpose | Phase |
|------------|----------|---------|-------|
| `session:tick` | 1 second | Timer countdown | Pre-11 |
| `session:complete` | One-shot | Session end | Pre-11 |
| `schedule:check` | 1 minute | Schedule evaluation | Pre-11 |
| `streak:daily` | 24 hours | Daily streak check | Pre-11 |
| `monitoring:flush` | 5 minutes | Batch send errors/events | Phase 11 |
| `monitoring:retry` | 15 minutes | Retry failed sends | Phase 11 |

---

## Appendix B: Chrome API Usage Summary

APIs used by the monitoring system and their permission requirements.

| API | Method | Purpose | Permission |
|-----|--------|---------|------------|
| `chrome.storage.local` | `get`, `set` | Persist monitoring data | `storage` (existing) |
| `chrome.storage.session` | `get`, `set` | Session recovery state | `storage` (existing) |
| `chrome.alarms` | `create`, `get`, `clear` | Scheduled flush/retry | `alarms` (existing) |
| `chrome.runtime` | `onMessage`, `sendMessage` | Inter-context communication | None (existing) |
| `chrome.runtime` | `getManifest` | Read extension version | None (existing) |
| `performance` | `now()`, `memory` | Timing and memory sampling | None (Web API) |
| `crypto` | `randomUUID()`, `subtle.digest` | Instance ID, fingerprinting | None (Web API) |
| `fetch` | — | Remote telemetry sending | `host_permissions` for Sentry/telemetry endpoints |

**No new permissions required** except adding Sentry and telemetry server URLs to `host_permissions` in `manifest.json` (Pro builds only).

---

## Appendix C: Cross-Reference to Other Agents

| Topic | Primary Agent | Reference |
|-------|--------------|-----------|
| ErrorTracker implementation | Agent 1 | `agent1-error-tracking-sentry.md` Section 1-3 |
| Sentry SDK configuration | Agent 1 | `agent1-error-tracking-sentry.md` Section 4-5 |
| MemoryMonitor, CPUMonitor, StartupTiming | Agent 2 | `agent2-analytics-performance.md` Section 1-3 |
| Local analytics engine (500-event window) | Agent 2 | `agent2-analytics-performance.md` Section 4 |
| Session replay implementation | Agent 3 | `agent3-session-replay-alerting.md` Section 1-2 |
| Alerting rules and Grafana dashboards | Agent 3 | `agent3-session-replay-alerting.md` Section 3-5 |
| DebugLogger and debug mode | Agent 4 | `agent4-debug-bestpractices.md` Section 1-2 |
| Error classification taxonomy | Agent 4 | `agent4-debug-bestpractices.md` Section 3 |
| Support tools and log export | Agent 4 | `agent4-debug-bestpractices.md` Section 4-5 |
| Integration architecture (this doc) | Agent 5 | `agent5-integration-architecture.md` |

---

*Agent 5 — Integration Architecture — Phase 11: Crash Analytics & Monitoring — Complete*
