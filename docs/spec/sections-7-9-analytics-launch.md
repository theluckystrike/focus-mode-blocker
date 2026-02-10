# Focus Mode - Blocker: Extension Specification
## Sections 7-9: Analytics & Tracking, Launch Checklist, Success Criteria

> **Document Version:** 1.0
> **Date:** February 10, 2026
> **Status:** Specification Complete
> **Pricing Reference:** Free / Pro $4.99/mo ($35.88/yr) / Team $3.99/user/mo

---

# SECTION 7: ANALYTICS & TRACKING

---

## 7.1 Analytics Provider

### Recommended Solution: Mixpanel (Primary) + PostHog (Self-Hosted Backup)

**Primary: Mixpanel**

| Attribute | Details |
|-----------|---------|
| Provider | Mixpanel (Free tier: 20M events/month) |
| Compliance | GDPR compliant, CCPA compliant, SOC 2 Type II certified |
| Implementation | Client-side JavaScript SDK within the extension popup, background service worker, and content scripts |
| Data residency | EU data residency option available for GDPR |
| Cost (Year 1) | Free tier covers up to ~20M events/month (sufficient through 50,000+ MAU) |

**Why Mixpanel Over Alternatives:**

| Provider | Pros | Cons | Verdict |
|----------|------|------|---------|
| **Mixpanel** | Best-in-class funnel analysis, free 20M events/month, strong cohort analysis, retroactive funnel building, Chrome extension SDK support | Requires careful event design upfront; can become expensive at scale beyond free tier | **Selected** -- funnel analysis is critical for conversion optimization |
| **Amplitude** | Strong product analytics, free 10M events/month, behavioral cohorting | Lower free tier limit (10M vs 20M), heavier SDK, less intuitive funnel builder | Good alternative but lower free limit |
| **PostHog** | Self-hosted option (full data ownership), session recording, feature flags, open source | Requires infrastructure to self-host; cloud free tier is 1M events/month | **Selected as backup** -- self-hosted for privacy-sensitive users |
| **Google Analytics 4** | Free, familiar, large ecosystem | Not designed for product analytics; poor funnel analysis; poor event-level user tracking; privacy concerns for a "privacy-first" extension | Rejected -- contradicts our privacy positioning |
| **Plausible / Simple Analytics** | Privacy-first, lightweight | No funnel analysis, no cohort analysis, designed for websites not product analytics | Rejected -- insufficient product analytics depth |

### Implementation Approach

**Client-Side with Privacy Proxy:**

```
Extension (client) --> Privacy Proxy (our server) --> Mixpanel API
```

- All analytics events fire from the extension's background service worker (Manifest V3)
- Events are routed through a lightweight privacy proxy (Cloudflare Worker or small Node server) that strips IP addresses before forwarding to Mixpanel
- No Personally Identifiable Information (PII) is ever sent -- only anonymous user IDs generated at install time
- The proxy approach means Mixpanel never sees raw IP addresses, strengthening our privacy claims

**PostHog Self-Hosted (Backup):**

- Deploy a PostHog instance on a small VPS ($5-10/month) as a secondary analytics destination
- All events are dual-shipped to both Mixpanel and PostHog
- PostHog serves as an insurance policy if Mixpanel pricing changes or we need full data ownership
- PostHog also provides session recording and feature flags for A/B testing

### User Consent Handling

**Consent Flow:**

1. **On first install:** Show a single-screen consent dialog before any analytics fire:
   > "Focus Mode - Blocker collects anonymous usage data to improve the product. We never collect browsing history, personal information, or the names of websites you block. You can opt out at any time in Settings."
   >
   > [Accept & Continue] [Opt Out & Continue]

2. **Opt-out users:** Analytics SDK is never initialized. A local flag `analytics_opted_out = true` is stored in `chrome.storage.local`. All analytics wrapper functions check this flag and short-circuit.

3. **Settings page toggle:** A visible "Anonymous Analytics" toggle in Settings allows users to change their preference at any time. Changing to "off" immediately stops all event collection and sends a single `analytics_opted_out` event before shutting down.

4. **No data collection before consent:** Zero events fire until the user explicitly clicks "Accept & Continue." The install event is retroactively sent with the consent event timestamp.

---

## 7.2 Events to Track

### Installation & Onboarding Events

| Event Name | Trigger | Properties | Category |
|------------|---------|------------|----------|
| `extension_installed` | Extension is installed from Chrome Web Store | `install_source` (web_store, direct, referral), `browser_version`, `os`, `referral_code` (if applicable), `timestamp` | Onboarding |
| `consent_granted` | User clicks "Accept & Continue" on analytics consent dialog | `time_to_consent_ms`, `timestamp` | Onboarding |
| `consent_denied` | User clicks "Opt Out & Continue" on analytics consent dialog | `timestamp` | Onboarding |
| `onboarding_started` | Onboarding flow begins (first screen shown) | `is_pro_trial` (boolean), `timestamp` | Onboarding |
| `onboarding_step_completed` | User completes a step in onboarding | `step_number` (1-4), `step_name` (add_sites, set_schedule, customize_block_page, choose_sounds), `time_on_step_ms` | Onboarding |
| `onboarding_completed` | User finishes all onboarding steps | `total_duration_ms`, `steps_completed` (count), `sites_added` (count), `skipped_steps` (array), `is_pro_trial` | Onboarding |
| `onboarding_skipped` | User clicks "Skip" during onboarding | `skipped_at_step` (number), `time_spent_ms` | Onboarding |
| `first_site_added` | User adds their first site to the blocklist | `site_category` (social, news, entertainment, other), `method` (manual, pre_built_list), `time_since_install_ms` | Onboarding |
| `quick_focus_first_use` | User clicks Quick Focus for the first time | `time_since_install_ms`, `sites_blocked_count` | Onboarding |
| `extension_uninstalled` | Extension is removed (captured via `chrome.runtime.setUninstallURL`) | `days_since_install`, `total_sessions`, `was_pro`, `last_active_date` | Onboarding |

### Feature Usage Events

| Event Name | Trigger | Properties | Category |
|------------|---------|------------|----------|
| `site_added` | User adds a site to blocklist | `method` (manual, pre_built_list, import), `total_sites_count`, `is_at_limit` (boolean), `site_category` | Feature |
| `site_removed` | User removes a site from blocklist | `total_sites_count`, `days_since_added` | Feature |
| `pre_built_list_enabled` | User enables a pre-built block list | `list_name` (social_media, news), `sites_in_list_count` | Feature |
| `blocklist_limit_reached` | User hits the 10-site free limit | `time_since_install_days`, `total_sessions_count` | Feature |
| `block_page_viewed` | User lands on a block page (distraction attempt) | `blocked_site_category`, `session_active` (boolean), `time_in_session_ms`, `attempt_number_today` | Feature |
| `block_page_interaction` | User interacts with the block page | `action` (back_to_work, view_quote, view_stats, go_back, close_tab), `time_on_page_ms` | Feature |
| `schedule_created` | User creates a blocking schedule | `schedule_type` (weekday, weekend, custom), `hours_covered`, `is_first_schedule` | Feature |
| `nuclear_option_activated` | User activates the nuclear option | `duration_minutes`, `sites_count`, `tier` (free_1hr, pro_extended) | Feature |
| `nuclear_option_completed` | Nuclear timer expires naturally | `duration_minutes`, `distraction_attempts_during` | Feature |
| `pomodoro_started` | User starts a Pomodoro timer | `duration_minutes` (25 for free), `session_type` (quick_focus, manual, scheduled), `sites_blocked_count` | Feature |
| `pomodoro_completed` | Pomodoro timer reaches zero | `duration_minutes`, `distraction_attempts`, `breaks_taken`, `completion_rate_pct` | Feature |
| `pomodoro_abandoned` | User manually stops a Pomodoro before completion | `duration_completed_minutes`, `duration_total_minutes`, `reason` (manual_stop, browser_closed, extension_disabled), `distraction_attempts` | Feature |
| `ambient_sound_played` | User starts an ambient sound | `sound_name`, `tier` (free, pro), `during_session` (boolean) | Feature |
| `ambient_sound_stopped` | User stops an ambient sound | `sound_name`, `play_duration_ms` | Feature |
| `focus_buddy_invited` | User sends a buddy invite | `method` (link, email), `is_first_invite` | Feature |
| `focus_buddy_accepted` | An invited buddy installs the extension | `referral_code`, `inviter_tier` (free, pro) | Feature |
| `streak_milestone_reached` | User hits a streak milestone | `streak_days` (3, 7, 14, 30, 60, 90, 180, 365), `tier` | Feature |
| `notification_muting_toggled` | User toggles notification muting | `state` (on, off), `during_session` (boolean) | Feature |
| `popup_opened` | User opens the extension popup | `current_session_active` (boolean), `streak_days`, `total_sessions_today` | Feature |
| `settings_viewed` | User opens the settings page | `time_since_last_settings_view_days` | Feature |

### Session Events

| Event Name | Trigger | Properties | Category |
|------------|---------|------------|----------|
| `focus_session_started` | Any focus session begins (Pomodoro, Quick Focus, scheduled, nuclear) | `session_type` (quick_focus, pomodoro, scheduled, nuclear), `duration_minutes`, `sites_blocked_count`, `trigger` (manual, auto_start, schedule) | Session |
| `focus_session_completed` | Session timer reaches zero without interruption | `session_type`, `duration_minutes`, `distraction_attempts`, `focus_score`, `sites_blocked_count`, `sounds_used` (boolean) | Session |
| `focus_session_abandoned` | Session ended early by user action | `session_type`, `duration_completed_minutes`, `duration_total_minutes`, `completion_pct`, `distraction_attempts`, `abandon_reason` (manual, browser_closed) | Session |
| `distraction_attempt` | User tries to visit a blocked site during a session | `session_type`, `time_in_session_ms`, `attempt_number_in_session`, `blocked_site_category`, `action_taken` (back_to_work, stayed_on_page, new_tab) | Session |
| `break_started` | Pomodoro break begins | `break_duration_minutes`, `break_number_in_cycle`, `session_duration_minutes` | Session |
| `break_ended` | Pomodoro break ends (user resumes or auto-resumes) | `break_duration_minutes`, `break_extended` (boolean), `resumed_method` (auto, manual) | Session |
| `focus_score_calculated` | Focus Score is computed after a session | `score` (0-100), `session_duration_minutes`, `distraction_attempts`, `completion_rate_pct`, `trend` (up, down, stable) | Session |
| `daily_stats_viewed` | User views their daily statistics | `focus_time_today_minutes`, `distraction_attempts_today`, `sessions_today`, `streak_days` | Session |
| `focus_goal_set` | User sets a daily focus goal | `goal_minutes`, `is_first_goal`, `tier` | Session |
| `focus_goal_achieved` | User meets their daily focus goal | `goal_minutes`, `actual_minutes`, `streak_days` | Session |

### Paywall & Conversion Events

| Event Name | Trigger | Properties | Category |
|------------|---------|------------|----------|
| `paywall_shown` | Any upgrade prompt is displayed to the user | `trigger_type` (site_limit, weekly_report, nuclear_extend, feature_locked, session_limit, manual_explore), `days_since_install`, `total_sessions`, `paywall_variant` (A/B test ID) | Conversion |
| `paywall_dismissed` | User closes or dismisses the upgrade prompt | `trigger_type`, `time_on_paywall_ms`, `action` (close, maybe_later, x_button) | Conversion |
| `paywall_upgrade_clicked` | User clicks an upgrade/subscribe button on the paywall | `trigger_type`, `plan_selected` (monthly, annual), `price_shown`, `discount_applied` (boolean), `discount_pct` | Conversion |
| `pro_trial_started` | User begins a 7-day Pro trial | `trigger_type`, `days_since_install`, `total_sessions`, `sites_count` | Conversion |
| `pro_trial_day_reminder` | Trial reminder is shown (day 5, 6, 7) | `trial_day`, `features_used_during_trial` (array), `sessions_during_trial` | Conversion |
| `pro_trial_expired` | 7-day trial ends without conversion | `features_used_during_trial` (array), `sessions_during_trial`, `sites_at_expiry` | Conversion |
| `pro_trial_converted` | User subscribes during or at the end of a trial | `trial_day_converted`, `plan_selected` (monthly, annual), `features_used` (array) | Conversion |
| `payment_started` | User enters the payment flow | `plan` (pro_monthly, pro_annual, team), `price`, `source` (paywall, settings, trial_end) | Conversion |
| `payment_completed` | Payment is successfully processed | `plan`, `price`, `payment_method` (card, paypal), `is_founding_member` (boolean), `coupon_code` | Conversion |
| `payment_failed` | Payment attempt fails | `plan`, `error_type` (card_declined, insufficient_funds, network_error, other), `retry_count` | Conversion |
| `subscription_renewed` | Recurring payment processes successfully | `plan`, `months_subscribed`, `price` | Conversion |
| `subscription_cancelled` | User cancels their Pro/Team subscription | `plan`, `months_subscribed`, `cancel_reason` (too_expensive, not_using, found_alternative, missing_feature, other), `cancel_feedback_text` | Conversion |
| `subscription_reactivated` | Previously cancelled user re-subscribes | `plan`, `days_since_cancellation`, `reactivation_source` (email, in_app, winback_offer) | Conversion |

### Engagement & Retention Events

| Event Name | Trigger | Properties | Category |
|------------|---------|------------|----------|
| `daily_active` | User performs any meaningful action on a given day (deduplicated per day) | `sessions_today`, `focus_time_today_minutes`, `distraction_attempts_today`, `tier`, `streak_days` | Engagement |
| `weekly_active` | User is active on 3+ days in a 7-day window | `active_days_this_week`, `total_focus_time_week_minutes`, `tier` | Engagement |
| `weekly_report_generated` | Weekly Focus Report is created (Pro feature) | `total_focus_hours`, `total_distractions`, `top_distraction_site_category`, `focus_score_avg`, `trend_vs_last_week` | Engagement |
| `weekly_report_viewed` | User views their weekly report | `time_on_report_ms`, `sections_expanded` (array) | Engagement |
| `blurred_insight_clicked` | Free user clicks on a blurred/locked analytics insight | `insight_type` (peak_focus_time, top_distraction, weekly_trend, focus_score_breakdown), `days_since_install` | Engagement |
| `achievement_unlocked` | User earns a badge or achievement | `achievement_name`, `achievement_category` (sessions, streaks, focus_time, distractions_blocked), `tier` | Engagement |
| `focus_email_sent` | Weekly focus summary email is dispatched | `focus_hours_week`, `percentile_rank`, `locked_metrics_count`, `tier` | Engagement |
| `focus_email_opened` | User opens the weekly email | `time_since_sent_hours`, `tier` | Engagement |
| `focus_email_cta_clicked` | User clicks a CTA in the weekly email | `cta_type` (view_report, upgrade, start_session), `tier` | Engagement |
| `referral_link_shared` | User copies or shares their referral link | `share_method` (copy, twitter, linkedin, email), `tier` | Engagement |

### Error & Performance Events

| Event Name | Trigger | Properties | Category |
|------------|---------|------------|----------|
| `extension_error` | JavaScript error occurs in any extension context | `error_type`, `error_message` (sanitized -- no URLs or PII), `context` (popup, background, content_script, block_page), `extension_version` | Error |
| `blocking_failure` | A site that should be blocked is not blocked | `failure_reason` (rule_not_applied, timing_issue, manifest_conflict, unknown), `site_category`, `extension_version` | Error |
| `payment_error` | Payment processing encounters an error beyond card decline | `error_type` (timeout, api_error, validation_error), `payment_provider`, `retry_count` | Error |
| `sync_failure` | Cross-device sync fails (Pro feature) | `error_type` (network, auth, conflict, quota), `devices_count` | Error |
| `performance_metric` | Collected every 24 hours per active user | `popup_load_time_ms`, `block_page_load_time_ms`, `memory_usage_mb`, `service_worker_wake_time_ms`, `extension_version`, `chrome_version` | Error |
| `api_latency` | Any API call to our server takes longer than 2 seconds | `endpoint`, `latency_ms`, `status_code`, `request_type` | Error |
| `storage_quota_warning` | Local storage usage exceeds 80% of Chrome extension quota | `usage_bytes`, `quota_bytes`, `usage_pct` | Error |

---

## 7.3 Conversion Funnel

### Full Funnel Definition

```
Install --> Active (7d) --> Engaged (3+ sessions) --> Limit Hit --> Paywall Shown --> Upgrade Click --> Payment Start --> Payment Complete --> Retained (30d)
```

### Stage-by-Stage Breakdown

#### Stage 1: Install

| Attribute | Details |
|-----------|---------|
| **Definition** | User installs the extension from the Chrome Web Store (or direct link). Tracked by `extension_installed` event. |
| **Expected % entering** | 100% (baseline) |
| **Expected % to next stage (Active 7d)** | 55-65% |
| **Key metrics** | Daily installs, install source distribution, uninstall rate (24hr, 48hr, 7d) |
| **Optimization levers** | Chrome Web Store listing quality (screenshots, description, title SEO), star rating (target 4.7+), store category ranking, external marketing (Product Hunt, Reddit, YouTube), referral program effectiveness |

#### Stage 2: Active (7d)

| Attribute | Details |
|-----------|---------|
| **Definition** | User performs at least 1 meaningful action (start a session, add a site, or view stats) within 7 days of install. Tracked by `daily_active` event within the 7-day window. |
| **Expected % of installs** | 55-65% |
| **Expected % to next stage (Engaged)** | 50-60% |
| **Key metrics** | D1 retention rate, D7 retention rate, time-to-first-action, actions per session in first 7 days |
| **Optimization levers** | Onboarding completion rate (target 80%+), Quick Focus visibility and ease-of-use, first-session value delivery (block page quality, distraction counter display), push notification for re-engagement at day 2 and day 5 if inactive |

#### Stage 3: Engaged (3+ sessions)

| Attribute | Details |
|-----------|---------|
| **Definition** | User has completed 3 or more focus sessions (Pomodoro, Quick Focus, or nuclear) within their first 14 days. Tracked by counting `focus_session_completed` events. |
| **Expected % of installs** | 30-40% |
| **Expected % to next stage (Limit Hit)** | 40-55% |
| **Key metrics** | Sessions per user per week, average session duration, session completion rate (completed vs abandoned), time between sessions |
| **Optimization levers** | Session completion UX (countdown visibility, motivational block page quality), streak mechanics (visible from session 2+), break reminder quality, ambient sound engagement, Quick Focus default configuration quality |

#### Stage 4: Limit Hit

| Attribute | Details |
|-----------|---------|
| **Definition** | User encounters at least one free tier limitation: 10-site blocklist cap, weekly report locked, nuclear option limited to 1 hour, or clicks a PRO-locked feature. Tracked by `blocklist_limit_reached`, `blurred_insight_clicked`, or any locked feature interaction. |
| **Expected % of installs** | 15-25% |
| **Expected % to next stage (Paywall Shown)** | 85-95% |
| **Key metrics** | Which limit is hit first (distribution), days-to-first-limit, feature-specific limit hit rates, user engagement level at limit hit |
| **Optimization levers** | Limit calibration (10 sites is generous enough to demonstrate value but restrictive enough to create friction), PRO badge visibility in settings, blurred analytics preview quality, weekly report notification timing (after 5th session) |

#### Stage 5: Paywall Shown

| Attribute | Details |
|-----------|---------|
| **Definition** | User sees an explicit upgrade prompt with pricing information. Tracked by `paywall_shown` event. Includes site limit paywall, weekly report paywall, feature lock paywall, and trial end paywall. |
| **Expected % of installs** | 14-22% |
| **Expected % to next stage (Upgrade Click)** | 12-18% |
| **Key metrics** | Paywall trigger type distribution, time-to-first-paywall (target: day 3-7), paywall view-to-click rate by trigger type, paywall dismissal rate, repeat paywall exposure count |
| **Optimization levers** | Paywall copy and design (A/B test), trigger timing (engagement-based vs time-based -- engagement triggers outperform by 25%), value summary on paywall (show user's own stats), pricing display (monthly vs annual emphasis), trial offer prominence |

#### Stage 6: Upgrade Click

| Attribute | Details |
|-----------|---------|
| **Definition** | User clicks "Upgrade to Pro," "Start Free Trial," or equivalent CTA on any paywall surface. Tracked by `paywall_upgrade_clicked` event. |
| **Expected % of installs** | 2.0-3.5% |
| **Expected % to next stage (Payment Start)** | 55-70% |
| **Key metrics** | Click-through rate by paywall variant, plan preference (monthly vs annual), trial start rate vs direct purchase rate, time from paywall shown to click |
| **Optimization levers** | CTA button copy and color, plan presentation (pre-select annual), trial offer (7 days free reduces friction), social proof on paywall ("Join 500+ focused professionals"), urgency elements (founding member pricing, limited discount) |

#### Stage 7: Payment Start

| Attribute | Details |
|-----------|---------|
| **Definition** | User enters the payment form and begins entering payment information (or selects a trial that requires payment details). Tracked by `payment_started` event. |
| **Expected % of installs** | 1.2-2.5% |
| **Expected % to next stage (Payment Complete)** | 75-85% |
| **Key metrics** | Payment form abandonment rate, payment method distribution (card vs PayPal), error rate by payment method, time on payment form |
| **Optimization levers** | Payment form simplicity (minimal fields), payment provider reliability (Stripe recommended), multiple payment methods (card + PayPal), trust signals (SSL badge, money-back guarantee), form validation UX (real-time error messages) |

#### Stage 8: Payment Complete

| Attribute | Details |
|-----------|---------|
| **Definition** | Payment is successfully processed and Pro features are activated. Tracked by `payment_completed` event. |
| **Expected % of installs** | 1.0-2.0% (Month 1), 2.0-3.5% (Month 6+, optimized) |
| **Expected % to next stage (Retained 30d)** | 80-88% |
| **Key metrics** | Conversion rate (installs to payment), revenue per install, MRR, plan mix (monthly vs annual), founding member uptake, coupon usage rate |
| **Optimization levers** | Immediate post-purchase value (unlock blurred insights instantly, show PRO badge, display score breakdown), welcome email series, feature discovery prompts during first Pro week, satisfaction survey at day 7 |

#### Stage 9: Retained (30d)

| Attribute | Details |
|-----------|---------|
| **Definition** | Paying user remains subscribed and active (at least 1 session per week) 30 days after first payment. Tracked by subscription status + `weekly_active` event. |
| **Expected % of paying users** | 80-88% |
| **Key metrics** | 30-day retention rate (paying users), monthly churn rate (target <6%), feature usage breadth (how many Pro features used), NPS score, support ticket rate |
| **Optimization levers** | Ongoing value delivery (weekly reports, new insights, streak recovery), feature adoption nudges (highlight unused Pro features), cancellation save flow (offer discount, pause, or annual switch), re-engagement emails for lapsed paying users |

### Funnel Summary Table

| Stage | % of Installs (Conservative) | % of Installs (Optimistic) | Drop-off to Next |
|-------|:----------------------------:|:--------------------------:|:-----------------:|
| Install | 100% | 100% | -- |
| Active (7d) | 55% | 65% | 35-45% |
| Engaged (3+ sessions) | 30% | 40% | 25-35% |
| Limit Hit | 15% | 25% | 15-25% |
| Paywall Shown | 14% | 22% | 1-3% |
| Upgrade Click | 2.0% | 3.5% | 12-18.5% |
| Payment Start | 1.2% | 2.5% | 0.8-1.0% |
| Payment Complete | 1.0% | 2.0% | 0.2-0.5% |
| Retained (30d) | 0.8% | 1.8% | 0.2% |

---

## 7.4 Dashboards & Reporting

### Real-Time Dashboard (Live Monitoring)

**Purpose:** Monitor extension health and key events in real time. Displayed on a wall monitor or browser tab during launch and high-traffic periods.

**Metrics displayed:**

| Metric | Update Frequency | Alert Threshold |
|--------|:----------------:|:---------------:|
| Active users (right now) | Every 60 seconds | Drop >50% in 5 min |
| Installs today | Every 5 minutes | <10 by noon (post-launch) |
| Uninstalls today | Every 5 minutes | Uninstall rate >15% of day's installs |
| Sessions started (today) | Every 5 minutes | <50% of yesterday |
| Payment completions (today) | Every 5 minutes | 0 for >6 hours |
| Extension errors (today) | Every 60 seconds | >50 unique errors/hour |
| Block failures (today) | Every 60 seconds | Any (blocking must be 100% reliable) |
| Average popup load time (rolling 1hr) | Every 5 minutes | >500ms |
| Payment error rate (rolling 1hr) | Every 5 minutes | >5% |

### Daily Digest (Automated Email, 8:00 AM)

**Purpose:** Quick morning health check. Sent to the founding team daily.

**Contents:**

1. **Headline metrics (vs yesterday, vs 7-day avg):**
   - New installs (count, % change)
   - Active users (DAU, % change)
   - New Pro subscribers (count)
   - MRR (current, $ change)
   - Uninstalls (count, uninstall rate %)

2. **Funnel snapshot:**
   - Paywall shown count
   - Paywall-to-click conversion rate
   - Payment completion rate
   - Trial starts

3. **Quality indicators:**
   - Average Chrome Web Store rating (current, new reviews count)
   - Extension error count
   - Support tickets opened
   - Blocking failure count (must be 0)

4. **Top event of the day:**
   - Highest-volume unusual event or notable anomaly

### Weekly Analysis (Monday Morning Report)

**Purpose:** Identify trends and inform weekly prioritization decisions.

**Contents:**

1. **Growth trends (4-week rolling comparison):**
   - Install trend (weekly count, week-over-week growth %)
   - DAU/WAU trend line
   - DAU/MAU ratio (engagement depth)
   - New vs returning user ratio

2. **Conversion analysis:**
   - Full funnel conversion rates (each stage, week-over-week)
   - Paywall trigger performance (which triggers convert best)
   - A/B test results (if running)
   - Trial-to-paid conversion rate
   - Time-to-first-paywall distribution

3. **Engagement analysis:**
   - Sessions per user per week (distribution histogram)
   - Average session duration trend
   - Session completion rate trend
   - Feature usage ranking (top 10 features by usage count)
   - Ambient sound usage patterns
   - Streak length distribution

4. **Retention cohort:**
   - D1, D7, D14 retention rates for this week's install cohort
   - Retention comparison across last 4 weekly cohorts
   - Churn rate (paying users)

5. **Revenue:**
   - Weekly revenue (MRR trend)
   - Plan mix (monthly vs annual, % shift)
   - ARPU trend
   - Refund/chargeback count

### Monthly Review (First Business Day of Month)

**Purpose:** Strategic decision-making and investor/stakeholder reporting.

**Contents:**

1. **Executive summary:**
   - Total users (cumulative installs, active users)
   - MRR and ARR run-rate
   - Conversion rate (install to paid)
   - Net revenue (after refunds and chargebacks)

2. **Cohort analysis:**
   - Monthly cohort retention curves (D1, D7, D14, D30 for each monthly cohort)
   - Cohort revenue (LTV by monthly cohort)
   - Free-to-paid conversion rate by monthly cohort

3. **Product usage deep dive:**
   - Feature adoption rates (% of active users using each feature)
   - Pro feature usage (which Pro features are most/least used)
   - Feature correlation with retention (which features predict 30-day retention)
   - Block page engagement metrics

4. **Competitive monitoring:**
   - Chrome Web Store ranking (category position)
   - Competitor rating changes
   - New competitor entrants
   - Feature parity check

5. **Financial projections:**
   - MRR forecast (next 3 months based on current growth)
   - CAC and LTV estimates
   - Runway impact

6. **Strategic recommendations:**
   - Top 3 opportunities identified from data
   - Top 3 risks identified from data
   - A/B test roadmap for next month

---

## 7.5 A/B Testing Framework

### Prioritized Test Backlog

| Priority | Test Name | Hypothesis | Control (A) | Variant (B) | Primary Metric | Min Sample Size | Duration |
|:--------:|-----------|-----------|-------------|-------------|----------------|:--------------:|:--------:|
| 1 | **Paywall trigger timing** | Engagement-based triggers (5th session) outperform time-based (day 5) by 25%+ | Show paywall on day 5 regardless of sessions | Show paywall after 5th completed session regardless of day | Paywall-to-upgrade click rate | 1,000 users per arm | 4 weeks |
| 2 | **Paywall copy: stats vs features** | Showing the user's own stats on the paywall increases conversion vs a generic feature list | Feature list: "Unlimited blocking, weekly reports, cross-device sync..." | Personal stats: "You blocked 127 distractions and focused for 11 hours. Unlock your full report..." | Paywall-to-upgrade click rate | 1,000 users per arm | 3 weeks |
| 3 | **Annual plan pre-selection** | Pre-selecting the annual plan increases annual plan adoption without reducing overall conversion | Monthly plan pre-selected, annual shown below | Annual plan pre-selected with "SAVE 40%" badge, monthly shown below | Annual plan selection rate, overall conversion rate | 500 paying users per arm | 6 weeks |
| 4 | **Trial: 7 days vs 14 days** | 14-day trial increases trial-to-paid conversion because users invest more time and data | 7-day Pro trial | 14-day Pro trial | Trial-to-paid conversion rate | 500 trial users per arm | 8 weeks |
| 5 | **Block page CTA** | A subtle Pro mention on the block page increases paywall-driven conversions without annoying free users | Block page with motivational quote only | Block page with quote + subtle footer: "Pro members see: custom pages, focus music, streak stats" | Paywall encounters from block page, uninstall rate | 2,000 users per arm | 4 weeks |
| 6 | **Onboarding: 3 steps vs 4 steps** | Shorter onboarding increases completion rate without reducing engagement | 4-step onboarding (sites, schedule, block page, sounds) | 3-step onboarding (sites, quick focus demo, sounds) | Onboarding completion rate, D7 retention | 1,000 users per arm | 3 weeks |
| 7 | **Free site limit: 8 vs 10 vs 12** | Lower limit increases conversion but may increase uninstalls; higher limit reduces conversion but improves retention | 10-site limit (current) | 8-site limit (Variant B1) and 12-site limit (Variant B2) | Conversion rate, uninstall rate, D30 retention | 1,500 users per arm (3 arms) | 6 weeks |
| 8 | **Post-session urgency offer** | A time-limited discount after the user's best-ever session converts better than a standard paywall | Standard paywall (no discount) | "30% off Pro for 24 hours" after user achieves personal best session | Paywall-to-payment rate, revenue per user | 1,000 users per arm | 4 weeks |

### Test Structure

- **Randomization:** Users are assigned to A or B at the time of the randomization event (install for onboarding tests, first paywall encounter for paywall tests) using a deterministic hash of their anonymous user ID
- **Sticky assignment:** Once assigned, a user stays in their group for the duration of the test (stored in `chrome.storage.local`)
- **Mutual exclusivity:** Only 1 test runs at a time for any given user to avoid interaction effects. If multiple tests are active, users are assigned to one test based on hash ranges
- **Feature flags:** Tests are controlled via PostHog feature flags (self-hosted), allowing instant kill-switch and gradual rollout (10% -> 50% -> 100%)

### Sample Size Requirements

Using 80% statistical power, 5% significance level (two-tailed):

| Expected Baseline Rate | Minimum Detectable Effect | Sample Size Per Arm |
|:-----------------------:|:------------------------:|:-------------------:|
| 2% (conversion rate) | 25% relative lift (to 2.5%) | ~15,000 |
| 5% (paywall click rate) | 20% relative lift (to 6%) | ~7,500 |
| 15% (paywall click rate, optimistic) | 15% relative lift (to 17.25%) | ~5,000 |
| 60% (onboarding completion) | 10% relative lift (to 66%) | ~1,000 |
| 80% (session completion) | 5% relative lift (to 84%) | ~2,000 |

**Practical implication:** At conservative install volumes (500/month early on), most conversion rate tests will require 3-6 months to reach significance. Prioritize tests on higher-volume events (paywall shown, onboarding completion) first. Use the optimistic install scenario (2,000/month) to accelerate testing timelines.

### Success Criteria for Each Test

- **Statistical significance:** p < 0.05 (two-tailed) for the primary metric
- **Practical significance:** Minimum 10% relative improvement in primary metric
- **No harm check:** Variant must not degrade secondary metrics (uninstall rate, D7 retention, NPS) by more than 5% relative
- **Duration minimum:** Run each test for at least 2 full weekly cycles (14 days) to account for day-of-week effects
- **Decision framework:**
  - Both stat-sig AND practical-sig: Ship the variant
  - Stat-sig but NOT practical-sig: Do not ship; the lift is real but too small to matter
  - NOT stat-sig: Inconclusive; extend test or declare null result and move on
  - Negative result: Kill variant immediately if primary metric degrades by >15% relative at any weekly checkpoint

### Implementation Approach

1. **PostHog Feature Flags:** All A/B tests use PostHog's self-hosted feature flag system. Flags are evaluated in the extension's background service worker at the time of the relevant event.
2. **Event properties:** Every analytics event includes `ab_test_name` and `ab_test_variant` properties so all Mixpanel analyses can be segmented by test group.
3. **Gradual rollout:** New variants start at 10% traffic for 48 hours (safety check), then expand to 50/50 if no negative signals.
4. **Kill switch:** Any test can be instantly killed from the PostHog dashboard, reverting all users to the control experience.

---

## 7.6 Privacy & Compliance

### Data We Collect

| Data Type | Collected | Storage Location | Purpose |
|-----------|:---------:|:----------------:|---------|
| Anonymous user ID (UUID generated at install) | Yes | `chrome.storage.local` + analytics | Deduplicate users, track funnel progression |
| Event data (actions taken in extension) | Yes (if opted in) | Mixpanel + PostHog | Product analytics and conversion optimization |
| Focus session metadata (duration, completion, score) | Yes (if opted in) | Mixpanel + PostHog | Session analytics |
| Extension version | Yes | Analytics | Version adoption tracking |
| Browser version and OS (generic) | Yes | Analytics | Compatibility monitoring |
| Blocked site count (number only) | Yes (if opted in) | Analytics | Feature usage tracking |
| Aggregate distraction attempt count | Yes (if opted in) | Analytics | Engagement metrics |
| Subscription status (free/pro/team) | Yes | Our server + analytics | Revenue tracking |
| Email address (Pro/Team users only) | Yes | Our server (encrypted) | Account management, billing, weekly report delivery |
| Payment information | No (handled by Stripe) | Stripe only | We never see or store card numbers |

### Data We NEVER Collect

| Data Type | Collected | Explanation |
|-----------|:---------:|-------------|
| URLs of blocked websites | **Never** | We track category (social, news) and count, never specific URLs |
| Browsing history | **Never** | We have no access to and no interest in browsing history |
| Page content | **Never** | Content scripts only inject the block page; they do not read page content |
| Keystroke data | **Never** | No keylogging of any kind |
| Personal information (name, address, phone) | **Never** | Only email for Pro/Team account management |
| IP addresses | **Never stored** | Stripped by our privacy proxy before reaching analytics providers |
| Third-party cookies or tracking | **Never** | No third-party trackers, no ad networks, no data brokers |
| Data from non-blocked sites | **Never** | Extension only activates on sites in the user's blocklist |
| Screen recordings or screenshots | **Never** | No visual capture of any kind |

### GDPR Compliance Requirements

| Requirement | Implementation |
|-------------|---------------|
| **Lawful basis** | Consent (explicit opt-in before any data collection) |
| **Right to access (Article 15)** | Settings page includes "Download My Data" button that exports all stored analytics data as JSON |
| **Right to erasure (Article 17)** | Settings page includes "Delete My Data" button that sends a deletion request to both Mixpanel and PostHog, and removes all local data |
| **Right to portability (Article 20)** | "Download My Data" provides machine-readable JSON export |
| **Data minimization (Article 5)** | Only collect events necessary for product improvement; no URL tracking, no PII, no browsing history |
| **Consent withdrawal** | Analytics toggle in Settings; turning off immediately stops collection and fires `analytics_opted_out` event |
| **Data Processing Agreement** | DPA signed with Mixpanel (available on their website); PostHog self-hosted means we are the processor |
| **EU data residency** | Mixpanel EU data center option enabled; PostHog hosted in EU region |
| **Privacy by design** | Anonymous IDs by default, IP stripping at proxy layer, no PII in event properties |

### CCPA Compliance Requirements

| Requirement | Implementation |
|-------------|---------------|
| **Right to know** | Privacy policy clearly lists all data collected and purposes |
| **Right to delete** | "Delete My Data" button available in Settings |
| **Right to opt out of sale** | We do not sell data. Privacy policy explicitly states: "We never sell, share, or trade your data with third parties." |
| **Non-discrimination** | Opting out of analytics does not degrade product functionality |

### User Data Deletion Flow

```
User clicks "Delete My Data" in Settings
    |
    v
Confirmation dialog: "This will permanently delete all your analytics data
from our servers. Your local settings (blocklist, preferences) will remain
on this device. This action cannot be undone."
    |
    +-- [Cancel] --> Return to Settings
    |
    +-- [Delete Everything] -->
            |
            +-- Send deletion request to Mixpanel (via API: delete user profile + events)
            +-- Send deletion request to PostHog (via API: delete person + events)
            +-- Clear `chrome.storage.local` analytics data
            +-- Set `analytics_opted_out = true`
            +-- Generate new anonymous user ID (breaks linkage to old data)
            +-- Show confirmation: "Your data has been deleted. Analytics have been turned off."
            |
            +-- Deletion confirmed within 30 days (Mixpanel SLA)
            +-- PostHog self-hosted: deleted immediately
```

### Privacy Policy Requirements

The privacy policy (hosted at our website, linked from Chrome Web Store listing and extension Settings) must include:

1. What data we collect (exact list from table above)
2. What data we do NOT collect (exact list from table above)
3. Why we collect data (product improvement only)
4. How data is stored (Mixpanel cloud + PostHog self-hosted, encrypted in transit and at rest)
5. Who has access (founding team only; no third-party access, no data sales)
6. How to opt out (Settings toggle)
7. How to delete data (Settings button + email request option)
8. How to contact us (support email)
9. Cookie policy (we use zero cookies; Chrome extensions use `chrome.storage`)
10. GDPR and CCPA compliance statements
11. Data retention policy (see below)
12. Changes notification (users notified via extension update notes if privacy policy changes materially)

### Data Retention Policy

| Data Type | Retention Period | Deletion Method |
|-----------|:----------------:|:---------------:|
| Analytics events (Mixpanel) | 12 months from event date | Automatic TTL in Mixpanel; manual purge for older data |
| Analytics events (PostHog) | 12 months from event date | Automated deletion job on self-hosted instance |
| User profiles (analytics) | Until user deletes or 12 months after last activity | Auto-cleanup job for inactive profiles |
| Email addresses (Pro/Team) | Until subscription ends + 30 days | Automated cleanup; manual on deletion request |
| Payment records | 7 years (legal/tax requirement) | Stored by Stripe, not by us |
| Local extension data | Until user uninstalls or manually clears | Cleared by Chrome on uninstall |
| Support tickets | 24 months | Manual review and purge |

---

# SECTION 8: LAUNCH CHECKLIST

---

## 8.1 Pre-Development

- [ ] Finalize product specification document (all sections reviewed and approved)
- [ ] Define MVP feature scope (Priority 1-8 from implementation priorities)
- [ ] Set up version control repository (GitHub private repo, branch protection on `main`)
- [ ] Create project board (GitHub Projects or Linear) with all MVP tasks as issues
- [ ] Choose and set up payment provider account (Stripe recommended; ExtensionPay as alternative)
- [ ] Register Chrome Web Store developer account ($5 one-time fee, if not already registered)
- [ ] Purchase domain for extension website/landing page (e.g., focusmodeblocker.com)
- [ ] Set up privacy proxy infrastructure (Cloudflare Worker or Node server for analytics)
- [ ] Create Mixpanel account and configure project (free tier)
- [ ] Deploy PostHog self-hosted instance (backup analytics)
- [ ] Draft initial privacy policy (legal review if budget allows)
- [ ] Set up development environment (Chrome extension dev tooling, hot reload, TypeScript config)
- [ ] Define coding standards and linting rules (ESLint, Prettier, commit conventions)
- [ ] Create Manifest V3 skeleton project with folder structure
- [ ] Design system: choose UI framework or design tokens (colors, typography, spacing)
- [ ] Create wireframes for all MVP screens (popup, block page, settings, onboarding, paywall)
- [ ] Define analytics event schema (from Section 7.2) and create tracking plan document

## 8.2 Development Milestones

### MVP Features (Must-Have for Beta Launch)

- [ ] **Core blocking engine:** Intercept and block navigation to sites on the user's blocklist using `chrome.declarativeNetRequest` API (Manifest V3)
- [ ] **Manual blocklist management:** Add, remove, and view blocked sites (up to 10 for free) in the popup UI
- [ ] **Pre-built block lists:** Social media (8 sites) and news (8 sites) toggle lists
- [ ] **Block page:** Motivational block page with site name, remaining session time, motivational quote (rotating), distraction attempt counter, and "Go Back to Work" button
- [ ] **Quick Focus button:** One-click 25-minute focus session from popup, blocking all sites on the user's list
- [ ] **Pomodoro timer (25/5):** Visual countdown timer in popup, auto-transition between focus and break, sound notification on state change
- [ ] **Daily statistics:** Focus time today, sessions completed today, distraction attempts today, current streak -- all displayed in popup
- [ ] **Streak tracking:** Current streak counter (consecutive days with at least 1 completed session), displayed on popup and block page
- [ ] **1 schedule:** Allow users to set one recurring blocking schedule (e.g., Mon-Fri 9am-5pm)
- [ ] **Nuclear option (1 hour):** Unbypassable blocking for up to 60 minutes, cannot be disabled once activated
- [ ] **3 ambient sounds:** Rain, white noise, lo-fi beat -- playable from popup during sessions
- [ ] **Basic notification muting:** Suppress all browser notifications during active focus sessions
- [ ] **Onboarding flow:** 3-4 step flow on first install (add sites, start first session, optional sound)
- [ ] **Extension badge:** Show active session timer countdown on extension icon badge
- [ ] **Settings page:** All configuration options in a clean settings UI (blocklist management, schedule, sound preferences, analytics toggle)
- [ ] **Analytics consent dialog:** First-launch consent prompt with opt-in/opt-out
- [ ] **Analytics integration:** All events from Section 7.2 instrumented and firing to Mixpanel/PostHog

### Pro Tier Features (Must-Have for Monetization Launch, Week 5)

- [ ] **Unlimited blocklist:** Remove 10-site cap for Pro users
- [ ] **Weekly/monthly analytics reports:** Focus time trends, distraction patterns, peak focus hours, top blocked site categories
- [ ] **Blurred analytics preview:** Show free users blurred versions of their weekly report with visible chart shapes but unreadable specifics
- [ ] **Focus Score (0-100):** Calculated from session completion rate, distraction attempts, session duration, and consistency
- [ ] **Custom timer durations:** Allow Pro users to set any duration from 1-240 minutes
- [ ] **Extended nuclear option (up to 24 hours):** Pro users can lock in for longer durations
- [ ] **Wildcard/pattern blocking:** Support `*.reddit.com` and similar patterns
- [ ] **Whitelist mode:** Block everything except whitelisted sites
- [ ] **Custom block page:** Template selector with customizable message, image, and color scheme
- [ ] **Redirect to productive sites:** Option to redirect blocked site visits to a specified productive URL
- [ ] **Unlimited schedules:** Remove 1-schedule cap
- [ ] **Streak recovery:** Pro users do not lose their streak for 1 missed day per week (if streak > 7 days)
- [ ] **Full ambient sound library:** 15+ sounds with mix-and-match capability
- [ ] **Exportable analytics:** Download focus data as CSV or PDF
- [ ] **Subscription management:** Subscribe, upgrade, downgrade, cancel flow via Stripe
- [ ] **Pro badge on extension icon:** Visual indicator of Pro status
- [ ] **Paywall surfaces:** All paywall triggers from Section 7.2 implemented (site limit, weekly report, feature lock, nuclear extension, trial end)

### Quality Gates

Each gate must pass before proceeding to the next phase:

- [ ] **Gate 1 -- Core blocking reliability:** Blocking engine correctly blocks 100% of sites in blocklist across 50 test URLs, including subdomains, HTTP/HTTPS, and with/without www prefix. Zero false negatives.
- [ ] **Gate 2 -- Performance baseline:** Popup loads in <300ms, block page loads in <200ms, service worker wakes in <100ms, memory usage <50MB with 10 blocked sites.
- [ ] **Gate 3 -- Timer accuracy:** Pomodoro timer is accurate within +/- 2 seconds over a 25-minute session. Timer survives browser tab switching, popup close, and system sleep/wake.
- [ ] **Gate 4 -- Data integrity:** Daily stats (focus time, sessions, distractions) are accurate to within 1% when compared against manual tracking over a 3-day test period.
- [ ] **Gate 5 -- Payment flow:** End-to-end payment works in Stripe test mode: subscribe monthly, subscribe annual, cancel, resubscribe. Pro features activate within 5 seconds of payment.
- [ ] **Gate 6 -- Analytics completeness:** All events from Section 7.2 fire correctly and appear in Mixpanel dashboard within 60 seconds. Opt-out toggle stops all events immediately.
- [ ] **Gate 7 -- Privacy compliance:** Zero PII in any analytics event payload (verified by auditing 1,000 sample events). No URLs, no site names, no personal identifiers.

## 8.3 Testing & QA

### Unit Testing Requirements

- [ ] Blocking engine: 100% branch coverage for URL matching logic, schedule evaluation, and nuclear option timer
- [ ] Timer logic: Test boundary conditions (0 minutes, 240 minutes, browser suspend/resume, daylight saving time transitions)
- [ ] Storage layer: Test `chrome.storage.local` read/write/clear for all data types (blocklist, settings, stats, streaks)
- [ ] Analytics wrapper: Test opt-in sends events, opt-out sends nothing, consent dialog flows
- [ ] Focus Score calculation: Test scoring algorithm with known inputs/expected outputs across 20+ scenarios
- [ ] Subscription status checking: Test Pro feature gating for free, trial, active Pro, expired Pro, and cancelled states
- [ ] Minimum 80% overall code coverage; 100% for blocking engine and payment logic

### Integration Testing

- [ ] End-to-end: Install extension -> onboarding -> add sites -> start session -> visit blocked site -> see block page -> complete session -> view stats
- [ ] Pro upgrade flow: Free user -> hit limit -> see paywall -> click upgrade -> Stripe checkout (test mode) -> Pro features unlock
- [ ] Nuclear option: Activate nuclear -> attempt to disable (should fail) -> attempt to uninstall (should fail during session) -> timer expires -> blocking lifts
- [ ] Schedule blocking: Set schedule -> verify blocking activates at start time -> verify blocking deactivates at end time -> verify manual override works
- [ ] Analytics pipeline: Perform actions -> verify events appear in Mixpanel within 60 seconds -> verify opt-out stops events -> verify data deletion flow

### Manual Testing Scenarios

- [ ] **MT-01:** Install extension fresh and complete onboarding flow without errors
- [ ] **MT-02:** Add 10 sites to blocklist, attempt to add 11th, verify limit message appears
- [ ] **MT-03:** Enable social media pre-built list, verify all 8 sites are blocked
- [ ] **MT-04:** Start Quick Focus session, visit each blocked site in a new tab, verify block page shows for each
- [ ] **MT-05:** Complete a 25-minute Pomodoro session without interruption, verify completion screen shows accurate stats
- [ ] **MT-06:** Abandon a session at the 12-minute mark, verify abandoned session is recorded correctly in daily stats
- [ ] **MT-07:** Activate nuclear option for 1 hour, attempt to disable via popup, settings, and extension management page -- verify it cannot be bypassed
- [ ] **MT-08:** Set a weekday 9-5 schedule, verify sites are blocked during the window and unblocked outside it
- [ ] **MT-09:** Play each of the 3 ambient sounds during a session, switch between them, stop playback
- [ ] **MT-10:** Build a 3-day streak (sessions on 3 consecutive days), verify streak counter increments correctly
- [ ] **MT-11:** Open the extension popup 50 times in rapid succession, verify no UI glitches, memory leaks, or performance degradation
- [ ] **MT-12:** Subscribe to Pro (Stripe test mode), verify all Pro features unlock within 5 seconds
- [ ] **MT-13:** Cancel Pro subscription, verify Pro features revert to free tier on next billing cycle
- [ ] **MT-14:** Opt out of analytics in Settings, perform 10 actions, verify zero events sent to Mixpanel
- [ ] **MT-15:** Click "Delete My Data" in Settings, verify data deletion request fires and confirmation shown
- [ ] **MT-16:** Use extension with 50 blocked sites (Pro), verify blocking performance is not degraded
- [ ] **MT-17:** Open popup while an active session is running, verify timer displays correctly and syncs with badge
- [ ] **MT-18:** Test block page on a site that uses complex redirects (e.g., URL shorteners, login redirects)
- [ ] **MT-19:** Restart Chrome during an active nuclear session, verify session resumes after restart
- [ ] **MT-20:** Verify all paywall surfaces display correctly: site limit, weekly report blur, feature lock icons, nuclear extension, trial end

### Cross-Browser Testing

- [ ] Chrome Stable (latest version) -- primary target, full test suite
- [ ] Chrome Beta -- smoke test all core features
- [ ] Chrome Canary -- smoke test blocking engine only
- [ ] Edge Chromium (latest) -- full test suite (Manifest V3 compatible)
- [ ] Brave Browser (latest) -- smoke test core features (Chromium-based, Manifest V3 compatible)
- [ ] Verify extension works on Chrome OS
- [ ] Verify extension works on macOS, Windows 10/11, and Ubuntu Linux

### Performance Benchmarks

| Metric | Target | Unacceptable | Measurement Method |
|--------|:------:|:------------:|-------------------|
| Popup open to fully rendered | <300ms | >500ms | Chrome DevTools Performance tab, 50-run average |
| Block page load time | <200ms | >400ms | Performance API timing in content script |
| Service worker cold start | <100ms | >250ms | `chrome.runtime.onInstalled` to first message response |
| Memory usage (idle, 10 sites) | <30MB | >50MB | Chrome Task Manager, after 1 hour idle |
| Memory usage (active session, 10 sites) | <45MB | >75MB | Chrome Task Manager, during active session |
| Memory usage (Pro, 50 sites) | <50MB | >80MB | Chrome Task Manager, after 1 hour idle |
| CPU usage (idle) | <0.5% | >2% | Chrome Task Manager, 5-minute average |
| CPU usage (active session) | <2% | >5% | Chrome Task Manager, 5-minute average |
| Analytics event dispatch latency | <200ms | >500ms | Network tab, event POST request timing |
| Storage usage (1 month of data) | <5MB | >10MB | `chrome.storage.local.getBytesInUse()` |

## 8.4 Pre-Launch

### Chrome Web Store Listing Requirements

- [ ] **Extension name:** "Focus Mode - Blocker: Website Blocker & Focus Timer" (max 45 chars for title)
- [ ] **Short description:** "Block distracting websites, track your focus time, and build better habits. Free forever with Pomodoro timer, daily stats, and 10 blocked sites." (max 132 chars)
- [ ] **Detailed description:** 2,000-5,000 word description including features, free vs Pro comparison, privacy commitment, and FAQ (draft below in 8.4.2)
- [ ] **Category:** Productivity
- [ ] **Language:** English (primary), with localization plan for Spanish, French, German, Japanese (post-launch)
- [ ] **Extension icon:** 128x128 PNG, clean and recognizable at 16x16 (favicon size)
- [ ] **Promo tile (small):** 440x280 PNG -- featured in Chrome Web Store search results
- [ ] **Promo tile (large):** 920x680 PNG -- featured on category pages (optional but recommended)
- [ ] **Marquee promo tile:** 1400x560 PNG -- for Chrome Web Store homepage feature (submit for consideration)

### Store Description Draft

```
Focus Mode - Blocker -- The website blocker that actually works.

Block distracting websites, track your focus time, and build better habits.
Free forever with 10 blocked sites, Pomodoro timer, and daily stats.

THE PROBLEM
The average knowledge worker loses 2+ hours per day to digital distractions.
You open Reddit, Twitter, or YouTube "for just a second" -- and 30 minutes vanish.
Sound familiar?

THE SOLUTION
Focus Mode - Blocker interrupts the autopilot. One click starts a focus session
that blocks your distracting sites and tracks your progress.

FREE FEATURES (forever, no tricks):
- Block up to 10 websites
- Pre-built block lists (social media + news)
- Pomodoro timer (25/5)
- Daily focus time tracking
- Distraction attempts counter ("You tried to visit Reddit 34 times today")
- Streak tracking
- 1 blocking schedule (e.g., Mon-Fri 9-5)
- Nuclear option (1 hour, truly unbypassable)
- 3 ambient sounds (rain, white noise, lo-fi)
- Motivational block page with quotes

PRO FEATURES ($4.99/mo or $2.99/mo annual):
- Unlimited blocked sites + wildcard patterns
- Weekly & monthly focus reports
- Focus Score (0-100)
- Custom timer durations (1-240 min)
- Extended nuclear option (up to 24 hours)
- Whitelist mode (block everything except work tools)
- Custom block page design
- Full ambient sound library (15+ sounds with mixing)
- Cross-device sync
- Calendar integration
- Exportable analytics (CSV, PDF)
- Streak recovery

PRIVACY FIRST
Your data never leaves your device. We never collect your browsing history,
the names of websites you block, or any personal information. Anonymous
analytics are optional and can be turned off at any time.

Built with Manifest V3 for reliability and security.

---

Focus Mode - Blocker pays for itself in 5.5 minutes.
The average worker loses $608/week to distractions. We cost less than a coffee.
```

### Screenshot Requirements

All screenshots are 1280x800 PNG or 640x400 PNG (Chrome Web Store requires 1-5 screenshots):

- [ ] **Screenshot 1 -- Popup main view:** Show the extension popup with Quick Focus button, active timer, daily stats (focus time, sessions, distractions blocked), and streak counter. Clean, modern design. This is the first impression.
- [ ] **Screenshot 2 -- Block page:** Show the motivational block page in action: "twitter.com is blocked" with a motivational quote, time remaining in session, distraction attempt count, and "Go Back to Work" button. Beautiful design, not punishing.
- [ ] **Screenshot 3 -- Blocklist management:** Show the blocklist UI with 8/10 sites added, pre-built list toggles for social media and news, and the "Add Site" input field. Highlight the generous 10-site free limit.
- [ ] **Screenshot 4 -- Analytics/stats view:** Show the Pro weekly report (or a blurred preview for marketing) with focus time chart, distraction breakdown, Focus Score, and peak focus hours. This sells the Pro upgrade.
- [ ] **Screenshot 5 -- Settings + Pro comparison:** Show the settings page with free features checked and Pro features with lock icons. Include a comparison callout: "Free vs Pro" to clearly communicate value tiers.

### Privacy & Legal

- [ ] Privacy policy published at extension website URL
- [ ] Privacy policy linked in Chrome Web Store listing
- [ ] Privacy policy linked in extension Settings page
- [ ] Terms of Service published (covers subscription terms, refund policy, data handling)
- [ ] Chrome Web Store permissions justification written for each permission requested
- [ ] GDPR compliance verified (consent flow, data deletion, data export)
- [ ] CCPA compliance verified (do not sell notice, deletion rights)
- [ ] Cookie policy (state: no cookies used; `chrome.storage.local` used instead)

### Marketing Assets

- [ ] Landing page live at extension domain (email capture for launch notification list)
- [ ] Product Hunt "Ship" page created (teaser for upcoming launch)
- [ ] Twitter/X account created (@FocusModeBlock or similar)
- [ ] Reddit accounts identified for organic posting (r/productivity, r/getdisciplined, r/ADHD, r/chrome, r/SideProject)
- [ ] 60-second demo video recorded (screen recording showing install -> Quick Focus -> block page -> session complete -> stats)
- [ ] Open Graph images created for social sharing (1200x630 for Twitter/LinkedIn)
- [ ] Email templates created: launch announcement, weekly focus report, trial ending, welcome to Pro
- [ ] Press kit assembled: logo (SVG, PNG at multiple sizes), screenshots, one-paragraph description, founder bio

## 8.5 Launch Day

### Submission Checklist

- [ ] Final build created from `main` branch (production build, minified, source maps excluded)
- [ ] Manifest V3 permissions are minimal and justified (only request what is needed)
- [ ] Extension package size is under 10MB (target <5MB)
- [ ] All test suites pass (unit, integration, manual test cases signed off)
- [ ] All quality gates (7/7) pass
- [ ] Version number set to 1.0.0
- [ ] Upload to Chrome Web Store Developer Dashboard
- [ ] Fill in all store listing fields (name, description, screenshots, icons, promo tiles, category, privacy policy URL)
- [ ] Declare permissions justifications in the Developer Dashboard
- [ ] Set visibility to "Public"
- [ ] Submit for review (allow 1-3 business days for Chrome Web Store review)
- [ ] Simultaneously submit to Microsoft Edge Add-ons store (Manifest V3 compatible)

### Monitoring Setup

- [ ] Mixpanel real-time dashboard configured and loaded on monitoring screen
- [ ] PostHog real-time events view open as backup
- [ ] Chrome Web Store developer dashboard bookmarked for review status checks
- [ ] Error monitoring: browser console log aggregation set up (Sentry or LogRocket for extension errors)
- [ ] Uptime monitoring for privacy proxy server (UptimeRobot or similar, 1-minute checks)
- [ ] Stripe dashboard open for payment monitoring
- [ ] Set up Slack/Discord alerts for: new installs (batched hourly), errors (immediate), payments (immediate), 1-star reviews (immediate)

### Support Channels

- [ ] Support email configured (support@focusmodeblocker.com) with auto-responder
- [ ] Chrome Web Store review response workflow defined (respond to every review within 24 hours)
- [ ] FAQ page published on extension website (10-15 common questions)
- [ ] In-extension "Help & Feedback" link pointing to FAQ + support email
- [ ] Bug report template created (Chrome version, OS, extension version, steps to reproduce, expected vs actual)
- [ ] Internal triage guide written (P0: blocking broken, payment broken. P1: data loss, crash. P2: UI bug, analytics gap. P3: cosmetic, feature request)

### Launch Announcements

- [ ] Product Hunt launch post submitted (schedule for Tuesday-Thursday, 12:01 AM PST)
- [ ] Reddit posts drafted for r/productivity, r/chrome, r/SideProject (follow each subreddit's self-promotion rules)
- [ ] Twitter/X launch thread drafted (5-7 tweets: problem, solution, demo video, free features, Pro features, link)
- [ ] Hacker News "Show HN" post drafted
- [ ] Email sent to launch notification list (if pre-launch email capture was set up)
- [ ] LinkedIn post drafted (personal account of founder)
- [ ] Notify any beta testers who provided feedback

## 8.6 Post-Launch (Week 1)

### Monitoring Activities

- [ ] Check real-time dashboard every 2 hours on Day 1, every 4 hours on Days 2-3, twice daily on Days 4-7
- [ ] Review every Chrome Web Store review within 24 hours; respond to all reviews (especially negative ones)
- [ ] Monitor error rates: target <1% of sessions with errors, 0% blocking failures
- [ ] Track uninstall rate: target <15% 24-hour uninstall rate
- [ ] Monitor payment flow: verify at least 1 successful test payment in the first 48 hours
- [ ] Track onboarding completion rate: target >70% complete at least 2 steps
- [ ] Monitor analytics consent rate: target >65% opt-in
- [ ] Check privacy proxy uptime: must be 100%
- [ ] Monitor Chrome Web Store review status (ensure no policy violations flagged)

### User Feedback Collection

- [ ] Aggregate all feedback from: Chrome Web Store reviews, support emails, Reddit comments, Twitter mentions, Product Hunt comments
- [ ] Categorize feedback into: bugs, feature requests, UX issues, praise, pricing feedback
- [ ] Identify the top 3 most-requested changes/fixes
- [ ] Respond to every piece of feedback within 24 hours (even if the response is "Thank you, we're looking into this")
- [ ] Create a public roadmap or changelog page to show users their feedback is heard
- [ ] Send a "Thank you for trying Focus Mode" email to early users at Day 3 with a feedback survey link

### Bug Triage Process

- [ ] **P0 (Critical -- fix within 4 hours):** Blocking engine not blocking sites, payment processing broken, extension crashes on install, data loss. All hands on deck.
- [ ] **P1 (High -- fix within 24 hours):** Timer inaccuracy >10 seconds, nuclear option bypassable, analytics not recording, block page not loading. One developer assigned.
- [ ] **P2 (Medium -- fix within 72 hours):** UI rendering issues, incorrect stats calculation, ambient sound playback issues, non-critical settings not saving. Added to sprint.
- [ ] **P3 (Low -- fix in next weekly release):** Cosmetic issues, typos, minor layout problems on specific screen sizes. Backlog.
- [ ] Establish a daily 15-minute bug triage standup for Week 1
- [ ] Publish a hotfix (version 1.0.1) within 48 hours if any P0 or P1 bugs are found
- [ ] Document all bugs and fixes in a changelog

### Performance Monitoring

- [ ] Compare actual performance metrics against benchmarks from Section 8.3
- [ ] If popup load time >400ms for >5% of users, investigate and optimize
- [ ] If memory usage >60MB for any user segment, investigate memory leaks
- [ ] If service worker cold start >200ms, investigate initialization bottlenecks
- [ ] Monitor Chrome Web Store "Performance" warnings (if any flagged by Google)
- [ ] Track analytics event delivery rate (should be >99% for opted-in users)

---

# SECTION 9: SUCCESS CRITERIA

---

## 9.1 Week 1 Targets

| Metric | Target (Conservative) | Target (Optimistic) | Measurement Source |
|--------|:---------------------:|:-------------------:|-------------------|
| Total installs | 100-200 | 500-2,000 | Chrome Web Store Developer Dashboard |
| Activation rate (% who complete at least 1 focus session) | 60% | 75% | Mixpanel: `focus_session_completed` / `extension_installed` |
| Onboarding completion rate | 70% | 85% | Mixpanel: `onboarding_completed` / `onboarding_started` |
| Sessions per active user (7-day avg) | 2.5 | 4.0 | Mixpanel: `focus_session_started` / active users |
| Average session duration | 20 minutes | 25 minutes | Mixpanel: avg of `duration_minutes` on `focus_session_completed` |
| Session completion rate | 65% | 75% | Mixpanel: `focus_session_completed` / `focus_session_started` |
| 24-hour uninstall rate | <15% | <10% | Chrome Web Store + `extension_uninstalled` events |
| Critical bugs (P0) | 0 | 0 | Internal bug tracker |
| High bugs (P1) | <3 | <2 | Internal bug tracker |
| Chrome Web Store rating | 4.5+ (if 5+ reviews) | 4.8+ (if 10+ reviews) | Chrome Web Store |
| Blocking failure rate | 0% | 0% | Mixpanel: `blocking_failure` events |
| Analytics consent opt-in rate | 65% | 80% | Mixpanel: `consent_granted` / (`consent_granted` + `consent_denied`) |

## 9.2 Month 1 Targets

| Metric | Target (Conservative) | Target (Optimistic) | Measurement Source |
|--------|:---------------------:|:-------------------:|-------------------|
| Total cumulative installs | 500 | 2,000 | Chrome Web Store Developer Dashboard |
| Monthly Active Users (MAU) | 400 | 1,600 | Mixpanel: unique users with `daily_active` event in 30-day window |
| Daily Active Users (DAU) | 80 | 350 | Mixpanel: unique users with `daily_active` event per day |
| DAU/MAU ratio | 20% | 22% | Calculated from above |
| % of active users who hit a paywall | 25% | 35% | Mixpanel: users with `paywall_shown` / MAU |
| Time to first paywall (median) | 5 days | 4 days | Mixpanel: median time from `extension_installed` to first `paywall_shown` |
| Paywall-to-click rate | 8% | 15% | Mixpanel: `paywall_upgrade_clicked` / `paywall_shown` |
| Install-to-paid conversion rate | 1.5% | 3.0% | Mixpanel: `payment_completed` / `extension_installed` (30-day window) |
| Pro subscribers (paying) | 8 | 48 | Stripe dashboard |
| Monthly Recurring Revenue (MRR) | $34 | $201 | Stripe dashboard |
| Chrome Web Store rating | 4.5+ | 4.7+ | Chrome Web Store (min 10 reviews) |
| D1 retention (% active day after install) | 40% | 55% | Mixpanel: cohort analysis |
| D7 retention | 30% | 42% | Mixpanel: cohort analysis |
| D14 retention | 22% | 35% | Mixpanel: cohort analysis |
| D30 retention | 18% | 28% | Mixpanel: cohort analysis |
| Average sessions per active user per week | 3.0 | 4.5 | Mixpanel |
| Support tickets | <20 | <30 | Support email inbox |
| Average Focus Score (active users) | 55 | 65 | Mixpanel: avg of `score` on `focus_score_calculated` |

## 9.3 Month 3 Targets

| Metric | Target (Conservative) | Target (Optimistic) | Measurement Source |
|--------|:---------------------:|:-------------------:|-------------------|
| Total cumulative installs | 2,500 | 10,000 | Chrome Web Store Developer Dashboard |
| Monthly Active Users (MAU) | 1,750 | 7,000 | Mixpanel |
| DAU/MAU ratio | 22% | 25% | Mixpanel |
| Install-to-paid conversion rate | 2.0% | 4.0% | Mixpanel (rolling 30-day) |
| Pro subscribers (paying) | 44 | 280 | Stripe dashboard |
| MRR | $175 | $1,089 | Stripe dashboard |
| Monthly churn rate (Pro users) | <8% | <5% | Stripe: cancelled / total subscribers |
| Chrome Web Store rating | 4.6+ | 4.8+ | Chrome Web Store (min 25 reviews) |
| Top 3 most-used free features | Quick Focus, blocklist, daily stats | Quick Focus, blocklist, daily stats | Mixpanel feature usage ranking |
| Top 3 most-used Pro features | Weekly reports, unlimited sites, custom timer | Weekly reports, unlimited sites, Focus Score | Mixpanel feature usage ranking |
| NPS score (surveyed Pro users) | 30+ | 50+ | In-app NPS survey (triggered at day 14 of Pro subscription) |
| Average sessions per active user per week | 3.5 | 5.0 | Mixpanel |
| Referral-driven installs (% of total) | 5% | 12% | Mixpanel: `install_source = referral` |
| Annual plan adoption (% of paying users) | 50% | 55% | Stripe |
| A/B test #1 completed | Yes | Yes | PostHog feature flags |
| Trial-to-paid conversion rate | 25% | 40% | Mixpanel: `pro_trial_converted` / `pro_trial_started` |

## 9.4 Month 6 Targets

| Metric | Target (Conservative) | Target (Optimistic) | Measurement Source |
|--------|:---------------------:|:-------------------:|-------------------|
| Total cumulative installs | 7,000 | 30,000 | Chrome Web Store Developer Dashboard |
| Monthly Active Users (MAU) | 4,900 | 21,000 | Mixpanel |
| DAU/MAU ratio | 24% | 28% | Mixpanel |
| Install-to-paid conversion rate | 2.5% | 5.0% | Mixpanel |
| Pro subscribers (paying) | 147 | 1,050 | Stripe dashboard |
| MRR | $572 | $3,980 | Stripe dashboard |
| ARR run-rate | $6,864 | $47,760 | MRR x 12 |
| Monthly churn rate | <7% | <5% | Stripe |
| Chrome Web Store rating | 4.6+ | 4.8+ | Chrome Web Store (min 50 reviews) |
| Team tier launched | Yes | Yes | Internal milestone |
| Team tier subscribers (paying teams) | 0-2 | 5-10 | Stripe |
| Feature completeness (MVP items shipped) | 90% | 100% | Project board |
| Cross-device sync launched | Yes | Yes | Internal milestone |
| Calendar integration launched | No | Yes | Internal milestone |
| Weekly email open rate | 35% | 45% | Email provider analytics |
| Average Focus Score (Pro users) | 65 | 72 | Mixpanel |
| Extension errors per 1,000 sessions | <5 | <2 | Mixpanel: `extension_error` / `focus_session_started` x 1000 |

## 9.5 Year 1 Targets

### Conservative Scenario

| Metric | Target | Notes |
|--------|:------:|-------|
| Total cumulative installs | 15,000 | Organic growth + basic content marketing |
| Monthly Active Users (MAU) at month 12 | 9,000 | 60% retention of cumulative installs |
| Pro subscribers at month 12 | 270 | 3% conversion of active users |
| MRR at month 12 | $1,023 | Blended ARPU ~$3.79/mo (60% annual mix) |
| ARR run-rate at month 12 | $12,276 | MRR x 12 |
| Total Year 1 revenue | ~$6,700 | Cumulative MRR over 12 months |
| Chrome Web Store rating | 4.6+ | Min 100 reviews |
| Market position | Top 15 in "website blocker" search results | Chrome Web Store search ranking |
| Team tier customers | 5-10 teams | Early adopter teams |
| A/B tests completed | 4-6 | One test every 6-8 weeks |
| NPS score | 35+ | Surveyed at month 6 and month 12 |

### Optimistic Scenario

| Metric | Target | Notes |
|--------|:------:|-------|
| Total cumulative installs | 75,000 | Viral launch (Product Hunt top 5) + influencer mentions + content marketing |
| Monthly Active Users (MAU) at month 12 | 45,000 | 60% retention |
| Pro subscribers at month 12 | 2,250 | 5% conversion of active users |
| MRR at month 12 | $8,303 | Blended ARPU ~$3.69/mo (65% annual mix) |
| ARR run-rate at month 12 | $99,630 | MRR x 12 |
| Total Year 1 revenue | ~$52,000 | Cumulative MRR over 12 months |
| Chrome Web Store rating | 4.8+ | Min 500 reviews |
| Market position | Top 5 in "website blocker" search results | Competing directly with StayFocusd and LeechBlock in organic ranking |
| Team tier customers | 25-50 teams | Active sales and partnerships |
| A/B tests completed | 8-10 | One test every 4-5 weeks |
| NPS score | 55+ | Strong product-market fit |

### Year 1 Milestone Timeline

| Month | Key Milestone | Revenue Target (Conservative) |
|:-----:|---------------|:-----------------------------:|
| 1 | Beta launch (all Pro unlocked free). Collect feedback. Earn first 10 reviews. | $0 (free beta) |
| 2 | Monetization launch ($2.99/mo founding member pricing). First paying users. | $34 MRR |
| 3 | Price ramp to $3.99/mo. First A/B test runs. Referral program launches. | $175 MRR |
| 4 | Full pricing ($4.99/mo). Student pricing (.edu). Second A/B test. | $300 MRR |
| 5 | Cross-device sync ships. Pro feature depth increases. | $420 MRR |
| 6 | Team tier MVP launches. Calendar integration ships. | $572 MRR |
| 7 | First seasonal promotion (if timed with back-to-school). | $650 MRR |
| 8 | AI focus recommendations (basic). Third A/B test. | $730 MRR |
| 9 | Full ambient sound library. Team tier refinement. | $810 MRR |
| 10 | Productivity influencer outreach campaign. | $880 MRR |
| 11 | Black Friday / Cyber Monday promotion. | $950 MRR |
| 12 | New Year preparation. Year-in-review feature for users. | $1,023 MRR |

## 9.6 Health Metrics (Ongoing)

### Traffic Light Thresholds

| Metric | Green (Healthy) | Yellow (Warning) | Red (Critical) | Check Frequency |
|--------|:---------------:|:----------------:|:--------------:|:---------------:|
| **Daily Active Users (DAU)** | Stable or growing week-over-week | Declined >10% week-over-week for 2 consecutive weeks | Declined >25% week-over-week or absolute DAU <50 | Daily |
| **Install-to-paid conversion rate** | >2.5% (30-day rolling) | 1.5-2.5% | <1.5% | Weekly |
| **Monthly churn rate (Pro)** | <5% | 5-8% | >8% | Monthly |
| **Chrome Web Store rating** | 4.5+ stars (20+ reviews) | 4.0-4.5 stars | <4.0 stars | Daily |
| **Support ticket volume** | <5 per 1,000 MAU per week | 5-10 per 1,000 MAU per week | >10 per 1,000 MAU per week | Weekly |
| **Popup load time (p95)** | <400ms | 400-600ms | >600ms | Daily |
| **Memory usage (p95, idle)** | <40MB | 40-60MB | >60MB | Weekly |
| **Blocking failure rate** | 0% | >0% and <0.1% | >0.1% | Real-time |
| **Service worker wake time (p95)** | <150ms | 150-300ms | >300ms | Daily |
| **Extension error rate** | <0.5% of sessions | 0.5-2% of sessions | >2% of sessions | Daily |
| **Payment error rate** | <2% of attempts | 2-5% of attempts | >5% of attempts | Daily |
| **Analytics consent opt-in rate** | >70% | 50-70% | <50% | Weekly |
| **Session completion rate** | >70% | 55-70% | <55% | Weekly |
| **Onboarding completion rate** | >75% | 60-75% | <60% | Weekly |
| **24-hour uninstall rate** | <12% | 12-20% | >20% | Daily |
| **D7 retention** | >30% | 20-30% | <20% | Weekly |
| **D30 retention** | >18% | 12-18% | <12% | Monthly |
| **Trial-to-paid conversion** | >30% | 20-30% | <20% | Weekly |
| **NPS score** | >40 | 20-40 | <20 | Quarterly |
| **DAU/MAU ratio** | >22% | 15-22% | <15% | Weekly |

### Response Protocols

**Red metric detected:**
1. Immediately create a P1 investigation task
2. Alert founding team via Slack/Discord within 1 hour
3. Identify root cause within 24 hours
4. Implement fix or mitigation within 48 hours
5. Post-mortem document within 72 hours

**Yellow metric detected:**
1. Add to next weekly review agenda
2. Identify contributing factors within 1 week
3. Implement improvement plan within 2 weeks
4. Monitor for 2 weeks to confirm improvement

**Multiple red metrics simultaneously:**
1. Halt all feature development
2. All hands on diagnosis and fix
3. Consider rolling back most recent release if metrics degraded after a deploy
4. Communicate status to paying users if Pro features are affected

### Monthly Health Scorecard

Each month, compute an overall health score:

| Component | Weight | Scoring |
|-----------|:------:|---------|
| Growth (installs + DAU trend) | 25% | Green = 100, Yellow = 60, Red = 20 |
| Conversion (install-to-paid + trial-to-paid) | 25% | Green = 100, Yellow = 60, Red = 20 |
| Retention (D7, D30, churn) | 25% | Green = 100, Yellow = 60, Red = 20 |
| Quality (rating, errors, performance) | 25% | Green = 100, Yellow = 60, Red = 20 |

**Overall score interpretation:**
- 85-100: Excellent. Stay the course, invest in growth.
- 70-84: Good. Minor optimizations needed in yellow areas.
- 50-69: Concerning. Multiple areas need attention; shift focus from features to optimization.
- Below 50: Critical. Pause all feature work; focus entirely on fixing red metrics.

---

*Document generated as part of the Focus Mode - Blocker extension specification.*
*Sections 7-9: Analytics & Tracking, Launch Checklist, Success Criteria.*
*Feed this document to the development team alongside Sections 1-6 for full implementation context.*
