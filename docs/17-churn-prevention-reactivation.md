# CHURN PREVENTION & REACTIVATION: Focus Mode - Blocker
## Phase 17 Output — Churn Detection, Exit Surveys, Win-Back, Downgrade Flow, Engagement Scoring, Retention Triggers, Recovery & Metrics Dashboard

> **Date:** February 11, 2026 | **Status:** Complete
> **Input:** Phases 01-16

---

## Overview

Phase 17 delivers a complete churn prevention and reactivation system for Focus Mode - Blocker, produced by five specialized agents. The output covers the full retention lifecycle: a FocusChurnDetector that monitors 12 extension-specific signals (session inactivity, Pomodoro abandonment, Focus Score decline, streak breaks, Nuclear Mode disuse, blocklist shrinking, Pro feature disuse) with a weighted FocusRiskScoringModel producing 5-tier risk assessment; a FocusHealthScoreCalculator measuring 5 engagement dimensions (frequency, depth, recency, consistency, growth) and FocusPowerUserIdentifier with tiered rewards; an exit survey system at zovo.one/uninstall-survey with 10 Focus Mode-specific uninstall reasons and conditional offers, plus a Pro→Free downgrade flow with retention modal offering pause, annual switch, and free months; win-back email campaigns (Day 1/3/7/14/30) personalized with focus session stats and a FocusIncentiveEngine generating reason-specific comeback offers; dormant user reactivation via in-extension notifications with strategy selection and seasonal re-engagement triggers; 35+ milestone celebrations across 7 categories (sessions, streaks, Focus Score, time, blocking, Nuclear Mode, Pomodoro) with celebration UI and achievements gallery; contextual feature discovery with 9 trigger-based rules; and a server-side retention dashboard with cohort analysis, LTV calculations, churn impact projections, and conversion funnel analysis.

---

## Agent Deliverables

### Agent 1 — Churn Detection & Engagement Scoring
**File:** `docs/churn-prevention/agent1-churn-detection-engagement-scoring.md`

- FocusChurnDetector class monitoring 12 Focus Mode-specific signals: session inactivity, frequency decline, Pomodoro abandonment, Focus Score decline, streak break without restart, Nuclear Mode disuse, bypass attempts, blocklist shrinking, Pro feature disuse, popup inactivity, timer-less opens, settings resets
- FocusRiskScoringModel with weighted engagement factors (sessions/week, Focus Score, streak, features used, Pro status, Nuclear Mode, Pomodoro completion) and risk factors (inactivity, decline rate, abandonment, bypasses, blocklist reduction, resets)
- 5 risk tiers: Healthy (green), Engaged (blue), Casual (yellow), At Risk (orange), Churning (red)
- Usage tracking functions integrated with service worker: trackFocusUsage, trackPopupOpen, trackFocusScore, trackBlocklistChange, trackProFeatureUsage
- Daily alarm-based churn analysis with automated retention action dispatch
- FocusHealthScoreCalculator: 5 dimensions (frequency 0.25, depth 0.25, recency 0.20, consistency 0.15, growth 0.15) with Focus Mode-specific scoring
- FocusPowerUserIdentifier: 3 power tiers (Focus Master, Focus Expert, Power User) with reward system (exclusive themes, beta access, badges)
- Complete chrome.storage.local schema for all churn data (estimated 50-100KB for 90 days)

### Agent 2 — Exit Survey & Downgrade Flow
**File:** `docs/churn-prevention/agent2-exit-survey-downgrade-flow.md`

- ExitSurveyHandler class managing chrome.runtime.setUninstallURL with anonymous context params (tier, version, Focus Score, sessions, streak, blocked sites)
- Complete exit survey HTML page for zovo.one/uninstall-survey: 10 Focus Mode-specific reasons, conditional offers (50% off for "too expensive", Nuclear Mode trial for "not restrictive enough", allowlist tips for "too restrictive"), Zovo branding
- Server-side feedback processor with category mapping, priority levels, Slack alerting, and weekly report generation
- FocusDowngradeFlow class: Pro→Free retention modal showing personalized usage data ("You've used Nuclear Mode X times"), offering pause (1-3 months), annual switch (save 40%), 2 free months, or proceed to downgrade
- Downgrade survey with Focus Mode-specific questions (most valuable Pro feature, acceptable price point, return likelihood)
- DowngradeExecutor: graceful transition with site selection UI (choose 5 to keep), Nuclear Mode session completion, theme backup, stats preservation, win-back queue trigger

### Agent 3 — Win-Back Campaigns & Recovery Tactics
**File:** `docs/churn-prevention/agent3-winback-campaigns-recovery-tactics.md`

- Email collection strategy: opt-in touchpoints (onboarding, checkout, options page), GDPR/CAN-SPAM compliance
- 5-email win-back sequence personalized with focus session stats:
  - Day 1: "Your focus journey doesn't have to end" — acknowledge + improvements
  - Day 3: "Remember your streak?" — nostalgia with real stats table
  - Day 7: "Special offer" — incentive based on reason + user value tier
  - Day 14: "We've saved your data" — urgency with data expiry date
  - Day 30: "One month later" — final survey + free Pro month for any response
- FocusIncentiveEngine: 6 incentive categories (price, value, quality, competitive, feature, gentle) × 3 user value tiers (high/medium/low), FOCUS-XXXXXX offer codes
- DormantUserReactivation: 4 notification strategies (premium_value_reminder, power_user_nostalgia, streak_restart, feature_update), frequency cap (1/week, 4 total), notification settings respect
- UpdateReengagement: personalized "What's New" on version update for 7+ day dormant users, filtered highlights matching usage patterns
- SeasonalReengagement: 5 productivity-timed campaigns (New Year, Back to School, Fall Exams, Spring Exams, Productivity Monday)

### Agent 4 — Proactive Retention Triggers
**File:** `docs/churn-prevention/agent4-proactive-retention-triggers.md`

- 35+ milestones across 7 categories: sessions (7), streaks (7), Focus Score (4), time (5), blocking (3), Nuclear Mode (3), Pomodoro (3), special (3)
- FocusMilestoneTracker: checks after every focus event, debounced celebrations (max 1 per session), queued pending milestones
- Celebration UI: Chrome notification + popup overlay with CSS confetti animation + block page display + options page achievements gallery
- FocusFeatureDiscovery: 9 contextual discovery rules (Nuclear Mode on bypass attempts, Pomodoro on timer-less sessions, context menu on options-only adds, custom block page on frequent views, import/export on large blocklists, focus stats on unexplored, keyboard shortcuts, break reminders, allowlist)
- Discovery prompt UI: subtle popup banner (not modal), "Show me" / "Later" / "Don't show again", max 1/day, Pro badge for Pro features
- DailyFocusChallenge: 7 rotating challenges with Focus Score bonus rewards
- Social proof: 7 pre-computed motivational statistics
- HabitNudges: peak hour suggestion, weekly summary notification

### Agent 5 — Retention Metrics Dashboard & Integration Architecture
**File:** `docs/churn-prevention/agent5-retention-metrics-dashboard.md`

- FocusRetentionMetrics class: DAU/WAU/MAU (active = 1+ focus session), DAU/MAU stickiness ratio, monthly churn rates (overall + Pro), reactivation rate, campaign performance
- Cohort retention with 6-month history: Day 1/7/14/30/60/90 retention, segmented by tier/onboarding/feature adoption/acquisition
- Retention heatmap with color coding and Focus Mode benchmarks (Day 1: 70%, Day 7: 45%, Day 30: 25%)
- FocusLTVAnalysis: segment LTV (free indirect, monthly, annual, lifetime), CAC by channel, LTV:CAC ratio, churn reduction revenue projections
- Pro conversion funnel: Install → Activated → Engaged → Trial → Pro → Retained Pro
- Admin dashboard HTML/CSS at zovo.one/admin/retention with summary cards, heatmap, funnel, campaign table, LTV breakdown
- Data collection architecture: opt-in telemetry (SHA-256 hashed ID, daily ping), Stripe webhooks, CWS API, survey responses
- PostgreSQL database schema: 8 tables (user_activity, install_events, subscription_events, uninstall_feedback, winback_campaigns, winback_emails, offers, retention_events, daily_metrics)
- System architecture diagram showing all component connections
- Complete event flows: healthy user, declining user, Pro downgrade, uninstall
- New modules summary: 23 modules across extension and server
- Implementation roadmap: 5 phases over 8-10 weeks

---

## Key Design Decisions

### Privacy-First Churn Detection
- All churn detection and engagement scoring runs entirely within the extension via chrome.storage.local
- No user data is sent to external servers for churn analysis
- Server-side telemetry is opt-in only, uses SHA-256 hashed install IDs, and sends only anonymous aggregates
- Win-back emails only sent to users who explicitly opted in to "product updates"
- Uninstall survey URL includes only anonymous aggregate stats (Focus Score, session count), never personal data

### Focus Mode-Specific Signals
- Generic churn signals (like "days since last login") are replaced with productivity-specific metrics: session frequency, Focus Score trend, streak health, Pomodoro completion rate
- The risk model weights are calibrated for a blocking/productivity extension where daily use is the goal
- Seasonal triggers align with productivity-relevant dates (exam seasons, New Year, back to school)

### Graceful Downgrade
- When Pro users downgrade, they choose which 5 sites to keep (not automatic truncation)
- Pro data (advanced stats, custom themes, full blocklist) is preserved and restored on re-upgrade
- Active Nuclear Mode sessions complete before Pro features are disabled
- The retention modal shows actual usage data, not generic warnings

### Milestone Celebration Philosophy
- Celebrations should feel rewarding without being annoying: max 1 notification per session, dismissable overlays, frequency caps on dormant reactivation
- Feature discovery is helpful, not salesy: suggestions based on actual usage patterns, never blocking functionality
- Pro upsells in discovery prompts are soft and contextual, always dismissable, never interrupting workflow

---

## Implementation Priority

| Priority | Component | Agent | Complexity |
|----------|-----------|-------|------------|
| P0 | Usage tracking + storage schema | Agent 1 | Low |
| P0 | FocusChurnDetector + daily alarm | Agent 1 | Medium |
| P0 | FocusMilestoneTracker + milestone config | Agent 4 | Medium |
| P0 | ExitSurveyHandler + uninstall URL | Agent 2 | Low |
| P1 | FocusHealthScoreCalculator | Agent 1 | Medium |
| P1 | FocusFeatureDiscovery + UI | Agent 4 | Medium |
| P1 | DormantUserReactivation | Agent 3 | Medium |
| P1 | Celebration + discovery popup UI | Agent 4 | Medium |
| P2 | Exit survey page (zovo.one) | Agent 2 | Medium |
| P2 | FocusDowngradeFlow + retention modal | Agent 2 | Medium |
| P2 | DowngradeExecutor + site selection | Agent 2 | Medium |
| P2 | Feedback processor + Slack alerts | Agent 2 | Medium |
| P3 | Win-back email templates (5 emails) | Agent 3 | Medium |
| P3 | FocusIncentiveEngine + offer codes | Agent 3 | Medium |
| P3 | Win-back campaign scheduler | Agent 3 | Medium |
| P3 | UpdateReengagement + seasonal | Agent 3 | Low |
| P4 | FocusRetentionMetrics API | Agent 5 | Medium |
| P4 | FocusLTVAnalysis | Agent 5 | Medium |
| P4 | Admin dashboard (zovo.one) | Agent 5 | Medium |
| P4 | Telemetry service + database schema | Agent 5 | Medium |

### Priority Definitions

- **P0 — Foundation (Week 1-2).** Core detection, tracking, and milestone infrastructure. All local extension code with no server dependency. Enables all other components.

- **P1 — In-Extension Retention (Week 2-3).** Health scoring, feature discovery, dormant reactivation, and celebration UI. These are the first user-facing retention features.

- **P2 — Exit & Downgrade (Week 3-5).** Server-side exit survey, downgrade flow with retention modal, and feedback processing. Requires zovo.one hosting.

- **P3 — Win-Back Campaigns (Week 4-6).** Email sequences, incentive engine, and campaign scheduling. Requires email service provider integration.

- **P4 — Dashboard & Analytics (Week 5-8).** Retention dashboard, LTV analysis, telemetry, and database. Provides visibility into all other components' effectiveness.

---

## Document Map

```
docs/
├── 17-churn-prevention-reactivation.md                           <- THIS FILE
└── churn-prevention/
    ├── agent1-churn-detection-engagement-scoring.md              <- Churn signals & health scoring
    ├── agent2-exit-survey-downgrade-flow.md                      <- Exit survey & Pro downgrade
    ├── agent3-winback-campaigns-recovery-tactics.md              <- Win-back emails & recovery
    ├── agent4-proactive-retention-triggers.md                    <- Milestones & feature discovery
    └── agent5-retention-metrics-dashboard.md                     <- Dashboard & integration
```

---

*Phase 17 — Churn Prevention & Reactivation — Complete*
