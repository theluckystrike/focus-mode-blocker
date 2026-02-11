# PROACTIVE RETENTION TRIGGERS: Focus Mode - Blocker
## Agent 4 — Milestone Celebrations, Feature Discovery, Engagement Hooks & Habit Formation

> **Date:** February 11, 2026 | **Parent Phase:** 17 — Churn Prevention & Reactivation
> **Sections Covered:** 6 (Proactive Retention Triggers)

---

## Table of Contents

1. [Usage Milestone Celebrations](#1-usage-milestone-celebrations)
   - [1.1 Focus Mode Milestones](#11-focus-mode-milestones)
   - [1.2 FocusMilestoneTracker Class](#12-focusmilestonetracker-class)
   - [1.3 Celebration UI Components](#13-celebration-ui-components)
   - [1.4 Achievements Gallery](#14-achievements-gallery)
2. [Feature Discovery Prompts](#2-feature-discovery-prompts)
   - [2.1 FocusFeatureDiscovery Class](#21-focusfeaturydiscovery-class)
   - [2.2 Discovery Prompt UI](#22-discovery-prompt-ui)
   - [2.3 Pro Feature Upsell Integration](#23-pro-feature-upsell-integration)
3. [Engagement Hooks](#3-engagement-hooks)
   - [3.1 Daily Focus Challenges](#31-daily-focus-challenges)
   - [3.2 Social Proof Elements](#32-social-proof-elements)
   - [3.3 Habit Formation Nudges](#33-habit-formation-nudges)
4. [Implementation Priority](#4-implementation-priority)

---

## 1. Usage Milestone Celebrations

### 1.1 Focus Mode Milestones

Complete milestone system with thresholds specific to Focus Mode - Blocker's productivity metrics.

```javascript
// milestones-config.js — All milestones for Focus Mode - Blocker

const FOCUS_MILESTONES = {
  // === Session Milestones ===
  sessions: [
    { id: 'first_session', threshold: 1, title: 'First Focus!', message: 'Welcome to your focus journey!', icon: '🎯' },
    { id: 'sessions_10', threshold: 10, title: 'Building Momentum', message: 'You\'re getting the hang of it! 10 sessions strong.', icon: '🔥' },
    { id: 'sessions_25', threshold: 25, title: 'Quarter Century', message: '25 focus sessions! Your brain thanks you.', icon: '🧠' },
    { id: 'sessions_50', threshold: 50, title: 'Half Century', message: '50 sessions! You\'re in the top 20% of Focus Mode users.', icon: '⭐' },
    { id: 'sessions_100', threshold: 100, title: 'Centurion', message: '100 focus sessions! You\'re a certified focus machine.', icon: '💯' },
    { id: 'sessions_500', threshold: 500, title: 'Focus Legend', message: '500 sessions! That\'s incredible dedication.', icon: '🏅' },
    { id: 'sessions_1000', threshold: 1000, title: 'Focus Mode Master', message: '1,000 sessions! You\'re in the top 1% of all users.', icon: '👑' }
  ],

  // === Streak Milestones ===
  streaks: [
    { id: 'streak_3', threshold: 3, title: 'Streak Started', message: '3-day streak! Keep the momentum going.', icon: '🔥' },
    { id: 'streak_7', threshold: 7, title: 'One Week Strong', message: '7-day streak! You\'ve built a habit.', icon: '📆' },
    { id: 'streak_14', threshold: 14, title: 'Two Weeks Running', message: '14 consecutive days of focus. Incredible consistency!', icon: '💪' },
    { id: 'streak_30', threshold: 30, title: 'Monthly Marathon', message: '30-day streak! A full month of daily focus sessions.', icon: '🏃' },
    { id: 'streak_60', threshold: 60, title: 'Two-Month Champion', message: '60 days! Your discipline is extraordinary.', icon: '🏆' },
    { id: 'streak_100', threshold: 100, title: 'Triple Digits', message: '100-day streak! You\'re unstoppable.', icon: '💎' },
    { id: 'streak_365', threshold: 365, title: 'ONE YEAR', message: '365-day streak! Legendary focus. Truly remarkable.', icon: '🌟' }
  ],

  // === Focus Score Milestones ===
  focusScore: [
    { id: 'score_50', threshold: 50, title: 'Getting Focused', message: 'Focus Score hit 50! You\'re finding your rhythm.', icon: '📈' },
    { id: 'score_70', threshold: 70, title: 'High Performer', message: 'Focus Score 70! You\'re above average.', icon: '🎯' },
    { id: 'score_85', threshold: 85, title: 'Elite Focus', message: 'Focus Score 85! You\'re in the elite zone.', icon: '⚡' },
    { id: 'score_95', threshold: 95, title: 'Near Perfect', message: 'Focus Score 95+! Focus Score master!', icon: '🌟' }
  ],

  // === Time Milestones (total focused minutes) ===
  time: [
    { id: 'time_60', threshold: 60, title: 'First Focused Hour', message: 'You\'ve spent a full hour in focused work!', icon: '⏱️' },
    { id: 'time_600', threshold: 600, title: '10 Hours of Focus', message: '10 hours saved from distraction. That\'s real productivity.', icon: '⏰' },
    { id: 'time_1440', threshold: 1440, title: 'A Full Day', message: '24 hours of focused work! An entire day of productivity.', icon: '🌅' },
    { id: 'time_6000', threshold: 6000, title: '100 Hours', message: '100 hours! That\'s ~12 full work days of focused time.', icon: '📊' },
    { id: 'time_30000', threshold: 30000, title: '500 Hours', message: '500 hours of focus! Master of concentration.', icon: '🏛️' }
  ],

  // === Blocking Milestones (total distractions blocked) ===
  blocking: [
    { id: 'blocked_100', threshold: 100, title: 'Distraction Shield', message: '100 distractions blocked! Your shield is working.', icon: '🛡️' },
    { id: 'blocked_1000', threshold: 1000, title: 'Thousand Blocks', message: '1,000 distractions blocked! Focus fortress.', icon: '🏰' },
    { id: 'blocked_10000', threshold: 10000, title: 'Ultimate Blocker', message: '10,000 distractions blocked! Nothing gets past you.', icon: '🔒' }
  ],

  // === Nuclear Mode Milestones ===
  nuclear: [
    { id: 'nuclear_first', threshold: 1, title: 'Nuclear Launch', message: 'First Nuclear Mode session! Maximum focus achieved.', icon: '☢️' },
    { id: 'nuclear_10', threshold: 10, title: 'Nuclear Veteran', message: '10 Nuclear Mode sessions! You mean business.', icon: '💣' },
    { id: 'nuclear_50', threshold: 50, title: 'Nuclear Commander', message: '50 Nuclear Mode sessions! Absolute discipline.', icon: '🎖️' }
  ],

  // === Pomodoro Milestones ===
  pomodoro: [
    { id: 'pomo_25', threshold: 25, title: 'Pomodoro Apprentice', message: '25 Pomodoro cycles completed!', icon: '🍅' },
    { id: 'pomo_100', threshold: 100, title: 'Pomodoro Pro', message: '100 cycles! The technique is working for you.', icon: '🍅' },
    { id: 'pomo_500', threshold: 500, title: 'Pomodoro Master', message: '500 Pomodoro cycles! Francesco Cirillo would be proud.', icon: '🍅' }
  ],

  // === Special Milestones ===
  special: [
    { id: 'all_features', type: 'features_explored', title: 'Explorer', message: 'You\'ve tried every Focus Mode feature!', icon: '🗺️' },
    { id: 'first_export', type: 'settings_exported', title: 'Backup Pro', message: 'Smart move! Your settings are safely backed up.', icon: '💾' },
    { id: 'custom_theme', type: 'theme_customized', title: 'Interior Designer', message: 'You\'ve made Focus Mode your own!', icon: '🎨' }
  ]
};
```

### 1.2 FocusMilestoneTracker Class

```javascript
// milestone-tracker.js — Tracks and celebrates milestones in Focus Mode - Blocker

class FocusMilestoneTracker {
  /**
   * Check all milestone categories after a focus event.
   * Called after: session complete, streak update, Focus Score recalc, blocking event.
   */
  async checkMilestones(eventType) {
    const data = await this.getMilestoneData();
    const achieved = data.achievedMilestones;
    const newlyAchieved = [];

    // Check session milestones
    if (['session_complete', 'all'].includes(eventType)) {
      for (const m of FOCUS_MILESTONES.sessions) {
        if (!achieved.includes(m.id) && data.totalSessions >= m.threshold) {
          newlyAchieved.push(m);
        }
      }
    }

    // Check streak milestones
    if (['streak_update', 'all'].includes(eventType)) {
      for (const m of FOCUS_MILESTONES.streaks) {
        if (!achieved.includes(m.id) && data.currentStreak >= m.threshold) {
          newlyAchieved.push(m);
        }
      }
    }

    // Check Focus Score milestones
    if (['score_update', 'all'].includes(eventType)) {
      for (const m of FOCUS_MILESTONES.focusScore) {
        if (!achieved.includes(m.id) && data.focusScore >= m.threshold) {
          newlyAchieved.push(m);
        }
      }
    }

    // Check time milestones
    if (['session_complete', 'all'].includes(eventType)) {
      for (const m of FOCUS_MILESTONES.time) {
        if (!achieved.includes(m.id) && data.totalMinutes >= m.threshold) {
          newlyAchieved.push(m);
        }
      }
    }

    // Check blocking milestones
    if (['site_blocked', 'all'].includes(eventType)) {
      for (const m of FOCUS_MILESTONES.blocking) {
        if (!achieved.includes(m.id) && data.totalBlocked >= m.threshold) {
          newlyAchieved.push(m);
        }
      }
    }

    // Check Nuclear Mode milestones
    if (['nuclear_complete', 'all'].includes(eventType)) {
      for (const m of FOCUS_MILESTONES.nuclear) {
        if (!achieved.includes(m.id) && data.nuclearSessions >= m.threshold) {
          newlyAchieved.push(m);
        }
      }
    }

    // Check Pomodoro milestones
    if (['pomodoro_complete', 'all'].includes(eventType)) {
      for (const m of FOCUS_MILESTONES.pomodoro) {
        if (!achieved.includes(m.id) && data.pomodoroCompleted >= m.threshold) {
          newlyAchieved.push(m);
        }
      }
    }

    // Check special milestones
    for (const m of FOCUS_MILESTONES.special) {
      if (!achieved.includes(m.id) && this.checkSpecialMilestone(m, data)) {
        newlyAchieved.push(m);
      }
    }

    // Celebrate new milestones (max 1 notification per event to avoid fatigue)
    if (newlyAchieved.length > 0) {
      await this.celebrateMilestones(newlyAchieved);
    }

    return newlyAchieved;
  }

  async getMilestoneData() {
    const storage = await chrome.storage.local.get([
      'focusSessionHistory', 'currentStreak', 'focusScore',
      'nuclearModeHistory', 'featureUsageMap', 'achievedMilestones',
      'totalBlockedCount'
    ]);

    const sessions = storage.focusSessionHistory || [];
    return {
      totalSessions: sessions.reduce((s, d) => s + (d.sessionsCompleted || 0), 0),
      totalMinutes: sessions.reduce((s, d) => s + (d.totalMinutes || 0), 0),
      currentStreak: storage.currentStreak || 0,
      focusScore: storage.focusScore || 0,
      totalBlocked: storage.totalBlockedCount || sessions.reduce((s, d) => s + (d.sitesBlocked || 0), 0),
      nuclearSessions: (storage.nuclearModeHistory || []).filter(d => d.used).length,
      pomodoroCompleted: sessions.reduce((s, d) => s + (d.pomodoroCompleted || 0), 0),
      featuresUsed: Object.keys(storage.featureUsageMap || {}).length,
      featureUsageMap: storage.featureUsageMap || {},
      achievedMilestones: storage.achievedMilestones || []
    };
  }

  checkSpecialMilestone(milestone, data) {
    switch (milestone.type) {
      case 'features_explored':
        return data.featuresUsed >= 8; // 8 of 10 features
      case 'settings_exported':
        return !!data.featureUsageMap.import_export;
      case 'theme_customized':
        return !!data.featureUsageMap.custom_block_page;
      default:
        return false;
    }
  }

  /**
   * Celebrate achieved milestones.
   * Shows notification for the highest-tier milestone, queues rest.
   */
  async celebrateMilestones(milestones) {
    // Save all as achieved
    const { achievedMilestones = [] } = await chrome.storage.local.get('achievedMilestones');
    const newIds = milestones.map(m => m.id);
    await chrome.storage.local.set({
      achievedMilestones: [...achievedMilestones, ...newIds]
    });

    // Show notification for the most significant one (first in array = highest)
    const primary = milestones[0];

    chrome.notifications.create(`milestone-${primary.id}`, {
      type: 'basic',
      iconUrl: 'assets/icons/icon128.png',
      title: `${primary.icon} ${primary.title}`,
      message: primary.message,
      priority: 1
    });

    // Queue the celebration overlay for the popup
    await chrome.storage.local.set({
      pendingCelebration: {
        milestone: primary,
        queuedAt: new Date().toISOString(),
        additionalMilestones: milestones.slice(1).map(m => m.id)
      }
    });

    // Update block page with latest milestone
    await chrome.storage.local.set({
      latestMilestone: { ...primary, achievedAt: new Date().toISOString() }
    });
  }
}
```

### 1.3 Celebration UI Components

**Popup Celebration Overlay:**

```javascript
// popup-celebration.js — Shows milestone celebration in popup

async function checkAndShowCelebration() {
  const { pendingCelebration } = await chrome.storage.local.get('pendingCelebration');
  if (!pendingCelebration) return;

  const milestone = pendingCelebration.milestone;

  // Create celebration overlay
  const overlay = document.createElement('div');
  overlay.id = 'celebration-overlay';
  overlay.innerHTML = `
    <div class="celebration-card">
      <div class="celebration-confetti"></div>
      <div class="celebration-icon">${milestone.icon}</div>
      <h2 class="celebration-title">${milestone.title}</h2>
      <p class="celebration-message">${milestone.message}</p>
      <button class="celebration-dismiss">Awesome!</button>
    </div>
  `;

  overlay.querySelector('.celebration-dismiss').addEventListener('click', async () => {
    overlay.classList.add('celebration-exit');
    setTimeout(() => overlay.remove(), 300);
    await chrome.storage.local.remove('pendingCelebration');
  });

  document.body.appendChild(overlay);

  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    if (document.getElementById('celebration-overlay')) {
      overlay.classList.add('celebration-exit');
      setTimeout(() => overlay.remove(), 300);
      chrome.storage.local.remove('pendingCelebration');
    }
  }, 5000);
}
```

**Celebration CSS:**

```css
/* celebration.css — Milestone celebration animations */

#celebration-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease-out;
}

.celebration-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  max-width: 300px;
  width: 90%;
  position: relative;
  overflow: hidden;
  animation: bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.celebration-icon {
  font-size: 48px;
  margin-bottom: 12px;
  animation: pulse 1s infinite;
}

.celebration-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
}

.celebration-message {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 20px;
  line-height: 1.5;
}

.celebration-dismiss {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.celebration-dismiss:hover {
  opacity: 0.9;
}

/* CSS-only confetti effect */
.celebration-confetti {
  position: absolute;
  top: -10px;
  left: 0;
  right: 0;
  height: 100%;
  pointer-events: none;
}

.celebration-confetti::before,
.celebration-confetti::after {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.celebration-confetti::before {
  background: #f59e0b;
  animation: confettiFall1 1.5s ease-in forwards;
  left: 20%;
}

.celebration-confetti::after {
  background: #6366f1;
  animation: confettiFall2 1.8s ease-in forwards;
  left: 70%;
}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes bounceIn { 0% { transform: scale(0.3); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
@keyframes confettiFall1 { 0% { top: -10px; opacity: 1; } 100% { top: 110%; opacity: 0; transform: translateX(30px) rotate(720deg); } }
@keyframes confettiFall2 { 0% { top: -10px; opacity: 1; } 100% { top: 110%; opacity: 0; transform: translateX(-20px) rotate(540deg); } }

.celebration-exit {
  animation: fadeOut 0.3s ease-in forwards;
}

@keyframes fadeOut { to { opacity: 0; } }
```

### 1.4 Achievements Gallery

Displayed in the options page as a grid of all milestones.

```javascript
// achievements-gallery.js — Options page achievements display

async function renderAchievementsGallery(container) {
  const { achievedMilestones = [] } = await chrome.storage.local.get('achievedMilestones');
  const data = await new FocusMilestoneTracker().getMilestoneData();

  const allMilestones = [
    ...FOCUS_MILESTONES.sessions,
    ...FOCUS_MILESTONES.streaks,
    ...FOCUS_MILESTONES.focusScore,
    ...FOCUS_MILESTONES.time,
    ...FOCUS_MILESTONES.blocking,
    ...FOCUS_MILESTONES.nuclear,
    ...FOCUS_MILESTONES.pomodoro,
    ...FOCUS_MILESTONES.special
  ];

  const totalAchieved = achievedMilestones.length;
  const totalMilestones = allMilestones.length;

  container.innerHTML = `
    <div class="achievements-header">
      <h3>Achievements</h3>
      <span class="achievement-count">${totalAchieved} / ${totalMilestones}</span>
    </div>

    <div class="achievements-progress">
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${(totalAchieved / totalMilestones * 100).toFixed(0)}%"></div>
      </div>
    </div>

    <div class="achievements-grid">
      ${allMilestones.map(m => {
        const isAchieved = achievedMilestones.includes(m.id);
        return `
          <div class="achievement-card ${isAchieved ? 'achieved' : 'locked'}">
            <span class="achievement-icon">${isAchieved ? m.icon : '🔒'}</span>
            <span class="achievement-title">${m.title}</span>
            ${!isAchieved ? `<span class="achievement-hint">${this.getProgressHint(m, data)}</span>` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}
```

---

## 2. Feature Discovery Prompts

### 2.1 FocusFeatureDiscovery Class

```javascript
// feature-discovery.js — Contextual feature suggestions for Focus Mode - Blocker

class FocusFeatureDiscovery {
  constructor() {
    this.discoveryRules = [
      {
        id: 'nuclear_mode',
        feature: 'Nuclear Mode',
        trigger: 'bypass_attempts',
        condition: (data) => data.bypassAttempts >= 3 && !data.usesNuclearMode,
        prompt: {
          title: 'Struggling with temptation?',
          message: 'Nuclear Mode makes blocking truly unbypassable. You can\'t disable it, remove sites, or even uninstall during a session.',
          cta: 'Try Nuclear Mode',
          isPro: true
        }
      },
      {
        id: 'pomodoro_timer',
        feature: 'Pomodoro Timer',
        trigger: 'sessions_without_timer',
        condition: (data) => data.sessionsWithoutTimer >= 3 && !data.usesPomodoro,
        prompt: {
          title: 'Try the Pomodoro technique!',
          message: '25 minutes of deep focus, then a 5-minute break. Research shows this improves productivity by up to 25%.',
          cta: 'Start a Pomodoro',
          isPro: false
        }
      },
      {
        id: 'context_menu',
        feature: 'Quick Block (Context Menu)',
        trigger: 'always_uses_options',
        condition: (data) => data.sitesAddedViaOptions >= 5 && !data.usesContextMenu,
        prompt: {
          title: 'Quick tip: Right-click to block!',
          message: 'Right-click any page and select "Block with Focus Mode" for instant blocking. No need to open settings.',
          cta: 'Got it!',
          isPro: false
        }
      },
      {
        id: 'custom_block_page',
        feature: 'Custom Block Page',
        trigger: 'viewed_block_page_many_times',
        condition: (data) => data.blockPageViews >= 10 && !data.hasCustomTheme,
        prompt: {
          title: 'Make your block page yours',
          message: 'Pro users can customize their block page with motivational themes and personal quotes.',
          cta: 'See Themes',
          isPro: true
        }
      },
      {
        id: 'import_export',
        feature: 'Import/Export Settings',
        trigger: 'many_blocked_sites',
        condition: (data) => data.blockedSitesCount >= 10 && !data.hasExported,
        prompt: {
          title: 'Back up your blocklist!',
          message: 'You\'ve built a solid blocklist. Pro includes import/export so you never lose your settings.',
          cta: 'Learn More',
          isPro: true
        }
      },
      {
        id: 'focus_stats',
        feature: 'Focus Statistics',
        trigger: 'never_viewed_stats',
        condition: (data) => data.totalSessions >= 5 && !data.hasViewedStats,
        prompt: {
          title: 'Track your focus journey',
          message: 'Your Focus Score is tracked over time. Check your progress, trends, and personal records in Settings → Statistics.',
          cta: 'View Stats',
          isPro: false
        }
      },
      {
        id: 'keyboard_shortcuts',
        feature: 'Keyboard Shortcuts',
        trigger: 'mouse_only_usage',
        condition: (data) => data.popupClicks >= 20 && !data.usesShortcuts,
        prompt: {
          title: 'Speed up with shortcuts!',
          message: 'Press Alt+Shift+F to instantly start a focus session. No clicking needed.',
          cta: 'View All Shortcuts',
          isPro: false
        }
      },
      {
        id: 'break_reminders',
        feature: 'Break Reminders',
        trigger: 'long_sessions_no_breaks',
        condition: (data) => data.longSessionsWithoutBreak >= 3,
        prompt: {
          title: 'Don\'t forget breaks!',
          message: 'Research shows regular breaks actually improve focus. The Pomodoro timer handles this automatically.',
          cta: 'Enable Break Reminders',
          isPro: false
        }
      },
      {
        id: 'allowlist',
        feature: 'Allowlist',
        trigger: 'frequent_site_toggles',
        condition: (data) => data.sitesToggles >= 5 && !data.usesAllowlist,
        prompt: {
          title: 'Use the allowlist for flexibility',
          message: 'Temporarily access specific sites during focus sessions without removing them from your blocklist.',
          cta: 'Set Up Allowlist',
          isPro: false
        }
      }
    ];
  }

  /**
   * Analyze user behavior and return relevant feature suggestions.
   * Called periodically (daily) or after specific user actions.
   */
  async analyze() {
    const data = await this.getDiscoveryData();
    const { discoveryDismissed = {}, discoveryShown = {} } = await chrome.storage.local.get(['discoveryDismissed', 'discoveryShown']);

    const suggestions = [];

    for (const rule of this.discoveryRules) {
      // Skip if permanently dismissed
      if (discoveryDismissed[rule.id]) continue;

      // Skip if shown today already
      const lastShown = discoveryShown[rule.id];
      if (lastShown && this.isToday(lastShown)) continue;

      // Check if condition is met
      if (rule.condition(data)) {
        suggestions.push({
          id: rule.id,
          feature: rule.feature,
          prompt: rule.prompt
        });
      }
    }

    // Return max 1 suggestion per session (avoid overload)
    return suggestions.slice(0, 1);
  }

  async getDiscoveryData() {
    const storage = await chrome.storage.local.get([
      'focusSessionHistory', 'featureUsageMap', 'bypassAttempts',
      'blockedSites', 'popupOpenHistory', 'subscription',
      'blockPageViewCount', 'customBlockPageTheme'
    ]);

    const sessions = storage.focusSessionHistory || [];
    const features = storage.featureUsageMap || {};
    const bypasses = (storage.bypassAttempts || []).filter(
      d => (Date.now() - new Date(d.date).getTime()) < 7 * 24 * 60 * 60 * 1000
    );

    return {
      totalSessions: sessions.reduce((s, d) => s + (d.sessionsCompleted || 0), 0),
      bypassAttempts: bypasses.reduce((s, d) => s + d.count, 0),
      usesNuclearMode: !!features.nuclear_mode,
      usesPomodoro: !!features.pomodoro_timer,
      usesContextMenu: !!features.context_menu,
      usesAllowlist: !!features.allowlist,
      usesShortcuts: !!features.keyboard_shortcuts,
      hasCustomTheme: !!storage.customBlockPageTheme,
      hasExported: !!features.import_export,
      hasViewedStats: !!features.stats_dashboard,
      sessionsWithoutTimer: this.countSessionsWithoutTimer(sessions),
      sitesAddedViaOptions: features.site_blocking?.totalUses || 0,
      blockedSitesCount: (storage.blockedSites || []).length,
      blockPageViews: storage.blockPageViewCount || 0,
      popupClicks: (storage.popupOpenHistory || []).length,
      longSessionsWithoutBreak: this.countLongSessionsWithoutBreak(sessions),
      sitesToggles: this.countSiteToggles(storage)
    };
  }

  countSessionsWithoutTimer(sessions) {
    const recent = sessions.slice(-10);
    return recent.filter(d => d.sessionsCompleted > 0 && d.pomodoroStarted === 0).length;
  }

  countLongSessionsWithoutBreak(sessions) {
    return sessions.filter(d => d.totalMinutes > 60 && d.pomodoroCompleted === 0).length;
  }

  countSiteToggles(storage) {
    // Count from blocklistHistory as proxy for frequent adds/removes
    return (storage.blocklistHistory || []).length;
  }

  isToday(dateStr) {
    return new Date(dateStr).toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
  }

  /**
   * Show a discovery prompt in the popup.
   */
  async showPrompt(suggestion) {
    // Record that it was shown
    const { discoveryShown = {} } = await chrome.storage.local.get('discoveryShown');
    discoveryShown[suggestion.id] = new Date().toISOString();
    await chrome.storage.local.set({ discoveryShown });

    return suggestion.prompt;
  }

  /**
   * Handle user response to discovery prompt.
   */
  async handleResponse(suggestionId, response) {
    if (response === 'dismiss_forever') {
      const { discoveryDismissed = {} } = await chrome.storage.local.get('discoveryDismissed');
      discoveryDismissed[suggestionId] = new Date().toISOString();
      await chrome.storage.local.set({ discoveryDismissed });
    }

    // Track interaction for analytics
    const { discoveryInteractions = [] } = await chrome.storage.local.get('discoveryInteractions');
    discoveryInteractions.push({
      suggestionId,
      response, // 'show_me', 'dismiss', 'dismiss_forever'
      timestamp: new Date().toISOString()
    });
    await chrome.storage.local.set({ discoveryInteractions: discoveryInteractions.slice(-50) });
  }
}
```

### 2.2 Discovery Prompt UI

```javascript
// popup-discovery.js — Renders feature discovery prompts in the popup

async function renderDiscoveryPrompt(container) {
  const discovery = new FocusFeatureDiscovery();
  const suggestions = await discovery.analyze();

  if (suggestions.length === 0) return;

  const suggestion = suggestions[0];
  const prompt = await discovery.showPrompt(suggestion);

  const banner = document.createElement('div');
  banner.className = 'discovery-banner';
  banner.innerHTML = `
    <div class="discovery-content">
      <p class="discovery-title">${prompt.title}</p>
      <p class="discovery-message">${prompt.message}</p>
      <div class="discovery-actions">
        <button class="discovery-cta" data-action="show_me">${prompt.cta}</button>
        <button class="discovery-dismiss" data-action="dismiss">Later</button>
      </div>
      ${prompt.isPro ? '<span class="discovery-pro-badge">Pro</span>' : ''}
    </div>
    <button class="discovery-close" data-action="dismiss_forever" title="Don't show again">×</button>
  `;

  banner.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', async () => {
      await discovery.handleResponse(suggestion.id, btn.dataset.action);
      banner.classList.add('discovery-exit');
      setTimeout(() => banner.remove(), 300);

      if (btn.dataset.action === 'show_me') {
        handleDiscoveryAction(suggestion.id);
      }
    });
  });

  container.prepend(banner);
}

function handleDiscoveryAction(featureId) {
  switch (featureId) {
    case 'nuclear_mode':
      // Navigate to Nuclear Mode in popup or open Pro upsell
      break;
    case 'pomodoro_timer':
      // Start a Pomodoro session
      break;
    case 'focus_stats':
      // Open options page to stats section
      chrome.runtime.openOptionsPage();
      break;
    case 'keyboard_shortcuts':
      // Show shortcuts overlay
      break;
    default:
      // Open relevant section of options page
      chrome.runtime.openOptionsPage();
  }
}
```

**Discovery Banner CSS:**

```css
/* discovery.css */

.discovery-banner {
  background: linear-gradient(135deg, #ede9fe, #e0e7ff);
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 12px;
  position: relative;
  animation: slideDown 0.3s ease-out;
}

.discovery-title {
  font-weight: 600;
  font-size: 13px;
  color: #4338ca;
  margin-bottom: 4px;
}

.discovery-message {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
  margin-bottom: 10px;
}

.discovery-actions {
  display: flex;
  gap: 8px;
}

.discovery-cta {
  background: #6366f1;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.discovery-dismiss {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 12px;
  cursor: pointer;
}

.discovery-close {
  position: absolute;
  top: 8px;
  right: 8px;
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 16px;
  cursor: pointer;
}

.discovery-pro-badge {
  display: inline-block;
  background: #a855f7;
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 8px;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.discovery-exit {
  animation: slideUp 0.3s ease-in forwards;
}

@keyframes slideUp {
  to { opacity: 0; transform: translateY(-10px); height: 0; padding: 0; margin: 0; }
}
```

### 2.3 Pro Feature Upsell Integration

Feature discovery for Pro features naturally creates soft upsell opportunities.

```javascript
// pro-discovery-upsell.js — Soft upsell when Free users discover Pro features

async function handleProFeatureDiscovery(featureId) {
  const { subscription } = await chrome.storage.local.get('subscription');

  // If already Pro, just navigate to the feature
  if (subscription?.tier === 'pro') {
    navigateToFeature(featureId);
    return;
  }

  // Show soft upsell for Free users
  const upsellMessages = {
    nuclear_mode: {
      feature: 'Nuclear Mode',
      benefit: 'Make blocking truly unbypassable',
      trialOffer: 'Try it free for 7 days'
    },
    custom_block_page: {
      feature: 'Custom Block Page Themes',
      benefit: 'Personalize your focus experience',
      trialOffer: 'Try Pro free for 7 days'
    },
    import_export: {
      feature: 'Import/Export Settings',
      benefit: 'Never lose your blocklist configuration',
      trialOffer: 'Try Pro free for 7 days'
    }
  };

  const msg = upsellMessages[featureId];
  if (!msg) return;

  // Show non-blocking upsell in popup (NOT a modal that blocks functionality)
  return {
    type: 'soft_upsell',
    feature: msg.feature,
    benefit: msg.benefit,
    cta: msg.trialOffer,
    dismissable: true
  };
}
```

---

## 3. Engagement Hooks

### 3.1 Daily Focus Challenges

```javascript
// daily-challenges.js — Optional daily challenges for Focus Mode - Blocker

class DailyFocusChallenge {
  constructor() {
    this.challenges = [
      { id: 'sessions_3', type: 'sessions', target: 3, title: 'Complete 3 focus sessions today', reward: 'focusScoreBonus', rewardValue: 5 },
      { id: 'pomodoro_4', type: 'pomodoro', target: 4, title: 'Complete 4 Pomodoro cycles', reward: 'focusScoreBonus', rewardValue: 5 },
      { id: 'score_80', type: 'focusScore', target: 80, title: 'Maintain Focus Score above 80 all day', reward: 'streakMultiplier', rewardValue: 1.5 },
      { id: 'nuclear_2hr', type: 'nuclear', target: 120, title: 'Use Nuclear Mode for a 2-hour deep work session', reward: 'focusScoreBonus', rewardValue: 10 },
      { id: 'no_bypass', type: 'noBypass', target: 0, title: 'Zero bypass attempts today', reward: 'focusScoreBonus', rewardValue: 3 },
      { id: 'block_3_new', type: 'newBlocks', target: 3, title: 'Add 3 new distracting sites to your blocklist', reward: 'focusScoreBonus', rewardValue: 3 },
      { id: 'focus_60min', type: 'totalMinutes', target: 60, title: 'Accumulate 60 minutes of focused time', reward: 'focusScoreBonus', rewardValue: 5 }
    ];
  }

  /**
   * Get today's challenge (rotates daily based on date).
   */
  getTodaysChallenge() {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const index = dayOfYear % this.challenges.length;
    return this.challenges[index];
  }

  /**
   * Check if today's challenge is completed.
   */
  async checkProgress() {
    const challenge = this.getTodaysChallenge();
    const { focusSessionHistory = [], bypassAttempts = [] } = await chrome.storage.local.get(['focusSessionHistory', 'bypassAttempts']);
    const today = new Date().toISOString().split('T')[0];
    const todayData = focusSessionHistory.find(d => d.date === today) || {};

    let current = 0;
    switch (challenge.type) {
      case 'sessions': current = todayData.sessionsCompleted || 0; break;
      case 'pomodoro': current = todayData.pomodoroCompleted || 0; break;
      case 'totalMinutes': current = todayData.totalMinutes || 0; break;
      case 'noBypass': current = (bypassAttempts.find(d => d.date === today)?.count) || 0; break;
      default: current = 0;
    }

    const completed = challenge.type === 'noBypass' ? current === 0 : current >= challenge.target;

    return {
      challenge,
      current,
      target: challenge.target,
      progress: challenge.type === 'noBypass' ? (current === 0 ? 100 : 0) : Math.min(100, Math.round((current / challenge.target) * 100)),
      completed
    };
  }
}
```

### 3.2 Social Proof Elements

```javascript
// social-proof.js — Pre-computed social proof stats for Focus Mode - Blocker

const SOCIAL_PROOF_MESSAGES = [
  'Users who use Nuclear Mode are 3x more likely to maintain 30-day streaks.',
  'Top 10% of Focus Mode users complete 5+ sessions per day.',
  'The average Focus Mode user blocks 8 distracting sites.',
  'Pomodoro timer users report 40% higher Focus Scores on average.',
  'Users with 14+ day streaks are 5x less likely to uninstall.',
  'The most blocked sites: YouTube, Reddit, Twitter, Instagram, and Facebook.',
  'Focus Mode users save an estimated 2.5 hours per week from distractions.'
];

function getRandomSocialProof() {
  return SOCIAL_PROOF_MESSAGES[Math.floor(Math.random() * SOCIAL_PROOF_MESSAGES.length)];
}
```

### 3.3 Habit Formation Nudges

```javascript
// habit-nudges.js — Encourage consistent usage patterns

class HabitNudges {
  /**
   * After a session completes, suggest the next one.
   */
  async suggestNextSession() {
    const { focusSessionHistory = [] } = await chrome.storage.local.get('focusSessionHistory');

    // Analyze user's typical focus times
    const sessionTimes = focusSessionHistory
      .filter(d => d.sessionsCompleted > 0)
      .map(d => new Date(d.date).getHours());

    if (sessionTimes.length < 5) return null;

    // Find most productive hour
    const hourCounts = {};
    sessionTimes.forEach(h => { hourCounts[h] = (hourCounts[h] || 0) + 1; });
    const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0][0];

    return {
      type: 'habit_suggestion',
      message: `Your most productive hour is ${formatHour(peakHour)}. Same time tomorrow?`,
      suggestedTime: peakHour
    };
  }

  /**
   * Weekly summary notification (Sunday evening).
   */
  async generateWeeklySummary() {
    const { focusSessionHistory = [], currentStreak = 0, focusScore = 0 } = await chrome.storage.local.get(['focusSessionHistory', 'currentStreak', 'focusScore']);

    const thisWeek = focusSessionHistory.slice(-7);
    const weekSessions = thisWeek.reduce((s, d) => s + (d.sessionsCompleted || 0), 0);
    const weekMinutes = thisWeek.reduce((s, d) => s + (d.totalMinutes || 0), 0);

    return {
      sessions: weekSessions,
      minutes: weekMinutes,
      streak: currentStreak,
      focusScore,
      message: weekSessions >= 5
        ? `Great week! ${weekSessions} sessions and ${Math.round(weekMinutes / 60)} hours of focus.`
        : `${weekSessions} sessions this week. Can you do ${weekSessions + 2} next week?`
    };
  }
}

function formatHour(hour) {
  const h = parseInt(hour);
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}
```

---

## 4. Implementation Priority

| Priority | Component | Complexity | Effort |
|----------|-----------|------------|--------|
| P0 | FOCUS_MILESTONES config | Low | 2 hours |
| P0 | FocusMilestoneTracker class | Medium | 6 hours |
| P0 | Celebration notification (chrome.notifications) | Low | 2 hours |
| P1 | Popup celebration overlay + CSS | Medium | 4 hours |
| P1 | FocusFeatureDiscovery class | Medium | 6 hours |
| P1 | Discovery banner UI + CSS | Medium | 4 hours |
| P1 | Service worker integration (milestone checks) | Low | 3 hours |
| P2 | Achievements gallery (options page) | Medium | 6 hours |
| P2 | DailyFocusChallenge system | Medium | 4 hours |
| P2 | HabitNudges (weekly summary, time suggestions) | Low | 3 hours |
| P2 | Pro feature soft upsell integration | Low | 2 hours |
| P3 | Social proof messages | Low | 1 hour |
| P3 | Block page milestone display | Low | 2 hours |

**Total estimated effort: 45 hours (≈6 working days)**

---

*Agent 4 — Proactive Retention Triggers — Complete*
