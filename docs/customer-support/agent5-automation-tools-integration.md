# Agent 5 — Automation Tools & Integration Architecture
## Phase 19: Customer Support Automation — Focus Mode - Blocker

> **Date:** February 11, 2026 | **Agent:** 5 of 5
> **Scope:** Section 9 — Automation Tools + Integration Architecture
> **Depends on:** Phase 17 (Churn Prevention — engagement signals), Phase 18 (Security — secure messaging, error tracking), All Agent 1-4 outputs

---

## 9. Automation Tools

### 9.1 Auto-Responder System

```javascript
// server/support/auto-responder.js
class FocusAutoResponder {
  constructor(config) {
    this.rules = config.rules;
    this.templates = config.templates;
  }

  async processIncomingTicket(ticket) {
    const responses = [];

    // Always send acknowledgment
    responses.push({
      type: 'acknowledgment',
      template: 'acknowledgment',
      delay: 0
    });

    // Check for auto-resolvable issues
    const autoResolve = this.checkAutoResolve(ticket);
    if (autoResolve.canResolve) {
      responses.push({
        type: 'resolution',
        template: autoResolve.template,
        delay: 5000,  // 5-second delay to seem more natural
        resolveTicket: autoResolve.confidence > 0.9,
        tagAutoResolved: true
      });
    }

    // Out-of-office check
    if (this.isOutOfHours()) {
      responses.push({
        type: 'out-of-office',
        template: 'outOfOffice',
        delay: 0
      });
    }

    // Nuclear Mode active — immediate empathy response
    if (ticket.customFields?.nuclearActive === true && ticket.category === 'nuclearMode') {
      responses.push({
        type: 'nuclear-empathy',
        template: 'nuclearLockedOut',
        delay: 2000
      });
    }

    return this.executeResponses(ticket, responses);
  }

  checkAutoResolve(ticket) {
    const fullText = (ticket.subject + ' ' + ticket.body).toLowerCase();

    const autoResolvePatterns = [
      // Installation
      {
        pattern: /how (do i|to) (install|add|get|download)/i,
        template: 'installation-guide',
        confidence: 0.95
      },
      // Settings location
      {
        pattern: /where (is|are) (the|my) settings/i,
        template: 'settings-location',
        confidence: 0.95
      },
      // Keyboard shortcuts
      {
        pattern: /keyboard shortcut/i,
        template: 'keyboard-shortcuts',
        confidence: 0.9
      },
      // Cancellation
      {
        pattern: /cancel (my )?(subscription|account|pro)/i,
        template: 'cancellation-guide',
        confidence: 0.85
      },
      // Incognito mode
      {
        pattern: /doesn'?t (show|appear|work) in incognito/i,
        template: 'incognito-guide',
        confidence: 0.95
      },
      // Pin icon
      {
        pattern: /(icon|extension).*(not showing|missing|disappeared|can'?t find)/i,
        template: 'pin-icon-guide',
        confidence: 0.95
      },
      // Focus Mode-specific auto-resolves
      {
        pattern: /how (do i|to) (block|add).*(site|website|domain)/i,
        template: 'block-site-guide',
        confidence: 0.95
      },
      {
        pattern: /how (does|do) (the )?pomodoro (timer )?(work|start)/i,
        template: 'pomodoro-guide',
        confidence: 0.9
      },
      {
        pattern: /what is (focus score|nuclear mode|pomodoro)/i,
        template: 'feature-explanation',
        confidence: 0.9
      },
      {
        pattern: /how (is|does) (my )?(focus )?score (calculated|work)/i,
        template: 'focus-score-explanation',
        confidence: 0.9
      },
      {
        pattern: /how (do|does) streak/i,
        template: 'streak-explanation',
        confidence: 0.9
      },
      {
        pattern: /how (much|to) (does|upgrade|is) pro/i,
        template: 'pro-pricing',
        confidence: 0.85
      },
      {
        pattern: /(get|request|how) refund/i,
        template: 'refund-info',
        confidence: 0.8  // Lower confidence — may need human review
      }
    ];

    for (const rule of autoResolvePatterns) {
      if (rule.pattern.test(fullText)) {
        return {
          canResolve: true,
          template: rule.template,
          confidence: rule.confidence
        };
      }
    }

    return { canResolve: false };
  }

  async executeResponses(ticket, responses) {
    const results = [];

    for (const response of responses) {
      if (response.delay > 0) {
        await this.delay(response.delay);
      }

      const renderedContent = this.renderTemplate(
        this.getTemplate(response.template),
        ticket
      );

      const result = await this.sendResponse(ticket.id, renderedContent);
      results.push(result);

      if (response.resolveTicket) {
        await this.markResolved(ticket.id, 'auto-resolved');
        await this.tagTicket(ticket.id, 'auto-resolved');
      }

      if (response.tagAutoResolved) {
        await this.tagTicket(ticket.id, 'auto-responded');
      }
    }

    return results;
  }

  isOutOfHours() {
    const now = new Date();
    const pstOffset = -8;
    const pstHour = (now.getUTCHours() + pstOffset + 24) % 24;
    const day = now.getUTCDay();

    // Business hours: Mon-Fri, 9 AM - 5 PM PST
    return day === 0 || day === 6 || pstHour < 9 || pstHour >= 17;
  }

  getTemplate(templateId) {
    return this.templates[templateId] || this.templates['generic-acknowledgment'];
  }

  renderTemplate(template, ticket) {
    return template
      .replace(/{customer_name}/g, ticket.userName || 'there')
      .replace(/{ticket_id}/g, ticket.id)
      .replace(/{sla_hours}/g, this.getSLAHours(ticket.priority))
      .replace(/\[Extension Name\]/g, 'Focus Mode - Blocker');
  }

  getSLAHours(priority) {
    const slaMap = { urgent: '1', high: '4', normal: '24', low: '72' };
    return slaMap[priority] || '24';
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 9.2 Auto-Responder Templates (Focus Mode-Specific)

```javascript
// server/support/auto-responder-templates.js
const FocusAutoResponderTemplates = {
  acknowledgment: `Hi {customer_name},

Thank you for contacting Focus Mode - Blocker support!

We've received your message and created ticket #{ticket_id}.

**What happens next:**
- Our team will review your request
- You'll receive a response within {sla_hours} hours
- Reply to this email to add more details

**Quick resources while you wait:**
- FAQ: https://zovo.one/faq
- Knowledge Base: https://zovo.one/docs
- Interactive Troubleshooter: https://zovo.one/troubleshooter

Best regards,
Zovo Support`,

  outOfOffice: `Hi {customer_name},

Thank you for reaching out! Our support team is currently offline.

**Our hours:** Monday–Friday, 9 AM – 5 PM PST

We'll respond to your message when we return. For urgent issues, check our FAQ: https://zovo.one/faq

Ticket #{ticket_id} has been created and queued.

Best regards,
Zovo Support`,

  'installation-guide': `Hi {customer_name},

Here's how to install Focus Mode - Blocker:

1. Visit our Chrome Web Store page: https://chrome.google.com/webstore/detail/focus-mode-blocker/{extension_id}
2. Click "Add to Chrome"
3. Click "Add extension" in the popup
4. Look for the Focus Mode icon in your toolbar (click the puzzle piece icon to find and pin it)

**Quick Start:** Click the icon → Add your first distracting site → Start a Pomodoro session!

If you're still having trouble, reply and let us know what happens!

Best regards,
Zovo Support`,

  'pin-icon-guide': `Hi {customer_name},

To show the Focus Mode icon in your toolbar:

1. Click the puzzle piece icon (🧩) in Chrome's toolbar
2. Find "Focus Mode - Blocker" in the list
3. Click the pin icon next to it

The icon should now appear in your toolbar. If it's not in the list at all, the extension may need to be reinstalled from the Chrome Web Store.

Best regards,
Zovo Support`,

  'settings-location': `Hi {customer_name},

To access Focus Mode settings:

1. Click the Focus Mode icon in your toolbar
2. Click the gear icon (⚙️) or "Settings"
3. Browse sections: General, Blocklist, Pomodoro, Blocking, Focus Score, Notifications, Pro

You can also right-click the Focus Mode icon → "Options" to open settings in a full tab.

Best regards,
Zovo Support`,

  'keyboard-shortcuts': `Hi {customer_name},

Focus Mode keyboard shortcuts:

• Alt+Shift+F — Open/close Focus Mode popup
• Alt+Shift+S — Start/stop Pomodoro session
• Alt+Shift+B — Quick-block current site (Pro)

To customize: Go to chrome://extensions/shortcuts → Find "Focus Mode - Blocker"

Best regards,
Zovo Support`,

  'block-site-guide': `Hi {customer_name},

To block a website in Focus Mode:

1. Click the Focus Mode icon in your toolbar
2. Click "+ Add Site"
3. Type the domain (e.g., "youtube.com")
4. Press Enter

The site will be blocked immediately. Refresh any open tabs of that site.

**Tips:**
- Block subdomains too (e.g., "m.youtube.com")
- Pro users: right-click any page → "Focus Mode > Block this site"

Best regards,
Zovo Support`,

  'pomodoro-guide': `Hi {customer_name},

The Focus Mode Pomodoro timer:

1. Click the Focus Mode icon
2. Click "Start Focus Session" (▶️)
3. Work for 25 minutes
4. Take a 5-minute break when notified
5. After 4 sessions, take a 15-minute long break

Your Focus Score increases with every completed session!

Pro users can customize all intervals in Settings → Pomodoro.

Best regards,
Zovo Support`,

  'focus-score-explanation': `Hi {customer_name},

Focus Score (0-100) measures your focus consistency:

**Increases when you:**
- Complete Pomodoro sessions (+5-10)
- Maintain daily streaks (+2/day)
- Use Nuclear Mode (+10-15)

**Decreases when you:**
- Visit blocked sites during sessions (-5)
- Break your streak (-10)

It's a rolling 7-day average. Check your breakdown in the popup → Focus Score.

Best regards,
Zovo Support`,

  'streak-explanation': `Hi {customer_name},

Focus Mode streaks track consecutive days of focus:

- Complete at least 1 focus session per day to maintain your streak
- The day resets at midnight in your timezone (check Settings → General → Timezone)
- Your longest streak is always recorded in your stats

**Pro tip:** Enable "Streak Reminder" in Settings → Notifications to get an 8 PM reminder!

Best regards,
Zovo Support`,

  'pro-pricing': `Hi {customer_name},

Focus Mode Pro pricing:

- **Monthly:** $4.99/month (cancel anytime)
- **Lifetime:** $49.99 one-time (best value — all future updates included!)

Pro features: Nuclear Mode, unlimited blocked sites, custom Pomodoro intervals, advanced Focus Score analytics, schedule-based blocking, cloud sync, priority support, and more.

Upgrade: Click the Focus Mode icon → Settings → Pro

14-day money-back guarantee on all plans.

Best regards,
Zovo Support`,

  'refund-info': `Hi {customer_name},

Our refund policy:

- **Within 14 days:** No-questions-asked refund. Email billing@zovo.one with your purchase receipt.
- **Within 30 days:** Refund available if you're experiencing technical issues we can't resolve.
- **After 30 days:** Evaluated case-by-case.

To request a refund, reply to this email or email billing@zovo.one with your Stripe receipt or license key.

Your Free tier access (5 blocked sites, Pomodoro timer, Focus Score) will continue even after cancellation.

Best regards,
Zovo Support`,

  'cancellation-guide': `Hi {customer_name},

To cancel your Focus Mode Pro subscription:

1. Click the Focus Mode icon
2. Go to Settings → Pro
3. Click "Manage Subscription"
4. Click "Cancel Subscription"

Your Pro features will remain active until the end of your current billing period. After that, you'll revert to the Free tier. Your Focus Score, streaks, and settings are preserved.

Is there something we can help fix before you cancel? Reply and let us know!

Best regards,
Zovo Support`,

  'incognito-guide': `Hi {customer_name},

To enable Focus Mode in Incognito:

1. Go to chrome://extensions
2. Find "Focus Mode - Blocker"
3. Click "Details"
4. Toggle "Allow in Incognito"

Note: Focus Score and streak tracking don't work in Incognito mode (no data is stored).

Best regards,
Zovo Support`,

  'nuclearLockedOut': `Hi {customer_name},

We understand being locked out by Nuclear Mode can feel frustrating — but this is actually the feature working as designed!

**Nuclear Mode is intentionally unbypassable.** This is what makes Focus Mode the strongest blocker available.

**Your options right now:**
1. Wait for the timer to expire
2. Use a different browser (Firefox, Safari, Edge) for urgent needs
3. Use your phone for time-sensitive tasks

**For next time:** Start with shorter sessions (30-60 min) and don't block sites you might urgently need.

Hang in there — your Focus Score will thank you!

Best regards,
Zovo Support`,

  'feature-explanation': `Hi {customer_name},

Here's a quick overview of Focus Mode's key features:

**Focus Score (0-100):** Measures your focus consistency over a rolling 7-day period. Complete sessions and maintain streaks to increase it.

**Pomodoro Timer:** Work in focused intervals (25 min work / 5 min break). Customizable intervals with Pro.

**Nuclear Mode (Pro):** The ultimate focus tool — makes blocking completely unbypassable for a set duration. Cannot be turned off early, even by uninstalling.

**Streaks:** Track consecutive days of focus sessions. Build habits with daily consistency.

**Blocklist:** Add distracting sites to block. Free: 5 sites. Pro: unlimited.

Learn more at https://zovo.one/docs

Best regards,
Zovo Support`,

  'generic-acknowledgment': `Hi {customer_name},

Thank you for reaching out to Focus Mode support!

We've received your message (ticket #{ticket_id}) and will respond within {sla_hours} hours.

In the meantime, check our FAQ: https://zovo.one/faq

Best regards,
Zovo Support`
};

module.exports = { FocusAutoResponderTemplates };
```

### 9.3 Support Chatbot

```javascript
// server/support/support-chatbot.js
class FocusSupportChatbot {
  constructor(config) {
    this.intents = this.loadIntents();
    this.context = new Map();  // userId → conversation state
  }

  loadIntents() {
    return {
      greeting: {
        patterns: ['hi', 'hello', 'hey', 'help', 'support'],
        response: "Hello! I'm the Focus Mode support assistant. How can I help you today?",
        suggestions: ['Block a website', 'Pomodoro help', 'Nuclear Mode help', 'Billing question', 'Report a bug']
      },

      blockSite: {
        patterns: ['block', 'add site', 'blocklist', 'website'],
        response: `To block a website:
1. Click the Focus Mode icon in your toolbar
2. Click "+ Add Site"
3. Type the domain (e.g., "youtube.com")
4. Press Enter

Is the site still not blocked after adding it?`,
        followUp: {
          yes: 'siteNotBlocked',
          no: 'resolved'
        }
      },

      siteNotBlocked: {
        patterns: ['still not blocked', 'not working', 'site still accessible'],
        response: `Try these steps:
1. Refresh the page after adding the site
2. Check if blocking mode is set to "During sessions only" (Settings → Blocking)
3. Make sure you used the domain format: "youtube.com" not a full URL

Did that fix it?`,
        followUp: {
          yes: 'resolved',
          no: 'escalateToHuman'
        }
      },

      pomodoro: {
        patterns: ['pomodoro', 'timer', 'focus session', 'start session'],
        response: `The Pomodoro timer in Focus Mode:
• Click the Focus Mode icon → "Start Focus Session"
• Default: 25 min work → 5 min break → repeat
• After 4 sessions: 15 min long break
• Pro users: customize all intervals in Settings → Pomodoro

What specifically do you need help with?`,
        suggestions: ['Timer not working', 'Custom intervals', 'Notifications not showing']
      },

      nuclearMode: {
        patterns: ['nuclear', 'nuclear mode', 'locked out', 'cant turn off'],
        response: `Nuclear Mode is Focus Mode's strongest feature — it makes blocking completely unbypassable.

**If you're locked out:** This is by design! Options:
• Wait for the timer to expire
• Use a different browser for urgent needs
• Use your phone

**If Nuclear Mode won't activate:** Make sure you have Pro and selected at least 1 site.

Is Nuclear Mode active but sites aren't blocked? (This would be a bug)`,
        followUp: {
          yes: 'nuclearBug',
          no: 'resolved'
        }
      },

      nuclearBug: {
        patterns: ['nuclear bug', 'nuclear not blocking'],
        response: "That sounds like a critical bug. Let me connect you with our technical team right away.",
        escalate: true,
        escalateTo: 'tier3',
        priority: 'urgent'
      },

      focusScore: {
        patterns: ['focus score', 'score', 'points', 'level'],
        response: `Focus Score (0-100) measures your focus consistency:

**Increases:** Complete sessions (+5-10), maintain streaks (+2/day), Nuclear Mode (+10-15)
**Decreases:** Visit blocked sites (-5), break streak (-10)

It's a rolling 7-day average. Does your score seem wrong?`,
        followUp: {
          yes: 'scoreIssue',
          no: 'resolved'
        }
      },

      scoreIssue: {
        patterns: ['score wrong', 'score not updating', 'score decreased'],
        response: "Score discrepancies are usually because:\n1. It's a 7-day rolling average (one good day won't jump it)\n2. Brief blocked-site visits count against you\n3. Check your timezone in Settings → General\n\nIf you believe there's a calculation error, I'll connect you with support.",
        suggestions: ['That explains it', 'Still seems wrong — talk to support']
      },

      streaks: {
        patterns: ['streak', 'lost streak', 'daily streak', 'streak broken'],
        response: `Streaks require at least 1 focus session per calendar day (midnight in your timezone).

Common causes for lost streaks:
• Forgot to start a session
• Wrong timezone (Settings → General)
• Chrome wasn't open that day

Unfortunately, streaks can't be restored manually. Enable "Streak Reminder" in Settings → Notifications!`,
        suggestions: ['How to prevent streak loss', 'Talk to support']
      },

      billing: {
        patterns: ['billing', 'payment', 'subscription', 'charge', 'invoice'],
        response: "I can help with billing. What would you like to do?",
        suggestions: ['Upgrade to Pro', 'Cancel subscription', 'Request refund', 'Update payment method', 'View receipt']
      },

      refund: {
        patterns: ['refund', 'money back', 'get my money'],
        response: "Our refund policy:\n• Within 14 days: No-questions-asked refund\n• Within 30 days: Available for technical issues\n\nI'll connect you with our billing team to process this.",
        escalate: true,
        escalateTo: 'billing'
      },

      upgrade: {
        patterns: ['upgrade', 'pro', 'premium', 'buy'],
        response: `Focus Mode Pro:
• Monthly: $4.99/month
• Lifetime: $49.99 (best value!)

Includes: Nuclear Mode, unlimited sites, custom Pomodoro, analytics, cloud sync, priority support.

To upgrade: Focus Mode icon → Settings → Pro → Choose Plan

14-day money-back guarantee!`,
        suggestions: ['What does Pro include?', 'Lifetime vs Monthly?']
      },

      featureRequest: {
        patterns: ['feature', 'suggestion', 'wish', 'would be nice', 'idea', 'roadmap'],
        response: "We love hearing your ideas! Please describe the feature you'd like, and I'll make sure it reaches our product team.\n\nYou can also vote on features at zovo.one/roadmap",
        collectFeedback: true
      },

      transferToHuman: {
        patterns: ['human', 'agent', 'person', 'talk to someone', 'real person', 'support agent'],
        response: "I'll connect you with a support agent right away. Please hold while I transfer you. Average wait time: {wait_time}",
        escalate: true,
        escalateTo: 'tier1'
      },

      resolved: {
        patterns: ['thanks', 'that helped', 'fixed', 'works now', 'got it'],
        response: "Great, glad I could help! If you enjoy Focus Mode, we'd appreciate a review on the Chrome Web Store. Have a focused day!",
        suggestions: ['Leave a review', 'I have another question']
      }
    };
  }

  async processMessage(userId, message) {
    const userContext = this.context.get(userId) || { history: [], currentFlow: null };

    // Check if in a conversation flow
    if (userContext.currentFlow) {
      return this.continueFlow(userId, message, userContext);
    }

    // Detect intent
    const intent = this.detectIntent(message);

    if (!intent) {
      return {
        response: "I'm not sure I understand. Could you rephrase that, or would you like to talk to a support agent?",
        suggestions: ['Talk to agent', 'View FAQ', 'How to block a site', 'Pomodoro help']
      };
    }

    const intentConfig = this.intents[intent];

    // Handle escalation
    if (intentConfig.escalate) {
      await this.escalateToHuman(userId, intent, userContext.history, intentConfig.escalateTo, intentConfig.priority);
      return { response: intentConfig.response };
    }

    // Set up follow-up flow if needed
    if (intentConfig.followUp) {
      userContext.currentFlow = intent;
      this.context.set(userId, userContext);
    }

    // Handle feedback collection
    if (intentConfig.collectFeedback) {
      userContext.currentFlow = 'collecting-feedback';
      this.context.set(userId, userContext);
    }

    // Update history
    userContext.history.push({ role: 'user', content: message, timestamp: Date.now() });
    userContext.history.push({ role: 'bot', content: intentConfig.response, timestamp: Date.now() });
    this.context.set(userId, userContext);

    return {
      response: intentConfig.response,
      suggestions: intentConfig.suggestions,
      followUp: intentConfig.followUp
    };
  }

  continueFlow(userId, message, userContext) {
    const flow = this.intents[userContext.currentFlow];
    if (!flow || !flow.followUp) {
      userContext.currentFlow = null;
      this.context.set(userId, userContext);
      return this.processMessage(userId, message);
    }

    const lowerMessage = message.toLowerCase();
    let nextIntent;

    if (/yes|yeah|still|not fixed|doesn't work/i.test(lowerMessage)) {
      nextIntent = flow.followUp.yes;
    } else if (/no|nope|fixed|works|thanks/i.test(lowerMessage)) {
      nextIntent = flow.followUp.no;
    }

    userContext.currentFlow = null;
    this.context.set(userId, userContext);

    if (nextIntent && this.intents[nextIntent]) {
      return {
        response: this.intents[nextIntent].response,
        suggestions: this.intents[nextIntent].suggestions
      };
    }

    return this.processMessage(userId, message);
  }

  detectIntent(message) {
    const lowerMessage = message.toLowerCase();

    // Check each intent's patterns
    let bestMatch = null;
    let bestScore = 0;

    for (const [intent, config] of Object.entries(this.intents)) {
      const matchCount = config.patterns.filter(pattern => lowerMessage.includes(pattern)).length;
      if (matchCount > bestScore) {
        bestScore = matchCount;
        bestMatch = intent;
      }
    }

    return bestMatch;
  }

  async escalateToHuman(userId, reason, history, tier = 'tier1', priority = 'normal') {
    const ticket = {
      userId,
      source: 'chatbot',
      reason,
      chatHistory: history.slice(-20), // Last 20 messages for context
      priority,
      category: this.mapReasonToCategory(reason),
      tags: ['chatbot-escalation']
    };

    await this.createTicket(ticket);
    await this.notifyAgent(ticket);
  }

  mapReasonToCategory(reason) {
    const map = {
      nuclearBug: 'nuclearMode',
      refund: 'billing',
      billing: 'billing',
      scoreIssue: 'focusScore',
      siteNotBlocked: 'blocklist'
    };
    return map[reason] || 'general';
  }
}
```

### 9.4 Macro/Shortcut System for Support Agents

```javascript
// server/support/macro-system.js
class FocusMacroSystem {
  constructor() {
    this.macros = new Map();
    this.loadDefaultMacros();
  }

  loadDefaultMacros() {
    const defaults = {
      // Quick action macros
      '#ack': {
        name: 'Acknowledge Ticket',
        actions: [
          { type: 'reply', template: 'first-response' },
          { type: 'tag', value: 'acknowledged' }
        ]
      },

      '#resolve': {
        name: 'Resolve & Close',
        actions: [
          { type: 'status', value: 'resolved' },
          { type: 'reply', template: 'closing' },
          { type: 'survey', delay: 24 }  // Send satisfaction survey after 24 hours
        ]
      },

      '#bug': {
        name: 'Mark as Bug',
        actions: [
          { type: 'category', value: 'bug' },
          { type: 'tag', value: 'bug-report' },
          { type: 'reply', template: 'bug-acknowledged' }
        ]
      },

      '#feature': {
        name: 'Log Feature Request',
        actions: [
          { type: 'category', value: 'feature-request' },
          { type: 'tag', value: 'feature-request' },
          { type: 'reply', template: 'feature-logged' },
          { type: 'createFeatureRequest' }
        ]
      },

      '#refund': {
        name: 'Process Refund',
        actions: [
          { type: 'tag', value: 'refund-requested' },
          { type: 'assignTo', value: 'billing-team' },
          { type: 'reply', template: 'refund-processing' }
        ]
      },

      '#escalate': {
        name: 'Escalate to Tier 2',
        actions: [
          { type: 'escalate', tier: 2 },
          { type: 'reply', template: 'escalation-notice' }
        ]
      },

      '#escalate3': {
        name: 'Escalate to Engineering (Tier 3)',
        actions: [
          { type: 'escalate', tier: 3 },
          { type: 'priority', value: 'high' },
          { type: 'reply', template: 'engineering-escalation-notice' }
        ]
      },

      '#vip': {
        name: 'VIP Treatment',
        actions: [
          { type: 'tag', value: 'vip' },
          { type: 'priority', value: 'high' },
          { type: 'assignTo', value: 'senior-support' }
        ]
      },

      '#nuclear': {
        name: 'Nuclear Mode Response',
        actions: [
          { type: 'category', value: 'nuclearMode' },
          { type: 'tag', value: 'nuclear-mode' },
          { type: 'reply', template: 'nuclear-locked-out' }
        ]
      },

      '#nuclearbug': {
        name: 'Nuclear Mode Bug',
        actions: [
          { type: 'category', value: 'nuclearMode' },
          { type: 'tag', values: ['nuclear-mode', 'nuclear-bug', 'critical'] },
          { type: 'priority', value: 'urgent' },
          { type: 'escalate', tier: 3 }
        ]
      },

      '#needinfo': {
        name: 'Request Debug Info',
        actions: [
          { type: 'tag', value: 'awaiting-info' },
          { type: 'reply', template: 'bug-need-info' }
        ]
      },

      '#proexists': {
        name: 'Feature Exists in Pro',
        actions: [
          { type: 'reply', template: 'feature-exists-pro' },
          { type: 'tag', value: 'pro-upsell-opportunity' }
        ]
      },

      '#streakhelp': {
        name: 'Streak Lost Response',
        actions: [
          { type: 'category', value: 'streak' },
          { type: 'reply', template: 'streak-lost' }
        ]
      },

      // Text expansion shortcuts
      '::thanks': 'Thank you for reaching out to Focus Mode support! ',
      '::sorry': 'I apologize for any inconvenience this has caused. ',
      '::followup': "I'm following up on our previous conversation. ",
      '::update': 'Here\'s an update on your request: ',
      '::fixed': 'Great news! This issue has been resolved in the latest update. ',
      '::steps': 'Please try these steps:\n1. \n2. \n3. ',
      '::debug': 'To help investigate, please share your debug info:\nFocus Mode popup → Settings → About → "Copy Debug Info" → Paste here',
      '::nuclear': 'Nuclear Mode is working as designed — it\'s intentionally unbypassable. ',
      '::pro': 'This feature is available in Focus Mode Pro ($4.99/mo or $49.99 lifetime). ',
      '::review': 'If you\'re enjoying Focus Mode, we\'d love a review on the Chrome Web Store! ',
      '::score': 'Focus Score is a rolling 7-day average measuring your focus consistency. ',
      '::streak': 'Streaks require at least 1 focus session per calendar day. '
    };

    for (const [shortcut, config] of Object.entries(defaults)) {
      this.macros.set(shortcut, config);
    }
  }

  async executeMacro(ticketId, macroKey, agentId) {
    const macro = this.macros.get(macroKey);
    if (!macro) throw new Error(`Macro ${macroKey} not found`);

    // Text shortcuts return string directly
    if (typeof macro === 'string') {
      return { type: 'text-expansion', content: macro };
    }

    const ticket = await this.db.tickets.findById(ticketId);
    const results = [];

    for (const action of macro.actions) {
      const result = await this.executeAction(ticket, action, agentId);
      results.push(result);
    }

    return { macro: macroKey, results };
  }

  async executeAction(ticket, action, agentId) {
    switch (action.type) {
      case 'reply':
        return this.sendTemplatedReply(ticket, action.template);
      case 'tag':
        if (action.values) {
          for (const tag of action.values) await this.addTag(ticket.id, tag);
          return { action: 'tag', values: action.values };
        }
        return this.addTag(ticket.id, action.value);
      case 'status':
        return this.updateStatus(ticket.id, action.value);
      case 'category':
        return this.updateCategory(ticket.id, action.value);
      case 'priority':
        return this.updatePriority(ticket.id, action.value);
      case 'assignTo':
        return this.assignTicket(ticket.id, action.value);
      case 'escalate':
        return this.escalateTicket(ticket.id, action.tier);
      case 'survey':
        return this.scheduleSurvey(ticket.id, action.delay);
      case 'createFeatureRequest':
        return this.createFeatureFromTicket(ticket);
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  expandTextShortcuts(text) {
    let expanded = text;
    for (const [shortcut, replacement] of this.macros.entries()) {
      if (typeof replacement === 'string') {
        expanded = expanded.replace(shortcut, replacement);
      }
    }
    return expanded;
  }
}
```

### 9.5 Error Tracking Integration

```javascript
// server/support/error-tracking-integration.js
class FocusErrorTrackingIntegration {
  constructor(config) {
    this.sentryDSN = config.sentryDSN;
    this.helpDeskAPI = config.helpDeskAPI;
  }

  // Listen for error alerts from Sentry
  async handleErrorAlert(errorData) {
    const {
      errorId,
      message,
      stack,
      userCount,
      firstSeen,
      lastSeen,
      affectedVersions
    } = errorData;

    // Check if ticket already exists for this error
    const existingTicket = await this.findTicketByErrorId(errorId);

    if (existingTicket) {
      await this.updateErrorTicket(existingTicket.id, errorData);
    } else {
      await this.createErrorTicket(errorData);
    }

    // Alert team if error affects many users
    if (userCount > 100 || this.isCriticalFocusModeError(errorData)) {
      await this.alertTeam(errorData);
    }
  }

  async createErrorTicket(errorData) {
    const ticket = {
      subject: `[Auto] Error: ${errorData.message.substring(0, 60)}`,
      body: this.formatErrorReport(errorData),
      category: 'bug',
      priority: this.determineErrorPriority(errorData),
      tags: ['auto-created', 'error-tracking', `error-${errorData.errorId}`],
      internal: true,
      errorId: errorData.errorId,
      metadata: {
        stack: errorData.stack,
        affectedVersions: errorData.affectedVersions,
        userCount: errorData.userCount
      }
    };

    return this.helpDeskAPI.createTicket(ticket);
  }

  formatErrorReport(errorData) {
    return `## Automatic Error Report — Focus Mode - Blocker

**Error ID:** ${errorData.errorId}
**Message:** ${errorData.message}
**Users Affected:** ${errorData.userCount}
**First Seen:** ${errorData.firstSeen}
**Last Seen:** ${errorData.lastSeen}

### Affected Versions
${errorData.affectedVersions.join(', ')}

### Component
${this.detectFocusModeComponent(errorData)}

### Stack Trace
\`\`\`
${errorData.stack}
\`\`\`

### Suggested Actions
${this.suggestActions(errorData)}`;
  }

  detectFocusModeComponent(errorData) {
    const stack = (errorData.stack || '').toLowerCase();
    const message = (errorData.message || '').toLowerCase();
    const combined = stack + ' ' + message;

    if (combined.includes('nuclear')) return 'Nuclear Mode Engine';
    if (combined.includes('pomodoro') || combined.includes('timer')) return 'Pomodoro Timer';
    if (combined.includes('score') || combined.includes('gamif')) return 'Focus Score System';
    if (combined.includes('streak')) return 'Streak Tracker';
    if (combined.includes('declarativenetrequest') || combined.includes('block')) return 'Blocking Engine';
    if (combined.includes('service-worker') || combined.includes('background')) return 'Service Worker';
    if (combined.includes('popup')) return 'Popup UI';
    if (combined.includes('options')) return 'Options Page';
    if (combined.includes('content-script') || combined.includes('block-page')) return 'Block Page / Content Script';
    if (combined.includes('stripe') || combined.includes('license') || combined.includes('pro')) return 'Pro / Licensing';
    return 'Unknown Component';
  }

  determineErrorPriority(errorData) {
    if (this.isCriticalFocusModeError(errorData)) return 'urgent';
    if (errorData.userCount > 1000) return 'urgent';
    if (errorData.userCount > 100) return 'high';
    return 'normal';
  }

  isCriticalFocusModeError(errorData) {
    const criticalPatterns = [
      /nuclear.*fail/i,           // Nuclear Mode failure
      /block.*not.*work/i,        // Blocking failure
      /service.worker.*crash/i,   // Service worker crash
      /data.*loss/i,              // Data loss
      /security/i,                // Security issue
      /license.*invalid/i,        // License validation failure
      /stripe.*error/i,           // Payment processing error
      /score.*corrupt/i           // Focus Score data corruption
    ];

    return criticalPatterns.some(p =>
      p.test(errorData.message) || p.test(errorData.stack)
    );
  }

  suggestActions(errorData) {
    const actions = [];
    const component = this.detectFocusModeComponent(errorData);

    switch (component) {
      case 'Nuclear Mode Engine':
        actions.push('- CRITICAL: Verify Nuclear Mode is still enforcing blocks');
        actions.push('- Check service worker lifecycle for Nuclear Mode state persistence');
        actions.push('- Review declarativeNetRequest rule updates');
        break;
      case 'Blocking Engine':
        actions.push('- Verify declarativeNetRequest rules are being applied');
        actions.push('- Check for rule limit (MAX_NUMBER_OF_DYNAMIC_RULES)');
        actions.push('- Test with common blocked sites (YouTube, Twitter, Reddit)');
        break;
      case 'Service Worker':
        actions.push('- Check for unhandled promise rejections');
        actions.push('- Verify alarm listeners are re-registered on wake');
        actions.push('- Check chrome.storage access patterns');
        break;
      case 'Pro / Licensing':
        actions.push('- Verify Stripe webhook handling');
        actions.push('- Check license validation endpoint');
        actions.push('- Test offline license grace period');
        break;
      default:
        actions.push('- Reproduce the error locally');
        actions.push('- Check recent code changes in affected component');
    }

    if (errorData.userCount > 50) {
      actions.push('- Consider hotfix release if confirmed');
    }

    return actions.join('\n');
  }

  // Link customer support tickets to error reports
  async linkTicketToError(ticketId, errorSignature) {
    const errorId = await this.findErrorBySignature(errorSignature);

    if (errorId) {
      await this.helpDeskAPI.updateTicket(ticketId, {
        relatedErrorId: errorId,
        tags: ['linked-to-error']
      });

      // Auto-notify customer when error is fixed
      await this.subscribeToErrorFix(ticketId, errorId);
    }
  }

  // Notify all affected customers when an error is fixed
  async notifyAffectedCustomers(errorId, resolution) {
    const linkedTickets = await this.helpDeskAPI.findTickets({
      relatedErrorId: errorId,
      status: { $ne: 'resolved' }
    });

    for (const ticket of linkedTickets) {
      await this.helpDeskAPI.sendReply(ticket.id, {
        template: 'bug-fixed',
        data: {
          fix_description: resolution.description,
          version: resolution.version
        }
      });

      await this.helpDeskAPI.updateTicket(ticket.id, {
        status: 'resolved',
        tags: ['auto-resolved-by-fix']
      });
    }
  }
}
```

---

## Integration Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                   Focus Mode Support System                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐     │
│  │ In-App   │  │  Email   │  │ Discord  │  │  Live Chat   │     │
│  │ Widget   │  │          │  │   Bot    │  │   (Crisp)    │     │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘     │
│       │              │              │               │             │
│       └──────────────┴──────┬───────┴───────────────┘             │
│                             │                                     │
│                     ┌───────▼───────┐                             │
│                     │  Help Desk    │                             │
│                     │ (Freshdesk)   │                             │
│                     └───────┬───────┘                             │
│                             │                                     │
│              ┌──────────────┼──────────────┐                     │
│              │              │              │                       │
│      ┌───────▼──────┐ ┌────▼─────┐ ┌─────▼──────┐               │
│      │ Auto-Tagger  │ │ Auto-    │ │  Chatbot   │               │
│      │ + Categorizer│ │ Responder│ │            │               │
│      └───────┬──────┘ └────┬─────┘ └─────┬──────┘               │
│              │              │              │                       │
│      ┌───────▼──────┐ ┌────▼─────┐ ┌─────▼──────┐               │
│      │  Sentiment   │ │ Template │ │   Macro    │               │
│      │  Analyzer    │ │  Engine  │ │   System   │               │
│      └───────┬──────┘ └──────────┘ └────────────┘               │
│              │                                                    │
│      ┌───────▼──────────────────────────────────┐                │
│      │           Escalation Manager              │                │
│      │  Tier 1 → Tier 2 → Tier 3 (Engineering) │                │
│      └───────┬──────────────────────────────────┘                │
│              │                                                    │
│  ┌───────────┼───────────┬───────────────┐                       │
│  │           │           │               │                       │
│  ▼           ▼           ▼               ▼                       │
│ SLA       Feature    Review          Error                       │
│ Monitor   Tracker    Monitor         Tracking                    │
│                                     (Sentry)                     │
│                                                                   │
│  ┌──────────────────────────────────────┐                        │
│  │        Support Metrics Dashboard     │                        │
│  │  Volume | Response | CSAT | Cost     │                        │
│  └──────────────────────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

### Module Inventory

| Module | Type | Description |
|--------|------|-------------|
| FocusFeedbackWidget | Client-side | In-extension feedback collection with system info |
| FreshdeskAPI / ZendeskAPI | Server | Help desk ticket creation and management |
| Discord Support Bot | Server | Community support with auto-categorization |
| FocusTicketCategorizer | Server | 14-category Focus Mode-aware categorization |
| FocusBugFeatureClassifier | Server | Bug vs feature request detection |
| FocusSentimentAnalyzer | Server | Sentiment analysis with Focus Mode stress triggers |
| FocusAutoTagger | Server | Combined categorization + classification + sentiment |
| FocusModeResponseTemplates | Data | 37 canned responses across 8 categories |
| FocusTemplateEngine | Server | Variable substitution engine for templates |
| FocusReviewMonitor | Server | CWS review monitoring and analysis |
| FocusReviewResponder | Server | Rating-based response template selection |
| FocusReviewSolicitation | Client | Engagement-gated review solicitation |
| FocusFeatureTracker | Server | Feature request tracking with voting and roadmap |
| FocusFeedbackLoop | Server | Post-release feedback collection and NPS |
| FocusReleaseNotesManager | Server | Multi-channel release communication |
| FocusSupportMetrics | Server | KPI calculation with Focus Mode-specific metrics |
| FocusSLAMonitor | Server | SLA breach detection and escalation alerts |
| FocusSupportCostAnalyzer | Server | Cost per ticket and automation ROI |
| FocusEscalationManager | Server | 3-tier escalation with Focus Mode triggers |
| FocusRefundProcessor | Server | Policy-based refund evaluation and processing |
| FocusVIPHandler | Server | VIP detection and priority support |
| FocusAutoResponder | Server | Pattern-based auto-resolution (15 patterns) |
| FocusSupportChatbot | Server | Intent-based conversational support |
| FocusMacroSystem | Server | 14 action macros + 12 text shortcuts |
| FocusErrorTrackingIntegration | Server | Sentry integration with component detection |

### Implementation Priority

| Priority | Component | Complexity | Impact |
|----------|-----------|------------|--------|
| P0 | FocusFeedbackWidget | Medium | Direct user feedback collection |
| P0 | Help desk integration (Freshdesk) | Low | Centralized ticket management |
| P0 | FocusModeResponseTemplates | Low | Consistent, fast responses |
| P0 | FocusTicketCategorizer | Medium | Automated triage |
| P1 | FocusAutoResponder | Medium | Reduces manual work by 20%+ |
| P1 | FAQ + Knowledge Base | Low | Self-service ticket deflection |
| P1 | FocusSLAMonitor | Medium | SLA compliance tracking |
| P1 | FocusEscalationManager | Medium | Proper issue routing |
| P2 | FocusSupportChatbot | High | Interactive self-service |
| P2 | FocusReviewMonitor | Medium | CWS rating protection |
| P2 | FocusFeatureTracker | Medium | Product feedback pipeline |
| P2 | FocusMacroSystem | Low | Agent efficiency |
| P3 | Discord Support Bot | Medium | Community support channel |
| P3 | FocusErrorTrackingIntegration | Medium | Proactive bug detection |
| P3 | FocusSupportCostAnalyzer | Low | ROI tracking |
| P3 | FocusVIPHandler | Low | Power user retention |
| P3 | FocusReviewSolicitation | Low | Rating improvement |

---

## Key Design Decisions

### Automation Without Losing Human Touch
- Auto-responder covers 15 common patterns with high confidence (>85%)
- Low-confidence matches are flagged for human review, not auto-resolved
- Chatbot always offers "Talk to a human" option
- Nuclear Mode lockout tickets get immediate empathy response before resolution explanation

### Focus Mode Component Awareness
- Error tracking identifies which Focus Mode component is affected (Nuclear Mode, Pomodoro, Focus Score, etc.)
- This enables faster routing to the right engineer
- Component-specific suggested actions guide debugging

### Macros Balance Speed and Quality
- 14 action macros handle the most common support workflows
- 12 text shortcuts provide Focus Mode-specific boilerplate
- Agent can always customize responses before sending
- Nuclear Mode has both "by design" and "bug" macros to prevent wrong responses

### Chatbot Handles Focus Mode-Specific Intents
- 15 intents covering all major Focus Mode features
- Follow-up flows for multi-step troubleshooting
- Automatic escalation for Nuclear Mode bugs (Tier 3 + urgent)
- Feature request collection feeds directly into roadmap

---

*Agent 5 — Automation Tools & Integration Architecture — Complete*
