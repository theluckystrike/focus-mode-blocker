# RETENTION METRICS DASHBOARD: Focus Mode - Blocker
## Agent 5 — Dashboard, Cohort Retention, LTV Analysis & Integration Architecture

> **Date:** February 11, 2026 | **Parent Phase:** 17 — Churn Prevention & Reactivation
> **Sections Covered:** 8 (Retention Metrics Dashboard) + Integration Architecture

---

## Table of Contents

1. [Retention Metrics Dashboard](#1-retention-metrics-dashboard)
   - [1.1 FocusRetentionMetrics Class](#11-focusretentionmetrics-class)
   - [1.2 Cohort Retention Visualization](#12-cohort-retention-visualization)
   - [1.3 LTV Analysis](#13-ltv-analysis)
2. [Dashboard Implementation](#2-dashboard-implementation)
   - [2.1 Admin Dashboard Layout](#21-admin-dashboard-layout)
   - [2.2 Data Collection Architecture](#22-data-collection-architecture)
   - [2.3 Database Schema](#23-database-schema)
3. [Integration Architecture](#3-integration-architecture)
   - [3.1 System Architecture](#31-system-architecture)
   - [3.2 Event Flow](#32-event-flow)
   - [3.3 New Modules Summary](#33-new-modules-summary)
   - [3.4 Implementation Roadmap](#34-implementation-roadmap)
4. [Implementation Priority](#4-implementation-priority)

---

## 1. Retention Metrics Dashboard

### 1.1 FocusRetentionMetrics Class

Server-side metrics aggregation for the Zovo team's retention dashboard.

```javascript
// server/retention-metrics.js — Focus Mode - Blocker retention analytics

class FocusRetentionMetrics {
  /**
   * Get complete dashboard data for Focus Mode - Blocker.
   */
  async getDashboardData(timeRange = '30d') {
    const [activeUsers, churnData, cohortData, engagementData, campaignData] = await Promise.all([
      this.getActiveUsers(),
      this.getChurnMetrics(timeRange),
      this.getCohortRetention(),
      this.getEngagementMetrics(),
      this.getCampaignPerformance(timeRange)
    ]);

    return {
      summary: {
        dau: activeUsers.daily,
        wau: activeUsers.weekly,
        mau: activeUsers.monthly,
        dauMauRatio: activeUsers.monthly > 0
          ? ((activeUsers.daily / activeUsers.monthly) * 100).toFixed(1)
          : 0,
        churnRate: churnData.monthlyRate,
        proChurnRate: churnData.proChurnRate,
        reactivationRate: churnData.reactivationRate,
        newInstallsThisWeek: activeUsers.newThisWeek
      },
      cohorts: cohortData,
      engagement: engagementData,
      campaigns: campaignData,
      trends: await this.getTrends(timeRange)
    };
  }

  /**
   * Active user counts using Focus Mode - Blocker's definition:
   * "Active" = completed at least 1 focus session in the period.
   */
  async getActiveUsers() {
    const now = new Date();

    return {
      daily: await db.userActivity.count({
        where: {
          lastFocusSession: { gte: subDays(now, 1) }
        }
      }),
      weekly: await db.userActivity.count({
        where: {
          lastFocusSession: { gte: subDays(now, 7) }
        }
      }),
      monthly: await db.userActivity.count({
        where: {
          lastFocusSession: { gte: subDays(now, 30) }
        }
      }),
      newThisWeek: await db.installs.count({
        where: {
          installedAt: { gte: subDays(now, 7) }
        }
      })
    };
  }

  /**
   * Churn metrics broken down by tier.
   */
  async getChurnMetrics(timeRange) {
    const rangeStart = this.getStartDate(timeRange);

    // Total uninstalls in period
    const totalUninstalls = await db.uninstallEvents.count({
      where: { uninstalledAt: { gte: rangeStart } }
    });

    // Pro cancellations (from Stripe webhooks)
    const proCancellations = await db.subscriptionEvents.count({
      where: {
        type: 'cancelled',
        timestamp: { gte: rangeStart }
      }
    });

    // Active Pro subscribers at start of period
    const proAtStart = await db.subscriptions.count({
      where: {
        status: 'active',
        startDate: { lt: rangeStart }
      }
    });

    // Reactivations (reinstalls)
    const reactivations = await db.reinstallEvents.count({
      where: { reinstalledAt: { gte: rangeStart } }
    });

    // Start-of-period user count
    const usersAtStart = await db.userActivity.count({
      where: {
        installedAt: { lt: rangeStart },
        uninstalledAt: null
      }
    });

    return {
      totalUninstalls,
      monthlyRate: usersAtStart > 0
        ? ((totalUninstalls / usersAtStart) * 100).toFixed(2)
        : 0,
      proCancellations,
      proChurnRate: proAtStart > 0
        ? ((proCancellations / proAtStart) * 100).toFixed(2)
        : 0,
      reactivations,
      reactivationRate: totalUninstalls > 0
        ? ((reactivations / totalUninstalls) * 100).toFixed(2)
        : 0,
      voluntaryChurn: proCancellations,
      involuntaryChurn: await db.subscriptionEvents.count({
        where: { type: 'payment_failed', timestamp: { gte: rangeStart } }
      })
    };
  }

  /**
   * Cohort retention analysis.
   * Tracks what % of users from each install cohort are still active at Day 1/7/14/30/60/90.
   */
  async getCohortRetention() {
    const cohorts = [];
    const periods = [1, 7, 14, 30, 60, 90];

    // Last 6 monthly cohorts
    for (let i = 0; i < 6; i++) {
      const cohortStart = startOfMonth(subMonths(new Date(), i));
      const cohortEnd = endOfMonth(cohortStart);

      const cohortUsers = await db.installs.findMany({
        where: {
          installedAt: { gte: cohortStart, lte: cohortEnd }
        },
        select: { installId: true, installedAt: true, lastActiveAt: true }
      });

      if (cohortUsers.length === 0) continue;

      const retention = {};
      for (const period of periods) {
        const retainedCount = cohortUsers.filter(u => {
          if (!u.lastActiveAt) return false;
          const daysSinceInstall = Math.floor(
            (new Date(u.lastActiveAt) - new Date(u.installedAt)) / (1000 * 60 * 60 * 24)
          );
          return daysSinceInstall >= period;
        }).length;

        retention[`day${period}`] = ((retainedCount / cohortUsers.length) * 100).toFixed(1);
      }

      cohorts.push({
        month: format(cohortStart, 'MMM yyyy'),
        size: cohortUsers.length,
        retention
      });
    }

    return cohorts;
  }

  /**
   * Engagement metrics specific to Focus Mode - Blocker.
   */
  async getEngagementMetrics() {
    const activeUsers = await db.userActivity.findMany({
      where: { lastFocusSession: { gte: subDays(new Date(), 30) } }
    });

    if (activeUsers.length === 0) return this.emptyEngagement();

    return {
      avgSessionsPerWeek: this.average(activeUsers.map(u => u.weeklySessionCount)),
      avgFocusScore: this.average(activeUsers.map(u => u.focusScore)),
      avgStreakLength: this.average(activeUsers.map(u => u.currentStreak)),
      avgFeaturesUsed: this.average(activeUsers.map(u => u.featuresUsedCount)),
      nuclearModeAdoption: (activeUsers.filter(u => u.usesNuclearMode).length / activeUsers.length * 100).toFixed(1),
      pomodoroAdoption: (activeUsers.filter(u => u.usesPomodoro).length / activeUsers.length * 100).toFixed(1),
      proConversionRate: (activeUsers.filter(u => u.isPro).length / activeUsers.length * 100).toFixed(1),
      healthScoreDistribution: this.getDistribution(activeUsers.map(u => u.healthScore), [0, 20, 40, 60, 80, 100])
    };
  }

  /**
   * Win-back campaign performance metrics.
   */
  async getCampaignPerformance(timeRange) {
    const rangeStart = this.getStartDate(timeRange);

    const campaigns = await db.winbackCampaigns.findMany({
      where: { startedAt: { gte: rangeStart } }
    });

    const emailPerformance = {
      day1: await this.getEmailStats('day1', rangeStart),
      day3: await this.getEmailStats('day3', rangeStart),
      day7: await this.getEmailStats('day7', rangeStart),
      day14: await this.getEmailStats('day14', rangeStart),
      day30: await this.getEmailStats('day30', rangeStart)
    };

    const offerRedemptions = await db.offers.count({
      where: { redeemedAt: { gte: rangeStart, not: null } }
    });

    const totalOffers = await db.offers.count({
      where: { createdAt: { gte: rangeStart } }
    });

    return {
      totalCampaigns: campaigns.length,
      emailPerformance,
      offerRedemptionRate: totalOffers > 0
        ? ((offerRedemptions / totalOffers) * 100).toFixed(1)
        : 0,
      reinstallsFromWinback: await db.reinstallEvents.count({
        where: { source: 'winback_email', reinstalledAt: { gte: rangeStart } }
      }),
      retentionModalSaves: await db.retentionEvents.count({
        where: { action: { not: 'downgraded' }, timestamp: { gte: rangeStart } }
      })
    };
  }

  async getEmailStats(emailDay, since) {
    const sent = await db.emails.count({ where: { template: emailDay, sentAt: { gte: since } } });
    const opened = await db.emails.count({ where: { template: emailDay, openedAt: { not: null }, sentAt: { gte: since } } });
    const clicked = await db.emails.count({ where: { template: emailDay, clickedAt: { not: null }, sentAt: { gte: since } } });

    return {
      sent,
      openRate: sent > 0 ? ((opened / sent) * 100).toFixed(1) : 0,
      clickRate: sent > 0 ? ((clicked / sent) * 100).toFixed(1) : 0
    };
  }

  // --- Utility methods ---

  average(numbers) {
    if (numbers.length === 0) return 0;
    return +(numbers.reduce((a, b) => a + b, 0) / numbers.length).toFixed(1);
  }

  getDistribution(values, buckets) {
    const dist = {};
    for (let i = 0; i < buckets.length - 1; i++) {
      const label = `${buckets[i]}-${buckets[i + 1]}`;
      dist[label] = values.filter(v => v >= buckets[i] && v < buckets[i + 1]).length;
    }
    return dist;
  }

  getStartDate(timeRange) {
    const now = new Date();
    switch (timeRange) {
      case '7d': return subDays(now, 7);
      case '30d': return subDays(now, 30);
      case '90d': return subDays(now, 90);
      case '1y': return subDays(now, 365);
      default: return subDays(now, 30);
    }
  }

  emptyEngagement() {
    return { avgSessionsPerWeek: 0, avgFocusScore: 0, avgStreakLength: 0, avgFeaturesUsed: 0, nuclearModeAdoption: 0, pomodoroAdoption: 0, proConversionRate: 0, healthScoreDistribution: {} };
  }
}
```

### 1.2 Cohort Retention Visualization

```javascript
// server/retention-heatmap.js — Renders cohort retention heatmap

function renderRetentionHeatmap(cohortData, container) {
  const html = `
    <div class="heatmap-container">
      <h3>Cohort Retention</h3>
      <table class="retention-table">
        <thead>
          <tr>
            <th>Cohort</th>
            <th>Size</th>
            <th>Day 1</th>
            <th>Day 7</th>
            <th>Day 14</th>
            <th>Day 30</th>
            <th>Day 60</th>
            <th>Day 90</th>
          </tr>
        </thead>
        <tbody>
          ${cohortData.map(cohort => `
            <tr>
              <td class="cohort-month">${cohort.month}</td>
              <td class="cohort-size">${cohort.size.toLocaleString()}</td>
              ${['day1', 'day7', 'day14', 'day30', 'day60', 'day90'].map(period => {
                const value = parseFloat(cohort.retention[period] || 0);
                return `<td class="retention-cell ${getRetentionClass(value)}">${value}%</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="heatmap-legend">
        <span class="legend-item"><span class="legend-color retention-excellent"></span> &gt;60%</span>
        <span class="legend-item"><span class="legend-color retention-good"></span> 40-60%</span>
        <span class="legend-item"><span class="legend-color retention-average"></span> 25-40%</span>
        <span class="legend-item"><span class="legend-color retention-poor"></span> 10-25%</span>
        <span class="legend-item"><span class="legend-color retention-critical"></span> &lt;10%</span>
      </div>

      <div class="benchmarks">
        <h4>Focus Mode - Blocker Targets vs Industry</h4>
        <table class="benchmark-table">
          <thead><tr><th>Period</th><th>Target</th><th>Industry Avg</th></tr></thead>
          <tbody>
            <tr><td>Day 1</td><td class="target">70%</td><td>50-60%</td></tr>
            <tr><td>Day 7</td><td class="target">45%</td><td>25-35%</td></tr>
            <tr><td>Day 14</td><td class="target">35%</td><td>18-25%</td></tr>
            <tr><td>Day 30</td><td class="target">25%</td><td>12-18%</td></tr>
            <tr><td>Day 60</td><td class="target">18%</td><td>8-12%</td></tr>
            <tr><td>Day 90</td><td class="target">15%</td><td>5-10%</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

function getRetentionClass(value) {
  if (value >= 60) return 'retention-excellent';
  if (value >= 40) return 'retention-good';
  if (value >= 25) return 'retention-average';
  if (value >= 10) return 'retention-poor';
  return 'retention-critical';
}
```

**Cohort segmentation options for Focus Mode - Blocker:**

| Segment | Description | Purpose |
|---------|-------------|---------|
| By tier | Free vs Pro users | Pro users should retain significantly better |
| By onboarding | Completed 5 slides vs skipped | Validates onboarding effectiveness |
| By feature adoption | Nuclear Mode users vs non-users | Nuclear Mode should correlate with retention |
| By acquisition | Organic vs referral vs paid | Identifies highest-quality acquisition channels |
| By Pomodoro usage | Timer users vs non-timer users | Validates Pomodoro's retention impact |
| By blocklist size | 1-3 sites vs 4-5 vs 6+ (Pro) | More blocked sites = more invested |

### 1.3 LTV Analysis

```javascript
// server/ltv-analysis.js — Lifetime value analysis for Focus Mode - Blocker

class FocusLTVAnalysis {
  /**
   * Calculate LTV by user segment.
   */
  async calculateSegmentLTV() {
    const segments = {
      free: { query: { tier: 'free' }, directRevenue: 0 },
      monthly: { query: { tier: 'pro', plan: 'monthly' }, price: 4.99 },
      annual: { query: { tier: 'pro', plan: 'annual' }, price: 35.88 }, // $2.99/mo × 12
      lifetime: { query: { tier: 'pro', plan: 'lifetime' }, price: 49.99 }
    };

    const results = {};

    for (const [name, segment] of Object.entries(segments)) {
      const users = await db.subscriptions.findMany({
        where: segment.query,
        include: { user: true }
      });

      const avgLifespanDays = this.calculateAvgLifespan(users);
      const avgLifespanMonths = avgLifespanDays / 30;

      let ltv;
      if (name === 'free') {
        // Free users have indirect value: referrals, reviews, potential conversion
        const conversionRate = await this.getFreeToProConversionRate();
        const avgProLTV = await this.getAvgProLTV();
        ltv = conversionRate * avgProLTV; // Expected future value
      } else if (name === 'lifetime') {
        ltv = segment.price;
      } else if (name === 'annual') {
        const avgRenewals = avgLifespanMonths / 12;
        ltv = segment.price * avgRenewals;
      } else {
        ltv = segment.price * avgLifespanMonths;
      }

      results[name] = {
        userCount: users.length,
        avgLifespanDays: Math.round(avgLifespanDays),
        avgLifespanMonths: avgLifespanMonths.toFixed(1),
        ltv: ltv.toFixed(2),
        arpu: name === 'free' ? '0.00' : (segment.price || 0).toFixed(2)
      };
    }

    // Add CAC and LTV:CAC ratio
    const cac = await this.getCAC();
    for (const [name, data] of Object.entries(results)) {
      data.cac = cac[name] || cac.blended;
      data.ltvCacRatio = (parseFloat(data.ltv) / parseFloat(data.cac)).toFixed(2);
    }

    return results;
  }

  calculateAvgLifespan(users) {
    if (users.length === 0) return 0;
    const lifespans = users.map(u => {
      const end = u.cancelledAt ? new Date(u.cancelledAt) : new Date();
      return (end - new Date(u.startDate)) / (1000 * 60 * 60 * 24);
    });
    return lifespans.reduce((a, b) => a + b, 0) / lifespans.length;
  }

  async getFreeToProConversionRate() {
    const totalFree = await db.users.count({ where: { tier: 'free' } });
    const converted = await db.users.count({ where: { tier: 'pro', previousTier: 'free' } });
    return totalFree > 0 ? converted / totalFree : 0;
  }

  async getAvgProLTV() {
    // Simplified: average of monthly and annual LTV
    return 35; // ~7 months × $4.99/mo as baseline estimate
  }

  async getCAC() {
    return {
      organic: 0,          // Free installs from CWS search
      referral: 0.50,      // Referral reward cost
      paid: 2.50,          // Google Ads CPC for "website blocker"
      content: 0.30,       // Blog/content marketing amortized
      blended: 0.75        // Weighted average across all channels
    };
  }

  /**
   * Project revenue impact of churn reduction.
   */
  async analyzeChurnImpact() {
    const currentChurnRate = parseFloat((await this.getCurrentMonthlyChurn()).rate) / 100;
    const activeProUsers = await db.subscriptions.count({ where: { status: 'active' } });
    const avgMonthlyRevenue = 4.99; // Weighted average of monthly/annual

    const projections = [0.01, 0.02, 0.05, 0.10].map(reduction => {
      const newChurnRate = Math.max(0, currentChurnRate - reduction);
      const usersRetainedPerMonth = activeProUsers * reduction;
      const annualRevenueGain = usersRetainedPerMonth * avgMonthlyRevenue * 12;

      return {
        churnReduction: `${(reduction * 100).toFixed(0)}%`,
        currentChurn: `${(currentChurnRate * 100).toFixed(1)}%`,
        newChurn: `${(newChurnRate * 100).toFixed(1)}%`,
        usersRetainedMonthly: Math.round(usersRetainedPerMonth),
        annualRevenueGain: `$${annualRevenueGain.toFixed(0)}`
      };
    });

    return projections;
  }

  async getCurrentMonthlyChurn() {
    const metrics = new FocusRetentionMetrics();
    const churn = await metrics.getChurnMetrics('30d');
    return { rate: churn.proChurnRate };
  }

  /**
   * Pro conversion funnel analysis.
   */
  async getConversionFunnel() {
    const totalInstalls = await db.installs.count();
    const activated = await db.userActivity.count({ where: { totalSessions: { gte: 1 } } });
    const engaged = await db.userActivity.count({ where: { longestStreak: { gte: 7 } } });
    const trialStarted = await db.subscriptions.count({ where: { type: 'trial' } });
    const proConverted = await db.subscriptions.count({ where: { tier: 'pro', status: 'active' } });
    const retainedPro = await db.subscriptions.count({
      where: { tier: 'pro', status: 'active', startDate: { lte: subDays(new Date(), 90) } }
    });

    return {
      stages: [
        { name: 'Install', count: totalInstalls, rate: '100%' },
        { name: 'Activated (1+ session)', count: activated, rate: `${(activated / totalInstalls * 100).toFixed(1)}%` },
        { name: 'Engaged (7+ day streak)', count: engaged, rate: `${(engaged / totalInstalls * 100).toFixed(1)}%` },
        { name: 'Pro Trial Started', count: trialStarted, rate: `${(trialStarted / totalInstalls * 100).toFixed(1)}%` },
        { name: 'Pro Subscriber', count: proConverted, rate: `${(proConverted / totalInstalls * 100).toFixed(1)}%` },
        { name: 'Retained Pro (90d+)', count: retainedPro, rate: `${(retainedPro / totalInstalls * 100).toFixed(1)}%` }
      ]
    };
  }
}
```

---

## 2. Dashboard Implementation

### 2.1 Admin Dashboard Layout

Dashboard hosted at `zovo.one/admin/retention`.

```html
<!-- zovo.one/admin/retention/index.html (simplified layout) -->
<div class="dashboard">
  <header class="dashboard-header">
    <h1>Focus Mode - Blocker | Retention Dashboard</h1>
    <div class="time-range-selector">
      <button data-range="7d">7 Days</button>
      <button data-range="30d" class="active">30 Days</button>
      <button data-range="90d">90 Days</button>
      <button data-range="1y">1 Year</button>
    </div>
    <button class="export-btn">Export CSV</button>
  </header>

  <!-- Summary Cards -->
  <div class="summary-cards">
    <div class="card"><h3>DAU</h3><span id="dau">—</span></div>
    <div class="card"><h3>WAU</h3><span id="wau">—</span></div>
    <div class="card"><h3>MAU</h3><span id="mau">—</span></div>
    <div class="card"><h3>DAU/MAU</h3><span id="stickiness">—%</span></div>
    <div class="card alert"><h3>Monthly Churn</h3><span id="churn">—%</span></div>
    <div class="card"><h3>Pro Churn</h3><span id="proChurn">—%</span></div>
    <div class="card success"><h3>Reactivation Rate</h3><span id="reactivation">—%</span></div>
    <div class="card"><h3>New Installs (7d)</h3><span id="newInstalls">—</span></div>
  </div>

  <!-- Cohort Retention Heatmap -->
  <div class="dashboard-section" id="cohort-section">
    <h2>Cohort Retention</h2>
    <div id="retention-heatmap"></div>
  </div>

  <!-- Churn Reasons -->
  <div class="dashboard-row">
    <div class="dashboard-section half" id="churn-reasons">
      <h2>Uninstall Reasons</h2>
      <div id="churn-reasons-chart"></div>
    </div>

    <!-- Conversion Funnel -->
    <div class="dashboard-section half" id="funnel-section">
      <h2>Pro Conversion Funnel</h2>
      <div id="conversion-funnel"></div>
    </div>
  </div>

  <!-- Win-Back Campaign Performance -->
  <div class="dashboard-section" id="campaigns-section">
    <h2>Win-Back Campaign Performance</h2>
    <table class="campaign-table">
      <thead>
        <tr>
          <th>Email</th>
          <th>Sent</th>
          <th>Open Rate</th>
          <th>Click Rate</th>
        </tr>
      </thead>
      <tbody id="campaign-data"></tbody>
    </table>
  </div>

  <!-- LTV Analysis -->
  <div class="dashboard-section" id="ltv-section">
    <h2>LTV by Segment</h2>
    <div id="ltv-table"></div>
  </div>

  <!-- Churn Impact Projections -->
  <div class="dashboard-section" id="projections-section">
    <h2>Churn Reduction Impact</h2>
    <div id="churn-projections"></div>
  </div>
</div>
```

**Dashboard CSS:**

```css
/* retention-dashboard.css */

.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.card h3 { font-size: 13px; color: #6b7280; margin-bottom: 8px; }
.card span { font-size: 28px; font-weight: 700; color: #1f2937; }
.card.alert span { color: #ef4444; }
.card.success span { color: #22c55e; }

.dashboard-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.dashboard-row { display: flex; gap: 24px; }
.half { flex: 1; }

.retention-table { width: 100%; border-collapse: collapse; }
.retention-table th, .retention-table td { padding: 10px 12px; text-align: center; font-size: 13px; }
.retention-table th { background: #f9fafb; font-weight: 600; color: #374151; }
.retention-cell { font-weight: 600; border-radius: 4px; }
.retention-excellent { background: #dcfce7; color: #166534; }
.retention-good { background: #d1fae5; color: #065f46; }
.retention-average { background: #fef9c3; color: #854d0e; }
.retention-poor { background: #fed7aa; color: #9a3412; }
.retention-critical { background: #fecaca; color: #991b1b; }

.time-range-selector button {
  padding: 6px 14px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.time-range-selector button.active {
  background: #6366f1;
  color: white;
  border-color: #6366f1;
}
```

### 2.2 Data Collection Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  CLIENT (Extension)                          │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Service      │  │ Popup        │  │ Content Script    │  │
│  │ Worker       │  │              │  │ (Block Page)      │  │
│  │              │  │              │  │                    │  │
│  │ • Alarms     │  │ • UI Events  │  │ • Block events    │  │
│  │ • DNR rules  │  │ • Timer      │  │ • Bypass attempts │  │
│  │ • Churn      │  │ • Health     │  │                    │  │
│  │   detection  │  │   widget     │  │                    │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬───────────┘  │
│         │                 │                    │              │
│         └─────────┬───────┴────────────────────┘              │
│                   │                                           │
│           chrome.storage.local                                │
│           (All data stays local)                              │
│                   │                                           │
│         ┌─────────▼──────────┐                                │
│         │ Opt-in Telemetry   │  Anonymous daily ping          │
│         │ (if user opted in) │  Hashed install ID + stats     │
│         └─────────┬──────────┘                                │
└───────────────────┼──────────────────────────────────────────┘
                    │ HTTPS (daily)
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                  SERVER (zovo.one)                            │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ Telemetry   │  │ Stripe       │  │ CWS API            │  │
│  │ API         │  │ Webhooks     │  │ (Install/Uninstall) │  │
│  │             │  │              │  │                      │  │
│  │ POST /api/  │  │ subscription │  │ Daily sync           │  │
│  │ telemetry   │  │ events       │  │                      │  │
│  └──────┬──────┘  └──────┬───────┘  └────────┬─────────────┘  │
│         │                │                    │              │
│         └────────┬───────┴────────────────────┘              │
│                  │                                           │
│          ┌───────▼────────┐                                  │
│          │   PostgreSQL    │                                  │
│          │   Database      │                                  │
│          └───────┬────────┘                                  │
│                  │                                           │
│          ┌───────▼────────┐                                  │
│          │   Retention     │  zovo.one/admin/retention       │
│          │   Dashboard     │                                  │
│          └────────────────┘                                  │
└─────────────────────────────────────────────────────────────┘
```

**Client-side telemetry (opt-in only):**

```javascript
// telemetry.js — Anonymous opt-in usage telemetry

class FocusTelemetry {
  /**
   * Send daily anonymous aggregate to zovo.one.
   * Only if user opted in during onboarding or options page.
   */
  async sendDailyPing() {
    const { telemetryOptIn } = await chrome.storage.local.get('telemetryOptIn');
    if (!telemetryOptIn) return;

    const storage = await chrome.storage.local.get([
      'installId', 'focusScore', 'currentStreak',
      'focusSessionHistory', 'featureUsageMap',
      'subscription', 'blockedSites'
    ]);

    // Hash the install ID (no reversible identifier)
    const hashedId = await this.hash(storage.installId || 'unknown');

    const sessions = storage.focusSessionHistory || [];
    const today = sessions.find(d => d.date === new Date().toISOString().split('T')[0]) || {};

    const payload = {
      id: hashedId,
      v: chrome.runtime.getManifest().version,
      tier: storage.subscription?.tier || 'free',
      fs: storage.focusScore || 0,
      streak: storage.currentStreak || 0,
      todaySessions: today.sessionsCompleted || 0,
      todayMinutes: today.totalMinutes || 0,
      features: Object.keys(storage.featureUsageMap || {}).length,
      sites: (storage.blockedSites || []).length
    };

    await fetch('https://zovo.one/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {}); // Non-blocking, silent failure
  }

  async hash(input) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
```

### 2.3 Database Schema

```sql
-- PostgreSQL schema for Focus Mode - Blocker retention data

-- Anonymous user activity (from opt-in telemetry)
CREATE TABLE user_activity (
  hashed_id VARCHAR(64) PRIMARY KEY,
  tier VARCHAR(10) DEFAULT 'free',
  focus_score INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  weekly_session_count INTEGER DEFAULT 0,
  features_used_count INTEGER DEFAULT 0,
  blocked_sites_count INTEGER DEFAULT 0,
  uses_nuclear_mode BOOLEAN DEFAULT FALSE,
  uses_pomodoro BOOLEAN DEFAULT FALSE,
  health_score INTEGER DEFAULT 50,
  first_seen_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_focus_session TIMESTAMP,
  is_pro BOOLEAN DEFAULT FALSE
);

-- Install/uninstall events (from CWS API)
CREATE TABLE install_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(20) NOT NULL, -- 'install', 'uninstall', 'reinstall'
  version VARCHAR(20),
  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Subscription events (from Stripe webhooks)
CREATE TABLE subscription_events (
  id SERIAL PRIMARY KEY,
  stripe_customer_id VARCHAR(100),
  event_type VARCHAR(30) NOT NULL, -- 'created', 'cancelled', 'payment_failed', 'upgraded', 'downgraded', 'paused', 'resumed'
  plan VARCHAR(20), -- 'monthly', 'annual', 'lifetime'
  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Uninstall survey responses
CREATE TABLE uninstall_feedback (
  id SERIAL PRIMARY KEY,
  reason VARCHAR(50) NOT NULL,
  feedback TEXT,
  alternative_name VARCHAR(200),
  category VARCHAR(30),
  priority VARCHAR(20),
  context JSONB, -- { tier, version, daysInstalled, focusScore, totalSessions, etc. }
  processed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Win-back campaigns
CREATE TABLE winback_campaigns (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  sequence VARCHAR(30) NOT NULL,
  uninstall_reason VARCHAR(50),
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Individual win-back emails
CREATE TABLE winback_emails (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES winback_campaigns(id),
  template VARCHAR(20) NOT NULL, -- 'day1', 'day3', 'day7', 'day14', 'day30'
  sent_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP
);

-- Offers generated for win-back
CREATE TABLE offers (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  type VARCHAR(30) NOT NULL,
  value VARCHAR(50),
  source VARCHAR(30), -- 'winback_email', 'uninstall_survey', 'downgrade_modal'
  expires_at TIMESTAMP NOT NULL,
  redeemed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Retention modal events
CREATE TABLE retention_events (
  id SERIAL PRIMARY KEY,
  action VARCHAR(30) NOT NULL, -- 'stayed', 'paused', 'switched_annual', 'free_months', 'downgraded'
  offer VARCHAR(50),
  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Daily aggregate metrics (materialized for dashboard performance)
CREATE TABLE daily_metrics (
  date DATE PRIMARY KEY,
  dau INTEGER DEFAULT 0,
  wau INTEGER DEFAULT 0,
  mau INTEGER DEFAULT 0,
  new_installs INTEGER DEFAULT 0,
  uninstalls INTEGER DEFAULT 0,
  pro_subscriptions INTEGER DEFAULT 0,
  pro_cancellations INTEGER DEFAULT 0,
  avg_focus_score DECIMAL(5,2) DEFAULT 0,
  avg_streak DECIMAL(5,2) DEFAULT 0
);

-- Indexes for performance
CREATE INDEX idx_user_activity_last_session ON user_activity(last_focus_session);
CREATE INDEX idx_install_events_timestamp ON install_events(timestamp);
CREATE INDEX idx_subscription_events_type ON subscription_events(event_type, timestamp);
CREATE INDEX idx_uninstall_feedback_reason ON uninstall_feedback(reason);
CREATE INDEX idx_winback_emails_template ON winback_emails(template, sent_at);
```

---

## 3. Integration Architecture

### 3.1 System Architecture

How all Phase 17 components connect:

```
┌────────────────────────────────────────────────────────────────────┐
│                     FOCUS MODE - BLOCKER                           │
│                   Phase 17 Architecture                            │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────┐         ┌──────────────────┐                  │
│  │ CHURN DETECTION  │────────▶│ PROACTIVE         │                  │
│  │ (Agent 1)        │         │ RETENTION          │                  │
│  │                  │         │ (Agent 4)          │                  │
│  │ • ChurnDetector  │ risk    │                    │                  │
│  │ • RiskScoring    │ score   │ • Milestones       │                  │
│  │ • UsageTracking  │────┐   │ • FeatureDiscovery │                  │
│  └────────┬─────────┘    │   │ • DailyChallenges  │                  │
│           │              │   │ • HabitNudges      │                  │
│           │              │   └──────────┬─────────┘                  │
│  ┌────────▼─────────┐    │              │                            │
│  │ ENGAGEMENT        │    │   ┌──────────▼─────────┐                  │
│  │ SCORING           │    │   │ DORMANT USER        │                  │
│  │ (Agent 1)         │    └──▶│ REACTIVATION        │                  │
│  │                   │        │ (Agent 3)           │                  │
│  │ • HealthScore     │        │                     │                  │
│  │ • PowerUser ID    │        │ • Notifications     │                  │
│  └───────────────────┘        │ • UpdateReengage    │                  │
│                               │ • SeasonalTriggers  │                  │
│                               └─────────────────────┘                  │
│                                                                    │
│  ┌─────────────────┐         ┌──────────────────┐                  │
│  │ EXIT SURVEY      │────────▶│ WIN-BACK          │                  │
│  │ (Agent 2)        │ reason  │ CAMPAIGNS          │                  │
│  │                  │         │ (Agent 3)          │                  │
│  │ • UninstallURL   │         │                    │                  │
│  │ • SurveyPage     │         │ • EmailSequence    │                  │
│  │ • FeedbackProc   │         │ • IncentiveEngine  │                  │
│  └──────────────────┘         └──────────────────┘                  │
│                                                                    │
│  ┌─────────────────┐                                               │
│  │ DOWNGRADE FLOW   │                                               │
│  │ (Agent 2)        │ ──── If downgrade completes ────▶ Win-Back    │
│  │                  │                                               │
│  │ • RetentionModal │                                               │
│  │ • DowngradeSurvey│                                               │
│  │ • GracefulExec   │                                               │
│  └──────────────────┘                                               │
│                                                                    │
│       ALL COMPONENTS ──── feed data ────▶ RETENTION DASHBOARD      │
│                                           (Agent 5)                │
│                                                                    │
│                                           • Metrics API            │
│                                           • Cohort Retention       │
│                                           • LTV Analysis           │
│                                           • Campaign Performance   │
└────────────────────────────────────────────────────────────────────┘
```

### 3.2 Event Flow

**Happy Path (Healthy User):**
1. User installs → Onboarding → Usage tracking begins → Engagement scoring starts
2. User completes focus sessions → Milestones trigger celebrations → Health score stays high
3. Feature discovery prompts expose new features → User explores more → Deeper engagement
4. Power user status achieved → Rewards granted → User becomes advocate

**Declining User Path:**
1. Usage frequency drops → Churn detection fires (daily alarm) → Risk score increases
2. Risk tier reaches "Casual" → Gentle nudge (badge on icon)
3. Risk tier reaches "At Risk" → Motivational notification sent
4. If user responds → Health score improves → Back to healthy path
5. If no response → Dormant reactivation begins (weekly notifications, max 4)

**Pro Downgrade Path:**
1. User clicks "Cancel" in options → Retention modal shown with usage data
2. User sees alternatives (pause, annual, free months) → If accepts: retained
3. If proceeds to downgrade → Downgrade survey → Graceful transition (choose 5 sites)
4. Win-back email sequence queued → Day 1/3/7/14/30 emails sent
5. If reinstalls or re-upgrades → Win-back success recorded

**Uninstall Path:**
1. User uninstalls → Browser opens `zovo.one/uninstall-survey`
2. User selects reason → Conditional offer shown → If claims: potential reinstall
3. Feedback stored → Categorized → Action items generated
4. Win-back email sequence starts (if email on file)
5. All events → Retention dashboard updated

### 3.3 New Modules Summary

| Module | File | Agent | Location | Description |
|--------|------|-------|----------|-------------|
| FocusChurnDetector | `churn-detector.js` | Agent 1 | Extension | Detects 12 Focus Mode-specific churn signals |
| FocusRiskScoringModel | `risk-scoring.js` | Agent 1 | Extension | Weighted risk model with engagement/risk factors |
| Usage Tracker | `usage-tracker.js` | Agent 1 | Extension | Records daily focus metrics to chrome.storage.local |
| FocusHealthScoreCalculator | `health-score.js` | Agent 1 | Extension | 5-dimension engagement score (frequency, depth, recency, consistency, growth) |
| FocusPowerUserIdentifier | `power-users.js` | Agent 1 | Extension | Identifies power users with tier-based rewards |
| ExitSurveyHandler | `exit-survey-handler.js` | Agent 2 | Extension | Manages chrome.runtime.setUninstallURL |
| Exit Survey Page | `uninstall-survey/` | Agent 2 | Server | HTML/JS survey at zovo.one with conditional offers |
| Feedback Processor | `feedback-processor.js` | Agent 2 | Server | Categorizes feedback, triggers alerts |
| FocusDowngradeFlow | `downgrade-flow.js` | Agent 2 | Extension | Retention modal, pause/switch/credit options |
| DowngradeExecutor | `downgrade-executor.js` | Agent 2 | Extension | Graceful Pro→Free transition with data preservation |
| EmailCollector | `email-collection.js` | Agent 3 | Extension | Optional email opt-in management |
| Win-Back Emails | `winback-templates/` | Agent 3 | Server | 5 Handlebars email templates (Day 1/3/7/14/30) |
| FocusIncentiveEngine | `incentive-engine.js` | Agent 3 | Server | Personalized comeback offers by reason × value |
| DormantUserReactivation | `dormant-reactivation.js` | Agent 3 | Extension | In-extension notifications for dormant users (max 4, weekly) |
| UpdateReengagement | `update-reengagement.js` | Agent 3 | Extension | "What's New" for dormant users on version update |
| SeasonalReengagement | `seasonal-reengagement.js` | Agent 3 | Extension | Date-based productivity triggers |
| FocusMilestoneTracker | `milestone-tracker.js` | Agent 4 | Extension | 35+ milestones across 7 categories |
| FocusFeatureDiscovery | `feature-discovery.js` | Agent 4 | Extension | 9 contextual feature discovery rules |
| DailyFocusChallenge | `daily-challenges.js` | Agent 4 | Extension | Rotating daily challenges with rewards |
| HabitNudges | `habit-nudges.js` | Agent 4 | Extension | Peak hour suggestion, weekly summary |
| FocusRetentionMetrics | `retention-metrics.js` | Agent 5 | Server | Dashboard data aggregation |
| FocusLTVAnalysis | `ltv-analysis.js` | Agent 5 | Server | LTV by segment, churn impact projections |
| FocusTelemetry | `telemetry.js` | Agent 5 | Extension | Opt-in anonymous daily ping |
| Admin Dashboard | `admin/retention/` | Agent 5 | Server | HTML/CSS/JS retention dashboard |

### 3.4 Implementation Roadmap

| Phase | Weeks | Components | Dependencies |
|-------|-------|------------|-------------|
| **P0 — Foundation** | 1-2 | Usage tracking, churn detection, engagement scoring, milestones, storage schema | None — all local extension code |
| **P1 — In-Extension Retention** | 2-3 | Feature discovery, daily challenges, habit nudges, celebration UI, dormant reactivation | P0 storage schema |
| **P2 — Exit & Downgrade** | 3-5 | Exit survey page (server), uninstall URL handler, downgrade flow, retention modal | P0 + Server hosting |
| **P3 — Win-Back Campaigns** | 4-6 | Email templates, email service integration, incentive engine, campaign scheduler | P2 feedback data + Email provider |
| **P4 — Dashboard & Analytics** | 5-8 | Retention dashboard, cohort analysis, LTV calculation, telemetry | P0-P3 all feeding data |

**Total estimated effort: 8-10 weeks for one developer**

---

## 4. Implementation Priority

| Priority | Component | Agent | Complexity | Effort |
|----------|-----------|-------|------------|--------|
| P0 | Usage tracking & storage schema | 1 | Low | 6h |
| P0 | FocusChurnDetector | 1 | Medium | 8h |
| P0 | FocusMilestoneTracker + config | 4 | Medium | 8h |
| P0 | Service worker alarm integration | 1, 3, 4 | Low | 4h |
| P1 | FocusHealthScoreCalculator | 1 | Medium | 6h |
| P1 | FocusFeatureDiscovery | 4 | Medium | 6h |
| P1 | DormantUserReactivation | 3 | Medium | 6h |
| P1 | ExitSurveyHandler + uninstall URL | 2 | Low | 3h |
| P1 | Celebration + discovery UI | 4 | Medium | 8h |
| P2 | Exit survey page (server) | 2 | Medium | 6h |
| P2 | FocusDowngradeFlow + retention modal | 2 | Medium | 8h |
| P2 | Feedback processor + alerts | 2 | Medium | 4h |
| P2 | DowngradeExecutor | 2 | Medium | 6h |
| P3 | Win-back email templates | 3 | Medium | 8h |
| P3 | FocusIncentiveEngine | 3 | Medium | 6h |
| P3 | Campaign scheduler | 3 | Medium | 6h |
| P3 | UpdateReengagement + seasonal | 3 | Low | 4h |
| P4 | FocusRetentionMetrics API | 5 | Medium | 8h |
| P4 | FocusLTVAnalysis | 5 | Medium | 6h |
| P4 | Admin dashboard (HTML/CSS/JS) | 5 | Medium | 8h |
| P4 | Telemetry service | 5 | Low | 4h |
| P4 | Database schema + migrations | 5 | Medium | 4h |

**Grand Total: ~143 hours (≈18 working days / ~4 weeks)**

---

*Agent 5 — Retention Metrics Dashboard & Integration Architecture — Complete*
