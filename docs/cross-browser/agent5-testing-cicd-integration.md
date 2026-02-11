# Phase 16, Agent 5: Cross-Browser Testing, CI/CD & Integration

> **Focus Mode - Blocker v1.0.0** | Cross-Browser Porting Series
> **Agent:** 5 of 5 | **Phase:** 16 — Cross-Browser Porter
> **Scope:** Testing matrix, automated testing setup, browser-specific bug database, CI/CD pipeline, porting checklist, monitoring & analytics

---

## Table of Contents

- [1. Cross-Browser Testing Matrix](#1-cross-browser-testing-matrix)
  - [1.1 Site Blocking](#11-site-blocking)
  - [1.2 Block Page](#12-block-page)
  - [1.3 Popup (6 States)](#13-popup-6-states)
  - [1.4 Pomodoro Timer](#14-pomodoro-timer)
  - [1.5 Nuclear Mode](#15-nuclear-mode)
  - [1.6 Focus Score](#16-focus-score)
  - [1.7 Streaks](#17-streaks)
  - [1.8 Settings / Options Page](#18-settings--options-page)
  - [1.9 Onboarding](#19-onboarding)
  - [1.10 Paywall](#110-paywall)
  - [1.11 Context Menu](#111-context-menu)
  - [1.12 Notifications](#112-notifications)
  - [1.13 i18n](#113-i18n)
- [2. Automated Testing Setup](#2-automated-testing-setup)
  - [2.1 Jest Cross-Browser Unit Configuration](#21-jest-cross-browser-unit-configuration)
  - [2.2 Playwright Multi-Browser E2E Configuration](#22-playwright-multi-browser-e2e-configuration)
  - [2.3 Shared Test Fixtures](#23-shared-test-fixtures)
  - [2.4 Visual Regression Testing](#24-visual-regression-testing)
- [3. Browser-Specific Bug Database](#3-browser-specific-bug-database)
  - [3.1 Chrome](#31-chrome)
  - [3.2 Firefox](#32-firefox)
  - [3.3 Safari](#33-safari)
  - [3.4 Edge](#34-edge)
  - [3.5 Brave](#35-brave)
  - [3.6 Opera](#36-opera)
- [4. CI/CD Pipeline for Multi-Browser Releases](#4-cicd-pipeline-for-multi-browser-releases)
  - [4.1 GitHub Actions Workflow](#41-github-actions-workflow)
  - [4.2 Store Submission Automation](#42-store-submission-automation)
  - [4.3 Version Management](#43-version-management)
  - [4.4 Release Branch Strategy](#44-release-branch-strategy)
- [5. Integration Summary & Porting Checklist](#5-integration-summary--porting-checklist)
  - [5.1 Phase-by-Phase Porting Checklist](#51-phase-by-phase-porting-checklist)
  - [5.2 Effort Estimates](#52-effort-estimates)
  - [5.3 Risk Assessment](#53-risk-assessment)
  - [5.4 Success Metrics](#54-success-metrics)
- [6. Cross-Browser Monitoring & Analytics](#6-cross-browser-monitoring--analytics)
  - [6.1 Browser-Specific Error Tracking](#61-browser-specific-error-tracking)
  - [6.2 Feature Usage Analytics per Browser](#62-feature-usage-analytics-per-browser)
  - [6.3 Performance Benchmarks per Browser](#63-performance-benchmarks-per-browser)
  - [6.4 User Feedback Collection per Platform](#64-user-feedback-collection-per-platform)

---

## 1. Cross-Browser Testing Matrix

Every test item below must be executed on each target browser: **Chrome**, **Firefox**, **Safari**, **Edge**, **Brave**, and **Opera**. Mark each cell as PASS, FAIL, BLOCKED (API unavailable), or N/A. The `Blocking API` column indicates the underlying mechanism per browser.

| Browser | Blocking API            | Manifest | API Namespace | Background Context  |
|---------|-------------------------|----------|---------------|---------------------|
| Chrome  | declarativeNetRequest   | MV3      | `chrome.*`    | Service Worker      |
| Firefox | webRequest (MV2) / DNR (MV3 partial) | MV2/MV3 | `browser.*` | Background Script / Event Page |
| Safari  | declarativeNetRequest   | MV3      | `browser.*`   | Non-persistent Background Page |
| Edge    | declarativeNetRequest   | MV3      | `chrome.*`    | Service Worker      |
| Brave   | declarativeNetRequest   | MV3      | `chrome.*`    | Service Worker      |
| Opera   | declarativeNetRequest   | MV3      | `chrome.*`    | Service Worker      |

---

### 1.1 Site Blocking

| # | Test Case | Chrome | Firefox | Safari | Edge | Brave | Opera |
|---|-----------|--------|---------|--------|------|-------|-------|
| B-01 | Adding a domain to the blocklist creates a DNR dynamic rule (or webRequest listener for Firefox MV2) | | | | | | |
| B-02 | Navigating to a blocked domain redirects to `block.html` with the correct `?url=` and `?domain=` query params | | | | | | |
| B-03 | Removing a domain from the blocklist removes the corresponding DNR rule and allows navigation | | | | | | |
| B-04 | Wildcard pattern `*.example.com` blocks all subdomains (`foo.example.com`, `bar.example.com`) | | | | | | |
| B-05 | Path-based rule `reddit.com/r/funny` blocks that path but allows `reddit.com/r/productivity` (Pro) | | | | | | |
| B-06 | Category blocklist toggle (e.g., "Social Media") enables/disables the corresponding static ruleset | | | | | | |
| B-07 | Allowlist entry overrides a category blocklist entry (higher priority rule) | | | | | | |
| B-08 | Blocking works on HTTPS, HTTP, and `www.` variants of the same domain | | | | | | |
| B-09 | Free tier enforced: adding site #11 triggers the paywall, does NOT create a rule | | | | | | |
| B-10 | Nuclear Mode installs block-all rule (priority 100) plus whitelist exceptions | | | | | | |
| B-11 | Rules persist across browser restart (dynamic rules survive) | | | | | | |
| B-12 | Rules persist across service worker / background script termination | | | | | | |
| B-13 | Incognito / private browsing: rules apply if `incognito: spanning` is set | | | | | | |

---

### 1.2 Block Page

| # | Test Case | Chrome | Firefox | Safari | Edge | Brave | Opera |
|---|-----------|--------|---------|--------|------|-------|-------|
| BP-01 | Block page renders inside Shadow DOM (style isolation from host page) | | | | | | |
| BP-02 | Countdown timer displays time remaining in current Pomodoro session | | | | | | |
| BP-03 | Motivational quotes rotate every 30 seconds | | | | | | |
| BP-04 | "Go Back" button calls `history.back()` and navigates away from blocked page | | | | | | |
| BP-05 | Focus Score is displayed and matches the value from `chrome.storage.local` | | | | | | |
| BP-06 | Current streak count is shown | | | | | | |
| BP-07 | Block page correctly reads `?url=` query param and displays the blocked domain | | | | | | |
| BP-08 | Nuclear Mode block page variant shows "Nuclear Mode Active" badge with no bypass options | | | | | | |
| BP-09 | Block page adapts to dark/light system preference via `prefers-color-scheme` | | | | | | |
| BP-10 | Block page extension URL scheme is correct (`chrome-extension://`, `moz-extension://`, `safari-web-extension://`) | | | | | | |

---

### 1.3 Popup (6 States)

| # | Test Case | Chrome | Firefox | Safari | Edge | Brave | Opera |
|---|-----------|--------|---------|--------|------|-------|-------|
| PU-01 | **Idle state**: Shows "Start Focus Session" button, current Focus Score, streak count, quick-add site input | | | | | | |
| PU-02 | **Active session state**: Shows Pomodoro countdown, session progress ring, "Pause" button, blocked site count | | | | | | |
| PU-03 | **Paused state**: Shows paused indicator, "Resume" button, elapsed/remaining time | | | | | | |
| PU-04 | **Nuclear Mode state**: Shows Nuclear Mode badge (red), countdown, no pause/stop button, whitelist display | | | | | | |
| PU-05 | **Break time state**: Shows break countdown, "Skip Break" option, session count (e.g., "3/4 sessions") | | | | | | |
| PU-06 | **Session complete state**: Shows Focus Score delta, streak update, session summary, "Start New Session" | | | | | | |
| PU-07 | Popup dimensions render within 380x580px without overflow or scrollbar across all states | | | | | | |
| PU-08 | Popup state transitions are instant when background sends state change messages | | | | | | |
| PU-09 | Popup correctly reconnects after service worker restart (no stale state displayed) | | | | | | |

---

### 1.4 Pomodoro Timer

| # | Test Case | Chrome | Firefox | Safari | Edge | Brave | Opera |
|---|-----------|--------|---------|--------|------|-------|-------|
| PT-01 | Starting a 25-minute session creates a `chrome.alarms` alarm with correct `when` timestamp | | | | | | |
| PT-02 | Timer persists across service worker termination and restart (state from `chrome.storage.session`) | | | | | | |
| PT-03 | Alarm fires within 1-second accuracy of scheduled time | | | | | | |
| PT-04 | Session end triggers notification with session summary | | | | | | |
| PT-05 | Break timer (5 min short / 15 min long) starts automatically after session end | | | | | | |
| PT-06 | Pausing a session clears the alarm and stores elapsed time in storage | | | | | | |
| PT-07 | Resuming a paused session creates a new alarm for the remaining duration | | | | | | |
| PT-08 | Custom timer durations (Pro: 1-120 min) create alarms with correct offsets | | | | | | |
| PT-09 | Timer display in popup updates every second using popup-side `setInterval` synced to alarm `scheduledTime` | | | | | | |
| PT-10 | Four-session cycle completes and triggers long break notification | | | | | | |

---

### 1.5 Nuclear Mode

| # | Test Case | Chrome | Firefox | Safari | Edge | Brave | Opera |
|---|-----------|--------|---------|--------|------|-------|-------|
| NM-01 | Activating Nuclear Mode installs block-all DNR rule (priority 100) that cannot be removed via UI | | | | | | |
| NM-02 | Whitelist domains are installed as allow rules with priority 101 | | | | | | |
| NM-03 | Attempting to remove Nuclear Mode rules via `chrome.declarativeNetRequest.updateDynamicRules` is intercepted and blocked | | | | | | |
| NM-04 | Nuclear Mode countdown alarm persists across service worker restarts | | | | | | |
| NM-05 | Disabling/re-enabling the extension during Nuclear Mode: rules re-apply on re-enable | | | | | | |
| NM-06 | Session rules (tamper-resistance layer) duplicate the dynamic rules | | | | | | |
| NM-07 | Nuclear Mode state flag in `chrome.storage.local` cannot be cleared while timer is active | | | | | | |
| NM-08 | Popup shows no stop/pause controls during Nuclear Mode | | | | | | |

---

### 1.6 Focus Score

| # | Test Case | Chrome | Firefox | Safari | Edge | Brave | Opera |
|---|-----------|--------|---------|--------|------|-------|-------|
| FS-01 | Score calculated from 4 factors: session completion rate, distraction attempts, streak length, total focus time | | | | | | |
| FS-02 | Score persisted in `chrome.storage.local` under `focusScore` key | | | | | | |
| FS-03 | Score displayed in popup (idle state) and block page | | | | | | |
| FS-04 | Score updates at end of each Pomodoro session | | | | | | |
| FS-05 | Score range 0-100 with no overflow/underflow edge cases | | | | | | |
| FS-06 | Score history array (last 30 days) stored and retrievable for charts (Pro) | | | | | | |

---

### 1.7 Streaks

| # | Test Case | Chrome | Firefox | Safari | Edge | Brave | Opera |
|---|-----------|--------|---------|--------|------|-------|-------|
| SK-01 | Completing at least one Pomodoro session per day increments the streak counter | | | | | | |
| SK-02 | Missing a day resets the streak to 0 (checked via midnight alarm) | | | | | | |
| SK-03 | Streak count persisted in `chrome.storage.local` under `streak` key | | | | | | |
| SK-04 | Streak milestones (7, 14, 30, 60, 90, 365 days) trigger achievement notifications | | | | | | |
| SK-05 | Timezone handling: midnight detection uses `Intl.DateTimeFormat` resolved timezone | | | | | | |
| SK-06 | Streak data survives browser restart and extension update | | | | | | |

---

### 1.8 Settings / Options Page

| # | Test Case | Chrome | Firefox | Safari | Edge | Brave | Opera |
|---|-----------|--------|---------|--------|------|-------|-------|
| OPT-01 | **Section 1 — Blocklist Management**: Add, remove, reorder sites; category toggles | | | | | | |
| OPT-02 | **Section 2 — Timer Settings**: Duration, break length, auto-start, notification sound | | | | | | |
| OPT-03 | **Section 3 — Nuclear Mode Settings**: Default duration, default whitelist, confirmation prompt toggle | | | | | | |
| OPT-04 | **Section 4 — Focus Score**: Display toggle, history reset, scoring weight adjustments (Pro) | | | | | | |
| OPT-05 | **Section 5 — Notifications**: Enable/disable per notification type, sound toggle, quiet hours | | | | | | |
| OPT-06 | **Section 6 — Appearance**: Dark/light/system theme, popup accent color (Pro) | | | | | | |
| OPT-07 | **Section 7 — Data Management**: Export settings JSON, import settings JSON, reset to defaults | | | | | | |
| OPT-08 | **Section 8 — Account & Pro**: License status, upgrade button, manage subscription link | | | | | | |
| OPT-09 | All settings saved to `chrome.storage.local` on change and loaded on page open | | | | | | |
| OPT-10 | Import/export produces valid JSON with schema version for cross-browser compatibility | | | | | | |
| OPT-11 | Options page opens via `chrome.runtime.openOptionsPage()` from popup gear icon | | | | | | |

---

### 1.9 Onboarding

| # | Test Case | Chrome | Firefox | Safari | Edge | Brave | Opera |
|---|-----------|--------|---------|--------|------|-------|-------|
| OB-01 | Onboarding tab opens automatically on `chrome.runtime.onInstalled` with `reason: "install"` | | | | | | |
| OB-02 | **Slide 1 — Welcome**: Branding, value proposition, "Get Started" button | | | | | | |
| OB-03 | **Slide 2 — Add Sites**: Quick-add input for first 3 blocked sites | | | | | | |
| OB-04 | **Slide 3 — Timer Setup**: Choose default Pomodoro duration and break length | | | | | | |
| OB-05 | **Slide 4 — Notifications**: Permission prompt for notification permission | | | | | | |
| OB-06 | **Slide 5 — Ready**: Summary of setup, "Start First Session" CTA | | | | | | |
| OB-07 | Slide navigation (next/back/skip) works with keyboard and mouse | | | | | | |
| OB-08 | Settings from onboarding are persisted to storage before "Ready" slide | | | | | | |
| OB-09 | Skipping onboarding writes sensible defaults | | | | | | |

---

### 1.10 Paywall

| # | Test Case | Chrome | Firefox | Safari | Edge | Brave | Opera |
|---|-----------|--------|---------|--------|------|-------|-------|
| PW-01 | **T1 — 11th blocked site**: Adding site beyond free limit shows paywall | | | | | | |
| PW-02 | **T2 — Custom timer duration**: Attempting to set duration outside 25/50 min presets | | | | | | |
| PW-03 | **T3 — Wildcard patterns**: Entering `*.domain.com` pattern | | | | | | |
| PW-04 | **T4 — Focus Score history**: Tapping "View History" on score chart | | | | | | |
| PW-05 | **T5 — Custom themes**: Selecting non-default accent color | | | | | | |
| PW-06 | **T6 — Export data**: Attempting export from data management section | | | | | | |
| PW-07 | **T7 — Schedule-based blocking**: Creating a time-based blocking schedule | | | | | | |
| PW-08 | **T8 — Path-based rules**: Entering `domain.com/specific/path` | | | | | | |
| PW-09 | **T9 — Statistics dashboard**: Navigating to detailed stats view | | | | | | |
| PW-10 | **T10 — Multiple profiles**: Attempting to create a second blocking profile | | | | | | |
| PW-11 | Paywall modal renders correctly, "Upgrade" button opens payment flow | | | | | | |
| PW-12 | After Pro activation, all 10 trigger points unlock without paywall | | | | | | |

---

### 1.11 Context Menu

| # | Test Case | Chrome | Firefox | Safari | Edge | Brave | Opera |
|---|-----------|--------|---------|--------|------|-------|-------|
| CM-01 | Right-clicking on any page shows "Block this site" context menu item | | | | | | |
| CM-02 | Clicking "Block this site" adds the current page domain to the blocklist | | | | | | |
| CM-03 | Context menu item text is localized to browser locale | | | | | | |
| CM-04 | Safari: context menu registered via `menus` API (not `contextMenus`) | | | | | | |

---

### 1.12 Notifications

| # | Test Case | Chrome | Firefox | Safari | Edge | Brave | Opera |
|---|-----------|--------|---------|--------|------|-------|-------|
| NF-01 | Session start notification: "Focus session started — 25 minutes" | | | | | | |
| NF-02 | Session end notification: "Session complete! Focus Score: +5" | | | | | | |
| NF-03 | Break start notification: "Time for a 5-minute break" | | | | | | |
| NF-04 | Streak milestone notification: "7-day streak! Keep it up!" | | | | | | |
| NF-05 | Nuclear Mode activation notification: "Nuclear Mode ON — 2 hours" | | | | | | |
| NF-06 | Nuclear Mode ending notification: "Nuclear Mode ending in 5 minutes" | | | | | | |
| NF-07 | Notification click opens popup or relevant page | | | | | | |
| NF-08 | Quiet hours setting suppresses notifications in configured time range | | | | | | |
| NF-09 | Safari: notifications use `browser.notifications` with reduced options (no buttons) | | | | | | |

---

### 1.13 i18n

| # | Test Case | Chrome | Firefox | Safari | Edge | Brave | Opera |
|---|-----------|--------|---------|--------|------|-------|-------|
| I18-01 | `chrome.i18n.getMessage()` / `browser.i18n.getMessage()` returns correct string for current locale | | | | | | |
| I18-02 | Popup UI strings display in the browser's configured locale | | | | | | |
| I18-03 | Block page motivational quotes display in locale language | | | | | | |
| I18-04 | Options page labels and descriptions are localized | | | | | | |
| I18-05 | RTL locales (Arabic, Hebrew) render popup and options page correctly | | | | | | |
| I18-06 | Fallback to `en` when a string key is missing in the target locale | | | | | | |
| I18-07 | `__MSG_extensionName__` in manifest resolves correctly per browser's locale loading | | | | | | |

---

## 2. Automated Testing Setup

### 2.1 Jest Cross-Browser Unit Configuration

The existing Jest setup (Phase 10, `jest.config.js`) targets Chrome APIs via `jest-chrome`. For cross-browser unit tests, we introduce a browser parameterization layer that runs each test suite against Chrome, Firefox, and Safari API mocks.

#### `jest.cross-browser.config.js`

```javascript
// jest.cross-browser.config.js
// Extends base config to run unit tests against multiple browser API mocks.

const baseConfig = require('./jest.config');

module.exports = {
  ...baseConfig,
  projects: [
    {
      ...baseConfig,
      displayName: 'chrome',
      globals: {
        BROWSER_TARGET: 'chrome',
      },
      setupFilesAfterSetup: [
        '<rootDir>/tests/setup/jest.setup.ts',
        '<rootDir>/tests/setup/chrome-api-mock.ts',
      ],
    },
    {
      ...baseConfig,
      displayName: 'firefox',
      globals: {
        BROWSER_TARGET: 'firefox',
      },
      setupFilesAfterSetup: [
        '<rootDir>/tests/setup/jest.setup.ts',
        '<rootDir>/tests/setup/firefox-api-mock.ts',
      ],
      transformIgnorePatterns: ['/node_modules/(?!webextension-polyfill)'],
    },
    {
      ...baseConfig,
      displayName: 'safari',
      globals: {
        BROWSER_TARGET: 'safari',
      },
      setupFilesAfterSetup: [
        '<rootDir>/tests/setup/jest.setup.ts',
        '<rootDir>/tests/setup/safari-api-mock.ts',
      ],
    },
  ],
};
```

#### Browser API Mocks: Chrome (`tests/setup/chrome-api-mock.ts`)

The existing `chrome-mock.ts` from Phase 10 already provides full Chrome API mocks. The Chrome setup file re-exports it without changes.

```typescript
// tests/setup/chrome-api-mock.ts
// Chrome is the baseline — uses jest-chrome directly.

import { chrome } from 'jest-chrome';

Object.assign(global, { chrome });
(global as any).BROWSER_TARGET = 'chrome';
(global as any).API_NAMESPACE = 'chrome';
```

#### Browser API Mocks: Firefox (`tests/setup/firefox-api-mock.ts`)

Firefox uses the `browser.*` namespace with promise-based APIs. We mock `webextension-polyfill` and provide Firefox-specific behavior differences.

```typescript
// tests/setup/firefox-api-mock.ts
// Provides browser.* namespace with promise-based returns.

import { chrome } from 'jest-chrome';

const promisify = (mockFn: jest.Mock) => {
  return jest.fn((...args: any[]) => {
    // If last arg is a callback (Chrome-style), call it and return promise
    const lastArg = args[args.length - 1];
    if (typeof lastArg === 'function') {
      const result = mockFn(...args);
      return Promise.resolve(result);
    }
    return new Promise((resolve) => {
      mockFn(...args, resolve);
    });
  });
};

const browserMock = {
  storage: {
    local: {
      get: promisify(chrome.storage.local.get),
      set: promisify(chrome.storage.local.set),
      remove: promisify(chrome.storage.local.remove),
    },
    // Firefox supports storage.sync but with different quota limits
    sync: {
      get: promisify(chrome.storage.sync.get),
      set: promisify(chrome.storage.sync.set),
    },
  },
  alarms: {
    create: jest.fn(),
    clear: jest.fn().mockResolvedValue(true),
    get: jest.fn().mockResolvedValue(null),
    getAll: jest.fn().mockResolvedValue([]),
    onAlarm: { addListener: jest.fn(), removeListener: jest.fn() },
  },
  runtime: {
    sendMessage: jest.fn().mockResolvedValue({}),
    onMessage: { addListener: jest.fn(), removeListener: jest.fn() },
    onInstalled: { addListener: jest.fn() },
    getURL: jest.fn((path: string) => `moz-extension://fake-firefox-id/${path}`),
    lastError: null,
    getManifest: jest.fn().mockReturnValue({ manifest_version: 2 }),
  },
  notifications: {
    create: jest.fn().mockResolvedValue('notif-id'),
    clear: jest.fn().mockResolvedValue(true),
  },
  // Firefox MV2 uses webRequest for blocking
  webRequest: {
    onBeforeRequest: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      hasListener: jest.fn().mockReturnValue(false),
    },
  },
  menus: {
    create: jest.fn(),
    onClicked: { addListener: jest.fn() },
  },
  tabs: {
    query: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue({}),
    create: jest.fn().mockResolvedValue({ id: 1 }),
    onUpdated: { addListener: jest.fn() },
  },
  i18n: {
    getMessage: jest.fn((key: string) => `[${key}]`),
    getUILanguage: jest.fn().mockReturnValue('en'),
  },
};

Object.assign(global, { browser: browserMock, chrome: browserMock });
(global as any).BROWSER_TARGET = 'firefox';
(global as any).API_NAMESPACE = 'browser';

// Mock webextension-polyfill
jest.mock('webextension-polyfill', () => browserMock);
```

#### Browser API Mocks: Safari (`tests/setup/safari-api-mock.ts`)

Safari uses `browser.*` namespace with MV3 but has specific limitations: no `storage.sync`, restricted notification support, and content script injection constraints.

```typescript
// tests/setup/safari-api-mock.ts
// Safari Web Extension: browser.* namespace, MV3, limited storage.sync.

import { chrome } from 'jest-chrome';

const safariMock = {
  storage: {
    local: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
    },
    // Safari does NOT support storage.sync — mock throws
    sync: {
      get: jest.fn().mockRejectedValue(
        new Error('storage.sync is not supported in Safari Web Extensions')
      ),
      set: jest.fn().mockRejectedValue(
        new Error('storage.sync is not supported in Safari Web Extensions')
      ),
    },
  },
  declarativeNetRequest: {
    updateDynamicRules: jest.fn().mockResolvedValue(undefined),
    getDynamicRules: jest.fn().mockResolvedValue([]),
    updateSessionRules: jest.fn().mockResolvedValue(undefined),
    getSessionRules: jest.fn().mockResolvedValue([]),
  },
  alarms: {
    create: jest.fn(),
    clear: jest.fn().mockResolvedValue(true),
    get: jest.fn().mockResolvedValue(null),
    onAlarm: { addListener: jest.fn(), removeListener: jest.fn() },
  },
  runtime: {
    sendMessage: jest.fn().mockResolvedValue({}),
    onMessage: { addListener: jest.fn(), removeListener: jest.fn() },
    onInstalled: { addListener: jest.fn() },
    getURL: jest.fn((path: string) => `safari-web-extension://fake-safari-id/${path}`),
    getManifest: jest.fn().mockReturnValue({ manifest_version: 3 }),
  },
  notifications: {
    // Safari notifications: no buttons, no images, title+message only
    create: jest.fn().mockResolvedValue('notif-id'),
    clear: jest.fn().mockResolvedValue(true),
  },
  tabs: {
    query: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue({}),
    create: jest.fn().mockResolvedValue({ id: 1 }),
  },
  i18n: {
    getMessage: jest.fn((key: string) => `[${key}]`),
    getUILanguage: jest.fn().mockReturnValue('en'),
  },
  // Safari uses menus, not contextMenus
  menus: {
    create: jest.fn(),
    onClicked: { addListener: jest.fn() },
  },
};

Object.assign(global, { browser: safariMock, chrome: safariMock });
(global as any).BROWSER_TARGET = 'safari';
(global as any).API_NAMESPACE = 'browser';
```

#### Cross-Browser Test Helper

Tests use a helper to abstract browser differences so each test can be written once.

```typescript
// tests/helpers/browser-api.ts
// Unified API accessor that routes to the correct namespace.

type BrowserTarget = 'chrome' | 'firefox' | 'safari' | 'edge';

export function getApi(): typeof chrome | typeof browser {
  const target = (global as any).BROWSER_TARGET as BrowserTarget;
  if (target === 'firefox' || target === 'safari') {
    return (global as any).browser;
  }
  return (global as any).chrome;
}

export function getStorageLocal() {
  return getApi().storage.local;
}

export function supportsStorageSync(): boolean {
  return (global as any).BROWSER_TARGET !== 'safari';
}

export function getBlockingMechanism(): 'dnr' | 'webRequest' {
  const target = (global as any).BROWSER_TARGET as BrowserTarget;
  if (target === 'firefox' && getApi().runtime.getManifest().manifest_version === 2) {
    return 'webRequest';
  }
  return 'dnr';
}

export function getExtensionUrlPrefix(): string {
  const target = (global as any).BROWSER_TARGET as BrowserTarget;
  const prefixes: Record<BrowserTarget, string> = {
    chrome: 'chrome-extension://',
    firefox: 'moz-extension://',
    safari: 'safari-web-extension://',
    edge: 'chrome-extension://', // Edge uses chrome-extension scheme
  };
  return prefixes[target];
}
```

---

### 2.2 Playwright Multi-Browser E2E Configuration

Playwright E2E tests load the actual packed extension in each browser. Each browser requires a different mechanism for loading unpacked extensions.

#### `playwright.cross-browser.config.ts`

```typescript
// playwright.cross-browser.config.ts
import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const DIST_CHROME = path.resolve(__dirname, 'dist/chrome');
const DIST_FIREFOX = path.resolve(__dirname, 'dist/firefox');
const DIST_EDGE = path.resolve(__dirname, 'dist/edge');

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Extensions require sequential loading
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // One browser at a time for extension tests
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
  ],
  timeout: 60_000,
  expect: { timeout: 10_000 },

  projects: [
    // ---- Chrome ----
    {
      name: 'chrome',
      use: {
        browserName: 'chromium',
        channel: 'chrome',
        launchOptions: {
          args: [
            `--disable-extensions-except=${DIST_CHROME}`,
            `--load-extension=${DIST_CHROME}`,
            '--no-first-run',
            '--disable-default-apps',
          ],
        },
      },
    },

    // ---- Edge ----
    {
      name: 'edge',
      use: {
        browserName: 'chromium',
        channel: 'msedge',
        launchOptions: {
          args: [
            `--disable-extensions-except=${DIST_EDGE}`,
            `--load-extension=${DIST_EDGE}`,
            '--no-first-run',
          ],
        },
      },
    },

    // ---- Firefox ----
    // Firefox extension loading requires web-ext and a custom profile.
    {
      name: 'firefox',
      use: {
        browserName: 'firefox',
        launchOptions: {
          firefoxUserPrefs: {
            'extensions.autoDisableScopes': 0,
            'xpinstall.signatures.required': false,
            'extensions.webextensions.uuids':
              '{"focus-mode-blocker@zovo.one":"fake-firefox-uuid"}',
          },
          args: ['-profile', path.resolve(__dirname, '.firefox-test-profile')],
        },
      },
    },
  ],
});
```

#### Extension ID Discovery per Browser

Each browser assigns a different extension ID. Tests need to discover the ID dynamically to construct popup, options, and block page URLs.

```typescript
// tests/e2e/helpers/extension-id.ts

import { BrowserContext, Page } from '@playwright/test';

/**
 * Discovers the extension ID for Chromium-based browsers (Chrome, Edge, Brave).
 * Opens chrome://extensions, finds Focus Mode - Blocker, extracts its ID.
 */
export async function getChromiumExtensionId(context: BrowserContext): Promise<string> {
  const page = await context.newPage();
  await page.goto('chrome://extensions');
  await page.waitForTimeout(1000);

  // Enable developer mode to see IDs
  const devToggle = page.locator('#devMode');
  if (devToggle) await devToggle.click();
  await page.waitForTimeout(500);

  // Alternative: use service worker URL from context
  let [background] = context.serviceWorkers();
  if (!background) {
    background = await context.waitForEvent('serviceworker');
  }
  const extensionId = background.url().split('/')[2];
  await page.close();
  return extensionId;
}

/**
 * Discovers the extension UUID for Firefox.
 * Firefox assigns a UUID rather than a stable ID.
 */
export async function getFirefoxExtensionUuid(page: Page): Promise<string> {
  await page.goto('about:debugging#/runtime/this-firefox');
  await page.waitForTimeout(2000);

  const uuidElement = page.locator('.qa-internal-uuid .qa-internal-uuid-value');
  const uuid = await uuidElement.textContent();
  return uuid?.trim() || '';
}

/**
 * Constructs the popup URL for the current browser target.
 */
export function getPopupUrl(extensionId: string, browser: string): string {
  switch (browser) {
    case 'firefox':
      return `moz-extension://${extensionId}/popup/popup.html`;
    case 'safari':
      return `safari-web-extension://${extensionId}/popup/popup.html`;
    default:
      return `chrome-extension://${extensionId}/popup/popup.html`;
  }
}

/**
 * Constructs the options page URL for the current browser target.
 */
export function getOptionsUrl(extensionId: string, browser: string): string {
  switch (browser) {
    case 'firefox':
      return `moz-extension://${extensionId}/options/options.html`;
    default:
      return `chrome-extension://${extensionId}/options/options.html`;
  }
}
```

#### E2E Test Example: Popup State Across Browsers

```typescript
// tests/e2e/cross-browser/popup-states.spec.ts

import { test, expect } from '@playwright/test';
import { getChromiumExtensionId, getPopupUrl } from '../helpers/extension-id';

test.describe('Popup states render correctly', () => {
  let extensionId: string;
  let popupUrl: string;

  test.beforeAll(async ({ context }) => {
    const browserName = test.info().project.name;
    if (browserName === 'firefox') {
      // Firefox extension loading handled via web-ext pre-test script
      extensionId = 'fake-firefox-uuid'; // Set by firefoxUserPrefs
    } else {
      extensionId = await getChromiumExtensionId(context);
    }
    popupUrl = getPopupUrl(extensionId, browserName);
  });

  test('idle state shows Start Focus Session button', async ({ page }) => {
    await page.goto(popupUrl);
    await expect(page.locator('#start-session-btn')).toBeVisible();
    await expect(page.locator('#focus-score-display')).toBeVisible();
    await expect(page.locator('#streak-count')).toBeVisible();
  });

  test('popup fits within 380x580 without scrollbar', async ({ page }) => {
    await page.goto(popupUrl);
    await page.setViewportSize({ width: 380, height: 580 });
    const hasScrollbar = await page.evaluate(() => {
      return document.documentElement.scrollHeight > document.documentElement.clientHeight;
    });
    expect(hasScrollbar).toBe(false);
  });
});
```

#### Firefox Extension Loading Script

Firefox requires `web-ext` to install the extension into a test profile before Playwright connects.

```bash
#!/usr/bin/env bash
# scripts/setup-firefox-test-profile.sh
# Creates a Firefox test profile with the extension pre-installed.

set -euo pipefail

DIST_DIR="dist/firefox"
PROFILE_DIR=".firefox-test-profile"

rm -rf "$PROFILE_DIR"
mkdir -p "$PROFILE_DIR"

# Install the extension into the profile using web-ext
npx web-ext run \
  --source-dir "$DIST_DIR" \
  --firefox-profile "$PROFILE_DIR" \
  --keep-profile-changes \
  --no-reload \
  --start-url "about:blank" &

WEB_EXT_PID=$!
sleep 5
kill $WEB_EXT_PID 2>/dev/null || true

echo "Firefox test profile created at: $PROFILE_DIR"
```

---

### 2.3 Shared Test Fixtures

Test data is centralized so Chrome, Firefox, Safari, and Edge tests all operate on identical state. This ensures feature parity validation.

```typescript
// tests/fixtures/focus-mode-data.ts
// Canonical test data shared across all browser targets.

export const FIXTURE_BLOCKLIST = {
  sites: [
    { domain: 'youtube.com', addedAt: 1707609600000, ruleId: 1 },
    { domain: 'reddit.com', addedAt: 1707609601000, ruleId: 2 },
    { domain: 'twitter.com', addedAt: 1707609602000, ruleId: 3 },
    { domain: 'facebook.com', addedAt: 1707609603000, ruleId: 4 },
    { domain: 'instagram.com', addedAt: 1707609604000, ruleId: 5 },
  ],
  categories: {
    socialMedia: { enabled: true, rulesetId: 'social_media_rules' },
    news: { enabled: false, rulesetId: 'news_rules' },
    entertainment: { enabled: false, rulesetId: 'entertainment_rules' },
  },
};

export const FIXTURE_SETTINGS = {
  pomodoro: {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsBeforeLongBreak: 4,
    autoStartBreak: true,
    autoStartWork: false,
  },
  nuclear: {
    defaultDuration: 120, // minutes
    defaultWhitelist: ['docs.google.com', 'github.com'],
    confirmationRequired: true,
  },
  notifications: {
    sessionStart: true,
    sessionEnd: true,
    breakReminder: true,
    streakMilestone: true,
    nuclearWarning: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
  },
  theme: 'system', // 'light' | 'dark' | 'system'
};

export const FIXTURE_FOCUS_SCORE = {
  current: 72,
  history: [
    { date: '2026-02-10', score: 72 },
    { date: '2026-02-09', score: 68 },
    { date: '2026-02-08', score: 75 },
    { date: '2026-02-07', score: 60 },
    { date: '2026-02-06', score: 80 },
  ],
  factors: {
    completionRate: 0.85,
    distractionAttempts: 12,
    streakLength: 5,
    totalFocusMinutes: 625,
  },
};

export const FIXTURE_STREAK = {
  current: 5,
  longest: 14,
  lastSessionDate: '2026-02-10',
  milestones: [7, 14, 30, 60, 90, 365],
  achievedMilestones: [],
};

export const FIXTURE_POMODORO_SESSION = {
  state: 'active', // 'idle' | 'active' | 'paused' | 'break' | 'complete'
  startTime: Date.now() - 10 * 60 * 1000, // 10 min ago
  duration: 25 * 60 * 1000, // 25 min
  elapsed: 10 * 60 * 1000,
  sessionNumber: 2, // of 4
  alarmName: 'pomodoro-session-end',
};

export const FIXTURE_NUCLEAR_MODE = {
  active: true,
  startTime: Date.now() - 30 * 60 * 1000,
  endTime: Date.now() + 90 * 60 * 1000,
  whitelist: ['docs.google.com', 'github.com'],
  alarmName: 'nuclear-mode-end',
};

/**
 * Injects fixture data into storage for any browser target.
 * Handles chrome.storage vs browser.storage differences via polyfill.
 */
export async function seedStorage(api: any, fixture: 'default' | 'nuclear' | 'empty' = 'default') {
  const data: Record<string, any> = {};

  if (fixture === 'empty') {
    await api.storage.local.set({});
    return;
  }

  data.blocklist = FIXTURE_BLOCKLIST;
  data.settings = FIXTURE_SETTINGS;
  data.focusScore = FIXTURE_FOCUS_SCORE;
  data.streak = FIXTURE_STREAK;

  if (fixture === 'nuclear') {
    data.nuclearMode = FIXTURE_NUCLEAR_MODE;
    data.pomodoroSession = { ...FIXTURE_POMODORO_SESSION, state: 'active' };
  } else {
    data.nuclearMode = { active: false };
    data.pomodoroSession = { state: 'idle' };
  }

  await api.storage.local.set(data);
}
```

---

### 2.4 Visual Regression Testing

Screenshot comparisons catch cross-browser rendering differences in popup, block page, and options page.

#### Configuration with Playwright + `@playwright/test` snapshots

```typescript
// tests/e2e/visual/popup-visual.spec.ts

import { test, expect } from '@playwright/test';
import { getChromiumExtensionId, getPopupUrl } from '../helpers/extension-id';

const VISUAL_STATES = [
  { name: 'idle', setup: async () => {} },
  { name: 'active-session', setup: async () => { /* seed active session */ } },
  { name: 'nuclear-mode', setup: async () => { /* seed nuclear data */ } },
  { name: 'break-time', setup: async () => { /* seed break state */ } },
];

for (const state of VISUAL_STATES) {
  test(`popup ${state.name} visual regression`, async ({ page, context }) => {
    const browserName = test.info().project.name;
    const extensionId = await getChromiumExtensionId(context);
    const popupUrl = getPopupUrl(extensionId, browserName);

    await state.setup();
    await page.goto(popupUrl);
    await page.waitForLoadState('networkidle');

    // Screenshot name includes browser for separate baseline per browser
    await expect(page).toHaveScreenshot(
      `popup-${state.name}-${browserName}.png`,
      {
        maxDiffPixelRatio: 0.02, // Allow 2% pixel difference for font rendering
        animations: 'disabled',
      }
    );
  });
}

test('block page visual regression', async ({ page, context }) => {
  const browserName = test.info().project.name;
  const extensionId = await getChromiumExtensionId(context);
  const blockPageUrl = `chrome-extension://${extensionId}/content/block-page.html?url=https://youtube.com&domain=youtube.com`;

  await page.goto(blockPageUrl);
  await page.waitForLoadState('networkidle');

  await expect(page).toHaveScreenshot(
    `block-page-${browserName}.png`,
    { maxDiffPixelRatio: 0.02 }
  );
});

test('options page visual regression', async ({ page, context }) => {
  const browserName = test.info().project.name;
  const extensionId = await getChromiumExtensionId(context);
  const optionsUrl = `chrome-extension://${extensionId}/options/options.html`;

  await page.goto(optionsUrl);
  await page.waitForLoadState('networkidle');

  await expect(page).toHaveScreenshot(
    `options-page-${browserName}.png`,
    { maxDiffPixelRatio: 0.03 } // Options page has more OS-native elements
  );
});
```

#### Update Baselines Command

```bash
# Generate/update visual regression baselines for all browsers
npx playwright test tests/e2e/visual/ --update-snapshots

# Update baselines for a specific browser only
npx playwright test tests/e2e/visual/ --project=chrome --update-snapshots
npx playwright test tests/e2e/visual/ --project=firefox --update-snapshots
npx playwright test tests/e2e/visual/ --project=edge --update-snapshots
```

---

## 3. Browser-Specific Bug Database

This section catalogs known issues per browser that affect Focus Mode - Blocker features, along with concrete workarounds implemented in the codebase.

### 3.1 Chrome

| ID | Issue | Affected Feature | Severity | Workaround |
|----|-------|-----------------|----------|------------|
| CHR-01 | Service worker terminates after ~30s of inactivity | Pomodoro timer display, Nuclear Mode countdown | High | Store timer state in `chrome.storage.session`. Popup maintains its own display `setInterval` synced to `chrome.alarms.scheduledTime`. Service worker reconstructs state from storage on wake. |
| CHR-02 | Service worker max lifetime of ~5 minutes | Long-running operations | Medium | Chunk all operations. Never hold critical state in memory. All state persisted to storage after every mutation. |
| CHR-03 | `chrome.alarms` minimum interval is 1 minute | Sub-minute timer granularity | Medium | Use alarms only for session-level events (start/end). Popup runs its own `setInterval` for second-by-second display, using `alarm.scheduledTime` as the source of truth. |
| CHR-04 | Dynamic DNR rule limit: 30,000 rules | Users with very large custom blocklists | Low | Rule ID allocation strategy with monitoring. Warn user at 25,000 rules. Category lists use static rulesets (separate 5,000 limit per ruleset). |
| CHR-05 | Static ruleset limit: 50 rulesets, 5,000 rules each | Pre-built category blocklists | Low | Combine similar categories. Focus Mode ships with 5 category rulesets (well within limits). |
| CHR-06 | `chrome.storage.session` cleared on browser restart | In-progress session state | Medium | Use `chrome.storage.session` for ephemeral data only. Persist critical state (streaks, score, blocklist) to `chrome.storage.local`. |
| CHR-07 | Extension popup closes on any click outside | User accidentally losing popup context | Low | Save popup form state to storage on every input change. Restore on re-open. |

---

### 3.2 Firefox

| ID | Issue | Affected Feature | Severity | Workaround |
|----|-------|-----------------|----------|------------|
| FFX-01 | MV2 stable: no `declarativeNetRequest` | Site blocking (core feature) | Critical | Use `webRequest.onBeforeRequest` with `{cancel: true}` for blocking. Abstract blocking behind `BlockingEngine` interface with DNR and webRequest implementations. |
| FFX-02 | MV3 support partial: DNR available but with gaps | Future Firefox MV3 migration | High | Feature-detect `browser.declarativeNetRequest` at runtime. Fall back to webRequest if unavailable. |
| FFX-03 | `browser.action` vs `browser.browserAction` | Popup badge, icon updates | Medium | Use `browserAction` for MV2 Firefox build. The build system swaps the API call during compilation. |
| FFX-04 | `browser.*` APIs are promise-based (no callbacks) | All API calls | Medium | Use `webextension-polyfill` in shared code. Polyfill normalizes Chrome callback APIs to promises. All Focus Mode code uses `await` pattern. |
| FFX-05 | No `chrome.offscreen` API | Ambient sound playback (Pro) | Low | Firefox background scripts have DOM access (MV2), so audio playback works directly via `Audio()` constructor. No offscreen document needed. |
| FFX-06 | Content script world isolation differences | Block page Shadow DOM injection | Medium | Test Shadow DOM attachment in Firefox explicitly. Firefox may require `cloneInto` for certain cross-context operations. |
| FFX-07 | Extension UUID changes on reinstall | Hardcoded extension URLs break | Medium | Always use `browser.runtime.getURL()` dynamically. Never hardcode `moz-extension://` URLs. |
| FFX-08 | `contextMenus` vs `menus` API naming | Right-click quick-block | Low | Firefox supports both, but `menus` is the canonical name. Build-time alias or runtime detection: `browser.menus || browser.contextMenus`. |
| FFX-09 | AMO review requires source code upload for minified builds | Build and submission process | Medium | Submit unminified source alongside the XPI. Document build instructions in a `SOURCE_CODE_README.md`. |

---

### 3.3 Safari

| ID | Issue | Affected Feature | Severity | Workaround |
|----|-------|-----------------|----------|------------|
| SAF-01 | `storage.sync` unavailable | Settings sync, license data sync | Critical | Detect `storage.sync` support at runtime. Fall back to `storage.local` for all data on Safari. Cross-device sync requires a custom backend (outside extension scope). |
| SAF-02 | Notifications severely limited: no action buttons, no images | Session notifications, streak milestones | High | Use simplified notification format (title + message only). No inline action buttons. Clicking notification opens the popup instead. |
| SAF-03 | Content script injection restrictions on certain Apple domains | Blocking `apple.com`, `icloud.com` subdomains | Medium | Document that Apple-owned domains cannot be blocked on Safari. Show a user-facing warning when these domains are added to the blocklist. |
| SAF-04 | Background page is non-persistent but NOT a service worker | Timer/alarm architecture | High | Safari uses a non-persistent background page (has DOM access). Code that checks `typeof ServiceWorkerGlobalScope` must handle this third case. Alarms still work; `setTimeout` is slightly more reliable than in Chrome but still not guaranteed. |
| SAF-05 | Extension must be bundled as a macOS/iOS app via Xcode | Build and distribution | High | Maintain an Xcode project in `platforms/safari/`. Use `xcrun safari-web-extension-converter` to generate the initial project, then customize. Build requires macOS runner in CI. |
| SAF-06 | iOS Safari: aggressive background killing | Pomodoro timer on mobile Safari | Critical | On iOS, the extension background page is killed almost immediately when Safari is backgrounded. Pomodoro timer state must survive full termination. Use alarm-based reconstruction exclusively. |
| SAF-07 | No `chrome.scripting.executeScript` with `world: 'MAIN'` | Content script isolation | Medium | Safari content scripts run in an isolated world by default. For block page injection, use the content script's own context. Avoid `MAIN` world injection entirely. |
| SAF-08 | Safari Web Extension API versioning tied to macOS/iOS versions | Feature availability | Medium | Feature-detect every API before use. Maintain a Safari capability matrix per OS version. |
| SAF-09 | App Store review requires privacy nutrition labels | Submission process | Low | Document all data types accessed (browsing history for blocking, local storage). Fill out App Store privacy questionnaire accurately. |

---

### 3.4 Edge

| ID | Issue | Affected Feature | Severity | Workaround |
|----|-------|-----------------|----------|------------|
| EDG-01 | Enterprise group policies can disable extensions or restrict permissions | All features in managed environments | Medium | Detect restricted state via `chrome.management.getSelf()`. Show a user-facing message: "Your organization may restrict some Focus Mode features." |
| EDG-02 | `storage.sync` tied to Microsoft account, not Google account | Settings sync for users signed into Edge with Microsoft account | Low | storage.sync works but syncs via Microsoft infrastructure. No code change needed, but document for users that sync requires Microsoft account sign-in in Edge. |
| EDG-03 | Edge sidebar panel API (`sidePanel`) has extra capabilities | Potential future sidebar integration | Low | Do not use `sidePanel` API for initial release. It is Edge-specific and would break feature parity. |
| EDG-04 | Edge Canary/Dev/Beta may have different MV3 support levels | Testing on pre-release Edge | Low | Pin CI tests to Edge Stable channel. Manual testing on Canary for forward compatibility. |
| EDG-05 | Edge Add-ons store review timeline is slower (5-10 business days) | Release coordination | Medium | Submit Edge updates 1 week before planned release date. Decouple Edge releases from Chrome releases if review delays occur. |

---

### 3.5 Brave

| ID | Issue | Affected Feature | Severity | Workaround |
|----|-------|-----------------|----------|------------|
| BRV-01 | Brave Shields may conflict with declarativeNetRequest rules | Site blocking, block page redirect | High | Detect Brave via `navigator.brave.isBrave()`. If Shields is enabled, Focus Mode DNR rules may be overridden by Shields' own blocking. Document that users should add Focus Mode to Shields exceptions. |
| BRV-02 | Brave blocks most analytics/tracking requests by default | Extension analytics, license verification | High | License verification and analytics endpoints must not use known tracking domains. Host analytics on a first-party domain (e.g., `api.zovo.one`). Use `fetch` with no third-party cookies. |
| BRV-03 | Brave may strip referrer headers | License activation flow that relies on referrer | Low | Do not rely on `Referer` header for any functionality. Pass context via request body or URL params. |
| BRV-04 | Brave does not have its own extension store | Distribution | Low | Users install via Chrome Web Store. No separate submission needed. Test with the Chrome build. |

---

### 3.6 Opera

| ID | Issue | Affected Feature | Severity | Workaround |
|----|-------|-----------------|----------|------------|
| OPR-01 | Opera Add-ons store has its own review process and policies | Distribution | Medium | Submit via `https://addons.opera.com/developer/`. Opera review is generally faster than Chrome. |
| OPR-02 | Opera sidebar integration (built-in panel) | Potential future sidebar integration | Low | Do not use Opera-specific sidebar APIs for initial release. Chrome extension compatibility mode covers all needed APIs. |
| OPR-03 | Opera's built-in ad blocker may conflict with DNR rules | Site blocking | Medium | Same approach as Brave: document potential conflicts. Focus Mode rules should have higher priority than Opera's built-in blocker for user-specified sites. |
| OPR-04 | Opera GX (gaming browser) has unique theming | Visual consistency | Low | Focus Mode follows `prefers-color-scheme` and its own theme variables. Opera GX theming does not affect extension UI. |

---

## 4. CI/CD Pipeline for Multi-Browser Releases

### 4.1 GitHub Actions Workflow

#### `.github/workflows/cross-browser-build.yml`

```yaml
name: Cross-Browser Build, Test & Release

on:
  push:
    branches: [main, develop]
    tags: ['v*.*.*']
  pull_request:
    branches: [main, develop]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  NODE_VERSION: '20'

permissions:
  contents: write    # For creating releases
  actions: read

jobs:
  # ---------------------------------------------------------------
  # Step 1: Lint & Unit Tests (all browser targets)
  # ---------------------------------------------------------------
  lint-and-unit:
    name: Lint & Unit Tests
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chrome, firefox, safari, edge]
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - run: npm ci

      - name: Lint
        run: npm run lint

      - name: Unit tests (${{ matrix.browser }})
        run: npx jest --config jest.cross-browser.config.js --selectProjects ${{ matrix.browser }}
        env:
          BROWSER_TARGET: ${{ matrix.browser }}

      - name: Upload coverage
        uses: actions/upload-artifact@v4
        with:
          name: coverage-${{ matrix.browser }}
          path: coverage/
          retention-days: 7

  # ---------------------------------------------------------------
  # Step 2: Build browser-specific dist packages
  # ---------------------------------------------------------------
  build:
    name: Build (${{ matrix.browser }})
    needs: lint-and-unit
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chrome, firefox, safari, edge]
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - run: npm ci

      - name: Generate manifest for ${{ matrix.browser }}
        run: node scripts/generate-manifest.js --browser ${{ matrix.browser }}

      - name: Build
        run: npm run build -- --browser ${{ matrix.browser }}

      - name: Validate manifest
        run: node scripts/validate-manifest.js dist/${{ matrix.browser }}/manifest.json

      - name: Package ZIP
        run: |
          cd dist/${{ matrix.browser }}
          zip -r ../../focus-mode-blocker-${{ matrix.browser }}.zip .

      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: build-${{ matrix.browser }}
          path: focus-mode-blocker-${{ matrix.browser }}.zip
          retention-days: 30

  # ---------------------------------------------------------------
  # Step 3: E2E Tests (Chrome, Edge on ubuntu; Firefox on ubuntu)
  # ---------------------------------------------------------------
  e2e:
    name: E2E (${{ matrix.browser }})
    needs: build
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        include:
          - browser: chrome
            os: ubuntu-latest
          - browser: edge
            os: ubuntu-latest
          - browser: firefox
            os: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps ${{ matrix.browser == 'edge' && 'chromium' || matrix.browser == 'chrome' && 'chromium' || 'firefox' }}

      - name: Download build artifact
        uses: actions/download-artifact@v4
        with:
          name: build-${{ matrix.browser }}

      - name: Unzip build
        run: |
          mkdir -p dist/${{ matrix.browser }}
          unzip focus-mode-blocker-${{ matrix.browser }}.zip -d dist/${{ matrix.browser }}

      - name: Setup Firefox profile
        if: matrix.browser == 'firefox'
        run: bash scripts/setup-firefox-test-profile.sh

      - name: Run E2E tests
        run: npx playwright test --config playwright.cross-browser.config.ts --project=${{ matrix.browser }}

      - name: Upload E2E results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: e2e-results-${{ matrix.browser }}
          path: |
            test-results/
            playwright-report/
          retention-days: 14

      - name: Upload visual regression snapshots
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: visual-snapshots-${{ matrix.browser }}
          path: tests/e2e/visual/*.png
          retention-days: 14

  # ---------------------------------------------------------------
  # Step 4: Safari Build (macOS runner required)
  # ---------------------------------------------------------------
  safari-build:
    name: Safari Xcode Build
    needs: build
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - run: npm ci

      - name: Download Safari build artifact
        uses: actions/download-artifact@v4
        with:
          name: build-safari

      - name: Unzip Safari web extension
        run: |
          mkdir -p dist/safari
          unzip focus-mode-blocker-safari.zip -d dist/safari

      - name: Convert to Safari Web Extension
        run: |
          xcrun safari-web-extension-converter dist/safari \
            --project-location platforms/safari \
            --app-name "Focus Mode - Blocker" \
            --bundle-identifier one.zovo.focus-mode-blocker \
            --no-open \
            --no-prompt

      - name: Build Xcode project
        run: |
          cd platforms/safari
          xcodebuild -project "Focus Mode - Blocker.xcodeproj" \
            -scheme "Focus Mode - Blocker" \
            -configuration Release \
            -destination 'generic/platform=macOS' \
            build

      - name: Archive for App Store
        if: startsWith(github.ref, 'refs/tags/v')
        run: |
          cd platforms/safari
          xcodebuild -project "Focus Mode - Blocker.xcodeproj" \
            -scheme "Focus Mode - Blocker" \
            -configuration Release \
            -archivePath build/FocusMode.xcarchive \
            archive

      - name: Upload Xcode archive
        if: startsWith(github.ref, 'refs/tags/v')
        uses: actions/upload-artifact@v4
        with:
          name: safari-archive
          path: platforms/safari/build/FocusMode.xcarchive
          retention-days: 30

  # ---------------------------------------------------------------
  # Step 5: Release (on tag push only)
  # ---------------------------------------------------------------
  release:
    name: Create GitHub Release
    needs: [e2e, safari-build]
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Download all build artifacts
        uses: actions/download-artifact@v4
        with:
          pattern: build-*
          merge-multiple: false

      - name: Extract version from tag
        id: version
        run: echo "VERSION=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          tag_name: v${{ steps.version.outputs.VERSION }}
          name: Focus Mode - Blocker v${{ steps.version.outputs.VERSION }}
          body: |
            ## Focus Mode - Blocker v${{ steps.version.outputs.VERSION }}

            ### Browser Packages
            - **Chrome**: `focus-mode-blocker-chrome.zip` (Chrome Web Store)
            - **Firefox**: `focus-mode-blocker-firefox.zip` (Firefox AMO)
            - **Safari**: Requires Xcode archive (built on macOS runner)
            - **Edge**: `focus-mode-blocker-edge.zip` (Edge Add-ons)

            ### Installation
            Download the ZIP for your browser and follow the sideloading instructions,
            or install from the official store links (once published).
          files: |
            build-chrome/focus-mode-blocker-chrome.zip
            build-firefox/focus-mode-blocker-firefox.zip
            build-edge/focus-mode-blocker-edge.zip
          draft: false
          prerelease: false
```

---

### 4.2 Store Submission Automation

#### Chrome Web Store

```yaml
  # Add to cross-browser-build.yml, after release job
  publish-chrome:
    name: Publish to Chrome Web Store
    needs: release
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    steps:
      - name: Download Chrome build
        uses: actions/download-artifact@v4
        with:
          name: build-chrome

      - name: Upload to Chrome Web Store
        uses: mnao305/chrome-extension-upload@v5.0.0
        with:
          file-path: focus-mode-blocker-chrome.zip
          extension-id: ${{ secrets.CHROME_EXTENSION_ID }}
          client-id: ${{ secrets.CHROME_CLIENT_ID }}
          client-secret: ${{ secrets.CHROME_CLIENT_SECRET }}
          refresh-token: ${{ secrets.CHROME_REFRESH_TOKEN }}
          publish: false  # Upload only; publish manually after verification
```

#### Firefox AMO

```yaml
  publish-firefox:
    name: Publish to Firefox AMO
    needs: release
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Download Firefox build
        uses: actions/download-artifact@v4
        with:
          name: build-firefox

      - name: Unzip for web-ext
        run: |
          mkdir -p dist/firefox
          unzip focus-mode-blocker-firefox.zip -d dist/firefox

      - name: Sign and submit to AMO
        run: |
          npx web-ext sign \
            --source-dir dist/firefox \
            --api-key ${{ secrets.AMO_API_KEY }} \
            --api-secret ${{ secrets.AMO_API_SECRET }} \
            --channel listed
```

#### Edge Add-ons

```yaml
  publish-edge:
    name: Publish to Edge Add-ons
    needs: release
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    steps:
      - name: Download Edge build
        uses: actions/download-artifact@v4
        with:
          name: build-edge

      - name: Upload to Edge Add-ons
        uses: nicolo-ribaudo/push-edge-add-on@v2
        with:
          product-id: ${{ secrets.EDGE_PRODUCT_ID }}
          client-id: ${{ secrets.EDGE_CLIENT_ID }}
          client-secret: ${{ secrets.EDGE_CLIENT_SECRET }}
          access-token-url: ${{ secrets.EDGE_ACCESS_TOKEN_URL }}
          file-path: focus-mode-blocker-edge.zip
```

#### Safari App Store

Safari requires a manual Xcode archive upload via the macOS runner. Full automation with `xcrun altool` is possible but requires Apple Developer credentials and signing certificates stored as GitHub secrets.

```yaml
  publish-safari:
    name: Upload Safari to App Store Connect
    needs: safari-build
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: macos-14
    steps:
      - name: Download Xcode archive
        uses: actions/download-artifact@v4
        with:
          name: safari-archive

      - name: Export IPA / APP
        run: |
          xcodebuild -exportArchive \
            -archivePath FocusMode.xcarchive \
            -exportPath build/export \
            -exportOptionsPlist platforms/safari/ExportOptions.plist

      - name: Upload to App Store Connect
        run: |
          xcrun altool --upload-app \
            --type macos \
            --file build/export/"Focus Mode - Blocker.app" \
            --apiKey ${{ secrets.APPLE_API_KEY_ID }} \
            --apiIssuer ${{ secrets.APPLE_API_ISSUER }}
```

---

### 4.3 Version Management

All browser manifests must share a single version number. The canonical version lives in `package.json`. The build script propagates it to each browser-specific manifest.

#### `scripts/sync-version.js`

```javascript
// scripts/sync-version.js
// Reads version from package.json, writes to all manifest files.

const fs = require('fs');
const path = require('path');

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
const version = pkg.version;

const MANIFEST_PATHS = [
  'src/manifest.json',                // Base manifest (Chrome)
  'src/manifests/firefox.json',       // Firefox overlay
  'src/manifests/safari.json',        // Safari overlay
  'src/manifests/edge.json',          // Edge overlay
];

for (const relPath of MANIFEST_PATHS) {
  const fullPath = path.resolve(relPath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`SKIP: ${relPath} does not exist yet`);
    continue;
  }
  const manifest = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
  manifest.version = version;
  fs.writeFileSync(fullPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Updated ${relPath} to version ${version}`);
}

console.log(`\nAll manifests synced to version ${version}`);
```

#### Version Bump Workflow

```bash
# Bump version, sync manifests, commit, and tag
npm version patch          # or minor, major
node scripts/sync-version.js
git add -A
git commit -m "chore: bump version to $(node -p 'require(\"./package.json\").version')"
git tag "v$(node -p 'require("./package.json").version')"
git push origin main --tags
```

---

### 4.4 Release Branch Strategy

Different stores review at different speeds. Chrome reviews take 1-3 days, Firefox AMO 1-7 days, Edge 5-10 days, and Apple App Store 1-14 days. This creates a coordination challenge.

#### Branch Model

```
main (stable, always releasable)
  |
  +-- develop (integration branch, all features merged here first)
  |     |
  |     +-- feature/cross-browser-popup-fix
  |     +-- feature/safari-storage-fallback
  |
  +-- release/v1.2.0 (cut from develop when ready)
  |     |
  |     +-- Tag: v1.2.0 (triggers CI build for all browsers)
  |     |
  |     +-- hotfix/v1.2.1 (if store-specific issue found during review)
  |
  +-- store/chrome   (tracks Chrome Web Store published version)
  +-- store/firefox  (tracks AMO published version)
  +-- store/edge     (tracks Edge Add-ons published version)
  +-- store/safari   (tracks App Store published version)
```

#### Release Procedure

1. **Cut release branch** from `develop`: `git checkout -b release/v1.2.0 develop`
2. **Run full cross-browser test suite** on the release branch
3. **Tag the release**: `git tag v1.2.0 && git push origin v1.2.0`
4. **CI builds and uploads** to all four stores automatically
5. **Monitor store reviews** independently:
   - Chrome approved first: update `store/chrome` branch, announce on Chrome Web Store
   - Firefox approved: update `store/firefox` branch
   - Edge approved: update `store/edge` branch
   - Safari approved: update `store/safari` branch
6. **Hotfix path**: If a store rejects the build (e.g., Firefox rejects due to AMO policy), fix on a `hotfix/v1.2.1` branch, tag `v1.2.1`, and resubmit only to the affected store
7. **Merge back**: After all stores have published, merge `release/v1.2.0` (and any hotfixes) back to `main` and `develop`

#### Store Review Status Tracking

```yaml
# .github/workflows/store-status.yml
# Manual workflow to update store submission status
name: Store Submission Status

on:
  workflow_dispatch:
    inputs:
      store:
        description: 'Store name'
        required: true
        type: choice
        options: [chrome, firefox, edge, safari]
      status:
        description: 'Review status'
        required: true
        type: choice
        options: [submitted, in-review, approved, rejected, published]
      version:
        description: 'Version number'
        required: true

jobs:
  update-status:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Update status file
        run: |
          mkdir -p .store-status
          cat > .store-status/${{ inputs.store }}.json << EOF
          {
            "store": "${{ inputs.store }}",
            "version": "${{ inputs.version }}",
            "status": "${{ inputs.status }}",
            "updatedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
            "updatedBy": "${{ github.actor }}"
          }
          EOF

      - name: Commit status update
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add .store-status/
          git commit -m "chore: update ${{ inputs.store }} store status to ${{ inputs.status }} for v${{ inputs.version }}"
          git push
```

---

## 5. Integration Summary & Porting Checklist

### 5.1 Phase-by-Phase Porting Checklist

#### Phase 1: Preparation (Week 1-2)

- [ ] **API audit**: Catalog every `chrome.*` API call in `src/background/`, `src/content/`, `src/popup/`, `src/options/`
- [ ] **Identify Chrome-only APIs**: `declarativeNetRequest`, `offscreen`, `scripting.executeScript` with `world`, `storage.session`, `action` (vs `browserAction`)
- [ ] **Build system setup**: Configure Webpack/Rollup/esbuild to output browser-specific bundles
- [ ] **Project restructuring**: Move Chrome-specific code into `src/platform/chrome/`, create `src/platform/shared/`
- [ ] **Install `webextension-polyfill`**: Add as a dependency, plan integration points
- [ ] **Create `src/manifests/` directory**: Base manifest + browser-specific overlays

#### Phase 2: Code Adaptation (Week 3-5)

- [ ] **Integrate `webextension-polyfill`**: Import at the top of every module that uses browser APIs
- [ ] **Build API abstraction layer**: `src/platform/api.ts` that wraps all Chrome API calls behind cross-browser functions
- [ ] **Blocking engine abstraction**: `BlockingEngine` interface with `DnrBlockingEngine` (Chrome/Edge/Safari) and `WebRequestBlockingEngine` (Firefox MV2)
- [ ] **Storage abstraction**: `StorageAdapter` that handles `storage.sync` fallback to `storage.local` for Safari
- [ ] **Feature detection module**: `src/platform/capabilities.ts` that probes for API availability at runtime
- [ ] **Replace all hardcoded `chrome-extension://` URLs** with `runtime.getURL()` calls
- [ ] **Replace `chrome.contextMenus` references** with `menus` API (with fallback)
- [ ] **Replace `chrome.action` references** with `browserAction` for Firefox MV2 build

#### Phase 3: Manifests (Week 5-6)

- [ ] **Base manifest** (`src/manifests/base.json`): Shared keys (name, description, version, icons, default_locale)
- [ ] **Chrome overlay** (`src/manifests/chrome.json`): MV3, `service_worker`, `declarativeNetRequest`, `action`
- [ ] **Firefox overlay** (`src/manifests/firefox.json`): MV2 or MV3 depending on strategy, `background.scripts`, `browser_specific_settings.gecko.id`
- [ ] **Safari overlay** (`src/manifests/safari.json`): MV3, `background.scripts` (non-persistent page), Safari-specific limitations
- [ ] **Edge overlay** (`src/manifests/edge.json`): Same as Chrome with minor tweaks
- [ ] **Manifest generation script** (`scripts/generate-manifest.js`): Merges base + overlay, validates result

#### Phase 4: Firefox Port (Week 6-8)

- [ ] **Background script migration**: Convert service worker to background script (add `window`, `document` polyfills if needed, or restructure to avoid them)
- [ ] **WebRequest blocking implementation**: `src/platform/firefox/webRequestBlocker.ts` using `browser.webRequest.onBeforeRequest`
- [ ] **Test all 13 blocking scenarios** (B-01 through B-13) on Firefox
- [ ] **Test block page rendering** (Shadow DOM) in Firefox
- [ ] **Test popup all 6 states** in Firefox
- [ ] **Test Pomodoro timer** with Firefox alarm behavior
- [ ] **AMO submission**: Create AMO developer account, fill out listing details, submit for review
- [ ] **Source code upload**: Package unminified source for AMO review requirement

#### Phase 5: Safari Port (Week 8-11)

- [ ] **Xcode project setup**: Run `xcrun safari-web-extension-converter`, customize project
- [ ] **Storage.sync fallback**: Verify all `storage.sync` calls fall back to `storage.local`
- [ ] **Notification simplification**: Strip action buttons from notification payloads on Safari
- [ ] **Content script testing**: Verify Shadow DOM block page works on Safari
- [ ] **iOS extension target**: Add iOS target to Xcode project, test on iPhone/iPad
- [ ] **App Store submission**: Create App Store listing, screenshots for macOS and iOS, privacy labels
- [ ] **Apple review**: Respond to any review feedback (common: privacy policy questions)

#### Phase 6: Edge & Others (Week 11-12)

- [ ] **Edge testing**: Run full test matrix on Edge Stable; Chrome build should work with zero changes
- [ ] **Edge Add-ons submission**: Create developer account, submit ZIP, fill out listing
- [ ] **Brave testing**: Install Chrome build on Brave, test Shields conflicts, document known issues
- [ ] **Opera testing**: Install Chrome build on Opera, test built-in ad blocker conflicts
- [ ] **Opera Add-ons submission**: Submit to Opera Add-ons store

#### Phase 7: CI/CD (Week 12-13)

- [ ] **GitHub Actions workflow**: Implement `cross-browser-build.yml` (Section 4.1)
- [ ] **Store submission secrets**: Configure `CHROME_CLIENT_ID`, `AMO_API_KEY`, `EDGE_PRODUCT_ID`, `APPLE_API_KEY_ID` in GitHub repository secrets
- [ ] **Automated E2E in CI**: Playwright tests for Chrome, Firefox, Edge in the pipeline
- [ ] **Safari CI on macOS runner**: Xcode build step on `macos-14` runner
- [ ] **Visual regression baselines**: Generate and commit baseline screenshots per browser
- [ ] **Release automation**: Tag-triggered release creates GitHub Release with all ZIPs

#### Phase 8: Maintenance (Ongoing)

- [ ] **Browser update monitoring**: Subscribe to Chrome, Firefox, Safari, Edge release notes and developer blogs
- [ ] **Deprecation tracking**: Maintain a spreadsheet of API deprecation timelines per browser
- [ ] **Cross-browser bug triage**: Label bugs with `browser:chrome`, `browser:firefox`, etc.
- [ ] **Quarterly compatibility audit**: Re-run full test matrix on latest browser versions
- [ ] **MV3 migration tracker for Firefox**: Monitor Firefox MV3 progress, plan migration when stable

---

### 5.2 Effort Estimates

| Phase | Duration | Developer-Days | Dependencies |
|-------|----------|---------------|--------------|
| Phase 1: Preparation | 2 weeks | 8 days | None |
| Phase 2: Code Adaptation | 3 weeks | 12 days | Phase 1 |
| Phase 3: Manifests | 1 week | 4 days | Phase 2 |
| Phase 4: Firefox | 2.5 weeks | 10 days | Phase 3 |
| Phase 5: Safari | 3 weeks | 12 days | Phase 3 |
| Phase 6: Edge & Others | 1.5 weeks | 6 days | Phase 3 |
| Phase 7: CI/CD | 1.5 weeks | 6 days | Phases 4-6 |
| Phase 8: Maintenance | Ongoing | 2 days/month | Phase 7 |
| **Total initial porting** | **~14 weeks** | **~58 days** | |

**Critical path**: Phase 1 -> Phase 2 -> Phase 3 -> (Phase 4, 5, 6 in parallel) -> Phase 7

Phases 4, 5, and 6 can run in parallel if multiple developers are available, reducing the critical path to approximately 9-10 weeks.

---

### 5.3 Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Firefox MV3 DNR support is incomplete when we port | High | High | Build the webRequest fallback for Firefox MV2 first. DNR support can be swapped in later when Firefox MV3 stabilizes. |
| Safari `storage.sync` absence breaks license verification | High | Critical | Design the storage abstraction from day one. License data stored in `storage.local` with a custom sync mechanism (backend API) for Safari users. |
| Apple App Store rejects the extension | Medium | High | Study Apple's Web Extension Review Guidelines thoroughly. Common rejection reasons: privacy policy, overly broad permissions, in-app purchase requirements (Apple mandates IAP for purchases inside App Store apps). |
| Brave Shields conflict causes blocking failures | Medium | Medium | Detect Brave at runtime. Show an informational banner in the options page: "For best results, add Focus Mode to Brave Shields exceptions." |
| Service worker lifecycle differences across browsers | Medium | High | Use the alarm-based architecture already built for Chrome. Safari and Firefox background contexts are more permissive, not less -- the Chrome-designed architecture is the most conservative and will work everywhere. |
| Cross-browser visual inconsistencies | High | Low | Establish visual regression baselines per browser. Accept minor font rendering differences. Use CSS custom properties and system fonts. |
| Store review timelines delay coordinated launch | High | Medium | Launch Chrome first (most users). Do not hold Chrome release for other stores. Announce each browser availability separately. |
| Apple requires IAP for Pro subscription (30% cut) | Medium | Critical | Research Apple's policy on web extensions with external subscriptions. If IAP is required, factor the 30% into Safari pricing or offer a separate SKU. |

---

### 5.4 Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|--------------------|
| **Feature parity score** | 95%+ across Chrome/Firefox/Edge; 85%+ for Safari | Automated: (tests passing / total tests) per browser from CI |
| **Cross-browser install rate** | Firefox: 15% of Chrome installs; Edge: 10%; Safari: 5% within 6 months | Store analytics dashboards |
| **Crash-free rate per browser** | 99.5%+ for each browser | Sentry error tracking, filtered by browser tag |
| **E2E test pass rate in CI** | 100% for Chrome/Edge, 95%+ for Firefox, 90%+ for Safari | GitHub Actions test results dashboard |
| **Store review approval rate** | First-submission approval > 90% | Track submissions vs rejections per store |
| **Time-to-publish per store** | Chrome: < 3 days, Firefox: < 7 days, Edge: < 10 days, Safari: < 14 days | Submission timestamp vs publish timestamp |
| **Visual regression false positive rate** | < 5% of screenshot comparisons flag false differences | Playwright visual comparison results |
| **User-reported cross-browser bugs** | < 5 per month per browser after launch | GitHub issues labeled by browser |
| **Pro conversion rate per browser** | Within 20% of Chrome conversion rate for each browser | Payment analytics filtered by browser |

---

## 6. Cross-Browser Monitoring & Analytics

### 6.1 Browser-Specific Error Tracking

All errors are tagged with browser identity to enable per-browser filtering in the error tracking dashboard.

#### Browser Detection Utility

```typescript
// src/shared/browser-detect.ts
// Detects the current browser at runtime for error tagging and analytics.

export interface BrowserInfo {
  name: 'chrome' | 'firefox' | 'safari' | 'edge' | 'brave' | 'opera' | 'unknown';
  version: string;
  manifestVersion: number;
  platform: 'desktop' | 'ios' | 'android';
}

export async function detectBrowser(): Promise<BrowserInfo> {
  const ua = navigator.userAgent;
  let name: BrowserInfo['name'] = 'unknown';
  let version = '';

  // Brave detection (must come before Chrome check)
  if ((navigator as any).brave && await (navigator as any).brave.isBrave()) {
    name = 'brave';
    const match = ua.match(/Chrome\/(\d+\.\d+)/);
    version = match ? match[1] : '';
  }
  // Opera detection (must come before Chrome check)
  else if (ua.includes('OPR/') || ua.includes('Opera/')) {
    name = 'opera';
    const match = ua.match(/OPR\/(\d+\.\d+)/);
    version = match ? match[1] : '';
  }
  // Edge detection (must come before Chrome check)
  else if (ua.includes('Edg/')) {
    name = 'edge';
    const match = ua.match(/Edg\/(\d+\.\d+)/);
    version = match ? match[1] : '';
  }
  // Firefox detection
  else if (ua.includes('Firefox/')) {
    name = 'firefox';
    const match = ua.match(/Firefox\/(\d+\.\d+)/);
    version = match ? match[1] : '';
  }
  // Safari detection
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
    name = 'safari';
    const match = ua.match(/Version\/(\d+\.\d+)/);
    version = match ? match[1] : '';
  }
  // Chrome (generic, after all Chromium forks)
  else if (ua.includes('Chrome/')) {
    name = 'chrome';
    const match = ua.match(/Chrome\/(\d+\.\d+)/);
    version = match ? match[1] : '';
  }

  // Platform detection
  let platform: BrowserInfo['platform'] = 'desktop';
  if (/iPad|iPhone|iPod/.test(ua)) platform = 'ios';
  else if (/Android/.test(ua)) platform = 'android';

  // Manifest version
  const manifest = chrome?.runtime?.getManifest?.() || (globalThis as any).browser?.runtime?.getManifest?.();
  const manifestVersion = manifest?.manifest_version || 0;

  return { name, version, manifestVersion, platform };
}
```

#### Sentry Integration with Browser Tags

```typescript
// src/shared/error-tracker.ts
// Wraps Sentry initialization with browser-specific tags.

import { detectBrowser, BrowserInfo } from './browser-detect';

let browserInfo: BrowserInfo | null = null;

export async function initErrorTracking(): Promise<void> {
  browserInfo = await detectBrowser();

  // Sentry-like configuration (using lightweight custom reporter for extension size)
  const config = {
    dsn: 'https://your-sentry-dsn@sentry.io/focus-mode-blocker',
    release: chrome.runtime.getManifest().version,
    environment: process.env.NODE_ENV || 'production',
    tags: {
      browser: browserInfo.name,
      browserVersion: browserInfo.version,
      manifestVersion: String(browserInfo.manifestVersion),
      platform: browserInfo.platform,
    },
  };

  // Initialize error tracking with these tags
  // Every error automatically includes browser context
  setupGlobalErrorHandler(config);
}

function setupGlobalErrorHandler(config: any): void {
  self.addEventListener('error', (event) => {
    reportError({
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
      tags: config.tags,
    });
  });

  self.addEventListener('unhandledrejection', (event) => {
    reportError({
      message: `Unhandled rejection: ${event.reason}`,
      stack: event.reason?.stack,
      tags: config.tags,
    });
  });
}

async function reportError(errorData: any): Promise<void> {
  // Send to your error tracking endpoint
  try {
    await fetch('https://api.zovo.one/v1/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...errorData,
        timestamp: Date.now(),
        extensionVersion: chrome.runtime.getManifest().version,
      }),
    });
  } catch {
    // Silently fail -- do not create error loops
  }
}
```

---

### 6.2 Feature Usage Analytics per Browser

Track which features are actually used per browser to detect feature-parity gaps (e.g., if Firefox users never use Nuclear Mode, investigate whether it is broken).

#### Analytics Event Schema

```typescript
// src/shared/analytics.ts
// Lightweight analytics with browser tagging.

interface AnalyticsEvent {
  event: string;
  browser: string;
  browserVersion: string;
  platform: string;
  extensionVersion: string;
  timestamp: number;
  properties?: Record<string, string | number | boolean>;
}

const TRACKED_EVENTS = [
  'session_started',
  'session_completed',
  'session_paused',
  'session_resumed',
  'nuclear_mode_activated',
  'nuclear_mode_completed',
  'site_blocked',             // User hit a blocked site
  'site_added_to_blocklist',
  'site_removed_from_blocklist',
  'context_menu_block',       // Right-click quick-block used
  'paywall_triggered',        // Which trigger (T1-T10)
  'paywall_converted',        // User upgraded to Pro
  'onboarding_completed',
  'onboarding_skipped',
  'settings_exported',
  'settings_imported',
  'streak_milestone',         // Which milestone (7, 14, 30, etc.)
  'notification_clicked',
  'block_page_go_back',       // User clicked "Go Back" on block page
] as const;

type TrackedEventName = typeof TRACKED_EVENTS[number];

export async function trackEvent(
  event: TrackedEventName,
  properties?: Record<string, string | number | boolean>
): Promise<void> {
  const browserInfo = await detectBrowser();

  const payload: AnalyticsEvent = {
    event,
    browser: browserInfo.name,
    browserVersion: browserInfo.version,
    platform: browserInfo.platform,
    extensionVersion: chrome.runtime.getManifest().version,
    timestamp: Date.now(),
    properties,
  };

  // Batch events locally, flush every 5 minutes via alarm
  const { analyticsQueue = [] } = await chrome.storage.local.get('analyticsQueue');
  analyticsQueue.push(payload);
  await chrome.storage.local.set({ analyticsQueue });
}

export async function flushAnalytics(): Promise<void> {
  const { analyticsQueue = [] } = await chrome.storage.local.get('analyticsQueue');
  if (analyticsQueue.length === 0) return;

  try {
    await fetch('https://api.zovo.one/v1/analytics/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: analyticsQueue }),
    });
    await chrome.storage.local.set({ analyticsQueue: [] });
  } catch {
    // Retry on next flush cycle
  }
}
```

#### Per-Browser Feature Usage Dashboard Queries

The backend (outside extension scope) aggregates events to produce per-browser feature usage reports:

| Metric | Query | Purpose |
|--------|-------|---------|
| Sessions started per browser | `COUNT(session_started) GROUP BY browser` | Verify Pomodoro timer works on all browsers |
| Nuclear Mode usage per browser | `COUNT(nuclear_mode_activated) GROUP BY browser` | Detect if Nuclear Mode is broken/unused on specific browsers |
| Paywall trigger distribution per browser | `COUNT(paywall_triggered) GROUP BY browser, properties.trigger` | Verify all 10 trigger points fire on all browsers |
| Block page "Go Back" rate per browser | `COUNT(block_page_go_back) / COUNT(site_blocked) GROUP BY browser` | Detect if block page is rendering incorrectly on a browser |
| Context menu usage per browser | `COUNT(context_menu_block) GROUP BY browser` | Verify context menu registers on all browsers |
| Onboarding completion rate per browser | `COUNT(onboarding_completed) / COUNT(onboarding_started) GROUP BY browser` | Detect if onboarding slides break on specific browsers |

---

### 6.3 Performance Benchmarks per Browser

Run these benchmarks quarterly on the latest browser versions and track trends.

| Benchmark | Target | How to Measure |
|-----------|--------|----------------|
| **Service worker startup time** | < 200ms | `performance.now()` at top of service worker vs. after all listeners registered |
| **Popup render time** (idle state) | < 300ms | `DOMContentLoaded` to last paint in popup, measured via `PerformanceObserver` |
| **Block page injection time** | < 100ms | Time from content script execution to Shadow DOM render complete |
| **DNR rule update latency** | < 50ms for single rule | Time to `updateDynamicRules` resolve |
| **Storage read latency** (blocklist) | < 20ms | Time to `storage.local.get('blocklist')` resolve |
| **Storage write latency** (settings) | < 30ms | Time to `storage.local.set({settings})` resolve |
| **Memory usage** (idle) | < 10MB | `chrome.system.memory` or `performance.memory` (where available) |
| **Memory usage** (active session) | < 15MB | Same, during active Pomodoro session |
| **CPU usage during blocking** | < 1% sustained | Browser task manager during active blocking with 50+ rules |

#### Automated Performance Test

```typescript
// tests/performance/benchmarks.test.ts

import { test, expect } from '@playwright/test';

test.describe('Performance benchmarks', () => {
  test('popup renders under 300ms', async ({ page, context }) => {
    const extensionId = await getChromiumExtensionId(context);
    const popupUrl = getPopupUrl(extensionId, test.info().project.name);

    const startTime = Date.now();
    await page.goto(popupUrl);
    await page.waitForSelector('#focus-score-display');
    const renderTime = Date.now() - startTime;

    console.log(`Popup render time (${test.info().project.name}): ${renderTime}ms`);
    expect(renderTime).toBeLessThan(300);
  });

  test('adding a site to blocklist completes under 100ms', async ({ page, context }) => {
    const extensionId = await getChromiumExtensionId(context);
    const popupUrl = getPopupUrl(extensionId, test.info().project.name);

    await page.goto(popupUrl);

    const startTime = Date.now();
    await page.fill('#quick-add-input', 'example.com');
    await page.click('#quick-add-btn');
    await page.waitForSelector('[data-domain="example.com"]');
    const operationTime = Date.now() - startTime;

    console.log(`Add site time (${test.info().project.name}): ${operationTime}ms`);
    expect(operationTime).toBeLessThan(100);
  });
});
```

---

### 6.4 User Feedback Collection per Platform

Each browser's store provides its own review and feedback mechanisms. Supplement store reviews with in-extension feedback.

#### In-Extension Feedback Prompt

```typescript
// src/shared/feedback.ts
// Shows a feedback prompt after key milestones, tagged with browser info.

export async function checkFeedbackEligibility(): Promise<boolean> {
  const { feedbackState } = await chrome.storage.local.get('feedbackState');
  if (feedbackState?.dismissed) return false;
  if (feedbackState?.submitted) return false;

  const { streak } = await chrome.storage.local.get('streak');
  // Show feedback prompt after 7-day streak (engaged user)
  return streak?.current >= 7;
}

export async function submitFeedback(rating: 1 | 2 | 3 | 4 | 5, comment: string): Promise<void> {
  const browserInfo = await detectBrowser();

  await fetch('https://api.zovo.one/v1/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rating,
      comment,
      browser: browserInfo.name,
      browserVersion: browserInfo.version,
      platform: browserInfo.platform,
      extensionVersion: chrome.runtime.getManifest().version,
      timestamp: Date.now(),
    }),
  });

  await chrome.storage.local.set({
    feedbackState: { submitted: true, submittedAt: Date.now() },
  });
}

export function getStoreReviewUrl(browser: string): string {
  const urls: Record<string, string> = {
    chrome: 'https://chrome.google.com/webstore/detail/focus-mode-blocker/CHROME_EXTENSION_ID/reviews',
    firefox: 'https://addons.mozilla.org/en-US/firefox/addon/focus-mode-blocker/reviews/',
    edge: 'https://microsoftedge.microsoft.com/addons/detail/focus-mode-blocker/EDGE_PRODUCT_ID',
    safari: 'https://apps.apple.com/app/focus-mode-blocker/idAPPLE_APP_ID?action=write-review',
    brave: 'https://chrome.google.com/webstore/detail/focus-mode-blocker/CHROME_EXTENSION_ID/reviews',
    opera: 'https://addons.opera.com/en/extensions/details/focus-mode-blocker/',
  };
  return urls[browser] || urls.chrome;
}
```

#### Per-Browser Feedback Dashboard

| Metric | Source | Frequency |
|--------|--------|-----------|
| Store rating (1-5 stars) per browser | Chrome Web Store API, AMO API, Edge Partner Center, App Store Connect | Daily |
| In-extension NPS (1-5) per browser | `api.zovo.one/v1/feedback` aggregation | Weekly |
| Top complaint keywords per browser | NLP on feedback comments, filtered by browser tag | Weekly |
| Feature request frequency per browser | GitHub issues labeled `browser:*` + `enhancement` | Monthly |
| Support ticket volume per browser | Help desk tagged by browser | Weekly |

---

*End of Phase 16, Agent 5 — Cross-Browser Testing, CI/CD & Integration*
