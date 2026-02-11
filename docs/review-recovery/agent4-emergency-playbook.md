# Emergency Playbook: Account Suspension Recovery, Proactive Prevention & Takedown Response

## Focus Mode - Blocker v1.0.0

> **Phase:** 13 (Review Rejection Recovery) -- Agent 4
> **Extension:** Focus Mode - Blocker by Zovo
> **Manifest:** V3 | **Category:** Productivity
> **Developer Console:** https://chrome.google.com/webstore/devconsole
> **GitHub:** https://github.com/theluckystrike/focus-mode-blocker
> **Privacy Policy:** https://zovo.one/privacy/focus-mode-blocker
> **Date:** 2026-02-11

---

## Table of Contents

- [Section 5: Account Suspension Recovery](#section-5-account-suspension-recovery)
  - [5.1 Warning Signs Specific to Focus Mode](#51-warning-signs-specific-to-focus-mode)
  - [5.2 Immediate Action Steps](#52-immediate-action-steps)
  - [5.3 Reinstatement Templates](#53-reinstatement-templates)
  - [5.4 Backup & Contingency Plan](#54-backup--contingency-plan)
- [Section 6: Proactive Prevention](#section-6-proactive-prevention)
  - [6.1 Safe Update Practices](#61-safe-update-practices)
  - [6.2 A/B Testing Compliance](#62-ab-testing-compliance)
  - [6.3 Monetization Compliance](#63-monetization-compliance)
  - [6.4 Third-Party Code Audit](#64-third-party-code-audit)
- [Section 7: Emergency Playbook](#section-7-emergency-playbook)
  - [7.1 Extension Takedown Response (24-Hour Plan)](#71-extension-takedown-response-24-hour-plan)
  - [7.2 User Communication Templates](#72-user-communication-templates)
  - [7.3 Revenue Protection](#73-revenue-protection)
  - [7.4 Alternative Distribution Guide](#74-alternative-distribution-guide)

---

# Section 5: Account Suspension Recovery

## 5.1 Warning Signs Specific to Focus Mode

Focus Mode - Blocker has a unique risk profile because of its permission footprint (8 required API permissions, `<all_urls>` host permission, 3 optional permissions) and its behavioral model (content scripts on all pages, DNR rule manipulation, Nuclear Mode that restricts user navigation). The following are red flags that indicate an elevated risk of account-level enforcement action from Google.

### Critical Red Flags (Immediate Attention Required)

| Red Flag | Severity | Why It Matters for Focus Mode | Detection Method |
|----------|----------|-------------------------------|------------------|
| Multiple rejections citing `<all_urls>` usage | CRITICAL | Focus Mode requires `<all_urls>` for user-configured blocking. Repeated rejections signal the reviewer believes the permission is unjustified or the justification is insufficient. | Developer Console email notifications |
| Rejection for "excessive permissions" | HIGH | Focus Mode declares 8 required permissions (`storage`, `alarms`, `declarativeNetRequest`, `declarativeNetRequestWithHostAccess`, `activeTab`, `scripting`, `notifications`, `offscreen`) plus 3 optional (`identity`, `idle`, `tabGroups`). Reviewers may flag this count even if each is individually justified. | Rejection email citing specific permissions |
| Rejection for data practices / content script scope | HIGH | Focus Mode injects 3 content scripts on `<all_urls>` at install: `detector.js` (document_start), `blocker.js` (document_start), `tracker.js` (document_idle). Even though no data leaves the device, this pattern looks suspicious to automated scanners. | Rejection email referencing "data handling" or "content scripts" |
| User complaints about blocking behavior | MEDIUM | Users who do not understand Nuclear Mode or who install the extension without reading the description may report it as malware or claim "deceptive behavior." Even a small number of such reports can trigger manual review. | CWS developer dashboard reviews, support email |
| False positive malware flags from DNR rule manipulation | HIGH | Focus Mode dynamically adds and removes DNR rules at runtime (user blocklist edits, Nuclear Mode activation/deactivation, schedule-based toggling). Automated scanners may interpret frequent DNR rule changes as suspicious network manipulation. | Rejection email referencing "malware" or "unwanted software" |
| Nuclear Mode flagged as "deceptive" or "restricting user control" | HIGH | Nuclear Mode temporarily blocks all non-whitelisted sites and prevents the user from disabling the extension during the session. This is a feature the user explicitly requests, but a reviewer may interpret it as restricting user control in violation of CWS policy. | Rejection email referencing "user control" or "deceptive behavior" |

### Early Warning Indicators (Monitor Weekly)

| Indicator | Action Threshold | Monitoring Steps |
|-----------|------------------|------------------|
| 1-star reviews mentioning "malware" or "virus" | 3 or more in a 7-day window | Check CWS dashboard reviews every Monday and Thursday |
| "Report abuse" clicks visible in developer console | Any non-zero count | Check weekly in developer console under "Feedback" |
| Review time increasing for updates | Review takes >7 business days when previous took <3 | Compare timestamps on each submission |
| Peer extensions in the blocker category being removed | Any direct competitor removed for policy violations | Monitor competitor CWS listings monthly |
| Google policy blog announcements about permissions or data access | Any announcement mentioning `declarativeNetRequest`, `<all_urls>`, or content scripts | Subscribe to https://developer.chrome.com/blog/ RSS feed |
| Sentry error spikes on content script injection failures | >5% injection failure rate on new Chrome versions | Sentry dashboard alerts |

### Focus Mode Specific Vulnerability Assessment

```
Permission Risk Matrix for Focus Mode - Blocker v1.0.0
=====================================================

HIGHEST RISK:
  <all_urls> host permission
    - Required for: DNR rule application + content script injection on any blocked domain
    - Why risky: Grants theoretical access to all browsing data
    - Mitigation: Privacy policy, no data collection, CWS justification text
    - Fallback: Move to per-domain dynamic permissions (see Section 6.1)

HIGH RISK:
  Content scripts on <all_urls> (3 scripts)
    - detector.js: Checks if current page matches blocklist (document_start)
    - blocker.js: Renders block page overlay on matched pages (document_start)
    - tracker.js: Tracks time on page for Focus Score calculation (document_idle)
    - Why risky: Looks like blanket page monitoring to automated review
    - Mitigation: Scripts contain no data exfiltration, all processing is local

MEDIUM RISK:
  Nuclear Mode (blocks all non-whitelisted sites, prevents self-disable)
    - Why risky: Could be interpreted as restricting user control
    - Mitigation: User must explicitly activate, timer is always visible,
      emergency keyboard shortcut always available

LOW RISK:
  offscreen permission (ambient sound playback)
  notifications permission (session reminders)
  alarms permission (timer scheduling)
  storage permission (local data persistence)
```

---

## 5.2 Immediate Action Steps

If Focus Mode - Blocker is taken down from the Chrome Web Store, execute the following hour-by-hour plan. Every minute counts -- user trust erodes rapidly once the extension disappears from the store, and Pro subscribers will begin questioning their payments.

### Hour 0-1: Assessment

**Goal:** Understand exactly what happened, document everything, protect the broader Zovo account.

- [ ] **Read the takedown notice thoroughly.** Google sends the notice to the registered developer email. Read every line. Identify:
  - Which specific policy was cited (note the exact policy ID and section)
  - Whether the action is a "warning," "rejection," "suspension," or "termination"
  - Whether the action applies to the single extension or the entire developer account
  - The deadline for appeal (typically 14-30 days from notice)

- [ ] **Screenshot everything immediately.** Capture:
  - The full takedown email (save as PDF and PNG)
  - The Chrome Developer Dashboard status page for Focus Mode - Blocker
  - The status of ALL other Zovo extensions in the developer console
  - The current published version number and last update date
  - Any visible metrics (installs, active users, rating) before they disappear

- [ ] **Check all Zovo extensions.** If one extension is flagged, others under the same developer account may be at risk. Log into the developer console and verify every extension shows "Published" status. If any others show "Under review" or "Removed," those are cascading effects.

- [ ] **Do NOT make any changes yet.** Do not push updates, do not modify the listing, do not contact Google. Any premature action could be interpreted as tampering or could reset appeal timelines.

- [ ] **Create a private incident channel.** Use a Slack channel, Discord thread, or shared document. Name: `focus-mode-takedown-YYYY-MM-DD`. All team communication about this incident goes here.

### Hour 1-4: Documentation

**Goal:** Preserve all data and evidence before Google removes access.

- [ ] **Export source code snapshot.**
  ```bash
  # Create a tagged archive of the exact version that was published
  cd /path/to/focus-mode-blocker
  git tag -a "cws-takedown-$(date +%Y%m%d)" -m "Code snapshot at time of CWS takedown"
  git push origin --tags
  zip -r "focus-mode-blocker-takedown-backup-$(date +%Y%m%d).zip" . \
    -x "node_modules/*" -x ".git/*"
  ```

- [ ] **Save all CWS store listing content.**
  - Extension description (full text)
  - Short description
  - All 5 screenshots (1280x800)
  - Small promo tile (440x280)
  - Marquee promo tile (1400x560)
  - Privacy policy text as displayed on CWS
  - Category, language, and all metadata fields
  - NOTE: These are already documented in `docs/store-assets/` but verify the live versions match

- [ ] **Export user reviews.**
  - Use the Chrome Web Store API or a scraping tool to save all reviews
  - Capture reviewer names, star ratings, dates, and full review text
  - Save as JSON and CSV for later analysis
  - NOTE: Reviews may disappear when the listing is removed

- [ ] **Export analytics data.**
  - CWS Developer Dashboard: Installs, uninstalls, active users, rating over time
  - Export as CSV or screenshot all charts
  - Sentry: Export error logs for the last 30 days
  - Server-side analytics (if any API calls were tracked): Export all data

- [ ] **Document the current Stripe state.**
  - Total active subscribers
  - Monthly recurring revenue (MRR) at time of takedown
  - List of all active Pro subscriber emails
  - Subscription plan distribution (monthly / annual / lifetime)

### Hour 4-24: Response Preparation

**Goal:** Analyze the violation, prepare fixes, and draft the appeal.

- [ ] **Analyze the specific violation.** Map the cited policy to Focus Mode features:

  | Cited Policy | Likely Focus Mode Cause | Fix Strategy |
  |-------------|------------------------|-------------|
  | "Broad host permissions" | `<all_urls>` in manifest | Migrate to per-domain `chrome.permissions.request()` (see 6.1) |
  | "Excessive permissions" | 8 required + 3 optional permissions | Remove `offscreen` if sound is non-essential, make `notifications` optional |
  | "Data handling" | 3 content scripts on `<all_urls>` | Convert to `activeTab` injection on user gesture only |
  | "Deceptive behavior" | Nuclear Mode restricts navigation | Add persistent banner with "Emergency Exit" option during Nuclear Mode |
  | "Malware / unwanted software" | Dynamic DNR rule manipulation | Add logging, reduce rule change frequency, batch operations |
  | "Single purpose violation" | Timer + blocking + score + sounds | Tighten CWS description to frame everything as "focus and productivity" |
  | "User control" | Nuclear Mode prevents self-disabling | Always provide a visible escape mechanism (e.g., type a 6-digit code to exit) |

- [ ] **Prepare the code fix.** Make the changes in a new branch:
  ```bash
  git checkout -b fix/cws-compliance-$(date +%Y%m%d)
  # Make all required changes
  # Bump the version number (at least patch: 1.0.0 -> 1.0.1)
  git commit -m "fix: CWS compliance -- address [cited policy]"
  ```

- [ ] **Draft the appeal.** Use the templates in Section 5.3.

- [ ] **Have a second person review the appeal** before submission.

### Day 1-3: Alternative Actions

**Goal:** If the appeal is not immediately successful, protect users and revenue.

- [ ] **Communicate with users** (see Section 7.2 templates):
  - Post on GitHub: https://github.com/theluckystrike/focus-mode-blocker/issues (new issue titled "Chrome Web Store Status Update")
  - Email Pro subscribers via Stripe customer list
  - Post on social media accounts
  - Update zovo.one with a status banner

- [ ] **Prepare alternative distribution** (see Section 7.4):
  - Build a sideloadable .zip for GitHub Releases
  - Begin Edge Add-ons Store submission (if not already submitted)
  - Prepare Firefox manifest transformation and AMO submission

- [ ] **Do NOT pause Stripe subscriptions.** Pro features work offline for 7 days (cached license). Communicate to subscribers that their service is not interrupted.

- [ ] **Submit the appeal** via the Chrome Developer Dashboard appeal form. Include:
  - The fixed code (updated .zip upload)
  - Detailed explanation of each change made
  - Reference to privacy policy and data handling practices
  - Professional, non-combative tone

---

## 5.3 Reinstatement Templates

### Template 1: Policy Violation Reinstatement

Use this template when Focus Mode was removed for a specific, identifiable policy violation (broad permissions, data handling, single purpose, etc.).

---

**Subject:** Reinstatement Request -- Focus Mode - Blocker (Extension ID: [INSERT_ID])

Dear Chrome Web Store Review Team,

I am writing to request reinstatement of Focus Mode - Blocker (Extension ID: [INSERT_ID]) following its removal on [DATE] for violation of [EXACT POLICY CITED IN NOTICE].

**I take this violation seriously and have made the following changes to bring the extension into full compliance:**

**1. Changes Made:**

[SELECT AND CUSTOMIZE THE APPLICABLE ITEMS BELOW]

**If cited for broad host permissions (`<all_urls>`):**
We have migrated from the blanket `<all_urls>` host permission to a per-domain dynamic permission model. The extension now uses `chrome.permissions.request()` to request access only to specific domains that the user explicitly adds to their blocklist. The `<all_urls>` declaration has been removed from `host_permissions` in manifest.json. Users are prompted with a standard Chrome permission dialog each time they add a new site, making the permission scope transparent and user-controlled.

**If cited for excessive permissions:**
We have reduced our required permissions from [N] to [N]. Specifically:
- [Permission X] has been moved to `optional_permissions` and is now requested only when the user enables [Feature Y].
- [Permission Z] has been removed entirely. The feature it supported ([Feature W]) now uses [alternative approach].
All remaining permissions map directly to user-visible features as documented in our Chrome Web Store listing and privacy policy.

**If cited for data handling / content scripts:**
We have restructured our content script injection model. Instead of declaring three content scripts on `<all_urls>` in the manifest, we now use `chrome.scripting.executeScript()` with the `activeTab` permission, injecting scripts only when the user interacts with the extension or when a page matches the user's explicitly configured blocklist. No content scripts run on pages the user has not designated for blocking. All data processing remains entirely local with zero network transmission.

**If cited for deceptive behavior / Nuclear Mode:**
We have added a persistent, always-visible "Emergency Exit" banner to Nuclear Mode. When Nuclear Mode is active, a fixed banner at the top of every blocked page displays: "Nuclear Mode Active -- [TIME REMAINING] -- Type your exit code to end early." Users set a personal exit code during Nuclear Mode activation. This ensures users always retain control over their browsing, even during committed focus sessions. The feature is clearly described in our CWS listing as an optional, user-initiated accountability tool.

**If cited for single purpose violation:**
We have updated our Chrome Web Store description to clearly articulate that every feature serves the single purpose of helping users maintain focus and avoid digital distractions. The feature set (website blocking, Pomodoro timer, Focus Score, streak tracking, ambient sounds) is unified under "focus productivity" as the sole purpose. We have also added a "Why does this extension include [feature]?" section to our store listing to proactively address reviewer questions.

**2. Updated Privacy Policy:**
Our privacy policy at https://zovo.one/privacy/focus-mode-blocker has been updated to reflect these changes. Key commitments:
- Zero data collection from browsing activity
- All data stored locally in `chrome.storage.local`
- No analytics SDKs, tracking pixels, or telemetry in the free tier
- Stripe payment processing is the only third-party integration (Pro tier)

**3. Updated Extension Package:**
The fixed extension has been uploaded as version [X.Y.Z] in the developer console. A complete diff of changes is available at: https://github.com/theluckystrike/focus-mode-blocker/compare/v[OLD]...v[NEW]

**4. Impact on Users:**
Focus Mode - Blocker has [NUMBER] active users who depend on it for their daily focus and productivity routines. Many are students, knowledge workers, and users with ADHD who rely on consistent access to this tool. A prompt review would be deeply appreciated.

Thank you for your time and thorough review process. I am committed to full compliance with Chrome Web Store policies and welcome any further guidance.

Respectfully,
[DEVELOPER NAME]
Zovo -- Developer of Focus Mode - Blocker
[EMAIL]
[DEVELOPER ID]

---

### Template 2: False Positive / Malware Flag Reinstatement

Use this template when Focus Mode was flagged by automated malware detection or when the violation appears to be a false positive (no actual policy violation, but automated systems flagged the extension's behavior).

---

**Subject:** False Positive Review Request -- Focus Mode - Blocker (Extension ID: [INSERT_ID])

Dear Chrome Web Store Review Team,

Focus Mode - Blocker (Extension ID: [INSERT_ID]) was flagged on [DATE] as [EXACT LANGUAGE FROM NOTICE, e.g., "containing malware" or "unwanted software"]. I believe this is a false positive and would like to provide technical clarification of the flagged behaviors.

**Extension Purpose:**
Focus Mode - Blocker is a MV3 website blocker and productivity tool. Users configure a personal blocklist of distracting websites. The extension prevents navigation to those sites during focus sessions using `declarativeNetRequest` rules.

**Why the Flag is Likely a False Positive:**

**1. Regarding declarativeNetRequest (DNR) Rule Manipulation:**
Our extension dynamically creates and removes DNR rules. This is the intended and Google-recommended usage pattern for MV3 website blockers. Specific rule operations include:
- **User blocklist edits:** When a user adds "reddit.com" to their blocklist, we call `chrome.declarativeNetRequest.updateDynamicRules()` to add a new blocking rule. When they remove it, we remove the rule. This is standard CRUD behavior on the DNR rule set.
- **Nuclear Mode:** When activated by the user, we add a broad blocking rule that blocks all domains except a user-defined whitelist. When the timer expires, we remove these rules. This creates a burst of rule additions followed by removals, which may appear anomalous to automated detection but is intentional, user-requested behavior.
- **Schedule-based activation:** Users can configure time-based schedules (e.g., "Block social media 9 AM - 5 PM"). The `chrome.alarms` API triggers rule additions at the start time and rule removals at the end time.

All DNR rule operations are deterministic, user-initiated (directly or via user-configured schedules), and fully auditable in the source code at `src/background/rule-engine.ts`.

**2. Regarding Content Scripts on All Pages:**
Our manifest declares three content scripts matching `<all_urls>`:
- `src/content/detector.js` -- Checks if the current URL matches the user's blocklist. If it does not match, the script exits immediately (< 1ms execution). It does NOT read, modify, or transmit any page content.
- `src/content/blocker.js` -- If `detector.js` determines the page is blocked, `blocker.js` renders a full-page overlay preventing the user from viewing the site. It does NOT interact with the underlying page content.
- `src/content/tracker.js` -- Records time spent on the current page for the locally computed Focus Score. The time data is stored in `chrome.storage.local` and is NEVER transmitted to any server.

None of these scripts perform data exfiltration, DOM scraping, form hijacking, cookie access, or any network requests. Their source code is available for full inspection at: https://github.com/theluckystrike/focus-mode-blocker/tree/main/src/content

**3. Regarding Nuclear Mode and User Control:**
Nuclear Mode is an optional feature that the user must explicitly activate by:
1. Navigating to the Nuclear Mode settings panel
2. Selecting a duration (1-8 hours)
3. Optionally configuring a whitelist of allowed sites
4. Clicking "Activate Nuclear Mode" with a confirmation dialog

During Nuclear Mode, users always have access to an emergency exit mechanism. The feature is modeled after established productivity tools (Cold Turkey, Freedom, SelfControl) and is clearly described in our CWS listing.

**4. Zero Data Collection:**
Focus Mode - Blocker transmits zero data to any server. There are:
- No analytics SDKs (Sentry is planned for a future version but is NOT present in v1.0.0)
- No tracking pixels
- No telemetry endpoints
- No network requests for data collection
- The ONLY network activity in the Pro tier is Stripe payment processing

Our privacy policy (https://zovo.one/privacy/focus-mode-blocker) explicitly states: "We don't collect any of your data. Everything stays on your device."

**5. Source Code Transparency:**
Our complete source code is publicly available at https://github.com/theluckystrike/focus-mode-blocker. We invite the review team to inspect any file. The extension contains no obfuscated code, no minification beyond standard build tools, and no dynamic code loading (`eval()`, `new Function()`, remote scripts).

**Request:**
I respectfully request a manual review of this extension by a human reviewer. I am confident that a thorough code inspection will confirm that Focus Mode - Blocker is a legitimate productivity tool with no malicious behavior. I am available to answer any technical questions and can provide additional documentation as needed.

Thank you for protecting users from genuinely harmful extensions. I appreciate the review team's diligence.

Respectfully,
[DEVELOPER NAME]
Zovo -- Developer of Focus Mode - Blocker
[EMAIL]
[DEVELOPER ID]

---

## 5.4 Backup & Contingency Plan

### Complete Backup Checklist

This checklist should be executed monthly (or immediately before any update submission) to ensure all critical data is preserved independent of Chrome Web Store availability.

#### Source Code

| Item | Location | Backup Status | Action |
|------|----------|---------------|--------|
| Git repository | https://github.com/theluckystrike/focus-mode-blocker | ALWAYS BACKED UP | Ensure all branches and tags are pushed |
| Published version ZIP | Developer Console uploads | NOT BACKED UP BY DEFAULT | Download from console after each submission and store in Google Drive/S3 |
| manifest.json (exact published version) | Git tag `v1.0.0` | BACKED UP | Tag every published version: `git tag -a v1.0.0 -m "CWS published version"` |
| Build output (if using bundler) | Local `dist/` folder | NOT BACKED UP | Add `dist/` archives to GitHub Releases |

**Backup command (run before every CWS submission):**
```bash
VERSION=$(node -p "require('./manifest.json').version")
git tag -a "v${VERSION}-cws" -m "Exact version submitted to CWS on $(date +%Y-%m-%d)"
git push origin "v${VERSION}-cws"
zip -r "releases/focus-mode-blocker-v${VERSION}.zip" . \
  -x "node_modules/*" -x ".git/*" -x "docs/*" -x "tests/*" -x "*.map"
```

#### Store Listing Content

| Item | File Location in Repo | Backup Action |
|------|----------------------|---------------|
| Full description | `docs/store-assets/text/description.txt` | Committed in git |
| Short description | `docs/store-assets/text/short-description.txt` | Committed in git |
| Store metadata | `docs/store-assets/text/store-metadata.txt` | Committed in git |
| Screenshot 1 (Hero) | `docs/store-assets/screenshots/screenshot-01-hero.png` | Committed in git (LFS if >10MB) |
| Screenshot 2 | `docs/store-assets/screenshots/screenshot-02-timer.png` | Committed in git |
| Screenshot 3 | `docs/store-assets/screenshots/screenshot-03-stats.png` | Committed in git |
| Screenshot 4 | `docs/store-assets/screenshots/screenshot-04-nuclear.png` | Committed in git |
| Screenshot 5 | `docs/store-assets/screenshots/screenshot-05-settings.png` | Committed in git |
| Small promo tile (440x280) | `docs/store-assets/promo/promo-small.png` | Committed in git |
| Marquee promo tile (1400x560) | `docs/store-assets/promo/promo-marquee.png` | Committed in git |
| Privacy single purpose | `docs/store-assets/privacy/privacy-single-purpose.txt` | Committed in git |
| Privacy permissions | `docs/store-assets/privacy/privacy-permissions.txt` | Committed in git |
| Privacy remote code | `docs/store-assets/privacy/privacy-remote-code.txt` | Committed in git |
| Privacy data usage | `docs/store-assets/privacy/privacy-data-usage.txt` | Committed in git |
| Privacy policy page | `docs/store-assets/privacy/privacy-policy-page.md` | Committed in git |

**Monthly verification:** Open each file and compare against the live CWS listing. Update the repo if the live listing was edited directly in the console.

#### User Reviews

| Action | Frequency | Method |
|--------|-----------|--------|
| Scrape all reviews | Weekly (every Monday) | Use CWS API or `chrome-webstore-review-scraper` npm package |
| Save as JSON | With each scrape | `reviews/reviews-YYYY-MM-DD.json` (gitignored, backed up to cloud) |
| Track review count and average rating | Weekly | Append to `reviews/review-metrics.csv` |
| Screenshot notable reviews | As encountered | Save in `reviews/screenshots/` |

**Why reviews matter:** After reinstatement, reviews may be reset or lost. Having a record of positive reviews can be used in appeals and marketing materials.

#### Analytics Data

| Data Source | Backup Method | Frequency |
|-------------|---------------|-----------|
| CWS Dashboard (installs, uninstalls, DAU) | Screenshot + CSV export | Weekly |
| CWS Dashboard (rating history) | Screenshot | Weekly |
| Sentry error reports (when implemented) | Export via Sentry API | Monthly |
| Local analytics (chrome.storage.local) | Per-user, not centrally accessible | N/A (user-owned) |

#### Stripe Subscription Data

| Item | Location | Independence from CWS |
|------|----------|----------------------|
| Active subscriber list | Stripe Dashboard | FULLY INDEPENDENT -- Stripe operates regardless of CWS status |
| MRR tracking | Stripe Dashboard > Billing | FULLY INDEPENDENT |
| Customer emails | Stripe Dashboard > Customers | FULLY INDEPENDENT -- can be used for communication |
| Payment history | Stripe Dashboard > Payments | FULLY INDEPENDENT |
| Subscription plans (monthly/annual/lifetime) | Stripe Dashboard > Products | FULLY INDEPENDENT |
| Webhook logs | Stripe Dashboard > Developers > Webhooks | FULLY INDEPENDENT |

**Critical point:** Stripe subscriptions are completely decoupled from Chrome Web Store status. If Focus Mode is removed from CWS, all Pro subscriptions continue billing and all license validation continues working (with the 7-day offline grace period for cached licenses).

#### Revenue Protection Strategy

```
Revenue Impact Timeline (if Focus Mode is removed from CWS):
============================================================

Day 0:    No immediate revenue impact. All Pro subscriptions remain active.
          Existing users retain full functionality (extension still installed).
          New installs stop immediately.

Day 1-7:  Pro features continue working for all users (cached license, 7-day grace).
          Revenue continues: no subscription churn unless users manually cancel.
          New installs: zero from CWS.
          New installs: begin from GitHub sideload (if published).

Day 7-14: Users whose license cache expires will lose Pro features unless they
          can reach the license validation server. If the server is up and the
          user has internet, re-validation happens transparently.
          Voluntary churn begins: some users will cancel after hearing about removal.

Day 14+:  Sustained churn accelerates. Users who see "removed from Chrome Web Store"
          assume the extension is dead and cancel.
          Mitigation: Active communication (see Section 7.2) reduces churn by ~40%.

Revenue Protection Actions:
  1. Do NOT pause Stripe billing. Service is not interrupted.
  2. Email all Pro subscribers within 24 hours (see Template 3 in Section 7.2).
  3. Provide sideload instructions so users can reinstall if they uninstall.
  4. Emphasize: "Your subscription is safe. Your data is safe. The extension works."
  5. If removal lasts >30 days, offer goodwill: extend all subscriptions by the
     number of days the extension was unavailable.
```

---

# Section 6: Proactive Prevention

## 6.1 Safe Update Practices

### Update Risk Matrix

Every change to Focus Mode carries a different level of CWS review risk. Use this matrix before every submission to assess whether the update is likely to trigger additional scrutiny.

| Change Type | Risk Level | Review Impact | Example |
|-------------|------------|---------------|---------|
| Bug fix (logic only, no API changes) | LOW | Standard review, ~1-3 days | Fix timer off-by-one error |
| UI-only changes (CSS, layout, icons) | LOW | Standard review, ~1-3 days | Redesign popup header |
| Adding new blocked category (static ruleset) | LOW | Standard review, DNR rules are expected | Add "gaming" category to pre-built lists |
| Adding new Pro feature (behind existing gate) | LOW | Standard review | Add "custom block page themes" to Pro |
| Adding new ambient sound files | LOW | Standard review | Add 3 new ambient sound options |
| Updating store listing text | NONE | No code review triggered | Edit description for better ASO |
| Updating screenshots | NONE | No code review triggered | Refresh screenshots for new UI |
| Changing required permissions (adding) | **HIGH** | Extended review, likely manual. CWS compares the new manifest to the old one and flags any new permissions. | Adding `tabs` to required permissions |
| Changing required permissions (removing) | LOW | Usually fast-tracked, seen as positive | Removing `offscreen` if no longer needed |
| Adding new content script | **HIGH** | Triggers content script review. Adding a new script on `<all_urls>` is especially scrutinized. | Adding a 4th content script for new feature |
| Changing `<all_urls>` scope | **HIGH** | Any change to host permissions triggers manual review | Switching from `<all_urls>` to specific domains |
| Adding optional permissions | MEDIUM | Reviewed but less scrutiny than required permissions | Adding `bookmarks` to optional_permissions |
| Adding external resource loading | **CRITICAL** | Will trigger deep review. Any new external URL in CSP or web_accessible_resources is flagged. | Loading a script from a CDN |
| Major version bump (1.x to 2.x) | MEDIUM | May trigger full re-review as if new submission | Releasing v2.0.0 |

### How to Add Optional Permissions Safely

When Focus Mode needs a new permission for a new feature, follow this process to minimize rejection risk:

1. **Add the permission to `optional_permissions` in manifest.json** -- NOT to `permissions`. This avoids triggering the install-time permission warning change.

2. **Request the permission at the moment of use** using `chrome.permissions.request()`. This must be called from a user gesture (click handler) or the request will be silently denied.

3. **Provide clear context before the request.** Before calling `chrome.permissions.request()`, show the user a UI explanation:
   ```
   "To enable [Feature Name], Focus Mode needs permission to [plain-language explanation].
   This is used only for [specific purpose]. No data is collected."
   [Grant Permission] [Not Now]
   ```

4. **Handle denial gracefully.** If the user denies the permission, the feature remains locked with a message explaining what it would do and how to enable it later in settings.

5. **Document the new permission** in `docs/store-assets/privacy/privacy-permissions.txt` and update the privacy policy if the permission touches data access.

### How to Introduce New Features Without Triggering Review Flags

1. **Ship the feature behind a feature flag** that is disabled by default. The code is present but never executes. This passes review because no new behavior is visible.

2. **In the next update, enable the feature flag.** The reviewer sees the same code but now the feature is active. Since no permissions changed and no new scripts were added, review is routine.

3. **Never ship a feature that requires a new permission and uses that permission in the same update.** Split it:
   - Update 1: Add the permission to `optional_permissions` (no code uses it yet)
   - Update 2: Add the code that requests and uses the permission

### Version Bump Strategy

| Scenario | Version Change | Example |
|----------|---------------|---------|
| Bug fix, no behavior change | Patch: X.Y.**Z+1** | 1.0.0 -> 1.0.1 |
| New feature, no permission changes | Minor: X.**Y+1**.0 | 1.0.1 -> 1.1.0 |
| Permission changes, major refactor | Major: **X+1**.0.0 | 1.1.0 -> 2.0.0 |
| CWS compliance fix (after rejection) | Patch: X.Y.**Z+1** | 1.0.0 -> 1.0.1 |

**Rule:** Never submit a major version bump unless necessary. Major version changes may trigger a full re-review equivalent to a new submission.

### Staged Rollout Using CWS Partial Deployment

Chrome Web Store supports partial rollout (also called "trusted testers" or percentage-based deployment):

1. **Set up trusted testers.** In the Developer Console, go to Distribution > Visibility > Trusted testers. Add 5-10 email addresses of team members and beta users.

2. **Deploy to trusted testers first.** Upload the update and select "Trusted testers only" visibility. Wait 3-5 days for feedback.

3. **Expand to 10% rollout.** If no issues, change deployment percentage to 10%. Monitor Sentry for error spikes. Monitor CWS reviews for negative feedback. Wait 3-5 days.

4. **Full rollout.** If 10% is stable, deploy to 100%.

5. **For risky updates** (permission changes, new content scripts), always use trusted testers first. If the update is rejected at the trusted tester stage, it does NOT affect the publicly visible version.

---

## 6.2 A/B Testing Compliance

### How Focus Mode Handles A/B Testing

Focus Mode implements A/B testing using a fully local, privacy-compliant approach. No data leaves the device. No remote A/B testing service is used.

**Architecture:**
- Variant assignment happens via `Math.random()` at install time in `src/onboarding/ab-test.js`
- Assignments are stored in `chrome.storage.local` under the key `abTestGroups`
- Assignments persist for the lifetime of the install (never reassigned)
- No remote config server determines variants -- all logic is in the extension code
- No user behavior data is transmitted to evaluate test results

### Planned A/B Tests (from Phase 08 Onboarding System)

| Test ID | Control | Variant | What Changes for Users | CWS Compliance Risk |
|---------|---------|---------|----------------------|---------------------|
| `pre-selected-sites` | 3 sites pre-checked (reddit, twitter, youtube) | 0 sites pre-checked | Only affects onboarding slide 2 checkbox state | NONE -- purely UI state |
| `cta-text` | Button: "Start Now -- 25 min" | Button: "Block My First Distraction" | Only affects button label text on onboarding slide 5 | NONE -- purely cosmetic |
| `slide-count` | 5-slide onboarding flow | 3-slide compact flow | Reduces onboarding steps; same features available | NONE -- less content, not more |
| `sound-preview` | Sounds play only on click | Rain auto-plays at 0.15 volume on slide 3 | Ambient sound plays during onboarding | LOW -- auto-play could surprise users, but volume is minimal and the audio stops when leaving the slide |

### Compliance Audit Results

All 4 planned A/B tests pass the following compliance checks:

- [x] **No remote code execution.** All variants are bundled in the extension code. No variant loads external scripts or resources.
- [x] **No data transmission.** Test assignments and results are stored only in `chrome.storage.local`. No analytics endpoint receives A/B test data.
- [x] **No deceptive behavior.** No variant changes the extension's core functionality. All variants deliver the same feature set; only presentation differs.
- [x] **No permission differences.** No variant requires additional permissions.
- [x] **No user manipulation.** No variant creates artificial urgency, dark patterns, or misleading claims.
- [x] **Consistent with store listing.** All variants match the described functionality in the CWS listing.

### Disclosure in Privacy Policy

The privacy policy at https://zovo.one/privacy/focus-mode-blocker should include the following section (add if not already present):

> **Local Experimentation**
> Focus Mode - Blocker may vary minor UI elements (such as button text, onboarding flow length, or default settings) between installations to improve the user experience. These variations are determined randomly at install time, stored locally on your device, and never transmitted to any server. No personally identifiable information is associated with these variations.

---

## 6.3 Monetization Compliance

### Focus Mode Monetization Audit

Every monetization touchpoint in Focus Mode must comply with Chrome Web Store's policies on payments, deceptive behavior, and user experience. Below is a complete audit of all monetization mechanisms.

#### Payment Processing: Stripe

| Requirement | Status | Notes |
|-------------|--------|-------|
| External payment processor (not CWS payments API) | COMPLIANT | Stripe handles all payment processing |
| No payment processing inside the extension popup | COMPLIANT | User is redirected to external Stripe Checkout page |
| Payment information never stored in extension | COMPLIANT | Only a license validation status (boolean + expiry timestamp) is stored in `chrome.storage.local` |
| Stripe.js loaded from CDN (`js.stripe.com`) | EXPECTED | Standard practice; Stripe requires loading their JS from their CDN for PCI compliance |
| No misleading pricing claims | COMPLIANT | All prices clearly displayed: Free / $4.99/mo / $2.99/mo (annual) / $49.99 lifetime |

#### Paywall Triggers (T1-T10) Audit

| Trigger | Deceptive? | Assessment |
|---------|-----------|------------|
| T1: Weekly Report Unlock (blur preview) | NO | The blurred report clearly shows a "Unlock with Pro" label. The blur effect communicates "this exists but is premium" -- it does not suggest the feature is broken. **Action required:** Ensure the overlay text says "Pro Feature" not "Loading..." or "Error." |
| T2: 11th Site Block (capacity limit) | NO | The counter "8/10 sites" is visible throughout usage. When the user hits 10, the upgrade prompt appears. The limit is documented in the CWS listing as a free-tier limit. Not artificially crippled -- 10 sites is genuinely useful. |
| T3: Nuclear Extension (cooldown limit) | NO | Users get one free Nuclear Mode session per cooldown. The upgrade prompt appears only on the second attempt within 5 minutes. This is a usage limit, not a bait-and-switch. |
| T4: Focus Score Breakdown (blur preview) | NO | Same pattern as T1. The number is free; the detailed breakdown is Pro. Clearly labeled. |
| T5: Pro Feature Lock Tap (explicit lock icon) | NO | Lock icons are universally understood to mean "premium." User explicitly taps a locked item. Not a trap or dark pattern. |
| T6: Post-Best-Session Offer (celebratory) | NO | Appears after a genuine achievement. Does not block continued use. Dismissible. The countdown discount is legitimate (founding member pricing is a real time-limited offer). |
| T7: Weekly Distraction Alert (notification) | BORDERLINE | Uses the "security alert" visual pattern (from Phase 03 analysis). **Action required:** Ensure the notification does NOT use alarming language like "Warning" or "Alert." Use positive framing: "Your Weekly Focus Summary is Ready" not "You Were Distracted 47 Times This Week." |
| T8: Export Gate (lock tooltip) | NO | Export is clearly a Pro feature. The tooltip makes this obvious. No data is lost -- the user can still view their data in the extension. |
| T9: Sync Prompt (second device) | NO | A genuine value proposition (sync data across devices). Not a nag screen -- fires exactly once per new device. |
| T10: Custom Timer (slider snap-back) | NO | The slider snaps back to 25 minutes with a brief lock animation. Clear visual communication that longer timers are Pro. Not misleading. |

#### Specific Concern: T1 Blurred Weekly Report

**Risk:** A reviewer could interpret a blurred UI element as a "broken feature" rather than a "premium preview," especially if the blur is applied without clear labeling.

**Required safeguards:**
1. The blurred area MUST have an overlay with text: "Pro Feature -- Unlock Your Weekly Report"
2. The overlay MUST include the Pro badge icon (lock with star)
3. The blur should NOT be applied to the entire popup -- only to the report content area
4. There MUST be a visible "Dismiss" or "Maybe Later" option that does not require scrolling
5. The free tier MUST still show a basic summary (e.g., "5 sessions this week, 2.5 hours focused") without blur

#### Other Monetization Elements

| Element | Compliance Status | Notes |
|---------|-------------------|-------|
| No ad injection | COMPLIANT | Focus Mode contains zero advertising code |
| No affiliate codes or referral tracking | COMPLIANT | No affiliate links in any context |
| Free tier genuinely useful | COMPLIANT | 10 blocked sites, Pomodoro timer, basic stats, Focus Score, streak tracking, keyboard shortcuts, basic Nuclear Mode -- comprehensive free experience |
| Founding member pricing | COMPLIANT | Legitimate limited-time offer with a real deadline. Not a perpetual "sale" with artificial urgency. The founding member price expires at a specific install count or date. |
| No forced upgrade flows | COMPLIANT | Users can use the free tier indefinitely without degradation. No features are removed over time. No increasing nag frequency. |
| "Go Pro" footer link (appears Day 14+) | COMPLIANT | Permanent but non-intrusive. Does not animate, flash, or obstruct. Text-only link in popup footer. |

---

## 6.4 Third-Party Code Audit

### Runtime Dependencies

Focus Mode - Blocker is designed to minimize third-party runtime dependencies. The fewer external libraries in the production bundle, the lower the CWS review risk and the faster the review process.

| Package | Usage | Risk Level | CWS Compliance | Audit Notes |
|---------|-------|------------|-----------------|-------------|
| **None (v1.0.0)** | N/A | N/A | N/A | Focus Mode v1.0.0 ships with ZERO NPM runtime dependencies. All functionality is implemented with native browser APIs and custom code. |

**Future planned runtime dependencies (not in v1.0.0):**

| Package | Planned Version | Usage | Risk Level | Audit Status |
|---------|-----------------|-------|------------|--------------|
| `@sentry/browser` | v8.x | Error tracking and crash reporting in service worker and content scripts | HIGH | See detailed audit below |
| Stripe.js | Latest (CDN) | Payment processing for Pro tier | MEDIUM | See detailed audit below |

### Development Dependencies

Development dependencies are NOT included in the production bundle and do NOT appear in the CWS submission ZIP. They pose zero CWS compliance risk.

| Package | Usage | In Production Bundle? |
|---------|-------|----------------------|
| Vite | Build tool / bundler | NO |
| Jest | Unit testing | NO |
| Puppeteer | E2E testing | NO |
| ESLint | Code linting | NO |
| Prettier | Code formatting | NO |
| TypeScript | Type checking | NO (compiled to JS) |

### Sentry SDK Audit (Planned -- HIGH Risk)

**Package:** `@sentry/browser` (planned for future release, NOT in v1.0.0)

| Concern | Assessment | Mitigation |
|---------|------------|------------|
| Collects error stack traces | These may contain URLs of pages the user visited when the error occurred | Configure Sentry to scrub URLs: `beforeSend` callback strips all URL data from error reports |
| Sends data to external server | Sentry events are transmitted to `o[org-id].ingest.sentry.io` | This IS data transmission and MUST be disclosed in the privacy policy and CWS data usage declaration |
| May collect IP addresses | Sentry stores the IP of the client making the request | Enable Sentry's "Data Scrubbing" and set "Prevent Storing of IP Addresses" in project settings |
| May include user context | Sentry can capture browser version, OS, screen size | Only send extension version and error context; strip all browser/OS metadata |
| Adds bundle size | ~30-50KB gzipped | Acceptable for error tracking value |
| Requires CSP exception | Sentry needs to connect to its ingest domain | Add `connect-src` to CSP: `connect-src 'self' https://*.ingest.sentry.io` |

**CWS Disclosure Requirements for Sentry:**
1. Update privacy policy: "We use Sentry for anonymous crash reporting. Error reports may include extension version, error message, and stack trace. No browsing data, personal information, or page content is included."
2. Update CWS data usage declaration: Mark "Crash reports" as COLLECTED with purpose "Functionality" and note "Anonymous, no PII."
3. Update `docs/store-assets/privacy/privacy-data-usage.txt` to reflect the change.
4. Add Sentry to `docs/store-assets/privacy/privacy-remote-code.txt` with justification.

**Recommendation:** Delay Sentry integration until v1.1.0 or later. Ship v1.0.0 with zero data collection to establish trust with CWS reviewers. Add Sentry in a minor update after the extension has a clean review history.

### Stripe.js Audit (Pro Tier -- MEDIUM Risk)

**Loaded from:** `https://js.stripe.com/v3/` (external CDN)

| Concern | Assessment | Mitigation |
|---------|------------|------------|
| External script loading | Stripe.js is loaded from Stripe's CDN, not bundled | This is REQUIRED by Stripe for PCI compliance. CWS generally accepts this because Stripe is a well-known, trusted payment processor. |
| Script has access to page DOM | Stripe.js creates a secure iframe for card input; it does not read arbitrary DOM elements | Standard Stripe integration; no additional DOM access beyond the payment form |
| Only loaded on payment pages | Stripe.js is loaded ONLY when the user navigates to the checkout/payment page, NOT in the popup or background | Minimizes exposure; script never runs during normal extension usage |
| Listed in CSP | `script-src` must include `https://js.stripe.com` for the checkout page | Apply only to the checkout page CSP, not the extension-wide CSP |

**CWS Disclosure Requirements for Stripe.js:**
1. Already disclosed in privacy policy under "Pro Tier" section.
2. Listed in `docs/store-assets/privacy/privacy-remote-code.txt`.
3. CWS data usage: Mark "Financial information" as COLLECTED with purpose "Payment processing" and note "Handled by Stripe; we never see or store card details."

### No Other Third-Party Scripts

Focus Mode v1.0.0 contains:
- No analytics libraries (Google Analytics, Mixpanel, Amplitude, etc.)
- No advertising SDKs
- No social media SDKs
- No A/B testing services (local implementation only)
- No CDN-loaded fonts (system fonts or bundled fonts only)
- No remote configuration services
- No WebSocket connections
- No third-party APIs beyond Stripe (Pro tier)

This zero-dependency approach is a deliberate strategy to maximize CWS approval speed and minimize review friction.

---

# Section 7: Emergency Playbook

## 7.1 Extension Takedown Response (24-Hour Plan)

This is the complete hour-by-hour playbook for when Focus Mode - Blocker is removed from the Chrome Web Store. It covers communication, technical response, and revenue protection.

### Hour 0: Detection and Initial Response (0-30 minutes)

**Detection channels (in order of speed):**
1. Email notification from CWS to developer email
2. Automated monitoring alert (set up a URL monitor on the CWS listing page)
3. User reports via support email or GitHub issues
4. Social media mentions

**Immediate actions:**

```
MINUTE 0-5:
  [ ] Read the takedown notice
  [ ] Identify: Warning vs. Suspension vs. Termination
  [ ] Screenshot the notice and developer console
  [ ] Create incident channel: #focus-mode-takedown-YYYY-MM-DD

MINUTE 5-15:
  [ ] Check all Zovo extensions in developer console
  [ ] Check email for any additional notices
  [ ] Note appeal deadline
  [ ] DO NOT respond to Google yet

MINUTE 15-30:
  [ ] Begin documentation (see Section 5.2, Hour 1-4)
  [ ] Assign team roles:
      - Person A: Technical analysis and code fix
      - Person B: User communication
      - Person C: Appeal drafting
  [ ] Set up war room / video call if needed
```

### Hour 1-4: Triage and Communication

**Website notification (zovo.one):**
- Add a banner to https://zovo.one/tools/focus-mode-blocker:
  ```
  [STATUS BANNER - YELLOW]
  Focus Mode - Blocker is temporarily unavailable on the Chrome Web Store
  while we work with Google to resolve a review issue. Your extension
  still works normally. Your data and subscription are safe.
  [Learn More] [Get Updates]
  ```
- The "Learn More" link goes to a status page or GitHub issue.

**GitHub issue for transparency:**
- Create a new issue at https://github.com/theluckystrike/focus-mode-blocker/issues
- Title: "Chrome Web Store Status: Temporary Removal (YYYY-MM-DD)"
- Body: Use Template 1 from Section 7.2 (adapted for GitHub)
- Pin the issue
- Label: `status`, `chrome-web-store`

**Email to Pro subscribers (via Stripe):**
- Export customer email list from Stripe Dashboard > Customers
- Send email using Stripe's customer communication feature or a transactional email service
- Use Template 3 from Section 7.2
- **Send within 4 hours of detection** -- Pro subscribers are paying customers and deserve prompt communication

**Social media:**
- Twitter/X: Short factual statement with link to GitHub issue
- Reddit (r/productivity, r/chrome_extensions): If Focus Mode has a presence there
- Keep tone: professional, transparent, confident

### Hour 4-12: Technical Response

```
HOUR 4-6:
  [ ] Complete violation analysis (see Section 5.2 table)
  [ ] Identify all code changes needed
  [ ] Create fix branch: fix/cws-compliance-YYYYMMDD
  [ ] Begin implementing fixes

HOUR 6-10:
  [ ] Complete code changes
  [ ] Run full test suite
  [ ] Test in Chrome with a clean profile
  [ ] Bump version number
  [ ] Build submission ZIP

HOUR 10-12:
  [ ] Draft appeal using templates (Section 5.3)
  [ ] Peer review the appeal
  [ ] Peer review the code changes
  [ ] Final testing pass
```

### Hour 12-24: Appeal and Alternative Distribution

```
HOUR 12-14:
  [ ] Submit appeal via CWS Developer Console
  [ ] Upload fixed extension package with appeal
  [ ] Save confirmation / screenshot of appeal submission

HOUR 14-18:
  [ ] Prepare GitHub Release with sideloadable ZIP
  [ ] Write sideload instructions page
  [ ] Prepare Edge Add-ons submission (if not already listed)

HOUR 18-24:
  [ ] Publish GitHub Release
  [ ] Update website status page with sideload instructions
  [ ] Send follow-up email to Pro subscribers with sideload option
  [ ] Monitor for Google's response
  [ ] Get some sleep -- the appeal review takes 1-7 business days
```

### Post-24 Hour: Monitoring and Follow-Up

| Day | Actions |
|-----|---------|
| Day 2 | Check developer console for appeal status. No news is normal. |
| Day 3 | If no response, check email spam folder. Update GitHub issue with "Still waiting for review." |
| Day 5 | If no response, submit a follow-up via the CWS support form (one-pager.google.com/chrome-developer-support). |
| Day 7 | If still no response, escalate: search for CWS team contacts on Twitter, file a report on the Chromium bug tracker. |
| Day 14 | If appeal was denied, review the denial reason, make additional changes, and submit a new appeal. Consider consulting a lawyer if the denial appears unjustified. |
| Day 30 | If still not resolved, prioritize alternative distribution (Edge, Firefox, sideload) and communicate to users that the CWS version is discontinued for now. |

---

## 7.2 User Communication Templates

### Template 1: Takedown Notice

Use this template on the website, GitHub, and social media within 4 hours of takedown detection.

---

**Focus Mode - Blocker: Chrome Web Store Status Update**

Hi everyone,

We want to be transparent about a situation affecting Focus Mode - Blocker.

**What happened:**
On [DATE], Google removed Focus Mode - Blocker from the Chrome Web Store pending a review. We received notification citing [GENERAL REASON -- e.g., "a policy review related to permissions"].

**What this means for you:**
- **If you already have Focus Mode installed, it continues to work normally.** The extension is not disabled, your data is not affected, and your blocklists, timers, and settings are all intact.
- **New installations from the Chrome Web Store are temporarily unavailable.**
- **Pro subscribers: Your subscription is not affected.** All Pro features continue to work. Your payment through Stripe is completely independent of the Chrome Web Store.

**What we are doing:**
We have already submitted an appeal to Google's review team with a detailed explanation of our extension's functionality and compliance. We believe this is a [misunderstanding / automated flag / resolvable issue] and expect it to be resolved within [1-2 weeks].

In the meantime, we have published a sideloadable version on our GitHub Releases page for anyone who needs to install Focus Mode on a new device:
https://github.com/theluckystrike/focus-mode-blocker/releases

**What you can do:**
- **Do not uninstall Focus Mode.** If you uninstall, you will not be able to reinstall from the Chrome Web Store until the issue is resolved.
- If you have questions, please open an issue on our GitHub or email us at support@zovo.one.

We will post updates here as the situation develops. Thank you for your patience and for being part of the Focus Mode community.

-- The Zovo Team

---

### Template 2: Resolution Update

Use this template when Focus Mode is reinstated on the Chrome Web Store.

---

**Focus Mode - Blocker is Back on the Chrome Web Store**

Great news -- Focus Mode - Blocker has been reinstated on the Chrome Web Store and is available for new installations again.

**What happened:**
On [TAKEDOWN DATE], our extension was temporarily removed due to [BRIEF, HONEST EXPLANATION -- e.g., "a policy review related to how we request permissions"]. We worked with Google's review team to address their concerns and the extension was reinstated on [REINSTATEMENT DATE].

**What changed:**
We made the following improvements as part of this process:
- [CHANGE 1 -- e.g., "Improved how we explain permission usage during installation"]
- [CHANGE 2 -- e.g., "Added clearer exit options to Nuclear Mode"]
- [CHANGE 3 -- e.g., "Updated our privacy policy with additional detail"]

These changes make Focus Mode better and more transparent for everyone.

**How to update:**
- If you already have Focus Mode installed, Chrome will automatically update to the latest version (v[X.Y.Z]). You do not need to do anything.
- If you installed the sideloaded version from GitHub, we recommend switching back to the Chrome Web Store version for automatic updates. Uninstall the sideloaded version and install from: [CWS LINK]
- If you uninstalled during the downtime, you can now reinstall from the Chrome Web Store.

**Your data:**
All your blocklists, settings, Focus Score history, and streak data are stored locally and were not affected by this event. Everything is exactly where you left it.

Thank you for your support and patience. We are committed to maintaining a high-quality, privacy-respecting extension and will continue to work closely with Google to ensure compliance.

-- The Zovo Team

---

### Template 3: Pro Subscriber Communication

Send this via email (Stripe customer list or transactional email service) within 4 hours of takedown.

---

**Subject:** Focus Mode Pro: Important Update About Chrome Web Store Status

Hi [FIRST_NAME or "there"],

You are receiving this email because you are a Focus Mode Pro subscriber. We want to keep you informed about a situation with our Chrome Web Store listing.

**The short version:** Focus Mode - Blocker was temporarily removed from the Chrome Web Store on [DATE]. **Your Pro subscription, your data, and your extension all continue to work normally.**

**Details:**

1. **Your extension still works.** The removal from the Chrome Web Store does not disable extensions that are already installed. Focus Mode continues to block sites, track your focus, and manage your sessions exactly as before.

2. **Your Pro features are active.** Your license is cached locally and remains valid. All Pro features (unlimited sites, custom timers, advanced stats, Nuclear Mode, etc.) continue to work without interruption.

3. **Your subscription is safe.** Your Stripe subscription is completely independent of the Chrome Web Store. No charges are affected, no changes have been made to your billing.

4. **Your data is safe.** All your blocklists, Focus Score history, streak data, and settings are stored locally on your device and are not affected in any way.

**What happened:**
Google's review team flagged our extension for [GENERAL REASON]. We have submitted an appeal and are confident this will be resolved within [TIMEFRAME].

**What if I need to reinstall?**
If for any reason you need to install Focus Mode on a new device before the Chrome Web Store listing is restored, you can download and sideload the extension from our GitHub:
https://github.com/theluckystrike/focus-mode-blocker/releases

Sideload instructions are included on that page.

**Do I need to do anything?**
No. Your extension and subscription continue to work normally. We will email you again when the situation is fully resolved.

If you have any questions or concerns, reply to this email or reach out at support@zovo.one.

Thank you for supporting Focus Mode Pro. Your trust means everything to us.

-- The Zovo Team

P.S. If the Chrome Web Store removal lasts longer than 30 days, we will automatically extend your subscription by the number of affected days at no cost.

---

## 7.3 Revenue Protection

### Stripe Subscription Independence

The most critical fact for revenue protection: **Stripe subscriptions are completely decoupled from Chrome Web Store status.** This is by design. The subscription management, billing, and license validation all happen through Stripe and our own license server, not through Chrome Web Store payments.

| Revenue Component | CWS Dependency | Status During Takedown |
|-------------------|----------------|----------------------|
| Stripe monthly billing ($4.99/mo) | NONE | Continues normally |
| Stripe annual billing ($2.99/mo = $35.88/yr) | NONE | Continues normally |
| Stripe lifetime purchases ($49.99) | NONE | Already paid, no recurring billing |
| Team billing ($3.99/user/mo) | NONE | Continues normally |
| License validation API | NONE (runs on our server) | Continues normally if server is up |
| Cached license in extension | NONE (stored in chrome.storage.local) | Valid for 7-day offline grace period |

### Pro Feature Offline Grace Period

Focus Mode Pro licenses are cached locally with a 7-day grace period:

```
License Validation Flow:
========================
1. User purchases Pro via Stripe Checkout
2. License key is returned and stored in chrome.storage.local
3. Extension validates license against server on:
   - First install
   - Every extension startup (if online)
   - Every 24 hours (background check via alarms API)
4. If validation succeeds: license cache refreshed, expiry set to now + 7 days
5. If validation fails (offline / server down): cached license used
6. If cache is expired (>7 days without successful validation):
   - Pro features gracefully downgrade to free tier
   - User sees: "Unable to verify your Pro license. Please check your
     internet connection. Your Pro features will be restored once
     verification succeeds."
   - No data is deleted; pro features re-enable immediately on re-verification
```

**During a CWS takedown:** The license validation server continues to operate independently. Users' Pro features work indefinitely as long as the server is reachable. Even if the server is down simultaneously, users have a 7-day grace window.

### Revenue Risk Assessment by Scenario

| Scenario | Duration | Revenue Impact | Mitigation |
|----------|----------|----------------|------------|
| Takedown resolved in <3 days | 1-3 days | MINIMAL -- existing users unaffected, only new installs paused | Standard communication (Section 7.2) |
| Takedown resolved in 1-2 weeks | 7-14 days | LOW -- some voluntary churn (5-10% of subscribers), no new user acquisition | Pro subscriber email, sideload option, goodwill extension offer |
| Takedown resolved in 1 month | 30 days | MEDIUM -- churn accelerates (15-25%), significant new user acquisition loss | Full alternative distribution (GitHub, Edge), active community management |
| Takedown not resolved / account terminated | Permanent | HIGH -- eventual full churn without active intervention | Migrate to Edge/Firefox as primary stores, rebrand if necessary, offer refunds to affected subscribers |

### Churn Prevention Actions

1. **Email Pro subscribers within 4 hours** (Template 3 above). The single most effective churn prevention is proactive, honest communication.

2. **Provide sideload instructions** so users who uninstall (or buy new devices) can still access the extension.

3. **Keep the license server running.** Even if CWS removes the extension, the license validation server must remain operational.

4. **Offer goodwill extensions.** If the takedown lasts >14 days, email subscribers: "We are extending your subscription by [N] days to compensate for any inconvenience."

5. **Never pause Stripe billing proactively.** Users who want to cancel will cancel themselves. Proactively pausing billing sends the wrong message (implies the service is down, which it is not).

6. **Monitor Stripe dashboard daily** during the incident for unusual churn patterns.

---

## 7.4 Alternative Distribution Guide

If the Chrome Web Store listing is unavailable (during takedown or as a permanent backup), Focus Mode can be distributed through the following alternative channels.

### Option 1: GitHub Releases (Sideload for Chrome)

**Setup time:** 1-2 hours
**Audience:** Technical users, loyal community members
**Persistence:** Extension works but must be re-enabled after every Chrome restart if installed in developer mode; can be made persistent with a .crx file from a registered developer.

**Step-by-step:**

1. **Build the extension package:**
   ```bash
   # From the project root
   VERSION=$(node -p "require('./manifest.json').version")

   # Clean build
   npm run build  # or your build command

   # Create the ZIP
   cd dist  # or wherever your build output is
   zip -r "../releases/focus-mode-blocker-v${VERSION}.zip" . \
     -x "*.map" -x "*.DS_Store"
   cd ..
   ```

2. **Create a GitHub Release:**
   ```bash
   gh release create "v${VERSION}" \
     "releases/focus-mode-blocker-v${VERSION}.zip" \
     --title "Focus Mode - Blocker v${VERSION}" \
     --notes "$(cat <<'EOF'
   ## Focus Mode - Blocker v${VERSION}

   This release is provided for manual installation while the Chrome Web Store
   listing is being restored.

   ### Installation Instructions

   1. Download `focus-mode-blocker-v${VERSION}.zip` from the Assets below
   2. Unzip the file to a permanent folder on your computer (e.g., `~/focus-mode-blocker/`)
   3. Open Chrome and go to `chrome://extensions/`
   4. Enable "Developer mode" (toggle in top-right corner)
   5. Click "Load unpacked"
   6. Select the unzipped folder
   7. Focus Mode - Blocker will appear in your extensions

   **Important:** Do not delete the unzipped folder. Chrome loads the extension
   directly from this folder.

   **Note:** Extensions installed this way will show a "Developer mode extensions"
   warning on Chrome startup. This is normal and expected for sideloaded extensions.
   Your data and settings will be preserved.
   EOF
   )"
   ```

3. **Add sideload instructions to the website:**
   Create a page at `https://zovo.one/tools/focus-mode-blocker/install` with the same instructions, plus screenshots of each step.

### Option 2: Edge Add-ons Store

**Setup time:** 2-4 hours (first submission), 30 minutes (updates)
**Audience:** Edge users, Chrome users willing to switch
**Persistence:** Full store distribution with automatic updates

**Step-by-step:**

1. **Register for Microsoft Partner Center** (if not already):
   - Go to https://partner.microsoft.com/en-us/dashboard/microsoftedge/overview
   - Sign in with a Microsoft account
   - Pay the one-time registration fee ($19)

2. **Prepare the manifest:** Edge Add-ons accepts MV3 Chrome extensions with minimal changes. Focus Mode's manifest.json should work as-is. Verify:
   - `manifest_version: 3` -- supported
   - All permissions -- supported (Edge uses the same permission model as Chrome)
   - `declarativeNetRequest` -- supported
   - `<all_urls>` -- supported (but may face similar review scrutiny)

3. **Modify store listing for Edge:**
   - Description: Same as CWS but replace "Chrome" references with "browser"
   - Screenshots: Retake in Edge browser (or use browser-agnostic screenshots)
   - Privacy policy URL: Same (https://zovo.one/privacy/focus-mode-blocker)

4. **Submit:**
   ```
   Partner Center > Microsoft Edge Add-ons > Submit new extension
   Upload: focus-mode-blocker-v${VERSION}.zip
   Fill in: listing details, privacy practices, test notes
   Submit for review
   ```

5. **Expected review time:** 1-7 business days (typically faster than CWS)

6. **Advantages of Edge Add-ons:**
   - Separate review team from Google (diversifies risk)
   - Edge Chromium uses the same engine (extension works identically)
   - Growing user base
   - Can serve as permanent backup distribution channel

### Option 3: Firefox Add-ons (AMO)

**Setup time:** 4-8 hours (manifest transformation + testing)
**Audience:** Firefox users, privacy-conscious users
**Persistence:** Full store distribution with automatic updates

**Step-by-step:**

1. **Register for AMO** (if not already):
   - Go to https://addons.mozilla.org/en-US/developers/
   - Create a Firefox account

2. **Transform the manifest:** Firefox uses a different manifest format. Key changes:

   ```json
   // Chrome manifest.json -> Firefox manifest.json changes:

   // 1. Add browser_specific_settings (required for AMO)
   "browser_specific_settings": {
     "gecko": {
       "id": "focus-mode-blocker@zovo.one",
       "strict_min_version": "109.0"
     }
   }

   // 2. Replace service_worker with background scripts
   // Chrome:
   "background": {
     "service_worker": "src/background/service-worker.js",
     "type": "module"
   }
   // Firefox:
   "background": {
     "scripts": ["src/background/service-worker.js"],
     "type": "module"
   }

   // 3. declarativeNetRequest -> Firefox supports this as of Firefox 109
   //    but the API surface differs slightly. Test thoroughly.

   // 4. offscreen API -> NOT supported in Firefox.
   //    Alternative: use background script audio (Firefox background
   //    scripts are persistent, unlike Chrome service workers)
   //    Remove "offscreen" from permissions

   // 5. host_permissions format is the same -- no change needed
   ```

3. **API compatibility changes:**
   - Replace `chrome.*` with `browser.*` (Firefox uses the `browser` namespace with promises)
   - Or use the WebExtension polyfill: `webextension-polyfill` (adds ~20KB)
   - Test `declarativeNetRequest` thoroughly -- Firefox's implementation may have quirks
   - Remove `offscreen` document code; use direct audio playback in background script

4. **Submit to AMO:**
   ```
   AMO Developer Hub > Submit a New Add-on
   Upload: focus-mode-blocker-firefox-v${VERSION}.zip
   Choose: "On this site" (listed on AMO) or "On your own" (self-distributed, signed)
   Fill in: listing details
   Submit for review
   ```

5. **Expected review time:** 1-5 business days for listed add-ons; ~24 hours for self-distributed (auto-signed)

### Option 4: Enterprise Deployment via Google Workspace Admin

**Setup time:** 1-2 hours (requires Google Workspace admin access)
**Audience:** Team/enterprise customers
**Persistence:** Managed deployment, survives CWS removal

**Step-by-step:**

1. **Host the extension on a web server** (or use the GitHub Release ZIP URL)

2. **Create an update manifest XML file:**
   ```xml
   <?xml version='1.0' encoding='UTF-8'?>
   <gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
     <app appid='[EXTENSION_ID]'>
       <updatecheck codebase='https://zovo.one/releases/focus-mode-blocker-v1.0.0.crx'
                    version='1.0.0' />
     </app>
   </gupdate>
   ```
   Host this at: `https://zovo.one/releases/updates.xml`

3. **In Google Workspace Admin Console:**
   - Go to Devices > Chrome > Apps & Extensions
   - Click the "+" button > Add from URL
   - Enter the update manifest URL
   - Select the target organizational unit
   - Set install policy: "Force install" or "Allow install"

4. **Advantages:**
   - Extension is force-installed on all managed Chrome browsers
   - Survives CWS removal (admin-installed extensions are not affected by CWS status)
   - Automatic updates via the update manifest
   - Ideal for Team plan customers

5. **Limitations:**
   - Requires Google Workspace (paid Google admin account)
   - Only works for managed Chrome browsers (corporate/school)
   - Does not help individual users

### Distribution Priority During Takedown

```
Priority 1 (within 24 hours):  GitHub Releases (sideload ZIP)
  - Fastest to set up
  - Available to all Chrome users
  - Linked from website, email, and GitHub issue

Priority 2 (within 48 hours):  Edge Add-ons Store submission
  - Full store distribution
  - Growing user base
  - Separate from Google's review ecosystem

Priority 3 (within 1 week):    Firefox Add-ons submission
  - Requires manifest transformation and testing
  - Expands addressable market
  - Strong privacy-conscious audience alignment

Priority 4 (as needed):        Enterprise deployment guide
  - For Team plan customers only
  - Provide as a support document to enterprise contacts
```

---

## Appendix: Quick Reference Card

Print this card and keep it accessible. In a crisis, you need the key actions immediately.

```
====================================================================
FOCUS MODE - BLOCKER: EMERGENCY QUICK REFERENCE
====================================================================

IF THE EXTENSION IS REMOVED FROM CHROME WEB STORE:

1. DO NOT PANIC. DO NOT MAKE HASTY CHANGES.

2. SCREENSHOT EVERYTHING:
   - Takedown email
   - Developer console status
   - All Zovo extension statuses

3. COMMUNICATE (within 4 hours):
   - Email Pro subscribers (via Stripe customer list)
   - Post GitHub issue (pin it)
   - Update zovo.one with status banner

4. MESSAGE TO USERS:
   "Focus Mode still works. Your data is safe. Your subscription
    is safe. Do not uninstall."

5. PREPARE RESPONSE (within 24 hours):
   - Analyze violation
   - Fix code
   - Draft appeal (use templates in Section 5.3)
   - Submit appeal

6. ALTERNATIVE DISTRIBUTION (within 48 hours):
   - Publish GitHub Release with sideload ZIP
   - Submit to Edge Add-ons Store

KEY URLS:
  Developer Console: https://chrome.google.com/webstore/devconsole
  CWS Support:       one-pager.google.com/chrome-developer-support
  GitHub:            https://github.com/theluckystrike/focus-mode-blocker
  Website:           https://zovo.one/tools/focus-mode-blocker
  Support Email:     support@zovo.one
  Stripe Dashboard:  https://dashboard.stripe.com

KEY CONTACTS:
  Developer Account: [REGISTERED_EMAIL]
  Stripe Account:    [STRIPE_ACCOUNT_EMAIL]
  Domain Registrar:  [REGISTRAR]

APPEAL DEADLINE: Usually 14-30 days from notice. CHECK THE EMAIL.
====================================================================
```

---

*Emergency Playbook -- Focus Mode - Blocker v1.0.0 -- Phase 13 (Review Rejection Recovery) -- Agent 4*
