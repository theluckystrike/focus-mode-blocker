# Payment Architecture & Extension Registration — Focus Mode - Blocker

## 1. System Architecture

### Overview

Focus Mode - Blocker integrates with the Zovo unified payment system. One Zovo Pro membership unlocks Pro features across all Zovo extensions. The extension operates on an offline-first design where all Free-tier features work without any network connectivity, and Pro license verification is cached locally with graceful fallback.

### Architecture Diagram

```
┌─────────────────────────────────────────────┐
│          Focus Mode - Blocker Extension      │
│                                              │
│  ┌───────────────┐   ┌──────────────────┐   │
│  │  payments.js   │   │  feature-gate.js │   │
│  │  (license      │   │  (check access   │   │
│  │   verify,      │   │   per feature,   │   │
│  │   cache,       │   │   enforce limits,│   │
│  │   fallback)    │   │   tier logic)    │   │
│  └───────┬────────┘   └────────┬─────────┘   │
│          │                      │              │
│  ┌───────┴────────┐   ┌────────┴─────────┐   │
│  │  Paywall UI    │   │  License Input   │   │
│  │  (10 triggers) │   │  (key entry +    │   │
│  │                │   │   validation)    │   │
│  └───────┬────────┘   └────────┬─────────┘   │
└──────────┼──────────────────────┼─────────────┘
           │                      │
           ▼                      ▼
┌─────────────────────────────────────────────┐
│         Zovo Backend (Supabase)              │
│  https://xggdjlurppfcytxqoozs.supabase.co   │
│         /functions/v1                        │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  verify-extension-license             │   │
│  │  → Validates ZOVO-XXXX-XXXX-XXXX-XXXX│   │
│  │  → Returns features[] + tier + expiry │   │
│  │  → Rate limit: 10 requests/min/key   │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  log-paywall-hit                      │   │
│  │  → Logs paywall encounter + feature   │   │
│  │  → Triggers drip email sequence       │   │
│  │  → Rate limit: 5 requests/min/IP     │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  collect-analytics                    │   │
│  │  → Anonymous feature usage tracking   │   │
│  │  → Session-based event batching       │   │
│  │  → No PII collected                   │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  Stripe Webhooks                      │   │
│  │  → subscription.created               │   │
│  │  → subscription.cancelled             │   │
│  │  → payment.succeeded                  │   │
│  │  → Generates ZOVO license keys        │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  Database (Supabase PostgreSQL)       │   │
│  │  → licenses table                    │   │
│  │  → paywall_events table              │   │
│  │  → analytics_events table            │   │
│  │  → extensions table                  │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### Data Flow

1. **User installs extension** -- Free tier activates immediately with zero API calls. All 15 Free features and 12 Limited Free features (at free limits) work offline from the start.
2. **User hits a Pro feature or limit** -- `feature-gate.js` checks `chrome.storage.local` for cached license. If no valid Pro license found, paywall UI is displayed. The paywall hit is logged via `log-paywall-hit` endpoint (which triggers drip email if user provided email).
3. **User upgrades via Stripe** -- Stripe checkout at `https://zovo.one/join?ref=focus_mode_blocker`. On `payment.succeeded` webhook, a `ZOVO-XXXX-XXXX-XXXX-XXXX` license key is generated and emailed to the user.
4. **User enters license key** -- Key is entered in extension popup or settings page. Extension calls `verify-extension-license` endpoint. API returns features array, tier, and expiry. License data is cached in `chrome.storage.local` (for speed) and key is stored in `chrome.storage.sync` (for cross-device sync).
5. **Features unlocked** -- `feature-gate.js` reads cached license. Pro/Team features are unlocked. No more paywalls for features included in the user's tier.
6. **Ongoing verification** -- Every 24 hours, the service worker re-verifies the license in the background. If verification fails and cache is less than 7 days old, Pro features remain active (offline grace period). After 7 days without successful verification, extension degrades to Free tier.

### Offline-First Design

- **Free features:** Work 100% offline with zero API dependency. No network calls are made for Free-tier users.
- **License caching:** Verified license data is cached in `chrome.storage.local` with a timestamp. Cache is valid for 24 hours before re-verification is attempted.
- **7-day grace period:** If the API is unreachable (user is offline, server is down), the extension continues honoring the cached license for up to 7 days. After 7 days without successful re-verification, Pro features degrade gracefully.
- **Analytics queue:** Analytics events are queued in `chrome.storage.local` and batch-sent when a connection is available. The queue holds up to 500 events before oldest entries are dropped.
- **Paywall logging queue:** Paywall hits are queued locally if offline and sent on next successful connection.

---

## 2. Product Registration

### PRODUCT_FEATURES Configuration

For `stripe-webhook/index.ts` and `create-license/index.ts` on the Zovo backend:

```typescript
const PRODUCT_FEATURES: Record<string, string[]> = {
  focus_mode_blocker: [
    // ── Core Blocking Pro (6) ──
    'unlimited_sites',           // Unlimited blocklist (beyond 10-site free limit)
    'custom_block_page',         // Custom block page design (colors, messages, images)
    'whitelist_mode',            // Allow-only mode (block everything except whitelist)
    'redirect_sites',            // Redirect blocked sites to productive alternatives
    'password_protection',       // Password-protect settings to prevent self-override
    'wildcard_blocking',         // Regex/wildcard URL pattern blocking

    // ── Focus Timer Pro (3) ──
    'custom_timer',              // Custom focus durations (1-240 min, beyond preset options)
    'auto_start_sessions',       // Auto-start focus sessions on schedule or browser open
    'break_customization',       // Custom break durations and break activity suggestions

    // ── Stats & Analytics Pro (6) ──
    'focus_score_breakdown',     // Detailed score analysis by category and time period
    'exportable_analytics',      // CSV/PDF export of focus data and reports
    'block_page_stats',          // Block page interaction analytics (attempts, time, patterns)
    'full_reports',              // Unblurred weekly/monthly reports (limited free: blurred)
    'full_streak',               // Full streak history + streak recovery (limited free: 7 days)
    'full_comparison',           // Full comparative analytics (limited free: basic only)
    'full_session_history',      // Session history beyond 7 days (limited free: 7 days)

    // ── Smart Features Pro (4) ──
    'calendar_integration',      // Google Calendar sync for auto-scheduling focus sessions
    'context_profiles',          // Work/Study/Custom profiles with per-profile blocklists
    'ai_recommendations',        // AI-powered focus recommendations based on usage patterns
    'smart_scheduling',          // AI-powered optimal focus time scheduling
    'distraction_prediction',    // Predict distraction patterns and preemptive blocking

    // ── Integrations & Customization Pro (2) ──
    'custom_sounds',             // Custom timer sounds (limited free: 2 preset sounds)
    'all_site_tracking',         // Website time tracking beyond top 3 (limited free: top 3)

    // ── Social Pro (2) ──
    'unlimited_buddies',         // Focus buddy connections beyond 1 (limited free: 1 buddy)
    'unlimited_challenges',      // Focus challenges beyond 1 active (limited free: 1 challenge)

    // ── Limited Free Upgrades (4) ──
    'unlimited_lists',           // Pre-built block lists beyond 2 (limited free: 2 lists)
    'extended_nuclear',          // Nuclear mode beyond 1hr, up to 24hr (limited free: max 1hr)
    'unlimited_schedules',       // Multiple schedules (limited free: 1 schedule)
    'all_categories'             // Category blocking beyond 2 categories (limited free: 2)
  ]
};
```

**Total Pro features registered: 35**

### Team Features (separate product)

```typescript
const TEAM_FEATURES: Record<string, string[]> = {
  focus_mode_blocker_team: [
    // All Pro features included
    ...PRODUCT_FEATURES.focus_mode_blocker,

    // ── Team-Exclusive Features (7) ──
    'team_sessions',             // Shared focus sessions across team members
    'team_leaderboards',         // Named team leaderboards with custom metrics
    'api_access',                // External API access for integrations
    'admin_dashboard',           // Team admin controls (manage members, view reports)
    'bulk_management',           // Bulk site/user management tools
    'sso_integration',           // SSO/SAML authentication for enterprise
    'priority_support'           // Priority support SLA (< 4hr response)
  ]
};
```

**Total Team features: 35 Pro + 7 Team = 42**

### Extensions Table Registration

```sql
INSERT INTO extensions (
  slug,
  name,
  description,
  category,
  pricing_monthly,
  pricing_annual_monthly,
  pricing_annual_total,
  pricing_lifetime,
  pricing_team_monthly,
  free_feature_count,
  limited_feature_count,
  pro_feature_count,
  team_feature_count,
  store_url,
  privacy_url,
  landing_url,
  uninstall_feedback_url,
  upgrade_url,
  is_active,
  created_at
) VALUES (
  'focus_mode_blocker',
  'Focus Mode - Blocker',
  'Block distracting websites, build focus habits, and track your productivity streak.',
  'productivity',
  4.99,
  2.99,
  35.88,
  49.99,
  3.99,
  15,
  12,
  17,
  7,
  'https://chrome.google.com/webstore/detail/focus-mode-blocker/[EXTENSION_ID]',
  'https://zovo.one/privacy/focus-mode-blocker',
  'https://zovo.one/tools/focus-mode-blocker',
  'https://zovo.one/feedback/uninstall/focus_mode_blocker',
  'https://zovo.one/join?ref=focus_mode_blocker',
  true,
  NOW()
);
```

### Drip Email Templates for Focus Mode - Blocker

When a free user encounters a paywall and optionally provides their email (or is already identified), the `log-paywall-hit` endpoint triggers a drip email sequence. Five emails are sent over 7 days:

| # | Trigger Delay | Subject Line | Content Focus |
|---|--------------|--------------|---------------|
| 1 | Immediate | "You almost unlocked {feature_name} in Focus Mode" | Feature-specific preview showing what the user was trying to do. Screenshot/GIF of the Pro feature in action. Single CTA button: "Unlock {feature_name} -- $4.99/mo". Personalized to the exact feature that triggered the paywall. |
| 2 | Day 1 (24hr) | "Focus Mode Pro users save 2+ hours every week" | ROI calculation: "At $4.99/mo, that's $0.62/hr of reclaimed focus time." Testimonial from a real user about productivity gains. Breakdown of what Pro includes (all 17 Pro features). CTA: "Start saving time today". |
| 3 | Day 3 (72hr) | "Your Focus Score could be so much higher" | If analytics available: reference their actual score. Show average score improvement after Pro upgrade (e.g., "+34% in first week"). Highlight `focus_score_breakdown`, `ai_recommendations`, and `smart_scheduling` features. CTA: "Boost your Focus Score". |
| 4 | Day 5 (120hr) | "Join 10,000+ professionals using Focus Mode Pro" | Social proof: user count, company logos (if available), aggregate stats ("Pro users block 47 distractions/day on average"). Highlight `context_profiles` for work/study switching. Community angle with focus challenges and buddies. CTA: "Join the community". |
| 5 | Day 7 (168hr) | "Your exclusive offer: 30% off Focus Mode Pro" | Limited-time 30% discount on first month ($3.49 instead of $4.99). Urgency: "This offer expires in 48 hours." Final summary of all Pro benefits. Annual plan pitch: "Or save 40% with annual billing at $2.99/mo." CTA: "Claim your 30% discount". |

**Email template variables:**
- `{feature_name}` -- Human-readable name of the feature that triggered the paywall
- `{feature_key}` -- Machine key (e.g., `unlimited_sites`)
- `{user_name}` -- User's name if available, otherwise "there"
- `{discount_code}` -- Auto-generated 30% discount code for email 5
- `{discount_expiry}` -- 48 hours after email 5 is sent

---

## 3. Subscription Tiers

### Tier Comparison

| Feature Area | Feature | Free | Pro ($4.99/mo) | Lifetime ($49.99) | Team ($3.99/user/mo) |
|---|---|---|---|---|---|
| **Core Blocking** | Blocklist sites | Up to 10 sites | Unlimited | Unlimited | Unlimited |
| | Block page design | Default only | Custom design | Custom design | Custom + team branding |
| | Allow-only mode | -- | Yes | Yes | Yes |
| | Redirect to productive sites | -- | Yes | Yes | Yes |
| | Password-protect settings | -- | Yes | Yes | Yes + admin override |
| | Wildcard/regex blocking | -- | Yes | Yes | Yes |
| | Pre-built block lists | 2 lists | Unlimited | Unlimited | Unlimited |
| | Category blocking | 2 categories | All categories | All categories | All categories |
| | Nuclear mode | Up to 1 hour | Up to 24 hours | Up to 24 hours | Up to 24 hours |
| **Focus Timer** | Preset durations | Yes (25/50 min) | Yes | Yes | Yes |
| | Custom durations | -- | 1-240 min | 1-240 min | 1-240 min |
| | Auto-start sessions | -- | Yes | Yes | Yes |
| | Break customization | Default breaks | Custom breaks | Custom breaks | Custom breaks |
| | Pomodoro mode | Yes | Yes | Yes | Yes |
| | Timer sounds | 2 presets | Custom sounds | Custom sounds | Custom sounds |
| **Scheduling** | Scheduled blocking | 1 schedule | Unlimited | Unlimited | Unlimited |
| | Calendar integration | -- | Google Calendar | Google Calendar | Google Calendar |
| | Auto-start on schedule | -- | Yes | Yes | Yes |
| | Smart scheduling (AI) | -- | Yes | Yes | Yes |
| **Analytics** | Basic stats | Yes | Yes | Yes | Yes |
| | Focus score | Basic score | Detailed breakdown | Detailed breakdown | Detailed + team avg |
| | Weekly/monthly reports | Blurred preview | Full reports | Full reports | Full + team reports |
| | Session history | 7 days | Unlimited | Unlimited | Unlimited |
| | Website time tracking | Top 3 sites | All sites | All sites | All sites |
| | Block page analytics | -- | Yes | Yes | Yes |
| | Comparative analytics | Basic | Full | Full | Full + team comparison |
| | Export (CSV/PDF) | -- | Yes | Yes | Yes |
| **Smart Features** | Context profiles | -- | Work/Study/Custom | Work/Study/Custom | Work/Study/Custom + shared |
| | AI recommendations | -- | Yes | Yes | Yes |
| | Distraction prediction | -- | Yes | Yes | Yes |
| **Streaks & Social** | Streak tracking | Current streak only | Full history + recovery | Full history + recovery | Full + team streaks |
| | Focus buddy | 1 buddy | Unlimited | Unlimited | Unlimited |
| | Focus challenges | 1 active | Unlimited | Unlimited | Unlimited + team |
| **Team Features** | Shared focus sessions | -- | -- | -- | Yes |
| | Team leaderboards | -- | -- | -- | Yes |
| | API access | -- | -- | -- | Yes |
| | Admin dashboard | -- | -- | -- | Yes |
| | Bulk management | -- | -- | -- | Yes |
| | SSO/SAML | -- | -- | -- | Yes |
| | Priority support | Community | Community | Community | < 4hr SLA |

**Key notes:**
- **Lifetime** includes all Pro features with no recurring cost. Equivalent to ~10 months of monthly billing.
- **Team** includes all Pro features plus 7 team-exclusive features. Billed per user per month.
- **Free tier** is fully functional for basic site blocking and focus timing. No account required, no API calls.

### Stripe Product Configuration

```
Product: Focus Mode - Blocker Pro
├── Price: $4.99/month (price_monthly_id)
│   └── Stripe Price ID: price_focus_blocker_monthly
│   └── Billing: recurring, monthly
│
├── Price: $35.88/year — $2.99/mo equivalent (price_annual_id)
│   └── Stripe Price ID: price_focus_blocker_annual
│   └── Billing: recurring, yearly
│   └── Savings badge: "Save 40%"
│
├── Price: $49.99 one-time (price_lifetime_id)
│   └── Stripe Price ID: price_focus_blocker_lifetime
│   └── Billing: one_time
│   └── Badge: "Best Value — Pay Once"
│
└── Price: $3.99/user/month (price_team_id)
    └── Stripe Price ID: price_focus_blocker_team
    └── Billing: recurring, monthly, per_seat
    └── Minimum seats: 3

Checkout Session Configuration:
  mode: 'subscription' (monthly/annual/team) or 'payment' (lifetime)
  success_url: https://zovo.one/success?session_id={CHECKOUT_SESSION_ID}&ext=focus_mode_blocker
  cancel_url: https://zovo.one/tools/focus-mode-blocker?checkout=cancelled
  allow_promotion_codes: true
  billing_address_collection: 'auto'
  tax_id_collection: { enabled: true }
  metadata: {
    extension_slug: 'focus_mode_blocker',
    source: 'extension_paywall'  // or 'landing_page', 'email_drip'
  }
```

---

## 4. License Key Lifecycle

### Key Generation (on payment)

```
Stripe webhook: payment_intent.succeeded / subscription.created
  │
  ├── Validate webhook signature
  ├── Extract customer email + metadata.extension_slug
  ├── Generate key: ZOVO-XXXX-XXXX-XXXX-XXXX
  │   └── Format: 4 groups of 4 alphanumeric chars (uppercase + digits, no ambiguous chars)
  │   └── Excluded chars: 0, O, I, L, 1 (to avoid confusion)
  │   └── Example: ZOVO-A3BK-7NRF-9PXW-2DHM
  │
  ├── Store in licenses table:
  │   ├── key: 'ZOVO-A3BK-7NRF-9PXW-2DHM'
  │   ├── email: 'user@example.com'
  │   ├── stripe_customer_id: 'cus_...'
  │   ├── stripe_subscription_id: 'sub_...' (null for lifetime)
  │   ├── extension_slug: 'focus_mode_blocker'
  │   ├── features: ['unlimited_sites', 'custom_block_page', ...]
  │   ├── tier: 'pro' | 'lifetime' | 'team'
  │   ├── status: 'active'
  │   ├── seats: 1 (or N for team)
  │   ├── expires_at: subscription end date (null for lifetime)
  │   └── created_at: NOW()
  │
  ├── Send license key email to user
  │   └── Subject: "Your Focus Mode Pro license key"
  │   └── Body: Key + activation instructions
  │
  └── Log event: license_created
```

### Key Verification Flow

```
Extension startup / 24-hour re-check / manual verify
  │
  ├── Step 1: Check chrome.storage.local for cached license
  │   ├── If cached AND cache_timestamp < 24 hours old
  │   │   └── USE cached data (no API call)
  │   │   └── Schedule background re-verify
  │   ├── If cached AND cache_timestamp > 24 hours old
  │   │   └── Attempt background re-verify with API
  │   │   └── If API succeeds → update cache
  │   │   └── If API fails AND cache < 7 days old → USE cached data (grace period)
  │   │   └── If API fails AND cache > 7 days old → DEGRADE to free tier
  │   └── If not cached → proceed to Step 2
  │
  ├── Step 2: Check chrome.storage.sync for licenseKey
  │   ├── If key exists → call verify-extension-license API
  │   │   ├── Request:
  │   │   │   POST /functions/v1/verify-extension-license
  │   │   │   {
  │   │   │     "key": "ZOVO-A3BK-7NRF-9PXW-2DHM",
  │   │   │     "extension": "focus_mode_blocker"
  │   │   │   }
  │   │   │
  │   │   ├── Success Response (200):
  │   │   │   {
  │   │   │     "valid": true,
  │   │   │     "tier": "pro",
  │   │   │     "features": ["unlimited_sites", "custom_block_page", ...],
  │   │   │     "expires_at": "2027-02-11T00:00:00Z",
  │   │   │     "seats": 1
  │   │   │   }
  │   │   │   └── Cache in chrome.storage.local with timestamp
  │   │   │   └── Unlock features
  │   │   │
  │   │   ├── Invalid Key Response (200):
  │   │   │   {
  │   │   │     "valid": false,
  │   │   │     "reason": "expired" | "revoked" | "invalid" | "wrong_extension"
  │   │   │   }
  │   │   │   └── Clear cache
  │   │   │   └── Show re-activation prompt
  │   │   │
  │   │   └── Error Response (429/500):
  │   │       └── Fall back to cached data if available
  │   │       └── Retry with exponential backoff
  │   │
  │   └── If no key → Free tier (no API call)
  │
  └── Step 3: Update UI state
      ├── Set tier badge in popup
      ├── Update feature gate cache
      └── Emit 'license-status-changed' event
```

### Key Revocation (on cancellation)

```
Stripe webhook: customer.subscription.deleted
  │
  ├── Look up license by stripe_subscription_id
  ├── Set license status to 'expired'
  ├── Set expires_at to current period end (honor remaining paid time)
  │
  └── Next verification by extension:
      ├── API returns { valid: false, reason: 'expired' }
      ├── Extension clears Pro cache
      ├── Extension gracefully degrades to Free tier
      ├── User data is PRESERVED (no deletion on downgrade)
      │   ├── Custom block pages → reverts to default but config saved
      │   ├── Blocked sites beyond 10 → saved but only first 10 enforced
      │   ├── Analytics history → preserved but reports blurred again
      │   ├── Schedules beyond 1 → saved but only first active
      │   └── All settings saved for instant restore on re-subscription
      │
      └── Show "Your Pro subscription has ended" banner with re-subscribe CTA
```

### Lifetime Key Behavior

- Lifetime keys have `expires_at: null` and never expire via subscription logic.
- Lifetime keys still verify every 24 hours (to check for revocation due to fraud/chargeback).
- Lifetime keys are tied to one user email and cannot be transferred.
- If a chargeback occurs on a lifetime purchase, the key is revoked.

---

## 5. Security Considerations

### License Key Security

- **Storage:** License key string stored in `chrome.storage.sync` (encrypted by Chrome, synced across user's Chrome instances). Cached license data (features array, tier, timestamp) stored in `chrome.storage.local`.
- **Transport:** All API calls use HTTPS exclusively. No HTTP fallback.
- **Rate limiting:** `verify-extension-license` allows 10 requests per minute per key. `log-paywall-hit` allows 5 requests per minute per IP. `collect-analytics` allows 20 requests per minute per extension instance.
- **Key binding:** Keys are bound to the purchaser's email address. A key can only be used by the original purchaser.
- **Key format integrity:** The `ZOVO-XXXX-XXXX-XXXX-XXXX` format uses 20 alphanumeric characters (excluding ambiguous chars), providing approximately 2.6 x 10^28 possible combinations -- sufficient to prevent guessing.

### Tamper Resistance

- **Multi-layer checks:** Feature gates are enforced at three levels:
  1. **Service worker (background.js):** Validates license before executing Pro logic (e.g., nuclear mode >1hr, schedule creation beyond limit).
  2. **Popup UI:** Checks license before rendering Pro UI elements. Shows paywall overlay if unauthorized.
  3. **Content scripts:** Validates locally cached license before applying Pro behaviors (e.g., custom block page rendering, redirect logic).
- **Server-side validation for critical features:** Nuclear mode beyond 1 hour verifies Pro status server-side before activation. This prevents a user from tampering with local storage to enable extended nuclear mode and then being unable to cancel it.
- **24-hour re-verification:** Even if local cache is tampered with, the next re-verification cycle (every 24 hours) will correct the state. Maximum exposure window for tampered cache: 24 hours.
- **Cache integrity:** Cached license data includes an HMAC signature derived from the license key. Tampering with the features array without knowing the key invalidates the signature.

### Privacy

- **Free tier:** Absolutely ZERO API calls are made. No data is sent to any server. Everything is local to the browser.
- **Pro tier:** Only the following API calls are made:
  1. `verify-extension-license` -- Sends only the license key and extension slug. No browsing data.
  2. `collect-analytics` (opt-in only) -- Sends anonymous, aggregated events (e.g., "focus session completed, duration: 25min"). No URLs, no page titles, no browsing history.
- **Paywall logging:** `log-paywall-hit` sends only the feature key that was attempted (e.g., `unlimited_sites`). No browsing context is included.
- **No browsing data transmitted:** The extension never sends URLs, page titles, browsing history, or any content from visited pages to any server.
- **Data residency:** All backend data is stored in Supabase (AWS infrastructure). Compliant with standard data protection practices.
- **User data deletion:** Users can request complete data deletion via privacy@zovo.one. All license records, analytics, and paywall events are purged within 30 days.

---

## 6. Registration Checklist

### Backend Registration

- [ ] Extension slug registered: `focus_mode_blocker`
- [ ] 35 Pro features defined in `PRODUCT_FEATURES` map in `stripe-webhook/index.ts`
- [ ] 35 Pro features defined in `PRODUCT_FEATURES` map in `create-license/index.ts`
- [ ] 7 Team features defined in `TEAM_FEATURES` map in `stripe-webhook/index.ts`
- [ ] 7 Team features defined in `TEAM_FEATURES` map in `create-license/index.ts`
- [ ] Row inserted into `extensions` table with all pricing and URL fields
- [ ] 5 drip email templates created and linked to `focus_mode_blocker` paywall events
- [ ] Drip email sequence trigger configured in `log-paywall-hit` function

### Stripe Configuration

- [ ] Stripe Product created: "Focus Mode - Blocker Pro"
- [ ] Monthly price configured: $4.99/mo (`price_focus_blocker_monthly`)
- [ ] Annual price configured: $35.88/yr (`price_focus_blocker_annual`)
- [ ] Lifetime price configured: $49.99 one-time (`price_focus_blocker_lifetime`)
- [ ] Team price configured: $3.99/user/mo (`price_focus_blocker_team`)
- [ ] Checkout success URL: `https://zovo.one/success?session_id={CHECKOUT_SESSION_ID}&ext=focus_mode_blocker`
- [ ] Checkout cancel URL: `https://zovo.one/tools/focus-mode-blocker?checkout=cancelled`
- [ ] Promotion codes enabled on checkout sessions
- [ ] 30% discount coupon created for drip email #5

### Web Properties

- [ ] Landing page live: `https://zovo.one/tools/focus-mode-blocker`
- [ ] Privacy policy live: `https://zovo.one/privacy/focus-mode-blocker`
- [ ] Uninstall feedback URL configured: `https://zovo.one/feedback/uninstall/focus_mode_blocker`
- [ ] Upgrade URL configured: `https://zovo.one/join?ref=focus_mode_blocker`
- [ ] Success page handles `ext=focus_mode_blocker` parameter (shows license key + install instructions)

### Extension Configuration

- [ ] `payments.js` configured with Zovo API base URL
- [ ] `feature-gate.js` contains complete feature-to-tier mapping for all 51 features
- [ ] License key input UI in popup/settings
- [ ] Paywall UI with 10 trigger points implemented
- [ ] Upgrade URL opens `https://zovo.one/join?ref=focus_mode_blocker`
- [ ] Uninstall URL set in `manifest.json` or via `chrome.runtime.setUninstallURL()`
- [ ] Offline grace period (7 days) implemented
- [ ] Analytics queue with local buffering implemented
- [ ] Cache HMAC integrity check implemented

### Testing

- [ ] Free tier works with zero API calls (airplane mode test)
- [ ] All 15 Free features functional without license
- [ ] All 12 Limited Free features functional at free limits
- [ ] License key entry and verification flow works end-to-end
- [ ] All 17 Pro features unlock after valid license entry
- [ ] All 7 Team features unlock with team license
- [ ] Paywall appears for each gated feature (17 Pro + limit triggers for 12 Limited)
- [ ] Graceful degradation after subscription cancellation
- [ ] 7-day offline grace period functions correctly
- [ ] Rate limiting is respected (no retry storms)
- [ ] Drip email sequence fires on first paywall hit
- [ ] 30% discount code from email #5 works in Stripe checkout
