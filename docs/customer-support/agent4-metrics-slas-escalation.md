# Agent 4 — Support Metrics & SLAs + Escalation Procedures
## Phase 19: Customer Support Automation — Focus Mode - Blocker

> **Date:** February 11, 2026 | **Agent:** 4 of 5
> **Scope:** Sections 7–8 — Support Metrics & SLAs, Escalation Procedures
> **Depends on:** Phase 02 (Monetization — Pro tier pricing), Phase 17 (Churn Prevention — retention signals), Phase 18 (Security — incident response)

---

## 7. Support Metrics & SLAs

### 7.1 Key Performance Indicators

```javascript
// server/support/support-metrics.js
class FocusSupportMetrics {
  constructor(db) {
    this.db = db;
  }

  async calculateMetrics(startDate, endDate) {
    const tickets = await this.db.tickets.find({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    return {
      volume: this.getVolumeMetrics(tickets),
      response: this.getResponseMetrics(tickets),
      resolution: this.getResolutionMetrics(tickets),
      satisfaction: await this.getSatisfactionMetrics(startDate, endDate),
      efficiency: this.getEfficiencyMetrics(tickets),
      focusMode: this.getFocusModeMetrics(tickets)
    };
  }

  getVolumeMetrics(tickets) {
    const byCategory = {};
    const byChannel = {};
    const byDay = {};
    const byProStatus = { pro: 0, free: 0 };

    tickets.forEach(ticket => {
      byCategory[ticket.category] = (byCategory[ticket.category] || 0) + 1;
      byChannel[ticket.channel] = (byChannel[ticket.channel] || 0) + 1;

      const day = ticket.createdAt.toISOString().split('T')[0];
      byDay[day] = (byDay[day] || 0) + 1;

      if (ticket.tags?.includes('pro-user')) byProStatus.pro++;
      else byProStatus.free++;
    });

    return {
      total: tickets.length,
      byCategory,
      byChannel,
      byDay,
      byProStatus,
      dailyAverage: tickets.length / Math.max(Object.keys(byDay).length, 1)
    };
  }

  getResponseMetrics(tickets) {
    const responseTimes = tickets
      .filter(t => t.firstResponseAt)
      .map(t => t.firstResponseAt - t.createdAt);

    return {
      averageFirstResponse: this.average(responseTimes),
      medianFirstResponse: this.median(responseTimes),
      percentile95: this.percentile(responseTimes, 95),
      withinSLA: this.calculateSLACompliance(tickets),
      proResponseTime: this.average(
        tickets.filter(t => t.tags?.includes('pro-user') && t.firstResponseAt)
          .map(t => t.firstResponseAt - t.createdAt)
      ),
      freeResponseTime: this.average(
        tickets.filter(t => !t.tags?.includes('pro-user') && t.firstResponseAt)
          .map(t => t.firstResponseAt - t.createdAt)
      )
    };
  }

  getResolutionMetrics(tickets) {
    const resolved = tickets.filter(t => t.status === 'resolved');
    const resolutionTimes = resolved.map(t => t.resolvedAt - t.createdAt);

    return {
      resolutionRate: resolved.length / Math.max(tickets.length, 1),
      averageResolutionTime: this.average(resolutionTimes),
      medianResolutionTime: this.median(resolutionTimes),
      firstContactResolution: this.calculateFCR(resolved),
      autoResolvedRate: resolved.filter(t => t.tags?.includes('auto-resolved')).length / Math.max(resolved.length, 1)
    };
  }

  async getSatisfactionMetrics(startDate, endDate) {
    const surveys = await this.db.surveys.find({
      submittedAt: { $gte: startDate, $lte: endDate }
    });

    if (!surveys.length) return { csat: null, averageRating: null, responseRate: null, nps: null };

    const ratings = surveys.map(s => s.rating);
    const satisfied = surveys.filter(s => s.rating >= 4).length;

    return {
      csat: (satisfied / surveys.length) * 100,
      averageRating: this.average(ratings),
      responseRate: surveys.length / await this.getClosedTicketCount(startDate, endDate),
      nps: this.calculateNPS(surveys)
    };
  }

  getEfficiencyMetrics(tickets) {
    const agentStats = {};

    tickets.forEach(ticket => {
      if (!ticket.assignedTo) return;

      if (!agentStats[ticket.assignedTo]) {
        agentStats[ticket.assignedTo] = { handled: 0, resolved: 0, totalTime: 0 };
      }

      agentStats[ticket.assignedTo].handled++;
      if (ticket.status === 'resolved') {
        agentStats[ticket.assignedTo].resolved++;
        agentStats[ticket.assignedTo].totalTime += ticket.resolvedAt - ticket.createdAt;
      }
    });

    return {
      ticketsPerAgent: Object.entries(agentStats).map(([agent, stats]) => ({
        agent,
        ...stats,
        avgResolutionTime: stats.resolved ? stats.totalTime / stats.resolved : null,
        resolutionRate: stats.handled ? stats.resolved / stats.handled : 0
      })),
      costPerTicket: this.calculateCostPerTicket(tickets)
    };
  }

  // Focus Mode-specific metrics
  getFocusModeMetrics(tickets) {
    return {
      nuclearModeTickets: tickets.filter(t => t.tags?.includes('nuclear-mode')).length,
      nuclearModeResolutionRate: this.calculateCategoryResolution(tickets, 'nuclearMode'),
      focusScoreTickets: tickets.filter(t => t.category === 'focusScore').length,
      streakTickets: tickets.filter(t => t.category === 'streak').length,
      blocklistTickets: tickets.filter(t => t.category === 'blocklist').length,
      proConversionFromSupport: tickets.filter(t =>
        t.tags?.includes('converted-to-pro') && !t.tags?.includes('pro-user')
      ).length,
      topBlockedSiteIssues: this.getTopMentionedSites(tickets)
    };
  }

  calculateCategoryResolution(tickets, category) {
    const categoryTickets = tickets.filter(t => t.category === category);
    const resolved = categoryTickets.filter(t => t.status === 'resolved');
    return categoryTickets.length ? resolved.length / categoryTickets.length : 0;
  }

  getTopMentionedSites(tickets) {
    const sites = {};
    tickets.forEach(t => {
      if (t.focusModeContext?.mentionedSites) {
        for (const site of t.focusModeContext.mentionedSites) {
          sites[site] = (sites[site] || 0) + 1;
        }
      }
    });
    return Object.entries(sites)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([site, count]) => ({ site, count }));
  }

  calculateSLACompliance(tickets) {
    const slaTargets = {
      urgent: 1 * 60 * 60 * 1000,    // 1 hour
      high: 4 * 60 * 60 * 1000,      // 4 hours
      normal: 24 * 60 * 60 * 1000,   // 24 hours
      low: 72 * 60 * 60 * 1000       // 72 hours
    };

    let met = 0;
    let total = 0;

    tickets.forEach(ticket => {
      if (!ticket.firstResponseAt) return;
      total++;
      const responseTime = ticket.firstResponseAt - ticket.createdAt;
      const target = slaTargets[ticket.priority] || slaTargets.normal;
      if (responseTime <= target) met++;
    });

    return total > 0 ? (met / total) * 100 : 0;
  }

  calculateFCR(resolved) {
    const firstContact = resolved.filter(t => (t.messageCount || 1) <= 2);
    return resolved.length ? firstContact.length / resolved.length : 0;
  }

  calculateNPS(surveys) {
    const promoters = surveys.filter(s => s.rating >= 9).length;
    const detractors = surveys.filter(s => s.rating <= 6).length;
    return Math.round(((promoters - detractors) / surveys.length) * 100);
  }

  // Utility methods
  average(arr) {
    return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  }

  median(arr) {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  percentile(arr, p) {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }

  calculateCostPerTicket(tickets) {
    // Placeholder — actual implementation depends on cost tracking
    return null;
  }

  async getClosedTicketCount(startDate, endDate) {
    return (await this.db.tickets.count({
      status: 'resolved',
      resolvedAt: { $gte: startDate, $lte: endDate }
    })) || 1;
  }
}
```

### 7.2 KPI Targets for Focus Mode Support

| Metric | Target | Stretch Goal | Notes |
|--------|--------|-------------|-------|
| First Response Time (Urgent) | < 1 hour | < 30 min | Nuclear Mode lockouts, security issues |
| First Response Time (High) | < 4 hours | < 2 hours | Bugs, billing, Pro users |
| First Response Time (Normal) | < 24 hours | < 12 hours | How-to, general questions |
| First Response Time (Low) | < 72 hours | < 48 hours | Feature requests, cosmetic |
| Resolution Rate | > 85% | > 92% | Excludes "by design" Nuclear Mode tickets |
| First Contact Resolution | > 50% | > 65% | Self-service and auto-resolve improve this |
| CSAT Score | > 85% | > 92% | Based on post-resolution surveys |
| NPS Score | > 40 | > 55 | Quarterly survey |
| Auto-Resolve Rate | > 20% | > 35% | FAQ deflection + auto-responder |
| SLA Compliance | > 90% | > 95% | All priorities combined |
| Pro User Response Time | < 2 hours | < 1 hour | All priorities for Pro users |
| Cost Per Ticket | < $5 | < $3 | Driven by automation and self-service |

### 7.3 SLA Configuration

```javascript
// server/support/sla-config.js
const FocusSLAConfiguration = {
  responseTime: {
    urgent: {
      target: '1 hour',
      targetMs: 1 * 60 * 60 * 1000,
      escalateAfter: '45 minutes',
      escalateAfterMs: 45 * 60 * 1000,
      escalateTo: 'senior-support',
      focusModeExamples: ['Nuclear Mode lockout with urgent need', 'Security vulnerability', 'Data loss', 'Extension completely broken for all users']
    },
    high: {
      target: '4 hours',
      targetMs: 4 * 60 * 60 * 1000,
      escalateAfter: '3 hours',
      escalateAfterMs: 3 * 60 * 60 * 1000,
      escalateTo: 'team-lead',
      focusModeExamples: ['Bug affecting blocking', 'Billing/refund', 'Pro license issues', 'Frustrated user', 'Sites not blocked']
    },
    normal: {
      target: '24 hours',
      targetMs: 24 * 60 * 60 * 1000,
      escalateAfter: '20 hours',
      escalateAfterMs: 20 * 60 * 60 * 1000,
      escalateTo: 'team-lead',
      focusModeExamples: ['How-to questions', 'Focus Score questions', 'Streak questions', 'Pomodoro setup', 'Blocklist help']
    },
    low: {
      target: '72 hours',
      targetMs: 72 * 60 * 60 * 1000,
      escalateAfter: '48 hours',
      escalateAfterMs: 48 * 60 * 60 * 1000,
      escalateTo: null,
      focusModeExamples: ['Feature requests', 'Cosmetic issues', 'Block page suggestions', 'General feedback']
    }
  },

  resolutionTime: {
    bug: {
      critical: '24 hours',
      high: '72 hours',
      normal: '1 week',
      low: '2 weeks'
    },
    question: '48 hours',
    billing: '24 hours',
    nuclearMode: '1 hour (acknowledgment) + cannot override by design',
    feature: 'Acknowledged within 48 hours',
    focusScore: '48 hours',
    streak: '48 hours'
  },

  businessHours: {
    timezone: 'America/Los_Angeles',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    hours: { start: 9, end: 17 },
    holidays: ['2026-01-01', '2026-07-04', '2026-12-25']
  },

  // Pro users get faster SLAs
  pro: {
    responseTime: {
      urgent: { target: '30 minutes', targetMs: 30 * 60 * 1000 },
      high: { target: '2 hours', targetMs: 2 * 60 * 60 * 1000 },
      normal: { target: '8 hours', targetMs: 8 * 60 * 60 * 1000 },
      low: { target: '24 hours', targetMs: 24 * 60 * 60 * 1000 }
    }
  }
};
```

### 7.4 SLA Monitor

```javascript
// server/support/sla-monitor.js
class FocusSLAMonitor {
  constructor(config, notificationService) {
    this.config = config;
    this.notify = notificationService;
  }

  async checkSLABreaches() {
    const openTickets = await this.db.tickets.find({
      status: { $nin: ['resolved', 'closed'] }
    });

    const breaches = [];
    const warnings = [];

    for (const ticket of openTickets) {
      const sla = this.getSLAForTicket(ticket);
      const elapsed = Date.now() - ticket.createdAt;

      // Response SLA check
      if (!ticket.firstResponseAt) {
        if (elapsed > sla.targetMs) {
          breaches.push({
            ticket,
            type: 'response_breach',
            elapsed,
            target: sla.target,
            overBy: elapsed - sla.targetMs
          });
        } else if (sla.escalateAfterMs && elapsed > sla.escalateAfterMs) {
          warnings.push({
            ticket,
            type: 'response_warning',
            elapsed,
            escalateTo: sla.escalateTo
          });
        }
      }
    }

    // Send notifications
    for (const breach of breaches) {
      await this.notify.alert('sla_breach', {
        ...breach,
        message: `SLA BREACH: Ticket #${breach.ticket.id} (${breach.ticket.priority}) — no response after ${this.formatDuration(breach.elapsed)}, target was ${breach.target}`
      });
    }

    for (const warning of warnings) {
      if (warning.escalateTo) {
        await this.notify.escalate(warning.escalateTo, {
          ...warning,
          message: `SLA WARNING: Ticket #${warning.ticket.id} approaching SLA deadline — escalating to ${warning.escalateTo}`
        });
      }
    }

    return { breaches, warnings };
  }

  getSLAForTicket(ticket) {
    const isPro = ticket.tags?.includes('pro-user');

    if (isPro) {
      return this.config.pro.responseTime[ticket.priority] || this.config.responseTime[ticket.priority];
    }
    return this.config.responseTime[ticket.priority] || this.config.responseTime.normal;
  }

  formatDuration(ms) {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }

  // Run every 5 minutes via cron
  async monitorLoop() {
    const result = await this.checkSLABreaches();
    await this.logMonitorRun(result);
    return result;
  }
}
```

### 7.5 Support Cost Analysis

```javascript
// server/support/support-cost.js
class FocusSupportCostAnalyzer {
  constructor(config) {
    this.config = {
      agentHourlyRate: 25,
      overheadMultiplier: 1.5,     // Benefits, tools, management
      helpDeskMonthlyCost: 49,     // Freshdesk/Zendesk
      crispMonthlyCost: 25,        // Live chat
      discordBotHosting: 5,        // Bot hosting
      ...config
    };
  }

  calculateCostPerTicket(periodData) {
    const { totalTickets, totalAgentHours } = periodData;

    const laborCost = totalAgentHours * this.config.agentHourlyRate * this.config.overheadMultiplier;
    const toolsCost = this.config.helpDeskMonthlyCost + this.config.crispMonthlyCost + this.config.discordBotHosting;
    const totalCost = laborCost + toolsCost;

    return {
      costPerTicket: totalCost / Math.max(totalTickets, 1),
      breakdown: {
        labor: laborCost / Math.max(totalTickets, 1),
        tools: toolsCost / Math.max(totalTickets, 1)
      },
      totalCost,
      laborCost,
      toolsCost
    };
  }

  calculateSavingsFromAutomation(data) {
    const {
      autoResolvedTickets,
      avgManualResolutionTime,   // minutes
      deflectedByFAQ,
      avgTicketTime              // minutes
    } = data;

    const hourlyRate = this.config.agentHourlyRate;

    const autoResolveSavings = autoResolvedTickets * (avgManualResolutionTime / 60) * hourlyRate;
    const faqDeflectionSavings = deflectedByFAQ * (avgTicketTime / 60) * hourlyRate;

    return {
      total: autoResolveSavings + faqDeflectionSavings,
      fromAutoResolve: autoResolveSavings,
      fromFAQDeflection: faqDeflectionSavings,
      ticketsDeflected: autoResolvedTickets + deflectedByFAQ,
      estimatedHoursSaved: (autoResolveSavings + faqDeflectionSavings) / hourlyRate
    };
  }

  generateROIReport(periodData) {
    const { automationCost, savings, manualCostWithout } = periodData;

    return {
      roi: automationCost > 0 ? ((savings - automationCost) / automationCost) * 100 : 0,
      paybackPeriod: savings > 0 ? automationCost / (savings / 12) : Infinity, // months
      costReduction: manualCostWithout > 0
        ? ((manualCostWithout - (manualCostWithout - savings + automationCost)) / manualCostWithout) * 100
        : 0,
      netSavings: savings - automationCost
    };
  }

  // Focus Mode-specific: cost per user segment
  calculateSegmentCosts(periodData) {
    const { proTickets, freeTickets, proRevenue } = periodData;

    const proTicketCost = this.calculateCostPerTicket({
      totalTickets: proTickets.total,
      totalAgentHours: proTickets.agentHours
    });

    const freeTicketCost = this.calculateCostPerTicket({
      totalTickets: freeTickets.total,
      totalAgentHours: freeTickets.agentHours
    });

    return {
      pro: {
        ...proTicketCost,
        supportCostRatio: proTicketCost.totalCost / Math.max(proRevenue, 1),
        // Support cost should be < 10% of Pro revenue
        isHealthy: proTicketCost.totalCost < proRevenue * 0.1
      },
      free: {
        ...freeTicketCost,
        // Free user support is a conversion investment
        estimatedConversionValue: freeTickets.convertedToPro * 49.99  // lifetime value
      }
    };
  }
}
```

### 7.6 Metrics Dashboard Structure

```
Focus Mode Support Dashboard
├── Overview (Today / This Week / This Month)
│   ├── Total Tickets: {count}
│   ├── Open: {count} | Resolved: {count}
│   ├── Avg Response Time: {time}
│   ├── SLA Compliance: {percent}%
│   └── CSAT: {score}%
│
├── Volume by Category
│   ├── Bugs: {count} ({percent}%)
│   ├── How-to: {count} ({percent}%)
│   ├── Blocklist: {count} ({percent}%)
│   ├── Billing/Pro: {count} ({percent}%)
│   ├── Nuclear Mode: {count} ({percent}%)
│   ├── Focus Score: {count} ({percent}%)
│   ├── Pomodoro: {count} ({percent}%)
│   ├── Streaks: {count} ({percent}%)
│   └── Other: {count} ({percent}%)
│
├── Pro vs Free
│   ├── Pro tickets: {count} (avg response: {time})
│   ├── Free tickets: {count} (avg response: {time})
│   └── Free → Pro conversions via support: {count}
│
├── Automation
│   ├── Auto-resolved: {count} ({percent}%)
│   ├── FAQ deflections: {count}
│   ├── Hours saved: {hours}
│   └── Cost savings: ${amount}
│
└── Alerts
    ├── SLA Breaches: {count}
    ├── Escalated tickets: {count}
    └── Frustrated users: {count}
```

---

## 8. Escalation Procedures

### 8.1 Tiered Support Structure

```javascript
// server/support/escalation-system.js
const FocusSupportTiers = {
  tier1: {
    name: 'Frontline Support',
    responsibilities: [
      'Initial ticket triage and categorization',
      'Common issue resolution using canned responses',
      'FAQ and knowledge base guidance',
      'Basic blocklist troubleshooting',
      'Pomodoro timer setup help',
      'Focus Score explanation',
      'Streak questions',
      'Account and billing inquiries (standard)',
      'Pro license activation help',
      'Nuclear Mode explanation (not override)'
    ],
    canResolve: [
      'installation-issues',
      'how-to-questions',
      'basic-billing',
      'blocklist-help',
      'pomodoro-setup',
      'focus-score-questions',
      'streak-questions',
      'block-page-questions',
      'general-inquiries'
    ],
    cannotResolve: [
      'Nuclear Mode override requests (by design)',
      'Complex extension conflicts',
      'Suspected bugs requiring investigation',
      'Refunds outside policy window',
      'Security concerns',
      'Code-level issues'
    ],
    escalateTo: 'tier2',
    maxResolutionTime: '4 hours',
    requiredSkills: ['product-knowledge', 'communication', 'freshdesk-tools', 'empathy']
  },

  tier2: {
    name: 'Technical Support',
    responsibilities: [
      'Complex technical issues',
      'Bug verification and documentation',
      'Advanced troubleshooting (extension conflicts, browser versions)',
      'declarativeNetRequest rule debugging',
      'Pomodoro timer edge cases',
      'Focus Score calculation discrepancies',
      'Pro license server-side issues',
      'Escalation review from Tier 1',
      'Nuclear Mode bug investigation',
      'Non-standard refund evaluation'
    ],
    canResolve: [
      'complex-bugs',
      'extension-conflicts',
      'advanced-configuration',
      'license-server-issues',
      'focus-score-discrepancies',
      'timer-edge-cases',
      'blocking-rule-debugging',
      'non-standard-refunds'
    ],
    escalateTo: 'tier3',
    maxResolutionTime: '24 hours',
    requiredSkills: ['technical-debugging', 'chrome-extension-apis', 'declarativeNetRequest', 'stripe-billing']
  },

  tier3: {
    name: 'Engineering Support',
    responsibilities: [
      'Critical bug fixes',
      'Code-level investigation',
      'Security issues',
      'Nuclear Mode engine bugs',
      'Service worker lifecycle issues',
      'Focus Score algorithm bugs',
      'declarativeNetRequest rule conflicts',
      'Emergency patches',
      'Architecture decisions',
      'Data recovery (if applicable)'
    ],
    canResolve: [
      'code-bugs',
      'security-vulnerabilities',
      'nuclear-mode-engine-bugs',
      'service-worker-crashes',
      'critical-outages',
      'data-issues'
    ],
    escalateTo: null, // Engineering is the final tier
    maxResolutionTime: 'Varies by severity',
    requiredSkills: ['javascript', 'chrome-extension-development', 'manifest-v3', 'service-workers', 'security']
  }
};
```

### 8.2 Escalation Manager

```javascript
// server/support/escalation-manager.js
class FocusEscalationManager {
  constructor(config) {
    this.tiers = FocusSupportTiers;
    this.triggers = this.initializeTriggers();
  }

  initializeTriggers() {
    return {
      toTier2: [
        { condition: 'technical_complexity', threshold: 'high' },
        { condition: 'time_in_tier1', threshold: 4 * 60 * 60 * 1000 },
        { condition: 'customer_requests_escalation', threshold: true },
        { condition: 'bug_confirmed', threshold: true },
        { condition: 'category', values: ['extension-conflict', 'declarativeNetRequest', 'service-worker'] },
        { condition: 'pro_user_unresolved', threshold: true },
        { condition: 'nuclear_mode_malfunction', threshold: true },
        { condition: 'focus_score_algorithm_issue', threshold: true },
        { condition: 'refund_outside_policy', threshold: true }
      ],
      toTier3: [
        { condition: 'bug_requires_code_change', threshold: true },
        { condition: 'security_concern', threshold: true },
        { condition: 'data_loss_risk', threshold: true },
        { condition: 'time_in_tier2', threshold: 24 * 60 * 60 * 1000 },
        { condition: 'critical_priority', threshold: true },
        { condition: 'nuclear_mode_engine_failure', threshold: true },
        { condition: 'service_worker_crash', threshold: true },
        { condition: 'multiple_users_same_bug', threshold: 5 }
      ]
    };
  }

  shouldEscalate(ticket, currentTier) {
    const nextTierKey = currentTier === 'tier1' ? 'toTier2' : 'toTier3';
    const triggers = this.triggers[nextTierKey];

    for (const trigger of triggers) {
      if (this.checkTrigger(ticket, trigger)) {
        const nextTier = currentTier === 'tier1' ? 'tier2' : 'tier3';
        return {
          escalate: true,
          to: nextTier,
          reason: trigger.condition,
          triggerDetails: trigger
        };
      }
    }

    return { escalate: false };
  }

  checkTrigger(ticket, trigger) {
    switch (trigger.condition) {
      case 'technical_complexity':
        return ticket.complexityRating >= trigger.threshold;
      case 'time_in_tier1':
      case 'time_in_tier2':
        return ticket.currentTier && (Date.now() - (ticket.tierAssignedAt || ticket.createdAt)) > trigger.threshold;
      case 'customer_requests_escalation':
        return ticket.tags?.includes('customer-requested-escalation');
      case 'bug_confirmed':
        return ticket.tags?.includes('bug-confirmed');
      case 'category':
        return trigger.values.includes(ticket.category);
      case 'pro_user_unresolved':
        return ticket.tags?.includes('pro-user') && ticket.status === 'open' &&
          (Date.now() - ticket.createdAt) > 2 * 60 * 60 * 1000;
      case 'nuclear_mode_malfunction':
        return ticket.category === 'nuclearMode' && ticket.tags?.includes('nuclear-bug');
      case 'nuclear_mode_engine_failure':
        return ticket.category === 'nuclearMode' && ticket.tags?.includes('nuclear-engine-failure');
      case 'security_concern':
        return ticket.tags?.includes('security');
      case 'multiple_users_same_bug':
        return ticket.relatedTicketCount >= trigger.threshold;
      default:
        return false;
    }
  }

  async escalateTicket(ticketId, toTier, reason, notes) {
    const ticket = await this.db.tickets.findById(ticketId);

    ticket.escalationHistory = ticket.escalationHistory || [];
    ticket.escalationHistory.push({
      from: ticket.currentTier,
      to: toTier,
      reason,
      notes,
      at: new Date(),
      by: this.currentAgent
    });

    ticket.currentTier = toTier;
    ticket.tierAssignedAt = Date.now();
    ticket.assignedTo = await this.getAvailableAgent(toTier);

    await this.db.tickets.update(ticketId, ticket);

    // Notify new assignee with full context
    await this.notifyAgent(ticket.assignedTo, ticket);

    // Notify customer if appropriate
    if (toTier === 'tier2') {
      await this.notifyCustomer(ticket, 'Your request has been escalated to our technical support team for specialized assistance.');
    } else if (toTier === 'tier3') {
      await this.notifyCustomer(ticket, 'Your request has been escalated to our engineering team. They will investigate at the code level.');
    }

    return ticket;
  }

  async getAvailableAgent(tier) {
    const agents = await this.db.agents.find({
      tier,
      status: 'available',
      currentLoad: { $lt: this.getMaxLoad(tier) }
    });

    if (!agents.length) {
      // Fall back to least loaded agent in tier
      const allAgents = await this.db.agents.find({ tier });
      allAgents.sort((a, b) => a.currentLoad - b.currentLoad);
      return allAgents[0]?.id || null;
    }

    // Round-robin among available agents
    return agents[Math.floor(Math.random() * agents.length)].id;
  }

  getMaxLoad(tier) {
    const maxLoads = { tier1: 20, tier2: 10, tier3: 5 };
    return maxLoads[tier] || 15;
  }
}
```

### 8.3 Refund Decision Framework

```javascript
// server/support/refund-processor.js
const FocusRefundPolicy = {
  autoApprove: {
    conditions: [
      { daysSincePurchase: { max: 14 }, reason: '14-day money-back guarantee' },
      { totalSpent: { max: 50 }, firstRefund: true, reason: 'First-time small purchase' },
      { technicalIssueConfirmed: true, reason: 'Confirmed technical issue' }
    ]
  },

  reviewRequired: {
    conditions: [
      { daysSincePurchase: { min: 15, max: 30 }, reason: 'Outside guarantee, within 30 days' },
      { totalSpent: { min: 50 }, reason: 'Higher value transaction' },
      { previousRefunds: { min: 1 }, reason: 'Repeat refund request' }
    ]
  },

  managerApproval: {
    conditions: [
      { daysSincePurchase: { min: 31 }, reason: 'Over 30 days since purchase' },
      { refundAmount: { min: 100 }, reason: 'High-value refund' },
      { previousRefunds: { min: 2 }, reason: 'Multiple previous refunds' }
    ]
  },

  exceptions: {
    alwaysRefund: ['security_breach', 'service_unavailable', 'billing_error', 'double_charge'],
    neverRefund: ['fraud_detected', 'abuse_pattern', 'chargeback_history']
  },

  // Focus Mode-specific: Nuclear Mode does NOT qualify for refund
  // Users agreed to the lockout when activating
  nuclearModePolicy: 'Nuclear Mode frustration alone does not qualify for refund. The feature works as described and accepted.'
};

class FocusRefundProcessor {
  constructor(policy) {
    this.policy = policy;
  }

  async evaluateRefundRequest(request) {
    const { userId, purchaseId, reason, requestedAmount } = request;

    const user = await this.getUser(userId);
    const purchase = await this.getPurchase(purchaseId);
    const history = await this.getRefundHistory(userId);

    const context = {
      daysSincePurchase: this.daysSince(purchase.date),
      totalSpent: user.totalSpent,
      refundAmount: requestedAmount || purchase.amount,
      previousRefunds: history.length,
      firstRefund: history.length === 0,
      technicalIssueConfirmed: await this.checkTechnicalIssue(request),
      reason
    };

    // Check exceptions first
    if (this.policy.exceptions.alwaysRefund.includes(reason)) {
      return { decision: 'approve', reason: 'exception_always_refund', autoProcess: true };
    }
    if (this.policy.exceptions.neverRefund.includes(reason)) {
      return { decision: 'deny', reason: 'exception_never_refund' };
    }

    // Nuclear Mode frustration check
    if (reason === 'nuclear_mode_frustration') {
      return {
        decision: 'deny',
        reason: 'nuclear_mode_by_design',
        suggestedResponse: 'nuclear-locked-out',
        note: this.policy.nuclearModePolicy
      };
    }

    // Check auto-approve conditions
    for (const condition of this.policy.autoApprove.conditions) {
      if (this.matchesCondition(context, condition)) {
        return { decision: 'approve', reason: condition.reason, autoProcess: true };
      }
    }

    // Check if manager approval needed
    for (const condition of this.policy.managerApproval.conditions) {
      if (this.matchesCondition(context, condition)) {
        return { decision: 'manager_review', reason: condition.reason };
      }
    }

    // Default to agent review
    return { decision: 'agent_review', reason: 'standard_review', context };
  }

  matchesCondition(context, condition) {
    for (const [key, value] of Object.entries(condition)) {
      if (key === 'reason') continue;

      const contextValue = context[key];
      if (contextValue === undefined) continue;

      if (typeof value === 'object') {
        if (value.max !== undefined && contextValue > value.max) return false;
        if (value.min !== undefined && contextValue < value.min) return false;
      } else if (contextValue !== value) {
        return false;
      }
    }
    return true;
  }

  async processRefund(request, decision) {
    if (decision.decision !== 'approve') {
      throw new Error('Refund not approved');
    }

    const purchase = await this.getPurchase(request.purchaseId);

    const refund = {
      userId: request.userId,
      purchaseId: request.purchaseId,
      amount: request.requestedAmount || purchase.amount,
      reason: request.reason,
      processedAt: new Date(),
      transactionId: await this.stripeRefund(purchase.stripePaymentId, request.requestedAmount),
      approvalReason: decision.reason
    };

    await this.db.refunds.insert(refund);
    await this.notifyUser(request.userId, refund);

    // Downgrade from Pro but preserve data
    await this.downgradeToFree(request.userId, purchase.expiresAt);

    return refund;
  }

  daysSince(date) {
    return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  }
}
```

### 8.4 VIP User Handling

```javascript
// server/support/vip-handler.js
const FocusVIPConfiguration = {
  criteria: {
    spending: { min: 100 },        // $100+ lifetime (2+ years monthly or lifetime purchase)
    tenure: { min: 365 },          // 1+ year as Pro customer
    focusScore: { min: 80 },       // Focus Score 80+ (power user)
    streak: { min: 100 },          // 100+ day streak
    referrals: { min: 3 },         // 3+ successful referrals
    manualTag: true                 // Can be manually assigned
  },

  benefits: {
    prioritySupport: true,
    dedicatedAgent: false,          // Enable at scale
    extendedRefundWindow: 30,       // 30 days (vs 14 standard)
    betaAccess: true,
    directEmailAccess: true,        // Direct email to senior support
    featureVoteBoost: 2             // Each vote counts as 2
  },

  sla: {
    responseTime: {
      urgent: '15 minutes',
      high: '1 hour',
      normal: '4 hours',
      low: '12 hours'
    }
  }
};

class FocusVIPHandler {
  constructor(config) {
    this.config = config;
  }

  async isVIP(userId) {
    const user = await this.db.users.findById(userId);

    if (user.vipStatus === 'manual') return true;

    const spending = await this.getTotalSpending(userId);
    const tenure = this.daysSince(user.proSince);
    const focusData = await this.getFocusData(userId);

    return (
      spending >= this.config.criteria.spending.min ||
      tenure >= this.config.criteria.tenure.min ||
      (focusData.focusScore >= this.config.criteria.focusScore.min && focusData.currentStreak >= 30) ||
      focusData.longestStreak >= this.config.criteria.streak.min
    );
  }

  async handleVIPTicket(ticket) {
    // Auto-escalate priority
    if (ticket.priority === 'normal' || ticket.priority === 'low') {
      ticket.priority = 'high';
    }

    // Assign to senior agent
    ticket.assignedTo = await this.getSeniorAgent();

    // Tag for tracking
    ticket.tags = ticket.tags || [];
    ticket.tags.push('vip');

    // Set VIP SLA
    ticket.sla = this.config.sla.responseTime[ticket.priority];

    // Send immediate acknowledgment
    await this.sendVIPAcknowledgment(ticket);

    return ticket;
  }

  async sendVIPAcknowledgment(ticket) {
    const template = `Hi {name},

Thank you for reaching out. As a valued Focus Mode power user, your request has been prioritized.

Ticket: #{ticketId}
Priority: {priority}
Expected Response: Within {sla}

Our senior support team is on it!

Best regards,
The Zovo VIP Support Team`;

    await this.email.send({
      to: ticket.userEmail,
      subject: `[Priority] Re: ${ticket.subject}`,
      body: this.renderTemplate(template, {
        name: ticket.userName,
        ticketId: ticket.id,
        priority: ticket.priority.toUpperCase(),
        sla: this.config.sla.responseTime[ticket.priority]
      })
    });
  }
}
```

### 8.5 Escalation Quick Reference

| Trigger | Action | SLA |
|---------|--------|-----|
| Nuclear Mode bug (sites not blocked despite active) | Immediate Tier 3 | 1 hour |
| Security/privacy concern | Immediate Tier 3 | 1 hour |
| Pro user unresolved > 2 hours | Auto-escalate to Tier 2 | 2 hours |
| Customer explicitly requests escalation | Escalate to Tier 2 | 4 hours |
| Bug confirmed by Tier 1 | Escalate to Tier 2 | 4 hours |
| Frustrated user (sentiment < -0.5) | Priority bump + escalate | 4 hours |
| VIP user any issue | Auto-assign senior agent | Per VIP SLA |
| Bug affecting multiple users (5+) | Escalate to Tier 3 | 24 hours |
| Refund > 30 days | Manager approval | 24 hours |
| Service worker crash reports | Escalate to Tier 3 | 4 hours |

---

## Key Design Decisions

### Pro Users Get Priority SLAs
- Pro users pay for the product — they deserve faster support
- Pro SLAs are roughly 2x faster than Free user SLAs
- This is a tangible Pro benefit that improves retention
- VIP users (high Focus Score, long streaks, high spending) get even faster SLAs

### Nuclear Mode Escalation Policy
- Nuclear Mode "locked out" tickets are acknowledged fast (urgent SLA) but resolved with explanation, not override
- Nuclear Mode **bugs** (active but sites not blocked) are true urgent escalations to Tier 3
- The distinction is critical: "working as designed" vs "actually broken"

### Automation-First Cost Management
- Target >20% auto-resolution rate to keep cost per ticket under $5
- FAQ deflection is the single highest ROI investment for support
- Self-service troubleshooter handles the most common categories

### Refund Policy is Clear and Fair
- 14-day no-questions-asked for all purchases
- Technical issues always qualify for refund (even outside window)
- Nuclear Mode frustration alone does NOT qualify — the feature is working correctly
- Exceptions for billing errors, security breaches, and service outages

---

*Agent 4 — Support Metrics & SLAs + Escalation Procedures — Complete*
