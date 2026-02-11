# Section 10: Extension UI Page Architecture
## Agent 5 — Focus Mode - Blocker MV3

> **Phase:** 12 (Manifest V3 Architecture) | **Date:** February 11, 2026
> **Scope:** Popup, Options, Block Page, Onboarding, Offscreen, Shared UI Utilities

---

## 10.1 Popup Architecture

**Directory:** `src/popup/`
**Dimensions:** 380px wide, 500-580px tall (dynamic height based on content)

### Technology Stack

The popup uses vanilla JavaScript with no framework. This is a deliberate decision driven by three constraints unique to Chrome extension popups:

1. **Bundle size:** Popup.js must stay under 150KB to maintain sub-500ms load times. React (min ~40KB), Preact (~3KB), or Svelte (~2KB compiled) would eat into that budget for marginal benefit in a UI this small.
2. **Lifecycle:** The popup is destroyed every time it closes and recreated every time it opens. There is no long-lived component tree to manage. Every open is a fresh render from storage state.
3. **Simplicity:** The popup has 6 states, 3 tabs, and ~20 interactive elements. A framework adds indirection without proportional value.

```
src/popup/
├── popup.html              # Shell HTML with container divs
├── popup.css               # All popup styles, CSS custom properties for theming
├── popup.js                # Entry point — initializes state, renders, binds events
├── components/
│   ├── header.js           # Extension icon + title + settings gear icon
│   ├── tab-bar.js          # Home / Blocklist / Stats tab switching
│   ├── home-tab.js         # Default view + active session + post-session
│   ├── blocklist-tab.js    # Site list management
│   ├── stats-tab.js        # Daily stats and Focus Score trend
│   ├── timer-display.js    # MM:SS countdown with progress ring
│   ├── focus-score-ring.js # SVG circular progress (0-100)
│   ├── streak-display.js   # Current streak + best streak
│   └── pro-upgrade.js      # Feature comparison card + CTA
├── state/
│   ├── popup-state.js      # Central state object, read from storage on open
│   └── message-bridge.js   # Port connection to background for real-time updates
└── utils/
    └── popup-helpers.js    # Popup-specific formatting (time, score, pluralization)
```

### Six Popup States

Each state maps to a distinct visual layout rendered into the popup's content area. Transitions between states are driven by data changes received from the background service worker.

#### State 1: Default / Idle

The landing state when no focus session is active. This is the most common state users see when they click the extension icon.

**Layout:**
- Header with Focus Mode icon and extension name
- Tab bar: Home (active) | Blocklist | Stats
- "Start Focus Session" button (full-width, primary color #6366f1, 48px height)
- Quick Focus options row: 25min | 45min | Custom (Pro)
- Quick stats card: Today's Focus Score, current streak, sites blocked today
- Last session summary (if exists): duration, score earned, timestamp
- Footer: "Zovo" branding link

**Data requirements:**
- `focusScore.current` — today's Focus Score (0-100)
- `streak.current` — current day streak
- `stats.today.blockedCount` — sites blocked today
- `session.last` — most recent completed session (nullable)
- `license.tier` — free or pro (determines Custom button state)

**Interactions:**
- Click "Start Focus Session" → sends `START_SESSION` message with selected duration to background → transitions to State 2
- Click quick duration buttons → pre-fills duration before starting
- Click "Custom" (Pro) → if free tier, shows T3 paywall trigger; if Pro, opens duration picker
- Click tab bar items → switches tab content
- Click settings gear → opens options page via `chrome.runtime.openOptionsPage()`

#### State 2: Active Session

Displayed while a focus session is running. The popup maintains a port connection to the background service worker for real-time timer updates.

**Layout:**
- Header (dimmed, no distracting interactions)
- Timer display (centered, large): MM:SS countdown in JetBrains Mono font, 36px
- Circular progress ring (SVG, 120px diameter): fills as session progresses, color transitions from #6366f1 to #22c55e as completion approaches
- Focus Score ring (smaller, 60px): real-time score based on current session behavior
- Session info: "Pomodoro 2 of 4" or "Quick Focus" label, started time
- Action buttons row: Pause (if allowed) | Stop Session
- Blocked attempts counter: "3 distractions blocked this session" with subtle animation on increment

**Data requirements (real-time via port):**
- `session.timeRemaining` — seconds left (updated every second via port message)
- `session.totalDuration` — original duration for progress calculation
- `session.type` — pomodoro / quickFocus / scheduled
- `session.pomodoroIndex` — current pomodoro number (if applicable)
- `session.blockedThisSession` — running blocked count
- `focusScore.realtime` — score so far this session

**Port connection lifecycle:**
```
popup opens → chrome.runtime.connect({ name: 'popup-timer' })
  → background sends TIMER_TICK every 1000ms: { timeRemaining, blockedCount, score }
  → popup updates DOM on each tick
popup closes → port disconnects automatically (chrome handles this)
  → background stops sending ticks (onDisconnect listener)
```

**Interactions:**
- Click "Pause" → sends `PAUSE_SESSION` → timer freezes, Pause becomes "Resume"
- Click "Stop" → confirmation dialog → sends `STOP_SESSION` → transitions to State 3
- Click blocked counter → brief animation showing most recent blocked domain

#### State 3: Post-Session Summary

Displayed immediately after a session completes (either by timer expiry or manual stop). Shows results and encourages the next session.

**Layout:**
- Celebration header: checkmark animation (Lottie-compatible CSS animation, 2s duration)
- Session duration: "25 minutes of focus" in large text
- Score earned: "+12 Focus Score" with count-up animation
- Streak update: "Day 5 streak!" or "New streak started!" with fire icon
- Stats row: Sites blocked | Pauses used | Completion %
- "Start Break" button (if Pomodoro mode, next break duration shown)
- "Start Another Session" button (secondary)
- "Done" text link (closes popup)

**Data requirements:**
- `session.completed` — the just-finished session object
- `focusScore.delta` — score change from this session
- `focusScore.current` — updated total score
- `streak.current` — updated streak count
- `streak.isNew` — whether this session started or continued a streak

**Transitions:**
- After 30 seconds of inactivity, auto-transitions to State 1
- "Start Break" → background starts break timer → popup shows break countdown (simplified State 2)
- "Start Another Session" → transitions to State 2 with default duration

#### State 4: Blocklist Tab

Accessible from any state via the tab bar. Manages the list of blocked websites.

**Layout:**
- Add site input: text field with "e.g. twitter.com" placeholder, "Add" button
- Input validation: real-time URL validation, duplicate detection, feedback messages
- Site list (scrollable, max-height 350px):
  - Each row: favicon (16px, fetched via chrome://favicon/), domain name, remove button (X)
  - Category badges: "Social" / "News" / "Entertainment" (color-coded)
  - Usage counter: "Blocked 47 times" per site (subtle gray text)
- Category toggles section: Social Media (on/off), News, Entertainment, Shopping, Gaming
  - Each toggle adds/removes all sites in that category
- Site count: "12 / 10 sites" (free tier shows limit, amber when at limit)
- Pro upsell (if at free limit): "Upgrade to Pro for unlimited sites" — T2 paywall trigger

**Data requirements:**
- `blocklist.sites` — array of { domain, category, addedAt, blockedCount }
- `blocklist.categories` — category definitions with enabled state
- `license.tier` — determines site limit (10 free, unlimited Pro)
- `license.siteLimit` — computed limit for display

**Interactions:**
- Type in input + click "Add" or press Enter → validates domain → sends `ADD_BLOCKED_SITE` to background → site appears in list with slide-in animation
- Click X on site row → sends `REMOVE_BLOCKED_SITE` → row slides out
- Toggle category → sends `TOGGLE_CATEGORY` → adds/removes batch of sites
- Click site domain text → copies domain to clipboard (subtle toast confirmation)
- Attempt to add 11th site on free tier → T2 paywall modal

#### State 5: Stats Tab

Displays focus statistics and trends. Data is lazy-loaded on first tab switch to avoid slowing popup open.

**Layout:**
- Today's Focus Score: large number (0-100) with circular ring, color-coded (red <40, amber 40-69, green 70+)
- Score trend: sparkline chart (last 7 days), rendered with SVG path
- Streak display: current streak (days), best streak, calendar heat map (last 30 days, 5 shades of indigo)
- Today's stats grid (2x2):
  - Total focus time: "2h 15m"
  - Sessions completed: "4"
  - Sites blocked: "23"
  - Completion rate: "87%"
- Weekly comparison: "Up 15% from last week" or "Down 8% from last week" with arrow icon

**Data requirements (lazy-loaded on tab switch):**
- `stats.today` — { focusTime, sessions, blockedCount, completionRate }
- `stats.weekly` — last 7 days of daily scores for sparkline
- `stats.monthlyHeatmap` — last 30 days of session counts for calendar
- `streak.current` / `streak.best` — streak values
- `focusScore.current` / `focusScore.history` — score data

**Performance optimization:**
- Stats data is NOT loaded on popup open — only when user clicks Stats tab
- Background pre-computes aggregates on session completion, stores in `chrome.storage.local`
- Sparkline SVG path is computed once and cached in popup state
- Calendar heat map renders via a single `innerHTML` set (30 div elements)

#### State 6: Pro Upgrade

Shown when a paywall trigger fires (T1-T10) or when user clicks a Pro-locked feature.

**Layout:**
- "Unlock Focus Mode Pro" header with gradient text
- Feature comparison table:
  - Unlimited blocked sites (Free: 10)
  - Custom focus durations (Free: 25/45 only)
  - Advanced statistics (Free: basic stats)
  - Wildcard blocking patterns (Free: exact domain only)
  - Custom block page (Free: default)
  - Full ambient sound library (Free: 3 sounds)
  - Sync across devices (Free: local only)
  - Schedule-based blocking (Free: manual only)
- Price: "$4.99/month" with annual option "$3.99/mo billed annually"
- CTA button: "Upgrade to Pro" (full-width, gradient background)
- "Maybe Later" dismiss link
- Trust badges: "Cancel anytime" / "7-day free trial" / "Secure payment"

**Data requirements:**
- `license.tier` — current tier
- `paywall.trigger` — which trigger (T1-T10) initiated this view (for analytics)
- `paywall.featureContext` — which specific feature the user tried to access

### State Management Architecture

The popup does not maintain its own persistent state. Every time the popup opens, it reads the current state from storage and renders accordingly.

```
┌─────────────────────────────────────────────────────┐
│                    Popup Open                        │
│                                                      │
│  1. Read chrome.storage.session → activeSession      │
│  2. Read chrome.storage.local → settings, stats      │
│  3. Determine state (idle/active/post/etc.)          │
│  4. Render appropriate UI                            │
│  5. If active session → open port for timer ticks    │
│  6. Listen for storage.onChanged for live updates    │
│                                                      │
│                    Popup Close                        │
│                                                      │
│  Port auto-disconnects. No cleanup needed.           │
│  Background continues session independently.         │
└─────────────────────────────────────────────────────┘
```

**Message types sent from popup:**
- `START_SESSION` — { duration, type, pomodoroCount }
- `PAUSE_SESSION` / `RESUME_SESSION` — no payload
- `STOP_SESSION` — no payload
- `ADD_BLOCKED_SITE` — { domain, category }
- `REMOVE_BLOCKED_SITE` — { domain }
- `TOGGLE_CATEGORY` — { category, enabled }
- `GET_STATS` — { range: 'today' | 'week' | 'month' }
- `GET_POPUP_STATE` — requests full state snapshot on open

**Messages received by popup (via port or runtime.onMessage):**
- `TIMER_TICK` — { timeRemaining, blockedCount, score }
- `SESSION_COMPLETE` — { sessionSummary }
- `BLOCK_EVENT` — { domain, timestamp } (for real-time blocked counter)
- `STATE_UPDATE` — { partial state changes }

### Performance Requirements

| Metric | Budget | Measurement |
|--------|--------|-------------|
| Time to interactive | <500ms | From popup click to fully rendered content |
| Storage reads | <50ms | Combined time for session + local reads |
| DOM render | <100ms | From state determination to painted pixels |
| Timer tick processing | <5ms | From port message to DOM update |
| Tab switch | <200ms | Including lazy data load for Stats |
| Memory peak | <15MB | Measured via chrome.system.memory |
| Bundle size (JS) | <150KB | popup.js + all component modules |
| Bundle size (CSS) | <30KB | popup.css after minification |

---

## 10.2 Options Page Architecture

**Directory:** `src/options/`
**Layout:** Full browser tab, responsive (min-width 768px recommended)

### Structure

The options page is a single-page application with sidebar navigation and a content area. It uses the same vanilla JS approach as the popup but with a more complex layout due to the 8 navigation sections.

```
src/options/
├── options.html            # Shell HTML with sidebar + content containers
├── options.css             # Full-page styles, responsive layout
├── options.js              # Entry point — router, section loader, save manager
├── sections/
│   ├── general.js          # Language, startup, shortcuts
│   ├── blocklist.js        # Full blocklist editor
│   ├── timer.js            # Pomodoro defaults, custom durations
│   ├── focus-score.js      # Factor weights, score history
│   ├── sounds.js           # Ambient sound selection, volume
│   ├── appearance.js       # Theme, block page customization
│   ├── account.js          # License, sync, data management
│   └── about.js            # Version, changelog, support tools
├── components/
│   ├── sidebar-nav.js      # Section navigation with icons and active state
│   ├── settings-field.js   # Reusable setting row (label + control + description)
│   ├── toggle-switch.js    # Styled checkbox toggle
│   ├── pro-lock.js         # Lock icon + "Pro" badge overlay for gated features
│   ├── upgrade-modal.js    # In-page upgrade prompt (same content as popup State 6)
│   ├── import-export.js    # File picker + JSON validation + download
│   └── data-table.js       # Sortable table for blocklist and score history
├── state/
│   └── settings-manager.js # Debounced save, validation, sync orchestration
└── utils/
    └── options-helpers.js  # Section-specific formatting and validation
```

### Navigation

The sidebar contains 8 sections, each with an icon and label. The URL hash (`#general`, `#blocklist`, etc.) tracks the active section, enabling deep linking and back/forward navigation.

```
┌──────────────┬──────────────────────────────────────┐
│  Sidebar     │  Content Area                         │
│              │                                       │
│  * General   │  [Section heading]                    │
│    Blocklist │  [Setting row]                        │
│    Timer     │  [Setting row]                        │
│    Score     │  [Setting row]                        │
│    Sounds    │  ...                                  │
│    Appearance│                                       │
│    Account   │                                       │
│    About     │                                       │
│              │                                       │
│  ┌─────────┐ │                                       │
│  │ Upgrade │ │                                       │
│  │  to Pro │ │                                       │
│  └─────────┘ │                                       │
└──────────────┴──────────────────────────────────────┘
```

### Section Specifications

#### General Settings

| Setting | Control | Default | Storage Key |
|---------|---------|---------|-------------|
| Language | Dropdown (English, Spanish, French, German, Japanese) | English | `settings.language` |
| Start on browser launch | Toggle | Off | `settings.autoStart` |
| Show notifications | Toggle | On | `settings.notifications` |
| Notification sound | Toggle | On | `settings.notificationSound` |
| Keyboard shortcuts | Read-only display + "Change" link to chrome://extensions/shortcuts | N/A | N/A |
| Default focus mode | Dropdown (Pomodoro / Quick Focus) | Pomodoro | `settings.defaultMode` |
| Show in context menu | Toggle | On | `settings.contextMenu` |

#### Blocklist Settings

Full-featured blocklist editor with capabilities beyond what the popup offers.

- **Site list table:** Sortable by domain, category, date added, blocked count. Each row has edit and delete actions.
- **Bulk operations:** Select multiple sites, bulk delete, bulk re-categorize.
- **Add site form:** Domain input with real-time validation, category selector, optional notes field.
- **Category management:** Create custom categories (Pro), rename categories, set category colors.
- **Import/Export:** Import from JSON file (validated schema), export current blocklist as JSON. Import from other extensions (Cold Turkey, LeechBlock format detection).
- **Pro features (locked on free):**
  - Wildcard patterns: `*.reddit.com`, `news.*` — T5 paywall trigger
  - Path-level blocking: `youtube.com/shorts` — T5 paywall trigger
  - Regex patterns: custom regex for advanced users — T5 paywall trigger
  - Schedule-based blocking: different blocklists for different times — T7 paywall trigger

#### Timer Settings

| Setting | Control | Default | Tier | Storage Key |
|---------|---------|---------|------|-------------|
| Pomodoro work duration | Slider (15-60 min) | 25 min | Free | `timer.workDuration` |
| Short break duration | Slider (3-15 min) | 5 min | Free | `timer.shortBreak` |
| Long break duration | Slider (10-30 min) | 15 min | Free | `timer.longBreak` |
| Pomodoros before long break | Stepper (2-6) | 4 | Free | `timer.pomodorosBeforeLong` |
| Custom duration presets | Multi-input | N/A | Pro (T3) | `timer.customPresets` |
| Auto-start breaks | Toggle | Off | Free | `timer.autoStartBreaks` |
| Auto-start next pomodoro | Toggle | Off | Free | `timer.autoStartNext` |
| End-of-session sound | Dropdown (5 options) | Chime | Free | `timer.endSound` |
| Countdown warning | Toggle + threshold | On, 60s | Free | `timer.countdownWarning` |

#### Focus Score Settings

This section is primarily informational, showing users how the Focus Score works and their historical data.

- **Factor weights display (read-only):** Shows the 5 scoring factors and their weights:
  - Session completion: 40% weight
  - Distraction resistance: 25% weight (blocked attempts without bypass)
  - Consistency: 20% weight (daily session regularity)
  - Duration: 10% weight (longer sessions score higher)
  - Streak bonus: 5% weight (consecutive day multiplier)
- **Score history chart:** Line chart of daily scores for the last 30 days (SVG-rendered)
- **Personal bests:** Highest single-day score, longest streak, most productive day of week
- **Score reset:** Button to reset Focus Score history (requires confirmation dialog with typed confirmation "RESET")

#### Sounds Settings

- **Ambient sound selection:** Grid of sound cards (cover art, name, play preview button)
  - Free sounds (3): Rain, White Noise, Lo-Fi Beats
  - Pro sounds (full library, ~15): Forest, Ocean Waves, Cafe, Fireplace, Thunderstorm, Wind, Birds, Library, Train, Night, Stream, Piano (locked with Pro badge overlay)
- **Volume slider:** 0-100%, applies to all ambient sounds
- **Auto-play during sessions:** Toggle — automatically starts selected sound when a focus session begins
- **Sound layering (Pro):** Mix up to 3 ambient sounds simultaneously — T6 paywall trigger
- **Preview:** Click any sound card to hear a 10-second preview (uses offscreen document for playback)

#### Appearance Settings

| Setting | Control | Default | Tier | Storage Key |
|---------|---------|---------|------|-------------|
| Theme | 3-way toggle: Light / Dark / Auto | Auto | Free | `appearance.theme` |
| Accent color | Color picker (5 presets + custom) | #6366f1 | Pro (T8) | `appearance.accentColor` |
| Block page style | Dropdown (Default / Minimal / Motivational / Custom) | Default | Pro (T8) | `appearance.blockPageStyle` |
| Custom block page background | Image upload + color picker | N/A | Pro (T8) | `appearance.blockPageBg` |
| Custom motivational quotes | Textarea (one per line) | N/A | Pro (T8) | `appearance.customQuotes` |
| Popup density | Toggle: Comfortable / Compact | Comfortable | Free | `appearance.density` |
| Animation reduce | Toggle | Off (respects prefers-reduced-motion) | Free | `appearance.reduceMotion` |

#### Account Settings

- **License status:** Current tier display (Free / Pro), expiry date if Pro
- **Pro activation:** License key input field, "Activate" button, validation feedback
- **Sync settings (Pro):** Toggle to enable cross-device sync via chrome.storage.sync
  - Shows sync status: "Last synced 2 minutes ago" / "Sync error" / "Not synced"
  - Conflict resolution: "Most recent wins" strategy with manual override option
- **Data export:** Download all extension data as JSON (settings, blocklist, stats, score history)
- **Data import:** Upload JSON file, schema validation, preview changes before applying, merge or replace option
- **Delete all data:** "Delete Everything" button with two-step confirmation (click → type "DELETE" → confirm)
  - Clears all chrome.storage.local and chrome.storage.session data
  - Removes all DNR rules
  - Resets extension to first-install state

#### About Section

- **Version:** "Focus Mode - Blocker v1.0.0" with build number
- **Changelog:** Last 5 versions with bullet-point changes (loaded from bundled JSON)
- **Support tools:**
  - "Export Debug Info" — downloads a JSON file with: extension version, Chrome version, OS, installed date, active settings (no blocklist domains for privacy), error logs (last 100), storage usage stats
  - "Report a Bug" — opens GitHub Issues with pre-filled template
  - "Contact Support" — mailto link with debug info in body
- **"More from Zovo" panel:** Cards linking to other Zovo extensions/products
- **Open source:** Link to GitHub repository, license (MIT), contribution guide
- **Credits:** Third-party libraries and their licenses

### Settings Persistence

```
User changes a setting
    │
    ▼
Validation check (type, range, format)
    │
    ├── Invalid → Show inline error, revert control to previous value
    │
    └── Valid → Update local state immediately (optimistic UI)
                    │
                    ▼
              Debounce 500ms (reset timer on each new change)
                    │
                    ▼
              Write to chrome.storage.local
                    │
                    ├── Success → Show subtle "Saved" indicator (fade out after 2s)
                    │
                    └── Failure → Show error toast, revert to last known good state
                                      │
                                      ▼
                                If Pro + sync enabled:
                                  Write to chrome.storage.sync
                                  (async, non-blocking, errors logged)
```

### Pro Lock Indicators

Every Pro-gated feature follows the same visual pattern:

1. **Visual lock:** Semi-transparent overlay with lock icon (16px, #6366f1) and "Pro" badge (pill shape, #6366f1 background, white text, 10px font)
2. **Hover state:** Tooltip: "This feature requires Focus Mode Pro"
3. **Click behavior:** Opens upgrade modal (same as popup State 6) with `paywall.featureContext` set to the specific feature name
4. **After upgrade:** Lock indicators removed immediately via storage.onChanged listener for `license.tier`

---

## 10.3 Block Page Architecture

**File:** `src/pages/blocked.html`
**Layout:** Full viewport, centered content
**Frequency:** Users see this page 100+ times per day — it must be fast, respectful, and motivating

### Design Specification

```
┌─────────────────────────────────────────────────────┐
│                                                      │
│            ◯ Background gradient                     │
│           (purple → indigo, subtle noise texture)    │
│                                                      │
│                   🛡️ (64px)                          │
│              Shield icon, pulse animation            │
│                                                      │
│           "Stay focused. You've got this."           │
│         (motivational quote, 18px, white, italic)    │
│                                                      │
│     ┌──────────┬──────────┬──────────┬──────────┐   │
│     │ Time     │Distracts │ Streak   │ Focus    │   │
│     │ Saved    │ Blocked  │          │ Score    │   │
│     │  45m     │    23    │  5 days  │   78     │   │
│     └──────────┴──────────┴──────────┴──────────┘   │
│                                                      │
│              ┌─────────────────────┐                 │
│              │   Back to Work  →   │                 │
│              │  (green, prominent) │                 │
│              └─────────────────────┘                 │
│                                                      │
│    "This page never tracks your browsing" (footer)  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### File Structure

```
src/pages/
├── blocked.html            # Minimal HTML shell, no inline scripts
├── blocked.css             # Self-contained styles (no external deps)
├── blocked.js              # Logic: quote selection, stats loading, navigation
└── quotes.json             # 50+ curated motivational quotes
```

### Motivational Quotes System

The block page displays a random motivational quote from a curated library of 50+ quotes. Quotes are bundled in `quotes.json` and loaded synchronously (the file is small, ~3KB).

**Quote selection algorithm:**
1. Read `blockpage.lastQuoteIndex` from chrome.storage.session
2. Select a random index that differs from the last shown (avoid immediate repeats)
3. Store new index back to session storage
4. Display quote with author attribution

**Quote categories:** Productivity, perseverance, discipline, mindfulness, humor (light touch)

**Pro customization:**
- Users can add custom quotes via Options > Appearance
- Custom quotes are mixed into the rotation with default quotes
- Option to disable default quotes and use only custom ones
- Site-specific messages: "You blocked twitter.com — you chose focus over noise"

### Stats Display

The stats grid shows four metrics that reinforce the user's commitment to focus:

| Stat | Source | Calculation |
|------|--------|-------------|
| Time Saved Today | `stats.today.focusTime` | Sum of completed session durations today |
| Distractions Blocked | `stats.today.blockedCount` | Count of blocked page loads today |
| Current Streak | `streak.current` | Consecutive days with at least one session |
| Focus Score | `focusScore.current` | Today's computed Focus Score (0-100) |

**Data loading pattern:**
```
blocked.html loads
    │
    ▼
Show placeholder UI immediately (skeleton layout, no data)
    │
    ▼
Send GET_BLOCK_PAGE_DATA message to background
    │
    ▼
Background responds with { quote, stats, streak, score, blockedDomain }
    │
    ▼
Populate stats grid, quote, and domain-specific message
    │
    ▼
Total time: <200ms from navigation to fully rendered
```

### "Back to Work" Button

The primary action button navigates the user away from the blocked page:

1. Query `chrome.tabs.query` for the current tab's history
2. If the previous URL in history is not a blocked site → `history.back()`
3. If the previous URL is also blocked (or no history) → `chrome.tabs.update({ url: 'chrome://newtab' })`
4. Fallback: open new tab page

The button is styled prominently: #22c55e (green) background, white text, 48px height, full-width on mobile viewports, centered with max-width 300px on desktop.

### Security Considerations

The block page is a high-value target for bypass attempts. Security measures:

- **No inline scripts:** All JavaScript in external `blocked.js` file (CSP: `script-src 'self'`)
- **No user-generated content without sanitization:** Custom quotes pass through `DOMPurify.sanitize()` equivalent (custom implementation to avoid dependency) before rendering
- **No `innerHTML` for user content:** Custom quotes use `textContent` assignment only
- **No external requests:** All assets (icons, fonts, quotes) bundled in the extension
- **Domain display sanitization:** The blocked domain name is sanitized before display to prevent XSS via crafted domain names
- **Tamper detection:** The block page verifies it was loaded by the extension (checks `chrome.runtime.id`) and not spoofed

### Performance Budget

| Metric | Budget | Notes |
|--------|--------|-------|
| Full render | <200ms | From navigation intercept to painted pixels |
| First paint | <100ms | HTML + CSS only, no JS needed for layout |
| JS execution | <50ms | Quote selection + stats request + DOM update |
| Asset size | <50KB | HTML + CSS + JS + quotes.json combined |
| External requests | 0 | Everything bundled, no network dependencies |
| Memory | <5MB | Minimal DOM, no frameworks |

---

## 10.4 Onboarding Architecture

**File:** `src/pages/onboarding.html`
**Layout:** Full browser tab, 5-slide horizontal flow
**Trigger:** `chrome.runtime.onInstalled` with `reason: 'install'`

### Slide Architecture

The onboarding is a single HTML page with 5 slide containers. Navigation is handled via CSS transforms (translateX) for smooth horizontal transitions. Each slide has a consistent layout: illustration area (top 40%), content area (middle 40%), and action area (bottom 20%).

```
src/pages/
├── onboarding.html         # Shell with 5 slide containers
├── onboarding.css          # Slide transitions, responsive layout
├── onboarding.js           # Slide state machine, user choices, storage writes
└── onboarding-assets/
    ├── slide1-welcome.svg  # Welcome illustration
    ├── slide2-setup.svg    # Setup illustration
    ├── slide3-style.svg    # Focus style illustration
    ├── slide4-score.svg    # Score explanation illustration
    └── slide5-start.svg    # First session CTA illustration
```

### Slide Specifications

#### Slide 1: Welcome

**Purpose:** Build trust and set expectations.

- **Illustration:** Extension icon with radiating focus rings (animated SVG)
- **Headline:** "Welcome to Focus Mode"
- **Subtext:** "Block distracting websites. Build focus habits. Track your progress."
- **Trust badges row (3 items):**
  - Shield icon + "100% Private" — "Your data never leaves your device"
  - Eye-off icon + "No Tracking" — "We never see what sites you visit"
  - Lock icon + "Secure" — "Open source and transparent"
- **Action:** "Get Started" button → Slide 2
- **Skip:** "Skip Setup" text link → marks onboarding complete, opens new tab

#### Slide 2: Quick Setup (MAGIC MOMENT)

**Purpose:** Get the user to block their first site — the activation event that predicts retention.

- **Headline:** "What distracts you most?"
- **Pre-built category cards (selectable, multi-select):**
  - Social Media (Twitter, Facebook, Instagram, TikTok, Reddit)
  - Video (YouTube, Netflix, Twitch, TikTok)
  - News (CNN, BBC, Reddit, HackerNews)
  - Shopping (Amazon, eBay, Etsy)
  - Custom: "Add your own" input field
- **Visual feedback:** Selected categories show checkmark, sites listed below each card
- **Counter:** "You're blocking X sites" (updates in real-time as user selects)
- **Action:** "Block These Sites" button → writes to storage, updates DNR rules, shows brief success animation → Slide 3
- **Important:** At least 1 site must be selected to proceed (button disabled otherwise)
- **Storage write:** `blocklist.sites` populated, `onboarding.firstBlockAt` timestamp set

#### Slide 3: Focus Style

**Purpose:** Let users choose their preferred focus mode and sound.

- **Headline:** "How do you like to focus?"
- **Three option cards (single-select, radio behavior):**
  - **Pomodoro:** "25 min work, 5 min break" — icon: tomato timer — "(Most popular)"
  - **Quick Focus:** "Set any duration, no breaks" — icon: lightning bolt
  - **Scheduled:** "Block sites on a schedule" — icon: calendar — "Coming in Pro"
- **Sound preference (below focus style):**
  - "Want ambient sounds while you focus?"
  - Three sound cards with play preview: Rain | White Noise | Lo-Fi Beats
  - "No thanks" option
- **Action:** "Continue" button → stores preferences → Slide 4

#### Slide 4: Focus Score

**Purpose:** Explain the gamification system that drives retention.

- **Illustration:** Animated Focus Score ring filling from 0 to 85 (CSS animation, 2s)
- **Headline:** "Meet Your Focus Score"
- **Explanation (3 bullet points with icons):**
  - Clock icon: "Complete focus sessions to earn points"
  - Shield icon: "Resist distractions to boost your score"
  - Fire icon: "Build streaks for bonus multipliers"
- **Score breakdown visual:** Horizontal bar showing the 5 factors and their weights
- **Subtext:** "Your score updates after every session. Can you hit 100?"
- **Action:** "Almost Done" button → Slide 5

#### Slide 5: First Session CTA

**Purpose:** Get the user to start their very first focus session immediately.

- **Illustration:** Countdown timer graphic with "25:00" displayed
- **Headline:** "Ready for Your First Focus Session?"
- **Subtext:** "Start a 25-minute Pomodoro and see how it feels. You can always adjust later."
- **Primary CTA:** "Start Your First Focus Session" (large button, primary color, pulse animation)
  - Click → sends `START_SESSION` message to background → closes onboarding tab → session starts
- **Secondary:** "I'll start later" text link → marks onboarding complete → opens new tab
- **Action on start:** `onboarding.completedAt` timestamp, `onboarding.startedFirstSession: true`

### State Machine

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Slide 1 │───▶│ Slide 2 │───▶│ Slide 3 │───▶│ Slide 4 │───▶│ Slide 5 │
│ Welcome │    │  Setup  │    │  Style  │    │  Score  │    │  Start  │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
     │              │              │              │              │
     └──────────────┴──────────────┴──────────────┴──────────────┘
                         Progress dots (● ● ○ ○ ○)
                         Back arrow (slides 2-5)
```

**Resume capability:** If the user closes the tab mid-onboarding, the current slide index is saved to `onboarding.currentSlide` in chrome.storage.local. On next extension icon click (or re-open of onboarding URL), the flow resumes from the saved slide.

**Service worker integration:**
```javascript
// In background service worker — src/background/lifecycle.ts
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/pages/onboarding.html'),
      active: true
    });
    chrome.storage.local.set({
      'onboarding.startedAt': Date.now(),
      'onboarding.currentSlide': 0,
      'onboarding.completed': false
    });
  }
});
```

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Onboarding completion rate | 70%+ | `onboarding.completedAt` exists / total installs |
| Time to first block | <60 seconds | `onboarding.firstBlockAt` - install timestamp |
| Slide 2 completion (magic moment) | 85%+ | Users who add at least 1 blocked site |
| First session start rate | 50%+ | `onboarding.startedFirstSession: true` |
| Drop-off by slide | Track per slide | Slide index at abandonment |

### A/B Test Hooks

The onboarding system supports content variation for optimization:

- `onboarding.variant` stored on first load (random assignment)
- Slide headlines, subtext, and button labels are data-driven (loaded from a config object)
- Variant A/B definitions stored in `onboarding-variants.json`
- Analytics events fired per slide: `onboarding_slide_view`, `onboarding_slide_complete`, `onboarding_complete`

---

## 10.5 Offscreen Document Architecture

**File:** `src/pages/offscreen.html`
**Purpose:** Audio playback for ambient sounds during focus sessions
**Visibility:** Hidden — users never see this page

### Why Offscreen Documents Are Required

Manifest V3 service workers cannot access the DOM or the Web Audio API. They cannot create `<audio>` elements or call `AudioContext` methods. Chrome provides the Offscreen Documents API specifically for this use case — a hidden document that has full DOM access but no UI.

### Lifecycle Management

```
User starts ambient sound (popup or auto-play on session start)
    │
    ▼
Background checks: does offscreen document exist?
    │
    ├── Yes → Send PLAY_SOUND message directly
    │
    └── No → Create offscreen document first:
              chrome.offscreen.createDocument({
                url: 'src/pages/offscreen.html',
                reasons: ['AUDIO_PLAYBACK'],
                justification: 'Playing ambient sounds during focus sessions'
              })
              → then send PLAY_SOUND message
    │
    ▼
User stops sound OR session ends
    │
    ▼
Background sends STOP_SOUND message
    │
    ▼
Offscreen document stops audio, reports ready for cleanup
    │
    ▼
Background closes document:
    chrome.offscreen.closeDocument()
    (frees memory — offscreen docs count against extension resource limits)
```

### File Structure

```
src/pages/
├── offscreen.html          # Minimal HTML: <audio> element(s), script tag
├── offscreen.js            # Message listener, audio playback logic
└── sounds/
    ├── rain.mp3            # Free tier sound (~500KB each, compressed)
    ├── white-noise.mp3     # Free tier sound
    ├── lofi-beats.mp3      # Free tier sound
    └── pro/                # Pro tier sounds (loaded on demand)
        ├── forest.mp3
        ├── ocean.mp3
        ├── cafe.mp3
        ├── fireplace.mp3
        ├── thunderstorm.mp3
        ├── wind.mp3
        ├── birds.mp3
        ├── library.mp3
        ├── train.mp3
        ├── night.mp3
        ├── stream.mp3
        └── piano.mp3
```

### Message Protocol

**Messages handled by offscreen.js:**

| Message Type | Payload | Action |
|-------------|---------|--------|
| `PLAY_SOUND` | `{ soundId: string, volume: number }` | Load and play the specified sound, looping |
| `STOP_SOUND` | `{}` | Stop all audio playback |
| `SET_VOLUME` | `{ volume: number }` | Adjust volume (0.0 - 1.0) without stopping |
| `PLAY_LAYER` | `{ soundId: string, volume: number, layer: number }` | Pro: add a sound to a specific layer (0-2) |
| `STOP_LAYER` | `{ layer: number }` | Pro: stop a specific sound layer |
| `GET_STATUS` | `{}` | Report current playback state back to background |

**Messages sent from offscreen.js to background:**

| Message Type | Payload | When |
|-------------|---------|------|
| `SOUND_STATUS` | `{ playing: boolean, soundId: string, currentTime: number }` | In response to GET_STATUS |
| `SOUND_ERROR` | `{ error: string, soundId: string }` | Audio load failure or playback error |
| `SOUND_ENDED` | `{ soundId: string }` | If a non-looping sound reaches its end |

### Audio Implementation

```javascript
// offscreen.js — simplified core logic
const audioElements = new Map(); // layer → HTMLAudioElement

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'PLAY_SOUND': {
      const audio = new Audio(chrome.runtime.getURL(`sounds/${message.soundId}.mp3`));
      audio.loop = true;
      audio.volume = message.volume ?? 0.5;
      audio.play().catch(err => {
        chrome.runtime.sendMessage({ type: 'SOUND_ERROR', error: err.message, soundId: message.soundId });
      });
      audioElements.set(0, audio); // default layer 0
      break;
    }
    case 'STOP_SOUND': {
      for (const [layer, audio] of audioElements) {
        audio.pause();
        audio.src = '';
      }
      audioElements.clear();
      break;
    }
    case 'SET_VOLUME': {
      for (const [layer, audio] of audioElements) {
        audio.volume = message.volume;
      }
      break;
    }
    // ... PLAY_LAYER, STOP_LAYER, GET_STATUS handlers
  }
});
```

### Sound Layering (Pro Feature)

Pro users can mix up to 3 ambient sounds simultaneously. Each sound occupies a "layer" (0, 1, or 2). The offscreen document manages separate `<audio>` elements per layer with independent volume controls.

**Layering example:** Rain (layer 0, volume 0.6) + Cafe (layer 1, volume 0.3) + Piano (layer 2, volume 0.2)

**Resource constraints:**
- Maximum 3 simultaneous audio elements
- Total audio memory budget: <20MB
- Sound files are pre-compressed MP3 at 128kbps
- Pro sounds are bundled in the extension (not streamed) to avoid network dependencies

---

## 10.6 Shared UI Utilities

**Directory:** `src/shared/`

These modules are imported by all UI pages (popup, options, block page, onboarding). They provide consistent behavior across the extension's UI surface.

### dom-utils.ts

Safe DOM manipulation utilities that prevent XSS and simplify common patterns.

```typescript
// Core functions
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Record<string, string>,
  children?: (HTMLElement | string)[]
): HTMLElementTagNameMap[K];

export function sanitizeText(input: string): string;
// Strips HTML tags, decodes entities, truncates to maxLength

export function sanitizeDomain(domain: string): string;
// Validates domain format, strips protocol/path, lowercases

export function template(html: string, data: Record<string, string>): string;
// Replaces {{key}} placeholders with sanitized values
// ONLY used for extension-authored templates, NEVER for user content

export function clearElement(el: HTMLElement): void;
// Removes all children safely (avoids innerHTML = '')

export function show(el: HTMLElement): void;
export function hide(el: HTMLElement): void;
export function toggle(el: HTMLElement, visible?: boolean): void;
```

### theme-manager.ts

Manages light/dark/auto theme switching across all UI pages.

```typescript
export type Theme = 'light' | 'dark' | 'auto';

export class ThemeManager {
  private currentTheme: Theme;
  private mediaQuery: MediaQueryList;

  constructor();

  // Initialize theme from storage, apply to document
  async init(): Promise<void>;

  // Set theme, persist to storage, update CSS custom properties
  async setTheme(theme: Theme): Promise<void>;

  // Get resolved theme (resolves 'auto' to 'light' or 'dark')
  getResolvedTheme(): 'light' | 'dark';

  // Listen for system theme changes (for 'auto' mode)
  private watchSystemTheme(): void;

  // Apply CSS custom properties to document.documentElement
  private applyProperties(resolved: 'light' | 'dark'): void;
}

// CSS Custom Properties applied:
// --bg-primary, --bg-secondary, --bg-surface
// --text-primary, --text-secondary, --text-muted
// --border-color, --border-hover
// --accent-primary (#6366f1), --accent-success (#22c55e), --accent-warning (#f59e0b), --accent-error (#ef4444)
// --shadow-sm, --shadow-md, --shadow-lg
// --font-sans (Inter), --font-mono (JetBrains Mono)
```

### i18n-helper.ts

Wraps `chrome.i18n.getMessage()` with fallbacks and pluralization support.

```typescript
export function t(key: string, substitutions?: string[]): string;
// Returns localized string, falls back to English, falls back to key itself

export function tPlural(key: string, count: number): string;
// Handles singular/plural: tPlural('sites_blocked', 1) → "1 site blocked"
//                          tPlural('sites_blocked', 5) → "5 sites blocked"

export function formatDuration(seconds: number): string;
// 90 → "1m 30s", 3600 → "1h 0m", 45 → "45s"

export function formatDate(timestamp: number): string;
// Localized date formatting using Intl.DateTimeFormat

export function formatRelativeTime(timestamp: number): string;
// "2 minutes ago", "Yesterday", "3 days ago"
```

### animation-utils.ts

Shared animation functions using CSS transitions and the Web Animations API (no external dependencies).

```typescript
export function fadeIn(el: HTMLElement, duration?: number): Promise<void>;
export function fadeOut(el: HTMLElement, duration?: number): Promise<void>;
export function slideIn(el: HTMLElement, direction?: 'left' | 'right' | 'up' | 'down', duration?: number): Promise<void>;
export function slideOut(el: HTMLElement, direction?: 'left' | 'right' | 'up' | 'down', duration?: number): Promise<void>;
export function pulse(el: HTMLElement, count?: number): Promise<void>;
export function celebrate(container: HTMLElement): Promise<void>;
// Particle burst animation for post-session celebration
// Uses CSS animations with dynamically created elements, cleaned up after animation

export function countUp(el: HTMLElement, from: number, to: number, duration?: number): Promise<void>;
// Animated number counting (used for Focus Score display)

export function respectsReducedMotion(): boolean;
// Checks prefers-reduced-motion media query
// All animation functions check this and skip animation if true
```

### accessibility.ts

ARIA helpers and keyboard navigation support for all UI pages.

```typescript
export function setAriaLive(el: HTMLElement, message: string, priority?: 'polite' | 'assertive'): void;
// Announces dynamic content changes to screen readers

export function trapFocus(container: HTMLElement): () => void;
// Traps Tab/Shift+Tab focus within a container (for modals, upgrade prompts)
// Returns a cleanup function to release the trap

export function setupKeyboardNav(container: HTMLElement, options: {
  selector: string;           // Focusable element selector
  orientation?: 'horizontal' | 'vertical';
  loop?: boolean;             // Wrap from last to first
  onSelect?: (el: HTMLElement) => void;
}): () => void;
// Arrow key navigation for lists, tab bars, sound cards
// Returns cleanup function

export function announceRouteChange(sectionName: string): void;
// Announces navigation changes (options page section switches)

export function ensureId(el: HTMLElement): string;
// Generates and assigns a unique ID if element doesn't have one
// Used for aria-labelledby and aria-describedby associations

export function addScreenReaderOnly(parent: HTMLElement, text: string): HTMLElement;
// Adds visually hidden text for screen reader context
```

---

## 10.7 Cross-Page Communication Patterns

All UI pages communicate with the background service worker using a consistent message pattern:

### Request-Response (One-Shot)

Used for data fetching and action triggers.

```typescript
// UI page sends:
chrome.runtime.sendMessage(
  { type: 'GET_POPUP_STATE' },
  (response) => {
    if (chrome.runtime.lastError) {
      // Handle service worker not ready
      return;
    }
    renderState(response);
  }
);

// Background handles in messageRouter:
case 'GET_POPUP_STATE':
  return { session, stats, score, streak, license };
```

### Port Connection (Streaming)

Used for real-time updates (timer ticks during active sessions).

```typescript
// Popup opens persistent connection:
const port = chrome.runtime.connect({ name: 'popup-timer' });
port.onMessage.addListener((msg) => {
  if (msg.type === 'TIMER_TICK') {
    updateTimerDisplay(msg.timeRemaining);
    updateBlockedCounter(msg.blockedCount);
  }
});
port.onDisconnect.addListener(() => {
  // Popup is closing, cleanup
});

// Background manages port:
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'popup-timer') {
    const interval = setInterval(() => {
      port.postMessage({
        type: 'TIMER_TICK',
        timeRemaining: session.timeRemaining,
        blockedCount: session.blockedCount,
        score: session.currentScore
      });
    }, 1000);
    port.onDisconnect.addListener(() => clearInterval(interval));
  }
});
```

### Storage Change Listener

Used for passive updates when other parts of the extension modify shared state.

```typescript
// Any UI page can listen:
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes['license.tier']) {
    // Pro upgrade detected — remove all lock indicators
    removeProLocks();
  }
  if (areaName === 'session' && changes['session.active']) {
    // Session state changed — update UI
    refreshSessionDisplay(changes['session.active'].newValue);
  }
});
```

---

## 10.8 Responsive Design & Accessibility

### Popup Responsive Behavior

The popup has a fixed width (380px) but variable height (500-580px). Content adapts via:

- Scrollable content area (tab content) with fixed header and tab bar
- Text truncation with ellipsis for long domain names
- Compact stat displays that stack vertically if content overflows

### Options Page Responsive Behavior

| Viewport | Layout |
|----------|--------|
| 1200px+ | Sidebar (240px) + content area (fluid) |
| 768-1199px | Sidebar (200px, collapsed labels) + content area |
| <768px | Top navigation bar (horizontal scroll) + full-width content |

### Block Page Responsive Behavior

| Viewport | Layout |
|----------|--------|
| 768px+ | Centered card (max-width 600px), horizontal stats grid |
| <768px | Full-width, stats grid becomes 2x2 |
| <480px | Full-width, stats stack vertically |

### Accessibility Requirements

All UI pages meet WCAG 2.1 AA compliance:

- **Color contrast:** All text meets 4.5:1 ratio (verified in both light and dark themes)
- **Focus indicators:** Visible focus outlines (2px solid, offset) on all interactive elements
- **Keyboard navigation:** All functionality available without a mouse
- **Screen reader support:** ARIA labels, live regions for dynamic content, meaningful heading hierarchy
- **Reduced motion:** All animations respect `prefers-reduced-motion: reduce`
- **Font scaling:** UI remains functional at 200% browser font size
- **Touch targets:** All interactive elements are at least 44x44px (relevant for touchscreen Chromebooks)

---

*Agent 5 — UI Page Architecture — Complete*
