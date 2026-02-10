# Conversion Psychology & Touchpoint Design — Focus Mode - Blocker

> **Document Scope:** This document combines conversion psychology, positioning strategy, pricing psychology, and detailed touchpoint design for every upgrade moment in the Focus Mode - Blocker extension. It serves as the definitive reference for copywriters, designers, and developers implementing paywalls, nudges, and upgrade flows.

---

## Part A: Psychology & Positioning

### 1. Pain-First Positioning

Every conversion moment must connect to a real, felt pain point — not an abstract feature benefit. The table below maps each persona to their deepest frustration and the emotional state we encounter them in at the paywall.

| Persona | "Hair on Fire" Problem | Maximum Frustration Moment | Emotional State at Paywall | Expected Conversion |
|---------|----------------------|---------------------------|---------------------------|-------------------|
| **Alex** (Knowledge Worker, 32) | Realizes he spent 3+ hours on Reddit/YouTube AGAIN and missed a deadline | Checks weekly report, sees blurred stats revealing exactly how much time was wasted | Frustrated + motivated to change — self-directed anger at own behavior | **HIGHEST** (8-12%) |
| **Jordan** (Student, 21) | Exam is tomorrow, can't stop checking Instagram and TikTok despite knowing better | Hits 1-hour Nuclear limit during a cram session and needs to extend it | Desperate + pressured — external deadline creates urgency | **HIGH** (6-10%) |
| **Sam** (Neurodivergent Professional, 28) | External structure is the only thing keeping productivity intact; hits 10-site limit | Needs to add one more distraction site but the blocklist is full | Anxious + dependent on tool — removing a site feels dangerous | **HIGH** (5-8%) |
| **Morgan** (Freelancer, 35) | Calculates that distractions cost $300+ in lost billable hours this month | Sees blurred weekly report with time-loss estimates that translate to real dollars | Financially motivated — treats this as a business expense | **MODERATE-HIGH** (6-9%) |

**Key Insight:** We never create the pain. The pain already exists. Our paywall appears at the exact moment the user is most acutely aware of their problem and most receptive to a solution. This is empathy-driven conversion, not manipulation.

---

### 2. Value Proposition Rewrites

Generic upgrade prompts ("Upgrade to Pro for more features") fail because they describe what the user gets instead of what the user feels. Every upgrade message must connect to the specific pain the user is experiencing at that moment.

#### Trigger-Specific Copy Rewrites

| Trigger | Current (Weak) | Rewritten (Strong) | Psychological Principle |
|---------|---------------|--------------------|-----------------------|
| **T1** — Blurred Weekly Report | "Upgrade to see full report" | "See exactly where your 3 hours went. Unblur your weekly focus report." | Curiosity gap + loss awareness |
| **T2** — 11th Site Added | "Upgrade for unlimited sites" | "Your blocklist is full. Don't let your 11th distraction win." | Personification of enemy + completion drive |
| **T3** — Nuclear Extension | "Upgrade for longer Nuclear" | "Still fighting distractions? Extend Nuclear to 24 hours. No escape." | Commitment escalation + strength framing |
| **T4** — Focus Score Breakdown | "Upgrade for score details" | "Your score dropped 12 points. See which sites caused it." | Specificity + diagnostic curiosity |
| **T5** — Custom Block Page | "Upgrade for custom pages" | "Replace 'Site Blocked' with your own motivation. Make it personal." | Autonomy + personalization desire |
| **T6** — Streak Recovery | "Upgrade for streak recovery" | "Your 14-day streak just broke. Pro users can recover it." | Loss aversion + sunk cost |
| **T7** — Advanced Scheduling | "Upgrade for more schedules" | "One schedule isn't enough. Block distractions automatically — mornings, evenings, weekends." | Reduced friction + automation appeal |
| **T8** — Sound Library | "Upgrade for more sounds" | "Focus sounds help you concentrate 23% longer. Unlock 15+ ambient mixes." | Evidence-based benefit + variety seeking |
| **T9** — Cross-Device Sync | "Upgrade for sync" | "Your blocklist on your laptop. Your phone. Your tablet. One setup, everywhere." | Convenience + consistency need |
| **T10** — AI Recommendations | "Upgrade for AI features" | "We analyzed your patterns. Here's a personalized plan to gain back 5 hours this week." | Personalization + specific outcome promise |

#### Copy Writing Rules for All Upgrade Messages

1. **Lead with their data** — Use real numbers from their usage ("your 3 hours," "your 14-day streak," "your 247 blocks")
2. **Name the enemy** — Distractions are the villain, not the user ("Don't let your 11th distraction win")
3. **Promise a specific outcome** — Not "more features" but "see where every minute went"
4. **Never shame** — Frame as empowerment, never guilt ("You focused for 18 hours" not "You wasted 22 hours")
5. **Keep it under 20 words** — The primary CTA message must be scannable in under 3 seconds

---

### 3. Pricing Psychology Framework

#### 3A. Reframing Strategies

Price resistance is rarely about the absolute amount — it is about perceived value relative to alternatives. Each reframe below attacks a different angle of price resistance.

| Frame | Copy | Where to Use | Target Persona |
|-------|------|-------------|---------------|
| **Daily cost** | "Less than a piece of gum — $0.16/day" | Upgrade page, below pricing cards | All |
| **Coffee comparison** | "Costs less than one coffee per month" | Paywall modals, dismiss state | Alex, Morgan |
| **ROI calculation** | "If Focus Mode saves you just 30 minutes per week, that's 26 hours per year. At $30/hr, that's $780 of productivity for $35.88/year." | Upgrade page, Morgan-targeted ads | Morgan (primary), Alex |
| **Student ROI** | "One better grade can change your GPA. Pro costs less than a single textbook chapter." | Student-targeted messaging | Jordan |
| **Vs competitors** | "BlockSite: $10.99/mo. Freedom: $8.99/mo. Focus Mode Pro: $4.99/mo — with MORE features." | Upgrade page comparison section | All (especially researchers) |
| **Annual savings** | "Save 40% with annual billing — $2.99/mo instead of $4.99/mo" | Plan selection, pre-selected annual | All |
| **Lifetime value** | "Pay once, focus forever. $49.99 lifetime = less than 10 months of monthly." | Upgrade page, third pricing card | Power users, Sam |
| **Hourly wage** | "At minimum wage, Pro costs 40 minutes of work per month. It saves you hours." | Objection handling FAQ | Price-sensitive users |
| **Per-distraction** | "You blocked 247 distractions this month. That's $0.02 per distraction blocked with Pro." | Stats-triggered nudge | Data-driven users |

#### 3B. Price Anchoring in Upgrade UI

The upgrade page must use deliberate anchoring to make the annual plan feel like the obvious choice:

```
DISPLAY ORDER (left to right):
  Monthly ($4.99/mo)  |  Annual ($2.99/mo) ★ RECOMMENDED  |  Lifetime ($49.99)

ANCHORING TACTICS:
  1. Annual plan is pre-selected (highlighted border, slightly larger card)
  2. "SAVE 40%" badge on annual plan in green
  3. Monthly plan shows "equivalent to $59.88/year" in small text
  4. Annual plan shows "$35.88/year" prominently
  5. Lifetime shows "= 10 months of monthly" to create urgency toward annual
  6. Annual plan card has a subtle "Most Popular" tag
```

**Why this order works:** Monthly acts as a high anchor ($59.88/yr equivalent), making annual ($35.88/yr) feel like a bargain. Lifetime ($49.99) creates a secondary anchor that makes annual seem reasonable while also capturing users who want to "own" forever.

#### 3C. Decoy Pricing Effect

The monthly plan is intentionally positioned as the "decoy" — it exists primarily to make the annual plan look like better value. The monthly-to-annual gap (40% savings) is large enough to feel significant but not so large that monthly seems unreasonable for short-term users.

#### 3D. Payment Timing Psychology

- **Free trial first:** Always lead with "Start Free Trial" rather than "Buy Now" — reduces commitment anxiety
- **Trial-to-paid transition:** Send reminders at Day 5 and Day 6 of 7-day trial with usage stats ("You've used 12 Pro features this week")
- **Annual billing date:** Frame as "$35.88 billed once per year" not "$2.99/mo billed annually" in the final checkout — the per-month framing is for comparison, the annual total is for checkout transparency

---

### 4. Urgency & Scarcity (Legitimate, Not Fabricated)

Every urgency tactic must be grounded in real data or real constraints. Fake scarcity destroys trust and violates Chrome Web Store policies.

| Tactic | Implementation | Why It Is Legitimate | Copy Example |
|--------|---------------|---------------------|-------------|
| **Loss aversion (streak)** | Show streak-at-risk warning when streak will reset within 24 hours | Streaks genuinely do reset at midnight; this is a real deadline | "Your 14-day streak will reset at midnight unless you recover it (Pro)" |
| **Progress anchoring** | Display cumulative stats in paywall modals | Real data the user generated; reinforces invested effort | "You've blocked 247 distractions this month. Don't lose your momentum." |
| **Founding member pricing** | Offer $2.99/mo (instead of $4.99/mo) for first 200 Pro subscribers | Genuinely limited early-adopter pricing; counter increments publicly | "Founding Member: $2.99/mo for the first 200 Pro users (147 remaining)" |
| **Limited lifetime deal** | Cap lifetime licenses at 500 total | Real inventory constraint; once sold, permanently unavailable | "Lifetime Pro — $49.99 (only 312 of 500 remaining)" |
| **Social proof velocity** | Show real-time upgrade count | Sourced from actual payment data; only shown when count is meaningful | "347 people upgraded to Pro this week" |
| **Trial expiry** | Countdown during last 48 hours of free trial | Real deadline; features genuinely revert after trial | "Your Pro trial ends in 36 hours. Keep all your features — upgrade now." |
| **Seasonal anchoring** | New Year, back-to-school, Q1 productivity season promotions | Tied to genuine seasonal patterns in productivity tool adoption | "New Year Focus Sale: 50% off your first 3 months" |
| **Usage milestone** | Celebrate and convert at usage milestones (100 blocks, 30-day streak) | Real accomplishments; paywall is secondary to celebration | "You just hit 100 distractions blocked! Pro users average 3x more." |

#### What We Never Do

- Never show fake countdown timers that reset on page reload
- Never claim "only 3 left" if inventory is not genuinely limited
- Never fabricate social proof numbers
- Never create artificial urgency during focus sessions (violates core paywall rules)
- Never use dark patterns like pre-checked add-ons or hidden fees

---

### 5. Segment-Specific Messaging

#### 5A. Alex — Overwhelmed Knowledge Worker (32)

**Headline Variants:**
1. "Stop Losing 3 Hours a Day to Distractions"
2. "Your Productivity Report Is Ready. Are You?"
3. "Take Back Your Workday — Starting Now"

**Benefit Hierarchy (most to least important):**
1. Weekly focus reports with detailed time breakdowns (T1)
2. Focus Score tracking to measure improvement over time (T4)
3. Unlimited blocklist for all workplace distractions (T2)
4. Schedule-based blocking for work hours automation (T7)
5. Cross-device sync for office + home consistency (T9)

**Objection Handling:**
| Objection | Response |
|-----------|----------|
| "I should be able to focus without a tool" | "Even elite athletes use coaches. Focus Mode is your digital discipline coach." |
| "My company should pay for this" | "Ask your IT department — we offer Team plans at $3.99/user/mo. Many companies cover productivity tools." |
| "I've tried blockers before and stopped using them" | "Focus Mode's streak system keeps you engaged. 73% of users who hit a 7-day streak keep using the extension for 6+ months." |

**Best Conversion Trigger:** T1 (Blurred Weekly Report) — Alex is data-driven and the report speaks his language.

---

#### 5B. Jordan — Struggling Student (21)

**Headline Variants:**
1. "Study Mode: No Distractions, No Excuses"
2. "Your Exam Is Tomorrow. Your Focus Starts Now."
3. "Block Everything. Ace Everything."

**Benefit Hierarchy (most to least important):**
1. Nuclear Mode extension for long study sessions (T3)
2. Focus timer with customizable Pomodoro lengths (session feature)
3. Quick-block for social media with one click (free, drives engagement)
4. Ambient study sounds for concentration (T8)
5. Streak tracking for building study habits (T6)

**Objection Handling:**
| Objection | Response |
|-----------|----------|
| "I'm a broke student" | "Pro costs $2.99/mo with annual billing — less than one energy drink. And we offer student discounts during back-to-school." |
| "I only need it during exams" | "Monthly plan: $4.99/mo. Subscribe for exam season, cancel after. No commitment." |
| "I can just turn off my phone" | "Can you, though? Focus Mode blocks distractions on your laptop where you actually need to study." |

**Best Conversion Trigger:** T3 (Nuclear Extension) — Jordan hits this during desperate cram sessions when willpower to resist upgrading is lowest.

---

#### 5C. Sam — Neurodivergent Professional (28)

**Headline Variants:**
1. "External Structure That Actually Works"
2. "Your Brain Needs Guardrails. We Built Them."
3. "ADHD-Friendly Focus — Block It, Forget It, Focus"

**Benefit Hierarchy (most to least important):**
1. Unlimited blocklist to cover every possible distraction (T2)
2. Nuclear Mode for unbreakable focus periods (T3)
3. Automated scheduling so blocking happens without remembering (T7)
4. Custom block pages with personal motivation messages (T5)
5. Cross-device sync so structure is consistent everywhere (T9)

**Objection Handling:**
| Objection | Response |
|-----------|----------|
| "I need to block MORE than 10 sites" | "Exactly. Most neurodivergent users block 20-35 sites. Pro gives you unlimited — block every rabbit hole." |
| "What if I need to access a blocked site for work?" | "Allowlist specific pages while keeping the domain blocked. Or use scheduled blocking that turns off during breaks." |
| "I keep forgetting to turn it on" | "Pro's scheduling feature runs automatically. Set it once, and Focus Mode activates itself during your work hours." |

**Best Conversion Trigger:** T2 (11th Site Added) — Sam's blocklist fills up fast because they genuinely need comprehensive blocking. The limit creates real friction.

---

#### 5D. Morgan — Freelancer/Entrepreneur (35)

**Headline Variants:**
1. "Every Distraction Costs You Money. Block Them All."
2. "Reclaim $608/Week in Lost Productivity"
3. "Your Most Profitable Tool: $2.99/Month"

**Benefit Hierarchy (most to least important):**
1. Weekly reports with time-loss cost estimates (T1)
2. Focus Score as a professional KPI (T4)
3. AI-powered productivity recommendations (T10)
4. Unlimited scheduling for client-work time blocks (T7)
5. Cross-device sync for office, home office, and mobile (T9)

**Objection Handling:**
| Objection | Response |
|-----------|----------|
| "Is this tax deductible?" | "Productivity software is typically deductible as a business expense. Consult your accountant — we provide invoices." |
| "$4.99/mo seems high for a browser extension" | "If Focus Mode saves you one billable hour per month at any rate above $5/hr, it pays for itself. Most freelancers report saving 5+ hours." |
| "I need this on multiple devices" | "Pro includes cross-device sync. One subscription covers your laptop, desktop, and every Chrome profile." |

**Best Conversion Trigger:** T1 (Blurred Weekly Report) — Morgan thinks in dollars. The report translates time into money, which is Morgan's native language.

---

## Part B: Conversion Touchpoint Design

### 1. Paywall Moment Design (All 10 Triggers)

#### Paywall Ground Rules (Apply to ALL Triggers)

These rules are inviolable and override any specific trigger design:

1. **Never interrupt an active focus session** — Paywalls appear only when the user is in a natural pause state (browsing popup, viewing stats, changing settings)
2. **Never shame the user** — All copy frames the user positively and the distraction as the enemy
3. **Never degrade free features** — Free features work identically on Day 1 and Day 1,000. Paywalls gate additional capabilities, not reduced quality
4. **Maximum one paywall per session** — If the user dismisses a paywall, no other paywall appears until the next browser session
5. **No paywalls in first 2 sessions** — The user must experience the core product before any upgrade messaging appears
6. **Always provide a clear dismiss option** — Every paywall has a visible, non-punitive way to close it
7. **Track and respect fatigue** — If a user dismisses the same paywall 3 times, reduce frequency to once per 2 weeks for that trigger

---

#### T1: Weekly Report (Blurred) — PRIMARY TRIGGER

**Expected Conversion Rate:** 8-12%

**When it triggers:**
- End of the user's first full week of use (7 days after install)
- Every subsequent Sunday at 6:00 PM local time (weekly report generation)
- User can also access via "Weekly Report" tab in popup/options

**UI Design:**
```
┌─────────────────────────────────────────────────────────────┐
│  WEEKLY FOCUS REPORT — Jan 27 - Feb 2, 2026                │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  VISIBLE (Free):                                     │    │
│  │  Focus Score: 72/100  (↑ from last week)            │    │
│  │  Total Focus Time: 18h 32m                          │    │
│  │  Distractions Blocked: 156                          │    │
│  │  Current Streak: 7 days                             │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  BLURRED (Pro): [████████████████████████████████]  │    │
│  │  ░░ Time by Site ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │    │
│  │  ░░ reddit.com ████████ ░h ░░m ░░░░░░░░░░░░░░░░░  │    │
│  │  ░░ youtube.com ██████ ░h ░░m ░░░░░░░░░░░░░░░░░░  │    │
│  │  ░░ twitter.com ████ ░h ░░m ░░░░░░░░░░░░░░░░░░░░  │    │
│  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │    │
│  │  ░░ Daily Trend Chart ░░░░░░░░░░░░░░░░░░░░░░░░░░░  │    │
│  │  ░░ [blurred line graph] ░░░░░░░░░░░░░░░░░░░░░░░░  │    │
│  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │    │
│  │  ░░ Focus Pattern Analysis ░░░░░░░░░░░░░░░░░░░░░░  │    │
│  │  ░░ AI Recommendations ░░░░░░░░░░░░░░░░░░░░░░░░░░  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  "You focused for 18 hours this week.                       │
│   See exactly where every minute went."                     │
│                                                              │
│  [🔓 Unblur Your Full Report — Start Free Trial]            │
│  ────────────────────────────────────────────                │
│  $4.99/mo  ·  $2.99/mo annually (save 40%)                 │
│                                                              │
│  [Maybe later — remind me next week]                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Visual Details:**
- Gaussian blur radius: 8px on all Pro content — enough to see shapes/colors but not read text
- Blur overlay has a subtle gradient border (blue to purple) to feel premium, not broken
- The free summary stats are fully crisp and satisfying — the user gets genuine value
- Blurred sections show tantalizing hints: site favicons are partially visible, chart axes are visible but data is blurred

**Dismiss Behavior:**
- "Maybe later" closes the paywall, sets `lastReportPaywallDismiss` timestamp
- Report still accessible with blur; user can return anytime
- Next weekly report triggers the same paywall (weekly cadence)
- After 3 dismissals: paywall appears every other week instead

**A/B Test Variants:**
- Variant A: "Unblur Your Full Report" (current)
- Variant B: "See Where Your Time Went" (curiosity-focused)
- Variant C: "Unlock Detailed Insights" (value-focused)

---

#### T2: 11th Site Added — SECONDARY TRIGGER

**Expected Conversion Rate:** 5-8%

**When it triggers:**
- User clicks "Add Site" or types a URL to add their 11th blocked site
- The site is NOT added; instead, the paywall modal appears

**UI Design:**
```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  ⚠ Blocklist Full (10 of 10 sites)                      │
│                                                          │
│  Your current blocklist:                                 │
│  1. reddit.com          6. instagram.com                │
│  2. youtube.com         7. tiktok.com                   │
│  3. twitter.com         8. news.ycombinator.com         │
│  4. facebook.com        9. twitch.tv                    │
│  5. netflix.com        10. discord.com                  │
│                                                          │
│  ┌───────────────────────────────────────────────┐      │
│  │  + pinterest.com  ← You tried to add this     │      │
│  └───────────────────────────────────────────────┘      │
│                                                          │
│  "Most power users block 15-25 sites.                   │
│   Unlock unlimited to block everything."                 │
│                                                          │
│  [Unlock Unlimited Sites — Start Free Trial]             │
│  $4.99/mo  ·  $2.99/mo annually (save 40%)             │
│                                                          │
│  ── or ──                                                │
│                                                          │
│  [Stay with 10 sites → Remove a site to make room]      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Visual Details:**
- Modal overlay on popup with slight background dim (rgba 0,0,0,0.4)
- The 10 existing sites are shown with their favicons for visual recognition
- The 11th site is highlighted in a dashed-border box to show "this is what you're missing"
- The "Remove a site" link is a genuine, functional fallback — not a guilt path

**Dismiss Behavior:**
- "Stay with 10 sites" closes modal and opens the blocklist editor with remove options
- If user removes a site and adds the 11th, no paywall (they solved the problem)
- If user tries to add a 12th site later, same paywall but updated list
- After 3 dismissals: show an inline counter "10/10 sites" in the blocklist header instead of full modal; modal only on explicit "why can't I add more?" click

**Microcopy Variants by Persona:**
- For power users: "You've outgrown 10 sites. Unlock unlimited blocking."
- For new users: "10 sites is a great start. Most users eventually need 20+."

---

#### T3: Nuclear Mode Extension Beyond 1 Hour — HIGH-VALUE TRIGGER

**Expected Conversion Rate:** 6-10%

**When it triggers:**
- User is in an active Nuclear Mode session with a 1-hour timer
- Timer hits 0:00 and Nuclear Mode ends
- User tries to reactivate Nuclear Mode, OR
- At initial Nuclear Mode setup, user tries to set duration > 60 minutes

**UI Design (Post-Expiry Variant):**
```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  Nuclear Mode Ended                                      │
│                                                          │
│  ✓ You stayed focused for 1 hour. Solid work.           │
│                                                          │
│  Need more time?                                         │
│  Pro users can set Nuclear Mode from 1 to 24 hours.     │
│  No override. No escape. Pure focus.                     │
│                                                          │
│  [Extend to 24 Hours — Start Free Trial]                 │
│  $4.99/mo  ·  $2.99/mo annually (save 40%)             │
│                                                          │
│  [Restart 1-hour Nuclear (Free)]                         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**UI Design (Pre-Set Variant):**
```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  Set Nuclear Mode Duration                               │
│                                                          │
│  ○ 15 min    ○ 30 min    ● 60 min (max free)           │
│                                                          │
│  ┌──── PRO ─────────────────────────────────────┐       │
│  │  ○ 2 hours   ○ 4 hours   ○ 8 hours          │       │
│  │  ○ 12 hours  ○ 24 hours  ○ Custom            │       │
│  │                                               │       │
│  │  "Still fighting distractions?                │       │
│  │   Extend Nuclear to 24 hours. No escape."    │       │
│  │                                               │       │
│  │  [Unlock Extended Nuclear — Start Free Trial] │       │
│  └───────────────────────────────────────────────┘       │
│                                                          │
│  [Start 60-min Nuclear]                                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Visual Details:**
- Pro duration options are visible but disabled (grayed out with a small lock icon)
- Selecting a Pro option triggers the inline upgrade prompt within the box
- The free 60-minute option is always functional and prominent
- Post-expiry variant leads with a congratulations message before the upsell

**Dismiss Behavior:**
- "Restart 1-hour Nuclear" closes paywall and starts a new free session
- The paywall does NOT appear during an active Nuclear session (cardinal rule)
- After session ends, if user has seen this paywall 3+ times, show a compact one-line nudge instead: "Need longer? Go Pro for up to 24h Nuclear."

---

#### T4: Focus Score Breakdown

**Expected Conversion Rate:** 4-7%

**When it triggers:**
- User views their Focus Score in the popup and taps/clicks for details
- Focus Score changes by more than 10 points (up or down) in a single day

**UI Design:**
```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  Your Focus Score: 72                                    │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░  (72/100)                   │
│                                                          │
│  Score Factors:                                          │
│  ✓ Distractions Blocked: +18 pts    (visible)           │
│  ✓ Focus Time: +22 pts              (visible)           │
│  ✓ Streak Bonus: +7 pts             (visible)           │
│  🔒 Site-by-site impact: ???        (Pro)               │
│  🔒 Hourly breakdown: ???           (Pro)               │
│  🔒 Weekly trend: ???               (Pro)               │
│  🔒 Personalized tips: ???          (Pro)               │
│                                                          │
│  "Your score dropped 12 points today.                   │
│   See which sites caused it."                            │
│                                                          │
│  [Unlock Score Breakdown — Start Free Trial]             │
│                                                          │
│  [Got it]                                                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Visual Details:**
- The score bar uses a gradient (red to yellow to green) based on score value
- Free factors are shown with point values; Pro factors show "???" with lock icons
- If the score dropped, the copy dynamically references the drop amount
- If the score rose, the copy shifts: "Your score jumped 15 points! See which habits drove it."

**Dismiss Behavior:**
- "Got it" closes the detail panel; score remains visible in popup header
- This paywall triggers at most once per week (not on every score view)

---

#### T5: Custom Block Page

**Expected Conversion Rate:** 3-5%

**When it triggers:**
- User encounters the default "Site Blocked" page and clicks "Customize this page" link
- User navigates to block page settings in options

**UI Design:**
```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  Customize Your Block Page                               │
│                                                          │
│  Preview:                                                │
│  ┌─────────────────────────────────────────────────┐    │
│  │                                                   │    │
│  │   "You're better than this distraction."         │    │
│  │                                                   │    │
│  │   [Your custom message here]                     │    │
│  │   [Your motivational image]                      │    │
│  │   [Your focus goal for today]                    │    │
│  │                                                   │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  "Replace 'Site Blocked' with your own motivation.      │
│   Make it personal."                                     │
│                                                          │
│  Options (Pro):                                          │
│  🔒 Custom message text                                 │
│  🔒 Background image/color                              │
│  🔒 Motivational quote rotation                         │
│  🔒 Display today's focus goal                          │
│  🔒 Breathing exercise widget                           │
│                                                          │
│  [Customize Your Block Page — Start Free Trial]          │
│                                                          │
│  [Keep default page]                                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Dismiss Behavior:**
- "Keep default page" returns to settings; no further prompt for 30 days
- Lower conversion but high engagement signal — users who customize tend to be long-term retainers

---

#### T6: Streak Recovery

**Expected Conversion Rate:** 5-8%

**When it triggers:**
- User's streak breaks (missed a day of focus activity)
- Next time user opens the extension popup after a streak break

**UI Design:**
```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  💔 Your Streak Broke                                    │
│                                                          │
│  Previous Streak: 14 days                                │
│  Current Streak: 0 days                                  │
│                                                          │
│  ┌──── Streak Timeline ─────────────────────────┐       │
│  │  ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✗ ·          │       │
│  │  Day 1 ──────────────────────── Day 14  Today │       │
│  └───────────────────────────────────────────────┘       │
│                                                          │
│  "Your 14-day streak just broke.                        │
│   Pro users can recover it — pick up right where        │
│   you left off."                                         │
│                                                          │
│  [Recover My Streak — Start Free Trial]                  │
│  (You have 24 hours to recover)                          │
│                                                          │
│  [Start a new streak from Day 1]                         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Visual Details:**
- The streak timeline shows checkmarks for successful days and a clear X for the break
- The 24-hour recovery window is a real, legitimate constraint — after 24 hours, the recovery option expires
- The "heart broken" visual is empathetic, not shaming — it mirrors the user's feeling, not our judgment

**Dismiss Behavior:**
- "Start a new streak" resets the counter and closes the modal
- Recovery paywall only appears once per streak break (not repeating)
- If user has broken 3+ streaks without recovering, show a softer version: "Streaks are hard. Pro's Streak Recovery gives you a safety net."

---

#### T7: Advanced Scheduling

**Expected Conversion Rate:** 3-6%

**When it triggers:**
- User creates their first schedule (free) and tries to create a second
- User tries to access weekend/weekday-specific scheduling

**UI Design:**
```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  Focus Schedules                                         │
│                                                          │
│  Active Schedule:                                        │
│  ✓ "Work Hours" — Mon-Fri, 9am-5pm                     │
│                                                          │
│  + Add New Schedule                                      │
│                                                          │
│  ┌──── PRO ─────────────────────────────────────┐       │
│  │  Suggested Schedules:                         │       │
│  │  🔒 "Evening Wind-Down" — Daily, 9pm-11pm   │       │
│  │  🔒 "Weekend Focus" — Sat-Sun, 10am-2pm     │       │
│  │  🔒 "Study Sessions" — Custom recurring      │       │
│  │  🔒 Create unlimited custom schedules        │       │
│  │                                               │       │
│  │  "One schedule isn't enough.                  │       │
│  │   Block distractions automatically —          │       │
│  │   mornings, evenings, weekends."              │       │
│  │                                               │       │
│  │  [Unlock Unlimited Schedules — Free Trial]    │       │
│  └───────────────────────────────────────────────┘       │
│                                                          │
│  [Keep one schedule]                                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Dismiss Behavior:**
- "Keep one schedule" closes the Pro section; schedule editor remains functional
- Suggested schedules section collapses to a single line: "Want more schedules? Go Pro."
- Reappears if user edits their single schedule (indicating they want schedule flexibility)

---

#### T8: Sound Library (Ambient Focus Sounds)

**Expected Conversion Rate:** 3-5%

**When it triggers:**
- User opens the focus sounds panel
- 3 free sounds are available; 15+ Pro sounds are visible but locked

**UI Design:**
```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  Focus Sounds                                            │
│                                                          │
│  Free Sounds:                                            │
│  ▶ Rain on Window          ▶ White Noise                │
│  ▶ Gentle Stream                                         │
│                                                          │
│  Pro Sounds:                                  [PRO]      │
│  🔒 Coffee Shop Ambiance   🔒 Deep Forest              │
│  🔒 Ocean Waves            🔒 Fireplace Crackling       │
│  🔒 Thunderstorm           🔒 Library Quiet             │
│  🔒 Lo-Fi Beats            🔒 Binaural Focus           │
│  🔒 Night Crickets         🔒 Wind Chimes              │
│  🔒 Train Journey          🔒 Rainfall + Thunder       │
│  🔒 Piano Ambient          🔒 Space Drone              │
│  🔒 Japanese Garden                                     │
│                                                          │
│  + Mix up to 3 sounds together (Pro)                    │
│                                                          │
│  "Focus sounds help you concentrate 23% longer.         │
│   Unlock 15+ ambient mixes."                             │
│                                                          │
│  [Unlock All Sounds — Start Free Trial]                  │
│                                                          │
│  [Keep free sounds]                                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Visual Details:**
- Free sounds have a play button; Pro sounds have a lock icon but show the name
- Tapping a Pro sound plays a 5-second preview before showing the upgrade prompt
- Sound mixing (layering multiple sounds) is a Pro-exclusive feature with visual mixer UI
- Small "PRO" badge in the section header, not overwhelming

**Dismiss Behavior:**
- "Keep free sounds" hides the upgrade prompt for the session
- Pro sounds remain visible (with locks) to maintain awareness
- 5-second preview is always available — this creates desire through sampling

---

#### T9: Cross-Device Sync

**Expected Conversion Rate:** 4-6%

**When it triggers:**
- User installs the extension on a second device and signs in
- User looks for import/export settings
- User clicks "Sync" option in settings

**UI Design:**
```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  Cross-Device Sync                                       │
│                                                          │
│  Your devices:                                           │
│  💻 MacBook Pro (this device) — 10 sites blocked        │
│  🖥  Work Desktop — Extension installed, not synced     │
│                                                          │
│  "Your blocklist on your laptop. Your desktop.          │
│   Your Chromebook. One setup, everywhere."               │
│                                                          │
│  Sync includes:                                          │
│  🔒 Blocklist sync across devices                       │
│  🔒 Schedule sync                                       │
│  🔒 Settings sync                                       │
│  🔒 Stats aggregation across devices                    │
│  🔒 Focus Score combines all devices                    │
│                                                          │
│  [Sync All Devices — Start Free Trial]                   │
│                                                          │
│  [Set up each device separately]                         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Dismiss Behavior:**
- "Set up each device separately" closes prompt; manual export/import available as free alternative
- Sync paywall only appears on device detection events, not repeatedly

---

#### T10: AI Focus Recommendations

**Expected Conversion Rate:** 3-5%

**When it triggers:**
- After 2+ weeks of usage data, AI recommendations become available
- User taps "View Recommendations" or "Improve Score" in the popup
- Recommendations section in weekly report (blurred)

**UI Design:**
```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  AI Focus Recommendations                                │
│                                                          │
│  Based on 14 days of your focus data:                   │
│                                                          │
│  ┌──── Preview ──────────────────────────────────┐      │
│  │  "We analyzed your patterns. Here's a          │      │
│  │   personalized plan to gain back 5 hours       │      │
│  │   this week."                                   │      │
│  │                                                 │      │
│  │  🔒 Your biggest time sink is [blurred]        │      │
│  │  🔒 Best focus hours: [blurred]                │      │
│  │  🔒 Recommended schedule: [blurred]            │      │
│  │  🔒 Sites to add to blocklist: [blurred]      │      │
│  │  🔒 Optimal session length for you: [blurred] │      │
│  └────────────────────────────────────────────────┘      │
│                                                          │
│  [Unlock AI Recommendations — Start Free Trial]          │
│                                                          │
│  [Skip for now]                                          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Dismiss Behavior:**
- "Skip for now" hides for 1 week; new recommendations generated weekly
- Preview text updates with real patterns to maintain novelty
- Lowest-pressure paywall; AI features are positioned as premium-tier

---

### 2. Progressive Disclosure Nudges

These are non-intrusive, non-modal upgrade signals that appear at moments of value. They celebrate the user's progress first and mention Pro second. They never block interaction.

| # | Trigger Moment | Location | Copy | Visual Treatment | Dismiss Behavior |
|---|---------------|----------|------|-----------------|-----------------|
| 1 | After first completed 25-min focus session | Popup, below session summary | "Great session! Pro users can set custom durations (1-240 min)." | Small blue banner, 12px text, subtle "PRO" badge, X to dismiss | Dismiss hides for 7 days |
| 2 | After reaching 7-day streak | Popup, toast notification | "7 days in a row! Pro users never lose streaks with Streak Recovery." | Green toast, auto-dismiss after 5 seconds, fades out | Auto-dismiss; shows once |
| 3 | After 50 total distractions blocked | Stats tab, inline | "50 distractions blocked! See your full blocking report with Pro." | Inline banner below stats, light purple background | Dismiss hides permanently for this milestone |
| 4 | First time opening sound panel | Sound settings panel | "Love focus sounds? Pro unlocks 15+ ambient mixes." | Small "PRO" badges on locked sounds, one-line text | Always visible as badges; text line dismissible |
| 5 | After creating first schedule | Schedule settings | "One schedule active. Pro users run unlimited schedules." | Subtle inline text below schedule, gray color | Dismiss hides for 14 days |
| 6 | After 100 total distractions blocked | Popup, celebration modal | "100 distractions demolished! You're in the top 20% of Focus Mode users. See detailed stats with Pro." | Celebratory confetti animation (brief), milestone badge, small Pro mention | Auto-dismiss after 8 seconds; Pro mention is secondary |
| 7 | After 3 consecutive Nuclear sessions | Popup, inline | "You love Nuclear Mode. Pro unlocks sessions up to 24 hours." | One-line text in Nuclear section with lock icon | Dismiss hides for 7 days |
| 8 | After 14-day streak | Popup, achievement panel | "14-day streak! You're building a real habit. Pro's analytics show your focus patterns evolving." | Achievement badge (bronze to silver upgrade animation), Pro mention in description | Achievement always visible; Pro text shown once |

#### Nudge Design Principles

1. **Celebration first, upgrade second:** The primary message is always about the user's achievement. The Pro mention is the secondary clause.
2. **Contextual relevance:** Each nudge appears in the context where the related Pro feature would be used (sound nudge in sound panel, schedule nudge in schedule settings).
3. **No stacking:** If a nudge is visible, no other nudge appears in the same view.
4. **Progressive frequency:** Nudges become less frequent as the user dismisses them, not more frequent.
5. **Real data only:** "Top 20% of users" or "50 distractions blocked" always uses actual numbers.

---

### 3. Upgrade Page Design

The upgrade page is a dedicated full-page experience accessible from any "Learn More," "Start Free Trial," or pricing link. It opens in a new tab (not a popup overlay) to provide space for full comparison and decision-making.

#### Layout Structure

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                       │
│  HEADER                                                               │
│  ─────                                                                │
│  Logo + "Focus Mode - Blocker"                                       │
│                                                                       │
│  HEADLINE: "Unlock Your Full Focus Potential"                        │
│  SUBHEAD: "Join 2,847 professionals who upgraded to Pro this month"  │
│                                                                       │
│  ═══════════════════════════════════════════════════════════════════  │
│                                                                       │
│  PRICING CARDS (3 columns)                                           │
│  ─────────────────────────                                            │
│  ┌────────────────┐  ┌────────────────────┐  ┌────────────────┐     │
│  │    MONTHLY      │  │   ★ ANNUAL ★       │  │   LIFETIME     │     │
│  │                 │  │   Most Popular      │  │                │     │
│  │   $4.99/mo     │  │                     │  │   $49.99       │     │
│  │                 │  │   $2.99/mo          │  │   one-time     │     │
│  │   $59.88/year  │  │   SAVE 40%          │  │                │     │
│  │   equivalent   │  │   $35.88/year       │  │   = 10 months  │     │
│  │                 │  │                     │  │   of monthly   │     │
│  │  [Select]       │  │  [✓ Selected]       │  │  [Select]      │     │
│  └────────────────┘  └────────────────────┘  └────────────────┘     │
│                                                                       │
│  [Start 7-Day Free Trial]  ← Large primary CTA button               │
│  "No charge until trial ends. Cancel anytime."                       │
│                                                                       │
│  ═══════════════════════════════════════════════════════════════════  │
│                                                                       │
│  YOUR STATS (personalized, if available)                             │
│  ──────────                                                           │
│  "You've blocked 247 distractions and focused for 42 hours.         │
│   Imagine what you could do with Pro."                               │
│                                                                       │
│  ═══════════════════════════════════════════════════════════════════  │
│                                                                       │
│  FEATURE COMPARISON TABLE                                            │
│  ────────────────────────                                             │
│  ┌──────────────────────────────┬──────────┬──────────┐             │
│  │ Feature                      │   Free   │   Pro    │             │
│  ├──────────────────────────────┼──────────┼──────────┤             │
│  │ Site Blocking                │  10 sites│Unlimited │             │
│  │ Focus Timer                  │  25 min  │ 1-240min │             │
│  │ Nuclear Mode                 │  ≤1 hour │ ≤24 hours│             │
│  │ Focus Score                  │  Score   │ Full     │             │
│  │                              │  only    │ breakdown│             │
│  │ Weekly Reports               │  Summary │ Detailed │             │
│  │                              │          │ + trends │             │
│  │ Streak Tracking              │    ✓     │    ✓     │             │
│  │ Streak Recovery              │    ✗     │    ✓     │             │
│  │ Focus Schedules              │    1     │Unlimited │             │
│  │ Block Page Customization     │    ✗     │    ✓     │             │
│  │ Focus Sounds                 │    3     │   18+    │             │
│  │ Sound Mixing                 │    ✗     │    ✓     │             │
│  │ Cross-Device Sync            │    ✗     │    ✓     │             │
│  │ AI Recommendations           │    ✗     │    ✓     │             │
│  │ Export Data (CSV)            │    ✗     │    ✓     │             │
│  │ Priority Support             │    ✗     │    ✓     │             │
│  └──────────────────────────────┴──────────┴──────────┘             │
│                                                                       │
│  ═══════════════════════════════════════════════════════════════════  │
│                                                                       │
│  SOCIAL PROOF                                                        │
│  ────────────                                                         │
│  ★★★★★ 4.8 from 500+ Chrome Web Store reviews                      │
│                                                                       │
│  "Focus Mode completely changed how I work. I went from              │
│   3 hours of Reddit a day to zero. The weekly reports                │
│   keep me honest." — Alex K., Software Engineer                      │
│                                                                       │
│  "Nuclear Mode during exams is a lifesaver. Worth every              │
│   penny of Pro." — Jordan T., University Student                     │
│                                                                       │
│  "As someone with ADHD, unlimited blocking is essential.             │
│   10 sites was never enough." — Sam R., UX Designer                 │
│                                                                       │
│  ═══════════════════════════════════════════════════════════════════  │
│                                                                       │
│  COMPETITOR COMPARISON                                               │
│  ─────────────────────                                                │
│  ┌──────────────────┬──────────┬──────────┬──────────┬───────────┐  │
│  │                  │Focus Mode│BlockSite │ Freedom  │ StayFocusd│  │
│  │                  │   Pro    │          │          │           │  │
│  ├──────────────────┼──────────┼──────────┼──────────┼───────────┤  │
│  │ Monthly Price    │ $4.99    │ $10.99   │  $8.99   │   Free    │  │
│  │ Nuclear Mode     │    ✓     │    ✗     │    ✓     │   Partial │  │
│  │ Focus Score      │    ✓     │    ✗     │    ✗     │    ✗      │  │
│  │ Weekly Reports   │    ✓     │  Basic   │    ✓     │    ✗      │  │
│  │ Focus Sounds     │    ✓     │    ✗     │    ✗     │    ✗      │  │
│  │ AI Recommend.    │    ✓     │    ✗     │    ✗     │    ✗      │  │
│  │ Streak System    │    ✓     │    ✗     │    ✗     │    ✗      │  │
│  │ Active Updates   │    ✓     │    ✓     │    ✓     │    ✗      │  │
│  └──────────────────┴──────────┴──────────┴──────────┴───────────┘  │
│                                                                       │
│  ═══════════════════════════════════════════════════════════════════  │
│                                                                       │
│  FAQ (Objection Handling)                                            │
│  ────────────────────────                                             │
│                                                                       │
│  ▸ Can I cancel anytime?                                             │
│    Yes. Cancel instantly from your account. No calls, no emails,     │
│    no hassle. Your subscription ends at the billing period.          │
│                                                                       │
│  ▸ Is there a free trial?                                            │
│    Yes — 7 days of full Pro access. No charge until the trial ends.  │
│    We'll remind you 2 days before so there are no surprises.         │
│                                                                       │
│  ▸ What happens if I cancel Pro?                                     │
│    You keep ALL your data. Your blocklist, stats, and history stay   │
│    intact. You revert to free-tier limits (10 sites, 1hr Nuclear).   │
│                                                                       │
│  ▸ Is my payment secure?                                             │
│    Stripe handles all payments. We never see or store your card      │
│    number. Stripe is used by Amazon, Google, and millions of         │
│    businesses worldwide.                                              │
│                                                                       │
│  ▸ Can my company pay for this?                                      │
│    Yes! We offer Team plans at $3.99/user/mo with admin controls,    │
│    team analytics, and centralized billing. Contact us for invoicing.│
│                                                                       │
│  ▸ Is Focus Mode better than BlockSite or Freedom?                   │
│    Focus Mode Pro costs $4.99/mo vs BlockSite ($10.99) and Freedom   │
│    ($8.99) — with unique features like Focus Score, Nuclear Mode,    │
│    streaks, and AI recommendations that neither competitor offers.    │
│                                                                       │
│  ▸ I'm a student — is there a discount?                              │
│    We regularly run student promotions during back-to-school season. │
│    Sign up for our newsletter to be notified. Annual billing at      │
│    $2.99/mo is already our most affordable option.                   │
│                                                                       │
│  ═══════════════════════════════════════════════════════════════════  │
│                                                                       │
│  GUARANTEE                                                           │
│  ─────────                                                            │
│  🛡 7-Day Money-Back Guarantee                                       │
│  Not satisfied? Email us within 7 days for a full refund.            │
│  No questions asked. We want you to upgrade with zero risk.          │
│                                                                       │
│  ═══════════════════════════════════════════════════════════════════  │
│                                                                       │
│  FINAL CTA                                                           │
│  ─────────                                                            │
│  "Less than $0.10/day. More than 2 extra hours per week."           │
│                                                                       │
│  [Start Your 7-Day Free Trial]  ← Large green button                │
│  "No credit card required to start"  (if possible)                   │
│     OR                                                                │
│  "Cancel anytime. No questions asked."                               │
│                                                                       │
│  TRUST BADGES: Stripe Secured | 500+ Reviews | 30-Day Guarantee     │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

#### Responsive Behavior

- **Desktop (>768px):** Three pricing cards side by side, full comparison table
- **Tablet (768px):** Pricing cards stack to two + one, table scrolls horizontally
- **Mobile (popup-width, ~360px):** Single column, pricing cards stack vertically, annual plan on top

---

### 4. Payment Flow Optimization

#### Flow Steps (Minimum Friction Path)

```
Step 1: Click "Upgrade" or "Start Free Trial"
        ↓
        Source: popup button, paywall CTA, upgrade page, or settings link
        Action: Opens upgrade page in new tab (if not already there)

Step 2: Select Plan (Annual pre-selected)
        ↓
        Page: Upgrade page with 3 pricing cards
        Default: Annual plan highlighted and pre-selected
        Action: Click "Start 7-Day Free Trial" or "Continue"

Step 3: Stripe Checkout
        ↓
        Page: Stripe-hosted checkout page (opens in same tab)
        Pre-fills: Email address (from Chrome profile or extension account)
        Shows: Selected plan, price, trial details
        Action: Enter payment info, click "Start Trial" / "Subscribe"

Step 4: Success + Immediate Unlock
        ↓
        Page: Redirect to success page within extension
        Action: Extension receives payment confirmation via webhook
        Result: All Pro features immediately unlocked

Total clicks from trigger to payment: 3-4
Total time estimate: 60-90 seconds
```

#### Flow Optimization Details

**Reducing Drop-Off at Each Step:**

| Step | Potential Drop-Off | Mitigation |
|------|-------------------|------------|
| Step 1 → Step 2 | User gets distracted or loses interest | Upgrade page loads in <1 second; headline immediately reinforces the trigger that brought them |
| Step 2 → Step 3 | Price shock or indecision | Annual pre-selected (lowest per-month), trial emphasized, guarantee visible |
| Step 3 → Step 4 | Checkout friction | Stripe prefills email; Apple Pay / Google Pay for one-tap checkout; minimal form fields |
| Step 4 completion | Payment fails | Stripe retry logic; clear error messages; alternative payment methods offered |

**Recovery Flows:**

- **Abandoned checkout:** If user reaches Step 2 but doesn't complete, show a one-time "Still thinking?" nudge next session with 10% off first month
- **Failed payment:** Clear error message + "Try another card" + link to support
- **Trial about to expire:** Email at Day 5, in-app notification at Day 6, final reminder at Day 7 morning

#### Payment Methods Supported

- Credit/Debit card (via Stripe)
- Apple Pay (on supported devices)
- Google Pay
- Link by Stripe (saved payment info)

---

### 5. Post-Purchase Experience

The post-purchase experience is critical for retention, reducing refund requests, and generating referrals. The first 14 days after upgrade determine long-term retention.

#### Immediate Reactions (First 60 Seconds)

| Timing | Action | Details |
|--------|--------|---------|
| 0s | Feature unlock | All limits removed server-side; extension receives confirmation |
| 0s | Icon change | Extension icon adds a small gold/purple "PRO" indicator in corner |
| 1s | Lock → Checkmark animation | All lock icons across the popup animate to checkmark icons (subtle spring animation, 300ms) |
| 2s | Welcome toast | "Welcome to Pro! All features unlocked." — Appears in popup for 5 seconds |
| 3s | Success page | New tab shows success confirmation with quick-start actions |

#### Success Page Content

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  ✓ Welcome to Focus Mode Pro!                           │
│                                                          │
│  Your plan: Annual ($2.99/mo)                           │
│  Trial ends: February 17, 2026                          │
│  (We'll remind you 2 days before)                       │
│                                                          │
│  Quick Start:                                            │
│  → Add more sites to your blocklist (unlimited!)        │
│  → Try extended Nuclear Mode (up to 24 hours)           │
│  → Explore focus sounds (18+ ambient mixes)             │
│  → Set up your schedules                                │
│                                                          │
│  [Open Focus Mode →]                                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### 7-Day Feature Discovery Sequence

Each day, a single non-intrusive discovery prompt appears in the popup to help the user explore Pro features they may not have tried yet. These only appear for features the user has NOT yet used.

| Day | Feature Prompt | Location | Copy | Dismiss |
|-----|---------------|----------|------|---------|
| Day 1 | Unlimited sites | Popup, blocklist section | "You can now block unlimited sites. Add all your distractions — no holding back." | "Got it" — hides prompt, shows blocklist |
| Day 2 | Custom timer | Popup, timer section | "Try a custom timer. Set 45 minutes, 90 minutes, or anything up to 4 hours." | "Got it" — hides prompt, opens timer settings |
| Day 3 | Extended Nuclear | Popup, Nuclear section | "Nuclear Mode now goes up to 24 hours. Try a 2-hour deep focus session." | "Got it" — hides prompt, opens Nuclear setup |
| Day 4 | Full weekly report | Popup, notification | "Your weekly report is now fully unblurred. Check it out — see where every minute went." | "View Report" — opens report; "Later" — hides |
| Day 5 | Sound library | Popup, sounds section | "Explore 18+ focus sounds. Try mixing Ocean Waves with Lo-Fi Beats." | "Listen" — opens sound panel; "Later" — hides |
| Day 6 | Cross-device sync | Popup, settings nudge | "Set up sync to keep your blocklist consistent across all your devices." | "Set Up" — opens sync settings; "Later" — hides |
| Day 7 | AI recommendations | Popup, insights section | "Your first AI focus recommendations are ready. See personalized tips based on your patterns." | "View" — opens recommendations; "Later" — hides |

#### Retention Milestones

| Timing | Action | Goal |
|--------|--------|------|
| Day 7 | "One week of Pro!" celebration | Reinforce value; show stats improvement since upgrade |
| Day 14 | Referral prompt | "Love Pro? Give a friend 7 days of Pro free. You get 1 month free for every 3 referrals." |
| Day 21 | NPS survey | "How likely are you to recommend Focus Mode? (1-10)" — route detractors to support, promoters to review |
| Day 30 | Monthly recap email | "Your first month of Pro: you blocked X distractions, focused Y hours, and saved Z hours vs. your pre-Pro average." |
| Day 60 | Feature depth check | If user hasn't tried 3+ Pro features, send targeted "Did you know?" prompts for unused features |
| Day 90 | Loyalty reward | "You've been Pro for 3 months! Here's a shareable badge for your focus streak." |

#### Welcome Email Sequence

| Email | Timing | Subject Line | Content |
|-------|--------|-------------|---------|
| Welcome | Immediately | "Welcome to Focus Mode Pro — here's your quick-start guide" | Account confirmation, 3 quick-start actions, support contact |
| Day 3 | 72 hours | "Have you tried Nuclear Mode yet?" | Feature highlight based on unused Pro features |
| Day 5 | 120 hours | "Your trial ends in 2 days" | Usage stats, what they'll lose if they don't continue, FAQ |
| Day 7 | Trial end | "Your Pro trial has ended" OR "Thanks for subscribing!" | Confirmation of charge or reversion to free |

---

### 6. Objection Handling Matrix

Every objection a potential upgrader might have, mapped to a specific response strategy and the optimal location to address it.

| # | Objection | Response Strategy | Copy | Where to Show |
|---|-----------|------------------|------|--------------|
| 1 | **"Too expensive"** | ROI calculation + daily cost reframe | "Pro costs $0.10/day with annual billing. If it saves you 30 minutes per week, that's $780/year in productivity at $30/hr." | Upgrade page FAQ, paywall dismiss state |
| 2 | **"I don't use it enough"** | Show their own usage data | "You've opened Focus Mode 34 times this month and blocked 156 distractions. You use it more than you think." | Paywall modals (personalized) |
| 3 | **"Free is good enough"** | Preview what they are missing via blur tactic | "You focused for 18 hours this week. The detailed breakdown of where those hours went — that's what Pro shows you." | Weekly report, Focus Score detail |
| 4 | **"I'll think about it"** | Remove risk with free trial | "No commitment needed. Try 7 days of Pro free. Cancel anytime — no questions asked." | CTA button text, paywall dismiss follow-up |
| 5 | **"Not sure it works"** | Social proof + money-back guarantee | "4.8 stars from 500+ reviews. Plus a 7-day money-back guarantee — zero risk." | Upgrade page, below pricing cards |
| 6 | **"I can use StayFocusd for free"** | Feature comparison showing gaps | "StayFocusd hasn't been updated in over a year. No Nuclear Mode, no Focus Score, no reports, no sounds, no streaks. Focus Mode Free already does more — Pro is in a different league." | Comparison section on upgrade page |
| 7 | **"BlockSite does the same thing"** | Price + feature advantage | "BlockSite charges $10.99/mo — 55% more than Focus Mode Pro. And they don't have Nuclear Mode, Focus Score, or AI recommendations." | Competitor comparison table |
| 8 | **"I'll just uninstall when I need to focus"** | Convenience + habit argument | "Uninstalling and reinstalling loses your data, your streak, and your momentum. Focus Mode runs silently in the background — turn it on once and forget it." | Onboarding tooltip, settings page |
| 9 | **"Browser extensions can see my data"** | Privacy and trust assurance | "Focus Mode runs 100% locally. Your browsing data never leaves your device. We don't track URLs — only domain names for blocking. Open source privacy policy." | Upgrade page footer, privacy settings |
| 10 | **"I'll wait for a sale"** | Annual plan framing + founding member | "Annual billing is already 40% off monthly pricing. Or grab a Founding Member spot at $2.99/mo before they're gone." | Upgrade page, paywall pricing section |
| 11 | **"What if it breaks my workflow?"** | Allowlist + schedule flexibility | "Allowlist specific pages on blocked domains. Schedule blocking for work hours only. You control exactly when and what gets blocked." | Feature explanation on upgrade page |
| 12 | **"I need to ask my manager"** | Team plan positioning + expense justification | "We offer Team plans with admin controls and centralized billing. Here's a one-page ROI summary you can share with your manager." | Team plan CTA on upgrade page, downloadable PDF |

#### Objection Response Timing

- **Pre-paywall (before user sees price):** Focus on value establishment, social proof, and usage stats
- **At paywall (first encounter):** Lead with free trial, highlight the specific pain point that triggered the paywall
- **Post-dismiss (after declining):** Reduce frequency, shift to ROI framing and competitive comparison
- **Re-engagement (returning after extended period):** Lead with their accumulated data and what they are missing

---

### 7. Conversion Metrics & Testing Framework

#### Key Metrics to Track Per Trigger

| Metric | Definition | Target |
|--------|-----------|--------|
| **Impression rate** | % of eligible users who see the paywall | 80%+ (ensure triggers fire correctly) |
| **Click-through rate** | % of impressions that click "Learn More" or "Start Trial" | 15-25% |
| **Conversion rate** | % of impressions that complete payment | See per-trigger targets above |
| **Dismiss rate** | % of impressions that actively dismiss | <70% (if higher, copy or timing needs work) |
| **Repeat dismiss rate** | % of users who dismiss same paywall 3+ times | <30% (if higher, reduce frequency) |
| **Time to convert** | Days from first impression to payment | Target: <14 days for T1/T3, <30 days for others |
| **Revenue per impression** | Total revenue / total impressions | Track to optimize trigger priority |

#### A/B Testing Priority

| Priority | Test | Hypothesis | Metric |
|----------|------|-----------|--------|
| P0 | T1 headline copy (3 variants) | Curiosity gap > feature description > data framing | Conversion rate |
| P0 | Annual vs Monthly default selection | Pre-selected annual increases annual uptake by 30%+ | Plan mix (annual %) |
| P1 | Free trial length (7 vs 14 days) | 7 days creates more urgency; 14 days builds more habit | Trial-to-paid rate |
| P1 | T2 modal vs inline | Modal has higher impression rate but inline has lower annoyance | Net conversion + NPS |
| P2 | Pricing page layout (2 vs 3 columns) | 3 columns with lifetime creates better anchoring | Revenue per visitor |
| P2 | Social proof type (reviews vs user count vs testimonials) | Testimonials from matching persona convert highest | Conversion by segment |
| P3 | CTA button color (green vs blue vs purple) | Green has highest contrast on current theme | Click-through rate |
| P3 | Guarantee placement (above vs below CTA) | Above CTA reduces friction at decision point | Conversion rate |

---

### 8. Anti-Pattern Checklist

Things we explicitly DO NOT do, with rationale:

| Anti-Pattern | Why We Avoid It | What We Do Instead |
|-------------|----------------|-------------------|
| Nagware (constant upgrade popups) | Destroys trust, increases uninstalls | Maximum 1 paywall per session, progressive frequency reduction |
| Feature degradation over time | Violates user trust, potential policy violation | Free features are permanent; we only gate additional capabilities |
| Fake urgency timers | Manipulative, CWS policy risk, damages brand | Real deadlines only (streak reset, trial expiry, limited inventory) |
| Guilt-based copy ("You're wasting time") | Shaming reduces conversion and increases negative reviews | Empowerment framing ("See where your time went") |
| Hidden fees or unclear billing | Refund requests, chargebacks, negative reviews | Crystal clear pricing, trial reminders, instant cancellation |
| Paywalls during focus sessions | Breaks the core promise of the product | Paywalls only in natural pause states (browsing, settings, stats) |
| Dark pattern dismiss buttons | CWS policy violation, EU consumer law risk | Clear, equal-weight dismiss options with honest labels |
| Bait-and-switch free features | Legal liability, trust destruction | Feature limits are clear from Day 1, documented in CWS listing |
| Aggressive re-targeting after dismiss | Annoyance, uninstalls, negative reviews | Exponential backoff on dismissed paywalls |
| Email spam | CAN-SPAM violations, unsubscribes, spam reports | Maximum 4 emails in first month, all with one-click unsubscribe |

---

### 9. Implementation Priority

Ordered by expected revenue impact and development effort:

| Priority | Component | Expected Impact | Dev Effort | Dependencies |
|----------|-----------|----------------|------------|-------------|
| **P0** | T1: Blurred weekly report | Highest conversion trigger (8-12%) | Medium | Weekly report feature, blur CSS, stats tracking |
| **P0** | Upgrade page (full) | Required for all conversion flows | Medium-High | Stripe integration, plan management |
| **P0** | Payment flow (Stripe) | Revenue infrastructure | High | Stripe account, webhook handling, license management |
| **P1** | T2: 11th site limit | Second-highest volume trigger | Low | Blocklist count check, modal UI |
| **P1** | T3: Nuclear extension | High conversion during peak need | Low | Nuclear timer check, duration settings UI |
| **P1** | T6: Streak recovery | High emotional conversion | Medium | Streak system, recovery logic, 24hr window |
| **P2** | Progressive nudges (8) | Cumulative awareness building | Low-Medium | Milestone tracking, nudge display system |
| **P2** | T4: Focus Score breakdown | Moderate conversion, high engagement | Medium | Score calculation, factor breakdown UI |
| **P2** | T5: Custom block page | Lower conversion but high retention | Medium | Block page template system |
| **P3** | T7: Scheduling | Moderate conversion | Medium | Schedule management system |
| **P3** | T8: Sound library | Moderate conversion, high delight | High | Audio system, 18+ sound files, mixer UI |
| **P3** | T9: Cross-device sync | Moderate conversion, complex | High | Account system, sync infrastructure |
| **P3** | T10: AI recommendations | Lower conversion, premium positioning | High | ML model or rules engine, pattern analysis |
| **P3** | Post-purchase sequence | Retention focused, not conversion | Low-Medium | Email system, in-app prompt scheduling |

---

*Document version: 1.0*
*Last updated: February 2026*
*Covers: Conversion psychology, pricing strategy, all 10 paywall triggers, progressive nudges, upgrade page, payment flow, post-purchase experience, objection handling, and testing framework*
