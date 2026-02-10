# Focus Mode - Blocker: Extension Specification

## SECTION 1: Product Overview | SECTION 2: Feature Specification

> **Document Version:** 1.0
> **Date:** 2026-02-10
> **Status:** Approved for Development
> **Depends On:** `docs/01-competitive-intel-report.md` (Phase 01 output)

---

# SECTION 1: PRODUCT OVERVIEW

---

## 1.1 Extension Identity

### Name & Branding

| Field | Value |
|-------|-------|
| **Extension Name** | Focus Mode - Blocker |
| **Tagline** | Block distractions. Build focus. Track your streak. |
| **Chrome Web Store Category** | Productivity |
| **Secondary Category Tags** | Website Blocker, Focus Timer, Pomodoro, Distraction Blocker |
| **Extension Icon Style** | Modern, minimal -- a shield with a focus crosshair, in a calm blue-to-teal gradient. Conveys protection without aggression. |
| **Brand Tone** | Encouraging coach, not drill sergeant. Calm, motivational, data-driven. Never shame-based. |

### Target Users

#### Primary Persona: "Alex" -- The Overwhelmed Knowledge Worker

| Attribute | Details |
|-----------|---------|
| **Demographics** | Age 28-45, remote or hybrid worker, $50,000-$130,000 salary |
| **Role** | Marketing manager, project manager, product manager, analyst, engineer, or similar knowledge worker |
| **Work Environment** | Remote/hybrid, 40-50 hrs/week, Chrome is primary work browser, 2+ monitors, Slack/Teams open all day |
| **Core Problem** | Opens Twitter/Reddit/YouTube "for 2 minutes" that becomes 30-45 minutes. Happens 5-15 times per day. Autopilot navigation -- they do not consciously decide to visit distracting sites. |
| **Current Tools** | Has tried StayFocusd (too easy to disable), BlockSite (paywalled after 3 sites), or nothing. Uses willpower alone and fails. |
| **Emotional State** | Guilt, frustration, feeling "behind." Knows the problem exists but cannot stop the cycle. Tired of tools that punish rather than help. |
| **What They Need** | Quick-start blocking that works in under 30 seconds. Weekly reports proving improvement. Calendar integration to auto-block during focus time. Strong nuclear option for "serious mode." |
| **Willingness to Pay** | $3-5/month without hesitation if the tool demonstrably saves 1+ hour/day. Annual plan preferred for set-and-forget. |
| **Key Quote** | "I don't need another tool I have to fight with. I need something that quietly keeps me on track." |

#### Primary Persona: "Jordan" -- The Struggling Student

| Attribute | Details |
|-----------|---------|
| **Demographics** | Age 18-26, university student, limited budget ($0-50/month discretionary) |
| **Role** | Undergraduate or graduate student, often studying from home, dorm, or library |
| **Work Environment** | Irregular schedule, long cramming sessions, Pomodoro-style studying, laptop is both study tool and entertainment center |
| **Core Problem** | YouTube and TikTok rabbit holes during study sessions. Exam stress amplifies distraction-seeking behavior. Knows how to bypass most blockers (Googles "how to bypass StayFocusd" within 30 minutes of installing). |
| **Current Tools** | Forest on phone (likes gamification), no Chrome blocker that sticks. Has tried 2-3 extensions, abandoned all within a week. |
| **Emotional State** | Anxious about grades, frustrated by inability to focus, wants external structure their discipline cannot provide. |
| **What They Need** | Strong enforcement that resists self-bypass. Pomodoro timer built in. Streaks and gamification for motivation. A free tier that is genuinely useful on a student budget. |
| **Willingness to Pay** | $0 during most of the year. Might pay $1.99-4.99/month during exam season. Will upgrade if free tier creates a habit they cannot afford to lose. |
| **Key Quote** | "I literally Googled 'how to bypass StayFocusd' and found 5 ways in 2 minutes. That tells you everything." |

#### Secondary Persona: "Sam" -- The Neurodivergent Professional

| Attribute | Details |
|-----------|---------|
| **Demographics** | Age 25-45, developer/designer/creative professional, diagnosed or self-identified ADHD |
| **Role** | Software engineer, UX designer, writer, or creative freelancer with ADHD, autism, or related conditions |
| **Work Environment** | Hyperfocus + distraction cycles. Needs structure but resists rigidity. Very tech-savvy -- will inspect extension code and find workarounds. |
| **Core Problem** | Executive dysfunction means traditional blockers feel punishing. Blocking one site leads to substituting another. Shame-based messaging worsens anxiety. Needs multi-layer restriction (nuclear + whitelist + extended duration) to overcome impulse control challenges. |
| **Current Tools** | Combination of Focusmate (body doubling), Freedom ($8.99/month), and phone app blockers. Frustrated by needing 3+ tools that do not talk to each other. |
| **Emotional State** | Understands their brain's dopamine-seeking behavior intellectually. Needs tools designed WITH neurodivergent users, not against them. Rejects "YOU SHOULD BE WORKING" messaging. |
| **What They Need** | Gentle, non-judgmental UX. Whitelist mode (block everything except work tools). 24-hour nuclear option for bad days. Adaptive blocking that learns patterns. One tool replacing their 3-tool stack. |
| **Willingness to Pay** | $5-8/month enthusiastically for a tool specifically designed for their needs. Will evangelize to ADHD communities if the product respects them. |
| **Key Quote** | "Every blocker screams 'YOU SHOULD BE WORKING' at me. My ADHD brain needs a coach, not a drill sergeant." |

#### Secondary Persona: "Morgan" -- The Freelancer / Entrepreneur

| Attribute | Details |
|-----------|---------|
| **Demographics** | Age 30-50, self-employed, billing $50-150/hour |
| **Role** | Freelance developer, consultant, solopreneur, small agency owner |
| **Work Environment** | Self-directed, no boss checking in, billable hours are directly tied to income. Every hour of distraction is measurable lost revenue. |
| **Core Problem** | Calculated that their Reddit/Twitter habit costs $200-600/week in lost billable hours. Needs focus analytics tied to productivity impact. No external accountability structure. |
| **Current Tools** | Toggl for time tracking, RescueTime for monitoring, occasional Cold Turkey. Frustrated by tool fragmentation. |
| **What They Need** | Focus analytics with time-saved calculations. Integration with calendar and task tools. Different blocking profiles for different client projects. Exportable reports. |
| **Willingness to Pay** | $5-10/month without hesitation. At $75+/hour, the ROI argument is trivial. Would pay $10/month for a tool that recovers even 30 minutes/day. |
| **Key Quote** | "I calculated that my Reddit habit costs me $400/week in lost billable hours. I'd pay $20/month for something that actually works." |

---

## 1.2 Problem Statement

### The Pain: Digital Distraction Is an Invisible Productivity Tax

Knowledge workers lose **28% of their working hours** to digital distractions -- equivalent to **11.2 hours per week** or **581 hours per year** (Economist Impact/Dropbox, 2023). At the average US knowledge worker salary of $54.27/hour (Glassdoor, 2025), this translates to:

- **$608 per week** in lost productivity per worker
- **$2,871 per month** per worker
- **$34,448 per year** per worker
- **$391 billion annually** across the US economy

The distraction cycle is not a willpower problem -- it is a neurological one. Users open Reddit, Twitter, YouTube, and TikTok **without conscious intent**. Each interruption requires an average of **23 minutes to fully recover focus** (UC Irvine, Gloria Mark). With the average worker experiencing **15 interruptions per hour**, the compounding productivity loss is devastating.

**80% of employees cannot go 1 hour without a distraction. 59% are distracted every 30 minutes or less** (Insightful Lost Focus Report, 2025).

### Current Alternatives and Their Weaknesses

| Competitor | Users | What They Do Well | Critical Weakness | Our Advantage |
|-----------|-------|-------------------|-------------------|---------------|
| **BlockSite** | 5M+ | Polished UI, large user base, category blocking | Free tier limited to 3-6 sites. Aggressive paywalling generates 1-star reviews. Pop-up ads on free version are themselves distracting. Users report "a blocker that shows ads is ironic." Monthly price of $10.99 is the highest in the category. Some users report subscription cancellation shows "technical issues" and denied lifetime purchases. | 10 free sites (3x more generous). No ads ever. $4.99/month (55% cheaper). Trust-first approach. |
| **StayFocusd** | 600K | 100% free, Nuclear Option is beloved | Breaks after Chrome updates (requires reinstall). Data monetized through Sensor Tower parent company. Dated UI. No analytics beyond basic usage history. Users can bypass Nuclear Option by switching browsers. | Manifest V3 native (no update breakage). Privacy-first (no data leaves device). Modern UI. Rich analytics. |
| **LeechBlock NG** | 100K | Highest-rated (4.9), 30 block sets, open source, deeply customizable | Too complex for non-technical users. Override button makes bypassing trivial. No gamification. No analytics. No onboarding guidance. | 30-second onboarding. Nuclear option is truly unbypassable. Gamification + streaks. Rich analytics. Same privacy ethos. |
| **Freedom** | 200K+ | Cross-platform sync, Locked Mode, strong brand | No free tier (7-day trial only, then $6.99-8.99/month). Requires native app install. Requires account creation. Chrome extension is just a connector. | Forever-free tier. No account required. Pure Chrome extension. $4.99/month (44% cheaper). |
| **Cold Turkey** | 50K+ | "Toughest blocker on the internet," one-time $35 purchase | Desktop app only -- Chrome extension is just a companion. No mobile. No team features. No ongoing updates (one-time payment model). No gamification. | Chrome-native. Subscription funds continuous improvement. Team tier. Gamification + analytics. |
| **Forest** | 900K | Gamification (tree planting), emotional engagement, real trees | Weak actual blocking -- trivially easy to bypass. Chrome extension is free but limited. Advanced features locked to mobile app ($3.99). No nuclear option. No scheduling. | Strong blocking (nuclear option). Full-featured Chrome extension. Combined gamification + enforcement (unoccupied niche). |
| **Deep Work Zone** | 10K+ | Privacy-first, Pomodoro + blocking combo, free | Small user base, limited analytics, no monetization path (sustainability risk). No gamification. No schedules. | Same privacy-first ethos. Richer feature set. Sustainable business model. Gamification + reports. |

### Why Users Will Choose Focus Mode - Blocker

**1. The "Honest Freemium" Position**
We are the only extension that offers 10 free blocked sites (vs. BlockSite's 3 and Intentional's 3), a full Pomodoro timer, daily stats, distraction counting, streak tracking, and a motivational block page -- all free, forever, with no ads. This is not a demo. It is a complete focus tool. No competitor occupies the "generous free + compelling Pro" position.

**2. Gamification + Strong Blocking (Unoccupied Niche)**
Forest has gamification but weak blocking. Cold Turkey has strong blocking but no gamification. We are the first Chrome extension to combine streaks, Focus Score, achievements, and a motivational block page WITH an unbypassable nuclear option, schedule blocking, and whitelist mode. This combination does not exist anywhere in the market.

**3. The Smart Block Page**
Users see the block page dozens to hundreds of times per day. Every competitor shows a generic "BLOCKED" message. We show their current streak, time saved today, a motivational quote, and their Focus Score. The block page becomes a reinforcement surface, not a punishment. This is the most underexploited real estate in the category.

**4. Privacy-First Architecture**
All data stays on-device by default. No account required for core features. No browsing data transmitted to servers. The highest-rated extensions in the category (LeechBlock 4.9, Deep Work Zone 4.8) both emphasize local-only data. The lowest trust scores (BlockSite/Sensor Tower concerns, StayFocusd/Sensor Tower parent) come from data practices. "Your data never leaves your device" is both a trust signal and a conversion driver for Pro.

**5. Manifest V3 Native**
Built from scratch on Manifest V3 -- not ported from V2. This eliminates the update breakage that plagues StayFocusd and killed WasteNoTime entirely. "Built for the modern Chrome, not patched onto the old one" is both a technical advantage and a marketing differentiator.

**6. The $4.99/Month ROI That Sells Itself**
At the average knowledge worker rate of $54.27/hour, our Pro plan costs 5.5 minutes of work time. One single blocked distraction saves 23 minutes (UC Irvine recovery time). Even a conservative 10% reduction in distraction time delivers a 48.7x ROI ($243/month saved). A 25% reduction delivers 121.8x ROI ($608/month saved). No competitor makes this argument as explicitly or backs it with data.

---

## 1.3 Success Metrics

### Install Targets

| Milestone | Conservative | Optimistic | Basis |
|-----------|-------------|------------|-------|
| **30 days** | 500 installs | 2,000 installs | Conservative: organic Chrome Web Store discovery + initial Reddit/HN post. Optimistic: Product Hunt top-5 daily + viral Reddit post. |
| **60 days** | 1,500 installs | 6,000 installs | Conservative: 10-15% monthly organic growth. Optimistic: sustained content marketing + first productivity blogger mention. |
| **90 days** | 2,500 installs | 10,000 installs | Conservative: steady organic + word-of-mouth. Optimistic: referral program live + Chrome Web Store SEO optimization bearing fruit. |
| **6 months** | 7,000 installs | 30,000 installs | Conservative: continued organic growth. Optimistic: influencer partnership + Back to School promotion. |
| **12 months** | 15,000 installs | 75,000 installs | Conservative: stable category presence. Optimistic: strong brand recognition in productivity niche. |

### Conversion Rate Targets

| Metric | Target | Benchmark |
|--------|--------|-----------|
| **Install-to-active-user rate** (D7) | 60% | Chrome extension average: 40-50%. Our generous free tier should over-index. |
| **D30 retention** | 40% | Chrome extension average: 25-30%. Streaks are the retention lever. |
| **Free-to-Pro conversion (month 3)** | 2.5% | Industry average for productivity Chrome extensions: 2-5%. Conservative early target. |
| **Free-to-Pro conversion (month 6)** | 3.5% | Improvement from A/B testing upgrade prompts and feature gating optimization. |
| **Free-to-Pro conversion (month 12)** | 4-5% | Mature funnel with optimized paywall triggers, weekly report blurring, and referral program. |
| **Monthly-to-annual plan conversion** | 55-65% | Industry norm with 40% discount incentive. Target 60% by month 6. |
| **Monthly Pro churn** | < 7% | Consumer SaaS benchmark: 5-8%. Target < 7% with strong engagement features. |

### Revenue Targets

| Metric | Conservative (Month 12) | Optimistic (Month 12) |
|--------|------------------------|-----------------------|
| **Paying Pro users** | 270 | 2,250 |
| **Blended ARPU** | $3.79/month | $3.69/month |
| **MRR** | $1,023 | $8,303 |
| **ARR run-rate** | $12,276 | $99,630 |
| **Total Year 1 cumulative revenue** | ~$6,700 | ~$52,000 |

### Rating Target

| Metric | Target | Strategy |
|--------|--------|----------|
| **Chrome Web Store rating** | 4.7+ stars (within first 100 reviews) | Prompt for reviews after positive milestones ("50 hours focused!" or "30-day streak!"). Never prompt after paywall encounters. Address every negative review within 24 hours. The generous free tier is the primary rating defense -- BlockSite's aggressive paywall is their #1 source of 1-star reviews. |
| **Review volume (6 months)** | 100+ reviews | Milestone-based review prompts (not time-based). "Love Focus Mode - Blocker? A quick review helps other people find us." Only after 5+ successful sessions. |

---

# SECTION 2: FEATURE SPECIFICATION

---

## 2.1 Complete Feature Matrix

### Core Blocking

| Feature | Description | Free Tier | Pro Tier ($4.99/mo) | Technical Notes |
|---------|-------------|-----------|---------------------|-----------------|
| **Manual website blocklist** | User adds URLs to block. Exact domain matching (e.g., `reddit.com` blocks all of Reddit including subdomains). | Up to **10 sites** | **Unlimited** sites | Store in `chrome.storage.local`. Blocking via `chrome.declarativeNetRequest` (Manifest V3). Display `8/10 sites used` progress indicator in popup. Trigger upgrade prompt inline (not modal) when user attempts to add site #11. |
| **Pre-built block lists** | Curated lists of common distraction sites by category. User toggles a list on/off to block all sites in that category instantly. | **2 lists**: Social Media (~25 sites: Facebook, Instagram, Twitter/X, TikTok, Snapchat, Pinterest, LinkedIn feed, Threads, Bluesky, Mastodon, etc.) + News (~20 sites: CNN, BBC, Fox, NYT, Reddit r/all, Hacker News, Google News, Apple News, etc.) | **6+ lists**: Social Media, News, Entertainment (Netflix, YouTube, Twitch, Disney+, Hulu, etc.), Gaming (Steam, Twitch, Discord, IGN, Kotaku, etc.), Shopping (Amazon, eBay, Etsy, AliExpress, etc.), Adult Content | Pre-built lists stored as JSON in extension bundle. Updated with extension updates. Pro list unlock checks license status. Each list includes 15-30 domains. Users can remove individual sites from any active list. |
| **Wildcard/pattern blocking** | Block URLs matching a pattern (e.g., `*.reddit.com`, `*facebook*`, `*.social.*`). Enables blocking entire subdomains or keyword-based URL matching. | **No** | **Yes** | Implement via `chrome.declarativeNetRequest` regex rules. Pattern validation in UI to prevent accidental over-blocking. Show "Preview: This pattern will block X currently-tracked domains" before saving. |
| **Whitelist mode** | Invert blocking -- block the ENTIRE internet except a user-defined list of allowed sites (e.g., only Google Docs, Slack, Jira, and GitHub are accessible). | **No** | **Yes** | Implement as a default-block rule with exception list. Requires careful handling of Chrome internal pages (`chrome://`, `chrome-extension://`), search engines, and OAuth flows. Show prominent "Whitelist Mode Active" indicator in extension badge. |
| **Schedule-based blocking** | Automatically activate blocking during defined time windows (e.g., Monday-Friday, 9:00 AM - 5:00 PM). Supports day-of-week and time-of-day rules. | **1 schedule** (e.g., M-F 9-5) | **Unlimited schedules** (e.g., work mornings, evening study, weekend deep work) | Use `chrome.alarms` API for schedule activation/deactivation. Store schedule configs in `chrome.storage.local`. Sync with system clock. Handle timezone changes gracefully. Show next scheduled session in popup. |
| **Nuclear option** | Unbypassable blocking for a set duration. Once activated, the user cannot disable blocking, cannot remove sites from the blocklist, cannot uninstall the extension, and cannot access extension settings to modify rules until the timer expires. | Up to **1 hour** | Up to **24 hours** | Implement bypass prevention: hide extension management page during nuclear mode via `chrome.declarativeNetRequest` (block `chrome://extensions`), disable right-click "Manage Extension" via content script, prevent settings modification by locking storage writes. Display countdown timer in extension badge. Require confirmation dialog with explicit duration selection before activation. Show "Nuclear Mode Active -- [time remaining]" in all blocked-page views. |
| **Block page** | The page displayed when a user navigates to a blocked site. Replaces the distracting site's content entirely. | **Default motivational page** with: rotating motivational quote (pool of 50+ quotes), current streak display ("Day 14 Focus Streak"), time saved today ("You've saved 47 minutes today"), distraction attempt counter ("This is attempt #12 today"), session countdown timer (if in active session), "Return to Work" button | **Full customization**: custom message text, custom background color/image, custom quote rotation from user-provided list, redirect to a specific productive URL instead of block page, option to show/hide each block page element | Block page rendered as a local HTML file bundled with extension (`blocked.html`). Data injected via message passing from background service worker. Block page loads in < 200ms. No external network requests on block page. |
| **Redirect to productive site** | Instead of showing a block page, automatically redirect blocked URL visits to a user-configured productive site (e.g., Reddit -> Notion, YouTube -> Coursera). | **No** | **Yes** -- per-site redirect mapping | Implement via `chrome.declarativeNetRequest` redirect rules. UI: dropdown next to each blocked site to choose "Show block page" or "Redirect to [URL]". Validate redirect URL is not itself on the blocklist. |

### Focus Timer

| Feature | Description | Free Tier | Pro Tier ($4.99/mo) | Technical Notes |
|---------|-------------|-----------|---------------------|-----------------|
| **Basic Pomodoro timer** | Classic 25-minute focus / 5-minute break cycle with automatic alternation. Visual countdown in popup and extension badge. Audio chime on transitions. | **Yes** -- 25-minute focus / 5-minute short break / 15-minute long break (after 4 cycles) | **Yes** (same defaults available) | Timer runs in background service worker via `chrome.alarms` (1-minute granularity) combined with `setInterval` for second-level display updates. Timer state persisted in `chrome.storage.session` to survive popup close. Badge text shows remaining minutes. Break notification via `chrome.notifications`. |
| **Custom timer durations** | User sets any focus duration (1-240 minutes), short break (1-30 minutes), long break (5-60 minutes), and cycles-before-long-break (1-12). | **No** -- fixed 25/5/15/4 only | **Yes** -- any combination within ranges | Duration selector UI with presets (25/5, 50/10, 90/20, 52/17) plus custom input fields. Validation: focus >= 1 min, break >= 1 min, focus <= 240 min. Persist custom presets per user. |
| **Quick Focus** | One-click button in popup that instantly starts a 25-minute focus session with the user's active blocklist enabled. Zero configuration required. Designed to be the first thing a new user interacts with. | **Yes** -- starts 25-min session with all active block rules | **Yes** -- customizable (user chooses Quick Focus duration, which block lists activate, and whether notification muting is included) | Quick Focus button is the largest, most prominent UI element in the popup. Single click: (1) activates all enabled block rules, (2) starts 25-min timer, (3) updates badge to show countdown, (4) mutes notifications if enabled. Confirmation toast: "Focus session started. 25 minutes on the clock." |
| **Auto-start sessions** | Automatically begin a focus session at a scheduled time or when the browser opens. No manual trigger needed. | **No** | **Yes** | Implement via `chrome.alarms` for scheduled auto-start. Browser-open auto-start via `chrome.runtime.onStartup` listener. User configures auto-start conditions in settings. Show notification: "Auto-focus session started. [X] minutes remaining." with a "Cancel" button (5-second window). |
| **Break reminders** | Notification when a break period starts and ends. Helps users actually take breaks instead of powering through. | **Basic**: system notification with chime sound + badge color change (green for focus, blue for break) | **Advanced**: custom notification sounds, optional screen overlay prompt, smart break suggestions ("Stand up and stretch" / "Drink water" / "Look away from screen for 20 seconds") | Break reminders via `chrome.notifications`. Free tier: single notification with default chime. Pro tier: custom sound selection, suggestion text rotation from curated pool of 20+ evidence-based break activities. |
| **Session history** | Log of completed focus sessions with date, duration, sites blocked count, and distraction attempts count. | **Last 7 days** of sessions | **Full history** (unlimited) with search and filtering | Store session records in `chrome.storage.local` as array of objects: `{ date, duration, focusMinutes, breakMinutes, sitesBlocked, attemptsBlocked, completed: bool }`. Free tier: auto-prune records older than 7 days. Pro tier: no pruning. Display as chronological list in a dedicated "History" tab. |
| **Focus goals** | User sets a target for daily focus time (e.g., "Focus for 4 hours today"). Progress bar shows advancement toward the goal. Celebration animation when goal is met. | **Daily goal only** -- one numeric target in minutes (e.g., 240 min/day) | **Daily + Weekly + Monthly goals** with separate targets. Goal streak tracking ("Met your daily goal 12 days in a row"). | Goal progress calculated from session history. Daily goal resets at midnight local time. Weekly goal resets Monday 00:00. Progress bar in popup shows percentage. Goal-met celebration: confetti animation (lightweight CSS, no library) + "Goal Achieved!" badge. Pro goal streaks stored alongside session data. |

### Stats & Analytics

| Feature | Description | Free Tier | Pro Tier ($4.99/mo) | Technical Notes |
|---------|-------------|-----------|---------------------|-----------------|
| **Daily focus time** | Total minutes spent in active focus sessions today. Prominently displayed in popup dashboard. | **Yes** -- always visible | **Yes** | Calculated from sum of completed session durations for current date. Updated in real-time during active sessions. Display format: "3h 22m focused today." Resets at midnight local time. |
| **Sites blocked count** | Total number of unique blocked page loads today (i.e., how many times the block page was shown). | **Yes** -- always visible | **Yes** | Increment counter each time `blocked.html` is loaded via `chrome.declarativeNetRequest` onRuleMatchedDebug or by intercepting navigation in background script. Display: "47 distractions blocked today." |
| **Distraction attempts counter** | Number of times the user attempted to visit a blocked site today. The signature metric -- "You tried to visit Reddit 34 times today." Designed to create behavioral awareness shock. | **Yes** -- always visible, per-day total. Shows top 3 most-attempted sites by name. | **Yes** -- plus per-site breakdown, hourly heatmap, and historical trends | Each blocked navigation attempt increments a counter keyed by domain + date. Free tier: aggregate count + top 3 sites. Pro tier: full per-site table sortable by attempt count, with hourly distribution chart. This is the metric most likely to be shared on social media ("I tried to visit Reddit 47 times today" screenshots). |
| **Focus Score** | A calculated score from 0-100 representing the user's overall focus quality. Factors: session completion rate (did they finish sessions?), distraction attempt frequency (fewer = better), goal achievement rate, and streak length. Displayed prominently as a badge. | **Yes** -- score visible, but breakdown of contributing factors is **blurred/locked** with "See what's driving your score -- Go Pro" CTA | **Yes** -- full breakdown: session completion % weight, distraction rate weight, goal achievement weight, streak multiplier, and specific recommendations to improve score | Algorithm: `Score = (completionRate * 35) + (100 - distractionRate) * 25 + (goalRate * 25) + (streakBonus * 15)`. Score recalculated daily. Displayed as large number with color coding: 0-40 red, 41-60 yellow, 61-80 green, 81-100 blue/gold. This score is the primary Grammarly-style "show value, gate details" conversion mechanic. |
| **Streak tracking** | Count of consecutive days with at least one completed focus session. Displayed on block page and in popup. The #1 retention mechanic. | **Current streak only** -- "Day 14 Focus Streak" with flame icon. Streak resets to 0 if a day is missed. | **Full streak history**: longest streak ever, streak calendar heatmap (GitHub-style), **streak recovery** (1 missed day does not reset if streak was 7+ days -- user gets 1 "grace day" per month) | Streak calculated from session history: any day with >= 1 completed session counts. Free tier: single integer `currentStreak`. Pro tier: additional fields `longestStreak`, `streakHistory[]`, `graceDaysRemaining`. Streak recovery is a high-value Pro differentiator -- losing a 30-day streak to one sick day is the #1 complaint about streak systems. |
| **Weekly/monthly reports** | Comprehensive analytics report covering the past 7 or 30 days: total focus time, distraction trends, top blocked sites, Focus Score trend, goal achievement rate, comparison to previous period, and personalized insights. | **No** -- this is the **#1 conversion trigger**. After session 5 (~day 3-5), user receives a notification: "Your Weekly Focus Report is ready." Clicking shows a blurred preview with visible headers and aggregate numbers but blurred details. | **Yes** -- full unblurred reports. Weekly report auto-generated every Sunday. Monthly report on the 1st. Reports include: time charts, per-site breakdown, hourly focus heatmap, Focus Score trend line, goal completion rates, streak calendar, "You were more focused than X% of users" benchmark, and actionable recommendations. | Reports generated client-side from stored session data. Blurred preview for free users uses CSS `filter: blur(8px)` on data cells with unblurred headers. The specific numbers shown unblurred in the free preview: total sessions count, total focus time (aggregate only), total distractions blocked. Everything else (per-site data, trends, hourly breakdown, score factors, recommendations) is blurred. This Grammarly-style mechanic is the proven #1 conversion trigger. |
| **Exportable analytics** | Download focus data as CSV or PDF for personal records, manager reporting, or client billing. | **No** | **Yes** -- CSV export (raw data) and PDF export (formatted report with charts) | CSV: standard comma-separated with headers `date, session_start, session_end, duration_minutes, sites_blocked, attempts, completed, focus_score`. PDF: HTML-to-PDF conversion using browser print API with custom styling. Export button in Reports tab. |

### Smart Features

| Feature | Description | Free Tier | Pro Tier ($4.99/mo) | Technical Notes |
|---------|-------------|-----------|---------------------|-----------------|
| **AI focus recommendations** | Personalized suggestions based on the user's focus patterns: optimal focus times, problematic days/hours, suggested sites to add to blocklist, recommended session durations. Example: "You're most focused on Tuesdays 9-11am. Consider scheduling your hardest work then." | **No** | **Yes** | Phase 1: rule-based recommendations from local data (identify peak focus hours, most-attempted sites not yet blocked, sessions with highest completion rates). Phase 2 (future): optional server-side ML model for deeper pattern analysis. All data sent to server is anonymized and opt-in only. Recommendations displayed in a "Coach" tab in popup. |
| **Calendar integration** | Connect to Google Calendar. Automatically start focus sessions during calendar events tagged "Focus Time," "Deep Work," or custom keywords. Automatically pause blocking during meetings. | **No** | **Yes** | Google Calendar API via OAuth2 (`chrome.identity`). User authorizes read access to calendar. Background service worker polls calendar every 5 minutes for upcoming events. Auto-start focus session 1 minute before "Focus" event begins. Auto-pause blocking during meeting events (configurable: user chooses which event types trigger pause). Show next scheduled auto-focus in popup: "Auto-focus in 23 minutes (Deep Work block)." |
| **Context-aware profiles** | Named blocking profiles with different block lists, timer settings, and notification rules. User switches profiles manually or ties them to schedules/calendar events. Examples: "Deep Work" (aggressive blocking, long timer), "Email Time" (block social only, no timer), "Research Mode" (allow Stack Overflow/GitHub, block everything else). | **No** | **Yes** -- unlimited named profiles with per-profile block lists, timer durations, notification settings, and activation rules | Profiles stored as named configuration objects in `chrome.storage.local`. Each profile contains: `{ name, blocklist[], prebuiltLists[], timerDuration, breakDuration, notificationMuting, activationRule }`. Profile switcher dropdown in popup header. Auto-switching via schedule or calendar integration. |

### Social & Accountability

| Feature | Description | Free Tier | Pro Tier ($4.99/mo) | Technical Notes |
|---------|-------------|-----------|---------------------|-----------------|
| **Focus buddy** | Invite another Focus Mode - Blocker user as an accountability partner. Both see each other's daily focus time and streak count. Optional: receive notification when buddy starts a focus session ("Jordan just started focusing -- join them?"). | **1 buddy invite** | **Unlimited buddies** | Buddy system via unique invite codes (no server accounts needed for free tier). Buddy data sync via `chrome.storage.sync` (limited) or optional Firebase Realtime Database (Pro). Free tier: share invite code -> buddy accepts -> both see minimal stats (focus time today, current streak). Pro: full mutual visibility + session notifications + synchronized focus challenges. |
| **Leaderboards** | Anonymous or named rankings comparing focus time, streaks, and Focus Scores with other users. | **No** | **Yes** -- global anonymous leaderboard showing percentile rank ("You're in the top 15% of Focus Mode users this week") | Leaderboard requires anonymous opt-in data submission to backend. Data sent: daily focus time, streak length, Focus Score (no browsing data, no site names, no personal info). Display: "Top 15% this week" badge in popup. Full leaderboard view shows anonymized ranking table. |
| **Focus challenges** | Structured multi-day challenges (e.g., "7-Day Focus Sprint: 4 hours of focus per day for 7 consecutive days"). Completions earn badges. | **1 active challenge at a time** from a pre-built library of 5 challenges | **Unlimited active challenges** + custom challenge creation (set your own duration, daily target, and reward badge) | Pre-built challenges: "7-Day Sprint" (4hrs/day x 7 days), "Morning Focus" (2hrs before noon x 5 days), "Digital Detox" (8hrs total in one day), "Streak Builder" (complete 1 session/day x 14 days), "Pomodoro Master" (8 Pomodoro cycles in one day). Challenge progress tracked in `chrome.storage.local`. Badge awarded on completion (displayed in popup profile section). |

### Integrations & Power Features

| Feature | Description | Free Tier | Pro Tier ($4.99/mo) | Technical Notes |
|---------|-------------|-----------|---------------------|-----------------|
| **Cross-device sync** | Sync block lists, schedules, profiles, and settings across all Chrome instances (desktop, laptop, Chromebook). Closing the "I'll just use my phone/other computer" loophole. | **No** | **Yes** -- via Chrome sync or optional encrypted cloud sync | Primary method: `chrome.storage.sync` (100KB limit, Chrome account required). For users exceeding storage limits or wanting cross-browser sync: optional encrypted cloud storage via extension backend. Sync includes: blocklist, schedules, profiles, timer settings. Does NOT sync: session history, analytics data (too large, stays local). |
| **Keyboard shortcuts** | Hotkeys for common actions. | **Basic**: `Alt+Shift+F` to start/stop Quick Focus session, `Alt+Shift+N` to activate nuclear option | **Full customizable shortcuts** via `chrome.commands` API. Assignable actions: start/stop session, toggle nuclear, switch profile, open popup, snooze 5 min | Register default shortcuts in `manifest.json` `commands` field. Free tier: 2 fixed shortcuts. Pro tier: user can remap all actions in settings. Maximum 4 registered `chrome.commands` (Chrome limit), remaining shortcuts handled via content script key listeners. |
| **Notification muting** | Suppress browser notifications during active focus sessions to prevent interruption from the sites you have blocked and other notification sources. | **Mute all notifications** during active focus sessions (blanket suppression) | **Selective allowlist**: mute all EXCEPT user-specified origins (e.g., allow Slack DMs, allow Google Calendar reminders, block everything else) | Notification interception is limited in Manifest V3. Approach: use `chrome.notifications` to suppress extension-generated notifications during focus. For web notifications: content script intercepts `Notification` constructor and `ServiceWorkerRegistration.showNotification` on pages. Free tier: block all. Pro tier: maintain an allowlist of permitted notification origins. |
| **Ambient sounds** | Built-in background audio for focus sessions. Plays directly from the extension -- no need to open Spotify or YouTube (which are likely blocked). | **3 sounds**: Rain, White Noise, Lo-fi Beats | **15+ sounds** with **mixing** (layer 2-3 sounds simultaneously with independent volume sliders): Rain, Heavy Rain, Thunderstorm, White Noise, Pink Noise, Brown Noise, Lo-fi Beats, Cafe Ambience, Fireplace, Ocean Waves, Forest Birds, Wind, Library, Fan, Train | Audio files bundled with extension (MP3, 30-60 second loops). Playback via `Audio` API in offscreen document (Manifest V3 requirement -- service workers cannot play audio directly). Free tier: 3 fixed tracks, single playback. Pro tier: full library + mixing up to 3 simultaneous tracks with per-track volume control (0-100%). Volume master control. Auto-start sound with focus session (configurable). |
| **API access** | REST API for programmatic access to focus data, block list management, and session control. For teams building custom dashboards or integrating with project management tools. | **No** | **No** (Team tier only -- $3.99/user/month) | Future feature. Not in scope for initial launch. Team tier only. API endpoints: GET /sessions, GET /stats, POST /blocklist, POST /session/start, POST /session/stop. Authentication via API key per team. Rate limited to 100 requests/minute/key. |

---

## 2.2 Free Tier Specification

The free tier is designed as a **genuinely complete focus tool**, not a crippled demo. Every free feature must be useful enough that a user could rely on it indefinitely and still recommend the extension to others. The free tier drives adoption, reviews, word-of-mouth, and organic installs. It creates the behavioral patterns and data awareness that make Pro upgrades feel natural -- never forced.

### Free Feature 1: Manual Website Blocklist (10 Sites)

- **Exact Functionality:** User enters up to 10 URLs in the popup settings. Each URL is matched at the domain level (e.g., entering `reddit.com` blocks `www.reddit.com`, `old.reddit.com`, and all `*.reddit.com` subdomains). Adding a site immediately activates blocking for that domain. Removing a site immediately deactivates blocking. No restart or session required to apply changes.
- **Exact Limits:** 10 sites maximum. A progress indicator shows `8/10 sites used` (or similar). When the user has 10 sites, the "Add Site" input field remains visible but triggers an inline upgrade prompt (slide-down panel, not modal) when the user attempts to add site #11.
- **Why This Drives Adoption Without Cannibalizing Pro:** 10 sites covers the top distractors for most casual users (Reddit, Twitter/X, YouTube, Facebook, Instagram, TikTok, news sites -- roughly 7-8 sites). This is 3x more generous than BlockSite (3 sites) and Intentional (3 sites), which generates positive reviews and word-of-mouth ("the free plan is actually useful!"). Pro is justified for users with 15+ distracting sites, for users who want wildcard patterns, or for users who want whitelist mode -- these are power users who get outsized value and will happily pay.

### Free Feature 2: Pre-Built Block Lists (2 Categories)

- **Exact Functionality:** Two toggle-switches in settings: "Social Media" (~25 sites) and "News" (~20 sites). Toggling a list on adds all its sites to the active blocklist. Toggling it off removes them. Users can remove individual sites from an active pre-built list without disabling the entire list. Pre-built list sites do NOT count toward the 10-site manual limit.
- **Exact Limits:** 2 lists only (Social Media, News). Pro lists (Entertainment, Gaming, Shopping, Adult Content) are visible in the UI with lock icons but cannot be toggled on.
- **Why This Drives Adoption Without Cannibalizing Pro:** Social media and news cover approximately 80% of digital distractions for the average user. These two lists make onboarding effortless -- a new user can block their primary distraction sources in 2 clicks. Pro lists (Entertainment, Gaming, Shopping) serve niche needs and create natural "I also need gaming sites blocked" upgrade moments.

### Free Feature 3: Basic Pomodoro Timer (25/5/15)

- **Exact Functionality:** A Pomodoro timer running 25-minute focus sessions, 5-minute short breaks, and 15-minute long breaks after every 4 focus sessions. Timer displays countdown in the popup and in the extension badge icon. Audio chime plays at session transitions. Timer automatically alternates between focus and break periods.
- **Exact Limits:** Fixed 25-minute focus / 5-minute short break / 15-minute long break / 4-cycle-to-long-break. No customization of these durations at the free tier. Timer is fully functional and unlimited in daily usage -- no session caps.
- **Why This Drives Adoption Without Cannibalizing Pro:** The Pomodoro timer is table stakes in the focus category. Every major competitor (Deep Work Zone, Forest, BlockSite) offers some form of timer for free. Paywalling it would cripple the free experience and generate negative reviews. Custom durations (Pro) serve users who find 25/5 insufficient for deep work (many prefer 50/10 or 90/20) -- these are committed users who have validated the timer's value through repeated use and will pay for the flexibility.

### Free Feature 4: Quick Focus (One-Click Session)

- **Exact Functionality:** A large, prominent button in the popup labeled "Quick Focus." Single click starts a 25-minute focus session with all currently active blocking rules engaged. No configuration needed. The button is the first thing a new user sees after install. After clicking: (1) all active block rules engage, (2) 25-minute timer starts, (3) badge updates to show countdown, (4) notification muting activates if enabled. When session ends: badge shows checkmark, notification shows "Session complete! You blocked X distractions."
- **Exact Limits:** Fixed 25-minute duration at free tier. Always uses current blocklist (cannot select a subset of sites for Quick Focus). No customization of what Quick Focus does.
- **Why This Drives Adoption Without Cannibalizing Pro:** Quick Focus is the "magic moment" -- the feature that delivers value within 5 seconds of install. It eliminates all onboarding friction ("What do I configure? How does this work?"). A new user clicks one button and immediately experiences distraction-free focus. This creates the habit loop that drives retention. Pro customization (choose Quick Focus duration, choose which block lists activate, add notification muting) serves users who have already made Quick Focus a daily habit and want more control.

### Free Feature 5: Daily Stats Dashboard

- **Exact Functionality:** The popup's main screen displays three primary metrics updated in real-time: (1) **Focus Time Today** -- total minutes in completed focus sessions (format: "3h 22m"), (2) **Distractions Blocked Today** -- count of blocked page loads, (3) **Distraction Attempts** -- count of navigation attempts to blocked sites, with top 3 most-attempted sites listed by name (e.g., "reddit.com: 23 attempts, twitter.com: 14 attempts, youtube.com: 9 attempts").
- **Exact Limits:** Daily data only. No weekly, monthly, or historical views. Stats reset at midnight local time. Top 3 most-attempted sites shown; full per-site breakdown requires Pro.
- **Why This Drives Adoption Without Cannibalizing Pro:** Daily stats are the "proof it's working" metric. "You blocked 47 distractions today" is the behavioral shock that turns skeptics into believers. The distraction attempt counter is the single most shareable metric in the product (users screenshot and post "I tried to visit Reddit 47 times today" on Twitter/Reddit). This drives organic installs. Pro is justified for weekly/monthly trends, hourly heatmaps, and full per-site breakdowns -- data depth that daily stats naturally make users curious about.

### Free Feature 6: Focus Score (0-100) -- Score Visible, Breakdown Locked

- **Exact Functionality:** A numerical score (0-100) displayed as a prominent badge in the popup. Calculated daily from: session completion rate (35% weight), inverse distraction rate (25% weight), goal achievement (25% weight), and streak bonus (15% weight). Color-coded: 0-40 red, 41-60 yellow, 61-80 green, 81-100 blue/gold.
- **Exact Limits:** The score number itself is always visible. The breakdown (what factors contribute to the score, and how each factor is performing) is blurred with a "See what's driving your score -- Go Pro" overlay. Free users see "Your Focus Score: 74" but cannot see "Session completion: 85% (+3 from yesterday), Distraction rate: Medium (12 attempts/hour), Goal achievement: 80%, Streak bonus: +7."
- **Why This Drives Adoption Without Cannibalizing Pro:** The Focus Score is the Grammarly-style "show value, blur details" mechanic. A score of 74 makes users ask "How do I get to 90?" -- but the answer (the breakdown) is behind the paywall. This creates desire without frustration, because the score itself is useful as a daily benchmark. Grammarly reports that this pattern generates 22% upgrade lift compared to hard feature gates.

### Free Feature 7: Current Streak Tracking

- **Exact Functionality:** A counter showing consecutive days with at least one completed focus session. Displayed in the popup ("Day 14 Focus Streak" with flame icon) and on every block page ("Your streak: 14 days -- don't break it now!"). Streak increments at end of first completed session each day. Streak resets to 0 if a calendar day passes with no completed session.
- **Exact Limits:** Current streak number only. No streak history, no longest-streak-ever record, no streak recovery (one missed day = reset to 0). No streak calendar visualization.
- **Why This Drives Adoption Without Cannibalizing Pro:** Streaks are the #1 retention mechanic in consumer apps (Duolingo, Snapchat). "Day 14" creates psychological switching cost -- uninstalling the extension means losing the streak. The strict "miss a day, lose everything" rule at free tier creates demand for Pro's streak recovery feature ("1 grace day per month if your streak is 7+"). This is the most psychologically powerful upgrade moment: a user on a 30-day streak who misses one day will pay $4.99 to not lose it.

### Free Feature 8: Default Motivational Block Page

- **Exact Functionality:** When a user navigates to a blocked site, the entire page is replaced with the Focus Mode block page showing: (1) a rotating motivational quote from a pool of 50+ curated quotes, (2) the user's current streak ("Day 14 Focus Streak"), (3) time saved today ("You've saved 47 minutes today"), (4) distraction attempt counter for this specific site ("This is your 12th attempt to visit reddit.com today"), (5) session countdown if active ("18 minutes remaining"), (6) a "Return to Work" button linking to the user's last productive tab or new tab page.
- **Exact Limits:** Default design only (colors, layout, quotes are fixed). No custom messages, no custom images, no custom colors, no redirect option. Quotes rotate from the pre-built pool only.
- **Why This Drives Adoption Without Cannibalizing Pro:** The motivational block page is the single biggest differentiator from every competitor -- all of whom show generic "BLOCKED" text. Users see this page dozens to hundreds of times per day. Making it encouraging, data-rich, and pleasant (not punishing) is what turns "I installed a blocker" into "I love this blocker." Pro customization (custom text, colors, images, redirect) is a delight feature for users who want personalization but does not degrade the free experience.

### Free Feature 9: 1 Schedule + 1-Hour Nuclear Option

- **Exact Functionality:** **Schedule:** User configures one recurring blocking schedule with day-of-week selection (any combination of Mon-Sun) and start/end time (e.g., M-F 9:00 AM - 5:00 PM). During scheduled hours, all blocking rules activate automatically. Outside scheduled hours, blocking deactivates (unless manually overridden). **Nuclear Option:** User activates a lock for 15, 30, 45, or 60 minutes. During nuclear mode, all blocking rules are enforced and cannot be modified, disabled, or bypassed. Settings are locked. The extension cannot be disabled or uninstalled (to the extent Chrome APIs allow). Countdown timer shown in badge and on every block page.
- **Exact Limits:** 1 schedule only. Nuclear option maximum 1 hour. No schedule + nuclear combination (cannot pre-schedule nuclear activations).
- **Why This Drives Adoption Without Cannibalizing Pro:** One schedule covers the primary use case (block distractions during work hours, M-F 9-5). The 1-hour nuclear option lets users experience the power of truly unbypassable blocking. Users who want multiple schedules (work + evening study + weekend deep work) hit a natural upgrade wall. Users who want 4-hour or 24-hour nuclear sessions -- particularly ADHD users who need extended restriction -- will upgrade for the extended duration. The nuclear option is the most-discussed feature in ADHD and r/getdisciplined communities, and the 1-hour taste creates desire for longer sessions.

### Free Feature 10: Notification Muting (Blanket)

- **Exact Functionality:** During active focus sessions, all interceptable browser notifications are suppressed. Notifications from web pages, browser extensions, and web apps are blocked from displaying. When the session ends, any queued notifications are released.
- **Exact Limits:** All-or-nothing muting only. No selective allowlist (e.g., cannot allow Slack DMs while muting everything else). Muting only active during focus sessions, not during scheduled blocking without an active session.
- **Why This Drives Adoption Without Cannibalizing Pro:** If notifications interrupt focus sessions, users blame the extension for not "really" helping them focus. Basic notification muting completes the focus experience and prevents negative reviews. Pro's selective allowlist serves users who need to remain reachable for specific channels (Slack DMs from their boss, calendar reminders) while blocking everything else -- a nuanced need that justifies the upgrade.

### Free Feature 11: 3 Ambient Sounds

- **Exact Functionality:** Three built-in audio tracks available during focus sessions: (1) Rain, (2) White Noise, (3) Lo-fi Beats. Single track playback at a time with volume control (0-100%). Play/pause button in popup timer view. Sound auto-starts with focus session if user has a preferred sound set. Sound auto-stops when session ends or during breaks (configurable).
- **Exact Limits:** 3 sounds only. Single track playback (no mixing/layering). Pro sounds (12+ additional tracks) are listed in the sound selector with lock icons.
- **Why This Drives Adoption Without Cannibalizing Pro:** Ambient sounds are a surprisingly high-engagement feature -- users open the extension specifically for the sounds, which increases daily active usage. Three free sounds hook users into the habit. The full library (15+ sounds with mixing) serves users who want variety and layering (e.g., rain + lo-fi + fireplace simultaneously), which is a clear delight upgrade.

### Free Feature 12: 1 Focus Buddy Invite

- **Exact Functionality:** User generates a unique invite code from the popup. Sharing this code with another Focus Mode - Blocker user creates a mutual accountability link. Both users see each other's daily focus time and current streak in a "Buddy" section of the popup. Optional notification when buddy starts a focus session ("Jordan just started focusing -- join them?").
- **Exact Limits:** 1 buddy maximum. Cannot have multiple buddies simultaneously. Cannot see buddy's detailed stats (only focus time today + current streak).
- **Why This Drives Adoption Without Cannibalizing Pro:** Every buddy invite is a potential new install at zero customer acquisition cost. This is a viral growth mechanic, not a feature to monetize. One buddy creates social accountability (proven to improve focus by 30-50% in body-doubling research). Pro unlocks unlimited buddies for users who want group accountability (study groups, work teams, accountability circles).

### Free Feature 13: 1 Focus Challenge

- **Exact Functionality:** User can activate one pre-built challenge from a library of 5 options (e.g., "7-Day Focus Sprint: 4 hours of focus per day for 7 consecutive days"). Challenge tracks daily progress with a visual progress bar. Completing a challenge awards a badge displayed in the popup profile section.
- **Exact Limits:** 1 active challenge at a time. 5 pre-built challenges only (no custom challenges). Earned badges are permanent.
- **Why This Drives Adoption Without Cannibalizing Pro:** Challenges add structured motivation that keeps users engaged beyond the daily routine. Completing a challenge creates a sense of accomplishment that drives retention and review-writing. Pro unlocks unlimited simultaneous challenges and custom challenge creation for users who want deeper gamification.

---

## 2.3 Pro Tier Specification

**Price:** $4.99/month or $35.88/year ($2.99/month)
**Target:** Knowledge workers, freelancers, ADHD/neurodivergent users, and anyone who has validated focus tools through the free tier and wants more depth.

The Pro tier is designed around three upgrade motivations: (1) **hitting a free-tier limit** (11th site, 2nd schedule, custom timer), (2) **curiosity about locked data** (weekly reports, Focus Score breakdown, streak history), and (3) **desire for deeper control** (whitelist mode, profiles, calendar integration, 24-hour nuclear).

### Pro Feature 1: Unlimited Website Blocklist

- **Exact Functionality:** No cap on the number of manually-added blocked sites. The `8/10` counter disappears. Add button always functional.
- **Why Worth Paying For:** Users who need 15+ blocked sites have validated that blocking works for them and are deeply invested in the product. They are also the highest-engagement users. The 10-site free limit is generous enough that hitting it signals serious commitment.
- **Connection to Free Tier:** Free tier's 10-site limit creates awareness of the cap through the progress indicator. The upgrade prompt when adding site #11 is the natural moment of conversion.

### Pro Feature 2: All Pre-Built Block Lists (6+ Categories)

- **Exact Functionality:** Unlock Entertainment, Gaming, Shopping, and Adult Content lists in addition to the free Social Media and News lists. Each list contains 15-30 curated domains. New categories may be added over time. All lists are individually toggleable.
- **Why Worth Paying For:** Users who need gaming or shopping blocked in addition to social media have broader distraction patterns and get more value from comprehensive blocking.
- **Connection to Free Tier:** Free users see Pro list names with lock icons in the settings UI. When they mentally think "I need to block Netflix too," the path to Pro is clear.

### Pro Feature 3: Wildcard/Pattern Blocking

- **Exact Functionality:** Add blocking rules using wildcard patterns: `*.reddit.com` (all subdomains), `*facebook*` (any URL containing "facebook"), `*.social.*` (any domain with "social" in it). Pattern preview shows which currently-known domains would be affected.
- **Why Worth Paying For:** Pattern blocking is a power-user feature that dramatically reduces manual blocklist management. A single rule like `*.reddit.com` replaces needing to add `reddit.com`, `old.reddit.com`, `new.reddit.com`, `i.reddit.com`, etc. individually.
- **Connection to Free Tier:** Free users who try to block Reddit may notice subdomains slipping through, creating awareness of the limitation.

### Pro Feature 4: Whitelist Mode

- **Exact Functionality:** Toggle from blacklist (block specific sites) to whitelist (block everything except specified sites). User adds allowed domains (e.g., Google Docs, Slack, Jira, GitHub, company intranet). All other domains are blocked. Chrome internal pages and OAuth flows are automatically allowed.
- **Why Worth Paying For:** Whitelist mode is the "maximum restriction" approach that ADHD users and digital minimalists specifically request. It is a fundamentally different paradigm from blacklisting and appeals to the most committed (and most willing-to-pay) users.
- **Connection to Free Tier:** Free tier's blacklist approach naturally exposes the limitation: "I keep finding new distracting sites. I wish I could just block everything and whitelist my work tools." This is a frequently expressed sentiment in ADHD communities.

### Pro Feature 5: Unlimited Schedules

- **Exact Functionality:** Create any number of named blocking schedules with different day/time combinations and different blocking rules per schedule. Examples: "Work Morning" (M-F 9-12, aggressive blocking), "Afternoon" (M-F 1-5, moderate blocking), "Evening Study" (Sun-Thu 7-10pm, academic sites unblocked), "Weekend Deep Work" (Sat 9-1, maximum blocking).
- **Why Worth Paying For:** Multiple schedules serve users with varied daily rhythms who need different blocking intensities at different times. This is a natural evolution from the single free schedule.
- **Connection to Free Tier:** Free tier's single schedule covers the primary use case. Users who want a second schedule (e.g., evening study in addition to work hours) encounter a clear upgrade moment.

### Pro Feature 6: Extended Nuclear Option (Up to 24 Hours)

- **Exact Functionality:** Duration options expand from free tier's [15, 30, 45, 60 minutes] to include [2 hours, 4 hours, 8 hours, 12 hours, 24 hours]. All nuclear mode protections apply: no modifications, no disable, no uninstall during active nuclear. Extended duration requires explicit confirmation ("You are about to lock blocking for 8 hours. This cannot be undone. Are you sure?").
- **Why Worth Paying For:** Extended nuclear is the #1 requested power feature from ADHD and r/getdisciplined communities. A 1-hour taste proves the concept; 4-24 hour durations serve users who need full-day protection.
- **Connection to Free Tier:** Free tier's 1-hour nuclear creates the "that hour flew by -- I want more" moment. The upgrade prompt fires when a user completes a 1-hour nuclear session and tries to immediately start another.

### Pro Feature 7: Custom Block Page

- **Exact Functionality:** Full block page editor: custom headline text, custom body message, custom background color (color picker), custom background image (URL or upload), custom quote rotation (add/remove quotes from personal pool, or disable quotes), show/hide individual block page elements (streak, time saved, attempt counter, session timer, motivational quote). Alternatively, set a redirect URL instead of showing a block page at all.
- **Why Worth Paying For:** Users see the block page dozens of times per day. Power users want it to match their aesthetic, show only what they find useful, or redirect them to a productive site rather than a static page.
- **Connection to Free Tier:** The free block page is pleasant and functional, but users who see it 50+ times per day develop strong opinions about what they want it to show. Customization becomes a desire, not a need -- which is the ideal Pro upsell territory.

### Pro Feature 8: Redirect to Productive Sites

- **Exact Functionality:** Per-site redirect mapping: user configures "when I try to visit reddit.com, redirect me to notion.so" (or any other URL). Redirect happens instantly -- the user never sees the block page for that site, just arrives at the productive alternative.
- **Why Worth Paying For:** Redirecting turns a negative experience (blocked!) into a positive one (productive site loaded). This is a creative productivity technique that committed users specifically request.
- **Connection to Free Tier:** Free users always see the block page, which plants the idea: "I wish clicking this sent me to my project board instead."

### Pro Feature 9: Custom Timer Durations

- **Exact Functionality:** Focus duration: 1-240 minutes (any value). Short break: 1-30 minutes. Long break: 5-60 minutes. Cycles before long break: 1-12. Preset buttons for common configurations: 25/5, 50/10, 52/17 (research-backed), 90/20 (deep work), plus unlimited custom presets saved by the user.
- **Why Worth Paying For:** Users who have used the 25/5 Pomodoro for 2+ weeks and find it too short for deep work are ready for custom durations. These are habitual users who have validated the timer's value.
- **Connection to Free Tier:** 25/5 is the proven default and works well for most users initially. As users develop focus habits, they naturally want longer sessions (50-90 min) for deep work. The fixed duration becomes a friction point that drives upgrade.

### Pro Feature 10: Auto-Start Sessions

- **Exact Functionality:** Focus sessions auto-start based on configurable triggers: (1) at scheduled times via `chrome.alarms`, (2) when Chrome browser opens via `chrome.runtime.onStartup`, (3) when a calendar "Focus" event begins (requires calendar integration). Auto-start notification shown with 5-second cancel window.
- **Why Worth Paying For:** Removes daily activation friction for committed users. "I open my laptop and focusing has already started" is the highest tier of habit formation.
- **Connection to Free Tier:** Free users manually start every session, which is fine initially but becomes repetitive for daily users.

### Pro Feature 11: Full Session History

- **Exact Functionality:** Complete history of all focus sessions, searchable and filterable by date range, duration, and completion status. No pruning -- data retained indefinitely. Sessions display: start time, end time, duration, sites blocked count, distraction attempts, completion status, Focus Score for that session.
- **Why Worth Paying For:** 7-day free history shows recent patterns. Full history reveals long-term trends, seasonal variations, and improvement over months.
- **Connection to Free Tier:** After 7 days, free users lose their earliest session data. This creates awareness: "I wish I could see how last month compared."

### Pro Feature 12: Weekly + Monthly Reports (Unblurred)

- **Exact Functionality:** Comprehensive reports auto-generated weekly (Sunday) and monthly (1st of month): total focus time with daily bar chart, distraction trends (up/down from previous period), top 10 blocked sites by attempt count, hourly focus heatmap (when are you most focused?), Focus Score trend line, goal completion rate, streak calendar (GitHub-style grid), percentile benchmark ("You were more focused than 72% of Focus Mode users"), and 2-3 personalized recommendations.
- **Why Worth Paying For:** This is the **#1 conversion trigger** based on competitive intelligence. Weekly reports are the feature users are most curious about (proven by Grammarly's blurred-data approach). The data is already being collected -- the report just makes it actionable.
- **Connection to Free Tier:** After session 5 (~day 3-5), free users see a blurred preview of their weekly report. Visible: headers, aggregate focus time, total blocks. Blurred: per-site breakdown, hourly heatmap, trend lines, recommendations, percentile ranking. Curiosity about their own behavioral data is "nearly irresistible" (Grammarly UX research).

### Pro Feature 13: Exportable Analytics

- **Exact Functionality:** Export button in Reports tab. CSV export: raw session data with columns `date, session_start, session_end, duration_minutes, sites_blocked, attempts_blocked, completed, focus_score`. PDF export: formatted report matching the in-app weekly/monthly report with charts and visualizations.
- **Why Worth Paying For:** Serves freelancers (tracking focus hours for client billing), managers (proving productivity), and quantified-self enthusiasts. Clear professional use case.
- **Connection to Free Tier:** Free users see their data in-app but cannot extract it. The need to export arises naturally for professional users.

### Pro Feature 14: AI Focus Recommendations

- **Exact Functionality:** A "Coach" tab in the popup displaying 2-3 personalized recommendations updated daily. Examples: "You're most focused on Tuesdays 9-11am -- consider scheduling your hardest work then," "reddit.com accounted for 43% of your distraction attempts this week -- consider using whitelist mode during deep work," "Your Focus Score drops 15 points after 3pm -- try a 15-minute walk break at 2:45pm." Phase 1 implementation: rule-based analysis of local data. Phase 2 (future): optional cloud-based ML model.
- **Why Worth Paying For:** AI recommendations have high perceived value and feel like having a personal productivity coach. The recommendations are actionable and specific to the user's patterns.
- **Connection to Free Tier:** Free users see their Focus Score but not the factors driving it. AI recommendations explain WHY the score is what it is and HOW to improve -- directly answering the question the locked score breakdown creates.

### Pro Feature 15: Calendar Integration (Google Calendar)

- **Exact Functionality:** OAuth2 connection to Google Calendar (Outlook support in a future update). Read-only access to calendar events. Features: (1) auto-start focus session when a "Focus Time" / "Deep Work" event begins, (2) auto-pause blocking during meeting events, (3) show upcoming focus blocks in popup ("Auto-focus in 23 minutes"), (4) configurable keyword matching for event names that trigger auto-focus.
- **Why Worth Paying For:** Calendar-aware auto-blocking is the "killer feature" for knowledge workers. No competitor offers this. It transforms Focus Mode from a manual tool into an automatic productivity system integrated with the user's existing workflow.
- **Connection to Free Tier:** Free users manually start every session and set schedules by time. Calendar integration automates this entirely, saving the daily "Should I start focusing now?" decision.

### Pro Feature 16: Context-Aware Profiles

- **Exact Functionality:** Unlimited named profiles, each with independent: block list, pre-built list selections, timer duration, break duration, notification muting rules, and activation trigger (manual, schedule, calendar event). Profile switcher in popup header. Examples: "Deep Work" (block everything aggressive, 90-min timer), "Email Time" (block social only, no timer), "Research" (whitelist mode for Stack Overflow + GitHub + Docs only).
- **Why Worth Paying For:** Knowledge workers switch between task types requiring different blocking intensity throughout the day. Profiles eliminate the need to reconfigure settings each time.
- **Connection to Free Tier:** Free users have one global configuration. As their usage matures, they realize different tasks need different rules.

### Pro Feature 17: Cross-Device Sync

- **Exact Functionality:** Sync block lists, schedules, profiles, and settings across all Chrome instances where the user is signed in. Uses `chrome.storage.sync` as primary mechanism. Sync is automatic and continuous. Does not sync session history or analytics (stays local per device).
- **Why Worth Paying For:** Closes the #1 bypass complaint: "I block sites on my work laptop but then waste time on my personal laptop/Chromebook." Users discover this need organically when they notice their home Chrome is unprotected.
- **Connection to Free Tier:** Free users experience Focus Mode on one device. When they open Chrome on another device and encounter unblocked distractions, the value of sync becomes immediately apparent.

### Pro Feature 18: Full Streak History + Recovery

- **Exact Functionality:** Full streak history: longest streak ever, streak start/end dates for all past streaks, streak calendar heatmap (365-day view, GitHub contribution graph style). Streak recovery: if the user's streak is 7+ days and they miss 1 day, the streak is preserved (not reset). Each Pro user gets 1 grace day per month. Grace day usage is displayed: "Streak saved! 0 grace days remaining this month."
- **Why Worth Paying For:** Streak recovery directly prevents the most painful free-tier moment: losing a 30-day streak to one missed day. Users will pay $4.99 to protect a streak they have invested a month building. Full streak history satisfies the desire to see long-term progress.
- **Connection to Free Tier:** Free tier's strict "miss a day, lose everything" rule creates high emotional stakes. The longer the streak, the more devastating a reset -- and the more compelling streak recovery becomes.

### Pro Feature 19: Full Ambient Sound Library + Mixing

- **Exact Functionality:** 15+ audio tracks: Rain, Heavy Rain, Thunderstorm, White Noise, Pink Noise, Brown Noise, Lo-fi Beats, Cafe Ambience, Fireplace, Ocean Waves, Forest Birds, Wind, Library Ambience, Fan Hum, Train Rhythm (additional tracks added over time). Mixing: layer up to 3 simultaneous tracks with independent volume sliders per track. Master volume control. Save favorite mixes as presets.
- **Why Worth Paying For:** Sound mixing creates a personalized "focus soundtrack" habit. Users who discover ambient sounds become daily users specifically for this feature. The variety and mixing capability are clear upgrades from the 3 free tracks.
- **Connection to Free Tier:** 3 free sounds hook users. Seeing 12+ locked tracks with "Pro" badges in the sound picker creates ongoing desire.

### Pro Feature 20: Selective Notification Allowlist

- **Exact Functionality:** During focus sessions, all notifications are muted EXCEPT those from user-specified origins. Allowlist management in settings: add origins by domain (e.g., "slack.com", "calendar.google.com"). Allowlisted origins' notifications display normally; all others are suppressed.
- **Why Worth Paying For:** Users who need to remain reachable for specific channels (Slack DMs from their manager, calendar reminders) while blocking everything else have a nuanced need that blanket muting cannot satisfy.
- **Connection to Free Tier:** Free tier's blanket muting works for most casual sessions. Users in professional environments who miss an important Slack DM during a focus session immediately understand the value of selective muting.

### Pro Feature 21: Unlimited Focus Buddies + Session Notifications

- **Exact Functionality:** Invite unlimited accountability buddies. See all buddies' daily focus time and streaks in the Buddy panel. Receive notifications when any buddy starts a focus session. Mutual challenge invitations ("Challenge Jordan to a 7-Day Sprint").
- **Why Worth Paying For:** Group accountability (study groups, work teams, friend circles) amplifies the social pressure that makes focus stick. Unlimited buddies serve the accountability-driven user.
- **Connection to Free Tier:** 1 free buddy proves the concept. Users who want to add their study group (3-5 people) or work team hit the limit.

### Pro Feature 22: Unlimited Custom Focus Challenges

- **Exact Functionality:** Create custom challenges with user-defined: duration (1-90 days), daily focus target (any minutes), description, and badge name/icon. Run unlimited simultaneous challenges. Share custom challenges with buddies.
- **Why Worth Paying For:** Custom challenges serve users who have outgrown the 5 pre-built options and want to set personal stretch goals.
- **Connection to Free Tier:** Completing pre-built challenges creates desire for more. "What if I could make my own challenge?" is the natural next thought.

### Pro Feature 23: Global Anonymous Leaderboard

- **Exact Functionality:** Opt-in anonymous leaderboard showing the user's percentile rank for weekly focus time and Focus Score. "You're in the top 15% of Focus Mode users this week." Full leaderboard table showing anonymized entries (no names, just ranks and scores).
- **Why Worth Paying For:** Competitive users are motivated by relative performance. Seeing "top 15%" creates pride and continued engagement; seeing "top 50%" creates determination to improve.
- **Connection to Free Tier:** Free users see their own metrics but have no external benchmark. The leaderboard answers "Am I doing well compared to others?"

### Pro Feature 24: Customizable Keyboard Shortcuts

- **Exact Functionality:** Full remapping of all keyboard shortcuts: start/stop session, toggle nuclear, switch profile, open popup, snooze blocking for 5 minutes, next sound track. Up to 10 custom shortcuts.
- **Why Worth Paying For:** Power users who use Focus Mode dozens of times per day want muscle-memory shortcuts tailored to their workflow.
- **Connection to Free Tier:** Free tier provides 2 fixed shortcuts (`Alt+Shift+F` for Quick Focus, `Alt+Shift+N` for nuclear). Power users want more.

---

## 2.4 Feature Priority (MVP)

### P0 -- Must Have for Launch

These features constitute the minimum viable product. The extension cannot launch without them. Estimated total development time: **5-7 weeks**.

| # | Feature | Why P0 | Est. Effort |
|---|---------|--------|-------------|
| 1 | **Manual website blocklist (10 sites) + domain-level blocking** | This IS the product. If blocking does not work flawlessly, nothing else matters. Must handle domain matching, subdomain coverage, and immediate activation/deactivation. | 1-2 weeks |
| 2 | **Default motivational block page** | Users see this page dozens of times per day. It must load in < 200ms, display streak/time-saved/quote/counter, and feel encouraging rather than punishing. This is our primary differentiator from day 1. | 3-5 days |
| 3 | **Quick Focus button (one-click 25-min session)** | The onboarding magic moment. New users must feel value within 5 seconds of install. One click -> blocking starts + timer starts. | 3-5 days |
| 4 | **Basic Pomodoro timer (25/5/15/4)** | The secondary engagement surface. Timer creates the daily habit loop. Must work reliably in background (service worker), survive popup close, display in badge. | 1 week |
| 5 | **Daily stats (focus time, blocks count, distraction attempts + top 3 sites)** | Validates the product is working. "47 distractions blocked" is the moment users become believers. The distraction attempt counter with site names is the most shareable metric. | 3-5 days |
| 6 | **Focus Score (0-100) -- number visible, breakdown blurred** | The Grammarly-style conversion mechanic. Score creates curiosity; blurred breakdown creates desire for Pro. Must be in place before any paywall triggers fire. | 2-3 days |
| 7 | **Current streak tracking (displayed in popup + block page)** | The #1 retention mechanic. "Day 7 focus streak" prevents uninstall. Must update correctly across midnight boundary and display on every block page view. | 2-3 days |
| 8 | **2 pre-built block lists (Social Media + News)** | Removes onboarding friction. New users can block top distractions in 2 clicks without knowing which URLs to type. | 2-3 days |
| 9 | **Extension popup UI (dashboard, settings, timer)** | The primary user interface. Must be clean, modern, fast (< 300ms load), and mobile-browser-friendly in layout. Popup is where 95% of interaction happens. | 1-2 weeks (concurrent with features above) |
| 10 | **Pro tier licensing + upgrade flow** | Payment processing (Stripe or ExtensionPay), license verification, feature gating based on license status, and the 3 primary upgrade prompts (weekly report blur, 11th site, nuclear extension). Without this, there is no revenue. | 1-2 weeks |

### P1 -- Add Within 2 Weeks Post-Launch

These features complete the free tier experience and unlock Pro revenue. Users expect them quickly after install. Estimated total development time: **3-4 weeks**.

| # | Feature | Why P1 | Est. Effort |
|---|---------|--------|-------------|
| 11 | **1-schedule blocking** | Automates the daily routine. Users who configure a schedule have 2x higher D30 retention than those who rely on manual activation. | 3-5 days |
| 12 | **1-hour nuclear option** | The marquee "serious blocker" feature. Drives word-of-mouth and differentiation from competitors with easily-bypassed blocking. | 3-5 days |
| 13 | **Notification muting (blanket, during sessions)** | Completes the focus experience. Without it, notifications from blocked sites still interrupt, generating "this doesn't really work" complaints. | 3-5 days |
| 14 | **3 ambient sounds (rain, white noise, lo-fi)** | Surprisingly high engagement per development effort. Users open the extension specifically for sounds, increasing DAU. Audio playback via Manifest V3 offscreen document. | 3-5 days |
| 15 | **Pro: unlimited sites + all block lists** | The first Pro revenue features. Immediate unlock for users who hit the 10-site limit or want Entertainment/Gaming lists. Low development effort (just remove the cap and check license). | 2-3 days |
| 16 | **Pro: weekly reports (unblurred)** | The #1 conversion trigger. Free users have been seeing blurred previews since day 5. Unblurring reports for Pro users is the primary revenue driver. | 3-5 days |
| 17 | **Pro: custom timer durations** | Second most-requested Pro feature after reports. Users who have done 20+ Pomodoro sessions want 50/10 or 90/20 options. | 2-3 days |
| 18 | **Pro: extended nuclear (up to 24 hours)** | Serves ADHD power users who need full-day restriction. High-value Pro differentiator. | 2-3 days |
| 19 | **1 focus buddy invite + basic buddy stats** | Viral growth mechanic. Every buddy invite is a potential new install. Buddy system drives social accountability. | 1 week |
| 20 | **1 focus challenge (from pre-built library)** | Structured gamification that keeps users engaged beyond the daily routine. | 3-5 days |

### P2 -- Future Roadmap (Months 2-6+)

These features deepen engagement, expand Pro value, and lay groundwork for the Team tier. Ordered by estimated impact.

| # | Feature | Target Timing | Est. Effort |
|---|---------|---------------|-------------|
| 21 | **Pro: wildcard/pattern blocking** | Month 2 | 1 week |
| 22 | **Pro: whitelist mode** | Month 2 | 1 week |
| 23 | **Pro: redirect to productive sites** | Month 2 | 3-5 days |
| 24 | **Pro: custom block page editor** | Month 2-3 | 1 week |
| 25 | **Pro: cross-device sync** | Month 3 | 1-2 weeks |
| 26 | **Pro: context-aware profiles** | Month 3 | 1 week |
| 27 | **Pro: calendar integration (Google Calendar)** | Month 3-4 | 2 weeks |
| 28 | **Pro: full streak history + recovery** | Month 3 | 3-5 days |
| 29 | **Pro: AI focus recommendations (rule-based Phase 1)** | Month 4 | 2 weeks |
| 30 | **Pro: full ambient sound library + mixing** | Month 4 | 1 week |
| 31 | **Pro: auto-start sessions** | Month 4 | 3-5 days |
| 32 | **Pro: exportable analytics (CSV/PDF)** | Month 4-5 | 1 week |
| 33 | **Pro: selective notification allowlist** | Month 5 | 1 week |
| 34 | **Pro: global anonymous leaderboard** | Month 5 | 1-2 weeks |
| 35 | **Pro: unlimited buddies + session notifications** | Month 5 | 1 week |
| 36 | **Pro: unlimited custom challenges** | Month 5-6 | 1 week |
| 37 | **Pro: monthly reports** | Month 5-6 | 3-5 days |
| 38 | **Pro: customizable keyboard shortcuts** | Month 6 | 3-5 days |
| 39 | **Team tier: shared block lists** | Month 6+ | 2-3 weeks |
| 40 | **Team tier: team sessions + admin dashboard** | Month 7+ | 3-4 weeks |
| 41 | **Team tier: team leaderboards (named)** | Month 7+ | 1-2 weeks |
| 42 | **Team tier: API access** | Month 8+ | 2-3 weeks |
| 43 | **Pro: AI recommendations Phase 2 (cloud ML)** | Month 9+ | 3-4 weeks |
| 44 | **Pro: Outlook calendar integration** | Month 9+ | 1-2 weeks |

---

## Appendix A: Paywall Trigger Timing

This section summarizes when and how upgrade prompts appear. These are critical for conversion and must feel natural, not aggressive.

| Trigger | When It Fires | Style | Aggressiveness |
|---------|--------------|-------|----------------|
| **Sessions 1-2** | First and second use | No upgrade mention whatsoever. Pure value delivery. | None |
| **Session 3** | Third use (~day 2-3) | Small "Pro" badges appear next to locked features in settings. No popup, no CTA, no interruption. Visual-only. | Minimal |
| **Session 5** | Fifth use (~day 3-5) | "Weekly Focus Report" notification badge on extension icon. Clicking shows blurred preview with upgrade CTA. | Moderate |
| **11th site** | When user tries to add site #11 | Inline slide-down panel in blocklist UI. Not a modal. "Keep My 10 Sites" option visible. | Moderate |
| **Nuclear extension** | User completes 1-hour nuclear and tries to start another within 5 minutes | Full-popup takeover with calming blue gradient. "Start Another Free Hour" option always available. | Moderate |
| **Day 14+** | If still free after 2 weeks | Non-intrusive monthly summary in popup footer. "22 hours focused, 487 distractions blocked this month. Imagine what you could do with Pro." | Low |
| **Day 30+** | If still free after 1 month | Permanent small "Go Pro" link in popup footer. Never more aggressive than this. User is retained and happy -- they are a word-of-mouth engine. | Minimal |

**Hard Rule:** NEVER interrupt an active focus session with an upgrade prompt. NEVER show a full-screen interstitial that blocks usage. NEVER downgrade free features after a trial period. NEVER increase paywall pressure for long-term free users.

---

## Appendix B: Data Storage Architecture

All user data is stored locally on-device using Chrome Storage APIs. No data is transmitted to external servers unless the user explicitly opts in to a feature that requires it (cross-device sync, leaderboard, buddy system).

| Data Type | Storage API | Size Estimate | Retention |
|-----------|------------|---------------|-----------|
| Block list + settings | `chrome.storage.local` | < 50 KB | Permanent |
| Session history (free, 7 days) | `chrome.storage.local` | < 100 KB | Auto-pruned daily |
| Session history (Pro, unlimited) | `chrome.storage.local` | ~1 MB/year | Permanent |
| Focus Score + streak data | `chrome.storage.local` | < 10 KB | Permanent |
| Timer state (active session) | `chrome.storage.session` | < 1 KB | Cleared on browser close |
| Pro license status | `chrome.storage.local` | < 1 KB | Permanent |
| Sync data (Pro) | `chrome.storage.sync` | < 100 KB (Chrome limit) | Synced across devices |
| Ambient sound files | Extension bundle (local) | ~5-15 MB total | Permanent (bundled) |
| Pre-built block lists | Extension bundle (local) | < 50 KB | Updated with extension |

**Privacy Guarantee:** Browsing history, URLs visited (beyond blocked-site attempt counts), page content, and personal information are NEVER collected, stored, or transmitted. The extension requests only the minimum permissions required: `declarativeNetRequest`, `storage`, `alarms`, `notifications`, `identity` (Pro, for calendar OAuth only).

---

*Document generated for Phase 02 -- Extension Specification*
*Feed this document to Phase 03 for technical architecture and implementation planning*
