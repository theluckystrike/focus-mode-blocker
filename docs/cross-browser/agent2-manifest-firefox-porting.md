# Focus Mode - Blocker: Manifest Comparison & Firefox Porting Guide

**Agent:** Cross-Browser Porter (Agent 2)
**Date:** 2026-02-11
**Extension:** Focus Mode - Blocker v1.0.0
**Phase:** 16 -- Cross-Browser Porting

---

## Table of Contents

1. [Manifest Comparison Across Browsers](#1-manifest-comparison-across-browsers)
2. [Firefox Porting Guide](#2-firefox-porting-guide)
3. [web-ext Integration](#3-web-ext-integration)
4. [AMO Submission](#4-amo-submission)
5. [Firefox-Specific Features to Leverage](#5-firefox-specific-features-to-leverage)

---

## 1. Manifest Comparison Across Browsers

### 1.1 Current Chrome MV3 Manifest (Production)

This is the validated manifest from the Chrome build, containing every permission and feature declared by Focus Mode - Blocker.

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
  "host_permissions": ["<all_urls>"],
  "optional_permissions": ["identity", "idle", "tabGroups"],
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
  "default_locale": "en",
  "key": ""
}
```

### 1.2 Firefox MV3 Manifest Adaptation

Firefox has supported MV3 since Firefox 109 (January 2023). Firefox MV3 differs from Chrome MV3 in several critical ways that affect Focus Mode - Blocker directly.

```json
{
  "manifest_version": 3,
  "name": "Focus Mode - Blocker",
  "version": "1.0.0",
  "description": "Block distracting websites, build focus habits, and track your productivity streak. Free Pomodoro timer included.",
  "browser_specific_settings": {
    "gecko": {
      "id": "focusmode-blocker@zovo.one",
      "strict_min_version": "128.0"
    }
  },
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
  "options_ui": {
    "page": "src/options/options.html",
    "open_in_tab": true
  },
  "background": {
    "scripts": ["src/background/service-worker.js"],
    "type": "module"
  },
  "permissions": [
    "storage",
    "alarms",
    "declarativeNetRequest",
    "declarativeNetRequestWithHostAccess",
    "activeTab",
    "scripting",
    "notifications"
  ],
  "host_permissions": ["<all_urls>"],
  "optional_permissions": ["idle"],
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
    "extension_pages": "script-src 'self'; object-src 'none';"
  },
  "default_locale": "en"
}
```

**Key changes from Chrome:**
- `browser_specific_settings.gecko.id` is **required** for AMO submission and for `storage.sync` to work across Firefox installs
- `strict_min_version` set to `128.0` -- Firefox 128 (ESR baseline, June 2024) has stable MV3 support including `declarativeNetRequest`, `scripting` API, and background `type: "module"`
- `background.scripts` array replaces `background.service_worker` -- Firefox MV3 uses an event page model, not a true service worker
- `offscreen` permission **removed** -- Firefox does not support the Offscreen API; ambient sound playback requires an alternative approach (see Section 2.6)
- `identity` and `tabGroups` optional permissions **removed** -- `chrome.identity` is Chrome-specific (Firefox uses `browser.identity` with different OAuth flow); `tabGroups` does not exist in Firefox
- `options_ui` with `open_in_tab: true` replaces `options_page` -- Firefox prefers `options_ui`
- `sandbox` CSP section removed -- Firefox does not support sandbox CSP in manifests
- `offline_enabled` removed -- not a recognized manifest key in Firefox
- `minimum_chrome_version` replaced with `gecko.strict_min_version`
- `key` removed -- Firefox uses `gecko.id` for consistent extension identification

### 1.3 Firefox MV2 Manifest Adaptation (Legacy Fallback)

If targeting older Firefox versions (pre-109) or if AMO review requires MV2 during initial submission, this MV2 manifest covers the same functionality.

```json
{
  "manifest_version": 2,
  "name": "Focus Mode - Blocker",
  "version": "1.0.0",
  "description": "Block distracting websites, build focus habits, and track your productivity streak. Free Pomodoro timer included.",
  "browser_specific_settings": {
    "gecko": {
      "id": "focusmode-blocker@zovo.one",
      "strict_min_version": "91.0"
    }
  },
  "icons": {
    "16": "src/assets/icons/icon-16.png",
    "32": "src/assets/icons/icon-32.png",
    "48": "src/assets/icons/icon-48.png",
    "128": "src/assets/icons/icon-128.png"
  },
  "browser_action": {
    "default_popup": "src/popup/popup.html",
    "default_icon": {
      "16": "src/assets/icons/icon-16.png",
      "32": "src/assets/icons/icon-32.png",
      "48": "src/assets/icons/icon-48.png",
      "128": "src/assets/icons/icon-128.png"
    },
    "default_title": "Focus Mode - Blocker"
  },
  "options_ui": {
    "page": "src/options/options.html",
    "open_in_tab": true
  },
  "background": {
    "scripts": ["src/background/service-worker.js"],
    "persistent": false
  },
  "permissions": [
    "storage",
    "alarms",
    "activeTab",
    "notifications",
    "<all_urls>"
  ],
  "optional_permissions": ["idle"],
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
  "web_accessible_resources": [
    "src/content/block-page.html",
    "src/content/block-page.css",
    "src/assets/sounds/*.ogg"
  ],
  "content_security_policy": "script-src 'self'; object-src 'none';",
  "default_locale": "en"
}
```

**Key MV2 differences:**
- `browser_action` replaces `action` -- MV2 has no unified `action` API
- `web_accessible_resources` is a flat string array, not an array of objects with `matches`
- `content_security_policy` is a flat string, not a key/value object
- `permissions` includes host patterns inline (no separate `host_permissions`)
- `declarativeNetRequest` is **unavailable** in MV2 -- blocking must use `webRequest`/`webRequestBlocking` (requires rewriting the blocking engine)
- `background.persistent: false` enables the event page pattern (equivalent to service worker non-persistence)
- `type: "module"` is not supported in MV2 backgrounds -- the service worker must be bundled into a single file or use script concatenation
- `scripting` API unavailable -- use `browser.tabs.executeScript()` instead

**Recommendation:** Do not ship MV2 for Firefox. Firefox 128 ESR (June 2024) supports MV3 fully, and all current Firefox releases support MV3. MV2 would require rewriting the blocking engine from `declarativeNetRequest` to `webRequest`, which is a substantial effort. Target Firefox MV3 exclusively.

### 1.4 Safari Web Extension Manifest Adaptation

Safari Web Extensions (Safari 15.4+, macOS 12+ / iOS 15.4+) use a wrapped version of the Chrome MV3 manifest inside an Xcode project.

```json
{
  "manifest_version": 3,
  "name": "Focus Mode - Blocker",
  "version": "1.0.0",
  "description": "Block distracting websites, build focus habits, and track your productivity streak. Free Pomodoro timer included.",
  "icons": {
    "16": "src/assets/icons/icon-16.png",
    "32": "src/assets/icons/icon-32.png",
    "48": "src/assets/icons/icon-48.png",
    "128": "src/assets/icons/icon-128.png",
    "256": "src/assets/icons/icon-256.png",
    "512": "src/assets/icons/icon-512.png"
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
  "background": {
    "service_worker": "src/background/service-worker.js",
    "type": "module"
  },
  "permissions": [
    "storage",
    "alarms",
    "declarativeNetRequest",
    "activeTab",
    "scripting",
    "notifications"
  ],
  "host_permissions": ["<all_urls>"],
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
    "extension_pages": "script-src 'self'; object-src 'none';"
  }
}
```

**Safari-specific considerations:**
- `declarativeNetRequestWithHostAccess` is not recognized -- use `declarativeNetRequest` alone; Safari grants host access through the permissions prompt
- `offscreen` API is **not supported** -- same workaround as Firefox needed for ambient sounds
- `tabGroups` does not exist in Safari
- `identity` is not supported -- OAuth must use `browser.identity.launchWebAuthFlow()` or a custom popup
- Safari requires additional icon sizes (256, 512) for macOS Retina displays
- The extension must be wrapped in an Xcode project using `safari-web-extension-converter`
- Safari enforces a unique per-site permission model -- users must explicitly grant access to each domain, which conflicts with Focus Mode - Blocker's `<all_urls>` need. Users must enable "Allow on All Websites" in Safari preferences.
- `notifications` API has limited support in Safari -- no action buttons, limited display time
- `chrome.storage.sync` is not available -- all storage is local only

### 1.5 Complete Manifest Field Comparison Table

| Manifest Field | Chrome MV3 | Firefox MV3 | Firefox MV2 | Safari MV3 |
|---|---|---|---|---|
| `manifest_version` | `3` | `3` | `2` | `3` |
| `name` | Same | Same | Same | Same |
| `version` | `"1.0.0"` | Same | Same | Same |
| `description` | Same | Same | Same | Same |
| `browser_specific_settings` | Not used | **Required** -- `gecko.id` + `strict_min_version` | **Required** | Not used |
| `minimum_chrome_version` | `"116"` | Not used | Not used | Not used |
| `icons` | 16/32/48/128 | Same | Same | 16/32/48/128/**256/512** |
| `action` | Supported | Supported | **Not available** -- use `browser_action` | Supported |
| `browser_action` | Not available (MV3) | Not available (MV3) | **Required** | Not available (MV3) |
| `options_page` | Supported | Use `options_ui` instead | Use `options_ui` | Supported |
| `options_ui` | Supported | **Preferred** | **Required** | Supported |
| `background.service_worker` | Required | **Not used** -- use `scripts` array | **Not used** | Supported |
| `background.scripts` | Not used | **Required** (array) | **Required** (array) | Not used |
| `background.type: "module"` | Supported | Supported (FF 128+) | **Not supported** | Supported |
| `background.persistent` | Not used (MV3) | Not used (MV3) | `false` for event pages | Not used |
| `permissions: storage` | Yes | Yes | Yes | Yes |
| `permissions: alarms` | Yes | Yes | Yes | Yes |
| `permissions: declarativeNetRequest` | Yes | Yes (FF 128+) | **Not available** | Yes (limited) |
| `permissions: declarativeNetRequestWithHostAccess` | Yes | Yes (FF 128+) | **Not available** | **Not recognized** |
| `permissions: activeTab` | Yes | Yes | Yes | Yes |
| `permissions: scripting` | Yes | Yes | **Not available** -- use `tabs.executeScript` | Yes |
| `permissions: notifications` | Yes | Yes | Yes | Limited |
| `permissions: offscreen` | Yes | **Not supported** | **Not supported** | **Not supported** |
| `permissions: identity` | Optional | **Different API** (`browser.identity`) | **Different API** | **Not supported** |
| `permissions: idle` | Optional | Optional | Optional | Optional |
| `permissions: tabGroups` | Optional | **Not available** | **Not available** | **Not available** |
| `host_permissions` | Separate key | Separate key | Inline in `permissions` | Separate key |
| `content_scripts` | Object array | Same format | Same format | Same format |
| `declarative_net_request` | Full support | Supported (FF 128+) | **Not available** | Supported (limited) |
| `web_accessible_resources` | Object array with `matches` | Same format | **Flat string array** | Same format |
| `content_security_policy` | Object with keys | Object (no `sandbox` key) | **Flat string** | Object (no `sandbox`) |
| `offline_enabled` | Recognized | **Ignored** | **Ignored** | **Ignored** |
| `default_locale` | Supported | Supported | Supported | Supported |
| `key` | Dev ID consistency | Not used -- use `gecko.id` | Not used | Not used |
| `oauth2` | Supported | **Not supported** | **Not supported** | **Not supported** |

### 1.6 Manifest Generation Script

The following Node.js script generates browser-specific manifests from a single source of truth. Save as `scripts/generate-manifest.js`.

```javascript
#!/usr/bin/env node
/**
 * generate-manifest.js
 * Generates browser-specific manifest.json files for Focus Mode - Blocker.
 *
 * Usage:
 *   node scripts/generate-manifest.js chrome    -> dist/chrome/manifest.json
 *   node scripts/generate-manifest.js firefox   -> dist/firefox/manifest.json
 *   node scripts/generate-manifest.js safari    -> dist/safari/manifest.json
 *   node scripts/generate-manifest.js all       -> all three
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Shared base manifest -- all browsers share these fields
// ---------------------------------------------------------------------------
const BASE_MANIFEST = {
  name: 'Focus Mode - Blocker',
  version: '1.0.0',
  description:
    'Block distracting websites, build focus habits, and track your productivity streak. Free Pomodoro timer included.',
  icons: {
    16: 'src/assets/icons/icon-16.png',
    32: 'src/assets/icons/icon-32.png',
    48: 'src/assets/icons/icon-48.png',
    128: 'src/assets/icons/icon-128.png',
  },
  action: {
    default_popup: 'src/popup/popup.html',
    default_icon: {
      16: 'src/assets/icons/icon-16.png',
      32: 'src/assets/icons/icon-32.png',
      48: 'src/assets/icons/icon-48.png',
      128: 'src/assets/icons/icon-128.png',
    },
    default_title: 'Focus Mode - Blocker',
  },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/detector.js'],
      run_at: 'document_start',
      all_frames: false,
    },
    {
      matches: ['<all_urls>'],
      js: ['src/content/blocker.js'],
      run_at: 'document_start',
      all_frames: false,
    },
    {
      matches: ['<all_urls>'],
      js: ['src/content/tracker.js'],
      run_at: 'document_idle',
      all_frames: false,
    },
  ],
  declarative_net_request: {
    rule_resources: [
      {
        id: 'blocking_rules',
        enabled: true,
        path: 'src/background/rules/blocking-rules.json',
      },
    ],
  },
  web_accessible_resources: [
    {
      resources: [
        'src/content/block-page.html',
        'src/content/block-page.css',
        'src/assets/sounds/*.ogg',
      ],
      matches: ['<all_urls>'],
    },
  ],
  default_locale: 'en',
};

// ---------------------------------------------------------------------------
// Browser-specific builders
// ---------------------------------------------------------------------------

function buildChrome() {
  return {
    manifest_version: 3,
    ...BASE_MANIFEST,
    minimum_chrome_version: '116',
    options_page: 'src/options/options.html',
    background: {
      service_worker: 'src/background/service-worker.js',
      type: 'module',
    },
    permissions: [
      'storage',
      'alarms',
      'declarativeNetRequest',
      'declarativeNetRequestWithHostAccess',
      'activeTab',
      'scripting',
      'notifications',
      'offscreen',
    ],
    host_permissions: ['<all_urls>'],
    optional_permissions: ['identity', 'idle', 'tabGroups'],
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'none';",
      sandbox:
        "sandbox allow-scripts; script-src 'self'; object-src 'none';",
    },
    offline_enabled: true,
    key: '',
  };
}

function buildFirefox() {
  return {
    manifest_version: 3,
    ...BASE_MANIFEST,
    browser_specific_settings: {
      gecko: {
        id: 'focusmode-blocker@zovo.one',
        strict_min_version: '128.0',
      },
    },
    options_ui: {
      page: 'src/options/options.html',
      open_in_tab: true,
    },
    background: {
      scripts: ['src/background/service-worker.js'],
      type: 'module',
    },
    permissions: [
      'storage',
      'alarms',
      'declarativeNetRequest',
      'declarativeNetRequestWithHostAccess',
      'activeTab',
      'scripting',
      'notifications',
    ],
    host_permissions: ['<all_urls>'],
    optional_permissions: ['idle'],
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'none';",
    },
  };
}

function buildSafari() {
  const manifest = {
    manifest_version: 3,
    ...BASE_MANIFEST,
    options_ui: {
      page: 'src/options/options.html',
      open_in_tab: true,
    },
    background: {
      service_worker: 'src/background/service-worker.js',
      type: 'module',
    },
    permissions: [
      'storage',
      'alarms',
      'declarativeNetRequest',
      'activeTab',
      'scripting',
      'notifications',
    ],
    host_permissions: ['<all_urls>'],
    optional_permissions: ['idle'],
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'none';",
    },
  };
  // Safari needs larger icon sizes for Retina
  manifest.icons['256'] = 'src/assets/icons/icon-256.png';
  manifest.icons['512'] = 'src/assets/icons/icon-512.png';
  return manifest;
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

const BUILDERS = {
  chrome: buildChrome,
  firefox: buildFirefox,
  safari: buildSafari,
};

function writeManifest(browser) {
  const builder = BUILDERS[browser];
  if (!builder) {
    console.error(`Unknown browser: ${browser}. Use: chrome, firefox, safari, all`);
    process.exit(1);
  }
  const manifest = builder();
  const outDir = path.resolve(__dirname, '..', 'dist', browser);
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'manifest.json');
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Wrote ${browser} manifest -> ${outPath}`);
}

const target = process.argv[2] || 'all';
if (target === 'all') {
  Object.keys(BUILDERS).forEach(writeManifest);
} else {
  writeManifest(target);
}
```

**Usage during build:**

```bash
# Generate all manifests
node scripts/generate-manifest.js all

# Generate Firefox-only
node scripts/generate-manifest.js firefox

# Integration with npm scripts (package.json)
# "scripts": {
#   "build:chrome": "node scripts/generate-manifest.js chrome && <copy sources to dist/chrome>",
#   "build:firefox": "node scripts/generate-manifest.js firefox && <copy sources to dist/firefox>",
#   "build:all": "node scripts/generate-manifest.js all && <copy sources>"
# }
```

---

## 2. Firefox Porting Guide

### 2.1 Service Worker to Background Script Migration

Firefox MV3 does **not** use service workers for extension backgrounds. Instead, it uses **event-driven background scripts** (event pages). The practical differences for Focus Mode - Blocker are:

#### What Changes

| Aspect | Chrome MV3 (Service Worker) | Firefox MV3 (Event Page) |
|---|---|---|
| Execution model | ServiceWorkerGlobalScope -- no DOM, no `window` | Window-like scope -- has `window`, `document` (hidden) |
| Persistence | Terminated after ~30s idle | Terminated after ~30s idle (same behavior) |
| Module support | `type: "module"` in manifest | `type: "module"` supported since FF 128 |
| API namespace | `chrome.*` (Chromium) | `browser.*` (Promise-based) or `chrome.*` (callback-based, compatibility layer) |
| `importScripts()` | Available in SW context | **Not available** -- use ES module `import` |
| DOM access | None | Technically available but should not be used |

#### Focus Mode - Blocker Modules Requiring Changes

**`service-worker.js` (Entry Point)**

Chrome version uses service worker lifecycle events:

```javascript
// Chrome -- service worker pattern
self.addEventListener('install', (event) => { /* ... */ });
self.addEventListener('activate', (event) => { /* ... */ });
```

Firefox version should use the `browser.runtime` events:

```javascript
// Firefox -- event page pattern (also works on Chrome)
browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // First-install logic: run migrations, set defaults, open onboarding
  } else if (details.reason === 'update') {
    // Version update: run migrations
  }
});

browser.runtime.onStartup.addListener(() => {
  // Browser startup: restore cached state, re-register alarms
});
```

**Recommended approach:** Write the entry point using `browser.runtime.onInstalled` and `browser.runtime.onStartup` (which work on both Chrome and Firefox), and avoid service worker lifecycle events (`install`, `activate`, `fetch`) entirely. Focus Mode - Blocker does not use any service worker-specific features beyond the execution context.

**`blocking-engine.js` (declarativeNetRequest Rule Management)**

The `declarativeNetRequest` API is available in Firefox MV3 (FF 128+). The blocking engine's core methods -- `updateDynamicRules()`, `getDynamicRules()`, `getEnabledRulesets()`, `updateEnabledRulesets()` -- work identically. However:

- Firefox has a **dynamic rule limit of 5000** (same as Chrome's per-extension limit as of Chrome 121+).
- Firefox does **not support session-scoped rules** (`updateSessionRules()`). Focus Mode - Blocker should avoid session rules and use only dynamic rules, which persist across restarts.
- Rule conditions: `requestDomains` and `urlFilter` work on Firefox. `regexFilter` is supported but with stricter RE2 syntax enforcement on Firefox.

**`timer-engine.js` (Alarm-Based Timer)**

`chrome.alarms` works identically on Firefox MV3. The 1-minute minimum interval is the same. No changes needed for timer logic. However, alarm names should be verified against Firefox's naming constraints (alphanumeric + hyphens + underscores; no dots in some older builds).

**`notification-manager.js` (Notification Dispatch)**

Firefox notifications differ:
- `chrome.notifications.create()` works, but Firefox ignores the `buttons` property (no action buttons on notifications)
- `requireInteraction` is supported on Firefox (keeps notification visible until dismissed)
- Firefox shows notifications through the OS notification system, which means appearance varies by OS
- `chrome.notifications.onButtonClicked` will never fire on Firefox -- any logic gated behind notification button clicks (like "Start Pro Trial" from a notification) must have an alternative entry point

**`ambient-sound-manager.js` (Offscreen Document for Audio)**

This is the **most significant porting challenge**. Chrome uses the `offscreen` API to create a hidden document for audio playback. Firefox does not support `offscreen`. Alternatives:

1. **Use a background page `Audio` object** -- Firefox event pages have DOM access, so `new Audio('src/assets/sounds/rain.ogg')` works directly in the background script. However, audio may stop when the background page is suspended.

2. **Use a persistent hidden popup or sidebar** -- Open a small hidden page that handles audio. This is fragile and not recommended.

3. **Recommended: Content-script-based audio injection** -- Inject a small audio-player content script into the active tab that plays the ambient sound. This survives background suspension but stops when the tab navigates away. Combine with `browser.tabs.onUpdated` to re-inject on navigation.

4. **Alternative: Offscreen document polyfill** -- Create a hidden `about:blank` page using `browser.windows.create({ type: 'popup', width: 1, height: 1, focused: false })` and inject audio playback. This is hacky but works.

Best approach for Focus Mode - Blocker: Use option 1 (direct `Audio` in background) for Firefox, with alarm-based keep-alive to prevent suspension during active sound playback. If the background suspends, the alarm tick will re-wake it and resume playback. Wrap the implementation behind a `PlatformAudio` abstraction:

```javascript
// src/background/modules/platform-audio.js
const isFirefox = typeof browser !== 'undefined' && browser.runtime?.getBrowserInfo;

export class PlatformAudio {
  constructor() {
    this.audio = null;
    this.keepAliveAlarm = 'audio_keepalive';
  }

  async play(soundUrl, volume) {
    if (isFirefox) {
      // Firefox: direct Audio in background page
      this.audio = new Audio(browser.runtime.getURL(soundUrl));
      this.audio.loop = true;
      this.audio.volume = volume;
      await this.audio.play();
      // Keep background alive while audio plays
      browser.alarms.create(this.keepAliveAlarm, { periodInMinutes: 0.25 });
    } else {
      // Chrome: offscreen document
      await this._createOffscreenAndPlay(soundUrl, volume);
    }
  }

  stop() {
    if (isFirefox && this.audio) {
      this.audio.pause();
      this.audio = null;
      browser.alarms.clear(this.keepAliveAlarm);
    } else {
      this._stopOffscreen();
    }
  }
}
```

**`storage-manager.js` (Centralized Storage)**

Firefox supports both `browser.storage.local` and `browser.storage.sync`. Key differences:

- `storage.sync` quota on Firefox: 100KB total, 8KB per item (same as Chrome)
- `storage.sync` requires the `gecko.id` in the manifest to work correctly across Firefox installations
- `browser.storage.local` has no size limit on Firefox (same as Chrome with `unlimitedStorage`)
- The `browser.storage.*` API returns Promises natively on Firefox, while `chrome.storage.*` uses callbacks (though Chrome added Promise support). Use `browser.storage` consistently for Firefox.

**`gamification-engine.js` (Streaks, Focus Score)**

No Firefox-specific changes. Streak calculations depend only on date comparisons and storage data. The daily rollover alarm fires the same way.

**`license-manager.js` (Subscription Verification)**

The license verification `fetch()` calls to the Zovo API work the same on Firefox. However, the `chrome.identity.getAuthToken()` call for Google OAuth (Pro sign-in) does not exist on Firefox. Replace with:

```javascript
// Firefox OAuth flow
const redirectUrl = browser.identity.getRedirectURL();
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(redirectUrl)}&scope=${SCOPES}`;

const responseUrl = await browser.identity.launchWebAuthFlow({
  url: authUrl,
  interactive: true,
});
const token = new URL(responseUrl).hash.match(/access_token=([^&]*)/)[1];
```

### 2.2 declarativeNetRequest on Firefox

Firefox added `declarativeNetRequest` support in Firefox 115 and stabilized it in Firefox 128. Current status as of February 2026:

| Feature | Chrome | Firefox (128+) | Impact on Focus Mode - Blocker |
|---|---|---|---|
| Static rulesets | 50 rulesets, 10 enabled | 50 rulesets, 10 enabled | No impact -- we use 1 static ruleset |
| Static rules (per ruleset) | 30,000 | 30,000 | No impact -- pre-built lists total ~100 rules |
| Dynamic rules | 30,000 | 5,000 | **Potential issue** if a Pro user creates thousands of wildcard rules. Unlikely in practice but enforce a soft limit. |
| Session rules | 5,000 | **Not supported** | **Impact**: Any logic using `updateSessionRules()` must use `updateDynamicRules()` instead. Session rules do not persist across browser restarts -- use alarm-based re-registration for rules that should be temporary. |
| `urlFilter` | Full support | Full support | No impact |
| `regexFilter` | RE2 syntax | RE2 syntax (stricter) | **Minor impact**: Test wildcard blocking patterns (`*.reddit.com`, `*facebook*`) against Firefox's regex engine. Some character class shortcuts may differ. |
| `requestDomains` condition | Supported | Supported | No impact |
| `initiatorDomains` condition | Supported | Supported (FF 133+) | No impact |
| `redirect` action | Full support | Full support | No impact -- Pro redirect feature works |
| `modifyHeaders` action | Full support | Full support | Not used by Focus Mode - Blocker |
| `getMatchedRules()` | Supported | Supported | No impact |
| Rule priority | 1-based integer | Same | No impact |

**Nuclear Mode blocking of `chrome://extensions`:**

On Chrome, Focus Mode - Blocker uses a `declarativeNetRequest` rule to block access to `chrome://extensions` during Nuclear Mode, preventing the user from disabling the extension. On Firefox:

- Firefox's equivalent is `about:addons`, which cannot be blocked via `declarativeNetRequest` (browser internal pages are exempt).
- Firefox does not allow extensions to block access to `about:*` pages.
- **Mitigation:** Nuclear Mode on Firefox will be weaker -- the user can navigate to `about:addons` and disable the extension. Document this as a known limitation. Consider adding a content script for `about:addons` (if Firefox allows injection there -- currently it does not) or using `browser.management.setEnabled()` to lock the extension (requires `management` permission, which raises AMO review concerns).

### 2.3 Block Page Content Script and Shadow DOM

Focus Mode - Blocker's block page uses Shadow DOM to encapsulate its UI inside the blocked page, preventing the host page's CSS from interfering with the block page styling.

**Shadow DOM compatibility on Firefox:**

Firefox has full Shadow DOM v1 support since Firefox 63 (October 2018). The `attachShadow({ mode: 'closed' })` call works identically. Content script Shadow DOM isolation is reliable on Firefox. No changes needed for the basic Shadow DOM setup.

**CSS differences to address:**

| CSS Feature | Chrome | Firefox | Action |
|---|---|---|---|
| `:host` selector | Supported | Supported | No change |
| CSS custom properties through shadow boundary | Inherited | Inherited | No change |
| `backdrop-filter: blur()` | Supported | Supported (FF 103+) | No change, but verify with `@supports` |
| `-webkit-` prefixed properties | Supported | Partially supported | Replace `-webkit-font-smoothing` with `font-smooth`; replace `-webkit-text-fill-color` with `color` |
| `scrollbar-width` | Not supported (use `::-webkit-scrollbar`) | `scrollbar-width: thin` (native) | Add both declarations for cross-browser scrollbar styling |
| `font-feature-settings` | Supported | Supported | No change |
| `gap` in flexbox | Supported | Supported (FF 63+) | No change |

**Block page rendering for quotes and timer:**

The motivational quotes rotation (`src/assets/quotes.json` loaded via `fetch(browser.runtime.getURL(...))`) works identically on Firefox. The `browser.runtime.getURL()` function resolves web-accessible resource URLs correctly. The timer display using `requestAnimationFrame` for smooth countdown works the same. The only adjustment: replace `chrome.runtime.getURL()` calls with `browser.runtime.getURL()` (or use the `browser` namespace globally).

**Recommended cross-browser compatibility pattern for content scripts:**

```javascript
// src/content/compat.js -- loaded before other content scripts
const api = typeof browser !== 'undefined' ? browser : chrome;
```

### 2.4 Pomodoro Timer: Alarm API Differences

The Pomodoro timer is the core user-facing feature. It relies on `chrome.alarms` for persistence across service worker/event page suspensions.

| Alarm Behavior | Chrome MV3 | Firefox MV3 |
|---|---|---|
| Minimum alarm period | 1 minute | 1 minute |
| `delayInMinutes` < 1 | Clamped to 1 minute (warning in console) | Clamped to 1 minute |
| Alarm precision | ~1 minute (can fire late by several seconds) | ~1 minute (similar precision) |
| `chrome.alarms.getAll()` | Returns all active alarms | Same |
| `chrome.alarms.onAlarm` | Wakes service worker | Wakes event page |
| Alarm survival across browser restart | Yes | Yes |
| Alarm survival across extension update | **No** -- alarms cleared on update | **No** -- same behavior |

**Timer persistence strategy (same for both browsers):**

Focus Mode - Blocker stores the timer state in `chrome.storage.local` (active session start time, elapsed seconds, planned duration). On each alarm tick, it reads the session state, calculates the current elapsed time from `Date.now() - session.started_at`, and writes back. If the service worker/event page terminated between ticks, no state is lost because the source of truth is wall-clock time, not accumulated tick counts.

**Service worker wake-up patterns:**

Both Chrome and Firefox wake the background context on:
- `chrome.alarms.onAlarm` events
- `chrome.runtime.onMessage` from popup/content scripts
- `chrome.declarativeNetRequest` does NOT wake the background (rules are browser-engine-evaluated)

On Chrome, a service worker wakes for a maximum of 30 seconds per event. On Firefox, the event page stays alive for approximately 30 seconds of inactivity after the last event. In practice, Focus Mode - Blocker's alarm tick pattern (every 1 minute) keeps the background context cycling regularly during active sessions.

**No changes needed for the timer engine.**

### 2.5 Nuclear Mode on Firefox

Nuclear Mode is Focus Mode - Blocker's signature unbypassable blocking feature. On Chrome, it achieves unbypassability through:

1. Blocking `chrome://extensions` via `declarativeNetRequest` (prevents disabling the extension)
2. Locking storage writes to nuclear state fields (tamper-resistant via HMAC)
3. Hiding "Manage Extension" context menu via content script
4. Badge countdown display

**Firefox Nuclear Mode limitations:**

| Bypass Vector | Chrome Prevention | Firefox Status |
|---|---|---|
| Uninstall from `chrome://extensions` | Blocked via DNR rule | **Cannot block `about:addons`** -- Firefox does not allow blocking browser-internal pages |
| Right-click "Manage Extension" | Content script hides option | Firefox does not inject content scripts into the extension management context menu |
| Disable via extension management API | Not applicable (no management permission) | Same |
| Developer tools bypass | Service worker inspection possible but non-trivial | Event page inspection possible |
| Profile switching | Cannot prevent | Cannot prevent |
| Safe mode restart | Extension disabled in safe mode | Extension disabled in safe mode |

**Mitigation strategies for Firefox Nuclear Mode:**

1. **Honest messaging:** On Firefox, Nuclear Mode should display a disclaimer: "Nuclear Mode prevents casual bypassing. Determined users can disable the extension through about:addons." This honesty aligns with Firefox's privacy-respecting culture and will resonate better with AMO reviewers than attempts to lock down the browser.

2. **`browser_specific_settings` hardening:** Firefox's `gecko.id` ensures the extension cannot be spoofed, but it does not prevent disabling. There is no manifest-level mechanism to prevent user-initiated uninstall.

3. **Social accountability:** Lean harder into the Accountability Buddy feature on Firefox. When Nuclear Mode starts, notify the buddy. If the user disables the extension during Nuclear Mode, the next time they re-enable it, the buddy is notified that Nuclear Mode was bypassed.

4. **Streak penalty:** If Nuclear Mode is bypassed (detected by checking if nuclear state `ends_at` is in the future but `active` is false on next startup), apply a streak penalty (e.g., streak reset). This creates a self-imposed consequence.

### 2.6 Storage Sync on Firefox

`browser.storage.sync` works on Firefox but with differences:

| Aspect | Chrome | Firefox |
|---|---|---|
| Sync backend | Google account-based | Firefox Account-based |
| Requires sign-in | Yes (Chrome profile) | Yes (Firefox Account) |
| Max total size | 102,400 bytes | 102,400 bytes |
| Max items | 512 | 512 |
| Max per-item size | 8,192 bytes | 8,192 bytes |
| Max write operations/hour | 1,800 | 1,800 |
| Sync frequency | Near-real-time | Every ~10 minutes (less aggressive) |
| Offline behavior | Queued, synced on reconnect | Same |
| `gecko.id` required | N/A | **Yes** -- sync keys are namespaced by extension ID |

**Impact on Focus Mode - Blocker:**

- Free-tier users use `storage.local` exclusively -- no impact.
- Pro-tier users using cross-device sync: Firefox sync is slower (every ~10 minutes vs near-real-time on Chrome). The sync-manager.js should note this in the UI: "Settings sync may take up to 10 minutes on Firefox."
- The `sync_manager.js` module's server-side sync (for large datasets like session history) works identically -- it uses `fetch()` to the Zovo API, not `storage.sync`.

**Data migration (Chrome to Firefox):**

If a user switches from Chrome to Firefox and wants to preserve their data, Focus Mode - Blocker should offer an export/import mechanism:
1. Chrome: Export settings + blocklist + stats as a JSON file from the Options page
2. Firefox: Import the JSON file on the Options page
3. The `migration-manager.js` module's schema version system handles any structural differences between builds.

### 2.7 Notifications on Firefox

| Feature | Chrome | Firefox | Impact |
|---|---|---|---|
| Basic notification | `chrome.notifications.create()` | `browser.notifications.create()` | No change |
| Notification icon | Supported | Supported | No change |
| Action buttons (`buttons` array) | Up to 2 buttons | **Ignored** -- buttons do not render | **Impact:** Remove "Start Pro Trial" button from milestone notifications. Replace with a click handler that opens the upgrade page. |
| `requireInteraction` | Supported | Supported | No change |
| `onClicked` | Fires on click | Fires on click | No change |
| `onButtonClicked` | Fires on button click | **Never fires** | **Impact:** All button-click logic must have a fallback |
| Notification sound | System default | System default | No change |
| Maximum display time | OS-dependent | OS-dependent | No change |
| Rich notifications (progress, images) | Supported | **Basic type only** | **Impact:** Focus Score progress bar in notifications must be removed for Firefox |

**Required changes to `notification-manager.js`:**

```javascript
// Detect browser and adjust notification options
function createNotification(id, options) {
  const isFirefox = typeof browser !== 'undefined' && browser.runtime?.getBrowserInfo;

  if (isFirefox) {
    // Remove unsupported fields
    delete options.buttons;
    delete options.progress;
    if (options.type === 'progress') {
      options.type = 'basic';
    }
  }

  return (isFirefox ? browser : chrome).notifications.create(id, options);
}
```

### 2.8 Context Menus on Firefox

Focus Mode - Blocker uses `chrome.contextMenus` to add right-click options like "Block this site" and "Start Quick Focus."

| Feature | Chrome | Firefox | Impact |
|---|---|---|---|
| `contextMenus.create()` | Supported | Supported | No change |
| `contextMenus.onClicked` | Supported | Supported | No change |
| Context types (`page`, `link`, `selection`) | All supported | All supported | No change |
| `documentUrlPatterns` | Supported | Supported | No change |
| Icon in context menu | Supported (Chrome 99+) | Supported | No change |
| `parentId` for nested menus | Supported | Supported | No change |

**No changes needed.** The context menus API is one of the most consistent APIs across Chrome and Firefox.

### 2.9 Privacy Considerations for Firefox Users

Firefox users are disproportionately privacy-conscious. Focus Mode - Blocker's privacy-first architecture is a natural fit, but AMO reviewers and Firefox users will scrutinize claims more carefully.

**Focus Mode - Blocker's data practices (already privacy-aligned):**

| Data Category | Where Stored | Transmitted? | Firefox User Expectation |
|---|---|---|---|
| Blocked site list | `storage.local` | No (free) / Encrypted sync to Zovo API (Pro) | Meets expectation |
| Focus session history | `storage.local` | No (free) / Encrypted sync (Pro) | Meets expectation |
| Focus Score and streaks | `storage.local` | No | Meets expectation |
| Usage statistics | `storage.local` | No | **Exceeds** expectation -- most blockers send analytics |
| Browsing activity | Never collected | Never | Meets expectation |
| Pro license verification | License key sent to Zovo API | Yes (Pro only, encrypted) | Acceptable -- users understand license checks |
| AI recommendations (Pro) | Anonymized stats sent to API | Yes (Pro only, anonymized) | **Needs clear disclosure** -- Firefox users will want to know what "anonymized" means |

**Required additions for Firefox:**
1. Clear privacy disclosure on the AMO listing (see Section 4)
2. Options page privacy section explaining exactly what data is stored and what leaves the device
3. AI recommendations disclosure: "Focus Mode - Blocker Pro sends aggregate session counts and average focus duration (no URLs, no site names, no browsing history) to generate AI-powered focus recommendations. This data cannot be linked to your identity."
4. `<all_urls>` justification: Firefox users will question this. The AMO listing and onboarding should explain: "This permission lets Focus Mode - Blocker block any website you add to your list. We never read page content or track your browsing."

---

## 3. web-ext Integration

### 3.1 web-ext Configuration

Create a `web-ext-config.js` in the project root for Firefox development.

```javascript
// web-ext-config.js
module.exports = {
  sourceDir: './dist/firefox',
  artifactsDir: './artifacts/firefox',
  ignoreFiles: [
    '*.map',
    'tests/**',
    'scripts/**',
    '*.md',
    '.git/**',
    '.gitignore',
    'node_modules/**',
  ],
  build: {
    overwriteDest: true,
  },
  run: {
    // Firefox binary to use for testing
    // firefox: '/Applications/Firefox.app/Contents/MacOS/firefox', // macOS
    // firefox: 'firefoxdeveloperedition', // Firefox Developer Edition
    startUrl: ['about:debugging#/runtime/this-firefox'],
    browserConsole: true,
    // Persist profile data between runs for testing storage
    keepProfileChanges: false,
    // Use a custom profile to test with existing Firefox Account
    // firefoxProfile: '/path/to/test-profile',
  },
  lint: {
    // Treat warnings as errors for CI
    warningsAsErrors: false,
    // Output format for CI integration
    output: 'text',
  },
};
```

### 3.2 Development Workflow

**Install web-ext:**

```bash
npm install --save-dev web-ext
```

**npm scripts (add to `package.json`):**

```json
{
  "scripts": {
    "firefox:build": "node scripts/generate-manifest.js firefox && cp -r src/ dist/firefox/src/ && web-ext build",
    "firefox:run": "node scripts/generate-manifest.js firefox && cp -r src/ dist/firefox/src/ && web-ext run",
    "firefox:lint": "node scripts/generate-manifest.js firefox && cp -r src/ dist/firefox/src/ && web-ext lint",
    "firefox:sign": "web-ext sign --api-key=$AMO_JWT_ISSUER --api-secret=$AMO_JWT_SECRET"
  }
}
```

**Testing workflow:**

1. **Start development session:**
   ```bash
   npm run firefox:run
   ```
   This opens Firefox with Focus Mode - Blocker loaded as a temporary extension. The extension auto-reloads when source files change (web-ext watches for file changes by default).

2. **Manual testing checklist for Focus Mode - Blocker on Firefox:**
   - [ ] Popup opens and renders correctly (380px width, all 6 states)
   - [ ] Block page displays when navigating to a blocked site (Shadow DOM renders, quotes rotate, timer displays)
   - [ ] declarativeNetRequest rules apply when sites are added/removed from blocklist
   - [ ] Pomodoro timer starts, ticks, pauses, resumes, and completes with correct alarm behavior
   - [ ] Notifications fire for session start/end and streak milestones (verify no button rendering)
   - [ ] Nuclear Mode activates and badge countdown works
   - [ ] Storage persists across browser restarts
   - [ ] Options page renders all 8 sections correctly
   - [ ] Onboarding flow completes with all 5 slides
   - [ ] Context menu "Block this site" works
   - [ ] Ambient sounds play (using Firefox-specific Audio approach)
   - [ ] Badge text updates (timer countdown, Focus Score)
   - [ ] Dark mode / system theme detection works
   - [ ] i18n strings render from `_locales/en/messages.json`

3. **Debugging:**
   - Open `about:debugging#/runtime/this-firefox` to inspect the background script
   - Click "Inspect" on the extension to open DevTools for the background context
   - Use the Browser Console (`Ctrl+Shift+J` / `Cmd+Shift+J`) for extension errors
   - Content script debugging: open DevTools on any page and switch to the extension's content script context in the debugger Sources panel

4. **Testing declarativeNetRequest rules specifically:**
   - Navigate to `about:debugging` -> Inspect the extension
   - In the console, run: `browser.declarativeNetRequest.getDynamicRules().then(r => console.log(r))`
   - Verify rules match the expected blocklist entries
   - Test with a site on the blocklist: navigate to it and confirm the redirect/block page fires

### 3.3 Build Validation with web-ext lint

`web-ext lint` runs Mozilla's addons-linter on the extension, catching issues before AMO submission.

```bash
npx web-ext lint --source-dir=./dist/firefox
```

**Common Focus Mode - Blocker lint issues and fixes:**

| Lint Warning/Error | Cause | Fix |
|---|---|---|
| `MANIFEST_FIELD_UNSUPPORTED` for `offline_enabled` | Chrome-only field | Removed in Firefox manifest (handled by `generate-manifest.js`) |
| `MANIFEST_FIELD_UNSUPPORTED` for `key` | Chrome-only field | Removed in Firefox manifest |
| `MANIFEST_FIELD_UNSUPPORTED` for `minimum_chrome_version` | Chrome-only field | Replaced with `gecko.strict_min_version` |
| `UNSAFE_VAR_ASSIGNMENT` | Using `innerHTML` in content scripts | Use `textContent` or DOM APIs. Block page builder should use `createElement`/`appendChild` instead of HTML string injection. |
| `NO_DOCUMENT_WRITE` | Using `document.write()` | Replace with DOM manipulation |
| `CONTENT_SCRIPT_NOT_FOUND` | Lint cannot find referenced files | Ensure all content scripts are in `dist/firefox/` before linting |
| `DANGEROUS_EVAL` | Using `eval()` or `new Function()` | Not used in Focus Mode - Blocker (CSP blocks it anyway) |

**CI integration (GitHub Actions):**

```yaml
# .github/workflows/firefox-lint.yml
name: Firefox Extension Lint
on: [push, pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run firefox:build
      - run: npx web-ext lint --source-dir=./dist/firefox --warnings-as-errors
```

---

## 4. AMO (addons.mozilla.org) Submission

### 4.1 Submission Checklist for Focus Mode - Blocker

| Step | Status | Details |
|---|---|---|
| Firefox-compatible `manifest.json` | Required | Generated by `scripts/generate-manifest.js firefox` |
| `.xpi` package built with `web-ext build` | Required | Output in `artifacts/firefox/` |
| `web-ext lint` passes without errors | Required | Warnings acceptable, errors block submission |
| `gecko.id` set to `focusmode-blocker@zovo.one` | Required | Must be consistent across all updates |
| All `chrome.*` references replaced with `browser.*` or polyfilled | Required | Use a `const api = typeof browser !== 'undefined' ? browser : chrome;` pattern |
| Offscreen API usage removed or replaced | Required | Firefox does not support `offscreen` |
| `tabGroups` API usage guarded or removed | Required | Firefox does not support `tabGroups` |
| `chrome.identity.getAuthToken` replaced with `browser.identity.launchWebAuthFlow` | Required for Pro | Different OAuth flow on Firefox |
| Notification buttons removed from Firefox build | Required | Firefox ignores `buttons` field but AMO reviewers flag the intent |
| Icons in all sizes (16, 32, 48, 128) | Required | Same as Chrome |
| Screenshots (1280x800 recommended, minimum 3) | Required | Must show the extension running in Firefox |
| Privacy policy URL | Required | Must describe all data collection including AI recommendations |
| Support email or URL | Required | `support@zovo.one` |
| AMO listing description (see below) | Required | Max 250 characters for summary, longer for full description |
| Source code submission | Required | Since Focus Mode - Blocker bundles/concatenates JS modules |

### 4.2 Required Assets and Listing Information

**Extension metadata:**

| Field | Value |
|---|---|
| Name | Focus Mode - Blocker |
| Slug | focus-mode-blocker |
| Summary (250 chars max) | Block distracting websites and build focus habits with a free Pomodoro timer, Focus Score gamification, streak tracking, and an unbypassable Nuclear Mode. |
| Category | Productivity |
| Support email | support@zovo.one |
| Support URL | https://zovo.one/focus-mode/support |
| Homepage | https://zovo.one/focus-mode |
| License | Proprietary |
| Tags | website blocker, focus timer, pomodoro, productivity, distraction blocker, nuclear mode, site blocker |

**Screenshots (minimum 3, recommended 5):**

1. Popup -- Focus Dashboard state showing active timer, Focus Score ring, and streak counter
2. Block Page -- Motivational quote with streak display and "Return to Focus" button on a blocked site
3. Options Page -- Blocklist management showing the 10-site free tier with pre-built list toggles
4. Nuclear Mode -- Confirmation dialog and active countdown badge
5. Weekly Stats -- Daily focus time chart (use the blurred Pro preview for marketing)

**Promotional text (for AMO Featured section):**

> Focus Mode - Blocker helps you take back control of your browsing. Add up to 10 sites to your blocklist for free, start a Pomodoro timer with one click, and track your focus streak. When you need maximum discipline, Nuclear Mode makes blocking truly unbypassable. All your data stays on your device -- no accounts, no tracking, no ads.

### 4.3 Privacy Policy Requirements

AMO requires a privacy policy URL for any extension requesting `<all_urls>` or broad host permissions. Focus Mode - Blocker must host a privacy policy at a stable URL (e.g., `https://zovo.one/focus-mode/privacy`).

**Mandatory disclosures for AMO:**

1. **Data collected:** Blocklist entries (user-provided), focus session timestamps and durations, Focus Score, streak data, distraction attempt counts (aggregate, no URLs stored for free tier).
2. **Data stored:** All data stored locally in `browser.storage.local`. Pro users optionally sync settings via `browser.storage.sync` (Firefox Account) and session history via encrypted Zovo API.
3. **Data transmitted:** Free tier -- no data leaves the device. Pro tier -- license key verification (encrypted), settings sync (Firefox Account), session history sync (encrypted to Zovo API), anonymized aggregate stats for AI recommendations (no URLs, no site names).
4. **Third parties:** Pro tier only -- Zovo server for license verification and sync. No third-party analytics, no advertising networks, no data brokers.
5. **Data retention:** Local data persists until the user clears it or uninstalls. Server-synced data (Pro) is deleted within 30 days of account closure.
6. **`<all_urls>` justification:** Required to inject a lightweight content script (under 2KB) that checks URLs against the user's local blocklist. No page content is read, collected, or transmitted.

### 4.4 Source Code Submission

AMO requires source code submission when the extension:
- Uses a build step (minification, bundling, transpilation)
- Contains obfuscated code
- Uses any preprocessing

Focus Mode - Blocker uses ES modules (`type: "module"` in background scripts) which may be bundled for distribution. If the build process involves any bundling:

1. Submit the full source repository (minus `node_modules`) as a zip
2. Include a `BUILD.md` file explaining:
   - Node.js version required
   - `npm install` to install dependencies
   - `npm run firefox:build` to produce the distributable
   - Mapping from source files to output files
3. Include `package.json` and `package-lock.json` for reproducible builds
4. Do not submit minified code -- AMO reviewers reject it. If minification is desired for production, provide both minified and source.

**If Focus Mode - Blocker ships unminified vanilla JS (no build step):** Source code submission is still recommended but not strictly required. The Firefox manifest generation script is a trivial preprocessing step that reviewers can verify easily.

### 4.5 Review Process for a Site-Blocking Extension

Site-blocking extensions receive **elevated scrutiny** on AMO because:

1. **`<all_urls>` host permission** triggers manual review (not auto-approved)
2. **Content scripts on all pages** are examined for data exfiltration
3. **`declarativeNetRequest` rules** are checked to ensure they only block (not redirect to malicious sites)
4. **Any outbound network requests** from the extension are audited

**Expected review timeline:** 1-5 business days for initial review. Extensions with `<all_urls>` typically take 3-5 days.

**Tips to speed up AMO review:**

1. Include clear inline code comments explaining why `<all_urls>` is necessary
2. Add a `REVIEW_NOTES.md` in the source submission explaining the architecture:
   - "detector.js (2KB) checks URLs against a local blocklist. No page content is read."
   - "blocking-rules.json contains user-configured block rules only."
   - "All storage is local. No telemetry, no analytics, no tracking."
3. Make the `fetch()` calls in `license-manager.js` clearly documented with the API endpoint and purpose
4. Ensure no `eval()`, `innerHTML` with user content, or dynamic script injection from external sources
5. Respond promptly to reviewer questions -- delayed responses restart the queue

**Potential rejection reasons and mitigations:**

| Rejection Reason | Mitigation |
|---|---|
| "Extension requests broad permissions without justification" | Detailed inline comments + REVIEW_NOTES.md explaining `<all_urls>` need |
| "Content scripts access page DOM unnecessarily" | detector.js does NOT read DOM -- it sends the URL to the background for matching. Document this. |
| "Outbound network requests to unknown server" | Document the Zovo API endpoint, its purpose (license verification), and that it only applies to Pro users |
| "Obfuscated or minified code" | Ship unminified, well-commented code for Firefox |
| "Extension blocks access to browser settings" | On Firefox, Nuclear Mode does NOT block `about:addons`. No browser-setting blocking occurs. |

### 4.6 AMO Listing Description

**Full description (Markdown-formatted for AMO):**

```
Focus Mode - Blocker helps you take back control of your time online.

**Free Forever (No Ads, No Account Required)**
- Block up to 10 distracting websites instantly
- One-click Pomodoro timer (25/5 focus/break cycles)
- Daily Focus Score to track your discipline
- Focus streak tracking with milestones
- Motivational block page with rotating quotes
- 3 ambient sounds (rain, white noise, lo-fi)
- Schedule-based blocking (1 schedule)
- Full statistics for the last 7 days

**Nuclear Mode**
When you need maximum focus, Nuclear Mode locks your blocklist for up to 1 hour (24 hours with Pro). No bypassing, no exceptions, no excuses.

**Pro ($4.99/month) -- For Power Users**
- Unlimited blocked sites
- Wildcard and pattern blocking
- Whitelist mode (block everything except your work tools)
- Custom Pomodoro durations and long breaks
- Full Focus Score breakdown
- Unlimited schedules
- 24-hour Nuclear Mode
- Export reports and share Focus Cards
- 15+ ambient sounds with mixing
- 365-day statistics history
- Cross-device sync

**Privacy First**
All your data stays on your device. No browsing data is collected, stored, or transmitted. No ads, no tracking, no analytics. We believe productivity tools should respect your privacy.

**How It Works**
1. Add distracting sites to your blocklist
2. Start a focus session
3. If you try to visit a blocked site, you will see a motivational block page instead
4. Track your progress with Focus Score and streaks

Built by Zovo (zovo.one).
```

---

## 5. Firefox-Specific Features to Leverage

### 5.1 Container Tabs Integration

Firefox Multi-Account Containers allow users to isolate browsing activity into separate colored "containers" (Personal, Work, Banking, Shopping, etc.). This is a unique Firefox feature that Focus Mode - Blocker can leverage for context-aware blocking.

**Concept: Container-Aware Blocking Profiles**

Instead of a single global blocklist, Focus Mode - Blocker could activate different blocking rules per container:
- "Work" container: Block social media + news + entertainment
- "Personal" container: No blocking (evening browsing)
- "Study" container: Block everything except educational sites (whitelist mode)

**Implementation approach:**

1. Request the `contextualIdentities` permission (optional, Firefox-only)
2. Use `browser.contextualIdentities.query({})` to list available containers
3. In the Options page, add a "Container Profiles" section (Firefox-only, hidden on Chrome)
4. Store container-to-profile mappings in storage:
   ```json
   {
     "container_profiles": {
       "firefox-container-1": { "blocklist_ids": ["social_media", "news"] },
       "firefox-container-2": { "blocklist_ids": [] },
       "firefox-container-3": { "blocklist_ids": ["all"], "whitelist_mode": true }
     }
   }
   ```
5. In the `blocking-engine.js`, use `browser.tabs.query()` to determine the active tab's `cookieStoreId` (container ID), then apply the corresponding blocking rules

**declarativeNetRequest limitation:** DNR rules cannot be scoped to specific containers. The blocking engine would need to use a hybrid approach:
- DNR for universal rules (sites blocked in all containers)
- Content script-based blocking for container-specific rules (detector.js checks the tab's container via messaging to the background)

**Recommendation:** This is a **Pro-only, Firefox-exclusive** feature. It is compelling but adds significant complexity. Implement it in a later release (v1.1 or v1.2) after validating Firefox user interest. It would be a strong differentiator against competitors who have no container awareness at all.

### 5.2 Firefox Sidebar Panel

Firefox supports a Sidebar API (`browser.sidebarAction`) that can open a panel docked to the side of the browser window. This is unique to Firefox (Chrome has no equivalent as of early 2026).

**Concept: Focus Dashboard Sidebar**

Instead of the small popup (380px wide, max 580px tall), Firefox users could open a persistent sidebar showing:
- Active timer with large countdown display
- Current Focus Score and streak
- Today's statistics in real-time
- Quick blocklist management
- Ambient sound controls

**Implementation:**

Add to Firefox manifest:
```json
{
  "sidebar_action": {
    "default_title": "Focus Mode Dashboard",
    "default_panel": "src/sidebar/sidebar.html",
    "default_icon": {
      "16": "src/assets/icons/icon-16.png",
      "32": "src/assets/icons/icon-32.png"
    },
    "open_at_install": false
  }
}
```

Create `src/sidebar/sidebar.html` -- this can share most components with the popup but optimized for a taller, narrower layout (sidebar is typically 300-400px wide but fills the full browser height).

**Benefits for Focus Mode - Blocker:**
- The timer is always visible -- no need to open the popup to check remaining time
- Focus Score updates in real-time as the user works
- Ambient sound controls are persistent
- Block page data (quotes, streak) can be previewed without navigating to a blocked site

**Recommendation:** Implement as a **Firefox-exclusive free feature** in v1.0 or v1.1. The sidebar reuses existing popup components (just different CSS layout), so development effort is moderate. It provides a genuine reason for Chrome users to consider Firefox for Focus Mode.

### 5.3 Firefox Tracking Protection Interaction

Firefox includes built-in Enhanced Tracking Protection (ETP) that blocks trackers, cryptominers, and fingerprinters. This can interact with Focus Mode - Blocker in two ways:

**Potential conflict: ETP blocking Focus Mode - Blocker's outbound requests**

If Firefox's ETP is set to "Strict" mode, it may block requests from the extension to the Zovo API (license verification, Pro sync) if the API domain is on a tracking protection list. This is unlikely but worth testing.

**Mitigation:** The Zovo API domain (`api.zovo.one` or similar) should not appear on any tracking protection lists. If issues arise, the `license-manager.js` should handle `fetch()` failures gracefully:
```javascript
try {
  const response = await fetch(API_URL, { credentials: 'omit' });
  // ...
} catch (error) {
  if (error.name === 'TypeError') {
    // Possible ETP or network issue -- enter offline grace period
    this.enterGracePeriod();
  }
}
```

**Positive interaction: Marketing angle**

Firefox users who care about ETP also care about privacy. Focus Mode - Blocker's privacy-first architecture (no tracking, no analytics, local-only data) can be positioned as complementary to ETP:

> "Focus Mode - Blocker is built with the same privacy values as Firefox. No trackers, no analytics, no data collection. Enhanced Tracking Protection blocks trackers from following you. Focus Mode - Blocker blocks distractions from derailing your work."

This messaging should appear on the AMO listing and in any Firefox-specific marketing material.

**DNS-over-HTTPS (DoH) interaction:**

Firefox enables DoH by default in some regions. `declarativeNetRequest` works at the browser request level (after DNS resolution), so DoH does not interfere with Focus Mode - Blocker's blocking rules. No action needed.

---

## Appendix A: Browser API Namespace Compatibility Layer

Focus Mode - Blocker should use a thin compatibility layer to handle the `chrome` vs `browser` namespace difference. Firefox provides a `chrome` compatibility layer but native `browser` APIs return Promises (cleaner). Chrome does not provide a `browser` namespace.

**Recommended approach for Focus Mode - Blocker:**

Create `src/shared/browser-api.js`:

```javascript
/**
 * Cross-browser API namespace.
 * Firefox: uses native browser.* (Promise-based)
 * Chrome: uses chrome.* (callback-based, but Promises supported since MV3)
 *
 * Usage: import { api } from './browser-api.js';
 *        const tabs = await api.tabs.query({ active: true });
 */
export const api = typeof globalThis.browser !== 'undefined'
  ? globalThis.browser
  : globalThis.chrome;

/**
 * Detect the current browser for feature-gating.
 */
export const isFirefox = typeof globalThis.browser !== 'undefined'
  && typeof globalThis.browser.runtime?.getBrowserInfo === 'function';

export const isChrome = !isFirefox && typeof globalThis.chrome !== 'undefined';

export const isSafari = !isFirefox && !isChrome
  && typeof globalThis.safari !== 'undefined';
```

All modules (`blocking-engine.js`, `timer-engine.js`, `storage-manager.js`, etc.) should import `api` from this module instead of referencing `chrome.*` or `browser.*` directly.

---

## Appendix B: Firefox Porting Effort Estimate

| Task | Effort | Priority | Blocking? |
|---|---|---|---|
| Manifest generation script | 2 hours | P0 | Yes |
| `browser.*` API namespace migration | 4 hours | P0 | Yes |
| Remove/replace `offscreen` API for ambient sounds | 6 hours | P0 | Yes |
| Replace `chrome.identity.getAuthToken` with `launchWebAuthFlow` | 4 hours | P1 | No (Pro only) |
| Remove `tabGroups` references | 1 hour | P0 | Yes |
| Adjust notification options (remove buttons/progress) | 2 hours | P1 | No |
| Nuclear Mode Firefox limitations and messaging | 3 hours | P1 | No |
| Shadow DOM CSS fixes (`-webkit-` prefixes) | 2 hours | P1 | No |
| web-ext configuration and CI setup | 2 hours | P0 | Yes |
| web-ext lint fixes (innerHTML, etc.) | 3 hours | P1 | No |
| Manual testing across Firefox versions (128, ESR, Nightly) | 8 hours | P0 | Yes |
| AMO listing assets (screenshots, description, privacy policy) | 4 hours | P0 | Yes |
| Source code submission preparation | 2 hours | P0 | Yes |
| Container tabs integration (optional, Firefox-only Pro feature) | 16 hours | P2 | No |
| Sidebar panel (optional, Firefox-only feature) | 12 hours | P2 | No |
| **Total (required for launch)** | **~43 hours** | | |
| **Total (including optional Firefox features)** | **~71 hours** | | |

The critical path for Firefox launch is approximately 5-6 developer-days of focused work, assuming the Chrome extension is complete and tested. The optional Firefox-exclusive features (containers, sidebar) add 3-4 days but can ship in a follow-up release.
