# Cross-Browser Landscape & API Compatibility Audit: Focus Mode - Blocker

> **Phase:** 16 (Cross-Browser Porter) | **Agent:** 1 of 5
> **Date:** February 11, 2026 | **Status:** Complete
> **Input:** Phases 01-15 (all prior architecture, spec, and implementation docs)
> **Extension:** Focus Mode - Blocker v1.0.0
> **Scope:** Browser landscape analysis, API compatibility audit, polyfill integration, feature detection, abstraction layer design

---

## Table of Contents

1. [Browser Extension Landscape Applied to Focus Mode - Blocker](#1-browser-extension-landscape)
2. [WebExtension API Compatibility Audit](#2-api-compatibility-audit)
3. [WebExtension Polyfill Integration Plan](#3-polyfill-integration)
4. [Feature Detection and Graceful Degradation](#4-feature-detection)
5. [Cross-Browser API Abstraction Layer](#5-abstraction-layer)

---

## 1. Browser Extension Landscape

### 1.1 Market Opportunity by Browser

Focus Mode - Blocker targets knowledge workers, students, ADHD/neurodivergent users, and freelancers. Each browser has a distinct user profile that maps differently to these personas.

| Browser | Global Share (Desktop) | Extension Users (Est.) | Primary Persona Overlap | Revenue Potential |
|---------|----------------------|----------------------|------------------------|-------------------|
| **Chrome** | ~65% | ~1.2B desktop users | All 4 personas (Alex, Jordan, Sam, Morgan) | Baseline -- largest TAM, highest competition |
| **Edge** | ~13% | ~260M desktop users | Enterprise knowledge workers (Alex), students (Jordan) | High -- enterprise managed deployments, BYOD policies favor Edge, MS 365 integration |
| **Firefox** | ~6% | ~120M desktop users | Privacy-focused power users, developers (Sam, Morgan) | Medium -- users pay for tools that respect privacy, lower competition |
| **Safari** | ~9% (desktop) | ~180M Mac users | Creative professionals, students on Mac (Jordan, Morgan) | High -- Safari users have higher ARPU, Apple ecosystem willingness to pay |
| **Brave** | ~1.5% | ~30M users | Privacy-maximalists, crypto users, tech-savvy (Sam) | Medium-Low -- small TAM but engaged, overlaps with focus/productivity interest |
| **Opera** | ~2.3% | ~46M users | Gamers, casual users, emerging markets | Low -- limited extension ecosystem engagement, lowest persona overlap |

**Total addressable market expansion:** Moving beyond Chrome-only could reach an additional 636M+ desktop users (Edge + Firefox + Safari + Brave + Opera). Even capturing 0.01% penetration across these platforms would add 63,600 installs on top of Chrome projections.

### 1.2 Competitive Landscape by Browser

#### Chrome Web Store

The primary battlefield. Established competitors include BlockSite (5M+ users), StayFocusd (600K), LeechBlock NG (100K), Freedom (200K+), and Forest (900K). Focus Mode - Blocker's "honest freemium" positioning (10 free sites, Focus Score, gamification + strong blocking) differentiates it here, but discoverability is harder due to saturation.

#### Firefox Add-ons (addons.mozilla.org)

- **LeechBlock NG** dominates (100K+ users, 4.9 rating, open source) -- it was originally built for Firefox.
- **BlockSite** has a Firefox version but with lower ratings (~4.2) and fewer features than Chrome.
- **StayFocusd** has no official Firefox version.
- **Forest** has a Firefox version but with limited functionality.
- **Gap:** No Firefox extension combines gamification (Focus Score, streaks) with strong blocking (Nuclear Mode) and a polished freemium model. LeechBlock is powerful but has dated UI and zero gamification. Focus Mode - Blocker would be the only option offering Focus Score and streak-based motivation on Firefox.

#### Safari Web Extensions (Mac App Store)

- **Focus** (by Meaningful Things) exists but is minimal.
- **1Focus** is a native Mac app, not a web extension.
- **BlockSite** has no Safari version.
- **Cold Turkey** is desktop-only, not a Safari extension.
- **Gap:** The Safari extension market for website blockers is severely underserved. Most Safari blocking tools are native Mac apps ($20-40 one-time), not web extensions. A well-built Safari web extension at $4.99/mo would face almost no direct competition. Safari users expect polished UI, which Focus Mode - Blocker already delivers.

#### Microsoft Edge Add-ons

- **BlockSite** is available on Edge (auto-ported from Chrome) with reasonable adoption.
- **StayFocusd** has no Edge version.
- **Freedom** works via Chrome extension sideloading but has no native Edge listing.
- **Gap:** Edge's enterprise user base (managed Intune/Group Policy deployments) is largely unserved by productivity extensions. Focus Mode - Blocker's future Team tier ($3.99/user/mo) is uniquely positioned for Edge enterprise deployment.

#### Brave (Chrome Web Store compatible)

- Brave users can install Chrome extensions directly from the Chrome Web Store.
- No separate store or porting work required for core functionality.
- **Gap:** Brave users actively seek privacy-respecting tools. Focus Mode - Blocker's "all data stays on device" for free tier is a strong selling point.

#### Opera Add-ons

- Opera supports Chrome extensions via its "Install Chrome Extensions" feature, but native listing on the Opera Add-ons store requires separate submission.
- Low strategic value given small user base and persona mismatch.

### 1.3 Revenue Opportunity by Platform

| Platform | Avg. ARPU (Extensions) | Willingness to Pay | Strategic Value for Focus Mode |
|----------|----------------------|-------------------|-------------------------------|
| **Chrome** | $4-6/mo | Moderate -- price-sensitive due to free alternatives | Core revenue, largest volume |
| **Safari** | $6-10/mo | High -- Apple users spend 2-3x more on software | Premium ARPU opportunity, Mac App Store 30% cut offset by higher conversion |
| **Edge** | $4-8/mo | High for enterprise, moderate for consumer | Team tier ($3.99/user/mo) opportunity, volume licensing |
| **Firefox** | $3-5/mo | Moderate -- privacy-focused users will pay for trustworthy tools | Differentiator: "we never collect your data" resonates strongly here |
| **Brave** | $3-5/mo | Moderate -- tech-savvy, already paying attention to digital habits | Small but loyal user base, strong word-of-mouth potential |
| **Opera** | $2-4/mo | Low -- high proportion of emerging market users | Minimal revenue impact, defer porting |

**Safari revenue projection:** Even with 1/10th the install volume of Chrome, Safari users' 2-3x higher ARPU means Safari could generate 20-30% of Chrome revenue. At 5,000 Safari installs with 5% conversion at $5.99/mo, that is $1,497/mo -- comparable to 15,000 Chrome installs at 3% conversion at $4.99/mo ($2,247/mo).

### 1.4 Recommended Porting Priority Order

| Priority | Browser | Timeline | Justification |
|----------|---------|----------|---------------|
| **P0** | Chrome | Launch (built) | Primary platform, largest TAM, all features designed for Chrome MV3 |
| **P1** | Edge | Launch + 1 week | Near-zero porting effort (Chromium-based, same MV3 manifest), separate Edge Add-ons listing doubles discoverability, enterprise Team tier opportunity |
| **P2** | Firefox | Launch + 6-8 weeks | Significant effort (MV2/MV3 hybrid, `browser.*` namespace, different DNR support), but underserved market with high differentiation potential |
| **P3** | Safari | Launch + 10-14 weeks | High revenue per user but requires Xcode wrapper, Mac App Store submission, Apple developer account ($99/yr), and significant API adaptation |
| **P4** | Brave | No extra work | Chrome Web Store extensions work natively, verify compatibility with Brave Shields and test DNR interaction with Brave's built-in blocking |
| **P5** | Opera | Launch + 16 weeks | Low priority, submit to Opera Add-ons store after Firefox/Safari are stable, minimal unique work |

**Rationale for Edge before Firefox:** Edge uses the same Chromium engine and MV3 manifest as Chrome. The porting effort is essentially: change `minimum_chrome_version` to `minimum_edge_version`, update store listing assets, submit to Microsoft Partner Center. This can happen within days of Chrome launch. Firefox, by contrast, requires meaningful code changes (namespace, manifest format, DNR limitations) and is a larger engineering investment.

---

## 2. WebExtension API Compatibility Audit

Focus Mode - Blocker uses 12 Chrome extension APIs in its manifest and codebase. This section audits each API across all target browsers, documents known quirks, and identifies risk levels for core functionality.

### 2.1 Compatibility Matrix Overview

| API | Chrome | Edge | Firefox | Safari | Brave |
|-----|--------|------|---------|--------|-------|
| `declarativeNetRequest` | Full | Full | Partial (MV3) | Partial | Full |
| `storage.local` | Full | Full | Full | Full | Full |
| `storage.sync` | Full | Full | Full | Partial | Full |
| `storage.session` | Full | Full | Full (MV3) | No | Full |
| `alarms` | Full | Full | Full | Full | Full |
| `notifications` | Full | Full | Full | No | Full |
| `tabs` | Full | Full | Full | Full | Full |
| `contextMenus` | Full | Full | Full (`menus`) | Partial | Full |
| `scripting` | Full | Full | Full (MV3) | Partial | Full |
| `action` | Full | Full | Full (MV3) | Full | Full |
| `runtime` | Full | Full | Full | Full | Full |
| `i18n` | Full | Full | Full | Full | Full |
| `offscreen` | Full | Full | No | No | Full |

### 2.2 Detailed API Audit

#### 2.2.1 chrome.declarativeNetRequest (CRITICAL -- Blocking Engine)

**How Focus Mode uses it:** This is the core blocking mechanism. The `RuleEngine` class manages three rule types -- static rulesets (pre-built category lists), dynamic rules (user blocklist, schedules, Nuclear Mode), and session rules (Quick Focus temporary blocks). Rules redirect blocked URLs to the bundled block page. Nuclear Mode creates a high-priority "block everything" rule with whitelist exceptions.

| Browser | Support Level | Notes |
|---------|-------------|-------|
| **Chrome 116+** | Full | 30,000 dynamic rules, 5,000 session rules, static rulesets, `redirect` action, `modifyHeaders`, all rule conditions |
| **Edge 116+** | Full | Identical to Chrome (same Chromium engine). All DNR features work. |
| **Firefox 128+** (MV3) | Partial | Dynamic rules supported. Session rules supported. Static rulesets supported. `redirect` action supported but with differences in how extension page URLs are handled. Maximum dynamic rule count is 30,000. **Quirk:** Firefox MV3 requires `browser_specific_settings.gecko.id` in manifest. |
| **Firefox 113+** (MV2) | Partial | DNR available in MV2 via `browser.declarativeNetRequest`. Dynamic rules work. Session rules do NOT exist in MV2. Static rulesets work. |
| **Safari 17.4+** | Partial | DNR supported with limitations. Dynamic rules: yes, but limited to 30,000. Session rules: limited. `redirect` action: works for HTTPS URLs, does NOT support redirecting to `extension://` URLs directly -- must use `safari-web-extension://` scheme. **Critical limitation:** Static rulesets have a lower practical limit due to memory constraints on iOS (not relevant for desktop but affects architecture if considering iOS later). |
| **Brave** | Full | Identical to Chrome. Brave Shields operates independently from extension DNR rules, meaning both the extension's rules and Brave's built-in blocking run simultaneously. No conflict -- Brave Shields blocks ads/trackers, Focus Mode blocks distracting domains. |

**Risk assessment for Focus Mode:**

| Feature | Risk Level | Issue |
|---------|-----------|-------|
| Core blocking (user blocklist) | LOW | Dynamic rules with `redirect` action work on all target browsers |
| Pre-built category lists (static rulesets) | LOW | Supported everywhere, minor manifest differences |
| Nuclear Mode (block-all + whitelist) | MEDIUM | Session rules absent in Firefox MV2; use dynamic rules as fallback |
| Block page redirect URL | HIGH | Safari uses `safari-web-extension://` scheme instead of `chrome-extension://`; Firefox uses `moz-extension://`. Redirect URLs in DNR rules must be dynamically constructed per browser |
| Quick Focus (session rules) | MEDIUM | Firefox MV2 lacks session rules; fallback to dynamic rules with cleanup alarm |
| Rule ID ranges / budget | LOW | 30,000 dynamic rule limit is consistent across all browsers |

**Required workaround -- Block page redirect URL:**
```javascript
// Current: hardcoded chrome-extension:// in DNR rules
// Fix: dynamically resolve extension URL
const blockPageUrl = chrome.runtime.getURL('src/pages/blocked/blocked.html');
// Returns:
//   chrome-extension://<id>/src/pages/blocked/blocked.html  (Chrome, Edge, Brave)
//   moz-extension://<id>/src/pages/blocked/blocked.html     (Firefox)
//   safari-web-extension://<id>/src/pages/blocked/blocked.html (Safari)
```

#### 2.2.2 chrome.storage.local / chrome.storage.sync / chrome.storage.session

**How Focus Mode uses it:**
- `storage.local`: Primary persistent store for settings, blocklist, daily stats, Focus Score history, streak data, achievements, Nuclear Mode state, license info. Used by StorageManager across all modules.
- `storage.sync`: Pro-only cross-device sync for settings, blocklist, and focus session configuration. 100KB total quota, 8KB per item.
- `storage.session`: Ephemeral state for active Pomodoro session, timer countdown, temporary UI flags, in-progress Focus Score calculation. Cleared on browser restart.

| API | Chrome | Edge | Firefox | Safari | Brave |
|-----|--------|------|---------|--------|-------|
| `storage.local` | Full (10MB) | Full (10MB) | Full (unlimitedStorage available) | Full (varies) | Full (10MB) |
| `storage.sync` | Full (100KB, 8KB/item) | Full | Full (100KB, 8KB/item) | **Partial** -- sync mechanism does not actually sync to iCloud; behaves like `storage.local` | Full |
| `storage.session` | Full (MV3) | Full (MV3) | Full (MV3 only) | **Not supported** | Full |
| `storage.onChanged` | Full | Full | Full | Full | Full |

**Risk assessment for Focus Mode:**

| Feature | Risk Level | Issue |
|---------|-----------|-------|
| Settings, blocklist, stats persistence | LOW | `storage.local` works everywhere |
| Pro cross-device sync | HIGH | Safari's `storage.sync` does not actually sync. Firefox syncs only if user has a Firefox Account. Sync is unreliable cross-browser -- a server-side sync solution is needed for true cross-device support. |
| Active session state (`storage.session`) | HIGH | Not available in Safari. Firefox only supports it in MV3 mode. Focus Mode's Pomodoro timer state, in-progress Focus Score, and temporary UI flags all depend on this. |
| Storage quota monitoring | LOW | Quotas are similar across browsers; `StorageManager`'s quota tracking works universally |

**Required workaround -- storage.session fallback:**
```javascript
// Safari has no storage.session. Fallback to storage.local with a prefixed key
// and a cleanup routine on browser start.
const SESSION_PREFIX = '__session_';

async function getSessionData(key) {
  if (chrome.storage.session) {
    return chrome.storage.session.get(key);
  }
  // Fallback: use storage.local with session prefix
  return chrome.storage.local.get(SESSION_PREFIX + key);
}

// On browser startup / extension install, clean up stale session data
chrome.runtime.onStartup.addListener(async () => {
  if (!chrome.storage.session) {
    const all = await chrome.storage.local.get(null);
    const sessionKeys = Object.keys(all).filter(k => k.startsWith(SESSION_PREFIX));
    if (sessionKeys.length > 0) {
      await chrome.storage.local.remove(sessionKeys);
    }
  }
});
```

#### 2.2.3 chrome.alarms (Pomodoro Timer, Streak Tracking, Scheduled Tasks)

**How Focus Mode uses it:** The AlarmManager creates and manages 12+ named alarms: `pomodoro-tick` (timer countdown, 1-minute intervals), `pomodoro-end` (session completion), `break-end` (break timer), `nuclear-countdown` (Nuclear Mode expiry), `streak-check` (hourly streak validation), `daily-reset` (midnight stats reset), `storage-cleanup` (periodic stale data removal), `license-check` (Pro license revalidation), `telemetry-batch` (analytics flush), `schedule-activate` / `schedule-deactivate` (schedule-based blocking toggles), `sound-fade` (ambient sound transitions).

| Browser | Support Level | Notes |
|---------|-------------|-------|
| **Chrome** | Full | 1-minute minimum interval for periodic alarms, `when` and `delayInMinutes` for one-shot |
| **Edge** | Full | Identical to Chrome |
| **Firefox** | Full | Same API, same 1-minute minimum. Firefox MV2 uses `browser.alarms`, MV3 supports both `browser.alarms` and `chrome.alarms` with polyfill. |
| **Safari** | Full | Alarms work. **Quirk:** Safari may delay alarms when the browser is in a low-power state (Energy Saver on macOS). Alarms may fire up to 60 seconds late. |
| **Brave** | Full | Identical to Chrome |

**Risk assessment:** LOW. The alarms API is one of the most consistently implemented APIs across all browsers. Safari's potential alarm delay under Energy Saver is the only concern, and it is bounded to ~60 seconds -- acceptable for Focus Mode's use cases (1-minute Pomodoro ticks, hourly streak checks).

**Mitigation for Safari alarm delay:** When the popup opens, recalculate timer display from `alarmInfo.scheduledTime` relative to `Date.now()`, rather than trusting the last tick message. This pattern is already implemented in Focus Mode's popup timer display (the popup maintains its own countdown based on the alarm's scheduled time).

#### 2.2.4 chrome.notifications (Session Events, Streak Milestones, Nuclear Mode Warnings)

**How Focus Mode uses it:** The `NotificationManager` sends 7 notification types: session start confirmation, session complete (with Focus Score), break reminder, streak milestone (3, 7, 14, 30 days), Nuclear Mode activation warning, Nuclear Mode expiry, and trial/upgrade prompts.

| Browser | Support Level | Notes |
|---------|-------------|-------|
| **Chrome** | Full | Rich notifications, buttons, images, progress |
| **Edge** | Full | Same as Chrome, integrates with Windows notification center |
| **Firefox** | Full | Basic notifications. **Quirk:** `buttons` property in notification options is ignored -- Firefox shows notifications without action buttons. Images may not display on all OS versions. |
| **Safari** | **Not supported** | Safari web extensions cannot use `chrome.notifications` or `browser.notifications`. Notifications must go through the native macOS notification system via the app wrapper. This requires significant native code in the Xcode project. |
| **Brave** | Full | Same as Chrome |

**Risk assessment for Focus Mode:**

| Feature | Risk Level | Issue |
|---------|-----------|-------|
| Session complete notification | MEDIUM | Safari: not available via extension API. Firefox: works but without buttons. |
| Streak milestone notification | MEDIUM | Same Safari limitation. |
| Nuclear Mode warnings | MEDIUM | Same Safari limitation. |
| Notification action buttons | MEDIUM | Firefox ignores buttons. Safari has no notifications at all. |

**Required workaround -- Safari notification fallback:**
Safari requires notifications to be sent through the native macOS `NSUserNotificationCenter` (or `UNUserNotificationCenter`) via the extension's native app wrapper. The Safari web extension communicates with its native host app via `browser.runtime.sendNativeMessage()`. The native app then posts a macOS notification.

For Firefox, degrade gracefully: show notifications without action buttons, include clickable notification body that opens the popup or options page.

#### 2.2.5 chrome.tabs (Active Tab Monitoring, Block Page Navigation)

**How Focus Mode uses it:** Used for `tabs.query` (find active tab for Quick Focus), `tabs.update` (redirect blocked tab to block page), `tabs.onUpdated` (detect navigation to blocked sites), `tabs.onActivated` (track tab switches for distraction counting), and `tabs.create` (open onboarding, options page).

| Browser | Support Level | Notes |
|---------|-------------|-------|
| **Chrome** | Full | All tab events and methods |
| **Edge** | Full | Identical to Chrome |
| **Firefox** | Full | Full support. Uses `browser.tabs` in MV2, supports `chrome.tabs` alias in MV3. |
| **Safari** | Full | All major tab APIs work. **Quirk:** `tabs.query` may not return `url` property unless the extension has `<all_urls>` or appropriate host permission, and the user has granted "Allow on All Websites" in Safari preferences. Safari prompts users per-site by default. |
| **Brave** | Full | Identical to Chrome |

**Risk assessment:** LOW. The tabs API is well-standardized. Safari's per-site permission model means `tabs.query({ url: ... })` may return fewer results than expected if the user has only granted permission on some sites. Focus Mode should handle this gracefully -- the extension already requires `<all_urls>` host permission which, when granted in Safari preferences, covers all sites.

#### 2.2.6 chrome.contextMenus (Right-Click Quick Block)

**How Focus Mode uses it:** Creates a "Block this site with Focus Mode" right-click context menu item. When clicked, adds the current site's domain to the blocklist.

| Browser | Support Level | Notes |
|---------|-------------|-------|
| **Chrome** | Full | `chrome.contextMenus` |
| **Edge** | Full | Same as Chrome |
| **Firefox** | Full | Uses `browser.menus` (alias: `browser.contextMenus`). **Quirk:** Firefox uses `menus` as the primary namespace; `contextMenus` works as an alias. The `icons` property on menu items is Firefox-specific. |
| **Safari** | Partial | Context menus work but with limitations. Menu items may not appear in all contexts (e.g., pages where the extension does not have permission). |
| **Brave** | Full | Same as Chrome |

**Risk assessment:** LOW. Context menus are well-supported. Focus Mode's single context menu item ("Block this site") is a simple use case.

#### 2.2.7 chrome.scripting (Content Script Injection for Block Page)

**How Focus Mode uses it:** `scripting.executeScript` is used for on-demand content script injection -- primarily for injecting the block page overlay CSS and re-injecting content scripts after extension updates.

| Browser | Support Level | Notes |
|---------|-------------|-------|
| **Chrome** | Full | `scripting.executeScript`, `scripting.insertCSS`, `scripting.removeCSS` |
| **Edge** | Full | Same as Chrome |
| **Firefox** | Full (MV3) | MV3 supports `scripting.executeScript`. MV2 Firefox uses `tabs.executeScript` instead (different API signature). |
| **Safari** | Partial | `scripting.executeScript` works but with restrictions. Scripts can only be injected into pages where the extension has been granted permission by the user. **Quirk:** Safari does not support `scripting.executeScript` with `func` parameter for arbitrary functions -- only `files` parameter works reliably. |
| **Brave** | Full | Same as Chrome |

**Risk assessment for Focus Mode:**

| Feature | Risk Level | Issue |
|---------|-----------|-------|
| Static content script injection (manifest-declared) | LOW | Works on all browsers |
| Dynamic block page injection | MEDIUM | Safari restricts `func` parameter; use `files` parameter instead. Firefox MV2 uses `tabs.executeScript`. |
| Re-injection after update | LOW | All browsers support manifest-declared script re-injection on update |

**Required workaround -- Safari scripting.executeScript:**
```javascript
// Chrome/Edge/Brave: can use func parameter
chrome.scripting.executeScript({
  target: { tabId },
  func: () => { /* inline function */ }
});

// Safari: must use files parameter only
chrome.scripting.executeScript({
  target: { tabId },
  files: ['src/content/blocker.js']
});
```
Focus Mode's architecture already favors the `files` approach (content scripts are separate files), so this is a minor constraint.

#### 2.2.8 chrome.action (Popup, Badge Text, Badge Color)

**How Focus Mode uses it:** Sets badge text to show active timer countdown ("25m"), blocked count during sessions ("3"), or session state indicator. Sets badge background color: #6366f1 (indigo, idle), #22c55e (green, active session), #ef4444 (red, Nuclear Mode). Controls popup behavior.

| Browser | Support Level | Notes |
|---------|-------------|-------|
| **Chrome** | Full | `action.setBadgeText`, `action.setBadgeBackgroundColor`, `action.setIcon`, `action.setPopup` |
| **Edge** | Full | Same as Chrome |
| **Firefox** (MV3) | Full | `action` API supported in MV3. In MV2, use `browserAction` instead. |
| **Firefox** (MV2) | Full | Uses `browser.browserAction` with identical methods |
| **Safari** | Full | Badge text and color work. **Quirk:** Badge text is limited to 4 characters on Safari (same as Chrome). Icon changes may require the icon to be listed in `web_accessible_resources` on some Safari versions. |
| **Brave** | Full | Same as Chrome |

**Risk assessment:** LOW. The action/browserAction API is one of the oldest and most stable WebExtension APIs.

#### 2.2.9 chrome.runtime (Messaging, onInstalled, Service Worker Lifecycle)

**How Focus Mode uses it:** Extensive use across the entire extension: `runtime.onInstalled` (first-run onboarding, schema migration on update), `runtime.onMessage` / `runtime.sendMessage` (22+ message types between service worker, popup, options, content scripts, block page), `runtime.connect` (port-based streaming for real-time timer updates to popup), `runtime.getURL` (resolve extension resource URLs), `runtime.openOptionsPage`, `runtime.id` (extension ID for message validation).

| Browser | Support Level | Notes |
|---------|-------------|-------|
| **Chrome** | Full | All runtime APIs |
| **Edge** | Full | Same as Chrome |
| **Firefox** | Full | Uses `browser.runtime` (returns Promises natively). `chrome.runtime` works with polyfill. **Quirk:** `runtime.onInstalled` fires with `reason: "browser_update"` on Firefox updates, which Chrome does not do. Focus Mode's install handler should filter for `reason === "install"` and `reason === "update"` only. |
| **Safari** | Full | All major runtime APIs work. **Quirk:** `runtime.sendNativeMessage` is the only way to communicate with the native host app (required for Safari notifications). |
| **Brave** | Full | Same as Chrome |

**Risk assessment:** LOW. The runtime API is universal. Firefox's `browser_update` reason is a minor edge case handled with a simple conditional.

#### 2.2.10 chrome.i18n (Internationalization)

**How Focus Mode uses it:** The `I18nManager` class reads `_locales/*/messages.json` via `chrome.i18n.getMessage()`. It localizes DOM elements via `data-i18n` attributes across all 6 UI surfaces (popup, options, block page, onboarding, notifications, paywall). `chrome.i18n.getUILanguage()` detects the user's browser language. `@@bidi_dir` predefined message controls RTL layout.

| Browser | Support Level | Notes |
|---------|-------------|-------|
| **Chrome** | Full | `getMessage`, `getUILanguage`, `getAcceptLanguages`, predefined messages |
| **Edge** | Full | Same as Chrome |
| **Firefox** | Full | Full support. `i18n.getMessage` returns empty string for missing keys (same as Chrome). |
| **Safari** | Full | Full support. **Quirk:** `getUILanguage()` returns the Safari/macOS language preference, which may differ from what a user expects if they have multiple languages configured. |
| **Brave** | Full | Same as Chrome |

**Risk assessment:** LOW. The i18n API is fully standardized and works identically across all browsers.

#### 2.2.11 chrome.offscreen (Ambient Sound Playback)

**How Focus Mode uses it:** Creates an offscreen document for ambient sound playback. MV3 service workers cannot access the Audio API, so an offscreen document provides a DOM context for `<audio>` element playback. The `OffscreenBridge` module manages the document lifecycle -- creating it when sounds start, destroying it when sounds stop, and communicating via message passing.

| Browser | Support Level | Notes |
|---------|-------------|-------|
| **Chrome 109+** | Full | `offscreen.createDocument`, `offscreen.closeDocument`, `offscreen.Reason.AUDIO_PLAYBACK` |
| **Edge 109+** | Full | Same as Chrome |
| **Firefox** | **Not supported** | Firefox does not support the offscreen API. Firefox's MV2 background pages have full DOM access, so offscreen documents are unnecessary. In Firefox MV3, the recommended alternative is to use a hidden background page or an extension page opened in a hidden popup. |
| **Safari** | **Not supported** | Safari does not support the offscreen API. Audio playback must go through the native app wrapper or a hidden extension page. |
| **Brave** | Full | Same as Chrome |

**Risk assessment for Focus Mode:**

| Feature | Risk Level | Issue |
|---------|-----------|-------|
| Ambient sound playback | HIGH | Firefox and Safari have no offscreen API. Alternative architectures needed. |
| Sound mixing (Pro, 3 simultaneous) | HIGH | Same issue, compounded by needing multiple audio streams |

**Required workaround -- Firefox audio playback:**
Firefox MV2: Use the background page's DOM directly (it has full `Audio` API access).
Firefox MV3: Open a hidden extension page (`chrome.windows.create` with `type: "popup"` and very small dimensions, or use a tab that auto-minimizes) to serve as the audio context.

**Required workaround -- Safari audio playback:**
Route audio commands to the native app wrapper via `runtime.sendNativeMessage`. The native Swift/Objective-C code plays audio using `AVAudioPlayer`. This provides the best macOS integration (respects system volume, appears in Now Playing).

### 2.3 Critical Risk Summary

| Risk Level | Features Affected | Browsers | Mitigation Complexity |
|------------|------------------|----------|----------------------|
| **CRITICAL** | Block page redirect URL in DNR rules | Safari, Firefox | Medium -- use `runtime.getURL()` dynamically per browser |
| **HIGH** | `storage.session` (timer state, ephemeral data) | Safari | Medium -- fallback to prefixed `storage.local` with cleanup |
| **HIGH** | Offscreen document (ambient sounds) | Firefox, Safari | High -- alternative audio architectures per browser |
| **HIGH** | Notifications | Safari | High -- requires native app wrapper integration |
| **MEDIUM** | `storage.sync` actual syncing | Safari (no real sync), Firefox (requires account) | Medium -- server-side sync for Pro cross-device |
| **MEDIUM** | Session rules (Quick Focus) | Firefox MV2 | Low -- fallback to dynamic rules with alarm-based cleanup |
| **MEDIUM** | `scripting.executeScript` with `func` | Safari | Low -- already using `files` approach |
| **LOW** | Context menus namespace | Firefox (`menus` vs `contextMenus`) | Low -- polyfill handles this |
| **LOW** | Action vs browserAction | Firefox MV2 | Low -- polyfill handles this |

---

## 3. WebExtension Polyfill Integration Plan

### 3.1 Why webextension-polyfill

Mozilla's [webextension-polyfill](https://github.com/nicedayfor/webextension-polyfill) (originally `mozilla/webextension-polyfill`) provides a unified `browser.*` namespace that wraps Chrome's callback-based `chrome.*` API with Promise-based equivalents. It allows writing cross-browser code that works in Chrome (callbacks), Firefox (native Promises), and other browsers without conditional logic for each API call.

**Key benefits for Focus Mode - Blocker:**
1. Write `browser.storage.local.get(key)` once instead of managing callbacks (Chrome) vs Promises (Firefox)
2. Automatically handles `chrome.*` vs `browser.*` namespace differences
3. Handles Firefox's `menus` vs Chrome's `contextMenus` aliasing
4. Handles `browserAction` vs `action` for Firefox MV2 compatibility
5. Well-tested by the Firefox and Chrome extension communities

**What it does NOT handle:**
- API differences in `declarativeNetRequest` (redirect URL schemes, rule limits)
- Missing APIs (`offscreen`, `storage.session`)
- Safari-specific native messaging for notifications
- Browser-specific manifest format differences

These unhandled cases are why Focus Mode needs the abstraction layer described in Section 5, on top of the polyfill.

### 3.2 Installation and Build Integration

```bash
# Install via npm
npm install webextension-polyfill

# Or via yarn
yarn add webextension-polyfill
```

**Vite build configuration update:**

```typescript
// vite.config.ts -- add polyfill resolution
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        'service-worker': resolve(__dirname, 'src/background/service-worker.ts'),
        'popup': resolve(__dirname, 'src/popup/popup.html'),
        'options': resolve(__dirname, 'src/options/options.html'),
        'blocked': resolve(__dirname, 'src/pages/blocked/blocked.html'),
        'onboarding': resolve(__dirname, 'src/pages/onboarding/onboarding.html'),
        'detector': resolve(__dirname, 'src/content/detector.ts'),
        'blocker': resolve(__dirname, 'src/content/blocker.ts'),
        'tracker': resolve(__dirname, 'src/content/tracker.ts'),
      },
    },
  },
  resolve: {
    alias: {
      // Allow import browser from 'webextension-polyfill' in all modules
      'webextension-polyfill': 'webextension-polyfill/dist/browser-polyfill.min.js',
    },
  },
});
```

### 3.3 Files Requiring Modification

Every file that calls `chrome.*` APIs needs to import the polyfill and switch to `browser.*`. Here is the complete list organized by component:

#### Service Worker Modules (18 files)

| File | Chrome APIs Used | Change Required |
|------|-----------------|-----------------|
| `service-worker.ts` | `chrome.runtime.onInstalled`, `chrome.runtime.onStartup` | Import polyfill, use `browser.runtime` |
| `alarm-manager.ts` | `chrome.alarms.*` | `browser.alarms.*` |
| `badge-manager.ts` | `chrome.action.setBadgeText`, `setBadgeBackgroundColor`, `setIcon` | `browser.action.*` (MV3) or `browser.browserAction.*` (MV2) via polyfill |
| `blocking-engine.ts` | `chrome.declarativeNetRequest.*` | Custom wrapper (polyfill does not cover DNR) |
| `context-menu.ts` | `chrome.contextMenus.create`, `onClicked` | `browser.contextMenus.*` (polyfill aliases `menus`) |
| `daily-reset.ts` | `chrome.alarms`, `chrome.storage.local` | `browser.alarms`, `browser.storage.local` |
| `focus-session.ts` | `chrome.storage.session`, `chrome.alarms` | Custom session storage wrapper + `browser.alarms` |
| `install-handler.ts` | `chrome.runtime.onInstalled` | `browser.runtime.onInstalled` |
| `message-router.ts` | `chrome.runtime.onMessage`, `chrome.runtime.onConnect` | `browser.runtime.onMessage`, `browser.runtime.onConnect` |
| `notification-manager.ts` | `chrome.notifications.*` | Custom notification wrapper (Safari fallback) |
| `offscreen-bridge.ts` | `chrome.offscreen.*` | Custom offscreen wrapper (Firefox/Safari fallback) |
| `quota-tracker.ts` | `chrome.declarativeNetRequest.getDynamicRules` | Custom DNR wrapper |
| `rule-compiler.ts` | `chrome.declarativeNetRequest.*` | Custom DNR wrapper |
| `schedule-engine.ts` | `chrome.alarms`, `chrome.storage.local` | `browser.alarms`, `browser.storage.local` |
| `state-manager.ts` | `chrome.storage.session` | Custom session storage wrapper |
| `stats-aggregator.ts` | `chrome.storage.local` | `browser.storage.local` |
| `storage-sync.ts` | `chrome.storage.sync` | `browser.storage.sync` with fallback |
| `idle-detector.ts` | `chrome.idle.*` | `browser.idle.*` |

#### Content Scripts (3 files)

| File | Chrome APIs Used | Change Required |
|------|-----------------|-----------------|
| `detector.ts` | `chrome.runtime.sendMessage`, `chrome.runtime.lastError` | `browser.runtime.sendMessage` (Promise-based, no lastError) |
| `blocker.ts` | `chrome.runtime.sendMessage`, `chrome.runtime.getURL` | `browser.runtime.sendMessage`, `browser.runtime.getURL` |
| `tracker.ts` | `chrome.runtime.sendMessage` | `browser.runtime.sendMessage` |

#### Popup (3 files)

| File | Chrome APIs Used | Change Required |
|------|-----------------|-----------------|
| `popup.ts` | `chrome.runtime.connect`, `chrome.runtime.sendMessage`, `chrome.storage.local.get` | `browser.runtime.connect`, `browser.runtime.sendMessage`, `browser.storage.local.get` |
| `popup-state.ts` | `chrome.storage.local.get`, `chrome.storage.onChanged` | `browser.storage.local.get`, `browser.storage.onChanged` |
| `message-bridge.ts` | `chrome.runtime.connect` | `browser.runtime.connect` |

#### Options Page (5 files)

| File | Chrome APIs Used | Change Required |
|------|-----------------|-----------------|
| `options.ts` | `chrome.storage.local`, `chrome.runtime.sendMessage` | `browser.storage.local`, `browser.runtime.sendMessage` |
| `blocklist-tab.ts` | `chrome.storage.local`, `chrome.runtime.sendMessage` | `browser.storage.local`, `browser.runtime.sendMessage` |
| `schedule-tab.ts` | `chrome.storage.local`, `chrome.runtime.sendMessage` | `browser.storage.local`, `browser.runtime.sendMessage` |
| `general-tab.ts` | `chrome.storage.local` | `browser.storage.local` |
| `data-tab.ts` | `chrome.storage.local`, `chrome.storage.sync` | `browser.storage.local`, `browser.storage.sync` |

#### Extension Pages (4 files)

| File | Chrome APIs Used | Change Required |
|------|-----------------|-----------------|
| `blocked.ts` | `chrome.runtime.sendMessage`, `chrome.runtime.getURL` | `browser.runtime.sendMessage`, `browser.runtime.getURL` |
| `onboarding.ts` | `chrome.runtime.sendMessage`, `chrome.storage.local`, `chrome.tabs.create` | `browser.runtime.sendMessage`, `browser.storage.local`, `browser.tabs.create` |

#### Shared Utilities (3 files)

| File | Chrome APIs Used | Change Required |
|------|-----------------|-----------------|
| `storage-helpers.ts` | `chrome.storage.local`, `chrome.storage.sync`, `chrome.storage.session` | Custom storage wrapper |
| `message-helpers.ts` | `chrome.runtime.sendMessage`, `chrome.runtime.onMessage` | `browser.runtime.sendMessage`, `browser.runtime.onMessage` |
| `logger.ts` | `chrome.runtime.id` (for log prefixing) | `browser.runtime.id` |

### 3.4 Promise vs Callback Patterns in Existing Code

Focus Mode - Blocker's codebase currently uses Chrome's callback-based API pattern in some modules and the Chrome MV3 Promise-based pattern (available since Chrome 116) in others. The polyfill normalizes everything to Promises.

**Current patterns found in the codebase:**

```typescript
// Pattern 1: Callback-based (legacy Chrome style)
// Found in: detector.ts, some service worker modules
chrome.runtime.sendMessage({ type: 'CHECK_BLOCKED', payload }, (response) => {
  if (chrome.runtime.lastError) return;
  // handle response
});

// Pattern 2: Promise-based (Chrome MV3 style, already used in newer modules)
// Found in: storage-helpers.ts, options page modules
const data = await chrome.storage.local.get(['settings', 'blocklist']);
```

**After polyfill integration, all code should use:**

```typescript
// Unified Promise-based pattern via polyfill
import browser from 'webextension-polyfill';

// sendMessage returns a Promise -- no callback, no lastError
try {
  const response = await browser.runtime.sendMessage({
    type: 'CHECK_BLOCKED',
    payload
  });
  // handle response
} catch (error) {
  // replaces chrome.runtime.lastError
  console.warn('Message send failed:', error);
}

// storage is already Promise-based
const data = await browser.storage.local.get(['settings', 'blocklist']);
```

**Migration steps:**
1. Replace all `chrome.runtime.lastError` checks with try/catch around await
2. Replace all callback-based `chrome.*` calls with `await browser.*` calls
3. Replace all `chrome.` namespace references with `browser.` from the polyfill import
4. Ensure all event listeners use the polyfill's listener pattern (same API surface)

### 3.5 Browser Detection Utility

While the polyfill handles most namespace differences, Focus Mode needs to detect the current browser for cases the polyfill cannot solve: DNR redirect URL schemes, offscreen API availability, notification fallbacks, and Safari native messaging.

```typescript
// src/shared/browser-detect.ts

export type BrowserName = 'chrome' | 'edge' | 'firefox' | 'safari' | 'brave' | 'opera' | 'unknown';

export interface BrowserInfo {
  name: BrowserName;
  version: string;
  manifestVersion: 2 | 3;
  isChromium: boolean;
  supportsDNR: boolean;
  supportsSessionStorage: boolean;
  supportsOffscreen: boolean;
  supportsNotifications: boolean;
  supportsSessionRules: boolean;
}

/**
 * Detect the current browser and its capabilities.
 *
 * Detection strategy:
 * 1. Check for browser-specific global objects or navigator.userAgent tokens
 * 2. Feature-detect critical APIs rather than relying solely on UA strings
 * 3. Cache the result since it never changes during a session
 */
let cachedBrowserInfo: BrowserInfo | null = null;

export function getBrowserInfo(): BrowserInfo {
  if (cachedBrowserInfo) return cachedBrowserInfo;

  const ua = navigator.userAgent;
  let name: BrowserName = 'unknown';
  let version = '0';

  // Detection order matters -- more specific checks first
  if (typeof (globalThis as any).safari !== 'undefined' ||
      ua.includes('Safari') && !ua.includes('Chrome') && !ua.includes('Chromium')) {
    name = 'safari';
    const match = ua.match(/Version\/(\d+\.\d+)/);
    version = match ? match[1] : '0';
  } else if ((navigator as any).brave && typeof (navigator as any).brave.isBrave === 'function') {
    name = 'brave';
    const match = ua.match(/Chrome\/(\d+)/);
    version = match ? match[1] : '0';
  } else if (ua.includes('Edg/')) {
    name = 'edge';
    const match = ua.match(/Edg\/(\d+)/);
    version = match ? match[1] : '0';
  } else if (ua.includes('OPR/') || ua.includes('Opera')) {
    name = 'opera';
    const match = ua.match(/OPR\/(\d+)/);
    version = match ? match[1] : '0';
  } else if (typeof (globalThis as any).InstallTrigger !== 'undefined' || ua.includes('Firefox')) {
    name = 'firefox';
    const match = ua.match(/Firefox\/(\d+)/);
    version = match ? match[1] : '0';
  } else if (ua.includes('Chrome/')) {
    name = 'chrome';
    const match = ua.match(/Chrome\/(\d+)/);
    version = match ? match[1] : '0';
  }

  const isChromium = ['chrome', 'edge', 'brave', 'opera'].includes(name);
  const manifestVersion = chrome.runtime.getManifest().manifest_version as 2 | 3;

  cachedBrowserInfo = {
    name,
    version,
    manifestVersion,
    isChromium,
    // Feature-detected capabilities
    supportsDNR: typeof chrome.declarativeNetRequest !== 'undefined',
    supportsSessionStorage: typeof chrome.storage?.session !== 'undefined',
    supportsOffscreen: typeof (chrome as any).offscreen !== 'undefined',
    supportsNotifications: typeof chrome.notifications !== 'undefined',
    supportsSessionRules: typeof chrome.declarativeNetRequest?.getSessionRules === 'function',
  };

  return cachedBrowserInfo;
}
```

---

## 4. Feature Detection and Graceful Degradation

### 4.1 Feature Detection Patterns for Focus Mode

Rather than branching on browser name, Focus Mode should detect capabilities at runtime. This is more robust because browser versions change, new browsers emerge, and feature flags vary.

```typescript
// src/shared/feature-detect.ts
import browser from 'webextension-polyfill';

export const Features = {
  /**
   * declarativeNetRequest -- required for core blocking.
   * Available: Chrome 84+, Edge 84+, Firefox 128+ (MV3), Safari 17.4+, Brave
   */
  get declarativeNetRequest(): boolean {
    return typeof chrome.declarativeNetRequest !== 'undefined'
      && typeof chrome.declarativeNetRequest.updateDynamicRules === 'function';
  },

  /**
   * Session rules (Quick Focus temporary blocks)
   * Available: Chrome 84+, Edge 84+, Firefox 128+ (MV3), Brave
   * NOT available: Firefox MV2, Safari (limited)
   */
  get sessionRules(): boolean {
    return typeof chrome.declarativeNetRequest?.getSessionRules === 'function';
  },

  /**
   * storage.session (ephemeral state)
   * Available: Chrome 102+, Edge 102+, Firefox 115+ (MV3), Brave
   * NOT available: Safari, Firefox MV2
   */
  get sessionStorage(): boolean {
    return typeof chrome.storage?.session !== 'undefined';
  },

  /**
   * offscreen documents (audio playback)
   * Available: Chrome 109+, Edge 109+, Brave
   * NOT available: Firefox, Safari
   */
  get offscreenDocuments(): boolean {
    return typeof (chrome as any).offscreen?.createDocument === 'function';
  },

  /**
   * Native notifications via extension API
   * Available: Chrome, Edge, Firefox, Brave
   * NOT available: Safari (requires native messaging)
   */
  get notifications(): boolean {
    return typeof chrome.notifications?.create === 'function';
  },

  /**
   * Notification action buttons
   * Available: Chrome, Edge, Brave
   * NOT available: Firefox (ignored), Safari (no notifications API)
   */
  get notificationButtons(): boolean {
    // Firefox silently ignores buttons -- detect via browser check
    return Features.notifications && !navigator.userAgent.includes('Firefox');
  },

  /**
   * scripting.executeScript with func parameter
   * Available: Chrome, Edge, Firefox MV3, Brave
   * Unreliable: Safari
   */
  get scriptingWithFunc(): boolean {
    // Safari does not reliably support the func parameter
    if (typeof (globalThis as any).safari !== 'undefined') return false;
    return typeof chrome.scripting?.executeScript === 'function';
  },

  /**
   * storage.sync with actual cross-device sync
   * Available: Chrome (with Google account), Firefox (with Firefox Account)
   * NOT available: Safari (falls back to local), Brave (no sync service)
   */
  get realSync(): boolean {
    // This cannot be feature-detected -- it depends on whether the user
    // has signed into their browser's sync service. Treat as unreliable
    // and always provide server-side sync as the Pro cross-device solution.
    return typeof chrome.storage?.sync !== 'undefined';
  },

  /**
   * Service worker (MV3) vs background page (MV2)
   */
  get serviceWorker(): boolean {
    return chrome.runtime.getManifest().manifest_version === 3;
  },
};
```

### 4.2 Fallback Strategies

#### 4.2.1 Blocking Engine Fallback (declarativeNetRequest unavailable)

If `declarativeNetRequest` is not available (extremely unlikely on target browsers, but possible on very old Firefox MV2 builds), Focus Mode can fall back to the legacy `webRequest` blocking API.

```typescript
// src/background/blocking-adapter.ts

import { Features } from '../shared/feature-detect';
import browser from 'webextension-polyfill';

interface BlockingAdapter {
  addBlockRule(domain: string, redirectUrl: string): Promise<void>;
  removeBlockRule(domain: string): Promise<void>;
  getActiveRules(): Promise<string[]>;
  clearAllRules(): Promise<void>;
}

function createDNRAdapter(): BlockingAdapter {
  // Primary: declarativeNetRequest (Chrome, Edge, Firefox MV3, Safari, Brave)
  return {
    async addBlockRule(domain, redirectUrl) {
      const ruleId = hashDomainToId(domain);
      await chrome.declarativeNetRequest.updateDynamicRules({
        addRules: [{
          id: ruleId,
          priority: 2,
          action: { type: 'redirect', redirect: { url: redirectUrl } },
          condition: {
            urlFilter: `||${domain}`,
            resourceTypes: ['main_frame'],
          },
        }],
        removeRuleIds: [ruleId],
      });
    },
    async removeBlockRule(domain) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [hashDomainToId(domain)],
      });
    },
    async getActiveRules() {
      const rules = await chrome.declarativeNetRequest.getDynamicRules();
      return rules.map(r => r.condition.urlFilter?.replace('||', '') || '');
    },
    async clearAllRules() {
      const rules = await chrome.declarativeNetRequest.getDynamicRules();
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: rules.map(r => r.id),
      });
    },
  };
}

function createWebRequestAdapter(): BlockingAdapter {
  // Fallback: webRequest blocking (Firefox MV2 only)
  const blockedDomains = new Set<string>();

  // Register blocking listener
  browser.webRequest.onBeforeRequest.addListener(
    (details) => {
      const url = new URL(details.url);
      const domain = url.hostname.replace(/^www\./, '');
      if (blockedDomains.has(domain)) {
        return { redirectUrl: browser.runtime.getURL('src/pages/blocked/blocked.html') + `?domain=${domain}` };
      }
    },
    { urls: ['<all_urls>'], types: ['main_frame'] },
    ['blocking']
  );

  return {
    async addBlockRule(domain) {
      blockedDomains.add(domain);
    },
    async removeBlockRule(domain) {
      blockedDomains.delete(domain);
    },
    async getActiveRules() {
      return Array.from(blockedDomains);
    },
    async clearAllRules() {
      blockedDomains.clear();
    },
  };
}

export function createBlockingAdapter(): BlockingAdapter {
  if (Features.declarativeNetRequest) {
    return createDNRAdapter();
  }
  return createWebRequestAdapter();
}

function hashDomainToId(domain: string): number {
  // Simple hash to generate consistent rule IDs from domain strings
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = ((hash << 5) - hash + domain.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 9999 + 1; // Keep within CUSTOM_BLOCKLIST range (1-9999)
}
```

#### 4.2.2 Nuclear Mode Across Browsers

Nuclear Mode must be equally unbypassable across all browsers. Focus Mode's 6 tamper-resistance layers have varying browser support:

| Tamper-Resistance Layer | Chrome/Edge/Brave | Firefox | Safari |
|------------------------|-------------------|---------|--------|
| 1. DNR rules protected from removal | YES -- dynamic rules persist independently of service worker | YES -- dynamic rules persist | YES -- dynamic rules persist |
| 2. Alarm-based rule integrity checks | YES -- `chrome.alarms` re-verifies rules periodically | YES -- `browser.alarms` works | YES -- alarms work (with delay caveat) |
| 3. Content script reinforcement | YES -- static content scripts always run | YES -- same | YES -- same, but requires user permission grant |
| 4. Options page lockout | YES -- popup/options detect nuclear state from storage | YES -- same | YES -- same |
| 5. Uninstall friction | YES -- `chrome.runtime.setUninstallURL` shows survey/warning | YES -- same API | PARTIAL -- Safari may not honor `setUninstallURL` consistently |
| 6. Service worker self-healing | YES -- alarm wakes SW to re-apply rules if tampered | YES -- same pattern | YES -- same pattern |

**Key difference:** On Firefox MV2 (without session rules), Nuclear Mode's redundant session rule copies (Layer 1 backup) must use dynamic rules instead. This means Nuclear Mode cleanup on expiry must be more careful to remove only the Nuclear-range dynamic rules (IDs 20,000-24,999) without affecting the user's regular blocklist.

**Safari-specific concern:** If the user revokes the extension's permission on a specific site via Safari preferences, that site's blocking stops regardless of DNR rules. There is no programmatic way to prevent this in Safari. The mitigation is a clear onboarding message: "For Nuclear Mode to work fully, grant Focus Mode permission on All Websites in Safari settings."

#### 4.2.3 Focus Score and Streak Persistence

Focus Score and streak data live in `chrome.storage.local`, which works identically across all browsers. The risk is in Focus Score's real-time calculation, which uses `storage.session` for intermediate state.

**Fallback for Safari (no `storage.session`):**

```typescript
// In focus-score.ts
import { Features } from '../shared/feature-detect';
import browser from 'webextension-polyfill';

const SESSION_KEY_PREFIX = '__session_';

async function saveFocusScoreProgress(progress: FocusScoreProgress): Promise<void> {
  if (Features.sessionStorage) {
    await chrome.storage.session.set({ focusScoreProgress: progress });
  } else {
    // Safari fallback: use storage.local with session prefix
    await browser.storage.local.set({
      [SESSION_KEY_PREFIX + 'focusScoreProgress']: progress,
    });
  }
}

async function loadFocusScoreProgress(): Promise<FocusScoreProgress | null> {
  if (Features.sessionStorage) {
    const data = await chrome.storage.session.get('focusScoreProgress');
    return data.focusScoreProgress || null;
  } else {
    const key = SESSION_KEY_PREFIX + 'focusScoreProgress';
    const data = await browser.storage.local.get(key);
    return data[key] || null;
  }
}
```

**Streak persistence** is not affected because streaks use `storage.local` exclusively.

#### 4.2.4 Notification Fallbacks for Safari

Safari web extensions have no access to `chrome.notifications`. Focus Mode must provide three levels of notification fallback:

```typescript
// src/background/notification-adapter.ts

import { Features } from '../shared/feature-detect';
import { getBrowserInfo } from '../shared/browser-detect';
import browser from 'webextension-polyfill';

interface NotificationAdapter {
  show(id: string, options: NotificationOptions): Promise<void>;
  clear(id: string): Promise<void>;
}

interface NotificationOptions {
  title: string;
  message: string;
  iconUrl?: string;
  buttons?: Array<{ title: string }>;
}

function createChromeNotificationAdapter(): NotificationAdapter {
  return {
    async show(id, options) {
      await browser.notifications.create(id, {
        type: 'basic',
        title: options.title,
        message: options.message,
        iconUrl: options.iconUrl || browser.runtime.getURL('src/assets/icons/icon-128.png'),
        buttons: Features.notificationButtons ? options.buttons : undefined,
      });
    },
    async clear(id) {
      await browser.notifications.clear(id);
    },
  };
}

function createSafariNativeNotificationAdapter(): NotificationAdapter {
  // Safari: Send notification request to native app wrapper
  return {
    async show(id, options) {
      try {
        await browser.runtime.sendNativeMessage('com.zovo.focusmode', {
          action: 'showNotification',
          id,
          title: options.title,
          body: options.message,
          // Native app posts UNNotification to macOS notification center
        });
      } catch (error) {
        // If native messaging fails, fall back to in-extension notification
        // (e.g., badge flash or popup toast on next open)
        console.warn('Native notification failed, queuing for popup display:', error);
        await browser.storage.local.set({
          pendingNotifications: [
            ...(await getPendingNotifications()),
            { id, ...options, timestamp: Date.now() },
          ],
        });
      }
    },
    async clear(id) {
      await browser.runtime.sendNativeMessage('com.zovo.focusmode', {
        action: 'clearNotification',
        id,
      });
    },
  };
}

function createFallbackNotificationAdapter(): NotificationAdapter {
  // Last resort: queue notifications for display in popup/badge
  return {
    async show(id, options) {
      const pending = await getPendingNotifications();
      pending.push({ id, ...options, timestamp: Date.now() });
      await browser.storage.local.set({ pendingNotifications: pending });
      // Flash the badge to indicate pending notification
      await browser.action.setBadgeText({ text: '!' });
      await browser.action.setBadgeBackgroundColor({ color: '#f59e0b' });
    },
    async clear(id) {
      const pending = await getPendingNotifications();
      await browser.storage.local.set({
        pendingNotifications: pending.filter(n => n.id !== id),
      });
    },
  };
}

async function getPendingNotifications(): Promise<any[]> {
  const data = await browser.storage.local.get('pendingNotifications');
  return data.pendingNotifications || [];
}

export function createNotificationAdapter(): NotificationAdapter {
  if (Features.notifications) {
    return createChromeNotificationAdapter();
  }
  const info = getBrowserInfo();
  if (info.name === 'safari') {
    return createSafariNativeNotificationAdapter();
  }
  return createFallbackNotificationAdapter();
}
```

---

## 5. Cross-Browser API Abstraction Layer

### 5.1 BrowserAPI Class Design

The `BrowserAPI` class is Focus Mode - Blocker's unified interface for all browser-specific operations. It sits between the application logic (service worker modules, UI components) and the raw browser APIs, providing consistent behavior regardless of the underlying platform.

**Architecture principle:** Application code should never call `chrome.*` or `browser.*` directly. All browser interaction goes through `BrowserAPI`, which internally delegates to platform-specific adapters created during initialization.

```
Application Layer (service worker, popup, options, content scripts)
         |
         v
   BrowserAPI (unified interface)
         |
         +---> BlockingAdapter (DNR or webRequest)
         +---> StorageAdapter (local, sync, session with fallbacks)
         +---> NotificationAdapter (native, Safari native messaging, or fallback)
         +---> AudioAdapter (offscreen, background page, or native)
         +---> ScriptingAdapter (MV3 scripting or MV2 tabs.executeScript)
         +---> AlarmAdapter (thin wrapper, mostly consistent)
         +---> TabAdapter (thin wrapper, Safari permission quirks)
         |
         v
   Raw Browser APIs (chrome.*, browser.*)
```

### 5.2 Complete BrowserAPI Class

```typescript
// src/shared/browser-api.ts

import browser from 'webextension-polyfill';
import { getBrowserInfo, BrowserInfo } from './browser-detect';
import { Features } from './feature-detect';

// ─── Adapter Interfaces ──────────────────────────────────────────────────────

export interface BlockRule {
  id: number;
  domain: string;
  priority: number;
  category: string; // 'custom' | 'schedule' | 'nuclear' | 'category' | 'quickfocus'
}

export interface BlockingAdapter {
  addRules(rules: BlockRule[], redirectUrl: string): Promise<void>;
  removeRules(ruleIds: number[]): Promise<void>;
  getRules(category?: string): Promise<BlockRule[]>;
  clearAllRules(): Promise<void>;
  addSessionRules(rules: BlockRule[], redirectUrl: string): Promise<void>;
  removeSessionRules(ruleIds: number[]): Promise<void>;
  getRuleCount(): Promise<{ dynamic: number; session: number }>;
}

export interface StorageAdapter {
  local: {
    get(keys: string | string[]): Promise<Record<string, any>>;
    set(items: Record<string, any>): Promise<void>;
    remove(keys: string | string[]): Promise<void>;
    clear(): Promise<void>;
  };
  sync: {
    get(keys: string | string[]): Promise<Record<string, any>>;
    set(items: Record<string, any>): Promise<void>;
    remove(keys: string | string[]): Promise<void>;
  };
  session: {
    get(keys: string | string[]): Promise<Record<string, any>>;
    set(items: Record<string, any>): Promise<void>;
    remove(keys: string | string[]): Promise<void>;
    clear(): Promise<void>;
  };
  onChanged: typeof browser.storage.onChanged;
}

export interface NotificationOptions {
  title: string;
  message: string;
  iconUrl?: string;
  buttons?: Array<{ title: string }>;
  priority?: number;
}

export interface NotificationAdapter {
  create(id: string, options: NotificationOptions): Promise<void>;
  clear(id: string): Promise<void>;
  onClicked: {
    addListener(callback: (notificationId: string) => void): void;
  };
  onButtonClicked: {
    addListener(callback: (notificationId: string, buttonIndex: number) => void): void;
  };
}

export interface AudioAdapter {
  play(soundUrl: string, options?: { loop?: boolean; volume?: number }): Promise<void>;
  stop(): Promise<void>;
  setVolume(volume: number): Promise<void>;
  isPlaying(): Promise<boolean>;
}

export interface AlarmInfo {
  name: string;
  scheduledTime: number;
  periodInMinutes?: number;
}

export interface AlarmAdapter {
  create(name: string, info: { delayInMinutes?: number; periodInMinutes?: number; when?: number }): Promise<void>;
  clear(name: string): Promise<boolean>;
  clearAll(): Promise<boolean>;
  get(name: string): Promise<AlarmInfo | undefined>;
  getAll(): Promise<AlarmInfo[]>;
  onAlarm: {
    addListener(callback: (alarm: AlarmInfo) => void): void;
  };
}

export interface TabAdapter {
  query(queryInfo: browser.Tabs.QueryQueryInfoType): Promise<browser.Tabs.Tab[]>;
  update(tabId: number, updateProperties: browser.Tabs.UpdateUpdatePropertiesType): Promise<browser.Tabs.Tab>;
  create(createProperties: browser.Tabs.CreateCreatePropertiesType): Promise<browser.Tabs.Tab>;
  remove(tabIds: number | number[]): Promise<void>;
  onUpdated: typeof browser.tabs.onUpdated;
  onActivated: typeof browser.tabs.onActivated;
}

// ─── BrowserAPI Class ────────────────────────────────────────────────────────

export class BrowserAPI {
  private static instance: BrowserAPI | null = null;

  public readonly info: BrowserInfo;
  public readonly blocking: BlockingAdapter;
  public readonly storage: StorageAdapter;
  public readonly notifications: NotificationAdapter;
  public readonly audio: AudioAdapter;
  public readonly alarms: AlarmAdapter;
  public readonly tabs: TabAdapter;

  private constructor() {
    this.info = getBrowserInfo();

    // Initialize adapters based on detected capabilities
    this.blocking = this.createBlockingAdapter();
    this.storage = this.createStorageAdapter();
    this.notifications = this.createNotificationAdapter();
    this.audio = this.createAudioAdapter();
    this.alarms = this.createAlarmAdapter();
    this.tabs = this.createTabAdapter();
  }

  static getInstance(): BrowserAPI {
    if (!BrowserAPI.instance) {
      BrowserAPI.instance = new BrowserAPI();
    }
    return BrowserAPI.instance;
  }

  // ─── Blocking Adapter Factory ───────────────────────────────────────────

  private createBlockingAdapter(): BlockingAdapter {
    if (!Features.declarativeNetRequest) {
      return this.createWebRequestBlockingAdapter();
    }
    return this.createDNRBlockingAdapter();
  }

  private createDNRBlockingAdapter(): BlockingAdapter {
    return {
      async addRules(rules, redirectUrl) {
        const dnrRules = rules.map(rule => ({
          id: rule.id,
          priority: rule.priority,
          action: {
            type: 'redirect' as chrome.declarativeNetRequest.RuleActionType,
            redirect: {
              url: `${redirectUrl}?domain=${encodeURIComponent(rule.domain)}&reason=${rule.category}`,
            },
          },
          condition: {
            urlFilter: `||${rule.domain}`,
            resourceTypes: ['main_frame' as chrome.declarativeNetRequest.ResourceType],
          },
        }));

        await chrome.declarativeNetRequest.updateDynamicRules({
          addRules: dnrRules,
          removeRuleIds: rules.map(r => r.id),
        });
      },

      async removeRules(ruleIds) {
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: ruleIds,
        });
      },

      async getRules(category) {
        const rules = await chrome.declarativeNetRequest.getDynamicRules();
        const mapped = rules.map(r => ({
          id: r.id,
          domain: (r.condition.urlFilter || '').replace('||', ''),
          priority: r.priority,
          category: categorizeRuleId(r.id),
        }));
        if (category) {
          return mapped.filter(r => r.category === category);
        }
        return mapped;
      },

      async clearAllRules() {
        const rules = await chrome.declarativeNetRequest.getDynamicRules();
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: rules.map(r => r.id),
        });
      },

      async addSessionRules(rules, redirectUrl) {
        if (!Features.sessionRules) {
          // Fallback: use dynamic rules with a special prefix range
          // These will be cleaned up on browser restart via onStartup
          return this.addRules(rules, redirectUrl);
        }
        const dnrRules = rules.map(rule => ({
          id: rule.id,
          priority: rule.priority,
          action: {
            type: 'redirect' as chrome.declarativeNetRequest.RuleActionType,
            redirect: {
              url: `${redirectUrl}?domain=${encodeURIComponent(rule.domain)}&reason=${rule.category}`,
            },
          },
          condition: {
            urlFilter: `||${rule.domain}`,
            resourceTypes: ['main_frame' as chrome.declarativeNetRequest.ResourceType],
          },
        }));
        await chrome.declarativeNetRequest.updateSessionRules({
          addRules: dnrRules,
          removeRuleIds: rules.map(r => r.id),
        });
      },

      async removeSessionRules(ruleIds) {
        if (!Features.sessionRules) {
          return this.removeRules(ruleIds);
        }
        await chrome.declarativeNetRequest.updateSessionRules({
          removeRuleIds: ruleIds,
        });
      },

      async getRuleCount() {
        const dynamicRules = await chrome.declarativeNetRequest.getDynamicRules();
        let sessionCount = 0;
        if (Features.sessionRules) {
          const sessionRules = await chrome.declarativeNetRequest.getSessionRules();
          sessionCount = sessionRules.length;
        }
        return {
          dynamic: dynamicRules.length,
          session: sessionCount,
        };
      },
    };
  }

  private createWebRequestBlockingAdapter(): BlockingAdapter {
    // MV2 Firefox fallback using webRequest
    const activeDomains = new Map<number, string>();

    browser.webRequest.onBeforeRequest.addListener(
      (details) => {
        const url = new URL(details.url);
        const domain = url.hostname.replace(/^www\./, '');
        for (const [, blockedDomain] of activeDomains) {
          if (domain === blockedDomain || domain.endsWith('.' + blockedDomain)) {
            return {
              redirectUrl: browser.runtime.getURL('src/pages/blocked/blocked.html')
                + `?domain=${encodeURIComponent(blockedDomain)}&reason=blocklist`,
            };
          }
        }
      },
      { urls: ['<all_urls>'], types: ['main_frame'] },
      ['blocking']
    );

    return {
      async addRules(rules) {
        for (const rule of rules) {
          activeDomains.set(rule.id, rule.domain);
        }
        await browser.storage.local.set({
          __webRequestRules: Object.fromEntries(activeDomains),
        });
      },
      async removeRules(ruleIds) {
        for (const id of ruleIds) {
          activeDomains.delete(id);
        }
        await browser.storage.local.set({
          __webRequestRules: Object.fromEntries(activeDomains),
        });
      },
      async getRules(category) {
        return Array.from(activeDomains.entries()).map(([id, domain]) => ({
          id,
          domain,
          priority: 2,
          category: category || categorizeRuleId(id),
        }));
      },
      async clearAllRules() {
        activeDomains.clear();
        await browser.storage.local.remove('__webRequestRules');
      },
      async addSessionRules(rules, redirectUrl) {
        // No session rules in webRequest mode -- use regular rules
        return this.addRules(rules, redirectUrl);
      },
      async removeSessionRules(ruleIds) {
        return this.removeRules(ruleIds);
      },
      async getRuleCount() {
        return { dynamic: activeDomains.size, session: 0 };
      },
    };
  }

  // ─── Storage Adapter Factory ────────────────────────────────────────────

  private createStorageAdapter(): StorageAdapter {
    const SESSION_PREFIX = '__session_';

    const sessionFallback = {
      async get(keys: string | string[]) {
        const keyArray = typeof keys === 'string' ? [keys] : keys;
        const prefixedKeys = keyArray.map(k => SESSION_PREFIX + k);
        const result = await browser.storage.local.get(prefixedKeys);
        const unprefixed: Record<string, any> = {};
        for (const key of keyArray) {
          if (result[SESSION_PREFIX + key] !== undefined) {
            unprefixed[key] = result[SESSION_PREFIX + key];
          }
        }
        return unprefixed;
      },
      async set(items: Record<string, any>) {
        const prefixed: Record<string, any> = {};
        for (const [key, value] of Object.entries(items)) {
          prefixed[SESSION_PREFIX + key] = value;
        }
        await browser.storage.local.set(prefixed);
      },
      async remove(keys: string | string[]) {
        const keyArray = typeof keys === 'string' ? [keys] : keys;
        await browser.storage.local.remove(keyArray.map(k => SESSION_PREFIX + k));
      },
      async clear() {
        const all = await browser.storage.local.get(null);
        const sessionKeys = Object.keys(all).filter(k => k.startsWith(SESSION_PREFIX));
        if (sessionKeys.length > 0) {
          await browser.storage.local.remove(sessionKeys);
        }
      },
    };

    return {
      local: {
        get: (keys) => browser.storage.local.get(keys),
        set: (items) => browser.storage.local.set(items),
        remove: (keys) => browser.storage.local.remove(keys),
        clear: () => browser.storage.local.clear(),
      },
      sync: {
        get: (keys) => browser.storage.sync.get(keys),
        set: (items) => browser.storage.sync.set(items),
        remove: (keys) => browser.storage.sync.remove(keys),
      },
      session: Features.sessionStorage
        ? {
            get: (keys) => chrome.storage.session.get(keys),
            set: (items) => chrome.storage.session.set(items),
            remove: (keys) => chrome.storage.session.remove(keys),
            clear: () => chrome.storage.session.clear(),
          }
        : sessionFallback,
      onChanged: browser.storage.onChanged,
    };
  }

  // ─── Notification Adapter Factory ──────────────────────────────────────

  private createNotificationAdapter(): NotificationAdapter {
    if (this.info.name === 'safari') {
      return this.createSafariNotificationAdapter();
    }
    if (Features.notifications) {
      return this.createStandardNotificationAdapter();
    }
    return this.createFallbackNotificationAdapter();
  }

  private createStandardNotificationAdapter(): NotificationAdapter {
    return {
      async create(id, options) {
        await browser.notifications.create(id, {
          type: 'basic',
          title: options.title,
          message: options.message,
          iconUrl: options.iconUrl || browser.runtime.getURL('src/assets/icons/icon-128.png'),
          buttons: Features.notificationButtons ? options.buttons : undefined,
          priority: options.priority || 0,
        });
      },
      async clear(id) {
        await browser.notifications.clear(id);
      },
      onClicked: {
        addListener(callback) {
          if (browser.notifications?.onClicked) {
            browser.notifications.onClicked.addListener(callback);
          }
        },
      },
      onButtonClicked: {
        addListener(callback) {
          if (Features.notificationButtons && browser.notifications?.onButtonClicked) {
            browser.notifications.onButtonClicked.addListener(callback);
          }
        },
      },
    };
  }

  private createSafariNotificationAdapter(): NotificationAdapter {
    return {
      async create(id, options) {
        try {
          await browser.runtime.sendNativeMessage('com.zovo.focusmode', {
            action: 'showNotification',
            id,
            title: options.title,
            body: options.message,
          });
        } catch {
          // Queue for popup display
          const pending = await this.getPending();
          pending.push({ id, ...options, timestamp: Date.now() });
          await browser.storage.local.set({ __pendingNotifications: pending });
          await browser.action.setBadgeText({ text: '!' });
        }
      },
      async clear(id) {
        try {
          await browser.runtime.sendNativeMessage('com.zovo.focusmode', {
            action: 'clearNotification',
            id,
          });
        } catch {
          // Remove from pending queue
          const pending = await this.getPending();
          await browser.storage.local.set({
            __pendingNotifications: pending.filter((n: any) => n.id !== id),
          });
        }
      },
      onClicked: {
        addListener() {
          // Safari native notifications handle their own click behavior
        },
      },
      onButtonClicked: {
        addListener() {
          // Not supported in Safari native notifications
        },
      },
    };

    async function getPending(): Promise<any[]> {
      const data = await browser.storage.local.get('__pendingNotifications');
      return data.__pendingNotifications || [];
    }
  }

  private createFallbackNotificationAdapter(): NotificationAdapter {
    return {
      async create(id, options) {
        const pending = await browser.storage.local.get('__pendingNotifications');
        const list = pending.__pendingNotifications || [];
        list.push({ id, ...options, timestamp: Date.now() });
        await browser.storage.local.set({ __pendingNotifications: list });
        await browser.action.setBadgeText({ text: '!' });
        await browser.action.setBadgeBackgroundColor({ color: '#f59e0b' });
      },
      async clear(id) {
        const pending = await browser.storage.local.get('__pendingNotifications');
        const list = (pending.__pendingNotifications || []).filter((n: any) => n.id !== id);
        await browser.storage.local.set({ __pendingNotifications: list });
      },
      onClicked: { addListener() {} },
      onButtonClicked: { addListener() {} },
    };
  }

  // ─── Audio Adapter Factory ─────────────────────────────────────────────

  private createAudioAdapter(): AudioAdapter {
    if (Features.offscreenDocuments) {
      return this.createOffscreenAudioAdapter();
    }
    if (this.info.name === 'safari') {
      return this.createSafariAudioAdapter();
    }
    // Firefox: use extension page as audio context
    return this.createExtensionPageAudioAdapter();
  }

  private createOffscreenAudioAdapter(): AudioAdapter {
    // Chrome, Edge, Brave: use offscreen document
    let offscreenCreated = false;

    async function ensureOffscreen() {
      if (offscreenCreated) return;
      try {
        await (chrome as any).offscreen.createDocument({
          url: 'src/pages/offscreen/offscreen.html',
          reasons: ['AUDIO_PLAYBACK'],
          justification: 'Ambient sound playback for focus sessions',
        });
        offscreenCreated = true;
      } catch (e) {
        // Document may already exist
        if ((e as Error).message?.includes('already exists')) {
          offscreenCreated = true;
        } else {
          throw e;
        }
      }
    }

    return {
      async play(soundUrl, options) {
        await ensureOffscreen();
        await browser.runtime.sendMessage({
          type: 'OFFSCREEN_AUDIO_PLAY',
          payload: { url: soundUrl, ...options },
        });
      },
      async stop() {
        await browser.runtime.sendMessage({ type: 'OFFSCREEN_AUDIO_STOP' });
        if (offscreenCreated) {
          try {
            await (chrome as any).offscreen.closeDocument();
            offscreenCreated = false;
          } catch { /* already closed */ }
        }
      },
      async setVolume(volume) {
        await browser.runtime.sendMessage({
          type: 'OFFSCREEN_AUDIO_VOLUME',
          payload: { volume },
        });
      },
      async isPlaying() {
        const response = await browser.runtime.sendMessage({
          type: 'OFFSCREEN_AUDIO_STATUS',
        });
        return response?.playing || false;
      },
    };
  }

  private createSafariAudioAdapter(): AudioAdapter {
    // Safari: delegate to native app wrapper
    return {
      async play(soundUrl, options) {
        await browser.runtime.sendNativeMessage('com.zovo.focusmode', {
          action: 'playSound',
          url: soundUrl,
          loop: options?.loop || false,
          volume: options?.volume || 1.0,
        });
      },
      async stop() {
        await browser.runtime.sendNativeMessage('com.zovo.focusmode', {
          action: 'stopSound',
        });
      },
      async setVolume(volume) {
        await browser.runtime.sendNativeMessage('com.zovo.focusmode', {
          action: 'setVolume',
          volume,
        });
      },
      async isPlaying() {
        const response = await browser.runtime.sendNativeMessage('com.zovo.focusmode', {
          action: 'getAudioStatus',
        });
        return response?.playing || false;
      },
    };
  }

  private createExtensionPageAudioAdapter(): AudioAdapter {
    // Firefox: use a hidden extension page for audio
    let audioPageTabId: number | null = null;

    async function ensureAudioPage() {
      if (audioPageTabId !== null) {
        // Verify tab still exists
        try {
          await browser.tabs.get(audioPageTabId);
          return;
        } catch {
          audioPageTabId = null;
        }
      }
      // Create a hidden extension page
      const tab = await browser.tabs.create({
        url: browser.runtime.getURL('src/pages/audio/audio.html'),
        active: false,
        pinned: false,
      });
      audioPageTabId = tab.id || null;
    }

    return {
      async play(soundUrl, options) {
        await ensureAudioPage();
        await browser.runtime.sendMessage({
          type: 'AUDIO_PAGE_PLAY',
          payload: { url: soundUrl, ...options },
        });
      },
      async stop() {
        await browser.runtime.sendMessage({ type: 'AUDIO_PAGE_STOP' });
        if (audioPageTabId !== null) {
          try {
            await browser.tabs.remove(audioPageTabId);
          } catch { /* tab already closed */ }
          audioPageTabId = null;
        }
      },
      async setVolume(volume) {
        await browser.runtime.sendMessage({
          type: 'AUDIO_PAGE_VOLUME',
          payload: { volume },
        });
      },
      async isPlaying() {
        try {
          const response = await browser.runtime.sendMessage({
            type: 'AUDIO_PAGE_STATUS',
          });
          return response?.playing || false;
        } catch {
          return false;
        }
      },
    };
  }

  // ─── Alarm Adapter Factory ─────────────────────────────────────────────

  private createAlarmAdapter(): AlarmAdapter {
    // Alarms API is consistent across browsers -- thin wrapper
    return {
      async create(name, info) {
        await browser.alarms.create(name, info);
      },
      async clear(name) {
        return browser.alarms.clear(name);
      },
      async clearAll() {
        return browser.alarms.clearAll();
      },
      async get(name) {
        const alarm = await browser.alarms.get(name);
        return alarm ? {
          name: alarm.name,
          scheduledTime: alarm.scheduledTime,
          periodInMinutes: alarm.periodInMinutes,
        } : undefined;
      },
      async getAll() {
        const alarms = await browser.alarms.getAll();
        return alarms.map(a => ({
          name: a.name,
          scheduledTime: a.scheduledTime,
          periodInMinutes: a.periodInMinutes,
        }));
      },
      onAlarm: {
        addListener(callback) {
          browser.alarms.onAlarm.addListener((alarm) => {
            callback({
              name: alarm.name,
              scheduledTime: alarm.scheduledTime,
              periodInMinutes: alarm.periodInMinutes,
            });
          });
        },
      },
    };
  }

  // ─── Tab Adapter Factory ───────────────────────────────────────────────

  private createTabAdapter(): TabAdapter {
    // Tabs API is consistent -- thin wrapper with Safari permission awareness
    return {
      query: (queryInfo) => browser.tabs.query(queryInfo),
      update: (tabId, props) => browser.tabs.update(tabId, props),
      create: (props) => browser.tabs.create(props),
      remove: (tabIds) => browser.tabs.remove(tabIds),
      onUpdated: browser.tabs.onUpdated,
      onActivated: browser.tabs.onActivated,
    };
  }

  // ─── Utility Methods ───────────────────────────────────────────────────

  /**
   * Get the full URL for a bundled extension resource.
   * Handles scheme differences: chrome-extension://, moz-extension://, safari-web-extension://
   */
  getURL(path: string): string {
    return browser.runtime.getURL(path);
  }

  /**
   * Get the block page URL with query parameters for a specific domain.
   */
  getBlockPageURL(domain: string, reason: string): string {
    const base = this.getURL('src/pages/blocked/blocked.html');
    return `${base}?domain=${encodeURIComponent(domain)}&reason=${encodeURIComponent(reason)}`;
  }

  /**
   * Open the options page in the appropriate way for this browser.
   */
  async openOptionsPage(): Promise<void> {
    await browser.runtime.openOptionsPage();
  }

  /**
   * Send a message to the service worker / background script.
   */
  async sendMessage(message: any): Promise<any> {
    return browser.runtime.sendMessage(message);
  }

  /**
   * Create a port connection to the service worker (for real-time timer updates).
   */
  connect(connectInfo: { name: string }): browser.Runtime.Port {
    return browser.runtime.connect(connectInfo);
  }
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function categorizeRuleId(id: number): string {
  if (id >= 1 && id <= 9999) return 'custom';
  if (id >= 10000 && id <= 19999) return 'schedule';
  if (id >= 20000 && id <= 24999) return 'nuclear';
  if (id >= 25000 && id <= 27999) return 'wildcard';
  if (id >= 28000 && id <= 29999) return 'path';
  return 'unknown';
}
```

### 5.3 Error Handling for Unsupported Features

The `BrowserAPI` class handles unsupported features at the adapter level, but consuming code should also handle errors gracefully. Here is the error handling pattern used throughout Focus Mode:

```typescript
// src/shared/api-errors.ts

export class UnsupportedFeatureError extends Error {
  constructor(
    public readonly feature: string,
    public readonly browser: string,
    public readonly fallback?: string
  ) {
    super(`${feature} is not supported on ${browser}${fallback ? `. Falling back to ${fallback}.` : '.'}`);
    this.name = 'UnsupportedFeatureError';
  }
}

export class APICallError extends Error {
  constructor(
    public readonly api: string,
    public readonly originalError: Error
  ) {
    super(`${api} call failed: ${originalError.message}`);
    this.name = 'APICallError';
  }
}

/**
 * Wrap a browser API call with standardized error handling.
 * Logs errors in development, silently degrades in production.
 */
export async function safeAPICall<T>(
  apiName: string,
  fn: () => Promise<T>,
  fallbackValue: T
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[BrowserAPI] ${apiName} failed:`, error);
    }
    return fallbackValue;
  }
}
```

### 5.4 Usage Example -- How Application Code Consumes BrowserAPI

```typescript
// src/background/blocking-engine.ts -- AFTER migration to BrowserAPI

import { BrowserAPI } from '../shared/browser-api';
import type { BlockRule } from '../shared/browser-api';

const api = BrowserAPI.getInstance();

export async function addToBlocklist(domain: string): Promise<void> {
  const redirectUrl = api.getBlockPageURL(domain, 'blocklist');
  const ruleId = generateRuleId(domain);

  await api.blocking.addRules(
    [{ id: ruleId, domain, priority: 2, category: 'custom' }],
    redirectUrl
  );

  // Persist to storage
  const data = await api.storage.local.get('blocklist');
  const blocklist = data.blocklist || [];
  blocklist.push({ domain, addedAt: Date.now() });
  await api.storage.local.set({ blocklist });

  // Notify popup
  await api.sendMessage({ type: 'BLOCKLIST_UPDATED', payload: { action: 'add', domain } });
}

export async function activateNuclearMode(durationMinutes: number, whitelist: string[]): Promise<void> {
  const redirectUrl = api.getBlockPageURL('*', 'nuclear');

  // Block-all rule at highest priority
  await api.blocking.addRules(
    [{ id: 20000, domain: '*', priority: 10, category: 'nuclear' }],
    redirectUrl
  );

  // Whitelist exceptions
  // (Note: whitelist implementation uses allow rules, simplified here)

  // Persist nuclear state
  await api.storage.local.set({
    nuclearMode: {
      active: true,
      expiresAt: Date.now() + durationMinutes * 60000,
      whitelist,
    },
  });

  // Set expiry alarm
  await api.alarms.create('nuclear-countdown', { delayInMinutes: durationMinutes });

  // Send notification
  await api.notifications.create('nuclear-activated', {
    title: 'Nuclear Mode Activated',
    message: `All sites blocked for ${durationMinutes} minutes. Stay focused.`,
  });
}
```

### 5.5 Initialization Pattern

The `BrowserAPI` singleton must be initialized at the top level of the service worker, before any other module attempts to use it:

```typescript
// src/background/service-worker.ts (updated for cross-browser)

// Phase 0: Startup timing
import { startupTiming } from './startup-timing';
startupTiming.mark('sw_start');

// Phase 1: Cross-browser API layer (MUST be before all other imports)
import { BrowserAPI } from '../shared/browser-api';
const api = BrowserAPI.getInstance();
startupTiming.mark('browser_api_initialized');
console.log(`[FocusMode] Running on ${api.info.name} ${api.info.version} (MV${api.info.manifestVersion})`);

// Phase 2: Error infrastructure
import { errorHandler } from './error-handler';
startupTiming.mark('error_handler_loaded');

// ... remaining module imports use api.* instead of chrome.*
```

For content scripts (which run in a different context), import `BrowserAPI` at the top of each script:

```typescript
// src/content/detector.ts (updated for cross-browser)
import { BrowserAPI } from '../shared/browser-api';

(() => {
  const api = BrowserAPI.getInstance();

  // ... skip non-blockable pages (updated for all browser schemes)
  const protocol = location.protocol;
  if (['chrome:', 'chrome-extension:', 'about:', 'edge:', 'brave:',
       'devtools:', 'moz-extension:', 'safari-web-extension:'].includes(protocol)) {
    return;
  }

  const hostname = location.hostname;
  if (!hostname) return;
  const domain = hostname.startsWith('www.') ? hostname.slice(4) : hostname;

  api.sendMessage({
    type: 'CHECK_BLOCKED',
    payload: { domain, hostname, url: location.href, timestamp: Date.now() },
  }).then((response) => {
    if (response?.blocked) {
      document.dispatchEvent(new CustomEvent('__focusmode_block__', {
        detail: { domain, reason: response.reason || 'blocklist', stats: response.stats },
      }));
    }
  }).catch(() => {
    // Service worker disconnected -- extension update or error
  });
})();
```

---

## Summary: Cross-Browser Porting Effort Estimates

| Browser | Effort | Weeks | Key Work Items |
|---------|--------|-------|----------------|
| **Edge** | Minimal | 0.5 | Manifest update (`minimum_edge_version`), Edge Add-ons submission, verify all features work |
| **Brave** | None | 0 | Test DNR interaction with Brave Shields, verify ambient sounds work, add Brave to `browser-detect.ts` |
| **Firefox (MV3)** | Moderate | 4-6 | `browser_specific_settings.gecko.id`, DNR redirect URL scheme, audio playback alternative (no offscreen), `menus` namespace, MV3 manifest differences, AMO submission |
| **Firefox (MV2)** | High | 6-8 | All MV3 work plus: `browserAction` vs `action`, `tabs.executeScript` vs `scripting`, webRequest fallback for older Firefox, background page instead of service worker |
| **Safari** | High | 8-12 | Xcode project wrapper, `storage.session` fallback, native notification adapter, native audio adapter, `safari-web-extension://` scheme, Mac App Store submission ($99/yr), per-site permission UX |
| **Opera** | Minimal | 0.5 | Same as Edge (Chromium-based), Opera Add-ons submission |

**Total cross-browser engineering investment:** 14-27 weeks, with Edge and Brave achievable immediately, Firefox within 2 months, and Safari within 3 months of Chrome launch.

---

*Phase 16 Agent 1 -- Browser Landscape & API Compatibility Audit -- Complete*
*Feed this document to Agents 2-5 for manifest transformation, build pipeline, Safari wrapper, and testing.*
