# Research 04: Freemium Pricing & Monetization Strategy

## Focus Mode - Website Blocker Chrome Extension

**Date:** 2026-02-10
**Purpose:** Define the freemium architecture, paywall mechanics, pricing strategy, and revenue projections for a productivity-focused Chrome extension that combines website blocking, Pomodoro timer, and productivity analytics.

---

## Table of Contents

1. [Freemium Pattern Analysis](#1-freemium-pattern-analysis)
2. [Recommended Feature Tiers](#2-recommended-feature-tiers)
3. [Paywall Trigger Recommendations](#3-paywall-trigger-recommendations)
4. [Pricing Strategy](#4-pricing-strategy)
5. [Revenue Projections](#5-revenue-projections)
6. [What Never to Paywall](#6-what-never-to-paywall)
7. [What Always to Paywall](#7-what-always-to-paywall)
8. [Sources](#8-sources)

---

## 1. Freemium Pattern Analysis

### Market Context

The app blocker market is valued at USD 2.37 billion (2024) and is projected to reach USD 7.02 billion by 2033 at a 12.8% CAGR. Productivity apps represent 55.5% of the Chrome extension market share (~62,127 extensions). Extensions using a freemium model achieve **5-7x more installations** than purely premium extensions, making freemium the dominant and most proven monetization path.

### Reusable Paywall Patterns from Successful Products

| # | Pattern Name | How It Works | Who Uses It | Applied to Focus Mode Blocker |
|---|-------------|--------------|-------------|-------------------------------|
| 1 | **Gift Before Gate** | Deliver substantial free value first so users experience the product's core benefit before ever seeing a paywall. Gate advanced/power-user features only. | Grammarly (free spelling/grammar, paid tone/plagiarism), Canva (free designs, paid templates/brand kit) | Free: full website blocking for up to 6 sites + basic Pomodoro timer. Users experience the core "focus session" value immediately. Pro gates are encountered only after habits form. |
| 2 | **Quantity Limit** | Free tier caps a countable resource (tasks, sites, projects). Users hit the wall naturally as they invest more in the product. | Todoist (5 active projects free, unlimited paid), BlockSite (3-6 blocked sites free, unlimited paid) | Free: Block up to **6 websites**. Pro: Unlimited blocklist. Users who need to block 7+ sites have already proven the product is essential to their workflow. |
| 3 | **Device/Platform Limit** | Free on one device type; paying unlocks cross-device sync and multi-platform access. | LastPass (one device type free, multi-device paid), Freedom ($3.33/mo for cross-device blocking) | Free: Chrome extension only, single browser. Pro: Sync blocklists and stats across Chrome profiles, Edge, Firefox, and (future) mobile companion app. |
| 4 | **History/Data Limit** | Free users see recent data only. Power users who want long-term trends must pay to unlock full history. | RescueTime (2 weeks free, full history paid), Todoist (7-day activity history free) | Free: Last **7 days** of productivity stats. Pro: Full historical data with weekly/monthly/yearly trend reports, exportable CSV. |
| 5 | **Feature Depth Limit** | Basic version of a feature is free; the advanced, richer version is paid. Not a hard gate, but a quality gate. | RescueTime (basic time tracking free, detailed per-page tracking paid), Grammarly (basic grammar free, advanced style/tone paid) | Free: Simple pie chart showing blocked vs. productive time. Pro: Detailed analytics dashboard with per-site breakdowns, productivity scoring, heatmaps, and focus streak tracking. |
| 6 | **Usage Frequency Limit** | Allow a limited number of uses per time period. Users who want more must upgrade. | Todoist (10 Ramble sessions/month free), many AI tools (X queries/day free) | Free: **3 focus sessions per day**. Pro: Unlimited daily sessions. Power users doing 4+ Pomodoro blocks/day hit this naturally. |
| 7 | **Scheduling/Automation Limit** | Manual actions are free; automated scheduling and recurring rules are paid. | BlockSite (basic schedule free, advanced scheduling paid), Cold Turkey (complex schedules in Pro) | Free: Start/stop blocking manually, one simple daily schedule. Pro: Multiple schedules (workday, evening study, weekend), auto-start on browser open, calendar integration. |
| 8 | **Customization Limit** | Default experience is free; personalization and customization are paid. | Forest (basic trees free, premium tree species paid), many themes/skins models | Free: Default block page ("Get back to work!"). Pro: Custom block page messages, motivational quotes rotation, custom themes, branded block pages for teams. |
| 9 | **Social/Team Limit** | Individual use is free; collaboration, sharing, and team features are paid. | Todoist (personal free, team workspaces paid), RescueTime ($6/user/mo for teams) | Free: Solo use only. Pro: Share blocklists with accountability partners, team leaderboards, manager dashboards for team productivity. |
| 10 | **AI/Intelligence Limit** | Basic rule-based features are free; AI-powered smart features are paid. | Grammarly (AI writing suggestions in Premium), many modern SaaS tools | Free: Manual site blocking only. Pro: AI-powered "Smart Block" that detects and suggests distracting sites based on browsing patterns, AI focus coach with personalized recommendations. |
| 11 | **Export/Integration Limit** | Data lives inside the free product. Exporting or integrating with other tools requires payment. | Many analytics and productivity tools | Free: View stats in-extension only. Pro: Export to CSV, Google Sheets integration, Notion integration, webhook support for Zapier/Make. |
| 12 | **Support/SLA Limit** | Free users get community support. Paid users get priority support and onboarding. | Nearly all SaaS products | Free: Community forum, self-serve docs. Pro: Priority email support, onboarding call for teams. |
| 13 | **Time-Delayed Feature Unlock** | New premium features are available to paid users immediately; free users get them after a delay (or never). | Music streaming (new releases), some dev tools | Free: Core features only. Pro: Early access to new features (e.g., AI coach, calendar sync) weeks before they roll out to free tier (if ever). |
| 14 | **Bypass Protection Limit** | Basic blocking is free and easily overridden. Strict, unbypassable "lockdown mode" is paid. | Cold Turkey ($39 one-time for strict mode), Freedom (strict mode in paid) | Free: Standard blocking (can be bypassed by disabling extension). Pro: "Lockdown Mode" -- cannot disable blocking during active sessions, password-protected settings, nuclear option. |

### Key Insight: The Compound Gate

The most successful freemium products do not rely on a single gate. They use **3-4 complementary patterns** so that different user personas hit different walls at different times. For Focus Mode Blocker, the recommended compound gate is:

1. **Quantity Limit** (6 blocked sites) -- catches the broadest set of growing users
2. **Usage Frequency Limit** (3 sessions/day) -- catches power users and daily-habit builders
3. **Data/History Limit** (7 days of stats) -- catches analytics-minded users who want to track progress
4. **Bypass Protection** (lockdown mode) -- catches users with serious distraction problems willing to pay for enforcement

---

## 2. Recommended Feature Tiers

### Pricing: Free / Pro at $3.99/mo (or $29.99/yr)

| Feature Category | Feature | Free Tier | Pro Tier ($3.99/mo) | Rationale |
|-----------------|---------|-----------|---------------------|-----------|
| **Core Blocking** | Block specific websites | Up to 6 sites | Unlimited sites | Quantity limit pattern. 6 is generous enough to prove value (block the big 6: Facebook, Twitter/X, YouTube, Reddit, Instagram, TikTok) but power users need more. |
| **Core Blocking** | Block by keyword | Not available | Block any URL containing keywords | Clear upgrade path for users who discover new distractions daily. |
| **Core Blocking** | Block by category | Not available | One-click block entire categories (Social Media, News, Shopping, Gaming, Entertainment, Adult) | High-value convenience feature. |
| **Core Blocking** | Custom block page | Default "Stay Focused!" page | Custom messages, motivational quotes, images, redirect to productive URL | Customization limit pattern. Personal touch drives engagement. |
| **Core Blocking** | Allowlist (exceptions) | Up to 3 allowed sub-URLs within blocked domains | Unlimited allowlist rules | Example: Block reddit.com but allow reddit.com/r/programming. |
| **Pomodoro Timer** | Basic Pomodoro | 25/5 default timer | Fully customizable intervals (any duration) | Free timer is fully functional. Custom intervals are a "nice to have" that power users want. |
| **Pomodoro Timer** | Daily sessions | 3 sessions/day | Unlimited | Usage frequency limit. 3 sessions = ~90 min focused work, enough for casual users. Serious users need 6-8+. |
| **Pomodoro Timer** | Long Focus mode | Not available | Extended sessions up to 4 hours with no forced breaks | For deep work practitioners who find 25-min blocks too short. |
| **Pomodoro Timer** | Break activities | Not available | Guided breathing, stretch prompts, curated break content | Value-add that differentiates from basic timers. |
| **Scheduling** | Basic schedule | 1 daily schedule (e.g., block 9am-5pm weekdays) | Multiple schedules (morning, afternoon, evening, weekends) | Scheduling limit pattern. One schedule covers most people; multiple schedules serve complex workflows. |
| **Scheduling** | Auto-start sessions | Not available | Auto-start blocking when Chrome opens, on a schedule, or via calendar sync | Automation limit pattern. Reduces friction for daily users. |
| **Scheduling** | Google Calendar integration | Not available | Sync with calendar events to auto-block during "Focus Time" blocks | High-value integration for professionals. |
| **Stats & Analytics** | Basic stats | Today's focus time, sessions completed, sites blocked (7-day history) | Full historical data, trends, heatmaps, per-site breakdowns, productivity score | History limit + feature depth limit. Free stats answer "How did I do today?" Pro stats answer "How am I improving over time?" |
| **Stats & Analytics** | Focus streaks | Current streak shown | Full streak history, longest streak, streak recovery, milestone badges | Gamification drives retention in Pro. |
| **Stats & Analytics** | Weekly email report | Not available | Automated weekly summary email with insights and trends | Keeps Pro users engaged even when they forget to check stats. |
| **Stats & Analytics** | Data export | Not available | CSV export, Google Sheets sync | Export limit pattern. |
| **Smart Features** | AI Smart Block suggestions | Not available | AI analyzes browsing patterns and suggests new sites to block | AI/intelligence limit pattern. Premium differentiator. |
| **Smart Features** | AI Focus Coach | Not available | Personalized tips based on your blocking and focus patterns | AI-powered insights that justify the subscription. |
| **Enforcement** | Standard blocking | Blocks page, shows block screen | Same | Both tiers get standard blocking. |
| **Enforcement** | Lockdown Mode | Not available | Cannot disable extension during active sessions. Password-protected. Optional "nuclear option" (can't unblock for X hours, no override). | Bypass protection limit. Highest-intent users who struggle with self-control. This is the #1 feature competitors charge for. |
| **Enforcement** | Pause protection | Can pause blocking anytime | Configurable pause rules: limit pauses per day, require waiting period, or disable pause entirely | Friction-as-a-feature for serious users. |
| **Social/Team** | Accountability partner | Not available | Share your focus stats with a partner, mutual blocklist sharing | Social limit pattern. Accountability is a proven behavior-change mechanic. |
| **Social/Team** | Team plan (future) | Not available | Team dashboard, shared blocklists, admin controls, per-user stats | Future upsell to $6/user/mo for teams. |
| **UX/Convenience** | Browser profiles | 1 Chrome profile | Sync across multiple Chrome profiles | Device limit pattern. |
| **UX/Convenience** | Cross-browser sync | Not available | Sync settings to Firefox, Edge (when available) | Device limit pattern. |
| **UX/Convenience** | Keyboard shortcuts | Default shortcut to start/stop | Customizable shortcuts | Small but appreciated power-user feature. |
| **Support** | Support channel | Self-serve docs, community | Priority email support, feature request voting | Support limit pattern. |

---

## 3. Paywall Trigger Recommendations

### Trigger Design Principles

Research shows that paywalls shown **after users experience value** convert 30% better than those shown prematurely. Users who understand the product before hitting a gate are more likely to view the upgrade as "unlocking more of something they love" rather than "being blocked from something they need."

---

### PRIMARY TRIGGER: Blocklist Limit Reached (Expected highest conversion volume)

**The Exact Moment:**
User attempts to add a 7th website to their blocklist.

**Why This Works:**
- This is an "investment moment" -- the user is actively customizing and deepening their use of the product
- By the time they need 7+ sites, they have already experienced multiple successful focus sessions
- They have already built the habit; switching costs are now real
- This mimics BlockSite's proven model and Todoist's project limit approach

**UI Treatment:**
```
+--------------------------------------------------+
|  [lock icon]  You've reached the free limit       |
|                                                   |
|  You're blocking 6 sites -- that's great focus!   |
|  Upgrade to Pro to block unlimited sites, plus    |
|  unlock category blocking to block entire groups  |
|  with one click.                                  |
|                                                   |
|  [Upgrade to Pro - $3.99/mo]    [Maybe Later]     |
|                                                   |
|  "I used to waste 3 hours/day on social media.    |
|   Now I get that time back." -- Sarah K.          |
+--------------------------------------------------+
```

**Copy Strategy:**
- Lead with validation ("You're blocking 6 sites -- that's great focus!")
- Show what they gain, not what they lack
- Include social proof (testimonial)
- Always provide a "Maybe Later" escape -- never trap users
- Show the price transparently

---

### SECONDARY TRIGGER: 4th Daily Session Attempted (Expected second-highest conversion)

**The Exact Moment:**
User clicks "Start Focus Session" for the 4th time in a single day.

**Why This Works:**
- This user is a power user who is deeply engaged
- They have already completed 3 successful sessions (~75+ minutes of focused work)
- The product has already proven its value multiple times today
- This is the moment of highest motivation -- they want to keep going

**UI Treatment:**
```
+--------------------------------------------------+
|  [flame icon]  You're on fire today!              |
|                                                   |
|  3 focus sessions completed today -- you're in    |
|  the top 10% of Focus Mode users!                 |
|                                                   |
|  Unlock unlimited daily sessions with Pro and     |
|  never hit a limit on your productivity.          |
|                                                   |
|  [Go Unlimited - $3.99/mo]      [Done for Today]  |
|                                                   |
|  Annual plan: just $2.50/mo (save 37%)            |
+--------------------------------------------------+
```

**Copy Strategy:**
- Celebrate their achievement first ("You're on fire!")
- Use social comparison ("top 10% of users")
- Frame the limit as "don't cap your productivity" not "you've been blocked"
- Surface the annual plan discount at this high-intent moment

---

### TERTIARY TRIGGER: 7-Day Stats Boundary Hit (Expected steady conversion from analytics users)

**The Exact Moment:**
User views their stats dashboard and scrolls/clicks to see data older than 7 days, or when the 7-day chart shows a "See Full History" teaser.

**Why This Works:**
- Users checking stats are already invested in tracking their progress
- Curiosity about their own historical data is a powerful motivator
- This targets a different persona (the "quantified self" type) than the blocklist trigger
- The data already exists -- they just cannot see it. This feels like unlocking, not purchasing.

**UI Treatment:**
```
+--------------------------------------------------+
|  Your Focus Stats                    [7 Days v]   |
|                                                   |
|  [===== chart showing 7 days of data =====]      |
|                                                   |
|  |  [blurred area] Your full history              |
|  |  See your trends over weeks and months.        |
|  |  Track your longest streaks. Export data.      |
|  |                                                |
|  |  [Unlock Full Stats - Try Pro]                 |
|  |                                                |
+--------------------------------------------------+
```

**Copy Strategy:**
- Show a blurred/teased preview of what the full data looks like
- Emphasize "your data" -- it belongs to them, they just need to unlock access
- Keep the paywall inline (not a modal popup) so it feels natural, not intrusive

---

### BONUS TRIGGER: Lockdown Mode Discovery (High intent, high conversion rate)

**The Exact Moment:**
User discovers Lockdown Mode in settings (either through browsing settings or after failing a focus session by disabling the extension).

**Why This Works:**
- Users seeking Lockdown Mode have a **specific pain point** (they keep cheating/disabling blocking)
- This is a self-selected, high-intent audience
- Cold Turkey charges $39 one-time for this exact feature
- Conversion rate on this trigger is expected to be 2-3x higher than average

**UI Treatment:**
```
+--------------------------------------------------+
|  [shield icon]  Lockdown Mode                     |
|                                                   |
|  Can't stop disabling the blocker? You're not     |
|  alone. Lockdown Mode makes it impossible to      |
|  bypass blocking during active sessions.          |
|                                                   |
|  - Cannot disable extension during sessions       |
|  - Password-protected settings                    |
|  - "Nuclear option": no override for X hours      |
|                                                   |
|  [Enable Lockdown Mode - Upgrade to Pro]          |
|                                                   |
|  "This is the feature that finally made           |
|   blocking actually work for me." -- James T.     |
+--------------------------------------------------+
```

**Copy Strategy:**
- Empathize with the struggle ("You're not alone")
- Position as the solution to a specific, felt problem
- Testimonial from someone who had the same struggle

---

### Paywall Frequency Rules

To avoid paywall fatigue:
- **Maximum 1 paywall impression per session** (a session = opening Chrome to closing Chrome)
- **Maximum 3 paywall impressions per week** across all trigger types
- **7-day cooldown after dismissal** before showing the same trigger type again
- **Never show paywall during an active focus session** -- this would destroy trust
- **Track and rotate triggers** -- if a user dismisses the blocklist trigger 3 times, switch to showing the stats trigger instead

---

## 4. Pricing Strategy

### Recommended Price Point: $3.99/month or $29.99/year

#### Monthly vs. Annual Pricing

| Plan | Price | Effective Monthly | Savings | Target User |
|------|-------|-------------------|---------|-------------|
| Monthly | $3.99/mo | $3.99 | -- | Users who want to try before committing. Low barrier. |
| Annual | $29.99/yr | $2.50/mo | 37% off | Users who have validated value and want to commit. Default recommended option. |
| Lifetime (limited) | $79.99 one-time | -- | -- | Launch promotion only. Creates urgency. Cap at first 500 buyers. |

#### Price Justification

**Competitive Landscape:**

| Competitor | Price | Model | Notes |
|-----------|-------|-------|-------|
| BlockSite Premium | $5.42/mo (from $3.99/mo annual) | Subscription | 6 free sites, unlimited paid. Our primary comparable. |
| Freedom | $8.99/mo ($3.33/mo annual) | Subscription | Cross-device blocking. Higher price, broader feature set. |
| Cold Turkey Pro | $39 one-time | Lifetime | Desktop app, strict blocking. No recurring revenue. |
| RescueTime Premium | $12/mo ($6.50/mo annual) | Subscription | Time tracking + blocking. Higher price, different category. |
| Forest Pro | $3.99 one-time (iOS) | One-time | Gamified timer only. No blocking. |
| Serene | $4/mo | Subscription | Day planner + blocker. Similar price range. |

**Positioning:**
- At $3.99/mo, Focus Mode is **27% cheaper than BlockSite** ($5.42/mo) while offering more features (Pomodoro, stats, AI)
- At $29.99/yr ($2.50/mo effective), it is **significantly cheaper than Freedom** ($3.33/mo annual) and **RescueTime** ($6.50/mo annual)
- The price is in the **productivity extension sweet spot** of $3-5/mo identified by market research
- It undercuts the primary competitor (BlockSite) while offering a broader feature set

**The Psychology of $3.99:**
- Below the $5 "impulse threshold" -- users do not need to deliberate
- The price of a single fancy coffee -- easy to justify ("costs less than one latte/month")
- Low enough that annual churn is reduced (users do not bother canceling a $4/mo charge)
- High enough to generate meaningful revenue at scale

#### The ROI Argument (For the Sales/Landing Page)

```
THE MATH OF FOCUS

The average knowledge worker loses 2.1 hours/day to digital distractions.
That's 10.5 hours/week. 546 hours/year.

At $40/hour, that's $21,840/year in lost productivity.

Focus Mode Pro costs $29.99/year.

Even if it saves you just 15 minutes per day:
- 91 hours saved per year
- $3,640 in recovered productivity
- 121x return on investment

The question isn't whether you can afford Focus Mode Pro.
It's whether you can afford not to use it.
```

**Key talking points for the sales page:**
1. **Time saved:** "Users report saving an average of 1.5 hours per day" (track and publish actual data)
2. **Habit formed:** "87% of Pro users maintain a daily focus habit after 30 days" (track and publish)
3. **Cost comparison:** "Less than a cup of coffee per month"
4. **Risk-free:** "7-day free trial of Pro. Cancel anytime."

---

## 5. Revenue Projections

### Key Assumptions

| Assumption | Conservative | Optimistic | Source/Basis |
|-----------|-------------|-----------|--------------|
| Chrome Web Store installs (Year 1) | 25,000 | 100,000 | Based on similar new extensions with basic ASO and some content marketing |
| Monthly active users (% of installs) | 30% (7,500 MAU) | 40% (40,000 MAU) | Industry average: 20-40% of installs become MAU |
| Free-to-paid conversion rate | 2% | 5% | Industry average for Chrome extensions: 1-5%. Good freemium products: 2-5% |
| Monthly plan vs. annual split | 40% monthly / 60% annual | 30% monthly / 70% annual | Annual becomes dominant as trust builds |
| Monthly churn (paid users) | 8% | 5% | Industry average for low-price subscriptions: 5-10% |
| Annual churn (paid users) | 40% (at renewal) | 25% (at renewal) | Annual retention is typically better |
| Average revenue per paying user (ARPU/mo) | $3.20 (blended) | $3.00 (blended, more annual) | Blend of $3.99 monthly and $2.50/mo annual |

### Conservative Model (Year 1)

```
Total Installs:                    25,000
Monthly Active Users (30%):         7,500
Paid Conversions (2%):                150 paying users (by end of Year 1)

Revenue Build-Up (gradual ramp):
- Months 1-3:    ~20 paid users avg    ->  $192/mo   ->    $576
- Months 4-6:    ~60 paid users avg    ->  $576/mo   ->  $1,728
- Months 7-9:   ~100 paid users avg    ->  $960/mo   ->  $2,880
- Months 10-12: ~140 paid users avg    -> $1,344/mo  ->  $4,032

Year 1 Total Revenue (Conservative):              ~$9,200
Year 1 Monthly Revenue Run Rate (Month 12):       ~$1,400/mo
Year 1 ARR (annualized from Month 12):            ~$16,800
```

### Optimistic Model (Year 1)

```
Total Installs:                   100,000
Monthly Active Users (40%):        40,000
Paid Conversions (5%):              2,000 paying users (by end of Year 1)

Revenue Build-Up (gradual ramp):
- Months 1-3:    ~200 paid users avg   ->  $1,800/mo  ->   $5,400
- Months 4-6:    ~700 paid users avg   ->  $6,300/mo  ->  $18,900
- Months 7-9:  ~1,300 paid users avg   -> $11,700/mo  ->  $35,100
- Months 10-12: ~1,800 paid users avg  -> $16,200/mo  ->  $48,600

Year 1 Total Revenue (Optimistic):                ~$108,000
Year 1 Monthly Revenue Run Rate (Month 12):       ~$16,200/mo
Year 1 ARR (annualized from Month 12):            ~$194,400
```

### The Path to $1,000 MRR (Key Milestone)

| Scenario | Paying Users Needed | MAU Needed (at 2-5%) | Installs Needed | Estimated Timeline |
|----------|-------------------|---------------------|-----------------|-------------------|
| Conservative (2% conv, $3.20 ARPU) | 313 | 15,650 | 52,167 | Month 10-14 |
| Optimistic (5% conv, $3.00 ARPU) | 334 | 6,680 | 16,700 | Month 4-6 |

### Revenue Optimization Levers

1. **Improve conversion rate** (biggest lever): A/B test paywall copy, timing, and triggers. Going from 2% to 3% increases revenue by 50%.
2. **Increase installs** via Chrome Web Store ASO, content marketing ("how to focus" blog posts), Product Hunt launch, Reddit/Twitter organic.
3. **Reduce churn** by building habit-forming features (streaks, daily reminders, progress emails).
4. **Increase ARPU** by pushing annual plans (higher LTV) and introducing a future Team plan at $6/user/mo.
5. **Lifetime deal (launch only):** Sell 500 lifetime licenses at $79.99 = $40,000 upfront to fund development. Then discontinue the lifetime option.

---

## 6. What NEVER to Paywall (Kills Retention)

These features must remain free forever. Paywalling any of them will cripple the core value loop and destroy retention:

| Feature | Why It Must Be Free |
|---------|-------------------|
| **Basic website blocking (up to 6 sites)** | This IS the product. If users cannot block at least a handful of sites for free, they will never experience value and will uninstall within hours. 6 sites covers the major social platforms. |
| **Basic Pomodoro timer (25/5 default)** | The timer is a core engagement driver. Users who start a timer feel committed to the session. Removing it removes the behavioral hook. |
| **Starting a focus session** | The act of starting a session must always be free and frictionless. Never put a paywall between the user and the "Start Focus" button for their first 3 daily sessions. |
| **Today's basic stats** | Users need to see their daily progress to feel accomplishment. "You focused for 2 hours today" is a dopamine hit that drives next-day retention. |
| **The ability to stop/pause blocking** | Free users must always be able to regain control of their browser. If they feel trapped, they will uninstall the extension entirely. (Pro users can opt into stricter enforcement voluntarily.) |
| **Extension installation and onboarding** | The first 5 minutes must be seamless and completely free. Never show a paywall before the user has completed their first focus session. |
| **Notifications and reminders** | Basic "time to focus" reminders keep users coming back. These are retention drivers, not monetization candidates. |
| **The block page itself** | When a blocked site is visited, the block page must appear instantly and reliably for all users. A broken or paywalled block page = immediate uninstall. |
| **Dark mode / basic UI themes** | Accessibility and basic personalization should never be paywalled. Users will view this as petty and punitive. |
| **Bug fixes and security updates** | Free users must always receive a stable, secure product. |

### The Golden Rule

> **If removing it from the free tier would cause a user to uninstall the extension, it must stay free.**

Free users are your growth engine. They write reviews, tell friends, and eventually convert. A healthy free tier is an investment in your paid tier.

---

## 7. What ALWAYS to Paywall (Drives Upgrades)

These features should be Pro-only from day one. They represent clear, demonstrable value that justifies the subscription:

| Feature | Why It Should Be Pro-Only | Expected Conversion Impact |
|---------|--------------------------|---------------------------|
| **Unlimited blocked sites** | This is the #1 natural upgrade trigger. Users who need more than 6 sites have validated the product and have a specific, felt need. This follows the proven BlockSite/Todoist quantity-limit model. | **HIGH** -- Expected primary conversion driver (~40% of upgrades) |
| **Unlimited daily focus sessions** | Power users who do 4+ sessions/day are your most engaged segment. They will pay because the alternative (waiting until tomorrow) is unacceptable to someone in a flow state. | **HIGH** -- Expected secondary driver (~20% of upgrades) |
| **Lockdown Mode (unbypassable blocking)** | Users seeking this have a specific pain point (self-control issues). They are highly motivated and willing to pay for a solution. Cold Turkey proves this market exists at $39. | **HIGH** -- Highest per-trigger conversion rate (~15% of upgrades) |
| **Full historical stats & analytics** | The "quantified self" persona will pay to see their data over weeks and months. Data they generated but cannot access creates a strong "unlock" desire. | **MEDIUM** -- Steady, ongoing driver (~10% of upgrades) |
| **AI Smart Block suggestions** | AI features are premium-positioned across the industry. Users perceive AI as high-value and expect to pay for it. Also expensive to run (API costs), so it should generate revenue. | **MEDIUM** -- Differentiator and modern appeal (~5% of upgrades) |
| **Multiple schedules & auto-start** | Automation saves time and reduces daily friction. Users with complex workflows (different schedules for different days) will pay for this convenience. | **MEDIUM** -- Appeals to workflow optimizers (~5% of upgrades) |
| **Category blocking (one-click)** | Blocking entire categories (all social media, all news) is a major convenience feature. It also surfaces many more blocked sites without manual entry, increasing perceived value. | **MEDIUM** -- Convenience upgrade (~5% of upgrades) |
| **Weekly email reports** | Keeps Pro users engaged and reminds them of the value they are getting, reducing churn. Also drives re-engagement for lapsed users. | **LOW** (retention feature, not conversion driver) |
| **Data export (CSV, Google Sheets)** | Users who want to export data are power users who are already invested. This is low-effort to build and high-perceived-value. | **LOW** -- Niche but strong signal of engagement |
| **Accountability partner sharing** | Social features create lock-in and reduce churn. If your partner is also using the product, neither of you will cancel. | **LOW** to **MEDIUM** -- Network effects drive long-term value |
| **Custom block page messages** | Personalization that users enjoy but do not need. Pure "delight" feature that adds perceived value to the Pro bundle without being essential. | **LOW** -- Bundle sweetener |
| **Google Calendar integration** | High-value for professionals. Connecting to their calendar signals deep product integration and justifies the subscription as a "productivity system" not just a "blocker." | **MEDIUM** -- Appeals to professional users |
| **Cross-browser / profile sync** | Once a user is on multiple browsers/profiles, they are deeply embedded. Sync is both a conversion driver and a retention mechanism. | **LOW** to **MEDIUM** -- Niche but strong retention |

### The Upgrade Funnel Summary

```
Free User Journey:
  Install -> First session (free) -> Second session (free) -> Habit forms
       |
       v
  Hits 6-site limit -----> PAYWALL #1 (40% of conversions)
       |
       v
  Hits 3-session/day limit -> PAYWALL #2 (20% of conversions)
       |
       v
  Wants historical stats --> PAYWALL #3 (10% of conversions)
       |
       v
  Discovers Lockdown Mode -> PAYWALL #4 (15% of conversions)
       |
       v
  Other Pro features -----> PAYWALL #5 (15% of conversions)
```

---

## 8. Sources

### Market Data & Industry Research
- [Business of Apps - Productivity App Revenue and Usage Statistics (2026)](https://www.businessofapps.com/data/productivity-app-market/)
- [Growth Market Reports - App Blocker Market Research Report 2033](https://growthmarketreports.com/report/app-blocker-market)
- [Business Research Insights - Productivity Apps Market Size 2025-2035](https://www.businessresearchinsights.com/market-reports/productivity-apps-market-117791)
- [About Chromebooks - Google Chrome Extension Ecosystem in 2025](https://www.aboutchromebooks.com/chrome-extension-ecosystem/)

### Chrome Extension Monetization
- [ExtensionFast - The Freemium Model for Chrome Extensions: How to Monetize Smartly](https://www.extensionfast.com/blog/the-freemium-model-for-chrome-extensions-how-to-monetize-smartly)
- [ExtensionFast - How to Get to $1,000 MRR with Your Chrome Extension](https://www.extensionfast.com/blog/how-to-get-to-1000-mrr-with-your-chrome-extension)
- [Extension Radar - How to Monetize Your Chrome Extension in 2025](https://www.extensionradar.com/blog/how-to-monetize-chrome-extension)
- [Monetizely - Browser Extension Monetization: Strategic Pricing for Utility Tools](https://www.getmonetizely.com/articles/browser-extension-monetization-strategic-pricing-for-utility-tools)
- [Creole Studios - How to Monetize Your Chrome Extension](https://www.creolestudios.com/monetization-tips-for-chrome-extensions/)

### Competitor Pricing & Models
- [BlockSite - TechRadar Review](https://www.techradar.com/reviews/blocksite)
- [Cold Turkey - Official Site](https://getcoldturkey.com/)
- [Freedom - Before Five Comparison](https://www.beforefive.app/blog/website-blocker)
- [RescueTime - Pricing Page](https://www.rescuetime.com/pricing)
- [RescueTime - Free vs Premium Differences](https://help.rescuetime.com/article/81-what-are-the-differences-between-premium-and-lite-accounts)
- [LastPass - Free vs Premium Comparison](https://www.lastpass.com/pricing/lastpass-premium-vs-free)
- [Deep Work Zone - Best Website Blocker Chrome Extensions](https://deepworkz.one/learn/best-website-blocker-chrome-extensions-in-2025-(free-paid))
- [TechCrunch - Best Distraction Blockers](https://techcrunch.com/2025/12/25/the-best-distraction-blockers-to-jumpstart-your-focus-in-the-new-year/)

### Freemium Strategy & Paywall Best Practices
- [Grammarly - How a Free Chrome Extension Built a $13B Company (YourStory)](https://yourstory.com/2024/08/grammarly-free-chrome-extension-revenue-growth-story)
- [Product Habits - How Grammarly Quietly Grew to 6.9 Million Daily Users](https://producthabits.com/how-grammarly-quietly-grew-its-way-to-7-million-daily-users/)
- [Monetizely - Mastering Freemium Paywalls: Strategic Timing for SaaS](https://www.getmonetizely.com/articles/mastering-freemium-paywalls-strategic-timing-for-saas-success)
- [Appcues - How Freemium SaaS Products Convert Users with Upgrade Prompts](https://www.appcues.com/blog/best-freemium-upgrade-prompts)
- [Userpilot - The Ultimate Guide to Improving Freemium Conversion Rate](https://userpilot.com/blog/freemium-conversion-rate/)
- [Stripe - Freemium Pricing Strategy Explained](https://stripe.com/resources/more/freemium-pricing-explained)
- [RevenueCat - Hard Paywall vs Soft Paywall](https://www.revenuecat.com/blog/growth/hard-paywall-vs-soft-paywall/)
- [Sankalp Jonna - Finding the Right Point in Your UX to Trigger a Paywall](https://www.sankalpjonna.com/posts/finding-the-right-point-in-your-ux-to-trigger-a-paywall)

---

*This research document was compiled on 2026-02-10 to inform the monetization strategy for the Focus Mode - Website Blocker Chrome extension. All pricing and market data should be periodically re-validated as the competitive landscape evolves.*
