# Section 3: Appeal Process for Focus Mode - Blocker

> **Extension:** Focus Mode - Blocker v1.0.0 (MV3)
> **Publisher:** Zovo
> **ID:** Assigned upon submission
> **GitHub:** https://github.com/theluckystrike/focus-mode-blocker

---

## 3.1 Pre-Appeal Assessment Framework

Before drafting any appeal, complete every item in this checklist. Skipping this step is the single most common reason appeals fail. Google reviewers can tell when a developer has not actually read the policy.

### 3.1.1 Identify the Exact Policy Violated

The rejection email from Chrome Web Store will reference one or more of the following. Map each citation to its canonical policy document:

| Rejection Phrase in Email | Actual Policy | Document URL |
|---|---|---|
| "Excessive permissions" | Extensions Quality Guidelines, Section 2 — Permissions | https://developer.chrome.com/docs/webstore/program-policies/permissions |
| "Not complying with the host permissions policy" | Host Permissions Policy | https://developer.chrome.com/docs/webstore/program-policies/host-permissions |
| "Privacy policy requirements" | User Data Policy | https://developer.chrome.com/docs/webstore/program-policies/user-data |
| "Single purpose" | Extensions Quality Guidelines, Section 1 — Single Purpose | https://developer.chrome.com/docs/webstore/program-policies/quality-guidelines |
| "Deceptive installation tactics" or "Deceptive functionality" | Deceptive Installation Tactics / Deceptive Behavior | https://developer.chrome.com/docs/webstore/program-policies/deceptive-behavior |
| "Minimum functionality" | Spam and Placement, Minimum Functionality | https://developer.chrome.com/docs/webstore/program-policies/spam-and-abuse |
| "Impersonation" or "Repetitive content" | Spam and Placement | https://developer.chrome.com/docs/webstore/program-policies/spam-and-abuse |

**Action:** Open the exact URL. Read the full section. Highlight the specific sentence the reviewer likely applied. Do not guess.

### 3.1.2 Self-Audit: Does Focus Mode Actually Violate?

For each permission Focus Mode requests, answer honestly whether the permission is strictly required for core functionality. If the answer is "no" or "partially," fix the extension before appealing.

#### `<all_urls>` (via `host_permissions`)

- **Why Focus Mode needs it:** The declarativeNetRequest API requires host permissions to match and block URLs the user has added to their blocklist. Users can block any website, so the extension must be able to match any host. Additionally, the content script must inject the custom block page on any domain the user has configured.
- **Does it actually violate?** Likely no, but reviewers flag it because `<all_urls>` is the broadest possible host permission. The justification is strong: a website blocker that cannot match arbitrary URLs cannot function. DeclarativeNetRequest is the privacy-preserving API Google recommends over webRequest.
- **Evidence to prepare:** (a) Show that declarativeNetRequest rules are created dynamically from the user's blocklist, not hardcoded. (b) Show that no browsing data, history, or page content is read or transmitted. (c) Show that the content script only activates on blocked pages to display the block overlay.

#### `storage`

- **Why Focus Mode needs it:** Persists user settings, blocklist, Pomodoro state, focus score history, and streak data locally via `chrome.storage.local`. Pro tier uses `chrome.storage.sync` for cross-device sync.
- **Does it actually violate?** No. This is one of the most commonly used permissions and is rarely flagged alone.
- **Evidence to prepare:** List the specific keys stored and their data types. No personal data, no browsing history, no credentials.

#### `alarms`

- **Why Focus Mode needs it:** Pomodoro timer uses `chrome.alarms` for reliable background timing. Focus session start/end triggers use alarms. Streak reset checks run on a daily alarm.
- **Does it actually violate?** No. Standard usage for any timer-based extension.
- **Evidence to prepare:** List each alarm by name and its purpose.

#### `declarativeNetRequest`

- **Why Focus Mode needs it:** Core blocking engine. Adds dynamic rules to block URLs on the user's blocklist. This is the MV3-recommended replacement for webRequest blocking.
- **Does it actually violate?** No. This is the correct API for a website blocker under MV3.
- **Evidence to prepare:** Show rule creation code. Show that rules only contain user-specified domains, not hardcoded tracking or ad domains.

#### `declarativeNetRequestWithHostAccess`

- **Why Focus Mode needs it:** Required in conjunction with `<all_urls>` host permissions to allow declarativeNetRequest to operate on any user-specified domain.
- **Does it actually violate?** No, but it amplifies the reviewer's concern about `<all_urls>`. Must be justified together.
- **Evidence to prepare:** Same as `<all_urls>` above. The two permissions are inseparable for this use case.

#### `activeTab`

- **Why Focus Mode needs it:** Used when the user clicks the extension icon to check whether the current tab's URL is on the blocklist and to display the popup with contextual status for that tab.
- **Does it actually violate?** No. `activeTab` is the least-privilege alternative to broad tab access. It only grants access to the current tab upon explicit user action.
- **Evidence to prepare:** Show that Focus Mode does NOT request the `tabs` permission for background tab monitoring.

#### `scripting`

- **Why Focus Mode needs it:** Injects the block page overlay into tabs that navigate to blocked URLs. The content script replaces the page content with the Focus Mode block screen showing the motivational message, timer, and options.
- **Does it actually violate?** Potentially flagged, but justified. The scripting API is needed to programmatically inject content scripts on matched blocked pages. Without it, the block page cannot be displayed.
- **Evidence to prepare:** Show the content script source code. Show that it only runs on blocked domains. Show that it does not read, collect, or transmit any page content from the blocked site.

#### `notifications`

- **Why Focus Mode needs it:** Notifies the user when a Pomodoro session ends, when a focus session starts or completes, when a streak milestone is reached, and when Nuclear Mode is about to expire.
- **Does it actually violate?** No, but reviewers may question whether notifications are essential. The answer is yes: a focus timer that cannot notify the user when time is up fails its core purpose.
- **Evidence to prepare:** List every notification trigger and its user-facing purpose. Show notification content (no ads, no marketing, no external links).

#### `offscreen`

- **Why Focus Mode needs it:** Plays audio (white noise, focus sounds, session-end chime) via an offscreen document, since MV3 service workers cannot access the Audio API directly.
- **Does it actually violate?** No. This is the documented MV3 pattern for audio playback.
- **Evidence to prepare:** Show the offscreen document source. Show that it only handles audio playback and nothing else.

### 3.1.3 Evidence Preparation Checklist

Gather all of the following before writing your appeal:

- [ ] Screenshot of the full rejection email, including the case/reference number
- [ ] The exact policy URL cited in the rejection
- [ ] Your extension's `manifest.json` with every permission annotated with its justification
- [ ] Screenshots of the extension in use: popup, block page, settings, Pomodoro timer, notifications
- [ ] Code snippets (or GitHub permalink URLs) for each permission's usage
- [ ] Privacy policy URL (must be live and accessible)
- [ ] Link to GitHub repository (public, so the reviewer can verify)
- [ ] Brief video (optional but powerful): 60-second screen recording showing the extension's normal operation, demonstrating that each permission is used for its stated purpose
- [ ] Comparison references: links to 2-3 similar published extensions (e.g., BlockSite, StayFocusd, LeechBlock) that use the same permissions

### 3.1.4 Fix-First Strategy

**Rule:** Never appeal a rejection you can fix. Appeals are for disagreements, not for buying time.

| Likely Rejection Reason | Fix Before Appealing |
|---|---|
| Privacy policy missing or incomplete | Write and publish the privacy policy. Update the listing. |
| `<all_urls>` without justification in description | Add a "Permissions Justification" section to the extension description. |
| Excessive permissions | Remove any permission you cannot justify in one sentence. |
| Deceptive premium features | Ensure the free tier is fully functional. Add clear disclosure of Pro features in the listing description and in the extension UI before any paywall screen. |
| Single purpose violation | Rewrite the description to frame every feature under the single purpose of "website blocking and focus management." |
| Missing or broken functionality | Fix bugs. Test on a clean Chrome profile. Submit a working build. |

After fixing, resubmit. If the same rejection recurs, then appeal.

---

## 3.2 Step-by-Step Appeal Guide for Focus Mode

### Step 1: Read the Rejection Email Carefully

**Where to find it:** Google sends rejection notices to the email associated with your Chrome Web Store developer account. Also check the Developer Dashboard at https://chrome.google.com/webstore/devconsole — the item's status will show "Rejected" with a linked explanation.

**What to extract:**
- The specific policy or policies cited (there may be more than one)
- Any quoted text or specific language about what triggered the rejection
- The reference/case number (format: usually a long numeric ID)
- Whether this is an initial rejection (pre-publication) or a takedown (post-publication)

**Focus Mode note:** As a new developer submitting your first extension, expect stricter scrutiny. New accounts have no track record, so reviewers apply more caution. This is normal and not a sign of bias.

### Step 2: Map the Rejection to Focus Mode's Specific Code and Features

Use the table from Section 3.1.1 to identify the policy. Then map it to the exact part of Focus Mode's codebase:

| Policy Area | Focus Mode Code Location | Feature Affected |
|---|---|---|
| `<all_urls>` / Host permissions | `manifest.json` -> `host_permissions`; `src/background/rules.js` (dynamic rule creation) | Blocklist URL matching |
| Privacy / User data | `src/background/storage.js`; `src/background/analytics.js` (Pro only); privacy policy page | All data handling |
| Deceptive functionality | `src/popup/popup.js` (free vs. Pro UI gating); `src/popup/upgrade.js` | Freemium model |
| Excessive permissions — scripting | `src/content/block-page.js`; `manifest.json` -> `permissions` | Block page injection |
| Excessive permissions — notifications | `src/background/notifications.js` | Session alerts |
| Single purpose | All features in `manifest.json` description; store listing | Entire extension |

### Step 3: Fix the Issue If Needed

Refer to the fix-first table in Section 3.1.4. Make the code or listing change. Increment the version number in `manifest.json`. Test on a clean Chrome profile (no other extensions, fresh user data). Confirm all features work.

**Specific fixes for common Focus Mode rejections:**

**If `<all_urls>` was rejected:**
- Add a "Why This Extension Needs Broad Host Access" section to the Chrome Web Store description.
- Add a `_locales/en/permissions.md` or equivalent in-extension explanation.
- Consider whether you can use optional host permissions for the content script injection, requesting `<all_urls>` only at the point of adding a site to the blocklist, while keeping declarativeNetRequest with required `<all_urls>` (since DNR needs it at rule creation time).

**If privacy policy was rejected:**
- Ensure the privacy policy URL in the Developer Console is live, not behind authentication, and not a 404.
- Ensure the policy explicitly mentions: (a) what data is collected, (b) how it is stored, (c) whether it is transmitted, (d) third parties (Sentry, Stripe for Pro), (e) user rights.
- Host the privacy policy on a stable URL: GitHub Pages, your own domain, or a Notion public page.

**If deceptive functionality was rejected:**
- Audit every screen where free users encounter a Pro feature. Ensure a clear label ("Pro Feature") is visible before the user taps/clicks.
- Ensure the free tier is genuinely useful: 10 blocked sites, full Pomodoro timer, daily stats, Focus Score, streaks. Verify these all work without Pro.
- Remove any countdown timers, urgency language, or "limited time offer" wording from upgrade prompts.

**If single purpose was rejected:**
- Rewrite the store listing description to lead with the single purpose: "Focus Mode - Blocker helps you stay focused by blocking distracting websites."
- Frame every feature as a component of that purpose: "Pomodoro timer structures your focus sessions," "Focus Score tracks your blocking discipline," "Streaks motivate consistent focus habits."

### Step 4: Prepare the Evidence Package

Compile the following into a single document or set of clearly labeled attachments:

1. **Permission justification table** — one row per permission, with columns: Permission | Why Needed | Code Reference | What It Does NOT Do
2. **Screenshots** — annotated screenshots of: (a) the popup in free mode, (b) the popup in Pro mode, (c) the block page, (d) the settings page, (e) a notification, (f) the Pomodoro timer active
3. **Code references** — GitHub permalink URLs to the specific files that use each permission
4. **Privacy policy** — the live URL plus a PDF backup in case the URL is temporarily down
5. **Comparison** — links to 2-3 published extensions with similar permissions (BlockSite, StayFocusd, LeechBlock NG) and a brief note that they use the same permission pattern

### Step 5: Submit the Appeal via Developer Console

1. Go to https://chrome.google.com/webstore/devconsole
2. Select the rejected item (Focus Mode - Blocker)
3. Click "Appeal" or "Contact Us" (the exact button label changes; look for it in the item's status section or in the rejection notification area)
4. If the dashboard does not show an appeal link, use the Chrome Web Store Developer Support form: https://support.google.com/chrome_webstore/contact/one_stop_support
5. Select "I want to appeal a rejection" as the issue type
6. Paste your appeal text (use the templates from Section 3.3)
7. Attach supporting evidence (screenshots, links)
8. Submit

**Important:** Only submit one appeal per rejection. Submitting multiple appeals for the same rejection can delay processing and flag your account.

### Step 6: Wait and Monitor

- **Expected response time:** 3-7 business days for initial review of the appeal. Can extend to 2-3 weeks during busy periods (January after holidays, major Chrome release cycles).
- **Where to check:** The Developer Console item status, and the email on file.
- **What happens next:** Either (a) the appeal is approved and you are invited to resubmit, (b) the appeal is denied with additional explanation, or (c) silence beyond 3 weeks, in which case escalate (see Section 3.4).

---

## 3.3 Appeal Templates Pre-Written for Focus Mode

Each template below is complete and ready to copy-paste. Replace bracketed placeholders `[like this]` with your actual values before sending.

---

### Template 1: `<all_urls>` Permission Rejection

**Subject:** Appeal — Focus Mode - Blocker (ID: [EXTENSION_ID]) — Host Permission Justification

**Body:**

```
Dear Chrome Web Store Review Team,

I am writing to appeal the rejection of Focus Mode - Blocker (ID: [EXTENSION_ID],
version [VERSION]) on the grounds of broad host permissions (<all_urls>). I have
carefully reviewed the Host Permissions policy and believe this extension's use of
<all_urls> is both necessary and consistent with policy requirements. I provide a
detailed justification below.

WHAT FOCUS MODE - BLOCKER DOES

Focus Mode - Blocker is a Manifest V3 website blocker that helps users stay focused
by blocking distracting websites they have personally added to a blocklist. Users
define their own list of sites to block. The extension then prevents navigation to
those sites during focus sessions using Chrome's declarativeNetRequest API.

WHY <all_urls> IS REQUIRED

1. DeclarativeNetRequest Dynamic Rules: Focus Mode uses the chrome.declarativeNetRequest
   API to create blocking rules at runtime based on the user's custom blocklist. Because
   users can add ANY website to their blocklist (e.g., social media, news, video streaming,
   or any other domain), the extension must have host permission covering all URLs. A
   website blocker that can only block a predefined set of domains cannot fulfill its core
   purpose. The rules are created in src/background/rules.js using
   chrome.declarativeNetRequest.updateDynamicRules(). Each rule matches a single
   user-specified domain and redirects or blocks navigation to it.

2. Content Script Injection for Block Page: When a user navigates to a blocked site,
   Focus Mode injects a content script (src/content/block-page.js) that replaces the
   page content with a branded block screen. This screen shows the user a motivational
   message, the remaining time in their focus session, and an option to return to
   productive work. The scripting API requires host permissions to inject on the matched
   domain. Since blocked domains are user-defined and arbitrary, <all_urls> is the only
   viable host permission.

WHAT FOCUS MODE DOES NOT DO WITH THIS PERMISSION

- Does NOT read, collect, or transmit any content from any web page
- Does NOT access browsing history
- Does NOT monitor or log which websites the user visits
- Does NOT inject scripts on any page that is not on the user's personal blocklist
- Does NOT send any URL data to external servers (free tier is entirely local;
  Pro tier telemetry is opt-in and contains only anonymized usage metrics, never URLs)
- Does NOT use webRequest or webRequestBlocking (the legacy, less-private APIs)

PRIVACY SAFEGUARDS

- The extension uses declarativeNetRequest, which is the privacy-preserving blocking
  API recommended by Google for Manifest V3. Unlike webRequest, it does not give the
  extension access to request content or headers.
- All blocklist data is stored locally via chrome.storage.local.
- The complete source code is available at https://github.com/theluckystrike/focus-mode-blocker
  for your review.
- The privacy policy is published at [PRIVACY_POLICY_URL].

COMPARABLE PUBLISHED EXTENSIONS

The following published Chrome Web Store extensions use the same <all_urls> host
permission pattern for the same purpose (user-defined website blocking):

- BlockSite: https://chrome.google.com/webstore/detail/blocksite/eiimnmioipafcokbfikbljfdeojpcgbh
- StayFocusd: https://chrome.google.com/webstore/detail/stayfocusd/laankejkbhbdhmipfmgcngdelahlfoji
- LeechBlock NG: https://chrome.google.com/webstore/detail/leechblock-ng/blaaajhemilngeeffpbfkdjjoceejf

These extensions demonstrate that <all_urls> is the established and accepted
permission model for user-configurable website blockers on the Chrome Web Store.

REQUESTED ACTION

I respectfully request that the review team reconsider the rejection and approve
Focus Mode - Blocker for publication. I am happy to provide any additional
information, make the source code available for direct inspection, or schedule a
call to walk through the extension's functionality.

Thank you for your time and consideration.

Sincerely,
[YOUR NAME]
Publisher: Zovo
Email: [YOUR EMAIL]
Reference: [CASE/REFERENCE NUMBER]
```

---

### Template 2: Privacy Policy Deficiency

**Subject:** Appeal — Focus Mode - Blocker (ID: [EXTENSION_ID]) — Privacy Policy Compliance

**Body:**

```
Dear Chrome Web Store Review Team,

I am writing to appeal the rejection of Focus Mode - Blocker (ID: [EXTENSION_ID],
version [VERSION]) regarding privacy policy compliance. I have reviewed the User
Data Policy in full and have taken corrective action to ensure full compliance.
Below I provide a detailed account of Focus Mode's data practices and the updates
I have made to the privacy policy.

CORRECTIVE ACTIONS TAKEN

Since receiving the rejection notice, I have:

1. Published a comprehensive privacy policy at [PRIVACY_POLICY_URL]
2. Updated the Chrome Web Store listing to include the privacy policy URL
3. Added an in-extension link to the privacy policy accessible from the
   settings/about page
4. Ensured the privacy policy page loads without authentication, paywalls,
   or redirects

FOCUS MODE'S COMPLETE DATA PRACTICES

Free Tier (entirely local):
- Blocklist domains: stored in chrome.storage.local. User-entered domain names
  only. Never transmitted externally.
- Pomodoro session state: stored in chrome.storage.local. Contains timer
  duration, break duration, current session count. Never transmitted.
- Focus Score: a numeric score calculated locally based on blocking activity.
  Stored in chrome.storage.local. Never transmitted.
- Streak data: consecutive days of focus session completion. Stored in
  chrome.storage.local. Never transmitted.
- Settings/preferences: theme, sound preferences, schedule configuration.
  Stored in chrome.storage.local. Never transmitted.

Pro Tier (optional transmission, opt-in only):
- Anonymized usage telemetry: if the user explicitly opts in during Pro
  onboarding, anonymous usage events (feature usage counts, session durations,
  no URLs, no personal data) are sent to our analytics endpoint. Users can
  disable this at any time from Settings > Privacy.
- Error reporting via Sentry: crash reports and JavaScript errors are sent to
  Sentry (https://sentry.io) for stability monitoring. These contain stack
  traces and extension version information. They do not contain user data,
  URLs, or blocklist content.
- Payment processing via Stripe: Pro subscription payments are handled entirely
  by Stripe (https://stripe.com). Focus Mode does not store, process, or have
  access to credit card numbers, bank details, or billing addresses. Stripe's
  privacy policy governs payment data.

Data NOT collected (at any tier):
- Browsing history
- Page content from any website
- Cookies or authentication tokens
- Personal information (name, email, location) unless voluntarily provided
  for account creation
- URLs visited (neither blocked nor unblocked)
- Keystrokes or form input

PRIVACY POLICY STRUCTURE

The published privacy policy at [PRIVACY_POLICY_URL] contains the following
sections, in compliance with the Chrome Web Store User Data Policy:

1. What Data We Collect — itemized by Free and Pro tier
2. How Data Is Stored — local storage details, encryption at rest for Pro data
3. How Data Is Used — solely for extension functionality and stability
4. Third-Party Services — Sentry and Stripe disclosures with links to their
   privacy policies
5. Data Sharing — we do not sell, rent, or share user data with third parties
   for advertising or marketing
6. Data Retention and Deletion — users can clear all local data by uninstalling
   the extension or using the "Reset Data" option in settings; Pro telemetry
   data is retained for 90 days then deleted
7. User Rights — users can request data export or deletion by contacting
   [YOUR EMAIL]
8. Children's Privacy — the extension is not directed at children under 13
9. Changes to This Policy — notification process for policy updates
10. Contact Information — developer email for privacy inquiries

SOURCE CODE VERIFICATION

The complete source code is publicly available at
https://github.com/theluckystrike/focus-mode-blocker. I invite the review team
to verify that the data practices described above and in the privacy policy
accurately reflect the extension's behavior. Relevant files:

- src/background/storage.js — all chrome.storage operations
- src/background/analytics.js — Pro telemetry (opt-in, anonymized)
- manifest.json — complete permission declarations

REQUESTED ACTION

I respectfully request that the review team re-evaluate Focus Mode - Blocker
in light of the corrective actions taken and the comprehensive privacy policy
now in place. I am happy to make any further adjustments the team deems necessary.

Thank you for your time.

Sincerely,
[YOUR NAME]
Publisher: Zovo
Email: [YOUR EMAIL]
Reference: [CASE/REFERENCE NUMBER]
```

---

### Template 3: Deceptive Functionality (Premium Features)

**Subject:** Appeal — Focus Mode - Blocker (ID: [EXTENSION_ID]) — Freemium Model Transparency

**Body:**

```
Dear Chrome Web Store Review Team,

I am writing to appeal the rejection of Focus Mode - Blocker (ID: [EXTENSION_ID],
version [VERSION]) on the grounds of deceptive functionality related to premium
features. I want to assure the review team that Focus Mode's free tier provides
genuine, substantial functionality and that the Pro upgrade is transparently
disclosed. I provide a complete breakdown below.

FREE TIER FUNCTIONALITY (fully operational, no time limits, no trial expiration):

1. Website Blocking — users can block up to 10 websites. The blocking engine
   is fully functional: sites are blocked via declarativeNetRequest, the custom
   block page is displayed, and users cannot bypass blocks during active focus
   sessions. There is no degradation of blocking quality between free and Pro.

2. Pomodoro Timer — the full Pomodoro timer is available for free. Users can
   start focus sessions, take breaks, and complete full Pomodoro cycles. Timer
   durations are customizable. Session-end notifications are delivered. There
   are no restrictions on the number of Pomodoro sessions per day.

3. Daily Statistics — free users see a complete daily dashboard showing:
   time spent focused, number of sites blocked, number of Pomodoro sessions
   completed, and distractions avoided (blocked navigation attempts).

4. Focus Score — the Focus Score algorithm runs identically for free and Pro
   users. It calculates a daily score based on focus session completion rate
   and blocking discipline. Free users see their current score and a 7-day
   trend.

5. Streaks — free users earn and maintain streaks for consecutive days of
   completing focus sessions. Streak milestones trigger congratulatory
   notifications. There is no limit on streak length for free users.

6. Block Page — the custom block page with motivational messages is displayed
   for all users, free and Pro alike.

PRO TIER ADDITIONS (clearly labeled, never misrepresented):

- Unlimited blocked sites (free tier: 10)
- Extended statistics history (free tier: 7 days; Pro: unlimited)
- Custom block page themes
- White noise and ambient sound options
- Scheduled blocking (automatic focus sessions at set times)
- Nuclear Mode (irreversible blocking for a set duration)
- Cross-device sync via chrome.storage.sync
- Priority support

HOW PRO FEATURES ARE DISCLOSED:

1. Chrome Web Store Listing: The description clearly states "Free features
   include..." and "Upgrade to Pro for..." in separate, labeled sections.
   There is no ambiguity about what is free and what requires payment.

2. In-Extension UI: Features that require Pro display a small "Pro" badge
   icon. Tapping a Pro feature shows a clear upgrade prompt that states
   the price and what the user will receive. There is no countdown timer,
   no urgency language, no "limited time offer," and no dark patterns.

3. No Feature Degradation: Free features never stop working. There is no
   trial period. Free users are never shown a "your trial has expired"
   message. The 10-site blocklist limit is consistent and disclosed from
   the first use.

4. No Deceptive Patterns: The extension does not:
   - Require an account to use free features
   - Show interstitial ads or pop-ups urging upgrade
   - Slow down, degrade, or artificially limit free-tier performance
   - Hide the "close" or "dismiss" button on upgrade prompts
   - Use pre-checked boxes or confusing opt-out language

SCREENSHOTS

[Attach: (1) Free tier popup showing full functionality, (2) Pro feature
with "Pro" badge visible, (3) Upgrade prompt showing clear pricing and
dismiss option, (4) Chrome Web Store listing showing free/Pro feature
breakdown]

REQUESTED ACTION

I respectfully request that the review team reconsider the rejection. Focus
Mode - Blocker's free tier is a fully functional website blocker with genuine
utility. The Pro tier adds convenience and power-user features but is never
presented deceptively. I am happy to make any UI or listing adjustments the
team recommends.

Thank you for your consideration.

Sincerely,
[YOUR NAME]
Publisher: Zovo
Email: [YOUR EMAIL]
Reference: [CASE/REFERENCE NUMBER]
```

---

### Template 4: Excessive Permissions (scripting + notifications)

**Subject:** Appeal — Focus Mode - Blocker (ID: [EXTENSION_ID]) — Permission Justification (scripting, notifications)

**Body:**

```
Dear Chrome Web Store Review Team,

I am writing to appeal the rejection of Focus Mode - Blocker (ID: [EXTENSION_ID],
version [VERSION]) regarding the use of the "scripting" and "notifications"
permissions. I understand that each permission must be justified as essential to
the extension's core functionality. Below I demonstrate that both permissions are
strictly necessary for Focus Mode's primary purpose: blocking distracting websites
and managing focus sessions.

PERMISSION: scripting

Purpose: Injecting the block page content script into tabs that navigate to
blocked websites.

How it works:
1. The user adds domains to their personal blocklist (e.g., twitter.com,
   reddit.com).
2. When the user navigates to a blocked domain during an active focus session,
   the declarativeNetRequest rule intercepts the navigation.
3. The background service worker uses chrome.scripting.executeScript() to inject
   src/content/block-page.js into the tab.
4. The content script replaces the page's visible content with Focus Mode's
   block screen, which displays:
   - A message explaining that the site is blocked
   - The name of the blocked domain
   - The remaining time in the current focus session
   - A button to return to the previous page or a productive site
   - A motivational quote (rotated daily)

Why scripting is essential:
- Without the scripting permission, the extension cannot inject the block page.
  The user would see a blank page, a Chrome error page, or the actual blocked
  content (defeating the purpose entirely).
- The content script runs ONLY on domains the user has explicitly added to their
  blocklist. It never runs on other pages.
- The content script does not read, collect, or transmit any content from the
  blocked page. It replaces the DOM with Focus Mode's own HTML.

What scripting does NOT do in Focus Mode:
- Does not execute on pages outside the user's blocklist
- Does not read page content, cookies, forms, or credentials
- Does not modify pages for ad injection, affiliate link replacement, or
  tracking
- Does not run persistently or in the background on any page

Code reference: src/content/block-page.js
(Full source: https://github.com/theluckystrike/focus-mode-blocker/blob/main/src/content/block-page.js)

PERMISSION: notifications

Purpose: Alerting the user to focus session events that occur while they are
working in another application or tab.

Notification triggers (exhaustive list):
1. Focus session started — confirms the session is active (shown once at start)
2. Pomodoro work period ended — tells the user to take a break
3. Pomodoro break ended — tells the user the break is over and the next work
   period is starting
4. Focus session completed — congratulates the user on completing the full
   session
5. Streak milestone reached — notifies the user when they hit streak milestones
   (e.g., 7 days, 30 days)
6. Nuclear Mode expiring — warns the user 5 minutes before Nuclear Mode ends
   (Pro feature)

Why notifications are essential:
- Focus Mode's core value proposition is helping users maintain focus. The
  Pomodoro technique requires the user to be notified when work and break
  periods end. Without notifications, the user would have to constantly
  check the extension popup to see if their timer has elapsed, which is
  itself a distraction and defeats the purpose.
- Users frequently work in full-screen applications (document editors, IDEs,
  video calls) where the extension popup is not visible. Chrome notifications
  are the only way to reach the user in these contexts.

What notifications do NOT do in Focus Mode:
- Do not contain advertisements or marketing content
- Do not link to external websites or the Chrome Web Store
- Do not promote the Pro upgrade
- Do not fire more than 6 times per focus session (bounded, not spammy)
- Cannot be used to send push notifications from a remote server (the
  extension has no push notification infrastructure)

Notification content examples:
- "Focus session started! 25 minutes of focused work begins now."
- "Great work! Time for a 5-minute break."
- "Break's over. Ready for another round of focused work?"
- "Session complete! You blocked 12 distractions. Focus Score: 87."

COMPARABLE PUBLISHED EXTENSIONS

The following published extensions use both scripting and notifications
permissions for similar focus/productivity purposes:

- Marinara: Pomodoro Assistant — uses notifications for timer alerts
- Forest: Stay Focused — uses content scripts and notifications
- BlockSite — uses scripting for block page and notifications for alerts

REQUESTED ACTION

I respectfully request that the review team reconsider the rejection. Both the
scripting and notifications permissions are strictly necessary for Focus Mode's
core functionality as a website blocker and focus session manager. Neither
permission is used for any purpose beyond what is described above. I am happy
to provide additional code walkthrough, a screen recording, or any other
information the team requires.

Thank you for your time.

Sincerely,
[YOUR NAME]
Publisher: Zovo
Email: [YOUR EMAIL]
Reference: [CASE/REFERENCE NUMBER]
```

---

### Template 5: Single-Purpose Violation

**Subject:** Appeal — Focus Mode - Blocker (ID: [EXTENSION_ID]) — Single Purpose Compliance

**Body:**

```
Dear Chrome Web Store Review Team,

I am writing to appeal the rejection of Focus Mode - Blocker (ID: [EXTENSION_ID],
version [VERSION]) on the grounds of a single-purpose policy violation. I
respectfully submit that all of Focus Mode's features serve a single, clearly
defined purpose: helping users block distracting websites and maintain focus.
Below I demonstrate how each feature directly supports this singular purpose.

FOCUS MODE'S SINGLE PURPOSE

"Block distracting websites and help users build focused work habits."

Every feature in the extension exists to serve one of two functions:
(A) Actively block websites the user has identified as distracting, or
(B) Provide structure, feedback, and motivation to sustain focused behavior.

These are not separate purposes. They are two sides of the same coin. A website
blocker without focus structure is a blunt tool that users disable after a day.
Focus structure without blocking is a timer with no teeth. Together, they form
a single, cohesive product category that is well-established in the Chrome Web
Store: the focus/productivity blocker.

HOW EACH FEATURE MAPS TO THE SINGLE PURPOSE

1. Website Blocklist (core blocking feature)
   - Function: Users add distracting domains. The extension blocks navigation
     to those domains during focus sessions.
   - Relationship to purpose: This IS the primary purpose. Direct implementation
     of "block distracting websites."

2. Block Page (core blocking feature)
   - Function: When a blocked site is accessed, a custom page replaces the
     content, showing the user why the site is blocked and how much focus
     time remains.
   - Relationship to purpose: The block page is the user-facing manifestation
     of the blocking function. It reinforces the blocking purpose by showing
     context rather than a generic error.

3. Pomodoro Timer (focus structure)
   - Function: Structures focus time into work periods and breaks using the
     established Pomodoro Technique.
   - Relationship to purpose: The timer defines WHEN blocking is active.
     Without a timing mechanism, the user must manually enable and disable
     blocking, which is error-prone and adds friction. The Pomodoro timer
     is the scheduling backbone of the blocking system.

4. Focus Score (focus feedback)
   - Function: Calculates a daily score based on: percentage of focus session
     completed, number of block attempts resisted (did not disable blocking),
     and session consistency.
   - Relationship to purpose: Provides quantitative feedback on blocking
     effectiveness. Users who see their score declining know they need to
     adjust their blocklist or session structure. This is a direct measurement
     of how well the blocking is working.

5. Streaks (focus motivation)
   - Function: Tracks consecutive days where the user completed at least one
     full focus session with blocking active.
   - Relationship to purpose: Streaks leverage habit psychology to keep users
     returning to the blocking tool daily. A blocker that is abandoned after
     a week has failed. Streaks are the retention mechanism that ensures the
     blocking purpose is fulfilled over time.

6. Nuclear Mode (enhanced blocking — Pro)
   - Function: An irreversible blocking mode where the user cannot modify
     their blocklist or disable blocking for a set duration.
   - Relationship to purpose: This is the strongest form of website blocking.
     It exists because some users need blocking they cannot override in a
     moment of weakness. It is the logical extreme of the core blocking
     purpose.

7. Scheduled Blocking (automated blocking — Pro)
   - Function: Automatically activates blocking at user-defined times
     (e.g., 9 AM to 5 PM on weekdays).
   - Relationship to purpose: Automates the blocking activation. Instead of
     manually starting a focus session, the blocker engages on a schedule.
     This is not a separate purpose; it is a more convenient way to activate
     the same blocking feature.

8. Focus Sounds (environmental support — Pro)
   - Function: Plays white noise or ambient sounds during focus sessions.
   - Relationship to purpose: Supports the focus environment during active
     blocking sessions. The sounds only play while blocking is active —
     they are tied to the focus session lifecycle. This is not a standalone
     music player; it is an ambient feature that enhances the blocking
     session experience.

COMPARABLE EXTENSIONS WITH SIMILAR FEATURE SETS

The following published extensions combine blocking with timers, scores, and
motivational features and are considered single-purpose:

- Forest: Stay Focused — blocks sites + grows virtual trees (gamification)
  + tracks statistics. Approved as single-purpose.
- Cold Turkey Blocker — blocks sites + schedules + timers + statistics +
  locked blocking mode. Approved as single-purpose.
- LeechBlock NG — blocks sites + schedules + time tracking + lockdown mode.
  Approved as single-purpose.

Focus Mode - Blocker follows the same established pattern.

THE SINGLE PURPOSE TEST

Google's documentation states: "An extension should have a single purpose that
is narrow and easy to understand." Focus Mode's purpose is narrow ("block
distracting websites and build focus habits") and easy to understand (every
user immediately grasps what a website blocker with a focus timer does).

The documentation also states that extensions should not bundle "unrelated
features." Focus Mode does not include: a VPN, an ad blocker, a password
manager, a screenshot tool, a coupon finder, a new tab page, a download
manager, or any other feature category outside website blocking and focus
management.

REQUESTED ACTION

I respectfully request that the review team reconsider the rejection. Focus
Mode - Blocker is a single-purpose extension whose every feature directly
serves the purpose of blocking distracting websites and helping users maintain
focus. I am willing to adjust feature descriptions, restructure the store
listing, or make any other changes the team recommends to more clearly
communicate this single purpose.

Thank you for your consideration.

Sincerely,
[YOUR NAME]
Publisher: Zovo
Email: [YOUR EMAIL]
Reference: [CASE/REFERENCE NUMBER]
```

---

### Template 6: Mistaken Rejection / False Positive

**Subject:** Appeal — Focus Mode - Blocker (ID: [EXTENSION_ID]) — Possible Review Error

**Body:**

```
Dear Chrome Web Store Review Team,

I am writing to appeal the rejection of Focus Mode - Blocker (ID: [EXTENSION_ID],
version [VERSION]). After carefully reviewing the cited policy ([POLICY NAME/URL
FROM REJECTION EMAIL]) and auditing my extension against it, I believe this
rejection may be the result of a review error. I respectfully request a second
review and provide a comprehensive evidence package below.

WHY I BELIEVE THIS IS A FALSE POSITIVE

[Choose and customize ONE of the following paragraphs, then delete the others:]

Option A — The rejection cites a policy that does not apply:
"The rejection email cites [POLICY NAME]. However, Focus Mode - Blocker does not
engage in the behavior described by this policy. Specifically, [explain what the
policy prohibits and why Focus Mode does not do that thing]. I believe the
extension may have been confused with another submission or that the automated
review flagged a pattern that does not apply in this context."

Option B — The rejection is vague and I cannot identify the violation:
"The rejection email states '[PASTE EXACT REJECTION TEXT]' but does not specify
which aspect of the extension violates this policy. I have audited every
permission, every feature, and every line of code against the cited policy and
cannot identify a violation. I would appreciate clarification so that I can
address the specific concern."

Option C — The extension was previously approved and nothing relevant changed:
"Focus Mode - Blocker was previously approved and published (version [PREVIOUS
VERSION]). The update that was rejected (version [NEW VERSION]) contains the
following changes: [LIST CHANGES]. None of these changes affect the areas
covered by the cited policy. I believe the rejection may have been triggered
by a re-review of existing functionality rather than the new changes."

Option D — The extension uses only recommended APIs and patterns:
"Focus Mode - Blocker is built entirely on Manifest V3 using the APIs and
patterns recommended by Google's own migration documentation. Specifically,
it uses declarativeNetRequest (not webRequest) for blocking, chrome.scripting
(not inline content scripts with code strings) for page injection, and
chrome.alarms (not setTimeout in persistent background pages) for timing.
The extension follows every MV3 best practice and I am unable to identify
what aspect could violate the cited policy."

EVIDENCE PACKAGE

To assist the review team, I have prepared the following:

1. Complete permission justification:

   | Permission | Justification |
   |---|---|
   | storage | Stores user settings, blocklist, and focus data locally |
   | alarms | Powers Pomodoro timer and scheduled blocking triggers |
   | declarativeNetRequest | Core blocking engine — blocks user-specified URLs |
   | declarativeNetRequestWithHostAccess | Required for DNR to operate on user-specified domains |
   | activeTab | Checks current tab against blocklist when user clicks icon |
   | scripting | Injects block page on blocked domains only |
   | notifications | Alerts user to session start/end and timer events |
   | offscreen | Plays focus sounds via offscreen document (MV3 audio pattern) |
   | <all_urls> (host) | DNR and content script must match any user-specified domain |

2. Privacy policy: [PRIVACY_POLICY_URL]

3. Source code: https://github.com/theluckystrike/focus-mode-blocker
   The repository is public. I invite the review team to inspect any file.

4. Screenshots demonstrating normal operation:
   [Attach: popup, block page, settings, Pomodoro timer, notification,
   free vs. Pro UI]

5. Screen recording: [OPTIONAL: Link to a 60-second video showing the
   extension's normal operation]

6. Comparable published extensions using the same permission set:
   - BlockSite (10M+ users): storage, alarms, declarativeNetRequest,
     scripting, notifications, <all_urls>
   - StayFocusd (1M+ users): storage, alarms, scripting, notifications,
     <all_urls>
   - LeechBlock NG (200K+ users): storage, alarms, scripting, <all_urls>

WHAT I HAVE ALREADY VERIFIED

Before submitting this appeal, I completed the following self-audit:

- [x] Extension installs and operates correctly on a clean Chrome profile
- [x] All declared permissions are used in the codebase (no unused permissions)
- [x] Privacy policy is live, accessible without authentication, and covers
      all data practices
- [x] Store listing accurately describes all features and permissions
- [x] Free tier provides genuine, substantial functionality
- [x] No deceptive UI patterns (no dark patterns, no fake urgency, no hidden
      charges)
- [x] Extension serves a single purpose: website blocking and focus management
- [x] No remote code execution, no eval(), no external script loading
- [x] No obfuscated code — all source is readable and available on GitHub

REQUESTED ACTION

I respectfully request that the review team conduct a second review of Focus
Mode - Blocker. If there is a specific aspect of the extension that triggered
the rejection, I would greatly appreciate a more detailed explanation so that
I can address it directly. I am committed to full compliance with Chrome Web
Store policies and am happy to make any changes required.

Thank you for your time and attention.

Sincerely,
[YOUR NAME]
Publisher: Zovo
Email: [YOUR EMAIL]
Reference: [CASE/REFERENCE NUMBER]
```

---

## 3.4 Timeline and Escalation

### Expected Timelines for Focus Mode (New Developer, First Extension)

| Stage | Expected Duration | Notes |
|---|---|---|
| Initial review (first submission) | 1-5 business days | New developer accounts sometimes take longer due to additional verification |
| Rejection email delivery | Within 24 hours of review completion | Check spam/promotions folders |
| Appeal response (first appeal) | 3-7 business days | Can extend to 10-14 days during peak periods |
| Appeal response (second appeal, if first denied) | 5-14 business days | Second appeals receive more thorough review |
| Escalated support response | 7-21 business days | Escalation is slower but receives senior reviewer attention |
| Full review cycle (rejection -> fix -> resubmit -> approval) | 2-6 weeks total | Budget for the longer end if this is your first extension |

### Escalation Path

**Level 1: Standard Appeal (Day 1)**

Use the Developer Console appeal process or the one-stop support form as described in Section 3.2, Step 5. This is your first and most important attempt. Use the templates from Section 3.3.

**Level 2: Follow-Up on Unanswered Appeal (Day 10-14)**

If you have not received any response after 10 business days:

1. Go to https://support.google.com/chrome_webstore/contact/one_stop_support
2. Select "I submitted an appeal and have not received a response"
3. Reference your original case number
4. Briefly restate the issue (do not re-paste the full appeal)
5. Politely request a status update

Sample follow-up:

```
Subject: Follow-Up on Appeal — Focus Mode - Blocker (Case: [CASE_NUMBER])

Dear Chrome Web Store Support,

I submitted an appeal for Focus Mode - Blocker (ID: [EXTENSION_ID]) on
[DATE]. The original rejection cited [POLICY]. I have not yet received a
response and wanted to follow up to check on the status.

My original appeal provided a detailed justification for the extension's
permissions and compliance. The complete source code is publicly available
at https://github.com/theluckystrike/focus-mode-blocker.

I would appreciate any update on the review status or guidance on additional
steps I should take.

Thank you,
[YOUR NAME]
Case: [CASE_NUMBER]
```

**Level 3: Google Developer Support (Day 21-28)**

If the standard appeal process has not resolved the issue after 3 weeks:

1. Visit https://support.google.com/chrome_webstore/contact/one_stop_support
2. Select the option for unresolved issues or escalation
3. Reference all previous case numbers
4. Provide a concise summary of the timeline: when you submitted, when you appealed, what responses you received
5. Specifically request escalation to a senior reviewer or policy specialist

**Level 4: Chromium Issue Tracker (Day 30+)**

If you believe there is a systemic issue with the review process (e.g., the policy is being applied inconsistently, or your extension is being held to a different standard than comparable published extensions):

1. Go to https://issues.chromium.org/issues/new
2. Select component: `Extensions > WebStore`
3. File a detailed issue describing:
   - Your extension and its purpose
   - The rejection policy cited
   - Your appeal history and outcomes
   - Comparable extensions that are approved with the same permission set
   - A request for policy clarification or consistent enforcement
4. Keep the tone factual and constructive. This is a public bug tracker, not a complaints forum.

**Note:** The Chromium issue tracker is for systemic policy concerns, not for individual appeal disputes. Use it only if you genuinely believe the policy is being applied inconsistently or the documentation is unclear.

**Level 5: Community and Developer Relations (Ongoing)**

- **Chromium Extensions Google Group:** https://groups.google.com/a/chromium.org/g/chromium-extensions — post a question about the policy interpretation. Other developers and occasionally Google engineers respond.
- **Chrome Extensions Developer Summit / Office Hours:** Google periodically holds developer Q&A sessions. Check the Chrome Developers blog (https://developer.chrome.com/blog) for announcements.
- **Stack Overflow:** Tag your question with `[google-chrome-extension]` and `[chrome-web-store]`. This can surface community solutions and occasionally attracts Google developer advocates.

### When to Use Each Escalation Level

| Situation | Recommended Level |
|---|---|
| First rejection, clear policy cited, you can fix the issue | Do not appeal. Fix and resubmit. |
| First rejection, you believe you comply, have evidence | Level 1: Standard Appeal |
| Appeal denied with vague reasoning | Level 1: Submit a second appeal with more specific evidence |
| No response after 10 business days | Level 2: Follow-Up |
| Two appeals denied, you still believe you comply | Level 3: Developer Support Escalation |
| Comparable extensions approved with same permissions | Level 4: Chromium Issue Tracker (for inconsistency) |
| Systemic issue affecting multiple developers | Level 4: Chromium Issue Tracker + Level 5: Community |
| Need policy clarification, not urgent | Level 5: Community channels |

---

## 3.5 Communication Dos and Don'ts

### DO: Professional Tone

**Good examples:**

> "I respectfully disagree with the rejection and would like to provide additional context for the review team's consideration."

> "I have audited the extension against the cited policy and believe it complies. Below I provide specific evidence for each point."

> "I appreciate the review team's diligence in maintaining store quality and understand the concern about broad permissions. Here is why they are necessary in this case."

> "Thank you for the detailed feedback. I have made the following changes to address the cited concerns and resubmitted version [X.X.X]."

> "I understand that <all_urls> raises flags during review. I want to proactively demonstrate that this permission is used responsibly."

### DO: Be Specific and Evidence-Based

**Good:**
> "The scripting permission is used exclusively in src/content/block-page.js to inject the block page overlay. It runs only on domains the user has added to their blocklist. It does not read or transmit page content. The relevant code is at [GitHub permalink]."

**Bad:**
> "We need the scripting permission for the extension to work."

### DO: Acknowledge the Reviewer's Perspective

**Good:**
> "I understand that the combination of <all_urls>, scripting, and declarativeNetRequest may appear concerning at first glance. For many extensions, these permissions would indeed be excessive. However, for a user-configurable website blocker, they represent the minimum required permission set."

### DO: Reference Comparable Extensions — Carefully

**Good:**
> "I note that several established website blockers in the Chrome Web Store use an identical or broader permission set, including BlockSite (10M+ users), StayFocusd (1M+ users), and LeechBlock NG (200K+ users). I reference these not to criticize their review outcomes, but to demonstrate that this permission pattern is an accepted standard for this extension category."

### DON'T: Be Adversarial, Accusatory, or Entitled

**Never say:**

> "This rejection is unfair and biased."

> "Your reviewer clearly didn't even look at my extension."

> "Other extensions do way worse things and you approved them, so you should approve mine too."

> "I'll report this to the media / file a lawsuit / switch to Firefox."

> "I've been working on this for months and you rejected it in 5 minutes."

> "This is clearly an automated rejection, not a real review."

### DON'T: Make Threats or Ultimatums

**Never say:**

> "If this isn't resolved by [date], I will [action]."

> "I demand to speak with a supervisor."

> "I will take this public if you don't respond."

Threats do not accelerate the process. They can, however, result in your developer account being flagged for abusive communication.

### DON'T: Speculate About Internal Processes

**Never say:**

> "I think your automated system flagged this incorrectly."

> "This was probably reviewed by a bot, not a human."

> "I suspect this was rejected because of [conspiracy theory about Google's motives]."

You do not know whether the review was automated, manual, or a combination. Speculating about internal processes appears uninformed and undermines your credibility.

### DON'T: Overshare or Ramble

**Never write:**

> A 3,000-word autobiography about why you built the extension, your personal productivity struggles, how long the project took, or how much you need the revenue.

Reviewers process hundreds of appeals. Respect their time. Be concise, factual, and structured. Use headers, tables, and bullet points. Front-load the most important information.

### DON'T: Reference Competitors Accusatorily

**Never say:**

> "BlockSite has way more permissions than me and does way shadier stuff. Why are they approved?"

> "StayFocusd collects user data and you still have them in the store."

> "It's hypocritical to reject my extension when [competitor] does the same thing."

**Instead say:**

> "Established extensions in this category, such as BlockSite and StayFocusd, use a comparable permission model. I reference them only to illustrate that this permission pattern is standard for website blockers, not to comment on their individual compliance."

### WHEN TO: Offer Source Code Access

Offering source code access is a strong credibility signal. Do it when:

- **Always:** If your code is already public on GitHub, include the link in every appeal. There is no downside.
- **When permissions are questioned:** Offering the reviewer the ability to verify that `scripting` is only used for the block page, or that `storage` only stores settings, is powerful evidence.
- **When "deceptive functionality" is alleged:** Letting the reviewer read the code removes ambiguity about what the extension actually does.
- **How to offer it:** "The complete source code is publicly available at https://github.com/theluckystrike/focus-mode-blocker. I invite the review team to inspect any file. If the team prefers, I can also provide a ZIP of the exact build that was submitted for review."

### WHEN NOT TO: Offer Source Code Access

- If your code is proprietary and you are not willing to make it public, do not promise access you will not deliver. Instead, offer to provide specific file excerpts relevant to the rejection.
- If your code contains secrets, API keys, or credentials (it should not, but if it does), clean those up before sharing.

---

*End of Section 3 — Appeal Process for Focus Mode - Blocker*
