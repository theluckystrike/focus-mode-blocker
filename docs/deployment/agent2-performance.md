# AGENT 2: PERFORMANCE AND OPTIMIZATION SPECIFICATION
## Focus Mode - Blocker Chrome Extension

> **Version:** 1.0 | **Date:** February 10, 2026 | **Status:** Specification Complete

---

## 1. PERFORMANCE AUDIT PLAN

### 1.1 Load Time Analysis

#### Popup Open Time (Target: <100ms)

| Phase | Budget | What Happens |
|-------|:------:|-------------|
| HTML parse | 5ms | Minimal HTML shell with inline critical CSS |
| Critical CSS | 10ms | Layout, colors, typography — no animations yet |
| Core JS | 25ms | State hydration from cached service worker data |
| UI render | 30ms | First meaningful paint — timer, score, stats |
| Deferred JS | 30ms | Non-critical: sounds, tooltips, animations |
| **Total** | **100ms** | Full interactive |

**Immediate load (critical path):**
- Current timer state (running/stopped, time remaining)
- Focus Score number
- Today's stats (focus time, blocks, attempts)
- Quick Focus button
- Navigation tabs

**Lazy load (after first paint):**
- Ambient sound controls
- Blocklist management UI
- Settings gear menu
- Pro feature tooltips and badges
- Streak animation
- Usage counter progress bar

**Pre-computation strategy:**
- Service worker pre-computes popup data on every state change
- Stores pre-rendered data object in `chrome.storage.session`
- Popup reads single key on open instead of computing

#### Service Worker Cold Start (Target: <100ms)

| Phase | Budget | Strategy |
|-------|:------:|---------|
| Module resolution | 10ms | Single entry point, dynamic imports for optional modules |
| Core initialization | 30ms | Alarm registration, blocking rules check, state restore |
| Storage read | 20ms | Single batched read of essential keys |
| Event listeners | 10ms | Register all Chrome API listeners |
| Deferred init | 30ms | Stats aggregation, sync check, analytics |
| **Total** | **100ms** | Ready for messages |

**Essential modules (load immediately):**
- Blocking engine (declarativeNetRequest management)
- Timer engine (alarm-based Pomodoro)
- State manager (chrome.storage interface)
- Message router (popup ↔ service worker)

**Deferred modules (load on demand):**
- Stats aggregator
- Gamification engine (streaks, score)
- Sync manager (Pro only)
- AI recommendations (Pro only)
- Sound controller
- Nuclear option manager
- Schedule manager
- Analytics reporter

#### Content Script Injection (Target: <50ms)

| Script | Budget | Size Target | Strategy |
|--------|:------:|:-----------:|---------|
| Detector | 15ms | <2KB | Minimal: check URL against rules, send message |
| Block page injector | 25ms | <15KB | Inline critical CSS, minimal JS for quotes/timer |
| Page time tracker | 10ms | <3KB | Passive observer, reports on unload |

### 1.2 Memory Analysis

#### Memory Budget per Component

| Component | Idle | Active | Peak | Cleanup Strategy |
|-----------|:----:|:------:|:----:|-----------------|
| Service worker | 8MB | 15MB | 25MB | Release deferred modules after 30s idle |
| Popup | 0MB (closed) | 12MB | 20MB | Full cleanup on close |
| Content script (per tab) | 0.5MB | 1MB | 2MB | Minimal footprint, no retained state |
| Offscreen (audio) | 0MB (silent) | 5MB | 8MB | Destroy document when not playing |
| **Total** | **8.5MB** | **33MB** | **55MB** | |

#### Memory Leak Prevention

| Risk Area | Detection Method | Prevention |
|-----------|-----------------|-----------|
| Event listeners | Count listeners on popup close | Remove all listeners in `cleanup()` |
| DOM references | WeakRef for cached elements | Nullify references on close |
| Timers | Track all setInterval/setTimeout IDs | Clear all in cleanup |
| Storage callbacks | Monitor pending promise count | Use AbortController for cancellation |
| Audio buffers | Monitor offscreen memory | Destroy offscreen doc when silent >60s |

### 1.3 Bundle Size Budget

| Component | Budget | Includes |
|-----------|:------:|---------|
| `popup.html` | 2KB | Shell HTML only |
| `popup.css` | 12KB | All styles including dark mode |
| `popup.js` | 35KB | UI logic, state management, components |
| `service-worker.js` | 40KB | All 18 modules (tree-shaken) |
| `content-detector.js` | 2KB | URL matching only |
| `content-blocker.js` | 15KB | Block page HTML/CSS/JS inline |
| `content-tracker.js` | 3KB | Page time observer |
| `options.html/css/js` | 45KB | Full settings page |
| `offscreen.html/js` | 5KB | Audio player |
| Icons (all sizes) | 20KB | 16/32/48/128px PNG |
| Fonts (subset) | 60KB | Inter (latin subset) + JetBrains Mono (digits only) |
| Ambient sounds (3) | 180KB | Compressed OGG: rain, white noise, lo-fi |
| Quotes database | 8KB | 50+ quotes as JSON |
| Pre-built blocklists | 5KB | Social media + news URLs |
| **Total** | **432KB** | Under 500KB target |

**Asset optimization plan:**
- Fonts: Subset to Latin characters only; JetBrains Mono subset to digits + colon (timer display)
- Icons: Use SVG where possible, PNG only for required Chrome sizes
- Sounds: OGG Vorbis at 64kbps mono, 60-second loops
- JS: Terser minification, tree-shaking unused exports
- CSS: PurgeCSS to remove unused selectors

---

## 2. CODE OPTIMIZATIONS

### 2.1 Lazy Loading Specification

```
POPUP LOAD ORDER:
1. [0ms]   HTML shell + critical CSS (inline <style>)
2. [5ms]   popup-core.js — state hydration, timer display, Quick Focus
3. [35ms]  First paint — user sees current state
4. [36ms]  popup-tabs.js — tab navigation, blocklist UI
5. [50ms]  popup-pro.js — Pro badges, tooltips, blur effects
6. [70ms]  popup-sounds.js — ambient sound controls
7. [90ms]  popup-animations.js — streak flames, score ring animation
8. [100ms] Full interactive
```

### 2.2 Debounce/Throttle Plan

| Event | Strategy | Interval | Rationale |
|-------|----------|:--------:|-----------|
| Blocklist URL input | Debounce | 300ms | Validate after typing stops |
| Timer display update | RAF | 16ms | Smooth visual countdown |
| Storage writes | Debounce + batch | 1000ms | Combine multiple writes into one |
| Distraction counter increment | Immediate + throttle UI | 500ms | Increment storage immediately, throttle badge update |
| Window resize (options) | Debounce | 150ms | Layout recalculation |
| Scroll (virtual list) | Throttle | 100ms | Render visible items only |
| Focus Score recalculation | Debounce | 5000ms | Expensive computation |

### 2.3 DOM Manipulation Rules

1. **Never use innerHTML** — always `textContent` or DOM API (`createElement`, `appendChild`)
2. **Batch DOM reads before writes** — avoid layout thrashing
3. **Use `documentFragment`** for inserting multiple elements
4. **Use CSS classes** for state changes, not inline styles
5. **Use `display: none`** to hide elements, not `removeChild` (avoids reflow on show)
6. **Cache DOM references** — query once, store in variable
7. **Use event delegation** — single listener on parent, not per-item

### 2.4 Chrome API Call Batching

```javascript
// BAD: Multiple individual reads
const settings = await chrome.storage.local.get('settings');
const stats = await chrome.storage.local.get('stats');
const streaks = await chrome.storage.local.get('streaks');

// GOOD: Single batched read
const { settings, stats, streaks } = await chrome.storage.local.get([
  'settings', 'stats', 'streaks'
]);

// GOOD: Batched write
await chrome.storage.local.set({
  stats: updatedStats,
  streaks: updatedStreaks,
  lastUpdated: Date.now()
});
```

### 2.5 Storage Access Patterns

**Read-through cache:**
```javascript
class StorageCache {
  constructor() {
    this.cache = new Map();
    this.ttl = 30000; // 30s TTL
  }

  async get(keys) {
    const uncached = keys.filter(k => !this.cache.has(k) || this.isExpired(k));
    if (uncached.length > 0) {
      const data = await chrome.storage.local.get(uncached);
      uncached.forEach(k => this.cache.set(k, { value: data[k], time: Date.now() }));
    }
    return Object.fromEntries(keys.map(k => [k, this.cache.get(k)?.value]));
  }
}
```

**Write batching:**
- Accumulate writes for 1000ms
- Flush on: timer fire, popup close, navigation, or batch size >10 keys
- Single `chrome.storage.local.set()` call per flush

---

## 3. STORAGE OPTIMIZATIONS

### 3.1 In-Memory Cache Design

| Data | Cache Location | TTL | Invalidation |
|------|---------------|:---:|-------------|
| Current timer state | Service worker global | Realtime | On timer tick |
| Today's stats | Service worker global | 30s | On session end |
| Blocklist (URLs) | Service worker global | 5min | On add/remove |
| Settings | Service worker global | 10min | On settings change |
| Focus Score | Service worker global | 60s | On session end |
| Streak data | Service worker global | 5min | On day change |
| Subscription status | Service worker global | 24hr | On license check |

### 3.2 Storage Key Design

**Flat structure for frequently accessed data:**
```
"timer_state"       → { running, remaining, type, startedAt }
"today_stats"       → { focusTime, blocks, attempts, sessions }
"current_streak"    → { count, lastDate }
"focus_score"       → { score, breakdown, updatedAt }
"subscription"      → { tier, expiresAt, cachedAt }
```

**Namespaced structure for collections:**
```
"blocklist_custom"  → ["reddit.com", "twitter.com", ...]
"blocklist_social"  → ["facebook.com", "instagram.com", ...]
"sessions_2026_02"  → [{ start, end, duration, score }, ...]
"settings_blocking" → { schedules, nuclear, whitelist }
"settings_timer"    → { duration, breakDuration, autoStart }
```

### 3.3 Stale Data Cleanup

| Schedule | What | How |
|----------|------|-----|
| Daily (midnight alarm) | Aggregate previous day stats | Roll into monthly summary, clear daily |
| Weekly (Sunday alarm) | Session history older than 90 days (free) | Delete from `sessions_YYYY_MM` keys |
| On startup | Orphaned temp data | Clear `temp_*` keys |
| On storage >8MB | Oldest session history | Prune until under 7MB |

### 3.4 Quota Management

- `chrome.storage.local` limit: ~10MB
- Budget: 5MB for session history, 2MB for settings/blocklists, 1MB for stats, 2MB buffer
- Monitor with `chrome.storage.local.getBytesInUse()`
- Warn user at 8MB, auto-prune at 9MB
- Pro users with sync offload historical data to server

---

## 4. RENDERING OPTIMIZATIONS

### 4.1 CSS-Only Animations

| Animation | Implementation | Duration | Easing |
|-----------|---------------|:--------:|--------|
| Popup fade-in | `opacity: 0→1` | 150ms | ease-out |
| Tab switch | `transform: translateX` | 200ms | ease-in-out |
| Timer tick | CSS counter + `transition` | 1000ms | linear |
| Score ring fill | `stroke-dashoffset` transition | 800ms | ease-out |
| Streak flame | CSS keyframe (scale + opacity) | 600ms | ease-in-out |
| Lock → unlock | `transform: scale(1→0→1)` + color | 400ms | spring |
| Blur → unblur | `filter: blur(6px→0)` | 500ms | ease-out |
| Progress bar | `width` transition | 300ms | ease-out |
| Badge pulse | CSS keyframe (scale 1→1.1→1) | 2000ms | ease-in-out |

**Rule: No JavaScript animations.** All motion via CSS transitions and keyframes. Use `will-change` sparingly (only on actively animating elements, remove after).

### 4.2 Virtual Scrolling (Blocklist)

Trigger virtual scrolling when blocklist exceeds 50 items (Pro users):
- Visible viewport: 8 items at 48px height = 384px
- Render buffer: 4 items above + 4 below viewport
- Total rendered DOM nodes: 16 (constant regardless of list size)
- Use `transform: translateY()` on container for scroll position
- Recycle DOM nodes on scroll

### 4.3 Popup Render Pipeline

```
1. [HTML]     Minimal shell: header + empty content area + footer
2. [CSS]      Critical CSS inline in <style> (layout + colors only)
3. [JS-sync]  Read pre-computed state from chrome.storage.session
4. [Paint]    First meaningful paint — user sees timer + stats
5. [JS-async] Hydrate interactive elements (buttons, tabs, inputs)
6. [CSS]      Load deferred CSS (animations, hover states, tooltips)
7. [JS-lazy]  Load optional modules (sounds, Pro badges, settings)
```

### 4.4 Block Page Instant Render

- ALL block page CSS is inline (no external stylesheet)
- ALL block page JS is inline (no external script)
- Quote selected in service worker, passed via URL parameter or message
- No network requests (all assets embedded)
- Fonts: system font stack for block page (no custom font load)
- Target: visible content in <50ms from navigation intercept

---

## 5. SERVICE WORKER OPTIMIZATIONS

### 5.1 Event-Driven Architecture

```
Service Worker Lifecycle:
  INSTALL → Cache static assets, register initial alarms
  ACTIVATE → Claim clients, verify blocking rules
  IDLE → Sleep (Chrome terminates after ~30s idle)
  WAKE → Alarm fires, message received, or navigation event

Message Types (wake triggers):
  popup_opened     → Send cached state, start UI sync
  popup_closed     → Flush pending writes, stop UI sync
  timer_tick       → Update timer, check completion
  site_blocked     → Increment counter, log attempt
  session_start    → Initialize session tracking
  session_end      → Calculate score, update stats
```

### 5.2 Alarm Combining

**Instead of many alarms, use few with multiplexing:**

| Alarm Name | Period | Handles |
|-----------|:------:|---------|
| `heartbeat_1m` | 1 min | Timer ticks, nuclear countdown, session tracking |
| `daily_rollover` | 24 hr | Stats aggregation, streak check, data cleanup |
| `weekly_digest` | 7 days | Weekly report generation, T7 trigger check |
| `schedule_check` | 1 min | Schedule activation/deactivation (only when schedules exist) |

**Total alarms: 3-4** (vs 12+ if each feature had its own).

### 5.3 Module Import Strategy

```javascript
// service-worker.js — entry point
import { BlockingEngine } from './modules/blocking.js';      // Always loaded
import { TimerEngine } from './modules/timer.js';            // Always loaded
import { StateManager } from './modules/state.js';           // Always loaded
import { MessageRouter } from './modules/messages.js';       // Always loaded

// Dynamic imports — loaded on demand
async function loadStatsModule() {
  const { StatsAggregator } = await import('./modules/stats.js');
  return new StatsAggregator();
}

async function loadSyncModule() {
  const { SyncManager } = await import('./modules/sync.js');
  return new SyncManager();
}
// ... similar for: gamification, nuclear, schedule, sounds, analytics, ai
```

---

## 6. PERFORMANCE BENCHMARKS

| # | Metric | Component | Target | Critical | Measurement Method |
|---|--------|-----------|:------:|:--------:|-------------------|
| 1 | Popup TTI | Popup | <100ms | >200ms | `performance.now()` on DOMContentLoaded |
| 2 | Popup first paint | Popup | <50ms | >100ms | `performance.getEntriesByType('paint')` |
| 3 | Service worker cold start | SW | <100ms | >500ms | Time from wake event to ready |
| 4 | Storage single read | SW | <5ms | >20ms | `performance.now()` around `get()` |
| 5 | Storage batch read (5 keys) | SW | <10ms | >30ms | Same, batched |
| 6 | Storage write | SW | <5ms | >15ms | `performance.now()` around `set()` |
| 7 | Block page render | Content | <50ms | >150ms | Time from injection to first paint |
| 8 | Content script injection | Content | <50ms | >100ms | `chrome.scripting.executeScript` callback |
| 9 | declarativeNetRequest update | SW | <20ms | >100ms | `updateDynamicRules` callback |
| 10 | Timer tick processing | SW | <5ms | >20ms | Alarm handler duration |
| 11 | Focus Score calculation | SW | <30ms | >100ms | Computation time |
| 12 | Tab switch in popup | Popup | <100ms | >200ms | Click to content visible |
| 13 | Blocklist filter (100 items) | Popup | <16ms | >50ms | Filter function duration |
| 14 | Total extension size | Build | <500KB | >1MB | `du -sh` on build output |
| 15 | Memory (idle) | All | <20MB | >50MB | `chrome.system.memory` or DevTools |
| 16 | Memory (active session) | All | <50MB | >100MB | Same, during focus session |
| 17 | Memory per blocked tab | Content | <2MB | >5MB | DevTools per-frame memory |
| 18 | Audio playback latency | Offscreen | <200ms | >500ms | Click to audible |
| 19 | Options page load | Options | <200ms | >500ms | DOMContentLoaded |
| 20 | Notification delivery | SW | <100ms | >500ms | `chrome.notifications.create` callback |
| 21 | Page load impact (enabled) | Content | <10ms | >50ms | Lighthouse delta |
| 22 | CPU during focus session | SW | <1% | >5% | DevTools Performance tab |

---

## 7. BROWSER IMPACT ASSESSMENT

### Methodology

| Test | Procedure | Metric | Acceptable Impact |
|------|-----------|--------|:----------------:|
| Page load time | Load 10 popular sites with/without extension, 5 runs each | Average load time delta | <10ms |
| Browser startup | Cold start Chrome with/without extension, 10 runs | Time to interactive delta | <100ms |
| Tab switching | Switch between 10 tabs with/without, measure via DevTools | Switch time delta | <5ms |
| Memory (10 tabs) | Open 10 tabs, measure after 5min idle | Total memory delta | <30MB |
| Memory (50 tabs) | Open 50 tabs, measure after 5min idle | Total memory delta | <80MB |
| Memory (100 tabs) | Open 100 tabs, measure after 5min idle | Total memory delta | <150MB |
| CPU idle | Extension installed, no active session, 5min measurement | Average CPU % | <0.1% |
| CPU active | During focus session with blocking, 5min | Average CPU % | <1% |
| Battery impact | 1hr browsing with/without on laptop | Battery % delta | <1% |

### Test Sites for Page Load

1. google.com (minimal)
2. reddit.com (blocked — measures block page performance)
3. twitter.com (blocked)
4. github.com (not blocked — measures detector overhead)
5. youtube.com (blocked)
6. amazon.com (not blocked)
7. wikipedia.org (not blocked)
8. nytimes.com (blocked)
9. stackoverflow.com (not blocked)
10. gmail.com (not blocked)

---

## 8. OPTIMIZATION CHECKLIST

### Must-Do Before Launch (Critical)

- [ ] **OPT-01** Inline critical CSS in popup HTML — Impact: High, Complexity: Low
- [ ] **OPT-02** Pre-compute popup state in service worker — Impact: High, Complexity: Medium
- [ ] **OPT-03** Batch all chrome.storage reads/writes — Impact: High, Complexity: Medium
- [ ] **OPT-04** Lazy-load non-critical popup modules — Impact: High, Complexity: Medium
- [ ] **OPT-05** Inline all block page assets (no external loads) — Impact: High, Complexity: Low
- [ ] **OPT-06** Subset fonts to required characters — Impact: Medium, Complexity: Low
- [ ] **OPT-07** Compress ambient sounds to OGG 64kbps mono — Impact: Medium, Complexity: Low
- [ ] **OPT-08** Use event-driven service worker (no polling) — Impact: High, Complexity: Medium
- [ ] **OPT-09** Combine alarms into 3-4 multiplexed timers — Impact: Medium, Complexity: Medium
- [ ] **OPT-10** Implement read-through storage cache — Impact: High, Complexity: Medium
- [ ] **OPT-11** Content detector script under 2KB — Impact: Medium, Complexity: Low
- [ ] **OPT-12** CSS-only animations (zero JS animation) — Impact: Medium, Complexity: Low

### Should-Do Before Launch (Important)

- [ ] **OPT-13** Dynamic imports for optional service worker modules — Impact: Medium, Complexity: Medium
- [ ] **OPT-14** Virtual scrolling for blocklist >50 items — Impact: Medium, Complexity: High
- [ ] **OPT-15** Debounce URL input validation (300ms) — Impact: Low, Complexity: Low
- [ ] **OPT-16** Throttle badge updates (500ms) — Impact: Low, Complexity: Low
- [ ] **OPT-17** Use `chrome.storage.session` for ephemeral state — Impact: Medium, Complexity: Low
- [ ] **OPT-18** Destroy offscreen document when audio stops — Impact: Medium, Complexity: Medium
- [ ] **OPT-19** System font stack for block page (no custom fonts) — Impact: Low, Complexity: Low
- [ ] **OPT-20** PurgeCSS to remove unused selectors — Impact: Low, Complexity: Low
- [ ] **OPT-21** Tree-shake unused exports in build — Impact: Low, Complexity: Low
- [ ] **OPT-22** Stale data cleanup on daily alarm — Impact: Medium, Complexity: Medium

### Nice-to-Have (Enhancement)

- [ ] **OPT-23** Service worker pre-warm on Chrome startup — Impact: Low, Complexity: Medium
- [ ] **OPT-24** Intersection Observer for lazy-loading popup sections — Impact: Low, Complexity: Medium
- [ ] **OPT-25** `requestIdleCallback` for non-critical computations — Impact: Low, Complexity: Low
- [ ] **OPT-26** Workbox for static asset caching — Impact: Low, Complexity: Medium
- [ ] **OPT-27** Compression (gzip) for stored session history — Impact: Low, Complexity: Medium
- [ ] **OPT-28** `will-change` hints for animated elements — Impact: Low, Complexity: Low
- [ ] **OPT-29** Memory snapshot automated testing — Impact: Low, Complexity: High
- [ ] **OPT-30** Bundle analyzer integration in build — Impact: Low, Complexity: Low

---

## 9. PERFORMANCE MONITORING

### Production Metrics (Stored in chrome.storage.local)

```javascript
"perf_metrics": {
  "popup_load_times": [/* last 10 */],
  "sw_cold_starts": [/* last 10 */],
  "storage_read_times": [/* last 10 */],
  "block_page_renders": [/* last 10 */],
  "memory_snapshots": [/* daily peak */],
  "last_updated": "2026-02-10T..."
}
```

### Regression Detection

| Metric | Baseline | Warning (1.5x) | Alert (2x) |
|--------|:--------:|:--------------:|:----------:|
| Popup load | 80ms | 120ms | 160ms |
| SW cold start | 70ms | 105ms | 140ms |
| Storage read | 4ms | 6ms | 8ms |
| Block page | 40ms | 60ms | 80ms |

- Compare rolling 10-measurement average against baseline
- If warning threshold hit 3x consecutively → log to `perf_warnings`
- Surface in developer/debug settings panel
- Include in analytics (opt-in) for aggregate monitoring

### User-Reported Performance Issues

- Settings → About → "Report Performance Issue" button
- Collects: perf_metrics, Chrome version, OS, extension version, installed extensions count
- Does NOT collect: browsing data, blocklist contents, personal info
- Sends to analytics endpoint (opt-in only)

---

*Performance specification generated for Phase 04 — Deployment System*
*Target: Every interaction feels instant. Every byte is justified.*
