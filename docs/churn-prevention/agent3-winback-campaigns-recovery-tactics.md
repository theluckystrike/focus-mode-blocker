# WIN-BACK CAMPAIGNS & RECOVERY TACTICS: Focus Mode - Blocker
## Agent 3 — Email Sequences, Comeback Incentives, Dormant Reactivation & Update Re-engagement

> **Date:** February 11, 2026 | **Parent Phase:** 17 — Churn Prevention & Reactivation
> **Sections Covered:** 3 (Win-Back Campaigns) & 7 (Recovery Tactics)

---

## Table of Contents

1. [Win-Back Campaigns](#1-win-back-campaigns)
   - [1.1 Email Collection Strategy](#11-email-collection-strategy)
   - [1.2 Win-Back Email Sequence](#12-win-back-email-sequence)
   - [1.3 FocusIncentiveEngine](#13-focusincentiveengine)
2. [Recovery Tactics](#2-recovery-tactics)
   - [2.1 Dormant User Reactivation](#21-dormant-user-reactivation)
   - [2.2 Version Update Re-engagement](#22-version-update-re-engagement)
   - [2.3 Seasonal Re-engagement](#23-seasonal-re-engagement)
3. [Implementation Priority](#3-implementation-priority)

---

## 1. Win-Back Campaigns

### 1.1 Email Collection Strategy

Focus Mode - Blocker is a privacy-first extension with local-only data. Email collection is always optional and never required for Free tier functionality.

**Email touchpoints (opt-in only):**

| Touchpoint | Context | User Type | Required? |
|-----------|---------|-----------|-----------|
| Onboarding slide 5 | "Get focus tips & productivity updates" | All | No |
| Pro subscription checkout | Stripe requires email for payment | Pro | Yes (for billing) |
| Options page settings | "Email for updates & focus reports" | All | No |
| Milestone celebrations | "Share your achievement via email?" | All | No |
| Exit survey page | "Get notified when we add [requested feature]" | Churned | No |

```javascript
// email-collection.js — Optional email collection for Focus Mode - Blocker

class EmailCollector {
  /**
   * Save user's email preference.
   * Called from onboarding, options page, or milestone UI.
   */
  async saveEmail(email, source, preferences = {}) {
    // Store locally
    await chrome.storage.local.set({
      userEmail: email,
      emailSource: source,
      emailPreferences: {
        productUpdates: preferences.productUpdates ?? true,
        focusTips: preferences.focusTips ?? true,
        promotions: preferences.promotions ?? false, // Opt-in separately
        weeklyReport: preferences.weeklyReport ?? false
      },
      emailCollectedAt: new Date().toISOString()
    });

    // Register with Zovo email service (for win-back campaigns)
    await fetch('https://zovo.one/api/email/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        source,
        preferences,
        extensionVersion: chrome.runtime.getManifest().version
      })
    }).catch(() => {}); // Non-blocking
  }

  /**
   * Unsubscribe from all emails.
   */
  async unsubscribe() {
    const { userEmail } = await chrome.storage.local.get('userEmail');
    if (!userEmail) return;

    await chrome.storage.local.set({ emailPreferences: {} });

    await fetch('https://zovo.one/api/email/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail })
    }).catch(() => {});
  }
}
```

**Privacy & Compliance:**
- GDPR: Explicit opt-in checkbox, no pre-checked boxes
- CAN-SPAM: Physical address in email footer, one-click unsubscribe
- Email is NEVER shared with third parties
- Users can delete their email from options page at any time
- Win-back emails only sent to users who opted in to "product updates"

### 1.2 Win-Back Email Sequence

Five-email sequence sent after a user uninstalls Focus Mode - Blocker. Each email is personalized with the user's actual usage data (passed via uninstall URL parameters and stored server-side at time of uninstall).

**Day 1: "Your focus journey doesn't have to end"**

```javascript
// server/email-templates/winback-day1.js

const DAY1_TEMPLATE = {
  subject: 'Your focus journey doesn\'t have to end',
  delay: 1, // days after uninstall
  template: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #f3f4f6; }
    .container { max-width: 560px; margin: 0 auto; padding: 20px; }
    .card { background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { text-align: center; margin-bottom: 24px; }
    .header img { width: 48px; height: 48px; border-radius: 10px; }
    h1 { font-size: 20px; color: #1f2937; margin: 16px 0 8px; }
    p { font-size: 15px; color: #4b5563; line-height: 1.6; margin: 8px 0; }
    .stats-box { background: #f0f0ff; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .stats-box strong { color: #6366f1; }
    .cta-btn { display: inline-block; padding: 14px 32px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 16px 0; }
    .footer { text-align: center; font-size: 12px; color: #9ca3af; margin-top: 24px; }
    .footer a { color: #9ca3af; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <img src="https://zovo.one/assets/focus-mode-icon.png" alt="Focus Mode">
        <h1>We noticed you left Focus Mode</h1>
      </div>

      <p>Hi there,</p>

      <p>We're sorry to see you go. Before you move on, we wanted to share what you've accomplished:</p>

      {{#if totalSessions}}
      <div class="stats-box">
        <p>During your time with Focus Mode, you:</p>
        <ul style="padding-left: 20px;">
          <li>Completed <strong>{{totalSessions}} focus sessions</strong></li>
          {{#if totalHours}}<li>Spent <strong>~{{totalHours}} hours</strong> in deep focus</li>{{/if}}
          {{#if longestStreak}}<li>Built a <strong>{{longestStreak}}-day streak</strong></li>{{/if}}
          {{#if peakFocusScore}}<li>Reached a Focus Score of <strong>{{peakFocusScore}}</strong></li>{{/if}}
        </ul>
      </div>
      {{/if}}

      <p>We've also been busy improving things:</p>
      <ul style="padding-left: 20px; font-size: 15px; color: #4b5563;">
        {{#each recentImprovements}}
        <li>{{this}}</li>
        {{/each}}
      </ul>

      <div style="text-align: center;">
        <a href="{{reinstallUrl}}" class="cta-btn">Give Focus Mode Another Try</a>
      </div>

      <p style="font-size: 13px; color: #9ca3af;">
        If there's anything we could have done better, just reply to this email. We read every response.
      </p>
    </div>
    <div class="footer">
      <p>Zovo · <a href="https://zovo.one">zovo.one</a></p>
      <p><a href="{{unsubscribeUrl}}">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
  `
};
```

**Day 3: "Remember your streak?"**

```javascript
const DAY3_TEMPLATE = {
  subject: 'Remember your {{longestStreak}}-day streak?',
  subjectFallback: 'Remember when you were in the zone?',
  delay: 3,
  template: `
  <!-- Same HTML structure as Day 1, with this body: -->

  <p>Hi there,</p>

  <p>It's been a few days since you left Focus Mode. We thought you'd want to see what you achieved:</p>

  <div class="stats-box">
    <p style="font-size: 18px; text-align: center; margin-bottom: 12px;">
      <strong>Your Focus Mode Journey</strong>
    </p>
    <table style="width: 100%; font-size: 14px;">
      <tr><td style="padding: 6px 0;">Focus Sessions</td><td style="text-align: right; font-weight: 700; color: #6366f1;">{{totalSessions}}</td></tr>
      <tr><td style="padding: 6px 0;">Total Focus Time</td><td style="text-align: right; font-weight: 700; color: #6366f1;">~{{totalHours}} hours</td></tr>
      <tr><td style="padding: 6px 0;">Longest Streak</td><td style="text-align: right; font-weight: 700; color: #6366f1;">{{longestStreak}} days</td></tr>
      <tr><td style="padding: 6px 0;">Peak Focus Score</td><td style="text-align: right; font-weight: 700; color: #6366f1;">{{peakFocusScore}}/100</td></tr>
      <tr><td style="padding: 6px 0;">Distractions Blocked</td><td style="text-align: right; font-weight: 700; color: #6366f1;">{{totalBlocked}}</td></tr>
    </table>
  </div>

  <p>That's approximately <strong>{{estimatedTimeSaved}}</strong> of productive time you gained with Focus Mode.</p>

  <p>All your data — blocked sites, Focus Score history, settings — is still waiting for you.</p>

  <div style="text-align: center;">
    <a href="{{reinstallUrl}}" class="cta-btn">Pick Up Where You Left Off</a>
  </div>
  `
};
```

**Day 7: "A special offer from Zovo"**

```javascript
const DAY7_TEMPLATE = {
  subject: 'A special offer — just for you',
  delay: 7,
  template: `
  <!-- Personalized offer based on user type and uninstall reason -->

  <p>Hi there,</p>

  <p>We really want you back, and we're willing to prove it.</p>

  <div style="background: #fefce8; border: 2px solid #fbbf24; border-radius: 10px; padding: 20px; text-align: center; margin: 16px 0;">
    <p style="font-size: 13px; color: #92400e; margin-bottom: 4px;">EXCLUSIVE OFFER</p>
    <p style="font-size: 22px; font-weight: 700; color: #1f2937; margin: 8px 0;">{{offerHeadline}}</p>
    <p style="font-size: 14px; color: #78716c; margin-bottom: 16px;">{{offerDescription}}</p>
    <a href="{{offerUrl}}" style="display: inline-block; padding: 14px 32px; background: #f59e0b; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
      {{offerCTA}}
    </a>
    <p style="font-size: 12px; color: #d97706; margin-top: 10px;">Offer expires in 48 hours</p>
  </div>

  <p>No strings attached. If you're still not satisfied, cancel anytime.</p>
  `
};
```

**Day 14: "We've saved your focus data"**

```javascript
const DAY14_TEMPLATE = {
  subject: 'We\'ve saved your focus data — but not forever',
  delay: 14,
  template: `
  <p>Hi there,</p>

  <p>This is a quick heads-up: we've kept your Focus Mode data safe for the past 2 weeks.</p>

  <div class="stats-box">
    <p style="font-weight: 600;">Your saved data includes:</p>
    <ul style="padding-left: 20px;">
      <li>Your blocked sites list ({{blockedSitesCount}} sites)</li>
      <li>Focus Score history and {{longestStreak}}-day streak record</li>
      <li>All your settings and preferences</li>
      {{#if hasCustomTheme}}<li>Your custom block page theme</li>{{/if}}
    </ul>
  </div>

  <p>If you reinstall before <strong>{{dataExpiryDate}}</strong>, everything will be restored automatically. After that, your data will be permanently removed from our servers.</p>

  <div style="text-align: center;">
    <a href="{{reinstallUrl}}" class="cta-btn">Restore My Data</a>
  </div>

  <p style="font-size: 13px; color: #9ca3af;">This is our second-to-last email. We respect your inbox.</p>
  `
};
```

**Day 30: "One month later — quick question"**

```javascript
const DAY30_TEMPLATE = {
  subject: 'One month without Focus Mode — 60-second question',
  delay: 30,
  template: `
  <p>Hi there,</p>

  <p>It's been a month since you left Focus Mode. We've been improving based on feedback from users like you.</p>

  <p><strong>What would bring you back?</strong> (60-second survey)</p>

  <div style="margin: 16px 0;">
    <a href="{{surveyUrl}}&answer=better_pricing" style="display: block; padding: 10px 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; margin: 6px 0; text-decoration: none; color: #374151;">Better pricing</a>
    <a href="{{surveyUrl}}&answer=specific_feature" style="display: block; padding: 10px 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; margin: 6px 0; text-decoration: none; color: #374151;">A specific feature I need</a>
    <a href="{{surveyUrl}}&answer=fewer_bugs" style="display: block; padding: 10px 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; margin: 6px 0; text-decoration: none; color: #374151;">Fewer bugs / better performance</a>
    <a href="{{surveyUrl}}&answer=nothing" style="display: block; padding: 10px 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; margin: 6px 0; text-decoration: none; color: #374151;">Nothing — found something better</a>
  </div>

  <p>As a thank you for your feedback, we'll send you a <strong>free month of Pro</strong> regardless of your answer.</p>

  <div style="text-align: center;">
    <a href="{{surveyUrl}}" class="cta-btn">Take 60-Second Survey</a>
  </div>

  <p style="font-size: 13px; color: #9ca3af;">This is our last email. Thank you for being part of the Focus Mode community.</p>
  `
};
```

**Win-Back Campaign Scheduler:**

```javascript
// server/winback-scheduler.js — Schedules the 5-email win-back sequence

async function scheduleWinBackCampaign(userEmail, uninstallData) {
  // Check if user has email opt-in
  const user = await db.emailSubscribers.findUnique({ where: { email: userEmail } });
  if (!user || !user.preferences.productUpdates) return;

  // Don't send if user already reinstalled
  if (await hasReinstalled(userEmail)) return;

  // Select sequence based on uninstall reason
  const sequence = selectSequence(uninstallData.reason);

  // Gather personalized data for templates
  const templateData = {
    totalSessions: uninstallData.context.totalSessions,
    totalHours: Math.round(uninstallData.context.totalMinutes / 60),
    longestStreak: uninstallData.context.streak || 0,
    peakFocusScore: uninstallData.context.focusScore,
    totalBlocked: uninstallData.context.blockedSites || 0,
    estimatedTimeSaved: estimateTimeSaved(uninstallData.context.totalMinutes),
    blockedSitesCount: uninstallData.context.blockedSites,
    hasCustomTheme: uninstallData.context.featuresUsed > 5,
    reinstallUrl: 'https://chrome.google.com/webstore/detail/focus-mode-blocker/EXTENSION_ID',
    unsubscribeUrl: `https://zovo.one/unsubscribe?email=${encodeURIComponent(userEmail)}`,
    recentImprovements: await getRecentImprovements(),
    dataExpiryDate: formatDate(addDays(new Date(), 30)),
    surveyUrl: `https://zovo.one/winback-survey?email=${encodeURIComponent(userEmail)}`
  };

  // Generate personalized offer for Day 7
  const incentiveEngine = new FocusIncentiveEngine();
  const offer = await incentiveEngine.generateOffer(uninstallData);
  templateData.offerHeadline = offer.headline;
  templateData.offerDescription = offer.description;
  templateData.offerCTA = offer.cta;
  templateData.offerUrl = offer.url;

  // Schedule all 5 emails
  const templates = [DAY1_TEMPLATE, DAY3_TEMPLATE, DAY7_TEMPLATE, DAY14_TEMPLATE, DAY30_TEMPLATE];
  for (const template of templates) {
    await emailQueue.add({
      email: userEmail,
      template: template,
      data: templateData,
      sequence,
      sendAt: addDays(new Date(), template.delay)
    });
  }
}

function estimateTimeSaved(totalMinutes) {
  const hours = Math.round(totalMinutes / 60);
  if (hours >= 24) return `${Math.round(hours / 24)} days`;
  if (hours >= 1) return `${hours} hours`;
  return `${totalMinutes} minutes`;
}

function selectSequence(reason) {
  const map = {
    too_expensive: 'price_focused',
    bugs_issues: 'quality_focused',
    not_helpful: 'value_focused',
    found_alternative: 'competitive_focused',
    not_restrictive_enough: 'feature_focused',
    nuclear_too_intense: 'feature_focused',
    temporary: 'gentle_reminder'
  };
  return map[reason] || 'general';
}
```

### 1.3 FocusIncentiveEngine

Generates personalized comeback offers based on uninstall reason and user value.

```javascript
// server/incentive-engine.js — Personalized comeback offers for Focus Mode - Blocker

class FocusIncentiveEngine {
  constructor() {
    this.incentives = {
      price_focused: [
        {
          tier: 'low',
          headline: '50% off Pro for 3 months',
          description: 'Just $2.49/month for unlimited blocking, Nuclear Mode, and advanced stats.',
          cta: 'Claim 50% Off & Reinstall',
          type: 'discount',
          value: 50,
          duration: '3 months'
        },
        {
          tier: 'medium',
          headline: '30-day free Pro trial',
          description: 'Try every Pro feature free for 30 days. No credit card required.',
          cta: 'Start Free Trial',
          type: 'trial',
          value: 30,
          duration: '30 days'
        },
        {
          tier: 'high',
          headline: '70% off Lifetime Pro',
          description: 'One-time payment of $14.99 (normally $49.99). Unlimited Pro forever.',
          cta: 'Get Lifetime Pro — 70% Off',
          type: 'lifetime_discount',
          value: 70
        }
      ],
      value_focused: [
        {
          tier: 'low',
          headline: 'We\'ve added new features',
          description: 'Check out what\'s new in Focus Mode. We think you\'ll love it.',
          cta: 'See What\'s New',
          type: 'feature_highlight'
        },
        {
          tier: 'medium',
          headline: '60-day extended Pro trial',
          description: 'Double the standard trial. Explore every feature at your own pace.',
          cta: 'Start 60-Day Trial',
          type: 'extended_trial',
          value: 60
        },
        {
          tier: 'high',
          headline: 'Personal onboarding session',
          description: 'A 15-minute call to set up Focus Mode perfectly for your workflow.',
          cta: 'Book Your Session',
          type: 'onboarding_call'
        }
      ],
      quality_focused: [
        {
          tier: 'low',
          headline: 'We fixed the bugs',
          description: 'Our latest update addresses the issues you experienced. Give us another chance.',
          cta: 'Try the Fixed Version',
          type: 'bug_fix_notice'
        },
        {
          tier: 'medium',
          headline: 'Priority support — 6 months free',
          description: 'Direct access to our engineering team if you encounter any issues.',
          cta: 'Get Priority Support',
          type: 'priority_support',
          duration: '6 months'
        },
        {
          tier: 'high',
          headline: 'Beta tester access',
          description: 'Help shape Focus Mode\'s future. Get new features before anyone else.',
          cta: 'Join the Beta',
          type: 'beta_access'
        }
      ],
      competitive_focused: [
        {
          tier: 'low',
          headline: 'What are we missing?',
          description: 'Tell us what the other tool does better, and we\'ll prioritize building it.',
          cta: 'Share Your Feedback',
          type: 'feature_request'
        },
        {
          tier: 'medium',
          headline: 'We\'ll match their features',
          description: 'Share what you need and we\'ll fast-track development. Plus 3 months Pro free.',
          cta: 'Tell Us & Get 3 Months Free',
          type: 'feature_match',
          value: 3
        },
        {
          tier: 'high',
          headline: 'We\'ll beat their price',
          description: 'Whatever you\'re paying for the alternative, we\'ll offer Focus Mode Pro for less.',
          cta: 'Get Your Custom Price',
          type: 'price_match'
        }
      ],
      feature_focused: [
        {
          tier: 'all',
          headline: 'Try Nuclear Mode — free for 7 days',
          description: 'Nuclear Mode makes blocking truly unbypassable. The strongest focus tool available.',
          cta: 'Activate Nuclear Mode Trial',
          type: 'nuclear_trial',
          value: 7
        }
      ],
      gentle_reminder: [
        {
          tier: 'all',
          headline: 'We\'ll be here when you\'re ready',
          description: 'Focus Mode is free to reinstall. Your data is waiting for you.',
          cta: 'Reinstall Focus Mode',
          type: 'soft_reminder'
        }
      ]
    };
  }

  /**
   * Generate the best offer for this user based on their uninstall reason and value.
   */
  async generateOffer(uninstallData) {
    const sequence = this.getSequence(uninstallData.reason);
    const userValue = this.calculateUserValue(uninstallData.context);
    const incentiveOptions = this.incentives[sequence] || this.incentives.value_focused;

    // Select incentive based on user value tier
    let incentive;
    if (incentiveOptions.length === 1 || incentiveOptions[0].tier === 'all') {
      incentive = incentiveOptions[0];
    } else {
      const tierMap = { high: 2, medium: 1, low: 0 };
      incentive = incentiveOptions[tierMap[userValue]] || incentiveOptions[0];
    }

    // Generate unique offer code
    const offerCode = 'FOCUS-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    // Store offer in database
    await db.offers.create({
      code: offerCode,
      incentive,
      uninstallReason: uninstallData.reason,
      userValue,
      expiresAt: addDays(new Date(), 7),
      createdAt: new Date()
    });

    return {
      ...incentive,
      code: offerCode,
      url: `https://zovo.one/offer/${offerCode}?source=winback_email`
    };
  }

  calculateUserValue(context) {
    let score = 0;

    // Pro subscribers are high-value
    if (context.tier === 'pro') score += 40;

    // Long-term users are valuable
    if (context.daysInstalled > 60) score += 20;
    else if (context.daysInstalled > 30) score += 10;

    // Active users are valuable
    if (context.totalSessions > 50) score += 20;
    else if (context.totalSessions > 20) score += 10;

    // Feature-rich users are invested
    if (context.featuresUsed > 5) score += 10;

    // High Focus Score users are engaged
    if (context.focusScore > 70) score += 10;

    if (score >= 60) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  }

  getSequence(reason) {
    const map = {
      too_expensive: 'price_focused',
      bugs_issues: 'quality_focused',
      not_helpful: 'value_focused',
      found_alternative: 'competitive_focused',
      not_restrictive_enough: 'feature_focused',
      nuclear_too_intense: 'feature_focused',
      temporary: 'gentle_reminder'
    };
    return map[reason] || 'value_focused';
  }
}
```

---

## 2. Recovery Tactics

### 2.1 Dormant User Reactivation

For users who still have Focus Mode - Blocker installed but have stopped using it. These users are the easiest to recover because the extension is still present — no reinstall needed.

```javascript
// dormant-reactivation.js — In-extension reactivation for dormant Focus Mode users
// Runs in the service worker via chrome.alarms

class DormantUserReactivation {
  constructor() {
    this.DORMANT_THRESHOLDS = {
      gentle: 7,     // 7 days inactive → gentle nudge
      moderate: 14,  // 14 days inactive → moderate reminder
      urgent: 21,    // 21 days inactive → urgent with new feature highlight
      final: 30      // 30 days inactive → final attempt
    };

    // Maximum notifications: 1 per week, 4 total
    this.MAX_NOTIFICATIONS = 4;
    this.MIN_DAYS_BETWEEN = 7;
  }

  /**
   * Check if user is dormant and send appropriate notification.
   * Called daily by the churn analysis alarm.
   */
  async checkAndReactivate() {
    const data = await this.getDormancyData();

    // Not dormant yet
    if (data.daysSinceLastSession < this.DORMANT_THRESHOLDS.gentle) return;

    // Already sent max notifications
    if (data.reactivationAttempts >= this.MAX_NOTIFICATIONS) return;

    // Too soon since last notification
    if (data.daysSinceLastNotification < this.MIN_DAYS_BETWEEN) return;

    // Check notification permission
    const { notificationsEnabled } = await chrome.storage.local.get('notificationsEnabled');
    if (notificationsEnabled === false) return; // Respect user settings

    // Select and send appropriate strategy
    const strategy = this.selectStrategy(data);
    await this.executeStrategy(strategy, data);

    // Record the attempt
    await this.recordAttempt(strategy);
  }

  async getDormancyData() {
    const storage = await chrome.storage.local.get([
      'focusSessionHistory', 'currentStreak', 'focusScore',
      'subscription', 'featureUsageMap', 'nuclearModeHistory',
      'reactivationHistory'
    ]);

    const sessionHistory = storage.focusSessionHistory || [];
    const lastSession = sessionHistory[sessionHistory.length - 1];
    const daysSinceLastSession = lastSession
      ? Math.floor((Date.now() - new Date(lastSession.date).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    const reactivationHistory = storage.reactivationHistory || [];
    const lastAttempt = reactivationHistory[reactivationHistory.length - 1];
    const daysSinceLastNotification = lastAttempt
      ? Math.floor((Date.now() - new Date(lastAttempt.timestamp).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    const totalSessions = sessionHistory.reduce((s, d) => s + (d.sessionsCompleted || 0), 0);
    const nuclearUses = (storage.nuclearModeHistory || []).filter(d => d.used).length;

    return {
      daysSinceLastSession,
      daysSinceLastNotification,
      reactivationAttempts: reactivationHistory.length,
      currentStreak: storage.currentStreak || 0,
      focusScore: storage.focusScore || 0,
      isPro: storage.subscription?.tier === 'pro',
      totalSessions,
      featuresUsed: Object.keys(storage.featureUsageMap || {}).length,
      nuclearModeUses: nuclearUses
    };
  }

  selectStrategy(data) {
    // Pro subscriber dormant → remind of paid features
    if (data.isPro) return 'premium_value_reminder';

    // Power user (50+ sessions) → nostalgia appeal
    if (data.totalSessions > 50) return 'power_user_nostalgia';

    // Had a good streak → fresh start appeal
    if (data.currentStreak > 0 || data.focusScore > 50) return 'streak_restart';

    // Default: highlight new features
    return 'feature_update';
  }

  async executeStrategy(strategy, data) {
    const notification = this.buildNotification(strategy, data);

    // Send Chrome notification
    chrome.notifications.create(`reactivation-${Date.now()}`, {
      type: 'basic',
      iconUrl: 'assets/icons/icon128.png',
      title: notification.title,
      message: notification.message,
      priority: 1,
      buttons: notification.buttons || []
    });

    // Also set badge to draw attention to popup
    chrome.action.setBadgeText({ text: notification.badge || '' });
    chrome.action.setBadgeBackgroundColor({ color: notification.badgeColor || '#6366f1' });
  }

  buildNotification(strategy, data) {
    switch (strategy) {
      case 'premium_value_reminder':
        return {
          title: 'Your Pro features are waiting',
          message: `You're paying for Nuclear Mode, unlimited blocking, and advanced stats — but haven't used them in ${data.daysSinceLastSession} days. Start a quick focus session?`,
          badge: 'Pro',
          badgeColor: '#a855f7',
          buttons: [{ title: 'Start Focus Session' }]
        };

      case 'power_user_nostalgia':
        return {
          title: `Remember your ${data.totalSessions} focus sessions?`,
          message: `You were one of our most dedicated users. Your Focus Score was ${data.focusScore}. One session is all it takes to get back on track.`,
          badge: '!',
          badgeColor: '#3b82f6',
          buttons: [{ title: 'Start a Session' }]
        };

      case 'streak_restart':
        return {
          title: 'Ready for a fresh start?',
          message: 'Every champion has off days. Start a new streak today — even a 15-minute session counts.',
          badge: '1',
          badgeColor: '#22c55e',
          buttons: [{ title: 'Start New Streak' }]
        };

      case 'feature_update':
      default:
        return {
          title: 'Focus Mode just got better',
          message: 'We\'ve added new features and improvements. Check it out!',
          badge: 'New',
          badgeColor: '#6366f1',
          buttons: [{ title: 'See What\'s New' }]
        };
    }
  }

  async recordAttempt(strategy) {
    const { reactivationHistory = [] } = await chrome.storage.local.get('reactivationHistory');
    reactivationHistory.push({
      strategy,
      timestamp: new Date().toISOString()
    });

    // Keep only last 10 attempts
    const trimmed = reactivationHistory.slice(-10);
    await chrome.storage.local.set({ reactivationHistory: trimmed });
  }
}

// === Notification Click Handler ===
chrome.notifications.onClicked.addListener(async (notificationId) => {
  if (notificationId.startsWith('reactivation-')) {
    // Clear badge
    chrome.action.setBadgeText({ text: '' });

    // Open popup (focus session start)
    chrome.action.openPopup();

    // Track reactivation success
    const { reactivationHistory = [] } = await chrome.storage.local.get('reactivationHistory');
    const lastAttempt = reactivationHistory[reactivationHistory.length - 1];
    if (lastAttempt) {
      lastAttempt.clicked = true;
      await chrome.storage.local.set({ reactivationHistory });
    }
  }
});

// === Service Worker Alarm Integration ===
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'dailyChurnAnalysis') {
    // After churn analysis, also check for dormant reactivation
    const reactivator = new DormantUserReactivation();
    await reactivator.checkAndReactivate();
  }
});
```

### 2.2 Version Update Re-engagement

When Focus Mode - Blocker updates, use the `chrome.runtime.onInstalled` event to re-engage dormant users with personalized "What's New" content.

```javascript
// update-reengagement.js — Re-engage dormant users on extension update

class UpdateReengagement {
  /**
   * Handle extension update event.
   * Called from chrome.runtime.onInstalled with reason === 'update'.
   */
  async handleUpdate(previousVersion, currentVersion) {
    const daysSinceActive = await this.getDaysSinceActive();

    // Only show "What's New" to dormant users (7+ days inactive)
    if (daysSinceActive < 7) return;

    // Get update highlights relevant to this user
    const highlights = await this.getPersonalizedHighlights(currentVersion);
    if (highlights.length === 0) return;

    // Store highlights for the popup/options page to display
    await chrome.storage.local.set({
      updateHighlights: {
        version: currentVersion,
        previousVersion,
        highlights,
        shown: false,
        timestamp: new Date().toISOString()
      }
    });

    // Show notification for very dormant users (14+ days)
    if (daysSinceActive >= 14) {
      chrome.notifications.create('update-reengagement', {
        type: 'basic',
        iconUrl: 'assets/icons/icon128.png',
        title: `Focus Mode v${currentVersion} — What's New`,
        message: highlights[0].description,
        priority: 1
      });
    }

    // Set badge to indicate new version
    chrome.action.setBadgeText({ text: 'New' });
    chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });
  }

  async getDaysSinceActive() {
    const { focusSessionHistory = [] } = await chrome.storage.local.get('focusSessionHistory');
    if (focusSessionHistory.length === 0) return 999;
    const lastSession = focusSessionHistory[focusSessionHistory.length - 1];
    return Math.floor((Date.now() - new Date(lastSession.date).getTime()) / (1000 * 60 * 60 * 24));
  }

  async getPersonalizedHighlights(version) {
    // Version highlights database (would be fetched from server in production)
    const ALL_HIGHLIGHTS = {
      '2.1.0': [
        { id: 'improved_timer', category: 'timer', description: 'Improved Pomodoro timer with customizable work/break durations', forUsers: 'timer_users' },
        { id: 'new_themes', category: 'block_page', description: '5 new block page themes including Dark Mode and Minimal', forUsers: 'theme_users' },
        { id: 'performance', category: 'performance', description: '50% faster blocking — sites blocked before they even start loading', forUsers: 'all' },
        { id: 'nuclear_improvements', category: 'nuclear', description: 'Nuclear Mode now shows countdown timer and motivational quotes', forUsers: 'nuclear_users' }
      ]
    };

    const highlights = ALL_HIGHLIGHTS[version] || [];
    const { featureUsageMap = {} } = await chrome.storage.local.get('featureUsageMap');

    // Filter highlights relevant to this user's usage patterns
    return highlights.filter(h => {
      if (h.forUsers === 'all') return true;
      if (h.forUsers === 'timer_users' && featureUsageMap.pomodoro_timer) return true;
      if (h.forUsers === 'theme_users' && featureUsageMap.custom_block_page) return true;
      if (h.forUsers === 'nuclear_users' && featureUsageMap.nuclear_mode) return true;
      return false;
    });
  }
}

// === Integration with chrome.runtime.onInstalled ===
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'update') {
    const reengager = new UpdateReengagement();
    await reengager.handleUpdate(
      details.previousVersion,
      chrome.runtime.getManifest().version
    );
  }
});
```

### 2.3 Seasonal Re-engagement

Productivity-relevant timing triggers for Focus Mode - Blocker users.

```javascript
// seasonal-reengagement.js — Date-based reactivation triggers

class SeasonalReengagement {
  constructor() {
    this.CAMPAIGNS = [
      {
        id: 'new_year',
        name: 'New Year Focus',
        checkMonth: 1, // January
        checkDays: [1, 2, 3, 4, 5],
        title: 'New year, fresh Focus Score!',
        message: 'Start 2026 with a clean slate. Reset your Focus Score and build new habits.',
        targetDormantDays: 7
      },
      {
        id: 'back_to_school',
        name: 'Back to School',
        checkMonth: 9, // September (also August 25-31)
        checkDays: [1, 2, 3, 4, 5],
        title: 'New semester, new focus goals!',
        message: 'Block distracting sites before classes start. Your grades will thank you.',
        targetDormantDays: 14
      },
      {
        id: 'exam_season_fall',
        name: 'Fall Exams',
        checkMonth: 12, // December
        checkDays: [1, 2, 3, 4, 5],
        title: 'Finals week? Nuclear Mode is ready.',
        message: 'Lock down distractions during exam season. Nuclear Mode blocks everything.',
        targetDormantDays: 7
      },
      {
        id: 'exam_season_spring',
        name: 'Spring Exams',
        checkMonth: 5, // May
        checkDays: [1, 2, 3, 4, 5],
        title: 'End-of-year exams? Focus Mode has your back.',
        message: 'Block social media, gaming sites, and streaming. One click to total focus.',
        targetDormantDays: 7
      },
      {
        id: 'productivity_monday',
        name: 'Productivity Monday',
        checkDayOfWeek: 1, // Monday
        frequency: 'monthly_first', // First Monday of each month
        title: 'Start the month focused',
        message: 'It\'s Productivity Monday! Set your focus goals for the month.',
        targetDormantDays: 14
      }
    ];
  }

  /**
   * Check if any seasonal campaign should fire today.
   * Called by the daily alarm handler.
   */
  async checkSeasonalTriggers() {
    const now = new Date();
    const daysSinceActive = await this.getDaysSinceActive();

    for (const campaign of this.CAMPAIGNS) {
      if (daysSinceActive < campaign.targetDormantDays) continue;
      if (await this.alreadySent(campaign.id)) continue;

      if (this.shouldFire(campaign, now)) {
        await this.sendSeasonalNotification(campaign);
        await this.recordSent(campaign.id);
      }
    }
  }

  shouldFire(campaign, now) {
    if (campaign.checkMonth && campaign.checkDays) {
      return now.getMonth() + 1 === campaign.checkMonth && campaign.checkDays.includes(now.getDate());
    }
    if (campaign.checkDayOfWeek !== undefined && campaign.frequency === 'monthly_first') {
      return now.getDay() === campaign.checkDayOfWeek && now.getDate() <= 7;
    }
    return false;
  }

  async sendSeasonalNotification(campaign) {
    chrome.notifications.create(`seasonal-${campaign.id}`, {
      type: 'basic',
      iconUrl: 'assets/icons/icon128.png',
      title: campaign.title,
      message: campaign.message,
      priority: 1
    });
  }

  async getDaysSinceActive() {
    const { focusSessionHistory = [] } = await chrome.storage.local.get('focusSessionHistory');
    if (focusSessionHistory.length === 0) return 999;
    const last = focusSessionHistory[focusSessionHistory.length - 1];
    return Math.floor((Date.now() - new Date(last.date).getTime()) / (1000 * 60 * 60 * 24));
  }

  async alreadySent(campaignId) {
    const { seasonalCampaignsSent = {} } = await chrome.storage.local.get('seasonalCampaignsSent');
    const lastSent = seasonalCampaignsSent[campaignId];
    if (!lastSent) return false;
    // Don't resend within 30 days
    return (Date.now() - new Date(lastSent).getTime()) < 30 * 24 * 60 * 60 * 1000;
  }

  async recordSent(campaignId) {
    const { seasonalCampaignsSent = {} } = await chrome.storage.local.get('seasonalCampaignsSent');
    seasonalCampaignsSent[campaignId] = new Date().toISOString();
    await chrome.storage.local.set({ seasonalCampaignsSent });
  }
}
```

---

## 3. Implementation Priority

| Priority | Component | Location | Complexity | Effort |
|----------|-----------|----------|------------|--------|
| P0 | EmailCollector class | Extension | Low | 3 hours |
| P1 | Win-back email templates (5 emails) | Server | Medium | 8 hours |
| P1 | Win-back campaign scheduler | Server | Medium | 6 hours |
| P1 | FocusIncentiveEngine | Server | Medium | 6 hours |
| P1 | DormantUserReactivation class | Extension | Medium | 6 hours |
| P1 | Notification click handlers | Extension | Low | 2 hours |
| P2 | UpdateReengagement class | Extension | Medium | 4 hours |
| P2 | Email template HTML/CSS | Server | Medium | 6 hours |
| P2 | Offer code generation & tracking | Server | Medium | 4 hours |
| P3 | SeasonalReengagement class | Extension | Low | 3 hours |
| P3 | Win-back analytics & A/B testing | Server | High | 8 hours |

**Total estimated effort: 56 hours (≈7 working days)**

**Key Dependencies:**
- Email service provider (SendGrid, Resend, or Postmark) for win-back emails
- Server-side email queue (Bull/BullMQ or similar) for scheduled delivery
- Stripe integration (Phase 9) for offer code redemption
- Agent 1's churn detection triggers dormant reactivation
- Agent 2's exit survey feeds uninstall data to win-back scheduler

---

*Agent 3 — Win-Back Campaigns & Recovery Tactics — Complete*
