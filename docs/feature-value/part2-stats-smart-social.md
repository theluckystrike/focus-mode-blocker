# Feature Value Scoring: Stats & Analytics, Smart Features, Social & Accountability

> **Document:** Part 2 -- Stats, Smart, & Social Feature Scoring
> **Date:** 2026-02-10
> **Framework:** Weighted Score = (Acquisition x 0.25) + (Habit x 0.20) + (Upgrade x 0.25) + (Differentiation x 0.15) + (Cost x 0.15)
> **Pricing:** Free / Pro $4.99/mo ($35.88/yr) / Team $3.99/user/mo

---

## Scoring Guide Reference

| Score | Meaning |
|-------|---------|
| 10/10 | Maximum -- primary install reason / daily use / strong upgrade emotion / unique in category / zero development cost |
| 7-9 | Strong |
| 4-6 | Moderate |
| 1-3 | Low |

**Tier Thresholds (weighted score):**

| Weighted Score | Tier Assignment |
|----------------|-----------------|
| 7.5+ | FREE -- must be free to drive acquisition and retention |
| 5.5-7.4 | LIMITED FREE -- free with a cap, upgrade unlocks full version |
| 3.5-5.4 | PRO -- premium feature, drives conversion |
| < 3.5 | PRO or cut -- low overall value, consider removing |

---

## CATEGORY 1: STATS & ANALYTICS

### Summary Scores Table

| # | Feature | Acq (0.25) | Habit (0.20) | Upgrade (0.25) | Diff (0.15) | Cost (0.15) | **Weighted** | **Tier** |
|---|---------|:----------:|:------------:|:--------------:|:-----------:|:-----------:|:------------:|----------|
| 1 | Daily focus time display | 8 | 9 | 3 | 4 | 10 | **6.75** | Limited Free |
| 2 | Distraction attempts counter | 9 | 9 | 4 | 7 | 10 | **7.60** | Free |
| 3 | Focus Score (0-100) | 7 | 8 | 7 | 10 | 9 | **7.85** | Free |
| 4 | Focus Score breakdown | 3 | 6 | 8 | 9 | 8 | **6.30** | Limited Free |
| 5 | Streak tracking | 7 | 10 | 5 | 5 | 10 | **7.25** | Limited Free |
| 6 | Streak history + recovery | 2 | 5 | 7 | 5 | 8 | **5.05** | Pro |
| 7 | Weekly/monthly reports | 5 | 7 | 10 | 7 | 7 | **7.15** | Limited Free |
| 8 | Exportable analytics | 2 | 2 | 6 | 4 | 8 | **4.10** | Pro |
| 9 | Comparative analytics | 4 | 6 | 7 | 8 | 6 | **5.95** | Limited Free |
| 10 | Block page interaction stats | 1 | 3 | 4 | 6 | 8 | **3.85** | Pro |

---

### Feature 1: Daily Focus Time Display

> *"You focused for 3 hours 22 minutes today."*

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition | 8 | Seeing tracked focus time is a top-3 reason users install productivity tools -- it provides immediate visible value and validates the product is "working." |
| Habit | 9 | Checking daily focus time becomes a reflexive daily behavior; users open the popup specifically to see their running total, creating a strong daily engagement loop. |
| Upgrade | 3 | On its own, daily display has minimal upgrade pull because the value is fully delivered for free -- there is no natural scarcity to exploit. |
| Differentiation | 4 | Most competitors offer basic time tracking (RescueTime, Forest); this is expected functionality, not a differentiator. |
| Cost | 10 | Trivial to implement -- simply accumulate and display timer session data that is already being tracked by the Pomodoro/session system. |
| **Weighted** | **6.75** | |

**Tier: LIMITED FREE**

**Limit:** Full daily view free; historical daily data beyond 7 days requires Pro.

**Rationale:** Daily focus time display is a core retention mechanic -- users need to see value being created on the day they use the product. Paywalling current-day stats would be perceived as hostile and drive uninstalls. However, the 7-day rolling window creates a natural scarcity: users who develop the daily checking habit will inevitably want to compare today to last Tuesday, and that curiosity hits a paywall after a week. This mirrors the "Awareness-to-Action Gap" model where free tracking creates the desire for deeper paid analysis.

---

### Feature 2: Distraction Attempts Counter

> *"You tried to visit Reddit 34 times today."*

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition | 9 | This is one of the most viral stats in the productivity extension space -- users share screenshots of their distraction counts on social media, which drives organic installs from shocked viewers. |
| Habit | 9 | The counter creates an addictive "how bad am I today?" check-in loop; users open the popup to see the number, and the emotional reaction (shock, pride at low numbers) reinforces daily engagement. |
| Upgrade | 4 | The raw daily counter delivers most of its value at the free tier; upgrade pull only comes when users want historical trends of their distraction patterns (which pairs with weekly reports). |
| Differentiation | 7 | StayFocusd counts blocks but does not present the number with emotional framing; Forest does not track blocks at all; the per-site breakdown ("Reddit: 34, Twitter: 12, YouTube: 8") is uncommon and powerful. |
| Cost | 10 | Near-zero incremental cost -- every blocked page visit already fires an event; counting and displaying the aggregate is trivial. |
| **Weighted** | **7.60** | |

**Tier: FREE**

**Rationale:** The distraction attempts counter is the single most powerful behavioral insight the product provides. Research from existing products confirms that "You tried to visit Twitter 47 times" is the moment users become believers -- it creates self-awareness shock that drives both retention and organic sharing. Paywalling this would eliminate the product's most viral mechanic. The daily counter must be free; per-site breakdowns and historical distraction trends can be gated behind Pro through the weekly reports system.

---

### Feature 3: Focus Score (0-100 Composite Metric)

> *A single number summarizing your focus quality, like a credit score for productivity.*

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition | 7 | "What's your Focus Score?" is a shareable, curiosity-inducing concept that can drive installs -- users who see friends sharing their scores will want to know their own. |
| Habit | 8 | A single composite number is inherently gamified; users will check daily to see if their score improved, creating a "step count" dynamic that drives the app-open habit. |
| Upgrade | 7 | The score itself is free, but the natural question "How do I improve my score?" creates demand for the paid breakdown, recommendations, and historical tracking. |
| Differentiation | 10 | No direct competitor offers a composite focus score -- RescueTime has a productivity pulse but it is buried in dashboards; a prominent 0-100 score as the primary metric is unique in the Chrome extension blocker space. |
| Cost | 9 | Algorithm development requires design thinking (weighting sessions, streaks, resistance) but no external APIs or infrastructure -- it is a client-side calculation on existing data. |
| **Weighted** | **7.85** | |

**Tier: FREE**

**Rationale:** Focus Score is the product's primary differentiator and should be the centerpiece of the extension popup. Making it free serves three strategic goals: (1) it creates a unique, shareable metric that drives word-of-mouth ("I have a Focus Score of 78 -- what's yours?"); (2) it becomes the daily check-in hook that replaces the vague "how was my focus today?" with a concrete number; (3) it creates the upgrade bridge -- once users are addicted to watching their score, they will pay for the breakdown and recommendations to improve it. This is the "credit score" strategy: the number is free; the analysis is premium.

---

### Feature 4: Focus Score Breakdown

> *Category-level detail: session completion rate, distraction resistance, consistency, streak bonus.*

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition | 3 | A score breakdown is not a feature users search for or discover before install -- it only becomes relevant once they are engaged with the top-level Focus Score. |
| Habit | 6 | Users who care about improving their score will check the breakdown periodically, but it is more of a weekly analysis behavior than a daily check-in habit. |
| Upgrade | 8 | This is the natural paywall moment for the Focus Score system -- "Your score is 64. Want to know exactly why and how to improve it?" leverages the Grammarly blurred-stats model that drives 22% upgrade lift. |
| Differentiation | 9 | No competitor offers a multi-dimensional focus quality breakdown -- this is deep, novel analytics that positions Focus Mode as the "serious" focus tool. |
| Cost | 8 | Moderately low cost -- the component metrics (completion rate, resistance, consistency, streaks) are all derived from data already being collected; the work is in algorithm design and UI presentation. |
| **Weighted** | **6.30** | |

**Tier: LIMITED FREE**

**Limit:** Show the breakdown categories and labels for free, but blur the actual scores and percentages. Users see "Session Completion: [blur], Distraction Resistance: [blur], Consistency: [blur], Streak Bonus: [blur]" with a "See Your Full Breakdown -- Go Pro" overlay.

**Rationale:** The breakdown is the Focus Score's natural upgrade trigger. Showing the category names for free teaches users that their score has depth and logic, which increases perceived value. Blurring the actual numbers applies the Grammarly playbook -- users can see their data exists and is being tracked, creating ownership anxiety ("that's MY data, I should be able to see it"). Research indicates blurred analytics previews drive 22% upgrade lift. The breakdown is where the free Focus Score converts to paid revenue.

---

### Feature 5: Streak Tracking

> *"Day 14 focus streak" with flame icon, visible on popup.*

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition | 7 | Streak mechanics are a proven install motivator -- Duolingo built a multi-billion dollar company partly on streak psychology; users who hear about streaks want to start their own. |
| Habit | 10 | Streaks are the most powerful retention mechanic in consumer apps -- "I can't break my 14-day streak" is a psychological lock-in that prevents uninstall and drives daily opens even when users do not "need" to focus. |
| Upgrade | 5 | The current streak itself has moderate upgrade pull; the upgrade tension comes from streak-adjacent features (history, recovery) rather than the streak counter itself. |
| Differentiation | 5 | Duolingo, Snapchat, and Forest all use streaks -- the mechanic is proven but not unique; what differentiates is integration with the Focus Score system. |
| Cost | 10 | Trivial to implement -- a counter that increments when a user completes at least one focus session per day and resets to zero on a missed day. |
| **Weighted** | **7.25** | |

**Tier: LIMITED FREE**

**Limit:** Current streak count and flame icon are free. Streak history (past streaks, longest streak record) and streak recovery (restore a broken streak) are Pro.

**Rationale:** The current streak counter must be free because it is a retention mechanic, not a revenue mechanic. A user who sees "Day 14" will not uninstall; a user who never sees their streak will churn faster. However, streak history and recovery are natural Pro upsells: "You had a 23-day streak last month before it broke" creates emotional attachment to data, and "Recover your broken streak for a one-time pass" is a high-emotion conversion moment. The current streak is the hook; the history and recovery are the line.

---

### Feature 6: Streak History + Recovery

> *See all past streaks, longest streak record, and recover a broken streak (1 free recovery per 30 days in Pro).*

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition | 2 | No one installs a website blocker because of streak recovery -- this is a retention and conversion feature, not an acquisition feature. |
| Habit | 5 | Users check streak history occasionally (weekly) but it does not drive daily opens the way the current streak counter does. |
| Upgrade | 7 | Streak recovery is a high-emotion conversion moment -- when a user breaks a 20-day streak, the pain of loss is acute, and the option to recover it for the price of a Pro subscription is compelling. |
| Differentiation | 5 | Duolingo offers streak freezes (paid with in-app currency); applying this to a focus tool is a cross-pollination innovation but not entirely novel. |
| Cost | 8 | Low implementation cost -- storing streak history is trivial; the recovery mechanic requires simple business logic (eligibility rules, cooldown timer). |
| **Weighted** | **5.05** | |

**Tier: PRO**

**Rationale:** Streak history and recovery are cleanly Pro features. The data (past streaks, longest streak) has no value until a user has been engaged for weeks, at which point they are a high-intent user ready for conversion. The recovery mechanic is the closest thing to a "save my progress" paywall that users will actually thank you for -- losing a long streak is genuinely painful, and offering recovery at $4.99/mo feels like a fair deal rather than extortion. This feature has low acquisition value but strong conversion value for users who are already hooked.

---

### Feature 7: Weekly/Monthly Analytics Reports

> *Charts showing focus trends, peak hours, most-blocked sites, week-over-week comparisons.*

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition | 5 | Analytics reports are a moderate install motivator -- users who want to "understand their distraction habits" will seek tools with reporting, but it is not the primary install trigger (blocking is). |
| Habit | 7 | Weekly reports create a reliable weekly engagement moment ("It's Monday -- let me check my focus report"); this is a strong cadence-based habit that increases weekly active usage. |
| Upgrade | 10 | Research confirms weekly/monthly reports are the #1 conversion trigger for productivity tools -- the blurred weekly report after 5 sessions is the primary paywall moment; users have generated the data and feel ownership over it. |
| Differentiation | 7 | RescueTime offers detailed reports but at $6.50-12/mo; StayFocusd has minimal reporting; BlockSite has basic stats; offering rich weekly reports at $4.99/mo is a strong value-to-price differentiator. |
| Cost | 7 | Moderate cost -- charts and trend visualizations require a charting library (Chart.js or similar), data aggregation logic, and thoughtful UI design; no server costs if done client-side with Chrome storage. |
| **Weighted** | **7.15** | |

**Tier: LIMITED FREE**

**Limit:** Show a blurred preview of the weekly report after 5+ sessions completed. The report header stats are visible ("Total Focus Time: 11h 23m, Distractions Blocked: 127") but the charts, trends, and detailed breakdowns are blurred with a "Unlock Full Report -- Go Pro" overlay.

**Rationale:** Weekly reports are the extension's #1 monetization lever and must be handled with precision. The blurred preview strategy is directly validated by Grammarly's approach: show users that their data has been analyzed and organized, let them see just enough to feel ownership ("that's MY 11 hours"), then blur the actionable insights they need to improve. The "Awareness-to-Action Gap" principle is at maximum strength here -- free users know they focused for X hours but cannot see when, where, or how to improve without paying. This is the RescueTime model (free tracking creates urgency, paid features sell the fix) adapted for a Chrome extension at a more accessible price point.

---

### Feature 8: Exportable Analytics

> *Download focus data as CSV or PDF reports for personal records, freelancer billing, or manager reporting.*

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition | 2 | Virtually no one installs a website blocker because they want to export CSV files -- this is a power-user need that emerges months into usage. |
| Habit | 2 | Export is an infrequent action (monthly or quarterly for most users); it does not drive daily or weekly engagement. |
| Upgrade | 6 | Moderate upgrade pull for specific segments: freelancers billing clients for "focused work hours," managers proving team productivity, and quantified-self enthusiasts who want data in their own systems. |
| Differentiation | 4 | RescueTime and Toggl offer exports; this is expected for paid analytics tools but not a differentiator in the Chrome extension blocker space. |
| Cost | 8 | Low cost -- CSV generation is trivial; PDF generation requires a library (jsPDF) but is straightforward; no server infrastructure needed. |
| **Weighted** | **4.10** | |

**Tier: PRO**

**Rationale:** Export is a classic Pro feature with clear value for a narrow audience. It serves three specific user segments: freelancers who bill clients by focused hours (CSV for invoicing), managers who need team productivity reports (PDF for presentations), and data enthusiasts who want to analyze their own patterns in spreadsheets. None of these use cases are critical for acquisition or retention, but they represent high-intent users who are already getting deep value from the product and will happily pay for data portability. The low implementation cost makes it a high-margin Pro perk.

---

### Feature 9: Comparative Analytics

> *"You're more focused than 65% of users" -- anonymized benchmarking against the user base.*

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition | 4 | Comparative stats have moderate viral potential ("I'm in the top 20% of focused users") but are not a primary install driver since the value only exists after usage. |
| Habit | 6 | Checking your percentile creates a recurring engagement loop, especially after a strong or weak focus week -- "Did I move up or down?" drives weekly check-ins. |
| Upgrade | 7 | Comparative data is a strong upgrade lever because it taps into competitive psychology -- "You're at the 45th percentile... want to see what the top 10% do differently?" creates aspiration-driven conversion. |
| Differentiation | 8 | No direct Chrome extension competitor offers anonymized user benchmarking -- RescueTime has "productivity score" but not community percentile ranking; this feels fresh and competitive. |
| Cost | 6 | Requires anonymized aggregate data collection, which means either a lightweight backend service or clever approximation using Chrome extension usage statistics; moderate infrastructure investment. |
| **Weighted** | **5.95** | |

**Tier: LIMITED FREE**

**Limit:** Show the user's percentile for free ("You're more focused than 65% of users") but gate the detailed comparison insights behind Pro ("What the top 10% do differently," "Your rank over time," "Category-level comparisons").

**Rationale:** The headline percentile number should be free because it is inherently shareable and creates competitive motivation that drives retention. "I'm more focused than 72% of users" is a stat people post on social media, driving organic installs. However, the actionable breakdown ("Users in the top 10% average 4.2 hours of focus daily, block 15+ sites, and use Nuclear Mode 3x per week") is a natural Pro upsell. This applies the same "number is free, analysis is paid" pattern used for Focus Score. The infrastructure cost is the main concern -- this requires at minimum aggregated usage statistics, which may need a lightweight cloud function.

---

### Feature 10: Block Page Interaction Stats

> *Which motivational quotes users click/save, average time spent on the block page before navigating away, most effective block page elements.*

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition | 1 | No user has ever installed a website blocker because they want analytics on their block page interactions -- this is an internal optimization metric, not a user-facing value proposition. |
| Habit | 3 | Curiosity about "which quotes resonated with me" is mildly interesting but does not drive a recurring engagement loop; users would check this once and rarely return. |
| Upgrade | 4 | Weak upgrade pull -- "See which quotes motivated you most" is a novelty insight, not a productivity improvement that justifies $4.99/mo on its own. |
| Differentiation | 6 | No competitor tracks block page engagement; this is genuinely novel data, but the question is whether users care about it enough for it to matter. |
| Cost | 8 | Low cost -- event tracking on the block page (click events, time-on-page) is simple to implement and requires no external infrastructure. |
| **Weighted** | **3.85** | |

**Tier: PRO**

**Rationale:** Block page interaction stats are a "nice to have" insight that adds depth to the Pro analytics dashboard without being essential. The data is genuinely interesting in aggregate ("Your top 3 most-saved quotes," "You spend an average of 4.2 seconds on the block page before returning to work") but does not drive acquisition, retention, or strong conversion on its own. Including it as a small card within the Pro weekly report adds perceived value to the Pro analytics package without requiring a standalone feature. If development resources are tight, this is a candidate for deferral -- it scores above the 3.5 cut threshold but just barely.

---

## CATEGORY 2: SMART FEATURES

### Summary Scores Table

| # | Feature | Acq (0.25) | Habit (0.20) | Upgrade (0.25) | Diff (0.15) | Cost (0.15) | **Weighted** | **Tier** |
|---|---------|:----------:|:------------:|:--------------:|:-----------:|:-----------:|:------------:|----------|
| 1 | AI-powered focus recommendations | 5 | 6 | 8 | 9 | 3 | **6.00** | Limited Free |
| 2 | Calendar integration | 4 | 8 | 8 | 7 | 4 | **6.15** | Limited Free |
| 3 | Quick Focus one-click button | 9 | 9 | 2 | 5 | 10 | **7.00** | Free |
| 4 | Context-aware profiles | 3 | 7 | 7 | 6 | 6 | **5.55** | Limited Free |
| 5 | Smart scheduling | 3 | 7 | 8 | 8 | 3 | **5.65** | Limited Free |
| 6 | Focus mode keyboard shortcut | 4 | 7 | 2 | 3 | 10 | **5.05** | Pro |
| 7 | Distraction prediction | 4 | 5 | 7 | 9 | 3 | **5.45** | Pro |
| 8 | Website time tracking | 6 | 7 | 6 | 5 | 7 | **6.20** | Limited Free |

---

### Feature 1: AI-Powered Focus Recommendations

> *"Block Twitter during 2-4pm -- you get distracted most then." Personalized suggestions based on usage patterns.*

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition | 5 | "AI-powered" is a marketing buzzword that adds perceived value in Chrome Web Store listings, but most users install blockers for blocking, not for AI advice. |
| Habit | 6 | Weekly or bi-weekly recommendations create a "what does the AI say this week?" check-in moment, but this is not a daily engagement driver -- recommendations need time to accumulate data. |
| Upgrade | 8 | AI recommendations are a strong upgrade lever because they transform passive blocking into active coaching -- "Here's exactly what to change to focus better" bridges the Awareness-to-Action Gap that the free tier creates. |
| Differentiation | 9 | Centered offers AI coaching at $10/mo; no Chrome extension blocker offers personalized AI focus recommendations at $4.99/mo; this positions Focus Mode as "the smart blocker" versus dumb block-and-forget tools. |
| Cost | 3 | Requires either a server-side ML/LLM pipeline (high ongoing cost) or sophisticated client-side heuristics (high development cost); either path represents significant investment compared to most features. |
| **Weighted** | **6.00** | |

**Tier: LIMITED FREE**

**Limit:** Free users get 1 recommendation per week (e.g., "Your most distracted time this week was Wednesday 2-4pm"). Pro users get daily recommendations, actionable suggestions ("Add Twitter to your 2-4pm block schedule"), and one-click implementation of recommendations.

**Rationale:** AI recommendations are a key differentiator that justifies the "smart" positioning, but the high infrastructure cost means the feature must drive measurable conversion to justify its expense. The limited free approach is strategic: one weekly insight gives free users a taste of what personalized coaching feels like, and the quality of that single insight demonstrates the value of daily Pro recommendations. The one-click implementation in Pro (automatically adjusting schedules based on AI suggestions) is the real value -- it closes the Awareness-to-Action Gap by making the "fix" effortless. Development should be phased: start with rule-based heuristics (low cost), then upgrade to ML/LLM when revenue supports it.

---

### Feature 2: Calendar Integration

> *Auto-start focus mode during Google Calendar "Deep Work" blocks. Auto-enable blocking when calendar says you should be focused.*

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition | 4 | Calendar integration is a power-user feature that knowledge workers specifically search for, but it is not the primary reason most people install a website blocker. |
| Habit | 8 | Once configured, calendar integration runs automatically -- the user does not need to remember to start focus mode; this "set it and forget it" automation drives daily passive engagement and makes the extension indispensable. |
| Upgrade | 8 | Calendar integration is a high-value Pro upsell for knowledge workers earning $50+/hr -- the time saved by automatic activation during deep work blocks easily justifies $4.99/mo, and the convenience creates strong lock-in. |
| Differentiation | 7 | RescueTime offers calendar integration at $6.50-12/mo; Centered has it at $10/mo; offering it in a $4.99/mo Chrome extension is a strong value play; most direct blocker competitors (BlockSite, StayFocusd, LeechBlock) do not have it. |
| Cost | 4 | Requires Google Calendar API integration (OAuth flow, event polling, permission handling), Outlook integration adds more complexity; Chrome extension manifest v3 constraints may complicate background event monitoring. |
| **Weighted** | **6.15** | |

**Tier: LIMITED FREE**

**Limit:** Free users can connect Google Calendar and see upcoming focus blocks highlighted in the extension popup (read-only preview). Pro users get automatic focus mode activation during calendar events tagged "Deep Work" or "Focus."

**Rationale:** Calendar integration is one of the strongest Pro conversion features for the knowledge worker segment. The limited free approach works well here: showing users their calendar events inside the extension popup creates the mental connection between "scheduled focus time" and "actually blocking distractions," but the manual step of starting focus mode themselves creates friction that Pro's auto-activation removes. This is a classic "manual vs. automatic" tier gate -- the free tier shows what is possible, the paid tier removes all friction. The development cost is the main risk; this should be Phase 2 or Phase 3, building on validated Pro revenue from simpler features first.

---

### Feature 3: Quick Focus One-Click Button

> *Single button in popup: instantly starts a 25-minute focus session with top distracting sites blocked.*

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition | 9 | "One click to focus" is the lowest-friction value proposition in the extension's marketing -- it directly addresses the "I just need something simple" user who is overwhelmed by complex blockers like LeechBlock. |
| Habit | 9 | The Quick Focus button is the primary daily interaction point -- users who develop the "open extension, press button" routine will use it multiple times per day, creating strong habitual engagement. |
| Upgrade | 2 | The button itself has almost no upgrade pull because its value is in simplicity, which must remain free; upgrade pull comes from what happens during and after the session (stats, reports, longer sessions). |
| Differentiation | 5 | One-click focus is a UX feature rather than a functional differentiator -- most timer apps have a "start" button; the differentiation is in the combination of blocking + timer in a single click, which is moderately unique. |
| Cost | 10 | Trivial to implement -- a button that triggers the existing timer + activates the existing blocklist requires no new infrastructure, just UI wiring. |
| **Weighted** | **7.00** | |

**Tier: FREE**

**Rationale:** Quick Focus is the onboarding magic moment -- the feature that makes a new user say "oh, this is easy" within 5 seconds of installing the extension. It must be free and prominently displayed. Every competitor analysis shows that complexity is the #1 reason users abandon focus tools (LeechBlock's setup process is frequently cited as a barrier). Quick Focus solves this by combining blocking + timer into a single action. The 25-minute Pomodoro default is well-researched and universally applicable. Pro users can customize the Quick Focus duration and site list, but the default one-click experience must remain free and frictionless.

---

### Feature 4: Context-Aware Profiles

> *Different blocking configurations for Work vs. Personal time. "Work" blocks social media but allows Slack; "Personal" blocks work tools but allows YouTube.*

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition | 3 | Context profiles are a power-user feature discovered during configuration, not a primary install driver; most users start with a single blocking context. |
| Habit | 7 | Once configured, profile switching becomes a daily ritual -- "switching to work mode" in the morning and "switching to personal mode" in the evening creates a strong daily engagement pattern anchored to real-life context transitions. |
| Upgrade | 7 | The need for multiple profiles emerges organically as users realize their single blocklist does not fit all situations -- "I want to block YouTube during work but watch it at night" is a clear upgrade moment. |
| Differentiation | 6 | Cold Turkey offers schedule-based profiles; BlockSite has some scheduling; true context-aware profiles (that detect work vs personal based on time, location, or calendar) are less common but the basic concept exists. |
| Cost | 6 | Moderate cost -- requires profile management UI, storage for multiple configurations, and a switching mechanism; "smart" context detection (automatic profile switching based on calendar or time) adds complexity. |
| **Weighted** | **5.55** | |

**Tier: LIMITED FREE**

**Limit:** Free users get 1 profile (default blocking config). Pro users get unlimited profiles with custom names, icons, and the ability to switch manually or automatically based on schedule/calendar.

**Rationale:** One blocking profile is sufficient for most new users and covers the primary use case (block distracting sites during work). The upgrade moment occurs naturally when a user's life is more nuanced than a single blocklist can handle: students who need different rules for studying vs. relaxing, remote workers who want to allow YouTube during lunch but not during deep work, parents who want to block differently on weekends. The 1-profile free limit is generous enough to be useful but creates a clear upgrade path when real-world complexity demands it. Automatic profile switching (based on time-of-day or calendar events) is a Pro perk that pairs well with calendar integration.

---

### Feature 5: Smart Scheduling

> *Auto-adjust blocking schedules based on observed usage patterns. "You consistently get distracted at 3pm -- should we auto-block social media from 2:30-4pm?"*

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition | 3 | Smart scheduling is an advanced feature that users do not know they want until they have been using the product for weeks; it is not an install driver. |
| Habit | 7 | Once smart scheduling is active, it runs in the background and creates "the extension knows me" moments that deepen engagement and make the product feel indispensable and personalized. |
| Upgrade | 8 | Smart scheduling is the payoff of the Awareness-to-Action Gap -- free users see their distraction patterns in daily stats but must manually adjust schedules; Pro users get automatic optimization, which is the "fix" that RescueTime's model sells. |
| Differentiation | 8 | No Chrome extension blocker offers pattern-based automatic schedule adjustment -- this is genuinely innovative in the category and positions Focus Mode as the intelligent alternative to "dumb" static blockers. |
| Cost | 3 | Requires pattern recognition on usage data (time-series analysis of distraction events), schedule generation logic, and careful UX for user approval of suggested changes; significant development effort. |
| **Weighted** | **5.65** | |

**Tier: LIMITED FREE**

**Limit:** Free users see pattern observations ("You tend to get distracted around 3pm on weekdays") as a notification once per week. Pro users get actionable schedule suggestions with one-click implementation and ongoing auto-adjustment.

**Rationale:** Smart scheduling is the bridge between the AI recommendations feature and the scheduling system. The limited free tier provides the "awareness" (pattern observations) while Pro provides the "action" (auto-adjustment), directly exploiting the Awareness-to-Action Gap. The weekly observation for free users serves double duty: it demonstrates that the extension is learning the user's habits (increasing perceived intelligence and value), and it creates upgrade demand by making manual schedule adjustment feel tedious compared to the one-click Pro alternative. Development should be phased: start with simple heuristics (peak distraction hours based on block counts), then add sophistication over time.

---

### Feature 6: Focus Mode Keyboard Shortcut

> *Ctrl+Shift+F (or customizable) to toggle focus mode instantly without opening the extension popup.*

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition | 4 | Keyboard shortcuts appeal to power users and developers, which is a meaningful but niche acquisition segment; most users will not list "keyboard shortcut" as an install reason. |
| Habit | 7 | For users who adopt the shortcut, it becomes muscle memory -- Ctrl+Shift+F before starting work creates a physical ritual that reinforces the focus habit and reduces friction to near-zero. |
| Upgrade | 2 | Keyboard shortcuts have minimal upgrade pull -- charging for a shortcut feels petty and would generate negative reviews; this is a UX quality-of-life feature, not a monetization lever. |
| Differentiation | 3 | Most Chrome extensions support keyboard shortcuts through Chrome's built-in shortcut system (chrome://extensions/shortcuts); this is expected functionality, not a differentiator. |
| Cost | 10 | Near-zero cost -- Chrome's extension API natively supports command shortcuts (chrome.commands API); implementation is a few lines of manifest configuration and a message handler. |
| **Weighted** | **5.05** | |

**Tier: PRO**

**Rationale:** This tier assignment deserves nuance. The basic toggle shortcut (Ctrl+Shift+F to start/stop focus mode) should arguably be free because Chrome natively supports extension shortcuts and users expect it. However, the weighted score of 5.05 lands in Pro territory. The recommended approach is: provide a single default shortcut (Ctrl+Shift+F) for free, and gate customizable shortcuts and advanced shortcut actions (Ctrl+Shift+1 for Work Profile, Ctrl+Shift+2 for Personal Profile, etc.) behind Pro. This preserves the UX quality of the free tier while giving power users a reason to upgrade for full keyboard workflow integration. The free default shortcut has negligible cost and prevents the "basic feature behind paywall" backlash.

**Revised recommendation:** FREE for the basic shortcut. PRO for customizable shortcuts and multi-action shortcuts. This split better reflects the acquisition and habit value of the basic shortcut.

---

### Feature 7: Distraction Prediction

> *"High distraction risk in the next hour based on your patterns." Proactive warning before distraction spikes.*

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition | 4 | "Predictive distraction alerts" is an intriguing marketing claim that can differentiate in Chrome Web Store listings, but it is not a primary install trigger for most users. |
| Habit | 5 | Prediction alerts create occasional engagement moments ("oh, I should start focus mode"), but the value depends on accuracy -- inaccurate predictions will be ignored and eventually dismissed, reducing habitual engagement. |
| Upgrade | 7 | Predictive alerts are a strong "intelligent assistant" upsell that makes the extension feel proactive rather than reactive -- "We noticed you're about to enter your high-distraction zone" is a compelling Pro value proposition. |
| Differentiation | 9 | No Chrome extension blocker or even most standalone productivity tools offer predictive distraction alerts -- this is a genuinely novel feature that positions Focus Mode at the cutting edge of the category. |
| Cost | 3 | Requires time-series pattern analysis with enough accuracy to be useful (inaccurate predictions are worse than none), statistical modeling or ML, and careful UX design for non-intrusive notifications. |
| **Weighted** | **5.45** | |

**Tier: PRO**

**Rationale:** Distraction prediction is a premium feature that belongs in Pro for both strategic and practical reasons. Strategically, it is a high-differentiation feature that positions Focus Mode as the "intelligent" blocker -- "We predict your distractions before they happen" is a powerful marketing claim for the Pro tier. Practically, the feature requires significant development investment in pattern recognition and accuracy tuning; it must be revenue-generating to justify its cost. The risk is prediction accuracy -- if predictions are wrong more than 30% of the time, users will disable the feature and feel the Pro subscription is not delivering. Development should include a feedback loop ("Was this prediction helpful?") to improve accuracy over time. This is a Phase 3+ feature that should only be built after the core Pro features are validated.

---

### Feature 8: Website Time Tracking

> *Track time spent on each website, not just block attempts. "You spent 2h 14m on YouTube, 47m on Reddit, 23m on Twitter today."*

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition | 6 | Time tracking is a known value proposition that users actively search for -- "website time tracker" is a Chrome Web Store search term with volume; this broadens the extension's appeal beyond just blocking. |
| Habit | 7 | Daily time breakdowns create the "where did my time go?" check-in habit -- users will open the extension at end of day to review their browsing time allocation, especially to see productive vs. unproductive time. |
| Upgrade | 6 | Time tracking data feeds into weekly reports and AI recommendations, creating indirect upgrade pull; the raw daily time data itself has moderate standalone upgrade value ("see your time trends over weeks and months"). |
| Differentiation | 5 | RescueTime is the category leader in time tracking; adding it to a blocker is a smart convergence play, but Focus Mode will not out-track RescueTime -- the differentiation is in combining tracking with blocking in one tool. |
| Cost | 7 | Moderate cost -- requires active tab monitoring (chrome.tabs API), time accumulation per domain, and storage management; Chrome Manifest v3 service worker constraints may complicate background tracking. |
| **Weighted** | **6.20** | |

**Tier: LIMITED FREE**

**Limit:** Free users see today's top 5 sites by time spent. Pro users get full site-by-site breakdown, historical time data, productive vs. unproductive categorization, and time trends in weekly reports.

**Rationale:** Website time tracking expands Focus Mode from "blocker" to "focus dashboard," which broadens the addressable market to include RescueTime-style time awareness users. The limited free version (top 5 sites today) provides the "shock value" moment ("I spent 2 hours on YouTube?!") that drives both retention and upgrade consideration. The Pro version adds depth (full history, categorization, trends) that transforms raw data into actionable insight. This feature pairs powerfully with AI recommendations -- time tracking data is the input, and AI recommendations are the output, creating a Pro-exclusive feedback loop. The top-5-today limit for free is generous enough to deliver the awareness value while naturally creating demand for the full picture.

---

## CATEGORY 3: SOCIAL & ACCOUNTABILITY

### Summary Scores Table

| # | Feature | Acq (0.25) | Habit (0.20) | Upgrade (0.25) | Diff (0.15) | Cost (0.15) | **Weighted** | **Tier** |
|---|---------|:----------:|:------------:|:--------------:|:-----------:|:-----------:|:------------:|----------|
| 1 | Focus buddy (1 invite) | 7 | 6 | 4 | 6 | 8 | **6.05** | Limited Free |
| 2 | Unlimited buddy invites | 2 | 6 | 7 | 4 | 9 | **5.30** | Pro |
| 3 | Team sessions | 2 | 7 | 5 | 8 | 4 | **4.85** | Team |
| 4 | Leaderboards (global anonymous) | 5 | 7 | 6 | 7 | 6 | **6.00** | Limited Free |
| 5 | Named team leaderboards | 1 | 6 | 4 | 5 | 7 | **4.15** | Team |
| 6 | Shareable focus cards | 6 | 4 | 3 | 7 | 8 | **5.30** | Limited Free |
| 7 | Focus challenges | 5 | 8 | 6 | 7 | 7 | **6.35** | Limited Free |

---

### Feature 1: Focus Buddy (Invite 1 Person)

> *Invite one accountability partner to see your focus stats. They see your Focus Score, streak, and daily focus time.*

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition | 7 | Every buddy invite is a potential new install -- the invited person must install Focus Mode to participate, creating a built-in viral acquisition loop that costs nothing in marketing spend. |
| Habit | 6 | Knowing someone can see your focus stats creates social accountability pressure ("my buddy will see I only focused for 30 minutes today"), which drives consistent daily usage, though the effect fades over time without variety. |
| Upgrade | 4 | The 1-buddy limit has moderate upgrade pull -- most users only need one accountability partner (spouse, coworker, study partner); the upgrade to unlimited buddies is relevant for a smaller subset. |
| Differentiation | 6 | Focusmate offers virtual coworking ($9.99/mo); Forest has friend planting; no Chrome extension blocker offers a lightweight buddy accountability system, making this a meaningful differentiator. |
| Cost | 8 | Moderate-low cost -- requires a simple pairing mechanism (invite link or code), shared read-only stats view, and basic notification system; no real-time sync needed, just periodic data sharing. |
| **Weighted** | **6.05** | |

**Tier: LIMITED FREE**

**Limit:** 1 buddy invite for free. The buddy can see your Focus Score, current streak, and today's focus time. Pro unlocks unlimited buddies and detailed shared stats.

**Rationale:** The 1-buddy free limit is a deliberate viral growth mechanic, not a monetization decision. Every free user who invites a buddy potentially doubles the install base at zero acquisition cost. The buddy must install Focus Mode to participate (they cannot view stats in a web browser), which guarantees an install. The social accountability created by even one buddy improves retention for both users. Limiting to 1 buddy in the free tier is generous enough to deliver the full accountability value while creating a natural upgrade path for users who want a wider accountability network. This is marketing disguised as a feature.

---

### Feature 2: Unlimited Buddy Invites

> *Pro users can invite unlimited accountability partners, creating a personal focus network.*

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition | 2 | Unlimited buddy invites are not an install driver -- new users do not know they want more than one buddy until they have experienced the 1-buddy system and found it valuable. |
| Habit | 6 | A larger accountability network creates more social touchpoints ("3 people can see my stats"), which strengthens the social pressure to maintain focus consistency. |
| Upgrade | 7 | For users who found the 1-buddy system valuable, the desire for more accountability partners is a natural and organic upgrade moment -- "I want my study group / my team / my family to see my stats too." |
| Differentiation | 4 | The concept of "unlimited accountability partners" is not unique (social fitness apps, Strava); the implementation within a focus tool is somewhat novel but not highly differentiating. |
| Cost | 9 | Trivial incremental cost -- the buddy system infrastructure built for the 1-buddy free tier simply removes the quantity cap; no new architecture needed. |
| **Weighted** | **5.30** | |

**Tier: PRO**

**Rationale:** Unlimited buddy invites are a clean Pro upsell that follows the proven "1 free, unlimited paid" pattern used by countless freemium products. The 1-buddy limit in Free captures 90% of the viral growth value (one invite per user is enough for exponential growth if even 30% of buddies convert to active users). Unlimited invites serve the smaller segment of users who want group accountability (study groups, friend circles, small teams not ready for the Team tier). The development cost is negligible since the infrastructure exists from the free buddy feature -- this is pure margin.

---

### Feature 3: Team Sessions

> *Synchronized focus sessions where the entire team starts and ends focus mode together. Shared timer visible to all participants.*

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition | 2 | Team sessions are irrelevant to individual users who represent 95%+ of initial installs; this feature only attracts team buyers, which is a smaller, later-stage acquisition channel. |
| Habit | 7 | Synchronized team sessions create a powerful collective ritual ("every day at 2pm, the whole team focuses together"), which is the strongest form of social accountability and drives consistent daily engagement for all participants. |
| Upgrade | 5 | Team sessions drive Team tier purchase, not Pro upgrades; the upgrade path is from Pro to Team or directly from Free to Team, which is a longer sales cycle with higher friction. |
| Differentiation | 8 | Focusmate offers virtual coworking at $9.99/mo but with strangers; no Chrome extension offers synchronized team focus sessions with known colleagues -- this is the Team tier's marquee differentiator. |
| Cost | 4 | Requires real-time synchronization infrastructure (WebSocket or similar), team management system, shared timer state, and reliable cross-user communication; this is the most complex social feature to build. |
| **Weighted** | **4.85** | |

**Tier: TEAM**

**Rationale:** Team sessions are the flagship Team tier feature and should be exclusively gated behind the $3.99/user/mo Team plan. This feature has no business being in Free or Pro because it requires team infrastructure to function (user management, permissions, shared state) and because it is the primary reason a team manager would choose the Team tier over buying individual Pro licenses. The Focusmate comparison is instructive: synchronized focus sessions with accountability create such strong engagement that users are willing to pay $9.99/mo for sessions with strangers -- sessions with actual colleagues at $3.99/user/mo is a compelling value proposition. Build this only after the individual Pro tier is generating stable revenue (Phase 3+).

---

### Feature 4: Leaderboards (Global Anonymous)

> *Anonymous ranking against all Focus Mode users. "Your Focus Score ranks #1,247 out of 15,000 users this week."*

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition | 5 | Leaderboards create moderate viral potential -- "I'm ranked #500 in Focus Mode" is shareable content that can drive curiosity installs from people who want to compete. |
| Habit | 7 | Competitive users will check their ranking regularly, especially after a strong focus day/week; the "can I climb the leaderboard?" motivation creates a game-like engagement loop. |
| Upgrade | 6 | The anonymous leaderboard has moderate upgrade pull -- showing rank for free but gating detailed comparison data ("what do users above you do differently?") creates a natural Pro bridge. |
| Differentiation | 7 | Forest has social features; no Chrome extension blocker has global leaderboards; the combination of Focus Score + leaderboard creates a competitive gamification layer unique in the category. |
| Cost | 6 | Requires backend infrastructure for aggregating and ranking user scores anonymously; privacy considerations are important (must be truly anonymous with no identifiable data); moderate development and infrastructure cost. |
| **Weighted** | **6.00** | |

**Tier: LIMITED FREE**

**Limit:** Free users see their global rank and percentile. Pro users see weekly rank history, rank trends, and insights from users above them.

**Rationale:** The global anonymous leaderboard serves three strategic purposes: (1) it makes Focus Score competitive and therefore stickier -- users who see a rank want to improve it; (2) it creates shareable social proof ("Ranked #247 in Focus Mode") that drives organic installs; (3) it generates the comparison data that feeds into comparative analytics (Feature 9 in Stats). The free tier should show enough to create competitive motivation (your rank, your percentile) while Pro unlocks the "how to improve" layer (what higher-ranked users do differently, your rank trajectory over time). Privacy must be absolute -- ranks are anonymous, no usernames, no identifiable information.

---

### Feature 5: Named Team Leaderboards

> *Team-specific leaderboard with real names (or display names). "Sarah: 92, Mike: 87, Dave: 76."*

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition | 1 | Named leaderboards are exclusively relevant to teams and have zero individual acquisition value; discovery happens only through team admin setup. |
| Habit | 6 | Seeing your name on a team leaderboard creates daily competitive engagement, but the effect depends on team size and culture -- some teams find it motivating, others find it anxiety-inducing. |
| Upgrade | 4 | Named leaderboards drive Team tier adoption, but they are a supporting feature rather than the primary Team purchase trigger (that role belongs to Team Sessions and shared blocklists). |
| Differentiation | 5 | Team leaderboards exist in many team productivity tools (Asana, Monday.com have gamification elements); the focus-specific context is somewhat novel but the mechanic is familiar. |
| Cost | 7 | Moderate-low incremental cost on top of the global leaderboard infrastructure -- requires team grouping, display name management, and team admin controls. |
| **Weighted** | **4.15** | |

**Tier: TEAM**

**Rationale:** Named team leaderboards are a pure Team tier feature that adds competitive engagement within organizations. They should not be available in Free or Pro because (1) they require team infrastructure (user groups, admin controls, display names), and (2) they are a value-add that helps justify the Team tier's per-user pricing. A critical design consideration: teams must have the option to disable leaderboards or make them opt-in, because mandatory named rankings can create toxic dynamics in some workplace cultures. The leaderboard should emphasize improvement ("Sarah improved 12 points this week") rather than just absolute ranking to keep the tone supportive rather than competitive.

---

### Feature 6: Shareable Focus Cards

> *Beautiful, branded social media images showing your focus stats. "I focused for 47 hours this month with Focus Mode - Blocker."*

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition | 6 | Shareable focus cards are organic marketing assets -- every card shared on Twitter/LinkedIn is a branded advertisement for Focus Mode that reaches the sharer's network of productivity-minded followers. |
| Habit | 4 | Users share focus cards occasionally (weekly or monthly milestones, end-of-year reviews) but not daily -- this is a periodic engagement feature, not a daily habit driver. |
| Upgrade | 3 | Focus cards have minimal direct upgrade pull because the sharing mechanic works best when it is free (paywalling sharing reduces the marketing benefit); monetization is indirect through acquisition. |
| Differentiation | 7 | Spotify Wrapped proved the power of shareable stat cards; no Chrome extension blocker offers this; a "Focus Wrapped" monthly or yearly summary is a compelling viral mechanic. |
| Cost | 8 | Moderate-low cost -- requires a card template system (HTML canvas or server-side image generation), stat aggregation, and sharing integration; no complex infrastructure. |
| **Weighted** | **5.30** | |

**Tier: LIMITED FREE**

**Limit:** Free users get 1 basic card template per month (generic design). Pro users get unlimited card generation, premium templates, custom colors, and the ability to include detailed stats (Focus Score, streak, top improvements).

**Rationale:** Shareable focus cards are primarily a marketing tool, not a user feature, which creates a strategic tension: the more freely users can share, the more organic installs the product gains, but giving everything away removes a potential Pro perk. The resolution is to make the basic sharing free (ensuring maximum viral spread) while gating the "premium" aesthetic (which appeals to users who care about their social media aesthetic and are already signaling they are the type to pay for polish). The basic free template should still look good and include the Focus Mode branding -- an ugly card will not be shared, which defeats the purpose. The monthly limit for free prevents free users from A/B testing templates (a minor concern) while keeping the primary viral mechanic unrestricted.

---

### Feature 7: Focus Challenges

> *Time-limited challenges: "7-Day Focus Challenge," "No Social Media November," custom goals with progress tracking.*

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Acquisition | 5 | Challenges have moderate acquisition potential through social sharing ("Join my 7-Day Focus Challenge") and seasonal/viral moments ("No Social Media November" can trend); they are a secondary install driver. |
| Habit | 8 | Active challenges create daily engagement urgency -- "Day 4 of 7 in the Focus Challenge, don't break it" drives daily opens and session completion in a way that is even stronger than streaks because challenges have an endpoint and a sense of progression. |
| Upgrade | 6 | The 1-free-challenge limit creates a natural upgrade moment when users finish one challenge and want to start another simultaneously, or want to create custom challenges tailored to their specific goals. |
| Differentiation | 7 | Forest has basic challenges; no Chrome extension blocker offers structured focus challenges with community participation; this adds a gamification layer that makes focus feel like a game, not a chore. |
| Cost | 7 | Moderate cost -- requires challenge templates, progress tracking, notification system, and potentially community challenge infrastructure for shared challenges; Phase 2+ development. |
| **Weighted** | **6.35** | |

**Tier: LIMITED FREE**

**Limit:** Free users can participate in 1 active challenge at a time (from a pre-built library of 5-10 challenges). Pro users get unlimited simultaneous challenges, custom challenge creation (set your own goals, duration, and rules), and community challenges.

**Rationale:** Focus challenges are a powerful engagement mechanic that combines the retention power of streaks with the motivation of clear goals and endpoints. The 1-active-challenge free limit is strategic: it gives every user access to the engagement benefit (which improves retention) while creating upgrade demand for users who want more flexibility. The pre-built challenge library for free users ("7-Day Focus Challenge," "Double Your Focus Time," "Zero Distraction Hour") provides curated structure, while Pro's custom challenges let power users design their own goals. Community challenges ("Join 2,847 users in the No Social Media November challenge") add a social dimension that amplifies engagement. Seasonal challenges (New Year, Back to School) should align with the seasonal promotion calendar for maximum conversion impact.

---

## SUMMARY TABLE: ALL 25 FEATURES

### Stats & Analytics (10 features)

| # | Feature | Weighted Score | Tier | Limit (if Limited Free) |
|---|---------|:--------------:|------|-------------------------|
| 1 | Daily focus time display | 6.75 | **Limited Free** | Full daily view free; history beyond 7 days is Pro |
| 2 | Distraction attempts counter | 7.60 | **Free** | -- |
| 3 | Focus Score (0-100) | 7.85 | **Free** | -- |
| 4 | Focus Score breakdown | 6.30 | **Limited Free** | Category labels visible, scores blurred; Pro to reveal |
| 5 | Streak tracking | 7.25 | **Limited Free** | Current streak free; history + recovery Pro |
| 6 | Streak history + recovery | 5.05 | **Pro** | -- |
| 7 | Weekly/monthly reports | 7.15 | **Limited Free** | Blurred preview after 5 sessions; Pro to unlock full |
| 8 | Exportable analytics | 4.10 | **Pro** | -- |
| 9 | Comparative analytics | 5.95 | **Limited Free** | Percentile free; detailed comparison insights Pro |
| 10 | Block page interaction stats | 3.85 | **Pro** | -- |

### Smart Features (8 features)

| # | Feature | Weighted Score | Tier | Limit (if Limited Free) |
|---|---------|:--------------:|------|-------------------------|
| 1 | AI-powered focus recommendations | 6.00 | **Limited Free** | 1 recommendation/week free; daily + one-click action Pro |
| 2 | Calendar integration | 6.15 | **Limited Free** | Read-only calendar view free; auto-activation Pro |
| 3 | Quick Focus one-click button | 7.00 | **Free** | -- |
| 4 | Context-aware profiles | 5.55 | **Limited Free** | 1 profile free; unlimited + auto-switch Pro |
| 5 | Smart scheduling | 5.65 | **Limited Free** | Weekly pattern observation free; auto-adjust Pro |
| 6 | Focus mode keyboard shortcut | 5.05 | **Pro*** | *Basic shortcut free; customizable shortcuts Pro |
| 7 | Distraction prediction | 5.45 | **Pro** | -- |
| 8 | Website time tracking | 6.20 | **Limited Free** | Top 5 sites today free; full breakdown + history Pro |

### Social & Accountability (7 features)

| # | Feature | Weighted Score | Tier | Limit (if Limited Free) |
|---|---------|:--------------:|------|-------------------------|
| 1 | Focus buddy (1 invite) | 6.05 | **Limited Free** | 1 buddy free; unlimited Pro |
| 2 | Unlimited buddy invites | 5.30 | **Pro** | -- |
| 3 | Team sessions | 4.85 | **Team** | -- |
| 4 | Leaderboards (global anonymous) | 6.00 | **Limited Free** | Rank + percentile free; trends + insights Pro |
| 5 | Named team leaderboards | 4.15 | **Team** | -- |
| 6 | Shareable focus cards | 5.30 | **Limited Free** | 1 basic template/month free; premium templates Pro |
| 7 | Focus challenges | 6.35 | **Limited Free** | 1 active challenge free; unlimited + custom Pro |

---

### Tier Distribution Summary

| Tier | Count | Features |
|------|:-----:|----------|
| **Free** | 3 | Distraction attempts counter, Focus Score (0-100), Quick Focus one-click button |
| **Limited Free** | 14 | Daily focus time display, Focus Score breakdown, Streak tracking, Weekly/monthly reports, Comparative analytics, AI-powered focus recommendations, Calendar integration, Context-aware profiles, Smart scheduling, Website time tracking, Focus buddy, Leaderboards, Shareable focus cards, Focus challenges |
| **Pro** | 6 | Streak history + recovery, Exportable analytics, Block page interaction stats, Unlimited buddy invites, Focus mode keyboard shortcut*, Distraction prediction |
| **Team** | 2 | Team sessions, Named team leaderboards |

*Focus mode keyboard shortcut: basic shortcut is free; customizable shortcuts are Pro.

---

### Strategic Observations

**1. The "Awareness-to-Action Gap" is the dominant monetization pattern.**
Across all three categories, the highest-scoring monetization strategy is: give away the metric/awareness for free, charge for the analysis/action. This applies to Focus Score (free) vs. Focus Score breakdown (limited), daily stats (free) vs. weekly reports (limited), distraction counter (free) vs. AI recommendations (limited), and time tracking (limited) vs. smart scheduling (limited). The free tier makes users acutely aware of their productivity problems; the Pro tier sells the solution.

**2. Focus Score is the product's most valuable strategic asset.**
With a weighted score of 7.85, Focus Score ranks as the highest-value feature in this analysis. Its combination of high differentiation (10/10 -- no competitor has this), strong habit formation (8/10), and strong upgrade bridging (7/10 -- it creates demand for the breakdown, recommendations, and comparative analytics) makes it the centerpiece around which the entire product experience should be designed. The popup should open to Focus Score, not a settings panel.

**3. Limited Free is the dominant tier assignment (14 of 25 features).**
This is by design -- the "limited free with cap" model maximizes the funnel width (generous free tier drives installs and retention) while creating abundant, contextual upgrade moments. Each Limited Free feature is a potential conversion trigger. The key is that no single limit feels punitive; each limit is generous enough to deliver real value while naturally creating desire for more.

**4. Smart Features carry the highest development risk.**
AI recommendations, smart scheduling, distraction prediction, and calendar integration all scored 3-4/10 on the Cost dimension, meaning they require significant development investment. These should be prioritized strictly by weighted score and built incrementally: calendar integration (6.15) and website time tracking (6.20) first, then AI recommendations (6.00) and smart scheduling (5.65), with distraction prediction (5.45) last. All Smart Features except Quick Focus and keyboard shortcuts should be Phase 2+ development.

**5. Social features are growth multipliers, not standalone value.**
The Social & Accountability category has the lowest average weighted score (5.14) of the three categories, but its true value is in viral coefficient and retention amplification. Focus buddy (6.05) and leaderboards (6.00) drive installs and engagement that feed the Stats and Smart features. They should be prioritized for their network effects, not their individual scores.

**6. Three features are on the margin and should be monitored.**
Block page interaction stats (3.85), named team leaderboards (4.15), and exportable analytics (4.10) all score near the 3.5 cut threshold. They should be built only if development resources allow and should be among the first to be deprioritized if the roadmap is constrained. Block page interaction stats in particular may be better suited as an internal product analytics tool rather than a user-facing feature.
