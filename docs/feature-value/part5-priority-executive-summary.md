# Feature Value Calculator: Part 5 -- Implementation Priority & Executive Summary

## Focus Mode - Blocker Chrome Extension

> **Document Version:** 1.0
> **Date:** 2026-02-10
> **Status:** Complete Analysis
> **Pricing:** Free / Pro $4.99/mo ($35.88/yr at $2.99/mo) / Lifetime $49.99 / Team $3.99/user/mo
> **Depends On:** Parts 1-4 of Feature Value Calculator, Extension Specification (Sections 1-6), Competitive Intelligence Report

---

# PART 5: IMPLEMENTATION PRIORITY -- RANKED BY REVENUE IMPACT

---

## 5.1 Monetization Implementation Priority

### Scoring Formula

**Revenue Priority Score = (Conversion Impact x 3) + (Retention Impact x 2) + (Differentiation Value x 2) + (1 / Implementation Effort x 1)**

| Factor | Weight | Definition |
|--------|--------|------------|
| **Conversion Impact** | x3 | How directly this feature drives Pro upgrades (1 = no impact, 10 = primary conversion driver) |
| **Retention Impact** | x2 | How much this feature keeps users from churning (1 = no impact, 10 = users would leave without it) |
| **Differentiation Value** | x2 | How much this sets us apart from BlockSite, StayFocusd, LeechBlock, Freedom, Cold Turkey, Forest (1 = commodity, 10 = only we have this) |
| **Implementation Effort** | x1 (inverted) | 1 = trivial, 10 = massive; formula uses 1/Effort so lower effort yields higher score |
| **Max Possible Score** | -- | 30 + 20 + 20 + 1.0 = **71.0** |

---

### Complete 51-Feature Priority Ranking

| Rank | Feature | Tier | Conv. (x3) | Ret. (x2) | Diff. (x2) | Effort | Priority Score | Phase | Est. Revenue Impact (Y1) |
|------|---------|------|:----------:|:---------:|:----------:|:------:|:--------------:|:-----:|------------------------:|
| 1 | Weekly/monthly reports (blurred preview, unblurred Pro) | LIMITED FREE / PRO | 10 | 8 | 9 | 4 | **66.25** | P1 | $18,000-$42,000 |
| 2 | Focus Score (0-100, breakdown locked) | LIMITED FREE / PRO | 9 | 9 | 10 | 3 | **65.33** | P0 | $12,000-$30,000 |
| 3 | Manual website blocklist (10 free / unlimited Pro) | LIMITED FREE / PRO | 8 | 10 | 7 | 5 | **62.20** | P0 | $10,000-$25,000 |
| 4 | Nuclear option (1hr free / 24hr Pro) | LIMITED FREE / PRO | 9 | 8 | 9 | 4 | **62.25** | P0/P1 | $14,000-$35,000 |
| 5 | Streak tracking (current free / history+recovery Pro) | LIMITED FREE / PRO | 7 | 10 | 8 | 3 | **57.33** | P0 | $8,000-$20,000 |
| 6 | Default motivational block page | FREE | 3 | 10 | 10 | 4 | **49.25** | P0 | Indirect -- drives retention |
| 7 | Quick Focus (one-click session) | FREE | 2 | 9 | 7 | 3 | **38.33** | P0 | Indirect -- drives adoption |
| 8 | Basic Pomodoro timer (25/5/15/4) | FREE | 2 | 9 | 4 | 4 | **34.25** | P0 | Indirect -- drives retention |
| 9 | Cross-device sync | PRO | 8 | 7 | 6 | 6 | **50.17** | P2 | $8,000-$18,000 |
| 10 | Custom timer durations (1-240 min) | PRO | 7 | 7 | 5 | 3 | **45.33** | P1 | $6,000-$15,000 |
| 11 | Pre-built block lists (2 free / 6+ Pro) | LIMITED FREE / PRO | 5 | 8 | 6 | 3 | **43.33** | P0 | $4,000-$10,000 |
| 12 | Daily stats dashboard | FREE | 4 | 9 | 7 | 3 | **42.33** | P0 | Indirect -- drives conversion |
| 13 | Calendar integration (Google Calendar) | PRO | 7 | 6 | 9 | 7 | **41.14** | P2 | $7,000-$16,000 |
| 14 | Schedule-based blocking (1 free / unlimited Pro) | LIMITED FREE / PRO | 6 | 8 | 5 | 4 | **44.25** | P1 | $5,000-$12,000 |
| 15 | Whitelist mode | PRO | 7 | 7 | 8 | 5 | **45.20** | P2 | $6,000-$14,000 |
| 16 | Pro tier licensing + upgrade flow | PRO (infra) | 10 | 5 | 3 | 6 | **46.17** | P0 | Required for all revenue |
| 17 | AI focus recommendations (rule-based Phase 1) | PRO | 6 | 6 | 9 | 7 | **38.14** | P2 | $5,000-$12,000 |
| 18 | Wildcard/pattern blocking | PRO | 6 | 5 | 6 | 4 | **40.25** | P2 | $4,000-$9,000 |
| 19 | Context-aware profiles | PRO | 6 | 6 | 8 | 6 | **38.17** | P2 | $5,000-$11,000 |
| 20 | Full streak history + recovery | PRO | 7 | 8 | 7 | 3 | **51.33** | P2 | $7,000-$16,000 |
| 21 | Redirect to productive sites | PRO | 5 | 4 | 7 | 3 | **37.33** | P2 | $3,000-$7,000 |
| 22 | Custom block page editor | PRO | 5 | 5 | 6 | 5 | **37.20** | P2 | $3,000-$7,000 |
| 23 | Notification muting (blanket free / selective Pro) | LIMITED FREE / PRO | 4 | 7 | 5 | 4 | **36.25** | P1 | $3,000-$6,000 |
| 24 | Ambient sounds (3 free / 15+ Pro with mixing) | LIMITED FREE / PRO | 5 | 7 | 7 | 4 | **39.25** | P1 | $4,000-$9,000 |
| 25 | Full session history (unlimited) | PRO | 5 | 6 | 4 | 3 | **35.33** | P2 | $3,000-$6,000 |
| 26 | Exportable analytics (CSV/PDF) | PRO | 5 | 4 | 5 | 5 | **33.20** | P2 | $3,000-$6,000 |
| 27 | Auto-start sessions | PRO | 5 | 6 | 6 | 4 | **37.25** | P2 | $3,000-$7,000 |
| 28 | Focus buddy (1 free / unlimited Pro) | LIMITED FREE / PRO | 4 | 6 | 8 | 6 | **32.17** | P1 | $2,000-$5,000 |
| 29 | Focus challenges (1 free / unlimited+custom Pro) | LIMITED FREE / PRO | 4 | 7 | 7 | 5 | **34.20** | P1 | $2,500-$5,500 |
| 30 | Break reminders (basic free / advanced Pro) | LIMITED FREE / PRO | 3 | 6 | 3 | 3 | **27.33** | P0 | $1,500-$3,000 |
| 31 | Focus goals (daily free / weekly+monthly Pro) | LIMITED FREE / PRO | 4 | 7 | 6 | 4 | **36.25** | P1 | $3,000-$6,000 |
| 32 | Distraction attempts counter | FREE | 3 | 9 | 8 | 3 | **35.33** | P0 | Indirect -- drives awareness |
| 33 | Sites blocked count | FREE | 2 | 7 | 3 | 2 | **26.50** | P0 | Indirect -- validates product |
| 34 | Daily focus time tracking | FREE | 2 | 8 | 4 | 2 | **30.50** | P0 | Indirect -- core metric |
| 35 | Keyboard shortcuts (basic free / full Pro) | LIMITED FREE / PRO | 2 | 4 | 2 | 3 | **18.33** | P2 | $500-$1,500 |
| 36 | Full ambient sound library + mixing | PRO | 5 | 6 | 7 | 5 | **37.20** | P2 | $3,000-$7,000 |
| 37 | Selective notification allowlist | PRO | 4 | 5 | 5 | 5 | **32.20** | P2 | $2,000-$4,000 |
| 38 | Global anonymous leaderboard | PRO | 4 | 5 | 7 | 6 | **30.17** | P2 | $2,000-$5,000 |
| 39 | Unlimited focus buddies + session notifications | PRO | 4 | 5 | 6 | 5 | **30.20** | P2 | $2,000-$4,000 |
| 40 | Unlimited custom challenges | PRO | 3 | 5 | 5 | 5 | **27.20** | P2 | $1,500-$3,500 |
| 41 | Monthly reports | PRO | 4 | 5 | 4 | 3 | **30.33** | P2 | $2,000-$4,000 |
| 42 | Popup UI (dashboard, settings, timer) | FREE (infra) | 5 | 9 | 6 | 7 | **37.14** | P0 | Required for all features |
| 43 | Team: Shared block lists | TEAM | 3 | 4 | 8 | 7 | **23.14** | P3 | $3,000-$8,000 |
| 44 | Team: Team sessions + admin dashboard | TEAM | 3 | 5 | 9 | 8 | **25.13** | P3 | $4,000-$10,000 |
| 45 | Team: Team leaderboards (named) | TEAM | 2 | 4 | 7 | 6 | **20.17** | P3 | $1,500-$4,000 |
| 46 | Team: API access | TEAM | 2 | 3 | 6 | 8 | **18.13** | P3 | $2,000-$6,000 |
| 47 | AI recommendations Phase 2 (cloud ML) | PRO | 5 | 5 | 9 | 9 | **33.11** | P3 | $3,000-$8,000 |
| 48 | Outlook calendar integration | PRO | 3 | 3 | 4 | 6 | **23.17** | P3 | $1,500-$3,500 |
| 49 | Smart scheduling (learn patterns) | PRO | 4 | 5 | 7 | 8 | **26.13** | P3 | $2,000-$5,000 |
| 50 | Todo list / task integration | PRO | 3 | 4 | 5 | 7 | **21.14** | P3 | $1,000-$3,000 |
| 51 | Team: Team challenges | TEAM | 2 | 4 | 6 | 6 | **20.17** | P3 | $1,000-$3,000 |

---

### Priority Score Interpretation

| Score Range | Priority Class | Action |
|-------------|---------------|--------|
| **55-67** | **Critical Revenue Drivers** | Build immediately. These features generate the majority of conversion and retention. |
| **40-54** | **High-Value Features** | Build in the first 2-3 months. Strong contributors to revenue and differentiation. |
| **30-39** | **Solid Contributors** | Build in months 3-6. Good ROI but not urgent. |
| **20-29** | **Nice to Have** | Build in months 6-9. Limited direct revenue impact. |
| **< 20** | **Evaluate Carefully** | May not be worth building. Assess cost/benefit before committing. |

---

### Top 10 Features by Revenue Impact -- Summary

| # | Feature | Why It Ranks Here | Revenue Mechanism |
|---|---------|-------------------|-------------------|
| 1 | **Weekly/monthly reports** | Highest conversion trigger at 8-12%. Grammarly-style blur creates irresistible curiosity about personal data. Every free user generates data that makes the report more valuable over time. | Blurred preview on session 5 drives first Pro purchase |
| 2 | **Focus Score (0-100)** | Unique in the category -- no competitor has this. Visible score creates daily engagement; locked breakdown creates constant curiosity. Conversion rate of 3-5% on score tap, but surfaces on every session. | Score visible, breakdown locked creates repeated upgrade consideration |
| 3 | **Manual blocklist (10/unlimited)** | The core product. The 11th-site trigger converts at 5-8%. Users who hit 10 sites are the most engaged and most willing to pay. | Natural limit creates upgrade moment for power users |
| 4 | **Nuclear option (1hr/24hr)** | Conversion rate of 6-10% on re-attempt trigger. ADHD and r/getdisciplined communities specifically demand extended nuclear. Word-of-mouth multiplier. | Momentum-based trigger after successful session |
| 5 | **Streak tracking + recovery** | Streaks are the #1 retention mechanic. Streak recovery (Pro) directly prevents the most painful free-tier moment -- losing a 30-day streak to one missed day. Users will pay $4.99 to save their streak. | Emotional urgency at the moment of streak loss |
| 6 | **Cross-device sync** | 5-8% conversion rate. Addresses the #1 bypass complaint. Users discover the need organically on their second device. | Multi-device detection trigger fires automatically |
| 7 | **Custom timer durations** | 2-4% conversion on slider interaction, but the interaction is extremely frequent. Users who outgrow 25/5 are committed daily users. | Frequent touch point in daily workflow |
| 8 | **Calendar integration** | Highest perceived value for knowledge workers. No competitor offers calendar-aware auto-blocking. "Focus Mode activates during Deep Work blocks" is the killer pitch. | Unique value proposition for premium users |
| 9 | **Whitelist mode** | The "maximum restriction" paradigm that ADHD users and digital minimalists specifically request. These are the most willing-to-pay segment. | Targets highest-WTP user segment |
| 10 | **Schedule-based blocking** | Multiple schedules serve users with varied routines. The single free schedule covers the base case; the upgrade moment is natural. | Natural expansion of daily usage pattern |

---

## 5.2 Revenue Impact Analysis by Phase

### Phase Overview

| Phase | Name | Timeline | Features Launched | Dev Time | Monthly Revenue Unlocked | Cumulative MRR (Conservative) | Cumulative MRR (Optimistic) |
|-------|------|----------|-------------------|----------|--------------------------|-------------------------------|----------------------------|
| **Phase 0** | Beta / Free Launch | Weeks 1-7 | 15 free features (P0) | 5-7 weeks | $0 | $0 | $0 |
| **Phase 1** | Monetization Launch | Weeks 8-11 | 10 core Pro features + paywall | 3-4 weeks | $500-$2,000 | $500 | $2,000 |
| **Phase 2** | Growth | Months 3-6 | 15 advanced Pro features | 8-12 weeks | $800-$4,000 | $1,300 | $6,000 |
| **Phase 3** | Scale | Months 7-12 | Team tier + advanced Pro | 8-12 weeks | $500-$2,500 | $1,800 | $8,500 |

---

### Phase 0: Beta / Free Launch (Weeks 1-7)

**Goal:** Build user base, establish retention, collect behavioral data for Pro feature optimization.

| Feature | Dev Effort | Role in Monetization |
|---------|-----------|---------------------|
| Manual website blocklist (10 sites) | 1-2 weeks | Core product. Creates the 11th-site conversion trigger opportunity. |
| Default motivational block page | 3-5 days | Seen 100+ times/day per user. Primary brand differentiator. Drives retention and reviews. |
| Quick Focus button | 3-5 days | Onboarding magic moment. Drives first-session completion, which predicts retention. |
| Basic Pomodoro timer (25/5/15/4) | 1 week | Daily engagement loop. Creates custom timer upgrade desire over time. |
| Daily stats dashboard | 3-5 days | Validates product value. "47 distractions blocked" creates believers. |
| Focus Score (number visible, breakdown locked) | 2-3 days | Grammarly-style mechanic. Plants the conversion seed from day 1. |
| Current streak tracking | 2-3 days | Retention lock-in. Prevents uninstall via psychological investment. |
| Pre-built block lists (Social + News) | 2-3 days | Reduces onboarding friction. 2-click setup for new users. |
| Distraction attempts counter | Built into stats | Shock value drives sharing. "I tried to visit Reddit 47 times" goes viral. |
| Sites blocked count | Built into stats | Validates the extension is working. |
| Daily focus time tracking | Built into stats | Core metric visible in popup at all times. |
| Break reminders (basic) | Built into timer | Completes the Pomodoro experience. |
| Extension popup UI | 1-2 weeks (concurrent) | Required interface for all features. |
| Pro tier licensing + upgrade flow | 1-2 weeks | Payment infrastructure. Required before any revenue can flow. |
| Keyboard shortcuts (basic: 2 fixed) | 1-2 days | Quality-of-life feature. Low effort, completes the interaction model. |

**Revenue:** $0 direct. Investment in user acquisition and retention.

**Key metrics to track:**
- Install-to-first-session rate (target: >70%)
- D7 retention (target: >60%)
- D30 retention (target: >40%)
- Average sessions per user per week (target: >5)
- Feature usage rates for all free features

---

### Phase 1: Monetization Launch (Weeks 8-11)

**Goal:** Activate first revenue through core Pro features and optimized paywall triggers.

| Feature | Dev Effort | Conversion Trigger | Est. Conversion Rate |
|---------|-----------|-------------------|---------------------|
| Weekly reports (unblurred Pro) | 3-5 days | T1: Blurred preview after session 5 | 8-12% |
| Unlimited sites + all block lists | 2-3 days | T2: 11th site attempt | 5-8% |
| Extended nuclear (24hr) | 2-3 days | T3: Re-attempt within 5 min | 6-10% |
| Custom timer durations | 2-3 days | T10: Slider past 25 min | 2-4% |
| 1-schedule blocking | 3-5 days | Usage habit (automated daily routine) | Retention driver |
| 1-hour nuclear option | 3-5 days | Feature discovery, word-of-mouth | Adoption driver |
| Notification muting (blanket) | 3-5 days | Completes focus experience | Retention driver |
| 3 ambient sounds | 3-5 days | Daily engagement, surprise delight | Adoption driver |
| 1 focus buddy invite | 1 week | Viral growth mechanic | Growth driver |
| 1 focus challenge | 3-5 days | Gamification engagement | Retention driver |
| Focus goals (daily) | 2-3 days | Structured motivation | Retention driver |

**Conservative Month 3 Revenue Estimate:**
- 2,500 installs, 60% active = 1,500 active users
- 2.5% conversion = 38 Pro users
- Blended ARPU $3.79/mo
- **MRR: ~$144**

**Optimistic Month 3 Revenue Estimate:**
- 10,000 installs, 60% active = 6,000 active users
- 4% conversion = 240 Pro users
- Blended ARPU $3.69/mo
- **MRR: ~$886**

---

### Phase 2: Growth (Months 3-6)

**Goal:** Deepen Pro value proposition, increase conversion rate, reduce churn.

| Feature | Dev Effort | Revenue Role |
|---------|-----------|-------------|
| Cross-device sync | 1-2 weeks | Top-3 conversion driver. Closes the multi-device bypass loophole. |
| Whitelist mode | 1 week | Targets highest-WTP users (ADHD, digital minimalists). |
| Wildcard/pattern blocking | 1 week | Power-user Pro differentiator. |
| Redirect to productive sites | 3-5 days | Creative productivity feature for committed users. |
| Custom block page editor | 1 week | Personalization upgrade for daily heavy users. |
| Context-aware profiles | 1 week | Multi-context blocking for knowledge workers. |
| Full streak history + recovery | 3-5 days | Prevents the most painful churn moment (losing a long streak). |
| Full session history | 3-5 days | Data depth for long-term users. |
| Auto-start sessions | 3-5 days | Friction-reduction for daily users. |
| Full ambient sound library + mixing | 1 week | High-engagement delight upgrade. |
| AI focus recommendations (rule-based) | 2 weeks | "Productivity coach" positioning. High perceived value. |
| Exportable analytics (CSV/PDF) | 1 week | Professional use case (freelancers, managers). |
| Monthly reports | 3-5 days | Extension of the weekly report mechanic. |
| Selective notification allowlist | 1 week | Professional environment support. |
| Customizable keyboard shortcuts | 3-5 days | Power-user polish. |

**Conservative Month 6 Revenue Estimate:**
- 7,000 installs, 55% active = 3,850 active users
- 3.5% conversion = 135 Pro users
- Blended ARPU $3.79/mo
- **MRR: ~$512**

**Optimistic Month 6 Revenue Estimate:**
- 30,000 installs, 55% active = 16,500 active users
- 4.5% conversion = 743 Pro users
- Blended ARPU $3.69/mo
- **MRR: ~$2,742**

---

### Phase 3: Scale (Months 7-12)

**Goal:** Launch Team tier for enterprise revenue, build advanced features, optimize conversion funnel.

| Feature | Dev Effort | Revenue Role |
|---------|-----------|-------------|
| Team: Shared block lists | 2-3 weeks | Team tier marquee feature. Admin-managed distraction control. |
| Team: Team sessions + admin dashboard | 3-4 weeks | Synchronized team focus. Higher ARPU per seat. |
| Team: Team leaderboards (named) | 1-2 weeks | Team engagement and accountability. |
| Team: API access | 2-3 weeks | Enterprise integration (HR tools, PM dashboards). |
| Team: Team challenges | 1-2 weeks | Team gamification layer. |
| AI recommendations Phase 2 (cloud ML) | 3-4 weeks | Deep personalization. Marketing differentiator. |
| Calendar integration (Google + Outlook) | 1-2 weeks (Outlook addition) | Broadens calendar integration to Microsoft shops. |
| Smart scheduling (learn patterns) | 2 weeks | Automated optimization. "The extension learns when you focus best." |
| Global anonymous leaderboard | 1-2 weeks | Competitive engagement for Pro users. |
| Unlimited buddies + session notifications | 1 week | Social accountability at scale. |
| Unlimited custom challenges | 1 week | Deep gamification for power users. |
| Todo list / task integration | 1-2 weeks | Ecosystem play (Todoist, Notion). |

**Conservative Month 12 Revenue Estimate:**
- 15,000 installs, 50% active = 7,500 active users
- 4% Pro conversion = 270 Pro + 10 Team seats
- Pro blended ARPU $3.79/mo, Team $3.99/user/mo
- **MRR: ~$1,063** ($1,023 Pro + $40 Team)

**Optimistic Month 12 Revenue Estimate:**
- 75,000 installs, 50% active = 37,500 active users
- 5% Pro conversion = 2,250 Pro + 75 Team seats
- **MRR: ~$8,603** ($8,303 Pro + $300 Team)

---

### Revenue Trajectory Summary

```
Month    Conservative MRR    Optimistic MRR    Key Milestone
─────    ────────────────    ──────────────    ─────────────
  1           $0                  $0           Free launch, building user base
  2           $0                  $0           Refining free experience, collecting data
  3          $144                $886          Pro launch, first revenue
  4          $250              $1,500          Paywall optimization begins
  5          $380              $2,100          Phase 2 features rolling out
  6          $512              $2,742          Cross-device sync + whitelist launch
  7          $620              $3,400          Calendar integration live
  8          $730              $4,200          AI recommendations launch
  9          $840              $5,200          Team tier beta
 10          $920              $6,300          Team tier GA
 11          $980              $7,500          Full feature set complete
 12        $1,063              $8,603          Year 1 target
```

---

## 5.3 Critical Path to Revenue

### Question 1: What Is the MINIMUM Set of Pro Features to Justify $4.99/mo?

A user paying $4.99/mo must feel they are getting at least $15-$20/mo in perceived value. The minimum viable Pro offering that clears this bar:

| Feature | Value to User | Why Essential |
|---------|--------------|---------------|
| **Weekly reports (unblurred)** | "I can finally see my focus patterns" -- the data was already being collected for free | This is the #1 conversion trigger. Without it, users have no compelling reason to see what Pro offers. |
| **Unlimited sites** | Removes the 10-site cap | The simplest, most tangible Pro benefit. Users who hit the limit understand the value instantly. |
| **Extended nuclear (24hr)** | Full-day distraction lockdown | The emotional power of "24 hours of zero distractions" is immense for ADHD users and disciplined workers. |
| **Custom timer durations** | 50/10, 90/20, or any custom cycle | Power users who have done 20+ sessions want flexibility. Low dev effort, high daily touch. |

**Minimum Viable Pro = 4 features.** These four create a compelling upgrade at $4.99/mo because they address the three upgrade motivations: hitting a limit (unlimited sites), curiosity about locked data (weekly reports), and desire for deeper control (extended nuclear + custom timers).

**Development cost for Minimum Viable Pro:** ~2 weeks (assuming Pro licensing infrastructure is built in P0).

---

### Question 2: What Is the Fastest Path from $0 to $1,000 MRR?

**$1,000 MRR requires approximately:**
- At **$3.79 blended ARPU** (60% annual, 40% monthly): **264 paying users**
- At typical **3.5% conversion**: **7,543 active users**
- At **55% install-to-active ratio**: **~13,715 total installs**

**Fastest path:**

| Step | Action | Timeline | Impact |
|------|--------|----------|--------|
| 1 | Launch with complete free tier (P0 features) | Weeks 1-7 | Build user base to 500-2,000 installs |
| 2 | Launch Pro with reports, unlimited sites, nuclear, custom timers | Week 8 | Activate conversion on existing users |
| 3 | Submit to Product Hunt, post on Reddit (r/productivity, r/ADHD, r/chrome), Hacker News | Week 8-9 | Spike installs to 5,000-15,000 |
| 4 | A/B test paywall triggers (T1 timing, T2 copy, price anchoring) | Weeks 9-12 | Optimize conversion from 2.5% to 3.5-4% |
| 5 | Launch cross-device sync + whitelist mode + streak recovery | Month 3-4 | Add high-value Pro features, improve conversion |
| 6 | Launch calendar integration | Month 4-5 | Capture knowledge worker segment |
| 7 | Launch referral program (buddy invites earn Pro trial days) | Month 4 | Accelerate install growth |

**Conservative timeline to $1K MRR:** Month 10-12
**Optimistic timeline to $1K MRR:** Month 4-5

**Key bottleneck:** Install volume, not conversion rate. The paywall design is strong (8-12% on weekly reports). The constraint is getting enough users into the funnel.

---

### Question 3: What Is the Path from $1K to $5K MRR?

**$5,000 MRR requires approximately:**
- At **$3.69 blended ARPU**: **1,355 paying users**
- At **4.5% conversion**: **30,111 active users**
- At **50% install-to-active**: **~60,222 total installs**

| Step | Action | Timeline | Impact |
|------|--------|----------|--------|
| 1 | Achieve $1K MRR (see above) | Month 4-12 | Baseline |
| 2 | Launch Team tier ($3.99/user/mo, min 5 seats) | Month 7+ | New revenue stream at higher ARPU |
| 3 | Scale content marketing (SEO blog: "how to block Reddit," "best website blockers 2026," "Pomodoro Chrome extensions") | Ongoing | Organic traffic at near-zero marginal cost |
| 4 | Chrome Web Store SEO optimization (keywords, screenshots, ratings) | Ongoing | Organic install growth from store search |
| 5 | Influencer partnerships (ADHD YouTubers, productivity bloggers) | Month 6+ | Targeted reach to highest-WTP segments |
| 6 | Launch Lifetime plan promotions during peak seasons (New Year, Back to School) | Seasonal | Cash injection + user lock-in |
| 7 | Launch AI recommendations + smart scheduling | Month 8+ | Marketing differentiator ("your AI focus coach") |
| 8 | Annual plan push (A/B test 40% vs 50% annual discount) | Month 6+ | Improve blended ARPU and reduce churn |

**Conservative timeline to $5K MRR:** Month 18-24 (beyond Y1)
**Optimistic timeline to $5K MRR:** Month 8-10

---

### Question 4: Revenue Multipliers vs. Nice-to-Haves

**Revenue Multipliers** -- features that directly increase conversion rate, reduce churn, or expand addressable market:

| Feature | Multiplier Type | Magnitude |
|---------|----------------|-----------|
| Weekly/monthly reports (blurred) | **Conversion multiplier** | 8-12% of all free users who see the trigger |
| Focus Score (locked breakdown) | **Conversion multiplier** | 3-5% on every score tap, compounds over time |
| Streak recovery (Pro) | **Churn reducer** | Prevents the #1 emotional churn trigger |
| Cross-device sync | **Conversion multiplier** | 5-8% on second-device detection |
| Calendar integration | **Market expander** | Opens the "auto-focus" positioning for knowledge workers |
| Nuclear extension (24hr) | **Conversion multiplier** | 6-10% on re-attempt trigger |
| Team tier infrastructure | **Revenue multiplier** | New revenue stream at higher per-seat ARPU |

**Nice-to-Haves** -- features that add polish but do not materially move revenue:

| Feature | Why "Nice to Have" |
|---------|-------------------|
| Customizable keyboard shortcuts | Power-user polish. Low conversion impact. |
| Custom block page editor | Personalization delight. Users rarely cite this as an upgrade reason. |
| Global leaderboard | Engagement feature. Does not drive conversion or prevent churn. |
| Team challenges | Requires Team tier critical mass to be useful. |
| Todo list / task integration | Ecosystem play with uncertain demand. |
| Outlook calendar integration | Small incremental market (Google Calendar covers 70%+ of targets). |

---

## 5.4 Feature Dependency Map

### Complete Dependency Tree

```
CORE INFRASTRUCTURE (must build first)
├── Extension popup UI
│   ├── All feature UIs render here
│   └── Pro licensing + upgrade flow
│       ├── Plan selection panel
│       ├── Stripe checkout integration
│       └── License verification system
│
BLOCKING ENGINE (the product's foundation)
├── Manual website blocklist (10 sites)
│   ├── Pre-built block lists (Social + News)
│   │   └── [PRO] All pre-built lists (6+ categories)
│   ├── [PRO] Unlimited sites
│   ├── [PRO] Wildcard/pattern blocking
│   │   └── Requires: regex rule engine in declarativeNetRequest
│   ├── [PRO] Whitelist mode
│   │   └── Requires: default-block rule architecture
│   │       └── Requires: careful handling of Chrome internal pages + OAuth flows
│   └── Block page (default motivational)
│       ├── [PRO] Custom block page editor
│       │   └── Requires: block page templating system
│       └── [PRO] Redirect to productive sites
│           └── Requires: per-site redirect rule mapping
│
SCHEDULING & ENFORCEMENT
├── Schedule-based blocking (1 schedule)
│   ├── [PRO] Unlimited schedules
│   └── [PRO] Auto-start sessions
│       └── Requires: schedule engine + chrome.alarms
├── Nuclear option (1 hour)
│   └── [PRO] Extended nuclear (24 hours)
│       └── Same bypass-prevention architecture, just longer duration
│
TIMER ENGINE
├── Basic Pomodoro timer (25/5/15/4)
│   ├── Quick Focus button
│   │   └── [PRO] Customizable Quick Focus (duration, lists, muting)
│   ├── [PRO] Custom timer durations (1-240 min)
│   │   └── [PRO] Auto-start sessions
│   │       └── [PRO] Smart scheduling (learn patterns)
│   ├── Break reminders (basic)
│   │   └── [PRO] Advanced break reminders (custom sounds, smart suggestions)
│   └── Session history (7 days)
│       └── [PRO] Full session history (unlimited)
│
ANALYTICS ENGINE
├── Daily focus time tracking
│   └── Daily stats dashboard
│       ├── Sites blocked count
│       ├── Distraction attempts counter
│       │   └── Per-site breakdown (Pro analytics)
│       └── Focus Score (0-100, number visible)
│           ├── [PRO] Focus Score breakdown (unlocked categories)
│           └── [PRO] AI focus recommendations (rule-based Phase 1)
│               └── [PRO] AI recommendations Phase 2 (cloud ML)
│                   └── Requires: server-side infrastructure
├── Focus goals (daily)
│   └── [PRO] Weekly + monthly goals with streaks
└── [PRO] Weekly/monthly reports (unblurred)
    ├── Requires: 5+ sessions of data collection
    ├── Blurred preview system (CSS blur + data pass-through)
    └── [PRO] Exportable analytics (CSV/PDF)
        └── Requires: report generation + browser print API

STREAKS & GAMIFICATION
├── Current streak tracking
│   ├── [PRO] Full streak history (longest, calendar heatmap)
│   │   └── [PRO] Streak recovery (1 grace day/month)
│   └── Displayed on block page + popup
├── Focus challenges (1 active from 5 pre-built)
│   └── [PRO] Unlimited + custom challenges
│       └── Requires: challenge builder UI
│
SOCIAL & ACCOUNTABILITY
├── Focus buddy (1 invite)
│   ├── Requires: invite code generation + basic data sharing
│   ├── [PRO] Unlimited buddies + session notifications
│   │   └── Requires: real-time sync (Firebase or similar)
│   └── [TEAM] Team sessions
│       ├── [TEAM] Team leaderboards (named)
│       └── [TEAM] Team challenges
│
NOTIFICATIONS & SOUND
├── Notification muting (blanket)
│   └── [PRO] Selective notification allowlist
│       └── Requires: per-origin notification interception
├── Ambient sounds (3 built-in)
│   └── [PRO] Full sound library (15+) + mixing
│       └── Requires: multi-track audio engine in offscreen document
│
INTEGRATIONS & SYNC
├── Keyboard shortcuts (2 fixed)
│   └── [PRO] Customizable keyboard shortcuts
├── [PRO] Cross-device sync
│   └── Requires: chrome.storage.sync + optional cloud backup
├── [PRO] Calendar integration (Google Calendar)
│   ├── Requires: OAuth2 via chrome.identity
│   ├── [PRO] Outlook calendar integration
│   │   └── Requires: Microsoft Graph API
│   └── [PRO] Context-aware profiles
│       └── Requires: profile system + calendar event matching
│
TEAM INFRASTRUCTURE (builds on Pro)
├── [TEAM] Shared block lists
│   └── Requires: server-side list management + admin permissions
├── [TEAM] Admin dashboard
│   └── Requires: web app + team management backend
├── [TEAM] API access
│   └── Requires: REST API server + authentication + rate limiting
└── [PRO] Todo list / task integration
    └── Requires: third-party API integrations (Todoist, Notion)
```

### Critical Path Dependencies (Build Order Constraints)

These features CANNOT be started until their dependencies are complete:

| Feature | Hard Dependencies | Soft Dependencies |
|---------|-------------------|-------------------|
| Weekly reports | Daily stats + session history + 5 sessions of data | Focus Score (enhances report value) |
| Focus Score breakdown | Focus Score number + completion/distraction/goal data | Session history |
| Streak recovery | Streak tracking system | Full streak history |
| Wildcard blocking | Manual blocklist + regex rule engine | -- |
| Whitelist mode | Manual blocklist + default-block architecture | Wildcard blocking (pattern matching engine) |
| Calendar integration | OAuth2 infrastructure | Schedule blocking (shares activation logic) |
| Context-aware profiles | Calendar integration OR schedule system | Whitelist mode, multiple block lists |
| Auto-start sessions | Timer engine + schedule system | Calendar integration |
| AI recommendations (Phase 1) | Analytics engine + 2+ weeks of user data | Focus Score, session history |
| AI recommendations (Phase 2) | Phase 1 + cloud server infrastructure | -- |
| Cross-device sync | Pro licensing + chrome.storage.sync | All settings/blocklist features |
| Team: Shared block lists | Manual blocklist + server backend | -- |
| Team: Admin dashboard | Server backend + user authentication | Shared block lists |
| Team: API access | Server backend + authentication + rate limiting | All Team features |
| Exportable analytics | Weekly reports (data and formatting) | -- |
| Full sound library + mixing | Basic ambient sounds (3 tracks) + offscreen document | -- |
| Unlimited buddies | Focus buddy (1 invite) + real-time sync | -- |
| Smart scheduling | Analytics engine (pattern data) + schedule system | AI recommendations |
| Global leaderboard | Focus Score + server backend + opt-in data pipeline | -- |

---

## 5.5 Build vs. Skip Analysis

### Features Scored Below 25 -- Build or Skip?

| Feature | Score | Build? | When? | Why? |
|---------|:-----:|:------:|:-----:|------|
| **Team: Team leaderboards** | 20.17 | BUILD (conditional) | Month 7+ | Only if Team tier achieves 20+ paying seats. Leaderboards without critical mass are a ghost town. Do not build speculatively. |
| **Team: Team challenges** | 20.17 | BUILD (conditional) | Month 8+ | Same condition as team leaderboards. Requires team adoption before the feature has value. |
| **Todo list / task integration** | 21.14 | DEFER | Month 9+ at earliest | Todoist/Notion integrations expand scope significantly. The ROI is uncertain -- users already have task tools. Build only if user surveys confirm demand. |
| **Team: API access** | 18.13 | BUILD (conditional) | Month 8+ | Only build if Team tier has enterprise customers requesting programmatic access. API maintenance is ongoing cost. |
| **Keyboard shortcuts (customizable)** | 18.33 | BUILD (low priority) | Month 6+ | Extremely low effort (3-5 days) makes it worth building eventually, despite low conversion impact. Power-user polish. |
| **Outlook calendar integration** | 23.17 | DEFER | Month 9+ | Google Calendar covers 70%+ of target users. Build Outlook only if significant user demand materializes. |

### Features to Potentially NEVER Build

| Feature | Score | Recommendation | Reasoning |
|---------|:-----:|:--------------|-----------|
| **Smart scheduling (ML-based pattern learning)** | 26.13 | EVALUATE at Month 9 | Rule-based AI recommendations (Phase 1) may satisfy 90% of the demand. True ML requires server infrastructure, data pipelines, and ongoing maintenance costs that may not be justified at <5,000 users. Build only if users specifically request "auto-optimized schedules" and Phase 1 AI data supports it. |
| **AI recommendations Phase 2 (cloud ML)** | 33.11 | EVALUATE at Month 12 | Phase 1 (rule-based, local) may be sufficient long-term. Cloud ML adds server costs, privacy concerns, and maintenance burden. The score is inflated by differentiation value -- but differentiation only matters if it drives measurable conversion lift. |
| **Todo list / task integration** | 21.14 | LIKELY SKIP | Users have dedicated task tools (Todoist, Notion, Things, etc.). Adding a lightweight task feature inside Focus Mode risks being "not good enough" compared to purpose-built tools. The integration maintenance burden (API changes, auth flows, rate limits) is high relative to the conversion impact. |

### Build Order Summary (All 51 Features)

| Build Wave | Features | Timeline | Cumulative Features |
|-----------|----------|----------|:-------------------:|
| **Wave 1 (P0)** | Blocklist, block page, Quick Focus, Pomodoro, daily stats, Focus Score, streaks, pre-built lists, popup UI, Pro licensing, break reminders (basic), distraction counter, sites count, daily focus time, keyboard shortcuts (basic) | Weeks 1-7 | 15 |
| **Wave 2 (P1)** | Weekly reports, unlimited sites + all lists, extended nuclear, custom timers, schedule blocking, nuclear option (1hr), notification muting, ambient sounds (3), focus buddy (1), focus challenges (1), focus goals (daily) | Weeks 8-11 | 26 |
| **Wave 3 (P2a)** | Cross-device sync, whitelist mode, wildcard blocking, redirect, streak recovery + history, full session history | Months 3-4 | 32 |
| **Wave 4 (P2b)** | Calendar integration (Google), context-aware profiles, custom block page, auto-start, AI recommendations (Phase 1), exportable analytics, monthly reports | Months 4-6 | 39 |
| **Wave 5 (P2c)** | Full ambient sounds + mixing, selective notification allowlist, customizable shortcuts, unlimited buddies, unlimited challenges, global leaderboard | Months 5-6 | 45 |
| **Wave 6 (P3)** | Team: shared lists, team sessions, admin dashboard, team leaderboards, API access, team challenges | Months 7-9 | 51 |
| **Wave 7 (Evaluate)** | AI Phase 2, Outlook calendar, smart scheduling, todo integration | Month 9+ | 51-55 |

---

# EXECUTIVE SUMMARY

## Focus Mode - Blocker: Feature Value Calculator -- Complete Analysis

---

### Key Numbers

| Metric | Count | % of Total |
|--------|:-----:|:----------:|
| **Total features scored** | 51 | 100% |
| **Free features** (always free, full functionality) | 15 | 29% |
| **Limited free features** (free with caps, Pro unlocks full) | 12 | 24% |
| **Pro-only features** (exclusively paid) | 17 | 33% |
| **Team-only features** (Team tier exclusive) | 7 | 14% |

**Tier distribution insight:** The free tier (15 features) plus limited-free tier (12 features) gives free users access to 27 features -- a genuinely complete focus tool. This is the foundation of the "honest freemium" positioning that differentiates us from BlockSite's 3-site free tier. The 17 Pro features and 7 Team features provide clear upgrade paths without crippling the free experience.

---

### Top 5 Revenue-Driving Features (In Build Order)

| # | Feature | Why It Matters | Expected Conversion Impact |
|---|---------|---------------|:-------------------------:|
| 1 | **Weekly/monthly reports (blurred preview)** | The #1 conversion trigger. Users generate data for 5 sessions, then see a blurred preview of their personal focus patterns. Curiosity about their own behavioral data is "nearly irresistible" (validated by Grammarly's 22% upgrade lift from blur mechanics). | 8-12% of users who see the trigger |
| 2 | **Focus Score (0-100, breakdown locked)** | Unique in the category -- no competitor has a composite focus score. The number is visible for free; the breakdown (what factors drive it, how to improve) is Pro. Creates daily upgrade consideration every time a user checks their score. | 3-5% per interaction, compounds over time |
| 3 | **Nuclear option (1hr free / 24hr Pro)** | The momentum-based conversion trigger: after a successful 1-hour lockdown, users want more. The 24-hour extension is the #1 requested feature in ADHD and productivity communities. Word-of-mouth multiplier. | 6-10% on re-attempt trigger |
| 4 | **Cross-device sync** | Addresses the most common blocker bypass: "I just switch to my other device." Auto-detected on second device install, creating a frictionless upgrade moment. | 5-8% on second-device detection |
| 5 | **Streak recovery (Pro)** | The most emotionally charged conversion moment in the product. A user on a 30-day streak who misses one day will pay $4.99 to save their streak rather than lose it. Prevents the #1 churn trigger for engaged users. | High urgency, low volume -- but converts at premium rate |

---

### Top 5 Adoption-Driving Features (Keep Free Forever)

| # | Feature | Why It Must Stay Free | Retention Impact |
|---|---------|----------------------|:----------------:|
| 1 | **Manual website blocklist (10 sites)** | This IS the product. BlockSite's 3-site free limit is their #1 source of 1-star reviews. 10 sites covers 90% of casual users' core distractors while remaining generous enough to earn 5-star reviews and word-of-mouth. | Critical -- without this, users uninstall immediately |
| 2 | **Quick Focus (one-click 25-min session)** | The "magic moment." New users feel value within 5 seconds of install. One click starts blocking + timer with zero configuration. This is the onboarding gate that determines whether a user becomes a daily active or an immediate uninstall. | Critical -- drives first-session completion |
| 3 | **Streak tracking (current streak)** | The #1 retention mechanic in consumer software. "Day 14 Focus Streak" creates psychological switching cost -- uninstalling means losing the streak. Duolingo built a $7B company on streaks. | Critical -- directly prevents uninstall |
| 4 | **Default motivational block page** | Users see this page 50-100+ times per day. Every competitor shows a generic "BLOCKED" message. Our page shows their streak, time saved, a motivational quote, and their Focus Score. The block page is the most underexploited engagement surface in the category. | High -- transforms blocking from punishment to reinforcement |
| 5 | **Distraction attempts counter** | "You tried to visit Reddit 47 times today" is the most shareable metric in the product. Users screenshot this and post it to social media, driving organic installs. The behavioral shock value converts skeptics into believers. | High -- drives both retention and viral growth |

---

### Strategic Recommendations

**Most important pricing decision:**
Pre-select the annual plan ($2.99/mo billed $35.88/yr) as the default in the plan selection panel. Industry data shows that pre-selecting annual drives 55-65% of subscribers to the annual plan, improving blended ARPU by 15-20% and reducing monthly churn. A/B test this against monthly pre-selection in month 2. The Lifetime plan ($49.99) should be visible but not pre-selected -- it may cannibalize higher-LTV annual subscriptions.

**Most important feature to build first for revenue:**
The blurred weekly report (T1 trigger). It converts at 8-12% and fires automatically after session 5 with zero manual targeting. The report data is already being collected by the free analytics engine, so the "unlock" is pure margin. Building the report unblurring and paywall flow should be the first Pro feature completed.

**Biggest risk to monitor:**
Install growth rate. The paywall triggers are well-designed (8-12% conversion on reports, 5-8% on 11th site, 6-10% on nuclear extension), but all revenue projections are gated by total installs. The difference between conservative ($6,700 Y1) and optimistic ($52,000 Y1) is almost entirely a function of install volume (15K vs 75K). Marketing, Chrome Web Store SEO, and word-of-mouth must be treated as equal priorities to feature development starting from week 1.

**Key competitive move:**
Launch with the "10 free sites" messaging prominently in the Chrome Web Store listing and all marketing. "Block 10 sites free -- no time limits, no ads, no tricks" directly attacks BlockSite's weakness (3-6 free sites, aggressive paywalling, pop-up ads). Early reviews comparing us favorably to BlockSite will compound into organic growth through Chrome Web Store search rankings.

---

### 90-Day Monetization Plan

#### Weeks 1-4: Build the Free Foundation

| Week | What to Build | What to Validate |
|------|--------------|-----------------|
| Week 1 | Manual blocklist (domain-level blocking) + block page with motivational quotes, streak display, Focus Score number | Blocking works flawlessly on top 50 distraction sites |
| Week 2 | Quick Focus button + basic Pomodoro timer (25/5/15/4) + badge countdown | First-session completion rate >70% |
| Week 3 | Daily stats dashboard (focus time, blocks, attempts counter + top 3 sites) + Focus Score calculation + streak tracking | Users return for sessions 2-3 within 48 hours |
| Week 4 | Pre-built block lists (Social + News) + extension popup UI polish + basic break reminders + keyboard shortcuts (2 fixed) | Onboarding completion rate >80%, D7 retention >60% |

**Marketing (concurrent):** Set up Chrome Web Store listing with optimized screenshots, keywords, and description. Draft launch posts for Reddit, Hacker News, Product Hunt. Build a simple landing page at focusmodeblocker.com.

#### Weeks 5-8: Monetization Infrastructure + Pro Launch

| Week | What to Build | What to Validate |
|------|--------------|-----------------|
| Week 5 | Pro licensing infrastructure (Stripe/ExtensionPay integration, license verification, feature gating) | Payment flow completes in <60 seconds |
| Week 6 | Weekly reports (blurred free preview + unblurred Pro) + T1 paywall trigger (session 5) | T1 fires correctly after session 5; blur renders real data |
| Week 7 | Unlimited sites + all block lists (Pro) + T2 paywall trigger (11th site) + extended nuclear (24hr, Pro) + T3 paywall trigger | All paywall triggers fire correctly, upgrade flow works end-to-end |
| Week 8 | Custom timer durations (Pro) + T10 trigger + 1-schedule blocking + 1-hour nuclear option + notification muting (blanket) | First Pro conversions. Conversion rate tracking in analytics. |

**Marketing (Week 8):** Product Hunt launch. Reddit posts (r/productivity, r/ADHD, r/getdisciplined, r/chrome, r/SideProject). Hacker News "Show HN." Target: 2,000-10,000 installs in launch week.

**Week 8 Revenue Target:** First 10-50 paying users. MRR: $38-$190.

#### Weeks 9-12: Optimize and Expand

| Week | What to Build | What to Validate |
|------|--------------|-----------------|
| Week 9 | 3 ambient sounds + 1 focus buddy invite + 1 focus challenge + focus goals (daily) | DAU increases with sound feature; buddy invites generate new installs |
| Week 10 | A/B test paywall triggers: T1 timing (session 5 vs 7), T1 copy variants, price anchoring variants | Identify highest-converting trigger configuration |
| Week 11 | T6 (post-best-session discount offer) + T7 (weekly distraction alert) + full paywall timing cadence | Milestone-based conversion adds incremental revenue |
| Week 12 | Begin cross-device sync development + streak recovery development + data analysis of first 30 days of conversion data | Conversion funnel bottlenecks identified; Phase 2 priorities validated |

**Week 12 Revenue Target (Conservative):** 50-100 paying users. MRR: $190-$379.
**Week 12 Revenue Target (Optimistic):** 200-500 paying users. MRR: $738-$1,845.

---

### Year 1 Revenue Summary

| Scenario | Total Installs | Paying Users (Month 12) | MRR (Month 12) | Total Y1 Revenue |
|----------|:--------------:|:----------------------:|:---------------:|:----------------:|
| **Conservative** | 15,000 | 270 | $1,023 | ~$6,700 |
| **Base Case** | 35,000 | 800 | $3,000 | ~$22,000 |
| **Optimistic** | 75,000 | 2,250 | $8,303 | ~$52,000 |

**The single biggest lever:** Install volume. Every 10,000 additional installs at 3.5% conversion adds ~$1,330/mo in MRR. Marketing investment and Chrome Web Store SEO should be treated with the same urgency as feature development.

---

### Decision Framework for Feature Prioritization (Ongoing)

After launch, use this framework to decide what to build next:

```
                    HIGH CONVERSION IMPACT
                           |
             BUILD NOW     |    BUILD NEXT
            (Phase 1-2)    |   (Phase 2-3)
                           |
  LOW EFFORT ─────────────┼──────────────── HIGH EFFORT
                           |
            NICE-TO-HAVE   |    EVALUATE
             (Phase 3+)    |   (Maybe Never)
                           |
                    LOW CONVERSION IMPACT
```

**Always prioritize features in the upper-left quadrant** (high conversion, low effort). These include: weekly reports, unlimited sites, custom timers, extended nuclear, streak recovery. They are cheap to build and directly drive revenue.

**Avoid the lower-right quadrant** (low conversion, high effort) unless there is strong qualitative user demand. Features like AI Phase 2, Outlook calendar, and API access live here. They are expensive to build and maintain without proven conversion impact.

---

*Part 5: Implementation Priority & Executive Summary -- Complete*
*This document completes the Feature Value Calculator series (Parts 1-5).*
*Feed this document to the development team for sprint planning and roadmap construction.*
