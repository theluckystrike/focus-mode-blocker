# Section 4: Policy Compliance Checklist & Privacy Documentation
## Phase 13, Agent 3 — Compliance & Privacy for Focus Mode - Blocker

> **Date:** February 11, 2026 | **Status:** Complete
> **Extension:** Focus Mode - Blocker v1.0.0 (Manifest V3)
> **Developer:** Zovo
> **Scope:** Pre-submission audit, privacy policy, CWS disclosures, data handling map, review trigger awareness

---

## 4.1 Pre-Submission Audit Checklist

Complete this checklist before every Chrome Web Store submission. Every item must pass before uploading the ZIP. Items marked with a tier label apply only to that build variant.

---

### Manifest Compliance (10 items)

- [ ] **MV3 declared** -- `"manifest_version": 3` is set in manifest.json. Confirmed: the extension is built MV3-native with zero MV2 migration debt.
- [ ] **Name accurate and not misleading** -- `"name": "Focus Mode - Blocker"` describes exactly what the extension does: a focus mode tool that blocks distracting websites. No superlatives ("best"), no competitor names, no misleading claims.
- [ ] **Description matches functionality** -- `"description": "Block distracting websites, track your focus time, and build better habits. Free forever with 10 blocked sites, Pomodoro timer, and daily stats."` All three claims (blocking, tracking, habits) are implemented features. "Free forever" is accurate -- the free tier has no time expiration.
- [ ] **All 8 permissions used in code** -- Every declared permission maps to a concrete code file:

  | Permission | Code File(s) | Usage |
  |------------|-------------|-------|
  | `storage` | `src/background/modules/storage-manager.js`, all UI pages | `chrome.storage.local` for blocklist, settings, stats, scores, streaks; `chrome.storage.session` for active session state |
  | `alarms` | `src/background/modules/alarm-manager.js` | Pomodoro tick, nuclear countdown, schedule activation, storage cleanup, license check, telemetry batch |
  | `declarativeNetRequest` | `src/background/modules/rule-engine.js` | Static rulesets (prebuilt social/news lists), session rules (active blocklist), dynamic rules (schedule, nuclear) |
  | `declarativeNetRequestWithHostAccess` | `src/background/modules/rule-engine.js` | Required to apply dynamic blocking rules to user-specified domains at runtime |
  | `activeTab` | `src/background/modules/session-manager.js`, `src/popup/popup.js` | Detect current tab URL for Quick Focus, distraction tracking during active sessions |
  | `scripting` | `src/background/modules/content-injector.js` | `chrome.scripting.executeScript` to inject blocker.js and tracker.js on demand |
  | `notifications` | `src/background/modules/notification-manager.js` | Session start/end, break reminders, streak milestones, nuclear countdown alerts |
  | `offscreen` | `src/background/modules/audio-manager.js` | `chrome.offscreen.createDocument` for ambient sound playback (MV3 service workers cannot play audio) |

- [ ] **No unnecessary permissions** -- Cross-referenced against the 8 deliberately avoided permissions (webRequest, webRequestBlocking, history, bookmarks, cookies, tabs, management, browsingData). None are present.
- [ ] **Host permissions justified** -- `<all_urls>` is required because users can add any website to their personal blocklist. Without `<all_urls>`, the extension could only block pre-declared domains, making user-configured blocking impossible. The store listing includes the disclosure: *"This permission allows Focus Mode to block any website you add to your list. We never read, collect, or transmit your browsing data."*
- [ ] **Icons are original** -- Purple gradient shield icons at 16px, 32px, 48px, 128px in `src/assets/icons/`. Original artwork, not derived from any third-party icon pack or competitor branding.
- [ ] **Content scripts minimal and justified** -- Only one statically-declared content script (`detector.js` at `<all_urls>`, `document_start`, main frame only). Target size <2KB minified. It performs a single synchronous check against a cached blocklist and exits immediately if no match. `blocker.js` and `tracker.js` are injected programmatically only when needed via `chrome.scripting.executeScript`.
- [ ] **CSP is strict** -- `"extension_pages": "script-src 'self'; object-src 'self'; style-src 'self' 'unsafe-inline';"` No eval, no remote scripts, no inline scripts. `unsafe-inline` for styles only (required for dynamic theming via CSS custom properties).
- [ ] **Minimum Chrome version specified** -- `"minimum_chrome_version": "116"` set in manifest.json. Chrome 116+ is required for full MV3 declarativeNetRequest support with session rules and the offscreen API.

---

### Store Listing (8 items)

- [ ] **Screenshots match current UI** -- All 5 screenshots reflect the current build. No mockups, no Photoshop enhancements beyond standard device frames. Screenshots show: (1) popup idle state, (2) active focus session, (3) block page with motivational quote, (4) daily stats view, (5) settings page with Pro indicators.
- [ ] **Description is natural (no keyword stuffing)** -- Description reads as plain English. No repeated keywords, no hidden text, no lists of search terms. Feature bullets describe genuine functionality. Checked against CWS spam policy: no more than 2 occurrences of primary keywords ("block", "focus", "distraction") per paragraph.
- [ ] **Category is Productivity** -- Listed under "Productivity" in the Chrome Web Store. This is the correct category for a website blocker / focus timer tool. Not listed under "Fun" or "Social & Communication".
- [ ] **All described features exist and work** -- Every feature mentioned in the store listing has been tested end-to-end: site blocking, Pomodoro timer, Quick Focus, daily stats, Focus Score, streaks, block page with quotes, pre-built lists, schedule blocking, nuclear option. No "coming soon" features are listed.
- [ ] **Pro features clearly disclosed** -- Store description includes a "Free vs Pro" section that explicitly states which features require a Pro subscription. The phrase "Free forever" applies only to the free tier features. Pro pricing ($4.99/mo, $35.88/yr, $49.99 lifetime) is stated.
- [ ] **Privacy policy link is live and current** -- The privacy policy URL in the CWS developer dashboard returns HTTP 200, contains the correct extension name ("Focus Mode - Blocker"), and reflects the current data practices. Last-updated date is within 30 days of submission.
- [ ] **Short description under 132 characters** -- `"Block distracting websites, track your focus time, and build better habits."` (74 characters). Well under the 132-character CWS limit.
- [ ] **Promo images compliant** -- Small promo tile (440x280) and marquee promo (1400x560) follow CWS image guidelines: no screenshots embedded, no excessive text (less than 30% text area), no misleading imagery, no transparent backgrounds, proper branding only.

---

### Code Quality (8 items)

- [ ] **No obfuscated code** -- All JavaScript is minified (Vite production build with Terser) but not obfuscated. Variable names are shortened but code structure is preserved and readable. No base64-encoded strings, no string array rotation, no control flow flattening, no dead code injection. CWS allows minification but prohibits obfuscation.
- [ ] **All dependencies from npm (no vendored unknowns)** -- `package.json` declares all 3 runtime dependencies. No `vendor/` directory, no copied source files of unknown origin, no CDN scripts bundled manually. The `node_modules/` directory is not included in the submission ZIP.
- [ ] **No remote code execution** -- MV3 enforces this architecturally: `script-src 'self'` prevents loading scripts from external URLs. Additionally, no `fetch()` calls retrieve JavaScript for execution, no `import()` loads remote modules, and no `<script src="https://...">` tags exist in any HTML page.
- [ ] **No undisclosed server communication** -- Free tier: zero outbound network requests. Pro tier: three declared endpoints only -- (1) Sentry for error reports, (2) custom API for license validation and sync, (3) Stripe for payment processing. All three are documented in the privacy policy. No analytics beacons, no tracking pixels, no telemetry without opt-in.
- [ ] **Error handling is comprehensive** -- Every `chrome.*` API call is wrapped in try-catch with graceful degradation. Service worker crash recovery restores active sessions from `chrome.storage.session`. Storage quota warnings trigger automatic cleanup. DNR rule failures fall back to content-script-based blocking. UI pages display user-friendly error states instead of blank screens.
- [ ] **Extension does not crash on common actions** -- Tested against 20 manual test scenarios: install, first run, add site, remove site, start session, complete session, abandon session, block page display, popup open/close, settings change, nuclear activation, uninstall, update, disable/re-enable, storage full, alarm miss, service worker restart, offline mode, rapid toggle, 100+ sites.
- [ ] **No eval() or new Function()** -- Verified with static analysis: `grep -r "eval(" src/` and `grep -r "new Function" src/` return zero matches. CSP `script-src 'self'` would block these at runtime regardless, but they are not present in source.
- [ ] **Source maps not included in production build** -- Vite build config sets `build.sourcemap: false` for production. The `dist/` directory and submission ZIP contain no `.map` files. Source maps are generated separately for internal debugging and stored outside the distribution.

---

### Data Handling (8 items)

- [ ] **Privacy policy covers all data collection** -- The privacy policy (Section 4.2 below) addresses every data type: blocklist, focus sessions, Focus Score, streaks, settings, analytics events (local), license data (Pro), error reports (Pro, opt-in), payment data (Pro, via Stripe). No undocumented data collection exists.
- [ ] **Consent obtained for Pro telemetry** -- Pro users are shown an explicit opt-in dialog during Pro onboarding: *"Help improve Focus Mode by sharing anonymous usage data? We never share your browsing history or blocked sites."* with [Yes, share anonymously] and [No thanks] buttons. The `monitoring.telemetryOptIn` flag defaults to `false` and is only set to `true` on explicit user action.
- [ ] **Data minimization practiced** -- Free tier collects zero data externally. Pro telemetry uses a hashed instance ID (SHA-256 of `chrome.runtime.id` + install timestamp), never raw identifiers. Error reports are scrubbed through a 5-stage PII removal pipeline (domains, URLs, emails, IPs, file paths). Analytics events contain category labels, never actual domain names.
- [ ] **HTTPS for all server communication** -- All Pro endpoints use TLS 1.2+ exclusively. No HTTP fallback. Sentry SDK configured with `https://` DSN only. Custom API base URL hardcoded as `https://api.focusmode.app`. Stripe.js loaded from `https://js.stripe.com`.
- [ ] **Data deletion mechanism exists** -- Settings > Account > "Clear All Data" button performs: (1) `chrome.storage.local.clear()`, (2) `chrome.storage.session.clear()`, (3) `chrome.storage.sync.clear()` (Pro), (4) DNR dynamic rules removed, (5) all alarms cancelled, (6) server-side data deletion request sent (Pro). Confirmation dialog prevents accidental deletion.
- [ ] **No unexpected data sharing** -- Free tier: zero network requests. Pro tier: data shared only with Sentry (errors), Stripe (payments), and the Focus Mode API (license, sync). No data is sold, rented, or provided to data brokers, advertisers, or any other third party. No affiliate tracking, no fingerprinting libraries, no ad SDKs.
- [ ] **Content scripts do not read page content** -- `detector.js` reads only `window.location.hostname` to check against the blocklist. It does not access DOM content, form fields, cookies, localStorage, or any page data. `blocker.js` injects an overlay but does not read the underlying page. `tracker.js` monitors only time-on-page duration (via `document.visibilityState`), not page content.
- [ ] **Block page URL parameters never transmitted** -- The block page (`block-page.html`) receives the blocked domain via `chrome.runtime.sendMessage`, not via URL query parameters. No blocked domain names appear in any URL that could be logged by proxies or transmitted to servers.

---

## 4.2 Complete Privacy Policy for Focus Mode - Blocker

**This privacy policy is ready for publishing.** Host it at the privacy policy URL submitted to the Chrome Web Store developer dashboard.

---

### PRIVACY POLICY

**Focus Mode - Blocker**
**Developer:** Zovo
**Effective Date:** February 11, 2026
**Last Updated:** February 11, 2026

---

#### 1. Introduction

This Privacy Policy describes how Focus Mode - Blocker ("the Extension", "we", "our") collects, uses, and protects your information. Focus Mode - Blocker is a Chrome browser extension developed by Zovo that helps you block distracting websites, track focus sessions, and build productive habits.

We are committed to protecting your privacy. The Extension is designed with a privacy-first architecture: on the free tier, absolutely no data leaves your device. This policy explains exactly what data is collected, how it is used, and your rights regarding that data.

---

#### 2. Data Collection by Tier

##### 2.1 Free Tier -- No Data Leaves Your Device

If you use Focus Mode - Blocker on the free tier, **no personal data, browsing data, or usage data is ever transmitted from your device**. All data is stored locally using Chrome's built-in storage APIs (`chrome.storage.local`) and remains entirely on your computer.

Data stored locally on the free tier includes:

| Data Type | What Is Stored | Purpose |
|-----------|---------------|---------|
| **Blocked Sites List** | Domain names you add to your blocklist (e.g., "facebook.com") | Core blocking functionality |
| **Focus Sessions** | Session start/end times, duration, type (Pomodoro, Quick Focus), distraction attempt counts | Session history and daily statistics |
| **Focus Score** | A calculated score (0-100) based on session completion rate, distraction resistance, consistency, and duration | Gamification and progress tracking |
| **Streaks** | Current streak count, longest streak, streak history | Motivation and habit building |
| **Settings** | Your preferences (timer duration, notification settings, theme, sounds, schedule configuration) | Personalized experience |
| **Analytics Events** | A rolling window of up to 500 local usage events (e.g., "session started", "site added") | Local statistics display in the Extension popup and settings page |
| **Error Logs** | Technical error information stored in a local circular buffer (up to 1,000 entries) | Self-diagnosis and support troubleshooting |

**None of the above data is ever transmitted to any server, third party, or external service on the free tier.** There are zero outbound network requests from the free tier Extension.

##### 2.2 Pro Tier -- Optional Data Sharing

If you upgrade to Focus Mode Pro, the following data may be transmitted to external services. Each category requires your explicit consent or is essential to providing the paid service.

**a) Payment Data (Required for Pro)**

When you subscribe to Focus Mode Pro, payment is processed by Stripe, Inc. We do not store, process, or have access to your full credit card number, CVV, or billing address. Stripe receives:
- Your payment card details (entered directly into Stripe's secure payment form)
- Your email address (for receipt delivery)
- Transaction amount and currency

Stripe's handling of your payment data is governed by [Stripe's Privacy Policy](https://stripe.com/privacy). We receive from Stripe only: a subscription ID, plan type, subscription status, and transaction timestamps.

**b) Error Reports (Opt-In)**

If you opt in to anonymous error reporting during Pro onboarding or via Settings > Account, technical error data is sent to Sentry (Functional Software, Inc.) for crash analysis. Error reports include:
- Error type and sanitized error message
- Extension version and Chrome version
- Operating system type
- A hashed, anonymous instance identifier

Error reports are **scrubbed of all personally identifiable information** through a 5-stage pipeline before transmission:
1. All domain names and URLs are removed
2. Email addresses are redacted
3. IP addresses are stripped
4. License keys are masked
5. Local file paths are removed

Error reports **never** contain: your blocked sites list, websites you visit, browsing history, Focus Score, session data, personal information, or any content from web pages.

**c) Anonymous Telemetry (Opt-In)**

If you explicitly opt in via Settings > Account > "Share Anonymous Usage Data", aggregated usage statistics are sent to our telemetry server. Telemetry data includes:
- Session counts (e.g., "12 sessions this week")
- Average Focus Score (e.g., "score: 74")
- Feature flags (e.g., "uses Pomodoro: true")
- A hashed instance identifier (SHA-256 hash, not reversible to any personal identifier)

Telemetry data **never** contains: domain names, browsing history, blocked site names, personal information, or any content from web pages.

**d) License Validation and Sync (Required for Pro)**

To verify your Pro subscription and enable cross-device sync, the Extension communicates with our API server (`api.focusmode.app`). Data transmitted includes:
- A hashed instance identifier
- License key status (valid/expired/trial)
- Sync payload (your settings, blocklist, and session history -- encrypted in transit via TLS 1.2+)

The sync payload is used solely to replicate your Extension data across your own devices. It is never analyzed, mined, shared, or used for any purpose other than sync delivery.

---

#### 3. How We Use Your Data

| Purpose | Data Used | Tier |
|---------|-----------|------|
| Block distracting websites | Blocked sites list (local) | Free and Pro |
| Display focus statistics | Session history, Focus Score, streaks (local) | Free and Pro |
| Provide timer functionality | Session state, alarm data (local) | Free and Pro |
| Process Pro subscription payments | Payment data (via Stripe) | Pro |
| Diagnose and fix software errors | Sanitized error reports (via Sentry, opt-in) | Pro |
| Improve the Extension | Anonymous telemetry (opt-in) | Pro |
| Verify Pro license | Hashed instance ID, license status | Pro |
| Sync data across devices | Encrypted settings and session data | Pro |

We do **not** use your data to:
- Display advertisements
- Build advertising profiles
- Sell or rent to third parties
- Track your browsing activity beyond the Extension's blocking functionality
- Make automated decisions that affect you
- Conduct user profiling for marketing purposes

---

#### 4. Third-Party Services

The Extension integrates with the following third-party services, **only on the Pro tier**:

| Service | Purpose | Data Received | Their Privacy Policy |
|---------|---------|--------------|---------------------|
| **Stripe, Inc.** | Payment processing for Pro subscriptions | Payment card details, email, transaction data | [stripe.com/privacy](https://stripe.com/privacy) |
| **Sentry (Functional Software, Inc.)** | Error tracking and crash analysis (opt-in only) | Sanitized error reports, extension version, OS type, hashed instance ID | [sentry.io/privacy](https://sentry.io/privacy/) |
| **Focus Mode API** (`api.focusmode.app`) | License validation and cross-device sync | Hashed instance ID, license status, encrypted sync payload | This privacy policy governs |

**On the free tier, no third-party services receive any data whatsoever.**

---

#### 5. Data Retention

| Data Category | Storage Location | Retention Period |
|--------------|-----------------|-----------------|
| Local Extension data (blocklist, sessions, scores, streaks, settings) | Your device (`chrome.storage.local`) | Until you clear the data via Settings > Account > "Clear All Data", or until you uninstall the Extension |
| Payment records | Stripe servers | Per Stripe's retention policy (typically the duration of the business relationship plus legally required retention periods) |
| Error reports | Sentry servers | 90 days from submission, then automatically deleted |
| Anonymous telemetry | Focus Mode servers | 1 year from submission, then automatically deleted |
| License and sync data | Focus Mode servers | Duration of active Pro subscription plus 30 days after cancellation, then deleted |

---

#### 6. Your Rights

You have the following rights regarding your data:

- **View your data:** All locally stored data is viewable within the Extension at Settings > Account > "View Stored Data". This displays your blocklist, session history, Focus Score history, streak data, and all settings.
- **Export your data:** Settings > Account > "Export Data" generates a JSON file containing all your Extension data, downloadable to your computer.
- **Delete your data:** Settings > Account > "Clear All Data" permanently removes all locally stored Extension data. For Pro users, this also sends a deletion request to our servers to remove your license data, sync data, error reports, and telemetry.
- **Opt out of telemetry:** Settings > Account > "Share Anonymous Usage Data" toggle can be turned off at any time. This immediately stops all telemetry transmission.
- **Opt out of error reporting:** Settings > Account > "Send Error Reports" toggle can be turned off at any time.
- **Uninstall:** Removing the Extension from Chrome deletes all locally stored data. Pro users can request server-side data deletion by emailing privacy@focusmode.app or using the "Clear All Data" function before uninstalling.

---

#### 7. Children's Privacy

Focus Mode - Blocker is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13. If we learn that we have collected personal information from a child under 13, we will take steps to delete that information promptly. If you believe a child under 13 has provided us with personal information, please contact us at privacy@focusmode.app.

---

#### 8. Security

We implement appropriate technical and organizational measures to protect your data:

- All server communication uses TLS 1.2 or higher (HTTPS only, no HTTP fallback)
- The Extension enforces a strict Content Security Policy that prevents code injection
- Error reports pass through a 5-stage PII scrubbing pipeline before any server transmission
- Instance identifiers are SHA-256 hashed and cannot be reversed to identify individuals
- Stripe handles all payment data in their PCI DSS Level 1 certified environment
- The Extension never stores payment card information locally or on our servers
- Local Extension data is protected by Chrome's built-in extension sandboxing

---

#### 9. GDPR Compliance (European Economic Area Users)

If you are located in the European Economic Area (EEA), you have rights under the General Data Protection Regulation (GDPR):

- **Legal basis for processing:** Consent (for telemetry and error reporting), Contract performance (for Pro subscription and license validation), Legitimate interest (for local data processing required for Extension functionality).
- **Data controller:** Zovo is the data controller for data processed by the Extension and our servers. Stripe and Sentry are independent data controllers for data they process.
- **Right of access:** You can view and export all your data via Settings > Account.
- **Right to rectification:** You can modify your blocklist, settings, and preferences at any time within the Extension.
- **Right to erasure:** You can delete all data via Settings > Account > "Clear All Data". This triggers server-side deletion for Pro users.
- **Right to restrict processing:** You can opt out of telemetry and error reporting at any time without affecting core Extension functionality.
- **Right to data portability:** The "Export Data" function provides your data in a machine-readable JSON format.
- **Right to object:** You may object to any data processing by opting out of telemetry, disabling error reporting, or uninstalling the Extension.
- **Right to lodge a complaint:** You have the right to lodge a complaint with your local data protection supervisory authority.

**Data transfers:** Error reports may be processed by Sentry in the United States. Payment data may be processed by Stripe in the United States. These transfers are protected by Standard Contractual Clauses.

For GDPR-related requests, contact: privacy@focusmode.app.

---

#### 10. CCPA Compliance (California Users)

If you are a California resident, the California Consumer Privacy Act (CCPA) provides you with specific rights:

- **Right to know:** You can request a list of all personal information we have collected. Use Settings > Account > "Export Data" or email privacy@focusmode.app.
- **Right to delete:** You can request deletion of your personal information via Settings > Account > "Clear All Data" or by emailing privacy@focusmode.app.
- **Right to opt out of sale:** We do **not** sell your personal information to any third party. We have never sold personal information and will never sell personal information.
- **Right to non-discrimination:** We will not discriminate against you for exercising any of your CCPA rights. Free tier functionality is not affected by privacy choices.

**Categories of personal information collected (Pro tier only):**
- Identifiers: Hashed instance ID (not linked to name, email, or any personal identifier)
- Commercial information: Subscription plan type, transaction timestamps (via Stripe)
- Internet activity: Sanitized error reports (opt-in only), anonymous usage statistics (opt-in only)

**Categories of personal information sold:** None. We do not sell personal information.

---

#### 11. Changes to This Privacy Policy

We may update this Privacy Policy from time to time. When we make changes:

- The "Last Updated" date at the top of this policy will be revised.
- For material changes (new data collection, new third-party services, changes to data sharing), we will notify you via: (a) an in-Extension notification displayed on next launch, and (b) an update to the Chrome Web Store listing.
- Continued use of the Extension after notification constitutes acceptance of the updated policy.
- Previous versions of this policy are available upon request by emailing privacy@focusmode.app.

---

#### 12. Contact Us

If you have questions, concerns, or requests regarding this Privacy Policy or our data practices:

- **Email:** privacy@focusmode.app
- **Developer:** Zovo
- **Response time:** We aim to respond to all privacy inquiries within 7 business days.

---

## 4.3 CWS Privacy Tab Disclosures

When submitting or updating the Extension on the Chrome Web Store, the developer dashboard requires specific privacy disclosures. Below are the exact answers for each field.

---

### "Does your extension collect or use personal data?"

**Answer:** The Extension's handling depends on the user's tier:

- **Free tier users:** The Extension does NOT collect, transmit, or share any personal data. All data (blocklist, sessions, scores, streaks, settings) is stored locally on the user's device using `chrome.storage.local` and never leaves the device.
- **Pro tier users (paid subscription):** The Extension collects limited data required for subscription management (license validation via hashed instance ID) and, with explicit user opt-in, anonymous error reports and anonymous usage telemetry. Payment processing is handled entirely by Stripe.

---

### Single Purpose Description

**Answer:** Focus Mode - Blocker has a single purpose: to help users block distracting websites and maintain focus through timed sessions, statistics tracking, and habit-building features (streaks, Focus Score).

---

### Permission Justifications

These justifications appear in the CWS privacy tab and should match the manifest permission declarations:

| Permission | CWS Justification |
|------------|-------------------|
| `storage` | Stores the user's blocklist, focus session history, Focus Score, streak data, and settings locally on the device. Required for all core functionality. |
| `alarms` | Powers the Pomodoro timer, schedule-based blocking activation, nuclear option countdown, and periodic data cleanup. Required because MV3 service workers cannot use setInterval. |
| `declarativeNetRequest` | Blocks website requests matching the user's blocklist using Chrome's declarative rule system. This is the core blocking mechanism. |
| `declarativeNetRequestWithHostAccess` | Allows blocking rules to apply to any domain the user adds to their blocklist, not just pre-declared domains. |
| `activeTab` | Detects the currently active tab URL to determine if a blocked site is being visited and to power the Quick Focus feature. Only activates on user interaction with the Extension. |
| `scripting` | Injects the block page overlay and time tracker content scripts on demand. Only injected when a blocked site is detected or during an active focus session. |
| `notifications` | Displays focus session reminders, break notifications, streak milestone celebrations, and nuclear option countdowns. |
| `offscreen` | Creates an offscreen document for ambient sound playback. Required because MV3 service workers cannot play audio directly. |
| `<all_urls>` (host permission) | Required to block any website the user adds to their personal blocklist. Without this permission, blocking would only work on pre-declared domains. The Extension never reads, collects, or transmits browsing data. |

---

### Certification Statements

The following statements are checked/certified in the CWS privacy tab:

- [x] **"I certify that this extension does not sell user data to third parties."** -- Confirmed. Focus Mode - Blocker has never sold and will never sell user data. There are no data broker relationships, no advertising partnerships, and no data monetization of any kind.

- [x] **"I certify that this extension does not use or transfer user data for purposes unrelated to the item's single purpose."** -- Confirmed. All data collected is used exclusively for: (1) website blocking functionality, (2) focus session tracking, (3) subscription management (Pro), (4) error diagnosis (Pro, opt-in). No data is used for advertising, analytics unrelated to the Extension, or any secondary purpose.

- [x] **"I certify that this extension does not use or transfer user data to determine creditworthiness or for lending purposes."** -- Confirmed. No financial assessment or creditworthiness determination is performed with any data.

---

### Data Type Disclosures (CWS Categories)

The Chrome Web Store privacy tab requires disclosure of specific data types. For each CWS-defined data type:

| CWS Data Type | Collected? | Details |
|---------------|-----------|---------|
| **Personally identifiable information** (name, address, email, age, ID number) | No | The Extension does not collect names, addresses, email addresses, ages, or government ID numbers. Pro users provide email to Stripe directly for payment receipts; we do not store it. |
| **Health information** | No | Not applicable to this Extension. |
| **Financial and payment information** | No (directly) | Payment data is entered directly into Stripe's secure form. We receive only subscription status and plan type from Stripe, not card details. |
| **Authentication information** | No | The Extension uses a hashed instance ID for license validation, not username/password authentication. Pro users who enable Google sync authenticate via Chrome's `identity` API (optional permission), with tokens managed by Chrome, not stored by us. |
| **Personal communications** | No | The Extension does not access, read, or store emails, messages, or any personal communications. |
| **Location** | No | The Extension does not request or access location data. |
| **Web history** | No | The Extension does not use the `history` permission and does not access Chrome browsing history. The detector content script reads only `window.location.hostname` on the current page to check against the blocklist. |
| **User activity** | Yes (locally only) | Focus session data (start/end times, duration, distraction attempt counts) and the 500-event local analytics rolling window are stored on-device. This data is used exclusively for displaying statistics within the Extension and is never transmitted on the free tier. Pro users may opt in to sharing anonymous, aggregated usage statistics. |
| **Website content** | No | Content scripts do not read, store, or transmit any website content, DOM elements, form data, or page text. |

---

## 4.4 Data Handling Documentation

Internal reference mapping every data touchpoint in the Extension. Use this table for audits, privacy reviews, and CWS review responses.

---

### Complete Data Touchpoint Map

| Data | Collection Point | Storage Location | Transmitted Externally? | Purpose | Retention |
|------|-----------------|-----------------|------------------------|---------|-----------|
| **Blocked sites list** | User manually adds domains via popup or settings, or enables a pre-built list | `chrome.storage.local` key: `blocklist` | Free: Never. Pro: Yes, encrypted via sync API to `api.focusmode.app` for cross-device sync | Core blocking functionality -- domains are converted to DNR rules | Until user removes sites, clears data, or uninstalls |
| **Focus sessions** | Recorded automatically when user starts/completes/abandons a Pomodoro, Quick Focus, or scheduled session | `chrome.storage.local` key: `sessions` (array of session objects) | Free: Never. Pro: Yes, encrypted via sync API for cross-device sync | Session history display, daily/weekly statistics, Focus Score calculation | Rolling 90-day window locally; older sessions aggregated into daily summaries |
| **Focus Score** | Calculated by `scoring-engine.js` after each session using 4 weighted factors (completion rate, distraction resistance, consistency, duration) | `chrome.storage.local` key: `focusScore` (current score + history array) | Free: Never. Pro: Aggregated average included in opt-in telemetry (e.g., "avg_score: 74") | Gamification, progress tracking, displayed in popup and block page | Current score persisted indefinitely; daily score history for 365 days |
| **Streaks** | Incremented automatically when user completes at least one focus session per calendar day | `chrome.storage.local` key: `streaks` (current, longest, history) | Free: Never. Pro: Current streak synced via sync API | Motivation, habit building, displayed in popup and block page | Persisted indefinitely |
| **Settings** | User configures via Settings page (timer duration, notifications, theme, sounds, schedules, nuclear preferences) | `chrome.storage.local` key: `settings` (nested object) | Free: Never. Pro: Synced via sync API for cross-device consistency | Personalized Extension behavior | Until user changes settings, clears data, or uninstalls |
| **Local analytics events** | Recorded by `analytics-engine.js` on user actions (session start, site added, popup opened, etc.) | `chrome.storage.local` key: `analytics` (500-event rolling window, FIFO eviction) | Free: Never. Pro: Never (local analytics are separate from opt-in telemetry) | Powers local statistics display in popup and settings page | Rolling 500-event window; oldest events evicted when limit reached |
| **License data** | Created on Pro subscription activation; validated periodically via API | `chrome.storage.local` key: `license` (key, status, expiry, plan type) | Pro: License key and hashed instance ID sent to `api.focusmode.app` for validation | Pro feature gating, subscription status verification | Locally: until subscription ends + 7-day grace period. Server: subscription duration + 30 days |
| **Error reports** | Captured by `ErrorTracker` module on JavaScript errors in any Extension context | `chrome.storage.local` key: `monitoring.errors` (circular buffer, max 100 entries locally) | Free: Never. Pro (opt-in): Sanitized reports sent to Sentry via batched `fetch()` every 5 minutes | Crash diagnosis, bug fixing, stability improvement | Locally: 100-entry circular buffer. Sentry: 90 days |
| **Anonymous telemetry** | Aggregated by `telemetry-sender.js` from local analytics (session counts, avg scores, feature flags) | Temporarily in `chrome.storage.local` key: `monitoring.telemetryBatch` before send | Free: Never. Pro (opt-in): Sent to Focus Mode telemetry server every 5 minutes | Product improvement, feature prioritization | Locally: cleared after successful send. Server: 1 year |
| **Payment data** | Entered by user into Stripe's embedded payment form during Pro checkout | Stripe servers (not stored locally or on our servers) | Pro: Stripe processes payment data under their own privacy policy | Subscription billing, receipt delivery | Per Stripe's retention policy |
| **Hashed instance ID** | Generated on install: SHA-256 hash of `chrome.runtime.id` + install timestamp | `chrome.storage.local` key: `instanceId` | Pro: Sent with license validation, error reports, and telemetry requests | Anonymous device identification for license management and deduplication | Until Extension uninstalled |
| **Debug logs** | Recorded by `DebugLogger` module when debug mode is enabled (manual toggle only) | In-memory circular buffer (1,000 entries, not persisted to storage) | Never | Developer troubleshooting, support diagnostics | Cleared on service worker restart or debug mode toggle off |

---

## 4.5 CWS Review Trigger Awareness

Understanding what triggers a manual Chrome Web Store review helps plan submissions to avoid unnecessary delays. Below is a classification of changes by review trigger risk level, based on documented CWS review behavior and community experience.

---

### HIGH Trigger -- Expect Extended Manual Review (3-7+ days)

| Change | Why It Triggers Review | Mitigation |
|--------|----------------------|------------|
| **New permission added** | Any new permission in `manifest.json` `permissions` array triggers a full re-review. Reviewers verify the new permission is used in code and justified. | Submit permission changes in isolation (not bundled with large feature updates). Include a "Review Notes" comment in the submission explaining exactly why the permission is needed and which code files use it. |
| **New host permission added** | Adding or broadening host permissions (e.g., changing from specific domains to `<all_urls>`, or adding new domain patterns) is the highest-risk trigger. Reviewers examine all network requests and content script behavior. | Our Extension already declares `<all_urls>` at v1.0.0, so this is a concern only if we ever narrow and later re-broaden. Document the justification prominently in the CWS privacy tab. |
| **First submission (new extension)** | All new extensions undergo full manual review. Reviewers inspect permissions, code quality, data practices, store listing accuracy, and privacy policy. Expect 3-7 business days. | Submit with a clean, complete listing. Have the privacy policy live before submission. Ensure all screenshots match the actual UI. Remove debug code and console.log statements. |
| **`<all_urls>` host permission (initial or changed)** | This permission is flagged for extra scrutiny on every review where it appears. Reviewers verify the Extension genuinely needs access to all URLs. | Include a clear justification in the Extension description and privacy tab: "Required to block any website the user adds to their personal blocklist." Ensure content scripts are minimal and do not read page content. |
| **Remote code detected (or suspected)** | If reviewers find or suspect `fetch()` calls that retrieve executable code, `eval()`, `new Function()`, or dynamic `import()` from remote URLs. Even false positives (e.g., fetching JSON that looks like it could be code) can trigger rejection. | Use `script-src 'self'` CSP. Never fetch JavaScript from external sources. Ensure API responses are clearly data (JSON with content-type headers), not code. |

---

### MEDIUM Trigger -- May Trigger Spot Review (1-3 days)

| Change | Why It Triggers Review | Mitigation |
|--------|----------------------|------------|
| **Content script changes** | Modifications to content scripts (especially those running on `<all_urls>`) receive extra attention because they interact with user web pages. | Keep content scripts minimal. Document their behavior in code comments. Ensure `detector.js` remains under 2KB minified. Avoid adding DOM reading capabilities. |
| **Major feature additions** | Significant new functionality (e.g., adding sync, AI features, new UI pages) may trigger a review to verify the Extension still matches its single-purpose description. | Update the store description to reflect new features before submitting the code update. Ensure the privacy policy covers any new data handling. |
| **New third-party service integration** | Adding a new API endpoint, SDK, or external service that the Extension communicates with. | Disclose the service in the privacy policy before submission. Ensure the service URL is documented in the CWS privacy tab. Use HTTPS only. |
| **Significant code size increase** | A large increase in code size (>50% growth) may trigger a review to check for bundled third-party code or obfuscation. | Keep bundle sizes within documented budgets. Use tree shaking. Do not vendor large libraries. |
| **Changes to web_accessible_resources** | Modifying the resources exposed to web pages can trigger review because it affects the Extension's security surface. | Only expose resources that genuinely need to be accessible from content scripts. Document each resource's purpose. |

---

### LOW Trigger -- Usually Auto-Approved (minutes to 1 day)

| Change | Why It Is Low Risk | Notes |
|--------|-------------------|-------|
| **Version bump only** | Incrementing the version number without code changes. Rarely done in practice but sometimes used for store listing updates. | May still be queued for spot review if the Extension is on a watch list. |
| **Bug fixes (no permission changes)** | Code changes that fix bugs without adding permissions, changing content scripts significantly, or adding new external communication. | The most common update type. Include clear release notes in the CWS submission. |
| **UI-only changes** | Updates to popup HTML/CSS, options page layout, icon changes, block page design tweaks. | Keep changes within existing code boundaries. Avoid adding new HTML pages without updating the manifest. |
| **Store listing text updates** | Changes to the Extension description, screenshots, promo images, or category. | Store listing changes are reviewed separately from code changes and usually process faster. |
| **Localization updates** | Adding or updating `_locales/` translation files. | Translations are low-risk content changes. |
| **Static ruleset updates** | Updating the pre-built blocklist JSON files in `src/rules/`. | DNR static rules are declarative and do not execute code. Low risk. |

---

### Review Timeline Planning

| Submission Type | Expected Review Time | Recommended Strategy |
|----------------|---------------------|---------------------|
| **Initial v1.0.0 submission** | 3-7 business days (full manual review) | Submit early in the work week (Monday-Tuesday). Have all assets, privacy policy, and screenshots finalized before submission. Budget 2 weeks for potential rejection and resubmission. |
| **Permission-adding update** | 3-5 business days | Submit the permission change as its own update with minimal other changes. Provide review notes explaining the permission need. Wait for approval before submitting feature updates that use the permission. |
| **Feature update (no new permissions)** | 1-3 business days | Bundle related features into a single update to reduce submission frequency. Include clear release notes. |
| **Bug fix** | Minutes to 1 business day | Can be submitted at any time. Use the "expedited review" option if fixing a critical user-facing bug. |
| **Store listing update only** | Minutes to 1 business day | Submit listing changes separately from code changes when possible. |

---

### Submission Best Practices to Minimize Review Delays

1. **Never bundle permission changes with large feature updates.** Reviewers need to evaluate the new permission in context. A focused submission is easier to approve.
2. **Keep review notes current.** The CWS submission form has a "Notes for reviewer" field. Use it to explain what changed and why. Reference specific code files for permission usage.
3. **Test on a clean Chrome profile before submission.** Install the Extension from the generated ZIP on a fresh profile. Verify all features work, all UI matches screenshots, and no console errors appear.
4. **Ensure the privacy policy URL is live and current.** Reviewers check the privacy policy link. A 404 or outdated policy will result in rejection.
5. **Remove all debug code.** No `console.log` statements in production builds. No debug UI elements visible to users. No test API endpoints hardcoded.
6. **Do not include unnecessary files in the ZIP.** No `node_modules/`, no `.git/`, no source maps, no test files, no documentation. The submission ZIP should contain only the files referenced by `manifest.json`.
7. **Respond promptly to reviewer feedback.** If the Extension is rejected, the CWS team provides specific reasons. Address every point in the rejection notice before resubmitting. Partial fixes will result in re-rejection.
8. **Maintain a consistent Extension ID.** Use the `key` field in `manifest.json` during development to ensure a consistent Extension ID across loads. Remove the `key` field from the production build submitted to CWS (the store assigns the ID).
9. **Keep a pre-submission log.** Before each submission, document the changes, run the Section 4.1 checklist, and verify the privacy policy. This log is invaluable if a rejection references a specific concern.
10. **Use staged rollout for major updates.** CWS supports percentage-based rollout (e.g., 10% of users first). Use this for major feature additions to catch issues before full deployment.

---

*Phase 13, Agent 3 -- Compliance & Privacy -- Complete*
