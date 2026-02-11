# Agent 1 — Support Channel Setup & Ticket Categorization System
## Phase 19: Customer Support Automation — Focus Mode - Blocker

> **Date:** February 11, 2026 | **Agent:** 1 of 5
> **Scope:** Sections 1–2 — Support Channel Setup, Ticket Categorization System
> **Depends on:** Phase 02 (Monetization — Pro tier structure), Phase 14 (Growth — user acquisition channels), Phase 17 (Churn Prevention — engagement signals), Phase 18 (Security — secure messaging, PII handling)

---

## 1. Support Channel Setup

### 1.1 Email Support Configuration

**Primary Support Email:** `support@zovo.one`

```json
// manifest.json — support email in description
{
  "name": "Focus Mode - Blocker",
  "description": "Block distracting websites, stay focused with Pomodoro timer, Focus Score gamification & Nuclear Mode. Support: support@zovo.one"
}
```

**Email Infrastructure:**
- Primary domain: `support@zovo.one`
- Configure SPF, DKIM, DMARC for deliverability
- Auto-forward all support emails to help desk
- Create category aliases:
  - `bugs@zovo.one` → Bug reports
  - `billing@zovo.one` → Pro subscription, refunds, license keys
  - `feedback@zovo.one` → Feature requests, suggestions
  - `nuclear@zovo.one` → Nuclear Mode unlock requests (dedicated due to sensitivity)

**Email Subject Line Parsing Rules:**
```
Subject Line Parsing Rules (Focus Mode-Specific):
- Contains "bug" or "error" or "crash"           → Bug category
- Contains "refund" or "cancel" or "billing"      → Billing category
- Contains "how to" or "help" or "can't find"     → How-to category
- Contains "feature" or "wish" or "suggestion"    → Feature Request category
- Contains "nuclear" or "locked out" or "unlock"  → Nuclear Mode category
- Contains "focus score" or "score wrong"          → Focus Score category
- Contains "pomodoro" or "timer"                   → Pomodoro category
- Contains "blocked" or "whitelist" or "allow"     → Blocklist category
- Contains "pro" or "upgrade" or "premium"         → Pro/Billing category
- Contains "streak" or "lost streak"               → Streak category
```

### 1.2 In-Extension Feedback Widget

```javascript
// src/support/feedback-widget.js
class FocusFeedbackWidget {
  constructor(config) {
    this.apiEndpoint = config.apiEndpoint || 'https://api.zovo.one/feedback';
    this.extensionId = chrome.runtime.id;
    this.extensionVersion = chrome.runtime.getManifest().version;
  }

  async collectSystemInfo() {
    const storage = await chrome.storage.local.get([
      'focusScore', 'currentStreak', 'isPro', 'blockedSites',
      'pomodoroSettings', 'nuclearModeActive', 'installDate'
    ]);

    return {
      browser: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      extensionVersion: this.extensionVersion,
      screenResolution: `${screen.width}x${screen.height}`,
      timestamp: new Date().toISOString(),
      // Focus Mode context (anonymized)
      focusScore: storage.focusScore || 0,
      currentStreak: storage.currentStreak || 0,
      isPro: storage.isPro || false,
      blockedSiteCount: (storage.blockedSites || []).length,
      nuclearModeActive: storage.nuclearModeActive || false,
      daysSinceInstall: storage.installDate
        ? Math.floor((Date.now() - storage.installDate) / 86400000)
        : 'unknown'
    };
  }

  async submitFeedback(type, message, email = null) {
    const systemInfo = await this.collectSystemInfo();

    // PII sanitization (Phase 18 — FocusPIIHandler)
    const sanitizedMessage = this.sanitizeMessage(message);

    const payload = {
      type,     // 'bug', 'feature', 'nuclear-help', 'billing', 'question', 'other'
      message: sanitizedMessage,
      email,
      systemInfo,
      extensionId: this.extensionId
    };

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return response.ok;
    } catch (error) {
      // Queue for retry (offline support)
      await this.queueForRetry(payload);
      return false;
    }
  }

  sanitizeMessage(message) {
    // Remove potential PII patterns (Phase 18)
    return message
      .replace(/\b[\w.-]+@[\w.-]+\.\w+\b/g, '[EMAIL_REDACTED]')
      .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD_REDACTED]')
      .replace(/FOCUS-[\w]{4}-[\w]{4}-[\w]{4}/g, '[LICENSE_REDACTED]');
  }

  renderWidget(container) {
    // Uses SafeDOM (Phase 18) for XSS-safe rendering
    const widget = document.createElement('div');
    widget.id = 'focus-feedback-widget';
    widget.className = 'focus-feedback-container';

    widget.innerHTML = ''; // Clear, then build safely
    const form = this.buildForm();
    widget.appendChild(form);
    container.appendChild(widget);
    this.attachEventListeners();
  }

  buildForm() {
    const form = document.createElement('div');
    form.id = 'focus-feedback-form';
    form.className = 'hidden';

    // Type selector
    const select = document.createElement('select');
    select.id = 'feedback-type';
    const types = [
      { value: 'bug', label: 'Report Bug' },
      { value: 'feature', label: 'Feature Request' },
      { value: 'nuclear-help', label: 'Nuclear Mode Help' },
      { value: 'billing', label: 'Billing / Pro Question' },
      { value: 'question', label: 'General Question' },
      { value: 'other', label: 'Other' }
    ];
    types.forEach(t => {
      const option = document.createElement('option');
      option.value = t.value;
      option.textContent = t.label;
      select.appendChild(option);
    });

    // Message textarea
    const textarea = document.createElement('textarea');
    textarea.id = 'feedback-message';
    textarea.placeholder = 'Describe your feedback...';
    textarea.maxLength = 2000;

    // Email input
    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.id = 'feedback-email';
    emailInput.placeholder = 'Email (optional, for follow-up)';

    // Submit button
    const submitBtn = document.createElement('button');
    submitBtn.id = 'feedback-submit';
    submitBtn.textContent = 'Send Feedback';

    form.appendChild(select);
    form.appendChild(textarea);
    form.appendChild(emailInput);
    form.appendChild(submitBtn);

    return form;
  }

  attachEventListeners() {
    document.getElementById('feedback-submit')?.addEventListener('click', async () => {
      const type = document.getElementById('feedback-type').value;
      const message = document.getElementById('feedback-message').value;
      const email = document.getElementById('feedback-email').value;

      if (message.trim().length < 10) {
        this.showError('Please provide at least 10 characters of detail.');
        return;
      }

      const success = await this.submitFeedback(type, message, email || null);
      if (success) {
        this.showConfirmation();
      } else {
        this.showError('Feedback saved — will send when online.');
      }
    });
  }

  showConfirmation() {
    const form = document.getElementById('focus-feedback-form');
    if (form) {
      form.innerHTML = '';
      const msg = document.createElement('p');
      msg.className = 'feedback-success';
      msg.textContent = 'Thank you! We received your feedback and will respond within 24 hours.';
      form.appendChild(msg);
    }
  }

  showError(text) {
    const existing = document.getElementById('feedback-error');
    if (existing) existing.remove();

    const error = document.createElement('p');
    error.id = 'feedback-error';
    error.className = 'feedback-error';
    error.textContent = text;
    document.getElementById('focus-feedback-form')?.prepend(error);
  }

  async queueForRetry(payload) {
    const queue = (await chrome.storage.local.get('feedbackQueue')).feedbackQueue || [];
    queue.push({ ...payload, queuedAt: Date.now() });
    await chrome.storage.local.set({ feedbackQueue: queue });
  }
}
```

**Widget Placement:**
- Options page → "Help & Feedback" tab
- Popup → Gear icon → "Send Feedback" link
- Block page → "Report Issue" link (for false-positive blocks)
- Post-session summary → "How was this session?" micro-feedback

### 1.3 Help Desk Integration

**Recommended Platform: Freshdesk** (best value for indie extension)

```javascript
// server/integrations/freshdesk-integration.js
const FreshdeskAPI = {
  domain: 'zovo.freshdesk.com',
  apiKey: process.env.FRESHDESK_API_KEY,

  async createTicket(feedbackData) {
    const ticket = {
      subject: `[${feedbackData.type}] ${feedbackData.message.substring(0, 60)}`,
      description: this.formatDescription(feedbackData),
      email: feedbackData.email || 'anonymous@focus-mode-user.com',
      priority: this.mapPriority(feedbackData),
      status: 2, // Open
      tags: ['focus-mode', feedbackData.type, `v${feedbackData.systemInfo.extensionVersion}`],
      custom_fields: {
        cf_extension_version: feedbackData.systemInfo.extensionVersion,
        cf_browser: feedbackData.systemInfo.browser,
        cf_focus_score: feedbackData.systemInfo.focusScore,
        cf_is_pro: feedbackData.systemInfo.isPro,
        cf_streak: feedbackData.systemInfo.currentStreak,
        cf_nuclear_active: feedbackData.systemInfo.nuclearModeActive,
        cf_blocked_site_count: feedbackData.systemInfo.blockedSiteCount,
        cf_days_installed: feedbackData.systemInfo.daysSinceInstall
      }
    };

    return fetch(`https://${this.domain}/api/v2/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(this.apiKey + ':X')
      },
      body: JSON.stringify(ticket)
    });
  },

  formatDescription(data) {
    return `
**User Message:**
${data.message}

**System Info:**
- Extension Version: ${data.systemInfo.extensionVersion}
- Browser: ${data.systemInfo.browser}
- Platform: ${data.systemInfo.platform}
- Screen: ${data.systemInfo.screenResolution}

**Focus Mode Context:**
- Focus Score: ${data.systemInfo.focusScore}/100
- Current Streak: ${data.systemInfo.currentStreak} days
- Pro User: ${data.systemInfo.isPro ? 'Yes' : 'No'}
- Blocked Sites: ${data.systemInfo.blockedSiteCount}
- Nuclear Mode Active: ${data.systemInfo.nuclearModeActive ? 'YES' : 'No'}
- Days Since Install: ${data.systemInfo.daysSinceInstall}
    `;
  },

  mapPriority(data) {
    // Freshdesk: 1=Low, 2=Medium, 3=High, 4=Urgent
    if (data.type === 'nuclear-help' && data.systemInfo.nuclearModeActive) return 4;
    if (data.type === 'bug') return 3;
    if (data.type === 'billing') return 3;
    if (data.systemInfo.isPro) return 3; // Pro users get higher priority
    return 2;
  }
};
```

**Zendesk Alternative:**
```javascript
// server/integrations/zendesk-integration.js
const ZendeskAPI = {
  subdomain: 'zovo',
  apiToken: process.env.ZENDESK_API_TOKEN,

  async createTicket(feedbackData) {
    const ticket = {
      ticket: {
        subject: `[Focus Mode] [${feedbackData.type}] ${feedbackData.message.substring(0, 50)}...`,
        comment: {
          body: this.formatDescription(feedbackData)
        },
        requester: {
          email: feedbackData.email || 'anonymous@focus-mode-user.com'
        },
        tags: ['focus-mode', feedbackData.type, feedbackData.systemInfo.isPro ? 'pro-user' : 'free-user'],
        priority: this.mapPriority(feedbackData),
        custom_fields: [
          { id: 'focus_score', value: feedbackData.systemInfo.focusScore },
          { id: 'extension_version', value: feedbackData.systemInfo.extensionVersion },
          { id: 'is_pro', value: feedbackData.systemInfo.isPro },
          { id: 'nuclear_active', value: feedbackData.systemInfo.nuclearModeActive }
        ]
      }
    };

    return fetch(`https://${this.subdomain}.zendesk.com/api/v2/tickets.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiToken}`
      },
      body: JSON.stringify(ticket)
    });
  },

  mapPriority(data) {
    const urgentKeywords = ['crash', 'not working', 'broken', 'urgent', 'locked out', 'nuclear'];
    const message = data.message.toLowerCase();
    if (urgentKeywords.some(kw => message.includes(kw))) return 'high';
    if (data.type === 'bug' || data.type === 'billing') return 'normal';
    return 'low';
  }
};
```

### 1.4 Crisp Live Chat Integration

```html
<!-- In options page (options.html) — for real-time support -->
<script type="text/javascript">
  window.$crisp = [];
  window.CRISP_WEBSITE_ID = "ZOVO_CRISP_WEBSITE_ID";

  (function() {
    var d = document;
    var s = d.createElement("script");
    s.src = "https://client.crisp.chat/l.js";
    s.async = 1;
    d.getElementsByTagName("head")[0].appendChild(s);
  })();

  // Set Focus Mode user context
  $crisp.push(["set", "session:data", [
    ["extension_version", chrome.runtime.getManifest().version],
    ["focus_score", localStorage.getItem('focusScore') || '0'],
    ["is_pro", localStorage.getItem('isPro') || 'false'],
    ["streak", localStorage.getItem('currentStreak') || '0'],
    ["nuclear_active", localStorage.getItem('nuclearModeActive') || 'false']
  ]]);
</script>
```

**When to show live chat:**
- Options page → "Help" section (always available)
- After 2+ failed troubleshooting steps in interactive troubleshooter
- Pro users → immediate access via popup
- Nuclear Mode unlock requests → priority routing

### 1.5 Discord Community Support

```javascript
// server/discord/focus-mode-support-bot.js
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const CHANNELS = {
  support: 'focus-mode-support-channel-id',
  bugs: 'focus-mode-bugs-channel-id',
  features: 'focus-mode-features-channel-id',
  nuclearHelp: 'focus-mode-nuclear-help-channel-id'
};

const TEAM_ROLE_ID = 'zovo-team-role-id';

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!Object.values(CHANNELS).includes(message.channel.id)) return;

  const content = message.content.toLowerCase();

  // Focus Mode-specific auto-categorization
  if (content.includes('nuclear') || content.includes('locked out')) {
    await message.react('🔒');
    await createSupportThread(message, 'nuclear-mode-help');
  } else if (content.includes('focus score') || content.includes('score wrong')) {
    await message.react('📊');
    await createSupportThread(message, 'focus-score-issue');
  } else if (content.includes('streak') || content.includes('lost my streak')) {
    await message.react('🔥');
    await createSupportThread(message, 'streak-issue');
  } else if (content.includes('pomodoro') || content.includes('timer')) {
    await message.react('🍅');
    await createSupportThread(message, 'pomodoro-issue');
  } else if (content.includes('pro') || content.includes('upgrade') || content.includes('license')) {
    await message.react('⭐');
    await createSupportThread(message, 'pro-billing');
  } else if (content.includes('bug') || content.includes('error') || content.includes('crash')) {
    await message.react('🐛');
    await createSupportThread(message, 'bug-report');
  } else if (content.includes('feature') || content.includes('suggestion')) {
    await message.react('💡');
    await createSupportThread(message, 'feature-request');
  } else if (content.includes('how to') || content.includes('help')) {
    await message.react('❓');
    await createSupportThread(message, 'help-request');
  }
});

async function createSupportThread(message, type) {
  const thread = await message.startThread({
    name: `${type}-${message.author.username}-${Date.now()}`,
    autoArchiveDuration: 1440
  });

  const categoryInfo = {
    'nuclear-mode-help': { color: 0xFF0000, emoji: '🔒', quickHelp: 'Nuclear Mode locks are by design. If you set a timer, it cannot be bypassed until it expires.' },
    'focus-score-issue': { color: 0x3498DB, emoji: '📊', quickHelp: 'Focus Score updates every session. Check Settings > Focus Score for calculation details.' },
    'streak-issue': { color: 0xF39C12, emoji: '🔥', quickHelp: 'Streaks require at least one focus session per day. Check your streak history in the popup.' },
    'pomodoro-issue': { color: 0xE74C3C, emoji: '🍅', quickHelp: 'Pomodoro timer runs in the background. Make sure notifications are enabled.' },
    'pro-billing': { color: 0x9B59B6, emoji: '⭐', quickHelp: 'For billing issues, email billing@zovo.one with your license key or Stripe receipt.' },
    'bug-report': { color: 0xFF6B6B, emoji: '🐛', quickHelp: 'Please share: extension version, browser version, and steps to reproduce.' },
    'feature-request': { color: 0x2ECC71, emoji: '💡', quickHelp: 'Vote on features at zovo.one/roadmap or describe your idea here.' },
    'help-request': { color: 0x1ABC9C, emoji: '❓', quickHelp: 'Check our FAQ at zovo.one/faq. Common answers there!' }
  };

  const info = categoryInfo[type] || categoryInfo['help-request'];

  const embed = new EmbedBuilder()
    .setTitle(`${info.emoji} Support Request: ${type.replace(/-/g, ' ')}`)
    .setDescription('A team member will assist you soon.')
    .addFields(
      { name: 'Quick Help', value: info.quickHelp },
      { name: 'Resources', value: '[FAQ](https://zovo.one/faq) | [Docs](https://zovo.one/docs) | [Status](https://status.zovo.one)' }
    )
    .setColor(info.color)
    .setFooter({ text: 'Focus Mode - Blocker Support' });

  await thread.send({ embeds: [embed] });
  await thread.send(`<@&${TEAM_ROLE_ID}> New ${type} from ${message.author.tag}`);
}

client.login(process.env.DISCORD_BOT_TOKEN);
```

**Discord Channel Structure:**
```
#focus-mode-support       — General support
#focus-mode-bugs          — Bug reports
#focus-mode-features      — Feature requests & voting
#focus-mode-nuclear-help  — Nuclear Mode assistance
#focus-mode-announcements — Updates & releases
#focus-mode-tips          — User tips & productivity tricks
```

---

## 2. Ticket Categorization System

### 2.1 Focus Mode Ticket Categorizer

```javascript
// server/support/ticket-categorizer.js
class FocusTicketCategorizer {
  constructor() {
    this.rules = {
      categories: {
        installation: {
          keywords: ['install', 'setup', 'download', 'add to chrome', 'enable', 'activate', 'pin icon'],
          priority: 'normal'
        },
        bug: {
          keywords: ['bug', 'error', 'crash', 'broken', 'not working', 'fail', 'issue', 'problem', 'glitch'],
          priority: 'high'
        },
        billing: {
          keywords: ['refund', 'payment', 'charge', 'subscription', 'cancel', 'invoice', 'price', 'license', 'pro', 'upgrade', 'stripe'],
          priority: 'high'
        },
        feature: {
          keywords: ['feature', 'request', 'suggestion', 'would be nice', 'wish', 'add', 'improve', 'roadmap'],
          priority: 'low'
        },
        howto: {
          keywords: ['how to', 'how do', 'can i', 'is it possible', 'where is', 'tutorial', 'guide'],
          priority: 'normal'
        },
        performance: {
          keywords: ['slow', 'lag', 'freeze', 'memory', 'cpu', 'battery', 'heavy', 'resource'],
          priority: 'high'
        },
        compatibility: {
          keywords: ['website', 'page', 'site', 'doesnt work on', 'not compatible', 'conflict', 'other extension'],
          priority: 'normal'
        },
        // Focus Mode-specific categories
        nuclearMode: {
          keywords: ['nuclear', 'locked out', 'cant turn off', 'stuck', 'nuclear mode', 'unblock', 'emergency', 'unlock'],
          priority: 'urgent'
        },
        focusScore: {
          keywords: ['focus score', 'score wrong', 'score not updating', 'points', 'score decreased', 'score calculation'],
          priority: 'normal'
        },
        pomodoro: {
          keywords: ['pomodoro', 'timer', 'countdown', 'break', 'session length', 'work interval', 'rest'],
          priority: 'normal'
        },
        blocklist: {
          keywords: ['block', 'unblock', 'whitelist', 'allowlist', 'blocked site', 'add site', 'remove site', 'website blocking'],
          priority: 'normal'
        },
        streak: {
          keywords: ['streak', 'lost streak', 'streak broken', 'consecutive days', 'streak gone', 'daily streak'],
          priority: 'normal'
        },
        blockPage: {
          keywords: ['block page', 'blocked page', 'redirect', 'motivation', 'quote', 'override'],
          priority: 'low'
        }
      },

      severityIndicators: {
        critical: ['urgent', 'asap', 'emergency', 'data loss', 'security', 'immediately', 'locked out'],
        frustrated: ['terrible', 'worst', 'hate', 'awful', 'useless', 'garbage', 'waste', 'scam', 'uninstall'],
        positive: ['love', 'great', 'amazing', 'thank', 'awesome', 'helpful', 'productive', 'focused']
      }
    };
  }

  categorize(text) {
    const lowerText = text.toLowerCase();
    const result = {
      category: 'general',
      tags: [],
      priority: 'normal',
      sentiment: 'neutral',
      confidence: 0,
      focusModeContext: {}
    };

    // Category detection with Focus Mode awareness
    let maxMatches = 0;
    for (const [category, config] of Object.entries(this.rules.categories)) {
      const matches = config.keywords.filter(kw => lowerText.includes(kw)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        result.category = category;
        result.priority = config.priority;
        result.confidence = Math.min(matches / config.keywords.length, 1);
      }
      if (matches > 0) {
        result.tags.push(category);
      }
    }

    // Focus Mode context extraction
    result.focusModeContext = this.extractFocusModeContext(lowerText);

    // Severity adjustment
    if (this.rules.severityIndicators.critical.some(kw => lowerText.includes(kw))) {
      result.priority = 'urgent';
      result.tags.push('critical');
    }

    // Sentiment detection
    if (this.rules.severityIndicators.frustrated.some(kw => lowerText.includes(kw))) {
      result.sentiment = 'negative';
      result.tags.push('frustrated-user');
      if (result.priority !== 'urgent') result.priority = 'high';
    } else if (this.rules.severityIndicators.positive.some(kw => lowerText.includes(kw))) {
      result.sentiment = 'positive';
    }

    // Nuclear Mode escalation: always urgent
    if (result.category === 'nuclearMode') {
      result.priority = 'urgent';
      result.tags.push('nuclear-mode');
    }

    return result;
  }

  extractFocusModeContext(text) {
    const context = {};

    // Detect mentioned Focus Score
    const scoreMatch = text.match(/(?:focus )?score[:\s]*(\d+)/i);
    if (scoreMatch) context.mentionedScore = parseInt(scoreMatch[1]);

    // Detect mentioned streak
    const streakMatch = text.match(/streak[:\s]*(\d+)/i);
    if (streakMatch) context.mentionedStreak = parseInt(streakMatch[1]);

    // Detect Nuclear Mode duration
    const nuclearMatch = text.match(/nuclear.*?(\d+)\s*(hour|min|day)/i);
    if (nuclearMatch) {
      context.nuclearDuration = `${nuclearMatch[1]} ${nuclearMatch[2]}`;
    }

    // Detect mentioned websites
    const urlPattern = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/g;
    const urls = [];
    let match;
    while ((match = urlPattern.exec(text)) !== null) {
      if (!['zovo.one', 'chrome.google.com', 'support.google.com'].includes(match[1])) {
        urls.push(match[1]);
      }
    }
    if (urls.length) context.mentionedSites = urls;

    // Detect Pro-related keywords
    if (/pro |premium|upgrade|paid|license|subscription/i.test(text)) {
      context.proRelated = true;
    }

    return context;
  }
}
```

### 2.2 Priority Classification Matrix (Focus Mode-Specific)

| Criteria | Urgent | High | Normal | Low |
|----------|--------|------|--------|-----|
| **Impact** | Extension unusable / Nuclear Mode lock issue | Major feature broken (blocking, Pomodoro) | Minor issue (Focus Score display, UI) | Cosmetic / suggestion |
| **Users Affected** | All users | Many users | Some users | Edge case |
| **Focus Mode Keywords** | nuclear, locked out, data loss, security | bug, crash, billing, refund | how to, streak, score, timer | feature, suggestion, cosmetic |
| **User Sentiment** | Extremely frustrated | Frustrated | Neutral | Positive |
| **Account Type** | Pro + Nuclear Mode active | Pro user | Free (active, streak > 7) | Free (new, < 7 days) |
| **Response Target** | < 1 hour | < 4 hours | < 24 hours | < 72 hours |

### 2.3 Bug vs Feature Request Classifier

```javascript
// server/support/bug-feature-classifier.js
class FocusBugFeatureClassifier {
  constructor() {
    this.bugPatterns = [
      /doesn'?t work/i,
      /not working/i,
      /broken/i,
      /error/i,
      /crash/i,
      /bug/i,
      /fail/i,
      /issue/i,
      /problem/i,
      /used to work/i,
      /stopped working/i,
      /can'?t [a-z]+/i,
      /won'?t [a-z]+/i,
      /score (is )?wrong/i,
      /streak (was )?(lost|reset|broken)/i,
      /timer (is )?(stuck|frozen|wrong)/i,
      /nuclear.*(won'?t|can'?t|not).*(end|stop|unlock)/i,
      /block.*(page|site).*(not|won'?t|can'?t)/i,
      /sites? (not|aren'?t) (being )?blocked/i
    ];

    this.featurePatterns = [
      /would be (nice|great|cool)/i,
      /can you add/i,
      /please add/i,
      /feature request/i,
      /suggestion/i,
      /wish/i,
      /it would help if/i,
      /would love/i,
      /could you (add|include|implement)/i,
      /idea:/i,
      /how about/i,
      /would be (nice|great) (if|to)/i,
      /custom(ize|izable|isation)/i,
      /option (to|for)/i,
      /support for/i,
      /integrate with/i
    ];
  }

  classify(text) {
    const bugScore = this.bugPatterns.filter(p => p.test(text)).length;
    const featureScore = this.featurePatterns.filter(p => p.test(text)).length;

    if (bugScore > featureScore) {
      return { type: 'bug', confidence: bugScore / this.bugPatterns.length };
    } else if (featureScore > bugScore) {
      return { type: 'feature', confidence: featureScore / this.featurePatterns.length };
    } else if (bugScore > 0) {
      return { type: 'bug', confidence: 0.5 };
    }
    return { type: 'question', confidence: 0.3 };
  }
}
```

### 2.4 Sentiment Analyzer (Focus Mode Context-Aware)

```javascript
// server/support/sentiment-analyzer.js
class FocusSentimentAnalyzer {
  constructor() {
    this.positiveWords = new Set([
      'love', 'great', 'amazing', 'awesome', 'excellent', 'fantastic',
      'helpful', 'useful', 'perfect', 'best', 'thank', 'thanks', 'appreciate',
      'wonderful', 'brilliant', 'outstanding', 'productive', 'focused',
      'changed my life', 'game changer', 'lifesaver', 'recommend'
    ]);

    this.negativeWords = new Set([
      'hate', 'terrible', 'awful', 'worst', 'useless', 'garbage', 'trash',
      'horrible', 'annoying', 'frustrated', 'disappointed', 'waste', 'scam',
      'broken', 'stupid', 'ridiculous', 'pathetic', 'uninstalling',
      'locked out', 'lost streak', 'lost data', 'overblocking'
    ]);

    this.intensifiers = new Set(['very', 'extremely', 'really', 'absolutely', 'totally', 'completely']);

    // Focus Mode-specific emotional triggers
    this.focusTriggers = {
      highStress: ['locked out', 'nuclear', 'cant access', 'deadline', 'urgent work'],
      streakLoss: ['lost streak', 'streak gone', 'streak reset', 'streak broken'],
      billingAnger: ['charged twice', 'unauthorized', 'wont refund', 'still charging']
    };
  }

  analyze(text) {
    const words = text.toLowerCase().split(/\W+/);
    let score = 0;
    let intensity = 1;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];

      if (this.intensifiers.has(word)) {
        intensity = 1.5;
        continue;
      }

      if (this.positiveWords.has(word)) {
        score += 1 * intensity;
      } else if (this.negativeWords.has(word)) {
        score -= 1 * intensity;
      }

      intensity = 1;
    }

    // Check Focus Mode stress triggers
    const lowerText = text.toLowerCase();
    let stressLevel = 'none';
    if (this.focusTriggers.highStress.some(t => lowerText.includes(t))) {
      stressLevel = 'high';
      score -= 2;
    }
    if (this.focusTriggers.streakLoss.some(t => lowerText.includes(t))) {
      stressLevel = 'medium';
      score -= 1;
    }
    if (this.focusTriggers.billingAnger.some(t => lowerText.includes(t))) {
      stressLevel = 'high';
      score -= 3;
    }

    const normalizedScore = Math.max(-1, Math.min(1, score / 5));

    return {
      score: normalizedScore,
      label: normalizedScore > 0.2 ? 'positive' : normalizedScore < -0.2 ? 'negative' : 'neutral',
      stressLevel,
      requiresAttention: normalizedScore < -0.5 || stressLevel === 'high',
      suggestedAction: this.getSuggestedAction(normalizedScore, stressLevel)
    };
  }

  getSuggestedAction(score, stressLevel) {
    if (stressLevel === 'high') return 'Escalate to senior support immediately — user under time pressure';
    if (score < -0.7) return 'Escalate to senior support, offer compensation (Pro trial or streak restore)';
    if (score < -0.4) return 'Prioritize response, respond with extra empathy, consider streak/Pro credit';
    if (score < -0.2) return 'Respond with empathy, link to relevant FAQ';
    if (score > 0.5) return 'Request CWS review, offer to feature in testimonials';
    return 'Standard response';
  }
}
```

### 2.5 Auto-Tagging Integration

```javascript
// server/support/auto-tagger.js
class FocusAutoTagger {
  constructor(categorizer, classifier, sentimentAnalyzer) {
    this.categorizer = categorizer;
    this.classifier = classifier;
    this.sentiment = sentimentAnalyzer;
  }

  async processNewTicket(ticket) {
    const fullText = `${ticket.subject} ${ticket.body}`;

    // Run all analyzers
    const category = this.categorizer.categorize(fullText);
    const classification = this.classifier.classify(fullText);
    const sentiment = this.sentiment.analyze(fullText);

    // Merge results
    const enrichedTicket = {
      ...ticket,
      category: category.category,
      tags: [...new Set([...category.tags, classification.type])],
      priority: this.resolvePriority(category.priority, sentiment),
      sentiment: sentiment.label,
      sentimentScore: sentiment.score,
      stressLevel: sentiment.stressLevel,
      classification: classification.type,
      classificationConfidence: classification.confidence,
      focusModeContext: category.focusModeContext,
      suggestedAction: sentiment.suggestedAction,
      requiresAttention: sentiment.requiresAttention
    };

    // Add Pro tag if detected
    if (category.focusModeContext.proRelated || ticket.customFields?.isPro) {
      enrichedTicket.tags.push('pro-user');
    }

    // Add Nuclear Mode tag if detected
    if (category.category === 'nuclearMode' || ticket.customFields?.nuclearActive) {
      enrichedTicket.tags.push('nuclear-active');
    }

    return enrichedTicket;
  }

  resolvePriority(categoryPriority, sentiment) {
    const priorityOrder = ['low', 'normal', 'high', 'urgent'];
    const sentimentPriority = sentiment.requiresAttention ? 'high' : 'normal';

    const catIdx = priorityOrder.indexOf(categoryPriority);
    const sentIdx = priorityOrder.indexOf(sentimentPriority);

    return priorityOrder[Math.max(catIdx, sentIdx)];
  }
}
```

### 2.6 Category Distribution Expectations

Based on Focus Mode - Blocker's feature set, expected ticket distribution:

| Category | Expected % | Notes |
|----------|-----------|-------|
| Bug reports | 25% | Extension conflicts, sites not blocked, timer issues |
| How-to / Questions | 20% | Setup, Pomodoro config, Nuclear Mode questions |
| Blocklist issues | 15% | Adding/removing sites, wildcard patterns, false positives |
| Billing / Pro | 12% | License activation, refunds, upgrade questions |
| Feature requests | 10% | New blocking rules, integrations, UI improvements |
| Nuclear Mode help | 8% | Locked out (by design), duration questions, panic |
| Focus Score / Streaks | 5% | Score calculation questions, streak restoration |
| Performance | 3% | Memory usage, page load impact |
| Block page | 2% | Customization, motivation quotes, override |

---

## Key Design Decisions

### Focus Mode-Specific Categorization
- **Nuclear Mode** tickets are always **urgent** — users are actively locked out and may be panicking
- **Pro users** receive automatic priority boost — they're paying customers
- **Streak-related** tickets get empathy-first responses — losing a streak is emotionally charged
- **Focus Score** questions are treated as educational opportunities, not bugs

### Multi-Channel with Single Source of Truth
- All channels (email, widget, Discord, live chat) feed into Freshdesk
- Every ticket gets Focus Mode context (score, streak, Pro status, Nuclear Mode state)
- PII is sanitized before transmission (Phase 18 compliance)
- Anonymous feedback is accepted but cannot receive follow-up

### Sentiment-Aware Prioritization
- Frustrated users are auto-escalated regardless of issue category
- Focus Mode stress triggers (Nuclear Mode lockout, streak loss, billing anger) further escalate
- Positive sentiment triggers review solicitation workflows (Phase 6)

---

*Agent 1 — Support Channel Setup & Ticket Categorization System — Complete*
