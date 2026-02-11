# EXIT SURVEY & DOWNGRADE FLOW: Focus Mode - Blocker
## Agent 2 — Uninstall Survey System, Feedback Processing & Pro→Free Downgrade Optimization

> **Date:** February 11, 2026 | **Parent Phase:** 17 — Churn Prevention & Reactivation
> **Sections Covered:** 2 (Exit Survey System) & 4 (Downgrade Flow Optimization)

---

## Table of Contents

1. [Exit Survey System](#1-exit-survey-system)
   - [1.1 Uninstall URL Configuration](#11-uninstall-url-configuration)
   - [1.2 Exit Survey Page](#12-exit-survey-page)
   - [1.3 Feedback Categorization](#13-feedback-categorization)
   - [1.4 Weekly Feedback Reports](#14-weekly-feedback-reports)
2. [Downgrade Flow Optimization](#2-downgrade-flow-optimization)
   - [2.1 FocusDowngradeFlow Class](#21-focusdowngradeflow-class)
   - [2.2 Retention Modal UI](#22-retention-modal-ui)
   - [2.3 Downgrade Survey](#23-downgrade-survey)
   - [2.4 Graceful Downgrade Process](#24-graceful-downgrade-process)
3. [Implementation Priority](#3-implementation-priority)

---

## 1. Exit Survey System

### 1.1 Uninstall URL Configuration

Focus Mode - Blocker uses `chrome.runtime.setUninstallURL()` to direct users to an exit survey hosted at `zovo.one/uninstall-survey` when they uninstall the extension. The URL includes anonymous context parameters to personalize the survey experience.

```javascript
// exit-survey-handler.js — Manages uninstall URL for Focus Mode - Blocker
// Integrated into the service worker

class ExitSurveyHandler {
  constructor() {
    this.BASE_URL = 'https://zovo.one/uninstall-survey';
  }

  /**
   * Set the initial uninstall URL during extension installation.
   * Called from chrome.runtime.onInstalled handler.
   */
  async setInitialUninstallURL(installDetails) {
    const params = await this.buildParams();
    params.set('installReason', installDetails.reason); // 'install' or 'update'
    params.set('version', chrome.runtime.getManifest().version);

    chrome.runtime.setUninstallURL(`${this.BASE_URL}?${params.toString()}`);
  }

  /**
   * Update the uninstall URL when user state changes significantly.
   * Called when: user upgrades to Pro, completes onboarding, reaches milestones.
   */
  async updateUninstallURL() {
    const params = await this.buildParams();
    chrome.runtime.setUninstallURL(`${this.BASE_URL}?${params.toString()}`);
  }

  /**
   * Build anonymous query parameters from user state.
   * Privacy: NO email, NO user ID, NO personal data.
   * Only aggregate stats that help personalize the survey.
   */
  async buildParams() {
    const storage = await chrome.storage.local.get([
      'subscription', 'focusScore', 'currentStreak',
      'focusSessionHistory', 'blockedSites', 'featureUsageMap',
      'nuclearModeHistory', 'onboardingCompleted'
    ]);

    const sessionHistory = storage.focusSessionHistory || [];
    const totalSessions = sessionHistory.reduce((s, d) => s + (d.sessionsCompleted || 0), 0);
    const totalMinutes = sessionHistory.reduce((s, d) => s + (d.totalMinutes || 0), 0);
    const nuclearUses = (storage.nuclearModeHistory || []).filter(d => d.used).length;
    const featuresUsed = Object.keys(storage.featureUsageMap || {}).length;

    // Calculate days installed (approximate from session history)
    const firstSession = sessionHistory[0];
    const daysInstalled = firstSession
      ? Math.floor((Date.now() - new Date(firstSession.date).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const params = new URLSearchParams({
      tier: storage.subscription?.tier || 'free',
      plan: storage.subscription?.plan || 'none',
      v: chrome.runtime.getManifest().version,
      days: String(daysInstalled),
      fs: String(storage.focusScore || 0),           // Focus Score
      streak: String(storage.currentStreak || 0),
      sessions: String(totalSessions),
      mins: String(totalMinutes),
      sites: String((storage.blockedSites || []).length),
      nuclear: String(nuclearUses),
      features: String(featuresUsed),
      onboarded: storage.onboardingCompleted ? '1' : '0'
    });

    return params;
  }
}

// === Service Worker Integration ===

const exitSurveyHandler = new ExitSurveyHandler();

chrome.runtime.onInstalled.addListener(async (details) => {
  await exitSurveyHandler.setInitialUninstallURL(details);
});

// Update uninstall URL when subscription changes
chrome.storage.onChanged.addListener(async (changes) => {
  if (changes.subscription || changes.focusScore || changes.currentStreak) {
    await exitSurveyHandler.updateUninstallURL();
  }
});
```

### 1.2 Exit Survey Page

Complete HTML page hosted at `zovo.one/uninstall-survey`. Styled to match Zovo's brand identity with Focus Mode - Blocker-specific uninstall reasons and conditional offers.

```html
<!-- zovo.one/uninstall-survey/index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Focus Mode - Blocker | We're sorry to see you go</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }

    .survey-card {
      background: white;
      border-radius: 16px;
      padding: 40px;
      max-width: 540px;
      width: 100%;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.3);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 24px;
    }

    .logo img { width: 32px; height: 32px; border-radius: 6px; }
    .logo span { font-weight: 700; font-size: 18px; color: #1f2937; }

    h1 { font-size: 22px; margin-bottom: 6px; color: #1f2937; }
    .subtitle { color: #6b7280; margin-bottom: 24px; font-size: 14px; }

    .stats-summary {
      background: #f0f0ff;
      border-radius: 10px;
      padding: 14px 16px;
      margin-bottom: 20px;
      font-size: 13px;
      color: #4b5563;
      line-height: 1.6;
    }

    .stats-summary strong { color: #6366f1; }

    .reason-option {
      display: block;
      padding: 12px 16px;
      margin: 6px 0;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;
      color: #374151;
    }

    .reason-option:hover { border-color: #6366f1; background: #f5f3ff; }
    .reason-option.selected { border-color: #6366f1; background: #ede9fe; }
    .reason-option input[type="radio"] { display: none; }

    textarea {
      width: 100%;
      padding: 12px;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      margin-top: 16px;
      resize: vertical;
      min-height: 80px;
      font-family: inherit;
      font-size: 14px;
    }

    textarea:focus { outline: none; border-color: #6366f1; }

    .offer-box {
      background: #fefce8;
      border: 1px solid #fbbf24;
      border-radius: 10px;
      padding: 16px;
      margin-top: 16px;
      display: none;
    }

    .offer-box.show { display: block; }

    .offer-box h3 { font-size: 15px; color: #92400e; margin-bottom: 6px; }
    .offer-box p { font-size: 13px; color: #78716c; margin-bottom: 12px; }

    .offer-btn {
      background: #22c55e;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
    }

    .offer-btn:hover { background: #16a34a; }

    .tip-box {
      background: #ecfdf5;
      border: 1px solid #6ee7b7;
      border-radius: 10px;
      padding: 16px;
      margin-top: 16px;
      display: none;
    }

    .tip-box.show { display: block; }
    .tip-box h3 { font-size: 15px; color: #065f46; margin-bottom: 6px; }
    .tip-box p { font-size: 13px; color: #047857; }

    .submit-btn {
      width: 100%;
      padding: 14px;
      background: #6366f1;
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 20px;
      transition: background 0.2s;
    }

    .submit-btn:hover { background: #4f46e5; }

    .thank-you { text-align: center; }
    .thank-you h2 { color: #6366f1; margin-bottom: 12px; font-size: 22px; }
    .thank-you p { color: #6b7280; font-size: 14px; margin-bottom: 8px; }
    .thank-you a { color: #6366f1; text-decoration: none; font-weight: 600; }
    .thank-you a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <!-- Survey Form -->
  <div class="survey-card" id="surveyForm">
    <div class="logo">
      <img src="/assets/icon-32.png" alt="Focus Mode">
      <span>Focus Mode - Blocker</span>
    </div>

    <h1>We're sorry to see you go!</h1>
    <p class="subtitle">Your feedback helps us make Focus Mode better for everyone.</p>

    <!-- Dynamic stats summary (populated via JS) -->
    <div class="stats-summary" id="statsSummary" style="display: none;"></div>

    <form id="exitSurvey">
      <label class="reason-option">
        <input type="radio" name="reason" value="not_helpful">
        Didn't help me stay focused
      </label>
      <label class="reason-option">
        <input type="radio" name="reason" value="too_restrictive">
        Too many blocked sites / too restrictive
      </label>
      <label class="reason-option">
        <input type="radio" name="reason" value="not_restrictive_enough">
        Not restrictive enough / easy to bypass
      </label>
      <label class="reason-option">
        <input type="radio" name="reason" value="found_alternative">
        Found a better focus/blocking tool
      </label>
      <label class="reason-option" id="pricingOption">
        <input type="radio" name="reason" value="too_expensive">
        Pro is too expensive
      </label>
      <label class="reason-option">
        <input type="radio" name="reason" value="bugs_issues">
        Bugs or performance issues
      </label>
      <label class="reason-option">
        <input type="radio" name="reason" value="dont_need">
        Don't need website blocking anymore
      </label>
      <label class="reason-option">
        <input type="radio" name="reason" value="nuclear_too_intense">
        Nuclear Mode was too intense
      </label>
      <label class="reason-option">
        <input type="radio" name="reason" value="temporary">
        Just taking a break
      </label>
      <label class="reason-option">
        <input type="radio" name="reason" value="other">
        Other reason
      </label>

      <textarea name="feedback" placeholder="Tell us more about your experience (optional)..."></textarea>

      <!-- Conditional offer: too expensive -->
      <div class="offer-box" id="priceOffer">
        <h3>Wait — special offer just for you!</h3>
        <p>Get <strong>50% off Pro for 3 months</strong>. That's just $2.49/month for unlimited blocking, Nuclear Mode, and advanced stats.</p>
        <button type="button" class="offer-btn" onclick="claimOffer('price_discount')">
          Claim 50% Off &amp; Reinstall
        </button>
      </div>

      <!-- Conditional offer: not restrictive enough -->
      <div class="offer-box" id="nuclearOffer">
        <h3>Have you tried Nuclear Mode?</h3>
        <p>Nuclear Mode makes blocking <strong>truly unbypassable</strong> — you can't disable it, can't remove sites, can't even uninstall the extension during a session. It's the most powerful blocking mode available.</p>
        <button type="button" class="offer-btn" onclick="claimOffer('nuclear_mode_trial')">
          Try Nuclear Mode Free for 7 Days
        </button>
      </div>

      <!-- Conditional tip: too restrictive -->
      <div class="tip-box" id="restrictiveTip">
        <h3>Did you know?</h3>
        <p>Focus Mode has an <strong>allowlist</strong> feature that lets you temporarily access specific sites during focus sessions. You can also set <strong>blocking schedules</strong> so sites are only blocked during work hours. Check Settings → Schedule for more control.</p>
      </div>

      <!-- Conditional message: temporary -->
      <div class="tip-box" id="temporaryMessage">
        <h3>We'll be here when you're ready!</h3>
        <p>Your Focus Score, streak history, and blocked sites list will be waiting for you. Just reinstall to pick up right where you left off.</p>
      </div>

      <!-- Competitive: found alternative -->
      <div class="offer-box" id="competitiveOffer" style="display: none;">
        <h3>Help us improve</h3>
        <p>Which tool did you switch to? We'd love to know what they do better so we can improve Focus Mode.</p>
        <input type="text" name="alternative_name" placeholder="Name of the alternative tool..." style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; margin-top: 8px; font-size: 14px;">
      </div>

      <button type="submit" class="submit-btn">Submit Feedback</button>
    </form>
  </div>

  <!-- Thank You -->
  <div class="survey-card thank-you" id="thankYou" style="display: none;">
    <h2>Thank you for your feedback!</h2>
    <p>We truly appreciate you helping us make Focus Mode better.</p>
    <p style="margin-top: 20px;">
      Changed your mind?
      <a href="https://chrome.google.com/webstore/detail/focus-mode-blocker/EXTENSION_ID">
        Reinstall Focus Mode - Blocker
      </a>
    </p>
    <p style="margin-top: 12px;">
      <a href="https://zovo.one" style="color: #9ca3af; font-size: 12px;">zovo.one</a>
    </p>
  </div>

  <script>
    const params = new URLSearchParams(window.location.search);

    // --- Populate stats summary ---
    const sessions = parseInt(params.get('sessions') || '0');
    const mins = parseInt(params.get('mins') || '0');
    const streak = parseInt(params.get('streak') || '0');
    const focusScore = parseInt(params.get('fs') || '0');
    const sites = parseInt(params.get('sites') || '0');

    if (sessions > 0) {
      const hours = Math.round(mins / 60);
      const summary = document.getElementById('statsSummary');
      summary.style.display = 'block';
      summary.innerHTML = `
        During your time with Focus Mode, you completed
        <strong>${sessions} focus sessions</strong>
        ${hours > 0 ? `(~<strong>${hours} hours</strong> of deep work)` : ''},
        blocked distractions on <strong>${sites} sites</strong>${streak > 0 ? `, and built a <strong>${streak}-day streak</strong>` : ''}.
        ${focusScore >= 50 ? `Your Focus Score reached <strong>${focusScore}</strong>.` : ''}
        That's real productivity!
      `;
    }

    // --- Hide pricing option for free users who never saw Pro ---
    const tier = params.get('tier');
    if (tier === 'free' && sessions < 5) {
      document.getElementById('pricingOption').style.display = 'none';
    }

    // --- Radio button selection & conditional offers ---
    document.querySelectorAll('.reason-option').forEach(option => {
      option.addEventListener('click', () => {
        document.querySelectorAll('.reason-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');

        const value = option.querySelector('input').value;

        // Hide all conditional elements
        document.getElementById('priceOffer').classList.remove('show');
        document.getElementById('nuclearOffer').classList.remove('show');
        document.getElementById('restrictiveTip').classList.remove('show');
        document.getElementById('temporaryMessage').classList.remove('show');
        document.getElementById('competitiveOffer').style.display = 'none';

        // Show relevant conditional element
        switch (value) {
          case 'too_expensive':
            document.getElementById('priceOffer').classList.add('show');
            break;
          case 'not_restrictive_enough':
            document.getElementById('nuclearOffer').classList.add('show');
            break;
          case 'too_restrictive':
            document.getElementById('restrictiveTip').classList.add('show');
            break;
          case 'temporary':
            document.getElementById('temporaryMessage').classList.add('show');
            break;
          case 'found_alternative':
            document.getElementById('competitiveOffer').style.display = 'block';
            break;
        }
      });
    });

    // --- Submit survey ---
    document.getElementById('exitSurvey').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);

      const data = {
        reason: formData.get('reason'),
        feedback: formData.get('feedback'),
        alternativeName: formData.get('alternative_name') || null,
        // Context from URL params (anonymous)
        context: {
          tier: params.get('tier'),
          plan: params.get('plan'),
          version: params.get('v'),
          daysInstalled: parseInt(params.get('days') || '0'),
          focusScore: parseInt(params.get('fs') || '0'),
          totalSessions: parseInt(params.get('sessions') || '0'),
          totalMinutes: parseInt(params.get('mins') || '0'),
          blockedSites: parseInt(params.get('sites') || '0'),
          nuclearUses: parseInt(params.get('nuclear') || '0'),
          featuresUsed: parseInt(params.get('features') || '0'),
          completedOnboarding: params.get('onboarded') === '1'
        },
        timestamp: new Date().toISOString()
      };

      try {
        await fetch('https://zovo.one/api/uninstall-feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      } catch (err) {
        // Silently fail — don't block the user
        console.error('Failed to submit feedback:', err);
      }

      document.getElementById('surveyForm').style.display = 'none';
      document.getElementById('thankYou').style.display = 'block';
    });

    // --- Claim offer ---
    function claimOffer(type) {
      const offerURL = new URL('https://zovo.one/special-offer');
      offerURL.searchParams.set('type', type);
      offerURL.searchParams.set('source', 'uninstall_survey');
      offerURL.searchParams.set('tier', params.get('tier') || 'free');
      window.location.href = offerURL.toString();
    }
  </script>
</body>
</html>
```

### 1.3 Feedback Categorization

Server-side processing of uninstall feedback at `zovo.one/api/uninstall-feedback`.

```javascript
// server/feedback-processor.js — Processes Focus Mode - Blocker uninstall feedback

const FOCUS_MODE_CATEGORIES = {
  not_helpful: {
    category: 'value',
    actionable: true,
    priority: 'high',
    team: 'product',
    followUp: 'Analyze which features were/weren\'t used. Consider onboarding improvements.'
  },
  too_restrictive: {
    category: 'usability',
    actionable: true,
    priority: 'medium',
    team: 'product',
    followUp: 'Promote allowlist and scheduling features. May need better UX for flexibility settings.'
  },
  not_restrictive_enough: {
    category: 'effectiveness',
    actionable: true,
    priority: 'high',
    team: 'product',
    followUp: 'Nuclear Mode awareness gap. Improve Nuclear Mode discoverability and Pro upsell.'
  },
  found_alternative: {
    category: 'competitive',
    actionable: true,
    priority: 'medium',
    team: 'product',
    followUp: 'Analyze named competitor. Feature gap analysis. Consider win-back with competitive offer.'
  },
  too_expensive: {
    category: 'pricing',
    actionable: true,
    priority: 'high',
    team: 'business',
    followUp: 'Review pricing strategy. Consider PPP pricing (Phase 15). Track volume for pricing A/B test.'
  },
  bugs_issues: {
    category: 'technical',
    actionable: true,
    priority: 'critical',
    team: 'engineering',
    followUp: 'IMMEDIATE: Check error logs for version. Prioritize fix in next release.'
  },
  dont_need: {
    category: 'lifecycle',
    actionable: false,
    priority: 'low',
    team: 'none',
    followUp: 'Natural lifecycle churn. No action needed. Track for seasonal patterns.'
  },
  nuclear_too_intense: {
    category: 'feature_feedback',
    actionable: true,
    priority: 'medium',
    team: 'product',
    followUp: 'Consider Nuclear Mode "lite" — strict but with emergency exit. Improve Nuclear Mode UX messaging.'
  },
  temporary: {
    category: 'lifecycle',
    actionable: false,
    priority: 'low',
    team: 'none',
    followUp: 'Likely to return. Queue gentle win-back email at day 14.'
  },
  other: {
    category: 'unknown',
    actionable: true,
    priority: 'medium',
    team: 'product',
    followUp: 'Review free-text feedback. Categorize manually.'
  }
};

/**
 * Process incoming uninstall feedback.
 * Called by POST /api/uninstall-feedback endpoint.
 */
async function processUninstallFeedback(feedback) {
  const categoryInfo = FOCUS_MODE_CATEGORIES[feedback.reason] || FOCUS_MODE_CATEGORIES.other;

  // Store in database
  const record = await db.uninstallFeedback.create({
    reason: feedback.reason,
    feedback: feedback.feedback,
    alternativeName: feedback.alternativeName,
    category: categoryInfo.category,
    priority: categoryInfo.priority,
    actionable: categoryInfo.actionable,
    context: feedback.context,
    processedAt: new Date()
  });

  // Alert for critical issues (bugs affecting multiple users)
  if (categoryInfo.priority === 'critical') {
    await sendSlackAlert({
      channel: '#focus-mode-alerts',
      text: `:rotating_light: Critical uninstall feedback: ${feedback.reason}`,
      blocks: [
        { type: 'section', text: { type: 'mrkdwn', text: `*Reason:* ${feedback.reason}\n*Feedback:* ${feedback.feedback || 'None'}\n*Version:* ${feedback.context.version}\n*Tier:* ${feedback.context.tier}\n*Days Installed:* ${feedback.context.daysInstalled}` } }
      ]
    });
  }

  // Alert for competitive threats (named alternatives)
  if (feedback.alternativeName) {
    await sendSlackAlert({
      channel: '#focus-mode-competitive',
      text: `:eyes: User switched to: ${feedback.alternativeName}`,
      blocks: [
        { type: 'section', text: { type: 'mrkdwn', text: `*Alternative:* ${feedback.alternativeName}\n*User Context:* ${feedback.context.tier} user, ${feedback.context.totalSessions} sessions, ${feedback.context.daysInstalled} days installed` } }
      ]
    });
  }

  // Queue win-back for actionable feedback (connects to Agent 3)
  if (categoryInfo.actionable && feedback.context.tier === 'pro') {
    // Pro users who uninstall are high-value win-back targets
    await queueWinBack({
      reason: feedback.reason,
      tier: 'pro',
      context: feedback.context,
      sequence: getWinBackSequence(feedback.reason)
    });
  }

  return record;
}

function getWinBackSequence(reason) {
  const sequences = {
    too_expensive: 'price_focused',
    bugs_issues: 'quality_focused',
    not_helpful: 'value_focused',
    found_alternative: 'competitive_focused',
    not_restrictive_enough: 'feature_focused',
    nuclear_too_intense: 'feature_focused',
    temporary: 'gentle_reminder'
  };
  return sequences[reason] || 'general';
}
```

### 1.4 Weekly Feedback Reports

```javascript
// server/feedback-reports.js — Weekly aggregation for the Zovo team

async function generateWeeklyFeedbackReport() {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const feedback = await db.uninstallFeedback.findMany({
    where: { processedAt: { gte: weekAgo } }
  });

  const totalUninstalls = feedback.length;

  // Reason breakdown
  const reasonCounts = {};
  feedback.forEach(f => {
    reasonCounts[f.reason] = (reasonCounts[f.reason] || 0) + 1;
  });

  // Sort by frequency
  const topReasons = Object.entries(reasonCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([reason, count]) => ({
      reason,
      count,
      percentage: ((count / totalUninstalls) * 100).toFixed(1),
      category: FOCUS_MODE_CATEGORIES[reason]?.category || 'unknown'
    }));

  // Pro vs Free breakdown
  const proChurns = feedback.filter(f => f.context.tier === 'pro').length;
  const freeChurns = feedback.filter(f => f.context.tier === 'free').length;

  // Average user stats at time of uninstall
  const avgStats = {
    daysInstalled: avg(feedback.map(f => f.context.daysInstalled)),
    focusScore: avg(feedback.map(f => f.context.focusScore)),
    totalSessions: avg(feedback.map(f => f.context.totalSessions)),
    blockedSites: avg(feedback.map(f => f.context.blockedSites)),
    featuresUsed: avg(feedback.map(f => f.context.featuresUsed))
  };

  // Named competitors
  const competitors = feedback
    .filter(f => f.alternativeName)
    .map(f => f.alternativeName);

  return {
    period: { start: weekAgo.toISOString(), end: new Date().toISOString() },
    totalUninstalls,
    topReasons,
    tierBreakdown: { pro: proChurns, free: freeChurns },
    averageUserAtChurn: avgStats,
    namedCompetitors: [...new Set(competitors)],
    actionItems: generateActionItems(topReasons, avgStats)
  };
}

function avg(numbers) {
  if (numbers.length === 0) return 0;
  return Math.round(numbers.reduce((a, b) => a + b, 0) / numbers.length);
}

function generateActionItems(topReasons, avgStats) {
  const items = [];

  // If "bugs" is in top 3, prioritize stability
  if (topReasons.slice(0, 3).some(r => r.reason === 'bugs_issues')) {
    items.push({ priority: 'critical', action: 'Bugs are a top-3 uninstall reason. Schedule stability sprint.' });
  }

  // If "too expensive" is top reason, review pricing
  if (topReasons[0]?.reason === 'too_expensive') {
    items.push({ priority: 'high', action: 'Pricing is the #1 uninstall reason. Consider limited-time discount or PPP pricing.' });
  }

  // If average sessions at churn is low, onboarding is failing
  if (avgStats.totalSessions < 5) {
    items.push({ priority: 'high', action: 'Users are churning with <5 sessions. Improve onboarding activation flow.' });
  }

  // If average features used is low, feature discovery is failing
  if (avgStats.featuresUsed < 3) {
    items.push({ priority: 'medium', action: 'Users only using ~2 features at churn. Improve feature discovery (see Agent 4).' });
  }

  return items;
}
```

---

## 2. Downgrade Flow Optimization

### 2.1 FocusDowngradeFlow Class

Manages the Pro→Free downgrade process with retention interception.

```javascript
// downgrade-flow.js — Pro→Free downgrade optimization for Focus Mode - Blocker

class FocusDowngradeFlow {
  /**
   * Initiate the downgrade process. Shows retention modal first.
   * Called when user clicks "Cancel Subscription" in options page.
   */
  async initiateDowngrade() {
    // Gather user's Pro usage data for the retention modal
    const usageData = await this.getProUsageData();

    // Show retention modal and wait for user's decision
    const decision = await this.showRetentionModal(usageData);

    switch (decision.action) {
      case 'stay':
        await this.recordRetentionSuccess('stayed', decision.offer);
        return { success: true, retained: true, action: 'stayed' };

      case 'pause':
        return this.pauseSubscription(decision.duration);

      case 'switch_annual':
        return this.switchToAnnual();

      case 'claim_free_months':
        return this.applyFreeMonths(2);

      case 'downgrade':
        return this.processDowngrade(decision);

      default:
        return { success: false, error: 'No action taken' };
    }
  }

  /**
   * Gather Pro-specific usage data to show in retention modal.
   * Shows the user what they'll lose with real numbers.
   */
  async getProUsageData() {
    const storage = await chrome.storage.local.get([
      'blockedSites', 'nuclearModeHistory', 'focusScore',
      'currentStreak', 'proFeatureUsage', 'subscription',
      'focusSessionHistory', 'customBlockPageTheme'
    ]);

    const nuclearUses = (storage.nuclearModeHistory || []).filter(d => d.used);
    const sessions = storage.focusSessionHistory || [];
    const thisMonth = sessions.filter(d => {
      return (Date.now() - new Date(d.date).getTime()) < 30 * 24 * 60 * 60 * 1000;
    });

    return {
      totalBlockedSites: (storage.blockedSites || []).length,
      excessSites: Math.max(0, (storage.blockedSites || []).length - 5), // Sites over Free limit
      nuclearModeUsesThisMonth: nuclearUses.filter(d => {
        return (Date.now() - new Date(d.date).getTime()) < 30 * 24 * 60 * 60 * 1000;
      }).length,
      totalNuclearUses: nuclearUses.length,
      focusScore: storage.focusScore || 0,
      currentStreak: storage.currentStreak || 0,
      hasCustomTheme: !!storage.customBlockPageTheme,
      sessionsThisMonth: thisMonth.reduce((s, d) => s + (d.sessionsCompleted || 0), 0),
      subscriptionAge: storage.subscription?.startDate
        ? Math.floor((Date.now() - new Date(storage.subscription.startDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0,
      monthlyPrice: 4.99,
      annualPrice: 2.99 // Monthly equivalent of annual plan
    };
  }

  /**
   * Show the retention modal with personalized data.
   * Returns a Promise that resolves with the user's chosen action.
   */
  showRetentionModal(usageData) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.id = 'downgrade-modal-overlay';
      modal.innerHTML = this.buildRetentionModalHTML(usageData);

      // Attach event listeners
      modal.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', () => {
          const action = btn.dataset.action;
          const duration = btn.dataset.duration;
          document.body.removeChild(modal);
          resolve({ action, duration: duration ? parseInt(duration) : null });
        });
      });

      document.body.appendChild(modal);
    });
  }

  buildRetentionModalHTML(data) {
    const lossItems = [];

    if (data.excessSites > 0) {
      lossItems.push(`<li><span class="loss-icon">✕</span> <strong>${data.excessSites} blocked sites</strong> will be removed (Free limit: 5 sites)</li>`);
    }
    if (data.nuclearModeUsesThisMonth > 0) {
      lossItems.push(`<li><span class="loss-icon">✕</span> <strong>Nuclear Mode</strong> — you used it ${data.nuclearModeUsesThisMonth} times this month</li>`);
    }
    if (data.hasCustomTheme) {
      lossItems.push(`<li><span class="loss-icon">✕</span> Your <strong>custom block page theme</strong> will revert to default</li>`);
    }
    lossItems.push(`<li><span class="loss-icon">✕</span> <strong>Advanced focus statistics</strong> and detailed analytics</li>`);
    lossItems.push(`<li><span class="loss-icon">✕</span> <strong>Import/Export</strong> settings backup</li>`);

    return `
      <div class="downgrade-overlay" style="
        position: fixed; inset: 0; background: rgba(0,0,0,0.5);
        display: flex; align-items: center; justify-content: center;
        z-index: 10000; padding: 20px;
      ">
        <div class="downgrade-card" style="
          background: white; border-radius: 16px; padding: 32px;
          max-width: 480px; width: 100%; max-height: 90vh; overflow-y: auto;
          box-shadow: 0 25px 60px rgba(0,0,0,0.3);
        ">
          <h2 style="font-size: 20px; color: #1f2937; margin-bottom: 16px;">
            Before you cancel...
          </h2>

          <div style="
            background: #fef2f2; border-radius: 10px; padding: 16px;
            margin-bottom: 20px;
          ">
            <h3 style="font-size: 15px; color: #991b1b; margin-bottom: 10px;">
              Here's what you'll lose:
            </h3>
            <ul style="list-style: none; padding: 0; margin: 0; font-size: 14px; color: #374151;">
              ${lossItems.join('')}
            </ul>
          </div>

          <h3 style="font-size: 15px; color: #374151; margin-bottom: 12px;">
            Consider these alternatives:
          </h3>

          <button data-action="pause" data-duration="1" style="
            display: block; width: 100%; padding: 14px 16px; margin-bottom: 8px;
            background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 10px;
            cursor: pointer; text-align: left; font-size: 14px;
          ">
            <strong style="color: #1f2937;">Pause for 1 month</strong><br>
            <span style="color: #6b7280; font-size: 13px;">Keep your Pro features and data. Resume anytime.</span>
          </button>

          <button data-action="switch_annual" style="
            display: block; width: 100%; padding: 14px 16px; margin-bottom: 8px;
            background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 10px;
            cursor: pointer; text-align: left; font-size: 14px;
          ">
            <strong style="color: #1f2937;">Switch to annual — save 40%</strong><br>
            <span style="color: #6b7280; font-size: 13px;">$${data.annualPrice}/mo instead of $${data.monthlyPrice}/mo (billed annually)</span>
          </button>

          <button data-action="claim_free_months" style="
            display: block; width: 100%; padding: 14px 16px; margin-bottom: 8px;
            background: #f0fdf4; border: 2px solid #22c55e; border-radius: 10px;
            cursor: pointer; text-align: left; font-size: 14px;
          ">
            <strong style="color: #166534;">Get 2 months free</strong><br>
            <span style="color: #15803d; font-size: 13px;">Stay on Pro — we'll credit your next 2 months. No charge.</span>
          </button>

          <hr style="margin: 16px 0; border: none; border-top: 1px solid #e5e7eb;">

          <button data-action="downgrade" style="
            display: block; width: 100%; padding: 10px; background: none;
            border: none; cursor: pointer; color: #9ca3af; font-size: 13px;
            text-align: center;
          ">
            Continue to cancel subscription →
          </button>
        </div>
      </div>
    `;
  }

  // === Action Handlers ===

  async pauseSubscription(durationMonths) {
    const resumeDate = new Date();
    resumeDate.setMonth(resumeDate.getMonth() + durationMonths);

    // API call to pause via Stripe
    await fetch('https://zovo.one/api/subscription/pause', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration: durationMonths })
    });

    await chrome.storage.local.set({
      'subscription.paused': true,
      'subscription.resumeDate': resumeDate.toISOString()
    });

    await this.recordRetentionSuccess('paused', `${durationMonths}_months`);

    return { success: true, retained: true, action: 'paused', resumeDate: resumeDate.toISOString() };
  }

  async switchToAnnual() {
    // API call to switch plan via Stripe
    await fetch('https://zovo.one/api/subscription/switch-annual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    await chrome.storage.local.set({ 'subscription.plan': 'annual' });
    await this.recordRetentionSuccess('switched_annual', 'annual_plan');

    return { success: true, retained: true, action: 'switched_annual' };
  }

  async applyFreeMonths(months) {
    // API call to apply credit via Stripe
    await fetch('https://zovo.one/api/subscription/apply-credit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ months })
    });

    await this.recordRetentionSuccess('free_months', `${months}_months`);

    return { success: true, retained: true, action: 'free_months', creditMonths: months };
  }

  async processDowngrade(decision) {
    // Show downgrade survey first
    const surveyResponse = await this.showDowngradeSurvey();

    // Process the actual downgrade
    await this.executeDowngrade(surveyResponse);

    return { success: true, retained: false, action: 'downgraded', survey: surveyResponse };
  }

  async recordRetentionSuccess(action, offer) {
    const { retentionHistory = [] } = await chrome.storage.local.get('retentionHistory');
    retentionHistory.push({
      action,
      offer,
      timestamp: new Date().toISOString()
    });
    await chrome.storage.local.set({ retentionHistory });

    // Report to analytics (anonymous)
    fetch('https://zovo.one/api/retention-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, offer, timestamp: new Date().toISOString() })
    }).catch(() => {}); // Non-blocking
  }
}
```

### 2.2 Retention Modal UI

The retention modal CSS (referenced in the HTML above):

```css
/* downgrade-modal.css — Styles for the retention modal */

.downgrade-overlay {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.downgrade-card {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.loss-icon {
  color: #ef4444;
  font-weight: bold;
  margin-right: 6px;
}

.downgrade-card button:hover {
  border-color: #6366f1 !important;
  background: #f5f3ff !important;
}

.downgrade-card button[data-action="claim_free_months"]:hover {
  border-color: #16a34a !important;
  background: #dcfce7 !important;
}

.downgrade-card button[data-action="downgrade"]:hover {
  color: #6b7280 !important;
}
```

### 2.3 Downgrade Survey

Focus Mode - Blocker specific questions shown when user proceeds with downgrade.

```javascript
// downgrade-survey.js — Survey shown during Pro→Free downgrade

const FOCUS_DOWNGRADE_QUESTIONS = [
  {
    id: 'primary_reason',
    question: "What's the main reason you're canceling Pro?",
    type: 'single',
    options: [
      { value: 'too_expensive', label: 'Too expensive for my needs ($4.99/mo)' },
      { value: 'not_using_pro', label: 'Not using Pro features enough' },
      { value: 'budget_constraints', label: 'Budget constraints / cutting expenses' },
      { value: 'missing_feature', label: 'Missing a feature I need' },
      { value: 'switching_tool', label: 'Switching to another tool' },
      { value: 'other', label: 'Other reason' }
    ]
  },
  {
    id: 'valuable_features',
    question: 'Which Pro features were most valuable to you?',
    type: 'multi',
    options: [
      { value: 'nuclear_mode', label: 'Nuclear Mode (unbypassable blocking)' },
      { value: 'unlimited_sites', label: 'Unlimited blocked sites' },
      { value: 'advanced_stats', label: 'Advanced focus statistics' },
      { value: 'custom_block_page', label: 'Custom block page themes' },
      { value: 'import_export', label: 'Import/Export settings' },
      { value: 'none', label: 'None were particularly valuable' }
    ]
  },
  {
    id: 'acceptable_price',
    question: 'What price would make Pro worth it for you?',
    type: 'single',
    showIf: (answers) => answers.primary_reason === 'too_expensive',
    options: [
      { value: '3.99', label: '$3.99/month' },
      { value: '2.99', label: '$2.99/month' },
      { value: '1.99', label: '$1.99/month' },
      { value: 'no_price', label: 'No price would work — I want everything free' }
    ]
  },
  {
    id: 'missing_feature',
    question: 'What feature would have kept you subscribed?',
    type: 'text',
    showIf: (answers) => answers.primary_reason === 'missing_feature',
    placeholder: 'Describe the feature you need...'
  },
  {
    id: 'return_likelihood',
    question: 'How likely are you to upgrade to Pro again in the future?',
    type: 'scale',
    min: 1,
    max: 5,
    labels: ['Very unlikely', 'Unlikely', 'Maybe', 'Likely', 'Very likely']
  }
];
```

### 2.4 Graceful Downgrade Process

When the user confirms downgrade, the transition from Pro to Free must be handled carefully to preserve data and provide a path back.

```javascript
// downgrade-executor.js — Handles the actual Pro→Free transition

class DowngradeExecutor {
  /**
   * Execute the downgrade with graceful data handling.
   */
  async execute(surveyResponse) {
    const storage = await chrome.storage.local.get([
      'blockedSites', 'customBlockPageTheme', 'subscription'
    ]);

    // 1. Handle blocklist (if more than 5 sites)
    const blockedSites = storage.blockedSites || [];
    if (blockedSites.length > 5) {
      // Save full blocklist for potential re-upgrade
      await chrome.storage.local.set({
        proBlocklistBackup: [...blockedSites],
        proBlocklistBackupDate: new Date().toISOString()
      });

      // Let user choose which 5 to keep (UI interaction)
      await this.showSiteSelectionUI(blockedSites);
    }

    // 2. Handle Nuclear Mode
    // If Nuclear Mode session is active, let it finish
    const { nuclearModeActive } = await chrome.storage.local.get('nuclearModeActive');
    if (nuclearModeActive) {
      // Don't interrupt — Nuclear Mode session completes, then Pro features disabled
      await chrome.storage.local.set({ downgradeAfterNuclear: true });
    }

    // 3. Handle custom block page theme
    if (storage.customBlockPageTheme) {
      // Save theme preference (restore if re-upgrade)
      await chrome.storage.local.set({
        proThemeBackup: storage.customBlockPageTheme,
        customBlockPageTheme: null // Revert to default
      });
    }

    // 4. Handle advanced stats
    // DON'T delete stats data — just hide the UI. Data available on re-upgrade.
    await chrome.storage.local.set({ statsViewable: false });

    // 5. Update subscription status
    await chrome.storage.local.set({
      subscription: { tier: 'free', downgradeDate: new Date().toISOString(), previousTier: 'pro' }
    });

    // 6. Cancel subscription via API
    await fetch('https://zovo.one/api/subscription/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ survey: surveyResponse })
    }).catch(() => {});

    // 7. Update uninstall URL to reflect free tier
    const exitSurveyHandler = new ExitSurveyHandler();
    await exitSurveyHandler.updateUninstallURL();

    // 8. Show "Welcome back to Free" message
    await this.showDowngradeConfirmation(blockedSites.length);

    // 9. Queue win-back sequence (connects to Agent 3)
    await chrome.storage.local.set({
      downgradeWinBackQueued: true,
      downgradeReason: surveyResponse.primary_reason,
      downgradeDate: new Date().toISOString()
    });
  }

  /**
   * Show UI for user to choose which 5 sites to keep.
   */
  showSiteSelectionUI(allSites) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.innerHTML = `
        <div style="
          position: fixed; inset: 0; background: rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center;
          z-index: 10001; padding: 20px;
        ">
          <div style="
            background: white; border-radius: 16px; padding: 32px;
            max-width: 420px; width: 100%; max-height: 80vh; overflow-y: auto;
          ">
            <h2 style="font-size: 18px; margin-bottom: 8px;">Choose your 5 blocked sites</h2>
            <p style="font-size: 13px; color: #6b7280; margin-bottom: 16px;">
              Free plan allows 5 blocked sites. Select which ones to keep.
              Your full list is saved and will be restored if you upgrade again.
            </p>
            <div id="site-selection">
              ${allSites.map((site, i) => `
                <label style="
                  display: flex; align-items: center; gap: 8px;
                  padding: 8px 10px; border-radius: 6px; cursor: pointer;
                  margin-bottom: 4px;
                " class="site-checkbox">
                  <input type="checkbox" value="${site}" ${i < 5 ? 'checked' : ''} class="site-cb">
                  <span style="font-size: 14px;">${site}</span>
                </label>
              `).join('')}
            </div>
            <p id="site-count" style="font-size: 12px; color: #6b7280; margin: 8px 0;">5 of 5 selected</p>
            <button id="confirm-sites" style="
              width: 100%; padding: 12px; background: #6366f1; color: white;
              border: none; border-radius: 8px; font-size: 14px; cursor: pointer;
              margin-top: 8px;
            ">Confirm Selection</button>
          </div>
        </div>
      `;

      // Limit to 5 selections
      const checkboxes = modal.querySelectorAll('.site-cb');
      const countEl = modal.querySelector('#site-count');

      checkboxes.forEach(cb => {
        cb.addEventListener('change', () => {
          const checked = modal.querySelectorAll('.site-cb:checked');
          if (checked.length > 5) {
            cb.checked = false;
          }
          countEl.textContent = `${modal.querySelectorAll('.site-cb:checked').length} of 5 selected`;
        });
      });

      modal.querySelector('#confirm-sites').addEventListener('click', async () => {
        const selected = Array.from(modal.querySelectorAll('.site-cb:checked')).map(cb => cb.value);
        await chrome.storage.local.set({ blockedSites: selected });
        document.body.removeChild(modal);
        resolve(selected);
      });

      document.body.appendChild(modal);
    });
  }

  /**
   * Show confirmation that downgrade is complete.
   */
  async showDowngradeConfirmation(previousSiteCount) {
    // Handled by the options page UI — set a flag for it to pick up
    await chrome.storage.local.set({
      showDowngradeConfirmation: true,
      previousSiteCount
    });
  }
}
```

---

## 3. Implementation Priority

| Priority | Component | Complexity | Effort |
|----------|-----------|------------|--------|
| P0 | ExitSurveyHandler + uninstall URL setup | Low | 3 hours |
| P0 | Service worker integration (onInstalled, storage.onChanged) | Low | 2 hours |
| P1 | Exit survey HTML page (zovo.one) | Medium | 6 hours |
| P1 | Server-side feedback processor | Medium | 4 hours |
| P1 | FocusDowngradeFlow class + retention modal | Medium | 8 hours |
| P1 | Downgrade survey questions | Low | 2 hours |
| P2 | DowngradeExecutor (graceful transition) | Medium | 6 hours |
| P2 | Site selection UI for blocklist trimming | Medium | 4 hours |
| P2 | Weekly feedback report generation | Medium | 4 hours |
| P3 | Slack alerting integration | Low | 2 hours |
| P3 | Competitive tracking from named alternatives | Low | 2 hours |

**Total estimated effort: 43 hours (≈5.5 working days)**

**Key Dependencies:**
- Exit survey page requires zovo.one hosting (server-side)
- Downgrade flow requires Stripe integration (from Phase 9)
- Win-back queue connects to Agent 3's email sequences
- Feedback data feeds into Agent 5's retention dashboard

---

*Agent 2 — Exit Survey & Downgrade Flow — Complete*
