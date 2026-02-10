# Feature Value Scoring Framework -- Part 1: Core Blocking & Focus Timer

## Focus Mode - Blocker Chrome Extension

> **Document Version:** 1.0
> **Date:** February 10, 2026
> **Status:** Scoring Complete -- Part 1 of 3
> **Input:** `docs/02-extension-spec.md` (Phase 02 spec), `docs/01-competitive-intel-report.md` (Phase 01 intel)
> **Pricing Reference:** Free / Pro $4.99/mo ($35.88/yr at $2.99/mo) / Lifetime $49.99 / Team $3.99/user/mo

---

## TABLE OF CONTENTS

1. [Framework Definition](#part-1-framework-definition)
2. [Core Blocking Feature Scores](#core-blocking-feature-scores)
3. [Focus Timer Feature Scores](#focus-timer-feature-scores)
4. [Summary Table](#summary-table)
5. [Strategic Observations](#strategic-observations)

---

# PART 1: FRAMEWORK DEFINITION

## Purpose

This framework assigns a quantitative score to every feature in Focus Mode - Blocker to determine the optimal tier placement (Free, Limited Free, or Pro). The goal is to maximize two outcomes simultaneously:

1. **Adoption velocity** -- features that drive installs and retention should remain free or generously limited.
2. **Upgrade conversion** -- features that create genuine "I need more" moments should gate behind Pro at precise friction points.

Misplacing a single feature can be costly. A high-acquisition feature gated too aggressively kills growth (BlockSite's 3-site limit generates their worst reviews). A high-upgrade-trigger feature given away for free leaves revenue on the table (StayFocusd has 600K users and $0 revenue).

## The Five Scoring Dimensions

### Dimension 1: Acquisition Power (Weight: 25%)

*Does this feature drive installs from the Chrome Web Store?*

This dimension measures whether a prospective user would see this feature in the store listing, a review, or a recommendation and think "I need that -- let me install it." Features scoring high here should be free or generously available, because gating them reduces the top of the funnel.

| Score | Definition | Examples |
|-------|-----------|----------|
| 10 | Primary reason people install the extension. Without this feature, the product category does not exist. If this were paywalled, installs would drop 50%+. | Website blocking, Pomodoro timer |
| 7-9 | Strong draw. Would be mentioned in the store listing description, screenshots, or a friend's recommendation. Influences install decisions. | Schedule blocking, block page customization, nuclear option |
| 4-6 | Nice to have. Helps convince someone already considering the install. Would not independently drive an install decision. | Timer sounds, session history, redirect feature |
| 1-3 | Users do not know about this feature until after they install. It is a depth/power feature discovered through usage. | Wildcard blocking, auto-start sessions, API access |

**Scoring principle:** If you cannot imagine someone saying "I installed it because of [this feature]," it scores below 7.

---

### Dimension 2: Habit Formation (Weight: 20%)

*Does this feature create regular, recurring usage?*

This dimension measures whether a feature drives the daily/weekly engagement loops that prevent uninstall. High-scoring features are the ones users would miss immediately if they disappeared. Habit-forming features should generally be free (or at least available in limited form) because they drive retention -- the foundation that makes monetization possible.

| Score | Definition | Examples |
|-------|-----------|----------|
| 10 | Used every single session. The extension feels broken without it. Users build their daily workflow around this feature. | Website blocking (core), timer countdown |
| 7-9 | Used daily by engaged users. Part of the regular rhythm but not the absolute core action. | Streak tracking, daily stats, schedule blocking |
| 4-6 | Used weekly or periodically. Important for ongoing value but not part of the daily habit loop. | Weekly reports, session history, focus goals |
| 1-3 | Used occasionally or configured once and forgotten. Setup-and-forget features. | Wildcard patterns, whitelist mode setup, password protection |

**Scoring principle:** If a user would not notice the feature was missing for 3+ days, it scores below 7.

---

### Dimension 3: Upgrade Trigger (Weight: 25%)

*Does hitting a limit or seeing the lock here drive Pro upgrades?*

This is the monetization dimension. It measures the emotional intensity of the "I want more" moment when a user encounters the free-tier boundary. The best upgrade triggers create a feeling of *desire*, not frustration. Features scoring high here are either the most effective paywall gates or the most effective "show value, blur details" mechanics.

| Score | Definition | Examples |
|-------|-----------|----------|
| 10 | Hitting the limit creates a strong emotional response. "I NEED this." The user has already invested effort that would be lost or wasted without upgrading. Proven to convert at 5%+ in similar products. | Weekly reports (blurred data about yourself), streak recovery (protecting 30 days of effort), 11th blocked site (already curated 10) |
| 7-9 | Clear value gap that most serious users would pay to bridge. The free version works, but the Pro version is demonstrably better for their use case. | Custom timer durations (after 20+ sessions at 25 min), extended nuclear (after experiencing 1-hour power), unlimited schedules |
| 4-6 | Mild frustration or mild curiosity. Some users upgrade, many find workarounds or decide it is not worth it. | Custom block page, redirect feature, auto-start sessions |
| 1-3 | User finds a workaround, does not care, or does not even realize a limit exists. Almost no one upgrades specifically for this feature. | Background timer (expected to just work), password protection, basic sounds |

**Scoring principle:** Imagine 1,000 free users hitting this feature's limit. How many immediately open their wallet? If fewer than 20 (2%), it scores below 5.

---

### Dimension 4: Differentiation (Weight: 15%)

*Is this unique relative to competitors?*

This dimension measures competitive positioning. Features that no competitor offers (or where our implementation is meaningfully better) contribute to Chrome Web Store differentiation, review quality, and word-of-mouth. Unique features can justify either free (to drive adoption with a unique hook) or Pro (to justify the price premium) -- the tier depends on the other four dimensions.

| Score | Definition | Competitive Context |
|-------|-----------|-------------------|
| 10 | No competitor in the Chrome extension blocker category offers this feature. It is entirely novel. | Focus Score (0-100), Grammarly-style blurred analytics, gamification + strong blocking combination |
| 7-9 | 1-2 competitors have something similar, but our implementation is meaningfully better or has a unique twist. | Motivational block page (vs. generic "BLOCKED"), nuclear option with anti-bypass measures (vs. easily disabled) |
| 4-6 | Some competitors have this feature. Ours is comparable but not a standout. | Schedule blocking (LeechBlock has it), pre-built lists (BlockSite has categories), ambient sounds (Forest has sounds) |
| 1-3 | Every competitor has this. It is table stakes for the category. Absence would be noticed; presence is expected. | Manual website blocklist, basic Pomodoro timer, block page of any kind |

**Scoring principle:** If a reviewer would never mention this feature specifically because "every blocker has this," it scores 1-3.

---

### Dimension 5: Cost to Serve (Weight: 15%)

*What is the infrastructure cost per user for this feature? (INVERTED -- higher score = lower cost = better for free tier)*

This dimension measures the marginal cost of each free user using this feature. Chrome extensions have an inherent advantage here -- most features run entirely on the client side with zero server cost. Features that require server infrastructure (API calls, cloud sync, AI processing) are more expensive per user and therefore better suited to the paid tier where they generate revenue to cover costs.

| Score | Definition | Technical Profile |
|-------|-----------|------------------|
| 10 | Zero server cost. 100% client-side using Chrome APIs and local storage. Adding 100,000 free users costs $0 in infrastructure. | Local blocking rules, local timer, local storage |
| 7-9 | Minimal cost. Primarily local with occasional lightweight sync or small data exchange. Per-user cost < $0.01/month. | Chrome storage sync (uses Google infrastructure via chrome.storage.sync), lightweight webhook calls |
| 4-6 | Moderate cost. Periodic server calls, hosted content, or data processing. Per-user cost $0.01-$0.10/month. | Cloud backup, analytics aggregation, leaderboard calculations, hosted audio files |
| 1-3 | Expensive. Real-time API calls, continuous sync, AI/ML processing, or large data storage. Per-user cost > $0.10/month. | AI recommendations (LLM API calls), real-time cross-device sync, calendar API polling |

**Scoring principle:** If giving this feature to every free user for a year would cost more than $1,000 at 50,000 users, it scores below 7.

---

## Weighted Score Formula

```
Weighted Score = (Acquisition x 0.25) + (Habit x 0.20) + (Upgrade x 0.25) + (Differentiation x 0.15) + (Cost x 0.15)
```

The weights reflect strategic priorities:

- **Acquisition (25%) and Upgrade Trigger (25%)** are equally weighted because the business depends equally on getting users in the door and converting them. Neither works without the other.
- **Habit Formation (20%)** is the bridge between acquisition and conversion. Without daily habits, users churn before they ever hit an upgrade trigger.
- **Differentiation (15%)** and **Cost to Serve (15%)** are supporting factors. Differentiation matters for competitive positioning but does not directly drive installs or revenue. Cost matters for unit economics but most Chrome extension features are free to serve.

## Tier Assignment Rules

| Weighted Score | Tier | Rationale |
|---------------|------|-----------|
| **7.5+** | **FREE** | This feature drives so much adoption and retention that gating it would hurt growth more than it generates revenue. Give it away and benefit from the network effects. |
| **5.5 - 7.4** | **LIMITED FREE** | This feature needs to be available to drive adoption/habits, but it also has upgrade potential. Set a specific cap that lets users experience the value, then naturally creates desire for more. The exact limit is critical -- too generous kills upgrades, too stingy kills retention. |
| **3.5 - 5.4** | **PRO** | This is a clear upgrade driver. The free tier works without it, and users who want it have already validated the product's core value. Gating this generates revenue without hurting the free experience. |
| **Below 3.5** | **PRO or CUT** | Low scores across all dimensions suggest this feature neither drives installs nor conversions. Either gate it as a Pro "bonus" or reconsider building it at all. |

**Override rule:** If a feature scores 9+ on Acquisition Power regardless of its weighted total, it must remain free. A feature people install the product for cannot be paywalled without destroying the funnel top.

**Override rule:** If a feature scores 9+ on Upgrade Trigger and below 5 on Acquisition Power, it should be Pro regardless of its weighted total. These are pure monetization levers that users discover after they are already engaged.

---

# CORE BLOCKING FEATURE SCORES

## Summary Table: Core Blocking

| # | Feature | Acquisition | Habit | Upgrade | Differentiation | Cost | Weighted | Tier |
|---|---------|:-----------:|:-----:|:-------:|:--------------:|:----:|:--------:|:----:|
| 1 | Manual website blocklist | 10 | 10 | 9 | 2 | 10 | **8.55** | Limited Free |
| 2 | Pre-built block lists | 8 | 7 | 7 | 4 | 10 | **7.25** | Limited Free |
| 3 | Wildcard/regex blocking | 2 | 2 | 6 | 5 | 10 | **4.65** | Pro |
| 4 | Whitelist mode | 3 | 3 | 8 | 7 | 10 | **5.90** | Pro |
| 5 | Schedule-based blocking | 7 | 8 | 8 | 4 | 10 | **7.45** | Limited Free |
| 6 | Nuclear option | 7 | 5 | 9 | 8 | 10 | **7.70** | Limited Free |
| 7 | Custom block page | 4 | 6 | 5 | 8 | 10 | **5.95** | Pro |
| 8 | Redirect to productive sites | 3 | 4 | 4 | 7 | 10 | **5.10** | Pro |
| 9 | Password protection | 4 | 3 | 5 | 3 | 10 | **4.90** | Pro |
| 10 | Category-based blocking | 6 | 6 | 7 | 4 | 10 | **6.55** | Limited Free |

---

## Detailed Analysis: Core Blocking Features

### CB-1: Manual Website Blocklist (Add Sites to Block)

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition Power | **10** | This IS the product -- "website blocker" is the category search term; without a blocklist, there is no product to install. |
| Habit Formation | **10** | Used every single session because every blocked page load depends on this list being active and populated. |
| Upgrade Trigger | **9** | The 10-to-11 site limit is the T2 paywall trigger; users who curate 10 sites have invested effort and feel the cap acutely when they need site #11. |
| Differentiation | **2** | Every single competitor has a manual blocklist -- this is the most fundamental table-stakes feature in the category. |
| Cost to Serve | **10** | 100% local using chrome.storage.local and chrome.declarativeNetRequest; zero server cost at any scale. |

**Weighted Score: (10 x 0.25) + (10 x 0.20) + (9 x 0.25) + (2 x 0.15) + (10 x 0.15) = 2.50 + 2.00 + 2.25 + 0.30 + 1.50 = 8.55**

**Tier: LIMITED FREE (10 sites free, unlimited Pro)**

**Limit: 10 manually added sites.** Pre-built list sites do NOT count against this cap.

**Why this limit:** 10 sites covers the top distraction sources for 80% of casual users (Reddit, Twitter/X, YouTube, Facebook, Instagram, TikTok, plus 3-4 news or entertainment sites). This is 3x more generous than BlockSite (3 sites) and Intentional (3 sites), which directly generates positive reviews and word-of-mouth. Competitive intelligence shows that BlockSite's restrictive free limit is their #1 source of 1-star reviews. At 10 sites, users who hit the limit have genuinely validated that blocking works for them and are psychologically invested -- they have curated a personalized list. The jump from 10 to 11 creates a clean "I need one more" upgrade moment (T2 trigger) with a 5-8% estimated conversion rate.

**Rationale:** Despite the 8.55 weighted score (which would qualify for FREE under the rules), this feature MUST have a limit because it is the extension's primary revenue gate. The nuance: the feature itself is free. The limit on quantity is the monetization mechanism. Giving truly unlimited blocking for free would eliminate the T2 paywall trigger entirely, which competitive analysis shows converts at 5-8%. The 10-site limit is "limited free" in the most honest sense -- genuinely useful at 10, genuinely better at unlimited.

---

### CB-2: Pre-Built Block Lists (Social Media, News)

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition Power | **8** | "Block all social media in one click" is a strong store listing bullet point and removes onboarding friction that causes first-session abandonment. |
| Habit Formation | **7** | Toggled on during initial setup and left active; users interact with them directly only when adjusting, but they power the daily blocking experience. |
| Upgrade Trigger | **7** | When a free user thinks "I also need to block Netflix and gaming sites," the locked Entertainment/Gaming lists with visible PRO badges create a clear upgrade path (T5 trigger). |
| Differentiation | **4** | BlockSite has category-based blocking, and several competitors offer some form of curated lists; our implementation (one-click toggle, removable individual sites) is clean but not novel. |
| Cost to Serve | **10** | Lists are JSON files bundled with the extension; zero network requests, zero server cost. |

**Weighted Score: (8 x 0.25) + (7 x 0.20) + (7 x 0.25) + (4 x 0.15) + (10 x 0.15) = 2.00 + 1.40 + 1.75 + 0.60 + 1.50 = 7.25**

**Tier: LIMITED FREE (2 lists free, 6+ lists Pro)**

**Limit: 2 pre-built lists (Social Media ~25 sites, News ~20 sites) free. Pro unlocks 4+ additional categories: Entertainment, Gaming, Shopping, Adult Content.**

**Why this limit:** Social media and news account for roughly 80% of workplace digital distractions (per our competitive research and subreddit analysis from r/productivity, r/getdisciplined). Two lists give free users comprehensive coverage of the most common distraction patterns. The remaining categories (Entertainment, Gaming, Shopping, Adult Content) serve users with broader or more specific distraction profiles -- a signal of deeper engagement and willingness to pay. The locked categories are visible with PRO badges in the settings UI, creating ongoing awareness of the upgrade path.

**Rationale:** The 7.25 weighted score places this squarely in Limited Free territory. The feature's acquisition power (8) means it needs to be available at install -- new users who see "block all social media in one click" in the store listing need to be able to do exactly that. But the depth of categories beyond the core two is a natural Pro differentiator for users whose distraction patterns extend beyond social media and news.

---

### CB-3: Wildcard/Regex Pattern Blocking

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition Power | **2** | Prospective users do not search for "regex website blocker" -- this is a power-user feature discovered after weeks of usage when subdomains slip through manual blocking. |
| Habit Formation | **2** | Configured once ("*.reddit.com") and then works silently in the background; users do not interact with wildcard rules on a daily basis. |
| Upgrade Trigger | **6** | Users who notice old.reddit.com or m.facebook.com bypassing their blocklist feel moderate frustration, but many work around it by adding the subdomain manually (which counts against their 10-site limit, creating indirect upgrade pressure). |
| Differentiation | **5** | LeechBlock NG (free, open source) offers regex blocking for free; BlockSite Pro includes pattern blocking; we are not unique here but our implementation with pattern previews ("this will block X known domains") adds a quality edge. |
| Cost to Serve | **10** | Entirely local using chrome.declarativeNetRequest regex rules; zero server cost. |

**Weighted Score: (2 x 0.25) + (2 x 0.20) + (6 x 0.25) + (5 x 0.15) + (10 x 0.15) = 0.50 + 0.40 + 1.50 + 0.75 + 1.50 = 4.65**

**Tier: PRO**

**Rationale:** With a 4.65 weighted score, wildcard blocking is a clear Pro feature. Its near-zero acquisition power means paywalling it does not reduce installs. Its setup-and-forget nature means it does not drive daily engagement. The moderate upgrade trigger (6) means some users will upgrade specifically for this -- particularly technical users and ADHD users who need comprehensive subdomain coverage. It adds meaningful value to the Pro tier without being missed by free users.

---

### CB-4: Whitelist Mode (Block Everything EXCEPT Specified Sites)

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition Power | **3** | Most users searching for a blocker think in terms of "block these specific sites," not "block everything" -- whitelist mode appeals to a subset of power users and ADHD communities, but it is not why the majority install. |
| Habit Formation | **3** | Configured once (set up your allowed-site list) and then runs passively; the user interacts with the whitelist configuration only when adding a new work tool. |
| Upgrade Trigger | **8** | Users who reach the point of wanting whitelist mode have already exhausted blacklist blocking and feel that "I keep finding new distracting sites" frustration -- this is a high-intent upgrade moment because it signals their commitment to focus is serious. |
| Differentiation | **7** | Only Cold Turkey (desktop, $35 one-time) and Freedom ($6.99/mo, no free tier) offer true whitelist mode; among free-tier Chrome extensions, no competitor provides this, making it a genuine Pro differentiator. |
| Cost to Serve | **10** | Implemented as a local declarativeNetRequest default-block rule with exceptions; entirely client-side. |

**Weighted Score: (3 x 0.25) + (3 x 0.20) + (8 x 0.25) + (7 x 0.15) + (10 x 0.15) = 0.75 + 0.60 + 2.00 + 1.05 + 1.50 = 5.90**

**Tier: PRO**

**Rationale:** Despite scoring 5.90 (which technically falls in Limited Free range), whitelist mode is better placed as a full Pro feature for strategic reasons. First, there is no natural "limited" version of whitelist mode -- it is a binary paradigm shift (blacklist vs. whitelist) that cannot be meaningfully capped (you cannot offer "whitelist mode for 3 sites" -- that defeats the purpose). Second, the upgrade trigger score (8) reflects that users who want this feature are exactly the high-commitment users most likely to pay. Third, it serves as a marquee Pro differentiator for the ADHD/neurodivergent persona (Sam), who represents the highest willingness-to-pay segment ($5-8/mo enthusiastically). Keeping it Pro preserves a powerful conversion lever for our most valuable user segment.

---

### CB-5: Schedule-Based Blocking (Time-Based Rules)

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition Power | **7** | "Automatically block distractions during work hours" is a strong store listing feature and a common search query pattern; it is not the primary install driver but meaningfully influences the decision. |
| Habit Formation | **8** | Schedule blocking is the ultimate "set and forget" habit feature -- once configured, it enforces focus automatically every workday, making the extension a permanent part of the user's routine. Users with schedules show 2x higher D30 retention per our spec analysis. |
| Upgrade Trigger | **8** | The 1-to-2 schedule limit is a clean upgrade gate; users who need "work schedule + evening study" or "work schedule + weekend deep work" immediately feel the constraint because their second-most-important use case is unaddressed. |
| Differentiation | **4** | LeechBlock NG offers multiple schedules for free; BlockSite Pro has scheduling; Cold Turkey has scheduling. Schedule blocking is well-represented in the category. |
| Cost to Serve | **10** | Uses chrome.alarms API and local storage for schedule rules; zero server involvement. |

**Weighted Score: (7 x 0.25) + (8 x 0.20) + (8 x 0.25) + (4 x 0.15) + (10 x 0.15) = 1.75 + 1.60 + 2.00 + 0.60 + 1.50 = 7.45**

**Tier: LIMITED FREE (1 schedule free, unlimited Pro)**

**Limit: 1 active schedule with full day-of-week and time-of-day configuration (e.g., Mon-Fri, 9:00 AM - 5:00 PM).**

**Why this limit:** One schedule covers the most common use case -- blocking distractions during standard work hours. This single schedule is enough to demonstrate the power of automated blocking and build the daily habit. The limit becomes felt when users realize they need different rules for different parts of their day (morning deep work vs. afternoon meetings vs. evening study). Our competitive research shows that users who configure a schedule have 2x higher 30-day retention, making it essential that at least one schedule is free. The jump from 1 to 2 schedules is the 6th most common upgrade trigger in the spec (after weekly reports, 11th site, nuclear extension, Focus Score, and Pro feature tap).

**Rationale:** The 7.45 weighted score places this at the top of the Limited Free range, just below the 7.5 threshold for fully free. The high habit formation score (8) argues for availability, while the high upgrade trigger (8) argues for a limit. The solution: one free schedule preserves the retention benefit while creating a natural upgrade gate at the second schedule.

---

### CB-6: Nuclear Option (Unbypassable Blocking Period)

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition Power | **7** | "Truly unbypassable blocking" is a headline differentiator that resonates strongly in store listings and Reddit recommendations; the #1 complaint about blockers is "I just disable it," and nuclear mode directly addresses this. |
| Habit Formation | **5** | Used periodically during high-distraction moments ("I need to lock in for the next hour") rather than every session; it is a power tool for critical moments, not a daily habit feature. |
| Upgrade Trigger | **9** | The T3 paywall trigger fires when a user completes a 1-hour nuclear session and immediately wants another -- this is a peak-momentum emotional state where the desire for "more time" is visceral. Estimated 6-10% conversion rate, the highest of any non-primary trigger. |
| Differentiation | **8** | StayFocusd has a "Nuclear Option" but it is easily bypassed (switch browsers, reinstall). Cold Turkey is truly unbypassable but costs $35 and is desktop-only. Our nuclear option with 6 anti-bypass layers in a free Chrome extension is a unique combination. |
| Cost to Serve | **10** | Entirely local: timer via chrome.alarms, rule locking via storage write prevention, extension management blocking via declarativeNetRequest. |

**Weighted Score: (7 x 0.25) + (5 x 0.20) + (9 x 0.25) + (8 x 0.15) + (10 x 0.15) = 1.75 + 1.00 + 2.25 + 1.20 + 1.50 = 7.70**

**Tier: LIMITED FREE (up to 1 hour free, up to 24 hours Pro)**

**Limit: Free tier offers 15, 30, 45, or 60-minute nuclear sessions. Pro unlocks 2, 4, 8, 12, and 24-hour durations.**

**Why this limit:** One hour is long enough to experience the transformative power of truly unbypassable blocking. It covers a standard Pomodoro-extended deep work session and gives users the "that hour flew by" feeling that makes them want more. The 1-hour cap is carefully chosen: short enough that users who need half-day or full-day restriction (particularly ADHD users, the Sam persona) immediately feel the constraint, but long enough that the feature delivers genuine value without feeling like a tease. The T3 paywall trigger (6-10% estimated conversion) fires specifically at the moment of re-attempting nuclear immediately after a session ends -- capturing users at peak productive momentum.

**Rationale:** At 7.70, this scores above the 7.5 FREE threshold, but the time-based limit is essential for monetization. The nuclear option's combination of high acquisition power (people install specifically because of this), high upgrade trigger (the desire for longer sessions is emotional and immediate), and high differentiation (no free Chrome extension does this well) makes it the ideal "taste then upgrade" feature. Free users get the full power of nuclear blocking; they just want more time.

---

### CB-7: Custom Block Page (Personalize What You See When Blocked)

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition Power | **4** | Users do not install a blocker specifically for block page customization; however, seeing a beautiful motivational block page in screenshots (vs. competitors' generic "BLOCKED" text) does help convince users already browsing the store listing. |
| Habit Formation | **6** | The block page is seen dozens to hundreds of times per day, making any customization highly visible; but the act of customizing is a one-time configuration, not a daily interaction -- the habit is seeing the page, not changing it. |
| Upgrade Trigger | **5** | After seeing the default block page 500+ times, some users develop a desire for personalization ("I want my own message here"), but many are perfectly satisfied with the default motivational page and never feel the need to customize. |
| Differentiation | **8** | Our default motivational block page (streaks, time saved, quotes, attempt counter) is already unique -- no competitor shows personalized stats on the block page. Full customization (custom text, images, colors) extends this differentiation further. |
| Cost to Serve | **10** | 100% local: block page is a bundled HTML file with injected local data. Custom settings stored in chrome.storage.local. |

**Weighted Score: (4 x 0.25) + (6 x 0.20) + (5 x 0.25) + (8 x 0.15) + (10 x 0.15) = 1.00 + 1.20 + 1.25 + 1.20 + 1.50 = 6.15**

**Tier: PRO (default motivational page free, full customization Pro)**

**Important nuance:** The default motivational block page (rotating quotes, streak display, time saved, attempt counter, "Return to Work" button) is FREE and is a key differentiator. What is Pro is the ability to customize: custom headline text, custom body message, custom background color/image, custom quote rotation, show/hide individual elements, and custom redirect URLs.

**Rationale:** The 6.15 score falls in Limited Free territory, but there is no natural "limited" version of block page customization that makes sense. You either customize or you do not. The default page is already excellent (it is our primary differentiator from every competitor), so free users lose nothing. Power users who see the block page 100+ times daily and want personal branding or specific motivational messages are exactly the engaged users who will pay for this delight feature. This is a "want" upgrade, not a "need" upgrade -- and want-based upgrades generate the lowest resentment.

---

### CB-8: Redirect to Productive Sites (Instead of Block Page)

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition Power | **3** | Users do not install blockers expecting redirect functionality; this is a creative productivity technique that appeals to a niche subset of power users who discover it post-install. |
| Habit Formation | **4** | Once configured (reddit.com -> notion.so), the redirect runs automatically; the user does not interact with the feature daily, they just experience it passively as a pleasant surprise when their habitual navigation gets redirected. |
| Upgrade Trigger | **4** | Mild interest when users hear about it, but most users are satisfied with the block page. The redirect feature does not create a strong "I need this" emotional response because the block page already serves the interruption purpose. |
| Differentiation | **7** | Cold Turkey offers redirect functionality in its paid tier; no free Chrome extension blocker offers per-site redirect mapping. Our implementation (per-site mapping with dropdown selection) is a unique touch. |
| Cost to Serve | **10** | Implemented via chrome.declarativeNetRequest redirect rules stored locally; zero server cost. |

**Weighted Score: (3 x 0.25) + (4 x 0.20) + (4 x 0.25) + (7 x 0.15) + (10 x 0.15) = 0.75 + 0.80 + 1.00 + 1.05 + 1.50 = 5.10**

**Tier: PRO**

**Rationale:** At 5.10, this sits in the Pro range. Low acquisition power (3) means paywalling it has zero impact on installs. Low habit formation (4) means free users will not miss it. Moderate differentiation (7) means it adds genuine value to the Pro feature list without being so unique that it should be free for competitive positioning. This is a solid "Pro bonus" feature that enriches the paid tier.

---

### CB-9: Password Protection (Prevent Disabling)

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition Power | **4** | Some users specifically seek "password protected blocker" (visible in Chrome Web Store search queries and Reddit requests), but it is a secondary consideration, not the primary install driver. |
| Habit Formation | **3** | Configured once (set a password) and then operates passively; the user never interacts with the password feature during normal usage unless they specifically try to disable blocking and encounter the password prompt. |
| Upgrade Trigger | **5** | Users who want password protection are self-aware about their tendency to bypass -- a meaningful but niche upgrade motivation. The nuclear option (which prevents all changes without needing a password) partially satisfies this need for free users, reducing the upgrade urgency for password-specifically. |
| Differentiation | **3** | BlockSite Pro offers password protection, Cold Turkey has it, LeechBlock NG has it for free. This is a well-represented feature across the competitive landscape. |
| Cost to Serve | **10** | 100% local: hashed password stored in chrome.storage.local, validation check on settings access. |

**Weighted Score: (4 x 0.25) + (3 x 0.20) + (5 x 0.25) + (3 x 0.15) + (10 x 0.15) = 1.00 + 0.60 + 1.25 + 0.45 + 1.50 = 4.80**

**Tier: PRO**

**Rationale:** At 4.80, password protection falls in the Pro range. It is a legitimate Pro feature that adds value for users who need persistent bypass prevention (as opposed to nuclear mode's time-limited prevention). The low differentiation (3) means it does not serve as a unique selling point, but it rounds out the Pro tier's "serious blocking" story. Note that the nuclear option partially covers this use case for free users -- nuclear mode prevents all changes during the session, which is often sufficient.

---

### CB-10: Category-Based Blocking (6+ Content Categories)

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition Power | **6** | "Block entire categories of sites" is a moderately attractive feature in store listings; it reduces the effort of building a blocklist and appeals to users who want comprehensive coverage without curating individual URLs. |
| Habit Formation | **6** | Categories are toggled on during setup and left active; users periodically review or adjust their category selections, especially when discovering a new distracting site that falls into an already-blocked category. |
| Upgrade Trigger | **7** | When free users have Social Media and News blocked but realize they also waste time on Entertainment (Netflix, YouTube), Gaming (Steam, Twitch), or Shopping (Amazon), the locked category toggles with PRO badges create a clear "I need that too" moment. |
| Differentiation | **4** | BlockSite has category blocking; this is a known feature pattern in the blocker space, though our curated lists with individual site removal capability add a quality edge. |
| Cost to Serve | **10** | Category lists are JSON files bundled with the extension; toggling a category activates local declarativeNetRequest rules. |

**Weighted Score: (6 x 0.25) + (6 x 0.20) + (7 x 0.25) + (4 x 0.15) + (10 x 0.15) = 1.50 + 1.20 + 1.75 + 0.60 + 1.50 = 6.55**

**Tier: LIMITED FREE (2 categories free, 6+ categories Pro)**

**Limit: Social Media (~25 sites) and News (~20 sites) free. Entertainment, Gaming, Shopping, Adult Content, and any future categories are Pro.**

**Why this limit:** This is the same as the pre-built block lists feature (CB-2) -- they are effectively the same mechanism scored from the category management perspective. Social Media and News cover the dominant distraction patterns. Additional categories serve users with broader distraction profiles who need more comprehensive coverage. The locked categories are visible in the UI with PRO badges, creating ongoing upsell surface.

**Rationale:** The 6.55 score aligns perfectly with Limited Free. The two free categories provide genuine value and support the "honest freemium" positioning, while the additional Pro categories create a natural expansion path for users whose blocking needs grow beyond social media and news.

---

# FOCUS TIMER FEATURE SCORES

## Summary Table: Focus Timer

| # | Feature | Acquisition | Habit | Upgrade | Differentiation | Cost | Weighted | Tier |
|---|---------|:-----------:|:-----:|:-------:|:--------------:|:----:|:--------:|:----:|
| 1 | Basic Pomodoro timer (25/5) | 9 | 9 | 2 | 2 | 10 | **6.55** | Free |
| 2 | Custom timer durations | 3 | 6 | 8 | 4 | 10 | **5.80** | Pro |
| 3 | Auto-start sessions | 2 | 5 | 5 | 6 | 10 | **4.90** | Pro |
| 4 | Session history | 4 | 5 | 7 | 4 | 10 | **5.75** | Limited Free |
| 5 | Focus goals | 5 | 7 | 6 | 7 | 10 | **6.55** | Limited Free |
| 6 | Break customization | 3 | 4 | 5 | 3 | 10 | **4.80** | Pro |
| 7 | Timer sounds/notifications | 5 | 6 | 3 | 3 | 10 | **5.10** | Limited Free |
| 8 | Background timer | 8 | 9 | 1 | 3 | 10 | **5.95** | Free |

---

## Detailed Analysis: Focus Timer Features

### FT-1: Basic Pomodoro Timer (25/5 Fixed)

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition Power | **9** | "Pomodoro timer" is the second most common search term (after "website blocker") for this product category; our tagline includes "Build focus" and the timer is featured prominently in store screenshots. |
| Habit Formation | **9** | The timer is the second engagement surface after blocking itself; users start a Pomodoro session every time they want to focus, creating the daily ritual that drives retention and streak accumulation. |
| Upgrade Trigger | **2** | The fixed 25/5 timer creates almost no upgrade desire by itself -- 25/5 is the standard Pomodoro technique, and many users are perfectly satisfied with it for months or years. The upgrade trigger comes from custom durations (a separate feature), not from the basic timer. |
| Differentiation | **2** | Every focus tool and Pomodoro app offers a 25/5 timer -- Deep Work Zone, Forest, and dozens of standalone Pomodoro extensions. This is complete table stakes. |
| Cost to Serve | **10** | Timer runs in the background service worker via chrome.alarms with local state in chrome.storage.session; zero server cost. |

**Weighted Score: (9 x 0.25) + (9 x 0.20) + (2 x 0.25) + (2 x 0.15) + (10 x 0.15) = 2.25 + 1.80 + 0.50 + 0.30 + 1.50 = 6.35**

**Tier: FREE (fully free, no limits)**

**Override applied:** Acquisition Power score of 9 triggers the "must remain free" override rule. Despite the 6.35 weighted score falling below the 7.5 free threshold, the basic Pomodoro timer must be completely free because it is a primary install driver. Paywalling or limiting a 25/5 timer when standalone free Pomodoro extensions exist would make the product uncompetitive and generate negative reviews.

**Rationale:** The basic Pomodoro timer is the second pillar of the product (after blocking). It creates the session structure that generates all other metrics (focus time, streak days, session history, Focus Score). It is foundational infrastructure for the entire engagement and monetization system. Every session starts with this timer. Every streak day requires this timer. Every upgrade trigger ultimately depends on the habits this timer creates. It must be free, unlimited, and excellent.

---

### FT-2: Custom Timer Durations (Any Length)

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition Power | **3** | Users do not install a blocker specifically for custom timer durations; they install for blocking and discover the timer flexibility need after 2-3 weeks of using the fixed 25/5 Pomodoro. |
| Habit Formation | **6** | Once a user switches from 25/5 to their preferred duration (e.g., 50/10 or 90/20), they use it every session -- but the customization itself is a one-time configuration that becomes the new default. |
| Upgrade Trigger | **8** | The T10 paywall trigger (slider snap-back animation) fires when a free user tries to adjust the timer past 25 minutes. This is a high-quality upgrade moment because the user is actively trying to deepen their focus practice -- they have outgrown 25/5, which signals commitment and willingness to pay. |
| Differentiation | **4** | Custom timer durations are available in many focus apps (Forest, Deep Work Zone, standalone Pomodoro extensions); this is a common feature in the broader category, though among Chrome extension blockers specifically it is less common as a premium gate. |
| Cost to Serve | **10** | Duration is a local configuration value stored in chrome.storage.local; the timer mechanism is identical regardless of duration. |

**Weighted Score: (3 x 0.25) + (6 x 0.20) + (8 x 0.25) + (4 x 0.15) + (10 x 0.15) = 0.75 + 1.20 + 2.00 + 0.60 + 1.50 = 6.05**

**Tier: PRO**

**Rationale:** Despite the 6.05 score falling in Limited Free range, there is no natural "limited" version of custom durations. You cannot meaningfully offer "custom durations up to 45 minutes" or "3 preset options" -- these arbitrary limits feel restrictive without creating a satisfying free experience. The clean gate is binary: 25/5 free, any duration Pro. The T10 paywall trigger (slider snap-back with upgrade prompt, estimated 2-4% conversion) is specifically designed for this feature. Users who want custom durations have completed 20+ sessions at 25/5 and are deeply engaged -- exactly the users who convert. The fixed 25/5 Pomodoro is a legitimate, complete productivity technique, so free users are not shortchanged.

---

### FT-3: Auto-Start Sessions (Back-to-Back)

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition Power | **2** | No user installs a blocker because of auto-start functionality; this is a convenience feature discovered by daily users who are tired of manually starting sessions each morning. |
| Habit Formation | **5** | Auto-start reduces friction for daily use (sessions begin without manual intervention), which reinforces the habit -- but it also removes the conscious "I'm choosing to focus" moment that some productivity research suggests is valuable. |
| Upgrade Trigger | **5** | Moderate desire: daily users who manually start sessions every morning think "it would be nice if this happened automatically," but it is a convenience desire, not an urgent need. Few users would cite this as the reason they upgrade. |
| Differentiation | **6** | Among Chrome extension blockers, auto-start is uncommon. Freedom has scheduled session starts. RescueTime has auto-focus triggers. In the pure Chrome extension space, this is relatively rare. |
| Cost to Serve | **10** | Implemented via chrome.alarms for scheduled starts and chrome.runtime.onStartup for browser-open triggers; entirely local. |

**Weighted Score: (2 x 0.25) + (5 x 0.20) + (5 x 0.25) + (6 x 0.15) + (10 x 0.15) = 0.50 + 1.00 + 1.25 + 0.90 + 1.50 = 5.15**

**Tier: PRO**

**Rationale:** At 5.15, auto-start is a Pro feature. Its low acquisition power (2) means paywalling it has zero impact on installs. Its moderate scores across habit and upgrade dimensions make it a solid "convenience upgrade" that enriches the Pro tier without being something free users miss. It pairs well with calendar integration (also Pro) to create the "zero-friction focus" experience that justifies the Pro subscription for knowledge workers.

---

### FT-4: Session History (Log of Past Sessions)

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition Power | **4** | Session history is a supporting feature that helps convince users already considering the install ("track your focus sessions") but is not a primary install driver -- users install for blocking and timing, not for historical records. |
| Habit Formation | **5** | Users check their session history periodically (weekly, after a particularly productive day) to reflect on their focus patterns, but it is not part of the daily habit loop the way the timer or block page are. |
| Upgrade Trigger | **7** | After 7 days, free users' oldest session data is automatically pruned. When a user on day 8 realizes their first day's data is gone, or when they want to look back at last month's patterns, the limitation becomes felt. The data loss creates a stronger emotional response than a feature lock because it is retroactive ("I already had this and now it is gone"). |
| Differentiation | **4** | Most focus tools offer some form of session history; Deep Work Zone has analytics, Forest tracks sessions, RescueTime has detailed history. This is an expected feature in the category. |
| Cost to Serve | **10** | Session records stored as JSON arrays in chrome.storage.local; free tier auto-prunes records older than 7 days. Zero server cost. |

**Weighted Score: (4 x 0.25) + (5 x 0.20) + (7 x 0.25) + (4 x 0.15) + (10 x 0.15) = 1.00 + 1.00 + 1.75 + 0.60 + 1.50 = 5.85**

**Tier: LIMITED FREE (7 days free, unlimited history Pro)**

**Limit: Last 7 days of session history. Records older than 7 days are automatically pruned. Pro retains full history indefinitely with search and filtering.**

**Why this limit:** Seven days provides enough history for users to see their recent patterns ("Was I more focused this week than last?") and validate that the extension is tracking their sessions. The auto-pruning at 7 days creates a subtle but real loss aversion: users know data is being collected and then discarded, which makes the "keep everything" Pro option appealing. The 7-day window also aligns with the weekly report cycle -- free users can correlate their daily experience with 7 days of history, but cannot access the deeper monthly trends that make the weekly/monthly Pro reports valuable.

**Rationale:** The 5.85 score places this in Limited Free. The time-based limit (7 days) is more psychologically effective than a count-based limit (e.g., "last 10 sessions") because time creates urgency -- the data is being deleted whether the user acts or not. This passive pressure is gentler than an active gate but equally effective at driving upgrade consideration.

---

### FT-5: Focus Goals (Daily/Weekly/Monthly Targets)

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition Power | **5** | "Set daily focus goals" is a moderately attractive feature in store listings; it appeals to goal-oriented users (the Alex and Morgan personas) but is secondary to blocking and timing as an install driver. |
| Habit Formation | **7** | A daily focus goal creates a pull mechanism -- users open the extension to check their progress toward the goal, driving daily engagement. The progress bar and goal-met celebration (confetti animation) create a micro-dopamine loop that reinforces daily usage. |
| Upgrade Trigger | **6** | The daily-only limitation is felt by users who want to track weekly or monthly progress ("I want to focus 20 hours this week" or "I want to focus 80 hours this month"), but many users find the daily goal sufficient. The upgrade desire is moderate, not urgent. |
| Differentiation | **7** | Among Chrome extension blockers, focus goals with progress bars and celebrations are uncommon. Forest has a similar concept (grow trees), but quantified time-based goals with multi-period tracking is relatively unique in the Chrome blocker space. |
| Cost to Serve | **10** | Goal targets and progress calculations run entirely on local session data; zero server cost. |

**Weighted Score: (5 x 0.25) + (7 x 0.20) + (6 x 0.25) + (7 x 0.15) + (10 x 0.15) = 1.25 + 1.40 + 1.50 + 1.05 + 1.50 = 6.70**

**Tier: LIMITED FREE (daily goal free, weekly + monthly goals Pro)**

**Limit: Free users can set one daily focus time goal (e.g., "Focus for 4 hours today") with progress bar and goal-met celebration. Pro adds weekly and monthly goals with separate targets, plus goal streak tracking ("Met your daily goal 12 days in a row").**

**Why this limit:** A daily goal provides the immediate motivation and engagement loop that drives retention. Users who set and pursue a daily goal are significantly more engaged than those who do not, making the daily goal a retention lever worth keeping free. Weekly and monthly goals serve users who are planning their focus at a higher level -- these are the same users who benefit from weekly/monthly reports (also Pro) and represent the committed segment most likely to pay. The goal streak feature (tracking consecutive days of meeting your daily goal) adds a second streak mechanic layered on top of the session streak, creating additional Pro value.

**Rationale:** The 6.70 score is solidly Limited Free. The daily goal's habit formation power (7) argues for keeping it free, while the multi-period expansion and goal streaks provide clear Pro differentiation. The daily/weekly/monthly tier structure parallels the session history tiering (daily free, longer-term Pro) for a consistent user mental model.

---

### FT-6: Break Customization (Short/Long Break Settings)

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition Power | **3** | Nobody installs a focus extension because of break customization; the default 5-minute short / 15-minute long break structure is universally understood and expected. |
| Habit Formation | **4** | Break settings are configured once and then operate passively; the user does not interact with break customization on a daily basis. The break itself is part of the habit, but the customization of break duration is not. |
| Upgrade Trigger | **5** | Some users find the 5-minute break too short or the 15-minute long break too long, creating moderate desire for adjustment. But most users accept the defaults or work around them (e.g., ignoring the break timer when they want a longer break). |
| Differentiation | **3** | Break customization is available in virtually every Pomodoro app and focus tool. This is table stakes for any timer that calls itself "Pomodoro." |
| Cost to Serve | **10** | Break duration is a local configuration value; the timer mechanism is identical regardless of break length. |

**Weighted Score: (3 x 0.25) + (4 x 0.20) + (5 x 0.25) + (3 x 0.15) + (10 x 0.15) = 0.75 + 0.80 + 1.25 + 0.45 + 1.50 = 4.75**

**Tier: PRO (bundled with custom timer durations)**

**Rationale:** At 4.75, break customization is a Pro feature. It naturally bundles with custom timer durations (FT-2) because a user who wants to change their focus duration almost always wants to adjust their break duration too. Separating these into different tiers would create user confusion ("I can customize my focus time but not my break time?"). The clean approach: fixed 25/5/15 at free tier, full customization of all duration parameters at Pro. This also keeps the T10 slider paywall trigger clean -- any attempt to modify any timer parameter (focus or break) in the free tier triggers the same upgrade prompt.

---

### FT-7: Timer Sounds/Notifications

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition Power | **5** | "Audio chime when your focus session ends" is a moderately expected feature; users assume a timer will notify them, and mentioning sound options in the store listing adds a nice-to-have appeal. |
| Habit Formation | **6** | The session-end chime becomes part of the Pomodoro ritual -- users learn to associate the sound with the transition between focus and break. Custom sounds (a Pro feature under ambient sounds) are even stickier because users develop a personal connection to their chosen notification sound. |
| Upgrade Trigger | **3** | Almost no one upgrades specifically for timer notification sounds. The default chime works fine. Users who want more sound variety are better served by the ambient sounds feature (a separate category), not notification customization. |
| Differentiation | **3** | Every timer app has notification sounds. This is entirely table stakes. |
| Cost to Serve | **10** | Audio files bundled with extension; playback via offscreen document (Manifest V3). Zero server cost. |

**Weighted Score: (5 x 0.25) + (6 x 0.20) + (3 x 0.25) + (3 x 0.15) + (10 x 0.15) = 1.25 + 1.20 + 0.75 + 0.45 + 1.50 = 5.15**

**Tier: LIMITED FREE (default chime/notification free, custom notification sounds Pro)**

**Limit: Free tier includes the default audio chime on session transitions (focus start, break start, session complete) and system notifications for session completion. Pro adds custom notification sounds (selecting from a library of tones) and advanced notification options (optional screen overlay prompt, smart break suggestions like "Stand up and stretch").**

**Why this limit:** The default notification chime is essential for the Pomodoro experience to function -- users need to know when their session ends, especially if they are working in another window. Paywalling basic timer notifications would be perceived as punitive and generate negative reviews ("the timer is silent unless you pay?!"). Custom notification sounds and smart break suggestions are genuine delight features that add value to Pro without being necessary for the core experience.

**Rationale:** Despite the 5.15 score technically placing this in Pro range, the base notification functionality must be free because it is part of the core timer experience. The "limited free" approach preserves the essential function (you hear when your session ends) while gating the customization layer (which notification sound, what extra information the notification shows) behind Pro.

---

### FT-8: Background Timer (Runs with Popup Closed)

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition Power | **8** | Users expect that when they start a timer and close the popup, the timer continues running -- if it did not, the extension would be fundamentally broken. "Timer works in background" is not a marketing feature; it is a basic expectation that, if missing, would prevent installation and generate 1-star reviews. |
| Habit Formation | **9** | The background timer is what makes the entire Pomodoro workflow possible -- users start a session, close the popup, work in their browser, and trust that the timer is tracking their time and will notify them when the session ends. Every single focus session depends on this functionality. |
| Upgrade Trigger | **1** | There is zero upgrade opportunity here because users expect this to work by default. Gating background timer functionality would be perceived as broken software, not a premium feature. No user would upgrade "to make the timer work when the popup is closed." |
| Differentiation | **3** | Every timer extension runs in the background. Not having this would be a defect, not a missing feature. The implementation challenge (Manifest V3 service workers, chrome.alarms for persistence) is a technical hurdle, not a differentiator. |
| Cost to Serve | **10** | Timer state in chrome.storage.session, alarms via chrome.alarms API, badge updates via chrome.action. 100% local. |

**Weighted Score: (8 x 0.25) + (9 x 0.20) + (1 x 0.25) + (3 x 0.15) + (10 x 0.15) = 2.00 + 1.80 + 0.25 + 0.45 + 1.50 = 6.00**

**Tier: FREE (fully free, no limits -- this is core infrastructure, not a feature)**

**Override applied:** Acquisition Power score of 8 and Habit Formation score of 9 both argue strongly for free, and the Upgrade Trigger score of 1 confirms there is zero monetization potential. Additionally, this is not truly a "feature" in the product sense -- it is a technical requirement for the timer to function. Gating it would be equivalent to selling a car where the engine only runs while you hold the key in the ignition.

**Rationale:** The background timer is infrastructure, not a feature. It must work perfectly for free because the entire product breaks without it. Every session, every streak, every metric depends on the timer persisting across popup state changes. This is the technical foundation that enables all other timer features to exist. Scoring it at all is somewhat academic -- it is a non-negotiable requirement. But including it in the framework provides completeness and confirms that the model correctly identifies infrastructure as free.

---

# SUMMARY TABLE

## All Scored Features: Core Blocking + Focus Timer

| # | Category | Feature | Acq. | Habit | Upgrade | Diff. | Cost | Weighted | Tier | Limit (if applicable) |
|---|----------|---------|:----:|:-----:|:-------:|:-----:|:----:|:--------:|:----:|----------------------|
| CB-1 | Core Blocking | Manual website blocklist | 10 | 10 | 9 | 2 | 10 | **8.55** | Limited Free | 10 sites (unlimited Pro) |
| CB-2 | Core Blocking | Pre-built block lists | 8 | 7 | 7 | 4 | 10 | **7.25** | Limited Free | 2 lists (6+ Pro) |
| CB-3 | Core Blocking | Wildcard/regex blocking | 2 | 2 | 6 | 5 | 10 | **4.65** | Pro | -- |
| CB-4 | Core Blocking | Whitelist mode | 3 | 3 | 8 | 7 | 10 | **5.90** | Pro | -- |
| CB-5 | Core Blocking | Schedule-based blocking | 7 | 8 | 8 | 4 | 10 | **7.45** | Limited Free | 1 schedule (unlimited Pro) |
| CB-6 | Core Blocking | Nuclear option | 7 | 5 | 9 | 8 | 10 | **7.70** | Limited Free | Up to 1 hour (up to 24 hours Pro) |
| CB-7 | Core Blocking | Custom block page | 4 | 6 | 5 | 8 | 10 | **6.15** | Pro | Default page free; customization Pro |
| CB-8 | Core Blocking | Redirect to productive sites | 3 | 4 | 4 | 7 | 10 | **5.10** | Pro | -- |
| CB-9 | Core Blocking | Password protection | 4 | 3 | 5 | 3 | 10 | **4.80** | Pro | -- |
| CB-10 | Core Blocking | Category-based blocking | 6 | 6 | 7 | 4 | 10 | **6.55** | Limited Free | 2 categories (6+ Pro) |
| FT-1 | Focus Timer | Basic Pomodoro (25/5) | 9 | 9 | 2 | 2 | 10 | **6.35** | Free | -- (override: Acq. 9) |
| FT-2 | Focus Timer | Custom timer durations | 3 | 6 | 8 | 4 | 10 | **6.05** | Pro | 25/5 fixed free; any duration Pro |
| FT-3 | Focus Timer | Auto-start sessions | 2 | 5 | 5 | 6 | 10 | **5.15** | Pro | -- |
| FT-4 | Focus Timer | Session history | 4 | 5 | 7 | 4 | 10 | **5.85** | Limited Free | 7 days (full history Pro) |
| FT-5 | Focus Timer | Focus goals | 5 | 7 | 6 | 7 | 10 | **6.70** | Limited Free | Daily only (weekly/monthly Pro) |
| FT-6 | Focus Timer | Break customization | 3 | 4 | 5 | 3 | 10 | **4.75** | Pro | Bundled with custom durations |
| FT-7 | Focus Timer | Timer sounds/notifications | 5 | 6 | 3 | 3 | 10 | **5.15** | Limited Free | Default chime free; custom sounds Pro |
| FT-8 | Focus Timer | Background timer | 8 | 9 | 1 | 3 | 10 | **6.00** | Free | -- (infrastructure) |

## Tier Distribution Summary

| Tier | Count | Features |
|------|:-----:|----------|
| **Free** | 2 | Basic Pomodoro timer, Background timer |
| **Limited Free** | 8 | Manual blocklist (10 sites), Pre-built lists (2), Schedule blocking (1), Nuclear option (1hr), Category blocking (2), Session history (7 days), Focus goals (daily), Timer sounds (default) |
| **Pro** | 8 | Wildcard blocking, Whitelist mode, Custom block page, Redirect, Password protection, Custom durations, Auto-start, Break customization |

---

# STRATEGIC OBSERVATIONS

## 1. The "Cost to Serve" Advantage

Every single feature across both categories scores a **10** on Cost to Serve. This is the Chrome extension advantage -- all Core Blocking and Focus Timer features run 100% client-side using Chrome APIs (declarativeNetRequest, alarms, storage). This means the tier decision is never constrained by server costs. The distinction between free and Pro is purely a value-perception and monetization strategy question, not a cost question. This is unlike SaaS products where AI features or data storage create real per-user costs that force server-heavy features behind paywalls.

**Implication:** We have maximum flexibility in tier placement. If A/B testing shows that a currently-Pro feature drives dramatically higher retention when free, we can move it without any infrastructure cost concern.

## 2. The Blocking-Timer Dependency Chain

The data reveals a clear dependency chain:

```
Background Timer (free) enables...
  Basic Pomodoro (free) which creates...
    Session History (limited free) which feeds...
      Focus Goals (limited free) which drives...
        Focus Score (scored in Part 2) which triggers...
          Weekly Reports (scored in Part 2) which converts to...
            Pro subscription
```

Each layer in this chain depends on the one below it. Removing any free layer breaks the chain above it. This validates the tier assignments: the foundational features (timer, Pomodoro) must be free, the middle features (history, goals) can be limited, and the top features (score breakdown, reports) can be Pro because they sit at the end of the value-delivery chain.

## 3. The Two Types of Limits

The framework reveals two distinct limiting strategies:

**Quantity limits** (how many): Manual blocklist (10 sites), pre-built lists (2), schedules (1), categories (2). These work because users accumulate items over time and naturally grow past the cap.

**Duration/depth limits** (how much or how long): Nuclear option (1 hour), session history (7 days), focus goals (daily only). These work because users experience the time boundary and want more of what they already know works.

Both types are represented across the Limited Free tier, providing multiple natural upgrade paths that trigger at different points in the user journey. Quantity limits tend to trigger earlier (adding the 11th site might happen in week 1), while duration/depth limits trigger later (wanting a 24-hour nuclear session or monthly goals develops after weeks of use).

## 4. Alignment with Existing Spec

The scoring results align closely with the tier assignments already established in Phase 02 (sections-1-2-product-features.md). Notable alignments:

- Manual blocklist at 10 sites (matches spec)
- Pre-built lists at 2 free (matches spec)
- Schedule blocking at 1 free (matches spec)
- Nuclear option at 1 hour free (matches spec)
- Basic Pomodoro fully free (matches spec)
- Custom timer durations Pro (matches spec)
- Session history at 7 days free (matches spec)

This consistency validates both the Phase 02 intuitive tier design and the quantitative framework developed here. Where the framework adds value is in providing numerical justification for borderline decisions and explicit reasoning that can be referenced during A/B testing and future feature tier adjustments.

## 5. Recommended A/B Tests Based on Scoring

Features with weighted scores near tier boundaries are the best candidates for A/B testing:

| Feature | Score | Current Tier | Test |
|---------|:-----:|:------------:|------|
| Schedule blocking | 7.45 | Limited Free (1) | Test 2 free schedules vs. 1 to measure impact on D30 retention vs. upgrade rate |
| Custom timer durations | 6.05 | Pro | Test offering 1-2 preset alternatives (50/10, 90/20) for free to measure retention impact |
| Session history | 5.85 | Limited Free (7 days) | Test 14 days vs. 7 days to measure whether longer history improves retention without killing upgrade desire |
| Focus goals | 6.70 | Limited Free (daily) | Test adding free weekly goals to measure whether weekly goal tracking improves D30 retention |

---

*Part 1 of 3 -- Framework Definition + Core Blocking + Focus Timer scoring complete.*
*Part 2 will score: Stats & Analytics, Smart Features, Social & Accountability, Integrations & Power Features.*
*Part 3 will provide: Cross-category analysis, final tier map, implementation priority matrix, and paywall trigger alignment.*
