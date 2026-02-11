# BRANDING & RETENTION SYSTEM: Focus Mode - Blocker
## Phase 08 Output -- Brand Identity, Onboarding & Retention

> **Date:** February 10, 2026 | **Status:** Complete
> **Input:** Phases 01-07

---

## Overview

Five agents produced comprehensive branding, design system, onboarding, retention, and cross-promotion specifications for Focus Mode - Blocker within the Zovo extension family.

## Agent Deliverables

### Agent 1 -- Icon & Asset System
**File:** `docs/branding-retention/agent1-icon-asset-system.md`
- Master icon design (purple gradient shield + white crosshair)
- 3 icon states: default (purple), active (green), disabled (gray)
- Size-specific specs (16/32/48/128/512px) with detail level guidance
- Dynamic icon switching in service worker
- Badge usage (blocked count, active session indicator)
- Complete file structure for all assets (icons, images, promo, sounds)
- AI generation prompts for all icon variants

### Agent 2 -- Global Styles & Component Library
**File:** `docs/branding-retention/agent2-global-styles.md`
- Complete CSS design token system (colors, typography, spacing, radius, shadows, transitions)
- Dark mode overrides
- 15+ component specs: header, footer, buttons (3 variants x 3 sizes), inputs, cards, modals, toasts, tabs, badges, progress bars, lists
- Focus Mode specific: Focus Score ring, timer display, streak display, blocklist item, sound card
- Layout patterns (popup, options page, block page)
- Animation & transition specs (8 animations)
- WCAG 2.1 AA accessibility guidelines

### Agent 3 -- Onboarding System
**File:** `docs/branding-retention/agent3-onboarding-system.md`
- 5-slide onboarding flow with ASCII wireframes
- Slide 1: Welcome + trust badges
- Slide 2: Quick setup (block first sites -- MAGIC MOMENT)
- Slide 3: Focus style selection (Pomodoro/Quick/Scheduled + sounds)
- Slide 4: Focus Score introduction
- Slide 5: Start first session CTA
- Service worker integration code
- State machine (resume from any slide)
- "What's New" page for major updates
- First-use tooltip hints
- 4 A/B tests for optimization
- Success metrics (70% completion, <60s to first block)

### Agent 4 -- Retention & Engagement System
**File:** `docs/branding-retention/agent4-retention-system.md`
- Retention flywheel: BLOCK -> FOCUS -> SCORE -> STREAK -> HABIT -> RETENTION
- Local-only analytics system (500-event rolling window, zero external requests)
- At-risk user detection algorithm
- Streak system (milestones from 3 days to 365 days with celebrations)
- Focus Score progression hooks
- Block page gamification (distraction counter, time saved, quotes)
- Notification system (5 types, strict frequency limits)
- Review request flow (two-step satisfaction gate, CWS policy-safe)
- Re-engagement system (3-day to 30-day sequence, max 3 attempts)
- Achievement system (10 achievements from Common to Legendary)
- Retention data schema

### Agent 5 -- Cross-Extension Promotion
**File:** `docs/branding-retention/agent5-cross-promotion.md`
- Relevance mapping (which extensions complement Focus Mode)
- "More from Zovo" settings panel design
- Contextual recommendation system (15% chance, max 1/day)
- Footer branding for all pages
- Ref tracking system (7 source types)
- Anti-spam rules (7 rules for respectful promotion)
- Cross-promotion metrics and targets

---

## Key Design Decisions

### Brand Identity
- **Primary color:** #6366f1 (Indigo/Purple) -- consistent across all Zovo extensions
- **Icon concept:** Purple gradient shield with white crosshair -- communicates protection and focus
- **Footer branding:** Every page carries "Part of Zovo" with privacy assurance
- **Tone:** Encouraging, never guilt-tripping; celebrates progress over perfection

### Privacy-First Analytics
- ALL analytics are local-only -- zero external requests, zero tracking servers
- 500-event rolling window prevents unbounded storage growth
- Users can clear all data at any time
- Block page never sends data anywhere
- Cross-promotion respects 7 anti-spam rules

### Retention Philosophy
- The core loop is: Block distractions -> Focus -> See score improve -> Maintain streak -> Build habit
- Streaks are forgiving (grace period, vacation mode) to reduce anxiety
- Achievements unlock progressively to maintain engagement
- Review requests only go to satisfied users (two-step gate)
- Re-engagement caps at 3 attempts -- if user leaves, respect that

### Cross-Promotion Ethics
- Never during focus sessions
- Never in first 3 days
- Max 1 recommendation per day, 15% probability gate
- Settings "More from Zovo" panel is always available but never forced
- Block page is a focus-only zone -- no promotions

---

## Implementation Priority

| Priority | Component | Agent | Complexity |
|----------|-----------|-------|------------|
| P0 | Icon states + badge system | Agent 1 | Medium |
| P0 | CSS design tokens + core components | Agent 2 | Medium |
| P0 | Onboarding flow (5 slides) | Agent 3 | High |
| P1 | Streak system + Focus Score hooks | Agent 4 | High |
| P1 | Footer branding (all pages) | Agent 5 | Low |
| P1 | Block page gamification | Agent 4 | Medium |
| P2 | Achievement system | Agent 4 | Medium |
| P2 | "More from Zovo" settings panel | Agent 5 | Medium |
| P2 | Contextual recommendation engine | Agent 5 | Medium |
| P3 | Review request flow | Agent 4 | Low |
| P3 | Re-engagement notifications | Agent 4 | Medium |
| P3 | "What's New" page | Agent 3 | Low |

---

## Document Map

```
docs/
├── 08-branding-retention-system.md              <- THIS FILE
└── branding-retention/
    ├── agent1-icon-asset-system.md              <- Icons, assets, states
    ├── agent2-global-styles.md                  <- Design tokens, components
    ├── agent3-onboarding-system.md              <- 5-slide onboarding flow
    ├── agent4-retention-system.md               <- Retention, streaks, gamification
    └── agent5-cross-promotion.md                <- Cross-extension promotion
```

---

*Phase 08 -- Branding & Retention System -- Complete*
