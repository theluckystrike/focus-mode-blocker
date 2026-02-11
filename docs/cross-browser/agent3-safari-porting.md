# Safari Porting Guide for Focus Mode - Blocker

## Phase 16 -- Cross-Browser Porter (Agent 3: Safari)

> **Document Version:** 1.0
> **Date:** February 11, 2026
> **Status:** Complete Safari Porting Specification
> **Extension:** Focus Mode - Blocker
> **Bundle ID:** one.zovo.focusmode-blocker
> **Brand:** Zovo (zovo.one)
> **Source:** Chrome MV3 extension at `/src/`
> **Target:** Safari Web Extension for macOS 13+ and iOS 16+

---

## Table of Contents

1. [Safari Web Extension Architecture](#1-safari-web-extension-architecture)
2. [Safari Web Extension Converter](#2-safari-web-extension-converter)
3. [Safari API Compatibility](#3-safari-api-compatibility)
4. [Native Messaging Integration](#4-native-messaging-integration)
5. [Safari-Specific Features and Opportunities](#5-safari-specific-features-and-opportunities)
6. [Safari Limitations and Workarounds](#6-safari-limitations-and-workarounds)
7. [App Store Submission Process](#7-app-store-submission-process)
8. [Automated Safari Build Pipeline](#8-automated-safari-build-pipeline)

---

## 1. Safari Web Extension Architecture

### 1.1 Containing App + Extension Model

Safari Web Extensions are fundamentally different from Chrome extensions in their distribution model. Every Safari Web Extension must be embedded inside a native macOS or iOS app (the "containing app"). This is not optional -- Apple requires it for sandboxing, distribution, and user trust.

For Focus Mode - Blocker, the architecture looks like this:

```
Focus Mode - Blocker.app (macOS containing app)
  |
  +-- Focus Mode - Blocker Extension (Safari Web Extension target)
  |     +-- manifest.json (converted from Chrome manifest)
  |     +-- src/background/service-worker.js
  |     +-- src/popup/popup.html
  |     +-- src/content/detector.js
  |     +-- src/content/block-page.html
  |     +-- ... (all Chrome extension files)
  |
  +-- SafariWebExtensionHandler.swift (native messaging bridge)
  +-- App UI (enable/disable extension, settings, status)

Focus Mode - Blocker.app (iOS containing app)
  |
  +-- Focus Mode - Blocker iOS Extension (Safari Web Extension target)
  |     +-- (same web extension files)
  |
  +-- SafariWebExtensionHandler.swift
  +-- iOS App UI (onboarding, status, widget config)
```

The containing app serves multiple purposes for Focus Mode - Blocker:

1. **Extension management**: Guide users through enabling the extension in Safari settings.
2. **Native feature bridge**: Provide capabilities unavailable to the web extension (iCloud sync, system Focus integration, rich notifications, widgets).
3. **App Store presence**: The app is the entity listed on the App Store, which handles pricing, reviews, and discovery.
4. **In-app purchase host**: Apple requires all monetization to go through IAP when distributed via the App Store. The containing app hosts the StoreKit integration.

### 1.2 Safari MV3 Support Level

Safari 16.4+ (macOS Ventura 13.3+ and iOS 16.4+) introduced substantial Manifest V3 support. As of Safari 17.x (macOS Sonoma, iOS 17) and Safari 18.x (macOS Sequoia, iOS 18), the following MV3 features relevant to Focus Mode - Blocker are supported:

| MV3 Feature | Safari Support | Focus Mode - Blocker Usage | Notes |
|---|---|---|---|
| `manifest_version: 3` | Supported (Safari 15.4+) | Required | Full MV3 manifest parsing |
| Service workers | Supported (Safari 16.4+) | `service-worker.js` entry point | Lifecycle differences (see 1.4) |
| `declarativeNetRequest` | Supported (Safari 15.4+) | Core blocking engine | Rule limit differences (see 3.1) |
| `action` (popup) | Supported | `popup.html` (380x500-580px) | Toolbar item rendering differs slightly |
| `content_scripts` | Supported | `detector.js`, `block-page.js`, `tracker.js` | Injection timing caveats (see 3.6) |
| `scripting` API | Supported (Safari 16.4+) | Dynamic injection of `tracker.js` | `executeScript` differences (see 3.7) |
| `storage.local` | Supported | Primary data store for all tiers | Full support |
| `storage.sync` | **Not supported** | Pro tier cross-device sync | Must fall back to `storage.local` (see 3.2) |
| `alarms` | Supported (Safari 16.4+) | 12 alarms for timers, schedules, etc. | Reliability differences on iOS (see 3.4) |
| `notifications` | **Limited** | Session reminders, streak milestones | Very restricted on Safari (see 3.3) |
| `offscreen` | **Not supported** | Ambient sound playback | Must use alternative approach (see 3.3) |
| `host_permissions` | Supported | `<all_urls>` for blocking | User must grant per-site or all-sites in Safari settings |
| `web_accessible_resources` | Supported | Block page assets, sounds, quotes | Same behavior |
| `i18n` / `_locales` | Supported | Localization | Full support (see 3.8) |
| `contextMenus` | Supported (Safari 17+) | Right-click "Block this site" | Available on macOS only, not iOS |
| `tabs` | Partially supported | Active tab detection | Permission model differs (see 3.5) |
| ES modules (`"type": "module"`) | Supported (Safari 16.4+) | Modular service worker imports | Same behavior as Chrome |

### 1.3 macOS vs iOS Considerations

Focus Mode - Blocker on iOS Safari represents a massive market opportunity. Mobile Safari is the dominant browser on iPhone and iPad, and the mobile site-blocking space has very few credible competitors.

**macOS Safari (Desktop)**

- Full feature parity target with Chrome extension.
- Users can enable the extension in Safari > Settings > Extensions.
- Toolbar button renders in Safari's toolbar (similar to Chrome's extension icon area).
- Context menus work normally.
- Notifications are fully supported through macOS notification center.
- Service worker lifecycle is similar to Chrome (non-persistent, alarm-based waking).

**iOS Safari (Mobile)**

- Enormous market: 500M+ iPhone users, most using Safari as their default browser.
- Very few competitors: iOS site blocking is dominated by Screen Time (built-in, limited) and a handful of Content Blocker apps. Almost no full-featured web extension blockers exist.
- Enable flow: Settings > Safari > Extensions > Focus Mode - Blocker > toggle on.
- No toolbar icon tap interaction on iOS 16. Starting with iOS 17, Safari extensions can show a toolbar button.
- The popup (`popup.html`) renders as a bottom sheet on iOS when the user taps the extension icon in the Safari address bar.
- Content scripts work on iOS Safari with the same injection model.
- `declarativeNetRequest` rules work on iOS Safari -- this is the primary blocking mechanism and works even when the extension process is not running.
- Background execution is severely limited on iOS (see section 6.2).
- No `contextMenus` API on iOS.
- No `offscreen` documents on iOS.

**iPad Safari**

- Behaves like iOS Safari but with more screen real estate for the popup.
- Split-view and Stage Manager support means the containing app can run alongside Safari.
- iPadOS 17+ supports desktop-class web extensions more fully.

**Key iOS-specific adaptations for Focus Mode - Blocker:**

| Feature | macOS Behavior | iOS Adaptation |
|---|---|---|
| Popup UI | 380x500-580px floating panel | Bottom sheet, full-width, touch-optimized |
| Quick Focus | Click toolbar icon, one click | Tap address bar extension icon, tap Quick Focus |
| Nuclear Mode | Toolbar badge shows countdown | iOS notification with countdown, containing app shows timer |
| Ambient Sounds | Offscreen document plays audio | Containing app plays audio (stays in background) |
| Notifications | macOS notification center | iOS notification center (limited by extension, rich via containing app) |
| Block Page | Full-page overlay | Same (content script injection works on iOS Safari) |
| Settings | Options page in new tab | Containing app provides settings UI |

### 1.4 Service Worker Differences

Safari's service worker implementation for web extensions has several behavioral differences from Chrome:

**Termination behavior:**
- Chrome terminates service workers after ~30 seconds of inactivity (with a 5-minute hard limit).
- Safari is more aggressive on iOS. The extension process may be terminated in under 30 seconds when the user is not actively using Safari.
- On macOS, Safari's termination timing is roughly comparable to Chrome's, though less predictable.

**Wake-up mechanisms:**
- `chrome.alarms` wakes the service worker on both macOS and iOS Safari. This is reliable for Focus Mode - Blocker's 12 alarms (timer_tick, nuclear_check, schedule_check, etc.).
- `chrome.runtime.onMessage` from popup or content scripts wakes the service worker.
- `declarativeNetRequest` rule evaluation does NOT require the service worker to be running (same as Chrome). This is critical for Focus Mode - Blocker: blocking works even when the service worker is terminated.
- On iOS, system-level power management may delay alarm delivery by several seconds during low-power states.

**Module support:**
- Safari 16.4+ supports `"type": "module"` in the service worker declaration, matching Chrome.
- Focus Mode - Blocker's modular architecture (`service-worker.js` importing 17 modules from `modules/`) works without changes.

**Global state:**
- Same caveat as Chrome: global variables do not persist across service worker restarts. Focus Mode - Blocker already handles this correctly by reading critical state from `chrome.storage.local` on wake.

**Recommended Focus Mode - Blocker adaptation:**
```javascript
// In service-worker.js, add a Safari-aware wake handler
const IS_SAFARI = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
                  typeof browser !== 'undefined';

// On iOS, increase the stats_backup alarm frequency from 5 min to 2 min
// to reduce data loss risk from aggressive termination
if (IS_SAFARI) {
  chrome.alarms.create('stats_backup', { periodInMinutes: 2 });
} else {
  chrome.alarms.create('stats_backup', { periodInMinutes: 5 });
}
```

---

## 2. Safari Web Extension Converter

### 2.1 Conversion Using `xcrun safari-web-extension-converter`

Apple provides a command-line tool that converts a Chrome/Firefox web extension into a Safari Web Extension Xcode project. This is the starting point for Focus Mode - Blocker's Safari port.

**Prerequisites:**
- macOS 13+ (Ventura or later)
- Xcode 15+ installed (includes the Safari Web Extension converter)
- Command Line Tools installed (`xcode-select --install`)
- Apple Developer account (required for signing and App Store distribution)

**Step-by-step conversion:**

```bash
# Step 1: Ensure the Chrome extension source is in a clean state.
# The converter reads the manifest.json and all referenced files.
cd /Users/mike/Desktop/chrome-extensions/focus-mode-blocker

# Step 2: Run the converter targeting both macOS and iOS.
# --project-location: where to create the Xcode project
# --app-name: the name of the containing app
# --bundle-identifier: the base bundle ID
# --swift: generate Swift containing app (not Objective-C)
# --ios-only: omit this flag to generate both macOS and iOS targets
# --macos-only: omit this flag to generate both
# --no-open: do not auto-open Xcode after conversion

xcrun safari-web-extension-converter src/ \
  --project-location ../focus-mode-blocker-safari \
  --app-name "Focus Mode - Blocker" \
  --bundle-identifier one.zovo.focusmode-blocker \
  --swift \
  --no-open

# Step 3: Verify the generated project structure.
ls -la ../focus-mode-blocker-safari/
```

**What the converter does:**
1. Reads `src/manifest.json` and validates it against Safari's supported manifest keys.
2. Creates an Xcode project with four targets: macOS app, macOS extension, iOS app, iOS extension.
3. Copies all extension source files into the extension targets' resource bundles.
4. Generates a `SafariWebExtensionHandler.swift` file for native messaging.
5. Generates a basic containing app UI (SwiftUI) with an "Enable Extension" button.
6. Creates an `Info.plist` for each target with the appropriate entitlements.
7. Reports any unsupported APIs or manifest keys as warnings.

**Expected warnings for Focus Mode - Blocker:**
```
WARNING: "offscreen" permission is not supported in Safari. (ambient-sound-manager.js)
WARNING: "storage.sync" is not available in Safari. Falls back to storage.local.
WARNING: "tabGroups" optional permission is not supported in Safari.
WARNING: "gcm" (Firebase Cloud Messaging) is not available in Safari.
WARNING: "identity" permission (Google OAuth) requires native implementation in Safari.
WARNING: "oauth2" manifest key is Chrome-specific and will be ignored.
```

These warnings correspond to known incompatibilities that are addressed in sections 3 and 4.

### 2.2 Xcode Project Structure

After conversion, the Xcode project has this structure:

```
focus-mode-blocker-safari/
  Focus Mode - Blocker.xcodeproj
  |
  +-- Focus Mode - Blocker/                (macOS containing app)
  |     +-- AppDelegate.swift              (app lifecycle)
  |     +-- ViewController.swift           (main window -- extension enable instructions)
  |     +-- Main.storyboard                (macOS UI layout)
  |     +-- Assets.xcassets                (app icons, images)
  |     +-- Info.plist                     (app metadata)
  |     +-- Entitlements.plist             (App Groups, iCloud, etc.)
  |
  +-- Focus Mode - Blocker Extension/      (macOS Safari Web Extension)
  |     +-- Info.plist
  |     +-- Resources/                     (all Chrome extension files copied here)
  |     |     +-- manifest.json            (converted -- Safari-compatible)
  |     |     +-- _locales/
  |     |     +-- src/
  |     |     |     +-- background/
  |     |     |     |     +-- service-worker.js
  |     |     |     |     +-- modules/ (17 modules)
  |     |     |     +-- content/
  |     |     |     |     +-- detector.js
  |     |     |     |     +-- detector.css
  |     |     |     |     +-- block-page.html
  |     |     |     |     +-- block-page.css
  |     |     |     |     +-- block-page.js
  |     |     |     |     +-- tracker.js
  |     |     |     +-- popup/
  |     |     |     |     +-- popup.html
  |     |     |     |     +-- popup.css
  |     |     |     |     +-- popup.js
  |     |     |     |     +-- components/ (12 components)
  |     |     |     +-- rules/
  |     |     |     |     +-- prebuilt-social.json
  |     |     |     |     +-- prebuilt-news.json
  |     |     |     +-- assets/
  |     |     |           +-- icons/
  |     |     |           +-- sounds/
  |     |     |           +-- images/
  |     |     |           +-- quotes.json
  |     |     +-- SafariWebExtensionHandler.swift
  |
  +-- Focus Mode - Blocker iOS/            (iOS containing app)
  |     +-- AppDelegate.swift
  |     +-- ViewController.swift
  |     +-- Main.storyboard
  |     +-- Assets.xcassets
  |     +-- Info.plist
  |     +-- Entitlements.plist
  |
  +-- Focus Mode - Blocker iOS Extension/  (iOS Safari Web Extension)
  |     +-- Info.plist
  |     +-- Resources/                     (same extension files)
  |     +-- SafariWebExtensionHandler.swift
  |
  +-- Shared/                              (code shared between macOS and iOS)
        +-- SafariWebExtensionHandler.swift (shared native messaging handler)
        +-- StoreManager.swift              (IAP management -- added manually)
        +-- iCloudSyncManager.swift         (iCloud sync -- added manually)
        +-- FocusIntegration.swift          (system Focus integration -- added manually)
        +-- WidgetExtension/               (widget target -- added manually)
```

### 2.3 Bundle Identifiers

Apple requires a specific bundle identifier hierarchy:

| Target | Bundle Identifier |
|---|---|
| macOS containing app | `one.zovo.focusmode-blocker` |
| macOS Safari extension | `one.zovo.focusmode-blocker.extension` |
| iOS containing app | `one.zovo.focusmode-blocker` |
| iOS Safari extension | `one.zovo.focusmode-blocker.extension` |
| Shared App Group | `group.one.zovo.focusmode-blocker` |
| Widget extension | `one.zovo.focusmode-blocker.widget` |

The macOS and iOS apps share the same base bundle ID because they are distributed as a single universal purchase on the App Store.

### 2.4 Swift vs Objective-C

Use **Swift** for the containing app. Rationale:

- SwiftUI provides the fastest path to a polished containing app UI on both macOS and iOS.
- StoreKit 2 (for in-app purchases) has a Swift-first API.
- `SafariWebExtensionHandler` template code is generated in Swift by default.
- Apple's documentation and sample code for Safari Web Extensions are exclusively Swift.
- No legacy Objective-C code to maintain.

Minimum deployment targets:
- macOS 13.0 (Ventura) -- ensures Safari 16.4+ with full MV3 support
- iOS 16.0 -- ensures Safari 16.4+ after point release updates

### 2.5 App Icons and Assets Required

Apple requires specific icon sizes for all targets:

**macOS App Icon (AppIcon.appiconset):**

| Size | Scale | Pixels | Usage |
|---|---|---|---|
| 16x16 | 1x | 16x16 | Finder, Dock (small) |
| 16x16 | 2x | 32x32 | Retina Finder, Dock (small) |
| 32x32 | 1x | 32x32 | Finder |
| 32x32 | 2x | 64x64 | Retina Finder |
| 128x128 | 1x | 128x128 | Finder large icon |
| 128x128 | 2x | 256x256 | Retina Finder large icon |
| 256x256 | 1x | 256x256 | Finder extra-large |
| 256x256 | 2x | 512x512 | Retina Finder extra-large |
| 512x512 | 1x | 512x512 | App Store |
| 512x512 | 2x | 1024x1024 | Retina App Store |

**iOS App Icon (AppIcon.appiconset):**

| Size | Usage |
|---|---|
| 1024x1024 | App Store listing (single required size as of Xcode 15+) |

Xcode 15+ auto-generates all iOS icon sizes from a single 1024x1024 source.

**Safari Extension Toolbar Icon:**

| Size | Platform | File |
|---|---|---|
| 16x16 | macOS | `toolbar-icon-16.png` |
| 19x19 | macOS | `toolbar-icon-19.png` |
| 32x32 | macOS (Retina) | `toolbar-icon-32.png` |
| 38x38 | macOS (Retina) | `toolbar-icon-38.png` |
| 48x48 | iOS | `toolbar-icon-48.png` |
| 96x96 | iOS (Retina) | `toolbar-icon-96.png` |

Focus Mode - Blocker's shield-with-crosshair icon (calm blue-to-teal gradient) must be rendered at all these sizes. The icon should be simple enough to be legible at 16x16. For Safari, the toolbar icon should use a template image style (monochrome with transparency) so Safari can apply its own tinting.

**Additional assets to generate:**
- macOS containing app screenshots for the extension enable flow
- Launch screen storyboard for iOS (can use a simple branded splash)
- Widget preview images (if implementing widgets)

---

## 3. Safari API Compatibility

### 3.1 declarativeNetRequest: Core Blocking Engine

This is the most critical API for Focus Mode - Blocker. Safari's `declarativeNetRequest` implementation is functional but has important differences from Chrome.

**Support level:** Safari 15.4+ supports `declarativeNetRequest`. Safari 16.4+ added dynamic rule support.

**Rule limits:**

| Limit | Chrome | Safari | Impact on Focus Mode - Blocker |
|---|---|---|---|
| Static rules (per ruleset) | 30,000 | 50,000 | No issue. Pre-built lists (social ~25 sites, news ~20 sites) are well within limits. |
| Dynamic rules | 30,000 | ~5,000 (varies) | Pro unlimited blocking may hit the limit with very aggressive users. Cap at 4,000 dynamic rules and show a warning. |
| Session rules | 5,000 | Not supported | Focus Mode - Blocker does not use session rules. No impact. |
| Rulesets (static) | 100 (10 enabled) | 50 (10 enabled) | Focus Mode - Blocker uses 2 static rulesets (social, news). No issue. |
| Regex rules | 1,000 | 500 | Wildcard/pattern blocking (Pro) must limit regex rules to 500. |

**Behavioral differences:**

1. **Rule priority handling:** Safari processes rules in the same priority order as Chrome, but Safari's regex rule engine is WebKit-based and may interpret certain patterns differently. Test all regex patterns from `prebuilt-social.json` and `prebuilt-news.json` against Safari's regex engine.

2. **Redirect rules:** Focus Mode - Blocker's Pro redirect feature (redirect blocked sites to productive URLs) works on Safari via `declarativeNetRequest` redirect actions. Verified functional on Safari 17+.

3. **`declarativeNetRequestWithHostAccess`:** Safari treats host permissions differently. The user must explicitly grant website access in Safari settings (per-site or "Allow on All Websites"). Without this, dynamic rules will not match. The containing app onboarding flow must guide users to grant "Allow on All Websites" for the extension.

4. **Rule update latency:** On Safari, `updateDynamicRules()` may take slightly longer to propagate than Chrome (~100-500ms vs. near-instant). This matters for the "Add Site" flow -- add a brief loading indicator.

**Required adaptation for Focus Mode - Blocker:**

```javascript
// In blocking-engine.js, add Safari-specific rule limit awareness
const PLATFORM_LIMITS = {
  chrome: { dynamicRules: 30000, regexRules: 1000 },
  safari: { dynamicRules: 4000, regexRules: 500 }
};

function getPlatformLimits() {
  const isSafari = typeof browser !== 'undefined' &&
    typeof browser.runtime.getBrowserInfo === 'function';
  // Alternative detection: check for Safari-specific behavior
  return isSafari ? PLATFORM_LIMITS.safari : PLATFORM_LIMITS.chrome;
}

async function addDynamicRule(rule) {
  const limits = getPlatformLimits();
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  if (existingRules.length >= limits.dynamicRules) {
    throw new Error(`Rule limit reached (${limits.dynamicRules}). Remove some blocked sites first.`);
  }
  // ... proceed with rule addition
}
```

### 3.2 storage.sync: Fallback to storage.local

Safari does not support `chrome.storage.sync`. Focus Mode - Blocker uses `storage.sync` for Pro tier cross-device sync. On Safari, this must fall back to `storage.local` with iCloud-based sync through the native containing app.

**Adaptation strategy:**

```javascript
// In storage-manager.js, abstract storage access
class StorageManager {
  constructor() {
    // Safari does not support storage.sync
    this.syncAvailable = typeof chrome.storage.sync !== 'undefined' &&
      chrome.storage.sync !== null;
  }

  async getSyncStorage(keys) {
    if (this.syncAvailable) {
      return chrome.storage.sync.get(keys);
    }
    // Fall back to local storage with a "sync_" prefix
    // The native containing app handles actual iCloud sync
    const prefixedKeys = keys.map(k => `sync_${k}`);
    const result = await chrome.storage.local.get(prefixedKeys);
    // Strip prefix from returned keys
    const unprefixed = {};
    for (const [key, value] of Object.entries(result)) {
      unprefixed[key.replace('sync_', '')] = value;
    }
    return unprefixed;
  }

  async setSyncStorage(data) {
    if (this.syncAvailable) {
      return chrome.storage.sync.set(data);
    }
    // Write to local with prefix; native app will sync via iCloud
    const prefixed = {};
    for (const [key, value] of Object.entries(data)) {
      prefixed[`sync_${key}`] = value;
    }
    await chrome.storage.local.set(prefixed);
    // Notify native app that sync data changed
    await browser.runtime.sendNativeMessage('application.id', {
      type: 'SYNC_DATA_CHANGED',
      keys: Object.keys(data)
    });
  }
}
```

### 3.3 Notifications and Offscreen Documents

**Notifications:**

Safari has limited support for `chrome.notifications`:

- On macOS: `chrome.notifications.create()` works, but the notification appearance is controlled by macOS notification center. Buttons/actions are not supported in extension notifications.
- On iOS: Extension-generated notifications are extremely limited. Safari extensions cannot reliably show notifications in the background on iOS.
- Neither platform supports notification sounds from the extension.

**Focus Mode - Blocker notification requirements and Safari solutions:**

| Notification | Chrome Approach | Safari macOS Solution | Safari iOS Solution |
|---|---|---|---|
| Session start/end | `chrome.notifications.create()` | Same -- works on macOS | Delegate to containing app via native messaging |
| Break reminder | `chrome.notifications.create()` | Same | Delegate to containing app (uses `UNUserNotificationCenter`) |
| Streak milestones | `chrome.notifications.create()` | Same | Delegate to containing app |
| Nuclear countdown | Badge text + notification | Badge text (macOS) | Containing app notification + Live Activity (iOS 16.1+) |
| Weekly report | `chrome.notifications.create()` | Same | Containing app scheduled notification |
| Trial expiration | `chrome.notifications.create()` | Same | Containing app local notification |

**Offscreen documents (ambient sounds):**

Safari does not support the `offscreen` API. Focus Mode - Blocker uses offscreen documents for ambient sound playback (rain, white noise, lofi). On Safari:

- **macOS:** Use the containing app to play audio. The extension sends a native message to the app, which plays the audio file. The app can run in the background on macOS.
- **iOS:** Use the containing app with background audio entitlement (`UIBackgroundModes: audio`). The extension sends a native message to start/stop audio. The containing app must be launched at least once, but can then play audio in the background.

```swift
// In SafariWebExtensionHandler.swift
case "PLAY_SOUND":
    let soundId = message["sound_id"] as? String ?? "rain"
    let volume = message["volume"] as? Float ?? 0.5
    AmbientSoundPlayer.shared.play(soundId: soundId, volume: volume)
    response = ["success": true]

case "STOP_SOUND":
    AmbientSoundPlayer.shared.stop()
    response = ["success": true]
```

### 3.4 Alarms API: Timer Reliability

Focus Mode - Blocker relies heavily on `chrome.alarms` for its Pomodoro timer, nuclear countdown, schedule checks, and stats backup. Safari supports the alarms API starting with Safari 16.4, but with behavioral differences.

**macOS Safari:**
- Alarm delivery is reliable and timely. The 1-minute minimum interval (`periodInMinutes: 1`) is respected.
- Alarms wake the service worker from terminated state.
- Timing accuracy is comparable to Chrome (~1-2 second variance).

**iOS Safari:**
- Alarm delivery is subject to iOS power management. When the device is locked or Safari is backgrounded, alarms may be delayed by 5-30 seconds.
- This impacts the `timer_tick` alarm used for updating the Pomodoro countdown. The timer display in the popup will appear to "jump" if the user opens the popup after a delay.
- The `nuclear_check` alarm is less affected because nuclear mode uses `declarativeNetRequest` rules that persist independently of the service worker.

**Mitigation for Focus Mode - Blocker:**

```javascript
// In timer-engine.js, use elapsed-time calculation rather than tick counting
function getElapsedSeconds(session) {
  if (!session || !session.started_at) return 0;
  const startTime = new Date(session.started_at).getTime();
  const now = Date.now();
  const elapsed = Math.floor((now - startTime) / 1000);
  // Subtract paused time
  return elapsed - (session.total_pause_seconds || 0);
}

// Never rely on counting alarm ticks. Always calculate from wall-clock time.
// This makes the timer resilient to missed or delayed alarms on iOS.
```

**Additional iOS consideration:** If the user force-quits Safari, all alarms are cleared and the service worker is terminated. On next Safari launch, Focus Mode - Blocker's service worker must re-register all alarms and recover session state from `chrome.storage.local`.

### 3.5 Tabs API: Permission Restrictions

Safari's `tabs` API is more restrictive than Chrome's:

- `chrome.tabs.query()`: Works but may return limited information unless the user has granted "Allow on All Websites" permission. Tab URLs may be `undefined` for tabs the extension has not been granted access to.
- `chrome.tabs.onUpdated`: Works for tabs the extension has permission to access.
- `chrome.tabs.sendMessage()`: Works for tabs where a content script is running.
- `activeTab` permission: In Safari, `activeTab` grants temporary access to the active tab only when the user explicitly invokes the extension (clicks the toolbar icon). This is more strictly enforced than Chrome.

**Impact on Focus Mode - Blocker:**

- The distraction detector (`detector.js`) runs on all URLs via manifest content script declaration and does not depend on the `tabs` API. No change needed.
- The Quick Focus feature, which checks the current tab URL, must handle the case where the URL is `undefined` due to missing permissions. Degrade gracefully by not pre-populating the "current site" in the Quick Add flow.
- The `tracker.js` dynamic injection via `chrome.scripting.executeScript()` requires host permission for the target tab. On Safari, this means the user must have granted the extension access.

### 3.6 Content Scripts: Injection Timing and Shadow DOM

**Injection timing:**

Safari respects the `run_at` manifest key for content scripts:
- `document_start`: Runs before the DOM is constructed. Focus Mode - Blocker's `detector.js` uses this to prevent blocked page content from rendering. Works on Safari.
- `document_idle`: Runs after the DOM is fully loaded. Used for `tracker.js`. Works on Safari.
- `document_end`: Runs after the DOM is parsed but before subresources load. Not used by Focus Mode - Blocker.

**Safari-specific timing caveat:** On iOS Safari, `document_start` injection may occasionally be delayed by ~50-100ms compared to Chrome, which can cause a brief flash of the blocked site's content before the block page overlay renders. To mitigate this:

```css
/* In detector.css (injected at document_start alongside detector.js) */
/* Hide all content immediately. detector.js will unhide if the site is not blocked. */
/* This CSS-first approach prevents flash-of-blocked-content on Safari iOS. */
html[data-fm-checking] {
  visibility: hidden !important;
}
```

```javascript
// In detector.js, add class immediately, remove if not blocked
document.documentElement.setAttribute('data-fm-checking', '');

// ... after block check completes:
if (!blocked) {
  document.documentElement.removeAttribute('data-fm-checking');
}
```

**Shadow DOM:**

Focus Mode - Blocker's block page uses Shadow DOM to isolate its styles from the host page. Safari has full Shadow DOM v1 support. No changes needed.

However, Safari's implementation of `element.attachShadow()` behaves identically to Chrome. The block page's shadow DOM container, styles, and event handling work without modification.

**Content Security Policy (CSP):**

Safari enforces extension CSP (`"script-src 'self'; object-src 'self'; style-src 'self' 'unsafe-inline';"`) the same as Chrome. Focus Mode - Blocker's CSP is compatible.

One difference: Safari may apply additional CSP restrictions from the host page to injected content scripts in some edge cases. The block page's use of `chrome.runtime.getURL()` for asset loading (icons, sounds, quotes.json) avoids this issue because extension resource URLs are exempt from host CSP.

### 3.7 scripting API: executeScript Differences

Safari supports `chrome.scripting.executeScript()` starting with Safari 16.4. Focus Mode - Blocker uses this to dynamically inject `tracker.js` during active focus sessions.

**Differences:**

- Safari requires the user to have granted the extension access to the target tab's domain. Without access, `executeScript` silently fails (no error thrown in some Safari versions).
- The `world` option (`MAIN` vs `ISOLATED`) is supported on Safari 17+. Focus Mode - Blocker injects `tracker.js` in the `ISOLATED` world (default), which works on all supported Safari versions.
- `injectImmediately` option is not supported on Safari before 17.4. Focus Mode - Blocker does not use this option (it uses `document_idle` timing for `tracker.js`), so no impact.

**Adaptation:**

```javascript
// In session-manager.js, wrap executeScript with error handling for Safari
async function injectTracker(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['src/content/tracker.js']
    });
  } catch (error) {
    // On Safari, this fails silently if permission not granted.
    // Log and continue -- tracker is an enhancement, not critical.
    console.warn('Failed to inject tracker on tab', tabId, error.message);
  }
}
```

### 3.8 i18n API: Localization Support

Safari fully supports the `chrome.i18n` API and the `_locales/` directory structure. Focus Mode - Blocker's localization files work without modification.

- `chrome.i18n.getMessage()` resolves correctly.
- `__MSG_extensionName__` substitution in `manifest.json` works.
- Safari uses the system locale to determine which locale folder to use, falling back to `default_locale`.
- The `chrome.i18n.getUILanguage()` and `chrome.i18n.getAcceptLanguages()` methods work on Safari.

No changes needed for Focus Mode - Blocker's i18n system.

---

## 4. Native Messaging Integration

### 4.1 SafariWebExtensionHandler Implementation

The `SafariWebExtensionHandler` is a Swift class that bridges communication between the Safari Web Extension and the native containing app. This is the most powerful Safari-specific capability and enables features impossible in a pure Chrome extension.

```swift
// Shared/SafariWebExtensionHandler.swift
import SafariServices
import os.log

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {

    private let logger = Logger(subsystem: "one.zovo.focusmode-blocker", category: "handler")

    func beginRequest(with context: NSExtensionContext) {
        guard let item = context.inputItems.first as? NSExtensionItem,
              let message = item.userInfo?[SFExtensionMessageKey] as? [String: Any] else {
            context.completeRequest(returningItems: nil, completionHandler: nil)
            return
        }

        let messageType = message["type"] as? String ?? ""
        logger.info("Received message: \(messageType)")

        var response: [String: Any] = ["success": false]

        switch messageType {

        // ---- Ambient Sound Playback ----
        case "PLAY_SOUND":
            let soundId = message["sound_id"] as? String ?? "rain"
            let volume = message["volume"] as? Double ?? 0.5
            AmbientSoundPlayer.shared.play(soundId: soundId, volume: Float(volume))
            response = ["success": true]

        case "STOP_SOUND":
            AmbientSoundPlayer.shared.stop()
            response = ["success": true]

        // ---- Rich Notifications (iOS) ----
        case "SHOW_NOTIFICATION":
            let title = message["title"] as? String ?? "Focus Mode"
            let body = message["body"] as? String ?? ""
            let identifier = message["id"] as? String ?? UUID().uuidString
            NotificationManager.shared.scheduleNotification(
                id: identifier, title: title, body: body
            )
            response = ["success": true]

        // ---- iCloud Sync ----
        case "SYNC_DATA_CHANGED":
            let keys = message["keys"] as? [String] ?? []
            iCloudSyncManager.shared.pushChanges(keys: keys)
            response = ["success": true]

        case "GET_SYNCED_DATA":
            let keys = message["keys"] as? [String] ?? []
            let data = iCloudSyncManager.shared.pullData(keys: keys)
            response = ["success": true, "data": data]

        // ---- System Focus Integration ----
        case "GET_SYSTEM_FOCUS_STATUS":
            let isActive = FocusIntegration.shared.isSystemFocusActive()
            response = ["success": true, "focusActive": isActive]

        case "SET_FOCUS_FILTER":
            let enabled = message["enabled"] as? Bool ?? false
            FocusIntegration.shared.setFocusModeFilter(enabled: enabled)
            response = ["success": true]

        // ---- In-App Purchase Status ----
        case "CHECK_PRO_STATUS":
            Task {
                let isPro = await StoreManager.shared.isProActive()
                let planType = await StoreManager.shared.currentPlanType()
                response = [
                    "success": true,
                    "isPro": isPro,
                    "planType": planType ?? "none"
                ]
                self.sendResponse(response, context: context)
            }
            return // Early return because of async

        case "PURCHASE_PRO":
            let productId = message["productId"] as? String ?? ""
            Task {
                let result = await StoreManager.shared.purchase(productId: productId)
                response = [
                    "success": result.success,
                    "error": result.error as Any
                ]
                self.sendResponse(response, context: context)
            }
            return

        case "RESTORE_PURCHASES":
            Task {
                let restored = await StoreManager.shared.restorePurchases()
                response = ["success": restored]
                self.sendResponse(response, context: context)
            }
            return

        default:
            logger.warning("Unknown message type: \(messageType)")
            response = ["success": false, "error": "Unknown message type"]
        }

        sendResponse(response, context: context)
    }

    private func sendResponse(_ response: [String: Any], context: NSExtensionContext) {
        let responseItem = NSExtensionItem()
        responseItem.userInfo = [SFExtensionMessageKey: response]
        context.completeRequest(returningItems: [responseItem], completionHandler: nil)
    }
}
```

### 4.2 Calling Native Code from the Extension

From the web extension JavaScript, native messaging uses `browser.runtime.sendNativeMessage()`:

```javascript
// In service-worker.js or any extension context
async function sendNativeMessage(message) {
  // Safari Web Extensions use browser.runtime.sendNativeMessage
  // The "application ID" is the containing app's bundle identifier
  try {
    const response = await browser.runtime.sendNativeMessage(
      'application.id', // Safari uses this fixed identifier
      message
    );
    return response;
  } catch (error) {
    console.error('Native messaging failed:', error);
    return { success: false, error: error.message };
  }
}

// Example: Play ambient sound via native app
async function playAmbientSound(soundId, volume) {
  if (IS_SAFARI) {
    return sendNativeMessage({
      type: 'PLAY_SOUND',
      sound_id: soundId,
      volume: volume
    });
  } else {
    // Chrome: use offscreen document
    return chrome.runtime.sendMessage({
      type: 'PLAY_SOUND',
      payload: { sound_id: soundId, volume: volume },
      sender: 'background'
    });
  }
}
```

### 4.3 App Groups: Sharing Data Between Extension and Containing App

The extension and containing app run in separate sandboxed processes. To share data, they must use an App Group.

**Setup in Xcode:**

1. In the project settings for both the app and extension targets, enable the "App Groups" capability.
2. Create a group: `group.one.zovo.focusmode-blocker`
3. Both targets must use the same group ID.

**Shared UserDefaults:**

```swift
// Shared/SharedDefaults.swift
import Foundation

struct SharedDefaults {
    static let suiteName = "group.one.zovo.focusmode-blocker"

    static var shared: UserDefaults {
        return UserDefaults(suiteName: suiteName)!
    }

    // Pro status (written by StoreManager, read by extension handler)
    static var isProActive: Bool {
        get { shared.bool(forKey: "isProActive") }
        set { shared.set(newValue, forKey: "isProActive") }
    }

    // Current plan type
    static var planType: String? {
        get { shared.string(forKey: "planType") }
        set { shared.set(newValue, forKey: "planType") }
    }

    // System Focus status
    static var systemFocusEnabled: Bool {
        get { shared.bool(forKey: "systemFocusEnabled") }
        set { shared.set(newValue, forKey: "systemFocusEnabled") }
    }

    // Extension enabled status
    static var extensionEnabled: Bool {
        get { shared.bool(forKey: "extensionEnabled") }
        set { shared.set(newValue, forKey: "extensionEnabled") }
    }

    // Last sync timestamp
    static var lastSyncTimestamp: Date? {
        get { shared.object(forKey: "lastSyncTimestamp") as? Date }
        set { shared.set(newValue, forKey: "lastSyncTimestamp") }
    }

    // Blocklist hash (for quick comparison during sync)
    static var blocklistHash: String? {
        get { shared.string(forKey: "blocklistHash") }
        set { shared.set(newValue, forKey: "blocklistHash") }
    }
}
```

**Shared file container for large data:**

For larger datasets (full blocklist, session history, weekly reports), use the shared container directory:

```swift
// Write blocklist from containing app
let sharedURL = FileManager.default.containerURL(
    forSecurityApplicationGroupIdentifier: "group.one.zovo.focusmode-blocker"
)!
let blocklistURL = sharedURL.appendingPathComponent("blocklist.json")
try data.write(to: blocklistURL)
```

### 4.4 Use Cases for Native Messaging in Focus Mode - Blocker

| Use Case | Chrome Approach | Safari Native Messaging Approach | Benefit |
|---|---|---|---|
| Ambient sounds | `offscreen` API | Native `AVAudioPlayer` in containing app | Better audio quality, background playback on iOS |
| Rich notifications | `chrome.notifications` | `UNUserNotificationCenter` in containing app | Action buttons, images, sounds, grouped notifications |
| Cross-device sync | `chrome.storage.sync` + server API | `NSUbiquitousKeyValueStore` (iCloud KVS) | Free iCloud sync, no server costs for basic settings |
| Pro purchase | Stripe checkout in new tab | StoreKit 2 IAP in containing app | Required for App Store distribution |
| System Focus | Not possible | `FocusStatus` API (iOS 16+) | Auto-enable blocking when system DND/Focus is on |
| Widget data | Not possible | App Group shared data + WidgetKit | Home screen widgets showing Focus Score, streak |
| Keyboard shortcut | Limited to Chrome shortcuts | Native keyboard shortcuts in containing app | macOS menu bar integration |

---

## 5. Safari-Specific Features and Opportunities

### 5.1 iOS Safari Extension: The Mobile Opportunity

Blocking distracting websites on mobile Safari is a huge underserved market. Current options for iPhone users:

- **Screen Time** (built-in): Crude domain blocking, no gamification, no Pomodoro, no Focus Score, no motivational block page. Intended for parental controls, not self-improvement.
- **1Blocker** / **AdGuard**: Primarily ad blockers using Content Blocker API. Not focus tools.
- **Freedom**: Requires account, subscription-only ($8.99/mo), no gamification.
- **Very few Safari Web Extension blockers**: The field is nearly empty.

**Focus Mode - Blocker on iOS fills this gap perfectly.** The core value proposition translates directly:

- Block distracting sites on mobile Safari (declarativeNetRequest works on iOS).
- Show the motivational block page with streak, Focus Score, and quotes.
- Run Pomodoro timer with notification-based alerts.
- Track focus streaks across desktop and mobile (via iCloud sync).
- Nuclear Mode works via declarativeNetRequest rules that persist without the extension running.

**iOS-specific UI adaptations:**

```
Mobile popup (bottom sheet, activated via address bar):
+------------------------------------------+
|  Focus Mode - Blocker              [x]   |
|                                          |
|  Focus Score: 74          Streak: 14 d   |
|                                          |
|  [===========  Quick Focus  ===========] |
|                                          |
|  Today: 2h 15m focused | 12 blocked     |
|                                          |
|  +-- Blocked Sites (8/10) -----------+   |
|  | reddit.com               [toggle] |   |
|  | twitter.com              [toggle] |   |
|  | youtube.com              [toggle] |   |
|  | ... (scrollable)                  |   |
|  +-----------------------------------+   |
|                                          |
|  [Nuclear Mode]  [Timer: 25:00]  [Pro]   |
+------------------------------------------+
```

The popup should be touch-optimized: larger tap targets (44x44pt minimum per Apple HIG), no hover states, swipe gestures for toggling sites.

### 5.2 macOS System Focus Integration

macOS Ventura+ and iOS 16+ have a system-level Focus feature (Do Not Disturb, Work, Personal, etc.). Focus Mode - Blocker can integrate deeply with this.

**When the user activates macOS "Work" Focus:**
1. The containing app detects the Focus state change via `FocusStatusCenter`.
2. The containing app writes `systemFocusEnabled = true` to `SharedDefaults`.
3. The extension's service worker reads this on wake and auto-activates blocking.
4. When the system Focus ends, blocking auto-deactivates (unless the user started a manual session).

**Implementation:**

```swift
// Shared/FocusIntegration.swift
import FocusStatus // Available on macOS 13+, iOS 16+

class FocusIntegration {
    static let shared = FocusIntegration()

    private let focusStatusCenter = FocusStatusCenter.default

    func isSystemFocusActive() -> Bool {
        let authorization = focusStatusCenter.authorizationStatus
        guard authorization == .authorized else { return false }
        return focusStatusCenter.focusStatus?.isFocused ?? false
    }

    func startMonitoring() {
        // Observe Focus status changes
        focusStatusCenter.addObserver(self) { [weak self] in
            let isFocused = self?.isSystemFocusActive() ?? false
            SharedDefaults.systemFocusEnabled = isFocused

            // Post notification so the extension can react
            DistributedNotificationCenter.default().postNotificationName(
                Notification.Name("one.zovo.focusmode-blocker.focusChanged"),
                object: nil,
                userInfo: ["focused": isFocused]
            )
        }
    }
}
```

**On the extension side:**

```javascript
// In schedule-engine.js, check system Focus status alongside schedules
async function checkSystemFocusIntegration() {
  if (!IS_SAFARI) return false;

  const response = await sendNativeMessage({ type: 'GET_SYSTEM_FOCUS_STATUS' });
  if (response.success && response.focusActive) {
    // System Focus is on -- auto-enable blocking if not already active
    const state = await chrome.storage.local.get('sessions');
    if (!state.sessions?.active_session) {
      // Start a system-triggered focus session
      await startSession({
        type: 'focus',
        trigger: 'system_focus',
        duration_minutes: 0, // Indefinite -- ends when system Focus ends
        blocklist_ids: ['prebuilt_social', 'prebuilt_news']
      });
    }
    return true;
  }
  return false;
}
```

### 5.3 Screen Time API Integration

Apple's Screen Time framework (available on iOS 16+ and macOS 13+) provides managed device restriction capabilities. While the full Screen Time API is primarily for parental controls and MDM, the `ManagedSettings` framework allows apps to restrict access to websites.

**Potential integration for Focus Mode - Blocker:**

- Use `ManagedSettingsStore` to block websites at the OS level (not just in Safari). This would block sites in all browsers and apps.
- This is significantly more powerful than `declarativeNetRequest`, which only blocks in Safari.
- Requires Family Sharing authorization or Screen Time passcode on the user's device.

**Feasibility assessment:**

| Aspect | Assessment |
|---|---|
| OS-level blocking (all apps) | Possible via `ManagedSettingsStore.webContentSettings` |
| User experience | Requires Screen Time authorization -- extra friction |
| Nuclear Mode enhancement | Excellent -- truly unbypassable if using Screen Time restrictions |
| App Store approval | Risky -- Apple may reject apps that use Screen Time API for non-parental purposes |
| Implementation complexity | High -- requires `FamilyControls` entitlement from Apple |

**Recommendation:** Pursue this as a future enhancement (P2/P3 priority). File for the `FamilyControls` entitlement early, as Apple's approval process can take weeks. Initially, rely on `declarativeNetRequest` for Safari blocking.

### 5.4 iCloud Sync

iCloud sync replaces `chrome.storage.sync` and the server-side sync API for Apple device users. It is free (no server costs) and automatic.

**Two approaches:**

1. **NSUbiquitousKeyValueStore** (iCloud Key-Value Storage): Simple key-value sync, 1MB total limit, 1024 keys max. Suitable for settings, current streak, Focus Score, active schedules.

2. **CloudKit** (iCloud database): Full database with structured records. Suitable for session history, weekly reports, full blocklist. More complex but handles large datasets.

**Focus Mode - Blocker iCloud sync strategy:**

| Data Category | Sync Method | Size | Notes |
|---|---|---|---|
| Settings | NSUbiquitousKeyValueStore | ~2KB | Theme, timer durations, notification prefs |
| Blocklist (custom sites) | NSUbiquitousKeyValueStore | ~5KB (for 100 sites) | Domain list is small |
| Active schedules | NSUbiquitousKeyValueStore | ~1KB | Schedule configs |
| Streak data | NSUbiquitousKeyValueStore | ~0.5KB | Current streak, longest, last active date |
| Focus Score | NSUbiquitousKeyValueStore | ~0.5KB | Current score and breakdown |
| Session history | CloudKit (Pro) | Variable | Full session records |
| Weekly/monthly reports | CloudKit (Pro) | Variable | Aggregated stats |
| Gamification (badges) | NSUbiquitousKeyValueStore | ~2KB | Badge IDs and earn dates |
| Subscription status | SharedDefaults only | N/A | Local only -- verified via StoreKit |

```swift
// Shared/iCloudSyncManager.swift
import Foundation

class iCloudSyncManager {
    static let shared = iCloudSyncManager()

    private let kvStore = NSUbiquitousKeyValueStore.default

    func pushChanges(keys: [String]) {
        // Read from shared App Group defaults and push to iCloud
        for key in keys {
            if let value = SharedDefaults.shared.object(forKey: key) {
                kvStore.set(value, forKey: key)
            }
        }
        kvStore.synchronize()
    }

    func pullData(keys: [String]) -> [String: Any] {
        var result: [String: Any] = [:]
        for key in keys {
            if let value = kvStore.object(forKey: key) {
                result[key] = value
                // Also update shared defaults so extension can read it
                SharedDefaults.shared.set(value, forKey: key)
            }
        }
        return result
    }

    func startObserving() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(kvStoreChanged),
            name: NSUbiquitousKeyValueStore.didChangeExternallyNotification,
            object: kvStore
        )
        kvStore.synchronize()
    }

    @objc private func kvStoreChanged(notification: Notification) {
        guard let userInfo = notification.userInfo,
              let reason = userInfo[NSUbiquitousKeyValueStoreChangeReasonKey] as? Int else {
            return
        }

        if reason == NSUbiquitousKeyValueStoreServerChange ||
           reason == NSUbiquitousKeyValueStoreInitialSyncChange {
            // Remote data changed -- update shared defaults
            let changedKeys = userInfo[NSUbiquitousKeyValueStoreChangedKeysKey] as? [String] ?? []
            for key in changedKeys {
                if let value = kvStore.object(forKey: key) {
                    SharedDefaults.shared.set(value, forKey: key)
                }
            }
        }
    }
}
```

### 5.5 Widgets

WidgetKit enables Focus Mode - Blocker to show information on the macOS desktop, iOS Home Screen, and iOS Lock Screen.

**Proposed widgets:**

| Widget | Size | Content | Platform |
|---|---|---|---|
| Focus Score | Small (systemSmall) | Circular score ring (0-100), color-coded, current streak count | macOS, iOS |
| Streak Tracker | Small | Current streak days, flame icon, "Best: X days" | macOS, iOS |
| Timer Status | Medium (systemMedium) | Current session time remaining, "No active session" if idle, Quick Focus button (deep link) | macOS, iOS |
| Daily Summary | Large (systemLarge) | Today's focus time, sessions completed, distraction attempts, Focus Score, mini bar chart | macOS, iOS |
| Quick Focus | Accessory Circular (Lock Screen) | Tap to deep-link into containing app and start Quick Focus | iOS only |

**Widget data flow:**

1. The web extension writes stats to `chrome.storage.local`.
2. The `SafariWebExtensionHandler` reads stats when requested and writes to `SharedDefaults` (App Group).
3. The widget reads from `SharedDefaults`.
4. The widget uses a `TimelineProvider` to refresh every 15 minutes (or on significant data changes).

```swift
// WidgetExtension/FocusScoreWidget.swift
import WidgetKit
import SwiftUI

struct FocusScoreEntry: TimelineEntry {
    let date: Date
    let score: Int
    let streak: Int
    let focusMinutesToday: Int
}

struct FocusScoreProvider: TimelineProvider {
    func getTimeline(in context: Context, completion: @escaping (Timeline<FocusScoreEntry>) -> Void) {
        let defaults = UserDefaults(suiteName: "group.one.zovo.focusmode-blocker")!
        let score = defaults.integer(forKey: "focusScore")
        let streak = defaults.integer(forKey: "currentStreak")
        let focusMinutes = defaults.integer(forKey: "focusMinutesToday")

        let entry = FocusScoreEntry(
            date: Date(),
            score: score,
            streak: streak,
            focusMinutesToday: focusMinutes
        )

        // Refresh every 15 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }

    func placeholder(in context: Context) -> FocusScoreEntry {
        FocusScoreEntry(date: Date(), score: 74, streak: 14, focusMinutesToday: 135)
    }

    func getSnapshot(in context: Context, completion: @escaping (FocusScoreEntry) -> Void) {
        completion(placeholder(in: context))
    }
}
```

---

## 6. Safari Limitations and Workarounds

### 6.1 Content Blocker vs Web Extension

Safari supports two content blocking mechanisms:

1. **Content Blocker** (Safari Content Blocking Extension): A lightweight, high-performance JSON rule engine that blocks content. Rules are compiled by Safari for maximum efficiency. No JavaScript execution. Cannot show custom block pages.

2. **Web Extension** (Safari Web Extension): Full web extension with JavaScript, popup, content scripts, service worker, etc. More capable but heavier.

**Should Focus Mode - Blocker ship both?**

| Aspect | Content Blocker | Web Extension |
|---|---|---|
| Blocking performance | Excellent -- rules compiled to native code | Good -- declarativeNetRequest is also declarative |
| Custom block page | No -- shows Safari's default error page | Yes -- full motivational block page |
| Dynamic rules | No -- rules are static JSON, updated via app | Yes -- rules update in real-time |
| Gamification | No | Yes -- streaks, Focus Score, badges |
| Timer | No | Yes -- Pomodoro timer |
| Nuclear Mode | No | Yes |
| Resource usage | Minimal | Low-moderate |

**Recommendation:** Ship Focus Mode - Blocker as a **Web Extension only**. The motivational block page is a core differentiator -- showing a generic Safari error page defeats the purpose. The `declarativeNetRequest` API in the web extension provides sufficient blocking performance.

If Safari performance testing reveals that `declarativeNetRequest` is noticeably slower than Content Blocker rules for large blocklists (100+ sites), consider shipping a Content Blocker as a supplementary blocking layer that handles the static prebuilt lists, while the web extension handles dynamic rules, the block page, and all interactive features.

### 6.2 Background Execution Limits on iOS

iOS aggressively suspends background processes. This impacts Focus Mode - Blocker in several ways:

**Service worker termination:**
- The extension service worker is terminated when Safari is backgrounded or the device is locked.
- `chrome.alarms` still fire, but delivery may be delayed.
- `declarativeNetRequest` rules continue to work even when the service worker is terminated.

**Timer accuracy:**
- The Pomodoro timer cannot rely on service worker ticks for accuracy on iOS.
- Always calculate elapsed time from wall-clock timestamps (see section 3.4).
- The containing app can use background task scheduling (`BGTaskScheduler`) to post notifications at precise times.

**Ambient sound playback:**
- The containing app must use the `audio` background mode to continue playing ambient sounds when Safari is foregrounded but the app is in the background.
- If the user locks the device, audio continues (same as any music app).

**Notification delivery:**
- Extension-generated notifications may not display on iOS if the extension process is suspended.
- Use the containing app to schedule `UNNotificationRequest` with precise fire dates for session reminders, break alerts, and nuclear countdown warnings.

**Practical impact on Focus Mode - Blocker features:**

| Feature | iOS Background Behavior | Mitigation |
|---|---|---|
| Site blocking | Works (declarativeNetRequest persists) | None needed |
| Pomodoro timer display | Timer pauses visually when Safari backgrounded | Use wall-clock calculation on resume; containing app posts notification at exact end time |
| Nuclear Mode | Works (rules persist, cannot be disabled) | Nuclear end time checked on service worker wake |
| Streak tracking | Works (daily rollover alarm fires) | May be delayed; recalculate on next app open |
| Stats aggregation | May miss real-time aggregation | Aggregate on next service worker wake |
| Ambient sounds | Stops if extension process suspended | Move to containing app with audio background mode |
| Notifications | Extension notifications unreliable | Containing app schedules all notifications |

### 6.3 Nuclear Mode Feasibility on Safari

Nuclear Mode's core promise: the user cannot disable blocking, remove sites, or uninstall the extension until the timer expires.

**Chrome Nuclear Mode layers (from spec section 5.6):**
1. Block `chrome://extensions` via declarativeNetRequest
2. Disable right-click "Manage Extension" via content script
3. Lock storage writes for blocklist modification
4. Tamper hash for state integrity
5. Prevent incognito bypass
6. Extension badge countdown

**Safari Nuclear Mode feasibility:**

| Layer | Chrome | Safari macOS | Safari iOS |
|---|---|---|---|
| Block extensions page | Block `chrome://extensions` | Cannot block `safari://extensions` via DNR -- Safari does not allow blocking internal URLs | Not applicable (settings are in the Settings app) |
| Prevent right-click manage | Content script on all pages | Not applicable -- Safari does not have right-click extension management | Not applicable |
| Lock storage writes | Service worker enforces | Same approach works | Same approach works |
| Tamper hash | HMAC integrity check | Same approach works | Same approach works |
| Prevent incognito bypass | Content script in incognito | Safari Private Browsing: extensions run if user enables "Private Browsing" in extension settings | Same |
| Badge countdown | Extension badge text | Safari toolbar icon badge (macOS) | Address bar indicator (iOS 17+) |

**The critical gap:** On Safari, the user can always disable or remove the extension via Safari Settings (macOS) or Settings app (iOS). There is no way for a Safari Web Extension to prevent its own removal.

**Workaround for Safari Nuclear Mode:**

1. **Psychological deterrent:** When Nuclear Mode is active, show a prominent warning in the containing app: "Nuclear Mode active -- disabling the extension will break your 14-day streak and reset your Focus Score."
2. **Detection and logging:** If the extension is disabled during Nuclear Mode, detect this on next enable (compare `nuclear.ends_at` with current time). Log the "nuclear breach" and display a shame-free acknowledgment: "Your Nuclear session was interrupted. No judgment -- let's try again."
3. **Screen Time integration (future):** If Screen Time API access is granted, use `ManagedSettingsStore` to block sites at the OS level during Nuclear Mode. This is truly unbypassable (requires the Screen Time passcode to override).
4. **Containing app approach:** The containing app can implement a "Lock" screen that appears whenever the app is opened during Nuclear Mode, showing only the countdown timer and preventing navigation to extension settings.

### 6.4 Paywall/Pro Features: In-App Purchase via App Store

**Apple requires IAP for App Store distribution.** Focus Mode - Blocker cannot use Stripe checkout for Safari users who install via the App Store. The Chrome version continues to use Stripe.

**StoreKit 2 integration:**

```swift
// Shared/StoreManager.swift
import StoreKit

class StoreManager: ObservableObject {
    static let shared = StoreManager()

    // Product IDs matching Focus Mode - Blocker tiers
    static let monthlyProductId = "one.zovo.focusmode_blocker.pro.monthly"    // $4.99/mo
    static let annualProductId = "one.zovo.focusmode_blocker.pro.annual"      // $35.88/yr
    static let lifetimeProductId = "one.zovo.focusmode_blocker.pro.lifetime"  // $49.99

    @Published var products: [Product] = []
    @Published var purchasedProductIDs: Set<String> = []

    func loadProducts() async {
        do {
            products = try await Product.products(for: [
                Self.monthlyProductId,
                Self.annualProductId,
                Self.lifetimeProductId
            ])
        } catch {
            print("Failed to load products: \(error)")
        }
    }

    func purchase(productId: String) async -> (success: Bool, error: String?) {
        guard let product = products.first(where: { $0.id == productId }) else {
            return (false, "Product not found")
        }
        do {
            let result = try await product.purchase()
            switch result {
            case .success(let verification):
                let transaction = try checkVerified(verification)
                await transaction.finish()
                SharedDefaults.isProActive = true
                SharedDefaults.planType = productId.contains("monthly") ? "monthly" :
                                          productId.contains("annual") ? "annual" : "lifetime"
                return (true, nil)
            case .userCancelled:
                return (false, "cancelled")
            case .pending:
                return (false, "pending")
            @unknown default:
                return (false, "unknown")
            }
        } catch {
            return (false, error.localizedDescription)
        }
    }

    func isProActive() async -> Bool {
        for await result in Transaction.currentEntitlements {
            if case .verified(let transaction) = result {
                if transaction.productID == Self.monthlyProductId ||
                   transaction.productID == Self.annualProductId ||
                   transaction.productID == Self.lifetimeProductId {
                    SharedDefaults.isProActive = true
                    return true
                }
            }
        }
        SharedDefaults.isProActive = false
        return false
    }

    func currentPlanType() async -> String? {
        return SharedDefaults.planType
    }

    func restorePurchases() async -> Bool {
        try? await AppStore.sync()
        return await isProActive()
    }

    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified:
            throw StoreError.failedVerification
        case .verified(let safe):
            return safe
        }
    }

    enum StoreError: Error {
        case failedVerification
    }
}
```

### 6.5 Apple's 30% Commission and Pricing Impact

Apple takes a 30% commission on all IAP in the first year, reduced to 15% after 12 months of continuous subscription (Small Business Program, which applies to developers earning under $1M/year).

**Pricing impact on Focus Mode - Blocker:**

| Plan | Chrome Price (Stripe) | App Store Price (IAP) | Apple Commission (Yr 1) | Net Revenue (Yr 1) | Net Revenue (Yr 2+) |
|---|---|---|---|---|---|
| Monthly | $4.99 | $4.99 | 30% ($1.50) | $3.49 | $4.24 (15%) |
| Annual | $35.88 ($2.99/mo) | $35.99 | 30% ($10.80) | $25.19 | $30.59 (15%) |
| Lifetime | $49.99 | $49.99 | 30% ($15.00) | $34.99 | N/A |

**Options to handle the commission:**

1. **Absorb the 30% cut** (recommended for launch): Keep prices identical across Chrome and Safari. The reduced margin is offset by access to the massive iOS user base. A $3.49 net monthly revenue per Safari user is still a strong LTV given zero server costs for the free tier.

2. **Increase Safari prices**: Raise Safari prices to offset the commission (e.g., $6.99/mo instead of $4.99). This creates price parity issues and user confusion. Not recommended.

3. **Offer web-based checkout alternative**: Direct users to zovo.one to purchase via Stripe, then enter a license key in the extension. Apple explicitly prohibits linking to external purchase options from the app. The license key approach may work if the IAP option is also prominently available in-app. This is a gray area in Apple's current guidelines -- proceed with caution.

**Recommendation:** Absorb the commission at launch. Focus on acquiring iOS users. Reassess after 6 months of revenue data. If Safari becomes the primary revenue channel, consider the Small Business Program's 15% rate (which applies after 12 months of continuous subscription per subscriber).

---

## 7. App Store Submission Process

### 7.1 App Store Connect Setup

**Prerequisites:**
- Apple Developer account ($99/year) enrolled.
- App record created in App Store Connect.
- Bundle ID `one.zovo.focusmode-blocker` registered in Certificates, Identifiers & Profiles.
- Provisioning profiles created for all four targets (macOS app, macOS extension, iOS app, iOS extension).

**App Store Connect configuration:**

| Field | Value |
|---|---|
| App Name | Focus Mode - Blocker |
| Subtitle | Block Distractions. Build Focus. |
| Bundle ID | one.zovo.focusmode-blocker |
| SKU | focusmode-blocker-001 |
| Primary Language | English (U.S.) |
| Primary Category | Productivity |
| Secondary Category | Utilities |
| Content Rights | Does not contain third-party content |
| Age Rating | 4+ (no objectionable content) |
| Pricing | Free (with IAP) |

### 7.2 Required Screenshots

Apple requires screenshots for every supported device size per platform.

**macOS screenshots (minimum 3, maximum 10):**

| Size | Resolution |
|---|---|
| 16-inch MacBook Pro | 2880 x 1800 |
| 13-inch MacBook Air | 2560 x 1600 |

**Required macOS screenshot set for Focus Mode - Blocker:**
1. Safari with Focus Mode - Blocker popup open showing Focus Score and Quick Focus button
2. Block page showing motivational quote, streak, and time saved
3. Pomodoro timer active with countdown visible in Safari toolbar
4. Settings/options page showing blocklist management
5. Block page with Nuclear Mode countdown visible

**iOS screenshots (all required sizes):**

| Device | Resolution |
|---|---|
| iPhone 16 Pro Max (6.9") | 1320 x 2868 |
| iPhone 16 Pro (6.3") | 1206 x 2622 |
| iPhone SE (4.7") | 750 x 1334 |
| iPad Pro 13" | 2064 x 2752 |
| iPad 10.9" | 1640 x 2360 |

**Required iOS screenshot set for Focus Mode - Blocker:**
1. Safari with Focus Mode - Blocker popup (bottom sheet) showing Focus Score
2. Mobile block page with motivational quote and streak
3. Containing app home screen showing extension status and Focus Score widget
4. Settings flow showing how to enable the extension
5. Nuclear Mode active with timer countdown

### 7.3 App Store Description

**Promotional text (170 chars, changeable without review):**
```
Block distracting websites in Safari. Build focus streaks. Track your Focus Score. Free forever with 10 sites -- upgrade to Pro for unlimited blocking.
```

**Description (4000 chars max):**
```
Focus Mode - Blocker helps you take control of your browsing habits by blocking
distracting websites in Safari on Mac, iPhone, and iPad.

BLOCK DISTRACTIONS
- Block up to 10 websites for free (unlimited with Pro)
- Pre-built lists for Social Media and News sites
- One-tap Quick Focus to instantly start a distraction-free session
- Motivational block page shows your streak, time saved, and inspiring quotes

POMODORO TIMER
- Built-in 25/5 Pomodoro timer
- Automatic break reminders
- Session tracking and history

GAMIFICATION
- Focus Score (0-100) -- quantify your focus quality
- Daily streaks -- build consistency, see your longest streak grow
- Achievements and badges for reaching milestones

NUCLEAR MODE
- Set an unbypassable blocking timer (up to 1 hour free, 24 hours with Pro)
- Cannot be disabled until the timer expires
- Perfect for deep work sessions and exam cramming

PRO FEATURES ($4.99/mo)
- Unlimited blocked sites
- Wildcard/pattern blocking
- Whitelist mode (block everything except your work tools)
- Custom Pomodoro durations
- Extended Nuclear Mode (up to 24 hours)
- Detailed weekly and monthly reports
- Focus Score breakdown and trends
- Cross-device sync via iCloud
- Custom block page messages
- 15+ ambient sounds

PRIVACY FIRST
- All data stays on your device
- No browsing data collected
- No account required for free features
- No ads, ever

WORKS ON ALL YOUR APPLE DEVICES
- Safari on Mac, iPhone, and iPad
- iCloud sync keeps your blocklist and streak in sync (Pro)
- macOS Focus integration -- auto-block when system Focus is active

Built by Zovo (zovo.one). Questions? Contact support@zovo.one
```

**Keywords (100 chars max, comma-separated):**
```
focus,blocker,distraction,pomodoro,timer,website blocker,productivity,safari,nuclear,streak
```

### 7.4 Privacy Labels (App Privacy)

Apple requires developers to declare what data their app collects. Focus Mode - Blocker's privacy-first architecture means minimal declarations.

**App Privacy declarations for Focus Mode - Blocker:**

| Data Type | Collected? | Linked to Identity? | Used for Tracking? | Purpose |
|---|---|---|---|---|
| Browsing History | No | N/A | N/A | Focus Mode - Blocker does NOT read browsing history. It blocks URLs matching the user's blocklist locally. |
| Identifiers (Device ID) | No | N/A | N/A | A local UUID is generated for sync but is never transmitted to external servers in the free tier. |
| Usage Data (Product Interaction) | Yes (Pro only, optional) | No | No | Anonymized session counts and Focus Score for weekly reports. Data stays on device unless user enables sync. |
| Purchase History | Yes (IAP) | Yes | No | Managed by Apple. Required for Pro subscription verification via StoreKit. |
| Diagnostics (Crash Data) | Yes (optional) | No | No | If the user opts in via Apple's crash reporting. No custom crash reporting. |

**Privacy label summary:** "Data Not Collected" for the free tier. "Data Linked to You: Purchases" for Pro (because Apple manages subscription data).

**Privacy policy URL:** `https://zovo.one/focus-mode-blocker/privacy` -- must be provided in App Store Connect and in the containing app.

### 7.5 Review Process Expectations

Safari Web Extensions that block websites receive additional scrutiny during Apple's review process. Based on precedent from similar apps:

**Likely review concerns and responses:**

| Concern | Response |
|---|---|
| "Why does the extension need access to all websites?" | The extension blocks user-configured websites. Without broad access, the user would have to manually grant permission for each site they want to block, which defeats the purpose. The extension never reads page content -- it only checks URLs against the user's blocklist. |
| "The app's primary functionality appears to be the Safari extension." | Correct. The containing app provides extension management, onboarding, settings, Focus Score display, iCloud sync configuration, and widget management. It serves as the companion interface for the Safari extension. |
| "Nuclear Mode prevents the user from managing the extension." | Nuclear Mode is a voluntary, user-initiated feature with explicit confirmation and duration selection. The user opts in by choosing a duration (1-24 hours) and confirming. The extension cannot prevent the user from disabling it via Safari Settings -- Nuclear Mode only locks the in-extension settings. |
| "The app uses In-App Purchases." | Correct. The free tier is fully functional (10 blocked sites, Pomodoro timer, Focus Score, streaks). Pro features are clearly marked and accessible via IAP. No paywalls block core functionality. |

**Review timeline expectation:** 1-3 days for initial review. Possible 1-2 rejection cycles for a website-blocking extension on first submission. Plan for 2 weeks total from first submission to approval.

**Tips for smooth review:**
- Include a demo video showing the extension working in Safari.
- Provide reviewer notes explaining the "All Websites" permission.
- Ensure the containing app has meaningful functionality beyond "Enable Extension."
- Include the privacy policy URL prominently.

### 7.6 Pricing Configuration in App Store Connect

**In-App Purchase setup:**

| Product ID | Type | Price | Display Name | Description |
|---|---|---|---|---|
| `one.zovo.focusmode_blocker.pro.monthly` | Auto-Renewable Subscription | $4.99 | Focus Mode Pro (Monthly) | Unlimited sites, extended nuclear, reports, custom timers, sync, and more |
| `one.zovo.focusmode_blocker.pro.annual` | Auto-Renewable Subscription | $35.99 | Focus Mode Pro (Annual) | Save 40% -- all Pro features for one year |
| `one.zovo.focusmode_blocker.pro.lifetime` | Non-Consumable | $49.99 | Focus Mode Pro (Lifetime) | All Pro features forever -- one-time purchase |

**Subscription group:** Create a subscription group "Focus Mode Pro" containing the monthly and annual options. This allows users to upgrade/downgrade between plans.

**Introductory offers:**
- 7-day free trial for monthly plan (matches the Chrome trial).
- No trial for annual or lifetime (users who choose these are already committed).

**Promotional offers (post-launch):**
- Lapsed subscriber offer: $2.99/mo for 3 months.
- Founding member price: $2.99/mo for first 100 subscribers (time-limited in App Store Connect).

### 7.7 TestFlight Beta Testing

Before App Store submission, use TestFlight for beta testing:

1. **Internal testing:** Add team members (up to 100) via App Store Connect. Builds are available immediately after upload.
2. **External testing:** Add up to 10,000 external testers. Requires Beta App Review (usually 1 day).
3. **Public link:** Generate a TestFlight public link for Focus Mode - Blocker beta. Share on the Zovo website and social media.

**Beta testing checklist for Focus Mode - Blocker:**

- [ ] Extension enables correctly in Safari (macOS and iOS)
- [ ] All 10 free blocked sites work via declarativeNetRequest
- [ ] Block page renders with streak, Focus Score, quote, and time saved
- [ ] Pomodoro timer counts down accurately (wall-clock based)
- [ ] Nuclear Mode activates and locks settings
- [ ] Quick Focus starts a session from popup
- [ ] Pre-built lists (social, news) toggle correctly
- [ ] IAP purchase flow completes successfully (sandbox testing)
- [ ] IAP restore works on a second device
- [ ] iCloud sync transfers settings between devices (Pro)
- [ ] Ambient sounds play via containing app
- [ ] Notifications display for session start/end
- [ ] Widget shows current Focus Score and streak
- [ ] System Focus integration auto-enables blocking (macOS)
- [ ] Extension works in Private Browsing (if enabled by user)
- [ ] All locales render correctly (i18n)
- [ ] Performance: popup loads < 200ms, block page loads < 300ms

---

## 8. Automated Safari Build Pipeline

### 8.1 Build Script

The Safari build process converts the Chrome extension source into a signed Xcode project and archives it for distribution.

```bash
#!/bin/bash
# scripts/build-safari.sh
# Build Focus Mode - Blocker for Safari (macOS + iOS)
# Requires: macOS 13+, Xcode 15+, valid signing certificates

set -euo pipefail

# Configuration
PROJECT_ROOT="/Users/mike/Desktop/chrome-extensions/focus-mode-blocker"
SAFARI_PROJECT_DIR="${PROJECT_ROOT}/../focus-mode-blocker-safari"
CHROME_SRC="${PROJECT_ROOT}/src"
BUNDLE_ID="one.zovo.focusmode-blocker"
APP_NAME="Focus Mode - Blocker"
TEAM_ID="${APPLE_TEAM_ID:-XXXXXXXXXX}"  # Set via env or CI secret

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}[1/7] Cleaning previous Safari build...${NC}"
rm -rf "${SAFARI_PROJECT_DIR}"

echo -e "${GREEN}[2/7] Running Chrome extension build (if npm build exists)...${NC}"
if [ -f "${PROJECT_ROOT}/package.json" ]; then
    cd "${PROJECT_ROOT}"
    npm run build --if-present 2>/dev/null || true
fi

echo -e "${GREEN}[3/7] Converting Chrome extension to Safari Web Extension...${NC}"
xcrun safari-web-extension-converter "${CHROME_SRC}" \
    --project-location "${SAFARI_PROJECT_DIR}" \
    --app-name "${APP_NAME}" \
    --bundle-identifier "${BUNDLE_ID}" \
    --swift \
    --no-open \
    --force

echo -e "${GREEN}[4/7] Applying Safari-specific patches...${NC}"
# Copy shared native code into the project
SHARED_DIR="${SAFARI_PROJECT_DIR}/Shared"
mkdir -p "${SHARED_DIR}"

# Copy native Swift files (these are maintained separately)
NATIVE_SRC="${PROJECT_ROOT}/safari-native"
if [ -d "${NATIVE_SRC}" ]; then
    cp "${NATIVE_SRC}/SafariWebExtensionHandler.swift" "${SHARED_DIR}/"
    cp "${NATIVE_SRC}/StoreManager.swift" "${SHARED_DIR}/"
    cp "${NATIVE_SRC}/iCloudSyncManager.swift" "${SHARED_DIR}/"
    cp "${NATIVE_SRC}/FocusIntegration.swift" "${SHARED_DIR}/"
    cp "${NATIVE_SRC}/SharedDefaults.swift" "${SHARED_DIR}/"
    cp "${NATIVE_SRC}/AmbientSoundPlayer.swift" "${SHARED_DIR}/"
    cp "${NATIVE_SRC}/NotificationManager.swift" "${SHARED_DIR}/"
fi

# Apply JS patches for Safari compatibility
SAFARI_PATCHES="${PROJECT_ROOT}/safari-patches"
if [ -d "${SAFARI_PATCHES}" ]; then
    for patch in "${SAFARI_PATCHES}"/*.patch; do
        echo "  Applying patch: $(basename ${patch})"
        git apply --directory="${SAFARI_PROJECT_DIR}" "${patch}" 2>/dev/null || true
    done
fi

echo -e "${GREEN}[5/7] Synchronizing version number...${NC}"
# Read version from Chrome manifest
CHROME_VERSION=$(python3 -c "
import json
with open('${CHROME_SRC}/manifest.json') as f:
    print(json.load(f)['version'])
" 2>/dev/null || echo "1.0.0")

echo "  Version: ${CHROME_VERSION}"

# Update Xcode project version
cd "${SAFARI_PROJECT_DIR}"
find . -name 'Info.plist' -exec /usr/libexec/PlistBuddy -c \
    "Set :CFBundleShortVersionString ${CHROME_VERSION}" {} \; 2>/dev/null || true
find . -name 'Info.plist' -exec /usr/libexec/PlistBuddy -c \
    "Set :CFBundleVersion ${CHROME_VERSION}" {} \; 2>/dev/null || true

echo -e "${GREEN}[6/7] Building and archiving macOS target...${NC}"
xcodebuild archive \
    -project "${APP_NAME}.xcodeproj" \
    -scheme "${APP_NAME} (macOS)" \
    -destination "generic/platform=macOS" \
    -archivePath "${SAFARI_PROJECT_DIR}/build/${APP_NAME}-macOS.xcarchive" \
    DEVELOPMENT_TEAM="${TEAM_ID}" \
    CODE_SIGN_IDENTITY="Apple Distribution" \
    -quiet

echo -e "${GREEN}[7/7] Building and archiving iOS target...${NC}"
xcodebuild archive \
    -project "${APP_NAME}.xcodeproj" \
    -scheme "${APP_NAME} (iOS)" \
    -destination "generic/platform=iOS" \
    -archivePath "${SAFARI_PROJECT_DIR}/build/${APP_NAME}-iOS.xcarchive" \
    DEVELOPMENT_TEAM="${TEAM_ID}" \
    CODE_SIGN_IDENTITY="Apple Distribution" \
    -quiet

echo ""
echo -e "${GREEN}=== Safari build complete ===${NC}"
echo "  macOS archive: ${SAFARI_PROJECT_DIR}/build/${APP_NAME}-macOS.xcarchive"
echo "  iOS archive:   ${SAFARI_PROJECT_DIR}/build/${APP_NAME}-iOS.xcarchive"
echo ""
echo "Next steps:"
echo "  1. Open archives in Xcode Organizer to upload to App Store Connect"
echo "  2. Or use: xcodebuild -exportArchive to generate .ipa / .app"
```

### 8.2 Export and Upload Script

```bash
#!/bin/bash
# scripts/upload-safari.sh
# Export archives and upload to App Store Connect
# Requires: valid App Store Connect API key

set -euo pipefail

PROJECT_ROOT="/Users/mike/Desktop/chrome-extensions/focus-mode-blocker"
SAFARI_PROJECT_DIR="${PROJECT_ROOT}/../focus-mode-blocker-safari"
APP_NAME="Focus Mode - Blocker"
BUILD_DIR="${SAFARI_PROJECT_DIR}/build"

# App Store Connect API key (set via environment or CI secrets)
ASC_KEY_ID="${ASC_KEY_ID:-}"
ASC_ISSUER_ID="${ASC_ISSUER_ID:-}"
ASC_KEY_PATH="${ASC_KEY_PATH:-}"

# Export options plist for App Store distribution
cat > "${BUILD_DIR}/ExportOptions.plist" << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store-connect</string>
    <key>destination</key>
    <string>upload</string>
    <key>signingStyle</key>
    <string>automatic</string>
    <key>uploadSymbols</key>
    <true/>
</dict>
</plist>
PLIST

echo "Exporting and uploading macOS build..."
xcodebuild -exportArchive \
    -archivePath "${BUILD_DIR}/${APP_NAME}-macOS.xcarchive" \
    -exportOptionsPlist "${BUILD_DIR}/ExportOptions.plist" \
    -exportPath "${BUILD_DIR}/export-macOS" \
    -allowProvisioningUpdates

echo "Exporting and uploading iOS build..."
xcodebuild -exportArchive \
    -archivePath "${BUILD_DIR}/${APP_NAME}-iOS.xcarchive" \
    -exportOptionsPlist "${BUILD_DIR}/ExportOptions.plist" \
    -exportPath "${BUILD_DIR}/export-iOS" \
    -allowProvisioningUpdates

# Alternative: Upload using altool or notarytool
# xcrun altool --upload-app \
#     --file "${BUILD_DIR}/export-macOS/${APP_NAME}.pkg" \
#     --apiKey "${ASC_KEY_ID}" \
#     --apiIssuer "${ASC_ISSUER_ID}" \
#     --type macos

echo ""
echo "Upload complete. Check App Store Connect for processing status."
echo "https://appstoreconnect.apple.com"
```

### 8.3 CI/CD Considerations

**GitHub Actions (macOS runner required):**

```yaml
# .github/workflows/safari-build.yml
name: Safari Build & Upload

on:
  push:
    tags:
      - 'v*'  # Build on version tags
  workflow_dispatch:  # Manual trigger

jobs:
  build-safari:
    runs-on: macos-14  # macOS Sonoma runner with Xcode 15+
    timeout-minutes: 30

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Select Xcode version
        run: sudo xcode-select -s /Applications/Xcode_15.4.app

      - name: Install signing certificate
        env:
          CERTIFICATE_BASE64: ${{ secrets.APPLE_CERTIFICATE_BASE64 }}
          CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
          KEYCHAIN_PASSWORD: ${{ secrets.KEYCHAIN_PASSWORD }}
        run: |
          # Create temporary keychain
          security create-keychain -p "${KEYCHAIN_PASSWORD}" build.keychain
          security default-keychain -s build.keychain
          security unlock-keychain -p "${KEYCHAIN_PASSWORD}" build.keychain

          # Import certificate
          echo "${CERTIFICATE_BASE64}" | base64 --decode > certificate.p12
          security import certificate.p12 -k build.keychain \
            -P "${CERTIFICATE_PASSWORD}" -T /usr/bin/codesign
          security set-key-partition-list -S apple-tool:,apple: \
            -s -k "${KEYCHAIN_PASSWORD}" build.keychain

      - name: Install provisioning profiles
        env:
          MACOS_APP_PROFILE: ${{ secrets.MACOS_APP_PROVISIONING_PROFILE }}
          MACOS_EXT_PROFILE: ${{ secrets.MACOS_EXT_PROVISIONING_PROFILE }}
          IOS_APP_PROFILE: ${{ secrets.IOS_APP_PROVISIONING_PROFILE }}
          IOS_EXT_PROFILE: ${{ secrets.IOS_EXT_PROVISIONING_PROFILE }}
        run: |
          mkdir -p ~/Library/MobileDevice/Provisioning\ Profiles
          echo "${MACOS_APP_PROFILE}" | base64 --decode > ~/Library/MobileDevice/Provisioning\ Profiles/macos-app.provisionprofile
          echo "${MACOS_EXT_PROFILE}" | base64 --decode > ~/Library/MobileDevice/Provisioning\ Profiles/macos-ext.provisionprofile
          echo "${IOS_APP_PROFILE}" | base64 --decode > ~/Library/MobileDevice/Provisioning\ Profiles/ios-app.mobileprovision
          echo "${IOS_EXT_PROFILE}" | base64 --decode > ~/Library/MobileDevice/Provisioning\ Profiles/ios-ext.mobileprovision

      - name: Convert and build
        env:
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
        run: |
          chmod +x scripts/build-safari.sh
          ./scripts/build-safari.sh

      - name: Upload to App Store Connect
        env:
          ASC_KEY_ID: ${{ secrets.ASC_KEY_ID }}
          ASC_ISSUER_ID: ${{ secrets.ASC_ISSUER_ID }}
          ASC_KEY_PATH: ${{ secrets.ASC_KEY_PATH }}
        run: |
          chmod +x scripts/upload-safari.sh
          ./scripts/upload-safari.sh

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: safari-archives
          path: |
            ../focus-mode-blocker-safari/build/*.xcarchive
```

### 8.4 Version Synchronization Strategy

Chrome and Safari releases must stay in sync. The version number comes from a single source of truth.

**Single-source version management:**

The Chrome extension's `manifest.json` `"version"` field is the source of truth. The Safari build script reads this version and applies it to all Xcode targets.

```
manifest.json "version": "1.2.3"
    |
    +---> Chrome Web Store upload: v1.2.3
    |
    +---> Safari build script reads version
              |
              +---> macOS Info.plist CFBundleShortVersionString: 1.2.3
              +---> macOS Info.plist CFBundleVersion: 1.2.3
              +---> iOS Info.plist CFBundleShortVersionString: 1.2.3
              +---> iOS Info.plist CFBundleVersion: 1.2.3
              +---> App Store Connect: v1.2.3
```

**Release coordination:**

| Step | Action | Responsible |
|---|---|---|
| 1 | Bump version in `manifest.json` | Developer |
| 2 | Tag release `v1.2.3` in git | Developer |
| 3 | Chrome build workflow produces `.zip` for Chrome Web Store | CI (GitHub Actions) |
| 4 | Safari build workflow produces `.xcarchive` for App Store | CI (GitHub Actions, macOS runner) |
| 5 | Upload Chrome `.zip` to Chrome Web Store Developer Dashboard | CI or manual |
| 6 | Upload Safari archives to App Store Connect | CI or manual |
| 7 | Chrome Web Store review (~1-3 days) | Google |
| 8 | App Store review (~1-3 days) | Apple |
| 9 | Both versions go live | Automatic after review approval |

**Handling review timeline mismatch:**

- Chrome Web Store reviews are typically faster (hours to 1 day) than App Store reviews (1-3 days).
- If a critical bug fix needs to ship immediately, Chrome can be updated first. Safari follows when Apple approves.
- Maintain a `CHANGELOG.md` that tracks which version is live on each platform.
- For Safari, use phased release (App Store Connect option) to roll out to 7 days, reducing risk.

---

## Appendix A: Safari Compatibility Checklist

A quick-reference checklist for the development team when implementing Safari-specific changes.

### Must-Do Before Safari Beta

- [ ] Replace all `chrome.storage.sync` calls with the `StorageManager` abstraction (falls back to `storage.local` on Safari)
- [ ] Replace `offscreen` document audio playback with native messaging to containing app
- [ ] Add wall-clock-based timer calculation in `timer-engine.js` (do not rely on alarm tick counting)
- [ ] Add Safari detection utility (`IS_SAFARI` flag) in a shared module
- [ ] Handle missing `tabGroups` API gracefully (Pro feature, unsupported on Safari)
- [ ] Handle missing `identity` API (Google OAuth) -- Safari Pro auth goes through containing app
- [ ] Cap dynamic `declarativeNetRequest` rules at 4,000 for Safari
- [ ] Cap regex rules at 500 for Safari
- [ ] Add CSS-based content hiding in `detector.css` to prevent flash-of-blocked-content on iOS
- [ ] Implement `SafariWebExtensionHandler.swift` with all message types
- [ ] Implement `StoreManager.swift` with IAP for monthly, annual, and lifetime plans
- [ ] Implement `SharedDefaults.swift` for App Group data sharing
- [ ] Add error handling for `executeScript` silent failures on Safari
- [ ] Test all `_locales/` translations render correctly in Safari
- [ ] Test popup rendering on iOS bottom sheet (touch-optimized)
- [ ] Test block page Shadow DOM rendering on Safari
- [ ] Validate all `prebuilt-social.json` and `prebuilt-news.json` rules against Safari's DNR engine
- [ ] Create containing app with enable-extension instructions, settings, and status display

### Nice-to-Have for Safari Launch

- [ ] iCloud sync via `NSUbiquitousKeyValueStore` for settings and streaks
- [ ] System Focus integration (auto-enable blocking)
- [ ] iOS rich notifications via containing app `UNUserNotificationCenter`
- [ ] Focus Score widget (small, systemSmall)
- [ ] Streak Tracker widget (small)
- [ ] Live Activity for Nuclear Mode countdown (iOS 16.1+)
- [ ] macOS menu bar status item showing current session
- [ ] Spotlight integration for Quick Focus (Intents framework)

### Post-Launch Enhancements

- [ ] Screen Time API integration for OS-level blocking
- [ ] CloudKit integration for full session history sync (Pro)
- [ ] Siri Shortcuts ("Hey Siri, start Focus Mode")
- [ ] Apple Watch complication showing Focus Score
- [ ] iPadOS Stage Manager optimizations
- [ ] Mac Catalyst optimizations (if containing app uses UIKit)

---

## Appendix B: API Mapping Quick Reference

| Chrome API | Safari Support | Focus Mode - Blocker Adaptation |
|---|---|---|
| `chrome.declarativeNetRequest` | Supported | Lower dynamic rule limit (4,000 vs 30,000) |
| `chrome.storage.local` | Supported | No changes |
| `chrome.storage.sync` | Not supported | Fall back to `storage.local` + iCloud via native app |
| `chrome.alarms` | Supported | Wall-clock timer calculation for iOS reliability |
| `chrome.notifications` | Limited | Native app notifications on iOS |
| `chrome.scripting` | Supported (16.4+) | Error handling for silent failures |
| `chrome.tabs` | Partially supported | Handle undefined URLs gracefully |
| `chrome.offscreen` | Not supported | Native app audio playback |
| `chrome.identity` | Not supported | Native app OAuth or Sign in with Apple |
| `chrome.tabGroups` | Not supported | Feature disabled on Safari |
| `chrome.gcm` | Not supported | APNs via native app (if needed) |
| `chrome.i18n` | Supported | No changes |
| `chrome.action` | Supported | Toolbar icon differs slightly in Safari |
| `chrome.contextMenus` | Supported (macOS only, 17+) | Disabled on iOS |
| `chrome.runtime.sendNativeMessage` | Supported | Primary bridge to containing app |

---

*Document generated for Phase 16 (Cross-Browser Porter) -- Safari Porting*
*Focus Mode - Blocker by Zovo (zovo.one)*
*Bundle ID: one.zovo.focusmode-blocker*
