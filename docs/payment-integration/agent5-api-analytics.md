# API Integration & Analytics — Focus Mode - Blocker

## 1. API Reference (Focus Mode Specific)

### Endpoint 1: verify-extension-license

**URL:** `POST https://xggdjlurppfcytxqoozs.supabase.co/functions/v1/verify-extension-license`

**Request:**
```json
{
  "license_key": "ZOVO-ABCD-1234-EFGH-5678",
  "extension": "focus_mode_blocker"
}
```

**Success Response:**
```json
{
  "valid": true,
  "tier": "pro",
  "email": "user@example.com",
  "features": [
    "unlimited_sites",
    "custom_block_page",
    "whitelist_mode",
    "redirect_sites",
    "password_protection",
    "wildcard_blocking",
    "custom_timer",
    "auto_start_sessions",
    "break_customization",
    "focus_score_breakdown",
    "exportable_analytics",
    "block_page_stats",
    "full_reports",
    "full_streak",
    "full_comparison",
    "full_session_history",
    "calendar_integration",
    "context_profiles",
    "ai_recommendations",
    "smart_scheduling",
    "distraction_prediction",
    "custom_sounds",
    "sound_mixing",
    "cross_device_sync",
    "chrome_startup_focus",
    "selective_notifications",
    "unlimited_buddies",
    "unlimited_challenges",
    "shareable_cards",
    "global_leaderboards",
    "unlimited_lists",
    "extended_nuclear",
    "unlimited_schedules",
    "all_categories",
    "all_site_tracking"
  ],
  "subscription_status": "active",
  "expires_at": "2026-03-10T00:00:00Z"
}
```

**Error Responses:**
| Status | Body | When |
|--------|------|------|
| 200 | `{"valid": false, "error": "License key not found"}` | Invalid key |
| 200 | `{"valid": false, "error": "Subscription not active"}` | Expired/cancelled |
| 200 | `{"valid": false, "error": "Extension not authorized"}` | Key doesn't include this extension |
| 429 | `{"error": "Rate limit exceeded"}` | >10 requests/min per key |
| 500 | `{"error": "Internal server error"}` | API failure |

**Rate Limits:** 10 requests per 60 seconds per license key, 50 per IP

### Endpoint 2: log-paywall-hit

**URL:** `POST https://xggdjlurppfcytxqoozs.supabase.co/functions/v1/log-paywall-hit`

**Request:**
```json
{
  "email": "user@example.com",
  "extension_id": "focus_mode_blocker",
  "feature_attempted": "unlimited_sites",
  "trigger_id": "T2",
  "context": {
    "session_count": 5,
    "days_since_install": 4,
    "current_usage": "10/10 sites"
  }
}
```

**Response:**
```json
{
  "success": true,
  "paywall_event_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Paywall event logged",
  "drip_sequence": "started"
}
```

**Rate Limits:** 5 requests per 60 seconds per IP

### Endpoint 3: collect-analytics

**URL:** `POST https://xggdjlurppfcytxqoozs.supabase.co/functions/v1/collect-analytics`

**Request:**
```json
{
  "extension_slug": "focus_mode_blocker",
  "event_name": "feature_used",
  "event_data": {
    "feature": "nuclear_option",
    "duration": 60,
    "tier": "free"
  },
  "session_id": "uuid-session-id"
}
```

**Response:**
```json
{
  "success": true
}
```

## 2. Analytics Event Catalog

### Complete Event List for Focus Mode - Blocker

**Installation Events:**
| Event Name | Properties | When |
|------------|-----------|------|
| extension_installed | source, chrome_version | First install |
| extension_updated | from_version, to_version | Update |
| extension_uninstalled | days_active, was_pro, total_sessions | Uninstall (via URL) |
| onboarding_started | — | Onboarding slide 1 |
| onboarding_completed | slides_viewed, sites_blocked, time_ms | Onboarding done |
| onboarding_skipped | skipped_at_slide | Closed early |

**Feature Usage Events:**
| Event Name | Properties | When |
|------------|-----------|------|
| site_blocked | domain_hash, blocklist_size, is_nuclear | Distraction blocked |
| site_added | blocklist_size, source (manual/preset) | Site added to blocklist |
| session_started | type (pomodoro/quick/custom), duration | Focus session begins |
| session_completed | duration, score_change, blocks_during | Session ends normally |
| session_abandoned | duration, reason | Session cancelled early |
| nuclear_activated | duration_minutes, sites_locked | Nuclear started |
| sound_played | sound_id, duration | Ambient sound used |
| schedule_triggered | schedule_id, sites_count | Auto-schedule activated |
| focus_score_viewed | score, location (popup/stats/block_page) | Score checked |

**Conversion Events:**
| Event Name | Properties | When |
|------------|-----------|------|
| paywall_shown | trigger_id, feature, session_count | Paywall displayed |
| paywall_dismissed | trigger_id, dismiss_method | Paywall closed |
| paywall_upgrade_clicked | trigger_id, plan_type | Upgrade CTA clicked |
| paywall_trial_clicked | trigger_id | Trial CTA clicked |
| license_entered | — | License key submitted |
| license_verified | tier, features_count | License verified |
| license_failed | error | License rejected |
| upgrade_page_viewed | source, plan_preselected | Upgrade page opened |

**Engagement Events:**
| Event Name | Properties | When |
|------------|-----------|------|
| streak_milestone | days, is_new_best | Streak milestone hit |
| streak_broken | previous_length | Streak reset |
| achievement_earned | achievement_id | Achievement unlocked |
| popup_opened | session_active, tab_count | Popup clicked |
| settings_opened | — | Options page opened |
| review_prompted | trigger | Review ask shown |
| review_accepted | — | Clicked "Rate" |
| review_declined | decline_count | Clicked "Maybe later" |

## 3. Database Schema (Focus Mode Specific)

### licenses table — Focus Mode rows
```sql
-- Example license record
{
  id: 'uuid',
  license_key: 'ZOVO-ABCD-1234-EFGH-5678',
  email: 'user@example.com',
  tier: 'pro',
  product: 'focus_mode_blocker',
  features: ['unlimited_sites', 'custom_timer', ...],  -- 35 features
  status: 'active',
  stripe_customer_id: 'cus_xxxx',
  stripe_subscription_id: 'sub_xxxx',
  created_at: '2026-02-10T00:00:00Z',
  expires_at: '2026-03-10T00:00:00Z',  -- null for lifetime
  last_verified_at: '2026-02-10T12:00:00Z'
}
```

### paywall_events table
```sql
{
  id: 'uuid',
  email: 'user@example.com',
  extension_id: 'focus_mode_blocker',
  feature_attempted: 'unlimited_sites',
  trigger_id: 'T2',
  context: { session_count: 5, days_since_install: 4 },
  emails_sent: 0,  -- increments as drip sequence progresses
  converted: false,
  created_at: '2026-02-10T00:00:00Z',
  last_email_at: null
}
```

### analytics_events table
```sql
{
  id: 'uuid',
  extension_slug: 'focus_mode_blocker',
  event_name: 'session_completed',
  event_data: { duration: 1500, score_change: 3 },
  session_id: 'uuid-session',
  created_at: '2026-02-10T00:00:00Z'
}
```

## 4. Drip Email Sequence Specification

### Trigger: Paywall Hit (Any Trigger)
When `log-paywall-hit` is called, the following email sequence starts:

| Day | Subject | Content | CTA |
|-----|---------|---------|-----|
| 0 (immediate) | "You almost unlocked [feature_attempted]" | What the feature does, screenshot, ROI | "Unlock [Feature] Now" |
| 1 | "Focus Mode Pro saves you 2+ hours per week" | ROI calculation ($608/week x 2%), testimonial | "Start Free Trial" |
| 3 | "Your Focus Score could be higher" | Score improvement stats, before/after | "See Your Potential" |
| 5 | "Join [X] professionals using Focus Mode Pro" | Social proof, review quotes | "Join Them" |
| 7 | "Special offer: 30% off your first month" | Discount code, deadline, urgency | "Claim 30% Off" |

### Suppression Rules
- Stop sequence if user converts (buys Pro)
- Stop if user unsubscribes
- Don't send email 5 if user already received a discount in last 30 days
- Max 1 email per 24 hours across all sequences

## 5. Privacy-Compliant Analytics

### What We Track
- Anonymous feature usage (no PII)
- Paywall encounters (email only if voluntarily provided)
- Session-based events (no persistent user ID)

### What We NEVER Track
- Browsing history or URLs visited
- Content of blocked pages
- Personal information (name, location, demographics)
- Device fingerprinting

### GDPR/CCPA Compliance
- Analytics are opt-in (default off for free users)
- Pro users consent at checkout
- Data deletion: `DELETE FROM analytics_events WHERE session_id IN (...)`
- Data export: Available via support request
- Retention: Analytics events auto-deleted after 90 days

## 6. Testing & Debugging

### Debug Mode
```javascript
// Enable in developer console
chrome.storage.local.set({ zovoDebug: true });

// This enables:
// - Console logs for all API calls
// - License status badge in popup header
// - Force-show paywall button in settings
// - Analytics event log viewer
```

### Mock License for Development
```javascript
// Set mock Pro license for testing
chrome.storage.local.set({
  zovoLicense: {
    valid: true,
    tier: 'pro',
    features: [...ALL_PRO_FEATURES],
    cachedAt: Date.now(),
    lastVerifiedAt: Date.now(),
    _mock: true
  }
});
```

### API Health Check
```javascript
async function checkApiHealth() {
  try {
    const response = await fetch(`${ZOVO_API_BASE}/verify-extension-license`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ license_key: 'ZOVO-TEST-0000-0000-0000', extension: 'focus_mode_blocker' })
    });
    return { status: response.status, ok: response.ok };
  } catch (e) {
    return { status: 0, ok: false, error: e.message };
  }
}
```
