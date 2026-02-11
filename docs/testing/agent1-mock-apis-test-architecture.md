# Mock Chrome APIs & Test Architecture

## Focus Mode - Blocker v1.0.0 | Automated Testing Suite (Sections 1-2)

---

## Table of Contents

1. [Testing Architecture Overview](#1-testing-architecture-overview)
2. [Mock Chrome APIs Setup](#2-mock-chrome-apis-setup)
3. [Focus Mode Default Test Data](#3-focus-mode-default-test-data)

---

## 1. Testing Architecture Overview

### 1.1 Testing Pyramid for Focus Mode - Blocker

```
                    /‾‾‾‾‾‾‾‾‾‾‾‾\
                   /   E2E (10%)   \        Playwright
                  /  Full blocking  \       Real browser
                 /   flows, popup    \      ~15 tests
                /‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\
               / Integration (20%)      \   Jest + mocks
              /  Storage ↔ DNR rules     \  Message passing
             /   Timer ↔ Notifications    \ ~40 tests
            /‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\
           /        Unit Tests (70%)         \  Jest
          /  Focus Score, Streaks, Blocklist   \ Pure logic
         /   License cache, Paywall triggers    \ ~100 tests
        /‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\
```

| Layer | Coverage | Target Count | Key Areas |
|-------|----------|-------------|-----------|
| Unit | 70% | ~100 tests | Focus Score calc, streak logic, blocklist CRUD, license cache, paywall triggers, storage helpers, Pomodoro state machine |
| Integration | 20% | ~40 tests | Storage-to-DNR rule sync, popup-background messaging, timer-notification flow, onboarding state, Nuclear Mode resistance layers |
| E2E | 10% | ~15 tests | Full block flow, popup interactions, Pomodoro session, block page display, onboarding walkthrough |

### 1.2 Project Structure

```
focus-mode-blocker/
├── src/
│   ├── background/
│   │   └── service-worker.js          # Main service worker (module)
│   ├── content/
│   │   ├── detector.js                # Site detection (document_start)
│   │   ├── blocker.js                 # Block enforcement (document_start)
│   │   ├── tracker.js                 # Usage tracking (document_idle)
│   │   └── block-page.html            # Injected block page
│   ├── popup/
│   │   └── popup.html                 # Popup UI (380x500-580px)
│   ├── options/
│   │   └── options.html               # Options page
│   ├── assets/
│   │   └── icons/                     # Extension icons
│   └── manifest.json                  # MV3 manifest
├── tests/
│   ├── setup/
│   │   ├── jest.setup.ts              # Global test setup
│   │   ├── chrome-mock.ts             # Complete Chrome API mocks
│   │   └── test-data.ts               # Default test data & factories
│   ├── unit/
│   │   ├── blocklist.test.ts          # Blocklist CRUD, limits
│   │   ├── focus-score.test.ts        # Score calculation (4 factors)
│   │   ├── streaks.test.ts            # Daily streaks, milestones
│   │   ├── pomodoro.test.ts           # Timer state machine
│   │   ├── license-cache.test.ts      # 5-level cache hierarchy
│   │   ├── paywall-triggers.test.ts   # T1-T10 trigger conditions
│   │   ├── nuclear-mode.test.ts       # Resistance layers
│   │   ├── storage-helpers.test.ts    # Get/set/migrate
│   │   └── badge.test.ts             # Badge text & color
│   ├── integration/
│   │   ├── storage-dnr-sync.test.ts   # Blocklist → DNR rules
│   │   ├── popup-background.test.ts   # Message passing flows
│   │   ├── timer-notifications.test.ts # Alarm → notification
│   │   ├── onboarding-flow.test.ts    # Install → 5 slides
│   │   ├── block-flow.test.ts         # Detect → block → redirect
│   │   └── nuclear-mode-full.test.ts  # All 6 resistance layers
│   ├── e2e/
│   │   ├── playwright.config.ts       # Playwright config
│   │   ├── full-block.spec.ts         # Navigate → blocked
│   │   ├── popup-interaction.spec.ts  # Popup UI flows
│   │   ├── pomodoro-session.spec.ts   # Start/pause/complete
│   │   └── onboarding.spec.ts         # First-run experience
│   └── helpers/
│       ├── mock-factories.ts          # Create test objects
│       ├── wait-helpers.ts            # Async test utilities
│       └── dom-helpers.ts             # DOM testing utilities
├── jest.config.js
├── playwright.config.ts
└── package.json
```

### 1.3 Core Testing Dependencies

```json
{
  "devDependencies": {
    "jest": "^29.7.0",
    "ts-jest": "^29.1.2",
    "@types/jest": "^29.5.12",
    "jest-environment-jsdom": "^29.7.0",
    "@anthropic-ai/jest-chrome": "^0.9.0",
    "sinon-chrome": "^3.0.1",
    "@types/chrome": "^0.0.268",
    "@testing-library/dom": "^10.1.0",
    "@testing-library/jest-dom": "^6.4.5",
    "playwright": "^1.44.0",
    "@playwright/test": "^1.44.0",
    "typescript": "^5.4.5",
    "webextensions-polyfill": "^0.12.0"
  },
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=tests/unit",
    "test:integration": "jest --testPathPattern=tests/integration",
    "test:e2e": "npx playwright test",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch"
  }
}
```

---

## 2. Mock Chrome APIs Setup

### 2.1 Jest Configuration

```js
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  setupFilesAfterSetup: ['<rootDir>/tests/setup/jest.setup.ts'],
  moduleNameMapper: {
    '^@background/(.*)$': '<rootDir>/src/background/$1',
    '^@content/(.*)$': '<rootDir>/src/content/$1',
    '^@popup/(.*)$': '<rootDir>/src/popup/$1',
    '^@options/(.*)$': '<rootDir>/src/options/$1',
    '^@assets/(.*)$': '<rootDir>/src/assets/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
    '\\.(css|less|scss)$': '<rootDir>/tests/setup/__mocks__/styleMock.js',
    '\\.(png|svg|jpg|gif)$': '<rootDir>/tests/setup/__mocks__/fileMock.js',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
    '^.+\\.jsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  transformIgnorePatterns: ['/node_modules/(?!webextensions-polyfill)'],
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/assets/**',
  ],
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  testTimeout: 10000,
};
```

### 2.2 Jest Setup File

```ts
// tests/setup/jest.setup.ts
import '@testing-library/jest-dom';
import { setupAllMocks, resetAllMocks } from './chrome-mock';

// Initialize all Chrome API mocks before each test file
beforeAll(() => {
  setupAllMocks();
});

// Reset mock state between tests
beforeEach(() => {
  resetAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

// Suppress known console warnings in test output
const originalConsoleWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (msg.includes('chrome.runtime.id is not set')) return;
  originalConsoleWarn(...args);
};
```

### 2.3 Complete Chrome API Mock Implementation

```ts
// tests/setup/chrome-mock.ts

import { DEFAULT_STORAGE_STATE } from './test-data';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

interface StorageArea {
  _data: Record<string, unknown>;
  get: jest.Mock;
  set: jest.Mock;
  remove: jest.Mock;
  clear: jest.Mock;
  getBytesInUse: jest.Mock;
}

interface StorageChangeListener {
  (changes: Record<string, chrome.storage.StorageChange>, areaName: string): void;
}

interface AlarmInfo {
  name: string;
  scheduledTime: number;
  periodInMinutes?: number;
}

interface DNRRule {
  id: number;
  priority: number;
  action: { type: string; redirect?: { url?: string } };
  condition: {
    urlFilter?: string;
    requestDomains?: string[];
    resourceTypes?: string[];
  };
}

interface MessageListener {
  (
    message: unknown,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ): boolean | void;
}

// ============================================================
// INTERNAL STATE
// ============================================================

let storageChangeListeners: StorageChangeListener[] = [];
let alarmListeners: ((alarm: AlarmInfo) => void)[] = [];
let messageListeners: MessageListener[] = [];
let installedListeners: ((details: { reason: string; previousVersion?: string }) => void)[] = [];
let notificationClickListeners: ((notificationId: string) => void)[] = [];
let notificationCloseListeners: ((notificationId: string, byUser: boolean) => void)[] = [];

let registeredAlarms: Map<string, AlarmInfo> = new Map();
let dynamicRules: DNRRule[] = [];
let sessionRules: DNRRule[] = [];
let createdNotifications: Map<string, chrome.notifications.NotificationOptions> = new Map();

// ============================================================
// STORAGE API MOCK
// ============================================================

function createStorageArea(areaName: string, initialData: Record<string, unknown> = {}): StorageArea {
  const area: StorageArea = {
    _data: { ...initialData },

    get: jest.fn((keys, callback?) => {
      const result: Record<string, unknown> = {};

      if (keys === null || keys === undefined) {
        Object.assign(result, area._data);
      } else if (typeof keys === 'string') {
        if (keys in area._data) result[keys] = area._data[keys];
      } else if (Array.isArray(keys)) {
        keys.forEach((k: string) => {
          if (k in area._data) result[k] = area._data[k];
        });
      } else if (typeof keys === 'object') {
        // keys with defaults
        Object.entries(keys).forEach(([k, defaultVal]) => {
          result[k] = k in area._data ? area._data[k] : defaultVal;
        });
      }

      if (callback) {
        callback(result);
        return undefined;
      }
      return Promise.resolve(result);
    }),

    set: jest.fn((items, callback?) => {
      const changes: Record<string, chrome.storage.StorageChange> = {};
      Object.entries(items).forEach(([key, newValue]) => {
        const oldValue = area._data[key];
        area._data[key] = JSON.parse(JSON.stringify(newValue)); // deep clone
        changes[key] = { oldValue, newValue };
      });

      // Fire change listeners
      storageChangeListeners.forEach((listener) => {
        listener(changes, areaName);
      });

      if (callback) {
        callback();
        return undefined;
      }
      return Promise.resolve();
    }),

    remove: jest.fn((keys, callback?) => {
      const changes: Record<string, chrome.storage.StorageChange> = {};
      const keyList = typeof keys === 'string' ? [keys] : keys;
      keyList.forEach((key: string) => {
        if (key in area._data) {
          changes[key] = { oldValue: area._data[key] };
          delete area._data[key];
        }
      });

      storageChangeListeners.forEach((listener) => {
        listener(changes, areaName);
      });

      if (callback) {
        callback();
        return undefined;
      }
      return Promise.resolve();
    }),

    clear: jest.fn((callback?) => {
      const changes: Record<string, chrome.storage.StorageChange> = {};
      Object.entries(area._data).forEach(([key, oldValue]) => {
        changes[key] = { oldValue };
      });
      area._data = {};

      storageChangeListeners.forEach((listener) => {
        listener(changes, areaName);
      });

      if (callback) {
        callback();
        return undefined;
      }
      return Promise.resolve();
    }),

    getBytesInUse: jest.fn((keys, callback?) => {
      const bytes = JSON.stringify(area._data).length;
      if (callback) {
        callback(bytes);
        return undefined;
      }
      return Promise.resolve(bytes);
    }),
  };

  return area;
}

const mockStorageLocal = createStorageArea('local', DEFAULT_STORAGE_STATE.local);
const mockStorageSync = createStorageArea('sync', DEFAULT_STORAGE_STATE.sync);
const mockStorageSession = createStorageArea('session', DEFAULT_STORAGE_STATE.session);

const mockStorage = {
  local: mockStorageLocal,
  sync: mockStorageSync,
  session: mockStorageSession,
  managed: createStorageArea('managed'),
  onChanged: {
    addListener: jest.fn((listener: StorageChangeListener) => {
      storageChangeListeners.push(listener);
    }),
    removeListener: jest.fn((listener: StorageChangeListener) => {
      storageChangeListeners = storageChangeListeners.filter((l) => l !== listener);
    }),
    hasListener: jest.fn((listener: StorageChangeListener) => {
      return storageChangeListeners.includes(listener);
    }),
  },
};

// ============================================================
// DECLARATIVENETREQUEST API MOCK
// ============================================================

const MAX_DYNAMIC_RULES = 30000;

const mockDeclarativeNetRequest = {
  updateDynamicRules: jest.fn(
    (options: { removeRuleIds?: number[]; addRules?: DNRRule[] }, callback?) => {
      // Remove rules
      if (options.removeRuleIds && options.removeRuleIds.length > 0) {
        dynamicRules = dynamicRules.filter(
          (rule) => !options.removeRuleIds!.includes(rule.id)
        );
      }

      // Add rules
      if (options.addRules && options.addRules.length > 0) {
        const totalAfterAdd = dynamicRules.length + options.addRules.length;
        if (totalAfterAdd > MAX_DYNAMIC_RULES) {
          const error = new Error(
            `Rule count exceeded. Max ${MAX_DYNAMIC_RULES}, attempted ${totalAfterAdd}.`
          );
          if (callback) {
            chrome.runtime.lastError = { message: error.message };
            callback();
            chrome.runtime.lastError = undefined;
            return undefined;
          }
          return Promise.reject(error);
        }
        dynamicRules.push(...options.addRules);
      }

      if (callback) {
        callback();
        return undefined;
      }
      return Promise.resolve();
    }
  ),

  getDynamicRules: jest.fn((callback?) => {
    const rules = [...dynamicRules];
    if (callback) {
      callback(rules);
      return undefined;
    }
    return Promise.resolve(rules);
  }),

  updateSessionRules: jest.fn(
    (options: { removeRuleIds?: number[]; addRules?: DNRRule[] }, callback?) => {
      if (options.removeRuleIds) {
        sessionRules = sessionRules.filter(
          (rule) => !options.removeRuleIds!.includes(rule.id)
        );
      }
      if (options.addRules) {
        sessionRules.push(...options.addRules);
      }
      if (callback) {
        callback();
        return undefined;
      }
      return Promise.resolve();
    }
  ),

  getSessionRules: jest.fn((callback?) => {
    const rules = [...sessionRules];
    if (callback) {
      callback(rules);
      return undefined;
    }
    return Promise.resolve(rules);
  }),

  getAvailableStaticRuleCount: jest.fn((callback?) => {
    const count = MAX_DYNAMIC_RULES - dynamicRules.length;
    if (callback) {
      callback(count);
      return undefined;
    }
    return Promise.resolve(count);
  }),

  MAX_NUMBER_OF_DYNAMIC_RULES: MAX_DYNAMIC_RULES,

  RuleActionType: {
    BLOCK: 'block',
    REDIRECT: 'redirect',
    ALLOW: 'allow',
    UPGRADE_SCHEME: 'upgradeScheme',
    MODIFY_HEADERS: 'modifyHeaders',
    ALLOW_ALL_REQUESTS: 'allowAllRequests',
  },

  ResourceType: {
    MAIN_FRAME: 'main_frame',
    SUB_FRAME: 'sub_frame',
    STYLESHEET: 'stylesheet',
    SCRIPT: 'script',
    IMAGE: 'image',
    XMLHTTPREQUEST: 'xmlhttprequest',
    OTHER: 'other',
  },
};

// ============================================================
// ALARMS API MOCK
// ============================================================

const mockAlarms = {
  create: jest.fn((name: string, alarmInfo: { delayInMinutes?: number; periodInMinutes?: number; when?: number }) => {
    const scheduledTime = alarmInfo.when
      ? alarmInfo.when
      : Date.now() + (alarmInfo.delayInMinutes || 0) * 60 * 1000;

    const alarm: AlarmInfo = {
      name,
      scheduledTime,
      periodInMinutes: alarmInfo.periodInMinutes,
    };
    registeredAlarms.set(name, alarm);
    return Promise.resolve();
  }),

  get: jest.fn((name: string, callback?) => {
    const alarm = registeredAlarms.get(name) || null;
    if (callback) {
      callback(alarm);
      return undefined;
    }
    return Promise.resolve(alarm);
  }),

  getAll: jest.fn((callback?) => {
    const all = Array.from(registeredAlarms.values());
    if (callback) {
      callback(all);
      return undefined;
    }
    return Promise.resolve(all);
  }),

  clear: jest.fn((name: string, callback?) => {
    const existed = registeredAlarms.has(name);
    registeredAlarms.delete(name);
    if (callback) {
      callback(existed);
      return undefined;
    }
    return Promise.resolve(existed);
  }),

  clearAll: jest.fn((callback?) => {
    registeredAlarms.clear();
    if (callback) {
      callback(true);
      return undefined;
    }
    return Promise.resolve(true);
  }),

  onAlarm: {
    addListener: jest.fn((listener: (alarm: AlarmInfo) => void) => {
      alarmListeners.push(listener);
    }),
    removeListener: jest.fn((listener: (alarm: AlarmInfo) => void) => {
      alarmListeners = alarmListeners.filter((l) => l !== listener);
    }),
    hasListener: jest.fn((listener: (alarm: AlarmInfo) => void) => {
      return alarmListeners.includes(listener);
    }),
  },
};

/**
 * Test helper: Trigger an alarm by name. Simulates the alarm firing.
 * Use in tests: triggerAlarm('focus-timer')
 */
function triggerAlarm(name: string): void {
  const alarm = registeredAlarms.get(name);
  const alarmData = alarm || { name, scheduledTime: Date.now() };
  alarmListeners.forEach((listener) => listener(alarmData));

  // If periodic, reschedule
  if (alarm?.periodInMinutes) {
    alarm.scheduledTime = Date.now() + alarm.periodInMinutes * 60 * 1000;
  } else {
    registeredAlarms.delete(name);
  }
}

// ============================================================
// TABS API MOCK
// ============================================================

let mockTabs: chrome.tabs.Tab[] = [
  { id: 1, index: 0, windowId: 1, active: true, url: 'https://example.com', title: 'Example', pinned: false, highlighted: true, incognito: false, status: 'complete' } as chrome.tabs.Tab,
];
let nextTabId = 2;

const mockTabsApi = {
  query: jest.fn((queryInfo: chrome.tabs.QueryInfo, callback?) => {
    let filtered = [...mockTabs];
    if (queryInfo.active !== undefined) filtered = filtered.filter((t) => t.active === queryInfo.active);
    if (queryInfo.currentWindow !== undefined) filtered = filtered.filter((t) => t.windowId === 1);
    if (queryInfo.url) {
      const pattern = typeof queryInfo.url === 'string' ? queryInfo.url : '';
      filtered = filtered.filter((t) => t.url?.includes(pattern.replace(/\*/g, '')));
    }
    if (callback) { callback(filtered); return undefined; }
    return Promise.resolve(filtered);
  }),

  get: jest.fn((tabId: number, callback?) => {
    const tab = mockTabs.find((t) => t.id === tabId) || null;
    if (callback) { callback(tab); return undefined; }
    return Promise.resolve(tab);
  }),

  create: jest.fn((props: chrome.tabs.CreateProperties, callback?) => {
    const newTab: chrome.tabs.Tab = {
      id: nextTabId++,
      index: mockTabs.length,
      windowId: props.windowId || 1,
      active: props.active !== false,
      url: props.url || 'chrome://newtab',
      title: '',
      pinned: props.pinned || false,
      highlighted: false,
      incognito: false,
      status: 'loading',
    } as chrome.tabs.Tab;
    mockTabs.push(newTab);
    if (callback) { callback(newTab); return undefined; }
    return Promise.resolve(newTab);
  }),

  update: jest.fn((tabId: number, props: chrome.tabs.UpdateProperties, callback?) => {
    const tab = mockTabs.find((t) => t.id === tabId);
    if (tab) {
      if (props.url !== undefined) tab.url = props.url;
      if (props.active !== undefined) tab.active = props.active;
      if (props.pinned !== undefined) tab.pinned = props.pinned;
    }
    if (callback) { callback(tab || null); return undefined; }
    return Promise.resolve(tab || null);
  }),

  remove: jest.fn((tabIds: number | number[], callback?) => {
    const ids = Array.isArray(tabIds) ? tabIds : [tabIds];
    mockTabs = mockTabs.filter((t) => !ids.includes(t.id!));
    if (callback) { callback(); return undefined; }
    return Promise.resolve();
  }),

  sendMessage: jest.fn((tabId: number, message: unknown, callback?) => {
    if (callback) { callback(undefined); return undefined; }
    return Promise.resolve(undefined);
  }),

  onUpdated: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
    hasListener: jest.fn(() => false),
  },

  onRemoved: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
    hasListener: jest.fn(() => false),
  },

  onActivated: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
    hasListener: jest.fn(() => false),
  },
};

// ============================================================
// RUNTIME API MOCK
// ============================================================

const EXTENSION_ID = 'focusmodeblocker-test-id-000000';

const mockRuntime = {
  id: EXTENSION_ID,
  lastError: undefined as { message: string } | undefined,

  sendMessage: jest.fn((message: unknown, callback?) => {
    // Dispatch to registered listeners
    let responseValue: unknown = undefined;
    messageListeners.forEach((listener) => {
      listener(
        message,
        { id: EXTENSION_ID } as chrome.runtime.MessageSender,
        (response: unknown) => { responseValue = response; }
      );
    });
    if (callback) { callback(responseValue); return undefined; }
    return Promise.resolve(responseValue);
  }),

  onMessage: {
    addListener: jest.fn((listener: MessageListener) => {
      messageListeners.push(listener);
    }),
    removeListener: jest.fn((listener: MessageListener) => {
      messageListeners = messageListeners.filter((l) => l !== listener);
    }),
    hasListener: jest.fn((listener: MessageListener) => {
      return messageListeners.includes(listener);
    }),
  },

  onInstalled: {
    addListener: jest.fn((listener: (details: { reason: string; previousVersion?: string }) => void) => {
      installedListeners.push(listener);
    }),
    removeListener: jest.fn(),
    hasListener: jest.fn(() => false),
  },

  getManifest: jest.fn(() => ({
    name: 'Focus Mode - Blocker',
    version: '1.0.0',
    manifest_version: 3,
    permissions: ['storage', 'alarms', 'declarativeNetRequest', 'declarativeNetRequestWithHostAccess', 'activeTab', 'scripting', 'notifications', 'offscreen'],
    optional_permissions: ['identity', 'idle', 'tabGroups'],
    host_permissions: ['<all_urls>'],
  })),

  getURL: jest.fn((path: string) => {
    return `chrome-extension://${EXTENSION_ID}/${path}`;
  }),

  connect: jest.fn(() => ({
    postMessage: jest.fn(),
    onMessage: { addListener: jest.fn(), removeListener: jest.fn() },
    onDisconnect: { addListener: jest.fn(), removeListener: jest.fn() },
    disconnect: jest.fn(),
    name: '',
  })),

  onConnect: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
    hasListener: jest.fn(() => false),
  },

  onStartup: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
    hasListener: jest.fn(() => false),
  },

  onSuspend: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
    hasListener: jest.fn(() => false),
  },
};

/**
 * Test helper: Simulate extension install or update.
 */
function triggerOnInstalled(reason: 'install' | 'update' | 'chrome_update', previousVersion?: string): void {
  installedListeners.forEach((listener) => {
    listener({ reason, previousVersion });
  });
}

// ============================================================
// NOTIFICATIONS API MOCK
// ============================================================

const mockNotifications = {
  create: jest.fn((notificationId: string, options: chrome.notifications.NotificationOptions, callback?) => {
    createdNotifications.set(notificationId, options);
    if (callback) { callback(notificationId); return undefined; }
    return Promise.resolve(notificationId);
  }),

  clear: jest.fn((notificationId: string, callback?) => {
    const existed = createdNotifications.has(notificationId);
    createdNotifications.delete(notificationId);
    if (callback) { callback(existed); return undefined; }
    return Promise.resolve(existed);
  }),

  getAll: jest.fn((callback?) => {
    const result: Record<string, boolean> = {};
    createdNotifications.forEach((_, id) => { result[id] = true; });
    if (callback) { callback(result); return undefined; }
    return Promise.resolve(result);
  }),

  onClicked: {
    addListener: jest.fn((listener: (notificationId: string) => void) => {
      notificationClickListeners.push(listener);
    }),
    removeListener: jest.fn(),
    hasListener: jest.fn(() => false),
  },

  onClosed: {
    addListener: jest.fn((listener: (notificationId: string, byUser: boolean) => void) => {
      notificationCloseListeners.push(listener);
    }),
    removeListener: jest.fn(),
    hasListener: jest.fn(() => false),
  },
};

/**
 * Test helper: Simulate user clicking a notification.
 */
function triggerNotificationClick(notificationId: string): void {
  notificationClickListeners.forEach((listener) => listener(notificationId));
}

// ============================================================
// SCRIPTING API MOCK
// ============================================================

const mockScripting = {
  executeScript: jest.fn((injection: { target: { tabId: number }; func?: Function; files?: string[] }, callback?) => {
    const result = [{ result: undefined, frameId: 0 }];
    if (callback) { callback(result); return undefined; }
    return Promise.resolve(result);
  }),

  insertCSS: jest.fn((injection: { target: { tabId: number }; css?: string; files?: string[] }, callback?) => {
    if (callback) { callback(); return undefined; }
    return Promise.resolve();
  }),

  removeCSS: jest.fn((injection: { target: { tabId: number }; css?: string; files?: string[] }, callback?) => {
    if (callback) { callback(); return undefined; }
    return Promise.resolve();
  }),
};

// ============================================================
// ACTION API MOCK (Badge, Icon)
// ============================================================

interface BadgeState {
  text: string;
  backgroundColor: string | [number, number, number, number];
  icon: string | { path: Record<string, string> };
  title: string;
  popup: string;
}

let badgeState: BadgeState = {
  text: '',
  backgroundColor: '#6C5CE7', // Focus Mode default purple
  icon: '',
  title: 'Focus Mode - Blocker',
  popup: 'src/popup/popup.html',
};

const mockAction = {
  setBadgeText: jest.fn((details: { text: string; tabId?: number }, callback?) => {
    badgeState.text = details.text;
    if (callback) { callback(); return undefined; }
    return Promise.resolve();
  }),

  getBadgeText: jest.fn((details: { tabId?: number }, callback?) => {
    if (callback) { callback(badgeState.text); return undefined; }
    return Promise.resolve(badgeState.text);
  }),

  setBadgeBackgroundColor: jest.fn((details: { color: string | [number, number, number, number]; tabId?: number }, callback?) => {
    badgeState.backgroundColor = details.color;
    if (callback) { callback(); return undefined; }
    return Promise.resolve();
  }),

  getBadgeBackgroundColor: jest.fn((details: { tabId?: number }, callback?) => {
    if (callback) { callback(badgeState.backgroundColor); return undefined; }
    return Promise.resolve(badgeState.backgroundColor);
  }),

  setIcon: jest.fn((details: { path?: string | Record<string, string>; tabId?: number }, callback?) => {
    if (details.path) badgeState.icon = details.path;
    if (callback) { callback(); return undefined; }
    return Promise.resolve();
  }),

  setTitle: jest.fn((details: { title: string; tabId?: number }, callback?) => {
    badgeState.title = details.title;
    if (callback) { callback(); return undefined; }
    return Promise.resolve();
  }),

  setPopup: jest.fn((details: { popup: string; tabId?: number }, callback?) => {
    badgeState.popup = details.popup;
    if (callback) { callback(); return undefined; }
    return Promise.resolve();
  }),

  onClicked: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
    hasListener: jest.fn(() => false),
  },
};

// ============================================================
// OFFSCREEN API MOCK
// ============================================================

let offscreenDocumentCreated = false;

const mockOffscreen = {
  createDocument: jest.fn((parameters: { url: string; reasons: string[]; justification: string }, callback?) => {
    offscreenDocumentCreated = true;
    if (callback) { callback(); return undefined; }
    return Promise.resolve();
  }),

  closeDocument: jest.fn((callback?) => {
    offscreenDocumentCreated = false;
    if (callback) { callback(); return undefined; }
    return Promise.resolve();
  }),

  hasDocument: jest.fn((callback?) => {
    if (callback) { callback(offscreenDocumentCreated); return undefined; }
    return Promise.resolve(offscreenDocumentCreated);
  }),

  Reason: {
    AUDIO_PLAYBACK: 'AUDIO_PLAYBACK',
    TESTING: 'TESTING',
  },
};

// ============================================================
// IDENTITY API MOCK (Optional Permission)
// ============================================================

const mockIdentity = {
  getAuthToken: jest.fn((details: { interactive?: boolean }, callback?) => {
    const token = 'mock-auth-token-focus-mode';
    if (callback) { callback(token); return undefined; }
    return Promise.resolve(token);
  }),

  removeCachedAuthToken: jest.fn((details: { token: string }, callback?) => {
    if (callback) { callback(); return undefined; }
    return Promise.resolve();
  }),
};

// ============================================================
// PERMISSIONS API MOCK
// ============================================================

let grantedOptionalPermissions: string[] = [];

const mockPermissions = {
  contains: jest.fn((permissions: { permissions?: string[]; origins?: string[] }, callback?) => {
    const hasAll = (permissions.permissions || []).every((p: string) =>
      ['storage', 'alarms', 'declarativeNetRequest', 'declarativeNetRequestWithHostAccess', 'activeTab', 'scripting', 'notifications', 'offscreen', ...grantedOptionalPermissions].includes(p)
    );
    if (callback) { callback(hasAll); return undefined; }
    return Promise.resolve(hasAll);
  }),

  request: jest.fn((permissions: { permissions?: string[] }, callback?) => {
    if (permissions.permissions) {
      grantedOptionalPermissions.push(...permissions.permissions);
    }
    if (callback) { callback(true); return undefined; }
    return Promise.resolve(true);
  }),

  remove: jest.fn((permissions: { permissions?: string[] }, callback?) => {
    if (permissions.permissions) {
      grantedOptionalPermissions = grantedOptionalPermissions.filter(
        (p) => !permissions.permissions!.includes(p)
      );
    }
    if (callback) { callback(true); return undefined; }
    return Promise.resolve(true);
  }),
};

// ============================================================
// SETUP & RESET
// ============================================================

/**
 * Installs all mock Chrome APIs on the global object.
 * Call once in beforeAll or test setup.
 */
export function setupAllMocks(): void {
  const chromeMock = {
    storage: mockStorage,
    declarativeNetRequest: mockDeclarativeNetRequest,
    alarms: mockAlarms,
    tabs: mockTabsApi,
    runtime: mockRuntime,
    notifications: mockNotifications,
    scripting: mockScripting,
    action: mockAction,
    offscreen: mockOffscreen,
    identity: mockIdentity,
    permissions: mockPermissions,
  };

  (globalThis as any).chrome = chromeMock;
}

/**
 * Resets all mock state to defaults without reinstalling.
 * Call in beforeEach to isolate tests.
 */
export function resetAllMocks(): void {
  // Clear listeners
  storageChangeListeners = [];
  alarmListeners = [];
  messageListeners = [];
  installedListeners = [];
  notificationClickListeners = [];
  notificationCloseListeners = [];

  // Reset storage to defaults
  mockStorageLocal._data = { ...DEFAULT_STORAGE_STATE.local };
  mockStorageSync._data = { ...DEFAULT_STORAGE_STATE.sync };
  mockStorageSession._data = { ...DEFAULT_STORAGE_STATE.session };

  // Reset DNR rules
  dynamicRules = [];
  sessionRules = [];

  // Reset alarms
  registeredAlarms = new Map();

  // Reset tabs
  mockTabs = [
    { id: 1, index: 0, windowId: 1, active: true, url: 'https://example.com', title: 'Example', pinned: false, highlighted: true, incognito: false, status: 'complete' } as chrome.tabs.Tab,
  ];
  nextTabId = 2;

  // Reset notifications
  createdNotifications = new Map();

  // Reset badge state
  badgeState = {
    text: '',
    backgroundColor: '#6C5CE7',
    icon: '',
    title: 'Focus Mode - Blocker',
    popup: 'src/popup/popup.html',
  };

  // Reset offscreen
  offscreenDocumentCreated = false;

  // Reset optional permissions
  grantedOptionalPermissions = [];

  // Reset runtime.lastError
  mockRuntime.lastError = undefined;

  // Clear all jest mock call history
  jest.clearAllMocks();
}

// ============================================================
// TEST HELPER EXPORTS
// ============================================================

export {
  triggerAlarm,
  triggerOnInstalled,
  triggerNotificationClick,
  // Direct access for advanced test scenarios
  mockStorage,
  mockDeclarativeNetRequest,
  mockAlarms,
  mockTabsApi,
  mockRuntime,
  mockNotifications,
  mockScripting,
  mockAction,
  mockOffscreen,
  mockIdentity,
  mockPermissions,
  // State inspection helpers
  registeredAlarms,
  dynamicRules,
  sessionRules,
  createdNotifications,
  badgeState,
};
```

---

## 3. Focus Mode Default Test Data

```ts
// tests/setup/test-data.ts

// ============================================================
// DEFAULT STORAGE STATE
// ============================================================

/**
 * The default storage state for a fresh Focus Mode installation.
 * Used by chrome-mock.ts to initialize storage in resetAllMocks().
 */
export const DEFAULT_STORAGE_STATE = {
  local: {
    // Blocklist (empty for free user, max 10 free sites)
    blocklist: [] as string[],
    blocklistRuleIds: {} as Record<string, number>,

    // Settings
    settings: {
      pomodoroFocusMinutes: 25,
      pomodoroBreakMinutes: 5,
      pomodoroLongBreakMinutes: 15,
      pomodoroSessionsBeforeLongBreak: 4,
      autoStartBreaks: false,
      autoStartFocus: false,
      showNotifications: true,
      playSound: true,
      soundVolume: 0.7,
      soundTrack: 'default',
      blockMethod: 'redirect', // redirect | close | custom
      showMotivation: true,
      theme: 'system', // light | dark | system
      nuclearModeEnabled: false,
      nuclearModeUntil: null as number | null,
    },

    // Sessions
    sessions: {
      currentSession: null as null | {
        type: 'focus' | 'break' | 'longBreak';
        startedAt: number;
        duration: number;
        pausedAt: number | null;
        pausedDuration: number;
      },
      completedToday: 0,
      totalCompleted: 0,
      todayFocusMinutes: 0,
      history: [] as Array<{
        date: string;
        focusSessions: number;
        focusMinutes: number;
        blockedCount: number;
      }>,
    },

    // Streaks
    streaks: {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null as string | null,
      milestones: [] as number[],
      // Milestone thresholds: 3, 7, 14, 21, 30, 60, 90, 180, 365
    },

    // Focus Score
    focusScore: {
      current: 0,
      history: [] as Array<{ date: string; score: number }>,
      factors: {
        sessionCompletion: 0,  // Weight: 35%
        blockedResistance: 0,  // Weight: 25%
        consistencyStreak: 0,  // Weight: 25%
        dailyGoalProgress: 0,  // Weight: 15%
      },
    },

    // Analytics events log
    analyticsEvents: [] as Array<{
      event: string;
      timestamp: number;
      data?: Record<string, unknown>;
    }>,

    // Blocked sites counter
    blockedCount: {
      today: 0,
      total: 0,
      bySite: {} as Record<string, number>,
    },

    // Onboarding
    onboarding: {
      completed: false,
      currentSlide: 0,
      installDate: null as number | null,
    },

    // License / Subscription
    license: {
      plan: 'free' as 'free' | 'pro_monthly' | 'pro_yearly' | 'lifetime' | 'team',
      status: 'active' as 'active' | 'expired' | 'trial' | 'cancelled',
      expiresAt: null as number | null,
      trialEndsAt: null as number | null,
      siteLimit: 10,
      cachedAt: null as number | null,
      offlineGraceUntil: null as number | null,
    },
  },

  sync: {
    // Cross-device synced settings (subset)
    syncedBlocklist: [] as string[],
    syncedSettings: {
      pomodoroFocusMinutes: 25,
      pomodoroBreakMinutes: 5,
      theme: 'system',
    },
  },

  session: {
    // Ephemeral session data (cleared on browser restart)
    memoryLicenseCache: null as null | {
      plan: string;
      status: string;
      cachedAt: number;
      ttl: 300000; // 5 minutes
    },
    activeTabBlockState: {} as Record<number, boolean>,
    pomodoroTimerState: null as null | {
      isRunning: boolean;
      remainingMs: number;
    },
  },
};

// ============================================================
// MOCK BLOCKED SITES
// ============================================================

/** Sample blocked sites for testing. */
export const MOCK_BLOCKED_SITES = {
  social: [
    'facebook.com',
    'instagram.com',
    'twitter.com',
    'tiktok.com',
    'reddit.com',
  ],
  news: [
    'cnn.com',
    'bbc.com',
    'news.ycombinator.com',
  ],
  entertainment: [
    'youtube.com',
    'netflix.com',
    'twitch.tv',
  ],
  all: [
    'facebook.com', 'instagram.com', 'twitter.com', 'tiktok.com', 'reddit.com',
    'cnn.com', 'bbc.com', 'news.ycombinator.com',
    'youtube.com', 'netflix.com', 'twitch.tv',
  ],
};

/** Sample list that exceeds the free tier limit of 10. */
export const MOCK_OVER_FREE_LIMIT_SITES = [
  'facebook.com', 'instagram.com', 'twitter.com', 'tiktok.com', 'reddit.com',
  'cnn.com', 'bbc.com', 'youtube.com', 'netflix.com', 'twitch.tv',
  'pinterest.com', // 11th site - triggers paywall
];

// ============================================================
// MOCK POMODORO SESSION DATA
// ============================================================

export const MOCK_POMODORO = {
  /** A focus session that is currently in progress. */
  activeSession: {
    type: 'focus' as const,
    startedAt: Date.now() - 10 * 60 * 1000, // Started 10 min ago
    duration: 25 * 60 * 1000, // 25 min
    pausedAt: null,
    pausedDuration: 0,
  },

  /** A paused focus session. */
  pausedSession: {
    type: 'focus' as const,
    startedAt: Date.now() - 15 * 60 * 1000,
    duration: 25 * 60 * 1000,
    pausedAt: Date.now() - 5 * 60 * 1000,
    pausedDuration: 120000, // 2 min already paused
  },

  /** A completed focus session. */
  completedSession: {
    type: 'focus' as const,
    startedAt: Date.now() - 30 * 60 * 1000,
    duration: 25 * 60 * 1000,
    pausedAt: null,
    pausedDuration: 0,
  },

  /** Break session. */
  breakSession: {
    type: 'break' as const,
    startedAt: Date.now() - 2 * 60 * 1000,
    duration: 5 * 60 * 1000,
    pausedAt: null,
    pausedDuration: 0,
  },

  /** Long break session. */
  longBreakSession: {
    type: 'longBreak' as const,
    startedAt: Date.now() - 5 * 60 * 1000,
    duration: 15 * 60 * 1000,
    pausedAt: null,
    pausedDuration: 0,
  },
};

// ============================================================
// MOCK FOCUS SCORE INPUTS
// ============================================================

export const MOCK_FOCUS_SCORE = {
  /** Score = 0: Brand new user with no activity. */
  zeroScore: {
    sessionCompletion: 0,
    blockedResistance: 0,
    consistencyStreak: 0,
    dailyGoalProgress: 0,
  },

  /** Score = 100: Perfect user. */
  perfectScore: {
    sessionCompletion: 100,   // All sessions completed (35%)
    blockedResistance: 100,   // Never bypassed blocks (25%)
    consistencyStreak: 100,   // Long streak maintained (25%)
    dailyGoalProgress: 100,   // Daily goal hit (15%)
  },

  /** Score ~72: Typical active user. */
  averageScore: {
    sessionCompletion: 80,    // 80% sessions completed
    blockedResistance: 70,    // Occasionally bypassed
    consistencyStreak: 60,    // Moderate streak
    dailyGoalProgress: 75,    // Usually hits goal
  },

  /** Score ~38: Struggling user. */
  lowScore: {
    sessionCompletion: 40,
    blockedResistance: 30,
    consistencyStreak: 20,
    dailyGoalProgress: 65,
  },

  /**
   * Calculate weighted Focus Score from factors.
   * Weights: sessionCompletion=35%, blockedResistance=25%,
   *          consistencyStreak=25%, dailyGoalProgress=15%
   */
  calculate(factors: {
    sessionCompletion: number;
    blockedResistance: number;
    consistencyStreak: number;
    dailyGoalProgress: number;
  }): number {
    return Math.round(
      factors.sessionCompletion * 0.35 +
      factors.blockedResistance * 0.25 +
      factors.consistencyStreak * 0.25 +
      factors.dailyGoalProgress * 0.15
    );
  },
};

// ============================================================
// MOCK LICENSE / SUBSCRIPTION DATA
// ============================================================

export const MOCK_LICENSE = {
  /** Free tier user. */
  freeUser: {
    plan: 'free' as const,
    status: 'active' as const,
    expiresAt: null,
    trialEndsAt: null,
    siteLimit: 10,
    cachedAt: Date.now(),
    offlineGraceUntil: null,
  },

  /** Active Pro monthly subscriber. */
  proMonthlyUser: {
    plan: 'pro_monthly' as const,
    status: 'active' as const,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    trialEndsAt: null,
    siteLimit: Infinity,
    cachedAt: Date.now(),
    offlineGraceUntil: null,
  },

  /** Active Pro yearly subscriber. */
  proYearlyUser: {
    plan: 'pro_yearly' as const,
    status: 'active' as const,
    expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
    trialEndsAt: null,
    siteLimit: Infinity,
    cachedAt: Date.now(),
    offlineGraceUntil: null,
  },

  /** Lifetime purchase. */
  lifetimeUser: {
    plan: 'lifetime' as const,
    status: 'active' as const,
    expiresAt: null, // Never expires
    trialEndsAt: null,
    siteLimit: Infinity,
    cachedAt: Date.now(),
    offlineGraceUntil: null,
  },

  /** Expired trial user. */
  expiredTrialUser: {
    plan: 'free' as const,
    status: 'expired' as const,
    expiresAt: null,
    trialEndsAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // Expired 7 days ago
    siteLimit: 10,
    cachedAt: Date.now(),
    offlineGraceUntil: null,
  },

  /** Pro user with expired subscription. */
  expiredProUser: {
    plan: 'pro_monthly' as const,
    status: 'expired' as const,
    expiresAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // Expired 3 days ago
    trialEndsAt: null,
    siteLimit: 10, // Reverted to free limit
    cachedAt: Date.now(),
    offlineGraceUntil: null,
  },

  /** Pro user in offline grace period (7 days). */
  offlineGraceUser: {
    plan: 'pro_monthly' as const,
    status: 'active' as const,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    trialEndsAt: null,
    siteLimit: Infinity,
    cachedAt: Date.now() - 48 * 60 * 60 * 1000, // Cached 48 hours ago
    offlineGraceUntil: Date.now() + 5 * 24 * 60 * 60 * 1000, // 5 days remaining
  },

  /** Team plan user. */
  teamUser: {
    plan: 'team' as const,
    status: 'active' as const,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    trialEndsAt: null,
    siteLimit: Infinity,
    cachedAt: Date.now(),
    offlineGraceUntil: null,
  },
};

// ============================================================
// MOCK STREAK DATA
// ============================================================

export const MOCK_STREAKS = {
  /** Brand new user, no streak. */
  noStreak: {
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    milestones: [],
  },

  /** User on day 3 (first milestone). */
  threeDay: {
    currentStreak: 3,
    longestStreak: 3,
    lastActiveDate: new Date().toISOString().split('T')[0],
    milestones: [3],
  },

  /** User on day 7 (one-week milestone). */
  sevenDay: {
    currentStreak: 7,
    longestStreak: 7,
    lastActiveDate: new Date().toISOString().split('T')[0],
    milestones: [3, 7],
  },

  /** User on day 30 (one-month milestone). */
  thirtyDay: {
    currentStreak: 30,
    longestStreak: 30,
    lastActiveDate: new Date().toISOString().split('T')[0],
    milestones: [3, 7, 14, 21, 30],
  },

  /** User with a broken streak (last active 2 days ago). */
  brokenStreak: {
    currentStreak: 14,
    longestStreak: 14,
    lastActiveDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    milestones: [3, 7, 14],
  },

  /** Long-term user at 365-day milestone. */
  yearStreak: {
    currentStreak: 365,
    longestStreak: 365,
    lastActiveDate: new Date().toISOString().split('T')[0],
    milestones: [3, 7, 14, 21, 30, 60, 90, 180, 365],
  },
};

// ============================================================
// MOCK DNR RULES
// ============================================================

/**
 * Generates a declarativeNetRequest blocking rule for a given domain.
 * Mirrors the rule format used by Focus Mode's service worker.
 */
export function createBlockRule(domain: string, ruleId: number): {
  id: number;
  priority: number;
  action: { type: string; redirect: { url: string } };
  condition: { requestDomains: string[]; resourceTypes: string[] };
} {
  return {
    id: ruleId,
    priority: 1,
    action: {
      type: 'redirect',
      redirect: {
        url: `chrome-extension://focusmodeblocker-test-id-000000/src/content/block-page.html?blocked=${encodeURIComponent(domain)}`,
      },
    },
    condition: {
      requestDomains: [domain],
      resourceTypes: ['main_frame'],
    },
  };
}

/**
 * Generates a full set of DNR rules from a blocklist.
 * Rule IDs start at 1 and increment.
 */
export function createBlockRulesFromList(domains: string[]): ReturnType<typeof createBlockRule>[] {
  return domains.map((domain, index) => createBlockRule(domain, index + 1));
}

// ============================================================
// MOCK PAYWALL TRIGGER DATA
// ============================================================

/**
 * Paywall trigger scenarios (T1-T10).
 * Each trigger has a condition and the expected paywall behavior.
 */
export const MOCK_PAYWALL_TRIGGERS = {
  T1_SITE_LIMIT: {
    id: 'T1',
    name: 'Site limit exceeded',
    condition: { currentSites: 10, attemptedAdd: 'pinterest.com', plan: 'free' },
    expectedAction: 'show_upgrade_modal',
  },
  T2_NUCLEAR_MODE: {
    id: 'T2',
    name: 'Nuclear Mode access',
    condition: { feature: 'nuclear_mode', plan: 'free' },
    expectedAction: 'show_upgrade_modal',
  },
  T3_CUSTOM_BLOCK_PAGE: {
    id: 'T3',
    name: 'Custom block page',
    condition: { feature: 'custom_block_page', plan: 'free' },
    expectedAction: 'show_upgrade_modal',
  },
  T4_ANALYTICS_EXPORT: {
    id: 'T4',
    name: 'Analytics export',
    condition: { feature: 'analytics_export', plan: 'free' },
    expectedAction: 'show_upgrade_modal',
  },
  T5_FOCUS_SOUNDS: {
    id: 'T5',
    name: 'Focus sounds library',
    condition: { feature: 'focus_sounds', plan: 'free' },
    expectedAction: 'show_upgrade_modal',
  },
  T6_SCHEDULE_BLOCKING: {
    id: 'T6',
    name: 'Schedule-based blocking',
    condition: { feature: 'schedule_blocking', plan: 'free' },
    expectedAction: 'show_upgrade_modal',
  },
  T7_CATEGORIES: {
    id: 'T7',
    name: 'Site categories',
    condition: { feature: 'categories', plan: 'free' },
    expectedAction: 'show_upgrade_modal',
  },
  T8_TEAM_FEATURES: {
    id: 'T8',
    name: 'Team features',
    condition: { feature: 'team', plan: 'free' },
    expectedAction: 'show_upgrade_modal',
  },
  T9_SYNC_DEVICES: {
    id: 'T9',
    name: 'Cross-device sync',
    condition: { feature: 'sync', plan: 'free' },
    expectedAction: 'show_upgrade_modal',
  },
  T10_ADVANCED_STATS: {
    id: 'T10',
    name: 'Advanced statistics',
    condition: { feature: 'advanced_stats', plan: 'free' },
    expectedAction: 'show_upgrade_modal',
  },
};

// ============================================================
// MOCK NOTIFICATION DATA
// ============================================================

export const MOCK_NOTIFICATIONS = {
  sessionComplete: {
    type: 'basic' as const,
    iconUrl: 'src/assets/icons/icon-128.png',
    title: 'Focus Session Complete!',
    message: 'Great work! You completed a 25-minute focus session. Time for a break.',
    priority: 2,
  },
  breakOver: {
    type: 'basic' as const,
    iconUrl: 'src/assets/icons/icon-128.png',
    title: 'Break is Over',
    message: 'Ready to focus again? Start your next session.',
    priority: 2,
  },
  streakMilestone: (days: number) => ({
    type: 'basic' as const,
    iconUrl: 'src/assets/icons/icon-128.png',
    title: `${days}-Day Streak!`,
    message: `You've maintained your focus streak for ${days} days. Keep it up!`,
    priority: 2,
  }),
  nuclearModeActive: (until: string) => ({
    type: 'basic' as const,
    iconUrl: 'src/assets/icons/icon-128.png',
    title: 'Nuclear Mode Activated',
    message: `All blocked sites are locked until ${until}. Stay focused!`,
    priority: 2,
  }),
};

// ============================================================
// TEST FACTORY HELPERS
// ============================================================

/**
 * Creates a storage state with custom overrides merged into defaults.
 * Usage: createStorageState({ local: { blocklist: ['facebook.com'] } })
 */
export function createStorageState(
  overrides: {
    local?: Partial<typeof DEFAULT_STORAGE_STATE.local>;
    sync?: Partial<typeof DEFAULT_STORAGE_STATE.sync>;
    session?: Partial<typeof DEFAULT_STORAGE_STATE.session>;
  } = {}
): typeof DEFAULT_STORAGE_STATE {
  return {
    local: { ...DEFAULT_STORAGE_STATE.local, ...overrides.local },
    sync: { ...DEFAULT_STORAGE_STATE.sync, ...overrides.sync },
    session: { ...DEFAULT_STORAGE_STATE.session, ...overrides.session },
  };
}

/**
 * Populates mock storage with a given state. Call from test setup.
 */
export async function populateStorage(state: Partial<typeof DEFAULT_STORAGE_STATE>): Promise<void> {
  if (state.local) {
    await chrome.storage.local.set(state.local);
  }
  if (state.sync) {
    await chrome.storage.sync.set(state.sync);
  }
  if (state.session) {
    await chrome.storage.session.set(state.session);
  }
}

/**
 * Creates a pro user storage state with blocklist pre-loaded.
 */
export function createProUserState(blocklist: string[] = MOCK_BLOCKED_SITES.all) {
  return createStorageState({
    local: {
      blocklist,
      license: MOCK_LICENSE.proMonthlyUser,
      onboarding: { completed: true, currentSlide: 5, installDate: Date.now() - 30 * 24 * 60 * 60 * 1000 },
    },
  });
}

/**
 * Creates a free user at their site limit (10 sites).
 */
export function createFreeLimitState() {
  const tenSites = MOCK_BLOCKED_SITES.all.slice(0, 10);
  return createStorageState({
    local: {
      blocklist: tenSites,
      license: MOCK_LICENSE.freeUser,
      onboarding: { completed: true, currentSlide: 5, installDate: Date.now() - 7 * 24 * 60 * 60 * 1000 },
    },
  });
}
```

---

## Appendix: Quick Reference

### Badge Color States

| State | Color | Hex | When |
|-------|-------|-----|------|
| Default (idle) | Purple | `#6C5CE7` | Extension installed, no active session |
| Active session | Green | `#00B894` | Pomodoro focus session running |
| Break time | Blue | `#0984E3` | Break session running |
| Disabled/Paused | Gray | `#636E72` | Extension paused or Nuclear Mode off |
| Blocked count | Red | `#D63031` | Showing blocked site count badge |

### Alarm Names

| Alarm Name | Purpose | Period |
|------------|---------|--------|
| `focus-timer` | Active Pomodoro focus countdown | One-shot |
| `break-timer` | Break countdown | One-shot |
| `daily-streak-check` | Check and update streak at midnight | 24 hours |
| `license-refresh` | Refresh license cache from API | 24 hours |
| `notification-schedule` | Scheduled reminder notifications | Varies |

### Message Types (popup <-> background <-> content)

| Message | Direction | Payload |
|---------|-----------|---------|
| `START_SESSION` | popup -> background | `{ type: 'focus'\|'break', duration: number }` |
| `PAUSE_SESSION` | popup -> background | `{}` |
| `RESUME_SESSION` | popup -> background | `{}` |
| `STOP_SESSION` | popup -> background | `{}` |
| `GET_STATUS` | popup -> background | `{}` |
| `STATUS_UPDATE` | background -> popup | `{ session, score, streak, blockedCount }` |
| `ADD_SITE` | popup -> background | `{ domain: string }` |
| `REMOVE_SITE` | popup -> background | `{ domain: string }` |
| `CHECK_BLOCKED` | content -> background | `{ url: string }` |
| `SITE_BLOCKED` | background -> content | `{ blocked: boolean, domain: string }` |
| `NUCLEAR_ACTIVATE` | popup -> background | `{ until: number }` |
| `NUCLEAR_STATUS` | popup -> background | `{}` |
| `LICENSE_CHECK` | popup -> background | `{}` |
| `LICENSE_STATUS` | background -> popup | `{ plan, status, siteLimit }` |

### License Cache Hierarchy

```
Level 1: Memory cache    (session storage)   TTL: 5 minutes
Level 2: Storage cache   (local storage)     TTL: 24 hours
Level 3: API call        (network request)   Real-time
Level 4: Stale cache     (local storage)     Fallback if API fails
Level 5: Offline grace   (local storage)     7-day grace period
```

---

*Document: Agent 1 - Mock Chrome APIs & Test Architecture*
*Extension: Focus Mode - Blocker v1.0.0*
*Phase: 10 - Automated Testing Suite (Sections 1-2)*
