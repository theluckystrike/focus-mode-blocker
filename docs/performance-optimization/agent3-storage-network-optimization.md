# Agent 3 — Storage & Network Optimization
## Phase 20: Performance Optimization Guide — Focus Mode - Blocker

> **Date:** February 11, 2026 | **Agent:** 3 of 5
> **Scope:** Sections 5–6 — Storage Optimization, Network Optimization
> **Depends on:** Phase 18 (Security — encrypted storage, secure network), Phase 12 (MV3 Architecture — storage patterns), Phase 09 (Payment — Stripe API calls)

---

## 5. Storage Optimization

### 5.1 Focus Mode Storage Map

```
FOCUS MODE STORAGE ALLOCATION:
┌─────────────────────┬────────────┬────────────┬──────────────────────────────┐
│ Storage Type        │ Quota      │ Sync?      │ Focus Mode Usage             │
├─────────────────────┼────────────┼────────────┼──────────────────────────────┤
│ chrome.storage.local│ 10MB       │ No         │ Blocklist, Focus Score       │
│                     │            │            │ history, session data,       │
│                     │            │            │ Nuclear Mode state           │
├─────────────────────┼────────────┼────────────┼──────────────────────────────┤
│ chrome.storage.sync │ 100KB      │ Yes (Pro)  │ Settings, theme, Pomodoro    │
│                     │            │            │ intervals, Pro license       │
├─────────────────────┼────────────┼────────────┼──────────────────────────────┤
│ chrome.storage.     │ 10MB       │ No         │ Quick blocklist cache,       │
│ session             │            │            │ session encryption keys      │
│                     │            │            │ (Phase 18), temp state       │
├─────────────────────┼────────────┼────────────┼──────────────────────────────┤
│ IndexedDB           │ Unlimited* │ No         │ Focus Score full history     │
│                     │            │            │ (Pro), detailed session logs │
└─────────────────────┴────────────┴────────────┴──────────────────────────────┘
* IndexedDB dynamic quota, typically 50%+ of available disk
```

### 5.2 Efficient Data Structures

```javascript
// src/storage/storage-optimizer.js

// Compressed storage for large data (Focus Score history)
class FocusCompressedStorage {
  static async compress(data) {
    const json = JSON.stringify(data);
    const blob = new Blob([json]);
    const stream = blob.stream().pipeThrough(new CompressionStream('gzip'));
    const compressedBlob = await new Response(stream).blob();
    return await this.blobToBase64(compressedBlob);
  }

  static async decompress(compressed) {
    const blob = this.base64ToBlob(compressed);
    const stream = blob.stream().pipeThrough(new DecompressionStream('gzip'));
    const text = await new Response(stream).text();
    return JSON.parse(text);
  }

  static blobToBase64(blob) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(blob);
    });
  }

  static base64ToBlob(base64) {
    const bytes = atob(base64);
    const array = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      array[i] = bytes.charCodeAt(i);
    }
    return new Blob([array]);
  }
}

// Chunked storage for sync (8KB per item limit, 100KB total)
class FocusChunkedSyncStorage {
  constructor(key) {
    this.key = key;
    this.CHUNK_SIZE = 7500; // Leave room for metadata overhead
  }

  async set(data) {
    const json = JSON.stringify(data);

    // Check total sync quota
    if (json.length > 90000) {
      console.warn('[Focus Mode] Data too large for sync storage, using local fallback');
      await chrome.storage.local.set({ [`sync_fallback_${this.key}`]: data });
      return;
    }

    const chunks = [];
    for (let i = 0; i < json.length; i += this.CHUNK_SIZE) {
      chunks.push(json.slice(i, i + this.CHUNK_SIZE));
    }

    const toStore = {
      [`${this.key}_meta`]: { chunks: chunks.length, version: 1, updatedAt: Date.now() }
    };

    chunks.forEach((chunk, i) => {
      toStore[`${this.key}_${i}`] = chunk;
    });

    await chrome.storage.sync.set(toStore);
  }

  async get() {
    const metaKey = `${this.key}_meta`;
    const result = await chrome.storage.sync.get(metaKey);
    const meta = result[metaKey];

    if (!meta) {
      // Check local fallback
      const fallback = await chrome.storage.local.get(`sync_fallback_${this.key}`);
      return fallback[`sync_fallback_${this.key}`] || null;
    }

    const chunkKeys = Array.from({ length: meta.chunks }, (_, i) => `${this.key}_${i}`);
    const chunks = await chrome.storage.sync.get(chunkKeys);
    const json = chunkKeys.map(k => chunks[k]).join('');

    return JSON.parse(json);
  }
}

// Focus Mode sync data structure (fits in 100KB sync quota)
// Settings: ~2KB, Blocklist (domains only): ~5KB for 100 sites, Pro license: ~1KB
```

### 5.3 Batch Storage Operations

```javascript
// src/storage/storage-batch.js
class FocusStorageBatch {
  constructor(storage = chrome.storage.local) {
    this.storage = storage;
    this.pending = {};
    this.flushTimer = null;
    this.DEBOUNCE_MS = 500;
  }

  set(key, value) {
    this.pending[key] = value;

    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), this.DEBOUNCE_MS);
    }
  }

  async flush() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (Object.keys(this.pending).length === 0) return;

    const toSave = { ...this.pending };
    this.pending = {};

    await this.storage.set(toSave);
  }

  async get(keys) {
    const result = {};
    const keysToFetch = [];

    // Check pending writes first (read-your-writes consistency)
    for (const key of keys) {
      if (key in this.pending) {
        result[key] = this.pending[key];
      } else {
        keysToFetch.push(key);
      }
    }

    if (keysToFetch.length > 0) {
      const stored = await this.storage.get(keysToFetch);
      Object.assign(result, stored);
    }

    return result;
  }

  // Force flush before service worker termination
  async forceFlush() {
    await this.flush();
  }
}

// Usage in service worker:
// const batch = new FocusStorageBatch();
//
// During a Pomodoro session — many rapid updates batched into one write:
// batch.set('pomodoroState', { phase: 'work', remaining: 1450 });
// batch.set('todayFocusMinutes', 47);
// batch.set('focusScore', 65);
// → All saved in a single chrome.storage.local.set() call
```

### 5.4 IndexedDB for Focus Score History (Pro)

```javascript
// src/storage/focus-history-db.js
class FocusHistoryDB {
  constructor() {
    this.dbName = 'FocusModeHistory';
    this.version = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Focus sessions store
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true });
          sessionStore.createIndex('date', 'date');
          sessionStore.createIndex('type', 'type'); // 'pomodoro', 'nuclear', 'freeform'
        }

        // Daily score snapshots
        if (!db.objectStoreNames.contains('dailyScores')) {
          const scoreStore = db.createObjectStore('dailyScores', { keyPath: 'date' });
          scoreStore.createIndex('score', 'score');
        }

        // Blocked site visit log
        if (!db.objectStoreNames.contains('blockedVisits')) {
          const visitStore = db.createObjectStore('blockedVisits', { keyPath: 'id', autoIncrement: true });
          visitStore.createIndex('date', 'date');
          visitStore.createIndex('domain', 'domain');
        }
      };
    });
  }

  async addSession(session) {
    return this.put('sessions', {
      ...session,
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now()
    });
  }

  async addDailyScore(date, score, breakdown) {
    return this.put('dailyScores', { date, score, breakdown, timestamp: Date.now() });
  }

  async addBlockedVisit(domain) {
    return this.put('blockedVisits', {
      domain,
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now()
    });
  }

  async getScoreHistory(days = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['dailyScores'], 'readonly');
      const store = tx.objectStore('dailyScores');
      const range = IDBKeyRange.lowerBound(cutoffStr);
      const request = store.openCursor(range);
      const results = [];

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getTopBlockedSites(days = 7, limit = 10) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['blockedVisits'], 'readonly');
      const store = tx.objectStore('blockedVisits');
      const index = store.index('date');
      const range = IDBKeyRange.lowerBound(cutoffStr);
      const request = index.openCursor(range);
      const counts = {};

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const domain = cursor.value.domain;
          counts[domain] = (counts[domain] || 0) + 1;
          cursor.continue();
        } else {
          const sorted = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([domain, count]) => ({ domain, count }));
          resolve(sorted);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Prune old data to prevent unbounded growth
  async prune(maxAgeDays = 90) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - maxAgeDays);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    for (const storeName of ['sessions', 'blockedVisits']) {
      const tx = this.db.transaction([storeName], 'readwrite');
      const store = tx.objectStore(storeName);
      const index = store.index('date');
      const range = IDBKeyRange.upperBound(cutoffStr);
      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
    }
  }

  put(storeName, data) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(data);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
}
```

### 5.5 Storage Size Budget

| Data | Storage | Estimated Size | Growth Rate |
|------|---------|---------------|-------------|
| Blocklist (domains) | local + sync | ~50 bytes/site | User-controlled (5 free, unlimited Pro) |
| Settings | sync | ~2KB | Static |
| Focus Score (current) | local | ~200 bytes | Updated daily |
| Focus Score history | IndexedDB (Pro) | ~100 bytes/day | ~3.5KB/month |
| Session log | IndexedDB (Pro) | ~200 bytes/session | ~1.2KB/day (6 sessions) |
| Blocked visit log | IndexedDB (Pro) | ~80 bytes/visit | ~800 bytes/day (10 visits) |
| Nuclear Mode state | local + session | ~500 bytes | Updated per activation |
| Pomodoro state | local + session | ~300 bytes | Updated per session |
| Pro license | local (encrypted) | ~1KB | Static |
| Quick blocklist cache | session | ~5KB (100 sites) | Refreshed on blocklist change |
| **Total (Free user)** | | **~15KB** | Minimal |
| **Total (Pro, 1 year)** | | **~500KB** | ~40KB/month |

### 5.6 Storage Performance Rules

1. **Read once, cache in memory**: On service worker wake, read all needed state in a single `chrome.storage.local.get()` call
2. **Batch writes**: Use `FocusStorageBatch` — never write to storage more than once per 500ms
3. **Session storage for hot data**: Use `chrome.storage.session` for data accessed on every page load (quick blocklist)
4. **Prune IndexedDB monthly**: Run `prune(90)` to keep history under 90 days
5. **Compress if > 50KB**: Use `FocusCompressedStorage` for Focus Score history exports
6. **Sync only settings**: Keep sync storage under 50KB — only settings, never history

---

## 6. Network Optimization

### 6.1 Focus Mode Network Usage

Focus Mode makes minimal network requests:
- **License validation** (Pro): `api.zovo.one/license/validate` — on startup + every 24h
- **Stripe checkout** (Pro): `api.stripe.com` — only during purchase flow
- **Update check**: Handled by Chrome's built-in extension update mechanism
- **Telemetry** (opt-in): `api.zovo.one/telemetry` — daily summary only

No browsing data is ever sent to any server.

### 6.2 Request Batching for API Calls

```javascript
// src/network/request-batcher.js
class FocusRequestBatcher {
  constructor(baseUrl, options = {}) {
    this.baseUrl = baseUrl;
    this.maxBatchSize = options.maxBatchSize || 5;
    this.maxWaitMs = options.maxWaitMs || 200;
    this.pending = [];
    this.timeout = null;
  }

  add(endpoint, data) {
    return new Promise((resolve, reject) => {
      this.pending.push({ endpoint, data, resolve, reject });

      if (this.pending.length >= this.maxBatchSize) {
        this.flush();
      } else if (!this.timeout) {
        this.timeout = setTimeout(() => this.flush(), this.maxWaitMs);
      }
    });
  }

  async flush() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    if (this.pending.length === 0) return;

    const batch = this.pending;
    this.pending = [];

    try {
      const response = await fetch(`${this.baseUrl}/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Extension-Version': chrome.runtime.getManifest().version
        },
        body: JSON.stringify({
          requests: batch.map(b => ({ endpoint: b.endpoint, data: b.data }))
        }),
        signal: AbortSignal.timeout(10000) // 10s timeout
      });

      if (!response.ok) {
        throw new Error(`Batch request failed: ${response.status}`);
      }

      const results = await response.json();
      batch.forEach((b, i) => b.resolve(results[i]));
    } catch (error) {
      batch.forEach(b => b.reject(error));
    }
  }
}
```

### 6.3 License Validation Caching

```javascript
// src/network/license-cache.js
class FocusLicenseCache {
  constructor() {
    this.CACHE_KEY = 'proLicenseCache';
    this.CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
    this.OFFLINE_GRACE = 7 * 24 * 60 * 60 * 1000; // 7 days (Phase 18)
  }

  async validateLicense(licenseKey) {
    // Check cache first
    const cached = await this.getCachedResult(licenseKey);
    if (cached) return cached;

    // Network validation
    try {
      const result = await this.networkValidate(licenseKey);
      await this.cacheResult(licenseKey, result);
      return result;
    } catch (error) {
      // Offline fallback (Phase 18 — 7-day grace period)
      const lastValid = await this.getLastValidResult(licenseKey);
      if (lastValid && Date.now() - lastValid.timestamp < this.OFFLINE_GRACE) {
        return { ...lastValid, offlineMode: true };
      }

      return { valid: false, reason: 'network_error', offlineMode: true };
    }
  }

  async getCachedResult(licenseKey) {
    const { [this.CACHE_KEY]: cache } = await chrome.storage.local.get(this.CACHE_KEY);
    if (!cache || cache.licenseKey !== licenseKey) return null;

    // Check expiry
    if (Date.now() - cache.timestamp > this.CACHE_DURATION) return null;

    return cache.result;
  }

  async cacheResult(licenseKey, result) {
    await chrome.storage.local.set({
      [this.CACHE_KEY]: {
        licenseKey,
        result,
        timestamp: Date.now()
      }
    });
  }

  async getLastValidResult(licenseKey) {
    const { [this.CACHE_KEY]: cache } = await chrome.storage.local.get(this.CACHE_KEY);
    if (!cache || cache.licenseKey !== licenseKey) return null;
    if (!cache.result?.valid) return null;
    return { ...cache.result, timestamp: cache.timestamp };
  }

  async networkValidate(licenseKey) {
    const response = await fetch('https://api.zovo.one/license/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Extension-Version': chrome.runtime.getManifest().version
      },
      body: JSON.stringify({
        licenseKey,
        machineId: await this.getMachineId()
      }),
      signal: AbortSignal.timeout(5000) // 5s timeout
    });

    if (!response.ok) {
      throw new Error(`License validation failed: ${response.status}`);
    }

    return response.json();
  }

  async getMachineId() {
    // Non-identifying fingerprint (Phase 18)
    const extensionId = chrome.runtime.id;
    const encoder = new TextEncoder();
    const data = encoder.encode(extensionId + navigator.userAgent);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
```

### 6.4 General Network Cache Manager

```javascript
// src/network/cache-manager.js
class FocusNetworkCache {
  constructor() {
    this.CACHE_KEY = '_networkCache';
    this.MAX_ENTRIES = 50;
  }

  async cachedFetch(url, options = {}) {
    const { maxAge = 3600000, forceRefresh = false } = options;

    if (!forceRefresh) {
      const cached = await this.getFromCache(url);
      if (cached && Date.now() - cached.timestamp < maxAge) {
        return cached.data;
      }
    }

    const response = await fetch(url, {
      signal: AbortSignal.timeout(options.timeout || 10000)
    });

    if (!response.ok) {
      // Return stale cache if available
      const stale = await this.getFromCache(url);
      if (stale) return stale.data;
      throw new Error(`Network request failed: ${response.status}`);
    }

    const data = await response.json();
    await this.setInCache(url, data);
    return data;
  }

  async getFromCache(url) {
    const { [this.CACHE_KEY]: cache = {} } = await chrome.storage.local.get(this.CACHE_KEY);
    return cache[url] || null;
  }

  async setInCache(url, data) {
    const { [this.CACHE_KEY]: cache = {} } = await chrome.storage.local.get(this.CACHE_KEY);
    cache[url] = { data, timestamp: Date.now() };

    // Evict oldest if over limit
    const keys = Object.keys(cache);
    if (keys.length > this.MAX_ENTRIES) {
      const sorted = keys.sort((a, b) => cache[a].timestamp - cache[b].timestamp);
      sorted.slice(0, keys.length - this.MAX_ENTRIES).forEach(k => delete cache[k]);
    }

    await chrome.storage.local.set({ [this.CACHE_KEY]: cache });
  }

  async clear() {
    await chrome.storage.local.remove(this.CACHE_KEY);
  }
}
```

### 6.5 Retry with Exponential Backoff

```javascript
// src/network/retry.js
async function fetchWithRetry(url, options = {}, retries = 3) {
  const { timeout = 5000, backoff = 1000 } = options;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(timeout)
      });

      if (response.ok) return response;

      // Don't retry 4xx errors (client errors)
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Client error: ${response.status}`);
      }

      // 5xx errors — retry
      if (attempt < retries) {
        await delay(backoff * Math.pow(2, attempt)); // Exponential backoff
        continue;
      }

      throw new Error(`Server error: ${response.status}`);
    } catch (error) {
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        if (attempt < retries) {
          await delay(backoff * Math.pow(2, attempt));
          continue;
        }
      }
      throw error;
    }
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### 6.6 Network Performance Rules

1. **License validation**: Cache for 24 hours; 7-day offline grace period
2. **No browsing data sent**: Focus Mode never phones home with user activity
3. **Timeout everything**: 5s for API calls, 10s for batch requests
4. **Retry with backoff**: Max 3 retries with exponential backoff for server errors
5. **Stale-while-revalidate**: Return cached data immediately, refresh in background
6. **Batch when possible**: Multiple API calls in one request via `/batch` endpoint
7. **Stripe.js from CDN**: Never bundled — loaded only on options page upgrade flow

---

## Key Design Decisions

### Storage Tiering
- `chrome.storage.session` for hot data (quick blocklist) — fastest, per-session only
- `chrome.storage.local` for warm data (Focus Score, Nuclear Mode state) — persistent, 10MB limit
- `chrome.storage.sync` for settings only (Pro) — cross-device, 100KB limit
- IndexedDB for cold data (Pro history, analytics) — unlimited, queryable

### Minimal Network Footprint
- Focus Mode makes 0-1 network requests per day (license validation only, Pro users)
- Free users make zero network requests after installation
- This is a privacy and performance win — no latency from network dependencies
- Telemetry is opt-in only and sends daily summaries, never real-time data

### Data Pruning Prevents Unbounded Growth
- IndexedDB pruned to 90 days automatically
- Network cache limited to 50 entries with LRU eviction
- Storage batch flushes every 500ms to prevent rapid write accumulation

---

*Agent 3 — Storage & Network Optimization — Complete*
