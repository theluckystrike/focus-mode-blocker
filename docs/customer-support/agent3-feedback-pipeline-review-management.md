# Agent 3 — Feedback-to-Feature Pipeline & Review Management
## Phase 19: Customer Support Automation — Focus Mode - Blocker

> **Date:** February 11, 2026 | **Agent:** 3 of 5
> **Scope:** Sections 5–6 — Feedback-to-Feature Pipeline, Review Management
> **Depends on:** Phase 02 (Monetization — Pro tiers), Phase 14 (Growth — CWS listing), Phase 17 (Churn Prevention — engagement signals, milestone system)

---

## 5. Feedback-to-Feature Pipeline

### 5.1 Feature Request Tracking System

```javascript
// server/support/feature-tracker.js
class FocusFeatureTracker {
  constructor(dbConnection) {
    this.db = dbConnection;
  }

  async createFeatureRequest(data) {
    // Check for duplicates first
    const duplicates = await this.getDuplicates(data);
    if (duplicates.length > 0) {
      // Merge vote into existing request
      const existing = duplicates[0];
      await this.vote(existing.id, data.userId);
      return { merged: true, existingFeature: existing };
    }

    const feature = {
      id: this.generateId(),
      title: data.title,
      description: data.description,
      submittedBy: data.userId,
      submittedAt: new Date(),
      status: 'new',  // new → under-review → planned → in-progress → completed → declined
      votes: 1,
      voters: [data.userId],
      category: this.categorizeFeature(data),
      tags: data.tags || [],
      priority: null,
      targetRelease: null,
      comments: [],
      relatedTickets: [data.ticketId],
      // Focus Mode-specific metadata
      focusContext: {
        requestedBy: data.userTier || 'free',  // free or pro
        featureArea: this.detectFeatureArea(data.title + ' ' + data.description),
        wouldBeProOnly: null,  // Decided during review
        estimatedComplexity: null
      }
    };

    await this.db.features.insert(feature);
    await this.notifyProductTeam(feature);
    return { merged: false, feature };
  }

  categorizeFeature(data) {
    const text = (data.title + ' ' + data.description).toLowerCase();

    const categories = {
      'blocklist': ['block', 'site', 'domain', 'url', 'whitelist', 'allowlist', 'filter', 'category'],
      'pomodoro': ['pomodoro', 'timer', 'session', 'break', 'interval', 'countdown'],
      'focus-score': ['score', 'points', 'gamification', 'level', 'achievement', 'milestone'],
      'nuclear-mode': ['nuclear', 'lock', 'unbypassable', 'strict', 'hardcore'],
      'streaks': ['streak', 'daily', 'consecutive', 'habit', 'chain'],
      'block-page': ['block page', 'redirect', 'motivation', 'quote', 'theme'],
      'ui-ux': ['design', 'dark mode', 'popup', 'interface', 'layout', 'widget'],
      'integration': ['integrate', 'calendar', 'todoist', 'notion', 'slack', 'spotify'],
      'analytics': ['stats', 'analytics', 'report', 'chart', 'graph', 'history', 'dashboard'],
      'scheduling': ['schedule', 'time', 'weekday', 'weekend', 'work hours', 'auto'],
      'sync': ['sync', 'device', 'cloud', 'backup', 'export', 'import'],
      'social': ['share', 'friend', 'team', 'compete', 'leaderboard', 'group']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(kw => text.includes(kw))) {
        return category;
      }
    }
    return 'general';
  }

  detectFeatureArea(text) {
    const lower = text.toLowerCase();
    const areas = [
      { area: 'blocking-engine', patterns: ['block', 'filter', 'declarativenetrequest', 'redirect'] },
      { area: 'gamification', patterns: ['score', 'streak', 'milestone', 'achievement', 'level', 'badge'] },
      { area: 'timer', patterns: ['pomodoro', 'timer', 'countdown', 'session', 'break'] },
      { area: 'nuclear', patterns: ['nuclear', 'unbypassable', 'lock'] },
      { area: 'ui', patterns: ['popup', 'options', 'block page', 'dark mode', 'theme', 'widget'] },
      { area: 'data', patterns: ['sync', 'export', 'import', 'backup', 'cloud'] },
      { area: 'social', patterns: ['share', 'friend', 'team', 'compete', 'leaderboard'] },
      { area: 'integration', patterns: ['calendar', 'todoist', 'notion', 'slack', 'api', 'webhook'] }
    ];

    for (const { area, patterns } of areas) {
      if (patterns.some(p => lower.includes(p))) return area;
    }
    return 'general';
  }

  async vote(featureId, userId) {
    const feature = await this.db.features.findById(featureId);

    if (feature.voters.includes(userId)) {
      throw new Error('Already voted');
    }

    feature.votes++;
    feature.voters.push(userId);

    await this.db.features.update(featureId, feature);
    await this.checkVoteThreshold(feature);

    return feature;
  }

  async checkVoteThreshold(feature) {
    const thresholds = {
      10: 'review-candidate',
      25: 'popular',
      50: 'high-demand',
      100: 'critical-demand'
    };

    for (const [votes, tag] of Object.entries(thresholds)) {
      if (feature.votes >= parseInt(votes) && !feature.tags.includes(tag)) {
        feature.tags.push(tag);
        await this.notifyProductTeam(feature, `Feature "${feature.title}" reached ${votes} votes`);
      }
    }
  }

  async updateStatus(featureId, newStatus, details = {}) {
    const feature = await this.db.features.findById(featureId);
    const oldStatus = feature.status;

    feature.status = newStatus;
    feature.statusHistory = feature.statusHistory || [];
    feature.statusHistory.push({
      from: oldStatus,
      to: newStatus,
      at: new Date(),
      by: details.updatedBy,
      note: details.note
    });

    if (details.targetRelease) {
      feature.targetRelease = details.targetRelease;
    }

    if (details.wouldBeProOnly !== undefined) {
      feature.focusContext.wouldBeProOnly = details.wouldBeProOnly;
    }

    await this.db.features.update(featureId, feature);
    await this.notifyVoters(feature, oldStatus, newStatus);

    return feature;
  }

  async notifyVoters(feature, oldStatus, newStatus) {
    const statusMessages = {
      'under-review': `We're reviewing "${feature.title}" — thanks for your suggestion!`,
      'planned': `Great news! "${feature.title}" is now planned for Focus Mode development.`,
      'in-progress': `We've started working on "${feature.title}" for Focus Mode!`,
      'completed': `"${feature.title}" is now available in Focus Mode! Update your extension to try it.`,
      'declined': `Update on "${feature.title}": We've decided not to implement this at this time.`
    };

    const message = statusMessages[newStatus];
    if (message) {
      for (const voterId of feature.voters) {
        await this.sendNotification(voterId, {
          type: 'feature-update',
          featureId: feature.id,
          message,
          featureTitle: feature.title,
          newStatus
        });
      }
    }
  }

  async getPublicRoadmap() {
    const features = await this.db.features.find({
      status: { $in: ['planned', 'in-progress'] }
    });

    return {
      planned: features
        .filter(f => f.status === 'planned')
        .sort((a, b) => b.votes - a.votes),
      inProgress: features
        .filter(f => f.status === 'in-progress')
        .sort((a, b) => new Date(a.targetRelease) - new Date(b.targetRelease)),
      recentlyCompleted: await this.db.features.find({
        status: 'completed',
        $orderby: { updatedAt: -1 },
        $limit: 10
      })
    };
  }

  async getDuplicates(newFeature) {
    const keywords = (newFeature.title || '').toLowerCase().split(' ')
      .filter(w => w.length > 3 && !['with', 'from', 'that', 'this', 'have', 'mode', 'focus'].includes(w));

    const existing = await this.db.features.find({
      status: { $nin: ['completed', 'declined'] }
    });

    return existing.filter(f => {
      const existingKeywords = f.title.toLowerCase().split(' ');
      const matches = keywords.filter(kw => existingKeywords.includes(kw));
      return matches.length >= 2;
    });
  }

  async getTopRequestsByArea() {
    const all = await this.db.features.find({
      status: { $nin: ['completed', 'declined'] }
    });

    const byArea = {};
    for (const feature of all) {
      const area = feature.focusContext?.featureArea || 'general';
      if (!byArea[area]) byArea[area] = [];
      byArea[area].push(feature);
    }

    // Sort each area by votes
    for (const area of Object.keys(byArea)) {
      byArea[area].sort((a, b) => b.votes - a.votes);
    }

    return byArea;
  }

  generateId() {
    return 'FR-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5);
  }
}
```

### 5.2 Customer Feedback Loop Automation

```javascript
// server/support/feedback-loop.js
class FocusFeedbackLoop {
  constructor(featureTracker, emailService, analyticsService) {
    this.features = featureTracker;
    this.email = emailService;
    this.analytics = analyticsService;
  }

  // Automated feedback collection after feature release
  async schedulePostReleaseFollowup(featureId, releaseDate) {
    const feature = await this.features.getById(featureId);

    const schedules = [
      { days: 7, type: 'initial-feedback', template: 'focusFeatureFollowUp7Day' },
      { days: 30, type: 'usage-survey', template: 'focusFeatureFollowUp30Day' }
    ];

    for (const schedule of schedules) {
      await this.scheduleEmail({
        featureId,
        sendAt: new Date(releaseDate.getTime() + schedule.days * 86400000),
        template: schedule.template,
        recipients: feature.voters,
        data: {
          featureName: feature.title,
          featureCategory: feature.category
        }
      });
    }
  }

  async collectFeatureFeedback(featureId, userId, feedback) {
    const data = {
      featureId,
      userId,
      rating: feedback.rating,              // 1-5
      usageFrequency: feedback.usageFrequency, // daily, weekly, rarely, never
      meetsExpectations: feedback.meetsExpectations, // yes, partially, no
      suggestions: feedback.suggestions,
      wouldRecommend: feedback.wouldRecommend,  // 0-10 NPS
      submittedAt: new Date()
    };

    await this.db.featureFeedback.insert(data);

    // Track analytics
    this.analytics.track('feature_feedback', {
      featureId,
      rating: feedback.rating,
      meetsExpectations: feedback.meetsExpectations
    });

    // Low rating → create follow-up ticket
    if (feedback.rating <= 2) {
      await this.createFollowupTicket(featureId, userId, feedback);
    }

    // High rating + willing to recommend → request CWS review
    if (feedback.rating >= 4 && feedback.wouldRecommend >= 8) {
      await this.requestReview(userId);
    }

    return data;
  }

  async generateFeatureReport(featureId) {
    const feedback = await this.db.featureFeedback.find({ featureId });
    if (!feedback.length) return null;

    const report = {
      featureId,
      totalResponses: feedback.length,
      averageRating: feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length,
      meetsExpectations: {
        yes: feedback.filter(f => f.meetsExpectations === 'yes').length,
        partially: feedback.filter(f => f.meetsExpectations === 'partially').length,
        no: feedback.filter(f => f.meetsExpectations === 'no').length
      },
      usageFrequency: {
        daily: feedback.filter(f => f.usageFrequency === 'daily').length,
        weekly: feedback.filter(f => f.usageFrequency === 'weekly').length,
        rarely: feedback.filter(f => f.usageFrequency === 'rarely').length,
        never: feedback.filter(f => f.usageFrequency === 'never').length
      },
      commonSuggestions: this.extractCommonThemes(feedback.map(f => f.suggestions)),
      npsScore: this.calculateNPS(feedback)
    };

    return report;
  }

  calculateNPS(feedback) {
    const promoters = feedback.filter(f => f.wouldRecommend >= 9).length;
    const detractors = feedback.filter(f => f.wouldRecommend <= 6).length;
    return Math.round(((promoters - detractors) / feedback.length) * 100);
  }

  extractCommonThemes(suggestions) {
    const filtered = suggestions.filter(Boolean);
    if (!filtered.length) return [];

    // Simple keyword frequency for theme extraction
    const words = {};
    const stopWords = new Set(['the', 'a', 'an', 'is', 'it', 'to', 'and', 'or', 'for', 'in', 'on', 'of', 'i', 'would', 'be', 'have', 'this', 'that']);

    for (const suggestion of filtered) {
      const tokens = suggestion.toLowerCase().split(/\W+/).filter(w => w.length > 2 && !stopWords.has(w));
      for (const token of tokens) {
        words[token] = (words[token] || 0) + 1;
      }
    }

    return Object.entries(words)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ theme: word, mentions: count }));
  }

  async createFollowupTicket(featureId, userId, feedback) {
    const feature = await this.features.getById(featureId);
    await this.db.tickets.insert({
      subject: `[Feature Feedback] Low rating for "${feature.title}"`,
      body: `User rated "${feature.title}" ${feedback.rating}/5.\n\nFeedback: ${feedback.suggestions || 'No additional comments'}`,
      category: 'feature-feedback',
      priority: 'normal',
      userId,
      tags: ['feature-feedback', 'low-rating', `feature-${featureId}`]
    });
  }
}
```

### 5.3 Release Notes Communication (Focus Mode-Specific)

```javascript
// server/support/release-notes.js
const FocusReleaseNotesTemplates = {
  email: {
    subject: "Focus Mode v{version} — {headline}",
    body: `Hi {customer_name},

We've just released Focus Mode - Blocker v{version} with exciting updates!

## What's New
{new_features}

## Improvements
{improvements}

## Bug Fixes
{bug_fixes}

---

**How to Update**
Chrome usually updates extensions automatically within 24-48 hours.
To update immediately: chrome://extensions → Enable Developer Mode → Update

**Your Focus Score and streaks are unaffected** by this update.

**Your Feedback Matters**
These updates include features requested by users like you!
Have more ideas? Reply to this email or visit our feedback portal: https://zovo.one/roadmap

Keep focusing!
The Zovo Team`
  },

  inApp: {
    title: "What's New in Focus Mode v{version}",
    template: `
      <div class="release-notes focus-release">
        <h2>Version {version}</h2>
        <p class="date">{release_date}</p>

        <div class="section new-features">
          <h3>New Features</h3>
          <ul>{new_features_list}</ul>
        </div>

        <div class="section improvements">
          <h3>Improvements</h3>
          <ul>{improvements_list}</ul>
        </div>

        <div class="section fixes">
          <h3>Bug Fixes</h3>
          <ul>{fixes_list}</ul>
        </div>

        <div class="cta">
          <a href="{feedback_link}" class="btn-primary">Share Your Feedback</a>
          <a href="{full_notes_link}" class="btn-secondary">Full Release Notes</a>
        </div>
      </div>
    `
  },

  changelog: `
# Focus Mode - Blocker Changelog

## [{version}] - {date}

### Added
{added_items}

### Changed
{changed_items}

### Fixed
{fixed_items}

### Pro
{pro_items}

### Security
{security_items}
  `
};

class FocusReleaseNotesManager {
  async publishRelease(releaseData) {
    // 1. Update changelog
    await this.updateChangelog(releaseData);

    // 2. Notify voters of completed features
    for (const featureId of releaseData.completedFeatures || []) {
      await this.featureTracker.updateStatus(featureId, 'completed', {
        note: `Released in Focus Mode v${releaseData.version}`
      });
    }

    // 3. Send email to subscribers
    await this.sendReleaseEmail(releaseData);

    // 4. Update in-app "What's New" notification
    await this.setInAppNotification(releaseData);

    // 5. Post to Discord #focus-mode-announcements
    await this.postToDiscord(releaseData);

    // 6. Schedule post-release feedback collection for new features
    for (const featureId of releaseData.completedFeatures || []) {
      await this.feedbackLoop.schedulePostReleaseFollowup(featureId, new Date());
    }
  }

  async sendReleaseEmail(releaseData) {
    const template = FocusReleaseNotesTemplates.email;

    // Segment recipients
    const proUsers = await this.db.users.find({ isPro: true });
    const freeUsers = await this.db.users.find({ isPro: false, emailOptIn: true });

    // Pro users: full release notes
    for (const user of proUsers) {
      await this.email.send({
        to: user.email,
        subject: this.render(template.subject, releaseData),
        body: this.render(template.body, { ...releaseData, customer_name: user.name })
      });
    }

    // Free users: abbreviated notes + Pro feature highlights
    for (const user of freeUsers) {
      const freeTemplate = this.addProUpsell(template.body, releaseData);
      await this.email.send({
        to: user.email,
        subject: this.render(template.subject, releaseData),
        body: this.render(freeTemplate, { ...releaseData, customer_name: user.name })
      });
    }
  }

  addProUpsell(template, releaseData) {
    if (releaseData.proFeatures?.length) {
      return template + `\n\n**New Pro Features in This Release:**\n${releaseData.proFeatures.join('\n')}\n\nUpgrade to Pro: https://zovo.one/pro`;
    }
    return template;
  }
}
```

### 5.4 Focus Mode Feature Request Categories

Expected feature request distribution based on extension architecture:

| Category | Expected % | Example Requests |
|----------|-----------|------------------|
| Blocklist enhancements | 20% | Wildcard blocking, time-based blocking, site categories |
| Pomodoro improvements | 15% | Custom sounds, auto-start, Spotify integration |
| Integration requests | 15% | Calendar sync, Todoist, Notion, Slack status |
| UI/UX improvements | 12% | Dark mode, widget, mini-timer overlay |
| Focus Score refinements | 10% | Scoring algorithm, weekly reports, sharing |
| Nuclear Mode variations | 8% | Panic pause, progressive lockout, team Nuclear |
| Analytics/reporting | 8% | Detailed history, productivity reports, charts |
| Social features | 7% | Leaderboards, friend challenges, team competition |
| Streak improvements | 3% | Freeze days, vacation mode, grace period |
| Block page customization | 2% | Custom backgrounds, games during breaks, quotes |

### 5.5 Public Roadmap Structure

```
https://zovo.one/roadmap

┌─────────────────────────────────────────────┐
│ Focus Mode - Blocker Public Roadmap          │
├──────────────┬──────────────┬───────────────┤
│ Planned      │ In Progress  │ Completed     │
├──────────────┼──────────────┼───────────────┤
│ ▪ Calendar   │ ▪ Dark mode  │ ▪ Nuclear     │
│   integration│   for popup  │   Mode        │
│   (32 votes) │   (89 votes) │   (156 votes) │
│              │              │               │
│ ▪ Spotify    │ ▪ Vacation   │ ▪ Focus Score │
│   focus mode │   streak     │   history     │
│   (28 votes) │   freeze     │   (98 votes)  │
│              │   (45 votes) │               │
│ ▪ Team       │              │ ▪ Custom      │
│   blocklists │              │   Pomodoro    │
│   (24 votes) │              │   (87 votes)  │
└──────────────┴──────────────┴───────────────┘

Vote on features → Log in with extension
Submit new idea → [+ New Feature Request]
```

---

## 6. Review Management

### 6.1 Chrome Web Store Review Monitoring

```javascript
// server/support/review-monitor.js
class FocusReviewMonitor {
  constructor(extensionId, config) {
    this.extensionId = extensionId;
    this.config = config;
    this.lastChecked = null;
  }

  // Note: CWS has no official review API
  // Use scheduled scraping or third-party services (e.g., ChromeStats, Extension Monitor)
  async fetchReviews() {
    const response = await fetch(
      `https://chrome.google.com/webstore/detail/${this.extensionId}`
    );
    return this.parseReviews(await response.text());
  }

  async checkNewReviews() {
    const reviews = await this.fetchReviews();
    const newReviews = reviews.filter(r =>
      !this.lastChecked || new Date(r.date) > this.lastChecked
    );

    for (const review of newReviews) {
      await this.processReview(review);
    }

    this.lastChecked = new Date();
    return newReviews;
  }

  async processReview(review) {
    const analysis = this.analyzeReview(review);

    // Create ticket for negative reviews (1-2 stars)
    if (review.rating <= 2) {
      await this.createReviewTicket(review, analysis);
    }

    // Track in analytics
    await this.trackReview(review, analysis);

    // Alert team for urgent reviews
    if (analysis.requiresUrgentResponse) {
      await this.alertTeam(review, analysis);
    }

    // If positive and mentions Focus Score/streaks, flag for testimonial
    if (review.rating >= 4 && analysis.mentionsFocusFeature) {
      await this.flagForTestimonial(review);
    }
  }

  analyzeReview(review) {
    const text = review.text.toLowerCase();

    return {
      sentiment: this.detectSentiment(text),
      category: this.categorizeReview(text),
      mentionsBug: /bug|crash|error|broken|not work/i.test(text),
      mentionsCompetitor: /better than|switched from|compared to|cold turkey|stayfocusd|leechblock/i.test(text),
      mentionsFocusFeature: /focus score|nuclear mode|pomodoro|streak|block page/i.test(text),
      mentionsPro: /pro |premium|upgrade|paid|subscription|lifetime/i.test(text),
      mentionsNuclear: /nuclear/i.test(text),
      requiresUrgentResponse: review.rating === 1 ||
        /scam|spam|malware|virus|steal|privacy|data/i.test(text),
      suggestedResponse: this.getSuggestedResponse(review),
      responseTemplate: this.selectResponseTemplate(review)
    };
  }

  categorizeReview(text) {
    const categories = {
      'bug-report': ['bug', 'crash', 'error', 'broken', 'not working', 'glitch'],
      'feature-request': ['wish', 'would be nice', 'please add', 'missing', 'need'],
      'praise': ['love', 'great', 'amazing', 'best', 'thank', 'lifesaver', 'productive'],
      'nuclear-praise': ['nuclear', 'unbypassable', 'cant cheat', 'actually works'],
      'performance': ['slow', 'heavy', 'memory', 'battery', 'resource'],
      'pricing': ['expensive', 'price', 'free', 'pay', 'subscription', 'worth'],
      'comparison': ['better', 'worse', 'compared', 'switched', 'alternative'],
      'privacy-concern': ['privacy', 'permission', 'data', 'tracking', 'spy']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(kw => text.includes(kw))) {
        return category;
      }
    }
    return 'general';
  }

  selectResponseTemplate(review) {
    if (review.rating === 5) return 'fiveStar';
    if (review.rating === 4) return 'fourStar';
    if (review.rating === 3) return 'threeStar';
    if (review.rating === 2) return 'twoStar';
    return 'oneStar';
  }
}
```

### 6.2 Review Response Templates (Focus Mode-Specific)

```javascript
// server/support/review-responses.js
const FocusReviewResponseTemplates = {
  // 5-STAR REVIEWS
  fiveStar: {
    simple: `Thank you so much for the 5-star review! We're thrilled Focus Mode is helping you stay productive. Keep up those focus sessions — your Focus Score proves you've got this!`,

    detailed: `Wow, thank you for such a wonderful review! Your support means the world to the Zovo team. We're constantly working on new features to make Focus Mode even better — stay tuned for exciting updates. If you ever have suggestions, email us at feedback@zovo.one!`,

    nuclearPraise: `Thank you for the amazing review! We're glad Nuclear Mode is helping you achieve deep focus. It's our most requested feature, and reviews like yours confirm we built it right. Stay focused!`,

    focusScorePraise: `Thank you! We love hearing that Focus Score is motivating you. Gamifying productivity was a core goal — and you're proving it works. Keep building those streaks!`,

    withSuggestion: `Thank you for the 5 stars and the great suggestion! We've noted your feedback about {suggestion} and added it to our roadmap. Keep the ideas coming — they shape Focus Mode's future!`
  },

  // 4-STAR REVIEWS
  fourStar: {
    general: `Thank you for the great review! We'd love to know what would make Focus Mode a 5-star experience for you. Email us at feedback@zovo.one — we read every message and your input directly shapes our updates!`,

    withSuggestion: `Thanks for the 4-star review and the thoughtful suggestion! We've noted your feedback about {suggestion} and it's on our radar. Updates are released regularly — stay tuned!`,

    proSuggestion: `Thank you for the review! Some features you might be looking for are available in Focus Mode Pro, including Nuclear Mode, custom Pomodoro intervals, and unlimited blocked sites. Check it out in Settings > Pro!`
  },

  // 3-STAR REVIEWS
  threeStar: {
    general: `Thank you for your honest feedback! We'd really like to understand what we can improve. Could you email us at support@zovo.one with specifics? We're committed to making Focus Mode better — and your input helps us prioritize.`,

    withIssue: `Thanks for the feedback. We're sorry to hear about the issue with {issue}. We've investigated and {resolution}. Please update Focus Mode (chrome://extensions > Update) and let us know if this helps!`,

    competitorMention: `Thank you for the comparison feedback! We're always looking to improve. We'd love to know which specific features you feel are missing — email feedback@zovo.one. Focus Mode is updated frequently based on user feedback like yours.`
  },

  // 2-STAR REVIEWS
  twoStar: {
    general: `We're sorry Focus Mode didn't meet your expectations. We'd genuinely like to help resolve any issues. Please email support@zovo.one — we respond within 24 hours and want to make this right.`,

    bugReport: `We apologize for the trouble! We've identified the issue you mentioned and a fix is in progress. Please email support@zovo.one with your extension version so we can keep you updated. Thank you for bringing this to our attention.`,

    nuclearComplaint: `We understand Nuclear Mode can feel intense — that's by design! It's meant to be the ultimate commitment to focus. For a less strict approach, try regular blocking without Nuclear Mode. If you'd like help configuring Focus Mode to match your needs, email support@zovo.one.`,

    pricingConcern: `Thank you for the feedback on pricing. Focus Mode's Free version includes 5 blocked sites, Pomodoro timer, Focus Score, and streaks — no payment required. Pro ($4.99/mo or $49.99 lifetime) adds Nuclear Mode, unlimited sites, and advanced features. We'd love to hear what would make it worth it for you!`
  },

  // 1-STAR REVIEWS
  oneStar: {
    empathetic: `We're truly sorry about your experience. This isn't the quality we strive for. Please contact us directly at support@zovo.one so we can understand what happened and make it right. We take every piece of feedback seriously.`,

    technicalIssue: `We sincerely apologize for the technical issues. We've identified a bug that may have caused this and are rolling out a fix. Please email support@zovo.one with your extension version — we'd like to personally ensure this is resolved for you.`,

    nuclearFrustration: `We understand the frustration of being locked out by Nuclear Mode. This strict behavior is intentional — it's what makes Focus Mode effective where other blockers fail. For future sessions, try shorter durations or use regular blocking instead. We're sorry for the difficult experience.`,

    permissionConcern: `We understand permission concerns completely. Focus Mode uses the minimum permissions needed: Storage (save settings), Alarms (Pomodoro timer), Active Tab (check URLs), Notifications (session alerts), and Declarative Net Request (blocking engine). We NEVER collect browsing data or personal information. Full details: https://zovo.one/privacy`,

    unfairReview: `We're sorry to hear about your frustration. We'd love the opportunity to address your concerns directly. Please email support@zovo.one with details, and we'll do our best to help. We're committed to making Focus Mode work well for everyone.`
  },

  // SPECIFIC SCENARIOS
  scenarios: {
    refundMention: `We understand, and we're sorry Focus Mode didn't work out. If you purchased Pro, please email billing@zovo.one for a refund — we have a no-questions-asked policy within 14 days. The Free version will remain available to you with 5 blocked sites and full Pomodoro timer.`,

    competitorMention: `Thanks for the comparison! We're always improving Focus Mode. What sets us apart: Focus Score gamification, Nuclear Mode (truly unbypassable), and the Pomodoro timer built in. We'd love to know which specific features you prefer elsewhere — email feedback@zovo.one.`,

    outdatedReview: `Thank you for this review! Since you wrote it, we've released significant improvements including {improvements}. Please try the latest version (chrome://extensions > Update) and let us know if things have improved!`,

    permissions: `We understand permission concerns. Each Focus Mode permission has a specific purpose: Storage (your settings), Alarms (Pomodoro timer), Active Tab (URL checking for blocking), Notifications (session reminders), Declarative Net Request (the blocking engine itself). We never access your browsing history or personal data. Privacy policy: https://zovo.one/privacy`
  }
};

// Review Response Generator
class FocusReviewResponder {
  constructor(extensionName = 'Focus Mode') {
    this.extensionName = extensionName;
  }

  generateResponse(review) {
    const templates = FocusReviewResponseTemplates;
    let response;

    // Select base template by rating
    const ratingMap = {
      5: templates.fiveStar.simple,
      4: templates.fourStar.general,
      3: templates.threeStar.general,
      2: templates.twoStar.general,
      1: templates.oneStar.empathetic
    };
    response = ratingMap[review.rating] || templates.oneStar.empathetic;

    // Check for specific Focus Mode scenarios
    const text = review.text.toLowerCase();

    if (/nuclear/i.test(text)) {
      if (review.rating >= 4) response = templates.fiveStar.nuclearPraise;
      else if (review.rating === 2) response = templates.twoStar.nuclearComplaint;
      else if (review.rating === 1) response = templates.oneStar.nuclearFrustration;
    }

    if (/focus score|score/i.test(text) && review.rating >= 4) {
      response = templates.fiveStar.focusScorePraise;
    }

    if (/refund|money back/i.test(text)) {
      response = templates.scenarios.refundMention;
    }

    if (/permission|access|privacy|data/i.test(text)) {
      response = templates.scenarios.permissions;
    }

    if (/price|expensive|cost/i.test(text) && review.rating <= 3) {
      response = templates.twoStar.pricingConcern;
    }

    if (/cold turkey|stayfocusd|leechblock|freedom/i.test(text)) {
      response = templates.scenarios.competitorMention;
    }

    return this.personalizeResponse(response, review);
  }

  personalizeResponse(template, review) {
    return template
      .replace('{reviewer_name}', review.authorName || 'there')
      .replace(/\[Extension Name\]/g, this.extensionName)
      .replace(/Focus Mode/g, 'Focus Mode');  // Ensure brand consistency
  }
}
```

### 6.3 Review Solicitation System

```javascript
// src/support/review-solicitation.js
class FocusReviewSolicitation {
  constructor(config) {
    this.config = {
      minSessionsBeforeAsk: 5,      // At least 5 Pomodoro sessions
      minDaysInstalled: 7,           // At least 7 days since install
      minFocusScore: 30,             // At least 30 Focus Score (shows engagement)
      minStreakDays: 3,              // At least 3-day streak
      cooldownAfterDecline: 30,      // Wait 30 days after "Not now"
      maxAsksTotal: 3,               // Never ask more than 3 times
      ...config
    };
  }

  async shouldAskForReview() {
    const stats = await this.getUserStats();

    // Already rated
    if (stats.hasRated) return { ask: false, reason: 'already_rated' };

    // Too many asks
    if (stats.timesAsked >= this.config.maxAsksTotal) {
      return { ask: false, reason: 'max_asks_reached' };
    }

    // Recently declined
    if (stats.lastDeclined) {
      const daysSinceDecline = (Date.now() - stats.lastDeclined) / 86400000;
      if (daysSinceDecline < this.config.cooldownAfterDecline) {
        return { ask: false, reason: 'cooldown_active' };
      }
    }

    // Check Focus Mode-specific engagement thresholds
    const daysInstalled = (Date.now() - stats.installDate) / 86400000;

    if (daysInstalled < this.config.minDaysInstalled) {
      return { ask: false, reason: 'too_new' };
    }
    if (stats.completedSessions < this.config.minSessionsBeforeAsk) {
      return { ask: false, reason: 'not_enough_sessions' };
    }
    if (stats.focusScore < this.config.minFocusScore) {
      return { ask: false, reason: 'low_engagement' };
    }
    if (stats.currentStreak < this.config.minStreakDays) {
      return { ask: false, reason: 'no_streak' };
    }

    return { ask: true, reason: 'eligible' };
  }

  getBestMomentToAsk(recentAction) {
    // Ask after positive Focus Mode experiences
    const goodMoments = [
      'completed_pomodoro_session',
      'achieved_new_focus_score_high',
      'reached_streak_milestone',     // 7, 14, 30, 60, 100 days
      'completed_nuclear_session',
      'earned_milestone_badge',
      'upgraded_to_pro',
      'hit_focus_score_level_up'      // e.g., went from "Focused" to "Highly Focused"
    ];

    return goodMoments.includes(recentAction);
  }

  getReviewPrompt(userStats) {
    const prompts = {
      default: {
        title: "Enjoying Focus Mode?",
        message: "You've completed {sessions} focus sessions! A quick review helps us improve and helps others discover Focus Mode.",
        positive: "Leave a Review",
        negative: "Not Now",
        neutral: "Send Feedback Instead"
      },
      streakMilestone: {
        title: "Amazing {streak}-Day Streak!",
        message: "You're on fire! Your dedication to focused work is impressive. Would you share your experience with others?",
        positive: "Share My Experience",
        negative: "Maybe Later",
        neutral: "I Have Suggestions"
      },
      focusScoreHigh: {
        title: "Focus Score: {score}/100!",
        message: "You're in the top tier of Focus Mode users! Your expert opinion would really help others discover us.",
        positive: "Rate Focus Mode",
        negative: "Not Right Now",
        neutral: "Give Feedback"
      },
      afterNuclear: {
        title: "Deep Focus Session Complete!",
        message: "You just crushed a Nuclear Mode session. If Focus Mode is helping you stay productive, a review would mean a lot!",
        positive: "Leave a Review",
        negative: "Not Now"
      }
    };

    if (userStats.focusScore >= 70) return prompts.focusScoreHigh;
    if (userStats.currentStreak >= 14) return prompts.streakMilestone;
    return prompts.default;
  }

  async getUserStats() {
    const data = await chrome.storage.local.get([
      'installDate', 'completedSessions', 'focusScore', 'currentStreak',
      'reviewTimesAsked', 'reviewLastDeclined', 'hasRated'
    ]);

    return {
      installDate: data.installDate || Date.now(),
      completedSessions: data.completedSessions || 0,
      focusScore: data.focusScore || 0,
      currentStreak: data.currentStreak || 0,
      timesAsked: data.reviewTimesAsked || 0,
      lastDeclined: data.reviewLastDeclined || null,
      hasRated: data.hasRated || false
    };
  }
}
```

### 6.4 Review Response Priority Matrix

| Review Type | Priority | Response Time | Responder |
|------------|----------|---------------|-----------|
| 1-star with security/privacy claim | Urgent | < 2 hours | Senior support + founder |
| 1-star with bug report | High | < 4 hours | Senior support |
| 1-star general | High | < 8 hours | Support agent |
| 2-star any | Normal | < 24 hours | Support agent |
| 3-star with suggestions | Normal | < 48 hours | Support agent |
| 4-star | Low | < 72 hours | Support agent |
| 5-star | Low | < 72 hours | Support agent (optional) |
| Any mentioning competitor | Normal | < 24 hours | Senior support |
| Any mentioning refund/billing | High | < 8 hours | Billing team |

---

## Key Design Decisions

### Feature Tracking is Product Strategy
- Feature requests are categorized by Focus Mode feature area (blocking, gamification, timer, nuclear, etc.)
- Duplicate detection merges votes, preventing fragmentation
- Vote thresholds trigger automatic product team notifications
- Public roadmap builds trust and reduces "when will you add X?" tickets

### Review Management Protects CWS Rating
- Negative reviews create automatic support tickets — every unhappy user is a recovery opportunity
- Nuclear Mode frustration reviews get special templates — empathetic but explaining the intentional design
- Privacy/permission concerns get detailed, factual responses with links to privacy policy
- Review solicitation only triggers after proven engagement (Focus Score 30+, 3+ day streak, 5+ sessions)

### Competitor-Aware Responses
- Competitor mentions (Cold Turkey, StayFocusd, LeechBlock, Freedom) trigger specific templates
- Templates highlight Focus Mode's unique differentiators: Focus Score gamification, Nuclear Mode, built-in Pomodoro
- Never disparage competitors — position Focus Mode as complementary or better fit for specific needs

---

*Agent 3 — Feedback-to-Feature Pipeline & Review Management — Complete*
