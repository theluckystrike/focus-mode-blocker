# Agent 2 — JavaScript Error Detection & Prevention Specification

**Focus Mode - Blocker** | Chrome MV3 Extension
Version: 1.0 | Date: 2026-02-10

---

## Table of Contents

1. [Static Analysis Rules (ESLint Configuration)](#1-static-analysis-rules)
2. [Chrome API Usage Validation Guide](#2-chrome-api-usage-validation-guide)
3. [Async/Await Error Handling Patterns](#3-asyncawait-error-handling-patterns)
4. [Service Worker Restriction Checklist](#4-service-worker-restriction-checklist)
5. [Content Script Isolation Rules](#5-content-script-isolation-rules)
6. [Event Listener Best Practices](#6-event-listener-best-practices)
7. [Type Safety Without TypeScript](#7-type-safety-without-typescript)

---

## 1. Static Analysis Rules

### ESLint Configuration (`.eslintrc.json`)

```json
{
  "env": {
    "browser": true,
    "es2022": true,
    "webextensions": true
  },
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module"
  },
  "globals": {
    "chrome": "readonly",
    "importScripts": "readonly",
    "ServiceWorkerGlobalScope": "readonly",
    "clients": "readonly",
    "self": "readonly"
  },
  "plugins": ["no-unsanitized"],
  "rules": {
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-new-func": "error",
    "no-var": "error",
    "prefer-const": ["error", {
      "destructuring": "all",
      "ignoreReadBeforeAssign": false
    }],
    "consistent-return": "error",
    "no-unused-vars": ["error", {
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_",
      "caughtErrorsIgnorePattern": "^_"
    }],
    "no-unsanitized/method": "error",
    "no-unsanitized/property": "error",

    "no-restricted-properties": ["error",
      {
        "object": "document",
        "property": "write",
        "message": "document.write is forbidden. Use DOM APIs (createElement, textContent) instead."
      },
      {
        "object": "window",
        "property": "localStorage",
        "message": "localStorage is unavailable in service workers. Use chrome.storage.local instead."
      },
      {
        "object": "window",
        "property": "sessionStorage",
        "message": "sessionStorage is unavailable in service workers. Use chrome.storage.session instead."
      }
    ],

    "no-restricted-globals": ["error",
      {
        "name": "localStorage",
        "message": "localStorage is unavailable in service workers. Use chrome.storage.local."
      },
      {
        "name": "sessionStorage",
        "message": "sessionStorage is unavailable in service workers. Use chrome.storage.session."
      },
      {
        "name": "XMLHttpRequest",
        "message": "XMLHttpRequest is unavailable in service workers. Use fetch() instead."
      },
      {
        "name": "alert",
        "message": "alert() is unavailable in service workers. Use chrome.notifications.create()."
      },
      {
        "name": "confirm",
        "message": "confirm() is unavailable in service workers."
      },
      {
        "name": "prompt",
        "message": "prompt() is unavailable in service workers."
      }
    ],

    "no-async-promise-executor": "error",
    "no-await-in-loop": "warn",
    "no-promise-executor-return": "error",
    "require-atomic-updates": "warn",
    "no-return-await": "error",
    "prefer-promise-reject-errors": "error",
    "no-throw-literal": "error",

    "no-restricted-syntax": ["error",
      {
        "selector": "AssignmentExpression[left.property.name='innerHTML']",
        "message": "Do not use innerHTML. Use textContent or DOM APIs to prevent XSS."
      },
      {
        "selector": "AssignmentExpression[left.property.name='outerHTML']",
        "message": "Do not use outerHTML. Use DOM APIs to prevent XSS."
      },
      {
        "selector": "CallExpression[callee.property.name='insertAdjacentHTML']",
        "message": "Do not use insertAdjacentHTML. Use DOM APIs to prevent XSS."
      },
      {
        "selector": "CallExpression[callee.object.name='chrome'][callee.property.name!='runtime']",
        "message": "Chrome API calls must include error handling. Wrap in try/catch."
      }
    ],

    "eqeqeq": ["error", "always"],
    "no-implicit-coercion": "error",
    "no-magic-numbers": ["warn", {
      "ignore": [0, 1, -1, 2, 1000, 60, 60000],
      "ignoreArrayIndexes": true,
      "ignoreDefaultValues": true
    }],
    "curly": ["error", "all"],
    "no-nested-ternary": "error",
    "max-depth": ["warn", 4],
    "complexity": ["warn", 15],
    "max-lines-per-function": ["warn", { "max": 80, "skipBlankLines": true, "skipComments": true }]
  },
  "overrides": [
    {
      "files": ["src/background/**/*.js"],
      "rules": {
        "no-restricted-globals": ["error",
          "document", "window", "HTMLElement", "Element",
          "localStorage", "sessionStorage", "XMLHttpRequest",
          "alert", "confirm", "prompt",
          "addEventListener",
          "requestAnimationFrame", "cancelAnimationFrame",
          "getComputedStyle", "matchMedia"
        ]
      }
    },
    {
      "files": ["src/content/**/*.js"],
      "rules": {
        "no-restricted-globals": ["error",
          "localStorage", "sessionStorage"
        ],
        "no-restricted-properties": ["error",
          {
            "property": "localStorage",
            "message": "Content scripts cannot reliably use localStorage. Use chrome.storage."
          }
        ]
      }
    },
    {
      "files": ["src/popup/**/*.js", "src/options/**/*.js"],
      "env": {
        "browser": true
      },
      "rules": {
        "no-restricted-globals": ["error",
          "localStorage", "sessionStorage"
        ]
      }
    }
  ]
}
```

### Custom ESLint Rule: `no-innerHTML`

If the `no-unsanitized` plugin is insufficient or you need a simpler standalone rule, create a local ESLint plugin.

**File: `eslint-rules/no-inner-html.js`**

```js
/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow innerHTML, outerHTML, and insertAdjacentHTML to prevent XSS',
    },
    messages: {
      noInnerHTML: 'Do not assign to innerHTML. Use textContent or createElement.',
      noOuterHTML: 'Do not assign to outerHTML. Use replaceWith and createElement.',
      noInsertAdjacentHTML: 'Do not use insertAdjacentHTML. Use insertAdjacentElement.',
    },
    schema: [],
  },
  create(context) {
    return {
      'AssignmentExpression[left.property.name="innerHTML"]'(node) {
        context.report({ node, messageId: 'noInnerHTML' });
      },
      'AssignmentExpression[left.property.name="outerHTML"]'(node) {
        context.report({ node, messageId: 'noOuterHTML' });
      },
      'CallExpression[callee.property.name="insertAdjacentHTML"]'(node) {
        context.report({ node, messageId: 'noInsertAdjacentHTML' });
      },
    };
  },
};
```

### Supplementary: `package.json` Scripts

```json
{
  "scripts": {
    "lint": "eslint src/ --ext .js",
    "lint:fix": "eslint src/ --ext .js --fix",
    "lint:sw": "eslint src/background/ --ext .js",
    "lint:content": "eslint src/content/ --ext .js",
    "lint:ui": "eslint src/popup/ src/options/ --ext .js"
  }
}
```

---

## 2. Chrome API Usage Validation Guide

### 2.1 chrome.storage.local

**Correct MV3 usage (promise-based):**

```js
// READ
async function getLocalData(keys) {
  try {
    const result = await chrome.storage.local.get(keys);
    return result;
  } catch (err) {
    console.error('[storage.local.get] Failed:', err.message);
    return {};
  }
}

// WRITE
async function setLocalData(data) {
  try {
    await chrome.storage.local.set(data);
  } catch (err) {
    console.error('[storage.local.set] Failed:', err.message);
    // Check QUOTA_BYTES_PER_ITEM exceeded
    if (err.message.includes('QUOTA_BYTES')) {
      throw new StorageQuotaError(err.message);
    }
    throw err;
  }
}

// REMOVE
async function removeLocalData(keys) {
  try {
    await chrome.storage.local.remove(keys);
  } catch (err) {
    console.error('[storage.local.remove] Failed:', err.message);
    throw err;
  }
}
```

**Common errors:**
| Error | Cause | Fix |
|-------|-------|-----|
| `QUOTA_BYTES exceeded` | Stored data exceeds 10 MB limit | Prune old data; compress large objects before storage |
| `QUOTA_BYTES_PER_ITEM exceeded` | Single item exceeds ~8 KB in `storage.sync` | Split data across multiple keys or use `storage.local` |
| `undefined` result for key | Key was never written | Always check `result.keyName !== undefined` before use |
| Stale reads after rapid writes | Concurrent writes overwrite each other | Use `chrome.storage.local.get` + merge + `set` atomically; serialize with a write queue |

**Required error handling:**
- Always wrap in `try/catch`.
- Always validate the shape of returned data (keys may be missing).
- Listen for `chrome.storage.onChanged` to react to external writes.

---

### 2.2 chrome.storage.sync

**Correct MV3 usage (promise-based):**

```js
async function getSyncData(keys) {
  try {
    const result = await chrome.storage.sync.get(keys);
    return result;
  } catch (err) {
    console.error('[storage.sync.get] Failed:', err.message);
    // Sync may fail if user is offline or not signed in
    if (err.message.includes('QUOTA')) {
      console.warn('Sync quota exceeded, falling back to local storage');
    }
    return {};
  }
}

async function setSyncData(data) {
  try {
    await chrome.storage.sync.set(data);
  } catch (err) {
    if (err.message.includes('MAX_WRITE_OPERATIONS_PER_MINUTE')) {
      console.warn('Sync throttled. Retrying in 60s.');
      await delay(60000);
      return setSyncData(data);
    }
    throw err;
  }
}
```

**Common errors:**
| Error | Cause | Fix |
|-------|-------|-----|
| `MAX_ITEMS` exceeded | More than 512 keys in sync | Consolidate keys into fewer objects |
| `MAX_WRITE_OPERATIONS_PER_MINUTE` | More than 120 writes/min | Batch writes; debounce; retry after cooldown |
| `MAX_WRITE_OPERATIONS_PER_HOUR` | More than 1800 writes/hour | Cache locally, sync periodically |
| `QUOTA_BYTES_PER_ITEM` | Single key exceeds 8,192 bytes | Split data or use `storage.local` |
| Network offline | Sync cannot reach server | Catch error; fall back to `storage.local` reads |

**Required error handling:**
- Quota errors must be caught and surfaced to the user.
- Offline/unauthenticated errors must fall back gracefully to local storage.
- Write throttle errors must be retried with backoff.

---

### 2.3 chrome.storage.session

**Correct MV3 usage (promise-based):**

```js
// Session storage persists only while the browser is open.
// Limit: 10 MB. Service worker restarts do NOT clear session storage.

async function getSessionData(keys) {
  try {
    const result = await chrome.storage.session.get(keys);
    return result;
  } catch (err) {
    console.error('[storage.session.get] Failed:', err.message);
    return {};
  }
}

async function setSessionData(data) {
  try {
    await chrome.storage.session.set(data);
  } catch (err) {
    console.error('[storage.session.set] Failed:', err.message);
    throw err;
  }
}
```

**Common errors:**
| Error | Cause | Fix |
|-------|-------|-----|
| `QUOTA_BYTES` exceeded | Over 10 MB in session | Prune cached data regularly |
| Data gone after browser restart | Session storage is per-session only | Use `storage.local` for persistent data; session is ephemeral cache |
| Missing after service worker restart | Not an issue (session survives SW restart) | No action needed; but verify with `chrome.storage.session.get` at startup |

**Required error handling:**
- Always check for missing keys (data may be absent if session was cleared).
- Use session storage only for non-critical ephemeral data (caches, temp state).

---

### 2.4 chrome.alarms

**Correct MV3 usage (promise-based):**

```js
// CREATE
async function createAlarm(name, options) {
  try {
    // Minimum periodInMinutes in MV3: 1 minute (30s in dev mode)
    await chrome.alarms.create(name, {
      delayInMinutes: options.delayInMinutes || 1,
      periodInMinutes: options.periodInMinutes, // optional; omit for one-shot
    });
  } catch (err) {
    console.error(`[alarms.create] "${name}" failed:`, err.message);
    throw err;
  }
}

// QUERY
async function getAlarm(name) {
  try {
    const alarm = await chrome.alarms.get(name);
    return alarm || null; // returns undefined if alarm does not exist
  } catch (err) {
    console.error(`[alarms.get] "${name}" failed:`, err.message);
    return null;
  }
}

// LISTEN — must be at top level of service worker
chrome.alarms.onAlarm.addListener((alarm) => {
  switch (alarm.name) {
    case 'focus-timer-tick':
      handleTimerTick();
      break;
    case 'stats-flush':
      handleStatsFlush();
      break;
    case 'sync-periodic':
      handlePeriodicSync();
      break;
    default:
      console.warn(`[alarms] Unknown alarm: ${alarm.name}`);
  }
});
```

**Common errors:**
| Error | Cause | Fix |
|-------|-------|-----|
| Alarm never fires | `periodInMinutes` below 1 min (0.5 min in dev) | Use `>=1` in production |
| Alarm fires late | Chrome throttles alarms for background extensions | Accept ~1 min precision; do not depend on exact timing |
| Alarm lost after update | Extension update restarts SW; alarms persist but listener must re-register | Always register listener at top level |
| Duplicate alarms | Creating without clearing existing | Call `chrome.alarms.clear(name)` before re-creating |

**Required error handling:**
- Always check if alarm exists before relying on it.
- Register `onAlarm` listener at the top level of the service worker (not inside an async function or conditional).

---

### 2.5 chrome.declarativeNetRequest

**Correct MV3 usage (promise-based):**

```js
// UPDATE DYNAMIC RULES
async function updateBlockRules(blockedDomains) {
  try {
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const removeRuleIds = existingRules.map((r) => r.id);

    const addRules = blockedDomains.map((domain, index) => ({
      id: index + 1, // must be positive integer, unique
      priority: 1,
      action: { type: 'block' },
      condition: {
        urlFilter: `||${domain}`,
        resourceTypes: [
          'main_frame', 'sub_frame', 'stylesheet', 'script',
          'image', 'font', 'object', 'xmlhttprequest', 'ping',
          'media', 'websocket', 'webtransport', 'webbundle', 'other',
        ],
      },
    }));

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds,
      addRules,
    });
  } catch (err) {
    console.error('[declarativeNetRequest.updateDynamicRules] Failed:', err.message);
    throw err;
  }
}

// REDIRECT (for blocked page)
async function addRedirectRule(domain, redirectUrl, ruleId) {
  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: [{
        id: ruleId,
        priority: 2,
        action: {
          type: 'redirect',
          redirect: { extensionPath: redirectUrl },
        },
        condition: {
          urlFilter: `||${domain}`,
          resourceTypes: ['main_frame'],
        },
      }],
    });
  } catch (err) {
    console.error('[declarativeNetRequest.redirect] Failed:', err.message);
    throw err;
  }
}
```

**Common errors:**
| Error | Cause | Fix |
|-------|-------|-----|
| `Invalid rule ID` | ID is 0, negative, or duplicate | Use positive integers starting at 1; ensure uniqueness |
| `MAX_NUMBER_OF_DYNAMIC_RULES` | Exceeds 30,000 dynamic rules (as of 2025+) | Consolidate rules; use `requestDomains` instead of per-URL rules |
| Rule not matching | Incorrect `urlFilter` syntax | Test with `chrome.declarativeNetRequest.testMatchOutcome` |
| `resourceTypes` missing | Omitted required field | Always specify `resourceTypes` array |
| Rules persist across updates | Dynamic rules survive extension update | Intentional, but clear stale rules on update via `runtime.onInstalled` |

**Required error handling:**
- Validate rule IDs are positive and unique before calling.
- Cap the number of dynamic rules to stay under quota.
- On `runtime.onInstalled`, audit and clean up stale dynamic rules.

---

### 2.6 chrome.scripting

**Correct MV3 usage (promise-based):**

```js
// EXECUTE SCRIPT IN TAB
async function executeInTab(tabId, func, args = []) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func,
      args,
    });
    return results;
  } catch (err) {
    // Common: tab was closed, navigated to chrome:// URL, or permission denied
    if (err.message.includes('Cannot access')) {
      console.warn(`[scripting] No access to tab ${tabId}`);
      return null;
    }
    console.error('[scripting.executeScript] Failed:', err.message);
    throw err;
  }
}

// INSERT CSS
async function insertCSS(tabId, css) {
  try {
    await chrome.scripting.insertCSS({
      target: { tabId },
      css,
    });
  } catch (err) {
    console.warn(`[scripting.insertCSS] Failed for tab ${tabId}:`, err.message);
  }
}
```

**Common errors:**
| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot access a chrome:// URL` | Tab is a privileged page | Check `tab.url` prefix before injecting |
| `No tab with id X` | Tab was closed between query and execution | Wrap in try/catch; verify tab exists |
| `Missing host permission` | URL not in `host_permissions` | Add URL pattern to manifest or use `activeTab` |
| Script throws in target page | Injected code encounters page error | Return errors from the injected function explicitly |

**Required error handling:**
- Always verify the tab exists and is accessible before scripting.
- Catch and degrade gracefully on `chrome://`, `edge://`, `about:`, and Chrome Web Store URLs.

---

### 2.7 chrome.tabs

**Correct MV3 usage (promise-based):**

```js
// QUERY TABS
async function getActiveTabs() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs;
  } catch (err) {
    console.error('[tabs.query] Failed:', err.message);
    return [];
  }
}

// UPDATE TAB
async function navigateTab(tabId, url) {
  try {
    await chrome.tabs.update(tabId, { url });
  } catch (err) {
    if (err.message.includes('No tab with id')) {
      console.warn(`[tabs.update] Tab ${tabId} no longer exists`);
      return null;
    }
    throw err;
  }
}

// CREATE TAB
async function openTab(url) {
  try {
    const tab = await chrome.tabs.create({ url });
    return tab;
  } catch (err) {
    console.error('[tabs.create] Failed:', err.message);
    throw err;
  }
}

// onUpdated listener — top-level in service worker
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    handleTabNavigation(tabId, tab.url);
  }
});
```

**Common errors:**
| Error | Cause | Fix |
|-------|-------|-----|
| `No tab with id X` | Tab closed before API call | Guard with try/catch |
| `tab.url` is `undefined` | Missing `tabs` permission or `activeTab` not triggered | Add `"tabs"` to permissions for URL access |
| Excessive `onUpdated` events | Fires multiple times per navigation (loading, complete) | Filter on `changeInfo.status === 'complete'` |
| `Cannot access chrome:// URL` | Restricted URL | Skip with URL check |

**Required error handling:**
- Every `tabs.update`, `tabs.remove`, `tabs.get` call must be in a try/catch.
- Always check that the tab ID is still valid.

---

### 2.8 chrome.runtime

**Correct MV3 usage (promise-based):**

```js
// MESSAGE PASSING — service worker handler (top-level)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // CRITICAL: return true for async response
  if (message.type === 'GET_STATE') {
    handleGetState(message)
      .then((response) => sendResponse(response))
      .catch((err) => sendResponse({ error: err.message }));
    return true; // keeps the message channel open for async response
  }

  if (message.type === 'START_FOCUS') {
    handleStartFocus(message.payload)
      .then((response) => sendResponse(response))
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }
});

// SEND MESSAGE (from popup/content)
async function sendToBackground(message) {
  try {
    const response = await chrome.runtime.sendMessage(message);
    if (chrome.runtime.lastError) {
      throw new Error(chrome.runtime.lastError.message);
    }
    return response;
  } catch (err) {
    // "Could not establish connection. Receiving end does not exist."
    // Means the service worker is not running — it will restart on next message.
    if (err.message.includes('Receiving end does not exist')) {
      console.warn('[runtime.sendMessage] SW not ready. Retrying...');
      await delay(100);
      return sendToBackground(message);
    }
    throw err;
  }
}

// INSTALL/UPDATE HANDLER (top-level)
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    handleFirstInstall();
  } else if (details.reason === 'update') {
    handleExtensionUpdate(details.previousVersion);
  }
});

// STARTUP HANDLER (top-level)
chrome.runtime.onStartup.addListener(() => {
  restoreState();
});
```

**Common errors:**
| Error | Cause | Fix |
|-------|-------|-----|
| `Could not establish connection` | SW is inactive; no listener registered | Retry with backoff; SW auto-restarts |
| `The message port closed before a response was received` | `sendResponse` not called, or `return true` missing | Always `return true` from async `onMessage` handlers |
| `Extension context invalidated` | Extension was updated/reloaded while page open | Catch in content scripts; prompt user to reload page |
| `runtime.lastError` not checked | Unchecked callback error | Check after every callback-style API call |

**Required error handling:**
- Always `return true` from `onMessage` listeners that respond asynchronously.
- Always check for `chrome.runtime.lastError` in callback-style calls.
- Handle `Extension context invalidated` in content scripts.

---

### 2.9 chrome.notifications

**Correct MV3 usage (promise-based):**

```js
async function showNotification(id, options) {
  try {
    const notificationId = await chrome.notifications.create(id, {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('src/assets/icons/icon-128.png'),
      title: options.title,
      message: options.message,
      priority: options.priority || 0,
    });
    return notificationId;
  } catch (err) {
    console.error('[notifications.create] Failed:', err.message);
    // Notification permission may have been revoked by user at OS level
    return null;
  }
}

async function clearNotification(id) {
  try {
    const wasCleared = await chrome.notifications.clear(id);
    return wasCleared;
  } catch (err) {
    console.warn('[notifications.clear] Failed:', err.message);
    return false;
  }
}
```

**Common errors:**
| Error | Cause | Fix |
|-------|-------|-----|
| Notification not showing | OS notifications disabled for Chrome | Cannot fix programmatically; degrade gracefully |
| `iconUrl` invalid | Relative path or missing file | Use `chrome.runtime.getURL()` for extension-relative paths |
| `type` missing or wrong | Required field | Always include `type: 'basic'` (or `image`, `list`, `progress`) |
| Duplicate IDs overwrite | Using same ID | Use unique IDs or accept overwrite behavior |

**Required error handling:**
- Never assume notifications will display; OS-level settings can block them.
- Always provide fallback behavior (e.g., badge text on extension icon).

---

### 2.10 chrome.offscreen

**Correct MV3 usage (promise-based):**

```js
const OFFSCREEN_DOCUMENT_PATH = 'src/offscreen/offscreen.html';

async function ensureOffscreenDocument() {
  try {
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT'],
      documentUrls: [chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)],
    });

    if (existingContexts.length > 0) {
      return; // already exists
    }

    await chrome.offscreen.createDocument({
      url: OFFSCREEN_DOCUMENT_PATH,
      reasons: ['AUDIO_PLAYBACK'], // or BLOBS, DOM_PARSER, etc.
      justification: 'Playing focus timer sounds',
    });
  } catch (err) {
    // "Only a single offscreen document may be created"
    if (err.message.includes('single offscreen')) {
      console.warn('[offscreen] Document already exists');
      return;
    }
    console.error('[offscreen.createDocument] Failed:', err.message);
    throw err;
  }
}

async function closeOffscreenDocument() {
  try {
    await chrome.offscreen.closeDocument();
  } catch (err) {
    // May fail if no document exists
    if (!err.message.includes('No current offscreen')) {
      console.error('[offscreen.closeDocument] Failed:', err.message);
    }
  }
}
```

**Common errors:**
| Error | Cause | Fix |
|-------|-------|-----|
| `Only a single offscreen document may be created` | Called `createDocument` when one already exists | Check with `runtime.getContexts` first |
| `No current offscreen document` | Called `closeDocument` when none exists | Catch and ignore |
| Wrong `reasons` | Using a reason not matching actual use | Use correct `OffscreenReason` enum value |
| Document auto-closed | Chrome closes idle offscreen documents after ~30s of inactivity | Re-create when needed; keep alive with periodic messages |

**Required error handling:**
- Always check existence before creating.
- Always re-create when needed (offscreen documents can be closed by Chrome).
- Communicate via `runtime.sendMessage` to/from the offscreen document.

---

### 2.11 chrome.action

**Correct MV3 usage (promise-based):**

```js
// SET BADGE
async function setBadge(text, color = '#FF0000') {
  try {
    await chrome.action.setBadgeText({ text: String(text) });
    await chrome.action.setBadgeBackgroundColor({ color });
  } catch (err) {
    console.error('[action.setBadge] Failed:', err.message);
  }
}

// CLEAR BADGE
async function clearBadge() {
  try {
    await chrome.action.setBadgeText({ text: '' });
  } catch (err) {
    console.error('[action.clearBadge] Failed:', err.message);
  }
}

// SET ICON
async function setIcon(path) {
  try {
    await chrome.action.setIcon({ path });
  } catch (err) {
    console.error('[action.setIcon] Failed:', err.message);
  }
}

// POPUP CLICK HANDLER (top-level in service worker if no popup set)
chrome.action.onClicked.addListener((tab) => {
  // Only fires if no popup is set
  handleActionClick(tab);
});
```

**Common errors:**
| Error | Cause | Fix |
|-------|-------|-----|
| `onClicked` never fires | A popup is defined in manifest | `onClicked` only fires when no `default_popup` is set |
| Badge text truncated | Text longer than 4 chars | Keep badge text to 3-4 characters max |
| Icon not showing | Wrong path or size | Provide 16, 32, 48, 128 px icons |

---

### 2.12 chrome.identity (Pro Feature)

**Correct MV3 usage (promise-based):**

```js
async function getAuthToken(interactive = true) {
  try {
    const token = await chrome.identity.getAuthToken({ interactive });
    return token;
  } catch (err) {
    if (err.message.includes('The user did not approve')) {
      console.warn('[identity] User declined auth');
      return null;
    }
    if (err.message.includes('OAuth2 not granted')) {
      console.warn('[identity] Missing OAuth2 scope');
      return null;
    }
    console.error('[identity.getAuthToken] Failed:', err.message);
    throw err;
  }
}

async function removeCachedToken(token) {
  try {
    await chrome.identity.removeCachedAuthToken({ token });
  } catch (err) {
    console.warn('[identity.removeCachedAuthToken] Failed:', err.message);
  }
}
```

**Common errors:**
| Error | Cause | Fix |
|-------|-------|-----|
| `The user did not approve access` | User clicked "Cancel" on OAuth consent | Handle gracefully; show message in UI |
| `OAuth2 not granted or revoked` | Token expired or user revoked access | Remove cached token; re-request |
| `Cannot use identity.getAuthToken in incognito` | Incognito context | Check for incognito before calling |
| `invalid client_id` | Wrong key in manifest `oauth2` section | Verify `client_id` in manifest.json |

**Required error handling:**
- Always handle user-declined scenarios.
- Implement token refresh: remove cached token + re-request.
- Guard against incognito mode.

---

### 2.13 chrome.idle (Optional)

**Correct MV3 usage (promise-based):**

```js
// SET DETECTION INTERVAL (seconds)
chrome.idle.setDetectionInterval(300); // 5 minutes

// LISTENER (top-level in service worker)
chrome.idle.onStateChanged.addListener((newState) => {
  // newState: 'active' | 'idle' | 'locked'
  switch (newState) {
    case 'idle':
      handleUserIdle();
      break;
    case 'locked':
      handleScreenLocked();
      break;
    case 'active':
      handleUserReturned();
      break;
  }
});

// QUERY STATE
async function queryIdleState(detectionIntervalInSeconds) {
  try {
    const state = await chrome.idle.queryState(detectionIntervalInSeconds);
    return state;
  } catch (err) {
    console.error('[idle.queryState] Failed:', err.message);
    return 'active'; // default assumption
  }
}
```

**Common errors:**
| Error | Cause | Fix |
|-------|-------|-----|
| Detection interval too short | Minimum is 15 seconds | Use `>= 15` |
| `onStateChanged` missed | Service worker was terminated | Register at top level; re-query state on SW startup |
| State flapping | User briefly active then idle | Debounce state transitions in handler |

---

## 3. Async/Await Error Handling Patterns

### 3.1 Standard Try/Catch Wrapper for Chrome API Calls

```js
/**
 * Wraps a Chrome API call with standardized error handling.
 * @param {string} apiName - Name for logging (e.g., 'storage.local.get')
 * @param {() => Promise<T>} fn - The async Chrome API call
 * @param {T} [fallback] - Fallback value on error
 * @returns {Promise<T>}
 * @template T
 */
async function chromeApiCall(apiName, fn, fallback = undefined) {
  try {
    const result = await fn();
    return result;
  } catch (err) {
    console.error(`[${apiName}] Error:`, err.message);

    // Check for extension context invalidation
    if (err.message.includes('Extension context invalidated')) {
      throw new ExtensionInvalidatedError(apiName);
    }

    if (fallback !== undefined) {
      return fallback;
    }
    throw err;
  }
}

// Usage
const settings = await chromeApiCall(
  'storage.local.get',
  () => chrome.storage.local.get('settings'),
  { settings: DEFAULT_SETTINGS }
);
```

### 3.2 Retry Wrapper with Exponential Backoff

```js
/**
 * Retries an async operation with exponential backoff.
 * @param {() => Promise<T>} fn - The async function to retry
 * @param {object} options
 * @param {number} options.maxRetries - Maximum retry attempts (default: 3)
 * @param {number} options.baseDelay - Base delay in ms (default: 100)
 * @param {(err: Error) => boolean} options.shouldRetry - Predicate for retryable errors
 * @returns {Promise<T>}
 * @template T
 */
async function withRetry(fn, {
  maxRetries = 3,
  baseDelay = 100,
  shouldRetry = () => true,
} = {}) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (attempt === maxRetries || !shouldRetry(err)) {
        throw err;
      }

      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 50;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Usage
const response = await withRetry(
  () => chrome.runtime.sendMessage({ type: 'GET_STATE' }),
  {
    maxRetries: 3,
    baseDelay: 200,
    shouldRetry: (err) => err.message.includes('Receiving end does not exist'),
  }
);
```

### 3.3 Promise.allSettled Pattern for Parallel Operations

```js
/**
 * Runs multiple Chrome API calls in parallel, collecting all results.
 * Never rejects — returns results with status for each operation.
 */
async function parallelChromeOps(operations) {
  const results = await Promise.allSettled(
    operations.map(({ name, fn }) =>
      fn().then(
        (value) => ({ name, value }),
        (error) => { throw { name, error }; }
      )
    )
  );

  const successes = [];
  const failures = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      successes.push(result.value);
    } else {
      failures.push(result.reason);
      console.error(`[parallel] ${result.reason.name} failed:`, result.reason.error.message);
    }
  }

  return { successes, failures };
}

// Usage — loading multiple storage keys in parallel
const { successes, failures } = await parallelChromeOps([
  { name: 'settings', fn: () => chrome.storage.local.get('settings') },
  { name: 'stats', fn: () => chrome.storage.local.get('stats') },
  { name: 'subscription', fn: () => chrome.storage.local.get('subscription') },
  { name: 'alarms', fn: () => chrome.alarms.getAll() },
]);

if (failures.length > 0) {
  console.warn(`[init] ${failures.length} operations failed during startup`);
}
```

### 3.4 Timeout Wrapper for Long-Running Operations

```js
/**
 * Wraps a promise with a timeout. Rejects if the operation takes too long.
 * @param {Promise<T>} promise - The promise to wrap
 * @param {number} ms - Timeout in milliseconds
 * @param {string} [label] - Label for error message
 * @returns {Promise<T>}
 * @template T
 */
function withTimeout(promise, ms, label = 'Operation') {
  let timeoutId;

  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
  });

  return Promise.race([promise, timeout]).finally(() => {
    clearTimeout(timeoutId);
  });
}

// Usage
try {
  const result = await withTimeout(
    chrome.storage.local.get(null), // get all data
    5000,
    'storage.local.get(all)'
  );
} catch (err) {
  if (err.message.includes('timed out')) {
    console.error('Storage read timed out — possible corruption');
  }
}
```

### 3.5 Global Unhandled Rejection Handler for Service Worker

```js
// Place at the TOP of the service worker entry point (background.js)

self.addEventListener('unhandledrejection', (event) => {
  console.error(
    '[SW] Unhandled promise rejection:',
    event.reason?.message || event.reason,
    event.reason?.stack || ''
  );

  // Log to persistent storage for later debugging
  logError({
    type: 'unhandled_rejection',
    message: event.reason?.message || String(event.reason),
    stack: event.reason?.stack || '',
    timestamp: Date.now(),
  }).catch(() => {
    // If even logging fails, there is nothing more we can do
  });

  // Prevent the default "Unhandled promise rejection" browser console error
  // only if we have handled it ourselves
  event.preventDefault();
});

self.addEventListener('error', (event) => {
  console.error(
    '[SW] Uncaught error:',
    event.message,
    `at ${event.filename}:${event.lineno}:${event.colno}`
  );

  logError({
    type: 'uncaught_error',
    message: event.message,
    filename: event.filename,
    line: event.lineno,
    col: event.colno,
    timestamp: Date.now(),
  }).catch(() => {});
});

/**
 * Persists error to storage.local for debugging.
 * Keeps a rolling buffer of the most recent 50 errors.
 */
async function logError(errorData) {
  try {
    const { errorLog = [] } = await chrome.storage.local.get('errorLog');
    errorLog.push(errorData);

    // Keep only the last 50 errors
    if (errorLog.length > 50) {
      errorLog.splice(0, errorLog.length - 50);
    }

    await chrome.storage.local.set({ errorLog });
  } catch (_) {
    // Silently fail — cannot log the failure of a logger
  }
}
```

### 3.6 Sequential Async Operation Queue

```js
/**
 * Ensures async operations on a shared resource run sequentially.
 * Prevents race conditions when multiple callers write to the same storage key.
 */
class AsyncQueue {
  /** @type {Promise<void>} */
  #queue = Promise.resolve();

  /**
   * @param {() => Promise<T>} fn
   * @returns {Promise<T>}
   * @template T
   */
  enqueue(fn) {
    return new Promise((resolve, reject) => {
      this.#queue = this.#queue
        .then(() => fn())
        .then(resolve)
        .catch(reject);
    });
  }
}

// Usage — serialized writes to storage
const storageWriteQueue = new AsyncQueue();

async function safeUpdateSettings(patch) {
  return storageWriteQueue.enqueue(async () => {
    const { settings = {} } = await chrome.storage.local.get('settings');
    const updated = { ...settings, ...patch };
    await chrome.storage.local.set({ settings: updated });
    return updated;
  });
}
```

---

## 4. Service Worker Restriction Checklist

### 4.1 Summary of Forbidden APIs in a Service Worker

| Category | Forbidden | Alternative |
|----------|-----------|-------------|
| DOM | `document`, `window`, `HTMLElement`, any DOM API | Use offscreen document for DOM parsing |
| Dialog | `alert()`, `confirm()`, `prompt()` | `chrome.notifications.create()` |
| Web Storage | `localStorage`, `sessionStorage` | `chrome.storage.local`, `chrome.storage.session` |
| XHR | `XMLHttpRequest` | `fetch()` |
| Animation | `requestAnimationFrame` | `chrome.alarms` or `setTimeout` |
| Media | `Audio()`, `new Audio()` | Offscreen document with `AUDIO_PLAYBACK` reason |
| Canvas | `CanvasRenderingContext2D`, `WebGLRenderingContext` | Offscreen document |
| Clipboard | `document.execCommand('copy')` | Offscreen document or `navigator.clipboard` |
| CSS | `getComputedStyle()`, `matchMedia()` | Not available in SW |
| History | `history.pushState()`, `history.back()` | `chrome.tabs.update()` |
| Location | `window.location` | `self.location` (read-only) |
| Sync XHR | Synchronous XHR | `fetch()` (always async) |

### 4.2 Service Worker Termination & Restart

**The service worker WILL be terminated by Chrome when:**
1. It has been idle (no events processing) for approximately 30 seconds.
2. A single request/event handler takes longer than 5 minutes.
3. The extension is updated.
4. The browser is restarted.
5. Chrome decides to reclaim memory.

**State management rules:**
```js
// BAD: State lost on termination
let focusSessionActive = false;
let currentTimer = 0;
let blockedSites = [];

// GOOD: State backed by storage
async function getState() {
  const { state = {} } = await chrome.storage.session.get('state');
  return state;
}

async function setState(patch) {
  const current = await getState();
  const updated = { ...current, ...patch };
  await chrome.storage.session.set({ state: updated });
  return updated;
}

// GOOD: Restore state on service worker startup
async function initServiceWorker() {
  const state = await getState();
  if (state.focusSessionActive) {
    // Re-register alarms, re-apply block rules, etc.
    await restoreFocusSession(state);
  }
}

// Called at top level — runs every time SW starts
initServiceWorker();
```

### 4.3 The 15 Things That Will Crash or Break a Service Worker

1. **Referencing `document`** — `ReferenceError: document is not defined`. There is no DOM in a service worker.

2. **Referencing `window`** — `ReferenceError: window is not defined`. Use `self` or `globalThis` instead.

3. **Using `alert()`, `confirm()`, or `prompt()`** — `ReferenceError`. Use `chrome.notifications` or message the popup.

4. **Using `localStorage` or `sessionStorage`** — `ReferenceError`. Use `chrome.storage.local` / `chrome.storage.session`.

5. **Using `new XMLHttpRequest()`** — `ReferenceError`. Use `fetch()`.

6. **Using `new Audio()` or `Audio` constructor** — `ReferenceError`. Use an offscreen document for audio playback.

7. **Setting a `setTimeout`/`setInterval` longer than 30 seconds and expecting it to fire** — The service worker can be terminated before the timer fires. Use `chrome.alarms` for anything > 30 seconds.

8. **Storing critical state in global variables without persisting to storage** — On termination, all in-memory state is lost. Every piece of state the extension depends on must be persisted.

9. **Not registering event listeners at the top level** — Chrome event listeners (e.g., `chrome.runtime.onMessage.addListener`) must be registered synchronously at the top level of the service worker. If registered inside an async callback, `setTimeout`, or conditional block, they may not be re-registered when the SW restarts.

10. **Keeping a port open without activity** — `chrome.runtime.connect()` ports keep the SW alive, but Chrome will terminate the SW if a port is open with no messages for 5+ minutes (as of Chrome 118). Send periodic keepalive messages.

11. **Importing scripts that reference DOM APIs** — If any imported module (including third-party libraries) references `document`, `window`, `HTMLElement`, etc., the service worker will crash on import. Audit all dependencies.

12. **Using `eval()` or `new Function()`** — Blocked by Chrome extension CSP. Will throw a `EvalError` at runtime even if ESLint does not catch it.

13. **Exceeding the 5-minute event handler limit** — If a single event handler runs for more than 5 minutes, Chrome terminates the service worker. Break long operations into chunks with alarms.

14. **Not handling `runtime.onInstalled` for migration** — After an extension update, the service worker restarts. If storage schema changed, unhandled data format mismatches will cause cascading errors.

15. **Synchronous top-level `await` blocking event registration** — In some bundler configurations, a top-level `await` can delay the execution of `addListener` calls below it. Chrome may dispatch events before listeners are registered. Always register all event listeners synchronously before any `await`.

### 4.4 Service Worker Lifecycle Verification Checklist

```
[ ] All Chrome event listeners registered at top level (not in async/conditional)
[ ] No DOM APIs referenced in SW or its imported modules
[ ] No localStorage/sessionStorage usage
[ ] No XMLHttpRequest usage
[ ] No alert/confirm/prompt usage
[ ] No Audio constructor usage
[ ] All critical state persisted to chrome.storage
[ ] State restoration logic runs on every SW startup
[ ] All setTimeout/setInterval under 30 seconds (alarms for longer)
[ ] Long operations chunked to stay under 5-minute limit
[ ] Alarms used for periodic tasks (min interval: 1 minute)
[ ] Port connections send keepalive or close when idle
[ ] Unhandled rejection handler registered
[ ] onInstalled handler registered for migration
[ ] No eval(), new Function(), or dynamic code generation
```

---

## 5. Content Script Isolation Rules

### 5.1 Isolated World Restrictions

Content scripts run in an **isolated world**: they share the DOM with the page but have a separate JavaScript execution context.

**What content scripts CAN access:**
- The full DOM of the page (read and write)
- A limited set of Chrome APIs: `runtime`, `i18n`, `storage`
- `fetch()` with the extension's permissions (CORS bypass)
- `window` and `document` (the page's DOM, NOT the page's JS context)

**What content scripts CANNOT access:**
- Variables or functions defined by the page's scripts
- Page's `window` properties added by JS (only native DOM properties)
- Most Chrome APIs (no `tabs`, `alarms`, `declarativeNetRequest`, etc.)
- `chrome.runtime.getBackgroundPage()` (MV2 only; does not exist in MV3)

**What the PAGE cannot access:**
- The content script's variables, functions, or execution context
- The content script's `chrome` object
- Messages sent between content script and service worker

### 5.2 Message Passing Patterns

#### Content Script to Service Worker

```js
// content-script.js
async function requestFromBackground(type, payload = {}) {
  try {
    const response = await chrome.runtime.sendMessage({ type, payload });
    if (response?.error) {
      throw new Error(response.error);
    }
    return response;
  } catch (err) {
    if (err.message.includes('Extension context invalidated')) {
      // Extension was updated or reloaded while page was open
      handleExtensionInvalidated();
      return null;
    }
    if (err.message.includes('Receiving end does not exist')) {
      // Service worker not running — retry once
      await new Promise((r) => setTimeout(r, 500));
      return chrome.runtime.sendMessage({ type, payload });
    }
    throw err;
  }
}
```

#### Service Worker to Content Script

```js
// background.js
async function sendToContentScript(tabId, message) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, message);
    return response;
  } catch (err) {
    if (err.message.includes('Could not establish connection')) {
      // Content script not injected in this tab
      console.warn(`[sendToContent] No content script in tab ${tabId}`);
      return null;
    }
    throw err;
  }
}
```

#### Content Script to Popup (via Service Worker relay)

```js
// Content script sends to SW, SW relays to popup via storage or messaging.
// Direct content-to-popup messaging is not possible.

// content-script.js
chrome.runtime.sendMessage({ type: 'BLOCKED_SITE_VISITED', url: location.href });

// background.js (relay)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'BLOCKED_SITE_VISITED') {
    // Update session storage; popup reads on open
    chrome.storage.session.set({ lastBlockedUrl: msg.url });
    sendResponse({ ok: true });
  }
});
```

### 5.3 Safe DOM Manipulation Rules

```js
// RULE 1: Never use innerHTML for user-generated or dynamic content
// BAD
element.innerHTML = `<div>${userInput}</div>`;

// GOOD
const div = document.createElement('div');
div.textContent = userInput;
element.appendChild(div);

// RULE 2: Use textContent, not innerText (avoids layout thrashing)
// BAD (triggers layout recalc)
const text = element.innerText;
// GOOD
const text = element.textContent;

// RULE 3: Batch DOM mutations
// BAD — causes N reflows
for (const item of items) {
  const el = document.createElement('div');
  el.textContent = item;
  container.appendChild(el); // reflow on each append
}

// GOOD — single reflow
const fragment = document.createDocumentFragment();
for (const item of items) {
  const el = document.createElement('div');
  el.textContent = item;
  fragment.appendChild(el);
}
container.appendChild(fragment); // single reflow

// RULE 4: Scope all selectors to avoid conflicts with page
// BAD
document.querySelector('.timer');
// GOOD — use extension-specific prefix
document.querySelector('.fm-blocker-timer');

// RULE 5: Use Shadow DOM for injected UI
function createIsolatedUI() {
  const host = document.createElement('div');
  host.id = 'focus-mode-blocker-root';
  const shadow = host.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = `
    .fm-container { /* styles isolated from page */ }
  `;
  shadow.appendChild(style);

  const container = document.createElement('div');
  container.className = 'fm-container';
  shadow.appendChild(container);

  document.body.appendChild(host);
  return container;
}
```

### 5.4 Avoiding Conflicts with Page Scripts

```js
// RULE 1: Never pollute the global scope
// BAD
function blockPage() { /* ... */ }
window.blockPage = blockPage;

// GOOD — use IIFE or ES module scope
(() => {
  function blockPage() { /* ... */ }
  // Only accessible within this scope
})();

// RULE 2: Never modify native prototypes
// BAD
Array.prototype.customMethod = function() {};

// GOOD
function customArrayMethod(arr) { /* ... */ }

// RULE 3: Do not override page event listeners
// BAD
window.addEventListener('beforeunload', (e) => {
  e.preventDefault(); // Interferes with the page
});

// GOOD — use a unique, removable listener
const fmBlockerBeforeUnload = (e) => { /* ... */ };
window.addEventListener('beforeunload', fmBlockerBeforeUnload);
// Clean up when no longer needed
window.removeEventListener('beforeunload', fmBlockerBeforeUnload);

// RULE 4: Namespace all CSS classes injected into the page
// BAD: .overlay, .timer, .button
// GOOD: .fm-blocker-overlay, .fm-blocker-timer, .fm-blocker-button

// RULE 5: Do not use CSS !important unless absolutely necessary
// If you must override page styles, use Shadow DOM instead

// RULE 6: Avoid MutationObserver on the entire document body
// BAD — performance killer
new MutationObserver(callback).observe(document.body, {
  childList: true, subtree: true
});

// GOOD — observe a specific subtree
new MutationObserver(callback).observe(
  document.querySelector('#specific-container'),
  { childList: true }
);
```

### 5.5 Performance Rules for Content Scripts

1. **Minimize injected code** — Content scripts run on every matched page. Keep them small.

2. **Defer non-critical work** — Use `requestIdleCallback` or `setTimeout(fn, 0)` for non-blocking operations.

3. **Debounce DOM observers** — If using `MutationObserver`, debounce the callback:
   ```js
   let debounceTimer;
   const observer = new MutationObserver(() => {
     clearTimeout(debounceTimer);
     debounceTimer = setTimeout(handleMutations, 200);
   });
   ```

4. **Clean up on page unload** — Disconnect observers, remove listeners, cancel timers:
   ```js
   window.addEventListener('unload', () => {
     observer.disconnect();
     clearTimeout(debounceTimer);
   });
   ```

5. **Avoid synchronous storage reads in hot paths** — Cache values from `chrome.storage` at injection time; listen for changes with `chrome.storage.onChanged`.

6. **Limit message frequency** — Throttle messages to the service worker:
   ```js
   let lastMessageTime = 0;
   function throttledSendMessage(msg) {
     const now = Date.now();
     if (now - lastMessageTime < 1000) {
       return; // max 1 message per second
     }
     lastMessageTime = now;
     chrome.runtime.sendMessage(msg);
   }
   ```

---

## 6. Event Listener Best Practices

### 6.1 Registration Patterns for Chrome Events (Service Worker)

**CRITICAL RULE:** All Chrome event listeners MUST be registered synchronously at the top level of the service worker script. They must NOT be registered inside async functions, conditionals, timeouts, or callbacks.

```js
// background.js — TOP LEVEL (correct)

// 1. Register ALL event listeners first, synchronously
chrome.runtime.onInstalled.addListener(handleInstalled);
chrome.runtime.onStartup.addListener(handleStartup);
chrome.runtime.onMessage.addListener(handleMessage);
chrome.alarms.onAlarm.addListener(handleAlarm);
chrome.tabs.onUpdated.addListener(handleTabUpdated);
chrome.tabs.onRemoved.addListener(handleTabRemoved);
chrome.idle.onStateChanged.addListener(handleIdleStateChanged);
chrome.storage.onChanged.addListener(handleStorageChanged);
chrome.action.onClicked.addListener(handleActionClicked);

// 2. THEN do async initialization
initServiceWorker();

async function initServiceWorker() {
  const state = await chrome.storage.session.get('state');
  // restore state, set up alarms, etc.
}

// BAD — listener registered inside async function
async function badInit() {
  const settings = await chrome.storage.local.get('settings');
  if (settings.enableIdleDetection) {
    // This may NOT be registered if SW restarts and this async block
    // hasn't finished before an idle event fires
    chrome.idle.onStateChanged.addListener(handleIdleStateChanged);
  }
}
```

**Why this matters:** When Chrome restarts a terminated service worker to dispatch an event, it runs the top-level code. If a listener is not synchronously registered at the top level, the event is dropped.

### 6.2 Cleanup Patterns for Popup / Options Page

Popup and options pages have a normal page lifecycle. They are created when opened and destroyed when closed.

```js
// popup.js

class PopupController {
  #abortController = new AbortController();
  #storageListener = null;
  #messagePort = null;

  init() {
    // Use AbortController for DOM event cleanup
    const { signal } = this.#abortController;

    document.getElementById('start-btn').addEventListener('click', this.#handleStart, { signal });
    document.getElementById('stop-btn').addEventListener('click', this.#handleStop, { signal });
    document.getElementById('settings-btn').addEventListener('click', this.#handleSettings, { signal });

    // Chrome API listener (cannot use AbortController)
    this.#storageListener = (changes, area) => {
      if (area === 'session' && changes.state) {
        this.#updateUI(changes.state.newValue);
      }
    };
    chrome.storage.onChanged.addListener(this.#storageListener);

    // Clean up when popup closes
    window.addEventListener('unload', () => this.destroy(), { signal });
  }

  destroy() {
    // 1. Abort all DOM event listeners at once
    this.#abortController.abort();

    // 2. Remove Chrome API listeners manually
    if (this.#storageListener) {
      chrome.storage.onChanged.removeListener(this.#storageListener);
      this.#storageListener = null;
    }

    // 3. Disconnect any open ports
    if (this.#messagePort) {
      this.#messagePort.disconnect();
      this.#messagePort = null;
    }
  }

  #handleStart = () => { /* ... */ };
  #handleStop = () => { /* ... */ };
  #handleSettings = () => { /* ... */ };
  #updateUI(state) { /* ... */ }
}

const popup = new PopupController();
popup.init();
```

### 6.3 Avoiding Duplicate Registration

```js
// PROBLEM: If background.js is re-imported or re-evaluated, listeners
// could be registered multiple times.

// SOLUTION 1: Chrome event listeners ARE idempotent when the same function
// reference is passed. The following is safe:
function handleMessage(msg, sender, sendResponse) { /* ... */ }
chrome.runtime.onMessage.addListener(handleMessage);
// Calling addListener with the SAME function reference again is a no-op.

// SOLUTION 2: For dynamic listeners, track registration state in session storage
async function registerConditionalListeners() {
  const { listenersRegistered } = await chrome.storage.session.get('listenersRegistered');
  if (listenersRegistered) {
    return; // already registered in this session
  }

  // Register dynamic listeners...
  await chrome.storage.session.set({ listenersRegistered: true });
}

// SOLUTION 3: For content scripts — guard against double injection
if (window.__focusModeBlockerInjected) {
  // Script already injected — skip
} else {
  window.__focusModeBlockerInjected = true;
  initContentScript();
}
```

### 6.4 Handling Listeners in Non-Persistent Service Worker Context

```js
// PATTERN: Event-driven architecture with state restoration

// All handlers must be resilient to cold starts.
// They cannot assume any previous handler has run.

async function handleAlarm(alarm) {
  // WRONG: Relying on in-memory state
  // if (timerState.isRunning) { ... }

  // RIGHT: Read state from storage
  const { state = {} } = await chrome.storage.session.get('state');

  if (alarm.name === 'focus-timer-tick' && state.focusSessionActive) {
    const elapsed = Date.now() - state.sessionStartTime;
    const remaining = state.sessionDuration - elapsed;

    if (remaining <= 0) {
      await endFocusSession();
    } else {
      await chrome.action.setBadgeText({
        text: formatMinutes(remaining),
      });
    }
  }
}

// PATTERN: Idempotent event handlers
// Every handler should produce the same result regardless of
// how many times it is called with the same input.

async function handleInstalled(details) {
  if (details.reason === 'install') {
    // Idempotent: setting default values only if not present
    const { settings } = await chrome.storage.local.get('settings');
    if (!settings) {
      await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
    }
    // Idempotent: creating alarm only if not present
    const existing = await chrome.alarms.get('stats-flush');
    if (!existing) {
      await chrome.alarms.create('stats-flush', { periodInMinutes: 5 });
    }
  }
}
```

### 6.5 Long-Lived Connections (Ports)

```js
// Service worker: handle port connections at top level
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'popup') {
    handlePopupConnection(port);
  } else if (port.name === 'timer-updates') {
    handleTimerConnection(port);
  }
});

function handlePopupConnection(port) {
  // Send current state immediately
  getState().then((state) => {
    port.postMessage({ type: 'STATE_UPDATE', state });
  });

  port.onMessage.addListener((msg) => {
    // Handle messages from popup
  });

  port.onDisconnect.addListener(() => {
    // Popup closed — clean up
    if (chrome.runtime.lastError) {
      console.warn('[port] Popup disconnected with error:', chrome.runtime.lastError.message);
    }
  });
}

// Popup: connect with automatic reconnection
function connectToBackground() {
  const port = chrome.runtime.connect({ name: 'popup' });

  port.onMessage.addListener((msg) => {
    if (msg.type === 'STATE_UPDATE') {
      updateUI(msg.state);
    }
  });

  port.onDisconnect.addListener(() => {
    // Port disconnected — could be SW restart
    if (chrome.runtime.lastError) {
      console.warn('[popup] Port disconnected:', chrome.runtime.lastError.message);
    }
    // Reconnect after a delay (only if popup is still open)
    setTimeout(connectToBackground, 1000);
  });

  return port;
}
```

---

## 7. Type Safety Without TypeScript

### 7.1 JSDoc Patterns for Key Interfaces

```js
// ============================================================
// types.js — Central type definitions (JSDoc only, no runtime)
// ============================================================

/**
 * @typedef {'free' | 'pro' | 'lifetime'} SubscriptionTier
 */

/**
 * @typedef {Object} Subscription
 * @property {SubscriptionTier} tier
 * @property {string|null} purchaseDate - ISO 8601 date string
 * @property {string|null} expiryDate - ISO 8601 date string, null for lifetime
 * @property {boolean} isActive
 * @property {string|null} receiptToken - Purchase validation token
 */

/**
 * @typedef {Object} BlockedSite
 * @property {string} domain - e.g., "reddit.com"
 * @property {string} [displayName] - Optional display label
 * @property {boolean} isActive - Whether currently blocked
 * @property {number} addedAt - Unix timestamp (ms)
 * @property {'user' | 'ai-suggested'} source
 */

/**
 * @typedef {Object} Settings
 * @property {BlockedSite[]} blockedSites
 * @property {number} defaultFocusDuration - Duration in minutes
 * @property {boolean} strictMode - Prevent unblocking during focus
 * @property {boolean} soundEnabled
 * @property {string} soundId - ID of selected sound
 * @property {number} soundVolume - 0.0 to 1.0
 * @property {boolean} notificationsEnabled
 * @property {boolean} nuclearModeAvailable
 * @property {boolean} idleDetectionEnabled
 * @property {number} idleThresholdMinutes
 * @property {SubscriptionTier} tier
 * @property {boolean} onboardingComplete
 * @property {number} schemaVersion - For migration
 */

/**
 * @typedef {'idle' | 'focus' | 'break' | 'nuclear'} SessionStatus
 */

/**
 * @typedef {Object} FocusSession
 * @property {string} id - UUID
 * @property {SessionStatus} status
 * @property {number} startTime - Unix timestamp (ms)
 * @property {number} duration - Planned duration in ms
 * @property {number} elapsed - Elapsed time in ms (updated periodically)
 * @property {number} [endTime] - Unix timestamp (ms), set when session ends
 * @property {string[]} blockedDomains - Domains blocked during this session
 * @property {boolean} completed - Whether the session ran to completion
 * @property {number} [pausedAt] - Unix timestamp when paused
 * @property {number} totalPausedTime - Total ms spent paused
 */

/**
 * @typedef {Object} DailyStats
 * @property {string} date - ISO date string (YYYY-MM-DD)
 * @property {number} totalFocusTime - Total focus time in ms
 * @property {number} sessionsCompleted
 * @property {number} sessionsAbandoned
 * @property {number} sitesBlocked - Number of block events
 * @property {string[]} topBlockedDomains - Top 5 blocked domains
 */

/**
 * @typedef {Object} Stats
 * @property {DailyStats[]} daily - Last 90 days
 * @property {number} totalLifetimeFocusTime - Total ms across all time
 * @property {number} totalLifetimeSessions
 * @property {number} currentStreak - Consecutive days with >= 1 session
 * @property {number} longestStreak
 * @property {number} level - Gamification level
 * @property {number} xp - Experience points
 */

/**
 * @typedef {Object} GamificationState
 * @property {number} level
 * @property {number} xp
 * @property {number} xpToNextLevel
 * @property {string[]} badges - Array of badge IDs earned
 * @property {number} currentStreak
 * @property {number} longestStreak
 */

/**
 * @typedef {Object} ScheduleEntry
 * @property {string} id - UUID
 * @property {string} name - e.g., "Work Hours"
 * @property {number[]} days - 0 (Sun) through 6 (Sat)
 * @property {string} startTime - "HH:MM" 24h format
 * @property {string} endTime - "HH:MM" 24h format
 * @property {string[]} blockedDomains
 * @property {boolean} isActive
 */

/**
 * @typedef {Object} NuclearConfig
 * @property {boolean} isActive
 * @property {number} [startTime] - Unix timestamp
 * @property {number} [endTime] - Unix timestamp
 * @property {string[]} blockedDomains
 * @property {boolean} cannotCancel - True during active nuclear mode
 */

/**
 * @typedef {Object} BuddyConfig
 * @property {boolean} enabled
 * @property {string} [partnerEmail]
 * @property {boolean} shareStats
 * @property {boolean} shareBlockedSites
 */

/**
 * @typedef {Object} AppState
 * @property {FocusSession|null} currentSession
 * @property {Settings} settings
 * @property {Stats} stats
 * @property {Subscription} subscription
 * @property {GamificationState} gamification
 * @property {ScheduleEntry[]} schedules
 * @property {NuclearConfig} nuclear
 * @property {BuddyConfig} buddy
 */

/**
 * @typedef {'GET_STATE' | 'START_FOCUS' | 'STOP_FOCUS' | 'PAUSE_FOCUS'
 *   | 'RESUME_FOCUS' | 'UPDATE_SETTINGS' | 'ADD_BLOCKED_SITE'
 *   | 'REMOVE_BLOCKED_SITE' | 'GET_STATS' | 'ACTIVATE_NUCLEAR'
 *   | 'CHECK_SUBSCRIPTION' | 'PLAY_SOUND' | 'STOP_SOUND'
 * } MessageType
 */

/**
 * @typedef {Object} ExtensionMessage
 * @property {MessageType} type
 * @property {Object} [payload]
 * @property {string} [requestId] - For correlating responses
 */

/**
 * @typedef {Object} ExtensionResponse
 * @property {boolean} ok
 * @property {*} [data]
 * @property {string} [error]
 * @property {string} [requestId]
 */
```

### 7.2 Runtime Type Checking Utility Functions

```js
// ============================================================
// validation.js — Runtime type checking utilities
// ============================================================

/**
 * Checks if a value is a non-null object.
 * @param {*} val
 * @returns {boolean}
 */
function isObject(val) {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

/**
 * Checks if a value is a non-empty string.
 * @param {*} val
 * @returns {boolean}
 */
function isNonEmptyString(val) {
  return typeof val === 'string' && val.length > 0;
}

/**
 * Checks if a value is a finite number within an optional range.
 * @param {*} val
 * @param {number} [min]
 * @param {number} [max]
 * @returns {boolean}
 */
function isNumber(val, min = -Infinity, max = Infinity) {
  return typeof val === 'number' && Number.isFinite(val) && val >= min && val <= max;
}

/**
 * Checks if a value is a valid Unix timestamp in milliseconds.
 * @param {*} val
 * @returns {boolean}
 */
function isTimestamp(val) {
  return isNumber(val, 0, 4102444800000); // up to year 2100
}

/**
 * Checks if a value is one of the allowed values.
 * @param {*} val
 * @param {T[]} allowed
 * @returns {val is T}
 * @template T
 */
function isOneOf(val, allowed) {
  return allowed.includes(val);
}

/**
 * Checks if a value is a valid ISO date string (YYYY-MM-DD).
 * @param {*} val
 * @returns {boolean}
 */
function isISODate(val) {
  if (typeof val !== 'string') {
    return false;
  }
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(val)) {
    return false;
  }
  const date = new Date(val);
  return !isNaN(date.getTime());
}

/**
 * Checks if a value is a valid domain string.
 * @param {*} val
 * @returns {boolean}
 */
function isValidDomain(val) {
  if (typeof val !== 'string') {
    return false;
  }
  const regex = /^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  return regex.test(val);
}

/**
 * Checks if a value is a valid time string (HH:MM, 24h).
 * @param {*} val
 * @returns {boolean}
 */
function isTimeString(val) {
  if (typeof val !== 'string') {
    return false;
  }
  const regex = /^([01]\d|2[0-3]):[0-5]\d$/;
  return regex.test(val);
}

/**
 * Validates an object against a schema definition.
 * Returns an array of error messages (empty if valid).
 *
 * @param {*} obj - Object to validate
 * @param {Object<string, SchemaField>} schema - Schema definition
 * @param {string} [prefix] - Prefix for error paths
 * @returns {string[]} Array of error messages
 *
 * @typedef {Object} SchemaField
 * @property {'string' | 'number' | 'boolean' | 'object' | 'array'} type
 * @property {boolean} [required]
 * @property {*} [default]
 * @property {(val: *) => boolean} [validate] - Custom validator
 * @property {string} [message] - Custom error message
 */
function validateSchema(obj, schema, prefix = '') {
  const errors = [];

  if (!isObject(obj)) {
    errors.push(`${prefix || 'value'} must be an object, got ${typeof obj}`);
    return errors;
  }

  for (const [key, field] of Object.entries(schema)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const val = obj[key];

    if (val === undefined || val === null) {
      if (field.required) {
        errors.push(`${path} is required`);
      }
      continue;
    }

    // Type check
    if (field.type === 'array') {
      if (!Array.isArray(val)) {
        errors.push(`${path} must be an array, got ${typeof val}`);
        continue;
      }
    } else if (field.type === 'object') {
      if (!isObject(val)) {
        errors.push(`${path} must be an object, got ${typeof val}`);
        continue;
      }
    } else if (typeof val !== field.type) {
      errors.push(`${path} must be ${field.type}, got ${typeof val}`);
      continue;
    }

    // Custom validator
    if (field.validate && !field.validate(val)) {
      errors.push(field.message || `${path} failed validation`);
    }
  }

  return errors;
}
```

### 7.3 Storage Schema Validation at Read Time

```js
// ============================================================
// schema-validator.js — Validates & repairs data read from storage
// ============================================================

/** @type {Settings} */
const DEFAULT_SETTINGS = Object.freeze({
  blockedSites: [],
  defaultFocusDuration: 25,
  strictMode: false,
  soundEnabled: true,
  soundId: 'default',
  soundVolume: 0.7,
  notificationsEnabled: true,
  nuclearModeAvailable: false,
  idleDetectionEnabled: false,
  idleThresholdMinutes: 5,
  tier: 'free',
  onboardingComplete: false,
  schemaVersion: 1,
});

/** @type {Stats} */
const DEFAULT_STATS = Object.freeze({
  daily: [],
  totalLifetimeFocusTime: 0,
  totalLifetimeSessions: 0,
  currentStreak: 0,
  longestStreak: 0,
  level: 1,
  xp: 0,
});

/** @type {Subscription} */
const DEFAULT_SUBSCRIPTION = Object.freeze({
  tier: 'free',
  purchaseDate: null,
  expiryDate: null,
  isActive: false,
  receiptToken: null,
});

/** @type {GamificationState} */
const DEFAULT_GAMIFICATION = Object.freeze({
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
  badges: [],
  currentStreak: 0,
  longestStreak: 0,
});

const SETTINGS_SCHEMA = {
  blockedSites: {
    type: 'array',
    required: true,
  },
  defaultFocusDuration: {
    type: 'number',
    required: true,
    validate: (v) => isNumber(v, 1, 480),
    message: 'defaultFocusDuration must be between 1 and 480 minutes',
  },
  strictMode: { type: 'boolean', required: true },
  soundEnabled: { type: 'boolean', required: true },
  soundId: { type: 'string', required: true },
  soundVolume: {
    type: 'number',
    required: true,
    validate: (v) => isNumber(v, 0, 1),
    message: 'soundVolume must be between 0 and 1',
  },
  notificationsEnabled: { type: 'boolean', required: true },
  tier: {
    type: 'string',
    required: true,
    validate: (v) => isOneOf(v, ['free', 'pro', 'lifetime']),
    message: 'tier must be "free", "pro", or "lifetime"',
  },
  schemaVersion: {
    type: 'number',
    required: true,
    validate: (v) => Number.isInteger(v) && v > 0,
  },
};

const BLOCKED_SITE_SCHEMA = {
  domain: {
    type: 'string',
    required: true,
    validate: isValidDomain,
    message: 'domain must be a valid domain name',
  },
  isActive: { type: 'boolean', required: true },
  addedAt: {
    type: 'number',
    required: true,
    validate: isTimestamp,
  },
  source: {
    type: 'string',
    required: true,
    validate: (v) => isOneOf(v, ['user', 'ai-suggested']),
  },
};

const SESSION_SCHEMA = {
  id: { type: 'string', required: true },
  status: {
    type: 'string',
    required: true,
    validate: (v) => isOneOf(v, ['idle', 'focus', 'break', 'nuclear']),
  },
  startTime: { type: 'number', required: true, validate: isTimestamp },
  duration: { type: 'number', required: true, validate: (v) => isNumber(v, 0) },
  elapsed: { type: 'number', required: true, validate: (v) => isNumber(v, 0) },
  blockedDomains: { type: 'array', required: true },
  completed: { type: 'boolean', required: true },
  totalPausedTime: { type: 'number', required: true, validate: (v) => isNumber(v, 0) },
};

/**
 * Reads settings from storage with validation and auto-repair.
 * Missing fields are filled from defaults. Invalid fields are corrected.
 * @returns {Promise<Settings>}
 */
async function getValidatedSettings() {
  try {
    const { settings } = await chrome.storage.local.get('settings');

    if (!isObject(settings)) {
      console.warn('[schema] Settings missing or corrupted. Using defaults.');
      const defaults = { ...DEFAULT_SETTINGS };
      await chrome.storage.local.set({ settings: defaults });
      return defaults;
    }

    // Merge with defaults for missing fields
    const merged = { ...DEFAULT_SETTINGS, ...settings };

    // Validate
    const errors = validateSchema(merged, SETTINGS_SCHEMA);
    if (errors.length > 0) {
      console.warn('[schema] Settings validation errors:', errors);

      // Repair: reset invalid fields to defaults
      for (const [key, field] of Object.entries(SETTINGS_SCHEMA)) {
        if (field.validate && !field.validate(merged[key])) {
          console.warn(`[schema] Resetting settings.${key} to default`);
          merged[key] = DEFAULT_SETTINGS[key];
        }
      }

      // Persist repaired settings
      await chrome.storage.local.set({ settings: merged });
    }

    // Validate each blocked site
    if (Array.isArray(merged.blockedSites)) {
      merged.blockedSites = merged.blockedSites.filter((site) => {
        const siteErrors = validateSchema(site, BLOCKED_SITE_SCHEMA);
        if (siteErrors.length > 0) {
          console.warn('[schema] Invalid blocked site removed:', site, siteErrors);
          return false;
        }
        return true;
      });
    }

    return merged;
  } catch (err) {
    console.error('[schema] Failed to read settings:', err.message);
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Reads and validates the current focus session from storage.
 * @returns {Promise<FocusSession|null>}
 */
async function getValidatedSession() {
  try {
    const { state = {} } = await chrome.storage.session.get('state');
    const session = state.currentSession;

    if (!session) {
      return null;
    }

    const errors = validateSchema(session, SESSION_SCHEMA);
    if (errors.length > 0) {
      console.warn('[schema] Session validation errors:', errors);

      // If session is critically broken, discard it
      if (!session.id || !session.status || !session.startTime) {
        console.error('[schema] Session unrecoverable. Discarding.');
        await chrome.storage.session.set({
          state: { ...state, currentSession: null },
        });
        return null;
      }
    }

    return session;
  } catch (err) {
    console.error('[schema] Failed to read session:', err.message);
    return null;
  }
}

/**
 * Reads and validates stats from storage.
 * @returns {Promise<Stats>}
 */
async function getValidatedStats() {
  try {
    const { stats } = await chrome.storage.local.get('stats');

    if (!isObject(stats)) {
      return { ...DEFAULT_STATS };
    }

    const merged = { ...DEFAULT_STATS, ...stats };

    // Ensure numeric fields are non-negative
    for (const key of ['totalLifetimeFocusTime', 'totalLifetimeSessions', 'currentStreak', 'longestStreak', 'level', 'xp']) {
      if (!isNumber(merged[key], 0)) {
        console.warn(`[schema] Resetting stats.${key} to default`);
        merged[key] = DEFAULT_STATS[key];
      }
    }

    // Validate daily entries
    if (Array.isArray(merged.daily)) {
      merged.daily = merged.daily.filter((entry) => {
        return isObject(entry) && isISODate(entry.date) && isNumber(entry.totalFocusTime, 0);
      });
    } else {
      merged.daily = [];
    }

    return merged;
  } catch (err) {
    console.error('[schema] Failed to read stats:', err.message);
    return { ...DEFAULT_STATS };
  }
}

/**
 * Schema migration runner. Called on extension update.
 * @param {number} fromVersion
 * @param {number} toVersion
 */
async function runMigrations(fromVersion, toVersion) {
  const migrations = {
    // Example: migration from schema v1 to v2
    2: async (settings) => {
      // Added 'idleDetectionEnabled' in v2
      if (settings.idleDetectionEnabled === undefined) {
        settings.idleDetectionEnabled = false;
      }
      if (settings.idleThresholdMinutes === undefined) {
        settings.idleThresholdMinutes = 5;
      }
      settings.schemaVersion = 2;
      return settings;
    },
    // Example: migration from schema v2 to v3
    3: async (settings) => {
      // Renamed 'strictMode' to include nuclear settings
      if (settings.nuclearModeAvailable === undefined) {
        settings.nuclearModeAvailable = false;
      }
      settings.schemaVersion = 3;
      return settings;
    },
  };

  let { settings = { ...DEFAULT_SETTINGS } } = await chrome.storage.local.get('settings');

  for (let version = fromVersion + 1; version <= toVersion; version++) {
    const migrate = migrations[version];
    if (migrate) {
      console.log(`[migration] Running migration to schema v${version}`);
      try {
        settings = await migrate(settings);
      } catch (err) {
        console.error(`[migration] v${version} failed:`, err.message);
        // Continue with remaining migrations; partial migration is
        // better than no migration
      }
    }
  }

  await chrome.storage.local.set({ settings });
  console.log(`[migration] Complete. Schema is now v${settings.schemaVersion}`);
}
```

### 7.4 Runtime Assertion Helper

```js
/**
 * Development-only assertion. Logs error but does NOT throw in production.
 * @param {boolean} condition
 * @param {string} message
 */
function assert(condition, message) {
  if (!condition) {
    const error = new Error(`Assertion failed: ${message}`);
    console.error(error.message, error.stack);

    // In development, make it loud
    // In production, log but don't crash
    if (IS_DEV) {
      throw error;
    }
  }
}

/**
 * Asserts a value is defined (not null or undefined).
 * @param {T|null|undefined} val
 * @param {string} name
 * @returns {T}
 * @template T
 */
function assertDefined(val, name) {
  assert(val !== null && val !== undefined, `${name} must be defined`);
  return /** @type {T} */ (val);
}

// Usage
const session = await getValidatedSession();
assertDefined(session, 'currentSession');
assert(session.status === 'focus', `Expected focus status, got ${session.status}`);
```

### 7.5 JSDoc Usage in Module Functions

```js
// ============================================================
// Example: timer.js module with full JSDoc annotations
// ============================================================

/**
 * @module timer
 * @description Focus timer module for the service worker.
 *   Manages focus sessions via chrome.alarms.
 */

import { getValidatedSession, getValidatedSettings } from './schema-validator.js';

const TIMER_ALARM = 'focus-timer-tick';
const TICK_INTERVAL_MINUTES = 1;

/**
 * Starts a new focus session.
 * @param {Object} options
 * @param {number} options.durationMinutes - Session duration in minutes
 * @param {string[]} options.blockedDomains - Domains to block during session
 * @returns {Promise<FocusSession>} The created session
 * @throws {Error} If a session is already active
 */
async function startFocusSession({ durationMinutes, blockedDomains }) {
  const existing = await getValidatedSession();
  if (existing && existing.status === 'focus') {
    throw new Error('A focus session is already active');
  }

  /** @type {FocusSession} */
  const session = {
    id: crypto.randomUUID(),
    status: 'focus',
    startTime: Date.now(),
    duration: durationMinutes * 60 * 1000,
    elapsed: 0,
    blockedDomains,
    completed: false,
    totalPausedTime: 0,
  };

  await chrome.storage.session.set({
    state: { currentSession: session, focusSessionActive: true },
  });

  await chrome.alarms.create(TIMER_ALARM, {
    periodInMinutes: TICK_INTERVAL_MINUTES,
  });

  return session;
}

/**
 * Handles a timer tick alarm.
 * Updates elapsed time and checks for session completion.
 * @returns {Promise<void>}
 */
async function handleTimerTick() {
  const session = await getValidatedSession();
  if (!session || session.status !== 'focus') {
    await chrome.alarms.clear(TIMER_ALARM);
    return;
  }

  const now = Date.now();
  const elapsed = now - session.startTime - session.totalPausedTime;
  session.elapsed = elapsed;

  if (elapsed >= session.duration) {
    await completeFocusSession(session);
  } else {
    // Update badge with remaining time
    const remainingMs = session.duration - elapsed;
    const remainingMin = Math.ceil(remainingMs / 60000);
    await chrome.action.setBadgeText({ text: `${remainingMin}m` });

    // Persist updated elapsed
    const { state = {} } = await chrome.storage.session.get('state');
    state.currentSession = session;
    await chrome.storage.session.set({ state });
  }
}

/**
 * Completes a focus session successfully.
 * @param {FocusSession} session
 * @returns {Promise<void>}
 */
async function completeFocusSession(session) {
  session.status = 'idle';
  session.completed = true;
  session.endTime = Date.now();

  await chrome.alarms.clear(TIMER_ALARM);
  await chrome.action.setBadgeText({ text: '' });
  await chrome.storage.session.set({
    state: { currentSession: null, focusSessionActive: false },
  });

  // Record in stats
  await recordCompletedSession(session);

  // Notify user
  await chrome.notifications.create(`session-complete-${session.id}`, {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('src/assets/icons/icon-128.png'),
    title: 'Focus Session Complete',
    message: `Great job! You focused for ${Math.round(session.duration / 60000)} minutes.`,
  });
}

export { startFocusSession, handleTimerTick, completeFocusSession };
```

---

## Appendix A: Error Classification Matrix

| Error Type | Detection | Handling | Priority |
|---|---|---|---|
| `ReferenceError` in SW (DOM access) | ESLint `no-restricted-globals` | Never reaches runtime if linted | Critical |
| Unhandled promise rejection | Global `unhandledrejection` handler | Log + degrade gracefully | Critical |
| `chrome.runtime.lastError` | Check after every callback-style API call | Log + return fallback | High |
| Extension context invalidated | try/catch in content scripts | Prompt user to reload page | High |
| Storage quota exceeded | try/catch on `storage.set` | Prune data + notify user | High |
| Service worker terminated mid-operation | State restoration on restart | Persist state before every async gap | High |
| Tab no longer exists | try/catch on `tabs.*` calls | Skip operation + warn | Medium |
| Message port closed | try/catch on `sendMessage`; check `return true` | Retry with backoff | Medium |
| Alarm not firing | Verify alarm exists after creation | Re-create alarm on SW startup | Medium |
| DeclarativeNetRequest rule invalid | try/catch on `updateDynamicRules` | Validate rules before submitting | Medium |
| Offscreen document already exists | `runtime.getContexts` check | Skip creation | Low |
| Notification not showing | OS-level suppression | Provide badge fallback | Low |

## Appendix B: Quick Reference — Safe API Call Template

```js
/**
 * Template for any Chrome API call in the extension.
 * Copy and adapt for each new API interaction.
 */
async function safeApiCall() {
  const API_NAME = 'chrome.example.method'; // for logging

  try {
    const result = await chrome.example.method(args);

    // Validate result shape
    if (!result || typeof result !== 'object') {
      console.warn(`[${API_NAME}] Unexpected result:`, result);
      return FALLBACK_VALUE;
    }

    return result;
  } catch (err) {
    console.error(`[${API_NAME}] Failed:`, err.message);

    // Handle known error types
    if (err.message.includes('KNOWN_ERROR_SUBSTRING')) {
      return FALLBACK_VALUE;
    }

    // Re-throw unknown errors
    throw err;
  }
}
```

---

*End of Agent 2 — JS Error Detection & Prevention Specification*
