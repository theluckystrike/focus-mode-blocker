# Cross-Promotion Network, Growth Metrics & Experimentation
## Phase 14, Agent 5 — Focus Mode - Blocker

> **Date:** February 11, 2026 | **Status:** Complete
> **Scope:** Zovo portfolio cross-promotion, partner collaborations, upgrade funnels, growth metrics dashboard, A/B testing framework, cohort analysis, growth reviews, growth automation

---

## Table of Contents

### Part A: Cross-Promotion Network
1. [Zovo Portfolio Cross-Promotion](#1-zovo-portfolio-cross-promotion)
2. [Partner Extension Collaborations](#2-partner-extension-collaborations)
3. [Upgrade Path Funnels](#3-upgrade-path-funnels)

### Part B: Growth Metrics & Experimentation
4. [Key Metrics Dashboard](#4-key-metrics-dashboard)
5. [A/B Testing Framework](#5-ab-testing-framework)
6. [Cohort Analysis](#6-cohort-analysis)
7. [Weekly/Monthly Growth Review](#7-weeklymonthly-growth-review)
8. [Growth Automation](#8-growth-automation)

---

# PART A: CROSS-PROMOTION NETWORK

---

## 1. Zovo Portfolio Cross-Promotion

### 1.1 Zovo Extension Family Overview

Focus Mode - Blocker is the flagship product in the Zovo extension family. The Zovo brand
represents a suite of productivity-oriented Chrome extensions designed for knowledge workers,
students, and freelancers. Each extension addresses a distinct productivity pain point while
sharing a common design language, privacy-first philosophy, and user trust foundation.

#### Current and Planned Zovo Extensions

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ZOVO EXTENSION FAMILY                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────┐   ┌──────────────────┐   ┌────────────────┐  │
│  │  FOCUS MODE       │   │  TAB MANAGER      │   │  SCREENSHOT    │  │
│  │  (Flagship)       │   │  (Planned Q3)     │   │  TOOL          │  │
│  │                   │   │                   │   │  (Planned Q4)  │  │
│  │  Block sites      │   │  Organize tabs    │   │                │  │
│  │  Pomodoro timer   │   │  Save sessions    │   │  Capture pages │  │
│  │  Focus Score      │   │  Group by project │   │  Annotate      │  │
│  │  Streak system    │   │  Memory optimizer │   │  Share/export  │  │
│  │  Nuclear Mode     │   │  Quick search     │   │  Cloud sync    │  │
│  │  Ambient sounds   │   │                   │   │                │  │
│  └──────────────────┘   └──────────────────┘   └────────────────┘  │
│                                                                     │
│  ┌──────────────────┐   ┌──────────────────┐                       │
│  │  NOTE TAKING      │   │  READING MODE     │                      │
│  │  (Planned Q1'27)  │   │  (Planned Q2'27)  │                      │
│  │                   │   │                   │                       │
│  │  Quick capture    │   │  Distraction-free │                      │
│  │  Tag & organize   │   │  Custom fonts     │                      │
│  │  Link to tabs     │   │  Save articles    │                      │
│  │  Export formats   │   │  TTS playback     │                      │
│  └──────────────────┘   └──────────────────┘                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Strategic Positioning of Each Extension

| Extension | Primary Value | Target Persona Overlap | Synergy with Focus Mode |
|-----------|--------------|----------------------|------------------------|
| Focus Mode - Blocker | Eliminate distractions | 100% (base) | N/A (this product) |
| Tab Manager | Organize browser workspace | 85% knowledge workers | Reduce tab clutter = fewer distractions |
| Screenshot Tool | Capture and annotate | 60% knowledge workers | Document focus session outcomes |
| Note Taking | Quick thought capture | 75% students, workers | Capture ideas during focus without leaving |
| Reading Mode | Distraction-free reading | 70% students, researchers | Clean reading = sustained focus |

#### Revenue Model Alignment

All Zovo extensions follow a consistent monetization structure:
- **Free tier:** Core functionality, local-only data, zero external requests
- **Pro tier:** Advanced features, optional sync, $3.99-$5.99/month
- **Bundle pricing:** Discount for multiple Zovo extensions (planned)
  - Any 2 extensions: 20% off combined Pro price
  - Any 3 extensions: 30% off combined Pro price
  - All extensions: 40% off combined Pro price ("Zovo Complete")

### 1.2 In-Extension "More from Zovo" Section

The "More from Zovo" section lives in the Focus Mode settings page, presenting other
extensions in the family as contextual, helpful recommendations rather than aggressive
advertisements.

#### Design Specification

```
┌─────────────────────────────────────────────────────────────┐
│  SETTINGS                                          [X]      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ... (other settings sections above) ...                    │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  More from Zovo                                             │
│  Productivity tools that work with Focus Mode               │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  [icon]  Zovo Tab Manager                    [Try →]  │  │
│  │          Organize tabs by project. Save sessions.     │  │
│  │          ★★★★★ 4.7  •  12,000+ users                 │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  [icon]  Zovo Screenshot Tool                [Try →]  │  │
│  │          Capture, annotate, and share pages.          │  │
│  │          ★★★★☆ 4.5  •  8,000+ users                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  Powered by Zovo  •  Privacy-first productivity tools       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Card Layout Component

```typescript
// types/cross-promo.ts

interface ZovoExtension {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;               // URL to icon asset
  cwsUrl: string;             // Chrome Web Store listing URL
  cwsId: string;              // CWS extension ID
  rating: number;             // Star rating (e.g., 4.7)
  userCount: string;          // Display string (e.g., "12,000+")
  category: ExtensionCategory;
  synergyMessage: string;     // Contextual message for Focus Mode users
  isInstalled: boolean;       // Detected via chrome.management API
  releaseDate: string;        // ISO date
  priority: number;           // Display order priority (lower = higher)
}

type ExtensionCategory =
  | 'productivity'
  | 'organization'
  | 'capture'
  | 'reading'
  | 'writing';

interface CrossPromoConfig {
  enabled: boolean;
  maxCardsShown: number;          // Default: 2
  refreshIntervalDays: number;    // Default: 7
  lastShownTimestamp: number;
  dismissedExtensions: string[];  // IDs of permanently dismissed
  installedExtensions: string[];  // IDs of detected installs
}
```

```typescript
// services/cross-promo-service.ts

class CrossPromoService {
  private static readonly ZOVO_EXTENSIONS: ZovoExtension[] = [
    {
      id: 'zovo-tab-manager',
      name: 'Zovo Tab Manager',
      tagline: 'Organize tabs by project. Save sessions.',
      description: 'Keep your browser organized with smart tab groups, '
        + 'session saving, and memory optimization.',
      icon: 'assets/icons/zovo-tab-manager-48.png',
      cwsUrl: 'https://chrome.google.com/webstore/detail/zovo-tab-manager/EXTENSION_ID',
      cwsId: 'EXTENSION_ID_TAB_MANAGER',
      rating: 4.7,
      userCount: '12,000+',
      category: 'organization',
      synergyMessage: 'You block distractions well. '
        + 'Keep your tabs organized too!',
      isInstalled: false,
      releaseDate: '2026-07-01',
      priority: 1,
    },
    {
      id: 'zovo-screenshot',
      name: 'Zovo Screenshot Tool',
      tagline: 'Capture, annotate, and share pages.',
      description: 'Full-page screenshots with annotation tools, '
        + 'blur sensitive info, and one-click sharing.',
      icon: 'assets/icons/zovo-screenshot-48.png',
      cwsUrl: 'https://chrome.google.com/webstore/detail/zovo-screenshot/EXTENSION_ID',
      cwsId: 'EXTENSION_ID_SCREENSHOT',
      rating: 4.5,
      userCount: '8,000+',
      category: 'capture',
      synergyMessage: 'Capture your work outcomes after a focus session!',
      isInstalled: false,
      releaseDate: '2026-10-01',
      priority: 2,
    },
    {
      id: 'zovo-notes',
      name: 'Zovo Quick Notes',
      tagline: 'Capture thoughts without losing focus.',
      description: 'Lightweight note-taking that works in any tab. '
        + 'Tag, organize, and export your thoughts.',
      icon: 'assets/icons/zovo-notes-48.png',
      cwsUrl: 'https://chrome.google.com/webstore/detail/zovo-notes/EXTENSION_ID',
      cwsId: 'EXTENSION_ID_NOTES',
      rating: 0,
      userCount: 'Coming Soon',
      category: 'writing',
      synergyMessage: 'Capture ideas during focus sessions '
        + 'without opening a new tab!',
      isInstalled: false,
      releaseDate: '2027-01-01',
      priority: 3,
    },
    {
      id: 'zovo-reader',
      name: 'Zovo Reading Mode',
      tagline: 'Distraction-free reading for any page.',
      description: 'Strip away ads, sidebars, and popups. '
        + 'Custom fonts, dark mode, and text-to-speech.',
      icon: 'assets/icons/zovo-reader-48.png',
      cwsUrl: 'https://chrome.google.com/webstore/detail/zovo-reader/EXTENSION_ID',
      cwsId: 'EXTENSION_ID_READER',
      rating: 0,
      userCount: 'Coming Soon',
      category: 'reading',
      synergyMessage: 'Pair with Focus Mode for the ultimate '
        + 'distraction-free reading experience!',
      isInstalled: false,
      releaseDate: '2027-04-01',
      priority: 4,
    },
  ];

  /**
   * Determines which extensions to show in the "More from Zovo" section.
   * Filters out installed and dismissed extensions, sorts by relevance.
   */
  async getRecommendations(
    config: CrossPromoConfig,
    userContext: UserContext
  ): Promise<ZovoExtension[]> {
    if (!config.enabled) return [];

    const installed = await this.detectInstalledExtensions();
    const dismissed = new Set(config.dismissedExtensions);

    const candidates = CrossPromoService.ZOVO_EXTENSIONS
      .filter(ext => !installed.has(ext.cwsId))
      .filter(ext => !dismissed.has(ext.id))
      .filter(ext => ext.rating > 0 || ext.userCount === 'Coming Soon')
      .filter(ext => new Date(ext.releaseDate) <= new Date());

    // Sort by relevance to user behavior
    const scored = candidates.map(ext => ({
      extension: ext,
      score: this.calculateRelevanceScore(ext, userContext),
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored
      .slice(0, config.maxCardsShown)
      .map(s => s.extension);
  }

  /**
   * Calculate relevance score based on user behavior patterns.
   * Higher score = more relevant recommendation.
   */
  private calculateRelevanceScore(
    ext: ZovoExtension,
    ctx: UserContext
  ): number {
    let score = 100 - ext.priority * 10; // Base from priority

    // Tab Manager is more relevant for users with many tabs
    if (ext.id === 'zovo-tab-manager') {
      if (ctx.averageTabCount > 15) score += 30;
      if (ctx.averageTabCount > 30) score += 20;
    }

    // Notes is more relevant for users who frequently pause sessions
    if (ext.id === 'zovo-notes') {
      if (ctx.sessionPauseRate > 0.3) score += 25;
    }

    // Reader is more relevant for users who block social/news sites
    if (ext.id === 'zovo-reader') {
      if (ctx.blocksNewsSites) score += 20;
      if (ctx.blocksReddit) score += 15;
    }

    // Screenshot is more relevant for active Pro users
    if (ext.id === 'zovo-screenshot') {
      if (ctx.isPro) score += 15;
    }

    // Boost for released extensions with good ratings
    if (ext.rating >= 4.5) score += 15;
    if (ext.rating >= 4.0) score += 10;

    return score;
  }

  /**
   * Detect which Zovo extensions are already installed.
   * Uses chrome.management API (requires 'management' permission
   * only in Pro tier as an optional permission).
   */
  private async detectInstalledExtensions(): Promise<Set<string>> {
    const installed = new Set<string>();

    try {
      if (chrome.management) {
        const extensions = await chrome.management.getAll();
        const zovoIds = new Set(
          CrossPromoService.ZOVO_EXTENSIONS.map(e => e.cwsId)
        );

        for (const ext of extensions) {
          if (zovoIds.has(ext.id) && ext.enabled) {
            installed.add(ext.id);
          }
        }
      }
    } catch {
      // management API not available (free tier) — show all
    }

    return installed;
  }
}

interface UserContext {
  averageTabCount: number;
  sessionPauseRate: number;
  blocksNewsSites: boolean;
  blocksReddit: boolean;
  isPro: boolean;
  focusScore: number;
  streakDays: number;
  totalSessions: number;
}
```

#### Anti-Spam Rules (from Phase 08)

Cross-promotion must never feel intrusive. The following rules are enforced:

| Rule | Implementation | Rationale |
|------|---------------|-----------|
| Never during focus sessions | `CrossPromoService` checks `SessionManager.isActive()` before rendering | Focus sessions are sacred; interruptions destroy trust |
| Never in first 3 days | Compare `installDate` with `Date.now()` | Users need to experience core value before seeing other products |
| Max 1 impression per day | Track `lastCrossPromoShown` in storage | Prevents fatigue and annoyance |
| 15% probability gate | `Math.random() < 0.15` check before rendering | Most settings visits show no cross-promo; feels organic |
| Respect dismissal | Store dismissed extension IDs permanently | User said no; respect that forever |
| No cross-promo for Team plan | Check plan type before rendering | Team admins control their own tool stack |

```typescript
// services/cross-promo-gate.ts

class CrossPromoGate {
  /**
   * Determines if cross-promotion should be shown right now.
   * Returns false if ANY anti-spam rule triggers.
   */
  async shouldShowCrossPromo(): Promise<boolean> {
    // Rule 1: Never during active focus sessions
    const sessionActive = await SessionManager.isActive();
    if (sessionActive) return false;

    // Rule 2: Never in first 3 days after install
    const storage = await chrome.storage.local.get(['installDate']);
    const installDate = storage.installDate || Date.now();
    const daysSinceInstall = (Date.now() - installDate) / (1000 * 60 * 60 * 24);
    if (daysSinceInstall < 3) return false;

    // Rule 3: Max 1 impression per day
    const promoStorage = await chrome.storage.local.get([
      'lastCrossPromoShown',
    ]);
    const lastShown = promoStorage.lastCrossPromoShown || 0;
    const hoursSinceLastShown = (Date.now() - lastShown) / (1000 * 60 * 60);
    if (hoursSinceLastShown < 24) return false;

    // Rule 4: 15% probability gate
    if (Math.random() >= 0.15) return false;

    // Rule 5: No cross-promo for Team plan users
    const planStorage = await chrome.storage.local.get(['plan']);
    if (planStorage.plan === 'team' || planStorage.plan === 'enterprise') {
      return false;
    }

    return true;
  }

  /**
   * Record that cross-promo was shown.
   */
  async recordImpression(extensionId: string): Promise<void> {
    await chrome.storage.local.set({
      lastCrossPromoShown: Date.now(),
      crossPromoImpressions: await this.incrementImpressions(extensionId),
    });
  }

  /**
   * Record that a user dismissed a cross-promo card permanently.
   */
  async recordDismissal(extensionId: string): Promise<void> {
    const storage = await chrome.storage.local.get([
      'crossPromoDismissed',
    ]);
    const dismissed: string[] = storage.crossPromoDismissed || [];
    if (!dismissed.includes(extensionId)) {
      dismissed.push(extensionId);
      await chrome.storage.local.set({
        crossPromoDismissed: dismissed,
      });
    }
  }

  private async incrementImpressions(
    extensionId: string
  ): Promise<Record<string, number>> {
    const storage = await chrome.storage.local.get([
      'crossPromoImpressions',
    ]);
    const impressions: Record<string, number> =
      storage.crossPromoImpressions || {};
    impressions[extensionId] = (impressions[extensionId] || 0) + 1;
    return impressions;
  }
}
```

#### Cross-Promo Analytics Events

All cross-promo interactions are tracked locally (within the Phase 11 500-event rolling
window) for optimization:

| Event | Properties | Purpose |
|-------|-----------|---------|
| `cross_promo_eligible` | `extensionIds[]` | Track how often gate passes |
| `cross_promo_shown` | `extensionId`, `position`, `context` | Impression tracking |
| `cross_promo_clicked` | `extensionId`, `position` | Click-through tracking |
| `cross_promo_dismissed` | `extensionId`, `permanent: boolean` | Dismissal tracking |
| `cross_promo_installed` | `extensionId` | Conversion tracking (via management API) |

#### Expected Impact

| Metric | Target | Measurement |
|--------|--------|-------------|
| Cross-promo impression rate | 3-5% of settings page visits | Impressions / settings opens |
| Click-through rate (CTR) | 8-15% of impressions | Clicks / impressions |
| Install conversion rate | 15-25% of clicks | Installs / clicks |
| Overall cross-install rate | 0.4-1.5% of Focus Mode MAU | New Zovo installs / Focus Mode MAU |
| User satisfaction impact | <0.1 star CWS rating impact | Monitor rating after launch |

### 1.3 CWS Listing Cross-Promotion

#### "From the Same Developer" Section

Chrome Web Store automatically shows other extensions from the same developer account.
To maximize this:

1. **Consistent developer name:** All extensions published under "Zovo" developer account
2. **Consistent branding:** All extension names prefixed with "Zovo" (e.g., "Zovo Tab Manager")
3. **Icon family resemblance:** All icons use the same purple gradient palette with different symbols
4. **Description mentions:** Each extension's long description includes a "Part of the Zovo Family" section

#### CWS Description Cross-Promotion Block

Include at the bottom of every Zovo extension's CWS long description:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART OF THE ZOVO PRODUCTIVITY SUITE

Focus Mode - Blocker: Block distracting sites & build focus habits
Zovo Tab Manager: Organize your tabs by project
Zovo Screenshot Tool: Capture & annotate any page
Zovo Quick Notes: Capture thoughts without losing focus
Zovo Reading Mode: Distraction-free reading

All Zovo extensions are privacy-first. Free tiers make ZERO
external network requests. Your data stays on your device.

Learn more: https://zovo.app
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 1.4 Footer Branding

As specified in Phase 08, all Focus Mode pages include a subtle footer:

```html
<!-- Footer component for all Focus Mode pages -->
<footer class="zovo-footer">
  <span class="zovo-footer__text">Part of</span>
  <a href="https://zovo.app"
     class="zovo-footer__link"
     target="_blank"
     rel="noopener noreferrer">
    <img src="assets/icons/zovo-logo-small.svg"
         alt="Zovo"
         class="zovo-footer__logo"
         width="48"
         height="16" />
  </a>
</footer>
```

```css
.zovo-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 0;
  border-top: 1px solid var(--color-border-subtle);
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.zovo-footer:hover {
  opacity: 1;
}

.zovo-footer__text {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.zovo-footer__link {
  display: flex;
  align-items: center;
  text-decoration: none;
}

.zovo-footer__logo {
  height: 16px;
  width: auto;
}
```

### 1.5 Zovo Bundle Landing Page

A dedicated landing page at `zovo.app/bundle` showcases the full extension family:

#### Page Structure

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│              [Zovo Logo]                                         │
│                                                                  │
│       The Complete Productivity Suite for Chrome                 │
│                                                                  │
│   Block distractions. Organize tabs. Capture ideas.             │
│   All privacy-first. All on your device.                        │
│                                                                  │
│   ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐  │
│   │ Focus Mode │ │ Tab Mgr    │ │ Screenshot │ │ Notes      │  │
│   │ ★★★★★ 4.8 │ │ ★★★★★ 4.7 │ │ ★★★★☆ 4.5 │ │ Coming     │  │
│   │ [Install]  │ │ [Install]  │ │ [Install]  │ │ [Notify]   │  │
│   └────────────┘ └────────────┘ └────────────┘ └────────────┘  │
│                                                                  │
│   ─────────────────────────────────────────────────────────────  │
│                                                                  │
│   Save with Zovo Complete                                       │
│   Get Pro for ALL extensions at 40% off                         │
│                                                                  │
│   Individual Pro: $4.99 + $4.99 + $4.99 = $14.97/mo            │
│   Zovo Complete:  $8.99/mo (save $5.98/mo)                      │
│                                                                  │
│   [Get Zovo Complete →]                                          │
│                                                                  │
│   ─────────────────────────────────────────────────────────────  │
│                                                                  │
│   "I use Focus Mode every day. Adding Tab Manager               │
│    made my workflow 10x more organized." — @user                │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

#### Bundle Pricing Tiers

| Bundle | Extensions | Monthly | Annual (per month) | Savings |
|--------|-----------|---------|-------------------|---------|
| Any 2 | Pick any 2 | $7.99/mo | $5.99/mo | 20% off |
| Any 3 | Pick any 3 | $10.49/mo | $7.99/mo | 30% off |
| Zovo Complete | All extensions | $8.99/mo | $6.99/mo | 40% off |

---

## 2. Partner Extension Collaborations

### 2.1 Complementary Extension Landscape

Focus Mode operates in a broader ecosystem of productivity extensions. Strategic
partnerships with non-competing extensions can expand reach, share audiences, and
create integrated workflows that benefit all parties.

#### Extension Category Map for Partnerships

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PARTNERSHIP OPPORTUNITY MAP                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                        HIGH SYNERGY                                 │
│                            │                                        │
│            ┌───────────────┼───────────────┐                        │
│            │               │               │                        │
│     Tab Managers     Note Taking     Reading Mode                   │
│     ┌──────────┐   ┌──────────┐   ┌──────────┐                     │
│     │OneTab    │   │Notion    │   │Mercury   │                      │
│     │Workona   │   │  Clipper │   │Reader    │                      │
│     │Tab Wrangl│   │Evernote  │   │Omnivore  │                      │
│     │Toby      │   │  Clipper │   │Pocket    │                      │
│     └──────────┘   └──────────┘   └──────────┘                      │
│                                                                     │
│                      MEDIUM SYNERGY                                 │
│                            │                                        │
│            ┌───────────────┼───────────────┐                        │
│            │               │               │                        │
│     Pomodoro Tools   Calendar Tools  Todo/Task                      │
│     ┌──────────┐   ┌──────────┐   ┌──────────┐                     │
│     │Marinara  │   │Checker   │   │Todoist   │                      │
│     │Pomofocus │   │  Plus    │   │Tick Tick │                      │
│     │Forest    │   │Fantasti- │   │  ext     │                      │
│     │          │   │  cal ext │   │Any.do    │                      │
│     └──────────┘   └──────────┘   └──────────┘                      │
│                                                                     │
│                       LOW SYNERGY                                   │
│                            │                                        │
│            ┌───────────────┼───────────────┐                        │
│            │               │               │                        │
│     Password Mgrs   Email Tools    Dev Tools                        │
│     ┌──────────┐   ┌──────────┐   ┌──────────┐                     │
│     │Bitwarden │   │Mailtrack │   │Wappalyzr │                      │
│     │LastPass  │   │Boomerang │   │JSON View │                      │
│     │1Password │   │          │   │          │                      │
│     └──────────┘   └──────────┘   └──────────┘                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Target Partner Extensions

#### Tier 1 Partners (High Priority — Pursue Immediately)

**1. OneTab (Tab Management)**
- Users: 2M+
- Synergy: Users who need focus also have too many tabs
- Integration: "Close distracting tabs to OneTab before starting Focus Mode"
- Collaboration: Mutual CWS listing mention
- Contact: Via CWS developer contact or public GitHub

**2. Todoist Browser Extension (Task Management)**
- Users: 1M+
- Synergy: Focus sessions tied to specific tasks
- Integration: "Start Focus Mode for this task" button in Todoist popup
- Collaboration: Co-authored blog: "The Perfect Focus Workflow"
- Contact: Todoist partnership page or developer relations

**3. Marinara: Pomodoro Assistant**
- Users: 500K+
- Synergy: Both serve Pomodoro users; Focus Mode has built-in timer
- Strategy: Feature absorption rather than partnership (Focus Mode already
  has Pomodoro — position as upgrade)
- Content: "Why a Website Blocker + Pomodoro Timer is Better Than Either Alone"

**4. Notion Web Clipper (Note-Taking)**
- Users: 3M+
- Synergy: Capture research during focus sessions
- Integration: "Save to Notion" quick action on Focus Mode block page
- Collaboration: Notion template: "Focus Mode Dashboard"
- Contact: Notion partnership page

#### Tier 2 Partners (Medium Priority — Pursue After Launch)

**5. Mercury Reader (Reading Mode)**
- Users: 500K+
- Synergy: Distraction-free reading pairs with distraction-free browsing
- Integration: "Read in Mercury" option for allowed reading sites
- Content: Joint blog on deep reading habits

**6. Checker Plus for Gmail**
- Users: 1M+
- Synergy: Email is a top distraction; manage email checks in focus breaks
- Integration: "Check email during break" suggested action
- Content: "How to Check Email Without Losing Focus"

**7. Forest (Focus/Pomodoro)**
- Users: 500K+
- Synergy: Both focus tools; different approaches (gamification vs blocking)
- Strategy: Competitive awareness, not direct partnership
- Content: Comparison content positioning Focus Mode advantages

**8. Pocket (Read-Later)**
- Users: 2M+
- Synergy: "Save for later" instead of reading during focus
- Integration: "Save to Pocket" button on Focus Mode block page
- Content: "The Save-Don't-Read Focus Technique"

#### Tier 3 Partners (Low Priority — Opportunistic)

**9. Bitwarden (Password Manager)**
- Users: 2M+
- Synergy: Low direct synergy; large audience
- Collaboration: Shared audience targeting (productivity-minded users)
- Content: Guest blog exchange

**10. Grammarly**
- Users: 10M+
- Synergy: Writing quality + focus
- Strategy: Dream partnership due to massive audience
- Content: "How Distraction-Free Writing Improves Quality"

### 2.3 Partnership Outreach Template

#### Initial Outreach Email

```
Subject: Partnership Opportunity — [Partner Name] x Focus Mode by Zovo

Hi [Name/Team],

I'm [Your Name], the developer of Focus Mode - Blocker, a Chrome extension
that helps [X,000+] users block distracting websites and build focus habits.

I've been a fan of [Partner Extension] and noticed our user bases overlap
significantly — productivity-focused people who want to get more done in
their browser.

I'd love to explore a lightweight collaboration that benefits both our
users:

[OPTION A — Integration]
We could add a "[Partner Action]" button to Focus Mode's [location],
giving your extension more visibility in a highly relevant context.
In exchange, a mention of Focus Mode in your [location] would help
us reach your audience.

[OPTION B — Content]
We could co-create a blog post like "[Proposed Title]" that naturally
features both extensions. I'd handle the writing and we'd cross-promote
to both audiences.

[OPTION C — Bundle]
We could create a "Productivity Bundle" landing page featuring both
extensions, showing users how they work together. No code changes needed
— just a shared recommendation.

Quick stats about Focus Mode:
- [X,000+] weekly active users
- [4.X] star CWS rating ([X] reviews)
- Built-in Pomodoro timer, Focus Score, and streak system
- Privacy-first: zero external network requests in free tier

Would you be open to a 15-minute call to explore this? I'm flexible on
timing.

Best,
[Your Name]
Zovo — Privacy-first productivity tools
https://zovo.app
```

#### Follow-Up Template (7 Days After Initial Outreach)

```
Subject: Re: Partnership Opportunity — [Partner Name] x Focus Mode

Hi [Name/Team],

Just bumping my previous email. I know things get busy!

To make it easy, here's the simplest version of what I'm proposing:

→ We mention [Partner Extension] in our settings page
  ("Works great with [Partner Extension]")
→ You mention Focus Mode in your [location]
  ("Focus better with Focus Mode - Blocker")

No code changes needed on either side — just CWS listing text updates
or a settings page link. Takes 10 minutes to implement.

Happy to share user demographics or engagement data if helpful for
your decision.

Best,
[Your Name]
```

### 2.4 Partnership Evaluation Criteria

Score each potential partner on a 1-5 scale across these dimensions:

| Criterion | Weight | Description | Scoring Guide |
|-----------|--------|-------------|---------------|
| User base size | 25% | Total installs and MAU | 1: <10K, 2: 10-100K, 3: 100K-500K, 4: 500K-2M, 5: >2M |
| Audience overlap | 25% | How much their users match ours | 1: <20%, 2: 20-40%, 3: 40-60%, 4: 60-80%, 5: >80% |
| Brand alignment | 20% | Privacy, quality, productivity values | 1: Misaligned, 3: Neutral, 5: Perfect fit |
| Technical feasibility | 15% | Ease of integration | 1: Major work, 3: Medium, 5: Trivial |
| Reciprocity potential | 15% | Likelihood they'd promote us back | 1: Unlikely, 3: Maybe, 5: Eager |

#### Partnership Scorecard

| Extension | User Base | Overlap | Brand | Tech | Reciprocity | **Total** |
|-----------|-----------|---------|-------|------|-------------|-----------|
| OneTab | 5 | 4 | 4 | 4 | 3 | **4.10** |
| Todoist Ext | 5 | 4 | 5 | 3 | 2 | **3.95** |
| Notion Clipper | 5 | 3 | 5 | 3 | 2 | **3.75** |
| Marinara | 3 | 5 | 4 | 5 | 4 | **4.05** |
| Mercury Reader | 3 | 4 | 4 | 4 | 4 | **3.75** |
| Checker Plus | 4 | 3 | 3 | 3 | 3 | **3.25** |
| Pocket | 5 | 3 | 4 | 4 | 2 | **3.65** |
| Bitwarden | 5 | 2 | 5 | 2 | 2 | **3.25** |
| Grammarly | 5 | 2 | 4 | 2 | 1 | **2.90** |

### 2.5 Collaboration Types

#### Type 1: Feature Integration

The deepest form of partnership. Both extensions expose APIs or create hooks
that enable cross-product functionality.

**Focus Mode Integration Points:**

```typescript
// integration/partner-hooks.ts

interface PartnerIntegration {
  partnerId: string;
  partnerName: string;
  enabled: boolean;
  hooks: IntegrationHook[];
}

interface IntegrationHook {
  trigger: IntegrationTrigger;
  action: IntegrationAction;
  config: Record<string, unknown>;
}

type IntegrationTrigger =
  | 'focus_session_start'    // When user starts a focus session
  | 'focus_session_end'      // When focus session completes
  | 'break_start'            // When break period begins
  | 'site_blocked'           // When a blocked site is intercepted
  | 'block_page_shown'       // When block page is displayed
  | 'nuclear_mode_activated' // When Nuclear Mode is enabled
  | 'streak_milestone'       // When streak milestone is hit
  | 'focus_score_change';    // When Focus Score updates

type IntegrationAction =
  | 'open_partner_popup'     // Open partner extension popup
  | 'send_message'           // Send chrome.runtime message to partner
  | 'show_partner_button'    // Show partner CTA on block page
  | 'log_event'              // Log integration event
  | 'redirect_to_partner';   // Redirect to partner page

/**
 * Example integrations:
 *
 * OneTab integration:
 * - Trigger: focus_session_start
 * - Action: "Save open tabs to OneTab?" prompt
 *
 * Todoist integration:
 * - Trigger: focus_session_end
 * - Action: "Mark task complete in Todoist?" prompt
 *
 * Notion integration:
 * - Trigger: site_blocked (block page)
 * - Action: "Save to Notion" button on block page
 *
 * Pocket integration:
 * - Trigger: site_blocked (block page)
 * - Action: "Save to Pocket for later" button on block page
 */
```

#### Type 2: Cross-Promotion (Mutual Recommendations)

Lightweight collaboration requiring no code changes. Each extension
mentions the other in settings, CWS descriptions, or onboarding.

**Implementation in Focus Mode Settings:**

```
┌───────────────────────────────────────────────────────┐
│  Works Great With                                     │
│                                                       │
│  [OneTab icon]  OneTab — Save tabs before focusing    │
│                 [Get OneTab →]                        │
│                                                       │
│  [Notion icon]  Notion — Capture ideas during focus   │
│                 [Get Notion Clipper →]                │
│                                                       │
│  These are independent extensions we recommend.       │
│  No affiliation.                                      │
└───────────────────────────────────────────────────────┘
```

#### Type 3: Content Bundle

Joint marketing material featuring both extensions in a productivity workflow.

**Bundle Landing Page Template:**

```
URL: zovo.app/workflows/[partner-name]-focus

Title: The [Partner] + Focus Mode Workflow

Step 1: [Partner Action] (screenshot of partner)
Step 2: Start Focus Mode session (screenshot of Focus Mode)
Step 3: [Combined Benefit]

Install both:
[Install Focus Mode]  [Install Partner]
```

#### Type 4: Content Collaboration

Co-authored blog posts, webinars, or social media campaigns.

**Content Ideas by Partner:**

| Partner | Blog Post | Social Campaign | Video |
|---------|----------|----------------|-------|
| OneTab | "Clean Tabs, Clear Mind: The Tab + Focus Workflow" | Twitter thread: "5 Steps to Zero-Distraction Chrome" | 2-min setup walkthrough |
| Todoist | "From Task List to Deep Work in 30 Seconds" | Instagram carousel: "My Focus Workflow" | Joint demo video |
| Notion | "The Notion Focus Dashboard Template" | Tweet exchange during Productivity Week | Notion template walkthrough |
| Pocket | "Save Don't Read: The Focus Reader's Technique" | Shared infographic on reading habits | "How I Read 50 Articles a Week" |

### 2.6 Partnership Implementation Timeline

| Phase | Timeline | Actions |
|-------|----------|---------|
| Research | Months 1-2 | Identify top 5 partners, score, prioritize |
| Outreach | Months 2-3 | Send initial emails to Tier 1 partners |
| Quick Wins | Months 3-4 | Implement cross-promo mentions (no code) |
| Content | Months 4-6 | Co-author 2-3 blog posts with willing partners |
| Integration | Months 6-12 | Build feature integrations with 1-2 partners |
| Expand | Months 12+ | Pursue Tier 2 and 3 partners |

---

## 3. Upgrade Path Funnels

### 3.1 Focus Mode Upgrade Funnel Overview

Focus Mode has three upgrade paths, each targeting a different user segment
and revenue tier:

```
┌──────────────────────────────────────────────────────────────────┐
│                    FOCUS MODE UPGRADE FUNNELS                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FREE USERS (100%)                                              │
│  │                                                               │
│  ├── 10 Paywall Touchpoints (T1-T10)                            │
│  │   │                                                           │
│  │   ├── T1: Blurred weekly report (8-12% conv) ← HIGHEST       │
│  │   ├── T2: 11th blocklist site (6-10% conv)                   │
│  │   ├── T3: Custom schedule (3-5% conv)                        │
│  │   ├── T4: Advanced stats (3-5% conv)                         │
│  │   ├── T5: Custom block page (2-4% conv)                      │
│  │   ├── T6: Sync across devices (4-7% conv)                    │
│  │   ├── T7: Custom sounds (2-3% conv)                          │
│  │   ├── T8: Team features (5-8% conv for work users)           │
│  │   ├── T9: White-label block page (1-2% conv)                 │
│  │   └── T10: API access (1-2% conv)                            │
│  │                                                               │
│  └──→ PRO USERS ($4.99/mo)                                      │
│       │                                                          │
│       ├── Annual upsell: $2.99/mo (save 40%)                    │
│       ├── Lifetime upsell: $49.99 (save after 10 months)        │
│       │                                                          │
│       ├── Work email detected? → TEAM PROMPT                     │
│       │   "Your colleagues might benefit"                        │
│       │                                                          │
│       └──→ TEAM USERS ($3.99/user/mo)                           │
│            │                                                     │
│            ├── Team size > 20 → ENTERPRISE PROMPT                │
│            ├── SSO request → ENTERPRISE PROMPT                   │
│            ├── Compliance need → ENTERPRISE PROMPT               │
│            │                                                     │
│            └──→ ENTERPRISE (Custom pricing)                     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 Free to Pro Conversion Funnel

#### Paywall Touchpoint Details

Each paywall touchpoint is a moment where the free user encounters a Pro feature
limitation. The key is to show value before showing the paywall.

**T1: Blurred Weekly Report (Highest Conversion — 8-12%)**

```
┌───────────────────────────────────────────────────────┐
│  Your Weekly Focus Report                     [X]     │
├───────────────────────────────────────────────────────┤
│                                                       │
│  This Week's Score:  ██████████░░  78/100             │
│                                                       │
│  Sessions:    12  (+3 from last week)                 │
│  Time Saved:  4h 23m                                  │
│                                                       │
│  ┌─────────────────────────────────────────────────┐  │
│  │                                                 │  │
│  │     ░░░░░░ BLURRED ░░░░░░░                     │  │
│  │     ░░ Detailed Insights ░░░                    │  │
│  │     ░░░░░░░░░░░░░░░░░░░░░░                     │  │
│  │     ░░ Top Blocked Sites ░░░                    │  │
│  │     ░░ Productivity Trends ░                    │  │
│  │     ░░ Focus Time Heatmap ░░                    │  │
│  │     ░░░░░░░░░░░░░░░░░░░░░░                     │  │
│  │                                                 │  │
│  │  🔒 Unlock Full Report with Pro                 │  │
│  │                                                 │  │
│  └─────────────────────────────────────────────────┘  │
│                                                       │
│  [Unlock Pro — $4.99/mo]    [Maybe Later]             │
│                                                       │
└───────────────────────────────────────────────────────┘
```

**Why T1 converts best:**
1. User already invested a full week of focus sessions
2. Sunk cost: "I did all this work, I want to see the results"
3. Blurred content creates curiosity gap
4. Social comparison: "How do I compare to last week?"
5. Arrives at a natural reflection moment (end of week)

**T2: 11th Blocklist Site (6-10% conversion)**

```typescript
// Triggered when user tries to add 11th site to blocklist

class BlocklistPaywall {
  private static readonly FREE_LIMIT = 10;

  async handleAddSite(site: string): Promise<AddSiteResult> {
    const currentSites = await this.getBlocklist();

    if (currentSites.length >= BlocklistPaywall.FREE_LIMIT) {
      return {
        success: false,
        paywallType: 'T2_BLOCKLIST_LIMIT',
        message: `You've reached the ${BlocklistPaywall.FREE_LIMIT}-site `
          + 'free limit. Upgrade to Pro for unlimited sites.',
        currentCount: currentSites.length,
        attemptedSite: site,
      };
    }

    // Add site normally for free users under limit
    return { success: true, paywallType: null };
  }
}
```

**Paywall UI for T2:**

```
┌───────────────────────────────────────────────────────┐
│  Blocklist Full                                [X]    │
├───────────────────────────────────────────────────────┤
│                                                       │
│  You're blocking 10 sites — nice work!                │
│                                                       │
│  To add more sites and block unlimited distractions,  │
│  upgrade to Focus Mode Pro.                           │
│                                                       │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Free:  10 sites   │  Pro:  Unlimited sites    │  │
│  │  ─────────────────  │  ─────────────────────── │  │
│  │  ✓ Basic timer     │  ✓ Advanced timer         │  │
│  │  ✓ Focus Score     │  ✓ Detailed reports       │  │
│  │  ✓ 3 sounds        │  ✓ 15+ sounds             │  │
│  │                     │  ✓ Custom schedule        │  │
│  │                     │  ✓ Cross-device sync      │  │
│  └─────────────────────────────────────────────────┘  │
│                                                       │
│  [Upgrade to Pro — $4.99/mo]                          │
│  or $2.99/mo billed annually                          │
│                                                       │
│  [Not Now — Remove a Site Instead]                    │
│                                                       │
└───────────────────────────────────────────────────────┘
```

#### Conversion Optimization Strategies

**Strategy 1: Progressive Value Demonstration**

Show users how much value they are getting from Focus Mode before asking them to pay:

```typescript
class ValueDemonstration {
  /**
   * Calculate and display value metrics before showing paywall.
   * Users who see their "value earned" convert 2-3x better.
   */
  async getValueSummary(): Promise<ValueSummary> {
    const stats = await StatsService.getLifetimeStats();

    return {
      totalFocusTime: stats.totalFocusMinutes,
      sitesBlocked: stats.totalBlockedAttempts,
      estimatedTimeSaved: stats.totalBlockedAttempts * 2.5, // ~2.5 min per distraction
      currentStreak: stats.currentStreakDays,
      focusScore: stats.currentFocusScore,
      sessionsCompleted: stats.totalSessions,
      // Framing: "You've saved X hours with Focus Mode"
      timeSavedFormatted: this.formatTimeSaved(
        stats.totalBlockedAttempts * 2.5
      ),
    };
  }

  private formatTimeSaved(minutes: number): string {
    if (minutes < 60) return `${Math.round(minutes)} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = Math.round(minutes % 60);
    return `${hours}h ${remainingMins}m`;
  }
}
```

**Strategy 2: Social Proof on Paywall**

```typescript
const PAYWALL_SOCIAL_PROOF = [
  {
    type: 'user_count',
    text: 'Join 2,500+ Pro users who focus better',
    minInstalls: 5000,  // Only show when we have enough users
  },
  {
    type: 'testimonial',
    text: '"Pro paid for itself in the first week. The detailed reports '
      + 'changed how I plan my day." — Sarah K., Product Manager',
  },
  {
    type: 'stat',
    text: 'Pro users complete 40% more focus sessions on average',
  },
  {
    type: 'rating',
    text: 'Rated 4.8 stars by Pro subscribers',
  },
];
```

**Strategy 3: Limited-Time Offers**

```typescript
class UpgradeOffers {
  /**
   * Special offers to boost conversion at key moments.
   * Each offer has strict display rules to prevent overuse.
   */
  static readonly OFFERS = {
    // Shown once at the end of the first full week
    FIRST_WEEK_DISCOUNT: {
      id: 'first_week_20',
      discount: 20, // percent
      message: 'First-week special: 20% off your first 3 months',
      promoCode: 'FOCUS20',
      expiresAfterHours: 48,
      maxShowCount: 3,
      triggerCondition: 'days_since_install >= 7 && days_since_install < 10',
    },

    // Shown when user hits 7-day streak (high engagement moment)
    STREAK_CELEBRATION: {
      id: 'streak_7_offer',
      discount: 15,
      message: '7-day streak! Celebrate with 15% off Pro',
      promoCode: 'STREAK15',
      expiresAfterHours: 24,
      maxShowCount: 1,
      triggerCondition: 'current_streak === 7',
    },

    // Shown during annual billing cycle (January, back-to-school)
    SEASONAL: {
      id: 'seasonal_annual',
      discount: 25,
      message: 'New Year, New Focus: 25% off annual plan',
      promoCode: 'NEWYEAR25',
      expiresAfterHours: 168, // 7 days
      maxShowCount: 2,
      triggerCondition: 'month === 1 || month === 9',
    },
  };
}
```

### 3.3 Pro to Team Conversion Funnel

#### Work Email Detection

```typescript
class TeamConversionService {
  // Common personal email domains to exclude
  private static readonly PERSONAL_DOMAINS = new Set([
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    'aol.com', 'icloud.com', 'mail.com', 'protonmail.com',
    'zoho.com', 'yandex.com', 'live.com', 'msn.com',
  ]);

  /**
   * Detect if the Pro user has a work email, suggesting team potential.
   * Only checked if the user has opted into account sync (Pro feature).
   */
  isWorkEmail(email: string): boolean {
    if (!email) return false;
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return false;
    return !TeamConversionService.PERSONAL_DOMAINS.has(domain);
  }

  /**
   * Determine if we should show the team upgrade prompt.
   * Conditions: work email + 30+ days Pro + high engagement.
   */
  async shouldShowTeamPrompt(): Promise<boolean> {
    const storage = await chrome.storage.local.get([
      'userEmail', 'proStartDate', 'totalSessions',
      'teamPromptShown', 'teamPromptDismissed',
    ]);

    // Don't re-show if permanently dismissed
    if (storage.teamPromptDismissed) return false;

    // Don't show more than 3 times total
    if ((storage.teamPromptShown || 0) >= 3) return false;

    // Must have work email
    if (!this.isWorkEmail(storage.userEmail)) return false;

    // Must be Pro for 30+ days
    const daysSinceProStart =
      (Date.now() - (storage.proStartDate || Date.now()))
      / (1000 * 60 * 60 * 24);
    if (daysSinceProStart < 30) return false;

    // Must have high engagement (50+ total sessions)
    if ((storage.totalSessions || 0) < 50) return false;

    return true;
  }
}
```

#### Team Upgrade Prompt

```
┌───────────────────────────────────────────────────────┐
│  Focus Better as a Team                        [X]    │
├───────────────────────────────────────────────────────┤
│                                                       │
│  You've completed 127 focus sessions — impressive!    │
│                                                       │
│  Your colleagues at acme.com might benefit too.       │
│  Focus Mode Team includes:                            │
│                                                       │
│  ✓ Shared blocklists for your team                    │
│  ✓ Team Focus Score leaderboard                       │
│  ✓ Manager dashboard & insights                       │
│  ✓ Centralized billing                                │
│  ✓ Priority support                                   │
│                                                       │
│  Team pricing: $3.99/user/mo                          │
│  (You save $1.00/mo vs individual Pro!)               │
│                                                       │
│  [Start Team Trial — 14 Days Free]                    │
│  [Invite a Colleague First]                           │
│  [Not Interested]                                     │
│                                                       │
└───────────────────────────────────────────────────────┘
```

#### "Add Colleague" Lightweight Entry Point

Rather than requiring full team setup, offer a simple "invite a colleague" flow:

```typescript
class ColleagueInviteService {
  /**
   * Generate a colleague invite link that:
   * 1. Gives the colleague a 14-day Pro trial
   * 2. Creates a lightweight team connection
   * 3. If 3+ colleagues join, auto-suggest Team plan
   */
  async generateInviteLink(
    inviterEmail: string
  ): Promise<InviteLink> {
    const inviteCode = await this.createInviteCode(inviterEmail);

    return {
      url: `https://zovo.app/invite/${inviteCode}`,
      message: `Hey! I use Focus Mode to block distracting sites during `
        + `work. You might like it too. Here's a free Pro trial: `
        + `https://zovo.app/invite/${inviteCode}`,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    };
  }
}

interface InviteLink {
  url: string;
  message: string;
  expiresAt: number;
}
```

### 3.4 Team to Enterprise Conversion Funnel

#### Enterprise Trigger Detection

```typescript
class EnterpriseDetection {
  /**
   * Signals that a Team account may need Enterprise features.
   * Track these signals and trigger outbound sales when threshold is met.
   */
  static readonly ENTERPRISE_SIGNALS = {
    // Team size signals
    TEAM_SIZE_THRESHOLD: {
      signal: 'team_members > 20',
      weight: 40,
      action: 'sales_outreach',
    },
    RAPID_TEAM_GROWTH: {
      signal: '5+ members added in 7 days',
      weight: 30,
      action: 'sales_outreach',
    },

    // Feature request signals
    SSO_REQUEST: {
      signal: 'user requested SSO/SAML',
      weight: 50,
      action: 'immediate_sales_outreach',
    },
    ADMIN_CONTROLS_REQUEST: {
      signal: 'user requested admin dashboard',
      weight: 35,
      action: 'sales_outreach',
    },
    COMPLIANCE_REQUEST: {
      signal: 'user requested audit logs or compliance',
      weight: 45,
      action: 'immediate_sales_outreach',
    },

    // Usage signals
    HIGH_TEAM_ENGAGEMENT: {
      signal: 'team avg sessions > 5/day for 30 days',
      weight: 25,
      action: 'premium_support_offer',
    },
    MULTI_DEPARTMENT: {
      signal: 'members from 3+ email subdomains',
      weight: 30,
      action: 'sales_outreach',
    },
  };

  /**
   * Calculate enterprise readiness score (0-100).
   * Trigger sales outreach at score >= 60.
   */
  calculateEnterpriseScore(signals: string[]): number {
    let score = 0;
    for (const signal of signals) {
      const config = EnterpriseDetection.ENTERPRISE_SIGNALS[
        signal as keyof typeof EnterpriseDetection.ENTERPRISE_SIGNALS
      ];
      if (config) {
        score += config.weight;
      }
    }
    return Math.min(100, score);
  }
}
```

#### Enterprise Feature Comparison

| Feature | Pro | Team | Enterprise |
|---------|-----|------|-----------|
| Unlimited blocklists | Yes | Yes | Yes |
| Advanced stats | Yes | Yes | Yes |
| Cross-device sync | Yes | Yes | Yes |
| Shared team blocklists | No | Yes | Yes |
| Team leaderboard | No | Yes | Yes |
| Centralized billing | No | Yes | Yes |
| SSO/SAML | No | No | Yes |
| Admin dashboard | No | Basic | Advanced |
| Audit logs | No | No | Yes |
| Custom deployment | No | No | Yes |
| SLA | No | No | Yes (99.9%) |
| Dedicated support | No | Email | Slack + Phone |
| Custom integrations | No | No | Yes |
| Volume pricing | No | No | Yes |
| **Pricing** | $4.99/mo | $3.99/user/mo | Custom |

### 3.5 Revenue Expansion Strategies

#### Annual Plan Upsell

Show annual upsell after the second monthly payment (user is committed):

```typescript
class AnnualUpsellService {
  async shouldShowAnnualUpsell(): Promise<boolean> {
    const storage = await chrome.storage.local.get([
      'plan', 'billingCycle', 'monthlyPaymentCount',
      'annualUpsellDismissed',
    ]);

    if (storage.plan !== 'pro') return false;
    if (storage.billingCycle === 'annual') return false;
    if (storage.annualUpsellDismissed) return false;
    if ((storage.monthlyPaymentCount || 0) < 2) return false;

    return true;
  }

  getAnnualUpsellMessage(monthlyPaymentCount: number): string {
    const totalPaid = monthlyPaymentCount * 4.99;
    const annualCost = 2.99 * 12; // $35.88/year
    const monthlyCostForYear = 4.99 * 12; // $59.88/year
    const savings = monthlyCostForYear - annualCost;

    return `You've paid $${totalPaid.toFixed(2)} so far. `
      + `Switch to annual billing and save $${savings.toFixed(2)}/year `
      + `($2.99/mo instead of $4.99/mo).`;
  }
}
```

#### Lifetime Plan Upsell

Target users who have been paying monthly for 6+ months:

```
┌───────────────────────────────────────────────────────┐
│  Save with Lifetime Access                     [X]    │
├───────────────────────────────────────────────────────┤
│                                                       │
│  You've been a Pro member for 8 months.               │
│  Total paid: $39.92                                   │
│                                                       │
│  Get Lifetime access for $49.99 — a one-time          │
│  payment that replaces your monthly subscription      │
│  forever.                                             │
│                                                       │
│  At your current rate, Lifetime pays for itself       │
│  in just 2 more months.                               │
│                                                       │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Monthly: $4.99/mo × forever = $$$              │  │
│  │  Lifetime: $49.99 once = done                   │  │
│  └─────────────────────────────────────────────────┘  │
│                                                       │
│  [Switch to Lifetime — $49.99]                        │
│  [Keep Monthly]                                       │
│                                                       │
└───────────────────────────────────────────────────────┘
```

#### Add-On Revenue Opportunities

| Add-On | Price | Target Audience | Description |
|--------|-------|----------------|-------------|
| Premium Sound Pack | $2.99 one-time | All Pro users | 20+ additional ambient sounds (cafe, rain variants, binaural beats) |
| Custom Theme Pack | $1.99 one-time | Power users | 10 custom block page themes and popup color schemes |
| Focus Coach (AI) | $1.99/mo add-on | ADHD users, students | AI-powered session recommendations and focus tips |
| Data Export | $0.99 one-time | Power users | Export all focus data as CSV/JSON for personal analytics |
| Family Plan | $7.99/mo | Parents, families | 5 accounts with parental controls on children's blocklists |

### 3.6 Funnel Analytics and Tracking

```typescript
// analytics/funnel-tracker.ts

class FunnelTracker {
  /**
   * Track every step in the upgrade funnel.
   * All data stored locally in the Phase 11 analytics system.
   */
  static readonly FUNNEL_EVENTS = {
    // Paywall touchpoints
    PAYWALL_SHOWN: 'paywall_shown',
    PAYWALL_CTA_CLICKED: 'paywall_cta_clicked',
    PAYWALL_DISMISSED: 'paywall_dismissed',

    // Checkout flow
    CHECKOUT_STARTED: 'checkout_started',
    CHECKOUT_PLAN_SELECTED: 'checkout_plan_selected',
    CHECKOUT_PAYMENT_ENTERED: 'checkout_payment_entered',
    CHECKOUT_COMPLETED: 'checkout_completed',
    CHECKOUT_ABANDONED: 'checkout_abandoned',

    // Upsell events
    ANNUAL_UPSELL_SHOWN: 'annual_upsell_shown',
    ANNUAL_UPSELL_ACCEPTED: 'annual_upsell_accepted',
    ANNUAL_UPSELL_DISMISSED: 'annual_upsell_dismissed',

    LIFETIME_UPSELL_SHOWN: 'lifetime_upsell_shown',
    LIFETIME_UPSELL_ACCEPTED: 'lifetime_upsell_accepted',
    LIFETIME_UPSELL_DISMISSED: 'lifetime_upsell_dismissed',

    // Team events
    TEAM_PROMPT_SHOWN: 'team_prompt_shown',
    TEAM_INVITE_SENT: 'team_invite_sent',
    TEAM_INVITE_ACCEPTED: 'team_invite_accepted',
    TEAM_CREATED: 'team_created',

    // Enterprise events
    ENTERPRISE_SIGNAL_DETECTED: 'enterprise_signal_detected',
    ENTERPRISE_CONTACT_FORM_SHOWN: 'enterprise_contact_form_shown',
    ENTERPRISE_CONTACT_SUBMITTED: 'enterprise_contact_submitted',
  } as const;

  async trackFunnelEvent(
    event: string,
    properties: Record<string, unknown> = {}
  ): Promise<void> {
    await AnalyticsService.track({
      event,
      properties: {
        ...properties,
        timestamp: Date.now(),
        currentPlan: await this.getCurrentPlan(),
        daysSinceInstall: await this.getDaysSinceInstall(),
        totalSessions: await this.getTotalSessions(),
        focusScore: await this.getFocusScore(),
      },
    });
  }

  /**
   * Calculate conversion rate between funnel stages.
   * Returns rate as decimal (0.0 - 1.0).
   */
  async calculateConversionRate(
    fromEvent: string,
    toEvent: string,
    daysBack: number = 30
  ): Promise<number> {
    const events = await AnalyticsService.getEvents(daysBack);
    const fromCount = events.filter(e => e.event === fromEvent).length;
    const toCount = events.filter(e => e.event === toEvent).length;

    if (fromCount === 0) return 0;
    return toCount / fromCount;
  }
}
```

### 3.7 Upgrade Funnel Optimization Checklist

| Optimization | Status | Expected Impact | Effort |
|-------------|--------|----------------|--------|
| Value summary before paywall | To implement | +15-25% conversion | Low |
| Social proof on paywall | To implement | +10-20% conversion | Low |
| Annual upsell after 2nd month | To implement | +30% annual adoption | Low |
| Lifetime upsell after 6 months | To implement | +$15 LTV per converter | Low |
| First-week 20% discount | To implement | +20-30% first-week conv | Medium |
| Streak celebration offer | To implement | +10-15% at milestone | Low |
| Work email team detection | To implement | +5% Pro-to-Team rate | Medium |
| Enterprise signal scoring | To implement | Identifies 80% of enterprise leads | Medium |
| Checkout abandonment recovery | To implement | +10-15% recovery rate | High |
| A/B test paywall designs | To implement | +5-15% per winning variant | Medium |

---

# PART B: GROWTH METRICS & EXPERIMENTATION

---

## 4. Key Metrics Dashboard

### 4.1 Metrics Architecture Overview

All growth metrics for Focus Mode follow the privacy-first principle established in earlier
phases: free-tier data stays entirely local, and Pro-tier users may opt into anonymous,
aggregated telemetry. The metrics dashboard is designed so that:

1. **Local dashboard** (in-extension): Available to all users, showing personal stats
2. **Aggregated dashboard** (server-side): Available to the Zovo team, fed by anonymous
   opt-in telemetry from Pro users and server-side events (installs, payments, referrals)
3. **CWS analytics** (Chrome Web Store): Impression, install, and uninstall data from the
   Chrome Web Store developer dashboard

```
┌──────────────────────────────────────────────────────────────────┐
│                    METRICS DATA FLOW                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐                                            │
│  │  FREE USERS      │                                            │
│  │  (100% of base)  │─── Local analytics only (500-event window) │
│  │                   │    NO external requests                    │
│  └─────────────────┘                                            │
│                                                                  │
│  ┌─────────────────┐    ┌──────────────┐    ┌────────────────┐  │
│  │  PRO USERS       │    │  Zovo API     │    │  Dashboard     │  │
│  │  (opted-in)      │───→│  (anonymous)  │───→│  (Metabase)    │  │
│  │                   │    │              │    │                │  │
│  └─────────────────┘    └──────────────┘    └────────────────┘  │
│                                                                  │
│  ┌─────────────────┐    ┌──────────────┐         │              │
│  │  CWS Dashboard   │───→│  CWS API     │─────────┘              │
│  │  (Google)        │    │  (scrape)    │                        │
│  └─────────────────┘    └──────────────┘                        │
│                                                                  │
│  ┌─────────────────┐    ┌──────────────┐         │              │
│  │  Stripe          │───→│  Webhooks    │─────────┘              │
│  │  (payments)      │    │              │                        │
│  └─────────────────┘    └──────────────┘                        │
│                                                                  │
│  ┌─────────────────┐    ┌──────────────┐         │              │
│  │  Referral System │───→│  Referral DB │─────────┘              │
│  │  (server-side)   │    │              │                        │
│  └─────────────────┘    └──────────────┘                        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 Acquisition Metrics

#### Install Velocity

| Metric | Definition | Target | Measurement Source |
|--------|-----------|--------|-------------------|
| Daily Active Installs (DAI) | New installs per day | Month 1: 20/day, Month 6: 100/day | CWS developer dashboard |
| Weekly Active Installs (WAI) | New installs per week | Month 1: 140/week, Month 6: 700/week | CWS developer dashboard |
| Monthly Active Installs (MAI) | New installs per month | Month 1: 600, Month 6: 3,000 | CWS developer dashboard |
| Install Growth Rate | Week-over-week % change | >5% WoW sustained | Calculated |
| Net Installs | Installs minus uninstalls | >70% of gross installs | CWS + uninstall tracking |

#### Install Source Breakdown

```typescript
// analytics/acquisition-tracker.ts

enum InstallSource {
  CWS_ORGANIC = 'cws_organic',         // Chrome Web Store search/browse
  CWS_FEATURED = 'cws_featured',       // CWS featured/recommended
  DIRECT_WEBSITE = 'direct_website',    // zovo.app "Install" button
  REFERRAL = 'referral',               // User referral link
  SOCIAL_TWITTER = 'social_twitter',    // Twitter/X campaigns
  SOCIAL_REDDIT = 'social_reddit',      // Reddit posts
  SOCIAL_LINKEDIN = 'social_linkedin',  // LinkedIn campaigns
  SOCIAL_YOUTUBE = 'social_youtube',    // YouTube creator mentions
  CONTENT_BLOG = 'content_blog',        // Blog post links
  CONTENT_PH = 'content_producthunt',   // ProductHunt launch
  PAID_GOOGLE = 'paid_google',          // Google Ads
  PAID_SOCIAL = 'paid_social',          // Paid social media ads
  PARTNER = 'partner',                  // Partner cross-promotion
  ZOVO_CROSS = 'zovo_cross',           // Zovo family cross-install
  UNKNOWN = 'unknown',                 // Unattributed
}

interface InstallSourceMetrics {
  source: InstallSource;
  installs: number;
  percentOfTotal: number;
  costPerInstall: number | null;  // null for organic
  conversionToActive: number;      // % that complete onboarding
  day7Retention: number;          // % retained after 7 days
  day30Retention: number;         // % retained after 30 days
  proConversionRate: number;      // % that upgrade to Pro
  estimatedLTV: number;           // Predicted lifetime value
}
```

#### Install Source Target Distribution

| Source | Month 1 Target | Month 6 Target | CPI Budget |
|--------|---------------|----------------|------------|
| CWS Organic | 60% | 45% | $0 (free) |
| Direct Website | 5% | 10% | $0 (free) |
| Referral | 5% | 15% | ~$0.50 (reward cost) |
| Social (organic) | 10% | 8% | $0 (free) |
| Content/Blog | 5% | 8% | $0 (free) |
| ProductHunt | 10% (launch week) | 2% | $0 (free) |
| Paid Ads | 0% | 5% | $1.50-3.00/install |
| Partner/Cross-promo | 2% | 5% | $0 (reciprocal) |
| Zovo Cross-install | 3% | 2% | $0 (internal) |

#### CWS Conversion Funnel

```
CWS Impressions (100%)
    │
    ├── Impression to Detail Page Click: 8-15%
    │   (Target: 12%)
    │
    ▼
Detail Page Views (12%)
    │
    ├── Detail Page to Install Click: 15-30%
    │   (Target: 22%)
    │
    ▼
Install Button Clicks (2.6%)
    │
    ├── Install Click to Completed Install: 85-95%
    │   (Target: 90%)
    │
    ▼
Completed Installs (2.4%)
    │
    ├── Install to Onboarding Start: 80-90%
    │   (Target: 85%)
    │
    ▼
Onboarding Started (2.0%)
    │
    ├── Onboarding Completion: 65-75%
    │   (Target: 70% per Phase 08)
    │
    ▼
Onboarding Completed (1.4%)
    │
    ├── First Focus Session: 60-80%
    │   (Target: 70%)
    │
    ▼
Activated Users (1.0%)
```

#### CPI (Cost Per Install) by Channel

```typescript
interface ChannelCPI {
  channel: string;
  spend: number;          // Monthly spend
  installs: number;       // Monthly installs attributed
  cpi: number;            // Cost per install
  activatedCPI: number;   // Cost per activated user
  payingCPI: number;      // Cost per paying user (CAC)
  ltv: number;            // Estimated lifetime value
  ltvCACRatio: number;    // LTV:CAC ratio (target: 3:1+)
  roiPercent: number;     // Return on investment
}

class CPICalculator {
  /**
   * Calculate CPI and related metrics for each acquisition channel.
   */
  calculateChannelMetrics(
    channel: string,
    spend: number,
    installs: number,
    activationRate: number,
    proConversionRate: number,
    averageLTV: number
  ): ChannelCPI {
    const cpi = installs > 0 ? spend / installs : 0;
    const activatedUsers = installs * activationRate;
    const activatedCPI = activatedUsers > 0
      ? spend / activatedUsers : 0;
    const payingUsers = activatedUsers * proConversionRate;
    const payingCPI = payingUsers > 0 ? spend / payingUsers : 0;
    const totalRevenue = payingUsers * averageLTV;
    const roi = spend > 0
      ? ((totalRevenue - spend) / spend) * 100 : 0;

    return {
      channel,
      spend,
      installs,
      cpi,
      activatedCPI,
      payingCPI,
      ltv: averageLTV,
      ltvCACRatio: payingCPI > 0 ? averageLTV / payingCPI : 0,
      roiPercent: roi,
    };
  }
}
```

#### CPI Targets by Channel

| Channel | Target CPI | Target Activated CPI | Target CAC | Min LTV:CAC |
|---------|-----------|---------------------|-----------|-------------|
| CWS Organic | $0.00 | $0.00 | $0.00 | Infinite |
| Referral | $0.50 | $0.65 | $15.00 | 3:1 |
| Social Organic | $0.00 | $0.00 | $0.00 | Infinite |
| Content/SEO | $0.10 | $0.14 | $3.50 | 12:1 |
| Google Ads | $2.00 | $2.85 | $65.00 | 3:1 |
| Social Ads | $1.50 | $2.15 | $50.00 | 3:1 |
| Partner | $0.00 | $0.00 | $0.00 | Infinite |

### 4.3 Activation Metrics

Activation is the critical bridge between install and engagement. A user is "activated"
when they complete enough actions to experience the core value of Focus Mode.

#### Activation Definition

```typescript
interface ActivationCriteria {
  /**
   * A user is considered "activated" when they complete ALL of:
   * 1. Onboarding flow completed (or skipped after viewing 3+ slides)
   * 2. At least 1 site added to blocklist
   * 3. At least 1 focus session started
   * 4. At least 1 focus session completed (not abandoned)
   *
   * "Super-activated" users also:
   * 5. Complete 3+ focus sessions in first 7 days
   * 6. Achieve a Focus Score > 50
   */
  onboardingCompleted: boolean;
  blockedSiteAdded: boolean;
  firstSessionStarted: boolean;
  firstSessionCompleted: boolean;
  // Super-activation (predicts long-term retention)
  threeSessionsInFirstWeek: boolean;
  focusScoreAbove50: boolean;
}
```

#### Activation Metrics Table

| Metric | Definition | Target | Alert Threshold |
|--------|-----------|--------|----------------|
| Onboarding completion rate | % who finish all 5 slides | 70% | <60% |
| Time to first focus session | Median minutes from install | <60 seconds | >120 seconds |
| First blocklist site added | % who add 1+ site in first session | 80% | <65% |
| First session completion rate | % who finish their first session | 65% | <50% |
| Activation rate (all criteria) | % who meet all 4 criteria | 45% | <35% |
| Super-activation rate | % who meet all 6 criteria | 20% | <15% |
| Time to activation | Median days from install to activation | <1 day | >3 days |

#### Activation Funnel Visualization

```
Install Complete (100%)
    │
    ├── 85% ── Onboarding Started
    │              │
    │              ├── 70% ── Onboarding Completed (59.5% of installs)
    │              │              │
    │              │              ├── 80% ── First Site Blocked (47.6%)
    │              │              │              │
    │              │              │              ├── 75% ── First Session Started (35.7%)
    │              │              │              │              │
    │              │              │              │              ├── 65% ── First Session Completed (23.2%)
    │              │              │              │              │              │
    │              │              │              │              │              └── ACTIVATED
    │              │              │              │              │
    │              │              │              │              └── 35% ── Abandoned Session
    │              │              │              │
    │              │              │              └── 25% ── Did not start session
    │              │              │
    │              │              └── 20% ── Did not add site
    │              │
    │              └── 30% ── Abandoned Onboarding
    │
    └── 15% ── Never Started Onboarding
```

#### Activation Improvement Strategies

| Strategy | Target Step | Expected Improvement | Effort |
|----------|-----------|---------------------|--------|
| Pre-populated blocklist suggestions | First Site Blocked | +10-15% | Low |
| One-click "Block Top 5 Distractions" | First Site Blocked | +15-20% | Low |
| Auto-start first session after onboarding | First Session Started | +10-15% | Low |
| Shorter first session (10 min default) | First Session Completed | +5-10% | Low |
| Interactive tutorial instead of slides | Onboarding Completion | +5-10% | Medium |
| "Quick Start" option (skip to session) | Time to Activation | -30% time | Low |
| Celebration animation on first completion | First Session Completed | +3-5% | Low |
| Reminder notification at 1h post-install | First Session Started | +5-8% | Low |

### 4.4 Engagement Metrics

#### Daily/Weekly/Monthly Active Users

```typescript
// analytics/engagement-metrics.ts

interface EngagementMetrics {
  // Active user counts
  dau: number;          // Daily Active Users
  wau: number;          // Weekly Active Users
  mau: number;          // Monthly Active Users

  // Stickiness ratios
  dauWau: number;       // DAU/WAU ratio (target: 40%+)
  dauMau: number;       // DAU/MAU ratio (target: 30%+)
  wauMau: number;       // WAU/MAU ratio (target: 60%+)

  // Session metrics
  sessionsPerDayPerUser: number;    // Target: 2+
  avgSessionDuration: number;        // Minutes, target: 25 (one Pomodoro)
  totalDailyFocusMinutes: number;    // Aggregate

  // Feature engagement
  featureUsage: FeatureUsageMetrics;
}

interface FeatureUsageMetrics {
  blocklist: {
    usersWithBlocklist: number;       // % of MAU
    avgSitesBlocked: number;          // Mean sites in blocklist
    medianSitesBlocked: number;       // Median sites in blocklist
    blockAttemptPerSession: number;   // Times user tried visiting blocked site
  };
  pomodoro: {
    usersUsingPomodoro: number;       // % of MAU
    sessionsPerWeek: number;          // Average
    completionRate: number;           // % of started sessions completed
    avgDuration: number;              // Minutes
  };
  sounds: {
    usersUsingSounds: number;         // % of MAU
    mostPopularSound: string;         // Sound name
    avgDurationWithSound: number;     // Session length with sound enabled
  };
  nuclearMode: {
    usersUsingNuclear: number;        // % of MAU
    activationsPerWeek: number;       // Average
    avgNuclearDuration: number;       // Minutes
  };
  focusScore: {
    avgScore: number;                 // Mean across all users
    medianScore: number;              // Median
    scoreDistribution: number[];      // Histogram buckets (0-10, 10-20, ..., 90-100)
  };
  streaks: {
    avgStreakLength: number;          // Mean current streak in days
    medianStreakLength: number;       // Median
    streakDistribution: Record<string, number>;  // e.g., "1-3": 40%, "4-7": 25%, ...
    usersWithActiveStreak: number;    // % of MAU
  };
}
```

#### Engagement Targets

| Metric | Month 1 | Month 3 | Month 6 | Month 12 |
|--------|---------|---------|---------|----------|
| DAU | 150 | 500 | 1,500 | 4,000 |
| WAU | 400 | 1,200 | 3,500 | 10,000 |
| MAU | 600 | 2,000 | 6,000 | 18,000 |
| DAU/MAU | 25% | 25% | 25% | 22% |
| Sessions/day/user | 1.5 | 1.8 | 2.0 | 2.2 |
| Avg session duration | 22 min | 24 min | 25 min | 25 min |
| Blocklist usage | 85% | 88% | 90% | 90% |
| Pomodoro usage | 60% | 65% | 70% | 72% |
| Sound usage | 30% | 35% | 40% | 45% |
| Nuclear Mode usage | 10% | 12% | 15% | 15% |
| Avg Focus Score | 55 | 60 | 65 | 68 |
| Active streak | 40% | 45% | 50% | 55% |

#### Stickiness Analysis

```
DAU/MAU Stickiness Benchmarks (Chrome Extensions):

Poor:     <10%  — Users install but rarely return
Below Avg: 10-20% — Casual usage, low habit formation
Average:   20-30% — Regular usage, some habit formation
Good:      30-40% — Strong daily habit
Excellent: >40%  — Core utility, indispensable

Focus Mode Target: 30%+ (Good to Excellent)
Rationale: Focus/productivity is a daily need for our target personas.
Users who build a focus habit use it 5+ days per week.
```

### 4.5 Retention Metrics

#### Retention Rate Definitions

```typescript
// analytics/retention-tracker.ts

class RetentionTracker {
  /**
   * Calculate N-day retention rate.
   *
   * Definition: Of users who installed on day X,
   * what % had at least 1 session on day X+N?
   *
   * "Session" = opened the extension popup OR completed a focus session
   * (not just having the extension installed).
   */
  async calculateRetention(
    installCohortDate: string,
    retentionDay: number
  ): Promise<number> {
    const cohortUsers = await this.getUsersInstalledOn(installCohortDate);
    const targetDate = this.addDays(installCohortDate, retentionDay);
    const activeOnTargetDate = await this.getUsersActiveOn(
      cohortUsers,
      targetDate
    );

    return cohortUsers.length > 0
      ? activeOnTargetDate.length / cohortUsers.length
      : 0;
  }

  /**
   * Calculate rolling retention (also called "unbounded retention").
   * Of users who installed on day X, what % were active on day X+N OR LATER?
   * This is more forgiving and shows users who eventually come back.
   */
  async calculateRollingRetention(
    installCohortDate: string,
    retentionDay: number
  ): Promise<number> {
    const cohortUsers = await this.getUsersInstalledOn(installCohortDate);
    const targetDate = this.addDays(installCohortDate, retentionDay);
    const activeOnOrAfter = await this.getUsersActiveOnOrAfter(
      cohortUsers,
      targetDate
    );

    return cohortUsers.length > 0
      ? activeOnOrAfter.length / cohortUsers.length
      : 0;
  }

  private addDays(dateStr: string, days: number): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  private async getUsersInstalledOn(
    date: string
  ): Promise<string[]> {
    // Query server-side analytics (Pro users only)
    // For free users, this is estimated from CWS install data
    return [];
  }

  private async getUsersActiveOn(
    userIds: string[],
    date: string
  ): Promise<string[]> {
    return [];
  }

  private async getUsersActiveOnOrAfter(
    userIds: string[],
    date: string
  ): Promise<string[]> {
    return [];
  }
}
```

#### Retention Targets

| Retention Period | Target | Industry Benchmark | Alert Threshold |
|-----------------|--------|-------------------|----------------|
| Day 1 | 55% | 40-50% | <40% |
| Day 3 | 40% | 30-35% | <28% |
| Day 7 | 32% | 22-28% | <20% |
| Day 14 | 25% | 18-22% | <15% |
| Day 30 | 20% | 12-18% | <10% |
| Day 60 | 16% | 8-14% | <7% |
| Day 90 | 13% | 6-12% | <5% |

#### Retention Curve Visualization

```
Retention %
100│ *
   │
 80│  *
   │
 60│   *
   │    *
 40│     *
   │      * *
 30│         * *
   │            * * *
 20│                  * * * * *
   │                            * * * * * * *
 13│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ * * * * * ← TARGET plateau
 10│
   │
  0├──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──→
   0  1  3  7  14 21 30 45 60 75 90    Days Since Install

Legend:
* = Target retention curve
Goal: Flatten at 13%+ after day 90 (stable core users)
```

#### Uninstall Tracking

```typescript
// background/uninstall-tracker.ts

class UninstallTracker {
  /**
   * Set up uninstall URL to capture feedback.
   * Called once during extension initialization.
   *
   * NOTE: This is the ONLY way to get data from uninstalling users.
   * The URL must be set before uninstall happens.
   * CWS does not provide uninstall reason data.
   */
  static setupUninstallUrl(): void {
    const params = new URLSearchParams({
      utm_source: 'extension',
      utm_medium: 'uninstall',
      // Include anonymous usage stats for segmentation
      // No PII — just aggregate counts
    });

    chrome.runtime.setUninstallURL(
      `https://zovo.app/feedback/uninstall?${params.toString()}`
    );
  }
}
```

#### Uninstall Survey Page

```
URL: zovo.app/feedback/uninstall

┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  We're sorry to see you go!                                  │
│                                                              │
│  Help us improve Focus Mode by telling us why you            │
│  uninstalled (pick all that apply):                          │
│                                                              │
│  ○ Didn't find it useful                                     │
│  ○ Too many interruptions/notifications                      │
│  ○ Too difficult to set up                                   │
│  ○ Slowed down my browser                                    │
│  ○ Found a better alternative                                │
│  ○ Only needed it temporarily                                │
│  ○ Too expensive (wanted Pro features for free)              │
│  ○ Privacy concerns                                          │
│  ○ Bugs or technical issues                                  │
│  ○ Other: [________________]                                 │
│                                                              │
│  [Submit Feedback]                                           │
│                                                              │
│  ─────────────────────────────────────────────────────────   │
│                                                              │
│  Changed your mind?                                          │
│  [Reinstall Focus Mode →]                                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

#### Resurrection Rate

```typescript
interface ResurrectionMetrics {
  /**
   * Users who were inactive for 14+ days then returned.
   * "Resurrected" users are valuable — they chose to come back.
   */
  resurrectionRate: number;           // % of churned users who return
  medianDaysBeforeReturn: number;     // How long before they come back
  resurrectionRetention: number;      // D30 retention of resurrected users
  resurrectionTrigger: string;        // What brought them back (notification, organic, etc.)
}

// Target: 8-12% resurrection rate
// Resurrected users who stay have 2x the LTV of average users
```

### 4.6 Revenue Metrics

#### Core Revenue Metrics

```typescript
// analytics/revenue-metrics.ts

interface RevenueMetrics {
  // Monthly Recurring Revenue
  mrr: number;                       // Target: $1,000+ by month 6
  mrrGrowth: number;                 // Month-over-month % change
  mrrBreakdown: {
    newMRR: number;                  // From new subscribers
    expansionMRR: number;            // From upgrades (monthly→annual, Pro→Team)
    contractionMRR: number;          // From downgrades
    churnedMRR: number;              // From cancellations
    reactivationMRR: number;         // From returning subscribers
  };

  // Annual Recurring Revenue
  arr: number;                       // MRR × 12

  // Average Revenue Per User
  arpu: number;                      // Total revenue / total users
  arppu: number;                     // Revenue / paying users only

  // Conversion rates
  freeToTrialRate: number;           // % free users who start trial
  trialToPaidRate: number;           // Target: 25%
  freeToPaidRate: number;            // Target: 2.5-4%

  // Churn
  monthlyChurnRate: number;          // Target: <5%
  monthlyChurnedUsers: number;       // Count
  monthlyChurnedMRR: number;         // Dollar amount
  netRevenueRetention: number;       // Target: >100% (expansion > churn)

  // Lifetime Value
  ltv: number;                       // Average customer lifetime value
  ltvMedian: number;                 // Median (less skewed by outliers)
  ltvByPlan: Record<string, number>; // LTV by plan type
  ltvCACRatio: number;               // Target: 3:1+
  paybackPeriodMonths: number;       // Months to recover CAC
}
```

#### MRR Growth Targets

| Month | Target MRR | Paying Users | ARPU | Key Milestone |
|-------|-----------|-------------|------|--------------|
| 1 | $50 | 10 | $5.00 | First paying users |
| 2 | $150 | 32 | $4.69 | First annual subscribers |
| 3 | $350 | 75 | $4.67 | ProductHunt launch boost |
| 4 | $550 | 120 | $4.58 | Referral program kicks in |
| 5 | $800 | 175 | $4.57 | Content marketing traction |
| 6 | $1,100 | 240 | $4.58 | $1K MRR milestone |
| 9 | $2,500 | 550 | $4.55 | Sustainable growth |
| 12 | $5,000 | 1,100 | $4.55 | $5K MRR milestone |

#### MRR Waterfall Chart

```
Month 6 MRR Waterfall:

Starting MRR (Month 5):     $800.00
                              │
+ New MRR:                   +$245.00  (49 new subscribers)
+ Expansion MRR:             +$85.00   (annual upsells, Team upgrades)
- Contraction MRR:           -$15.00   (downgrades)
- Churned MRR:               -$35.00   (cancellations)
+ Reactivation MRR:          +$20.00   (returning subscribers)
                              │
= Ending MRR (Month 6):     $1,100.00
                              │
Net New MRR:                 +$300.00  (+37.5% MoM)
```

#### Churn Analysis

```typescript
class ChurnAnalyzer {
  /**
   * Segment churned users to identify patterns and prevention opportunities.
   */
  static readonly CHURN_SEGMENTS = {
    EARLY_CHURN: {
      definition: 'Cancelled within first 30 days',
      expectedRate: '15-20% of new subscribers',
      causes: ['Did not find value', 'Impulse purchase', 'Technical issues'],
      prevention: 'Improve onboarding, first-week engagement',
    },
    FEATURE_GAP_CHURN: {
      definition: 'Cancelled citing missing features',
      expectedRate: '5-10% of churned users',
      causes: ['Missing integration', 'Competitor has X feature'],
      prevention: 'Feature request tracking, roadmap communication',
    },
    PRICE_CHURN: {
      definition: 'Cancelled citing price',
      expectedRate: '20-30% of churned users',
      causes: ['$4.99/mo feels too high', 'Budget cuts'],
      prevention: 'Annual discount offer, value demonstration',
    },
    PASSIVE_CHURN: {
      definition: 'Payment failed, did not update',
      expectedRate: '10-15% of churned users',
      causes: ['Expired card', 'Insufficient funds'],
      prevention: 'Dunning emails, card update reminders',
    },
    NATURAL_CHURN: {
      definition: 'No longer needs the product',
      expectedRate: '15-20% of churned users',
      causes: ['Built habits, no longer needs blocker', 'Changed jobs'],
      prevention: 'Limited — offer pause instead of cancel',
    },
  };

  /**
   * Calculate churn rate for a given period.
   */
  calculateChurnRate(
    startingSubscribers: number,
    endingSubscribers: number,
    newSubscribers: number
  ): number {
    const churned = startingSubscribers + newSubscribers - endingSubscribers;
    return startingSubscribers > 0
      ? churned / startingSubscribers
      : 0;
  }

  /**
   * Calculate net revenue retention.
   * >100% means expansion revenue exceeds churn revenue.
   */
  calculateNetRevenueRetention(
    startMRR: number,
    expansionMRR: number,
    contractionMRR: number,
    churnedMRR: number
  ): number {
    return startMRR > 0
      ? (startMRR + expansionMRR - contractionMRR - churnedMRR) / startMRR
      : 0;
  }
}
```

#### LTV Calculation

```typescript
class LTVCalculator {
  /**
   * Calculate Customer Lifetime Value using multiple methods.
   */

  /**
   * Method 1: Simple LTV
   * LTV = ARPU / Monthly Churn Rate
   */
  simpleLTV(arpu: number, monthlyChurnRate: number): number {
    if (monthlyChurnRate === 0) return arpu * 120; // Cap at 10 years
    return arpu / monthlyChurnRate;
  }

  /**
   * Method 2: Cohort-based LTV
   * Sum of expected revenue over time, discounted.
   */
  cohortLTV(
    monthlyRevenue: number,
    retentionCurve: number[],   // Array of retention rates by month
    discountRate: number = 0.10  // Annual discount rate
  ): number {
    const monthlyDiscount = discountRate / 12;
    let ltv = 0;

    for (let month = 0; month < retentionCurve.length; month++) {
      const discountFactor = 1 / Math.pow(1 + monthlyDiscount, month);
      ltv += monthlyRevenue * retentionCurve[month] * discountFactor;
    }

    return ltv;
  }

  /**
   * Method 3: Plan-specific LTV
   */
  planLTV(plan: string): number {
    const estimates: Record<string, number> = {
      'monthly_pro': 4.99 / 0.05,         // $99.80 (5% churn)
      'annual_pro': 2.99 * 12 * 2.5,      // $89.70 (avg 2.5 years)
      'lifetime': 49.99,                    // One-time, fixed
      'team_monthly': 3.99 * 5 / 0.03,    // $665.00 (5 users, 3% churn)
    };
    return estimates[plan] || 0;
  }
}
```

#### LTV Targets

| Plan | Monthly Revenue | Avg Lifetime | LTV | CAC Target (3:1) |
|------|----------------|-------------|-----|-----------------|
| Monthly Pro | $4.99 | 20 months | $99.80 | <$33.27 |
| Annual Pro | $2.99/mo | 30 months | $89.70 | <$29.90 |
| Lifetime | $49.99 (once) | N/A | $49.99 | <$16.66 |
| Team (5 users) | $19.95 | 33 months | $658.35 | <$219.45 |

### 4.7 Viral Metrics

#### Viral Coefficient (K-Factor)

```typescript
// analytics/viral-metrics.ts

class ViralMetrics {
  /**
   * K-Factor = average invites sent per user × conversion rate per invite
   *
   * K > 1.0 = viral growth (each user brings more than 1 new user)
   * K > 0.5 = strong viral assist (significant organic amplification)
   * K > 0.3 = meaningful viral contribution (our target)
   * K < 0.1 = minimal viral effect
   */
  calculateKFactor(
    totalUsers: number,
    invitesSent: number,
    inviteConversions: number
  ): number {
    if (totalUsers === 0) return 0;

    const invitesPerUser = invitesSent / totalUsers;
    const conversionRate = invitesSent > 0
      ? inviteConversions / invitesSent
      : 0;

    return invitesPerUser * conversionRate;
  }

  /**
   * Viral cycle time: how long for one viral loop to complete.
   * Shorter cycle time = faster viral growth.
   */
  calculateViralCycleTime(
    inviteSentTimestamps: number[],
    inviteConversionTimestamps: number[]
  ): number {
    if (inviteSentTimestamps.length === 0) return Infinity;

    // Median time from invite sent to invite converted
    const cycleTimes: number[] = [];
    for (let i = 0; i < inviteConversionTimestamps.length; i++) {
      const sentTime = inviteSentTimestamps[i];
      const convertedTime = inviteConversionTimestamps[i];
      if (sentTime && convertedTime) {
        cycleTimes.push(convertedTime - sentTime);
      }
    }

    if (cycleTimes.length === 0) return Infinity;

    cycleTimes.sort((a, b) => a - b);
    const medianIndex = Math.floor(cycleTimes.length / 2);
    return cycleTimes[medianIndex] / (1000 * 60 * 60 * 24); // Days
  }
}
```

#### Viral Metric Targets

| Metric | Month 1 | Month 3 | Month 6 | Month 12 |
|--------|---------|---------|---------|----------|
| K-Factor | 0.05 | 0.15 | 0.30 | 0.40 |
| Referral rate (% who share) | 2% | 5% | 10% | 12% |
| Invite conversion rate | 8% | 12% | 15% | 18% |
| Avg invites per sharer | 2.0 | 2.5 | 3.0 | 3.5 |
| Share rate (content sharing) | 1% | 3% | 5% | 8% |
| Viral cycle time | 14 days | 10 days | 7 days | 5 days |
| NPS score | 30 | 40 | 50 | 55 |

#### NPS Tracking

```typescript
class NPSTracker {
  /**
   * Net Promoter Score survey shown to engaged users.
   *
   * Timing: After 14+ days of use AND 10+ completed sessions
   * Frequency: Max once per 90 days
   * Question: "How likely are you to recommend Focus Mode to a friend?"
   * Scale: 0-10
   *
   * NPS = % Promoters (9-10) - % Detractors (0-6)
   * Target: 50+ (Excellent)
   */
  async shouldShowNPSSurvey(): Promise<boolean> {
    const storage = await chrome.storage.local.get([
      'installDate', 'totalSessions', 'lastNPSSurvey',
      'npsSurveyDismissedPermanently',
    ]);

    if (storage.npsSurveyDismissedPermanently) return false;

    const daysSinceInstall =
      (Date.now() - (storage.installDate || Date.now()))
      / (1000 * 60 * 60 * 24);
    if (daysSinceInstall < 14) return false;

    if ((storage.totalSessions || 0) < 10) return false;

    const daysSinceLastSurvey =
      (Date.now() - (storage.lastNPSSurvey || 0))
      / (1000 * 60 * 60 * 24);
    if (daysSinceLastSurvey < 90) return false;

    return true;
  }

  calculateNPS(responses: number[]): number {
    if (responses.length === 0) return 0;

    const promoters = responses.filter(r => r >= 9).length;
    const detractors = responses.filter(r => r <= 6).length;
    const total = responses.length;

    return ((promoters - detractors) / total) * 100;
  }
}
```

### 4.8 Metrics Dashboard Specification

#### Dashboard Layout (Metabase or Grafana)

```
┌──────────────────────────────────────────────────────────────────────┐
│  FOCUS MODE GROWTH DASHBOARD                        [Last 30 Days ▼]│
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │   MAU    │  │   MRR    │  │ Conv Rate│  │  Churn   │           │
│  │  6,245   │  │ $1,142   │  │  3.2%    │  │  4.1%    │           │
│  │ +12% ▲   │  │ +18% ▲   │  │ +0.3% ▲  │  │ -0.4% ▼  │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ K-Factor │  │  NPS     │  │CWS Rating│  │ D7 Ret   │           │
│  │  0.28    │  │   48     │  │  4.7★    │  │  34%     │           │
│  │ +0.05 ▲  │  │  +3 ▲    │  │ +0.1 ▲   │  │ +2% ▲    │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
│                                                                      │
│  ────────────── INSTALL VELOCITY ──────────────                     │
│                                                                      │
│  [Line chart: Daily installs over 30 days]                          │
│  [Breakdown by source: organic, referral, paid, content]            │
│                                                                      │
│  ────────────── RETENTION CURVES ──────────────                     │
│                                                                      │
│  [Multi-line chart: Cohort retention curves, last 4 cohorts]        │
│                                                                      │
│  ────────────── MRR WATERFALL ──────────────                        │
│                                                                      │
│  [Waterfall chart: New + Expansion - Contraction - Churn]           │
│                                                                      │
│  ────────────── FUNNEL ──────────────                               │
│                                                                      │
│  [Funnel: CWS Impression → Install → Activate → Day 7 → Convert]  │
│                                                                      │
│  ────────────── FEATURE USAGE ──────────────                        │
│                                                                      │
│  [Bar chart: % MAU using each feature]                              │
│                                                                      │
│  ────────────── VIRAL LOOP ──────────────                           │
│                                                                      │
│  [Line chart: K-factor over time]                                   │
│  [Table: Top referrers and their invite counts]                     │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

#### Dashboard Data Sources

| Dashboard Section | Data Source | Update Frequency |
|------------------|-----------|-----------------|
| MAU / DAU / WAU | Server analytics (Pro opt-in) + CWS estimate | Daily |
| MRR | Stripe API | Real-time (webhook) |
| Conversion rate | Stripe + CWS installs | Daily |
| Churn | Stripe subscription events | Daily |
| K-Factor | Referral service database | Daily |
| NPS | NPS survey responses | Weekly batch |
| CWS Rating | CWS scraper | Every 6 hours |
| Install velocity | CWS developer dashboard API | Daily |
| Retention curves | Server analytics | Daily (computed nightly) |
| Feature usage | Pro user telemetry (opt-in) | Daily |
| Funnel | Combination of all sources | Daily |

---

## 5. A/B Testing Framework

### 5.1 Growth Experiment Framework

Building on the Phase 07 A/B testing infrastructure, this section defines a comprehensive
experimentation framework specifically for growth optimization in Focus Mode.

#### GrowthExperimentFramework Class

```typescript
// experiments/growth-experiment-framework.ts

interface GrowthExperiment {
  id: string;                        // Unique experiment ID (e.g., "GX-001")
  name: string;                      // Human-readable name
  hypothesis: string;                // "We believe [change] will [effect] because [reason]"
  category: ExperimentCategory;
  status: ExperimentStatus;
  variants: ExperimentVariant[];
  targetAudience: AudienceFilter;
  primaryMetric: string;             // The ONE metric that decides winner
  secondaryMetrics: string[];        // Supporting metrics to monitor
  guardrailMetrics: string[];        // Metrics that must NOT degrade
  sampleSize: number;                // Required users per variant
  minimumDuration: number;           // Minimum days to run
  startDate: string | null;
  endDate: string | null;
  significanceLevel: number;         // Default: 0.95 (95% confidence)
  minimumDetectableEffect: number;   // Default: 0.05 (5% relative change)
  results: ExperimentResults | null;
  impactScore: number;               // 1-10 estimated impact
  effortScore: number;               // 1-10 implementation effort
  iceScore: number;                  // Impact × Confidence × (1/Effort)
}

type ExperimentCategory =
  | 'onboarding'
  | 'activation'
  | 'engagement'
  | 'retention'
  | 'conversion'
  | 'referral'
  | 'pricing'
  | 'block_page'
  | 'notification';

type ExperimentStatus =
  | 'backlog'
  | 'design'
  | 'development'
  | 'staging'
  | 'running'
  | 'analyzing'
  | 'concluded'
  | 'rolled_out'
  | 'abandoned';

interface ExperimentVariant {
  id: string;                        // e.g., "control", "variant_a", "variant_b"
  name: string;                      // Human-readable
  description: string;               // What is different in this variant
  weight: number;                    // Traffic allocation (0.0 - 1.0)
  isControl: boolean;
}

interface AudienceFilter {
  plans: string[];                   // ["free", "pro", "team"]
  minDaysSinceInstall: number;       // Minimum days since install
  maxDaysSinceInstall: number;       // Maximum days since install
  minSessions: number;               // Minimum completed sessions
  countries: string[] | null;        // null = all countries
  isNewUser: boolean | null;         // null = both
  percentOfAudience: number;         // 0.0-1.0, traffic % to include in experiment
}

interface ExperimentResults {
  sampleSizePerVariant: number;
  duration: number;                  // Days run
  primaryMetricResults: VariantResult[];
  secondaryMetricResults: Record<string, VariantResult[]>;
  guardrailResults: Record<string, GuardrailResult>;
  winner: string | null;             // Variant ID or null if inconclusive
  statisticalSignificance: number;   // p-value
  confidenceInterval: [number, number]; // 95% CI
  recommendation: string;            // "Roll out variant_a" | "Keep control" | "Extend test"
}

interface VariantResult {
  variantId: string;
  sampleSize: number;
  metricValue: number;
  confidenceInterval: [number, number];
  relativeChange: number;            // vs control (e.g., +12.3%)
  pValue: number;
  isSignificant: boolean;
}

interface GuardrailResult {
  metricName: string;
  controlValue: number;
  variantValue: number;
  degraded: boolean;                 // true if variant is WORSE than threshold
  threshold: number;                 // Max acceptable degradation
}

class GrowthExperimentFramework {
  private experiments: Map<string, GrowthExperiment> = new Map();

  /**
   * Deterministic user assignment using hash-based bucketing.
   * Ensures the same user always sees the same variant.
   * Does NOT use Math.random() — reproducible across sessions.
   */
  assignVariant(
    userId: string,
    experimentId: string,
    variants: ExperimentVariant[]
  ): ExperimentVariant {
    const hash = this.deterministicHash(`${userId}:${experimentId}`);
    const bucket = (hash % 10000) / 10000; // 0.0000 - 0.9999

    let cumulativeWeight = 0;
    for (const variant of variants) {
      cumulativeWeight += variant.weight;
      if (bucket < cumulativeWeight) {
        return variant;
      }
    }

    // Fallback to last variant (should not reach here with valid weights)
    return variants[variants.length - 1];
  }

  /**
   * Simple deterministic hash function.
   * FNV-1a hash — fast, good distribution, no crypto needed.
   */
  private deterministicHash(input: string): number {
    let hash = 2166136261; // FNV offset basis
    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = (hash * 16777619) >>> 0; // FNV prime, unsigned
    }
    return hash;
  }

  /**
   * Calculate statistical significance using a two-proportion z-test.
   * Returns p-value.
   */
  calculateSignificance(
    controlConversions: number,
    controlSampleSize: number,
    variantConversions: number,
    variantSampleSize: number
  ): number {
    const p1 = controlConversions / controlSampleSize;
    const p2 = variantConversions / variantSampleSize;
    const pPooled = (controlConversions + variantConversions)
      / (controlSampleSize + variantSampleSize);
    const se = Math.sqrt(
      pPooled * (1 - pPooled)
      * (1 / controlSampleSize + 1 / variantSampleSize)
    );

    if (se === 0) return 1; // No variance, no significance

    const z = Math.abs(p1 - p2) / se;

    // Approximate p-value from z-score (two-tailed)
    return 2 * (1 - this.normalCDF(z));
  }

  /**
   * Approximate the cumulative distribution function for the standard
   * normal distribution. Uses the Abramowitz & Stegun approximation.
   */
  private normalCDF(x: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.SQRT2;

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0
      - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1)
      * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
  }

  /**
   * Calculate minimum sample size needed for an experiment.
   *
   * Based on:
   * - Baseline conversion rate
   * - Minimum detectable effect (relative)
   * - Significance level (alpha, default 0.05)
   * - Power (1-beta, default 0.80)
   */
  calculateMinSampleSize(
    baselineRate: number,
    minimumDetectableEffect: number,
    alpha: number = 0.05,
    power: number = 0.80
  ): number {
    const p1 = baselineRate;
    const p2 = baselineRate * (1 + minimumDetectableEffect);

    const zAlpha = 1.96;  // for alpha = 0.05 (two-tailed)
    const zBeta = 0.84;   // for power = 0.80

    const pBar = (p1 + p2) / 2;
    const numerator = Math.pow(
      zAlpha * Math.sqrt(2 * pBar * (1 - pBar))
      + zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)),
      2
    );
    const denominator = Math.pow(p1 - p2, 2);

    return Math.ceil(numerator / denominator);
  }

  /**
   * Check if an experiment has reached statistical significance.
   */
  checkExperimentCompletion(
    experiment: GrowthExperiment,
    results: VariantResult[]
  ): ExperimentDecision {
    const control = results.find(
      r => r.variantId === 'control'
    );
    if (!control) {
      return { decision: 'error', reason: 'No control variant found' };
    }

    // Check if minimum duration has passed
    const daysSinceStart = experiment.startDate
      ? (Date.now() - new Date(experiment.startDate).getTime())
        / (1000 * 60 * 60 * 24)
      : 0;

    if (daysSinceStart < experiment.minimumDuration) {
      return {
        decision: 'continue',
        reason: `Minimum duration not met `
          + `(${Math.floor(daysSinceStart)}/${experiment.minimumDuration} days)`,
      };
    }

    // Check sample size
    const minSample = experiment.sampleSize;
    if (control.sampleSize < minSample) {
      return {
        decision: 'continue',
        reason: `Insufficient sample size `
          + `(${control.sampleSize}/${minSample})`,
      };
    }

    // Check for winner
    const bestVariant = results
      .filter(r => r.variantId !== 'control')
      .sort((a, b) => b.relativeChange - a.relativeChange)[0];

    if (!bestVariant) {
      return { decision: 'inconclusive', reason: 'No variant results' };
    }

    if (bestVariant.isSignificant && bestVariant.relativeChange > 0) {
      return {
        decision: 'winner',
        reason: `${bestVariant.variantId} is statistically significant `
          + `winner with ${(bestVariant.relativeChange * 100).toFixed(1)}% `
          + `improvement (p=${bestVariant.pValue.toFixed(4)})`,
        winner: bestVariant.variantId,
      };
    }

    if (bestVariant.isSignificant && bestVariant.relativeChange < 0) {
      return {
        decision: 'loser',
        reason: `All variants are worse than control. `
          + `Keep control.`,
      };
    }

    // Not significant yet — check if we should extend or abandon
    if (daysSinceStart > experiment.minimumDuration * 2) {
      return {
        decision: 'inconclusive',
        reason: 'Extended run with no significance. '
          + 'Consider abandoning or redesigning.',
      };
    }

    return {
      decision: 'continue',
      reason: 'Not yet statistically significant. Continue running.',
    };
  }
}

interface ExperimentDecision {
  decision: 'winner' | 'loser' | 'continue' | 'inconclusive' | 'error';
  reason: string;
  winner?: string;
}
```

### 5.2 Growth Experiment Backlog

Experiments are prioritized using the ICE scoring framework:
- **Impact** (1-10): How much will this move the target metric?
- **Confidence** (1-10): How sure are we this will work?
- **Ease** (1-10): How easy is this to implement?
- **ICE Score** = (Impact + Confidence + Ease) / 3

#### Experiment Backlog Table

| ID | Experiment | Category | Primary Metric | Impact | Confidence | Ease | ICE | Priority |
|----|-----------|----------|---------------|--------|-----------|------|-----|----------|
| GX-001 | Onboarding: 5 slides vs 3 slides | onboarding | Onboarding completion rate | 7 | 6 | 8 | 7.0 | P0 |
| GX-002 | Onboarding: Interactive tutorial vs slides | onboarding | Activation rate | 8 | 5 | 4 | 5.7 | P1 |
| GX-003 | Referral prompt: after 1st session vs milestone | referral | Referral rate | 8 | 5 | 7 | 6.7 | P0 |
| GX-004 | Referral prompt: after weekly report | referral | Referral rate | 7 | 6 | 8 | 7.0 | P0 |
| GX-005 | Pricing display: monthly-first vs annual-first | pricing | Annual plan adoption | 6 | 7 | 9 | 7.3 | P0 |
| GX-006 | Pricing: start-free CTA vs direct pricing | conversion | Free-to-paid conversion | 7 | 5 | 8 | 6.7 | P0 |
| GX-007 | Upgrade prompt: banner vs modal | conversion | Upgrade click rate | 6 | 6 | 9 | 7.0 | P1 |
| GX-008 | Upgrade prompt: inline vs email-only | conversion | Upgrade click rate | 5 | 5 | 7 | 5.7 | P2 |
| GX-009 | Social proof: user count vs testimonials | conversion | Paywall conversion rate | 5 | 6 | 9 | 6.7 | P1 |
| GX-010 | Social proof: recent signups ticker vs none | conversion | CWS install rate | 4 | 4 | 8 | 5.3 | P2 |
| GX-011 | Block page: minimal vs gamified | engagement | Session completion rate | 7 | 5 | 5 | 5.7 | P1 |
| GX-012 | Block page: motivational quotes vs stats | engagement | Block page bounce rate | 5 | 5 | 8 | 6.0 | P1 |
| GX-013 | Focus Score: always visible vs session-end | engagement | DAU/MAU stickiness | 6 | 4 | 7 | 5.7 | P2 |
| GX-014 | Nuclear Mode: "extreme" vs "commitment" framing | engagement | Nuclear Mode adoption | 4 | 5 | 9 | 6.0 | P2 |
| GX-015 | First session: 25 min vs 15 min default | activation | First session completion | 7 | 7 | 9 | 7.7 | P0 |
| GX-016 | Paywall T1: 50% blur vs 70% blur | conversion | T1 conversion rate | 6 | 6 | 9 | 7.0 | P1 |
| GX-017 | Streak notification: 8 AM vs 9 AM vs custom | retention | Streak maintenance rate | 5 | 5 | 7 | 5.7 | P2 |
| GX-018 | Referral reward: 7 days Pro vs 14 days Pro | referral | Referral conversion rate | 7 | 6 | 8 | 7.0 | P0 |
| GX-019 | Cross-promo: card layout vs list layout | cross_promo | Cross-promo CTR | 3 | 5 | 8 | 5.3 | P3 |
| GX-020 | Uninstall survey: 5 options vs 10 options | retention | Survey completion rate | 3 | 6 | 9 | 6.0 | P3 |

### 5.3 Detailed Experiment Designs

#### GX-001: Onboarding Length (5 Slides vs 3 Slides)

```typescript
const GX001: GrowthExperiment = {
  id: 'GX-001',
  name: 'Onboarding Slide Count',
  hypothesis: 'We believe reducing onboarding from 5 slides to 3 slides '
    + 'will increase completion rate by 15%+ because shorter flows have '
    + 'less drop-off, while still covering the essential setup steps.',
  category: 'onboarding',
  status: 'backlog',
  variants: [
    {
      id: 'control',
      name: '5-Slide Onboarding (Current)',
      description: 'Welcome → Block Sites → Focus Style → Focus Score → Start Session',
      weight: 0.5,
      isControl: true,
    },
    {
      id: 'variant_a',
      name: '3-Slide Onboarding',
      description: 'Welcome + Block Sites → Focus Style + Score → Start Session',
      weight: 0.5,
      isControl: false,
    },
  ],
  targetAudience: {
    plans: ['free'],
    minDaysSinceInstall: 0,
    maxDaysSinceInstall: 0,  // New installs only
    minSessions: 0,
    countries: null,
    isNewUser: true,
    percentOfAudience: 1.0,
  },
  primaryMetric: 'onboarding_completion_rate',
  secondaryMetrics: [
    'time_to_first_session',
    'first_session_completion_rate',
    'day7_retention',
  ],
  guardrailMetrics: [
    'first_site_blocked_rate',  // Must not drop >5%
    'day1_retention',           // Must not drop >3%
  ],
  sampleSize: 500,    // Per variant
  minimumDuration: 14, // Days
  startDate: null,
  endDate: null,
  significanceLevel: 0.95,
  minimumDetectableEffect: 0.10,  // 10% relative improvement
  results: null,
  impactScore: 7,
  effortScore: 3,
  iceScore: 7.0,
};
```

#### GX-003: Referral Prompt Timing

```typescript
const GX003: GrowthExperiment = {
  id: 'GX-003',
  name: 'Referral Prompt Timing',
  hypothesis: 'We believe showing the referral prompt after the first '
    + 'streak milestone (3-day streak) will generate 20%+ more referrals '
    + 'than showing it after the first session, because users are more '
    + 'invested and have experienced the "aha moment" of building a streak.',
  category: 'referral',
  status: 'backlog',
  variants: [
    {
      id: 'control',
      name: 'After First Session',
      description: 'Show referral prompt immediately after first completed session',
      weight: 0.33,
      isControl: true,
    },
    {
      id: 'variant_a',
      name: 'After 3-Day Streak',
      description: 'Show referral prompt when user hits 3-day streak milestone',
      weight: 0.33,
      isControl: false,
    },
    {
      id: 'variant_b',
      name: 'After Weekly Report',
      description: 'Show referral prompt at the bottom of the first weekly report',
      weight: 0.34,
      isControl: false,
    },
  ],
  targetAudience: {
    plans: ['free', 'pro'],
    minDaysSinceInstall: 0,
    maxDaysSinceInstall: 30,
    minSessions: 1,
    countries: null,
    isNewUser: null,
    percentOfAudience: 1.0,
  },
  primaryMetric: 'referral_share_rate',
  secondaryMetrics: [
    'referral_link_clicks',
    'referral_installs',
    'referral_k_factor_contribution',
  ],
  guardrailMetrics: [
    'nps_score',           // Must not drop >5 points
    'uninstall_rate',      // Must not increase >1%
  ],
  sampleSize: 800,
  minimumDuration: 21,
  startDate: null,
  endDate: null,
  significanceLevel: 0.95,
  minimumDetectableEffect: 0.15,
  results: null,
  impactScore: 8,
  effortScore: 4,
  iceScore: 6.7,
};
```

#### GX-005: Pricing Display Order

```typescript
const GX005: GrowthExperiment = {
  id: 'GX-005',
  name: 'Pricing Display Order',
  hypothesis: 'We believe showing the annual plan first (with monthly '
    + 'as secondary) will increase annual plan adoption by 25%+ and '
    + 'increase overall LTV, because the lower per-month price anchors '
    + 'perceived value and the annual savings feel immediate.',
  category: 'pricing',
  status: 'backlog',
  variants: [
    {
      id: 'control',
      name: 'Monthly First',
      description: '$4.99/mo prominently, annual as "save 40%" below',
      weight: 0.5,
      isControl: true,
    },
    {
      id: 'variant_a',
      name: 'Annual First',
      description: '$2.99/mo (billed annually) prominently, monthly as alternative',
      weight: 0.5,
      isControl: false,
    },
  ],
  targetAudience: {
    plans: ['free'],
    minDaysSinceInstall: 1,
    maxDaysSinceInstall: 365,
    minSessions: 3,
    countries: null,
    isNewUser: null,
    percentOfAudience: 1.0,
  },
  primaryMetric: 'annual_plan_adoption_rate',
  secondaryMetrics: [
    'overall_conversion_rate',
    'average_order_value',
    'estimated_ltv',
  ],
  guardrailMetrics: [
    'total_conversion_rate',    // Must not drop >1%
    'checkout_abandonment',     // Must not increase >5%
  ],
  sampleSize: 1000,
  minimumDuration: 28,
  startDate: null,
  endDate: null,
  significanceLevel: 0.95,
  minimumDetectableEffect: 0.15,
  results: null,
  impactScore: 6,
  effortScore: 2,
  iceScore: 7.3,
};
```

#### GX-015: First Session Default Duration

```typescript
const GX015: GrowthExperiment = {
  id: 'GX-015',
  name: 'First Session Default Duration',
  hypothesis: 'We believe defaulting the first focus session to 15 minutes '
    + 'instead of 25 minutes will increase first-session completion rate by '
    + '20%+ because new users have not yet built focus stamina and a shorter '
    + 'session feels more achievable. Subsequent sessions default to 25 min.',
  category: 'activation',
  status: 'backlog',
  variants: [
    {
      id: 'control',
      name: '25-Minute First Session',
      description: 'Standard 25-minute Pomodoro for all sessions including first',
      weight: 0.5,
      isControl: true,
    },
    {
      id: 'variant_a',
      name: '15-Minute First Session',
      description: 'First session defaults to 15 min, then 25 min for subsequent',
      weight: 0.5,
      isControl: false,
    },
  ],
  targetAudience: {
    plans: ['free'],
    minDaysSinceInstall: 0,
    maxDaysSinceInstall: 0,
    minSessions: 0,
    countries: null,
    isNewUser: true,
    percentOfAudience: 1.0,
  },
  primaryMetric: 'first_session_completion_rate',
  secondaryMetrics: [
    'second_session_start_rate',
    'day1_retention',
    'day7_retention',
    'sessions_in_first_week',
  ],
  guardrailMetrics: [
    'avg_daily_focus_minutes',  // Must not drop >10%
  ],
  sampleSize: 400,
  minimumDuration: 14,
  startDate: null,
  endDate: null,
  significanceLevel: 0.95,
  minimumDetectableEffect: 0.10,
  results: null,
  impactScore: 7,
  effortScore: 2,
  iceScore: 7.7,
};
```

### 5.4 Experiment Execution Timeline

Building on the Phase 07 12-week test roadmap, here is the growth experiment sequence:

| Weeks | Experiment | Category | Duration | Dependencies |
|-------|-----------|----------|----------|-------------|
| 1-3 | GX-015: First session duration | Activation | 14 days | None |
| 1-3 | GX-005: Pricing display order | Pricing | 28 days | None (parallel) |
| 3-5 | GX-001: Onboarding length | Onboarding | 14 days | None |
| 5-8 | GX-003: Referral prompt timing | Referral | 21 days | Referral system built |
| 5-8 | GX-018: Referral reward amount | Referral | 21 days | Parallel with GX-003 |
| 8-10 | GX-007: Upgrade prompt style | Conversion | 14 days | None |
| 8-10 | GX-016: Paywall blur level | Conversion | 14 days | Parallel with GX-007 |
| 10-12 | GX-011: Block page design | Engagement | 14 days | None |
| 10-12 | GX-009: Social proof type | Conversion | 14 days | Parallel with GX-011 |
| 13-16 | GX-014: Nuclear Mode framing | Engagement | 14 days | None |
| 13-16 | GX-013: Focus Score visibility | Engagement | 14 days | Parallel |
| 17-20 | GX-002: Interactive onboarding | Onboarding | 21 days | GX-001 results |

**Rules for parallel experiments:**
- Two experiments can run in parallel ONLY if they target different user segments
  or different product surfaces
- Never run two experiments that affect the same metric simultaneously
- Assign non-overlapping user segments using the hash-based bucketing system

### 5.5 Experiment Documentation Template

Every experiment must be documented before, during, and after execution:

```markdown
# Experiment: [GX-XXX] [Name]

## Pre-Experiment

### Hypothesis
We believe [change] will [effect] for [audience] because [reason].

### Design
- **Variants:** [List of variants with descriptions]
- **Primary metric:** [Metric name and current baseline]
- **Secondary metrics:** [List]
- **Guardrail metrics:** [List with thresholds]
- **Sample size:** [Per variant] (calculated with [parameters])
- **Duration:** [Minimum days]
- **Target audience:** [Description and filters]

### Implementation Notes
- [Technical details of the change]
- [Any feature flags or config changes needed]
- [QA verification steps]

## During Experiment

### Daily Check-In Log
| Date | Control N | Variant N | Control Rate | Variant Rate | Notes |
|------|----------|----------|-------------|-------------|-------|
| Day 1 | ... | ... | ... | ... | ... |

### Guardrail Checks
| Date | Guardrail Metric | Status | Notes |
|------|-----------------|--------|-------|
| ... | ... | OK/ALERT | ... |

## Post-Experiment

### Results
- **Winner:** [Variant ID or "No winner"]
- **Primary metric lift:** [X% ± CI]
- **Statistical significance:** [p-value]
- **Sample size achieved:** [N per variant]
- **Duration:** [X days]

### Secondary Metrics
| Metric | Control | Variant | Change | Significant? |
|--------|---------|---------|--------|-------------|
| ... | ... | ... | ... | ... |

### Guardrail Metrics
| Metric | Control | Variant | Degraded? |
|--------|---------|---------|-----------|
| ... | ... | ... | ... |

### Decision
- [ ] Roll out winner to 100%
- [ ] Keep control (no change)
- [ ] Extend experiment (insufficient data)
- [ ] Redesign and re-run
- [ ] Abandon (low impact)

### Learnings
- [What did we learn?]
- [What was surprising?]
- [What should we test next based on these results?]

### Follow-Up Experiments
- [GX-XXX: Description of follow-up test]
```

---

## 6. Cohort Analysis

### 6.1 Cohort Definitions

Cohort analysis segments users into groups based on shared characteristics, then
tracks their behavior over time. This reveals how different user groups retain,
convert, and engage — and whether the product is improving for new users.

#### Cohort Types for Focus Mode

```typescript
// analytics/cohort-analysis.ts

enum CohortType {
  // Time-based cohorts
  INSTALL_WEEK = 'install_week',       // Grouped by week of install
  INSTALL_MONTH = 'install_month',     // Grouped by month of install

  // Acquisition source cohorts
  SOURCE_CWS_ORGANIC = 'source_cws',   // CWS search/browse
  SOURCE_REFERRAL = 'source_referral',  // User referral
  SOURCE_PH_LAUNCH = 'source_ph',      // ProductHunt launch
  SOURCE_PAID = 'source_paid',         // Paid acquisition
  SOURCE_CONTENT = 'source_content',   // Blog/SEO
  SOURCE_SOCIAL = 'source_social',     // Social media

  // Onboarding behavior cohorts
  ONBOARDING_COMPLETED = 'onb_complete', // Finished all slides
  ONBOARDING_SKIPPED = 'onb_skipped',   // Skipped onboarding
  ONBOARDING_ABANDONED = 'onb_abandoned', // Started but abandoned

  // First action cohorts
  FIRST_ACTION_BLOCKLIST = 'first_blocklist', // First action: add blocked site
  FIRST_ACTION_POMODORO = 'first_pomodoro',   // First action: start Pomodoro
  FIRST_ACTION_SETTINGS = 'first_settings',   // First action: explore settings
  FIRST_ACTION_SOUNDS = 'first_sounds',       // First action: play sounds

  // Plan type cohorts
  PLAN_FREE = 'plan_free',
  PLAN_TRIAL = 'plan_trial',
  PLAN_PRO = 'plan_pro',
  PLAN_TEAM = 'plan_team',

  // Engagement level cohorts (based on first-week behavior)
  ENGAGEMENT_HIGH = 'eng_high',     // 5+ sessions in first week
  ENGAGEMENT_MEDIUM = 'eng_medium', // 2-4 sessions in first week
  ENGAGEMENT_LOW = 'eng_low',       // 1 session in first week
  ENGAGEMENT_NONE = 'eng_none',     // 0 sessions after onboarding
}

interface CohortDefinition {
  type: CohortType;
  name: string;
  description: string;
  filter: (user: UserProfile) => boolean;
}

interface UserProfile {
  userId: string;
  installDate: string;
  installSource: string;
  onboardingStatus: 'completed' | 'skipped' | 'abandoned';
  firstAction: string;
  plan: string;
  firstWeekSessions: number;
  totalSessions: number;
  lastActiveDate: string;
  focusScore: number;
  streakDays: number;
  referralCount: number;
  isPaying: boolean;
}
```

### 6.2 Retention Curve Calculation

```typescript
class CohortRetentionCalculator {
  /**
   * Calculate retention curve for a specific cohort.
   *
   * Returns an array where index N = retention rate on day N.
   * retention[0] = 100% (install day)
   * retention[1] = Day 1 retention
   * retention[7] = Day 7 retention
   * ...
   */
  async calculateRetentionCurve(
    cohort: CohortDefinition,
    maxDays: number = 90
  ): Promise<RetentionCurve> {
    const cohortUsers = await this.getCohortUsers(cohort);
    const totalCohortSize = cohortUsers.length;

    if (totalCohortSize === 0) {
      return {
        cohort: cohort.type,
        cohortSize: 0,
        curve: [],
        medianLifespan: 0,
      };
    }

    const curve: number[] = [1.0]; // Day 0 = 100%

    for (let day = 1; day <= maxDays; day++) {
      const activeOnDay = cohortUsers.filter(
        user => this.wasActiveOnDay(user, day)
      ).length;
      curve.push(activeOnDay / totalCohortSize);
    }

    // Find median lifespan (day where retention drops below 50%)
    const medianLifespan = curve.findIndex(r => r < 0.5);

    return {
      cohort: cohort.type,
      cohortSize: totalCohortSize,
      curve,
      medianLifespan: medianLifespan === -1 ? maxDays : medianLifespan,
    };
  }

  private wasActiveOnDay(user: UserProfile, dayOffset: number): boolean {
    // Check if user had any activity on installDate + dayOffset
    // Implementation depends on event storage
    return false; // placeholder
  }

  private async getCohortUsers(
    cohort: CohortDefinition
  ): Promise<UserProfile[]> {
    // Query analytics storage for users matching cohort filter
    return []; // placeholder
  }
}

interface RetentionCurve {
  cohort: CohortType | string;
  cohortSize: number;
  curve: number[];          // Index = day, value = retention rate (0.0-1.0)
  medianLifespan: number;   // Days until 50% retention
}
```

### 6.3 Cohort Comparison Framework

```typescript
class CohortComparison {
  /**
   * Compare two cohorts across key metrics.
   * Helps identify what makes one cohort better than another.
   */
  async compareCohorts(
    cohortA: CohortDefinition,
    cohortB: CohortDefinition
  ): Promise<CohortComparisonResult> {
    const retentionA = await this.retentionCalc.calculateRetentionCurve(cohortA);
    const retentionB = await this.retentionCalc.calculateRetentionCurve(cohortB);

    return {
      cohortA: {
        type: cohortA.type,
        size: retentionA.cohortSize,
        day1Retention: retentionA.curve[1] || 0,
        day7Retention: retentionA.curve[7] || 0,
        day30Retention: retentionA.curve[30] || 0,
        medianLifespan: retentionA.medianLifespan,
        proConversionRate: await this.getConversionRate(cohortA),
        avgFocusScore: await this.getAvgFocusScore(cohortA),
        avgSessionsPerWeek: await this.getAvgSessionsPerWeek(cohortA),
        referralRate: await this.getReferralRate(cohortA),
      },
      cohortB: {
        type: cohortB.type,
        size: retentionB.cohortSize,
        day1Retention: retentionB.curve[1] || 0,
        day7Retention: retentionB.curve[7] || 0,
        day30Retention: retentionB.curve[30] || 0,
        medianLifespan: retentionB.medianLifespan,
        proConversionRate: await this.getConversionRate(cohortB),
        avgFocusScore: await this.getAvgFocusScore(cohortB),
        avgSessionsPerWeek: await this.getAvgSessionsPerWeek(cohortB),
        referralRate: await this.getReferralRate(cohortB),
      },
      significantDifferences: [], // Metrics where difference is statistically significant
    };
  }

  private retentionCalc = new CohortRetentionCalculator();

  private async getConversionRate(
    cohort: CohortDefinition
  ): Promise<number> {
    return 0; // placeholder
  }

  private async getAvgFocusScore(
    cohort: CohortDefinition
  ): Promise<number> {
    return 0; // placeholder
  }

  private async getAvgSessionsPerWeek(
    cohort: CohortDefinition
  ): Promise<number> {
    return 0; // placeholder
  }

  private async getReferralRate(
    cohort: CohortDefinition
  ): Promise<number> {
    return 0; // placeholder
  }
}

interface CohortComparisonResult {
  cohortA: CohortMetricSummary;
  cohortB: CohortMetricSummary;
  significantDifferences: string[];
}

interface CohortMetricSummary {
  type: CohortType;
  size: number;
  day1Retention: number;
  day7Retention: number;
  day30Retention: number;
  medianLifespan: number;
  proConversionRate: number;
  avgFocusScore: number;
  avgSessionsPerWeek: number;
  referralRate: number;
}
```

### 6.4 Retention Heatmap

```
                    RETENTION HEATMAP BY INSTALL WEEK
                    (Green = high retention, Red = low)

              Day 1   Day 3   Day 7   Day 14  Day 30  Day 60  Day 90
            ┌───────┬───────┬───────┬───────┬───────┬───────┬───────┐
Week 1      │ 48%   │ 32%   │ 24%   │ 18%   │ 12%   │ 8%    │ 6%   │
(Baseline)  │ ████  │ ███   │ ██    │ ██    │ █     │ █     │ █    │
            ├───────┼───────┼───────┼───────┼───────┼───────┼───────┤
Week 2      │ 50%   │ 34%   │ 26%   │ 19%   │ 14%   │ 9%    │ 7%   │
(Bug fix)   │ █████ │ ███   │ ███   │ ██    │ █     │ █     │ █    │
            ├───────┼───────┼───────┼───────┼───────┼───────┼───────┤
Week 3      │ 52%   │ 36%   │ 28%   │ 21%   │ 15%   │ 10%   │ --   │
(Onboard v2)│ █████ │ ████  │ ███   │ ██    │ ██    │ █     │      │
            ├───────┼───────┼───────┼───────┼───────┼───────┼───────┤
Week 4      │ 55%   │ 40%   │ 32%   │ 25%   │ --    │ --    │ --   │
(PH Launch) │ ██████│ ████  │ ███   │ ███   │       │       │      │
            ├───────┼───────┼───────┼───────┼───────┼───────┼───────┤
Week 5      │ 53%   │ 38%   │ 30%   │ --    │ --    │ --    │ --   │
(Normal)    │ █████ │ ████  │ ███   │       │       │       │      │
            ├───────┼───────┼───────┼───────┼───────┼───────┼───────┤
Week 6      │ 56%   │ 41%   │ --    │ --    │ --    │ --    │ --   │
(Referral)  │ ██████│ ████  │       │       │       │       │      │
            └───────┴───────┴───────┴───────┴───────┴───────┴───────┘

Legend: -- = not enough time has passed for this measurement
Reading: Each row is a cohort (users who installed in that week).
         Each column shows retention at N days after install.
         Improving rows over time = product is getting better for new users.
```

### 6.5 Key Cohort Insights to Track

#### "Aha Moment" Identification

The "aha moment" is the specific action or milestone most correlated with long-term
retention. Identifying it helps focus activation efforts on driving users to that moment.

```typescript
class AhaMomentAnalyzer {
  /**
   * For each first-week action, calculate the correlation with
   * Day 30 retention. The action with highest correlation is
   * likely the "aha moment."
   *
   * Candidate aha moments for Focus Mode:
   * 1. First blocked site visit (seeing the block page work)
   * 2. Completing first full Pomodoro session
   * 3. Seeing Focus Score increase
   * 4. Hitting 3-day streak
   * 5. Blocking 3+ sites
   * 6. Using Nuclear Mode for the first time
   * 7. Receiving first weekly report
   */
  async identifyAhaMoment(): Promise<AhaMomentResult[]> {
    const candidateActions = [
      'first_block_page_seen',
      'first_pomodoro_completed',
      'focus_score_increased',
      'streak_3_days',
      'blocklist_3_plus_sites',
      'nuclear_mode_first_use',
      'weekly_report_first_viewed',
    ];

    const results: AhaMomentResult[] = [];

    for (const action of candidateActions) {
      const usersWhoDidAction = await this.getUsersWhoCompleted(
        action, 7 // within first 7 days
      );
      const usersWhoDidNot = await this.getUsersWhoDidNotComplete(
        action, 7
      );

      const retentionWithAction =
        await this.calculateDay30Retention(usersWhoDidAction);
      const retentionWithout =
        await this.calculateDay30Retention(usersWhoDidNot);

      results.push({
        action,
        retentionWithAction,
        retentionWithout,
        retentionLift: retentionWithAction - retentionWithout,
        percentWhoComplete: usersWhoDidAction.length
          / (usersWhoDidAction.length + usersWhoDidNot.length),
        correlationScore: this.calculateCorrelation(
          retentionWithAction,
          retentionWithout,
          usersWhoDidAction.length,
          usersWhoDidNot.length
        ),
      });
    }

    // Sort by retention lift (highest first)
    results.sort((a, b) => b.retentionLift - a.retentionLift);
    return results;
  }

  private calculateCorrelation(
    retWith: number,
    retWithout: number,
    nWith: number,
    nWithout: number
  ): number {
    // Phi coefficient for binary correlation
    const total = nWith + nWithout;
    const retainedWith = nWith * retWith;
    const retainedWithout = nWithout * retWithout;
    const totalRetained = retainedWith + retainedWithout;
    const totalNotRetained = total - totalRetained;

    const numerator = (retainedWith * (nWithout - retainedWithout))
      - (retainedWithout * (nWith - retainedWith));
    const denominator = Math.sqrt(
      nWith * nWithout * totalRetained * totalNotRetained
    );

    return denominator > 0 ? numerator / denominator : 0;
  }

  private async getUsersWhoCompleted(
    action: string,
    withinDays: number
  ): Promise<string[]> {
    return []; // placeholder
  }

  private async getUsersWhoDidNotComplete(
    action: string,
    withinDays: number
  ): Promise<string[]> {
    return []; // placeholder
  }

  private async calculateDay30Retention(
    userIds: string[]
  ): Promise<number> {
    return 0; // placeholder
  }
}

interface AhaMomentResult {
  action: string;
  retentionWithAction: number;
  retentionWithout: number;
  retentionLift: number;       // Absolute difference in retention
  percentWhoComplete: number;  // % of users who complete this action
  correlationScore: number;    // Phi coefficient (-1 to 1)
}
```

#### Expected Aha Moment Results (Hypothesis)

| Action | Est. D30 Retention (With) | Est. D30 Retention (Without) | Lift | % Who Complete |
|--------|--------------------------|------------------------------|------|---------------|
| First block page seen | 28% | 8% | **+20%** | 65% |
| First Pomodoro completed | 30% | 10% | **+20%** | 55% |
| 3-day streak | 38% | 12% | **+26%** | 35% |
| 3+ sites blocked | 32% | 11% | **+21%** | 50% |
| Focus Score increased | 25% | 14% | **+11%** | 45% |
| Nuclear Mode first use | 35% | 18% | **+17%** | 12% |
| Weekly report viewed | 33% | 15% | **+18%** | 40% |

**Hypothesis:** The 3-day streak is the strongest aha moment predictor, but
"first block page seen" has the highest combination of lift + completion rate,
making it the most impactful activation target.

#### Referral vs Organic Cohort Comparison

| Metric | Organic Users | Referral Users | Difference |
|--------|-------------|---------------|------------|
| Day 1 retention | 52% | 62% | +10% |
| Day 7 retention | 30% | 40% | +10% |
| Day 30 retention | 18% | 28% | +10% |
| Activation rate | 42% | 58% | +16% |
| Pro conversion rate | 3.0% | 5.2% | +2.2% |
| Avg Focus Score (D30) | 58 | 68 | +10 |
| Referral rate | 5% | 12% | +7% |
| Avg sessions/week (D30) | 4.2 | 6.1 | +1.9 |
| NPS | 42 | 58 | +16 |

**Insight:** Referred users have consistently better metrics across all dimensions.
This is because:
1. Social proof: they trust a friend's recommendation
2. Expectations: they know what the product does before installing
3. Accountability: the referrer creates social accountability
4. Better fit: referrers self-select people who would actually benefit

**Implication:** Every dollar invested in referral growth has 2-3x the ROI of
paid acquisition due to inherently higher quality users.

---

## 7. Weekly/Monthly Growth Review

### 7.1 Weekly Growth Review Checklist

Perform this review every Monday morning. Takes 30-45 minutes.

```markdown
# Weekly Growth Review — Week of [DATE]

## 1. Key Metrics Check (10 minutes)
- [ ] WAU: _____ (target: _____, change: _____%)
- [ ] New installs this week: _____ (target: _____)
- [ ] Install velocity trend: ▲ / ▼ / → (vs last week)
- [ ] Uninstalls this week: _____ (net installs: _____)
- [ ] Free-to-paid conversions: _____ (rate: _____%)
- [ ] Churned subscribers: _____ (churn rate: _____%)
- [ ] MRR: $_____ (change: +/- $_____)
- [ ] Referral links shared: _____ (referral installs: _____)
- [ ] K-factor: _____ (target: 0.30)
- [ ] CWS rating: _____ stars (_____ total reviews)

## 2. Experiment Results (5 minutes)
- [ ] Active experiments: [List]
- [ ] Any experiments reaching significance? [Y/N]
- [ ] Any guardrail alerts? [Y/N]
- [ ] Experiments to start this week: [List]
- [ ] Experiments to conclude this week: [List]

## 3. Top Acquisition Channels (5 minutes)
- [ ] #1 channel: _____ (_____ installs, _____% of total)
- [ ] #2 channel: _____ (_____ installs, _____% of total)
- [ ] #3 channel: _____ (_____ installs, _____% of total)
- [ ] Any channel underperforming? [Y/N — action item]
- [ ] Any new channel to explore? [Y/N — detail]

## 4. User Feedback Monitor (10 minutes)
- [ ] New CWS reviews this week: _____ (avg rating: _____)
- [ ] Negative reviews requiring response: [List]
- [ ] Common feature requests this week: [List]
- [ ] Bug reports: [List with severity]
- [ ] Support tickets: _____ (avg response time: _____h)

## 5. Content Performance (5 minutes)
- [ ] Blog posts published: [List]
- [ ] Top performing content: _____ (_____ views)
- [ ] Social media engagement: [Summary]
- [ ] Referral to install from content: _____ installs
- [ ] Content planned for next week: [List]

## 6. Action Items for This Week
1. [Priority action #1]
2. [Priority action #2]
3. [Priority action #3]

## 7. Wins and Learnings
- Win: [Something that went well]
- Learning: [Something we learned]
- Concern: [Something to watch]
```

### 7.2 Monthly Growth Planning Template

Perform on the first Monday of each month. Takes 2-3 hours.

```markdown
# Monthly Growth Plan — [MONTH YEAR]

## Last Month Retrospective

### Goals vs Actuals
| Metric | Goal | Actual | Hit? | Notes |
|--------|------|--------|------|-------|
| MAU | _____ | _____ | ✓/✗ | |
| New installs | _____ | _____ | ✓/✗ | |
| MRR | $_____ | $_____ | ✓/✗ | |
| Conversion rate | _____% | _____% | ✓/✗ | |
| Churn rate | <_____% | _____% | ✓/✗ | |
| K-factor | _____ | _____ | ✓/✗ | |
| NPS | _____ | _____ | ✓/✗ | |
| CWS rating | _____ | _____ | ✓/✗ | |

### What Worked
1. [Strategy/tactic that drove results]
2. [Strategy/tactic that drove results]

### What Didn't Work
1. [Strategy/tactic that underperformed]
2. [Strategy/tactic that underperformed]

### Key Learnings
1. [Insight]
2. [Insight]

---

## This Month's Goals

| Metric | Target | Stretch | Reasoning |
|--------|--------|---------|-----------|
| MAU | _____ | _____ | _____ |
| New installs | _____ | _____ | _____ |
| MRR | $_____ | $_____ | _____ |
| Conversion rate | _____% | _____% | _____ |
| Churn rate | <_____% | <_____% | _____ |
| Referral rate | _____% | _____% | _____ |
| CWS rating | _____ | _____ | _____ |

---

## Key Initiatives

### Initiative 1: [Name]
- **Owner:** [Name]
- **Timeline:** [Start — End]
- **Expected impact:** [Metric + target improvement]
- **Status:** Not Started / In Progress / Blocked
- **Dependencies:** [List]

### Initiative 2: [Name]
- **Owner:** [Name]
- **Timeline:** [Start — End]
- **Expected impact:** [Metric + target improvement]
- **Status:** Not Started / In Progress / Blocked
- **Dependencies:** [List]

### Initiative 3: [Name]
(same format)

---

## Content Calendar

| Week | Blog Post | Social Posts | Email | Other |
|------|----------|-------------|-------|-------|
| Week 1 | [Title] | [Topics x3] | [Sequence #] | [Podcast/PR] |
| Week 2 | [Title] | [Topics x3] | [Sequence #] | |
| Week 3 | [Title] | [Topics x3] | [Sequence #] | |
| Week 4 | [Title] | [Topics x3] | [Sequence #] | |

---

## Experiment Roadmap

| Week | Experiment | Metric | Expected Lift | Status |
|------|-----------|--------|--------------|--------|
| 1-2 | [GX-XXX] | [Metric] | [X%] | [Status] |
| 2-3 | [GX-XXX] | [Metric] | [X%] | [Status] |
| 3-4 | [GX-XXX] | [Metric] | [X%] | [Status] |

---

## Budget Allocation

| Channel | Budget | Expected Installs | CPI | ROI Target |
|---------|--------|------------------|-----|-----------|
| Google Ads | $_____ | _____ | $_____ | _____x |
| Social Ads | $_____ | _____ | $_____ | _____x |
| Content/SEO | $_____ | _____ | $_____ | _____x |
| Referral rewards | $_____ | _____ | $_____ | _____x |
| Tools/SaaS | $_____ | N/A | N/A | N/A |
| **Total** | **$_____** | **_____** | **$_____** | |

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| [Risk 1] | H/M/L | H/M/L | [Plan] |
| [Risk 2] | H/M/L | H/M/L | [Plan] |
```

### 7.3 Quarterly Strategy Session Framework

Perform every 3 months. Full-day session.

#### Agenda

```
QUARTERLY GROWTH STRATEGY SESSION

Duration: 4-6 hours
Attendees: Founder, growth lead, product, engineering

---

PART 1: REVIEW (90 minutes)

1.1 Quarterly Metrics Review (30 min)
    - MAU trajectory vs plan
    - MRR trajectory vs $1K target
    - Cohort retention improvements
    - Funnel conversion improvements
    - Competitive landscape changes

1.2 Experiment Portfolio Review (30 min)
    - Experiments completed and their outcomes
    - Cumulative impact of winning experiments
    - Experiments that failed and learnings
    - Experiment velocity (# per month)

1.3 Channel Performance Review (30 min)
    - CAC by channel over the quarter
    - Channel saturation assessment
    - New channel opportunities
    - Partnership results

---

PART 2: STRATEGY (120 minutes)

2.1 Product-Market Fit Assessment (30 min)
    - Sean Ellis survey results (% "very disappointed" if gone)
    - NPS trend
    - Retention curve shape
    - Qualitative feedback themes

2.2 Growth Model Update (30 min)
    - Update growth model with actual data
    - Revise projections for next quarter
    - Identify biggest leverage points
    - Resource allocation decisions

2.3 Strategic Bets (60 min)
    - 1-2 "big bet" initiatives for next quarter
    - New market segments to pursue
    - Feature investments for growth
    - Partnership strategy

---

PART 3: PLANNING (90 minutes)

3.1 OKR Setting (45 min)
    - 3-5 objectives for next quarter
    - Key results (measurable, time-bound)
    - Initiatives mapped to each KR

3.2 Experiment Roadmap (30 min)
    - Top 10 experiments for next quarter
    - Prioritization and sequencing
    - Resource requirements

3.3 Action Items and Owners (15 min)
    - Assign specific next steps
    - Set check-in cadence
```

#### Quarterly OKR Template

```
QUARTER: [Q# YEAR]

OBJECTIVE 1: Reach [X] MAU and $[Y] MRR
  KR1: Grow MAU from [current] to [target] (+X%)
  KR2: Grow MRR from $[current] to $[target] (+Y%)
  KR3: Achieve free-to-paid conversion rate of X%
  KR4: Reduce monthly churn to <X%

OBJECTIVE 2: Build a self-sustaining viral loop
  KR1: Achieve K-factor of X (from current Y)
  KR2: X% of new installs come from referrals
  KR3: Referral users have Y% Day 30 retention
  KR4: NPS score reaches X

OBJECTIVE 3: Establish Focus Mode as category leader
  KR1: Maintain 4.X+ CWS rating
  KR2: Rank top 3 for "website blocker" keyword
  KR3: Generate X blog/press mentions
  KR4: Complete X partner integrations
```

---

## 8. Growth Automation

### 8.1 Automated Alert System

Automated alerts ensure the growth team is immediately notified when critical
metrics deviate from expected ranges, enabling rapid response to problems and
opportunities.

#### Alert Configuration

```typescript
// automation/growth-alerts.ts

interface GrowthAlert {
  id: string;
  name: string;
  metric: string;
  condition: AlertCondition;
  severity: 'critical' | 'warning' | 'info';
  channels: AlertChannel[];
  cooldownHours: number;       // Min hours between repeated alerts
  enabled: boolean;
}

type AlertCondition =
  | { type: 'threshold_below'; value: number }
  | { type: 'threshold_above'; value: number }
  | { type: 'wow_change'; percentChange: number; direction: 'drop' | 'spike' }
  | { type: 'moving_average_deviation'; windowDays: number; deviationPercent: number }
  | { type: 'consecutive_days'; metric: string; condition: 'declining'; days: number };

type AlertChannel = 'email' | 'slack' | 'discord' | 'sms';

class GrowthAlertSystem {
  static readonly ALERTS: GrowthAlert[] = [
    // ── CRITICAL ALERTS ──────────────────────────────────
    {
      id: 'alert-install-velocity-drop',
      name: 'Install Velocity Drop',
      metric: 'weekly_installs',
      condition: {
        type: 'wow_change',
        percentChange: 20,
        direction: 'drop',
      },
      severity: 'critical',
      channels: ['email', 'slack'],
      cooldownHours: 24,
      enabled: true,
    },
    {
      id: 'alert-conversion-drop',
      name: 'Conversion Rate Drop',
      metric: 'free_to_paid_conversion_rate',
      condition: {
        type: 'wow_change',
        percentChange: 15,   // 0.5% absolute ≈ 15% relative at 3.2% baseline
        direction: 'drop',
      },
      severity: 'critical',
      channels: ['email', 'slack'],
      cooldownHours: 24,
      enabled: true,
    },
    {
      id: 'alert-churn-spike',
      name: 'Churn Rate Spike',
      metric: 'monthly_churn_rate',
      condition: {
        type: 'threshold_above',
        value: 0.07,  // 7% = 2% above 5% baseline
      },
      severity: 'critical',
      channels: ['email', 'slack', 'sms'],
      cooldownHours: 12,
      enabled: true,
    },
    {
      id: 'alert-cws-rating-drop',
      name: 'CWS Rating Drop',
      metric: 'cws_average_rating',
      condition: {
        type: 'threshold_below',
        value: 4.5,
      },
      severity: 'critical',
      channels: ['email', 'slack'],
      cooldownHours: 6,
      enabled: true,
    },

    // ── WARNING ALERTS ──────────────────────────────────
    {
      id: 'alert-activation-drop',
      name: 'Activation Rate Drop',
      metric: 'activation_rate',
      condition: {
        type: 'wow_change',
        percentChange: 10,
        direction: 'drop',
      },
      severity: 'warning',
      channels: ['email', 'slack'],
      cooldownHours: 48,
      enabled: true,
    },
    {
      id: 'alert-d7-retention-drop',
      name: 'Day 7 Retention Drop',
      metric: 'day7_retention',
      condition: {
        type: 'threshold_below',
        value: 0.20,  // Below 20%
      },
      severity: 'warning',
      channels: ['email', 'slack'],
      cooldownHours: 72,
      enabled: true,
    },
    {
      id: 'alert-referral-abuse',
      name: 'Referral Program Abuse Detection',
      metric: 'referral_suspicious_pattern',
      condition: {
        type: 'threshold_above',
        value: 1,  // Any suspicious pattern detected
      },
      severity: 'warning',
      channels: ['email', 'slack'],
      cooldownHours: 1,
      enabled: true,
    },
    {
      id: 'alert-mrr-stall',
      name: 'MRR Growth Stall',
      metric: 'mrr_growth_rate',
      condition: {
        type: 'consecutive_days',
        metric: 'mrr',
        condition: 'declining',
        days: 7,
      },
      severity: 'warning',
      channels: ['email'],
      cooldownHours: 168,  // 1 week
      enabled: true,
    },
    {
      id: 'alert-uninstall-spike',
      name: 'Uninstall Rate Spike',
      metric: 'daily_uninstalls',
      condition: {
        type: 'moving_average_deviation',
        windowDays: 7,
        deviationPercent: 50,  // 50% above 7-day moving average
      },
      severity: 'warning',
      channels: ['email', 'slack'],
      cooldownHours: 24,
      enabled: true,
    },

    // ── INFO ALERTS ──────────────────────────────────
    {
      id: 'alert-milestone-installs',
      name: 'Install Milestone',
      metric: 'total_installs',
      condition: {
        type: 'threshold_above',
        value: 0,  // Dynamic — set to next milestone
      },
      severity: 'info',
      channels: ['slack'],
      cooldownHours: 0,  // One-time per milestone
      enabled: true,
    },
    {
      id: 'alert-milestone-mrr',
      name: 'MRR Milestone',
      metric: 'mrr',
      condition: {
        type: 'threshold_above',
        value: 0,  // Dynamic — set to next milestone ($100, $500, $1000)
      },
      severity: 'info',
      channels: ['slack'],
      cooldownHours: 0,
      enabled: true,
    },
    {
      id: 'alert-experiment-significance',
      name: 'Experiment Reached Significance',
      metric: 'experiment_p_value',
      condition: {
        type: 'threshold_below',
        value: 0.05,
      },
      severity: 'info',
      channels: ['email', 'slack'],
      cooldownHours: 0,
      enabled: true,
    },
    {
      id: 'alert-new-5star-review',
      name: 'New 5-Star CWS Review',
      metric: 'new_review_rating',
      condition: {
        type: 'threshold_above',
        value: 4,
      },
      severity: 'info',
      channels: ['slack'],
      cooldownHours: 0,
      enabled: true,
    },
  ];

  /**
   * Evaluate all alerts against current metrics.
   */
  async evaluateAlerts(
    currentMetrics: Record<string, number>,
    previousMetrics: Record<string, number>
  ): Promise<TriggeredAlert[]> {
    const triggered: TriggeredAlert[] = [];

    for (const alert of GrowthAlertSystem.ALERTS) {
      if (!alert.enabled) continue;

      const shouldTrigger = this.evaluateCondition(
        alert.condition,
        currentMetrics[alert.metric],
        previousMetrics[alert.metric]
      );

      if (shouldTrigger && await this.checkCooldown(alert)) {
        triggered.push({
          alert,
          currentValue: currentMetrics[alert.metric],
          previousValue: previousMetrics[alert.metric],
          triggeredAt: new Date().toISOString(),
        });
      }
    }

    return triggered;
  }

  private evaluateCondition(
    condition: AlertCondition,
    current: number | undefined,
    previous: number | undefined
  ): boolean {
    if (current === undefined) return false;

    switch (condition.type) {
      case 'threshold_below':
        return current < condition.value;

      case 'threshold_above':
        return current > condition.value;

      case 'wow_change':
        if (previous === undefined || previous === 0) return false;
        const changePercent =
          ((current - previous) / previous) * 100;
        if (condition.direction === 'drop') {
          return changePercent < -condition.percentChange;
        }
        return changePercent > condition.percentChange;

      case 'moving_average_deviation':
        // Requires historical data — simplified check
        return false;

      case 'consecutive_days':
        // Requires historical data — simplified check
        return false;

      default:
        return false;
    }
  }

  private async checkCooldown(alert: GrowthAlert): Promise<boolean> {
    // Check if enough time has passed since last trigger
    // Implementation depends on storage mechanism
    return true;
  }
}

interface TriggeredAlert {
  alert: GrowthAlert;
  currentValue: number;
  previousValue: number | undefined;
  triggeredAt: string;
}
```

### 8.2 Referral Abuse Detection

```typescript
// automation/referral-abuse-detector.ts

class ReferralAbuseDetector {
  /**
   * Detect suspicious referral patterns that indicate gaming.
   *
   * Red flags:
   * 1. Same IP address for referrer and referee
   * 2. Multiple referrals from same IP in short window
   * 3. Referred users never activate (install → immediate uninstall)
   * 4. Referral velocity spike from single user
   * 5. Referred users all from same browser fingerprint
   */
  static readonly ABUSE_RULES: AbuseRule[] = [
    {
      id: 'same-ip',
      name: 'Same IP Referral',
      description: 'Referrer and referee share the same IP address',
      action: 'flag_for_review',
      autoBlock: false,
    },
    {
      id: 'rapid-referrals',
      name: 'Rapid Referral Velocity',
      description: '5+ referral installs from same referrer in 1 hour',
      action: 'temporary_block',
      autoBlock: true,
    },
    {
      id: 'ghost-referrals',
      name: 'Ghost Referral Pattern',
      description: '80%+ of referrals uninstall within 24 hours',
      action: 'flag_for_review',
      autoBlock: false,
    },
    {
      id: 'device-fingerprint',
      name: 'Same Device Referrals',
      description: 'Multiple referrals from same browser fingerprint',
      action: 'temporary_block',
      autoBlock: true,
    },
    {
      id: 'reward-farming',
      name: 'Reward Farming',
      description: 'User creates multiple accounts to refer themselves',
      action: 'permanent_block',
      autoBlock: true,
    },
  ];

  async checkForAbuse(
    referrerId: string,
    refereeId: string,
    referralMetadata: ReferralMetadata
  ): Promise<AbuseCheckResult> {
    const flags: string[] = [];

    // Check same IP
    if (referralMetadata.referrerIP === referralMetadata.refereeIP) {
      flags.push('same-ip');
    }

    // Check rapid velocity
    const recentReferrals = await this.getRecentReferrals(
      referrerId, 1 // hours
    );
    if (recentReferrals.length >= 5) {
      flags.push('rapid-referrals');
    }

    // Check ghost pattern
    const totalReferrals = await this.getTotalReferrals(referrerId);
    const uninstalledReferrals = await this.getUninstalledReferrals(
      referrerId
    );
    if (
      totalReferrals > 5 &&
      uninstalledReferrals / totalReferrals > 0.8
    ) {
      flags.push('ghost-referrals');
    }

    const shouldBlock = flags.some(
      f => ReferralAbuseDetector.ABUSE_RULES
        .find(r => r.id === f)?.autoBlock
    );

    return {
      referrerId,
      refereeId,
      flags,
      isAbusive: flags.length > 0,
      shouldBlock,
      action: shouldBlock ? 'block' : flags.length > 0 ? 'review' : 'allow',
    };
  }

  private async getRecentReferrals(
    referrerId: string,
    hours: number
  ): Promise<string[]> {
    return []; // placeholder
  }

  private async getTotalReferrals(
    referrerId: string
  ): Promise<number> {
    return 0; // placeholder
  }

  private async getUninstalledReferrals(
    referrerId: string
  ): Promise<number> {
    return 0; // placeholder
  }
}

interface ReferralMetadata {
  referrerIP: string;
  refereeIP: string;
  referrerFingerprint: string;
  refereeFingerprint: string;
  timestamp: number;
}

interface AbuseRule {
  id: string;
  name: string;
  description: string;
  action: 'flag_for_review' | 'temporary_block' | 'permanent_block';
  autoBlock: boolean;
}

interface AbuseCheckResult {
  referrerId: string;
  refereeId: string;
  flags: string[];
  isAbusive: boolean;
  shouldBlock: boolean;
  action: 'allow' | 'review' | 'block';
}
```

### 8.3 Automated Reports

#### Weekly Email Digest

```typescript
// automation/weekly-digest.ts

interface WeeklyDigest {
  period: { start: string; end: string };
  headline: string;  // "Focus Mode grew 12% this week"

  keyMetrics: {
    wau: { value: number; change: number; trend: 'up' | 'down' | 'flat' };
    newInstalls: { value: number; change: number; trend: string };
    mrr: { value: number; change: number; trend: string };
    conversionRate: { value: number; change: number; trend: string };
    churnRate: { value: number; change: number; trend: string };
    kFactor: { value: number; change: number; trend: string };
    cwsRating: { value: number; change: number; trend: string };
  };

  topEvents: string[];   // "Reached 5,000 total installs", "GX-005 reached significance"
  actionItems: string[]; // "Respond to 3 new CWS reviews", "Start GX-007 experiment"
  risks: string[];       // "Churn rate trending up for 2nd week"
}

class WeeklyDigestGenerator {
  async generate(): Promise<WeeklyDigest> {
    const current = await this.getMetricsForPeriod('this_week');
    const previous = await this.getMetricsForPeriod('last_week');

    const wauChange = this.percentChange(current.wau, previous.wau);

    return {
      period: {
        start: this.getWeekStart(),
        end: this.getWeekEnd(),
      },
      headline: this.generateHeadline(current, previous),
      keyMetrics: {
        wau: {
          value: current.wau,
          change: wauChange,
          trend: wauChange > 2 ? 'up' : wauChange < -2 ? 'down' : 'flat',
        },
        newInstalls: {
          value: current.newInstalls,
          change: this.percentChange(current.newInstalls, previous.newInstalls),
          trend: 'up',
        },
        mrr: {
          value: current.mrr,
          change: this.percentChange(current.mrr, previous.mrr),
          trend: 'up',
        },
        conversionRate: {
          value: current.conversionRate,
          change: current.conversionRate - previous.conversionRate,
          trend: 'flat',
        },
        churnRate: {
          value: current.churnRate,
          change: current.churnRate - previous.churnRate,
          trend: 'flat',
        },
        kFactor: {
          value: current.kFactor,
          change: current.kFactor - previous.kFactor,
          trend: 'up',
        },
        cwsRating: {
          value: current.cwsRating,
          change: current.cwsRating - previous.cwsRating,
          trend: 'flat',
        },
      },
      topEvents: await this.getTopEvents(),
      actionItems: await this.generateActionItems(current),
      risks: await this.identifyRisks(current, previous),
    };
  }

  private percentChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  private generateHeadline(
    current: Record<string, number>,
    previous: Record<string, number>
  ): string {
    const wauChange = this.percentChange(current.wau, previous.wau);
    if (wauChange > 10) return `Great week! Focus Mode grew ${Math.round(wauChange)}%`;
    if (wauChange > 0) return `Steady growth: Focus Mode up ${Math.round(wauChange)}%`;
    if (wauChange === 0) return 'Flat week for Focus Mode — time to experiment';
    return `Attention needed: Focus Mode down ${Math.abs(Math.round(wauChange))}%`;
  }

  private getWeekStart(): string {
    return ''; // placeholder
  }

  private getWeekEnd(): string {
    return ''; // placeholder
  }

  private async getMetricsForPeriod(
    period: string
  ): Promise<Record<string, number>> {
    return {}; // placeholder
  }

  private async getTopEvents(): Promise<string[]> {
    return []; // placeholder
  }

  private async generateActionItems(
    metrics: Record<string, number>
  ): Promise<string[]> {
    return []; // placeholder
  }

  private async identifyRisks(
    current: Record<string, number>,
    previous: Record<string, number>
  ): Promise<string[]> {
    return []; // placeholder
  }
}
```

#### Monthly Growth Report

```
┌──────────────────────────────────────────────────────────────────┐
│              FOCUS MODE MONTHLY GROWTH REPORT                    │
│              [MONTH YEAR]                                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  EXECUTIVE SUMMARY                                              │
│  [2-3 sentence summary of the month's growth performance]       │
│                                                                  │
│  ─── KEY METRICS ───────────────────────────────────────────    │
│                                                                  │
│  MAU:         [X,XXX]  (+X% MoM)                                │
│  MRR:         $[X,XXX] (+X% MoM)                                │
│  Installs:    [X,XXX]  (+X% MoM)                                │
│  Conversion:  [X.X%]   (+X.X% MoM)                              │
│  Churn:       [X.X%]   (target: <5%)                            │
│  K-Factor:    [X.XX]   (target: 0.30)                           │
│  NPS:         [XX]     (target: 50+)                            │
│  CWS Rating:  [X.X★]   (target: 4.5+)                          │
│                                                                  │
│  ─── ACQUISITION ───────────────────────────────────────────    │
│                                                                  │
│  [Pie chart: Install sources]                                   │
│  [Line chart: Daily installs with trend line]                   │
│  [Table: CPI by channel]                                        │
│                                                                  │
│  ─── RETENTION ─────────────────────────────────────────────    │
│                                                                  │
│  [Retention heatmap: last 4 weekly cohorts]                     │
│  [Line chart: D1/D7/D30 retention trends]                       │
│  [Uninstall reasons pie chart]                                  │
│                                                                  │
│  ─── REVENUE ───────────────────────────────────────────────    │
│                                                                  │
│  [MRR waterfall chart]                                          │
│  [Plan distribution: monthly vs annual vs lifetime]             │
│  [LTV:CAC ratio by channel]                                    │
│                                                                  │
│  ─── EXPERIMENTS ───────────────────────────────────────────    │
│                                                                  │
│  Experiments completed: [X]                                     │
│  Winners rolled out: [X]                                        │
│  Cumulative impact: +[X%] on [metric]                           │
│  [Table: experiment results summary]                            │
│                                                                  │
│  ─── VIRAL ─────────────────────────────────────────────────    │
│                                                                  │
│  Referral links shared: [XXX]                                   │
│  Referral installs: [XX]                                        │
│  Referral conversion rate: [X%]                                 │
│  [Chart: K-factor trend]                                        │
│                                                                  │
│  ─── ACTION ITEMS FOR NEXT MONTH ───────────────────────────    │
│                                                                  │
│  1. [Priority action with owner and deadline]                   │
│  2. [Priority action with owner and deadline]                   │
│  3. [Priority action with owner and deadline]                   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 8.4 Dashboard Specifications

#### Recommended Stack

| Component | Tool | Cost | Purpose |
|-----------|------|------|---------|
| Metrics database | PostgreSQL (Supabase) | Free tier | Store aggregated metrics |
| Dashboard | Metabase (self-hosted) | Free | Visualize metrics |
| Alerting | Metabase alerts + custom | Free | Automated alerts |
| Stripe data | Stripe Dashboard + API | Included | Revenue metrics |
| CWS data | CWS Developer Dashboard | Free | Install/uninstall data |
| Error tracking | Sentry (free tier) | Free | Bug monitoring |
| Uptime | UptimeRobot | Free | API/website monitoring |

#### Metabase Dashboard Setup

```sql
-- Key SQL queries for Metabase dashboards

-- Daily Active Users (from anonymous telemetry)
SELECT
  DATE(event_timestamp) AS day,
  COUNT(DISTINCT anonymous_id) AS dau
FROM events
WHERE event_timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(event_timestamp)
ORDER BY day;

-- Weekly Active Users
SELECT
  DATE_TRUNC('week', event_timestamp) AS week,
  COUNT(DISTINCT anonymous_id) AS wau
FROM events
WHERE event_timestamp >= CURRENT_DATE - INTERVAL '12 weeks'
GROUP BY DATE_TRUNC('week', event_timestamp)
ORDER BY week;

-- Conversion Funnel
SELECT
  'Installs' AS stage,
  COUNT(*) AS count
FROM installs
WHERE install_date >= CURRENT_DATE - INTERVAL '30 days'
UNION ALL
SELECT
  'Activated' AS stage,
  COUNT(*) AS count
FROM users
WHERE activated = true
  AND install_date >= CURRENT_DATE - INTERVAL '30 days'
UNION ALL
SELECT
  'Converted' AS stage,
  COUNT(*) AS count
FROM subscriptions
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY
  CASE stage
    WHEN 'Installs' THEN 1
    WHEN 'Activated' THEN 2
    WHEN 'Converted' THEN 3
  END;

-- MRR Calculation
SELECT
  DATE_TRUNC('month', period_start) AS month,
  SUM(
    CASE WHEN status = 'active' THEN
      CASE
        WHEN interval = 'month' THEN amount
        WHEN interval = 'year' THEN amount / 12
        ELSE 0
      END
    ELSE 0
    END
  ) AS mrr
FROM subscriptions
GROUP BY DATE_TRUNC('month', period_start)
ORDER BY month;

-- Cohort Retention
WITH cohort AS (
  SELECT
    anonymous_id,
    DATE_TRUNC('week', MIN(event_timestamp)) AS cohort_week
  FROM events
  GROUP BY anonymous_id
),
activity AS (
  SELECT
    e.anonymous_id,
    c.cohort_week,
    DATE_TRUNC('week', e.event_timestamp) AS activity_week,
    EXTRACT(DAY FROM e.event_timestamp - c.cohort_week) / 7 AS week_number
  FROM events e
  JOIN cohort c ON e.anonymous_id = c.anonymous_id
)
SELECT
  cohort_week,
  week_number,
  COUNT(DISTINCT anonymous_id) AS active_users,
  COUNT(DISTINCT anonymous_id)::FLOAT
    / FIRST_VALUE(COUNT(DISTINCT anonymous_id))
      OVER (PARTITION BY cohort_week ORDER BY week_number) AS retention_rate
FROM activity
GROUP BY cohort_week, week_number
ORDER BY cohort_week, week_number;

-- K-Factor Calculation
SELECT
  DATE_TRUNC('week', r.created_at) AS week,
  COUNT(DISTINCT r.referrer_id)::FLOAT
    / NULLIF(COUNT(DISTINCT u.id), 0) AS referral_rate,
  COUNT(DISTINCT r.referee_id)::FLOAT
    / NULLIF(COUNT(DISTINCT r.id), 0) AS invite_conversion_rate,
  (COUNT(DISTINCT r.referrer_id)::FLOAT
    / NULLIF(COUNT(DISTINCT u.id), 0))
  * (COUNT(DISTINCT r.referee_id)::FLOAT
    / NULLIF(COUNT(DISTINCT r.id), 0))
  AS k_factor
FROM users u
LEFT JOIN referrals r ON u.id = r.referrer_id
WHERE u.created_at >= CURRENT_DATE - INTERVAL '12 weeks'
GROUP BY DATE_TRUNC('week', r.created_at)
ORDER BY week;
```

### 8.5 Growth Automation Schedule

| Automation | Frequency | Trigger | Output |
|-----------|-----------|---------|--------|
| Metrics snapshot | Hourly | Cron job | Metrics database row |
| Alert evaluation | Every 15 min | Cron job | Triggered alerts |
| CWS scraper | Every 6 hours | Cron job | Rating, reviews, install count |
| Weekly digest email | Monday 9 AM | Cron job | Email to team |
| Monthly report | 1st of month | Cron job | PDF report |
| Experiment check | Daily | Cron job | Significance alerts |
| Referral abuse scan | Every 30 min | Cron job | Abuse flags |
| Cohort retention calc | Daily (2 AM) | Cron job | Retention curves |
| Churn prediction | Weekly | Cron job | At-risk user list |
| CWS review scraper | Every 4 hours | Cron job | New reviews, sentiment |

### 8.6 Incident Response Playbook

When an alert triggers, follow this escalation flow:

```
ALERT TRIGGERED
    │
    ├── Severity: INFO
    │   └── Log and review at next weekly meeting
    │
    ├── Severity: WARNING
    │   ├── Acknowledge within 4 hours
    │   ├── Investigate root cause
    │   ├── Determine if action needed
    │   └── Update status in #growth-alerts channel
    │
    └── Severity: CRITICAL
        ├── Acknowledge within 30 minutes
        ├── Identify owner immediately
        ├── Begin investigation
        ├── Post update in #growth-critical every 2 hours
        ├── Implement fix or mitigation within 24 hours
        └── Post-incident review within 48 hours
```

#### Critical Alert Response Procedures

**Install Velocity Drop >20%:**
1. Check CWS for listing status (suspended? de-listed?)
2. Check for recent Chrome/CWS policy changes
3. Review recent extension updates for bugs
4. Check competitor landscape for new entrants
5. Verify all acquisition channels are operational
6. Check for seasonal patterns (holidays, summer)
7. If no external cause: investigate onboarding/activation changes

**Conversion Rate Drop >0.5%:**
1. Check if paywall touchpoints are functioning (UI bugs?)
2. Review recent A/B test changes affecting conversion
3. Check Stripe for payment processing issues
4. Verify pricing display is correct
5. Check for negative CWS reviews mentioning pricing
6. Compare conversion by touchpoint (which T1-T10 dropped?)
7. Check if a recent update changed user flow near paywalls

**Churn Spike >2% Above Baseline:**
1. Check for payment processing failures (dunning issues)
2. Review recent negative reviews or social media mentions
3. Check if a recent update caused bugs or UX regressions
4. Look at churn reasons from cancellation survey
5. Compare churn across plan types (monthly vs annual)
6. Check if a competitor launched a major feature/promotion
7. Implement immediate win-back email to churned users

**CWS Rating Drop Below 4.5:**
1. Read all recent 1-3 star reviews
2. Identify common complaint themes
3. Respond to all negative reviews within 24 hours
4. If bug-related: prioritize fix in next release
5. If feature-related: add to roadmap with timeline
6. Trigger review request to satisfied users (Phase 08 system)
7. Monitor daily until rating recovers above 4.5

---

## Summary and Implementation Roadmap

### Implementation Priority Matrix

| Priority | Component | Section | Complexity | Timeline |
|----------|-----------|---------|-----------|----------|
| P0 | Growth metrics dashboard (core KPIs) | 4 | Medium | Month 1-2 |
| P0 | Automated alerts (critical) | 8 | Medium | Month 1-2 |
| P0 | Weekly growth review process | 7 | Low | Month 1 |
| P0 | Upgrade funnel tracking | 3 | Medium | Month 1-2 |
| P1 | A/B testing framework | 5 | High | Month 2-3 |
| P1 | First 3 growth experiments | 5 | Medium | Month 2-4 |
| P1 | Cohort retention analysis | 6 | Medium | Month 2-3 |
| P1 | "More from Zovo" section | 1 | Low | Month 3 |
| P2 | Partner outreach (Tier 1) | 2 | Low | Month 2-4 |
| P2 | Monthly growth report automation | 8 | Medium | Month 3-4 |
| P2 | Referral abuse detection | 8 | Medium | Month 3-4 |
| P2 | Aha moment analysis | 6 | Medium | Month 4-5 |
| P2 | NPS survey system | 4 | Low | Month 3 |
| P3 | Zovo bundle landing page | 1 | Medium | Month 6+ |
| P3 | Partner integrations (code-level) | 2 | High | Month 6-12 |
| P3 | Enterprise detection scoring | 3 | Medium | Month 6+ |
| P3 | Quarterly strategy framework | 7 | Low | Month 3 |
| P3 | Full Metabase dashboard | 8 | High | Month 4-6 |

### Key Success Metrics

| Metric | 3-Month Target | 6-Month Target | 12-Month Target |
|--------|---------------|----------------|-----------------|
| MAU | 2,000 | 6,000 | 18,000 |
| MRR | $350 | $1,100 | $5,000 |
| Free-to-paid conversion | 2.5% | 3.2% | 4.0% |
| Monthly churn | <6% | <5% | <4% |
| K-factor | 0.15 | 0.30 | 0.40 |
| NPS | 40 | 50 | 55 |
| CWS rating | 4.6 | 4.7 | 4.8 |
| Day 30 retention | 18% | 22% | 25% |
| Experiments completed | 6 | 15 | 30 |
| Zovo cross-install rate | N/A | 0.5% | 1.5% |

---

*Phase 14, Agent 5 — Cross-Promotion Network, Growth Metrics & Experimentation — Complete*
