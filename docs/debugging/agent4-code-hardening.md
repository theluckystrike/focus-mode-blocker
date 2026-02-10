# Focus Mode - Blocker: Error Fixing & Defensive Coding Specification

**Author:** Agent 4 — Code Hardening Specialist
**Date:** 2026-02-10
**Extension:** Focus Mode - Blocker (MV3 Chrome Extension)
**Scope:** Defensive utility libraries, input validation, state recovery, debug logging, error boundaries, hardening checklist

---

## Table of Contents

1. [Defensive Utility Library — `src/utils/safe-chrome.js`](#1-defensive-utility-library)
2. [Input Validation Library — `src/utils/validators.js`](#2-input-validation-library)
3. [State Recovery System — `src/utils/state-recovery.js`](#3-state-recovery-system)
4. [Debug Logger — `src/utils/logger.js`](#4-debug-logger)
5. [User-Facing Error Messages](#5-user-facing-error-messages)
6. [Error Boundary Patterns](#6-error-boundary-patterns)
7. [Code Hardening Checklist](#7-code-hardening-checklist)

---

## 1. Defensive Utility Library

**File:** `src/utils/safe-chrome.js`

Every Chrome API call in the extension must go through these wrappers. Chrome MV3 service workers are non-persistent and can terminate at any moment. APIs can throw synchronously (e.g., invalid arguments), reject asynchronously (e.g., tab closed mid-operation), or silently fail via `chrome.runtime.lastError`. These wrappers handle all three failure modes, return sensible defaults, and log diagnostics without crashing the caller.

```javascript
/**
 * safe-chrome.js — Defensive wrappers for Chrome Extension APIs
 *
 * Every function:
 *   1. Validates arguments before calling the Chrome API
 *   2. Wraps the call in try/catch
 *   3. Checks chrome.runtime.lastError (for callback-based residue)
 *   4. Returns a sensible default on failure
 *   5. Logs errors with [FocusMode] prefix and the originating function name
 *
 * Usage:
 *   import { safeStorageGet, safeSendMessage } from './safe-chrome.js';
 *   const settings = await safeStorageGet('settings', { enabled: false });
 */

const PREFIX = '[FocusMode]';

/**
 * Internal error logger. Avoids circular dependency on logger.js so this
 * module can load independently in any context (service worker, popup,
 * content script).
 */
function _logError(fnName, error, extra = {}) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  console.error(
    `${PREFIX} ${fnName} failed:`, message,
    ...(stack ? ['\n', stack] : []),
    ...(Object.keys(extra).length ? ['\nContext:', extra] : [])
  );
}

/**
 * Check chrome.runtime.lastError and clear it. Some Chrome APIs set
 * lastError instead of (or in addition to) rejecting the promise.
 * Reading the property clears the "Unchecked runtime.lastError" warning.
 */
function _checkLastError(fnName) {
  if (chrome.runtime?.lastError) {
    _logError(fnName, chrome.runtime.lastError.message || 'Unknown lastError');
    return chrome.runtime.lastError;
  }
  return null;
}

// ──────────────────────────────────────────────
// Storage
// ──────────────────────────────────────────────

/**
 * Safely read from chrome.storage.local.
 *
 * @param {string|string[]|null} key - Storage key(s), or null for all.
 * @param {*} defaultValue - Returned when key is missing or call fails.
 *   For single-key reads this is the fallback value for that key.
 *   For multi-key reads this is the entire fallback object.
 * @returns {Promise<*>} The stored value, or defaultValue on failure.
 */
export async function safeStorageGet(key, defaultValue = null) {
  try {
    const result = await chrome.storage.local.get(key);
    _checkLastError('safeStorageGet');

    // Single key shorthand: return the value directly
    if (typeof key === 'string') {
      return result[key] !== undefined ? result[key] : defaultValue;
    }

    // Multi-key or null (all): return the full result, merged with defaults
    if (defaultValue && typeof defaultValue === 'object' && !Array.isArray(defaultValue)) {
      return { ...defaultValue, ...result };
    }

    return result;
  } catch (error) {
    _logError('safeStorageGet', error, { key });
    // Return default — caller always gets a usable value
    if (typeof key === 'string' && defaultValue !== null) {
      return defaultValue;
    }
    if (defaultValue && typeof defaultValue === 'object') {
      return { ...defaultValue };
    }
    return defaultValue;
  }
}

/**
 * Safely write to chrome.storage.local.
 *
 * @param {Object} data - Key-value pairs to store.
 * @returns {Promise<boolean>} true on success, false on failure.
 */
export async function safeStorageSet(data) {
  try {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      _logError('safeStorageSet', 'Invalid data argument: must be a plain object', { data });
      return false;
    }
    await chrome.storage.local.set(data);
    const lastErr = _checkLastError('safeStorageSet');
    return !lastErr;
  } catch (error) {
    _logError('safeStorageSet', error, { keys: Object.keys(data || {}) });
    return false;
  }
}

/**
 * Safely remove keys from chrome.storage.local.
 *
 * @param {string|string[]} keys - Key(s) to remove.
 * @returns {Promise<boolean>} true on success, false on failure.
 */
export async function safeStorageRemove(keys) {
  try {
    if (!keys || (Array.isArray(keys) && keys.length === 0)) {
      _logError('safeStorageRemove', 'No keys provided');
      return false;
    }
    await chrome.storage.local.remove(keys);
    const lastErr = _checkLastError('safeStorageRemove');
    return !lastErr;
  } catch (error) {
    _logError('safeStorageRemove', error, { keys });
    return false;
  }
}

// ──────────────────────────────────────────────
// Messaging
// ──────────────────────────────────────────────

/**
 * Safely send a message to the service worker (or whichever listener is
 * registered via chrome.runtime.onMessage).
 *
 * Common failure: "Could not establish connection. Receiving end does not exist."
 * This happens when the service worker is inactive or no listener is registered.
 *
 * @param {Object} message - The message payload. Must include an `action` field.
 * @returns {Promise<*>} The response, or null on failure.
 */
export async function safeSendMessage(message) {
  try {
    if (!message || typeof message !== 'object') {
      _logError('safeSendMessage', 'Invalid message: must be an object');
      return null;
    }
    const response = await chrome.runtime.sendMessage(message);
    _checkLastError('safeSendMessage');
    return response ?? null;
  } catch (error) {
    // "Receiving end does not exist" is expected when SW is dormant — downgrade to warn
    if (error?.message?.includes('Receiving end does not exist')) {
      console.warn(`${PREFIX} safeSendMessage: Service worker not available for`, message?.action);
    } else {
      _logError('safeSendMessage', error, { action: message?.action });
    }
    return null;
  }
}

/**
 * Safely send a message to a specific tab's content script.
 *
 * Common failures:
 * - Tab was closed between query and send
 * - Content script not yet injected
 * - Tab is a chrome:// or extension:// page (cannot inject)
 *
 * @param {number} tabId - Target tab ID.
 * @param {Object} message - The message payload.
 * @returns {Promise<*>} The response, or null on failure.
 */
export async function safeSendTabMessage(tabId, message) {
  try {
    if (!Number.isInteger(tabId) || tabId < 0) {
      _logError('safeSendTabMessage', 'Invalid tabId', { tabId });
      return null;
    }
    if (!message || typeof message !== 'object') {
      _logError('safeSendTabMessage', 'Invalid message: must be an object');
      return null;
    }
    const response = await chrome.tabs.sendMessage(tabId, message);
    _checkLastError('safeSendTabMessage');
    return response ?? null;
  } catch (error) {
    // Tab-closed and no-receiver errors are frequent and non-critical
    const benign = [
      'No tab with id',
      'Receiving end does not exist',
      'Could not establish connection',
      'message port closed',
    ];
    const isBenign = benign.some(frag => error?.message?.includes(frag));
    if (isBenign) {
      console.warn(`${PREFIX} safeSendTabMessage: Tab ${tabId} unavailable for`, message?.action);
    } else {
      _logError('safeSendTabMessage', error, { tabId, action: message?.action });
    }
    return null;
  }
}

// ──────────────────────────────────────────────
// Tabs
// ──────────────────────────────────────────────

/**
 * Safely get a single tab by ID.
 *
 * @param {number} tabId
 * @returns {Promise<chrome.tabs.Tab|null>} The tab object, or null.
 */
export async function safeGetTab(tabId) {
  try {
    if (!Number.isInteger(tabId) || tabId < 0) {
      _logError('safeGetTab', 'Invalid tabId', { tabId });
      return null;
    }
    const tab = await chrome.tabs.get(tabId);
    _checkLastError('safeGetTab');
    return tab ?? null;
  } catch (error) {
    // Tab may have been closed — this is routine
    if (error?.message?.includes('No tab with id')) {
      console.warn(`${PREFIX} safeGetTab: Tab ${tabId} no longer exists`);
    } else {
      _logError('safeGetTab', error, { tabId });
    }
    return null;
  }
}

/**
 * Safely query tabs.
 *
 * @param {Object} query - chrome.tabs.query filter (e.g., { active: true, currentWindow: true }).
 * @returns {Promise<chrome.tabs.Tab[]>} Matching tabs, or empty array on failure.
 */
export async function safeQueryTabs(query = {}) {
  try {
    const tabs = await chrome.tabs.query(query);
    _checkLastError('safeQueryTabs');
    return Array.isArray(tabs) ? tabs : [];
  } catch (error) {
    _logError('safeQueryTabs', error, { query });
    return [];
  }
}

// ──────────────────────────────────────────────
// Scripting
// ──────────────────────────────────────────────

/**
 * Safely inject a script into a tab via chrome.scripting.executeScript.
 *
 * @param {number} tabId - Target tab.
 * @param {Object} options - Injection options (files, func, args, world, etc.).
 * @returns {Promise<Array|null>} Injection results, or null on failure.
 */
export async function safeExecuteScript(tabId, options = {}) {
  try {
    if (!Number.isInteger(tabId) || tabId < 0) {
      _logError('safeExecuteScript', 'Invalid tabId', { tabId });
      return null;
    }
    // Merge tabId into the target
    const injection = {
      target: { tabId, ...(options.target || {}) },
      ...options,
    };
    delete injection.target.tabId; // avoid duplication if caller passed it in target too
    injection.target.tabId = tabId;

    const results = await chrome.scripting.executeScript(injection);
    _checkLastError('safeExecuteScript');
    return results ?? null;
  } catch (error) {
    // Cannot inject into chrome://, edge://, etc.
    const restricted = [
      'Cannot access',
      'Cannot script',
      'No tab with id',
      'Frame with ID',
    ];
    const isRestricted = restricted.some(frag => error?.message?.includes(frag));
    if (isRestricted) {
      console.warn(`${PREFIX} safeExecuteScript: Cannot inject into tab ${tabId}:`, error.message);
    } else {
      _logError('safeExecuteScript', error, { tabId, options });
    }
    return null;
  }
}

// ──────────────────────────────────────────────
// Alarms
// ──────────────────────────────────────────────

/**
 * Safely create a Chrome alarm.
 *
 * MV3 minimum alarm period is 30 seconds (delayInMinutes >= 0.5 for
 * non-persistent contexts). This wrapper enforces that minimum.
 *
 * @param {string} name - Alarm name.
 * @param {Object} options - { delayInMinutes, periodInMinutes, when }.
 * @returns {Promise<boolean>} true on success, false on failure.
 */
export async function safeCreateAlarm(name, options = {}) {
  try {
    if (!name || typeof name !== 'string') {
      _logError('safeCreateAlarm', 'Alarm name must be a non-empty string', { name });
      return false;
    }

    // Enforce MV3 minimums
    const safeOptions = { ...options };
    if (safeOptions.delayInMinutes !== undefined && safeOptions.delayInMinutes < 0.5) {
      console.warn(`${PREFIX} safeCreateAlarm: Clamping delayInMinutes from ${safeOptions.delayInMinutes} to 0.5`);
      safeOptions.delayInMinutes = 0.5;
    }
    if (safeOptions.periodInMinutes !== undefined && safeOptions.periodInMinutes < 0.5) {
      console.warn(`${PREFIX} safeCreateAlarm: Clamping periodInMinutes from ${safeOptions.periodInMinutes} to 0.5`);
      safeOptions.periodInMinutes = 0.5;
    }

    await chrome.alarms.create(name, safeOptions);
    _checkLastError('safeCreateAlarm');
    return true;
  } catch (error) {
    _logError('safeCreateAlarm', error, { name, options });
    return false;
  }
}

// ──────────────────────────────────────────────
// Notifications
// ──────────────────────────────────────────────

/**
 * Safely create a Chrome notification.
 *
 * @param {string} id - Notification ID (use '' for auto-generated).
 * @param {Object} options - Notification options (type, title, message, iconUrl, etc.).
 * @returns {Promise<string|null>} Notification ID on success, null on failure.
 */
export async function safeCreateNotification(id, options = {}) {
  try {
    // Ensure required fields have sane defaults
    const safeOpts = {
      type: 'basic',
      iconUrl: options.iconUrl || chrome.runtime.getURL('src/assets/icons/icon128.png'),
      title: options.title || 'Focus Mode',
      message: options.message || '',
      ...options,
    };

    const notifId = await chrome.notifications.create(id || '', safeOpts);
    _checkLastError('safeCreateNotification');
    return notifId ?? null;
  } catch (error) {
    _logError('safeCreateNotification', error, { id, options });
    return null;
  }
}

// ──────────────────────────────────────────────
// Declarative Net Request
// ──────────────────────────────────────────────

/**
 * Safely update dynamic declarativeNetRequest rules.
 *
 * @param {Object} options - { addRules, removeRuleIds }.
 * @returns {Promise<boolean>} true on success, false on failure.
 */
export async function safeUpdateDynamicRules(options = {}) {
  try {
    const safeOpts = {
      removeRuleIds: options.removeRuleIds || [],
      addRules: options.addRules || [],
    };

    // Validate rule IDs are integers
    if (!safeOpts.removeRuleIds.every(id => Number.isInteger(id) && id > 0)) {
      _logError('safeUpdateDynamicRules', 'removeRuleIds must be positive integers', {
        removeRuleIds: safeOpts.removeRuleIds,
      });
      return false;
    }

    // Validate addRules have required fields
    for (const rule of safeOpts.addRules) {
      if (!rule.id || !rule.priority || !rule.action || !rule.condition) {
        _logError('safeUpdateDynamicRules', 'Each rule must have id, priority, action, and condition', { rule });
        return false;
      }
    }

    await chrome.declarativeNetRequest.updateDynamicRules(safeOpts);
    _checkLastError('safeUpdateDynamicRules');
    return true;
  } catch (error) {
    _logError('safeUpdateDynamicRules', error, {
      addCount: options.addRules?.length ?? 0,
      removeCount: options.removeRuleIds?.length ?? 0,
    });
    return false;
  }
}

// ──────────────────────────────────────────────
// Offscreen Documents
// ──────────────────────────────────────────────

/**
 * Safely create an offscreen document. Idempotent — if one already exists,
 * this is a no-op that returns true.
 *
 * @param {Object} options - { url, reasons, justification }.
 * @returns {Promise<boolean>} true on success (or already exists), false on failure.
 */
export async function safeCreateOffscreen(options = {}) {
  try {
    // Check if an offscreen document already exists
    const existingClients = await clients?.matchAll?.();
    // Alternative: use chrome.offscreen.hasDocument if available (Chrome 116+)
    if (typeof chrome.offscreen.hasDocument === 'function') {
      const hasDoc = await chrome.offscreen.hasDocument();
      if (hasDoc) {
        return true; // Already exists, nothing to do
      }
    }

    if (!options.url) {
      _logError('safeCreateOffscreen', 'url is required');
      return false;
    }

    await chrome.offscreen.createDocument({
      url: options.url,
      reasons: options.reasons || [chrome.offscreen.Reason.AUDIO_PLAYBACK],
      justification: options.justification || 'Focus Mode timer audio',
    });
    _checkLastError('safeCreateOffscreen');
    return true;
  } catch (error) {
    // "Only a single offscreen document may be created" — treat as success
    if (error?.message?.includes('single offscreen')) {
      return true;
    }
    _logError('safeCreateOffscreen', error, { options });
    return false;
  }
}
```

---

## 2. Input Validation Library

**File:** `src/utils/validators.js`

All user-supplied data, import data, and inter-component messages pass through these validators before being stored or acted upon. No raw user input should ever reach `chrome.storage`, `chrome.declarativeNetRequest`, or the DOM without validation.

```javascript
/**
 * validators.js — Input validation and sanitization for Focus Mode
 *
 * Principles:
 *   - Fail closed: invalid input returns { valid: false } with an error message.
 *   - Normalize on the way in: strip protocols, lowercase domains, trim whitespace.
 *   - Enforce hard limits: max lengths, max list sizes, min/max timer durations.
 *   - Prevent XSS: all text destined for innerHTML is sanitized; prefer textContent.
 */

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const MAX_URL_LENGTH = 2048;
const MAX_DOMAIN_LENGTH = 253;
const MAX_DOMAIN_LABEL_LENGTH = 63;
const MAX_BLOCKLIST_SIZE = 500;
const MAX_TEXT_LENGTH = 500;
const MAX_IMPORT_SIZE_BYTES = 512 * 1024; // 512 KB
const MIN_TIMER_MINUTES = 1;
const MAX_TIMER_MINUTES = 480; // 8 hours
const STORAGE_SCHEMA_VERSION = 1;

// Protocols we strip when normalizing URLs to bare domains
const STRIP_PROTOCOLS = /^(https?:\/\/|ftp:\/\/)/i;

// Characters that should never appear in a domain
const INVALID_DOMAIN_CHARS = /[^a-zA-Z0-9.\-]/;

// Punycode prefix for internationalized domain names
const PUNYCODE_PREFIX = 'xn--';

// Basic XSS vectors to strip from free-text fields
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript\s*:/gi,
  /on\w+\s*=\s*["'][^"']*["']/gi,
  /on\w+\s*=\s*[^\s>]+/gi,
  /<iframe\b[^>]*>/gi,
  /<object\b[^>]*>/gi,
  /<embed\b[^>]*>/gi,
  /<link\b[^>]*>/gi,
  /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
];

// Valid storage keys the extension uses
const VALID_STORAGE_KEYS = new Set([
  'settings',
  'blocklist',
  'timerState',
  'schedule',
  'stats',
  'isPremium',
  'schemaVersion',
  'checkpoints',
  'debugMode',
  'onboardingComplete',
  'customMessages',
  'strictMode',
  'allowedDuringFocus',
  'dailyGoal',
  'streakData',
  'themePreference',
  'notificationPreference',
  'lastActiveTimestamp',
  'focusHistory',
]);

// Days of the week for schedule validation
const VALID_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// ──────────────────────────────────────────────
// URL / Domain Validation
// ──────────────────────────────────────────────

/**
 * Validate and normalize a URL or domain string.
 *
 * Accepts:
 *   - "example.com"
 *   - "https://example.com/path"
 *   - "*.example.com" (wildcard subdomain)
 *   - "xn--nxasmq6b.example.com" (punycode IDN)
 *
 * @param {string} input - Raw user input.
 * @returns {{ valid: boolean, normalized: string|null, error: string|null }}
 */
export function validateUrl(input) {
  if (!input || typeof input !== 'string') {
    return { valid: false, normalized: null, error: 'URL is required' };
  }

  let cleaned = input.trim();

  if (cleaned.length > MAX_URL_LENGTH) {
    return { valid: false, normalized: null, error: `URL exceeds maximum length of ${MAX_URL_LENGTH} characters` };
  }

  // Strip protocol
  cleaned = cleaned.replace(STRIP_PROTOCOLS, '');

  // Strip trailing slash and path for domain-level blocking
  const slashIndex = cleaned.indexOf('/');
  if (slashIndex !== -1) {
    cleaned = cleaned.substring(0, slashIndex);
  }

  // Strip port number
  const portIndex = cleaned.lastIndexOf(':');
  if (portIndex !== -1) {
    const afterColon = cleaned.substring(portIndex + 1);
    if (/^\d{1,5}$/.test(afterColon)) {
      cleaned = cleaned.substring(0, portIndex);
    }
  }

  // Strip leading wildcard for validation, re-add after
  let isWildcard = false;
  if (cleaned.startsWith('*.')) {
    isWildcard = true;
    cleaned = cleaned.substring(2);
  }

  // Lowercase
  cleaned = cleaned.toLowerCase();

  // Strip trailing dot (FQDN notation)
  if (cleaned.endsWith('.')) {
    cleaned = cleaned.substring(0, cleaned.length - 1);
  }

  // Validate domain length
  if (cleaned.length === 0) {
    return { valid: false, normalized: null, error: 'Domain is empty after normalization' };
  }
  if (cleaned.length > MAX_DOMAIN_LENGTH) {
    return { valid: false, normalized: null, error: `Domain exceeds ${MAX_DOMAIN_LENGTH} characters` };
  }

  // Validate each label
  const labels = cleaned.split('.');
  if (labels.length < 2) {
    return { valid: false, normalized: null, error: 'Domain must have at least two labels (e.g., example.com)' };
  }
  for (const label of labels) {
    if (label.length === 0) {
      return { valid: false, normalized: null, error: 'Domain contains empty label (double dots)' };
    }
    if (label.length > MAX_DOMAIN_LABEL_LENGTH) {
      return { valid: false, normalized: null, error: `Domain label "${label}" exceeds ${MAX_DOMAIN_LABEL_LENGTH} characters` };
    }
    if (label.startsWith('-') || label.endsWith('-')) {
      return { valid: false, normalized: null, error: `Domain label "${label}" cannot start or end with a hyphen` };
    }
    // Allow punycode labels (xn--...) which may contain sequences that look unusual
    if (!label.startsWith(PUNYCODE_PREFIX)) {
      if (INVALID_DOMAIN_CHARS.test(label)) {
        return { valid: false, normalized: null, error: `Domain label "${label}" contains invalid characters. Use punycode for international domains.` };
      }
    }
  }

  // TLD must not be all-numeric
  const tld = labels[labels.length - 1];
  if (/^\d+$/.test(tld)) {
    return { valid: false, normalized: null, error: 'Top-level domain cannot be purely numeric (did you enter an IP address?)' };
  }

  const normalized = isWildcard ? `*.${cleaned}` : cleaned;
  return { valid: true, normalized, error: null };
}

/**
 * Validate a single blocklist entry. Wraps validateUrl with additional
 * blocklist-specific checks (e.g., preventing self-blocking).
 *
 * @param {string} entry - Raw user input.
 * @returns {{ valid: boolean, normalized: string|null, error: string|null }}
 */
export function validateBlocklistEntry(entry) {
  const result = validateUrl(entry);
  if (!result.valid) return result;

  const domain = result.normalized.replace(/^\*\./, '');

  // Prevent blocking the extension's own pages or critical Chrome pages
  const forbidden = [
    'chrome.google.com',
    'chromewebstore.google.com',
    'chrome.com',
    'accounts.google.com',
  ];
  if (forbidden.includes(domain)) {
    return { valid: false, normalized: null, error: `"${domain}" cannot be blocked — it is required for Chrome to function` };
  }

  return result;
}

// ──────────────────────────────────────────────
// Text Sanitization
// ──────────────────────────────────────────────

/**
 * Sanitize free-text input. Strips XSS vectors, enforces max length,
 * normalizes whitespace.
 *
 * @param {string} text - Raw user text.
 * @param {number} [maxLength=MAX_TEXT_LENGTH] - Maximum allowed length.
 * @returns {string} Sanitized text (never null, never throws).
 */
export function sanitizeText(text, maxLength = MAX_TEXT_LENGTH) {
  if (!text || typeof text !== 'string') return '';

  let cleaned = text;

  // Strip XSS patterns
  for (const pattern of XSS_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Strip HTML tags entirely
  cleaned = cleaned.replace(/<[^>]*>/g, '');

  // Decode HTML entities to prevent double-encoding attacks
  cleaned = cleaned
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');

  // Re-strip after decoding (in case decoded content is dangerous)
  cleaned = cleaned.replace(/<[^>]*>/g, '');

  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Enforce max length (truncate, don't reject)
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength);
  }

  return cleaned;
}

// ──────────────────────────────────────────────
// Settings Validation
// ──────────────────────────────────────────────

/**
 * Validate a complete settings object. Returns a list of all errors found
 * (not just the first one) so the UI can highlight all problems at once.
 *
 * @param {Object} data - Settings object to validate.
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateSettings(data) {
  const errors = [];

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, errors: ['Settings must be a plain object'] };
  }

  // Theme
  if (data.theme !== undefined) {
    const validThemes = ['light', 'dark', 'system'];
    if (!validThemes.includes(data.theme)) {
      errors.push(`Invalid theme "${data.theme}". Must be one of: ${validThemes.join(', ')}`);
    }
  }

  // Notification preference
  if (data.notificationsEnabled !== undefined && typeof data.notificationsEnabled !== 'boolean') {
    errors.push('notificationsEnabled must be a boolean');
  }

  // Sound preference
  if (data.soundEnabled !== undefined && typeof data.soundEnabled !== 'boolean') {
    errors.push('soundEnabled must be a boolean');
  }

  // Strict mode
  if (data.strictMode !== undefined && typeof data.strictMode !== 'boolean') {
    errors.push('strictMode must be a boolean');
  }

  // Default timer duration
  if (data.defaultDuration !== undefined) {
    const timerResult = validateTimerDuration(data.defaultDuration);
    if (!timerResult.valid) {
      errors.push(`Invalid defaultDuration: must be between ${MIN_TIMER_MINUTES} and ${MAX_TIMER_MINUTES} minutes`);
    }
  }

  // Daily goal
  if (data.dailyGoal !== undefined) {
    if (!Number.isInteger(data.dailyGoal) || data.dailyGoal < 0 || data.dailyGoal > 1440) {
      errors.push('dailyGoal must be an integer between 0 and 1440 (minutes in a day)');
    }
  }

  // Custom block message
  if (data.blockMessage !== undefined) {
    if (typeof data.blockMessage !== 'string') {
      errors.push('blockMessage must be a string');
    } else if (data.blockMessage.length > MAX_TEXT_LENGTH) {
      errors.push(`blockMessage exceeds ${MAX_TEXT_LENGTH} characters`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ──────────────────────────────────────────────
// Import Data Validation
// ──────────────────────────────────────────────

/**
 * Validate imported JSON data (from a file or pasted text). Ensures
 * structure matches expectations and no field exceeds safe bounds.
 *
 * @param {string} json - Raw JSON string.
 * @returns {{ valid: boolean, data: Object|null, errors: string[] }}
 */
export function validateImportData(json) {
  const errors = [];

  if (!json || typeof json !== 'string') {
    return { valid: false, data: null, errors: ['Import data must be a JSON string'] };
  }

  // Size check before parsing (prevent CPU bombs)
  if (new Blob([json]).size > MAX_IMPORT_SIZE_BYTES) {
    return { valid: false, data: null, errors: [`Import data exceeds maximum size of ${MAX_IMPORT_SIZE_BYTES / 1024} KB`] };
  }

  let data;
  try {
    data = JSON.parse(json);
  } catch (e) {
    return { valid: false, data: null, errors: ['Invalid JSON: ' + e.message] };
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, data: null, errors: ['Import data must be a JSON object'] };
  }

  // Validate blocklist if present
  if (data.blocklist !== undefined) {
    if (!Array.isArray(data.blocklist)) {
      errors.push('blocklist must be an array');
    } else if (data.blocklist.length > MAX_BLOCKLIST_SIZE) {
      errors.push(`blocklist exceeds maximum of ${MAX_BLOCKLIST_SIZE} entries`);
    } else {
      const invalidEntries = [];
      data.blocklist = data.blocklist
        .map((entry, index) => {
          if (typeof entry === 'string') {
            const result = validateBlocklistEntry(entry);
            if (!result.valid) {
              invalidEntries.push(`[${index}] "${entry}": ${result.error}`);
              return null;
            }
            return result.normalized;
          } else if (typeof entry === 'object' && entry.domain) {
            const result = validateBlocklistEntry(entry.domain);
            if (!result.valid) {
              invalidEntries.push(`[${index}] "${entry.domain}": ${result.error}`);
              return null;
            }
            return { ...entry, domain: result.normalized };
          } else {
            invalidEntries.push(`[${index}] Invalid entry type`);
            return null;
          }
        })
        .filter(Boolean);

      if (invalidEntries.length > 0) {
        errors.push(`Invalid blocklist entries:\n  ${invalidEntries.join('\n  ')}`);
      }
    }
  }

  // Validate settings if present
  if (data.settings !== undefined) {
    const settingsResult = validateSettings(data.settings);
    if (!settingsResult.valid) {
      errors.push(...settingsResult.errors.map(e => `settings: ${e}`));
    }
  }

  // Validate schedule if present
  if (data.schedule !== undefined) {
    const scheduleResult = validateSchedule(data.schedule);
    if (!scheduleResult.valid) {
      errors.push(...scheduleResult.errors.map(e => `schedule: ${e}`));
    }
  }

  // Reject unknown top-level keys to prevent storage pollution
  const knownImportKeys = new Set(['blocklist', 'settings', 'schedule', 'customMessages', 'schemaVersion']);
  for (const key of Object.keys(data)) {
    if (!knownImportKeys.has(key)) {
      errors.push(`Unknown import key "${key}" — will be ignored`);
      delete data[key];
    }
  }

  return { valid: errors.length === 0, data, errors };
}

// ──────────────────────────────────────────────
// Timer Validation
// ──────────────────────────────────────────────

/**
 * Validate and clamp a timer duration.
 *
 * @param {number} minutes - Requested duration in minutes.
 * @returns {{ valid: boolean, clamped: number }}
 */
export function validateTimerDuration(minutes) {
  if (typeof minutes !== 'number' || isNaN(minutes)) {
    return { valid: false, clamped: MIN_TIMER_MINUTES };
  }

  const rounded = Math.round(minutes);
  if (rounded < MIN_TIMER_MINUTES) {
    return { valid: false, clamped: MIN_TIMER_MINUTES };
  }
  if (rounded > MAX_TIMER_MINUTES) {
    return { valid: false, clamped: MAX_TIMER_MINUTES };
  }

  return { valid: true, clamped: rounded };
}

// ──────────────────────────────────────────────
// Schedule Validation
// ──────────────────────────────────────────────

/**
 * Validate a schedule configuration object.
 *
 * Expected shape:
 * {
 *   enabled: boolean,
 *   entries: [
 *     { day: 'monday', startTime: '09:00', endTime: '17:00' },
 *     ...
 *   ]
 * }
 *
 * @param {Object} schedule
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateSchedule(schedule) {
  const errors = [];

  if (!schedule || typeof schedule !== 'object') {
    return { valid: false, errors: ['Schedule must be an object'] };
  }

  if (schedule.enabled !== undefined && typeof schedule.enabled !== 'boolean') {
    errors.push('schedule.enabled must be a boolean');
  }

  if (schedule.entries !== undefined) {
    if (!Array.isArray(schedule.entries)) {
      errors.push('schedule.entries must be an array');
    } else {
      if (schedule.entries.length > 50) {
        errors.push('schedule.entries exceeds maximum of 50 entries');
      }

      schedule.entries.forEach((entry, index) => {
        if (!entry || typeof entry !== 'object') {
          errors.push(`entries[${index}]: must be an object`);
          return;
        }

        // Day validation
        if (!entry.day || !VALID_DAYS.includes(entry.day.toLowerCase())) {
          errors.push(`entries[${index}]: invalid day "${entry.day}". Must be one of: ${VALID_DAYS.join(', ')}`);
        }

        // Time format validation (HH:MM, 24-hour)
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!entry.startTime || !timeRegex.test(entry.startTime)) {
          errors.push(`entries[${index}]: invalid startTime "${entry.startTime}". Use HH:MM format (24-hour)`);
        }
        if (!entry.endTime || !timeRegex.test(entry.endTime)) {
          errors.push(`entries[${index}]: invalid endTime "${entry.endTime}". Use HH:MM format (24-hour)`);
        }

        // Start must be before end
        if (entry.startTime && entry.endTime && timeRegex.test(entry.startTime) && timeRegex.test(entry.endTime)) {
          if (entry.startTime >= entry.endTime) {
            errors.push(`entries[${index}]: startTime (${entry.startTime}) must be before endTime (${entry.endTime})`);
          }
        }
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

// ──────────────────────────────────────────────
// Storage Key Validation
// ──────────────────────────────────────────────

/**
 * Check whether a storage key is one the extension recognizes.
 * Prevents typos from silently writing to unexpected keys.
 *
 * @param {string} key
 * @returns {boolean}
 */
export function isValidStorageKey(key) {
  if (!key || typeof key !== 'string') return false;
  return VALID_STORAGE_KEYS.has(key);
}

// ──────────────────────────────────────────────
// Exports (constants for external use)
// ──────────────────────────────────────────────

export {
  MAX_URL_LENGTH,
  MAX_DOMAIN_LENGTH,
  MAX_BLOCKLIST_SIZE,
  MAX_TEXT_LENGTH,
  MAX_IMPORT_SIZE_BYTES,
  MIN_TIMER_MINUTES,
  MAX_TIMER_MINUTES,
  STORAGE_SCHEMA_VERSION,
  VALID_STORAGE_KEYS,
};
```

---

## 3. State Recovery System

**File:** `src/utils/state-recovery.js`

MV3 service workers can be terminated at any moment. A timer may be running, a blocklist update may be mid-write, or a settings save may be interrupted. This module provides checkpointing, integrity checks, corruption repair, and schema migration so the extension can recover gracefully from any interruption.

```javascript
/**
 * state-recovery.js — Crash recovery, integrity checking, and storage migration
 *
 * Architecture:
 *   - Checkpoints: snapshot state BEFORE a risky multi-step operation
 *   - Integrity checks: validate all storage keys on startup
 *   - Repair: reset individual corrupted keys to known-good defaults
 *   - Migration: upgrade storage schema across extension updates
 *
 * Dependencies:
 *   - safe-chrome.js for all storage I/O
 *   - validators.js for schema validation
 */

import {
  safeStorageGet,
  safeStorageSet,
  safeStorageRemove,
} from './safe-chrome.js';

import {
  validateSettings,
  validateSchedule,
  isValidStorageKey,
  STORAGE_SCHEMA_VERSION,
  VALID_STORAGE_KEYS,
} from './validators.js';

const PREFIX = '[FocusMode][Recovery]';
const CHECKPOINT_NAMESPACE = 'checkpoints';
const MAX_CHECKPOINT_AGE_MS = 30 * 60 * 1000; // 30 minutes — stale checkpoints are garbage-collected

// ──────────────────────────────────────────────
// Default values for every storage key
// ──────────────────────────────────────────────

const STORAGE_DEFAULTS = {
  settings: {
    theme: 'system',
    notificationsEnabled: true,
    soundEnabled: true,
    strictMode: false,
    defaultDuration: 25,
    dailyGoal: 120,
    blockMessage: 'This site is blocked during focus time.',
  },
  blocklist: [],
  timerState: {
    isRunning: false,
    endTime: null,
    duration: null,
    pausedAt: null,
    totalPausedMs: 0,
  },
  schedule: {
    enabled: false,
    entries: [],
  },
  stats: {
    totalFocusMinutes: 0,
    sessionsCompleted: 0,
    currentStreak: 0,
    longestStreak: 0,
    dailyMinutes: {},
  },
  isPremium: false,
  schemaVersion: STORAGE_SCHEMA_VERSION,
  debugMode: false,
  onboardingComplete: false,
  customMessages: [],
  strictMode: false,
  allowedDuringFocus: [],
  dailyGoal: 120,
  streakData: {
    current: 0,
    longest: 0,
    lastActiveDate: null,
  },
  themePreference: 'system',
  notificationPreference: 'all',
  lastActiveTimestamp: 0,
  focusHistory: [],
};

// ──────────────────────────────────────────────
// Checkpointing
// ──────────────────────────────────────────────

/**
 * Save a checkpoint of the given state before performing a risky operation.
 *
 * Usage:
 *   await saveCheckpoint('blocklist-update', currentBlocklist);
 *   // ... perform multi-step update ...
 *   // If the extension crashes, restoreCheckpoint('blocklist-update') recovers.
 *
 * @param {string} key - Unique checkpoint identifier.
 * @param {*} state - The state to snapshot (must be JSON-serializable).
 * @returns {Promise<boolean>} true on success.
 */
export async function saveCheckpoint(key, state) {
  try {
    const checkpoints = await safeStorageGet(CHECKPOINT_NAMESPACE, {});
    checkpoints[key] = {
      state,
      timestamp: Date.now(),
    };
    const success = await safeStorageSet({ [CHECKPOINT_NAMESPACE]: checkpoints });
    if (success) {
      console.log(`${PREFIX} Checkpoint saved: ${key}`);
    }
    return success;
  } catch (error) {
    console.error(`${PREFIX} Failed to save checkpoint "${key}":`, error);
    return false;
  }
}

/**
 * Restore a previously saved checkpoint. After restoration, the checkpoint
 * is deleted to prevent accidental re-application.
 *
 * @param {string} key - Checkpoint identifier.
 * @returns {Promise<{ found: boolean, state: *|null }>}
 */
export async function restoreCheckpoint(key) {
  try {
    const checkpoints = await safeStorageGet(CHECKPOINT_NAMESPACE, {});
    const checkpoint = checkpoints[key];

    if (!checkpoint) {
      console.log(`${PREFIX} No checkpoint found for "${key}"`);
      return { found: false, state: null };
    }

    // Check for staleness
    const age = Date.now() - checkpoint.timestamp;
    if (age > MAX_CHECKPOINT_AGE_MS) {
      console.warn(`${PREFIX} Checkpoint "${key}" is stale (${Math.round(age / 60000)}min old) — discarding`);
      delete checkpoints[key];
      await safeStorageSet({ [CHECKPOINT_NAMESPACE]: checkpoints });
      return { found: false, state: null };
    }

    // Clean up the consumed checkpoint
    const state = checkpoint.state;
    delete checkpoints[key];
    await safeStorageSet({ [CHECKPOINT_NAMESPACE]: checkpoints });

    console.log(`${PREFIX} Checkpoint restored: ${key} (age: ${Math.round(age / 1000)}s)`);
    return { found: true, state };
  } catch (error) {
    console.error(`${PREFIX} Failed to restore checkpoint "${key}":`, error);
    return { found: false, state: null };
  }
}

// ──────────────────────────────────────────────
// Storage Integrity
// ──────────────────────────────────────────────

/**
 * Validate all storage keys against the expected schema. Returns a
 * diagnostic report. Does NOT modify storage — call repairCorruptedStorage
 * for remediation.
 *
 * @returns {Promise<{ healthy: boolean, corruptKeys: string[], missingKeys: string[], extraKeys: string[], details: Object }>}
 */
export async function validateStorageIntegrity() {
  const report = {
    healthy: true,
    corruptKeys: [],
    missingKeys: [],
    extraKeys: [],
    details: {},
  };

  try {
    // Get everything in storage
    const allData = await safeStorageGet(null, {});
    const storedKeys = new Set(Object.keys(allData));

    // Check for missing keys
    for (const key of VALID_STORAGE_KEYS) {
      if (key === 'checkpoints') continue; // internal bookkeeping, may not exist
      if (!storedKeys.has(key)) {
        report.missingKeys.push(key);
        report.details[key] = 'MISSING — will use default';
      }
    }

    // Check for unexpected keys (possible leftover from old versions or corruption)
    for (const key of storedKeys) {
      if (!isValidStorageKey(key) && key !== CHECKPOINT_NAMESPACE) {
        report.extraKeys.push(key);
        report.details[key] = 'UNEXPECTED — may be from an older version';
      }
    }

    // Type-check known keys
    const typeChecks = {
      settings: (v) => v && typeof v === 'object' && !Array.isArray(v),
      blocklist: (v) => Array.isArray(v),
      timerState: (v) => v && typeof v === 'object' && !Array.isArray(v),
      schedule: (v) => v && typeof v === 'object' && !Array.isArray(v),
      stats: (v) => v && typeof v === 'object' && !Array.isArray(v),
      isPremium: (v) => typeof v === 'boolean',
      schemaVersion: (v) => typeof v === 'number' && Number.isInteger(v),
      debugMode: (v) => typeof v === 'boolean',
      onboardingComplete: (v) => typeof v === 'boolean',
      customMessages: (v) => Array.isArray(v),
      strictMode: (v) => typeof v === 'boolean',
      allowedDuringFocus: (v) => Array.isArray(v),
      dailyGoal: (v) => typeof v === 'number' && Number.isInteger(v) && v >= 0,
      streakData: (v) => v && typeof v === 'object' && !Array.isArray(v),
      themePreference: (v) => typeof v === 'string',
      notificationPreference: (v) => typeof v === 'string',
      lastActiveTimestamp: (v) => typeof v === 'number',
      focusHistory: (v) => Array.isArray(v),
    };

    for (const [key, checker] of Object.entries(typeChecks)) {
      if (storedKeys.has(key)) {
        if (!checker(allData[key])) {
          report.corruptKeys.push(key);
          report.details[key] = `CORRUPT — expected type check failed, got: ${typeof allData[key]}`;
        }
      }
    }

    // Deep validation for complex objects
    if (storedKeys.has('settings') && !report.corruptKeys.includes('settings')) {
      const settingsResult = validateSettings(allData.settings);
      if (!settingsResult.valid) {
        report.corruptKeys.push('settings');
        report.details.settings = `CORRUPT — ${settingsResult.errors.join('; ')}`;
      }
    }

    if (storedKeys.has('schedule') && !report.corruptKeys.includes('schedule')) {
      const scheduleResult = validateSchedule(allData.schedule);
      if (!scheduleResult.valid) {
        report.corruptKeys.push('schedule');
        report.details.schedule = `CORRUPT — ${scheduleResult.errors.join('; ')}`;
      }
    }

    // Check for timer state that references the past (stale timer)
    if (storedKeys.has('timerState') && allData.timerState?.isRunning) {
      if (allData.timerState.endTime && allData.timerState.endTime < Date.now()) {
        report.details.timerState = 'STALE — timer endTime is in the past; session was interrupted';
        // Not necessarily "corrupt" but needs attention
        report.corruptKeys.push('timerState');
      }
    }

    report.healthy = report.corruptKeys.length === 0 && report.missingKeys.length === 0;
    return report;
  } catch (error) {
    console.error(`${PREFIX} Storage integrity check failed:`, error);
    return {
      healthy: false,
      corruptKeys: ['UNKNOWN'],
      missingKeys: [],
      extraKeys: [],
      details: { error: error.message },
    };
  }
}

/**
 * Repair a single corrupted storage key by resetting it to its default value.
 *
 * @param {string} key - The storage key to repair.
 * @param {*} [defaultValue] - Override default. If not provided, uses STORAGE_DEFAULTS.
 * @returns {Promise<boolean>} true if repaired successfully.
 */
export async function repairCorruptedStorage(key, defaultValue) {
  try {
    const fallback = defaultValue !== undefined ? defaultValue : STORAGE_DEFAULTS[key];

    if (fallback === undefined) {
      console.warn(`${PREFIX} No default value for key "${key}" — removing it`);
      return await safeStorageRemove(key);
    }

    const success = await safeStorageSet({ [key]: fallback });
    if (success) {
      console.log(`${PREFIX} Repaired key "${key}" with default value`);
    }
    return success;
  } catch (error) {
    console.error(`${PREFIX} Failed to repair key "${key}":`, error);
    return false;
  }
}

// ──────────────────────────────────────────────
// Schema Migration
// ──────────────────────────────────────────────

/**
 * Migrate storage schema from one version to another. Each version bump
 * is handled by a dedicated migration function. Migrations are applied
 * sequentially (v1->v2, v2->v3, etc.) so any upgrade path is supported.
 *
 * @param {number} fromVersion - Current schema version in storage.
 * @param {number} toVersion - Target schema version (typically STORAGE_SCHEMA_VERSION).
 * @returns {Promise<{ success: boolean, migratedTo: number, errors: string[] }>}
 */
export async function migrateStorageSchema(fromVersion, toVersion) {
  const errors = [];
  let currentVersion = fromVersion;

  if (fromVersion >= toVersion) {
    return { success: true, migratedTo: currentVersion, errors: [] };
  }

  console.log(`${PREFIX} Migrating storage schema from v${fromVersion} to v${toVersion}`);

  // Save a full checkpoint before migration
  const allData = await safeStorageGet(null, {});
  await saveCheckpoint('schema-migration', allData);

  const migrations = {
    // v0 -> v1: Initial schema. Normalize legacy flat keys into structured objects.
    '0->1': async () => {
      // If blocklist was stored as a flat array of strings, keep it.
      // If timer was stored with legacy key names, rename them.
      const timerState = await safeStorageGet('timerState', null);
      if (timerState && timerState.remaining !== undefined) {
        // Legacy format used "remaining" instead of "endTime"
        const migrated = {
          isRunning: !!timerState.isRunning,
          endTime: timerState.isRunning ? Date.now() + (timerState.remaining * 1000) : null,
          duration: timerState.duration || null,
          pausedAt: timerState.pausedAt || null,
          totalPausedMs: timerState.totalPausedMs || 0,
        };
        await safeStorageSet({ timerState: migrated });
      }

      // Ensure settings is an object, not individual keys
      const settings = await safeStorageGet('settings', null);
      if (!settings) {
        // Collect scattered legacy settings keys
        const theme = await safeStorageGet('theme', 'system');
        const notifications = await safeStorageGet('notifications', true);
        const sound = await safeStorageGet('sound', true);
        const strict = await safeStorageGet('strict', false);
        const duration = await safeStorageGet('defaultDuration', 25);

        await safeStorageSet({
          settings: {
            theme,
            notificationsEnabled: notifications,
            soundEnabled: sound,
            strictMode: strict,
            defaultDuration: duration,
            dailyGoal: 120,
            blockMessage: 'This site is blocked during focus time.',
          },
        });

        // Clean up old flat keys
        await safeStorageRemove(['theme', 'notifications', 'sound', 'strict', 'defaultDuration']);
      }

      // Ensure stats object exists
      const stats = await safeStorageGet('stats', null);
      if (!stats) {
        await safeStorageSet({ stats: STORAGE_DEFAULTS.stats });
      }

      // Ensure streakData exists
      const streakData = await safeStorageGet('streakData', null);
      if (!streakData) {
        await safeStorageSet({ streakData: STORAGE_DEFAULTS.streakData });
      }

      // Set schema version
      await safeStorageSet({ schemaVersion: 1 });
    },

    // Template for future migrations:
    // '1->2': async () => { ... },
    // '2->3': async () => { ... },
  };

  // Apply migrations sequentially
  while (currentVersion < toVersion) {
    const migrationKey = `${currentVersion}->${currentVersion + 1}`;
    const migrationFn = migrations[migrationKey];

    if (!migrationFn) {
      const msg = `No migration found for ${migrationKey}`;
      console.error(`${PREFIX} ${msg}`);
      errors.push(msg);
      break;
    }

    try {
      console.log(`${PREFIX} Running migration ${migrationKey}...`);
      await migrationFn();
      currentVersion++;
      console.log(`${PREFIX} Migration ${migrationKey} complete`);
    } catch (error) {
      const msg = `Migration ${migrationKey} failed: ${error.message}`;
      console.error(`${PREFIX} ${msg}`, error);
      errors.push(msg);

      // Attempt rollback from checkpoint
      console.warn(`${PREFIX} Attempting rollback from checkpoint...`);
      const checkpoint = await restoreCheckpoint('schema-migration');
      if (checkpoint.found) {
        await safeStorageSet(checkpoint.state);
        console.log(`${PREFIX} Rollback successful — schema remains at v${fromVersion}`);
      } else {
        console.error(`${PREFIX} Rollback failed — checkpoint not found. Storage may be inconsistent.`);
        errors.push('Rollback failed — manual repair may be needed');
      }
      break;
    }
  }

  // Clean up migration checkpoint on success
  if (errors.length === 0) {
    const checkpoints = await safeStorageGet(CHECKPOINT_NAMESPACE, {});
    delete checkpoints['schema-migration'];
    await safeStorageSet({ [CHECKPOINT_NAMESPACE]: checkpoints });
  }

  return {
    success: errors.length === 0,
    migratedTo: currentVersion,
    errors,
  };
}

// ──────────────────────────────────────────────
// Storage Health
// ──────────────────────────────────────────────

/**
 * Get a high-level health report for the extension's storage. Useful for
 * debugging and for the options page's "Storage Health" diagnostic section.
 *
 * @returns {Promise<{ totalBytes: number, quotaPercent: number, corruptKeys: string[], missingKeys: string[], schemaVersion: number, healthy: boolean }>}
 */
export async function getStorageHealth() {
  try {
    // Get storage bytes in use
    const bytesInUse = await new Promise((resolve) => {
      chrome.storage.local.getBytesInUse(null, (bytes) => {
        resolve(bytes || 0);
      });
    });

    // chrome.storage.local quota is ~10 MB for extensions
    const QUOTA_BYTES = 10 * 1024 * 1024; // 10 MB
    const quotaPercent = Math.round((bytesInUse / QUOTA_BYTES) * 100 * 100) / 100;

    // Run integrity check
    const integrity = await validateStorageIntegrity();

    // Get current schema version
    const schemaVersion = await safeStorageGet('schemaVersion', 0);

    return {
      totalBytes: bytesInUse,
      quotaPercent,
      corruptKeys: integrity.corruptKeys,
      missingKeys: integrity.missingKeys,
      schemaVersion,
      healthy: integrity.healthy && quotaPercent < 90,
    };
  } catch (error) {
    console.error(`${PREFIX} Health check failed:`, error);
    return {
      totalBytes: -1,
      quotaPercent: -1,
      corruptKeys: ['UNKNOWN'],
      missingKeys: [],
      schemaVersion: -1,
      healthy: false,
    };
  }
}

// ──────────────────────────────────────────────
// Startup Recovery
// ──────────────────────────────────────────────

/**
 * Run on service worker startup and extension install/update. Performs
 * schema migration, integrity check, and auto-repair.
 *
 * @returns {Promise<{ healthy: boolean, repaired: string[], migrated: boolean }>}
 */
export async function runStartupRecovery() {
  const result = { healthy: true, repaired: [], migrated: false };

  try {
    // 1. Check and migrate schema version
    const currentVersion = await safeStorageGet('schemaVersion', 0);
    if (currentVersion < STORAGE_SCHEMA_VERSION) {
      const migration = await migrateStorageSchema(currentVersion, STORAGE_SCHEMA_VERSION);
      result.migrated = migration.success;
      if (!migration.success) {
        console.error(`${PREFIX} Schema migration had errors:`, migration.errors);
      }
    }

    // 2. Validate storage integrity
    const integrity = await validateStorageIntegrity();
    if (!integrity.healthy) {
      console.warn(`${PREFIX} Storage integrity issues found:`, integrity.details);

      // Auto-repair corrupt keys
      for (const key of integrity.corruptKeys) {
        const repaired = await repairCorruptedStorage(key);
        if (repaired) {
          result.repaired.push(key);
        }
      }

      // Initialize missing keys with defaults
      for (const key of integrity.missingKeys) {
        if (STORAGE_DEFAULTS[key] !== undefined) {
          const success = await safeStorageSet({ [key]: STORAGE_DEFAULTS[key] });
          if (success) {
            result.repaired.push(key);
          }
        }
      }
    }

    // 3. Garbage-collect stale checkpoints
    const checkpoints = await safeStorageGet(CHECKPOINT_NAMESPACE, {});
    let cleaned = false;
    for (const [key, cp] of Object.entries(checkpoints)) {
      if (Date.now() - cp.timestamp > MAX_CHECKPOINT_AGE_MS) {
        delete checkpoints[key];
        cleaned = true;
      }
    }
    if (cleaned) {
      await safeStorageSet({ [CHECKPOINT_NAMESPACE]: checkpoints });
    }

    // 4. Determine overall health
    const health = await getStorageHealth();
    result.healthy = health.healthy;

    console.log(`${PREFIX} Startup recovery complete:`, result);
    return result;
  } catch (error) {
    console.error(`${PREFIX} Startup recovery failed:`, error);
    result.healthy = false;
    return result;
  }
}

export { STORAGE_DEFAULTS };
```

---

## 4. Debug Logger

**File:** `src/utils/logger.js`

A lightweight, zero-dependency logger that can be toggled on/off per-user via the extension's settings. In production, only `errorLog` calls produce output. When `debugMode` is enabled, `debugLog` and `performanceLog` also emit to the console.

```javascript
/**
 * logger.js — Conditional debug logging for Focus Mode
 *
 * Design decisions:
 *   - No dependencies on other utility modules (avoids circular imports).
 *   - Debug mode is read from chrome.storage.local on initialization, then
 *     cached in memory. Toggling takes effect after the next module load
 *     (or call setDebugMode() to change it immediately).
 *   - Error logs always emit regardless of debug mode.
 *   - Console methods are captured at module load to prevent tampering.
 */

const PREFIX = '[FocusMode]';

// Cache the console methods at load time so external code cannot suppress logging
const _console = {
  log: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  debug: console.debug.bind(console),
  group: console.group.bind(console),
  groupEnd: console.groupEnd.bind(console),
  time: console.time.bind(console),
  timeEnd: console.timeEnd.bind(console),
};

// In-memory debug flag. Starts false; initialized asynchronously from storage.
let _debugEnabled = false;
let _initialized = false;

/**
 * Initialize the logger by reading debugMode from storage.
 * Called automatically on first import. Can also be called
 * explicitly to re-read from storage.
 */
async function _init() {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      const result = await chrome.storage.local.get('debugMode');
      _debugEnabled = result.debugMode === true;
    }
  } catch {
    // Silently default to disabled — we can't log here without recursion
    _debugEnabled = false;
  }
  _initialized = true;
}

// Fire-and-forget initialization
_init();

/**
 * Toggle debug mode at runtime. Also persists the setting to storage
 * so it survives service worker restarts.
 *
 * @param {boolean} enabled
 */
export async function setDebugMode(enabled) {
  _debugEnabled = !!enabled;
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({ debugMode: _debugEnabled });
    }
  } catch {
    // Storage may not be available in all contexts (e.g., during tests)
  }
  _console.log(`${PREFIX} Debug mode ${_debugEnabled ? 'ENABLED' : 'DISABLED'}`);
}

/**
 * Get current debug mode state.
 * @returns {boolean}
 */
export function isDebugMode() {
  return _debugEnabled;
}

/**
 * Conditional debug log. Only emits when debugMode is enabled.
 *
 * @param {string} module - The component name (e.g., 'ServiceWorker', 'Popup', 'Timer').
 * @param {...*} args - Anything you'd pass to console.log.
 */
export function debugLog(module, ...args) {
  if (!_debugEnabled) return;

  const timestamp = new Date().toISOString().substring(11, 23); // HH:MM:SS.mmm
  _console.debug(`${PREFIX}[${module}] ${timestamp}`, ...args);
}

/**
 * Always-on error logger. Provides structured context around errors
 * to make them actionable.
 *
 * @param {string} module - The component that encountered the error.
 * @param {Error|string} error - The error or error message.
 * @param {Object} [context={}] - Additional key-value pairs for debugging.
 */
export function errorLog(module, error, context = {}) {
  const timestamp = new Date().toISOString();
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  _console.error(
    `${PREFIX}[${module}] ERROR at ${timestamp}:`,
    message,
  );

  if (stack) {
    _console.error(`${PREFIX}[${module}] Stack:`, stack);
  }

  if (Object.keys(context).length > 0) {
    _console.error(`${PREFIX}[${module}] Context:`, context);
  }

  // In debug mode, also write to a rolling in-memory error buffer
  // that can be exported for bug reports
  if (_debugEnabled) {
    _pushToErrorBuffer({ timestamp, module, message, stack, context });
  }
}

/**
 * Log the elapsed time for an operation. Useful for profiling storage
 * operations, rule updates, and UI rendering.
 *
 * @param {string} label - What was being measured.
 * @param {number} startTime - The value of performance.now() or Date.now() at the start.
 */
export function performanceLog(label, startTime) {
  if (!_debugEnabled) return;

  const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;
  const color = elapsed > 100 ? 'color: red' : elapsed > 50 ? 'color: orange' : 'color: green';

  _console.log(
    `${PREFIX}[Perf] %c${label}: ${elapsed.toFixed(2)}ms`,
    color,
  );

  // Warn about slow operations
  if (elapsed > 500) {
    _console.warn(`${PREFIX}[Perf] SLOW OPERATION: ${label} took ${elapsed.toFixed(0)}ms`);
  }
}

// ──────────────────────────────────────────────
// Error Buffer (debug mode only)
// ──────────────────────────────────────────────

const MAX_ERROR_BUFFER_SIZE = 100;
const _errorBuffer = [];

function _pushToErrorBuffer(entry) {
  _errorBuffer.push(entry);
  if (_errorBuffer.length > MAX_ERROR_BUFFER_SIZE) {
    _errorBuffer.shift(); // drop oldest
  }
}

/**
 * Get the rolling error buffer contents. Useful for a "Copy Debug Log"
 * button in the options page.
 *
 * @returns {Array<Object>} Recent error entries.
 */
export function getErrorBuffer() {
  return [..._errorBuffer];
}

/**
 * Clear the error buffer.
 */
export function clearErrorBuffer() {
  _errorBuffer.length = 0;
}

/**
 * Export a full debug snapshot as a JSON string. Designed for "Export Debug Info"
 * functionality in the options page.
 *
 * @returns {Promise<string>} JSON string with errors, storage health, and environment info.
 */
export async function exportDebugSnapshot() {
  const snapshot = {
    timestamp: new Date().toISOString(),
    errors: getErrorBuffer(),
    environment: {
      extensionVersion: chrome.runtime?.getManifest?.()?.version || 'unknown',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
    },
  };

  // Try to include storage health (may fail in restricted contexts)
  try {
    const { getStorageHealth } = await import('./state-recovery.js');
    snapshot.storageHealth = await getStorageHealth();
  } catch {
    snapshot.storageHealth = 'unavailable';
  }

  return JSON.stringify(snapshot, null, 2);
}
```

---

## 5. User-Facing Error Messages

Every error the extension can encounter is mapped to a non-technical message and a recovery action. Components reference this map by error code to display consistent, helpful messages in the popup, options page, or notification.

**File location:** Export from `src/utils/error-messages.js` or embed inline where needed.

| # | Error Condition | Technical Error | User Message | Recovery Action |
|---|---|---|---|---|
| 1 | Storage read fails | `chrome.storage.local.get` throws or returns `undefined` | "Could not load your settings. Using defaults for now." | Auto-fallback to defaults; retry on next action. |
| 2 | Storage write fails | `chrome.storage.local.set` throws | "Your changes could not be saved. Please try again." | Retry button in popup. |
| 3 | Storage quota exceeded | `QUOTA_BYTES_PER_ITEM` or total quota exceeded | "Storage is full. Please remove some blocked sites or clear old data." | Link to options page with "Clear History" option. |
| 4 | Corrupted settings | Stored settings fail `validateSettings()` | "Your settings were corrupted and have been reset to defaults." | Auto-repair; toast notification. |
| 5 | Corrupted blocklist | Blocklist not an array or contains invalid entries | "Your blocklist had some issues and was repaired." | Auto-repair; show count of removed entries. |
| 6 | Timer state stale after crash | `timerState.endTime` is in the past while `isRunning === true` | "A previous focus session was interrupted. Ready to start a new one." | Reset timer state; log interrupted session to stats. |
| 7 | Alarm creation fails | `chrome.alarms.create` throws | "Could not set the focus timer. Please try again." | Retry button; check if another alarm exists. |
| 8 | Alarm not found on wake | `chrome.alarms.get` returns `undefined` for expected alarm | "Timer lost track of time. Resynchronizing..." | Re-create alarm from stored `endTime`. |
| 9 | Service worker terminated during timer | SW restarts and timer state indicates active session | "Focus session recovered after a brief interruption." | Recalculate remaining time from `endTime`; re-register alarm. |
| 10 | Message send fails — SW dormant | "Receiving end does not exist" | "Reconnecting to Focus Mode... Please wait." | Auto-retry with exponential backoff (100ms, 200ms, 400ms). |
| 11 | Message send fails — tab closed | `safeSendTabMessage` returns null | (Silent — no user-facing message needed) | Log warning; skip the tab. |
| 12 | Content script not injected | `chrome.scripting.executeScript` fails for active tab | "Could not apply blocking to this tab. Try refreshing the page." | Show refresh prompt. |
| 13 | Cannot inject into restricted page | Tab is `chrome://`, `edge://`, or Web Store | "Focus Mode cannot block browser system pages." | Dim the block button; explain in tooltip. |
| 14 | DeclarativeNetRequest rule limit hit | More than 5000 dynamic rules | "You have reached the maximum number of blocked sites. Please remove some to add more." | Show current count; highlight removal option. |
| 15 | Invalid URL entered by user | `validateUrl` returns `{ valid: false }` | "That doesn't look like a valid website address. Please enter a domain like 'example.com'." | Keep input focused; show inline error below field. |
| 16 | Duplicate blocklist entry | Domain already exists in blocklist | "This site is already on your blocklist." | Flash the existing entry in the list. |
| 17 | Empty blocklist entry | User submits blank input | "Please enter a website address to block." | Keep input focused. |
| 18 | Forbidden domain blocked | User tries to block Chrome Web Store or accounts.google.com | "This site cannot be blocked because Chrome requires it to function." | Explain which sites are protected and why. |
| 19 | Import file too large | Exceeds `MAX_IMPORT_SIZE_BYTES` | "The import file is too large (max 512 KB). Please use a smaller file." | Show file size; suggest trimming. |
| 20 | Import file invalid JSON | `JSON.parse` throws | "The import file is not valid JSON. Please check the file format." | Link to documentation showing expected format. |
| 21 | Import has unknown keys | Keys not in `knownImportKeys` set | "Some settings in the import file were not recognized and were skipped." | Show list of skipped keys. |
| 22 | Import has invalid entries | Some blocklist entries fail validation | "X of Y entries could not be imported because they were invalid." | Show error details per entry. |
| 23 | Notification permission denied | `chrome.notifications.create` fails with permission error | "Focus Mode needs notification permission to alert you when focus time ends." | Link to Chrome extension settings. |
| 24 | Notification creation fails | Any other notification error | "Could not show notification. Your focus session still ended successfully." | Log error; rely on popup badge update. |
| 25 | Offscreen document creation fails | `chrome.offscreen.createDocument` throws | "Timer sounds may not play. Focus timer will still work normally." | Degrade gracefully; disable sound. |
| 26 | Timer duration out of range | User enters < 1 or > 480 minutes | "Timer duration must be between 1 minute and 8 hours." | Clamp to nearest valid value; show adjusted value. |
| 27 | Schedule time range invalid | Start time >= end time | "Start time must be before end time." | Highlight both time fields. |
| 28 | Schedule parse error | Corrupted schedule in storage | "Your schedule had an error and was reset." | Auto-repair; notify user. |
| 29 | Premium feature access denied | Non-premium user tries premium feature | "This feature requires Focus Mode Premium." | Show upgrade prompt with feature comparison. |
| 30 | Extension update — schema migration | `schemaVersion` mismatch detected on startup | "Focus Mode has been updated. Your settings have been migrated." | Auto-migrate; show "What's New" if available. |
| 31 | Schema migration fails | Migration function throws | "Settings migration had an issue. Some settings were reset to defaults." | Attempt rollback from checkpoint; log details. |
| 32 | Tab query returns empty | `chrome.tabs.query` returns `[]` unexpectedly | (Silent — internal handling only) | Use fallback logic; do not block UI. |
| 33 | Popup fails to initialize | Uncaught exception in popup `DOMContentLoaded` handler | "Something went wrong loading Focus Mode. Click to retry." | Show minimal error UI with retry button. |
| 34 | Options page fails to load | Uncaught exception in options page init | "Settings page encountered an error. Please reload." | Show reload button; log error. |
| 35 | Network error during premium check | License validation API unreachable | "Could not verify your subscription. Premium features are temporarily available." | Fail open for short period; retry on next startup. |
| 36 | Storage listener error | `chrome.storage.onChanged` handler throws | (Silent — internal handling only) | Catch in handler; log; do not propagate. |
| 37 | Rule ID collision | Two blocklist entries generate the same `declarativeNetRequest` rule ID | "A blocking rule conflict was detected and automatically resolved." | Regenerate rule IDs; log the collision. |
| 38 | Content script DOM not ready | Content script runs before DOM is available | (Silent — auto-retry) | Use `document.readyState` check; defer to `DOMContentLoaded`. |

---

## 6. Error Boundary Patterns

Error boundaries prevent a failure in one part of the extension from taking down the entire component. Each pattern below shows the structure, what it catches, and how it recovers.

### 6.1 Popup Initialization Error Boundary

The popup is the user's primary interface. If it fails to render, the user cannot interact with the extension at all. This boundary catches any error during initialization and shows a minimal fallback UI.

```javascript
/**
 * popup-init.js — Wrap the entire popup initialization in an error boundary.
 *
 * Place this at the TOP of popup.js, before any other imports execute their
 * side effects.
 */

import { errorLog } from '../utils/logger.js';

async function initializePopup() {
  // All popup initialization code goes here:
  // - Read settings from storage
  // - Render blocklist
  // - Set up timer controls
  // - Bind event listeners
  // - Connect to service worker
  const { setupTimer } = await import('./timer-ui.js');
  const { setupBlocklist } = await import('./blocklist-ui.js');
  const { setupSettings } = await import('./settings-ui.js');

  await setupSettings();
  await setupBlocklist();
  await setupTimer();
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initializePopup();
  } catch (error) {
    errorLog('Popup', error, { phase: 'initialization' });
    showFallbackUI(error);
  }
});

function showFallbackUI(error) {
  const container = document.getElementById('app') || document.body;
  container.innerHTML = ''; // Clear partially rendered UI

  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = 'padding: 20px; text-align: center; font-family: system-ui;';
  errorDiv.innerHTML = `
    <h3 style="color: #d32f2f; margin-bottom: 12px;">Something went wrong</h3>
    <p style="color: #666; margin-bottom: 16px;">
      Focus Mode encountered an error while loading.
    </p>
    <button id="retry-btn" style="
      padding: 8px 20px;
      background: #1976d2;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    ">Retry</button>
    <button id="reset-btn" style="
      padding: 8px 20px;
      background: #fff;
      color: #d32f2f;
      border: 1px solid #d32f2f;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      margin-left: 8px;
    ">Reset Settings</button>
  `;

  container.appendChild(errorDiv);

  document.getElementById('retry-btn').addEventListener('click', () => {
    window.location.reload();
  });

  document.getElementById('reset-btn').addEventListener('click', async () => {
    try {
      const { runStartupRecovery } = await import('../utils/state-recovery.js');
      await runStartupRecovery();
      window.location.reload();
    } catch (e) {
      errorLog('Popup', e, { phase: 'reset-attempt' });
      alert('Reset failed. Please try reinstalling the extension.');
    }
  });
}
```

### 6.2 Service Worker Startup Error Boundary

The service worker is the backbone. If it fails to start, no blocking occurs, no timers run, and no messages are handled. This boundary ensures partial functionality even when initialization fails.

```javascript
/**
 * background.js — Service worker error boundary
 *
 * The service worker must NEVER throw an unhandled error at the top level,
 * because Chrome will mark it as failed and refuse to restart it until the
 * next browser launch.
 */

import { errorLog, debugLog } from '../utils/logger.js';
import { runStartupRecovery } from '../utils/state-recovery.js';

// ── Top-level unhandled error/rejection catchers ──
self.addEventListener('error', (event) => {
  errorLog('ServiceWorker', event.error || event.message, {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
  // Do NOT re-throw — prevent SW from crashing
});

self.addEventListener('unhandledrejection', (event) => {
  errorLog('ServiceWorker', event.reason || 'Unhandled rejection', {
    type: 'unhandledrejection',
  });
  event.preventDefault(); // Prevent Chrome from logging it as uncaught
});

// ── Initialization with recovery ──
async function initializeServiceWorker() {
  debugLog('ServiceWorker', 'Starting initialization...');

  // Phase 1: Storage recovery (must succeed for anything else to work)
  try {
    const recovery = await runStartupRecovery();
    debugLog('ServiceWorker', 'Recovery result:', recovery);
  } catch (error) {
    errorLog('ServiceWorker', error, { phase: 'storage-recovery' });
    // Continue anyway — defaults will be used
  }

  // Phase 2: Register message listeners (critical — without these, popup cannot communicate)
  try {
    const { registerMessageHandlers } = await import('./message-handlers.js');
    registerMessageHandlers();
  } catch (error) {
    errorLog('ServiceWorker', error, { phase: 'message-handlers' });
    // Install minimal fallback handler
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      errorLog('ServiceWorker', 'Fallback handler received message — primary handlers failed to load', { action: message?.action });
      sendResponse({ error: 'Service worker is in recovery mode' });
      return false;
    });
  }

  // Phase 3: Set up blocking rules (important but non-critical)
  try {
    const { syncBlockingRules } = await import('./blocking-rules.js');
    await syncBlockingRules();
  } catch (error) {
    errorLog('ServiceWorker', error, { phase: 'blocking-rules' });
    // Blocking will not work, but timer and UI are still functional
  }

  // Phase 4: Restore timer if there was an active session (non-critical)
  try {
    const { restoreTimerIfNeeded } = await import('./timer-manager.js');
    await restoreTimerIfNeeded();
  } catch (error) {
    errorLog('ServiceWorker', error, { phase: 'timer-restore' });
  }

  debugLog('ServiceWorker', 'Initialization complete');
}

// Kick off initialization — errors are caught inside
initializeServiceWorker();
```

### 6.3 Content Script Injection Error Boundary

Content scripts run on web pages where anything can go wrong: the page may have overridden globals, CSP may block inline scripts, or the DOM may be in an unexpected state.

```javascript
/**
 * content-script.js — Error boundary for content scripts
 *
 * Content scripts must be extremely defensive because:
 * 1. The host page may have modified built-in prototypes
 * 2. The page's CSP may restrict what we can do
 * 3. The DOM may not be in the expected state
 * 4. The page may unload at any moment
 */

(function contentScriptBoundary() {
  'use strict';

  // Capture built-ins before the page can tamper with them
  const _setTimeout = setTimeout;
  const _document = document;
  const _querySelector = Document.prototype.querySelector.bind(document);
  const _createElement = Document.prototype.createElement.bind(document);
  const _appendChild = Node.prototype.appendChild;

  function safeInit() {
    try {
      // Wait for DOM if not ready
      if (_document.readyState === 'loading') {
        _document.addEventListener('DOMContentLoaded', () => {
          try {
            main();
          } catch (error) {
            console.error('[FocusMode][Content] DOMContentLoaded handler failed:', error);
          }
        });
      } else {
        main();
      }
    } catch (error) {
      console.error('[FocusMode][Content] safeInit failed:', error);
    }
  }

  function main() {
    // Content script logic here: overlay rendering, DOM mutation, etc.
    // Each sub-operation is wrapped in its own try/catch.

    try {
      setupMessageListener();
    } catch (error) {
      console.error('[FocusMode][Content] Failed to set up message listener:', error);
    }

    try {
      renderBlockOverlayIfNeeded();
    } catch (error) {
      console.error('[FocusMode][Content] Failed to render block overlay:', error);
    }
  }

  function setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      try {
        handleMessage(message, sender, sendResponse);
      } catch (error) {
        console.error('[FocusMode][Content] Message handler error:', error);
        sendResponse({ error: error.message });
      }
      return true; // Keep channel open for async response
    });
  }

  function handleMessage(message, sender, sendResponse) {
    // Dispatch by action...
    sendResponse({ success: true });
  }

  function renderBlockOverlayIfNeeded() {
    // Safely create and inject overlay DOM
    // Uses captured built-ins to avoid prototype pollution
  }

  // ── Disconnection handling ──
  // If the service worker restarts and re-injects, detect and prevent duplicate overlays.
  if (window.__focusModeContentLoaded) {
    console.warn('[FocusMode][Content] Already loaded — skipping duplicate injection');
    return;
  }
  window.__focusModeContentLoaded = true;

  safeInit();
})();
```

### 6.4 Storage Operation Error Boundary

Wrap every storage read/write sequence in a transactional pattern. If any step fails, the entire operation is rolled back.

```javascript
/**
 * Transactional storage update pattern.
 *
 * Usage:
 *   await transactionalUpdate('blocklist', (currentList) => {
 *     return [...currentList, newEntry]; // return the new value
 *   });
 */

import { safeStorageGet, safeStorageSet } from '../utils/safe-chrome.js';
import { saveCheckpoint, restoreCheckpoint } from '../utils/state-recovery.js';
import { errorLog, debugLog } from '../utils/logger.js';

export async function transactionalUpdate(key, updateFn) {
  const checkpointId = `tx-${key}-${Date.now()}`;

  // 1. Read current value
  const currentValue = await safeStorageGet(key, null);

  // 2. Save checkpoint
  await saveCheckpoint(checkpointId, currentValue);

  // 3. Compute new value
  let newValue;
  try {
    newValue = await updateFn(currentValue);
  } catch (error) {
    errorLog('Transaction', error, { key, phase: 'compute' });
    return { success: false, error: 'Failed to compute new value' };
  }

  // 4. Write new value
  const writeSuccess = await safeStorageSet({ [key]: newValue });
  if (!writeSuccess) {
    // Attempt rollback
    errorLog('Transaction', 'Write failed — attempting rollback', { key });
    const checkpoint = await restoreCheckpoint(checkpointId);
    if (checkpoint.found) {
      await safeStorageSet({ [key]: checkpoint.state });
    }
    return { success: false, error: 'Storage write failed' };
  }

  // 5. Verify write
  const verifyValue = await safeStorageGet(key, null);
  if (JSON.stringify(verifyValue) !== JSON.stringify(newValue)) {
    errorLog('Transaction', 'Write verification failed — data mismatch', { key });
    const checkpoint = await restoreCheckpoint(checkpointId);
    if (checkpoint.found) {
      await safeStorageSet({ [key]: checkpoint.state });
    }
    return { success: false, error: 'Storage verification failed' };
  }

  debugLog('Transaction', `Successfully updated "${key}"`);
  return { success: true, value: newValue };
}
```

### 6.5 Timer Operation Error Boundary

The timer is the most crash-sensitive component. It must survive service worker termination, alarm loss, and clock drift.

```javascript
/**
 * timer-boundary.js — Resilient timer operations
 *
 * The timer uses a layered approach:
 * 1. Primary: chrome.alarms for wake-up scheduling
 * 2. Secondary: endTime in storage for state recovery
 * 3. Tertiary: periodic self-check alarm to detect lost timers
 */

import { safeStorageGet, safeStorageSet, safeCreateAlarm } from '../utils/safe-chrome.js';
import { saveCheckpoint, restoreCheckpoint } from '../utils/state-recovery.js';
import { errorLog, debugLog } from '../utils/logger.js';

const TIMER_ALARM_NAME = 'focus-timer-end';
const WATCHDOG_ALARM_NAME = 'focus-timer-watchdog';
const WATCHDOG_INTERVAL_MINUTES = 1;

export async function startTimerSafe(durationMinutes) {
  const endTime = Date.now() + durationMinutes * 60 * 1000;

  // Save checkpoint of current timer state before modifying
  const currentState = await safeStorageGet('timerState', {});
  await saveCheckpoint('timer-start', currentState);

  // Write new timer state
  const newState = {
    isRunning: true,
    endTime,
    duration: durationMinutes,
    pausedAt: null,
    totalPausedMs: 0,
    startedAt: Date.now(),
  };

  const saved = await safeStorageSet({ timerState: newState });
  if (!saved) {
    errorLog('Timer', 'Failed to save timer state');
    const cp = await restoreCheckpoint('timer-start');
    if (cp.found) await safeStorageSet({ timerState: cp.state });
    return { success: false, error: 'Could not save timer state' };
  }

  // Create primary alarm
  const alarmCreated = await safeCreateAlarm(TIMER_ALARM_NAME, {
    delayInMinutes: durationMinutes,
  });

  if (!alarmCreated) {
    errorLog('Timer', 'Failed to create timer alarm — falling back to watchdog only');
    // Timer will still work via watchdog checking endTime
  }

  // Create watchdog alarm that fires every minute
  await safeCreateAlarm(WATCHDOG_ALARM_NAME, {
    delayInMinutes: WATCHDOG_INTERVAL_MINUTES,
    periodInMinutes: WATCHDOG_INTERVAL_MINUTES,
  });

  debugLog('Timer', `Started: ${durationMinutes}min, ends at ${new Date(endTime).toISOString()}`);
  return { success: true, endTime };
}

/**
 * Watchdog handler — called by chrome.alarms.onAlarm for the watchdog alarm.
 * Checks if the timer should have ended and handles it.
 */
export async function handleWatchdog() {
  try {
    const timerState = await safeStorageGet('timerState', { isRunning: false });
    if (!timerState.isRunning) {
      // Timer not active — clear watchdog
      await chrome.alarms.clear(WATCHDOG_ALARM_NAME);
      return;
    }

    if (timerState.endTime && Date.now() >= timerState.endTime) {
      debugLog('Timer', 'Watchdog detected timer expiry — triggering completion');
      await handleTimerComplete();
    }
  } catch (error) {
    errorLog('Timer', error, { phase: 'watchdog' });
  }
}

async function handleTimerComplete() {
  // Timer completion logic (notification, stats update, rule cleanup)
  // Each step is independently error-handled
  try {
    await safeStorageSet({
      timerState: {
        isRunning: false,
        endTime: null,
        duration: null,
        pausedAt: null,
        totalPausedMs: 0,
      },
    });
  } catch (error) {
    errorLog('Timer', error, { phase: 'completion-state-reset' });
  }

  try {
    await chrome.alarms.clear(TIMER_ALARM_NAME);
    await chrome.alarms.clear(WATCHDOG_ALARM_NAME);
  } catch (error) {
    errorLog('Timer', error, { phase: 'completion-alarm-cleanup' });
  }
}
```

### 6.6 Nuclear Option Error Boundary

When everything else fails, the nuclear option resets the extension to a known-good state. This is the last resort, triggered by the user or by detecting that the extension is in an unrecoverable state (e.g., multiple restart loops, persistent storage corruption that auto-repair cannot fix).

```javascript
/**
 * nuclear-reset.js — Last resort: full extension reset
 *
 * Clears ALL storage, removes ALL dynamic rules, cancels ALL alarms,
 * and closes ALL offscreen documents. The extension restarts as if
 * freshly installed.
 *
 * This is exposed to the user via the options page "Reset Everything" button
 * and can be triggered programmatically if startup recovery fails 3+ times.
 */

import { errorLog } from '../utils/logger.js';
import { STORAGE_DEFAULTS } from '../utils/state-recovery.js';

const PREFIX = '[FocusMode][Nuclear]';

/**
 * Completely reset the extension. Returns a report of what was cleaned.
 *
 * @param {{ preservePremium?: boolean }} options
 * @returns {Promise<{ success: boolean, report: Object }>}
 */
export async function nuclearReset(options = {}) {
  const report = {
    storageCleared: false,
    rulesRemoved: 0,
    alarmsCleared: false,
    offscreenClosed: false,
    errors: [],
  };

  console.warn(`${PREFIX} === NUCLEAR RESET INITIATED ===`);

  // 1. Preserve premium status if requested
  let premiumStatus = false;
  if (options.preservePremium) {
    try {
      const result = await chrome.storage.local.get('isPremium');
      premiumStatus = result.isPremium === true;
    } catch {
      // Ignore — will default to false
    }
  }

  // 2. Clear all storage
  try {
    await chrome.storage.local.clear();
    report.storageCleared = true;
    console.log(`${PREFIX} Storage cleared`);
  } catch (error) {
    report.errors.push(`Storage clear failed: ${error.message}`);
    errorLog('Nuclear', error, { phase: 'storage-clear' });
  }

  // 3. Remove all dynamic declarativeNetRequest rules
  try {
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    if (existingRules.length > 0) {
      const ruleIds = existingRules.map(r => r.id);
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: ruleIds,
      });
      report.rulesRemoved = ruleIds.length;
      console.log(`${PREFIX} Removed ${ruleIds.length} dynamic rules`);
    }
  } catch (error) {
    report.errors.push(`Rule removal failed: ${error.message}`);
    errorLog('Nuclear', error, { phase: 'rule-removal' });
  }

  // 4. Clear all alarms
  try {
    await chrome.alarms.clearAll();
    report.alarmsCleared = true;
    console.log(`${PREFIX} All alarms cleared`);
  } catch (error) {
    report.errors.push(`Alarm clear failed: ${error.message}`);
    errorLog('Nuclear', error, { phase: 'alarm-clear' });
  }

  // 5. Close offscreen documents
  try {
    if (typeof chrome.offscreen?.closeDocument === 'function') {
      await chrome.offscreen.closeDocument();
      report.offscreenClosed = true;
      console.log(`${PREFIX} Offscreen document closed`);
    }
  } catch (error) {
    // "No offscreen document" is not an error
    if (!error?.message?.includes('No current offscreen')) {
      report.errors.push(`Offscreen close failed: ${error.message}`);
      errorLog('Nuclear', error, { phase: 'offscreen-close' });
    }
  }

  // 6. Re-initialize with defaults
  try {
    const defaults = { ...STORAGE_DEFAULTS };
    if (options.preservePremium) {
      defaults.isPremium = premiumStatus;
    }
    await chrome.storage.local.set(defaults);
    console.log(`${PREFIX} Defaults restored`);
  } catch (error) {
    report.errors.push(`Default restoration failed: ${error.message}`);
    errorLog('Nuclear', error, { phase: 'defaults-restore' });
  }

  report.success = report.errors.length === 0;
  console.warn(`${PREFIX} === NUCLEAR RESET COMPLETE ===`, report);
  return { success: report.success, report };
}

/**
 * Auto-trigger nuclear reset if startup recovery fails repeatedly.
 * Called from the service worker's startup sequence.
 */
export async function checkRecoveryLoopAndReset() {
  const RECOVERY_FAIL_KEY = '__recoveryFailCount';
  const MAX_RECOVERY_FAILS = 3;

  try {
    const result = await chrome.storage.local.get(RECOVERY_FAIL_KEY);
    const failCount = result[RECOVERY_FAIL_KEY] || 0;

    if (failCount >= MAX_RECOVERY_FAILS) {
      console.error(`${PREFIX} Recovery has failed ${failCount} times — triggering nuclear reset`);
      await nuclearReset({ preservePremium: true });
      return true; // Reset was triggered
    }

    return false;
  } catch {
    // If we cannot even read storage, trigger reset
    console.error(`${PREFIX} Cannot read storage — triggering nuclear reset`);
    await nuclearReset();
    return true;
  }
}

export async function incrementRecoveryFailCount() {
  try {
    const RECOVERY_FAIL_KEY = '__recoveryFailCount';
    const result = await chrome.storage.local.get(RECOVERY_FAIL_KEY);
    const count = (result[RECOVERY_FAIL_KEY] || 0) + 1;
    await chrome.storage.local.set({ [RECOVERY_FAIL_KEY]: count });
  } catch {
    // Nothing we can do
  }
}

export async function clearRecoveryFailCount() {
  try {
    await chrome.storage.local.remove('__recoveryFailCount');
  } catch {
    // Ignore
  }
}
```

---

## 7. Code Hardening Checklist

Each item is a specific, actionable hardening measure. Items are organized by component and marked with priority: **(P0)** = must-have before release, **(P1)** = should-have, **(P2)** = nice-to-have.

### 7.1 Service Worker (background.js)

| # | Priority | Hardening Item | Details |
|---|----------|---------------|---------|
| 1 | P0 | Add global `error` event listener | `self.addEventListener('error', ...)` to catch synchronous throws. Prevent SW crash. |
| 2 | P0 | Add global `unhandledrejection` listener | `self.addEventListener('unhandledrejection', ...)` with `event.preventDefault()`. |
| 3 | P0 | Wrap `chrome.runtime.onInstalled` in try/catch | This is where schema migration runs. A crash here prevents the extension from ever initializing. |
| 4 | P0 | Wrap `chrome.alarms.onAlarm` handler in try/catch | Alarms are the heartbeat. An unhandled error here kills the timer. |
| 5 | P0 | Wrap `chrome.runtime.onMessage` handler in try/catch | And always call `sendResponse` even on error, to prevent "message port closed" errors in the sender. |
| 6 | P0 | Always return `true` from `onMessage` when responding asynchronously | Forgetting this causes the port to close before the async response is sent. |
| 7 | P1 | Re-register alarms on SW wake-up | Check stored `timerState.endTime` against current time; re-create alarm if missing. |
| 8 | P1 | Implement watchdog alarm | A periodic alarm (every 1 min) that verifies the primary timer alarm still exists. |
| 9 | P1 | Guard against duplicate `onInstalled` handling | Store a flag to prevent re-running install logic if the event fires multiple times. |
| 10 | P1 | Validate all incoming messages | Check `message.action` exists and is a known string before dispatching. Reject unknown actions with an error response. |
| 11 | P2 | Log SW lifecycle events | Log when the SW starts, when it receives `onInstalled`, and when it handles alarms, for debugging timing issues. |
| 12 | P2 | Implement heartbeat storage write | Write `lastActiveTimestamp` to storage periodically so the popup can detect if the SW has been dormant too long. |

### 7.2 Popup

| # | Priority | Hardening Item | Details |
|---|----------|---------------|---------|
| 13 | P0 | Wrap `DOMContentLoaded` handler in try/catch | Show fallback error UI on failure instead of a blank popup. |
| 14 | P0 | Use `textContent` instead of `innerHTML` for user data | Never inject user-supplied text (blocklist entries, custom messages) via `innerHTML`. |
| 15 | P0 | Validate all storage reads | Never assume `chrome.storage.local.get` returns the expected shape. Always merge with defaults. |
| 16 | P0 | Handle `safeSendMessage` returning `null` | The service worker may be dormant. Show a "reconnecting" state, not a blank screen. |
| 17 | P1 | Debounce rapid user actions | Prevent double-clicks on "Start Focus" from creating duplicate timers. Disable the button during async operations. |
| 18 | P1 | Show loading states during async operations | Display a spinner or disable buttons while waiting for storage/messaging responses. |
| 19 | P1 | Validate user input before sending to SW | Run `validateUrl`, `validateTimerDuration`, etc. in the popup and show inline errors. Do not rely solely on SW-side validation. |
| 20 | P1 | Handle popup close during async operations | Use `chrome.storage.local` for pending state rather than in-memory variables that die with the popup. |
| 21 | P2 | Add retry logic for failed SW communication | If `safeSendMessage` returns null, retry up to 3 times with 200ms delay before showing an error. |
| 22 | P2 | Prevent XSS in dynamically generated HTML | If using template strings to build DOM, escape all interpolated values. Prefer `createElement` + `textContent`. |

### 7.3 Content Scripts

| # | Priority | Hardening Item | Details |
|---|----------|---------------|---------|
| 23 | P0 | Wrap entire content script in IIFE | Prevent variable leakage to the host page and protect against prototype pollution. |
| 24 | P0 | Capture built-in functions at load time | Store references to `document.createElement`, `setTimeout`, `querySelector` before host page can modify them. |
| 25 | P0 | Guard against duplicate injection | Use a `window.__focusModeContentLoaded` flag. The SW may re-inject on update or navigation. |
| 26 | P0 | Wrap `chrome.runtime.onMessage` listener in try/catch | And always call `sendResponse` to avoid port errors. |
| 27 | P1 | Handle extension context invalidation | After an extension update, `chrome.runtime` calls will throw "Extension context invalidated". Detect this and clean up the overlay. |
| 28 | P1 | Use Shadow DOM for overlay elements | Prevents host page CSS from breaking the block overlay. |
| 29 | P1 | Check `document.readyState` before DOM manipulation | If `loading`, defer to `DOMContentLoaded`. If `interactive` or `complete`, proceed. |
| 30 | P2 | Minimize DOM mutations | Batch overlay creation into a single `DocumentFragment` append to avoid triggering host page `MutationObserver` callbacks excessively. |

### 7.4 Storage

| # | Priority | Hardening Item | Details |
|---|----------|---------------|---------|
| 31 | P0 | Always provide default values to `safeStorageGet` | Never let `undefined` propagate to business logic. |
| 32 | P0 | Validate data types after reading from storage | Storage can be corrupted by bugs, other extensions (if keys collide), or manual Chrome DevTools edits. |
| 33 | P0 | Use `safeStorageSet` for all writes | Never call `chrome.storage.local.set` directly. |
| 34 | P0 | Run `validateStorageIntegrity` on every SW startup | Detect and repair corruption before any business logic runs. |
| 35 | P1 | Implement transactional updates for multi-key writes | Use `saveCheckpoint` / `restoreCheckpoint` for operations that modify multiple keys. |
| 36 | P1 | Enforce storage quota awareness | Before large writes (import, stats), check `getBytesInUse` and warn if above 80% quota. |
| 37 | P1 | Handle `chrome.storage.onChanged` errors | Wrap the listener body in try/catch. A crash here can affect all storage-listening components. |
| 38 | P2 | Log all storage writes in debug mode | Use `debugLog('Storage', 'SET', key, value)` for every write to aid debugging. |

### 7.5 Messaging

| # | Priority | Hardening Item | Details |
|---|----------|---------------|---------|
| 39 | P0 | Always call `sendResponse` in `onMessage` handlers | Even if responding with an error. Uncalled `sendResponse` causes "message port closed" errors on the sending side. |
| 40 | P0 | Validate `message.action` before dispatching | Reject unknown actions with `{ error: 'Unknown action' }` instead of silently ignoring. |
| 41 | P0 | Handle `safeSendMessage` returning `null` at every call site | null means the SW is unavailable. Every caller must have a fallback. |
| 42 | P1 | Add timeout to message-based operations | If the SW does not respond within 5 seconds, treat it as a failure. Use `Promise.race` with a timeout. |
| 43 | P1 | Rate-limit outgoing messages from content scripts | A rogue page could trigger hundreds of messages. Throttle to max 10/second. |
| 44 | P2 | Log message round-trip timing in debug mode | Helps identify slow handlers and message bottlenecks. |

### 7.6 DeclarativeNetRequest

| # | Priority | Hardening Item | Details |
|---|----------|---------------|---------|
| 45 | P0 | Generate deterministic rule IDs from domain | Use a hash function to map domain strings to integer IDs. Prevents collisions and enables idempotent updates. |
| 46 | P0 | Batch rule updates | Never call `updateDynamicRules` in a loop. Collect all add/remove operations and execute once. |
| 47 | P0 | Validate rule count before adding | Check `getDynamicRules().length` against the 5000 rule limit. Reject additions that would exceed it. |
| 48 | P1 | Remove rules before adding when updating | Always include `removeRuleIds` for domains being updated. Prevents orphaned rules. |
| 49 | P1 | Verify rules after update | After `updateDynamicRules`, call `getDynamicRules` and verify the expected rules exist. |
| 50 | P2 | Log rule count on every update | Helps catch rule leaks (rules accumulating without being cleaned up). |

### 7.7 Offscreen Document

| # | Priority | Hardening Item | Details |
|---|----------|---------------|---------|
| 51 | P0 | Check `hasDocument` before creating | Prevent "Only a single offscreen document" errors. |
| 52 | P0 | Handle offscreen creation failure gracefully | If audio playback offscreen document cannot be created, disable sound but keep timer working. |
| 53 | P1 | Implement offscreen document health check | Periodically verify the offscreen document is still alive; re-create if needed. |

### 7.8 General / Cross-Cutting

| # | Priority | Hardening Item | Details |
|---|----------|---------------|---------|
| 54 | P0 | Never use `eval()` or `new Function()` | MV3 CSP prohibits it and it is a security risk. |
| 55 | P0 | Freeze exported configuration objects | Use `Object.freeze()` on constants like `STORAGE_DEFAULTS` to prevent accidental mutation. |
| 56 | P0 | Use strict mode in all modules | ES modules are strict by default, but verify IIFE-wrapped content scripts include `'use strict'`. |
| 57 | P1 | Implement feature flags for gradual rollout | Gate new features behind storage flags so they can be disabled without a new release. |
| 58 | P1 | Add version number to all error logs | Include `chrome.runtime.getManifest().version` in error context for debugging across versions. |
| 59 | P2 | Implement "Export Debug Info" in options page | Let users export the error buffer and storage health report for bug reports. |
| 60 | P2 | Add automated integration tests for recovery scenarios | Test: corrupt storage, missing alarms, stale timer, schema migration, nuclear reset. |

---

## Summary

This specification provides five production-ready utility modules and two comprehensive reference guides:

| Deliverable | File | Purpose |
|---|---|---|
| Defensive Utility Library | `src/utils/safe-chrome.js` | 12 safe Chrome API wrappers with error handling, logging, and sensible defaults |
| Input Validation Library | `src/utils/validators.js` | 8 validators covering URLs, blocklist entries, settings, imports, timers, and schedules |
| State Recovery System | `src/utils/state-recovery.js` | Checkpointing, integrity validation, corruption repair, schema migration, and health reporting |
| Debug Logger | `src/utils/logger.js` | Conditional logging with error buffering, performance measurement, and debug snapshot export |
| Error Messages | Section 5 (this document) | 38 error-to-message mappings with recovery actions |
| Error Boundaries | Section 6 (this document) | 6 boundary patterns covering every extension component |
| Hardening Checklist | Section 7 (this document) | 60 specific items organized by component and priority |

All modules are designed to work together: `safe-chrome.js` has no dependencies (loads in any context), `validators.js` is pure logic (no Chrome APIs), `state-recovery.js` depends on both, and `logger.js` is standalone. Error boundaries import from these utilities as needed.
