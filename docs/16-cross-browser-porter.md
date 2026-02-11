# CROSS-BROWSER PORTER: Focus Mode - Blocker
## Phase 16 Output — Browser Landscape, API Compatibility, Porting Guides, Build System, Testing & CI/CD

> **Date:** February 11, 2026 | **Status:** Complete
> **Input:** Phases 01-15

---

## Overview

Phase 16 delivers a complete cross-browser porting strategy for Focus Mode - Blocker, produced by five specialized agents. The output covers the full spectrum of multi-browser extension development: a browser landscape analysis with API compatibility audit mapping every Chrome API used by Focus Mode - Blocker (declarativeNetRequest, storage, alarms, notifications, tabs, contextMenus, scripting, action, runtime, i18n) to Firefox, Safari, Edge, Brave, and Opera with feature detection patterns and a BrowserAPI abstraction layer; manifest generation for all target browsers with a comprehensive Firefox porting guide covering background script migration, declarativeNetRequest adaptation, web-ext tooling, and AMO submission; a Safari porting guide covering Xcode project setup via safari-web-extension-converter, native messaging with SafariWebExtensionHandler.swift, iOS Safari extension opportunity, iCloud sync, App Store submission, and Apple's IAP requirements for Pro features; Chromium browser porting (Edge enterprise deployment, Brave Shields interaction, Opera sidebar) plus a complete multi-browser build system with Webpack configuration, manifest generation scripts, and npm scripts for dev/build/package/submit across all browsers; and a testing matrix with 50+ cross-browser test cases covering all Focus Mode - Blocker features, Playwright E2E configuration for multi-browser testing, a browser-specific bug database, GitHub Actions CI/CD pipeline for automated multi-browser builds and store submissions, and a phased porting checklist with effort estimates.

---

## Agent Deliverables

### Agent 1 — Browser Landscape & API Compatibility
**File:** `docs/cross-browser/agent1-browser-landscape-api-compatibility.md`

- Market opportunity analysis for Focus Mode - Blocker across 7 browsers, with competitive landscape per platform (existing site blockers on Firefox, Safari, Edge)
- Revenue opportunity by platform: Safari users have highest payment willingness ($4.99+ acceptable), Firefox users value privacy-focused productivity tools, Edge enterprise users represent B2B opportunity
- Recommended porting priority: Chrome (primary) → Edge (easy port, enterprise) → Firefox (different engine, loyal users) → Safari (iOS opportunity, premium users) → Opera/Brave (bonus reach)
- Complete API compatibility audit for every Chrome API used by Focus Mode - Blocker:
  - `declarativeNetRequest`: Full Chrome/Edge support, Firefox MV3 partial (since 109), Safari supported with differences
  - `storage.local/sync/session`: Universal local support, sync varies (Safari falls back to local), session MV3-only
  - `alarms`: Universal support with minor timing differences
  - `notifications`: Full Chrome/Firefox, limited Safari, full Edge
  - `tabs/scripting/action/runtime/contextMenus/i18n`: High compatibility with documented quirks
- WebExtension polyfill integration plan: which Focus Mode - Blocker files need modification
- Feature detection patterns for graceful degradation of Nuclear Mode, Focus Score persistence, and notification fallbacks
- `BrowserAPI` abstraction layer class design for unified blocking, storage, notifications, alarms, and tabs interfaces

### Agent 2 — Manifest Differences & Firefox Porting
**File:** `docs/cross-browser/agent2-manifest-firefox-porting.md`

- Complete manifests for Focus Mode - Blocker: Chrome MV3 (current), Firefox MV3 (gecko ID `focusmode-blocker@zovo.one`, background scripts array), Firefox MV2 (browser_action, combined permissions), Safari MV3
- Manifest comparison table covering every field difference across browsers
- Manifest generation script (`scripts/generate-manifest.js`) with deep-merge of base + browser overlays, MV2 transform function, and Focus Mode - Blocker's full permission set
- Firefox porting guide:
  - Service worker → event-driven background script migration for alarm handlers, notification dispatchers, storage listeners, declarativeNetRequest rule updates, badge updates, streak calculations
  - declarativeNetRequest on Firefox MV3: support since Firefox 109, dynamic rules, session rules, rule limit differences
  - Block page shadow DOM compatibility on Firefox
  - Pomodoro timer alarm persistence differences
  - Nuclear Mode feasibility on Firefox (extension cannot prevent its own disabling via about:addons)
  - Storage sync implementation differences, data migration strategy
  - Privacy alignment: Focus Mode - Blocker's local-only data model is ideal for Firefox's privacy-focused user base
- web-ext configuration, testing workflow, and build validation
- AMO submission checklist, listing description, and review process expectations for a site-blocking extension

### Agent 3 — Safari Porting Guide
**File:** `docs/cross-browser/agent3-safari-porting.md`

- Safari Web Extension architecture: containing app + extension model, how it applies to Focus Mode - Blocker
- Step-by-step conversion using `xcrun safari-web-extension-converter` with bundle identifier `one.zovo.focusmode-blocker`
- Xcode project structure: macOS app container, Safari extension, iOS app container, iOS extension
- Safari API compatibility for Focus Mode - Blocker:
  - declarativeNetRequest: supported with Safari-specific rule limits
  - storage.sync → local fallback, iCloud sync via native messaging alternative
  - Notifications: limited to system notifications, containing app for rich notifications
  - Alarms: supported but iOS background execution limits affect timer reliability
  - Content scripts: shadow DOM support, CSP differences
- SafariWebExtensionHandler.swift implementation for native messaging (settings sync, enhanced notifications, system Focus integration)
- iOS Safari opportunity: mobile website blocking is an underserved market with premium users
  - macOS Focus integration: auto-enable Focus Mode - Blocker when system Do Not Disturb is active
  - iCloud sync for blocklists and settings across Apple devices
  - Widget opportunities: Focus Score, streak, timer status on Home Screen
- Safari limitations and workarounds: Content Blocker performance benefits, iOS background limits, Nuclear Mode feasibility
- **Apple IAP requirement**: Pro features on Safari/iOS must use In-App Purchase (30% Apple tax), pricing adjustment from $4.99 to ~$6.99 to maintain margin, or absorb the tax
- App Store submission: App Store Connect setup, privacy labels, screenshots, TestFlight beta, review process
- Automated Safari build pipeline with CI/CD considerations (macOS runner required)

### Agent 4 — Chromium Browsers & Build System
**File:** `docs/cross-browser/agent4-chromium-browsers-build-system.md`

- Edge porting: near-identical Chrome compatibility, enterprise deployment via Microsoft Intune/Group Policy, Partner Center submission process, Edge Add-ons store listing
- Brave porting: installs from Chrome Web Store, Brave Shields interaction with declarativeNetRequest (Shields operates at a different layer — no conflict), privacy considerations for analytics
- Opera porting: sidebar extension opportunity for Focus Mode dashboard, Opera GX gaming browser positioning, Opera Add-ons submission
- Vivaldi, Arc, and other Chromium browsers: general compatibility notes
- **Multi-browser build system** for Focus Mode - Blocker:
  - Current state: vanilla JS with no bundler
  - Webpack configuration with entry points for all Focus Mode - Blocker scripts (background, content, popup, options, onboarding, block page)
  - Browser-specific builds via `--env browser=chrome|firefox|safari|edge`
  - DefinePlugin for `__BROWSER__` and `__MV__` compile-time constants
  - CopyPlugin for HTML, icons, `_locales/`, assets
  - Project restructure proposal for multi-browser source organization
  - Manifest generator script with base + browser overlay deep-merge
  - Complete package.json scripts for dev, build, package, test, submit across all browsers
  - Packaging script for ZIP artifact creation
- Browser-specific code patterns: conditional imports, tree-shaking, module conversion for existing vanilla JS files
- Store comparison table and recommended submission order

### Agent 5 — Testing Matrix, CI/CD & Integration
**File:** `docs/cross-browser/agent5-testing-cicd-integration.md`

- Cross-browser testing matrix with 50+ test cases specific to Focus Mode - Blocker:
  - Site blocking (declarativeNetRequest rules, block page display, allowlist, wildcards)
  - Block page (shadow DOM, timer, quotes, Focus Score display)
  - Popup (all 6 states across browsers)
  - Pomodoro timer (alarm accuracy, persistence, break notifications)
  - Nuclear Mode (unbypassable blocking feasibility per browser)
  - Focus Score and streaks (storage persistence, calculation accuracy)
  - Settings/Options (8 sections, import/export)
  - Onboarding, Paywall, Context menu, Notifications, i18n
- Jest configuration for cross-browser unit tests with browser API mocks
- Playwright E2E configuration for Chrome, Firefox, and Edge with extension loading
- Visual regression testing across browsers
- Browser-specific bug database: Chrome service worker timeout, Firefox background script lifecycle, Safari storage/notification limits, Edge enterprise policy interference, Brave Shields analytics blocking
- GitHub Actions CI/CD workflow: matrix builds, automated testing, artifact creation, store submission automation (Chrome Web Store, Firefox AMO, Edge Add-ons)
- Version management across stores with different review timelines
- Phased porting checklist (8 phases) with effort estimates and risk assessment
- Success metrics: install rates per browser, crash rates, feature parity score

---

## Key Design Decisions

### Porting Priority Order
- **P0 — Chrome**: Primary platform, already complete. ~65% market share.
- **P1 — Edge**: Same Chromium engine, near-zero code changes needed. Enterprise user base. Free store submission. Submit within first week.
- **P2 — Firefox**: Different engine requires real porting work. Loyal, privacy-focused users with high payment willingness. 2-3 week effort.
- **P3 — Safari**: Biggest revenue opportunity per user but highest porting complexity (Xcode, containing app, IAP). iOS mobile blocking is an underserved market. 4-6 week effort.
- **P4 — Opera/Brave**: Chromium-based, minimal effort. Opera sidebar opportunity. Submit when P1-P3 are stable.

### WebExtension Polyfill Strategy
- Adopt `webextension-polyfill` as the standard API access layer across all browsers
- All `chrome.*` calls in existing code migrate to `browser.*` with promise-based patterns
- The polyfill handles Chrome/Firefox/Safari namespace differences transparently
- A thin `BrowserAPI` abstraction layer on top handles Focus Mode - Blocker-specific API differences (declarativeNetRequest rule format, notification capabilities, storage sync fallbacks)

### Build System Choice
- Webpack selected over Rollup for Focus Mode - Blocker's multi-entry-point architecture
- Each browser target produces an independent `dist/{browser}/` directory with browser-specific manifest
- Single `npm run build:all` command builds Chrome, Firefox, Safari, and Edge simultaneously
- `DefinePlugin` injects `__BROWSER__` constant for compile-time code branching, enabling dead code elimination in production builds

### Nuclear Mode Cross-Browser Reality
- Chrome: Fully unbypassable during active session (extension can't be disabled without closing Chrome)
- Firefox: Can be disabled via about:addons — Nuclear Mode is "strong deterrent" rather than truly unbypassable
- Safari: Extension can be toggled in Safari preferences — similar to Firefox
- Edge: Same as Chrome (Chromium-based)
- Decision: Implement Nuclear Mode on all platforms with browser-specific UX messaging. On Firefox/Safari, warn users that Nuclear Mode can technically be bypassed and suggest closing the extensions manager tab during Nuclear sessions.

### Safari IAP Pricing
- Apple requires In-App Purchase for digital goods in App Store apps
- Pro monthly: $6.99 (absorbs 30% Apple tax to maintain ~$4.89 net, close to $4.99 on other platforms)
- Pro lifetime: $69.99 (maintains margin after Apple's 30% cut)
- Alternative: Consider Apple's Small Business Program (15% commission for developers earning under $1M/year)

---

## Implementation Priority

| Priority | Component | Agent | Complexity |
|----------|-----------|-------|------------|
| P0 | API compatibility audit & risk assessment | Agent 1 | Low |
| P0 | BrowserAPI abstraction layer design | Agent 1 | Medium |
| P0 | Webpack multi-browser build system | Agent 4 | High |
| P0 | Manifest generation script | Agent 2 | Medium |
| P0 | webextension-polyfill integration | Agent 1 | Medium |
| P1 | Edge port & Add-ons Store submission | Agent 4 | Low |
| P1 | Cross-browser test suite setup | Agent 5 | Medium |
| P1 | GitHub Actions CI/CD pipeline | Agent 5 | Medium |
| P2 | Firefox background script migration | Agent 2 | High |
| P2 | Firefox declarativeNetRequest adaptation | Agent 2 | Medium |
| P2 | Firefox block page/shadow DOM testing | Agent 2 | Medium |
| P2 | AMO submission | Agent 2 | Low |
| P3 | Safari Web Extension conversion | Agent 3 | High |
| P3 | SafariWebExtensionHandler native messaging | Agent 3 | High |
| P3 | iOS Safari extension | Agent 3 | High |
| P3 | App Store IAP integration for Pro | Agent 3 | High |
| P3 | App Store submission | Agent 3 | Medium |
| P4 | Opera sidebar extension | Agent 4 | Low |
| P4 | Brave compatibility testing | Agent 4 | Low |
| P4 | Browser-specific bug database maintenance | Agent 5 | Low |

### Priority Definitions

- **P0 — Infrastructure (Week 1-2).** Build system, API abstraction layer, and polyfill integration must be complete before any porting begins. This is the foundation that all browser ports build on.

- **P1 — Edge + CI/CD (Week 2-3).** Edge requires minimal code changes (same Chromium engine) and validates the multi-browser build system. CI/CD pipeline ensures all future ports are automatically built and tested.

- **P2 — Firefox (Week 3-5).** First real porting challenge: background script migration, declarativeNetRequest adaptation, and AMO submission. Firefox's privacy-focused user base aligns well with Focus Mode - Blocker's local-only data model.

- **P3 — Safari (Week 5-10).** Highest complexity but highest per-user revenue. iOS Safari extension opens the mobile market. Requires Xcode, native messaging, and Apple IAP for Pro features.

- **P4 — Remaining Browsers (Ongoing).** Opera, Brave, Vivaldi, and Arc are Chromium-based and mostly work out of the box. Submit as time allows.

---

## Document Map

```
docs/
├── 16-cross-browser-porter.md                            <- THIS FILE
└── cross-browser/
    ├── agent1-browser-landscape-api-compatibility.md      <- Browser landscape & API audit
    ├── agent2-manifest-firefox-porting.md                 <- Manifest generation & Firefox porting
    ├── agent3-safari-porting.md                           <- Safari/iOS porting guide
    ├── agent4-chromium-browsers-build-system.md           <- Edge/Brave/Opera & build system
    └── agent5-testing-cicd-integration.md                 <- Testing matrix & CI/CD pipeline
```

---

*Phase 16 — Cross-Browser Porter — Complete*
