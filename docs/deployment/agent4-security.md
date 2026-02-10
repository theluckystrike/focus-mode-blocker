# Security and Privacy Hardening Specification

## Focus Mode - Blocker (MV3 Chrome Extension)

**Document Version:** 1.0
**Classification:** Internal - Security Sensitive
**Author:** Security Specialist (Agent 4)
**Date:** 2026-02-10

---

## Table of Contents

1. [Permission Audit](#1-permission-audit)
2. [Content Security Policy](#2-content-security-policy)
3. [Input Sanitization](#3-input-sanitization)
4. [Storage Security](#4-storage-security)
5. [Message Passing Security](#5-message-passing-security)
6. [Privacy Verification](#6-privacy-verification)
7. [Attack Surface Analysis](#7-attack-surface-analysis)
8. [Nuclear Option Security](#8-nuclear-option-security)
9. [Security Test Cases](#9-security-test-cases)
10. [Compliance Documentation](#10-compliance-documentation)
11. [Security Implementation Checklist](#11-security-implementation-checklist)

---

## 1. Permission Audit

### 1.1 Required Permissions

| Permission | Justification | Risk Level | Removable? |
|---|---|---|---|
| `storage` | Persist blocklist, settings, timer state, session history. Core to all functionality. | Low | No |
| `alarms` | Schedule focus session start/end, break reminders, daily reset. Required for background timing when service worker is inactive. | Low | No |
| `declarativeNetRequest` | Block navigation to sites on the blocklist using MV3 declarative rules. This is the primary blocking mechanism and the MV3-approved replacement for webRequest blocking. | Medium | No |
| `declarativeNetRequestWithHostAccess` | Allow dynamic rule creation for user-defined blocklist URLs. Needed because the blocklist is user-configurable at runtime, so static rulesets are insufficient. | Medium | No |
| `activeTab` | Inject content scripts on-demand (block page overlay, site detector). Limits scripting to the currently active tab rather than blanket host access. | Medium | No |
| `scripting` | Programmatically inject content scripts for the block page, page time tracker, and site detection. Required by MV3 for dynamic injection. | Medium | No |
| `notifications` | Alert user when focus session starts, ends, or a break is due. Non-essential but core to UX promise. | Low | No |
| `offscreen` | Create offscreen document for audio playback (timer sounds, ambient noise). MV3 service workers cannot play audio directly. | Low | No |
| `<all_urls>` | Host permission required for `declarativeNetRequestWithHostAccess` to apply blocking rules to any user-specified domain. Also enables content script injection on blocked pages. | **High** | No (see 1.3) |

### 1.2 Optional Permissions

| Permission | Justification | Risk Level | When Requested |
|---|---|---|---|
| `identity` | OAuth flow for Pro account sign-in (Google Sign-In). Only requested when user initiates Pro upgrade or login. | Medium | Pro sign-in |
| `idle` | Detect when user is idle to auto-pause/resume focus sessions and improve time tracking accuracy. | Low | Settings toggle |
| `tabGroups` | Organize blocked/allowed tabs into groups during focus sessions for visual clarity. | Low | Settings toggle |

### 1.3 Over-Permission Analysis

**`<all_urls>` is the highest-risk permission.** It grants the extension access to every website the user visits. This is currently required because:

- `declarativeNetRequestWithHostAccess` needs host permissions for any domain the user might block.
- Content scripts must inject the block page on arbitrary domains.
- The page time tracker must run on all pages to measure engagement.

**Recommendations for Reduction:**

1. **Replace `<all_urls>` with `declarativeNetRequest` static rules where possible.** For common blocklist entries (social media, news, entertainment), ship a static ruleset. Only require host access for custom user-added domains.

2. **Use `activeTab` + user gesture for content script injection** rather than blanket host permissions. When a user clicks the extension icon or interacts with a notification, `activeTab` grants temporary access to the current tab without needing `<all_urls>`.

3. **Request host permissions dynamically** via `chrome.permissions.request()` for user-added blocklist domains. Instead of requesting `<all_urls>` upfront, request `*://*.example.com/*` only when the user adds `example.com` to their blocklist. This significantly reduces the install-time permission warning.

4. **Isolate page tracking to an opt-in feature.** If the user does not enable page time tracking, no host permission beyond the blocklist is needed.

**Recommendation priority:** Item 3 is the single highest-impact security improvement. Moving from `<all_urls>` to per-domain dynamic permissions transforms the permission profile from "can read all your browsing data" to "can only interact with sites you explicitly block."

### 1.4 Permission Request Timing

```
Install time:  storage, alarms, declarativeNetRequest, notifications, offscreen
First block:   declarativeNetRequestWithHostAccess + specific host
User action:   activeTab (granted automatically on click)
Pro sign-in:   identity (optional, requested on demand)
Settings opt:  idle, tabGroups (optional, requested on demand)
Inject needed:  scripting + specific host (requested per domain)
```

---

## 2. Content Security Policy

### 2.1 Extension Pages CSP

This CSP applies to the popup, options page, and any extension HTML pages.

```json
{
  "content_security_policy": {
    "extension_pages": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests"
  }
}
```

**Breakdown:**

| Directive | Value | Rationale |
|---|---|---|
| `default-src` | `'self'` | Only load resources from the extension itself. |
| `script-src` | `'self'` | No inline scripts, no eval, no remote scripts. All JS must be bundled. MV3 already enforces this, but explicit declaration is defense-in-depth. |
| `style-src` | `'self' 'unsafe-inline'` | Extension CSS plus inline styles for dynamic UI (timer progress bars, theme colors). If possible, migrate to CSS custom properties and remove `'unsafe-inline'`. |
| `img-src` | `'self' data:` | Extension icons and data URIs for dynamically generated images (e.g., charts). |
| `font-src` | `'self'` | Only bundled fonts. No Google Fonts or CDN fonts. |
| `connect-src` | `'self'` | Free tier: no external connections. Pro tier: see 2.3. |
| `object-src` | `'none'` | Block all plugins, Flash, Java applets. |
| `base-uri` | `'self'` | Prevent base tag injection attacks. |
| `form-action` | `'none'` | Extension pages should never submit forms to external URLs. |
| `frame-ancestors` | `'none'` | Prevent clickjacking of extension pages. |

### 2.2 Sandbox CSP

For any sandboxed pages (e.g., settings import preview, template rendering):

```json
{
  "content_security_policy": {
    "sandbox": "sandbox allow-scripts; default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:"
  }
}
```

Sandboxed pages have no access to Chrome extension APIs and cannot make network requests. They communicate with the extension only through `postMessage`.

### 2.3 Pro Tier CSP Modification

When the user activates Pro features, `connect-src` must be expanded to reach external APIs. This is done by serving Pro API calls from the service worker (which is not subject to extension_pages CSP) rather than from the popup or options page. This means the CSP for extension pages does **not** need to change for Pro.

**Service worker network access (Pro):**

| Endpoint | Purpose | Domain |
|---|---|---|
| Stripe | Payment processing | `https://api.stripe.com` |
| Sync server | Settings/data sync | `https://sync.focusmodeapp.example.com` |
| AI server | Smart scheduling suggestions | `https://ai.focusmodeapp.example.com` |
| Analytics proxy | Anonymized usage analytics | `https://analytics.focusmodeapp.example.com` |

All Pro network calls must:
- Use HTTPS exclusively (enforced by `upgrade-insecure-requests` and code-level URL validation).
- Pin to the exact domains above (no wildcard connect-src).
- Be made from the service worker, never from content scripts.
- Validate TLS certificates (browser default, but verify no certificate error bypass exists).

### 2.4 What Is Blocked

- **Remote code execution:** No `eval()`, `new Function()`, `setTimeout(string)`, or remote script loading. MV3 enforces this at the platform level.
- **Inline scripts:** No inline `<script>` tags or `on*` event handlers in HTML.
- **External resources:** No CDN-hosted libraries, fonts, or stylesheets.
- **Plugin content:** No Flash, Silverlight, or Java.
- **Data exfiltration via forms:** `form-action: 'none'` prevents HTML form submissions.
- **Framing attacks:** `frame-ancestors: 'none'` blocks embedding extension pages in iframes.

---

## 3. Input Sanitization

### 3.1 Blocklist URL Input

**Input source:** User typing or pasting URLs/domains into the blocklist field.

**Validation rules:**

```javascript
const BLOCKLIST_VALIDATION = {
  maxLength: 253,            // Max domain name length per RFC 1035
  maxEntries: 10000,         // Hard cap on blocklist size
  allowedPattern: /^[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]$/,
  bannedDomains: [
    'chrome.google.com',     // Prevent blocking extension management
    'chromewebstore.google.com',
    'chrome://*',            // Chrome internal pages
    'chrome-extension://*',  // Other extensions
    'about:*',
    'file://*',
  ],
  bannedTLDs: [],            // No TLD restrictions; users may block anything
};
```

**Sanitization steps:**

1. **Trim whitespace** from both ends.
2. **Lowercase** the entire input.
3. **Strip protocol** (`http://`, `https://`, `ftp://`). Store only the domain.
4. **Strip path, query, fragment** unless the user explicitly added a path-level block. For path-level blocks, validate the path component separately.
5. **Strip `www.` prefix** optionally (with user confirmation) and store the root domain.
6. **Validate against `allowedPattern`** to reject domains with invalid characters (spaces, special characters, Unicode homoglyphs).
7. **Punycode normalization:** Convert internationalized domain names (IDN) to Punycode representation before storage to prevent homoglyph attacks (e.g., `gооgle.com` with Cyrillic "o" characters).
8. **Reject banned domains** to prevent the user from locking themselves out of Chrome management pages.
9. **Deduplicate** against existing blocklist entries.
10. **Length check** against `maxLength` and `maxEntries`.

**Output:** A sanitized, normalized domain string safe for use in `declarativeNetRequest` rules.

### 3.2 Custom Text Input (Block Page Messages, Session Names)

**Input source:** User-customizable text displayed on the block page or session labels.

**Validation rules:**

```javascript
const TEXT_VALIDATION = {
  maxLength: 500,
  allowedHTML: false,        // No HTML allowed in any text input
  allowedChars: /^[\p{L}\p{N}\p{P}\p{Z}\p{Emoji}]+$/u,  // Unicode letters, numbers, punctuation, spaces, emoji
};
```

**Sanitization steps:**

1. **Trim whitespace.**
2. **Strip all HTML tags** using a strict allowlist (empty allowlist - no tags permitted).
3. **Encode HTML entities** before rendering: `<` to `&lt;`, `>` to `&gt;`, `&` to `&amp;`, `"` to `&quot;`, `'` to `&#x27;`.
4. **Reject or truncate** inputs exceeding `maxLength`.
5. **Use `textContent`** (never `innerHTML`) when inserting user text into the DOM.

### 3.3 Settings Import (JSON)

**Input source:** User imports a JSON file containing blocklist, settings, and session history.

**Validation rules:**

```javascript
const IMPORT_VALIDATION = {
  maxFileSize: 5 * 1024 * 1024,   // 5 MB hard cap
  allowedMimeTypes: ['application/json'],
  requiredSchema: {
    version: 'string',
    blocklist: 'array',
    settings: 'object',
  },
};
```

**Sanitization steps:**

1. **Check file size** before parsing. Reject files over 5 MB.
2. **Validate MIME type** from the file input.
3. **Parse with `JSON.parse()`** inside a try-catch. Never use `eval()` or `Function()` to parse.
4. **Schema validation** using a strict schema definition. Reject any unexpected top-level keys.
5. **Deep validation** of every nested value:
   - Blocklist entries: Apply full URL sanitization (Section 3.1) to each entry.
   - Settings values: Validate against a known schema of setting keys and their expected types/ranges.
   - Session history: Validate timestamps are valid dates, durations are positive numbers within reasonable bounds.
6. **Reject prototype pollution vectors:** Check for `__proto__`, `constructor`, `prototype` keys in the imported JSON at every nesting level.
7. **Sanitize all string values** per Section 3.2.
8. **Merge, do not replace** existing data by default. Prompt user for overwrite confirmation.

### 3.4 Numeric Inputs (Timer Duration, Break Length)

**Validation rules:**

```javascript
const TIMER_VALIDATION = {
  focusMinutes:  { min: 1, max: 480, type: 'integer' },   // 1 min to 8 hours
  breakMinutes:  { min: 1, max: 60, type: 'integer' },
  sessionsCount: { min: 1, max: 20, type: 'integer' },
  dailyGoalHours: { min: 0.5, max: 16, type: 'float', step: 0.5 },
};
```

**Sanitization steps:**

1. **Parse to number** using `Number()` (not `parseInt`, which silently ignores trailing characters).
2. **Reject NaN, Infinity, -Infinity.**
3. **Clamp to min/max range.**
4. **Round to expected precision** (integer or half-hour step).

### 3.5 Password/PIN Input (Nuclear Option Unlock)

**Validation rules:**

```javascript
const PIN_VALIDATION = {
  minLength: 4,
  maxLength: 32,
  complexity: /^(?=.*[A-Za-z])(?=.*\d).{4,32}$/,  // At least one letter and one digit
};
```

**Sanitization steps:**

1. **Never store in plaintext.** Hash with PBKDF2 (100,000 iterations, SHA-256) with a random 16-byte salt before storage.
2. **Rate-limit attempts:** Maximum 5 attempts per 15-minute window. Lock out for 15 minutes after 5 failures.
3. **Clear from memory** after hashing. Do not hold the plaintext PIN in any variable longer than necessary.

---

## 4. Storage Security

### 4.1 Storage Architecture

| Storage Layer | Use Case | Encryption | Scope |
|---|---|---|---|
| `chrome.storage.local` | All free-tier data: blocklist, settings, timer state, session history | At-rest encryption for tokens only | Device-local |
| `chrome.storage.sync` | Pro tier: synced settings, blocklist | Chrome account encryption (Google-managed) | Cross-device |
| `chrome.storage.session` | Transient session data, decrypted tokens, temporary state | Memory-only, cleared on restart | Session |
| In-memory (service worker) | Active timer state, runtime caches | None (volatile) | Runtime |

### 4.2 Data Encryption for Tokens

OAuth tokens (Pro `identity` flow) and API keys must never be stored in plaintext in `chrome.storage.local`.

**Encryption scheme:**

```javascript
// Key derivation from extension-specific entropy
async function deriveStorageKey() {
  const extensionId = chrome.runtime.id;  // Stable, unique per install
  const salt = await getOrCreateSalt();   // Random 16-byte salt, stored in storage.local
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(extensionId),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt before storing
async function encryptToken(token) {
  const key = await deriveStorageKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(token)
  );
  return { iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) };
}

// Decrypt when needed
async function decryptToken(encryptedObj) {
  const key = await deriveStorageKey();
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(encryptedObj.iv) },
    key,
    new Uint8Array(encryptedObj.data)
  );
  return new TextDecoder().decode(decrypted);
}
```

**Limitation acknowledgment:** The extension ID is not a secret (it is visible in the URL bar), so this encryption protects against casual disk inspection but not against a determined attacker with access to the user's Chrome profile. True hardware-backed key storage is not available in the Chrome extension API. This is the best available approach for MV3 extensions.

### 4.3 Secure Storage Patterns

**Pattern 1: Atomic writes with integrity checks**

```javascript
async function secureWrite(key, value) {
  const payload = {
    version: 1,
    timestamp: Date.now(),
    checksum: await computeSHA256(JSON.stringify(value)),
    data: value,
  };
  await chrome.storage.local.set({ [key]: payload });
}

async function secureRead(key) {
  const result = await chrome.storage.local.get(key);
  const payload = result[key];
  if (!payload) return null;

  const expectedChecksum = await computeSHA256(JSON.stringify(payload.data));
  if (expectedChecksum !== payload.checksum) {
    console.error(`Storage integrity check failed for key: ${key}`);
    // Trigger recovery: reload from sync or prompt user
    return null;
  }
  return payload.data;
}
```

**Pattern 2: Scoped storage keys**

All storage keys must be namespaced to prevent collisions and make auditing straightforward.

```javascript
const STORAGE_KEYS = {
  BLOCKLIST:        'fm_blocklist_v1',
  SETTINGS:         'fm_settings_v1',
  TIMER_STATE:      'fm_timer_v1',
  SESSION_HISTORY:  'fm_sessions_v1',
  NUCLEAR_CONFIG:   'fm_nuclear_v1',
  AUTH_TOKEN:       'fm_auth_encrypted_v1',
  NUCLEAR_PIN_HASH: 'fm_nuclear_pin_v1',
  INSTALL_ID:       'fm_install_id_v1',
  STORAGE_SALT:     'fm_salt_v1',
};
```

**Pattern 3: Migration safety**

When the storage schema changes between versions, include a migration function that:
- Reads the old format.
- Validates and transforms to the new format.
- Writes the new format.
- Only deletes the old format after confirming the new write succeeded.

### 4.4 Data Retention and Cleanup

- **Session history:** Retain a maximum of 365 days. Auto-purge older entries on extension startup.
- **Deleted blocklist entries:** Remove immediately; do not soft-delete.
- **Pro tokens:** Clear immediately on sign-out. Zero out the encrypted blob in storage.
- **Nuclear PIN hash:** Retained until user explicitly disables nuclear mode.
- **Uninstall:** Chrome automatically deletes all `chrome.storage.local` data. No additional cleanup required, but consider using `chrome.runtime.setUninstallURL()` to provide a data deletion confirmation page (no data is sent in the URL).

---

## 5. Message Passing Security

### 5.1 Message Types and Channels

| Channel | From | To | Message Types |
|---|---|---|---|
| `chrome.runtime.sendMessage` | Popup | Service Worker | `START_SESSION`, `STOP_SESSION`, `UPDATE_SETTINGS`, `GET_STATE`, `NUCLEAR_ARM`, `NUCLEAR_DISARM` |
| `chrome.runtime.sendMessage` | Content Script | Service Worker | `PAGE_VISIT`, `BLOCK_PAGE_SHOWN`, `SITE_DETECTED`, `GET_BLOCK_STATUS` |
| `chrome.runtime.sendMessage` | Options Page | Service Worker | `IMPORT_SETTINGS`, `EXPORT_SETTINGS`, `UPDATE_SETTINGS`, `GET_SETTINGS` |
| `chrome.tabs.sendMessage` | Service Worker | Content Script | `INJECT_BLOCK_PAGE`, `UPDATE_TIMER`, `REMOVE_BLOCK_PAGE` |
| `chrome.runtime.connect` | Popup | Service Worker | Long-lived connection for real-time timer updates |
| `postMessage` | Offscreen Doc | Service Worker | `AUDIO_PLAY`, `AUDIO_STOP`, `AUDIO_STATE` |

### 5.2 Origin Validation

**Rule: Every message handler must validate the sender before processing.**

```javascript
// In the service worker message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // RULE 1: Only accept messages from our own extension
  if (sender.id !== chrome.runtime.id) {
    console.warn('Rejected message from foreign extension:', sender.id);
    return false;
  }

  // RULE 2: Content script messages must come from a tab
  if (isContentScriptMessage(message.type) && !sender.tab) {
    console.warn('Content script message without tab context:', message.type);
    return false;
  }

  // RULE 3: Popup/options messages must NOT come from a tab
  if (isPopupMessage(message.type) && sender.tab) {
    console.warn('Popup message from unexpected tab context:', message.type);
    return false;
  }

  // RULE 4: For content script messages, verify the tab URL is not a
  // chrome:// or chrome-extension:// page (which should not have our
  // content scripts)
  if (sender.tab && sender.tab.url) {
    const url = new URL(sender.tab.url);
    if (['chrome:', 'chrome-extension:', 'about:'].includes(url.protocol)) {
      console.warn('Message from disallowed URL scheme:', url.protocol);
      return false;
    }
  }

  // Process validated message
  return handleMessage(message, sender, sendResponse);
});
```

### 5.3 Payload Validation

Every message type must have a strict schema. Reject any message that does not conform.

```javascript
const MESSAGE_SCHEMAS = {
  START_SESSION: {
    type: 'string',
    focusMinutes: { type: 'number', min: 1, max: 480 },
    breakMinutes: { type: 'number', min: 1, max: 60 },
    sessionLabel:  { type: 'string', maxLength: 100, optional: true },
  },
  NUCLEAR_ARM: {
    type: 'string',
    pinHash: { type: 'string', length: 64 },  // SHA-256 hex
    duration: { type: 'number', min: 1, max: 1440 },  // minutes
    disableAt: { type: 'number' },  // Unix timestamp
  },
  PAGE_VISIT: {
    type: 'string',
    url: { type: 'string', maxLength: 2048 },
    timestamp: { type: 'number' },
    tabId: { type: 'number' },
  },
  UPDATE_SETTINGS: {
    type: 'string',
    settings: { type: 'object', maxKeys: 50 },
  },
  // ... define for all message types
};

function validateMessage(message) {
  const schema = MESSAGE_SCHEMAS[message.type];
  if (!schema) return false;

  for (const [key, rules] of Object.entries(schema)) {
    if (key === 'type') continue;
    const value = message[key];

    if (value === undefined) {
      if (!rules.optional) return false;
      continue;
    }

    if (typeof value !== rules.type) return false;
    if (rules.min !== undefined && value < rules.min) return false;
    if (rules.max !== undefined && value > rules.max) return false;
    if (rules.maxLength !== undefined && value.length > rules.maxLength) return false;
    if (rules.length !== undefined && value.length !== rules.length) return false;
    if (rules.maxKeys !== undefined && Object.keys(value).length > rules.maxKeys) return false;
  }

  // Reject any unexpected keys (allowlist approach)
  const allowedKeys = Object.keys(schema);
  for (const key of Object.keys(message)) {
    if (!allowedKeys.includes(key)) return false;
  }

  return true;
}
```

### 5.4 Spoofing Prevention

**Threat:** A malicious website injects a content script that sends `chrome.runtime.sendMessage` to our extension, attempting to disarm nuclear mode or modify settings.

**Mitigations:**

1. **Externally connectable restriction:** Do not declare `externally_connectable` in the manifest. Without it, only our own extension can send `runtime.sendMessage` to us. Web pages cannot.

2. **Content script isolation:** MV3 content scripts run in an isolated world. A malicious page cannot access the `chrome.runtime` API of our extension.

3. **Nonce-based request validation for sensitive operations:** For critical actions (nuclear disarm, settings import), the service worker generates a one-time nonce when the popup/options page opens. The page must include this nonce in its request.

```javascript
// Service worker: on popup connect
const nonces = new Map();
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'popup') {
    const nonce = crypto.getRandomValues(new Uint8Array(16));
    const nonceHex = Array.from(nonce).map(b => b.toString(16).padStart(2, '0')).join('');
    nonces.set(port, nonceHex);
    port.postMessage({ type: 'NONCE', nonce: nonceHex });
    port.onDisconnect.addListener(() => nonces.delete(port));
  }
});
```

4. **Rate limiting on message handlers:** Throttle message processing to prevent DoS from rapid-fire messages.

---

## 6. Privacy Verification

### 6.1 Data Flow Audit

| Data Category | Collected? | Stored Where | Sent Externally? | Retention | User Control |
|---|---|---|---|---|---|
| Blocklist URLs | Yes | `storage.local` | No (free) / Sync server (Pro) | Until user removes | Full CRUD |
| Focus session timestamps | Yes | `storage.local` | No (free) / Sync server (Pro) | 365 days auto-purge | View, delete |
| Focus session durations | Yes | `storage.local` | No (free) / Sync server (Pro) | 365 days auto-purge | View, delete |
| Pages visited (during focus) | Yes | `storage.local` (domain only, not full URL) | No | 30 days auto-purge | Disable, delete |
| Time spent per domain | Yes | `storage.local` | No (free) / Sync server (Pro) | 30 days auto-purge | Disable, delete |
| Custom block page text | Yes | `storage.local` | No (free) / Sync server (Pro) | Until user changes | Full edit |
| Timer/break preferences | Yes | `storage.local` | No (free) / Sync server (Pro) | Indefinite | Full edit |
| Nuclear option PIN | Yes (hashed) | `storage.local` | No | Until disabled | Set, change, remove |
| OAuth tokens (Pro) | Yes (encrypted) | `storage.local` | To Google (auth), our server (verification) | Until sign-out | Sign out to delete |
| Email address (Pro) | Yes | `storage.local` (encrypted) | To our sync/payment servers | Until account deletion | Delete account |
| Payment info (Pro) | **No** | Stripe only | Stripe only (extension never sees card numbers) | Stripe manages | Via Stripe dashboard |
| Browsing history | **No** | Not stored | No | N/A | N/A |
| Page content | **No** | Not stored | No | N/A | N/A |
| Keystrokes | **No** | Not stored | No | N/A | N/A |
| Extension usage analytics (Pro) | Yes (anonymized) | Not stored locally | Analytics proxy (aggregated, no PII) | 90 days server-side | Opt-out in settings |
| IP address | **No** (not stored) | Not stored | Visible to servers during Pro API calls (standard HTTP) | Not stored server-side | Use VPN if desired |
| Crash reports | **No** | Not stored | No | N/A | N/A |

### 6.2 Privacy Promise Checklist

The extension advertises: **"Your data never leaves your device"** (free tier).

The following checklist must ALL be true for this promise to hold:

| # | Verification Item | Status | Notes |
|---|---|---|---|
| 1 | No network requests on free tier | MUST VERIFY | Audit all `fetch()`, `XMLHttpRequest`, `WebSocket`, `navigator.sendBeacon` calls. None should execute when user is on free tier. |
| 2 | No third-party analytics on free tier | MUST VERIFY | No Google Analytics, Mixpanel, Segment, or any tracking SDK. |
| 3 | No telemetry or crash reporting on free tier | MUST VERIFY | No Sentry, Bugsnag, or error reporting services. |
| 4 | No CDN-loaded resources | MUST VERIFY | All JS, CSS, fonts, images must be bundled. No external resource loading. |
| 5 | No external font loading | MUST VERIFY | Google Fonts, Adobe Fonts, etc. must not be referenced. |
| 6 | `connect-src 'self'` enforced for extension pages | MUST VERIFY | CSP blocks any outbound connections from extension pages. |
| 7 | Service worker makes no fetch calls (free tier) | MUST VERIFY | Audit service worker for any network activity. |
| 8 | Content scripts make no network requests | MUST VERIFY | Content scripts should only communicate with the service worker via `chrome.runtime`. |
| 9 | Offscreen document makes no network requests | MUST VERIFY | Offscreen doc should only load local audio files. |
| 10 | `chrome.storage.sync` is not used on free tier | MUST VERIFY | Sync storage communicates with Google's servers. Free tier must use only `storage.local`. |
| 11 | No DNS prefetch or preconnect hints | MUST VERIFY | Check HTML for `<link rel="dns-prefetch">` or `<link rel="preconnect">`. |
| 12 | Uninstall URL does not include user data | MUST VERIFY | `chrome.runtime.setUninstallURL()` must not include PII, settings, or usage data in the URL. |
| 13 | No WebRTC usage | MUST VERIFY | WebRTC can leak local IP addresses. |
| 14 | Import/export is file-based only | MUST VERIFY | Settings export saves to local file. Import reads from local file. No cloud backup on free tier. |
| 15 | Permissions do not enable passive data collection | MUST VERIFY | `<all_urls>` grants access but code must not USE this access for data collection. |
| 16 | No remote configuration fetching | MUST VERIFY | Feature flags, A/B tests, etc. must not involve network calls on free tier. |
| 17 | Block page does not load external resources | MUST VERIFY | The injected block page must not include images, scripts, or styles from external sources. |

### 6.3 Privacy Audit Automation

Implement an automated test that:
1. Installs the extension in a test Chrome profile.
2. Activates all free-tier features.
3. Monitors all network traffic via Chrome DevTools Protocol.
4. Asserts zero external network requests over a 1-hour usage session.
5. Runs as part of CI on every release.

---

## 7. Attack Surface Analysis

### Threat 1: Blocklist Bypass via Subdomain Manipulation

- **Description:** User blocks `facebook.com` but attacker navigates to `m.facebook.com`, `l.facebook.com`, or `0.facebook.com`.
- **Likelihood:** High
- **Impact:** Medium (undermines core functionality)
- **Mitigation:** When a user blocks `example.com`, automatically generate rules for `*.example.com`. Normalize all blocklist entries to root domain + wildcard subdomain pattern.

### Threat 2: Block Page Bypass via Browser Cache

- **Description:** User navigates to a blocked site that was previously cached. The browser serves the cached page without triggering a navigation event.
- **Likelihood:** Medium
- **Impact:** Medium
- **Mitigation:** `declarativeNetRequest` operates at the network level and intercepts navigations before cache lookup. Additionally, inject a content script heartbeat that checks block status on `visibilitychange` events.

### Threat 3: DNS-over-HTTPS / IP Direct Access Bypass

- **Description:** User accesses a blocked site by navigating directly to its IP address or using an alternative DNS-over-HTTPS resolver.
- **Likelihood:** Low (requires technical knowledge)
- **Impact:** High (complete bypass)
- **Mitigation:** Block by both domain name and known IP ranges for popular sites. Include rules for common CDN IPs associated with blocked domains. Acknowledge this as a partial mitigation; a determined technical user can always find workarounds.

### Threat 4: Cross-Extension Message Injection

- **Description:** Another extension sends crafted messages to Focus Mode's service worker to manipulate settings.
- **Likelihood:** Low
- **Impact:** High
- **Mitigation:** Validate `sender.id === chrome.runtime.id` on every message. Do not declare `externally_connectable`. Log and reject all foreign messages.

### Threat 5: Storage Tampering via DevTools

- **Description:** User opens DevTools, navigates to Application > Storage, and directly modifies `chrome.storage.local` to disable blocking or nuclear mode.
- **Likelihood:** Medium (nuclear mode users are self-blocking)
- **Impact:** High (defeats nuclear mode purpose)
- **Mitigation:** Integrity checksums on storage values (Section 4.3). Periodic integrity verification in the service worker. See Nuclear Option Security (Section 8) for additional layers.

### Threat 6: Content Script Injection into Block Page

- **Description:** A malicious website or extension injects JavaScript into our block page overlay to dismiss it.
- **Likelihood:** Low
- **Impact:** Medium
- **Mitigation:** Use Shadow DOM for the block page overlay. Attach event listeners with `{ capture: true }` to intercept and cancel removal attempts. Monitor the overlay's existence with a MutationObserver.

### Threat 7: Extension Disable/Uninstall During Nuclear Mode

- **Description:** User navigates to `chrome://extensions` and disables or uninstalls the extension to bypass blocking.
- **Likelihood:** High (most obvious bypass)
- **Impact:** Critical (complete bypass)
- **Mitigation:** This is addressed in Nuclear Option Security (Section 8). Partial mitigations include blocking `chrome://extensions` navigation, monitoring extension lifecycle events, and using `chrome.management` API to detect pending disablement.

### Threat 8: OAuth Token Theft

- **Description:** Attacker gains access to user's Chrome profile and extracts the stored OAuth token.
- **Likelihood:** Low
- **Impact:** High (access to user's Pro account and synced data)
- **Mitigation:** Encrypt tokens at rest (Section 4.2). Use short-lived tokens with refresh rotation. Server-side: bind tokens to extension ID and device fingerprint. Implement token revocation on server when suspicious activity is detected.

### Threat 9: Malicious Settings Import

- **Description:** User imports a crafted JSON file that exploits parser vulnerabilities or injects malicious data.
- **Likelihood:** Medium
- **Impact:** Medium (could corrupt settings, inject script via stored XSS)
- **Mitigation:** Strict JSON schema validation (Section 3.3). Prototype pollution prevention. HTML entity encoding for all stored strings before DOM insertion.

### Threat 10: Phishing via Block Page

- **Description:** Attacker creates a website that mimics the Focus Mode block page to trick users into entering their nuclear PIN.
- **Likelihood:** Low
- **Impact:** High (PIN disclosure)
- **Mitigation:** Never ask for the nuclear PIN on any web page. PIN entry only occurs within the extension popup (extension URL scheme). Display the extension's identity clearly in the popup. Educate users in onboarding.

### Threat 11: Service Worker Termination Exploit

- **Description:** Attacker causes the MV3 service worker to terminate (e.g., by exhausting the 5-minute idle timeout), hoping the extension fails to re-initialize blocking rules.
- **Likelihood:** Medium
- **Impact:** Medium (temporary blocking gap)
- **Mitigation:** `declarativeNetRequest` rules persist independently of the service worker. They remain active even when the service worker is inactive. Ensure all blocking logic uses declarative rules, not programmatic webRequest interception. On service worker wake, validate all declarative rules are still in place.

### Threat 12: Sync Storage Poisoning (Pro)

- **Description:** Attacker compromises one synced device and pushes malicious settings that propagate to all devices.
- **Likelihood:** Low
- **Impact:** High (all devices affected)
- **Mitigation:** Sign sync payloads with a device-specific key. Validate all incoming sync data against the same schemas used for import validation. Allow users to review sync changes before applying.

### Threat 13: Privacy Leak via Referer Header

- **Description:** When the extension opens external links (e.g., upgrade page, support page), the Referer header might leak the previously visited URL.
- **Likelihood:** Medium
- **Impact:** Low (minor privacy leak)
- **Mitigation:** Open all external links with `rel="noreferrer noopener"`. Use `Referrer-Policy: no-referrer` header. Open external links in new tabs.

### Threat 14: Side-Channel Timer Analysis

- **Description:** A website detects that Focus Mode is active by observing that certain requests are blocked or that injected elements exist in the DOM.
- **Likelihood:** Medium
- **Impact:** Low (privacy leak: reveals extension usage)
- **Mitigation:** Use generic error responses for blocked requests (standard connection refused, not custom error pages visible to page JavaScript). Ensure injected block page elements are not detectable from the page's JavaScript context (Shadow DOM, isolated world).

### Threat 15: Supply Chain Attack on Dependencies

- **Description:** A compromised npm package or build tool injects malicious code into the extension bundle.
- **Likelihood:** Low
- **Impact:** Critical (full compromise of extension and user data)
- **Mitigation:** Minimize dependencies (prefer native browser APIs). Pin all dependency versions with lockfile. Audit dependencies with `npm audit` on every build. Use Subresource Integrity (SRI) where applicable. Implement a reproducible build process. Review bundle output before release submission.

---

## 8. Nuclear Option Security

The nuclear option is a voluntary self-control feature where the user locks themselves out of changing settings or disabling blocking for a chosen duration. It must be as tamper-resistant as technically possible within Chrome extension platform constraints.

### 8.1 Six Tamper-Resistance Layers

#### Layer 1: Declarative Net Request Rules (Persistence Layer)

**Mechanism:** When nuclear mode is armed, all blocking rules are written as `declarativeNetRequest` dynamic rules. These rules persist independently of the service worker and survive extension restarts.

**Properties:**
- Rules remain active even when the service worker is terminated.
- Rules survive Chrome restarts.
- Rules can only be removed by code within the extension calling `chrome.declarativeNetRequest.updateDynamicRules()`.

**Bypass vector:** Disabling or uninstalling the extension removes all declarative rules.
**Mitigation:** See Layers 4 and 5.

#### Layer 2: PIN-Protected Disarm (Authentication Layer)

**Mechanism:** Disarming nuclear mode requires entering the PIN set during arming. The PIN is hashed with PBKDF2 (100k iterations, SHA-256, random salt) and stored.

**Properties:**
- PIN is never stored in plaintext.
- Brute-force rate-limited: 5 attempts per 15-minute window.
- After 15 failed attempts total, add an escalating cooldown (30 minutes, 1 hour, 2 hours).
- PIN verification happens exclusively in the service worker, never in the popup JavaScript.

**Bypass vector:** Direct storage modification to replace or remove the PIN hash.
**Mitigation:** See Layer 3.

#### Layer 3: Storage Integrity Monitoring (Tamper Detection Layer)

**Mechanism:** The service worker periodically (every 30 seconds via `chrome.alarms`) verifies the integrity of nuclear mode configuration in storage.

```javascript
// Integrity check structure
const nuclearIntegrity = {
  armed: true,
  armedAt: 1707580800000,
  disableAt: 1707609600000,
  pinHash: 'a1b2c3...',
  ruleIds: [1001, 1002, 1003, ...],
  checksum: 'sha256-of-above-fields',
  nonce: 'random-per-arm',  // Changes each time nuclear is armed
};
```

**Properties:**
- If the checksum does not match, the service worker re-arms nuclear mode from the last known good state (stored redundantly).
- Redundant storage: nuclear state is stored in both `chrome.storage.local` AND `chrome.storage.session` (service worker memory). If either is tampered with, the other is used to restore.
- The service worker also verifies that all expected `declarativeNetRequest` rules are still present and re-creates any missing rules.

**Bypass vector:** Simultaneously tamper with both storage locations and the in-memory state.
**Mitigation:** This requires code execution within the extension context, which would mean the extension is already compromised.

#### Layer 4: Extension Management Page Blocking (Navigation Guard Layer)

**Mechanism:** During nuclear mode, add `declarativeNetRequest` rules that redirect navigation to Chrome extension management pages.

```javascript
// Block access to extension management
const managementBlockRules = [
  {
    id: 99001,
    priority: 1,
    action: { type: 'redirect', redirect: { extensionPath: '/blocked.html' } },
    condition: {
      regexFilter: '^chrome://extensions.*',
      resourceTypes: ['main_frame'],
    },
  },
];
```

**Important limitation:** `declarativeNetRequest` cannot actually block `chrome://` URLs. This is a platform limitation.

**Alternative mitigation:** Use a content script or the `chrome.tabs` API to monitor for navigation to `chrome://extensions` and immediately redirect or close the tab.

```javascript
// Monitor tab updates for extension management pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (isNuclearArmed() && changeInfo.url) {
    const url = changeInfo.url.toLowerCase();
    if (url.startsWith('chrome://extensions') ||
        url.startsWith('chrome://settings') ||
        url.includes('chrome/extensions')) {
      chrome.tabs.update(tabId, { url: chrome.runtime.getURL('/nuclear-warning.html') });
    }
  }
});
```

**Bypass vector:** Using keyboard shortcuts (Ctrl+Shift+E), bookmark to `chrome://extensions`, or typing the URL extremely quickly.
**Mitigation:** The tab monitoring catches navigations asynchronously. There may be a brief window where the extensions page is visible before the redirect. This is an acknowledged limitation. Combine with Layer 5.

#### Layer 5: Extension Self-Monitoring (Heartbeat Layer)

**Mechanism:** A companion mechanism that detects if the extension has been disabled or is about to be uninstalled.

**Approach A - Alarm-based heartbeat:**
```javascript
// Set an alarm every 1 minute during nuclear mode
chrome.alarms.create('nuclear-heartbeat', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'nuclear-heartbeat') {
    verifyNuclearIntegrity();
    verifyDeclarativeRules();
  }
});
```

If the extension is disabled, the alarm stops firing. This does not prevent disabling, but combined with Layer 6, the user is warned of the consequences before they can disable.

**Approach B - Persistent warning notification:**
During nuclear mode, maintain a persistent Chrome notification that reminds the user that nuclear mode is active and cannot be bypassed.

**Bypass vector:** User can always disable the extension through Chrome. This is a Chrome platform guarantee that extensions cannot override.
**Mitigation:** Accept this limitation. The nuclear option is a psychological barrier and friction mechanism, not a true jail. Document this clearly to users.

#### Layer 6: Social / Psychological Friction Layer

**Mechanism:** Even if the user reaches `chrome://extensions`, add maximum friction.

**Components:**
- **Shame timer:** Before allowing nuclear disarm (even with PIN), require the user to wait 5 minutes while staring at a screen that says "You committed to focusing until [time]. Are you sure you want to quit?"
- **Reflection prompt:** Require the user to type a full sentence: "I am choosing to break my focus commitment" before the disarm PIN field appears.
- **Accountability logging:** Log all nuclear disarm events (timestamp, remaining time) to session history. Users see their "broken commitments" in their statistics.
- **Cooldown penalty:** If the user disarms nuclear mode early, they cannot re-arm for a penalty period (e.g., 2x the remaining time, capped at 24 hours).

### 8.2 Comprehensive Bypass Vector Matrix

| Bypass Vector | Feasibility | Mitigation | Residual Risk |
|---|---|---|---|
| Disable extension in `chrome://extensions` | Easy | Layer 4 (redirect), Layer 6 (friction) | **High** - Chrome guarantees users can disable extensions. Cannot be fully prevented. |
| Uninstall extension | Easy | Layer 4, Layer 6 | **High** - Same as above. |
| Edit `chrome.storage.local` via DevTools | Medium | Layer 3 (integrity checks), Layer 5 (heartbeat) | **Low** - Would need to modify multiple storage keys simultaneously and match checksums. |
| Modify extension files on disk | Hard | Chrome verifies extension integrity on load | **Negligible** - Chrome rejects tampered extensions. |
| Use a different browser | Easy | N/A | **High** - Out of scope. User can always switch browsers. |
| Use incognito mode | Easy | Ensure extension runs in incognito (manifest setting) | **Low** - With proper config. |
| Use a different Chrome profile | Easy | N/A | **High** - Out of scope. |
| Clear browsing data | Medium | Declarative rules survive data clearing; storage.local does too unless specifically targeted | **Medium** - User could specifically clear extension data. |
| Use DevTools to dismiss block page | Medium | Shadow DOM, MutationObserver (Layer 6 content defense) | **Low** - Observer re-injects immediately. |
| Terminate service worker | Easy | Layer 1 (declarative rules persist), Layer 5 (alarm re-triggers) | **Negligible** - Declarative rules are platform-level. |
| Time-based: wait for nuclear expiry | Easy | This is by design. Nuclear has a chosen end time. | **N/A** - Working as intended. |
| System clock manipulation | Medium | Use monotonic time (`performance.now()` deltas) rather than wall clock; however, across restarts this is lost. Store server time on arm (Pro) or use relative time. | **Medium** - Acknowledged limitation for free tier. |

### 8.3 User Disclosure

The nuclear mode UI must clearly communicate:

> "Nuclear Mode creates strong barriers against disabling your blocker, but no software can make it truly impossible for you to regain control of your own computer. This feature works best as a commitment device when you genuinely want to stay focused. Determined technical users can find workarounds."

---

## 9. Security Test Cases

### 9.1 Input Validation Tests

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| TC-01 | XSS via blocklist URL | Add `<script>alert(1)</script>` as a blocklist entry | Input rejected; HTML stripped; no script execution |
| TC-02 | XSS via session name | Set session name to `<img src=x onerror=alert(1)>` | HTML entities encoded; rendered as literal text |
| TC-03 | Oversized blocklist | Attempt to add 10,001 entries | Rejected at entry 10,001 with user-friendly error |
| TC-04 | Unicode homoglyph domain | Add `gооgle.com` (Cyrillic "o") | Converted to Punycode; stored as `xn--ggle-0nda.com` |
| TC-05 | Prototype pollution via import | Import JSON with `{"__proto__": {"admin": true}}` | `__proto__` key rejected; import fails with error |
| TC-06 | Malformed JSON import | Import `{invalid json` | Parse error caught; user-friendly error shown |
| TC-07 | Oversized import file | Import 10 MB JSON file | Rejected before parsing with size error |
| TC-08 | SQL injection in text field | Enter `'; DROP TABLE users; --` as session name | Stored literally (no SQL backend); rendered safely |
| TC-09 | Extremely long domain | Add 300-character domain | Rejected (exceeds 253 char limit) |
| TC-10 | Path traversal in import | Import JSON with `../../etc/passwd` as a file path value | Value sanitized; no file system access |

### 9.2 Authentication and Authorization Tests

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| TC-11 | Nuclear PIN brute force | Attempt 6 incorrect PINs in rapid succession | 5th attempt triggers rate limit; 6th rejected with cooldown timer |
| TC-12 | Nuclear PIN bypass via storage edit | Modify `fm_nuclear_pin_v1` in DevTools | Integrity check detects mismatch; re-arms from backup |
| TC-13 | Foreign extension message | Send `NUCLEAR_DISARM` from another extension | Rejected (sender.id mismatch) |
| TC-14 | Web page message injection | Call `chrome.runtime.sendMessage(EXTENSION_ID, ...)` from a website | Rejected (no `externally_connectable` declared) |
| TC-15 | Expired OAuth token handling | Simulate expired Pro OAuth token | Token refresh attempted; if refresh fails, user prompted to re-authenticate; old token securely deleted |

### 9.3 Privacy Tests

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| TC-16 | Free tier network audit | Install extension, use all free features for 1 hour, monitor network | Zero external network requests |
| TC-17 | DNS leak check | Monitor DNS queries during free-tier usage | No DNS queries to extension-owned domains |
| TC-18 | Referrer leak on external link click | Click "Upgrade to Pro" link, inspect Referer header | No Referer header sent (noreferrer) |
| TC-19 | Storage inspection after uninstall | Uninstall extension, inspect Chrome profile storage | All extension storage deleted |
| TC-20 | Incognito data isolation | Use extension in incognito, close window, check storage | Incognito session data not persisted to regular storage |

### 9.4 Nuclear Mode Penetration Tests

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| TC-21 | Nuclear mode storage tampering | Arm nuclear, modify `armed` to `false` in storage | Service worker detects tampering within 30s, re-arms |
| TC-22 | Nuclear declarative rule deletion | Arm nuclear, use `chrome.declarativeNetRequest.updateDynamicRules` to remove rules via DevTools console | Rules re-created on next heartbeat (30s); blocking restored |
| TC-23 | Nuclear clock manipulation | Arm nuclear, advance system clock past `disableAt` | If using wall clock: nuclear expires (expected). If using monotonic time: nuclear persists until true duration elapses. |
| TC-24 | Nuclear incognito bypass | Arm nuclear, open incognito window, navigate to blocked site | Blocked (extension enabled in incognito via manifest + user permission) |
| TC-25 | Block page DOM removal | Use DevTools to remove the block page overlay from DOM | MutationObserver re-injects overlay immediately |
| TC-26 | Service worker kill during nuclear | Navigate to `chrome://serviceworker-internals`, stop the worker | Declarative rules remain active; worker restarts on next event; heartbeat resumes |

### 9.5 CSP and Resource Loading Tests

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| TC-27 | Inline script in extension page | Inject `<script>alert(1)</script>` into popup HTML | Blocked by CSP; error in console |
| TC-28 | Remote script loading | Add `<script src="https://evil.com/script.js">` to popup HTML | Blocked by CSP |
| TC-29 | Eval attempt | Call `eval('alert(1)')` in extension JavaScript | Blocked by MV3 CSP; throws error |
| TC-30 | External image loading | Add `<img src="https://tracking.com/pixel.gif">` | Blocked by CSP `img-src 'self' data:` |

---

## 10. Compliance Documentation

### 10.1 Privacy Policy Requirements

The Chrome Web Store requires a privacy policy if the extension handles any user data. Focus Mode's privacy policy must include the following sections:

**Required Disclosures:**

1. **Data Collection:** Enumerate all data categories collected (see Section 6.1). Distinguish between free tier (local only) and Pro tier (server-transmitted).

2. **Data Usage:** Each collected data category must have a stated purpose:
   - Blocklist URLs: "Used solely to block websites you specify during focus sessions."
   - Session history: "Used solely to display your productivity statistics within the extension."
   - Page visit data: "Used solely to show you which sites consume your time. Stored as domain names only, never full URLs."

3. **Data Sharing:** Explicit statement: "We do not sell, share, or transfer your personal data to third parties. On the free tier, no data leaves your device. On the Pro tier, data is shared with: (a) Google, for authentication; (b) Stripe, for payment processing; (c) our sync servers, for cross-device functionality."

4. **Data Retention:** Specific retention periods for each data category (see Section 4.4).

5. **Data Deletion:** Instructions for deleting data: "Uninstalling the extension permanently deletes all locally stored data. Pro users can request account and server-side data deletion at [support email]."

6. **Security Measures:** General description of encryption and security practices (do not disclose specific implementation details).

7. **Contact Information:** Support email address for privacy inquiries.

8. **Changes to Policy:** Commitment to notify users of material changes.

### 10.2 Chrome Web Store Compliance

**Single Purpose Policy:**
The extension's single purpose must be clearly stated: "Help users focus by blocking distracting websites and providing a focus timer." All features must relate to this purpose.

**Permission Justification Text:**
The Chrome Web Store requires justification for each permission in the developer dashboard.

| Permission | Justification Text (for CWS submission) |
|---|---|
| `storage` | "Stores the user's custom blocklist, focus timer settings, and session history locally on their device." |
| `alarms` | "Schedules focus session timers and break reminders that must fire even when the extension popup is closed." |
| `declarativeNetRequest` | "Blocks navigation to websites on the user's blocklist during focus sessions using Chrome's built-in declarative blocking API." |
| `declarativeNetRequestWithHostAccess` | "Creates dynamic blocking rules for user-specified websites. Required because the blocklist is user-configurable and cannot be known at build time." |
| `activeTab` | "Injects the focus-mode block page on the currently active tab when the user navigates to a blocked site. Only activates on the current tab, not all tabs." |
| `scripting` | "Programmatically injects the block page overlay and page time tracker into web pages. Required by Manifest V3 for dynamic script injection." |
| `notifications` | "Sends desktop notifications when a focus session starts, ends, or when it's time for a break." |
| `offscreen` | "Plays timer sounds and ambient audio. Manifest V3 service workers cannot play audio directly, so an offscreen document is required." |
| `<all_urls>` | "Required for declarativeNetRequestWithHostAccess to apply blocking rules to any website the user adds to their blocklist. We recommend migrating to per-domain dynamic permissions in a future version (see Permission Audit, Section 1.3, Item 3)." |
| `identity` (optional) | "Used for Google Sign-In when the user opts into Focus Mode Pro. Only requested when the user initiates sign-in." |
| `idle` (optional) | "Detects when the user is idle to automatically pause focus sessions and improve time tracking accuracy. Only requested when the user enables this feature in settings." |
| `tabGroups` (optional) | "Organizes tabs into visual groups during focus sessions. Only requested when the user enables this feature in settings." |

### 10.3 Chrome Web Store "Limited Use" Compliance

The extension must comply with Chrome's "Limited Use" policy for user data:

1. **Use data only for the single purpose described.** Blocklist URLs are used for blocking, not profiling. Session data is used for statistics, not advertising.

2. **Do not transfer data to third parties** except: (a) as necessary for the stated purpose (Pro sync), (b) for legal compliance, (c) during a merger/acquisition (with user notice), (d) in anonymized/aggregated form where no individual can be identified.

3. **Do not use data for advertising or credit evaluation.**

4. **Do not use data for purposes unrelated to the extension's functionality.**

### 10.4 GDPR Considerations (Pro Tier)

If the Pro tier is available to EU users:

- **Lawful basis:** Consent (user explicitly signs up) and Contract (Pro subscription agreement).
- **Right to access:** Provide data export functionality within the extension.
- **Right to erasure:** Implement account deletion that removes all server-side data.
- **Right to portability:** Settings export as JSON satisfies this.
- **Data Processing Agreement:** Required with server hosting provider and Stripe.
- **Data Protection Impact Assessment:** Recommended given the processing of browsing behavior data.

---

## 11. Security Implementation Checklist

Prioritized by severity and implementation order. Each item is tagged with its priority level.

### P0: Critical (Must ship with v1.0)

- [ ] **SEC-01:** Validate `sender.id === chrome.runtime.id` in every `chrome.runtime.onMessage` listener. No exceptions.
- [ ] **SEC-02:** Never use `innerHTML` with user-supplied data. Use `textContent` or DOM creation APIs exclusively.
- [ ] **SEC-03:** Strip all HTML from user text inputs (blocklist URLs, session names, custom block messages) before storage.
- [ ] **SEC-04:** Implement strict JSON schema validation for settings import with prototype pollution prevention (`__proto__`, `constructor`, `prototype` key rejection).
- [ ] **SEC-05:** Hash nuclear PIN with PBKDF2 (100,000 iterations, SHA-256, 16-byte random salt). Never store plaintext.
- [ ] **SEC-06:** Encrypt OAuth tokens before writing to `chrome.storage.local` using AES-256-GCM via Web Crypto API.
- [ ] **SEC-07:** Set the Content Security Policy in `manifest.json` per Section 2.1 specifications. Verify `script-src 'self'` and `object-src 'none'`.
- [ ] **SEC-08:** Ensure zero external network requests on free tier. Audit every `fetch()`, `XMLHttpRequest`, and `navigator.sendBeacon` call.
- [ ] **SEC-09:** Do not declare `externally_connectable` in `manifest.json` to prevent web pages and other extensions from sending messages.
- [ ] **SEC-10:** Validate and sanitize all `declarativeNetRequest` rule parameters before calling the API. Malformed rules could disable all blocking.

### P1: High (Must ship with v1.0 or first update)

- [ ] **SEC-11:** Implement nuclear mode storage integrity checksums with redundant storage in `chrome.storage.session`.
- [ ] **SEC-12:** Rate-limit nuclear PIN attempts: 5 per 15-minute window with escalating cooldown.
- [ ] **SEC-13:** Block/redirect navigation to `chrome://extensions` and `chrome://settings` during nuclear mode via `chrome.tabs.onUpdated` listener.
- [ ] **SEC-14:** Normalize blocklist domains: lowercase, strip protocol/path, convert IDN to Punycode, auto-add wildcard subdomain rules.
- [ ] **SEC-15:** Use Shadow DOM for injected block page to prevent page-level JavaScript from manipulating it.
- [ ] **SEC-16:** Add MutationObserver to re-inject block page if it is removed from the DOM.
- [ ] **SEC-17:** Implement message payload validation against strict schemas for every message type (Section 5.3).
- [ ] **SEC-18:** Ensure `declarativeNetRequest` rules are the primary blocking mechanism (persist without service worker). Do not rely on programmatic blocking.
- [ ] **SEC-19:** Verify all blocking rules are intact on every service worker startup via `chrome.declarativeNetRequest.getDynamicRules()`.
- [ ] **SEC-20:** Set `Referrer-Policy: no-referrer` and use `rel="noreferrer noopener"` on all external links.

### P2: Medium (Should ship within 30 days of launch)

- [ ] **SEC-21:** Implement automated network traffic monitoring test in CI that verifies zero external requests on free tier.
- [ ] **SEC-22:** Migrate from `<all_urls>` to per-domain dynamic permissions via `chrome.permissions.request()` for user-added blocklist entries.
- [ ] **SEC-23:** Add Content-Security-Policy `frame-ancestors 'none'` to prevent clickjacking of extension pages.
- [ ] **SEC-24:** Implement data retention auto-purge: session history after 365 days, page visit data after 30 days.
- [ ] **SEC-25:** Add nonce-based request validation for sensitive operations (nuclear arm/disarm, settings import).
- [ ] **SEC-26:** Pin all npm dependency versions. Run `npm audit` in CI pipeline. Fail the build on high/critical vulnerabilities.
- [ ] **SEC-27:** Implement secure settings migration for storage schema changes with atomic write-verify-delete pattern.

### P3: Low (Should complete within 90 days of launch)

- [ ] **SEC-28:** Implement Pro tier sync payload signing with device-specific keys to prevent sync poisoning.
- [ ] **SEC-29:** Add nuclear mode social friction features: shame timer, reflection prompt, accountability logging.
- [ ] **SEC-30:** Implement monotonic timer for nuclear mode to resist system clock manipulation.
- [ ] **SEC-31:** Create a security self-test page (accessible via options page) that validates CSP, storage integrity, and rule state.
- [ ] **SEC-32:** Document the threat model and accepted risks in user-facing help documentation.
- [ ] **SEC-33:** Conduct third-party security review before exceeding 100,000 users.
- [ ] **SEC-34:** Implement rate limiting on all message handlers to prevent DoS from rapid-fire messages (max 100 messages per second per sender).
- [ ] **SEC-35:** Add anomaly detection for storage writes: alert if storage size increases by more than 50% in a single operation (possible data injection).

---

## Appendix A: Security Architecture Diagram

```
+------------------------------------------------------------------+
|                        CHROME BROWSER                             |
|                                                                   |
|  +-------------------+     +----------------------------------+   |
|  |   EXTENSION        |     |          WEB PAGES              |   |
|  |   PAGES            |     |                                  |   |
|  |  (popup, options)  |     |  +----------------------------+  |   |
|  |                    |     |  | Content Scripts             |  |   |
|  |  CSP: strict       |     |  | (isolated world)            |  |   |
|  |  No external       |     |  |                              |  |   |
|  |  connections        |     |  | - Block page (Shadow DOM)   |  |   |
|  |                    |     |  | - Site detector              |  |   |
|  +--------+-----------+     |  | - Page time tracker          |  |   |
|           |                 |  +-------------+----------------+  |   |
|           | runtime.        |                |                   |   |
|           | sendMessage     |                | runtime.          |   |
|           |                 |                | sendMessage       |   |
|  +--------v-----------------+----------------v----------------+  |   |
|  |                    SERVICE WORKER                           |  |   |
|  |                                                             |  |   |
|  |  - Message validation (sender.id, schema, nonce)            |  |   |
|  |  - Storage integrity monitoring (30s heartbeat)             |  |   |
|  |  - Nuclear mode enforcement                                 |  |   |
|  |  - DeclarativeNetRequest rule management                    |  |   |
|  |  - Token encryption/decryption                              |  |   |
|  |  - Pro API calls (HTTPS only, pinned domains)               |  |   |
|  +--------+----------------------------------------------------+  |   |
|           |                                                       |   |
|  +--------v-----------+    +----------------------------------+   |   |
|  | chrome.storage      |    | declarativeNetRequest           |   |   |
|  |                    |    | (Platform-level blocking)         |   |   |
|  | .local (encrypted  |    |                                  |   |   |
|  |  tokens, checksums)|    | - Persists without SW            |   |   |
|  | .session (backup)  |    | - Survives restarts              |   |   |
|  | .sync (Pro only)   |    | - Cannot be bypassed by pages    |   |   |
|  +--------------------+    +----------------------------------+   |   |
|                                                                   |
|  +--------------------+                                           |
|  | Offscreen Document |                                           |
|  | (audio only)       |                                           |
|  | No network access  |                                           |
|  +--------------------+                                           |
+------------------------------------------------------------------+

EXTERNAL (Pro tier only, HTTPS):
  - Google OAuth (identity)
  - Stripe (payments)
  - Sync server (settings sync)
  - AI server (smart scheduling)
  - Analytics proxy (anonymized metrics)
```

## Appendix B: Accepted Risks

The following risks are acknowledged as inherent to the Chrome extension platform and cannot be fully mitigated:

1. **Users can always disable/uninstall extensions.** Chrome guarantees this. The nuclear option is a friction device, not a lock.
2. **Users with DevTools access can inspect extension storage.** Token encryption provides defense-in-depth but the key derivation material (extension ID) is not truly secret.
3. **The `<all_urls>` permission creates a broad permission warning.** Until per-domain dynamic permissions are implemented (SEC-22), this is a necessary trade-off.
4. **MV3 service worker idle termination** can create brief gaps in programmatic enforcement. Declarative rules fill this gap, but features relying on service worker logic (integrity checks, tab monitoring) may be delayed by up to 30 seconds.
5. **System clock manipulation** can affect wall-clock-based timers. A fully monotonic solution that survives browser restarts is not available in the Web Platform.

---

*End of Security and Privacy Hardening Specification*
