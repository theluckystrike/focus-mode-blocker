# Focus Mode - Blocker: Service Worker Lifecycle & Event-Driven Architecture

> **Extension:** Focus Mode - Blocker v1.0.0 | **Manifest:** V3 | **Service Worker:** `src/background/service-worker.js` (module type)
>
> This document covers the complete service worker lifecycle management, message passing architecture, and event-driven patterns that power Focus Mode - Blocker.

---

## Section 1: Service Worker Lifecycle Management

### 1.1 MV3 Service Worker Fundamentals for Focus Mode

#### Why MV3 Replaced Persistent Background Pages

Manifest V2 allowed extensions to run a persistent background page -- an invisible HTML page that stayed in memory for the entire browser session. For Focus Mode, this would have meant a permanently resident process tracking Pomodoro timers, streak state, nuclear mode countdowns, and blocklist rules. Chrome deprecated this model because thousands of extensions each holding a persistent page consumed significant system memory even when idle.

Manifest V3 replaces the persistent background page with a **service worker** -- a JavaScript execution context that Chrome can start and stop on demand. The service worker:

- Has **no DOM access** (no `document`, no `window`, no `XMLHttpRequest`)
- Runs in an **isolated worker context** (uses `self` as the global scope)
- Is **event-driven** -- it wakes up when a registered event fires and goes back to sleep when idle
- Can be **terminated at any time** by Chrome's resource manager

For Focus Mode - Blocker, this creates a fundamental architectural challenge: the extension must track active Pomodoro sessions that can run for 25+ minutes, maintain nuclear mode lockouts, preserve streak calculations, and enforce blocklist rules -- all while the underlying execution context can vanish after just 30 seconds of inactivity.

#### Service Worker Lifecycle States

```
                    +------------------+
                    |   NOT INSTALLED  |
                    +--------+---------+
                             |
                    chrome.runtime.onInstalled (reason: "install")
                             |
                    +--------v---------+
                    |    INSTALLING     |  <-- Top-level code executes
                    +--------+---------+      All imports resolved
                             |                All listeners registered synchronously
                    +--------v---------+
                    |    ACTIVATING     |  <-- install event handlers run
                    +--------+---------+
                             |
              +--------------v--------------+
              |          ACTIVATED          |
              |  (processing events)        |
              +--------------+--------------+
                             |
                     No pending events
                     No open ports
                     No active fetch handlers
                             |
              +--------------v--------------+
              |            IDLE             |
              |  (~30s inactivity countdown)|
              +--------------+--------------+
                             |
                     30s with no events (or 5 min max lifetime)
                             |
              +--------------v--------------+
              |         TERMINATED          |  <-- All in-memory state LOST
              +--------------+--------------+
                             |
                     chrome.alarms.onAlarm
                     chrome.runtime.onMessage
                     chrome.tabs.onUpdated
                     (any registered event)
                             |
              +--------------v--------------+
              |        RESTARTING           |  <-- Full re-execution of SW script
              |  (re-import all modules)    |
              +--------------+--------------+
                             |
                    Back to ACTIVATED
```

#### Critical Timing Constraints

| Constraint | Value | Impact on Focus Mode |
|---|---|---|
| Idle timeout | ~30 seconds | Timer display updates cannot rely on in-memory `setInterval` |
| Max lifetime | ~5 minutes | Even with continuous activity, SW will eventually restart |
| Alarm minimum interval | 1 minute | Pomodoro display needs sub-minute updates via popup-side timers |
| Startup budget | < 500ms recommended | All 18 modules must import and initialize quickly |
| Event handler deadline | ~5 minutes | Long-running operations must be chunked |

#### Impact on Focus Mode Core Features

**Pomodoro Timer:** Cannot use `setInterval` or `setTimeout` for tracking. The actual timer is driven by `chrome.alarms` (1-minute granularity). The popup maintains its own display countdown using the alarm's scheduled time as the source of truth. On each SW wake, the timer state is reconstructed from `chrome.storage.session` + the alarm's `scheduledTime`.

**Nuclear Mode:** Once activated, nuclear mode must be absolutely unbypassable until the countdown expires. The countdown alarm persists across SW termination. The blocklist rules are stored via `declarativeNetRequest` which operates at the browser level independent of the SW. Even if the SW never wakes up, sites stay blocked.

**Streak Tracking:** Streak state lives in `chrome.storage.local`. The `streak-check` alarm fires periodically to verify the streak is still valid. On SW restart, streak state is read from storage -- never held only in memory.

**Focus Score:** The in-progress calculation is cached in `chrome.storage.session`. If the SW terminates mid-calculation, it resumes from the cached intermediate state on restart.

#### chrome.alarms: The Only Reliable Wake Mechanism

```typescript
// chrome.alarms is the SOLE reliable mechanism to schedule future SW wake-ups.
// setTimeout/setInterval do NOT survive SW termination.

// WRONG - will be lost on SW termination:
setTimeout(() => {
  checkStreak(); // This will NEVER fire if SW terminates
}, 60000);

// CORRECT - persists across SW termination:
chrome.alarms.create('streak-check', {
  periodInMinutes: 60 // Fires every hour, waking the SW if terminated
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'streak-check') {
    checkStreak(); // Guaranteed to fire (within 1-min accuracy)
  }
});
```

---

### 1.2 Service Worker Entry Point Architecture

#### Complete Module Organization

`src/background/service-worker.js` is declared in the manifest as a module-type service worker:

```json
{
  "background": {
    "service_worker": "src/background/service-worker.js",
    "type": "module"
  }
}
```

The entry point file orchestrates the import and initialization of all 18 modules in a carefully ordered sequence. Import order is not arbitrary -- modules are loaded in dependency order so that foundational services (error handling, storage, timing) are available before higher-level modules (timer engine, rule engine, analytics) that depend on them.

```typescript
// =============================================================================
// src/background/service-worker.js
// Focus Mode - Blocker — MV3 Service Worker Entry Point
// =============================================================================
// CRITICAL: All event listeners MUST be registered synchronously at the
// top level during the first turn of the event loop. If you register a
// listener inside an async callback, Chrome may terminate the SW before
// it fires, and the listener will NOT be re-registered on restart.
// =============================================================================

// ─── Phase 0: Startup Timing (must be absolute first) ────────────────────────
import { startupTiming } from './startup-timing.js';
startupTiming.mark('sw_start');

// ─── Phase 1: Error Infrastructure ──────────────────────────────────────────
// Error handler wraps everything — must be imported before any module that
// could throw during initialization.
import { errorHandler } from './error-handler.js';
startupTiming.mark('error_handler_loaded');

// ─── Phase 2: Storage Layer ─────────────────────────────────────────────────
// StorageManager abstracts chrome.storage.local and chrome.storage.session.
// Nearly every other module depends on this for state persistence/restoration.
import { storageManager } from './storage-manager.js';
startupTiming.mark('storage_manager_loaded');

// ─── Phase 3: Session Management ────────────────────────────────────────────
// SessionManager tracks the current Pomodoro/focus session state.
// Depends on storageManager for persistence.
import { sessionManager } from './session-manager.js';
startupTiming.mark('session_manager_loaded');

// ─── Phase 4: Core Blocking Infrastructure ──────────────────────────────────
// These modules form the blocking pipeline. RuleEngine translates blocklist
// entries into declarativeNetRequest rules. BlocklistManager maintains the
// user's site list. Both depend on storageManager.
import { ruleEngine } from './rule-engine.js';
import { blocklistManager } from './blocklist-manager.js';
startupTiming.mark('blocking_infra_loaded');

// ─── Phase 5: Timer & Schedule ──────────────────────────────────────────────
// TimerEngine manages Pomodoro countdown via chrome.alarms.
// ScheduleEngine handles automatic focus schedules (e.g., "block social media
// during work hours"). Both depend on storageManager and sessionManager.
import { timerEngine } from './timer-engine.js';
import { scheduleEngine } from './schedule-engine.js';
startupTiming.mark('timer_schedule_loaded');

// ─── Phase 6: Gamification ──────────────────────────────────────────────────
// FocusScore and StreakTracker read/write to storage. They consume session
// completion events from sessionManager and timerEngine.
import { focusScore } from './focus-score.js';
import { streakTracker } from './streak-tracker.js';
startupTiming.mark('gamification_loaded');

// ─── Phase 7: Communication ─────────────────────────────────────────────────
// MessageRouter is the central hub for all 22+ message types.
// NotificationManager sends OS notifications on session events.
// SoundController manages focus sounds via the offscreen document.
import { messageRouter } from './message-router.js';
import { notificationManager } from './notification-manager.js';
import { soundController } from './sound-controller.js';
startupTiming.mark('communication_loaded');

// ─── Phase 8: Monitoring & Analytics ────────────────────────────────────────
// These modules are non-critical. If they fail to initialize, the extension
// still functions. They are loaded last to minimize startup impact.
import { analyticsCollector } from './analytics-collector.js';
import { memoryMonitor } from './memory-monitor.js';
import { cpuMonitor } from './cpu-monitor.js';
startupTiming.mark('monitoring_loaded');

// ─── Phase 9: Sync & Licensing ──────────────────────────────────────────────
// SyncManager handles chrome.storage.sync for cross-device sync.
// LicenseCache validates pro license tokens. Both are non-critical.
import { syncManager } from './sync-manager.js';
import { licenseCache } from './license-cache.js';
startupTiming.mark('sync_license_loaded');

// =============================================================================
// ALL IMPORTS COMPLETE — Register event listeners synchronously
// =============================================================================
startupTiming.mark('imports_complete');

// ─── Synchronous Event Listener Registration ─────────────────────────────────
// CRITICAL: These MUST be at the top level. Not inside async functions.
// Not inside .then() callbacks. Not inside setTimeout. TOP LEVEL ONLY.

chrome.runtime.onInstalled.addListener((details) => {
  errorHandler.wrap('onInstalled', () => onInstalled(details));
});

chrome.runtime.onStartup.addListener(() => {
  errorHandler.wrap('onStartup', () => onStartup());
});

chrome.runtime.onSuspend.addListener(() => {
  errorHandler.wrap('onSuspend', () => onSuspend());
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  return messageRouter.route(message, sender, sendResponse);
});

chrome.runtime.onConnect.addListener((port) => {
  errorHandler.wrap('onConnect', () => messageRouter.handleConnect(port));
});

chrome.alarms.onAlarm.addListener((alarm) => {
  errorHandler.wrap(`alarm:${alarm.name}`, () => handleAlarm(alarm));
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  errorHandler.wrap('tabActivated', () =>
    analyticsCollector.trackTabSwitch(activeInfo)
  );
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    errorHandler.wrap('tabUpdated', () =>
      blocklistManager.evaluateNavigation(tabId, changeInfo.url, tab)
    );
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  errorHandler.wrap('tabRemoved', () =>
    sessionManager.cleanupTab(tabId)
  );
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  errorHandler.wrap('storageChanged', () =>
    handleStorageChange(changes, areaName)
  );
});

chrome.notifications.onClicked.addListener((notificationId) => {
  errorHandler.wrap('notificationClicked', () =>
    notificationManager.handleClick(notificationId)
  );
});

chrome.action.onClicked.addListener((tab) => {
  errorHandler.wrap('actionClicked', () =>
    handleActionClick(tab)
  );
});

// Debug-only: DNR rule match logging
if (typeof chrome.declarativeNetRequest.onRuleMatchedDebug !== 'undefined') {
  chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
    console.debug('[DNR Match]', info.request.url, '→ rule', info.rule.ruleId);
  });
}

startupTiming.mark('listeners_registered');

// =============================================================================
// Async Initialization (runs after synchronous registration)
// =============================================================================

(async () => {
  try {
    startupTiming.mark('async_init_start');

    // Restore state from storage
    await storageManager.initialize();
    startupTiming.mark('storage_initialized');

    await sessionManager.restore();
    startupTiming.mark('session_restored');

    await ruleEngine.initialize();
    await blocklistManager.initialize();
    startupTiming.mark('blocking_initialized');

    await timerEngine.restore();
    startupTiming.mark('timer_restored');

    await scheduleEngine.initialize();
    startupTiming.mark('schedule_initialized');

    await focusScore.restore();
    await streakTracker.restore();
    startupTiming.mark('gamification_restored');

    // Restore badge state
    await updateBadge();
    startupTiming.mark('badge_restored');

    // Non-critical: analytics, monitoring, sync
    await Promise.allSettled([
      analyticsCollector.initialize(),
      memoryMonitor.initialize(),
      cpuMonitor.initialize(),
      syncManager.initialize(),
      licenseCache.initialize(),
    ]);
    startupTiming.mark('async_init_complete');

    const totalMs = startupTiming.elapsed('sw_start', 'async_init_complete');
    console.log(`[Focus Mode] SW fully initialized in ${totalMs}ms`);
    startupTiming.report(); // Logs all marks to debug logger

  } catch (error) {
    errorHandler.capture(error, { context: 'sw_async_init' });
  }
})();
```

#### Module Dependency Graph

```
startup-timing ──(standalone, no deps)
         │
error-handler ──(standalone, no deps)
         │
storage-manager ──(depends on: error-handler)
         │
    ┌────┴───────────────┬──────────────────┐
    │                    │                  │
session-manager    rule-engine       schedule-engine
(storage-manager)  (storage-manager)  (storage-manager,
    │               │                  timer-engine)
    │          blocklist-manager
    │          (storage-manager,
    │           rule-engine)
    │
timer-engine ──(storage-manager, session-manager)
    │
    ├── focus-score ──(storage-manager, session-manager)
    ├── streak-tracker ──(storage-manager, session-manager)
    │
message-router ──(all modules — routes messages to handlers)
    │
    ├── notification-manager ──(storage-manager)
    ├── sound-controller ──(offscreen document)
    │
    ├── analytics-collector ──(storage-manager)
    ├── memory-monitor ──(storage-manager)
    ├── cpu-monitor ──(storage-manager)
    │
    ├── sync-manager ──(storage-manager)
    └── license-cache ──(storage-manager, sync-manager)
```

#### Startup Timing Implementation

```typescript
// src/background/startup-timing.ts

interface TimingMark {
  name: string;
  timestamp: number;
}

class StartupTiming {
  private marks: Map<string, number> = new Map();
  private enabled: boolean = true;

  /**
   * Record a named timestamp. Call at key points during SW initialization.
   */
  mark(name: string): void {
    if (!this.enabled) return;
    this.marks.set(name, performance.now());
  }

  /**
   * Get elapsed ms between two marks.
   */
  elapsed(from: string, to: string): number {
    const start = this.marks.get(from);
    const end = this.marks.get(to);
    if (start === undefined || end === undefined) return -1;
    return Math.round(end - start);
  }

  /**
   * Log a complete startup timing report.
   */
  report(): void {
    if (!this.enabled || this.marks.size === 0) return;

    const entries = Array.from(this.marks.entries());
    const swStart = entries[0][1];

    console.group('[Focus Mode] Startup Timing Report');
    for (let i = 0; i < entries.length; i++) {
      const [name, timestamp] = entries[i];
      const fromStart = Math.round(timestamp - swStart);
      const delta = i > 0
        ? Math.round(timestamp - entries[i - 1][1])
        : 0;

      console.log(
        `  ${name.padEnd(30)} +${String(fromStart).padStart(4)}ms` +
        (delta > 0 ? `  (${delta}ms since previous)` : '')
      );
    }
    console.groupEnd();
  }

  /**
   * Store timing data for the popup DevTools panel.
   */
  async persist(): Promise<void> {
    const data: Record<string, number> = {};
    for (const [name, timestamp] of this.marks) {
      data[name] = Math.round(timestamp - (this.marks.get('sw_start') ?? 0));
    }
    await chrome.storage.session.set({ _startupTiming: data });
  }
}

export const startupTiming = new StartupTiming();
```

#### Error Handler Wrapping the Entire Init Sequence

```typescript
// src/background/error-handler.ts (relevant init-wrapping portion)

type ErrorContext = {
  context: string;
  module?: string;
  alarm?: string;
  messageType?: string;
  [key: string]: unknown;
};

class ErrorHandler {
  private errorBuffer: Array<{ error: Error; context: ErrorContext; timestamp: number }> = [];
  private readonly MAX_BUFFER = 500;

  /**
   * Wrap a synchronous or async function with error capturing.
   * Used for every Chrome event listener to prevent unhandled exceptions
   * from crashing the service worker.
   */
  wrap(contextName: string, fn: () => void | Promise<void>): void {
    try {
      const result = fn();
      if (result instanceof Promise) {
        result.catch((error) => {
          this.capture(error, { context: contextName });
        });
      }
    } catch (error) {
      this.capture(error instanceof Error ? error : new Error(String(error)), {
        context: contextName,
      });
    }
  }

  /**
   * Capture an error with context metadata. Stores in the rolling buffer
   * and flushes to chrome.storage.local periodically via the error-flush alarm.
   */
  capture(error: Error | unknown, context: ErrorContext): void {
    const err = error instanceof Error ? error : new Error(String(error));

    this.errorBuffer.push({
      error: err,
      context,
      timestamp: Date.now(),
    });

    // Evict oldest if buffer is full
    if (this.errorBuffer.length > this.MAX_BUFFER) {
      this.errorBuffer.shift();
    }

    console.error(`[Focus Mode Error] [${context.context}]`, err.message, context);
  }

  /**
   * Flush buffered errors to persistent storage.
   * Called by the 'error-flush' alarm handler.
   */
  async flush(): Promise<void> {
    if (this.errorBuffer.length === 0) return;

    const toFlush = [...this.errorBuffer];
    this.errorBuffer = [];

    const serialized = toFlush.map(({ error, context, timestamp }) => ({
      message: error.message,
      stack: error.stack,
      context,
      timestamp,
    }));

    const { _errorLog = [] } = await chrome.storage.local.get('_errorLog');
    const merged = [..._errorLog, ...serialized].slice(-this.MAX_BUFFER);
    await chrome.storage.local.set({ _errorLog: merged });
  }
}

export const errorHandler = new ErrorHandler();
```

---

### 1.3 State Persistence Strategy

Focus Mode - Blocker's most critical architectural concern is that **all state must survive service worker termination**. The extension uses a two-tier storage strategy that separates ephemeral session state from persistent user data.

#### chrome.storage.session -- Ephemeral State (Survives SW Restart, Not Browser Restart)

`chrome.storage.session` was introduced specifically for MV3 to fill the gap between in-memory variables (lost on SW termination) and `chrome.storage.local` (persists across browser restarts). It is the ideal location for state that should survive SW restarts within a single browser session but does not need to persist across browser restarts.

```typescript
// src/background/storage-manager.ts — Session storage schema

interface SessionState {
  // ─── Active Timer State ───────────────────────────────────────────────
  /** Remaining seconds in the current Pomodoro/break interval */
  timerRemaining: number | null;

  /** Whether the user has paused the current session */
  timerPaused: boolean;

  /** Timestamp (Date.now()) when the timer was last synced to storage */
  timerLastSync: number | null;

  /** The alarm name driving the current timer ('pomodoro-tick' or 'break-timer') */
  timerActiveAlarm: string | null;

  // ─── Active Session Metadata ──────────────────────────────────────────
  /** Current session object (type, start time, settings) */
  activeSession: ActiveSession | null;

  /** Number of Pomodoro intervals completed in this cycle (resets after long break) */
  pomodoroCount: number;

  /** Current session state in the state machine */
  sessionState: SessionState;

  // ─── In-Progress Calculations ─────────────────────────────────────────
  /** Focus Score accumulator for the current session */
  currentScoreAccumulator: ScoreAccumulator | null;

  /** Tab switch count during current focus session (distraction metric) */
  tabSwitchCount: number;

  /** Last active tab ID (for distraction detection) */
  lastActiveTabId: number | null;

  // ─── Temporary UI State ───────────────────────────────────────────────
  /** Badge text currently displayed */
  badgeText: string;

  /** Badge background color */
  badgeColor: string;

  /** Whether the popup is currently connected via port */
  popupConnected: boolean;

  // ─── Startup Diagnostics ──────────────────────────────────────────────
  /** Startup timing marks from the most recent SW initialization */
  _startupTiming: Record<string, number> | null;
}
```

**Why session storage for timer state?** When the SW terminates during an active Pomodoro, the user's timer must resume seamlessly on the next wake-up. Storing `timerRemaining` and `timerLastSync` in session storage allows the timer engine to calculate the exact elapsed time and update the remaining count without hitting `chrome.storage.local` (which would create unnecessary write amplification for a value that changes every minute).

#### chrome.storage.local -- Persistent State (Survives Browser Restarts)

```typescript
// src/background/storage-manager.ts — Local storage schema

interface PersistentState {
  // ─── Blocklist & Rules ────────────────────────────────────────────────
  /** User's blocked sites list */
  blocklist: BlocklistEntry[];

  /** Custom blocking rules (regex patterns, schedule-based) */
  customRules: CustomRule[];

  /** DNR rule ID counter (monotonically increasing) */
  nextRuleId: number;

  // ─── Session History ──────────────────────────────────────────────────
  /** Completed session records (last 1000) */
  sessionHistory: CompletedSession[];

  /** Daily aggregated stats */
  dailyStats: Record<string, DailyStats>;  // key: "YYYY-MM-DD"

  // ─── Gamification ─────────────────────────────────────────────────────
  /** Focus Score history (daily scores, last 90 days) */
  focusScoreHistory: FocusScoreEntry[];

  /** Current streak data */
  streak: StreakData;

  /** Earned badges/achievements */
  badges: Badge[];

  // ─── Settings & Preferences ───────────────────────────────────────────
  /** Pomodoro duration settings */
  pomodoroSettings: PomodoroSettings;

  /** Notification preferences */
  notificationSettings: NotificationSettings;

  /** Sound preferences (ambient sound, volume, etc.) */
  soundSettings: SoundSettings;

  /** Schedule configuration (auto-focus hours) */
  scheduleConfig: ScheduleConfig;

  /** Theme and UI preferences */
  uiSettings: UISettings;

  // ─── Analytics ────────────────────────────────────────────────────────
  /** Analytics event buffer (500-event rolling window) */
  analyticsEvents: AnalyticsEvent[];

  /** Last analytics flush timestamp */
  analyticsLastFlush: number;

  // ─── Licensing ────────────────────────────────────────────────────────
  /** Cached license validation result */
  licenseCache: LicenseCache | null;

  /** License token */
  licenseToken: string | null;

  // ─── Error Log ────────────────────────────────────────────────────────
  /** Rolling error log (500 entries max) */
  _errorLog: SerializedError[];

  // ─── Nuclear Mode ─────────────────────────────────────────────────────
  /** Nuclear mode configuration (if active) */
  nuclearMode: NuclearModeState | null;
}
```

#### StorageManager Implementation

```typescript
// src/background/storage-manager.ts

type StorageArea = 'local' | 'session';

class StorageManager {
  private sessionCache: Partial<SessionState> = {};
  private initialized = false;

  /**
   * Initialize storage — called once during SW async init.
   * Loads session state into an in-memory cache for fast synchronous reads.
   */
  async initialize(): Promise<void> {
    // Load all session storage into cache for fast reads
    this.sessionCache = await chrome.storage.session.get(null) as Partial<SessionState>;
    this.initialized = true;
  }

  /**
   * Get a value from session storage (cache-first for speed).
   */
  async getSession<K extends keyof SessionState>(key: K): Promise<SessionState[K] | undefined> {
    if (this.initialized && key in this.sessionCache) {
      return this.sessionCache[key] as SessionState[K];
    }
    const result = await chrome.storage.session.get(key);
    return result[key] as SessionState[K] | undefined;
  }

  /**
   * Set a value in session storage (write-through cache).
   */
  async setSession<K extends keyof SessionState>(
    key: K,
    value: SessionState[K]
  ): Promise<void> {
    this.sessionCache[key] = value;
    await chrome.storage.session.set({ [key]: value });
  }

  /**
   * Batch set multiple session values (single write for performance).
   */
  async setSessionBatch(values: Partial<SessionState>): Promise<void> {
    Object.assign(this.sessionCache, values);
    await chrome.storage.session.set(values);
  }

  /**
   * Get a value from local (persistent) storage.
   */
  async getLocal<K extends keyof PersistentState>(key: K): Promise<PersistentState[K] | undefined> {
    const result = await chrome.storage.local.get(key);
    return result[key] as PersistentState[K] | undefined;
  }

  /**
   * Set a value in local (persistent) storage.
   */
  async setLocal<K extends keyof PersistentState>(
    key: K,
    value: PersistentState[K]
  ): Promise<void> {
    await chrome.storage.local.set({ [key]: value });
  }

  /**
   * Batch get multiple local values.
   */
  async getLocalBatch<K extends keyof PersistentState>(
    keys: K[]
  ): Promise<Pick<PersistentState, K>> {
    return await chrome.storage.local.get(keys) as Pick<PersistentState, K>;
  }

  /**
   * Atomic read-modify-write for concurrent safety.
   * Prevents lost updates when multiple async operations modify the same key.
   */
  async updateLocal<K extends keyof PersistentState>(
    key: K,
    updater: (current: PersistentState[K] | undefined) => PersistentState[K]
  ): Promise<void> {
    const current = await this.getLocal(key);
    const updated = updater(current);
    await this.setLocal(key, updated);
  }
}

export const storageManager = new StorageManager();
```

#### State Restoration on SW Wake

When the service worker restarts (after termination), the async initialization sequence restores all state:

```typescript
// State restoration sequence (inside the async IIFE in service-worker.js)

// ─── Step 1: Session Storage (Fast Path) ───────────────────────────────
// Session storage is read first because it contains the "hot" state
// that the user is actively interacting with. This is the fast path
// because session storage is in-memory on Chrome's side.
await storageManager.initialize();  // Loads session cache

// ─── Step 2: Reconstruct Timer from Alarm + Session State ──────────────
// The timer's remaining time is computed as:
//   remaining = storedRemaining - (now - lastSyncTimestamp)
// The alarm's scheduledTime serves as a cross-check.
await timerEngine.restore();
// Internally:
//   const remaining = await storageManager.getSession('timerRemaining');
//   const lastSync = await storageManager.getSession('timerLastSync');
//   const paused = await storageManager.getSession('timerPaused');
//   if (remaining !== null && !paused) {
//     const elapsed = (Date.now() - lastSync) / 1000;
//     this.remaining = Math.max(0, remaining - elapsed);
//     await storageManager.setSession('timerRemaining', this.remaining);
//   }

// ─── Step 3: Re-register All Message Listeners ─────────────────────────
// Already done synchronously at top level! The message router's handler
// map is populated during module import (top-level side effects).
// This is why the import order matters — by the time onMessage fires,
// all handlers are already registered.

// ─── Step 4: Re-register All Alarm Listeners ───────────────────────────
// Also done synchronously at top level. The onAlarm listener delegates
// to handleAlarm() which routes to the appropriate module.

// ─── Step 5: Restore Badge State ────────────────────────────────────────
async function updateBadge(): Promise<void> {
  const sessionState = await storageManager.getSession('sessionState');
  const timerRemaining = await storageManager.getSession('timerRemaining');
  const streak = await storageManager.getLocal('streak');

  if (sessionState === 'FOCUSING' || sessionState === 'NUCLEAR_MODE') {
    const minutes = Math.ceil((timerRemaining ?? 0) / 60);
    await chrome.action.setBadgeText({ text: `${minutes}m` });
    await chrome.action.setBadgeBackgroundColor({
      color: sessionState === 'NUCLEAR_MODE' ? '#DC2626' : '#2563EB'
    });
  } else if (sessionState === 'SHORT_BREAK' || sessionState === 'LONG_BREAK') {
    await chrome.action.setBadgeText({ text: 'BRK' });
    await chrome.action.setBadgeBackgroundColor({ color: '#10B981' });
  } else {
    // IDLE — show streak if active
    if (streak && streak.currentStreak > 0) {
      await chrome.action.setBadgeText({ text: `${streak.currentStreak}d` });
      await chrome.action.setBadgeBackgroundColor({ color: '#F59E0B' });
    } else {
      await chrome.action.setBadgeText({ text: '' });
    }
  }

  // Persist badge state so we can restore it even faster next time
  const text = await chrome.action.getBadgeText({});
  const color = await chrome.action.getBadgeBackgroundColor({});
  await storageManager.setSessionBatch({
    badgeText: text,
    badgeColor: typeof color === 'string' ? color : `rgba(${color.join(',')})`,
  });
}
```

---

### 1.4 Alarm Management System

#### Complete Alarm Registry

Focus Mode - Blocker registers 12+ alarms, each serving a specific purpose. Alarms are the heartbeat of the extension -- they drive timer updates, periodic checks, and background maintenance tasks.

```typescript
// src/background/alarm-registry.ts

/**
 * Complete registry of all chrome.alarms used by Focus Mode - Blocker.
 * Each alarm is documented with its name, period, and purpose.
 */
export const ALARM_REGISTRY = {

  // ─── Timer Alarms (Dynamic — created/cleared per session) ─────────────

  /** Fires every 1 minute during an active Pomodoro focus interval.
   *  Updates remaining time in session storage, checks for completion. */
  POMODORO_TICK: {
    name: 'pomodoro-tick',
    periodInMinutes: 1,
    type: 'periodic' as const,
    createdWhen: 'Focus session starts',
    clearedWhen: 'Focus session ends, pauses, or completes',
  },

  /** Fires every 1 minute during a break interval.
   *  Tracks break time remaining, triggers return-to-focus notification. */
  BREAK_TIMER: {
    name: 'break-timer',
    periodInMinutes: 1,
    type: 'periodic' as const,
    createdWhen: 'Break starts',
    clearedWhen: 'Break ends or user returns to focus early',
  },

  /** One-shot alarm that fires when nuclear mode expires.
   *  Removes nuclear DNR rules and unlocks the extension. */
  NUCLEAR_COUNTDOWN: {
    name: 'nuclear-countdown',
    periodInMinutes: undefined, // One-shot: uses `when` timestamp
    type: 'one-shot' as const,
    createdWhen: 'Nuclear mode activated',
    clearedWhen: 'Never — must expire naturally (that is the point)',
  },

  // ─── Periodic Maintenance Alarms (Created on install, persist forever) ─

  /** Validates that the current streak is still active.
   *  Checks if the user completed a focus session today. */
  STREAK_CHECK: {
    name: 'streak-check',
    periodInMinutes: 60, // Every hour
    type: 'periodic' as const,
    createdWhen: 'Extension installed or updated',
    clearedWhen: 'Never',
  },

  /** Flushes buffered analytics events to chrome.storage.local.
   *  Prevents data loss if SW terminates with unflushed events. */
  ANALYTICS_FLUSH: {
    name: 'analytics-flush',
    periodInMinutes: 5,
    type: 'periodic' as const,
    createdWhen: 'Extension installed or updated',
    clearedWhen: 'Never',
  },

  /** Flushes buffered error logs to chrome.storage.local. */
  ERROR_FLUSH: {
    name: 'error-flush',
    periodInMinutes: 5,
    type: 'periodic' as const,
    createdWhen: 'Extension installed or updated',
    clearedWhen: 'Never',
  },

  /** Checks memory usage of the service worker.
   *  Logs warnings if approaching Chrome's limits. */
  MEMORY_CHECK: {
    name: 'memory-check',
    periodInMinutes: 10,
    type: 'periodic' as const,
    createdWhen: 'Extension installed or updated',
    clearedWhen: 'Never',
  },

  /** Evaluates scheduled focus blocks (e.g., "block social media 9am-5pm").
   *  Activates/deactivates blocking rules based on the current time. */
  SCHEDULE_CHECK: {
    name: 'schedule-check',
    periodInMinutes: 1,
    type: 'periodic' as const,
    createdWhen: 'Extension installed or updated',
    clearedWhen: 'Never',
  },

  /** Re-validates the cached license token with the license server. */
  LICENSE_REVALIDATE: {
    name: 'license-revalidate',
    periodInMinutes: 1440, // Every 24 hours
    type: 'periodic' as const,
    createdWhen: 'Extension installed or updated',
    clearedWhen: 'Never',
  },

  /** Aggregates per-minute stats into daily summaries.
   *  Runs once per day (approximated via long period). */
  DAILY_STATS_AGGREGATION: {
    name: 'daily-stats-aggregation',
    periodInMinutes: 1440, // Every 24 hours
    type: 'periodic' as const,
    createdWhen: 'Extension installed or updated',
    clearedWhen: 'Never',
  },

  /** Auto-saves the current session state to chrome.storage.session.
   *  Acts as a safety net — even if normal saves fail, this catches it. */
  SESSION_AUTOSAVE: {
    name: 'session-autosave',
    periodInMinutes: 2,
    type: 'periodic' as const,
    createdWhen: 'Extension installed or updated',
    clearedWhen: 'Never',
  },

  /** Updates the browser action badge (timer countdown, streak count). */
  BADGE_UPDATE: {
    name: 'badge-update',
    periodInMinutes: 1,
    type: 'periodic' as const,
    createdWhen: 'Extension installed or updated',
    clearedWhen: 'Never',
  },
} as const;

export type AlarmName = typeof ALARM_REGISTRY[keyof typeof ALARM_REGISTRY]['name'];
```

#### Alarm Creation and Recreation on SW Startup

```typescript
// src/background/alarm-manager.ts

import { ALARM_REGISTRY, type AlarmName } from './alarm-registry.js';
import { errorHandler } from './error-handler.js';

class AlarmManager {
  /**
   * Ensure all persistent alarms exist. Called during onInstalled and
   * as a safety check during each SW startup. Uses chrome.alarms.get()
   * to avoid recreating alarms that already exist (which would reset
   * their schedule).
   */
  async ensurePersistentAlarms(): Promise<void> {
    const existingAlarms = await chrome.alarms.getAll();
    const existingNames = new Set(existingAlarms.map(a => a.name));

    const persistentAlarms = Object.values(ALARM_REGISTRY).filter(
      (a) => a.type === 'periodic' && a.name !== 'pomodoro-tick' &&
             a.name !== 'break-timer' && a.name !== 'nuclear-countdown'
    );

    for (const alarm of persistentAlarms) {
      if (!existingNames.has(alarm.name)) {
        console.log(`[AlarmManager] Creating missing alarm: ${alarm.name}`);
        chrome.alarms.create(alarm.name, {
          delayInMinutes: alarm.name === 'daily-stats-aggregation' ? 60 : 1,
          periodInMinutes: alarm.periodInMinutes,
        });
      }
    }
  }

  /**
   * Create a timer alarm (pomodoro-tick or break-timer).
   * Clears any existing alarm with the same name first.
   */
  async createTimerAlarm(
    name: 'pomodoro-tick' | 'break-timer',
    durationMinutes: number
  ): Promise<void> {
    await chrome.alarms.clear(name);
    chrome.alarms.create(name, {
      delayInMinutes: 1,       // First tick in 1 minute
      periodInMinutes: 1,       // Then every minute
    });
  }

  /**
   * Create the nuclear mode one-shot alarm.
   */
  async createNuclearAlarm(expiresAt: number): Promise<void> {
    await chrome.alarms.clear('nuclear-countdown');
    chrome.alarms.create('nuclear-countdown', {
      when: expiresAt,  // Absolute timestamp when nuclear mode ends
    });
  }

  /**
   * Clear a timer alarm (when session ends or pauses).
   */
  async clearTimerAlarm(name: 'pomodoro-tick' | 'break-timer'): Promise<void> {
    await chrome.alarms.clear(name);
  }

  /**
   * Get the scheduled time for an alarm (used for timer reconstruction).
   */
  async getAlarmScheduledTime(name: string): Promise<number | null> {
    const alarm = await chrome.alarms.get(name);
    return alarm?.scheduledTime ?? null;
  }
}

export const alarmManager = new AlarmManager();
```

#### Central Alarm Listener and Routing

```typescript
// In service-worker.js — the handleAlarm function routed from the top-level listener

async function handleAlarm(alarm: chrome.alarms.Alarm): Promise<void> {
  const startTime = performance.now();

  switch (alarm.name) {
    // ─── Timer Alarms ─────────────────────────────────────────────────
    case 'pomodoro-tick':
      await timerEngine.tick();
      break;

    case 'break-timer':
      await timerEngine.breakTick();
      break;

    case 'nuclear-countdown':
      await sessionManager.endNuclearMode();
      break;

    // ─── Maintenance Alarms ───────────────────────────────────────────
    case 'streak-check':
      await streakTracker.validateStreak();
      break;

    case 'analytics-flush':
      await analyticsCollector.flush();
      break;

    case 'error-flush':
      await errorHandler.flush();
      break;

    case 'memory-check':
      await memoryMonitor.check();
      break;

    case 'schedule-check':
      await scheduleEngine.evaluate();
      break;

    case 'license-revalidate':
      await licenseCache.revalidate();
      break;

    case 'daily-stats-aggregation':
      await analyticsCollector.aggregateDaily();
      break;

    case 'session-autosave':
      await sessionManager.autosave();
      break;

    case 'badge-update':
      await updateBadge();
      break;

    default:
      console.warn(`[Focus Mode] Unknown alarm: ${alarm.name}`);
  }

  const elapsed = performance.now() - startTime;
  if (elapsed > 100) {
    console.warn(`[Focus Mode] Slow alarm handler: ${alarm.name} took ${elapsed.toFixed(1)}ms`);
  }
}
```

#### Timer Accuracy: Handling Sub-Minute Pomodoro Display Updates

`chrome.alarms` has a **minimum granularity of 1 minute**. This creates a challenge for Focus Mode: users expect to see a countdown that updates every second (e.g., "24:37... 24:36... 24:35..."). The solution uses a split-responsibility architecture:

```typescript
// ─── Background (Service Worker) ─────────────────────────────────────────
// The SW tracks the AUTHORITATIVE timer state at 1-minute granularity.
// It stores the exact timestamp when the timer was started/resumed and
// the total duration. Any context can compute the remaining time from:
//
//   remaining = totalDuration - (Date.now() - startTimestamp)
//
// The 'pomodoro-tick' alarm wakes the SW every minute to:
// 1. Update session storage with the current remaining time
// 2. Check if the timer has completed
// 3. Update the badge text

// ─── Popup (UI Context) ──────────────────────────────────────────────────
// The popup runs its OWN setInterval(1000) for display updates.
// It reads the authoritative state from session storage once on open,
// then counts down locally. Every minute (on pomodoro-tick), the SW
// pushes a correction to the popup via the open port, keeping it in sync.

// Timer state stored in chrome.storage.session:
interface TimerState {
  /** Total duration of this interval in seconds (e.g., 1500 for 25-min Pomodoro) */
  totalDuration: number;

  /** Timestamp (Date.now()) when the current interval started or resumed */
  startedAt: number;

  /** Accumulated elapsed seconds before the last pause (0 if never paused) */
  elapsedBeforePause: number;

  /** Whether the timer is currently paused */
  paused: boolean;

  /** The interval type: 'focus', 'short-break', 'long-break' */
  intervalType: 'focus' | 'short-break' | 'long-break';
}

// Computing remaining time (used by both SW and popup):
function computeRemaining(state: TimerState): number {
  if (state.paused) {
    return state.totalDuration - state.elapsedBeforePause;
  }
  const elapsedNow = (Date.now() - state.startedAt) / 1000;
  const totalElapsed = state.elapsedBeforePause + elapsedNow;
  return Math.max(0, state.totalDuration - totalElapsed);
}
```

#### Alarm Persistence Across SW Termination

Chrome alarms are **not stored in the service worker's memory** -- they are managed by Chrome's alarm service at the browser level. This means:

1. When the SW terminates, all alarms continue to exist
2. When an alarm fires, Chrome restarts the SW to deliver the event
3. The SW must re-register `chrome.alarms.onAlarm.addListener` synchronously (which it does at the top level) to receive the event

```
SW Running:       [██████████████]     [███████████]     [████████████
                  ^              ^     ^                              ^
                  wake      terminate  wake (alarm)              terminate
                                ↑          ↑
Alarms:     ─────╫──────────────╫──────╫───╫──────────────────────────╫──→
                  ↑              ↑     ↑   ↑                          ↑
            pomodoro-tick   (SW dead, alarm still scheduled)     alarm fires
                                       └── Chrome restarts SW to deliver alarm
```

#### Conflict Resolution: Simultaneous Alarm Firing

When multiple alarms fire at or near the same time (e.g., `pomodoro-tick` and `badge-update` both fire at the 1-minute mark), Chrome delivers them sequentially to the same `onAlarm` listener. The handler is async, so each alarm is processed in order:

```typescript
// Chrome guarantees that onAlarm calls are serialized — the next alarm
// event is not delivered until the previous handler's promise resolves
// (or the handler returns synchronously).

// However, if two alarms fire during SW termination, both will trigger
// a SW restart. Chrome coalesces these into a single restart and delivers
// both alarms sequentially.

// Our handleAlarm function is safe for this because:
// 1. Each alarm handler operates on independent state
// 2. Storage operations are atomic (chrome.storage.local.set is all-or-nothing)
// 3. We use storageManager.updateLocal() for read-modify-write patterns
```

---

### 1.5 Keep-Alive Strategies (When Needed)

The default posture for Focus Mode's service worker is **sleep when idle**. Chrome's SW lifecycle is designed to save resources, and fighting it degrades the user's browser performance. However, there are legitimate scenarios where the SW needs to stay alive longer than the 30-second idle timeout.

#### Strategy 1: chrome.alarms for Periodic Wake

The simplest and most MV3-compliant keepalive. The `badge-update` and `session-autosave` alarms (1-2 minute periods) ensure the SW wakes frequently during active sessions. This is not a keepalive hack -- these alarms do real work.

```typescript
// No special code needed — the alarm registry already includes
// frequent alarms during active sessions. The SW wakes, does work,
// and goes back to sleep. This is the intended MV3 pattern.
```

#### Strategy 2: Offscreen Document for Continuous Audio

Focus Mode offers ambient sounds (rain, white noise, etc.) during focus sessions. Audio playback requires a persistent context because the SW cannot play audio. The offscreen document API provides this:

```typescript
// src/background/sound-controller.ts

class SoundController {
  private offscreenCreated = false;

  /**
   * Create an offscreen document for audio playback.
   * The offscreen document runs independently of the SW and keeps
   * audio playing even when the SW terminates.
   */
  async ensureOffscreenDocument(): Promise<void> {
    if (this.offscreenCreated) return;

    // Check if one already exists (from a previous SW lifecycle)
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
    });

    if (existingContexts.length > 0) {
      this.offscreenCreated = true;
      return;
    }

    await chrome.offscreen.createDocument({
      url: 'src/offscreen/audio-player.html',
      reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK],
      justification: 'Playing ambient focus sounds during Pomodoro sessions',
    });

    this.offscreenCreated = true;
  }

  /**
   * Start playing an ambient sound.
   */
  async play(soundId: string, volume: number): Promise<void> {
    await this.ensureOffscreenDocument();
    await chrome.runtime.sendMessage({
      type: 'OFFSCREEN_PLAY_SOUND',
      target: 'offscreen',
      soundId,
      volume,
    });
  }

  /**
   * Stop all audio playback and close the offscreen document.
   */
  async stop(): Promise<void> {
    await chrome.runtime.sendMessage({
      type: 'OFFSCREEN_STOP_SOUND',
      target: 'offscreen',
    });

    // Close the offscreen document to free resources
    await chrome.offscreen.closeDocument();
    this.offscreenCreated = false;
  }
}

export const soundController = new SoundController();
```

**Side effect:** While the offscreen document is alive and playing audio, Chrome considers it an active context associated with the extension. This does **not** directly keep the SW alive, but it does mean the SW can communicate with the offscreen document via `chrome.runtime.sendMessage`, which wakes the SW if needed.

#### Strategy 3: Port-Based Keepalive from Popup/Options

When the popup or options page is open, they maintain a `chrome.runtime.connect()` port to the SW. An open port prevents SW termination:

```typescript
// src/popup/popup.ts — Popup-side port management

class PopupConnection {
  private port: chrome.runtime.Port | null = null;
  private reconnectTimer: number | null = null;

  /**
   * Connect to the service worker. The open port keeps the SW alive
   * while the popup is visible, enabling real-time timer updates.
   */
  connect(): void {
    this.port = chrome.runtime.connect({ name: 'popup' });

    this.port.onMessage.addListener((message) => {
      this.handleMessage(message);
    });

    this.port.onDisconnect.addListener(() => {
      this.port = null;
      // Popup is still open but SW terminated — reconnect
      if (!this.isClosing) {
        this.reconnectTimer = window.setTimeout(() => this.connect(), 1000);
      }
    });
  }

  /**
   * Disconnect cleanly when the popup closes.
   */
  disconnect(): void {
    this.isClosing = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.port?.disconnect();
    this.port = null;
  }

  private isClosing = false;

  private handleMessage(message: any): void {
    switch (message.type) {
      case 'TIMER_UPDATE':
        updateTimerDisplay(message.remaining, message.total);
        break;
      case 'STATE_CHANGE':
        updateSessionState(message.newState);
        break;
      case 'SCORE_UPDATE':
        updateFocusScore(message.score);
        break;
    }
  }
}

// Initialize on popup load
const connection = new PopupConnection();
connection.connect();

// Clean up on popup close
window.addEventListener('unload', () => {
  connection.disconnect();
});
```

```typescript
// src/background/message-router.ts — SW-side port management

class MessageRouter {
  private popupPort: chrome.runtime.Port | null = null;
  private optionsPort: chrome.runtime.Port | null = null;

  handleConnect(port: chrome.runtime.Port): void {
    switch (port.name) {
      case 'popup':
        this.popupPort = port;
        storageManager.setSession('popupConnected', true);

        port.onDisconnect.addListener(() => {
          this.popupPort = null;
          storageManager.setSession('popupConnected', false);
        });

        // Send current state immediately so popup renders without flicker
        this.pushCurrentStateToPopup();
        break;

      case 'options':
        this.optionsPort = port;
        port.onDisconnect.addListener(() => {
          this.optionsPort = null;
        });
        break;
    }
  }

  /**
   * Push a message to the popup if connected.
   * Safe to call even if popup is disconnected — message is silently dropped.
   */
  pushToPopup(message: object): void {
    try {
      this.popupPort?.postMessage(message);
    } catch {
      // Port disconnected between check and send — ignore
      this.popupPort = null;
    }
  }

  private async pushCurrentStateToPopup(): Promise<void> {
    const [sessionState, timerState, score, streak] = await Promise.all([
      storageManager.getSession('sessionState'),
      storageManager.getSession('timerRemaining'),
      focusScore.getCurrentScore(),
      storageManager.getLocal('streak'),
    ]);

    this.pushToPopup({
      type: 'FULL_STATE_SYNC',
      sessionState,
      timerRemaining: timerState,
      focusScore: score,
      streak,
    });
  }
}
```

#### IMPORTANT: Never Abuse Keep-Alive

```typescript
// ========================================================================
// ANTI-PATTERNS — Do NOT do these:
// ========================================================================

// BAD: Keeping SW alive with a polling alarm when nothing is happening
// chrome.alarms.create('keepalive', { periodInMinutes: 0.5 });
// This wastes resources and Chrome may flag the extension.

// BAD: Setting a periodic timer just to prevent SW termination
// setInterval(() => { /* noop */ }, 25000);
// This doesn't even work — setInterval dies with the SW.

// BAD: Opening a persistent WebSocket connection
// The SW will still terminate and the socket will close.

// ========================================================================
// CORRECT: Let the SW sleep when truly idle
// ========================================================================
// When no Pomodoro session is active and no scheduled block is upcoming:
// - No timer alarms are running (pomodoro-tick, break-timer cleared)
// - Only maintenance alarms remain (5-60 min intervals)
// - SW will sleep between alarms — this is FINE and INTENDED
// - DNR rules continue blocking sites even while SW sleeps
// - The user's blocklist is enforced at the Chrome level, not the SW level
```

---

## Section 2: Message Passing Architecture

### 2.1 Message Router

The message router is the central nervous system of Focus Mode - Blocker. All inter-context communication flows through a single `chrome.runtime.onMessage` listener that dispatches to typed handlers.

#### Message Type Definitions

```typescript
// src/background/message-types.ts

/**
 * All 22+ message types used by Focus Mode - Blocker.
 * Using a const enum for zero-overhead at runtime (inlined by TypeScript).
 */
export const MessageType = {
  // ─── Timer Control ────────────────────────────────────────────────────
  START_FOCUS:          'START_FOCUS',
  PAUSE_TIMER:          'PAUSE_TIMER',
  RESUME_TIMER:         'RESUME_TIMER',
  STOP_SESSION:         'STOP_SESSION',
  SKIP_BREAK:           'SKIP_BREAK',
  START_QUICK_FOCUS:    'START_QUICK_FOCUS',

  // ─── Nuclear Mode ─────────────────────────────────────────────────────
  ACTIVATE_NUCLEAR:     'ACTIVATE_NUCLEAR',
  GET_NUCLEAR_STATUS:   'GET_NUCLEAR_STATUS',

  // ─── Blocklist Management ─────────────────────────────────────────────
  ADD_TO_BLOCKLIST:     'ADD_TO_BLOCKLIST',
  REMOVE_FROM_BLOCKLIST:'REMOVE_FROM_BLOCKLIST',
  GET_BLOCKLIST:        'GET_BLOCKLIST',
  UPDATE_BLOCKLIST:     'UPDATE_BLOCKLIST',

  // ─── State Queries ────────────────────────────────────────────────────
  GET_SESSION_STATE:    'GET_SESSION_STATE',
  GET_TIMER_STATE:      'GET_TIMER_STATE',
  GET_FOCUS_SCORE:      'GET_FOCUS_SCORE',
  GET_STREAK:           'GET_STREAK',
  GET_STATS:            'GET_STATS',
  GET_DAILY_STATS:      'GET_DAILY_STATS',

  // ─── Settings ─────────────────────────────────────────────────────────
  GET_SETTINGS:         'GET_SETTINGS',
  UPDATE_SETTINGS:      'UPDATE_SETTINGS',

  // ─── License ──────────────────────────────────────────────────────────
  VALIDATE_LICENSE:     'VALIDATE_LICENSE',
  GET_LICENSE_STATUS:   'GET_LICENSE_STATUS',

  // ─── Schedule ─────────────────────────────────────────────────────────
  GET_SCHEDULE:         'GET_SCHEDULE',
  UPDATE_SCHEDULE:      'UPDATE_SCHEDULE',

  // ─── Content Script Reports ───────────────────────────────────────────
  CONTENT_ERROR:        'CONTENT_ERROR',
  BLOCK_PAGE_EVENT:     'BLOCK_PAGE_EVENT',
  TRACKER_DATA:         'TRACKER_DATA',

  // ─── Sound Control ────────────────────────────────────────────────────
  PLAY_SOUND:           'PLAY_SOUND',
  STOP_SOUND:           'STOP_SOUND',

  // ─── Offscreen Document (internal) ────────────────────────────────────
  OFFSCREEN_PLAY_SOUND: 'OFFSCREEN_PLAY_SOUND',
  OFFSCREEN_STOP_SOUND: 'OFFSCREEN_STOP_SOUND',

  // ─── Sync ─────────────────────────────────────────────────────────────
  TRIGGER_SYNC:         'TRIGGER_SYNC',
  GET_SYNC_STATUS:      'GET_SYNC_STATUS',
} as const;

export type MessageTypeName = typeof MessageType[keyof typeof MessageType];
```

#### TypeScript Interfaces for All Message Types

```typescript
// src/background/message-types.ts (continued)

// ─── Base Message ─────────────────────────────────────────────────────────
interface BaseMessage {
  type: MessageTypeName;
  /** Message version for forward compatibility */
  v?: number;
}

// ─── Timer Control Messages ──────────────────────────────────────────────
interface StartFocusMessage extends BaseMessage {
  type: typeof MessageType.START_FOCUS;
  duration: number;          // seconds
  blocklist?: string[];      // optional override for this session
  sound?: string;            // ambient sound ID
}

interface PauseTimerMessage extends BaseMessage {
  type: typeof MessageType.PAUSE_TIMER;
}

interface ResumeTimerMessage extends BaseMessage {
  type: typeof MessageType.RESUME_TIMER;
}

interface StopSessionMessage extends BaseMessage {
  type: typeof MessageType.STOP_SESSION;
  reason: 'user_cancel' | 'completed' | 'nuclear_override';
}

interface SkipBreakMessage extends BaseMessage {
  type: typeof MessageType.SKIP_BREAK;
}

interface StartQuickFocusMessage extends BaseMessage {
  type: typeof MessageType.START_QUICK_FOCUS;
  duration: number;          // seconds (typically 300-900 for quick focus)
}

// ─── Nuclear Mode Messages ───────────────────────────────────────────────
interface ActivateNuclearMessage extends BaseMessage {
  type: typeof MessageType.ACTIVATE_NUCLEAR;
  duration: number;          // seconds
  sites: string[];           // sites to nuclear-block
  confirmPhrase: string;     // user must type this to confirm
}

interface GetNuclearStatusMessage extends BaseMessage {
  type: typeof MessageType.GET_NUCLEAR_STATUS;
}

// ─── Blocklist Messages ──────────────────────────────────────────────────
interface AddToBlocklistMessage extends BaseMessage {
  type: typeof MessageType.ADD_TO_BLOCKLIST;
  entry: BlocklistEntry;
}

interface RemoveFromBlocklistMessage extends BaseMessage {
  type: typeof MessageType.REMOVE_FROM_BLOCKLIST;
  entryId: string;
}

interface GetBlocklistMessage extends BaseMessage {
  type: typeof MessageType.GET_BLOCKLIST;
}

interface UpdateBlocklistMessage extends BaseMessage {
  type: typeof MessageType.UPDATE_BLOCKLIST;
  blocklist: BlocklistEntry[];
}

// ─── State Query Messages ────────────────────────────────────────────────
interface GetSessionStateMessage extends BaseMessage {
  type: typeof MessageType.GET_SESSION_STATE;
}

interface GetTimerStateMessage extends BaseMessage {
  type: typeof MessageType.GET_TIMER_STATE;
}

interface GetFocusScoreMessage extends BaseMessage {
  type: typeof MessageType.GET_FOCUS_SCORE;
  period?: 'today' | 'week' | 'month' | 'all';
}

interface GetStreakMessage extends BaseMessage {
  type: typeof MessageType.GET_STREAK;
}

interface GetStatsMessage extends BaseMessage {
  type: typeof MessageType.GET_STATS;
  period: 'today' | 'week' | 'month' | 'all';
}

interface GetDailyStatsMessage extends BaseMessage {
  type: typeof MessageType.GET_DAILY_STATS;
  date: string; // "YYYY-MM-DD"
}

// ─── Settings Messages ───────────────────────────────────────────────────
interface GetSettingsMessage extends BaseMessage {
  type: typeof MessageType.GET_SETTINGS;
  section?: 'pomodoro' | 'notifications' | 'sounds' | 'ui' | 'all';
}

interface UpdateSettingsMessage extends BaseMessage {
  type: typeof MessageType.UPDATE_SETTINGS;
  section: 'pomodoro' | 'notifications' | 'sounds' | 'ui';
  values: Record<string, unknown>;
}

// ─── Content Script Messages ─────────────────────────────────────────────
interface ContentErrorMessage extends BaseMessage {
  type: typeof MessageType.CONTENT_ERROR;
  error: { message: string; stack?: string };
  url: string;
  script: 'detector' | 'blocker' | 'tracker';
}

interface BlockPageEventMessage extends BaseMessage {
  type: typeof MessageType.BLOCK_PAGE_EVENT;
  url: string;
  action: 'shown' | 'override_attempted' | 'motivational_clicked';
  timestamp: number;
}

interface TrackerDataMessage extends BaseMessage {
  type: typeof MessageType.TRACKER_DATA;
  url: string;
  timeOnPage: number;
  scrollDepth: number;
  tabId: number;
}

// ─── Union Type ──────────────────────────────────────────────────────────
export type FocusModeMessage =
  | StartFocusMessage
  | PauseTimerMessage
  | ResumeTimerMessage
  | StopSessionMessage
  | SkipBreakMessage
  | StartQuickFocusMessage
  | ActivateNuclearMessage
  | GetNuclearStatusMessage
  | AddToBlocklistMessage
  | RemoveFromBlocklistMessage
  | GetBlocklistMessage
  | UpdateBlocklistMessage
  | GetSessionStateMessage
  | GetTimerStateMessage
  | GetFocusScoreMessage
  | GetStreakMessage
  | GetStatsMessage
  | GetDailyStatsMessage
  | GetSettingsMessage
  | UpdateSettingsMessage
  | ContentErrorMessage
  | BlockPageEventMessage
  | TrackerDataMessage;
```

#### Message Router Implementation

```typescript
// src/background/message-router.ts

import { MessageType, type FocusModeMessage, type MessageTypeName } from './message-types.js';
import { errorHandler } from './error-handler.js';
import { storageManager } from './storage-manager.js';
import { focusScore } from './focus-score.js';

type MessageHandler = (
  message: FocusModeMessage,
  sender: chrome.runtime.MessageSender
) => Promise<unknown>;

class MessageRouter {
  private handlers: Map<MessageTypeName, MessageHandler> = new Map();
  private popupPort: chrome.runtime.Port | null = null;
  private optionsPort: chrome.runtime.Port | null = null;

  constructor() {
    this.registerAllHandlers();
  }

  /**
   * Main routing function — called from chrome.runtime.onMessage listener.
   *
   * CRITICAL: This function MUST return true for async handlers.
   * Returning true tells Chrome to keep the message channel open until
   * sendResponse is called. If we don't return true, the channel closes
   * immediately and the sender gets `undefined` as the response.
   */
  route(
    message: FocusModeMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void
  ): boolean {
    // Ignore messages not intended for us (e.g., from other extensions)
    if (!message || !message.type) {
      return false;
    }

    // Ignore messages targeting the offscreen document
    if ('target' in message && (message as any).target === 'offscreen') {
      return false;
    }

    const handler = this.handlers.get(message.type as MessageTypeName);
    if (!handler) {
      console.warn(`[MessageRouter] No handler for message type: ${message.type}`);
      sendResponse({ error: `Unknown message type: ${message.type}` });
      return false;
    }

    // Execute handler asynchronously and send response
    errorHandler.wrap(`message:${message.type}`, async () => {
      try {
        const result = await handler(message, sender);
        sendResponse({ success: true, data: result });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error(`[MessageRouter] Handler error for ${message.type}:`, err);
        sendResponse({ success: false, error: err.message });
      }
    });

    // CRITICAL: Return true to indicate we will call sendResponse asynchronously
    return true;
  }

  /**
   * Register all message handlers. Called once during construction.
   * Each handler is a pure async function that receives the message
   * and sender and returns the response data.
   */
  private registerAllHandlers(): void {
    // ─── Timer Control ────────────────────────────────────────────────
    this.on(MessageType.START_FOCUS, async (msg) => {
      const m = msg as StartFocusMessage;
      return timerEngine.startFocus(m.duration, m.blocklist, m.sound);
    });

    this.on(MessageType.PAUSE_TIMER, async () => {
      return timerEngine.pause();
    });

    this.on(MessageType.RESUME_TIMER, async () => {
      return timerEngine.resume();
    });

    this.on(MessageType.STOP_SESSION, async (msg) => {
      const m = msg as StopSessionMessage;
      return sessionManager.stopSession(m.reason);
    });

    this.on(MessageType.SKIP_BREAK, async () => {
      return timerEngine.skipBreak();
    });

    this.on(MessageType.START_QUICK_FOCUS, async (msg) => {
      const m = msg as StartQuickFocusMessage;
      return timerEngine.startQuickFocus(m.duration);
    });

    // ─── Nuclear Mode ─────────────────────────────────────────────────
    this.on(MessageType.ACTIVATE_NUCLEAR, async (msg) => {
      const m = msg as ActivateNuclearMessage;
      return sessionManager.activateNuclearMode(m.duration, m.sites, m.confirmPhrase);
    });

    this.on(MessageType.GET_NUCLEAR_STATUS, async () => {
      return sessionManager.getNuclearStatus();
    });

    // ─── Blocklist ────────────────────────────────────────────────────
    this.on(MessageType.ADD_TO_BLOCKLIST, async (msg) => {
      const m = msg as AddToBlocklistMessage;
      return blocklistManager.addEntry(m.entry);
    });

    this.on(MessageType.REMOVE_FROM_BLOCKLIST, async (msg) => {
      const m = msg as RemoveFromBlocklistMessage;
      return blocklistManager.removeEntry(m.entryId);
    });

    this.on(MessageType.GET_BLOCKLIST, async () => {
      return blocklistManager.getAll();
    });

    this.on(MessageType.UPDATE_BLOCKLIST, async (msg) => {
      const m = msg as UpdateBlocklistMessage;
      return blocklistManager.updateAll(m.blocklist);
    });

    // ─── State Queries ────────────────────────────────────────────────
    this.on(MessageType.GET_SESSION_STATE, async () => {
      return sessionManager.getState();
    });

    this.on(MessageType.GET_TIMER_STATE, async () => {
      return timerEngine.getState();
    });

    this.on(MessageType.GET_FOCUS_SCORE, async (msg) => {
      const m = msg as GetFocusScoreMessage;
      return focusScore.getScore(m.period ?? 'today');
    });

    this.on(MessageType.GET_STREAK, async () => {
      return streakTracker.getStreak();
    });

    this.on(MessageType.GET_STATS, async (msg) => {
      const m = msg as GetStatsMessage;
      return analyticsCollector.getStats(m.period);
    });

    this.on(MessageType.GET_DAILY_STATS, async (msg) => {
      const m = msg as GetDailyStatsMessage;
      return analyticsCollector.getDailyStats(m.date);
    });

    // ─── Settings ─────────────────────────────────────────────────────
    this.on(MessageType.GET_SETTINGS, async (msg) => {
      const m = msg as GetSettingsMessage;
      return settingsManager.get(m.section ?? 'all');
    });

    this.on(MessageType.UPDATE_SETTINGS, async (msg) => {
      const m = msg as UpdateSettingsMessage;
      return settingsManager.update(m.section, m.values);
    });

    // ─── Content Script Reports ───────────────────────────────────────
    this.on(MessageType.CONTENT_ERROR, async (msg, sender) => {
      const m = msg as ContentErrorMessage;
      errorHandler.capture(new Error(m.error.message), {
        context: 'content_script',
        script: m.script,
        url: m.url,
        tabId: sender.tab?.id,
        stack: m.error.stack,
      });
    });

    this.on(MessageType.BLOCK_PAGE_EVENT, async (msg) => {
      const m = msg as BlockPageEventMessage;
      analyticsCollector.trackBlockEvent(m.url, m.action, m.timestamp);
    });

    this.on(MessageType.TRACKER_DATA, async (msg) => {
      const m = msg as TrackerDataMessage;
      analyticsCollector.trackPageTime(m.url, m.timeOnPage, m.scrollDepth, m.tabId);
    });

    // ─── Sound Control ────────────────────────────────────────────────
    this.on(MessageType.PLAY_SOUND, async (msg) => {
      const m = msg as any;
      return soundController.play(m.soundId, m.volume);
    });

    this.on(MessageType.STOP_SOUND, async () => {
      return soundController.stop();
    });

    // ─── Sync ─────────────────────────────────────────────────────────
    this.on(MessageType.TRIGGER_SYNC, async () => {
      return syncManager.triggerSync();
    });

    this.on(MessageType.GET_SYNC_STATUS, async () => {
      return syncManager.getStatus();
    });
  }

  /**
   * Register a handler for a message type.
   */
  private on(type: MessageTypeName, handler: MessageHandler): void {
    this.handlers.set(type, handler);
  }

  // ... port management methods (shown in Section 1.5) ...
  handleConnect(port: chrome.runtime.Port): void {
    switch (port.name) {
      case 'popup':
        this.popupPort = port;
        storageManager.setSession('popupConnected', true);

        port.onMessage.addListener((message) => {
          // Handle port-based messages from popup (e.g., rapid UI interactions)
          this.route(message, { id: chrome.runtime.id } as any, (response) => {
            try { port.postMessage(response); } catch { /* port closed */ }
          });
        });

        port.onDisconnect.addListener(() => {
          this.popupPort = null;
          storageManager.setSession('popupConnected', false);
        });

        this.pushCurrentStateToPopup();
        break;

      case 'options':
        this.optionsPort = port;
        port.onDisconnect.addListener(() => {
          this.optionsPort = null;
        });
        break;

      default:
        console.warn(`[MessageRouter] Unknown port name: ${port.name}`);
    }
  }

  pushToPopup(message: object): void {
    try {
      this.popupPort?.postMessage(message);
    } catch {
      this.popupPort = null;
    }
  }

  pushToOptions(message: object): void {
    try {
      this.optionsPort?.postMessage(message);
    } catch {
      this.optionsPort = null;
    }
  }

  private async pushCurrentStateToPopup(): Promise<void> {
    const [sessionState, timerState, score, streak] = await Promise.all([
      storageManager.getSession('sessionState'),
      timerEngine.getState(),
      focusScore.getCurrentScore(),
      storageManager.getLocal('streak'),
    ]);

    this.pushToPopup({
      type: 'FULL_STATE_SYNC',
      sessionState,
      timer: timerState,
      focusScore: score,
      streak,
    });
  }
}

export const messageRouter = new MessageRouter();
```

---

### 2.2 Context-to-Context Communication

Focus Mode - Blocker has five execution contexts that need to communicate:

| Context | Lifetime | Can Send | Can Receive |
|---|---|---|---|
| **Service Worker** | Ephemeral (30s-5min) | `chrome.tabs.sendMessage`, port.postMessage | `chrome.runtime.onMessage`, port.onMessage |
| **Popup** | While popup is open | `chrome.runtime.sendMessage`, port.postMessage | response callback, port.onMessage |
| **Options Page** | While options tab is open | `chrome.runtime.sendMessage`, port.postMessage | response callback, port.onMessage |
| **Content Scripts** | Per-tab, per-page lifetime | `chrome.runtime.sendMessage` | `chrome.runtime.onMessage`, `chrome.tabs.sendMessage` |
| **Offscreen Document** | Until explicitly closed | `chrome.runtime.sendMessage` | `chrome.runtime.onMessage` |

#### Popup <-> Background: Timer Control, State, Scores

```typescript
// ─── Popup → Background: Start a focus session ──────────────────────────
// src/popup/popup.ts

async function handleStartFocus(): Promise<void> {
  const duration = getSelectedDuration(); // e.g., 1500 (25 min)
  const sound = getSelectedSound();       // e.g., 'rain'

  const response = await chrome.runtime.sendMessage({
    type: 'START_FOCUS',
    duration,
    sound,
  });

  if (response.success) {
    // Timer started — update UI
    renderFocusingState(response.data);
  } else {
    showError(response.error);
  }
}

// ─── Popup → Background: Get current timer state ────────────────────────
async function refreshTimerState(): Promise<void> {
  const response = await chrome.runtime.sendMessage({
    type: 'GET_TIMER_STATE',
  });

  if (response.success) {
    const { remaining, total, paused, intervalType } = response.data;
    updateTimerDisplay(remaining, total, paused, intervalType);
  }
}

// ─── Popup → Background: Get Focus Score ────────────────────────────────
async function loadFocusScore(): Promise<void> {
  const response = await chrome.runtime.sendMessage({
    type: 'GET_FOCUS_SCORE',
    period: 'today',
  });

  if (response.success) {
    renderFocusScore(response.data);
  }
}

// ─── Background → Popup: Real-time timer update (via port) ─────────────
// Service worker pushes updates every minute when pomodoro-tick fires:
// (in timer-engine.ts)
async tick(): Promise<void> {
  const remaining = computeRemaining(this.timerState);

  if (remaining <= 0) {
    await this.completeInterval();
    return;
  }

  // Persist updated remaining time
  await storageManager.setSession('timerRemaining', remaining);

  // Push to popup if connected
  messageRouter.pushToPopup({
    type: 'TIMER_UPDATE',
    remaining,
    total: this.timerState.totalDuration,
    intervalType: this.timerState.intervalType,
  });
}
```

#### Content Script -> Background: Error Reports, Block Events, Tracker Data

```typescript
// ─── Content Script (blocker.js) → Background: Block page shown ─────────
// src/content/blocker.js

// When the block overlay is displayed to the user:
chrome.runtime.sendMessage({
  type: 'BLOCK_PAGE_EVENT',
  url: window.location.href,
  action: 'shown',
  timestamp: Date.now(),
});

// When user clicks motivational quote on block page:
document.getElementById('motivational-btn')?.addEventListener('click', () => {
  chrome.runtime.sendMessage({
    type: 'BLOCK_PAGE_EVENT',
    url: window.location.href,
    action: 'motivational_clicked',
    timestamp: Date.now(),
  });
});

// ─── Content Script (tracker.js) → Background: Page time data ───────────
// src/content/tracker.js (runs at document_idle)

// Periodically report time spent on the current page:
let startTime = Date.now();

// Report on visibility change (user switches tabs or minimizes)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    const timeOnPage = (Date.now() - startTime) / 1000;
    chrome.runtime.sendMessage({
      type: 'TRACKER_DATA',
      url: window.location.href,
      timeOnPage,
      scrollDepth: getScrollDepth(),
      tabId: -1, // Background will use sender.tab.id
    });
    startTime = Date.now(); // Reset for next visibility period
  }
});

// ─── Content Script (detector.js) → Background: Error report ────────────
// src/content/detector.js

try {
  // ... detection logic ...
} catch (error) {
  chrome.runtime.sendMessage({
    type: 'CONTENT_ERROR',
    error: {
      message: error.message,
      stack: error.stack,
    },
    url: window.location.href,
    script: 'detector',
  });
}
```

#### Background -> Content Script: Block Commands, State Updates

```typescript
// ─── Background → Content Script: Send block command ─────────────────────
// src/background/blocklist-manager.ts

/**
 * When a tab navigates to a blocked URL and DNR doesn't fully handle it
 * (e.g., for soft-blocking with an overlay rather than full block),
 * send a message to the content script to show the block page.
 */
async function sendBlockCommand(tabId: number, url: string, reason: string): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, {
      type: 'SHOW_BLOCK_OVERLAY',
      url,
      reason,
      nuclearMode: await sessionManager.isNuclearModeActive(),
      motivationalQuote: getRandomQuote(),
    });
  } catch (error) {
    // Content script not yet injected — use scripting API to inject it
    if (String(error).includes('Could not establish connection')) {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['src/content/blocker.js'],
      });
      // Retry after injection
      await chrome.tabs.sendMessage(tabId, {
        type: 'SHOW_BLOCK_OVERLAY',
        url,
        reason,
        nuclearMode: await sessionManager.isNuclearModeActive(),
        motivationalQuote: getRandomQuote(),
      });
    }
  }
}

// ─── Background → Content Script: Notify state change ───────────────────
// When a focus session starts or ends, notify all tabs so content scripts
// can adjust their behavior (e.g., tracker.js starts/stops tracking)

async function broadcastStateChange(newState: string): Promise<void> {
  const tabs = await chrome.tabs.query({});
  const message = {
    type: 'SESSION_STATE_CHANGED',
    newState,
    timestamp: Date.now(),
  };

  for (const tab of tabs) {
    if (tab.id) {
      try {
        await chrome.tabs.sendMessage(tab.id, message);
      } catch {
        // Tab doesn't have our content script — skip silently
      }
    }
  }
}
```

#### Options <-> Background: Settings CRUD, License, Schedule

```typescript
// ─── Options → Background: Read settings ────────────────────────────────
// src/options/options.ts

async function loadSettings(): Promise<void> {
  const response = await chrome.runtime.sendMessage({
    type: 'GET_SETTINGS',
    section: 'all',
  });

  if (response.success) {
    populateSettingsForm(response.data);
  }
}

// ─── Options → Background: Update settings ──────────────────────────────
async function saveNotificationSettings(): Promise<void> {
  const values = {
    enabled: document.getElementById('notif-enabled').checked,
    sound: document.getElementById('notif-sound').value,
    sessionComplete: document.getElementById('notif-session-complete').checked,
    breakReminder: document.getElementById('notif-break-reminder').checked,
    streakWarning: document.getElementById('notif-streak-warning').checked,
  };

  const response = await chrome.runtime.sendMessage({
    type: 'UPDATE_SETTINGS',
    section: 'notifications',
    values,
  });

  if (response.success) {
    showSaveConfirmation();
  } else {
    showSaveError(response.error);
  }
}

// ─── Options → Background: License validation ───────────────────────────
async function validateLicense(token: string): Promise<void> {
  const response = await chrome.runtime.sendMessage({
    type: 'VALIDATE_LICENSE',
    token,
  });

  if (response.success && response.data.valid) {
    showLicenseActive(response.data.expiresAt);
  } else {
    showLicenseInvalid(response.data?.reason ?? response.error);
  }
}

// ─── Options → Background: Schedule configuration ───────────────────────
async function saveSchedule(config: ScheduleConfig): Promise<void> {
  const response = await chrome.runtime.sendMessage({
    type: 'UPDATE_SCHEDULE',
    schedule: config,
  });

  if (response.success) {
    showScheduleSaved();
  }
}
```

---

### 2.3 Port-Based Long-Lived Connections

#### When to Use Ports vs One-Shot Messages

| Criterion | One-Shot (`sendMessage`) | Port (`connect`) |
|---|---|---|
| **Frequency** | Occasional (user clicks, page loads) | Continuous (timer updates every second) |
| **Direction** | Request-response | Bidirectional streaming |
| **SW Lifetime** | SW can sleep between messages | Port keeps SW alive |
| **Reconnection** | Automatic (SW wakes on message) | Manual (must detect disconnect) |
| **Use in Focus Mode** | Blocklist CRUD, settings, score queries | Popup timer display, real-time state sync |

**Rule of thumb for Focus Mode:** Use one-shot messages for infrequent operations (settings updates, blocklist changes, score queries). Use ports only when the popup or options page is open and needs real-time updates.

#### Popup Port Connection: Real-Time Timer Updates

```typescript
// src/popup/timer-display.ts — Complete popup-side timer management

class TimerDisplay {
  private port: chrome.runtime.Port | null = null;
  private localCountdownInterval: number | null = null;
  private currentRemaining: number = 0;
  private currentTotal: number = 0;
  private isPaused: boolean = false;

  /**
   * Initialize the timer display. Connects to the SW and starts
   * local countdown for smooth per-second updates.
   */
  async initialize(): Promise<void> {
    // Connect to SW for real-time updates
    this.port = chrome.runtime.connect({ name: 'popup' });

    this.port.onMessage.addListener((message) => {
      switch (message.type) {
        case 'FULL_STATE_SYNC':
          this.handleFullSync(message);
          break;
        case 'TIMER_UPDATE':
          this.handleTimerUpdate(message);
          break;
        case 'STATE_CHANGE':
          this.handleStateChange(message);
          break;
      }
    });

    this.port.onDisconnect.addListener(() => {
      this.port = null;
      // SW terminated while popup is open — reconnect after short delay
      setTimeout(() => {
        if (!this.isClosing) {
          this.initialize();
        }
      }, 500);
    });
  }

  /**
   * Handle full state sync from SW (sent on initial connection).
   */
  private handleFullSync(message: any): void {
    if (message.timer) {
      this.currentRemaining = message.timer.remaining;
      this.currentTotal = message.timer.total;
      this.isPaused = message.timer.paused;
      this.startLocalCountdown();
    }
    // Update other UI elements...
  }

  /**
   * Handle timer correction from SW (sent every minute on pomodoro-tick).
   * Corrects any drift in the local countdown.
   */
  private handleTimerUpdate(message: any): void {
    const drift = Math.abs(this.currentRemaining - message.remaining);
    if (drift > 2) {
      // More than 2 seconds of drift — correct immediately
      console.debug(`[Timer] Correcting drift: ${drift.toFixed(1)}s`);
    }
    this.currentRemaining = message.remaining;
    this.currentTotal = message.total;
  }

  /**
   * Start local per-second countdown for smooth display.
   * The SW only updates every minute — this fills the gaps.
   */
  private startLocalCountdown(): void {
    this.stopLocalCountdown();

    if (this.isPaused) {
      this.render();
      return;
    }

    const startedAt = Date.now();
    const startRemaining = this.currentRemaining;

    this.localCountdownInterval = window.setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000;
      this.currentRemaining = Math.max(0, startRemaining - elapsed);
      this.render();

      if (this.currentRemaining <= 0) {
        this.stopLocalCountdown();
      }
    }, 1000);
  }

  private stopLocalCountdown(): void {
    if (this.localCountdownInterval !== null) {
      clearInterval(this.localCountdownInterval);
      this.localCountdownInterval = null;
    }
  }

  /**
   * Render the timer display.
   */
  private render(): void {
    const minutes = Math.floor(this.currentRemaining / 60);
    const seconds = Math.floor(this.currentRemaining % 60);
    const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    const timerEl = document.getElementById('timer-display');
    if (timerEl) timerEl.textContent = display;

    // Update progress ring
    const progress = 1 - (this.currentRemaining / this.currentTotal);
    const ring = document.getElementById('progress-ring');
    if (ring) {
      ring.style.setProperty('--progress', String(progress));
    }
  }

  private isClosing = false;

  destroy(): void {
    this.isClosing = true;
    this.stopLocalCountdown();
    this.port?.disconnect();
    this.port = null;
  }
}

export const timerDisplay = new TimerDisplay();
```

#### Port Lifecycle Management

```
Popup Opens          Popup Visible              SW Terminates     SW Restarts    Popup Closes
     │                     │                          │                │              │
     ▼                     │                          │                │              │
 connect()──────port alive─┼──────────────────────────┼────────────────┼──────────────┤
     │         (SW alive   │                          │                │              │
     │          via port)  │                          ▼                │              │
     │                     │                   onDisconnect fires      │              │
     │                     │                          │                │              │
     │                     │                   setTimeout(500)         │              │
     │                     │                          │                ▼              │
     │                     │                   reconnect()──────port alive────────────┤
     │                     │                          │          (SW alive again)     │
     │                     │                          │                │              ▼
     │                     │                          │                │        disconnect()
     │                     │                          │                │        (SW can sleep)
```

---

### 2.4 Message Serialization & Validation

#### JSON Serialization Constraint

All messages passed through `chrome.runtime.sendMessage` and `chrome.runtime.Port.postMessage` must be JSON-serializable. Chrome internally calls the structured clone algorithm, which is similar to `JSON.parse(JSON.stringify(obj))` but supports a few more types (Date, RegExp, ArrayBuffer, etc.). However, it does **not** support:

- Functions
- DOM nodes
- Symbols
- WeakMap/WeakSet
- Promises

```typescript
// src/shared/message-validation.ts

/**
 * Validate that a message is serializable and conforms to the expected shape.
 * Called before sending messages in development mode.
 */
export function validateMessage(message: unknown): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (typeof message !== 'object' || message === null) {
    return { valid: false, errors: ['Message must be a non-null object'] };
  }

  const msg = message as Record<string, unknown>;

  // Must have a type field
  if (typeof msg.type !== 'string') {
    errors.push('Message must have a string "type" field');
  }

  // Check for non-serializable values
  try {
    const serialized = JSON.stringify(message);
    const deserialized = JSON.parse(serialized);

    // Verify round-trip fidelity
    if (JSON.stringify(deserialized) !== serialized) {
      errors.push('Message does not survive JSON round-trip');
    }
  } catch (e) {
    errors.push(`Message is not JSON-serializable: ${e}`);
  }

  // Check for common mistakes
  for (const [key, value] of Object.entries(msg)) {
    if (typeof value === 'function') {
      errors.push(`Field "${key}" is a function — not serializable`);
    }
    if (value instanceof Promise) {
      errors.push(`Field "${key}" is a Promise — not serializable`);
    }
    if (value instanceof HTMLElement) {
      errors.push(`Field "${key}" is a DOM node — not serializable`);
    }
  }

  return { valid: errors.length === 0, errors };
}
```

#### Runtime Validation of Message Payloads

```typescript
// src/background/message-validator.ts

import { MessageType, type MessageTypeName } from './message-types.js';

interface ValidationRule {
  required?: string[];
  types?: Record<string, string | string[]>;  // field → expected typeof(s)
}

/**
 * Validation rules for each message type. Ensures malformed messages
 * from content scripts (which may be injected into hostile pages)
 * don't crash the service worker.
 */
const VALIDATION_RULES: Partial<Record<MessageTypeName, ValidationRule>> = {
  [MessageType.START_FOCUS]: {
    required: ['duration'],
    types: { duration: 'number' },
  },
  [MessageType.STOP_SESSION]: {
    required: ['reason'],
    types: { reason: 'string' },
  },
  [MessageType.ACTIVATE_NUCLEAR]: {
    required: ['duration', 'sites', 'confirmPhrase'],
    types: {
      duration: 'number',
      sites: 'object',  // Array — typeof [] === 'object'
      confirmPhrase: 'string',
    },
  },
  [MessageType.ADD_TO_BLOCKLIST]: {
    required: ['entry'],
    types: { entry: 'object' },
  },
  [MessageType.REMOVE_FROM_BLOCKLIST]: {
    required: ['entryId'],
    types: { entryId: 'string' },
  },
  [MessageType.UPDATE_SETTINGS]: {
    required: ['section', 'values'],
    types: { section: 'string', values: 'object' },
  },
  [MessageType.CONTENT_ERROR]: {
    required: ['error', 'url', 'script'],
    types: { error: 'object', url: 'string', script: 'string' },
  },
  [MessageType.BLOCK_PAGE_EVENT]: {
    required: ['url', 'action', 'timestamp'],
    types: { url: 'string', action: 'string', timestamp: 'number' },
  },
  [MessageType.TRACKER_DATA]: {
    required: ['url', 'timeOnPage', 'scrollDepth'],
    types: { url: 'string', timeOnPage: 'number', scrollDepth: 'number' },
  },
  [MessageType.GET_FOCUS_SCORE]: {
    types: { period: 'string' },
  },
  [MessageType.GET_DAILY_STATS]: {
    required: ['date'],
    types: { date: 'string' },
  },
};

/**
 * Validate an incoming message against its registered rules.
 * Returns null if valid, or an error string if invalid.
 */
export function validateMessagePayload(message: Record<string, unknown>): string | null {
  const type = message.type as MessageTypeName;
  const rule = VALIDATION_RULES[type];

  if (!rule) {
    // No validation rule — accept (for backward compatibility)
    return null;
  }

  // Check required fields
  if (rule.required) {
    for (const field of rule.required) {
      if (!(field in message) || message[field] === undefined || message[field] === null) {
        return `Missing required field: ${field}`;
      }
    }
  }

  // Check types
  if (rule.types) {
    for (const [field, expectedType] of Object.entries(rule.types)) {
      if (field in message && message[field] !== undefined) {
        const actualType = typeof message[field];
        const allowed = Array.isArray(expectedType) ? expectedType : [expectedType];
        if (!allowed.includes(actualType)) {
          return `Field "${field}" expected ${allowed.join('|')}, got ${actualType}`;
        }
      }
    }
  }

  return null;
}
```

#### Version-Tagged Messages for Forward Compatibility

```typescript
// All messages include an optional `v` (version) field. This allows
// future versions of Focus Mode to change message schemas while maintaining
// backward compatibility with older content scripts or popup pages that
// may be cached.

interface VersionedMessage {
  type: string;
  v?: number;  // defaults to 1 if omitted
}

// In the message router, version checking enables graceful handling:
function routeWithVersion(message: VersionedMessage): void {
  const version = message.v ?? 1;

  switch (message.type) {
    case MessageType.START_FOCUS:
      if (version === 1) {
        // Original schema: { type, duration }
        handleStartFocusV1(message);
      } else if (version === 2) {
        // Extended schema: { type, duration, blocklist, sound, breakDuration }
        handleStartFocusV2(message);
      }
      break;
    // ... other types
  }
}

// Example: v2 adds a breakDuration field to START_FOCUS
// Old popup (v1): { type: 'START_FOCUS', duration: 1500 }
// New popup (v2): { type: 'START_FOCUS', v: 2, duration: 1500, breakDuration: 300 }
// The SW handles both versions, using defaults for missing fields in v1.
```

---

## Section 3: Event-Driven Architecture

### 3.1 Chrome Event Listeners

Focus Mode - Blocker registers a comprehensive set of Chrome event listeners during service worker initialization. Every listener is registered **synchronously at the top level** of the service worker script -- this is a hard MV3 requirement. If a listener is registered inside an async callback, Chrome may terminate the SW before the callback runs, and the event will be lost.

#### Complete Event Listener Registry

```typescript
// =============================================================================
// src/background/event-registry.ts
// Complete registry of all Chrome event listeners used by Focus Mode - Blocker.
// This file documents every listener; actual registration happens in
// service-worker.js at the top level.
// =============================================================================

/**
 * All Chrome event listeners registered by Focus Mode - Blocker.
 * Each entry documents: the event, the handler, when it fires, and
 * what Focus Mode does in response.
 */
export const EVENT_REGISTRY = {

  // ─── Runtime Events ─────────────────────────────────────────────────────

  /**
   * chrome.runtime.onInstalled
   * Fires when: Extension first installed, extension updated, Chrome updated.
   * Handler: onInstalled(details)
   * Purpose: Set default settings, create alarms, register DNR rules,
   *          show onboarding, run data migrations on update.
   */
  'runtime.onInstalled': {
    event: 'chrome.runtime.onInstalled',
    handler: 'onInstalled',
    fires: 'First install, extension update, Chrome update',
    critical: true,
  },

  /**
   * chrome.runtime.onStartup
   * Fires when: A new browser profile starts (browser launch with this profile).
   * Handler: onStartup()
   * Purpose: Restore alarms that may have been cleared by Chrome,
   *          validate streak state, clean up stale session data.
   * NOTE: Does NOT fire on SW restart — only on actual browser startup.
   */
  'runtime.onStartup': {
    event: 'chrome.runtime.onStartup',
    handler: 'onStartup',
    fires: 'Browser profile startup (not SW restart)',
    critical: true,
  },

  /**
   * chrome.runtime.onSuspend
   * Fires when: Chrome is about to terminate the service worker.
   * Handler: onSuspend()
   * Purpose: Last chance to flush buffers (analytics, errors),
   *          persist any in-memory state to chrome.storage.session.
   * WARNING: You have very limited time here (~5 seconds).
   *          Do NOT start new async operations — only flush existing buffers.
   */
  'runtime.onSuspend': {
    event: 'chrome.runtime.onSuspend',
    handler: 'onSuspend',
    fires: 'Just before SW termination',
    critical: true,
  },

  /**
   * chrome.runtime.onMessage
   * Fires when: Any context sends chrome.runtime.sendMessage().
   * Handler: messageRouter.route(message, sender, sendResponse)
   * Purpose: Central message routing for all 22+ message types.
   * MUST return true from the listener to keep sendResponse alive for async handlers.
   */
  'runtime.onMessage': {
    event: 'chrome.runtime.onMessage',
    handler: 'messageRouter.route',
    fires: 'Any sendMessage call from popup, options, content scripts, offscreen',
    critical: true,
  },

  /**
   * chrome.runtime.onConnect
   * Fires when: A context calls chrome.runtime.connect().
   * Handler: messageRouter.handleConnect(port)
   * Purpose: Establish long-lived port connections with popup and options page
   *          for real-time state streaming (timer updates, score changes).
   */
  'runtime.onConnect': {
    event: 'chrome.runtime.onConnect',
    handler: 'messageRouter.handleConnect',
    fires: 'Popup opens, options page opens',
    critical: true,
  },

  // ─── Alarm Events ───────────────────────────────────────────────────────

  /**
   * chrome.alarms.onAlarm
   * Fires when: Any registered alarm triggers.
   * Handler: handleAlarm(alarm)
   * Purpose: Routes to the appropriate handler based on alarm.name.
   *          Handles all 12+ alarms: pomodoro-tick, break-timer,
   *          nuclear-countdown, streak-check, analytics-flush, error-flush,
   *          memory-check, schedule-check, license-revalidate,
   *          daily-stats-aggregation, session-autosave, badge-update.
   */
  'alarms.onAlarm': {
    event: 'chrome.alarms.onAlarm',
    handler: 'handleAlarm',
    fires: 'When any registered alarm triggers (1-minute minimum interval)',
    critical: true,
  },

  // ─── Tab Events ─────────────────────────────────────────────────────────

  /**
   * chrome.tabs.onActivated
   * Fires when: The user switches to a different tab.
   * Handler: analyticsCollector.trackTabSwitch(activeInfo)
   * Purpose: Track tab switches during focus sessions for the distraction
   *          metric. Tab switches during FOCUSING state reduce Focus Score.
   *          Also used to detect if user navigated to a blocked site in a
   *          tab that was already open.
   */
  'tabs.onActivated': {
    event: 'chrome.tabs.onActivated',
    handler: 'analyticsCollector.trackTabSwitch',
    fires: 'User switches active tab',
    critical: false,
  },

  /**
   * chrome.tabs.onUpdated
   * Fires when: A tab's URL, title, or loading state changes.
   * Handler: blocklistManager.evaluateNavigation(tabId, url, tab)
   * Purpose: Detect when a tab navigates to a blocked URL. This is the
   *          secondary blocking mechanism — DNR handles most blocking at
   *          the network level, but onUpdated catches soft-block scenarios
   *          (show overlay instead of full block) and same-origin navigations
   *          that DNR may not intercept.
   * Filter: Only processes events where changeInfo.url is defined.
   */
  'tabs.onUpdated': {
    event: 'chrome.tabs.onUpdated',
    handler: 'blocklistManager.evaluateNavigation',
    fires: 'Tab URL changes, tab finishes loading',
    critical: false,
  },

  /**
   * chrome.tabs.onRemoved
   * Fires when: A tab is closed.
   * Handler: sessionManager.cleanupTab(tabId)
   * Purpose: Clean up any per-tab state (active tracker data, pending
   *          block page analytics events). Prevents memory leaks from
   *          accumulating tab-specific data for closed tabs.
   */
  'tabs.onRemoved': {
    event: 'chrome.tabs.onRemoved',
    handler: 'sessionManager.cleanupTab',
    fires: 'Tab closed',
    critical: false,
  },

  // ─── Storage Events ─────────────────────────────────────────────────────

  /**
   * chrome.storage.onChanged
   * Fires when: Any value in chrome.storage (local, session, or sync) changes.
   * Handler: handleStorageChange(changes, areaName)
   * Purpose: React to settings changes made from the options page, sync
   *          changes from other devices (via chrome.storage.sync), and
   *          coordinate state between modules that share storage keys.
   */
  'storage.onChanged': {
    event: 'chrome.storage.onChanged',
    handler: 'handleStorageChange',
    fires: 'Any chrome.storage value changes (local, session, or sync)',
    critical: false,
  },

  // ─── Notification Events ────────────────────────────────────────────────

  /**
   * chrome.notifications.onClicked
   * Fires when: User clicks on a browser notification created by Focus Mode.
   * Handler: notificationManager.handleClick(notificationId)
   * Purpose: Handle notification actions — e.g., clicking "Start Break"
   *          notification opens the popup, clicking "Session Complete"
   *          opens the stats page, clicking "Streak Warning" opens settings.
   */
  'notifications.onClicked': {
    event: 'chrome.notifications.onClicked',
    handler: 'notificationManager.handleClick',
    fires: 'User clicks a Focus Mode notification',
    critical: false,
  },

  // ─── Action Events ──────────────────────────────────────────────────────

  /**
   * chrome.action.onClicked
   * Fires when: User clicks the extension icon AND no popup is configured.
   * Handler: handleActionClick(tab)
   * Purpose: Fallback handler. Normally the popup opens on icon click, but
   *          if the popup fails to load, this handler opens the popup in a
   *          new tab as a fallback. Also used when popup_behavior is set to
   *          'quick-toggle' mode (starts/stops focus with one click).
   * NOTE: This listener does NOT fire when a popup is defined in the manifest.
   *       It only fires if chrome.action.setPopup({ popup: '' }) is called.
   */
  'action.onClicked': {
    event: 'chrome.action.onClicked',
    handler: 'handleActionClick',
    fires: 'Extension icon clicked (only when no popup is set)',
    critical: false,
  },

  // ─── DeclarativeNetRequest Events (Debug Only) ──────────────────────────

  /**
   * chrome.declarativeNetRequest.onRuleMatchedDebug
   * Fires when: A DNR rule matches a network request (debug mode only).
   * Handler: Inline console.debug logging.
   * Purpose: Development-time debugging of blocking rules. Logs which rule
   *          matched which URL. Only available when the extension is loaded
   *          unpacked (developer mode). Has no effect in production.
   * NOTE: Guarded by typeof check — this event does not exist in production.
   */
  'declarativeNetRequest.onRuleMatchedDebug': {
    event: 'chrome.declarativeNetRequest.onRuleMatchedDebug',
    handler: 'console.debug (inline)',
    fires: 'DNR rule matches a request (dev mode only)',
    critical: false,
  },

} as const;
```

---

### 3.2 Event Handler Patterns

#### Top-Level Synchronous Registration (MV3 Requirement)

This is the single most important architectural constraint in MV3. All event listeners **must** be registered synchronously during the first execution of the service worker script. Chrome records which events have listeners during this initial execution. If the SW terminates and an event fires, Chrome knows to restart the SW to deliver it -- but only if the listener was registered at the top level.

```typescript
// =============================================================================
// CORRECT: Top-level synchronous registration
// =============================================================================

// This runs synchronously when the SW script first executes.
// Chrome records that we have an onAlarm listener.
// If the SW terminates and an alarm fires, Chrome restarts the SW
// and the listener is re-registered during script re-execution.

chrome.alarms.onAlarm.addListener((alarm) => {
  errorHandler.wrap(`alarm:${alarm.name}`, () => handleAlarm(alarm));
});

// =============================================================================
// WRONG: Registration inside async callback
// =============================================================================

// This listener may never be registered! If the SW terminates before
// the storage.get() callback runs, the listener is lost. Chrome will
// NOT restart the SW for alarm events because it never saw the registration.

async function init() {
  const settings = await chrome.storage.local.get('settings');
  if (settings.alarmsEnabled) {
    // TOO LATE — this is inside an async callback
    chrome.alarms.onAlarm.addListener((alarm) => {
      handleAlarm(alarm); // May never be called!
    });
  }
}
init();

// =============================================================================
// WRONG: Conditional registration
// =============================================================================

// Even if you think a feature is disabled, ALWAYS register the listener.
// The listener can check the condition internally. Omitting registration
// means the SW won't wake up for that event.

// BAD:
if (featureFlag.notifications) {
  chrome.notifications.onClicked.addListener(handleNotificationClick);
}

// GOOD:
chrome.notifications.onClicked.addListener((notificationId) => {
  // Check condition INSIDE the handler
  if (!notificationManager.isEnabled()) return;
  notificationManager.handleClick(notificationId);
});
```

#### Never Register Listeners Inside Async Callbacks

```typescript
// This pattern appears frequently in MV2 extensions and is DANGEROUS in MV3.

// DANGEROUS — listener registered in an async context:
chrome.runtime.onInstalled.addListener(async (details) => {
  await setupDatabase();

  // This listener is registered INSIDE an async handler.
  // If the SW terminates and restarts, onInstalled won't fire again
  // (it only fires on install/update), so this storage.onChanged
  // listener will NEVER be re-registered.
  chrome.storage.onChanged.addListener((changes) => {
    reactToChanges(changes);
  });
});

// SAFE — both listeners at top level:
chrome.runtime.onInstalled.addListener((details) => {
  errorHandler.wrap('onInstalled', () => onInstalled(details));
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  errorHandler.wrap('storageChanged', () =>
    handleStorageChange(changes, areaName)
  );
});
```

#### Error Boundary Wrapping for Every Handler

Every event handler in Focus Mode is wrapped with `errorHandler.wrap()`. This ensures that an unhandled exception in one handler does not crash the entire service worker or prevent other handlers from executing.

```typescript
// src/background/error-handler.ts — wrap() implementation (from Section 1.2)

// The wrap function creates a try/catch boundary around both synchronous
// and asynchronous handlers:

class ErrorHandler {
  wrap(contextName: string, fn: () => void | Promise<void>): void {
    try {
      const result = fn();
      if (result instanceof Promise) {
        result.catch((error) => {
          this.capture(error, { context: contextName });
        });
      }
    } catch (error) {
      this.capture(
        error instanceof Error ? error : new Error(String(error)),
        { context: contextName }
      );
    }
  }
}

// Usage in every listener:
chrome.tabs.onActivated.addListener((activeInfo) => {
  errorHandler.wrap('tabActivated', () =>
    analyticsCollector.trackTabSwitch(activeInfo)
  );
});

// If trackTabSwitch() throws, the error is captured and logged.
// The SW continues running. Other listeners are unaffected.
// The error is buffered and flushed to storage by the error-flush alarm.
```

#### Performance: Keep Handlers Fast, Defer Heavy Work

```typescript
// Chrome expects event handlers to complete quickly. If a handler takes
// too long, Chrome may terminate the SW. The general rules:

// 1. Synchronous work in handlers should complete in < 10ms
// 2. Async work should complete in < 30 seconds (Chrome's event timeout)
// 3. If work takes longer, chunk it across multiple alarm cycles

// Example: Daily stats aggregation is heavy — chunk it:

class AnalyticsCollector {
  async aggregateDaily(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const sessions = await storageManager.getLocal('sessionHistory');

    if (!sessions || sessions.length === 0) return;

    // Filter to today's sessions only (fast operation)
    const todaySessions = sessions.filter(
      (s) => s.completedAt.startsWith(today)
    );

    // Compute aggregates (CPU-light, but could be many sessions)
    const stats: DailyStats = {
      date: today,
      totalFocusMinutes: 0,
      sessionsCompleted: 0,
      sessionsAbandoned: 0,
      averageFocusScore: 0,
      topBlockedSites: [],
      tabSwitches: 0,
    };

    for (const session of todaySessions) {
      stats.totalFocusMinutes += session.durationMinutes;
      if (session.completed) {
        stats.sessionsCompleted++;
      } else {
        stats.sessionsAbandoned++;
      }
      stats.averageFocusScore += session.focusScore;
      stats.tabSwitches += session.tabSwitches;
    }

    if (stats.sessionsCompleted + stats.sessionsAbandoned > 0) {
      stats.averageFocusScore /= (stats.sessionsCompleted + stats.sessionsAbandoned);
    }

    // Persist the aggregated stats
    await storageManager.updateLocal('dailyStats', (current = {}) => ({
      ...current,
      [today]: stats,
    }));
  }
}
```

---

### 3.3 onInstalled Handler

The `chrome.runtime.onInstalled` handler is the most complex event handler in Focus Mode - Blocker. It must handle three distinct scenarios: first install, extension update, and Chrome update. Each scenario requires different initialization steps.

```typescript
// src/background/install-handler.ts

import { storageManager } from './storage-manager.js';
import { alarmManager } from './alarm-manager.js';
import { ruleEngine } from './rule-engine.js';
import { blocklistManager } from './blocklist-manager.js';
import { analyticsCollector } from './analytics-collector.js';
import { errorHandler } from './error-handler.js';

/**
 * Default settings applied on first install.
 */
const DEFAULT_SETTINGS = {
  pomodoroSettings: {
    focusDuration: 1500,        // 25 minutes in seconds
    shortBreakDuration: 300,    // 5 minutes
    longBreakDuration: 900,     // 15 minutes
    longBreakInterval: 4,       // Long break after every 4 focus sessions
    autoStartBreaks: false,
    autoStartFocus: false,
  },
  notificationSettings: {
    enabled: true,
    sound: 'default',
    sessionComplete: true,
    breakReminder: true,
    streakWarning: true,
    nuclearReminder: false,     // Nuclear mode speaks for itself
  },
  soundSettings: {
    ambientEnabled: false,
    ambientSound: 'none',
    volume: 0.5,
    completionSound: 'bell',
  },
  uiSettings: {
    theme: 'system',
    compactMode: false,
    showFocusScore: true,
    showStreak: true,
    showMotivationalQuotes: true,
  },
  scheduleConfig: {
    enabled: false,
    schedules: [],
  },
};

/**
 * Default state values applied on first install.
 */
const DEFAULT_STATE = {
  blocklist: [],
  customRules: [],
  nextRuleId: 1,
  sessionHistory: [],
  dailyStats: {},
  focusScoreHistory: [],
  streak: {
    currentStreak: 0,
    longestStreak: 0,
    lastFocusDate: null,
    streakStartDate: null,
  },
  badges: [],
  analyticsEvents: [],
  analyticsLastFlush: 0,
  licenseCache: null,
  licenseToken: null,
  _errorLog: [],
  nuclearMode: null,
};

/**
 * Handle chrome.runtime.onInstalled event.
 */
export async function onInstalled(
  details: chrome.runtime.InstalledDetails
): Promise<void> {
  const { reason, previousVersion } = details;

  console.log(`[Focus Mode] onInstalled: reason=${reason}, previousVersion=${previousVersion}`);

  switch (reason) {
    case 'install':
      await handleFirstInstall();
      break;
    case 'update':
      await handleExtensionUpdate(previousVersion!);
      break;
    case 'chrome_update':
      await handleChromeUpdate();
      break;
  }
}

// ─── First Install ──────────────────────────────────────────────────────────

async function handleFirstInstall(): Promise<void> {
  console.log('[Focus Mode] First install — setting up defaults');

  // Step 1: Set default settings
  await chrome.storage.local.set({
    ...DEFAULT_SETTINGS,
    ...DEFAULT_STATE,
    _installedAt: Date.now(),
    _version: chrome.runtime.getManifest().version,
  });

  // Step 2: Initialize session storage
  await chrome.storage.session.set({
    sessionState: 'IDLE',
    timerRemaining: null,
    timerPaused: false,
    timerLastSync: null,
    timerActiveAlarm: null,
    activeSession: null,
    pomodoroCount: 0,
    currentScoreAccumulator: null,
    tabSwitchCount: 0,
    lastActiveTabId: null,
    badgeText: '',
    badgeColor: '#2563EB',
    popupConnected: false,
    _startupTiming: null,
  });

  // Step 3: Create all persistent alarms
  await alarmManager.ensurePersistentAlarms();

  // Step 4: Register initial DNR rules (empty blocklist = no rules)
  await ruleEngine.registerRules([]);

  // Step 5: Show onboarding tab
  await chrome.tabs.create({
    url: chrome.runtime.getURL('src/onboarding/welcome.html'),
    active: true,
  });

  // Step 6: Track install event
  analyticsCollector.track('extension_installed', {
    version: chrome.runtime.getManifest().version,
    timestamp: Date.now(),
  });

  console.log('[Focus Mode] First install complete');
}

// ─── Extension Update ───────────────────────────────────────────────────────

/**
 * Data migration registry. Each migration has a version it applies to
 * and a function that transforms the stored data.
 */
const MIGRATIONS: Array<{
  fromVersion: string;
  toVersion: string;
  migrate: () => Promise<void>;
}> = [
  {
    fromVersion: '0.9.0',
    toVersion: '1.0.0',
    migrate: async () => {
      // v0.9 stored blocklist as string[]; v1.0 uses BlocklistEntry[]
      const { blocklist } = await chrome.storage.local.get('blocklist');
      if (Array.isArray(blocklist) && typeof blocklist[0] === 'string') {
        const migrated = blocklist.map((url: string, index: number) => ({
          id: `entry_${index}`,
          pattern: url,
          type: 'domain' as const,
          enabled: true,
          createdAt: Date.now(),
        }));
        await chrome.storage.local.set({ blocklist: migrated });
        console.log(`[Migration] Migrated ${migrated.length} blocklist entries from string to object format`);
      }

      // v0.9 had no Focus Score; initialize it
      const { focusScoreHistory } = await chrome.storage.local.get('focusScoreHistory');
      if (!focusScoreHistory) {
        await chrome.storage.local.set({ focusScoreHistory: [] });
      }

      // v0.9 had no badges; initialize
      const { badges } = await chrome.storage.local.get('badges');
      if (!badges) {
        await chrome.storage.local.set({ badges: [] });
      }
    },
  },
  // Future migrations go here. Each migration is idempotent and checks
  // the current data state before applying changes.
];

async function handleExtensionUpdate(previousVersion: string): Promise<void> {
  const currentVersion = chrome.runtime.getManifest().version;
  console.log(`[Focus Mode] Updating from ${previousVersion} to ${currentVersion}`);

  // Step 1: Run applicable data migrations
  for (const migration of MIGRATIONS) {
    if (isVersionLessThanOrEqual(previousVersion, migration.fromVersion)) {
      console.log(`[Migration] Running migration: ${migration.fromVersion} → ${migration.toVersion}`);
      try {
        await migration.migrate();
        console.log(`[Migration] Completed: ${migration.fromVersion} → ${migration.toVersion}`);
      } catch (error) {
        errorHandler.capture(error, {
          context: 'data_migration',
          from: migration.fromVersion,
          to: migration.toVersion,
        });
        // Continue with other migrations — don't let one failure block all
      }
    }
  }

  // Step 2: Ensure all persistent alarms exist (may have been added in new version)
  await alarmManager.ensurePersistentAlarms();

  // Step 3: Re-register DNR rules (rule format may have changed)
  const { blocklist } = await chrome.storage.local.get('blocklist');
  if (blocklist) {
    await ruleEngine.registerRules(blocklist);
  }

  // Step 4: Update stored version
  await chrome.storage.local.set({ _version: currentVersion });

  // Step 5: Show "What's New" page (if significant update)
  if (isMajorOrMinorUpdate(previousVersion, currentVersion)) {
    await chrome.tabs.create({
      url: chrome.runtime.getURL(`src/onboarding/whats-new.html?from=${previousVersion}`),
      active: false, // Don't steal focus
    });
  }

  // Step 6: Track update event
  analyticsCollector.track('extension_updated', {
    from: previousVersion,
    to: currentVersion,
    timestamp: Date.now(),
  });

  console.log(`[Focus Mode] Update to ${currentVersion} complete`);
}

// ─── Chrome Update ──────────────────────────────────────────────────────────

async function handleChromeUpdate(): Promise<void> {
  console.log('[Focus Mode] Chrome updated — verifying extension integrity');

  // Step 1: Verify DNR rules are still registered
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const { blocklist } = await chrome.storage.local.get('blocklist');

  if (blocklist && blocklist.length > 0 && existingRules.length === 0) {
    // Rules were cleared by Chrome update — re-register
    console.warn('[Focus Mode] DNR rules cleared by Chrome update — re-registering');
    await ruleEngine.registerRules(blocklist);
  }

  // Step 2: Verify alarms are still active
  await alarmManager.ensurePersistentAlarms();

  // Step 3: Check for API deprecations (future-proofing)
  // This is where we'd check if any Chrome APIs we depend on have changed.
  // For now, just log the Chrome version for debugging.
  const manifest = chrome.runtime.getManifest();
  console.log(`[Focus Mode] Chrome update verified. Extension v${manifest.version}`);
}

// ─── Helper Functions ───────────────────────────────────────────────────────

function isVersionLessThanOrEqual(a: string, b: string): boolean {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] ?? 0;
    const numB = partsB[i] ?? 0;
    if (numA < numB) return true;
    if (numA > numB) return false;
  }
  return true; // Equal
}

function isMajorOrMinorUpdate(from: string, to: string): boolean {
  const [fromMajor, fromMinor] = from.split('.').map(Number);
  const [toMajor, toMinor] = to.split('.').map(Number);
  return toMajor > fromMajor || (toMajor === fromMajor && toMinor > fromMinor);
}
```

#### onStartup Handler

```typescript
// src/background/startup-handler.ts

/**
 * Handle chrome.runtime.onStartup event.
 * Fires when the browser launches with this profile — NOT on SW restart.
 * This is the place to clean up state from the previous browser session.
 */
export async function onStartup(): Promise<void> {
  console.log('[Focus Mode] Browser startup detected');

  // Step 1: Clear session storage (it should already be empty after browser restart,
  // but be explicit about resetting to known state)
  await chrome.storage.session.set({
    sessionState: 'IDLE',
    timerRemaining: null,
    timerPaused: false,
    timerLastSync: null,
    timerActiveAlarm: null,
    activeSession: null,
    pomodoroCount: 0,
    currentScoreAccumulator: null,
    tabSwitchCount: 0,
    lastActiveTabId: null,
    badgeText: '',
    badgeColor: '#2563EB',
    popupConnected: false,
    _startupTiming: null,
  });

  // Step 2: Check if nuclear mode was active when browser closed
  const { nuclearMode } = await chrome.storage.local.get('nuclearMode');
  if (nuclearMode && nuclearMode.expiresAt > Date.now()) {
    // Nuclear mode is still active — restore it
    console.log('[Focus Mode] Restoring nuclear mode (still active)');
    await sessionManager.restoreNuclearMode(nuclearMode);
  } else if (nuclearMode) {
    // Nuclear mode expired while browser was closed — clean up
    console.log('[Focus Mode] Nuclear mode expired during browser closure — cleaning up');
    await chrome.storage.local.set({ nuclearMode: null });
    await ruleEngine.removeNuclearRules();
  }

  // Step 3: Validate streak
  await streakTracker.validateStreak();

  // Step 4: Ensure alarms exist
  await alarmManager.ensurePersistentAlarms();

  // Step 5: Clear any stale timer alarms (no session is active on fresh startup)
  await chrome.alarms.clear('pomodoro-tick');
  await chrome.alarms.clear('break-timer');

  // Step 6: Restore badge to idle state (show streak if any)
  await updateBadge();

  console.log('[Focus Mode] Browser startup complete');
}
```

#### onSuspend Handler

```typescript
// src/background/suspend-handler.ts

/**
 * Handle chrome.runtime.onSuspend event.
 * Called just before Chrome terminates the service worker.
 *
 * CRITICAL: You have approximately 5 seconds to complete all work here.
 * Do NOT start new async operations that could take a long time.
 * Only flush existing buffers and save in-memory state.
 */
export async function onSuspend(): Promise<void> {
  console.log('[Focus Mode] SW suspending — flushing buffers');

  // Use Promise.allSettled to ensure all flush operations attempt to complete
  // even if one fails. We can't afford to let one failure prevent others.
  await Promise.allSettled([
    // Flush analytics buffer to persistent storage
    analyticsCollector.flush(),

    // Flush error buffer to persistent storage
    errorHandler.flush(),

    // Save current timer state to session storage (in case it drifted
    // since the last pomodoro-tick)
    timerEngine.persistCurrentState(),

    // Save startup timing data for debugging
    startupTiming.persist(),

    // Log the suspend event for diagnostics
    storageManager.updateLocal('_errorLog', (log = []) => [
      ...log.slice(-499),
      {
        message: 'SW suspended',
        context: { context: 'onSuspend' },
        timestamp: Date.now(),
      },
    ]),
  ]);

  console.log('[Focus Mode] SW suspend flush complete');
}
```

---

### 3.4 State Machine: Session Lifecycle

Focus Mode - Blocker's core behavior is governed by a finite state machine that tracks the current session lifecycle. Every state transition is validated, persisted, and broadcast to all connected contexts.

#### State Diagram

```
                        ┌─────────────────────────────────────────────────────┐
                        │                                                     │
                        ▼                                                     │
                   ┌─────────┐                                                │
           ┌──────│  IDLE    │──────────────────────────────────┐             │
           │      └─────────┘                                    │             │
           │           │                                         │             │
           │     START_FOCUS                              START_QUICK_FOCUS     │
           │           │                                         │             │
           │           ▼                                         ▼             │
           │     ┌───────────┐                           ┌──────────────┐     │
           │     │ FOCUSING  │                           │ QUICK_FOCUS  │     │
           │     └───────────┘                           └──────────────┘     │
           │           │                                         │             │
           │           │ timer completes                  timer completes      │
           │           │                                    or user stops      │
           │           ▼                                         │             │
           │     ┌─────────────┐                                 │             │
           │     │ SHORT_BREAK │                                 │             │
           │     └─────────────┘                                 │             │
           │           │                                         │             │
           │     break completes                                 │             │
           │     or user skips                                   │             │
           │           │                                         │             │
           │           ▼                                         │             │
           │     ┌───────────┐                                   │             │
           │     │ FOCUSING  │ (repeat pomodoroCount times)      │             │
           │     └───────────┘                                   │             │
           │           │                                         │             │
           │     pomodoroCount === longBreakInterval              │             │
           │           │                                         │             │
           │           ▼                                         │             │
           │     ┌────────────┐                                  │             │
           │     │ LONG_BREAK │                                  │             │
           │     └────────────┘                                  │             │
           │           │                                         │             │
           │     break completes                                 │             │
           │           │                                         │             │
           │           └─────────────────────────────────────────┘             │
           │                          │                                        │
           │                          ▼                                        │
           │                     ┌─────────┐                                   │
           │                     │  IDLE    │                                   │
           │                     └─────────┘                                   │
           │                                                                   │
           │     ACTIVATE_NUCLEAR (from ANY state)                             │
           │           │                                                       │
           │           ▼                                                       │
           │     ┌──────────────┐                                              │
           └────►│ NUCLEAR_MODE │──── timer expires ───────────────────────────┘
                 └──────────────┘
                 (locked until expiry — cannot be cancelled)
```

#### State Type Definitions

```typescript
// src/background/session-types.ts

/**
 * All possible session states.
 */
export type SessionStateName =
  | 'IDLE'
  | 'FOCUSING'
  | 'SHORT_BREAK'
  | 'LONG_BREAK'
  | 'QUICK_FOCUS'
  | 'NUCLEAR_MODE';

/**
 * Valid state transitions. Maps each state to the states it can transition to.
 */
export const VALID_TRANSITIONS: Record<SessionStateName, SessionStateName[]> = {
  IDLE:          ['FOCUSING', 'QUICK_FOCUS', 'NUCLEAR_MODE'],
  FOCUSING:      ['SHORT_BREAK', 'LONG_BREAK', 'IDLE', 'NUCLEAR_MODE'],
  SHORT_BREAK:   ['FOCUSING', 'IDLE', 'NUCLEAR_MODE'],
  LONG_BREAK:    ['FOCUSING', 'IDLE', 'NUCLEAR_MODE'],
  QUICK_FOCUS:   ['IDLE', 'NUCLEAR_MODE'],
  NUCLEAR_MODE:  ['IDLE'],  // Can ONLY transition to IDLE when timer expires
};

/**
 * Active session metadata stored in chrome.storage.session.
 */
export interface ActiveSession {
  /** Unique session ID (UUID v4) */
  id: string;

  /** Session type */
  type: 'pomodoro' | 'quick-focus' | 'nuclear';

  /** Timestamp when the session started */
  startedAt: number;

  /** Pomodoro settings for this session */
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;

  /** Blocked sites for this session (snapshot at start time) */
  blocklist: BlocklistEntry[];

  /** Ambient sound playing during this session */
  ambientSound: string | null;

  /** For nuclear mode: the list of nuclear-blocked sites */
  nuclearSites?: string[];

  /** For nuclear mode: the expiration timestamp */
  nuclearExpiresAt?: number;
}

/**
 * Completed session record stored in chrome.storage.local.
 */
export interface CompletedSession {
  id: string;
  type: 'pomodoro' | 'quick-focus' | 'nuclear';
  startedAt: number;
  completedAt: number;
  durationMinutes: number;
  completed: boolean;         // true if timer ran to completion
  reason: 'completed' | 'user_cancel' | 'nuclear_override';
  focusScore: number;
  tabSwitches: number;
  blockedSiteAttempts: number;
  pomodoroCount: number;
}
```

#### Session Manager: State Transition Validation

```typescript
// src/background/session-manager.ts

import {
  type SessionStateName,
  type ActiveSession,
  type CompletedSession,
  VALID_TRANSITIONS,
} from './session-types.js';
import { storageManager } from './storage-manager.js';
import { errorHandler } from './error-handler.js';
import { alarmManager } from './alarm-manager.js';
import { ruleEngine } from './rule-engine.js';
import { messageRouter } from './message-router.js';

class SessionManager {
  private currentState: SessionStateName = 'IDLE';

  /**
   * Restore session state from storage on SW restart.
   */
  async restore(): Promise<void> {
    const state = await storageManager.getSession('sessionState');
    this.currentState = (state as SessionStateName) ?? 'IDLE';
    console.log(`[SessionManager] Restored state: ${this.currentState}`);
  }

  /**
   * Get the current session state.
   */
  getState(): SessionStateName {
    return this.currentState;
  }

  /**
   * Attempt a state transition. Validates the transition is legal,
   * persists the new state, and notifies all connected contexts.
   */
  async transition(newState: SessionStateName): Promise<void> {
    const validTargets = VALID_TRANSITIONS[this.currentState];

    if (!validTargets.includes(newState)) {
      const error = new Error(
        `Invalid state transition: ${this.currentState} → ${newState}. ` +
        `Valid transitions from ${this.currentState}: [${validTargets.join(', ')}]`
      );
      errorHandler.capture(error, {
        context: 'state_transition',
        from: this.currentState,
        to: newState,
      });
      throw error;
    }

    const previousState = this.currentState;
    this.currentState = newState;

    // Persist to session storage
    await storageManager.setSession('sessionState', newState);

    // Update badge
    await updateBadge();

    // Notify popup (if connected)
    messageRouter.pushToPopup({
      type: 'STATE_CHANGE',
      previousState,
      newState,
      timestamp: Date.now(),
    });

    // Broadcast to content scripts
    await broadcastStateChange(newState);

    console.log(`[SessionManager] State transition: ${previousState} → ${newState}`);
  }

  /**
   * Start a new focus session.
   */
  async startFocusSession(session: ActiveSession): Promise<void> {
    await this.transition('FOCUSING');

    await storageManager.setSessionBatch({
      activeSession: session,
      pomodoroCount: (await storageManager.getSession('pomodoroCount') ?? 0),
      tabSwitchCount: 0,
      currentScoreAccumulator: {
        totalTime: session.focusDuration,
        tabSwitches: 0,
        blockedAttempts: 0,
        startedAt: Date.now(),
      },
    });

    // Activate blocking rules for this session
    await ruleEngine.registerRules(session.blocklist);

    // Create the timer alarm
    await alarmManager.createTimerAlarm('pomodoro-tick', session.focusDuration / 60);
  }

  /**
   * Complete the current focus interval and transition to break.
   */
  async completeFocusInterval(): Promise<void> {
    const pomodoroCount = ((await storageManager.getSession('pomodoroCount')) ?? 0) + 1;
    const session = await storageManager.getSession('activeSession');

    await storageManager.setSession('pomodoroCount', pomodoroCount);

    // Clear the focus timer alarm
    await alarmManager.clearTimerAlarm('pomodoro-tick');

    // Determine break type
    if (pomodoroCount % (session?.longBreakInterval ?? 4) === 0) {
      await this.transition('LONG_BREAK');
      await alarmManager.createTimerAlarm(
        'break-timer',
        (session?.longBreakDuration ?? 900) / 60
      );
    } else {
      await this.transition('SHORT_BREAK');
      await alarmManager.createTimerAlarm(
        'break-timer',
        (session?.shortBreakDuration ?? 300) / 60
      );
    }

    // Show notification
    await notificationManager.showBreakNotification(pomodoroCount);

    // Calculate and record Focus Score for this interval
    await focusScore.recordInterval();
  }

  /**
   * Complete the current break and return to focus (or idle).
   */
  async completeBreak(): Promise<void> {
    await alarmManager.clearTimerAlarm('break-timer');

    const session = await storageManager.getSession('activeSession');
    if (session?.type === 'pomodoro') {
      // Auto-start next focus interval (if setting enabled) or go idle
      const settings = await storageManager.getLocal('pomodoroSettings');
      if (settings?.autoStartFocus) {
        await this.transition('FOCUSING');
        await alarmManager.createTimerAlarm('pomodoro-tick', session.focusDuration / 60);
      } else {
        await this.transition('IDLE');
        await this.recordCompletedSession('completed');
      }
    } else {
      await this.transition('IDLE');
    }
  }

  /**
   * Stop the current session (user cancellation).
   */
  async stopSession(reason: 'user_cancel' | 'completed' | 'nuclear_override'): Promise<void> {
    // Clear all timer alarms
    await alarmManager.clearTimerAlarm('pomodoro-tick');
    await alarmManager.clearTimerAlarm('break-timer');

    // Stop ambient sound
    await soundController.stop();

    // Record the session
    await this.recordCompletedSession(reason);

    // Reset session state
    await storageManager.setSessionBatch({
      activeSession: null,
      pomodoroCount: 0,
      timerRemaining: null,
      timerPaused: false,
      timerLastSync: null,
      timerActiveAlarm: null,
      currentScoreAccumulator: null,
      tabSwitchCount: 0,
    });

    await this.transition('IDLE');
  }

  /**
   * Activate nuclear mode. This is irreversible until the timer expires.
   */
  async activateNuclearMode(
    duration: number,
    sites: string[],
    confirmPhrase: string
  ): Promise<void> {
    // Validate confirmation phrase
    if (confirmPhrase !== 'I WANT TO FOCUS') {
      throw new Error('Invalid confirmation phrase for nuclear mode');
    }

    const expiresAt = Date.now() + (duration * 1000);

    // Store nuclear mode state persistently (survives browser restart)
    const nuclearState = {
      activatedAt: Date.now(),
      expiresAt,
      sites,
      duration,
    };
    await storageManager.setLocal('nuclearMode', nuclearState);

    // Register nuclear-level DNR rules (highest priority, cannot be overridden)
    await ruleEngine.registerNuclearRules(sites);

    // Create the nuclear countdown alarm
    await alarmManager.createNuclearAlarm(expiresAt);

    // Transition to nuclear mode
    await this.transition('NUCLEAR_MODE');

    // Store session metadata
    await storageManager.setSession('activeSession', {
      id: crypto.randomUUID(),
      type: 'nuclear',
      startedAt: Date.now(),
      focusDuration: duration,
      shortBreakDuration: 0,
      longBreakDuration: 0,
      longBreakInterval: 0,
      blocklist: [],
      ambientSound: null,
      nuclearSites: sites,
      nuclearExpiresAt: expiresAt,
    });

    // Show nuclear mode notification
    await notificationManager.showNuclearActivated(duration, sites.length);
  }

  /**
   * End nuclear mode (called only when the nuclear-countdown alarm fires).
   */
  async endNuclearMode(): Promise<void> {
    console.log('[SessionManager] Nuclear mode expired');

    // Remove nuclear DNR rules
    await ruleEngine.removeNuclearRules();

    // Clear nuclear state
    await storageManager.setLocal('nuclearMode', null);

    // Record the completed session
    await this.recordCompletedSession('completed');

    // Reset session state
    await storageManager.setSessionBatch({
      activeSession: null,
      timerRemaining: null,
      timerPaused: false,
      timerLastSync: null,
      timerActiveAlarm: null,
    });

    await this.transition('IDLE');

    // Show completion notification
    await notificationManager.showNuclearCompleted();
  }

  /**
   * Restore nuclear mode state after browser restart.
   */
  async restoreNuclearMode(state: NuclearModeState): Promise<void> {
    this.currentState = 'NUCLEAR_MODE';
    await storageManager.setSession('sessionState', 'NUCLEAR_MODE');

    // Ensure nuclear DNR rules are still active
    await ruleEngine.registerNuclearRules(state.sites);

    // Ensure the countdown alarm exists
    const alarm = await chrome.alarms.get('nuclear-countdown');
    if (!alarm) {
      await alarmManager.createNuclearAlarm(state.expiresAt);
    }

    await updateBadge();
  }

  /**
   * Get nuclear mode status.
   */
  async getNuclearStatus(): Promise<{
    active: boolean;
    expiresAt: number | null;
    sites: string[];
    remainingSeconds: number;
  }> {
    const nuclearMode = await storageManager.getLocal('nuclearMode');
    if (!nuclearMode || nuclearMode.expiresAt <= Date.now()) {
      return { active: false, expiresAt: null, sites: [], remainingSeconds: 0 };
    }
    return {
      active: true,
      expiresAt: nuclearMode.expiresAt,
      sites: nuclearMode.sites,
      remainingSeconds: Math.ceil((nuclearMode.expiresAt - Date.now()) / 1000),
    };
  }

  /**
   * Clean up state associated with a closed tab.
   */
  async cleanupTab(tabId: number): Promise<void> {
    const lastActiveTab = await storageManager.getSession('lastActiveTabId');
    if (lastActiveTab === tabId) {
      await storageManager.setSession('lastActiveTabId', null);
    }
  }

  /**
   * Auto-save session state (called by session-autosave alarm).
   */
  async autosave(): Promise<void> {
    // Session state is already persisted on every change, but this
    // serves as a safety net in case a write was lost.
    if (this.currentState !== 'IDLE') {
      await storageManager.setSession('sessionState', this.currentState);
    }
  }

  /**
   * Record a completed (or abandoned) session to persistent history.
   */
  private async recordCompletedSession(
    reason: 'completed' | 'user_cancel' | 'nuclear_override'
  ): Promise<void> {
    const session = await storageManager.getSession('activeSession');
    if (!session) return;

    const tabSwitches = (await storageManager.getSession('tabSwitchCount')) ?? 0;
    const score = await focusScore.getCurrentScore();

    const record: CompletedSession = {
      id: session.id,
      type: session.type,
      startedAt: session.startedAt,
      completedAt: Date.now(),
      durationMinutes: Math.round((Date.now() - session.startedAt) / 60000),
      completed: reason === 'completed',
      reason,
      focusScore: score,
      tabSwitches,
      blockedSiteAttempts: 0, // TODO: track from analytics
      pomodoroCount: (await storageManager.getSession('pomodoroCount')) ?? 0,
    };

    await storageManager.updateLocal('sessionHistory', (history = []) => {
      const updated = [...history, record];
      // Keep last 1000 sessions
      return updated.slice(-1000);
    });

    // Update streak
    if (reason === 'completed') {
      await streakTracker.recordCompletedSession();
    }
  }
}

export const sessionManager = new SessionManager();
```

#### Timer Coordination with State Transitions

```typescript
// src/background/timer-engine.ts

import { storageManager } from './storage-manager.js';
import { sessionManager } from './session-manager.js';
import { alarmManager } from './alarm-manager.js';
import { messageRouter } from './message-router.js';

class TimerEngine {
  private timerState: TimerState | null = null;

  /**
   * Restore timer state from storage on SW restart.
   */
  async restore(): Promise<void> {
    const remaining = await storageManager.getSession('timerRemaining');
    const lastSync = await storageManager.getSession('timerLastSync');
    const paused = await storageManager.getSession('timerPaused');
    const activeAlarm = await storageManager.getSession('timerActiveAlarm');
    const session = await storageManager.getSession('activeSession');

    if (remaining === null || remaining === undefined || !session) {
      this.timerState = null;
      return;
    }

    // Reconstruct remaining time accounting for elapsed time since last sync
    let adjustedRemaining = remaining;
    if (!paused && lastSync) {
      const elapsedSinceSync = (Date.now() - lastSync) / 1000;
      adjustedRemaining = Math.max(0, remaining - elapsedSinceSync);
    }

    this.timerState = {
      totalDuration: session.focusDuration,
      startedAt: session.startedAt,
      elapsedBeforePause: session.focusDuration - adjustedRemaining,
      paused: paused ?? false,
      intervalType: this.determineIntervalType(sessionManager.getState()),
    };

    // Persist the corrected remaining time
    await storageManager.setSessionBatch({
      timerRemaining: adjustedRemaining,
      timerLastSync: Date.now(),
    });

    // Check if timer already expired during SW termination
    if (adjustedRemaining <= 0) {
      await this.handleTimerExpired();
    }

    console.log(
      `[TimerEngine] Restored: ${adjustedRemaining.toFixed(0)}s remaining, ` +
      `paused=${paused}, alarm=${activeAlarm}`
    );
  }

  /**
   * Handle a pomodoro-tick alarm firing.
   */
  async tick(): Promise<void> {
    const remaining = await storageManager.getSession('timerRemaining');
    const lastSync = await storageManager.getSession('timerLastSync');
    const paused = await storageManager.getSession('timerPaused');

    if (remaining === null || remaining === undefined || paused) return;

    // Compute actual remaining time
    const elapsedSinceSync = (Date.now() - (lastSync ?? Date.now())) / 1000;
    const newRemaining = Math.max(0, remaining - elapsedSinceSync);

    // Persist
    await storageManager.setSessionBatch({
      timerRemaining: newRemaining,
      timerLastSync: Date.now(),
    });

    if (newRemaining <= 0) {
      await this.handleTimerExpired();
      return;
    }

    // Push update to popup
    const session = await storageManager.getSession('activeSession');
    messageRouter.pushToPopup({
      type: 'TIMER_UPDATE',
      remaining: newRemaining,
      total: session?.focusDuration ?? 0,
      intervalType: this.determineIntervalType(sessionManager.getState()),
    });

    // Update badge
    const minutes = Math.ceil(newRemaining / 60);
    await chrome.action.setBadgeText({ text: `${minutes}m` });
  }

  /**
   * Handle timer expiration.
   */
  private async handleTimerExpired(): Promise<void> {
    const state = sessionManager.getState();

    switch (state) {
      case 'FOCUSING':
      case 'QUICK_FOCUS':
        await sessionManager.completeFocusInterval();
        break;
      case 'SHORT_BREAK':
      case 'LONG_BREAK':
        await sessionManager.completeBreak();
        break;
    }
  }

  /**
   * Start a new focus session.
   */
  async startFocus(
    duration: number,
    blocklist?: string[],
    sound?: string
  ): Promise<{ remaining: number; total: number }> {
    const settings = await storageManager.getLocal('pomodoroSettings');
    const allBlocklist = blocklist
      ? await blocklistManager.resolveEntries(blocklist)
      : await storageManager.getLocal('blocklist') ?? [];

    const session: ActiveSession = {
      id: crypto.randomUUID(),
      type: 'pomodoro',
      startedAt: Date.now(),
      focusDuration: duration,
      shortBreakDuration: settings?.shortBreakDuration ?? 300,
      longBreakDuration: settings?.longBreakDuration ?? 900,
      longBreakInterval: settings?.longBreakInterval ?? 4,
      blocklist: allBlocklist,
      ambientSound: sound ?? null,
    };

    // Store timer state
    await storageManager.setSessionBatch({
      timerRemaining: duration,
      timerLastSync: Date.now(),
      timerPaused: false,
      timerActiveAlarm: 'pomodoro-tick',
    });

    // Start the session (handles state transition and alarm creation)
    await sessionManager.startFocusSession(session);

    // Start ambient sound if requested
    if (sound && sound !== 'none') {
      const soundSettings = await storageManager.getLocal('soundSettings');
      await soundController.play(sound, soundSettings?.volume ?? 0.5);
    }

    return { remaining: duration, total: duration };
  }

  /**
   * Pause the current timer.
   */
  async pause(): Promise<void> {
    const remaining = await storageManager.getSession('timerRemaining');
    const lastSync = await storageManager.getSession('timerLastSync');

    if (remaining === null || remaining === undefined) {
      throw new Error('No active timer to pause');
    }

    // Compute exact remaining at pause time
    const elapsed = (Date.now() - (lastSync ?? Date.now())) / 1000;
    const pauseRemaining = Math.max(0, remaining - elapsed);

    await storageManager.setSessionBatch({
      timerRemaining: pauseRemaining,
      timerPaused: true,
      timerLastSync: Date.now(),
    });

    // Clear the timer alarm (no need to tick while paused)
    await alarmManager.clearTimerAlarm('pomodoro-tick');
    await alarmManager.clearTimerAlarm('break-timer');

    messageRouter.pushToPopup({
      type: 'TIMER_UPDATE',
      remaining: pauseRemaining,
      total: (await storageManager.getSession('activeSession'))?.focusDuration ?? 0,
      paused: true,
    });
  }

  /**
   * Resume from pause.
   */
  async resume(): Promise<void> {
    const remaining = await storageManager.getSession('timerRemaining');
    if (remaining === null || remaining === undefined) {
      throw new Error('No active timer to resume');
    }

    await storageManager.setSessionBatch({
      timerPaused: false,
      timerLastSync: Date.now(),
    });

    // Re-create the timer alarm
    const state = sessionManager.getState();
    const alarmName = (state === 'SHORT_BREAK' || state === 'LONG_BREAK')
      ? 'break-timer'
      : 'pomodoro-tick';

    await alarmManager.createTimerAlarm(alarmName as any, remaining / 60);

    messageRouter.pushToPopup({
      type: 'TIMER_UPDATE',
      remaining,
      total: (await storageManager.getSession('activeSession'))?.focusDuration ?? 0,
      paused: false,
    });
  }

  /**
   * Skip the current break and return to focus.
   */
  async skipBreak(): Promise<void> {
    await alarmManager.clearTimerAlarm('break-timer');
    await sessionManager.completeBreak();
  }

  /**
   * Start a quick focus session (simplified, no breaks).
   */
  async startQuickFocus(duration: number): Promise<{ remaining: number; total: number }> {
    const allBlocklist = await storageManager.getLocal('blocklist') ?? [];

    const session: ActiveSession = {
      id: crypto.randomUUID(),
      type: 'quick-focus',
      startedAt: Date.now(),
      focusDuration: duration,
      shortBreakDuration: 0,
      longBreakDuration: 0,
      longBreakInterval: 0,
      blocklist: allBlocklist,
      ambientSound: null,
    };

    await storageManager.setSessionBatch({
      timerRemaining: duration,
      timerLastSync: Date.now(),
      timerPaused: false,
      timerActiveAlarm: 'pomodoro-tick',
      activeSession: session,
    });

    await sessionManager.transition('QUICK_FOCUS');
    await ruleEngine.registerRules(allBlocklist);
    await alarmManager.createTimerAlarm('pomodoro-tick', duration / 60);

    return { remaining: duration, total: duration };
  }

  /**
   * Get the current timer state for UI display.
   */
  async getState(): Promise<{
    remaining: number;
    total: number;
    paused: boolean;
    intervalType: string;
    sessionState: string;
  } | null> {
    const remaining = await storageManager.getSession('timerRemaining');
    if (remaining === null || remaining === undefined) return null;

    const session = await storageManager.getSession('activeSession');
    const paused = await storageManager.getSession('timerPaused');
    const lastSync = await storageManager.getSession('timerLastSync');

    let adjustedRemaining = remaining;
    if (!paused && lastSync) {
      const elapsed = (Date.now() - lastSync) / 1000;
      adjustedRemaining = Math.max(0, remaining - elapsed);
    }

    return {
      remaining: adjustedRemaining,
      total: session?.focusDuration ?? 0,
      paused: paused ?? false,
      intervalType: this.determineIntervalType(sessionManager.getState()),
      sessionState: sessionManager.getState(),
    };
  }

  /**
   * Persist current timer state to session storage.
   * Called from onSuspend as a safety net.
   */
  async persistCurrentState(): Promise<void> {
    const remaining = await storageManager.getSession('timerRemaining');
    const paused = await storageManager.getSession('timerPaused');
    const lastSync = await storageManager.getSession('timerLastSync');

    if (remaining === null || remaining === undefined) return;

    if (!paused && lastSync) {
      const elapsed = (Date.now() - lastSync) / 1000;
      const adjusted = Math.max(0, remaining - elapsed);
      await storageManager.setSessionBatch({
        timerRemaining: adjusted,
        timerLastSync: Date.now(),
      });
    }
  }

  /**
   * Handle break timer tick.
   */
  async breakTick(): Promise<void> {
    // Same logic as tick() but for break intervals
    await this.tick();
  }

  private determineIntervalType(
    state: SessionStateName
  ): 'focus' | 'short-break' | 'long-break' {
    switch (state) {
      case 'SHORT_BREAK': return 'short-break';
      case 'LONG_BREAK': return 'long-break';
      default: return 'focus';
    }
  }
}

export const timerEngine = new TimerEngine();
```

#### Badge and Icon Updates on State Change

```typescript
// src/background/badge-manager.ts

import { storageManager } from './storage-manager.js';

/**
 * Badge configuration for each session state.
 */
const BADGE_CONFIG: Record<SessionStateName, {
  getText: (context: BadgeContext) => string;
  color: string;
  icon?: string;
}> = {
  IDLE: {
    getText: (ctx) => ctx.streakDays > 0 ? `${ctx.streakDays}d` : '',
    color: '#F59E0B',  // Amber for streak
    icon: 'icons/idle-128.png',
  },
  FOCUSING: {
    getText: (ctx) => `${Math.ceil(ctx.remainingSeconds / 60)}m`,
    color: '#2563EB',  // Blue for focus
    icon: 'icons/focus-128.png',
  },
  SHORT_BREAK: {
    getText: () => 'BRK',
    color: '#10B981',  // Green for break
    icon: 'icons/break-128.png',
  },
  LONG_BREAK: {
    getText: () => 'BRK',
    color: '#10B981',  // Green for break
    icon: 'icons/break-128.png',
  },
  QUICK_FOCUS: {
    getText: (ctx) => `${Math.ceil(ctx.remainingSeconds / 60)}m`,
    color: '#8B5CF6',  // Purple for quick focus
    icon: 'icons/quick-128.png',
  },
  NUCLEAR_MODE: {
    getText: (ctx) => `${Math.ceil(ctx.remainingSeconds / 60)}m`,
    color: '#DC2626',  // Red for nuclear
    icon: 'icons/nuclear-128.png',
  },
};

interface BadgeContext {
  remainingSeconds: number;
  streakDays: number;
}

/**
 * Update the browser action badge based on current session state.
 * Called after every state transition, on every timer tick, and on SW restart.
 */
export async function updateBadge(): Promise<void> {
  const sessionState = (await storageManager.getSession('sessionState')) as SessionStateName ?? 'IDLE';
  const timerRemaining = (await storageManager.getSession('timerRemaining')) ?? 0;
  const streak = await storageManager.getLocal('streak');

  const config = BADGE_CONFIG[sessionState];
  const context: BadgeContext = {
    remainingSeconds: timerRemaining,
    streakDays: streak?.currentStreak ?? 0,
  };

  const text = config.getText(context);
  await chrome.action.setBadgeText({ text });
  await chrome.action.setBadgeBackgroundColor({ color: config.color });

  // Update icon if specified
  if (config.icon) {
    await chrome.action.setIcon({
      path: {
        16: config.icon.replace('128', '16'),
        32: config.icon.replace('128', '32'),
        48: config.icon.replace('128', '48'),
        128: config.icon,
      },
    });
  }

  // Cache badge state for fast restoration on SW restart
  await storageManager.setSessionBatch({
    badgeText: text,
    badgeColor: config.color,
  });
}
```

#### Storage Change Handler

```typescript
// src/background/storage-change-handler.ts

/**
 * Handle changes to chrome.storage from any context.
 * This enables reactive updates — when the options page changes a setting,
 * the SW reacts immediately without needing a separate message.
 */
export async function handleStorageChange(
  changes: Record<string, chrome.storage.StorageChange>,
  areaName: string
): Promise<void> {
  // ─── Local Storage Changes ──────────────────────────────────────────
  if (areaName === 'local') {
    // Settings changes from options page
    if (changes.pomodoroSettings) {
      const newSettings = changes.pomodoroSettings.newValue;
      console.log('[StorageChange] Pomodoro settings updated:', newSettings);
      // No immediate action needed — settings are read on next session start
    }

    if (changes.notificationSettings) {
      const newSettings = changes.notificationSettings.newValue;
      notificationManager.updateSettings(newSettings);
    }

    if (changes.soundSettings) {
      const newSettings = changes.soundSettings.newValue;
      // If currently playing, update volume
      if (newSettings.volume !== changes.soundSettings.oldValue?.volume) {
        soundController.setVolume(newSettings.volume);
      }
    }

    if (changes.blocklist) {
      // Blocklist updated — re-register DNR rules
      const newBlocklist = changes.blocklist.newValue;
      await ruleEngine.registerRules(newBlocklist);
      console.log(`[StorageChange] Blocklist updated: ${newBlocklist.length} entries`);
    }

    if (changes.scheduleConfig) {
      // Schedule changed — re-evaluate immediately
      await scheduleEngine.evaluate();
    }
  }

  // ─── Sync Storage Changes (from other devices) ─────────────────────
  if (areaName === 'sync') {
    if (changes.syncedBlocklist) {
      // Another device updated the blocklist via sync
      console.log('[StorageChange] Synced blocklist received from another device');
      await syncManager.mergeIncomingBlocklist(changes.syncedBlocklist.newValue);
    }

    if (changes.syncedSettings) {
      console.log('[StorageChange] Synced settings received from another device');
      await syncManager.mergeIncomingSettings(changes.syncedSettings.newValue);
    }
  }

  // ─── Session Storage Changes ────────────────────────────────────────
  // Session storage changes are typically caused by this SW itself,
  // so we generally don't need to react to them. However, during
  // development, the DevTools panel may modify session storage directly.
  if (areaName === 'session') {
    // No reactive handlers needed for session storage changes
  }
}
```

#### Action Click Handler

```typescript
// src/background/action-handler.ts

/**
 * Handle extension icon click (only fires when no popup is configured).
 * Used as a fallback and for the "quick toggle" feature.
 */
export async function handleActionClick(tab: chrome.tabs.Tab): Promise<void> {
  const sessionState = await storageManager.getSession('sessionState') as SessionStateName;
  const settings = await storageManager.getLocal('uiSettings');

  if (settings?.quickToggleMode) {
    // Quick toggle: click icon to start/stop focus
    if (sessionState === 'IDLE') {
      const pomodoroSettings = await storageManager.getLocal('pomodoroSettings');
      await timerEngine.startFocus(pomodoroSettings?.focusDuration ?? 1500);
    } else if (sessionState === 'FOCUSING' || sessionState === 'QUICK_FOCUS') {
      await sessionManager.stopSession('user_cancel');
    }
    // Breaks and nuclear mode: clicking does nothing in quick toggle mode
  } else {
    // Fallback: open popup in a new tab
    await chrome.tabs.create({
      url: chrome.runtime.getURL('src/popup/popup.html'),
      active: true,
    });
  }
}
```

---

*This document covers the complete service worker lifecycle management, message passing architecture, and event-driven patterns for Focus Mode - Blocker v1.0.0. All code examples are specific to the extension's 18-module architecture and 12+ alarm system. For declarativeNetRequest rule management, content script injection, and the gamification system, see the companion architecture documents.*
