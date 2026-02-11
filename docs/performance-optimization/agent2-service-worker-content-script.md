# Agent 2 — Service Worker Efficiency & Content Script Performance
## Phase 20: Performance Optimization Guide — Focus Mode - Blocker

> **Date:** February 11, 2026 | **Agent:** 2 of 5
> **Scope:** Sections 3–4 — Service Worker Efficiency (MV3), Content Script Performance
> **Depends on:** Phase 12 (MV3 Architecture — service worker lifecycle), Phase 05 (Pomodoro timer), Phase 08 (Nuclear Mode), Phase 06 (Focus Score)

---

## 3. Service Worker Efficiency (MV3)

### 3.1 Focus Mode Wake-up Optimization

The service worker is the backbone of Focus Mode — it manages blocking rules, the Pomodoro timer, Nuclear Mode enforcement, Focus Score calculation, and streak tracking. Cold start performance is critical.

```javascript
// src/background/index.js

// ═══════════════════════════════════════════
// RULE 1: Register all listeners at top level
// (MV3 requirement — must be synchronous)
// ═══════════════════════════════════════════

chrome.runtime.onInstalled.addListener(handleInstall);
chrome.runtime.onStartup.addListener(handleStartup);
chrome.runtime.onMessage.addListener(handleMessage);
chrome.alarms.onAlarm.addListener(handleAlarm);
chrome.declarativeNetRequest.onRuleMatchedDebug?.addListener(handleRuleMatch);

// ═══════════════════════════════════════════
// RULE 2: Lazy initialization — never at top level
// ═══════════════════════════════════════════

// BAD: Heavy init at top level — runs on EVERY wake
// const focusScore = await calculateFocusScore(); // ❌ Blocks startup

// GOOD: Lazy singletons
let _focusScoreEngine = null;
let _nuclearModeEngine = null;
let _pomodoroTimer = null;
let _blockingEngine = null;

async function getFocusScoreEngine() {
  if (!_focusScoreEngine) {
    const { FocusScoreEngine } = await import('./engines/focus-score.js');
    _focusScoreEngine = new FocusScoreEngine();
    await _focusScoreEngine.init();
  }
  return _focusScoreEngine;
}

async function getNuclearModeEngine() {
  if (!_nuclearModeEngine) {
    const { NuclearModeEngine } = await import('./engines/nuclear-mode.js');
    _nuclearModeEngine = new NuclearModeEngine();
    await _nuclearModeEngine.init();
  }
  return _nuclearModeEngine;
}

async function getPomodoroTimer() {
  if (!_pomodoroTimer) {
    const { PomodoroTimer } = await import('./engines/pomodoro.js');
    _pomodoroTimer = new PomodoroTimer();
    await _pomodoroTimer.init();
  }
  return _pomodoroTimer;
}

async function getBlockingEngine() {
  if (!_blockingEngine) {
    const { BlockingEngine } = await import('./engines/blocking.js');
    _blockingEngine = new BlockingEngine();
    await _blockingEngine.init();
  }
  return _blockingEngine;
}

// ═══════════════════════════════════════════
// RULE 3: Message handler dispatches to lazy engines
// ═══════════════════════════════════════════

function handleMessage(msg, sender, sendResponse) {
  // Return true to keep channel open for async response
  dispatchMessage(msg, sender).then(sendResponse).catch(err => {
    sendResponse({ error: err.message });
  });
  return true;
}

async function dispatchMessage(msg, sender) {
  switch (msg.type) {
    // Blocking
    case 'ADD_BLOCKED_SITE':
    case 'REMOVE_BLOCKED_SITE':
    case 'GET_BLOCKLIST':
    case 'CHECK_BLOCKED':
      return (await getBlockingEngine()).handle(msg);

    // Pomodoro
    case 'START_POMODORO':
    case 'PAUSE_POMODORO':
    case 'STOP_POMODORO':
    case 'GET_POMODORO_STATE':
      return (await getPomodoroTimer()).handle(msg);

    // Nuclear Mode
    case 'ACTIVATE_NUCLEAR':
    case 'GET_NUCLEAR_STATE':
    case 'NUCLEAR_TIMER_CHECK':
      return (await getNuclearModeEngine()).handle(msg);

    // Focus Score
    case 'GET_FOCUS_SCORE':
    case 'RECORD_FOCUS_EVENT':
    case 'GET_SCORE_HISTORY':
      return (await getFocusScoreEngine()).handle(msg);

    // Lightweight — no engine needed
    case 'GET_EXTENSION_STATUS':
      return getQuickStatus();

    default:
      return { error: `Unknown message type: ${msg.type}` };
  }
}

// Quick status — no heavy engine init needed
async function getQuickStatus() {
  const data = await chrome.storage.local.get([
    'focusScore', 'currentStreak', 'isPro', 'nuclearModeActive', 'pomodoroActive'
  ]);
  return {
    focusScore: data.focusScore || 0,
    streak: data.currentStreak || 0,
    isPro: data.isPro || false,
    nuclearActive: data.nuclearModeActive || false,
    pomodoroActive: data.pomodoroActive || false
  };
}
```

### 3.2 Cold Start Avoidance

```javascript
// src/background/startup.js

// Precompute and cache critical data on install/update
async function handleInstall(details) {
  if (details.reason === 'install') {
    // First-time setup — cache defaults
    await chrome.storage.local.set({
      focusScore: 0,
      currentStreak: 0,
      longestStreak: 0,
      isPro: false,
      blockedSites: [],
      pomodoroSettings: { work: 25, shortBreak: 5, longBreak: 15, sessionsBeforeLong: 4 },
      nuclearModeActive: false,
      installDate: Date.now(),
      extensionVersion: chrome.runtime.getManifest().version,
      // Pre-cache derived data
      _cachedBlockRuleIds: [],
      _lastScoreCalculation: null
    });
  } else if (details.reason === 'update') {
    // Migration and re-cache
    await migrateStorage(details.previousVersion);
    await recacheBlockingRules();
  }
}

// On browser startup — fast path with cached data
async function handleStartup() {
  // Read cached state (fast — single storage read)
  const state = await chrome.storage.local.get([
    'nuclearModeActive', 'nuclearModeExpiry',
    'pomodoroActive', 'pomodoroEndTime',
    '_cachedBlockRuleIds'
  ]);

  // CRITICAL: Restore Nuclear Mode immediately if active
  if (state.nuclearModeActive && state.nuclearModeExpiry > Date.now()) {
    // Nuclear Mode rules are persisted in declarativeNetRequest — already active
    // Just need to restore the expiry alarm
    const remainingMs = state.nuclearModeExpiry - Date.now();
    chrome.alarms.create('nuclear-mode-expiry', {
      delayInMinutes: remainingMs / 60000
    });
  } else if (state.nuclearModeActive && state.nuclearModeExpiry <= Date.now()) {
    // Nuclear Mode expired while browser was closed — clean up
    await deactivateNuclearMode();
  }

  // Restore Pomodoro timer if was active
  if (state.pomodoroActive && state.pomodoroEndTime > Date.now()) {
    const remaining = state.pomodoroEndTime - Date.now();
    chrome.alarms.create('pomodoro-tick', {
      delayInMinutes: remaining / 60000
    });
  }

  // Check daily streak (midnight rollover)
  await checkStreakStatus();
}

async function recacheBlockingRules() {
  const rules = await chrome.declarativeNetRequest.getDynamicRules();
  await chrome.storage.local.set({
    _cachedBlockRuleIds: rules.map(r => r.id)
  });
}
```

### 3.3 Persistent State Manager

```javascript
// src/background/state-manager.js
class FocusPersistentState {
  constructor() {
    this.state = null;
    this.saveQueued = false;
    this.STORAGE_KEY = 'focusModeState';
  }

  async init() {
    const result = await chrome.storage.local.get(this.STORAGE_KEY);
    this.state = result[this.STORAGE_KEY] || this.getDefaults();
    return this.state;
  }

  getDefaults() {
    return {
      focusScore: 0,
      currentStreak: 0,
      longestStreak: 0,
      todaySessions: 0,
      todayFocusMinutes: 0,
      lastSessionDate: null,
      blockedSiteVisits: 0,
      lastUpdated: null
    };
  }

  async get(path) {
    if (!this.state) await this.init();
    return path ? this.getPath(this.state, path) : this.state;
  }

  async set(path, value) {
    if (!this.state) await this.init();
    this.setPath(this.state, path, value);
    this.state.lastUpdated = Date.now();
    this.queueSave();
  }

  async update(updates) {
    if (!this.state) await this.init();
    Object.assign(this.state, updates);
    this.state.lastUpdated = Date.now();
    this.queueSave();
  }

  // Debounced save — batch multiple updates into one storage write
  queueSave() {
    if (this.saveQueued) return;
    this.saveQueued = true;

    // Use setTimeout for debouncing (alarms have 1-min minimum)
    setTimeout(async () => {
      this.saveQueued = false;
      await chrome.storage.local.set({ [this.STORAGE_KEY]: this.state });
    }, 500);
  }

  // Force immediate save (use before service worker termination)
  async forceSave() {
    this.saveQueued = false;
    await chrome.storage.local.set({ [this.STORAGE_KEY]: this.state });
  }

  getPath(obj, path) {
    return path.split('.').reduce((o, k) => o?.[k], obj);
  }

  setPath(obj, path, value) {
    const keys = path.split('.');
    const last = keys.pop();
    const target = keys.reduce((o, k) => (o[k] = o[k] || {}), obj);
    target[last] = value;
  }
}
```

### 3.4 Efficient Alarm Usage

Focus Mode uses alarms for: Pomodoro timer, Nuclear Mode expiry, streak midnight check, Focus Score daily calculation.

```javascript
// src/background/alarm-scheduler.js

// SINGLE ALARM PATTERN — avoid creating hundreds of alarms
const ALARM_NAMES = {
  POMODORO_TICK: 'focus-pomodoro-tick',
  NUCLEAR_EXPIRY: 'focus-nuclear-expiry',
  STREAK_CHECK: 'focus-streak-midnight',
  SCORE_RECALC: 'focus-score-daily'
};

// Register listener at top level (MV3 requirement)
chrome.alarms.onAlarm.addListener(handleAlarm);

async function handleAlarm(alarm) {
  switch (alarm.name) {
    case ALARM_NAMES.POMODORO_TICK:
      await handlePomodoroAlarm();
      break;

    case ALARM_NAMES.NUCLEAR_EXPIRY:
      await handleNuclearExpiry();
      break;

    case ALARM_NAMES.STREAK_CHECK:
      await handleStreakMidnight();
      break;

    case ALARM_NAMES.SCORE_RECALC:
      await handleDailyScoreRecalc();
      break;
  }
}

async function handlePomodoroAlarm() {
  const timer = await getPomodoroTimer();
  const state = await timer.getState();

  if (state.phase === 'work') {
    // Work session complete
    await timer.transitionToBreak();
    chrome.notifications.create('pomodoro-break', {
      type: 'basic',
      iconUrl: 'assets/icons/icon-128.png',
      title: 'Focus Mode — Break Time!',
      message: `Great work! Take a ${state.breakDuration}-minute break.`,
      priority: 2
    });

    // Record completed session for Focus Score
    const scoreEngine = await getFocusScoreEngine();
    await scoreEngine.recordEvent('session_completed', { duration: state.workDuration });
  } else {
    // Break complete — start next work session
    await timer.transitionToWork();
    chrome.notifications.create('pomodoro-work', {
      type: 'basic',
      iconUrl: 'assets/icons/icon-128.png',
      title: 'Focus Mode — Back to Work!',
      message: 'Break is over. Time to focus!',
      priority: 2
    });
  }
}

async function handleNuclearExpiry() {
  // Nuclear Mode timer expired — remove unbypassable blocks
  const nuclear = await getNuclearModeEngine();
  await nuclear.deactivate();

  chrome.notifications.create('nuclear-complete', {
    type: 'basic',
    iconUrl: 'assets/icons/icon-128.png',
    title: 'Focus Mode — Nuclear Mode Complete!',
    message: 'Your Nuclear Mode session has ended. All sites are accessible again.',
    priority: 2
  });

  // Record for Focus Score
  const scoreEngine = await getFocusScoreEngine();
  await scoreEngine.recordEvent('nuclear_session_completed');
}

async function handleStreakMidnight() {
  // Check if user had a session today; if not, break streak
  const state = await chrome.storage.local.get(['lastSessionDate', 'currentStreak', 'longestStreak']);

  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  if (state.lastSessionDate !== today && state.lastSessionDate !== yesterday) {
    // Streak broken
    const newStreak = 0;
    await chrome.storage.local.set({
      currentStreak: newStreak,
      longestStreak: Math.max(state.longestStreak || 0, state.currentStreak || 0)
    });
  }

  // Re-schedule for next midnight
  scheduleNextMidnightAlarm();
}

function scheduleNextMidnightAlarm() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 5, 0); // 5 seconds after midnight
  const delayMs = midnight.getTime() - now.getTime();

  chrome.alarms.create(ALARM_NAMES.STREAK_CHECK, {
    delayInMinutes: delayMs / 60000
  });
}

// Initialize persistent alarms on startup
async function initAlarms() {
  // Streak midnight check — always active
  const existing = await chrome.alarms.get(ALARM_NAMES.STREAK_CHECK);
  if (!existing) {
    scheduleNextMidnightAlarm();
  }

  // Daily Focus Score recalculation
  const scoreAlarm = await chrome.alarms.get(ALARM_NAMES.SCORE_RECALC);
  if (!scoreAlarm) {
    chrome.alarms.create(ALARM_NAMES.SCORE_RECALC, {
      delayInMinutes: 60,
      periodInMinutes: 60 * 24 // Every 24 hours
    });
  }
}
```

### 3.5 Service Worker Startup Time Budget

| Phase | Budget | What Happens |
|-------|--------|-------------|
| Listener registration | < 5ms | All chrome.* listeners registered synchronously |
| First message handling | < 50ms | Lazy engine init + cached storage read |
| Nuclear Mode restore | < 20ms | Read cached state, create alarm if needed |
| Pomodoro restore | < 15ms | Read cached state, create alarm if needed |
| Full engine init (lazy) | < 100ms | All engines initialized on first use |
| **Total cold start** | **< 100ms** | **Cached path (most common)** |

---

## 4. Content Script Performance

### 4.1 Injection Strategy for Focus Mode

Focus Mode injects content scripts for two purposes:
1. **Block page display** — injected when a blocked site is accessed
2. **Site detection** — lightweight check if current site is blocked (optional, for UI indicator)

```json
// manifest.json — content script configuration
{
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content-block.js"],
      "run_at": "document_start",
      "all_frames": false
    }
  ]
}
```

**Why `document_start`:** The block page must appear before the blocked site's content renders. Injecting at `document_start` ensures the block overlay is first.

**Why `all_frames: false`:** Only block the top frame. Iframes within pages don't need block pages (the parent page is already blocked).

### 4.2 Lightweight Content Script Pattern

```javascript
// src/content/content-block.js
// ⚠️ BUDGET: < 20KB — this runs on every page load

(function() {
  'use strict';

  // FAST PATH: Check if this URL is blocked
  // Uses synchronous cache check first, async verification second
  const url = window.location.hostname;

  // Phase 1: Quick check via cached blocklist (synchronous)
  // The service worker pre-populates this via chrome.storage.session
  chrome.storage.session.get('_quickBlocklist', (result) => {
    const quickList = result._quickBlocklist;
    if (!quickList || !quickList.includes(url)) {
      return; // Not blocked — exit immediately (zero DOM impact)
    }

    // Phase 2: Confirmed blocked — inject block page
    injectBlockPage(url);
  });

  function injectBlockPage(blockedUrl) {
    // Stop page loading to prevent content flash
    window.stop();

    // Create Shadow DOM host
    const host = document.createElement('div');
    host.id = 'focus-mode-block-host';
    host.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:2147483647;';

    const shadow = host.attachShadow({ mode: 'closed' });

    // Inject CSS from extension (no inline styles — CSP compliant)
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('block-page.css');
    shadow.appendChild(link);

    // Build block page content using SafeDOM (Phase 18)
    const container = document.createElement('div');
    container.className = 'focus-block-page';

    const title = document.createElement('h1');
    title.textContent = 'Stay Focused!';
    container.appendChild(title);

    const site = document.createElement('p');
    site.className = 'blocked-site';
    site.textContent = blockedUrl + ' is blocked';
    container.appendChild(site);

    // Request Focus Score from background
    chrome.runtime.sendMessage({ type: 'GET_EXTENSION_STATUS' }, (status) => {
      if (status) {
        const scoreEl = document.createElement('div');
        scoreEl.className = 'focus-score-display';
        scoreEl.textContent = `Focus Score: ${status.focusScore}/100`;
        container.appendChild(scoreEl);

        if (status.streak > 0) {
          const streakEl = document.createElement('div');
          streakEl.className = 'streak-display';
          streakEl.textContent = `${status.streak}-day streak`;
          container.appendChild(streakEl);
        }
      }
    });

    shadow.appendChild(container);

    // Wait for document.documentElement to be available
    if (document.documentElement) {
      document.documentElement.appendChild(host);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.documentElement.appendChild(host);
      }, { once: true });
    }

    // Record blocked visit for Focus Score
    chrome.runtime.sendMessage({
      type: 'RECORD_FOCUS_EVENT',
      data: { event: 'blocked_site_visit', site: blockedUrl }
    }).catch(() => {});
  }
})();
```

### 4.3 DOM Manipulation Best Practices

```javascript
// src/popup/dom-utils.js

// BAD: Multiple reflows
function badUpdate(elements) {
  elements.forEach(el => {
    el.style.width = '100px';    // Reflow
    el.style.height = '100px';   // Reflow
    el.style.margin = '10px';    // Reflow
  });
}

// GOOD: Batch style changes with cssText
function goodUpdate(elements) {
  elements.forEach(el => {
    el.style.cssText = 'width:100px;height:100px;margin:10px;';
  });
}

// BEST: Use CSS classes
function bestUpdate(elements) {
  elements.forEach(el => {
    el.classList.add('focus-card-sized');
  });
}

// GOOD: Batch reads then batch writes (for Focus Score display animation)
function animateFocusScore(scoreElements, newScores) {
  // Read phase — all reads first
  const currentValues = scoreElements.map(el => parseInt(el.textContent) || 0);

  // Write phase — all writes after
  scoreElements.forEach((el, i) => {
    el.textContent = newScores[i];
    el.classList.toggle('score-improved', newScores[i] > currentValues[i]);
    el.classList.toggle('score-declined', newScores[i] < currentValues[i]);
  });
}

// DocumentFragment for batch DOM insertions (blocklist rendering)
function renderBlocklist(container, sites) {
  const fragment = document.createDocumentFragment();

  for (const site of sites) {
    const item = document.createElement('div');
    item.className = 'blocklist-item';

    const domain = document.createElement('span');
    domain.className = 'blocklist-domain';
    domain.textContent = site.domain;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'blocklist-remove';
    removeBtn.textContent = '×';
    removeBtn.dataset.domain = site.domain;

    item.appendChild(domain);
    item.appendChild(removeBtn);
    fragment.appendChild(item);
  }

  container.innerHTML = '';
  container.appendChild(fragment); // Single DOM operation
}
```

### 4.4 Efficient MutationObserver (Block Page Protection)

```javascript
// src/content/block-page-observer.js
class FocusBlockPageObserver {
  constructor(options = {}) {
    this.debounceMs = options.debounceMs || 100;
    this.pendingMutations = [];
    this.processTimer = null;
    this.blockPageHost = null;

    this.observer = new MutationObserver(mutations => {
      this.pendingMutations.push(...mutations);

      // Immediate processing for removal mutations (anti-bypass)
      const hasRemovals = mutations.some(m => m.removedNodes.length > 0);
      if (hasRemovals) {
        this.processMutations();
      } else if (!this.processTimer) {
        this.processTimer = setTimeout(() => this.processMutations(), this.debounceMs);
      }
    });
  }

  observe(blockPageHost) {
    this.blockPageHost = blockPageHost;
    this.observer.observe(document.documentElement, {
      childList: true,
      subtree: false // Only watch direct children — no deep observation
    });
  }

  processMutations() {
    if (this.processTimer) {
      clearTimeout(this.processTimer);
      this.processTimer = null;
    }

    const mutations = this.pendingMutations;
    this.pendingMutations = [];

    for (const mutation of mutations) {
      for (const removed of mutation.removedNodes) {
        if (removed === this.blockPageHost || removed.id === 'focus-mode-block-host') {
          // Block page was removed — re-inject immediately
          document.documentElement.appendChild(this.blockPageHost);
        }
      }
    }
  }

  disconnect() {
    this.observer.disconnect();
    if (this.processTimer) {
      clearTimeout(this.processTimer);
      this.processTimer = null;
    }
    this.pendingMutations = [];
  }
}
```

### 4.5 Debounce/Throttle Utilities

```javascript
// src/utils/timing.js — Lightweight implementations (< 500 bytes total)

function debounce(fn, delay) {
  let tid;
  return function(...args) {
    clearTimeout(tid);
    tid = setTimeout(() => fn.apply(this, args), delay);
  };
}

function throttle(fn, limit) {
  let inThrottle;
  let lastArgs;
  return function(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) { fn.apply(this, lastArgs); lastArgs = null; }
      }, limit);
    } else {
      lastArgs = args;
    }
  };
}

function scheduleIdleWork(callback, timeout = 2000) {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback, { timeout });
  } else {
    setTimeout(callback, 1);
  }
}

// Focus Mode usage:
// - debounce(300): blocklist search input, settings form changes
// - throttle(100): popup scroll, Focus Score animation frames
// - scheduleIdleWork: milestone celebration animations, analytics events
```

### 4.6 Content Script Performance Budget

| Metric | Target | Critical | Notes |
|--------|--------|----------|-------|
| Script parse + execute | < 10ms | > 50ms | Content script initial execution |
| Block page render (first paint) | < 30ms | > 100ms | User sees block page |
| Focus Score fetch + display | < 100ms | > 500ms | Async from background |
| Memory footprint | < 5MB | > 20MB | Per blocked page |
| DOM nodes created | < 20 | > 50 | Shadow DOM block page |

---

## Key Design Decisions

### Service Worker Lazy Loading
- All heavy engines (Focus Score, Nuclear Mode, Pomodoro, Blocking) are lazily loaded on first use
- Cold start registers listeners synchronously (MV3 requirement) but defers all computation
- Cached storage read provides instant status for popup queries without loading engines
- `GET_EXTENSION_STATUS` is the hot path — responds from storage cache, no engine needed

### Nuclear Mode Must Survive Restarts
- Nuclear Mode state is persisted in chrome.storage AND declarativeNetRequest rules
- On startup, the alarm is recreated from the cached expiry time
- If the browser was closed past the expiry, deactivation runs immediately
- This is the only component that MUST be restored on cold start

### Content Script Minimalism
- Block page content script (< 20KB) does one thing: check if blocked → show block page
- Uses `chrome.storage.session` for a quick blocklist cache (avoids message round-trip)
- `window.stop()` prevents blocked content from loading/flashing
- Shadow DOM isolates block page from the host page's CSS/JS

---

*Agent 2 — Service Worker Efficiency & Content Script Performance — Complete*
