# Agent 4 — Profiling & Debugging + Performance Checklist
## Phase 20: Performance Optimization Guide — Focus Mode - Blocker

> **Date:** February 11, 2026 | **Agent:** 4 of 5
> **Scope:** Sections 7–8 — Profiling & Debugging, Performance Checklist
> **Depends on:** Phase 05 (Debugging Protocol), Phase 10 (Testing Suite), Phase 11 (Crash Analytics)

---

## 7. Profiling & Debugging

### 7.1 Performance Instrumentation

```javascript
// src/utils/performance-profiler.js
class FocusPerformanceProfiler {
  constructor() {
    this.marks = new Map();
    this.measures = [];
    this.enabled = process.env.NODE_ENV !== 'production';
  }

  mark(name) {
    if (!this.enabled) return;
    performance.mark(`focus-${name}`);
    this.marks.set(name, performance.now());
  }

  measure(name, startMark, endMark) {
    if (!this.enabled) return null;

    try {
      performance.measure(
        `focus-${name}`,
        `focus-${startMark}`,
        `focus-${endMark || startMark + '-end'}`
      );

      const entries = performance.getEntriesByName(`focus-${name}`, 'measure');
      const latest = entries[entries.length - 1];

      const result = {
        name,
        duration: latest.duration,
        durationMs: latest.duration.toFixed(2) + 'ms',
        timestamp: Date.now()
      };

      this.measures.push(result);
      return result;
    } catch (e) {
      return null;
    }
  }

  async measureAsync(name, fn) {
    if (!this.enabled) return fn();

    this.mark(`${name}-start`);
    try {
      const result = await fn();
      this.mark(`${name}-end`);
      const measurement = this.measure(name, `${name}-start`, `${name}-end`);
      if (measurement) {
        console.log(`[Focus Mode Perf] ${name}: ${measurement.durationMs}`);
      }
      return result;
    } catch (e) {
      this.mark(`${name}-end`);
      throw e;
    }
  }

  getReport() {
    return {
      measures: this.measures.slice(-50),
      summary: this.summarize()
    };
  }

  summarize() {
    const grouped = {};
    for (const m of this.measures) {
      if (!grouped[m.name]) grouped[m.name] = [];
      grouped[m.name].push(m.duration);
    }

    return Object.entries(grouped).map(([name, durations]) => ({
      name,
      count: durations.length,
      avg: (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2) + 'ms',
      min: Math.min(...durations).toFixed(2) + 'ms',
      max: Math.max(...durations).toFixed(2) + 'ms',
      p95: this.percentile(durations, 95).toFixed(2) + 'ms'
    }));
  }

  percentile(arr, p) {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }
}

// Global profiler instance
const profiler = new FocusPerformanceProfiler();
export default profiler;
```

### 7.2 Focus Mode-Specific Performance Marks

```javascript
// Key performance marks for Focus Mode components:

// Service Worker
profiler.mark('sw-wake');
// ... register listeners ...
profiler.mark('sw-listeners-registered');
profiler.measure('sw-listener-registration', 'sw-wake', 'sw-listeners-registered');

// Popup
profiler.mark('popup-init');
await renderBlocklist();
profiler.mark('popup-blocklist-rendered');
profiler.measure('popup-blocklist-render', 'popup-init', 'popup-blocklist-rendered');

await renderFocusScore();
profiler.mark('popup-score-rendered');
profiler.measure('popup-score-render', 'popup-blocklist-rendered', 'popup-score-rendered');

await renderPomodoroTimer();
profiler.mark('popup-complete');
profiler.measure('popup-full-render', 'popup-init', 'popup-complete');

// Block Page
profiler.mark('block-page-inject');
// ... DOM creation ...
profiler.mark('block-page-visible');
profiler.measure('block-page-render', 'block-page-inject', 'block-page-visible');

// Focus Score Calculation
profiler.mark('score-calc-start');
const score = await calculateFocusScore();
profiler.mark('score-calc-end');
profiler.measure('focus-score-calculation', 'score-calc-start', 'score-calc-end');

// Nuclear Mode Activation
profiler.mark('nuclear-activate-start');
await activateNuclearMode(sites, duration);
profiler.mark('nuclear-activate-end');
profiler.measure('nuclear-activation', 'nuclear-activate-start', 'nuclear-activate-end');

// Storage Operations
profiler.mark('storage-read-start');
const data = await chrome.storage.local.get(keys);
profiler.mark('storage-read-end');
profiler.measure('storage-read', 'storage-read-start', 'storage-read-end');
```

### 7.3 Memory Profiling

```javascript
// src/utils/memory-profiler.js

// Memory snapshot comparison helper
class FocusMemoryProfiler {
  constructor() {
    this.snapshots = [];
  }

  takeSnapshot(label) {
    if (!performance.memory) {
      console.warn('[Focus Mode] performance.memory not available');
      return null;
    }

    const snapshot = {
      label,
      timestamp: Date.now(),
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
      usedMB: (performance.memory.usedJSHeapSize / 1048576).toFixed(2)
    };

    this.snapshots.push(snapshot);
    return snapshot;
  }

  compare(label1, label2) {
    const s1 = this.snapshots.find(s => s.label === label1);
    const s2 = this.snapshots.find(s => s.label === label2);

    if (!s1 || !s2) return null;

    const diff = s2.used - s1.used;
    return {
      from: label1,
      to: label2,
      diffBytes: diff,
      diffMB: (diff / 1048576).toFixed(2),
      direction: diff > 0 ? 'increased' : diff < 0 ? 'decreased' : 'unchanged'
    };
  }

  // Run a function and measure memory impact
  async profileFunction(label, fn) {
    // Force GC if available (DevTools only)
    if (typeof gc === 'function') gc();

    this.takeSnapshot(`${label}-before`);
    const result = await fn();
    this.takeSnapshot(`${label}-after`);

    const comparison = this.compare(`${label}-before`, `${label}-after`);
    console.log(`[Focus Mode Memory] ${label}: ${comparison.diffMB}MB (${comparison.direction})`);

    return result;
  }

  report() {
    console.table(this.snapshots.map(s => ({
      label: s.label,
      usedMB: s.usedMB + ' MB',
      time: new Date(s.timestamp).toLocaleTimeString()
    })));
  }
}
```

### 7.4 Debug Utilities

```javascript
// src/utils/debug.js
const DEBUG = process.env.NODE_ENV !== 'production';

const focusDebug = {
  log: DEBUG ? console.log.bind(console, '[Focus Mode]') : () => {},
  warn: DEBUG ? console.warn.bind(console, '[Focus Mode]') : () => {},
  error: console.error.bind(console, '[Focus Mode]'), // Always log errors
  time: DEBUG ? console.time.bind(console) : () => {},
  timeEnd: DEBUG ? console.timeEnd.bind(console) : () => {},

  // Measure any async operation
  measure: async (name, fn) => {
    if (!DEBUG) return fn();

    const start = performance.now();
    try {
      return await fn();
    } finally {
      const duration = performance.now() - start;
      console.log(`[Focus Mode] ${name}: ${duration.toFixed(2)}ms`);
    }
  },

  // Storage size inspector
  async storageSize() {
    const local = await chrome.storage.local.get(null);
    const sync = await chrome.storage.sync.get(null);
    const session = await chrome.storage.session.get(null);

    const sizes = {
      local: JSON.stringify(local).length,
      sync: JSON.stringify(sync).length,
      session: JSON.stringify(session).length
    };

    console.table({
      'storage.local': { size: (sizes.local / 1024).toFixed(2) + ' KB', quota: '10 MB' },
      'storage.sync': { size: (sizes.sync / 1024).toFixed(2) + ' KB', quota: '100 KB' },
      'storage.session': { size: (sizes.session / 1024).toFixed(2) + ' KB', quota: '10 MB' }
    });

    return sizes;
  },

  // declarativeNetRequest rule inspector
  async blockingRules() {
    const dynamic = await chrome.declarativeNetRequest.getDynamicRules();
    const session = await chrome.declarativeNetRequest.getSessionRules();

    console.log(`[Focus Mode] Blocking rules: ${dynamic.length} dynamic, ${session.length} session`);
    console.table(dynamic.map(r => ({
      id: r.id,
      condition: JSON.stringify(r.condition).substring(0, 80),
      action: r.action.type
    })));

    return { dynamic, session };
  }
};

export default focusDebug;
```

### 7.5 Chrome DevTools Workflows for Focus Mode

**Service Worker Profiling:**
```
1. Open chrome://extensions
2. Find Focus Mode - Blocker
3. Click "Inspect views: service worker"
4. Performance tab → Record
5. Trigger: send message from popup (start Pomodoro, add blocked site)
6. Stop recording → analyze flame chart
7. Target: message handling < 50ms
```

**Popup Performance:**
```
1. Right-click Focus Mode icon → Inspect popup
2. Performance tab → Record
3. Focus on: initial render time, Focus Score animation, blocklist rendering
4. Target: full render < 100ms
```

**Content Script (Block Page):**
```
1. Navigate to a blocked site
2. Open DevTools on the blocked page
3. Performance tab → Record → Reload
4. Look for: content-block.js execution time, Shadow DOM creation, CSS paint
5. Target: block page visible < 30ms after navigation
```

**Memory Leak Detection:**
```
1. Open any Focus Mode page (popup or options)
2. DevTools → Memory tab
3. Take heap snapshot (Snapshot 1)
4. Perform repeated actions (open/close popup 10x, add/remove sites)
5. Take heap snapshot (Snapshot 2)
6. Compare snapshots → look for increasing object counts
7. Focus on: MutationObserver, EventListener, Timer objects
```

---

## 8. Performance Checklist

### 8.1 Pre-Release Audit Checklist

```
BUNDLE SIZE:
[ ] Total bundle < 400KB (Focus Mode target)
[ ] content-block.js < 20KB (block page injection)
[ ] background.js < 80KB (service worker)
[ ] popup.js < 100KB (popup UI)
[ ] No unused dependencies (only DOMPurify approved)
[ ] Tree shaking enabled (named exports throughout)
[ ] Pro features dynamically imported (Nuclear Mode UI, analytics, schedules)
[ ] Bundle analyzer report reviewed (no surprises)

MEMORY:
[ ] No global variable leaks in content script
[ ] Event listeners cleaned up on block page removal
[ ] WeakMap used for DOM element caches
[ ] MutationObserver disconnected when not needed
[ ] Focus Score history pruned to 90 days
[ ] Block page content script < 5MB memory footprint
[ ] Popup < 30MB memory
[ ] Service worker < 50MB memory

SERVICE WORKER (MV3):
[ ] All listeners registered synchronously at top level
[ ] Cold start < 100ms (cached path)
[ ] Lazy engine initialization (Focus Score, Nuclear, Pomodoro, Blocking)
[ ] State persisted to chrome.storage (survives termination)
[ ] Nuclear Mode restored on startup
[ ] Pomodoro timer restored on startup
[ ] Single alarm per purpose (not per-task)
[ ] Debounced storage saves (500ms batching)

CONTENT SCRIPTS:
[ ] content-block.js < 20KB
[ ] Block page renders < 30ms
[ ] window.stop() called before blocked content loads
[ ] Shadow DOM used for isolation
[ ] No MutationObserver on deep subtrees
[ ] Debounced/throttled event handlers
[ ] DocumentFragment for batch DOM insertions
[ ] requestIdleCallback for non-critical work

STORAGE:
[ ] Appropriate storage type per data type (session/local/sync/IndexedDB)
[ ] Batch read/write operations via FocusStorageBatch
[ ] Sync storage < 50KB (settings only)
[ ] IndexedDB pruned every 90 days
[ ] Quick blocklist in session storage for content script
[ ] Compression for data > 50KB
[ ] Single storage read on service worker startup

NETWORK:
[ ] All API calls have timeouts (5-10s)
[ ] License validation cached 24 hours
[ ] Retry with exponential backoff (max 3 retries)
[ ] No browsing data sent to servers
[ ] Stripe.js loaded from CDN (not bundled)
[ ] HTTPS enforced for all connections (Phase 18)

DECLARATIVE NET REQUEST:
[ ] Rule count within Chrome limits (MAX_NUMBER_OF_DYNAMIC_RULES)
[ ] Rules cleaned up when sites removed from blocklist
[ ] Nuclear Mode rules use session rules (auto-clean on restart)
[ ] No regex rules (use urlFilter for performance)
[ ] Rules tested with chrome.declarativeNetRequest.testMatchOutcome
```

### 8.2 Performance Budgets

```javascript
// scripts/performance-budget.js
const FOCUS_MODE_BUDGETS = {
  // Timing budgets (ms)
  timing: {
    popupOpen: 100,              // Full popup render
    popupBlocklistRender: 30,    // Blocklist section
    popupFocusScoreRender: 20,   // Focus Score display
    popupPomodoroRender: 15,     // Timer control
    contentScriptInit: 10,       // Block check + decision
    blockPageRender: 30,         // Full block page visible
    backgroundWake: 100,         // Service worker cold start
    backgroundMessageHandle: 50, // Any message handler
    focusScoreCalculation: 20,   // Score recalculation
    nuclearModeActivation: 50,   // Full Nuclear Mode setup
    storageRead: 10,             // Single storage.local.get()
    storageWrite: 20,            // Single storage.local.set()
    licenseValidation: 5000      // Network call (with cache bypass)
  },

  // Size budgets (bytes)
  size: {
    background: 80 * 1024,
    popup: 100 * 1024,
    contentBlock: 20 * 1024,
    options: 80 * 1024,
    blockPage: 40 * 1024,
    shared: 30 * 1024,
    vendor: 50 * 1024,
    total: 400 * 1024
  },

  // Memory budgets (bytes)
  memory: {
    popup: 30 * 1024 * 1024,
    background: 50 * 1024 * 1024,
    contentScript: 5 * 1024 * 1024,
    optionsPage: 40 * 1024 * 1024
  },

  // Storage budgets (bytes)
  storage: {
    syncTotal: 50 * 1024,
    localTotal: 2 * 1024 * 1024,
    sessionTotal: 1 * 1024 * 1024
  }
};

function checkBudget(category, metric, actual) {
  const budget = FOCUS_MODE_BUDGETS[category]?.[metric];
  if (!budget) return { ok: true, message: 'No budget defined' };

  const ok = actual <= budget;
  const percent = ((actual / budget) * 100).toFixed(1);
  const unit = category === 'timing' ? 'ms' : category === 'size' ? 'KB' : 'MB';
  const displayActual = category === 'timing' ? actual :
    category === 'size' ? (actual / 1024).toFixed(1) :
    (actual / 1048576).toFixed(1);
  const displayBudget = category === 'timing' ? budget :
    category === 'size' ? (budget / 1024).toFixed(1) :
    (budget / 1048576).toFixed(1);

  return {
    ok,
    metric,
    actual: `${displayActual}${unit}`,
    budget: `${displayBudget}${unit}`,
    percent: `${percent}%`,
    message: ok ? `${metric}: ${percent}% of budget` : `${metric}: OVER BUDGET (${percent}%)`
  };
}

module.exports = { FOCUS_MODE_BUDGETS, checkBudget };
```

### 8.3 CI/CD Performance Gates

```yaml
# .github/workflows/performance-check.yml
name: Performance Check

on:
  pull_request:
    branches: [main]

jobs:
  bundle-size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build -- --mode production
      - run: node scripts/check-bundle-size.js
      - name: Comment PR with bundle sizes
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('reports/bundle-report.txt', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## Bundle Size Report\n\`\`\`\n${report}\n\`\`\``
            });
```

### 8.4 Critical Metrics Summary

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Popup open (full render) | < 100ms | > 200ms | > 500ms |
| Block page visible | < 30ms | > 100ms | > 300ms |
| Service worker cold start | < 100ms | > 300ms | > 500ms |
| Content script execution | < 10ms | > 30ms | > 100ms |
| Focus Score calculation | < 20ms | > 50ms | > 200ms |
| Nuclear Mode activation | < 50ms | > 100ms | > 300ms |
| Storage read | < 10ms | > 30ms | > 100ms |
| Memory (popup) | < 30MB | > 50MB | > 100MB |
| Memory (service worker) | < 50MB | > 75MB | > 100MB |
| Memory (block page) | < 5MB | > 10MB | > 20MB |
| Bundle (content-block.js) | < 20KB | > 35KB | > 50KB |
| Bundle (total) | < 400KB | > 600KB | > 1MB |

---

## Key Design Decisions

### Profiling Only in Development
- `FocusPerformanceProfiler` is disabled in production builds (zero overhead)
- `performance.mark/measure` calls compiled out by TerserPlugin's `drop_console`
- Memory profiler only active when DevTools is open
- Storage size inspector available via debug console only

### CI Enforces Budgets
- Bundle size check runs on every PR
- Exceeding any budget fails the CI check
- Bundle report commented on the PR for visibility
- Historical tracking shows budget trends

### Performance Marks Mirror User Experience
- Marks are placed at user-visible moments (popup open, block page visible, score displayed)
- Not at internal implementation details
- This ensures optimization efforts target what users actually perceive

---

*Agent 4 — Profiling & Debugging + Performance Checklist — Complete*
