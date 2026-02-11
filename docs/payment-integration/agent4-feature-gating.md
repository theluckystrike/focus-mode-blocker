# Feature Gating & License UI -- Focus Mode - Blocker

> **Phase 09 -- Agent 4 Deliverable**
> Defines the complete feature gate architecture, registry, runtime checks, UI components, license key input flow, and graceful degradation strategy for the Zovo payment integration.

---

## Table of Contents

1. [Feature Gate Architecture](#1-feature-gate-architecture)
2. [Feature Gate Functions (`feature-gate.js`)](#2-feature-gate-functions)
3. [Feature Gate UI Components](#3-feature-gate-ui-components)
4. [License Key Input UI](#4-license-key-input-ui)
5. [License Settings Section](#5-license-settings-section)
6. [Graceful Degradation (Pro to Free Downgrade)](#6-graceful-degradation-pro-to-free-downgrade)
7. [Implementation Priority](#7-implementation-priority)
8. [Integration Guide](#8-integration-guide)

---

## 1. Feature Gate Architecture

### 1.1 Gate Type Definitions

Every feature in the extension falls into exactly one gate type. The gate type determines what happens when a free-tier user attempts to access the feature.

| Type | Behavior | UX Result | Example Features |
|------|----------|-----------|------------------|
| **No Gate** | Always available, zero checks at runtime | Feature works identically for all tiers | `basic_pomodoro`, `quick_focus`, `keyboard_shortcut` |
| **Soft Gate (Cap)** | Works normally up to a numeric limit; upon reaching the limit the next action shows an upgrade prompt | User sees a counter (e.g. "8/10 sites") and gets a modal at the cap | `manual_blocklist` (10), `pre_built_lists` (2), `schedule_blocking` (1) |
| **Hard Gate (Lock)** | Feature is completely locked; the UI element is visible but non-interactive, overlaid with a lock icon | Click triggers the upgrade modal with a feature-specific value proposition | `custom_block_page`, `password_protection`, `cross_device_sync` |
| **Blur Gate** | Content is rendered but obscured with a CSS blur filter; a "Unlock with Pro" banner sits on top | User can see the shape/layout of the data but cannot read it | `weekly_reports`, `focus_score_breakdown` |
| **Preview Gate** | Feature UI is fully visible and explorable but all interactive controls are disabled | User can browse a sound library grid or theme picker but cannot select | `sound_mixing` (library visible, play locked) |

### 1.2 Tier Hierarchy

```
team > pro > limited > free
```

A `team` license unlocks everything. A `pro` license unlocks everything except team-only features. The `limited` tier represents features that are partially available on the free plan but have caps. The `free` tier is always available with no restrictions.

### 1.3 Feature Registry

The feature registry is the single source of truth for all gating decisions. It lives at `src/shared/feature-gate.js` and is imported by both the popup, options page, background service worker, and content scripts.

```javascript
// src/shared/feature-gate.js

const FEATURE_REGISTRY = {
  // =========================================================================
  // FREE (No Gate) -- 15 features, always available
  // =========================================================================
  manual_blocklist: {
    tier: 'free',
    limit: 10,
    limitType: 'count',
    label: 'Blocked Sites',
    unit: 'sites',
    description: 'Manually block distracting websites'
  },
  basic_pomodoro: {
    tier: 'free',
    gate: 'none',
    label: 'Pomodoro Timer',
    description: '25/5 minute focus/break cycles'
  },
  background_timer: {
    tier: 'free',
    gate: 'none',
    label: 'Background Timer',
    description: 'Timer continues when popup is closed'
  },
  focus_score_number: {
    tier: 'free',
    gate: 'none',
    label: 'Focus Score',
    description: 'Simple numeric focus score (0-100)'
  },
  distraction_counter: {
    tier: 'free',
    gate: 'none',
    label: 'Distraction Counter',
    description: 'Count of blocked site visit attempts'
  },
  daily_focus_time: {
    tier: 'free',
    gate: 'none',
    label: 'Daily Focus Time',
    description: 'Total focus time tracked today'
  },
  quick_focus: {
    tier: 'free',
    gate: 'none',
    label: 'Quick Focus',
    description: 'One-click start a focus session'
  },
  keyboard_shortcut: {
    tier: 'free',
    gate: 'none',
    label: 'Keyboard Shortcut',
    description: 'Alt+Shift+F to toggle focus mode'
  },
  ambient_sounds: {
    tier: 'free',
    limit: 3,
    limitType: 'count',
    label: 'Ambient Sounds',
    unit: 'sounds',
    description: 'Background sounds during focus sessions'
  },
  notification_muting: {
    tier: 'free',
    gate: 'none',
    label: 'Notification Muting',
    description: 'Suppress browser notifications during focus'
  },
  browser_badge: {
    tier: 'free',
    gate: 'none',
    label: 'Browser Badge',
    description: 'Extension icon shows timer countdown'
  },
  focus_goals_daily: {
    tier: 'free',
    gate: 'none',
    label: 'Daily Focus Goals',
    description: 'Set a daily focus time target'
  },
  basic_session_history: {
    tier: 'free',
    limit: 7,
    limitType: 'days',
    label: 'Session History',
    unit: 'days',
    description: 'View past 7 days of session data'
  },
  streak_current: {
    tier: 'free',
    gate: 'none',
    label: 'Current Streak',
    description: 'See your current focus streak'
  },
  percentile_comparison: {
    tier: 'free',
    gate: 'none',
    label: 'Percentile Comparison',
    description: 'See how you compare to other users'
  },

  // =========================================================================
  // LIMITED FREE (Soft Gate / Cap) -- 12 features with free-tier limits
  // =========================================================================
  pre_built_lists: {
    tier: 'limited',
    limit: 2,
    limitType: 'count',
    label: 'Pre-built Block Lists',
    unit: 'lists',
    proFeature: 'unlimited_lists',
    description: 'Curated lists (Social Media, News, etc.)',
    upgradeMessage: 'Unlock all 15+ pre-built block lists with Pro'
  },
  nuclear_option: {
    tier: 'limited',
    limit: 60,
    limitType: 'minutes',
    label: 'Nuclear Mode',
    unit: 'minutes',
    proFeature: 'extended_nuclear',
    description: 'Unbreakable blocking period',
    upgradeMessage: 'Extend Nuclear Mode up to 24 hours with Pro'
  },
  schedule_blocking: {
    tier: 'limited',
    limit: 1,
    limitType: 'count',
    label: 'Scheduled Blocking',
    unit: 'schedules',
    proFeature: 'unlimited_schedules',
    description: 'Automatically block sites on a schedule',
    upgradeMessage: 'Create unlimited blocking schedules with Pro'
  },
  category_blocking: {
    tier: 'limited',
    limit: 2,
    limitType: 'count',
    label: 'Category Blocking',
    unit: 'categories',
    proFeature: 'all_categories',
    description: 'Block entire categories of sites',
    upgradeMessage: 'Block all site categories with Pro'
  },
  streak_history: {
    tier: 'limited',
    gate: 'soft',
    label: 'Streak History',
    proFeature: 'full_streak',
    description: 'View past streaks and recovery options',
    upgradeMessage: 'Access your full streak history and recovery with Pro'
  },
  weekly_reports: {
    tier: 'limited',
    gate: 'blur',
    label: 'Weekly Reports',
    proFeature: 'full_reports',
    description: 'Detailed weekly productivity reports',
    upgradeMessage: 'Unlock detailed weekly productivity reports with Pro'
  },
  session_history: {
    tier: 'limited',
    limit: 7,
    limitType: 'days',
    label: 'Extended Session History',
    unit: 'days',
    proFeature: 'full_session_history',
    description: 'Session history beyond 7 days',
    upgradeMessage: 'Access your complete session history with Pro'
  },
  timer_sounds: {
    tier: 'limited',
    gate: 'soft',
    label: 'Timer Sounds',
    proFeature: 'custom_sounds',
    description: 'Custom timer completion sounds',
    upgradeMessage: 'Unlock all timer sounds and custom uploads with Pro'
  },
  website_tracking: {
    tier: 'limited',
    limit: 3,
    limitType: 'count',
    label: 'Website Time Tracking',
    unit: 'sites',
    proFeature: 'all_site_tracking',
    description: 'Track time spent on specific websites',
    upgradeMessage: 'Track time on unlimited websites with Pro'
  },
  focus_buddy: {
    tier: 'limited',
    limit: 1,
    limitType: 'count',
    label: 'Focus Buddy',
    unit: 'buddies',
    proFeature: 'unlimited_buddies',
    description: 'Partner with a focus buddy',
    upgradeMessage: 'Add unlimited focus buddies with Pro'
  },
  focus_challenges: {
    tier: 'limited',
    limit: 1,
    limitType: 'count',
    label: 'Focus Challenges',
    unit: 'challenges',
    proFeature: 'unlimited_challenges',
    description: 'Join community focus challenges',
    upgradeMessage: 'Join unlimited focus challenges with Pro'
  },

  // =========================================================================
  // PRO (Hard Gate) -- 17 features, locked for free users
  // =========================================================================
  custom_block_page: {
    tier: 'pro',
    gate: 'hard',
    label: 'Custom Block Page',
    proFeature: 'custom_block_page',
    trigger: 'T5',
    description: 'Design your own block page with custom messages',
    upgradeMessage: 'Create a personalized block page that keeps you motivated'
  },
  whitelist_mode: {
    tier: 'pro',
    gate: 'hard',
    label: 'Whitelist Mode',
    proFeature: 'whitelist_mode',
    description: 'Block everything except allowed sites',
    upgradeMessage: 'Use allowlist mode to only permit specific sites'
  },
  redirect_sites: {
    tier: 'pro',
    gate: 'hard',
    label: 'Site Redirects',
    proFeature: 'redirect_sites',
    description: 'Redirect blocked sites to productive alternatives',
    upgradeMessage: 'Redirect distracting sites to productive alternatives'
  },
  password_protection: {
    tier: 'pro',
    gate: 'hard',
    label: 'Password Protection',
    proFeature: 'password_protection',
    description: 'Require password to change blocking settings',
    upgradeMessage: 'Lock your settings with a password for maximum accountability'
  },
  wildcard_blocking: {
    tier: 'pro',
    gate: 'hard',
    label: 'Wildcard Blocking',
    proFeature: 'wildcard_blocking',
    description: 'Block sites using wildcard patterns',
    upgradeMessage: 'Use wildcard patterns like *.social.com for flexible blocking'
  },
  custom_timer: {
    tier: 'pro',
    gate: 'hard',
    label: 'Custom Timer',
    proFeature: 'custom_timer',
    trigger: 'T7',
    description: 'Set any focus/break duration',
    upgradeMessage: 'Set custom focus and break durations that fit your workflow'
  },
  auto_start: {
    tier: 'pro',
    gate: 'hard',
    label: 'Auto-start Sessions',
    proFeature: 'auto_start_sessions',
    description: 'Automatically start focus sessions on schedule',
    upgradeMessage: 'Automatically start focus sessions at your preferred times'
  },
  break_customization: {
    tier: 'pro',
    gate: 'hard',
    label: 'Break Customization',
    proFeature: 'break_customization',
    description: 'Customize break activities and durations',
    upgradeMessage: 'Customize your break experience with activities and durations'
  },
  focus_score_breakdown: {
    tier: 'pro',
    gate: 'blur',
    label: 'Focus Score Breakdown',
    proFeature: 'focus_score_breakdown',
    trigger: 'T4',
    description: 'Detailed breakdown of your focus score components',
    upgradeMessage: 'See exactly what affects your focus score with detailed breakdowns'
  },
  exportable_analytics: {
    tier: 'pro',
    gate: 'hard',
    label: 'Export Analytics',
    proFeature: 'exportable_analytics',
    description: 'Export your data as CSV/JSON',
    upgradeMessage: 'Export your focus data for analysis in spreadsheets or other tools'
  },
  block_page_stats: {
    tier: 'pro',
    gate: 'hard',
    label: 'Block Page Stats',
    proFeature: 'block_page_stats',
    description: 'Show focus stats on the block page',
    upgradeMessage: 'Display your focus stats right on the block page for motivation'
  },
  calendar_integration: {
    tier: 'pro',
    gate: 'hard',
    label: 'Calendar Integration',
    proFeature: 'calendar_integration',
    description: 'Sync focus sessions with Google Calendar',
    upgradeMessage: 'Sync your focus sessions with Google Calendar automatically'
  },
  context_profiles: {
    tier: 'pro',
    gate: 'hard',
    label: 'Context Profiles',
    proFeature: 'context_profiles',
    description: 'Different block lists for work, study, etc.',
    upgradeMessage: 'Switch between work, study, and personal blocking profiles'
  },
  ai_recommendations: {
    tier: 'pro',
    gate: 'hard',
    label: 'AI Recommendations',
    proFeature: 'ai_recommendations',
    description: 'AI-powered focus improvement suggestions',
    upgradeMessage: 'Get personalized AI-powered suggestions to improve your focus'
  },
  smart_scheduling: {
    tier: 'pro',
    gate: 'hard',
    label: 'Smart Scheduling',
    proFeature: 'smart_scheduling',
    description: 'AI suggests optimal focus times',
    upgradeMessage: 'Let AI find your optimal focus windows based on your patterns'
  },
  distraction_prediction: {
    tier: 'pro',
    gate: 'hard',
    label: 'Distraction Prediction',
    proFeature: 'distraction_prediction',
    description: 'Predict when you are likely to get distracted',
    upgradeMessage: 'Get warned before your high-distraction periods begin'
  },
  cross_device_sync: {
    tier: 'pro',
    gate: 'hard',
    label: 'Cross-device Sync',
    proFeature: 'cross_device_sync',
    trigger: 'T8',
    description: 'Sync settings and data across devices',
    upgradeMessage: 'Keep your settings and history in sync across all your devices'
  },
  sound_mixing: {
    tier: 'pro',
    gate: 'hard',
    label: 'Sound Mixing',
    proFeature: 'sound_mixing',
    description: 'Layer and mix multiple ambient sounds',
    upgradeMessage: 'Create your perfect focus soundscape by mixing multiple sounds'
  },
  chrome_startup: {
    tier: 'pro',
    gate: 'hard',
    label: 'Chrome Startup',
    proFeature: 'chrome_startup',
    description: 'Auto-activate focus mode when Chrome starts',
    upgradeMessage: 'Start focused automatically every time you open Chrome'
  },
  selective_notifications: {
    tier: 'pro',
    gate: 'hard',
    label: 'Selective Notifications',
    proFeature: 'selective_notifications',
    description: 'Allow notifications from specific apps during focus',
    upgradeMessage: 'Keep important notifications while blocking distractions'
  },
  shareable_cards: {
    tier: 'pro',
    gate: 'hard',
    label: 'Shareable Focus Cards',
    proFeature: 'shareable_cards',
    description: 'Generate shareable focus achievement cards',
    upgradeMessage: 'Share beautiful focus achievement cards with friends'
  },
  global_leaderboards: {
    tier: 'pro',
    gate: 'hard',
    label: 'Global Leaderboards',
    proFeature: 'global_leaderboards',
    description: 'Compete on global focus leaderboards',
    upgradeMessage: 'See how you rank against focusers worldwide'
  },

  // =========================================================================
  // TEAM (Hard Gate) -- 7 features, team license only
  // =========================================================================
  team_sessions: {
    tier: 'team',
    gate: 'hard',
    label: 'Team Focus Sessions',
    proFeature: 'team_sessions',
    description: 'Synchronized focus sessions with your team',
    upgradeMessage: 'Run synchronized focus sessions with your entire team'
  },
  team_leaderboards: {
    tier: 'team',
    gate: 'hard',
    label: 'Team Leaderboards',
    proFeature: 'team_leaderboards',
    description: 'Private leaderboards for your team',
    upgradeMessage: 'Create private focus leaderboards for your team'
  },
  api_access: {
    tier: 'team',
    gate: 'hard',
    label: 'API Access',
    proFeature: 'api_access',
    description: 'REST API for integrations',
    upgradeMessage: 'Integrate Zovo Focus data with your own tools via REST API'
  },
  admin_dashboard: {
    tier: 'team',
    gate: 'hard',
    label: 'Admin Dashboard',
    proFeature: 'admin_dashboard',
    description: 'Manage team members and settings',
    upgradeMessage: 'Manage your team focus settings from a centralized dashboard'
  },
  bulk_management: {
    tier: 'team',
    gate: 'hard',
    label: 'Bulk Management',
    proFeature: 'bulk_management',
    description: 'Manage block lists for entire teams',
    upgradeMessage: 'Deploy and manage block lists across your entire team'
  },
  sso_integration: {
    tier: 'team',
    gate: 'hard',
    label: 'SSO Integration',
    proFeature: 'sso_integration',
    description: 'Single sign-on for team accounts',
    upgradeMessage: 'Use your company SSO to manage team access'
  },
  priority_support: {
    tier: 'team',
    gate: 'hard',
    label: 'Priority Support',
    proFeature: 'priority_support',
    description: 'Priority customer support channel',
    upgradeMessage: 'Get fast, dedicated support for your team'
  }
};
```

### 1.4 Tier Resolution Order

When checking whether a user has access to a feature, the system resolves in this order:

1. Look up the feature in `FEATURE_REGISTRY`.
2. Get the user's current tier from `license-manager.js` (`getUserTier()`).
3. Compare tiers using the hierarchy: `free < limited < pro < team`.
4. If the feature has a `limit` and the user is on a tier that enforces the limit, compare `currentValue` against `limit`.
5. Return the access decision with the appropriate gate type for UI rendering.

---

## 2. Feature Gate Functions

### 2.1 Complete `feature-gate.js` Module

```javascript
// src/shared/feature-gate.js

import { getUserTier, isPro, isTeam } from './license-manager.js';

// ── Feature Registry (see Section 1.3 above) ──
// FEATURE_REGISTRY defined here (omitted for brevity; full definition in Section 1.3)

const TIER_LEVELS = {
  free: 0,
  limited: 1,
  pro: 2,
  team: 3
};

// ─────────────────────────────────────────────────────────
// CORE FUNCTIONS
// ─────────────────────────────────────────────────────────

/**
 * Check whether the current user can access a feature.
 *
 * @param {string} featureName  - Key in FEATURE_REGISTRY
 * @param {number} [currentValue] - Current count / value for cap-gated features
 * @returns {{
 *   allowed: boolean,
 *   reason: string,
 *   limit: number|null,
 *   remaining: number|null,
 *   gateType: string,
 *   trigger: string|null,
 *   upgradeMessage: string|null
 * }}
 */
export function checkFeatureAccess(featureName, currentValue = 0) {
  const feature = FEATURE_REGISTRY[featureName];
  if (!feature) {
    console.warn(`[feature-gate] Unknown feature: ${featureName}`);
    return {
      allowed: false,
      reason: 'unknown_feature',
      limit: null,
      remaining: null,
      gateType: 'hard',
      trigger: null,
      upgradeMessage: null
    };
  }

  const userTier = getUserTier();
  const userLevel = TIER_LEVELS[userTier] || 0;
  const featureLevel = TIER_LEVELS[feature.tier] || 0;

  // Free features with no gate -- always allowed
  if (feature.gate === 'none') {
    return {
      allowed: true,
      reason: 'free_feature',
      limit: null,
      remaining: null,
      gateType: 'none',
      trigger: null,
      upgradeMessage: null
    };
  }

  // User tier meets or exceeds the feature tier -- always allowed
  if (userLevel >= featureLevel) {
    // Pro/team user accessing a limited feature -- no cap enforced
    if (feature.limit !== undefined && userLevel > TIER_LEVELS.limited) {
      return {
        allowed: true,
        reason: 'tier_unlocked',
        limit: null,
        remaining: null,
        gateType: 'none',
        trigger: feature.trigger || null,
        upgradeMessage: null
      };
    }

    // Free user accessing a free-tier feature with a limit
    if (feature.limit !== undefined) {
      const remaining = Math.max(0, feature.limit - currentValue);
      const atLimit = currentValue >= feature.limit;
      return {
        allowed: !atLimit,
        reason: atLimit ? 'limit_reached' : 'within_limit',
        limit: feature.limit,
        remaining,
        gateType: atLimit ? 'soft' : 'none',
        trigger: feature.trigger || null,
        upgradeMessage: atLimit ? (feature.upgradeMessage || null) : null
      };
    }

    return {
      allowed: true,
      reason: 'tier_unlocked',
      limit: null,
      remaining: null,
      gateType: 'none',
      trigger: feature.trigger || null,
      upgradeMessage: null
    };
  }

  // ── User does NOT have sufficient tier ──

  // Cap-gated features (limited tier, user is free)
  if (feature.limit !== undefined && feature.tier === 'limited') {
    const remaining = Math.max(0, feature.limit - currentValue);
    const atLimit = currentValue >= feature.limit;
    return {
      allowed: !atLimit,
      reason: atLimit ? 'limit_reached' : 'within_limit',
      limit: feature.limit,
      remaining,
      gateType: atLimit ? 'soft' : 'none',
      trigger: feature.trigger || null,
      upgradeMessage: atLimit ? (feature.upgradeMessage || null) : null
    };
  }

  // Hard-gated or blur-gated features
  const gateType = feature.gate || 'hard';
  return {
    allowed: false,
    reason: 'tier_locked',
    limit: feature.limit || null,
    remaining: null,
    gateType,
    trigger: feature.trigger || null,
    upgradeMessage: feature.upgradeMessage || null
  };
}

/**
 * Simple boolean: is the feature locked for the current user?
 */
export function isFeatureLocked(featureName) {
  const result = checkFeatureAccess(featureName);
  return !result.allowed;
}

/**
 * Get the numeric limit for a feature (returns null if no limit).
 */
export function getFeatureLimit(featureName) {
  const feature = FEATURE_REGISTRY[featureName];
  if (!feature) return null;

  const userTier = getUserTier();
  const userLevel = TIER_LEVELS[userTier] || 0;

  // Pro/team users have no limits
  if (userLevel >= TIER_LEVELS.pro) return null;

  return feature.limit || null;
}

/**
 * Get remaining quota before a limit is reached.
 */
export function getRemainingQuota(featureName, currentCount) {
  const limit = getFeatureLimit(featureName);
  if (limit === null) return Infinity;
  return Math.max(0, limit - currentCount);
}

/**
 * Get the proFeature identifier needed to unlock a feature.
 */
export function getUpgradeFeature(featureName) {
  const feature = FEATURE_REGISTRY[featureName];
  return feature ? (feature.proFeature || null) : null;
}

/**
 * Get the feature's human-readable label.
 */
export function getFeatureLabel(featureName) {
  const feature = FEATURE_REGISTRY[featureName];
  return feature ? feature.label : featureName;
}

/**
 * Get the gate type for a feature (none, soft, hard, blur, preview).
 */
export function getGateType(featureName) {
  const feature = FEATURE_REGISTRY[featureName];
  if (!feature) return 'hard';
  if (feature.gate === 'none') return 'none';
  if (feature.limit !== undefined && !feature.gate) return 'soft';
  return feature.gate || 'hard';
}

// ─────────────────────────────────────────────────────────
// USAGE CHECKING -- Convenience wrappers for common checks
// ─────────────────────────────────────────────────────────

/**
 * Can the user add another site to their blocklist?
 * Free limit: 10 sites.
 */
export function canAddSite(currentSiteCount) {
  const result = checkFeatureAccess('manual_blocklist', currentSiteCount);
  return {
    allowed: result.allowed,
    remaining: result.remaining,
    limit: result.limit,
    upgradeMessage: result.allowed
      ? null
      : 'You have reached the free limit of 10 blocked sites. Upgrade to Pro for unlimited blocking.'
  };
}

/**
 * Can the user extend Nuclear Mode to the requested duration?
 * Free limit: 60 minutes.
 */
export function canExtendNuclear(requestedMinutes) {
  const result = checkFeatureAccess('nuclear_option', requestedMinutes);
  return {
    allowed: result.allowed,
    maxMinutes: result.limit,
    upgradeMessage: result.allowed
      ? null
      : `Nuclear Mode is limited to ${result.limit} minutes on the free plan. Upgrade to Pro for up to 24 hours.`
  };
}

/**
 * Can the user add another blocking schedule?
 * Free limit: 1 schedule.
 */
export function canAddSchedule(currentScheduleCount) {
  const result = checkFeatureAccess('schedule_blocking', currentScheduleCount);
  return {
    allowed: result.allowed,
    remaining: result.remaining,
    limit: result.limit,
    upgradeMessage: result.allowed
      ? null
      : 'You can only have 1 schedule on the free plan. Upgrade to Pro for unlimited schedules.'
  };
}

/**
 * Can the user add another pre-built block list?
 * Free limit: 2 lists.
 */
export function canAddList(currentListCount) {
  const result = checkFeatureAccess('pre_built_lists', currentListCount);
  return {
    allowed: result.allowed,
    remaining: result.remaining,
    limit: result.limit,
    upgradeMessage: result.allowed
      ? null
      : 'You can use up to 2 pre-built lists on the free plan. Upgrade to Pro to unlock all lists.'
  };
}

/**
 * Can the user play a specific sound?
 * Free users can only play sounds in the freeSoundIds array.
 * @param {string} soundId - The ID of the sound to play
 * @param {string[]} freeSoundIds - Array of sound IDs available for free
 */
export function canPlaySound(soundId, freeSoundIds = []) {
  if (isPro() || isTeam()) {
    return { allowed: true, upgradeMessage: null };
  }

  const isFreeSound = freeSoundIds.includes(soundId);
  return {
    allowed: isFreeSound,
    upgradeMessage: isFreeSound
      ? null
      : 'This sound is available with Pro. Upgrade to access 15+ ambient sounds and sound mixing.'
  };
}

/**
 * Can the user add another focus buddy?
 * Free limit: 1 buddy.
 */
export function canAddBuddy(currentBuddyCount) {
  const result = checkFeatureAccess('focus_buddy', currentBuddyCount);
  return {
    allowed: result.allowed,
    remaining: result.remaining,
    limit: result.limit,
    upgradeMessage: result.allowed
      ? null
      : 'You can have 1 focus buddy on the free plan. Upgrade to Pro for unlimited buddies.'
  };
}

/**
 * Can the user join another focus challenge?
 * Free limit: 1 active challenge.
 */
export function canJoinChallenge(currentChallengeCount) {
  const result = checkFeatureAccess('focus_challenges', currentChallengeCount);
  return {
    allowed: result.allowed,
    remaining: result.remaining,
    limit: result.limit,
    upgradeMessage: result.allowed
      ? null
      : 'You can join 1 challenge on the free plan. Upgrade to Pro for unlimited challenges.'
  };
}

/**
 * Can the user add another category to block?
 * Free limit: 2 categories.
 */
export function canAddCategory(currentCategoryCount) {
  const result = checkFeatureAccess('category_blocking', currentCategoryCount);
  return {
    allowed: result.allowed,
    remaining: result.remaining,
    limit: result.limit,
    upgradeMessage: result.allowed
      ? null
      : 'You can block 2 categories on the free plan. Upgrade to Pro to block all categories.'
  };
}

/**
 * Can the user track another website's time?
 * Free limit: 3 tracked sites.
 */
export function canTrackWebsite(currentTrackedCount) {
  const result = checkFeatureAccess('website_tracking', currentTrackedCount);
  return {
    allowed: result.allowed,
    remaining: result.remaining,
    limit: result.limit,
    upgradeMessage: result.allowed
      ? null
      : 'You can track 3 websites on the free plan. Upgrade to Pro for unlimited tracking.'
  };
}

// ─────────────────────────────────────────────────────────
// UI INDICATORS -- Functions that return HTML/CSS for gating
// ─────────────────────────────────────────────────────────

/**
 * Returns HTML for a small purple PRO badge if the feature is locked.
 * Returns empty string if the feature is available.
 */
export function getProBadgeHTML(featureName) {
  if (!isFeatureLocked(featureName)) return '';

  const feature = FEATURE_REGISTRY[featureName];
  const tierLabel = feature && feature.tier === 'team' ? 'TEAM' : 'PRO';

  return `<span class="pro-badge" data-feature="${featureName}">${tierLabel}</span>`;
}

/**
 * Returns HTML for a usage counter (e.g. "3/10 sites").
 * Color-coded: green (0-60%), yellow (61-80%), orange (81-99%), red (100%).
 */
export function getUsageCounterHTML(featureName, current, limit) {
  if (limit === null || limit === undefined) return '';

  const feature = FEATURE_REGISTRY[featureName];
  const unit = (feature && feature.unit) || '';
  const percentage = (current / limit) * 100;

  let colorClass = 'usage-counter--ok';
  if (percentage >= 100) {
    colorClass = 'usage-counter--full';
  } else if (percentage > 80) {
    colorClass = 'usage-counter--warning';
  } else if (percentage > 60) {
    colorClass = 'usage-counter--caution';
  }

  return `<span class="usage-counter ${colorClass}" data-feature="${featureName}">${current}/${limit} ${unit}</span>`;
}

/**
 * Returns HTML for a lock icon overlay (for hard-gated settings/buttons).
 */
export function getLockOverlayHTML(featureName) {
  const feature = FEATURE_REGISTRY[featureName];
  const label = feature ? feature.label : 'Pro Feature';
  const tierLabel = feature && feature.tier === 'team' ? 'Team Feature' : 'Pro Feature';

  return `
    <div class="feature-lock-overlay" data-feature="${featureName}" role="button" tabindex="0"
         aria-label="Locked: ${label}. Click to upgrade.">
      <svg class="lock-icon" width="24" height="24" viewBox="0 0 24 24" fill="none"
           xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="11" width="18" height="11" rx="2" fill="#6366f1" opacity="0.9"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#6366f1" stroke-width="2"
              stroke-linecap="round" fill="none"/>
        <circle cx="12" cy="16" r="1.5" fill="white"/>
        <line x1="12" y1="17.5" x2="12" y2="19" stroke="white" stroke-width="1.5"
              stroke-linecap="round"/>
      </svg>
      <span class="lock-label">${tierLabel}</span>
    </div>
  `;
}

/**
 * Returns a CSS class name for blur-gated content.
 * The actual CSS is defined in the component stylesheet.
 */
export function getBlurCSS(featureName) {
  const result = checkFeatureAccess(featureName);
  if (result.gateType === 'blur' && !result.allowed) {
    return 'pro-blur';
  }
  return '';
}

/**
 * Returns the full upgrade message for a feature.
 */
export function getUpgradeMessage(featureName) {
  const feature = FEATURE_REGISTRY[featureName];
  return feature ? (feature.upgradeMessage || `Upgrade to Pro to unlock ${feature.label}`) : '';
}

/**
 * Wraps content with appropriate gating UI based on feature access.
 * Use this as a convenience function when rendering gated sections.
 *
 * @param {string} featureName
 * @param {string} innerHTML - The content to wrap
 * @param {number} [currentValue] - Current count for capped features
 * @returns {string} HTML with gating applied
 */
export function wrapWithGate(featureName, innerHTML, currentValue = 0) {
  const access = checkFeatureAccess(featureName, currentValue);

  if (access.allowed && access.gateType === 'none') {
    return innerHTML;
  }

  switch (access.gateType) {
    case 'blur':
      return `
        <div class="gated-feature gated-feature--blur" data-feature="${featureName}">
          <div class="pro-blur">${innerHTML}</div>
          <div class="blur-upgrade-banner">
            <span class="pro-badge">PRO</span>
            <span class="blur-upgrade-text">${access.upgradeMessage || 'Upgrade to unlock'}</span>
            <button class="blur-upgrade-btn" data-upgrade-feature="${featureName}">Unlock</button>
          </div>
        </div>
      `;

    case 'hard':
      return `
        <div class="gated-feature gated-feature--locked" data-feature="${featureName}">
          <div class="locked-content">${innerHTML}</div>
          ${getLockOverlayHTML(featureName)}
        </div>
      `;

    case 'soft':
      // At limit -- show content with upgrade prompt
      if (!access.allowed) {
        return `
          <div class="gated-feature gated-feature--capped" data-feature="${featureName}">
            ${innerHTML}
            <div class="cap-upgrade-banner">
              <span>${access.upgradeMessage || 'Limit reached. Upgrade for more.'}</span>
              <button class="cap-upgrade-btn" data-upgrade-feature="${featureName}">Upgrade</button>
            </div>
          </div>
        `;
      }
      return innerHTML;

    default:
      return innerHTML;
  }
}

// ─────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────

export { FEATURE_REGISTRY, TIER_LEVELS };
```

### 2.2 Event-Driven Gate Checks

The feature gate module fires custom events so other parts of the extension can react to gate triggers without tight coupling.

```javascript
// Dispatched when a user hits a feature gate
function dispatchGateEvent(featureName, gateType, trigger) {
  const event = new CustomEvent('zovo:feature-gate', {
    detail: {
      feature: featureName,
      gateType,
      trigger,
      timestamp: Date.now()
    }
  });
  document.dispatchEvent(event);

  // Also send to background for analytics
  chrome.runtime.sendMessage({
    type: 'FEATURE_GATE_HIT',
    payload: {
      feature: featureName,
      gateType,
      trigger,
      timestamp: Date.now()
    }
  });
}
```

Listeners in the popup and options page listen for `zovo:feature-gate` to show the appropriate upgrade modal.

---

## 3. Feature Gate UI Components

### 3.1 PRO Badge

A small pill badge that appears inline next to locked feature labels. It immediately communicates "this needs an upgrade" without being overly intrusive.

**HTML:**
```html
<span class="pro-badge">PRO</span>
<!-- For team features: -->
<span class="pro-badge pro-badge--team">TEAM</span>
```

**CSS:**
```css
.pro-badge {
  display: inline-flex;
  align-items: center;
  background: #6366f1;
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 1px 6px;
  border-radius: 9999px;
  line-height: 16px;
  vertical-align: middle;
  margin-left: 6px;
  user-select: none;
  flex-shrink: 0;
}

.pro-badge--team {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
}

/* Subtle pulse animation on hover to draw attention */
.pro-badge:hover {
  animation: pro-badge-pulse 0.6s ease-in-out;
}

@keyframes pro-badge-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
```

**Usage in the popup settings list:**
```html
<div class="setting-item">
  <span class="setting-label">
    Custom Block Page
    <span class="pro-badge">PRO</span>
  </span>
  <button class="setting-action" disabled data-upgrade="custom_block_page">
    Customize
  </button>
</div>
```

### 3.2 Lock Icon Overlay

For hard-gated features that are displayed as cards, tiles, or sections. The overlay sits on top of the feature's normal UI and prevents all interaction.

**HTML:**
```html
<div class="feature-card feature-card--locked" data-feature="sound_mixing">
  <div class="feature-card__content">
    <!-- Normal feature content rendered underneath -->
    <h4>Sound Mixing</h4>
    <p>Layer multiple ambient sounds</p>
  </div>
  <div class="feature-lock-overlay">
    <svg class="lock-icon" width="24" height="24" viewBox="0 0 24 24" fill="none"
         xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="11" width="18" height="11" rx="2" fill="#6366f1" opacity="0.9"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#6366f1" stroke-width="2"
            stroke-linecap="round" fill="none"/>
      <circle cx="12" cy="16" r="1.5" fill="white"/>
      <line x1="12" y1="17.5" x2="12" y2="19" stroke="white" stroke-width="1.5"
            stroke-linecap="round"/>
    </svg>
    <span class="lock-label">Pro Feature</span>
  </div>
</div>
```

**CSS:**
```css
.feature-lock-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(2px);
  border-radius: inherit;
  cursor: pointer;
  z-index: 10;
  transition: background 0.2s ease;
}

.feature-lock-overlay:hover {
  background: rgba(99, 102, 241, 0.08);
}

.feature-lock-overlay:focus-visible {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
}

.lock-icon {
  margin-bottom: 4px;
}

.lock-label {
  font-size: 11px;
  font-weight: 600;
  color: #6366f1;
  letter-spacing: 0.3px;
}

.feature-card--locked {
  position: relative;
  overflow: hidden;
}

.feature-card--locked .feature-card__content {
  opacity: 0.4;
  pointer-events: none;
}
```

**Click handler:**
```javascript
document.addEventListener('click', (e) => {
  const overlay = e.target.closest('.feature-lock-overlay');
  if (overlay) {
    const featureName = overlay.dataset.feature ||
                        overlay.closest('[data-feature]')?.dataset.feature;
    if (featureName) {
      showUpgradeModal(featureName);
    }
  }
});
```

### 3.3 Usage Counter

A small inline counter that shows how much of a capped resource the user has consumed. Color-coded to create urgency near the limit.

**HTML:**
```html
<span class="usage-counter usage-counter--ok">3/10 sites</span>
<span class="usage-counter usage-counter--caution">7/10 sites</span>
<span class="usage-counter usage-counter--warning">9/10 sites</span>
<span class="usage-counter usage-counter--full">10/10 sites</span>
```

**CSS:**
```css
.usage-counter {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  line-height: 16px;
  white-space: nowrap;
  user-select: none;
}

/* Green: 0-60% usage */
.usage-counter--ok {
  background: #ecfdf5;
  color: #059669;
}

/* Yellow: 61-80% usage */
.usage-counter--caution {
  background: #fefce8;
  color: #ca8a04;
}

/* Orange: 81-99% usage */
.usage-counter--warning {
  background: #fff7ed;
  color: #ea580c;
}

/* Red: 100% (at limit) */
.usage-counter--full {
  background: #fef2f2;
  color: #dc2626;
  animation: usage-full-pulse 2s ease-in-out infinite;
}

@keyframes usage-full-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

**Dynamic update pattern:**
```javascript
function updateUsageCounter(featureName, current) {
  const limit = getFeatureLimit(featureName);
  if (!limit) return;

  const counterEl = document.querySelector(
    `.usage-counter[data-feature="${featureName}"]`
  );
  if (!counterEl) return;

  counterEl.outerHTML = getUsageCounterHTML(featureName, current, limit);
}
```

### 3.4 Blur Effect

For blur-gated content such as weekly reports and focus score breakdowns. The user can see the shape and layout of the data, creating desire for the full feature, but cannot read the actual values.

**CSS:**
```css
.pro-blur {
  filter: blur(6px);
  pointer-events: none;
  user-select: none;
  position: relative;
}

.pro-blur::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.3);
  z-index: 5;
}

/* Upgrade banner that sits centered on top of blurred content */
.blur-upgrade-banner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
}

.blur-upgrade-text {
  font-size: 13px;
  color: #374151;
  text-align: center;
  max-width: 200px;
}

.blur-upgrade-btn {
  background: #6366f1;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.blur-upgrade-btn:hover {
  background: #4f46e5;
}
```

**Container setup for blur-gated sections:**
```html
<div class="gated-feature gated-feature--blur" data-feature="weekly_reports">
  <div class="pro-blur">
    <!-- Actual report content rendered here (readable only for Pro) -->
    <div class="weekly-report">
      <h3>Weekly Report: Feb 3-9</h3>
      <div class="report-chart">...</div>
      <div class="report-stats">...</div>
    </div>
  </div>
  <div class="blur-upgrade-banner">
    <span class="pro-badge">PRO</span>
    <span class="blur-upgrade-text">Unlock detailed weekly reports with Pro</span>
    <button class="blur-upgrade-btn" data-upgrade-feature="weekly_reports">Unlock</button>
  </div>
</div>
```

### 3.5 CSS Variables and Shared Styles

All gating UI components share a common set of CSS variables for consistency.

```css
:root {
  /* Zovo brand */
  --zovo-primary: #6366f1;
  --zovo-primary-hover: #4f46e5;
  --zovo-primary-light: #eef2ff;
  --zovo-primary-bg: rgba(99, 102, 241, 0.08);

  /* Usage counter colors */
  --gate-ok: #059669;
  --gate-ok-bg: #ecfdf5;
  --gate-caution: #ca8a04;
  --gate-caution-bg: #fefce8;
  --gate-warning: #ea580c;
  --gate-warning-bg: #fff7ed;
  --gate-full: #dc2626;
  --gate-full-bg: #fef2f2;

  /* Lock overlay */
  --lock-overlay-bg: rgba(255, 255, 255, 0.85);
  --lock-overlay-hover-bg: rgba(99, 102, 241, 0.08);
}
```

---

## 4. License Key Input UI

### 4.1 License Input Component

The license input is the primary method for activating a Pro or Team license. It appears in two places:

1. **Upgrade modal** -- After a user hits a feature gate and clicks "Upgrade", the modal shows purchase options plus a "Have a license key?" link that expands to show the input.
2. **Options page** -- The License & Subscription section always shows either the active license or the input form.

**Visual layout:**
```
+-----------------------------------------------------+
|  Enter Your License Key                              |
|                                                      |
|  +----------------------------------------------+   |
|  | ZOVO-____-____-____-____                      |   |
|  +----------------------------------------------+   |
|                                                      |
|  [Verify License]           <- Purple button         |
|                                                      |
|  Don't have a key? Get Pro ->                        |
|                                                      |
|  Status: License valid -- Pro activated               |
|  OR                                                  |
|  Status: Invalid license key                         |
+-----------------------------------------------------+
```

### 4.2 License Input HTML

```html
<div class="license-input-section" id="license-input-section">
  <h3 class="license-input-title">Enter Your License Key</h3>

  <div class="license-input-wrapper">
    <input
      type="text"
      id="license-key-input"
      class="license-key-input"
      placeholder="ZOVO-XXXX-XXXX-XXXX-XXXX"
      maxlength="24"
      autocomplete="off"
      spellcheck="false"
      aria-label="License key"
    />
  </div>

  <button id="license-verify-btn" class="license-verify-btn" disabled>
    Verify License
  </button>

  <p class="license-get-pro">
    Don't have a key?
    <a href="#" id="license-get-pro-link" class="license-get-pro-link">Get Pro</a>
  </p>

  <div id="license-status" class="license-status" role="status" aria-live="polite" hidden>
    <!-- Populated dynamically -->
  </div>
</div>
```

### 4.3 License Input CSS

```css
.license-input-section {
  max-width: 400px;
  margin: 0 auto;
  padding: 24px;
}

.license-input-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 16px 0;
}

.license-input-wrapper {
  position: relative;
  margin-bottom: 12px;
}

.license-key-input {
  width: 100%;
  padding: 12px 16px;
  font-size: 16px;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  border: 2px solid #d1d5db;
  border-radius: 10px;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;
}

.license-key-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.license-key-input.license-key-input--valid {
  border-color: #059669;
}

.license-key-input.license-key-input--invalid {
  border-color: #dc2626;
}

.license-verify-btn {
  width: 100%;
  padding: 12px 20px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, opacity 0.2s ease;
}

.license-verify-btn:hover:not(:disabled) {
  background: #4f46e5;
}

.license-verify-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.license-verify-btn--loading {
  position: relative;
  color: transparent;
}

.license-verify-btn--loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  margin: -10px 0 0 -10px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.license-get-pro {
  text-align: center;
  font-size: 13px;
  color: #6b7280;
  margin: 12px 0 0 0;
}

.license-get-pro-link {
  color: #6366f1;
  font-weight: 600;
  text-decoration: none;
}

.license-get-pro-link:hover {
  text-decoration: underline;
}

/* Status messages */
.license-status {
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.license-status--success {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.license-status--error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.license-status--loading {
  background: #eef2ff;
  color: #6366f1;
  border: 1px solid #c7d2fe;
}
```

### 4.4 License Input Implementation (`license-ui.js`)

```javascript
// src/shared/license-ui.js

import { verifyLicense, activateLicense, removeLicense, getLicenseInfo } from './license-manager.js';

const LICENSE_PATTERN = /^ZOVO-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
const ZOVO_PURCHASE_URL = 'https://zovo.dev/pricing';

// ─────────────────────────────────────────────────────────
// LICENSE INPUT FORM
// ─────────────────────────────────────────────────────────

/**
 * Render the license input form into a container element.
 * @param {HTMLElement} container
 */
export function showLicenseInput(container) {
  container.innerHTML = `
    <div class="license-input-section" id="license-input-section">
      <h3 class="license-input-title">Enter Your License Key</h3>
      <div class="license-input-wrapper">
        <input
          type="text"
          id="license-key-input"
          class="license-key-input"
          placeholder="ZOVO-XXXX-XXXX-XXXX-XXXX"
          maxlength="24"
          autocomplete="off"
          spellcheck="false"
          aria-label="License key"
        />
      </div>
      <button id="license-verify-btn" class="license-verify-btn" disabled>
        Verify License
      </button>
      <p class="license-get-pro">
        Don't have a key?
        <a href="${ZOVO_PURCHASE_URL}" target="_blank" class="license-get-pro-link">Get Pro</a>
      </p>
      <div id="license-status" class="license-status" role="status" aria-live="polite" hidden></div>
    </div>
  `;

  initLicenseInputListeners(container);
}

/**
 * Attach event listeners for the license input form.
 */
function initLicenseInputListeners(container) {
  const input = container.querySelector('#license-key-input');
  const verifyBtn = container.querySelector('#license-verify-btn');
  const statusEl = container.querySelector('#license-status');

  if (!input || !verifyBtn) return;

  // Auto-format: uppercase + auto-insert hyphens
  input.addEventListener('input', (e) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');

    // Remove all hyphens for re-formatting
    const raw = value.replace(/-/g, '');

    // Insert hyphens after "ZOVO" and every 4 chars after
    if (raw.length > 4) {
      const prefix = raw.substring(0, 4); // "ZOVO"
      const rest = raw.substring(4);
      const chunks = rest.match(/.{1,4}/g) || [];
      value = prefix + '-' + chunks.join('-');
    }

    // Cap at 24 characters (ZOVO-XXXX-XXXX-XXXX-XXXX)
    value = value.substring(0, 24);
    e.target.value = value;

    // Validate format
    const isValid = LICENSE_PATTERN.test(value);
    verifyBtn.disabled = !isValid;

    // Visual feedback
    input.classList.toggle('license-key-input--valid', isValid);
    input.classList.toggle('license-key-input--invalid', value.length === 24 && !isValid);
  });

  // Handle paste: clean and format
  input.addEventListener('paste', (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData).getData('text');
    const cleaned = pasted.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Re-format with hyphens
    if (cleaned.length >= 20) {
      const formatted = `${cleaned.substring(0, 4)}-${cleaned.substring(4, 8)}-${cleaned.substring(8, 12)}-${cleaned.substring(12, 16)}-${cleaned.substring(16, 20)}`;
      input.value = formatted;
      input.dispatchEvent(new Event('input'));
    } else {
      input.value = pasted.toUpperCase().substring(0, 24);
      input.dispatchEvent(new Event('input'));
    }
  });

  // Submit on Enter
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !verifyBtn.disabled) {
      handleLicenseSubmit(input.value, verifyBtn, statusEl);
    }
  });

  // Verify button click
  verifyBtn.addEventListener('click', () => {
    handleLicenseSubmit(input.value, verifyBtn, statusEl);
  });
}

// ─────────────────────────────────────────────────────────
// LICENSE VERIFICATION FLOW
// ─────────────────────────────────────────────────────────

/**
 * Validate format, verify with API, and update UI.
 */
async function handleLicenseSubmit(key, verifyBtn, statusEl) {
  // Format validation
  if (!LICENSE_PATTERN.test(key)) {
    showLicenseStatus(statusEl, {
      type: 'error',
      message: 'Invalid license key format. Expected: ZOVO-XXXX-XXXX-XXXX-XXXX'
    });
    return;
  }

  // Show loading state
  verifyBtn.disabled = true;
  verifyBtn.classList.add('license-verify-btn--loading');
  verifyBtn.textContent = 'Verifying...';
  showLicenseStatus(statusEl, {
    type: 'loading',
    message: 'Verifying license key...'
  });

  try {
    // Call license-manager verification
    const result = await verifyLicense(key);

    if (result.valid) {
      // Activate the license locally
      await activateLicense(key, result);

      showLicenseStatus(statusEl, {
        type: 'success',
        message: `License valid -- ${result.tier === 'team' ? 'Team' : 'Pro'} activated!`
      });

      // Dispatch event for other components to react
      document.dispatchEvent(new CustomEvent('zovo:license-activated', {
        detail: { tier: result.tier, key: maskLicenseKey(key) }
      }));

      // Refresh the page after a short delay so UI updates
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } else {
      showLicenseStatus(statusEl, {
        type: 'error',
        message: result.message || 'Invalid license key. Please check and try again.'
      });
    }

  } catch (err) {
    console.error('[license-ui] Verification failed:', err);
    showLicenseStatus(statusEl, {
      type: 'error',
      message: 'Could not verify license. Please check your connection and try again.'
    });

  } finally {
    verifyBtn.disabled = false;
    verifyBtn.classList.remove('license-verify-btn--loading');
    verifyBtn.textContent = 'Verify License';
  }
}

/**
 * Show a status message below the license input.
 */
function showLicenseStatus(statusEl, { type, message }) {
  if (!statusEl) return;

  const icons = {
    success: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a8 8 0 110 16A8 8 0 018 0zm3.78 5.22a.75.75 0 00-1.06 0L7 8.94 5.28 7.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.06 0l4.25-4.25a.75.75 0 000-1.06z"/></svg>',
    error: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a8 8 0 110 16A8 8 0 018 0zm0 3.5a.75.75 0 00-.75.75v4a.75.75 0 001.5 0v-4A.75.75 0 008 3.5zM8 12a1 1 0 100-2 1 1 0 000 2z"/></svg>',
    loading: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" class="spin-icon"><path d="M8 0a8 8 0 018 8h-1.5A6.5 6.5 0 008 1.5V0z"/></svg>'
  };

  statusEl.className = `license-status license-status--${type}`;
  statusEl.innerHTML = `${icons[type] || ''} <span>${message}</span>`;
  statusEl.hidden = false;
}

// ─────────────────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────────────────

/**
 * Mask a license key for display: ZOVO-****-****-****-5678
 */
function maskLicenseKey(key) {
  if (!key || key.length < 24) return key;
  const parts = key.split('-');
  if (parts.length !== 5) return key;
  return `${parts[0]}-****-****-****-${parts[4]}`;
}

export { maskLicenseKey, LICENSE_PATTERN };
```

### 4.5 Input Auto-Formatting Details

The license key input uses aggressive formatting to minimize user friction:

| User types | Input displays |
|------------|---------------|
| `zovo` | `ZOVO` |
| `zovo1234` | `ZOVO-1234` |
| `zovo12345678` | `ZOVO-1234-5678` |
| Pastes `ZOVO1234ABCD5678EFGH` | `ZOVO-1234-ABCD-5678-EFGH` |
| Pastes `zovo-1234-abcd-5678-efgh` | `ZOVO-1234-ABCD-5678-EFGH` |
| Types lowercase | Auto-uppercased |
| Types special characters | Stripped |

The Verify button is only enabled when the input matches the full `ZOVO-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}` pattern.

---

## 5. License Settings Section

### 5.1 Options Page -- Active License View

When the user has an active license, the License & Subscription section displays the license details.

**Layout:**
```
+-----------------------------------------------------+
|  License & Subscription                              |
|                                                      |
|  Status:  [green dot] Pro (Monthly)                  |
|  Email:   u***@example.com                           |
|  Key:     ZOVO-****-****-****-5678                   |
|  Expires: March 10, 2026                             |
|                                                      |
|  [Manage Subscription ->]   [Remove License]         |
+-----------------------------------------------------+
```

**HTML:**
```html
<section class="settings-section" id="license-section">
  <h2 class="settings-section-title">License & Subscription</h2>

  <!-- Active license view -->
  <div id="license-active-view" class="license-info-card">
    <div class="license-info-row">
      <span class="license-info-label">Status</span>
      <span class="license-info-value">
        <span class="status-dot status-dot--active"></span>
        <span id="license-tier-display">Pro (Monthly)</span>
      </span>
    </div>
    <div class="license-info-row">
      <span class="license-info-label">Email</span>
      <span class="license-info-value" id="license-email-display">u***@example.com</span>
    </div>
    <div class="license-info-row">
      <span class="license-info-label">Key</span>
      <span class="license-info-value license-info-value--mono" id="license-key-display">
        ZOVO-****-****-****-5678
      </span>
    </div>
    <div class="license-info-row">
      <span class="license-info-label">Expires</span>
      <span class="license-info-value" id="license-expiry-display">March 10, 2026</span>
    </div>

    <div class="license-actions">
      <a href="https://zovo.dev/account" target="_blank" class="license-manage-btn">
        Manage Subscription
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M3.5 1.5L8 6l-4.5 4.5" stroke="currentColor" stroke-width="1.5"
                fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </a>
      <button id="license-remove-btn" class="license-remove-btn">Remove License</button>
    </div>
  </div>
</section>
```

### 5.2 Options Page -- Free User View

When the user has no active license, a simpler view is shown with CTAs for activation.

**Layout:**
```
+-----------------------------------------------------+
|  License & Subscription                              |
|                                                      |
|  Status:  Free Plan                                  |
|                                                      |
|  [Enter License Key]    [Upgrade to Pro ->]          |
+-----------------------------------------------------+
```

**HTML:**
```html
<div id="license-free-view" class="license-info-card license-info-card--free">
  <div class="license-info-row">
    <span class="license-info-label">Status</span>
    <span class="license-info-value">
      <span class="status-dot status-dot--free"></span>
      Free Plan
    </span>
  </div>

  <div class="license-free-actions">
    <button id="license-enter-key-btn" class="license-enter-key-btn">
      Enter License Key
    </button>
    <a href="https://zovo.dev/pricing" target="_blank" class="license-upgrade-btn">
      Upgrade to Pro
      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
        <path d="M3.5 1.5L8 6l-4.5 4.5" stroke="currentColor" stroke-width="1.5"
              fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </a>
  </div>

  <!-- Expandable license input (hidden by default) -->
  <div id="license-input-container" hidden></div>
</div>
```

### 5.3 License Settings CSS

```css
.license-info-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
}

.license-info-card--free {
  background: #fefce8;
  border-color: #fde68a;
}

.license-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.license-info-row:not(:last-child) {
  border-bottom: 1px solid #e5e7eb;
}

.license-info-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.license-info-value {
  font-size: 13px;
  color: #111827;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.license-info-value--mono {
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  letter-spacing: 0.5px;
  font-size: 12px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot--active {
  background: #059669;
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.2);
}

.status-dot--free {
  background: #ca8a04;
  box-shadow: 0 0 0 3px rgba(202, 138, 4, 0.2);
}

.status-dot--expired {
  background: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.2);
}

.license-actions,
.license-free-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.license-manage-btn,
.license-upgrade-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s ease;
}

.license-manage-btn:hover,
.license-upgrade-btn:hover {
  background: #4f46e5;
}

.license-remove-btn,
.license-enter-key-btn {
  padding: 8px 16px;
  background: transparent;
  color: #6b7280;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.license-remove-btn:hover {
  color: #dc2626;
  border-color: #dc2626;
  background: #fef2f2;
}

.license-enter-key-btn:hover {
  color: #6366f1;
  border-color: #6366f1;
  background: #eef2ff;
}
```

### 5.4 License Settings Controller

```javascript
// src/options/license-settings.js

import { getLicenseInfo, removeLicense, getUserTier } from '../shared/license-manager.js';
import { showLicenseInput, maskLicenseKey } from '../shared/license-ui.js';

/**
 * Initialize the License & Subscription section on the options page.
 */
export function initLicenseSettings() {
  const tier = getUserTier();
  const licenseInfo = getLicenseInfo();

  const activeView = document.getElementById('license-active-view');
  const freeView = document.getElementById('license-free-view');

  if (tier === 'pro' || tier === 'team') {
    renderActiveLicense(licenseInfo, activeView);
    if (freeView) freeView.hidden = true;
    if (activeView) activeView.hidden = false;
  } else {
    renderFreeView(freeView);
    if (activeView) activeView.hidden = true;
    if (freeView) freeView.hidden = false;
  }
}

/**
 * Populate the active license card with real data.
 */
function renderActiveLicense(info, container) {
  if (!info || !container) return;

  const tierDisplay = document.getElementById('license-tier-display');
  const emailDisplay = document.getElementById('license-email-display');
  const keyDisplay = document.getElementById('license-key-display');
  const expiryDisplay = document.getElementById('license-expiry-display');

  if (tierDisplay) {
    const tierName = info.tier === 'team' ? 'Team' : 'Pro';
    const billingCycle = info.billingCycle === 'yearly' ? 'Yearly' : 'Monthly';
    tierDisplay.textContent = `${tierName} (${billingCycle})`;
  }

  if (emailDisplay && info.email) {
    emailDisplay.textContent = maskEmail(info.email);
  }

  if (keyDisplay && info.key) {
    keyDisplay.textContent = maskLicenseKey(info.key);
  }

  if (expiryDisplay && info.expiresAt) {
    const date = new Date(info.expiresAt);
    expiryDisplay.textContent = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Warn if expiring soon (within 7 days)
    const daysUntilExpiry = Math.ceil((date - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
      expiryDisplay.innerHTML += ` <span class="expiry-warning">(expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'})</span>`;
    } else if (daysUntilExpiry <= 0) {
      const statusDot = container.querySelector('.status-dot');
      if (statusDot) {
        statusDot.className = 'status-dot status-dot--expired';
      }
      expiryDisplay.innerHTML += ' <span class="expiry-warning expiry-warning--expired">(expired)</span>';
    }
  }

  // Remove license button
  const removeBtn = document.getElementById('license-remove-btn');
  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      handleRemoveLicense(container);
    });
  }
}

/**
 * Set up the free user view with expand-to-input behavior.
 */
function renderFreeView(container) {
  if (!container) return;

  const enterKeyBtn = document.getElementById('license-enter-key-btn');
  const inputContainer = document.getElementById('license-input-container');

  if (enterKeyBtn && inputContainer) {
    enterKeyBtn.addEventListener('click', () => {
      inputContainer.hidden = false;
      enterKeyBtn.hidden = true;
      showLicenseInput(inputContainer);

      // Focus the input after rendering
      setTimeout(() => {
        const input = inputContainer.querySelector('#license-key-input');
        if (input) input.focus();
      }, 100);
    });
  }
}

/**
 * Handle license removal with confirmation.
 */
async function handleRemoveLicense(container) {
  const confirmed = confirm(
    'Remove your license?\n\n' +
    'Your settings and data will be preserved, but Pro features will be locked ' +
    'until you re-enter a valid license key.'
  );

  if (!confirmed) return;

  try {
    await removeLicense();
    document.dispatchEvent(new CustomEvent('zovo:license-removed'));
    window.location.reload();
  } catch (err) {
    console.error('[license-settings] Failed to remove license:', err);
    alert('Failed to remove license. Please try again.');
  }
}

/**
 * Mask email for display: u***@example.com
 */
function maskEmail(email) {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 1) return `${local}***@${domain}`;
  return `${local[0]}***@${domain}`;
}

export { maskEmail };
```

---

## 6. Graceful Degradation (Pro to Free Downgrade)

### 6.1 Core Principle

**NEVER delete user data on downgrade.** All settings, session history, blocked site lists, custom configurations, sounds, and analytics are preserved in `chrome.storage.local`. When the user re-upgrades, everything is restored immediately without any data loss or re-configuration.

### 6.2 Downgrade Behavior Matrix

| Feature | Pro Behavior | After Downgrade | Data Preserved |
|---------|-------------|-----------------|:--------------:|
| **Blocklist** | Unlimited sites | All sites remain, cannot add beyond 10 | Yes |
| **Pre-built Lists** | All available | Only first 2 active, others deactivated | Yes |
| **Reports** | Full detail | Blurred (blur gate) | Yes |
| **Nuclear Mode** | Up to 24hr | Max 1hr | Yes |
| **Custom Timer** | Any duration | Revert to 25/5 default | Yes |
| **Ambient Sounds** | All sounds | 3 free sounds only, others locked | Yes |
| **Streak History** | Full history + recovery | Current streak only, no recovery | Yes |
| **Cross-device Sync** | Active syncing | Disabled, local-only mode | Yes |
| **Custom Block Page** | Custom design | Revert to default block page | Yes |
| **Password Protection** | Active | Disabled (password removed) | No |
| **Context Profiles** | Multiple active | Only default profile active | Yes |
| **Sound Mixing** | Multi-layer mixing | Single sound only | Yes |
| **Calendar Integration** | Active sync | Disconnected | Yes |
| **Session History** | Unlimited | Only last 7 days accessible | Yes |
| **Analytics Export** | CSV/JSON export | Locked | Yes |

### 6.3 Downgrade Handler

```javascript
// src/shared/downgrade-handler.js

import { FEATURE_REGISTRY } from './feature-gate.js';

/**
 * Handle Pro-to-Free downgrade gracefully.
 * Called when license expires, is removed, or verification fails.
 */
export async function handleDowngrade(previousTier) {
  console.log(`[downgrade] Processing downgrade from ${previousTier} to free`);

  const storage = await chrome.storage.local.get(null);
  const changes = {};

  // 1. Deactivate pro-only active features
  if (storage.customBlockPage?.enabled) {
    changes.customBlockPageBackup = { ...storage.customBlockPage };
    changes.customBlockPage = { ...storage.customBlockPage, enabled: false };
  }

  // 2. Revert timer to default if custom
  if (storage.timerSettings?.focusDuration !== 25 ||
      storage.timerSettings?.breakDuration !== 5) {
    changes.timerSettingsBackup = { ...storage.timerSettings };
    changes.timerSettings = {
      ...storage.timerSettings,
      focusDuration: 25,
      breakDuration: 5,
      longBreakDuration: 15,
      customized: false
    };
  }

  // 3. Disable cross-device sync
  if (storage.syncEnabled) {
    changes.syncEnabled = false;
    changes.syncEnabledBackup = true;
  }

  // 4. Disable password protection (security: cannot leave a lock with no key)
  if (storage.passwordProtection?.enabled) {
    changes.passwordProtection = { enabled: false };
    // Note: password hash is NOT preserved for security reasons
  }

  // 5. Deactivate extra pre-built lists beyond the free limit (2)
  if (storage.activePreBuiltLists && storage.activePreBuiltLists.length > 2) {
    changes.activePreBuiltListsBackup = [...storage.activePreBuiltLists];
    changes.activePreBuiltLists = storage.activePreBuiltLists.slice(0, 2);
  }

  // 6. Deactivate extra categories beyond the free limit (2)
  if (storage.activeCategories && storage.activeCategories.length > 2) {
    changes.activeCategoriesBackup = [...storage.activeCategories];
    changes.activeCategories = storage.activeCategories.slice(0, 2);
  }

  // 7. Switch to default context profile
  if (storage.activeProfile && storage.activeProfile !== 'default') {
    changes.activeProfileBackup = storage.activeProfile;
    changes.activeProfile = 'default';
  }

  // 8. Disable calendar integration
  if (storage.calendarIntegration?.connected) {
    changes.calendarIntegrationBackup = { ...storage.calendarIntegration };
    changes.calendarIntegration = { ...storage.calendarIntegration, connected: false };
  }

  // 9. Disable auto-start sessions
  if (storage.autoStartEnabled) {
    changes.autoStartEnabled = false;
    changes.autoStartEnabledBackup = true;
  }

  // 10. Record downgrade metadata
  changes.downgradeInfo = {
    previousTier,
    downgradeDate: Date.now(),
    backedUpFeatures: Object.keys(changes).filter(k => k.endsWith('Backup'))
  };

  // Apply all changes atomically
  await chrome.storage.local.set(changes);

  console.log(`[downgrade] Completed. ${Object.keys(changes).length} changes applied.`);

  // Notify the UI
  chrome.runtime.sendMessage({
    type: 'LICENSE_DOWNGRADED',
    payload: { previousTier, changes: Object.keys(changes) }
  });

  return changes;
}

/**
 * Restore backed-up settings when a user re-upgrades.
 * Called after a license is successfully activated.
 */
export async function handleUpgradeRestore() {
  const storage = await chrome.storage.local.get(null);
  const changes = {};

  // Find all backup keys and restore them
  const backupKeys = Object.keys(storage).filter(k => k.endsWith('Backup'));

  for (const backupKey of backupKeys) {
    const originalKey = backupKey.replace('Backup', '');
    if (storage[backupKey] !== undefined) {
      changes[originalKey] = storage[backupKey];
      changes[backupKey] = undefined; // Remove backup
    }
  }

  // Re-enable sync
  if (changes.syncEnabled === undefined && storage.syncEnabledBackup) {
    changes.syncEnabled = true;
  }

  // Clear downgrade info
  changes.downgradeInfo = undefined;

  if (Object.keys(changes).length > 0) {
    await chrome.storage.local.set(changes);
    console.log(`[upgrade-restore] Restored ${backupKeys.length} backed-up settings.`);
  }

  return changes;
}
```

### 6.4 Blocklist Downgrade Behavior Detail

The blocklist requires special handling because it is the most visible cap-gated feature:

1. **User has 25 sites blocked with Pro.**
2. **Pro expires.**
3. **All 25 sites remain in the blocklist and continue to be blocked.** The blocking engine does not check the license; it blocks whatever is in the list.
4. **The user cannot add site #26.** The `canAddSite(25)` check returns `{ allowed: false }`, and the UI shows the upgrade prompt.
5. **The user cannot remove sites to get below 10 and then add new ones at will.** Once they remove a site while over the cap, the count decreases normally, but they still cannot add beyond 10.
6. **If the user re-upgrades,** the limit is lifted and they can add unlimited sites again.

This approach is the least disruptive: existing blocking behavior is preserved, but growth is capped.

### 6.5 Notification on Downgrade

When a downgrade is detected (license expiry, removal, or failed re-verification), the user is shown a non-intrusive notification:

```javascript
// Show in the popup header
function showDowngradeNotice() {
  const notice = document.createElement('div');
  notice.className = 'downgrade-notice';
  notice.innerHTML = `
    <div class="downgrade-notice-content">
      <span class="downgrade-notice-icon">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="#ca8a04">
          <path d="M8 0a8 8 0 110 16A8 8 0 018 0zm0 3.5a.75.75 0 00-.75.75v4a.75.75 0 001.5 0v-4A.75.75 0 008 3.5zM8 12a1 1 0 100-2 1 1 0 000 2z"/>
        </svg>
      </span>
      <span>Your Pro subscription has ended. Your data is safe.</span>
      <a href="#" class="downgrade-notice-link" id="downgrade-reactivate">Reactivate</a>
      <button class="downgrade-notice-dismiss" id="downgrade-dismiss" aria-label="Dismiss">&times;</button>
    </div>
  `;

  const popup = document.getElementById('popup-container');
  if (popup) {
    popup.prepend(notice);
  }
}
```

---

## 7. Implementation Priority

### Priority Matrix

| Priority | Component | File(s) | Effort | Dependencies |
|:--------:|-----------|---------|:------:|:------------:|
| **P0** | Feature registry (`FEATURE_REGISTRY`) | `src/shared/feature-gate.js` | Low | None |
| **P0** | Core check functions (`checkFeatureAccess`, `isFeatureLocked`) | `src/shared/feature-gate.js` | Low | Registry |
| **P0** | `isPro()` / `hasFeature()` integration points | `src/shared/license-manager.js` | Low | Registry |
| **P0** | PRO badge rendering (`getProBadgeHTML`) | `src/shared/feature-gate.js` | Low | Registry |
| **P1** | Usage counter for blocklist, schedules, categories | `src/shared/feature-gate.js`, popup | Medium | Core checks |
| **P1** | License key input + format validation | `src/shared/license-ui.js` | Medium | None |
| **P1** | License verification API call | `src/shared/license-manager.js` | Medium | API spec |
| **P1** | Blur gate for reports and score breakdown | `src/shared/feature-gate.js`, CSS | Medium | Core checks |
| **P2** | Lock overlay for hard-gated features | `src/shared/feature-gate.js`, CSS | Low | Core checks |
| **P2** | Graceful downgrade handler | `src/shared/downgrade-handler.js` | Medium | License manager |
| **P2** | Upgrade restore handler | `src/shared/downgrade-handler.js` | Medium | Downgrade handler |
| **P3** | License settings section in options | `src/options/license-settings.js` | Medium | License UI |
| **P3** | Downgrade notification in popup | Popup UI | Low | Downgrade handler |
| **P3** | Feature gate analytics events | Background | Low | Event system |

### Estimated Total Effort

- **P0 items (must-ship):** ~2-3 days
- **P1 items (should-ship):** ~3-4 days
- **P2 items (nice-to-have for launch):** ~2-3 days
- **P3 items (can follow launch):** ~2 days

**Total: ~9-12 development days**

---

## 8. Integration Guide

### 8.1 How to Gate a Feature in the Popup

```javascript
import { checkFeatureAccess, getProBadgeHTML, getUsageCounterHTML } from '../shared/feature-gate.js';
import { showUpgradeModal } from '../shared/upgrade-modal.js';

// Example: Render a setting row with gating
function renderBlocklistSection(sites) {
  const access = checkFeatureAccess('manual_blocklist', sites.length);
  const badge = getProBadgeHTML('manual_blocklist');
  const counter = getUsageCounterHTML('manual_blocklist', sites.length, access.limit);

  return `
    <div class="section-header">
      <h3>Blocked Sites ${badge}</h3>
      ${counter}
    </div>
    <ul class="site-list">
      ${sites.map(site => `<li>${site}</li>`).join('')}
    </ul>
    <button id="add-site-btn" ${access.allowed ? '' : 'disabled'}>
      + Add Site
    </button>
  `;
}

// Example: Handle the add action
document.getElementById('add-site-btn').addEventListener('click', () => {
  const result = canAddSite(currentSites.length);
  if (!result.allowed) {
    showUpgradeModal('manual_blocklist', result.upgradeMessage);
    return;
  }
  // ... proceed with adding site
});
```

### 8.2 How to Gate a Feature in Settings

```javascript
import { isFeatureLocked, getLockOverlayHTML, getProBadgeHTML } from '../shared/feature-gate.js';
import { showUpgradeModal } from '../shared/upgrade-modal.js';

function renderSettingToggle(featureName, label, currentValue) {
  const locked = isFeatureLocked(featureName);
  const badge = getProBadgeHTML(featureName);

  return `
    <div class="setting-row ${locked ? 'setting-row--locked' : ''}"
         data-feature="${featureName}">
      <label class="setting-label">
        ${label} ${badge}
      </label>
      <div class="setting-control">
        ${locked
          ? `<button class="setting-unlock-btn" data-upgrade="${featureName}">Unlock</button>`
          : `<input type="checkbox" ${currentValue ? 'checked' : ''} />`
        }
      </div>
    </div>
  `;
}
```

### 8.3 How to Apply Blur Gates

```javascript
import { getBlurCSS, wrapWithGate } from '../shared/feature-gate.js';

// Method 1: CSS class
function renderWeeklyReport(reportData) {
  const blurClass = getBlurCSS('weekly_reports');
  return `<div class="weekly-report ${blurClass}">${renderReportContent(reportData)}</div>`;
}

// Method 2: Full wrapper (includes upgrade banner)
function renderScoreBreakdown(scoreData) {
  const content = renderBreakdownContent(scoreData);
  return wrapWithGate('focus_score_breakdown', content);
}
```

### 8.4 How to React to License Changes

```javascript
// In any UI component
document.addEventListener('zovo:license-activated', (e) => {
  console.log(`License activated: ${e.detail.tier}`);
  // Re-render UI without gates
  refreshUI();
});

document.addEventListener('zovo:license-removed', () => {
  console.log('License removed');
  // Re-render UI with gates
  refreshUI();
});

// In the background service worker
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'FEATURE_GATE_HIT') {
    // Track gate hits for analytics
    trackEvent('feature_gate_hit', {
      feature: msg.payload.feature,
      gateType: msg.payload.gateType,
      trigger: msg.payload.trigger
    });
  }

  if (msg.type === 'LICENSE_DOWNGRADED') {
    // Run downgrade cleanup
    handleDowngrade(msg.payload.previousTier);
  }
});
```

### 8.5 Testing Feature Gates

Feature gates can be tested without a real license by using the debug override in development:

```javascript
// Only available when extension is loaded unpacked
if (chrome.runtime.getManifest().update_url === undefined) {
  window.__ZOVO_DEBUG = {
    overrideTier: (tier) => {
      chrome.storage.local.set({ _debugTierOverride: tier });
      console.log(`[debug] Tier overridden to: ${tier}`);
      window.location.reload();
    },
    resetTier: () => {
      chrome.storage.local.remove('_debugTierOverride');
      console.log('[debug] Tier override removed');
      window.location.reload();
    },
    simulateDowngrade: () => {
      handleDowngrade('pro');
    },
    listGates: () => {
      Object.entries(FEATURE_REGISTRY).forEach(([name, config]) => {
        const access = checkFeatureAccess(name);
        console.log(`${access.allowed ? 'OK' : 'XX'} ${name} (${config.tier}) - ${access.gateType}`);
      });
    }
  };
}
```

Usage in the browser console:
```
__ZOVO_DEBUG.overrideTier('pro')    // Test as Pro user
__ZOVO_DEBUG.overrideTier('team')   // Test as Team user
__ZOVO_DEBUG.overrideTier('free')   // Test as Free user
__ZOVO_DEBUG.resetTier()            // Remove override
__ZOVO_DEBUG.listGates()            // Print all feature gate statuses
__ZOVO_DEBUG.simulateDowngrade()    // Test downgrade flow
```

---

## Appendix A: Feature-to-Gate Quick Reference

| Feature | Tier | Gate Type | Limit | Pro Feature Key |
|---------|------|-----------|-------|-----------------|
| `manual_blocklist` | free | cap | 10 sites | -- |
| `basic_pomodoro` | free | none | -- | -- |
| `background_timer` | free | none | -- | -- |
| `focus_score_number` | free | none | -- | -- |
| `distraction_counter` | free | none | -- | -- |
| `daily_focus_time` | free | none | -- | -- |
| `quick_focus` | free | none | -- | -- |
| `keyboard_shortcut` | free | none | -- | -- |
| `ambient_sounds` | free | cap | 3 sounds | -- |
| `notification_muting` | free | none | -- | -- |
| `browser_badge` | free | none | -- | -- |
| `focus_goals_daily` | free | none | -- | -- |
| `basic_session_history` | free | cap | 7 days | -- |
| `streak_current` | free | none | -- | -- |
| `percentile_comparison` | free | none | -- | -- |
| `pre_built_lists` | limited | cap | 2 lists | `unlimited_lists` |
| `nuclear_option` | limited | cap | 60 min | `extended_nuclear` |
| `schedule_blocking` | limited | cap | 1 schedule | `unlimited_schedules` |
| `category_blocking` | limited | cap | 2 categories | `all_categories` |
| `streak_history` | limited | soft | -- | `full_streak` |
| `weekly_reports` | limited | blur | -- | `full_reports` |
| `session_history` | limited | cap | 7 days | `full_session_history` |
| `timer_sounds` | limited | soft | -- | `custom_sounds` |
| `website_tracking` | limited | cap | 3 sites | `all_site_tracking` |
| `focus_buddy` | limited | cap | 1 buddy | `unlimited_buddies` |
| `focus_challenges` | limited | cap | 1 challenge | `unlimited_challenges` |
| `custom_block_page` | pro | hard | -- | `custom_block_page` |
| `whitelist_mode` | pro | hard | -- | `whitelist_mode` |
| `redirect_sites` | pro | hard | -- | `redirect_sites` |
| `password_protection` | pro | hard | -- | `password_protection` |
| `wildcard_blocking` | pro | hard | -- | `wildcard_blocking` |
| `custom_timer` | pro | hard | -- | `custom_timer` |
| `auto_start` | pro | hard | -- | `auto_start_sessions` |
| `break_customization` | pro | hard | -- | `break_customization` |
| `focus_score_breakdown` | pro | blur | -- | `focus_score_breakdown` |
| `exportable_analytics` | pro | hard | -- | `exportable_analytics` |
| `block_page_stats` | pro | hard | -- | `block_page_stats` |
| `calendar_integration` | pro | hard | -- | `calendar_integration` |
| `context_profiles` | pro | hard | -- | `context_profiles` |
| `ai_recommendations` | pro | hard | -- | `ai_recommendations` |
| `smart_scheduling` | pro | hard | -- | `smart_scheduling` |
| `distraction_prediction` | pro | hard | -- | `distraction_prediction` |
| `cross_device_sync` | pro | hard | -- | `cross_device_sync` |
| `sound_mixing` | pro | hard | -- | `sound_mixing` |
| `chrome_startup` | pro | hard | -- | `chrome_startup` |
| `selective_notifications` | pro | hard | -- | `selective_notifications` |
| `shareable_cards` | pro | hard | -- | `shareable_cards` |
| `global_leaderboards` | pro | hard | -- | `global_leaderboards` |
| `team_sessions` | team | hard | -- | `team_sessions` |
| `team_leaderboards` | team | hard | -- | `team_leaderboards` |
| `api_access` | team | hard | -- | `api_access` |
| `admin_dashboard` | team | hard | -- | `admin_dashboard` |
| `bulk_management` | team | hard | -- | `bulk_management` |
| `sso_integration` | team | hard | -- | `sso_integration` |
| `priority_support` | team | hard | -- | `priority_support` |

## Appendix B: Upgrade Trigger Points

Trigger codes referenced in the feature registry correspond to high-conversion moments identified in the user journey:

| Trigger | Moment | Feature | Expected Conversion |
|---------|--------|---------|:-------------------:|
| **T4** | User taps focus score and sees blurred breakdown | `focus_score_breakdown` | High |
| **T5** | User lands on default block page, sees "Customize" CTA | `custom_block_page` | Medium |
| **T7** | User tries to change timer from 25 min default | `custom_timer` | High |
| **T8** | User installs extension on second device | `cross_device_sync` | Very High |

These triggers feed into the analytics pipeline so the team can optimize upgrade conversion at each touchpoint.
