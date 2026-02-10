# Focus Mode - Blocker: Runtime Testing Specification

> **Document**: Agent 3 — Runtime Test Plan
> **Extension**: Focus Mode - Blocker (MV3 Chrome Extension)
> **Date**: 2026-02-10
> **Total Scenarios**: 115

---

## Table of Contents

1. [Popup Runtime Test Plan (30 scenarios)](#1-popup-runtime-test-plan)
2. [Service Worker Test Plan (20 scenarios)](#2-service-worker-test-plan)
3. [Content Script Test Plan (15 scenarios)](#3-content-script-test-plan)
4. [Storage Runtime Tests (15 scenarios)](#4-storage-runtime-tests)
5. [Edge Case Runtime Tests (25 scenarios)](#5-edge-case-runtime-tests)
6. [Performance Runtime Tests (10 scenarios)](#6-performance-runtime-tests)
7. [Error Documentation Template](#7-error-documentation-template)

---

## General Testing Prerequisites

- Chrome 120+ (stable channel) on macOS/Windows/Linux
- Extension loaded unpacked via `chrome://extensions` with Developer Mode enabled
- DevTools console open for each context under test (popup, service worker, content script)
- `chrome://extensions` visible for service worker inspection
- All tests begin from a clean state unless otherwise specified (clear storage via DevTools Application tab)
- Console errors captured by injecting `window.onerror` and `unhandledrejection` listeners before each test sequence

### Console Error Capture Methodology

For every test scenario in this document, apply the following error capture procedure:

1. **Before the test**: Open the relevant DevTools console (popup inspector, service worker inspector, or page console). Run:
   ```js
   const __errors = [];
   const __origError = console.error;
   console.error = (...args) => { __errors.push({ts: Date.now(), args}); __origError(...args); };
   window.addEventListener('error', e => __errors.push({ts: Date.now(), msg: e.message, src: e.filename, line: e.lineno}));
   window.addEventListener('unhandledrejection', e => __errors.push({ts: Date.now(), reason: e.reason}));
   ```
2. **After the test**: Run `JSON.parse(JSON.stringify(__errors))` and attach to the test result.
3. **Pass criteria**: Zero entries in `__errors` unless the scenario explicitly expects a handled error.

---

## 1. Popup Runtime Test Plan

30 test scenarios covering open/close behavior, every UI state, interactive elements, empty states, and maximum data states.

### 1.1 Opening and Closing Behavior

#### POP-01: Initial popup open from toolbar icon
- **Precondition**: Extension installed, no active session.
- **Steps**:
  1. Click the extension toolbar icon.
  2. Observe popup dimensions and initial render.
- **Expected**: Popup opens at 380x500px. Default state renders within 300ms. No console errors. Focus Score and session controls visible.
- **Measurement**: Timestamp `performance.now()` at DOMContentLoaded vs. last UI element painted.

#### POP-02: Popup close on outside click
- **Steps**:
  1. Open popup.
  2. Click anywhere outside the popup boundary.
- **Expected**: Popup closes immediately. Service worker receives no spurious messages. Any in-progress UI animations terminate cleanly.

#### POP-03: Popup close during active session
- **Steps**:
  1. Start a Pomodoro focus session (25 min).
  2. Close popup by clicking outside.
  3. Re-open popup after 30 seconds.
- **Expected**: Timer state persists. Re-opened popup shows correct remaining time (within 1-second tolerance). Session is not interrupted.

#### POP-04: Rapid open/close cycling
- **Steps**:
  1. Click toolbar icon to open popup.
  2. Immediately click outside to close.
  3. Repeat 10 times rapidly (< 500ms between open/close).
- **Expected**: No console errors, no zombie popup instances, no orphaned event listeners. Final open renders correctly.

#### POP-05: Popup open while DevTools is inspecting popup
- **Steps**:
  1. Right-click extension icon > Inspect popup.
  2. DevTools opens; popup stays pinned.
  3. Interact with popup UI elements.
- **Expected**: Popup remains open while DevTools is attached. All interactions behave identically to non-inspected state.

### 1.2 UI States

#### POP-06: Default state — no session, no history
- **Precondition**: Fresh install, storage cleared.
- **Steps**: Open popup.
- **Expected**: Focus Score displays 0. Streak counter shows 0. "Start Focus" button enabled. Quick Focus button visible. Stats area shows empty state message (e.g., "No sessions yet"). No console errors.

#### POP-07: Active session state — Pomodoro running
- **Precondition**: Active 25-minute Pomodoro session, 12 minutes remaining.
- **Steps**: Open popup.
- **Expected**: Timer circle/countdown shows ~12:00. "Stop" or "End Session" button visible. Blocked sites count displayed. Start button replaced or disabled. Current session duration visible.

#### POP-08: Active session state — break period
- **Precondition**: 25-minute work period completed, 5-minute break active.
- **Steps**: Open popup.
- **Expected**: Timer shows break countdown. UI clearly indicates break mode (color change or label). "Skip Break" option available.

#### POP-09: Post-session summary state
- **Precondition**: Complete a full Pomodoro cycle (25 + 5).
- **Steps**: Observe popup after session ends.
- **Expected**: Summary card shows: session duration, sites blocked count, distraction attempts, Focus Score delta. "Start Another" button visible. Stats updated.

#### POP-10: Nuclear mode active state
- **Precondition**: Nuclear option activated (1hr).
- **Steps**: Open popup.
- **Expected**: Nuclear indicator prominently displayed. Timer shows nuclear countdown. All blocklist modification controls disabled/hidden. Cancel option is NOT available (nuclear is irrevocable). Visual urgency indicator (e.g., red accent).

#### POP-11: Blocklist management view
- **Steps**:
  1. Open popup.
  2. Navigate to blocklist tab/section.
- **Expected**: Current blocked sites listed. Add-site input field present. Remove button per site. Pre-built list categories visible. Toggle per-site enable/disable works. Search/filter works if present.

#### POP-12: Stats/analytics view
- **Precondition**: At least 5 completed sessions across 3 days.
- **Steps**: Navigate to stats view.
- **Expected**: Daily stats chart/graph renders. Total focus time displayed. Streak count accurate. Focus Score history shown. Distraction counter totals correct.

#### POP-13: Settings view
- **Steps**: Navigate to settings section.
- **Expected**: All setting controls render: Pomodoro duration, break duration, notification preferences, ambient sound selection, schedule configuration, Pro status indicator.

#### POP-14: Paywall trigger state — session 5
- **Precondition**: User has completed exactly 4 sessions (free tier).
- **Steps**: Attempt to start session 5.
- **Expected**: Paywall modal/overlay appears. Pro features described. Purchase/upgrade CTA visible. User can dismiss and return to free functionality. Session does not start until resolved.

#### POP-15: Pro user state
- **Precondition**: Valid Pro license stored in `chrome.storage.sync`.
- **Steps**: Open popup.
- **Expected**: No paywall triggers. Pro badge/indicator visible. All premium features enabled (nuclear 24hr, advanced stats, schedule blocking, ambient sounds, pre-built lists). No upgrade prompts.

### 1.3 Interactive Elements

#### POP-16: Start Focus button — default Pomodoro
- **Steps**: Click "Start Focus" with default 25/5 settings.
- **Expected**: Timer begins counting down from 25:00. Service worker alarm created (verify via `chrome.alarms.getAll()`). Blocked sites become active. Button transitions to stop/cancel state.

#### POP-17: Quick Focus button
- **Steps**: Click "Quick Focus" button.
- **Expected**: Session starts immediately with preset duration. No configuration modal. Timer begins. Blocklist activates.

#### POP-18: Stop/end session button during active session
- **Steps**:
  1. Start a session.
  2. Wait 2 minutes.
  3. Click stop/end.
- **Expected**: Confirmation dialog appears (if implemented). On confirm: session ends, partial stats recorded, timer resets, blocked sites deactivated.

#### POP-19: Add site to blocklist via input
- **Steps**:
  1. Navigate to blocklist.
  2. Type `reddit.com` in the input field.
  3. Press Enter or click Add.
- **Expected**: Site appears in blocklist. `chrome.storage.local` updated. If session is active, `declarativeNetRequest` rules updated immediately. Input field clears.

#### POP-20: Remove site from blocklist
- **Steps**: Click remove/delete button next to a blocked site.
- **Expected**: Site removed from list. Storage updated. If no active nuclear mode, `declarativeNetRequest` rules updated. Site accessible again (verify by navigating to it).

#### POP-21: Toggle individual site blocking on/off
- **Steps**: Toggle a single site's enable/disable switch.
- **Expected**: Visual toggle state updates. Storage reflects change. DNR rules updated accordingly. No effect on other sites.

#### POP-22: Pre-built blocklist selection
- **Steps**: Select a pre-built list category (e.g., "Social Media").
- **Expected**: All sites in category added to blocklist at once. Storage updated with batch. DNR rules bulk-updated. UI shows all new sites.

#### POP-23: Ambient sound selection and playback
- **Precondition**: Pro user or within free feature scope.
- **Steps**:
  1. Navigate to ambient sound selector.
  2. Select a sound (e.g., "Rain").
  3. Start a focus session.
- **Expected**: Offscreen document created for audio playback. Sound plays without popup needing to stay open. Volume slider adjusts level in real-time. Sound stops when session ends.

#### POP-24: Schedule blocking configuration
- **Steps**: Configure a weekday 9am-5pm blocking schedule.
- **Expected**: Schedule saved to storage. UI shows active schedule. Blocking automatically engages/disengages at configured times (test by setting schedule to current time window). Alarm created for next transition.

#### POP-25: Nuclear option activation — 1 hour
- **Steps**: Click nuclear option and select 1 hour.
- **Expected**: Confirmation prompt appears with clear warning. On confirm: all blocked sites locked, no modification allowed, countdown shows 1:00:00, storage flagged with nuclear end timestamp.

#### POP-26: Nuclear option activation — 24 hours (Pro)
- **Precondition**: Pro license active.
- **Steps**: Select 24-hour nuclear option.
- **Expected**: Same as POP-25 but with 24:00:00 duration. Survives browser restart (verified in POP-03 pattern).

#### POP-27: Notification muting toggle
- **Steps**: Toggle notification muting on.
- **Expected**: Chrome notification permissions adjusted or internal flag set. During active session, notifications from blocked sites suppressed. Toggle state persists across popup close/reopen.

### 1.4 Empty and Maximum Data States

#### POP-28: Empty blocklist state
- **Precondition**: Zero sites in blocklist.
- **Steps**: Open blocklist view.
- **Expected**: Empty state message displayed (e.g., "Add sites to block during focus sessions"). Add input still functional. Pre-built list suggestions visible. Starting a session with empty blocklist either warns user or allows session without blocking.

#### POP-29: Maximum blocklist — 200+ sites
- **Precondition**: Populate blocklist with 200 unique domains programmatically.
- **Steps**: Open blocklist view.
- **Expected**: List renders without lag (< 500ms). Scrolling is smooth (60fps). Search/filter works. Add and remove operations complete in < 200ms. DNR rule count within Chrome's dynamic rule limit (verify with `chrome.declarativeNetRequest.getDynamicRules()`).

#### POP-30: Maximum stats data — 365 days of history
- **Precondition**: Inject 365 days of session history into storage.
- **Steps**: Open stats view.
- **Expected**: Chart/graph renders without crash. Scrolling through history is smooth. Aggregations (weekly, monthly) calculate correctly. Storage size remains under 10MB quota. No truncation of visible data.

---

## 2. Service Worker Test Plan

20 test scenarios covering lifecycle, message handling, alarms, storage, termination, and recovery.

### 2.1 Lifecycle

#### SW-01: Cold start — first activation after install
- **Precondition**: Extension just installed (no prior service worker run).
- **Steps**:
  1. Observe service worker status on `chrome://extensions`.
  2. Open popup to trigger activation.
- **Expected**: Service worker starts and reaches `active` state. `onInstalled` fires with `reason: "install"`. Default storage values initialized. DNR rules set to initial state. No console errors in service worker inspector.
- **Measurement**: Time from click to service worker `active` state (target: < 500ms).

#### SW-02: Warm start — service worker already running
- **Steps**:
  1. Open popup (ensures SW is running).
  2. Close popup.
  3. Open popup again within 30 seconds.
- **Expected**: No re-initialization occurs. State consistent with pre-close state. Response time faster than cold start.

#### SW-03: onInstalled — update path
- **Steps**:
  1. Load extension at version 1.0.0.
  2. Modify manifest version to 1.1.0.
  3. Click "Update" on `chrome://extensions`.
- **Expected**: `onInstalled` fires with `reason: "update"` and `previousVersion: "1.0.0"`. Existing user data preserved. Any migration logic executes. DNR rules refreshed. Active sessions survive if applicable.

#### SW-04: Service worker termination after idle
- **Steps**:
  1. Start extension, then do not interact for 5 minutes.
  2. Observe service worker status on `chrome://extensions`.
- **Expected**: Service worker transitions to `stopped` state. No errors on termination. All pending operations completed or persisted before shutdown.

#### SW-05: Service worker restart after termination
- **Steps**:
  1. Allow SW to terminate (SW-04).
  2. Click toolbar icon to open popup.
- **Expected**: SW restarts. All state restored from storage. Active alarms still registered (Chrome persists alarms). Popup receives correct state. Timer values accurate (calculated from stored timestamps, not in-memory counters).

### 2.2 Message Handling

#### SW-06: Message from popup — start session
- **Steps**: Start a focus session from the popup.
- **Expected**: SW receives message with session parameters. SW creates alarm for session end. SW updates storage with session start time. SW activates DNR blocking rules. SW sends acknowledgment to popup.
- **Verification**: In SW console, log `chrome.runtime.onMessage` payloads.

#### SW-07: Message from popup — stop session
- **Steps**: Stop an active session from the popup.
- **Expected**: SW receives stop message. SW clears session alarm. SW calculates session stats. SW updates storage. SW deactivates DNR rules (unless nuclear mode). SW notifies all relevant content scripts.

#### SW-08: Message from content script — distraction attempt
- **Steps**: Navigate to a blocked site during an active session.
- **Expected**: Content script sends distraction event to SW. SW increments distraction counter in storage. SW logs timestamp for stats. SW may trigger notification or sound.

#### SW-09: Message with malformed payload
- **Steps**: Send `chrome.runtime.sendMessage({type: undefined, data: null})` from console.
- **Expected**: SW handles gracefully. Returns error response, does not crash. Error logged but no unhandled exception.

#### SW-10: Concurrent messages from multiple tabs
- **Steps**:
  1. Open 5 tabs with blocked sites during an active session.
  2. All tabs send distraction events simultaneously.
- **Expected**: All messages processed. Distraction counter incremented by 5. No race conditions on storage writes. No messages dropped.

### 2.3 Alarms

#### SW-11: Pomodoro timer alarm fires
- **Precondition**: Active 25-minute session, set alarm for 1 minute from now (for testing).
- **Steps**: Wait for alarm to fire.
- **Expected**: `chrome.alarms.onAlarm` handler executes. Session transitions to break or completes. Notification sent to user. Storage updated. Content scripts notified to update block page or remove overlay.

#### SW-12: Nuclear mode expiration alarm
- **Precondition**: Nuclear mode active with alarm set.
- **Steps**: Set nuclear for shortest testable duration, wait for expiry.
- **Expected**: Nuclear flag cleared in storage. DNR rules reverted to normal session rules (or deactivated if no session). Popup reflects normal state on next open.

#### SW-13: Schedule transition alarm
- **Precondition**: Schedule configured for a time boundary 1 minute from now.
- **Steps**: Wait for schedule boundary.
- **Expected**: Blocking engages or disengages per schedule. DNR rules toggled. Next schedule alarm created.

#### SW-14: Alarm fires while service worker is stopped
- **Steps**:
  1. Create an alarm 3 minutes out.
  2. Allow SW to terminate.
  3. Wait for alarm time.
- **Expected**: Chrome wakes SW to handle alarm. SW restores state from storage. Alarm handler executes correctly. No state loss.

### 2.4 Storage Reactions

#### SW-15: Storage change listener — blocklist modified
- **Steps**: Modify blocklist from popup (add a site).
- **Expected**: SW's `chrome.storage.onChanged` fires. SW updates DNR rules to match new blocklist. Change applied within 1 second.

#### SW-16: Storage change listener — settings modified
- **Steps**: Change Pomodoro duration in settings.
- **Expected**: SW picks up new settings. Next session uses updated duration. Current session (if active) either applies new settings or finishes with original (document which behavior is correct).

### 2.5 Error Recovery

#### SW-17: Uncaught exception in message handler
- **Steps**: Inject a message that triggers an edge case causing a thrown exception.
- **Expected**: Error caught by global error handler. SW does not crash permanently. Subsequent messages processed normally. Error logged for telemetry.

#### SW-18: Recovery after forced SW termination
- **Steps**:
  1. Start an active session.
  2. Go to `chrome://serviceworker-internals` and stop the SW.
  3. Open popup.
- **Expected**: SW restarts. Session state recovered from storage. Timer recalculated from stored start timestamp. Blocking rules still active (DNR rules persist independently of SW).

#### SW-19: Storage quota error handling
- **Steps**: Fill storage to near-quota, then trigger a write operation.
- **Expected**: SW catches `QUOTA_BYTES_PER_ITEM` or `QUOTA_BYTES` error. Fallback behavior executes (e.g., prune old data). User notified if critical. SW does not crash.

#### SW-20: Network error during Pro license verification
- **Steps**:
  1. Disable network.
  2. Trigger Pro license check.
- **Expected**: Verification fails gracefully. Cached license status used as fallback. User not downgraded to free during temporary outage. Retry scheduled via alarm. Error logged.

---

## 3. Content Script Test Plan

15 test scenarios covering injection, block page rendering, time tracking, SPAs, and iframes.

### 3.1 Injection and Block Page

#### CS-01: Block page injection on navigating to blocked site
- **Precondition**: Active session with `reddit.com` in blocklist.
- **Steps**: Navigate to `https://www.reddit.com`.
- **Expected**: Page load intercepted. Block page overlay renders covering full viewport. Original page content not visible. Block page shows: motivation message, remaining session time, distraction counter increment. Back button or redirect option available.

#### CS-02: Block page rendering fidelity
- **Steps**: Navigate to a blocked site and inspect the block page.
- **Expected**: Block page CSS does not conflict with host page styles (shadow DOM or scoped styles). Fonts load correctly. Timer updates in real-time (every second). No layout shifts. Responsive across viewport sizes.

#### CS-03: Block page interaction — return to previous page
- **Steps**: On block page, click "Go Back" or equivalent.
- **Expected**: User navigated to previous non-blocked page. No additional distraction counted for going back. History entry handled correctly (no infinite back-loop to blocked site).

#### CS-04: Block page interaction — view allowed anyway (if applicable)
- **Precondition**: Non-nuclear mode, if "allow temporarily" is a feature.
- **Steps**: Click bypass option if present.
- **Expected**: Bypass only available in non-nuclear, non-strict mode. If allowed: site loads, bypass logged, bypass duration limited (e.g., 5 minutes). If not available: no bypass UI shown.

#### CS-05: Content script not injected on non-blocked sites
- **Precondition**: Active session, `example.com` NOT in blocklist.
- **Steps**: Navigate to `https://example.com`.
- **Expected**: No content script UI injected. No block overlay. Page loads normally. No console errors from extension.

### 3.2 Page Time Tracking

#### CS-06: Time tracking on a single page
- **Steps**:
  1. Navigate to a non-blocked site.
  2. Stay for exactly 60 seconds (verify with stopwatch).
  3. Navigate away.
- **Expected**: Time tracker records ~60 seconds (tolerance: +/- 2 seconds). Data sent to SW on navigation or page hide. Stored in daily stats.

#### CS-07: Time tracking accuracy across tab switching
- **Steps**:
  1. Open site A in tab 1.
  2. Switch to tab 2 for 30 seconds.
  3. Switch back to tab 1 for 30 seconds.
- **Expected**: Tab 1 records ~60 seconds total active time (not 90). Inactive time while tab is background not counted. `visibilitychange` event used to track active vs. idle.

#### CS-08: Time tracking on page with system idle
- **Steps**:
  1. Open a page.
  2. Do not interact for 5 minutes (system idle).
- **Expected**: Idle time detection via `chrome.idle` API or `visibilitychange`. Time tracked only for active engagement. Idle threshold configurable or documented.

### 3.3 Single-Page Applications

#### CS-09: SPA navigation via pushState
- **Precondition**: `app.example.com` is blocked. SPA navigates internally.
- **Steps**:
  1. Navigate to blocked SPA root.
  2. Block page appears.
- **Expected**: Block page shown on initial navigation. If user somehow bypasses: internal SPA pushState navigations within same origin still detected. Block page re-engages on client-side route change to blocked path. `MutationObserver` or `popstate`/`pushState` override used for detection.

#### CS-10: Dynamic navigation — history.pushState on non-blocked to blocked
- **Precondition**: Site A is not blocked. Site A uses pushState to navigate to path matching a blocked rule.
- **Steps**: Trigger client-side navigation.
- **Expected**: If blocking is domain-level only, no change (already on allowed domain). If path-level blocking is supported: block page triggers on matching path change.

#### CS-11: SPA — block page removal on session end
- **Precondition**: Active session, block page shown on a SPA.
- **Steps**: End the focus session.
- **Expected**: Block page overlay removed. Original SPA content becomes visible and interactive. SPA state not corrupted. No page reload required.

### 3.4 Iframes and Nested Contexts

#### CS-12: Blocked site loaded in iframe on allowed page
- **Precondition**: `youtube.com` blocked. Page at `example.com` contains `<iframe src="https://youtube.com">`.
- **Steps**: Navigate to `example.com`.
- **Expected**: Main page loads normally. Iframe content blocked (DNR handles this at network level). Iframe shows error or blocked placeholder. Main page functionality not affected.

#### CS-13: Content script in iframe — no duplicate injection
- **Steps**: Navigate to a page with multiple iframes.
- **Expected**: Content script runs only in appropriate frames (per `manifest.json` `all_frames` setting). No duplicate block overlays. No duplicate time tracking.

### 3.5 Extension Interaction

#### CS-14: Coexistence with other extensions' content scripts
- **Precondition**: Another extension (e.g., uBlock Origin) also injects content scripts.
- **Steps**: Navigate to a blocked site.
- **Expected**: Both extensions' content scripts function independently. No CSS conflicts (shadow DOM isolation). No JS namespace collisions. Both extensions' UIs render correctly.

#### CS-15: Content script message port disconnection
- **Steps**:
  1. Content script establishes connection to SW.
  2. SW terminates (idle timeout).
  3. Content script attempts to send message.
- **Expected**: `runtime.sendMessage` call fails with disconnect error. Content script catches error gracefully. Content script retries or queues message. No unhandled promise rejection.

---

## 4. Storage Runtime Tests

15 test scenarios covering CRUD, persistence, quota, corruption, concurrency, and session storage.

### 4.1 CRUD Operations

#### ST-01: Write and read — session data
- **Steps**:
  ```js
  await chrome.storage.local.set({currentSession: {start: Date.now(), duration: 1500, type: 'pomodoro'}});
  const result = await chrome.storage.local.get('currentSession');
  ```
- **Expected**: Written data matches read data exactly. Timestamp precision maintained. No type coercion issues.

#### ST-02: Write and read — blocklist array
- **Steps**:
  ```js
  await chrome.storage.local.set({blocklist: ['reddit.com', 'youtube.com', 'twitter.com']});
  const result = await chrome.storage.local.get('blocklist');
  ```
- **Expected**: Array stored and retrieved with identical order and values. No deduplication unless explicitly coded.

#### ST-03: Update — modify existing key
- **Steps**:
  1. Write `{focusScore: 50}`.
  2. Update to `{focusScore: 75}`.
  3. Read back.
- **Expected**: Value is 75. No leftover data from previous value. `storage.onChanged` fires with `{focusScore: {oldValue: 50, newValue: 75}}`.

#### ST-04: Delete — remove key
- **Steps**:
  ```js
  await chrome.storage.local.remove('currentSession');
  const result = await chrome.storage.local.get('currentSession');
  ```
- **Expected**: `result.currentSession` is `undefined`. Key completely removed. Storage size decreased.

#### ST-05: Bulk write — multiple keys atomically
- **Steps**:
  ```js
  await chrome.storage.local.set({
    focusScore: 85,
    streak: 7,
    totalSessions: 42,
    lastSessionDate: '2026-02-10'
  });
  ```
- **Expected**: All four keys written. If any fails, behavior documented (Chrome storage.set is not transactional, but all-or-nothing in practice for non-quota-exceeding writes).

### 4.2 Persistence

#### ST-06: Persistence across browser restart
- **Steps**:
  1. Write test data to `chrome.storage.local`.
  2. Quit Chrome completely.
  3. Relaunch Chrome.
  4. Read test data.
- **Expected**: All `chrome.storage.local` data intact. All `chrome.storage.sync` data intact. `chrome.storage.session` data lost (expected — session storage does not persist).

#### ST-07: Persistence across extension update
- **Steps**:
  1. Write test data.
  2. Update extension (increment version in manifest, click Update).
  3. Read test data.
- **Expected**: `chrome.storage.local` and `chrome.storage.sync` data preserved. Service worker restarts but storage intact. `onInstalled` with `reason: "update"` fires, migration runs if needed.

#### ST-08: chrome.storage.session — ephemeral behavior
- **Steps**:
  1. Write to `chrome.storage.session`: `{tempTimer: 1500}`.
  2. Verify it reads back correctly.
  3. Restart browser.
  4. Attempt to read.
- **Expected**: Data available before restart. Data gone after restart. SW termination does NOT clear session storage (only browser restart does). Confirm session storage survives SW idle termination.

### 4.3 Quota Management

#### ST-09: Approaching storage quota — 8MB written
- **Steps**:
  1. Calculate current storage usage: `chrome.storage.local.getBytesInUse()`.
  2. Write large data blobs to approach 8MB of 10MB quota.
  3. Write additional 1MB.
- **Expected**: Write succeeds (still under 10MB). Extension monitors usage and triggers cleanup if threshold exceeded (e.g., prune oldest daily stats). `getBytesInUse` reflects accurate count.

#### ST-10: Storage quota exhaustion — write at limit
- **Steps**:
  1. Fill storage to ~9.9MB.
  2. Attempt to write 200KB more.
- **Expected**: `chrome.runtime.lastError` set with quota error. Write fails gracefully. Extension logs error. Fallback: prune old data, retry write. Critical data (active session, nuclear mode) prioritized.

### 4.4 Data Integrity

#### ST-11: Corrupted data recovery — malformed JSON in storage
- **Steps**:
  1. Manually set a storage key to invalid data via DevTools:
     ```js
     chrome.storage.local.set({blocklist: "not-an-array"});
     ```
  2. Open popup (triggers storage read).
- **Expected**: Extension detects type mismatch. Resets key to default value. Logs corruption event. UI renders with default state, not crash. User data loss minimized (only corrupted key reset).

#### ST-12: Corrupted data recovery — missing expected keys
- **Steps**:
  1. Remove a required key: `chrome.storage.local.remove('focusScore')`.
  2. Open popup.
- **Expected**: Extension detects missing key. Initializes to default value (e.g., `focusScore: 0`). No `undefined` errors in UI. Defensive coding prevents cascade failures.

### 4.5 Concurrency

#### ST-13: Concurrent writes from popup and service worker
- **Steps**:
  1. From popup: `chrome.storage.local.set({counter: 1})`.
  2. Simultaneously from SW: `chrome.storage.local.set({counter: 2})`.
- **Expected**: One write wins (last-write-wins). No data corruption. `storage.onChanged` fires for each write. If read-modify-write pattern is needed, extension uses locking mechanism or atomic update pattern.

#### ST-14: Rapid sequential writes — 100 writes in 1 second
- **Steps**:
  ```js
  for (let i = 0; i < 100; i++) {
    chrome.storage.local.set({rapidTest: i});
  }
  ```
- **Expected**: Final value is 99. No writes lost. No `QUOTA_BYTES_PER_ITEM` errors. Performance acceptable (all complete within 2 seconds).

#### ST-15: Read during write — eventual consistency
- **Steps**:
  1. Initiate a write: `chrome.storage.local.set({bigData: largeObject})`.
  2. Immediately read: `chrome.storage.local.get('bigData')`.
- **Expected**: Read returns either old value or new value (not partial). Chrome storage operations are serialized per-key, so the read queues behind the write. Verify with callback timing.

---

## 5. Edge Case Runtime Tests

25 test scenarios covering network, lifecycle, system, and boundary conditions.

### 5.1 Network Conditions

#### EC-01: Network disconnection during Pro license verification
- **Steps**:
  1. Enable Pro license.
  2. Disable network (airplane mode or DevTools Network offline).
  3. Trigger license re-verification (e.g., daily check alarm).
- **Expected**: Verification request fails/times out. Extension uses cached license status. User retains Pro features for grace period (document duration: 7 days recommended). Retry scheduled. No hard lock-out.

#### EC-02: Network reconnection after failed verification
- **Steps**:
  1. Complete EC-01 (offline verification fail).
  2. Re-enable network.
  3. Wait for retry or trigger manual refresh.
- **Expected**: Verification succeeds. License status updated in storage. Pro features confirmed. Grace period timer reset.

#### EC-03: Slow network during license check
- **Steps**: Throttle network to 2G via DevTools. Trigger license check.
- **Expected**: Request has timeout (e.g., 10 seconds). On timeout: treat as network error, use cache. No UI hang or spinner freeze.

### 5.2 Tab and Window Lifecycle

#### EC-04: Tab closed mid-focus-session
- **Steps**:
  1. Start focus session.
  2. Navigate blocked site in tab (block page shows).
  3. Close that tab.
- **Expected**: Session continues unaffected. Distraction counter already incremented on navigation. No orphaned content script state. Other tabs' blocking unaffected.

#### EC-05: All tabs closed (browser stays running on macOS)
- **Steps**:
  1. Start focus session.
  2. Close all browser windows (macOS keeps Chrome process alive).
  3. Open new window.
  4. Open popup.
- **Expected**: Session still active. Timer accurate. SW may have terminated but recovers on popup open. Blocking rules active (DNR persists).

#### EC-06: Multiple windows with separate sessions
- **Steps**:
  1. Open Window A, start focus session.
  2. Open Window B.
  3. Navigate to blocked site in Window B.
- **Expected**: Block page shows in Window B (session is global, not per-window). Single session state across all windows. Popup in either window shows same state.

#### EC-07: Multiple Chrome profiles
- **Steps**:
  1. Install extension in Profile A and Profile B.
  2. Start session in Profile A.
  3. Check Profile B.
- **Expected**: Sessions are completely independent per profile. `chrome.storage.local` is isolated per profile. Blocking rules isolated per profile. No cross-profile interference.

#### EC-08: Incognito mode behavior
- **Precondition**: Extension allowed in incognito (user must enable in `chrome://extensions`).
- **Steps**:
  1. Start focus session in normal window.
  2. Open incognito window.
  3. Navigate to blocked site in incognito.
- **Expected**: Behavior depends on `incognito` manifest setting. If `"spanning"` (default): same service worker, same blocking rules apply, blocked site is blocked in incognito. If `"split"`: separate instance, independent state. Document which mode is used.

### 5.3 Browser and System Events

#### EC-09: Browser restart during active focus session
- **Steps**:
  1. Start 25-minute focus session.
  2. After 10 minutes, close Chrome completely.
  3. Relaunch Chrome.
- **Expected**: Session state recovered from storage. Timer recalculated: `remainingTime = duration - (now - startTime)`. If session expired during shutdown, post-session summary generated. Blocking re-engaged if session still active.

#### EC-10: Extension update during nuclear mode
- **Steps**:
  1. Activate nuclear mode (1 hour).
  2. Trigger extension update.
- **Expected**: Nuclear mode survives update. Nuclear end timestamp persisted in storage. On update restart: SW reads nuclear state, re-applies DNR rules, resumes nuclear countdown. User cannot escape nuclear via extension update.

#### EC-11: System sleep/wake with active timer
- **Steps**:
  1. Start 25-minute session.
  2. After 5 minutes, put system to sleep.
  3. Wake after 10 minutes.
- **Expected**: Timer recalculates based on wall clock time (not elapsed SW ticks). Remaining time = 25 - 15 = 10 minutes. If session expired during sleep, handle as completed. Alarms fire on wake if past due.

#### EC-12: System sleep/wake — alarm during sleep
- **Steps**:
  1. Start 5-minute session.
  2. Put system to sleep for 10 minutes.
  3. Wake system.
- **Expected**: `chrome.alarms.onAlarm` fires immediately on wake (Chrome queues overdue alarms). Session marked complete. Stats recorded. Notification shown (if awake to see it).

#### EC-13: Timezone change during active session
- **Steps**:
  1. Start session.
  2. Change system timezone (e.g., UTC-5 to UTC+3).
- **Expected**: Timer unaffected (uses monotonic time or UTC timestamps, not local time). Session duration correct. Daily stats boundary might shift — document how midnight rollover is determined (UTC or local).

#### EC-14: Midnight rollover during active session
- **Steps**:
  1. Start 25-minute session at 23:50 local time.
  2. Session spans midnight.
- **Expected**: Session counted for the day it started (or split — document decision). Streak logic handles correctly (session at 23:50 on Feb 9 counts toward Feb 9). Daily stats do not double-count.

### 5.4 Scale and Stress

#### EC-15: 100+ open tabs
- **Steps**:
  1. Open 100 tabs (mix of blocked and non-blocked sites).
  2. Start focus session.
- **Expected**: All blocked tabs show block page. Non-blocked tabs unaffected. SW does not run out of memory. Message handling remains responsive. No visible lag in popup.

#### EC-16: 100+ open tabs — distraction storm
- **Steps**:
  1. With 100 tabs open, 50 are blocked sites.
  2. All 50 send distraction events on session start.
- **Expected**: All 50 events processed. Counter incremented by 50. No message queue overflow. Storage writes batched or serialized correctly.

#### EC-17: Rapid user interactions — button mashing
- **Steps**: Click "Start Focus" 20 times in 2 seconds.
- **Expected**: Only one session starts. Button debounced or disabled after first click. No duplicate alarms created. No duplicate storage entries. UI stays consistent.

#### EC-18: Rapid tab switching during session
- **Steps**: Switch between 10 tabs rapidly (Ctrl+Tab) for 30 seconds.
- **Expected**: Time tracking remains accurate per-tab. No content script errors. Block pages render correctly on each blocked tab visit. No flickering or partial renders.

#### EC-19: Extension icon clicked during service worker restart
- **Steps**:
  1. SW is terminated (idle).
  2. Quickly click extension icon.
- **Expected**: Popup opens (may show loading state briefly). SW starts in background. Popup queries SW once ready. Data populates within 500ms. No "Could not establish connection" error.

### 5.5 Data Boundary Conditions

#### EC-20: Storage quota exhaustion during active session
- **Steps**:
  1. Fill storage to near-quota.
  2. Start session (which needs to write session data).
- **Expected**: If write fails: user warned, session still functions (in-memory). Critical session data prioritized. Old stats pruned to make room. Session not silently lost.

#### EC-21: Focus Score boundary — 0
- **Steps**: Engineer scenario where Focus Score reaches 0.
- **Expected**: Score displays as 0, not negative. UI handles gracefully. Recovery possible through next session. No division-by-zero in score calculation.

#### EC-22: Focus Score boundary — 100
- **Steps**: Achieve perfect score.
- **Expected**: Score displays as 100, not higher. Perfect streak acknowledged. Score remains 100 until a distraction event reduces it.

#### EC-23: Streak boundary — reset after missed day
- **Steps**:
  1. Build a 5-day streak.
  2. Skip 1 day (advance system clock or wait).
  3. Open popup.
- **Expected**: Streak resets to 0. Previous streak stored in "best streak" record. UI updates to show broken streak. Motivational message may appear.

#### EC-24: Very long session — 8 hours continuous
- **Steps**: Start an 8-hour custom session (or nuclear 24hr) and monitor.
- **Expected**: Timer counts down accurately over full duration. Memory usage stable (no leaks). Storage writes periodic (not every second). SW terminates and recovers correctly throughout.

#### EC-25: Extension disabled and re-enabled during session
- **Steps**:
  1. Start focus session.
  2. Disable extension on `chrome://extensions`.
  3. Re-enable extension.
- **Expected**: Session state in storage survives disable (storage persists). On re-enable: `onInstalled` may not fire (document behavior). SW starts fresh. Extension reads storage, detects active session, resumes or marks as interrupted.

---

## 6. Performance Runtime Tests

10 test scenarios with specific measurement methodology for each.

### General Measurement Setup

All performance tests use the following instrumentation:

```js
// Inject into relevant context before test
const perfLog = [];
const mark = (label) => {
  perfLog.push({label, time: performance.now(), memory: performance.memory?.usedJSHeapSize});
};
```

For memory profiling, use Chrome DevTools > Memory tab > Heap Snapshot and Timeline recording.

### PERF-01: Popup open time — cold (SW not running)

- **Methodology**:
  1. Ensure SW is terminated (wait 5 min or force-stop).
  2. Instrument popup HTML with `performance.now()` at:
     - `<head>` script start
     - `DOMContentLoaded`
     - First data render (after storage read callback)
     - All UI elements painted (`requestAnimationFrame` after last DOM update)
  3. Click toolbar icon and record timestamps.
- **Measurements**:
  - Time to `DOMContentLoaded`: target < 100ms
  - Time to first data render: target < 300ms
  - Time to fully interactive: target < 500ms
- **Repeat**: 5 times, report median.

### PERF-02: Popup open time — warm (SW running)

- **Methodology**: Same as PERF-01 but with SW already running.
- **Measurements**:
  - Time to `DOMContentLoaded`: target < 50ms
  - Time to first data render: target < 150ms
  - Time to fully interactive: target < 250ms
- **Repeat**: 5 times, report median.

### PERF-03: Service worker cold start time

- **Methodology**:
  1. Add `performance.now()` logging at top of SW script.
  2. Log timestamp when `onInstalled` or first `onMessage` fires.
  3. Terminate SW via `chrome://serviceworker-internals`.
  4. Trigger SW start (open popup).
  5. Calculate delta between SW script start and first message handled.
- **Measurements**:
  - SW script evaluation time: target < 100ms
  - Time to first message response: target < 200ms
- **Repeat**: 5 times, report median.

### PERF-04: Memory usage profiling — idle state

- **Methodology**:
  1. Load extension, open popup once, close it.
  2. Wait 30 seconds for GC.
  3. Take heap snapshot of SW context via DevTools.
  4. Record `performance.memory.usedJSHeapSize` in popup on open.
- **Measurements**:
  - SW heap size (idle): target < 5MB
  - Popup heap size (idle): target < 10MB
  - Total extension memory (via Chrome Task Manager): target < 30MB
- **Baseline**: Record on fresh install. Compare after 1 week simulated usage.

### PERF-05: Memory usage profiling — active session with 50 blocked tabs

- **Methodology**:
  1. Start focus session.
  2. Open 50 tabs to blocked sites (block pages render).
  3. Take heap snapshots of SW and 3 sample content script contexts.
  4. Monitor Chrome Task Manager for total extension memory.
- **Measurements**:
  - SW heap size: target < 10MB
  - Per-content-script memory: target < 2MB
  - Total extension memory: target < 100MB (with 50 content scripts)
- **Watch for**: Memory growing linearly with tab count (leak indicator).

### PERF-06: CPU usage — idle with active session

- **Methodology**:
  1. Start focus session with no blocked tabs open.
  2. Open Chrome Task Manager (Shift+Esc).
  3. Monitor extension CPU column for 60 seconds.
  4. Also record via DevTools Performance tab (60-second recording).
- **Measurements**:
  - CPU usage during idle: target < 0.5%
  - CPU spikes: none expected (timer should use alarms, not setInterval)
- **Failure criteria**: Sustained CPU > 1% indicates a polling loop or timer leak.

### PERF-07: Block page render time

- **Methodology**:
  1. Instrument content script with timing:
     ```js
     mark('cs-inject-start');
     // ... content script initialization
     mark('cs-dom-created');
     // ... DOM elements created and appended
     mark('cs-styles-applied');
     // ... CSS loaded
     mark('cs-fully-rendered');
     ```
  2. Navigate to blocked site 10 times, collect timings.
- **Measurements**:
  - Content script injection to DOM ready: target < 50ms
  - DOM ready to fully rendered: target < 100ms
  - Total time to block page visible: target < 150ms
- **Repeat**: 10 navigations, report median and p95.

### PERF-08: Storage operation timing

- **Methodology**:
  ```js
  const ops = ['get', 'set', 'remove', 'getBytesInUse'];
  for (const op of ops) {
    const start = performance.now();
    // Execute operation
    const end = performance.now();
    perfLog.push({op, duration: end - start});
  }
  ```
  Test with storage at 10%, 50%, and 90% capacity.
- **Measurements**:
  - `get` single key: target < 5ms
  - `set` single key: target < 10ms
  - `get` all keys: target < 50ms at 50% capacity
  - `getBytesInUse`: target < 5ms
- **Repeat**: 20 iterations per operation, report median and p95.

### PERF-09: Impact on page load time — non-blocked sites

- **Methodology**:
  1. Measure baseline page load time for 5 popular sites (without extension).
  2. Enable extension with active session.
  3. Measure page load time for same 5 sites (non-blocked).
  4. Compare delta.
  5. Use `performance.timing` or `PerformanceNavigationTiming` API.
- **Measurements**:
  - Added latency per page load: target < 20ms
  - Added DOMContentLoaded delay: target < 10ms
- **Sites to test**: google.com, github.com, stackoverflow.com, en.wikipedia.org, docs.google.com

### PERF-10: DNR rule update time — bulk blocklist change

- **Methodology**:
  1. Start with empty blocklist.
  2. Time the addition of 100 sites at once:
     ```js
     const start = performance.now();
     await chrome.declarativeNetRequest.updateDynamicRules({
       addRules: generate100Rules(),
       removeRuleIds: []
     });
     const end = performance.now();
     ```
  3. Repeat with removing 100 rules.
  4. Repeat with updating (remove + add) 100 rules.
- **Measurements**:
  - Add 100 rules: target < 500ms
  - Remove 100 rules: target < 200ms
  - Update 100 rules: target < 700ms
- **Repeat**: 5 times, report median.

---

## 7. Error Documentation Template

Use this template for every runtime error discovered during testing.

---

### Error Report: [ERR-XXX]

**Test Scenario**: [Test ID, e.g., POP-17]
**Date Discovered**: YYYY-MM-DD
**Severity**: Critical / High / Medium / Low
**Status**: Open / In Progress / Fixed / Won't Fix

#### Environment

| Field | Value |
|---|---|
| Chrome Version | e.g., 120.0.6099.109 |
| OS | e.g., macOS 14.2 |
| Extension Version | e.g., 1.0.0 |
| Profile | Default / Incognito / Guest |
| Other Extensions | List any enabled |

#### Description

Brief description of the error and its user-visible impact.

#### Steps to Reproduce

1. Step one
2. Step two
3. Step three

**Reproduction rate**: X/10 attempts

#### Expected Behavior

What should happen.

#### Actual Behavior

What actually happens.

#### Error Output

```
// Console errors, stack traces, or chrome.runtime.lastError
Paste exact error text here
```

#### Screenshots / Recordings

- [ ] Screenshot attached
- [ ] Screen recording attached
- [ ] DevTools Network tab screenshot (if relevant)
- [ ] DevTools Memory snapshot (if relevant)

#### Context Inspection

```json
// Relevant storage state at time of error
{
  "key": "value"
}
```

```json
// Relevant chrome.alarms state
[]
```

```json
// Relevant DNR rules state
[]
```

#### Impact Assessment

- **User impact**: Description of what the user experiences
- **Data impact**: Any data loss or corruption
- **Frequency**: How often this occurs in real usage
- **Workaround**: Any temporary workaround available

#### Root Cause Analysis

Preliminary analysis of why this error occurs. Reference specific code files and line numbers.

#### Suggested Fix

Proposed solution with code snippets if applicable.

#### Related Issues

- Links to related error reports
- Links to relevant test scenarios

---

### Error Severity Definitions

| Severity | Definition | Examples |
|---|---|---|
| **Critical** | Extension crashes, data loss, blocking completely fails, security vulnerability | SW crashes and cannot restart; nuclear mode escapable; storage wiped |
| **High** | Major feature broken, significant UX degradation, data inconsistency | Timer shows wrong time; Focus Score calculates incorrectly; block page fails to render |
| **Medium** | Minor feature broken, cosmetic issues with functional workaround | Stats chart renders incorrectly; ambient sound glitch; animation stutter |
| **Low** | Cosmetic only, no functional impact, edge case with minimal user exposure | Wrong icon shade; tooltip text truncated; console warning (not error) |

### Error Triage Process

1. **Capture**: Document error using template above immediately upon discovery.
2. **Classify**: Assign severity based on definitions.
3. **Deduplicate**: Check if error is a duplicate or variant of an existing report.
4. **Assign**: Route to appropriate developer or module owner.
5. **Verify fix**: After fix deployed, re-run the originating test scenario plus 3 related scenarios.
6. **Regression**: Add the scenario to the regression test suite.

---

## Appendix A: Test Execution Checklist

### Pre-Test Setup

- [ ] Chrome updated to target version
- [ ] Extension loaded unpacked, no errors on `chrome://extensions`
- [ ] Service worker status: "active" or "stopped" (not "error")
- [ ] DevTools open for target context (popup / SW / content script)
- [ ] Console error capture script injected (see General Prerequisites)
- [ ] Screen recorder running (for visual bug capture)
- [ ] Chrome Task Manager open (Shift+Esc) for resource monitoring

### Post-Test Teardown

- [ ] Console errors exported and attached to test result
- [ ] Performance measurements recorded in spreadsheet
- [ ] Storage state snapshot taken (if test modified storage)
- [ ] Any new errors documented using Error Template
- [ ] Test result logged: PASS / FAIL / BLOCKED / SKIPPED

### Test Execution Order (Recommended)

1. Storage tests (ST-01 through ST-15) — establish storage reliability first
2. Service worker tests (SW-01 through SW-20) — validate core engine
3. Content script tests (CS-01 through CS-15) — validate user-facing blocking
4. Popup tests (POP-01 through POP-30) — validate UI layer
5. Performance tests (PERF-01 through PERF-10) — baseline measurements
6. Edge case tests (EC-01 through EC-25) — stress and boundary testing

---

## Appendix B: Quick Reference — Test IDs by Component

| Component | Test IDs | Count |
|---|---|---|
| Popup | POP-01 through POP-30 | 30 |
| Service Worker | SW-01 through SW-20 | 20 |
| Content Script | CS-01 through CS-15 | 15 |
| Storage | ST-01 through ST-15 | 15 |
| Edge Cases | EC-01 through EC-25 | 25 |
| Performance | PERF-01 through PERF-10 | 10 |
| **Total** | | **115** |
