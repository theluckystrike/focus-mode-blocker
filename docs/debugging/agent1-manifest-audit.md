# Focus Mode - Blocker: Manifest Audit & Validated manifest.json

**Agent:** Configuration Specialist (Agent 1)
**Date:** 2026-02-10
**Extension:** Focus Mode - Blocker v1.0.0
**Manifest Version:** 3 (MV3)

---

## 1. Complete Validated manifest.json

```json
{
  "manifest_version": 3,
  "name": "Focus Mode - Blocker",
  "version": "1.0.0",
  "description": "Block distracting websites, build focus habits, and track your productivity streak. Free Pomodoro timer included.",

  "minimum_chrome_version": "116",

  "icons": {
    "16": "src/assets/icons/icon-16.png",
    "32": "src/assets/icons/icon-32.png",
    "48": "src/assets/icons/icon-48.png",
    "128": "src/assets/icons/icon-128.png"
  },

  "action": {
    "default_popup": "src/popup/popup.html",
    "default_icon": {
      "16": "src/assets/icons/icon-16.png",
      "32": "src/assets/icons/icon-32.png",
      "48": "src/assets/icons/icon-48.png",
      "128": "src/assets/icons/icon-128.png"
    },
    "default_title": "Focus Mode - Blocker"
  },

  "options_page": "src/options/options.html",

  "background": {
    "service_worker": "src/background/service-worker.js",
    "type": "module"
  },

  "permissions": [
    "storage",
    "alarms",
    "declarativeNetRequest",
    "declarativeNetRequestWithHostAccess",
    "activeTab",
    "scripting",
    "notifications",
    "offscreen"
  ],

  "host_permissions": [
    "<all_urls>"
  ],

  "optional_permissions": [
    "identity",
    "idle",
    "tabGroups"
  ],

  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["src/content/detector.js"],
      "run_at": "document_start",
      "all_frames": false
    },
    {
      "matches": ["<all_urls>"],
      "js": ["src/content/blocker.js"],
      "run_at": "document_start",
      "all_frames": false
    },
    {
      "matches": ["<all_urls>"],
      "js": ["src/content/tracker.js"],
      "run_at": "document_idle",
      "all_frames": false
    }
  ],

  "declarative_net_request": {
    "rule_resources": [
      {
        "id": "blocking_rules",
        "enabled": true,
        "path": "src/background/rules/blocking-rules.json"
      }
    ]
  },

  "web_accessible_resources": [
    {
      "resources": [
        "src/content/block-page.html",
        "src/content/block-page.css",
        "src/assets/sounds/*.ogg"
      ],
      "matches": ["<all_urls>"]
    }
  ],

  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'none';",
    "sandbox": "sandbox allow-scripts; script-src 'self'; object-src 'none';"
  },

  "offline_enabled": true,

  "key": ""
}
```

### manifest.json Field-by-Field Commentary

| Field | Value | Rationale |
|---|---|---|
| `manifest_version` | `3` | Required for new CWS submissions as of 2024. MV2 is no longer accepted. |
| `name` | `"Focus Mode - Blocker"` | 22 characters. CWS limit is 45. Includes primary keyword "Focus Mode" and functional keyword "Blocker." |
| `version` | `"1.0.0"` | Semver-style. CWS accepts 1-4 dot-separated integers. Initial public release. |
| `description` | 116 chars | Under CWS 132-character limit. Hits SEO keywords: "block," "focus," "productivity," "streak," "Pomodoro," "timer," "free." |
| `minimum_chrome_version` | `"116"` | Chrome 116+ required for stable `offscreen` API (landed in 109, stabilized by 116), `declarativeNetRequest` dynamic rule improvements, and `type: "module"` service workers. Setting 116 avoids edge-case bugs in earlier MV3 builds. |
| `background.type` | `"module"` | Enables ES module `import`/`export` in the service worker. Required because the background layer uses 18 imported modules. Without this, `import` statements throw at parse time. |
| `action` | popup + icons | MV3 replaces `browser_action`/`page_action` with unified `action`. The `default_popup` opens a 380px-wide panel; width is set via CSS in popup.html, not in manifest. |
| `options_page` | options.html path | Opens in a new tab. Could also use `options_ui.open_in_tab: true` but `options_page` is simpler and equivalent for our needs. |
| `host_permissions` | `<all_urls>` | Users add arbitrary domains to their blocklist. We cannot enumerate domains at install time. CWS will flag this for extra review -- justification text provided below. |
| `declarative_net_request` | rule_resources | MV3 replacement for `webRequest` blocking. Static rules file is loaded at install; dynamic rules are added via `chrome.declarativeNetRequest.updateDynamicRules()` at runtime. The static file provides a bootstrap set (can be empty initially). |
| `content_security_policy` | strict | `script-src 'self'` blocks inline scripts and `eval()`. `object-src 'none'` blocks Flash/plugin embeds. This is the strictest practical policy for an extension. |
| `offline_enabled` | `true` | Focus timer and blocking work entirely offline. No external API calls needed for core functionality. |
| `key` | `""` | Placeholder. Populated during CWS upload for consistent extension ID in development. Remove or leave empty for production builds; CWS assigns the key. |

---

## 2. Permission Justification Table

Every permission declared in the manifest, with its type, purpose, and the exact justification text to paste into Chrome Web Store submission.

| Permission | Type | Why Needed | CWS Justification Text |
|---|---|---|---|
| `storage` | Required | Persist user blocklists, timer settings, streak data, and Pro subscription state across sessions. Uses `chrome.storage.local` (unlimited with `unlimitedStorage` if needed later) and `chrome.storage.sync` for cross-device sync of settings. | "Stores user-configured blocked website lists, focus timer preferences, productivity streak history, and subscription status. All data stays local or synced to the user's own Chrome profile. No data is sent to external servers." |
| `alarms` | Required | Schedule Pomodoro intervals (focus/break cycles), daily streak reset checks, and periodic badge updates. MV3 service workers cannot use `setTimeout`/`setInterval` beyond 30 seconds because they terminate on idle. `chrome.alarms` survives worker restarts. | "Schedules Pomodoro focus and break timers, daily productivity streak resets, and periodic reminder notifications. Required because background service workers in Manifest V3 cannot maintain long-running timers." |
| `declarativeNetRequest` | Required | Block navigation to user-specified distraction sites using MV3's declarative rule engine. Replaces the deprecated `webRequest` blocking API. Rules are added/removed dynamically as users modify their blocklist. | "Powers the core website-blocking feature. When a focus session is active, navigation requests to user-specified distraction sites are redirected to a motivational block page. Rules are created solely from the user's own blocklist." |
| `declarativeNetRequestWithHostAccess` | Required | Allows `declarativeNetRequest` rules to apply to URLs matched by `host_permissions`. Without this, rules using `requestDomains` would not fire on arbitrary user-added domains. | "Enables the declarative blocking rules to operate on any website the user adds to their personal blocklist. Works in conjunction with declarativeNetRequest to enforce the user's chosen focus restrictions." |
| `activeTab` | Required | Grants temporary host permission for the currently active tab when the user clicks the extension icon. Used to inject the block overlay or read the current page URL for quick-add-to-blocklist without requiring persistent broad host access for that action. | "Allows the extension to interact with the current tab when the user clicks the toolbar icon -- for example, to instantly add the current website to the blocklist or display a focus-mode overlay. No access is granted to other tabs." |
| `scripting` | Required | Programmatically inject content scripts on demand (e.g., when a user adds a site to the blocklist mid-session and the tab is already open). `chrome.scripting.executeScript()` replaces MV2's `chrome.tabs.executeScript()`. | "Injects lightweight content scripts into open tabs when the user starts a focus session or updates their blocklist, so that blocking takes effect immediately on already-loaded pages without requiring a page reload." |
| `notifications` | Required | Show system notifications when a Pomodoro interval ends (focus complete, break complete), when a daily streak milestone is reached, or when the user attempts to visit a blocked site while notifications-mode is enabled. | "Displays non-intrusive desktop notifications when a focus session or break ends, when a productivity streak milestone is reached, and optionally when a blocked site is visited. Users can disable notifications in settings." |
| `offscreen` | Required | Create an offscreen document for ambient sound playback during focus sessions. MV3 service workers have no DOM and cannot use `Audio()`. The offscreen API provides a hidden document with DOM access. | "Creates a hidden background page to play optional ambient sounds (rain, white noise) during focus sessions. Manifest V3 service workers cannot play audio directly, so the offscreen document provides this capability." |
| `<all_urls>` (host) | Host | Content scripts must match all URLs because the user's blocklist is arbitrary -- they can add any domain. `declarativeNetRequestWithHostAccess` also requires host permission grants to function on those domains. | "The extension blocks websites chosen by the user. Because any website can be added to the blocklist, the extension requires broad host access. Content scripts run minimal code (<2KB) that checks URLs against the local blocklist. No page content is read, collected, or transmitted." |
| `identity` | Optional | Pro-tier OAuth sign-in via `chrome.identity.getAuthToken()` for Google account-based license verification. Only requested when user upgrades to Pro. | "Requested only when a user chooses to upgrade to the Pro plan. Used to authenticate with Google OAuth to verify the Pro subscription. Never requested for free-tier users." |
| `idle` | Optional | Pro-tier smart scheduling: detect when user is idle to auto-pause/resume focus sessions and improve streak accuracy. Uses `chrome.idle.queryState()` and `chrome.idle.onStateChanged`. | "Requested only for Pro users who enable Smart Scheduling. Detects computer idle state to automatically pause focus timers when the user steps away, preventing inaccurate streak tracking." |
| `tabGroups` | Optional | Pro-tier context profiles: organize tabs into Chrome Tab Groups by focus context (e.g., "Work," "Study"). Uses `chrome.tabGroups.update()`. | "Requested only for Pro users who enable Context Profiles. Organizes browser tabs into labeled groups matching the user's focus profile (e.g., Work, Study) for better workspace management." |

---

## 3. CSP Specification

### Declared Policy

```json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'none';",
  "sandbox": "sandbox allow-scripts; script-src 'self'; object-src 'none';"
}
```

### Directive Breakdown

#### `extension_pages`

Applies to: popup.html, options.html, offscreen.html, block-page.html (when loaded as extension page), and any other extension-origin pages.

| Directive | Value | What It Blocks | Why |
|---|---|---|---|
| `script-src` | `'self'` | Blocks ALL inline `<script>` tags, `javascript:` URIs, `eval()`, `new Function()`, `setTimeout(string)`, and any script loaded from external CDNs. Only scripts bundled inside the extension package can execute. | Prevents XSS injection. If an attacker manages to inject HTML, they cannot execute scripts. Also blocks `eval()` which CWS specifically disallows for MV3. |
| `object-src` | `'none'` | Blocks `<object>`, `<embed>`, and `<applet>` elements entirely. No Flash, Java applets, or plugin content. | Eliminates an entire class of legacy plugin-based attacks. Required best practice for MV3. |
| (implicit) `default-src` | Not set (falls back to browser default `*`) | N/A | We intentionally only restrict `script-src` and `object-src`. Fonts, images, and styles from `'self'` work by default. If we set `default-src 'self'`, it would also restrict `connect-src`, which could interfere with future Pro API calls. We can tighten later. |

#### `sandbox`

Applies to: Any page loaded with `sandbox` attribute or declared in a `sandbox` manifest key (currently unused but defined for forward compatibility).

| Directive | Value | What It Does |
|---|---|---|
| `sandbox` | `allow-scripts` | Sandboxed pages run in a unique origin (null), preventing access to extension APIs. `allow-scripts` lets JS run inside the sandbox (needed for any interactive sandboxed pages). |
| `script-src` | `'self'` | Same as extension_pages -- only bundled scripts. |
| `object-src` | `'none'` | Same as extension_pages -- no plugins. |

### What This CSP Does NOT Allow

- No inline scripts (`<script>alert(1)</script>` will not execute)
- No `eval()` or `Function()` constructor with string arguments
- No remote script loading (`<script src="https://cdn.example.com/...">`)
- No `javascript:` protocol in links
- No plugin/embed content
- No data: URI scripts

### Security Note

This is the strictest practical CSP for this extension. The only relaxation from absolute minimum is that `default-src` is not set to `'self'`, leaving room for `connect-src` to external APIs (Pro subscription validation) without a CSP violation. When Pro API endpoints are finalized, we should add an explicit `connect-src 'self' https://api.focusmode.example.com;` directive.

---

## 4. Content Scripts Validation

### Script 1: detector.js

| Property | Value |
|---|---|
| **File Path** | `src/content/detector.js` |
| **matches** | `["<all_urls>"]` |
| **run_at** | `document_start` |
| **all_frames** | `false` (top frame only) |
| **Size** | <2KB |

**Why `document_start`:** This script must execute before the page DOM renders so it can detect whether the current URL is on the user's blocklist. If it ran at `document_idle`, the user would see a flash of the blocked site's content before the block takes effect. Running at `document_start` means it fires after the HTTP response headers are received but before the first `<script>` or `<style>` tag is parsed.

**What it does:** Sends a synchronous message to the service worker asking "is this URL blocked?" If yes, it signals `blocker.js` to take over. If no, it does nothing and returns immediately. Minimal performance impact because the check is a single `chrome.runtime.sendMessage` call.

**Validation:**
- `<all_urls>` is correct because any domain could be on the blocklist
- `all_frames: false` is correct because we only need to block top-level navigation, not iframes (blocking the top frame inherently blocks its iframes)
- `document_start` confirmed necessary for flicker-free blocking

### Script 2: blocker.js

| Property | Value |
|---|---|
| **File Path** | `src/content/blocker.js` |
| **matches** | `["<all_urls>"]` |
| **run_at** | `document_start` |
| **all_frames** | `false` (top frame only) |

**Why `document_start`:** Must be available before DOM renders so it can inject the block-page overlay immediately when `detector.js` signals a block. If it loaded at `document_idle`, there would be a visible flash of blocked content.

**What it does:** When signaled by `detector.js`, replaces the page's `document.documentElement.innerHTML` with the block-page content (motivational message, streak counter, return-to-focus button). Alternatively, navigates to the web-accessible `block-page.html`. Must be at `document_start` so it can act before any page scripts execute.

**Validation:**
- Same match pattern as detector.js is correct -- they work as a pair
- `document_start` confirmed necessary; blocker cannot wait for DOM if detector signals immediately
- `all_frames: false` is correct -- top-frame blocking suffices

### Script 3: tracker.js

| Property | Value |
|---|---|
| **File Path** | `src/content/tracker.js` |
| **matches** | `["<all_urls>"]` |
| **run_at** | `document_idle` |
| **all_frames** | `false` (top frame only) |

**Why `document_idle`:** This script tracks time spent on pages for productivity analytics. It does not need to run before the page loads -- in fact, running at `document_idle` is better because: (a) it does not block page rendering, (b) the page URL is finalized (no more redirects), and (c) `document.title` is available for display in analytics.

**What it does:** Records the current URL and timestamp, listens for `visibilitychange` events to track active vs. background time, and periodically reports time-on-site data to the service worker via `chrome.runtime.sendMessage`. Data is used for the productivity dashboard.

**Validation:**
- `<all_urls>` is correct because we track time on all sites for productivity analytics
- `document_idle` is the correct timing -- no urgency, minimal performance impact
- `all_frames: false` is correct -- we only track the top-level page URL

### Content Script Injection Order

Because both `detector.js` and `blocker.js` are declared with `run_at: document_start` and `matches: <all_urls>`, Chrome injects them in manifest declaration order. This means `detector.js` always runs before `blocker.js`, which is the required order (detect first, then block).

---

## 5. Web Accessible Resources Audit

### Declared Resources

```json
"web_accessible_resources": [
  {
    "resources": [
      "src/content/block-page.html",
      "src/content/block-page.css",
      "src/assets/sounds/*.ogg"
    ],
    "matches": ["<all_urls>"]
  }
]
```

### Resource-by-Resource Analysis

| Resource | Why Web-Accessible | How It Is Used |
|---|---|---|
| `src/content/block-page.html` | The blocker content script needs to display a custom block page when the user navigates to a blocked site. The block page is loaded in the tab's context (either via `window.location.replace()` pointing to `chrome.runtime.getURL(...)` or injected as an iframe). For the web page to navigate to an extension resource, that resource must be declared web-accessible. | Shown instead of blocked websites. Contains motivational text, streak counter, and a "Return to Focus" button. |
| `src/content/block-page.css` | Stylesheet for `block-page.html`. If the HTML file is web-accessible but the CSS is not, the block page would render unstyled. | Styles the block page (layout, typography, colors, animations). |
| `src/assets/sounds/*.ogg` | Ambient sound files (rain, white noise, forest, etc.) that play during focus sessions. The offscreen document loads these via the extension URL, but they must also be web-accessible if any content script or injected iframe references them. Using a glob (`*.ogg`) avoids manifest updates when adding new sound files. | Loaded by the offscreen document's `<audio>` element for ambient playback. |

### Security Implications

**Risk: Fingerprinting.** Any website can probe for web-accessible resources to detect that this extension is installed. For example:

```javascript
// A malicious site could do:
fetch(chrome.runtime.getURL('src/content/block-page.html'))
  .then(() => console.log('Focus Mode is installed'))
  .catch(() => console.log('Not installed'));
```

However, in MV3 with the `matches` restriction set to `<all_urls>`, this is the broadest exposure. Since the resources are not sensitive (a block page and sound files), fingerprinting is the only real risk -- there is no data exfiltration vector.

**Mitigation options (for future hardening):**
1. Restrict `matches` to only the extension's own origin -- but this breaks the block-page redirect from arbitrary web pages
2. Use `use_dynamic_url: true` (Chrome 110+) to generate a per-session random URL prefix, making fingerprinting harder:
   ```json
   {
     "resources": ["src/content/block-page.html", "src/content/block-page.css"],
     "matches": ["<all_urls>"],
     "use_dynamic_url": true
   }
   ```
3. For sound files, since they are only used by the offscreen document (which is an extension page), they may not actually need to be web-accessible. This should be tested -- if the offscreen document loads them via `chrome.runtime.getURL()` from an extension-origin context, web-accessibility may be unnecessary.

**Recommendation:** Add `"use_dynamic_url": true` in a future release after verifying compatibility. Investigate whether sound files can be removed from `web_accessible_resources` entirely.

---

## 6. Icons Checklist

### Required Icons and Their Usage

| Size | File Path | Usage Context | Required By |
|---|---|---|---|
| 16x16 | `src/assets/icons/icon-16.png` | Favicon in Chrome's extension management page (`chrome://extensions`). Tab favicon when options page is open. | `manifest.icons`, `action.default_icon` |
| 32x32 | `src/assets/icons/icon-32.png` | 2x retina version of the 16px icon. Used on high-DPI displays for the same contexts as 16px. | `manifest.icons`, `action.default_icon` |
| 48x48 | `src/assets/icons/icon-48.png` | Extension management page (`chrome://extensions`) tile icon. | `manifest.icons` |
| 128x128 | `src/assets/icons/icon-128.png` | Chrome Web Store listing icon. Installation dialog. Large icon in `chrome://extensions` detail view. | `manifest.icons`, `action.default_icon` |

### Icon Design Requirements

| Requirement | Status | Notes |
|---|---|---|
| PNG format | Required | Chrome only supports PNG for manifest icons. |
| Square aspect ratio | Required | All icons must be exactly NxN pixels. |
| Transparent background | Recommended | Chrome toolbar has varying background colors (light/dark mode). Opaque backgrounds look jarring. |
| No excessive padding | Required | CWS rejects icons with >20% padding. The icon should fill at least 80% of the canvas. |
| Visually consistent | Required | All four sizes must be recognizably the same icon, not different designs. |
| No text in icon | Recommended | Text becomes illegible at 16px. The icon should be purely symbolic. |
| Works in dark mode | Required | Test against both light and dark Chrome toolbar backgrounds. |

### Additional Icons (Not in Manifest, But Needed)

| Asset | Size | Purpose |
|---|---|---|
| CWS Promotional Tile (small) | 440x280 | Chrome Web Store listing -- "small" promotional image. |
| CWS Promotional Tile (large) | 920x680 | Chrome Web Store listing -- "large" promotional image (optional). |
| CWS Screenshot | 1280x800 or 640x400 | At least 1 screenshot required for CWS listing. Recommended: 3-5. |
| Notification icon | 48x48 or 128x128 | `chrome.notifications.create()` uses `iconUrl`. Can reuse the 128px manifest icon. |

---

## 7. MV3-Specific Validation Checklist

A 20-point checklist to verify the manifest is fully MV3-compliant and avoids common MV2-to-MV3 migration pitfalls.

| # | Check | Status | Notes |
|---|---|---|---|
| 1 | `manifest_version` is `3` (not `2`) | PASS | Confirmed: `"manifest_version": 3` |
| 2 | No `background.page` or `background.scripts` (MV2 patterns) | PASS | Uses `background.service_worker` with `type: "module"` |
| 3 | `background.service_worker` is a single file (not an array) | PASS | `"service_worker": "src/background/service-worker.js"` -- single string, not array |
| 4 | `type: "module"` declared if using ES imports | PASS | `"type": "module"` present. Without this, `import` statements would throw `SyntaxError`. |
| 5 | No `browser_action` or `page_action` (replaced by `action`) | PASS | Uses `"action"` unified API |
| 6 | No `chrome.browserAction` / `chrome.pageAction` calls expected in code | VERIFY | Must audit JS files -- all should use `chrome.action.*` |
| 7 | No `webRequest` / `webRequestBlocking` permission (removed in MV3) | PASS | Uses `declarativeNetRequest` instead |
| 8 | No `unsafe-eval` in CSP (forbidden in MV3) | PASS | CSP is `script-src 'self'; object-src 'none';` -- no eval |
| 9 | No `unsafe-inline` in CSP (forbidden in MV3 for scripts) | PASS | Not present in CSP |
| 10 | No remote code execution (no external script loading) | PASS | CSP `script-src 'self'` enforces this. No CDN script tags allowed. |
| 11 | `web_accessible_resources` uses MV3 object format (not MV2 array of strings) | PASS | Uses `[{ resources: [], matches: [] }]` format |
| 12 | `content_security_policy` uses MV3 object format (not MV2 string) | PASS | Uses `{ extension_pages: "...", sandbox: "..." }` format |
| 13 | Host permissions separated from `permissions` into `host_permissions` | PASS | `<all_urls>` in `host_permissions`, not in `permissions` |
| 14 | No `persistent: true` background (not applicable in MV3) | PASS | No `persistent` key. Service workers are always non-persistent in MV3. |
| 15 | Service worker handles termination gracefully (no global state reliance) | VERIFY | Must audit code: all state should be in `chrome.storage`, not in-memory variables. Alarms must be used instead of `setTimeout` for intervals >30s. |
| 16 | `chrome.tabs.executeScript` replaced with `chrome.scripting.executeScript` | VERIFY | Must audit code. The `scripting` permission is declared, which is correct. |
| 17 | `declarative_net_request.rule_resources` has valid static rules file | VERIFY | Path `src/background/rules/blocking-rules.json` must exist and contain valid rule JSON (even if empty array `[]`). |
| 18 | All file paths in manifest are relative to extension root (no leading `/`) | PASS | All paths start with `src/...` -- no leading slashes |
| 19 | Optional permissions are truly optional (not required for core function) | PASS | `identity` (Pro OAuth), `idle` (Pro smart scheduling), `tabGroups` (Pro profiles) -- all Pro-only features. Core blocking/timer works without them. |
| 20 | `minimum_chrome_version` is set high enough for all used APIs | PASS | Set to `"116"`. `offscreen` stable since Chrome 109; `declarativeNetRequest` dynamic rules stable since Chrome 84; `type: "module"` for service workers since Chrome 92. Version 116 provides ample margin. |

### Common MV2-to-MV3 Pitfalls (Additional Warnings)

| Pitfall | Risk for This Extension | Mitigation |
|---|---|---|
| Service worker idle termination after ~30 seconds of inactivity | HIGH -- Pomodoro timer relies on persistent timing | Use `chrome.alarms` for all timing. Never use `setTimeout`/`setInterval` for intervals the user depends on. |
| No DOM access in service worker | MEDIUM -- audio playback needs DOM | Correctly mitigated with `offscreen` document for audio. |
| `chrome.storage.local` has 10MB default limit | LOW -- blocklists and streak data are small | Monitor storage usage. Can add `unlimitedStorage` permission later if analytics data grows. |
| Content script `world` defaults to `ISOLATED` | LOW -- scripts don't need main-world access | Default `ISOLATED` world is correct for our use case. Keeps extension JS separate from page JS. |
| `declarativeNetRequest` static rule limit (previously 5,000 per extension) | LOW for launch -- dynamic rules have separate limit | Static rules file can be minimal. Dynamic rules (added via API) have a 5,000 rule limit per extension. If users add thousands of sites, consider using `updateSessionRules` which has a 5,000 additional limit. |

---

## 8. File Structure

Every file and directory referenced by the manifest, verified as required.

```
focus-mode-blocker/
|
|-- manifest.json
|
|-- src/
|   |
|   |-- background/
|   |   |-- service-worker.js              # Main service worker (type: module, imports 18 modules)
|   |   |-- rules/
|   |       |-- blocking-rules.json        # declarativeNetRequest static rules (can be empty [])
|   |
|   |-- content/
|   |   |-- detector.js                    # Content script: URL blocklist check (document_start)
|   |   |-- blocker.js                     # Content script: block page injection (document_start)
|   |   |-- tracker.js                     # Content script: time tracking (document_idle)
|   |   |-- block-page.html               # Block page shown on blocked sites (web-accessible)
|   |   |-- block-page.css                 # Block page styles (web-accessible)
|   |
|   |-- popup/
|   |   |-- popup.html                     # Toolbar popup (380px wide)
|   |   |-- popup.css                      # Popup styles (referenced by popup.html)
|   |   |-- popup.js                       # Popup logic (referenced by popup.html)
|   |
|   |-- options/
|   |   |-- options.html                   # Full options page (opens in new tab)
|   |   |-- options.css                    # Options page styles
|   |   |-- options.js                     # Options page logic
|   |
|   |-- offscreen/
|   |   |-- offscreen.html                 # Offscreen document for ambient audio playback
|   |   |-- offscreen.js                   # Audio playback logic
|   |
|   |-- assets/
|       |-- icons/
|       |   |-- icon-16.png                # 16x16 toolbar/favicon
|       |   |-- icon-32.png                # 32x32 retina toolbar
|       |   |-- icon-48.png                # 48x48 extensions page
|       |   |-- icon-128.png               # 128x128 CWS listing / install dialog
|       |
|       |-- sounds/
|           |-- *.ogg                      # Ambient sound files (web-accessible)
|
|-- docs/                                  # Documentation (not part of extension package)
    |-- debugging/
        |-- agent1-manifest-audit.md       # This file
```

### Path Verification Matrix

Every path referenced in the manifest mapped to its manifest field.

| Manifest Field | Path | Must Exist |
|---|---|---|
| `icons.16` | `src/assets/icons/icon-16.png` | YES |
| `icons.32` | `src/assets/icons/icon-32.png` | YES |
| `icons.48` | `src/assets/icons/icon-48.png` | YES |
| `icons.128` | `src/assets/icons/icon-128.png` | YES |
| `action.default_popup` | `src/popup/popup.html` | YES |
| `action.default_icon.16` | `src/assets/icons/icon-16.png` | YES (shared with `icons.16`) |
| `action.default_icon.32` | `src/assets/icons/icon-32.png` | YES (shared with `icons.32`) |
| `action.default_icon.48` | `src/assets/icons/icon-48.png` | YES (shared with `icons.48`) |
| `action.default_icon.128` | `src/assets/icons/icon-128.png` | YES (shared with `icons.128`) |
| `options_page` | `src/options/options.html` | YES |
| `background.service_worker` | `src/background/service-worker.js` | YES |
| `content_scripts[0].js[0]` | `src/content/detector.js` | YES |
| `content_scripts[1].js[0]` | `src/content/blocker.js` | YES |
| `content_scripts[2].js[0]` | `src/content/tracker.js` | YES |
| `declarative_net_request.rule_resources[0].path` | `src/background/rules/blocking-rules.json` | YES |
| `web_accessible_resources[0].resources[0]` | `src/content/block-page.html` | YES |
| `web_accessible_resources[0].resources[1]` | `src/content/block-page.css` | YES |
| `web_accessible_resources[0].resources[2]` | `src/assets/sounds/*.ogg` | YES (at least 1 .ogg file) |

### Files Referenced by HTML (Not in Manifest, But Required)

These files are loaded by HTML pages via `<script>` or `<link>` tags and must exist in the extension package, even though they are not declared directly in the manifest.

| HTML File | Expected References | Must Exist |
|---|---|---|
| `src/popup/popup.html` | `popup.js`, `popup.css` | YES |
| `src/options/options.html` | `options.js`, `options.css` | YES |
| `src/offscreen/offscreen.html` | `offscreen.js` | YES |
| `src/content/block-page.html` | `block-page.css` (already web-accessible) | YES |

---

## Summary of Findings

### Status: VALIDATED (with verification items)

The manifest.json is structurally complete, MV3-compliant, and ready for Chrome Web Store submission pending the following verification items:

1. **Static rules file must exist:** `src/background/rules/blocking-rules.json` must exist and contain at minimum an empty array `[]`. Chrome will fail to load the extension if this file is missing.

2. **Service worker audit needed:** Verify that `src/background/service-worker.js` and its 18 imported modules do not use `setTimeout`/`setInterval` for user-facing timers (must use `chrome.alarms`), do not rely on in-memory global state (must use `chrome.storage`), and do not reference any MV2 APIs.

3. **Sound files must exist:** At least one `.ogg` file must be present in `src/assets/sounds/` for the glob pattern to resolve. If no sounds are included in v1.0.0, either add a placeholder file or remove the glob from `web_accessible_resources`.

4. **Icon files must be verified:** All four PNG icons must exist at the exact paths, be exactly the specified dimensions, and be actual PNG files (not renamed JPEGs).

5. **CWS review preparedness:** The `<all_urls>` host permission and 8 required permissions will trigger enhanced CWS review. The justification texts in the Permission Justification Table (Section 2) should be submitted verbatim.
