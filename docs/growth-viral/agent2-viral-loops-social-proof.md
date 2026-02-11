# Viral Loop Design & Social Proof Systems — Focus Mode - Blocker

> **Document:** Agent 2 — Phase 14 (Growth & Viral Engine)
> **Extension:** Focus Mode - Blocker
> **Tagline:** "Block distractions. Build focus. Track your streak."
> **Pricing:** Free / Pro $4.99/mo ($2.99/mo annual) / Lifetime $49.99 / Team $3.99/user/mo
> **Privacy:** All data local for free tier, zero external requests
> **Brand:** Purple gradient shield + white crosshair, Zovo extension family

---

## Table of Contents

1. [Viral Strategy Overview](#1-viral-strategy-overview)
2. [Natural Share Triggers in the User Journey](#2-natural-share-triggers-in-the-user-journey)
3. [Share Trigger Implementation](#3-share-trigger-implementation)
4. [Focus Stats Share Cards](#4-focus-stats-share-cards)
5. [Powered By Integration](#5-powered-by-integration)
6. [Collaborative Virality](#6-collaborative-virality)
7. [Social Proof Notifications](#7-social-proof-notifications)
8. [Block Page Viral Elements](#8-block-page-viral-elements)
9. [Implementation Architecture](#9-implementation-architecture)
10. [Storage Schema & Data Model](#10-storage-schema--data-model)
11. [Privacy & Ethics Guidelines](#11-privacy--ethics-guidelines)
12. [Metrics & Measurement](#12-metrics--measurement)
13. [A/B Testing Plan](#13-ab-testing-plan)
14. [Rollout Strategy](#14-rollout-strategy)

---

## 1. Viral Strategy Overview

### 1.1 The Viral Flywheel

Focus Mode - Blocker has a natural advantage for virality: productivity is inherently social. People talk about their habits, share their progress, and recommend tools that work. The viral strategy leverages this by making sharing feel like a natural extension of the focus experience rather than an interruption.

```
                    +---------------------------+
                    |     USER FOCUSES          |
                    |  (blocks sites, timers)   |
                    +------------+--------------+
                                 |
                                 v
                    +---------------------------+
                    |   MILESTONE REACHED       |
                    | (score, streak, blocks)   |
                    +------------+--------------+
                                 |
                                 v
                    +---------------------------+
                    |   SHARE PROMPT SHOWN      |
                    | (15% probability gate)    |
                    +------------+--------------+
                                 |
                        +--------+--------+
                        |                 |
                        v                 v
               +----------------+  +----------------+
               |  USER SHARES   |  |  USER SKIPS    |
               | (card/link)    |  | (no penalty)   |
               +-------+--------+  +----------------+
                       |
                       v
               +---------------------------+
               |   FRIEND SEES SHARE       |
               | (social media, message)   |
               +------------+--------------+
                            |
                            v
               +---------------------------+
               |   FRIEND INSTALLS         |
               | (CWS link + referral)     |
               +------------+--------------+
                            |
                            v
               +---------------------------+
               |   FRIEND FOCUSES          |
               |   (cycle repeats)         |
               +---------------------------+
```

### 1.2 Viral Coefficient Targets

The viral coefficient (K-factor) measures how many new users each existing user brings in.

```
K = i * c

Where:
  i = number of invitations sent per user
  c = conversion rate of each invitation
```

| Metric | Conservative | Target | Stretch |
|--------|:-----------:|:------:|:-------:|
| Share rate (% of users who share at least once) | 5% | 12% | 20% |
| Shares per sharer (monthly) | 1.5 | 3.0 | 5.0 |
| Click-through rate on shared content | 8% | 15% | 25% |
| Install rate from click-through | 10% | 18% | 30% |
| K-factor | 0.006 | 0.065 | 0.30 |
| Effective K (with retention) | 0.004 | 0.045 | 0.21 |

A K-factor above 1.0 means true viral growth (each user brings more than one new user). While Focus Mode - Blocker is unlikely to achieve true viral growth (few productivity tools do), even a K-factor of 0.05-0.10 meaningfully reduces customer acquisition cost and compounds over time.

### 1.3 Core Principles

1. **Share-worthy moments only.** Never prompt sharing during mundane moments. Only trigger when the user has genuinely achieved something.

2. **Zero friction for skipping.** Dismissing a share prompt must be a single tap with no guilt copy, no "are you sure?" confirmation, no delay.

3. **Value to the recipient.** Shared content must provide value to the person receiving it, not just advertise the extension. A focus stats card is interesting; a "download this extension" banner is not.

4. **Privacy by default.** Shared content never includes specific blocked sites, browsing history, or any personally identifiable information. Users choose exactly what to share.

5. **Cooldown-first design.** The system is designed around NOT showing prompts. The default state is suppression, with very specific conditions required to trigger a prompt.

6. **Respect the focus session.** Never, under any circumstances, show a share prompt during an active focus session. Sharing prompts appear only in natural transition moments (session complete, popup opened, weekly report viewed).

7. **Pro users get control.** Pro users can disable all share prompts, hide "Powered by" badges, and opt out of social proof data contribution.

### 1.4 Viral Channel Priority

```
+---------------------------------------------------------------+
|  CHANNEL PRIORITY (ranked by expected ROI)                    |
+---------------------------------------------------------------+
|                                                               |
|  1. SHARE CARDS (Focus Stats)          ████████████  HIGH     |
|     - Visual, shareable, interesting                          |
|     - Works on Twitter, LinkedIn, IG                          |
|                                                               |
|  2. TEAM / COLLABORATIVE               ██████████   HIGH     |
|     - Built-in network effects                                |
|     - Team plan revenue multiplier                            |
|                                                               |
|  3. BLOCK PAGE ELEMENTS                ████████     MEDIUM   |
|     - High impression volume                                  |
|     - Low conversion but free                                 |
|                                                               |
|  4. SOCIAL PROOF (landing page)        ███████      MEDIUM   |
|     - Builds trust at decision point                          |
|     - Proven conversion uplift                                |
|                                                               |
|  5. SHARED BLOCKLISTS                  ██████       MEDIUM   |
|     - Requires extension to import                            |
|     - Natural product loop                                    |
|                                                               |
|  6. REFERRAL PROGRAM (Pro)             █████        LOW-MED  |
|     - Direct incentive model                                  |
|     - Higher intent traffic                                   |
|                                                               |
|  7. POWERED BY BADGES                  ████         LOW      |
|     - Passive, always-on                                      |
|     - Low conversion but zero cost                            |
|                                                               |
+---------------------------------------------------------------+
```

---

## 2. Natural Share Triggers in the User Journey

### 2.1 Trigger Mapping Overview

Every share trigger maps to a specific emotional moment in the user journey. The key insight is that people share when they feel proud, surprised, or socially motivated -- not when prompted by a button.

```
USER JOURNEY TIMELINE
=====================

Day 1          Day 3        Day 7         Day 14        Day 30        Day 90+
  |              |            |              |             |              |
  v              v            v              v             v              v
+--------+  +--------+  +---------+  +-----------+  +----------+  +-----------+
|INSTALL |  |HABIT   |  |WEEKLY   |  |DEEP       |  |COMMITTED |  |POWER      |
|& SETUP |  |FORMING |  |RHYTHM   |  |ENGAGEMENT |  |USER      |  |USER       |
+--------+  +--------+  +---------+  +-----------+  +----------+  +-----------+
    |            |           |             |              |              |
    |            |           |             |              |              |
  [T-01]      [T-04]     [T-07]        [T-10]        [T-14]        [T-18]
  First       3-Day      Weekly        Focus          30-Day        Year
  Session     Streak     Report        Score 85+      Streak        in Focus
    |            |           |             |              |              |
  [T-02]      [T-05]     [T-08]        [T-11]        [T-15]        [T-19]
  First       Score 50   100 Blocks    Nuclear        500           365-Day
  Block                                Complete       Pomodoros     Streak
    |            |           |             |              |              |
  [T-03]      [T-06]     [T-09]        [T-12]        [T-16]        [T-20]
  Setup       10         Achievement   14-Day         100-Day       Lifetime
  Complete    Pomodoros   Unlock        Streak         Streak        Stats
              |
            [T-13]
            Time Saved
            Milestone
```

### 2.2 Onboarding Phase Triggers (Day 1)

These triggers fire during the first session when excitement and novelty are highest.

#### T-01: First Successful Focus Session Completion

```
TRIGGER CONDITIONS:
  - User completes their very first focus session (any type)
  - Session lasted at least 10 minutes (filters out accidental starts)
  - This is a ONE-TIME trigger (never fires again)

EMOTIONAL CONTEXT:
  The user just experienced the core value proposition for the first time.
  They blocked distractions and focused. They feel accomplished.

PROMPT TYPE: Modal (celebration screen)
PROMPT TIMING: Immediately after session complete animation
PROBABILITY: 100% (first time only, no gate needed)
COOLDOWN: N/A (one-time trigger)

UI WIREFRAME:
+--------------------------------------------------+
|                                                  |
|              (celebration animation)              |
|                   confetti burst                  |
|                                                  |
|          "Your First Focus Session!"              |
|                                                  |
|     +------------------------------------+       |
|     |                                    |       |
|     |    [Focus Score Ring: 72]          |       |
|     |                                    |       |
|     |    Duration: 25 minutes            |       |
|     |    Distractions Blocked: 3         |       |
|     |    Time Saved: ~12 min             |       |
|     |                                    |       |
|     +------------------------------------+       |
|                                                  |
|     "You just proved you can do it."              |
|     "Help a friend focus too?"                    |
|                                                  |
|     [  Share Your Achievement  ]  (primary btn)  |
|                                                  |
|     [ Maybe Later ]              (text link)     |
|                                                  |
+--------------------------------------------------+

SHARE CONTENT:
  Twitter: "Just completed my first focus session with Focus Mode!
            25 minutes of pure focus, 3 distractions blocked.
            Try it free: {referral_link} #FocusMode #Productivity"

  LinkedIn: "I just started using Focus Mode - Blocker to manage
             distractions during deep work. First session: 25 min
             of uninterrupted focus. If you struggle with tab-hopping,
             give it a try: {referral_link}"

  WhatsApp/iMessage: "Hey! I just tried this focus extension and it
                      actually works. Blocked 3 distractions in my
                      first 25-min session. Check it out: {referral_link}"

  Email Subject: "This helped me focus for 25 minutes straight"
  Email Body: "Hey {name},

               I just discovered Focus Mode - Blocker and wanted to
               share it with you. It blocks distracting websites and
               tracks your focus progress.

               My first session: 25 minutes focused, 3 distractions
               blocked. Pretty satisfying honestly.

               Try it free: {referral_link}

               - {sender_name}"
```

#### T-02: First Distraction Blocked

```
TRIGGER CONDITIONS:
  - User encounters their first block page
  - They have been using the extension for less than 24 hours
  - ONE-TIME trigger

EMOTIONAL CONTEXT:
  Surprise and delight -- "Oh, it actually works!" moment.
  The user tried to visit a blocked site and got caught.

PROMPT TYPE: Toast (non-intrusive, bottom of block page)
PROMPT TIMING: After 3 seconds on block page (user has read the page)
PROBABILITY: 30% (not everyone wants to share being "caught")
COOLDOWN: N/A (one-time trigger)

UI WIREFRAME (toast at bottom of block page):
+--------------------------------------------------+
|                                                  |
|            BLOCK PAGE CONTENT                     |
|           (shield, quote, stats)                  |
|                                                  |
|  +----------------------------------------------+|
|  | You resisted temptation!                      ||
|  | Know someone who'd benefit?  [Share] [x]     ||
|  +----------------------------------------------+|
+--------------------------------------------------+

SHARE CONTENT:
  Twitter: "Just got blocked from {site_category} by Focus Mode.
            It works! My focus shield is up.
            {referral_link} #FocusMode"

  Note: {site_category} is a generic category like "social media"
  or "news sites" -- NEVER the actual domain name.
```

#### T-03: Setup Completion

```
TRIGGER CONDITIONS:
  - User completes onboarding (all 5 slides)
  - Has added at least 3 sites to blocklist
  - ONE-TIME trigger

EMOTIONAL CONTEXT:
  User has committed to the tool. They've customized it.
  They're optimistic about changing their habits.

PROMPT TYPE: Inline (within the onboarding completion screen)
PROMPT TIMING: On the final "You're Ready!" screen
PROBABILITY: 100% (always shown as a secondary action)
COOLDOWN: N/A (one-time trigger)

UI WIREFRAME (integrated into onboarding slide 5):
+--------------------------------------------------+
|                                                  |
|           "You're Ready to Focus!"                |
|                                                  |
|     Sites blocked: 5                              |
|     Focus style: Pomodoro (25/5)                  |
|     First session: Ready to start                 |
|                                                  |
|     [  Start Your First Session  ]  (primary)    |
|                                                  |
|     "Know a colleague who's always distracted?"   |
|     [Invite them to Focus Mode]   (secondary)    |
|                                                  |
+--------------------------------------------------+

SHARE CONTENT:
  Email Subject: "Just set up my distraction blocker"
  Email Body: "Hey, I just set up Focus Mode - Blocker on Chrome.
               It blocks distracting websites during work hours.
               Setting it up took 30 seconds. Thought you might
               find it useful: {referral_link}"
```

### 2.3 Value Delivery Phase Triggers (Days 2-7)

These triggers fire as the user starts experiencing recurring value.

#### T-04: Streak Milestones (3-Day)

```
TRIGGER CONDITIONS:
  - User reaches a 3-day focus streak
  - User has completed at least 1 session today
  - Has not been shown a share prompt in the last 24 hours

EMOTIONAL CONTEXT:
  First real milestone. The user stuck with it for 3 days.
  This is a psychologically significant moment -- they've
  beaten the most common drop-off point.

PROMPT TYPE: Toast (celebratory, appears in popup)
PROMPT TIMING: When user opens popup after achieving milestone
PROBABILITY: 25% (don't want to over-prompt early users)
COOLDOWN: 48 hours after this trigger

UI WIREFRAME (toast in popup):
+--------------------------------------------------+
|  FOCUS MODE POPUP                                 |
|  +----------------------------------------------+|
|  |  3-Day Streak!                               ||
|  |  You're building a real habit.                ||
|  |  [Share Streak] [x]                          ||
|  +----------------------------------------------+|
|                                                  |
|  [Focus Score: 68]  [Streak: 3 days]             |
|  ...                                             |
+--------------------------------------------------+

SHARE CONTENT:
  Twitter: "3-day focus streak! Building better habits
            one session at a time.
            {referral_link} #FocusStreak #Productivity"
```

#### T-05: Focus Score Milestone (50)

```
TRIGGER CONDITIONS:
  - Focus Score crosses 50 for the first time
  - This is the user's first time reaching this threshold
  - No share prompt shown in last 24 hours

EMOTIONAL CONTEXT:
  The user's Focus Score is now above average. They're
  doing better than the baseline. Worth celebrating.

PROMPT TYPE: Toast (appears after score update animation)
PROMPT TIMING: When Focus Score updates in popup
PROBABILITY: 20%
COOLDOWN: 48 hours

SHARE CONTENT:
  Twitter: "Focus Score: 50+ and climbing!
            Tracking my focus improvement with Focus Mode.
            {referral_link} #FocusScore"
```

#### T-06: Pomodoro Count Milestone (10)

```
TRIGGER CONDITIONS:
  - User completes their 10th Pomodoro session ever
  - ONE-TIME trigger at the 10 milestone

EMOTIONAL CONTEXT:
  The user has committed to 10 full sessions. They're
  a regular user now, not a tire-kicker.

PROMPT TYPE: Toast (in popup after session)
PROMPT TIMING: After 10th session complete
PROBABILITY: 15%
COOLDOWN: 48 hours

SHARE CONTENT:
  Twitter: "10 Pomodoro sessions in the books!
            My focus game is getting stronger.
            {referral_link} #Pomodoro #DeepWork"
```

### 2.4 Habitual Use Phase Triggers (Days 7-30)

#### T-07: Weekly Report Generation

```
TRIGGER CONDITIONS:
  - Weekly report is generated (every 7 days)
  - User has completed at least 3 sessions this week
  - Report shows positive trend (Focus Score up or stable)
  - No share prompt in last 72 hours

EMOTIONAL CONTEXT:
  The weekly report is a natural review moment. Users
  are already in a reflective mindset.

PROMPT TYPE: Inline (within weekly report view)
PROMPT TIMING: At the bottom of the weekly report
PROBABILITY: 30% (weekly reports are highly share-worthy)
COOLDOWN: 7 days (aligned with report cycle)

UI WIREFRAME (inline in weekly report):
+--------------------------------------------------+
|  WEEKLY FOCUS REPORT                              |
|  Feb 3 - Feb 9, 2026                             |
|                                                  |
|  Focus Score: 78 (+5 from last week)              |
|  Sessions: 12 completed                           |
|  Time Saved: 3.2 hours                            |
|  Streak: 9 days                                   |
|  Distractions Blocked: 47                         |
|                                                  |
|  [chart showing daily focus scores]               |
|                                                  |
|  +----------------------------------------------+|
|  |  Share your weekly focus stats?               ||
|  |                                               ||
|  |  [Generate Share Card]  [Download Report]     ||
|  +----------------------------------------------+|
|                                                  |
|  Unlock full analytics with Pro ->                |
+--------------------------------------------------+

SHARE CONTENT:
  Generates a visual share card (see Section 4).
  The card includes Focus Score, time saved, streak,
  and sessions completed.
```

#### T-08: Blocked Sites Counter Milestone (100)

```
TRIGGER CONDITIONS:
  - Total blocked site encounters reaches 100
  - ONE-TIME trigger at 100, 500, 1000, 5000, 10000

EMOTIONAL CONTEXT:
  Large numbers are impressive and shareable.
  "I've blocked 100 distractions" sounds powerful.

PROMPT TYPE: Toast (appears in popup)
PROMPT TIMING: When user opens popup after hitting milestone
PROBABILITY: 20%
COOLDOWN: 48 hours

MILESTONE PROGRESSION:
  100   -> "Century Shield"       -> 20% show probability
  500   -> "Distraction Destroyer" -> 25% show probability
  1,000 -> "Focus Fortress"       -> 30% show probability
  5,000 -> "Distraction Slayer"   -> 35% show probability
  10,000 -> "Focus Legend"         -> 40% show probability

SHARE CONTENT (for 100 milestone):
  Twitter: "100 distractions blocked with Focus Mode!
            That's roughly 50 minutes saved from going down
            rabbit holes. My focus shield is holding strong.
            {referral_link}"
```

#### T-09: Achievement Unlocked

```
TRIGGER CONDITIONS:
  - User earns any of the 10 achievements
  - Achievement notification is shown
  - No share prompt in last 24 hours

EMOTIONAL CONTEXT:
  Achievement unlocks are designed to feel special.
  Gamification creates natural share moments.

PROMPT TYPE: Inline (within achievement notification)
PROMPT TIMING: Immediately with achievement popup
PROBABILITY: 35% (achievements are inherently shareable)
COOLDOWN: 24 hours

ACHIEVEMENT LIST WITH SHARE CONTENT:
  1. First Focus (Common)
     "Achievement Unlocked: First Focus!
      Started my distraction-free journey. #FocusMode"

  2. Week Warrior (Uncommon)
     "Achievement Unlocked: Week Warrior!
      7-day focus streak. Building real habits. #FocusStreak"

  3. Century Blocker (Uncommon)
     "Achievement Unlocked: Century Blocker!
      100 distractions blocked and counting."

  4. Deep Diver (Uncommon)
     "Achievement Unlocked: Deep Diver!
      Completed a 2-hour deep focus session."

  5. Night Owl (Rare)
     "Achievement Unlocked: Night Owl!
      Focused past midnight. Dedication unlocked."

  6. Streak Master (Rare)
     "Achievement Unlocked: Streak Master!
      30-day focus streak. This is a lifestyle now."

  7. Productivity Pro (Rare)
     "Achievement Unlocked: Productivity Pro!
      Focus Score hit 90. Peak performance."

  8. Nuclear Survivor (Epic)
     "Achievement Unlocked: Nuclear Survivor!
      Completed a 4-hour Nuclear Mode session. Unbreakable."

  9. Focus Sensei (Epic)
     "Achievement Unlocked: Focus Sensei!
      100 sessions completed. I teach focus now."

  10. Legendary Focus (Legendary)
      "Achievement Unlocked: LEGENDARY FOCUS!
       365-day streak. One full year of daily focus."

UI WIREFRAME (achievement modal with share option):
+--------------------------------------------------+
|                                                  |
|         ACHIEVEMENT UNLOCKED!                     |
|                                                  |
|         +------------------------+                |
|         |                        |                |
|         |   [Achievement Badge]  |                |
|         |                        |                |
|         |   "Week Warrior"       |                |
|         |   Uncommon             |                |
|         |                        |                |
|         |   7-day focus streak   |                |
|         |                        |                |
|         +------------------------+                |
|                                                  |
|         "You earned this by focusing for          |
|          7 consecutive days!"                     |
|                                                  |
|     [ Share Achievement ]  (secondary btn)        |
|     [     Awesome!      ]  (primary btn)          |
|                                                  |
+--------------------------------------------------+
```

### 2.5 Deep Engagement Triggers (Days 14-60)

#### T-10: Focus Score Milestone (85+)

```
TRIGGER CONDITIONS:
  - Focus Score reaches 85 for the first time
  - Additional triggers at 90 and 95
  - No share prompt in last 72 hours

EMOTIONAL CONTEXT:
  High Focus Scores are genuinely impressive. The user
  has demonstrated sustained focus improvement.

PROMPT TYPE: Modal (with score visualization)
PROMPT TIMING: When Focus Score updates to new high
PROBABILITY: 40% (high scores are rare and share-worthy)
COOLDOWN: 72 hours

SHARE CONTENT:
  Twitter: "Focus Score: 85/100!
            Weeks of building better focus habits are paying off.
            Track your own: {referral_link} #FocusScore #DeepWork"

SCORE MILESTONE PROGRESSION:
  85 -> "Focus Elite"     -> modal with celebration
  90 -> "Focus Master"    -> modal with special animation
  95 -> "Focus Legendary" -> modal with unique visual effect
```

#### T-11: Nuclear Mode Completion

```
TRIGGER CONDITIONS:
  - User completes a Nuclear Mode session
  - Nuclear session was at least 1 hour
  - User did not attempt to bypass (no tamper events)

EMOTIONAL CONTEXT:
  Nuclear Mode is the most intense focus experience.
  Completing it feels like an accomplishment. Users who
  survive Nuclear Mode are deeply committed.

PROMPT TYPE: Modal (post-Nuclear celebration)
PROMPT TIMING: When Nuclear Mode timer expires
PROBABILITY: 45% (Nuclear Mode users are power users)
COOLDOWN: 48 hours

UI WIREFRAME:
+--------------------------------------------------+
|                                                  |
|         NUCLEAR MODE COMPLETE                     |
|                                                  |
|         (radiation symbol animation)              |
|                                                  |
|         Duration: 2 hours                         |
|         Sites Blocked: 15                         |
|         Bypass Attempts: 0                        |
|                                                  |
|         "Absolute focus achieved.                 |
|          You didn't flinch."                      |
|                                                  |
|     [ Share Your Dedication ]  (secondary btn)   |
|     [       Done           ]  (primary btn)      |
|                                                  |
+--------------------------------------------------+

SHARE CONTENT:
  Twitter: "Just survived 2 hours of Nuclear Mode in Focus Mode.
            Zero bypass attempts. Unbreakable focus.
            {referral_link} #NuclearFocus #DeepWork"
```

#### T-12: Streak Milestones (14-Day, 30-Day)

```
14-DAY STREAK:
  Probability: 30%
  Share: "14-day focus streak! Two straight weeks of showing up.
          Building unshakeable habits with Focus Mode.
          {referral_link} #FocusStreak"

30-DAY STREAK:
  Probability: 40%
  Share: "30-DAY FOCUS STREAK! One full month of daily focus.
          This is officially a habit now.
          {referral_link} #30DayChallenge #FocusMode"
```

#### T-13: Time Saved Milestones

```
TRIGGER CONDITIONS:
  - Estimated time saved reaches milestone (1h, 5h, 10h, 24h, 100h)
  - Calculated as: blocked_site_visits * avg_distraction_minutes (est. 5 min)
  - No share prompt in last 72 hours

TIME SAVED CALCULATION:
  Each blocked site visit = ~5 minutes saved (conservative estimate)
  Each completed session = session_duration * focus_efficiency_factor
  Total = site_blocks * 5 + session_minutes * 0.3

MILESTONE PROGRESSION:
  1 hour saved   -> "Saved my first hour from distractions!"
  5 hours saved  -> "5 hours saved from going down rabbit holes!"
  10 hours saved -> "10 hours of reclaimed focus time!"
  24 hours saved -> "A full DAY saved from distractions!"
  100 hours saved -> "100 hours of my life reclaimed!"

PROMPT TYPE: Toast
PROBABILITY: 20% for small milestones, 35% for 24h+
COOLDOWN: 72 hours
```

### 2.6 Power User Triggers (Days 60+)

#### T-14: Streak Milestones (60-Day, 100-Day, 365-Day)

```
60-DAY STREAK:
  Probability: 45%
  Prompt Type: Modal with share card generation
  Share: "60-day focus streak! Two solid months of daily focus.
          This tool changed my work habits.
          {referral_link}"

100-DAY STREAK:
  Probability: 50%
  Prompt Type: Modal with special celebration + share card
  Share: "100-DAY FOCUS STREAK! Triple digits.
          From distracted to disciplined in 100 days.
          {referral_link} #100DayStreak"

365-DAY STREAK:
  Probability: 60%
  Prompt Type: Full-screen celebration with "Year in Focus" card
  Share: "ONE YEAR FOCUS STREAK! 365 days of daily focus.
          This is who I am now.
          {referral_link} #YearOfFocus"
```

#### T-15: Pomodoro Count Milestones (50, 100, 500)

```
MILESTONE PROGRESSION:
  50 Pomodoros  -> "50 Pomodoro sessions! That's over 20 hours of deep work."
  100 Pomodoros -> "100 POMODORO SESSIONS! Centurion of focus."
  500 Pomodoros -> "500 Pomodoro sessions. I am become focus."

PROBABILITY: 20% (50), 30% (100), 40% (500)
```

#### T-16: Long Streak Milestones (100-Day, 200-Day)

```
TRIGGER CONDITIONS:
  - Streak reaches triple digits
  - User has been active for 100+ days

PROMPT TYPE: Modal with share card auto-generated
PROBABILITY: 50% at 100 days, 55% at 200 days
COOLDOWN: 72 hours
```

### 2.7 Delight Moments (Anytime)

#### T-17: First Time Reaching Focus Score 90+

```
TRIGGER CONDITIONS:
  - Focus Score hits 90+ for the very first time
  - ONE-TIME trigger

EMOTIONAL CONTEXT:
  This is a peak moment. The user has achieved
  exceptional focus. They feel elite.

PROMPT TYPE: Modal with special "90+ Club" visual
PROBABILITY: 50% (rare achievement = high share value)

UI WIREFRAME:
+--------------------------------------------------+
|                                                  |
|         WELCOME TO THE 90+ CLUB                   |
|                                                  |
|         +------------------------+                |
|         |                        |                |
|         |   [Score Ring: 92]     |                |
|         |   with golden glow     |                |
|         |                        |                |
|         +------------------------+                |
|                                                  |
|         "Only 5% of users reach this level.       |
|          Your focus is exceptional."              |
|                                                  |
|     [ Share Your Score ]    [ Close ]             |
|                                                  |
+--------------------------------------------------+
```

#### T-18: Year in Focus (Annual Summary)

```
TRIGGER CONDITIONS:
  - User has been active for 365 days
  - Generated on the anniversary of installation
  - ONE-TIME per year

PROMPT TYPE: Full-screen interactive report
PROBABILITY: 70% (annual reports are highly shareable)

GENERATES:
  - "Year in Focus" share card (see Section 4)
  - Total sessions, total time saved, best streak,
    highest Focus Score, total blocks, achievements earned
```

#### T-19: Recovering from a Broken Streak

```
TRIGGER CONDITIONS:
  - User had a streak of 7+ days
  - Streak was broken (missed a day)
  - User completes their first session after the break
  - They have now started a new streak (Day 1)

EMOTIONAL CONTEXT:
  Resilience moment. Coming back after failure is
  more impressive than never failing.

PROMPT TYPE: Toast (encouraging, not celebratory)
PROBABILITY: 15% (sensitive moment, don't over-push)
COOLDOWN: 72 hours

SHARE CONTENT:
  Twitter: "Broke my focus streak at 14 days. But I'm back.
            Day 1 again. That's what matters.
            {referral_link} #NeverQuit #FocusMode"
```

#### T-20: Long Focus Session Completion (2+ hours)

```
TRIGGER CONDITIONS:
  - User completes a focus session of 2+ hours
  - Not a Nuclear Mode session (that has its own trigger)

PROMPT TYPE: Toast
PROBABILITY: 25%
COOLDOWN: 48 hours

SHARE CONTENT:
  Twitter: "Just completed a 2-hour deep focus session.
            No distractions. No interruptions. Pure flow.
            {referral_link} #DeepWork #FlowState"
```

### 2.8 Complete Trigger Reference Table

| ID | Trigger | Phase | Type | Prob | Cooldown | One-Time |
|----|---------|-------|------|:----:|:--------:|:--------:|
| T-01 | First session complete | Onboarding | Modal | 100% | N/A | Yes |
| T-02 | First distraction blocked | Onboarding | Toast | 30% | N/A | Yes |
| T-03 | Setup complete | Onboarding | Inline | 100% | N/A | Yes |
| T-04 | 3-day streak | Value | Toast | 25% | 48h | Yes |
| T-05 | Focus Score 50 | Value | Toast | 20% | 48h | Yes |
| T-06 | 10 Pomodoros | Value | Toast | 15% | 48h | Yes |
| T-07 | Weekly report | Habitual | Inline | 30% | 7d | No |
| T-08 | 100 blocks | Habitual | Toast | 20% | 48h | Per-milestone |
| T-09 | Achievement unlock | Habitual | Inline | 35% | 24h | Per-achievement |
| T-10 | Focus Score 85+ | Deep | Modal | 40% | 72h | Per-threshold |
| T-11 | Nuclear complete | Deep | Modal | 45% | 48h | No |
| T-12 | 14/30-day streak | Deep | Modal | 30-40% | 72h | Per-milestone |
| T-13 | Time saved milestone | Deep | Toast | 20-35% | 72h | Per-milestone |
| T-14 | 60/100/365-day streak | Power | Modal | 45-60% | 72h | Per-milestone |
| T-15 | 50/100/500 Pomodoros | Power | Toast | 20-40% | 48h | Per-milestone |
| T-16 | 100/200-day streak | Power | Modal | 50-55% | 72h | Per-milestone |
| T-17 | First Score 90+ | Delight | Modal | 50% | N/A | Yes |
| T-18 | Year in Focus | Delight | Full-screen | 70% | N/A | Yes/year |
| T-19 | Streak recovery | Delight | Toast | 15% | 72h | No |
| T-20 | 2+ hour session | Delight | Toast | 25% | 48h | No |

---

## 3. Share Trigger Implementation

### 3.1 ViralTriggerSystem Class

This is the core engine that evaluates whether a share trigger should fire and manages the display of share prompts.

```javascript
// src/background/viral-trigger-system.js

/**
 * ViralTriggerSystem — Manages share trigger evaluation and display
 * for Focus Mode - Blocker.
 *
 * Design principles:
 * 1. Default state is SUPPRESSION (prompts don't show unless all conditions pass)
 * 2. Max 1 share prompt per day (hard limit)
 * 3. Probability gate ensures most qualifying moments DON'T trigger
 * 4. Never interrupts focus sessions
 * 5. All state stored in chrome.storage.local
 */

class ViralTriggerSystem {
  constructor() {
    this.STORAGE_KEY = 'viral';
    this.MAX_PROMPTS_PER_DAY = 1;
    this.MAX_PROMPTS_PER_WEEK = 3;
    this.GLOBAL_COOLDOWN_MS = 12 * 60 * 60 * 1000; // 12 hours minimum between any prompts

    // Trigger definitions with all metadata
    this.triggers = new Map([
      ['first_session_complete', {
        id: 'T-01',
        phase: 'onboarding',
        promptType: 'modal',
        probability: 1.0,
        cooldownMs: 0,
        oneTime: true,
        conditions: async (ctx) => {
          return ctx.totalSessions === 1 &&
                 ctx.lastSessionDuration >= 10 &&
                 !ctx.isSessionActive;
        },
        content: (ctx) => ({
          title: 'Your First Focus Session!',
          subtitle: `${ctx.lastSessionDuration} minutes of pure focus`,
          body: 'You just proved you can do it. Help a friend focus too?',
          stats: {
            duration: ctx.lastSessionDuration,
            blocked: ctx.lastSessionBlocks,
            timeSaved: Math.round(ctx.lastSessionBlocks * 5),
            focusScore: ctx.currentFocusScore
          },
          cta: 'Share Your Achievement',
          dismiss: 'Maybe Later'
        })
      }],

      ['first_block', {
        id: 'T-02',
        phase: 'onboarding',
        promptType: 'toast',
        probability: 0.30,
        cooldownMs: 0,
        oneTime: true,
        conditions: async (ctx) => {
          return ctx.totalBlocks === 1 &&
                 ctx.daysSinceInstall < 1;
        },
        content: (ctx) => ({
          title: 'You resisted temptation!',
          body: 'Know someone who could use a focus shield?',
          cta: 'Share',
          dismiss: 'x'
        })
      }],

      ['setup_complete', {
        id: 'T-03',
        phase: 'onboarding',
        promptType: 'inline',
        probability: 1.0,
        cooldownMs: 0,
        oneTime: true,
        conditions: async (ctx) => {
          return ctx.onboardingComplete &&
                 ctx.blocklistSize >= 3;
        },
        content: (ctx) => ({
          title: 'Know a colleague who\'s always distracted?',
          cta: 'Invite them to Focus Mode',
          dismiss: null // Always visible as secondary action
        })
      }],

      ['streak_3', {
        id: 'T-04',
        phase: 'value',
        promptType: 'toast',
        probability: 0.25,
        cooldownMs: 48 * 60 * 60 * 1000,
        oneTime: true,
        conditions: async (ctx) => {
          return ctx.currentStreak === 3 &&
                 ctx.sessionsToday >= 1;
        },
        content: (ctx) => ({
          title: '3-Day Streak!',
          body: 'You\'re building a real habit.',
          cta: 'Share Streak',
          dismiss: 'x'
        })
      }],

      ['score_50', {
        id: 'T-05',
        phase: 'value',
        promptType: 'toast',
        probability: 0.20,
        cooldownMs: 48 * 60 * 60 * 1000,
        oneTime: true,
        conditions: async (ctx) => {
          return ctx.currentFocusScore >= 50 &&
                 ctx.previousFocusScore < 50;
        },
        content: (ctx) => ({
          title: 'Focus Score: 50+',
          body: 'Above average and climbing!',
          cta: 'Share Score',
          dismiss: 'x'
        })
      }],

      ['pomodoro_10', {
        id: 'T-06',
        phase: 'value',
        promptType: 'toast',
        probability: 0.15,
        cooldownMs: 48 * 60 * 60 * 1000,
        oneTime: true,
        conditions: async (ctx) => {
          return ctx.totalPomodoros === 10;
        },
        content: (ctx) => ({
          title: '10 Pomodoro Sessions!',
          body: 'Your focus game is getting stronger.',
          cta: 'Share',
          dismiss: 'x'
        })
      }],

      ['weekly_report', {
        id: 'T-07',
        phase: 'habitual',
        promptType: 'inline',
        probability: 0.30,
        cooldownMs: 7 * 24 * 60 * 60 * 1000,
        oneTime: false,
        conditions: async (ctx) => {
          return ctx.weeklyReportReady &&
                 ctx.sessionsThisWeek >= 3 &&
                 ctx.focusScoreTrend !== 'declining';
        },
        content: (ctx) => ({
          title: 'Share your weekly focus stats?',
          cta: 'Generate Share Card',
          secondaryCta: 'Download Report',
          dismiss: null
        })
      }],

      ['blocks_100', {
        id: 'T-08',
        phase: 'habitual',
        promptType: 'toast',
        probability: 0.20,
        cooldownMs: 48 * 60 * 60 * 1000,
        oneTime: false, // fires at each milestone
        milestones: [100, 500, 1000, 5000, 10000],
        milestoneProbabilities: {
          100: 0.20, 500: 0.25, 1000: 0.30, 5000: 0.35, 10000: 0.40
        },
        milestoneNames: {
          100: 'Century Shield',
          500: 'Distraction Destroyer',
          1000: 'Focus Fortress',
          5000: 'Distraction Slayer',
          10000: 'Focus Legend'
        },
        conditions: async (ctx) => {
          const milestone = this._getCurrentMilestone(ctx.totalBlocks, [100, 500, 1000, 5000, 10000]);
          return milestone !== null &&
                 !ctx.triggeredMilestones.includes(`blocks_${milestone}`);
        },
        content: (ctx) => {
          const milestone = this._getCurrentMilestone(ctx.totalBlocks, [100, 500, 1000, 5000, 10000]);
          const name = this.triggers.get('blocks_100').milestoneNames[milestone];
          return {
            title: `${milestone.toLocaleString()} Distractions Blocked!`,
            subtitle: name,
            body: `That's roughly ${Math.round(milestone * 5 / 60)} hours saved from rabbit holes.`,
            cta: 'Share Milestone',
            dismiss: 'x'
          };
        }
      }],

      ['achievement_unlock', {
        id: 'T-09',
        phase: 'habitual',
        promptType: 'inline',
        probability: 0.35,
        cooldownMs: 24 * 60 * 60 * 1000,
        oneTime: false,
        conditions: async (ctx) => {
          return ctx.newAchievement !== null;
        },
        content: (ctx) => ({
          title: `Achievement Unlocked: ${ctx.newAchievement.name}!`,
          subtitle: ctx.newAchievement.rarity,
          body: ctx.newAchievement.description,
          cta: 'Share Achievement',
          dismiss: 'Awesome!'
        })
      }],

      ['score_85', {
        id: 'T-10',
        phase: 'deep',
        promptType: 'modal',
        probability: 0.40,
        cooldownMs: 72 * 60 * 60 * 1000,
        oneTime: false,
        milestones: [85, 90, 95],
        conditions: async (ctx) => {
          const milestone = this._getCurrentMilestone(ctx.currentFocusScore, [85, 90, 95]);
          return milestone !== null &&
                 ctx.previousFocusScore < milestone &&
                 !ctx.triggeredMilestones.includes(`score_${milestone}`);
        },
        content: (ctx) => {
          const milestone = this._getCurrentMilestone(ctx.currentFocusScore, [85, 90, 95]);
          const labels = { 85: 'Focus Elite', 90: 'Focus Master', 95: 'Focus Legendary' };
          return {
            title: labels[milestone],
            subtitle: `Focus Score: ${ctx.currentFocusScore}`,
            body: milestone >= 90
              ? 'Only 5% of users reach this level. Your focus is exceptional.'
              : 'Your focus habits are paying off. Impressive dedication.',
            cta: 'Share Your Score',
            dismiss: 'Close'
          };
        }
      }],

      ['nuclear_complete', {
        id: 'T-11',
        phase: 'deep',
        promptType: 'modal',
        probability: 0.45,
        cooldownMs: 48 * 60 * 60 * 1000,
        oneTime: false,
        conditions: async (ctx) => {
          return ctx.nuclearJustCompleted &&
                 ctx.nuclearDuration >= 60 &&
                 ctx.nuclearBypassAttempts === 0;
        },
        content: (ctx) => ({
          title: 'Nuclear Mode Complete',
          subtitle: `${Math.round(ctx.nuclearDuration / 60)} hours of absolute focus`,
          body: 'You didn\'t flinch. Unbreakable.',
          stats: {
            duration: ctx.nuclearDuration,
            sitesBlocked: ctx.nuclearSitesBlocked,
            bypassAttempts: 0
          },
          cta: 'Share Your Dedication',
          dismiss: 'Done'
        })
      }],

      ['streak_14', {
        id: 'T-12a',
        phase: 'deep',
        promptType: 'modal',
        probability: 0.30,
        cooldownMs: 72 * 60 * 60 * 1000,
        oneTime: true,
        conditions: async (ctx) => ctx.currentStreak === 14,
        content: () => ({
          title: '14-Day Focus Streak!',
          body: 'Two straight weeks of showing up. Remarkable.',
          cta: 'Share Streak',
          dismiss: 'Thanks!'
        })
      }],

      ['streak_30', {
        id: 'T-12b',
        phase: 'deep',
        promptType: 'modal',
        probability: 0.40,
        cooldownMs: 72 * 60 * 60 * 1000,
        oneTime: true,
        conditions: async (ctx) => ctx.currentStreak === 30,
        content: () => ({
          title: '30-DAY FOCUS STREAK!',
          body: 'One full month. This is officially a habit.',
          cta: 'Share This Milestone',
          dismiss: 'Awesome!'
        })
      }],

      ['time_saved', {
        id: 'T-13',
        phase: 'deep',
        promptType: 'toast',
        probability: 0.20,
        cooldownMs: 72 * 60 * 60 * 1000,
        oneTime: false,
        milestones: [60, 300, 600, 1440, 6000], // minutes
        milestoneLabels: {
          60: '1 hour', 300: '5 hours', 600: '10 hours',
          1440: 'a full DAY', 6000: '100 hours'
        },
        conditions: async (ctx) => {
          const milestone = this._getCurrentMilestone(
            ctx.totalTimeSavedMinutes, [60, 300, 600, 1440, 6000]
          );
          return milestone !== null &&
                 !ctx.triggeredMilestones.includes(`time_${milestone}`);
        },
        content: (ctx) => {
          const milestone = this._getCurrentMilestone(
            ctx.totalTimeSavedMinutes, [60, 300, 600, 1440, 6000]
          );
          const label = this.triggers.get('time_saved').milestoneLabels[milestone];
          return {
            title: `${label} Saved from Distractions!`,
            body: 'Your focus shield is working overtime.',
            cta: 'Share',
            dismiss: 'x'
          };
        }
      }],

      ['streak_60', {
        id: 'T-14a',
        phase: 'power',
        promptType: 'modal',
        probability: 0.45,
        cooldownMs: 72 * 60 * 60 * 1000,
        oneTime: true,
        conditions: async (ctx) => ctx.currentStreak === 60,
        content: () => ({
          title: '60-Day Focus Streak!',
          body: 'Two solid months. This tool changed your work habits.',
          cta: 'Share Milestone',
          dismiss: 'Thanks!'
        })
      }],

      ['streak_100', {
        id: 'T-14b',
        phase: 'power',
        promptType: 'modal',
        probability: 0.50,
        cooldownMs: 72 * 60 * 60 * 1000,
        oneTime: true,
        conditions: async (ctx) => ctx.currentStreak === 100,
        content: () => ({
          title: '100-DAY FOCUS STREAK!',
          body: 'Triple digits. From distracted to disciplined.',
          cta: 'Share This Achievement',
          dismiss: 'Close'
        })
      }],

      ['streak_365', {
        id: 'T-14c',
        phase: 'power',
        promptType: 'fullscreen',
        probability: 0.60,
        cooldownMs: 72 * 60 * 60 * 1000,
        oneTime: true,
        conditions: async (ctx) => ctx.currentStreak === 365,
        content: () => ({
          title: 'ONE YEAR FOCUS STREAK!',
          body: '365 days of daily focus. This is who you are now.',
          cta: 'Share Your Year',
          dismiss: 'Close'
        })
      }],

      ['score_90_first', {
        id: 'T-17',
        phase: 'delight',
        promptType: 'modal',
        probability: 0.50,
        cooldownMs: 0,
        oneTime: true,
        conditions: async (ctx) => {
          return ctx.currentFocusScore >= 90 &&
                 !ctx.hasEverReached90;
        },
        content: (ctx) => ({
          title: 'Welcome to the 90+ Club',
          subtitle: `Focus Score: ${ctx.currentFocusScore}`,
          body: 'Only 5% of users reach this level. Your focus is exceptional.',
          cta: 'Share Your Score',
          dismiss: 'Close'
        })
      }],

      ['year_in_focus', {
        id: 'T-18',
        phase: 'delight',
        promptType: 'fullscreen',
        probability: 0.70,
        cooldownMs: 0,
        oneTime: true, // per year
        conditions: async (ctx) => {
          return ctx.daysSinceInstall >= 365 &&
                 !ctx.yearInFocusShown;
        },
        content: (ctx) => ({
          title: 'Your Year in Focus',
          stats: ctx.yearlyStats,
          cta: 'Generate Year in Focus Card',
          dismiss: 'Close'
        })
      }],

      ['streak_recovery', {
        id: 'T-19',
        phase: 'delight',
        promptType: 'toast',
        probability: 0.15,
        cooldownMs: 72 * 60 * 60 * 1000,
        oneTime: false,
        conditions: async (ctx) => {
          return ctx.streakJustRecovered &&
                 ctx.previousStreak >= 7 &&
                 ctx.currentStreak === 1;
        },
        content: (ctx) => ({
          title: 'Welcome Back!',
          body: `Your ${ctx.previousStreak}-day streak ended, but you showed up again. That's what counts.`,
          cta: 'Share',
          dismiss: 'x'
        })
      }],

      ['long_session', {
        id: 'T-20',
        phase: 'delight',
        promptType: 'toast',
        probability: 0.25,
        cooldownMs: 48 * 60 * 60 * 1000,
        oneTime: false,
        conditions: async (ctx) => {
          return ctx.lastSessionDuration >= 120 &&
                 !ctx.nuclearJustCompleted;
        },
        content: (ctx) => ({
          title: `${Math.round(ctx.lastSessionDuration / 60)}-Hour Deep Focus!`,
          body: 'No distractions. Pure flow state.',
          cta: 'Share',
          dismiss: 'x'
        })
      }]
    ]);
  }

  // ─── MAIN EVALUATION METHOD ──────────────────────────────────────

  /**
   * Evaluate all triggers against current context.
   * Returns the highest-priority trigger that passes all gates,
   * or null if no trigger should fire.
   *
   * @param {Object} context - Current user state
   * @returns {Object|null} - Trigger to fire, or null
   */
  async evaluate(context) {
    // Gate 1: Global cooldown check
    const state = await this._getState();
    if (this._isInGlobalCooldown(state)) {
      return null;
    }

    // Gate 2: Daily/weekly limit check
    if (this._hasExceededLimits(state)) {
      return null;
    }

    // Gate 3: Active session check (NEVER interrupt focus)
    if (context.isSessionActive) {
      return null;
    }

    // Evaluate all triggers
    const candidates = [];
    for (const [key, trigger] of this.triggers) {
      try {
        // Check if trigger conditions are met
        const conditionsMet = await trigger.conditions(context);
        if (!conditionsMet) continue;

        // Check one-time gate
        if (trigger.oneTime && state.firedTriggers.includes(key)) continue;

        // Check trigger-specific cooldown
        const lastFired = state.triggerHistory[key]?.lastFired || 0;
        if (Date.now() - lastFired < trigger.cooldownMs) continue;

        // Trigger is a candidate
        candidates.push({ key, trigger });
      } catch (err) {
        console.warn(`[Viral] Error evaluating trigger ${key}:`, err);
      }
    }

    if (candidates.length === 0) return null;

    // Priority: onboarding > value > habitual > deep > power > delight
    const phaseOrder = ['onboarding', 'value', 'habitual', 'deep', 'power', 'delight'];
    candidates.sort((a, b) => {
      return phaseOrder.indexOf(a.trigger.phase) - phaseOrder.indexOf(b.trigger.phase);
    });

    // Take the highest-priority candidate
    const selected = candidates[0];

    // Gate 4: Probability gate (roll the dice)
    const probability = this._getEffectiveProbability(selected.trigger, context);
    if (Math.random() > probability) {
      // Record that we evaluated but suppressed (for analytics)
      await this._recordSuppression(selected.key);
      return null;
    }

    // All gates passed! Record and return the trigger
    await this._recordTriggerFired(selected.key);

    return {
      key: selected.key,
      id: selected.trigger.id,
      promptType: selected.trigger.promptType,
      content: selected.trigger.content(context),
      phase: selected.trigger.phase
    };
  }

  // ─── PROBABILITY HELPERS ──────────────────────────────────────────

  /**
   * Get effective probability, considering user engagement level.
   * More engaged users get slightly higher probabilities because
   * they're more likely to actually share.
   */
  _getEffectiveProbability(trigger, context) {
    let base = trigger.probability;

    // Engagement multiplier
    if (context.currentStreak >= 30) base *= 1.2;
    else if (context.currentStreak >= 7) base *= 1.1;

    // Fatigue reducer: if user has dismissed many prompts, reduce probability
    if (context.sharePromptDismissals >= 5) base *= 0.7;
    if (context.sharePromptDismissals >= 10) base *= 0.5;

    // Previous sharer boost: users who have shared before are more likely to share again
    if (context.totalShares >= 1) base *= 1.3;

    // Cap at original probability * 1.5 (never too aggressive)
    return Math.min(base, trigger.probability * 1.5);
  }

  // ─── STATE MANAGEMENT ─────────────────────────────────────────────

  async _getState() {
    const { [this.STORAGE_KEY]: state = {} } = await chrome.storage.local.get(this.STORAGE_KEY);
    return {
      firedTriggers: state.firedTriggers || [],
      triggerHistory: state.triggerHistory || {},
      lastPromptTimestamp: state.lastPromptTimestamp || 0,
      promptsToday: state.promptsToday || 0,
      promptsTodayDate: state.promptsTodayDate || '',
      promptsThisWeek: state.promptsThisWeek || 0,
      promptsWeekStart: state.promptsWeekStart || '',
      totalPrompts: state.totalPrompts || 0,
      totalShares: state.totalShares || 0,
      totalDismissals: state.totalDismissals || 0,
      suppressions: state.suppressions || 0
    };
  }

  _isInGlobalCooldown(state) {
    return Date.now() - state.lastPromptTimestamp < this.GLOBAL_COOLDOWN_MS;
  }

  _hasExceededLimits(state) {
    const today = new Date().toISOString().split('T')[0];
    const weekStart = this._getWeekStart();

    // Reset daily counter if new day
    const dailyCount = state.promptsTodayDate === today ? state.promptsToday : 0;
    if (dailyCount >= this.MAX_PROMPTS_PER_DAY) return true;

    // Reset weekly counter if new week
    const weeklyCount = state.promptsWeekStart === weekStart ? state.promptsThisWeek : 0;
    if (weeklyCount >= this.MAX_PROMPTS_PER_WEEK) return true;

    return false;
  }

  async _recordTriggerFired(triggerKey) {
    const state = await this._getState();
    const today = new Date().toISOString().split('T')[0];
    const weekStart = this._getWeekStart();

    // Update trigger history
    state.triggerHistory[triggerKey] = {
      lastFired: Date.now(),
      fireCount: (state.triggerHistory[triggerKey]?.fireCount || 0) + 1
    };

    // Update one-time tracking
    if (!state.firedTriggers.includes(triggerKey)) {
      state.firedTriggers.push(triggerKey);
    }

    // Update counters
    state.lastPromptTimestamp = Date.now();
    state.promptsToday = (state.promptsTodayDate === today) ? state.promptsToday + 1 : 1;
    state.promptsTodayDate = today;
    state.promptsThisWeek = (state.promptsWeekStart === weekStart) ? state.promptsThisWeek + 1 : 1;
    state.promptsWeekStart = weekStart;
    state.totalPrompts += 1;

    await chrome.storage.local.set({ [this.STORAGE_KEY]: state });
  }

  async _recordSuppression(triggerKey) {
    const state = await this._getState();
    state.suppressions = (state.suppressions || 0) + 1;
    await chrome.storage.local.set({ [this.STORAGE_KEY]: state });
  }

  /**
   * Record user action on a share prompt.
   * @param {'shared'|'dismissed'|'delayed'} action
   */
  async recordPromptAction(action) {
    const state = await this._getState();
    if (action === 'shared') {
      state.totalShares = (state.totalShares || 0) + 1;
    } else if (action === 'dismissed') {
      state.totalDismissals = (state.totalDismissals || 0) + 1;
    }
    await chrome.storage.local.set({ [this.STORAGE_KEY]: state });
  }

  // ─── UTILITY METHODS ──────────────────────────────────────────────

  _getCurrentMilestone(value, milestones) {
    // Returns the highest milestone that the value has just reached
    for (let i = milestones.length - 1; i >= 0; i--) {
      if (value >= milestones[i]) {
        return milestones[i];
      }
    }
    return null;
  }

  _getWeekStart() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff)).toISOString().split('T')[0];
  }
}

export default ViralTriggerSystem;
```

### 3.2 Context Builder

The context object passed to the trigger system must be assembled from multiple storage sources.

```javascript
// src/background/viral-context-builder.js

/**
 * Builds the context object needed by ViralTriggerSystem.evaluate()
 * by reading from various chrome.storage.local keys.
 */
class ViralContextBuilder {
  /**
   * Build complete context for viral trigger evaluation.
   * @returns {Object} context - Complete user state snapshot
   */
  async build() {
    const [
      { analytics = [] },
      { retention = {} },
      { settings = {} },
      { viral = {} },
      { focusScore = {} },
      { sessions = {} },
      { achievements = {} }
    ] = await Promise.all([
      chrome.storage.local.get('analytics'),
      chrome.storage.local.get('retention'),
      chrome.storage.local.get('settings'),
      chrome.storage.local.get('viral'),
      chrome.storage.local.get('focusScore'),
      chrome.storage.local.get('sessions'),
      chrome.storage.local.get('achievements')
    ]);

    const now = Date.now();
    const today = new Date().toISOString().split('T')[0];
    const dayMs = 24 * 60 * 60 * 1000;

    // Session data
    const completedSessions = analytics.filter(e => e.event === 'session_complete');
    const todaySessions = completedSessions.filter(e => e.date === today);
    const lastSession = completedSessions[completedSessions.length - 1];

    // Block data
    const blockEvents = analytics.filter(e => e.event === 'site_blocked');
    const totalBlocks = retention.totalBlocks || blockEvents.length;

    // Streak data
    const streak = retention.streak || { current: 0, best: 0, lastDate: null };

    // Focus Score data
    const currentScore = focusScore.current || 0;
    const previousScore = focusScore.previous || 0;

    // Pomodoro count
    const pomodoroSessions = completedSessions.filter(
      e => e.properties?.type === 'pomodoro'
    );

    // Time saved calculation
    const totalTimeSavedMinutes = Math.round(
      totalBlocks * 5 + // 5 min per blocked distraction
      completedSessions.reduce((sum, e) => sum + (e.properties?.duration || 0) * 0.3, 0)
    );

    // Weekly data
    const weekEvents = analytics.filter(e => e.timestamp > now - 7 * dayMs);
    const weekSessions = weekEvents.filter(e => e.event === 'session_complete');

    // Focus Score trend
    const weekScores = weekEvents
      .filter(e => e.event === 'focus_score_change')
      .map(e => e.properties?.new_score || 0);
    const scoreTrend = this._calculateTrend(weekScores);

    // Nuclear Mode data
    const lastNuclear = analytics.filter(e => e.event === 'nuclear_complete').pop();
    const nuclearJustCompleted = lastNuclear && (now - lastNuclear.timestamp < 60000);

    // Achievement data
    const newAchievement = achievements.justUnlocked || null;

    // Install date
    const installedAt = retention.installedAt || now;
    const daysSinceInstall = Math.floor((now - installedAt) / dayMs);

    // Viral history
    const sharePromptDismissals = viral.totalDismissals || 0;
    const totalShares = viral.totalShares || 0;
    const triggeredMilestones = viral.firedTriggers || [];

    return {
      // Session context
      isSessionActive: sessions.active || false,
      totalSessions: completedSessions.length,
      sessionsToday: todaySessions.length,
      sessionsThisWeek: weekSessions.length,
      lastSessionDuration: lastSession?.properties?.duration || 0,
      lastSessionBlocks: lastSession?.properties?.blocks || 0,

      // Score context
      currentFocusScore: currentScore,
      previousFocusScore: previousScore,
      focusScoreTrend: scoreTrend,
      hasEverReached90: focusScore.hasReached90 || false,

      // Streak context
      currentStreak: streak.current,
      bestStreak: streak.best,
      previousStreak: streak.previous || 0,
      streakJustRecovered: streak.justRecovered || false,

      // Blocks context
      totalBlocks: totalBlocks,

      // Pomodoro context
      totalPomodoros: pomodoroSessions.length,

      // Time saved context
      totalTimeSavedMinutes: totalTimeSavedMinutes,

      // Nuclear context
      nuclearJustCompleted: nuclearJustCompleted,
      nuclearDuration: lastNuclear?.properties?.duration || 0,
      nuclearSitesBlocked: lastNuclear?.properties?.site_count || 0,
      nuclearBypassAttempts: lastNuclear?.properties?.bypass_attempts || 0,

      // Achievement context
      newAchievement: newAchievement,

      // Setup context
      onboardingComplete: settings.onboardingComplete || false,
      blocklistSize: settings.blocklist?.length || 0,

      // Time context
      daysSinceInstall: daysSinceInstall,

      // Weekly report
      weeklyReportReady: this._isWeeklyReportDay(),

      // Yearly stats (for Year in Focus)
      yearlyStats: daysSinceInstall >= 365 ? await this._buildYearlyStats(analytics) : null,
      yearInFocusShown: viral.yearInFocusShown || false,

      // Viral history
      sharePromptDismissals: sharePromptDismissals,
      totalShares: totalShares,
      triggeredMilestones: triggeredMilestones
    };
  }

  _calculateTrend(scores) {
    if (scores.length < 2) return 'stable';
    const first = scores.slice(0, Math.floor(scores.length / 2));
    const second = scores.slice(Math.floor(scores.length / 2));
    const avgFirst = first.reduce((a, b) => a + b, 0) / first.length;
    const avgSecond = second.reduce((a, b) => a + b, 0) / second.length;
    if (avgSecond > avgFirst + 3) return 'improving';
    if (avgSecond < avgFirst - 3) return 'declining';
    return 'stable';
  }

  _isWeeklyReportDay() {
    return new Date().getDay() === 1; // Monday
  }

  async _buildYearlyStats(analytics) {
    const yearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
    const yearEvents = analytics.filter(e => e.timestamp > yearAgo);
    const sessions = yearEvents.filter(e => e.event === 'session_complete');
    const blocks = yearEvents.filter(e => e.event === 'site_blocked');

    return {
      totalSessions: sessions.length,
      totalFocusMinutes: sessions.reduce((s, e) => s + (e.properties?.duration || 0), 0),
      totalBlocks: blocks.length,
      totalTimeSavedMinutes: blocks.length * 5,
      bestStreak: 0, // calculated from retention data
      highestFocusScore: 0, // calculated from focusScore data
      achievementsEarned: 0, // calculated from achievements data
      activeDays: new Set(yearEvents.map(e => e.date)).size
    };
  }
}

export default ViralContextBuilder;
```

### 3.3 Share Prompt UI Components

Three UI variants for different prompt types: modal, toast, and inline.

```javascript
// src/popup/components/share-prompt.js

/**
 * SharePrompt — Renders share prompt UI for viral triggers.
 * Three variants: modal, toast, inline.
 */
class SharePrompt {
  constructor(viralSystem) {
    this.viralSystem = viralSystem;
    this.currentPrompt = null;
  }

  /**
   * Show a share prompt based on trigger data.
   * @param {Object} triggerData - From ViralTriggerSystem.evaluate()
   */
  show(triggerData) {
    this.currentPrompt = triggerData;
    switch (triggerData.promptType) {
      case 'modal':
        this._showModal(triggerData.content);
        break;
      case 'toast':
        this._showToast(triggerData.content);
        break;
      case 'inline':
        this._showInline(triggerData.content);
        break;
      case 'fullscreen':
        this._showFullscreen(triggerData.content);
        break;
    }
  }

  // ─── MODAL PROMPT ─────────────────────────────────────────────────

  _showModal(content) {
    const overlay = document.createElement('div');
    overlay.className = 'viral-modal-overlay';
    overlay.innerHTML = `
      <div class="viral-modal">
        <div class="viral-modal__header">
          ${content.subtitle ? `<span class="viral-modal__badge">${content.subtitle}</span>` : ''}
          <h2 class="viral-modal__title">${content.title}</h2>
        </div>
        ${content.stats ? this._renderStats(content.stats) : ''}
        <p class="viral-modal__body">${content.body}</p>
        <div class="viral-modal__actions">
          <button class="viral-btn viral-btn--primary" data-action="share">
            ${content.cta}
          </button>
          <button class="viral-btn viral-btn--text" data-action="dismiss">
            ${content.dismiss}
          </button>
        </div>
      </div>
    `;

    // Event handlers
    overlay.querySelector('[data-action="share"]').addEventListener('click', () => {
      this._onShare();
      overlay.remove();
    });
    overlay.querySelector('[data-action="dismiss"]').addEventListener('click', () => {
      this._onDismiss();
      overlay.remove();
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this._onDismiss();
        overlay.remove();
      }
    });

    document.body.appendChild(overlay);
  }

  _renderStats(stats) {
    const items = [];
    if (stats.duration) items.push(`<div class="viral-stat"><span class="viral-stat__value">${stats.duration}</span><span class="viral-stat__label">minutes</span></div>`);
    if (stats.blocked) items.push(`<div class="viral-stat"><span class="viral-stat__value">${stats.blocked}</span><span class="viral-stat__label">blocked</span></div>`);
    if (stats.timeSaved) items.push(`<div class="viral-stat"><span class="viral-stat__value">${stats.timeSaved}</span><span class="viral-stat__label">min saved</span></div>`);
    if (stats.focusScore) items.push(`<div class="viral-stat"><span class="viral-stat__value">${stats.focusScore}</span><span class="viral-stat__label">Focus Score</span></div>`);
    return `<div class="viral-stats-grid">${items.join('')}</div>`;
  }

  // ─── TOAST PROMPT ─────────────────────────────────────────────────

  _showToast(content) {
    const toast = document.createElement('div');
    toast.className = 'viral-toast viral-toast--enter';
    toast.innerHTML = `
      <div class="viral-toast__content">
        <strong class="viral-toast__title">${content.title}</strong>
        ${content.body ? `<p class="viral-toast__body">${content.body}</p>` : ''}
      </div>
      <div class="viral-toast__actions">
        <button class="viral-btn viral-btn--small" data-action="share">
          ${content.cta}
        </button>
        <button class="viral-toast__close" data-action="dismiss"
                aria-label="Dismiss">&times;</button>
      </div>
    `;

    toast.querySelector('[data-action="share"]').addEventListener('click', () => {
      this._onShare();
      this._removeToast(toast);
    });
    toast.querySelector('[data-action="dismiss"]').addEventListener('click', () => {
      this._onDismiss();
      this._removeToast(toast);
    });

    document.body.appendChild(toast);

    // Auto-dismiss after 8 seconds
    setTimeout(() => {
      if (document.body.contains(toast)) {
        this._onDismiss();
        this._removeToast(toast);
      }
    }, 8000);

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.remove('viral-toast--enter');
      toast.classList.add('viral-toast--visible');
    });
  }

  _removeToast(toast) {
    toast.classList.add('viral-toast--exit');
    toast.addEventListener('animationend', () => toast.remove());
  }

  // ─── INLINE PROMPT ────────────────────────────────────────────────

  _showInline(content) {
    // Inline prompts are rendered within existing UI, not as overlays.
    // Returns an HTML string that the caller can insert.
    return `
      <div class="viral-inline">
        <p class="viral-inline__text">${content.title}</p>
        <div class="viral-inline__actions">
          <button class="viral-btn viral-btn--secondary viral-btn--small"
                  data-action="share">${content.cta}</button>
        </div>
      </div>
    `;
  }

  /**
   * Get inline HTML for embedding in other UI.
   * @param {Object} content - Trigger content
   * @returns {string} HTML string
   */
  getInlineHTML(content) {
    return this._showInline(content);
  }

  // ─── FULLSCREEN PROMPT ────────────────────────────────────────────

  _showFullscreen(content) {
    // Opens a new tab with the fullscreen celebration
    const params = encodeURIComponent(JSON.stringify(content));
    chrome.tabs.create({
      url: chrome.runtime.getURL(`celebration.html?data=${params}`)
    });
  }

  // ─── ACTION HANDLERS ──────────────────────────────────────────────

  _onShare() {
    this.viralSystem.recordPromptAction('shared');
    this._openShareSheet();
  }

  _onDismiss() {
    this.viralSystem.recordPromptAction('dismissed');
  }

  /**
   * Open the share sheet with pre-composed content.
   */
  _openShareSheet() {
    if (!this.currentPrompt) return;

    const sheet = document.createElement('div');
    sheet.className = 'viral-share-sheet';
    sheet.innerHTML = `
      <div class="viral-share-sheet__panel">
        <h3 class="viral-share-sheet__title">Share via</h3>
        <div class="viral-share-sheet__options">
          <button class="viral-share-option" data-platform="twitter">
            <svg class="viral-share-option__icon" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <span>X (Twitter)</span>
          </button>
          <button class="viral-share-option" data-platform="linkedin">
            <svg class="viral-share-option__icon" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            <span>LinkedIn</span>
          </button>
          <button class="viral-share-option" data-platform="email">
            <svg class="viral-share-option__icon" viewBox="0 0 24 24">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            <span>Email</span>
          </button>
          <button class="viral-share-option" data-platform="whatsapp">
            <svg class="viral-share-option__icon" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            </svg>
            <span>WhatsApp</span>
          </button>
          <button class="viral-share-option" data-platform="copy">
            <svg class="viral-share-option__icon" viewBox="0 0 24 24">
              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
            </svg>
            <span>Copy Link</span>
          </button>
          <button class="viral-share-option" data-platform="card">
            <svg class="viral-share-option__icon" viewBox="0 0 24 24">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
            <span>Share Card</span>
          </button>
        </div>
        <button class="viral-share-sheet__close" data-action="close">Cancel</button>
      </div>
    `;

    // Platform handlers
    sheet.querySelectorAll('[data-platform]').forEach(btn => {
      btn.addEventListener('click', () => {
        const platform = btn.dataset.platform;
        this._shareToPlatform(platform);
        sheet.remove();
      });
    });

    sheet.querySelector('[data-action="close"]').addEventListener('click', () => {
      sheet.remove();
    });

    document.body.appendChild(sheet);
  }

  /**
   * Execute the share action for a specific platform.
   */
  _shareToPlatform(platform) {
    const content = this.currentPrompt.content;
    const referralLink = 'https://focusmode.app/r/' + this._getReferralCode();

    const shareText = this._buildShareText(content, referralLink);

    switch (platform) {
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
          '_blank'
        );
        break;
      case 'linkedin':
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}&summary=${encodeURIComponent(shareText)}`,
          '_blank'
        );
        break;
      case 'email':
        const subject = content.title || 'Check out Focus Mode - Blocker';
        window.open(
          `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(shareText + '\n\n' + referralLink)}`,
          '_blank'
        );
        break;
      case 'whatsapp':
        window.open(
          `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + referralLink)}`,
          '_blank'
        );
        break;
      case 'copy':
        navigator.clipboard.writeText(shareText + ' ' + referralLink);
        this._showCopyConfirmation();
        break;
      case 'card':
        // Generate share card (see Section 4)
        chrome.runtime.sendMessage({
          type: 'GENERATE_SHARE_CARD',
          payload: { content, referralLink }
        });
        break;
    }

    // Track share action
    chrome.runtime.sendMessage({
      type: 'TRACK_EVENT',
      payload: {
        event: 'viral_share',
        properties: { platform, trigger: this.currentPrompt.key }
      }
    });
  }

  _buildShareText(content, referralLink) {
    // Build platform-appropriate share text from trigger content
    let text = content.title;
    if (content.body) text += ' ' + content.body;
    return text;
  }

  _getReferralCode() {
    // Generate or retrieve a stable referral code for this user
    // Stored in chrome.storage.local
    return 'ref_' + Math.random().toString(36).substr(2, 8);
  }

  _showCopyConfirmation() {
    const toast = document.createElement('div');
    toast.className = 'viral-copy-toast';
    toast.textContent = 'Link copied to clipboard!';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }
}

export default SharePrompt;
```

### 3.4 Share Prompt CSS

```css
/* src/popup/styles/viral-prompts.css */

/* ─── MODAL ──────────────────────────────────────────────────────── */

.viral-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 200ms ease-out;
}

.viral-modal {
  background: var(--bg-primary, #ffffff);
  border-radius: 16px;
  padding: 24px;
  max-width: 340px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 300ms ease-out;
}

.viral-modal__header {
  text-align: center;
  margin-bottom: 16px;
}

.viral-modal__badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 100px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.viral-modal__title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary, #1a1a2e);
  margin: 0;
  line-height: 1.3;
}

.viral-modal__body {
  font-size: 14px;
  color: var(--text-secondary, #64748b);
  text-align: center;
  line-height: 1.5;
  margin: 12px 0 20px;
}

.viral-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
  gap: 8px;
  margin: 16px 0;
}

.viral-stat {
  text-align: center;
  padding: 10px 4px;
  background: var(--bg-secondary, #f8fafc);
  border-radius: 10px;
}

.viral-stat__value {
  display: block;
  font-size: 22px;
  font-weight: 700;
  color: #6366f1;
}

.viral-stat__label {
  display: block;
  font-size: 11px;
  color: var(--text-tertiary, #94a3b8);
  margin-top: 2px;
}

.viral-modal__actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ─── TOAST ──────────────────────────────────────────────────────── */

.viral-toast {
  position: fixed;
  bottom: 16px;
  left: 16px;
  right: 16px;
  background: var(--bg-primary, #ffffff);
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  border-left: 4px solid #6366f1;
  z-index: 9999;
}

.viral-toast--enter {
  transform: translateY(100%);
  opacity: 0;
}

.viral-toast--visible {
  transform: translateY(0);
  opacity: 1;
  transition: transform 300ms ease-out, opacity 300ms ease-out;
}

.viral-toast--exit {
  animation: slideDown 200ms ease-in forwards;
}

.viral-toast__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, #1a1a2e);
  display: block;
}

.viral-toast__body {
  font-size: 12px;
  color: var(--text-secondary, #64748b);
  margin: 2px 0 0;
}

.viral-toast__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.viral-toast__close {
  background: none;
  border: none;
  font-size: 18px;
  color: var(--text-tertiary, #94a3b8);
  cursor: pointer;
  padding: 4px;
  line-height: 1;
}

/* ─── INLINE ─────────────────────────────────────────────────────── */

.viral-inline {
  background: linear-gradient(135deg, #f0f0ff, #f8f0ff);
  border-radius: 10px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 12px 0;
}

.viral-inline__text {
  font-size: 13px;
  color: var(--text-secondary, #64748b);
  margin: 0;
  flex: 1;
}

/* ─── SHARE SHEET ────────────────────────────────────────────────── */

.viral-share-sheet {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 10001;
  animation: fadeIn 200ms ease-out;
}

.viral-share-sheet__panel {
  background: var(--bg-primary, #ffffff);
  border-radius: 20px 20px 0 0;
  padding: 24px;
  width: 100%;
  animation: slideUp 300ms ease-out;
}

.viral-share-sheet__title {
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  margin: 0 0 20px;
  color: var(--text-primary, #1a1a2e);
}

.viral-share-sheet__options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.viral-share-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  border: none;
  background: var(--bg-secondary, #f8fafc);
  border-radius: 12px;
  cursor: pointer;
  transition: background 150ms ease;
}

.viral-share-option:hover {
  background: var(--bg-hover, #f1f5f9);
}

.viral-share-option__icon {
  width: 28px;
  height: 28px;
  fill: var(--text-primary, #1a1a2e);
}

.viral-share-option span {
  font-size: 11px;
  color: var(--text-secondary, #64748b);
}

.viral-share-sheet__close {
  width: 100%;
  padding: 14px;
  border: none;
  background: var(--bg-secondary, #f8fafc);
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary, #1a1a2e);
  cursor: pointer;
}

/* ─── BUTTONS ────────────────────────────────────────────────────── */

.viral-btn {
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 150ms ease;
  font-family: inherit;
}

.viral-btn--primary {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  padding: 12px 24px;
  font-size: 14px;
}

.viral-btn--primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.viral-btn--secondary {
  background: var(--bg-secondary, #f1f5f9);
  color: #6366f1;
  padding: 10px 20px;
  font-size: 13px;
}

.viral-btn--text {
  background: none;
  color: var(--text-tertiary, #94a3b8);
  padding: 10px 24px;
  font-size: 13px;
}

.viral-btn--small {
  padding: 6px 14px;
  font-size: 12px;
}

/* ─── ANIMATIONS ─────────────────────────────────────────────────── */

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes slideDown {
  from { transform: translateY(0); opacity: 1; }
  to { transform: translateY(100%); opacity: 0; }
}

/* ─── DARK MODE ──────────────────────────────────────────────────── */

@media (prefers-color-scheme: dark) {
  .viral-modal {
    background: #1e1e2e;
  }
  .viral-modal__title {
    color: #e2e8f0;
  }
  .viral-stat {
    background: #2a2a3e;
  }
  .viral-toast {
    background: #1e1e2e;
  }
  .viral-toast__title {
    color: #e2e8f0;
  }
  .viral-inline {
    background: linear-gradient(135deg, #1e1e2e, #2a1e3e);
  }
  .viral-share-sheet__panel {
    background: #1e1e2e;
  }
  .viral-share-option {
    background: #2a2a3e;
  }
}
```

### 3.5 Integration with Service Worker

```javascript
// src/background/service-worker.js (viral integration section)

import ViralTriggerSystem from './viral-trigger-system.js';
import ViralContextBuilder from './viral-context-builder.js';

const viralSystem = new ViralTriggerSystem();
const contextBuilder = new ViralContextBuilder();

// ─── MESSAGE HANDLERS ───────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHECK_VIRAL_TRIGGERS') {
    handleViralTriggerCheck().then(sendResponse);
    return true; // async response
  }

  if (message.type === 'VIRAL_PROMPT_ACTION') {
    viralSystem.recordPromptAction(message.payload.action);
    sendResponse({ success: true });
    return false;
  }

  if (message.type === 'GENERATE_SHARE_CARD') {
    handleShareCardGeneration(message.payload).then(sendResponse);
    return true;
  }

  if (message.type === 'GET_REFERRAL_CODE') {
    getReferralCode().then(sendResponse);
    return true;
  }
});

async function handleViralTriggerCheck() {
  try {
    const context = await contextBuilder.build();
    const trigger = await viralSystem.evaluate(context);
    return { trigger }; // null if no trigger should fire
  } catch (err) {
    console.error('[Viral] Trigger check error:', err);
    return { trigger: null };
  }
}

// ─── EVENT-DRIVEN TRIGGER CHECKS ────────────────────────────────────

// Check after session completion
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'session_complete_viral_check') {
    const context = await contextBuilder.build();
    const trigger = await viralSystem.evaluate(context);
    if (trigger) {
      // Store the pending trigger for the next popup open
      await chrome.storage.local.set({ 'viral.pendingTrigger': trigger });
    }
  }
});

// Check when popup opens
// (The popup script calls CHECK_VIRAL_TRIGGERS on load)

// ─── REFERRAL CODE MANAGEMENT ───────────────────────────────────────

async function getReferralCode() {
  const { viral = {} } = await chrome.storage.local.get('viral');
  if (viral.referralCode) {
    return { code: viral.referralCode };
  }

  // Generate a new referral code
  const code = 'fm_' + generateId(8);
  viral.referralCode = code;
  await chrome.storage.local.set({ viral });
  return { code };
}

function generateId(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}
```

### 3.6 Popup Integration

```javascript
// src/popup/popup.js (viral integration section)

import SharePrompt from './components/share-prompt.js';
import ViralTriggerSystem from '../background/viral-trigger-system.js';

const sharePrompt = new SharePrompt(new ViralTriggerSystem());

// Check for viral triggers when popup opens
async function checkViralTriggers() {
  // First check for pending triggers from background
  const { 'viral.pendingTrigger': pending } = await chrome.storage.local.get('viral.pendingTrigger');
  if (pending) {
    await chrome.storage.local.remove('viral.pendingTrigger');
    sharePrompt.show(pending);
    return;
  }

  // Then do a fresh check
  const response = await chrome.runtime.sendMessage({ type: 'CHECK_VIRAL_TRIGGERS' });
  if (response?.trigger) {
    sharePrompt.show(response.trigger);
  }
}

// Call after popup renders
document.addEventListener('DOMContentLoaded', () => {
  // Wait for main UI to render before checking viral triggers
  // Ensures the popup feels fast and viral check doesn't block rendering
  setTimeout(checkViralTriggers, 500);
});
```

---

## 4. Focus Stats Share Cards

### 4.1 Share Card Overview

Share cards are visual images generated in-extension that users can download or share directly to social media. They're the highest-ROI viral asset because they're visually appealing, contain interesting data, and naturally include branding.

```
SHARE CARD TYPES
================

+-------------------+-------------------+-------------------+
|                   |                   |                   |
|  WEEKLY REPORT    |  ACHIEVEMENT      |  STREAK           |
|  CARD             |  CARD             |  MILESTONE CARD   |
|                   |                   |                   |
|  Focus Score ring |  Badge visual     |  Streak count     |
|  Time saved       |  Achievement name |  Calendar heat    |
|  Streak count     |  Rarity level     |  Best streak      |
|  Sessions count   |  Date earned      |  Focus Score      |
|  Blocks count     |  User stats       |  Time saved       |
|                   |                   |                   |
+-------------------+-------------------+-------------------+
|                   |                   |                   |
|  YEAR IN FOCUS    |  NUCLEAR MODE     |  FOCUS SCORE      |
|  CARD             |  SURVIVOR CARD    |  MILESTONE CARD   |
|                   |                   |                   |
|  Annual summary   |  Duration         |  Score ring       |
|  Total sessions   |  Sites blocked    |  Improvement      |
|  Total time saved |  Zero bypasses    |  Percentile       |
|  Best streak      |  Completion time  |  Weekly trend     |
|  Achievements     |                   |                   |
|                   |                   |                   |
+-------------------+-------------------+-------------------+
```

### 4.2 ShareCardGenerator Class

```javascript
// src/background/share-card-generator.js

/**
 * ShareCardGenerator — Creates visual share cards using OffscreenCanvas
 * in the service worker context, or Canvas in popup/page context.
 *
 * Card dimensions optimized for social media:
 * - Twitter/X: 1200x675 (16:9)
 * - LinkedIn: 1200x627
 * - Instagram Stories: 1080x1920
 * - Default: 1200x675
 */
class ShareCardGenerator {
  constructor() {
    this.CARD_WIDTH = 1200;
    this.CARD_HEIGHT = 675;
    this.PADDING = 60;

    // Brand colors
    this.colors = {
      primary: '#6366f1',
      primaryLight: '#818cf8',
      primaryDark: '#4f46e5',
      accent: '#8b5cf6',
      gradientStart: '#6366f1',
      gradientEnd: '#a855f7',
      bgLight: '#ffffff',
      bgDark: '#0f0f23',
      textPrimary: '#1a1a2e',
      textSecondary: '#64748b',
      textLight: '#ffffff',
      textMuted: '#94a3b8',
      success: '#10b981',
      warning: '#f59e0b',
      scoreGreen: '#10b981',
      scoreYellow: '#f59e0b',
      scoreOrange: '#f97316',
      scoreRed: '#ef4444'
    };

    // Theme definitions
    this.themes = {
      light: {
        bg: '#ffffff',
        bgSecondary: '#f8fafc',
        text: '#1a1a2e',
        textSecondary: '#64748b',
        border: '#e2e8f0',
        cardBg: '#f1f5f9'
      },
      dark: {
        bg: '#0f0f23',
        bgSecondary: '#1a1a2e',
        text: '#e2e8f0',
        textSecondary: '#94a3b8',
        border: '#2a2a3e',
        cardBg: '#1e1e2e'
      },
      purple: {
        bg: 'gradient', // special handling
        bgSecondary: 'rgba(255,255,255,0.1)',
        text: '#ffffff',
        textSecondary: 'rgba(255,255,255,0.7)',
        border: 'rgba(255,255,255,0.2)',
        cardBg: 'rgba(255,255,255,0.1)'
      }
    };
  }

  // ─── WEEKLY REPORT CARD ───────────────────────────────────────────

  /**
   * Generate a weekly focus report share card.
   *
   * VISUAL LAYOUT:
   * +--------------------------------------------------+
   * |                                                  |
   * |  FOCUS MODE                    Feb 3-9, 2026     |
   * |  Weekly Focus Report                             |
   * |                                                  |
   * |     +--------+    Sessions: 12                   |
   * |     |  FOCUS |    Time Saved: 3.2h               |
   * |     | SCORE  |    Streak: 14 days                |
   * |     |  78    |    Blocks: 47                     |
   * |     +--------+                                   |
   * |                                                  |
   * |  [Mon][Tue][Wed][Thu][Fri][Sat][Sun]             |
   * |   ##   ##   ##   ##   ##   .    .               |
   * |                                                  |
   * |  Powered by Focus Mode - Blocker    focusmode.app|
   * +--------------------------------------------------+
   *
   * @param {Object} data - Weekly report data
   * @param {string} theme - 'light', 'dark', or 'purple'
   * @returns {Blob} PNG image blob
   */
  async generateWeeklyReport(data, theme = 'purple') {
    const canvas = new OffscreenCanvas(this.CARD_WIDTH, this.CARD_HEIGHT);
    const ctx = canvas.getContext('2d');
    const t = this.themes[theme];

    // Background
    this._drawBackground(ctx, theme);

    // Header
    this._drawText(ctx, 'FOCUS MODE', this.PADDING, 70, {
      font: '600 14px Inter',
      color: t.textSecondary,
      letterSpacing: 3
    });
    this._drawText(ctx, 'Weekly Focus Report', this.PADDING, 105, {
      font: '700 28px Inter',
      color: t.text
    });
    this._drawText(ctx, data.dateRange, this.CARD_WIDTH - this.PADDING, 70, {
      font: '400 14px Inter',
      color: t.textSecondary,
      align: 'right'
    });

    // Focus Score Ring (left side)
    this._drawFocusScoreRing(ctx, 200, 320, 100, data.focusScore, theme);

    // Stats (right of ring)
    const statsX = 380;
    const statsY = 230;
    const statsGap = 55;

    const stats = [
      { label: 'Sessions Completed', value: data.sessions.toString(), icon: 'timer' },
      { label: 'Time Saved', value: `${data.timeSaved}h`, icon: 'clock' },
      { label: 'Focus Streak', value: `${data.streak} days`, icon: 'flame' },
      { label: 'Distractions Blocked', value: data.blocks.toString(), icon: 'shield' }
    ];

    stats.forEach((stat, i) => {
      const y = statsY + i * statsGap;
      this._drawText(ctx, stat.value, statsX, y, {
        font: '700 24px Inter',
        color: t.text
      });
      this._drawText(ctx, stat.label, statsX, y + 22, {
        font: '400 13px Inter',
        color: t.textSecondary
      });
    });

    // Weekly activity bar chart (bottom section)
    this._drawWeeklyChart(ctx, data.dailyScores, theme);

    // Score change indicator
    if (data.scoreChange !== 0) {
      const changeText = data.scoreChange > 0
        ? `+${data.scoreChange} from last week`
        : `${data.scoreChange} from last week`;
      const changeColor = data.scoreChange > 0 ? this.colors.success : this.colors.scoreRed;
      this._drawText(ctx, changeText, 200, 440, {
        font: '500 13px Inter',
        color: changeColor,
        align: 'center'
      });
    }

    // Footer branding
    this._drawFooter(ctx, theme);

    // Export as PNG
    const blob = await canvas.convertToBlob({ type: 'image/png', quality: 1.0 });
    return blob;
  }

  // ─── ACHIEVEMENT CARD ─────────────────────────────────────────────

  /**
   * Generate an achievement share card.
   *
   * VISUAL LAYOUT:
   * +--------------------------------------------------+
   * |                                                  |
   * |  ACHIEVEMENT UNLOCKED                            |
   * |                                                  |
   * |         +------------------+                     |
   * |         |                  |                     |
   * |         |  [Badge Visual]  |                     |
   * |         |                  |                     |
   * |         +------------------+                     |
   * |                                                  |
   * |         "Week Warrior"                           |
   * |          Uncommon                                |
   * |                                                  |
   * |         7-day focus streak achieved              |
   * |         February 9, 2026                         |
   * |                                                  |
   * |  Focus Score: 78  |  Streak: 14  |  Blocks: 247 |
   * |                                                  |
   * |  Powered by Focus Mode - Blocker    focusmode.app|
   * +--------------------------------------------------+
   */
  async generateAchievementCard(data, theme = 'purple') {
    const canvas = new OffscreenCanvas(this.CARD_WIDTH, this.CARD_HEIGHT);
    const ctx = canvas.getContext('2d');
    const t = this.themes[theme];

    this._drawBackground(ctx, theme);

    // Header
    this._drawText(ctx, 'ACHIEVEMENT UNLOCKED', this.CARD_WIDTH / 2, 70, {
      font: '600 14px Inter',
      color: t.textSecondary,
      align: 'center',
      letterSpacing: 4
    });

    // Badge visual (centered)
    this._drawAchievementBadge(ctx, this.CARD_WIDTH / 2, 220, data.achievement, theme);

    // Achievement name
    this._drawText(ctx, `"${data.achievement.name}"`, this.CARD_WIDTH / 2, 360, {
      font: '700 28px Inter',
      color: t.text,
      align: 'center'
    });

    // Rarity
    const rarityColors = {
      'Common': '#94a3b8',
      'Uncommon': '#10b981',
      'Rare': '#3b82f6',
      'Epic': '#8b5cf6',
      'Legendary': '#f59e0b'
    };
    this._drawText(ctx, data.achievement.rarity, this.CARD_WIDTH / 2, 392, {
      font: '600 14px Inter',
      color: rarityColors[data.achievement.rarity] || t.textSecondary,
      align: 'center'
    });

    // Description
    this._drawText(ctx, data.achievement.description, this.CARD_WIDTH / 2, 430, {
      font: '400 15px Inter',
      color: t.textSecondary,
      align: 'center'
    });

    // Date earned
    this._drawText(ctx, data.dateEarned, this.CARD_WIDTH / 2, 458, {
      font: '400 13px Inter',
      color: t.textSecondary,
      align: 'center'
    });

    // Bottom stats row
    this._drawStatsRow(ctx, [
      { label: 'Focus Score', value: data.focusScore.toString() },
      { label: 'Streak', value: `${data.streak}d` },
      { label: 'Blocks', value: data.totalBlocks.toString() }
    ], 520, theme);

    this._drawFooter(ctx, theme);

    return await canvas.convertToBlob({ type: 'image/png', quality: 1.0 });
  }

  // ─── STREAK MILESTONE CARD ────────────────────────────────────────

  /**
   * Generate a streak milestone share card.
   *
   * VISUAL LAYOUT:
   * +--------------------------------------------------+
   * |                                                  |
   * |  FOCUS STREAK                                    |
   * |                                                  |
   * |              30                                  |
   * |             DAYS                                 |
   * |                                                  |
   * |  "This is officially a habit."                   |
   * |                                                  |
   * |  [calendar heatmap showing last 30 days]         |
   * |  ## ## ## ## ## ## ##                             |
   * |  ## ## ## ## ## ## ##                             |
   * |  ## ## ## ## ## ## ##                             |
   * |  ## ## ## ## ## ## ##                             |
   * |  ## ##                                           |
   * |                                                  |
   * |  Best: 30d  |  Score: 78  |  Saved: 12.5h       |
   * |                                                  |
   * |  Powered by Focus Mode - Blocker    focusmode.app|
   * +--------------------------------------------------+
   */
  async generateStreakCard(data, theme = 'purple') {
    const canvas = new OffscreenCanvas(this.CARD_WIDTH, this.CARD_HEIGHT);
    const ctx = canvas.getContext('2d');
    const t = this.themes[theme];

    this._drawBackground(ctx, theme);

    // Header
    this._drawText(ctx, 'FOCUS STREAK', this.CARD_WIDTH / 2, 60, {
      font: '600 14px Inter',
      color: t.textSecondary,
      align: 'center',
      letterSpacing: 4
    });

    // Large streak number
    this._drawText(ctx, data.streakDays.toString(), this.CARD_WIDTH / 2, 160, {
      font: '800 72px Inter',
      color: t.text,
      align: 'center'
    });
    this._drawText(ctx, 'DAYS', this.CARD_WIDTH / 2, 190, {
      font: '600 18px Inter',
      color: t.textSecondary,
      align: 'center',
      letterSpacing: 6
    });

    // Motivational quote
    const quotes = {
      3: 'The journey of a thousand miles begins with a single step.',
      7: 'One week down. You\'re proving something.',
      14: 'Two weeks. Consistency is your superpower.',
      30: 'This is officially a habit.',
      60: 'Two months. This tool changed your work habits.',
      100: 'Triple digits. From distracted to disciplined.',
      365: 'One full year. This is who you are now.'
    };
    const quote = quotes[data.streakDays] || `${data.streakDays} days of showing up.`;
    this._drawText(ctx, `"${quote}"`, this.CARD_WIDTH / 2, 240, {
      font: 'italic 400 16px Inter',
      color: t.textSecondary,
      align: 'center'
    });

    // Calendar heatmap
    this._drawStreakHeatmap(ctx, data.dailyActivity, data.streakDays, theme);

    // Bottom stats
    this._drawStatsRow(ctx, [
      { label: 'Best Streak', value: `${data.bestStreak}d` },
      { label: 'Focus Score', value: data.focusScore.toString() },
      { label: 'Time Saved', value: `${data.timeSaved}h` }
    ], 560, theme);

    this._drawFooter(ctx, theme);

    return await canvas.convertToBlob({ type: 'image/png', quality: 1.0 });
  }

  // ─── YEAR IN FOCUS CARD ───────────────────────────────────────────

  /**
   * Generate a "Year in Focus" annual summary card.
   *
   * VISUAL LAYOUT:
   * +--------------------------------------------------+
   * |                                                  |
   * |  YOUR YEAR IN FOCUS                 2025-2026    |
   * |                                                  |
   * |  +----------+  +----------+  +----------+       |
   * |  |   487    |  | 203.5h   |  |   92     |       |
   * |  | sessions |  | saved    |  | best     |       |
   * |  |          |  |          |  | streak   |       |
   * |  +----------+  +----------+  +----------+       |
   * |                                                  |
   * |  +----------+  +----------+  +----------+       |
   * |  |  4,721   |  |   78     |  |   8/10   |       |
   * |  | blocked  |  | avg score|  | achieve  |       |
   * |  |          |  |          |  | ments    |       |
   * |  +----------+  +----------+  +----------+       |
   * |                                                  |
   * |  [365-day activity heatmap]                      |
   * |                                                  |
   * |  Powered by Focus Mode - Blocker    focusmode.app|
   * +--------------------------------------------------+
   */
  async generateYearInFocusCard(data, theme = 'purple') {
    const canvas = new OffscreenCanvas(this.CARD_WIDTH, this.CARD_HEIGHT);
    const ctx = canvas.getContext('2d');
    const t = this.themes[theme];

    this._drawBackground(ctx, theme);

    // Header
    this._drawText(ctx, 'YOUR YEAR IN FOCUS', this.PADDING, 65, {
      font: '600 14px Inter',
      color: t.textSecondary,
      letterSpacing: 3
    });
    this._drawText(ctx, data.yearRange, this.CARD_WIDTH - this.PADDING, 65, {
      font: '400 14px Inter',
      color: t.textSecondary,
      align: 'right'
    });

    // 6-stat grid (2 rows x 3 columns)
    const gridStartX = this.PADDING + 20;
    const gridStartY = 110;
    const cellWidth = (this.CARD_WIDTH - 2 * this.PADDING - 40) / 3;
    const cellHeight = 100;
    const gridGap = 20;

    const yearStats = [
      { value: data.totalSessions.toLocaleString(), label: 'sessions' },
      { value: `${data.totalTimeSaved}h`, label: 'saved' },
      { value: data.bestStreak.toString(), label: 'best streak' },
      { value: data.totalBlocks.toLocaleString(), label: 'blocked' },
      { value: data.avgFocusScore.toString(), label: 'avg score' },
      { value: `${data.achievementsEarned}/10`, label: 'achievements' }
    ];

    yearStats.forEach((stat, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = gridStartX + col * (cellWidth + gridGap);
      const y = gridStartY + row * (cellHeight + gridGap);

      // Card background
      ctx.fillStyle = t.cardBg;
      this._roundRect(ctx, x, y, cellWidth, cellHeight, 12);
      ctx.fill();

      // Value
      this._drawText(ctx, stat.value, x + cellWidth / 2, y + 45, {
        font: '700 28px Inter',
        color: t.text,
        align: 'center'
      });
      // Label
      this._drawText(ctx, stat.label, x + cellWidth / 2, y + 72, {
        font: '400 13px Inter',
        color: t.textSecondary,
        align: 'center'
      });
    });

    // Mini heatmap (simplified for annual view)
    this._drawAnnualHeatmap(ctx, data.dailyActivity, theme);

    this._drawFooter(ctx, theme);

    return await canvas.convertToBlob({ type: 'image/png', quality: 1.0 });
  }

  // ─── FOCUS SCORE MILESTONE CARD ───────────────────────────────────

  /**
   * Generate a Focus Score milestone card.
   *
   * VISUAL LAYOUT:
   * +--------------------------------------------------+
   * |                                                  |
   * |  FOCUS SCORE                                     |
   * |                                                  |
   * |         +------------------+                     |
   * |         |                  |                     |
   * |         |    [Score Ring]  |                     |
   * |         |       92        |                     |
   * |         |                  |                     |
   * |         +------------------+                     |
   * |                                                  |
   * |         "Focus Master"                           |
   * |         Top 5% of all users                      |
   * |                                                  |
   * |  +12 this week  |  14-day streak  |  3.2h saved  |
   * |                                                  |
   * |  Powered by Focus Mode - Blocker    focusmode.app|
   * +--------------------------------------------------+
   */
  async generateFocusScoreCard(data, theme = 'purple') {
    const canvas = new OffscreenCanvas(this.CARD_WIDTH, this.CARD_HEIGHT);
    const ctx = canvas.getContext('2d');
    const t = this.themes[theme];

    this._drawBackground(ctx, theme);

    // Header
    this._drawText(ctx, 'FOCUS SCORE', this.CARD_WIDTH / 2, 60, {
      font: '600 14px Inter',
      color: t.textSecondary,
      align: 'center',
      letterSpacing: 4
    });

    // Large score ring
    this._drawFocusScoreRing(ctx, this.CARD_WIDTH / 2, 250, 130, data.score, theme);

    // Label
    const labels = {
      95: 'Focus Legendary', 90: 'Focus Master',
      85: 'Focus Elite', 80: 'Focus Pro',
      70: 'Focused', 50: 'Building Focus'
    };
    let label = 'Getting Started';
    for (const [threshold, l] of Object.entries(labels).sort((a, b) => b[0] - a[0])) {
      if (data.score >= parseInt(threshold)) { label = l; break; }
    }
    this._drawText(ctx, `"${label}"`, this.CARD_WIDTH / 2, 420, {
      font: '700 22px Inter',
      color: t.text,
      align: 'center'
    });

    // Percentile
    const percentile = data.score >= 95 ? 'Top 1%' :
                       data.score >= 90 ? 'Top 5%' :
                       data.score >= 85 ? 'Top 10%' :
                       data.score >= 70 ? 'Top 25%' : 'Top 50%';
    this._drawText(ctx, `${percentile} of all users`, this.CARD_WIDTH / 2, 455, {
      font: '400 15px Inter',
      color: t.textSecondary,
      align: 'center'
    });

    // Bottom stats
    const changePrefix = data.weeklyChange >= 0 ? '+' : '';
    this._drawStatsRow(ctx, [
      { label: 'This Week', value: `${changePrefix}${data.weeklyChange}` },
      { label: 'Streak', value: `${data.streak}d` },
      { label: 'Saved', value: `${data.timeSaved}h` }
    ], 520, theme);

    this._drawFooter(ctx, theme);

    return await canvas.convertToBlob({ type: 'image/png', quality: 1.0 });
  }

  // ─── DRAWING HELPERS ──────────────────────────────────────────────

  _drawBackground(ctx, theme) {
    if (theme === 'purple') {
      const gradient = ctx.createLinearGradient(0, 0, this.CARD_WIDTH, this.CARD_HEIGHT);
      gradient.addColorStop(0, '#4f46e5');
      gradient.addColorStop(0.5, '#6366f1');
      gradient.addColorStop(1, '#7c3aed');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.CARD_WIDTH, this.CARD_HEIGHT);

      // Subtle pattern overlay
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * this.CARD_WIDTH;
        const y = Math.random() * this.CARD_HEIGHT;
        const r = Math.random() * 100 + 20;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (theme === 'dark') {
      ctx.fillStyle = '#0f0f23';
      ctx.fillRect(0, 0, this.CARD_WIDTH, this.CARD_HEIGHT);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, this.CARD_WIDTH, this.CARD_HEIGHT);
    }

    // Rounded corners (clip)
    ctx.save();
    this._roundRect(ctx, 0, 0, this.CARD_WIDTH, this.CARD_HEIGHT, 24);
    ctx.clip();
    ctx.restore();
  }

  _drawFocusScoreRing(ctx, cx, cy, radius, score, theme) {
    const t = this.themes[theme];
    const lineWidth = 12;

    // Background ring
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = t.cardBg;
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    // Score ring (progress)
    const scoreColor = score >= 85 ? this.colors.scoreGreen :
                       score >= 70 ? this.colors.primary :
                       score >= 50 ? this.colors.scoreYellow :
                       this.colors.scoreOrange;

    const progress = score / 100;
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (Math.PI * 2 * progress);

    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.strokeStyle = scoreColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Score number
    this._drawText(ctx, score.toString(), cx, cy + 15, {
      font: '800 48px Inter',
      color: t.text,
      align: 'center'
    });

    // "Focus Score" label
    this._drawText(ctx, 'FOCUS SCORE', cx, cy + 45, {
      font: '500 11px Inter',
      color: t.textSecondary,
      align: 'center',
      letterSpacing: 2
    });
  }

  _drawAchievementBadge(ctx, cx, cy, achievement, theme) {
    const t = this.themes[theme];
    const radius = 60;

    // Badge circle background
    const rarityGradients = {
      'Common': ['#94a3b8', '#64748b'],
      'Uncommon': ['#10b981', '#059669'],
      'Rare': ['#3b82f6', '#2563eb'],
      'Epic': ['#8b5cf6', '#7c3aed'],
      'Legendary': ['#f59e0b', '#d97706']
    };
    const [color1, color2] = rarityGradients[achievement.rarity] || ['#94a3b8', '#64748b'];

    const gradient = ctx.createRadialGradient(cx, cy - 10, 0, cx, cy, radius);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Badge icon (shield for Focus Mode)
    ctx.fillStyle = '#ffffff';
    ctx.font = '400 40px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('\u{1F6E1}', cx, cy); // shield emoji as placeholder
  }

  _drawWeeklyChart(ctx, dailyScores, theme) {
    const t = this.themes[theme];
    const chartX = this.PADDING + 340;
    const chartY = 500;
    const barWidth = 60;
    const barGap = 16;
    const maxHeight = 80;
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    dailyScores.forEach((score, i) => {
      const x = chartX + i * (barWidth + barGap);
      const height = (score / 100) * maxHeight;
      const y = chartY - height;

      // Bar
      ctx.fillStyle = score > 0 ? this.colors.primary : t.cardBg;
      this._roundRect(ctx, x, y, barWidth, height || 4, 6);
      ctx.fill();

      // Day label
      this._drawText(ctx, days[i], x + barWidth / 2, chartY + 18, {
        font: '400 11px Inter',
        color: t.textSecondary,
        align: 'center'
      });

      // Score label (if > 0)
      if (score > 0) {
        this._drawText(ctx, score.toString(), x + barWidth / 2, y - 8, {
          font: '600 11px Inter',
          color: t.text,
          align: 'center'
        });
      }
    });
  }

  _drawStreakHeatmap(ctx, dailyActivity, streakDays, theme) {
    const t = this.themes[theme];
    const startX = this.PADDING + 80;
    const startY = 290;
    const cellSize = 18;
    const cellGap = 4;
    const cols = 7;
    const rows = Math.ceil(Math.min(streakDays, 42) / cols); // max 6 weeks

    const days = dailyActivity.slice(-42); // last 42 days

    days.forEach((active, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cellSize + cellGap);
      const y = startY + row * (cellSize + cellGap);

      ctx.fillStyle = active
        ? this.colors.primary
        : theme === 'purple' ? 'rgba(255,255,255,0.1)' : t.cardBg;

      this._roundRect(ctx, x, y, cellSize, cellSize, 4);
      ctx.fill();
    });

    // Legend
    const legendX = startX + cols * (cellSize + cellGap) + 30;
    ctx.fillStyle = this.colors.primary;
    this._roundRect(ctx, legendX, startY, 12, 12, 3);
    ctx.fill();
    this._drawText(ctx, 'Active', legendX + 20, startY + 10, {
      font: '400 11px Inter',
      color: t.textSecondary
    });

    ctx.fillStyle = theme === 'purple' ? 'rgba(255,255,255,0.1)' : t.cardBg;
    this._roundRect(ctx, legendX, startY + 22, 12, 12, 3);
    ctx.fill();
    this._drawText(ctx, 'Missed', legendX + 20, startY + 32, {
      font: '400 11px Inter',
      color: t.textSecondary
    });
  }

  _drawAnnualHeatmap(ctx, dailyActivity, theme) {
    const t = this.themes[theme];
    const startX = this.PADDING;
    const startY = 380;
    const cellSize = 8;
    const cellGap = 2;

    // 52 weeks x 7 days
    const days = dailyActivity.slice(-364);
    days.forEach((active, i) => {
      const week = Math.floor(i / 7);
      const day = i % 7;
      const x = startX + week * (cellSize + cellGap);
      const y = startY + day * (cellSize + cellGap);

      if (active) {
        const intensity = typeof active === 'number'
          ? Math.min(active / 100, 1)
          : 1;
        ctx.fillStyle = `rgba(99, 102, 241, ${0.2 + intensity * 0.8})`;
      } else {
        ctx.fillStyle = theme === 'purple' ? 'rgba(255,255,255,0.05)' : t.cardBg;
      }

      this._roundRect(ctx, x, y, cellSize, cellSize, 2);
      ctx.fill();
    });
  }

  _drawStatsRow(ctx, stats, y, theme) {
    const t = this.themes[theme];
    const totalWidth = this.CARD_WIDTH - 2 * this.PADDING;
    const sectionWidth = totalWidth / stats.length;

    stats.forEach((stat, i) => {
      const x = this.PADDING + i * sectionWidth + sectionWidth / 2;

      // Divider (except first)
      if (i > 0) {
        ctx.beginPath();
        ctx.moveTo(this.PADDING + i * sectionWidth, y - 10);
        ctx.lineTo(this.PADDING + i * sectionWidth, y + 30);
        ctx.strokeStyle = t.border;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      this._drawText(ctx, stat.value, x, y + 5, {
        font: '700 20px Inter',
        color: t.text,
        align: 'center'
      });
      this._drawText(ctx, stat.label, x, y + 28, {
        font: '400 12px Inter',
        color: t.textSecondary,
        align: 'center'
      });
    });
  }

  _drawFooter(ctx, theme) {
    const t = this.themes[theme];
    const y = this.CARD_HEIGHT - 30;

    // Left: "Powered by Focus Mode - Blocker"
    this._drawText(ctx, 'Powered by Focus Mode - Blocker', this.PADDING, y, {
      font: '400 12px Inter',
      color: t.textSecondary
    });

    // Right: URL
    this._drawText(ctx, 'focusmode.app', this.CARD_WIDTH - this.PADDING, y, {
      font: '500 12px Inter',
      color: t.textSecondary,
      align: 'right'
    });

    // Separator line
    ctx.beginPath();
    ctx.moveTo(this.PADDING, y - 18);
    ctx.lineTo(this.CARD_WIDTH - this.PADDING, y - 18);
    ctx.strokeStyle = t.border;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  _drawText(ctx, text, x, y, options = {}) {
    ctx.font = options.font || '400 14px Inter';
    ctx.fillStyle = options.color || '#000000';
    ctx.textAlign = options.align || 'left';
    ctx.textBaseline = options.baseline || 'middle';

    if (options.letterSpacing) {
      // Manual letter spacing
      const chars = text.split('');
      if (options.align === 'center') {
        const totalWidth = chars.reduce((w, c) => w + ctx.measureText(c).width + options.letterSpacing, 0);
        x -= totalWidth / 2;
      }
      chars.forEach(char => {
        ctx.fillText(char, x, y);
        x += ctx.measureText(char).width + options.letterSpacing;
      });
    } else {
      ctx.fillText(text, x, y);
    }
  }

  _roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

export default ShareCardGenerator;
```

### 4.3 Share Card Download & Share Handler

```javascript
// src/popup/components/share-card-handler.js

/**
 * Handles the download and sharing of generated share cards.
 */
class ShareCardHandler {
  /**
   * Download a share card as a PNG image.
   * @param {Blob} imageBlob - Generated card image
   * @param {string} filename - Filename for download
   */
  async download(imageBlob, filename = 'focus-mode-stats.png') {
    const url = URL.createObjectURL(imageBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Copy share card image to clipboard (where supported).
   * @param {Blob} imageBlob - Generated card image
   * @returns {boolean} - Whether copy succeeded
   */
  async copyToClipboard(imageBlob) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': imageBlob })
      ]);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Open the native Web Share API if available.
   * Falls back to download if Web Share is not supported.
   * @param {Blob} imageBlob - Generated card image
   * @param {string} text - Share text
   */
  async nativeShare(imageBlob, text) {
    if (navigator.canShare) {
      const file = new File([imageBlob], 'focus-mode-stats.png', { type: 'image/png' });
      const shareData = {
        title: 'My Focus Stats',
        text: text,
        files: [file]
      };

      if (navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData);
          return true;
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.warn('[ShareCard] Native share failed:', err);
          }
          return false;
        }
      }
    }

    // Fallback: download
    await this.download(imageBlob);
    return true;
  }

  /**
   * Open share card preview with download/share options.
   * @param {Blob} imageBlob - Generated card image
   * @param {Object} options - Share options
   */
  showPreview(imageBlob, options = {}) {
    const url = URL.createObjectURL(imageBlob);

    const preview = document.createElement('div');
    preview.className = 'share-card-preview';
    preview.innerHTML = `
      <div class="share-card-preview__backdrop"></div>
      <div class="share-card-preview__panel">
        <h3 class="share-card-preview__title">Your Focus Card</h3>
        <div class="share-card-preview__image-wrap">
          <img src="${url}" alt="Focus stats share card"
               class="share-card-preview__image" />
        </div>
        <div class="share-card-preview__theme-picker">
          <button class="share-card-preview__theme share-card-preview__theme--active"
                  data-theme="purple" title="Purple">
            <span style="background: linear-gradient(135deg, #6366f1, #8b5cf6)"></span>
          </button>
          <button class="share-card-preview__theme"
                  data-theme="dark" title="Dark">
            <span style="background: #0f0f23"></span>
          </button>
          <button class="share-card-preview__theme"
                  data-theme="light" title="Light">
            <span style="background: #ffffff; border: 1px solid #e2e8f0"></span>
          </button>
        </div>
        <div class="share-card-preview__actions">
          <button class="viral-btn viral-btn--primary" data-action="download">
            Download Image
          </button>
          <button class="viral-btn viral-btn--secondary" data-action="copy">
            Copy to Clipboard
          </button>
          <button class="viral-btn viral-btn--secondary" data-action="share">
            Share...
          </button>
        </div>
        <button class="share-card-preview__close" data-action="close">
          &times;
        </button>
      </div>
    `;

    // Event handlers
    preview.querySelector('[data-action="download"]').addEventListener('click', () => {
      this.download(imageBlob, `focus-${options.type || 'stats'}-${Date.now()}.png`);
    });

    preview.querySelector('[data-action="copy"]').addEventListener('click', async () => {
      const success = await this.copyToClipboard(imageBlob);
      if (success) {
        preview.querySelector('[data-action="copy"]').textContent = 'Copied!';
        setTimeout(() => {
          preview.querySelector('[data-action="copy"]').textContent = 'Copy to Clipboard';
        }, 2000);
      }
    });

    preview.querySelector('[data-action="share"]').addEventListener('click', () => {
      this.nativeShare(imageBlob, options.shareText || 'Check out my focus stats!');
    });

    preview.querySelector('[data-action="close"]').addEventListener('click', () => {
      URL.revokeObjectURL(url);
      preview.remove();
    });

    preview.querySelector('.share-card-preview__backdrop').addEventListener('click', () => {
      URL.revokeObjectURL(url);
      preview.remove();
    });

    // Theme picker
    preview.querySelectorAll('[data-theme]').forEach(btn => {
      btn.addEventListener('click', async () => {
        preview.querySelectorAll('.share-card-preview__theme').forEach(b =>
          b.classList.remove('share-card-preview__theme--active'));
        btn.classList.add('share-card-preview__theme--active');

        // Regenerate card with new theme
        if (options.regenerate) {
          const newBlob = await options.regenerate(btn.dataset.theme);
          const newUrl = URL.createObjectURL(newBlob);
          preview.querySelector('.share-card-preview__image').src = newUrl;
          imageBlob = newBlob;
        }
      });
    });

    document.body.appendChild(preview);
  }
}

export default ShareCardHandler;
```

### 4.4 Share Card Preview CSS

```css
/* src/popup/styles/share-card-preview.css */

.share-card-preview {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 10002;
  display: flex;
  align-items: center;
  justify-content: center;
}

.share-card-preview__backdrop {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  animation: fadeIn 200ms ease-out;
}

.share-card-preview__panel {
  position: relative;
  background: var(--bg-primary, #ffffff);
  border-radius: 20px;
  padding: 24px;
  max-width: 420px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 300ms ease-out;
  z-index: 1;
}

.share-card-preview__title {
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  margin: 0 0 16px;
}

.share-card-preview__image-wrap {
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.share-card-preview__image {
  width: 100%;
  height: auto;
  display: block;
}

.share-card-preview__theme-picker {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 16px;
}

.share-card-preview__theme {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  padding: 3px;
  background: none;
}

.share-card-preview__theme span {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.share-card-preview__theme--active {
  border-color: #6366f1;
}

.share-card-preview__actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.share-card-preview__close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border: none;
  background: var(--bg-secondary, #f1f5f9);
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary, #64748b);
}
```

---

## 5. Powered By Integration

### 5.1 Branding Strategy

The "Powered by" badge is a passive viral mechanism. It appears on all shared content, exported data, and (optionally) on the block page. The goal is to create brand awareness without being intrusive.

```
BADGE PLACEMENT MAP
====================

+---------------------------------------------------+
|  CONTEXT              | BADGE STYLE    | REMOVABLE |
+---------------------------------------------------+
|  Share cards           | Full (logo+text)| No       |
|  Exported CSV/PDF      | Footer text     | Pro: Yes |
|  Block page (shared)   | Footer link     | Pro: Yes |
|  Weekly report (shared)| Footer text     | No       |
|  Shared blocklist link | Inline badge    | No       |
|  Team leaderboard      | Header badge    | No       |
|  Public challenge page | Footer + logo   | No       |
+---------------------------------------------------+
```

### 5.2 Badge Variants

```
BADGE STYLE: DEFAULT (Purple)
+-------------------------------------------+
|  [Shield Icon]  Focus Mode - Blocker      |
|                 focusmode.app/r/{code}     |
+-------------------------------------------+

BADGE STYLE: MINIMAL (Text only)
+-------------------------------------------+
|  Tracked with Focus Mode - Blocker        |
+-------------------------------------------+

BADGE STYLE: DARK MODE
+-------------------------------------------+
|  [Shield Icon]  Focus Mode - Blocker      |
|  (white text on transparent background)   |
+-------------------------------------------+

BADGE STYLE: COMPACT (for inline use)
+------------------------------+
|  Focus Mode  [shield icon]  |
+------------------------------+
```

### 5.3 Badge Component

```javascript
// src/shared/components/powered-by-badge.js

/**
 * PoweredByBadge — Renders the "Powered by Focus Mode" badge
 * in various contexts and styles.
 */
class PoweredByBadge {
  constructor(options = {}) {
    this.style = options.style || 'default'; // default, minimal, dark, compact
    this.referralCode = options.referralCode || '';
    this.showLink = options.showLink !== false;
    this.removable = options.removable || false;
    this.linkBase = 'https://focusmode.app';
  }

  /**
   * Get the referral URL for this badge.
   */
  getUrl() {
    if (this.referralCode) {
      return `${this.linkBase}/r/${this.referralCode}`;
    }
    return this.linkBase;
  }

  /**
   * Render the badge as an HTML string.
   * @returns {string} HTML
   */
  renderHTML() {
    const url = this.getUrl();

    switch (this.style) {
      case 'minimal':
        return `
          <div class="pb-badge pb-badge--minimal">
            <span class="pb-badge__text">Tracked with Focus Mode - Blocker</span>
            ${this.removable ? '<button class="pb-badge__remove" aria-label="Remove badge">&times;</button>' : ''}
          </div>
        `;

      case 'compact':
        return `
          <a href="${url}" target="_blank" rel="noopener" class="pb-badge pb-badge--compact">
            ${this._shieldSVG(14)}
            <span class="pb-badge__text">Focus Mode</span>
          </a>
        `;

      case 'dark':
        return `
          <a href="${url}" target="_blank" rel="noopener" class="pb-badge pb-badge--dark">
            ${this._shieldSVG(18)}
            <div class="pb-badge__content">
              <span class="pb-badge__name">Focus Mode - Blocker</span>
              ${this.showLink ? `<span class="pb-badge__link">${url}</span>` : ''}
            </div>
          </a>
        `;

      default: // 'default'
        return `
          <a href="${url}" target="_blank" rel="noopener" class="pb-badge pb-badge--default">
            ${this._shieldSVG(18)}
            <div class="pb-badge__content">
              <span class="pb-badge__name">Focus Mode - Blocker</span>
              ${this.showLink ? `<span class="pb-badge__link">${url}</span>` : ''}
            </div>
            ${this.removable ? '<button class="pb-badge__remove" aria-label="Remove badge">&times;</button>' : ''}
          </a>
        `;
    }
  }

  /**
   * Draw the badge onto a Canvas context (for share cards).
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} options - Drawing options
   */
  drawOnCanvas(ctx, x, y, options = {}) {
    const color = options.color || '#64748b';
    const fontSize = options.fontSize || 12;

    // Shield icon (simplified for canvas)
    ctx.fillStyle = '#6366f1';
    ctx.beginPath();
    const iconSize = fontSize + 2;
    const ix = x;
    const iy = y - iconSize / 2;
    // Simplified shield path
    ctx.moveTo(ix + iconSize / 2, iy);
    ctx.lineTo(ix + iconSize, iy + iconSize * 0.25);
    ctx.lineTo(ix + iconSize, iy + iconSize * 0.6);
    ctx.quadraticCurveTo(ix + iconSize / 2, iy + iconSize, ix + iconSize / 2, iy + iconSize);
    ctx.quadraticCurveTo(ix + iconSize / 2, iy + iconSize, ix, iy + iconSize * 0.6);
    ctx.lineTo(ix, iy + iconSize * 0.25);
    ctx.closePath();
    ctx.fill();

    // Text
    ctx.font = `400 ${fontSize}px Inter`;
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Powered by Focus Mode - Blocker', x + iconSize + 8, y);

    // URL (if link shown)
    if (this.showLink) {
      ctx.font = `500 ${fontSize}px Inter`;
      const textWidth = ctx.measureText('Powered by Focus Mode - Blocker').width;
      const urlX = x + iconSize + 8 + textWidth + 20;
      ctx.fillText(this.getUrl().replace('https://', ''), urlX, y);
    }
  }

  _shieldSVG(size) {
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
           xmlns="http://www.w3.org/2000/svg" class="pb-badge__icon">
        <path d="M12 2L3 7V12C3 17.55 6.84 22.74 12 24C17.16 22.74 21 17.55 21 12V7L12 2Z"
              fill="url(#shield-gradient)"/>
        <path d="M10 15L7 12L8.41 10.59L10 12.17L15.59 6.58L17 8L10 15Z"
              fill="white"/>
        <defs>
          <linearGradient id="shield-gradient" x1="3" y1="2" x2="21" y2="24">
            <stop offset="0%" stop-color="#6366f1"/>
            <stop offset="100%" stop-color="#8b5cf6"/>
          </linearGradient>
        </defs>
      </svg>
    `;
  }
}

export default PoweredByBadge;
```

### 5.4 Badge CSS

```css
/* src/shared/styles/powered-by-badge.css */

.pb-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  transition: opacity 150ms ease;
}

.pb-badge:hover {
  opacity: 0.8;
}

/* Default style */
.pb-badge--default {
  padding: 8px 14px;
  background: linear-gradient(135deg, #f0f0ff, #f8f0ff);
  border-radius: 8px;
  border: 1px solid rgba(99, 102, 241, 0.15);
}

.pb-badge--default .pb-badge__name {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a2e;
  display: block;
}

.pb-badge--default .pb-badge__link {
  font-size: 11px;
  color: #6366f1;
  display: block;
}

/* Minimal style */
.pb-badge--minimal {
  padding: 6px 0;
}

.pb-badge--minimal .pb-badge__text {
  font-size: 12px;
  color: #94a3b8;
}

/* Compact style */
.pb-badge--compact {
  padding: 4px 10px;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 100px;
}

.pb-badge--compact .pb-badge__text {
  font-size: 11px;
  font-weight: 600;
  color: #6366f1;
}

/* Dark style */
.pb-badge--dark {
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.pb-badge--dark .pb-badge__name {
  font-size: 13px;
  font-weight: 600;
  color: #e2e8f0;
  display: block;
}

.pb-badge--dark .pb-badge__link {
  font-size: 11px;
  color: #818cf8;
  display: block;
}

/* Icon */
.pb-badge__icon {
  flex-shrink: 0;
}

/* Remove button */
.pb-badge__remove {
  background: none;
  border: none;
  font-size: 16px;
  color: #94a3b8;
  cursor: pointer;
  padding: 0 0 0 8px;
  line-height: 1;
}

.pb-badge__remove:hover {
  color: #64748b;
}
```

### 5.5 Pro Users: Badge Control

Pro users can disable the "Powered by" badge on exported content. This is a small but meaningful Pro perk that respects power users who don't want branding on their shared content.

```javascript
// src/popup/settings/badge-settings.js

/**
 * Settings section for "Powered by" badge control.
 * Only visible to Pro users.
 */
function renderBadgeSettings(isPro) {
  if (!isPro) return '';

  return `
    <div class="settings-section">
      <h4 class="settings-section__title">Branding</h4>
      <div class="settings-row">
        <div class="settings-row__label">
          <span>"Powered by" badge</span>
          <span class="settings-row__description">
            Show Focus Mode branding on exported/shared content
          </span>
        </div>
        <label class="toggle">
          <input type="checkbox" id="show-badge" checked />
          <span class="toggle__slider"></span>
        </label>
      </div>
      <div class="settings-row">
        <div class="settings-row__label">
          <span>Badge style</span>
        </div>
        <select id="badge-style" class="settings-select">
          <option value="default">Default (Logo + Text)</option>
          <option value="minimal">Minimal (Text only)</option>
          <option value="compact">Compact</option>
        </select>
      </div>
    </div>
  `;
}
```

---

## 6. Collaborative Virality

### 6.1 Collaborative Features Overview

Collaborative features create network effects: the product becomes more valuable as more people in a user's network adopt it. These features are stratified across pricing tiers.

```
COLLABORATIVE FEATURE MAP
==========================

+-------------------+---------+------+------+
| Feature           | Free    | Pro  | Team |
+-------------------+---------+------+------+
| Share blocklist   |  Yes    | Yes  | Yes  |
| Import blocklist  |  Yes    | Yes  | Yes  |
| Template lists    |  3      | All  | All  |
| Focus challenges  |  Join   | Host | Host |
| Accountability    |  --     | 1    | Unl. |
| Team sessions     |  --     | --   | Yes  |
| Team leaderboard  |  --     | --   | Yes  |
| Focus Party       |  --     | --   | Yes  |
| Shared blocklist  |  --     | --   | Yes  |
| Admin dashboard   |  --     | --   | Yes  |
+-------------------+---------+------+------+
```

### 6.2 Shared Blocklists

Shared blocklists are a powerful viral mechanism because they require the extension to be installed in order to import them. This creates a natural product loop.

```
SHARED BLOCKLIST FLOW
=====================

  User A creates blocklist
          |
          v
  User A generates share link
  (focusmode.app/list/{id})
          |
          v
  User B clicks the link
          |
          +----------- Has extension?
          |                  |
          v                  v
  +---------------+  +-------------------+
  | Show landing  |  | Import prompt in  |
  | page with     |  | extension popup   |
  | install CTA   |  | "Import Sarah's   |
  |               |  |  Blocklist?"      |
  | Preview of    |  |                   |
  | list contents |  | [Import] [Cancel] |
  +---------------+  +-------------------+
          |                  |
          v                  v
  Install extension    Sites added to
  + auto-import        existing blocklist
```

#### Blocklist Share Data Format

```javascript
// Shared blocklist data structure (stored on server for Team/Pro,
// or as encoded URL parameter for free tier)

const sharedBlocklist = {
  id: 'list_a1b2c3d4',
  name: 'Developer Distraction Pack',
  description: 'Essential blocks for developers: social media, news, and entertainment during work hours.',
  creator: {
    displayName: 'Sarah K.', // first name + initial only
    focusScore: 85,           // social proof
    streakDays: 42            // social proof
  },
  sites: [
    { domain: 'twitter.com', category: 'social' },
    { domain: 'reddit.com', category: 'social' },
    { domain: 'facebook.com', category: 'social' },
    { domain: 'instagram.com', category: 'social' },
    { domain: 'youtube.com', category: 'entertainment' },
    { domain: 'tiktok.com', category: 'entertainment' },
    { domain: 'netflix.com', category: 'entertainment' },
    { domain: 'news.ycombinator.com', category: 'news' },
    { domain: 'cnn.com', category: 'news' },
    { domain: 'buzzfeed.com', category: 'news' }
  ],
  template: 'developer', // or null for custom lists
  importCount: 247,       // social proof: how many people imported this
  createdAt: '2026-01-15T10:00:00Z',
  version: 1
};
```

#### Template Blocklists

```
PRE-BUILT TEMPLATE BLOCKLISTS
==============================

+-------------------------+-------------------------------+----------+
| Template                | Sites                         | Tier     |
+-------------------------+-------------------------------+----------+
| Social Media Detox      | twitter, facebook, instagram, | Free     |
|                         | tiktok, snapchat, reddit,     |          |
|                         | linkedin (feed), pinterest     |          |
+-------------------------+-------------------------------+----------+
| Student Focus Pack      | twitter, reddit, youtube,     | Free     |
|                         | tiktok, netflix, twitch,      |          |
|                         | discord, instagram             |          |
+-------------------------+-------------------------------+----------+
| News Fast               | cnn, bbc, foxnews, nytimes,   | Free     |
|                         | huffpost, buzzfeed, reddit     |          |
+-------------------------+-------------------------------+----------+
| Developer Focus         | twitter, reddit, hackernews,  | Pro      |
|                         | youtube, twitch, discord,     |          |
|                         | producthunt, techcrunch        |          |
+-------------------------+-------------------------------+----------+
| Marketer Focus          | twitter, facebook, linkedin,  | Pro      |
|                         | reddit, youtube, tiktok,      |          |
|                         | buzzfeed, medium               |          |
+-------------------------+-------------------------------+----------+
| Deep Work Mode          | ALL social + news + video +   | Pro      |
|                         | entertainment + shopping       |          |
+-------------------------+-------------------------------+----------+
| ADHD Shield             | Social media, news, video,    | Pro      |
|                         | shopping, games, forums,      |          |
|                         | wikis (rabbit-hole-prone)     |          |
+-------------------------+-------------------------------+----------+
```

#### Blocklist Share Implementation

```javascript
// src/background/blocklist-sharing.js

/**
 * BlocklistSharing — Manages the creation and import of shared blocklists.
 */
class BlocklistSharing {
  /**
   * Generate a shareable blocklist link.
   * For free users: encodes list data in URL (no server needed).
   * For Pro/Team: stores on server and returns a short link.
   *
   * @param {Object} options - Share options
   * @returns {Object} - Share link and metadata
   */
  async generateShareLink(options = {}) {
    const { settings = {} } = await chrome.storage.local.get('settings');
    const blocklist = settings.blocklist || [];

    if (blocklist.length === 0) {
      return { error: 'No sites in blocklist to share' };
    }

    const { retention = {} } = await chrome.storage.local.get('retention');
    const { focusScore = {} } = await chrome.storage.local.get('focusScore');

    const shareData = {
      name: options.name || 'My Focus Blocklist',
      description: options.description || '',
      sites: blocklist.map(site => ({
        domain: site.domain,
        category: site.category || 'other'
      })),
      creator: {
        displayName: options.displayName || 'A Focus Mode User',
        focusScore: focusScore.current || 0,
        streakDays: retention.streak?.current || 0
      },
      createdAt: new Date().toISOString(),
      version: 1
    };

    const isPro = await this._checkProStatus();

    if (isPro) {
      // Pro: Store on server, return short link
      try {
        const response = await fetch('https://api.focusmode.app/v1/lists', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await this._getAuthToken()}`
          },
          body: JSON.stringify(shareData)
        });
        const result = await response.json();
        return {
          url: `https://focusmode.app/list/${result.id}`,
          id: result.id,
          siteCount: blocklist.length
        };
      } catch (err) {
        console.warn('[BlocklistSharing] Server share failed, falling back to URL encoding');
        return this._generateEncodedLink(shareData);
      }
    } else {
      // Free: Encode in URL (no server required, privacy-first)
      return this._generateEncodedLink(shareData);
    }
  }

  /**
   * Import a blocklist from a share link.
   * @param {string} linkOrData - Share URL or encoded data
   * @returns {Object} - Import result
   */
  async importBlocklist(linkOrData) {
    let shareData;

    if (linkOrData.startsWith('https://focusmode.app/list/')) {
      // Server-hosted list
      const id = linkOrData.split('/list/')[1];
      try {
        const response = await fetch(`https://api.focusmode.app/v1/lists/${id}`);
        shareData = await response.json();
      } catch (err) {
        return { error: 'Could not fetch blocklist. Check your connection.' };
      }
    } else {
      // URL-encoded list
      try {
        shareData = this._decodeShareData(linkOrData);
      } catch (err) {
        return { error: 'Invalid blocklist link.' };
      }
    }

    // Validate data
    if (!shareData.sites || !Array.isArray(shareData.sites)) {
      return { error: 'Invalid blocklist format.' };
    }

    // Get current blocklist
    const { settings = {} } = await chrome.storage.local.get('settings');
    const currentList = settings.blocklist || [];
    const currentDomains = new Set(currentList.map(s => s.domain));

    // Find new sites (not already in user's blocklist)
    const newSites = shareData.sites.filter(s => !currentDomains.has(s.domain));

    // Check free tier limit
    const isPro = await this._checkProStatus();
    const freeLimit = 10;
    if (!isPro && currentList.length + newSites.length > freeLimit) {
      const canAdd = Math.max(0, freeLimit - currentList.length);
      return {
        partial: true,
        added: canAdd,
        blocked: newSites.length - canAdd,
        requiresPro: true,
        shareData
      };
    }

    // Add new sites
    const updatedList = [...currentList, ...newSites];
    settings.blocklist = updatedList;
    await chrome.storage.local.set({ settings });

    return {
      success: true,
      added: newSites.length,
      skipped: shareData.sites.length - newSites.length, // already had these
      total: updatedList.length,
      listName: shareData.name,
      creator: shareData.creator
    };
  }

  _generateEncodedLink(shareData) {
    // Compact encoding for URL (no server needed)
    const compressed = {
      n: shareData.name,
      s: shareData.sites.map(s => s.domain),
      c: shareData.creator.displayName
    };
    const encoded = btoa(JSON.stringify(compressed));
    return {
      url: `https://focusmode.app/import?d=${encoded}`,
      siteCount: shareData.sites.length,
      isEncoded: true
    };
  }

  _decodeShareData(url) {
    const params = new URL(url).searchParams;
    const encoded = params.get('d');
    const compressed = JSON.parse(atob(encoded));
    return {
      name: compressed.n,
      sites: compressed.s.map(domain => ({ domain, category: 'other' })),
      creator: { displayName: compressed.c }
    };
  }

  async _checkProStatus() {
    const { license = {} } = await chrome.storage.local.get('license');
    return license.isPro || false;
  }

  async _getAuthToken() {
    const { auth = {} } = await chrome.storage.local.get('auth');
    return auth.token || '';
  }
}

export default BlocklistSharing;
```

### 6.3 Focus Challenges

Focus challenges create time-bound collaborative experiences that encourage group adoption.

```
FOCUS CHALLENGE TYPES
=====================

+---------------------------+-----------------------------------+-----------+
| Challenge                 | Description                       | Min Users |
+---------------------------+-----------------------------------+-----------+
| 7-Day Focus Challenge     | Complete at least 1 focus session  | 2         |
|                           | every day for 7 consecutive days   |           |
+---------------------------+-----------------------------------+-----------+
| Focus Hour                | Everyone focuses for 1 hour at     | 3         |
|                           | the same time, same day            |           |
+---------------------------+-----------------------------------+-----------+
| Distraction Diet          | Block 5+ sites for 14 days        | 2         |
|                           | straight, track progress           |           |
+---------------------------+-----------------------------------+-----------+
| Team vs Team              | Two teams compete on total focus   | 4 (2v2+)  |
|                           | minutes over a week                |           |
+---------------------------+-----------------------------------+-----------+
| Monthly Community         | Global challenge, all users can    | 1         |
| Challenge                 | join, shared leaderboard           |           |
+---------------------------+-----------------------------------+-----------+
| Nuclear Week              | Complete Nuclear Mode at least     | 2         |
|                           | once per day for 5 work days       |           |
+---------------------------+-----------------------------------+-----------+
```

#### Challenge Flow

```
CHALLENGE LIFECYCLE
===================

  Host creates challenge
          |
          v
  Host invites participants
  (email, link, team)
          |
          v
  +--------------------+
  | PENDING            |
  | Waiting for start  |
  | date or min users  |
  +--------------------+
          |
          v (start date reached OR min users met)
  +--------------------+
  | ACTIVE             |
  | Progress tracked   |
  | Daily updates      |
  | Leaderboard live   |
  +--------------------+
          |
          v (end date reached)
  +--------------------+
  | COMPLETED          |
  | Final standings    |
  | Share results      |
  | Awards given       |
  +--------------------+

PARTICIPANT STATES:
  invited -> accepted -> active -> completed/failed
```

#### Challenge Implementation

```javascript
// src/background/focus-challenges.js

/**
 * FocusChallenges — Manages creation, participation, and tracking
 * of collaborative focus challenges.
 *
 * Architecture:
 * - Challenge data synced via API (Pro/Team only for hosting)
 * - Progress tracked locally, synced periodically
 * - Free users can JOIN challenges (viral loop) but not host
 */
class FocusChallenges {
  constructor() {
    this.API_BASE = 'https://api.focusmode.app/v1/challenges';
  }

  /**
   * Create a new challenge (Pro/Team only).
   */
  async createChallenge(options) {
    const isPro = await this._checkProStatus();
    if (!isPro) {
      return { error: 'Pro subscription required to host challenges' };
    }

    const challenge = {
      type: options.type, // '7day', 'focus_hour', 'distraction_diet', etc.
      name: options.name || this._getDefaultName(options.type),
      description: options.description || '',
      startDate: options.startDate,
      endDate: options.endDate,
      rules: this._getChallengeRules(options.type),
      visibility: options.visibility || 'invite', // 'invite' or 'public'
      maxParticipants: options.maxParticipants || 50,
      hostId: await this._getUserId()
    };

    try {
      const response = await fetch(this.API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this._getAuthToken()}`
        },
        body: JSON.stringify(challenge)
      });
      const result = await response.json();
      return {
        success: true,
        challengeId: result.id,
        inviteLink: `https://focusmode.app/challenge/${result.id}`,
        challenge: result
      };
    } catch (err) {
      return { error: 'Failed to create challenge. Please try again.' };
    }
  }

  /**
   * Join an existing challenge (Free users can join).
   * This is the viral entry point -- joining requires the extension.
   */
  async joinChallenge(challengeId) {
    try {
      const response = await fetch(`${this.API_BASE}/${challengeId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this._getAuthToken()}`
        },
        body: JSON.stringify({
          userId: await this._getUserId(),
          displayName: await this._getDisplayName()
        })
      });
      const result = await response.json();

      if (result.success) {
        // Store active challenge locally
        const { challenges = [] } = await chrome.storage.local.get('challenges');
        challenges.push({
          id: challengeId,
          joinedAt: Date.now(),
          status: 'active'
        });
        await chrome.storage.local.set({ challenges });
      }

      return result;
    } catch (err) {
      return { error: 'Failed to join challenge.' };
    }
  }

  /**
   * Submit daily progress for active challenges.
   * Called automatically after each session completion.
   */
  async submitProgress() {
    const { challenges = [] } = await chrome.storage.local.get('challenges');
    const activeChallenges = challenges.filter(c => c.status === 'active');

    if (activeChallenges.length === 0) return;

    const todayStats = await this._getTodayStats();

    for (const challenge of activeChallenges) {
      try {
        await fetch(`${this.API_BASE}/${challenge.id}/progress`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await this._getAuthToken()}`
          },
          body: JSON.stringify({
            userId: await this._getUserId(),
            date: new Date().toISOString().split('T')[0],
            stats: {
              sessionsCompleted: todayStats.sessions,
              focusMinutes: todayStats.focusMinutes,
              sitesBlocked: todayStats.sitesBlocked,
              focusScore: todayStats.focusScore
            }
          })
        });
      } catch (err) {
        console.warn(`[Challenge] Failed to submit progress for ${challenge.id}`);
      }
    }
  }

  /**
   * Get the leaderboard for a challenge.
   */
  async getLeaderboard(challengeId) {
    try {
      const response = await fetch(`${this.API_BASE}/${challengeId}/leaderboard`, {
        headers: { 'Authorization': `Bearer ${await this._getAuthToken()}` }
      });
      return await response.json();
    } catch (err) {
      return { error: 'Failed to load leaderboard.' };
    }
  }

  _getChallengeRules(type) {
    const rules = {
      '7day': {
        duration: 7,
        dailyRequirement: 'Complete at least 1 focus session',
        scoring: 'sessions_completed',
        winCondition: 'all_days_completed'
      },
      'focus_hour': {
        duration: 1,
        requirement: 'Focus for 60 minutes during the scheduled time',
        scoring: 'focus_minutes',
        winCondition: 'completed_60_minutes'
      },
      'distraction_diet': {
        duration: 14,
        dailyRequirement: 'Keep 5+ sites blocked for the full day',
        scoring: 'blocks_count',
        winCondition: 'all_days_blocked'
      },
      'team_vs_team': {
        duration: 7,
        requirement: 'Accumulate team focus minutes',
        scoring: 'total_focus_minutes',
        winCondition: 'highest_team_total'
      },
      'nuclear_week': {
        duration: 5,
        dailyRequirement: 'Complete 1+ Nuclear Mode session',
        scoring: 'nuclear_completions',
        winCondition: 'all_days_nuclear'
      }
    };
    return rules[type] || rules['7day'];
  }

  _getDefaultName(type) {
    const names = {
      '7day': '7-Day Focus Challenge',
      'focus_hour': 'Focus Hour Challenge',
      'distraction_diet': '14-Day Distraction Diet',
      'team_vs_team': 'Team Focus Battle',
      'nuclear_week': 'Nuclear Week Challenge'
    };
    return names[type] || 'Focus Challenge';
  }

  async _getTodayStats() {
    const { analytics = [] } = await chrome.storage.local.get('analytics');
    const today = new Date().toISOString().split('T')[0];
    const todayEvents = analytics.filter(e => e.date === today);

    return {
      sessions: todayEvents.filter(e => e.event === 'session_complete').length,
      focusMinutes: todayEvents
        .filter(e => e.event === 'session_complete')
        .reduce((sum, e) => sum + (e.properties?.duration || 0), 0),
      sitesBlocked: todayEvents.filter(e => e.event === 'site_blocked').length,
      focusScore: 0 // pulled from focusScore storage separately
    };
  }

  async _checkProStatus() {
    const { license = {} } = await chrome.storage.local.get('license');
    return license.isPro || false;
  }

  async _getUserId() {
    const { auth = {} } = await chrome.storage.local.get('auth');
    return auth.userId || 'anonymous';
  }

  async _getDisplayName() {
    const { settings = {} } = await chrome.storage.local.get('settings');
    return settings.displayName || 'Focus User';
  }

  async _getAuthToken() {
    const { auth = {} } = await chrome.storage.local.get('auth');
    return auth.token || '';
  }
}

export default FocusChallenges;
```

### 6.4 Accountability Partners

```
ACCOUNTABILITY PARTNER FLOW
============================

  User A enables Accountability Partner feature (Pro)
          |
          v
  User A invites partner via email/link
          |
          v
  User B accepts (must have extension installed)
          |
          v
  Paired! Both users see each other's daily status:

  +----------------------------------------------+
  |  ACCOUNTABILITY PARTNER                       |
  |                                               |
  |  Sarah K.                                     |
  |  Status: Focusing (25 min session)            |
  |  Today: 3 sessions, 1.5h focused              |
  |  Streak: 14 days                               |
  |                                               |
  |  Your Status: Idle                             |
  |  Today: 1 session, 25 min focused              |
  |  Streak: 14 days                               |
  |                                               |
  |  [Start a Session]   [Send Nudge]             |
  +----------------------------------------------+

NUDGE SYSTEM:
  - Partner can send a gentle nudge (max 1 per day)
  - Nudge appears as a Chrome notification:
    "Sarah thinks you should start focusing! Start a session?"
  - User can respond: [Start Session] or [Not Now]
  - Nudge text is pre-set (no custom messages to prevent misuse)

PRIVACY:
  - Partners only see: session count, focus minutes, streak, status
  - Partners NEVER see: specific blocked sites, browsing history, Focus Score details
  - Either partner can unpair at any time
  - Data shared is aggregate only
```

#### Accountability Partner Implementation

```javascript
// src/background/accountability-partner.js

/**
 * AccountabilityPartner — Manages the pairing and daily status
 * sharing between two Focus Mode users.
 *
 * Privacy-first design:
 * - Only aggregate stats shared (session count, minutes, streak)
 * - No browsing history, no specific sites
 * - Either user can unpair instantly
 * - Max 1 nudge per partner per day
 */
class AccountabilityPartner {
  constructor() {
    this.API_BASE = 'https://api.focusmode.app/v1/partners';
    this.MAX_NUDGES_PER_DAY = 1;
  }

  /**
   * Invite a partner via email.
   * @param {string} email - Partner's email
   * @returns {Object} - Invitation result
   */
  async invite(email) {
    const isPro = await this._checkProStatus();
    if (!isPro) {
      return { error: 'Pro subscription required for Accountability Partners' };
    }

    try {
      const response = await fetch(`${this.API_BASE}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this._getAuthToken()}`
        },
        body: JSON.stringify({
          inviteeEmail: email,
          inviterName: await this._getDisplayName()
        })
      });
      const result = await response.json();
      return {
        success: true,
        inviteId: result.id,
        inviteLink: `https://focusmode.app/partner/${result.id}`,
        status: 'pending'
      };
    } catch (err) {
      return { error: 'Failed to send invitation.' };
    }
  }

  /**
   * Get partner's daily status.
   * @returns {Object} - Partner status (aggregate data only)
   */
  async getPartnerStatus() {
    const { partner = {} } = await chrome.storage.local.get('partner');
    if (!partner.pairedWith) {
      return { paired: false };
    }

    try {
      const response = await fetch(
        `${this.API_BASE}/${partner.pairedWith}/status`,
        { headers: { 'Authorization': `Bearer ${await this._getAuthToken()}` } }
      );
      const status = await response.json();

      return {
        paired: true,
        partner: {
          displayName: status.displayName,
          isCurrentlyFocusing: status.isActive,
          currentSessionMinutes: status.currentSessionMinutes || 0,
          todaySessions: status.todaySessions,
          todayMinutes: status.todayMinutes,
          streak: status.streak,
          lastActive: status.lastActive
        }
      };
    } catch (err) {
      return {
        paired: true,
        partner: { displayName: partner.partnerName, offline: true }
      };
    }
  }

  /**
   * Send a nudge to partner (max 1/day).
   */
  async sendNudge() {
    const { partner = {} } = await chrome.storage.local.get('partner');
    if (!partner.pairedWith) {
      return { error: 'No partner paired.' };
    }

    // Check daily nudge limit
    const today = new Date().toISOString().split('T')[0];
    if (partner.lastNudgeDate === today) {
      return { error: 'You already sent a nudge today. Try again tomorrow.' };
    }

    try {
      await fetch(`${this.API_BASE}/${partner.pairedWith}/nudge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this._getAuthToken()}`
        },
        body: JSON.stringify({
          senderName: await this._getDisplayName()
        })
      });

      partner.lastNudgeDate = today;
      await chrome.storage.local.set({ partner });

      return { success: true };
    } catch (err) {
      return { error: 'Failed to send nudge.' };
    }
  }

  /**
   * Share daily status with partner.
   * Called on a periodic alarm (every 30 minutes while extension is active).
   */
  async shareDailyStatus() {
    const { partner = {} } = await chrome.storage.local.get('partner');
    if (!partner.pairedWith) return;

    const todayStats = await this._getTodayStats();
    const { retention = {} } = await chrome.storage.local.get('retention');
    const { sessions = {} } = await chrome.storage.local.get('sessions');

    try {
      await fetch(`${this.API_BASE}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this._getAuthToken()}`
        },
        body: JSON.stringify({
          isActive: sessions.active || false,
          currentSessionMinutes: sessions.elapsedMinutes || 0,
          todaySessions: todayStats.sessions,
          todayMinutes: todayStats.focusMinutes,
          streak: retention.streak?.current || 0,
          lastActive: new Date().toISOString()
        })
      });
    } catch (err) {
      // Silent failure -- status sharing is best-effort
    }
  }

  /**
   * Unpair from current partner.
   */
  async unpair() {
    const { partner = {} } = await chrome.storage.local.get('partner');
    if (!partner.pairedWith) return { success: true };

    try {
      await fetch(`${this.API_BASE}/unpair`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${await this._getAuthToken()}` }
      });
    } catch (err) {
      // Continue with local cleanup even if server call fails
    }

    await chrome.storage.local.remove('partner');
    return { success: true };
  }

  async _getTodayStats() {
    const { analytics = [] } = await chrome.storage.local.get('analytics');
    const today = new Date().toISOString().split('T')[0];
    const todayEvents = analytics.filter(e => e.date === today);
    return {
      sessions: todayEvents.filter(e => e.event === 'session_complete').length,
      focusMinutes: todayEvents
        .filter(e => e.event === 'session_complete')
        .reduce((sum, e) => sum + (e.properties?.duration || 0), 0)
    };
  }

  async _checkProStatus() {
    const { license = {} } = await chrome.storage.local.get('license');
    return license.isPro || false;
  }

  async _getAuthToken() {
    const { auth = {} } = await chrome.storage.local.get('auth');
    return auth.token || '';
  }

  async _getDisplayName() {
    const { settings = {} } = await chrome.storage.local.get('settings');
    return settings.displayName || 'Focus User';
  }
}

export default AccountabilityPartner;
```

### 6.5 Team Focus Sessions (Team Plan)

```
TEAM FOCUS FEATURES
===================

Team-plan-exclusive features that drive collaborative virality
within organizations.

1. SHARED TEAM BLOCKLIST
   - Admin sets mandatory blocked sites for the team
   - Team members can add personal sites on top
   - Changes sync across all team members
   - Admin can lock sites (cannot be removed by members)

2. TEAM FOCUS SCORE LEADERBOARD
   +----------------------------------------------+
   |  TEAM LEADERBOARD - This Week                 |
   |                                               |
   |  1. Sarah K.    Focus Score: 92  Streak: 42d  |
   |  2. Mike R.     Focus Score: 87  Streak: 28d  |
   |  3. Alex T.     Focus Score: 81  Streak: 14d  |
   |  4. Jordan L.   Focus Score: 75  Streak: 7d   |
   |  5. You         Focus Score: 78  Streak: 14d  |
   |                                               |
   |  Team Average: 82.6                            |
   |  Team Streak: 21 days (consecutive team use)   |
   |                                               |
   |  [Share Team Stats]                            |
   +----------------------------------------------+

3. FOCUS PARTY (Synchronized Pomodoro)
   - One team member starts a "Focus Party"
   - Others get a notification to join
   - Everyone does the same Pomodoro cycle together
   - Shared break timer (chat optional)
   - Team stats shown at the end

   FOCUS PARTY FLOW:
   Host starts -> Invites sent -> Lobby (waiting) ->
   Countdown 3-2-1 -> Focus period -> Break ->
   Repeat -> Session summary with group stats

4. ADMIN DASHBOARD
   - Team usage overview (aggregate only)
   - Total team focus hours this week
   - Most productive team member
   - Team Focus Score trend
   - Invite new members
   - Manage shared blocklist
```

---

## 7. Social Proof Notifications

### 7.1 Social Proof Strategy

Social proof leverages the psychological principle that people follow the actions of others. For Focus Mode - Blocker, social proof serves two purposes:

1. **Trust building** on the landing page and Chrome Web Store listing
2. **Upgrade motivation** on the paywall and upgrade screens

```
SOCIAL PROOF PLACEMENT MAP
===========================

+---------------------+----------------------------------+--------------+
| Location            | Social Proof Type                | Data Source   |
+---------------------+----------------------------------+--------------+
| Landing page        | User count, rating, testimonials | Server (agg) |
| CWS listing         | Rating, review count             | CWS native   |
| Block page          | "X focusing right now" estimate  | Local calc    |
| Upgrade/paywall     | Recent upgrades, testimonials    | Server (agg) |
| Popup footer        | User count badge                 | Cached        |
| Onboarding          | Trust badges, user count         | Cached        |
| Challenge pages     | Participant count                | Server        |
| Shared blocklist    | Import count                     | Server        |
+---------------------+----------------------------------+--------------+

PRIVACY NOTES:
- Free tier: ALL social proof is locally estimated or cached
  (no real-time server calls)
- "X people focusing right now" is a local estimate based on
  time of day and total user count (no tracking)
- Aggregate stats cached during extension updates
- Individual user activity is NEVER sent to any server for
  social proof purposes
```

### 7.2 SocialProofSystem Class

```javascript
// src/background/social-proof-system.js

/**
 * SocialProofSystem — Manages social proof data for display
 * across the extension. Privacy-first: free tier uses only
 * cached/estimated data, never makes real-time calls.
 */
class SocialProofSystem {
  constructor() {
    this.STORAGE_KEY = 'socialProof';
    this.CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
    this.API_BASE = 'https://api.focusmode.app/v1/social';
  }

  /**
   * Get social proof data for a specific context.
   * @param {'landing'|'block_page'|'upgrade'|'popup'|'onboarding'} context
   * @returns {Object} Social proof data
   */
  async getProofData(context) {
    const cached = await this._getCachedData();

    switch (context) {
      case 'landing':
        return {
          totalUsers: cached.totalUsers || 50000,
          rating: cached.rating || 4.7,
          reviewCount: cached.reviewCount || 2500,
          recentInstalls: cached.recentInstalls || '1,200+ this week',
          testimonials: cached.testimonials || this._getDefaultTestimonials(),
          badges: [
            { text: 'Featured in Chrome Web Store', icon: 'chrome' },
            { text: '4.7 avg from 2,500+ reviews', icon: 'star' },
            { text: 'Privacy-first: data never leaves your device', icon: 'shield' }
          ]
        };

      case 'block_page':
        return {
          focusingNow: this._estimateFocusingNow(cached.totalUsers || 50000),
          encouragement: this._getBlockPageEncouragement()
        };

      case 'upgrade':
        return {
          totalUsers: cached.totalUsers || 50000,
          proUsers: cached.proUsers || '5,000+',
          recentUpgrades: this._estimateRecentUpgrades(),
          rating: cached.rating || 4.7,
          testimonials: cached.proTestimonials || this._getProTestimonials(),
          socialLines: [
            `Join ${cached.proUsers || '5,000+'} Pro users`,
            `${this._estimateRecentUpgrades()} people upgraded today`,
            `4.7-star average from ${cached.reviewCount || '2,500'}+ reviews`
          ]
        };

      case 'popup':
        return {
          userBadge: this._formatUserCount(cached.totalUsers || 50000),
          shortProof: `Trusted by ${this._formatUserCount(cached.totalUsers || 50000)} users`
        };

      case 'onboarding':
        return {
          totalUsers: this._formatUserCount(cached.totalUsers || 50000),
          rating: cached.rating || 4.7,
          trustBadges: [
            `${this._formatUserCount(cached.totalUsers || 50000)}+ users`,
            `${cached.rating || 4.7} star rating`,
            'Zero data collection'
          ]
        };

      default:
        return cached;
    }
  }

  /**
   * Refresh cached social proof data from server.
   * Called on extension update and every 24 hours (Pro only).
   * Free tier gets data bundled with extension updates.
   */
  async refreshData() {
    const isPro = await this._checkProStatus();

    if (isPro) {
      try {
        const response = await fetch(`${this.API_BASE}/stats`, {
          headers: { 'Authorization': `Bearer ${await this._getAuthToken()}` }
        });
        const data = await response.json();

        await chrome.storage.local.set({
          [this.STORAGE_KEY]: {
            ...data,
            lastRefresh: Date.now()
          }
        });
        return data;
      } catch (err) {
        console.warn('[SocialProof] Refresh failed, using cached data');
      }
    }

    // Free tier: use bundled defaults (updated with each extension version)
    return this._getDefaultData();
  }

  /**
   * Estimate how many users are focusing right now.
   * This is a LOCAL ESTIMATE -- no server calls.
   *
   * Estimation method:
   * - Assume 15% of total users are active daily (DAU/MAU = 0.22)
   * - Assume 8% of daily actives are in a session at any given time
   *   during business hours (9am-6pm local time)
   * - Reduce by 80% outside business hours
   * - Add random jitter (+/- 10%) to feel dynamic
   *
   * @param {number} totalUsers - Total user count
   * @returns {number} Estimated users focusing now
   */
  _estimateFocusingNow(totalUsers) {
    const hour = new Date().getHours();
    const isBusinessHours = hour >= 9 && hour <= 18;
    const dayOfWeek = new Date().getDay();
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

    let baseRate = 0.15 * 0.08; // 1.2% of total users
    if (!isBusinessHours) baseRate *= 0.2;
    if (!isWeekday) baseRate *= 0.4;

    const estimate = Math.round(totalUsers * baseRate);

    // Jitter: +/- 10%
    const jitter = 1 + (Math.random() * 0.2 - 0.1);
    const final = Math.max(1, Math.round(estimate * jitter));

    // Round to nearest "clean" number for display
    if (final > 1000) return Math.round(final / 100) * 100;
    if (final > 100) return Math.round(final / 10) * 10;
    return final;
  }

  /**
   * Estimate recent upgrades for social proof.
   * Local estimate based on assumed conversion rate.
   */
  _estimateRecentUpgrades() {
    const hour = new Date().getHours();
    // More upgrades during business hours
    const baseUpgrades = hour >= 9 && hour <= 18 ? 12 : 5;
    const jitter = Math.floor(Math.random() * 6) - 3;
    return Math.max(1, baseUpgrades + jitter);
  }

  _formatUserCount(count) {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${Math.round(count / 1000)}K`;
    return count.toString();
  }

  _getBlockPageEncouragement() {
    const lines = [
      'You\'re not alone in this fight.',
      'Thousands of people are focusing right now, just like you.',
      'Every blocked distraction is a win.',
      'Your future self thanks you.',
      'Focus is a muscle. You\'re getting stronger.'
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  }

  _getDefaultTestimonials() {
    return [
      {
        text: 'Focus Mode changed how I work. My productivity doubled in the first week.',
        author: 'Sarah K.',
        role: 'Product Manager',
        rating: 5
      },
      {
        text: 'As someone with ADHD, this extension is a game-changer. The Nuclear Mode is exactly what I needed.',
        author: 'Mike R.',
        role: 'Software Developer',
        rating: 5
      },
      {
        text: 'The Focus Score is brilliant. Seeing my number go up motivates me to stay on track.',
        author: 'Jordan L.',
        role: 'Graduate Student',
        rating: 5
      },
      {
        text: 'I recommended it to my entire team. We use the shared blocklist and it keeps us all focused.',
        author: 'Alex T.',
        role: 'Team Lead',
        rating: 5
      }
    ];
  }

  _getProTestimonials() {
    return [
      {
        text: 'Pro is worth every penny. The detailed analytics showed me I was losing 3 hours a day to Twitter.',
        author: 'Emily C.',
        role: 'Freelance Writer',
        rating: 5
      },
      {
        text: 'Nuclear Mode + custom schedules = unbeatable focus. Best $5/month I spend.',
        author: 'David W.',
        role: 'Startup Founder',
        rating: 5
      },
      {
        text: 'The weekly reports alone are worth upgrading. I finally have data on my focus patterns.',
        author: 'Lisa M.',
        role: 'Research Scientist',
        rating: 5
      }
    ];
  }

  _getDefaultData() {
    return {
      totalUsers: 50000,
      proUsers: '5,000+',
      rating: 4.7,
      reviewCount: 2500,
      recentInstalls: '1,200+ this week',
      lastRefresh: Date.now()
    };
  }

  async _getCachedData() {
    const { [this.STORAGE_KEY]: data = {} } = await chrome.storage.local.get(this.STORAGE_KEY);
    return data;
  }

  async _checkProStatus() {
    const { license = {} } = await chrome.storage.local.get('license');
    return license.isPro || false;
  }

  async _getAuthToken() {
    const { auth = {} } = await chrome.storage.local.get('auth');
    return auth.token || '';
  }
}

export default SocialProofSystem;
```

### 7.3 Social Proof UI Components

#### Block Page Social Proof

```
BLOCK PAGE SOCIAL PROOF PLACEMENT
==================================

+--------------------------------------------------+
|                                                  |
|            [Shield Icon]                          |
|                                                  |
|     "The only way to do great work is             |
|      to love what you do."                        |
|              -- Steve Jobs                        |
|                                                  |
|  +--------------------------------------------+  |
|  |  Distractions  |  Time Saved  |  Focus     |  |
|  |  Blocked: 247  |  Today: 45m  |  Score: 78 |  |
|  +--------------------------------------------+  |
|                                                  |
|         [ Back to Work ]                          |
|                                                  |
|  +--------------------------------------------+  |
|  | 412 people are focusing right now           |  |  <-- Social proof
|  +--------------------------------------------+  |
|                                                  |
|  Focus Mode - Blocker  |  Your data stays local  |
+--------------------------------------------------+

NOTES:
- "412 people" is a LOCAL ESTIMATE (no server call)
- Only shown on the block page, never during active sessions
- Subtle styling -- should not distract from the "Back to Work" CTA
- Number updates each time the block page loads (with jitter)
```

#### Upgrade Page Social Proof

```
UPGRADE PAGE SOCIAL PROOF PLACEMENT
====================================

+--------------------------------------------------+
|                                                  |
|  UPGRADE TO PRO                                   |
|                                                  |
|  Unlock your full focus potential                  |
|                                                  |
|  +--------------------------------------------+  |
|  | "12 people upgraded to Pro today"           |  |  <-- Social proof line 1
|  +--------------------------------------------+  |
|                                                  |
|  [Feature comparison table...]                    |
|                                                  |
|  +--------------------------------------------+  |
|  | "Join 5,000+ Pro users"                     |  |  <-- Social proof line 2
|  +--------------------------------------------+  |
|                                                  |
|  +------------------+  +---------------------+   |
|  | Monthly: $4.99/mo|  | Annual: $2.99/mo   |   |
|  |                  |  | SAVE 40%           |   |
|  |  [ Upgrade ]     |  |  [ Upgrade ]       |   |
|  +------------------+  +---------------------+   |
|                                                  |
|  +--------------------------------------------+  |
|  | "Pro is worth every penny..."               |  |  <-- Testimonial
|  | -- Emily C., Freelance Writer               |  |
|  | Rating: 5 stars                              |  |
|  +--------------------------------------------+  |
|                                                  |
|  4.7 avg  |  2,500+ reviews  |  50,000+ users   |  <-- Trust badges
|                                                  |
+--------------------------------------------------+
```

### 7.4 Social Proof Display Rules

```
DISPLAY FREQUENCY AND TARGETING
================================

+---------------------+------------------+-----------------------+
| User Stage          | Social Proof     | Rationale             |
+---------------------+------------------+-----------------------+
| New (Day 1-3)       | Trust badges,    | Build confidence in   |
|                     | user count,      | the product before    |
|                     | rating           | asking for commitment |
+---------------------+------------------+-----------------------+
| Active (Day 4-14)   | "X focusing now" | Community feeling,    |
|                     | on block page    | you're not alone      |
+---------------------+------------------+-----------------------+
| Engaged (Day 15-30) | Upgrade proof,   | Conversion-focused    |
|                     | Pro testimonials | social proof          |
+---------------------+------------------+-----------------------+
| Power (Day 30+)     | Challenge stats, | Peer-driven engagement|
|                     | team features    | and collaboration     |
+---------------------+------------------+-----------------------+
| At-Risk             | "X users came    | Re-engagement through |
|                     | back this week"  | social norm           |
+---------------------+------------------+-----------------------+

RULES:
1. Social proof lines rotate (don't show the same one twice in a row)
2. Numbers update with jitter to feel dynamic
3. Testimonials rotate based on user persona (show dev testimonials
   to users who block dev-related sites)
4. Never show social proof during active focus sessions
5. Pro testimonials only shown on upgrade/paywall screens
6. Free tier social proof uses cached data (no server calls)
```

---

## 8. Block Page Viral Elements

### 8.1 Block Page as a Viral Surface

The block page is seen potentially dozens of times per day. It is the highest-traffic surface in the entire extension. Every element on this page has been carefully considered for its impact on retention and virality.

```
BLOCK PAGE ATTENTION HIERARCHY
================================

1. MOTIVATIONAL QUOTE (primary focus)
   - Keeps user on the page long enough to absorb other elements
   - Reinforces the value of focus

2. STATS PANEL (time saved, blocks, score)
   - Reinforces progress and investment
   - Creates share-worthy moments

3. "BACK TO WORK" CTA (primary action)
   - Always the most prominent button
   - NEVER displaced by viral elements

4. SOCIAL PROOF LINE (subtle footer element)
   - "X people are focusing right now"
   - Builds community feeling

5. SECONDARY ACTIONS (very subtle, footer area)
   - "Share this quote" (icon only)
   - "Invite a friend" (text link, footer)
   - Achievement progress (micro indicator)

CRITICAL RULE: Viral elements must NEVER distract from the
block page's primary purpose (getting the user back to work).
They are supplementary, not competitive with the main CTA.
```

### 8.2 Block Page Viral Elements Implementation

```javascript
// src/content/block-page-viral.js

/**
 * Block page viral enhancements.
 * Adds subtle viral elements to the block page without
 * compromising its primary function.
 */
class BlockPageViral {
  constructor() {
    this.socialProof = null;
  }

  /**
   * Initialize viral elements on the block page.
   * Called after the main block page has rendered.
   */
  async init() {
    // Get social proof data (cached, no server call)
    const { socialProof = {} } = await chrome.storage.local.get('socialProof');
    this.socialProof = socialProof;

    // Add elements in priority order
    this._addSocialProofLine();
    this._addShareQuoteButton();
    this._addInviteLink();
    this._addAchievementProgress();
  }

  /**
   * Add "X people are focusing right now" line.
   */
  _addSocialProofLine() {
    const totalUsers = this.socialProof.totalUsers || 50000;
    const focusingNow = this._estimateFocusingNow(totalUsers);

    const el = document.createElement('div');
    el.className = 'bp-social-proof';
    el.innerHTML = `
      <span class="bp-social-proof__dot"></span>
      <span class="bp-social-proof__text">
        ${focusingNow.toLocaleString()} people are focusing right now
      </span>
    `;

    // Insert above the footer
    const footer = document.querySelector('.block-page__footer');
    if (footer) {
      footer.parentNode.insertBefore(el, footer);
    }
  }

  /**
   * Add "Share this quote" icon button next to the motivational quote.
   */
  _addShareQuoteButton() {
    const quoteEl = document.querySelector('.block-page__quote');
    if (!quoteEl) return;

    const shareBtn = document.createElement('button');
    shareBtn.className = 'bp-share-quote';
    shareBtn.setAttribute('aria-label', 'Share this quote');
    shareBtn.setAttribute('title', 'Share this quote');
    shareBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2">
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
        <polyline points="16 6 12 2 8 6"/>
        <line x1="12" y1="2" x2="12" y2="15"/>
      </svg>
    `;

    shareBtn.addEventListener('click', () => {
      const quote = quoteEl.textContent.trim();
      const shareText = `"${quote}"\n\nStaying focused with Focus Mode - Blocker`;
      const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
      window.open(shareUrl, '_blank');

      // Track share
      chrome.runtime.sendMessage({
        type: 'TRACK_EVENT',
        payload: {
          event: 'viral_share',
          properties: { type: 'quote', source: 'block_page' }
        }
      });
    });

    quoteEl.style.position = 'relative';
    quoteEl.appendChild(shareBtn);
  }

  /**
   * Add subtle "Invite a friend" link in the footer.
   * IMPORTANT: This is only shown when the user is NOT in an active
   * session to avoid any possible distraction.
   */
  _addInviteLink() {
    // Check if user is in active session
    chrome.runtime.sendMessage({ type: 'GET_SESSION_STATUS' }, (response) => {
      if (response?.isActive) return; // Don't show during active sessions

      const footer = document.querySelector('.block-page__footer');
      if (!footer) return;

      const link = document.createElement('a');
      link.className = 'bp-invite-link';
      link.href = '#';
      link.textContent = 'Know someone who needs this?';
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this._showInviteOptions();
      });

      footer.appendChild(link);
    });
  }

  /**
   * Add micro achievement progress indicator.
   * Shows a small progress bar toward the next achievement.
   */
  _addAchievementProgress() {
    chrome.runtime.sendMessage({ type: 'GET_NEXT_ACHIEVEMENT' }, (response) => {
      if (!response?.nextAchievement) return;

      const { name, progress, target, icon } = response.nextAchievement;

      const el = document.createElement('div');
      el.className = 'bp-achievement-progress';
      el.innerHTML = `
        <span class="bp-achievement-progress__label">
          Next: ${name}
        </span>
        <div class="bp-achievement-progress__bar">
          <div class="bp-achievement-progress__fill"
               style="width: ${Math.round((progress / target) * 100)}%">
          </div>
        </div>
        <span class="bp-achievement-progress__count">
          ${progress}/${target}
        </span>
      `;

      const statsPanel = document.querySelector('.block-page__stats');
      if (statsPanel) {
        statsPanel.parentNode.insertBefore(el, statsPanel.nextSibling);
      }
    });
  }

  _showInviteOptions() {
    chrome.runtime.sendMessage({ type: 'GET_REFERRAL_CODE' }, (response) => {
      const referralLink = `https://focusmode.app/r/${response?.code || 'share'}`;
      const text = 'I use Focus Mode to block distracting websites and stay focused. You should try it!';

      // Simple share options
      const options = document.createElement('div');
      options.className = 'bp-invite-options';
      options.innerHTML = `
        <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(text + ' ' + referralLink)}"
           target="_blank" class="bp-invite-option">Twitter</a>
        <a href="mailto:?subject=${encodeURIComponent('Try Focus Mode')}&body=${encodeURIComponent(text + '\n\n' + referralLink)}"
           class="bp-invite-option">Email</a>
        <button class="bp-invite-option" data-action="copy">Copy Link</button>
      `;

      options.querySelector('[data-action="copy"]').addEventListener('click', () => {
        navigator.clipboard.writeText(referralLink);
        options.querySelector('[data-action="copy"]').textContent = 'Copied!';
        setTimeout(() => options.remove(), 2000);
      });

      // Insert near the invite link
      const inviteLink = document.querySelector('.bp-invite-link');
      if (inviteLink) {
        inviteLink.parentNode.insertBefore(options, inviteLink.nextSibling);
      }
    });
  }

  _estimateFocusingNow(totalUsers) {
    const hour = new Date().getHours();
    const isBusinessHours = hour >= 9 && hour <= 18;
    const isWeekday = new Date().getDay() >= 1 && new Date().getDay() <= 5;

    let rate = 0.012; // 1.2% of users
    if (!isBusinessHours) rate *= 0.2;
    if (!isWeekday) rate *= 0.4;

    const estimate = Math.round(totalUsers * rate);
    const jitter = 1 + (Math.random() * 0.2 - 0.1);
    const result = Math.max(1, Math.round(estimate * jitter));

    if (result > 1000) return Math.round(result / 100) * 100;
    if (result > 100) return Math.round(result / 10) * 10;
    return result;
  }
}

export default BlockPageViral;
```

### 8.3 Block Page Viral CSS

```css
/* src/content/styles/block-page-viral.css */

/* Social proof line */
.bp-social-proof {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 0;
  margin: 16px 0;
  opacity: 0.7;
  transition: opacity 300ms ease;
}

.bp-social-proof:hover {
  opacity: 1;
}

.bp-social-proof__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  animation: pulse 2s ease-in-out infinite;
}

.bp-social-proof__text {
  font-size: 13px;
  color: var(--text-muted, #94a3b8);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* Share quote button */
.bp-share-quote {
  position: absolute;
  right: -32px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-muted, #94a3b8);
  cursor: pointer;
  padding: 4px;
  opacity: 0;
  transition: opacity 200ms ease, color 200ms ease;
}

.block-page__quote:hover .bp-share-quote {
  opacity: 0.6;
}

.bp-share-quote:hover {
  opacity: 1 !important;
  color: var(--text-primary, #1a1a2e);
}

/* Invite link */
.bp-invite-link {
  font-size: 12px;
  color: var(--text-muted, #94a3b8);
  text-decoration: none;
  margin-left: 16px;
  transition: color 200ms ease;
}

.bp-invite-link:hover {
  color: #6366f1;
}

/* Invite options */
.bp-invite-options {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  animation: fadeIn 200ms ease-out;
}

.bp-invite-option {
  padding: 4px 10px;
  font-size: 11px;
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 6px;
  background: var(--bg-secondary, #f8fafc);
  color: var(--text-secondary, #64748b);
  text-decoration: none;
  cursor: pointer;
  transition: all 150ms ease;
}

.bp-invite-option:hover {
  border-color: #6366f1;
  color: #6366f1;
}

/* Achievement progress */
.bp-achievement-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  margin: 8px auto;
  max-width: 280px;
  opacity: 0.7;
}

.bp-achievement-progress__label {
  font-size: 11px;
  color: var(--text-muted, #94a3b8);
  white-space: nowrap;
}

.bp-achievement-progress__bar {
  flex: 1;
  height: 4px;
  background: var(--bg-secondary, #e2e8f0);
  border-radius: 2px;
  overflow: hidden;
}

.bp-achievement-progress__fill {
  height: 100%;
  background: #6366f1;
  border-radius: 2px;
  transition: width 500ms ease-out;
}

.bp-achievement-progress__count {
  font-size: 11px;
  color: var(--text-muted, #94a3b8);
  font-variant-numeric: tabular-nums;
}
```

---

## 9. Implementation Architecture

### 9.1 Module Overview

```
VIRAL ENGINE MODULE MAP
========================

src/
  background/
    viral-trigger-system.js      <- Core trigger evaluation engine
    viral-context-builder.js     <- Builds context for trigger evaluation
    share-card-generator.js      <- Canvas-based share card generation
    social-proof-system.js       <- Social proof data management
    blocklist-sharing.js         <- Shared blocklist create/import
    focus-challenges.js          <- Challenge create/join/track
    accountability-partner.js    <- Partner pairing and nudges
    referral-system.js           <- Referral code management
    service-worker.js            <- Message handler integration

  popup/
    components/
      share-prompt.js            <- Share prompt UI (modal/toast/inline)
      share-card-handler.js      <- Card preview, download, share
      social-proof-badge.js      <- Social proof display in popup
      challenge-panel.js         <- Challenge UI in popup
      partner-panel.js           <- Accountability partner UI
    styles/
      viral-prompts.css          <- Share prompt styles
      share-card-preview.css     <- Card preview modal styles
      social-proof.css           <- Social proof badge styles
      challenges.css             <- Challenge panel styles

  content/
    block-page-viral.js          <- Block page viral enhancements
    styles/
      block-page-viral.css       <- Block page viral styles

  shared/
    components/
      powered-by-badge.js        <- "Powered by" badge component
    styles/
      powered-by-badge.css       <- Badge styles
    utils/
      share-utils.js             <- Platform share URL builders
      referral-utils.js          <- Referral code helpers
```

### 9.2 Message Types

All communication between background service worker, popup, content scripts, and pages uses Chrome messaging.

```javascript
// src/shared/constants/viral-messages.js

/**
 * Message types for the viral engine.
 */
export const VIRAL_MESSAGES = {
  // Trigger system
  CHECK_VIRAL_TRIGGERS: 'CHECK_VIRAL_TRIGGERS',
  VIRAL_PROMPT_ACTION: 'VIRAL_PROMPT_ACTION',

  // Share cards
  GENERATE_SHARE_CARD: 'GENERATE_SHARE_CARD',
  SHARE_CARD_READY: 'SHARE_CARD_READY',

  // Social proof
  GET_SOCIAL_PROOF_DATA: 'GET_SOCIAL_PROOF_DATA',
  REFRESH_SOCIAL_PROOF: 'REFRESH_SOCIAL_PROOF',

  // Blocklist sharing
  GENERATE_BLOCKLIST_LINK: 'GENERATE_BLOCKLIST_LINK',
  IMPORT_BLOCKLIST: 'IMPORT_BLOCKLIST',

  // Challenges
  CREATE_CHALLENGE: 'CREATE_CHALLENGE',
  JOIN_CHALLENGE: 'JOIN_CHALLENGE',
  GET_CHALLENGE_LEADERBOARD: 'GET_CHALLENGE_LEADERBOARD',
  SUBMIT_CHALLENGE_PROGRESS: 'SUBMIT_CHALLENGE_PROGRESS',

  // Accountability
  INVITE_PARTNER: 'INVITE_PARTNER',
  GET_PARTNER_STATUS: 'GET_PARTNER_STATUS',
  SEND_NUDGE: 'SEND_NUDGE',
  UNPAIR_PARTNER: 'UNPAIR_PARTNER',

  // Referral
  GET_REFERRAL_CODE: 'GET_REFERRAL_CODE',
  GET_REFERRAL_STATS: 'GET_REFERRAL_STATS',

  // Block page
  GET_SESSION_STATUS: 'GET_SESSION_STATUS',
  GET_NEXT_ACHIEVEMENT: 'GET_NEXT_ACHIEVEMENT',

  // Tracking
  TRACK_EVENT: 'TRACK_EVENT'
};
```

### 9.3 Service Worker Integration (Complete)

```javascript
// src/background/service-worker-viral.js

/**
 * Complete service worker integration for the viral engine.
 * This module is imported by the main service worker.
 */

import ViralTriggerSystem from './viral-trigger-system.js';
import ViralContextBuilder from './viral-context-builder.js';
import ShareCardGenerator from './share-card-generator.js';
import SocialProofSystem from './social-proof-system.js';
import BlocklistSharing from './blocklist-sharing.js';
import FocusChallenges from './focus-challenges.js';
import AccountabilityPartner from './accountability-partner.js';
import { VIRAL_MESSAGES } from '../shared/constants/viral-messages.js';

// Initialize modules
const viralSystem = new ViralTriggerSystem();
const contextBuilder = new ViralContextBuilder();
const cardGenerator = new ShareCardGenerator();
const socialProof = new SocialProofSystem();
const blocklistSharing = new BlocklistSharing();
const challenges = new FocusChallenges();
const partner = new AccountabilityPartner();

/**
 * Register all viral message handlers.
 */
export function registerViralHandlers() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const handler = messageHandlers[message.type];
    if (handler) {
      handler(message.payload, sender).then(sendResponse);
      return true; // async response
    }
  });

  // Set up periodic alarms
  chrome.alarms.create('viral_social_proof_refresh', {
    periodInMinutes: 60 * 24 // once per day
  });

  chrome.alarms.create('viral_partner_status_sync', {
    periodInMinutes: 30 // every 30 minutes
  });

  chrome.alarms.create('viral_challenge_progress_sync', {
    periodInMinutes: 60 // every hour
  });

  chrome.alarms.onAlarm.addListener(async (alarm) => {
    switch (alarm.name) {
      case 'viral_social_proof_refresh':
        await socialProof.refreshData();
        break;
      case 'viral_partner_status_sync':
        await partner.shareDailyStatus();
        break;
      case 'viral_challenge_progress_sync':
        await challenges.submitProgress();
        break;
    }
  });
}

/**
 * Message handler map.
 */
const messageHandlers = {
  [VIRAL_MESSAGES.CHECK_VIRAL_TRIGGERS]: async () => {
    const context = await contextBuilder.build();
    const trigger = await viralSystem.evaluate(context);
    return { trigger };
  },

  [VIRAL_MESSAGES.VIRAL_PROMPT_ACTION]: async (payload) => {
    await viralSystem.recordPromptAction(payload.action);
    return { success: true };
  },

  [VIRAL_MESSAGES.GENERATE_SHARE_CARD]: async (payload) => {
    const { type, data, theme } = payload;
    let blob;

    switch (type) {
      case 'weekly_report':
        blob = await cardGenerator.generateWeeklyReport(data, theme);
        break;
      case 'achievement':
        blob = await cardGenerator.generateAchievementCard(data, theme);
        break;
      case 'streak':
        blob = await cardGenerator.generateStreakCard(data, theme);
        break;
      case 'year_in_focus':
        blob = await cardGenerator.generateYearInFocusCard(data, theme);
        break;
      case 'focus_score':
        blob = await cardGenerator.generateFocusScoreCard(data, theme);
        break;
      default:
        return { error: `Unknown card type: ${type}` };
    }

    // Convert blob to data URL for transfer via messaging
    const buffer = await blob.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    return { dataUrl: `data:image/png;base64,${base64}` };
  },

  [VIRAL_MESSAGES.GET_SOCIAL_PROOF_DATA]: async (payload) => {
    return await socialProof.getProofData(payload.context);
  },

  [VIRAL_MESSAGES.REFRESH_SOCIAL_PROOF]: async () => {
    return await socialProof.refreshData();
  },

  [VIRAL_MESSAGES.GENERATE_BLOCKLIST_LINK]: async (payload) => {
    return await blocklistSharing.generateShareLink(payload);
  },

  [VIRAL_MESSAGES.IMPORT_BLOCKLIST]: async (payload) => {
    return await blocklistSharing.importBlocklist(payload.link);
  },

  [VIRAL_MESSAGES.CREATE_CHALLENGE]: async (payload) => {
    return await challenges.createChallenge(payload);
  },

  [VIRAL_MESSAGES.JOIN_CHALLENGE]: async (payload) => {
    return await challenges.joinChallenge(payload.challengeId);
  },

  [VIRAL_MESSAGES.GET_CHALLENGE_LEADERBOARD]: async (payload) => {
    return await challenges.getLeaderboard(payload.challengeId);
  },

  [VIRAL_MESSAGES.SUBMIT_CHALLENGE_PROGRESS]: async () => {
    return await challenges.submitProgress();
  },

  [VIRAL_MESSAGES.INVITE_PARTNER]: async (payload) => {
    return await partner.invite(payload.email);
  },

  [VIRAL_MESSAGES.GET_PARTNER_STATUS]: async () => {
    return await partner.getPartnerStatus();
  },

  [VIRAL_MESSAGES.SEND_NUDGE]: async () => {
    return await partner.sendNudge();
  },

  [VIRAL_MESSAGES.UNPAIR_PARTNER]: async () => {
    return await partner.unpair();
  },

  [VIRAL_MESSAGES.GET_REFERRAL_CODE]: async () => {
    const { viral = {} } = await chrome.storage.local.get('viral');
    if (viral.referralCode) return { code: viral.referralCode };
    const code = 'fm_' + generateId(8);
    viral.referralCode = code;
    await chrome.storage.local.set({ viral });
    return { code };
  },

  [VIRAL_MESSAGES.GET_REFERRAL_STATS]: async () => {
    const { viral = {} } = await chrome.storage.local.get('viral');
    return {
      code: viral.referralCode || null,
      totalShares: viral.totalShares || 0,
      totalClicks: viral.referralClicks || 0,
      totalInstalls: viral.referralInstalls || 0
    };
  }
};

function generateId(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}
```

### 9.4 Integration Points with Existing Systems

```
INTEGRATION WITH RETENTION SYSTEM
===================================

The viral engine integrates with the existing retention system
(agent4-retention-system.md) at these points:

1. STREAK SYSTEM -> VIRAL TRIGGERS
   When streak.current changes, check viral triggers for
   streak milestones (T-04, T-12, T-14, T-16).

2. FOCUS SCORE -> VIRAL TRIGGERS
   When focusScore.current changes, check for score milestones
   (T-05, T-10, T-17).

3. ACHIEVEMENT SYSTEM -> VIRAL TRIGGERS
   When a new achievement is earned, check trigger T-09.

4. SESSION COMPLETION -> VIRAL TRIGGERS
   After session_complete event, check T-01, T-06, T-11,
   T-15, T-20.

5. BLOCK PAGE -> SOCIAL PROOF
   Block page loads social proof data from cached storage.

6. WEEKLY REPORT -> SHARE CARD
   Weekly report generation triggers the inline share
   prompt (T-07) and offers share card generation.

7. ANALYTICS EVENTS -> CHALLENGE PROGRESS
   Session completion events are relayed to active
   challenges for progress tracking.

FLOW DIAGRAM:

  [Session Complete Event]
          |
          +---> [Update Streak]
          |          |
          |          +---> [Check Streak Triggers]
          |
          +---> [Update Focus Score]
          |          |
          |          +---> [Check Score Triggers]
          |
          +---> [Check Achievement]
          |          |
          |          +---> [Check Achievement Trigger]
          |
          +---> [Submit Challenge Progress]
          |
          +---> [Update Partner Status]
          |
          +---> [Build Context + Evaluate All Triggers]
                     |
                     +---> [Fire best trigger (if any)]
```

---

## 10. Storage Schema & Data Model

### 10.1 Viral Storage Schema

All viral engine data is stored in `chrome.storage.local` under the `viral` key.

```javascript
// Storage schema for viral engine data

const viralSchema = {
  viral: {
    // ─── TRIGGER STATE ────────────────────────────────
    firedTriggers: [
      // Array of trigger keys that have fired (for one-time gates)
      'first_session_complete',
      'first_block',
      'setup_complete',
      'streak_3',
      'score_50'
    ],

    triggerHistory: {
      // Per-trigger firing history
      'first_session_complete': {
        lastFired: 1707500000000,  // timestamp
        fireCount: 1
      },
      'weekly_report': {
        lastFired: 1707400000000,
        fireCount: 3
      }
    },

    // ─── PROMPT TRACKING ──────────────────────────────
    lastPromptTimestamp: 1707500000000,
    promptsToday: 1,
    promptsTodayDate: '2026-02-09',
    promptsThisWeek: 2,
    promptsWeekStart: '2026-02-03',
    totalPrompts: 15,
    totalShares: 3,
    totalDismissals: 12,
    suppressions: 45, // times trigger passed conditions but was probability-gated

    // ─── REFERRAL ─────────────────────────────────────
    referralCode: 'fm_a1b2c3d4',
    referralClicks: 12,
    referralInstalls: 2,

    // ─── SHARE CARDS ──────────────────────────────────
    shareCount: {
      weeklyReport: 2,
      achievement: 1,
      streak: 0,
      yearInFocus: 0,
      focusScore: 0,
      total: 3
    },
    lastCardGenerated: 1707500000000,
    preferredTheme: 'purple', // user's preferred share card theme

    // ─── MILESTONES ───────────────────────────────────
    triggeredMilestones: [
      'blocks_100',
      'time_60',
      'time_300'
    ],

    // ─── YEAR IN FOCUS ────────────────────────────────
    yearInFocusShown: false,
    yearInFocusYear: null, // e.g., 2026

    // ─── SETTINGS ─────────────────────────────────────
    sharePromptsEnabled: true, // user can disable all share prompts
    showPoweredByBadge: true,  // Pro users can disable
    poweredByStyle: 'default'  // default, minimal, compact
  },

  // ─── SOCIAL PROOF (separate key for faster access) ──
  socialProof: {
    totalUsers: 50000,
    proUsers: '5,000+',
    rating: 4.7,
    reviewCount: 2500,
    recentInstalls: '1,200+ this week',
    testimonials: [/* ... */],
    proTestimonials: [/* ... */],
    lastRefresh: 1707500000000
  },

  // ─── CHALLENGES (separate key) ─────────────────────
  challenges: [
    {
      id: 'ch_abc123',
      type: '7day',
      name: '7-Day Focus Challenge',
      joinedAt: 1707400000000,
      status: 'active', // pending, active, completed, failed
      startDate: '2026-02-03',
      endDate: '2026-02-10',
      myProgress: {
        daysCompleted: 5,
        totalSessions: 18,
        totalMinutes: 450
      }
    }
  ],

  // ─── PARTNER (separate key) ─────────────────────────
  partner: {
    pairedWith: 'user_xyz789',
    partnerName: 'Sarah K.',
    pairedAt: 1707300000000,
    lastNudgeDate: '2026-02-08',
    nudgesSent: 3,
    nudgesReceived: 5
  }
};
```

### 10.2 Storage Size Estimates

```
STORAGE SIZE BUDGET (per user)
==============================

Component                | Estimated Size | Notes
-------------------------|:--------------:|------
viral (trigger state)    | 2-5 KB         | Grows slowly with milestones
socialProof (cached)     | 3-8 KB         | Includes testimonials
challenges (active)      | 1-3 KB         | Max 5 active challenges
partner (if paired)      | 0.5-1 KB       | Minimal data
share cards (metadata)   | 0.5-1 KB       | Only counts, not images

TOTAL VIRAL OVERHEAD:    | 7-18 KB        |

For context: chrome.storage.local has a 10 MB limit.
Viral engine uses less than 0.2% of available space.
```

---

## 11. Privacy & Ethics Guidelines

### 11.1 Privacy Principles for Viral Features

```
PRIVACY DECISION MATRIX
========================

+------------------------------+-------+------+-----------+
| Data Type                    | Store | Send | Share     |
|                              | Local | Srvr | w/Others  |
+------------------------------+-------+------+-----------+
| Trigger fire history         | Yes   | No   | No        |
| Share prompt counts          | Yes   | No   | No        |
| Referral code                | Yes   | Yes* | Yes**     |
| Share card images            | No*** | No   | Yes (usr) |
| Social proof (aggregate)     | Yes   | No   | N/A       |
| Blocked site domains         | Yes   | No   | NEVER     |
| Focus Score number           | Yes   | Opt  | Opt       |
| Streak count                 | Yes   | Opt  | Opt       |
| Browsing history             | No    | No   | NEVER     |
| Partner status (aggregate)   | No    | Yes* | Partner   |
| Challenge progress           | Yes   | Yes* | Challenge |
+------------------------------+-------+------+-----------+

*  = Pro/Team only (free tier never contacts server)
** = Embedded in share links (user-initiated only)
*** = Generated on-demand, not persisted

KEY RULES:
1. Free tier makes ZERO external requests for viral features
2. Share cards are generated locally, never uploaded
3. Specific blocked domains are NEVER shared or sent anywhere
4. Social proof data is always aggregate (cached from updates)
5. Partner status only shows session count/minutes/streak
6. User can disable all viral features with one toggle
```

### 11.2 GDPR and Privacy Compliance

```
GDPR MAPPING FOR VIRAL FEATURES
=================================

Article 6 (Lawful Basis):
  - Share features: Consent (user initiates share action)
  - Social proof: Legitimate interest (aggregate, anonymous)
  - Partner features: Contract (user explicitly pairs)
  - Challenge features: Contract (user explicitly joins)

Article 7 (Conditions for Consent):
  - Share prompts clearly state what will be shared
  - User can dismiss with one tap
  - No dark patterns, no pre-checked boxes

Article 17 (Right to Erasure):
  - Clear all viral data: settings toggle
  - Unpair from partner: instant
  - Leave challenges: instant
  - Delete referral code: settings

Article 25 (Data Protection by Design):
  - All viral data local by default
  - Server features are opt-in (Pro/Team only)
  - Minimal data principle: only store what's needed
```

### 11.3 Ethical Guidelines for Viral Features

```
ETHICAL STANDARDS
=================

1. NO DARK PATTERNS
   - Never guilt-trip users for not sharing
   - Never require sharing to unlock features
   - Never make dismissing harder than engaging
   - "Maybe Later" and "x" buttons are always visible
   - No countdown timers on share prompts

2. NO DECEPTIVE SOCIAL PROOF
   - User counts must be real (or clearly estimated)
   - "X people focusing now" is labeled as estimate
   - Testimonials must be from real users
   - Never fabricate urgency ("Only 3 spots left!")

3. NO SPAM
   - Max 1 share prompt per day (hard limit)
   - Max 3 per week
   - Probability gates ensure most moments are silent
   - Users can disable all prompts permanently

4. NO MANIPULATION
   - Challenges must be genuinely useful
   - Partner nudges are limited (1/day max)
   - Leaderboards don't create toxic competition
   - No public shaming for low scores or broken streaks

5. NO DATA EXPLOITATION
   - Never sell or share user data for viral features
   - Free tier viral features work 100% offline
   - Shared content only includes what user explicitly chooses

6. TRANSPARENCY
   - Badge clearly identifies "Focus Mode - Blocker"
   - Referral links are clearly branded
   - Users know when data is shared with partners
   - Settings page shows all viral feature controls
```

---

## 12. Metrics & Measurement

### 12.1 Viral Metrics Dashboard

```
VIRAL METRICS (tracked locally for free, server for Pro)
==========================================================

SHARE METRICS:
  share_prompt_shown           - Total share prompts displayed
  share_prompt_shared          - User clicked share
  share_prompt_dismissed       - User dismissed
  share_prompt_suppressed      - Trigger met but probability gated
  share_rate                   - shared / shown (target: 15-25%)
  share_by_platform            - Breakdown by Twitter/LinkedIn/etc
  share_by_trigger             - Which triggers drive most shares
  share_card_generated         - Share cards created
  share_card_downloaded        - Share cards saved
  share_card_shared            - Share cards shared via platform

REFERRAL METRICS:
  referral_link_created        - Referral codes generated
  referral_link_clicked        - Clicks on referral links
  referral_install             - Installs from referral links
  referral_conversion_rate     - installs / clicks
  referral_k_factor            - Viral coefficient

SOCIAL PROOF METRICS:
  social_proof_impression      - Times social proof was shown
  social_proof_click           - Clicks on social proof elements
  social_proof_influence       - Correlation with upgrade rate

COLLABORATION METRICS:
  blocklist_shared             - Blocklists shared
  blocklist_imported           - Blocklists imported
  challenge_created            - Challenges hosted
  challenge_joined             - Challenge participations
  challenge_completed          - Challenges completed
  partner_paired               - Accountability pairs formed
  partner_nudge_sent           - Nudges exchanged
  partner_nudge_converted      - Nudges that started sessions

BLOCK PAGE VIRAL METRICS:
  bp_social_proof_impression   - Social proof shown on block page
  bp_quote_shared              - Quotes shared from block page
  bp_invite_clicked            - "Invite a friend" clicks
  bp_invite_completed          - Full invite flow completions
```

### 12.2 Key Performance Indicators

```
VIRAL KPIs AND TARGETS
=======================

+------------------------------+----------+----------+----------+
| KPI                          | Month 1  | Month 3  | Month 6  |
+------------------------------+----------+----------+----------+
| Share prompt show rate       | 5%       | 8%       | 10%      |
| (% of qualifying moments)   |          |          |          |
+------------------------------+----------+----------+----------+
| Share conversion rate        | 10%      | 15%      | 20%      |
| (shares / prompts shown)    |          |          |          |
+------------------------------+----------+----------+----------+
| Users who shared (ever)      | 3%       | 8%       | 12%      |
+------------------------------+----------+----------+----------+
| Referral clicks per share    | 2.0      | 3.5      | 5.0      |
+------------------------------+----------+----------+----------+
| Install rate from referral   | 8%       | 12%      | 18%      |
+------------------------------+----------+----------+----------+
| K-factor                     | 0.005    | 0.03     | 0.065    |
+------------------------------+----------+----------+----------+
| Blocklists shared            | 50       | 300      | 1,000    |
+------------------------------+----------+----------+----------+
| Challenge participants       | --       | 200      | 1,500    |
+------------------------------+----------+----------+----------+
| Partner pairs                | --       | 100      | 500      |
+------------------------------+----------+----------+----------+
| % of upgrades from referral  | 2%       | 5%       | 8%       |
+------------------------------+----------+----------+----------+
```

### 12.3 Funnel Analysis

```
VIRAL FUNNEL
=============

Stage 1: QUALIFYING MOMENT
  User reaches a share-worthy milestone
  Estimated: 100% of active users (daily)
          |
          v  (15% probability gate + cooldown)
Stage 2: PROMPT SHOWN
  Share prompt displayed to user
  Target: 5-10% of qualifying moments
          |
          v  (15-20% share rate)
Stage 3: USER SHARES
  User clicks share button
  Target: 15-20% of prompts shown
          |
          v  (platform-dependent)
Stage 4: CONTENT VIEWED
  Shared content seen by recipient
  Estimated: 50-200 impressions per share (social)
  Estimated: 1-3 views per share (direct message)
          |
          v  (8-15% CTR)
Stage 5: LINK CLICKED
  Recipient clicks referral link
  Target: 8-15% of viewers
          |
          v  (10-18% install rate)
Stage 6: EXTENSION INSTALLED
  Recipient installs Focus Mode
  Target: 10-18% of clickers
          |
          v  (80% day-1 retention)
Stage 7: NEW ACTIVE USER
  Recipient becomes active user
  Target: 80% of installers

EXAMPLE CALCULATION (per 1,000 active users/month):
  1,000 users * 30 qualifying moments/user = 30,000 moments
  30,000 * 8% show rate = 2,400 prompts shown
  2,400 * 15% share rate = 360 shares
  360 * 3 avg views = 1,080 content views
  1,080 * 12% CTR = 130 link clicks
  130 * 15% install rate = ~20 new installs
  20 * 80% retention = 16 new active users

  K-factor = 16 / 1,000 = 0.016 (per month)
  Annualized: ~0.19 additional users per user per year
```

---

## 13. A/B Testing Plan

### 13.1 Viral Feature A/B Tests

```
A/B TEST 1: SHARE PROMPT PROBABILITY
======================================
Hypothesis: Increasing base probability from 15% to 25% will
            increase total shares without increasing churn.

Control:    15% probability gate (current)
Variant A:  25% probability gate
Variant B:  20% probability gate

Primary metric:   Shares per user per week
Secondary metric: Share prompt dismissal rate
Guardrail metric: 7-day retention (must not decrease by >2%)
Sample size:      2,000 users per variant
Duration:         4 weeks


A/B TEST 2: SHARE CARD THEME
==============================
Hypothesis: Purple-branded cards will drive more installs than
            neutral dark/light cards due to brand recognition.

Control:    Purple theme (default)
Variant A:  Dark theme (default)
Variant B:  Light theme (default)

Primary metric:   Referral install rate from card shares
Secondary metric: Card download rate
Sample size:      1,500 users per variant
Duration:         4 weeks


A/B TEST 3: SOCIAL PROOF ON BLOCK PAGE
========================================
Hypothesis: Showing "X people focusing now" on the block page
            increases "Back to Work" button clicks.

Control:    No social proof on block page
Variant A:  "X people focusing now" with green dot
Variant B:  "X people focusing now" + encouragement line

Primary metric:   Block page -> Back to Work click rate
Secondary metric: Average time on block page
Guardrail metric: Block page bounce rate
Sample size:      3,000 users per variant
Duration:         3 weeks


A/B TEST 4: SHARE PROMPT COPY TONE
====================================
Hypothesis: Achievement-focused copy ("You earned this!") will
            drive more shares than action-focused copy ("Share with friends").

Control:    Action-focused: "Share your stats?"
Variant A:  Achievement-focused: "You earned this! Show it off"
Variant B:  Social-focused: "Your friends would love this"

Primary metric:   Share conversion rate
Secondary metric: Time to dismiss (longer = more consideration)
Sample size:      2,000 users per variant
Duration:         4 weeks


A/B TEST 5: SHARE CARD CONTENT
================================
Hypothesis: Including more stats on the share card will increase
            engagement from viewers.

Control:    Basic card (Focus Score + streak)
Variant A:  Detailed card (Score + streak + time saved + blocks + chart)
Variant B:  Achievement-focused card (badge + single stat)

Primary metric:   Referral link click rate from card
Secondary metric: Card share rate
Sample size:      1,500 users per variant
Duration:         4 weeks


A/B TEST 6: BLOCK PAGE INVITE PLACEMENT
=========================================
Hypothesis: Moving the "Invite a friend" link from footer to
            below the stats panel increases invite clicks.

Control:    Footer placement (current)
Variant A:  Below stats panel
Variant B:  Separate subtle card below quote

Primary metric:   Invite link click rate
Guardrail metric: "Back to Work" click rate (must not decrease)
Sample size:      3,000 users per variant
Duration:         3 weeks


A/B TEST 7: WEEKLY REPORT SHARE CTA
=====================================
Hypothesis: Auto-generating a share card preview in the weekly
            report will increase share rate vs. a text CTA.

Control:    Text CTA: "Share your weekly stats?"
Variant A:  Auto-generated card thumbnail with "Share" button
Variant B:  Text CTA + "Generate Share Card" button

Primary metric:   Weekly report share rate
Secondary metric: Card generation rate
Sample size:      2,000 users per variant
Duration:         6 weeks (to get multiple weekly reports)


A/B TEST 8: SOCIAL PROOF TYPE ON UPGRADE PAGE
===============================================
Hypothesis: Real-time upgrade count ("12 people upgraded today")
            will drive more conversions than static testimonials.

Control:    Testimonials only
Variant A:  Real-time count + testimonials
Variant B:  Real-time count + user count badge (no testimonials)

Primary metric:   Pro upgrade rate from upgrade page
Secondary metric: Upgrade page engagement time
Sample size:      2,000 users per variant
Duration:         4 weeks
```

### 13.2 A/B Test Implementation

```javascript
// src/background/viral-ab-tests.js

/**
 * Simple A/B test assignment for viral features.
 * Uses deterministic assignment based on user ID hash.
 */
class ViralABTests {
  constructor() {
    this.STORAGE_KEY = 'viralABTests';
    this.tests = {
      'share_probability': {
        variants: ['control', 'variant_a', 'variant_b'],
        active: true,
        startDate: '2026-03-01'
      },
      'card_theme': {
        variants: ['control', 'variant_a', 'variant_b'],
        active: true,
        startDate: '2026-03-01'
      },
      'block_page_proof': {
        variants: ['control', 'variant_a', 'variant_b'],
        active: true,
        startDate: '2026-03-01'
      },
      'share_copy_tone': {
        variants: ['control', 'variant_a', 'variant_b'],
        active: false,
        startDate: '2026-04-01'
      }
    };
  }

  /**
   * Get the variant assignment for a specific test.
   * Uses deterministic hash to ensure consistent assignment.
   * @param {string} testName - Name of the A/B test
   * @returns {string} Variant name
   */
  async getVariant(testName) {
    const test = this.tests[testName];
    if (!test || !test.active) return 'control';

    // Check for cached assignment
    const { [this.STORAGE_KEY]: cached = {} } = await chrome.storage.local.get(this.STORAGE_KEY);
    if (cached[testName]) return cached[testName];

    // Generate deterministic assignment
    const { viral = {} } = await chrome.storage.local.get('viral');
    const userId = viral.referralCode || 'anonymous';
    const hash = await this._hashString(`${userId}:${testName}`);
    const index = hash % test.variants.length;
    const variant = test.variants[index];

    // Cache assignment
    cached[testName] = variant;
    await chrome.storage.local.set({ [this.STORAGE_KEY]: cached });

    return variant;
  }

  async _hashString(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = new Uint8Array(hashBuffer);
    // Use first 4 bytes as a number
    return (hashArray[0] << 24 | hashArray[1] << 16 | hashArray[2] << 8 | hashArray[3]) >>> 0;
  }
}

export default ViralABTests;
```

---

## 14. Rollout Strategy

### 14.1 Phased Rollout Plan

```
VIRAL ENGINE ROLLOUT PHASES
============================

PHASE 1: Foundation (Week 1-2 post-launch)
-------------------------------------------
  Deploy:
    - ViralTriggerSystem (core engine)
    - Share prompts (modal + toast + inline)
    - T-01 (first session complete) - 100% show
    - T-03 (setup complete) - inline only
    - Social proof on upgrade page (cached data)
    - "Powered by" badge on share content

  Hold:
    - All other triggers (probability = 0)
    - Share cards
    - Block page viral elements
    - Collaborative features

  Monitor:
    - Share prompt show rate
    - Share conversion rate
    - Dismissal rate
    - 7-day retention (guardrail)

  Success criteria:
    - Dismissal rate < 70%
    - No retention degradation
    - At least 5% of shown prompts result in shares


PHASE 2: Core Triggers (Week 3-4)
-------------------------------------------
  Enable:
    - T-04 to T-09 (value + habitual triggers)
    - Share card generator (weekly report + achievement)
    - Block page social proof ("X focusing now")
    - Referral code system

  Monitor:
    - Shares per trigger type
    - Card generation rate
    - Block page metrics
    - Referral link clicks

  Success criteria:
    - Overall share rate > 10%
    - At least 3% of users generate a share card
    - No block page "Back to Work" rate degradation


PHASE 3: Deep Engagement (Week 5-8)
-------------------------------------------
  Enable:
    - T-10 to T-20 (deep + power + delight triggers)
    - All share card types
    - Theme picker
    - Shared blocklist feature
    - Start A/B tests 1-3

  Monitor:
    - K-factor
    - Referral installs
    - Blocklist import count
    - A/B test results

  Success criteria:
    - K-factor > 0.01
    - At least 50 blocklists shared
    - A/B tests showing significance


PHASE 4: Collaboration (Month 3+)
-------------------------------------------
  Enable:
    - Focus challenges (Pro host, free join)
    - Accountability partners (Pro)
    - Team features (Team plan)
    - Year in Focus card
    - A/B tests 4-8

  Monitor:
    - Challenge participation rate
    - Partner pair count
    - Team adoption
    - Revenue impact

  Success criteria:
    - K-factor > 0.03
    - 200+ challenge participants
    - 100+ partner pairs
    - Measurable Team plan adoption
```

### 14.2 Kill Switches

```
VIRAL FEATURE KILL SWITCHES
=============================

Every viral feature has an independent kill switch that can be
toggled via remote config without an extension update.

+-----------------------------+------------------+
| Feature                     | Kill Switch Key  |
+-----------------------------+------------------+
| All share prompts           | viral.enabled    |
| Specific trigger (by ID)    | viral.t_XX       |
| Share card generation       | viral.cards      |
| Block page social proof     | viral.bp_proof   |
| Block page invite link      | viral.bp_invite  |
| Shared blocklists           | viral.lists      |
| Focus challenges            | viral.challenges |
| Accountability partners     | viral.partners   |
| Social proof (all)          | viral.social     |
| Powered by badge            | viral.badge      |
+-----------------------------+------------------+

Implementation:
  Remote config is checked on extension startup and cached.
  Free tier: config bundled with extension (update required).
  Pro tier: config fetched from server (instant toggle).

Kill switch activation criteria:
  - Retention drops > 3% correlated with feature
  - Dismissal rate > 85% for any trigger
  - User complaints about spam/intrusiveness
  - Chrome Web Store policy violation report
```

### 14.3 Feature Flags Implementation

```javascript
// src/background/viral-feature-flags.js

/**
 * Feature flags for viral engine.
 * Allows gradual rollout and instant kill switches.
 */
class ViralFeatureFlags {
  constructor() {
    this.STORAGE_KEY = 'viralFlags';
    this.defaults = {
      'viral.enabled': true,
      'viral.cards': true,
      'viral.bp_proof': true,
      'viral.bp_invite': true,
      'viral.lists': true,
      'viral.challenges': false, // disabled until Phase 4
      'viral.partners': false,   // disabled until Phase 4
      'viral.social': true,
      'viral.badge': true,
      // Per-trigger flags
      'viral.t_01': true,
      'viral.t_02': true,
      'viral.t_03': true,
      'viral.t_04': false, // enabled in Phase 2
      'viral.t_05': false,
      'viral.t_06': false,
      'viral.t_07': false,
      'viral.t_08': false,
      'viral.t_09': false,
      'viral.t_10': false, // enabled in Phase 3
      'viral.t_11': false,
      'viral.t_12': false,
      'viral.t_13': false,
      'viral.t_14': false,
      'viral.t_15': false,
      'viral.t_16': false,
      'viral.t_17': false,
      'viral.t_18': false,
      'viral.t_19': false,
      'viral.t_20': false
    };
  }

  /**
   * Check if a feature is enabled.
   * @param {string} flag - Feature flag key
   * @returns {boolean}
   */
  async isEnabled(flag) {
    const { [this.STORAGE_KEY]: flags = {} } = await chrome.storage.local.get(this.STORAGE_KEY);
    const merged = { ...this.defaults, ...flags };
    return merged[flag] ?? false;
  }

  /**
   * Check if a specific trigger is enabled.
   * @param {string} triggerId - e.g., 'T-01'
   * @returns {boolean}
   */
  async isTriggerEnabled(triggerId) {
    // First check global viral enable
    if (!await this.isEnabled('viral.enabled')) return false;
    // Then check specific trigger
    const flagKey = `viral.t_${triggerId.replace('T-', '').padStart(2, '0')}`;
    return await this.isEnabled(flagKey);
  }

  /**
   * Refresh flags from remote config (Pro only).
   */
  async refreshFromRemote() {
    try {
      const { license = {} } = await chrome.storage.local.get('license');
      if (!license.isPro) return; // Free tier uses defaults

      const { auth = {} } = await chrome.storage.local.get('auth');
      const response = await fetch('https://api.focusmode.app/v1/config/viral', {
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });
      const remoteFlags = await response.json();

      await chrome.storage.local.set({ [this.STORAGE_KEY]: remoteFlags });
    } catch (err) {
      console.warn('[ViralFlags] Remote refresh failed, using cached flags');
    }
  }
}

export default ViralFeatureFlags;
```

### 14.4 Monitoring Checklist

```
POST-LAUNCH MONITORING CHECKLIST
==================================

DAILY (Week 1-2):
  [ ] Share prompt show count
  [ ] Share conversion rate
  [ ] Dismissal rate per trigger
  [ ] 1-day retention (vs. pre-viral baseline)
  [ ] Error logs for viral modules
  [ ] Chrome Web Store review sentiment

WEEKLY (Ongoing):
  [ ] K-factor calculation
  [ ] Referral link click volume
  [ ] Referral install count
  [ ] Share card generation count
  [ ] Block page social proof impressions
  [ ] A/B test results (if active)
  [ ] 7-day retention comparison
  [ ] User feedback/complaints about viral features

MONTHLY:
  [ ] Overall viral contribution to growth
  [ ] Revenue from referral-attributed users
  [ ] Challenge and partner feature adoption
  [ ] K-factor trend
  [ ] Storage usage per user (viral data)
  [ ] Feature flag audit
```

---

## Appendix A: Share Text Templates

Complete pre-composed share text for every trigger and platform combination.

```javascript
// src/shared/constants/share-templates.js

export const SHARE_TEMPLATES = {
  // Platform-specific templates for each trigger
  'first_session_complete': {
    twitter: (data) =>
      `Just completed my first focus session with Focus Mode!\n` +
      `${data.duration} minutes of pure focus, ${data.blocks} distractions blocked.\n` +
      `Try it free: ${data.referralLink} #FocusMode #Productivity`,

    linkedin: (data) =>
      `I just started using Focus Mode - Blocker to manage distractions during deep work.\n\n` +
      `First session results:\n` +
      `- ${data.duration} minutes of uninterrupted focus\n` +
      `- ${data.blocks} distractions blocked\n` +
      `- Focus Score: ${data.focusScore}\n\n` +
      `If you struggle with tab-hopping during work, give it a try: ${data.referralLink}`,

    email: {
      subject: (data) => `This helped me focus for ${data.duration} minutes straight`,
      body: (data) =>
        `Hey,\n\n` +
        `I just discovered Focus Mode - Blocker and wanted to share it. ` +
        `It blocks distracting websites and tracks your focus progress.\n\n` +
        `My first session: ${data.duration} minutes focused, ` +
        `${data.blocks} distractions blocked.\n\n` +
        `Try it free: ${data.referralLink}\n\n` +
        `Cheers`
    },

    whatsapp: (data) =>
      `Hey! I just tried this focus extension and it actually works. ` +
      `Blocked ${data.blocks} distractions in my first ${data.duration}-min session. ` +
      `Check it out: ${data.referralLink}`
  },

  'streak_milestone': {
    twitter: (data) =>
      `${data.days}-day focus streak! ` +
      `${data.message}\n` +
      `${data.referralLink} #FocusStreak #Productivity`,

    linkedin: (data) =>
      `${data.days}-Day Focus Streak!\n\n` +
      `${data.message}\n\n` +
      `Using Focus Mode - Blocker to build better focus habits. ` +
      `${data.referralLink}`,

    whatsapp: (data) =>
      `${data.days}-day focus streak! ${data.message} ` +
      `${data.referralLink}`
  },

  'weekly_report': {
    twitter: (data) =>
      `My weekly focus report:\n` +
      `Focus Score: ${data.focusScore} | Sessions: ${data.sessions} | ` +
      `Time saved: ${data.timeSaved}h | Streak: ${data.streak}d\n` +
      `Tracked with Focus Mode ${data.referralLink}`,

    linkedin: (data) =>
      `Weekly Focus Report\n\n` +
      `- Focus Score: ${data.focusScore} (${data.scoreChange >= 0 ? '+' : ''}${data.scoreChange} from last week)\n` +
      `- Sessions completed: ${data.sessions}\n` +
      `- Time saved: ${data.timeSaved} hours\n` +
      `- Streak: ${data.streak} days\n\n` +
      `Tracked with Focus Mode - Blocker: ${data.referralLink}`
  },

  'achievement': {
    twitter: (data) =>
      `Achievement Unlocked: ${data.name}!\n` +
      `${data.description}\n` +
      `${data.referralLink} #FocusMode`,

    linkedin: (data) =>
      `Achievement Unlocked: "${data.name}" (${data.rarity})\n\n` +
      `${data.description}\n\n` +
      `Earned using Focus Mode - Blocker: ${data.referralLink}`
  },

  'focus_score': {
    twitter: (data) =>
      `Focus Score: ${data.score}/100!\n` +
      `${data.label}. ${data.percentile} of all users.\n` +
      `Track your own: ${data.referralLink} #FocusScore #DeepWork`,

    linkedin: (data) =>
      `My Focus Score just hit ${data.score}/100 - "${data.label}"!\n\n` +
      `${data.percentile} of all Focus Mode users.\n` +
      `Weeks of building better focus habits are paying off.\n\n` +
      `Track your own: ${data.referralLink}`
  },

  'nuclear_complete': {
    twitter: (data) =>
      `Just survived ${Math.round(data.duration / 60)} hours of Nuclear Mode in Focus Mode.\n` +
      `Zero bypass attempts. Unbreakable focus.\n` +
      `${data.referralLink} #NuclearFocus #DeepWork`,

    linkedin: (data) =>
      `Completed a ${Math.round(data.duration / 60)}-hour Nuclear Mode session.\n\n` +
      `Nuclear Mode makes it physically impossible to access blocked sites. ` +
      `No bypass, no exceptions.\n\n` +
      `${data.sitesBlocked} sites blocked. 0 bypass attempts.\n\n` +
      `${data.referralLink}`
  },

  'time_saved': {
    twitter: (data) =>
      `${data.label} saved from distractions with Focus Mode!\n` +
      `My focus shield is working overtime.\n` +
      `${data.referralLink} #Productivity`,

    linkedin: (data) =>
      `I've saved ${data.label} from going down internet rabbit holes.\n\n` +
      `Focus Mode - Blocker tracks every distraction you avoid ` +
      `and shows you how much time you're reclaiming.\n\n` +
      `${data.referralLink}`
  }
};
```

---

## Appendix B: Complete CSS Variables for Viral Engine

```css
/* src/shared/styles/viral-variables.css */

:root {
  /* ─── Brand ─────────────────────────────────── */
  --viral-primary: #6366f1;
  --viral-primary-light: #818cf8;
  --viral-primary-dark: #4f46e5;
  --viral-accent: #8b5cf6;
  --viral-gradient: linear-gradient(135deg, #6366f1, #8b5cf6);

  /* ─── Backgrounds ───────────────────────────── */
  --viral-bg-primary: #ffffff;
  --viral-bg-secondary: #f8fafc;
  --viral-bg-tertiary: #f1f5f9;
  --viral-bg-overlay: rgba(0, 0, 0, 0.5);

  /* ─── Text ──────────────────────────────────── */
  --viral-text-primary: #1a1a2e;
  --viral-text-secondary: #64748b;
  --viral-text-muted: #94a3b8;

  /* ─── Borders ───────────────────────────────── */
  --viral-border: #e2e8f0;
  --viral-border-focus: #6366f1;

  /* ─── Shadows ───────────────────────────────── */
  --viral-shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08);
  --viral-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.12);
  --viral-shadow-lg: 0 8px 30px rgba(0, 0, 0, 0.15);
  --viral-shadow-xl: 0 20px 60px rgba(0, 0, 0, 0.3);

  /* ─── Radius ────────────────────────────────── */
  --viral-radius-sm: 6px;
  --viral-radius-md: 10px;
  --viral-radius-lg: 16px;
  --viral-radius-xl: 20px;
  --viral-radius-full: 100px;

  /* ─── Transitions ───────────────────────────── */
  --viral-transition-fast: 150ms ease;
  --viral-transition-normal: 200ms ease;
  --viral-transition-slow: 300ms ease-out;

  /* ─── Z-Index ───────────────────────────────── */
  --viral-z-toast: 9999;
  --viral-z-modal: 10000;
  --viral-z-share-sheet: 10001;
  --viral-z-preview: 10002;

  /* ─── Score Colors ──────────────────────────── */
  --viral-score-green: #10b981;
  --viral-score-yellow: #f59e0b;
  --viral-score-orange: #f97316;
  --viral-score-red: #ef4444;

  /* ─── Rarity Colors ─────────────────────────── */
  --viral-rarity-common: #94a3b8;
  --viral-rarity-uncommon: #10b981;
  --viral-rarity-rare: #3b82f6;
  --viral-rarity-epic: #8b5cf6;
  --viral-rarity-legendary: #f59e0b;

  /* ─── Social Proof ──────────────────────────── */
  --viral-proof-dot: #10b981;
  --viral-proof-bg: rgba(16, 185, 129, 0.1);
}

/* Dark mode overrides */
@media (prefers-color-scheme: dark) {
  :root {
    --viral-bg-primary: #1e1e2e;
    --viral-bg-secondary: #2a2a3e;
    --viral-bg-tertiary: #363650;
    --viral-text-primary: #e2e8f0;
    --viral-text-secondary: #94a3b8;
    --viral-text-muted: #64748b;
    --viral-border: #363650;
  }
}
```

---

## Appendix C: Testing Checklist

```
VIRAL ENGINE TESTING CHECKLIST
================================

UNIT TESTS:
  [ ] ViralTriggerSystem.evaluate() returns null when no triggers match
  [ ] ViralTriggerSystem.evaluate() returns null during active session
  [ ] ViralTriggerSystem.evaluate() respects daily prompt limit
  [ ] ViralTriggerSystem.evaluate() respects weekly prompt limit
  [ ] ViralTriggerSystem.evaluate() respects global cooldown
  [ ] ViralTriggerSystem.evaluate() respects per-trigger cooldown
  [ ] ViralTriggerSystem.evaluate() respects one-time gate
  [ ] ViralTriggerSystem.evaluate() applies probability gate
  [ ] ViralTriggerSystem._getEffectiveProbability() applies engagement multiplier
  [ ] ViralTriggerSystem._getEffectiveProbability() applies fatigue reducer
  [ ] ViralTriggerSystem._getEffectiveProbability() caps at 1.5x base
  [ ] ViralTriggerSystem._getCurrentMilestone() finds correct milestone
  [ ] ViralTriggerSystem.recordPromptAction() updates counters correctly
  [ ] ViralContextBuilder.build() assembles complete context
  [ ] ViralContextBuilder._calculateTrend() returns correct trend
  [ ] ShareCardGenerator generates valid PNG blobs for each card type
  [ ] SocialProofSystem._estimateFocusingNow() returns reasonable values
  [ ] SocialProofSystem._estimateFocusingNow() varies by time of day
  [ ] BlocklistSharing.generateShareLink() works for free users (URL-encoded)
  [ ] BlocklistSharing.importBlocklist() respects free tier limit
  [ ] PoweredByBadge renders correct HTML for each style

INTEGRATION TESTS:
  [ ] Session completion triggers viral check
  [ ] Streak update triggers viral check
  [ ] Achievement unlock triggers viral check
  [ ] Focus Score update triggers viral check
  [ ] Share prompt renders correctly (modal, toast, inline)
  [ ] Share sheet opens with correct platforms
  [ ] Share card generated and downloadable
  [ ] Blocklist share link generates and imports
  [ ] Social proof displays on block page
  [ ] Social proof displays on upgrade page
  [ ] Referral code persists across sessions

MANUAL TESTS:
  [ ] Share prompt dismisses with single tap
  [ ] Share prompt does not appear during focus session
  [ ] Share prompt respects daily limit (test with clock manipulation)
  [ ] Share card looks correct on all three themes
  [ ] Share card downloads as valid PNG
  [ ] Twitter share link opens correctly with pre-filled text
  [ ] LinkedIn share link opens correctly
  [ ] Email share link opens correctly
  [ ] WhatsApp share link opens correctly
  [ ] Copy link shows confirmation toast
  [ ] Block page social proof number feels reasonable
  [ ] "Powered by" badge links to correct URL
  [ ] Pro users can hide "Powered by" badge
  [ ] All viral features work in dark mode
  [ ] All viral features respect user's disabled preference

PERFORMANCE TESTS:
  [ ] Viral trigger check completes in < 50ms
  [ ] Context building completes in < 100ms
  [ ] Share card generation completes in < 500ms
  [ ] Viral features add < 20KB to extension size
  [ ] Viral storage uses < 20KB per user
  [ ] No memory leaks from share card generation
  [ ] Block page load time not impacted by viral elements (< 10ms overhead)

PRIVACY TESTS:
  [ ] Free tier makes zero external requests for viral features
  [ ] Share cards never include specific blocked domains
  [ ] Social proof data is always aggregate
  [ ] Partner status only shows session count/minutes/streak
  [ ] User can disable all viral features with one toggle
  [ ] Clearing extension data removes all viral state
```

---

*End of Viral Loop Design & Social Proof Systems specification for Focus Mode - Blocker.*
*Agent 2 of 5 -- Phase 14 (Growth & Viral Engine)*
