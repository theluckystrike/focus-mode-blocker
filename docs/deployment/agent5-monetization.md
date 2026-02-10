# AGENT 5: MONETIZATION AND INTEGRATION SPECIFICATION
## Focus Mode - Blocker Chrome Extension

> **Version:** 1.0 | **Date:** February 10, 2026 | **Status:** Specification Complete

---

## 1. FEATURE GATING SYSTEM

### 1.1 Pro Status Architecture

```javascript
// Single source of truth for Pro status
const SubscriptionState = {
  tier: 'free',           // 'free' | 'pro' | 'team' | 'trial'
  expiresAt: null,        // ISO timestamp or null
  cachedAt: null,         // When last verified
  offlineGraceStart: null,// When offline grace began
  licenseKey: null,       // Encrypted license key
  foundingMember: false,  // Founding member flag
  trialUsed: false        // Whether 7-day trial was used
};

// Check on every feature access
async function isPro() {
  const sub = await getSubscription();
  if (sub.tier === 'free') return false;
  if (sub.tier === 'trial' && Date.now() > sub.expiresAt) {
    await downgradeToFree();
    return false;
  }
  if (sub.cachedAt && (Date.now() - sub.cachedAt) > 86400000) {
    return await verifyWithServer(sub);
  }
  return true;
}
```

### 1.2 Gate Types

| Gate Type | Behavior | Used For |
|-----------|----------|----------|
| **Hard lock** | Feature completely inaccessible, lock icon | Whitelist mode, AI, calendar, sync, API |
| **Soft limit** | Works up to cap, then upgrade prompt | 10 sites, 1 schedule, 1hr nuclear, 7-day history |
| **Blur gate** | Data visible but blurred, click to upgrade | Weekly reports, Focus Score breakdown, comparative stats |
| **Preview gate** | Brief preview then lock | Sound previews (3s), report de-blur (5s one-time) |

### 1.3 Graceful Degradation (Pro → Free)

| Feature | Pro State | After Downgrade | Data Handling |
|---------|-----------|-----------------|---------------|
| Blocklist (>10 sites) | 50 sites active | First 10 remain active, rest saved but inactive | All sites preserved in storage |
| Custom timers | 45-min sessions | Reverts to 25/5 only | Custom presets saved but disabled |
| Weekly reports | Full access | Blurred again | Report data preserved |
| Nuclear (>1hr) | 24hr available | 1hr max | No active nuclear affected mid-session |
| Schedules (>1) | 5 schedules | First schedule active, rest disabled | All saved |
| Sounds (>3) | 15 sounds | First 3 available | Favorites saved |
| Streak recovery | Available | Unavailable | Recovery history preserved |
| Cross-device sync | Active | Stops syncing, local data preserved | Last sync state kept |

---

## 2. UPGRADE PROMPT SYSTEM

### 2.1 Six Rotating Variations

**Variation A — Value Focus**
- Context: After session completion (session 5+)
- Headline: "You saved 47 minutes today"
- Body: "Pro members save 2+ hours daily with unlimited blocking, smart schedules, and detailed reports."
- CTA: "See Pro Features"
- Dismiss: "Maybe later"

**Variation B — Social Proof**
- Context: On weekly distraction alert (Sunday)
- Headline: "Join 3,000+ focused professionals"
- Body: "Pro members are 40% more focused. Your Focus Score could be higher."
- CTA: "Start Pro Trial"
- Dismiss: "Not now"

**Variation C — Feature Focus**
- Context: When user clicks a locked feature
- Headline: "Unlock [Feature Name]"
- Body: "[One sentence describing what the feature does and its benefit]"
- CTA: "Upgrade to Pro — $4.99/mo"
- Dismiss: "Keep using free"

**Variation D — Achievement Focus**
- Context: On streak milestone (7, 14, 30 days)
- Headline: "🔥 [X]-day streak! You're on fire"
- Body: "Protect your streak with Pro. Never lose progress to a missed day."
- CTA: "Get Streak Recovery"
- Dismiss: "I'll risk it"

**Variation E — Curiosity Focus**
- Context: After session with blurred Focus Score breakdown
- Headline: "Your Focus Score: 74"
- Body: "What's holding you back? Pro reveals your full breakdown by category."
- CTA: "See My Breakdown"
- Dismiss: "Score is enough"

**Variation F — ROI Focus**
- Context: After 2+ weeks of use with tracked stats
- Headline: "Pro costs less than 6 minutes of work"
- Body: "At your pace, you've saved [X] hours this month. Pro users save 3x more."
- CTA: "Try Pro Free for 7 Days"
- Dismiss: "Not right now"

### 2.2 Rotation & Frequency Rules

| Rule | Value |
|------|-------|
| Max pushed prompts per session | 1 |
| Max pushed prompts per week | 3 |
| Cool-down after dismiss | 48 hours for same trigger type |
| User-initiated prompts (clicking locks) | Unlimited (not counted) |
| Sessions 1-2 | ZERO prompts of any kind |
| Session 3-4 | Visual badges only, no prompts |
| Session 5+ | Prompts enabled |
| Day 14+ free users | Monthly summary only, no escalation |
| Rotation | Cycle A→B→C→D→E→F, skip irrelevant |

### 2.3 Dismiss Tracking

```javascript
"paywall_tracking": {
  "total_shown": 12,
  "total_dismissed": 10,
  "total_clicked": 2,
  "last_shown": "2026-02-10T...",
  "last_trigger": "T1",
  "variation_stats": {
    "A": { shown: 3, dismissed: 2, clicked: 1 },
    "B": { shown: 2, dismissed: 2, clicked: 0 },
    // ...
  },
  "best_performing": "A"  // Auto-calculated
}
```

---

## 3. PAYWALL TIMING LOGIC

### 3.1 Session Counting

```javascript
"onboarding": {
  "session_count": 0,       // Incremented on each focus session START
  "first_session_date": null,
  "badges_visible": false,   // Flips true at session 3
  "t1_armed": false,         // Flips true at session 5
  "t1_fired": false,         // True after first T1 display
  "trial_offered": false,
  "trial_used": false
}
```

### 3.2 Trigger State Machine

```
INSTALL → sessions 1-2: DORMANT (no triggers, no badges)
       → session 3: AWARE (badges visible, T4/T5/T10 armed)
       → session 5: ACTIVE (T1 fires, T2/T3 armed)
       → day 7+: ENGAGED (T7 weekly alerts begin)
       → day 14+: RESPECTFUL (no escalation, monthly only)
```

### 3.3 Service Worker Restart Handling

All trigger state stored in `chrome.storage.local`, NOT in-memory. On SW wake:
1. Read `onboarding` from storage
2. Re-arm appropriate triggers based on `session_count`
3. Re-register alarms for T7 if `session_count >= 7`
4. Check if pending T6 countdown is active

---

## 4. FIRST RUN & ONBOARDING

### 5-Step Flow (Session 1)

**Step 1: Welcome (3 seconds)**
- "Block distractions. Build focus. Track your streak."
- Shield icon animation
- "Let's set up in 30 seconds" button

**Step 2: Add Your First Sites (interactive)**
- "What distracts you most?"
- Quick-add buttons: Reddit, Twitter/X, YouTube, Facebook, Instagram, TikTok, News
- Custom URL input
- Pre-built list toggles (Social Media, News)
- "Added [X] sites — nice!" confirmation
- Skip option always visible

**Step 3: Start Quick Focus (interactive)**
- "Ready for your first focus session?"
- Big "Start 25-Minute Focus" button
- Brief explanation: "We'll block your distracting sites and start a Pomodoro timer"

**Step 4: Success!**
- Shows after first session completes (or after 60s if user skips)
- "Your first Focus Score: [X]"
- "Distraction attempts blocked: [Y]"
- "You're already ahead of 60% of new users"

**Step 5: What's Next**
- "Come back tomorrow to build your streak 🔥"
- "Your extension is ready — click the icon anytime"
- Close onboarding, return to normal popup

---

## 5. STRIPE INTEGRATION

### 5.1 Plan Selection UI

```
┌─────────────────────────────────────────┐
│  Unlock Focus Mode Pro                  │
│                                         │
│  ┌─── BEST VALUE ──────────────────┐    │
│  │ Annual Plan                     │    │
│  │ $2.99/mo ($35.88/year)         │    │
│  │ Save 40% vs monthly             │    │
│  │ [● Selected]                    │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Monthly Plan                    │    │
│  │ $4.99/mo                       │    │
│  │ Cancel anytime                  │    │
│  │ [○ Select]                      │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Lifetime                        │    │
│  │ $49.99 one-time                │    │
│  │ Pay once, Pro forever           │    │
│  │ [○ Select]                      │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [ Continue to Checkout → ]             │
│                                         │
│  🔒 Secured by Stripe                  │
│  30-day money-back guarantee            │
└─────────────────────────────────────────┘
```

Annual plan pre-selected. Gold accent (#D4A017) on selected plan border.

### 5.2 Checkout Flow

```
1. User clicks CTA in popup
2. Plan selection panel slides up in popup
3. User selects plan → clicks "Continue to Checkout"
4. Extension calls backend: POST /api/checkout/session
   Body: { plan: 'annual', extensionId: 'xxx', userId: 'anon_xxx' }
   Response: { sessionUrl: 'https://checkout.stripe.com/...' }
5. Extension opens new tab with Stripe checkout URL
6. Popup shows "Completing purchase..." state
7. User completes payment on Stripe
8. Stripe redirects to success page: https://api.focusblocker.com/success?session_id=xxx
9. Success page sends message to extension via chrome.runtime.sendMessage
10. Extension receives confirmation → stores license → unlocks features
11. Popup refreshes to Pro state with celebration animation
```

### 5.3 Failure Handling

| Failure | User Experience | Recovery |
|---------|----------------|----------|
| Payment declined | Stripe shows error, user retries or changes card | No extension state change |
| User closes checkout tab | Popup detects no completion after 10min → resets to normal | "Still thinking? Your plan is saved." |
| Network error during verification | "Verifying your purchase..." spinner → timeout → retry button | Auto-retry 3x at 5s intervals |
| Webhook delayed | Extension polls `/api/license/check` every 10s for 2min | Eventually consistent |

---

## 6. LICENSE VERIFICATION

### 6.1 Verification Flow

```
Extension starts / popup opens:
  ├─ Read subscription from chrome.storage.local
  ├─ Is tier == 'free'? → Done (no verification needed)
  ├─ Is cachedAt < 24 hours ago? → Use cached status ✓
  ├─ Is cachedAt >= 24 hours ago?
  │   ├─ Try: GET /api/license/verify { licenseKey }
  │   ├─ Success (200) → Update cache, apply status
  │   ├─ Invalid (403) → Downgrade to free, notify user
  │   └─ Network error?
  │       ├─ Is offlineGraceStart set?
  │       │   ├─ Grace < 7 days → Continue as Pro
  │       │   └─ Grace >= 7 days → Downgrade to free
  │       └─ Set offlineGraceStart = now, continue as Pro
  └─ Done
```

### 6.2 Cache Schema

```javascript
"subscription": {
  "tier": "pro",
  "plan": "annual",
  "licenseKey": "FM-XXXX-XXXX-XXXX",  // Encrypted in storage
  "expiresAt": "2027-02-10T00:00:00Z",
  "cachedAt": "2026-02-10T15:30:00Z",
  "offlineGraceStart": null,
  "foundingMember": true,
  "stripeCustomerId": "cus_xxx",  // For customer portal link
  "features": ["unlimited_sites", "reports", "nuclear_24h", ...]  // Server-defined
}
```

---

## 7. SUBSCRIPTION MANAGEMENT

### Settings → Account Section

**Free User View:**
```
┌─────────────────────────────────────┐
│ Account          [Free Plan]        │
│                                     │
│ Upgrade to Pro for $4.99/mo         │
│ ✓ Unlimited sites                   │
│ ✓ Weekly reports & analytics        │
│ ✓ 24-hour nuclear option            │
│ ✓ Cross-device sync                 │
│ + 20 more features                  │
│                                     │
│ [ Upgrade to Pro → ]                │
└─────────────────────────────────────┘
```

**Pro User View:**
```
┌─────────────────────────────────────┐
│ Account          [PRO ✦]            │
│                                     │
│ Plan: Annual ($2.99/mo)             │
│ Renews: Feb 10, 2027               │
│ Member since: Feb 10, 2026         │
│                                     │
│ [ Manage Subscription ]  → Stripe   │
│ [ Billing History ]      → Stripe   │
└─────────────────────────────────────┘
```

**Plan Changes:** All managed via Stripe Customer Portal (hosted by Stripe). Extension links to `https://billing.stripe.com/p/login/xxx`.

---

## 8. TRIAL SYSTEM

### 8.1 Trigger Conditions (NOT on install)

| Trigger | Condition | When |
|---------|-----------|------|
| T1 double-dismiss | User dismisses blurred weekly report 2nd time | Session 6+ |
| T3 double-hit | User hits nuclear limit for 2nd time | After 2nd nuclear session |
| T2 pre-trigger | User adds 10th site (approaching limit) | Any time after session 3 |

### 8.2 Trial Activation

1. Trigger condition met → "Try Pro free for 7 days" banner
2. User clicks "Start Trial" → No credit card required
3. `subscription.tier = 'trial'`, `expiresAt = now + 7 days`
4. All Pro features unlock instantly
5. Trial badge in footer: "Pro Trial — 6 days remaining"

### 8.3 Trial Messaging Cadence

| Day | Message | Location | Tone |
|:---:|---------|----------|------|
| 0 | "Welcome to Pro! Here's what's new" | Popup banner | Celebratory |
| 1 | "Tip: Try unlimited sites" | Popup tooltip | Helpful |
| 2 | "Tip: Check your full weekly report" | Popup tooltip | Helpful |
| 3 | "Tip: Try the 24-hour nuclear option" | Popup tooltip | Helpful |
| 4 | (none) | — | — |
| 5 | "Your trial ends in 2 days" | Footer text | Neutral |
| 6 | "Last day of Pro — keep your features?" | Popup banner | Warm |
| 7 | "Trial ended — upgrade to keep Pro" | Popup banner + notification | Direct |
| 8 | "Miss Pro? 10% off for 48 hours" | Popup banner | Incentive |
| 10+ | (standard free user cadence) | — | Respectful |

### 8.4 Trial Expiration

- Features re-lock gracefully (same as Pro→Free downgrade)
- All data preserved
- Post-trial discount: 10% off for 48 hours ($4.49/mo or $32.29/yr)
- `trialUsed = true` — no re-trial (one chance only)

---

## 9. REFERRAL SYSTEM

### Rewards

| Role | Reward | Limit |
|------|--------|:-----:|
| Referrer | 1 free month of Pro | Max 12 months (12 referrals) |
| Referee | 14-day extended trial (vs standard 7) | 1 per user |

### Mechanics

- Settings → "Invite a Friend" → Generate unique link
- Link format: `https://focusblocker.com/ref/[CODE]`
- Referee installs → link tracked via URL parameter stored on install
- Referee starts trial → referrer credited after referee's 3rd session
- Anti-fraud: max 12 referrals, referee must complete 3 sessions, one referral per device

---

## 10. LAUNCH PRICING PHASES

| Phase | Timing | Monthly | Annual | Lifetime | Cap |
|-------|--------|:-------:|:------:|:--------:|:---:|
| **Beta** | Weeks 1-4 | Free (all Pro) | — | — | — |
| **Founding** | Weeks 5-8 | $2.99/mo | $19.99/yr | $39.99 | 200 members |
| **Ramp** | Months 2-3 | $3.99/mo | $29.99/yr | $49.99 | — |
| **Steady** | Month 4+ | $4.99/mo | $35.88/yr | $59.99+ | — |

**Founding member mechanics:**
- `foundingMember = true` flag in subscription
- Gold "Founding Member" badge in popup (permanent)
- Price grandfathered as long as subscription active
- Counter in upgrade UI: "187/200 founding spots remaining"

**Beta → Founding transition:**
- Beta flag in storage expires on date
- All beta users get "Your Pro access is ending — become a Founding Member" notification
- 48-hour grace period before features lock

---

## 11. REVENUE METRICS

### Conversion Metrics

| Metric | Formula | Target | Alert |
|--------|---------|:------:|:-----:|
| Install-to-active (7d) | Active 7d users / installs | >55% | <40% |
| Active-to-engaged (3+ sessions) | 3+ session users / active | >60% | <45% |
| Engaged-to-paywall-hit | Users who hit any trigger / engaged | >70% | <50% |
| Paywall-to-click | CTA clicks / paywall shows | >15% | <8% |
| Click-to-payment | Completed payments / CTA clicks | >30% | <15% |
| Overall install-to-paid | Paying users / total installs | >2.5% | <1.5% |
| Trial-to-paid | Paid conversions / trial starts | >25% | <15% |
| Monthly churn | Cancellations / active subscribers | <5% | >8% |
| MRR | Sum of monthly recurring revenue | Growing | Declining |
| ARPU | MRR / paying users | $4.50+ | <$3.50 |
| LTV | ARPU / churn rate | >$60 | <$40 |
| CAC payback | Months to recover acquisition cost | <3mo | >6mo |
| Annual plan % | Annual subscribers / total subscribers | >50% | <30% |
| Lifetime purchases | Total lifetime deals sold | Track | — |
| Founding members | Count of founding tier | Track (cap 200) | — |
| Referral rate | Referral installs / total installs | >5% | <2% |
| NPS score | Promoters - Detractors | >30 | <10 |
| Rating | Chrome Web Store average | >4.5 | <4.0 |
| Support tickets/user | Tickets / MAU | <0.5% | >2% |
| Revenue per install | Total revenue / total installs | >$0.40 | <$0.15 |

### A/B Testing Framework

**Priority tests:**

| # | Test | Hypothesis | Metric | Duration |
|---|------|-----------|--------|:--------:|
| 1 | Annual pre-selected vs equal display | Pre-selection increases annual adoption by 20% | Annual plan % | 4 weeks |
| 2 | Blur intensity on reports | Lighter blur increases clicks by 15% | T1 click rate | 3 weeks |
| 3 | Prompt variation A vs E | Curiosity focus outperforms value focus by 10% | CTA click rate | 4 weeks |
| 4 | Trial at 2nd dismiss vs 3rd | Earlier trial increases conversions by 25% | Trial-to-paid | 6 weeks |
| 5 | $4.99 vs $3.99 monthly | $4.99 generates more revenue despite lower conversion | MRR | 8 weeks |

**Implementation:** Feature flags stored in `chrome.storage.local`, user assigned to cohort on install, sticky assignment.

---

## 12. POST-UPGRADE EXPERIENCE

### Immediate (First 5 Seconds)

1. **Extension icon** → Gold dot appears (PRO indicator)
2. **Popup header** → "PRO ✦" badge fades in
3. **All lock icons** → Transform to checkmarks (400ms animation)
4. **Blurred content** → Smoothly unblurs (500ms)
5. **Celebration banner** → "Welcome to Pro! 🎉" with confetti CSS animation

### Welcome Message

```
┌─────────────────────────────────────┐
│  🎉 Welcome to Focus Mode Pro!     │
│                                     │
│  You've unlocked 29 premium         │
│  features. Here are 3 to try first: │
│                                     │
│  1. 📊 View your full Focus Report  │
│  2. 🔥 Set up streak recovery       │
│  3. ⏱️ Create a custom timer        │
│                                     │
│  [ Explore Pro Features → ]         │
└─────────────────────────────────────┘
```

### 7-Day Feature Discovery Drip

| Day | Feature Highlight | Location |
|:---:|------------------|----------|
| 1 | Full weekly report (unblurred) | Popup banner |
| 2 | Custom timer durations | Timer tooltip |
| 3 | Extended nuclear (24hr) | Nuclear section tooltip |
| 4 | Cross-device sync setup | Settings prompt |
| 5 | Sound library + mixing | Sounds section tooltip |
| 6 | Calendar integration | Settings prompt |
| 7 | "You've discovered 7 Pro features!" | Celebration popup |

**Goal:** 5+ Pro features used by Day 7 → correlates with 85%+ 30-day retention.

---

*Monetization specification generated for Phase 04 — Deployment System*
*Every paywall, prompt, payment flow, and timing rule specified for direct implementation*
