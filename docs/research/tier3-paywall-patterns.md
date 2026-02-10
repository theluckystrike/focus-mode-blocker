# Tier 3: Developer/Utility Tool Extensions & Cross-Category Paywall Pattern Library

**Research Date:** 2026-02-10
**Purpose:** Competitive intelligence for Focus Mode - Blocker Chrome extension monetization strategy

---

## PART A: TIER 3 — Developer/Utility Tool Extensions

### 1. JSON Viewer/Formatter Extensions

| Extension | Model | Free | Paid | Price |
|-----------|-------|------|------|-------|
| JSON Formatter (callumlocke) | **100% Free / Open Source** | Full formatting, syntax highlighting, collapsible trees, 60+ themes | N/A | Free |
| JSONView (BenHollis) | **100% Free / Open Source** | Auto-formats JSON in browser tab, no tracking | N/A | Free |
| JSON Beautifier & Editor | **100% Free** | Beautify, minify, edit, tree view | N/A | Free |
| JSONLint Formatter | **Free + Website Funnel** | In-browser formatting, export to jsonlint.com | Pro validation features on jsonlint.com website | Website-based |
| DJSON Viewer | **100% Free / Open Source** | JSON/JSONP rendering, collapsible tree | N/A | Free |

**Key Insight:** JSON tools are overwhelmingly free and open source. They compete on feature depth (themes, offline mode, tree view) rather than monetization. The category is essentially a "race to free." Monetization, when it exists, happens through companion websites or SaaS platforms, not the extension itself.

**Lesson for Focus Blocker:** Developer utility tools struggle to monetize because individual features feel too small to charge for. A productivity/focus extension has a much stronger value proposition for charging because the outcome (saved time, reduced distraction) is directly tied to user ROI.

---

### 2. Wappalyzer — Technology Detector

| Attribute | Details |
|-----------|---------|
| **Model** | Freemium with aggressive tiering |
| **Free Tier** | 50 monthly lookups via browser extension; shows technologies detected on current page |
| **Paid Tiers** | Pro: $250/mo (5,000 lookups), Business: $450/mo, Enterprise: $850+/mo |
| **Premium Features** | Company info, contact data, API access, bulk lookups, lead lists, CRM integration |
| **Credit System** | Pre-paid tokens; plan credits expire after 60 days, bundles after 365 days |
| **Paywall Trigger** | Usage counter (50 lookups/month), then hard gate |

**Key Insight:** Wappalyzer transformed from a free developer tool into a B2B lead intelligence platform. The Chrome extension is the acquisition funnel; the real product is data enrichment. They use a classic "Counter" pattern: you see exactly how many lookups remain, creating urgency as the number drops.

**Lesson for Focus Blocker:** The "free extension as funnel to paid platform" model works brilliantly when you can layer business-grade features on top. For Focus Blocker, the extension is the product, so monetization must happen inside the extension itself.

---

### 3. ColorZilla — Color Picker

| Attribute | Details |
|-----------|---------|
| **Model** | 100% Free (freeware) |
| **Free** | Eyedropper, color picker, gradient generator, color history, page color analyzer |
| **Paid** | Nothing |
| **Price** | Free |
| **User Base** | 10+ million downloads since 2003 |

**Key Insight:** ColorZilla has 10M+ downloads with zero monetization. It is a cautionary tale: massive adoption does not automatically equal revenue. The developer has maintained it for 20+ years with no apparent commercial return. This may be a passion project or portfolio piece, but it leaves significant money on the table.

**Lesson for Focus Blocker:** Do not follow this path. Even a small freemium conversion (2-3%) on a large user base generates meaningful revenue. ColorZilla could charge $2.99/month for a "Pro Palette" tier and likely convert thousands of users.

---

### 4. WhatFont — Font Identifier

| Attribute | Details |
|-----------|---------|
| **Model** | 100% Free |
| **Free** | Hover to identify fonts, shows font family, size, weight, line-height, color |
| **Paid** | Nothing |
| **Price** | Free |
| **Developer** | Chengyin Liu (individual developer) |

**Key Insight:** Like ColorZilla, WhatFont is fully free with no data collection. The developer has explicitly stated they do not collect user data. It is another example of a widely-used dev tool that generates zero revenue for its creator.

**Lesson for Focus Blocker:** Single-purpose utilities with no recurring user need struggle to justify a price. Focus Blocker is different: users return daily, making it a habit product with strong retention and therefore strong subscription potential.

---

### 5. Postman Interceptor

| Attribute | Details |
|-----------|---------|
| **Model** | Free companion extension; monetization via parent platform |
| **Free** | Capture API traffic, sync cookies, send restricted headers |
| **Paid** | Postman Pro: $14/user/mo, Business: $29/user/mo, Enterprise: custom |
| **Strategy** | Extension is 100% free to drive users into Postman ecosystem |
| **User Base** | 25+ million developers use Postman platform |

**Key Insight:** Postman Interceptor is a pure acquisition tool. It provides genuine utility for free but requires the Postman app to function. This creates an inescapable funnel: use free extension --> adopt Postman app --> hit collaboration limits --> upgrade to paid team plan.

**Lesson for Focus Blocker:** The companion-product model does not apply directly, but the principle of making the free product genuinely useful (not crippled) while naturally leading to paid features is universally applicable.

---

### 6. Lighthouse / PageSpeed Extensions

| Attribute | Details |
|-----------|---------|
| **Model** | Free (Google-maintained); third-party wrappers monetize |
| **Free (Official)** | Full performance, accessibility, SEO, best practices audits |
| **Third-Party Paid** | LightKeeper: 3 free regions, 25+ paid. PageWatch: free + paid plans. DebugBear: monitoring from $39/mo |
| **Price** | Official: Free. Third-party: $10-100+/mo |

**Key Insight:** Google gives away Lighthouse as a developer ecosystem play. Third-party tools succeed by adding monitoring, historical tracking, multi-location testing, and team features on top of the free core. This is a textbook "Feature Depth" pattern applied at the ecosystem level.

**Lesson for Focus Blocker:** You cannot compete with free tools from Google/big tech. But you can build premium layers on top of free core functionality, just as Lighthouse third-party wrappers do.

---

### 7. Dark Reader — Dark Mode Extension

| Attribute | Details |
|-----------|---------|
| **Model** | Donation-based transitioning to paid (v5) |
| **Free (v4)** | Full dark mode for all websites, per-site customization, scheduling |
| **Paid (v5)** | $9.99 subscription for corporate/company users |
| **Donation Stats** | Only 0.05% (1 in 2,000) of users donate |
| **Platform** | Open Collective for transparent finances |
| **User Base** | 10+ million users |

**Key Insight:** Dark Reader is a case study in the failure and evolution of the donation model. Despite 10M+ users, only 1 in 2,000 donated. The team learned that "people tend to purchase an item rather than make a donation." This directly led to the v5 paid model. The transition faced significant community backlash (GitHub Discussion #9297 had heated debate), but the economic reality forced the change.

**Lesson for Focus Blocker:** NEVER rely on donations as a primary revenue model. Dark Reader's data proves that even beloved tools with massive user bases cannot sustain development on donations alone. Launch with a clear freemium model from day one. It is far easier to launch paid than to convert free users to paid retroactively.

---

### 8. uBlock Origin — Ad Blocker

| Attribute | Details |
|-----------|---------|
| **Model** | 100% Free, Open Source (GPLv3), refuses donations |
| **Free** | Complete ad/tracker blocking, custom filter lists, element picker, logger |
| **Paid** | Nothing. Does not even accept donations |
| **Developer** | Raymond Hill (gorhill), volunteer-maintained |
| **Philosophy** | "By users, for users" - explicitly non-commercial |

**Key Insight:** uBlock Origin is the purest expression of open-source ethos. Raymond Hill refuses donations and does not monetize in any way. This is a philosophical choice, not a business model. It works because it is maintained by a passionate individual who views it as a public good. It is not replicable as a business strategy.

**Lesson for Focus Blocker:** Respect the open-source ecosystem, but do not emulate this model if you need revenue. uBlock Origin proves that ad blockers specifically face a moral/philosophical barrier to monetization (charging to block ads feels contradictory). Focus/productivity tools face no such barrier.

---

### Tier 3 Summary Matrix

| Extension | Model | Revenue Potential | Lesson |
|-----------|-------|-------------------|--------|
| JSON Formatters | Free/OSS | None | Category too commoditized for pricing |
| Wappalyzer | Freemium (B2B) | $250-850+/mo | Counter pattern + B2B upsell works |
| ColorZilla | Free | None (10M+ users wasted) | Massive adoption without monetization is waste |
| WhatFont | Free | None | Single-use tools are hard to monetize |
| Postman Interceptor | Free funnel | Indirect (platform $14-29/user/mo) | Extension as acquisition tool for paid platform |
| Lighthouse | Free (Google) | None (third-party builds on it) | Big tech gives away; indie builds premium on top |
| Dark Reader | Donation --> Paid | $9.99 (corporate) | Donations fail; must launch with paid model |
| uBlock Origin | Free/OSS (refuses $) | None (by choice) | Philosophy, not business; do not emulate |

---

## PART B: CROSS-CATEGORY PAYWALL PATTERN LIBRARY

### Pattern #1: "The Counter"

| Attribute | Details |
|-----------|---------|
| **How It Works** | Show users a visible, real-time counter of remaining free uses. As the number decreases, urgency increases. "3 of 5 focus sessions remaining this week." The counter is always visible, never hidden. |
| **Who Uses It Successfully** | **Wappalyzer** (50/50 lookups remaining), **LinkedIn** (profile views remaining), **Mailchimp** (sends remaining), **ChatGPT Free** (message counter), **Loom** (5-minute video limit with visible timer) |
| **When to Apply** | When your core feature has natural usage units (sessions, searches, exports). Best when the action being counted is high-value and recurring. |
| **Example Copy/UI** | Badge overlay on extension icon: "2/3" in orange. Popup header: "Focus Sessions This Week: 2 of 3 remaining". Progress bar below, 66% filled. Below bar: "Upgrade to Pro for unlimited sessions -- $3.99/mo" |

**Applied to Focus Blocker:**
Free users get 3 focus sessions per week. The extension icon badge shows "2/3" remaining, turning from green (3 left) to yellow (2 left) to red (1 left) to grey (0 -- locked). Each time a session completes, a toast notification says: "Great session! You have 2 focus sessions left this week. Upgrade for unlimited." The counter resets every Monday, creating a weekly urgency cycle. This pattern works because users who have experienced the value of 2-3 sessions are primed to want more.

---

### Pattern #2: "The Preview"

| Attribute | Details |
|-----------|---------|
| **How It Works** | Show the user their result or data, but blur, truncate, or partially obscure the details. They can see enough to know the information exists and is valuable, but cannot use it without upgrading. |
| **Who Uses It Successfully** | **Grammarly** (shows premium suggestions as greyed-out underlines, blurred text), **SEMrush** (shows chart shapes but blurs the numbers), **Ahrefs** (partial keyword data visible), **LinkedIn** (blurred profile viewer names) |
| **When to Apply** | When your product generates actionable data or insights. The user must see that value exists before you ask them to pay for it. |
| **Example Copy/UI** | Stats panel: "Your Productivity Score: [BLURRED]". Below: "You blocked 12 distractions today. Your focus trend is [BLURRED GRAPH]. Premium members see full analytics." A lock icon overlays the blurred area with a shimmer effect. |

**Applied to Focus Blocker:**
After each focus session, show a completion screen with partial analytics. Display clearly: "Session: 45 min, Sites blocked: 7." Then below, show a blurred "Productivity Insights" card: "Your peak focus time is [BLURRED], Your biggest distraction is [BLURRED], Weekly trend: [BLURRED GRAPH]." The user can see that the data exists and shapes are visible, but specifics are locked. CTA button: "Unlock Your Full Focus Report -- Try Pro Free." This leverages loss aversion -- the data is already generated, so not seeing it feels like a loss.

---

### Pattern #3: "The Lock Icon"

| Attribute | Details |
|-----------|---------|
| **How It Works** | Display all features in the UI, but place a small lock icon or "PRO" badge on premium features. Users can see the full feature set, understand what is possible, and feel the pull of what they cannot access. Features are visible but not clickable. |
| **Who Uses It Successfully** | **Todoist** (lock icons on filters, labels, reminders), **Canva** (crown icon on premium templates/elements), **Notion** (shows feature in menu with "Upgrade" tag), **Momentum** (lock on Focus Mode, soundscapes, Tab Stash) |
| **When to Apply** | When you have 5+ features and want to upsell on feature breadth. Works best when premium features are shown in context alongside free ones. |
| **Example Copy/UI** | Settings panel listing: "Block List [checkmark]", "Schedule Sessions [checkmark]", "Custom Block Pages [PRO lock]", "Focus Music [PRO lock]", "Analytics Dashboard [PRO lock]", "App Blocking [PRO lock]". Clicking a locked item shows: "Custom Block Pages is a Pro feature. Create beautiful, motivating block pages instead of boring error screens. Upgrade for $3.99/mo." |

**Applied to Focus Blocker:**
In the extension popup, show a clean feature list. Free features have green checkmarks. Premium features show a small amber lock icon with "PRO" text. When a user clicks a locked feature (e.g., "Pomodoro Timer," "Focus Sounds," "Custom Block Messages," "Team Accountability"), a slide-up panel explains the feature with a screenshot and a single CTA button: "Start 7-Day Free Trial." The key is that locked features must be visible every time the user opens the popup, creating repeated exposure to the value they are missing.

---

### Pattern #4: "The Time Gate"

| Attribute | Details |
|-----------|---------|
| **How It Works** | Give users full access to all features for a limited time (7-14 days), then gate premium features behind a paywall. The user experiences the full product, builds habits, and then feels the loss when features disappear. |
| **Who Uses It Successfully** | **1Password** (14-day full trial, then paywall), **LastPass** (30-day Premium trial bundled with free plan), **Grammarly** (7-day Premium trial), **Momentum** (free Plus trial on install), **Adobe Creative Cloud** (7-day trial) |
| **When to Apply** | When your premium features need time to demonstrate value. Best when the product builds user habits or data that make switching costly. |
| **Example Copy/UI** | Onboarding screen: "Welcome to Focus Mode Pro! You have 7 days of full access. After your trial: Basic blocking stays free forever. Pro features (analytics, scheduling, custom pages) require a subscription." Day 5 banner: "Your Pro trial ends in 2 days. You have completed 8 focus sessions and saved an estimated 3.2 hours. Keep your streak going -- upgrade now." |

**Applied to Focus Blocker:**
On install, activate a 7-day full Pro trial automatically. During the trial, the extension tracks and highlights Pro features being used: "You used Focus Scheduling 4 times this week [PRO feature]." On day 5, show a non-intrusive banner: "Your Pro trial ends in 2 days." On day 7, show a summary: "During your trial you: completed 12 focus sessions, blocked 47 distractions, saved ~4.5 hours. Keep all Pro features for $3.99/mo." This works because users have now built a habit and accumulated data they do not want to lose.

---

### Pattern #5: "The Storage Limit"

| Attribute | Details |
|-----------|---------|
| **How It Works** | Free tier has a hard cap on stored data, saved items, or list sizes. Users naturally accumulate data over time, making the limit increasingly painful. The more they use the product, the more they need to upgrade. |
| **Who Uses It Successfully** | **Evernote** (60MB/month upload, 2 device sync on free), **Dropbox** (2GB free storage), **Google Drive** (15GB free), **LastPass** (one device type on free), **Trello** (10 boards per workspace on free) |
| **When to Apply** | When users accumulate data over time that they cannot easily recreate. The switching cost increases naturally with usage. |
| **Example Copy/UI** | Block list panel: "Your Block List: 8 of 10 sites used". Warning banner at 8/10: "You are running out of block list slots. Upgrade to Pro for unlimited sites and categories." At 10/10: "Block list full. Remove a site to add a new one, or upgrade to Pro for unlimited blocking." |

**Applied to Focus Blocker:**
Free users can block up to 10 websites. The block list shows "8/10 sites" with a progress bar. At 8 sites, the "Add Site" button turns yellow with text: "2 slots remaining." At 10, the button is disabled with a lock icon: "Block list full. Upgrade to Pro for unlimited sites, category blocking (e.g., block all social media), and URL pattern matching." This works especially well because distraction sites multiply -- users quickly discover they need more than 10 slots as they identify all their distraction triggers.

---

### Pattern #6: "The Feature Depth"

| Attribute | Details |
|-----------|---------|
| **How It Works** | The core feature is free but shallow. Advanced configurations, customization, and power-user options are gated. Free users get the "what"; paid users get the "how." |
| **Who Uses It Successfully** | **Grammarly** (free: spelling/grammar; paid: tone, clarity, rewrites, plagiarism), **Canva** (free: basic templates; paid: brand kit, background remover, resize), **Zoom** (free: 40-min meetings; paid: unlimited, recording, breakout rooms), **Slack** (free: 90-day history; paid: unlimited history, integrations) |
| **When to Apply** | When your core value proposition can be delivered at multiple levels of sophistication. The free version must be genuinely useful, not crippled. |
| **Example Copy/UI** | Session config screen: "Quick Focus (Free): Start a 25-min block session with one click." Below: "Smart Focus (Pro): Custom duration, break intervals, difficulty modes (easy/medium/strict), scheduled sessions, website allowlisting during breaks." The free option works immediately; the pro options appear as expandable sections that reveal their UI but require upgrade to activate. |

**Applied to Focus Blocker:**
Free: One-click blocking with preset durations (25, 45, 60 min) and a fixed block page ("This site is blocked. Stay focused!"). Pro: Custom durations (1 min to 8 hours), Pomodoro mode with auto-breaks, "Nuclear Mode" (cannot disable until timer ends), scheduled daily sessions, custom block page messages and images, difficulty levels (Easy: can disable with 30-sec delay; Strict: cannot disable at all), and break-time allowlisting. The free version is fully functional and valuable; Pro adds depth for power users.

---

### Pattern #7: "The Team Feature"

| Attribute | Details |
|-----------|---------|
| **How It Works** | Individual use is free. Collaboration, sharing, team management, and admin features require a paid plan. The more users adopt individually, the stronger the bottom-up pressure to buy a team plan. |
| **Who Uses It Successfully** | **Slack** (free for small teams, paid for enterprise features), **Notion** (free personal, paid team workspaces), **Figma** (free for 3 projects, paid for team libraries), **Postman** (free individual, paid team workspaces), **Todoist** (free personal, Business plan for teams) |
| **When to Apply** | When your product has a natural multiplayer use case. Particularly effective when one team member's adoption creates pressure for others to join. |
| **Example Copy/UI** | Popup panel: "Focus Mode -- Personal (Free)". Below: "Team Focus (Pro): Invite teammates, shared block lists, team focus sessions, accountability partner, manager dashboard." A "Share Focus Session" button is always visible but clicking shows: "Team Focus is a Pro feature. Focus together with your team and hold each other accountable. Starting at $5.99/mo per team." |

**Applied to Focus Blocker:**
Individual blocking is free forever. Team features are paid: shared block lists for classrooms or offices, "Focus Together" mode (see when teammates are in focus sessions), accountability partnerships (partner gets notified if you try to unblock a site), team analytics dashboard, admin-managed block policies. The upgrade path: a user discovers they want to share their setup with a study group or team. They click "Invite Teammate" and hit the paywall. Team pricing: $5.99/mo for up to 5 members, $9.99/mo for up to 20.

---

### Pattern #8: "The Productivity Badge"

| Attribute | Details |
|-----------|---------|
| **How It Works** | Award users visible badges, streaks, scores, and rankings based on usage. Free users see basic stats; paid users get detailed gamification, leaderboards, and shareable achievement cards. Social proof and status drive upgrades. |
| **Who Uses It Successfully** | **Grammarly** (weekly writing score email, tone badges, "Productive" label), **Duolingo** (streak counter, XP, leagues, streak freeze -- paid), **Forest App** (virtual trees grown during focus time), **Strava** (free activity, paid segment leaderboards) |
| **When to Apply** | When your product has a daily/weekly usage pattern and users have intrinsic motivation to improve. Gamification multiplies engagement in habit-forming products. |
| **Example Copy/UI** | Post-session popup: "Focus Streak: 5 days in a row! [fire emoji in UI, not copy]". Badge earned: "Deep Worker -- Completed 10 hours of focus this week." Below: "Share your achievement [PRO lock]. Unlock focus leaderboards, streak protection, and monthly focus reports with Pro." |

**Applied to Focus Blocker:**
Free users see basic streak counters ("3-day focus streak") and simple badges ("First Session," "5 Sessions"). Pro users unlock: detailed achievement system (30+ badges), focus leaderboards (compete with friends), streak protection (one free "miss" day per week so you do not lose your streak), shareable focus cards (image cards showing "I focused for 12 hours this week using Focus Mode"), monthly focus reports emailed as PDFs, and a "Focus Score" (0-100) based on session length, consistency, and sites blocked. The streak protection alone is a powerful conversion driver -- users who have built a 14-day streak will pay to protect it.

---

### Pattern #9: "The Security Alert"

| Attribute | Details |
|-----------|---------|
| **How It Works** | The free version identifies problems, risks, or issues. The paid version provides the solution, fix, or protection. Free = diagnosis, Paid = treatment. Fear and urgency drive conversion. |
| **Who Uses It Successfully** | **Norton/McAfee** (free scan finds threats, paid removes them), **Malwarebytes** (free scan, paid real-time protection), **SEMrush** (free site audit shows errors, paid provides fixes), **Grammarly** (free finds errors, premium shows advanced issues as "premium alerts"), **CCleaner** (free scan, paid auto-clean) |
| **When to Apply** | When you can frame the absence of your paid feature as a risk or problem. Works in security, health, productivity, and performance contexts. |
| **Example Copy/UI** | Weekly notification: "Focus Alert: You spent 4.2 hours on distracting sites this week [up from 3.1 last week]. Your productivity score dropped 15%." Below: "Pro Protection: Auto-schedule focus sessions to prevent distraction spirals. Smart blocking activates when you visit blocked sites outside focus sessions. Upgrade to Pro." |

**Applied to Focus Blocker:**
Free users get a weekly "Distraction Report" notification: "This week: 3.5 hours on blocked sites outside focus sessions. That is 2 full workdays per month lost to distractions." The alert is free and genuinely useful. The fix is Pro: "Enable Auto-Focus to automatically block distracting sites during work hours (M-F, 9am-5pm). Enable Distraction Alerts to get a popup warning when you have spent 10+ minutes on a distracting site. Enable Focus Recovery to redirect you to your task list when you visit a blocked site." The psychological trigger is loss aversion -- you are losing 2 workdays per month, and the fix costs $3.99/mo.

---

### Pattern #10: "The Smart Onboarding"

| Attribute | Details |
|-----------|---------|
| **How It Works** | Give full access during onboarding (first 7-14 days or first N uses), then progressively gate features. Unlike a simple time gate, the onboarding is designed to ensure users experience every premium feature at least once before the gate drops. |
| **Who Uses It Successfully** | **Momentum** (Plus trial on install), **Todoist** (shows Pro features during setup), **Canva** (premium templates in first-use experience), **Headspace** (full meditation library for first week), **Calm** (7-day full access trial with guided onboarding) |
| **When to Apply** | When your product has a learning curve and users might not discover premium features organically. The onboarding ensures they experience maximum value before seeing the paywall. |
| **Example Copy/UI** | Day 1 onboarding: "Let us set up your perfect focus environment! Step 1: Add your top distracting sites [shows unlimited list - Pro feature]. Step 2: Set your focus schedule [shows calendar scheduler - Pro feature]. Step 3: Choose your block page style [shows custom templates - Pro feature]. Step 4: Pick your focus soundtrack [shows ambient sounds - Pro feature]." Day 8: "Your Pro trial has ended. You set up: 15 blocked sites, a daily schedule, a custom block page, and a focus soundtrack. Keep your setup? Upgrade to Pro." |

**Applied to Focus Blocker:**
On install, walk users through a 4-step onboarding that configures all Pro features: (1) Build your block list (unlimited during trial), (2) Set your focus schedule (calendar view), (3) Customize your block page (template picker with motivational quotes), (4) Choose focus sounds (lo-fi, rain, white noise). Each step is labeled "PRO" with a small badge, but works during the trial. After 7 days, show: "You configured 4 Pro features during your trial. Without Pro, your setup reduces to: 10 blocked sites (you have 18), no schedule, default block page, no sounds. Keep your full setup for $3.99/mo." This creates maximum loss aversion because users have invested time configuring a personalized experience.

---

### Pattern #11: "The Export Gate"

| Attribute | Details |
|-----------|---------|
| **How It Works** | Users can create, view, and use data inside the product for free. But exporting, sharing, downloading, or moving data outside the product requires a paid plan. This creates value inside the tool while gating the ability to extract that value. |
| **Who Uses It Successfully** | **Canva** (free design, paid for transparent PNG/SVG download), **Loom** (free recording, paid for transcript download), **Notion** (free use, paid for PDF export of databases), **Airtable** (free views, paid for CSV export), **Google Analytics** (free reports, GA360 for raw data export) |
| **When to Apply** | When your product generates data or assets that users want to use elsewhere. Best when the in-app value is clear but the export adds professional/actionable utility. |
| **Example Copy/UI** | Analytics screen: "Your Focus Data -- This Month: 42 sessions, 31.5 hours focused, 89% completion rate." Export button: "Download Report (PDF) [PRO lock]". "Export to CSV [PRO lock]". "Share Focus Card [PRO lock]". Free users see all data in-app but cannot export. Tooltip on lock: "Export your focus data to share with managers, track progress in spreadsheets, or post achievements. Pro feature -- $3.99/mo." |

**Applied to Focus Blocker:**
Free users see all their focus data in the extension popup and dashboard. But exporting is gated: "Download Weekly Report (PDF)" requires Pro. "Export Block List" (for sharing with teammates or importing on another device) requires Pro. "Generate Focus Certificate" (a shareable image: "I focused for 20 hours this week") requires Pro. "API Access" for integration with Toggl, RescueTime, or Notion requires Pro. This works because the data accumulates value over time -- after a month of tracking, users have rich data they want to use outside the extension.

---

### Pattern #12: "The Sync Gate"

| Attribute | Details |
|-----------|---------|
| **How It Works** | The product works on a single device for free. Syncing settings, data, and state across multiple devices or browsers requires a paid plan. As users adopt the tool on their primary device, they naturally want it everywhere. |
| **Who Uses It Successfully** | **LastPass** (free: one device type only; paid: all devices), **Evernote** (free: 2 devices; paid: unlimited), **1Password** (no free tier; sync is core paid feature), **Todoist** (free sync on basic, paid for backup/restore), **Dark Reader** (no sync on free; Plus adds sync) |
| **When to Apply** | When users work across multiple devices (laptop + phone + tablet). Best when settings/configuration are complex enough that recreating them manually is painful. |
| **Example Copy/UI** | Settings panel: "Your Focus Mode is set up on this device. Sync to all devices [PRO lock]." When user installs on a second browser: "We detected you have Focus Mode on Chrome. Sync your block list, schedules, and settings to this browser? [Requires Pro -- $3.99/mo]." Free alternative: "Or set up this device manually." |

**Applied to Focus Blocker:**
Free: The extension works perfectly on one Chrome profile. All settings, block lists, and schedules are local. Pro: "Focus Sync" syncs everything across Chrome profiles, devices, and even to Firefox/Edge if you expand. When a user installs on a second device, they see: "Welcome back! We found your Focus Mode account. Your other device has: 15 blocked sites, 3 daily schedules, a custom block page. Sync everything to this device instantly? [Pro feature -- $3.99/mo]. Or start fresh for free." The pain point is real: nobody wants to manually re-enter 15 blocked sites and 3 schedules. Sync is also a gateway to account creation, which enables email marketing and retention.

---

### Bonus Pattern #13: "The Urgency Window"

| Attribute | Details |
|-----------|---------|
| **How It Works** | After a key moment of value delivery, show a time-limited upgrade offer. The user has just experienced the product's value and is in a peak emotional state. A limited-time discount creates urgency. |
| **Who Uses It Successfully** | **Headspace** (post-meditation: "50% off annual plan -- offer expires in 24 hours"), **Calm** (post-session discount), **Duolingo** (streak milestone: "Keep your streak -- 40% off Super"), **Forest App** (after growing a virtual tree: "Plant real trees with Pro") |
| **When to Apply** | After a "wow moment" -- session completion, achievement unlocked, milestone reached. Never during onboarding or before value is demonstrated. |
| **Example Copy/UI** | Post-session screen: "Amazing focus session! 45 minutes of deep work. You are on a 5-day streak." Below: "Celebrate your progress: Get Pro for 30% off -- $2.79/mo (regular $3.99). Offer expires at midnight." A countdown timer adds urgency. |

**Applied to Focus Blocker:**
After a user completes their best-ever focus session (longest duration, or a new streak milestone), show a celebratory screen with confetti animation and their achievement. Below the celebration: "Unlock Pro to keep the momentum: 30% off for the next 24 hours. $2.79/mo instead of $3.99/mo." Include a countdown timer. This works because the user is at peak satisfaction -- they just achieved something and want to do more. The discount makes the decision feel rewarding rather than costly.

---

### Pattern Library Summary Table

| # | Pattern | Conversion Trigger | Best For | Difficulty to Implement |
|---|---------|-------------------|----------|------------------------|
| 1 | The Counter | Scarcity / urgency | Usage-based products | Low |
| 2 | The Preview | Curiosity / loss aversion | Data/analytics products | Medium |
| 3 | The Lock Icon | Awareness / aspiration | Feature-rich products | Low |
| 4 | The Time Gate | Habit formation / loss | Products with learning curve | Medium |
| 5 | The Storage Limit | Accumulation / switching cost | Data/list-based products | Low |
| 6 | The Feature Depth | Power-user aspiration | Products with config options | Medium |
| 7 | The Team Feature | Social pressure / bottom-up | Products with multiplayer use | High |
| 8 | The Productivity Badge | Status / social proof | Habit/daily-use products | Medium |
| 9 | The Security Alert | Fear / loss aversion | Protection/monitoring tools | Medium |
| 10 | The Smart Onboarding | Invested effort / loss | Products with setup complexity | High |
| 11 | The Export Gate | Data ownership / utility | Analytics/reporting products | Low |
| 12 | The Sync Gate | Convenience / multi-device | Cross-platform products | High |
| 13 | The Urgency Window | Peak emotion / scarcity | Any product with "wow moments" | Low |

---

## PART C: THE GRAMMARLY PLAYBOOK (Deep Dive)

### Overview

Grammarly is the gold standard for Chrome extension freemium conversion. From a free Chrome extension, Grammarly grew to 30 million daily active users, over 1 million premium subscribers, and a $13 billion valuation -- all bootstrapped for the first 9 years. Their conversion rate of approximately 3-4% of free to paid (with some analyses citing up to 40% of active free users converting over time) far exceeds the industry average of 2-5%.

The core principle is **"Gift, Then Gate"**: deliver genuine, undeniable value for free, then show users what more looks like.

---

### 1. How Grammarly Shows Value Before Locking

**The Free Product is Genuinely Excellent:**
- Free Grammarly catches spelling errors, basic grammar mistakes, and punctuation issues
- It works across 500,000+ websites including Gmail, Google Docs, LinkedIn, Twitter, and Slack
- The Chrome extension activates automatically -- zero friction, zero configuration
- Free users get real corrections that improve their writing immediately

**The Key Insight:** Grammarly does not give users a crippled product. The free version is a legitimate grammar checker that people would use even if no premium existed. This builds trust and habit. Users write with Grammarly active every day, multiple times per day. It becomes invisible infrastructure in their workflow.

**Metric That Matters:** Grammarly processes billions of text inputs daily. Every correction is a micro-moment of delivered value. By the time a user sees a premium suggestion, they have already received hundreds of free corrections. The trust account is overflowing.

---

### 2. The Blur/Preview Technique Specifics

**How Premium Suggestions Appear to Free Users:**

Grammarly uses a color-coded underline system:
- **Red underlines** = Correctness issues (FREE -- spelling, grammar, punctuation)
- **Blue underlines** = Clarity suggestions (partially free, partially premium)
- **Green underlines** = Engagement suggestions (PREMIUM -- word choice, vocabulary enhancement)
- **Purple/Violet underlines** = Delivery suggestions (PREMIUM -- tone, formality, confidence)

**The Blur Technique:**
When a free user writes, Grammarly shows premium suggestions in the sidebar as greyed-out or locked cards. The user can see:
- That a suggestion exists (the underline is visible in their text)
- The category of the suggestion ("Clarity" or "Engagement")
- A generic description ("This sentence could be more concise")
- But NOT the specific fix (the actual rewrite is hidden/blurred)

**The Psychological Mechanism:**
This creates an "information gap" -- the user knows a better version of their sentence exists but cannot see it. Each locked suggestion is a tiny itch they cannot scratch. Multiply this across every document, every day, and the pressure to upgrade accumulates.

**The "3 Daily Premium Suggestions" Tactic:**
Grammarly shows free users approximately 3 premium suggestions per day that are fully unlocked. This is strategic:
- It proves the premium suggestions are genuinely useful (not fluff)
- It creates a taste/sample effect -- users experience the quality and want more
- It sets an anchor: "If 3 suggestions improved my email this much, imagine what unlimited would do"
- The number 3 is low enough to create scarcity but high enough to demonstrate value

---

### 3. Badge Placement and Counter Psychology

**The Performance Score:**
Grammarly displays an "Overall Score" (0-100) for every document. Free users see:
- Their score number (e.g., "82")
- A color indicator (red/yellow/green)
- Basic metrics: word count, character count, reading time, speaking time

Premium users additionally see:
- Score breakdown by category (correctness, clarity, engagement, delivery)
- Readability score
- Vocabulary level
- Tone detection (formal, friendly, confident, etc.)

**The Counter Psychology:**
The score creates a quantified gap. A free user sees "Score: 82" and knows premium features could raise it higher. Each locked suggestion in the sidebar implicitly says: "Your score could be 92 if you had Pro." This is the "Counter" pattern applied to quality rather than quantity.

**The Green Grammarly Icon:**
The extension icon shows a green circle with a number -- the count of suggestions found. Free users see this number includes premium suggestions they cannot access. If the icon shows "7" but only 4 are free corrections, the user is constantly reminded that 3 improvements are locked behind the paywall.

**Weekly Performance Email:**
Grammarly sends a weekly email with:
- Words checked that week
- Unique words used
- Accuracy score vs. other users ("You were more accurate than 78% of Grammarly users")
- Productivity metrics
- Streak information
This email is free, builds engagement, and subtly upsells by showing premium metrics as locked.

---

### 4. The Upgrade Flow (Exact Steps)

**Step 1: Trigger**
The user encounters a premium suggestion while writing. The text has a colored underline (green/purple). The user clicks the underline or the suggestion card in the sidebar.

**Step 2: Preview Card**
A card appears showing:
- The suggestion category (e.g., "Engagement")
- A description: "This sentence could be more engaging"
- A blurred/locked specific suggestion
- A "Go Premium" button
- A small "Learn More" link

**Step 3: Click "Go Premium"**
The user is taken to the Grammarly pricing page. The page shows:
- Three tiers: Free (current), Premium ($12/mo), Business ($15/member/mo)
- A side-by-side feature comparison
- The user's current writing stats as social proof ("You have checked 45,000 words with Grammarly")
- Annual plan highlighted as "Best Value" (reduces to $12/mo from $30/mo monthly)

**Step 4: Plan Selection**
The user selects a plan. Annual plan is pre-selected and visually emphasized with a "SAVE 60%" badge.

**Step 5: Payment**
Standard payment form: credit card or PayPal. A 7-day money-back guarantee is shown.

**Step 6: Immediate Activation**
Upon payment, all premium suggestions immediately unlock in the current document. The user sees their score jump (e.g., 82 to 91). This provides instant gratification and validates the purchase. Previously locked underlines become clickable, and the blurred suggestions are revealed.

**Step 7: Post-Purchase Reinforcement**
Over the next 7 days, Grammarly sends:
- "Your first week with Premium" email series
- Highlighted premium features they have not used yet
- Their improved writing stats vs. the previous week

---

### 5. Why It Works Psychologically

**Principle 1: Endowed Progress Effect**
Free Grammarly gives users a score and progress metrics from day one. Users feel they have already started a journey. Upgrading feels like continuing progress, not starting something new.

**Principle 2: Loss Aversion (Kahneman & Tversky)**
The blurred suggestions create perceived loss. The user's text HAS an improvement available -- they can see the underline -- but they cannot access it. Psychologically, a locked improvement to your own work feels like losing something you already have.

**Principle 3: Mere Exposure Effect**
Users see "Go Premium" badges and locked suggestions hundreds of times over weeks and months. Familiarity breeds acceptance. By the time they click "upgrade," the decision feels natural, not pressured.

**Principle 4: Variable Ratio Reinforcement**
The 3 daily free premium suggestions arrive at unpredictable times. Like a slot machine, the variability keeps users engaged and hoping the next suggestion will be unlocked. When it is not, the desire for unlimited access grows.

**Principle 5: Social Proof via Metrics**
The weekly email showing "You were more accurate than 78% of users" creates social comparison. Premium users get even more detailed comparisons, making free users feel they are competing with one hand tied behind their back.

**Principle 6: Invested Sunk Cost**
By the time a user considers upgrading, they have written thousands of words with Grammarly active. Their writing history, preferences, and personal dictionary are all stored in Grammarly. Switching to a competitor means losing all of this accumulated value.

**Principle 7: Anchoring**
Showing the monthly price ($30/mo) next to the annual price ($12/mo) makes the annual plan feel like a bargain. The 60% savings frame makes the user feel smart for choosing annual, even though they are committing to a year.

---

### 6. How to Adapt the Grammarly Playbook EXACTLY for Focus Mode - Blocker

#### Phase 1: The Gift (Free Version Must Be Genuinely Great)

**What to Give Away for Free:**
- Unlimited basic website blocking (enter URL, site is blocked)
- Up to 10 sites on the block list
- 3 focus sessions per week (25, 45, or 60 minutes)
- Basic block page ("This site is blocked. Stay focused!")
- Simple session counter ("Sessions this week: 2")
- Extension icon badge showing active session timer

**Why This Works:** Free users get real value. They can block their top distractions and complete focus sessions. The product is useful, not crippled. Like Grammarly's free grammar checking, the core promise (block distracting sites) is fully delivered.

#### Phase 2: The Underline Equivalent (Show Value That Exists But Is Locked)

**The Focus Blocker "Underlines":**
Replace Grammarly's colored underlines with visible but locked data and features:

1. **Post-Session Score:** After each session, show "Focus Score: 74/100" (free). Below: "Breakdown: Concentration [LOCKED], Distraction attempts [LOCKED], Optimal focus time [LOCKED]." The number 74 is tantalizing -- the user wants to know WHY it is 74 and HOW to make it higher.

2. **Weekly Distraction Report:** Show "You attempted to visit blocked sites 23 times this week." Below: "Top distraction: [BLURRED]. Peak distraction hour: [BLURRED]. Distraction trend: [BLURRED GRAPH]." Like Grammarly showing premium suggestion count, the user can see the data exists.

3. **Blocked Page Upgrade Prompt:** When a user hits a blocked site, the block page shows their remaining session time and a motivational quote (free). At the bottom, in subtle text: "Pro members see: custom block messages, focus music player, productivity tips, and their focus streak on this page."

#### Phase 3: The Badge and Counter (Quantify the Gap)

**The Focus Score Badge:**
- Extension icon shows focus score color: green (great), yellow (moderate), red (poor)
- Popup always shows: "Focus Score: 74 | Sessions: 2/3 remaining | Streak: 3 days"
- The score is calculated from session completion rate, distraction attempts, and session length
- Free users see the score but not the breakdown
- This is the equivalent of Grammarly's "7 suggestions found" icon badge -- it quantifies value constantly

**The Weekly Focus Email:**
Send a free weekly email (modeled on Grammarly's weekly report):
- Total focus time this week
- Sessions completed
- "You were more focused than 65% of Focus Mode users" (social proof)
- Streak status
- 1-2 locked metrics: "Your optimal focus window is [LOCKED -- Upgrade to Pro]"
- "Your distraction pattern suggests [LOCKED -- Upgrade to Pro]"

#### Phase 4: The Blur Technique (Preview Without Access)

**Exact Implementation:**

After each session, show a "Session Report" card:

```
+------------------------------------------+
|  SESSION COMPLETE                         |
|  Duration: 45 minutes                     |
|  Sites Blocked: 7                         |
|  Distraction Attempts: 4                  |
|  Focus Score: 78/100                      |
+------------------------------------------+
|  PRO INSIGHTS            [lock icon]      |
|  ........................................  |
|  Peak focus: ██████████ (blurred)         |
|  Top distraction: ██████ (blurred)        |
|  Recommendation: ████████████ (blurred)   |
|  ........................................  |
|  [Unlock Full Insights - Try Pro Free]    |
+------------------------------------------+
```

The blurred section is visible enough to see that information exists (bar charts, text shapes) but unreadable. This is exactly Grammarly's technique of showing premium suggestions as locked cards.

#### Phase 5: The 3-Per-Day Taste (Variable Reinforcement)

**Equivalent of Grammarly's 3 Daily Premium Suggestions:**

Give free users 1 free "Pro Insight" per session (up to 3 per week):
- After Session 1: "Pro Insight: Your peak focus today was at 10:23 AM. You are a morning focuser."
- After Session 2: "Pro Insight: You attempted to visit Twitter 3 times in the first 5 minutes. Try blocking it before you start."
- After Session 3: Insight is locked. "Get unlimited insights with Pro."

This creates the same variable reinforcement as Grammarly: sometimes you get the premium feature, sometimes you do not. The unpredictability drives desire for consistent access.

#### Phase 6: The Upgrade Flow (Exact Steps)

**Step 1: Trigger**
User clicks a locked insight, hits the session limit (3/3), or encounters a locked feature.

**Step 2: Value Summary Slide-Up Panel**
A bottom panel slides up showing:
```
+------------------------------------------+
|  FOCUS MODE PRO                           |
|                                           |
|  Your focus stats:                        |
|  * 12 sessions completed                  |
|  * 8.5 hours of focus time                |
|  * 47 distractions blocked                |
|                                           |
|  Unlock with Pro:                         |
|  [checkmark] Unlimited sessions           |
|  [checkmark] Full analytics & insights    |
|  [checkmark] Custom block pages           |
|  [checkmark] Focus sounds & Pomodoro      |
|  [checkmark] Cross-device sync            |
|  [checkmark] Streak protection            |
|                                           |
|  $3.99/mo or $29.99/yr (save 37%)        |
|                                           |
|  [Start 7-Day Free Trial]                 |
|  [Maybe Later]                            |
+------------------------------------------+
```

**Step 3: Trial Activation**
One click to start trial. No credit card required for 7 days. All Pro features unlock instantly.

**Step 4: Immediate Value**
The blurred insights immediately unblur. The session limit counter disappears. The extension icon changes to include a small "PRO" badge. The user feels an immediate upgrade in experience.

**Step 5: Trial End Flow (Day 7)**
```
+------------------------------------------+
|  YOUR PRO TRIAL ENDS TODAY                |
|                                           |
|  This week with Pro, you:                 |
|  * Completed 8 focus sessions (vs 3 max)  |
|  * Discovered your peak focus: 9-11 AM    |
|  * Used Pomodoro mode 4 times             |
|  * Maintained a 7-day streak              |
|                                           |
|  Without Pro tomorrow:                    |
|  * 3 sessions/week limit returns          |
|  * Analytics locked                       |
|  * Custom block pages revert to default   |
|  * Streak protection disabled             |
|                                           |
|  Keep Pro: $3.99/mo or $29.99/yr          |
|                                           |
|  [Continue Pro]    [Downgrade to Free]    |
+------------------------------------------+
```

**Step 6: Post-Purchase Reinforcement**
For the first week after payment:
- Day 1: "Welcome to Pro! Here are 3 features to try today."
- Day 3: "You have used Focus Sounds 5 times. Try Pomodoro mode next."
- Day 7: "Your first week as a Pro: 10 sessions, 7.5 hours focused. That is 2x your free usage."

#### Psychological Architecture (Why This Adaptation Works)

| Grammarly Principle | Focus Blocker Equivalent |
|---------------------|--------------------------|
| Free grammar checking builds trust | Free basic blocking builds trust |
| Colored underlines show premium exists | Post-session blurred insights show data exists |
| Score (82/100) quantifies improvement gap | Focus Score (74/100) quantifies focus gap |
| 3 daily premium suggestions = taste | 1 free Pro Insight per session = taste |
| Weekly email with social proof | Weekly focus email with percentile ranking |
| Locked suggestions = information gap | Locked analytics = information gap |
| "Score could be 92 with Pro" | "Focus Score could be 90+ with Pro" |
| Immediate score jump on upgrade | Immediate analytics unlock on upgrade |
| Writing history creates sunk cost | Focus data/streaks create sunk cost |
| Annual plan anchored against monthly | Annual plan ($29.99) anchored against monthly ($3.99) |

---

### Recommended Implementation Priority for Focus Mode - Blocker

| Priority | Pattern | Expected Impact | Implementation Effort |
|----------|---------|-----------------|----------------------|
| 1 | The Counter (#1) + Feature Depth (#6) | HIGH -- establishes freemium boundary | Low |
| 2 | The Preview/Blur (#2) + Score Badge (#8) | HIGH -- Grammarly playbook core | Medium |
| 3 | The Lock Icon (#3) | MEDIUM -- drives feature awareness | Low |
| 4 | The Smart Onboarding (#10) + Time Gate (#4) | HIGH -- maximizes trial conversion | Medium |
| 5 | The Storage Limit (#5) | MEDIUM -- natural block list growth | Low |
| 6 | The Security Alert (#9) | HIGH -- weekly distraction reports | Medium |
| 7 | The Urgency Window (#13) | MEDIUM -- post-session offers | Low |
| 8 | The Export Gate (#11) | LOW-MEDIUM -- data accumulates over time | Low |
| 9 | The Sync Gate (#12) | MEDIUM -- requires account system | High |
| 10 | The Team Feature (#7) | HIGH (long-term) -- B2B opportunity | High |

---

### Key Takeaways

1. **Launch with a real free product.** Grammarly proves that genuine free value (not a crippled demo) builds the trust needed for premium conversion. Focus Blocker's free tier must block sites and run sessions without frustrating limitations.

2. **Make the paywall visible, not aggressive.** Grammarly shows premium suggestions in your text -- you see them every time you write. Focus Blocker should show locked insights after every session -- not as popups, but as natural parts of the interface.

3. **Quantify the gap.** Grammarly's score (82/100) makes users ask "how do I get to 100?" Focus Blocker's Focus Score (74/100) should create the same question. Numbers are more persuasive than feature lists.

4. **Give a taste, not a tour.** Grammarly's 3 daily premium suggestions are not a "tour of premium" -- they are real value delivered in context. Focus Blocker should give 1 real insight per session, not a marketing slide.

5. **Time your ask.** Grammarly asks for upgrade when users click a locked suggestion -- at the exact moment of desire. Focus Blocker should ask after a completed session (peak satisfaction) or when hitting the session limit (peak frustration).

6. **The weekly email is underrated.** Grammarly's weekly report drives re-engagement and upsell simultaneously. A "Weekly Focus Report" email with 1-2 locked metrics is low-effort, high-impact.

7. **Annual pricing with monthly anchor.** Grammarly shows $30/mo next to $12/mo (annual) to make annual feel like a deal. Focus Blocker: $3.99/mo or $29.99/yr ($2.50/mo effective, "save 37%").

---

## Sources

- [ExtensionRadar: How to Monetize Chrome Extension in 2025](https://www.extensionradar.com/blog/how-to-monetize-chrome-extension)
- [AverageDevs: Monetize Chrome Extensions 2025](https://www.averagedevs.com/blog/monetize-chrome-extensions-2025)
- [Wappalyzer Pricing](https://www.wappalyzer.com/pricing/)
- [Wappalyzer Pricing 2025 - Capterra](https://www.capterra.com/p/211615/Wappalyzer/pricing/)
- [ColorZilla for Chrome](https://www.colorzilla.com/chrome/)
- [WhatFont Tool](https://whatfonttool.com/)
- [Postman Interceptor](https://www.postman.com/product/postman-interceptor/)
- [Chrome Lighthouse Overview](https://developer.chrome.com/docs/lighthouse/overview/)
- [Dark Reader v5 Subscription Model](https://www.turnoffthelights.com/support/browser-extension/dark-reader-v5-subscription/)
- [Dark Reader Open Collective](https://opencollective.com/darkreader)
- [Dark Reader GitHub Discussion #9297](https://github.com/darkreader/darkreader/discussions/9297)
- [uBlock Origin](https://ublockorigin.com/)
- [uBlock Origin - Wikipedia](https://en.wikipedia.org/wiki/UBlock_Origin)
- [Grammarly Product-Led Growth Deconstructed](https://www.productgrowth.blog/p/grammarlys-product-led-growth-deconstructing)
- [Grammarly Growth to $13B Valuation](https://www.thezerotoone.co/p/grammarly-growth-helping-you-communicate)
- [Grammarly Business Model Analysis](https://businessmodelanalyst.com/grammarly-business-model/)
- [How Grammarly Makes Money - FourWeekMBA](https://fourweekmba.com/how-does-grammarly-make-money/)
- [How Grammarly Grew to 6.9M Daily Users - Product Habits](https://producthabits.com/how-grammarly-quietly-grew-its-way-to-7-million-daily-users/)
- [Grammarly Free vs Pro 2026 - DemandSage](https://www.demandsage.com/grammarly-free-vs-premium/)
- [Grammarly Browser Extension User Guide](https://support.grammarly.com/hc/en-us/articles/115000091592-Grammarly-s-browser-extension-user-guide)
- [Grammarly Free Chrome Extension Revenue Story - YourStory](https://yourstory.com/2024/08/grammarly-free-chrome-extension-revenue-growth-story)
- [Freemium Conversion Rate Guide - UserPilot](https://userpilot.com/blog/freemium-conversion-rate/)
- [Feature Gating Strategies for SaaS - Demogo](https://demogo.com/2025/06/25/feature-gating-strategies-for-your-saas-freemium-model-to-boost-conversions/)
- [Mastering Freemium Paywalls - Monetizely](https://www.getmonetizely.com/articles/mastering-freemium-paywalls-strategic-timing-for-saas-success)
- [Canva Pro Conversion Strategy - Monetizely](https://www.getmonetizely.com/articles/how-did-canva-pro-convert-millions-of-free-users-to-paying-customers)
- [Free-to-Paid Conversion Playbook](https://fertrueba.substack.com/p/the-free-to-paid-conversion-playbook)
- [Freemium Conversion Rates - Lenny's Newsletter](https://www.lennysnewsletter.com/p/what-is-a-good-free-to-paid-conversion)
- [LastPass Free vs Premium](https://www.lastpass.com/pricing/lastpass-premium-vs-free)
- [Momentum Plus Features](https://momentumdash.com/plus)
- [How Honey Makes Money - Finty](https://finty.com/us/business-models/honey/)
- [Loom Pricing 2025](https://www.arcade.software/post/loom-pricing)
- [ExtensionPay: Monetize Chrome Extensions](https://extensionpay.com/)
- [8 Chrome Extensions with Impressive Revenue](https://extensionpay.com/articles/browser-extensions-make-money)
