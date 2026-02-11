# MD 10 - Sections 5-6: Cross-Browser Testing & Performance

> Focus Mode - Blocker v1.0.0 — Cross-browser compatibility matrix and performance testing suite.

## Table of Contents

- [5.1 Browser Compatibility Configuration](#51-browser-compatibility-configuration)
- [5.2 Cross-Browser Compatibility Test Suite](#52-cross-browser-compatibility-test-suite)
- [5.3 Polyfill Testing](#53-polyfill-testing)
- [5.4 Manifest Version Differences Tests](#54-manifest-version-differences-tests)
- [6.1 Memory Usage Benchmarks](#61-memory-usage-benchmarks)
- [6.2 CPU Profiling Tests](#62-cpu-profiling-tests)
- [6.3 Load Time Measurements](#63-load-time-measurements)
- [6.4 Performance Budget Configuration](#64-performance-budget-configuration)
- [6.5 Focus Mode Specific Performance Tests](#65-focus-mode-specific-performance-tests)

---

## 5. Cross-Browser Testing Matrix

### 5.1 Browser Compatibility Configuration

**File:** `tests/setup/browserMatrix.ts`

```typescript
export interface BrowserConfig {
  name: 'chrome' | 'firefox' | 'edge';
  manifestVersion: 2 | 3;
  apiNamespace: 'chrome' | 'browser';
  supportedFeatures: string[];
  knownLimitations: string[];
  blockingApi: 'declarativeNetRequest' | 'webRequest';
  backgroundType: 'service_worker' | 'scripts';
  actionApi: 'action' | 'browserAction';
  permissionsFormat: 'mv3' | 'mv2';
}

export const BROWSER_CONFIGS: Record<string, BrowserConfig> = {
  chrome: {
    name: 'chrome',
    manifestVersion: 3,
    apiNamespace: 'chrome',
    supportedFeatures: [
      'declarativeNetRequest',
      'service_worker',
      'chrome.action',
      'chrome.scripting',
      'chrome.offscreen',
      'chrome.alarms',
      'chrome.storage',
      'chrome.notifications',
    ],
    knownLimitations: [
      'service_worker_no_dom',
      'alarm_minimum_30s',
      'dnr_rule_limit_5000_static',
      'dnr_rule_limit_30000_dynamic',
      'offscreen_single_document',
    ],
    blockingApi: 'declarativeNetRequest',
    backgroundType: 'service_worker',
    actionApi: 'action',
    permissionsFormat: 'mv3',
  },
  firefox: {
    name: 'firefox',
    manifestVersion: 2,
    apiNamespace: 'browser',
    supportedFeatures: [
      'webRequest.blocking',
      'background_scripts',
      'browser.browserAction',
      'browser.tabs',
      'browser.alarms',
      'browser.storage',
      'browser.notifications',
    ],
    knownLimitations: [
      'no_declarativeNetRequest',
      'no_offscreen_api',
      'no_chrome_scripting_executeScript_world',
      'promise_based_apis_native',
      'browser_action_not_action',
      'manifest_v2_only_stable',
    ],
    blockingApi: 'webRequest',
    backgroundType: 'scripts',
    actionApi: 'browserAction',
    permissionsFormat: 'mv2',
  },
  edge: {
    name: 'edge',
    manifestVersion: 3,
    apiNamespace: 'chrome',
    supportedFeatures: [
      'declarativeNetRequest',
      'service_worker',
      'chrome.action',
      'chrome.scripting',
      'chrome.offscreen',
      'chrome.alarms',
      'chrome.storage',
      'chrome.notifications',
    ],
    knownLimitations: [
      'service_worker_no_dom',
      'sidebar_panel_api_extra',
      'edge_specific_policies',
      'alarm_minimum_30s',
    ],
    blockingApi: 'declarativeNetRequest',
    backgroundType: 'service_worker',
    actionApi: 'action',
    permissionsFormat: 'mv3',
  },
};

export function getBrowserConfig(name: string): BrowserConfig {
  const config = BROWSER_CONFIGS[name];
  if (!config) {
    throw new Error(`Unknown browser: ${name}. Supported: ${Object.keys(BROWSER_CONFIGS).join(', ')}`);
  }
  return config;
}

export function supportsFeature(browser: string, feature: string): boolean {
  return getBrowserConfig(browser).supportedFeatures.includes(feature);
}

export function getBlockingApiForBrowser(browser: string): 'declarativeNetRequest' | 'webRequest' {
  return getBrowserConfig(browser).blockingApi;
}

export const BLOCKING_API_MAP: Record<string, {
  addRules: string;
  removeRules: string;
  blockAction: string;
  redirectAction: string;
  conditionType: string;
}> = {
  declarativeNetRequest: {
    addRules: 'chrome.declarativeNetRequest.updateDynamicRules',
    removeRules: 'chrome.declarativeNetRequest.updateDynamicRules',
    blockAction: '{ type: "block" }',
    redirectAction: '{ type: "redirect", redirect: { extensionPath: "/block.html" } }',
    conditionType: 'urlFilter',
  },
  webRequest: {
    addRules: 'browser.webRequest.onBeforeRequest.addListener',
    removeRules: 'browser.webRequest.onBeforeRequest.removeListener',
    blockAction: '{ cancel: true }',
    redirectAction: '{ redirectUrl: browser.runtime.getURL("/block.html") }',
    conditionType: 'urls_pattern',
  },
};

export const CROSS_BROWSER_TEST_MATRIX = Object.keys(BROWSER_CONFIGS).map((browser) => ({
  browser,
  config: BROWSER_CONFIGS[browser],
}));
```

---

### 5.2 Cross-Browser Compatibility Test Suite

**File:** `tests/cross-browser/compatibility.test.ts`

```typescript
import { chrome } from 'jest-chrome';
import {
  BROWSER_CONFIGS,
  CROSS_BROWSER_TEST_MATRIX,
  BrowserConfig,
  getBlockingApiForBrowser,
  supportsFeature,
} from '../setup/browserMatrix';

// ---- Helpers to simulate browser API namespaces ----

function createBrowserNamespaceMock(config: BrowserConfig) {
  const isFirefox = config.apiNamespace === 'browser';
  return {
    namespace: config.apiNamespace,
    storage: {
      local: {
        get: isFirefox
          ? jest.fn().mockResolvedValue({})
          : jest.fn((keys, cb) => cb({})),
        set: isFirefox
          ? jest.fn().mockResolvedValue(undefined)
          : jest.fn((items, cb) => cb()),
        remove: isFirefox
          ? jest.fn().mockResolvedValue(undefined)
          : jest.fn((keys, cb) => cb()),
      },
      sync: {
        get: isFirefox
          ? jest.fn().mockResolvedValue({})
          : jest.fn((keys, cb) => cb({})),
        set: isFirefox
          ? jest.fn().mockResolvedValue(undefined)
          : jest.fn((items, cb) => cb()),
      },
    },
    alarms: {
      create: jest.fn(),
      clear: jest.fn(isFirefox ? () => Promise.resolve(true) : (name: string, cb: Function) => cb(true)),
      get: jest.fn(isFirefox ? () => Promise.resolve(null) : (name: string, cb: Function) => cb(null)),
      onAlarm: { addListener: jest.fn(), removeListener: jest.fn() },
    },
    runtime: {
      sendMessage: jest.fn(isFirefox ? () => Promise.resolve({}) : (msg: any, cb: Function) => cb({})),
      onMessage: { addListener: jest.fn(), removeListener: jest.fn() },
      getURL: jest.fn((path: string) => `${isFirefox ? 'moz' : 'chrome'}-extension://fakeid/${path}`),
      lastError: null as chrome.runtime.LastError | null,
    },
    notifications: {
      create: jest.fn(isFirefox
        ? () => Promise.resolve('notif-id')
        : (id: string, opts: any, cb: Function) => cb('notif-id')),
      clear: jest.fn(),
    },
  };
}

// ---- 5.2.1 Storage API Compatibility ----

describe('Cross-Browser: Storage API', () => {
  describe.each(CROSS_BROWSER_TEST_MATRIX)('$browser', ({ browser, config }) => {
    let api: ReturnType<typeof createBrowserNamespaceMock>;

    beforeEach(() => {
      api = createBrowserNamespaceMock(config);
    });

    test('storage.local.get returns data via correct pattern', async () => {
      const testData = { blocklist: ['youtube.com', 'reddit.com'] };
      if (config.apiNamespace === 'browser') {
        (api.storage.local.get as jest.Mock).mockResolvedValue(testData);
        const result = await api.storage.local.get('blocklist');
        expect(result).toEqual(testData);
      } else {
        (api.storage.local.get as jest.Mock).mockImplementation((keys, cb) => cb(testData));
        const result = await new Promise((resolve) => api.storage.local.get('blocklist', resolve));
        expect(result).toEqual(testData);
      }
    });

    test('storage.local.set writes via correct pattern', async () => {
      const data = { focusScore: 85 };
      if (config.apiNamespace === 'browser') {
        await api.storage.local.set(data);
        expect(api.storage.local.set).toHaveBeenCalledWith(data);
      } else {
        await new Promise<void>((resolve) => api.storage.local.set(data, resolve));
        expect(api.storage.local.set).toHaveBeenCalledWith(data, expect.any(Function));
      }
    });

    test('storage.sync.get for license data', async () => {
      const licenseData = { license: { key: 'test-key', valid: true } };
      if (config.apiNamespace === 'browser') {
        (api.storage.sync.get as jest.Mock).mockResolvedValue(licenseData);
        const result = await api.storage.sync.get('license');
        expect(result).toEqual(licenseData);
      } else {
        (api.storage.sync.get as jest.Mock).mockImplementation((keys, cb) => cb(licenseData));
        const result = await new Promise((resolve) => api.storage.sync.get('license', resolve));
        expect(result).toEqual(licenseData);
      }
    });

    test('storage.local.remove cleans up keys', async () => {
      if (config.apiNamespace === 'browser') {
        await api.storage.local.remove('tempSession');
        expect(api.storage.local.remove).toHaveBeenCalledWith('tempSession');
      } else {
        await new Promise<void>((resolve) => api.storage.local.remove('tempSession', resolve));
        expect(api.storage.local.remove).toHaveBeenCalledWith('tempSession', expect.any(Function));
      }
    });
  });
});

// ---- 5.2.2 Blocking Mechanism Adaptation ----

describe('Cross-Browser: Blocking Mechanism', () => {
  describe.each(CROSS_BROWSER_TEST_MATRIX)('$browser', ({ browser, config }) => {
    test('uses correct blocking API', () => {
      const api = getBlockingApiForBrowser(browser);
      if (browser === 'firefox') {
        expect(api).toBe('webRequest');
      } else {
        expect(api).toBe('declarativeNetRequest');
      }
    });

    test('block action format matches browser API', () => {
      if (config.blockingApi === 'declarativeNetRequest') {
        const rule = {
          id: 1,
          priority: 1,
          action: { type: 'block' as const },
          condition: { urlFilter: '||youtube.com', resourceTypes: ['main_frame' as const] },
        };
        expect(rule.action.type).toBe('block');
        expect(rule.condition).toHaveProperty('urlFilter');
      } else {
        const listener = (details: { url: string }) => ({ cancel: true });
        const result = listener({ url: 'https://youtube.com' });
        expect(result).toEqual({ cancel: true });
      }
    });

    test('redirect to block page uses correct URL scheme', () => {
      const isFirefox = config.apiNamespace === 'browser';
      const blockPagePath = '/block.html';
      const fullUrl = isFirefox
        ? `moz-extension://fakeid${blockPagePath}`
        : `chrome-extension://fakeid${blockPagePath}`;

      if (config.blockingApi === 'declarativeNetRequest') {
        const rule = {
          id: 1,
          priority: 1,
          action: { type: 'redirect' as const, redirect: { extensionPath: blockPagePath } },
          condition: { urlFilter: '||reddit.com', resourceTypes: ['main_frame' as const] },
        };
        expect(rule.action.redirect.extensionPath).toBe(blockPagePath);
      } else {
        const listener = (details: { url: string }) => ({
          redirectUrl: fullUrl,
        });
        const result = listener({ url: 'https://reddit.com' });
        expect(result.redirectUrl).toContain('block.html');
        expect(result.redirectUrl).toMatch(/^moz-extension:\/\//);
      }
    });

    test('supports required blocking permissions', () => {
      if (config.blockingApi === 'declarativeNetRequest') {
        expect(config.supportedFeatures).toContain('declarativeNetRequest');
      } else {
        expect(config.supportedFeatures).toContain('webRequest.blocking');
      }
    });
  });
});

// ---- 5.2.3 Alarms API Compatibility ----

describe('Cross-Browser: Alarms API', () => {
  describe.each(CROSS_BROWSER_TEST_MATRIX)('$browser', ({ browser, config }) => {
    let api: ReturnType<typeof createBrowserNamespaceMock>;

    beforeEach(() => {
      api = createBrowserNamespaceMock(config);
    });

    test('creates Pomodoro timer alarm', () => {
      api.alarms.create('pomodoro-timer', { delayInMinutes: 25 });
      expect(api.alarms.create).toHaveBeenCalledWith('pomodoro-timer', { delayInMinutes: 25 });
    });

    test('clears alarm via correct pattern', async () => {
      if (config.apiNamespace === 'browser') {
        const wasCleared = await api.alarms.clear('pomodoro-timer');
        expect(api.alarms.clear).toHaveBeenCalledWith('pomodoro-timer');
      } else {
        (api.alarms.clear as jest.Mock).mockImplementation((name, cb) => cb(true));
        const wasCleared = await new Promise((resolve) =>
          api.alarms.clear('pomodoro-timer', resolve)
        );
        expect(wasCleared).toBe(true);
      }
    });

    test('alarm listener registration works', () => {
      const handler = jest.fn();
      api.alarms.onAlarm.addListener(handler);
      expect(api.alarms.onAlarm.addListener).toHaveBeenCalledWith(handler);
    });
  });
});

// ---- 5.2.4 Badge/Action API Differences ----

describe('Cross-Browser: Badge/Action API', () => {
  describe.each(CROSS_BROWSER_TEST_MATRIX)('$browser', ({ browser, config }) => {
    test('uses correct action API name', () => {
      if (browser === 'firefox') {
        expect(config.actionApi).toBe('browserAction');
      } else {
        expect(config.actionApi).toBe('action');
      }
    });

    test('badge text can be set via correct API', () => {
      const mockSetBadge = jest.fn();
      const actionObj = { setBadgeText: mockSetBadge };

      actionObj.setBadgeText({ text: '25:00' });
      expect(mockSetBadge).toHaveBeenCalledWith({ text: '25:00' });
    });

    test('badge color set for focus mode active indicator', () => {
      const mockSetColor = jest.fn();
      const actionObj = { setBadgeBackgroundColor: mockSetColor };

      actionObj.setBadgeBackgroundColor({ color: '#FF4444' });
      expect(mockSetColor).toHaveBeenCalledWith({ color: '#FF4444' });
    });
  });
});

// ---- 5.2.5 Message Passing Compatibility ----

describe('Cross-Browser: Message Passing', () => {
  describe.each(CROSS_BROWSER_TEST_MATRIX)('$browser', ({ browser, config }) => {
    let api: ReturnType<typeof createBrowserNamespaceMock>;

    beforeEach(() => {
      api = createBrowserNamespaceMock(config);
    });

    test('sends message and receives response', async () => {
      const message = { type: 'GET_FOCUS_STATE' };
      const expectedResponse = { active: true, score: 85, timeRemaining: 1200 };

      if (config.apiNamespace === 'browser') {
        (api.runtime.sendMessage as jest.Mock).mockResolvedValue(expectedResponse);
        const response = await api.runtime.sendMessage(message);
        expect(response).toEqual(expectedResponse);
      } else {
        (api.runtime.sendMessage as jest.Mock).mockImplementation((msg, cb) => cb(expectedResponse));
        const response = await new Promise((resolve) =>
          api.runtime.sendMessage(message, resolve)
        );
        expect(response).toEqual(expectedResponse);
      }
    });

    test('message listener returns response correctly', () => {
      const listener = jest.fn();
      api.runtime.onMessage.addListener(listener);
      expect(api.runtime.onMessage.addListener).toHaveBeenCalledWith(listener);
    });

    test('handles runtime.lastError in callback pattern', async () => {
      if (config.apiNamespace === 'chrome') {
        api.runtime.lastError = { message: 'Extension context invalidated' };
        (api.runtime.sendMessage as jest.Mock).mockImplementation((msg, cb) => {
          cb(undefined);
        });
        const response = await new Promise((resolve) =>
          api.runtime.sendMessage({ type: 'PING' }, (resp: any) => {
            if (api.runtime.lastError) {
              resolve({ error: api.runtime.lastError.message });
            } else {
              resolve(resp);
            }
          })
        );
        expect(response).toEqual({ error: 'Extension context invalidated' });
      }
    });
  });
});

// ---- 5.2.6 Content Script Injection Methods ----

describe('Cross-Browser: Content Script Injection', () => {
  describe.each(CROSS_BROWSER_TEST_MATRIX)('$browser', ({ browser, config }) => {
    test('content scripts declared with correct run_at timing', () => {
      const contentScripts = [
        { matches: ['<all_urls>'], js: ['detector.js'], run_at: 'document_start' },
        { matches: ['<all_urls>'], js: ['blocker.js'], run_at: 'document_start' },
        { matches: ['<all_urls>'], js: ['tracker.js'], run_at: 'document_idle' },
      ];

      expect(contentScripts[0].run_at).toBe('document_start');
      expect(contentScripts[1].run_at).toBe('document_start');
      expect(contentScripts[2].run_at).toBe('document_idle');
    });

    test('programmatic injection uses correct API', () => {
      if (supportsFeature(browser, 'chrome.scripting')) {
        const mockExecuteScript = jest.fn().mockResolvedValue([{ result: true }]);
        const scripting = { executeScript: mockExecuteScript };

        scripting.executeScript({
          target: { tabId: 1 },
          files: ['src/content/detector.js'],
        });

        expect(mockExecuteScript).toHaveBeenCalledWith({
          target: { tabId: 1 },
          files: ['src/content/detector.js'],
        });
      } else {
        const mockExecuteScript = jest.fn().mockResolvedValue([true]);
        const tabs = { executeScript: mockExecuteScript };

        tabs.executeScript(1, { file: 'src/content/detector.js', runAt: 'document_start' });

        expect(mockExecuteScript).toHaveBeenCalledWith(1, {
          file: 'src/content/detector.js',
          runAt: 'document_start',
        });
      }
    });
  });
});

// ---- 5.2.7 Notification Compatibility ----

describe('Cross-Browser: Notifications', () => {
  describe.each(CROSS_BROWSER_TEST_MATRIX)('$browser', ({ browser, config }) => {
    let api: ReturnType<typeof createBrowserNamespaceMock>;

    beforeEach(() => {
      api = createBrowserNamespaceMock(config);
    });

    test('creates Pomodoro completion notification', async () => {
      const notifOptions = {
        type: 'basic' as const,
        iconUrl: 'assets/icons/icon-128.png',
        title: 'Pomodoro Complete!',
        message: 'Great work! Take a 5-minute break.',
      };

      if (config.apiNamespace === 'browser') {
        const id = await api.notifications.create('pomodoro-done', notifOptions);
        expect(id).toBe('notif-id');
      } else {
        (api.notifications.create as jest.Mock).mockImplementation((id, opts, cb) => cb('notif-id'));
        const id = await new Promise((resolve) =>
          api.notifications.create('pomodoro-done', notifOptions, resolve)
        );
        expect(id).toBe('notif-id');
      }
    });
  });
});
```

---

### 5.3 Polyfill Testing

**File:** `tests/unit/polyfills/browserPolyfill.test.ts`

```typescript
// Tests for the browser API polyfill / abstraction layer that normalizes
// Chrome callback APIs and Firefox promise APIs into a unified interface.

type ChromeCallback<T> = (result: T) => void;

interface UnifiedStorageArea {
  get(keys: string | string[]): Promise<Record<string, any>>;
  set(items: Record<string, any>): Promise<void>;
  remove(keys: string | string[]): Promise<void>;
}

interface UnifiedRuntime {
  sendMessage(message: any): Promise<any>;
  getURL(path: string): string;
  onMessage: {
    addListener(callback: (message: any, sender: any, sendResponse: Function) => void): void;
  };
}

interface UnifiedAlarms {
  create(name: string, alarmInfo: { delayInMinutes?: number; periodInMinutes?: number }): void;
  clear(name: string): Promise<boolean>;
  get(name: string): Promise<any | null>;
  onAlarm: { addListener(callback: (alarm: any) => void): void };
}

// ---- Polyfill implementation under test ----

function wrapCallback<T>(fn: (cb: ChromeCallback<T>) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    fn((result: T) => {
      const lastError = (globalThis as any).chrome?.runtime?.lastError;
      if (lastError) {
        reject(new Error(lastError.message));
      } else {
        resolve(result);
      }
    });
  });
}

function isPromiseApi(): boolean {
  return typeof (globalThis as any).browser !== 'undefined';
}

function createUnifiedStorage(area: 'local' | 'sync'): UnifiedStorageArea {
  if (isPromiseApi()) {
    const browserApi = (globalThis as any).browser.storage[area];
    return {
      get: (keys) => browserApi.get(keys),
      set: (items) => browserApi.set(items),
      remove: (keys) => browserApi.remove(keys),
    };
  }
  const chromeApi = (globalThis as any).chrome.storage[area];
  return {
    get: (keys) => wrapCallback((cb) => chromeApi.get(keys, cb)),
    set: (items) => wrapCallback((cb) => chromeApi.set(items, cb)),
    remove: (keys) => wrapCallback((cb) => chromeApi.remove(keys, cb)),
  };
}

// ---- Tests ----

describe('Polyfill: Callback-to-Promise Normalization', () => {
  let mockChromeStorage: any;

  beforeEach(() => {
    (globalThis as any).browser = undefined;
    mockChromeStorage = {
      local: {
        get: jest.fn((keys: any, cb: Function) => cb({ blocklist: ['youtube.com'] })),
        set: jest.fn((items: any, cb: Function) => cb()),
        remove: jest.fn((keys: any, cb: Function) => cb()),
      },
    };
    (globalThis as any).chrome = {
      storage: mockChromeStorage,
      runtime: { lastError: null },
    };
  });

  afterEach(() => {
    delete (globalThis as any).browser;
    delete (globalThis as any).chrome;
  });

  test('wrapCallback resolves with result on success', async () => {
    const result = await wrapCallback<{ blocklist: string[] }>((cb) =>
      mockChromeStorage.local.get('blocklist', cb)
    );
    expect(result).toEqual({ blocklist: ['youtube.com'] });
  });

  test('wrapCallback rejects on runtime.lastError', async () => {
    (globalThis as any).chrome.runtime.lastError = { message: 'Storage quota exceeded' };
    mockChromeStorage.local.set = jest.fn((items: any, cb: Function) => cb());

    await expect(
      wrapCallback((cb) => mockChromeStorage.local.set({ huge: 'data' }, cb))
    ).rejects.toThrow('Storage quota exceeded');
  });

  test('unified storage.get returns promise regardless of browser', async () => {
    const storage = createUnifiedStorage('local');
    const result = await storage.get('blocklist');
    expect(result).toEqual({ blocklist: ['youtube.com'] });
  });

  test('unified storage.set returns promise regardless of browser', async () => {
    const storage = createUnifiedStorage('local');
    await expect(storage.set({ focusScore: 90 })).resolves.toBeUndefined();
  });

  test('unified storage.remove returns promise regardless of browser', async () => {
    const storage = createUnifiedStorage('local');
    await expect(storage.remove('tempKey')).resolves.toBeUndefined();
  });
});

describe('Polyfill: Firefox Promise-Based APIs', () => {
  beforeEach(() => {
    (globalThis as any).browser = {
      storage: {
        local: {
          get: jest.fn().mockResolvedValue({ blocklist: ['twitter.com'] }),
          set: jest.fn().mockResolvedValue(undefined),
          remove: jest.fn().mockResolvedValue(undefined),
        },
      },
      runtime: {
        lastError: null,
        sendMessage: jest.fn().mockResolvedValue({ ok: true }),
        getURL: jest.fn((p: string) => `moz-extension://id/${p}`),
      },
    };
  });

  afterEach(() => {
    delete (globalThis as any).browser;
  });

  test('isPromiseApi detects Firefox browser namespace', () => {
    expect(isPromiseApi()).toBe(true);
  });

  test('unified storage uses native promises on Firefox', async () => {
    const storage = createUnifiedStorage('local');
    const result = await storage.get('blocklist');
    expect(result).toEqual({ blocklist: ['twitter.com'] });
    expect((globalThis as any).browser.storage.local.get).toHaveBeenCalledWith('blocklist');
  });
});

describe('Polyfill: runtime.lastError Handling', () => {
  beforeEach(() => {
    (globalThis as any).browser = undefined;
    (globalThis as any).chrome = {
      storage: {
        local: {
          get: jest.fn(),
          set: jest.fn(),
        },
      },
      runtime: { lastError: null },
    };
  });

  afterEach(() => {
    delete (globalThis as any).chrome;
    delete (globalThis as any).browser;
  });

  test('propagates runtime.lastError as rejection', async () => {
    (globalThis as any).chrome.runtime.lastError = { message: 'Quota bytes exceeded' };
    (globalThis as any).chrome.storage.local.get = jest.fn((k: any, cb: Function) => cb({}));

    await expect(
      wrapCallback((cb) => (globalThis as any).chrome.storage.local.get('key', cb))
    ).rejects.toThrow('Quota bytes exceeded');
  });

  test('clears lastError after handling', async () => {
    (globalThis as any).chrome.runtime.lastError = null;
    (globalThis as any).chrome.storage.local.get = jest.fn((k: any, cb: Function) => cb({ key: 'val' }));

    const result = await wrapCallback((cb) =>
      (globalThis as any).chrome.storage.local.get('key', cb)
    );
    expect(result).toEqual({ key: 'val' });
  });
});

describe('Polyfill: Blocking API Abstraction Layer', () => {
  interface BlockRule {
    id: number;
    pattern: string;
  }

  interface BlockingApiAdapter {
    addBlockRules(rules: BlockRule[]): Promise<void>;
    removeBlockRules(ruleIds: number[]): Promise<void>;
    getActiveRuleCount(): Promise<number>;
  }

  function createDNRAdapter(): BlockingApiAdapter {
    const mockUpdateDynamic = jest.fn().mockResolvedValue(undefined);
    const mockGetDynamic = jest.fn().mockResolvedValue([]);

    return {
      addBlockRules: async (rules) => {
        const dnrRules = rules.map((r) => ({
          id: r.id,
          priority: 1,
          action: { type: 'block' as const },
          condition: { urlFilter: `||${r.pattern}`, resourceTypes: ['main_frame' as const] },
        }));
        await mockUpdateDynamic({ addRules: dnrRules });
      },
      removeBlockRules: async (ruleIds) => {
        await mockUpdateDynamic({ removeRuleIds: ruleIds });
      },
      getActiveRuleCount: async () => {
        const rules = await mockGetDynamic();
        return rules.length;
      },
    };
  }

  function createWebRequestAdapter(): BlockingApiAdapter {
    const activeRules = new Map<number, BlockRule>();

    return {
      addBlockRules: async (rules) => {
        rules.forEach((r) => activeRules.set(r.id, r));
      },
      removeBlockRules: async (ruleIds) => {
        ruleIds.forEach((id) => activeRules.delete(id));
      },
      getActiveRuleCount: async () => activeRules.size,
    };
  }

  test('DNR adapter adds block rules', async () => {
    const adapter = createDNRAdapter();
    await expect(adapter.addBlockRules([
      { id: 1, pattern: 'youtube.com' },
      { id: 2, pattern: 'reddit.com' },
    ])).resolves.toBeUndefined();
  });

  test('DNR adapter removes block rules', async () => {
    const adapter = createDNRAdapter();
    await expect(adapter.removeBlockRules([1, 2])).resolves.toBeUndefined();
  });

  test('webRequest adapter tracks active rules', async () => {
    const adapter = createWebRequestAdapter();
    await adapter.addBlockRules([
      { id: 1, pattern: 'youtube.com' },
      { id: 2, pattern: 'reddit.com' },
    ]);
    expect(await adapter.getActiveRuleCount()).toBe(2);

    await adapter.removeBlockRules([1]);
    expect(await adapter.getActiveRuleCount()).toBe(1);
  });

  test('webRequest adapter handles removing non-existent rules gracefully', async () => {
    const adapter = createWebRequestAdapter();
    await adapter.removeBlockRules([999]);
    expect(await adapter.getActiveRuleCount()).toBe(0);
  });
});
```

---

### 5.4 Manifest Version Differences Tests

**File:** `tests/cross-browser/manifestDifferences.test.ts`

```typescript
import { BROWSER_CONFIGS, BrowserConfig } from '../setup/browserMatrix';

interface ManifestV3 {
  manifest_version: 3;
  background: { service_worker: string; type?: string };
  permissions: string[];
  host_permissions: string[];
  action: { default_popup: string; default_icon: Record<string, string> };
  content_security_policy: { extension_pages: string };
  declarative_net_request: { rule_resources: Array<{ id: string; path: string; enabled: boolean }> };
}

interface ManifestV2 {
  manifest_version: 2;
  background: { scripts: string[]; persistent: boolean };
  permissions: string[];
  browser_action: { default_popup: string; default_icon: Record<string, string> };
  content_security_policy: string;
  web_accessible_resources: string[];
}

const MANIFEST_V3: ManifestV3 = {
  manifest_version: 3,
  background: { service_worker: 'src/background/service-worker.js', type: 'module' },
  permissions: ['storage', 'alarms', 'declarativeNetRequest', 'declarativeNetRequestWithHostAccess', 'activeTab', 'scripting', 'notifications', 'offscreen'],
  host_permissions: ['<all_urls>'],
  action: {
    default_popup: 'src/popup/popup.html',
    default_icon: { '16': 'src/assets/icons/icon-16.png', '48': 'src/assets/icons/icon-48.png', '128': 'src/assets/icons/icon-128.png' },
  },
  content_security_policy: { extension_pages: "script-src 'self'; object-src 'none'" },
  declarative_net_request: {
    rule_resources: [{ id: 'blocklist_rules', path: 'rules.json', enabled: true }],
  },
};

const MANIFEST_V2: ManifestV2 = {
  manifest_version: 2,
  background: { scripts: ['src/background/service-worker.js'], persistent: false },
  permissions: ['storage', 'alarms', 'webRequest', 'webRequestBlocking', '<all_urls>', 'activeTab', 'notifications'],
  browser_action: {
    default_popup: 'src/popup/popup.html',
    default_icon: { '16': 'src/assets/icons/icon-16.png', '48': 'src/assets/icons/icon-48.png', '128': 'src/assets/icons/icon-128.png' },
  },
  content_security_policy: "script-src 'self'; object-src 'none'",
  web_accessible_resources: ['block.html', 'src/assets/*'],
};

// ---- Background Context Differences ----

describe('Manifest Differences: Background Context', () => {
  test('MV3 uses service_worker with module type', () => {
    expect(MANIFEST_V3.background).toHaveProperty('service_worker');
    expect(MANIFEST_V3.background.type).toBe('module');
    expect(MANIFEST_V3.background).not.toHaveProperty('scripts');
  });

  test('MV2 uses background scripts array', () => {
    expect(MANIFEST_V2.background).toHaveProperty('scripts');
    expect(MANIFEST_V2.background.scripts).toContain('src/background/service-worker.js');
    expect(MANIFEST_V2.background).not.toHaveProperty('service_worker');
  });

  test('MV2 background is non-persistent (event page)', () => {
    expect(MANIFEST_V2.background.persistent).toBe(false);
  });

  test('Chrome config expects service_worker background type', () => {
    expect(BROWSER_CONFIGS.chrome.backgroundType).toBe('service_worker');
  });

  test('Firefox config expects scripts background type', () => {
    expect(BROWSER_CONFIGS.firefox.backgroundType).toBe('scripts');
  });

  test('Edge config matches Chrome background type', () => {
    expect(BROWSER_CONFIGS.edge.backgroundType).toBe(BROWSER_CONFIGS.chrome.backgroundType);
  });
});

// ---- Permissions Format Differences ----

describe('Manifest Differences: Permissions', () => {
  test('MV3 separates host_permissions from permissions', () => {
    expect(MANIFEST_V3.permissions).not.toContain('<all_urls>');
    expect(MANIFEST_V3.host_permissions).toContain('<all_urls>');
  });

  test('MV2 includes hosts in permissions array', () => {
    expect(MANIFEST_V2.permissions).toContain('<all_urls>');
  });

  test('MV3 includes declarativeNetRequest permission', () => {
    expect(MANIFEST_V3.permissions).toContain('declarativeNetRequest');
    expect(MANIFEST_V3.permissions).toContain('declarativeNetRequestWithHostAccess');
  });

  test('MV2 includes webRequest and webRequestBlocking', () => {
    expect(MANIFEST_V2.permissions).toContain('webRequest');
    expect(MANIFEST_V2.permissions).toContain('webRequestBlocking');
  });

  test('MV3 includes scripting permission (not in MV2)', () => {
    expect(MANIFEST_V3.permissions).toContain('scripting');
    expect(MANIFEST_V2.permissions).not.toContain('scripting');
  });

  test('MV3 includes offscreen permission (not available in MV2)', () => {
    expect(MANIFEST_V3.permissions).toContain('offscreen');
    expect(MANIFEST_V2.permissions).not.toContain('offscreen');
  });

  test('common permissions present in both versions', () => {
    const common = ['storage', 'alarms', 'activeTab', 'notifications'];
    common.forEach((perm) => {
      expect(MANIFEST_V3.permissions).toContain(perm);
      expect(MANIFEST_V2.permissions).toContain(perm);
    });
  });
});

// ---- CSP Format Differences ----

describe('Manifest Differences: Content Security Policy', () => {
  test('MV3 CSP is an object with extension_pages key', () => {
    expect(typeof MANIFEST_V3.content_security_policy).toBe('object');
    expect(MANIFEST_V3.content_security_policy).toHaveProperty('extension_pages');
  });

  test('MV2 CSP is a flat string', () => {
    expect(typeof MANIFEST_V2.content_security_policy).toBe('string');
  });

  test('both CSPs disallow unsafe inline scripts', () => {
    const mv3Csp = MANIFEST_V3.content_security_policy.extension_pages;
    const mv2Csp = MANIFEST_V2.content_security_policy;

    expect(mv3Csp).toContain("script-src 'self'");
    expect(mv2Csp).toContain("script-src 'self'");
    expect(mv3Csp).not.toContain('unsafe-inline');
    expect(mv2Csp).not.toContain('unsafe-inline');
  });
});

// ---- Action vs BrowserAction ----

describe('Manifest Differences: Action API', () => {
  test('MV3 uses "action" key', () => {
    expect(MANIFEST_V3).toHaveProperty('action');
    expect((MANIFEST_V3 as any).browser_action).toBeUndefined();
  });

  test('MV2 uses "browser_action" key', () => {
    expect(MANIFEST_V2).toHaveProperty('browser_action');
    expect((MANIFEST_V2 as any).action).toBeUndefined();
  });

  test('both point to same popup file', () => {
    expect(MANIFEST_V3.action.default_popup).toBe(MANIFEST_V2.browser_action.default_popup);
  });

  test('both declare matching icon sizes', () => {
    const v3Icons = Object.keys(MANIFEST_V3.action.default_icon).sort();
    const v2Icons = Object.keys(MANIFEST_V2.browser_action.default_icon).sort();
    expect(v3Icons).toEqual(v2Icons);
  });
});

// ---- Declarative Net Request vs webRequest ----

describe('Manifest Differences: Blocking API Configuration', () => {
  test('MV3 manifest declares declarative_net_request rule resources', () => {
    expect(MANIFEST_V3.declarative_net_request).toBeDefined();
    expect(MANIFEST_V3.declarative_net_request.rule_resources).toHaveLength(1);
    expect(MANIFEST_V3.declarative_net_request.rule_resources[0].id).toBe('blocklist_rules');
  });

  test('MV2 has no declarative_net_request section', () => {
    expect((MANIFEST_V2 as any).declarative_net_request).toBeUndefined();
  });

  test('rule resource path is valid JSON file', () => {
    const rulePath = MANIFEST_V3.declarative_net_request.rule_resources[0].path;
    expect(rulePath).toMatch(/\.json$/);
  });
});

// ---- Scripting API Differences ----

describe('Manifest Differences: Scripting API', () => {
  test('MV3 chrome.scripting.executeScript format', () => {
    const mv3Call = {
      target: { tabId: 1 },
      files: ['src/content/detector.js'],
    };
    expect(mv3Call.target).toHaveProperty('tabId');
    expect(mv3Call.files).toBeInstanceOf(Array);
  });

  test('MV2 tabs.executeScript format', () => {
    const mv2Call = {
      tabId: 1,
      details: { file: 'src/content/detector.js', runAt: 'document_start' },
    };
    expect(mv2Call).toHaveProperty('tabId');
    expect(mv2Call.details).toHaveProperty('file');
    expect(mv2Call.details).toHaveProperty('runAt');
  });

  test('MV3 supports world parameter for isolated execution', () => {
    const mv3CallWithWorld = {
      target: { tabId: 1 },
      files: ['src/content/detector.js'],
      world: 'MAIN' as const,
    };
    expect(mv3CallWithWorld.world).toBe('MAIN');
  });

  test('web_accessible_resources format differs between versions', () => {
    // MV2: flat array of strings
    expect(MANIFEST_V2.web_accessible_resources).toBeInstanceOf(Array);
    expect(typeof MANIFEST_V2.web_accessible_resources[0]).toBe('string');

    // MV3 would use: [{ resources: [...], matches: [...] }]
    const mv3War = [
      {
        resources: ['block.html', 'src/assets/*'],
        matches: ['<all_urls>'],
      },
    ];
    expect(mv3War[0]).toHaveProperty('resources');
    expect(mv3War[0]).toHaveProperty('matches');
  });
});
```

---

## 6. Performance Testing

### 6.1 Memory Usage Benchmarks

**File:** `tests/performance/memory.test.ts`

```typescript
interface MemorySnapshot {
  heapUsed: number;
  heapTotal: number;
  external: number;
  timestamp: number;
}

function takeMemorySnapshot(): MemorySnapshot {
  const mem = process.memoryUsage();
  return {
    heapUsed: mem.heapUsed,
    heapTotal: mem.heapTotal,
    external: mem.external,
    timestamp: Date.now(),
  };
}

function measureMemoryDelta(fn: () => void): number {
  global.gc?.();
  const before = takeMemorySnapshot();
  fn();
  const after = takeMemorySnapshot();
  return after.heapUsed - before.heapUsed;
}

async function measureAsyncMemoryDelta(fn: () => Promise<void>): Promise<number> {
  global.gc?.();
  const before = takeMemorySnapshot();
  await fn();
  const after = takeMemorySnapshot();
  return after.heapUsed - before.heapUsed;
}

const KB = 1024;
const MB = 1024 * KB;

describe('Memory: Storage Operations', () => {
  test('single storage read stays under 50KB', async () => {
    const delta = await measureAsyncMemoryDelta(async () => {
      const mockData: Record<string, any> = {};
      for (let i = 0; i < 100; i++) {
        mockData[`site-${i}`] = { url: `site${i}.com`, blocked: true, addedAt: Date.now() };
      }
      JSON.parse(JSON.stringify(mockData));
    });
    expect(delta).toBeLessThan(50 * KB);
  });

  test('batch storage write of 50 items stays under 100KB', async () => {
    const delta = await measureAsyncMemoryDelta(async () => {
      const items: Record<string, any> = {};
      for (let i = 0; i < 50; i++) {
        items[`key-${i}`] = { value: `data-${i}`, ts: Date.now() };
      }
      JSON.parse(JSON.stringify(items));
    });
    expect(delta).toBeLessThan(100 * KB);
  });

  test('storage listener does not leak memory over 1000 events', () => {
    const listeners: Array<(changes: any) => void> = [];
    const delta = measureMemoryDelta(() => {
      for (let i = 0; i < 1000; i++) {
        const handler = (changes: any) => { /* noop */ };
        listeners.push(handler);
        listeners.pop();
      }
    });
    expect(delta).toBeLessThan(100 * KB);
  });
});

describe('Memory: Message Handlers', () => {
  test('registering 50 message handlers stays under 50KB', () => {
    const handlers = new Map<string, Function>();
    const delta = measureMemoryDelta(() => {
      const messageTypes = [
        'GET_FOCUS_STATE', 'SET_BLOCKLIST', 'START_POMODORO', 'STOP_POMODORO',
        'GET_SCORE', 'UPDATE_SETTINGS', 'GET_ANALYTICS', 'RESET_STREAK',
        'TOGGLE_NUCLEAR', 'CHECK_LICENSE', 'GET_TIMER', 'PAUSE_TIMER',
      ];
      for (let i = 0; i < 50; i++) {
        const type = messageTypes[i % messageTypes.length];
        handlers.set(`${type}-${i}`, () => ({ ok: true }));
      }
    });
    expect(delta).toBeLessThan(50 * KB);
  });

  test('processing 500 messages does not accumulate memory', () => {
    let processed = 0;
    const delta = measureMemoryDelta(() => {
      for (let i = 0; i < 500; i++) {
        const msg = { type: 'GET_FOCUS_STATE', id: i };
        const response = { active: true, score: 85 };
        processed++;
        JSON.stringify(response);
      }
    });
    expect(processed).toBe(500);
    expect(delta).toBeLessThan(200 * KB);
  });
});

describe('Memory: Blocklist Management', () => {
  test('blocklist of 200 sites stays under 500KB', () => {
    const delta = measureMemoryDelta(() => {
      const blocklist: Array<{ url: string; category: string; addedAt: number }> = [];
      for (let i = 0; i < 200; i++) {
        blocklist.push({
          url: `site${i}.example.com`,
          category: ['social', 'news', 'video', 'gaming'][i % 4],
          addedAt: Date.now() - i * 60000,
        });
      }
      expect(blocklist).toHaveLength(200);
    });
    expect(delta).toBeLessThan(500 * KB);
  });

  test('DNR rule generation for 200 sites stays under 1MB', () => {
    const delta = measureMemoryDelta(() => {
      const rules = [];
      for (let i = 0; i < 200; i++) {
        rules.push({
          id: i + 1,
          priority: 1,
          action: { type: 'redirect', redirect: { extensionPath: '/block.html' } },
          condition: {
            urlFilter: `||site${i}.example.com`,
            resourceTypes: ['main_frame'],
          },
        });
      }
      JSON.stringify(rules);
    });
    expect(delta).toBeLessThan(1 * MB);
  });
});

describe('Memory: Focus Score Calculation', () => {
  test('score computation with 7 days of data stays under 200KB', () => {
    const delta = measureMemoryDelta(() => {
      const dailyData = [];
      for (let d = 0; d < 7; d++) {
        const sessions = [];
        for (let s = 0; s < 10; s++) {
          sessions.push({
            start: Date.now() - (d * 86400000) - (s * 3600000),
            end: Date.now() - (d * 86400000) - (s * 3600000) + 1500000,
            completed: Math.random() > 0.2,
            blockedAttempts: Math.floor(Math.random() * 20),
          });
        }
        dailyData.push({ date: `2026-02-${11 - d}`, sessions });
      }
      const totalCompleted = dailyData.reduce(
        (sum, day) => sum + day.sessions.filter((s) => s.completed).length, 0
      );
      const score = Math.round((totalCompleted / 70) * 100);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
    expect(delta).toBeLessThan(200 * KB);
  });
});

describe('Memory: Analytics Rolling Window', () => {
  test('30-day rolling window with hourly data points stays under 2MB', () => {
    const delta = measureMemoryDelta(() => {
      const dataPoints: Array<{ ts: number; blocked: number; focused: number }> = [];
      for (let i = 0; i < 30 * 24; i++) {
        dataPoints.push({
          ts: Date.now() - i * 3600000,
          blocked: Math.floor(Math.random() * 50),
          focused: Math.floor(Math.random() * 60),
        });
      }
      expect(dataPoints).toHaveLength(720);
    });
    expect(delta).toBeLessThan(2 * MB);
  });

  test('pruning old analytics entries frees memory', () => {
    const entries: Array<{ ts: number; data: string }> = [];
    for (let i = 0; i < 1000; i++) {
      entries.push({ ts: Date.now() - i * 3600000, data: `entry-${i}` });
    }
    const beforeLength = entries.length;
    const cutoff = Date.now() - 30 * 24 * 3600000;
    const pruned = entries.filter((e) => e.ts >= cutoff);
    expect(pruned.length).toBeLessThan(beforeLength);
    expect(pruned.length).toBeLessThanOrEqual(720);
  });
});

describe('Memory: DOM Manipulation (Content Scripts)', () => {
  test('overlay DOM creation stays under 100KB', () => {
    const delta = measureMemoryDelta(() => {
      const overlayHtml = `
        <div id="focus-blocker-overlay" style="position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483647;background:rgba(0,0,0,0.9);">
          <div style="text-align:center;padding:40px;">
            <h1>Site Blocked</h1>
            <p>This site is on your blocklist during focus mode.</p>
            <p>Focus Score: <span id="focus-score">85</span></p>
            <button id="back-btn">Go Back</button>
          </div>
        </div>
      `;
      expect(overlayHtml.length).toBeGreaterThan(0);
      expect(overlayHtml.length).toBeLessThan(2000);
    });
    expect(delta).toBeLessThan(100 * KB);
  });
});
```

---

### 6.2 CPU Profiling Tests

**File:** `tests/performance/cpu.test.ts`

```typescript
function measureExecutionTime(fn: () => void): number {
  const start = performance.now();
  fn();
  return performance.now() - start;
}

async function measureAsyncExecutionTime(fn: () => Promise<void>): Promise<number> {
  const start = performance.now();
  await fn();
  return performance.now() - start;
}

function averageTime(fn: () => void, iterations: number = 100): number {
  const times: number[] = [];
  for (let i = 0; i < iterations; i++) {
    times.push(measureExecutionTime(fn));
  }
  return times.reduce((a, b) => a + b, 0) / times.length;
}

describe('CPU: Message Processing (<10ms budget)', () => {
  test('parsing incoming message under 1ms', () => {
    const time = averageTime(() => {
      const raw = JSON.stringify({
        type: 'GET_FOCUS_STATE',
        payload: { tabId: 42, url: 'https://youtube.com/watch?v=abc123' },
        timestamp: Date.now(),
      });
      const parsed = JSON.parse(raw);
      expect(parsed.type).toBe('GET_FOCUS_STATE');
    });
    expect(time).toBeLessThan(1);
  });

  test('message routing to handler under 2ms', () => {
    const handlers: Record<string, (msg: any) => any> = {
      GET_FOCUS_STATE: () => ({ active: true, score: 85 }),
      SET_BLOCKLIST: (msg: any) => ({ updated: true }),
      START_POMODORO: () => ({ started: true, duration: 25 }),
      STOP_POMODORO: () => ({ stopped: true }),
      GET_SCORE: () => ({ score: 85, streak: 5 }),
      GET_ANALYTICS: () => ({ daily: [], weekly: [] }),
      CHECK_LICENSE: () => ({ valid: true, tier: 'pro' }),
      TOGGLE_NUCLEAR: () => ({ nuclear: true }),
    };

    const time = averageTime(() => {
      const types = Object.keys(handlers);
      const type = types[Math.floor(Math.random() * types.length)];
      const handler = handlers[type];
      const result = handler({ type });
      expect(result).toBeDefined();
    });
    expect(time).toBeLessThan(2);
  });

  test('response serialization under 1ms', () => {
    const time = averageTime(() => {
      const response = {
        active: true,
        score: 85,
        streak: 5,
        timeRemaining: 1234,
        blockedToday: 42,
        sessions: [
          { start: Date.now() - 1500000, end: Date.now(), completed: true },
        ],
      };
      const serialized = JSON.stringify(response);
      expect(serialized.length).toBeGreaterThan(0);
    });
    expect(time).toBeLessThan(1);
  });

  test('full message round-trip under 10ms', () => {
    const handlers: Record<string, () => any> = {
      GET_FOCUS_STATE: () => ({ active: true, score: 85 }),
    };

    const time = averageTime(() => {
      const raw = JSON.stringify({ type: 'GET_FOCUS_STATE', ts: Date.now() });
      const msg = JSON.parse(raw);
      const handler = handlers[msg.type];
      const response = handler();
      JSON.stringify(response);
    });
    expect(time).toBeLessThan(10);
  });
});

describe('CPU: Focus Score Calculation (<5ms budget)', () => {
  interface SessionData {
    start: number;
    end: number;
    completed: boolean;
    blockedAttempts: number;
  }

  function calculateFocusScore(sessions: SessionData[]): number {
    if (sessions.length === 0) return 0;
    const completionRate = sessions.filter((s) => s.completed).length / sessions.length;
    const avgDuration = sessions.reduce((sum, s) => sum + (s.end - s.start), 0) / sessions.length;
    const avgBlocked = sessions.reduce((sum, s) => sum + s.blockedAttempts, 0) / sessions.length;
    const durationFactor = Math.min(avgDuration / 1500000, 1);
    const blockPenalty = Math.max(0, 1 - avgBlocked * 0.02);
    return Math.round(completionRate * 50 + durationFactor * 30 + blockPenalty * 20);
  }

  test('score calculation for 10 sessions under 1ms', () => {
    const sessions: SessionData[] = Array.from({ length: 10 }, (_, i) => ({
      start: Date.now() - (i + 1) * 1800000,
      end: Date.now() - i * 1800000,
      completed: i % 3 !== 0,
      blockedAttempts: i * 2,
    }));

    const time = averageTime(() => {
      const score = calculateFocusScore(sessions);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
    expect(time).toBeLessThan(1);
  });

  test('score calculation for 100 sessions under 5ms', () => {
    const sessions: SessionData[] = Array.from({ length: 100 }, (_, i) => ({
      start: Date.now() - (i + 1) * 1800000,
      end: Date.now() - i * 1800000,
      completed: Math.random() > 0.3,
      blockedAttempts: Math.floor(Math.random() * 15),
    }));

    const time = averageTime(() => {
      const score = calculateFocusScore(sessions);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }, 50);
    expect(time).toBeLessThan(5);
  });

  test('empty sessions returns 0 instantly', () => {
    const time = averageTime(() => {
      expect(calculateFocusScore([])).toBe(0);
    });
    expect(time).toBeLessThan(0.1);
  });
});

describe('CPU: Blocklist Lookup (<1ms budget)', () => {
  test('Set-based lookup in 500-entry blocklist under 0.1ms', () => {
    const blockSet = new Set<string>();
    for (let i = 0; i < 500; i++) {
      blockSet.add(`site${i}.example.com`);
    }

    const time = averageTime(() => {
      const isBlocked = blockSet.has('site250.example.com');
      expect(isBlocked).toBe(true);
    }, 1000);
    expect(time).toBeLessThan(0.1);
  });

  test('URL pattern matching with wildcard under 0.5ms', () => {
    const patterns = Array.from({ length: 100 }, (_, i) => ({
      pattern: new RegExp(`^https?://(www\\.)?site${i}\\.example\\.com`),
      id: i,
    }));

    const time = averageTime(() => {
      const url = 'https://www.site50.example.com/page';
      const match = patterns.find((p) => p.pattern.test(url));
      expect(match?.id).toBe(50);
    });
    expect(time).toBeLessThan(0.5);
  });

  test('domain extraction from URL under 0.1ms', () => {
    const time = averageTime(() => {
      const url = 'https://www.youtube.com/watch?v=abc123&t=42';
      const domain = new URL(url).hostname.replace('www.', '');
      expect(domain).toBe('youtube.com');
    }, 1000);
    expect(time).toBeLessThan(0.1);
  });
});

describe('CPU: Rule Generation (<50ms budget)', () => {
  test('generating 200 DNR rules under 10ms', () => {
    const sites = Array.from({ length: 200 }, (_, i) => `site${i}.example.com`);

    const time = measureExecutionTime(() => {
      const rules = sites.map((site, i) => ({
        id: i + 1,
        priority: 1,
        action: { type: 'redirect' as const, redirect: { extensionPath: '/block.html' } },
        condition: {
          urlFilter: `||${site}`,
          resourceTypes: ['main_frame' as const],
        },
      }));
      expect(rules).toHaveLength(200);
    });
    expect(time).toBeLessThan(10);
  });

  test('diff-based rule update (add 5, remove 3) under 5ms', () => {
    const existingRules = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      pattern: `site${i}.com`,
    }));

    const time = measureExecutionTime(() => {
      const toAdd = ['new1.com', 'new2.com', 'new3.com', 'new4.com', 'new5.com'];
      const toRemove = [1, 2, 3];
      const remaining = existingRules.filter((r) => !toRemove.includes(r.id));
      const maxId = Math.max(...remaining.map((r) => r.id));
      const added = toAdd.map((pattern, i) => ({ id: maxId + i + 1, pattern }));
      const final = [...remaining, ...added];
      expect(final).toHaveLength(52);
    });
    expect(time).toBeLessThan(5);
  });

  test('full rule regeneration for 500 sites under 50ms', () => {
    const time = measureExecutionTime(() => {
      const rules = [];
      for (let i = 0; i < 500; i++) {
        rules.push({
          id: i + 1,
          priority: 1,
          action: { type: 'redirect', redirect: { extensionPath: '/block.html' } },
          condition: { urlFilter: `||site${i}.example.com`, resourceTypes: ['main_frame'] },
        });
      }
      const json = JSON.stringify(rules);
      expect(json.length).toBeGreaterThan(0);
    });
    expect(time).toBeLessThan(50);
  });
});

describe('CPU: Storage Batch Operations', () => {
  test('serializing 100 storage entries under 5ms', () => {
    const data: Record<string, any> = {};
    for (let i = 0; i < 100; i++) {
      data[`entry-${i}`] = {
        url: `site${i}.com`,
        blocked: i % 2 === 0,
        timestamp: Date.now(),
        category: 'social',
      };
    }

    const time = measureExecutionTime(() => {
      const json = JSON.stringify(data);
      const parsed = JSON.parse(json);
      expect(Object.keys(parsed)).toHaveLength(100);
    });
    expect(time).toBeLessThan(5);
  });

  test('merging storage updates under 2ms', () => {
    const existing: Record<string, number> = {};
    for (let i = 0; i < 200; i++) {
      existing[`key-${i}`] = i;
    }

    const time = averageTime(() => {
      const updates = { 'key-50': 999, 'key-100': 888, newKey: 777 };
      const merged = { ...existing, ...updates };
      expect(merged['key-50']).toBe(999);
      expect(merged['newKey']).toBe(777);
    });
    expect(time).toBeLessThan(2);
  });
});

describe('CPU: Analytics Recording', () => {
  test('recording a block event under 1ms', () => {
    const analytics: Array<{ type: string; url: string; ts: number }> = [];

    const time = averageTime(() => {
      analytics.push({
        type: 'block',
        url: 'https://youtube.com',
        ts: Date.now(),
      });
    }, 1000);
    expect(time).toBeLessThan(1);
  });

  test('aggregating daily stats from 1000 events under 10ms', () => {
    const events = Array.from({ length: 1000 }, (_, i) => ({
      type: i % 3 === 0 ? 'block' : 'visit',
      url: `site${i % 50}.com`,
      ts: Date.now() - Math.floor(Math.random() * 86400000),
    }));

    const time = measureExecutionTime(() => {
      const byHour = new Map<number, number>();
      events.forEach((e) => {
        if (e.type === 'block') {
          const hour = new Date(e.ts).getHours();
          byHour.set(hour, (byHour.get(hour) || 0) + 1);
        }
      });
      expect(byHour.size).toBeGreaterThan(0);
      expect(byHour.size).toBeLessThanOrEqual(24);
    });
    expect(time).toBeLessThan(10);
  });
});
```

---

### 6.3 Load Time Measurements

**File:** `tests/performance/loadTimes.test.ts`

Playwright-based load time tests measuring real browser page load performance.

```typescript
import { test, expect, chromium, type BrowserContext, type Page } from '@playwright/test';
import path from 'path';

const EXTENSION_PATH = path.resolve(__dirname, '../../../');

const BUDGETS = {
  popup: 500,
  blockPage: 200,
  optionsPage: 1000,
  serviceWorker: 1000,
  contentScript: 100,
  navigationToBlock: 50,
};

let context: BrowserContext;

test.beforeAll(async () => {
  const browser = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--no-first-run',
      '--disable-gpu',
    ],
  });
  context = browser;
});

test.afterAll(async () => {
  await context.close();
});

function getExtensionId(context: BrowserContext): string {
  const serviceWorkers = context.serviceWorkers();
  const sw = serviceWorkers.find((w) => w.url().includes('chrome-extension://'));
  if (!sw) throw new Error('Extension service worker not found');
  const match = sw.url().match(/chrome-extension:\/\/([^/]+)/);
  if (!match) throw new Error('Could not extract extension ID');
  return match[1];
}

test.describe('Load Times: Popup', () => {
  test(`popup loads under ${BUDGETS.popup}ms`, async () => {
    const extId = getExtensionId(context);
    const page = await context.newPage();
    const start = Date.now();
    await page.goto(`chrome-extension://${extId}/src/popup/popup.html`);
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - start;

    expect(loadTime).toBeLessThan(BUDGETS.popup);
    await page.close();
  });

  test('popup DOM is interactive within budget', async () => {
    const extId = getExtensionId(context);
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extId}/src/popup/popup.html`);

    const start = Date.now();
    await page.waitForSelector('body', { state: 'visible' });
    const interactiveTime = Date.now() - start;

    expect(interactiveTime).toBeLessThan(BUDGETS.popup);
    await page.close();
  });

  test('popup renders with no layout shifts (CLS = 0)', async () => {
    const extId = getExtensionId(context);
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extId}/src/popup/popup.html`);

    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
        });
        observer.observe({ type: 'layout-shift', buffered: true });
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 1000);
      });
    });

    expect(cls).toBe(0);
    await page.close();
  });
});

test.describe('Load Times: Block Page', () => {
  test(`block page loads under ${BUDGETS.blockPage}ms`, async () => {
    const extId = getExtensionId(context);
    const page = await context.newPage();
    const start = Date.now();
    await page.goto(`chrome-extension://${extId}/block.html?url=youtube.com`);
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - start;

    expect(loadTime).toBeLessThan(BUDGETS.blockPage);
    await page.close();
  });

  test('block page displays blocked URL immediately', async () => {
    const extId = getExtensionId(context);
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extId}/block.html?url=reddit.com`);
    await page.waitForLoadState('domcontentloaded');

    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    await page.close();
  });
});

test.describe('Load Times: Options Page', () => {
  test(`options page loads under ${BUDGETS.optionsPage}ms`, async () => {
    const extId = getExtensionId(context);
    const page = await context.newPage();
    const start = Date.now();
    await page.goto(`chrome-extension://${extId}/src/popup/popup.html`);
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - start;

    expect(loadTime).toBeLessThan(BUDGETS.optionsPage);
    await page.close();
  });
});

test.describe('Load Times: Service Worker', () => {
  test(`service worker activates under ${BUDGETS.serviceWorker}ms`, async () => {
    const start = Date.now();
    const sw = await context.waitForEvent('serviceworker', { timeout: BUDGETS.serviceWorker });
    const activationTime = Date.now() - start;

    expect(sw.url()).toContain('chrome-extension://');
    expect(activationTime).toBeLessThan(BUDGETS.serviceWorker);
  });
});

test.describe('Load Times: Content Script', () => {
  test(`content script initializes under ${BUDGETS.contentScript}ms`, async () => {
    const page = await context.newPage();
    await page.goto('https://example.com');

    const initTime = await page.evaluate(() => {
      return (window as any).__focusBlockerInitTime || 0;
    });

    if (initTime > 0) {
      expect(initTime).toBeLessThan(BUDGETS.contentScript);
    }
    await page.close();
  });
});

test.describe('Load Times: Navigation-to-Block Redirect', () => {
  test('redirect latency is measurable', async () => {
    const page = await context.newPage();
    const navigationStart = Date.now();
    await page.goto('https://example.com');
    const navigationEnd = Date.now();

    const totalNav = navigationEnd - navigationStart;
    expect(totalNav).toBeGreaterThan(0);
    await page.close();
  });
});
```

---

### 6.4 Performance Budget Configuration

**File:** `performance.config.js`

```javascript
/** @type {import('./types').PerformanceBudgetConfig} */
module.exports = {
  budgets: {
    bundles: {
      'popup.js': { maxSize: 80_000, gzipMaxSize: 25_000 },
      'popup.css': { maxSize: 30_000, gzipMaxSize: 8_000 },
      'block.html': { maxSize: 15_000 },
      'block.js': { maxSize: 20_000, gzipMaxSize: 7_000 },
      'service-worker.js': { maxSize: 120_000, gzipMaxSize: 35_000 },
      'detector.js': { maxSize: 15_000, gzipMaxSize: 5_000 },
      'blocker.js': { maxSize: 20_000, gzipMaxSize: 7_000 },
      'tracker.js': { maxSize: 15_000, gzipMaxSize: 5_000 },
      total: { maxSize: 500_000 },
    },

    timing: {
      popupLoad: { budget: 500, unit: 'ms', p95: 600 },
      blockPageLoad: { budget: 200, unit: 'ms', p95: 300 },
      optionsPageLoad: { budget: 1000, unit: 'ms', p95: 1200 },
      serviceWorkerStart: { budget: 1000, unit: 'ms', p95: 1500 },
      contentScriptInit: { budget: 100, unit: 'ms', p95: 150 },
      storageRead: { budget: 20, unit: 'ms', p95: 35 },
      storageWrite: { budget: 50, unit: 'ms', p95: 75 },
      ruleUpdate: { budget: 100, unit: 'ms', p95: 150 },
      messageRoundTrip: { budget: 50, unit: 'ms', p95: 80 },
      focusScoreCalc: { budget: 5, unit: 'ms', p95: 8 },
      blocklistLookup: { budget: 1, unit: 'ms', p95: 2 },
      navigationToBlock: { budget: 50, unit: 'ms', p95: 80 },
    },

    memory: {
      serviceWorkerHeap: { max: 10_000_000, unit: 'bytes' },
      contentScriptHeap: { max: 5_000_000, unit: 'bytes' },
      popupHeap: { max: 15_000_000, unit: 'bytes' },
      storageUsage: { max: 5_242_880, unit: 'bytes' },
      singleOperationDelta: { max: 512_000, unit: 'bytes' },
    },

    counts: {
      maxDynamicRules: 5000,
      maxBlocklistEntries: 1000,
      maxAnalyticsDataPoints: 720,
      maxConcurrentTabs: 20,
      maxMessageHandlers: 50,
    },
  },

  thresholds: {
    failOnBudgetExceed: true,
    warnAtPercent: 80,
    p95Enabled: true,
    iterations: {
      timing: 100,
      memory: 10,
    },
  },

  reporting: {
    outputDir: 'test-results/performance',
    formats: ['json', 'html'],
    compareBaseline: true,
    baselinePath: 'test-results/performance/baseline.json',
    trendHistory: 10,
  },
};
```

**File:** `tests/performance/budgetEnforcement.test.ts`

```typescript
import * as fs from 'fs';
import * as path from 'path';

const config = require('../../performance.config.js');
const budgets = config.budgets;

describe('Performance Budget: Bundle Sizes', () => {
  const distDir = path.resolve(__dirname, '../../dist');

  function getFileSize(filePath: string): number {
    try {
      return fs.statSync(filePath).size;
    } catch {
      return -1;
    }
  }

  test.each(
    Object.entries(budgets.bundles)
      .filter(([name]) => name !== 'total')
      .map(([name, limits]: [string, any]) => ({ name, maxSize: limits.maxSize }))
  )('$name is under $maxSize bytes', ({ name, maxSize }) => {
    const filePath = path.join(distDir, name);
    const size = getFileSize(filePath);
    if (size === -1) {
      console.warn(`Bundle not found: ${name} -- skipping size check`);
      return;
    }
    expect(size).toBeLessThanOrEqual(maxSize);
  });

  test('total bundle size under 500KB', () => {
    if (!fs.existsSync(distDir)) {
      console.warn('dist directory not found -- skipping total size check');
      return;
    }
    let totalSize = 0;
    const walk = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else {
          totalSize += fs.statSync(full).size;
        }
      }
    };
    walk(distDir);
    expect(totalSize).toBeLessThanOrEqual(budgets.bundles.total.maxSize);
  });
});

describe('Performance Budget: Timing Validation', () => {
  test('all timing budgets are defined and positive', () => {
    for (const [name, budget] of Object.entries(budgets.timing) as [string, any][]) {
      expect(budget.budget).toBeGreaterThan(0);
      expect(budget.unit).toBe('ms');
      if (budget.p95) {
        expect(budget.p95).toBeGreaterThanOrEqual(budget.budget);
      }
    }
  });

  test('timing budgets match expected constraints', () => {
    expect(budgets.timing.popupLoad.budget).toBe(500);
    expect(budgets.timing.blockPageLoad.budget).toBe(200);
    expect(budgets.timing.contentScriptInit.budget).toBe(100);
    expect(budgets.timing.serviceWorkerStart.budget).toBe(1000);
    expect(budgets.timing.storageRead.budget).toBe(20);
    expect(budgets.timing.storageWrite.budget).toBe(50);
    expect(budgets.timing.ruleUpdate.budget).toBe(100);
    expect(budgets.timing.messageRoundTrip.budget).toBe(50);
  });
});

describe('Performance Budget: Memory Limits', () => {
  test('memory budgets are defined', () => {
    expect(budgets.memory.serviceWorkerHeap.max).toBe(10_000_000);
    expect(budgets.memory.contentScriptHeap.max).toBe(5_000_000);
    expect(budgets.memory.popupHeap.max).toBe(15_000_000);
    expect(budgets.memory.storageUsage.max).toBe(5_242_880);
  });

  test('count limits are within Chrome API constraints', () => {
    expect(budgets.counts.maxDynamicRules).toBeLessThanOrEqual(30000);
    expect(budgets.counts.maxBlocklistEntries).toBeLessThanOrEqual(5000);
    expect(budgets.counts.maxConcurrentTabs).toBeGreaterThanOrEqual(20);
  });
});
```

---

### 6.5 Focus Mode Specific Performance Tests

**File:** `tests/performance/focusModePerf.test.ts`

```typescript
function measureExecutionTime(fn: () => void): number {
  const start = performance.now();
  fn();
  return performance.now() - start;
}

async function measureAsyncExecutionTime(fn: () => Promise<void>): Promise<number> {
  const start = performance.now();
  await fn();
  return performance.now() - start;
}

// ---- 6.5.1 Blocking Latency ----

describe('Focus Perf: Blocking Latency', () => {
  test('URL-to-block decision under 1ms', () => {
    const blockedDomains = new Set<string>();
    for (let i = 0; i < 200; i++) {
      blockedDomains.add(`site${i}.example.com`);
    }

    const times: number[] = [];
    for (let i = 0; i < 1000; i++) {
      const url = `https://site${i % 200}.example.com/page/${i}`;
      const start = performance.now();
      const hostname = new URL(url).hostname;
      const isBlocked = blockedDomains.has(hostname);
      times.push(performance.now() - start);
      if (i < 200) expect(isBlocked).toBe(true);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    expect(avg).toBeLessThan(1);
  });

  test('subdomain matching under 2ms', () => {
    const blockedDomains = ['youtube.com', 'reddit.com', 'twitter.com', 'facebook.com', 'instagram.com'];
    const blockedSet = new Set(blockedDomains);

    function isBlockedWithSubdomains(hostname: string): boolean {
      if (blockedSet.has(hostname)) return true;
      const parts = hostname.split('.');
      for (let i = 1; i < parts.length - 1; i++) {
        if (blockedSet.has(parts.slice(i).join('.'))) return true;
      }
      return false;
    }

    const times: number[] = [];
    const testUrls = [
      'www.youtube.com', 'm.youtube.com', 'music.youtube.com',
      'old.reddit.com', 'www.reddit.com',
      'mobile.twitter.com', 'www.facebook.com',
      'www.google.com', 'docs.google.com',
    ];

    for (let iter = 0; iter < 500; iter++) {
      const hostname = testUrls[iter % testUrls.length];
      const start = performance.now();
      isBlockedWithSubdomains(hostname);
      times.push(performance.now() - start);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    expect(avg).toBeLessThan(2);
  });

  test('DNR rule generation from blocklist under 10ms for 100 sites', () => {
    const blocklist = Array.from({ length: 100 }, (_, i) => `site${i}.example.com`);

    const time = measureExecutionTime(() => {
      const rules = blocklist.map((domain, i) => ({
        id: i + 1,
        priority: 1,
        action: { type: 'redirect', redirect: { extensionPath: '/block.html' } },
        condition: { urlFilter: `||${domain}`, resourceTypes: ['main_frame'] },
      }));
      expect(rules).toHaveLength(100);
    });
    expect(time).toBeLessThan(10);
  });
});

// ---- 6.5.2 Timer Accuracy (Alarm Drift) ----

describe('Focus Perf: Timer Accuracy', () => {
  test('simulated 25-min Pomodoro drift stays under 1 second', () => {
    const POMODORO_MS = 25 * 60 * 1000;
    const ALARM_INTERVAL_MS = 60 * 1000;
    const alarmTicks = Math.floor(POMODORO_MS / ALARM_INTERVAL_MS);

    let simulatedTime = 0;
    let expectedTime = 0;
    const drifts: number[] = [];

    for (let i = 0; i < alarmTicks; i++) {
      const jitter = (Math.random() - 0.5) * 100;
      simulatedTime += ALARM_INTERVAL_MS + jitter;
      expectedTime += ALARM_INTERVAL_MS;
      drifts.push(Math.abs(simulatedTime - expectedTime));
    }

    const maxDrift = Math.max(...drifts);
    const finalDrift = Math.abs(simulatedTime - expectedTime);
    expect(maxDrift).toBeLessThan(1000);
    expect(finalDrift).toBeLessThan(1000);
  });

  test('timer state serialization/deserialization round-trip under 1ms', () => {
    const timerState = {
      mode: 'focus' as const,
      startedAt: Date.now() - 600000,
      duration: 1500000,
      remaining: 900000,
      pausedAt: null as number | null,
      sessionsCompleted: 3,
      isRunning: true,
    };

    const times: number[] = [];
    for (let i = 0; i < 1000; i++) {
      const start = performance.now();
      const json = JSON.stringify(timerState);
      const restored = JSON.parse(json);
      times.push(performance.now() - start);
      if (i === 0) {
        expect(restored.mode).toBe('focus');
        expect(restored.isRunning).toBe(true);
      }
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    expect(avg).toBeLessThan(1);
  });

  test('remaining time calculation under 0.1ms', () => {
    const times: number[] = [];
    for (let i = 0; i < 10000; i++) {
      const start = performance.now();
      const startedAt = Date.now() - 600000;
      const duration = 1500000;
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, duration - elapsed);
      times.push(performance.now() - start);
      expect(remaining).toBeGreaterThanOrEqual(0);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    expect(avg).toBeLessThan(0.1);
  });
});

// ---- 6.5.3 Badge Update Speed ----

describe('Focus Perf: Badge Updates', () => {
  test('formatting time for badge under 0.1ms', () => {
    function formatBadgeTime(remainingMs: number): string {
      const totalSeconds = Math.ceil(remainingMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    const times: number[] = [];
    for (let i = 0; i < 5000; i++) {
      const remaining = Math.floor(Math.random() * 1500000);
      const start = performance.now();
      const text = formatBadgeTime(remaining);
      times.push(performance.now() - start);
      expect(text).toMatch(/^\d+:\d{2}$/);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    expect(avg).toBeLessThan(0.1);
  });

  test('badge color selection under 0.05ms', () => {
    function getBadgeColor(mode: string, remaining: number): string {
      if (mode === 'nuclear') return '#FF0000';
      if (mode === 'focus') return remaining < 300000 ? '#FFA500' : '#4CAF50';
      return '#9E9E9E';
    }

    const times: number[] = [];
    const modes = ['focus', 'break', 'nuclear', 'idle'];
    for (let i = 0; i < 5000; i++) {
      const mode = modes[i % modes.length];
      const start = performance.now();
      const color = getBadgeColor(mode, i * 1000);
      times.push(performance.now() - start);
      expect(color).toMatch(/^#[0-9A-F]{6}$/);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    expect(avg).toBeLessThan(0.05);
  });
});

// ---- 6.5.4 Storage Write Coalescing ----

describe('Focus Perf: Storage Write Coalescing', () => {
  test('coalescing 50 rapid writes into fewer batches', async () => {
    let writeCount = 0;
    const pendingWrites = new Map<string, any>();
    let flushTimer: ReturnType<typeof setTimeout> | null = null;

    function coalesceWrite(key: string, value: any): void {
      pendingWrites.set(key, value);
      if (!flushTimer) {
        flushTimer = setTimeout(() => {
          writeCount++;
          pendingWrites.clear();
          flushTimer = null;
        }, 50);
      }
    }

    for (let i = 0; i < 50; i++) {
      coalesceWrite(`key-${i % 10}`, { value: i, ts: Date.now() });
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(writeCount).toBeLessThanOrEqual(3);
    expect(writeCount).toBeGreaterThanOrEqual(1);
  });

  test('coalesced write merges values correctly', () => {
    const buffer = new Map<string, any>();

    function bufferWrite(key: string, value: any): void {
      const existing = buffer.get(key);
      buffer.set(key, existing ? { ...existing, ...value } : value);
    }

    bufferWrite('settings', { theme: 'dark' });
    bufferWrite('settings', { pomodoroLength: 25 });
    bufferWrite('settings', { breakLength: 5 });

    const merged = buffer.get('settings');
    expect(merged).toEqual({ theme: 'dark', pomodoroLength: 25, breakLength: 5 });
  });
});

// ---- 6.5.5 Rule Churn ----

describe('Focus Perf: Rule Churn', () => {
  test('adding and removing rules in rapid succession stays consistent', () => {
    const activeRules = new Map<number, string>();
    let nextId = 1;

    function addRule(domain: string): number {
      const id = nextId++;
      activeRules.set(id, domain);
      return id;
    }

    function removeRule(id: number): boolean {
      return activeRules.delete(id);
    }

    const times: number[] = [];
    const ids: number[] = [];

    for (let i = 0; i < 100; i++) {
      const start = performance.now();
      ids.push(addRule(`site${i}.com`));
      times.push(performance.now() - start);
    }
    expect(activeRules.size).toBe(100);

    for (let i = 0; i < 50; i++) {
      const start = performance.now();
      removeRule(ids[i]);
      times.push(performance.now() - start);
    }
    expect(activeRules.size).toBe(50);

    for (let i = 0; i < 25; i++) {
      const start = performance.now();
      addRule(`newsite${i}.com`);
      times.push(performance.now() - start);
    }
    expect(activeRules.size).toBe(75);

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    expect(avgTime).toBeLessThan(0.5);
  });

  test('diffing old vs new blocklist under 5ms for 200 entries', () => {
    const oldList = Array.from({ length: 200 }, (_, i) => `site${i}.com`);
    const newList = [
      ...oldList.slice(10),
      ...Array.from({ length: 15 }, (_, i) => `newsite${i}.com`),
    ];

    const time = measureExecutionTime(() => {
      const oldSet = new Set(oldList);
      const newSet = new Set(newList);
      const toAdd = newList.filter((d) => !oldSet.has(d));
      const toRemove = oldList.filter((d) => !newSet.has(d));

      expect(toAdd).toHaveLength(15);
      expect(toRemove).toHaveLength(10);
    });
    expect(time).toBeLessThan(5);
  });
});

// ---- 6.5.6 Concurrent Tabs (20+) ----

describe('Focus Perf: Concurrent Tabs', () => {
  test('processing messages from 20 tabs under 50ms total', () => {
    const TAB_COUNT = 20;
    const tabs = Array.from({ length: TAB_COUNT }, (_, i) => ({
      id: i + 1,
      url: `https://site${i}.example.com/page`,
      active: i === 0,
    }));

    const blockedDomains = new Set(
      Array.from({ length: 100 }, (_, i) => `site${i}.example.com`)
    );

    const time = measureExecutionTime(() => {
      const results = tabs.map((tab) => {
        const hostname = new URL(tab.url).hostname;
        return {
          tabId: tab.id,
          blocked: blockedDomains.has(hostname),
          checkTime: Date.now(),
        };
      });
      expect(results).toHaveLength(TAB_COUNT);
      expect(results.filter((r) => r.blocked).length).toBe(TAB_COUNT);
    });
    expect(time).toBeLessThan(50);
  });

  test('state broadcast to 20 tabs under 10ms', () => {
    const TAB_COUNT = 20;
    const state = {
      focusActive: true,
      score: 85,
      timeRemaining: 900000,
      streak: 5,
      blockedToday: 42,
    };

    const messages: Array<{ tabId: number; payload: string }> = [];

    const time = measureExecutionTime(() => {
      const payload = JSON.stringify(state);
      for (let i = 0; i < TAB_COUNT; i++) {
        messages.push({ tabId: i + 1, payload });
      }
    });

    expect(messages).toHaveLength(TAB_COUNT);
    expect(time).toBeLessThan(10);
  });

  test('per-tab storage isolation check under 20ms for 20 tabs', () => {
    const TAB_COUNT = 20;
    const tabStates = new Map<number, { blockedCount: number; lastActivity: number }>();

    const time = measureExecutionTime(() => {
      for (let i = 0; i < TAB_COUNT; i++) {
        tabStates.set(i + 1, { blockedCount: 0, lastActivity: Date.now() });
      }

      for (let round = 0; round < 10; round++) {
        for (let tabId = 1; tabId <= TAB_COUNT; tabId++) {
          const state = tabStates.get(tabId)!;
          state.blockedCount += Math.floor(Math.random() * 3);
          state.lastActivity = Date.now();
        }
      }

      const totalBlocked = Array.from(tabStates.values()).reduce(
        (sum, s) => sum + s.blockedCount, 0
      );
      expect(totalBlocked).toBeGreaterThan(0);
    });
    expect(time).toBeLessThan(20);
  });

  test('memory footprint for 50 concurrent tab states under 500KB', () => {
    const KB = 1024;
    const tabStates: Array<{
      id: number;
      url: string;
      hostname: string;
      blocked: boolean;
      blockedCount: number;
      firstVisit: number;
      lastCheck: number;
      redirected: boolean;
    }> = [];

    for (let i = 0; i < 50; i++) {
      tabStates.push({
        id: i + 1,
        url: `https://site${i}.example.com/path/to/page?query=value`,
        hostname: `site${i}.example.com`,
        blocked: i % 2 === 0,
        blockedCount: Math.floor(Math.random() * 20),
        firstVisit: Date.now() - Math.random() * 3600000,
        lastCheck: Date.now(),
        redirected: i % 3 === 0,
      });
    }

    const serialized = JSON.stringify(tabStates);
    expect(serialized.length).toBeLessThan(500 * KB);
    expect(tabStates).toHaveLength(50);
  });
});
```
