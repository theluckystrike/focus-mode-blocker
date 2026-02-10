# Focus Mode - Blocker — Final Validation and QA Report Specification

**Document Version:** 1.0
**Extension:** Focus Mode - Blocker (MV3 Chrome Extension)
**Date:** 2026-02-10
**QA Lead Sign-off:** ____________________

---

## Table of Contents

1. [Clean Build Checklist](#1-clean-build-checklist)
2. [Full Regression Test Checklist](#2-full-regression-test-checklist)
3. [Cross-Platform Test Matrix](#3-cross-platform-test-matrix)
4. [Performance Validation Report Template](#4-performance-validation-report-template)
5. [Security Review Checklist](#5-security-review-checklist)
6. [Chrome Web Store Submission Checklist](#6-chrome-web-store-submission-checklist)
7. [QA Report Template](#7-qa-report-template)
8. [Post-Submission Monitoring Plan](#8-post-submission-monitoring-plan)
9. [Debug Checklist for Future Releases](#9-debug-checklist-for-future-releases)

---

## 1. Clean Build Checklist

Production readiness verification. Every item must pass before the build is submitted.

| #  | Item | Status | Verified By | Notes |
|----|------|--------|-------------|-------|
| 1  | No `console.log` statements remain (except dedicated error logger utility) | [ ] PASS / [ ] FAIL | | grep for `console.log`, `console.debug`, `console.info`, `console.warn` outside error-logger module |
| 2  | No `debugger` statements in any source file | [ ] PASS / [ ] FAIL | | grep all `.js` and `.ts` files for `debugger` |
| 3  | No `TODO`, `FIXME`, `HACK`, or `XXX` comments remain | [ ] PASS / [ ] FAIL | | grep all source files; document any intentional exceptions |
| 4  | No commented-out code blocks (> 2 lines) | [ ] PASS / [ ] FAIL | | manual review of all source files |
| 5  | No test-only files included in the build output | [ ] PASS / [ ] FAIL | | verify no `*.test.js`, `*.spec.js`, `__tests__/`, `__mocks__/` in dist/ |
| 6  | `DEBUG` flag / development mode set to `false` | [ ] PASS / [ ] FAIL | | check config constants, feature flags, and environment variables |
| 7  | Version number in `manifest.json` is correct and incremented | [ ] PASS / [ ] FAIL | | must match release version; format `X.Y.Z` |
| 8  | All file paths in `manifest.json` resolve to real files in dist/ | [ ] PASS / [ ] FAIL | | verify `background.service_worker`, `content_scripts`, `action.default_popup`, `options_page`, `icons` |
| 9  | Build output is minified and tree-shaken | [ ] PASS / [ ] FAIL | | confirm bundler optimization flags are enabled |
| 10 | Source maps are excluded from the production build directory | [ ] PASS / [ ] FAIL | | no `.map` files in dist/; verify bundler config `devtool: false` |
| 11 | No hardcoded API keys, secrets, or test credentials in source | [ ] PASS / [ ] FAIL | | grep for common patterns: `sk-`, `api_key`, `password`, `secret` |
| 12 | All third-party dependencies are pinned and audited | [ ] PASS / [ ] FAIL | | run `npm audit`; no critical or high vulnerabilities |
| 13 | `manifest.json` permissions list contains only required permissions | [ ] PASS / [ ] FAIL | | no development-only permissions remain |
| 14 | Bundle total size is under 500KB target | [ ] PASS / [ ] FAIL | | measure uncompressed dist/ directory size |
| 15 | Extension loads in Chrome without errors or warnings on `chrome://extensions` | [ ] PASS / [ ] FAIL | | enable developer mode; check for manifest warnings, service worker registration errors |

**Build Checklist Result:** _____ / 15 PASS

**Sign-off:** __________________________ Date: __________

---

## 2. Full Regression Test Checklist

Complete regression coverage organized by component. Execute every item before each release.

### 2.1 Popup UI (15 items)

| #  | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| P-01 | Popup opens within performance target | Click extension icon; measure time | Popup renders fully in < 100ms | [ ] PASS / [ ] FAIL |
| P-02 | Popup dimensions are correct | Open popup; inspect dimensions | 380px wide x 500px tall; no scrollbar on default view | [ ] PASS / [ ] FAIL |
| P-03 | Focus timer displays and counts down | Start a focus session; observe timer | Timer displays MM:SS format; counts down each second accurately | [ ] PASS / [ ] FAIL |
| P-04 | Quick-block input works | Type a domain in the quick-block field and submit | Domain is added to blocklist; confirmation shown | [ ] PASS / [ ] FAIL |
| P-05 | Blocklist displays all blocked sites | Add 5+ sites; open popup | All blocked sites listed with remove buttons | [ ] PASS / [ ] FAIL |
| P-06 | Remove site from blocklist | Click remove/X on a blocked site | Site removed; list updates immediately | [ ] PASS / [ ] FAIL |
| P-07 | Focus session start/stop | Start session; then stop before timer ends | Session starts blocking; stop ends blocking and logs partial session | [ ] PASS / [ ] FAIL |
| P-08 | Streak counter displays correctly | Complete 1+ focus sessions; reopen popup | Streak count reflects completed sessions | [ ] PASS / [ ] FAIL |
| P-09 | Statistics/productivity view renders | Navigate to stats panel/tab | Charts/stats load with accurate data | [ ] PASS / [ ] FAIL |
| P-10 | Pro upgrade prompt displays for free users | Access a Pro-only feature as free user | Paywall/upgrade prompt shown with pricing ($4.99/mo) | [ ] PASS / [ ] FAIL |
| P-11 | Pro badge displays for subscribed users | Log in as Pro user; open popup | Pro badge/indicator visible; all features unlocked | [ ] PASS / [ ] FAIL |
| P-12 | Dark mode / theme toggle | Toggle theme setting | UI switches themes without flicker; persists on reopen | [ ] PASS / [ ] FAIL |
| P-13 | Settings gear navigates to options page | Click settings/gear icon | Options page opens in new tab | [ ] PASS / [ ] FAIL |
| P-14 | Popup state persists across close/reopen | Start session; close popup; reopen | Timer continues; state is accurate | [ ] PASS / [ ] FAIL |
| P-15 | Empty state renders correctly | Fresh install; open popup | Onboarding or empty state with clear CTA to add first blocked site | [ ] PASS / [ ] FAIL |

### 2.2 Service Worker (10 items)

| #  | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| SW-01 | Service worker registers without errors | Load extension; check `chrome://extensions` | No registration errors; status "active" | [ ] PASS / [ ] FAIL |
| SW-02 | Service worker survives idle termination | Wait 5+ minutes idle; trigger action | Worker restarts; state restored from storage; no user-visible error | [ ] PASS / [ ] FAIL |
| SW-03 | Alarm-based timer continues after SW restart | Start focus session; force-kill SW; wait for alarm | Timer alarm fires; blocking state correct | [ ] PASS / [ ] FAIL |
| SW-04 | Web request blocking activates during focus session | Start session with sites in blocklist; navigate to blocked site | Request intercepted; user redirected to block page | [ ] PASS / [ ] FAIL |
| SW-05 | Web request blocking deactivates after session ends | End focus session; navigate to previously blocked site | Site loads normally | [ ] PASS / [ ] FAIL |
| SW-06 | Badge text updates with timer | Start focus session; observe extension badge | Badge shows remaining time or active indicator | [ ] PASS / [ ] FAIL |
| SW-07 | Message passing between popup and SW | Open popup; perform actions requiring SW communication | All messages sent/received; no `chrome.runtime.lastError` | [ ] PASS / [ ] FAIL |
| SW-08 | Message passing between content script and SW | Navigate to blocked site during session | Content script communicates with SW; block page rendered | [ ] PASS / [ ] FAIL |
| SW-09 | Install/update event handlers work | Simulate `chrome.runtime.onInstalled` | Default settings initialized; migration runs on update | [ ] PASS / [ ] FAIL |
| SW-10 | Error handling and recovery | Trigger known error conditions (invalid storage, network failure) | Errors caught; logged via error logger; graceful degradation | [ ] PASS / [ ] FAIL |

### 2.3 Content Scripts / Block Page (10 items)

| #  | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| CS-01 | Content script injects on matching URLs | Navigate to a blocked site during focus session | Content script injects within < 50ms | [ ] PASS / [ ] FAIL |
| CS-02 | Block page overlay renders correctly | Navigate to blocked site during session | Full-page block overlay with motivational message and timer | [ ] PASS / [ ] FAIL |
| CS-03 | Block page does not inject on non-blocked sites | Navigate to an allowed site during session | No content script interference; page loads normally | [ ] PASS / [ ] FAIL |
| CS-04 | Block page does not inject outside focus session | Navigate to a blocked site when no session active | Page loads normally | [ ] PASS / [ ] FAIL |
| CS-05 | Block page "go back" button works | Click go-back/return on block page | User navigated away from blocked site | [ ] PASS / [ ] FAIL |
| CS-06 | Block page displays remaining session time | Observe block page during active session | Timer countdown visible and accurate | [ ] PASS / [ ] FAIL |
| CS-07 | Content script handles SPA navigation | Navigate within a SPA that changes URL to blocked path | Block triggers on URL change via History API | [ ] PASS / [ ] FAIL |
| CS-08 | Content script cleanup on navigation away | Navigate from blocked to allowed site | Block overlay removed; no DOM artifacts remain | [ ] PASS / [ ] FAIL |
| CS-09 | Content script does not break host page functionality | Visit blocked site outside session; interact with page | All page functionality intact; no console errors from extension | [ ] PASS / [ ] FAIL |
| CS-10 | Multiple content scripts do not conflict | Test pages where multiple content scripts match | No duplicate overlays; no JS errors | [ ] PASS / [ ] FAIL |

### 2.4 Storage Operations (8 items)

| #  | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| ST-01 | Blocklist persists across browser restart | Add sites; restart Chrome; reopen popup | Blocklist intact | [ ] PASS / [ ] FAIL |
| ST-02 | Settings persist across browser restart | Change settings; restart Chrome; check options | Settings intact | [ ] PASS / [ ] FAIL |
| ST-03 | Session data persists after SW termination | Start session; wait for SW kill; recheck | Session state restored from `chrome.storage` | [ ] PASS / [ ] FAIL |
| ST-04 | Storage quota not exceeded under normal use | Add maximum expected data (100+ sites, 365 days stats) | No `QUOTA_BYTES_PER_ITEM` or total quota errors | [ ] PASS / [ ] FAIL |
| ST-05 | Storage migration on version update | Simulate update from previous version with old schema | Data migrated to new schema without loss | [ ] PASS / [ ] FAIL |
| ST-06 | Concurrent storage writes do not corrupt data | Trigger rapid writes from popup + service worker simultaneously | Data consistent; no race conditions | [ ] PASS / [ ] FAIL |
| ST-07 | chrome.storage.sync works across devices | Sign into Chrome on two devices; modify settings | Settings sync within expected timeframe | [ ] PASS / [ ] FAIL |
| ST-08 | Storage error handling | Simulate storage write failure (quota exceeded) | Error caught; user notified; no crash | [ ] PASS / [ ] FAIL |

### 2.5 Timer / Nuclear Mode (8 items)

| #  | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| TM-01 | Timer counts down accurately | Start 25-min session; compare to system clock after 5 min | Drift < 2 seconds over 5 minutes | [ ] PASS / [ ] FAIL |
| TM-02 | Timer completes and notifies | Start short session (1 min); wait | Notification fires; session logged; blocking deactivates | [ ] PASS / [ ] FAIL |
| TM-03 | Timer survives popup close | Start session; close popup; wait for completion | Timer completes via service worker alarm; notification fires | [ ] PASS / [ ] FAIL |
| TM-04 | Nuclear mode prevents session cancellation | Enable nuclear mode; start session; attempt to stop | Stop/cancel disabled; session cannot be ended early | [ ] PASS / [ ] FAIL |
| TM-05 | Nuclear mode prevents blocklist modification | Enable nuclear mode; start session; attempt to remove site | Blocklist modification blocked during nuclear session | [ ] PASS / [ ] FAIL |
| TM-06 | Nuclear mode timer shows correct remaining time | Enable nuclear mode; start session; check popup | Countdown shows accurate remaining time; no cancel option | [ ] PASS / [ ] FAIL |
| TM-07 | Break timer between sessions | Complete a session; verify break timer prompt | Break timer offered; counts down; next session starts after | [ ] PASS / [ ] FAIL |
| TM-08 | Custom timer durations | Set custom duration (e.g., 45 min); start session | Timer uses custom duration; counts down correctly | [ ] PASS / [ ] FAIL |

### 2.6 Paywall / Pro Features (10 items)

| #  | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| PW-01 | Free tier limits enforced | Use free tier; try to exceed limits (e.g., max blocked sites) | Paywall displayed; feature gated | [ ] PASS / [ ] FAIL |
| PW-02 | Pro subscription activates all features | Subscribe to Pro ($4.99/mo); verify feature access | All 51 features accessible; no paywall prompts | [ ] PASS / [ ] FAIL |
| PW-03 | Team subscription per-user pricing | Subscribe to Team ($3.99/user/mo); add team members | Per-user billing correct; team features enabled | [ ] PASS / [ ] FAIL |
| PW-04 | Subscription status persists | Subscribe; restart Chrome; reopen extension | Pro/Team status recognized; no re-authentication needed | [ ] PASS / [ ] FAIL |
| PW-05 | Subscription expiry handling | Simulate expired subscription | Features gracefully downgrade to free tier; data preserved | [ ] PASS / [ ] FAIL |
| PW-06 | Payment flow completes without error | Click upgrade; complete payment flow | Subscription activates; confirmation shown; features unlock | [ ] PASS / [ ] FAIL |
| PW-07 | Restore purchase works | Uninstall/reinstall extension; restore purchase | Previous subscription detected and restored | [ ] PASS / [ ] FAIL |
| PW-08 | Free-to-Pro upgrade mid-session | Start free session; upgrade to Pro mid-session | Pro features activate; current session uninterrupted | [ ] PASS / [ ] FAIL |
| PW-09 | Paywall UI displays correct pricing | Open paywall as free user | Free: $0 / Pro: $4.99/mo / Team: $3.99/user/mo displayed | [ ] PASS / [ ] FAIL |
| PW-10 | Offline subscription validation | Go offline; open extension with active subscription | Cached subscription status used; Pro features remain active | [ ] PASS / [ ] FAIL |

**Total Regression Items: 61**
**Passed:** _____ / 61
**Failed:** _____
**Blocked:** _____

---

## 3. Cross-Platform Test Matrix

Execute all 20 tests on each platform. Mark PASS (P), FAIL (F), or NOT TESTED (NT).

| # | Test Case | Chrome Stable (Mac) | Chrome Stable (Win) | Chrome Beta (Latest) | Chrome (Linux) |
|---|-----------|:-------------------:|:-------------------:|:--------------------:|:--------------:|
| 1 | Extension installs without errors | | | | |
| 2 | Service worker registers and stays active | | | | |
| 3 | Popup opens at correct dimensions (380x500) | | | | |
| 4 | Popup renders within 100ms | | | | |
| 5 | Focus session starts and timer counts down | | | | |
| 6 | Blocked site shows block page | | | | |
| 7 | Block page styling renders correctly | | | | |
| 8 | Nuclear mode locks session | | | | |
| 9 | Timer notification fires on completion | | | | |
| 10 | Statistics/streak data persists | | | | |
| 11 | Options page opens and saves settings | | | | |
| 12 | Dark mode/theme renders correctly | | | | |
| 13 | Offscreen document plays audio | | | | |
| 14 | Content script injection timing < 50ms | | | | |
| 15 | Memory usage idle < 20MB | | | | |
| 16 | Bundle size < 500KB | | | | |
| 17 | Paywall displays and payment flow works | | | | |
| 18 | chrome.storage.sync across profile | | | | |
| 19 | Extension survives Chrome update | | | | |
| 20 | Uninstall is clean (no residual data) | | | | |

**Platform Versions Tested:**

| Platform | Chrome Version | OS Version | Date Tested | Tester |
|----------|---------------|------------|-------------|--------|
| Mac | Chrome ___.___.___.___ | macOS ___.___ | | |
| Windows | Chrome ___.___.___.___ | Windows ___ | | |
| Beta | Chrome ___.___.___.___ | __________ | | |
| Linux | Chrome ___.___.___.___ | __________ | | |

---

## 4. Performance Validation Report Template

Measure each metric under controlled conditions (fresh profile, no other extensions, 3 trials averaged).

| # | Metric | Target | Trial 1 | Trial 2 | Trial 3 | Average | Status | Notes |
|---|--------|--------|---------|---------|---------|---------|--------|-------|
| 1 | Popup open to fully rendered | < 100ms | ms | ms | ms | ms | [ ] PASS / [ ] WARN / [ ] FAIL | |
| 2 | Service worker startup time | < 50ms | ms | ms | ms | ms | [ ] PASS / [ ] WARN / [ ] FAIL | |
| 3 | Content script injection time | < 50ms | ms | ms | ms | ms | [ ] PASS / [ ] WARN / [ ] FAIL | |
| 4 | Memory usage at idle (no active session) | < 20MB | MB | MB | MB | MB | [ ] PASS / [ ] WARN / [ ] FAIL | |
| 5 | Memory usage during active session | < 30MB | MB | MB | MB | MB | [ ] PASS / [ ] WARN / [ ] FAIL | |
| 6 | Memory usage with 100 blocked sites | < 25MB | MB | MB | MB | MB | [ ] PASS / [ ] WARN / [ ] FAIL | |
| 7 | Total bundle size (uncompressed) | < 500KB | KB | KB | KB | KB | [ ] PASS / [ ] WARN / [ ] FAIL | |
| 8 | Total bundle size (compressed/zipped) | < 250KB | KB | KB | KB | KB | [ ] PASS / [ ] WARN / [ ] FAIL | |
| 9 | Storage read latency (blocklist) | < 10ms | ms | ms | ms | ms | [ ] PASS / [ ] WARN / [ ] FAIL | |
| 10 | Storage write latency (single item) | < 20ms | ms | ms | ms | ms | [ ] PASS / [ ] WARN / [ ] FAIL | |
| 11 | Block page render time | < 100ms | ms | ms | ms | ms | [ ] PASS / [ ] WARN / [ ] FAIL | |
| 12 | Timer accuracy drift (over 25 min) | < 2s | s | s | s | s | [ ] PASS / [ ] WARN / [ ] FAIL | |
| 13 | Service worker restart + state restore | < 200ms | ms | ms | ms | ms | [ ] PASS / [ ] WARN / [ ] FAIL | |
| 14 | CPU usage at idle | < 0.5% | % | % | % | % | [ ] PASS / [ ] WARN / [ ] FAIL | |
| 15 | CPU usage during active session | < 2% | % | % | % | % | [ ] PASS / [ ] WARN / [ ] FAIL | |
| 16 | Offscreen audio document memory | < 5MB | MB | MB | MB | MB | [ ] PASS / [ ] WARN / [ ] FAIL | |
| 17 | Number of DOM nodes (popup) | < 500 | | | | | [ ] PASS / [ ] WARN / [ ] FAIL | |
| 18 | Options page load time | < 200ms | ms | ms | ms | ms | [ ] PASS / [ ] WARN / [ ] FAIL | |

**Threshold Definitions:**
- **PASS:** Measured value meets target
- **WARN:** Measured value exceeds target by < 20% (acceptable with documented justification)
- **FAIL:** Measured value exceeds target by >= 20% (must fix before release)

**Test Environment:**
- Hardware: ______________________
- Chrome Version: ______________________
- Other Extensions Loaded: None
- Network: ______________________
- Date: ______________________

---

## 5. Security Review Checklist

Every item must be verified before Chrome Web Store submission.

| # | Category | Security Item | Status | Verified By | Notes |
|---|----------|--------------|--------|-------------|-------|
| 1 | CSP | `content_security_policy` in manifest is strict: no `unsafe-eval`, no `unsafe-inline` | [ ] PASS / [ ] FAIL | | |
| 2 | CSP | No relaxed CSP for extension pages | [ ] PASS / [ ] FAIL | | |
| 3 | Code Injection | No use of `eval()` anywhere in codebase | [ ] PASS / [ ] FAIL | | grep all source files |
| 4 | Code Injection | No use of `new Function()` constructor | [ ] PASS / [ ] FAIL | | |
| 5 | DOM Safety | No use of `innerHTML` (use `textContent` or DOM API) | [ ] PASS / [ ] FAIL | | |
| 6 | DOM Safety | No use of `document.write()` | [ ] PASS / [ ] FAIL | | |
| 7 | DOM Safety | No use of `outerHTML` for content insertion | [ ] PASS / [ ] FAIL | | |
| 8 | Input Validation | All user inputs (domain names, timer values) sanitized | [ ] PASS / [ ] FAIL | | test with XSS payloads, SQL-like strings, unicode edge cases |
| 9 | Input Validation | Domain input validated against URL/hostname regex | [ ] PASS / [ ] FAIL | | |
| 10 | Input Validation | Timer values bounded to valid integer ranges | [ ] PASS / [ ] FAIL | | |
| 11 | Storage Security | Authentication tokens encrypted with AES-256-GCM | [ ] PASS / [ ] FAIL | | verify encryption implementation |
| 12 | Storage Security | Encryption keys not hardcoded in source | [ ] PASS / [ ] FAIL | | |
| 13 | Storage Security | No sensitive data in `chrome.storage.local` unencrypted | [ ] PASS / [ ] FAIL | | |
| 14 | Message Passing | All `chrome.runtime.onMessage` handlers validate sender | [ ] PASS / [ ] FAIL | | check `sender.id` matches extension ID |
| 15 | Message Passing | All messages validated for expected structure/type | [ ] PASS / [ ] FAIL | | no arbitrary message execution |
| 16 | Message Passing | No use of `chrome.runtime.onMessageExternal` unless required | [ ] PASS / [ ] FAIL | | |
| 17 | Network | No external script loading (`<script src="...">`) | [ ] PASS / [ ] FAIL | | |
| 18 | Network | No fetch/XHR to non-allowlisted domains | [ ] PASS / [ ] FAIL | | |
| 19 | Network | HTTPS enforced for all external requests | [ ] PASS / [ ] FAIL | | |
| 20 | Permissions | `permissions` list is minimal (only what is needed) | [ ] PASS / [ ] FAIL | | justify each permission |
| 21 | Permissions | `host_permissions` scoped as narrowly as possible | [ ] PASS / [ ] FAIL | | |
| 22 | Permissions | No `<all_urls>` unless absolutely required and justified | [ ] PASS / [ ] FAIL | | |
| 23 | Dependencies | All npm dependencies audited (`npm audit`) | [ ] PASS / [ ] FAIL | | zero critical/high vulnerabilities |
| 24 | Dependencies | No dependencies with known CVEs | [ ] PASS / [ ] FAIL | | |
| 25 | Privacy | No user data sent to external servers without consent | [ ] PASS / [ ] FAIL | | review all fetch/XHR calls |

**Security Review Result:** _____ / 25 PASS

**Reviewed By:** __________________________ Date: __________

---

## 6. Chrome Web Store Submission Checklist

Complete all items before uploading to the Chrome Web Store Developer Dashboard.

### 6.1 Manifest Validation

| # | Item | Requirement | Status |
|---|------|-------------|--------|
| 1 | `manifest_version` | Must be `3` | [ ] PASS / [ ] FAIL |
| 2 | `name` | "Focus Mode - Blocker" (max 45 characters) | [ ] PASS / [ ] FAIL |
| 3 | `version` | Correct semver format `X.Y.Z` | [ ] PASS / [ ] FAIL |
| 4 | `description` | "Block distracting websites, build focus habits, and track your productivity streak." (max 132 characters) | [ ] PASS / [ ] FAIL |
| 5 | `icons` | All 4 sizes present and correct | [ ] PASS / [ ] FAIL |
| 6 | `permissions` | Only declared permissions that are used | [ ] PASS / [ ] FAIL |
| 7 | `background.service_worker` | Points to valid file | [ ] PASS / [ ] FAIL |
| 8 | `action.default_popup` | Points to valid popup HTML | [ ] PASS / [ ] FAIL |
| 9 | `content_scripts` | All 3 content scripts declared with correct matches | [ ] PASS / [ ] FAIL |
| 10 | `options_page` | Points to valid options HTML | [ ] PASS / [ ] FAIL |

### 6.2 Icons

| Icon Size | File Path | Dimensions Verified | Renders Cleanly | Status |
|-----------|-----------|:-------------------:|:----------------:|--------|
| 16x16 | `src/assets/icons/icon16.png` | [ ] Yes | [ ] Yes | [ ] PASS / [ ] FAIL |
| 48x48 | `src/assets/icons/icon48.png` | [ ] Yes | [ ] Yes | [ ] PASS / [ ] FAIL |
| 128x128 | `src/assets/icons/icon128.png` | [ ] Yes | [ ] Yes | [ ] PASS / [ ] FAIL |
| 512x512 (Store) | Uploaded to CWS dashboard | [ ] Yes | [ ] Yes | [ ] PASS / [ ] FAIL |

### 6.3 Store Listing Content

| # | Item | Requirement | Status |
|---|------|-------------|--------|
| 1 | Store title | "Focus Mode - Blocker" | [ ] PASS / [ ] FAIL |
| 2 | Short description | Under 132 characters | [ ] PASS / [ ] FAIL |
| 3 | Detailed description | Under 16,000 characters; compelling; includes features, pricing | [ ] PASS / [ ] FAIL |
| 4 | Category | Productivity | [ ] PASS / [ ] FAIL |
| 5 | Language | English (primary); additional localizations if applicable | [ ] PASS / [ ] FAIL |
| 6 | Pricing | Free (with in-app purchases noted) | [ ] PASS / [ ] FAIL |

### 6.4 Screenshots (5 Required)

| # | Screenshot Description | Dimensions | Content Shows | Status |
|---|----------------------|------------|---------------|--------|
| 1 | Popup main view with timer | 1280x800 or 640x400 | Focus timer running, blocked sites list | [ ] PASS / [ ] FAIL |
| 2 | Block page in action | 1280x800 or 640x400 | Block overlay on a website with motivational message | [ ] PASS / [ ] FAIL |
| 3 | Statistics/streak dashboard | 1280x800 or 640x400 | Productivity stats, streak counter, charts | [ ] PASS / [ ] FAIL |
| 4 | Options/settings page | 1280x800 or 640x400 | Customization options, Pro features highlighted | [ ] PASS / [ ] FAIL |
| 5 | Nuclear mode / Pro features | 1280x800 or 640x400 | Nuclear mode active, Pro badge visible | [ ] PASS / [ ] FAIL |

**Screenshot Requirements:**
- PNG or JPEG format
- 1280x800 or 640x400 pixels
- No misleading content
- No excessive branding or promotional text overlay
- Accurate representation of current functionality

### 6.5 Privacy and Compliance

| # | Item | Response / Status |
|---|------|-------------------|
| 1 | Privacy policy URL provided | URL: __________________________ [ ] PASS / [ ] FAIL |
| 2 | Single purpose description | "Block distracting websites during timed focus sessions to improve productivity" [ ] PASS / [ ] FAIL |
| 3 | Single purpose compliance | Extension only does website blocking + focus timing + productivity tracking [ ] PASS / [ ] FAIL |
| 4 | Permission justifications written for each permission | [ ] PASS / [ ] FAIL |
| 5 | Remote code policy compliance | No remote code execution; all code bundled locally [ ] PASS / [ ] FAIL |

### 6.6 Privacy Practices Disclosure Form

| Data Type | Collected? | Usage Justification | Disclosed? |
|-----------|:----------:|---------------------|:----------:|
| Personally identifiable information | [ ] Yes / [ ] No | | [ ] Yes / [ ] N/A |
| Health information | [ ] Yes / [ ] No | | [ ] Yes / [ ] N/A |
| Financial and payment information | [ ] Yes / [ ] No | Subscription processing via payment provider | [ ] Yes / [ ] N/A |
| Authentication information | [ ] Yes / [ ] No | Account login tokens (encrypted AES-256-GCM) | [ ] Yes / [ ] N/A |
| Personal communications | [ ] Yes / [ ] No | | [ ] Yes / [ ] N/A |
| Location | [ ] Yes / [ ] No | | [ ] Yes / [ ] N/A |
| Web history | [ ] Yes / [ ] No | Blocked site visit attempts (local only) | [ ] Yes / [ ] N/A |
| User activity | [ ] Yes / [ ] No | Focus session duration and streaks (local only) | [ ] Yes / [ ] N/A |
| Website content | [ ] Yes / [ ] No | | [ ] Yes / [ ] N/A |

**Certification Statements:**
- [ ] Data usage complies with the extension's single purpose
- [ ] Data is not sold to third parties
- [ ] Data is not used for purposes unrelated to the extension's core functionality
- [ ] Data is not used for creditworthiness or lending purposes

---

## 7. QA Report Template

```
============================================================
  FOCUS MODE - BLOCKER -- QA REPORT v1.0
============================================================

Status: [ ] READY FOR SUBMISSION  /  [ ] NEEDS WORK

Date:           __________
QA Lead:        __________
Build Version:  __________
Build Hash:     __________

------------------------------------------------------------
ISSUE SUMMARY
------------------------------------------------------------
  Critical:  0
  High:      0
  Medium:    0
  Low:       0
  Total:     0

------------------------------------------------------------
TEST RESULTS
------------------------------------------------------------

  Clean Build Checklist:        _____ / 15  PASS
  Regression Tests:             _____ / 61  PASS
  Cross-Platform Matrix:        _____ / 80  PASS  (20 tests x 4 platforms)
  Performance Metrics:          _____ / 18  PASS
  Security Review:              _____ / 25  PASS
  CWS Submission Checklist:     _____ / ___  PASS

  OVERALL:                      _____ / ___ PASS

------------------------------------------------------------
CRITICAL ISSUES (Must Fix Before Submission)
------------------------------------------------------------

  #  | Severity | Component      | Description              | Assignee | Status
  ---|----------|----------------|--------------------------|----------|-------
     |          |                |                          |          |

------------------------------------------------------------
HIGH ISSUES (Should Fix Before Submission)
------------------------------------------------------------

  #  | Severity | Component      | Description              | Assignee | Status
  ---|----------|----------------|--------------------------|----------|-------
     |          |                |                          |          |

------------------------------------------------------------
MEDIUM ISSUES (Fix in Next Release Acceptable)
------------------------------------------------------------

  #  | Severity | Component      | Description              | Assignee | Status
  ---|----------|----------------|--------------------------|----------|-------
     |          |                |                          |          |

------------------------------------------------------------
LOW ISSUES (Backlog)
------------------------------------------------------------

  #  | Severity | Component      | Description              | Assignee | Status
  ---|----------|----------------|--------------------------|----------|-------
     |          |                |                          |          |

------------------------------------------------------------
KNOWN LIMITATIONS
------------------------------------------------------------

  1.
  2.
  3.

------------------------------------------------------------
CHANGES MADE DURING QA
------------------------------------------------------------

  1.
  2.
  3.

------------------------------------------------------------
ENVIRONMENT
------------------------------------------------------------

  Chrome Stable:  ___.___.___
  Chrome Beta:    ___.___.___
  macOS:          __________
  Windows:        __________
  Linux:          __________
  Node.js:        __________
  npm:            __________

------------------------------------------------------------
RECOMMENDATION
------------------------------------------------------------

  [ ] APPROVE for Chrome Web Store submission
  [ ] REJECT -- see critical/high issues above

  Justification:



------------------------------------------------------------
SIGN-OFF
------------------------------------------------------------

  QA Lead:        ________________________  Date: __________
  Dev Lead:       ________________________  Date: __________
  Product Owner:  ________________________  Date: __________

============================================================
```

---

## 8. Post-Submission Monitoring Plan

Actions to take during the first 48 hours after Chrome Web Store approval and public availability.

### 8.1 Error Monitoring Setup

| # | Action | Tool/Service | Configuration | Owner |
|---|--------|-------------|---------------|-------|
| 1 | Deploy error tracking for service worker | Sentry / Bugsnag (self-hosted endpoint) | Capture uncaught exceptions, promise rejections, `chrome.runtime.lastError` | |
| 2 | Deploy error tracking for content scripts | Same service, separate project/tag | Tag errors by content script (1/2/3), include URL domain (not full URL) | |
| 3 | Deploy error tracking for popup | Same service, separate project/tag | Capture render failures, storage read errors | |
| 4 | Set up error rate alerting | PagerDuty / Slack webhook | Alert if error rate > 1% of sessions in any 1-hour window | |
| 5 | Configure source maps upload (private) | Error tracking service | Upload source maps to service (NOT in extension bundle); enable stack trace deobfuscation | |

### 8.2 User Feedback Channels

| Channel | URL/Location | Check Frequency | Responder |
|---------|-------------|-----------------|-----------|
| Chrome Web Store reviews | CWS Developer Dashboard | Every 4 hours for first 48h | |
| Support email | (support address) | Every 2 hours for first 48h | |
| GitHub Issues (if applicable) | (repo URL) | Every 4 hours for first 48h | |
| Social media mentions | Twitter/X, Reddit r/chrome, r/productivity | Every 6 hours for first 48h | |

### 8.3 Performance Dashboards

| Metric | Monitoring Method | Alert Threshold | Dashboard Location |
|--------|------------------|-----------------|-------------------|
| Service worker crash rate | Error tracking | > 0.5% of users | |
| Average popup open time | Custom telemetry (opt-in) | > 150ms (50% above target) | |
| Memory usage p95 | Chrome UMA (if available) | > 30MB | |
| Extension uninstall rate | CWS Developer Dashboard | > 5% daily uninstall rate | |
| Active users (DAU) | CWS Developer Dashboard | Trending downward 2 consecutive days | |
| Rating | CWS Developer Dashboard | Average drops below 4.0 | |

### 8.4 Crash Report Collection

- **Automated:** Service worker unhandled rejections logged with stack trace, extension version, Chrome version, OS
- **User-initiated:** "Report a Problem" link in options page; pre-fills version info; user describes issue
- **Telemetry (opt-in only):** Anonymous usage metrics: session count, average duration, feature usage frequency
- **Crash aggregation:** Group crashes by stack trace signature; prioritize by user impact count

### 8.5 Escalation Procedures

| Severity | Criteria | Response Time | Action |
|----------|----------|---------------|--------|
| **P0 - Critical** | Extension crashes on load; data loss; security vulnerability | < 1 hour | Pull extension from store; hotfix; re-submit for expedited review |
| **P1 - High** | Core feature broken (blocking not working, timer inaccurate) for > 10% of users | < 4 hours | Prepare hotfix; submit update; communicate via support channels |
| **P2 - Medium** | Non-core feature broken; UI glitch; performance regression | < 24 hours | File bug; schedule fix for next release |
| **P3 - Low** | Minor cosmetic issue; edge case; feature request | < 72 hours | File bug; add to backlog |

### 8.6 First 48 Hours Timeline

| Time | Action |
|------|--------|
| T+0h | Extension approved and live; verify listing is public; install from store on clean profile |
| T+1h | Check error dashboard for any install-time crashes |
| T+2h | Check CWS reviews for first user feedback |
| T+4h | Review error rates; compare to pre-launch baseline (should be near zero) |
| T+8h | Check DAU count; compare to expected install trajectory |
| T+12h | First performance metrics review; check p50/p95 popup open times |
| T+24h | Comprehensive review: errors, reviews, ratings, uninstall rate, support tickets |
| T+36h | Evaluate if hotfix needed based on 36h of data |
| T+48h | Post-launch retrospective; decide on cadence reduction (daily monitoring) |

### 8.7 Rollback Plan

If a critical issue is discovered post-launch:

1. **Immediate:** Unpublish extension from Chrome Web Store (removes from search, existing installs unaffected)
2. **Within 1 hour:** Identify root cause from crash reports and error logs
3. **Within 2 hours:** Develop and test hotfix on all 4 platforms
4. **Within 3 hours:** Submit hotfix to CWS; request expedited review if available
5. **Communication:** Post status update to all user feedback channels
6. **Post-incident:** Conduct root cause analysis; add regression test; update this QA checklist

---

## 9. Debug Checklist for Future Releases

Reusable debugging reference organized by category. Use this when diagnosing issues during development, QA, or production incidents.

### 9.1 Manifest Issues

| # | Symptom | Likely Cause | Fix | Prevention |
|---|---------|-------------|-----|------------|
| 1 | Extension fails to load | Invalid JSON in `manifest.json` | Validate JSON syntax; check trailing commas | Use JSON linter in CI |
| 2 | "Service worker registration failed" | Incorrect `background.service_worker` path | Verify file exists at declared path in dist/ | Add path verification to build script |
| 3 | Content script not injecting | Wrong `matches` pattern in `content_scripts` | Fix glob pattern; test with `chrome://extensions` > service worker console | Unit test match patterns |
| 4 | Popup blank or missing | Wrong `action.default_popup` path | Verify popup HTML file exists and path is correct | Build-time path validation |
| 5 | Icons missing or broken | Wrong icon paths or missing sizes | Verify all 4 sizes exist at declared paths | Automated icon presence check in CI |
| 6 | "Permission not declared" error | API used without corresponding permission | Add required permission to `permissions` or `optional_permissions` | Maintain permission-to-API mapping doc |
| 7 | Extension not working after update | `manifest_version` changed or permissions added | Check if new permissions require user re-approval | Test upgrade path in QA |

### 9.2 JavaScript Runtime Issues

| # | Symptom | Likely Cause | Fix | Prevention |
|---|---------|-------------|-----|------------|
| 8 | `chrome.runtime.lastError` in callbacks | API call failed (permission, invalid args) | Always check `chrome.runtime.lastError` before using callback result | Wrapper utility that auto-checks lastError |
| 9 | "Extension context invalidated" | Content script running after extension reload/update | Check `chrome.runtime?.id` before messaging; handle disconnect gracefully | Wrap all runtime calls in try-catch |
| 10 | Service worker stops unexpectedly | Idle timeout (30s MV3 limit) or unhandled error | Use `chrome.alarms` for persistent tasks; never rely on long-running SW | Design all logic to survive SW restart |
| 11 | "Uncaught (in promise)" in SW | Unhandled promise rejection | Add `.catch()` to all promises; use global `unhandledrejection` handler | ESLint rule: `no-floating-promises` |
| 12 | Message listener not receiving | Listener registered after message sent; or SW was asleep | Ensure listeners are at top-level scope (not inside async functions) | Code review checklist item |
| 13 | `sendMessage` callback never fires | No listener on receiving end; or listener did not call `sendResponse` | Verify listener exists; return `true` from listener for async responses | Integration test for all message types |
| 14 | Storage quota exceeded | Too much data in `chrome.storage.sync` (100KB limit) | Compress data; move large items to `chrome.storage.local` (5MB limit) | Monitor storage usage; implement cleanup |
| 15 | Race condition in storage writes | Multiple contexts writing simultaneously | Use a storage mutex/queue; or consolidate writes in SW | Centralize storage writes in service worker |
| 16 | `TypeError: Cannot read property of undefined` | Accessing nested object without null check | Use optional chaining (`?.`) and nullish coalescing (`??`) | TypeScript strict mode; ESLint rules |

### 9.3 Service Worker Specific Issues

| # | Symptom | Likely Cause | Fix | Prevention |
|---|---------|-------------|-----|------------|
| 17 | Timer inaccurate after SW restart | Timer relied on `setInterval` which dies with SW | Use `chrome.alarms` (minimum 1-minute granularity) for persistence | Never use setInterval for critical timing |
| 18 | State lost after SW restart | State stored in JS variables instead of `chrome.storage` | Persist all critical state to storage; restore on SW startup | Architecture rule: no in-memory-only state |
| 19 | SW restarts in a loop | Uncaught error in top-level initialization code | Check SW console for errors; fix initialization crash | Global error handler at top of SW |
| 20 | Offscreen document not created | Calling `chrome.offscreen.createDocument` when one already exists | Check for existing document before creating; handle "already exists" error | Singleton pattern for offscreen document |
| 21 | Alarms not firing | Chrome throttles alarms in background; or alarm name collision | Use unique alarm names; minimum period 1 minute; verify with `chrome.alarms.getAll()` | Integration test for alarm firing |

### 9.4 Content Script Issues

| # | Symptom | Likely Cause | Fix | Prevention |
|---|---------|-------------|-----|------------|
| 22 | Content script breaks host page | CSS leaking; JS globals conflicting | Use Shadow DOM for injected UI; prefix all CSS classes; use IIFE for JS | Shadow DOM encapsulation standard |
| 23 | Content script not running on SPA navigation | SPA uses History API without full page load | Listen for `popstate`, `hashchange`, and observe URL via `MutationObserver` | SPA-aware navigation detection utility |
| 24 | Block overlay does not cover page | Page uses `z-index` higher than overlay | Use `z-index: 2147483647` (max); use fixed positioning | Standard overlay z-index in shared constants |
| 25 | Content script runs on wrong pages | Overly broad `matches` pattern | Narrow match patterns; add runtime URL validation | Review match patterns in every PR |
| 26 | Multiple overlays injected | Content script runs multiple times (iframes, SPA) | Check for existing overlay before injecting; use unique ID | Idempotent injection pattern |

### 9.5 Performance Issues

| # | Symptom | Likely Cause | Fix | Prevention |
|---|---------|-------------|-----|------------|
| 27 | Popup slow to open | Heavy computation on popup load; large DOM | Defer non-critical rendering; lazy-load stats; reduce DOM nodes | Performance budget in CI (< 100ms) |
| 28 | High memory usage | Unbounded arrays/caches; DOM node leaks | Implement LRU cache with size limits; clean up DOM on navigation | Memory profiling in QA |
| 29 | CPU usage spikes | Tight polling loops; excessive DOM observation | Use event-driven patterns; throttle/debounce observers | No `setInterval` < 1s; code review for loops |
| 30 | Bundle too large | Unused dependencies; no tree shaking | Audit with `webpack-bundle-analyzer` or equivalent; remove unused imports | Bundle size check in CI |
| 31 | Storage reads slow | Reading entire storage on every operation | Cache frequently-accessed data; read only needed keys | Storage access pattern review |

### 9.6 Security Issues

| # | Symptom | Likely Cause | Fix | Prevention |
|---|---------|-------------|-----|------------|
| 32 | CWS rejects for CSP violation | `eval()`, `new Function()`, or inline scripts | Remove all eval-like patterns; use CSP-compliant alternatives | ESLint `no-eval` rule; CI CSP validation |
| 33 | XSS via user input | Unsanitized input rendered as HTML | Use `textContent` not `innerHTML`; sanitize all inputs | Code review checklist; DOM safety ESLint rules |
| 34 | Token exposed in storage | Token stored in plaintext | Encrypt with AES-256-GCM before storage | Encryption wrapper for all sensitive storage |
| 35 | Cross-extension message spoofing | No sender validation in message handlers | Validate `sender.id` === own extension ID in all handlers | Standard message handler wrapper with validation |
| 36 | Data exfiltration via fetch | Compromised dependency making unauthorized requests | Audit all network calls; use CSP `connect-src` restriction; review deps | Dependency audit in CI; network call allowlist |

### 9.7 Chrome Web Store Submission Issues

| # | Symptom | Likely Cause | Fix | Prevention |
|---|---------|-------------|-----|------------|
| 37 | Rejected: "Deceptive installation" | Unclear or misleading store listing | Ensure description accurately represents functionality | Pre-submission review by non-developer |
| 38 | Rejected: "Excessive permissions" | Requesting permissions not needed for core functionality | Remove unnecessary permissions; use `optional_permissions` for non-core features | Permission audit before each submission |
| 39 | Rejected: "Remote code" | Loading scripts from external URL | Bundle all code locally; no CDN references | Automated check for external script tags |
| 40 | Rejected: "Single purpose" violation | Extension does too many unrelated things | Ensure all features relate to focus/productivity/blocking purpose | Feature review against single purpose policy |

### Quick-Fix Reference

**Service worker stopped responding:**
```
1. chrome://extensions > Find extension > Click "service worker" link
2. Check console for errors
3. Click "Update" to force restart
4. If persistent, check for top-level uncaught errors
```

**Content script not injecting:**
```
1. chrome://extensions > Find extension > Check "errors" badge
2. Verify URL matches content_scripts.matches pattern
3. Check if page loaded before extension (refresh page)
4. Open DevTools on page > Console > Check for injection errors
```

**Storage data corrupted:**
```
1. Open service worker DevTools > Application > Storage
2. Inspect chrome.storage.local and chrome.storage.sync
3. Export current data: chrome.storage.local.get(null, console.log)
4. Clear and reinitialize: chrome.storage.local.clear()
5. Extension should reinitialize with defaults on next load
```

**Performance regression:**
```
1. chrome://extensions > Find extension > Check memory footprint
2. Open popup DevTools > Performance tab > Record popup open
3. Open service worker DevTools > Performance tab > Profile during operation
4. Check for: tight loops, excessive DOM updates, large storage reads
5. Compare bundle size against previous release
```

**Extension not updating:**
```
1. chrome://extensions > Enable developer mode
2. Click "Update" button (forces update check)
3. If local: "Load unpacked" > Select new dist/ folder
4. If CWS: May take up to 60 minutes for propagation
5. Check version number in manifest matches expected
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-10 | QA Lead | Initial specification |

---

*This document is the authoritative QA specification for Focus Mode - Blocker. All sections must be completed and signed off before Chrome Web Store submission.*
