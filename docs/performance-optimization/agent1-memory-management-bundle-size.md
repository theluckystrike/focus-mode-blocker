# Agent 1 — Memory Management & Bundle Size Optimization
## Phase 20: Performance Optimization Guide — Focus Mode - Blocker

> **Date:** February 11, 2026 | **Agent:** 1 of 5
> **Scope:** Sections 1–2 — Memory Management, Bundle Size Optimization
> **Depends on:** Phase 12 (MV3 Architecture — service worker, content scripts), Phase 10 (Testing — performance tests), Phase 18 (Security — code obfuscation tiers)

---

## 1. Memory Management

### 1.1 Focus Mode Memory Monitor

```javascript
// src/utils/memory-monitor.js
class FocusMemoryMonitor {
  constructor() {
    this.snapshots = [];
    this.leakThreshold = 10 * 1024 * 1024; // 10MB growth = potential leak
    this.componentTracking = new Map();     // Track per-component memory
  }

  async takeSnapshot(component = 'general') {
    if (!performance.memory) {
      return null; // Memory API only in Chrome with --enable-precise-memory-info
    }

    const snapshot = {
      timestamp: Date.now(),
      component,
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
      usedMB: (performance.memory.usedJSHeapSize / 1048576).toFixed(2)
    };

    this.snapshots.push(snapshot);

    // Rolling window of 100 snapshots
    if (this.snapshots.length > 100) {
      this.snapshots.shift();
    }

    // Track per-component
    if (!this.componentTracking.has(component)) {
      this.componentTracking.set(component, []);
    }
    const componentSnaps = this.componentTracking.get(component);
    componentSnaps.push(snapshot);
    if (componentSnaps.length > 50) componentSnaps.shift();

    return snapshot;
  }

  detectLeak() {
    if (this.snapshots.length < 10) return null;

    const recent = this.snapshots.slice(-10);
    const oldest = recent[0].usedJSHeapSize;
    const newest = recent[recent.length - 1].usedJSHeapSize;
    const growth = newest - oldest;

    if (growth > this.leakThreshold) {
      return {
        detected: true,
        growth,
        growthMB: (growth / 1048576).toFixed(2),
        trend: 'increasing',
        suspectedComponent: this.identifyLeakyComponent()
      };
    }

    return { detected: false, growth };
  }

  identifyLeakyComponent() {
    let maxGrowth = 0;
    let suspect = 'unknown';

    for (const [component, snaps] of this.componentTracking) {
      if (snaps.length < 5) continue;
      const growth = snaps[snaps.length - 1].usedJSHeapSize - snaps[0].usedJSHeapSize;
      if (growth > maxGrowth) {
        maxGrowth = growth;
        suspect = component;
      }
    }

    return suspect;
  }

  startMonitoring(intervalMs = 30000) {
    this.interval = setInterval(async () => {
      await this.takeSnapshot();
      const leak = this.detectLeak();
      if (leak?.detected) {
        console.warn('[Focus Mode] Potential memory leak detected:', leak);
        // Report to crash analytics (Phase 11)
        this.reportLeak(leak);
      }
    }, intervalMs);
  }

  stopMonitoring() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  reportLeak(leak) {
    chrome.runtime.sendMessage({
      type: 'MEMORY_LEAK_WARNING',
      data: {
        growthMB: leak.growthMB,
        suspectedComponent: leak.suspectedComponent,
        timestamp: Date.now()
      }
    }).catch(() => {}); // Ignore if background isn't listening
  }

  getReport() {
    if (this.snapshots.length === 0) return null;

    return {
      currentMB: this.snapshots[this.snapshots.length - 1].usedMB,
      peakMB: Math.max(...this.snapshots.map(s => parseFloat(s.usedMB))).toFixed(2),
      snapshotCount: this.snapshots.length,
      leakStatus: this.detectLeak(),
      componentBreakdown: Object.fromEntries(
        [...this.componentTracking].map(([comp, snaps]) => [
          comp,
          { latest: snaps[snaps.length - 1]?.usedMB, samples: snaps.length }
        ])
      )
    };
  }
}
```

### 1.2 WeakMap/WeakRef Caching for Focus Mode Data

```javascript
// src/utils/weak-cache.js

// WeakMap for DOM element associations (block page, popup)
class FocusWeakCache {
  constructor() {
    this.cache = new WeakMap();
  }

  set(key, value) {
    if (typeof key !== 'object' || key === null) {
      throw new Error('WeakCache key must be an object');
    }
    this.cache.set(key, value);
  }

  get(key) {
    return this.cache.get(key);
  }

  has(key) {
    return this.cache.has(key);
  }
}

// SoftCache for Focus Score history, session data
// Values may be garbage-collected under memory pressure
class FocusSoftCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }
    // Store as WeakRef — value must be an object
    if (typeof value === 'object' && value !== null) {
      this.cache.set(key, new WeakRef(value));
    }
  }

  get(key) {
    const ref = this.cache.get(key);
    if (!ref) return undefined;

    const value = ref.deref();
    if (value === undefined) {
      this.cache.delete(key); // GC'd
    }
    return value;
  }

  cleanup() {
    for (const [key, ref] of this.cache) {
      if (ref.deref() === undefined) {
        this.cache.delete(key);
      }
    }
  }
}

// Focus Mode usage examples:
// - FocusWeakCache: associate DOM elements with their Focus Mode state (blocked site info, timer display refs)
// - FocusSoftCache: cache Focus Score calculation results, blocklist lookup tables, session history summaries
```

### 1.3 Event Listener Management

```javascript
// src/utils/event-manager.js
class FocusEventManager {
  constructor() {
    this.listeners = new Map();
    this.listenerCount = 0;
  }

  add(target, event, handler, options) {
    const id = ++this.listenerCount;
    const entry = { id, target, event, handler, options };

    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(entry);
    target.addEventListener(event, handler, options);

    return id; // Return ID for targeted removal
  }

  removeById(id) {
    for (const [event, entries] of this.listeners) {
      const index = entries.findIndex(e => e.id === id);
      if (index !== -1) {
        const { target, handler, options } = entries[index];
        target.removeEventListener(event, handler, options);
        entries.splice(index, 1);
        return true;
      }
    }
    return false;
  }

  removeAll() {
    for (const [event, entries] of this.listeners) {
      for (const { target, handler, options } of entries) {
        target.removeEventListener(event, handler, options);
      }
    }
    this.listeners.clear();
    this.listenerCount = 0;
  }

  getCount() {
    let count = 0;
    for (const entries of this.listeners.values()) {
      count += entries.length;
    }
    return count;
  }
}

// Usage in Focus Mode content script (block page)
// const eventManager = new FocusEventManager();
// eventManager.add(document, 'click', handleBlockPageClick);
// eventManager.add(window, 'resize', handleResize, { passive: true });
//
// On cleanup:
// eventManager.removeAll();
```

### 1.4 Content Script Memory Management (Block Page)

Focus Mode's content script is injected into blocked pages to display the block page UI. Memory management is critical since it runs on every blocked navigation.

```javascript
// src/content/block-page-content.js
(function() {
  'use strict';

  // Scoped state — no globals leak
  const state = {
    initialized: false,
    shadowRoot: null,    // Phase 18: Shadow DOM for block page
    observer: null,
    eventManager: null,  // FocusEventManager instance
    timerId: null        // Pomodoro countdown timer
  };

  function init() {
    if (state.initialized) return;
    state.initialized = true;

    state.eventManager = new FocusEventManager();

    // Create Shadow DOM block page (Phase 18 SecureBlockPage)
    const host = document.createElement('div');
    host.id = 'focus-mode-block';
    state.shadowRoot = host.attachShadow({ mode: 'closed' });

    // Inject block page content into shadow root
    renderBlockPage(state.shadowRoot);

    document.documentElement.appendChild(host);

    // MutationObserver to prevent removal of block page
    state.observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        for (const removed of mutation.removedNodes) {
          if (removed === host || removed.id === 'focus-mode-block') {
            // Re-inject if removed (anti-bypass)
            document.documentElement.appendChild(host);
          }
        }
      }
    });

    state.observer.observe(document.documentElement, { childList: true });
  }

  function cleanup() {
    if (state.observer) {
      state.observer.disconnect();
      state.observer = null;
    }
    if (state.eventManager) {
      state.eventManager.removeAll();
      state.eventManager = null;
    }
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
    state.shadowRoot = null;
    state.initialized = false;
  }

  // Listen for cleanup signal
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'CLEANUP_BLOCK_PAGE') {
      cleanup();
      sendResponse({ success: true });
    }
  });

  // Auto-cleanup on page unload
  window.addEventListener('unload', cleanup, { once: true });

  function renderBlockPage(shadowRoot) {
    // Block page rendering — uses SafeDOM (Phase 18) for XSS prevention
    // ... block page UI code
  }

  init();
})();
```

### 1.5 Memory Budget by Component

| Component | Memory Budget | Rationale |
|-----------|--------------|-----------|
| Service Worker (background) | < 50MB | Runs persistently; Chrome may terminate if too high |
| Popup UI | < 30MB | Short-lived; includes Focus Score animations |
| Block Page (content script) | < 10MB | Injected per blocked page; must be lightweight |
| Options Page | < 40MB | Includes Focus Score history charts (Pro) |
| Nuclear Mode Engine | < 5MB | Part of service worker; minimal state |
| Pomodoro Timer | < 2MB | Part of service worker; just countdown + alarms |
| Focus Score Calculator | < 5MB | Part of service worker; 7-day rolling data |

### 1.6 Focus Mode-Specific Memory Leak Patterns

| Pattern | Risk | Prevention |
|---------|------|------------|
| Block page re-injection loop | High | MutationObserver with dedup; limit to 1 active block page |
| Pomodoro timer interval accumulation | Medium | Always clearInterval before creating new; single timer pattern |
| Focus Score history unbounded growth | Medium | Cap at 90 days of data; prune on session start |
| Blocklist cache not evicted | Low | LRU eviction; refresh from storage on demand |
| Event listeners on removed block page DOM | High | FocusEventManager.removeAll() on cleanup |
| Nuclear Mode countdown timers | Medium | Single alarm pattern (Phase 12); no setInterval |
| declarativeNetRequest rule accumulation | Low | Chrome manages; removeOldRules before adding new |

---

## 2. Bundle Size Optimization

### 2.1 Webpack Configuration for Focus Mode

```javascript
// webpack.config.js
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: {
      // Service worker — core blocking + Pomodoro + Nuclear Mode
      background: './src/background/index.js',
      // Popup — Focus Score display, blocklist management, timer control
      popup: './src/popup/index.js',
      // Content script — block page injection (MUST be tiny)
      'content-block': './src/content/block-page-content.js',
      // Options page — settings, Focus Score history, Pro management
      options: './src/options/index.js',
      // Block page standalone — full block page UI
      'block-page': './src/pages/block-page.js'
    },

    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      clean: true
    },

    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: isProduction,
              drop_debugger: isProduction,
              pure_funcs: isProduction ? ['console.log', 'console.debug', 'console.info'] : [],
              passes: 2  // Extra compression pass
            },
            mangle: {
              // Don't mangle Chrome API calls
              reserved: ['chrome']
            },
            output: {
              comments: false
            }
          }
        })
      ],

      splitChunks: {
        chunks(chunk) {
          // Don't split content script — must be single file for injection
          return chunk.name !== 'content-block';
        },
        cacheGroups: {
          shared: {
            name: 'shared',
            chunks: 'all',
            minChunks: 2,
            priority: -10
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            chunks(chunk) {
              return chunk.name !== 'content-block';
            },
            priority: -20
          }
        }
      }
    },

    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  targets: { chrome: '100' },  // MV3 requires Chrome 100+
                  modules: false,               // Keep ES modules for tree shaking
                  useBuiltIns: 'usage',
                  corejs: 3
                }]
              ]
            }
          }
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        }
      ]
    },

    plugins: [
      new CopyPlugin({
        patterns: [
          { from: 'manifest.json', to: 'manifest.json' },
          { from: 'assets', to: 'assets' },
          { from: 'src/pages/*.html', to: '[name].html' },
          { from: '_locales', to: '_locales' }  // Phase 15 i18n
        ]
      }),

      // Bundle analysis in production
      ...(isProduction ? [
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: '../reports/bundle-report.html',
          openAnalyzer: false
        })
      ] : [])
    ],

    externals: {
      chrome: 'chrome'
    },

    devtool: isProduction ? false : 'cheap-module-source-map'
  };
};
```

### 2.2 Tree Shaking for Focus Mode Modules

```javascript
// src/utils/index.js — Named exports for tree shaking
export { debounce } from './debounce';
export { throttle } from './throttle';
export { formatDuration } from './format-duration';
export { formatFocusScore } from './format-focus-score';
export { validateDomain } from './validate-domain';

// DON'T: export default { debounce, throttle, ... }
// This prevents tree shaking

// Import only what's needed per entry point:
// background: import { debounce, validateDomain } from './utils';
// popup:      import { formatDuration, formatFocusScore } from './utils';
// content:    (import nothing from utils — keep content script minimal)
```

### 2.3 Dynamic Imports for Pro Features

```javascript
// src/popup/index.js
// Free features load immediately
import { renderBlocklist } from './blocklist';
import { renderPomodoroTimer } from './pomodoro';
import { renderFocusScore } from './focus-score';

// Pro features loaded on demand
async function loadNuclearMode() {
  const { NuclearModeUI } = await import('./pro/nuclear-mode-ui.js');
  return new NuclearModeUI();
}

async function loadAdvancedAnalytics() {
  const { FocusScoreHistory } = await import('./pro/focus-score-history.js');
  return new FocusScoreHistory();
}

async function loadScheduleBlocking() {
  const { ScheduleManager } = await import('./pro/schedule-manager.js');
  return new ScheduleManager();
}

// Initialize
async function initPopup() {
  // Free features — always loaded
  renderBlocklist();
  renderPomodoroTimer();
  renderFocusScore();

  // Pro features — loaded only if Pro
  const { isPro } = await chrome.storage.local.get('isPro');
  if (isPro) {
    const nuclearUI = await loadNuclearMode();
    nuclearUI.render();

    // Analytics tab loaded when clicked
    document.getElementById('analytics-tab')?.addEventListener('click', async () => {
      const analytics = await loadAdvancedAnalytics();
      analytics.render();
    });
  }
}

initPopup();
```

### 2.4 Bundle Size Targets for Focus Mode

```
FOCUS MODE BUNDLE SIZE TARGETS:
├── background.js     → < 80KB   (service worker: blocking + Pomodoro + Nuclear + Focus Score)
├── popup.js          → < 100KB  (popup UI: blocklist + timer + score display)
├── content-block.js  → < 20KB   (⚠️ CRITICAL: injected into every blocked page!)
├── options.js        → < 80KB   (settings + Pro management)
├── block-page.js     → < 40KB   (standalone block page with motivation UI)
├── shared.js         → < 30KB   (shared utilities)
├── vendor.js         → < 50KB   (DOMPurify only — Phase 18 approved dependency)
└── Total             → < 400KB  (uncompressed)

WARNING THRESHOLDS:
├── content-block.js > 50KB   → Block page will noticeably slow page load
├── background.js > 150KB     → Service worker cold start > 100ms
├── Total > 1MB               → CWS review flag risk
└── Any file > 4MB            → Chrome hard limit

PRO FEATURE CHUNKS (lazy-loaded):
├── pro/nuclear-mode-ui.js    → < 20KB
├── pro/focus-score-history.js → < 30KB
├── pro/schedule-manager.js    → < 15KB
└── pro/custom-themes.js       → < 10KB
```

### 2.5 Dependency Budget

Based on Phase 18 approved dependencies:

| Dependency | Size (minified) | Used By | Justification |
|-----------|----------------|---------|---------------|
| DOMPurify | ~15KB | Block page, options | HTML sanitization (Phase 18 requirement) |
| Stripe.js | External CDN | Options page only | Payment processing (not bundled) |

**No other runtime dependencies.** All utilities (debounce, throttle, formatting) are custom implementations to keep bundle minimal.

### 2.6 Bundle Size CI Check

```javascript
// scripts/check-bundle-size.js
const fs = require('fs');
const path = require('path');

const BUDGETS = {
  'background.js': 80 * 1024,
  'popup.js': 100 * 1024,
  'content-block.js': 20 * 1024,
  'options.js': 80 * 1024,
  'block-page.js': 40 * 1024,
  'shared.js': 30 * 1024,
  'vendor.js': 50 * 1024
};

const TOTAL_BUDGET = 400 * 1024;

function checkBundleSizes() {
  const distDir = path.resolve(__dirname, '../dist');
  let totalSize = 0;
  let overBudget = false;

  console.log('Focus Mode Bundle Size Check');
  console.log('═'.repeat(60));

  for (const [file, budget] of Object.entries(BUDGETS)) {
    const filePath = path.join(distDir, file);
    if (!fs.existsSync(filePath)) continue;

    const size = fs.statSync(filePath).size;
    totalSize += size;

    const percent = ((size / budget) * 100).toFixed(1);
    const status = size <= budget ? '✓' : '✗ OVER';
    const sizeKB = (size / 1024).toFixed(1);
    const budgetKB = (budget / 1024).toFixed(1);

    console.log(`  ${status} ${file.padEnd(25)} ${sizeKB}KB / ${budgetKB}KB (${percent}%)`);

    if (size > budget) overBudget = true;
  }

  console.log('─'.repeat(60));
  const totalKB = (totalSize / 1024).toFixed(1);
  const totalBudgetKB = (TOTAL_BUDGET / 1024).toFixed(1);
  const totalStatus = totalSize <= TOTAL_BUDGET ? '✓' : '✗ OVER';
  console.log(`  ${totalStatus} TOTAL${' '.repeat(21)} ${totalKB}KB / ${totalBudgetKB}KB`);

  if (overBudget || totalSize > TOTAL_BUDGET) {
    console.error('\nBundle size budget exceeded!');
    process.exit(1);
  }

  console.log('\nAll bundle sizes within budget.');
}

checkBundleSizes();
```

---

## Key Design Decisions

### Content Script is the #1 Priority
- `content-block.js` at < 20KB is the tightest budget because it injects into every blocked page
- Uses Shadow DOM (Phase 18) for isolation but the script itself must be minimal
- No shared chunks — content script is a single self-contained file
- No dependencies — pure vanilla JS

### Pro Features are Lazy-Loaded
- Nuclear Mode UI, advanced analytics, schedule manager, and custom themes are dynamic imports
- Only loaded when the user is Pro AND accesses the feature
- Reduces popup load time for ~80% of users (Free tier)

### Near-Zero Dependencies
- Only DOMPurify (~15KB) is bundled as a runtime dependency
- Stripe.js loaded from CDN only on the options page when upgrading
- All utilities are custom ~1-2KB implementations
- This eliminates supply chain risk (Phase 18) and keeps bundle small

---

*Agent 1 — Memory Management & Bundle Size Optimization — Complete*
