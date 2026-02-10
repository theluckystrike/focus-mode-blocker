# Premium UX Specification: Focus Mode - Blocker

> **Version:** 1.0.0
> **Last Updated:** 2026-02-10
> **Role:** Product Psychology & UX Strategy
> **Extension:** Focus Mode - Blocker (Chrome Web Store)
> **Pricing:** Free / Pro $4.99/mo ($35.88/yr) / Lifetime $49.99

---

## Table of Contents

1. [Value Ladder Design](#1-value-ladder-design)
2. [Presell Touchpoints](#2-presell-touchpoints)
3. [Taste of Premium](#3-taste-of-premium)
4. [Upgrade Trigger Moments](#4-upgrade-trigger-moments)
5. [UX Copy for 6 Upgrade Prompt Variations](#5-ux-copy-for-6-upgrade-prompt-variations)
6. [Anti-Patterns](#6-anti-patterns)
7. [Measurement Framework](#7-measurement-framework)

---

## 1. Value Ladder Design

The value ladder is structured into three psychological layers. Each layer must feel *complete at its own level*---the user should never feel punished for being on Free, only rewarded for upgrading.

### Layer 1: Foundation (Free Tier)

**Purpose:** Deliver genuine, standalone value. The user must build a real habit before they ever see a paywall. Free users who never upgrade should still leave 5-star reviews.

| Feature | Specification | Psychology |
|---|---|---|
| **Blocklist** | Up to 10 websites | Enough for a focused user's core distractions (social media, news, video). The limit only pinches power users. |
| **Pomodoro Timer** | Fixed 25-minute focus / 5-minute break | The proven default. Removing customization here is acceptable because 25/5 is the gold standard---most users never change it. |
| **Daily Stats** | Today's focus time, sessions completed, sites blocked (numeric display) | Immediate feedback loop. No graphs, no trends---just today's number. Enough to feel progress. |
| **Focus Score** | Single number (0-100) displayed after each session | The score *exists* but is unexplained at Free tier. Users see "Your Focus Score: 78" with no breakdown. This creates curiosity. |
| **Streak Counter** | Consecutive days with at least one completed session | Loss aversion is the most powerful motivator. Streaks cost nothing to provide and drive daily opens. |
| **Quick Focus** | One-click "Focus Now" button in popup, starts 25-min session instantly | Reduces friction to zero. This is the feature that makes users love the extension before they know Pro exists. |
| **Block Page** | Standard branded page when visiting a blocked site, shows remaining time and motivational quote | Functional but not customizable. Displays the Focus Mode brand on every intercept---free advertising. |
| **Schedule** | 1 recurring schedule (e.g., "Weekdays 9am-5pm") | Enough for a single work routine. The pinch comes when someone has different weekend vs. weekday needs. |
| **Nuclear Mode** | Up to 1 hour, cannot be undone | Provides the "burn the boats" feeling but limits the commitment window. Power users will want longer. |
| **Ambient Sounds** | 3 sounds: Rain, White Noise, Coffee Shop | Enough variety to prove the feature's value. Not enough to satisfy someone who discovers they love working with sound. |
| **Focus Buddy** | 1 accountability partner | Social proof and accountability. The limit is invisible until a user wants to add a second buddy. |

**Key Principle:** Every Free feature must work perfectly. No artificial degradation, no intentional slowness, no watermarks on functionality. The Free tier earns trust.

### Layer 2: Enhancement (Pro Tier)

**Purpose:** Remove every friction point the user has personally encountered. These features feel like "finally" moments---the user already wanted them before being offered them.

| Feature | Specification | Psychology |
|---|---|---|
| **Unlimited Blocklist** | No site limit | Resolves the most common growth constraint. By the time a user hits 10 sites, they are highly engaged. |
| **Weekly & Monthly Reports** | Full analytics with charts, trends, productivity patterns | Transforms raw numbers into narrative. Users go from "I focused 3 hours" to "I'm 40% more focused than last month." |
| **Focus Score Breakdown** | Category scores: Consistency, Depth, Resistance, Improvement | Turns a mysterious number into an actionable diagnostic. Each sub-score implies a specific behavior change. |
| **Custom Timers** | Adjustable focus/break durations, long break intervals | For users who have outgrown 25/5 or discovered their personal optimal rhythm (e.g., 50/10, 90/20). |
| **Extended Nuclear Mode** | Up to 24 hours | For users who have proven they need longer commitment. The jump from 1hr to 24hr is dramatic and desirable. |
| **Whitelist** | Allow specific pages on blocked domains (e.g., allow docs.google.com while blocking google.com) | Precision control for power users. This is a feature users don't know they need until they do. |
| **Cross-Device Sync** | Sync blocklist, settings, and stats across Chrome instances | Natural need for anyone with work + personal computers. |
| **Calendar Integration** | Auto-start focus sessions based on Google Calendar events | "Focus mode during meetings" is a workflow unlock that saves daily manual effort. |
| **AI Insights** | Pattern recognition: "You're most productive Tuesday mornings" or "Reddit is your biggest distraction" | Personalized coaching that feels magical. Low cost to generate, high perceived value. |
| **Custom Block Page** | Custom messages, images, redirect URLs | Personalization creates ownership. Users who customize are 3x less likely to churn. |
| **15+ Ambient Sounds** | Full library: Forest, Ocean, Thunderstorm, Library, Fireplace, Lo-fi beats, etc. | Variety for the user who has worn out the free sounds. |
| **Streak Recovery** | Recover a broken streak (1 recovery per 30 days) | Insurance against loss. The *fear* of needing this drives upgrades before it's ever used. |
| **Unlimited Buddies** | No partner limit | For teams and friend groups who focus together. |
| **Unlimited Schedules** | Multiple schedules for different routines | Weekend warriors, shift workers, students with variable class schedules. |

### Layer 3: Delight (Pro Tier --- Surprise & Retention)

**Purpose:** Features the user did not expect but loves discovering. These create "wow" moments that drive word-of-mouth and reduce churn. All are Pro-only but are never advertised as upgrade reasons---they are discovered post-upgrade.

| Feature | Specification | Psychology |
|---|---|---|
| **Focus Milestones** | Animated celebrations at 10hr, 50hr, 100hr, 500hr, 1000hr of total focus time | Unexpected delight. The animation only plays once per milestone, making it memorable. |
| **Session Mood Tracking** | Optional post-session mood check (1-5 scale) correlated with productivity data | Self-knowledge tool. Users who track mood report higher satisfaction with the extension. |
| **Weekly Email Digest** | Optional email summary of the week's focus performance | Extends the product beyond the browser. A weekly touchpoint that keeps the extension top-of-mind. |
| **Export Data** | CSV/JSON export of all focus history | Power user feature that signals respect for the user's data. Reduces churn anxiety ("I can always take my data"). |
| **Focus Quotes Library** | Curated, rotating quotes on block page from productivity experts, scientists, and philosophers | Turns a friction moment (blocked site) into a micro-learning moment. |
| **Dark Mode for Block Page** | Automatic or manual dark mode for the intercept page | Small touch that shows attention to detail. |

---

## 2. Presell Touchpoints

Every Pro feature visible to Free users must follow a consistent visual language that communicates premium status without creating resentment.

### Visual Language System

```
Pro Badge:       4px rounded pill, background #D4A017 at 12% opacity,
                 text #D4A017, font Inter 10px semibold, reads "PRO"
                 Appears ONLY from session 3 onward (never sessions 1-2)

Lock Icon:       Lucide "lock" icon, 14px, color #D4A017 at 60% opacity
                 Replaces interaction affordance (toggle, button) on locked features

Blur Treatment:  CSS filter: blur(6px), with gradient fade at edges
                 Used ONLY for data previews (reports, breakdowns)
                 Must show enough structure to communicate what the data IS

Tooltip Style:   Background #1A1A2E, text #FFFFFF, 12px Inter regular
                 Max width 220px, 8px padding, 6px border-radius
                 Appears on hover after 400ms delay (no instant popups)
                 Arrow points to the locked element
```

### Feature-by-Feature Presell Map

#### 2.1 Weekly Report (Blurred Preview)

| Property | Value |
|---|---|
| **Location** | Stats tab in popup, below daily stats. Visible from session 5. |
| **Visual Treatment** | Card with title "Weekly Report" (readable). Below title: blurred chart area showing vague bar graph shapes. Blur is 6px Gaussian. Bottom-right corner: PRO badge. Entire card has a subtle 1px border in #D4A017 at 15% opacity. |
| **Tooltip Text** | "See your weekly focus trends, top distractions, and productivity patterns." |
| **Click Behavior** | Clicking anywhere on the card opens the upgrade modal with the **Value** prompt variation (see Section 5.1). The modal pre-selects the "Reports & Insights" benefit. Track event: `presell_click_weekly_report`. |
| **Animation** | On first appearance (session 5 only): card slides up from below with 300ms ease-out. Subtle shimmer animation plays once across the blur to draw the eye. Never animates again. |

#### 2.2 Focus Score Breakdown

| Property | Value |
|---|---|
| **Location** | Session complete screen, below the Focus Score number. |
| **Visual Treatment** | Four horizontal bars labeled Consistency, Depth, Resistance, Improvement. Bars are filled to proportional lengths but colors are muted gray (#E0E0E0) with PRO badge next to each label. The bars themselves are NOT blurred---the user can see the relative lengths but cannot read the exact values. |
| **Tooltip Text** | "Understand what drives your Focus Score. See where you're strong and where to improve." |
| **Click Behavior** | Clicking any bar opens upgrade modal with the **Curiosity** prompt variation (see Section 5.5). Track event: `presell_click_score_breakdown`. |
| **Behavior Note** | The Focus Score number itself (e.g., "78") is always fully visible and free. Only the breakdown is gated. This ensures the free experience feels complete while creating natural curiosity about the components. |

#### 2.3 Custom Timer Duration

| Property | Value |
|---|---|
| **Location** | Timer settings in popup. Below the fixed 25/5 display, a text link reads "Customize duration" with a lock icon. |
| **Visual Treatment** | Text link in #1B6B9E (primary blue) with Lucide lock icon at 60% opacity appended. Text style: 12px Inter medium, underline on hover. |
| **Tooltip Text** | "Set your own focus and break durations. Find your perfect rhythm." |
| **Click Behavior** | Opens a mini-preview showing slider controls for focus (15-120 min) and break (1-30 min) durations. Sliders are visible but disabled (grayed out, cursor: not-allowed). Below sliders: "Unlock with Pro" button in #D4A017. Track event: `presell_click_custom_timer`. |

#### 2.4 Nuclear Mode Extension (Beyond 1 Hour)

| Property | Value |
|---|---|
| **Location** | Nuclear mode configuration. After the user selects 1 hour (the Free max), the slider track continues with a dashed line to "24hr" with a lock icon. |
| **Visual Treatment** | Slider track beyond 1hr is dashed, color #D4A017 at 30% opacity. The "24hr" label has a PRO badge. |
| **Tooltip Text** | "Lock your focus for up to 24 hours. For when you really mean it." |
| **Click Behavior** | Attempting to drag the slider beyond 1hr snaps it back to 1hr and shows a toast notification: "Extended Nuclear Mode is a Pro feature. Upgrade to lock focus for up to 24 hours." Toast includes a "Learn more" link that opens the upgrade modal with the **Feature** prompt variation. Track event: `presell_click_nuclear_extend`. |

#### 2.5 Additional Ambient Sounds

| Property | Value |
|---|---|
| **Location** | Sound picker panel. First 3 sounds (Rain, White Noise, Coffee Shop) are fully playable. Remaining 12+ sounds are listed below with lock icons. |
| **Visual Treatment** | Locked sounds show album-art-style thumbnails (small square icons) at 40% opacity with a centered Lucide lock icon overlay. Sound names are readable. Organized in a grid. |
| **Tooltip Text** (per sound) | "Unlock [Sound Name] and 12+ more ambient sounds with Pro." |
| **Click Behavior** | Clicking a locked sound plays a 3-second preview (fade in, fade out) then stops. A small toast appears: "Like this sound? Unlock the full library with Pro." Toast has a "See all sounds" CTA that opens upgrade modal with **Feature** prompt variation. Track event: `presell_click_sound_[sound_name]`. |

#### 2.6 Eleventh Blocked Site

| Property | Value |
|---|---|
| **Location** | Blocklist management. When the user has 10 sites and attempts to add an 11th. |
| **Visual Treatment** | The "Add site" input field remains active. When the user types a URL and hits Enter/Add, the site appears briefly in the list with a PRO badge, then a modal slides up explaining the limit. The list itself shows a subtle count: "10/10 sites" in the header, turning #D4A017 when full. |
| **Tooltip Text** | N/A (this is an action-triggered touchpoint, not a hover touchpoint). |
| **Click Behavior** | The limit modal contains: the site they just tried to add (showing they were heard), a message (see Section 5 for copy), and two CTAs: "Upgrade to Pro" (primary, #D4A017 background) and "Manage existing sites" (secondary, text link). Track event: `presell_click_11th_site`. |

#### 2.7 Whitelist Feature

| Property | Value |
|---|---|
| **Location** | Blocklist item context menu (click/hover on a blocked site). An option reads "Allow specific pages" with a lock icon. |
| **Visual Treatment** | Menu item text in standard color, Lucide lock icon appended, 60% opacity. |
| **Tooltip Text** | "Block a domain but allow specific pages (e.g., block youtube.com but allow youtube.com/learning)." |
| **Click Behavior** | Opens upgrade modal with **Feature** prompt variation, pre-highlighting the Whitelist benefit. Track event: `presell_click_whitelist`. |

#### 2.8 Calendar Integration

| Property | Value |
|---|---|
| **Location** | Settings panel, "Integrations" section. Shows Google Calendar icon with "Connect Calendar" button, dimmed with PRO badge. |
| **Visual Treatment** | Google Calendar icon at 50% opacity. Button is outlined (not filled), border #D4A017 at 40% opacity. PRO badge next to "Connect Calendar" text. |
| **Tooltip Text** | "Auto-start focus sessions from your calendar events. Never forget to focus." |
| **Click Behavior** | Opens upgrade modal with **ROI** prompt variation, emphasizing time saved by automation. Track event: `presell_click_calendar`. |

#### 2.9 AI Insights

| Property | Value |
|---|---|
| **Location** | Stats tab, below daily stats. A card with a sparkle icon (Lucide "sparkles") and title "AI Insight". |
| **Visual Treatment** | Card background: linear gradient from #1B6B9E at 5% to #D4A017 at 5%. One line of blurred text (6px blur) simulating an insight. PRO badge top-right. |
| **Tooltip Text** | "Get personalized productivity insights powered by AI analysis of your focus patterns." |
| **Click Behavior** | Opens upgrade modal with **Curiosity** prompt variation. Track event: `presell_click_ai_insights`. |
| **Variable Reinforcement Note** | This card is also the vehicle for the "Taste of Premium" free insight (see Section 3.1). On sessions where a free insight is granted, the blur is removed and a real insight is shown with a "Tip from Pro" label. |

#### 2.10 Streak Recovery

| Property | Value |
|---|---|
| **Location** | Only appears when a streak is broken. A banner on the popup home screen: "Your 12-day streak ended yesterday." Below: "Recover your streak" button with PRO badge. |
| **Visual Treatment** | Banner background: #FF4444 at 8% opacity (urgency without alarm). Streak number is bold. Recovery button is outlined in #D4A017. |
| **Tooltip Text** | N/A (the banner copy is self-explanatory). |
| **Click Behavior** | Opens upgrade modal with **Achievement** prompt variation, emphasizing the streak that was built. Track event: `presell_click_streak_recovery`. |
| **Emotional Timing** | This touchpoint leverages peak loss aversion. It appears only once per broken streak (not every session after). If ignored, it gracefully disappears after 3 sessions and the new streak begins normally. |

#### 2.11 Cross-Device Sync

| Property | Value |
|---|---|
| **Location** | Settings panel, "Sync" section. Shows device icons with "Enable Sync" toggle, disabled, with PRO badge. |
| **Visual Treatment** | Toggle switch in disabled state (gray). Two device icons (laptop, desktop) with a dashed line between them. PRO badge next to section title. |
| **Tooltip Text** | "Keep your blocklist, settings, and focus history in sync across all your devices." |
| **Click Behavior** | Opens upgrade modal with **Feature** prompt variation. Track event: `presell_click_sync`. |

#### 2.12 Additional Schedules

| Property | Value |
|---|---|
| **Location** | Schedule settings. Below the existing schedule, a "+ Add Schedule" button with lock icon. |
| **Visual Treatment** | Button is outlined, dashed border, text and icon at 50% opacity. PRO badge inline. |
| **Tooltip Text** | "Create different schedules for weekdays, weekends, and custom routines." |
| **Click Behavior** | Opens upgrade modal with **Feature** prompt variation. Track event: `presell_click_add_schedule`. |

#### 2.13 Custom Block Page

| Property | Value |
|---|---|
| **Location** | Settings panel, "Block Page" section. Shows a thumbnail preview of the current block page with an "Customize" button, disabled, with PRO badge. |
| **Visual Treatment** | Thumbnail has a subtle overlay with a Lucide "paintbrush" icon centered. PRO badge on the "Customize" button. |
| **Tooltip Text** | "Personalize your block page with custom messages, images, or redirect to a productive URL." |
| **Click Behavior** | Opens a preview of customization options (message field, image upload area, redirect URL field)---all visible but disabled. "Unlock with Pro" button below. Track event: `presell_click_custom_block_page`. |

#### 2.14 Additional Focus Buddies

| Property | Value |
|---|---|
| **Location** | Focus Buddy panel. After 1 buddy is added, the "+ Add Buddy" button shows a lock icon. |
| **Visual Treatment** | Button outlined, dashed border, lock icon appended. |
| **Tooltip Text** | "Add more accountability partners. Focus together, stay accountable." |
| **Click Behavior** | Opens upgrade modal with **Social Proof** prompt variation. Track event: `presell_click_add_buddy`. |

---

## 3. Taste of Premium

The Taste of Premium system uses variable reinforcement schedules (the same psychological mechanism behind slot machines and social media feeds) to give Free users unpredictable, delightful glimpses of Pro value. This creates desire through experience rather than marketing.

### 3.1 Variable Reinforcement: Free Pro Insight

**Mechanic:** After every completed focus session, there is a *chance* the user receives one genuine Pro-level insight instead of the blurred placeholder.

**Schedule:**

| Session Count (Lifetime) | Probability of Free Insight | Rationale |
|---|---|---|
| 1-4 | 0% | User is still forming the basic habit. No distractions. |
| 5-10 | 35% | High probability early to demonstrate value during the engagement peak. |
| 11-20 | 20% | Reduce frequency as the user accumulates enough data for insights to be genuinely useful. |
| 21-50 | 12% | Scarcity increases perceived value. Each insight feels like a gift. |
| 51+ | 8% | Rare but not gone. Long-term free users still get occasional reminders. |

**Implementation Rules:**

- The insight shown must be **real and relevant** to the user's actual data. Never show generic text.
- Examples of valid insights:
  - "You focused 40% more this week than last week. Your best day was Wednesday."
  - "Reddit accounts for 62% of your blocked attempts. Consider removing it from your quick-access bookmarks."
  - "Your Focus Score peaks between 9-11am. Try scheduling your hardest work then."
- The insight card replaces the blurred AI Insight card for that session only.
- Visual treatment: Same card dimensions and position as the blurred version, but with a top banner reading "Pro Insight Preview" in #D4A017 text, 11px Inter semibold. A subtle gold shimmer border animation plays once (600ms).
- Below the insight: "Get insights like this every session with Pro" in 11px Inter regular, #888888, with a subtle right arrow icon.
- Clicking the insight text opens the upgrade modal. Clicking elsewhere dismisses normally.
- Track event: `taste_insight_shown` with insight type, and `taste_insight_clicked` if they click through.

**Anti-Gaming:** The system tracks which insights have been shown. Never repeat the same insight within 30 days. If no novel insight is available, skip the taste for that session (do not show stale data).

### 3.2 Preview Modes

#### 3.2.1 Sound Preview

- **Trigger:** User clicks a locked ambient sound.
- **Behavior:** Play a 3-second fade-in, 3-second sustain, 3-second fade-out preview of the sound.
- **Post-Preview:** Gentle toast: "Unlock [Sound Name] and the full sound library with Pro."
- **Limit:** Each locked sound can be previewed up to 3 times total. After 3 previews, clicking shows: "You've previewed this sound 3 times. Upgrade to listen anytime." This prevents the preview from becoming a substitute for the feature.
- **Track:** `taste_sound_preview` with sound name and preview count.

#### 3.2.2 Report Peek (Weekly Report Tease)

- **Trigger:** On session 7 (once only), after completing a session, the Weekly Report card temporarily de-blurs for 5 seconds with a countdown timer in the corner.
- **Behavior:** The report shows real data for the user's past week. After 5 seconds, it smoothly re-blurs (400ms transition). Below the card: "Your full report is ready. Unlock it with Pro."
- **Emotional Design:** The 5-second window creates urgency. The user glimpses their data, begins to process it, and then it's taken away---creating a completion desire (Zeigarnik effect).
- **Track:** `taste_report_peek` and `taste_report_peek_upgrade_click` if they click through.
- **Limit:** This happens exactly once. Never repeat.

#### 3.2.3 Score Breakdown Flash

- **Trigger:** When a user's Focus Score changes by more than 10 points (up or down) between sessions.
- **Behavior:** The session-complete screen shows the Focus Score with a +/- delta indicator. Below, one of the four breakdown categories briefly flashes its label and value (e.g., "Consistency: 92") for 2 seconds before blurring. The other three remain blurred.
- **Copy below:** "Your [Category] score drove this change. See the full breakdown with Pro."
- **Limit:** Maximum once per 7 days.
- **Track:** `taste_score_flash` with category name.

### 3.3 "Faster with Pro" Moments

These are micro-interactions where the Free experience works but Pro would be noticeably more efficient. The key is that the Free path is never *broken*---just slightly longer.

#### 3.3.1 Manual vs. Auto Schedule

- **When:** User manually starts a focus session during a time that matches a pattern (e.g., they've started a session between 9:00-9:15am on 3+ weekdays).
- **Micro-interaction:** After session starts, a subtle notification (not a modal, not a toast---a small inline text below the timer): "You focus here every weekday morning. With Pro, this starts automatically."
- **Frequency:** Show this a maximum of 2 times total. After that, never again.
- **Track:** `faster_auto_schedule_shown`.

#### 3.3.2 Manual Stats Calculation

- **When:** User visits the Stats tab and scrolls or looks at daily numbers for more than 8 seconds (indicating they're trying to mentally calculate trends).
- **Micro-interaction:** A small, ephemeral text appears at the bottom of the stats area: "Pro calculates your trends automatically." Fades in over 500ms, persists for 4 seconds, fades out over 500ms.
- **Frequency:** Maximum once per 3 days.
- **Track:** `faster_auto_stats_shown`.

#### 3.3.3 Repeated Blocklist Editing

- **When:** User adds and removes the same site from the blocklist more than twice in a week (indicating they want it blocked sometimes but not always).
- **Micro-interaction:** After the second add-back: "Tip: With Pro's Whitelist, you can block a site but allow specific pages---no more adding and removing."
- **Frequency:** Once per occurrence pattern.
- **Track:** `faster_whitelist_hint_shown`.

---

## 4. Upgrade Trigger Moments

Triggers are the specific moments where an upgrade prompt is displayed. Every trigger must meet three criteria:

1. **Natural pause** --- The user has just completed an action and is between tasks.
2. **Demonstrated need** --- The user's own behavior proves they want what Pro offers.
3. **Emotional readiness** --- The user is in a positive or motivated state (never interrupt frustration with a sales pitch).

### Trigger Architecture

```
SESSIONS 1-2:   ||||||||||||||||||||||||||||||||||||  ZERO MONETIZATION ZONE
                No Pro badges. No presell. No upgrade prompts.
                The extension is indistinguishable from a fully free product.
                Purpose: Build trust, establish habit, create baseline data.

SESSION 3:      PRO badges appear on locked features (subtle, non-intrusive).
                No prompts. No modals. Badges are discoverable, not pushed.
                Purpose: Plant awareness seeds.

SESSION 4:      Presell touchpoints activate (tooltips, blurred previews).
                Still no upgrade prompts or modals unless user clicks a locked feature.
                Purpose: Let curiosity build organically.

SESSION 5+:     Trigger system activates. Prompts can now appear at natural moments.
                Maximum 1 upgrade prompt per session. Maximum 3 per week.
                Purpose: Convert demonstrated interest into action.
```

### T1: Weekly Report Trigger (Primary --- 8-12% Expected Conversion)

**Activation Condition:** Session 5+ AND it has been 7+ days since install AND user has completed 5+ sessions total.

**UX Flow:**

1. User completes a focus session (the session-complete screen is showing).
2. Below the Focus Score, a new card animates in (slide up, 300ms ease-out):
   - Header: "Your First Weekly Report is Ready" (16px Inter semibold, #1A1A2E)
   - Subtext: "7 days of focus data, analyzed." (13px Inter regular, #666666)
   - Preview: Blurred mini-chart showing bar graph shapes with real proportional data.
   - The blur is lighter than usual (4px instead of 6px) to increase readability.
3. Below the card, two CTAs:
   - Primary: "See My Report" (button, #D4A017 background, white text, 14px Inter semibold, full width, 44px height, 8px border-radius)
   - Secondary: "Maybe Later" (text link, #888888, 12px Inter regular, centered below button)
4. Clicking "See My Report":
   - Opens the upgrade modal (see Section 5.1 for copy).
   - The modal includes a "Start Free Trial" option if trial is available, or "Upgrade to Pro" if not.
   - The modal shows a larger, slightly less blurred version of their actual report data.
5. Clicking "Maybe Later":
   - Card collapses with 200ms ease-in animation.
   - The blurred Weekly Report card remains in the Stats tab as a persistent presell touchpoint.
   - This specific prompt does not appear again for 14 days.
   - Track: `trigger_weekly_report_dismissed`.

**Track:** `trigger_weekly_report_shown`, `trigger_weekly_report_clicked`, `trigger_weekly_report_converted`.

### T2: Eleventh Site Trigger (Secondary --- 5-8% Expected Conversion)

**Activation Condition:** User has exactly 10 sites in blocklist AND attempts to add an 11th.

**UX Flow:**

1. User types a URL into the "Add site" field and submits.
2. The site briefly appears in the list (200ms) with a gold highlight, then a bottom sheet slides up:
   - The sheet is 60% of popup height, white background, 16px border-radius top corners, subtle shadow.
   - Header: "You've Built a Serious Blocklist" (16px Inter semibold)
   - Subtext: "10 sites blocked and counting. You're clearly committed to focus." (13px Inter regular, #666666)
   - The URL they just tried to add is displayed prominently: "[url] is ready to be blocked" with a checkmark icon in #D4A017.
   - CTA: "Unlock Unlimited Sites --- $4.99/mo" (button, #D4A017 background)
   - Secondary: "I'll manage with 10" (text link, #888888)
3. Clicking the primary CTA:
   - Opens the upgrade flow.
   - Upon successful upgrade, the 11th site is automatically added (the user's intent is preserved).
4. Clicking "I'll manage with 10":
   - Bottom sheet slides down (200ms).
   - The 11th site is removed from the list.
   - A subtle toast appears: "Tip: You can replace existing sites anytime."
   - This prompt will re-trigger if they attempt an 11th site again, but only after 7 days.

**Track:** `trigger_11th_site_shown`, `trigger_11th_site_clicked`, `trigger_11th_site_converted`, `trigger_11th_site_dismissed`.

### T3: Nuclear Extension Trigger (Secondary --- 6-10% Expected Conversion)

**Activation Condition:** User is in an active Nuclear Mode session (1 hour) AND the timer reaches the final 5 minutes AND user has used Nuclear Mode 3+ times total.

**UX Flow:**

1. At the 55-minute mark of a 1-hour Nuclear Mode session, a subtle notification appears at the top of the popup (if open) or as a block-page banner (if they visit a blocked site):
   - Text: "Nuclear Mode ends in 5 minutes. Need more time?"
   - Two inline options: "Extend to 2hr" | "Extend to 4hr" | "Extend to 24hr" --- all with small PRO badges.
2. Clicking any extension option:
   - Opens a compact upgrade modal (not full-screen):
     - Header: "Stay in the Zone" (16px Inter semibold)
     - Body: "You've been locked in for 55 minutes. Don't break your momentum." (13px Inter regular)
     - CTA: "Upgrade & Extend" (button, #D4A017 background)
     - Secondary: "Let it end" (text link)
3. The urgency is real and time-bound --- the user has 5 minutes to decide. This is not artificial scarcity; it's genuine temporal pressure from their own choice.
4. If the user does not interact, Nuclear Mode ends normally at 60 minutes. No further prompt.

**Track:** `trigger_nuclear_extend_shown`, `trigger_nuclear_extend_clicked`, `trigger_nuclear_extend_converted`.

### T4: Streak Recovery Trigger (Emotional --- High Conversion Potential)

**Activation Condition:** User had a streak of 7+ days AND the streak broke (missed a day) AND this is their first session after the break.

**UX Flow:**

1. When the user opens the popup after a broken streak, a banner appears at the top:
   - Background: Soft red gradient (#FF4444 at 6% to transparent)
   - Icon: Broken chain or flame icon (Lucide "flame-off" or similar)
   - Header: "Your [N]-Day Streak Ended" (14px Inter semibold, #1A1A2E)
   - Subtext: "You were on a roll. It happens to everyone." (12px Inter regular, #666666)
   - CTA: "Recover My Streak" with PRO badge (outlined button, #D4A017 border and text)
   - Dismiss: Small "x" button, top-right of banner.
2. Clicking "Recover My Streak":
   - Opens upgrade modal with **Achievement** prompt variation.
   - If user upgrades, the streak is immediately restored and the counter continues from [N+1] after their next completed session.
3. Dismissing:
   - Banner collapses. Does not reappear for this streak break.
   - The streak counter resets to 0 and begins counting fresh.

**Track:** `trigger_streak_recovery_shown`, `trigger_streak_recovery_clicked`, `trigger_streak_recovery_converted`.

### T5: Organic Discovery Trigger (Self-Initiated)

**Activation Condition:** User clicks any locked feature's presell touchpoint (from Section 2).

**UX Flow:**

1. This is not a pushed trigger---the user chose to explore.
2. The appropriate upgrade modal opens based on the feature clicked (mapped in Section 2).
3. Because the user self-initiated, the modal can be slightly more detailed than pushed triggers:
   - Include a feature comparison mini-table (3-4 rows, Free vs. Pro).
   - Include a "Most popular" badge on the annual plan.
   - Include a satisfaction guarantee if applicable.

**Track:** `trigger_organic_[feature_name]_shown`, `trigger_organic_[feature_name]_converted`.

### Global Trigger Rules

| Rule | Specification |
|---|---|
| **Max prompts per session** | 1 (excluding user-initiated organic triggers) |
| **Max pushed prompts per week** | 3 |
| **Cooldown after dismiss** | Minimum 48 hours before the same trigger type can fire again |
| **Cooldown after any dismiss** | Minimum 24 hours before any pushed trigger can fire |
| **Session 1-2 lockout** | Absolute. No exceptions. No Pro badges, no presell, no triggers. |
| **Session 3-4 passive only** | Badges and presell visible, but no pushed triggers. Only organic (user-click) triggers. |
| **Post-upgrade** | All upgrade prompts permanently disabled. All features unlocked. Presell touchpoints replaced with functional controls. |
| **Downgrade/Expiry** | If Pro expires, features lock but prompts do not resume for 7 days. Give the user space to decide on their own. |

---

## 5. UX Copy for 6 Upgrade Prompt Variations

Each variation targets a different psychological motivator. The system selects the variation based on the trigger context (mapped in Section 2 and Section 4). All copy uses Inter font. Headlines are 18px semibold, body is 14px regular, CTAs are 14px semibold.

### 5.1 Value Focus

**Best used with:** Weekly Report trigger (T1), Stats-related presell clicks.

**Modal Content:**

```
[Headline]
You've focused for [X] hours this week.
See what that means.

[Body]
Your weekly report breaks down when you're most productive,
which distractions cost you the most time, and how your
focus is trending. It's the difference between knowing you
worked hard and knowing you worked smart.

[Primary CTA Button --- #D4A017 background, white text]
Unlock My Report --- $4.99/mo

[Secondary CTA --- text link, #888888]
Start with Annual ($2.99/mo, save 40%)

[Tertiary --- text link, #AAAAAA, 11px]
Not now

[Social proof line --- 11px, #888888, below CTAs]
Join 12,000+ focused professionals
```

**Design Notes:**
- The `[X] hours` is pulled from real user data. If less than 1 hour, use minutes: "127 minutes."
- If the user has blocked 50+ site visits, add a secondary stat: "and blocked [Y] distractions."

### 5.2 Social Proof Focus

**Best used with:** Focus Buddy presell click, general upgrade prompts when no specific feature is the driver.

**Modal Content:**

```
[Headline]
You're in good company.

[Body]
Pro users average 2.4 more focused hours per week than
free users. They also maintain streaks 3x longer. You've
already proven you're serious about focus --- Pro gives
you the tools to go further.

[Testimonial Card --- light gray background, 12px Inter italic]
"The weekly reports alone changed how I structure my day.
I didn't know I was losing 40 minutes to news sites every
morning."  --- Sarah K., Software Engineer

[Primary CTA Button]
Join Pro --- $4.99/mo

[Secondary CTA]
See all plans

[Tertiary]
Not now
```

**Design Notes:**
- Testimonial is optional if modal space is constrained (e.g., popup vs. block page).
- Stats ("2.4 more hours," "3x longer") must be defensible. Update quarterly from aggregate anonymized data.

### 5.3 Feature Focus

**Best used with:** Specific feature presell clicks (Sounds, Nuclear, Sync, Calendar, Custom Block Page, Whitelist, Schedules).

**Modal Content:**

```
[Headline]
Unlock [Feature Name]

[Body --- varies by feature, examples below]

For Ambient Sounds:
"15+ ambient soundscapes to match your mood and work style.
From deep forest rain to lo-fi beats. Find your focus sound."

For Nuclear Mode:
"Lock your focus for up to 24 hours. When 1 hour isn't
enough, extended Nuclear Mode keeps you committed."

For Whitelist:
"Block distracting sites while keeping productive pages
accessible. Block youtube.com but allow youtube.com/learning."

For Calendar Integration:
"Connect Google Calendar and auto-start focus sessions
when your calendar says it's time to work. Zero friction."

[Feature comparison --- 2-column mini-table]
                    Free          Pro
Sites blocked       10            Unlimited
Nuclear Mode        1 hour        24 hours
Ambient Sounds      3             15+
Schedules           1             Unlimited

[Primary CTA Button]
Upgrade to Pro --- $4.99/mo

[Secondary CTA]
See all Pro features

[Tertiary]
Not now
```

**Design Notes:**
- The comparison table only shows 4 rows maximum. Always include the row relevant to the feature that triggered this modal, plus 3 other high-value differences.
- Bold the row that matches the triggering feature.

### 5.4 Achievement Focus

**Best used with:** Streak Recovery trigger (T4), milestone moments, high Focus Score sessions.

**Modal Content:**

```
[Headline]
[X] days of focus. That's no accident.

[Body]
You've built something real. A [X]-day streak means
[X] days of choosing discipline over distraction. Pro
protects that investment with streak recovery, so one
off day doesn't erase weeks of progress.

[Visual element --- streak flame icon, large, #D4A017]

[Streak context --- 12px, #666666]
You're in the top 15% of Focus Mode users by streak length.

[Primary CTA Button]
Protect My Streak --- $4.99/mo

[Secondary CTA]
View Pro benefits

[Tertiary]
Start fresh instead
```

**Design Notes:**
- The "top X%" stat must be calculated from real data. If not available, omit the line entirely. Never fabricate percentiles.
- The flame icon should pulse subtly (scale 1.0 to 1.05, 2s ease-in-out loop) to draw attention without being distracting.

### 5.5 Curiosity Focus

**Best used with:** Focus Score Breakdown presell click, AI Insights presell click.

**Modal Content:**

```
[Headline]
What's behind your Focus Score?

[Body]
Your score is [X]. But what's driving it? Pro breaks your
Focus Score into four dimensions --- Consistency, Depth,
Resistance, and Improvement --- so you know exactly where
to level up.

[Visual element --- 4 horizontal bars, partially revealed]
Consistency    ████████░░  [blurred number]
Depth          ██████░░░░  [blurred number]
Resistance     █████████░  [blurred number]
Improvement    ███░░░░░░░  [blurred number]

[Below bars --- 12px, #D4A017]
One of these is holding you back. Find out which.

[Primary CTA Button]
Reveal My Breakdown --- $4.99/mo

[Secondary CTA]
Learn about Focus Score

[Tertiary]
Not now
```

**Design Notes:**
- The bars must show REAL proportional data from the user's actual scores. The numbers are blurred, but the bar lengths are accurate. This creates a genuine "I can almost see it" tension.
- The line "One of these is holding you back" is only shown if one score is significantly lower than the others (>15 point gap). Otherwise, use: "See where you're strongest and where to grow."

### 5.6 ROI Focus

**Best used with:** Calendar Integration presell click, "Faster with Pro" moments, users with high session counts.

**Modal Content:**

```
[Headline]
$4.99/mo. That's [calculated] per focus hour.

[Body]
You've logged [X] focus hours this month. At $4.99/mo,
Pro costs [Y] cents per hour of focused work. That's less
than a coffee, a push notification, or the 10 minutes
you'd lose to Reddit.

[Visual comparison --- icon + text, 3 rows]
☕  One coffee          $5.50
📱  One distraction     ~12 min lost
🎯  One month of Pro    $4.99

[Primary CTA Button]
Start Pro --- $4.99/mo

[Secondary CTA]
Go annual --- just $2.99/mo

[Tertiary]
Not now

[Fine print --- 10px, #AAAAAA]
Based on your [X] focus hours this month.
Cancel anytime. No contracts.
```

**Design Notes:**
- `[Y] cents per hour` is calculated from real data: ($4.99 / user's monthly hours). If user has 20 hours, it's ~25 cents/hour.
- If the user has fewer than 5 hours, skip the per-hour calculation (it would look expensive) and instead emphasize: "Pro users average 2.4 more focused hours per week. That's [calculated] extra hours this year."
- The annual plan secondary CTA should be visually prominent (slightly larger text, or a "SAVE 40%" badge next to it).

---

## 6. Anti-Patterns

These are practices that degrade trust, annoy users, or produce short-term conversions at the cost of long-term retention and reviews. Each anti-pattern includes a real-world example, why it fails, and the alternative approach.

### 6.1 NEVER: Nag Screens on Launch

**What it looks like:** A full-screen modal or interstitial that appears every time the user opens the extension, blocking access to functionality until dismissed.

**Competitor Example:** Several ad-blocker extensions show "Upgrade to Premium" modals on every browser launch, requiring a click to dismiss before the tool is usable.

**Why it fails:** Trains users to automatically dismiss prompts (banner blindness). Creates resentment. Generates 1-star reviews mentioning "constant popups." Users associate the extension with annoyance rather than productivity.

**Our alternative:** Upgrade prompts only appear at natural pause points (post-session, post-action) and never block access to core functionality. Maximum 1 pushed prompt per session, never on launch.

### 6.2 NEVER: Degrade Free Features Over Time

**What it looks like:** Features that work well initially but get slower, buggier, or more limited as the user continues without paying. Sometimes called "progressive degradation."

**Competitor Example:** Some note-taking apps gradually slow sync speeds for free users or introduce artificial delays before notes load.

**Why it fails:** Users perceive this as punishment and hostage-taking. Destroys trust. Creates the narrative "it used to work fine, now they're forcing me to pay." Drives users to alternatives rather than upgrades.

**Our alternative:** Free features work identically on day 1 and day 1000. The free tier is a complete product. Pro adds capabilities; it never restores them.

### 6.3 NEVER: Fake Urgency or Scarcity

**What it looks like:** "50% off! Offer expires in 2 hours!" timers that reset every time. "Only 3 spots left in Pro!" for a digital product with unlimited capacity. Flash sales that run perpetually.

**Competitor Example:** Numerous VPN and antivirus Chrome extensions display countdown timers that reset on every visit, or show "limited time" pricing that never changes.

**Why it fails:** Sophisticated users recognize the manipulation immediately and lose all trust. Less sophisticated users may convert once but feel deceived when they see the same "deal" later, leading to refund requests and negative reviews.

**Our alternative:** Pricing is transparent and consistent. If we run a genuine promotion (e.g., annual Black Friday sale), it has a real start and end date. No countdown timers. No artificial scarcity claims.

### 6.4 NEVER: Dark Pattern Dismissals

**What it looks like:** Making the "No thanks" or close option difficult to find, very small, delayed, or worded to guilt-trip ("No, I don't want to be productive").

**Competitor Example:** Many subscription apps use "confirmshaming" --- the decline option reads something like "No, I prefer to waste my time" in small gray text that's hard to distinguish from background.

**Why it fails:** Users feel manipulated. It poisons the relationship. Even users who convert through dark patterns have higher churn rates and lower satisfaction scores.

**Our alternative:** Dismiss options are always clearly visible, use neutral language ("Not now," "Maybe later," "I'll manage with 10"), and are sized/colored to be easily tappable. The dismiss action is always 1 click, never multi-step.

### 6.5 NEVER: Interrupt Active Focus Sessions

**What it looks like:** Showing an upgrade prompt, notification, or modal while the user is in the middle of a focus session (timer running).

**Competitor Example:** Some Pomodoro apps pause the timer to show an ad or upgrade prompt mid-session.

**Why it fails:** The entire purpose of the extension is to help users focus. Interrupting focus to sell focus tools is a paradox that destroys credibility. It is the single most trust-destroying action possible for this product category.

**Our alternative:** During active focus sessions, the only UI elements are the timer, controls, and ambient sound. Zero promotional content. Upgrade prompts only appear in post-session screens, settings, or stats views. The Nuclear Mode extension trigger (T3) appears only in the final 5 minutes and only if the user opens the popup or visits a blocked page---it never interrupts.

### 6.6 NEVER: Hide the Free Tier

**What it looks like:** Making it difficult to use the extension without upgrading. Requiring account creation for basic features. Burying the free option behind multiple "Start free trial" screens.

**Competitor Example:** Some website blockers require an account and email before any blocking works, then immediately funnel into a trial that auto-converts to paid.

**Why it fails:** High friction at onboarding kills adoption. Users who are forced into trials feel trapped. Auto-conversion from trials generates chargebacks, negative reviews, and regulatory risk.

**Our alternative:** The extension works immediately after install with zero account requirements. All free features are available with one click. Account creation is only required for Pro features that need it (sync, calendar). Free users are never asked to create an account.

### 6.7 NEVER: Show Pro Features in Onboarding

**What it looks like:** The first-run experience prominently showcasing Pro features, blurring the line between free and paid, or giving a guided tour that highlights locked features.

**Competitor Example:** Productivity apps that give a "tour" of all features (including premium ones) before the user has used anything, creating confusion about what's free.

**Why it fails:** Users haven't established value yet. Showing them things they can't use before they've experienced things they can creates frustration, not aspiration. It also violates the session 1-2 zero-monetization rule.

**Our alternative:** Onboarding only covers free features. The user learns: add sites to block, start a focus session, see your stats. Pro features are discovered organically through use, not shown during setup.

### 6.8 NEVER: Use Notification Badges for Upsells

**What it looks like:** Red notification dots or badge counts on the extension icon to draw the user into an upgrade prompt.

**Competitor Example:** Extensions that show a badge count that, when clicked, leads to an upsell rather than genuinely new information.

**Why it fails:** Notification badges carry an implicit promise of new, relevant information. Using them for sales breaks that contract and trains users to ignore future badges, even legitimate ones.

**Our alternative:** The extension icon badge is reserved exclusively for active session status (e.g., showing remaining minutes). Never used for promotional purposes.

### 6.9 NEVER: Auto-Play Video or Audio in Upgrade Modals

**What it looks like:** Upgrade prompts that include auto-playing video testimonials or audio pitches.

**Why it fails:** Jarring, disruptive, and particularly offensive in a productivity tool context. Users may be in shared workspaces or on calls.

**Our alternative:** All upgrade modals are silent. Visual elements only. If a demo video is ever included (unlikely), it requires explicit play action and defaults to muted.

### 6.10 NEVER: Email Spam Free Users

**What it looks like:** Collecting free user emails (through optional account creation) and sending frequent upgrade emails.

**Competitor Example:** Freemium tools that send 2-3 "You're missing out on Pro!" emails per week.

**Why it fails:** Email overload is the problem, not the solution. Users unsubscribe, mark as spam (hurting deliverability for all users), and associate the brand with annoyance.

**Our alternative:** Free users are never emailed about upgrades. If a free user creates an account (for buddy features), they receive only transactional emails (buddy notifications, password resets). Pro upgrade emails are only sent if the user explicitly opts into a "Pro interest" list. Pro users receive a maximum of 1 digest email per week (optional, off by default).

### 6.11 NEVER: Remove Features After Trial Ends

**What it looks like:** Giving a free trial of Pro, then after it expires, the user's customizations, data, or settings created during the trial are deleted or inaccessible.

**Competitor Example:** Cloud storage services that allow file uploads during trial, then hold files hostage after expiry.

**Why it fails:** Users experience loss of something they built. This feels like theft, not a business model. Generates intense negative sentiment.

**Our alternative:** If we implement trials: after a trial ends, Pro features are locked but all data created during the trial is preserved. Custom timer settings are saved (just not usable). Report history is saved (just blurred). If the user upgrades later, everything is immediately restored. Nothing is ever deleted.

### 6.12 NEVER: Use Confusing Pricing

**What it looks like:** Multiple tiers with overlapping features, hidden fees, unclear billing cycles, or pricing that changes based on when/where the user sees it.

**Competitor Example:** VPN extensions with "Basic, Plus, Premium, Ultimate" tiers where the differences are unclear and pricing changes based on promotional banners.

**Why it fails:** Confusion creates anxiety. Anxious users don't buy. Simple pricing (Free/Pro/Lifetime) is itself a feature.

**Our alternative:** Two paid options: $4.99/month (or $35.88/year, displayed as $2.99/month) and $49.99 Lifetime. That's it. Pricing is identical everywhere it appears. No hidden fees. No variable pricing. No complex tier comparison needed.

### 6.13 NEVER: Gate Core Safety Features Behind Pro

**What it looks like:** Making Nuclear Mode, the block page, or basic blocking less effective for free users as a way to incentivize upgrades.

**Why it fails:** The user installed this extension to block distractions. If the core blocking is unreliable or weak on Free, the extension is useless, and a useless free tier produces zero conversions.

**Our alternative:** Free blocking is rock-solid. Nuclear Mode (up to 1 hour) is unbreakable. The block page always loads, always shows the timer, always works. Pro extends these capabilities but never undermines the free version.

### 6.14 NEVER: Show Upgrade Prompts After Failed Focus

**What it looks like:** User ends a session early (gives up), visits a blocked site and bypasses the block, or has a low Focus Score, and the extension shows an upgrade prompt implying Pro would have helped.

**Competitor Example:** Fitness apps that show "Go Premium to stay on track!" after the user misses a workout.

**Why it fails:** The user is in a moment of frustration or self-criticism. An upgrade prompt here feels like victim-blaming: "You failed, and it's because you didn't pay us." This is deeply alienating.

**Our alternative:** After a failed or abandoned session, the UI is neutral and supportive: "Every session counts, even short ones. Ready to try again?" No Pro mentions. No upgrade prompts. Let the user recover emotionally before any commercial interaction (minimum 2 completed sessions after a failure before prompts resume).

### 6.15 NEVER: Implement "Upgrade to Remove Ads"

**What it looks like:** Showing ads within the extension to free users, with "Go Pro to remove ads" as an upgrade incentive.

**Why it fails:** Ads in a focus/productivity tool are a category violation. The extension exists to remove distractions. Introducing ads makes the extension a distraction. This is a brand-destroying contradiction.

**Our alternative:** Zero ads, ever, on any tier. The free tier is ad-free. Revenue comes exclusively from Pro subscriptions and Lifetime purchases.

### 6.16 NEVER: Change Free Tier Limits After Launch

**What it looks like:** Launching with "15 free sites" and later reducing to 10, or launching with unlimited schedules and later restricting to 1.

**Competitor Example:** Cloud storage services that reduced free storage quotas for existing users.

**Why it fails:** Users who joined under one set of terms feel betrayed when terms change. This generates negative reviews, social media backlash, and user exodus to competitors. Grandfather clauses help but don't eliminate the damage.

**Our alternative:** Free tier limits are set at launch and are permanent. If anything changes, it only gets more generous. Existing users are always grandfathered at their original terms.

### 6.17 NEVER: Use the Block Page for Upselling

**What it looks like:** Adding Pro upgrade banners, ads, or prominent upsell CTAs to the block page that appears when a user visits a blocked site.

**Why it fails:** The block page is a moment of resistance---the user is fighting a distraction urge. This is a vulnerable, high-willpower moment. Commercializing it teaches users that the block page is annoying rather than helpful, potentially causing them to disable the extension.

**Our alternative:** The block page shows only: remaining time, a motivational quote, and a "Back to work" button. The only Pro-related element on the block page is a small, non-animated "Customize this page --- PRO" text link in the footer (8px, #AAAAAA). During Nuclear Mode, even this link is hidden. The Nuclear extension trigger (T3, final 5 minutes only) is the sole exception and appears as a subtle banner, not a modal.

---

## 7. Measurement Framework

All tracking is local-first (stored in `chrome.storage.local`). No analytics services, no external tracking, no PII collection. Data is used exclusively to optimize the upgrade experience and is never transmitted unless the user has Pro with sync enabled (in which case only focus data syncs, never tracking events).

### 7.1 Event Taxonomy

All events follow the format: `category_action_detail`

#### Presell Events

| Event Name | Fires When | Data Stored |
|---|---|---|
| `presell_view_weekly_report` | Blurred Weekly Report card enters viewport | `{ timestamp, session_number }` |
| `presell_view_score_breakdown` | Score breakdown bars visible on session-complete screen | `{ timestamp, focus_score }` |
| `presell_view_ai_insights` | AI Insight card enters viewport | `{ timestamp }` |
| `presell_click_weekly_report` | User clicks blurred Weekly Report card | `{ timestamp, session_number }` |
| `presell_click_score_breakdown` | User clicks any breakdown bar | `{ timestamp, bar_name }` |
| `presell_click_custom_timer` | User clicks "Customize duration" link | `{ timestamp }` |
| `presell_click_nuclear_extend` | User drags Nuclear slider beyond 1hr | `{ timestamp, attempted_duration }` |
| `presell_click_sound_[name]` | User clicks a locked sound | `{ timestamp, sound_name, preview_count }` |
| `presell_click_11th_site` | User attempts to add 11th site | `{ timestamp, attempted_url_domain }` |
| `presell_click_whitelist` | User clicks "Allow specific pages" | `{ timestamp }` |
| `presell_click_calendar` | User clicks Calendar integration | `{ timestamp }` |
| `presell_click_ai_insights` | User clicks AI Insight card | `{ timestamp }` |
| `presell_click_streak_recovery` | User clicks "Recover My Streak" | `{ timestamp, streak_length }` |
| `presell_click_sync` | User clicks Sync toggle | `{ timestamp }` |
| `presell_click_add_schedule` | User clicks "+ Add Schedule" | `{ timestamp }` |
| `presell_click_custom_block_page` | User clicks Block Page customize | `{ timestamp }` |
| `presell_click_add_buddy` | User clicks "+ Add Buddy" | `{ timestamp }` |

#### Taste of Premium Events

| Event Name | Fires When | Data Stored |
|---|---|---|
| `taste_insight_shown` | A free Pro insight is displayed | `{ timestamp, insight_type, session_number }` |
| `taste_insight_clicked` | User clicks through from a free insight | `{ timestamp, insight_type }` |
| `taste_sound_preview` | User previews a locked sound | `{ timestamp, sound_name, preview_number }` |
| `taste_report_peek` | 5-second report de-blur plays | `{ timestamp, session_number }` |
| `taste_report_peek_upgrade_click` | User clicks upgrade after report peek | `{ timestamp }` |
| `taste_score_flash` | Single score category flashes | `{ timestamp, category, score_delta }` |

#### Faster with Pro Events

| Event Name | Fires When | Data Stored |
|---|---|---|
| `faster_auto_schedule_shown` | Auto-schedule hint displayed | `{ timestamp, pattern_detected }` |
| `faster_auto_stats_shown` | Stats calculation hint displayed | `{ timestamp, time_on_stats_tab }` |
| `faster_whitelist_hint_shown` | Whitelist hint after repeated add/remove | `{ timestamp, site_domain }` |

#### Trigger Events

| Event Name | Fires When | Data Stored |
|---|---|---|
| `trigger_weekly_report_shown` | T1 trigger prompt displayed | `{ timestamp, session_number, days_since_install }` |
| `trigger_weekly_report_clicked` | User clicks "See My Report" | `{ timestamp }` |
| `trigger_weekly_report_dismissed` | User clicks "Maybe Later" | `{ timestamp }` |
| `trigger_weekly_report_converted` | User completes upgrade from T1 | `{ timestamp, plan_type }` |
| `trigger_11th_site_shown` | T2 trigger prompt displayed | `{ timestamp, attempted_domain }` |
| `trigger_11th_site_clicked` | User clicks primary CTA | `{ timestamp }` |
| `trigger_11th_site_dismissed` | User clicks "I'll manage with 10" | `{ timestamp }` |
| `trigger_11th_site_converted` | User completes upgrade from T2 | `{ timestamp, plan_type }` |
| `trigger_nuclear_extend_shown` | T3 trigger prompt displayed | `{ timestamp, minutes_elapsed }` |
| `trigger_nuclear_extend_clicked` | User clicks extension option | `{ timestamp, desired_duration }` |
| `trigger_nuclear_extend_converted` | User completes upgrade from T3 | `{ timestamp, plan_type }` |
| `trigger_streak_recovery_shown` | T4 trigger prompt displayed | `{ timestamp, broken_streak_length }` |
| `trigger_streak_recovery_clicked` | User clicks "Recover My Streak" | `{ timestamp, broken_streak_length }` |
| `trigger_streak_recovery_converted` | User completes upgrade from T4 | `{ timestamp, plan_type, streak_length }` |
| `trigger_organic_[feature]_shown` | T5 organic modal displayed | `{ timestamp, feature_name }` |
| `trigger_organic_[feature]_converted` | User upgrades from T5 | `{ timestamp, feature_name, plan_type }` |

#### Modal Events

| Event Name | Fires When | Data Stored |
|---|---|---|
| `modal_shown` | Any upgrade modal opens | `{ timestamp, variation, trigger_source }` |
| `modal_dismissed` | User closes modal without action | `{ timestamp, variation, time_open_ms }` |
| `modal_cta_primary` | User clicks primary CTA | `{ timestamp, variation, trigger_source }` |
| `modal_cta_secondary` | User clicks secondary CTA | `{ timestamp, variation }` |
| `modal_plan_selected` | User selects a plan in modal | `{ timestamp, plan_type }` |
| `modal_upgrade_complete` | Upgrade transaction confirmed | `{ timestamp, plan_type, trigger_source, variation }` |

### 7.2 Pro Feature Attempt Tracking

Track which Pro features free users attempt to use most frequently. This data informs which features to highlight in marketing, which to potentially move to Free (if a feature gates too many users without converting), and which to use as primary upgrade triggers.

**Storage Structure:**

```javascript
// Stored in chrome.storage.local under key "pro_feature_attempts"
{
  "unlimited_sites": {
    "total_attempts": 14,
    "first_attempt": "2026-01-15T09:30:00Z",
    "last_attempt": "2026-02-10T14:22:00Z",
    "converted": false
  },
  "weekly_report": {
    "total_attempts": 8,
    "first_attempt": "2026-01-20T11:00:00Z",
    "last_attempt": "2026-02-09T16:45:00Z",
    "converted": false
  },
  "custom_timer": {
    "total_attempts": 3,
    "first_attempt": "2026-02-01T08:15:00Z",
    "last_attempt": "2026-02-08T09:00:00Z",
    "converted": false
  },
  // ... all Pro features
}
```

**Tracked Features (complete list):**

1. `unlimited_sites` --- attempts to add 11th+ site
2. `weekly_report` --- clicks on blurred report
3. `monthly_report` --- clicks on blurred monthly report
4. `score_breakdown` --- clicks on breakdown bars
5. `custom_timer` --- clicks on timer customization
6. `nuclear_extend` --- attempts to extend beyond 1hr
7. `whitelist` --- clicks on whitelist option
8. `sync` --- clicks on sync toggle
9. `calendar` --- clicks on calendar integration
10. `ai_insights` --- clicks on AI insight card
11. `custom_block_page` --- clicks on block page customization
12. `sounds_library` --- clicks on any locked sound (aggregate)
13. `streak_recovery` --- clicks on streak recovery
14. `add_buddy` --- clicks on add buddy beyond limit
15. `add_schedule` --- clicks on add schedule beyond limit

**Analysis Points:**

- **Most attempted feature** --- the feature with the highest `total_attempts` across all free users (locally, this is per-user; if server analytics are added later, aggregate across users).
- **Fastest to attempt** --- the feature with the shortest time between install and `first_attempt`. This suggests it should be more prominently featured in upgrade prompts.
- **Attempt-to-conversion ratio** --- for features where `converted` becomes true, how many attempts preceded conversion. High-attempt features that don't convert may need a better prompt. Low-attempt features that convert easily may need more visibility.

### 7.3 Prompt Response Rate Tracking

For each upgrade prompt variation and trigger combination, track:

```javascript
// Stored in chrome.storage.local under key "prompt_metrics"
{
  "T1_value": {
    "shown": 3,
    "dismissed": 2,
    "clicked_primary": 1,
    "clicked_secondary": 0,
    "converted": 0,
    "avg_time_open_ms": 4200
  },
  "T2_feature": {
    "shown": 1,
    "dismissed": 0,
    "clicked_primary": 1,
    "clicked_secondary": 0,
    "converted": 1,
    "avg_time_open_ms": 6800
  },
  // ... all trigger + variation combinations
}
```

**Key Metrics to Monitor:**

| Metric | Formula | Target | Action if Below Target |
|---|---|---|---|
| **Prompt View Rate** | prompts_shown / eligible_sessions | 60-80% | Triggers may be too restrictive; loosen activation conditions. |
| **Prompt Click-Through Rate** | (primary_clicks + secondary_clicks) / prompts_shown | 15-25% | Copy or timing may be off; A/B test variations. |
| **Prompt Dismiss Rate** | dismissed / prompts_shown | < 70% | If higher, prompts are too frequent or poorly timed. |
| **Time-to-Dismiss** | avg_time_open_ms for dismissed prompts | > 2000ms | If lower, users aren't reading. Content may be irrelevant or prompt is appearing at wrong moment. |
| **Trigger Conversion Rate** | converted / prompts_shown (per trigger) | T1: 8-12%, T2: 5-8%, T3: 6-10% | Underperforming triggers need copy revision or timing adjustment. |
| **Variation Effectiveness** | converted / shown (per variation) | Varies | Shift prompt selection toward higher-performing variations. |
| **Free-to-Pro Conversion (Overall)** | total_upgrades / total_installs_with_5plus_sessions | 3-6% | Below 3%: value proposition or pricing issue. Above 6%: free tier may be too restrictive. |
| **Taste-to-Conversion** | upgrades_within_48hr_of_taste / taste_events_shown | 2-4% | Below 2%: taste events aren't compelling enough. Improve insight quality. |

### 7.4 Cohort Windows

To track trends without a server, maintain rolling 7-day and 30-day windows locally:

```javascript
// Stored under key "cohort_windows"
{
  "daily_events": [
    {
      "date": "2026-02-10",
      "presell_views": 4,
      "presell_clicks": 1,
      "trigger_shows": 1,
      "trigger_clicks": 0,
      "taste_events": 1,
      "sessions_completed": 3
    },
    // ... last 30 days
  ]
}
```

Events older than 30 days are aggregated into monthly summaries and individual daily records are deleted to manage storage:

```javascript
// Stored under key "monthly_summaries"
{
  "2026-01": {
    "presell_views": 89,
    "presell_clicks": 14,
    "trigger_shows": 12,
    "trigger_clicks": 4,
    "trigger_conversions": 0,
    "taste_events": 8,
    "sessions_completed": 42
  }
}
```

### 7.5 Adaptive Prompt Selection

After a user has seen multiple prompt variations, the system should bias toward variations with higher engagement for that specific user:

**Algorithm:**

1. For the first 3 prompts shown to a user, use the default variation mapped to each trigger (as defined in Section 2/4).
2. After 3+ prompts, calculate a per-variation score: `score = (clicks / shows) * 0.7 + (time_open_ms / 10000) * 0.3`
3. Select the variation with the highest score for the next prompt. If no variation has been shown more than once, continue with defaults.
4. Every 10th prompt, randomly select a variation regardless of score (exploration vs. exploitation).

This ensures the system learns what resonates with each individual user without requiring server-side A/B testing infrastructure.

### 7.6 Privacy-First Data Principles

| Principle | Implementation |
|---|---|
| **All data is local** | Every event, metric, and summary is stored in `chrome.storage.local`. Nothing is sent to any server unless the user has Pro with sync enabled. |
| **No PII in events** | Events never contain the full URL---only the domain. Never contain user-entered text. Never contain email addresses or names. |
| **User can delete** | Settings page includes "Clear all usage data" button that wipes all tracking events, metrics, and summaries. This is separate from "Clear focus history" (which only affects session data). |
| **No fingerprinting** | No device fingerprinting, no cross-extension tracking, no canvas fingerprinting. The extension does not attempt to identify the user across installations. |
| **Transparent storage** | If the user inspects `chrome.storage.local` via DevTools, the data is human-readable and clearly labeled. No obfuscation. |
| **Sync exclusion** | Even for Pro users with sync enabled, tracking events (`presell_*`, `trigger_*`, `taste_*`, `faster_*`, `modal_*`) are NEVER synced. They remain local to each device. Only focus session data and user settings sync. |

---

## Appendix A: Session Counting Logic

A "session" in this specification refers to a completed focus session (Pomodoro timer ran to completion, not abandoned). Session count is stored in `chrome.storage.local` under `completed_session_count` and increments by 1 after each timer completion.

**Critical Implications:**
- A user who installs and never completes a session never sees any monetization.
- A user who completes 2 sessions on day 1 is in the zero-monetization zone for both.
- A user who completes 1 session per day reaches session 5 (first trigger eligibility) on day 5.
- Session count never resets. It is a lifetime counter.

## Appendix B: Upgrade Modal Component Spec

```
Container:
  Position: Centered overlay, 90% popup width (max 360px)
  Background: #FFFFFF
  Border-radius: 12px
  Padding: 24px
  Shadow: 0 8px 32px rgba(0,0,0,0.12)
  Backdrop: #000000 at 40% opacity, click-to-dismiss enabled
  Animation in: Scale 0.95 -> 1.0, opacity 0 -> 1, 200ms ease-out
  Animation out: Opacity 1 -> 0, 150ms ease-in

Close button:
  Position: Top-right, 12px from edges
  Icon: Lucide "x", 18px, #888888
  Tap target: 36px x 36px minimum

Headline:
  Font: Inter 18px semibold
  Color: #1A1A2E
  Margin-bottom: 8px

Body text:
  Font: Inter 14px regular
  Color: #555555
  Line-height: 1.5
  Margin-bottom: 16px

Primary CTA:
  Width: 100%
  Height: 48px
  Background: #D4A017
  Color: #FFFFFF
  Font: Inter 14px semibold
  Border-radius: 8px
  Hover: Background darkens 10%
  Active: Scale 0.98

Secondary CTA:
  Width: 100%
  Height: 36px
  Background: transparent
  Color: #1B6B9E
  Font: Inter 13px medium
  Margin-top: 8px

Tertiary (dismiss):
  Color: #AAAAAA
  Font: Inter 12px regular
  Margin-top: 12px
  Text-align: center
```

## Appendix C: Plan Selection Component (Inside Upgrade Modal)

When the modal includes plan selection, display three options:

```
[Monthly]                    [Annual --- POPULAR]              [Lifetime]
$4.99/mo                     $2.99/mo                          $49.99
                             billed $35.88/year                one-time
                             Save 40%

Visual treatment:
- Three cards side by side (or stacked on narrow popups)
- Annual card has a gold (#D4A017) top border and "POPULAR" badge
- Selected card: 2px solid #1B6B9E border, light blue background (#1B6B9E at 4%)
- Unselected cards: 1px solid #E0E0E0 border
- Annual is pre-selected by default
- Lifetime card has a small "Best value" label in #D4A017 text
```

## Appendix D: Trigger Decision Tree

```
User completes session:
  |
  ├── Session count < 3?
  |     └── YES: Show nothing. End.
  |
  ├── Session count 3-4?
  |     └── YES: Show Pro badges on locked features (if session 3).
  |           Activate presell touchpoints (if session 4).
  |           No pushed prompts. End.
  |
  ├── Session count >= 5?
  |     ├── Has a pushed prompt been shown this session?
  |     |     └── YES: End.
  |     |
  |     ├── Have 3 pushed prompts been shown this week?
  |     |     └── YES: End.
  |     |
  |     ├── Was a prompt dismissed in last 24 hours?
  |     |     └── YES: End.
  |     |
  |     ├── Is this the same trigger type dismissed in last 48 hours?
  |     |     └── YES: Skip this trigger, check next eligible trigger.
  |     |
  |     ├── T4 eligible? (Streak broken, 7+ day streak, first session after break)
  |     |     └── YES: Show T4 (Streak Recovery). End.
  |     |
  |     ├── T1 eligible? (Session 5+, 7+ days since install, 5+ total sessions)
  |     |     └── YES: Show T1 (Weekly Report). End.
  |     |
  |     ├── T3 eligible? (In Nuclear Mode, final 5 min, 3+ Nuclear uses)
  |     |     └── YES: Show T3 (Nuclear Extension). End.
  |     |
  |     └── No trigger conditions met: End.
  |
  └── (T2 is action-triggered, not session-triggered.
       It fires independently when user adds 11th site.)
```

---

*This specification is a living document. Update metrics targets quarterly based on actual performance data. Never compromise the zero-monetization first sessions or the anti-pattern commitments---these are non-negotiable regardless of conversion rates.*
