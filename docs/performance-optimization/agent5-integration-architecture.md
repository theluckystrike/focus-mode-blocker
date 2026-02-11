# Agent 5 — Integration Architecture & Performance Optimization Roadmap
## Phase 20: Performance Optimization Guide — Focus Mode - Blocker

> **Date:** February 11, 2026 | **Agent:** 5 of 5
> **Scope:** Integration architecture across all performance modules, optimization roadmap, declarativeNetRequest performance
> **Depends on:** All Agent 1-4 outputs, Phase 12 (MV3 Architecture), Phase 18 (Security), Phase 10 (Testing)

---

## declarativeNetRequest Performance

### Rule Management for Focus Mode Blocking

The declarativeNetRequest API is Focus Mode's core blocking mechanism. Performance optimization is critical because rules are evaluated on every navigation.

```javascript
// src/background/engines/blocking-rules.js
class FocusBlockingRuleManager {
  constructor() {
    this.RULE_ID_BASE = 1000;
    this.NUCLEAR_RULE_ID_BASE = 5000;
  }

  // Convert blocklist to declarativeNetRequest rules
  async syncBlockingRules(blockedSites) {
    // Get current rules
    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    const existingIds = existing.map(r => r.id);

    // Build optimized rules
    const newRules = blockedSites.map((site, index) => ({
      id: this.RULE_ID_BASE + index,
      priority: 1,
      action: {
        type: 'redirect',
        redirect: {
          extensionPath: '/block-page.html?site=' + encodeURIComponent(site.domain)
        }
      },
      condition: {
        // Use urlFilter, NOT regexFilter — much faster
        urlFilter: `||${site.domain}`,
        resourceTypes: ['main_frame']
      }
    }));

    const newIds = newRules.map(r => r.id);

    // Batch update: remove old + add new in single call
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingIds.filter(id => id >= this.RULE_ID_BASE && id < this.NUCLEAR_RULE_ID_BASE),
      addRules: newRules
    });

    // Update quick blocklist cache for content script
    await chrome.storage.session.set({
      _quickBlocklist: blockedSites.map(s => s.domain)
    });

    return newRules.length;
  }

  // Nuclear Mode: add unbypassable session rules
  async activateNuclearRules(sites, durationMs) {
    const rules = sites.map((site, index) => ({
      id: this.NUCLEAR_RULE_ID_BASE + index,
      priority: 100, // Higher priority than regular blocking
      action: {
        type: 'redirect',
        redirect: {
          extensionPath: '/block-page.html?mode=nuclear&site=' + encodeURIComponent(site)
        }
      },
      condition: {
        urlFilter: `||${site}`,
        resourceTypes: ['main_frame', 'sub_frame'] // Block iframes too in Nuclear Mode
      }
    }));

    // Use session rules — auto-removed when browser restarts
    // BUT we also persist state so we can recreate on restart
    await chrome.declarativeNetRequest.updateSessionRules({
      addRules: rules
    });

    // Persist Nuclear state for restart recovery
    await chrome.storage.local.set({
      nuclearModeActive: true,
      nuclearModeSites: sites,
      nuclearModeExpiry: Date.now() + durationMs,
      nuclearModeRuleIds: rules.map(r => r.id)
    });

    return rules.length;
  }

  // Deactivate Nuclear Mode
  async deactivateNuclearRules() {
    const { nuclearModeRuleIds = [] } = await chrome.storage.local.get('nuclearModeRuleIds');

    await chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: nuclearModeRuleIds
    });

    await chrome.storage.local.set({
      nuclearModeActive: false,
      nuclearModeSites: [],
      nuclearModeExpiry: null,
      nuclearModeRuleIds: []
    });
  }
}
```

### Rule Performance Guidelines

| Guideline | Rationale |
|-----------|-----------|
| Use `urlFilter` not `regexFilter` | urlFilter uses Chrome's optimized matching; regex is 10-100x slower |
| Minimize rule count | Each rule is evaluated per navigation; keep under 1000 |
| Use `main_frame` only for block rules | Don't evaluate sub_frame, image, script unless needed |
| Nuclear Mode uses session rules | Auto-cleaned on restart; recreated from persisted state |
| Batch rule updates | Single `updateDynamicRules` call, not multiple |
| Priority levels: Nuclear (100) > Regular (1) | Ensures Nuclear Mode always takes precedence |

### Rule Count Budget

| Rule Type | Max Count | Notes |
|-----------|-----------|-------|
| Regular blocking (Free) | 5 | Free tier limit |
| Regular blocking (Pro) | 500 | Pro tier — generous but bounded |
| Nuclear Mode | 50 | Nuclear typically uses subset of blocklist |
| **Total dynamic rules** | **505** | Well under Chrome's limit (~5000) |
| **Total session rules** | **50** | Nuclear Mode only |

---

## Integration Architecture

### Performance Module Map

```
Focus Mode Performance Architecture
├── Memory Management
│   ├── FocusMemoryMonitor          — Leak detection with component tracking
│   ├── FocusWeakCache              — WeakMap for DOM associations
│   ├── FocusSoftCache              — WeakRef for score/session cache
│   ├── FocusEventManager           — Tracked listener cleanup
│   └── Block page IIFE scope       — No global variable leaks
│
├── Bundle Optimization
│   ├── webpack.config.js           — Entry splitting, TerserPlugin, tree shaking
│   ├── Dynamic imports             — Pro features lazy-loaded
│   ├── check-bundle-size.js        — CI budget enforcement
│   └── No runtime deps             — Only DOMPurify (~15KB)
│
├── Service Worker Efficiency
│   ├── Lazy engine singletons      — FocusScore, Nuclear, Pomodoro, Blocking
│   ├── FocusPersistentState        — Debounced state persistence
│   ├── Alarm scheduler             — 4 named alarms, single-alarm pattern
│   ├── Cold start < 100ms          — Cached storage path
│   └── Nuclear Mode restore        — Automatic on startup
│
├── Content Script Performance
│   ├── content-block.js < 20KB     — Minimal block page injector
│   ├── Quick blocklist             — session storage for sync check
│   ├── window.stop()               — Prevent content flash
│   ├── Shadow DOM isolation        — Block page CSS/JS isolation
│   └── FocusBlockPageObserver      — Anti-removal with debounced MutationObserver
│
├── Storage Optimization
│   ├── Storage tiering             — session → local → sync → IndexedDB
│   ├── FocusStorageBatch           — 500ms debounced writes
│   ├── FocusCompressedStorage      — gzip for large exports
│   ├── FocusChunkedSyncStorage     — 8KB chunking for sync
│   ├── FocusHistoryDB              — IndexedDB for Pro history
│   └── 90-day auto-prune           — Prevent unbounded growth
│
├── Network Optimization
│   ├── FocusLicenseCache           — 24h cache, 7-day offline grace
│   ├── FocusNetworkCache           — LRU with stale-while-revalidate
│   ├── FocusRequestBatcher         — Batch API calls
│   ├── fetchWithRetry              — Exponential backoff
│   └── Zero network for Free users — Privacy + performance
│
├── declarativeNetRequest
│   ├── FocusBlockingRuleManager    — Optimized rule sync
│   ├── urlFilter (not regex)       — 10-100x faster matching
│   ├── Batch rule updates          — Single API call
│   └── Nuclear: session rules      — Auto-clean + persist
│
├── Profiling
│   ├── FocusPerformanceProfiler    — mark/measure instrumentation
│   ├── FocusMemoryProfiler         — Heap snapshot comparison
│   ├── focusDebug utilities        — Dev-only logging + inspectors
│   └── DevTools workflows          — Service worker, popup, content script
│
└── Performance Budgets
    ├── Timing budgets              — 12 metrics (popup, block page, SW, etc.)
    ├── Size budgets                — 7 bundle targets (400KB total)
    ├── Memory budgets              — 4 contexts (popup, SW, content, options)
    ├── Storage budgets             — 3 storage types
    └── CI/CD gates                 — PR-blocking budget checks
```

### Data Flow Performance Paths

**Hot Path: Blocked Site Navigation** (< 40ms total)
```
User navigates to blocked site
  → declarativeNetRequest evaluates rules (< 1ms, Chrome internal)
  → Redirect to block-page.html OR content script injects
  → content-block.js checks session storage cache (< 5ms)
  → window.stop() prevents content load (< 1ms)
  → Shadow DOM block page created (< 10ms)
  → Focus Score fetched async (< 100ms, non-blocking)
  → Block page visible to user (< 30ms from navigation)
```

**Warm Path: Popup Open** (< 100ms total)
```
User clicks Focus Mode icon
  → popup.js loads (< 20ms parse)
  → chrome.storage.local.get() for cached state (< 10ms)
  → Render blocklist (< 30ms)
  → Render Focus Score display (< 20ms)
  → Render Pomodoro timer (< 15ms)
  → Full popup visible (< 100ms)
  → Pro features lazy-loaded if needed (async, < 50ms)
```

**Cold Path: Service Worker Wake** (< 100ms total)
```
Chrome wakes service worker (alarm, message, etc.)
  → Top-level listeners registered synchronously (< 5ms)
  → Message dispatched to lazy engine
  → Engine loaded + initialized from storage cache (< 50ms)
  → Response sent (< 50ms for message handling)
  → Total: < 100ms
```

**Background Path: Nuclear Mode Activation** (< 50ms)
```
User activates Nuclear Mode
  → Message to service worker
  → NuclearModeEngine.activate()
    → Build session rules (< 5ms)
    → chrome.declarativeNetRequest.updateSessionRules() (< 10ms)
    → Persist state to storage (< 10ms)
    → Create expiry alarm (< 5ms)
  → Response to popup (< 50ms total)
```

### Module Dependency Graph

```
No circular dependencies — each layer depends only on layers below:

Layer 4 (UI):        popup.js, options.js, block-page.js
                          │
Layer 3 (Engines):   FocusScoreEngine, NuclearModeEngine, PomodoroTimer, BlockingEngine
                          │
Layer 2 (Services):  FocusStorageBatch, FocusLicenseCache, FocusBlockingRuleManager
                          │
Layer 1 (Utils):     debounce, throttle, FocusEventManager, FocusWeakCache, focusDebug
                          │
Layer 0 (Chrome):    chrome.storage, chrome.alarms, chrome.declarativeNetRequest, chrome.runtime
```

---

## Optimization Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Implement webpack config with entry splitting and tree shaking
- [ ] Set up bundle size CI check (`check-bundle-size.js`)
- [ ] Implement `FocusStorageBatch` for debounced writes
- [ ] Establish performance budgets in CI
- [ ] Convert content script to IIFE with cleanup

### Phase 2: Service Worker (Week 2-3)
- [ ] Implement lazy engine pattern (singleton factories)
- [ ] Implement `FocusPersistentState` with debounced saves
- [ ] Set up 4 named alarms (Pomodoro, Nuclear, streak, score)
- [ ] Implement Nuclear Mode startup recovery
- [ ] Add `GET_EXTENSION_STATUS` fast path (storage-only, no engine)

### Phase 3: Content Script (Week 3-4)
- [ ] Optimize content-block.js to < 20KB
- [ ] Implement quick blocklist via `chrome.storage.session`
- [ ] Add `window.stop()` for content flash prevention
- [ ] Implement `FocusBlockPageObserver` with debounced MutationObserver
- [ ] Profile and optimize block page render time

### Phase 4: Storage & Network (Week 4-5)
- [ ] Implement storage tiering (session → local → sync → IndexedDB)
- [ ] Implement `FocusHistoryDB` for Pro history data
- [ ] Add 90-day auto-prune for IndexedDB
- [ ] Implement `FocusLicenseCache` with 24h cache + 7-day grace
- [ ] Add `fetchWithRetry` with exponential backoff

### Phase 5: Optimization & Monitoring (Week 5-6)
- [ ] Implement `FocusMemoryMonitor` for leak detection
- [ ] Add `FocusPerformanceProfiler` marks to all critical paths
- [ ] Run full profiling pass with DevTools
- [ ] Optimize `FocusBlockingRuleManager` rule sync
- [ ] Dynamic import all Pro features
- [ ] Final bundle size audit and optimization

---

## Performance Testing Plan

### Automated Tests

```javascript
// tests/performance/bundle-size.test.js
describe('Bundle Size', () => {
  test('content-block.js < 20KB', () => {
    const size = getFileSize('dist/content-block.js');
    expect(size).toBeLessThan(20 * 1024);
  });

  test('total bundle < 400KB', () => {
    const total = getTotalBundleSize('dist/');
    expect(total).toBeLessThan(400 * 1024);
  });
});

// tests/performance/timing.test.js
describe('Performance Timing', () => {
  test('popup renders in < 100ms', async () => {
    const start = performance.now();
    await renderPopup();
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100);
  });

  test('Focus Score calculation < 20ms', async () => {
    const start = performance.now();
    await calculateFocusScore(mockData);
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(20);
  });

  test('blocklist render (100 sites) < 30ms', async () => {
    const sites = generateMockSites(100);
    const start = performance.now();
    renderBlocklist(container, sites);
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(30);
  });
});

// tests/performance/storage.test.js
describe('Storage Performance', () => {
  test('batch write completes within budget', async () => {
    const batch = new FocusStorageBatch();
    for (let i = 0; i < 10; i++) {
      batch.set(`key${i}`, `value${i}`);
    }
    const start = performance.now();
    await batch.forceFlush();
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(20);
  });
});
```

### Manual Testing Checklist

```
POPUP PERFORMANCE:
[ ] Open popup — feels instant (< 100ms perceived)
[ ] Blocklist with 100 sites renders smoothly
[ ] Focus Score animation doesn't jank
[ ] Pomodoro timer updates don't cause layout shift

BLOCK PAGE PERFORMANCE:
[ ] Blocked site shows block page immediately (no content flash)
[ ] Block page loads correctly on slow sites
[ ] Block page doesn't increase page memory significantly
[ ] Navigating away from block page cleans up properly

SERVICE WORKER:
[ ] First popup open after Chrome restart is fast (< 200ms)
[ ] Nuclear Mode survives browser restart
[ ] Pomodoro timer is accurate after background sleep
[ ] Adding 50 sites doesn't cause noticeable delay

MEMORY:
[ ] Open/close popup 20 times — no memory growth
[ ] Navigate to 20 blocked sites — memory stable
[ ] Leave extension running for 1 hour — no leaks
[ ] With 100 blocked sites — memory reasonable (< 50MB total)
```

---

## Key Design Decisions

### declarativeNetRequest is the Performance Foundation
- All blocking is handled by Chrome's native rule engine (C++ level)
- urlFilter is 10-100x faster than regexFilter
- Rules are evaluated synchronously before network requests — zero extension overhead per navigation
- Focus Mode's content script is a secondary layer for UI only

### Performance Budget Enforcement in CI
- Every PR checks bundle sizes against budgets
- Exceeding ANY budget fails the build
- This prevents gradual performance regression over time
- Bundle analysis report attached to every PR

### Zero Network Requests for Free Users
- Free users never hit any server — pure client-side extension
- This eliminates network latency entirely for 80%+ of users
- Pro users make 1 request/day (license validation) with 24h cache
- Privacy and performance are aligned

### Lazy Everything
- Engines lazy-loaded on first use, not on service worker wake
- Pro features dynamically imported when accessed
- Focus Score history loaded only when the history tab is opened
- This keeps cold start fast and memory low until features are actually needed

---

*Agent 5 — Integration Architecture & Performance Optimization Roadmap — Complete*
