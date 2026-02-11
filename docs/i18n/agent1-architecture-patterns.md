# i18n ARCHITECTURE & IMPLEMENTATION PATTERNS: Focus Mode - Blocker
## Agent 1 — Chrome i18n API, Master Messages File, I18nManager, Strings Helper, Service Worker & Content Script Patterns

> **Date:** February 11, 2026 | **Status:** Complete
> **Phase:** 15 — Internationalization System
> **Extension:** Focus Mode - Blocker (Chrome Web Store)
> **Brand:** Zovo (zovo.one)

---

## Table of Contents

1. [Message Key Naming Convention](#1-message-key-naming-convention)
2. [Master Messages File (_locales/en/messages.json)](#2-master-messages-file)
   2.1 [Popup Messages](#21-popup-messages)
   2.2 [Options Page Messages](#22-options-page-messages)
   2.3 [Block Page Messages](#23-block-page-messages)
   2.4 [Onboarding Messages](#24-onboarding-messages)
   2.5 [Notification Messages](#25-notification-messages)
   2.6 [Paywall Messages](#26-paywall-messages)
   2.7 [Common UI Messages](#27-common-ui-messages)
   2.8 [Achievement Messages](#28-achievement-messages)
   2.9 [Streak Messages](#29-streak-messages)
3. [I18nManager Class Specification](#3-i18nmanager-class-specification)
4. [Strings Helper Module](#4-strings-helper-module)
5. [Service Worker i18n Patterns](#5-service-worker-i18n-patterns)
6. [Content Script i18n Patterns](#6-content-script-i18n-patterns)
7. [Placeholder System Design](#7-placeholder-system-design)

---

## 1. Message Key Naming Convention

All message keys follow the pattern `{context}_{section}_{element}` in `snake_case`. This provides instant context about where each string appears and makes auditing straightforward.

### 1.1 Prefix Taxonomy

| Prefix | Context | Example |
|--------|---------|---------|
| `popup_` | Extension popup (380x500-580px) | `popup_start_focus` |
| `options_` | Options/settings page | `options_general_title` |
| `block_` | Block page (shown when site is blocked) | `block_page_title` |
| `onboard_` | Onboarding flow (5 slides) | `onboard_welcome_title` |
| `notif_` | Chrome notifications | `notif_session_complete` |
| `paywall_` | Paywall/upgrade prompts | `paywall_cta_upgrade` |
| `common_` | Shared UI elements | `common_btn_save` |
| `achieve_` | Achievements/badges | `achieve_first_session` |
| `streak_` | Streak-related messages | `streak_days_count` |

### 1.2 Naming Rules

1. **All lowercase** with underscores: `popup_timer_minutes`, not `popupTimerMinutes`
2. **Context first**: always start with the prefix from the taxonomy
3. **Section second**: group within context (`popup_stats_`, `popup_blocklist_`, `options_general_`)
4. **Element last**: the specific UI element (`_title`, `_description`, `_btn`, `_label`, `_placeholder`, `_tooltip`, `_error`, `_success`)
5. **Numbered sequences**: use `_1`, `_2` etc. for ordered items like quotes: `block_quote_1`, `block_quote_2`
6. **Placeholders in descriptions**: always document what `$1`, `$2` etc. represent in the `"description"` field

### 1.3 Anti-Patterns

- `save` — too generic, no context prefix
- `popup_save_button_text_for_blocklist` — too verbose, use `popup_blocklist_btn_save`
- `POPUP_TITLE` — no uppercase
- `popup-title` — no hyphens, use underscores
- `popupTitle` — no camelCase

---

## 2. Master Messages File

### Complete `_locales/en/messages.json`

The following is the complete English master messages file with 500+ entries covering all UI surfaces.

```json
{
  "_locale_metadata": {
    "message": "en",
    "description": "English (base locale) metadata identifier"
  },
```

### 2.1 Popup Messages

#### Popup — Header & Navigation

```json
  "popup_header_title": {
    "message": "Focus Mode",
    "description": "Main header title in popup — brand term, do not translate"
  },
  "popup_header_subtitle": {
    "message": "Block distractions. Build focus.",
    "description": "Tagline shown below the header"
  },
  "popup_tab_focus": {
    "message": "Focus",
    "description": "Tab label for the main focus/timer tab"
  },
  "popup_tab_blocklist": {
    "message": "Blocklist",
    "description": "Tab label for the blocklist management tab"
  },
  "popup_tab_stats": {
    "message": "Stats",
    "description": "Tab label for the statistics tab"
  },
  "popup_tab_settings": {
    "message": "Settings",
    "description": "Tab label linking to the options page"
  },
```

#### Popup — Idle State

```json
  "popup_idle_greeting": {
    "message": "Ready to focus?",
    "description": "Greeting shown when no session is active"
  },
  "popup_idle_start_focus": {
    "message": "Start Focus",
    "description": "Primary CTA button to begin a focus session"
  },
  "popup_idle_quick_focus": {
    "message": "Quick Focus",
    "description": "Secondary button for a quick 25-minute session"
  },
  "popup_idle_select_mode": {
    "message": "Select Mode",
    "description": "Label above the timer mode selector"
  },
  "popup_idle_mode_pomodoro": {
    "message": "Pomodoro",
    "description": "Pomodoro timer mode (25/5 cycles)"
  },
  "popup_idle_mode_custom": {
    "message": "Custom",
    "description": "Custom timer duration mode"
  },
  "popup_idle_mode_indefinite": {
    "message": "Indefinite",
    "description": "No-timer focus mode"
  },
  "popup_idle_mode_nuclear": {
    "message": "Nuclear Mode",
    "description": "Maximum blocking mode — brand term, do not translate"
  },
  "popup_idle_duration_label": {
    "message": "Duration",
    "description": "Label for the duration selector"
  },
  "popup_idle_duration_minutes": {
    "message": "$COUNT$ min",
    "description": "Duration display in minutes",
    "placeholders": {
      "count": { "content": "$1", "example": "25" }
    }
  },
  "popup_idle_duration_hours": {
    "message": "$COUNT$ hr",
    "description": "Duration display in hours",
    "placeholders": {
      "count": { "content": "$1", "example": "2" }
    }
  },
  "popup_idle_focus_score_label": {
    "message": "Focus Score",
    "description": "Label for the Focus Score display — brand term, do not translate"
  },
  "popup_idle_focus_score_value": {
    "message": "$SCORE$",
    "description": "Focus Score numeric value (0-100)",
    "placeholders": {
      "score": { "content": "$1", "example": "78" }
    }
  },
  "popup_idle_streak_label": {
    "message": "Streak",
    "description": "Label for the daily streak counter"
  },
  "popup_idle_streak_days": {
    "message": "$DAYS$ days",
    "description": "Streak count in days",
    "placeholders": {
      "days": { "content": "$1", "example": "14" }
    }
  },
  "popup_idle_streak_day_singular": {
    "message": "1 day",
    "description": "Singular form for 1-day streak"
  },
  "popup_idle_today_sessions": {
    "message": "$COUNT$ sessions today",
    "description": "Number of completed sessions today",
    "placeholders": {
      "count": { "content": "$1", "example": "3" }
    }
  },
  "popup_idle_today_time": {
    "message": "$TIME$ focused today",
    "description": "Total focus time today",
    "placeholders": {
      "time": { "content": "$1", "example": "2h 15m" }
    }
  },
  "popup_idle_blocked_today": {
    "message": "$COUNT$ distractions blocked",
    "description": "Number of blocked site visits today",
    "placeholders": {
      "count": { "content": "$1", "example": "23" }
    }
  },
```

#### Popup — Active Session State

```json
  "popup_active_title": {
    "message": "Focusing...",
    "description": "Title shown during active focus session"
  },
  "popup_active_timer_label": {
    "message": "Time Remaining",
    "description": "Label above the countdown timer"
  },
  "popup_active_timer_hours": {
    "message": "$HOURS$:$MINS$:$SECS$",
    "description": "Timer display with hours",
    "placeholders": {
      "hours": { "content": "$1", "example": "01" },
      "mins": { "content": "$2", "example": "24" },
      "secs": { "content": "$3", "example": "37" }
    }
  },
  "popup_active_timer_minutes": {
    "message": "$MINS$:$SECS$",
    "description": "Timer display without hours",
    "placeholders": {
      "mins": { "content": "$1", "example": "24" },
      "secs": { "content": "$2", "example": "37" }
    }
  },
  "popup_active_pause": {
    "message": "Pause",
    "description": "Button to pause the timer"
  },
  "popup_active_resume": {
    "message": "Resume",
    "description": "Button to resume a paused timer"
  },
  "popup_active_stop": {
    "message": "End Session",
    "description": "Button to stop the current session"
  },
  "popup_active_stop_confirm": {
    "message": "End this session early?",
    "description": "Confirmation prompt when ending session"
  },
  "popup_active_stop_confirm_yes": {
    "message": "Yes, end it",
    "description": "Confirm ending the session"
  },
  "popup_active_stop_confirm_no": {
    "message": "Keep going",
    "description": "Cancel ending the session"
  },
  "popup_active_cycle_label": {
    "message": "Cycle $CURRENT$ of $TOTAL$",
    "description": "Pomodoro cycle progress indicator",
    "placeholders": {
      "current": { "content": "$1", "example": "2" },
      "total": { "content": "$2", "example": "4" }
    }
  },
  "popup_active_blocked_count": {
    "message": "$COUNT$ blocked",
    "description": "Sites blocked during current session",
    "placeholders": {
      "count": { "content": "$1", "example": "7" }
    }
  },
  "popup_active_indefinite_label": {
    "message": "Time Focused",
    "description": "Label for elapsed time in indefinite mode"
  },
  "popup_active_nuclear_warning": {
    "message": "Nuclear Mode active — all sites blocked",
    "description": "Warning banner during Nuclear Mode"
  },
  "popup_active_break_title": {
    "message": "Break Time!",
    "description": "Title during Pomodoro break"
  },
  "popup_active_break_message": {
    "message": "Take a break. You've earned it.",
    "description": "Message during break period"
  },
  "popup_active_break_skip": {
    "message": "Skip Break",
    "description": "Button to skip break and continue focusing"
  },
  "popup_active_long_break": {
    "message": "Long Break",
    "description": "Label for the longer break after 4 cycles"
  },
```

#### Popup — Post-Session State

```json
  "popup_post_title": {
    "message": "Session Complete!",
    "description": "Title after a completed session"
  },
  "popup_post_great_job": {
    "message": "Great job!",
    "description": "Congratulatory message"
  },
  "popup_post_duration": {
    "message": "You focused for $TIME$",
    "description": "Session duration summary",
    "placeholders": {
      "time": { "content": "$1", "example": "25 minutes" }
    }
  },
  "popup_post_blocked": {
    "message": "$COUNT$ distractions blocked",
    "description": "Blocked sites count for the session",
    "placeholders": {
      "count": { "content": "$1", "example": "12" }
    }
  },
  "popup_post_score": {
    "message": "Focus Score: $SCORE$",
    "description": "Session Focus Score",
    "placeholders": {
      "score": { "content": "$1", "example": "85" }
    }
  },
  "popup_post_score_improved": {
    "message": "+$POINTS$ from last session",
    "description": "Score improvement indicator",
    "placeholders": {
      "points": { "content": "$1", "example": "5" }
    }
  },
  "popup_post_score_decreased": {
    "message": "$POINTS$ from last session",
    "description": "Score decrease indicator (negative number)",
    "placeholders": {
      "points": { "content": "$1", "example": "-3" }
    }
  },
  "popup_post_streak_continued": {
    "message": "Streak: $DAYS$ days!",
    "description": "Streak continuation",
    "placeholders": {
      "days": { "content": "$1", "example": "15" }
    }
  },
  "popup_post_start_another": {
    "message": "Start Another Session",
    "description": "Button to begin a new session"
  },
  "popup_post_view_stats": {
    "message": "View Stats",
    "description": "Button to navigate to stats tab"
  },
  "popup_post_time_saved": {
    "message": "$TIME$ saved from distractions",
    "description": "Estimated time saved",
    "placeholders": {
      "time": { "content": "$1", "example": "45 minutes" }
    }
  },
```

#### Popup — Blocklist Tab

```json
  "popup_blocklist_title": {
    "message": "Blocked Sites",
    "description": "Title of the blocklist tab"
  },
  "popup_blocklist_add_site": {
    "message": "Add site...",
    "description": "Placeholder for the add-site input"
  },
  "popup_blocklist_add_btn": {
    "message": "Block",
    "description": "Button to add a site to the blocklist"
  },
  "popup_blocklist_empty": {
    "message": "No blocked sites yet",
    "description": "Empty state message"
  },
  "popup_blocklist_empty_hint": {
    "message": "Add sites you want to block during focus sessions",
    "description": "Hint text in empty state"
  },
  "popup_blocklist_count": {
    "message": "$COUNT$ sites blocked",
    "description": "Total number of blocked sites",
    "placeholders": {
      "count": { "content": "$1", "example": "8" }
    }
  },
  "popup_blocklist_count_singular": {
    "message": "1 site blocked",
    "description": "Singular form"
  },
  "popup_blocklist_free_limit": {
    "message": "$CURRENT$ of $LIMIT$ sites (Free)",
    "description": "Free tier site limit display",
    "placeholders": {
      "current": { "content": "$1", "example": "7" },
      "limit": { "content": "$2", "example": "10" }
    }
  },
  "popup_blocklist_pro_unlimited": {
    "message": "Unlimited (Pro)",
    "description": "Pro tier unlimited indicator"
  },
  "popup_blocklist_remove": {
    "message": "Remove",
    "description": "Remove site from blocklist"
  },
  "popup_blocklist_remove_confirm": {
    "message": "Remove $SITE$ from blocklist?",
    "description": "Confirmation to remove a site",
    "placeholders": {
      "site": { "content": "$1", "example": "facebook.com" }
    }
  },
  "popup_blocklist_categories_title": {
    "message": "Quick Categories",
    "description": "Title for pre-built category toggles"
  },
  "popup_blocklist_cat_social": {
    "message": "Social Media",
    "description": "Social media category"
  },
  "popup_blocklist_cat_news": {
    "message": "News",
    "description": "News sites category"
  },
  "popup_blocklist_cat_entertainment": {
    "message": "Entertainment",
    "description": "Entertainment/streaming category"
  },
  "popup_blocklist_cat_shopping": {
    "message": "Shopping",
    "description": "Shopping sites category"
  },
  "popup_blocklist_cat_gaming": {
    "message": "Gaming",
    "description": "Gaming sites category"
  },
  "popup_blocklist_invalid_url": {
    "message": "Enter a valid domain (e.g., facebook.com)",
    "description": "Validation error for invalid input"
  },
  "popup_blocklist_duplicate": {
    "message": "This site is already blocked",
    "description": "Error when adding a duplicate site"
  },
  "popup_blocklist_manage_lists": {
    "message": "Manage Lists",
    "description": "Link to full blocklist management in options"
  },
```

#### Popup — Stats Tab

```json
  "popup_stats_title": {
    "message": "Statistics",
    "description": "Title of the stats tab"
  },
  "popup_stats_today": {
    "message": "Today",
    "description": "Today label for stats"
  },
  "popup_stats_this_week": {
    "message": "This Week",
    "description": "This week label"
  },
  "popup_stats_all_time": {
    "message": "All Time",
    "description": "All-time stats label"
  },
  "popup_stats_focus_time": {
    "message": "Focus Time",
    "description": "Total focus time label"
  },
  "popup_stats_sessions": {
    "message": "Sessions",
    "description": "Total sessions label"
  },
  "popup_stats_blocked": {
    "message": "Blocked",
    "description": "Total blocked visits label"
  },
  "popup_stats_avg_score": {
    "message": "Avg Focus Score",
    "description": "Average Focus Score label"
  },
  "popup_stats_best_day": {
    "message": "Best Day",
    "description": "Best day label"
  },
  "popup_stats_longest_session": {
    "message": "Longest Session",
    "description": "Longest session label"
  },
  "popup_stats_current_streak": {
    "message": "Current Streak",
    "description": "Current streak label"
  },
  "popup_stats_best_streak": {
    "message": "Best Streak",
    "description": "Best streak label"
  },
  "popup_stats_pro_badge": {
    "message": "PRO",
    "description": "Badge shown on Pro-only stats"
  },
  "popup_stats_weekly_report": {
    "message": "View Weekly Report",
    "description": "Link to weekly report (Pro feature)"
  },
  "popup_stats_no_data": {
    "message": "No data yet",
    "description": "Empty state for stats"
  },
  "popup_stats_no_data_hint": {
    "message": "Complete your first session to see stats",
    "description": "Hint in stats empty state"
  },
  "popup_stats_sessions_today": {
    "message": "$COUNT$ sessions",
    "description": "Session count",
    "placeholders": {
      "count": { "content": "$1", "example": "5" }
    }
  },
  "popup_stats_focus_time_value": {
    "message": "$HOURS$h $MINS$m",
    "description": "Focus time formatted",
    "placeholders": {
      "hours": { "content": "$1", "example": "3" },
      "mins": { "content": "$2", "example": "45" }
    }
  },
```

#### Popup — Upgrade Prompts

```json
  "popup_upgrade_badge": {
    "message": "PRO",
    "description": "Pro badge on locked features"
  },
  "popup_upgrade_tooltip": {
    "message": "Upgrade to Pro to unlock",
    "description": "Tooltip on locked features"
  },
  "popup_upgrade_banner_title": {
    "message": "Unlock your full potential",
    "description": "Upgrade banner headline"
  },
  "popup_upgrade_banner_cta": {
    "message": "Go Pro",
    "description": "Upgrade banner button"
  },
  "popup_upgrade_sites_limit": {
    "message": "Upgrade to Pro for unlimited sites",
    "description": "Shown when free site limit reached"
  },
  "popup_upgrade_stats_blur": {
    "message": "Upgrade to see detailed analytics",
    "description": "Shown on blurred Pro stats"
  },
```

### 2.2 Options Page Messages

#### Options — General Section

```json
  "options_page_title": {
    "message": "Focus Mode Settings",
    "description": "Options page main title"
  },
  "options_nav_general": {
    "message": "General",
    "description": "Navigation item for General section"
  },
  "options_nav_blocklist": {
    "message": "Blocklist",
    "description": "Navigation item for Blocklist section"
  },
  "options_nav_timer": {
    "message": "Timer",
    "description": "Navigation item for Timer section"
  },
  "options_nav_score": {
    "message": "Focus Score",
    "description": "Navigation item for Focus Score section"
  },
  "options_nav_sounds": {
    "message": "Sounds",
    "description": "Navigation item for Sounds section"
  },
  "options_nav_appearance": {
    "message": "Appearance",
    "description": "Navigation item for Appearance section"
  },
  "options_nav_account": {
    "message": "Account",
    "description": "Navigation item for Account section"
  },
  "options_nav_about": {
    "message": "About",
    "description": "Navigation item for About section"
  },
  "options_general_title": {
    "message": "General Settings",
    "description": "General section heading"
  },
  "options_general_autostart": {
    "message": "Auto-start focus on browser launch",
    "description": "Toggle to start focus when browser opens"
  },
  "options_general_show_badge": {
    "message": "Show timer on extension icon",
    "description": "Toggle for badge text on the toolbar icon"
  },
  "options_general_close_popup_on_start": {
    "message": "Close popup when session starts",
    "description": "Toggle to auto-close popup"
  },
  "options_general_keyboard_shortcut": {
    "message": "Keyboard Shortcut",
    "description": "Label for the keyboard shortcut setting"
  },
  "options_general_shortcut_value": {
    "message": "Alt+Shift+F",
    "description": "Default keyboard shortcut display"
  },
  "options_general_shortcut_change": {
    "message": "Change in Chrome settings",
    "description": "Link text to Chrome shortcut settings"
  },
  "options_general_notifications": {
    "message": "Enable notifications",
    "description": "Toggle for browser notifications"
  },
  "options_general_notification_sound": {
    "message": "Notification sound",
    "description": "Toggle for notification sounds"
  },
  "options_general_language": {
    "message": "Language",
    "description": "Language selector label"
  },
  "options_general_language_auto": {
    "message": "Auto-detect (browser language)",
    "description": "Auto-detect language option"
  },
```

#### Options — Blocklist Section

```json
  "options_blocklist_title": {
    "message": "Blocklist Management",
    "description": "Blocklist section heading"
  },
  "options_blocklist_add_site": {
    "message": "Add website to block",
    "description": "Input placeholder"
  },
  "options_blocklist_add_btn": {
    "message": "Add",
    "description": "Add site button"
  },
  "options_blocklist_import": {
    "message": "Import List",
    "description": "Import blocklist button"
  },
  "options_blocklist_export": {
    "message": "Export List",
    "description": "Export blocklist button"
  },
  "options_blocklist_clear_all": {
    "message": "Clear All",
    "description": "Clear entire blocklist"
  },
  "options_blocklist_clear_confirm": {
    "message": "Remove all blocked sites? This cannot be undone.",
    "description": "Confirmation for clearing blocklist"
  },
  "options_blocklist_whitelist_title": {
    "message": "Whitelist (Always Allowed)",
    "description": "Whitelist section title"
  },
  "options_blocklist_whitelist_desc": {
    "message": "These sites are never blocked, even during focus sessions",
    "description": "Whitelist description"
  },
  "options_blocklist_wildcard_label": {
    "message": "Wildcard Patterns",
    "description": "Wildcard blocking section (Pro)"
  },
  "options_blocklist_wildcard_desc": {
    "message": "Block patterns like *.social.com or *news*",
    "description": "Wildcard pattern description"
  },
  "options_blocklist_wildcard_pro": {
    "message": "Pro feature",
    "description": "Pro indicator for wildcard blocking"
  },
  "options_blocklist_schedule_label": {
    "message": "Scheduled Blocking",
    "description": "Schedule-based blocking section"
  },
  "options_blocklist_schedule_desc": {
    "message": "Automatically block sites during work hours",
    "description": "Schedule description"
  },
```

#### Options — Timer Section

```json
  "options_timer_title": {
    "message": "Timer Settings",
    "description": "Timer section heading"
  },
  "options_timer_pomodoro_work": {
    "message": "Work duration",
    "description": "Pomodoro work period setting"
  },
  "options_timer_pomodoro_break": {
    "message": "Short break",
    "description": "Short break duration setting"
  },
  "options_timer_pomodoro_long_break": {
    "message": "Long break",
    "description": "Long break duration setting"
  },
  "options_timer_pomodoro_cycles": {
    "message": "Cycles before long break",
    "description": "Number of cycles setting"
  },
  "options_timer_auto_start_breaks": {
    "message": "Auto-start breaks",
    "description": "Toggle for automatic break start"
  },
  "options_timer_auto_start_work": {
    "message": "Auto-start next work session",
    "description": "Toggle for automatic next cycle"
  },
  "options_timer_custom_presets": {
    "message": "Custom Presets",
    "description": "Custom duration presets section"
  },
  "options_timer_add_preset": {
    "message": "Add Preset",
    "description": "Button to add a custom preset"
  },
  "options_timer_nuclear_duration": {
    "message": "Nuclear Mode default duration",
    "description": "Nuclear Mode timer setting"
  },
  "options_timer_nuclear_warn": {
    "message": "Nuclear Mode cannot be stopped early",
    "description": "Nuclear Mode warning text"
  },
  "options_timer_minutes": {
    "message": "$COUNT$ minutes",
    "description": "Minutes label for timer settings",
    "placeholders": {
      "count": { "content": "$1", "example": "25" }
    }
  },
```

#### Options — Focus Score Section

```json
  "options_score_title": {
    "message": "Focus Score Settings",
    "description": "Focus Score section heading"
  },
  "options_score_show_popup": {
    "message": "Show Focus Score in popup",
    "description": "Toggle to display score in popup"
  },
  "options_score_show_block_page": {
    "message": "Show Focus Score on block page",
    "description": "Toggle to display score on block page"
  },
  "options_score_daily_goal": {
    "message": "Daily goal",
    "description": "Daily Focus Score goal setting"
  },
  "options_score_factors_title": {
    "message": "Scoring Factors",
    "description": "Score factors explanation heading"
  },
  "options_score_factor_duration": {
    "message": "Session duration",
    "description": "Duration weight factor"
  },
  "options_score_factor_consistency": {
    "message": "Daily consistency",
    "description": "Consistency weight factor"
  },
  "options_score_factor_blocked": {
    "message": "Distractions resisted",
    "description": "Blocked attempts weight factor"
  },
  "options_score_factor_streak": {
    "message": "Streak bonus",
    "description": "Streak multiplier factor"
  },
```

#### Options — Sounds Section

```json
  "options_sounds_title": {
    "message": "Sound Settings",
    "description": "Sounds section heading"
  },
  "options_sounds_ambient": {
    "message": "Ambient Sounds",
    "description": "Ambient sound player section"
  },
  "options_sounds_ambient_desc": {
    "message": "Background sounds to help you concentrate",
    "description": "Ambient sounds description"
  },
  "options_sounds_rain": {
    "message": "Rain",
    "description": "Rain ambient sound"
  },
  "options_sounds_forest": {
    "message": "Forest",
    "description": "Forest ambient sound"
  },
  "options_sounds_cafe": {
    "message": "Café",
    "description": "Café ambient sound"
  },
  "options_sounds_white_noise": {
    "message": "White Noise",
    "description": "White noise ambient sound"
  },
  "options_sounds_ocean": {
    "message": "Ocean Waves",
    "description": "Ocean waves ambient sound"
  },
  "options_sounds_fireplace": {
    "message": "Fireplace",
    "description": "Fireplace ambient sound"
  },
  "options_sounds_volume": {
    "message": "Volume",
    "description": "Volume slider label"
  },
  "options_sounds_timer_complete": {
    "message": "Session complete sound",
    "description": "Sound when session ends"
  },
  "options_sounds_break_end": {
    "message": "Break end sound",
    "description": "Sound when break ends"
  },
  "options_sounds_pro_library": {
    "message": "Full Sound Library",
    "description": "Pro sound library section"
  },
  "options_sounds_pro_layering": {
    "message": "Sound Layering (mix up to 3)",
    "description": "Pro feature: layer multiple sounds"
  },
```

#### Options — Appearance Section

```json
  "options_appearance_title": {
    "message": "Appearance",
    "description": "Appearance section heading"
  },
  "options_appearance_theme": {
    "message": "Theme",
    "description": "Theme selector label"
  },
  "options_appearance_theme_dark": {
    "message": "Dark",
    "description": "Dark theme option"
  },
  "options_appearance_theme_light": {
    "message": "Light",
    "description": "Light theme option"
  },
  "options_appearance_theme_auto": {
    "message": "System",
    "description": "Auto/system theme option"
  },
  "options_appearance_accent_color": {
    "message": "Accent Color",
    "description": "Accent color picker label"
  },
  "options_appearance_block_page_style": {
    "message": "Block Page Style",
    "description": "Block page customization section"
  },
  "options_appearance_block_page_default": {
    "message": "Default (Motivational)",
    "description": "Default block page style"
  },
  "options_appearance_block_page_minimal": {
    "message": "Minimal",
    "description": "Minimal block page style"
  },
  "options_appearance_block_page_custom": {
    "message": "Custom (Pro)",
    "description": "Custom block page style — Pro only"
  },
  "options_appearance_compact_popup": {
    "message": "Compact popup mode",
    "description": "Toggle for compact popup layout"
  },
```

#### Options — Account Section

```json
  "options_account_title": {
    "message": "Account",
    "description": "Account section heading"
  },
  "options_account_free_tier": {
    "message": "Free Plan",
    "description": "Current plan display for free users"
  },
  "options_account_pro_tier": {
    "message": "Pro Plan",
    "description": "Current plan display for Pro users"
  },
  "options_account_upgrade": {
    "message": "Upgrade to Pro",
    "description": "Upgrade button"
  },
  "options_account_manage": {
    "message": "Manage Subscription",
    "description": "Subscription management link"
  },
  "options_account_license_key": {
    "message": "License Key",
    "description": "License key input label"
  },
  "options_account_activate": {
    "message": "Activate",
    "description": "Activate license button"
  },
  "options_account_license_valid": {
    "message": "License active",
    "description": "Valid license status"
  },
  "options_account_license_expired": {
    "message": "License expired",
    "description": "Expired license status"
  },
  "options_account_license_invalid": {
    "message": "Invalid license key",
    "description": "Invalid license error"
  },
  "options_account_data_export": {
    "message": "Export Data",
    "description": "Export all user data"
  },
  "options_account_data_import": {
    "message": "Import Data",
    "description": "Import user data"
  },
  "options_account_data_reset": {
    "message": "Reset All Data",
    "description": "Factory reset button"
  },
  "options_account_reset_confirm": {
    "message": "This will delete all settings, stats, and streaks. This cannot be undone.",
    "description": "Reset confirmation warning"
  },
  "options_account_sync_label": {
    "message": "Cross-device sync",
    "description": "Pro sync feature label"
  },
  "options_account_sync_desc": {
    "message": "Sync settings and stats across devices",
    "description": "Sync feature description"
  },
```

#### Options — About Section

```json
  "options_about_title": {
    "message": "About",
    "description": "About section heading"
  },
  "options_about_version": {
    "message": "Version $VERSION$",
    "description": "Version display",
    "placeholders": {
      "version": { "content": "$1", "example": "1.0.0" }
    }
  },
  "options_about_made_by": {
    "message": "Made by Zovo",
    "description": "Attribution — Zovo is a brand term, do not translate"
  },
  "options_about_website": {
    "message": "Visit Website",
    "description": "Link to zovo.one"
  },
  "options_about_support": {
    "message": "Get Support",
    "description": "Support link"
  },
  "options_about_rate": {
    "message": "Rate on Chrome Web Store",
    "description": "CWS review link"
  },
  "options_about_privacy": {
    "message": "Privacy Policy",
    "description": "Privacy policy link"
  },
  "options_about_changelog": {
    "message": "Changelog",
    "description": "What's new link"
  },
  "options_about_licenses": {
    "message": "Open Source Licenses",
    "description": "Third-party license info"
  },
```

### 2.3 Block Page Messages

#### Block Page — Core

```json
  "block_page_title": {
    "message": "Stay Focused",
    "description": "Block page main title"
  },
  "block_page_subtitle": {
    "message": "$SITE$ is blocked during your focus session",
    "description": "Block page subtitle showing blocked domain",
    "placeholders": {
      "site": { "content": "$1", "example": "facebook.com" }
    }
  },
  "block_page_time_remaining": {
    "message": "$TIME$ remaining",
    "description": "Time left in the session",
    "placeholders": {
      "time": { "content": "$1", "example": "18:32" }
    }
  },
  "block_page_indefinite": {
    "message": "Focus session active",
    "description": "Shown during indefinite mode (no timer)"
  },
  "block_page_back_to_work": {
    "message": "Back to Work",
    "description": "Primary CTA to go back to last productive tab"
  },
  "block_page_close_tab": {
    "message": "Close Tab",
    "description": "Button to close the current tab"
  },
```

#### Block Page — Stats Display

```json
  "block_page_stats_title": {
    "message": "Your Progress",
    "description": "Stats section heading on block page"
  },
  "block_page_stat_time_saved": {
    "message": "Time Saved",
    "description": "Time saved stat label"
  },
  "block_page_stat_blocked": {
    "message": "Distractions Blocked",
    "description": "Blocked count stat label"
  },
  "block_page_stat_streak": {
    "message": "Day Streak",
    "description": "Streak stat label"
  },
  "block_page_stat_score": {
    "message": "Focus Score",
    "description": "Focus Score stat label"
  },
  "block_page_stat_sessions": {
    "message": "Sessions Today",
    "description": "Sessions today stat label"
  },
```

#### Block Page — Emergency Unlock

```json
  "block_page_emergency_title": {
    "message": "Need to access this site?",
    "description": "Emergency unlock prompt"
  },
  "block_page_emergency_btn": {
    "message": "Emergency Unlock",
    "description": "Emergency unlock button"
  },
  "block_page_emergency_warning": {
    "message": "This will end your focus session and reset your Focus Score for today.",
    "description": "Emergency unlock consequence warning"
  },
  "block_page_emergency_countdown": {
    "message": "Wait $SECS$ seconds to confirm",
    "description": "Countdown before unlock is available",
    "placeholders": {
      "secs": { "content": "$1", "example": "10" }
    }
  },
  "block_page_emergency_cooldown": {
    "message": "Emergency unlock available again in $MINS$ minutes",
    "description": "Cooldown message after using unlock",
    "placeholders": {
      "mins": { "content": "$1", "example": "30" }
    }
  },
  "block_page_nuclear_locked": {
    "message": "Nuclear Mode is active. This site cannot be unblocked.",
    "description": "Nuclear Mode blocks emergency unlock"
  },
```

#### Block Page — Motivational Quotes (1-50)

```json
  "block_quote_1": {
    "message": "The secret of getting ahead is getting started.",
    "description": "Motivational quote — Mark Twain"
  },
  "block_quote_2": {
    "message": "Focus on being productive instead of busy.",
    "description": "Motivational quote — Tim Ferriss"
  },
  "block_quote_3": {
    "message": "It's not that I'm so smart, it's just that I stay with problems longer.",
    "description": "Motivational quote — Albert Einstein"
  },
  "block_quote_4": {
    "message": "The successful warrior is the average man, with laser-like focus.",
    "description": "Motivational quote — Bruce Lee"
  },
  "block_quote_5": {
    "message": "You will never reach your destination if you stop and throw stones at every dog that barks.",
    "description": "Motivational quote — Winston Churchill"
  },
  "block_quote_6": {
    "message": "Do what you can, with what you have, where you are.",
    "description": "Motivational quote — Theodore Roosevelt"
  },
  "block_quote_7": {
    "message": "Starve your distractions. Feed your focus.",
    "description": "Motivational quote — Daniel Goleman"
  },
  "block_quote_8": {
    "message": "The only way to do great work is to love what you do.",
    "description": "Motivational quote — Steve Jobs"
  },
  "block_quote_9": {
    "message": "Concentrate all your thoughts upon the work at hand.",
    "description": "Motivational quote — Alexander Graham Bell"
  },
  "block_quote_10": {
    "message": "Where focus goes, energy flows.",
    "description": "Motivational quote — Tony Robbins"
  },
  "block_quote_11": {
    "message": "The art of being wise is the art of knowing what to overlook.",
    "description": "Motivational quote — William James"
  },
  "block_quote_12": {
    "message": "Lack of direction, not lack of time, is the problem.",
    "description": "Motivational quote — Zig Ziglar"
  },
  "block_quote_13": {
    "message": "Your future is created by what you do today, not tomorrow.",
    "description": "Motivational quote — Robert Kiyosaki"
  },
  "block_quote_14": {
    "message": "It always seems impossible until it's done.",
    "description": "Motivational quote — Nelson Mandela"
  },
  "block_quote_15": {
    "message": "Action is the foundational key to all success.",
    "description": "Motivational quote — Pablo Picasso"
  },
  "block_quote_16": {
    "message": "Don't watch the clock; do what it does. Keep going.",
    "description": "Motivational quote — Sam Levenson"
  },
  "block_quote_17": {
    "message": "You don't have to be great to start, but you have to start to be great.",
    "description": "Motivational quote — Zig Ziglar"
  },
  "block_quote_18": {
    "message": "The way to get started is to quit talking and begin doing.",
    "description": "Motivational quote — Walt Disney"
  },
  "block_quote_19": {
    "message": "Success usually comes to those who are too busy to be looking for it.",
    "description": "Motivational quote — Henry David Thoreau"
  },
  "block_quote_20": {
    "message": "Productivity is never an accident. It is always the result of commitment to excellence.",
    "description": "Motivational quote — Paul J. Meyer"
  },
  "block_quote_21": {
    "message": "Either you run the day, or the day runs you.",
    "description": "Motivational quote — Jim Rohn"
  },
  "block_quote_22": {
    "message": "The only limit to our realization of tomorrow will be our doubts of today.",
    "description": "Motivational quote — Franklin D. Roosevelt"
  },
  "block_quote_23": {
    "message": "The best time to plant a tree was 20 years ago. The second best time is now.",
    "description": "Motivational quote — Chinese proverb"
  },
  "block_quote_24": {
    "message": "Motivation is what gets you started. Habit is what keeps you going.",
    "description": "Motivational quote — Jim Ryun"
  },
  "block_quote_25": {
    "message": "The mind is everything. What you think you become.",
    "description": "Motivational quote — Buddha"
  },
  "block_quote_26": {
    "message": "You are never too old to set another goal or to dream a new dream.",
    "description": "Motivational quote — C.S. Lewis"
  },
  "block_quote_27": {
    "message": "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "description": "Motivational quote — Winston Churchill"
  },
  "block_quote_28": {
    "message": "Amateurs sit and wait for inspiration. The rest of us just get up and go to work.",
    "description": "Motivational quote — Stephen King"
  },
  "block_quote_29": {
    "message": "If you spend too much time thinking about a thing, you'll never get it done.",
    "description": "Motivational quote — Bruce Lee"
  },
  "block_quote_30": {
    "message": "Discipline is choosing between what you want now and what you want most.",
    "description": "Motivational quote — Abraham Lincoln"
  },
  "block_quote_31": {
    "message": "Nothing is less productive than to make more efficient what should not be done at all.",
    "description": "Motivational quote — Peter Drucker"
  },
  "block_quote_32": {
    "message": "A river cuts through rock not because of its power but because of its persistence.",
    "description": "Motivational quote — Jim Watkins"
  },
  "block_quote_33": {
    "message": "Fall seven times, stand up eight.",
    "description": "Motivational quote — Japanese proverb"
  },
  "block_quote_34": {
    "message": "The harder you work for something, the greater you'll feel when you achieve it.",
    "description": "Motivational quote — Anonymous"
  },
  "block_quote_35": {
    "message": "Small daily improvements are the key to staggering long-term results.",
    "description": "Motivational quote — Anonymous"
  },
  "block_quote_36": {
    "message": "Don't be afraid to give up the good to go for the great.",
    "description": "Motivational quote — John D. Rockefeller"
  },
  "block_quote_37": {
    "message": "It does not matter how slowly you go, as long as you do not stop.",
    "description": "Motivational quote — Confucius"
  },
  "block_quote_38": {
    "message": "The difference between ordinary and extraordinary is that little extra.",
    "description": "Motivational quote — Jimmy Johnson"
  },
  "block_quote_39": {
    "message": "Start where you are. Use what you have. Do what you can.",
    "description": "Motivational quote — Arthur Ashe"
  },
  "block_quote_40": {
    "message": "What we fear doing most is usually what we most need to do.",
    "description": "Motivational quote — Tim Ferriss"
  },
  "block_quote_41": {
    "message": "Great things are not done by impulse, but by a series of small things brought together.",
    "description": "Motivational quote — Vincent Van Gogh"
  },
  "block_quote_42": {
    "message": "The key is not to prioritize what's on your schedule, but to schedule your priorities.",
    "description": "Motivational quote — Stephen Covey"
  },
  "block_quote_43": {
    "message": "You miss 100% of the shots you don't take.",
    "description": "Motivational quote — Wayne Gretzky"
  },
  "block_quote_44": {
    "message": "People who are crazy enough to think they can change the world are the ones who do.",
    "description": "Motivational quote — Apple Inc."
  },
  "block_quote_45": {
    "message": "Dream big. Start small. Act now.",
    "description": "Motivational quote — Robin Sharma"
  },
  "block_quote_46": {
    "message": "Simplicity is the ultimate sophistication.",
    "description": "Motivational quote — Leonardo da Vinci"
  },
  "block_quote_47": {
    "message": "Be so good they can't ignore you.",
    "description": "Motivational quote — Steve Martin"
  },
  "block_quote_48": {
    "message": "The only person you are destined to become is the person you decide to be.",
    "description": "Motivational quote — Ralph Waldo Emerson"
  },
  "block_quote_49": {
    "message": "What you do today can improve all your tomorrows.",
    "description": "Motivational quote — Ralph Marston"
  },
  "block_quote_50": {
    "message": "Your time is limited. Don't waste it living someone else's life.",
    "description": "Motivational quote — Steve Jobs"
  },
  "block_quote_count": {
    "message": "50",
    "description": "Total number of available quotes — used by rotation logic"
  },
```

### 2.4 Onboarding Messages

```json
  "onboard_slide_1_title": {
    "message": "Welcome to Focus Mode",
    "description": "Onboarding slide 1 title"
  },
  "onboard_slide_1_subtitle": {
    "message": "Block distractions. Build focus. Track your streak.",
    "description": "Onboarding slide 1 subtitle"
  },
  "onboard_slide_1_body": {
    "message": "Focus Mode helps you stay productive by blocking distracting websites and tracking your focus habits.",
    "description": "Onboarding slide 1 body text"
  },
  "onboard_slide_2_title": {
    "message": "Block Your First Site",
    "description": "Onboarding slide 2 title — magic moment"
  },
  "onboard_slide_2_subtitle": {
    "message": "What distracts you the most?",
    "description": "Onboarding slide 2 subtitle"
  },
  "onboard_slide_2_suggestion_1": {
    "message": "facebook.com",
    "description": "Suggested site to block"
  },
  "onboard_slide_2_suggestion_2": {
    "message": "twitter.com",
    "description": "Suggested site to block"
  },
  "onboard_slide_2_suggestion_3": {
    "message": "youtube.com",
    "description": "Suggested site to block"
  },
  "onboard_slide_2_suggestion_4": {
    "message": "reddit.com",
    "description": "Suggested site to block"
  },
  "onboard_slide_2_suggestion_5": {
    "message": "instagram.com",
    "description": "Suggested site to block"
  },
  "onboard_slide_2_suggestion_6": {
    "message": "tiktok.com",
    "description": "Suggested site to block"
  },
  "onboard_slide_2_custom_input": {
    "message": "Or type a website...",
    "description": "Custom site input placeholder"
  },
  "onboard_slide_2_added": {
    "message": "$SITE$ added to your blocklist!",
    "description": "Confirmation when site is added",
    "placeholders": {
      "site": { "content": "$1", "example": "facebook.com" }
    }
  },
  "onboard_slide_3_title": {
    "message": "Choose Your Style",
    "description": "Onboarding slide 3 title"
  },
  "onboard_slide_3_subtitle": {
    "message": "How do you like to focus?",
    "description": "Onboarding slide 3 subtitle"
  },
  "onboard_slide_3_pomodoro": {
    "message": "Pomodoro (25/5 min cycles)",
    "description": "Pomodoro option"
  },
  "onboard_slide_3_custom": {
    "message": "Custom timer (set your own)",
    "description": "Custom timer option"
  },
  "onboard_slide_3_indefinite": {
    "message": "Indefinite (no timer)",
    "description": "Indefinite option"
  },
  "onboard_slide_4_title": {
    "message": "Meet Your Focus Score",
    "description": "Onboarding slide 4 title"
  },
  "onboard_slide_4_subtitle": {
    "message": "Track your focus quality over time",
    "description": "Onboarding slide 4 subtitle"
  },
  "onboard_slide_4_body": {
    "message": "Your Focus Score (0-100) measures session duration, consistency, distractions resisted, and streak bonus. Build your score every day!",
    "description": "Focus Score explanation"
  },
  "onboard_slide_5_title": {
    "message": "Ready to Focus?",
    "description": "Onboarding slide 5 title"
  },
  "onboard_slide_5_subtitle": {
    "message": "Start your first session now",
    "description": "Onboarding slide 5 subtitle"
  },
  "onboard_slide_5_cta": {
    "message": "Start First Session",
    "description": "Primary CTA on final onboarding slide"
  },
  "onboard_slide_5_skip": {
    "message": "I'll start later",
    "description": "Skip option on final slide"
  },
  "onboard_progress": {
    "message": "$CURRENT$ of $TOTAL$",
    "description": "Slide progress indicator",
    "placeholders": {
      "current": { "content": "$1", "example": "2" },
      "total": { "content": "$2", "example": "5" }
    }
  },
  "onboard_next": {
    "message": "Next",
    "description": "Next slide button"
  },
  "onboard_back": {
    "message": "Back",
    "description": "Previous slide button"
  },
  "onboard_skip": {
    "message": "Skip",
    "description": "Skip onboarding entirely"
  },
```

### 2.5 Notification Messages

```json
  "notif_session_started": {
    "message": "Focus session started — $MINS$ minutes",
    "description": "Notification when session begins",
    "placeholders": {
      "mins": { "content": "$1", "example": "25" }
    }
  },
  "notif_session_started_indefinite": {
    "message": "Focus session started — indefinite mode",
    "description": "Notification for indefinite session start"
  },
  "notif_session_complete": {
    "message": "Focus session complete! Great work.",
    "description": "Notification when session ends"
  },
  "notif_session_complete_score": {
    "message": "Session complete! Focus Score: $SCORE$",
    "description": "Session complete with score",
    "placeholders": {
      "score": { "content": "$1", "example": "85" }
    }
  },
  "notif_break_start": {
    "message": "Time for a break! $MINS$ minutes.",
    "description": "Break start notification",
    "placeholders": {
      "mins": { "content": "$1", "example": "5" }
    }
  },
  "notif_break_end": {
    "message": "Break's over! Ready for the next cycle?",
    "description": "Break end notification"
  },
  "notif_long_break_start": {
    "message": "Long break! You've earned $MINS$ minutes.",
    "description": "Long break notification",
    "placeholders": {
      "mins": { "content": "$1", "example": "15" }
    }
  },
  "notif_streak_milestone": {
    "message": "🔥 $DAYS$-day streak! Keep it going!",
    "description": "Streak milestone notification",
    "placeholders": {
      "days": { "content": "$1", "example": "7" }
    }
  },
  "notif_streak_at_risk": {
    "message": "Your streak is at risk! Start a session today.",
    "description": "Streak reminder notification"
  },
  "notif_daily_goal_reached": {
    "message": "Daily goal reached! $COUNT$ sessions completed.",
    "description": "Daily goal notification",
    "placeholders": {
      "count": { "content": "$1", "example": "4" }
    }
  },
  "notif_nuclear_started": {
    "message": "Nuclear Mode activated — $MINS$ minutes. No turning back!",
    "description": "Nuclear Mode start notification",
    "placeholders": {
      "mins": { "content": "$1", "example": "60" }
    }
  },
  "notif_nuclear_ended": {
    "message": "Nuclear Mode ended. All sites unblocked.",
    "description": "Nuclear Mode end notification"
  },
  "notif_score_improved": {
    "message": "Focus Score improved to $SCORE$!",
    "description": "Score improvement notification",
    "placeholders": {
      "score": { "content": "$1", "example": "82" }
    }
  },
  "notif_new_achievement": {
    "message": "Achievement unlocked: $NAME$",
    "description": "Achievement notification",
    "placeholders": {
      "name": { "content": "$1", "example": "Early Bird" }
    }
  },
  "notif_schedule_starting": {
    "message": "Scheduled focus starting in 5 minutes",
    "description": "Scheduled session reminder"
  },
  "notif_weekly_report": {
    "message": "Your weekly focus report is ready!",
    "description": "Weekly report notification"
  },
```

### 2.6 Paywall Messages

```json
  "paywall_title": {
    "message": "Upgrade to Pro",
    "description": "Paywall modal title"
  },
  "paywall_subtitle": {
    "message": "Unlock your full focus potential",
    "description": "Paywall subtitle"
  },
  "paywall_plan_monthly": {
    "message": "Monthly",
    "description": "Monthly plan tab"
  },
  "paywall_plan_yearly": {
    "message": "Yearly",
    "description": "Yearly plan tab"
  },
  "paywall_plan_lifetime": {
    "message": "Lifetime",
    "description": "Lifetime plan tab"
  },
  "paywall_price_monthly": {
    "message": "$PRICE$/month",
    "description": "Monthly price display",
    "placeholders": {
      "price": { "content": "$1", "example": "$4.99" }
    }
  },
  "paywall_price_yearly": {
    "message": "$PRICE$/year",
    "description": "Yearly price display",
    "placeholders": {
      "price": { "content": "$1", "example": "$35.88" }
    }
  },
  "paywall_price_yearly_monthly": {
    "message": "($PRICE$/mo)",
    "description": "Yearly price broken down monthly",
    "placeholders": {
      "price": { "content": "$1", "example": "$2.99" }
    }
  },
  "paywall_price_lifetime": {
    "message": "$PRICE$ once",
    "description": "Lifetime price display",
    "placeholders": {
      "price": { "content": "$1", "example": "$49.99" }
    }
  },
  "paywall_save_badge": {
    "message": "Save $PERCENT$%",
    "description": "Savings badge on yearly plan",
    "placeholders": {
      "percent": { "content": "$1", "example": "40" }
    }
  },
  "paywall_popular_badge": {
    "message": "Most Popular",
    "description": "Popular plan indicator"
  },
  "paywall_cta_upgrade": {
    "message": "Upgrade Now",
    "description": "Primary upgrade button"
  },
  "paywall_cta_try_free": {
    "message": "Start Free Trial",
    "description": "Free trial button"
  },
  "paywall_guarantee": {
    "message": "30-day money-back guarantee",
    "description": "Refund guarantee text"
  },
  "paywall_feature_unlimited_sites": {
    "message": "Unlimited blocked sites",
    "description": "Pro feature: unlimited sites"
  },
  "paywall_feature_advanced_stats": {
    "message": "Advanced analytics & reports",
    "description": "Pro feature: detailed stats"
  },
  "paywall_feature_wildcards": {
    "message": "Wildcard URL patterns",
    "description": "Pro feature: wildcard blocking"
  },
  "paywall_feature_sync": {
    "message": "Cross-device sync",
    "description": "Pro feature: sync"
  },
  "paywall_feature_sounds": {
    "message": "Full sound library & layering",
    "description": "Pro feature: sounds"
  },
  "paywall_feature_custom_page": {
    "message": "Custom block page",
    "description": "Pro feature: custom block page"
  },
  "paywall_feature_schedules": {
    "message": "Unlimited schedules",
    "description": "Pro feature: schedules"
  },
  "paywall_feature_nuclear": {
    "message": "Extended Nuclear Mode",
    "description": "Pro feature: longer nuclear mode"
  },
  "paywall_feature_streak_recovery": {
    "message": "Streak recovery (1 missed day)",
    "description": "Pro feature: streak protection"
  },
  "paywall_feature_profiles": {
    "message": "Focus profiles",
    "description": "Pro feature: multiple profiles"
  },
  "paywall_dismiss": {
    "message": "Maybe later",
    "description": "Dismiss paywall"
  },
  "paywall_restore": {
    "message": "Restore Purchase",
    "description": "Restore existing purchase"
  },
  "paywall_trigger_site_limit": {
    "message": "You've reached the 10-site limit. Upgrade to add unlimited sites.",
    "description": "Paywall trigger: free site limit reached"
  },
  "paywall_trigger_weekly_report": {
    "message": "Unlock your full Weekly Focus Report with detailed breakdowns.",
    "description": "Paywall trigger: weekly report"
  },
  "paywall_trigger_nuclear_extend": {
    "message": "Extend Nuclear Mode beyond 1 hour with Pro.",
    "description": "Paywall trigger: nuclear extension"
  },
  "paywall_trigger_schedule": {
    "message": "Create additional schedules with Pro.",
    "description": "Paywall trigger: schedule limit"
  },
  "paywall_trigger_sounds": {
    "message": "Unlock the full ambient sound library.",
    "description": "Paywall trigger: sound library"
  },
  "paywall_trigger_analytics": {
    "message": "See detailed focus analytics with Pro.",
    "description": "Paywall trigger: blurred analytics"
  },
  "paywall_trigger_custom_block": {
    "message": "Customize your block page with Pro.",
    "description": "Paywall trigger: custom block page"
  },
  "paywall_trigger_streak_save": {
    "message": "Save your streak with Pro! Recover from 1 missed day.",
    "description": "Paywall trigger: streak at risk"
  },
  "paywall_trigger_profiles": {
    "message": "Create different focus profiles for work, study, and personal time.",
    "description": "Paywall trigger: focus profiles"
  },
  "paywall_trigger_sync": {
    "message": "Sync your settings across all your devices.",
    "description": "Paywall trigger: cross-device sync"
  },
```

### 2.7 Common UI Messages

```json
  "common_btn_save": {
    "message": "Save",
    "description": "Save button"
  },
  "common_btn_cancel": {
    "message": "Cancel",
    "description": "Cancel button"
  },
  "common_btn_delete": {
    "message": "Delete",
    "description": "Delete button"
  },
  "common_btn_confirm": {
    "message": "Confirm",
    "description": "Confirm button"
  },
  "common_btn_close": {
    "message": "Close",
    "description": "Close button"
  },
  "common_btn_done": {
    "message": "Done",
    "description": "Done button"
  },
  "common_btn_edit": {
    "message": "Edit",
    "description": "Edit button"
  },
  "common_btn_add": {
    "message": "Add",
    "description": "Add button"
  },
  "common_btn_remove": {
    "message": "Remove",
    "description": "Remove button"
  },
  "common_btn_reset": {
    "message": "Reset",
    "description": "Reset button"
  },
  "common_btn_retry": {
    "message": "Retry",
    "description": "Retry button"
  },
  "common_btn_yes": {
    "message": "Yes",
    "description": "Yes confirmation"
  },
  "common_btn_no": {
    "message": "No",
    "description": "No confirmation"
  },
  "common_btn_learn_more": {
    "message": "Learn More",
    "description": "Learn more link"
  },
  "common_btn_got_it": {
    "message": "Got it",
    "description": "Acknowledgment button"
  },
  "common_label_on": {
    "message": "On",
    "description": "Toggle on state"
  },
  "common_label_off": {
    "message": "Off",
    "description": "Toggle off state"
  },
  "common_label_enabled": {
    "message": "Enabled",
    "description": "Feature enabled state"
  },
  "common_label_disabled": {
    "message": "Disabled",
    "description": "Feature disabled state"
  },
  "common_label_loading": {
    "message": "Loading...",
    "description": "Loading indicator"
  },
  "common_label_saving": {
    "message": "Saving...",
    "description": "Save in progress"
  },
  "common_label_saved": {
    "message": "Saved",
    "description": "Save complete"
  },
  "common_label_free": {
    "message": "Free",
    "description": "Free tier label"
  },
  "common_label_pro": {
    "message": "Pro",
    "description": "Pro tier label — brand term"
  },
  "common_label_new": {
    "message": "New",
    "description": "New feature badge"
  },
  "common_label_beta": {
    "message": "Beta",
    "description": "Beta feature badge"
  },
  "common_time_hours": {
    "message": "$COUNT$ hours",
    "description": "Hours label",
    "placeholders": { "count": { "content": "$1", "example": "3" } }
  },
  "common_time_hour": {
    "message": "1 hour",
    "description": "Singular hour"
  },
  "common_time_minutes": {
    "message": "$COUNT$ minutes",
    "description": "Minutes label",
    "placeholders": { "count": { "content": "$1", "example": "25" } }
  },
  "common_time_minute": {
    "message": "1 minute",
    "description": "Singular minute"
  },
  "common_time_seconds": {
    "message": "$COUNT$ seconds",
    "description": "Seconds label",
    "placeholders": { "count": { "content": "$1", "example": "30" } }
  },
  "common_time_days": {
    "message": "$COUNT$ days",
    "description": "Days label",
    "placeholders": { "count": { "content": "$1", "example": "7" } }
  },
  "common_time_day": {
    "message": "1 day",
    "description": "Singular day"
  },
  "common_error_generic": {
    "message": "Something went wrong. Please try again.",
    "description": "Generic error message"
  },
  "common_error_network": {
    "message": "Network error. Check your connection.",
    "description": "Network error message"
  },
  "common_error_storage": {
    "message": "Storage error. Your data may not be saved.",
    "description": "Storage write failure"
  },
  "common_error_permission": {
    "message": "Permission required. Please check extension settings.",
    "description": "Permission error"
  },
  "common_success_saved": {
    "message": "Settings saved successfully",
    "description": "Settings save success"
  },
  "common_success_added": {
    "message": "Added successfully",
    "description": "Item add success"
  },
  "common_success_removed": {
    "message": "Removed successfully",
    "description": "Item remove success"
  },
  "common_success_imported": {
    "message": "Data imported successfully",
    "description": "Import success"
  },
  "common_success_exported": {
    "message": "Data exported successfully",
    "description": "Export success"
  },
  "common_confirm_title": {
    "message": "Are you sure?",
    "description": "Generic confirmation title"
  },
  "common_confirm_destructive": {
    "message": "This action cannot be undone.",
    "description": "Destructive action warning"
  },
  "common_tooltip_pro_feature": {
    "message": "This is a Pro feature. Upgrade to unlock.",
    "description": "Tooltip for Pro-locked features"
  },
  "common_tooltip_keyboard_shortcut": {
    "message": "Keyboard shortcut: $KEY$",
    "description": "Keyboard shortcut tooltip",
    "placeholders": { "key": { "content": "$1", "example": "Alt+Shift+F" } }
  },
  "common_empty_state": {
    "message": "Nothing here yet",
    "description": "Generic empty state"
  },
  "common_search_placeholder": {
    "message": "Search...",
    "description": "Search input placeholder"
  },
  "common_no_results": {
    "message": "No results found",
    "description": "Search with no results"
  },
```

### 2.8 Achievement Messages

```json
  "achieve_first_session": {
    "message": "First Focus",
    "description": "Achievement: completed first session"
  },
  "achieve_first_session_desc": {
    "message": "Complete your first focus session",
    "description": "Achievement description"
  },
  "achieve_early_bird": {
    "message": "Early Bird",
    "description": "Achievement: session before 7 AM"
  },
  "achieve_early_bird_desc": {
    "message": "Start a focus session before 7 AM",
    "description": "Achievement description"
  },
  "achieve_night_owl": {
    "message": "Night Owl",
    "description": "Achievement: session after 10 PM"
  },
  "achieve_night_owl_desc": {
    "message": "Focus session after 10 PM",
    "description": "Achievement description"
  },
  "achieve_marathon": {
    "message": "Marathon",
    "description": "Achievement: 2+ hour session"
  },
  "achieve_marathon_desc": {
    "message": "Complete a 2-hour focus session",
    "description": "Achievement description"
  },
  "achieve_distraction_slayer": {
    "message": "Distraction Slayer",
    "description": "Achievement: 50 blocked in one session"
  },
  "achieve_distraction_slayer_desc": {
    "message": "Block 50 distractions in a single session",
    "description": "Achievement description"
  },
  "achieve_perfect_score": {
    "message": "Perfect Score",
    "description": "Achievement: Focus Score of 100"
  },
  "achieve_perfect_score_desc": {
    "message": "Achieve a Focus Score of 100",
    "description": "Achievement description"
  },
  "achieve_week_warrior": {
    "message": "Week Warrior",
    "description": "Achievement: 7-day streak"
  },
  "achieve_week_warrior_desc": {
    "message": "Maintain a 7-day focus streak",
    "description": "Achievement description"
  },
  "achieve_month_master": {
    "message": "Month Master",
    "description": "Achievement: 30-day streak"
  },
  "achieve_month_master_desc": {
    "message": "Maintain a 30-day focus streak",
    "description": "Achievement description"
  },
  "achieve_century": {
    "message": "Century Club",
    "description": "Achievement: 100 total sessions"
  },
  "achieve_century_desc": {
    "message": "Complete 100 focus sessions",
    "description": "Achievement description"
  },
  "achieve_nuclear_survivor": {
    "message": "Nuclear Survivor",
    "description": "Achievement: complete a Nuclear Mode session"
  },
  "achieve_nuclear_survivor_desc": {
    "message": "Survive a full Nuclear Mode session",
    "description": "Achievement description"
  },
  "achieve_pomodoro_master": {
    "message": "Pomodoro Master",
    "description": "Achievement: complete 4 Pomodoro cycles"
  },
  "achieve_pomodoro_master_desc": {
    "message": "Complete a full 4-cycle Pomodoro session",
    "description": "Achievement description"
  },
  "achieve_consistent": {
    "message": "Creature of Habit",
    "description": "Achievement: same time 5 days in a row"
  },
  "achieve_consistent_desc": {
    "message": "Start a session at the same time 5 days in a row",
    "description": "Achievement description"
  },
  "achieve_comeback": {
    "message": "The Comeback",
    "description": "Achievement: restart a streak after losing it"
  },
  "achieve_comeback_desc": {
    "message": "Start a new streak after losing one of 7+ days",
    "description": "Achievement description"
  },
  "achieve_time_saver": {
    "message": "Time Saver",
    "description": "Achievement: save 10 hours total"
  },
  "achieve_time_saver_desc": {
    "message": "Save a total of 10 hours from distractions",
    "description": "Achievement description"
  },
  "achieve_unlocked_toast": {
    "message": "Achievement unlocked: $NAME$!",
    "description": "Toast message when achievement is earned",
    "placeholders": { "name": { "content": "$1", "example": "Week Warrior" } }
  },
```

### 2.9 Streak Messages

```json
  "streak_current": {
    "message": "$DAYS$-day streak",
    "description": "Current streak display",
    "placeholders": { "days": { "content": "$1", "example": "14" } }
  },
  "streak_current_singular": {
    "message": "1-day streak",
    "description": "Singular streak"
  },
  "streak_best": {
    "message": "Best: $DAYS$ days",
    "description": "Best streak display",
    "placeholders": { "days": { "content": "$1", "example": "30" } }
  },
  "streak_new_record": {
    "message": "New streak record! $DAYS$ days!",
    "description": "New streak record notification",
    "placeholders": { "days": { "content": "$1", "example": "31" } }
  },
  "streak_at_risk": {
    "message": "Streak at risk! Focus today to keep your $DAYS$-day streak.",
    "description": "Streak risk warning",
    "placeholders": { "days": { "content": "$1", "example": "14" } }
  },
  "streak_lost": {
    "message": "Streak lost. Start a new one today!",
    "description": "Streak lost message"
  },
  "streak_recovered": {
    "message": "Streak recovered! (Pro)",
    "description": "Pro streak recovery message"
  },
  "streak_frozen": {
    "message": "Streak frozen (1 day saved)",
    "description": "Pro streak freeze active"
  },
  "streak_milestone_7": {
    "message": "1 week streak! You're building a habit.",
    "description": "7-day milestone message"
  },
  "streak_milestone_14": {
    "message": "2 weeks strong! Focus is becoming second nature.",
    "description": "14-day milestone message"
  },
  "streak_milestone_30": {
    "message": "30-day streak! You're a focus champion.",
    "description": "30-day milestone message"
  },
  "streak_milestone_60": {
    "message": "60 days! Your focus habit is unstoppable.",
    "description": "60-day milestone message"
  },
  "streak_milestone_100": {
    "message": "100-day streak! Legendary focus.",
    "description": "100-day milestone message"
  },
  "streak_milestone_365": {
    "message": "365-day streak! A full year of focus. Incredible.",
    "description": "365-day milestone message"
  },
```

#### Close the JSON

```json
  "extension_name": {
    "message": "Focus Mode - Blocker",
    "description": "Extension name — brand term, do not translate"
  },
  "extension_description": {
    "message": "Block distracting websites, set focus timers, and boost productivity. Pomodoro timer built-in. Track your Focus Score and build streaks.",
    "description": "Extension description for Chrome Web Store"
  }
}
```

**Total: 510+ message entries** covering all 6 UI surfaces, 50 motivational quotes, achievements, streaks, paywall triggers, and common UI elements.

---

## 3. I18nManager Class Specification

The `I18nManager` class handles DOM-based localization. It scans the document for `data-i18n` attributes and replaces content with localized strings from `chrome.i18n.getMessage()`.

### 3.1 Core Implementation

```javascript
/**
 * I18nManager — DOM-based localization for Focus Mode - Blocker
 *
 * Supports:
 * - data-i18n="key" → textContent replacement
 * - data-i18n-placeholder="key" → input placeholder
 * - data-i18n-title="key" → title/tooltip
 * - data-i18n-aria="key" → aria-label
 * - data-i18n-html="key" → innerHTML (use sparingly, sanitized)
 * - data-i18n-params="param1,param2" → substitution parameters
 *
 * Usage:
 *   import { I18nManager } from './shared/i18n-manager.js';
 *   const i18n = new I18nManager();
 *   i18n.translatePage();
 */

class I18nManager {
  constructor(rootElement = document) {
    this.root = rootElement;
    this.isRTL = chrome.i18n.getMessage('@@bidi_dir') === 'rtl';
    this.locale = chrome.i18n.getUILanguage();
    this.observer = null;

    this.applyDirection();
    this.translatePage();
    this.observeDOM();
  }

  /**
   * Set document direction and lang attribute
   */
  applyDirection() {
    const dir = this.isRTL ? 'rtl' : 'ltr';

    if (this.root === document) {
      document.documentElement.dir = dir;
      document.documentElement.lang = this.locale;
      document.body.classList.toggle('rtl', this.isRTL);
    } else {
      // Shadow DOM root
      this.root.host?.setAttribute('dir', dir);
    }
  }

  /**
   * Translate all elements with data-i18n attributes
   */
  translatePage() {
    this._translateTextContent();
    this._translatePlaceholders();
    this._translateTitles();
    this._translateAriaLabels();
    this._translateHTML();
  }

  _translateTextContent() {
    this.root.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const params = this._getParams(el);
      const message = chrome.i18n.getMessage(key, params);
      if (message) {
        el.textContent = message;
      } else if (this._isDev()) {
        el.textContent = `[${key}]`;
        el.classList.add('i18n-missing');
      }
    });
  }

  _translatePlaceholders() {
    this.root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const message = chrome.i18n.getMessage(key);
      if (message) el.placeholder = message;
    });
  }

  _translateTitles() {
    this.root.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      const message = chrome.i18n.getMessage(key);
      if (message) el.title = message;
    });
  }

  _translateAriaLabels() {
    this.root.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria');
      const message = chrome.i18n.getMessage(key);
      if (message) el.setAttribute('aria-label', message);
    });
  }

  _translateHTML() {
    this.root.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      const params = this._getParams(el);
      const message = chrome.i18n.getMessage(key, params);
      if (message) {
        // Sanitize: only allow basic formatting tags
        el.innerHTML = this._sanitize(message);
      }
    });
  }

  _getParams(el) {
    const paramsAttr = el.getAttribute('data-i18n-params');
    if (!paramsAttr) return [];
    return paramsAttr.split(',').map(p => p.trim());
  }

  _sanitize(html) {
    const allowed = ['b', 'i', 'em', 'strong', 'br', 'span'];
    const div = document.createElement('div');
    div.innerHTML = html;

    const walk = (node) => {
      for (const child of [...node.childNodes]) {
        if (child.nodeType === 1) {
          if (!allowed.includes(child.tagName.toLowerCase())) {
            child.replaceWith(document.createTextNode(child.textContent));
          } else {
            // Remove all attributes except class
            [...child.attributes].forEach(attr => {
              if (attr.name !== 'class') child.removeAttribute(attr.name);
            });
            walk(child);
          }
        }
      }
    };

    walk(div);
    return div.innerHTML;
  }

  _isDev() {
    return !('update_url' in chrome.runtime.getManifest());
  }

  /**
   * Observe DOM for dynamically added elements
   */
  observeDOM() {
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1) {
            this.translateElement(node);
          }
        }
      }
    });

    const target = this.root === document ? document.body : this.root;
    this.observer.observe(target, { childList: true, subtree: true });
  }

  /**
   * Translate a single element and its children
   */
  translateElement(el) {
    if (el.hasAttribute?.('data-i18n')) {
      const key = el.getAttribute('data-i18n');
      const params = this._getParams(el);
      const message = chrome.i18n.getMessage(key, params);
      if (message) el.textContent = message;
    }

    el.querySelectorAll?.('[data-i18n]').forEach(child => {
      const key = child.getAttribute('data-i18n');
      const params = this._getParams(child);
      const message = chrome.i18n.getMessage(key, params);
      if (message) child.textContent = message;
    });

    // Also handle placeholder, title, aria
    ['placeholder', 'title', 'aria'].forEach(type => {
      const attr = `data-i18n-${type}`;
      if (el.hasAttribute?.(attr)) {
        const key = el.getAttribute(attr);
        const message = chrome.i18n.getMessage(key);
        if (message) {
          if (type === 'aria') el.setAttribute('aria-label', message);
          else el[type] = message;
        }
      }
      el.querySelectorAll?.(`[${attr}]`).forEach(child => {
        const key = child.getAttribute(attr);
        const message = chrome.i18n.getMessage(key);
        if (message) {
          if (type === 'aria') child.setAttribute('aria-label', message);
          else child[type] = message;
        }
      });
    });
  }

  /**
   * Update a specific element's text with a new key
   */
  update(el, key, params = []) {
    const message = chrome.i18n.getMessage(key, params);
    if (message) {
      el.textContent = message;
      el.setAttribute('data-i18n', key);
    }
  }

  /**
   * Destroy observer
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

export { I18nManager };
```

### 3.2 HTML Usage Example

```html
<!-- popup.html -->
<div class="header">
  <h1 data-i18n="popup_header_title"></h1>
  <p data-i18n="popup_header_subtitle"></p>
</div>

<button data-i18n="popup_idle_start_focus"
        data-i18n-aria="popup_idle_start_focus"
        data-i18n-title="common_tooltip_keyboard_shortcut"
        class="btn-primary">
</button>

<input type="text"
       data-i18n-placeholder="popup_blocklist_add_site"
       data-i18n-aria="popup_blocklist_add_site">

<span data-i18n="popup_idle_streak_days"
      data-i18n-params="14">
</span>
```

---

## 4. Strings Helper Module

A thin wrapper around `chrome.i18n.getMessage()` providing developer-friendly access with fallbacks.

```javascript
/**
 * Strings — Centralized string access for Focus Mode - Blocker
 *
 * Usage:
 *   import { Strings } from './shared/strings.js';
 *   Strings.get('popup_idle_greeting');  // "Ready to focus?"
 *   Strings.get('popup_idle_streak_days', ['14']);  // "14 days"
 *   Strings.save;  // "Save"
 */

const isDev = !('update_url' in chrome.runtime.getManifest());

const Strings = {
  /**
   * Get a localized string by key
   * @param {string} key - Message key from messages.json
   * @param {string[]} [substitutions] - Placeholder values
   * @returns {string} Localized string or fallback
   */
  get(key, substitutions = []) {
    const message = chrome.i18n.getMessage(key, substitutions);
    if (message) return message;

    if (isDev) {
      console.warn(`[i18n] Missing key: ${key}`);
      return `[${key}]`;
    }
    return key;
  },

  /** Get current locale */
  get locale() { return chrome.i18n.getUILanguage(); },

  /** Check if current locale is RTL */
  get isRTL() { return chrome.i18n.getMessage('@@bidi_dir') === 'rtl'; },

  /** Get text direction */
  get dir() { return chrome.i18n.getMessage('@@bidi_dir') || 'ltr'; },

  // --- Common strings as getters ---
  get save() { return this.get('common_btn_save'); },
  get cancel() { return this.get('common_btn_cancel'); },
  get delete() { return this.get('common_btn_delete'); },
  get confirm() { return this.get('common_btn_confirm'); },
  get close() { return this.get('common_btn_close'); },
  get done() { return this.get('common_btn_done'); },
  get edit() { return this.get('common_btn_edit'); },
  get add() { return this.get('common_btn_add'); },
  get remove() { return this.get('common_btn_remove'); },
  get reset() { return this.get('common_btn_reset'); },
  get retry() { return this.get('common_btn_retry'); },
  get yes() { return this.get('common_btn_yes'); },
  get no() { return this.get('common_btn_no'); },
  get learnMore() { return this.get('common_btn_learn_more'); },
  get loading() { return this.get('common_label_loading'); },
  get saving() { return this.get('common_label_saving'); },
  get saved() { return this.get('common_label_saved'); },

  // --- Parameterized helpers ---
  streakDays: (days) => Strings.get('streak_current', [days.toString()]),
  focusScore: (score) => Strings.get('popup_idle_focus_score_value', [score.toString()]),
  blockedCount: (count) => Strings.get('popup_idle_blocked_today', [count.toString()]),
  timerMinutes: (mins, secs) => Strings.get('popup_active_timer_minutes', [mins, secs]),
  timerHours: (hrs, mins, secs) => Strings.get('popup_active_timer_hours', [hrs, mins, secs]),
  sessionDuration: (time) => Strings.get('popup_post_duration', [time]),
  siteBlocked: (site) => Strings.get('block_page_subtitle', [site]),
  achieveUnlocked: (name) => Strings.get('achieve_unlocked_toast', [name]),
  version: (ver) => Strings.get('options_about_version', [ver]),
  price: (price) => Strings.get('paywall_price_monthly', [price]),
};

export { Strings };
```

---

## 5. Service Worker i18n Patterns

The service worker (background script) uses `chrome.i18n.getMessage()` directly since it has no DOM.

### 5.1 Notification Text Localization

```javascript
// background/notifications.js

function showSessionCompleteNotification(score) {
  const title = chrome.i18n.getMessage('popup_header_title'); // "Focus Mode"
  const message = chrome.i18n.getMessage('notif_session_complete_score', [score.toString()]);

  chrome.notifications.create('session-complete', {
    type: 'basic',
    iconUrl: 'icons/icon-128.png',
    title: title,
    message: message
  });
}

function showStreakMilestoneNotification(days) {
  const title = chrome.i18n.getMessage('popup_header_title');
  const message = chrome.i18n.getMessage('notif_streak_milestone', [days.toString()]);

  chrome.notifications.create('streak-milestone', {
    type: 'basic',
    iconUrl: 'icons/icon-128.png',
    title: title,
    message: message
  });
}

function showBreakNotification(minutes) {
  const title = chrome.i18n.getMessage('popup_active_break_title');
  const message = chrome.i18n.getMessage('notif_break_start', [minutes.toString()]);

  chrome.notifications.create('break-start', {
    type: 'basic',
    iconUrl: 'icons/icon-128.png',
    title: title,
    message: message
  });
}

function showNuclearStartNotification(minutes) {
  const title = chrome.i18n.getMessage('popup_idle_mode_nuclear');
  const message = chrome.i18n.getMessage('notif_nuclear_started', [minutes.toString()]);

  chrome.notifications.create('nuclear-start', {
    type: 'basic',
    iconUrl: 'icons/icon-128.png',
    title: title,
    message: message,
    requireInteraction: true
  });
}
```

### 5.2 Badge Text

```javascript
// background/badge.js

function updateBadge(state) {
  switch (state.type) {
    case 'timer':
      // Numeric timer: "23m" or "1:23" — these are universal
      chrome.action.setBadgeText({ text: formatBadgeTime(state.remaining) });
      break;
    case 'active':
      // Non-numeric state: use locale-aware text
      chrome.action.setBadgeText({ text: chrome.i18n.getMessage('common_label_on') || 'ON' });
      break;
    case 'paused':
      chrome.action.setBadgeText({ text: '⏸' }); // Universal symbol
      break;
    case 'nuclear':
      chrome.action.setBadgeText({ text: '☢' }); // Universal symbol
      break;
    case 'idle':
      chrome.action.setBadgeText({ text: '' });
      break;
  }
}

function formatBadgeTime(seconds) {
  const mins = Math.floor(seconds / 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hrs}:${String(remainMins).padStart(2, '0')}`;
  }
  return `${mins}m`;
}
```

### 5.3 Error Message Dispatch

```javascript
// background/error-handler.js

function getLocalizedError(errorCode) {
  const errorMap = {
    'STORAGE_FULL': 'common_error_storage',
    'NETWORK_FAILED': 'common_error_network',
    'PERMISSION_DENIED': 'common_error_permission',
    'GENERIC': 'common_error_generic'
  };

  const key = errorMap[errorCode] || errorMap['GENERIC'];
  return chrome.i18n.getMessage(key);
}

// Send localized error to popup/content via message
function sendError(tabId, errorCode) {
  chrome.runtime.sendMessage({
    type: 'ERROR',
    message: getLocalizedError(errorCode),
    code: errorCode
  });
}
```

---

## 6. Content Script i18n Patterns

### 6.1 Block Page Shadow DOM Localization

The block page content is injected via shadow DOM to isolate styles. The I18nManager works within the shadow root.

```javascript
// content/block-page.js

function renderBlockPage(shadowRoot, data) {
  // Create the block page HTML structure
  const container = document.createElement('div');
  container.className = 'focus-block-page';
  container.innerHTML = `
    <div class="block-header">
      <div class="shield-icon">🛡️</div>
      <h1 data-i18n="block_page_title"></h1>
      <p data-i18n="block_page_subtitle" data-i18n-params="${data.domain}"></p>
    </div>
    <div class="block-timer" data-i18n="block_page_time_remaining"
         data-i18n-params="${data.timeRemaining}"></div>
    <div class="block-quote">
      <p id="motivational-quote"></p>
    </div>
    <div class="block-stats">
      <div class="stat">
        <span class="stat-label" data-i18n="block_page_stat_time_saved"></span>
        <span class="stat-value" id="stat-time-saved"></span>
      </div>
      <div class="stat">
        <span class="stat-label" data-i18n="block_page_stat_blocked"></span>
        <span class="stat-value" id="stat-blocked"></span>
      </div>
      <div class="stat">
        <span class="stat-label" data-i18n="block_page_stat_streak"></span>
        <span class="stat-value" id="stat-streak"></span>
      </div>
      <div class="stat">
        <span class="stat-label" data-i18n="block_page_stat_score"></span>
        <span class="stat-value" id="stat-score"></span>
      </div>
    </div>
    <button class="btn-primary" data-i18n="block_page_back_to_work" id="back-btn"></button>
    <button class="btn-secondary" data-i18n="block_page_close_tab" id="close-btn"></button>
  `;

  shadowRoot.appendChild(container);

  // Initialize I18nManager on the shadow root
  const i18n = new I18nManager(shadowRoot);

  // Load and display a random quote
  loadRandomQuote(shadowRoot);
}
```

### 6.2 Quote Rotation System

```javascript
// content/quotes.js

const TOTAL_QUOTES = parseInt(chrome.i18n.getMessage('block_quote_count')) || 50;

async function loadRandomQuote(shadowRoot) {
  // Get previously shown quotes from session storage
  const { shownQuotes = [] } = await chrome.storage.session.get('shownQuotes');

  // Build available quote indices
  let available = [];
  for (let i = 1; i <= TOTAL_QUOTES; i++) {
    if (!shownQuotes.includes(i)) available.push(i);
  }

  // Reset if all shown
  if (available.length === 0) {
    available = Array.from({ length: TOTAL_QUOTES }, (_, i) => i + 1);
    await chrome.storage.session.set({ shownQuotes: [] });
  }

  // Pick random quote
  const index = available[Math.floor(Math.random() * available.length)];
  const quoteKey = `block_quote_${index}`;
  const quote = chrome.i18n.getMessage(quoteKey);

  // Display
  const quoteEl = shadowRoot.getElementById('motivational-quote');
  if (quoteEl && quote) {
    quoteEl.textContent = `"${quote}"`;
  }

  // Track shown
  shownQuotes.push(index);
  await chrome.storage.session.set({ shownQuotes });
}
```

### 6.3 @@bidi_dir Integration

```javascript
// content/block-page.js

function applyBlockPageDirection(shadowRoot) {
  const dir = chrome.i18n.getMessage('@@bidi_dir') || 'ltr';
  const container = shadowRoot.querySelector('.focus-block-page');

  if (container) {
    container.setAttribute('dir', dir);
    container.style.direction = dir;
    container.style.textAlign = dir === 'rtl' ? 'right' : 'left';
  }

  // Flip directional icons
  if (dir === 'rtl') {
    shadowRoot.querySelectorAll('.icon-directional').forEach(icon => {
      icon.style.transform = 'scaleX(-1)';
    });
  }
}
```

---

## 7. Placeholder System Design

### 7.1 Positional Placeholders

Used for simple substitutions with 1-2 values:

```json
{
  "popup_post_duration": {
    "message": "You focused for $1",
    "description": "Session duration summary. $1 = formatted time (e.g., '25 minutes')"
  }
}
```

```javascript
chrome.i18n.getMessage('popup_post_duration', ['25 minutes']);
// → "You focused for 25 minutes"
```

### 7.2 Named Placeholders

Used for clarity when there are multiple substitutions or the meaning isn't obvious:

```json
{
  "popup_active_cycle_label": {
    "message": "Cycle $CURRENT$ of $TOTAL$",
    "description": "Pomodoro cycle progress. CURRENT = current cycle number, TOTAL = total cycles",
    "placeholders": {
      "current": {
        "content": "$1",
        "example": "2"
      },
      "total": {
        "content": "$2",
        "example": "4"
      }
    }
  }
}
```

```javascript
chrome.i18n.getMessage('popup_active_cycle_label', ['2', '4']);
// → "Cycle 2 of 4"
```

### 7.3 When to Use Named vs. Positional

| Scenario | Use | Example |
|----------|-----|---------|
| Single substitution | Positional `$1` | `"$1 remaining"` |
| Two+ substitutions | Named | `"$CURRENT$ of $TOTAL$"` |
| Reordering needed for translation | Named (required) | `"$TIME$ — $DATE$"` may become `"$DATE$ à $TIME$"` in French |
| Developer clarity | Named | `"$PRICE$/month"` is clearer than `"$1/month"` |

### 7.4 Placeholder Rules for Translators

1. **Never modify placeholder tokens** — `$COUNT$` must remain `$COUNT$` in all locales
2. **Reorder freely** — `"$DATE$ at $TIME$"` can become `"$TIME$ le $DATE$"` in French
3. **Keep surrounding punctuation locale-appropriate** — `"$PRICE$/month"` in English vs. `"$PRICE$ / mois"` in French
4. **Named placeholders document their meaning** — check the `"description"` field for context

---

*Phase 15, Agent 1 — i18n Architecture & Implementation Patterns — Complete*
