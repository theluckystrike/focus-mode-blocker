# CHURN DETECTION & ENGAGEMENT SCORING: Focus Mode - Blocker
## Agent 1 — Churn Signal Detection, At-Risk Scoring, Health Score System & Power User Identification

> **Date:** February 11, 2026 | **Parent Phase:** 17 — Churn Prevention & Reactivation
> **Sections Covered:** 1 (Churn Signal Detection) & 5 (Engagement Scoring)

---

## Table of Contents

1. [Churn Signal Detection](#1-churn-signal-detection)
   - [1.1 Focus-Specific Churn Signals](#11-focus-specific-churn-signals)
   - [1.2 FocusChurnDetector Class](#12-focuschurndetector-class)
   - [1.3 Usage Tracking Integration](#13-usage-tracking-integration)
   - [1.4 FocusRiskScoringModel](#14-focusriskscoringmodel)
   - [1.5 Risk Tier Definitions & Actions](#15-risk-tier-definitions--actions)
2. [Engagement Scoring](#2-engagement-scoring)
   - [2.1 FocusHealthScoreCalculator](#21-focushealthscorecalculator)
   - [2.2 FocusPowerUserIdentifier](#22-focuspoweruseridentifier)
   - [2.3 Engagement Dashboard Data](#23-engagement-dashboard-data)
3. [Storage Schema](#3-storage-schema)
4. [Service Worker Integration](#4-service-worker-integration)
5. [Implementation Priority](#5-implementation-priority)

---

## 1. Churn Signal Detection

### 1.1 Focus-Specific Churn Signals

Focus Mode - Blocker's churn signals differ significantly from generic SaaS churn indicators. As a productivity/blocking extension, user engagement revolves around focus sessions, blocking behavior, and gamification metrics. The following signals are specific to Focus Mode - Blocker's usage patterns:

| Signal | Description | Threshold | Severity |
|--------|-------------|-----------|----------|
| Session inactivity | Days since last completed focus session | 7 days | Medium → Critical |
| Session frequency decline | Week-over-week decline in focus sessions | >50% decline | Medium → High |
| Pomodoro abandonment | Started but not completed Pomodoro cycles | >60% abandonment rate | High |
| Focus Score decline | Focus Score dropping over 2+ consecutive weeks | >15 points drop | Medium |
| Streak break without restart | Lost a streak of 7+ days and didn't start a new one within 3 days | 3 days post-break | High |
| Nuclear Mode disuse | Previously regular Nuclear Mode user stops using it | 14 days unused | Medium |
| Block page bypasses increasing | User attempting to bypass block page more frequently | >5 attempts/week | High |
| Blocklist shrinking | User removing sites from blocked list | >30% reduction | High |
| Pro features unused | Paying Pro user not using any Pro-exclusive features | 14 days | Critical |
| Popup not opened | Extension popup hasn't been opened | 7 days | Medium |
| Timer not started | User opens popup but never starts a timer | 5 consecutive opens | Medium |
| Settings reset | User resets all settings to defaults | Any occurrence | High |

### 1.2 FocusChurnDetector Class

```javascript
// churn-detector.js — Focus Mode - Blocker Churn Detection
// Runs entirely in the service worker, all data stays in chrome.storage.local

class FocusChurnDetector {
  constructor() {
    this.THRESHOLDS = {
      // Inactivity thresholds (days)
      sessionInactivityMedium: 7,
      sessionInactivityHigh: 14,
      sessionInactivityCritical: 30,

      // Usage decline (percentage)
      usageDeclineModerate: 50,
      usageDeclineSevere: 70,
      usageDeclineCritical: 90,

      // Pomodoro abandonment (percentage)
      pomodoroAbandonmentHigh: 60,

      // Focus Score decline (points over 2 weeks)
      focusScoreDeclineMedium: 10,
      focusScoreDeclineHigh: 20,

      // Streak restart window (days after break)
      streakRestartWindow: 3,

      // Feature disuse (days)
      nuclearModeDisuse: 14,
      proFeatureDisuse: 14,

      // Block page bypass attempts per week
      bypassAttemptsHigh: 5,

      // Blocklist reduction (percentage)
      blocklistReductionHigh: 30,

      // Popup inactivity (days)
      popupInactivityMedium: 7,

      // Timer-less popup opens
      timerlessOpensThreshold: 5
    };
  }

  /**
   * Run full churn analysis for the current user.
   * Called by daily alarm in service worker.
   * @returns {Object} Analysis result with risk score, signals, and recommendations
   */
  async analyzeChurnRisk() {
    const signals = [];

    // Gather all data from chrome.storage.local
    const data = await this.getChurnData();

    // 1. Check session inactivity
    const inactivitySignal = this.checkSessionInactivity(data);
    if (inactivitySignal) signals.push(inactivitySignal);

    // 2. Check session frequency decline
    const declineSignal = this.checkSessionFrequencyDecline(data);
    if (declineSignal) signals.push(declineSignal);

    // 3. Check Pomodoro abandonment rate
    const pomodoroSignal = this.checkPomodoroAbandonment(data);
    if (pomodoroSignal) signals.push(pomodoroSignal);

    // 4. Check Focus Score decline
    const scoreSignal = this.checkFocusScoreDecline(data);
    if (scoreSignal) signals.push(scoreSignal);

    // 5. Check streak break without restart
    const streakSignal = this.checkStreakBreak(data);
    if (streakSignal) signals.push(streakSignal);

    // 6. Check Nuclear Mode disuse
    const nuclearSignal = this.checkNuclearModeDisuse(data);
    if (nuclearSignal) signals.push(nuclearSignal);

    // 7. Check block page bypass attempts
    const bypassSignal = this.checkBypassAttempts(data);
    if (bypassSignal) signals.push(bypassSignal);

    // 8. Check blocklist shrinking
    const blocklistSignal = this.checkBlocklistShrinking(data);
    if (blocklistSignal) signals.push(blocklistSignal);

    // 9. Check Pro feature disuse (only for Pro users)
    if (data.isPro) {
      const proSignal = this.checkProFeatureDisuse(data);
      if (proSignal) signals.push(proSignal);
    }

    // 10. Check popup inactivity
    const popupSignal = this.checkPopupInactivity(data);
    if (popupSignal) signals.push(popupSignal);

    const riskScore = this.calculateRiskScore(signals);
    const tier = this.getRiskTier(riskScore);

    return {
      isAtRisk: signals.length > 0,
      riskScore,
      tier,
      signals,
      recommendations: this.getRecommendations(tier, signals, data),
      analyzedAt: new Date().toISOString()
    };
  }

  /**
   * Fetch all churn-relevant data from chrome.storage.local
   */
  async getChurnData() {
    const keys = [
      'focusSessionHistory',   // Array of { date, sessionsCompleted, totalMinutes, pomodoroStarted, pomodoroCompleted }
      'focusScore',            // Current Focus Score (0-100)
      'focusScoreHistory',     // Array of { date, score }
      'currentStreak',         // Number of consecutive days
      'streakHistory',         // Array of { startDate, endDate, length, broken: boolean }
      'blockedSites',          // Array of blocked site URLs
      'blocklistHistory',      // Array of { date, count } tracking blocklist size over time
      'nuclearModeHistory',    // Array of { date, used: boolean }
      'bypassAttempts',        // Array of { date, count }
      'popupOpenHistory',      // Array of { date, opened: boolean, timerStarted: boolean }
      'proFeatureUsage',       // { nuclearMode: lastUsed, advancedStats: lastUsed, customTheme: lastUsed, importExport: lastUsed }
      'subscription',          // { tier: 'free'|'pro', startDate, plan: 'monthly'|'lifetime' }
      'settingsResetHistory',  // Array of timestamps
      'featureUsageMap'        // { feature: { firstUsed, lastUsed, totalUses } }
    ];

    const result = await chrome.storage.local.get(keys);
    return {
      sessionHistory: result.focusSessionHistory || [],
      focusScore: result.focusScore || 0,
      focusScoreHistory: result.focusScoreHistory || [],
      currentStreak: result.currentStreak || 0,
      streakHistory: result.streakHistory || [],
      blockedSites: result.blockedSites || [],
      blocklistHistory: result.blocklistHistory || [],
      nuclearModeHistory: result.nuclearModeHistory || [],
      bypassAttempts: result.bypassAttempts || [],
      popupOpenHistory: result.popupOpenHistory || [],
      proFeatureUsage: result.proFeatureUsage || {},
      isPro: result.subscription?.tier === 'pro',
      subscription: result.subscription || { tier: 'free' },
      settingsResetHistory: result.settingsResetHistory || [],
      featureUsageMap: result.featureUsageMap || {}
    };
  }

  // --- Individual Signal Checks ---

  checkSessionInactivity(data) {
    if (data.sessionHistory.length === 0) {
      return {
        type: 'session_inactivity',
        severity: 'critical',
        data: { daysSinceLastSession: Infinity },
        message: 'User has never completed a focus session'
      };
    }

    const lastSession = data.sessionHistory[data.sessionHistory.length - 1];
    const daysSince = this.daysBetween(new Date(lastSession.date), new Date());

    if (daysSince >= this.THRESHOLDS.sessionInactivityCritical) {
      return { type: 'session_inactivity', severity: 'critical', data: { daysSinceLastSession: daysSince }, message: `No focus session in ${daysSince} days` };
    }
    if (daysSince >= this.THRESHOLDS.sessionInactivityHigh) {
      return { type: 'session_inactivity', severity: 'high', data: { daysSinceLastSession: daysSince }, message: `No focus session in ${daysSince} days` };
    }
    if (daysSince >= this.THRESHOLDS.sessionInactivityMedium) {
      return { type: 'session_inactivity', severity: 'medium', data: { daysSinceLastSession: daysSince }, message: `No focus session in ${daysSince} days` };
    }
    return null;
  }

  checkSessionFrequencyDecline(data) {
    if (data.sessionHistory.length < 14) return null;

    const recentWeek = data.sessionHistory.slice(-7);
    const previousWeek = data.sessionHistory.slice(-14, -7);

    const recentSessions = recentWeek.reduce((sum, d) => sum + (d.sessionsCompleted || 0), 0);
    const previousSessions = previousWeek.reduce((sum, d) => sum + (d.sessionsCompleted || 0), 0);

    if (previousSessions === 0) return null;
    const decline = Math.round(((previousSessions - recentSessions) / previousSessions) * 100);

    if (decline >= this.THRESHOLDS.usageDeclineCritical) {
      return { type: 'session_frequency_decline', severity: 'critical', data: { declinePercent: decline, recentSessions, previousSessions }, message: `Focus session frequency dropped ${decline}%` };
    }
    if (decline >= this.THRESHOLDS.usageDeclineSevere) {
      return { type: 'session_frequency_decline', severity: 'high', data: { declinePercent: decline }, message: `Focus session frequency dropped ${decline}%` };
    }
    if (decline >= this.THRESHOLDS.usageDeclineModerate) {
      return { type: 'session_frequency_decline', severity: 'medium', data: { declinePercent: decline }, message: `Focus session frequency dropped ${decline}%` };
    }
    return null;
  }

  checkPomodoroAbandonment(data) {
    const recentWeek = data.sessionHistory.slice(-7);
    const totalStarted = recentWeek.reduce((sum, d) => sum + (d.pomodoroStarted || 0), 0);
    const totalCompleted = recentWeek.reduce((sum, d) => sum + (d.pomodoroCompleted || 0), 0);

    if (totalStarted < 3) return null; // Not enough data
    const abandonmentRate = Math.round(((totalStarted - totalCompleted) / totalStarted) * 100);

    if (abandonmentRate >= this.THRESHOLDS.pomodoroAbandonmentHigh) {
      return { type: 'pomodoro_abandonment', severity: 'high', data: { abandonmentRate, started: totalStarted, completed: totalCompleted }, message: `${abandonmentRate}% of Pomodoro cycles abandoned this week` };
    }
    return null;
  }

  checkFocusScoreDecline(data) {
    if (data.focusScoreHistory.length < 14) return null;

    const twoWeeksAgo = data.focusScoreHistory.slice(-14, -7);
    const thisWeek = data.focusScoreHistory.slice(-7);

    const avgTwoWeeksAgo = twoWeeksAgo.reduce((s, d) => s + d.score, 0) / twoWeeksAgo.length;
    const avgThisWeek = thisWeek.reduce((s, d) => s + d.score, 0) / thisWeek.length;
    const decline = Math.round(avgTwoWeeksAgo - avgThisWeek);

    if (decline >= this.THRESHOLDS.focusScoreDeclineHigh) {
      return { type: 'focus_score_decline', severity: 'high', data: { decline, from: Math.round(avgTwoWeeksAgo), to: Math.round(avgThisWeek) }, message: `Focus Score dropped ${decline} points over 2 weeks` };
    }
    if (decline >= this.THRESHOLDS.focusScoreDeclineMedium) {
      return { type: 'focus_score_decline', severity: 'medium', data: { decline }, message: `Focus Score dropped ${decline} points over 2 weeks` };
    }
    return null;
  }

  checkStreakBreak(data) {
    if (data.streakHistory.length === 0) return null;
    const lastStreak = data.streakHistory[data.streakHistory.length - 1];

    if (!lastStreak.broken) return null;
    if (lastStreak.length < 7) return null; // Only track significant streak breaks

    const daysSinceBreak = this.daysBetween(new Date(lastStreak.endDate), new Date());
    if (daysSinceBreak <= this.THRESHOLDS.streakRestartWindow) return null; // Still in restart window
    if (data.currentStreak > 0) return null; // Already restarted

    return {
      type: 'streak_break_no_restart',
      severity: daysSinceBreak > 14 ? 'high' : 'medium',
      data: { lostStreakLength: lastStreak.length, daysSinceBreak },
      message: `Lost a ${lastStreak.length}-day streak ${daysSinceBreak} days ago, hasn't restarted`
    };
  }

  checkNuclearModeDisuse(data) {
    // Only relevant if user has used Nuclear Mode before
    const nuclearUses = data.nuclearModeHistory.filter(d => d.used);
    if (nuclearUses.length < 3) return null; // Wasn't a regular user

    const lastUse = nuclearUses[nuclearUses.length - 1];
    const daysSince = this.daysBetween(new Date(lastUse.date), new Date());

    if (daysSince >= this.THRESHOLDS.nuclearModeDisuse) {
      return { type: 'nuclear_mode_disuse', severity: 'medium', data: { daysSinceLastUse: daysSince, totalPreviousUses: nuclearUses.length }, message: `Nuclear Mode unused for ${daysSince} days (was used ${nuclearUses.length} times)` };
    }
    return null;
  }

  checkBypassAttempts(data) {
    const recentWeek = data.bypassAttempts.filter(
      d => this.daysBetween(new Date(d.date), new Date()) <= 7
    );
    const totalAttempts = recentWeek.reduce((sum, d) => sum + d.count, 0);

    if (totalAttempts >= this.THRESHOLDS.bypassAttemptsHigh) {
      return { type: 'bypass_attempts_increasing', severity: 'high', data: { weeklyAttempts: totalAttempts }, message: `${totalAttempts} block page bypass attempts this week` };
    }
    return null;
  }

  checkBlocklistShrinking(data) {
    if (data.blocklistHistory.length < 7) return null;

    const weekAgo = data.blocklistHistory.find(
      d => this.daysBetween(new Date(d.date), new Date()) >= 7
    );
    if (!weekAgo) return null;

    const currentCount = data.blockedSites.length;
    if (weekAgo.count === 0) return null;
    const reduction = Math.round(((weekAgo.count - currentCount) / weekAgo.count) * 100);

    if (reduction >= this.THRESHOLDS.blocklistReductionHigh) {
      return { type: 'blocklist_shrinking', severity: 'high', data: { reduction, from: weekAgo.count, to: currentCount }, message: `Blocklist reduced by ${reduction}% (${weekAgo.count} → ${currentCount} sites)` };
    }
    return null;
  }

  checkProFeatureDisuse(data) {
    const proFeatures = data.proFeatureUsage;
    const now = Date.now();
    const threshold = this.THRESHOLDS.proFeatureDisuse * 24 * 60 * 60 * 1000;

    const allUnused = Object.values(proFeatures).every(
      lastUsed => !lastUsed || (now - new Date(lastUsed).getTime()) > threshold
    );

    if (allUnused) {
      return { type: 'pro_features_unused', severity: 'critical', data: { daysSinceAnyProFeature: this.THRESHOLDS.proFeatureDisuse }, message: `Pro subscriber hasn't used any Pro features in ${this.THRESHOLDS.proFeatureDisuse}+ days` };
    }
    return null;
  }

  checkPopupInactivity(data) {
    if (data.popupOpenHistory.length === 0) return null;

    const lastOpen = data.popupOpenHistory[data.popupOpenHistory.length - 1];
    const daysSince = this.daysBetween(new Date(lastOpen.date), new Date());

    if (daysSince >= this.THRESHOLDS.popupInactivityMedium) {
      return { type: 'popup_inactivity', severity: 'medium', data: { daysSinceLastOpen: daysSince }, message: `Popup not opened in ${daysSince} days` };
    }

    // Check timer-less opens (opens popup but doesn't start timer)
    const recentOpens = data.popupOpenHistory.slice(-this.THRESHOLDS.timerlessOpensThreshold);
    const allTimerless = recentOpens.every(d => d.opened && !d.timerStarted);
    if (allTimerless && recentOpens.length >= this.THRESHOLDS.timerlessOpensThreshold) {
      return { type: 'timer_not_started', severity: 'medium', data: { consecutiveTimerlessOpens: recentOpens.length }, message: `Opened popup ${recentOpens.length} times without starting a timer` };
    }
    return null;
  }

  // --- Risk Score Calculation ---

  calculateRiskScore(signals) {
    const severityWeights = { critical: 35, high: 22, medium: 12, low: 5 };
    const raw = signals.reduce((score, signal) => score + (severityWeights[signal.severity] || 0), 0);
    return Math.min(100, Math.max(0, raw));
  }

  getRiskTier(score) {
    if (score >= 75) return { name: 'Churning', color: '#ef4444', action: 'immediate_intervention', icon: '🚨' };
    if (score >= 55) return { name: 'At Risk', color: '#f97316', action: 'urgent_outreach', icon: '⚠️' };
    if (score >= 35) return { name: 'Casual', color: '#f59e0b', action: 'gentle_nudge', icon: '👋' };
    if (score >= 15) return { name: 'Engaged', color: '#3b82f6', action: 'nurture', icon: '⭐' };
    return { name: 'Healthy', color: '#22c55e', action: 'maintain', icon: '💚' };
  }

  // --- Utility ---

  daysBetween(date1, date2) {
    return Math.floor(Math.abs(date2 - date1) / (1000 * 60 * 60 * 24));
  }
}
```

### 1.3 Usage Tracking Integration

Every user action in Focus Mode - Blocker is tracked locally for churn detection. The `trackFocusUsage()` function runs in the service worker and records daily aggregates.

```javascript
// usage-tracker.js — Hooks into service worker events
// Called from service worker event handlers

/**
 * Record a focus session event.
 * Called when a focus session completes, a Pomodoro cycle starts/ends,
 * the popup opens, or blocking events occur.
 */
async function trackFocusUsage(event) {
  const today = new Date().toISOString().split('T')[0];
  const { focusSessionHistory = [] } = await chrome.storage.local.get('focusSessionHistory');

  let todayEntry = focusSessionHistory.find(e => e.date === today);
  if (!todayEntry) {
    todayEntry = {
      date: today,
      sessionsCompleted: 0,
      totalMinutes: 0,
      pomodoroStarted: 0,
      pomodoroCompleted: 0,
      sitesBlocked: 0,
      bypassAttempts: 0
    };
    focusSessionHistory.push(todayEntry);
  }

  switch (event.type) {
    case 'session_complete':
      todayEntry.sessionsCompleted++;
      todayEntry.totalMinutes += event.durationMinutes || 0;
      break;
    case 'pomodoro_started':
      todayEntry.pomodoroStarted++;
      break;
    case 'pomodoro_completed':
      todayEntry.pomodoroCompleted++;
      break;
    case 'site_blocked':
      todayEntry.sitesBlocked++;
      break;
    case 'bypass_attempt':
      todayEntry.bypassAttempts++;
      break;
  }

  // Keep last 90 days only
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);
  const cutoff = cutoffDate.toISOString().split('T')[0];
  const filtered = focusSessionHistory.filter(e => e.date >= cutoff);

  await chrome.storage.local.set({ focusSessionHistory: filtered });
}

/**
 * Track popup open events.
 * Called from popup.js via chrome.runtime.sendMessage.
 */
async function trackPopupOpen(timerStarted = false) {
  const today = new Date().toISOString().split('T')[0];
  const { popupOpenHistory = [] } = await chrome.storage.local.get('popupOpenHistory');

  popupOpenHistory.push({ date: today, opened: true, timerStarted });

  // Keep last 30 entries
  const trimmed = popupOpenHistory.slice(-30);
  await chrome.storage.local.set({ popupOpenHistory: trimmed });
}

/**
 * Track Focus Score changes.
 * Called whenever Focus Score is recalculated.
 */
async function trackFocusScore(newScore) {
  const today = new Date().toISOString().split('T')[0];
  const { focusScoreHistory = [] } = await chrome.storage.local.get('focusScoreHistory');

  // Update or add today's entry
  const existing = focusScoreHistory.find(e => e.date === today);
  if (existing) {
    existing.score = newScore;
  } else {
    focusScoreHistory.push({ date: today, score: newScore });
  }

  // Keep last 90 days
  const trimmed = focusScoreHistory.slice(-90);
  await chrome.storage.local.set({ focusScoreHistory: trimmed });
}

/**
 * Track blocklist size changes.
 * Called whenever a site is added or removed from the blocklist.
 */
async function trackBlocklistChange(currentBlockedSites) {
  const today = new Date().toISOString().split('T')[0];
  const { blocklistHistory = [] } = await chrome.storage.local.get('blocklistHistory');

  blocklistHistory.push({ date: today, count: currentBlockedSites.length });

  // Keep last 90 entries
  const trimmed = blocklistHistory.slice(-90);
  await chrome.storage.local.set({ blocklistHistory: trimmed });
}

/**
 * Track Pro feature usage.
 * Called when any Pro-exclusive feature is activated.
 */
async function trackProFeatureUsage(featureName) {
  const { proFeatureUsage = {} } = await chrome.storage.local.get('proFeatureUsage');
  proFeatureUsage[featureName] = new Date().toISOString();
  await chrome.storage.local.set({ proFeatureUsage });
}
```

**Service Worker Alarm Integration:**

```javascript
// In service-worker.js — Daily churn analysis alarm

chrome.alarms.create('dailyChurnAnalysis', {
  periodInMinutes: 1440 // Once per day (24 hours)
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'dailyChurnAnalysis') {
    const detector = new FocusChurnDetector();
    const analysis = await detector.analyzeChurnRisk();

    // Store the latest analysis
    await chrome.storage.local.set({
      churnAnalysis: analysis,
      lastChurnAnalysisDate: new Date().toISOString()
    });

    // If at risk, trigger appropriate retention action
    if (analysis.isAtRisk && analysis.riskScore >= 35) {
      await triggerRetentionAction(analysis);
    }
  }
});

/**
 * Dispatch retention actions based on churn analysis.
 * Connects to Agent 4's proactive retention triggers.
 */
async function triggerRetentionAction(analysis) {
  const { tier, recommendations } = analysis;

  switch (tier.action) {
    case 'immediate_intervention':
      // Show high-urgency notification
      chrome.notifications.create('churn-intervention', {
        type: 'basic',
        iconUrl: 'assets/icons/icon128.png',
        title: 'Your Focus Score misses you!',
        message: recommendations[0]?.notification || 'Start a quick focus session to get back on track.',
        priority: 2
      });
      break;

    case 'urgent_outreach':
      // Show motivational notification
      chrome.notifications.create('churn-nudge', {
        type: 'basic',
        iconUrl: 'assets/icons/icon128.png',
        title: 'Ready to focus?',
        message: recommendations[0]?.notification || 'A quick 25-minute session could restart your momentum.',
        priority: 1
      });
      break;

    case 'gentle_nudge':
      // Set badge to draw attention
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#f59e0b' });
      break;
  }
}
```

### 1.4 FocusRiskScoringModel

A more sophisticated scoring model that combines weighted factors for nuanced risk assessment.

```javascript
// risk-scoring.js — Weighted risk model for Focus Mode - Blocker

class FocusRiskScoringModel {
  constructor() {
    // Engagement factors (negative score = reduces risk)
    this.engagementWeights = {
      focusSessionsThisWeek: -3,     // Per session, max -21
      focusScore: -0.3,              // Per point, max -30 at score 100
      streakLength: -0.5,            // Per day, max -15 at 30-day streak
      featuresUsed: -4,              // Per feature (of 8 total), max -32
      proSubscriber: -10,            // Flat bonus for paying users
      nuclearModeUser: -5,           // Flat bonus for Nuclear Mode users
      pomodoroCompletionRate: -0.15  // Per percentage point, max -15
    };

    // Risk factors (positive score = increases risk)
    this.riskWeights = {
      daysSinceLastSession: 2.5,     // Per day, grows quickly
      sessionDeclineRate: 0.3,       // Per percentage point of decline
      focusScoreDecline: 1.0,        // Per point of decline
      streakBrokenRecently: 8,       // Flat if streak broken in last 7 days
      pomodoroAbandonmentRate: 0.2,  // Per percentage point
      bypassAttemptsWeekly: 3,       // Per attempt
      blocklistReduction: 0.4,       // Per percentage point of reduction
      settingsResets: 15,            // Per reset event
      popupInactiveDays: 1.5         // Per day without opening popup
    };
  }

  /**
   * Calculate comprehensive risk score.
   * @returns {Object} Score (0-100), tier, breakdown, and recommendations
   */
  async calculateScore() {
    const data = await this.gatherMetrics();
    let score = 50; // Neutral baseline

    // Apply engagement factors (lower score = healthier)
    const engagementBreakdown = {};
    score += (engagementBreakdown.sessions = Math.max(-21, this.engagementWeights.focusSessionsThisWeek * data.focusSessionsThisWeek));
    score += (engagementBreakdown.focusScore = this.engagementWeights.focusScore * data.focusScore);
    score += (engagementBreakdown.streak = Math.max(-15, this.engagementWeights.streakLength * data.streakLength));
    score += (engagementBreakdown.features = this.engagementWeights.featuresUsed * data.featuresUsed);
    score += (engagementBreakdown.pro = this.engagementWeights.proSubscriber * (data.isPro ? 1 : 0));
    score += (engagementBreakdown.nuclear = this.engagementWeights.nuclearModeUser * (data.usesNuclearMode ? 1 : 0));
    score += (engagementBreakdown.pomodoro = this.engagementWeights.pomodoroCompletionRate * data.pomodoroCompletionRate);

    // Apply risk factors (higher score = more at risk)
    const riskBreakdown = {};
    score += (riskBreakdown.inactivity = Math.min(30, this.riskWeights.daysSinceLastSession * data.daysSinceLastSession));
    score += (riskBreakdown.decline = this.riskWeights.sessionDeclineRate * data.sessionDeclineRate);
    score += (riskBreakdown.scoreDrop = this.riskWeights.focusScoreDecline * data.focusScoreDecline);
    score += (riskBreakdown.streakBroken = this.riskWeights.streakBrokenRecently * (data.streakBrokenRecently ? 1 : 0));
    score += (riskBreakdown.abandonment = this.riskWeights.pomodoroAbandonmentRate * data.pomodoroAbandonmentRate);
    score += (riskBreakdown.bypasses = this.riskWeights.bypassAttemptsWeekly * data.bypassAttemptsWeekly);
    score += (riskBreakdown.blocklist = this.riskWeights.blocklistReduction * data.blocklistReduction);
    score += (riskBreakdown.resets = this.riskWeights.settingsResets * data.settingsResets);
    score += (riskBreakdown.popup = this.riskWeights.popupInactiveDays * data.popupInactiveDays);

    const finalScore = Math.max(0, Math.min(100, Math.round(score)));

    return {
      score: finalScore,
      tier: this.getTier(finalScore),
      breakdown: { engagement: engagementBreakdown, risk: riskBreakdown },
      metrics: data,
      recommendations: this.getRecommendations(finalScore, data)
    };
  }

  async gatherMetrics() {
    const storage = await chrome.storage.local.get([
      'focusSessionHistory', 'focusScore', 'focusScoreHistory',
      'currentStreak', 'streakHistory', 'featureUsageMap',
      'subscription', 'nuclearModeHistory', 'bypassAttempts',
      'blockedSites', 'blocklistHistory', 'popupOpenHistory',
      'settingsResetHistory'
    ]);

    const sessionHistory = storage.focusSessionHistory || [];
    const recentWeek = sessionHistory.slice(-7);
    const previousWeek = sessionHistory.slice(-14, -7);

    // Calculate session decline
    const recentTotal = recentWeek.reduce((s, d) => s + (d.sessionsCompleted || 0), 0);
    const previousTotal = previousWeek.reduce((s, d) => s + (d.sessionsCompleted || 0), 0);
    const sessionDecline = previousTotal > 0 ? Math.max(0, ((previousTotal - recentTotal) / previousTotal) * 100) : 0;

    // Calculate Focus Score decline
    const scoreHistory = storage.focusScoreHistory || [];
    let focusScoreDecline = 0;
    if (scoreHistory.length >= 14) {
      const oldAvg = scoreHistory.slice(-14, -7).reduce((s, d) => s + d.score, 0) / 7;
      const newAvg = scoreHistory.slice(-7).reduce((s, d) => s + d.score, 0) / 7;
      focusScoreDecline = Math.max(0, oldAvg - newAvg);
    }

    // Pomodoro completion rate
    const pomodoroStarted = recentWeek.reduce((s, d) => s + (d.pomodoroStarted || 0), 0);
    const pomodoroCompleted = recentWeek.reduce((s, d) => s + (d.pomodoroCompleted || 0), 0);
    const pomodoroCompletionRate = pomodoroStarted > 0 ? (pomodoroCompleted / pomodoroStarted) * 100 : 100;

    // Count features used
    const featureMap = storage.featureUsageMap || {};
    const featuresUsed = Object.keys(featureMap).length;

    // Days since last session
    const lastSessionDate = sessionHistory.length > 0 ? new Date(sessionHistory[sessionHistory.length - 1].date) : new Date(0);
    const daysSinceLastSession = Math.floor((Date.now() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24));

    // Bypass attempts this week
    const bypasses = (storage.bypassAttempts || []).filter(
      d => (Date.now() - new Date(d.date).getTime()) < 7 * 24 * 60 * 60 * 1000
    );
    const bypassAttemptsWeekly = bypasses.reduce((s, d) => s + d.count, 0);

    // Blocklist reduction
    const blocklistHist = storage.blocklistHistory || [];
    let blocklistReduction = 0;
    if (blocklistHist.length >= 2) {
      const weekAgoEntry = blocklistHist.find(d => (Date.now() - new Date(d.date).getTime()) >= 7 * 24 * 60 * 60 * 1000);
      if (weekAgoEntry && weekAgoEntry.count > 0) {
        blocklistReduction = Math.max(0, ((weekAgoEntry.count - (storage.blockedSites || []).length) / weekAgoEntry.count) * 100);
      }
    }

    // Streak status
    const streakHistory = storage.streakHistory || [];
    const lastStreak = streakHistory[streakHistory.length - 1];
    const streakBrokenRecently = lastStreak?.broken && (Date.now() - new Date(lastStreak.endDate).getTime()) < 7 * 24 * 60 * 60 * 1000;

    // Popup inactivity
    const popupHistory = storage.popupOpenHistory || [];
    const lastPopup = popupHistory[popupHistory.length - 1];
    const popupInactiveDays = lastPopup ? Math.floor((Date.now() - new Date(lastPopup.date).getTime()) / (1000 * 60 * 60 * 24)) : 30;

    return {
      focusSessionsThisWeek: recentTotal,
      focusScore: storage.focusScore || 0,
      streakLength: storage.currentStreak || 0,
      featuresUsed,
      isPro: storage.subscription?.tier === 'pro',
      usesNuclearMode: (storage.nuclearModeHistory || []).some(d => d.used),
      pomodoroCompletionRate,
      daysSinceLastSession,
      sessionDeclineRate: sessionDecline,
      focusScoreDecline,
      streakBrokenRecently: !!streakBrokenRecently,
      pomodoroAbandonmentRate: 100 - pomodoroCompletionRate,
      bypassAttemptsWeekly,
      blocklistReduction,
      settingsResets: (storage.settingsResetHistory || []).filter(
        ts => (Date.now() - ts) < 30 * 24 * 60 * 60 * 1000
      ).length,
      popupInactiveDays
    };
  }

  getTier(score) {
    if (score >= 80) return { name: 'Churning', color: '#ef4444', action: 'immediate', icon: '🚨' };
    if (score >= 60) return { name: 'At Risk', color: '#f97316', action: 'urgent', icon: '⚠️' };
    if (score >= 40) return { name: 'Casual', color: '#f59e0b', action: 'monitor', icon: '👋' };
    if (score >= 20) return { name: 'Engaged', color: '#3b82f6', action: 'nurture', icon: '⭐' };
    return { name: 'Healthy', color: '#22c55e', action: 'maintain', icon: '💚' };
  }

  getRecommendations(score, metrics) {
    const recs = [];

    if (metrics.daysSinceLastSession > 7) {
      recs.push({
        type: 'reactivation',
        priority: 'high',
        action: 'Show motivational notification with Focus Score history',
        notification: `Your Focus Score was ${metrics.focusScore}. One session could bring it back!`
      });
    }

    if (metrics.pomodoroAbandonmentRate > 50) {
      recs.push({
        type: 'timer_adjustment',
        priority: 'medium',
        action: 'Suggest shorter focus sessions',
        notification: 'Try a shorter 15-minute focus session to build momentum.'
      });
    }

    if (metrics.focusScoreDecline > 15) {
      recs.push({
        type: 'score_recovery',
        priority: 'high',
        action: 'Show Focus Score trend with recovery path',
        notification: `Your Focus Score dropped ${Math.round(metrics.focusScoreDecline)} points. Let's turn it around!`
      });
    }

    if (metrics.streakBrokenRecently) {
      recs.push({
        type: 'streak_restart',
        priority: 'high',
        action: 'Encourage new streak with fresh-start framing',
        notification: 'Every champion has setbacks. Start a new streak today!'
      });
    }

    if (metrics.featuresUsed < 3) {
      recs.push({
        type: 'feature_discovery',
        priority: 'medium',
        action: 'Trigger feature discovery prompt for unused features',
        notification: 'Did you know Focus Mode has a Pomodoro timer? Try it!'
      });
    }

    if (metrics.isPro && metrics.bypassAttemptsWeekly > 3) {
      recs.push({
        type: 'nuclear_mode_suggestion',
        priority: 'medium',
        action: 'Suggest Nuclear Mode for users who struggle with bypassing',
        notification: 'Struggling with temptation? Nuclear Mode makes blocking truly unbypassable.'
      });
    }

    return recs;
  }
}
```

### 1.5 Risk Tier Definitions & Actions

| Tier | Score Range | Color | Trigger Actions |
|------|------------|-------|-----------------|
| **Healthy** | 0-19 | Green | No action needed. Continue tracking. Surface milestones and achievements. |
| **Engaged** | 20-39 | Blue | Nurture with feature discovery prompts. Show "keep it up" micro-celebrations. |
| **Casual** | 40-59 | Yellow | Gentle nudge: badge indicator on extension icon. Suggest quick 10-minute sessions. |
| **At Risk** | 60-79 | Orange | Urgent: motivational notification with personalized message. Highlight Focus Score and streak data. |
| **Churning** | 80-100 | Red | Immediate intervention: notification with value reminder. For Pro users: highlight features they're paying for but not using. |

**Privacy Note:** All churn detection runs entirely within the extension via `chrome.storage.local`. No data is sent to any external server. The user's churn risk score is only used locally to decide which in-extension notifications to show. This aligns with Focus Mode - Blocker's privacy-first design.

---

## 2. Engagement Scoring

### 2.1 FocusHealthScoreCalculator

The health score provides a holistic view of user engagement across 5 dimensions, adapted specifically for a productivity/blocking extension.

```javascript
// health-score.js — Focus Mode - Blocker Engagement Health Score

class FocusHealthScoreCalculator {
  constructor() {
    this.weights = {
      frequency: 0.25,     // How often they run focus sessions
      depth: 0.25,         // How many features they actively use
      recency: 0.20,       // How recently they had a focus session
      consistency: 0.15,   // Streak stability and Focus Score steadiness
      growth: 0.15         // Is their Focus Score trending up or down?
    };

    // Total features in Focus Mode - Blocker
    this.ALL_FEATURES = [
      'site_blocking',       // Core blocking feature
      'pomodoro_timer',      // Pomodoro timer usage
      'nuclear_mode',        // Nuclear Mode (Pro)
      'focus_score_viewed',  // Viewed Focus Score in popup/options
      'streak_tracking',     // Active streak maintained
      'custom_block_page',   // Customized block page (Pro)
      'context_menu',        // Used right-click to block
      'import_export',       // Used settings import/export (Pro)
      'stats_dashboard',     // Viewed advanced stats (Pro)
      'scheduled_blocking'   // Used time-based blocking schedules
    ];
  }

  /**
   * Calculate the user's engagement health score.
   * @returns {Object} Total score (0-100), dimension breakdown, tier, recommendations
   */
  async calculate() {
    const data = await this.gatherData();

    const scores = {
      frequency: this.scoreFrequency(data.sessionsPerWeek),
      depth: this.scoreDepth(data.featuresUsed),
      recency: this.scoreRecency(data.daysSinceLastSession),
      consistency: this.scoreConsistency(data.streakLength, data.focusScoreStability),
      growth: this.scoreGrowth(data.focusScoreTrend)
    };

    const totalScore = Math.round(
      Object.entries(scores).reduce((total, [key, score]) => {
        return total + (score * this.weights[key]);
      }, 0)
    );

    return {
      score: totalScore,
      breakdown: scores,
      tier: this.getTier(totalScore),
      recommendations: this.getRecommendations(scores),
      calculatedAt: new Date().toISOString()
    };
  }

  async gatherData() {
    const storage = await chrome.storage.local.get([
      'focusSessionHistory', 'featureUsageMap', 'currentStreak',
      'focusScoreHistory', 'focusScore'
    ]);

    const sessionHistory = storage.focusSessionHistory || [];
    const recentWeek = sessionHistory.slice(-7);
    const sessionsPerWeek = recentWeek.reduce((s, d) => s + (d.sessionsCompleted || 0), 0);

    const featureMap = storage.featureUsageMap || {};
    const featuresUsed = Object.keys(featureMap).length;

    const lastSession = sessionHistory[sessionHistory.length - 1];
    const daysSinceLastSession = lastSession
      ? Math.floor((Date.now() - new Date(lastSession.date).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    // Focus Score stability: standard deviation of last 14 days
    const scoreHistory = (storage.focusScoreHistory || []).slice(-14);
    const scores = scoreHistory.map(d => d.score);
    const stability = scores.length > 1 ? this.standardDeviation(scores) : 50;

    // Focus Score trend: compare last 7 days vs previous 7 days
    const allScoreHistory = storage.focusScoreHistory || [];
    let focusScoreTrend = 0;
    if (allScoreHistory.length >= 14) {
      const oldAvg = allScoreHistory.slice(-14, -7).reduce((s, d) => s + d.score, 0) / 7;
      const newAvg = allScoreHistory.slice(-7).reduce((s, d) => s + d.score, 0) / 7;
      focusScoreTrend = newAvg - oldAvg;
    }

    return {
      sessionsPerWeek,
      featuresUsed,
      daysSinceLastSession,
      streakLength: storage.currentStreak || 0,
      focusScoreStability: stability,
      focusScoreTrend
    };
  }

  scoreFrequency(sessionsPerWeek) {
    if (sessionsPerWeek >= 7) return 100;  // Daily usage
    if (sessionsPerWeek >= 5) return 85;   // Near-daily
    if (sessionsPerWeek >= 3) return 70;   // Regular
    if (sessionsPerWeek >= 1) return 50;   // Weekly
    return 20;                              // Inactive
  }

  scoreDepth(featuresUsed) {
    const ratio = featuresUsed / this.ALL_FEATURES.length;
    if (ratio >= 0.8) return 100;
    if (ratio >= 0.6) return 80;
    if (ratio >= 0.4) return 60;
    if (ratio >= 0.2) return 40;
    return 20;
  }

  scoreRecency(daysSinceLastSession) {
    if (daysSinceLastSession <= 1) return 100;
    if (daysSinceLastSession <= 3) return 85;
    if (daysSinceLastSession <= 7) return 70;
    if (daysSinceLastSession <= 14) return 50;
    if (daysSinceLastSession <= 30) return 30;
    return 10;
  }

  scoreConsistency(streakLength, focusScoreStdDev) {
    // Combine streak length (habit consistency) with Focus Score stability
    let streakScore = 0;
    if (streakLength >= 30) streakScore = 100;
    else if (streakLength >= 14) streakScore = 80;
    else if (streakLength >= 7) streakScore = 60;
    else if (streakLength >= 3) streakScore = 40;
    else streakScore = 20;

    // Lower standard deviation = more consistent = higher score
    let stabilityScore = 100;
    if (focusScoreStdDev > 25) stabilityScore = 20;
    else if (focusScoreStdDev > 15) stabilityScore = 50;
    else if (focusScoreStdDev > 8) stabilityScore = 75;

    return Math.round((streakScore * 0.6) + (stabilityScore * 0.4));
  }

  scoreGrowth(focusScoreTrend) {
    // Positive trend = growing, negative = declining
    if (focusScoreTrend >= 10) return 100;
    if (focusScoreTrend >= 5) return 85;
    if (focusScoreTrend >= 0) return 70;
    if (focusScoreTrend >= -5) return 50;
    if (focusScoreTrend >= -15) return 30;
    return 10;
  }

  getTier(score) {
    if (score >= 80) return { name: 'Champion', color: '#22c55e', badge: 'champion' };
    if (score >= 60) return { name: 'Focused', color: '#3b82f6', badge: 'focused' };
    if (score >= 40) return { name: 'Casual', color: '#f59e0b', badge: 'casual' };
    if (score >= 20) return { name: 'Drifting', color: '#f97316', badge: 'drifting' };
    return { name: 'Disengaging', color: '#ef4444', badge: 'disengaging' };
  }

  getRecommendations(scores) {
    const recs = [];
    const lowestDimension = Object.entries(scores).sort((a, b) => a[1] - b[1])[0];

    switch (lowestDimension[0]) {
      case 'frequency':
        recs.push({ dimension: 'frequency', suggestion: 'Try setting a daily reminder to start a focus session. Even 15 minutes counts!' });
        break;
      case 'depth':
        recs.push({ dimension: 'depth', suggestion: 'You\'re only using a few features. Explore the Pomodoro timer or context menu blocking!' });
        break;
      case 'recency':
        recs.push({ dimension: 'recency', suggestion: 'It\'s been a while! Start a quick focus session to get back in the groove.' });
        break;
      case 'consistency':
        recs.push({ dimension: 'consistency', suggestion: 'Your focus patterns vary a lot. Try blocking the same time each day for consistency.' });
        break;
      case 'growth':
        recs.push({ dimension: 'growth', suggestion: 'Your Focus Score is trending down. Add more distracting sites to your blocklist!' });
        break;
    }

    return recs;
  }

  standardDeviation(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(v => Math.pow(v - mean, 2));
    return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / values.length);
  }
}
```

### 2.2 FocusPowerUserIdentifier

```javascript
// power-users.js — Identify and reward Focus Mode - Blocker power users

class FocusPowerUserIdentifier {
  constructor() {
    this.criteria = {
      minSessionsPerMonth: 20,        // 20+ focus sessions per month
      minFeaturesUsed: 5,             // Uses 5+ of 10 features
      minFocusScore: 70,              // Consistent Focus Score above 70
      minStreakLength: 14,            // Active streak of 14+ days
      usesNuclearMode: true,          // Regular Nuclear Mode user
      hasExportedSettings: true,      // Invested in configuration
      hasCustomBlockPage: true        // Personalized their experience
    };
  }

  /**
   * Calculate power user score and tier.
   * @returns {Object} Score, tier, criteria met, rewards earned
   */
  async identify() {
    const data = await this.gatherPowerMetrics();
    const score = this.scorePowerUser(data);
    const tier = this.getPowerTier(score);
    const criteriaMet = this.getCriteriaMet(data);

    return {
      score,
      tier,
      criteriaMet,
      totalCriteria: Object.keys(this.criteria).length,
      rewards: this.getRewards(tier),
      nextTierProgress: this.getNextTierProgress(score),
      data
    };
  }

  async gatherPowerMetrics() {
    const storage = await chrome.storage.local.get([
      'focusSessionHistory', 'featureUsageMap', 'focusScore',
      'currentStreak', 'nuclearModeHistory', 'proFeatureUsage',
      'subscription'
    ]);

    const sessionHistory = storage.focusSessionHistory || [];
    const last30Days = sessionHistory.filter(d => {
      const daysDiff = (Date.now() - new Date(d.date).getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 30;
    });

    const sessionsThisMonth = last30Days.reduce((s, d) => s + (d.sessionsCompleted || 0), 0);
    const featuresUsed = Object.keys(storage.featureUsageMap || {}).length;
    const nuclearUses = (storage.nuclearModeHistory || []).filter(d => d.used).length;

    return {
      sessionsThisMonth,
      featuresUsed,
      focusScore: storage.focusScore || 0,
      streakLength: storage.currentStreak || 0,
      nuclearModeUses: nuclearUses,
      usesNuclearMode: nuclearUses >= 3,
      hasExportedSettings: !!(storage.proFeatureUsage || {}).importExport,
      hasCustomBlockPage: !!(storage.proFeatureUsage || {}).customTheme,
      isPro: storage.subscription?.tier === 'pro'
    };
  }

  scorePowerUser(data) {
    let score = 0;

    // Activity (30 points max)
    score += Math.min(30, data.sessionsThisMonth * 1.5);

    // Feature depth (20 points max)
    score += Math.min(20, data.featuresUsed * 4);

    // Focus Score (15 points max)
    if (data.focusScore >= 90) score += 15;
    else if (data.focusScore >= 70) score += 10;
    else if (data.focusScore >= 50) score += 5;

    // Streak (15 points max)
    if (data.streakLength >= 30) score += 15;
    else if (data.streakLength >= 14) score += 10;
    else if (data.streakLength >= 7) score += 5;

    // Nuclear Mode usage (10 points)
    if (data.usesNuclearMode) score += 10;

    // Investment in configuration (10 points)
    if (data.hasExportedSettings) score += 5;
    if (data.hasCustomBlockPage) score += 5;

    return Math.min(100, score);
  }

  getPowerTier(score) {
    if (score >= 90) return { name: 'Focus Master', badge: 'master', color: '#a855f7' };
    if (score >= 75) return { name: 'Focus Expert', badge: 'expert', color: '#3b82f6' };
    if (score >= 60) return { name: 'Power User', badge: 'power', color: '#22c55e' };
    return { name: 'Regular', badge: 'regular', color: '#6b7280' };
  }

  getCriteriaMet(data) {
    return {
      sessions: data.sessionsThisMonth >= this.criteria.minSessionsPerMonth,
      features: data.featuresUsed >= this.criteria.minFeaturesUsed,
      focusScore: data.focusScore >= this.criteria.minFocusScore,
      streak: data.streakLength >= this.criteria.minStreakLength,
      nuclearMode: data.usesNuclearMode,
      exported: data.hasExportedSettings,
      customBlockPage: data.hasCustomBlockPage
    };
  }

  getRewards(tier) {
    switch (tier.name) {
      case 'Focus Master':
        return [
          { type: 'badge', name: 'Focus Master Badge', description: 'Displayed on your block page' },
          { type: 'theme', name: 'Exclusive Master Theme', description: 'Unique block page theme only for Focus Masters' },
          { type: 'feature', name: 'Beta Access', description: 'Early access to new Focus Mode features' }
        ];
      case 'Focus Expert':
        return [
          { type: 'badge', name: 'Focus Expert Badge', description: 'Displayed on your block page' },
          { type: 'theme', name: 'Expert Theme Pack', description: '3 exclusive block page themes' }
        ];
      case 'Power User':
        return [
          { type: 'badge', name: 'Power User Badge', description: 'Displayed on your block page' }
        ];
      default:
        return [];
    }
  }

  getNextTierProgress(score) {
    if (score >= 90) return { current: 'Focus Master', next: null, progress: 100 };
    if (score >= 75) return { current: 'Focus Expert', next: 'Focus Master', progress: Math.round(((score - 75) / 15) * 100), pointsNeeded: 90 - score };
    if (score >= 60) return { current: 'Power User', next: 'Focus Expert', progress: Math.round(((score - 60) / 15) * 100), pointsNeeded: 75 - score };
    return { current: 'Regular', next: 'Power User', progress: Math.round((score / 60) * 100), pointsNeeded: 60 - score };
  }
}
```

### 2.3 Engagement Dashboard Data

The popup and options page can surface engagement data to users, making Focus Mode - Blocker's gamification even more compelling.

**Popup Health Score Widget:**

```javascript
// popup-health-widget.js — Renders in the popup footer area

async function renderHealthWidget(container) {
  const calculator = new FocusHealthScoreCalculator();
  const health = await calculator.calculate();

  container.innerHTML = `
    <div class="health-widget" style="
      display: flex; align-items: center; gap: 12px;
      padding: 10px 12px; border-radius: 8px;
      background: ${health.tier.color}15;
      border: 1px solid ${health.tier.color}30;
    ">
      <div class="health-ring" style="
        width: 40px; height: 40px; border-radius: 50%;
        background: conic-gradient(${health.tier.color} ${health.score * 3.6}deg, #e5e7eb ${health.score * 3.6}deg);
        display: flex; align-items: center; justify-content: center;
      ">
        <span style="
          width: 30px; height: 30px; border-radius: 50%;
          background: white; display: flex; align-items: center;
          justify-content: center; font-weight: 700; font-size: 12px;
        ">${health.score}</span>
      </div>
      <div>
        <div style="font-weight: 600; font-size: 13px; color: ${health.tier.color};">
          ${health.tier.name}
        </div>
        <div style="font-size: 11px; color: #6b7280;">
          ${health.recommendations[0]?.suggestion || 'Keep up the great work!'}
        </div>
      </div>
    </div>
  `;
}
```

**Options Page Engagement Dashboard:**

```javascript
// options-engagement.js — Full engagement breakdown in options page

async function renderEngagementDashboard(container) {
  const calculator = new FocusHealthScoreCalculator();
  const health = await calculator.calculate();

  const identifier = new FocusPowerUserIdentifier();
  const powerStatus = await identifier.identify();

  container.innerHTML = `
    <div class="engagement-dashboard">
      <h3>Your Focus Health</h3>

      <!-- Overall Score -->
      <div class="score-card">
        <div class="score-circle" data-score="${health.score}" data-color="${health.tier.color}">
          <span class="score-value">${health.score}</span>
          <span class="score-label">${health.tier.name}</span>
        </div>
      </div>

      <!-- 5-Dimension Breakdown -->
      <div class="dimension-bars">
        ${Object.entries(health.breakdown).map(([key, value]) => `
          <div class="dimension-row">
            <span class="dimension-label">${key.charAt(0).toUpperCase() + key.slice(1)}</span>
            <div class="dimension-bar">
              <div class="dimension-fill" style="width: ${value}%; background: ${this.barColor(value)};"></div>
            </div>
            <span class="dimension-value">${value}</span>
          </div>
        `).join('')}
      </div>

      <!-- Power User Progress -->
      <div class="power-section">
        <h4>Power User Status: ${powerStatus.tier.name}</h4>
        ${powerStatus.nextTierProgress.next ? `
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${powerStatus.nextTierProgress.progress}%;"></div>
          </div>
          <p class="progress-text">${powerStatus.nextTierProgress.pointsNeeded} points to ${powerStatus.nextTierProgress.next}</p>
        ` : '<p class="max-tier">You\'ve reached the highest tier!</p>'}
      </div>

      <!-- Recommendations -->
      <div class="recommendations">
        <h4>Suggestions</h4>
        ${health.recommendations.map(rec => `
          <div class="rec-card">
            <span class="rec-dimension">${rec.dimension}</span>
            <p>${rec.suggestion}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
```

---

## 3. Storage Schema

All churn detection and engagement data lives in `chrome.storage.local`:

```javascript
// Complete storage schema for churn prevention (Agent 1 components)
const CHURN_STORAGE_SCHEMA = {
  // Daily focus session aggregates (90-day rolling window)
  focusSessionHistory: [
    { date: '2026-02-11', sessionsCompleted: 3, totalMinutes: 75, pomodoroStarted: 4, pomodoroCompleted: 3, sitesBlocked: 12, bypassAttempts: 1 }
  ],

  // Focus Score daily snapshots (90-day rolling window)
  focusScoreHistory: [
    { date: '2026-02-11', score: 78 }
  ],

  // Streak records
  currentStreak: 14,
  streakHistory: [
    { startDate: '2026-01-15', endDate: '2026-01-28', length: 14, broken: true },
    { startDate: '2026-01-29', endDate: null, length: 14, broken: false }
  ],

  // Blocklist size tracking (90 entries max)
  blocklistHistory: [
    { date: '2026-02-11', count: 15 }
  ],

  // Nuclear Mode usage tracking
  nuclearModeHistory: [
    { date: '2026-02-11', used: true }
  ],

  // Block page bypass attempts
  bypassAttempts: [
    { date: '2026-02-11', count: 2 }
  ],

  // Popup interaction tracking (30 entries max)
  popupOpenHistory: [
    { date: '2026-02-11', opened: true, timerStarted: true }
  ],

  // Pro feature last-used timestamps
  proFeatureUsage: {
    nuclearMode: '2026-02-10T14:30:00Z',
    advancedStats: '2026-02-08T09:00:00Z',
    customTheme: '2026-01-20T12:00:00Z',
    importExport: '2026-01-15T10:00:00Z'
  },

  // Feature usage map (all features, not just Pro)
  featureUsageMap: {
    site_blocking: { firstUsed: '2026-01-01', lastUsed: '2026-02-11', totalUses: 150 },
    pomodoro_timer: { firstUsed: '2026-01-02', lastUsed: '2026-02-11', totalUses: 89 }
  },

  // Settings reset history (timestamps)
  settingsResetHistory: [],

  // Latest churn analysis result
  churnAnalysis: {
    isAtRisk: false,
    riskScore: 22,
    tier: { name: 'Engaged', color: '#3b82f6', action: 'nurture' },
    signals: [],
    analyzedAt: '2026-02-11T00:00:00Z'
  },

  // Latest health score
  healthScore: {
    score: 75,
    breakdown: { frequency: 85, depth: 60, recency: 100, consistency: 65, growth: 70 },
    tier: { name: 'Focused', color: '#3b82f6' },
    calculatedAt: '2026-02-11T00:00:00Z'
  }
};
```

**Storage Budget:** Estimated ~50-100KB for 90 days of data, well within `chrome.storage.local`'s 10MB limit.

---

## 4. Service Worker Integration

```javascript
// service-worker.js additions for churn prevention

// === Alarm Setup ===
chrome.runtime.onInstalled.addListener(() => {
  // Daily churn analysis at midnight
  chrome.alarms.create('dailyChurnAnalysis', { periodInMinutes: 1440 });

  // Weekly health score recalculation
  chrome.alarms.create('weeklyHealthScore', { periodInMinutes: 10080 });
});

// === Alarm Handlers ===
chrome.alarms.onAlarm.addListener(async (alarm) => {
  switch (alarm.name) {
    case 'dailyChurnAnalysis': {
      const detector = new FocusChurnDetector();
      const analysis = await detector.analyzeChurnRisk();
      await chrome.storage.local.set({ churnAnalysis: analysis });

      if (analysis.riskScore >= 35) {
        await triggerRetentionAction(analysis);
      }
      break;
    }
    case 'weeklyHealthScore': {
      const calculator = new FocusHealthScoreCalculator();
      const health = await calculator.calculate();
      await chrome.storage.local.set({ healthScore: health });
      break;
    }
  }
});

// === Message Handlers (from popup/options) ===
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'POPUP_OPENED':
      trackPopupOpen(false);
      break;
    case 'TIMER_STARTED':
      trackPopupOpen(true);
      trackFocusUsage({ type: 'pomodoro_started' });
      break;
    case 'SESSION_COMPLETE':
      trackFocusUsage({ type: 'session_complete', durationMinutes: message.duration });
      break;
    case 'POMODORO_COMPLETE':
      trackFocusUsage({ type: 'pomodoro_completed' });
      break;
    case 'SITE_BLOCKED':
      trackFocusUsage({ type: 'site_blocked' });
      break;
    case 'BYPASS_ATTEMPT':
      trackFocusUsage({ type: 'bypass_attempt' });
      break;
    case 'GET_HEALTH_SCORE':
      (async () => {
        const { healthScore } = await chrome.storage.local.get('healthScore');
        sendResponse(healthScore);
      })();
      return true; // Keep channel open for async response
    case 'GET_CHURN_ANALYSIS':
      (async () => {
        const { churnAnalysis } = await chrome.storage.local.get('churnAnalysis');
        sendResponse(churnAnalysis);
      })();
      return true;
  }
});
```

---

## 5. Implementation Priority

| Priority | Component | Complexity | Effort |
|----------|-----------|------------|--------|
| P0 | Usage tracking functions (`trackFocusUsage`, etc.) | Low | 4 hours |
| P0 | Storage schema setup | Low | 2 hours |
| P0 | FocusChurnDetector class | Medium | 8 hours |
| P0 | Daily alarm integration in service worker | Low | 2 hours |
| P1 | FocusRiskScoringModel | Medium | 6 hours |
| P1 | FocusHealthScoreCalculator | Medium | 6 hours |
| P1 | Popup health widget | Low | 3 hours |
| P2 | FocusPowerUserIdentifier | Medium | 4 hours |
| P2 | Options page engagement dashboard | Medium | 6 hours |
| P2 | Power user rewards system | Low | 4 hours |

**Total estimated effort: 45 hours (≈6 working days)**

---

*Agent 1 — Churn Detection & Engagement Scoring — Complete*
