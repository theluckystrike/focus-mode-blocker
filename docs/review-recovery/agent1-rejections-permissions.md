# Phase 13 — Agent 1: Rejection Risk Assessment & Permission Justification Templates

> **Extension:** Focus Mode - Blocker v1.0.0 | Manifest V3 Chrome Extension
> **Agent:** Rejections & Permissions Specialist (Agent 1)
> **Date:** February 11, 2026
> **Purpose:** Pre-submission risk analysis for every known Chrome Web Store rejection vector, plus copy-pasteable permission justification text for the CWS submission forms.

---

## Table of Contents

### Section 1: Common Rejection Reasons -- Focus Mode Risk Assessment
- [1.1 Permission Over-Requesting Risk Assessment](#11-permission-over-requesting-risk-assessment)
- [1.2 Privacy Policy Risk Assessment](#12-privacy-policy-risk-assessment)
- [1.3 Deceptive Functionality Risk](#13-deceptive-functionality-risk)
- [1.4 Keyword Stuffing Risk](#14-keyword-stuffing-risk)
- [1.5 Monetization Compliance](#15-monetization-compliance)
- [1.6 User Data Handling Compliance](#16-user-data-handling-compliance)

### Section 2: Permission Justification Templates for Focus Mode
- [2.1 `<all_urls>` Host Permission Justification](#21-all_urls-host-permission-justification)
- [2.2 `declarativeNetRequest` + `declarativeNetRequestWithHostAccess`](#22-declarativenetrequest--declarativenetrequestwithhostaccess)
- [2.3 `scripting` Permission](#23-scripting-permission)
- [2.4 `notifications` Permission](#24-notifications-permission)
- [2.5 `offscreen` Permission](#25-offscreen-permission)
- [2.6 `activeTab` Permission](#26-activetab-permission)
- [2.7 `storage` and `alarms`](#27-storage-and-alarms)
- [2.8 Optional Permissions (`identity`, `idle`, `tabGroups`)](#28-optional-permissions-identity-idle-tabgroups)
- [2.9 Single-Purpose Description for Focus Mode](#29-single-purpose-description-for-focus-mode)

---

# Section 1: Common Rejection Reasons -- Focus Mode Risk Assessment

## 1.1 Permission Over-Requesting Risk Assessment

Focus Mode - Blocker requests 8 required permissions, 1 host permission (`<all_urls>`), and 3 optional permissions. The Chrome Web Store review team flags extensions that request more permissions than their functionality justifies. Below is a per-permission risk assessment with specific remediation guidance for each MEDIUM or HIGH risk item.

---

### Risk Rating Summary

| Permission | Risk Level | Reviewer Scrutiny | Rejection Likelihood |
|---|---|---|---|
| `storage` | LOW | Minimal | Very Low |
| `alarms` | LOW | Minimal | Very Low |
| `declarativeNetRequest` | LOW | Standard for blockers | Very Low |
| `declarativeNetRequestWithHostAccess` | MEDIUM | Needs clear justification for dynamic rules | Low-Medium |
| `activeTab` | LOW | User-initiated, well-understood | Very Low |
| `scripting` | MEDIUM | Code injection capability triggers review | Medium |
| `notifications` | LOW | Expected for productivity tools | Very Low |
| `offscreen` | LOW | Newer API but well-documented justification | Low |
| `<all_urls>` (host permission) | **HIGH** | Most scrutinized permission in the CWS | **High** |
| `identity` (optional) | MEDIUM | OAuth scope, but optional mitigates risk | Low |
| `idle` (optional) | LOW | Passive API, no user data exposure | Very Low |
| `tabGroups` (optional) | LOW | UI-only API, no data access | Very Low |

---

### LOW Risk Permissions (Minimal Concern)

#### `storage`
- **Risk Level:** LOW
- **Why:** Nearly every Chrome extension uses `storage`. Reviewers expect it.
- **Focus Mode usage:** Persists blocklist, settings, Focus Score, streaks, timer state, session history, sound preferences, schedules, and Pro license status via `chrome.storage.local`.
- **No action required.** Standard justification is sufficient.

#### `alarms`
- **Risk Level:** LOW
- **Why:** No user-facing impact. Cannot access user data. Reviewers treat it as benign infrastructure.
- **Focus Mode usage:** Powers the Pomodoro timer countdowns, scheduled focus sessions, periodic streak recalculation, and storage cleanup cycles.
- **No action required.** Standard justification is sufficient.

#### `declarativeNetRequest`
- **Risk Level:** LOW
- **Why:** This is the MV3-approved replacement for `webRequest` blocking. Reviewers expect website blockers to use it. Google designed it specifically to be safer and more reviewable than the old `webRequest` API.
- **Focus Mode usage:** Registers blocking rules that redirect navigation to blocked sites to the local motivational block page.
- **No action required.** The fact that Focus Mode uses `declarativeNetRequest` instead of `webRequest` is actually a positive signal to reviewers.

#### `activeTab`
- **Risk Level:** LOW
- **Why:** Only activates on explicit user interaction (clicking the extension icon). Cannot run in the background. Reviewers understand this is a minimal-privilege approach.
- **Focus Mode usage:** Reads the URL of the current tab when the user interacts with the popup to show whether the current site is on the blocklist and to power the "Quick Focus" one-click blocking feature.
- **No action required.** Standard justification is sufficient.

#### `notifications`
- **Risk Level:** LOW
- **Why:** Expected for productivity and timer apps. Reviewers flag it only if used for marketing or spam.
- **Focus Mode usage:** Pomodoro session start/end alerts, break reminders, streak milestone celebrations.
- **No action required.** Ensure notifications are never used for upselling or marketing. Currently, Focus Mode's notification usage is entirely functional.

#### `offscreen`
- **Risk Level:** LOW
- **Why:** Newer MV3 API, but Google explicitly recommends it for audio playback in service-worker-based extensions. Reviewers will check the `reason` field.
- **Focus Mode usage:** Creates an offscreen document with `reason: 'AUDIO_PLAYBACK'` to play ambient focus sounds (rain, cafe, white noise). MV3 service workers cannot access the Audio API directly.
- **No action required.** The `AUDIO_PLAYBACK` reason is one of the explicitly supported use cases.

#### `idle` (optional)
- **Risk Level:** LOW
- **Why:** Passive detection API. Only reports whether the user is active, idle, or locked. Cannot access any user data.
- **Focus Mode usage:** Auto-pauses the focus timer when the user steps away, preventing inflated focus time statistics.
- **No action required.** Optional permissions are inherently lower risk because they are not requested at install time.

#### `tabGroups` (optional)
- **Risk Level:** LOW
- **Why:** UI-only API for organizing tabs. Cannot read tab content.
- **Focus Mode usage:** Automatically groups blocked-site tabs into a collapsed group during focus sessions to reduce visual distraction.
- **No action required.** Optional and low-impact.

---

### MEDIUM Risk Permissions (Justification Required)

#### `declarativeNetRequestWithHostAccess`

- **Risk Level:** MEDIUM
- **Why the reviewer will scrutinize it:** This permission extends `declarativeNetRequest` to allow dynamic rule creation targeting arbitrary host patterns. Reviewers will ask: "Why can't you use static rulesets?"
- **Why Focus Mode needs it:** Users configure their own blocklist at runtime. The extension cannot ship a static ruleset covering every possible website a user might want to block. `updateDynamicRules()` is called when users add/remove sites from their blocklist or when focus sessions start/stop.
- **What the reviewer will look for:**
  - Calls to `chrome.declarativeNetRequest.updateDynamicRules()` in the service worker
  - That rules are derived from user input (the blocklist), not hardcoded
  - That rule actions are `redirect` (to the block page) or `block`, not `modifyHeaders` or other suspicious actions
- **Code locations that prove usage:**
  - `src/background/service-worker.js` -- `updateDynamicRules()` calls tied to blocklist changes
  - `src/background/rules/blocking-rules.json` -- static ruleset for default/preset lists
  - Storage key `blocklist` in `chrome.storage.local` -- the user-configured domain list
- **What to change if rejected:**
  - Ship a comprehensive static ruleset for the most common 500+ distraction domains (social media, news, entertainment, gaming, streaming)
  - Use `chrome.permissions.request()` to request host permissions per-domain as users add sites, instead of relying on blanket `<all_urls>` + `WithHostAccess`
  - Fall back to `declarativeNetRequest` (without `WithHostAccess`) for static rules, and only request `WithHostAccess` when the user adds a custom domain not in the static set

#### `scripting`

- **Risk Level:** MEDIUM
- **Why the reviewer will scrutinize it:** The `scripting` permission grants the ability to inject code into web pages via `chrome.scripting.executeScript()`. This is the most powerful code-injection capability in MV3 and is a common vector for malicious extensions.
- **Why Focus Mode needs it:** Three content scripts must run on pages matching the user's blocklist:
  1. `detector.js` (document_start) -- Checks if the current page is on the blocklist by sending a message to the service worker. Under 2KB, no DOM manipulation.
  2. `blocker.js` (document_start) -- Injects the motivational block page overlay into the DOM via Shadow DOM when a site is confirmed blocked. Prevents flash-of-blocked-content.
  3. `tracker.js` (document_idle) -- Updates focus session time statistics by tracking time spent on allowed vs. blocked pages.
- **What the reviewer will look for:**
  - That all injected scripts are bundled in the extension package (no remote code loading)
  - No use of `eval()`, `new Function()`, `innerHTML` with user-generated content, or `document.write()`
  - That `chrome.scripting.executeScript()` is only called on tabs matching the user's blocklist
  - CSP set to `script-src 'self'` preventing inline/remote script execution
- **Code locations that prove usage:**
  - `manifest.json` `content_scripts` array -- all three scripts declared statically with `<all_urls>` match pattern
  - `src/content/detector.js` -- lightweight domain checker, no DOM ops
  - `src/content/blocker.js` -- block page overlay injection via Shadow DOM, all content set via `textContent` (no `innerHTML`)
  - `src/content/tracker.js` -- passive time tracking, no page content access
  - CSP in manifest.json: `"extension_pages": "script-src 'self'; object-src 'none'"`
- **What to change if rejected:**
  - Move to purely programmatic injection via `chrome.scripting.executeScript()` on specific tabs only, instead of static `<all_urls>` content script declarations. This narrows the injection scope to only tabs actively being blocked.
  - Reduce the `matches` pattern from `<all_urls>` to a dynamically maintained list of blocked domains using `chrome.scripting.registerContentScripts()` with dynamic `matches`.
  - Document that `tracker.js` never accesses `document.body.innerText`, `document.cookie`, `localStorage`, or any page content.

#### `identity` (optional)

- **Risk Level:** MEDIUM
- **Why the reviewer will scrutinize it:** `identity` involves OAuth and Google account access. Even as an optional permission, reviewers verify it is genuinely used and properly scoped.
- **Why Focus Mode needs it:** Pro tier account authentication via Google Sign-In for license verification and optional encrypted cross-device settings sync.
- **What the reviewer will look for:**
  - That `chrome.identity.getAuthToken()` is only called after the user explicitly triggers Pro sign-in
  - That the OAuth scope is minimal (profile email only, not broader Google API access)
  - That the permission is requested via `chrome.permissions.request()`, not declared as required
- **Code locations that prove usage:**
  - `manifest.json` `optional_permissions` array -- `identity` listed as optional
  - `src/shared/payments.js` -- license verification flow uses `chrome.identity` only when user initiates Pro upgrade
- **What to change if rejected:**
  - Remove `identity` entirely and use license-key-only authentication (ZOVO-XXXX-XXXX-XXXX-XXXX format) without Google Sign-In
  - Implement email-based magic link authentication instead of OAuth

---

### HIGH Risk Permissions (Critical -- Must Pass First Review)

#### `<all_urls>` Host Permission

- **Risk Level:** HIGH
- **Why the reviewer will scrutinize it:** `<all_urls>` grants the extension the ability to interact with every website the user visits. It is the single most scrutinized permission in the Chrome Web Store. Google's review team specifically looks for extensions that request `<all_urls>` but do not have a clear, user-facing reason to access every domain.
- **Chrome Web Store install warning triggered:** "Read and change all your data on all websites" -- this is the most alarming permission warning users see, and it also increases reviewer scrutiny proportionally.
- **Why Focus Mode needs it:**
  1. **User-configured blocklist:** Users can add ANY domain to their blocklist. The extension cannot predict which domains they will choose. Without `<all_urls>`, the extension would need to request individual host permissions for each domain, forcing a permission prompt every time a user adds a new site.
  2. **Content script injection:** The detector, blocker, and tracker content scripts must be available on any URL to catch blocked sites before they render.
  3. **declarativeNetRequest dynamic rules:** `declarativeNetRequestWithHostAccess` requires host permissions for the domains targeted by dynamic rules.
- **What the reviewer will look for:**
  - That the extension genuinely interacts with arbitrary domains based on user configuration
  - That content scripts do NOT read, store, or exfiltrate page content
  - That no browsing history, cookies, or form data is accessed
  - That network requests are limited to blocking (not modifying or injecting content)
  - That the privacy policy explicitly addresses the `<all_urls>` permission
  - That all 9 CWS data categories are marked "NOT COLLECTED"
- **Code locations that prove legitimate usage:**
  - `manifest.json` `content_scripts` -- `<all_urls>` match pattern for detector, blocker, tracker
  - `src/content/detector.js` -- only reads `location.hostname`, sends yes/no check to service worker, stores nothing
  - `src/content/blocker.js` -- only writes to DOM (Shadow DOM overlay), never reads page content
  - `src/content/tracker.js` -- tracks elapsed time only, never accesses `document.body`, cookies, or storage of the host page
  - `src/background/service-worker.js` -- `declarativeNetRequest.updateDynamicRules()` creates redirect rules for user-specified domains only
  - `docs/store-assets/privacy/privacy-data-usage.txt` -- all 9 data categories marked NOT COLLECTED
  - `docs/store-assets/privacy/privacy-policy-page.md` -- explicit section on host permissions
- **What to change if rejected:**
  - **Option A (recommended): Dynamic host permissions.** Replace `<all_urls>` with per-domain permission requests via `chrome.permissions.request({origins: ['*://*.example.com/*']})` triggered each time the user adds a new site to their blocklist. This eliminates the blanket permission at install time. Tradeoff: each new blocklist addition triggers a Chrome permission prompt.
  - **Option B: Hybrid approach.** Ship a static ruleset covering the 500 most commonly blocked domains (social media, news, streaming, gaming, shopping) that works without host permissions. Request `<all_urls>` as an optional permission only when the user tries to add a domain not in the static set. This gives most users full functionality without ever needing `<all_urls>`.
  - **Option C: activeTab-only mode.** Use `activeTab` exclusively. When the user clicks the extension icon, check the current tab against the blocklist and inject the block page on that tab only. DNR rules handle background blocking without host permissions for static domains. Tradeoff: the tracker and detector cannot run passively on all pages; functionality is reduced.
  - **Priority recommendation:** Implement Option B before submission as a fallback plan. If rejected for `<all_urls>`, switch to Option B and resubmit within 24 hours.

---

### Combined Risk Profile

| Risk Level | Count | Permissions |
|---|---|---|
| HIGH | 1 | `<all_urls>` |
| MEDIUM | 3 | `declarativeNetRequestWithHostAccess`, `scripting`, `identity` (optional) |
| LOW | 8 | `storage`, `alarms`, `declarativeNetRequest`, `activeTab`, `notifications`, `offscreen`, `idle` (optional), `tabGroups` (optional) |

**Overall rejection risk for permissions: MODERATE.** The single HIGH-risk item (`<all_urls>`) is the primary rejection vector. If the justification text is thorough and the code review confirms no data exfiltration, approval is likely. The MEDIUM-risk items are individually defensible. The combination of `<all_urls>` + `scripting` + 3 content scripts on `<all_urls>` is the pattern that will receive the most scrutiny, because it is also the pattern used by malicious data-harvesting extensions. The key differentiator is that Focus Mode's content scripts provably do not read page content.

---

## 1.2 Privacy Policy Risk Assessment

Focus Mode - Blocker's privacy position is strong for the free tier and requires careful disclosure for the Pro tier. Below is an analysis of every data practice that a CWS reviewer or privacy auditor would examine.

### Free Tier: All Data Stays Local (Strong Position)

| Data Practice | Risk | Assessment |
|---|---|---|
| All settings in `chrome.storage.local` | NONE | Gold standard for privacy. No network, no sync, no servers. |
| Blocklist stored locally | NONE | User-configured, never transmitted. |
| Focus Score calculated locally | NONE | Pure arithmetic on local data. |
| Streak data stored locally | NONE | Date comparisons on local timestamps. |
| Session history stored locally | NONE | Duration records only, no URLs. |
| Timer state in `chrome.storage.session` | NONE | Ephemeral, clears on browser close. |
| No external network requests | NONE | Verifiable by monitoring DevTools Network tab. |
| No analytics SDK | NONE | No Google Analytics, Mixpanel, Amplitude, or any other tracker. |
| No remote code loading | NONE | CSP enforces `script-src 'self'`. |

**Free tier verdict:** Bulletproof privacy position. The privacy policy at `docs/store-assets/privacy/privacy-policy-page.md` correctly states: "The free version of Focus Mode - Blocker uses zero third-party services." This is verifiable and defensible.

### Pro Tier: Disclosures Required

The Pro tier introduces external network communication. Each must be disclosed in the privacy policy and the CWS data usage declaration.

#### Stripe Payment Processing

| Item | Detail |
|---|---|
| **What is sent** | Payment card details, billing email, billing address -- entered by the user on Stripe's hosted checkout page |
| **Where it goes** | Stripe's PCI-compliant infrastructure |
| **What Focus Mode stores** | License validation status (boolean) in `chrome.storage.local` and `chrome.storage.sync`. No card numbers, no billing details. |
| **CWS data category impact** | "Financial and payment information" -- must remain NOT COLLECTED if the extension itself never touches card data (Stripe's hosted page handles it) |
| **Privacy policy disclosure** | PRESENT in `privacy-policy-page.md` under "Third-Party Services > Pro Tier" section. Stripe's privacy policy is linked. |
| **Risk** | LOW -- Standard Stripe checkout is a well-understood pattern. CWS reviewers see it regularly. |

#### License Verification API

| Item | Detail |
|---|---|
| **What is sent** | License key (ZOVO-XXXX-XXXX-XXXX-XXXX format), extension ID, version number |
| **Where it goes** | Zovo API at `https://xggdjlurppfcytxqoozs.supabase.co/functions/v1` |
| **What is NOT sent** | Browsing data, blocklist contents, focus statistics, URLs, session history |
| **Frequency** | On Pro activation, then cached for 24 hours in `chrome.storage.local` with 7-day offline grace period |
| **Privacy policy disclosure** | NEEDS ADDITION -- The current privacy policy does not explicitly mention the license verification API endpoint or what data is sent during verification |
| **Risk** | MEDIUM -- Must disclose that Pro users' extensions make network requests for license verification. Must specify exactly what data is sent. |

**ACTION REQUIRED:** Add a "License Verification" subsection under "Third-Party Services > Pro Tier" in the privacy policy that states:
```
When you activate a Pro license, the extension sends your license key
and extension version to our verification server to confirm your
subscription status. No browsing data, blocklist contents, focus
statistics, or personal information is included in this request.
License status is cached locally for 24 hours to minimize server
communication.
```

#### Sentry Error Reporting (Pro Only)

| Item | Detail |
|---|---|
| **What is sent** | Error messages, stack traces (privacy-scrubbed), extension version, Chrome version, OS, Focus Mode session state (active/inactive, timer running, nuclear mode on/off). NO URLs, NO blocklist contents, NO browsing data. |
| **Where it goes** | Sentry (sentry.io) |
| **Privacy scrubbing** | URLs stripped from stack traces. User-generated content (site names, custom quotes) removed before transmission. See `src/background/error-handler.ts`. |
| **Privacy policy disclosure** | NEEDS ADDITION -- The current privacy policy does not mention Sentry or error reporting |
| **Risk** | MEDIUM -- CWS reviewers specifically look for analytics/telemetry SDKs. Sentry must be disclosed even though it only collects crash data. |

**ACTION REQUIRED:** Add an "Error Reporting" subsection under "Third-Party Services > Pro Tier" in the privacy policy:
```
Pro users may opt in to anonymous error reporting powered by Sentry
(sentry.io). When enabled, crash reports are sent containing: error
message, stack trace (with URLs and personal data removed), extension
version, and browser version. No browsing data, blocklist contents,
or personally identifiable information is included. Error reporting
can be disabled at any time in the extension settings.
```

#### Optional Anonymous Telemetry (Pro Only)

| Item | Detail |
|---|---|
| **What is sent** | Anonymized feature usage events (e.g., "pomodoro_started", "nuclear_mode_activated"), session counts, paywall trigger views. NO identifying information. |
| **Where it goes** | Zovo analytics endpoint |
| **Privacy policy disclosure** | NEEDS ADDITION |
| **Risk** | MEDIUM -- Any telemetry, even anonymous, must be disclosed. The word "anonymous" does not exempt it from disclosure requirements. |

**ACTION REQUIRED:** Add a "Usage Analytics" subsection:
```
Pro users may opt in to anonymous usage analytics that help us improve
the extension. Analytics events contain only feature names and
timestamps (e.g., "focus session started"). No browsing data,
blocklist contents, or personally identifiable information is
collected. Analytics can be disabled at any time in the extension
settings. Free tier users are never subject to any analytics.
```

### `<all_urls>` + Content Scripts = Browsing Data Concern

This is the most sensitive intersection in the privacy review. The combination of:
- Host permission: `<all_urls>` ("can read all your data on all websites")
- 3 content scripts running on `<all_urls>` at `document_start` and `document_idle`

...triggers the browsing data scrutiny pathway. The reviewer will specifically check:

| Concern | Focus Mode's Actual Practice | Evidence |
|---|---|---|
| Does the extension record visited URLs? | NO. `detector.js` extracts `location.hostname`, sends a yes/no check to the service worker, and discards it. No URL is stored in `chrome.storage` or transmitted externally. | `src/content/detector.js` source code |
| Does the extension read page content? | NO. `blocker.js` only writes (Shadow DOM overlay). `tracker.js` only tracks elapsed time. Neither calls `document.body.innerText`, `document.documentElement.innerHTML`, or any content-reading API. | Content script source code |
| Does the extension access cookies? | NO. No calls to `document.cookie` or `chrome.cookies` anywhere in the codebase. | Full codebase grep |
| Does the extension access form data? | NO. No `addEventListener('submit')`, no `input.value` access, no form interception. | Full codebase grep |
| Does the block page expose the blocked URL? | The blocked URL is visible in the browser address bar (the page is overlaid, not navigated away from). The block page overlay receives the domain name for display ("reddit.com is blocked") but this is set via `textContent` and never transmitted. | `src/content/blocker.js` |

### Privacy Policy Completeness Checklist

| Requirement | Status | Location |
|---|---|---|
| Extension name in policy | PRESENT | Title and overview of `privacy-policy-page.md` |
| What data is collected | PRESENT | "Data Collection" section -- explicitly states nothing |
| What data is stored locally | PRESENT | "Local Storage" table with all 9 keys |
| What data is transmitted | PRESENT | "Data Transmission" section |
| Third-party services (free) | PRESENT | "Zero third-party services" |
| Third-party services (Stripe) | PRESENT | "Pro Tier" subsection |
| Third-party services (Sentry) | **MISSING** | Needs addition per above |
| Third-party services (telemetry) | **MISSING** | Needs addition per above |
| License verification disclosure | **MISSING** | Needs addition per above |
| How users can delete data | PRESENT | "Important facts about your local data" |
| Children's privacy (COPPA) | PRESENT | "Children's Privacy" section |
| Contact information | PRESENT | Email, website, GitHub Issues |
| Policy update notification | PRESENT | "Changes to This Policy" section |
| Open source link | PRESENT | GitHub repository link |
| `<all_urls>` explanation | PRESENT | Permissions table in policy |

**Privacy policy risk verdict: 3 disclosures must be added before submission.** The free tier is clean. The Pro tier needs Sentry, telemetry, and license verification disclosures. Without these additions, the privacy policy is technically incomplete, which can trigger a "Misleading or deceptive claims" rejection if a reviewer discovers the undisclosed network requests.

---

## 1.3 Deceptive Functionality Risk

Chrome Web Store Policy section 2.1 (Deceptive Installation Tactics) and 2.2 (Deceptive Behavior) are the most common rejection reasons. This section audits Focus Mode's store listing claims against actual functionality.

### Store Listing Claims Audit

| Claim in Store Listing | True? | Evidence | Risk |
|---|---|---|---|
| "Block distracting websites" | YES | `declarativeNetRequest` dynamic rules redirect blocked domains to block page | NONE |
| "Build focus habits" | YES | Focus Score (0-100), daily streaks, session history, gamification mechanics | NONE |
| "Track your productivity streak" | YES | Streak tracking system with daily reset logic in service worker | NONE |
| "Free Pomodoro timer included" | YES | 25/5 Pomodoro timer available on free tier, no paywall | NONE |
| "10 free sites to block" | YES | Free tier limit is 10 sites in blocklist. Must verify enforcement is exactly 10, not 9 or fewer. | LOW -- verify exact limit |
| "3x more than competing extensions" | NEEDS VERIFICATION | Claim in description.txt. Must confirm competitor limits (LeechBlock: 6 free, StayFocusd: varies). If inaccurate, this is a deceptive claim. | MEDIUM -- verify or remove |
| "$608 per week in lost productivity" | NEEDS SOURCE | Opening line of description.txt cites this statistic. Must have a credible source. Unsourced statistics in CWS listings are risky. | MEDIUM -- add citation or rephrase |
| "23 minutes to fully refocus" | NEEDS SOURCE | Same opening paragraph. This is from the Gloria Mark/UCI study (2008). Defensible but should be attributed. | LOW -- well-known stat |
| "No data collection -- ever" | YES for free tier | True for free tier. For Pro tier with Sentry/telemetry, this statement needs qualification. | MEDIUM -- qualify for Pro |
| "Works 100% offline" | YES for free tier | True for free tier. Pro license verification requires network. | MEDIUM -- qualify for Pro |
| "Open source" | YES | GitHub repo linked: `github.com/theluckystrike/focus-mode-blocker` | NONE -- verify repo is public |
| Nuclear Option "No undo. No workarounds." | YES | Nuclear Mode has 6 tamper-resistance layers per architecture docs. Must verify user CAN still uninstall the extension (CWS requires this). | MEDIUM -- verify uninstall works |

### Pro Feature Disclosure Audit

Pro features must be clearly marked as paid in the store listing to avoid "Deceptive installation" rejections. Users who install expecting free features and hit unexpected paywalls will leave 1-star reviews, which triggers CWS review.

| Pro Feature | Clearly Marked in Listing? | Status |
|---|---|---|
| Unlimited sites (vs. 10 free) | Listed in "FEATURES" section but Pro designation not explicit | **NEEDS FIX** -- add "(Pro)" label |
| 24-hour Nuclear Mode (vs. 1 hour) | Not mentioned in listing | **NEEDS FIX** -- disclose in listing |
| Additional ambient sounds | "3 free focus sounds" implies more exist for Pro | OK -- implicit but honest |
| Cross-device sync | Not mentioned in free listing | OK -- Pro-only feature |
| Advanced scheduling | Not explicitly marked | **NEEDS CLARIFICATION** |
| Sound layering (3 simultaneous) | Not mentioned | OK -- advanced feature |

**ACTION REQUIRED:** Add a clear "FREE vs. PRO" comparison section to the store description, or mark Pro features with "(Pro)" throughout the features list. CWS reviewers check that free-tier users get what the listing promises without encountering undisclosed paywalls.

### Screenshot Accuracy Requirement

CWS Policy requires screenshots to accurately represent the extension's current UI. Violations trigger "Deceptive" rejections.

| Screenshot Requirement | Check |
|---|---|
| Screenshots show actual extension UI, not mockups | Must verify at submission time |
| No features shown that do not exist in submitted version | Must verify |
| Pro features in screenshots marked as Pro | Must verify |
| No competitor logos or names in screenshots | Must verify |
| No misleading statistics or fake data | Must verify (Focus Score, streak numbers in screenshots should be realistic) |

### Block Page Transparency Requirement

CWS reviewers specifically check that content-blocking extensions:
1. Clearly identify themselves on the block page ("Blocked by Focus Mode - Blocker")
2. Provide a way to unblock or navigate away
3. Do not impersonate browser error pages

**Focus Mode status:** The block page design (per `docs/mv3-architecture/agent5-ui-architecture.md`) includes extension branding, motivational quotes, and a "Back to Work" button. It does NOT impersonate a browser error page. This is compliant.

**ACTION ITEM:** Verify the block page includes a visible link to extension settings or an "Unblock this site" option. CWS requires that users can always reverse the extension's actions without needing to go to `chrome://extensions`.

---

## 1.4 Keyword Stuffing Risk

Chrome Web Store Policy prohibits keyword stuffing in the extension name, short description, and long description. Extensions with unnatural keyword density are rejected under "Spam and Placement in the Store" (Policy section 3).

### Extension Name: "Focus Mode - Blocker"

| Check | Result |
|---|---|
| Contains primary keyword ("Blocker") | YES -- appropriate |
| Contains secondary keyword ("Focus Mode") | YES -- appropriate |
| Total word count | 4 words (including separator) |
| Keyword stuffing? | NO -- Clean. Under 45 characters. No keyword repetition. |
| Comparisons to rejected names | "Website Blocker - Block Sites - Focus Timer - Pomodoro - Productivity" would be rejected. "Focus Mode - Blocker" is concise and descriptive. |

**Verdict: CLEAN.** No risk.

### Short Description (132 characters max)

Current text from `short-description.txt`:
> "Block distracting websites, build focus habits, and track your productivity streak. Free Pomodoro timer included."

| Check | Result |
|---|---|
| Character count | 112 characters |
| Under 132 limit? | YES |
| Keyword density | "block" (1x), "focus" (1x), "productivity" (1x), "streak" (1x), "Pomodoro" (1x), "timer" (1x) |
| Keyword stuffing? | NO -- 6 unique keywords in natural sentence structure. No repetition. |
| Reads naturally? | YES -- flows as a coherent sentence |

**Verdict: CLEAN.** No risk. The short description is well-crafted.

### Long Description Density Analysis

Current text from `description.txt` (~2,200 characters):

| Keyword | Count | Density | Acceptable? |
|---|---|---|---|
| "focus" | 14 | ~6.4% of content words | BORDERLINE -- reduce to under 5% |
| "block" / "blocking" / "blocker" | 11 | ~5.0% | BORDERLINE -- at the edge |
| "distract" / "distracting" / "distraction" | 6 | ~2.7% | OK |
| "productivity" / "productive" | 3 | ~1.4% | OK |
| "Pomodoro" | 2 | ~0.9% | OK |
| "timer" | 2 | ~0.9% | OK |
| "streak" | 3 | ~1.4% | OK |

**Verdict: LOW RISK but could be improved.** The "focus" keyword appears 14 times, which is high. While the description reads naturally (each usage is in context), a strict reviewer might flag it. Consider replacing 2-3 instances with synonyms: "concentration," "attention," "flow state."

**Specific recommended changes:**
1. "Focus Mode - Blocker is a free Chrome extension that combines website blocking, gamification, and a built-in Pomodoro timer to help you take back your **attention**." (replace "focus" if present)
2. In the "PERFECT FOR" section, vary the language instead of repeating "focus" in every bullet.

---

## 1.5 Monetization Compliance

Chrome Web Store Policy section 4 governs payments and monetization. Extensions that monetize must follow specific rules.

### Stripe Checkout Compliance

| Requirement | Status | Detail |
|---|---|---|
| External payment via Stripe allowed? | YES | CWS allows external payment processors for subscriptions and one-time purchases since the removal of Chrome Web Store Payments in 2020. |
| No in-extension credit card forms? | COMPLIANT | Focus Mode opens Stripe's hosted checkout page. No card input fields exist within the extension. |
| Pricing clearly disclosed? | NEEDS VERIFICATION | The store listing should mention "Pro: $4.99/mo" or "Premium features available" -- currently the listing focuses on free features. |
| Refund policy disclosed? | NEEDS VERIFICATION | Stripe handles refunds but the terms should be stated in the privacy policy or a linked terms page. |

### No Ad Injection

| Check | Status |
|---|---|
| Extension injects ads into web pages | NO |
| Extension modifies web page content for monetization | NO |
| Extension injects affiliate links or tracking codes | NO |
| Extension replaces existing ads on web pages | NO |
| Block page contains ads | NO |

**Verdict: FULLY COMPLIANT.** No ad-based monetization. No content modification for revenue purposes.

### Pro Feature Gating

| Requirement | Status |
|---|---|
| Free tier is genuinely useful | YES -- 10 sites, Pomodoro timer, Focus Score, streaks, 3 ambient sounds, scheduling |
| Free tier is not "crippled" to force upgrade | YES -- core blocking, timer, and gamification features are fully functional |
| Paywall triggers are non-intrusive | YES -- 10 touchpoints (T1-T10) that appear at natural feature boundaries, not pop-up ads |
| Users can dismiss paywalls | MUST VERIFY -- every paywall modal must have a clear "No thanks" or close button |
| No forced upgrade to continue using installed features | MUST VERIFY -- if a Pro trial expires, previously free features must remain accessible |

### CWS Listing Price Accuracy

| Item | Listed | Actual |
|---|---|---|
| Extension install price | Free | Free |
| "In-app purchases" flag | Should be set to YES | MUST VERIFY in submission |
| Pro monthly | $4.99/mo | $4.99/mo |
| Pro annual | $35.88/yr | $35.88/yr (per publishing checklist) |
| Pro lifetime | $49.99 | $49.99 |

**ACTION REQUIRED:** Ensure the CWS submission form has "Free (with in-app purchases)" selected, not just "Free." Selecting "Free" without the in-app purchase flag when there are paid features is a monetization policy violation.

---

## 1.6 User Data Handling Compliance

This section analyzes every data touchpoint where user information is created, processed, stored, or could theoretically be transmitted.

### Content Scripts on `<all_urls>` -- Data Flow Audit

#### detector.js (runs on every page load)

| Data Touched | What Happens | Stored? | Transmitted? |
|---|---|---|---|
| `location.hostname` | Extracted, `www.` prefix stripped | NO | Sent to service worker via `chrome.runtime.sendMessage` for blocklist check (internal message, not network) |
| `location.href` | Included in CHECK_BLOCKED message payload | NO | Internal message to service worker only |
| `Date.now()` | Timestamp for message | NO | Internal message only |
| Page DOM | NOT ACCESSED | N/A | N/A |
| Cookies | NOT ACCESSED | N/A | N/A |
| Local storage of host page | NOT ACCESSED | N/A | N/A |

**Verdict:** detector.js touches only the URL hostname. The data flows internally (content script to service worker via Chrome messaging) and is never persisted or transmitted externally.

#### blocker.js (runs on blocked pages only)

| Data Touched | What Happens | Stored? | Transmitted? |
|---|---|---|---|
| DOM (write-only) | Creates Shadow DOM overlay with block page UI | N/A (write) | NO |
| `domain` from detector event | Displayed as "reddit.com is blocked" via `textContent` | NO | NO |
| `response.stats` from service worker | Focus Score, streak, time saved -- displayed on block page | Already in `chrome.storage.local` | NO |
| Motivational quotes | Selected from bundled array of 50+ quotes | Bundled in extension | NO |
| Page content of blocked site | NOT READ -- overlay covers it, content loads behind overlay but is not accessed | N/A | N/A |

**Verdict:** blocker.js is write-only to the DOM. It creates an overlay but never reads the underlying page content. All displayed data originates from the extension's own storage.

#### tracker.js (runs on all pages at document_idle)

| Data Touched | What Happens | Stored? | Transmitted? |
|---|---|---|---|
| Elapsed time on page | Timer starts when script loads, reports duration to service worker | Duration added to session aggregate in `chrome.storage.local` (as total seconds, not per-URL) | NO |
| `location.hostname` | Used to classify time as "focused" or "distracted" against blocklist | NO (classification only, hostname discarded) | NO |
| Page visibility state | `document.visibilitychange` listener to pause timer when tab is hidden | NO | NO |
| Page content | NOT ACCESSED | N/A | N/A |

**Verdict:** tracker.js collects time durations only. It uses the hostname for classification but does not store individual URLs. The aggregate "time focused" and "time distracted" metrics stored in `sessionHistory` contain durations and timestamps, never URLs.

### Block Page URL Parameters

| Concern | Status |
|---|---|
| Does the block page URL contain the blocked domain? | NO -- the block page is an overlay injected into the blocked page's DOM, not a separate navigation. The URL bar shows the original blocked domain. |
| Are URL parameters sanitized? | N/A -- no URL parameters are used for the block page. |
| Could the blocked URL be leaked via referrer? | NO -- the overlay prevents navigation to external links. If the user clicks "Back to Work," they navigate using `history.back()` or to the extension's new tab page, not to an external URL that could leak the referrer. |

### Analytics Rolling Window -- Local Only

| Metric | Storage | Retention | External? |
|---|---|---|---|
| Focus Score (0-100) | `chrome.storage.local` key `focusScore` | Rolling 7-day window | NO |
| Streak data | `chrome.storage.local` key `streakData` | Indefinite (current streak + best streak) | NO |
| Session history | `chrome.storage.local` key `sessionHistory` | Rolling 30-day window with automatic cleanup | NO |
| Daily statistics | `chrome.storage.local` key embedded in `sessionHistory` | 30 days | NO |

**Verdict:** All analytics data is local-only with automatic cleanup. The rolling window design means old data is actively deleted, which is a privacy-positive pattern.

### License Validation -- Data Sent to Server

| Field Sent | Purpose | PII? |
|---|---|---|
| License key (ZOVO-XXXX-XXXX-XXXX-XXXX) | Verify subscription status | NO (machine-generated key, not tied to identity without server-side lookup) |
| Extension ID (`focus_mode_blocker`) | Identify which Zovo product | NO |
| Extension version (`1.0.0`) | Compatibility checking | NO |
| Chrome version | Compatibility checking | NO (sent by Sentry, not license verification -- verify) |
| Session ID (from `chrome.storage.session`) | Deduplicate verification requests | NO (random, session-scoped, not persistent) |

**Fields NOT sent during license verification:**
- Blocklist contents
- Focus Score or streak data
- Session history
- URLs or browsing data
- Email address (unless Google Sign-In is used, in which case only the OAuth token is sent)
- Device identifiers

**Verdict:** License validation transmits minimal, non-identifying data. However, if `chrome.identity` is used for Google Sign-In, the OAuth flow does expose the user's Google email to the Zovo server for account creation/lookup. This MUST be disclosed in the privacy policy if implemented.

---

# Section 2: Permission Justification Templates for Focus Mode

The following are complete, copy-pasteable justification texts ready for submission in the Chrome Web Store developer console. Each justification follows Google's preferred format: what the permission does, why the extension needs it specifically, what the extension does NOT do with it, and how the user controls it.

---

## 2.1 `<all_urls>` Host Permission Justification

This is the most critical justification in the entire submission. It must be airtight because `<all_urls>` is the #1 rejection trigger for CWS submissions.

### Ready-to-Submit Justification Text

```
HOST PERMISSION JUSTIFICATION: <all_urls>

WHAT THIS PERMISSION IS USED FOR:

Focus Mode - Blocker is a website blocking extension that lets users
create a personal blocklist of distracting websites. Users can add ANY
website to their blocklist -- social media, news, entertainment,
shopping, or any other domain they find distracting during focus
sessions. The <all_urls> host permission is required because the
extension cannot predict which websites a user will choose to block.

SPECIFIC FUNCTIONALITY REQUIRING THIS PERMISSION:

1. Website Blocking (declarativeNetRequest): The extension uses
   Chrome's declarativeNetRequest API to block navigation to websites
   on the user's personal blocklist. Dynamic blocking rules must be
   applied to any domain the user specifies, which requires host
   access to those domains. Since the blocklist is user-configured
   and can include any domain, <all_urls> is the only viable host
   permission.

2. Block Page Display (Content Scripts): When a user navigates to a
   blocked website, the extension injects a motivational block page
   overlay that replaces the site content with the user's Focus Score,
   current streak, and an encouraging quote. This content script
   injection requires host access to the blocked domain.

3. Site Detection (Content Script): A lightweight detection script
   (under 2KB) checks whether the current page is on the user's
   blocklist by comparing the hostname against the stored list. This
   runs at document_start to prevent any flash of blocked content.

WHAT THIS PERMISSION IS NOT USED FOR:

- The extension does NOT collect, record, or transmit browsing history
- The extension does NOT read or access the content of any web page
- The extension does NOT access cookies, form data, passwords, or
  local storage of any website
- The extension does NOT track which websites the user visits
- The extension does NOT inject ads, tracking pixels, affiliate codes,
  or any third-party content into web pages
- The extension does NOT modify web page content except to display
  the block page overlay on user-specified blocked sites
- The extension makes ZERO external network requests on the free tier

PRIVACY SAFEGUARDS:

- All user data is stored locally on the device via chrome.storage.local
- No browsing data is ever transmitted to external servers
- Content scripts are bundled in the extension package (no remote code)
- The Content Security Policy enforces script-src 'self'
- All 9 Chrome Web Store data categories are declared as NOT COLLECTED
- The complete source code is publicly available for audit

ALTERNATIVE CONSIDERED:

We considered requesting individual host permissions for each domain
the user adds to their blocklist using chrome.permissions.request().
This approach was rejected because:
(a) It would require a Chrome permission prompt every time a user adds
    a new site to their blocklist, severely degrading the user experience
(b) Users expect a website blocker to work immediately when they add a
    site, without additional permission dialogs
(c) The declarativeNetRequestWithHostAccess API requires host
    permissions to be declared for rule targets, and dynamically adding
    host permissions per-site would create race conditions between
    permission grants and rule activation

USER CONTROL:

- Only websites explicitly added by the user to their blocklist are
  affected by the extension
- The extension takes no action on websites outside the user's blocklist
- Users have full control over their blocklist and can add or remove
  sites at any time
- Blocking only activates during user-initiated focus sessions or
  user-configured schedules
- Users can uninstall the extension at any time to remove all effects
```

---

## 2.2 `declarativeNetRequest` + `declarativeNetRequestWithHostAccess`

### Ready-to-Submit Justification Text

```
PERMISSION JUSTIFICATION: declarativeNetRequest +
                          declarativeNetRequestWithHostAccess

WHAT THESE PERMISSIONS ARE USED FOR:

Focus Mode - Blocker uses Chrome's declarativeNetRequest API -- the
Manifest V3 recommended approach for content blocking -- to block
navigation to websites on the user's personal blocklist during active
focus sessions.

declarativeNetRequest: Enables the extension to register declarative
blocking rules that redirect requests to blocked domains to the
extension's local motivational block page. Rules are processed by
Chrome's built-in rule engine at the network layer, which is more
efficient and privacy-preserving than the deprecated webRequest API.

declarativeNetRequestWithHostAccess: Required because the user's
blocklist is configured at runtime. Users add and remove sites from
their blocklist dynamically, and the extension must create
corresponding blocking rules via updateDynamicRules(). Static
rulesets alone are insufficient because they cannot cover every
possible domain a user might want to block.

SPECIFIC API CALLS:

- chrome.declarativeNetRequest.updateDynamicRules() -- called when
  the user modifies their blocklist or starts/stops a focus session
- Rule action: "redirect" to the extension's local block page
- Rule condition: urlFilter matching user-specified domains

WHAT THESE PERMISSIONS ARE NOT USED FOR:

- Not used to modify HTTP headers
- Not used to inject content into web traffic
- Not used to redirect to external URLs (only to extension-local pages)
- Not used to collect or log information about network requests
- Not used to block requests on sites outside the user's blocklist

USER CONTROL:

- The user's blocklist exclusively determines which sites are blocked
- No sites are blocked by default; the user must explicitly configure
  each one
- Users can modify their blocklist at any time
- Blocking only activates during focus sessions or configured schedules
```

---

## 2.3 `scripting` Permission

### Ready-to-Submit Justification Text

```
PERMISSION JUSTIFICATION: scripting

WHAT THIS PERMISSION IS USED FOR:

The scripting permission enables Focus Mode - Blocker to inject three
content scripts that are bundled within the extension package:

1. detector.js (document_start, <2KB): Checks if the current page's
   domain matches the user's blocklist by sending a message to the
   service worker. Contains no DOM manipulation. Immediately exits
   on non-blockable pages (chrome://, about:, extension pages).

2. blocker.js (document_start): Injects a motivational block page
   overlay via Shadow DOM when a site is confirmed as blocked. Displays
   the user's Focus Score, streak data, and an encouraging quote.
   Replaces the blocked page visually without navigating away.

3. tracker.js (document_idle): Tracks elapsed time on pages to
   calculate focus session statistics. Reports aggregate duration
   to the service worker. Does not access page content.

WHAT THIS PERMISSION IS NOT USED FOR:

- No external or remotely-loaded scripts are ever injected
- No use of eval(), new Function(), or dynamic code execution
- No reading or collection of web page content
- No access to cookies, form data, or local storage of host pages
- No modification of page content except the block page overlay on
  user-specified blocked sites
- blocker.js uses textContent exclusively (no innerHTML) to prevent
  XSS when displaying domain names and quotes

SECURITY MEASURES:

- All scripts are bundled in the extension .crx package and reviewed
  during Chrome Web Store submission
- Content Security Policy: script-src 'self'; object-src 'none'
- Content scripts run in Chrome's isolated world, separate from the
  host page's JavaScript context
- all_frames: false -- scripts only inject into the top-level frame

USER CONTROL:

- Content scripts only perform their function on sites that match the
  user's blocklist during active focus sessions
- Users control which sites are on their blocklist
- The extension can be disabled or uninstalled at any time
```

---

## 2.4 `notifications` Permission

### Ready-to-Submit Justification Text

```
PERMISSION JUSTIFICATION: notifications

WHAT THIS PERMISSION IS USED FOR:

Focus Mode - Blocker uses Chrome desktop notifications to keep users
informed about their focus session progress:

1. Focus session ended: Notifies the user when a Pomodoro focus
   period is complete and it is time to take a break
2. Break ended: Notifies the user when a break period is over and
   the next focus session is ready to begin
3. Streak milestones: Celebrates focus streak achievements (e.g.,
   "7-day streak! Keep it up!")
4. Schedule reminders: Alerts the user when a scheduled focus session
   is about to begin

All notifications are generated locally by the extension's service
worker using chrome.notifications.create(). No push notification
server is involved.

WHAT THIS PERMISSION IS NOT USED FOR:

- Never used for promotional, advertising, or marketing messages
- Never used for upselling Pro features
- Never used for notifications unrelated to the user's focus sessions
- No external push notification service is used

USER CONTROL:

- Users can enable or disable notifications in the extension settings
- Users can configure which notification types they receive
- Chrome's built-in notification controls allow muting the extension
- Notification frequency is limited by focus session activity (no
  unsolicited notifications when no session is active)
```

---

## 2.5 `offscreen` Permission

### Ready-to-Submit Justification Text

```
PERMISSION JUSTIFICATION: offscreen

WHAT THIS PERMISSION IS USED FOR:

Focus Mode - Blocker plays ambient focus sounds (rain, cafe ambiance,
white noise) during focus sessions to help users concentrate. In
Manifest V3, service workers cannot access the Web Audio API or
HTMLAudioElement directly. The offscreen permission allows the
extension to create an offscreen document specifically for audio
playback.

SPECIFIC API USAGE:

- chrome.offscreen.createDocument() with reason: AUDIO_PLAYBACK
- The offscreen document plays locally-bundled audio files only
- Audio playback is controlled via message passing from the service
  worker (play, pause, volume, track selection)
- The offscreen document is created on demand when the user starts
  ambient sounds and destroyed when sounds are stopped or the focus
  session ends

WHAT THIS PERMISSION IS NOT USED FOR:

- The offscreen document is not used for any purpose other than
  audio playback
- No external audio files are loaded or streamed
- No DOM APIs are accessed for data collection
- No network requests are made from the offscreen document

USER CONTROL:

- Users choose whether to enable ambient sounds
- Users select which sound to play and control the volume
- Sound playback stops automatically when focus sessions end
- The feature is entirely optional; the extension functions fully
  without it
```

---

## 2.6 `activeTab` Permission

### Ready-to-Submit Justification Text

```
PERMISSION JUSTIFICATION: activeTab

WHAT THIS PERMISSION IS USED FOR:

The activeTab permission provides temporary access to the currently
active tab when the user interacts with the extension (clicks the
toolbar icon or uses a keyboard shortcut). Focus Mode - Blocker uses
this to:

1. Quick Focus feature: When the user clicks the extension icon,
   the popup reads the current tab's URL to show whether the site
   is on the blocklist and to offer one-click "Block this site"
   functionality
2. Contextual popup display: The popup shows the current site's
   block status (blocked/allowed) based on the active tab's domain

WHAT THIS PERMISSION IS NOT USED FOR:

- No background monitoring of tab URLs
- No access to tabs other than the currently active tab
- No recording, logging, or transmission of visited URLs
- No tracking of browsing activity over time
- Permission only activates when the user explicitly interacts with
  the extension

USER CONTROL:

- activeTab only grants access during the user's explicit interaction
- Access expires when the user navigates away or switches tabs
- No persistent or background access to any tab
```

---

## 2.7 `storage` and `alarms`

### Ready-to-Submit Justification Text for `storage`

```
PERMISSION JUSTIFICATION: storage

WHAT THIS PERMISSION IS USED FOR:

The storage permission is required to persist all user data locally
on the device using chrome.storage.local. Focus Mode - Blocker stores:

- blocklist: The user's list of websites to block during focus sessions
- settings: User preferences (timer durations, sound choices, theme,
  notification settings)
- focusScore: Productivity score (0-100) calculated locally
- streakData: Current and best daily focus streak
- sessionHistory: Focus session durations and completion status
  (rolling 30-day window)
- timerState: Current Pomodoro timer state for persistence across
  service worker restarts
- soundPreferences: Selected ambient sounds and volume settings
- schedules: User-configured automatic blocking schedules
- proLicense: Pro tier license validation status (boolean)

All data is stored exclusively in chrome.storage.local on the user's
device. No data is transmitted to external servers. No data is synced
to cloud services on the free tier.

USER CONTROL:

- Users can clear all extension data via the extension settings
- Uninstalling the extension deletes all stored data
- Users have full control over every stored value through the UI
```

### Ready-to-Submit Justification Text for `alarms`

```
PERMISSION JUSTIFICATION: alarms

WHAT THIS PERMISSION IS USED FOR:

The alarms permission powers all time-based functionality in Focus
Mode - Blocker:

1. Pomodoro timer: chrome.alarms ensures accurate countdowns even
   when the popup is closed and the service worker is idle. Alarms
   fire to transition between focus and break periods.
2. Scheduled blocking: Users can configure automatic focus schedules
   (e.g., "Block social media weekdays 9am-5pm"). Alarms trigger
   the start and end of scheduled sessions.
3. Periodic maintenance: Daily streak recalculation, session history
   cleanup, and storage quota checks run on alarm-based intervals.

In Manifest V3, service workers can be terminated at any time by
Chrome. The alarms API is the officially recommended mechanism for
scheduling future events that must survive service worker termination.
setInterval and setTimeout do not persist across terminations.

WHAT THIS PERMISSION IS NOT USED FOR:

- Not used to track user behavior or browsing activity
- Not used to send data when alarms fire
- Not used for marketing or engagement notifications (notifications
  permission handles user alerts separately)

USER CONTROL:

- Users start and stop Pomodoro timers manually
- Users configure their own schedules and can disable them at any time
- All timer and schedule settings are fully user-controlled
```

---

## 2.8 Optional Permissions (`identity`, `idle`, `tabGroups`)

### Ready-to-Submit Justification Text for `identity` (optional)

```
PERMISSION JUSTIFICATION: identity (OPTIONAL -- requested on demand)

This permission is listed as optional and is NEVER requested at
install time. It is only requested when the user explicitly chooses
to sign in with their Google account for Pro tier features.

WHAT THIS PERMISSION IS USED FOR:

- Authenticate the user's Pro license via Google Sign-In using
  chrome.identity.getAuthToken()
- Enable encrypted cross-device sync of settings and blocklist
  for Pro subscribers

WHEN IT IS REQUESTED:

- Only when the user clicks "Sign in with Google" or "Upgrade to Pro"
  and confirms the Google OAuth consent screen
- Free tier users are NEVER prompted for this permission

WHAT THIS PERMISSION IS NOT USED FOR:

- No access to Google account data beyond the authentication token
- No access to Gmail, Drive, Calendar, or any other Google service
- No sharing of identity information with third parties

USER CONTROL:

- Users explicitly trigger the permission request by choosing to
  sign in
- Users can revoke the permission at any time via chrome://extensions
- Revoking the permission disables sync but does not affect local
  extension functionality
```

### Ready-to-Submit Justification Text for `idle` (optional)

```
PERMISSION JUSTIFICATION: idle (OPTIONAL -- requested on demand)

This permission is listed as optional and is NEVER requested at
install time. It is only requested when the user enables the
"Auto-pause when idle" setting.

WHAT THIS PERMISSION IS USED FOR:

- Detect when the user is idle (away from keyboard) to automatically
  pause the focus timer, preventing inflated focus time statistics
- Resume the focus timer when the user returns to their computer
- Uses chrome.idle.queryState() and chrome.idle.onStateChanged

WHAT THIS PERMISSION IS NOT USED FOR:

- Not used to track or record when the user is idle for analytics
- Not used to transmit idle state information to any server
- Not used for any purpose other than timer pause/resume

USER CONTROL:

- The user must explicitly enable auto-pause in settings to trigger
  the permission request
- The user can disable auto-pause at any time
- The idle detection threshold is configurable by the user
```

### Ready-to-Submit Justification Text for `tabGroups` (optional)

```
PERMISSION JUSTIFICATION: tabGroups (OPTIONAL -- requested on demand)

This permission is listed as optional and is NEVER requested at
install time. It is only requested when the user enables the
"Organize tabs during focus" setting.

WHAT THIS PERMISSION IS USED FOR:

- Automatically group tabs containing blocked-site URLs into a
  collapsed tab group during focus sessions to reduce visual clutter
- Ungroup and restore tabs to their original state when focus
  sessions end

WHAT THIS PERMISSION IS NOT USED FOR:

- Not used to read tab content
- Not used to access URLs beyond what is already available via other
  granted permissions
- Not used to permanently modify the user's tab arrangement

USER CONTROL:

- The user must explicitly enable tab organization to trigger the
  permission request
- Tab groups are automatically restored when focus sessions end
- The feature can be disabled at any time in settings
```

---

## 2.9 Single-Purpose Description for Focus Mode

Chrome Web Store requires every extension to have a clearly stated single purpose. All features must serve this purpose. This is critical because a "Single purpose violation" rejection requires reframing the entire extension.

### Ready-to-Submit Single-Purpose Description

```
SINGLE PURPOSE:

Focus Mode - Blocker serves a single purpose: blocking distracting
websites and helping users build focused work habits.

Every feature in the extension directly supports this single purpose:

- Website Blocking: The core functionality. Users specify which
  websites distract them, and the extension blocks access to those
  sites during focus sessions using Chrome's declarativeNetRequest API.

- Pomodoro Timer: Provides structured focus sessions (25 minutes of
  work, 5 minutes of break) that determine when website blocking is
  active. The timer is the mechanism that activates and deactivates
  the blocker.

- Focus Score (0-100): A productivity metric that measures how
  effectively the user avoids distracting websites during focus
  sessions. It incentivizes consistent use of the blocker.

- Streak Tracking: Records consecutive days of completing focus
  sessions. Streaks motivate users to maintain their website blocking
  habit over time.

- Nuclear Mode: A time-locked maximum-blocking mode for when users
  need zero access to distracting sites. It is the most aggressive
  form of website blocking the extension offers.

- Ambient Sounds: Background audio (rain, cafe, white noise) that
  helps users enter and maintain a focused state while the blocker
  is active. Ambient sounds play only during focus sessions.

- Scheduled Blocking: Automatic activation of website blocking at
  user-configured times (e.g., work hours). Ensures the blocker is
  active when the user needs it without manual activation.

- Motivational Block Page: Replaces blocked website content with
  the user's Focus Score, streak, and an encouraging quote. Turns
  a negative experience (being blocked) into positive reinforcement
  for the focus habit.

All features work together as a unified system: the blocker removes
distractions, the timer structures focus time, the gamification
(score, streaks) builds the habit, and the ambient sounds support
the environment. There is no feature in the extension that is
unrelated to blocking distractions and building focus habits.
```

### Why This Single-Purpose Framing Works

The CWS review team rejects extensions that appear to bundle unrelated functionality. Focus Mode could be flagged for "feature creep" if the reviewer sees: website blocker + timer + gamification + audio player + tab organizer. The key to avoiding rejection is framing every feature as a component of one system:

| Feature | How It Serves the Single Purpose |
|---|---|
| Website blocking | IS the single purpose |
| Pomodoro timer | Controls WHEN blocking is active |
| Focus Score | Measures HOW WELL blocking works |
| Streaks | Motivates CONSISTENT blocking |
| Nuclear Mode | MAXIMUM blocking intensity |
| Ambient sounds | Supports the ENVIRONMENT for focused blocking |
| Scheduled blocking | AUTOMATES blocking activation |
| Block page | REINFORCES the blocking habit |
| Tab groups | REDUCES visual distraction (extends blocking to tab UI) |

**If rejected for single-purpose violation:** Remove ambient sounds and tab groups from the required feature set. These are the most tangential features. Reframe the extension as purely "website blocking with gamification" and make sounds/tab groups Pro-only features that can be described as "focus environment enhancements" in a future update after the base extension is approved.

---

## Appendix A: Pre-Submission Checklist

Before clicking "Submit for Review," verify every item below:

### Privacy Policy (3 additions required)

- [ ] Add Sentry error reporting disclosure to privacy policy
- [ ] Add anonymous telemetry disclosure to privacy policy
- [ ] Add license verification API disclosure to privacy policy
- [ ] Deploy updated privacy policy to https://zovo.one/privacy/focus-mode-blocker
- [ ] Verify privacy policy URL is live and accessible

### Store Listing (corrections needed)

- [ ] Verify "3x more than competing extensions" claim accuracy
- [ ] Add source or rephrase "$608 per week" statistic
- [ ] Add "(Pro)" labels to Pro features in description
- [ ] Reduce "focus" keyword density from 14 to ~10 instances
- [ ] Set CWS pricing to "Free (with in-app purchases)"
- [ ] Verify all 5 screenshots match actual current UI

### Permissions

- [ ] Paste `<all_urls>` justification into CWS submission form
- [ ] Paste individual justifications for all 8 required permissions
- [ ] Verify optional permissions are NOT in required permissions array
- [ ] Verify `content_scripts` matches pattern is `<all_urls>` (matches host_permissions)

### Block Page Compliance

- [ ] Block page shows "Blocked by Focus Mode - Blocker" branding
- [ ] Block page has visible "Back to Work" or navigation option
- [ ] Block page does NOT impersonate browser error pages
- [ ] Block page has link to extension settings or unblock option
- [ ] Nuclear Mode still allows extension uninstall (CWS requirement)

### Code Compliance

- [ ] No `eval()` or `new Function()` anywhere in codebase
- [ ] No remote code loading (fetch of .js files)
- [ ] No `innerHTML` with user-generated content
- [ ] CSP set to `script-src 'self'; object-src 'none'`
- [ ] No `console.log` statements in production build
- [ ] All content scripts under size budgets (detector <2KB, others <50KB)

### Data Usage Declaration

- [ ] All 9 CWS data categories marked NOT COLLECTED
- [ ] All 3 certifications checked (no selling data, no unrelated transfers, no creditworthiness)
- [ ] Remote code declaration: "This extension does not use remote code"

### Fallback Plan

- [ ] Option B (hybrid static+dynamic blocking without `<all_urls>`) spec is ready
- [ ] Can switch to per-domain `chrome.permissions.request()` within 24 hours if rejected
- [ ] Alternative privacy policy version without `<all_urls>` is drafted

---

## Appendix B: Rejection Response Templates

If Focus Mode is rejected, use these templates to respond to the Chrome Web Store review team.

### Template: Rejected for "Broad Host Permissions"

```
Subject: Appeal -- Focus Mode - Blocker -- Host Permission Justification

Dear Chrome Web Store Review Team,

Thank you for reviewing Focus Mode - Blocker. I understand the concern
regarding the <all_urls> host permission and would like to provide
additional context.

Focus Mode - Blocker is a website blocking extension that allows users
to create a personal blocklist of distracting websites. The <all_urls>
permission is required because users can add any domain to their
blocklist, and the extension must be able to apply declarativeNetRequest
blocking rules and inject the block page overlay on those domains.

Key facts about our use of this permission:

1. We collect ZERO user data. All 9 Chrome Web Store data categories
   are declared as NOT COLLECTED.

2. Our content scripts do not read page content. detector.js only
   checks the hostname against the blocklist. blocker.js only writes
   a Shadow DOM overlay. tracker.js only measures elapsed time.

3. We make zero external network requests on the free tier. The
   extension works entirely offline.

4. Our source code is publicly available at:
   https://github.com/theluckystrike/focus-mode-blocker

5. Our Content Security Policy (script-src 'self') prevents any
   remote code execution.

I have also prepared a detailed justification document that maps each
permission to specific code locations and API calls. I am happy to
provide this or answer any specific questions about our implementation.

If the <all_urls> permission cannot be approved, I am prepared to
submit an updated version that uses per-domain permission requests
via chrome.permissions.request() within 24 hours.

Thank you for your time.

Best regards,
[Developer Name]
Zovo — https://zovo.one
```

### Template: Rejected for "Single Purpose Violation"

```
Subject: Appeal -- Focus Mode - Blocker -- Single Purpose Clarification

Dear Chrome Web Store Review Team,

Thank you for your review. I would like to clarify the single purpose
of Focus Mode - Blocker.

The extension's single purpose is: blocking distracting websites and
helping users build focused work habits.

Every feature serves this purpose directly:

- Website Blocking: The core functionality (declarativeNetRequest)
- Pomodoro Timer: Controls when blocking is active
- Focus Score: Measures blocking effectiveness
- Streaks: Motivates consistent blocking behavior
- Block Page: Reinforces the blocking habit with encouragement
- Ambient Sounds: Supports the focused environment during blocking
- Schedules: Automates blocking activation at configured times

These features work as a unified system, not as separate tools bundled
together. The timer activates the blocker, the score measures the
blocker's impact, the streaks motivate continued blocker use, and the
sounds support the environment while the blocker is active.

I am happy to provide additional clarification or adjust the store
listing to make this single-purpose framing more explicit.

Best regards,
[Developer Name]
Zovo — https://zovo.one
```

### Template: Rejected for "Privacy Policy Non-Compliance"

```
Subject: Appeal -- Focus Mode - Blocker -- Privacy Policy Update

Dear Chrome Web Store Review Team,

Thank you for identifying the privacy policy gap. I have updated the
privacy policy at https://zovo.one/privacy/focus-mode-blocker to
address the identified issue.

Specifically, the following changes were made:
[List specific changes based on the rejection reason]

The updated policy is now live at the URL above. I have verified it
accurately reflects all data practices of the extension, including:

- All local storage usage
- All third-party services (Stripe for payments, Sentry for crash
  reporting on Pro tier, optional anonymous analytics on Pro tier)
- All network requests made by the extension
- Complete user data deletion procedures

I have resubmitted the extension with version [X.X.X] containing no
code changes (policy-only update).

Best regards,
[Developer Name]
Zovo — https://zovo.one
```

---

*Phase 13 -- Agent 1: Rejection Risk Assessment & Permission Justification Templates -- Complete*
*Focus Mode - Blocker v1.0.0 | February 11, 2026*
