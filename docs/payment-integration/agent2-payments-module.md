# Payments Module Specification -- Focus Mode - Blocker

> **Agent 2 -- Phase 09: Extension Payment Integration**
> Module: `src/shared/payments.js`
> Status: Production-Ready Specification

---

## 1. Module Overview

The `payments.js` module is the single source of truth for all payment and licensing functionality in Focus Mode - Blocker. It handles:

- License key verification with the Zovo API
- Three-level local caching with offline fallback
- Feature-level access checks per tier
- Paywall event logging (triggers drip email sequences)
- Analytics event tracking with offline queuing
- Upgrade page navigation with referral tracking

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Single module for all payment logic | Prevents scattered license checks across codebase |
| In-memory cache as first check | Avoids async storage reads on every feature gate |
| 7-day offline grace period | Users should not lose access during travel or connectivity issues |
| `chrome.storage.sync` for license key | Key follows user across devices via Chrome profile |
| `chrome.storage.local` for cache | Cache is device-specific, avoids sync quota issues |
| `chrome.storage.session` for session ID | Survives service worker restarts but clears on browser close |

---

## 2. Complete payments.js Implementation

Below is the full production-ready `src/shared/payments.js` module.

```javascript
/**
 * Focus Mode - Blocker -- Payment & License Integration
 * Connects to Zovo unified payment system
 *
 * Usage:
 *   import { isPro, hasFeature, verifyLicense } from './payments.js';
 *
 *   if (!await hasFeature('unlimited_sites')) {
 *     showPaywall('Unlimited Sites');
 *   }
 */

// =============================================================================
// Constants
// =============================================================================

const ZOVO_API_BASE = 'https://xggdjlurppfcytxqoozs.supabase.co/functions/v1';
const EXTENSION_ID = 'focus_mode_blocker';
const CACHE_DURATION_MS = 5 * 60 * 1000;           // 5 minutes in-memory
const STORAGE_CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours storage
const OFFLINE_GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const LICENSE_KEY_REGEX = /^ZOVO-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ANALYTICS_QUEUE_SIZE = 100;
const ANALYTICS_FLUSH_INTERVAL_MS = 60 * 1000; // 1 minute

// =============================================================================
// In-Memory Cache (Level 1)
// =============================================================================

let _memoryCache = null;
let _memoryCacheTimestamp = 0;
let _analyticsFlushTimer = null;

/**
 * Returns the in-memory cached license data if it has not expired.
 * @returns {object|null} Cached license data or null if expired/missing.
 */
function getMemoryCache() {
  if (!_memoryCache) return null;
  if (Date.now() - _memoryCacheTimestamp > CACHE_DURATION_MS) {
    _memoryCache = null;
    _memoryCacheTimestamp = 0;
    return null;
  }
  return _memoryCache;
}

/**
 * Stores license data in the in-memory cache with a fresh timestamp.
 * @param {object} data - The license data to cache.
 */
function setMemoryCache(data) {
  _memoryCache = data;
  _memoryCacheTimestamp = Date.now();
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Validates that a license key matches the expected ZOVO format.
 * Format: ZOVO-XXXX-XXXX-XXXX-XXXX where X is uppercase alphanumeric.
 * @param {string} key - The license key to validate.
 * @returns {boolean} True if the key matches the expected format.
 */
export function isValidLicenseFormat(key) {
  if (typeof key !== 'string') return false;
  return LICENSE_KEY_REGEX.test(key.trim().toUpperCase());
}

/**
 * Validates that a string is a plausible email address.
 * @param {string} email - The email address to validate.
 * @returns {boolean} True if the email format is valid.
 */
export function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Checks whether the browser currently has network connectivity.
 * @returns {boolean} True if the browser reports being online.
 */
export function isOnline() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Returns a promise that resolves after the given number of milliseconds.
 * @param {number} ms - Milliseconds to wait.
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Returns a default free-tier license data object.
 * Used as the fallback when no valid license is available.
 * @returns {object} Free tier license data.
 */
function freeTierData() {
  return {
    valid: false,
    tier: 'free',
    email: null,
    features: [],
    cachedAt: Date.now(),
    lastVerifiedAt: null,
    expiresAt: null,
  };
}

// =============================================================================
// Fetch with Retry (Exponential Backoff)
// =============================================================================

/**
 * Performs a fetch request with automatic retry on failure or rate limiting.
 * Uses exponential backoff: 1s, 2s, 4s between retries.
 *
 * @param {string} url - The URL to fetch.
 * @param {RequestInit} options - Fetch options (method, headers, body, etc.).
 * @param {number} [maxRetries=3] - Maximum number of attempts.
 * @returns {Promise<Response>} The fetch Response object.
 * @throws {Error} If all retries are exhausted.
 */
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);

      // On rate limiting, wait and retry
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitMs = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : Math.pow(2, i) * 1000;
        await delay(waitMs);
        continue;
      }

      return response;
    } catch (error) {
      // Network error -- retry unless this was the last attempt
      if (i === maxRetries - 1) throw error;
      await delay(Math.pow(2, i) * 1000);
    }
  }

  // Should not reach here, but safeguard
  throw new Error('fetchWithRetry: all retries exhausted');
}

// =============================================================================
// Storage Cache (Level 2) -- chrome.storage.local
// =============================================================================

/**
 * Reads the cached license data from chrome.storage.local.
 * Returns null if no cache exists or if the cache has expired beyond the
 * storage TTL (24 hours) AND the offline grace period (7 days from last
 * successful verification).
 *
 * @returns {Promise<object|null>} Cached license data or null.
 */
async function getStorageCache() {
  try {
    const result = await chrome.storage.local.get('zovoLicense');
    const cached = result.zovoLicense;

    if (!cached) return null;

    const now = Date.now();

    // Check if storage cache is still fresh (24 hours)
    if (now - cached.cachedAt <= STORAGE_CACHE_DURATION_MS) {
      return cached;
    }

    // Storage cache is stale, but check offline grace period
    // If last successful verification was within 7 days, still allow it
    if (
      cached.lastVerifiedAt &&
      now - cached.lastVerifiedAt <= OFFLINE_GRACE_PERIOD_MS
    ) {
      return cached;
    }

    // Cache is fully expired
    return null;
  } catch (error) {
    console.warn('[FocusBlocker Payments] Failed to read storage cache:', error);
    return null;
  }
}

/**
 * Writes license data to chrome.storage.local with current timestamps.
 *
 * @param {object} data - The license data to persist.
 * @returns {Promise<void>}
 */
async function setStorageCache(data) {
  try {
    const cacheEntry = {
      ...data,
      cachedAt: Date.now(),
    };
    await chrome.storage.local.set({ zovoLicense: cacheEntry });
  } catch (error) {
    console.warn('[FocusBlocker Payments] Failed to write storage cache:', error);
  }
}

/**
 * Removes the cached license data from chrome.storage.local.
 * @returns {Promise<void>}
 */
async function clearStorageCacheInternal() {
  try {
    await chrome.storage.local.remove('zovoLicense');
  } catch (error) {
    console.warn('[FocusBlocker Payments] Failed to clear storage cache:', error);
  }
}

// =============================================================================
// Core License Functions
// =============================================================================

/**
 * Verifies a license key through the three-level cache hierarchy:
 *
 *   Level 1: In-memory cache (5 min TTL)
 *     -> miss ->
 *   Level 2: chrome.storage.local cache (24 hr TTL)
 *     -> miss ->
 *   Level 3: API call to verify-extension-license
 *     -> failure ->
 *   Level 4: Offline grace (7-day window from last successful verify)
 *     -> expired ->
 *   Level 5: Free tier fallback
 *
 * @param {string} licenseKey - The ZOVO license key to verify.
 * @param {boolean} [forceRefresh=false] - If true, skip caches and call API directly.
 * @returns {Promise<object>} License verification result with shape:
 *   { valid, tier, email, features, cachedAt, lastVerifiedAt, expiresAt }
 */
export async function verifyLicense(licenseKey, forceRefresh = false) {
  // Validate key format first
  if (!licenseKey || !isValidLicenseFormat(licenseKey)) {
    return freeTierData();
  }

  const normalizedKey = licenseKey.trim().toUpperCase();

  // ---- Level 1: In-memory cache ----
  if (!forceRefresh) {
    const memCached = getMemoryCache();
    if (memCached && memCached.valid) {
      return memCached;
    }
  }

  // ---- Level 2: Storage cache ----
  if (!forceRefresh) {
    const storageCached = await getStorageCache();
    if (storageCached && storageCached.valid) {
      // Promote to memory cache
      setMemoryCache(storageCached);
      return storageCached;
    }
  }

  // ---- Level 3: API call ----
  if (!isOnline()) {
    // Skip API call if offline, fall through to grace period check
    return await handleOfflineFallback();
  }

  try {
    const response = await fetchWithRetry(
      `${ZOVO_API_BASE}/verify-extension-license`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          licenseKey: normalizedKey,
          extensionId: EXTENSION_ID,
        }),
      }
    );

    if (response.ok) {
      const result = await response.json();
      const licenseData = {
        valid: result.valid === true,
        tier: result.tier || 'free',
        email: result.email || null,
        features: Array.isArray(result.features) ? result.features : [],
        cachedAt: Date.now(),
        lastVerifiedAt: Date.now(),
        expiresAt: result.expiresAt || null,
      };

      // Update both cache levels
      setMemoryCache(licenseData);
      await setStorageCache(licenseData);

      return licenseData;
    }

    // Handle specific HTTP error statuses
    if (response.status === 401) {
      // Invalid or revoked license -- clear everything and return free tier
      const freeData = freeTierData();
      setMemoryCache(freeData);
      await setStorageCache(freeData);
      return freeData;
    }

    if (response.status === 429) {
      // Rate limited -- fetchWithRetry already retried, fall back to cache
      console.warn('[FocusBlocker Payments] Rate limited after retries, using cache');
      return await handleOfflineFallback();
    }

    if (response.status >= 500) {
      // Server error -- use cache if available
      console.warn('[FocusBlocker Payments] Server error', response.status, '-- using cache');
      return await handleOfflineFallback();
    }

    // Other errors -- return free tier
    return freeTierData();
  } catch (error) {
    // Network error -- use offline fallback
    console.warn('[FocusBlocker Payments] Network error during verification:', error.message);
    return await handleOfflineFallback();
  }
}

/**
 * Handles the offline / API-failure fallback path.
 * Checks storage cache for a still-valid offline grace period.
 * Returns free tier data if grace period is expired or no cache exists.
 *
 * @returns {Promise<object>} Cached license data or free tier fallback.
 */
async function handleOfflineFallback() {
  try {
    const result = await chrome.storage.local.get('zovoLicense');
    const cached = result.zovoLicense;

    if (!cached || !cached.lastVerifiedAt) {
      return freeTierData();
    }

    const now = Date.now();

    // ---- Level 4: Offline grace period (7 days) ----
    if (now - cached.lastVerifiedAt <= OFFLINE_GRACE_PERIOD_MS) {
      // Still within grace period -- trust cached data
      setMemoryCache(cached);
      return cached;
    }

    // ---- Level 5: Grace period expired -- downgrade to free ----
    console.warn('[FocusBlocker Payments] Offline grace period expired, downgrading to free tier');
    const freeData = freeTierData();
    setMemoryCache(freeData);
    return freeData;
  } catch (error) {
    console.warn('[FocusBlocker Payments] Failed to read offline cache:', error);
    return freeTierData();
  }
}

/**
 * Checks if the current user has any active paid license (pro, lifetime, or team).
 * Reads the stored license key and verifies it through the cache hierarchy.
 *
 * @returns {Promise<boolean>} True if the user has a valid paid license.
 */
export async function isPro() {
  const key = await getLicenseKey();
  if (!key) return false;

  const result = await verifyLicense(key);
  return result.valid && result.tier !== 'free';
}

/**
 * Returns the current user's subscription tier.
 * Possible values: 'free', 'pro', 'lifetime', 'team'.
 *
 * @returns {Promise<string>} The current tier string.
 */
export async function getTier() {
  const key = await getLicenseKey();
  if (!key) return 'free';

  const result = await verifyLicense(key);
  return result.tier || 'free';
}

/**
 * Checks whether the current license grants access to a specific feature.
 *
 * @param {string} featureName - The feature identifier to check (e.g., 'unlimited_sites').
 * @returns {Promise<boolean>} True if the feature is available to the current user.
 */
export async function hasFeature(featureName) {
  if (!featureName || typeof featureName !== 'string') return false;

  const key = await getLicenseKey();
  if (!key) return false;

  const result = await verifyLicense(key);
  if (!result.valid || !Array.isArray(result.features)) return false;

  return result.features.includes(featureName);
}

/**
 * Returns the full array of features available to the current user.
 * Returns an empty array for free tier users or if no license is stored.
 *
 * @returns {Promise<string[]>} Array of feature identifier strings.
 */
export async function getFeatures() {
  const key = await getLicenseKey();
  if (!key) return [];

  const result = await verifyLicense(key);
  return Array.isArray(result.features) ? result.features : [];
}

// =============================================================================
// License Management
// =============================================================================

/**
 * Validates a license key format, verifies it with the API, and stores it
 * in chrome.storage.sync so it persists across the user's Chrome devices.
 *
 * @param {string} licenseKey - The license key to store.
 * @returns {Promise<object>} Result object: { success, data?, error? }
 *   On success: { success: true, data: <license verification result> }
 *   On failure: { success: false, error: <error message string> }
 */
export async function storeLicenseKey(licenseKey) {
  if (!licenseKey || typeof licenseKey !== 'string') {
    return { success: false, error: 'License key is required.' };
  }

  const normalizedKey = licenseKey.trim().toUpperCase();

  // Validate format
  if (!isValidLicenseFormat(normalizedKey)) {
    return {
      success: false,
      error: 'Invalid license key format. Expected: ZOVO-XXXX-XXXX-XXXX-XXXX',
    };
  }

  // Verify with API before storing
  const verification = await verifyLicense(normalizedKey, true);

  if (!verification.valid) {
    return {
      success: false,
      error: 'License key could not be verified. Please check the key and try again.',
    };
  }

  // Store in sync storage so it follows the user across devices
  try {
    await chrome.storage.sync.set({ licenseKey: normalizedKey });
  } catch (error) {
    console.error('[FocusBlocker Payments] Failed to store license key:', error);
    return { success: false, error: 'Failed to save license key to storage.' };
  }

  // Track activation event
  await trackEvent('license_activated', {
    tier: verification.tier,
  });

  return { success: true, data: verification };
}

/**
 * Retrieves the stored license key from chrome.storage.sync.
 *
 * @returns {Promise<string|null>} The stored license key, or null if none exists.
 */
export async function getLicenseKey() {
  try {
    const result = await chrome.storage.sync.get('licenseKey');
    return result.licenseKey || null;
  } catch (error) {
    console.warn('[FocusBlocker Payments] Failed to retrieve license key:', error);
    return null;
  }
}

/**
 * Clears all cached license data from both memory and local storage.
 * Does NOT remove the license key itself from sync storage.
 * Use this to force a fresh verification on next access.
 *
 * @returns {Promise<void>}
 */
export async function clearLicenseCache() {
  // Clear Level 1: memory
  _memoryCache = null;
  _memoryCacheTimestamp = 0;

  // Clear Level 2: local storage
  await clearStorageCacheInternal();
}

/**
 * Full license removal: clears the license key from sync storage,
 * wipes all cached data, and resets to free tier.
 * Use this for user-initiated logout or license deactivation.
 *
 * @returns {Promise<void>}
 */
export async function removeLicense() {
  // Track deactivation before clearing
  try {
    await trackEvent('license_deactivated', {
      tier: _memoryCache?.tier || 'unknown',
    });
  } catch (_) {
    // Best effort -- do not block removal on analytics
  }

  // Clear the license key from sync storage
  try {
    await chrome.storage.sync.remove('licenseKey');
  } catch (error) {
    console.warn('[FocusBlocker Payments] Failed to remove license key:', error);
  }

  // Clear all caches
  await clearLicenseCache();

  // Clear analytics session
  try {
    await chrome.storage.session.remove('zovoSessionId');
  } catch (_) {
    // Session storage may not be available in all contexts
  }
}

// =============================================================================
// Paywall Integration
// =============================================================================

/**
 * Logs a paywall hit event to the Zovo API. This triggers drip email
 * sequences to encourage conversion from free to paid tier.
 *
 * @param {string} email - The user's email address for drip sequence targeting.
 * @param {string} featureAttempted - The feature the user tried to access (e.g., 'unlimited_sites').
 * @returns {Promise<object>} Result: { success: boolean, error?: string }
 */
export async function logPaywallHit(email, featureAttempted) {
  if (!email || !isValidEmail(email)) {
    return { success: false, error: 'Valid email is required.' };
  }

  if (!featureAttempted || typeof featureAttempted !== 'string') {
    return { success: false, error: 'Feature name is required.' };
  }

  // Track locally regardless of API success
  await trackEvent('paywall_hit', {
    feature: featureAttempted,
    email: email.trim(),
  });

  // Send to API for drip sequence
  if (!isOnline()) {
    // Queue for later sending
    await queueAnalyticsEvent({
      type: 'paywall_hit',
      email: email.trim(),
      feature: featureAttempted,
      extensionId: EXTENSION_ID,
      timestamp: Date.now(),
    });
    return { success: true }; // Queued for later
  }

  try {
    const response = await fetchWithRetry(
      `${ZOVO_API_BASE}/log-paywall-hit`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          feature: featureAttempted,
          extensionId: EXTENSION_ID,
          timestamp: Date.now(),
        }),
      },
      2 // Fewer retries for non-critical call
    );

    if (!response.ok) {
      console.warn('[FocusBlocker Payments] Paywall hit log failed:', response.status);
      return { success: false, error: `API returned ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    console.warn('[FocusBlocker Payments] Failed to log paywall hit:', error.message);
    // Queue for retry
    await queueAnalyticsEvent({
      type: 'paywall_hit',
      email: email.trim(),
      feature: featureAttempted,
      extensionId: EXTENSION_ID,
      timestamp: Date.now(),
    });
    return { success: true }; // Queued
  }
}

/**
 * Opens the Zovo upgrade page in a new browser tab with referral tracking
 * parameters so conversion attribution works properly.
 *
 * @param {string} [source='popup'] - The UI location that triggered the upgrade
 *   (e.g., 'popup', 'content_script', 'settings', 'paywall').
 * @returns {Promise<void>}
 */
export async function openUpgradePage(source = 'popup') {
  const upgradeUrl = new URL('https://zovo.one/upgrade');
  upgradeUrl.searchParams.set('ext', EXTENSION_ID);
  upgradeUrl.searchParams.set('ref', source);

  // Attach license key if available for account linking
  const key = await getLicenseKey();
  if (key) {
    upgradeUrl.searchParams.set('key', key);
  }

  await trackEvent('upgrade_page_opened', { source });

  try {
    await chrome.tabs.create({ url: upgradeUrl.toString() });
  } catch (error) {
    // Fallback for contexts where chrome.tabs is unavailable
    if (typeof window !== 'undefined') {
      window.open(upgradeUrl.toString(), '_blank');
    }
  }
}

/**
 * Opens the Zovo checkout page for a specific plan type in a new tab.
 *
 * @param {string} planType - The plan to check out: 'monthly', 'annual', or 'lifetime'.
 * @returns {Promise<void>}
 */
export async function openCheckout(planType) {
  const validPlans = ['monthly', 'annual', 'lifetime'];
  if (!validPlans.includes(planType)) {
    console.warn(`[FocusBlocker Payments] Invalid plan type: ${planType}`);
    return;
  }

  const checkoutUrl = new URL('https://zovo.one/checkout');
  checkoutUrl.searchParams.set('ext', EXTENSION_ID);
  checkoutUrl.searchParams.set('plan', planType);

  const key = await getLicenseKey();
  if (key) {
    checkoutUrl.searchParams.set('key', key);
  }

  await trackEvent('checkout_opened', { plan: planType });

  try {
    await chrome.tabs.create({ url: checkoutUrl.toString() });
  } catch (error) {
    if (typeof window !== 'undefined') {
      window.open(checkoutUrl.toString(), '_blank');
    }
  }
}

// =============================================================================
// Analytics
// =============================================================================

/**
 * Gets or creates a session UUID stored in chrome.storage.session.
 * The session ID persists across service worker restarts but clears
 * when the browser is closed.
 *
 * @returns {Promise<string>} A UUID v4 session identifier.
 */
export async function getSessionId() {
  try {
    const result = await chrome.storage.session.get('zovoSessionId');
    if (result.zovoSessionId) {
      return result.zovoSessionId;
    }
  } catch (_) {
    // Session storage may not be available; generate ephemeral ID
  }

  // Generate a new UUID v4
  const sessionId = crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });

  try {
    await chrome.storage.session.set({ zovoSessionId: sessionId });
  } catch (_) {
    // Best effort
  }

  return sessionId;
}

/**
 * Sends an analytics event to the Zovo analytics endpoint.
 * Events are automatically enriched with session ID, extension ID,
 * and timestamp. If offline, events are queued for later flushing.
 *
 * @param {string} eventName - The event name (e.g., 'paywall_hit', 'license_activated').
 * @param {object} [eventData={}] - Additional event data as key-value pairs.
 * @returns {Promise<void>}
 */
export async function trackEvent(eventName, eventData = {}) {
  if (!eventName || typeof eventName !== 'string') return;

  const sessionId = await getSessionId();
  const event = {
    event: eventName,
    data: eventData,
    extensionId: EXTENSION_ID,
    sessionId,
    timestamp: Date.now(),
    version: chrome.runtime?.getManifest?.()?.version || 'unknown',
  };

  if (!isOnline()) {
    await queueAnalyticsEvent(event);
    return;
  }

  try {
    // Fire-and-forget: do not await response in production
    // Using fetchWithRetry with only 1 retry for analytics (non-critical)
    await fetchWithRetry(
      `${ZOVO_API_BASE}/track-event`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      },
      1
    );
  } catch (error) {
    // Analytics failure is non-critical; queue for later
    await queueAnalyticsEvent(event);
  }
}

/**
 * Adds an analytics event to the offline queue stored in chrome.storage.local.
 * The queue is capped at MAX_ANALYTICS_QUEUE_SIZE to prevent unbounded growth.
 * Oldest events are dropped when the cap is reached.
 *
 * @param {object} event - The fully-formed event object to queue.
 * @returns {Promise<void>}
 */
export async function queueAnalyticsEvent(event) {
  try {
    const result = await chrome.storage.local.get('zovoAnalyticsQueue');
    let queue = Array.isArray(result.zovoAnalyticsQueue)
      ? result.zovoAnalyticsQueue
      : [];

    queue.push(event);

    // Enforce maximum queue size -- drop oldest events
    if (queue.length > MAX_ANALYTICS_QUEUE_SIZE) {
      queue = queue.slice(queue.length - MAX_ANALYTICS_QUEUE_SIZE);
    }

    await chrome.storage.local.set({ zovoAnalyticsQueue: queue });
  } catch (error) {
    console.warn('[FocusBlocker Payments] Failed to queue analytics event:', error);
  }
}

/**
 * Flushes the analytics event queue by sending all queued events to the API.
 * Only flushes when the browser is online. Events that fail to send remain
 * in the queue for the next flush attempt.
 *
 * @returns {Promise<{ sent: number, failed: number }>} Summary of flush results.
 */
export async function flushAnalyticsQueue() {
  if (!isOnline()) {
    return { sent: 0, failed: 0 };
  }

  let queue;
  try {
    const result = await chrome.storage.local.get('zovoAnalyticsQueue');
    queue = Array.isArray(result.zovoAnalyticsQueue)
      ? result.zovoAnalyticsQueue
      : [];
  } catch (error) {
    return { sent: 0, failed: 0 };
  }

  if (queue.length === 0) {
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  const failedEvents = [];

  // Process in batches to avoid overwhelming the API
  for (const event of queue) {
    try {
      const response = await fetch(`${ZOVO_API_BASE}/track-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });

      if (response.ok || response.status === 400) {
        // 400 means event was malformed -- do not retry it
        sent++;
      } else if (response.status === 429) {
        // Rate limited -- stop flushing and keep remaining events
        failedEvents.push(event);
        // Push remaining unprocessed events
        const currentIndex = queue.indexOf(event);
        failedEvents.push(...queue.slice(currentIndex + 1));
        break;
      } else {
        failedEvents.push(event);
      }
    } catch (_) {
      // Network error mid-flush -- keep this and remaining events
      failedEvents.push(event);
      const currentIndex = queue.indexOf(event);
      if (currentIndex < queue.length - 1) {
        failedEvents.push(...queue.slice(currentIndex + 1));
      }
      break;
    }
  }

  // Update queue with only failed events
  try {
    await chrome.storage.local.set({ zovoAnalyticsQueue: failedEvents });
  } catch (_) {
    // Best effort
  }

  return { sent, failed: failedEvents.length };
}

// =============================================================================
// Exports Summary (for reference)
// =============================================================================
// Core:       verifyLicense, isPro, getTier, hasFeature, getFeatures
// Management: storeLicenseKey, getLicenseKey, clearLicenseCache, removeLicense
// Paywall:    logPaywallHit, openUpgradePage, openCheckout
// Analytics:  trackEvent, getSessionId, queueAnalyticsEvent, flushAnalyticsQueue
// Utility:    isValidLicenseFormat, isValidEmail, isOnline
```

---

## 3. Cache Strategy

### Three-Level Cache with Offline Grace

The module implements a five-level resolution strategy that degrades gracefully:

```
Level 1: In-memory cache (5 min TTL)
  |
  +-- HIT -> return cached data immediately (synchronous-speed)
  |
  +-- MISS
        |
        v
Level 2: chrome.storage.local cache (24 hr TTL)
  |
  +-- HIT -> promote to Level 1, return cached data
  |
  +-- MISS
        |
        v
Level 3: API call (POST /verify-extension-license)
  |
  +-- SUCCESS -> update Level 1 + Level 2, return fresh data
  |
  +-- FAILURE (network error, 429, 5xx)
        |
        v
Level 4: Offline grace period (7-day window from lastVerifiedAt)
  |
  +-- WITHIN GRACE -> return stale cached data (user keeps Pro)
  |
  +-- EXPIRED
        |
        v
Level 5: Free tier fallback (safe default)
```

### Cache Data Structures

#### chrome.storage.local (device-specific cache)

```javascript
{
  zovoLicense: {
    valid: true,
    tier: 'pro',                    // 'free' | 'pro' | 'lifetime' | 'team'
    email: 'user@example.com',
    features: [
      'unlimited_sites',
      'custom_timer',
      'advanced_scheduling',
      'export_data',
      'priority_support'
    ],
    cachedAt: 1707580800000,        // When this cache entry was written
    lastVerifiedAt: 1707580800000,  // Last successful API verification
    expiresAt: 1710172800000        // Subscription expiry date from API
  },
  zovoAnalyticsQueue: [
    {
      event: 'paywall_hit',
      data: { feature: 'unlimited_sites' },
      extensionId: 'focus_mode_blocker',
      sessionId: 'a1b2c3d4-...',
      timestamp: 1707580900000,
      version: '1.2.0'
    }
  ]
}
```

#### chrome.storage.sync (cross-device, follows Chrome profile)

```javascript
{
  licenseKey: 'ZOVO-ABCD-1234-EFGH-5678'
}
```

#### chrome.storage.session (survives SW restarts, clears on browser close)

```javascript
{
  zovoSessionId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
}
```

### Why Three Storage Areas?

| Storage | Scope | Purpose |
|---------|-------|---------|
| `chrome.storage.sync` | Cross-device via Chrome profile | License key only -- small, must follow user |
| `chrome.storage.local` | Single device, large quota | Cache data and analytics queue -- device-specific |
| `chrome.storage.session` | Browser session only | Session ID -- privacy-friendly, auto-clears |

---

## 4. Service Worker Integration

The service worker (`src/background/service-worker.js`) must integrate with `payments.js` for three critical responsibilities:

### 4.1 Periodic License Re-Verification

The service worker creates a recurring alarm that forces a cache refresh every 60 minutes. This ensures that license changes (upgrades, cancellations, expirations) are detected promptly even if the user never opens the popup.

```javascript
// In service-worker.js
import { getLicenseKey, verifyLicense, flushAnalyticsQueue } from '../shared/payments.js';

// Set up periodic license check
chrome.alarms.create('licenseCheck', { periodInMinutes: 60 });

// Set up periodic analytics flush
chrome.alarms.create('analyticsFlush', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'licenseCheck') {
    const key = await getLicenseKey();
    if (key) {
      await verifyLicense(key, true); // Force refresh -- bypass caches
    }
  }

  if (alarm.name === 'analyticsFlush') {
    await flushAnalyticsQueue();
  }
});
```

### 4.2 On Install -- Set Uninstall URL and Track Install

When the extension is first installed, the service worker sets the uninstall feedback URL and tracks the installation event.

```javascript
import { trackEvent } from '../shared/payments.js';

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Set uninstall feedback URL
    chrome.runtime.setUninstallURL(
      'https://zovo.one/feedback/uninstall/focus_mode_blocker'
    );

    // Track install event
    await trackEvent('extension_installed', {
      reason: details.reason,
    });
  }

  if (details.reason === 'update') {
    const previousVersion = details.previousVersion;
    const currentVersion = chrome.runtime.getManifest().version;

    await trackEvent('extension_updated', {
      from: previousVersion,
      to: currentVersion,
    });
  }
});
```

### 4.3 Message Passing for License State

Content scripts and the popup cannot directly call `payments.js` functions in the service worker context. They communicate via `chrome.runtime.sendMessage`, and the service worker handles these messages.

```javascript
import { isPro, hasFeature, verifyLicense, getTier, getFeatures } from '../shared/payments.js';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHECK_PRO_STATUS') {
    isPro().then(result => sendResponse({ isPro: result }));
    return true; // Keep channel open for async response
  }

  if (message.type === 'CHECK_FEATURE') {
    hasFeature(message.feature).then(result => sendResponse({ hasFeature: result }));
    return true;
  }

  if (message.type === 'VERIFY_LICENSE') {
    verifyLicense(message.key, true).then(result => sendResponse(result));
    return true;
  }

  if (message.type === 'GET_TIER') {
    getTier().then(tier => sendResponse({ tier }));
    return true;
  }

  if (message.type === 'GET_FEATURES') {
    getFeatures().then(features => sendResponse({ features }));
    return true;
  }
});
```

### 4.4 Calling from Popup or Content Scripts

Other parts of the extension use `chrome.runtime.sendMessage` to query license state:

```javascript
// In popup.js or content script
async function checkIfPro() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'CHECK_PRO_STATUS' }, (response) => {
      resolve(response?.isPro ?? false);
    });
  });
}

async function checkFeatureAccess(feature) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: 'CHECK_FEATURE', feature },
      (response) => {
        resolve(response?.hasFeature ?? false);
      }
    );
  });
}
```

---

## 5. Error Handling

### Error Types, Causes, and Recovery Strategies

| Error | Cause | Recovery | User Impact |
|-------|-------|----------|-------------|
| Network error | No internet connection | Use cached license data within 7-day grace period | None if within grace period |
| 401 Unauthorized | Invalid, revoked, or expired key | Clear cache, set free tier immediately | Features gated, upgrade prompt shown |
| 429 Rate Limited | Too many verification requests | Exponential backoff with retries, then fall back to cache | None -- cache serves data |
| 500 Server Error | Zovo API is down | Use cache, alarm will retry in 60 minutes | None -- cache serves data |
| Invalid format | User entered a malformed key | Return format hint: `ZOVO-XXXX-XXXX-XXXX-XXXX` | Inline error message in UI |
| Subscription expired | Payment method failed or plan ended | API returns `valid: false`, downgrade to free | Grace period then feature gating |
| Storage quota exceeded | Too much data in chrome.storage | Gracefully handle error, still serve from memory cache | Degraded caching only |

### Retry Strategy Implementation

The `fetchWithRetry` function uses exponential backoff with the following characteristics:

- **Max retries:** 3 for license verification, 2 for paywall hits, 1 for analytics
- **Backoff schedule:** 1s, 2s, 4s (exponential: `2^i * 1000ms`)
- **Rate limit awareness:** Respects `Retry-After` header when present
- **Fail-open on analytics:** Analytics failures never block user functionality

```
Attempt 1: immediate
  -> 429? wait 1s (or Retry-After value)
Attempt 2: retry
  -> 429? wait 2s (or Retry-After value)
Attempt 3: retry
  -> fail? throw error, fall back to cache
```

### Defensive Coding Patterns

Throughout the module, several defensive patterns are applied:

1. **Null-safe property access:** All API response fields are accessed with fallback defaults
2. **Type checking on inputs:** Every public function validates its arguments before processing
3. **Try-catch on all storage operations:** Chrome storage can fail in restricted contexts
4. **Non-blocking analytics:** Analytics failures never propagate to the caller
5. **Graceful degradation:** If any component fails, the system falls back to the next tier rather than crashing

---

## 6. Testing Guide

### Manual Test Cases

| # | Test Scenario | Steps | Expected Result |
|---|--------------|-------|----------------|
| 1 | No license key stored | Fresh install, open popup | All Pro features gated; free tier indicators shown; upgrade button visible |
| 2 | Valid license key entry | Enter valid ZOVO key in settings | Verification succeeds; Pro features unlocked; tier badge updates |
| 3 | Invalid license key entry | Enter `ZOVO-0000-0000-0000-ZZZZ` (valid format but not registered) | API returns invalid; error message shown; stays on free tier |
| 4 | Malformed license key | Enter `ABC-1234` | Format validation rejects before API call; inline error with format hint |
| 5 | Expired license key | Use a key with past `expiresAt` | API returns `valid: false`; graceful downgrade with messaging |
| 6 | Offline with fresh cache (< 24h) | Disconnect internet, open popup | Pro features still work; no error indicators |
| 7 | Offline with stale cache (< 7 days) | Disconnect for 2 days, open popup | Pro features still work via offline grace period |
| 8 | Offline with expired grace (> 7 days) | Mock 8-day-old `lastVerifiedAt` | Downgrades to free tier; shows offline warning |
| 9 | Offline with no cache | Fresh install while offline | Free tier active; no errors thrown |
| 10 | Rate limited (429) | Trigger rapid verification calls | Uses cache after retries; no user-visible error |
| 11 | Server error (500) | Mock API returning 500 | Uses cache; alarm retries in 60 minutes |
| 12 | License removal | Click "Remove License" in settings | Key cleared from sync; cache cleared; reverts to free tier |
| 13 | Cross-device sync | Install on two devices, enter key on one | Key appears on second device via `chrome.storage.sync` |
| 14 | Service worker restart | Force-kill service worker in DevTools | Session ID regenerates; in-memory cache rebuilds from storage |
| 15 | Paywall hit logging | Attempt Pro feature on free tier | Paywall event logged to API; drip sequence triggered |
| 16 | Analytics queue flush | Queue events offline, go online | Queued events sent on next flush cycle |
| 17 | Upgrade page navigation | Click upgrade button | New tab opens with correct ref tracking parameters |
| 18 | Checkout page navigation | Select "Annual" plan | New tab opens at `/checkout?ext=focus_mode_blocker&plan=annual` |

### Automated Test Hooks

For unit testing in isolation, the module's dependencies can be mocked:

```javascript
// Test setup: mock chrome.storage APIs
global.chrome = {
  storage: {
    local: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
    },
    sync: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
    },
    session: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
    },
  },
  tabs: {
    create: jest.fn().mockResolvedValue({}),
  },
  runtime: {
    getManifest: () => ({ version: '1.0.0' }),
    setUninstallURL: jest.fn(),
  },
  alarms: {
    create: jest.fn(),
    onAlarm: { addListener: jest.fn() },
  },
};

// Mock fetch
global.fetch = jest.fn();

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  configurable: true,
  get: () => true,
});
```

### Key Assertions to Verify

```javascript
// 1. Cache hierarchy works correctly
test('returns memory cache when fresh', async () => {
  // Pre-populate memory cache
  // Call verifyLicense
  // Assert fetch was NOT called
});

// 2. Offline grace period respected
test('returns cached data within 7-day grace', async () => {
  // Set lastVerifiedAt to 5 days ago
  // Set navigator.onLine = false
  // Assert isPro() returns true
});

// 3. Grace period expiration works
test('returns free tier after 7-day grace expires', async () => {
  // Set lastVerifiedAt to 8 days ago
  // Set navigator.onLine = false
  // Assert isPro() returns false
});

// 4. Invalid key clears cache
test('clears cache on 401 response', async () => {
  // Mock fetch to return 401
  // Call verifyLicense with force
  // Assert storage cache was cleared to free tier
});

// 5. Analytics queue respects size limit
test('drops oldest events when queue exceeds limit', async () => {
  // Queue 105 events
  // Assert only 100 remain (newest 100)
});
```

---

## 7. File Location and Dependencies

### File Tree

```
src/
├── shared/
│   ├── payments.js           <-- THIS MODULE (Agent 2)
│   ├── feature-gate.js       <-- Feature gating logic (Agent 4)
│   └── license-ui.js         <-- License input UI components (Agent 4)
├── background/
│   └── service-worker.js     <-- Imports payments.js for alarms + messages
├── popup/
│   └── popup.js              <-- Sends messages to service worker
└── content/
    └── content.js            <-- Sends messages to service worker
```

### Import Map

```
service-worker.js
  └── imports: verifyLicense, getLicenseKey, isPro, hasFeature,
               getTier, getFeatures, trackEvent, flushAnalyticsQueue

popup.js
  └── uses: chrome.runtime.sendMessage (CHECK_PRO_STATUS, CHECK_FEATURE, etc.)

content.js
  └── uses: chrome.runtime.sendMessage (CHECK_FEATURE)

feature-gate.js (Agent 4)
  └── imports: hasFeature, isPro, getTier, openUpgradePage

license-ui.js (Agent 4)
  └── imports: storeLicenseKey, getLicenseKey, removeLicense, isValidLicenseFormat
```

### API Endpoints Used

| Endpoint | Method | Used By | Purpose |
|----------|--------|---------|---------|
| `/verify-extension-license` | POST | `verifyLicense()` | Validate license key and retrieve tier/features |
| `/log-paywall-hit` | POST | `logPaywallHit()` | Trigger drip email sequence on feature gate |
| `/track-event` | POST | `trackEvent()`, `flushAnalyticsQueue()` | Send analytics events |

### External URLs Opened

| URL | Used By | Purpose |
|-----|---------|---------|
| `https://zovo.one/upgrade?ext=...&ref=...` | `openUpgradePage()` | Upgrade landing page |
| `https://zovo.one/checkout?ext=...&plan=...` | `openCheckout()` | Direct plan checkout |
| `https://zovo.one/feedback/uninstall/focus_mode_blocker` | `onInstalled` | Post-uninstall feedback survey |

---

## 8. Security Considerations

1. **License keys are never logged.** Console warnings reference errors but never print key values.
2. **Keys stored in `chrome.storage.sync`** are encrypted at rest by Chrome and tied to the user's Google account.
3. **No secrets in client code.** The API base URL is public; authentication is handled by the license key itself against the server-side database.
4. **Email addresses** passed to `logPaywallHit` are validated for format but never stored locally beyond the analytics queue.
5. **Analytics events** contain no PII beyond what the user explicitly provides (email for paywall hits only).
6. **Rate limiting** is respected both by the exponential backoff retry strategy and by the caching layers that prevent unnecessary API calls.

---

## 9. Migration Notes

When upgrading from a version of Focus Mode - Blocker that did not have payment integration:

1. **No breaking changes.** The module is additive -- it does not modify any existing storage keys.
2. **First run after update:** `getLicenseKey()` returns `null`, and all feature checks return `false` / free tier. This is the correct default.
3. **Storage keys used:** `zovoLicense`, `zovoAnalyticsQueue` (local), `licenseKey` (sync), `zovoSessionId` (session). These are all new and will not conflict with existing extension data.
4. **The `onInstalled` listener** detects `reason === 'update'` and tracks it as an analytics event without disrupting user state.
