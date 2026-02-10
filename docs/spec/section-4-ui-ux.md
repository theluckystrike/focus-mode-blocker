# SECTION 4: USER INTERFACE SPECIFICATION

## Focus Mode - Blocker Chrome Extension

> **Document Version:** 1.0
> **Date:** February 10, 2026
> **Status:** Design Specification Complete
> **Audience:** Designers, Front-End Developers, QA Engineers

---

## Table of Contents

- [4.1 Extension Popup](#41-extension-popup)
- [4.2 Block Page](#42-block-page)
- [4.3 Settings/Options Page](#43-settingsoptions-page)
- [4.4 Pro Feature Indicators](#44-pro-feature-indicators)
- [4.5 Usage Counter UI](#45-usage-counter-ui)
- [4.6 Focus Score Display](#46-focus-score-display)
- [4.7 Notification Designs](#47-notification-designs)
- [4.8 Dark Mode](#48-dark-mode)

---

## Design System Foundation

### Color Palette (Light Mode)

| Token                | Hex       | RGB              | Usage                                              |
|----------------------|-----------|------------------|----------------------------------------------------|
| `--primary-900`      | `#0B1D3A` | 11, 29, 58       | Headings, primary text                             |
| `--primary-700`      | `#143D6B` | 20, 61, 107      | Secondary headings, active nav                     |
| `--primary-500`      | `#1B6B9E` | 27, 107, 158     | Primary buttons, links, active states              |
| `--primary-400`      | `#2A8FBF` | 42, 143, 191     | Button hover states                                |
| `--primary-300`      | `#5BB5D5` | 91, 181, 213     | Focus rings, selected borders                      |
| `--primary-100`      | `#D4EEF7` | 212, 238, 247    | Selected backgrounds, light tint areas             |
| `--primary-50`       | `#EDF7FB` | 237, 247, 251    | Popup background, cards background                 |
| `--accent-gold-600`  | `#B8860B` | 184, 134, 11     | Pro badge, Pro feature indicators                  |
| `--accent-gold-500`  | `#D4A017` | 212, 160, 23     | Pro buttons, premium highlights                    |
| `--accent-gold-400`  | `#E8C547` | 232, 197, 71     | Pro badge hover, gold accents                      |
| `--accent-gold-100`  | `#FFF3CD` | 255, 243, 205    | Pro feature background tint                        |
| `--accent-gold-50`   | `#FFFBEB` | 255, 251, 235    | Pro tooltip background                             |
| `--success-600`      | `#16A34A` | 22, 163, 74      | Streak badges, achievements, completed states      |
| `--success-500`      | `#22C55E` | 34, 197, 94      | Score ring (good), progress bars (healthy)         |
| `--success-100`      | `#DCFCE7` | 220, 252, 231    | Success background tints                           |
| `--warning-600`      | `#D97706` | 217, 119, 6      | Approaching-limit indicators                       |
| `--warning-500`      | `#F59E0B` | 245, 158, 11     | Usage counter (7-8/10), caution states             |
| `--warning-100`      | `#FEF3C7` | 254, 243, 199    | Warning background tints                           |
| `--danger-600`       | `#DC2626` | 220, 38, 38      | Nuclear mode, limit reached, destructive actions   |
| `--danger-500`       | `#EF4444` | 239, 68, 68      | Error states, red counter                          |
| `--danger-100`       | `#FEE2E2` | 254, 226, 226    | Danger background tints                            |
| `--neutral-900`      | `#111827` | 17, 24, 39       | Body text                                          |
| `--neutral-700`      | `#374151` | 55, 65, 81       | Secondary text                                     |
| `--neutral-500`      | `#6B7280` | 107, 114, 128    | Placeholder text, disabled text                    |
| `--neutral-400`      | `#9CA3AF` | 156, 163, 175    | Borders, dividers                                  |
| `--neutral-200`      | `#E5E7EB` | 229, 231, 235    | Light borders, separator lines                     |
| `--neutral-100`      | `#F3F4F6` | 243, 244, 246    | Card backgrounds, subtle fills                     |
| `--neutral-50`       | `#F9FAFB` | 249, 250, 251    | Page background                                    |
| `--white`            | `#FFFFFF` | 255, 255, 255    | Card surfaces, input backgrounds                   |
| `--nuclear-gradient`  | `#DC2626 -> #991B1B` | --     | Nuclear mode button gradient                       |

### Typography

| Element              | Font Family            | Weight | Size   | Line Height | Letter Spacing |
|----------------------|------------------------|--------|--------|-------------|----------------|
| Popup Header Title   | Inter                  | 700    | 16px   | 24px        | -0.01em        |
| Section Heading      | Inter                  | 600    | 14px   | 20px        | -0.006em       |
| Body / Default       | Inter                  | 400    | 13px   | 18px        | 0              |
| Body Bold            | Inter                  | 600    | 13px   | 18px        | 0              |
| Small / Caption      | Inter                  | 400    | 11px   | 16px        | 0.01em         |
| Stat Number (Large)  | Inter                  | 700    | 28px   | 34px        | -0.02em        |
| Stat Number (Medium) | Inter                  | 700    | 20px   | 26px        | -0.02em        |
| Timer Display        | JetBrains Mono         | 600    | 36px   | 44px        | -0.02em        |
| Button (Primary)     | Inter                  | 600    | 13px   | 18px        | 0.01em         |
| Button (Small)       | Inter                  | 500    | 11px   | 16px        | 0.01em         |
| Badge / Label        | Inter                  | 700    | 9px    | 12px        | 0.06em         |
| Input Text           | Inter                  | 400    | 13px   | 18px        | 0              |
| Tab Label            | Inter                  | 500    | 12px   | 16px        | 0.02em         |

**Font Loading:** Inter is loaded from Google Fonts (woff2, subset latin). JetBrains Mono is loaded for the timer display only. Fallback stack: `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`. Timer fallback: `'JetBrains Mono', 'SF Mono', 'Fira Code', monospace`.

### Spacing Scale

| Token  | Value | Usage                                  |
|--------|-------|----------------------------------------|
| `xs`   | 4px   | Icon padding, tight gaps               |
| `sm`   | 8px   | Between related elements               |
| `md`   | 12px  | Card padding, section gaps             |
| `lg`   | 16px  | Between sections, larger padding       |
| `xl`   | 20px  | Popup side margins                     |
| `2xl`  | 24px  | Between major sections                 |
| `3xl`  | 32px  | Block page vertical spacing            |

### Border Radius Scale

| Token     | Value | Usage                                   |
|-----------|-------|-----------------------------------------|
| `sm`      | 4px   | Small buttons, badges                   |
| `md`      | 8px   | Input fields, cards, dropdowns          |
| `lg`      | 12px  | Popup corners, large cards              |
| `xl`      | 16px  | Modal overlays                          |
| `full`    | 9999px| Circular avatars, pills, progress rings |

### Shadow Scale

| Token     | Value                                           | Usage                        |
|-----------|-------------------------------------------------|------------------------------|
| `sm`      | `0 1px 2px rgba(0, 0, 0, 0.05)`                | Cards, subtle elevation      |
| `md`      | `0 4px 6px -1px rgba(0, 0, 0, 0.1)`            | Dropdowns, tooltips          |
| `lg`      | `0 10px 15px -3px rgba(0, 0, 0, 0.1)`          | Modals, slide-up panels      |
| `popup`   | `0 8px 30px rgba(0, 0, 0, 0.12)`               | Extension popup frame        |

### Icon System

All icons use a consistent 18x18px grid with 1.5px stroke width. Icon set: Lucide Icons (MIT license). Key icons used:

| Icon Name       | Context                                | Color                    |
|-----------------|----------------------------------------|--------------------------|
| `shield`        | Block page, blocking active            | `--primary-500`          |
| `lock`          | Pro feature indicator                  | `--accent-gold-500`      |
| `crown`         | Pro badge                              | `--accent-gold-500`      |
| `flame`         | Streak counter                         | `--warning-500`          |
| `zap`           | Quick Focus button                     | `--primary-500`          |
| `clock`         | Timer, session duration                | `--neutral-700`          |
| `bar-chart-2`   | Analytics, stats                       | `--primary-500`          |
| `target`        | Focus Score ring                       | `--success-500`          |
| `volume-2`      | Ambient sounds                         | `--primary-500`          |
| `settings`      | Settings gear                          | `--neutral-500`          |
| `x-circle`      | Distraction attempts blocked           | `--danger-500`           |
| `check-circle`  | Completed, success                     | `--success-500`          |
| `alert-triangle` | Nuclear mode, warnings                | `--danger-600`           |
| `calendar`      | Schedule blocking                      | `--primary-500`          |
| `users`         | Accountability buddy                   | `--primary-500`          |
| `trophy`        | Achievement                            | `--accent-gold-500`      |

---

## 4.1 Extension Popup

### Dimensions and Container

| Property          | Value                                              |
|-------------------|----------------------------------------------------|
| Width             | 380px                                              |
| Min Height        | 500px                                              |
| Max Height        | 580px                                              |
| Background        | `--neutral-50` (#F9FAFB)                           |
| Border Radius     | 12px (Chrome applies its own rounding on some OS)  |
| Padding           | 0 (internal elements handle their own padding)     |
| Overflow          | `hidden` on container; `auto` on scroll region     |
| Shadow            | Applied by Chrome popup frame                      |

### Layout Architecture

The popup is divided into four vertical zones:

```
+------------------------------------------+
|              HEADER (56px)               |
|------------------------------------------|
|            TAB BAR (40px)                |
|------------------------------------------|
|                                          |
|         CONTENT AREA (scrollable)        |
|         (344px - 464px)                  |
|                                          |
|------------------------------------------|
|              FOOTER (40px)               |
+------------------------------------------+
```

### Header Specification

Height: 56px. Background: `--white`. Border-bottom: 1px solid `--neutral-200`. Padding: 0 20px.

```
+------------------------------------------+
|  [icon]  Focus Mode          [gear] [?]  |
|          ~~~~~~~~~~~~                     |
|          Free / PRO badge                 |
+------------------------------------------+
```

| Element             | Spec                                                                |
|---------------------|---------------------------------------------------------------------|
| App Icon            | 24x24px SVG shield icon, `--primary-500` fill. Left-aligned.       |
| App Name            | "Focus Mode" -- Inter 700, 16px, `--primary-900`. 8px right of icon. |
| Tier Badge (Free)   | Invisible -- no badge shown for free users.                        |
| Tier Badge (Pro)    | "PRO" pill badge. 28x16px. Background `--accent-gold-500`. Text: Inter 700, 9px, `--white`, uppercase, letter-spacing 0.06em. Border-radius: full. 6px right of app name, vertically centered. |
| Settings Gear       | Lucide `settings` icon, 18x18px, `--neutral-500`. Right-aligned. 8px padding. Hover: `--primary-500`, rotate 90deg transition 200ms. |
| Help Icon           | Lucide `help-circle` icon, 18x18px, `--neutral-500`. 8px left of gear. Hover: `--primary-500`. |

### Tab Bar Specification

Height: 40px. Background: `--white`. Border-bottom: 1px solid `--neutral-200`. Padding: 0 20px.

Three tabs, evenly distributed. Tab labels use Inter 500, 12px, letter-spacing 0.02em.

```
+------------------------------------------+
|   [Home]      [Blocklist]    [Stats]     |
|   ~~~~~~                                  |
+------------------------------------------+
```

| State    | Text Color       | Indicator                                                  |
|----------|------------------|------------------------------------------------------------|
| Active   | `--primary-500`  | 2px bottom border, `--primary-500`, full tab width, radius 1px top |
| Inactive | `--neutral-500`  | No indicator                                               |
| Hover    | `--primary-700`  | Background: `--primary-50`, transition 150ms               |

Tab icons (optional, shown left of text): Home = `home` (16x16), Blocklist = `shield` (16x16), Stats = `bar-chart-2` (16x16). Icons are 4px left of label text.

---

### 4.1.1 Home Tab -- Default State (No Active Session)

This is the primary view when the user opens the popup and no focus session is running.

```
+------------------------------------------+  0px
|  [S] Focus Mode               [gear] [?] |  HEADER
|                                          |  56px
|------------------------------------------|
|   Home        Blocklist       Stats      |  TAB BAR
|   ~~~~                                    |  40px
|------------------------------------------|
|                                          |
|            FOCUS SCORE RING              |
|                                          |
|              ( 74 )                      |  Score ring
|             /      \                     |  120x120px
|            |  74   |                     |  centered
|             \      /                     |
|              (    )                      |
|                                          |
|          Today's Focus Score             |  Caption
|                                          |
|  +--------------------------------------+|
|  |                                      ||
|  |   [ZAP]  Quick Focus                 ||  QUICK FOCUS
|  |          Start 25-min session        ||  BUTTON
|  |                                      ||  60px height
|  +--------------------------------------+|
|                                          |
|  +--------------------------------------+|
|  |  TODAY'S STATS                       ||
|  |                                      ||
|  |  [clock] 2h 14m       [flame] 7 days||  Stats row 1
|  |  Focus Time            Streak        ||
|  |                                      ||
|  |  [shield] 34           [x] 12        ||  Stats row 2
|  |  Sites Blocked         Attempts      ||
|  |                                      ||
|  +--------------------------------------+|
|                                          |
|  +--------------------------------------+|
|  |  [music] Ambient Sounds         [>]  ||  Sounds row
|  +--------------------------------------+|
|                                          |
|  +--------------------------------------+|
|  |  [calendar] Next Schedule    2:00 PM ||  Schedule row
|  +--------------------------------------+|
|                                          |
|------------------------------------------|
|  8/10 sites  [=======--]   Go Pro       |  FOOTER
+------------------------------------------+  580px
```

#### Element Specifications -- Default State

**Focus Score Ring:**
- Dimensions: 120x120px circle, centered horizontally
- Ring stroke: 8px width
- Ring background (track): `--neutral-200`
- Ring fill: Color based on score (see Section 4.6)
- Score number: Inter 700, 28px, `--primary-900`, centered in ring
- Label below ring: "Today's Focus Score" -- Inter 400, 11px, `--neutral-500`, centered, 4px below ring
- Margin: 20px top, 16px bottom

**Quick Focus Button:**
- Dimensions: Full width minus 40px (20px padding each side). Height: 56px.
- Background: Linear gradient 135deg from `--primary-500` to `--primary-400`
- Border-radius: 12px
- Shadow: `0 2px 8px rgba(27, 107, 158, 0.3)`
- Hover: Shadow expands to `0 4px 12px rgba(27, 107, 158, 0.4)`, slight translateY(-1px), transition 200ms
- Active: translateY(0), shadow shrinks
- Icon: Lucide `zap`, 20x20px, `--white`, 16px from left edge
- Title: "Quick Focus" -- Inter 600, 14px, `--white`, 8px right of icon
- Subtitle: "Start 25-min session" -- Inter 400, 11px, `rgba(255,255,255,0.8)`, below title
- Content block is left-aligned vertically centered within the button
- Margin-bottom: 16px

**Today's Stats Card:**
- Background: `--white`
- Border: 1px solid `--neutral-200`
- Border-radius: 12px
- Padding: 16px
- Margin: 0 20px 12px 20px
- Header: "TODAY'S STATS" -- Inter 700, 9px, `--neutral-500`, uppercase, letter-spacing 0.06em
- Stats arranged in a 2x2 grid with 12px gap
- Each stat cell:
  - Icon: 16x16px, respective color
  - Value: Inter 700, 20px, `--primary-900`
  - Label: Inter 400, 11px, `--neutral-500`
  - Layout: icon top-left, value below icon, label below value

**Ambient Sounds Row:**
- Background: `--white`
- Border: 1px solid `--neutral-200`
- Border-radius: 8px
- Height: 44px
- Padding: 0 16px
- Margin: 0 20px 8px 20px
- Icon: Lucide `volume-2`, 16x16px, `--primary-500`
- Label: "Ambient Sounds" -- Inter 400, 13px, `--neutral-900`
- Chevron: Lucide `chevron-right`, 16x16px, `--neutral-400`, right-aligned
- Hover: Background `--primary-50`, transition 150ms
- Click: Expands to show 3 sound options (free) with play/pause toggles

**Schedule Row:**
- Same styling as Ambient Sounds Row
- Icon: Lucide `calendar`, 16x16px, `--primary-500`
- Label: "Next Schedule" -- Inter 400, 13px, `--neutral-900`
- Time: "2:00 PM" -- Inter 600, 13px, `--primary-500`, right-aligned before chevron

**Footer** (see Section 4.5 for full counter spec):
- Height: 40px
- Background: `--white`
- Border-top: 1px solid `--neutral-200`
- Padding: 0 20px
- Left: Usage counter text "8/10 sites" -- Inter 400, 11px, `--neutral-700`
- Center: Progress bar (see Section 4.5)
- Right: "Go Pro" link -- Inter 600, 11px, `--accent-gold-500`, no underline, hover underline

---

### 4.1.2 Home Tab -- Active Session State (Timer Running)

When a Pomodoro session or Quick Focus session is active, the Home tab transforms to show the timer prominently.

```
+------------------------------------------+  0px
|  [S] Focus Mode  PRO          [gear] [?] |  HEADER
|                                          |  56px
|------------------------------------------|
|   Home        Blocklist       Stats      |  TAB BAR
|   ~~~~                                    |  40px
|------------------------------------------|
|                                          |
|            SESSION ACTIVE                |
|                                          |
|             18 : 42                      |  TIMER
|           ~~~~~~~~~~                     |  Large display
|                                          |
|          [==============----]            |  Progress bar
|                                          |
|     Pomodoro Session  --  25 min         |  Session label
|                                          |
|  +--------------------------------------+|
|  |  BLOCKING                            ||
|  |                                      ||
|  |  [shield] 7 sites active             ||  Active blocks
|  |  [x-circle] 3 attempts blocked       ||  Live counter
|  |                                      ||
|  +--------------------------------------+|
|                                          |
|  +--------------------------------------+|
|  |  LIVE FOCUS SCORE                    ||
|  |                                      ||
|  |  ( 82 )    Excellent focus           ||  Mini ring
|  |                                      ||  + label
|  +--------------------------------------+|
|                                          |
|  +--------------------------------------+|
|  |  [music] Rain + Lo-fi      [||]      ||  Now Playing
|  +--------------------------------------+|
|                                          |
|  +----+  +-------------------------------+
|  |PAUSE|  |  END SESSION                  |  Action btns
|  +----+  +-------------------------------+
|                                          |
|------------------------------------------|
|  Focus session in progress...            |  FOOTER
+------------------------------------------+
```

#### Element Specifications -- Active Session

**Timer Display:**
- Font: JetBrains Mono 600, 36px, `--primary-900`
- Format: `MM : SS` with fixed-width digits (monospaced prevents layout shift)
- Centered horizontally
- Margin: 24px top, 8px bottom
- Colon blinks: opacity toggles between 1.0 and 0.3 every 1 second, CSS animation

**Session Progress Bar:**
- Width: Full width minus 80px (40px margin each side)
- Height: 6px
- Border-radius: full
- Track: `--neutral-200`
- Fill: Linear gradient from `--primary-500` to `--success-500`
- Fill width: Proportional to elapsed/total time (e.g., 7min/25min = 28%)
- Animation: Width transition `linear` per second (smooth fill)
- Centered, 8px below timer

**Session Label:**
- "Pomodoro Session -- 25 min" (or "Quick Focus -- 25 min", "Custom -- 45 min")
- Inter 400, 11px, `--neutral-500`, centered
- 4px below progress bar

**Blocking Card:**
- Same card styling as Today's Stats
- "BLOCKING" header -- Inter 700, 9px, `--neutral-500`, uppercase
- Row 1: Shield icon + "7 sites active" -- Inter 400, 13px, `--neutral-900`
- Row 2: X-circle icon + "3 attempts blocked" -- Inter 400, 13px, `--danger-500`
- The attempts counter updates in real-time with a subtle scale-up animation (1.0 to 1.1 to 1.0 over 300ms) each time a new attempt is blocked

**Live Focus Score (Mini):**
- Card with same styling
- "LIVE FOCUS SCORE" header
- 48x48px ring (same style as main ring, scaled down) left-aligned
- Score number: Inter 700, 20px, inside ring
- Label: "Excellent focus" / "Good focus" / "Needs improvement" -- Inter 400, 13px, right of ring
- Score updates every 60 seconds during the session

**Now Playing Row:**
- Same row styling as Ambient Sounds
- Icon: Lucide `music`, 16x16px, `--primary-500`
- Label: Current sound name(s) -- Inter 400, 13px, `--neutral-900`
- Pause button: Lucide `pause`, 16x16px, `--neutral-500`, replaces play icon when playing
- Hidden if no sound is playing

**Action Buttons:**
- Container: Full width minus 40px, flex row, 8px gap
- Pause Button:
  - Width: 56px, Height: 44px
  - Background: `--neutral-100`
  - Border: 1px solid `--neutral-200`
  - Border-radius: 8px
  - Icon: Lucide `pause`, 18x18px, `--neutral-700`
  - Hover: Background `--neutral-200`
- End Session Button:
  - Flex: 1 (fills remaining width)
  - Height: 44px
  - Background: `--neutral-100`
  - Border: 1px solid `--neutral-200`
  - Border-radius: 8px
  - Text: "End Session" -- Inter 600, 13px, `--neutral-700`
  - Hover: Border `--danger-500`, text `--danger-500`

**Footer (Active Session):**
- Text: "Focus session in progress..." -- Inter 400, 11px, `--primary-500`
- Animated pulsing dot (6x6px circle, `--success-500`) left of text, opacity pulses 0.4 to 1.0 on 2s interval

---

### 4.1.3 Home Tab -- Post-Session Summary

Appears immediately after a session ends. Stays visible until the user navigates away or dismisses it.

```
+------------------------------------------+  0px
|  [S] Focus Mode               [gear] [?] |  HEADER
|                                          |  56px
|------------------------------------------|
|   Home        Blocklist       Stats      |  TAB BAR
|   ~~~~                                    |  40px
|------------------------------------------|
|                                          |
|         [check-circle]                   |  Success icon
|      Session Complete!                   |  48px green
|                                          |
|  +--------------------------------------+|
|  |  SESSION SUMMARY                     ||
|  |                                      ||
|  |  Duration        25 min              ||
|  |  Sites Blocked   7                   ||
|  |  Attempts        4 blocked           ||
|  |  Focus Score     82 / 100            ||
|  |                                      ||
|  +--------------------------------------+|
|                                          |
|  +--------------------------------------+|
|  |  PRO INSIGHTS              [lock]    ||  PRO INSIGHTS
|  |                                      ||  (blurred for
|  |  Peak focus     ████████             ||   free users)
|  |  Top distraction ██████              ||
|  |  Recommendation  ████████████        ||
|  |                                      ||
|  |  [Unlock Insights - Try Pro]         ||
|  +--------------------------------------+|
|                                          |
|  +--------------------------------------+|
|  |  STREAK                              ||
|  |                                      ||
|  |  [flame] 7 days     Personal best!   ||
|  |          ~~~~~~~~                     ||
|  +--------------------------------------+|
|                                          |
|  [Start New Session]                     |  Primary btn
|                                          |
|  Done                                    |  Text link
|                                          |
|------------------------------------------|
|  8/10 sites  [=======--]   Go Pro       |  FOOTER
+------------------------------------------+
```

#### Element Specifications -- Post-Session Summary

**Success Header:**
- Lucide `check-circle` icon, 48x48px, `--success-500`, centered
- "Session Complete!" -- Inter 700, 16px, `--primary-900`, centered, 8px below icon
- Margin: 20px top
- Entrance animation: Icon scales from 0 to 1.0 with a bounce ease-out (300ms). A subtle confetti effect (12 small colored dots) bursts from the icon, fades over 1.5s. Confetti colors: `--primary-300`, `--success-500`, `--accent-gold-400`, `--warning-500`.

**Session Summary Card:**
- Standard card styling
- "SESSION SUMMARY" header
- Each row: Label (Inter 400, 13px, `--neutral-500`, left-aligned) + Value (Inter 600, 13px, `--primary-900`, right-aligned)
- Row height: 32px
- 1px `--neutral-100` divider between rows

**Pro Insights Card (Free User):**
- Standard card styling with `--accent-gold-50` background
- Border: 1px solid `--accent-gold-100`
- Header: "PRO INSIGHTS" -- Inter 700, 9px, `--accent-gold-600`, uppercase
- Lock icon: Lucide `lock`, 14x14px, `--accent-gold-500`, right of header
- Three rows of "blurred" text:
  - Label text is readable: "Peak focus", "Top distraction", "Recommendation"
  - Label: Inter 400, 13px, `--neutral-500`
  - Value: Replaced by blurred bar -- CSS `filter: blur(6px)` applied to a placeholder element of random width (60-120px). Background: `--primary-300`. Height: 14px. Border-radius: 4px.
  - The bars shimmer: A subtle left-to-right gradient animation (3s infinite) with a lighter stripe moving across the blurred bar
- CTA Button: "Unlock Insights - Try Pro"
  - Width: full card width minus padding
  - Height: 36px
  - Background: `--accent-gold-500`
  - Border-radius: 8px
  - Text: Inter 600, 12px, `--white`
  - Hover: Background `--accent-gold-600`
  - Margin-top: 12px

**Pro Insights Card (Pro User):**
- Same card styling but with `--primary-50` background and `--primary-100` border
- No lock icon
- Header: "SESSION INSIGHTS" (no "PRO" label needed)
- Values are fully visible:
  - "Peak focus" -> "10:23 - 10:41 AM" -- Inter 600, 13px, `--primary-900`
  - "Top distraction" -> "twitter.com (3x)" -- Inter 600, 13px, `--danger-500`
  - "Recommendation" -> "Block Twitter before starting" -- Inter 600, 13px, `--primary-700`

**Streak Card:**
- Standard card styling
- Flame icon: 20x20px, `--warning-500`
- Value: "7 days" -- Inter 700, 20px, `--primary-900`
- Subtext: Conditionally shows "Personal best!" if current streak is the longest ever recorded -- Inter 600, 11px, `--success-500`

**Start New Session Button:**
- Full width minus 40px
- Height: 44px
- Background: `--primary-500`
- Border-radius: 8px
- Text: "Start New Session" -- Inter 600, 13px, `--white`
- Hover: Background `--primary-400`

**Done Link:**
- "Done" -- Inter 500, 13px, `--neutral-500`, centered, 8px below button
- Hover: `--primary-500`
- Click: Returns to default Home state

---

### 4.1.4 Blocklist Tab

Shows the user's current blocked sites and allows adding/removing.

```
+------------------------------------------+
|  [S] Focus Mode               [gear] [?] |  HEADER
|                                          |
|------------------------------------------|
|   Home        Blocklist       Stats      |  TAB BAR
|               ~~~~~~~~~                   |
|------------------------------------------|
|                                          |
|  BLOCKED SITES                   8 / 10  |  Section hdr
|                                          |
|  +--------------------------------------+|
|  |  [social] Social Media        [on ]  ||  Pre-built
|  |  12 sites                            ||  list 1
|  +--------------------------------------+|
|  |  [news]   News & Media        [on ]  ||  Pre-built
|  |  8 sites                             ||  list 2
|  +--------------------------------------+|
|  |  [game]   Gaming        [lock] PRO   ||  Pre-built
|  |  6 sites                             ||  list 3
|  +--------------------------------------+|
|  |  [shop]   Shopping      [lock] PRO   ||  Pre-built
|  |  10 sites                            ||  list 4
|  +--------------------------------------+|
|                                          |
|  CUSTOM SITES                    4 / 10  |  Section hdr
|                                          |
|  +--------------------------------------+|
|  |  reddit.com              [x]         ||  Site row 1
|  |  twitter.com             [x]         ||  Site row 2
|  |  youtube.com             [x]         ||  Site row 3
|  |  tiktok.com              [x]         ||  Site row 4
|  +--------------------------------------+|
|                                          |
|  +--------------------------------------+|
|  | [+] Add website...                   ||  Input field
|  +--------------------------------------+|
|                                          |
|  +--------------------------------------+|
|  |  [lock] Wildcard patterns      PRO   ||  PRO feature
|  |  [lock] Whitelist mode         PRO   ||  PRO feature
|  +--------------------------------------+|
|                                          |
|------------------------------------------|
|  8/10 sites  [=======--]   Go Pro       |  FOOTER
+------------------------------------------+
```

#### Element Specifications -- Blocklist Tab

**Section Headers:**
- "BLOCKED SITES" / "CUSTOM SITES" -- Inter 700, 9px, `--neutral-500`, uppercase, letter-spacing 0.06em
- Counter "8 / 10" -- Inter 600, 11px. Color depends on count state (see Section 4.5)
- Margin: 20px left, 20px right, 16px top, 8px bottom

**Pre-Built List Rows:**
- Background: `--white`
- Border: 1px solid `--neutral-200`
- Border-radius: 8px (first item top corners, last item bottom corners; or 8px each with 4px gap)
- Height: 52px per row
- Padding: 0 16px
- Icon: Category icon, 20x20px, `--primary-500`
- Name: Inter 500, 13px, `--neutral-900`, 8px right of icon
- Count: "12 sites" -- Inter 400, 11px, `--neutral-500`, below name
- Toggle (free): iOS-style toggle switch, 36x20px
  - Off: Background `--neutral-300`, knob `--white`
  - On: Background `--primary-500`, knob `--white`
  - Transition: 200ms ease
- Locked lists (Pro):
  - Toggle replaced with lock icon (14x14px, `--accent-gold-500`) + "PRO" pill (see Section 4.4)
  - Row opacity: 0.7
  - Click opens Pro upsell tooltip (see Section 4.4)

**Custom Site Rows:**
- Same row styling
- Favicon: 16x16px fetched from `https://www.google.com/s2/favicons?domain=SITE&sz=32`
- Domain text: Inter 400, 13px, `--neutral-900`
- Remove button: Lucide `x`, 16x16px, `--neutral-400`, right-aligned
  - Hover: `--danger-500`
  - Click: Slide-left removal animation (200ms), row collapses vertically (150ms)

**Add Website Input:**
- Background: `--white`
- Border: 1px solid `--neutral-200`
- Border-radius: 8px
- Height: 40px
- Padding: 0 12px
- Placeholder: "Add website..." -- Inter 400, 13px, `--neutral-400`
- Plus icon: Lucide `plus`, 16x16px, `--neutral-400`, left of input
- Focus state: Border `--primary-300`, shadow `0 0 0 3px rgba(91, 181, 213, 0.15)`
- On enter/submit: Validates URL, adds site row with slide-down animation
- When 10/10 reached:
  - Input is disabled
  - Placeholder changes to "Blocklist full -- Upgrade to Pro"
  - Background: `--neutral-100`
  - Border: 1px dashed `--warning-500`
  - Plus icon color: `--warning-500`

**Pro Feature Rows:**
- "Wildcard patterns" and "Whitelist mode"
- Same styling as pre-built lists but with `--accent-gold-50` background
- Lock icon: 14x14px, `--accent-gold-500`
- "PRO" pill badge (see Section 4.4)
- Click: Shows Pro upsell slide-up panel

---

### 4.1.5 Stats Tab

Shows daily statistics with Pro analytics blurred for free users.

```
+------------------------------------------+
|  [S] Focus Mode               [gear] [?] |  HEADER
|                                          |
|------------------------------------------|
|   Home        Blocklist       Stats      |  TAB BAR
|                               ~~~~~      |
|------------------------------------------|
|                                          |
|  TODAY           Yesterday    This Week  |  Date selector
|  ~~~~~                                    |
|                                          |
|  +--------------------------------------+|
|  |  FOCUS TIME                          ||
|  |                                      ||
|  |  2h 14m                              ||  Large stat
|  |  ===========================----     ||  Progress to
|  |  Goal: 3h                            ||  daily goal
|  +--------------------------------------+|
|                                          |
|  +--------------------------------------+|
|  |  [shield]     [x-circle]  [flame]    ||
|  |    34            12          7       ||  Stat trio
|  |  Blocked      Attempts     Streak    ||
|  +--------------------------------------+|
|                                          |
|  +--------------------------------------+|
|  |  FOCUS SESSIONS                      ||
|  |                                      ||
|  |  09:00  25 min  ========    82       ||  Session 1
|  |  10:30  45 min  =============  78    ||  Session 2
|  |  14:00  25 min  ========    91       ||  Session 3
|  +--------------------------------------+|
|                                          |
|  +--------------------------------------+|
|  |  WEEKLY REPORT              [lock]   ||  PRO section
|  |                                      ||
|  |  ████████████████████████            ||  Blurred
|  |  █████████████                       ||  preview
|  |  ████████████████                    ||
|  |                                      ||
|  |  [Unlock Weekly Reports - Go Pro]    ||
|  +--------------------------------------+|
|                                          |
|------------------------------------------|
|  8/10 sites  [=======--]   Go Pro       |  FOOTER
+------------------------------------------+
```

#### Element Specifications -- Stats Tab

**Date Selector:**
- Three text buttons in a row: "Today", "Yesterday", "This Week"
- Container: Margin 0 20px, 12px top
- Each button: Inter 500, 12px
- Active: `--primary-500`, 2px bottom border, font-weight 600
- Inactive: `--neutral-500`
- "This Week" available for free users (last 7 days). "This Month" is Pro-only and shown as a 4th option with lock icon.

**Focus Time Card:**
- Standard card styling
- Large number: "2h 14m" -- Inter 700, 28px, `--primary-900`
- Progress bar below: 4px height, border-radius full
  - Track: `--neutral-200`
  - Fill: `--success-500` (if on track), `--warning-500` (if behind)
  - Width: proportional to time/goal (e.g., 2h14m / 3h = 75%)
- Goal text: "Goal: 3h" -- Inter 400, 11px, `--neutral-500`, right-aligned below bar

**Stat Trio:**
- Standard card, 3 columns evenly distributed
- Each column: Icon (16x16) top, value (Inter 700, 20px, `--primary-900`) middle, label (Inter 400, 11px, `--neutral-500`) bottom
- Text centered in each column
- 1px `--neutral-200` vertical divider between columns

**Focus Sessions List:**
- Standard card
- Each session row: Height 40px
  - Time: "09:00" -- Inter 400, 11px, `--neutral-500`, 48px width
  - Duration: "25 min" -- Inter 500, 12px, `--neutral-700`, 56px width
  - Mini bar: Height 6px, border-radius full, flex-grow 1, background `--primary-300`, opacity proportional to score (higher = more opaque)
  - Score: Inter 600, 12px, color based on score range. 40px width, right-aligned.
- Row divider: 1px `--neutral-100`

**Weekly Report Card (Free User):**
- Background: `--accent-gold-50`
- Border: 1px solid `--accent-gold-100`
- "WEEKLY REPORT" header with lock icon
- Three blurred text lines (same blur technique as Pro Insights in post-session)
- CTA: "Unlock Weekly Reports - Go Pro" button, same gold styling as Pro Insights CTA
- Below CTA: "You've completed 12 sessions this week" -- Inter 400, 11px, `--neutral-500` (shown unblurred as a teaser)

**Weekly Report Card (Pro User):**
- Background: `--white`
- Full content visible: Weekly focus time chart (small bar chart, 7 bars for each day), top distraction site, focus trend (arrow up/down + percentage), recommended focus windows

---

### 4.1.6 Free vs Pro Popup Differences Summary

| Element                        | Free User                                     | Pro User                                       |
|--------------------------------|-----------------------------------------------|------------------------------------------------|
| Header badge                   | None                                          | "PRO" gold pill badge                          |
| Focus Score Ring               | Score number only, no breakdown               | Score number + mini breakdown on hover         |
| Quick Focus button subtitle    | "Start 25-min session"                        | "Start session" (customizable duration)        |
| Ambient Sounds                 | 3 sounds, no mixing                           | 15+ sounds with mix sliders                    |
| Post-session Insights          | Blurred with upgrade CTA                      | Fully visible                                  |
| Stats: Weekly view             | Last 7 days only                              | Full history, monthly view                     |
| Stats: Weekly Report           | Blurred with upgrade CTA                      | Full interactive report                        |
| Blocklist: Pre-built lists     | 2 (Social + News)                             | All 6+ categories                              |
| Blocklist: Custom sites        | Up to 10                                      | Unlimited                                      |
| Blocklist: Wildcard/Whitelist  | Locked with PRO badge                         | Fully accessible                               |
| Footer                         | Usage counter + "Go Pro" link                 | No counter (unlimited), no "Go Pro"            |
| Extension icon badge           | Timer countdown during session                | Timer + small PRO dot                          |

---

## 4.2 Block Page

The motivational block page replaces the content of any blocked site. This page is seen potentially 100+ times per day and is the single highest-impression surface in the extension.

### 4.2.1 Block Page Layout -- Free Version

Full-page takeover. Background fills the entire browser viewport.

```
+================================================================+
|                                                                |
|  Background: Subtle gradient                                   |
|  #EDF7FB (top) -> #FFFFFF (bottom)                             |
|                                                                |
|                                                                |
|                                                                |
|                    [SHIELD ICON]                               |
|                      64x64px                                   |
|                                                                |
|               This site is blocked.                            |
|                                                                |
|          "The secret of getting ahead is                       |
|              getting started."                                 |
|                    -- Mark Twain                                |
|                                                                |
|                                                                |
|       +------------------------------------------+             |
|       |                                          |             |
|       |  [flame] 7-day streak     [clock] 18:42  |             |
|       |                           remaining      |             |
|       |                                          |             |
|       |  [shield] 34 blocked      [hourglass]    |             |
|       |           today           2h 14m saved   |             |
|       |                                          |             |
|       +------------------------------------------+             |
|                                                                |
|                                                                |
|            [   Back to Work   ]                                |
|                                                                |
|            [   Take a Break   ]                                |
|                                                                |
|                                                                |
|       You tried to visit twitter.com                           |
|       Attempt #5 today                                         |
|                                                                |
|                                                                |
|     +----------------------------------------------+           |
|     |  Customize this page with Pro         [->]   |           |
|     +----------------------------------------------+           |
|                                                                |
|                                                                |
|       Focus Mode - Blocker    Privacy-first.                   |
|       Your data never leaves your device.                      |
|                                                                |
+================================================================+
```

### 4.2.2 Block Page Specifications

**Page Container:**
- Width: 100vw, Height: 100vh
- Background: Linear gradient from `--primary-50` (#EDF7FB) at top to `--white` (#FFFFFF) at 60% height
- Content centered both vertically and horizontally using flexbox
- Max content width: 480px
- Padding: 48px 32px

**Shield Icon:**
- Lucide `shield-check` icon, 64x64px
- Color: `--primary-500`
- Subtle entrance animation: fade-in + scale from 0.8 to 1.0, 400ms ease-out
- Margin-bottom: 24px

**Block Message:**
- "This site is blocked." -- Inter 700, 24px, `--primary-900`
- Margin-bottom: 24px

**Motivational Quote:**
- Quote text: Inter 400, 16px, `--neutral-700`, italic, centered
- Line height: 24px
- Max width: 400px
- Attribution: "-- Mark Twain" -- Inter 500, 13px, `--neutral-500`, right-aligned
- Margin-bottom: 32px
- Quotes rotate: A new quote is shown each time the page loads. Source: Array of 50+ curated motivational quotes stored in the extension. No API call needed.

**Stats Card:**
- Background: `--white`
- Border: 1px solid `--neutral-200`
- Border-radius: 12px
- Shadow: `sm`
- Padding: 20px 24px
- 2x2 grid layout with 16px gap
- Each stat:
  - Icon: 18x18px, respective color
  - Value: Inter 700, 18px, `--primary-900`
  - Label: Inter 400, 11px, `--neutral-500`
- Stat 1 (top-left): Streak -- flame icon (`--warning-500`), "7-day streak"
- Stat 2 (top-right): Timer -- clock icon (`--primary-500`), "18:42 remaining" (only during active session; if no session, shows "No active timer")
- Stat 3 (bottom-left): Blocked -- shield icon (`--success-500`), "34 blocked today"
- Stat 4 (bottom-right): Time saved -- hourglass icon (`--primary-500`), "2h 14m saved" (calculated as: distraction_attempts x 23 min average recovery time / 60)
- Margin-bottom: 32px

**Back to Work Button:**
- Width: 240px, Height: 48px, centered
- Background: `--primary-500`
- Border-radius: 8px
- Text: "Back to Work" -- Inter 600, 14px, `--white`
- Hover: Background `--primary-400`, shadow `md`
- Click: Navigates to the previously visited productive site or `chrome://newtab`
- Margin-bottom: 8px

**Take a Break Button:**
- Width: 240px, Height: 40px, centered
- Background: transparent
- Border: 1px solid `--neutral-300`
- Border-radius: 8px
- Text: "Take a Break" -- Inter 500, 13px, `--neutral-700`
- Hover: Background `--neutral-50`, border `--neutral-400`
- Click (no active session): Navigates to `chrome://newtab`
- Click (active session): Shows tooltip "Your session has 18:42 remaining. End session first?" with confirm/cancel

**Blocked Site Info:**
- "You tried to visit twitter.com" -- Inter 400, 13px, `--neutral-500`
- "Attempt #5 today" -- Inter 600, 13px, `--danger-500`
- Centered, margin-top: 24px
- The attempt number increments in real-time with a subtle bounce animation

**Pro Upsell Banner (Free Users Only):**
- Background: `--accent-gold-50`
- Border: 1px solid `--accent-gold-100`
- Border-radius: 8px
- Padding: 12px 16px
- Content: "Customize this page with Pro" -- Inter 500, 12px, `--accent-gold-600`
- Arrow icon: Lucide `arrow-right`, 14x14px, `--accent-gold-500`, right-aligned
- Hover: Background `--accent-gold-100`
- Click: Opens options page to Pro upgrade screen
- Positioned at bottom of content area, margin-top: 32px
- NOT shown during first 3 days of usage (per the "Magic Paywall Moment" spec)

**Privacy Footer:**
- "Focus Mode - Blocker" -- Inter 600, 11px, `--neutral-400`
- "Privacy-first. Your data never leaves your device." -- Inter 400, 11px, `--neutral-400`
- Centered, bottom of viewport, padding-bottom: 24px
- Fixed position -- does not scroll

### 4.2.3 Block Page -- Pro Version (Custom)

Pro users can customize every element of the block page.

**Customizable Elements:**
| Element           | Free Default                   | Pro Customization Options                                                      |
|-------------------|-------------------------------|--------------------------------------------------------------------------------|
| Background        | Gradient (primary-50 to white)| Solid color picker, gradient editor, uploaded background image (max 2MB)       |
| Icon              | Shield-check                  | Choose from 20 icons, upload custom SVG (max 50KB)                             |
| Block message     | "This site is blocked."       | Custom text (max 100 characters)                                               |
| Quote source      | Built-in quotes (50+)         | Add custom quotes, import from API, disable quotes                             |
| Quote style       | Italic body text              | Font size, color, alignment                                                    |
| Stats card        | All 4 stats shown             | Toggle individual stats on/off, reorder                                        |
| Buttons           | "Back to Work" + "Take a Break" | Custom button text, colors, link targets                                    |
| Redirect behavior | Manual button click            | Auto-redirect after X seconds to a specified productive URL                    |
| Sounds            | None                          | Play ambient sound on block page load                                          |
| Breathing exercise| Not available                  | Add 4-7-8 breathing animation below quote                                     |

**Pro Block Page Settings (accessed from Options page):**

```
+------------------------------------------+
|  CUSTOMIZE BLOCK PAGE           Preview  |
|                                          |
|  Background                              |
|  ( ) Gradient  (x) Solid  ( ) Image     |
|  [color picker: #EDF7FB]                 |
|                                          |
|  Block Message                           |
|  [This site is blocked._____________]   |
|                                          |
|  Motivational Quotes                     |
|  [x] Show quotes                        |
|  [x] Built-in quotes (50+)              |
|  [ ] Custom quotes only                  |
|  [+ Add custom quote]                    |
|                                          |
|  Stats Display                           |
|  [x] Streak   [x] Timer                 |
|  [x] Blocked  [x] Time Saved            |
|                                          |
|  Redirect                                |
|  [ ] Auto-redirect after [5] seconds    |
|  Redirect URL: [________________]        |
|                                          |
|  Breathing Exercise                      |
|  [ ] Show breathing exercise             |
|                                          |
+------------------------------------------+
```

---

## 4.3 Settings/Options Page

The options page opens in a full browser tab (`chrome-extension://[ID]/options.html`).

### 4.3.1 Layout Architecture

Width: Responsive, max 960px centered. Two-column layout on screens > 768px: left sidebar navigation (240px) + right content area (720px). Single column on narrower screens.

```
+------------------------------------------------------------------+
|                                                                  |
|  [logo] Focus Mode - Blocker              Free | [Upgrade to Pro]|
|                                                                  |
+--------+---------------------------------------------------------+
|        |                                                         |
|  NAV   |                    CONTENT AREA                         |
| (240px)|                     (720px)                             |
|        |                                                         |
| General|  +-------------------------------------------------+    |
| -------+  |                                                 |    |
| Blocking  |   GENERAL SETTINGS                              |    |
| -------+  |                                                 |    |
| Timer  |  |   ...content for selected section...            |    |
| -------+  |                                                 |    |
| Stats  |  |                                                 |    |
| -------+  |                                                 |    |
| Sounds |  |                                                 |    |
| -------+  |                                                 |    |
| Schedule  |                                                 |    |
| -------+  |                                                 |    |
| Block  |  |                                                 |    |
|  Page  |  |                                                 |    |
| -------+  |                                                 |    |
| Account|  |                                                 |    |
| -------+  |                                                 |    |
| About  |  +-------------------------------------------------+    |
|        |                                                         |
+--------+---------------------------------------------------------+
```

### 4.3.2 Options Page Visual Specifications

**Page Background:** `--neutral-50` (#F9FAFB)

**Top Bar:**
- Height: 64px
- Background: `--white`
- Border-bottom: 1px solid `--neutral-200`
- Shadow: `sm`
- Logo: 28x28px shield icon + "Focus Mode - Blocker" -- Inter 700, 18px, `--primary-900`
- Right side: Tier label ("Free" -- Inter 500, 12px, `--neutral-500` or "Pro" with gold badge) + "Upgrade to Pro" button (only for free users)
- Upgrade button: Background `--accent-gold-500`, text `--white`, Inter 600, 12px, border-radius 6px, padding 8px 16px, hover `--accent-gold-600`

**Sidebar Navigation:**
- Background: `--white`
- Border-right: 1px solid `--neutral-200`
- Padding: 16px 0
- Each nav item:
  - Height: 40px
  - Padding: 0 20px
  - Icon: 18x18px, left-aligned, 12px gap to text
  - Text: Inter 500, 13px
  - Active: Background `--primary-50`, text `--primary-500`, icon `--primary-500`, left border 3px solid `--primary-500`
  - Inactive: text `--neutral-700`, icon `--neutral-500`
  - Hover: Background `--neutral-50`
  - Pro-only sections: Small lock icon (12x12px, `--accent-gold-500`) right-aligned in the nav item

**Content Area:**
- Background: `--white`
- Border-radius: 12px (on inner card)
- Padding: 32px
- Max-width: 720px

### 4.3.3 Complete Settings List by Section

#### Section: General

| Setting                  | Type        | Free | Pro  | Description                                           |
|--------------------------|-------------|------|------|-------------------------------------------------------|
| Start on browser launch  | Toggle      | Yes  | Yes  | Auto-open popup when Chrome starts                    |
| Keyboard shortcuts       | Keybind UI  | Yes  | Yes  | Set shortcuts for start/stop session, open popup      |
| Default session duration | Dropdown    | No   | Yes  | Choose default timer (25/30/45/60/90/120 min). Free locked to 25. |
| Launch Quick Focus on click| Toggle    | Yes  | Yes  | Clicking extension icon starts session vs opens popup |
| Notification preferences | Toggles     | Yes  | Yes  | Enable/disable session notifications                  |
| Daily focus goal         | Number input| Yes  | Yes  | Set daily focus time goal (in hours/minutes)          |
| Weekly focus goal        | Number input| No   | Yes  | Set weekly focus time goal                            |
| Monthly focus goal       | Number input| No   | Yes  | Set monthly focus time goal                           |
| Data export (JSON)       | Button      | No   | Yes  | Export all settings and data                          |
| Data import (JSON)       | Button      | Yes  | Yes  | Import settings file                                  |
| Reset all data           | Button      | Yes  | Yes  | Destructive action with confirmation dialog           |

#### Section: Blocking

| Setting                    | Type         | Free | Pro  | Description                                         |
|----------------------------|--------------|------|------|-----------------------------------------------------|
| Manual blocklist           | URL list     | 10   | Unlimited | Add/remove blocked URLs                        |
| Pre-built lists            | Toggles      | 2    | 6+   | Enable/disable category lists                       |
| Wildcard patterns          | URL list     | No   | Yes  | Add patterns like `*.reddit.com`                    |
| Whitelist mode             | Toggle       | No   | Yes  | Block everything except allowed sites               |
| Whitelist URLs             | URL list     | No   | Yes  | Sites allowed in whitelist mode                     |
| Redirect blocked sites     | Toggle + URL | No   | Yes  | Redirect to productive URL instead of block page    |
| Redirect target URL        | Text input   | No   | Yes  | The URL to redirect to                              |
| Block in incognito         | Toggle       | Yes  | Yes  | Requires separate Chrome permission prompt          |
| Nuclear option duration    | Slider       | 1hr max | 24hr max | Max lockdown duration                        |

#### Section: Timer

| Setting                  | Type        | Free | Pro  | Description                                         |
|--------------------------|-------------|------|------|-----------------------------------------------------|
| Pomodoro focus duration  | Number      | 25 only | 1-240 | Minutes for focus period                         |
| Pomodoro break duration  | Number      | 5 only  | 1-60  | Minutes for short break                          |
| Long break duration      | Number      | 15 only | 1-120 | Minutes for long break                           |
| Sessions before long break| Number     | 4 only  | 1-12  | Number of focus periods before long break        |
| Auto-start next session  | Toggle      | No   | Yes  | Automatically begin next session after break     |
| Break reminder style     | Radio       | Sound only | Sound / Screen overlay / Notification | Break notification type |
| Timer sound              | Dropdown    | Default | 5 options | Sound played at session end                 |
| Show timer in tab title  | Toggle      | Yes  | Yes  | Shows "18:42 - Focus Mode" in browser tab title  |

#### Section: Stats & Analytics

| Setting                  | Type        | Free | Pro  | Description                                         |
|--------------------------|-------------|------|------|-----------------------------------------------------|
| Session history view     | Display     | 7 days | Full | View past sessions                               |
| Weekly reports           | Display     | No   | Yes  | Detailed weekly analytics report                    |
| Monthly reports          | Display     | No   | Yes  | Detailed monthly analytics report                   |
| Focus Score display      | Toggle      | Yes  | Yes  | Show/hide Focus Score                               |
| Score breakdown          | Display     | No   | Yes  | Detailed factors contributing to score              |
| Export analytics (CSV)   | Button      | No   | Yes  | Export data as CSV                                  |
| Export analytics (PDF)   | Button      | No   | Yes  | Export report as PDF                                |
| Distraction report emails| Toggle      | No   | Yes  | Weekly email summary                                |

#### Section: Sounds

| Setting                  | Type        | Free | Pro  | Description                                         |
|--------------------------|-------------|------|------|-----------------------------------------------------|
| Rain                     | Play/Volume | Yes  | Yes  | Rain ambient sound                                  |
| White Noise              | Play/Volume | Yes  | Yes  | White noise ambient sound                           |
| Lo-fi Beats              | Play/Volume | Yes  | Yes  | Lo-fi music ambient sound                           |
| Ocean Waves              | Play/Volume | No   | Yes  | Ocean ambient sound                                 |
| Forest                   | Play/Volume | No   | Yes  | Forest ambient sound                                |
| Fireplace                | Play/Volume | No   | Yes  | Crackling fire ambient sound                        |
| Coffee Shop              | Play/Volume | No   | Yes  | Cafe ambient sound                                  |
| Thunderstorm             | Play/Volume | No   | Yes  | Storm ambient sound                                 |
| Birds                    | Play/Volume | No   | Yes  | Birdsong ambient sound                              |
| Wind                     | Play/Volume | No   | Yes  | Wind ambient sound                                  |
| Brown Noise              | Play/Volume | No   | Yes  | Brown noise ambient sound                           |
| Pink Noise               | Play/Volume | No   | Yes  | Pink noise ambient sound                            |
| Deep Focus               | Play/Volume | No   | Yes  | Binaural beats ambient sound                        |
| Library                  | Play/Volume | No   | Yes  | Library ambient sound                               |
| Train                    | Play/Volume | No   | Yes  | Train journey ambient sound                         |
| Sound mixing             | Multi-slider| No   | Yes  | Layer up to 3 sounds simultaneously with individual volume |
| Auto-play on session     | Toggle      | Yes  | Yes  | Automatically play selected sound when session starts|

Each free sound row shows a play button and volume slider. Each Pro sound row shows a lock icon and "PRO" badge. Clicking a locked sound plays a 5-second preview then shows upgrade prompt.

#### Section: Schedule

| Setting                  | Type        | Free | Pro  | Description                                         |
|--------------------------|-------------|------|------|-----------------------------------------------------|
| Schedule 1               | Schedule UI | Yes  | Yes  | Day-of-week + time range schedule                   |
| Schedule 2-N             | Schedule UI | No   | Yes  | Additional schedules                                |
| Calendar integration     | OAuth       | No   | Yes  | Connect Google Calendar for auto-sessions           |
| Auto-start on schedule   | Toggle      | Yes  | Yes  | Automatically start focus when schedule begins      |
| Schedule notifications   | Toggle      | Yes  | Yes  | Notify 5 min before scheduled session               |

**Schedule UI Element:**
```
+------------------------------------------+
|  Schedule 1: "Work Focus"                |
|                                          |
|  Days:                                   |
|  [M] [T] [W] [T] [F] [ ] [ ]           |
|                                          |
|  Time: [09:00] to [17:00]               |
|                                          |
|  Block list: [Use default_______v]       |
|                                          |
|  [Save]                                  |
+------------------------------------------+
```

Day pills: 32x32px circles. Selected: `--primary-500` background, `--white` text. Unselected: `--neutral-100` background, `--neutral-500` text. Hover: `--primary-100` background.

#### Section: Block Page

See Section 4.2.3 for Pro customization details.

| Setting                  | Type        | Free | Pro  | Description                                         |
|--------------------------|-------------|------|------|-----------------------------------------------------|
| Quote display            | Toggle      | Yes  | Yes  | Show/hide motivational quotes                       |
| Stats display            | Toggle      | Yes  | Yes  | Show/hide stats card on block page                  |
| Custom message           | Text input  | No   | Yes  | Replace "This site is blocked" text                 |
| Custom background        | Color/Image | No   | Yes  | Change block page background                        |
| Custom quotes            | Text list   | No   | Yes  | Add personal motivational quotes                    |
| Auto-redirect            | Toggle + URL| No   | Yes  | Auto-navigate away from blocked page                |
| Breathing exercise       | Toggle      | No   | Yes  | Show 4-7-8 breathing animation                      |

#### Section: Account

| Setting                  | Type        | Free | Pro  | Description                                         |
|--------------------------|-------------|------|------|-----------------------------------------------------|
| Account email            | Display     | --   | Yes  | Show linked email                                   |
| Subscription status      | Display     | --   | Yes  | Show plan and renewal date                          |
| Cross-device sync        | Toggle      | No   | Yes  | Enable/disable sync                                 |
| Focus buddy              | Invite UI   | 1    | Unlimited | Invite accountability buddies                  |
| Buddy list               | Display     | 1    | Unlimited | View and manage buddies                        |
| Manage subscription      | Link        | --   | Yes  | Opens Stripe customer portal                        |

#### Section: About

| Setting                  | Type        | Free | Pro  | Description                                         |
|--------------------------|-------------|------|------|-----------------------------------------------------|
| Version                  | Display     | Yes  | Yes  | Extension version number                            |
| Privacy policy           | Link        | Yes  | Yes  | Opens privacy policy page                           |
| Terms of service         | Link        | Yes  | Yes  | Opens terms page                                    |
| Support                  | Link        | Yes  | Yes  | Opens support/contact page                          |
| Rate on Chrome Web Store | Link        | Yes  | Yes  | Opens CWS review page                              |
| Open source licenses     | Link        | Yes  | Yes  | Opens licenses page                                 |

### 4.3.4 Settings Page -- Pro Feature Lock Presentation

For each Pro-only setting in the options page, the entire setting row is rendered but visually muted:

```
+------------------------------------------+
|  [lock] Wildcard Patterns           PRO  |
|                                          |
|  Block sites using patterns like         |
|  *.reddit.com or *facebook*              |
|                                          |
|  [text input - disabled, faded]          |
|                                          |
|  [Upgrade to Pro to unlock]             |
+------------------------------------------+
```

- The setting label and description are visible at full contrast
- The lock icon (16x16px, `--accent-gold-500`) appears left of the label
- The "PRO" pill badge appears right-aligned (see Section 4.4)
- Input elements are shown but: opacity 0.4, pointer-events none, cursor not-allowed
- A subtle dashed border (`--accent-gold-200`) wraps the entire setting area
- Below the disabled controls: "Upgrade to Pro to unlock" -- Inter 500, 12px, `--accent-gold-600`, clickable, hover underline
- Clicking anywhere on the locked setting opens a focused upgrade modal

---

## 4.4 Pro Feature Indicators

A consistent visual language for communicating free vs Pro status across every surface.

### 4.4.1 Lock Icon

**Standard Lock Icon:**
- Icon: Lucide `lock`, filled variant
- Sizes: 12px (inline/nav), 14px (card headers), 16px (settings rows), 20px (block page CTA)
- Color: `--accent-gold-500` (#D4A017)
- Never use the lock icon in any color other than gold -- this establishes the "gold = Pro" association

**Lock Icon Placement Rules:**
- Always to the LEFT of the feature name in list/row contexts
- Always to the RIGHT of the section header in card contexts
- Never placed over interactive elements (no overlay locks on buttons)
- Minimum 4px margin from adjacent text

### 4.4.2 PRO Badge

**Small PRO Badge (inline, used in popup and settings):**
- Dimensions: 28px x 16px
- Background: `--accent-gold-500` (#D4A017)
- Border-radius: full (9999px)
- Text: "PRO" -- Inter 700, 9px, `--white`, uppercase, letter-spacing 0.06em
- Centered text vertically and horizontally
- Margin-left: 6px from associated text

**Large PRO Badge (header, used in options page header):**
- Dimensions: 40px x 20px
- Same style as small, scaled up
- Text: Inter 700, 10px

**Extension Icon PRO Indicator:**
- When a Pro user has the extension installed, the extension toolbar icon receives a 6x6px gold dot in the bottom-right corner
- The dot is `--accent-gold-500` with a 1px `--white` border (for contrast against various toolbar backgrounds)
- Implemented via `chrome.action.setBadgeBackgroundColor` and a custom SVG overlay

### 4.4.3 Blur Effect Specification

Used to obscure Pro-only content that free users should be aware of but cannot access.

**CSS Blur Implementation:**
```css
.pro-blur {
  filter: blur(6px);
  user-select: none;
  pointer-events: none;
  position: relative;
}
.pro-blur::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(212, 160, 23, 0.05) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: pro-shimmer 3s ease-in-out infinite;
}
@keyframes pro-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

**Blur Behavior:**
- Blur radius: 6px (enough to obscure text but show shape/length)
- The blurred content uses real placeholder data (not lorem ipsum) -- e.g., "Tuesday 9-11 AM" is blurred, not "Lorem ipsum"
- A gold shimmer animation sweeps across the blurred area every 3 seconds, drawing the eye
- Blurred areas are not selectable or copyable
- The blur effect is applied to: analytics values, chart data, recommendation text, weekly report content

**Where Blur is Used:**
| Location                  | What is Blurred                                           |
|---------------------------|-----------------------------------------------------------|
| Post-session summary      | Peak focus time, top distraction site, recommendation     |
| Stats tab: weekly report  | Weekly chart, trend data, top distractions, focus windows |
| Block page (none)         | Block page shows no blurred content -- too disruptive     |
| Notification              | Weekly report preview text                                |

### 4.4.4 Hover/Tooltip on Locked Items

When a free user hovers over any locked feature (lock icon, PRO badge, blurred content, or locked settings row):

**Tooltip Specification:**
- Appears after 300ms hover delay
- Position: Above the element, centered horizontally, with 8px gap
- Arrow: 8x8px CSS triangle pointing down, same color as tooltip background
- Background: `--accent-gold-50` (#FFFBEB)
- Border: 1px solid `--accent-gold-200`
- Border-radius: 8px
- Shadow: `md`
- Padding: 12px 16px
- Max-width: 240px

**Tooltip Content:**
- Feature name: Inter 600, 13px, `--primary-900`
- Description: Inter 400, 12px, `--neutral-700`, 1-2 sentences max
- CTA: "Upgrade to Pro" -- Inter 600, 12px, `--accent-gold-600`, underlined, clickable
- Example: Hovering over locked "Wildcard Patterns":
  ```
  +--------------------------------------+
  |  Wildcard Patterns                   |
  |                                      |
  |  Block entire groups of sites with   |
  |  patterns like *.reddit.com          |
  |                                      |
  |  Upgrade to Pro ->                   |
  +--------------------------------------+
           V (arrow)
  ```

**Click Behavior on Locked Items:**
- Clicking a locked feature opens a slide-up panel in the popup (or modal in the options page)
- The panel shows: Feature name, 1-sentence benefit, the feature's visual preview (screenshot or icon), pricing, and a CTA button
- "Maybe later" dismiss link below the CTA
- The panel is not a system modal -- it's an in-app overlay so it does not feel aggressive

### 4.4.5 Visual Hierarchy Free vs Pro

**Free Elements (always visible, no special marking):**
- Green checkmark (Lucide `check`, 14x14px, `--success-500`) in feature lists where Pro features have locks
- Standard interactive colors (`--primary-500` for links, `--neutral-900` for text)
- Full opacity, full interactivity

**Pro Elements (locked for free users):**
- Lock icon + "PRO" badge
- Opacity: 0.6 on disabled controls
- Cursor: `not-allowed` on disabled controls, `pointer` on the lock/badge area
- Background tint: `--accent-gold-50` on locked cards/sections
- Border: 1px solid `--accent-gold-100` on locked cards

**Pro Elements (unlocked for Pro users):**
- No lock icon, no "PRO" badge
- Full opacity, full interactivity
- Same styling as free elements -- no visual distinction once unlocked
- Exception: The header PRO badge remains as a status indicator

### 4.4.6 "Upgrade to Unlock" Inline Messaging

Three levels of upgrade messaging, used in different contexts:

**Level 1: Passive (badge only)**
- Just the lock icon + "PRO" badge next to the feature name
- No text CTA
- Used: In navigation menus, feature lists, first 3 days of usage

**Level 2: Contextual (badge + link)**
- Lock icon + "PRO" badge + "Upgrade to Pro" text link
- Used: In settings rows, stats tab, after day 3

**Level 3: Active (card + CTA button)**
- Dedicated card with feature description + benefit + pricing + button
- Used: Post-session insights card, weekly report card, when user explicitly clicks a locked feature
- Gold-tinted card with prominent CTA button

**Messaging Rules:**
- NEVER show Level 3 messaging during an active focus session
- NEVER interrupt a user action with an upgrade prompt
- Level 1 only during the first 3 days of usage
- Level 2 from day 3 onward
- Level 3 only in response to user interaction with a locked feature, or in dedicated upgrade surfaces (post-session, stats tab)
- Maximum 2 upgrade CTAs visible on any single popup screen at any time

---

## 4.5 Usage Counter UI

The usage counter tracks the free user's blocklist against the 10-site limit. It appears in the popup footer and the options page.

### 4.5.1 Popup Footer Counter

**Layout:**
```
+------------------------------------------+
|  8/10 sites  [=======---]    Go Pro      |
+------------------------------------------+
```

**Specifications:**
- Container: Full popup width, 40px height, `--white` background, border-top 1px `--neutral-200`
- Padding: 0 20px
- Three elements in a flex row: counter text | progress bar | upgrade link

**Counter Text:**
- Format: "X/10 sites" -- Inter 500, 11px
- Color varies by state (see below)
- Width: auto, flex-shrink 0

**Progress Bar:**
- Height: 4px
- Border-radius: full
- Width: flex-grow 1, margin 0 12px
- Track: `--neutral-200`
- Fill: Color varies by state, width proportional to X/10

**"Go Pro" Link:**
- "Go Pro" -- Inter 600, 11px, `--accent-gold-500`
- Hover: underline
- Click: Opens upgrade panel
- Width: auto, flex-shrink 0
- Hidden for Pro users (entire footer changes)

### 4.5.2 Counter Color States

| Sites Used | Range   | Text Color       | Bar Fill Color   | Bar Track           | Behavior                              |
|------------|---------|------------------|------------------|---------------------|---------------------------------------|
| 0-6        | Safe    | `--success-600`  | `--success-500`  | `--neutral-200`     | Standard display                      |
| 7-8        | Warning | `--warning-600`  | `--warning-500`  | `--neutral-200`     | Text gains medium weight (600)        |
| 9          | Critical| `--warning-600`  | `--warning-500`  | `--neutral-200`     | Bar pulses subtly (opacity 0.7-1.0, 2s)|
| 10         | Full    | `--danger-600`   | `--danger-500`   | `--danger-100`      | Full animation (see below)            |

### 4.5.3 Animation When Limit Reached (10/10)

When the user reaches 10/10 blocked sites:

1. The progress bar fill transitions to `--danger-500` (300ms ease)
2. The counter text changes to "10/10 sites - Limit reached" in `--danger-600` bold
3. The entire footer background briefly flashes `--danger-100` (200ms) then returns to `--white`
4. The "Go Pro" link text changes to "Unlock unlimited" and gains a subtle gold glow effect:
   ```css
   text-shadow: 0 0 8px rgba(212, 160, 23, 0.3);
   ```
5. In the Blocklist tab, the "Add website" input is disabled with:
   - Placeholder: "Blocklist full -- Upgrade to Pro"
   - Dashed border in `--warning-500`
   - An inline slide-down panel appears above the input:
   ```
   +--------------------------------------+
   |  You've blocked your top 10.         |
   |  Unlock unlimited sites, patterns,   |
   |  and whitelist mode.                 |
   |                                      |
   |  [Upgrade to Pro - $4.99/mo]         |
   |  [Keep my 10 sites]                  |
   +--------------------------------------+
   ```
   This panel uses `--accent-gold-50` background and `--accent-gold-100` border.

### 4.5.4 Counter Behavior for Pro Users

Pro users see no counter. The footer changes to:
```
+------------------------------------------+
|  [check] Unlimited sites     Manage      |
+------------------------------------------+
```
- Check icon: 14x14px, `--success-500`
- "Unlimited sites" -- Inter 500, 11px, `--success-600`
- "Manage" link -- Inter 500, 11px, `--primary-500`, opens options page blocking section

### 4.5.5 Counter in Options Page

In the Blocking settings section, the counter appears as a larger element:

```
+------------------------------------------+
|  BLOCKLIST USAGE                         |
|                                          |
|  8 of 10 sites used                     |
|                                          |
|  [================--------]              |
|                                          |
|  Add more sites with Pro - $4.99/mo     |
+------------------------------------------+
```

- Progress bar: 8px height (larger than popup), same color logic
- Wider and more prominent than the popup counter
- "Add more sites with Pro" only appears at 7+ sites (below 7, this line is hidden)

---

## 4.6 Focus Score Display

The Focus Score (0-100) quantifies the user's focus quality. No competitor has this feature.

### 4.6.1 Score Format -- Circular Progress Ring

**Ring Specifications:**
| Property         | Value                                        |
|------------------|----------------------------------------------|
| Outer diameter   | 120px (popup home, block page), 80px (stats), 48px (mini/inline) |
| Stroke width     | 8px (120px), 6px (80px), 4px (48px)          |
| Track color      | `--neutral-200`                              |
| Fill direction   | Clockwise from 12 o'clock (top)              |
| Fill dash        | SVG `stroke-dasharray` + `stroke-dashoffset`  |
| Fill animation   | On mount: 0 to target value over 800ms, ease-out |
| Center content   | Score number, centered vertically and horizontally |
| Score font       | Inter 700, 28px (120px ring), 20px (80px), 14px (48px) |
| Score color      | `--primary-900`                              |

**Implementation:** SVG `<circle>` element with `stroke-dasharray` set to the circle circumference and `stroke-dashoffset` animated from full circumference to the proportional offset for the current score.

### 4.6.2 Score Color Coding

| Score Range | Label             | Ring Fill Color  | Score Text Color  | Label Color      |
|-------------|-------------------|------------------|-------------------|------------------|
| 90-100      | "Exceptional"     | `#16A34A` (success-600) | `--primary-900` | `--success-600` |
| 75-89       | "Great focus"     | `#22C55E` (success-500) | `--primary-900` | `--success-500` |
| 60-74       | "Good"            | `#F59E0B` (warning-500) | `--primary-900` | `--warning-600` |
| 40-59       | "Needs work"      | `#F59E0B` (warning-500) | `--primary-900` | `--warning-600` |
| 0-39        | "Distracted"      | `#EF4444` (danger-500)  | `--primary-900` | `--danger-600`  |

### 4.6.3 Where the Score is Displayed

| Location            | Ring Size | Additional Info Shown                                  | Free | Pro |
|---------------------|-----------|--------------------------------------------------------|------|-----|
| Popup Home (default)| 120px     | Score number + label below ring                        | Yes  | Yes |
| Popup Home (active) | 48px      | Mini ring + text label inline in "Live Focus Score" card| Yes  | Yes |
| Post-session summary| 80px      | Score number + label, inside Session Summary card      | Yes  | Yes |
| Block page          | 80px      | Score number only, in stats card area                  | No   | Yes |
| Stats tab           | 80px      | Score number + label + trend arrow                     | Yes  | Yes |
| Weekly report       | 120px     | Score + breakdown chart (Pro only)                     | Blurred | Yes |
| Notification        | Text only | "Focus Score: 82 (Great focus)"                       | Yes  | Yes |

### 4.6.4 Score Breakdown (What Contributes to Score)

The Focus Score is calculated from four weighted factors:

| Factor              | Weight | What It Measures                                      | Scoring                                         |
|---------------------|--------|-------------------------------------------------------|-------------------------------------------------|
| Session Completion  | 35%    | Did you complete the full session without ending early?| 100% if completed, proportional if ended early  |
| Distraction Resistance | 30% | How many blocked-site attempts during the session?    | 100% at 0 attempts, -10 per attempt, floor at 0|
| Consistency         | 20%    | How many sessions this week vs your goal?             | Proportional to weekly goal completion          |
| Streak Maintenance  | 15%    | Current streak length (daily sessions)                | Logarithmic: 1 day=30, 3 days=50, 7 days=70, 14 days=85, 30+=100 |

**Free User Score View:**
- Shows: Total score number + color ring + label
- Does NOT show: Individual factor scores, weight breakdown
- Below the ring: "See what drives your score" -- Inter 400, 11px, `--neutral-500`

**Pro User Score View (popup hover or stats page):**

```
+--------------------------------------+
|  FOCUS SCORE BREAKDOWN               |
|                                      |
|  ( 82 )         Great focus          |
|                                      |
|  Session Completion    92 / 100      |
|  [========================----]      |
|                                      |
|  Distraction Resistance 70 / 100    |
|  [==================----------]      |
|                                      |
|  Consistency           85 / 100      |
|  [=====================-------]      |
|                                      |
|  Streak                80 / 100      |
|  [====================--------]      |
+--------------------------------------+
```

Each factor row:
- Label: Inter 400, 12px, `--neutral-700`
- Score: Inter 600, 12px, `--primary-900`, right-aligned
- Bar: 4px height, border-radius full, color same as main ring color, width proportional to factor score
- Bar track: `--neutral-200`

---

## 4.7 Notification Designs

All notifications use the Chrome Notifications API (`chrome.notifications.create`). Notification design is constrained by Chrome's native notification system, but the content and timing are fully controlled.

### 4.7.1 Session Start Notification

**Trigger:** When a focus session begins (Quick Focus, Pomodoro start, or scheduled session auto-start).

**Chrome Notification Type:** `basic`

| Field          | Value                                                                 |
|----------------|-----------------------------------------------------------------------|
| Title          | "Focus session started"                                               |
| Message        | "25-minute Pomodoro session. 7 sites blocked. Stay focused!"          |
| Icon           | Extension icon (shield), 128x128px                                    |
| Priority       | 0 (default)                                                           |
| requireInteraction | false                                                             |
| Auto-dismiss   | 5 seconds                                                            |

**Contextual variants:**
- Quick Focus: "Quick Focus started -- 25 minutes of distraction-free work."
- Custom session: "45-minute deep work session started. 7 sites blocked."
- Scheduled: "Scheduled focus time started (Mon-Fri 9:00 AM). Blocking active."
- Nuclear: "Nuclear mode activated. No escape for the next [duration]. Focus hard."

### 4.7.2 Session End Notification

**Trigger:** When a session timer reaches zero.

**Chrome Notification Type:** `basic`

| Field          | Value                                                                 |
|----------------|-----------------------------------------------------------------------|
| Title          | "Session complete! Great work."                                       |
| Message        | "25 min focused. 4 distractions blocked. Focus Score: 82."            |
| Icon           | Extension icon, 128x128px                                             |
| Priority       | 1 (slightly elevated to ensure visibility)                            |
| requireInteraction | true (stays until dismissed or clicked)                           |
| Buttons        | Button 1: "Start Another" -- starts a new session                     |
|                | Button 2: "View Summary" -- opens popup to post-session view         |
| Auto-dismiss   | None (requires interaction)                                           |

### 4.7.3 Break Notification

**Trigger:** When a Pomodoro break period begins.

| Field          | Value                                                                 |
|----------------|-----------------------------------------------------------------------|
| Title          | "Time for a break!"                                                   |
| Message        | "5-minute break. Stretch, hydrate, look away from the screen."        |
| Icon           | Extension icon, 128x128px                                             |
| Priority       | 1                                                                     |
| Buttons        | Button 1: "Skip Break" -- immediately starts next focus period        |
|                | Button 2: "Extend Break" (Pro) -- adds 5 min to break               |

### 4.7.4 Streak Milestone Notification

**Trigger:** When the user reaches specific streak milestones.

**Milestones and Messages:**

| Streak  | Title                                  | Message                                                        |
|---------|----------------------------------------|----------------------------------------------------------------|
| 3 days  | "3-day streak! You're building a habit"| "Keep going. Most people quit on day 2. You didn't."           |
| 7 days  | "1 week streak! Incredible."          | "7 days of focused work. You're in the top 15% of users."     |
| 14 days | "2 weeks of focus. Unstoppable."      | "Your consistency is exceptional. Your Focus Score is trending up." |
| 30 days | "30-day streak! Legendary."           | "You've built a true focus habit. Share your achievement?"     |
| 60 days | "60 days. This is who you are now."   | "2 months of daily focus. You're a productivity machine."      |
| 100 days| "Triple digits. 100-day streak."      | "Only 1% of users reach 100 days. You're in rare company."    |

**Chrome Notification Type:** `basic`

| Field          | Value                                                                 |
|----------------|-----------------------------------------------------------------------|
| Icon           | Extension icon with flame overlay, 128x128px                          |
| Priority       | 2 (high -- milestones are important motivational moments)             |
| requireInteraction | true                                                              |
| Buttons        | Button 1: "View Stats" -- opens popup to stats view                   |
|                | Button 2: At 30+ days only: "Share" (Pro) -- opens shareable card     |

### 4.7.5 Weekly Report Notification (Primary Conversion Trigger)

**Trigger:** After the user completes their 5th focus session (typically day 3-5). Then weekly on Sunday evening at 7 PM local time.

**This is the #1 free-to-Pro conversion trigger.** It combines genuine value with a blurred preview to drive curiosity.

**Chrome Notification Type:** `basic`

| Field          | Value                                                                 |
|----------------|-----------------------------------------------------------------------|
| Title          | "Your Weekly Focus Report is ready"                                   |
| Message        | "This week: 11h 23m focused, 127 distractions blocked. See your full report." |
| Icon           | Extension icon, 128x128px                                             |
| Priority       | 1                                                                     |
| requireInteraction | true                                                              |
| Buttons        | Button 1: "View Report" -- opens popup to Stats tab                   |

**What happens when the user clicks "View Report":**

**Free User:** The popup opens to the Stats tab with the Weekly Report card showing blurred content (see Section 4.1.5). The unblurred teaser text shows total sessions and total blocked distractions. The blurred content shows trend charts, top distraction sites, peak focus hours, and recommendations. The CTA reads "Unlock Weekly Reports - Go Pro."

**Pro User:** The popup opens to the Stats tab showing the full, unblurred weekly report with all data visible and interactive.

**First-Time Delivery (5th session):**
The first weekly report notification uses enhanced messaging:

| Field          | Value                                                                 |
|----------------|-----------------------------------------------------------------------|
| Title          | "Your First Weekly Focus Report is Ready"                             |
| Message        | "You've completed 5 sessions. See how your focus compares to other users." |

### 4.7.6 Achievement Unlocked Notification

**Trigger:** When the user earns a new achievement/badge.

**Achievement List (v1):**

| Achievement        | Condition                        | Icon    |
|--------------------|----------------------------------|---------|
| First Session      | Complete 1 session               | Star    |
| Getting Started    | Block 5 websites                 | Shield  |
| Week Warrior       | 7-day streak                     | Flame   |
| Focus Master       | Score 90+ in a session           | Target  |
| Distraction Slayer | Block 100 total attempts         | Sword   |
| Deep Worker        | Complete 50 total sessions       | Brain   |
| Zen Master         | Complete a session with 0 attempts| Lotus   |
| Centurion          | 100-day streak                   | Crown   |

**Chrome Notification Type:** `basic`

| Field          | Value                                                                 |
|----------------|-----------------------------------------------------------------------|
| Title          | "Achievement Unlocked: [Name]!"                                       |
| Message        | [Achievement description]. "You're making incredible progress."       |
| Icon           | Achievement-specific icon (trophy variant), 128x128px                 |
| Priority       | 1                                                                     |
| requireInteraction | false                                                             |
| Auto-dismiss   | 8 seconds                                                            |

### 4.7.7 Pro Upgrade Prompt Notification

**Trigger rules (strictly enforced):**
- NEVER during the first 3 days of usage
- NEVER during an active focus session
- NEVER more than once per week
- ONLY triggered by specific user actions (hitting a limit, clicking a locked feature, or at the weekly report moment)
- NEVER as a standalone push notification -- always embedded in another notification or in-app surface

**The extension does NOT send standalone "upgrade to Pro" notifications.** All upgrade prompts are contextual -- embedded within session summaries, stats views, or in response to hitting a limit. This is a deliberate design choice to avoid the aggressive upselling that generates 1-star reviews for competitors like BlockSite.

**Contextual upgrade surfaces (not standalone notifications):**
1. Post-session Pro Insights card (in popup)
2. Stats tab Weekly Report card (in popup)
3. 10/10 blocklist limit (in popup, Blocklist tab)
4. Nuclear option "want more time?" (after 1hr nuclear ends)
5. Weekly report notification (the notification itself is value; the upgrade prompt is in the popup)

---

## 4.8 Dark Mode

Dark mode is essential for knowledge workers who work at night and users with light sensitivity. It should be a first-class experience, not an afterthought.

### 4.8.1 Dark Mode Activation

**Detection:** Follow system preference by default via `prefers-color-scheme: dark` media query. Users can override in settings:
- Auto (follow system) -- default
- Always Light
- Always Dark

**Transition:** When toggling, all colors transition over 200ms using `transition: background-color 200ms ease, color 200ms ease, border-color 200ms ease`.

### 4.8.2 Dark Mode Color Palette

| Token (Light)          | Light Value   | Dark Value   | Dark Hex  | Notes                                                |
|------------------------|---------------|--------------|-----------|------------------------------------------------------|
| `--primary-900`        | `#0B1D3A`     | `#E8F4FD`    | `#E8F4FD` | Inverted for headings on dark bg                     |
| `--primary-700`        | `#143D6B`     | `#B5D8F0`    | `#B5D8F0` | Lighter for readability                              |
| `--primary-500`        | `#1B6B9E`     | `#3DA5D9`    | `#3DA5D9` | Slightly brightened for contrast                     |
| `--primary-400`        | `#2A8FBF`     | `#5BB5D5`    | `#5BB5D5` | Hover states                                         |
| `--primary-300`        | `#5BB5D5`     | `#2A8FBF`    | `#2A8FBF` | Focus rings                                          |
| `--primary-100`        | `#D4EEF7`     | `#1A3148`    | `#1A3148` | Selected backgrounds (dark tint)                     |
| `--primary-50`         | `#EDF7FB`     | `#0F1F2E`    | `#0F1F2E` | Subtle tint areas                                    |
| `--accent-gold-600`    | `#B8860B`     | `#E8C547`    | `#E8C547` | Pro indicators (brighter for visibility)             |
| `--accent-gold-500`    | `#D4A017`     | `#F0D060`    | `#F0D060` | Pro badges, buttons                                  |
| `--accent-gold-400`    | `#E8C547`     | `#F5DC78`    | `#F5DC78` | Pro hover                                            |
| `--accent-gold-100`    | `#FFF3CD`     | `#2A2310`    | `#2A2310` | Pro feature bg tint (dark)                           |
| `--accent-gold-50`     | `#FFFBEB`     | `#1E1B0E`    | `#1E1B0E` | Pro tooltip bg (dark)                                |
| `--success-600`        | `#16A34A`     | `#22C55E`    | `#22C55E` | Brighter green for dark bg                           |
| `--success-500`        | `#22C55E`     | `#4ADE80`    | `#4ADE80` | Score ring, progress bars                            |
| `--success-100`        | `#DCFCE7`     | `#0D2818`    | `#0D2818` | Success bg tint (dark)                               |
| `--warning-600`        | `#D97706`     | `#F59E0B`    | `#F59E0B` | Brighter for visibility                              |
| `--warning-500`        | `#F59E0B`     | `#FBBF24`    | `#FBBF24` | Counter warnings                                     |
| `--warning-100`        | `#FEF3C7`     | `#2A2005`    | `#2A2005` | Warning bg tint (dark)                               |
| `--danger-600`         | `#DC2626`     | `#EF4444`    | `#EF4444` | Brighter for visibility                              |
| `--danger-500`         | `#EF4444`     | `#F87171`    | `#F87171` | Error states                                         |
| `--danger-100`         | `#FEE2E2`     | `#2D1111`    | `#2D1111` | Danger bg tint (dark)                                |
| `--neutral-900`        | `#111827`     | `#F9FAFB`    | `#F9FAFB` | Body text (inverted)                                 |
| `--neutral-700`        | `#374151`     | `#D1D5DB`    | `#D1D5DB` | Secondary text                                       |
| `--neutral-500`        | `#6B7280`     | `#9CA3AF`    | `#9CA3AF` | Placeholder, disabled (same -- works on both)        |
| `--neutral-400`        | `#9CA3AF`     | `#6B7280`    | `#6B7280` | Borders (slightly darker for dark mode)              |
| `--neutral-200`        | `#E5E7EB`     | `#374151`    | `#374151` | Borders, dividers (dark)                             |
| `--neutral-100`        | `#F3F4F6`     | `#1F2937`    | `#1F2937` | Card backgrounds (dark)                              |
| `--neutral-50`         | `#F9FAFB`     | `#111827`    | `#111827` | Page background (dark)                               |
| `--white`              | `#FFFFFF`     | `#1A202C`    | `#1A202C` | Card surfaces (dark)                                 |

### 4.8.3 Dark Mode -- Element-Specific Adaptations

**Popup:**
- Background: `#111827`
- Header: `#1A202C` with bottom border `#374151`
- Tab bar: `#1A202C` with bottom border `#374151`
- Cards: `#1A202C` with border `#374151`
- Footer: `#1A202C` with top border `#374151`
- All text inverts per the palette above

**Quick Focus Button (Dark):**
- Background: Linear gradient from `#3DA5D9` to `#2A8FBF` (brighter primary for visibility on dark background)
- Shadow: `0 2px 8px rgba(61, 165, 217, 0.25)`

**Focus Score Ring (Dark):**
- Track: `#374151` (dark neutral-200 equivalent)
- Fill: Same color coding (success/warning/danger are already brightened in dark palette)
- Score number: `#F9FAFB`

**Blurred Pro Content (Dark):**
- Blur bars background: `#3DA5D9` (brightened primary) instead of `--primary-300`
- Shimmer highlight: `rgba(240, 208, 96, 0.08)` (gold tint for dark mode)

**Block Page (Dark):**
- Background: Linear gradient from `#0F1F2E` (primary-50 dark) at top to `#111827` (neutral-50 dark) at bottom
- Shield icon: `#3DA5D9`
- Block message: `#F9FAFB`
- Quote text: `#D1D5DB`
- Stats card: `#1A202C` background, `#374151` border
- Buttons: Same primary gradient but with dark-adapted colors
- Privacy footer: `#6B7280`

**Options Page (Dark):**
- Page background: `#111827`
- Top bar: `#1A202C`, border `#374151`
- Sidebar: `#1A202C`, border `#374151`
- Active nav item: `#0F1F2E` background, `#3DA5D9` text and icon, left border `#3DA5D9`
- Content cards: `#1A202C`
- Input fields: `#111827` background, `#374151` border, `#F9FAFB` text

### 4.8.4 Elements That DO NOT Change in Dark Mode

These elements maintain their colors regardless of mode, because their identity depends on a fixed color:

| Element                  | Stays the Same Because                                 |
|--------------------------|--------------------------------------------------------|
| PRO badge background     | Gold `#D4A017` / `#F0D060` is part of brand identity -- always gold, but slightly brightened in dark mode |
| Nuclear mode red          | Red gradient signals danger universally                |
| Streak flame icon color   | Orange/amber flame is recognizable regardless of background |
| Success green checkmarks  | Green = positive is universal                          |
| Focus Score ring colors   | Score colors are the primary data visualization; they must be recognizable across modes |

### 4.8.5 Dark Mode Testing Checklist

| Surface                    | Verify                                                       |
|----------------------------|--------------------------------------------------------------|
| Popup (all 3 tabs)         | All text readable, cards visible, buttons contrast sufficient |
| Popup (all 3 states)       | Default, active session, post-session all render correctly   |
| Block page                 | Background gradient smooth, stats card visible, text readable |
| Options page (all sections)| Nav highlights visible, input fields usable, toggles clear   |
| Pro blur cards             | Shimmer visible on dark background, CTA button stands out    |
| Progress bars              | Track distinguishable from background, fill colors clear     |
| Notifications              | Controlled by OS -- verify icon renders on dark system theme |
| Tooltips                   | Gold tint visible, text readable, arrow color correct        |
| Focus Score ring           | Ring track visible against dark background, score readable   |
| Counter (all states)       | Green/yellow/orange/red all distinguishable on dark bg       |

### 4.8.6 Dark Mode Implementation

**CSS Custom Properties Approach:**

Define all colors as CSS custom properties on `:root` for light mode and override in a `[data-theme="dark"]` selector or `@media (prefers-color-scheme: dark)`:

```css
:root {
  --bg-primary: #F9FAFB;
  --bg-card: #FFFFFF;
  --bg-elevated: #FFFFFF;
  --text-primary: #111827;
  --text-secondary: #374151;
  --text-muted: #6B7280;
  --border-default: #E5E7EB;
  --border-subtle: #F3F4F6;
  /* ... all other tokens ... */
}

[data-theme="dark"] {
  --bg-primary: #111827;
  --bg-card: #1A202C;
  --bg-elevated: #1F2937;
  --text-primary: #F9FAFB;
  --text-secondary: #D1D5DB;
  --text-muted: #9CA3AF;
  --border-default: #374151;
  --border-subtle: #1F2937;
  /* ... all other dark tokens ... */
}
```

All component styles reference these tokens exclusively -- never use raw hex values in component CSS. This ensures a single `data-theme` attribute swap transitions the entire UI.

---

## Appendix A: Complete Screen Inventory

Every distinct screen/state that must be designed and built:

| #  | Screen                                      | Type       | States                          |
|----|---------------------------------------------|------------|---------------------------------|
| 1  | Popup: Home (default)                       | Popup view | Free, Pro                       |
| 2  | Popup: Home (active session)                | Popup view | Free, Pro, Paused               |
| 3  | Popup: Home (post-session)                  | Popup view | Free, Pro, first-session        |
| 4  | Popup: Blocklist tab                        | Popup view | Free (under limit), Free (at limit), Pro |
| 5  | Popup: Stats tab                            | Popup view | Free (today), Free (week), Pro  |
| 6  | Popup: Sound picker (expanded)              | Popup overlay| Free (3), Pro (15+)           |
| 7  | Popup: Upgrade slide-up panel               | Popup overlay| On locked feature click        |
| 8  | Block page: Default                         | Full page  | With session, without session   |
| 9  | Block page: Custom (Pro)                    | Full page  | User-configured variants        |
| 10 | Options: General                            | Options tab| Free, Pro                       |
| 11 | Options: Blocking                           | Options tab| Free, Pro                       |
| 12 | Options: Timer                              | Options tab| Free, Pro                       |
| 13 | Options: Stats & Analytics                  | Options tab| Free, Pro                       |
| 14 | Options: Sounds                             | Options tab| Free, Pro                       |
| 15 | Options: Schedule                           | Options tab| Free, Pro                       |
| 16 | Options: Block Page Customizer              | Options tab| Pro only                        |
| 17 | Options: Account                            | Options tab| Free, Pro                       |
| 18 | Options: About                              | Options tab| Universal                       |
| 19 | Upgrade modal (from options page)           | Modal      | Pricing, plan comparison        |
| 20 | Onboarding: Step 1 (Welcome)               | Full page  | First install                   |
| 21 | Onboarding: Step 2 (Pick distractions)     | Full page  | First install                   |
| 22 | Onboarding: Step 3 (Quick Focus demo)      | Full page  | First install                   |
| 23 | Onboarding: Step 4 (Done)                  | Full page  | First install                   |

**Total unique screens:** 23
**Total states (including Free/Pro variants and light/dark):** ~68

---

## Appendix B: Interaction & Animation Inventory

| Animation                       | Duration | Easing           | Trigger                            |
|---------------------------------|----------|------------------|------------------------------------|
| Focus Score ring fill           | 800ms    | ease-out         | Popup mount / score update         |
| Quick Focus button hover lift   | 200ms    | ease             | Mouse hover                        |
| Tab switch content              | 150ms    | ease-in-out      | Tab click (cross-fade)             |
| Post-session confetti           | 1500ms   | linear (fade)    | Session completion                 |
| Post-session icon bounce        | 300ms    | bounce ease-out  | Session completion                 |
| Timer colon blink               | 1000ms   | step-end         | Active session (infinite loop)     |
| Session progress bar fill       | per-second | linear         | Active session                     |
| Distraction counter bump        | 300ms    | ease-out (scale) | Blocked attempt detected           |
| Blocklist site removal          | 350ms    | ease-in-out      | Site remove click                  |
| Blocklist site addition         | 250ms    | ease-out         | Site added                         |
| Footer limit-reached flash      | 200ms    | ease             | 10th site added                    |
| Pro blur shimmer                | 3000ms   | ease-in-out      | Infinite loop on blurred content   |
| Toggle switch                   | 200ms    | ease             | Toggle click                       |
| Tooltip appear                  | 150ms    | ease-out (fade)  | 300ms hover delay, then animate    |
| Tooltip disappear               | 100ms    | ease-in (fade)   | Mouse leave                        |
| Dark mode color transition      | 200ms    | ease             | Theme toggle                       |
| Block page shield entrance      | 400ms    | ease-out (scale) | Block page mount                   |
| Block page attempt counter bump | 300ms    | bounce ease-out  | New attempt logged                 |
| Slide-up upgrade panel          | 250ms    | ease-out         | Locked feature click               |
| Sound volume slider thumb       | 0ms      | immediate        | Slider drag                        |
| Score breakdown bar fill        | 600ms    | ease-out         | Pro breakdown view mount           |
| Active session pulse dot        | 2000ms   | ease-in-out      | Infinite loop in footer            |
| Counter bar pulse (9/10)        | 2000ms   | ease-in-out      | 9/10 state (infinite)              |
| Nuclear mode button glow        | 2000ms   | ease-in-out      | Nuclear option hover               |

---

## Appendix C: Accessibility Requirements

| Requirement                     | Specification                                                        |
|---------------------------------|----------------------------------------------------------------------|
| Color contrast (text)           | All text meets WCAG 2.1 AA: 4.5:1 for normal text, 3:1 for large text |
| Color contrast (UI components)  | All interactive elements: 3:1 against adjacent colors                |
| Focus indicators                | All interactive elements show visible focus ring: 2px solid `--primary-300`, 2px offset |
| Keyboard navigation             | All popup controls navigable via Tab/Shift+Tab. Enter/Space activates. |
| Screen reader labels            | All icons have `aria-label`. Progress bars have `aria-valuenow/min/max`. |
| Reduced motion                  | `@media (prefers-reduced-motion: reduce)` disables: confetti, shimmer, bounce, colon blink. Transitions limited to 0ms. |
| Touch targets                   | Minimum 44x44px for all interactive elements (especially on popup)   |
| Text scaling                    | UI functions correctly up to 200% browser zoom                       |
| Pro lock indicators             | Locked features have `aria-disabled="true"` and descriptive `aria-label` explaining what Pro unlocks |
| Score ring                      | `role="meter"` with `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-label="Focus Score"` |
| Blur content                    | Blurred text has `aria-hidden="true"` with an adjacent text description: "Premium content -- upgrade to view" |

---

## Appendix D: Responsive Considerations

The extension popup is fixed at 380px wide, so it does not need responsive breakpoints. However, the following surfaces do:

**Block Page:**
| Breakpoint     | Behavior                                                          |
|----------------|-------------------------------------------------------------------|
| > 768px        | Centered content, max-width 480px, comfortable spacing            |
| 480-768px      | Reduce side padding to 24px, stats card stays 2x2 grid           |
| < 480px        | Stats card becomes 2x1 grid (2 rows), reduce font sizes by 1px   |

**Options Page:**
| Breakpoint     | Behavior                                                          |
|----------------|-------------------------------------------------------------------|
| > 960px        | Two-column: 240px sidebar + 720px content                        |
| 768-960px      | Two-column: 200px sidebar + remaining content                    |
| < 768px        | Single column. Sidebar becomes horizontal top nav tabs. Content fills full width. |

---

*Section 4 complete. This specification covers all visual surfaces, states, and interactions for the Focus Mode - Blocker Chrome extension. Every screen can be built from this document without design ambiguity.*

*Next: Section 5 (Technical Architecture) should define the data model, Chrome APIs, state management, and build system.*
