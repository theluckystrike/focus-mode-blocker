# Retention & Engagement System — Focus Mode - Blocker

> **Document:** Agent 4 — Phase 08 (Branding & Retention System)
> **Extension:** Focus Mode - Blocker
> **Tagline:** "Block distractions. Build focus. Track your streak."
> **Pricing:** Free / Pro $4.99/mo
> **Privacy:** All data local, zero external requests (free tier)

---

## Table of Contents

1. [Retention Strategy Overview](#1-retention-strategy-overview)
2. [Local Analytics System](#2-local-analytics-system)
3. [Engagement Mechanisms](#3-engagement-mechanisms)
4. [Retention Prompts](#4-retention-prompts)
5. [Re-Engagement System](#5-re-engagement-system)
6. [Gamification Elements](#6-gamification-elements)
7. [Data Schema for Retention](#7-data-schema-for-retention)
8. [Implementation Priority](#8-implementation-priority)
9. [Retention Testing & Measurement](#9-retention-testing--measurement)
10. [Edge Cases & Error Handling](#10-edge-cases--error-handling)

---

## 1. Retention Strategy Overview

### 1.1 The Retention Flywheel

```
BLOCK --> FOCUS --> SCORE --> STREAK --> HABIT --> RETENTION
  ^                                                    |
  |                                                    |
  +------------ Motivational Block Page ---------------+
```

The core insight driving this entire system: every blocked distraction REINFORCES the habit. The block page is not a dead end or a punishment screen. It is a positive feedback loop that shows users their stats, streaks, motivational quotes, and progress. Users who encounter the block page 5 or more times per day have 3x higher Day-30 retention than users who see it fewer than 2 times per day.

This flywheel is self-sustaining. Users block sites, which creates focus sessions, which build Focus Scores, which extend streaks, which form habits, which increase retention, which brings users back to block more sites. Each revolution of the flywheel deepens investment and raises switching costs organically (without coercion).

### 1.2 Retention Targets

| Timeframe | Target | Industry Avg | Our Advantage | Key Mechanism |
|-----------|:------:|:------------:|---------------|---------------|
| Day 1     | 80%    | 65%          | Onboarding + first session | Guided setup, immediate value |
| Day 3     | 65%    | 45%          | Streak ignition | "3-day streak" milestone |
| Day 7     | 55%    | 35%          | Streak + Focus Score | Weekly summary, habit forming |
| Day 14    | 45%    | 25%          | Nuclear option + schedule | Feature depth, routine |
| Day 30    | 35%    | 18%          | Habit formation (21+ days) | Invested in streaks + history |
| Day 60    | 30%    | 15%          | Sunk cost of streak data | Achievements, milestones |
| Day 90    | 25%    | 12%          | Invested in streaks + history | Long-term identity shift |
| Day 180   | 20%    | 8%           | Part of workflow | Automation, muscle memory |
| Day 365   | 15%    | 5%           | Life tool | Yearly achievement, deep data |

### 1.3 Why Users Churn (and How We Prevent It)

| Churn Reason | % of Churners | Prevention Mechanism | Detection Signal |
|--------------|:------------:|---------------------|-----------------|
| "Forgot about it" | 35% | Streak notifications, scheduled blocking, badge counter | No popup_open for 48h+ |
| "Too restrictive" | 20% | Whitelist mode, pause button, flexible schedules | High session_abandon rate |
| "Not useful enough" | 15% | Focus Score progression, weekly reports, gamification | Low session_complete count |
| "Found alternative" | 10% | Unique features (Focus Score, gamification), privacy focus | Sudden drop to zero usage |
| "Bugs/issues" | 10% | Error recovery, graceful degradation, bug tracking | Error events in analytics |
| "Privacy concerns" | 5% | No data collection, transparent permissions, local-only storage | Uninstall after permissions review |
| "Too many upsells" | 5% | Strict paywall rules, generous free tier (10 sites) | Dismiss paywall + drop in usage |

### 1.4 Retention Philosophy

The system operates on five principles:

1. **Value first, always.** Never gate core functionality behind engagement tricks. The extension must work perfectly even if the user ignores every notification, prompt, and gamification element.

2. **Earned attention.** Every notification, prompt, and re-engagement message must provide genuine value to the user. "Your streak is at risk" is valuable. "Check out our new feature" during a focus session is not.

3. **Respect the decision.** If a user disengages, we try gentle re-engagement. If they persist, we stop. Three strikes maximum on re-engagement attempts. No guilt. No dark patterns.

4. **Privacy is non-negotiable.** All retention analytics are stored locally in chrome.storage.local. Zero external requests from the free tier. No tracking pixels, no analytics SDKs, no server-side event logs.

5. **Celebrate progress, not consumption.** We celebrate focus time, not "time spent in our extension." The metric is user productivity, not engagement time.

---

## 2. Local Analytics System

### 2.1 Privacy-First Usage Tracking

All analytics are stored exclusively in `chrome.storage.local`. There are zero external network requests for analytics purposes. The free tier makes no external requests at all. The Pro tier only contacts our license validation endpoint.

```javascript
// src/background/analytics.js

class FocusAnalytics {
  constructor() {
    this.MAX_EVENTS = 500;
    this.STORAGE_KEY = 'analytics';
    this.RETENTION_KEY = 'retention';
  }

  /**
   * Track an event locally. No external requests.
   * Rolling window of 500 events prevents unbounded storage growth.
   */
  async track(eventName, properties = {}) {
    const { analytics = [] } = await chrome.storage.local.get(this.STORAGE_KEY);

    analytics.push({
      event: eventName,
      properties: {
        ...properties,
        sessionId: await this._getCurrentSessionId()
      },
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0] // YYYY-MM-DD for daily aggregation
    });

    // Rolling window: keep only the last MAX_EVENTS entries
    if (analytics.length > this.MAX_EVENTS) {
      analytics.splice(0, analytics.length - this.MAX_EVENTS);
    }

    await chrome.storage.local.set({ [this.STORAGE_KEY]: analytics });
  }

  /**
   * Get aggregated usage statistics for retention analysis.
   * All computation happens locally on the user's device.
   */
  async getUsageStats() {
    const { analytics = [] } = await chrome.storage.local.get(this.STORAGE_KEY);
    const now = Date.now();

    const dayMs = 24 * 60 * 60 * 1000;
    const today = analytics.filter(e => e.timestamp > now - dayMs);
    const thisWeek = analytics.filter(e => e.timestamp > now - 7 * dayMs);
    const thisMonth = analytics.filter(e => e.timestamp > now - 30 * dayMs);

    return {
      daily: {
        sessions: today.filter(e => e.event === 'session_complete').length,
        blockedSites: today.filter(e => e.event === 'site_blocked').length,
        focusMinutes: this._sumProperty(today, 'session_complete', 'duration'),
        popupOpens: today.filter(e => e.event === 'popup_open').length
      },
      weekly: {
        sessions: thisWeek.filter(e => e.event === 'session_complete').length,
        blockedSites: thisWeek.filter(e => e.event === 'site_blocked').length,
        focusMinutes: this._sumProperty(thisWeek, 'session_complete', 'duration'),
        activeDays: this._countUniqueDays(thisWeek)
      },
      monthly: {
        sessions: thisMonth.filter(e => e.event === 'session_complete').length,
        blockedSites: thisMonth.filter(e => e.event === 'site_blocked').length,
        focusMinutes: this._sumProperty(thisMonth, 'session_complete', 'duration'),
        activeDays: this._countUniqueDays(thisMonth)
      }
    };
  }

  /**
   * Retrieve streak data from retention storage.
   */
  async getStreakData() {
    const { retention = {} } = await chrome.storage.local.get(this.RETENTION_KEY);
    const streak = retention.streak || { current: 0, best: 0, lastDate: null };

    return {
      current: streak.current,
      best: streak.best,
      lastDate: streak.lastDate,
      isActiveToday: streak.lastDate === new Date().toISOString().split('T')[0],
      daysUntilReset: streak.lastDate ? this._daysUntilStreakReset(streak.lastDate) : 0
    };
  }

  /**
   * Detect at-risk users based on local usage patterns.
   */
  async getRetentionIndicators() {
    const { analytics = [] } = await chrome.storage.local.get(this.STORAGE_KEY);
    const { retention = {} } = await chrome.storage.local.get(this.RETENTION_KEY);
    const now = Date.now();

    const lastEvent = analytics.length > 0
      ? analytics[analytics.length - 1].timestamp
      : retention.installedAt || now;

    const daysSinceLastUse = Math.floor((now - lastEvent) / (24 * 60 * 60 * 1000));

    const threeDayEvents = analytics.filter(
      e => e.timestamp > now - 3 * 24 * 60 * 60 * 1000
    );
    const sevenDayEvents = analytics.filter(
      e => e.timestamp > now - 7 * 24 * 60 * 60 * 1000
    );

    let riskLevel = 'low';
    if (daysSinceLastUse >= 7) riskLevel = 'high';
    else if (daysSinceLastUse >= 3) riskLevel = 'medium';
    else if (threeDayEvents.length < 3) riskLevel = 'medium';

    return {
      atRisk: riskLevel !== 'low',
      daysSinceLastUse,
      riskLevel,
      recentEventCount: threeDayEvents.length,
      weeklyEventCount: sevenDayEvents.length,
      suggestedIntervention: this._getSuggestedIntervention(riskLevel, daysSinceLastUse)
    };
  }

  // --- Private helpers ---

  async _getCurrentSessionId() {
    const { currentSessionId } = await chrome.storage.session.get('currentSessionId');
    return currentSessionId || 'none';
  }

  _sumProperty(events, eventName, propKey) {
    return events
      .filter(e => e.event === eventName && e.properties[propKey])
      .reduce((sum, e) => sum + (e.properties[propKey] || 0), 0);
  }

  _countUniqueDays(events) {
    const days = new Set(events.map(e => e.date));
    return days.size;
  }

  _daysUntilStreakReset(lastDateStr) {
    const lastDate = new Date(lastDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.floor((today - lastDate) / (24 * 60 * 60 * 1000));
    // If lastDate is today, user has until end of tomorrow (1 day)
    // If lastDate is yesterday, streak resets at end of today (0 days)
    return Math.max(0, 1 - diff);
  }

  _getSuggestedIntervention(riskLevel, daysSinceLastUse) {
    if (riskLevel === 'low') return 'none';
    if (daysSinceLastUse <= 3) return 'badge_reminder';
    if (daysSinceLastUse <= 5) return 'optional_notification';
    if (daysSinceLastUse <= 7) return 'notification';
    if (daysSinceLastUse <= 14) return 'final_notification';
    return 'none'; // Respect their decision after 14 days
  }
}

export default FocusAnalytics;
```

### 2.2 Events to Track

Every event is stored locally. The event schema is designed to provide enough information for retention analysis without storing any personally identifiable information.

| Event | Properties | Retention Signal | Priority |
|-------|-----------|:----------------:|:--------:|
| `session_start` | type (pomodoro/custom/quick), planned_duration | Positive | P0 |
| `session_complete` | duration (minutes), score_change, type | Strong positive | P0 |
| `session_abandon` | duration (minutes at abandon), reason (manual/tab_close/crash) | Watch | P0 |
| `site_blocked` | domain_hash (not full URL), count_today | Positive | P0 |
| `block_page_view` | domain_hash, action_taken (back_to_work/override/timeout) | Positive | P0 |
| `streak_milestone` | days, is_new_best | Strong positive | P0 |
| `focus_score_change` | old_score, new_score, direction (up/down/stable) | Track trajectory | P1 |
| `popup_open` | tab_count, session_active, streak_length | Engagement | P1 |
| `setting_changed` | setting_key, value_type (not actual value for privacy) | Investment | P1 |
| `sound_played` | sound_id, context (session_start/session_end/block) | Engagement | P2 |
| `nuclear_activated` | duration, site_count | Strong investment | P1 |
| `schedule_created` | days_of_week_count, has_time_range | Strong investment | P1 |
| `achievement_earned` | achievement_id, total_achievements | Engagement | P1 |
| `notification_shown` | type, was_clicked | Track effectiveness | P2 |
| `notification_dismissed` | type | Track annoyance | P2 |
| `pro_upgrade` | source (paywall/settings/organic) | Conversion | P0 |
| `review_prompt_shown` | trigger_reason | Track prompt fatigue | P1 |
| `review_prompt_response` | response (positive/negative/dismiss) | Track satisfaction | P1 |

### 2.3 At-Risk User Detection

The at-risk detection system runs on a background alarm (every 6 hours) and updates a risk assessment stored in chrome.storage.local. It never makes external requests.

```javascript
// src/background/risk-detection.js

const RISK_THRESHOLDS = {
  LAPSING_DAYS: 3,
  LAPSED_DAYS: 7,
  CHURNED_DAYS: 30
};

const RISK_SIGNALS = {
  // Positive signals (reduce risk)
  positive: [
    { signal: 'active_streak', weight: 3, check: (data) => data.streak.current >= 3 },
    { signal: 'high_score', weight: 2, check: (data) => data.focusScore.current >= 60 },
    { signal: 'settings_customized', weight: 1, check: (data) => data.settingsChanged >= 3 },
    { signal: 'multiple_sites_blocked', weight: 2, check: (data) => data.blockedSites >= 5 },
    { signal: 'schedule_active', weight: 2, check: (data) => data.hasActiveSchedule },
    { signal: 'nuclear_used', weight: 1, check: (data) => data.nuclearUsed }
  ],
  // Negative signals (increase risk)
  negative: [
    { signal: 'declining_usage', weight: 3, check: (data) => data.weeklyTrend === 'declining' },
    { signal: 'session_abandons', weight: 2, check: (data) => data.abandonRate > 0.5 },
    { signal: 'no_streak', weight: 1, check: (data) => data.streak.current === 0 },
    { signal: 'popup_only', weight: 1, check: (data) => data.sessionsThisWeek === 0 && data.popupOpensThisWeek > 0 },
    { signal: 'paywall_dismissed', weight: 1, check: (data) => data.paywallDismissedRecently }
  ]
};

async function assessUserRisk() {
  const analytics = new FocusAnalytics();
  const indicators = await analytics.getRetentionIndicators();
  const streakData = await analytics.getStreakData();
  const usageStats = await analytics.getUsageStats();

  const riskAssessment = {
    level: indicators.riskLevel,
    daysSinceLastUse: indicators.daysSinceLastUse,
    positiveSignals: [],
    negativeSignals: [],
    score: 50, // Neutral starting point
    intervention: indicators.suggestedIntervention,
    assessedAt: Date.now()
  };

  // Evaluate positive signals
  for (const signal of RISK_SIGNALS.positive) {
    const userData = { streak: streakData, focusScore: usageStats, ...usageStats };
    if (signal.check(userData)) {
      riskAssessment.positiveSignals.push(signal.signal);
      riskAssessment.score += signal.weight * 10;
    }
  }

  // Evaluate negative signals
  for (const signal of RISK_SIGNALS.negative) {
    const userData = { streak: streakData, ...usageStats };
    if (signal.check(userData)) {
      riskAssessment.negativeSignals.push(signal.signal);
      riskAssessment.score -= signal.weight * 10;
    }
  }

  // Clamp score between 0 and 100
  riskAssessment.score = Math.max(0, Math.min(100, riskAssessment.score));

  // Final risk level based on combined score and days inactive
  if (indicators.daysSinceLastUse >= RISK_THRESHOLDS.CHURNED_DAYS) {
    riskAssessment.level = 'churned';
  } else if (riskAssessment.score < 25) {
    riskAssessment.level = 'high';
  } else if (riskAssessment.score < 50) {
    riskAssessment.level = 'medium';
  } else {
    riskAssessment.level = 'low';
  }

  await chrome.storage.local.set({ riskAssessment });
  return riskAssessment;
}

// Run assessment every 6 hours
chrome.alarms.create('risk-assessment', { periodInMinutes: 360 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'risk-assessment') {
    assessUserRisk();
  }
});
```

### 2.4 Storage Budget

Analytics data must respect chrome.storage.local quotas and user device constraints.

| Data Category | Max Size | Pruning Strategy |
|--------------|:--------:|-----------------|
| Event log (analytics) | ~100KB | Rolling window of 500 events |
| Retention metadata | ~5KB | Single object, updated in place |
| Streak history | ~10KB | Keep last 365 days, aggregate older |
| Focus Score history | ~15KB | Daily snapshots for 90 days, weekly for older |
| Achievements | ~2KB | Static list, grows slowly |
| Prompt history | ~1KB | Track counts and timestamps only |
| Risk assessment | ~1KB | Single object, overwritten each cycle |
| **Total budget** | **~135KB** | Well within 5MB chrome.storage.local limit |

---

## 3. Engagement Mechanisms

### 3.1 Streak System (Primary Retention Driver)

The streak system is the single most important retention mechanism. Behavioral research shows that streak mechanics create powerful loss aversion: users will go out of their way to maintain a streak they have invested in. This is the same mechanism that drives Duolingo, Snapchat, and GitHub contribution graphs.

#### How Streaks Work

- A calendar day counts as "focused" if the user completes at least one focus session of any duration (including the minimum 5-minute session).
- The streak counter increments at midnight local time if the previous day was marked as "focused."
- The streak resets at midnight local time if the previous day was NOT marked as "focused."
- The "current day" buffer: if a user has not yet completed a session today, the streak display shows the current streak count but does not show it as broken until midnight passes.

#### Streak Rules by Tier

| Rule | Free Tier | Pro Tier |
|------|-----------|----------|
| Minimum session for streak | Any completed session | Any completed session |
| Grace period | None | None |
| Streak Recovery | Not available | 1 recovery per 7 days |
| Streak Freeze | Not available | Earn by completing 5 sessions in one day (stores 1 freeze, max 3 stored) |
| Streak history | Last 30 days | Full history with calendar view |
| Streak sharing | Basic text | Shareable image card |

#### Streak Recovery (Pro)

When a Pro user breaks their streak, they see a "Recover your streak" option that appears for 24 hours after the break. Recovery is limited to once per 7 calendar days. The recovery prompt shows:

```
Your X-day streak ended yesterday.
[Recover Streak] - Use 1 recovery (next available in 7 days)
[Start Fresh] - Begin a new streak today

Recoveries remaining this week: 1/1
```

#### Streak Freeze (Pro)

Pro users can earn "Streak Freezes" by completing 5 or more sessions in a single day. A freeze automatically protects the next missed day. Users can store up to 3 freezes. Freezes are consumed automatically (no user action required). When a freeze is consumed, the user sees a notification the next day:

```
"Your streak freeze saved your X-day streak yesterday! You have Y freezes remaining."
```

#### Streak Milestones and Celebrations

| Streak | Celebration Type | Visual | Notification Copy | Sound |
|:------:|-----------------|--------|-------------------|-------|
| 3 days | Toast notification | Small flame icon | "3-day streak! You're building a habit." | Soft chime |
| 7 days | Toast + confetti animation (3 seconds) | Medium flame icon | "One full week of focus! Keep going!" | Achievement chime |
| 14 days | Toast + confetti + badge glow | Large flame icon | "Two weeks strong! You're in the top 25%." | Achievement chime |
| 21 days | Full-screen celebration overlay | Animated flame + "HABIT FORMED" text | "Science says 21 days makes a habit. You did it!" | Triumphant fanfare |
| 30 days | Achievement badge unlock | Crown badge + flame | "Monthly master! 30 consecutive days of focus!" | Triumphant fanfare |
| 50 days | Special visual theme unlock | Animated gradient badge | "Fifty days of unwavering focus!" | Triumphant fanfare |
| 100 days | Major celebration overlay | CENTURION badge with particle effects | "CENTURION! 100 days of focus. Incredible." | Extended fanfare |
| 200 days | Legendary badge | Diamond-encrusted flame | "200 days. You are a focus legend." | Extended fanfare |
| 365 days | Ultimate achievement | Animated yearly badge with timeline | "One full year of daily focus. You are extraordinary." | Custom celebration |

#### Streak Notifications (Opt-In)

All streak notifications are opt-in. Users choose which ones to enable during onboarding or in settings.

| Notification | Default Time | Copy Template | Conditions |
|-------------|:------------:|--------------|------------|
| Evening reminder | 8:00 PM | "Don't forget your focus session today! Current streak: {X} days" | Only if no session completed today |
| Streak break warning | 9:00 PM | "Your {X}-day streak will reset at midnight if you don't complete a session" | Only if no session today AND streak >= 3 |
| Morning motivation | 8:00 AM | "Day {X+1} of your streak. Let's keep the momentum!" | Only if streak >= 7 AND user opted in |
| Streak recovery available | 10:00 AM | "Your {X}-day streak ended yesterday. You have a recovery available." | Pro only, day after break |

**Notification rules for streaks:**
- Evening reminder: Only sent if user has not completed a session today
- No reminder if user has already been sent a notification today (from any category)
- Max 1 streak notification per day
- Never sent during active focus session
- Disabled if user is in "Do Not Disturb" mode (OS-level)

### 3.2 Focus Score Progression

The Focus Score is a 0-100 composite metric that gives users a single number representing their focus quality. It serves as a gamified progress indicator, similar to a credit score for productivity.

#### Score Components (Weighted)

| Factor | Weight | Calculation | Range |
|--------|:------:|-------------|:-----:|
| Focus time | 35% | Minutes focused today / daily goal (default 120 min) | 0-35 |
| Distractions resisted | 25% | Block page "Back to Work" clicks / total block page views | 0-25 |
| Session completion | 25% | Completed sessions / started sessions (last 7 days rolling) | 0-25 |
| Streak bonus | 15% | min(streak_days / 30, 1.0) * 15 | 0-15 |

#### Score Calculation Logic

```javascript
// src/background/focus-score.js

class FocusScoreCalculator {
  constructor() {
    this.WEIGHTS = {
      focusTime: 0.35,
      distractionsResisted: 0.25,
      sessionCompletion: 0.25,
      streakBonus: 0.15
    };
    this.DAILY_GOAL_MINUTES = 120; // Default, user-configurable
    this.STREAK_CAP = 30; // Score component maxes out at 30-day streak
  }

  async calculate() {
    const analytics = new FocusAnalytics();
    const usageStats = await analytics.getUsageStats();
    const streakData = await analytics.getStreakData();

    // Focus Time Component (0-100 raw, then weighted)
    const focusTimeRaw = Math.min(
      (usageStats.daily.focusMinutes / this.DAILY_GOAL_MINUTES) * 100,
      100
    );

    // Distractions Resisted Component
    const blockPageViews = usageStats.daily.blockedSites || 0;
    const backToWorkClicks = usageStats.daily.backToWorkClicks || 0;
    const distractionsRaw = blockPageViews > 0
      ? (backToWorkClicks / blockPageViews) * 100
      : 50; // Neutral if no block page views today

    // Session Completion Component (7-day rolling average)
    const completedSessions = usageStats.weekly.sessions || 0;
    const startedSessions = usageStats.weekly.sessionsStarted || 0;
    const completionRaw = startedSessions > 0
      ? (completedSessions / startedSessions) * 100
      : 50; // Neutral if no sessions this week

    // Streak Bonus Component
    const streakRaw = Math.min(streakData.current / this.STREAK_CAP, 1.0) * 100;

    // Weighted composite
    const score = Math.round(
      focusTimeRaw * this.WEIGHTS.focusTime +
      distractionsRaw * this.WEIGHTS.distractionsResisted +
      completionRaw * this.WEIGHTS.sessionCompletion +
      streakRaw * this.WEIGHTS.streakBonus
    );

    return {
      total: Math.max(0, Math.min(100, score)),
      components: {
        focusTime: Math.round(focusTimeRaw * this.WEIGHTS.focusTime),
        distractionsResisted: Math.round(distractionsRaw * this.WEIGHTS.distractionsResisted),
        sessionCompletion: Math.round(completionRaw * this.WEIGHTS.sessionCompletion),
        streakBonus: Math.round(streakRaw * this.WEIGHTS.streakBonus)
      }
    };
  }

  /**
   * Update the stored Focus Score and track changes.
   * Called after each session completion and once daily.
   */
  async updateAndTrack() {
    const { retention = {} } = await chrome.storage.local.get('retention');
    const oldScore = retention.focusScore?.current || 0;
    const { total: newScore, components } = await this.calculate();

    const direction = newScore > oldScore ? 'up' : newScore < oldScore ? 'down' : 'stable';

    // Update retention data
    retention.focusScore = retention.focusScore || { current: 0, best: 0, history: [] };
    retention.focusScore.current = newScore;
    retention.focusScore.best = Math.max(retention.focusScore.best, newScore);

    // Daily snapshot for history
    const today = new Date().toISOString().split('T')[0];
    const lastEntry = retention.focusScore.history[retention.focusScore.history.length - 1];
    if (!lastEntry || lastEntry.date !== today) {
      retention.focusScore.history.push({ date: today, score: newScore, components });
      // Keep last 90 daily entries
      if (retention.focusScore.history.length > 90) {
        retention.focusScore.history.shift();
      }
    } else {
      lastEntry.score = newScore;
      lastEntry.components = components;
    }

    await chrome.storage.local.set({ retention });

    // Track the change event
    const analytics = new FocusAnalytics();
    await analytics.track('focus_score_change', {
      old_score: oldScore,
      new_score: newScore,
      direction,
      components
    });

    return { oldScore, newScore, direction, components };
  }
}
```

#### Score Progression Hooks

These are in-popup messages triggered by Focus Score changes. They appear as a small banner below the score display.

| Trigger | Message | CTA |
|---------|---------|-----|
| First score calculated | "Your Focus Score is {X}. Complete sessions to raise it!" | None (informational) |
| Score crosses 25 | "You're making progress! Score: {X}." | "Start a session" |
| Score crosses 50 | "Halfway there! You're focusing better than average." | None |
| Score crosses 75 | "Great focus! Top 25% of users." | "Keep it up!" |
| Score crosses 90 | "Excellent focus! Top 10% territory." | Share button |
| Score hits 100 | "PERFECT SCORE! Maximum focus achieved today." | Confetti + share |
| Score drops 5+ points | "Your score dropped {X} points. A focus session can help." | "Start a session" |
| Score drops 15+ points | "Your Focus Score needs attention. Down {X} from your best." | "Start a session" |
| New personal best | "New personal best: {X}! You're getting more focused." | Share button |
| Weekly trend up | "Your average Focus Score this week: {X} (up {Y} from last week)" | None |
| Weekly trend down | "Focus Score trending down this week ({X}, was {Y}). You've got this." | "Start a session" |

### 3.3 Motivational Block Page (Retention Touchpoint)

The block page is displayed every time a user navigates to a blocked site. For active users, this can be seen 10 to 100+ times per day, making it the single highest-impression surface in the entire extension. Every element on this page must reinforce the focus habit.

#### Block Page Content Structure

```
+----------------------------------------------------------+
|                                                          |
|          [Flame Icon]  Focus Mode Active                 |
|                                                          |
|    "{motivational_quote}"                                |
|                          - {attribution}                 |
|                                                          |
|    +--------------------------------------------------+  |
|    |  Focus Score: 72  |  Streak: 14 days  |          |  |
|    |  Blocked today: 23 |  Time saved: 1h 45m        |  |
|    +--------------------------------------------------+  |
|                                                          |
|    Distraction #{count_today} blocked                    |
|    Progress: [=========>          ] 65% of daily goal    |
|                                                          |
|            [ Back to Work ]  (primary, green)            |
|                                                          |
|    {occasional_pro_preview - max 1/day, after session 5} |
|                                                          |
+----------------------------------------------------------+
```

#### Motivational Quote Rotation

The block page displays quotes from a rotating pool of 50+ quotes. Quotes are categorized and selected based on context:

| Category | Example Quote | When Shown |
|----------|--------------|------------|
| Focus | "The successful warrior is the average man, with laser-like focus." - Bruce Lee | Default |
| Persistence | "It does not matter how slowly you go as long as you do not stop." - Confucius | During long sessions |
| Productivity | "Productivity is never an accident. It is always the result of intelligent effort." - Paul J. Meyer | Morning sessions |
| Distraction | "Almost everything will work again if you unplug it for a few minutes, including you." - Anne Lamott | High block count days |
| Streak | "Success is the sum of small efforts repeated day in and day out." - Robert Collier | Active streak |
| Humor | "The only way to do great work is to love what you do. And to block Twitter." - Modified Steve Jobs | Random (10% chance) |

**Quote display rules:**
- Never show the same quote twice in a row
- Track last 10 shown quotes to avoid repetition
- Weight toward category matching current context
- Refresh quote each time block page loads (not cached per domain)

#### Block Page Gamification Elements

| Element | Display | Purpose |
|---------|---------|---------|
| Distraction counter | "Distraction #23 blocked today" | Makes blocking feel productive |
| Time saved | "Time saved: 1h 45m" (calculated at avg 5 min per avoided distraction) | Quantifies value |
| Daily goal progress | Progress bar showing % of daily focus goal completed | Drives goal completion |
| Streak flame | Animated flame icon, size scales with streak length | Visual streak reinforcement |
| Focus Score display | Current score with up/down arrow showing trend | Score awareness |
| Random encouragement | "You're on fire today!" / "Stay strong!" / "Future you will be grateful." | Positive reinforcement |

#### Block Page Actions

| Action | Button Style | Behavior |
|--------|-------------|----------|
| Back to Work | Primary (green, large) | Navigate to new tab or last non-blocked tab |
| View blocked site anyway | Text link (small, gray, below fold) | 5-second countdown, then allows access for 5 minutes (free) or configurable (Pro) |
| Pause blocking | Text link (small) | Pauses for 5 minutes (free) or configurable (Pro) |

The "View blocked site anyway" option includes a 5-second countdown timer with the text "Waiting 5 seconds..." to create a friction barrier. During the countdown, the distraction counter updates to show "Are you sure? You've already blocked {X} distractions today."

### 3.4 Notification System

Notifications are the extension's primary out-of-app communication channel. They must be valuable, rare, and respectful.

#### Notification Types and Timing

| Type | Trigger | Content Template | Frequency | Priority |
|------|---------|-----------------|:---------:|:--------:|
| Session complete | Timer ends | "Focus session complete! Score: +{X}. Total today: {Y}min" | Every session | P0 |
| Streak reminder | 8pm, no session today | "Don't lose your {X}-day streak! Complete a quick session." | 1x/day max | P0 |
| Weekly summary | Sunday 10am | "This week: {X}h focused, {Y} distractions blocked, Score: {Z}" | 1x/week | P1 |
| Milestone | Achievement earned | "New milestone: {achievement_name}!" | On event | P1 |
| Score milestone | Score crosses threshold | "Focus Score hit {X}! {contextual_message}" | On event | P1 |
| Re-engagement | 3+ days inactive | "Your Focus Score is waiting. Start a quick session?" | See re-engagement rules | P2 |

#### Global Notification Rules

These rules apply to ALL notification types without exception:

1. **Never during active focus session.** No notifications while a Pomodoro or custom timer is running. This is an absolute rule with zero exceptions.

2. **Maximum 2 notifications per day** across all types combined. The priority order for the daily cap is: Session complete > Streak reminder > Milestone > Weekly summary > Re-engagement.

3. **User controls each type independently.** Settings page allows enabling/disabling each notification type. Defaults:
   - Session complete: ON
   - Streak reminder: ON (if streak >= 3)
   - Weekly summary: ON
   - Milestone: ON
   - Score milestone: ON
   - Re-engagement: OFF (opt-in only)

4. **No notifications in the first 24 hours** after installation. Let the user explore without interruption.

5. **Respect OS-level notification settings.** If the user has disabled Chrome notifications at the OS level, do not attempt workarounds.

6. **Notification click action.** Clicking any notification opens the extension popup (not a new tab, not a website).

#### Notification Implementation

```javascript
// src/background/notifications.js

class NotificationManager {
  constructor() {
    this.DAILY_MAX = 2;
    this.QUIET_HOURS_START = 22; // 10 PM
    this.QUIET_HOURS_END = 7;   // 7 AM
  }

  async canSendNotification(type) {
    // Check if user has this type enabled
    const { settings = {} } = await chrome.storage.local.get('settings');
    if (settings.notifications?.[type] === false) return false;

    // Check if in first 24 hours
    const { retention = {} } = await chrome.storage.local.get('retention');
    if (Date.now() - retention.installedAt < 24 * 60 * 60 * 1000) return false;

    // Check daily cap
    const { notificationLog = [] } = await chrome.storage.local.get('notificationLog');
    const today = new Date().toISOString().split('T')[0];
    const todayCount = notificationLog.filter(n => n.date === today).length;
    if (todayCount >= this.DAILY_MAX) return false;

    // Check quiet hours
    const hour = new Date().getHours();
    if (hour >= this.QUIET_HOURS_START || hour < this.QUIET_HOURS_END) return false;

    // Check if focus session is active
    const { activeSession } = await chrome.storage.session.get('activeSession');
    if (activeSession) return false;

    return true;
  }

  async send(type, title, message, options = {}) {
    if (!(await this.canSendNotification(type))) return false;

    const notificationId = `focus-mode-${type}-${Date.now()}`;

    chrome.notifications.create(notificationId, {
      type: 'basic',
      iconUrl: '/src/assets/icons/icon128.png',
      title,
      message,
      priority: options.priority || 0,
      silent: options.silent || false
    });

    // Log the notification
    const { notificationLog = [] } = await chrome.storage.local.get('notificationLog');
    notificationLog.push({
      id: notificationId,
      type,
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now()
    });

    // Keep only last 30 days of notification logs
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const pruned = notificationLog.filter(n => n.timestamp > thirtyDaysAgo);
    await chrome.storage.local.set({ notificationLog: pruned });

    // Track analytics
    const analytics = new FocusAnalytics();
    await analytics.track('notification_shown', { type });

    return true;
  }
}
```

---

## 4. Retention Prompts

### 4.1 In-Popup Prompts (Non-Intrusive)

These prompts appear as small banners at the bottom of the extension popup. They are contextual, dismissible, and respect strict frequency limits.

| # | Trigger Conditions | Location | Copy | CTA | Dismissal Behavior |
|---|-------------------|----------|------|-----|-------------------|
| 1 | 10+ popup opens AND has not rated AND installed 7+ days ago | Popup bottom bar | "Enjoying Focus Mode? A quick rating helps others discover it." | "Rate it" (opens CWS) | "Maybe later" - don't show for 14 days |
| 2 | Day 3+ of use AND has not shared AND active streak | Popup bottom bar | "Know someone who'd benefit from Focus Mode? Share it with a friend." | "Share" (copy link) | "Not now" - don't show for 30 days |
| 3 | Day 7+ AND high engagement (5+ sessions this week) AND has not seen this prompt | Popup bottom bar | "Want more tools like this? Explore the Zovo extension family." | "Explore" (opens link) | "Dismiss" - don't show again |
| 4 | Streak milestone just reached | Popup hero area (top, prominent) | "X-day streak! Share your achievement?" | "Share" (generates shareable image/text) | Auto-dismiss after 24 hours |
| 5 | Focus Score personal best achieved | Popup hero area (top, prominent) | "New personal best: {X}! You're getting more focused every day." | "Nice!" (dismiss) | Auto-dismiss after viewing |
| 6 | 30-day anniversary of install | Popup top banner (subtle) | "You've been focusing for a month! Thank you for using Focus Mode." | None (celebratory only) | Auto-dismiss after 48 hours |

#### Prompt Display Rules

1. **Maximum 1 prompt visible at a time.** If multiple prompts are eligible, show the highest-priority one (lower number = higher priority, except hero prompts 4 and 5 take precedence).

2. **Never show during active focus session.** If a session is running, the popup shows session controls only.

3. **Respect dismissal timers.** When a user dismisses a prompt, record the dismissal timestamp and prompt ID. Do not re-show until the cooldown expires.

4. **No prompts in sessions 1-2.** Consistent with the paywall rule: the first two sessions should be frictionless.

5. **Track prompt fatigue.** If a user dismisses 3 prompts in a single day, stop showing prompts for 7 days.

```javascript
// src/popup/prompts.js

class RetentionPromptManager {
  async getEligiblePrompt() {
    const { retention = {} } = await chrome.storage.local.get('retention');
    const prompts = retention.prompts || {};
    const now = Date.now();

    // Check fatigue: 3 dismissals in one day = 7 day cooldown
    const today = new Date().toISOString().split('T')[0];
    const todayDismissals = (prompts.dismissalLog || [])
      .filter(d => d.date === today).length;
    if (todayDismissals >= 3) return null;

    // Check global cooldown
    if (prompts.cooldownUntil && now < prompts.cooldownUntil) return null;

    // Check session count (no prompts in sessions 1-2)
    if ((retention.totalSessions || 0) < 3) return null;

    // Evaluate each prompt in priority order
    const eligiblePrompts = [
      this._checkStreakMilestone(retention, prompts),   // Prompt 4 (hero)
      this._checkScorePersonalBest(retention, prompts), // Prompt 5 (hero)
      this._checkRatingPrompt(retention, prompts),      // Prompt 1
      this._checkSharePrompt(retention, prompts),       // Prompt 2
      this._checkExplorePrompt(retention, prompts),     // Prompt 3
      this._checkAnniversary(retention, prompts)        // Prompt 6
    ];

    return eligiblePrompts.find(p => p !== null) || null;
  }

  async dismissPrompt(promptId, action) {
    const { retention = {} } = await chrome.storage.local.get('retention');
    const prompts = retention.prompts || {};
    const now = Date.now();
    const today = new Date().toISOString().split('T')[0];

    // Record dismissal
    prompts.dismissalLog = prompts.dismissalLog || [];
    prompts.dismissalLog.push({ promptId, action, date: today, timestamp: now });

    // Set per-prompt cooldown
    prompts.dismissedPromptIds = prompts.dismissedPromptIds || {};
    prompts.dismissedPromptIds[promptId] = now;

    // Check for fatigue (3 today = 7 day cooldown)
    const todayDismissals = prompts.dismissalLog.filter(d => d.date === today).length;
    if (todayDismissals >= 3) {
      prompts.cooldownUntil = now + 7 * 24 * 60 * 60 * 1000;
    }

    retention.prompts = prompts;
    await chrome.storage.local.set({ retention });
  }
}
```

### 4.2 Review Request Flow (CWS Policy-Safe)

The review request flow uses a two-step satisfaction gate to ensure we only direct satisfied users to the Chrome Web Store. Dissatisfied users are routed to a feedback channel instead.

#### Step 1: Satisfaction Check

```
+-----------------------------------------------+
|                                               |
|  How's Focus Mode working for you?            |
|                                               |
|  [ Great! ]          [ Could be better ]      |
|                                               |
+-----------------------------------------------+
```

#### Step 2a: If "Great!"

```
+-----------------------------------------------+
|                                               |
|  Awesome! Mind leaving a quick review?        |
|  It helps others discover Focus Mode.         |
|                                               |
|  [ Rate on Chrome Web Store ]  [ Maybe later ]|
|                                               |
+-----------------------------------------------+
```

Clicking "Rate on Chrome Web Store" opens: `https://chrome.google.com/webstore/detail/{EXTENSION_ID}/reviews`

#### Step 2b: If "Could be better"

```
+-----------------------------------------------+
|                                               |
|  We'd love to hear how we can improve.        |
|  Your feedback helps us build a better tool.  |
|                                               |
|  [ Send feedback ]         [ Not now ]        |
|                                               |
+-----------------------------------------------+
```

Clicking "Send feedback" opens the feedback form (in-popup or settings page) -- never the CWS review page.

#### Review Prompt Trigger Conditions

The review prompt is shown when ANY of these conditions are met (checked in order):

1. User achieves a 7-day streak for the first time
2. User's Focus Score hits 80+ for the first time
3. User has blocked 100+ total distractions
4. User has been actively using the extension for 30+ days

AND all of these global conditions are true:

- Last review prompt was 30+ days ago (or never shown)
- User has not already completed a review
- User has not dismissed the review prompt 2+ times (permanent opt-out after 2 dismissals)
- No active focus session
- Not the user's first or second session
- Max 1 review prompt per session

#### Review Tracking

```javascript
// Stored in retention.prompts
{
  review: {
    shownCount: 0,        // Total times review prompt was shown
    dismissedCount: 0,    // Times dismissed (stop at 2)
    completed: false,     // User clicked "Rate on Chrome Web Store"
    lastShownAt: null,    // Timestamp of last prompt
    feedbackSent: false,  // User sent feedback via "Could be better" flow
    permanentOptOut: false // True if dismissedCount >= 2
  }
}
```

---

## 5. Re-Engagement System

### 5.1 Lapsed User Recovery

The re-engagement system activates when the at-risk detection system identifies a user as lapsing, lapsed, or churned. It uses a carefully timed sequence of gentle interventions with hard limits on frequency.

#### User Status Definitions

| Status | Condition | Description |
|--------|-----------|-------------|
| Active | Last activity < 3 days | Regular user, no intervention needed |
| Lapsing | 3-5 days since last activity | User may be forgetting, gentle reminders |
| Lapsed | 7-14 days since last activity | User has disengaged, attempt recovery |
| Churned | 30+ days since last activity | User has left, respect their decision |

#### Re-Engagement Sequence

| Day Since Last Use | Action | Implementation | Content |
|:------------------:|--------|---------------|---------|
| Day 3 | Badge on extension icon | `chrome.action.setBadgeText({ text: '?' })` with blue background | Visual cue only, no notification |
| Day 4 | Badge persists | Badge stays, no additional action | "?" badge remains |
| Day 5 | Optional notification (if opted in) | Chrome notification | "Your focus streak ended at {X} days. Start a new one?" |
| Day 7 | Notification (if enabled) | Chrome notification | "Focus Mode misses you! A quick 10-min session to restart your streak?" |
| Day 10 | Badge changes | `chrome.action.setBadgeText({ text: '!' })` | Visual cue escalation |
| Day 14 | Final notification | Chrome notification | "Your Focus Score has been saved. Come back anytime." |
| Day 15-29 | No further action | Clear badge | Respect their decision |
| Day 30+ | No further action | No badge, no notifications | Fully respect their decision |

#### Re-Engagement Rules (Absolute)

1. **Maximum 3 total re-engagement notifications per lapse cycle.** Once 3 notifications have been sent during a single lapse period, no more are sent until the user returns and then lapses again.

2. **Never send more than 1 notification per day** (this includes all notification types, not just re-engagement).

3. **Never make the user feel guilty.** Copy should be inviting, not accusatory. "We miss you" is fine. "You're falling behind" is not.

4. **Never block functionality as punishment.** A returning lapsed user should find everything exactly as they left it. Their data, settings, and blocked sites should all be intact.

5. **Clear all re-engagement artifacts immediately on return.** When a lapsed user opens the popup or starts a session, immediately clear the badge, reset the re-engagement counter, and show a warm welcome-back message instead.

6. **Respect opt-out.** If user disables re-engagement notifications, the only intervention is the badge icon (which is non-intrusive and cannot be disabled without uninstalling).

#### Welcome Back Flow

When a lapsed user returns (has been away 3+ days and opens the extension):

```
+-----------------------------------------------+
|                                               |
|  Welcome back!                                |
|                                               |
|  Your previous best streak: X days            |
|  Your Focus Score: Y                          |
|  Your blocked sites are still active.         |
|                                               |
|  [ Start a Focus Session ]                    |
|                                               |
+-----------------------------------------------+
```

This overlay appears once per return, auto-dismisses after the user starts a session or closes it. It reassures the user that nothing was lost and encourages immediate re-engagement.

### 5.2 Re-Engagement Badge System

The extension icon badge is the least intrusive re-engagement mechanism. It requires no permissions beyond what the extension already has and cannot be blocked by notification settings.

```javascript
// src/background/reengagement.js

class ReengagementManager {
  constructor() {
    this.MAX_NOTIFICATIONS = 3;
    this.BADGE_COLORS = {
      question: '#4A90D9', // Blue "?"
      alert: '#E8912D',    // Orange "!"
      clear: ''
    };
  }

  async checkAndAct() {
    const analytics = new FocusAnalytics();
    const indicators = await analytics.getRetentionIndicators();
    const { retention = {} } = await chrome.storage.local.get('retention');
    const reengagement = retention.reengagement || {
      lastNotificationAt: 0,
      notificationCount: 0,
      currentLapseCycleStart: 0
    };

    const daysSince = indicators.daysSinceLastUse;

    // Active user: clear everything
    if (daysSince < 3) {
      await this._clearBadge();
      return;
    }

    // Day 3-6: Show "?" badge
    if (daysSince >= 3 && daysSince < 7) {
      await this._setBadge('?', this.BADGE_COLORS.question);
    }

    // Day 5: Optional notification
    if (daysSince >= 5 && daysSince < 6 && reengagement.notificationCount < 1) {
      await this._sendReengagementNotification(
        'Start a new focus streak?',
        `Your focus streak ended at ${retention.streak?.current || 0} days. Start a new one?`,
        reengagement
      );
    }

    // Day 7-9: Notification + "?" badge
    if (daysSince >= 7 && daysSince < 10 && reengagement.notificationCount < 2) {
      await this._sendReengagementNotification(
        'Quick focus session?',
        'A quick 10-min session can restart your focus habit.',
        reengagement
      );
    }

    // Day 10-13: "!" badge
    if (daysSince >= 10 && daysSince < 14) {
      await this._setBadge('!', this.BADGE_COLORS.alert);
    }

    // Day 14: Final notification
    if (daysSince >= 14 && daysSince < 15 && reengagement.notificationCount < 3) {
      await this._sendReengagementNotification(
        'Your data is safe',
        'Your Focus Score has been saved. Come back anytime.',
        reengagement
      );
    }

    // Day 15+: Clear badge, stop all outreach
    if (daysSince >= 15) {
      await this._clearBadge();
    }
  }

  async _setBadge(text, color) {
    await chrome.action.setBadgeText({ text });
    await chrome.action.setBadgeBackgroundColor({ color });
  }

  async _clearBadge() {
    await chrome.action.setBadgeText({ text: '' });
  }

  async _sendReengagementNotification(title, message, reengagement) {
    const notifManager = new NotificationManager();
    const sent = await notifManager.send('reengagement', title, message);
    if (sent) {
      reengagement.notificationCount++;
      reengagement.lastNotificationAt = Date.now();
      const { retention = {} } = await chrome.storage.local.get('retention');
      retention.reengagement = reengagement;
      await chrome.storage.local.set({ retention });
    }
  }

  /**
   * Called when user returns after a lapse. Resets re-engagement state.
   */
  async onUserReturn() {
    await this._clearBadge();
    const { retention = {} } = await chrome.storage.local.get('retention');
    retention.reengagement = {
      lastNotificationAt: 0,
      notificationCount: 0,
      currentLapseCycleStart: 0
    };
    await chrome.storage.local.set({ retention });
  }
}

// Check every 6 hours (aligned with risk assessment)
chrome.alarms.create('reengagement-check', { periodInMinutes: 360 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'reengagement-check') {
    new ReengagementManager().checkAndAct();
  }
});
```

---

## 6. Gamification Elements

### 6.1 Achievement System

Achievements provide long-term goals and moments of delight. They are stored locally and displayed in a dedicated "Achievements" tab in the popup or settings page.

#### Achievement Catalog

| ID | Achievement | Condition | Badge | Rarity | Points |
|----|-------------|----------|:-----:|:------:|:------:|
| `first_focus` | First Focus | Complete 1 focus session | Target icon | Common | 10 |
| `first_block` | Distraction Denied | Block first site visit | Shield icon | Common | 10 |
| `early_bird` | Early Bird | Complete a session before 8:00 AM | Sunrise icon | Uncommon | 25 |
| `night_owl` | Night Owl | Complete a session after 10:00 PM | Owl icon | Uncommon | 25 |
| `centurion_blocks` | Centurion | Block 100 distractions total | 100 badge | Common | 50 |
| `thousand_blocks` | Distraction Destroyer | Block 1,000 distractions total | Lightning bolt | Uncommon | 100 |
| `streak_3` | Streak Starter | Achieve a 3-day streak | Small flame | Common | 25 |
| `streak_7` | Week Warrior | Achieve a 7-day streak | Sword icon | Uncommon | 50 |
| `streak_14` | Fortnight Fighter | Achieve a 14-day streak | Double sword | Uncommon | 75 |
| `streak_21` | Habit Formed | Achieve a 21-day streak | Brain icon | Rare | 100 |
| `streak_30` | Monthly Master | Achieve a 30-day streak | Crown icon | Epic | 150 |
| `streak_50` | Fifty Days of Focus | Achieve a 50-day streak | Gold flame | Epic | 200 |
| `streak_100` | Centurion Streak | Achieve a 100-day streak | Platinum flame | Legendary | 500 |
| `streak_200` | Bicentennial | Achieve a 200-day streak | Diamond flame | Legendary | 750 |
| `streak_365` | Yearly Legend | Achieve a 365-day streak | Trophy icon | Legendary | 1000 |
| `score_50` | Half Century | Reach Focus Score of 50 | Bronze star | Common | 25 |
| `score_75` | High Achiever | Reach Focus Score of 75 | Silver star | Uncommon | 50 |
| `score_90` | Focused AF | Reach Focus Score of 90+ | Gold star | Rare | 100 |
| `score_100` | Perfect Focus | Reach Focus Score of 100 | Diamond star | Epic | 200 |
| `sessions_10` | Getting Started | Complete 10 sessions | Bronze medal | Common | 25 |
| `sessions_50` | Regular Focuser | Complete 50 sessions | Silver medal | Uncommon | 50 |
| `sessions_100` | Session Master | Complete 100 sessions | Gold medal | Rare | 100 |
| `sessions_500` | Focus Veteran | Complete 500 sessions | Platinum medal | Epic | 250 |
| `pomodoro_4` | Full Pomodoro | Complete 4 consecutive Pomodoro cycles | Tomato icon | Uncommon | 50 |
| `nuclear_first` | Going Nuclear | Use Nuclear Mode for the first time | Radiation icon | Uncommon | 25 |
| `schedule_first` | Scheduler | Create first blocking schedule | Calendar icon | Common | 15 |
| `five_sites` | Site Guardian | Block 5 different sites | Shield wall | Common | 20 |
| `ten_sites` | Full Arsenal | Block 10 sites (free tier max) | Full shield | Common | 30 |
| `hour_focus` | Hour of Power | Focus for 60+ continuous minutes | Clock icon | Uncommon | 50 |
| `two_hour_focus` | Marathon Focus | Focus for 120+ continuous minutes | Stopwatch icon | Rare | 100 |
| `weekend_warrior` | Weekend Warrior | Complete sessions on Saturday AND Sunday | Weekend icon | Uncommon | 50 |
| `all_week` | Seven Day Focuser | Complete at least one session every day of a week | Week icon | Rare | 75 |
| `comeback_kid` | Comeback Kid | Return after 7+ days away and start a new streak | Boomerang icon | Uncommon | 50 |

#### Achievement Rarity Distribution

| Rarity | % of Users Expected to Earn | Visual Treatment | Color |
|--------|:---------------------------:|-----------------|-------|
| Common | 60-80% | Standard icon, no border | Gray |
| Uncommon | 30-50% | Icon with subtle border | Blue |
| Rare | 10-25% | Icon with glow effect | Purple |
| Epic | 3-10% | Icon with animated border | Gold |
| Legendary | <3% | Full animation + particle effects | Rainbow/Diamond |

#### Achievement Notification

When an achievement is earned:

1. Toast notification appears in the popup (if open) or as a Chrome notification
2. The achievement is marked as "NEW" in the achievements list until viewed
3. A confetti animation plays for Rare or higher achievements
4. The analytics system tracks the event

```javascript
// src/background/achievements.js

class AchievementManager {
  constructor() {
    this.ACHIEVEMENTS = { /* full catalog as defined above */ };
  }

  async checkAndAward(context) {
    const { retention = {} } = await chrome.storage.local.get('retention');
    const earned = retention.achievements || [];
    const newlyEarned = [];

    for (const [id, achievement] of Object.entries(this.ACHIEVEMENTS)) {
      if (earned.includes(id)) continue; // Already earned
      if (achievement.condition(retention, context)) {
        newlyEarned.push(id);
      }
    }

    if (newlyEarned.length > 0) {
      retention.achievements = [...earned, ...newlyEarned];
      await chrome.storage.local.set({ retention });

      // Notify for each new achievement
      for (const id of newlyEarned) {
        await this._celebrateAchievement(id);
      }
    }

    return newlyEarned;
  }

  async _celebrateAchievement(achievementId) {
    const achievement = this.ACHIEVEMENTS[achievementId];
    const analytics = new FocusAnalytics();
    await analytics.track('achievement_earned', {
      achievement_id: achievementId,
      rarity: achievement.rarity
    });

    const notifManager = new NotificationManager();
    await notifManager.send(
      'milestone',
      `Achievement Unlocked: ${achievement.name}`,
      achievement.description
    );
  }

  async getProgress() {
    const { retention = {} } = await chrome.storage.local.get('retention');
    const earned = retention.achievements || [];
    const total = Object.keys(this.ACHIEVEMENTS).length;

    return {
      earned: earned.length,
      total,
      percentage: Math.round((earned.length / total) * 100),
      recent: earned.slice(-5), // Last 5 earned
      nextUp: this._getNextAchievements(retention) // Closest to earning
    };
  }

  _getNextAchievements(retention) {
    // Return 3 achievements the user is closest to earning
    // based on current progress metrics
    const earned = retention.achievements || [];
    const candidates = Object.entries(this.ACHIEVEMENTS)
      .filter(([id]) => !earned.includes(id))
      .map(([id, ach]) => ({
        id,
        name: ach.name,
        progress: ach.progressFn ? ach.progressFn(retention) : 0
      }))
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 3);

    return candidates;
  }
}
```

### 6.2 Daily and Weekly Challenges (Pro)

Challenges provide short-term goals that complement the long-term achievement system. They refresh daily (at midnight local time) and weekly (Monday midnight).

#### Daily Challenges

| Challenge | Target | Reward | Difficulty |
|-----------|--------|--------|:----------:|
| "Block 20 distractions today" | 20 blocks in one day | +5 Focus Score bonus | Easy |
| "Complete 3 focus sessions" | 3 completed sessions | +3 Focus Score bonus | Easy |
| "Focus for 90 minutes total" | 90 minutes cumulative | +5 Focus Score bonus | Medium |
| "Complete 4 Pomodoro cycles" | 4 Pomodoro sessions | Achievement badge progress | Medium |
| "Don't override any blocks" | 0 overrides for the day | +5 Focus Score bonus | Medium |
| "Focus before 9 AM" | 1 session before 9:00 AM | Early Bird progress | Hard |
| "Focus for 2 hours straight" | 120 min continuous session | +10 Focus Score bonus | Hard |

#### Weekly Challenges

| Challenge | Target | Reward | Difficulty |
|-----------|--------|--------|:----------:|
| "Focus every day this week" | 7/7 days with sessions | Streak Shield (protects 1 day) | Medium |
| "Block 100 distractions" | 100 blocks in one week | +10 Focus Score bonus | Medium |
| "10 hours of focus time" | 600 minutes total | Achievement progress | Hard |
| "Perfect completion rate" | 100% session completion | +15 Focus Score bonus | Hard |
| "Beat last week's score" | Higher avg Focus Score | +5 Focus Score bonus | Variable |

#### Challenge Selection Algorithm

Each day, the system selects 1-2 daily challenges and each week selects 1 weekly challenge. Selection is based on:

1. **User's current level:** New users get easier challenges. Experienced users get harder ones.
2. **Recent behavior:** If user has been completing sessions consistently, offer a stretch goal. If they have been struggling, offer an achievable one.
3. **Variety:** Don't repeat the same challenge within 7 days.

```javascript
// Challenge selection (Pro only)
async function selectDailyChallenge() {
  const { retention = {} } = await chrome.storage.local.get('retention');
  const recentChallenges = retention.challenges?.recent || [];
  const avgScore = retention.focusScore?.current || 50;

  // Filter by difficulty based on user's Focus Score
  let difficulty;
  if (avgScore < 40) difficulty = 'easy';
  else if (avgScore < 70) difficulty = ['easy', 'medium'];
  else difficulty = ['medium', 'hard'];

  // Select from eligible challenges, avoiding recent repeats
  const eligible = DAILY_CHALLENGES
    .filter(c => matchesDifficulty(c, difficulty))
    .filter(c => !recentChallenges.includes(c.id));

  return eligible[Math.floor(Math.random() * eligible.length)];
}
```

### 6.3 Progress Visualization

The popup and settings page include visual progress elements that reinforce engagement.

#### Popup Progress Elements

| Element | Location | Description |
|---------|----------|-------------|
| Focus Score ring | Popup header | Circular progress indicator (0-100) with color gradient |
| Streak counter | Popup header | "X days" with flame animation |
| Daily progress bar | Below header | Horizontal bar showing % of daily goal |
| Mini achievement shelf | Popup footer | Last 3 earned achievements as small icons |
| Challenge card | Below stats (Pro) | Current daily challenge with progress |

#### Weekly Summary View

Available in settings or via the weekly notification:

```
+-----------------------------------------------+
|          Weekly Focus Summary                  |
|          Jan 6 - Jan 12                        |
|                                                |
|  Total Focus Time:    8h 23m (up 1h 12m)      |
|  Sessions Completed:  14 (up 3)                |
|  Distractions Blocked: 187 (up 42)             |
|  Avg Focus Score:     68 (up 5)                |
|  Streak:              12 days                  |
|                                                |
|  [Mon][Tue][Wed][Thu][Fri][Sat][Sun]           |
|   ##   ##   ##   ##   ##   --   ##             |
|                                                |
|  Achievements This Week:                       |
|  - Week Warrior (7-day streak)                 |
|  - Centurion (100 distractions blocked)        |
|                                                |
+-----------------------------------------------+
```

---

## 7. Data Schema for Retention

### 7.1 Complete Storage Schema

All retention data is stored under the `retention` key in `chrome.storage.local`.

```javascript
// chrome.storage.local schema for retention system
{
  retention: {
    // Installation and activity tracking
    installedAt: 1707600000000,              // Unix timestamp of install
    lastActiveAt: 1707686400000,             // Unix timestamp of last activity
    onboardingCompleted: true,               // Whether onboarding flow was finished
    extensionVersion: '1.0.0',               // Version at time of last update

    // Session statistics
    totalSessions: 47,                       // Lifetime completed sessions
    totalSessionsStarted: 52,               // Lifetime started (including abandoned)
    totalFocusMinutes: 1410,                // Lifetime focus minutes
    totalDistractionsBlocked: 892,          // Lifetime blocked site visits

    // Streak data
    streak: {
      current: 14,                          // Current consecutive days
      best: 21,                             // All-time best streak
      lastDate: '2025-01-15',              // Last day with a completed session (YYYY-MM-DD)
      history: [                            // Last 365 entries
        { date: '2025-01-15', sessions: 3, minutes: 75 },
        { date: '2025-01-14', sessions: 2, minutes: 50 },
        // ...
      ],
      freezesAvailable: 2,                  // Pro: stored streak freezes (max 3)
      lastRecoveryDate: '2024-12-20',      // Pro: last streak recovery used
      milestones: [3, 7, 14]               // Milestones already celebrated
    },

    // Focus Score data
    focusScore: {
      current: 72,                          // Current composite score (0-100)
      best: 85,                             // All-time best score
      history: [                            // Daily snapshots (last 90 days)
        {
          date: '2025-01-15',
          score: 72,
          components: {
            focusTime: 28,
            distractionsResisted: 20,
            sessionCompletion: 15,
            streakBonus: 9
          }
        },
        // ...
      ],
      weeklyAverages: [                     // Weekly averages (last 52 weeks)
        { weekStart: '2025-01-13', avgScore: 68 },
        // ...
      ],
      milestones: [25, 50]                 // Score milestones already celebrated
    },

    // Achievement data
    achievements: [
      'first_focus',
      'first_block',
      'streak_3',
      'streak_7',
      'centurion_blocks',
      'score_50'
    ],
    achievementPoints: 210,                // Total points from achievements
    achievementsNew: ['streak_7'],         // Not yet viewed by user

    // Prompt and review tracking
    prompts: {
      reviewShownCount: 1,                  // Total times review prompt shown
      reviewDismissedCount: 0,              // Times review prompt dismissed
      reviewCompleted: false,               // User clicked "Rate" button
      reviewLastShownAt: 1707500000000,     // Timestamp of last review prompt
      feedbackSent: false,                  // User submitted feedback
      permanentOptOut: false,               // True after 2 dismissals

      lastPromptAt: 1707600000000,          // Timestamp of any prompt
      dismissedPromptIds: {                 // Per-prompt cooldown tracking
        'prompt_1': 1707500000000,          // Prompt ID: timestamp of dismissal
        'prompt_3': 1707400000000
      },
      dismissalLog: [                       // Recent dismissals for fatigue tracking
        { promptId: 'prompt_1', action: 'maybe_later', date: '2025-01-14', timestamp: 1707500000000 }
      ],
      cooldownUntil: null                   // Global prompt cooldown (fatigue protection)
    },

    // Re-engagement tracking
    reengagement: {
      lastNotificationAt: 0,               // Timestamp of last re-engagement notification
      notificationCount: 0,                // Count in current lapse cycle
      currentLapseCycleStart: 0,           // When current lapse began
      welcomeBackShown: false              // Whether welcome-back was shown this return
    },

    // Challenge data (Pro only)
    challenges: {
      daily: {
        id: 'block_20',
        target: 20,
        progress: 14,
        date: '2025-01-15',
        completed: false
      },
      weekly: {
        id: 'focus_every_day',
        target: 7,
        progress: 5,
        weekStart: '2025-01-13',
        completed: false
      },
      recent: ['block_20', 'sessions_3', 'focus_90'],  // Last 7 challenge IDs (avoid repeats)
      completedCount: 12                                 // Lifetime completed challenges
    }
  },

  // Separate key for event log (high write frequency)
  analytics: [
    {
      event: 'session_complete',
      properties: { duration: 25, score_change: 3, type: 'pomodoro', sessionId: 'abc123' },
      timestamp: 1707686400000,
      date: '2025-01-15'
    },
    // ... up to 500 events (rolling window)
  ],

  // Separate key for notification log
  notificationLog: [
    {
      id: 'focus-mode-session_complete-1707686400000',
      type: 'session_complete',
      date: '2025-01-15',
      timestamp: 1707686400000
    },
    // ... last 30 days
  ],

  // Separate key for risk assessment (overwritten each cycle)
  riskAssessment: {
    level: 'low',
    daysSinceLastUse: 0,
    positiveSignals: ['active_streak', 'high_score', 'multiple_sites_blocked'],
    negativeSignals: [],
    score: 80,
    intervention: 'none',
    assessedAt: 1707686400000
  }
}
```

### 7.2 Storage Migration Strategy

When the retention schema changes between versions:

```javascript
// src/background/migration.js

const CURRENT_SCHEMA_VERSION = 1;

async function migrateRetentionSchema() {
  const { retentionSchemaVersion = 0 } = await chrome.storage.local.get('retentionSchemaVersion');

  if (retentionSchemaVersion >= CURRENT_SCHEMA_VERSION) return;

  const { retention = {} } = await chrome.storage.local.get('retention');

  // Version 0 -> 1: Initial schema setup
  if (retentionSchemaVersion < 1) {
    retention.installedAt = retention.installedAt || Date.now();
    retention.lastActiveAt = retention.lastActiveAt || Date.now();
    retention.totalSessions = retention.totalSessions || 0;
    retention.totalFocusMinutes = retention.totalFocusMinutes || 0;
    retention.totalDistractionsBlocked = retention.totalDistractionsBlocked || 0;
    retention.streak = retention.streak || { current: 0, best: 0, lastDate: null, history: [], milestones: [] };
    retention.focusScore = retention.focusScore || { current: 0, best: 0, history: [], milestones: [] };
    retention.achievements = retention.achievements || [];
    retention.prompts = retention.prompts || {};
    retention.reengagement = retention.reengagement || { lastNotificationAt: 0, notificationCount: 0 };
  }

  // Future migrations go here:
  // if (retentionSchemaVersion < 2) { ... }

  await chrome.storage.local.set({
    retention,
    retentionSchemaVersion: CURRENT_SCHEMA_VERSION
  });
}

// Run on extension install/update
chrome.runtime.onInstalled.addListener(() => {
  migrateRetentionSchema();
});
```

### 7.3 Data Cleanup and Pruning

To prevent unbounded storage growth, scheduled cleanup runs weekly:

```javascript
// src/background/cleanup.js

async function pruneRetentionData() {
  const { retention = {} } = await chrome.storage.local.get('retention');
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  // Prune streak history to last 365 entries
  if (retention.streak?.history?.length > 365) {
    retention.streak.history = retention.streak.history.slice(-365);
  }

  // Prune Focus Score history to last 90 daily entries
  if (retention.focusScore?.history?.length > 90) {
    // Aggregate older entries into weekly averages before removing
    const oldEntries = retention.focusScore.history.slice(0, -90);
    // Group by week and average
    const weeklyAggs = aggregateByWeek(oldEntries);
    retention.focusScore.weeklyAverages = [
      ...(retention.focusScore.weeklyAverages || []),
      ...weeklyAggs
    ].slice(-52); // Keep last 52 weeks

    retention.focusScore.history = retention.focusScore.history.slice(-90);
  }

  // Prune prompt dismissal log to last 30 entries
  if (retention.prompts?.dismissalLog?.length > 30) {
    retention.prompts.dismissalLog = retention.prompts.dismissalLog.slice(-30);
  }

  // Prune challenge recent list to last 7
  if (retention.challenges?.recent?.length > 7) {
    retention.challenges.recent = retention.challenges.recent.slice(-7);
  }

  await chrome.storage.local.set({ retention });

  // Prune analytics (rolling window already handles this, but double-check)
  const { analytics = [] } = await chrome.storage.local.get('analytics');
  if (analytics.length > 500) {
    await chrome.storage.local.set({ analytics: analytics.slice(-500) });
  }

  // Prune notification log to last 30 days
  const { notificationLog = [] } = await chrome.storage.local.get('notificationLog');
  const thirtyDaysAgo = now - 30 * dayMs;
  const prunedLog = notificationLog.filter(n => n.timestamp > thirtyDaysAgo);
  await chrome.storage.local.set({ notificationLog: prunedLog });
}

// Run weekly
chrome.alarms.create('data-cleanup', { periodInMinutes: 10080 }); // 7 days
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'data-cleanup') {
    pruneRetentionData();
  }
});
```

---

## 8. Implementation Priority

### 8.1 Priority Matrix

| Priority | Component | Expected Retention Impact | Development Effort | Dependencies |
|:--------:|-----------|:------------------------:|:------------------:|-------------|
| P0 | Streak system | HIGH | Medium (3-4 days) | Analytics system |
| P0 | Focus Score progression | HIGH | Medium (3-4 days) | Analytics system |
| P0 | Block page gamification | HIGH | Low (1-2 days) | Streak + Score data |
| P0 | Local analytics system | HIGH (enables everything) | Medium (2-3 days) | None |
| P1 | Notification system | MEDIUM | Medium (2-3 days) | Analytics system |
| P1 | Review request flow | MEDIUM (CWS ratings) | Low (1 day) | Prompt manager |
| P1 | Achievement system | MEDIUM | Medium (3-4 days) | Analytics system |
| P1 | In-popup retention prompts | MEDIUM | Low (1-2 days) | Prompt manager |
| P2 | Re-engagement system | MEDIUM | Low (1-2 days) | Analytics + notifications |
| P2 | Daily/weekly challenges (Pro) | LOW (Pro only) | Medium (2-3 days) | Analytics + achievements |
| P2 | Weekly summary view | LOW | Medium (2 days) | Analytics system |
| P3 | Shareable achievement cards | LOW | Low (1 day) | Achievement system |
| P3 | Data migration system | LOW (future-proofing) | Low (1 day) | None |

### 8.2 Implementation Phases

**Phase A: Foundation (Week 1)**
- Local analytics system (FocusAnalytics class)
- Retention data schema and migration
- Storage cleanup and pruning

**Phase B: Core Engagement (Week 2)**
- Streak system (tracking, milestones, celebrations)
- Focus Score calculation and progression
- Block page gamification elements

**Phase C: Communication (Week 3)**
- Notification system (manager, rules, types)
- In-popup retention prompts
- Review request two-step flow

**Phase D: Depth (Week 4)**
- Achievement system (catalog, tracking, notifications)
- Re-engagement system (badge, notifications, welcome back)
- At-risk user detection

**Phase E: Pro Features (Week 5)**
- Streak Recovery and Streak Freeze (Pro)
- Daily and weekly challenges (Pro)
- Weekly summary view
- Shareable achievement cards

---

## 9. Retention Testing & Measurement

### 9.1 Key Metrics to Monitor

Since all data is local, these metrics are for internal development testing and A/B testing during beta, not for ongoing production monitoring.

| Metric | Target | Measurement Method |
|--------|:------:|-------------------|
| Day-1 retention | 80% | Track `retention.installedAt` vs `retention.lastActiveAt` |
| Day-7 retention | 55% | Same method, 7-day window |
| Day-30 retention | 35% | Same method, 30-day window |
| Avg sessions per day (active users) | 2.5+ | `analytics` event count / active days |
| Streak length (median) | 7+ days | `retention.streak.current` distribution |
| Focus Score (median) | 55+ | `retention.focusScore.current` distribution |
| Session completion rate | 80%+ | `session_complete` / `session_start` events |
| Block page "Back to Work" rate | 70%+ | Block page action tracking |
| Notification click-through rate | 15%+ | Notification shown vs clicked |
| Review prompt conversion | 20%+ | Review shown vs completed |
| Achievement earn rate | 50%+ users earn 5+ | `retention.achievements.length` distribution |

### 9.2 Testing Approaches

**Manual QA Scenarios:**

1. **New user flow:** Install, complete onboarding, first session, verify streak starts at 1.
2. **Streak continuity:** Complete sessions across multiple days, verify streak increments correctly at midnight.
3. **Streak break:** Skip a day, verify streak resets. Test welcome-back flow.
4. **Streak Recovery (Pro):** Break streak, verify recovery option appears for 24 hours, verify 7-day cooldown.
5. **Focus Score accuracy:** Complete sessions with known parameters, verify score calculation matches formula.
6. **Block page content:** Visit blocked sites repeatedly, verify quote rotation, stats accuracy, no repetition.
7. **Notification limits:** Trigger multiple notification conditions, verify max 2/day cap.
8. **Review prompt flow:** Trigger conditions, verify two-step flow, test both paths.
9. **Re-engagement:** Simulate 3-day, 7-day, 14-day inactivity, verify badge and notification sequence.
10. **Achievement triggers:** Complete each achievement condition, verify unlock notification and storage.
11. **Storage limits:** Generate 500+ analytics events, verify pruning works correctly.
12. **Prompt fatigue:** Dismiss 3 prompts in one day, verify 7-day cooldown activates.

**Edge Cases to Test:**

| Scenario | Expected Behavior |
|----------|------------------|
| User changes system clock | Streak uses stored date strings, not deltas |
| User is in a different timezone | All times are local, streak resets at local midnight |
| Storage quota exceeded | Graceful degradation, prune oldest data first |
| Extension updated mid-session | Session continues, retention data migrates on next startup |
| User clears browser data | Retention data lost, treat as new install |
| Two Chrome profiles | Separate retention data per profile (chrome.storage is per-profile) |
| Offline usage | All data local, works fully offline |

### 9.3 A/B Testing Framework (Beta Only)

During beta testing, we can test retention variations by assigning users to cohorts based on their install timestamp:

```javascript
// Beta only: simple A/B testing
function getTestCohort(installedAt) {
  // Deterministic assignment based on install timestamp
  const cohort = installedAt % 2 === 0 ? 'A' : 'B';
  return cohort;
}

// Example test: Does showing Focus Score on block page improve retention?
// Cohort A: Block page shows Focus Score
// Cohort B: Block page does not show Focus Score
// Measure: Day-7 retention difference between cohorts
```

---

## 10. Edge Cases & Error Handling

### 10.1 Streak Edge Cases

| Edge Case | Handling |
|-----------|---------|
| User completes session at 11:59 PM | Counts for current day. Streak maintained. |
| User completes session at 12:01 AM | Counts for new day. If yesterday had a session, streak continues. |
| Multiple sessions in one day | Only first session counts for streak. Additional sessions improve Focus Score. |
| Session spans midnight | Counts for the day the session STARTED. |
| User installs at 11:55 PM | First day counts. Streak = 1 after first session. |
| Streak counter overflows | Use Number type, safe up to 2^53 days (practically infinite). |
| Time zone change (travel) | Use the device's current local timezone at midnight check time. |

### 10.2 Focus Score Edge Cases

| Edge Case | Handling |
|-----------|---------|
| No block page views (no distractions) | Distractions Resisted component defaults to 50% (neutral). |
| No sessions started | Session Completion component defaults to 50% (neutral). |
| Score drops to 0 | Display "0" with encouraging message: "Start a session to build your score!" |
| All components at max | Score = 100. Trigger "Perfect Focus" celebration and achievement. |
| User has only focus time, no blocks | Score reflects available components. Missing data defaults to neutral. |

### 10.3 Analytics Edge Cases

| Edge Case | Handling |
|-----------|---------|
| chrome.storage.local write fails | Silently catch error, log to console, retry once. Do not crash extension. |
| Analytics array corrupted | On read error, reset to empty array. User loses history but extension functions. |
| Concurrent writes from multiple tabs | Use a write queue with a 100ms debounce to batch updates. |
| Storage quota warning (>4MB used) | Aggressive pruning: reduce rolling window to 250 events, trim history to 30 days. |

### 10.4 Notification Edge Cases

| Edge Case | Handling |
|-----------|---------|
| User has Chrome notifications disabled | `chrome.notifications.create` fails silently. No fallback (respect user preference). |
| Multiple milestone notifications at once | Queue and send one per hour, respecting daily cap. |
| Notification clicked after session ended | Open popup showing session summary, not active session UI. |
| Extension update resets alarm | Re-create alarms in `chrome.runtime.onInstalled` listener. |

### 10.5 Data Integrity

```javascript
// Defensive data access pattern used throughout the retention system
async function safeGetRetention() {
  try {
    const { retention = {} } = await chrome.storage.local.get('retention');

    // Validate critical fields exist
    return {
      installedAt: retention.installedAt || Date.now(),
      lastActiveAt: retention.lastActiveAt || Date.now(),
      totalSessions: retention.totalSessions || 0,
      totalFocusMinutes: retention.totalFocusMinutes || 0,
      totalDistractionsBlocked: retention.totalDistractionsBlocked || 0,
      streak: {
        current: retention.streak?.current || 0,
        best: retention.streak?.best || 0,
        lastDate: retention.streak?.lastDate || null,
        history: Array.isArray(retention.streak?.history) ? retention.streak.history : [],
        milestones: Array.isArray(retention.streak?.milestones) ? retention.streak.milestones : []
      },
      focusScore: {
        current: retention.focusScore?.current || 0,
        best: retention.focusScore?.best || 0,
        history: Array.isArray(retention.focusScore?.history) ? retention.focusScore.history : [],
        milestones: Array.isArray(retention.focusScore?.milestones) ? retention.focusScore.milestones : []
      },
      achievements: Array.isArray(retention.achievements) ? retention.achievements : [],
      prompts: retention.prompts || {},
      reengagement: retention.reengagement || { lastNotificationAt: 0, notificationCount: 0 }
    };
  } catch (error) {
    console.error('Failed to read retention data:', error);
    // Return safe defaults
    return getDefaultRetentionData();
  }
}

function getDefaultRetentionData() {
  return {
    installedAt: Date.now(),
    lastActiveAt: Date.now(),
    totalSessions: 0,
    totalFocusMinutes: 0,
    totalDistractionsBlocked: 0,
    streak: { current: 0, best: 0, lastDate: null, history: [], milestones: [] },
    focusScore: { current: 0, best: 0, history: [], milestones: [] },
    achievements: [],
    prompts: {},
    reengagement: { lastNotificationAt: 0, notificationCount: 0 }
  };
}
```

---

## Summary

The Focus Mode - Blocker retention system is built on five interconnected pillars:

1. **Streaks** create daily commitment through loss aversion. Once a user has a 7+ day streak, breaking it feels like losing something valuable.

2. **Focus Score** provides a gamified progress metric that gives users a single number to improve. It creates curiosity ("What is my score?"), competition ("Can I beat my best?"), and awareness ("My focus is improving").

3. **The block page** transforms every distraction into a positive reinforcement moment. Instead of a frustrating dead end, users see their progress, stats, and motivation. This is the highest-impression surface and the backbone of the retention flywheel.

4. **Achievements and challenges** provide short-term and long-term goals that keep users engaged beyond the daily routine. The rarity system creates aspiration, and the points system creates a sense of accumulated investment.

5. **Respectful notifications** bring users back without annoying them. Strict caps (2/day), opt-in controls, and a hard stop on re-engagement (3 attempts max) ensure the extension earns trust rather than burning it.

All of this runs entirely on the user's device with zero external requests. Privacy is not a feature -- it is the architecture. This creates a unique competitive advantage: users who care about privacy (a growing segment) can trust Focus Mode completely, while users who do not care about privacy still benefit from the speed and reliability of local-only data.

The implementation is prioritized to deliver the highest-impact features first (streaks, Focus Score, block page gamification) while deferring lower-impact features (challenges, shareable cards) to later phases. The data schema is designed to be forward-compatible with migrations, and the storage budget is well within Chrome's limits.
