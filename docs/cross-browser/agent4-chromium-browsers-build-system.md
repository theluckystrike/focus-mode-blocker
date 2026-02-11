# Focus Mode - Blocker: Chromium Browser Ports & Multi-Browser Build System

> **Extension:** Focus Mode - Blocker v1.0.0
> **Phase:** 16 (Cross-Browser Porter) -- Agent 4
> **Date:** February 11, 2026
> **Scope:** Edge, Brave, Opera, Vivaldi, Arc porting + unified multi-browser build system
> **Input:** Phases 01-15, particularly Phase 12 (MV3 Architecture) and Phase 05 (Debugging Protocol)

---

## Table of Contents

- [1. Edge Porting](#1-edge-porting)
  - [1.1 Compatibility Assessment](#11-compatibility-assessment)
  - [1.2 Edge-Specific APIs](#12-edge-specific-apis)
  - [1.3 Enterprise Deployment](#13-enterprise-deployment)
  - [1.4 Edge Add-ons Store Submission](#14-edge-add-ons-store-submission)
  - [1.5 Edge-Specific Quirks](#15-edge-specific-quirks)
- [2. Brave Porting](#2-brave-porting)
  - [2.1 Compatibility Assessment](#21-compatibility-assessment)
  - [2.2 Brave Shields Interaction](#22-brave-shields-interaction)
  - [2.3 Privacy and Analytics Considerations](#23-privacy-and-analytics-considerations)
  - [2.4 Distribution Strategy](#24-distribution-strategy)
- [3. Opera Porting](#3-opera-porting)
  - [3.1 Compatibility Assessment](#31-compatibility-assessment)
  - [3.2 Opera Sidebar Extensions](#32-opera-sidebar-extensions)
  - [3.3 Opera GX Considerations](#33-opera-gx-considerations)
  - [3.4 Opera Add-ons Submission](#34-opera-add-ons-submission)
- [4. Vivaldi, Arc, and Other Chromium Browsers](#4-vivaldi-arc-and-other-chromium-browsers)
  - [4.1 General Chromium Compatibility](#41-general-chromium-compatibility)
  - [4.2 Browser-Specific Notes](#42-browser-specific-notes)
  - [4.3 Testing Strategy for Long-Tail Browsers](#43-testing-strategy-for-long-tail-browsers)
- [5. Multi-Browser Build System](#5-multi-browser-build-system)
  - [5.1 Current State and Migration Path](#51-current-state-and-migration-path)
  - [5.2 Project Structure Reorganization](#52-project-structure-reorganization)
  - [5.3 Webpack Configuration for Multi-Browser Builds](#53-webpack-configuration-for-multi-browser-builds)
  - [5.4 Alternative: Rollup Configuration](#54-alternative-rollup-configuration)
  - [5.5 Manifest Generator](#55-manifest-generator)
  - [5.6 Package.json Scripts](#56-packagejson-scripts)
  - [5.7 Packaging Script](#57-packaging-script)
- [6. Browser-Specific Code Patterns](#6-browser-specific-code-patterns)
  - [6.1 Conditional Imports and DefinePlugin Constants](#61-conditional-imports-and-defineplugin-constants)
  - [6.2 Cross-Browser API Abstraction Layer](#62-cross-browser-api-abstraction-layer)
  - [6.3 Migrating Vanilla JS to Bundler-Compatible Modules](#63-migrating-vanilla-js-to-bundler-compatible-modules)
- [7. Store Comparison and Submission Strategy](#7-store-comparison-and-submission-strategy)
  - [7.1 Store Comparison Table](#71-store-comparison-table)
  - [7.2 Submission Order and Timeline](#72-submission-order-and-timeline)
  - [7.3 Version Management Across Stores](#73-version-management-across-stores)

---

## 1. Edge Porting

### 1.1 Compatibility Assessment

Microsoft Edge has been Chromium-based since January 2020 (Edge 79+). For Focus Mode - Blocker, this means near-complete API compatibility with zero code changes required for core functionality.

**API compatibility matrix for Focus Mode - Blocker's permissions:**

| Chrome API | Edge Support | Notes |
|---|---|---|
| `chrome.declarativeNetRequest` | Full support | Rules, dynamic rules, session rules all work identically |
| `chrome.storage.local` | Full support | Same 10MB quota |
| `chrome.storage.sync` | Full support | Syncs via Microsoft account instead of Google account |
| `chrome.storage.session` | Full support | Edge 102+ |
| `chrome.alarms` | Full support | Same 30-second minimum interval |
| `chrome.notifications` | Full support | Uses Windows notification center on Windows |
| `chrome.scripting` | Full support | `executeScript`, `registerContentScripts` all work |
| `chrome.offscreen` | Full support | Edge 109+ |
| `chrome.action` | Full support | Popup, badge text, icon all identical |
| `chrome.contextMenus` | Full support | No differences |
| `chrome.tabs` | Full support | No differences |
| `chrome.identity` | Partial | Uses Microsoft identity provider, not Google. Pro auth flow needs adaptation |

**Verdict:** Focus Mode - Blocker's Chrome MV3 build runs on Edge with no modifications for free-tier functionality. Pro tier's `chrome.identity`-based Google OAuth needs a conditional path for Microsoft account authentication, or we bypass `chrome.identity` entirely and use our own OAuth flow via the Zovo API (recommended).

### 1.2 Edge-Specific APIs

Edge exposes several APIs that Chrome does not, offering opportunities to differentiate the Edge version of Focus Mode - Blocker:

**Side Panel API (Edge 114+):**
Edge supports the `chrome.sidePanel` API (shared with Chrome 114+), but Edge was early to adopt sidebar-style extensions. Focus Mode - Blocker could use a side panel as an expanded Focus Dashboard:

```json
{
  "side_panel": {
    "default_path": "src/sidepanel/sidepanel.html"
  },
  "permissions": ["sidePanel"]
}
```

The side panel would display the full stats dashboard, active timer with large countdown, Focus Score ring, and streak information -- content that currently requires opening the options page because the popup (380x580px) is too small. This is a Phase 2 enhancement, not a launch requirement.

**Edge-specific considerations for the side panel:**
- Side panel persists while the user browses (unlike the popup which closes on click-away)
- Timer display stays visible during focus sessions -- significant UX improvement
- Focus Score ring can animate in real time
- Users can glance at their stats without interrupting workflow

**Collections API (Edge only):**
Edge has a Collections feature for saving groups of links. There is no extension API for Collections, so no integration opportunity exists here.

### 1.3 Enterprise Deployment

Edge is the default browser on Windows 10/11 corporate environments. Focus Mode - Blocker as an enterprise productivity tool is a compelling positioning, particularly for the Team tier ($3.99/user/mo).

**Microsoft Intune Deployment:**

IT administrators can force-install Focus Mode - Blocker via Intune by adding the extension ID to the `ExtensionInstallForcelist` policy:

```xml
<!-- Intune Configuration Profile (OMA-URI) -->
<!-- Path: ./Device/Vendor/MSFT/Policy/Config/Edge/ExtensionInstallForcelist -->
<enabled/>
<data id="ExtensionInstallForcelist" value="1&#xF000;{EDGE_EXTENSION_ID};https://edge.microsoft.com/extensionwebstorebase/v1/crx"/>
```

**Group Policy Deployment:**

```
Computer Configuration > Administrative Templates > Microsoft Edge > Extensions
> Configure extension management settings

{
  "{EDGE_EXTENSION_ID}": {
    "installation_mode": "force_installed",
    "update_url": "https://edge.microsoft.com/extensionwebstorebase/v1/crx",
    "toolbar_pin": "force_pinned",
    "runtime_blocked_hosts": [],
    "runtime_allowed_hosts": ["*://*/*"]
  }
}
```

**Enterprise-specific features for Focus Mode - Blocker (Team tier):**
- Pre-configured blocklists pushed via managed storage (`chrome.storage.managed`)
- Admin-defined Nuclear Mode schedules (e.g., 9 AM - 12 PM mandatory blocking)
- Aggregated team Focus Score dashboard (via Zovo API, not local data)
- Disable user ability to remove sites from admin-configured blocklist
- Policy-controlled settings via `managed_schema` in manifest:

```json
{
  "managed_schema": "schema/managed-storage-schema.json"
}
```

**Managed storage schema for enterprise deployment:**

```json
{
  "type": "object",
  "properties": {
    "admin_blocklist": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Admin-enforced blocked domains that users cannot remove"
    },
    "enforce_nuclear_schedule": {
      "type": "object",
      "properties": {
        "enabled": { "type": "boolean" },
        "start_time": { "type": "string" },
        "end_time": { "type": "string" },
        "days": { "type": "array", "items": { "type": "string" } }
      }
    },
    "disable_extension_disable": {
      "type": "boolean",
      "description": "Prevent users from disabling the extension"
    }
  }
}
```

### 1.4 Edge Add-ons Store Submission

**Partner Center Account Setup:**

1. Navigate to [Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/overview)
2. Sign in with a Microsoft account (create one if needed -- free)
3. Register as a developer: **$19 one-time fee** (individuals) or free for enterprise accounts
4. Complete identity verification (1-3 business days)
5. Accept the Microsoft Edge Add-ons Developer Agreement

**Submission Checklist for Focus Mode - Blocker:**

| Item | Specification | Status |
|---|---|---|
| Extension package | `.zip` of dist/ (identical to Chrome build) | Build system output |
| Extension name | "Focus Mode - Blocker" | Same as Chrome |
| Short description | 132 characters max | Same as Chrome listing |
| Full description | 16,000 characters max | Adapt Chrome description; mention Edge-specific benefits |
| Icons | 128x128 PNG (required), 300x300 PNG (recommended) | Reuse Chrome assets |
| Screenshots | 1280x800 or 640x400, 1-10 images | Re-capture in Edge for Edge-native look |
| Promotional images | 1400x560 (marquee), 440x280 (small) | Create Edge-branded variants |
| Privacy policy URL | `https://zovo.one/privacy/focus-mode-blocker` | Same URL |
| Support URL | `https://zovo.one/support` | Same URL |
| Categories | Productivity | Same as Chrome |
| Age rating | All ages | Same as Chrome |

**Edge Store Listing Description Adjustments:**

The Chrome description works as-is, but add an Edge-specific paragraph at the top:

```
Designed for Microsoft Edge. Focus Mode - Blocker takes full advantage of Edge's
Manifest V3 engine to block distracting websites at the network level -- before
they even load. Your data stays on your device, synced securely via your
Microsoft account when you enable Pro sync.

Compatible with Edge on Windows, macOS, and Linux.
Enterprise-ready: Deploy via Microsoft Intune or Group Policy for your entire
organization.
```

**Review Timeline:** Edge Add-ons reviews typically take 3-7 business days. Updates to existing listings take 1-3 business days. Edge reviews are generally less strict than Chrome Web Store but still check for policy compliance, especially around permissions and data handling.

### 1.5 Edge-Specific Quirks

**Storage sync behavior:**
`chrome.storage.sync` on Edge syncs through the user's Microsoft account, not Google. This means:
- Users must be signed into Edge with a Microsoft account for sync to work
- Sync quota and limits are the same (102,400 bytes total, 8,192 bytes per item)
- Sync timing may differ slightly from Chrome (Edge batches sync operations differently)
- Focus Mode - Blocker's Pro sync feature (which uses our Zovo API, not `chrome.storage.sync`) is unaffected
- Free tier uses `chrome.storage.local` only, so no impact

**Notification behavior:**
- On Windows, Edge notifications route through Windows Notification Center (Action Center)
- Focus session end notifications appear alongside other Windows notifications
- Users who have Windows Focus Assist / Do Not Disturb enabled will not see our notifications
- Consider adding a visual badge indicator on the extension icon as a fallback notification mechanism (already implemented via `chrome.action.setBadgeText`)

**SmartScreen integration:**
Edge's SmartScreen may flag extension downloads from unknown publishers initially. After sufficient installs and positive reviews, SmartScreen trust increases. This is not a code issue -- it resolves organically with adoption.

**Edge Canary / Dev / Beta channels:**
Test Focus Mode - Blocker on Edge Canary to catch API changes early. Edge Canary typically tracks Chromium Canary within 1-2 weeks.

---

## 2. Brave Porting

### 2.1 Compatibility Assessment

Brave is Chromium-based and supports installing extensions directly from the Chrome Web Store. Users can install Focus Mode - Blocker from CWS without any modification.

**API compatibility for Focus Mode - Blocker:**

| Chrome API | Brave Support | Notes |
|---|---|---|
| `chrome.declarativeNetRequest` | Full support | Works alongside Brave Shields |
| `chrome.storage` (local/sync/session) | Full support | Sync requires Brave Sync chain, not Google account |
| `chrome.alarms` | Full support | No differences |
| `chrome.notifications` | Full support | May be affected by Brave's notification settings |
| `chrome.scripting` | Full support | No differences |
| `chrome.offscreen` | Full support | Brave 109+ |
| `chrome.action` | Full support | No differences |
| `chrome.identity` | Limited | No Google identity integration; Brave does not support `chrome.identity.getAuthToken()` for Google OAuth |

**Verdict:** Focus Mode - Blocker works on Brave out of the box when installed from the Chrome Web Store. No separate build is needed.

### 2.2 Brave Shields Interaction

Brave Shields is Brave's built-in content blocker. It blocks trackers, ads, and optionally third-party cookies and scripts. This creates a specific interaction pattern with Focus Mode - Blocker's `declarativeNetRequest` rules.

**How Brave Shields and Focus Mode - Blocker coexist:**

1. **No conflict with site blocking:** Brave Shields blocks trackers and ads on allowed sites. Focus Mode - Blocker blocks entire sites (redirecting to the block page). These are fundamentally different operations that do not conflict.

2. **Rule execution order:** Brave Shields operates at a lower level than extension `declarativeNetRequest` rules. The practical result:
   - User navigates to `facebook.com` (blocked by Focus Mode - Blocker)
   - Focus Mode - Blocker's DNR redirect rule fires first, redirecting to the block page
   - Brave Shields never sees the Facebook request because the redirect happens at the declarativeNetRequest layer before Shields evaluates it
   - No conflict, no double-blocking, no unexpected behavior

3. **Edge case -- Brave Shields blocking Focus Mode - Blocker's resources:**
   - Brave Shields should not block any of Focus Mode - Blocker's resources because all resources are local (`chrome-extension://` protocol)
   - However, if the Pro tier makes API calls to `api.focusmodeblocker.com`, Brave Shields could theoretically block those requests if they are classified as tracking
   - **Mitigation:** Ensure `api.focusmodeblocker.com` is not on any ad/tracker blocklists. Use first-party subdomain patterns. Add a note in documentation telling Brave users to whitelist the Zovo API domain if they experience Pro sync issues.

4. **Block page behavior:** When Focus Mode - Blocker redirects to its block page (`chrome-extension://{id}/src/pages/blocked/blocked.html`), Brave Shields does not interfere because extension pages are exempt from Shields filtering.

**Testing checklist for Brave Shields interaction:**

- [ ] Verify blocking works with Shields set to Standard
- [ ] Verify blocking works with Shields set to Aggressive
- [ ] Verify block page renders correctly with all Shields settings
- [ ] Verify Zovo API calls succeed with Shields enabled (Pro tier)
- [ ] Verify Stripe checkout flow works with Shields enabled
- [ ] Verify ambient sound playback via offscreen document is unaffected
- [ ] Test Nuclear Mode activation and tamper resistance on Brave

### 2.3 Privacy and Analytics Considerations

Brave users are privacy-conscious by self-selection. Focus Mode - Blocker's privacy-first architecture is a strong selling point for this audience, but there are specific considerations:

**Analytics and telemetry:**
- Brave aggressively blocks tracking scripts and analytics beacons
- Focus Mode - Blocker does not include any third-party analytics in the extension itself (Phase 11 monitoring uses Sentry for error tracking only, loaded from our own domain)
- Sentry error reporting may be blocked by Brave Shields if the Sentry DSN resolves to a known tracking domain. **Mitigation:** Self-host Sentry or use Sentry's tunnel proxy pattern where errors are sent to `api.focusmodeblocker.com/sentry` and our server forwards to Sentry
- No Google Analytics, no Mixpanel, no Amplitude in the extension -- this is already our architecture

**Stripe payment integration:**
- Brave Shields may block Stripe.js if loaded from `js.stripe.com`
- Focus Mode - Blocker's paywall opens a new tab to `zovo.one/checkout/focus-mode-blocker` for Stripe checkout, so the payment happens on our website, not within the extension
- Brave users may need to allow Stripe on the checkout page. Add a small notice on the checkout page: "If the payment form doesn't appear, temporarily disable Brave Shields for this page"
- Alternatively, consider Brave's built-in BAT (Basic Attention Token) as a future payment method for crypto-forward users (low priority, Phase 3+)

**Browser detection for Brave:**
Brave identifies as Chrome in the user agent string but can be detected via:

```javascript
// Detect Brave browser
async function isBrave() {
  return (navigator.brave && await navigator.brave.isBrave()) || false;
}
```

Use this detection sparingly -- only for:
- Showing Brave-specific help text on the checkout page
- Adjusting Sentry error reporting to use our tunnel proxy
- Displaying Brave Shields compatibility notes in the options page troubleshooting section

Do NOT use this for differential feature gating or analytics segmentation (Brave users would consider that a privacy violation).

### 2.4 Distribution Strategy

**Do we need a separate Brave listing?**

No. Brave installs extensions directly from the Chrome Web Store. Creating a separate listing would:
- Split review counts and ratings
- Create version management overhead
- Provide zero additional reach (Brave users already browse CWS)

**Recommended approach:**
1. List on Chrome Web Store only (Brave users install from there)
2. Add "Works with Brave" to the Chrome Web Store description
3. Add a Brave-specific FAQ entry on `zovo.one/support` addressing Shields compatibility
4. If Brave ever launches its own extension store, evaluate listing there at that time

---

## 3. Opera Porting

### 3.1 Compatibility Assessment

Opera is Chromium-based (since Opera 15 in 2013) and supports Chrome extensions. However, Opera has its own extension store and some unique APIs.

**API compatibility for Focus Mode - Blocker:**

| Chrome API | Opera Support | Notes |
|---|---|---|
| `chrome.declarativeNetRequest` | Full support | Opera 86+ (Chromium 100+) |
| `chrome.storage` | Full support | Sync uses Opera account |
| `chrome.alarms` | Full support | No differences |
| `chrome.notifications` | Full support | Uses OS notification system |
| `chrome.scripting` | Full support | No differences |
| `chrome.offscreen` | Full support | Opera 95+ |
| `chrome.action` | Full support | No differences |
| `chrome.identity` | Limited | Does not support Google OAuth via `chrome.identity.getAuthToken()` |

**Opera-specific limitation:** Opera blocks `chrome.identity.getAuthToken()` because it uses its own identity system. Focus Mode - Blocker's Pro authentication must use the Zovo API OAuth flow (same solution as Brave and Edge).

**Install from Chrome Web Store:** Opera users can enable "Install Chrome Extensions" in Opera's settings, which allows direct CWS installation. However, Opera shows a warning banner: "This extension is not from Opera add-ons. It might not work as expected." This creates friction. A native Opera Add-ons listing eliminates this warning.

### 3.2 Opera Sidebar Extensions

Opera's sidebar is a distinctive feature. Extensions can register a sidebar panel that appears alongside the browser's built-in sidebar items (Messenger, WhatsApp, Telegram, etc.).

**Sidebar panel for Focus Mode - Blocker:**

Opera supports `opr.sidebarAction` API for sidebar panels:

```json
{
  "sidebar_action": {
    "default_title": "Focus Mode",
    "default_panel": "src/sidebar/sidebar.html",
    "default_icon": {
      "16": "src/assets/icons/icon-16.png",
      "32": "src/assets/icons/icon-32.png"
    }
  }
}
```

This is similar to the Edge side panel opportunity. The sidebar would display:
- Active session timer (persistent, visible while browsing)
- Quick block/unblock for current site
- Focus Score ring with real-time updates
- Today's stats summary
- Quick-start session button

**Implementation consideration:** The sidebar panel would be an Opera-specific feature, gated behind `if (__BROWSER__ === 'opera')` in the manifest generator. The sidebar HTML/JS can reuse 90% of the popup codebase with a wider layout. This is a Phase 2 enhancement.

### 3.3 Opera GX Considerations

Opera GX is a gaming-oriented browser with built-in resource limiters ("GX Control") for CPU, RAM, and network bandwidth. It has a distinct dark-themed UI and a younger demographic.

**Competitive opportunity:**
Opera GX's "GX Control" limits resources but does NOT block distracting websites. There is no built-in focus/blocking feature in Opera GX. Focus Mode - Blocker fills this gap directly.

**GX-specific considerations:**
- Opera GX users trend younger (18-30, gamers) and respond well to gamification. Focus Mode - Blocker's Focus Score, streaks, and achievements align perfectly with this audience.
- Opera GX's forced dark theme means Focus Mode - Blocker should detect and respect dark mode. Our extension already supports dark mode via `prefers-color-scheme` (Phase 08 branding spec).
- Opera GX has "GX Corner" -- a news/deals page. We cannot integrate with this, but our block page motivational quotes and stats serve a similar engagement function.
- Opera GX Mod store is separate from Opera Add-ons. GX Mods are themes/sounds, not extensions. Focus Mode - Blocker is an extension, not a Mod.

**Marketing angle for Opera GX:**
Position Focus Mode - Blocker as "the focus extension for gamers" in Opera GX contexts. Emphasize:
- Level up your focus (gamification language)
- Nuclear Mode = boss-mode distraction blocking
- Focus Score = your focus KDA (gaming metaphor)
- Streak tracking = daily login rewards mentality

### 3.4 Opera Add-ons Submission

**Developer Account Setup:**

1. Navigate to [Opera Add-ons Developer Portal](https://addons.opera.com/developer/)
2. Sign in with an Opera account (free to create)
3. No registration fee
4. Accept the Opera Add-ons Terms of Service

**Submission process:**

1. Upload the `.zip` or `.crx` file (same Chrome build works)
2. Fill in metadata:
   - Name: "Focus Mode - Blocker"
   - Category: Productivity
   - Description: Same as Chrome, with Opera-specific notes about sidebar support (if implemented)
   - Screenshots: Re-capture in Opera for native look
   - Icons: Same as Chrome (128x128 required)
3. Declare permissions and justify each one
4. Submit for review

**Review timeline:** Opera Add-ons reviews take 3-10 business days for new submissions. Updates are typically reviewed within 1-5 business days. Opera's review team is smaller than Chrome's, so expect longer waits during holiday periods.

**Opera store listing adaptation:**

Add to the description:
```
Designed for Opera and Opera GX. Focus Mode - Blocker uses Manifest V3 to block
distracting websites at the network level. Compatible with Opera's sidebar for
quick access to your focus dashboard.

Gamers: Use Nuclear Mode to lock yourself out of distractions during ranked
matches. Your Focus Score tracks how well you stay in the zone.
```

---

## 4. Vivaldi, Arc, and Other Chromium Browsers

### 4.1 General Chromium Compatibility

All Chromium-based browsers inherit Chrome's extension API surface. Focus Mode - Blocker's MV3 build works on any Chromium browser that supports Manifest V3 (Chromium 88+, but realistically 102+ for `chrome.storage.session` and 109+ for `chrome.offscreen`).

**Minimum Chromium version for Focus Mode - Blocker:** 116 (matching our `target: 'es2022'` build setting and full API surface).

**Universal compatibility rules:**
- `chrome.*` namespace is available in all Chromium browsers
- `declarativeNetRequest` works identically across all Chromium browsers
- `chrome.storage.local` and `chrome.storage.session` work identically
- `chrome.alarms`, `chrome.notifications`, `chrome.scripting` all work identically
- The only divergence point is `chrome.identity` (each browser has its own identity provider)

### 4.2 Browser-Specific Notes

**Vivaldi:**
- Chromium-based, supports Chrome extensions via CWS
- No separate extension store (users install from Chrome Web Store)
- Vivaldi has built-in ad/tracker blocking, similar to Brave Shields interaction -- no conflict with Focus Mode - Blocker's site blocking
- Vivaldi's Web Panels feature (sidebar) could host Focus Mode - Blocker's options page as a persistent panel, but this is a user-configured feature, not something we control programmatically
- No known API incompatibilities
- Vivaldi-specific user agent: can be detected but should not be used for feature gating

**Arc (The Browser Company):**
- Chromium-based, supports Chrome extensions via CWS
- Arc has "Boosts" (custom CSS/JS for websites) which could conflict with Focus Mode - Blocker's content scripts in theory, but in practice Boosts run after extension content scripts and operate on different DOM elements
- Arc's "Spaces" feature (workspace separation) is independent of extension state -- Focus Mode - Blocker's blocklist applies across all Spaces
- Arc does not have its own extension store
- Known quirk: Arc's sidebar-focused UI means the popup opens differently (as a small window rather than anchored to the toolbar). Test popup dimensions and positioning on Arc.
- Arc's "Little Arc" windows may not trigger content script injection on `document_start` for very fast navigations. Test blocking reliability in Little Arc mini-browser.

**Samsung Internet (Android, Chromium-based):**
- Supports a limited set of extension APIs via Samsung's own extension system
- Does NOT support full Chrome MV3 extensions
- Not a target for Focus Mode - Blocker at this time

**Yandex Browser:**
- Chromium-based, has its own extension store
- Supports Chrome extensions but review process is in Russian
- Relevant for Russian market (Phase 15 i18n P2 locale)
- Low priority -- evaluate after P2 locale launch

### 4.3 Testing Strategy for Long-Tail Browsers

We cannot test Focus Mode - Blocker on every Chromium browser. Adopt a tiered testing approach:

**Tier 1 (Full test suite, every release):**
- Chrome (primary target)
- Edge (enterprise market, second-largest Chromium browser)

**Tier 2 (Core functionality smoke test, every release):**
- Brave (privacy-focused audience, significant market share)
- Opera (separate store listing)
- Firefox (separate build, covered in other agent docs)

**Tier 3 (Quarterly smoke test):**
- Vivaldi
- Arc
- Opera GX (if distinct from Opera testing)

**Tier 4 (Community-reported issues only):**
- Yandex Browser
- Samsung Internet
- Naver Whale
- Any other Chromium forks

**Smoke test checklist (Tier 2-3):**

1. Install Focus Mode - Blocker from CWS (or load unpacked)
2. Add 3 sites to blocklist
3. Verify sites are blocked and redirect to block page
4. Start a Pomodoro session, verify timer ticks
5. Verify Focus Score displays on block page
6. Verify notifications fire at session end
7. Verify ambient sound playback via offscreen document
8. Verify Nuclear Mode engages and cannot be bypassed
9. Verify popup renders correctly (dimensions, layout, interactions)
10. Verify options page loads and settings persist after browser restart

---

## 5. Multi-Browser Build System

### 5.1 Current State and Migration Path

**Current state:** Focus Mode - Blocker is built with vanilla JavaScript and no bundler. The `manifest.json` is a single Chrome-targeted file. The Vite and Webpack configurations documented in Phase 12 (`docs/mv3-architecture/agent4-build-migration.md`) describe the planned build system for the Chrome-only build.

**Migration path to multi-browser builds:**

Phase 12's Vite configuration handles Chrome builds with a single manifest. To support Edge, Firefox, Safari, and Opera, we need:
1. A manifest generator that merges a base manifest with browser-specific overlays
2. Build-time constants (`__BROWSER__`, `__MV__`) injected via DefinePlugin/define
3. Browser-specific entry in the build command (`--env browser=chrome|edge|firefox|safari|opera`)
4. Separate dist output directories per browser
5. Packaging scripts that produce store-ready ZIPs for each target

### 5.2 Project Structure Reorganization

Reorganize from the current flat structure to a multi-browser-aware layout:

```
focus-mode-blocker/
├── src/
│   ├── background/
│   │   ├── service-worker.ts          # Entry point
│   │   ├── alarm-manager.ts
│   │   ├── blocking-engine.ts
│   │   ├── focus-session.ts
│   │   ├── message-router.ts
│   │   ├── nuclear-mode.ts
│   │   ├── rule-compiler.ts
│   │   ├── schedule-engine.ts
│   │   ├── state-manager.ts
│   │   ├── stats-aggregator.ts
│   │   └── ... (18 modules as defined in Phase 12)
│   │
│   ├── content/
│   │   ├── detector.ts
│   │   ├── blocker.ts
│   │   └── tracker.ts
│   │
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.ts
│   │   ├── popup.css
│   │   └── components/
│   │
│   ├── options/
│   │   ├── options.html
│   │   ├── options.ts
│   │   ├── options.css
│   │   └── tabs/
│   │
│   ├── pages/
│   │   ├── blocked/
│   │   └── onboarding/
│   │
│   ├── shared/                         # Cross-browser abstraction layer
│   │   ├── browser-api.ts              # Unified chrome/browser API wrapper
│   │   ├── browser-detect.ts           # Runtime browser detection
│   │   ├── constants.ts
│   │   ├── logger.ts
│   │   ├── message-helpers.ts
│   │   ├── storage-helpers.ts
│   │   ├── url-utils.ts
│   │   ├── time-utils.ts
│   │   ├── validators.ts
│   │   └── types/
│   │
│   ├── paywall/
│   │   ├── paywall.html
│   │   ├── paywall.ts
│   │   └── paywall.css
│   │
│   ├── sidebar/                        # Opera/Edge side panel (Phase 2)
│   │   ├── sidebar.html
│   │   ├── sidebar.ts
│   │   └── sidebar.css
│   │
│   ├── assets/
│   │   ├── icons/
│   │   ├── images/
│   │   └── sounds/
│   │
│   └── _locales/
│       ├── en/messages.json
│       ├── es/messages.json
│       ├── fr/messages.json
│       ├── de/messages.json
│       ├── ja/messages.json
│       └── pt_BR/messages.json
│
├── manifests/                          # Browser-specific manifest overlays
│   ├── base.json                       # Shared manifest fields
│   ├── chrome.json                     # Chrome-specific overrides
│   ├── edge.json                       # Edge-specific overrides
│   ├── firefox.json                    # Firefox-specific overrides (MV2 adaptations)
│   ├── safari.json                     # Safari-specific overrides
│   └── opera.json                      # Opera-specific overrides
│
├── scripts/
│   ├── generate-manifest.js            # Deep-merge base + browser overlay
│   ├── build.ts                        # Multi-browser build orchestrator
│   ├── package-extension.ts            # ZIP creation per browser
│   ├── dev.ts                          # Dev server with reload
│   ├── validate-manifest.ts
│   ├── validate-csp.ts
│   ├── check-bundle-size.ts
│   ├── bump-version.ts
│   └── release.ts
│
├── rules/
│   ├── static-rules.json
│   └── rule-schema.json
│
├── dist/                               # Build output (gitignored)
│   ├── chrome/
│   ├── edge/
│   ├── firefox/
│   ├── safari/
│   └── opera/
│
├── packages/                           # Store-ready ZIPs (gitignored)
│   ├── focus-mode-blocker-chrome-1.0.0.zip
│   ├── focus-mode-blocker-edge-1.0.0.zip
│   ├── focus-mode-blocker-firefox-1.0.0.xpi
│   ├── focus-mode-blocker-safari-1.0.0.zip
│   └── focus-mode-blocker-opera-1.0.0.zip
│
├── webpack.config.js                   # Multi-browser Webpack config
├── vite.config.ts                      # Multi-browser Vite config (alternative)
├── tsconfig.json
├── package.json
└── .eslintrc.cjs
```

### 5.3 Webpack Configuration for Multi-Browser Builds

This extends Phase 12's Webpack configuration with browser-targeting via `--env browser=`:

```javascript
// webpack.config.js
// Focus Mode - Blocker: Multi-browser Webpack 5 configuration
// Usage: npx webpack --env browser=chrome --mode production
//        npx webpack --env browser=firefox --mode production
//        npx webpack --env browser=edge --mode production

const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { DefinePlugin } = require('webpack');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const { execSync } = require('child_process');

const pkg = require('./package.json');

// Browser-specific manifest version mapping
const BROWSER_MV = {
  chrome: 3,
  edge: 3,
  opera: 3,
  brave: 3,   // Uses Chrome build
  firefox: 2, // Firefox MV2 (until Firefox MV3 is stable)
  safari: 3,  // Safari MV3 via Xcode conversion
};

module.exports = (env, argv) => {
  const browser = env?.browser || 'chrome';
  const isProd = argv.mode === 'production';
  const analyze = env?.analyze === 'true';
  const mv = BROWSER_MV[browser] || 3;

  // Firefox uses 'browser' namespace; all Chromium browsers use 'chrome'
  const apiNamespace = browser === 'firefox' ? 'browser' : 'chrome';

  // Output directory per browser
  const outputDir = path.resolve(__dirname, 'dist', browser);

  console.log(`\n  Building Focus Mode - Blocker for ${browser} (MV${mv})\n`);

  // Generate the merged manifest for this browser
  execSync(
    `node scripts/generate-manifest.js --browser=${browser} --version=${pkg.version}`,
    { stdio: 'inherit' }
  );

  // -------------------------------------------------------------------------
  // Entry points
  // -------------------------------------------------------------------------
  const entry = {
    'background/service-worker': './src/background/service-worker.ts',
    'content/detector': './src/content/detector.ts',
    'content/blocker': './src/content/blocker.ts',
    'content/tracker': './src/content/tracker.ts',
    'popup/popup': './src/popup/popup.ts',
    'options/options': './src/options/options.ts',
    'pages/blocked': './src/pages/blocked/blocked.ts',
    'pages/onboarding': './src/pages/onboarding/onboarding.ts',
  };

  // Firefox MV2 uses background scripts, not service worker
  if (browser === 'firefox') {
    delete entry['background/service-worker'];
    entry['background/background'] = './src/background/service-worker.ts';
  }

  // Opera: add sidebar entry if sidebar source exists
  if (browser === 'opera') {
    entry['sidebar/sidebar'] = './src/sidebar/sidebar.ts';
  }

  return {
    entry,

    output: {
      path: outputDir,
      filename: '[name].js',
      clean: true,
    },

    resolve: {
      extensions: ['.ts', '.js', '.json'],
      alias: {
        '@background': path.resolve(__dirname, 'src/background'),
        '@content': path.resolve(__dirname, 'src/content'),
        '@popup': path.resolve(__dirname, 'src/popup'),
        '@options': path.resolve(__dirname, 'src/options'),
        '@pages': path.resolve(__dirname, 'src/pages'),
        '@shared': path.resolve(__dirname, 'src/shared'),
        '@assets': path.resolve(__dirname, 'src/assets'),
        '@sidebar': path.resolve(__dirname, 'src/sidebar'),
      },
    },

    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, 'css-loader'],
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif|mp3|wav|ogg)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/[name][ext]',
          },
        },
      ],
    },

    plugins: [
      // Compile-time constants for browser-specific code paths
      new DefinePlugin({
        '__DEV__': JSON.stringify(!isProd),
        '__VERSION__': JSON.stringify(pkg.version),
        '__BROWSER__': JSON.stringify(browser),
        '__MV__': JSON.stringify(mv),
        '__API_NS__': JSON.stringify(apiNamespace),
        'process.env.SENTRY_DSN': JSON.stringify(process.env.SENTRY_DSN || ''),
        'process.env.STRIPE_KEY': JSON.stringify(process.env.STRIPE_KEY || ''),
        'process.env.API_URL': JSON.stringify(
          process.env.API_URL || 'https://api.focusmodeblocker.com'
        ),
      }),

      new MiniCssExtractPlugin({
        filename: '[name].css',
      }),

      // HTML pages
      new HtmlWebpackPlugin({
        template: './src/popup/popup.html',
        filename: 'popup/popup.html',
        chunks: ['popup/popup'],
        inject: 'body',
      }),
      new HtmlWebpackPlugin({
        template: './src/options/options.html',
        filename: 'options/options.html',
        chunks: ['options/options'],
        inject: 'body',
      }),
      new HtmlWebpackPlugin({
        template: './src/pages/blocked/blocked.html',
        filename: 'pages/blocked.html',
        chunks: ['pages/blocked'],
        inject: 'body',
      }),
      new HtmlWebpackPlugin({
        template: './src/pages/onboarding/onboarding.html',
        filename: 'pages/onboarding.html',
        chunks: ['pages/onboarding'],
        inject: 'body',
      }),

      // Copy static assets
      new CopyWebpackPlugin({
        patterns: [
          // Merged manifest (generated by generate-manifest.js)
          {
            from: `manifests/.generated/${browser}-manifest.json`,
            to: 'manifest.json',
          },
          // Locales
          { from: 'src/_locales', to: '_locales' },
          // DNR rules (not needed for Firefox MV2 -- but included for simplicity)
          { from: 'rules', to: 'rules' },
          // Icons
          { from: 'src/assets/icons', to: 'assets/icons' },
          // Images
          { from: 'src/assets/images', to: 'assets/images' },
          // Sounds
          { from: 'src/assets/sounds', to: 'assets/sounds' },
        ],
      }),

      ...(analyze
        ? [new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            reportFilename: `../../bundle-report-${browser}.html`,
            openAnalyzer: false,
          })]
        : []),
    ],

    optimization: {
      minimize: isProd,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: isProd,
              drop_debugger: true,
              pure_funcs: ['console.debug', 'console.trace'],
              passes: 2,
            },
            mangle: {
              reserved: ['chrome', 'browser'],
            },
            format: {
              comments: false,
            },
          },
          extractComments: false,
        }),
      ],
      splitChunks: {
        cacheGroups: {
          shared: {
            test: /[\\/]src[\\/]shared[\\/]/,
            name: 'shared/shared-utils',
            chunks(chunk) {
              return (
                chunk.name?.includes('popup') ||
                chunk.name?.includes('options') ||
                chunk.name?.includes('pages') ||
                chunk.name?.includes('sidebar')
              );
            },
            minSize: 0,
            minChunks: 2,
          },
        },
      },
    },

    devtool: isProd ? 'hidden-source-map' : 'cheap-module-source-map',

    watchOptions: {
      ignored: /node_modules|dist|packages/,
      poll: 1000,
    },

    performance: {
      hints: isProd ? 'error' : 'warning',
      maxEntrypointSize: 150 * 1024,
      maxAssetSize: 150 * 1024,
    },

    node: false,
  };
};
```

### 5.4 Alternative: Rollup Configuration

Rollup is lighter-weight than Webpack and integrates naturally with Vite (Vite uses Rollup under the hood). For teams that prefer Rollup directly:

```javascript
// rollup.config.js
// Focus Mode - Blocker: Multi-browser Rollup configuration
// Usage: BROWSER=chrome rollup -c --environment PROD
//        BROWSER=firefox rollup -c

import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import copy from 'rollup-plugin-copy';
import css from 'rollup-plugin-css-only';
import html from '@rollup/plugin-html';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const browser = process.env.BROWSER || 'chrome';
const isProd = process.env.PROD === 'true';
const mv = browser === 'firefox' ? 2 : 3;

const sharedPlugins = [
  resolve({ browser: true }),
  commonjs(),
  typescript({ tsconfig: './tsconfig.json' }),
  replace({
    preventAssignment: true,
    values: {
      '__DEV__': JSON.stringify(!isProd),
      '__VERSION__': JSON.stringify(pkg.version),
      '__BROWSER__': JSON.stringify(browser),
      '__MV__': JSON.stringify(mv),
      'process.env.SENTRY_DSN': JSON.stringify(process.env.SENTRY_DSN || ''),
      'process.env.STRIPE_KEY': JSON.stringify(process.env.STRIPE_KEY || ''),
      'process.env.API_URL': JSON.stringify(
        process.env.API_URL || 'https://api.focusmodeblocker.com'
      ),
    },
  }),
  ...(isProd ? [terser({
    compress: { drop_console: true, passes: 2 },
    mangle: { reserved: ['chrome', 'browser'] },
  })] : []),
];

const outputDir = `dist/${browser}`;

export default [
  // Service worker / background script
  {
    input: 'src/background/service-worker.ts',
    output: {
      file: `${outputDir}/background/service-worker.js`,
      format: browser === 'firefox' ? 'iife' : 'es',
      sourcemap: isProd ? 'hidden' : true,
    },
    plugins: sharedPlugins,
  },

  // Content scripts (each standalone, IIFE format)
  ...['detector', 'blocker', 'tracker'].map(name => ({
    input: `src/content/${name}.ts`,
    output: {
      file: `${outputDir}/content/${name}.js`,
      format: 'iife',
      sourcemap: isProd ? 'hidden' : true,
    },
    plugins: sharedPlugins,
  })),

  // Popup
  {
    input: 'src/popup/popup.ts',
    output: {
      file: `${outputDir}/popup/popup.js`,
      format: 'iife',
      sourcemap: isProd ? 'hidden' : true,
    },
    plugins: [
      ...sharedPlugins,
      css({ output: 'popup.css' }),
      copy({
        targets: [
          { src: 'src/popup/popup.html', dest: `${outputDir}/popup/` },
          { src: `manifests/.generated/${browser}-manifest.json`, dest: outputDir, rename: 'manifest.json' },
          { src: 'src/_locales', dest: outputDir },
          { src: 'rules', dest: outputDir },
          { src: 'src/assets', dest: outputDir },
        ],
        hook: 'writeBundle',
      }),
    ],
  },

  // Options
  {
    input: 'src/options/options.ts',
    output: {
      file: `${outputDir}/options/options.js`,
      format: 'iife',
      sourcemap: isProd ? 'hidden' : true,
    },
    plugins: [
      ...sharedPlugins,
      css({ output: 'options.css' }),
      copy({ targets: [{ src: 'src/options/options.html', dest: `${outputDir}/options/` }] }),
    ],
  },

  // Block page
  {
    input: 'src/pages/blocked/blocked.ts',
    output: {
      file: `${outputDir}/pages/blocked/blocked.js`,
      format: 'iife',
      sourcemap: isProd ? 'hidden' : true,
    },
    plugins: [
      ...sharedPlugins,
      css({ output: 'blocked.css' }),
      copy({ targets: [{ src: 'src/pages/blocked/blocked.html', dest: `${outputDir}/pages/blocked/` }] }),
    ],
  },

  // Onboarding
  {
    input: 'src/pages/onboarding/onboarding.ts',
    output: {
      file: `${outputDir}/pages/onboarding/onboarding.js`,
      format: 'iife',
      sourcemap: isProd ? 'hidden' : true,
    },
    plugins: [
      ...sharedPlugins,
      css({ output: 'onboarding.css' }),
      copy({ targets: [{ src: 'src/pages/onboarding/onboarding.html', dest: `${outputDir}/pages/onboarding/` }] }),
    ],
  },
];
```

**Webpack vs Rollup for Focus Mode - Blocker multi-browser builds:**

| Aspect | Webpack | Rollup |
|---|---|---|
| Code splitting control | Better (splitChunks config) | Manual (multiple configs) |
| Plugin ecosystem | Larger, more extension-specific plugins | Smaller but growing |
| Config complexity for multi-entry | Single config object | Array of configs |
| Tree shaking | Good (v5+) | Excellent (native) |
| Build speed | Slower | Faster |
| HtmlWebpackPlugin equivalent | Built-in | Requires `@rollup/plugin-html` |

**Recommendation:** Use Webpack for Focus Mode - Blocker. The multi-entry-point configuration is simpler in a single Webpack config than in Rollup's array-of-configs pattern, and Webpack's `CopyWebpackPlugin` + `HtmlWebpackPlugin` handle our static asset and HTML page needs more cleanly.

### 5.5 Manifest Generator

The manifest generator deep-merges `manifests/base.json` with a browser-specific overlay to produce the final manifest for each target browser.

**`manifests/base.json`** -- shared across all browsers:

```json
{
  "name": "__MSG_extension_name__",
  "description": "__MSG_extension_description__",
  "icons": {
    "16": "assets/icons/icon-16.png",
    "32": "assets/icons/icon-32.png",
    "48": "assets/icons/icon-48.png",
    "128": "assets/icons/icon-128.png"
  },
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "assets/icons/icon-16.png",
      "32": "assets/icons/icon-32.png"
    },
    "default_title": "Focus Mode - Blocker"
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
  "optional_permissions": [
    "idle"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "default_locale": "en",
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content/detector.js"],
      "run_at": "document_start",
      "all_frames": false
    }
  ],
  "web_accessible_resources": [
    {
      "resources": [
        "pages/blocked/blocked.html",
        "pages/blocked/blocked.js",
        "pages/blocked/blocked.css",
        "assets/icons/*",
        "assets/images/*"
      ],
      "matches": ["<all_urls>"]
    }
  ]
}
```

**`manifests/chrome.json`:**

```json
{
  "manifest_version": 3,
  "version": "{{VERSION}}",
  "minimum_chrome_version": "116",
  "background": {
    "service_worker": "background/service-worker.js",
    "type": "module"
  },
  "permissions": [
    "offscreen"
  ],
  "optional_permissions": [
    "identity",
    "tabGroups"
  ],
  "declarative_net_request": {
    "rule_resources": [
      {
        "id": "static_prebuilt_social",
        "enabled": false,
        "path": "rules/prebuilt-social.json"
      },
      {
        "id": "static_prebuilt_news",
        "enabled": false,
        "path": "rules/prebuilt-news.json"
      }
    ]
  }
}
```

**`manifests/edge.json`:**

```json
{
  "manifest_version": 3,
  "version": "{{VERSION}}",
  "minimum_chrome_version": "116",
  "background": {
    "service_worker": "background/service-worker.js",
    "type": "module"
  },
  "permissions": [
    "offscreen"
  ],
  "optional_permissions": [
    "identity",
    "tabGroups"
  ],
  "declarative_net_request": {
    "rule_resources": [
      {
        "id": "static_prebuilt_social",
        "enabled": false,
        "path": "rules/prebuilt-social.json"
      },
      {
        "id": "static_prebuilt_news",
        "enabled": false,
        "path": "rules/prebuilt-news.json"
      }
    ]
  }
}
```

**`manifests/opera.json`:**

```json
{
  "manifest_version": 3,
  "version": "{{VERSION}}",
  "minimum_chrome_version": "116",
  "background": {
    "service_worker": "background/service-worker.js",
    "type": "module"
  },
  "permissions": [
    "offscreen"
  ],
  "declarative_net_request": {
    "rule_resources": [
      {
        "id": "static_prebuilt_social",
        "enabled": false,
        "path": "rules/prebuilt-social.json"
      },
      {
        "id": "static_prebuilt_news",
        "enabled": false,
        "path": "rules/prebuilt-news.json"
      }
    ]
  },
  "sidebar_action": {
    "default_title": "Focus Mode",
    "default_panel": "sidebar/sidebar.html",
    "default_icon": {
      "16": "assets/icons/icon-16.png",
      "32": "assets/icons/icon-32.png"
    }
  }
}
```

**`manifests/firefox.json`:**

```json
{
  "manifest_version": 2,
  "version": "{{VERSION}}",
  "background": {
    "scripts": ["background/service-worker.js"],
    "persistent": false
  },
  "browser_action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "assets/icons/icon-16.png",
      "32": "assets/icons/icon-32.png"
    },
    "default_title": "Focus Mode - Blocker"
  },
  "browser_specific_settings": {
    "gecko": {
      "id": "focus-mode-blocker@zovo.one",
      "strict_min_version": "109.0"
    }
  },
  "_remove_keys": [
    "action",
    "host_permissions",
    "declarative_net_request",
    "minimum_chrome_version"
  ],
  "_merge_permissions": [
    "<all_urls>",
    "webRequest",
    "webRequestBlocking"
  ]
}
```

**`manifests/safari.json`:**

```json
{
  "manifest_version": 3,
  "version": "{{VERSION}}",
  "background": {
    "service_worker": "background/service-worker.js",
    "type": "module"
  },
  "permissions": [
    "offscreen"
  ],
  "declarative_net_request": {
    "rule_resources": [
      {
        "id": "static_prebuilt_social",
        "enabled": false,
        "path": "rules/prebuilt-social.json"
      },
      {
        "id": "static_prebuilt_news",
        "enabled": false,
        "path": "rules/prebuilt-news.json"
      }
    ]
  },
  "_remove_keys": [
    "minimum_chrome_version"
  ]
}
```

**`scripts/generate-manifest.js`:**

```javascript
#!/usr/bin/env node
// Focus Mode - Blocker: Manifest generator
// Merges manifests/base.json with manifests/{browser}.json
// Usage: node scripts/generate-manifest.js --browser=chrome --version=1.0.0

const fs = require('fs');
const path = require('path');

// Parse CLI arguments
const args = {};
process.argv.slice(2).forEach(arg => {
  const [key, value] = arg.replace('--', '').split('=');
  args[key] = value;
});

const browser = args.browser || 'chrome';
const version = args.version || '1.0.0';

const baseManifestPath = path.resolve(__dirname, '../manifests/base.json');
const browserManifestPath = path.resolve(__dirname, `../manifests/${browser}.json`);
const outputDir = path.resolve(__dirname, '../manifests/.generated');
const outputPath = path.resolve(outputDir, `${browser}-manifest.json`);

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Load manifests
const base = JSON.parse(fs.readFileSync(baseManifestPath, 'utf-8'));
const overlay = JSON.parse(fs.readFileSync(browserManifestPath, 'utf-8'));

/**
 * Deep merge two objects. Arrays are concatenated (deduplicated).
 * Special keys prefixed with _ are directives, not manifest fields.
 */
function deepMerge(target, source) {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    // Skip directive keys
    if (key.startsWith('_')) continue;

    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key])
    ) {
      // Recursively merge objects
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else if (Array.isArray(source[key]) && Array.isArray(result[key])) {
      // Concatenate arrays and deduplicate
      result[key] = [...new Set([...result[key], ...source[key]])];
    } else {
      // Overwrite scalar values
      result[key] = source[key];
    }
  }

  return result;
}

// Merge base with browser overlay
let manifest = deepMerge(base, overlay);

// Process directives from the overlay
// _remove_keys: Remove specified top-level keys from the merged manifest
if (overlay._remove_keys) {
  for (const key of overlay._remove_keys) {
    delete manifest[key];
  }
}

// _merge_permissions: Add extra permissions to the permissions array
if (overlay._merge_permissions) {
  manifest.permissions = [
    ...new Set([...(manifest.permissions || []), ...overlay._merge_permissions]),
  ];
}

// Firefox MV2: Move host_permissions into permissions array
if (browser === 'firefox' && overlay.manifest_version === 2) {
  if (manifest.host_permissions) {
    manifest.permissions = [
      ...new Set([...(manifest.permissions || []), ...manifest.host_permissions]),
    ];
    delete manifest.host_permissions;
  }

  // Convert web_accessible_resources from MV3 format to MV2 format
  if (manifest.web_accessible_resources) {
    const flatResources = [];
    for (const entry of manifest.web_accessible_resources) {
      if (entry.resources) {
        flatResources.push(...entry.resources);
      }
    }
    manifest.web_accessible_resources = flatResources;
  }
}

// Inject version
manifest.version = version;

// Replace {{VERSION}} placeholders (shouldn't exist after version injection, but just in case)
const manifestStr = JSON.stringify(manifest, null, 2).replace(/\{\{VERSION\}\}/g, version);

// Write output
fs.writeFileSync(outputPath, manifestStr);
console.log(`  Generated ${browser} manifest (MV${manifest.manifest_version}) -> ${outputPath}`);
```

### 5.6 Package.json Scripts

Complete npm scripts for the multi-browser build system:

```jsonc
{
  "scripts": {
    // ---- Development ----
    "dev": "webpack --watch --mode development --env browser=chrome",
    "dev:edge": "webpack --watch --mode development --env browser=edge",
    "dev:firefox": "webpack --watch --mode development --env browser=firefox",
    "dev:opera": "webpack --watch --mode development --env browser=opera",

    // ---- Build (production) ----
    "build": "webpack --mode production --env browser=chrome",
    "build:edge": "webpack --mode production --env browser=edge",
    "build:firefox": "webpack --mode production --env browser=firefox",
    "build:safari": "webpack --mode production --env browser=safari",
    "build:opera": "webpack --mode production --env browser=opera",
    "build:all": "npm run build && npm run build:edge && npm run build:firefox && npm run build:safari && npm run build:opera",
    "build:chromium": "npm run build && npm run build:edge && npm run build:opera",
    "build:analyze": "webpack --mode production --env browser=chrome --env analyze=true",

    // ---- Type checking ----
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch",

    // ---- Linting ----
    "lint": "eslint 'src/**/*.ts' 'scripts/**/*.ts'",
    "lint:fix": "eslint 'src/**/*.ts' 'scripts/**/*.ts' --fix",
    "format": "prettier --write 'src/**/*.{ts,css,html,json}'",
    "format:check": "prettier --check 'src/**/*.{ts,css,html,json}'",

    // ---- Testing ----
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern='tests/unit'",
    "test:e2e": "playwright test",
    "test:e2e:chrome": "BROWSER=chrome playwright test",
    "test:e2e:edge": "BROWSER=edge playwright test",
    "test:e2e:firefox": "BROWSER=firefox playwright test",

    // ---- Validation ----
    "validate": "npm run type-check && npm run lint && npm run test && npm run build:all && npm run validate:manifests",
    "validate:manifests": "node scripts/validate-manifest.js --all",
    "check:size": "node scripts/check-bundle-size.js",

    // ---- Packaging ----
    "package": "npm run build && node scripts/package-extension.js --browser=chrome",
    "package:edge": "npm run build:edge && node scripts/package-extension.js --browser=edge",
    "package:firefox": "npm run build:firefox && node scripts/package-extension.js --browser=firefox",
    "package:safari": "npm run build:safari && node scripts/package-extension.js --browser=safari",
    "package:opera": "npm run build:opera && node scripts/package-extension.js --browser=opera",
    "package:all": "npm run build:all && node scripts/package-extension.js --all",

    // ---- Release ----
    "version:patch": "node scripts/bump-version.js patch",
    "version:minor": "node scripts/bump-version.js minor",
    "version:major": "node scripts/bump-version.js major",
    "release": "npm run validate && npm run package:all",
    "release:dry-run": "npm run validate && npm run package:all -- --dry-run",

    // ---- Store submission ----
    "submit:chrome": "node scripts/submit.js --store=chrome",
    "submit:edge": "node scripts/submit.js --store=edge",
    "submit:firefox": "node scripts/submit.js --store=firefox",
    "submit:opera": "node scripts/submit.js --store=opera",
    "submit:all": "node scripts/submit.js --all",

    // ---- Utilities ----
    "manifest:generate": "node scripts/generate-manifest.js --browser=chrome",
    "manifest:generate:all": "node scripts/generate-manifest.js --all",
    "icons:generate": "node scripts/generate-icons.js",
    "clean": "rm -rf dist packages manifests/.generated",
    "clean:all": "rm -rf dist packages manifests/.generated node_modules coverage"
  }
}
```

### 5.7 Packaging Script

```javascript
#!/usr/bin/env node
// scripts/package-extension.js
// Focus Mode - Blocker: Creates store-ready ZIP packages for each browser
// Usage: node scripts/package-extension.js --browser=chrome
//        node scripts/package-extension.js --all

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const pkg = require('../package.json');

const BROWSERS = ['chrome', 'edge', 'firefox', 'safari', 'opera'];

// Parse arguments
const args = {};
process.argv.slice(2).forEach(arg => {
  const [key, value] = arg.replace('--', '').split('=');
  args[key] = value || true;
});

const browsers = args.all ? BROWSERS : [args.browser || 'chrome'];
const dryRun = args['dry-run'] === true;

const packagesDir = path.resolve(__dirname, '../packages');
if (!fs.existsSync(packagesDir)) {
  fs.mkdirSync(packagesDir, { recursive: true });
}

async function packageBrowser(browser) {
  const distDir = path.resolve(__dirname, '../dist', browser);

  if (!fs.existsSync(distDir)) {
    console.error(`  ERROR: dist/${browser}/ does not exist. Run "npm run build:${browser}" first.`);
    process.exit(1);
  }

  const extension = browser === 'firefox' ? 'xpi' : 'zip';
  const filename = `focus-mode-blocker-${browser}-${pkg.version}.${extension}`;
  const outputPath = path.resolve(packagesDir, filename);

  if (dryRun) {
    console.log(`  [DRY RUN] Would create ${filename}`);
    return;
  }

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      const sizeKB = (archive.pointer() / 1024).toFixed(1);
      console.log(`  ${filename} (${sizeKB} KB)`);
      resolve();
    });

    archive.on('error', reject);
    archive.pipe(output);

    // Add all files from dist/{browser}/
    archive.directory(distDir, false);

    archive.finalize();
  });
}

async function main() {
  console.log(`\n  Packaging Focus Mode - Blocker v${pkg.version}\n`);

  for (const browser of browsers) {
    await packageBrowser(browser);
  }

  console.log(`\n  Packages written to packages/\n`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
```

---

## 6. Browser-Specific Code Patterns

### 6.1 Conditional Imports and DefinePlugin Constants

The build system injects `__BROWSER__` and `__MV__` as compile-time constants. Use these for browser-specific code paths that are tree-shaken in production:

```typescript
// src/shared/constants.ts

// These constants are replaced at build time by Webpack DefinePlugin.
// Dead code is eliminated by Terser in production builds.
declare const __BROWSER__: 'chrome' | 'edge' | 'firefox' | 'safari' | 'opera';
declare const __MV__: 2 | 3;
declare const __DEV__: boolean;

// Example: Browser-specific OAuth configuration
export function getAuthConfig() {
  if (__BROWSER__ === 'chrome') {
    return {
      provider: 'google',
      useIdentityAPI: true,
      clientId: 'CHROME_OAUTH_CLIENT_ID.apps.googleusercontent.com',
    };
  }

  if (__BROWSER__ === 'edge') {
    return {
      provider: 'microsoft',
      useIdentityAPI: false, // Use Zovo API OAuth flow instead
      clientId: 'EDGE_AZURE_APP_CLIENT_ID',
    };
  }

  // Firefox, Opera, Safari, Brave: Use Zovo API OAuth flow
  return {
    provider: 'zovo',
    useIdentityAPI: false,
    clientId: null,
  };
}

// Example: MV2 vs MV3 blocking mechanism
export function getBlockingStrategy() {
  if (__MV__ === 3) {
    return 'declarativeNetRequest';
  }
  return 'webRequest'; // Firefox MV2
}

// Example: Opera sidebar support
export function hasSidebarSupport(): boolean {
  return __BROWSER__ === 'opera';
}
```

**How tree-shaking works with `__BROWSER__` constants:**

When building for Chrome, Webpack replaces `__BROWSER__` with `'chrome'`:

```javascript
// Before (source)
if (__BROWSER__ === 'firefox') {
  initWebRequestBlocking();
}

// After DefinePlugin replacement
if ('chrome' === 'firefox') {
  initWebRequestBlocking();
}

// After Terser dead code elimination
// (entire block removed -- 0 bytes in output)
```

This means Firefox-specific code adds zero bytes to the Chrome build, and vice versa.

### 6.2 Cross-Browser API Abstraction Layer

**`src/shared/browser-api.ts`** -- a thin wrapper that normalizes API differences:

```typescript
// src/shared/browser-api.ts
// Focus Mode - Blocker: Cross-browser API abstraction layer
// Wraps chrome.* / browser.* differences so all other modules use a single API.

declare const __BROWSER__: string;
declare const __MV__: number;

// Firefox uses the 'browser' namespace with Promises.
// Chrome uses the 'chrome' namespace with callbacks (and Promises in MV3).
// This layer ensures all calls return Promises.

type BrowserAPI = typeof chrome;

/**
 * Returns the browser extension API namespace.
 * In Firefox, this is `browser`. In all Chromium browsers, this is `chrome`.
 */
export function getAPI(): BrowserAPI {
  if (__BROWSER__ === 'firefox' && typeof browser !== 'undefined') {
    return browser as unknown as BrowserAPI;
  }
  return chrome;
}

// Convenience re-export
export const api = getAPI();

/**
 * Wrapper for chrome.storage.local.get that always returns a Promise.
 */
export async function storageLocalGet<T>(keys: string | string[]): Promise<T> {
  return api.storage.local.get(keys) as Promise<T>;
}

/**
 * Wrapper for chrome.storage.local.set that always returns a Promise.
 */
export async function storageLocalSet(items: Record<string, unknown>): Promise<void> {
  return api.storage.local.set(items);
}

/**
 * Wrapper for chrome.storage.session (MV3 only).
 * Falls back to chrome.storage.local on MV2 (Firefox).
 */
export async function storageSessionGet<T>(keys: string | string[]): Promise<T> {
  if (__MV__ === 3 && api.storage.session) {
    return api.storage.session.get(keys) as Promise<T>;
  }
  // MV2 fallback: prefix keys with '_session_' in local storage
  const prefixedKeys = Array.isArray(keys)
    ? keys.map(k => `_session_${k}`)
    : `_session_${keys}`;
  const result = await api.storage.local.get(prefixedKeys) as Record<string, unknown>;
  const unprefixed: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(result)) {
    unprefixed[k.replace('_session_', '')] = v;
  }
  return unprefixed as T;
}

/**
 * Send a message to the background/service worker.
 */
export async function sendMessage<T>(message: unknown): Promise<T> {
  return api.runtime.sendMessage(message) as Promise<T>;
}

/**
 * Create a DNR rule (MV3) or webRequest rule (MV2).
 * This is the main abstraction for Focus Mode - Blocker's blocking engine.
 */
export async function addBlockingRule(
  domain: string,
  ruleId: number,
  redirectUrl: string,
): Promise<void> {
  if (__MV__ === 3) {
    await api.declarativeNetRequest.updateDynamicRules({
      addRules: [{
        id: ruleId,
        priority: 1,
        action: {
          type: 'redirect' as chrome.declarativeNetRequest.RuleActionType,
          redirect: { url: redirectUrl },
        },
        condition: {
          urlFilter: `||${domain}`,
          resourceTypes: ['main_frame' as chrome.declarativeNetRequest.ResourceType],
        },
      }],
      removeRuleIds: [ruleId],
    });
  } else {
    // Firefox MV2: Use webRequest.onBeforeRequest listener
    // This is handled in the Firefox-specific background script
    // by registering listeners on the domain pattern
    await sendMessage({
      type: 'ADD_BLOCKING_RULE_MV2',
      domain,
      ruleId,
      redirectUrl,
    });
  }
}

/**
 * Create an offscreen document (MV3 only).
 * On MV2, sound playback uses a background page directly.
 */
export async function createOffscreenDocument(url: string, reasons: string[]): Promise<void> {
  if (__MV__ === 3 && api.offscreen) {
    try {
      await (api.offscreen as any).createDocument({
        url,
        reasons,
        justification: 'Ambient sound playback for focus sessions',
      });
    } catch (e: any) {
      // Document may already exist
      if (!e.message?.includes('already exists')) throw e;
    }
  }
  // MV2: No offscreen document needed; background script has DOM access
}
```

### 6.3 Migrating Vanilla JS to Bundler-Compatible Modules

Focus Mode - Blocker currently uses vanilla JS with no module system. To support the multi-browser build system, existing files need to be converted to ES modules with explicit imports/exports.

**Before (current vanilla JS pattern):**

```javascript
// src/background/service-worker.js (current)
// No imports, relies on global scope or chrome.* directly

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    initializeDefaults();
    chrome.tabs.create({ url: 'src/pages/onboarding/onboarding.html' });
  }
});

function initializeDefaults() {
  chrome.storage.local.set({
    blocklist: [],
    settings: { pomodoroLength: 25, breakLength: 5 },
    stats: { totalFocusTime: 0, sitesBlocked: 0 },
    focusScore: 50,
    streak: { current: 0, best: 0 },
  });
}

// ... rest of service worker logic in one large file
```

**After (ES module pattern for bundler):**

```typescript
// src/background/service-worker.ts (new)
import { api } from '@shared/browser-api';
import { initializeDefaults } from './install-handler';
import { registerAlarms } from './alarm-manager';
import { registerMessageRouter } from './message-router';
import { initBlockingEngine } from './blocking-engine';
import { STORAGE_KEYS, PAGES } from '@shared/constants';

// Register top-level event listeners synchronously (MV3 requirement)
api.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await initializeDefaults();
    api.tabs.create({ url: api.runtime.getURL(PAGES.ONBOARDING) });
  }
});

registerAlarms();
registerMessageRouter();
initBlockingEngine();
```

```typescript
// src/background/install-handler.ts (new)
import { storageLocalSet } from '@shared/browser-api';
import { STORAGE_KEYS } from '@shared/constants';

export async function initializeDefaults(): Promise<void> {
  await storageLocalSet({
    [STORAGE_KEYS.BLOCKLIST]: [],
    [STORAGE_KEYS.SETTINGS]: {
      pomodoroLength: 25,
      breakLength: 5,
      soundEnabled: true,
      notificationsEnabled: true,
    },
    [STORAGE_KEYS.STATS]: {
      totalFocusTime: 0,
      sitesBlocked: 0,
      sessionsCompleted: 0,
    },
    [STORAGE_KEYS.FOCUS_SCORE]: 50,
    [STORAGE_KEYS.STREAK]: { current: 0, best: 0, lastActiveDate: null },
    [STORAGE_KEYS.TIER]: 'free',
    [STORAGE_KEYS.SCHEMA_VERSION]: 1,
  });
}
```

**Migration checklist for converting vanilla JS to ES modules:**

1. [ ] Add `export` to every function/class/constant that is used by other files
2. [ ] Add `import` statements at the top of every file for its dependencies
3. [ ] Replace any `chrome.*` calls with imports from `@shared/browser-api`
4. [ ] Move magic strings to `@shared/constants.ts`
5. [ ] Add TypeScript type annotations (optional but recommended)
6. [ ] Ensure content scripts do NOT import from shared chunks (they run in isolation)
7. [ ] Ensure the service worker registers all event listeners at the top level synchronously (MV3 requirement -- cannot defer listener registration behind an async import)
8. [ ] Run `npm run build` and verify the output bundles load correctly in Chrome

---

## 7. Store Comparison and Submission Strategy

### 7.1 Store Comparison Table

| Factor | Chrome Web Store | Edge Add-ons | Firefox AMO | Safari Extensions | Opera Add-ons |
|---|---|---|---|---|---|
| **Registration fee** | $5 one-time | $19 one-time | Free | $99/yr (Apple Developer) | Free |
| **Review time (new)** | 1-5 business days | 3-7 business days | 1-5 business days | 1-7 business days | 3-10 business days |
| **Review time (update)** | 1-3 business days | 1-3 business days | Same day - 3 days | 1-5 business days | 1-5 business days |
| **Auto-publish** | Yes (after review) | Yes (after review) | Yes (after review) | Yes (via Xcode) | Yes (after review) |
| **Built-in analytics** | Chrome Web Store Dashboard | Partner Center analytics | AMO stats dashboard | App Store Connect | Basic download stats |
| **Payment processing** | None (use external) | None (use external) | None (use external) | In-app purchase (optional) | None (use external) |
| **Max package size** | ~500 MB | ~500 MB | ~200 MB | ~500 MB | ~500 MB |
| **Manifest version** | MV3 required | MV3 required | MV2 or MV3 | MV3 (via conversion) | MV3 preferred |
| **User base** | ~3.5 billion (Chrome) | ~350 million (Edge) | ~180 million (Firefox) | ~1.5 billion (Safari) | ~300 million (Opera) |
| **Paid extensions** | Via external (Stripe) | Via external | Via external | Apple IAP or external | Via external |
| **Developer dashboard** | Chrome Developer Dashboard | Partner Center | AMO Developer Hub | App Store Connect | Opera Developer Portal |
| **API for submission** | Chrome Web Store API | Partner Center API | AMO API (addons.mozilla.org) | Xcode/Transporter | Manual upload |
| **Store URL pattern** | `chrome.google.com/webstore/detail/{id}` | `microsoftedge.microsoft.com/addons/detail/{id}` | `addons.mozilla.org/addon/{slug}` | `apps.apple.com/app/{id}` | `addons.opera.com/extensions/details/{slug}` |

### 7.2 Submission Order and Timeline

**Recommended submission order for Focus Mode - Blocker:**

```
Week 1:  Chrome Web Store (primary, largest audience)
         |
Week 2:  Edge Add-ons (same build, enterprise market)
         |
Week 3:  Firefox AMO (separate MV2 build, privacy audience)
         |
Week 5:  Opera Add-ons (same Chrome build + sidebar, gamer audience)
         |
Week 8:  Safari Extensions (requires Xcode conversion, Apple developer account)
```

**Rationale:**

1. **Chrome first** -- largest user base, primary development target, fastest review. All testing and QA happens against Chrome. Launch marketing focuses on Chrome.

2. **Edge second** -- near-identical build, no code changes for free tier. Enterprise deployment opportunity. Edge Add-ons Partner Center registration can happen during Chrome review wait. Target: submit within 1 week of Chrome approval.

3. **Firefox third** -- requires a separate MV2 build with `webRequest` blocking instead of `declarativeNetRequest`. This is the most engineering work. Firefox's privacy-conscious audience aligns well with Focus Mode - Blocker's privacy-first messaging. Target: 2-3 weeks after Chrome launch.

4. **Opera fourth** -- Chrome build works, but adding the sidebar panel (Opera-specific) adds value. Opera GX marketing angle is compelling. Lower priority due to smaller user base. Target: 4-5 weeks after Chrome launch.

5. **Safari last** -- requires Apple Developer Program membership ($99/yr), Xcode project setup with `safari-web-extension-converter`, and significant testing on macOS/iOS. Safari has the largest user base after Chrome, but extension adoption on Safari is lower and the development overhead is highest. Target: 6-8 weeks after Chrome launch.

### 7.3 Version Management Across Stores

**Single version number across all stores:**

Focus Mode - Blocker uses a single version in `package.json` that is injected into all browser manifests by the manifest generator. This ensures version parity across all stores.

```
package.json: "version": "1.2.0"
    |
    ├── dist/chrome/manifest.json: "version": "1.2.0"
    ├── dist/edge/manifest.json: "version": "1.2.0"
    ├── dist/firefox/manifest.json: "version": "1.2.0"
    ├── dist/safari/manifest.json: "version": "1.2.0"
    └── dist/opera/manifest.json: "version": "1.2.0"
```

**Handling different review timelines:**

Different stores approve updates at different speeds. A version bump should be submitted to all stores simultaneously, but approval will stagger:

```
v1.2.0 submitted to all stores: Monday
  Chrome approved: Wednesday (2 days)
  Edge approved: Friday (4 days)
  Firefox approved: Thursday (3 days)
  Opera approved: next Monday (7 days)
  Safari approved: next Wednesday (9 days)
```

This means users on different browsers will run different versions temporarily. Handle this by:
- Never breaking backward compatibility in the Zovo API (version the API: `/v1/`, `/v2/`)
- Never changing `chrome.storage` schema without a migration that handles both old and new formats
- Using feature flags from the Zovo API to enable/disable features server-side, independent of extension version
- Documenting the current live version per store in a `RELEASES.md` file

**Version bump workflow:**

```bash
# 1. Bump version
npm run version:patch  # or version:minor / version:major

# 2. Build and package all browsers
npm run release

# 3. Submit to all stores
npm run submit:all

# 4. Monitor review status
# Chrome: https://chrome.google.com/webstore/devconsole
# Edge: https://partner.microsoft.com/dashboard/microsoftedge
# Firefox: https://addons.mozilla.org/developers/
# Opera: https://addons.opera.com/developer/
# Safari: Xcode / App Store Connect
```

**CI/CD integration:**

The GitHub Actions workflow from Phase 12 can be extended to build and package all browsers on every tag push:

```yaml
# .github/workflows/release.yml (multi-browser extension)
name: Release

on:
  push:
    tags: ['v*']

jobs:
  build-and-package:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chrome, edge, firefox, opera]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build:${{ matrix.browser }}
      - run: npm run package -- --browser=${{ matrix.browser }}
      - uses: actions/upload-artifact@v4
        with:
          name: focus-mode-blocker-${{ matrix.browser }}
          path: packages/focus-mode-blocker-${{ matrix.browser }}-*.zip

  submit-chrome:
    needs: build-and-package
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: focus-mode-blocker-chrome
      - uses: nicolo-ribaudo/chroma-publish@v1
        with:
          extension-id: ${{ secrets.CHROME_EXTENSION_ID }}
          client-id: ${{ secrets.CHROME_CLIENT_ID }}
          client-secret: ${{ secrets.CHROME_CLIENT_SECRET }}
          refresh-token: ${{ secrets.CHROME_REFRESH_TOKEN }}
          zip-path: focus-mode-blocker-chrome-*.zip

  submit-edge:
    needs: build-and-package
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: focus-mode-blocker-edge
      - uses: nicolo-ribaudo/edge-addon-publish@v1
        with:
          product-id: ${{ secrets.EDGE_PRODUCT_ID }}
          client-id: ${{ secrets.EDGE_CLIENT_ID }}
          client-secret: ${{ secrets.EDGE_CLIENT_SECRET }}
          access-token-url: ${{ secrets.EDGE_ACCESS_TOKEN_URL }}
          zip-path: focus-mode-blocker-edge-*.zip

  submit-firefox:
    needs: build-and-package
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: focus-mode-blocker-firefox
      - run: npx web-ext sign --api-key=${{ secrets.AMO_API_KEY }} --api-secret=${{ secrets.AMO_API_SECRET }} --channel=listed
```

---

## Summary

Focus Mode - Blocker's Chromium-based browser porting story is straightforward: the Chrome MV3 build runs on Edge, Brave, Opera, Vivaldi, and Arc with zero to minimal modifications. The primary engineering investments are:

1. **Edge:** Separate store listing for enterprise visibility. Managed storage schema for Intune/Group Policy deployment. No code changes for free tier.

2. **Brave:** No separate build or listing needed. Document Shields interaction. Ensure Sentry and Stripe work with Shields enabled.

3. **Opera:** Separate store listing for native presence. Optional sidebar panel reusing popup codebase. Marketing angle for Opera GX's gamer audience.

4. **Build system:** Webpack with `--env browser=` flag, DefinePlugin for `__BROWSER__`/`__MV__` constants, manifest generator that deep-merges base + browser overlays, and per-browser ZIP packaging. This system supports Chrome, Edge, Firefox, Safari, and Opera from a single codebase.

5. **Store strategy:** Chrome first, then Edge within 1 week, Firefox within 3 weeks, Opera within 5 weeks, Safari within 8 weeks. Single version number across all stores, CI/CD pipeline for automated submission.

The total additional engineering effort for Chromium browser ports (excluding Firefox and Safari, which require significant adaptation) is estimated at 2-3 days of work, primarily for store listing setup, screenshot capture, and Edge enterprise documentation.
