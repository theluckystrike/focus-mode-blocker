# Focus Mode - Blocker: Technical Architecture & Monetization Integration

## SECTION 5: TECHNICAL ARCHITECTURE
## SECTION 6: MONETIZATION INTEGRATION

> **Document Version:** 1.0
> **Date:** February 10, 2026
> **Status:** Specification Complete
> **Prerequisite:** Sections 1-4 (Competitive Intelligence Report)
> **Target Audience:** Implementation Engineers

---

## SECTION 5: TECHNICAL ARCHITECTURE

---

### 5.1 Permissions Required

Permissions are grouped by when they are requested. The principle is **minimal permissions at install, progressive requests on use**. This maximizes Chrome Web Store trust signals and reduces install abandonment.

#### Always Required (Declared at Install)

| Permission | Type | Reason | Impact on Users |
|------------|------|--------|-----------------|
| `storage` | API | Store blocklists, settings, session history, stats, and subscription data locally on device. Required for all core functionality. | None -- standard for all extensions. |
| `alarms` | API | Schedule timer events for Pomodoro sessions, nuclear option countdowns, schedule-based rule activation/deactivation, and periodic stats aggregation. Required because MV3 service workers are non-persistent. | None -- no user-facing impact. |
| `declarativeNetRequest` | API | Block website requests by installing declarative rules. This is the MV3-compliant blocking mechanism that replaces the deprecated `webRequest` blocking. Core product functionality. | None -- standard for blockers. |
| `declarativeNetRequestWithHostAccess` | API | Required to apply dynamic blocking rules to arbitrary user-specified domains. Without this, blocking would only work on pre-declared hosts. | None -- required for user-configured blocking. |
| `activeTab` | API | Access the currently active tab to detect the current URL for distraction tracking, display the block page overlay, and power the "Quick Focus" one-click feature. Only activates when user interacts with the extension. | Low -- scoped to single tab on click. |
| `scripting` | API | Inject content scripts dynamically for the block page overlay, distraction detection on active pages, and ambient sound player. Required for MV3 content script injection. | Low -- only injects into matched pages. |
| `notifications` | API | Display focus session start/end notifications, break reminders, streak milestones, nuclear option countdowns, and trial/upgrade messaging. | Low -- users expect notifications from productivity tools. |
| `offscreen` | API | Create offscreen documents for ambient sound playback. MV3 service workers cannot play audio directly; offscreen documents provide this capability. | None -- invisible to user. |

#### Host Permissions (Declared at Install)

| Permission | Reason | Required/Optional |
|------------|--------|-------------------|
| `<all_urls>` | Required to inject block page content scripts and monitor navigation on any website the user adds to their blocklist. Without this, blocking would only work on pre-declared domains, making user-configured blocking impossible. | Required |

**Note:** `<all_urls>` is the most sensitive permission. The Chrome Web Store listing must prominently explain: *"This permission allows Focus Mode to block any website you add to your list. We never read, collect, or transmit your browsing data. All data stays on your device."*

#### Optional Permissions (Requested On Use)

| Permission | When Requested | Reason | Tier |
|------------|----------------|--------|------|
| `identity` | When user signs in for Pro/sync | OAuth2 authentication for Google account sign-in. Required for cross-device sync, calendar integration, and license verification. | Pro |
| `idle` | When user enables smart scheduling | Detect active/idle state to auto-pause/resume focus sessions and improve distraction tracking accuracy. | Free (optional enhancement) |
| `tabGroups` | When user enables context-aware profiles | Manage tab groups to associate blocking profiles with tab group contexts (e.g., "Work" group vs "Personal" group). | Pro |

#### Pro-Only Permissions (Requested On Upgrade)

| Permission | When Requested | Reason |
|------------|----------------|--------|
| `identity` | On Pro activation | Google OAuth for sync and calendar. Requested once during Pro onboarding. |
| `gcm` (via Firebase) | On Pro activation | Push notifications for sync updates from other devices and server-side AI recommendation delivery. |

#### Permissions We Deliberately Do NOT Request

| Permission | Why We Avoid It |
|------------|-----------------|
| `webRequest` | Deprecated for blocking in MV3. We use `declarativeNetRequest` instead. |
| `webRequestBlocking` | Not available in MV3. |
| `history` | Privacy-invasive. We track distraction attempts via our own content scripts, not by reading browser history. |
| `bookmarks` | No use case. |
| `cookies` | No use case. We do not need to read cookies from any site. |
| `tabs` (broad) | We use `activeTab` instead, which is more privacy-respecting. |
| `management` | Would allow managing other extensions. Unnecessary and suspicious to users. |
| `browsingData` | No use case. We never modify user browsing data. |

---

### 5.2 Manifest V3 Structure

#### Complete manifest.json

```json
{
  "manifest_version": 3,
  "name": "Focus Mode - Blocker",
  "version": "1.0.0",
  "description": "Block distracting websites, track your focus time, and build better habits. Free forever with 10 blocked sites, Pomodoro timer, and daily stats.",
  "icons": {
    "16": "src/assets/icons/icon-16.png",
    "32": "src/assets/icons/icon-32.png",
    "48": "src/assets/icons/icon-48.png",
    "128": "src/assets/icons/icon-128.png"
  },

  "action": {
    "default_popup": "src/popup/popup.html",
    "default_icon": {
      "16": "src/assets/icons/icon-16.png",
      "32": "src/assets/icons/icon-32.png",
      "48": "src/assets/icons/icon-48.png",
      "128": "src/assets/icons/icon-128.png"
    },
    "default_title": "Focus Mode - Blocker"
  },

  "background": {
    "service_worker": "src/background/service-worker.js",
    "type": "module"
  },

  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["src/content/detector.js"],
      "css": ["src/content/detector.css"],
      "run_at": "document_start",
      "all_frames": false
    }
  ],

  "declarative_net_request": {
    "rule_resources": [
      {
        "id": "static_prebuilt_social",
        "enabled": false,
        "path": "src/rules/prebuilt-social.json"
      },
      {
        "id": "static_prebuilt_news",
        "enabled": false,
        "path": "src/rules/prebuilt-news.json"
      }
    ]
  },

  "permissions": [
    "storage",
    "alarms",
    "declarativeNetRequest",
    "declarativeNetRequestWithHostAccess",
    "activeTab",
    "scripting",
    "notifications",
    "offscreen"
  ],

  "optional_permissions": [
    "identity",
    "idle",
    "tabGroups"
  ],

  "host_permissions": [
    "<all_urls>"
  ],

  "web_accessible_resources": [
    {
      "resources": [
        "src/content/block-page.html",
        "src/content/block-page.css",
        "src/content/block-page.js",
        "src/assets/icons/*",
        "src/assets/sounds/*",
        "src/assets/images/*",
        "src/assets/quotes.json"
      ],
      "matches": ["<all_urls>"]
    }
  ],

  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'; style-src 'self' 'unsafe-inline';"
  },

  "minimum_chrome_version": "116",

  "key": "PLACEHOLDER_FOR_CONSISTENT_EXTENSION_ID_DURING_DEVELOPMENT",

  "oauth2": {
    "client_id": "PLACEHOLDER.apps.googleusercontent.com",
    "scopes": [
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/userinfo.email"
    ]
  }
}
```

#### Content Scripts Configuration

| Script | File | Injection Target | Run At | Purpose |
|--------|------|------------------|--------|---------|
| Distraction Detector | `src/content/detector.js` | `<all_urls>` (main frame only) | `document_start` | Lightweight script that checks if the current URL matches any blocked site. If matched, it prevents page rendering and injects the block page overlay. Also increments the distraction attempt counter. Runs at `document_start` to block rendering before any content loads. |
| Block Page Overlay | `src/content/block-page.js` | Dynamically injected by detector | On demand | Full block page UI with motivational quotes, streak display, session timer, and focus score. Injected only when a blocked URL is detected. |
| Page Time Tracker | `src/content/tracker.js` | Dynamically injected via `scripting` API | `document_idle` | Tracks time spent on specific pages for the distraction analytics. Only injected during active focus sessions when distraction tracking is enabled. Not injected on every page -- only on pages in the user's blocklist that they access outside of blocking hours. |

**Performance strategy:** The statically-declared content script (`detector.js`) must be extremely lightweight (target < 2KB minified). It performs a single synchronous check against an in-memory blocklist cache and either injects the block page or exits immediately. No DOM manipulation occurs unless the site is blocked.

#### Background Service Worker Setup

```
src/background/
  service-worker.js          # Entry point -- imports all modules
  modules/
    blocking-engine.js       # declarativeNetRequest rule management
    session-manager.js       # Focus session lifecycle (start, pause, end)
    timer-engine.js          # Pomodoro timer with alarm-based ticking
    stats-aggregator.js      # Daily/weekly stats computation
    nuclear-controller.js    # Nuclear option state machine
    schedule-engine.js       # Schedule-based rule activation
    notification-manager.js  # All notification logic
    storage-manager.js       # Centralized storage read/write
    sync-manager.js          # Pro: cross-device sync orchestration
    license-manager.js       # Subscription verification
    message-router.js        # Message passing hub
    migration-manager.js     # Storage schema migrations
    onboarding-manager.js    # First-install and trial logic
    gamification-engine.js   # Streaks, badges, focus score
    ambient-sound-manager.js # Offscreen document for audio
    calendar-manager.js      # Pro: Google Calendar integration
    ai-manager.js            # Pro: AI recommendations
```

#### Web Accessible Resources

Resources that content scripts and injected pages need to access:

| Resource | Purpose |
|----------|---------|
| `src/content/block-page.html` | Block page overlay template |
| `src/content/block-page.css` | Block page styling |
| `src/content/block-page.js` | Block page interactivity (streak display, timer, quotes) |
| `src/assets/icons/*` | Extension icons for block page branding |
| `src/assets/sounds/*` | Ambient sound files (3 free: rain.mp3, whitenoise.mp3, lofi.mp3) |
| `src/assets/images/*` | Block page background images, badge icons |
| `src/assets/quotes.json` | Motivational quotes library for block page rotation |

#### Extension Action (Popup) Configuration

```
src/popup/
  popup.html               # Main popup shell (single page)
  popup.css                # Global styles
  popup.js                 # Entry point -- mounts app
  components/
    header.js              # Focus score badge, Pro status, settings gear
    quick-focus.js         # One-click Quick Focus button (primary CTA)
    timer-display.js       # Active session timer with progress ring
    blocklist-panel.js     # Site list with add/remove (shows X/10 counter)
    stats-card.js          # Daily focus time, distraction count, streak
    session-history.js     # Recent sessions list
    sounds-panel.js        # Ambient sound selector (3 free / 15+ Pro)
    schedule-panel.js      # Schedule viewer/editor
    settings-panel.js      # Full settings with Pro feature locks
    upgrade-panel.js       # Pro upgrade CTA with pricing
    nuclear-panel.js       # Nuclear option controls
    buddy-panel.js         # Accountability buddy management
```

The popup is a single HTML page with JavaScript-driven view switching (no framework -- vanilla JS for minimal bundle size). Target popup load time: < 100ms. Total popup bundle: < 150KB.

---

### 5.3 Storage Schema

All data lives in `chrome.storage.local` for the free tier. Pro users additionally use `chrome.storage.sync` for settings and a server-side sync for large datasets.

```javascript
// =============================================================================
// STORAGE SCHEMA v1
// chrome.storage.local -- primary data store
// =============================================================================

const STORAGE_SCHEMA = {

  // -------------------------------------------------------------------------
  // SCHEMA VERSION (for migrations)
  // -------------------------------------------------------------------------
  "schema_version": 1, // integer, incremented on breaking changes

  // -------------------------------------------------------------------------
  // SETTINGS -- User preferences
  // All tiers can read/write. Pro-only settings are enforced at the UI layer.
  // -------------------------------------------------------------------------
  "settings": {
    // General
    "theme": "system",               // string: "light" | "dark" | "system" -- default: "system"
    "language": "en",                 // string: ISO 639-1 code -- default: "en"
    "show_notifications": true,       // boolean -- default: true
    "notification_sound": true,       // boolean -- default: true
    "show_badge_timer": true,         // boolean: show countdown on extension icon -- default: true
    "badge_display": "timer",         // string: "timer" | "score" | "attempts" | "none" -- default: "timer"
    "onboarding_completed": false,    // boolean -- default: false
    "install_date": null,             // string: ISO 8601 date or null -- set on first install
    "last_opened": null,              // string: ISO 8601 datetime -- updated on popup open

    // Blocking preferences
    "block_incognito": false,         // boolean: prompt user to enable incognito access -- default: false
    "block_page_style": "default",    // string: "default" | "minimal" | "custom" -- default: "default" (Pro: "custom")
    "block_page_custom": {            // object: custom block page settings (Pro only)
      "message": "",                  // string: custom message -- default: ""
      "background_color": "#1a1a2e", // string: hex color -- default: "#1a1a2e"
      "text_color": "#e0e0e0",       // string: hex color -- default: "#e0e0e0"
      "show_streak": true,           // boolean -- default: true
      "show_timer": true,            // boolean -- default: true
      "show_quote": true,            // boolean -- default: true
      "show_score": true,            // boolean -- default: true
      "quotes_category": "motivation" // string: "motivation" | "productivity" | "stoic" | "humor" | "custom"
    },
    "redirect_enabled": false,        // boolean: redirect to productive URL instead of block page (Pro only)
    "redirect_url": "",               // string: URL to redirect to -- default: ""

    // Timer preferences
    "pomodoro_focus_minutes": 25,     // integer: 1-240 -- default: 25 (free locked to 25)
    "pomodoro_break_minutes": 5,      // integer: 1-60 -- default: 5 (free locked to 5)
    "pomodoro_long_break_minutes": 15, // integer: 1-60 -- default: 15 (Pro only)
    "pomodoro_sessions_before_long": 4, // integer: 1-12 -- default: 4 (Pro only)
    "auto_start_focus": false,        // boolean: auto-start next focus after break (Pro only)
    "auto_start_break": true,         // boolean: auto-start break after focus -- default: true
    "timer_tick_sound": true,         // boolean: subtle tick at last 5 seconds -- default: true

    // Notification muting
    "mute_notifications_during_focus": true, // boolean -- default: true
    "notification_allowlist": [],      // string[]: domain patterns allowed during focus (Pro only)

    // Ambient sounds
    "ambient_sound": "none",          // string: "none" | "rain" | "whitenoise" | "lofi" | Pro sound IDs
    "ambient_volume": 0.5,            // number: 0.0-1.0 -- default: 0.5
    "ambient_mix": [],                // object[]: [{id: string, volume: number}] -- Pro only, multi-sound mixing

    // Sync (Pro only)
    "sync_enabled": false,            // boolean -- default: false (Pro only)
    "sync_last_timestamp": null,      // string: ISO 8601 datetime or null
    "sync_device_id": null,           // string: UUID generated on install -- unique per device

    // Quick Focus defaults
    "quick_focus_duration": 25,       // integer: minutes -- default: 25
    "quick_focus_sites": "prebuilt_social", // string: blocklist ID to activate -- default: "prebuilt_social"

    // Calendar (Pro only)
    "calendar_enabled": false,        // boolean -- default: false
    "calendar_auto_focus": false,     // boolean: auto-start focus during "deep work" events
    "calendar_keywords": ["deep work", "focus time", "no meetings"], // string[]: event title keywords that trigger auto-focus
  },

  // -------------------------------------------------------------------------
  // BLOCKLIST -- Site blocking data
  // Free: max 10 custom sites + 2 pre-built lists
  // Pro: unlimited custom sites + 6+ pre-built lists + wildcards + whitelist
  // -------------------------------------------------------------------------
  "blocklist": {
    "custom_sites": [
      // Array of user-added blocked sites
      // Each entry:
      // {
      //   "id": "uuid-string",           // string: unique identifier
      //   "pattern": "reddit.com",        // string: domain or URL pattern
      //   "type": "domain",              // string: "domain" | "url" | "wildcard" (wildcard = Pro only)
      //   "enabled": true,               // boolean: can be toggled without removing
      //   "added_at": "2026-02-10T...",  // string: ISO 8601 datetime
      //   "category": null               // string | null: user-assigned category label
      // }
    ],
    "prebuilt_lists": {
      // Pre-built list activation states
      "social_media": {
        "enabled": false,               // boolean -- toggled by user
        "tier": "free"                   // string: "free" | "pro" -- determines access
      },
      "news": {
        "enabled": false,
        "tier": "free"
      },
      "entertainment": {
        "enabled": false,
        "tier": "pro"
      },
      "gaming": {
        "enabled": false,
        "tier": "pro"
      },
      "shopping": {
        "enabled": false,
        "tier": "pro"
      },
      "adult": {
        "enabled": false,
        "tier": "pro"
      }
    },
    "whitelist_mode": false,            // boolean: if true, block everything EXCEPT whitelist (Pro only)
    "whitelist_sites": [
      // Same structure as custom_sites -- only used when whitelist_mode = true
      // Pro only
    ]
  },

  // -------------------------------------------------------------------------
  // SCHEDULES -- Time-based blocking rules
  // Free: 1 schedule
  // Pro: unlimited schedules
  // -------------------------------------------------------------------------
  "schedules": [
    // Each entry:
    // {
    //   "id": "uuid-string",
    //   "name": "Work Hours",               // string: user-given name
    //   "enabled": true,                     // boolean
    //   "days": [1, 2, 3, 4, 5],           // integer[]: 0=Sun, 1=Mon ... 6=Sat
    //   "start_time": "09:00",              // string: HH:MM (24-hour)
    //   "end_time": "17:00",                // string: HH:MM (24-hour)
    //   "blocklist_ids": ["prebuilt_social", "prebuilt_news"], // string[]: which lists to activate
    //   "created_at": "2026-02-10T...",
    //   "updated_at": "2026-02-10T..."
    // }
  ],

  // -------------------------------------------------------------------------
  // SESSIONS -- Focus session history
  // Free: last 7 days retained
  // Pro: full history retained (server-synced)
  // -------------------------------------------------------------------------
  "sessions": {
    "active_session": null,
    // Active session structure when running:
    // {
    //   "id": "uuid-string",
    //   "type": "focus",                    // string: "focus" | "break" | "long_break"
    //   "started_at": "2026-02-10T09:00:00Z", // string: ISO 8601
    //   "duration_minutes": 25,              // integer: planned duration
    //   "elapsed_seconds": 0,                // integer: current progress
    //   "paused": false,                     // boolean
    //   "paused_at": null,                   // string | null
    //   "total_pause_seconds": 0,            // integer
    //   "blocklist_snapshot": ["id1", "id2"], // string[]: active blocklist IDs at session start
    //   "is_nuclear": false,                 // boolean: nuclear option active
    //   "distraction_attempts": 0,           // integer: blocked navigations during this session
    //   "distraction_sites": {},             // object: { "reddit.com": 3, "twitter.com": 1 }
    //   "trigger": "manual"                  // string: "manual" | "quick_focus" | "schedule" | "calendar"
    // }

    "history": [
      // Completed sessions -- same structure as active_session plus:
      // {
      //   ...active_session_fields,
      //   "completed_at": "2026-02-10T09:25:00Z",
      //   "status": "completed",             // string: "completed" | "abandoned" | "interrupted"
      //   "focus_score": 85                   // integer: 0-100, calculated post-session
      // }
    ],
    "history_retention_days": 7          // integer: 7 for free, null (unlimited) for Pro
  },

  // -------------------------------------------------------------------------
  // STATS -- Aggregated daily/weekly statistics
  // Free: current day + 7-day rolling
  // Pro: full history + weekly/monthly aggregates
  // -------------------------------------------------------------------------
  "stats": {
    "today": {
      "date": "2026-02-10",             // string: YYYY-MM-DD
      "total_focus_minutes": 0,          // integer
      "total_break_minutes": 0,          // integer
      "sessions_completed": 0,           // integer
      "sessions_abandoned": 0,           // integer
      "distraction_attempts": 0,         // integer
      "distraction_sites": {},           // object: { "reddit.com": 12, "twitter.com": 5 }
      "nuclear_sessions": 0,             // integer
      "focus_score": 0,                  // integer: 0-100 daily average
      "first_session_at": null,          // string | null: ISO 8601
      "last_session_at": null            // string | null: ISO 8601
    },
    "daily_history": [
      // Array of past daily stats objects (same structure as today)
      // Free: last 7 entries
      // Pro: last 365 entries (older data aggregated into weekly)
    ],
    "weekly_aggregates": [
      // Pro only -- computed weekly summaries
      // {
      //   "week_start": "2026-02-03",
      //   "week_end": "2026-02-09",
      //   "total_focus_minutes": 480,
      //   "sessions_completed": 22,
      //   "distraction_attempts": 187,
      //   "avg_focus_score": 76,
      //   "top_distractions": [{"site": "reddit.com", "count": 67}],
      //   "best_day": "2026-02-05",
      //   "peak_focus_hour": 10       // 24-hour format
      // }
    ],
    "monthly_aggregates": [
      // Pro only -- same structure as weekly but for full months
    ],
    "all_time": {
      "total_focus_minutes": 0,
      "total_sessions": 0,
      "total_distraction_attempts": 0,
      "longest_session_minutes": 0,
      "longest_streak_days": 0,
      "member_since": "2026-02-10"       // string: ISO date
    }
  },

  // -------------------------------------------------------------------------
  // GAMIFICATION -- Streaks, badges, scores
  // Free: current streak + basic badges
  // Pro: full streak history, streak recovery, all badges, focus score breakdown
  // -------------------------------------------------------------------------
  "gamification": {
    "streak": {
      "current": 0,                      // integer: consecutive days with at least 1 completed session
      "longest": 0,                      // integer
      "last_active_date": null,          // string | null: YYYY-MM-DD
      "recovery_used_this_week": false,  // boolean: Pro -- 1 free miss/week without breaking streak
      "history": []                      // object[]: Pro -- [{ "start": "2026-01-01", "end": "2026-01-14", "length": 14 }]
    },
    "badges": [
      // Earned badge records
      // {
      //   "id": "first_session",
      //   "name": "First Step",
      //   "description": "Complete your first focus session",
      //   "earned_at": "2026-02-10T...",
      //   "tier": "free"                 // string: "free" | "pro" -- determines which badges are visible
      // }
    ],
    "focus_score": {
      "current": 0,                      // integer: 0-100 -- updated after each session
      "breakdown": {                     // Pro only -- visible breakdown
        "consistency": 0,                // integer: 0-25 -- based on daily session regularity
        "duration": 0,                   // integer: 0-25 -- based on total focus time
        "resistance": 0,                 // integer: 0-25 -- based on low distraction attempt rate
        "streak": 0                      // integer: 0-25 -- based on current streak length
      },
      "history": []                      // integer[]: Pro -- daily scores for trending
    },
    "level": {
      "current": 1,                      // integer: 1-50
      "xp": 0,                           // integer: experience points
      "xp_to_next": 100                  // integer: XP needed for next level
    },
    "challenges": {
      "active": null,                    // object | null: current active challenge (free: 1 max)
      // {
      //   "id": "7_day_streak",
      //   "name": "7-Day Streak Challenge",
      //   "target": 7,
      //   "progress": 3,
      //   "started_at": "2026-02-10T...",
      //   "expires_at": "2026-02-17T..."
      // }
      "completed": []                    // object[]: completed challenge records
    }
  },

  // -------------------------------------------------------------------------
  // USAGE -- Usage tracking for free-tier limits
  // Tracks consumption against tier limits.
  // -------------------------------------------------------------------------
  "usage": {
    "blocklist_count": 0,               // integer: current number of custom blocked sites
    "blocklist_limit": 10,              // integer: 10 for free, Infinity for Pro
    "schedule_count": 0,                // integer: current number of schedules
    "schedule_limit": 1,                // integer: 1 for free, Infinity for Pro
    "prebuilt_lists_used": [],          // string[]: IDs of activated prebuilt lists
    "prebuilt_lists_limit": 2,          // integer: 2 for free, 6+ for Pro
    "nuclear_max_hours": 1,             // integer: 1 for free, 24 for Pro
    "ambient_sounds_available": ["rain", "whitenoise", "lofi"], // string[]: free sounds
    "buddy_count": 0,                   // integer: current buddy count
    "buddy_limit": 1                    // integer: 1 for free, unlimited for Pro
  },

  // -------------------------------------------------------------------------
  // SUBSCRIPTION -- Pro status and license data
  // -------------------------------------------------------------------------
  "subscription": {
    "tier": "free",                     // string: "free" | "pro" | "team"
    "status": "none",                   // string: "none" | "trial" | "active" | "expired" | "cancelled" | "grace"
    "license_key": null,                // string | null: encrypted license key
    "license_email": null,              // string | null: email associated with license
    "plan_type": null,                  // string | null: "monthly" | "annual" | "lifetime"
    "started_at": null,                 // string | null: ISO 8601
    "expires_at": null,                 // string | null: ISO 8601 -- null for lifetime
    "trial_started_at": null,           // string | null: ISO 8601
    "trial_ends_at": null,              // string | null: ISO 8601
    "trial_used": false,                // boolean: has user ever used trial
    "last_verified_at": null,           // string | null: ISO 8601 -- last server verification
    "verification_failures": 0,         // integer: consecutive failures
    "grace_period_ends_at": null,       // string | null: ISO 8601
    "offline_grace_days": 7,            // integer: days to remain Pro without server verification
    "device_id": null,                  // string | null: UUID for this device
    "referral_code": null,              // string | null: user's unique referral code
    "referred_by": null                 // string | null: referral code used at signup
  },

  // -------------------------------------------------------------------------
  // NUCLEAR -- Nuclear option state (separate for tamper resistance)
  // -------------------------------------------------------------------------
  "nuclear": {
    "active": false,                    // boolean
    "started_at": null,                 // string | null: ISO 8601
    "ends_at": null,                    // string | null: ISO 8601
    "duration_hours": 0,                // number
    "blocklist_snapshot": [],           // string[]: frozen blocklist IDs
    "tamper_hash": null                 // string | null: HMAC of nuclear state for integrity check
  },

  // -------------------------------------------------------------------------
  // BUDDY -- Accountability partner data
  // -------------------------------------------------------------------------
  "buddy": {
    "partners": [
      // {
      //   "id": "uuid-string",
      //   "name": "Alex",
      //   "invite_code": "FM-XXXX-XXXX",
      //   "status": "active",           // "pending" | "active" | "removed"
      //   "connected_at": "2026-02-10T...",
      //   "notify_on_abandon": true,     // boolean: notify buddy if I abandon a session
      //   "notify_on_milestone": true    // boolean: notify buddy on streak milestones
      // }
    ],
    "my_invite_code": null,             // string | null: generated on first use
    "incoming_invites": []              // object[]: pending invites from others
  },

  // -------------------------------------------------------------------------
  // ONBOARDING -- First-run and trial tracking
  // -------------------------------------------------------------------------
  "onboarding": {
    "step": 0,                          // integer: 0-4 (0=not started, 4=completed)
    "steps_completed": [],              // string[]: ["blocklist", "schedule", "block_page", "sounds"]
    "pro_features_used_in_trial": [],   // string[]: track which Pro features user touched during trial
    "first_session_completed": false,   // boolean
    "sessions_since_install": 0,        // integer: total sessions -- used for paywall timing
    "upgrade_prompts_shown": 0,         // integer: total upgrade CTAs displayed
    "last_upgrade_prompt_at": null,     // string | null: ISO 8601 -- for rate limiting
    "weekly_report_shown": false,       // boolean: has the first weekly report been shown
    "founding_member": false            // boolean: installed during beta/launch phase
  }
};
```

#### Data Migration Strategy

```javascript
// Migration runner -- executes on service worker startup
const MIGRATIONS = {
  // Version 1 -> 2 example (future)
  2: async (data) => {
    // Add new fields with defaults
    if (!data.settings.new_field) {
      data.settings.new_field = "default_value";
    }
    // Rename fields
    if (data.old_key) {
      data.new_key = data.old_key;
      delete data.old_key;
    }
    // Transform data structures
    if (Array.isArray(data.sessions.history)) {
      data.sessions.history = data.sessions.history.map(session => ({
        ...session,
        focus_score: session.focus_score ?? calculateLegacyScore(session)
      }));
    }
    data.schema_version = 2;
    return data;
  }
};

async function runMigrations() {
  const data = await chrome.storage.local.get("schema_version");
  const currentVersion = data.schema_version ?? 1;
  const targetVersion = Object.keys(MIGRATIONS).length + 1;

  for (let v = currentVersion + 1; v <= targetVersion; v++) {
    if (MIGRATIONS[v]) {
      const allData = await chrome.storage.local.get(null);
      const migrated = await MIGRATIONS[v](allData);
      await chrome.storage.local.set(migrated);
      console.log(`Migrated storage schema from v${v - 1} to v${v}`);
    }
  }
}
```

**Migration rules:**
1. Migrations are sequential and idempotent.
2. Every migration function takes the full storage object and returns the full storage object.
3. New fields always get default values -- never break existing installs.
4. Migrations run on service worker startup before any other logic.
5. Backup strategy: Before any migration, write `_backup_v{N}` key with a timestamp. Delete after successful migration. If migration fails, restore from backup.

---

### 5.4 Service Worker Architecture

#### Responsibilities

The background service worker is the central coordinator. It manages all state transitions, timer logic, rule updates, and message routing.

| Responsibility | Module | Description |
|----------------|--------|-------------|
| Blocking rule management | `blocking-engine.js` | Creates, updates, and removes `declarativeNetRequest` dynamic rules based on active blocklists, schedules, and nuclear state. |
| Session lifecycle | `session-manager.js` | Start, pause, resume, complete, and abandon focus/break sessions. Coordinates with timer, blocking, and stats modules. |
| Timer ticking | `timer-engine.js` | Uses `chrome.alarms` API to fire every 60 seconds (alarm resolution limit). Tracks elapsed time and triggers session completion. |
| Stats computation | `stats-aggregator.js` | Aggregates session data into daily/weekly/monthly stats. Runs on session completion and on daily rollover alarm. |
| Nuclear option | `nuclear-controller.js` | Manages nuclear state machine: activation, countdown, tamper detection, and expiration. Uses alarm for countdown. |
| Schedule management | `schedule-engine.js` | Evaluates schedule rules on alarm ticks to activate/deactivate blocking rules at scheduled times. |
| Notifications | `notification-manager.js` | Centralized notification dispatch. Rate-limits upgrade prompts. Manages notification click actions. |
| Storage I/O | `storage-manager.js` | Single abstraction layer for all `chrome.storage` operations. Handles caching, batching, and write coalescing. |
| Message routing | `message-router.js` | Routes messages between popup, content scripts, and internal modules. Validates message structure. |
| Sync orchestration | `sync-manager.js` | Pro: manages sync queue, conflict resolution, and server communication. |
| License verification | `license-manager.js` | Periodic license checks, offline grace period, and tier enforcement. |
| Schema migrations | `migration-manager.js` | Runs storage migrations on startup (see 5.3). |
| Onboarding/trial | `onboarding-manager.js` | Trial countdown, feature usage tracking during trial, and trial expiration flow. |
| Gamification | `gamification-engine.js` | Calculates focus scores, awards badges, updates streaks, manages challenges. |
| Ambient sounds | `ambient-sound-manager.js` | Controls offscreen document for audio playback. |
| Calendar | `calendar-manager.js` | Pro: polls Google Calendar API for upcoming events and triggers auto-focus. |
| AI recommendations | `ai-manager.js` | Pro: sends anonymized stats to AI endpoint for focus recommendations. |

#### Alarm-Based Scheduling (MV3 Non-Persistent Limitation)

MV3 service workers are terminated after ~30 seconds of inactivity. All time-sensitive operations use `chrome.alarms`.

| Alarm Name | Period | Purpose |
|------------|--------|---------|
| `timer_tick` | 1 minute (minimum alarm interval) | Update elapsed time for active sessions. Extension badge is updated on each tick. |
| `nuclear_check` | 1 minute | Check if nuclear option has expired. Also performs tamper check on nuclear state integrity. |
| `schedule_check` | 1 minute | Evaluate schedule rules against current time. Activate/deactivate blocking rules as needed. |
| `daily_rollover` | Once daily at 00:00 local | Roll `stats.today` into `stats.daily_history`. Reset daily counters. Update streak. Clean up expired session data. |
| `stats_backup` | Every 5 minutes | Write in-memory stat changes to `chrome.storage.local`. Prevents data loss if service worker terminates. |
| `license_verify` | Every 24 hours | Verify Pro license with server. Update `subscription.last_verified_at`. If server unreachable, decrement grace period. |
| `sync_push` | Every 15 minutes (Pro) | Push pending local changes to sync server. |
| `calendar_poll` | Every 5 minutes (Pro) | Check Google Calendar for upcoming focus-trigger events within the next 10 minutes. |
| `trial_reminder` | Once daily during trial | Calculate trial days remaining. Show notification on days 5, 6, and 7. |
| `session_history_cleanup` | Once daily | For free tier: delete session history older than 7 days. For Pro: no deletion (server-synced). |

**Service worker wake strategy:**
- Alarms automatically wake the service worker.
- `chrome.runtime.onMessage` from popup/content scripts wakes the service worker.
- `declarativeNetRequest` rule evaluation does NOT require the service worker to be running (rules are evaluated by the browser engine).

**In-memory state caching:**
On wake, the service worker reads critical state from storage into memory:
1. Active session state
2. Nuclear option state
3. Current blocklist (domain set for fast lookup)
4. Current schedule evaluation result
5. Subscription tier

This cached state is used for fast message responses. All mutations write-through to storage.

#### Message Passing Architecture

```
+------------------+     chrome.runtime.sendMessage     +---------------------+
|                  | ---------------------------------> |                     |
|   Popup (UI)     |                                    |  Service Worker     |
|                  | <--------------------------------- |  (Background)       |
+------------------+     chrome.runtime.onMessage       +---------------------+
                                                              |       ^
                              chrome.tabs.sendMessage          |       |
                              chrome.runtime.sendMessage       v       |
                         +-----------------------------------+
                         |        Content Scripts            |
                         |   (detector.js, block-page.js)   |
                         +-----------------------------------+
```

**Message Protocol:**

All messages follow a consistent structure:

```javascript
// Request
{
  "type": "ACTION_NAME",      // string: uppercase snake_case
  "payload": { ... },         // object: action-specific data
  "sender": "popup"           // string: "popup" | "content" | "background" | "offscreen"
}

// Response
{
  "success": true,            // boolean
  "data": { ... },            // object: response data (on success)
  "error": null               // string | null: error message (on failure)
}
```

**Message Types:**

| Type | Sender | Handler | Payload | Description |
|------|--------|---------|---------|-------------|
| `GET_STATE` | popup | background | `{}` | Fetch full current state for popup render |
| `START_SESSION` | popup | background | `{ type, duration_minutes, blocklist_ids }` | Start a focus/break session |
| `PAUSE_SESSION` | popup | background | `{}` | Pause active session |
| `RESUME_SESSION` | popup | background | `{}` | Resume paused session |
| `END_SESSION` | popup | background | `{ reason }` | End session ("completed" or "abandoned") |
| `QUICK_FOCUS` | popup | background | `{}` | Start Quick Focus with saved defaults |
| `ACTIVATE_NUCLEAR` | popup | background | `{ hours }` | Activate nuclear option |
| `ADD_SITE` | popup | background | `{ pattern, type }` | Add site to blocklist |
| `REMOVE_SITE` | popup | background | `{ id }` | Remove site from blocklist |
| `TOGGLE_SITE` | popup | background | `{ id, enabled }` | Enable/disable a blocked site |
| `TOGGLE_PREBUILT` | popup | background | `{ list_id, enabled }` | Toggle pre-built list |
| `UPDATE_SETTINGS` | popup | background | `{ key, value }` | Update a setting |
| `SAVE_SCHEDULE` | popup | background | `{ schedule }` | Create/update schedule |
| `DELETE_SCHEDULE` | popup | background | `{ id }` | Delete schedule |
| `GET_STATS` | popup | background | `{ range }` | Fetch stats for time range |
| `CHECK_LICENSE` | popup | background | `{}` | Force license verification |
| `START_TRIAL` | popup | background | `{}` | Activate 7-day Pro trial |
| `PLAY_SOUND` | background | offscreen | `{ sound_id, volume }` | Start ambient sound |
| `STOP_SOUND` | background | offscreen | `{}` | Stop ambient sound |
| `SITE_BLOCKED` | content | background | `{ url, timestamp }` | Report a blocked navigation |
| `GET_BLOCK_PAGE_DATA` | content | background | `{}` | Fetch data for block page render |
| `CHECK_URL` | content | background | `{ url }` | Check if URL should be blocked |
| `SYNC_NOW` | popup | background | `{}` | Force immediate sync (Pro) |

#### State Management Approach

**Pattern: Single Source of Truth with Event-Driven Updates**

1. **Storage is the source of truth.** `chrome.storage.local` holds all state. No critical state exists only in memory.
2. **Write-through caching.** The service worker maintains an in-memory cache of frequently-accessed data. Every mutation writes to both cache and storage atomically.
3. **Event-driven UI updates.** When the background state changes, it broadcasts a `STATE_UPDATED` message to all connected contexts (popup, content scripts). The popup re-reads relevant state slices and re-renders.
4. **Optimistic UI.** The popup applies visual changes immediately on user action, then confirms with the background. If the background rejects the action (e.g., hitting a tier limit), the popup rolls back.
5. **Batched writes.** To avoid hitting storage write rate limits, mutations within a 100ms window are batched into a single `chrome.storage.local.set()` call.

---

### 5.5 Content Script Architecture

#### Injection Strategy

| Script | Injection Method | Target Pages | Run At | Performance Budget |
|--------|------------------|--------------|--------|-------------------|
| `detector.js` | Static (manifest) | `<all_urls>` main frame only | `document_start` | < 2KB, < 1ms execution |
| `block-page.js` | Dynamic (via `detector.js`) | Blocked pages only | On demand | < 30KB total (HTML+CSS+JS) |
| `tracker.js` | Dynamic (via `scripting` API) | Blocklisted sites during sessions | `document_idle` | < 5KB, < 2ms execution |

#### Detector Script (`detector.js`) -- Minimal Footprint

```javascript
// detector.js -- injected on ALL pages at document_start
// MUST be extremely lightweight. No DOM manipulation unless blocking.

(async () => {
  // Fast bail: check if current hostname is in the cached blocklist
  const hostname = location.hostname.replace(/^www\./, '');

  // Read blocklist from session storage cache (set by service worker)
  // Falls back to message-based check if cache miss
  let blocked = false;
  try {
    const cache = sessionStorage.getItem('__fm_blocklist');
    if (cache) {
      const list = JSON.parse(cache);
      blocked = list.includes(hostname);
    } else {
      // Cache miss -- ask background
      const response = await chrome.runtime.sendMessage({
        type: 'CHECK_URL',
        payload: { url: location.href }
      });
      blocked = response?.data?.blocked ?? false;
    }
  } catch (e) {
    // Extension context invalidated -- bail silently
    return;
  }

  if (blocked) {
    // Stop page load immediately
    document.documentElement.innerHTML = '';
    document.head.innerHTML = '';

    // Report distraction attempt
    chrome.runtime.sendMessage({
      type: 'SITE_BLOCKED',
      payload: { url: location.href, timestamp: Date.now() }
    });

    // Load block page
    const blockPageUrl = chrome.runtime.getURL('src/content/block-page.html');
    const response = await fetch(blockPageUrl);
    const html = await response.text();
    document.documentElement.innerHTML = html;

    // Load block page script
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('src/content/block-page.js');
    document.documentElement.appendChild(script);
  }
})();
```

**Note:** The above is a simplified illustration. The actual implementation uses `declarativeNetRequest` as the primary blocking mechanism (see 5.6), with this content script as a secondary UI layer for the block page experience.

#### Block Page Injection Mechanism

The block page is rendered as a full-page overlay that replaces the blocked site's content:

1. **Primary blocking:** `declarativeNetRequest` rules redirect blocked URLs to the extension's block page or return an empty response.
2. **Block page UI:** When the user navigates to a blocked site, `declarativeNetRequest` redirects to `chrome-extension://{id}/src/content/block-page.html?url={encoded_original_url}`.
3. **Block page data:** `block-page.js` sends a `GET_BLOCK_PAGE_DATA` message to the service worker to fetch:
   - Current streak count
   - Session time remaining (if active)
   - Daily distraction attempt count
   - Focus score
   - A random motivational quote
   - Custom block page settings (Pro)
4. **Block page renders** with: motivational quote, streak badge, session timer (if active), "Back to safety" button, distraction counter for today.

#### Page Monitoring for Distraction Tracking

`tracker.js` is injected only during active focus sessions, only on pages that match the user's blocklist (but are not currently blocked -- e.g., during non-nuclear sessions where the user bypassed). It:

1. Records total time spent on the page via `document.visibilityState` tracking.
2. Sends a `PAGE_TIME_UPDATE` message to the service worker every 30 seconds with cumulative time.
3. Self-destructs when focus session ends (listens for `SESSION_ENDED` broadcast).

#### Performance Considerations

- **Minimal DOM impact:** `detector.js` reads no DOM and writes no DOM unless the site is blocked. On non-blocked pages, the script executes in < 1ms and becomes garbage-collectible.
- **No global listeners on non-blocked pages:** `detector.js` does not add any event listeners, observers, or timers on non-blocked pages.
- **Content script isolation:** All scripts run in an isolated world. No access to page JavaScript variables. No risk of conflict with page scripts.
- **CSS isolation:** Block page CSS is scoped to a shadow DOM container to prevent style leakage from the host page.
- **Memory profile:** Target < 500KB memory footprint per tab for the detector script on non-blocked pages. The block page may use up to 2MB (for images, quotes, and timer animation).
- **No network requests on non-blocked pages:** The detector script makes zero network requests on pages that are not blocked.

---

### 5.6 Blocking Mechanism

#### How Website Blocking Works in MV3

Manifest V3 deprecates `webRequest` blocking in favor of `declarativeNetRequest` (DNR). DNR rules are declared as JSON and evaluated by the browser engine itself -- no service worker execution is required for each request.

**Architecture:**

```
User adds "reddit.com" to blocklist
        |
        v
Service Worker: blocking-engine.js
        |
        v
chrome.declarativeNetRequest.updateDynamicRules({
  addRules: [{ id, priority, action, condition }]
})
        |
        v
Chrome browser engine evaluates rules on every request
(no extension code runs -- native browser performance)
        |
        v
Request to reddit.com is redirected to block page
```

#### declarativeNetRequest vs webRequest

| Aspect | declarativeNetRequest (We Use) | webRequest (Deprecated) |
|--------|-------------------------------|------------------------|
| Performance | Native browser evaluation -- near-zero overhead | Extension code runs on every request -- adds latency |
| Service worker | Not required to be running | Must be running for blocking |
| Rule limit | 30,000 dynamic rules + 300,000 static rules | No rule limit |
| Privacy | Rules are opaque to the extension -- cannot read request content | Extension sees all request details |
| MV3 compatible | Yes | Observation only (no blocking) |

We use `declarativeNetRequest` exclusively. Our rule budget (30,000 dynamic) is more than sufficient for the use case (typical user: 10-100 blocked domains).

#### Dynamic Rule Management

**Rule generation for a blocked domain:**

```javascript
function createBlockRule(siteId, domain, ruleId) {
  return {
    id: ruleId,
    priority: 1,
    action: {
      type: "redirect",
      redirect: {
        extensionPath: `/src/content/block-page.html?url=${encodeURIComponent(domain)}&rid=${ruleId}`
      }
    },
    condition: {
      urlFilter: `||${domain}`,    // Matches domain and all subdomains
      resourceTypes: [
        "main_frame"                // Only block page navigations, not subresources
      ]
    }
  };
}

// Wildcard pattern blocking (Pro only)
function createWildcardRule(pattern, ruleId) {
  return {
    id: ruleId,
    priority: 1,
    action: {
      type: "redirect",
      redirect: {
        extensionPath: `/src/content/block-page.html?pattern=${encodeURIComponent(pattern)}`
      }
    },
    condition: {
      urlFilter: pattern,          // e.g., "*reddit*" or "||*.facebook.com"
      resourceTypes: ["main_frame"]
    }
  };
}
```

**Rule lifecycle:**

```
User adds site --> createBlockRule() --> updateDynamicRules({ addRules })
User removes site --> updateDynamicRules({ removeRuleIds })
User toggles site off --> updateDynamicRules({ removeRuleIds })
User toggles site on --> updateDynamicRules({ addRules })
Schedule activates --> batch addRules for all sites in schedule's blocklists
Schedule deactivates --> batch removeRuleIds for schedule-specific rules
Nuclear activates --> addRules for all active blocklists (snapshot)
Nuclear expires --> removeRuleIds for nuclear rules, restore schedule-based state
```

**Rule ID management:**
- Custom site rules: IDs 1-10,000 (hash of site ID to stable integer)
- Pre-built list rules: IDs 10,001-20,000
- Schedule-activated rules: IDs 20,001-25,000
- Nuclear rules: IDs 25,001-30,000
- Whitelist mode rules: ID 30,000 (single rule blocking all, with exceptions)

**Pre-built list static rulesets:**

Pre-built lists (social media, news) are declared as static rulesets in the manifest. They are enabled/disabled atomically:

```javascript
// Enable the social media pre-built list
await chrome.declarativeNetRequest.updateEnabledRulesets({
  enableRulesetIds: ["static_prebuilt_social"]
});

// Disable it
await chrome.declarativeNetRequest.updateEnabledRulesets({
  disableRulesetIds: ["static_prebuilt_social"]
});
```

Static ruleset files (`src/rules/prebuilt-social.json`, `src/rules/prebuilt-news.json`) contain hardcoded domain lists:

```json
// src/rules/prebuilt-social.json (excerpt)
[
  {
    "id": 10001,
    "priority": 1,
    "action": { "type": "redirect", "redirect": { "extensionPath": "/src/content/block-page.html?list=social" } },
    "condition": { "urlFilter": "||facebook.com", "resourceTypes": ["main_frame"] }
  },
  {
    "id": 10002,
    "priority": 1,
    "action": { "type": "redirect", "redirect": { "extensionPath": "/src/content/block-page.html?list=social" } },
    "condition": { "urlFilter": "||twitter.com", "resourceTypes": ["main_frame"] }
  },
  {
    "id": 10003,
    "priority": 1,
    "action": { "type": "redirect", "redirect": { "extensionPath": "/src/content/block-page.html?list=social" } },
    "condition": { "urlFilter": "||x.com", "resourceTypes": ["main_frame"] }
  },
  {
    "id": 10004,
    "priority": 1,
    "action": { "type": "redirect", "redirect": { "extensionPath": "/src/content/block-page.html?list=social" } },
    "condition": { "urlFilter": "||instagram.com", "resourceTypes": ["main_frame"] }
  },
  {
    "id": 10005,
    "priority": 1,
    "action": { "type": "redirect", "redirect": { "extensionPath": "/src/content/block-page.html?list=social" } },
    "condition": { "urlFilter": "||tiktok.com", "resourceTypes": ["main_frame"] }
  },
  {
    "id": 10006,
    "priority": 1,
    "action": { "type": "redirect", "redirect": { "extensionPath": "/src/content/block-page.html?list=social" } },
    "condition": { "urlFilter": "||reddit.com", "resourceTypes": ["main_frame"] }
  },
  {
    "id": 10007,
    "priority": 1,
    "action": { "type": "redirect", "redirect": { "extensionPath": "/src/content/block-page.html?list=social" } },
    "condition": { "urlFilter": "||snapchat.com", "resourceTypes": ["main_frame"] }
  },
  {
    "id": 10008,
    "priority": 1,
    "action": { "type": "redirect", "redirect": { "extensionPath": "/src/content/block-page.html?list=social" } },
    "condition": { "urlFilter": "||linkedin.com", "resourceTypes": ["main_frame"] }
  },
  {
    "id": 10009,
    "priority": 1,
    "action": { "type": "redirect", "redirect": { "extensionPath": "/src/content/block-page.html?list=social" } },
    "condition": { "urlFilter": "||pinterest.com", "resourceTypes": ["main_frame"] }
  },
  {
    "id": 10010,
    "priority": 1,
    "action": { "type": "redirect", "redirect": { "extensionPath": "/src/content/block-page.html?list=social" } },
    "condition": { "urlFilter": "||tumblr.com", "resourceTypes": ["main_frame"] }
  },
  {
    "id": 10011,
    "priority": 1,
    "action": { "type": "redirect", "redirect": { "extensionPath": "/src/content/block-page.html?list=social" } },
    "condition": { "urlFilter": "||threads.net", "resourceTypes": ["main_frame"] }
  },
  {
    "id": 10012,
    "priority": 1,
    "action": { "type": "redirect", "redirect": { "extensionPath": "/src/content/block-page.html?list=social" } },
    "condition": { "urlFilter": "||bsky.app", "resourceTypes": ["main_frame"] }
  },
  {
    "id": 10013,
    "priority": 1,
    "action": { "type": "redirect", "redirect": { "extensionPath": "/src/content/block-page.html?list=social" } },
    "condition": { "urlFilter": "||mastodon.social", "resourceTypes": ["main_frame"] }
  },
  {
    "id": 10014,
    "priority": 1,
    "action": { "type": "redirect", "redirect": { "extensionPath": "/src/content/block-page.html?list=social" } },
    "condition": { "urlFilter": "||youtube.com", "resourceTypes": ["main_frame"] }
  },
  {
    "id": 10015,
    "priority": 1,
    "action": { "type": "redirect", "redirect": { "extensionPath": "/src/content/block-page.html?list=social" } },
    "condition": { "urlFilter": "||twitch.tv", "resourceTypes": ["main_frame"] }
  }
]
```

#### Nuclear Option Implementation (Truly Unbypassable)

The nuclear option is the marquee security feature. It must resist user self-sabotage during active sessions.

**Tamper resistance layers:**

| Layer | Mechanism | What It Prevents |
|-------|-----------|-----------------|
| 1. DNR rules persist | `declarativeNetRequest` rules survive service worker termination | Blocking continues even if background goes to sleep |
| 2. No UI disable | During nuclear mode, the popup shows only a countdown -- no toggle, no settings, no remove buttons | User cannot change blocklist from the popup |
| 3. Alarm-based enforcement | `nuclear_check` alarm fires every minute, re-validates nuclear state integrity | If rules are somehow removed, they are immediately re-added |
| 4. Tamper hash | Nuclear state is protected by an HMAC (`crypto.subtle.sign`) using a derived key. Every alarm tick verifies the hash. If state is manually modified in storage, the hash will not match and the nuclear rules are re-applied from the snapshot. | User cannot modify nuclear state via DevTools storage editor |
| 5. Extension management detection | Listen for `chrome.management.onDisabled` (if `management` permission is optional) -- show warning. Without `management` permission: on service worker startup, if nuclear was active and rules are missing, re-apply immediately. | Detects and recovers from extension disable/re-enable |
| 6. Uninstall protection | `chrome.runtime.setUninstallURL()` points to a page explaining "You uninstalled during a nuclear session. Your accountability buddy has been notified." (social deterrent only -- Chrome allows uninstall always) | Social deterrent against uninstall |

**Nuclear state machine:**

```
INACTIVE --[user activates]--> ACTIVATING
ACTIVATING --[rules applied, hash computed]--> ACTIVE
ACTIVE --[alarm tick: time remaining > 0]--> ACTIVE (verify hash)
ACTIVE --[alarm tick: time remaining <= 0]--> EXPIRING
ACTIVE --[hash mismatch detected]--> REPAIRING --> ACTIVE (re-apply rules)
EXPIRING --[rules removed, state cleared]--> INACTIVE
```

**Implementation detail -- tamper hash:**

```javascript
async function computeNuclearHash(nuclearState) {
  const encoder = new TextEncoder();
  // Key is derived from extension ID + install date (unique per user, not guessable)
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(chrome.runtime.id + nuclearState.started_at),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const data = encoder.encode(JSON.stringify({
    active: nuclearState.active,
    ends_at: nuclearState.ends_at,
    blocklist_snapshot: nuclearState.blocklist_snapshot
  }));
  const signature = await crypto.subtle.sign('HMAC', keyMaterial, data);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
```

**What the nuclear option CANNOT prevent** (documented honestly):
- Uninstalling the Chrome extension (Chrome does not allow preventing this)
- Switching to a different browser entirely
- Using a different Chrome profile
- Booting into a different operating system

These are fundamental platform limitations. The nuclear option is the strongest possible blocker within Chrome extension constraints. The accountability buddy system provides social deterrence for the remaining bypass paths.

#### Whitelist Mode Implementation (Pro Only)

Whitelist mode inverts the blocking paradigm: block ALL websites except those on the whitelist.

```javascript
// Whitelist mode: single rule that blocks everything
const whitelistBlockAllRule = {
  id: 30000,
  priority: 1,
  action: {
    type: "redirect",
    redirect: {
      extensionPath: "/src/content/block-page.html?mode=whitelist"
    }
  },
  condition: {
    urlFilter: "*",
    resourceTypes: ["main_frame"],
    excludedRequestDomains: [
      // User's whitelisted domains
      "docs.google.com",
      "slack.com",
      "github.com",
      // Always-allowed domains (extension cannot function without these)
      "chrome.google.com",       // Chrome Web Store
      "accounts.google.com",     // OAuth
      "chrome-extension://",     // Extension pages
    ]
  }
};
```

The `excludedRequestDomains` field allows specifying domains that bypass the catch-all block rule. This is the most efficient approach -- one rule with exceptions rather than thousands of block rules.

#### Schedule-Based Rule Activation/Deactivation

Schedules are evaluated every minute via the `schedule_check` alarm:

```javascript
async function evaluateSchedules() {
  const now = new Date();
  const currentDay = now.getDay();       // 0=Sun, 6=Sat
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const { schedules } = await chrome.storage.local.get('schedules');

  for (const schedule of schedules) {
    if (!schedule.enabled) continue;

    const isActiveDay = schedule.days.includes(currentDay);
    const isActiveTime = currentTime >= schedule.start_time && currentTime < schedule.end_time;
    const shouldBeActive = isActiveDay && isActiveTime;

    const ruleTag = `schedule_${schedule.id}`;
    const isCurrentlyActive = await isRulesetActive(ruleTag);

    if (shouldBeActive && !isCurrentlyActive) {
      await activateScheduleRules(schedule);
    } else if (!shouldBeActive && isCurrentlyActive) {
      await deactivateScheduleRules(schedule);
    }
  }
}
```

---

### 5.7 Sync Architecture (Pro Only)

#### What Syncs

| Data Category | Sync Mechanism | Direction | Frequency |
|---------------|----------------|-----------|-----------|
| Settings (preferences, theme, timer config) | `chrome.storage.sync` | Bidirectional, automatic | Real-time (Chrome built-in) |
| Blocklist (custom sites, prebuilt toggles) | Custom server API | Bidirectional, explicit | Every 15 minutes + on change |
| Schedules | Custom server API | Bidirectional, explicit | Every 15 minutes + on change |
| Session history | Custom server API | Push only (upload) | Every 15 minutes |
| Stats (daily/weekly/monthly) | Custom server API | Push only (upload) | Every 15 minutes |
| Gamification (streaks, badges, score) | Custom server API | Bidirectional | Every 15 minutes + on change |
| Nuclear state | NOT synced | Local only | N/A (device-specific) |

**Why two sync mechanisms:**
- `chrome.storage.sync` is free, built-in, and real-time -- perfect for lightweight settings (max 100KB total, 8KB per item).
- Session history and stats can grow large (months of data). These require a server-side store with proper pagination and aggregation.

#### Sync Mechanism

```
Device A                     Sync Server                    Device B
   |                              |                              |
   |-- PUSH (changes) ---------->|                              |
   |                              |-- NOTIFY (via push) ------->|
   |                              |                              |
   |                              |<-- PULL (latest) -----------|
   |                              |                              |
   |<-- PULL (on open) ----------|                              |
   |                              |                              |
```

**Sync protocol:**

1. **Each device has a UUID** (`settings.sync_device_id`) generated on install.
2. **Every syncable data change** generates a change record: `{ device_id, timestamp, entity_type, entity_id, operation, data }`.
3. **Changes are queued locally** in a `sync_queue` storage key.
4. **Every 15 minutes** (or on explicit sync request), the queue is pushed to the server.
5. **On push**, the server responds with any changes from other devices since this device's last sync.
6. **On popup open**, a pull is triggered to ensure the UI is current.

#### Sync Frequency and Triggers

| Trigger | Action |
|---------|--------|
| Timer alarm (every 15 min) | Push pending queue, pull remote changes |
| Popup opened | Pull remote changes |
| Manual "Sync Now" button | Push pending queue, pull remote changes |
| Blocklist modified | Add to queue, push within 30 seconds |
| Settings changed | `chrome.storage.sync` handles automatically |
| Session completed | Add to queue, push on next cycle |
| Device comes online after offline | Push full queue immediately |

#### Conflict Resolution Strategy

**Last-write-wins with entity-level granularity:**

| Conflict Type | Resolution |
|---------------|------------|
| Same setting changed on two devices | Most recent `timestamp` wins |
| Same blocklist site modified on two devices | Most recent `timestamp` wins |
| Site added on one device, deleted on another | Delete wins (if delete is more recent) |
| Schedule modified on one device, deleted on another | Delete wins |
| Session history | No conflict -- append only, deduplicated by session ID |
| Stats | No conflict -- computed server-side from session history |
| Streak | Server computes canonical streak from all devices' session history |

**Conflict detection:**

```javascript
function resolveConflict(localChange, remoteChange) {
  // Entity-level comparison
  if (localChange.entity_id !== remoteChange.entity_id) {
    // Different entities -- no conflict
    return { apply: [localChange, remoteChange] };
  }

  // Same entity -- last write wins
  if (new Date(localChange.timestamp) > new Date(remoteChange.timestamp)) {
    return { apply: [localChange], discard: [remoteChange] };
  } else {
    return { apply: [remoteChange], discard: [localChange] };
  }
}
```

#### Offline Behavior and Queue

- **Offline detection:** `navigator.onLine` + server ping failure.
- **Queue grows locally:** All changes continue to be recorded in `sync_queue` in `chrome.storage.local`.
- **Queue max size:** 1,000 entries (oldest are dropped with a warning notification if exceeded -- indicates extended offline period).
- **On reconnect:** Full queue push. Server deduplicates by entity ID + timestamp.
- **Offline UI indicator:** Small "offline" badge on sync icon in popup. Tooltip: "Changes saved locally. Will sync when online."

---

### 5.8 API Requirements

Base URL: `https://api.focusmodeblocker.com/v1`

All endpoints require HTTPS. All request/response bodies are JSON. Authentication via Bearer token in the `Authorization` header.

#### Authentication & License

| Endpoint | Method | Purpose | Auth Required | Rate Limit |
|----------|--------|---------|---------------|------------|
| `POST /auth/register` | POST | Create account with email + password or Google OAuth | No | 5/min per IP |
| `POST /auth/login` | POST | Get JWT access token + refresh token | No | 10/min per IP |
| `POST /auth/refresh` | POST | Refresh expired access token | Refresh token | 30/min per user |
| `POST /auth/google` | POST | OAuth2 exchange (Google ID token -> JWT) | No | 10/min per IP |
| `GET /auth/me` | GET | Get current user profile and subscription status | Bearer JWT | 60/min per user |
| `POST /license/verify` | POST | Verify license key validity, return tier + expiry | Bearer JWT | 30/min per user |
| `POST /license/activate` | POST | Activate license on a device (device_id in body) | Bearer JWT | 10/min per user |
| `POST /license/deactivate` | POST | Deactivate license on a device | Bearer JWT | 10/min per user |
| `GET /license/devices` | GET | List all devices with active license | Bearer JWT | 30/min per user |

**Request: `POST /license/verify`**
```json
{
  "license_key": "FM-PRO-XXXX-XXXX-XXXX",
  "device_id": "uuid-v4",
  "extension_version": "1.0.0",
  "chrome_version": "122.0"
}
```

**Response: `POST /license/verify`**
```json
{
  "valid": true,
  "tier": "pro",
  "plan_type": "annual",
  "expires_at": "2027-02-10T00:00:00Z",
  "features": {
    "max_blocklist": -1,
    "max_schedules": -1,
    "max_nuclear_hours": 24,
    "sync_enabled": true,
    "ai_enabled": true,
    "calendar_enabled": true,
    "whitelist_mode": true,
    "wildcard_blocking": true,
    "custom_block_page": true,
    "export_enabled": true,
    "max_buddies": -1,
    "max_sounds": -1
  },
  "next_check_at": "2026-02-11T00:00:00Z"
}
```

#### Sync Endpoints

| Endpoint | Method | Purpose | Auth Required | Rate Limit |
|----------|--------|---------|---------------|------------|
| `POST /sync/push` | POST | Push local changes to server | Bearer JWT (Pro) | 60/min per user |
| `GET /sync/pull` | GET | Pull changes since last sync timestamp | Bearer JWT (Pro) | 60/min per user |
| `GET /sync/full` | GET | Full data download (initial sync or recovery) | Bearer JWT (Pro) | 5/min per user |
| `DELETE /sync/device/{device_id}` | DELETE | Remove a device's sync data | Bearer JWT (Pro) | 10/min per user |

**Request: `POST /sync/push`**
```json
{
  "device_id": "uuid-v4",
  "changes": [
    {
      "entity_type": "blocklist_site",
      "entity_id": "uuid-v4",
      "operation": "create",
      "timestamp": "2026-02-10T09:00:00Z",
      "data": {
        "pattern": "reddit.com",
        "type": "domain",
        "enabled": true
      }
    },
    {
      "entity_type": "session",
      "entity_id": "uuid-v4",
      "operation": "create",
      "timestamp": "2026-02-10T09:25:00Z",
      "data": {
        "type": "focus",
        "duration_minutes": 25,
        "completed_at": "2026-02-10T09:25:00Z",
        "status": "completed",
        "distraction_attempts": 7,
        "focus_score": 82
      }
    }
  ],
  "last_sync_at": "2026-02-10T08:45:00Z"
}
```

**Response: `POST /sync/push`**
```json
{
  "accepted": 2,
  "conflicts": 0,
  "remote_changes": [
    {
      "entity_type": "blocklist_site",
      "entity_id": "uuid-other",
      "operation": "create",
      "timestamp": "2026-02-10T08:50:00Z",
      "data": { "pattern": "youtube.com", "type": "domain", "enabled": true },
      "source_device_id": "uuid-other-device"
    }
  ]
}
```

#### AI Recommendations Endpoint

| Endpoint | Method | Purpose | Auth Required | Rate Limit |
|----------|--------|---------|---------------|------------|
| `POST /ai/recommendations` | POST | Get personalized focus recommendations based on usage patterns | Bearer JWT (Pro) | 10/min per user |
| `GET /ai/insights/{period}` | GET | Get AI-generated insights for a time period (week/month) | Bearer JWT (Pro) | 10/min per user |

**Request: `POST /ai/recommendations`**
```json
{
  "stats": {
    "daily_focus_minutes": [180, 220, 45, 195, 210, 120, 0],
    "daily_distraction_counts": [23, 15, 67, 18, 12, 45, 0],
    "top_distractions": ["reddit.com", "twitter.com", "youtube.com"],
    "session_times": ["09:00", "10:30", "14:00", "09:15", "11:00", "15:30"],
    "session_durations": [25, 45, 25, 50, 25, 25],
    "streak_length": 5,
    "focus_score": 72
  },
  "context": {
    "day_of_week": 1,
    "current_time": "09:00",
    "active_schedules": ["work_hours"]
  }
}
```

**Response: `POST /ai/recommendations`**
```json
{
  "recommendations": [
    {
      "type": "optimal_time",
      "title": "Your Peak Focus Window",
      "message": "You are most focused between 9:00 AM and 11:30 AM on weekdays. Consider scheduling your most important work during this window.",
      "confidence": 0.87
    },
    {
      "type": "distraction_pattern",
      "title": "Wednesday Slump",
      "message": "Your distraction attempts spike on Wednesdays (67 vs average 22). Consider extending your nuclear option on Wednesdays.",
      "confidence": 0.92
    },
    {
      "type": "session_suggestion",
      "title": "Try Longer Sessions",
      "message": "Your 45-minute sessions have 30% fewer distractions than your 25-minute sessions. Consider switching to 45/10 Pomodoro cycles.",
      "confidence": 0.78
    }
  ],
  "generated_at": "2026-02-10T09:00:00Z"
}
```

#### Analytics / Telemetry Endpoint

| Endpoint | Method | Purpose | Auth Required | Rate Limit |
|----------|--------|---------|---------------|------------|
| `POST /analytics/event` | POST | Track anonymous product events (installs, upgrades, feature usage) | API Key | 120/min per device |
| `POST /analytics/crash` | POST | Report extension errors/crashes | API Key | 30/min per device |

**Events tracked (anonymous, no PII):**
- `extension_installed` -- with source (CWS, direct link, referral)
- `trial_started` / `trial_expired` / `trial_converted`
- `session_completed` -- with duration and type (no URL data)
- `feature_used` -- feature name only (e.g., "nuclear_option", "ambient_sounds")
- `upgrade_prompt_shown` / `upgrade_prompt_clicked` / `upgrade_prompt_dismissed`
- `subscription_started` / `subscription_cancelled` / `subscription_renewed`
- `error_occurred` -- error type and stack trace (no user data)

**Privacy commitment:** Analytics never include URLs, site names, or any browsing data. Only product usage events with anonymous device IDs.

#### Team Management Endpoints

| Endpoint | Method | Purpose | Auth Required | Rate Limit |
|----------|--------|---------|---------------|------------|
| `POST /teams` | POST | Create a team | Bearer JWT (Team admin) | 5/min per user |
| `GET /teams/{team_id}` | GET | Get team details | Bearer JWT (Team member) | 60/min per user |
| `PUT /teams/{team_id}` | PUT | Update team settings | Bearer JWT (Team admin) | 30/min per user |
| `POST /teams/{team_id}/members` | POST | Invite member (by email) | Bearer JWT (Team admin) | 30/min per user |
| `DELETE /teams/{team_id}/members/{user_id}` | DELETE | Remove member | Bearer JWT (Team admin) | 30/min per user |
| `GET /teams/{team_id}/blocklists` | GET | Get shared blocklists | Bearer JWT (Team member) | 60/min per user |
| `POST /teams/{team_id}/blocklists` | POST | Create shared blocklist | Bearer JWT (Team admin) | 30/min per user |
| `GET /teams/{team_id}/sessions` | GET | Get team focus sessions (active + history) | Bearer JWT (Team member) | 60/min per user |
| `POST /teams/{team_id}/sessions` | POST | Start a team focus session | Bearer JWT (Team member) | 30/min per user |
| `GET /teams/{team_id}/leaderboard` | GET | Get team leaderboard (weekly) | Bearer JWT (Team member) | 60/min per user |
| `GET /teams/{team_id}/analytics` | GET | Get team analytics dashboard data | Bearer JWT (Team admin) | 30/min per user |

#### Payment / Subscription Endpoints

| Endpoint | Method | Purpose | Auth Required | Rate Limit |
|----------|--------|---------|---------------|------------|
| `POST /payments/checkout` | POST | Create Stripe Checkout session | Bearer JWT | 10/min per user |
| `POST /payments/webhook` | POST | Stripe webhook handler | Stripe signature | 1000/min (Stripe) |
| `GET /payments/subscription` | GET | Get current subscription details | Bearer JWT | 60/min per user |
| `POST /payments/cancel` | POST | Cancel subscription (end of billing period) | Bearer JWT | 5/min per user |
| `POST /payments/reactivate` | POST | Reactivate cancelled subscription | Bearer JWT | 5/min per user |
| `GET /payments/invoices` | GET | List past invoices | Bearer JWT | 30/min per user |
| `GET /payments/invoices/{id}/pdf` | GET | Download invoice PDF | Bearer JWT | 10/min per user |

---

### 5.9 Third-Party Dependencies

#### NPM Packages (Build-Time & Runtime)

| Package | Version | Purpose | Size Impact | License |
|---------|---------|---------|-------------|---------|
| `uuid` | ^10.0.0 | Generate UUIDs for sessions, sites, schedules | 3KB (tree-shaken) | MIT |
| `idb-keyval` | ^6.2.1 | Simplified IndexedDB wrapper for large data caching | 1.2KB | Apache-2.0 |
| `date-fns` | ^4.1.0 | Date manipulation for schedules, stats, formatting | 15KB (tree-shaken) | MIT |

**Deliberate non-dependencies:**
- No UI framework (React, Vue, etc.) -- popup is vanilla JS for minimal bundle size
- No CSS framework -- custom CSS for full design control
- No state management library -- simple pub/sub pattern
- No HTTP client library -- native `fetch` API
- No crypto library -- native `crypto.subtle` API

#### External Services

| Service | Purpose | Tier | Cost Estimate |
|---------|---------|------|---------------|
| **Stripe** | Payment processing, subscription management, invoicing | All paid tiers | 2.9% + $0.30 per transaction |
| **Supabase** (or equivalent) | Server-side database, authentication, serverless functions, real-time subscriptions | Pro/Team (sync, auth) | Free tier to start; ~$25/mo at scale |
| **Vercel** (or equivalent) | API hosting (serverless functions), edge network | All (API) | Free tier to start; ~$20/mo at scale |
| **OpenAI API** (gpt-4o-mini) | AI focus recommendations, pattern analysis | Pro | ~$0.002 per recommendation (est. $50/mo at 1000 Pro users) |
| **Google Calendar API** | Read user calendar events for auto-focus triggers | Pro | Free (within Google API quotas) |
| **Firebase Cloud Messaging** | Push notifications for sync updates across devices | Pro | Free tier (sufficient) |
| **Sentry** | Error tracking and crash reporting | All | Free tier (10K events/mo); $26/mo for Growth |
| **PostHog** (or Mixpanel) | Product analytics (anonymous events) | All | Free tier (1M events/mo); self-hosted option |

#### Build Tools

| Tool | Version | Purpose |
|------|---------|---------|
| **Vite** | ^6.1.0 | Build tool and bundler. Fast HMR during development. Outputs optimized production bundle with tree-shaking, minification, and code splitting. |
| **TypeScript** | ^5.7.0 | Type safety across the codebase. Compiled to JS during build. |
| **Vitest** | ^3.0.0 | Unit and integration testing framework (Vite-native, fast). |
| **Playwright** | ^1.50.0 | End-to-end testing for extension in real Chrome browser. |
| **ESLint** | ^9.0.0 | Code linting with flat config. |
| **Prettier** | ^3.4.0 | Code formatting. |
| **CRXJS** | ^2.0.0-beta | Vite plugin for Chrome extension development. Handles manifest processing, HMR in extension context, and CRX packaging. |
| **web-ext** | ^8.0.0 | Mozilla's extension development tool -- used for packaging and validation (works with Chrome extensions too). |

**Build pipeline:**

```
TypeScript source
     |
     v
Vite + CRXJS plugin
     |
     v
Tree-shaken, minified JS bundles
     |
     v
dist/
  manifest.json
  src/
    background/service-worker.js     (single bundle, < 80KB)
    popup/popup.html + popup.js      (< 150KB total)
    content/detector.js              (< 2KB)
    content/block-page.html/js/css   (< 30KB total)
    content/tracker.js               (< 5KB)
    rules/prebuilt-social.json
    rules/prebuilt-news.json
    assets/icons/
    assets/sounds/                   (3 MP3s, ~500KB each)
    assets/images/
    assets/quotes.json
```

#### Testing Framework

| Layer | Tool | Scope |
|-------|------|-------|
| Unit tests | Vitest | Storage manager, blocking engine, timer engine, stats aggregator, gamification logic, nuclear controller, sync conflict resolution |
| Integration tests | Vitest + chrome-types mock | Message passing, alarm handling, rule creation/deletion, license verification flow |
| E2E tests | Playwright | Full extension installation, blocking a site, completing a session, nuclear option, trial flow, upgrade flow |
| Manual testing | Chrome DevTools | Extension popup, content script injection, service worker lifecycle |

---

### 5.10 Security Considerations

#### Content Security Policy

The manifest declares a strict CSP for extension pages:

```
script-src 'self'; object-src 'self'; style-src 'self' 'unsafe-inline';
```

| Directive | Value | Reason |
|-----------|-------|--------|
| `script-src` | `'self'` | Only extension-bundled scripts may execute. No inline scripts, no eval, no remote scripts. Prevents XSS via injected scripts. |
| `object-src` | `'self'` | No Flash/plugins. |
| `style-src` | `'self' 'unsafe-inline'` | Allow inline styles for dynamic UI rendering in popup and block page. Bundled CSS files preferred; inline styles used only for dynamic theming. |

**Block page CSP:** The block page is an extension page (loaded via `chrome-extension://` URL), so the extension CSP applies automatically. No remote resources are loaded on the block page.

#### Data Encryption

| Data State | Protection | Implementation |
|------------|------------|----------------|
| At rest (local) | Chrome's built-in storage encryption | `chrome.storage.local` is encrypted by the OS-level Chrome profile encryption. No additional encryption needed for free-tier local-only data. |
| At rest (sensitive fields) | AES-256-GCM via `crypto.subtle` | License key, sync tokens, and API credentials stored in storage are encrypted with a key derived from the extension ID + install timestamp. |
| In transit (API) | TLS 1.3 | All API endpoints are HTTPS-only. HSTS headers on server. Certificate pinning not needed (Chrome handles CA validation). |
| In transit (sync) | TLS 1.3 + payload encryption | Sync payloads are encrypted client-side before transmission using the user's license-derived key. Server stores encrypted blobs. |

**License key storage:**

```javascript
async function encryptLicenseKey(licenseKey) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(chrome.runtime.id),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  const derivedKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: encoder.encode('fm-license-salt'), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    derivedKey,
    encoder.encode(licenseKey)
  );
  return { iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) };
}
```

#### XSS Prevention in Block Page

| Threat | Mitigation |
|--------|------------|
| URL parameter injection (the `?url=` param on the block page) | All URL parameters are sanitized via `encodeURIComponent` / `decodeURIComponent` and rendered as `textContent`, never as `innerHTML`. |
| Custom block page messages (Pro) | User-entered messages are stored as plain text. Rendered via `textContent`. HTML entities are escaped if rendered in any HTML context. |
| Motivational quotes | Quotes are loaded from a static bundled JSON file. No user-generated content in the quotes array. |
| Dynamic content from service worker | All data received via `chrome.runtime.sendMessage` is treated as untrusted. Numbers are validated as numbers. Strings are rendered via `textContent`. |

**Block page rendering rule:** No `innerHTML`, `document.write`, or `eval` is ever used in the block page. All dynamic content is set via `textContent` or DOM API property assignment.

#### Nuclear Option Tamper Resistance

See Section 5.6 for the full nuclear tamper resistance implementation. Summary:

1. HMAC integrity hash on nuclear state prevents storage modification via DevTools.
2. Alarm-based enforcement re-applies rules if they are removed.
3. DNR rules persist independently of service worker lifecycle.
4. No UI controls are available during active nuclear sessions.
5. Uninstall URL provides social deterrent.

#### License Validation Security

| Threat | Mitigation |
|--------|------------|
| License key sharing | Server limits each license to 5 concurrent device activations. Each device registers with a unique `device_id`. Exceeding 5 devices requires deactivating one. |
| License key spoofing (modifying storage to fake Pro) | License verification checks a server-signed JWT. The extension validates the JWT signature locally using the server's public key. Cannot be forged without the server's private key. |
| Replay attacks on license verification | Each verification response includes a `nonce` and `expires_at`. The extension rejects stale responses. |
| Offline license tampering | The `subscription` object in storage includes a `verification_signature` field -- a server-signed hash of the tier + expiry. On service worker startup, this signature is validated before trusting the local subscription state. |
| DevTools storage manipulation | The license manager re-verifies with the server if the local `subscription.last_verified_at` is more than 1 hour old. Any storage tampering is overwritten on the next verification. |
| Extension cracking (modified .crx) | Chrome Web Store distribution includes Google's signing. Sideloaded versions show a warning banner. CRX signing prevents modification of distributed packages. |

**Defense-in-depth principle:** We do NOT try to make the extension crack-proof (impossible with client-side code). Instead, we make it inconvenient to crack and convenient to pay. The 7-day offline grace period and generous free tier reduce the incentive to pirate.

**Anti-piracy philosophy:** Focus on making the product good enough that users want to pay, not on punishing those who do not. Aggressive DRM alienates legitimate customers. Our approach:
- Server verification every 24 hours when online.
- 7-day offline grace period (generous).
- 5-device limit per license (generous for an individual).
- No hardware fingerprinting or invasive device tracking.
- Clear, respectful messaging when license expires: "Your Pro features are paused. Renew to reactivate, or continue with the free tier."

---

## SECTION 6: MONETIZATION INTEGRATION

---

### 6.1 Pricing Table

| Tier | Monthly | Annual | Annual Savings | Lifetime | Target User |
|------|---------|--------|----------------|----------|-------------|
| **Free** | $0 | $0 | -- | -- | Casual users, students, try-before-buy |
| **Pro** | $4.99/mo | $35.88/yr ($2.99/mo) | 40% off monthly | $49.99 (one-time) | Knowledge workers, freelancers, ADHD users |
| **Team** | $4.99/user/mo | $3.99/user/mo (billed annually) | 20% off monthly | -- | Remote teams, agencies, startups (min 5 users) |

**Per-tier feature summary:**

| Feature | Free | Pro | Team |
|---------|:----:|:---:|:----:|
| Blocked sites | 10 | Unlimited | Unlimited + shared |
| Pre-built lists | 2 | 6+ | All + custom shared |
| Wildcard/pattern blocking | -- | Yes | Yes |
| Whitelist mode | -- | Yes | Yes |
| Schedules | 1 | Unlimited | Unlimited + team |
| Nuclear option | 1 hour max | 24 hours max | 24 hours + admin-enforced |
| Custom block page | Default only | Full customization | Branded team pages |
| Pomodoro timer | 25/5 fixed | Any duration (1-240 min) | Any duration |
| Session history | 7 days | Full history | Full + team view |
| Weekly/monthly reports | -- | Yes | Yes + team reports |
| Focus Score breakdown | Score only | Full breakdown | Full + team |
| Streak recovery | -- | Yes (1 miss/week) | Yes |
| Cross-device sync | -- | Yes | Yes + admin dashboard |
| Calendar integration | -- | Yes | Yes + shared calendars |
| AI recommendations | -- | Yes | Yes |
| Ambient sounds | 3 | 15+ with mixing | Full + team playlists |
| Accountability buddies | 1 | Unlimited | Full team |
| Exportable analytics | -- | CSV, PDF | CSV, PDF |
| Context-aware profiles | -- | Yes | Yes + admin-defined |
| API access | -- | -- | Yes |

---

### 6.2 Payment Integration

#### Payment Provider: Stripe (Recommended)

**Why Stripe:**

| Criteria | Stripe | ExtensionPay | Paddle | LemonSqueezy |
|----------|--------|-------------|--------|--------------|
| **Chrome extension compatibility** | Excellent (Checkout Session link opens in new tab) | Purpose-built for extensions (iframe in popup) | Good (external checkout) | Good (external checkout) |
| **Subscription management** | Full (billing portal, invoices, proration) | Limited (basic subscriptions) | Full | Full |
| **Global payment methods** | 135+ currencies, all major methods | USD only, cards only | 200+ countries, tax handling | 130+ countries |
| **Team/multi-seat billing** | Full (metered + per-seat) | Not supported | Limited | Not supported |
| **Tax handling** | Stripe Tax (add-on) | None | Built-in (Merchant of Record) | Built-in (MoR) |
| **Pricing** | 2.9% + $0.30 | 5% of revenue | 5% + $0.50 | 5% + $0.50 |
| **Developer experience** | Excellent docs, SDKs, webhooks | Simple (3-line integration) | Good | Good |
| **Lifetime deals** | Supported (one-time payment) | Supported | Supported | Supported |

**Recommendation:** Use **Stripe** as the primary payment provider. It offers the best combination of subscription management, global reach, team billing support, and developer experience. The 2.9% + $0.30 fee is the lowest of the options.

**Alternative for MVP:** If speed to market is critical, start with **ExtensionPay** (3-line integration, purpose-built for extensions) and migrate to Stripe once revenue exceeds $500/mo MRR. ExtensionPay's 5% fee becomes meaningful at scale.

#### Checkout Flow

**In-extension initiation, external payment:**

```
User clicks "Upgrade to Pro" in popup
        |
        v
Popup sends START_CHECKOUT message to service worker
        |
        v
Service worker calls POST /payments/checkout on our API
        |
        v
Our API creates a Stripe Checkout Session with:
  - Price ID for selected plan (monthly/annual/lifetime)
  - Customer email (if known)
  - success_url: https://focusmodeblocker.com/checkout/success?session_id={CHECKOUT_SESSION_ID}
  - cancel_url: https://focusmodeblocker.com/checkout/cancel
  - metadata: { device_id, extension_version }
        |
        v
Service worker opens Stripe Checkout URL in new tab
        |
        v
User completes payment on Stripe-hosted page
        |
        v
Stripe sends webhook to POST /payments/webhook
        |
        v
Our API:
  1. Validates Stripe signature
  2. Creates/updates user record
  3. Generates license key
  4. Stores subscription details
        |
        v
Success page (our domain) shows license key + "Return to extension" button
        |
        v
Extension detects license via:
  Option A: Success page communicates via chrome.runtime.sendMessage (if page has extension ID)
  Option B: Service worker polls /license/verify every 30 seconds during checkout flow
  Option C: User manually enters license key in popup
        |
        v
Extension activates Pro features immediately
```

**Why external checkout (not in-popup):**
- Stripe Checkout handles PCI compliance -- we never touch card data.
- Users trust the Stripe-branded checkout page.
- Supports Apple Pay, Google Pay, and all Stripe payment methods.
- No need to build a custom payment form.
- Chrome Web Store policy allows external payment for non-digital-goods (our features qualify).

#### License Key Generation and Validation

**License key format:** `FM-PRO-XXXX-XXXX-XXXX` (where X = alphanumeric, 12 random characters)

**Generation (server-side):**
```javascript
function generateLicenseKey(tier) {
  const prefix = tier === 'team' ? 'FM-TEAM' : 'FM-PRO';
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes ambiguous: I,O,0,1
  let key = '';
  for (let i = 0; i < 12; i++) {
    key += chars[crypto.randomInt(chars.length)];
    if (i === 3 || i === 7) key += '-';
  }
  return `${prefix}-${key}`;
}
// Example: FM-PRO-H7KN-XP3Q-RVML
```

**Validation flow (client-side):**
1. Extension sends `POST /license/verify` with license key + device ID.
2. Server validates: key exists, not revoked, device count < 5, subscription active.
3. Server returns signed JWT with tier, features, and expiry.
4. Extension stores JWT and validates its signature locally using the server's public key.
5. On subsequent startups, extension validates the cached JWT. If expired or > 24 hours old, re-verifies with server.

#### Subscription Management

| Action | Implementation |
|--------|---------------|
| **Upgrade (Free to Pro)** | Stripe Checkout Session -> new subscription created |
| **Upgrade (Monthly to Annual)** | Stripe Billing Portal -> plan change with proration |
| **Upgrade (Pro to Team)** | New Stripe Checkout with Team price ID -> old subscription cancelled with proration credit |
| **Downgrade (Pro to Free)** | Stripe Billing Portal -> cancel at period end. Pro features remain until `expires_at`. |
| **Cancel** | Stripe Billing Portal -> subscription cancelled at period end. Extension shows "Pro until {date}" |
| **Reactivate** | Stripe Billing Portal -> reactivate cancelled subscription (if within billing period) |
| **Payment failure** | Stripe automatically retries 3 times over 2 weeks. Extension enters "grace" status. After all retries fail, downgrade to free. |

**Stripe Billing Portal:**
Users access their subscription management via a link in the extension popup (Settings > Manage Subscription). This opens the Stripe Customer Portal (hosted by Stripe) where they can:
- Update payment method
- Switch between monthly and annual
- View invoices
- Cancel subscription

#### Refund Handling

- **Policy:** 7-day money-back guarantee from first payment (not from trial end).
- **Process:** User emails support or requests via Stripe Customer Portal. We issue a full refund via Stripe Refund API.
- **Extension behavior on refund:** Webhook notifies our API. License is revoked. Extension downgrades to free on next verification (within 24 hours or on next popup open).
- **Messaging:** "Your refund has been processed. Your Pro features will remain active until {date}. You can continue using Focus Mode's free features."

#### Receipt / Invoice Generation

- Stripe automatically generates receipts for all payments and emails them to the customer.
- Invoice PDFs are available via `GET /payments/invoices/{id}/pdf` (proxied from Stripe).
- Invoices include: extension name, billing period, amount, tax (if applicable), license key.
- Team invoices include per-seat breakdown.

---

### 6.3 License Verification

#### How the Extension Checks Pro Status

```
Service worker startup
        |
        v
Read subscription from chrome.storage.local
        |
        v
Is subscription.status === "active" or "trial"?
    |                           |
   YES                         NO --> Free tier enforced
    |
    v
Is subscription.last_verified_at > 24 hours ago?
    |                           |
   NO (recent)                 YES (stale)
    |                           |
    v                           v
Validate cached JWT         Call POST /license/verify
signature locally               |
    |                           v
    v                      Server reachable?
JWT valid?                  |              |
    |        |             YES             NO
   YES      NO              |              |
    |        |              v               v
    v        v         Update local    Is grace period
Pro tier   Force        cache          still valid?
enforced   server         |             |          |
           verify        Pro           YES         NO
                        enforced        |           |
                                       Pro         Free
                                      enforced    enforced
```

#### Server-Side vs Client-Side Verification

| Check | Location | Purpose |
|-------|----------|---------|
| JWT signature validation | Client (extension) | Fast, offline-capable check that the cached license response was issued by our server. Uses the server's embedded public key. |
| License key validity | Server | Authoritative check: is the key active, not revoked, within device limits? |
| Subscription status | Server (via Stripe webhook) | Real-time subscription status (active, cancelled, past_due, expired). |
| Feature entitlement | Client (from cached JWT) | Which features are enabled. Derived from the `features` object in the verification response. |

#### Offline Grace Period

- **Duration:** 7 days from last successful server verification.
- **Behavior during grace:** Full Pro features remain active. A subtle indicator shows "Last verified {N} days ago" in settings.
- **At grace expiration:** Pro features are disabled. Message: "We haven't been able to verify your subscription for 7 days. Please connect to the internet to reactivate Pro features."
- **On reconnect:** Automatic verification. If subscription is still active, Pro is immediately restored.
- **Grace period storage:** `subscription.grace_period_ends_at` is set to `last_verified_at + 7 days`. Checked on every service worker startup.

#### License Caching Strategy

```javascript
const LICENSE_CACHE = {
  // Stored in chrome.storage.local
  "subscription": {
    "tier": "pro",
    "status": "active",
    "expires_at": "2027-02-10T00:00:00Z",
    "last_verified_at": "2026-02-10T09:00:00Z",
    "cached_jwt": "eyJhbGciOiJFUzI1NiJ9...",  // Server-signed JWT
    "verification_signature": "server-signed-hash-of-tier-expiry",
    "features": {                               // Denormalized for fast access
      "max_blocklist": -1,
      "max_schedules": -1,
      "max_nuclear_hours": 24,
      // ... (full feature set from server)
    }
  }
};
```

**Cache invalidation triggers:**
1. 24-hour periodic alarm (`license_verify`).
2. Popup opened and cache is > 1 hour old.
3. User explicitly clicks "Refresh License" in settings.
4. Stripe webhook updates subscription status (pushed via sync if online).

#### Anti-Piracy Measures

| Measure | Implementation | Aggressiveness |
|---------|----------------|---------------|
| Server-signed JWT | License response is a JWT signed with ES256. Extension embeds the public key. Cannot be forged. | Low -- standard practice. |
| Device ID tracking | Each device registers with the server. Max 5 devices per license. | Low -- reasonable limit. |
| Periodic re-verification | Every 24 hours. | Low -- barely noticeable. |
| Obfuscated license check | The license validation code path is not in a single easily-patchable function. Multiple independent checks throughout the codebase verify tier status. | Medium -- adds inconvenience to crackers. |
| Feature-level server validation | Some Pro features (AI recommendations, sync) require server-side processing that cannot work without a valid license. | Medium -- inherent to architecture. |
| No client-side kill switch | We do NOT disable the extension or show threatening messages. If license fails, we simply enforce free-tier limits gracefully. | Low -- respectful. |

---

### 6.4 Trial Strategy

#### Trial Length

**7 days of full Pro access.** Starts automatically on install. No credit card required.

#### Trial Features

All Pro features are unlocked during the trial:
- Unlimited blocklist sites
- All 6+ pre-built lists
- Wildcard/pattern blocking
- Whitelist mode
- Unlimited schedules
- 24-hour nuclear option
- Custom block page
- Custom timer durations (1-240 min)
- Full session history
- Weekly report (generated at end of week 1)
- Focus score breakdown
- Streak recovery
- 15+ ambient sounds with mixing
- Unlimited buddies
- Exportable analytics
- Context-aware profiles

**Not included in trial:** Cross-device sync (requires account creation -- offered as bonus incentive during trial), Calendar integration (requires Google OAuth -- offered on day 3), AI recommendations (requires 7 days of data -- teased on day 6).

#### Smart Onboarding During Trial

**Day 0 (Install): 4-step guided setup (< 2 minutes)**

```
Step 1: "What distracts you most?"
  [Social Media] [News] [Video] [All of the above]
  --> Auto-enables relevant pre-built lists + suggests 3-5 specific sites
  --> Label: "Unlimited sites during your Pro trial"

Step 2: "When do you need focus?"
  [Work hours (9-5)] [Custom schedule] [All day] [Skip]
  --> Creates schedule
  --> Label: "Unlimited schedules during your Pro trial"

Step 3: "Make your block page yours"
  [Show preview of 3 block page styles]
  --> User picks one
  --> Label: "Custom block pages -- a Pro feature"

Step 4: "Pick your focus soundtrack"
  [Rain] [White Noise] [Lo-Fi] [Cafe] [Forest] [Ocean]
  --> Play samples, user selects
  --> Label: "15+ sounds during your Pro trial"

[Start Your First Focus Session]
```

**Key principle:** Every onboarding step uses a Pro feature. By the end of setup, the user has configured 4 Pro features that they will lose in 7 days. Maximum loss aversion.

#### Trial-to-Paid Messaging Cadence

| Day | Trigger | Message | Channel | Aggressiveness |
|-----|---------|---------|---------|---------------|
| 0 | Install | "Welcome! You have 7 days of Pro access. All features are unlocked." | Popup banner | None -- pure welcome |
| 1 | First session completed | "Great first session! You blocked {N} distractions. Explore Focus Score in settings." | Post-session card | None -- feature discovery |
| 2 | Second session | No message. Pure value delivery. | -- | None |
| 3 | Third session | "Pro tip: Connect your Google Calendar to auto-start focus during deep work blocks." | Popup tooltip | Soft -- feature suggestion |
| 4 | Fourth session | Post-session card shows 1 blurred Pro insight (simulating free experience): "Preview of free tier: Your peak focus time is [BLURRED]. With Pro, you always see this." | Post-session card | Soft -- preview of downgrade |
| 5 | Day 5 alarm | "Your Pro trial ends in 2 days. You've completed {N} sessions and blocked {N} distractions." | Notification | Medium -- time pressure |
| 5 | Popup open | Popup shows yellow banner: "Pro trial: 2 days left. You've used {N} Pro features." | Popup banner | Medium |
| 6 | Day 6 alarm | "Tomorrow is your last day of Pro. Here's what you'll keep vs lose:" [feature comparison] | Full popup panel | Medium-High |
| 6 | Popup open | "24 hours left" badge on popup. Link to feature comparison. | Popup badge + panel | Medium-High |
| 7 | Day 7 alarm (morning) | "Your Pro trial ends today. Keep your {N} blocked sites, custom block page, and {N}-day streak protected. [Upgrade for $2.99/mo]" | Notification + popup takeover | High (but respectful) |
| 7 | Trial expiration | Pro features downgrade gracefully. Blocklist sites beyond 10 are disabled (not deleted). Custom block page reverts to default. Sounds revert to 3 free. Schedules beyond 1 are disabled. Message: "Your trial has ended. Your setup is saved -- upgrade anytime to restore it." | Popup panel | High (loss frame) |
| 8-14 | Post-trial daily | No messages. Only the standard free-tier experience with subtle "PRO" lock icons on disabled features. | Popup UI | Low |
| 14 | 1 week post-trial | "You've been using Focus Mode for 2 weeks! Your data shows... [blurred weekly report preview]. Unlock your full report with Pro." | Notification | Medium |
| 30 | 1 month post-trial | Monthly summary: "{N} hours focused, {N} distractions blocked. [Monthly report -- Pro feature]." Footer: "Go Pro" link. | Notification | Low |

**Rate limiting:** Maximum 1 upgrade prompt per day. Maximum 3 notifications per week. Never interrupt an active focus session. Never show upgrade prompts in the first 2 days.

#### Trial Expiration Experience

**Graceful degradation, not punishment:**

| Feature | During Trial | After Trial | User Experience |
|---------|-------------|-------------|-----------------|
| Blocklist sites | Unlimited | Sites 1-10 stay active. Sites 11+ are disabled (greyed out, not deleted). | "3 sites disabled. Upgrade to re-enable." |
| Pre-built lists | All 6+ | Only Social Media + News. Others disabled. | Lock icon on disabled lists. |
| Schedules | Unlimited | Only the first schedule stays active. Others disabled. | Lock icon on disabled schedules. |
| Custom block page | Active | Reverts to default. Custom settings saved but not applied. | "Custom page saved. Upgrade to restore." |
| Timer durations | Any | Fixed 25/5. | Settings show Pro durations greyed out. |
| Reports | Full | Blurred previews only. | Standard "Preview" paywall. |
| Sounds | 15+ | 3 free sounds. | Lock icon on Pro sounds. |
| Streak recovery | Active | Disabled. Streak continues but no recovery. | "Streak recovery is a Pro feature." |
| Session history | Full | Truncated to 7 days. Older data preserved but hidden. | "Full history available with Pro." |

**Critical:** No data is ever deleted on trial expiration. All settings, history, and configurations are preserved. This maximizes re-upgrade potential and respects the user's investment.

#### Re-Trial Policy

- **No second trial.** `onboarding.trial_used = true` is permanent.
- **Exception:** If the user creates a brand-new account (different email) and installs fresh, they technically get a new trial. We do not aggressively prevent this -- it means they are interested enough to try again.
- **Post-trial incentive:** On day 30 post-trial, offer a one-time "Welcome Back" discount: "Get 30% off your first 3 months of Pro. $3.49/mo instead of $4.99." This is a one-time offer with a 48-hour window.

---

### 6.5 Launch Pricing Ladder

| Phase | Timing | Monthly Price | Annual Price | Lifetime | Rationale |
|-------|--------|---------------|--------------|----------|-----------|
| **Beta** | Weeks 1-4 | $0 (all Pro free) | $0 | -- | Build user base. Collect feedback. Earn Chrome Web Store reviews. Target 500 installs. No payment infrastructure needed yet. |
| **Launch (Founding Members)** | Weeks 5-8 | $2.99/mo | $19.99/yr ($1.67/mo) | $29.99 | Create urgency: "Founding member pricing -- locked for life. Available to first 500 subscribers." Price is below competitors to eliminate price objection. Founding members keep their rate forever (grandfather). |
| **Ramp** | Months 3-4 | $3.99/mo | $29.99/yr ($2.50/mo) | $39.99 | Gradual increase signals growing value. Communicate to free users: "Price increases to $4.99/mo next month. Lock in $3.99 now." Price anchoring against the upcoming full price. |
| **Steady State** | Month 5+ | $4.99/mo | $35.88/yr ($2.99/mo) | $49.99 | Full pricing as researched. Competitive with Intentional ($4.99/mo). Below BlockSite ($10.99/mo) and Freedom ($6.99/mo). |
| **Team Launch** | Month 6+ | $4.99/user/mo | $3.99/user/mo | -- | Team tier launches after individual Pro is validated. Min 5 users. |

**Founding member mechanics:**
- First 500 paying users get "Founding Member" badge in the extension (visible in popup header).
- Their subscription rate is locked at $2.99/mo or $19.99/yr for life (as long as subscription remains active).
- They get early access to new features.
- This creates urgency and rewards early adopters who take a risk on a new product.

**Lifetime deal strategy:**
- Available at all phases but price increases.
- Lifetime deal is profitable if the user would otherwise subscribe for > 10 months (at $4.99/mo, $49.99 lifetime = 10 months breakeven).
- Expected lifetime deal purchasers: 10-15% of paying users.
- Limit lifetime deals to the first 12 months. After that, remove the option to preserve recurring revenue.

---

### 6.6 Cross-Extension Integration (Future)

#### Extension Ecosystem Vision

Focus Mode - Blocker is designed as the first product in a potential "Focus Mode" ecosystem:

| Extension | Status | Purpose |
|-----------|--------|---------|
| **Focus Mode - Blocker** | This product | Website blocking + focus sessions |
| **Focus Mode - Tracker** | Future | Time tracking across websites (RescueTime-like) |
| **Focus Mode - Reader** | Future | Distraction-free reading mode for articles |
| **Focus Mode - Inbox** | Future | Email batch processing / notification bundling |

#### Shared Authentication

If multiple Focus Mode extensions exist:

1. **Single sign-on:** All extensions share the same account. Authentication happens once in any extension.
2. **Shared license:** A "Focus Mode Pro" subscription unlocks Pro features across ALL Focus Mode extensions. This increases perceived value and justifies the price.
3. **Implementation:** A shared `chrome.storage.local` key `focus_mode_shared_auth` stores the JWT. Extensions read this key before prompting for login. If a valid JWT exists, the user is already authenticated.

```javascript
// Shared auth protocol
// Extension A sets:
chrome.storage.local.set({
  "focus_mode_shared_auth": {
    "jwt": "eyJ...",
    "email": "user@example.com",
    "tier": "pro",
    "expires_at": "2027-02-10T00:00:00Z",
    "set_by": "focus-mode-blocker",
    "set_at": "2026-02-10T09:00:00Z"
  }
});

// Extension B reads on startup:
const auth = await chrome.storage.local.get("focus_mode_shared_auth");
if (auth?.jwt && new Date(auth.expires_at) > new Date()) {
  // User is authenticated -- validate JWT and activate Pro
}
```

**Note:** `chrome.storage.local` is scoped per extension. For cross-extension communication, use `chrome.runtime.sendMessage` with the target extension's ID (requires knowing the ID) or a shared `externally_connectable` messaging configuration.

Better approach for production: Use a shared server-side auth. Each extension validates the license independently with the server using the same user email/license key. No direct extension-to-extension communication needed.

#### Bundle Pricing

| Bundle | Price | Savings | Included |
|--------|-------|---------|----------|
| **Blocker Only** | $4.99/mo | -- | Focus Mode - Blocker Pro |
| **Focus Suite** | $6.99/mo | 30% vs individual | Blocker + Tracker + Reader (all Pro) |
| **Focus Suite Annual** | $49.99/yr | 40% vs monthly | All extensions, full year |
| **Focus Suite Lifetime** | $79.99 | -- | All extensions, forever |

**Bundle timing:** Only introduce bundles when 2+ extensions are live. Bundle pricing should make the second extension feel nearly free, driving adoption.

#### "More From Us" Promotion Placement

| Placement | Content | Frequency |
|-----------|---------|-----------|
| Settings page footer | "More Focus Mode tools: [Tracker] [Reader] [Inbox]" with icons and one-line descriptions | Always visible (after other extensions launch) |
| Post-session card (occasionally) | "Track where your time goes with Focus Mode Tracker. Free." | Max 1x per week, never during active session |
| Upgrade panel | "Get all Focus Mode tools with the Focus Suite. Save 30%." | Shown when user views Pro upgrade page |
| Block page (optional, Pro custom page) | Small "Powered by Focus Mode" footer with ecosystem link | Only on default block page, not custom |

**Rules for cross-promotion:**
- Never interrupt the core blocking/focus experience.
- Never show cross-promotion during a focus session.
- Maximum 1 cross-promotion per week.
- Always include a "Don't show again" dismiss option.
- Cross-promotion only shown after 14+ days of active use (user is established).

---

## APPENDIX A: File Structure Summary

```
focus-mode-blocker/
  manifest.json
  src/
    background/
      service-worker.js
      modules/
        blocking-engine.js
        session-manager.js
        timer-engine.js
        stats-aggregator.js
        nuclear-controller.js
        schedule-engine.js
        notification-manager.js
        storage-manager.js
        sync-manager.js
        license-manager.js
        message-router.js
        migration-manager.js
        onboarding-manager.js
        gamification-engine.js
        ambient-sound-manager.js
        calendar-manager.js
        ai-manager.js
    popup/
      popup.html
      popup.css
      popup.js
      components/
        header.js
        quick-focus.js
        timer-display.js
        blocklist-panel.js
        stats-card.js
        session-history.js
        sounds-panel.js
        schedule-panel.js
        settings-panel.js
        upgrade-panel.js
        nuclear-panel.js
        buddy-panel.js
    content/
      detector.js
      detector.css
      block-page.html
      block-page.css
      block-page.js
      tracker.js
    rules/
      prebuilt-social.json
      prebuilt-news.json
      prebuilt-entertainment.json  (Pro)
      prebuilt-gaming.json         (Pro)
      prebuilt-shopping.json       (Pro)
      prebuilt-adult.json          (Pro)
    assets/
      icons/
        icon-16.png
        icon-32.png
        icon-48.png
        icon-128.png
        icon-active.png            (green - session active)
        icon-nuclear.png           (red - nuclear active)
        icon-pro.png               (gold badge variant)
      sounds/
        rain.mp3
        whitenoise.mp3
        lofi.mp3
        (Pro sounds loaded from CDN on demand)
      images/
        block-page-bg.svg
        badge-icons/
      quotes.json
    offscreen/
      audio-player.html
      audio-player.js
  tests/
    unit/
    integration/
    e2e/
  docs/
    spec/
    research/
  vite.config.ts
  tsconfig.json
  package.json
  .eslintrc.js
  .prettierrc
```

---

## APPENDIX B: Implementation Phase Mapping

| Spec Section | Implementation Phase | Priority |
|--------------|---------------------|----------|
| 5.2 Manifest + 5.6 Blocking (basic DNR) | Phase 1 (Core) | P0 |
| 5.5 Content Scripts (detector + block page) | Phase 1 (Core) | P0 |
| 5.3 Storage Schema (core fields) | Phase 1 (Core) | P0 |
| 5.4 Service Worker (session + timer + stats) | Phase 1 (Core) | P0 |
| 5.6 Nuclear Option | Phase 1 (Core) | P1 |
| 5.6 Schedule-based rules | Phase 1 (Core) | P1 |
| 5.3 Gamification schema + 5.4 Gamification engine | Phase 2 (Engagement) | P1 |
| 6.2 Payment integration (Stripe) | Phase 2 (Monetization) | P0 |
| 6.3 License verification | Phase 2 (Monetization) | P0 |
| 6.4 Trial system | Phase 2 (Monetization) | P0 |
| 5.4 Ambient sound manager + 5.2 Offscreen doc | Phase 2 (Engagement) | P2 |
| 5.7 Sync architecture | Phase 3 (Pro) | P1 |
| 5.8 AI endpoints | Phase 3 (Pro) | P2 |
| 5.8 Calendar endpoints | Phase 3 (Pro) | P2 |
| 5.8 Team endpoints | Phase 4 (Team) | P2 |
| 5.6 Whitelist mode | Phase 3 (Pro) | P1 |
| 6.6 Cross-extension integration | Phase 5 (Ecosystem) | P3 |

---

*Specification generated for Focus Mode - Blocker Chrome Extension*
*Sections 5 & 6 -- Technical Architecture & Monetization Integration*
*Version 1.0 -- February 10, 2026*
*Feed this spec to implementation engineers alongside Sections 1-4 (Competitive Intelligence Report)*
