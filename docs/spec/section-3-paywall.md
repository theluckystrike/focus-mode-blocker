# SECTION 3: PAYWALL SPECIFICATION

## Focus Mode - Blocker Chrome Extension

> **Document Version:** 1.0
> **Date:** February 10, 2026
> **Status:** Complete Specification
> **Pricing Reference:** Free / Pro $4.99/mo ($35.88/yr at $2.99/mo) / Team $3.99/user/mo
> **Lifetime Deal:** $49.99 (time-limited availability)

---

## 3.1 Paywall Trigger Points

### Master Trigger Table

| # | Trigger Name | Condition | User Action That Fires It | Paywall Type | Priority | Est. Conversion Rate | Pattern Used |
|---|-------------|-----------|--------------------------|-------------|----------|---------------------|-------------|
| T1 | **Weekly Report Unlock** | User completes 5th focus session (typically day 3-5) | Clicks notification badge or "Weekly Report" tab in popup | Blur/Preview modal inside popup | **PRIMARY** | 8-12% | #2 Preview/Blur + #8 Productivity Badge |
| T2 | **11th Site Block** | User attempts to add 11th website to blocklist | Clicks "Add Site" button with 10 sites already saved | Inline slide-down panel (not modal) | **SECONDARY** | 5-8% | #5 Storage Limit |
| T3 | **Nuclear Extension** | Free user's 1-hour nuclear session ends AND they attempt to start another within 5 minutes | Clicks "Start Nuclear" within 5 min of previous nuclear ending | Full-popup takeover with calming blue gradient | **TERTIARY** | 6-10% | #6 Feature Depth |
| T4 | **Focus Score Breakdown** | User taps/clicks their Focus Score number (visible from session 3+) | Clicks the Focus Score (e.g., "74") in popup or post-session screen | Inline expand with blur overlay | Supporting | 3-5% | #2 Preview/Blur + #8 Productivity Badge |
| T5 | **Pro Feature Lock Tap** | User clicks any feature with a PRO badge in settings or popup | Clicks a locked feature (wildcard blocking, custom timer, whitelist, calendar, etc.) | Slide-up feature detail panel | Supporting | 2-4% | #3 Lock Icon |
| T6 | **Post-Best-Session Offer** | User completes their longest-ever session OR hits a streak milestone (7, 14, 30, 60, 90, 180, 365 days) | Completes the session; offer appears on the completion screen | Celebratory overlay with countdown discount | Supporting | 4-7% | #13 Urgency Window |
| T7 | **Weekly Distraction Alert** | Every Sunday at 6:00 PM local time, starting after user's 7th day | System-generated Chrome notification + banner in popup on next open | Chrome notification + inline banner | Supporting | 3-5% | #9 Security Alert |
| T8 | **Export Attempt** | User clicks "Download Report," "Export CSV," or "Share Focus Card" | Clicks any export/share button | Inline lock tooltip expanding to mini-panel | Supporting | 2-3% | #11 Export Gate |
| T9 | **Sync Prompt** | User installs extension on a second Chrome profile or device (detected via account or fingerprint) | Opens extension on second device | Welcome-back modal with sync offer | Supporting | 5-8% | #12 Sync Gate |
| T10 | **Custom Timer Attempt** | User drags the timer duration slider past 25 minutes or tries to set a custom break interval | Interacts with timer configuration controls | Inline lock with slider snap-back animation | Supporting | 2-4% | #6 Feature Depth |

### Trigger Precedence Rules

When multiple triggers could fire simultaneously, use this priority order to prevent paywall fatigue:

1. **Only ONE paywall trigger per session.** If a user hits T2 (11th site) and T5 (Pro feature tap) in the same session, only the first one encountered fires. The second silently logs the event for analytics but does not display.
2. **T1 (Weekly Report) always takes priority** over all other triggers if it has not yet been shown. It fires once, on the 5th session.
3. **T6 (Post-Best-Session Offer) fires at most once per 14 days** regardless of milestone frequency. If a user hits a 7-day streak and a longest session in the same week, only the first milestone fires T6.
4. **T7 (Weekly Distraction Alert) fires at most once per 7 days** (every Sunday). It is suppressed if T1 or T6 fired within the previous 48 hours.
5. **Supporting triggers (T4, T5, T8, T10) are user-initiated** -- they only fire when the user explicitly clicks/taps a locked element. These do NOT count against the "one paywall per session" limit because they are intentional actions, not interruptions.
6. **T9 (Sync Prompt) fires exactly once per new device.** It is not subject to the session limit because it occurs on a new installation.

### Trigger Dependency Map

```
Install
  |
  v
Session 1-2: ZERO paywall triggers (no PRO badges, no locks visible)
  |
  v
Session 3: PRO badges appear on locked features in settings (visual only, no popups)
           Focus Score appears for the first time after session completion
           T4, T5, T10 become ARMED (will fire if user clicks locked elements)
  |
  v
Session 5: T1 (Weekly Report) fires -- PRIMARY conversion moment
           T2 becomes ARMED (fires when user hits 10-site limit)
           T3 becomes ARMED (fires on nuclear re-attempt)
  |
  v
Day 7+:    T7 (Weekly Distraction Alert) begins firing every Sunday
           T6 becomes ARMED (fires on personal-best session or streak milestone)
           T8 becomes ARMED (fires on export attempt)
  |
  v
Day 14+:   All triggers remain armed but NO escalation in frequency or aggressiveness
           Monthly summary replaces weekly report notification (1x/month, not 1x/week)
           Permanent "Go Pro" footer link added to popup (never removed)
  |
  v
Day 30+:   Long-term free user treatment (see Section 3.5)
           T9 fires if user installs on second device at any point
```

---

## 3.2 Paywall UI Specifications

### TRIGGER T1: Weekly Report Unlock (PRIMARY)

```
TRIGGER: Weekly Report Unlock
CONDITION: User completes 5th focus session. A notification badge ("1") appears
           on the extension icon. On next popup open, the "Weekly Report" tab
           shows a blurred preview. Fires ONCE -- if dismissed, does not re-fire
           as a modal. The blurred report tab remains permanently accessible.
MODAL TYPE: Inline blur overlay inside popup (not a blocking modal)
```

**VISUAL SPEC:**

```
┌─────────────────────────────────────────────────────┐
│  [Focus Mode - Blocker]              [Settings] [x] │
│                                                     │
│  ┌──────┐  ┌──────────────┐  ┌──────────────┐      │
│  │Today │  │ Weekly Report │  │   Settings   │      │
│  └──────┘  └──────────────┘  └──────────────┘      │
│            ▲ active tab, pulsing blue dot            │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  YOUR FIRST WEEKLY FOCUS REPORT             │    │
│  │  ─────────────────────────────────────────  │    │
│  │                                             │    │
│  │  This week's highlights:                    │    │
│  │  ✓ 127 distractions blocked                 │    │
│  │  ✓ 11 hours 23 minutes focused              │    │
│  │  ✓ 5 sessions completed                     │    │
│  │                                             │    │
│  │  ┌─────────────────────────────────────┐    │    │
│  │  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │    │    │
│  │  │  Peak Focus Time    ░░░░░░░░░░░░░  │    │    │
│  │  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │    │    │
│  │  │  Top Distraction    ░░░░░░░░░░░░░  │    │    │
│  │  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │    │    │
│  │  │  Focus Trend        ░░▓▓░▓▓▓░░░░  │    │    │
│  │  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │    │    │
│  │  │  Weekly Comparison  ░░░░░░░░░░░░░  │    │    │
│  │  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │    │    │
│  │  │         🔒 PRO                     │    │    │
│  │  └─────────────────────────────────────┘    │    │
│  │                                             │    │
│  │  ┌───────────────────────────────────────┐  │    │
│  │  │    Unlock Your Full Focus Report      │  │    │
│  │  │         $4.99/mo  |  $2.99/mo annual  │  │    │
│  │  └───────────────────────────────────────┘  │    │
│  │           primary CTA button (blue)         │    │
│  │                                             │    │
│  │          Maybe later  (text link, grey)     │    │
│  │                                             │    │
│  │  Less than the cost of one coffee per month │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**COPY:**

- **Headline:** "Your First Weekly Focus Report is Ready"
- **Stats line (unblurred):** "This week you blocked 127 distractions and focused for 11 hours 23 minutes."
- **Blurred section labels (visible but content blurred):** "Peak Focus Time," "Top Distraction," "Focus Trend," "Weekly Comparison"
- **Primary CTA:** "Unlock Your Full Focus Report" (button)
- **Price line:** "$4.99/mo | $2.99/mo annual" (inside or below button)
- **Secondary dismiss:** "Maybe later" (grey text link below CTA)
- **Anchor line:** "Less than the cost of one coffee per month"

**BEHAVIOR:**

- **Dismissable:** Yes. "Maybe later" closes the overlay and returns user to the "Today" tab.
- **Remember dismissal:** Yes. The modal overlay does NOT re-appear. However, the "Weekly Report" tab remains permanently visible with blurred content behind a subtle lock icon. Users can re-visit and re-trigger the CTA voluntarily at any time.
- **Animation:** Blur content fades in over 400ms when user clicks the "Weekly Report" tab. The unblurred stats (127 distractions, 11h 23m) count up from 0 over 1.2 seconds using an easing animation.
- **Frequency cap:** Modal fires ONCE per user lifetime. The blurred tab is permanent and always accessible.
- **Notification badge:** A blue "1" badge appears on the extension icon when the 5th session completes. The badge clears when the user opens the popup and views the Weekly Report tab (regardless of whether they upgrade).

**IMPLEMENTATION NOTES:**

- The blurred section must use CSS `filter: blur(8px)` on real data, NOT placeholder text. The actual analytics data is computed and rendered, then blurred. This ensures users can see the shape of bar charts, the length of text values, and the general trend direction -- enough to know the data is real and personalized.
- The "Focus Trend" graph should show a small line/bar chart silhouette that is recognizably a chart but unreadable. Use real session data to generate the chart, then apply the blur.
- The three unblurred stats (distractions blocked, focus time, sessions) serve as proof that the extension has been tracking valuable data all along.

---

### TRIGGER T2: 11th Site Block (SECONDARY)

```
TRIGGER: 11th Site Block
CONDITION: User has exactly 10 sites in their blocklist and clicks "Add Site"
           to add an 11th. The URL input accepts the text but does NOT save it.
           Instead, the upgrade panel slides down between the input field and
           the existing blocklist.
MODAL TYPE: Inline slide-down panel (NOT a modal -- stays within the blocklist UI)
```

**VISUAL SPEC:**

```
┌─────────────────────────────────────────────────────┐
│  Blocked Sites                          10/10 used  │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  ┌─────────────────────────────────┐  ┌──────────┐ │
│  │ reddit.com (entered by user)    │  │ + Add    │ │
│  └─────────────────────────────────┘  └──────────┘ │
│                                          ▲ disabled │
│  ┌─────────────────────────────────────────────┐    │
│  │                                             │    │
│  │  You've blocked your top 10 distractions.   │    │
│  │  Nice.                                      │    │
│  │                                             │    │
│  │  Serious about focus? Unlock:               │    │
│  │                                             │    │
│  │  ✓ Unlimited blocked sites                  │    │
│  │  ✓ Wildcard patterns (*.reddit.com)         │    │
│  │  ✓ Whitelist mode — block everything        │    │
│  │    except your work tools                   │    │
│  │  ✓ 6 pre-built category lists               │    │
│  │                                             │    │
│  │  ┌───────────────────────────────────────┐  │    │
│  │  │   Upgrade to Pro — $4.99/mo           │  │    │
│  │  └───────────────────────────────────────┘  │    │
│  │            primary CTA button (blue)        │    │
│  │                                             │    │
│  │          Keep my 10 sites (text link)       │    │
│  │                                             │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  1. youtube.com                         [x] │    │
│  │  2. twitter.com                         [x] │    │
│  │  3. reddit.com                          [x] │    │
│  │  ...                                        │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**COPY:**

- **Headline:** "You've blocked your top 10 distractions. Nice."
- **Body:** "Serious about focus? Unlock:"
- **Bullet list:**
  - "Unlimited blocked sites"
  - "Wildcard patterns (*.reddit.com)"
  - "Whitelist mode -- block everything except your work tools"
  - "6 pre-built category lists"
- **Primary CTA:** "Upgrade to Pro -- $4.99/mo"
- **Secondary dismiss:** "Keep my 10 sites"

**BEHAVIOR:**

- **Dismissable:** Yes. "Keep my 10 sites" collapses the panel and clears the 11th URL from the input field.
- **Remember dismissal:** Yes, for 72 hours. If the user dismisses, the panel does NOT re-appear for 72 hours, even if they try to add an 11th site again during that window. Instead, a brief inline message appears: "Block list full (10/10). Remove a site or upgrade to Pro." with a small "Upgrade" text link.
- **Animation:** Panel slides down over 300ms with a subtle ease-out curve. The existing blocklist items shift down to accommodate.
- **Frequency cap:** Once per 72 hours. After 3 total dismissals, the panel never re-appears. Only the brief inline message remains.
- **Progress indicator:** The "10/10 used" counter in the header turns from the default color to amber at 8/10, and to red at 10/10. This visual cue begins before the paywall fires, priming the user.

**PRE-TRIGGER BEHAVIOR (sites 8-10):**

| Sites Used | Counter Color | Add Button State | Additional UI |
|-----------|--------------|-----------------|---------------|
| 1-7 | Default (grey/white) | Active (normal) | None |
| 8 | Amber | Active | Counter text changes to "8/10 sites used" |
| 9 | Amber | Active | Subtle tooltip on Add button: "1 slot remaining" |
| 10 | Red | Active (last use) | Counter shows "10/10 sites used" in red |
| 10 (Add clicked) | Red | Disabled after panel appears | T2 paywall fires |

---

### TRIGGER T3: Nuclear Extension (TERTIARY)

```
TRIGGER: Nuclear Extension
CONDITION: Free user completes a 1-hour nuclear session. Within 5 minutes of
           the session ending, user opens the popup and clicks "Start Nuclear"
           again. The paywall fires INSTEAD of starting a new session.
MODAL TYPE: Full-popup takeover with calming blue gradient background
```

**VISUAL SPEC:**

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │          ◉ ─ ─ ─ ─ ─ ─ ─ ─ ◉               │    │
│  │         (progress circle, 100% complete)     │    │
│  │                                             │    │
│  │  That hour flew by, didn't it?              │    │
│  │                                             │    │
│  │  You just crushed a distraction-free hour.  │    │
│  │  Your session stats:                        │    │
│  │                                             │    │
│  │  ┌─────────────────────────────────────┐    │    │
│  │  │  Distractions:  0 (locked in)       │    │    │
│  │  │  Focus time:    +60 min to streak   │    │    │
│  │  │  Block attempts: 12 (all stopped)   │    │    │
│  │  └─────────────────────────────────────┘    │    │
│  │                                             │    │
│  │  With Pro, lock in for up to 24 hours.      │    │
│  │  Completely unbypassable. No more "just     │    │
│  │  one more hour" -- set it and forget it.    │    │
│  │                                             │    │
│  │  ┌───────────────────────────────────────┐  │    │
│  │  │   Go Pro — Lock In for Longer         │  │    │
│  │  └───────────────────────────────────────┘  │    │
│  │            primary CTA button (blue)        │    │
│  │                                             │    │
│  │  ┌───────────────────────────────────────┐  │    │
│  │  │   Start Another Free Hour             │  │    │
│  │  └───────────────────────────────────────┘  │    │
│  │         secondary button (outline/ghost)    │    │
│  │                                             │    │
│  └─────────────────────────────────────────────┘    │
│                 gradient: #1a1a2e → #16213e         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**COPY:**

- **Headline:** "That hour flew by, didn't it?"
- **Body:** "You just crushed a distraction-free hour."
- **Stats block:**
  - "Distractions: 0 (locked in)"
  - "Focus time: +60 min to streak"
  - "Block attempts: 12 (all stopped)" (dynamic -- shows actual number)
- **Upgrade pitch:** "With Pro, lock in for up to 24 hours. Completely unbypassable. No more 'just one more hour' -- set it and forget it."
- **Primary CTA:** "Go Pro -- Lock In for Longer"
- **Secondary:** "Start Another Free Hour"

**BEHAVIOR:**

- **Dismissable:** Yes. "Start Another Free Hour" starts a normal 1-hour nuclear session immediately and closes the paywall.
- **Remember dismissal:** No. This trigger can fire every time the user re-attempts nuclear within 5 minutes of completion. However, it is subject to the global "one paywall per session" rule.
- **Animation:** Fade in over 500ms. The progress circle animates from 0% to 100% over 800ms as the panel appears, reinforcing the completed session.
- **Frequency cap:** Maximum once per day. If the user starts multiple nuclear sessions in one day, only the first re-attempt shows T3. Subsequent re-attempts go directly to the session start.
- **5-minute window:** The 5-minute timer starts when the nuclear session ends. If the user waits longer than 5 minutes, no paywall fires -- they go straight to a new nuclear session. This ensures the trigger only fires when the user is in a state of productive momentum.

---

### TRIGGER T4: Focus Score Breakdown

```
TRIGGER: Focus Score Breakdown
CONDITION: User clicks/taps the Focus Score number displayed in the popup header
           or on the post-session completion screen. Available from session 3+.
MODAL TYPE: Inline expand with blur overlay (expands below the score)
```

**VISUAL SPEC:**

```
┌─────────────────────────────────────────────────────┐
│  Today's Focus                                      │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  Focus Score:  74                                   │
│                ▲ clickable, underlined               │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  FOCUS SCORE BREAKDOWN                      │    │
│  │  ─────────────────────────────────          │    │
│  │                                             │    │
│  │  Overall:          74 / 100                 │    │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░          │    │
│  │                                             │    │
│  │  Concentration     ░░░░░░░░░░░  🔒 PRO     │    │
│  │  Consistency       ░░░░░░░░░░░  🔒 PRO     │    │
│  │  Distraction Rate  ░░░░░░░░░░░  🔒 PRO     │    │
│  │  Session Length    ░░░░░░░░░░░  🔒 PRO     │    │
│  │  Streak Bonus      ░░░░░░░░░░░  🔒 PRO     │    │
│  │                                             │    │
│  │  Your score could be 90+ with Pro insights  │    │
│  │  that show exactly where to improve.        │    │
│  │                                             │    │
│  │  ┌───────────────────────────────────────┐  │    │
│  │  │   See My Full Breakdown               │  │    │
│  │  └───────────────────────────────────────┘  │    │
│  │           primary CTA button (blue)         │    │
│  │                                             │    │
│  │          Dismiss  (text link, grey)         │    │
│  │                                             │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**COPY:**

- **Headline:** "Focus Score Breakdown"
- **Score display:** "Overall: 74 / 100" with a progress bar (74% filled, colored segment)
- **Breakdown categories (all blurred with PRO lock):**
  - "Concentration"
  - "Consistency"
  - "Distraction Rate"
  - "Session Length"
  - "Streak Bonus"
- **Body:** "Your score could be 90+ with Pro insights that show exactly where to improve."
- **Primary CTA:** "See My Full Breakdown"
- **Secondary dismiss:** "Dismiss"

**BEHAVIOR:**

- **Dismissable:** Yes. "Dismiss" collapses the expanded panel back to just the score number.
- **Remember dismissal:** No. The score is always clickable and the breakdown always shows the blurred state. This is a user-initiated action, not an interruption.
- **Animation:** Expand downward over 300ms. Blurred bars shimmer subtly (CSS animation, 3-second loop) to draw attention to the locked content.
- **Frequency cap:** None. User can click the score as many times as they want. This is a passive, user-initiated trigger.

---

### TRIGGER T5: Pro Feature Lock Tap

```
TRIGGER: Pro Feature Lock Tap
CONDITION: User clicks any feature in the settings or popup that has a PRO badge.
           PRO badges appear starting at session 3.
MODAL TYPE: Slide-up feature detail panel (bottom sheet style)
```

**VISUAL SPEC:**

```
┌─────────────────────────────────────────────────────┐
│  Settings                                           │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  Blocking                                           │
│  ├─ ✓ Website blocklist (10 sites)                  │
│  ├─ ✓ Pre-built lists (Social + News)               │
│  ├─ 🔒 Wildcard patterns              PRO          │
│  ├─ 🔒 Whitelist mode                 PRO          │
│  └─ 🔒 Redirect to productive sites   PRO          │
│       ▲ user clicks this                            │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  ╭─────────────────────────────────────────╮│    │
│  │  │        [illustration/icon area]         ││    │
│  │  │    Redirect to Productive Sites         ││    │
│  │  │                                         ││    │
│  │  │  Instead of seeing a block page, get    ││    │
│  │  │  sent straight to a productive site.    ││    │
│  │  │                                         ││    │
│  │  │  Examples:                              ││    │
│  │  │  reddit.com  →  notion.so               ││    │
│  │  │  youtube.com →  coursera.org            ││    │
│  │  │  twitter.com →  your-project.com        ││    │
│  │  │                                         ││    │
│  │  │  ┌─────────────────────────────────┐    ││    │
│  │  │  │  Unlock with Pro — $4.99/mo     │    ││    │
│  │  │  └─────────────────────────────────┘    ││    │
│  │  │       primary CTA button (blue)         ││    │
│  │  │                                         ││    │
│  │  │       Not now (text link, grey)         ││    │
│  │  ╰─────────────────────────────────────────╯│    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**COPY (varies per feature -- full copy table below):**

| Locked Feature | Panel Headline | Panel Body | Example/Illustration |
|---------------|---------------|-----------|---------------------|
| Wildcard patterns | "Block Entire Domains" | "Block *.reddit.com to catch every subdomain. No more old.reddit.com sneaking through." | `*.reddit.com` blocks `old.reddit.com`, `new.reddit.com`, `i.reddit.com` |
| Whitelist mode | "Block Everything Except Work" | "Flip the script. Instead of blocking distractions one by one, block the entire internet and allow only your work tools." | Allow list: `docs.google.com`, `slack.com`, `github.com` -- everything else blocked |
| Redirect to productive sites | "Redirect to Productive Sites" | "Instead of seeing a block page, get sent straight to a productive site." | `reddit.com` -> `notion.so`, `youtube.com` -> `coursera.org` |
| Custom timer durations | "Focus Your Way" | "Set any duration from 1 minute to 4 hours. Create 50/10, 90/20, or any cycle that fits your work style." | Timer wheel showing 50 min focus / 10 min break |
| Calendar integration | "Auto-Focus from Your Calendar" | "Connect Google Calendar. Focus Mode activates automatically during your 'Deep Work' blocks. Zero friction, perfect focus." | Calendar event "Deep Work 9-11am" with Focus Mode icon overlay |
| Cross-device sync | "Focus Everywhere" | "Your blocklist, schedules, and streaks -- synced across every device. Block Reddit on your laptop and it's blocked on your desktop too." | Two device silhouettes with sync arrows between them |
| Extended nuclear (24hr) | "Lock In for a Full Day" | "The 1-hour nuclear option works. Now imagine 24 hours of zero distractions. Set it Sunday night, focus all day Monday." | Clock face showing 24-hour lock |
| Full ambient sounds | "Your Focus Soundtrack" | "15+ ambient sounds. Mix rain with lo-fi. Layer fireplace with white noise. Create your perfect focus environment." | Sound mixer UI with 3 sliders |
| AI recommendations | "Your Personal Focus Coach" | "AI analyzes your patterns and tells you exactly when, where, and how you focus best. 'Your peak focus is Tuesday 9-11 AM.'" | Insight card mockup |
| Streak recovery | "Protect Your Streak" | "Life happens. With streak recovery, one missed day doesn't erase weeks of progress. Your 14-day streak survives." | Streak calendar with one day marked "recovered" |
| Custom block page | "Make the Block Page Yours" | "Custom messages, your own images, rotating quotes from your favorite authors. See something inspiring every time you resist a distraction." | Block page with custom quote and background |
| Context profiles | "Work Mode. Study Mode. Your Mode." | "Different blocking rules for different contexts. Strict during work, relaxed on weekends -- all automatic." | Two profile cards: "Work" (strict) and "Personal" (moderate) |

**BEHAVIOR (applies to all T5 variants):**

- **Dismissable:** Yes. "Not now" slides the panel back down.
- **Remember dismissal:** Per-feature, for 48 hours. If a user dismisses the Wildcard panel, clicking Wildcard again within 48 hours shows a minimal tooltip ("Pro feature -- Upgrade") instead of the full panel. After 48 hours, the full panel is eligible to show again.
- **Animation:** Slide up from bottom of popup over 350ms. Background dims to 50% opacity.
- **Frequency cap:** Full panel shows at most 2 times per day across all T5 variants combined. After 2 full-panel views in a day, subsequent taps show only the minimal tooltip.

---

### TRIGGER T6: Post-Best-Session Offer (Urgency Window)

```
TRIGGER: Post-Best-Session Offer
CONDITION: User completes their longest-ever focus session (must exceed previous
           best by at least 5 minutes) OR reaches a streak milestone
           (7, 14, 30, 60, 90, 180, 365 consecutive days).
MODAL TYPE: Celebratory overlay with confetti animation and countdown timer
```

**VISUAL SPEC:**

```
┌─────────────────────────────────────────────────────┐
│  ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ (confetti)       │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │                                             │    │
│  │         NEW PERSONAL BEST!                  │    │
│  │         ━━━━━━━━━━━━━━━━━━                  │    │
│  │                                             │    │
│  │    🏆  67 minutes of deep focus             │    │
│  │         Previous best: 52 minutes           │    │
│  │                                             │    │
│  │    You're on a 7-day streak.                │    │
│  │    That puts you in the top 15% of          │    │
│  │    Focus Mode users.                        │    │
│  │                                             │    │
│  │  ─────────────────────────────────────────  │    │
│  │                                             │    │
│  │    Celebrate your momentum:                 │    │
│  │    30% off Pro for the next 24 hours        │    │
│  │                                             │    │
│  │    $4.99  →  $3.49/mo                       │    │
│  │    $2.99  →  $2.09/mo (annual)              │    │
│  │                                             │    │
│  │    Offer expires in: 23:47:12               │    │
│  │                                             │    │
│  │  ┌───────────────────────────────────────┐  │    │
│  │  │   Claim 30% Off                       │  │    │
│  │  └───────────────────────────────────────┘  │    │
│  │           primary CTA button (gold)         │    │
│  │                                             │    │
│  │          Keep focusing for free             │    │
│  │                (text link)                  │    │
│  │                                             │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**COPY (Personal Best variant):**

- **Headline:** "New Personal Best!"
- **Achievement:** "[X] minutes of deep focus" (dynamic)
- **Comparison:** "Previous best: [Y] minutes" (dynamic)
- **Social proof:** "You're on a [Z]-day streak. That puts you in the top [N]% of Focus Mode users." (dynamic percentile, calculated from anonymized aggregate data)
- **Offer intro:** "Celebrate your momentum:"
- **Discount:** "30% off Pro for the next 24 hours"
- **Price display:** "$4.99 -> $3.49/mo" and "$2.99 -> $2.09/mo (annual)" (show both, strikethrough original)
- **Countdown:** "Offer expires in: [HH:MM:SS]" (live countdown from 24 hours)
- **Primary CTA:** "Claim 30% Off" (gold/amber button, not blue -- signals special offer)
- **Secondary dismiss:** "Keep focusing for free"

**COPY (Streak Milestone variant):**

- **Headline for 7-day:** "One Week Streak!"
- **Headline for 14-day:** "Two Week Streak!"
- **Headline for 30-day:** "30-Day Focus Master!"
- **Headline for 60-day:** "60 Days of Discipline!"
- **Headline for 90-day:** "Quarter of Focus!"
- **Headline for 180-day:** "Half-Year Focus Legend!"
- **Headline for 365-day:** "One Year of Focus. You're Unstoppable."
- **Body:** "You've focused for [total hours] hours across [total sessions] sessions. That's an estimated [hours saved] hours of distraction avoided."

**BEHAVIOR:**

- **Dismissable:** Yes. "Keep focusing for free" closes the overlay.
- **Remember dismissal:** Yes. If dismissed, the 30% discount remains valid for 24 hours but is only accessible via a small gold banner at the top of the popup: "30% off Pro -- [HH:MM] remaining." This banner disappears when the timer expires.
- **Animation:** Confetti particles (15-20 small colored squares/circles) fall for 2 seconds, then stop. The achievement card fades in over 500ms. The countdown timer ticks in real-time.
- **Frequency cap:** Maximum once per 14 days. Only the first qualifying event in any 14-day window triggers the overlay. Subsequent milestones within the window are celebrated with a smaller, non-paywall badge: "New streak milestone! [X] days."
- **Discount mechanics:** The 30% discount code is generated server-side with a 24-hour expiration timestamp. If the user clicks "Claim 30% Off" at hour 23, the discount is still applied to their first payment. The discount applies to the FIRST billing period only (first month or first year), then reverts to standard pricing.
- **Discount amounts:**
  - Monthly: $4.99 -> $3.49 (first month)
  - Annual: $35.88 -> $25.12 (first year, equating to $2.09/mo)
  - Lifetime: $49.99 -> $34.99

---

### TRIGGER T7: Weekly Distraction Alert

```
TRIGGER: Weekly Distraction Alert
CONDITION: Every Sunday at 6:00 PM local time, starting after the user's 7th
           day with the extension installed. Only fires if the user had at least
           1 focus session that week.
MODAL TYPE: Chrome notification (external) + inline banner in popup (internal)
```

**VISUAL SPEC (Chrome Notification):**

```
┌─────────────────────────────────────────────────────┐
│  Focus Mode - Blocker              Sunday 6:00 PM   │
│                                                     │
│  Weekly Focus Check-In                              │
│                                                     │
│  This week: 3.5 hours on distracting sites outside  │
│  focus sessions. That's 2 full workdays per month.  │
│                                                     │
│  [See Full Report]          [Dismiss]               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**VISUAL SPEC (Inline Banner -- appears in popup on next open after notification):**

```
┌─────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────┐    │
│  │  ⚠ Weekly Check-In                     [x]  │    │
│  │                                             │    │
│  │  You lost an estimated 3.5 hours to         │    │
│  │  distracting sites this week.               │    │
│  │                                             │    │
│  │  Pro members get:                           │    │
│  │  • Auto-scheduled focus sessions            │    │
│  │  • Smart distraction alerts                 │    │
│  │  • Full weekly trend reports                │    │
│  │                                             │    │
│  │  [See How Pro Helps]    [Dismiss]           │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  (rest of normal popup below)                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**COPY:**

- **Notification headline:** "Weekly Focus Check-In"
- **Notification body:** "This week: [X.X] hours on distracting sites outside focus sessions. That's [Y] full workdays per month." (dynamic calculation: weekly hours x 4, divided by 8-hour workday)
- **Banner headline:** "Weekly Check-In"
- **Banner body:** "You lost an estimated [X.X] hours to distracting sites this week."
- **Banner features:** "Pro members get: Auto-scheduled focus sessions, Smart distraction alerts, Full weekly trend reports"
- **Banner CTA:** "See How Pro Helps"
- **Banner dismiss:** "Dismiss" or [x] button

**BEHAVIOR:**

- **Dismissable:** Yes. Both the Chrome notification and inline banner are independently dismissable.
- **Remember dismissal:** The inline banner dismisses for 7 days (until next Sunday). The Chrome notification uses standard Chrome notification dismiss behavior.
- **Animation:** Banner slides down from the top of the popup over 300ms.
- **Frequency cap:** Once per week (Sundays only). Suppressed if T1 or T6 fired within the previous 48 hours. Does NOT fire if the user had zero sessions that week (no data = no alert).
- **Data calculation:** "Hours on distracting sites" is calculated from blocked-site visit attempts tracked during non-focus-session time. If the extension detects the user navigating to a blocked site outside an active session, it logs the timestamp. The difference between navigation-to-blocked-site and navigation-away gives an estimated time. This data is collected passively and stored locally.

---

### TRIGGER T8: Export Attempt

```
TRIGGER: Export Attempt
CONDITION: User clicks any export, download, or share button anywhere in the UI.
MODAL TYPE: Inline lock tooltip expanding to mini-panel
```

**VISUAL SPEC:**

```
┌─────────────────────────────────────────────────────┐
│  This Week's Stats                                  │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  Focus time:   8h 42m                               │
│  Sessions:     12                                   │
│  Distractions: 187 blocked                          │
│                                                     │
│  [Download PDF 🔒]  [Export CSV 🔒]  [Share 🔒]     │
│        ▲ user clicks                                │
│  ┌─────────────────────────────────────────────┐    │
│  │  Export is a Pro feature.                   │    │
│  │                                             │    │
│  │  Download PDF reports, export raw data      │    │
│  │  to CSV, or share focus achievement cards   │    │
│  │  with your network.                         │    │
│  │                                             │    │
│  │  [Upgrade to Pro]        [Close]            │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**COPY:**

- **Body:** "Export is a Pro feature. Download PDF reports, export raw data to CSV, or share focus achievement cards with your network."
- **Primary CTA:** "Upgrade to Pro"
- **Secondary dismiss:** "Close"

**BEHAVIOR:**

- **Dismissable:** Yes.
- **Remember dismissal:** No. This fires every time an export button is clicked, because it is user-initiated.
- **Animation:** Tooltip expands from the clicked button's position over 250ms.
- **Frequency cap:** None (user-initiated).

---

### TRIGGER T9: Sync Prompt

```
TRIGGER: Sync Prompt
CONDITION: User installs the extension on a second Chrome profile or device.
           Detection method: On first install, generate a unique user_id and store
           it in chrome.storage.sync. On second install, check for existing
           user_id in sync storage. If found, the user already has the extension
           elsewhere.
MODAL TYPE: Welcome-back modal (full popup, appears on first open of the new install)
```

**VISUAL SPEC:**

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │                                             │    │
│  │  Welcome back!                              │    │
│  │                                             │    │
│  │  We found your Focus Mode setup on          │    │
│  │  another device.                            │    │
│  │                                             │    │
│  │  Your other device has:                     │    │
│  │  • 12 blocked sites                        │    │
│  │  • 2 active schedules                      │    │
│  │  • A 14-day focus streak                   │    │
│  │  • Custom block page settings              │    │
│  │                                             │    │
│  │  Sync everything to this device instantly?  │    │
│  │                                             │    │
│  │  ┌───────────────────────────────────────┐  │    │
│  │  │   Sync My Setup — Go Pro              │  │    │
│  │  └───────────────────────────────────────┘  │    │
│  │            primary CTA button (blue)        │    │
│  │                                             │    │
│  │  ┌───────────────────────────────────────┐  │    │
│  │  │   Start Fresh on This Device          │  │    │
│  │  └───────────────────────────────────────┘  │    │
│  │         secondary button (outline)          │    │
│  │                                             │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**COPY:**

- **Headline:** "Welcome back!"
- **Body:** "We found your Focus Mode setup on another device."
- **Details (dynamic):** "Your other device has: [X] blocked sites, [Y] active schedules, A [Z]-day focus streak, Custom block page settings"
- **Primary CTA:** "Sync My Setup -- Go Pro"
- **Secondary:** "Start Fresh on This Device"

**BEHAVIOR:**

- **Dismissable:** Yes. "Start Fresh on This Device" starts the normal new-user onboarding flow.
- **Remember dismissal:** Yes. This prompt fires exactly ONCE per new device installation. Never re-appears on the same device.
- **Animation:** Fade in over 400ms on first popup open.
- **Frequency cap:** Once per device, ever.

---

### TRIGGER T10: Custom Timer Attempt

```
TRIGGER: Custom Timer Attempt
CONDITION: User interacts with the timer duration control and attempts to set
           a duration other than the default 25/5. This includes dragging a
           slider, clicking +/- buttons, or typing a custom number.
MODAL TYPE: Inline lock with slider snap-back animation
```

**VISUAL SPEC:**

```
┌─────────────────────────────────────────────────────┐
│  Focus Timer                                        │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  Duration:                                          │
│                                                     │
│  15    20   [25]   30    35    40    45    50   60  │
│  ─────────── ● ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│              ▲                                      │
│         locked at 25     30+ is greyed out          │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  Custom durations are a Pro feature.        │    │
│  │  Focus for 50, 90, or even 240 minutes.     │    │
│  │                                             │    │
│  │  [Unlock Custom Timers]         [Use 25min] │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**COPY:**

- **Body:** "Custom durations are a Pro feature. Focus for 50, 90, or even 240 minutes."
- **Primary CTA:** "Unlock Custom Timers"
- **Secondary:** "Use 25min"

**BEHAVIOR:**

- **Dismissable:** Yes. "Use 25min" snaps the slider back to 25 and closes the tooltip.
- **Remember dismissal:** Per session. Dismissal lasts until the user closes and re-opens the popup.
- **Animation:** When the user drags the slider past 25, the handle moves with the finger/mouse but "resists" (rubber-band effect). On release, the handle snaps back to 25 with a bounce animation (200ms). Simultaneously, the tooltip fades in below the slider over 200ms.
- **Frequency cap:** Once per popup open. If dismissed once, further slider interactions in the same popup session do not re-trigger the tooltip -- the slider simply stays locked at 25 with greyed-out values beyond it.

---

## 3.3 Upgrade Flow

### 3.3.1 Flow Overview

Every paywall CTA button leads to the same **Upgrade Flow**, with context passed from the trigger to personalize the experience. There are two possible upgrade paths:

- **Path A: In-Extension Upgrade** (preferred for monthly/annual subscriptions)
- **Path B: External Web Upgrade** (fallback, and required for lifetime deals)

### 3.3.2 Path A: In-Extension Upgrade (Primary)

**Technology:** ExtensionPay (extensionpay.com) or Stripe Payment Links embedded via `chrome.tabs.create` to a hosted checkout page at `https://focusmodeblocker.com/checkout`.

**Step-by-step flow:**

```
STEP 1: User hits any paywall trigger (T1-T10)
        ↓
STEP 2: User clicks Primary CTA button
        ↓
STEP 3: Plan Selection Panel appears IN the popup
        (No new tab yet -- keep user in the extension)
        ↓
STEP 4: User selects plan → new tab opens to checkout
        ↓
STEP 5: Payment page (hosted checkout)
        ↓
STEP 6: Payment success → redirect to success page
        ↓
STEP 7: Extension detects upgrade → immediate unlock
        ↓
STEP 8: Welcome experience in the popup
```

**STEP 3: Plan Selection Panel**

This panel appears inside the popup immediately after the user clicks any CTA button. It replaces the paywall content with a plan picker.

```
┌─────────────────────────────────────────────────────┐
│  Choose Your Plan                              [x]  │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  ┌──────────────────┐  ┌──────────────────────────┐ │
│  │  Monthly          │  │  Annual     BEST VALUE  │ │
│  │                   │  │  ────────────────────── │ │
│  │  $4.99/mo         │  │  $2.99/mo               │ │
│  │                   │  │  $35.88 billed annually  │ │
│  │                   │  │                          │ │
│  │                   │  │  Save 40%                │ │
│  │  [Select]         │  │  [Select]   ← default   │ │
│  │                   │  │  highlighted             │ │
│  └──────────────────┘  └──────────────────────────┘ │
│                                                     │
│  ┌────────────────────────────────────────────────┐ │
│  │  Lifetime        ONE-TIME PAYMENT              │ │
│  │  $49.99 — pay once, use forever                │ │
│  │  [Select]                                      │ │
│  └────────────────────────────────────────────────┘ │
│                                                     │
│  ✓ 7-day money-back guarantee                       │
│  ✓ Cancel anytime (monthly/annual)                  │
│  ✓ Instant activation                               │
│                                                     │
│  ────────────────────────────────────────────────── │
│  What you get with Pro:                             │
│  ✓ Unlimited blocked sites                          │
│  ✓ Full weekly & monthly reports                    │
│  ✓ Custom timer durations (1-240 min)               │
│  ✓ 24-hour nuclear option                           │
│  ✓ Cross-device sync                                │
│  ✓ Wildcard & whitelist blocking                    │
│  ✓ Calendar integration                             │
│  ✓ 15+ ambient sounds with mixing                   │
│  ✓ Focus Score breakdown & AI insights              │
│  ✓ Streak recovery                                  │
│  ✓ Export reports (PDF, CSV)                         │
│  ✓ Custom block pages                               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Plan Selection Panel behavior:**

- The **Annual** plan is pre-selected and visually highlighted with a "BEST VALUE" badge, a green or blue border, and a slightly larger card.
- The **Monthly** plan is shown at full price with no badge.
- The **Lifetime** plan is shown below as a full-width row. It is NOT pre-selected but is always visible for users who prefer one-time payments.
- If the user arrived via T6 (discount offer), all prices show strikethrough original prices with the discounted price below. The "BEST VALUE" badge changes to "BEST VALUE -- 30% OFF."
- The feature list at the bottom is always visible to reinforce value.

**STEP 4: Checkout Page**

When the user clicks "Select" on any plan, a new Chrome tab opens:

- **URL format:** `https://focusmodeblocker.com/checkout?plan={monthly|annual|lifetime}&source={trigger_id}&discount={code|none}&uid={user_id}`
- **Monthly checkout URL example:** `https://focusmodeblocker.com/checkout?plan=monthly&source=T1&discount=none&uid=abc123`
- **Discounted checkout URL example:** `https://focusmodeblocker.com/checkout?plan=annual&source=T6&discount=BEST30&uid=abc123`

**STEP 5: Payment Page Details**

The checkout page is a single-page hosted payment form (Stripe Elements or Stripe Checkout).

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Focus Mode - Blocker Pro                                   │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Your Plan: Annual ($2.99/mo, billed $35.88/yr)      │  │
│  │  [Change plan]                                        │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  Your Focus Stats (from extension data):                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Sessions completed: 12                               │  │
│  │  Focus time: 8h 42m                                   │  │
│  │  Distractions blocked: 187                            │  │
│  │  Current streak: 7 days                               │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  Payment                                                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Email:          [________________________]           │  │
│  │  Card number:    [________________________]           │  │
│  │  Expiry:         [____]  CVC: [____]                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  OR                                                         │
│                                                             │
│  [Pay with Google Pay]     [Pay with Apple Pay]             │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           Pay $35.88 Now                              │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ✓ 7-day money-back guarantee                               │
│  ✓ Cancel anytime — no questions asked                      │
│  ✓ Secure payment via Stripe                                │
│  ✓ Your data stays on your device — we only store email     │
│                                                             │
│  By purchasing, you agree to our Terms of Service and       │
│  Privacy Policy.                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Payment page specifications:**

- **Email field:** Required. This creates the user account for license management.
- **Payment methods:** Stripe card input, Google Pay, Apple Pay (via Stripe Payment Request Button API).
- **"Your Focus Stats" block:** Pulled from `chrome.storage.local` and passed via URL parameters or a secure API call. These stats serve as social proof of value already delivered. They reinforce: "You already got this much value for free -- imagine what Pro unlocks."
- **Trust signals:** "7-day money-back guarantee," "Cancel anytime," "Secure payment via Stripe," and "Your data stays on your device" are displayed below the payment button.
- **Plan switcher:** A "Change plan" link above the payment form lets users toggle between Monthly, Annual, and Lifetime without going back to the extension popup.

**STEP 6: Payment Success**

After successful payment, the Stripe checkout redirects to:

`https://focusmodeblocker.com/welcome?plan={plan}&uid={user_id}`

This page shows:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│           ✦ ✦ ✦ Welcome to Focus Mode Pro! ✦ ✦ ✦           │
│                                                             │
│     Your Pro features are activating now...                 │
│     ━━━━━━━━━━━━━━━━━━━━━━━━━ 100%                         │
│                                                             │
│     You can close this tab. Your extension is ready.        │
│                                                             │
│     Or explore what's new:                                  │
│     → Your full Weekly Report is now unlocked               │
│     → Set up cross-device sync                              │
│     → Try your first custom timer session                   │
│                                                             │
│     Questions? support@focusmodeblocker.com                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Success page behavior:**

- On page load, the success page sends a message to the extension via a content script or the `chrome.runtime.sendMessage` API (the extension listens for messages from `focusmodeblocker.com`).
- The message payload: `{ type: "UPGRADE_SUCCESS", plan: "annual", uid: "abc123", license_key: "LK-xxxxx" }`
- The extension receives this message and immediately updates `chrome.storage.local` with `{ pro: true, plan: "annual", license_key: "LK-xxxxx", upgraded_at: timestamp }`.
- All Pro features unlock within 2 seconds of payment completion.
- The page shows a progress bar that fills to 100% over 1.5 seconds (cosmetic -- the actual unlock happens near-instantly).

**STEP 7: Extension Detects Upgrade**

When the extension receives the upgrade message:

1. **Storage update:** `chrome.storage.local.set({ pro: true, plan, license_key, upgraded_at })`
2. **Badge update:** Extension icon badge changes from default to a small "PRO" badge (gold text on transparent background).
3. **Popup state update:** All PRO lock icons are replaced with green checkmarks. All blurred content immediately unblurs. The "Go Pro" footer link is replaced with "Pro Member."
4. **Feature unlock:** All premium features become functional immediately. No restart or browser refresh required.

**STEP 8: Welcome Experience (see Section 3.4)**

### 3.3.3 Path B: External Web Upgrade (Fallback)

If the in-extension checkout is unavailable (e.g., ExtensionPay downtime, Stripe regional restrictions), the CTA button opens the extension website directly:

`https://focusmodeblocker.com/pricing?source={trigger_id}&uid={user_id}`

This is a full pricing page with the same three plans, feature comparison table, FAQ, and testimonials. The checkout flow is identical from Step 5 onward.

### 3.3.4 Upgrade Flow per Payment Method

| Plan | Price | Billing | Checkout Flow | Post-Payment |
|------|-------|---------|--------------|-------------|
| **Monthly** | $4.99/mo | Recurring monthly via Stripe | Standard card/wallet payment. First charge immediate. | License activates immediately. Renews on same date each month. Cancel anytime from account page or extension settings. |
| **Annual** | $35.88/yr ($2.99/mo) | Recurring annual via Stripe | Standard card/wallet payment. Full year charged upfront. | License activates immediately. Renews on same date each year. 7-day money-back guarantee. Cancel anytime (no refund after 7 days but access continues until period ends). |
| **Lifetime** | $49.99 | One-time charge via Stripe | Standard card/wallet payment. Single charge. | License activates immediately. Never expires. No renewal. Includes all current and future Pro features. 30-day money-back guarantee (longer window because of higher price). |

### 3.3.5 Discount Flow (T6 Urgency Window)

When the user arrives at checkout from T6 with a discount code:

1. The discount code (`BEST30`) is pre-applied to the checkout URL.
2. The checkout page shows the original price with a strikethrough and the discounted price.
3. A yellow banner at the top reads: "Your 30% discount expires in [HH:MM:SS]" with a live countdown synced to the server-side expiration timestamp.
4. If the countdown reaches 0:00:00 while the user is on the page, the page does NOT kick them out. Instead, the banner changes to: "This discount has expired. Checkout at regular price below." The prices revert to standard. This prevents frustration from being mid-checkout when the timer expires.
5. Discounted prices:
   - Monthly: $4.99 -> $3.49 (first month only, then $4.99/mo)
   - Annual: $35.88 -> $25.12 (first year only, then $35.88/yr)
   - Lifetime: $49.99 -> $34.99

---

## 3.4 Post-Upgrade Experience

### 3.4.1 The First 5 Seconds After Upgrade

The instant the extension receives the upgrade confirmation:

| Timing | What Happens | Surface |
|--------|-------------|---------|
| 0-500ms | Extension icon badge changes to gold "PRO" text | Browser toolbar |
| 0-500ms | All PRO lock icons replaced with green checkmarks | Popup (if open) |
| 0-500ms | All blurred content unblurs with a smooth 500ms transition | Popup (if open) |
| 500ms-1s | Focus Score breakdown fully reveals (if previously visited) | Popup (if open) |
| 1-2s | Chrome notification: "You're Pro! Open Focus Mode to explore." | Desktop notification |
| 1-2s | The Weekly Report tab (if previously blurred) shows full, unblurred data | Popup (when next opened) |
| 2-3s | Block page updates to show "PRO" badge and custom options link | Block page (on next blocked-site visit) |

### 3.4.2 UI Changes Across All Surfaces

**Extension Icon:**

| Before Upgrade | After Upgrade |
|---------------|--------------|
| Default icon, no badge (or timer countdown during sessions) | Small "PRO" text badge in gold, bottom-right corner. During sessions, timer countdown still shows but icon has a subtle gold ring. |

**Popup Header:**

| Before Upgrade | After Upgrade |
|---------------|--------------|
| "Focus Mode - Blocker" | "Focus Mode - Blocker PRO" with a small gold PRO badge next to the title |
| "10/10 sites used" counter | Counter removed. "Unlimited sites" in its place. |
| Footer: "Go Pro" link | Footer: "Pro Member" text (non-clickable, grey) |

**Settings Panel:**

| Before Upgrade | After Upgrade |
|---------------|--------------|
| PRO lock icons on premium features | Green checkmarks on all features |
| Greyed-out premium feature rows | All feature rows are fully interactive |
| "Upgrade to unlock" tooltips | Feature configuration UI appears inline |

**Block Page:**

| Before Upgrade | After Upgrade |
|---------------|--------------|
| Default motivational block page | Same default initially, but a "Customize" button appears in the bottom-right corner |
| No customization options | Full customization: custom messages, images, quote rotation, colors |
| No sounds on block page | Option to play ambient sound from block page |

**Weekly Report Tab:**

| Before Upgrade | After Upgrade |
|---------------|--------------|
| Blurred analytics with lock icon | Full, unblurred analytics. Charts are interactive (hover for details). |
| "Unlock Your Full Focus Report" CTA | No CTA. Clean data presentation. |

**Post-Session Screen:**

| Before Upgrade | After Upgrade |
|---------------|--------------|
| Basic stats (duration, sites blocked, attempts) + blurred "PRO INSIGHTS" | Full stats + unblurred insights: peak focus time, top distraction, personalized recommendation |
| Focus Score number only | Focus Score with full category breakdown (Concentration, Consistency, Distraction Rate, Session Length, Streak Bonus) |

**Timer Configuration:**

| Before Upgrade | After Upgrade |
|---------------|--------------|
| Slider locked at 25 minutes, values beyond 25 greyed out | Slider unlocked: 1-240 minute range. Break duration also configurable. Custom Pomodoro cycles available. |

### 3.4.3 Welcome Celebration

When the user opens the popup for the first time after upgrading (or immediately if the popup is already open):

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │                                             │    │
│  │  ✦  Welcome to Focus Mode Pro!  ✦           │    │
│  │                                             │    │
│  │  Everything is unlocked. Here are 3 things  │    │
│  │  to try first:                              │    │
│  │                                             │    │
│  │  1. See your full Weekly Report             │    │
│  │     → [View Report]                         │    │
│  │                                             │    │
│  │  2. Try a custom-length session             │    │
│  │     → [Start 50-min Session]                │    │
│  │                                             │    │
│  │  3. Explore your Focus Score breakdown      │    │
│  │     → [See Score Details]                   │    │
│  │                                             │    │
│  │  ─────────────────────────────────────────  │    │
│  │                                             │    │
│  │  Or just keep doing what you're doing.      │    │
│  │  Pro works in the background.               │    │
│  │                                             │    │
│  │        [Got It — Let's Focus]               │    │
│  │                                             │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Welcome celebration behavior:**

- **Shows once.** This panel appears exactly one time, on the first popup open after upgrade.
- **Animation:** Fade in over 400ms. Subtle sparkle/shimmer effect on the "PRO" text (CSS animation, 2 seconds).
- **Three action items** are dynamically chosen based on which Pro features the user has NOT yet used. The three shown above are defaults. If the user already viewed the Weekly Report (e.g., they clicked the blurred version), that item is replaced with another (e.g., "Set up cross-device sync" or "Customize your block page").
- **"Got It -- Let's Focus" button** dismisses the welcome panel and reveals the normal popup with all Pro features active.

### 3.4.4 Feature Discovery Prompt (Days 1-7 Post-Upgrade)

After the initial welcome, the extension provides gentle feature discovery over the first week:

| Day Post-Upgrade | Prompt | Location | Condition |
|-----------------|--------|----------|-----------|
| Day 1 | "Try setting a custom timer duration. Go beyond 25 minutes." | Small banner below timer in popup | Only if user has not yet used a custom duration |
| Day 2 | "Your Focus Score breakdown is now available. Tap your score to explore." | Tooltip on Focus Score | Only if user has not yet clicked their Focus Score |
| Day 3 | "Did you know you can customize your block page? Add your own message." | Banner on block page | Only if user visits a block page and has not customized it |
| Day 5 | "Set up cross-device sync to stay focused everywhere." | Settings panel inline tip | Only if user has not enabled sync |
| Day 7 | "Your first full Pro Weekly Report is ready. This one's not blurred." | Notification badge on extension icon + banner in popup | Fires on the first weekly report cycle after upgrade |

**Feature discovery rules:**

- Each prompt shows ONCE and never re-appears.
- Maximum 1 prompt per day. If multiple conditions are met, only the one matching the current day fires.
- Prompts are dismissable via [x] button. Dismissal is permanent for that prompt.
- Prompts do NOT appear during active focus sessions (never interrupt workflow).

### 3.4.5 Badge and Icon Changes

| Element | Free Tier | Pro Tier | Implementation |
|---------|-----------|---------|----------------|
| Extension icon | Standard icon (16x16, 32x32, 48x48, 128x128 PNG) | Same icon with a subtle gold accent (bottom-right corner of the 48x48 and 128x128 versions). The 16x16 remains unchanged for legibility. | `chrome.action.setIcon({ path: "icons/pro-48.png" })` on upgrade |
| Extension badge | Timer countdown during sessions (white text on blue background). "1" notification badge (white text on red background). | Same timer/notification behavior. Additionally, when no session is active and no notifications pending, show "" (empty) badge. The gold icon accent replaces the need for a persistent badge. | `chrome.action.setBadgeText()` |
| Chrome Web Store listing | "Free" pricing label | Users who are Pro see "Installed" with their icon having the gold accent. No change to the listing itself. | N/A (handled by Chrome) |
| Block page | "Focus Mode - Blocker" title text | "Focus Mode - Blocker PRO" with gold accent on PRO | Conditional rendering in block page HTML |
| Popup title bar | "Focus Mode - Blocker" | "Focus Mode - Blocker" with small "PRO" badge inline | Conditional DOM class toggle |

---

## 3.5 Paywall Timing and Cadence

### Detailed Timeline

#### Session 1 (Install day)

**What the user sees:**

- Clean onboarding: "Welcome to Focus Mode - Blocker. Block distracting sites and focus."
- Quick Focus button prominently displayed in popup.
- Basic instructions: "Click Quick Focus for a 25-minute distraction-free session."
- When they start a session and hit a blocked site, the motivational block page appears with a quote and their remaining time.
- Session ends: "You focused for 25 minutes and blocked [X] distraction attempts."

**What the user does NOT see:**

- Zero PRO badges anywhere in the UI.
- Zero upgrade mentions.
- Zero lock icons.
- Zero blurred content (analytics sections are simply not shown yet -- they appear starting session 3).
- Zero "Go Pro" links.
- The settings panel shows only free features. Pro features are not listed at all yet.

**Why:** First impressions determine retention. Any monetization signal in session 1 creates a "this is just trying to sell me something" perception. Pure value delivery builds the trust required for later conversion.

---

#### Session 2 (Same day or next day)

**What the user sees:**

- Same clean experience as session 1.
- Daily stats now visible: "Today: [X] minutes focused, [Y] distractions blocked."
- Streak counter appears if this is a consecutive day: "Day 2 focus streak."
- Feature discovery tip: "Tip: Add your own sites to the blocklist for even better focus." (Drives deeper product engagement, not payment.)

**What the user does NOT see:**

- Still zero PRO badges, lock icons, or upgrade mentions.
- Settings still shows only free features.

**Why:** Session 2 validates the product works. Users are forming the habit. Monetization signals would disrupt habit formation.

---

#### Session 3 (Typically day 2-3)

**What changes:**

- **PRO badges appear** for the first time. Small, amber-colored "PRO" text badges appear next to premium features in the Settings panel. These are visual indicators only -- no popup, no tooltip, no CTA. The user must actively click one to see any upgrade messaging (which fires T5).
- **Focus Score appears** for the first time on the post-session screen. It shows as a single number (e.g., "Focus Score: 74"). It is clickable, but clicking it fires T4 (blurred breakdown). If the user does not click, they see only the number -- no paywall.
- **Feature list in Settings** now shows ALL features (free and Pro). Free features have green checkmarks. Pro features have amber lock icons with "PRO" text. But no feature rows are clickable-to-upgrade unless the user deliberately taps a locked item.

**What does NOT happen:**

- No modals, no popups, no banners, no notifications.
- The popup header/footer still has no "Go Pro" link.
- The post-session screen still shows only free stats (no blurred Pro Insights section yet).

**Why:** Session 3 is when users start exploring the product beyond the core loop. Showing that more features exist (via PRO badges) plants the seed of desire without applying pressure. This is the "mere exposure" phase -- seeing PRO repeatedly normalizes it.

---

#### Session 4 (Typically day 3-4)

**What changes:**

- **Post-session screen adds the "PRO INSIGHTS" blurred section.** After completing a session, the user sees their free stats (duration, sites blocked, attempts, Focus Score) followed by a blurred card labeled "PRO INSIGHTS" with visible-but-unreadable chart shapes and text. This is the first time blurred content appears.
- **1 Free Pro Insight** is randomly unlocked and shown in full: e.g., "Pro Insight: Your peak focus today was at 10:23 AM. You're a morning focuser." This uses variable reinforcement -- the user gets a taste of Pro-quality insights.
- The Pro Insights blurred section has a subtle "Unlock" text link but no CTA button and no modal.

**Why:** By session 4, the user has accumulated enough data that insights are meaningful. Showing one unlocked insight proves the value is real. The blurred section creates curiosity without demanding action.

---

#### Session 5 (Typically day 3-5) -- PRIMARY CONVERSION MOMENT

**What happens:**

- **T1 (Weekly Report Unlock) fires.** This is the primary paywall trigger.
- A blue "1" notification badge appears on the extension icon.
- When the user opens the popup, the "Weekly Report" tab has a pulsing blue dot.
- Clicking the tab shows the blurred report with unblurred summary stats and the "Unlock Your Full Focus Report" CTA (see T1 spec above).
- The free Pro Insight continues (1 per session, variable).

**What also becomes armed:**

- T2 (11th Site) is now armed. If the user has already reached 10 sites, the next add-site attempt fires T2.
- T3 (Nuclear Extension) is now armed. The next nuclear re-attempt within 5 minutes fires T3.

**Why:** Session 5 is the optimal conversion moment because:

1. The user has proven they are engaged (5 sessions = not a casual installer).
2. They have a full week of data they are curious about.
3. The blurred report creates an information gap specific to their own behavior.
4. The unblurred summary stats ("127 distractions blocked, 11h 23m focused") prove the extension is delivering value.
5. The "coffee per month" price anchor makes the cost feel trivial relative to value received.

---

#### Day 7 (If still free)

**What changes:**

- **T7 (Weekly Distraction Alert) fires for the first time.** A Chrome notification at 6:00 PM Sunday shows estimated hours lost to distracting sites.
- **T6 (Post-Best-Session Offer) becomes armed.** The next personal-best session or streak milestone triggers the urgency window with 30% discount.
- **T8 (Export Attempt) becomes armed.** If the user clicks any export button, the lock tooltip appears.
- The post-session free Pro Insight continues (1 per session).

**What does NOT change:**

- No increase in paywall frequency. Still maximum 1 non-user-initiated paywall per session.
- The Weekly Report tab remains permanently available with blurred content and CTA.
- PRO badges in settings remain static (no new visual emphasis).

---

#### Day 14 (If still free)

**What changes:**

- **The Weekly Report notification stops being a modal/overlay.** It is now a permanent, always-visible tab in the popup with blurred content. The user can visit it anytime, but it no longer generates a notification badge or pulsing dot.
- **A "Go Pro" text link appears in the popup footer.** This is a permanent, small, grey text link at the bottom of the popup. It links to the Plan Selection Panel (Step 3 of the upgrade flow). It is unobtrusive -- same font size as other footer text (e.g., version number, settings link).
- **Monthly summary notification fires (once).** A Chrome notification: "Your first 2 weeks with Focus Mode: [X] hours focused, [Y] distractions blocked, [Z]-day streak. Imagine what you could do with full Pro insights."

**What does NOT change:**

- No increase in paywall aggression. T7 continues weekly (Sundays). T6 continues per-milestone (max 1/14 days). T2, T3, T4, T5, T8, T10 remain user-initiated only.
- No new popups, no new modals, no full-screen takeovers.

---

#### Day 30+ (Long-term free user)

**What the user experiences:**

- The extension continues to be genuinely useful. All free features work perfectly. The product does not degrade over time.
- The **"Go Pro" footer link** remains permanently in the popup.
- **T7 (Weekly Distraction Alert)** continues every Sunday but is now a **monthly** summary instead of weekly. One Chrome notification per month, on the first Sunday of each month: "Last month: [X] hours focused, [Y] distractions blocked. See your full monthly report with Pro."
- **T6 (Post-Best-Session Offer)** continues to fire on genuine milestone achievements. As the user accumulates longer streaks (30, 60, 90 days), these milestones naturally become less frequent and therefore feel special rather than nagging.
- All user-initiated triggers (T4, T5, T8, T10) remain active. The user can always click a locked feature to learn about Pro.
- **No new paywall mechanics are introduced.** The cadence established by Day 14 is the permanent steady state.
- **No escalating urgency.** No countdown timers, no "last chance" messaging, no feature degradation.

**Why this approach for long-term free users:**

Long-term free users who have not converted are providing value in three ways:

1. **Word of mouth:** They tell friends about the product. Every active free user is a potential referral source.
2. **Chrome Web Store metrics:** Active installs, daily active users, and engagement metrics improve the extension's Chrome Web Store ranking, driving organic installs.
3. **Future conversion:** Life circumstances change. A student graduates and gets a job. A casual user gets promoted and needs more focus. A user's company starts a remote policy and they discover they need scheduling. Maintaining a positive, non-annoying relationship means these users convert when they are ready, not when we push.

---

### What We NEVER Do (Anti-Patterns)

These behaviors are explicitly prohibited. They should not be implemented under any circumstances, regardless of conversion pressure:

| Anti-Pattern | Why It Is Prohibited | What To Do Instead |
|-------------|---------------------|-------------------|
| **Interrupt an active focus session with a paywall** | Users are in a flow state. Interrupting flow to sell destroys trust permanently. This is the single worst UX mistake a focus tool can make. | All paywalls fire ONLY between sessions (post-session screens, popup interactions, settings). Never during an active countdown. |
| **Show paywalls on sessions 1-2** | Users have not yet experienced value. Asking for money before delivering value signals the product is a cash grab, not a tool. | Zero monetization signals until session 3 (PRO badges only). No CTA until session 5. |
| **Degrade free features over time** | Removing functionality that was previously free creates a bait-and-switch perception and generates 1-star reviews. | Free features are free forever. No feature ever moves from free to paid for existing users. |
| **Show a paywall every time the popup opens** | Popup-open paywalls train users to avoid opening the extension, reducing engagement and retention. | Paywalls are event-triggered (session completion, feature tap, milestone), never open-triggered. |
| **Use guilt or shame language** | "You're losing X hours" framing becomes manipulative if overused. Once per week (T7) is the maximum. | Frame Pro as an opportunity ("unlock insights") not as a rescue ("stop wasting your life"). T7's loss framing is limited to factual data, delivered at most once per week. |
| **Hard-block any free feature** | Displaying a feature, letting the user interact with it, then blocking them at the point of use is infuriating. | Locked features show the lock icon BEFORE interaction. The user knows it is Pro before they click. T5 panels show feature previews, not half-completed actions. Exception: T2 (11th site) accepts the URL input before showing the panel -- but the URL is not lost, it is saved if the user upgrades. |
| **Auto-play upgrade videos or audio** | Unexpected media playback in a productivity tool is hostile. | All paywall content is static (text, images, subtle CSS animations). No video, no audio, no auto-play of any kind. |
| **Send more than 1 Chrome notification per week** | Notification spam leads to users disabling notifications entirely or uninstalling. | T7 fires once per week (or once per month after day 30). T1 fires once per lifetime. T6 fires at most once per 14 days. Maximum 1 system notification per 7-day period. |
| **Nag about expired trials** | "Your trial expired X days ago" messaging feels desperate and punitive. | After the T1 (Weekly Report) fires and is dismissed, it becomes a permanent tab -- not a recurring reminder. There is no trial in the default flow. |
| **Use dark patterns (misleading dismiss text, confusing pricing, hidden recurring charges)** | Dark patterns generate chargebacks, negative reviews, and regulatory risk. | All dismiss options use clear, honest language ("Keep my 10 sites," "Start another free hour," "Maybe later"). Pricing always shows the billing cycle and cancellation policy. |
| **Pop up a paywall when the user presses Quick Focus** | Quick Focus is the lowest-friction entry point. Adding friction to the core action reduces usage. | Quick Focus always works instantly. No interstitial, no pre-session paywall, no "watch an ad first." |
| **Show different prices to different users without explanation** | Price discrimination without transparency damages trust if discovered. | All users see the same base prices. Discounts (T6) are clearly labeled with expiration times and reason ("30% off to celebrate your personal best"). |
| **Force account creation before using free features** | Account walls reduce install-to-first-action rates by 40-60%. | Free features work immediately with zero account. Account creation only required at payment (Step 5) and optionally for cross-device sync. |

---

## Appendix A: Paywall Copy Tone Guide

All paywall copy follows these principles:

1. **Celebrate before selling.** Every paywall trigger starts by acknowledging what the user has accomplished ("You blocked 127 distractions," "You crushed a distraction-free hour," "You've blocked your top 10 distractions. Nice.").

2. **Describe outcomes, not features.** Instead of "Unlock unlimited blocking," say "Block every distraction, not just your top 10." Instead of "Access weekly reports," say "See exactly when you're most focused and what pulls you away."

3. **Use the user's own data as proof.** Every paywall should include at least one personalized metric from the user's actual usage. This transforms a generic pitch into a personalized value proposition.

4. **Never use exclamation marks in CTAs.** CTAs should feel confident and calm: "Unlock Your Full Focus Report" not "Unlock Your Report NOW!" Exclamation marks signal desperation.

5. **Always provide a clear, guilt-free exit.** Every paywall has a dismiss option that uses neutral language. Never use dismiss text like "No, I don't want to be productive" or "I'll stay unproductive." Use: "Maybe later," "Keep my 10 sites," "Start another free hour," "Not now," "Dismiss."

6. **Price anchoring always present.** Every paywall that shows price must include at least one anchor: "Less than one coffee per month," "Pays for itself in 5.5 minutes of saved focus," or the annual savings percentage.

---

## Appendix B: Analytics Events for Paywall Optimization

Every paywall interaction should fire analytics events for future A/B testing and conversion optimization.

| Event Name | Trigger | Payload |
|-----------|---------|---------|
| `paywall_shown` | Any paywall trigger fires | `{ trigger_id, session_number, day_since_install, user_segment }` |
| `paywall_cta_clicked` | User clicks primary CTA | `{ trigger_id, cta_text, plan_shown }` |
| `paywall_dismissed` | User clicks dismiss/secondary option | `{ trigger_id, dismiss_text, time_on_paywall_ms }` |
| `plan_selected` | User selects a plan in Plan Selection Panel | `{ plan_type, source_trigger, discount_applied }` |
| `checkout_started` | Checkout page loads | `{ plan_type, price, discount_code }` |
| `checkout_completed` | Stripe payment succeeds | `{ plan_type, price, discount_code, time_to_checkout_ms }` |
| `checkout_abandoned` | User closes checkout tab without paying | `{ plan_type, time_on_checkout_ms, last_field_focused }` |
| `pro_feature_locked_tap` | User taps a locked feature (T5) | `{ feature_name, session_number }` |
| `blur_interaction` | User hovers over or taps blurred content | `{ blur_section, time_hovering_ms }` |
| `discount_shown` | T6 urgency window appears | `{ milestone_type, discount_percent, streak_length }` |
| `discount_expired` | T6 countdown reaches 0 without conversion | `{ was_checkout_visited }` |
| `weekly_alert_sent` | T7 notification fires | `{ hours_lost_estimate, day_since_install }` |
| `score_tapped` | User taps Focus Score (T4) | `{ score_value, session_number }` |
| `export_blocked` | User taps export button (T8) | `{ export_type, data_volume }` |
| `sync_prompt_shown` | T9 fires on second device | `{ device_count, sites_on_other_device }` |

**Key conversion funnel to monitor:**

```
paywall_shown → paywall_cta_clicked → plan_selected → checkout_started → checkout_completed
```

**Target conversion rates by stage:**

| Stage | Target Rate | Action if Below Target |
|-------|------------|----------------------|
| paywall_shown -> cta_clicked | 15-25% | A/B test copy, layout, timing |
| cta_clicked -> plan_selected | 60-75% | Simplify plan selection, adjust pricing display |
| plan_selected -> checkout_started | 85-95% | Reduce friction (page load speed, fewer fields) |
| checkout_started -> checkout_completed | 40-60% | Add payment methods, simplify form, add trust signals |
| **Overall: paywall_shown -> completed** | **3-7%** | Optimize weakest funnel stage |

---

## Appendix C: A/B Testing Roadmap

These are the highest-priority paywall elements to A/B test after launch:

| Test # | Element | Variant A (Control) | Variant B | Hypothesis | Metric |
|--------|---------|--------------------|-----------|-----------|---------|
| 1 | T1 timing | Session 5 | Session 7 | Later trigger may convert higher because users have more data and stronger habit | T1 CTA click rate |
| 2 | T1 copy | "Unlock Your Full Focus Report" | "See What's Behind the Blur" | Direct curiosity appeal may outperform feature description | T1 CTA click rate |
| 3 | Plan pre-selection | Annual pre-selected | Monthly pre-selected | Annual pre-selection drives higher LTV but may reduce conversion rate | Plan selection distribution + overall conversion |
| 4 | T6 discount | 30% off | 20% off | Lower discount may convert nearly as well with higher revenue per conversion | T6 conversion rate x revenue |
| 5 | T6 countdown | 24-hour countdown | 48-hour countdown | Longer window may capture users who need to "sleep on it" | T6 conversion rate |
| 6 | Lifetime plan visibility | Always shown | Hidden until user clicks "See all plans" | Lifetime plan may cannibalize higher-LTV annual subscriptions | Revenue per converted user (LTV) |
| 7 | Free Pro Insight frequency | 1 per session | 1 per day (not per session) | Less frequent tastes may increase desire | Overall Pro conversion rate |
| 8 | T2 panel style | Slide-down inline panel | Bottom sheet modal | Modal may feel more urgent, panel may feel less intrusive | T2 conversion rate + dismiss rate |
| 9 | Checkout page stats | Show user's focus stats | Don't show stats | Stats may reinforce value or may distract from payment | Checkout completion rate |
| 10 | Price anchor | "Less than one coffee per month" | "$0.10/day" | Different anchors resonate with different users | CTA click rate |

---

*Section 3: Paywall Specification -- Complete*
*Feed this document to development team for implementation.*
*All copy, timing, and behavior specified to implementation-ready detail.*
