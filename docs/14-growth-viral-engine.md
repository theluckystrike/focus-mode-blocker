# GROWTH & VIRAL ENGINE: Focus Mode - Blocker
## Phase 14 Output — Referral Systems, Viral Loops, Organic Acquisition, Content Strategy & Growth Metrics

> **Date:** February 11, 2026 | **Status:** Complete
> **Input:** Phases 01-13

---

## Overview

Phase 14 delivers a comprehensive growth and viral engine for Focus Mode - Blocker, produced by five specialized agents. The output covers the full spectrum of sustainable growth: a privacy-respecting referral system with fraud prevention and attribution tracking, viral loop mechanics built into the product's natural usage patterns, an organic acquisition strategy anchored by a ProductHunt launch playbook, an influencer and content marketing framework targeting productivity creators, and a data-driven experimentation system with cross-promotion network design. Together, these five documents provide Focus Mode with the strategies, code specifications, and operational playbooks needed to grow from initial launch to $1,000+ MRR by month 6, with a target viral coefficient (K-factor) above 0.3. Every growth mechanism is designed around Focus Mode's privacy-first principle: free-tier users generate zero external network requests, and all viral features require explicit user action rather than passive data collection.

---

## Agent Deliverables

### Agent 1 — Referral System & Attribution
**File:** `docs/growth-viral/agent1-referral-attribution.md`

- Complete referral system architecture with unique referral code generation, server-side tracking, and reward fulfillment for both referrer and referee
- Privacy-respecting attribution model that tracks referral conversions without collecting personal data from free-tier users
- Referral reward structure: 7-day Pro trial for the referee, 7 days of Pro added to the referrer's account per successful referral, with tiered bonuses at 5, 10, and 25 referrals
- Referral link sharing UI integrated into the popup, weekly report, and milestone celebrations
- Attribution tracking for all acquisition channels (CWS organic, referral, social, content, paid) with server-side event logging
- Multi-touch attribution model supporting first-touch, last-touch, and linear attribution for users who encounter multiple touchpoints
- Referral dashboard for users to track their invites, conversions, and earned rewards

### Agent 2 — Viral Loops & Social Proof
**File:** `docs/growth-viral/agent2-viral-loops-social-proof.md`

- Five distinct viral loop designs embedded in natural product usage: achievement sharing (Focus Score milestones, streak badges), challenge system (invite friends to focus challenges), weekly report sharing, block page social proof, and team leaderboard sharing
- Social proof integration across 6 product surfaces: CWS listing, onboarding, block page, paywall, weekly report, and popup header
- Shareable content templates for Twitter/X, LinkedIn, Instagram Stories, and direct messaging with auto-generated focus statistics
- Social proof data pipeline using anonymous aggregated statistics (total focus hours, sessions completed, streaks) that respects the privacy-first architecture
- Challenge system enabling users to create and share time-limited focus challenges with friends
- Viral coefficient optimization framework with specific tactics to improve each component of the K = invites x conversion formula

### Agent 3 — Organic Acquisition & ProductHunt Launch
**File:** `docs/growth-viral/agent3-organic-producthunt.md`

- Complete ProductHunt launch playbook with a 60-day preparation timeline, launch day hour-by-hour schedule, and post-launch follow-up plan
- CWS ASO optimization strategy building on Phase 07 keyword research, with seasonal keyword calendars and competitor gap analysis
- SEO content strategy with 10 pillar pages targeting high-intent keywords ("block distracting websites Chrome", "Pomodoro timer extension", "website blocker for students")
- Community seeding plan for Reddit (r/productivity, r/ADHD, r/GetDisciplined), Hacker News, IndieHackers, and niche productivity forums
- Alternative marketplace strategy for Microsoft Edge Add-ons, Firefox Add-ons, and direct distribution
- Launch PR outreach list with 30+ productivity and tech bloggers, journalists, and newsletter operators
- First-week install velocity targets and contingency plans if targets are missed

### Agent 4 — Influencer/Creator Strategy & Content Marketing
**File:** `docs/growth-viral/agent4-influencer-content.md`

- Influencer identification framework for productivity-focused YouTubers, TikTok creators, Twitter thought leaders, and newsletter writers with audience size tiers (nano, micro, mid, macro)
- Creator outreach templates with personalization guidelines, compensation structures (free Pro lifetime for honest review, affiliate commissions for larger creators), and partnership terms
- Content marketing calendar with 12 months of blog posts, social media campaigns, email sequences, and seasonal content tied to productivity peaks (New Year, back-to-school, Q1 planning)
- YouTube sponsorship brief template specifically designed for Focus Mode demo integrations
- Affiliate program design with 30% recurring commission, 90-day cookie window, and tiered bonuses
- UGC (user-generated content) strategy encouraging organic testimonials and workflow screenshots
- Content repurposing pipeline turning one blog post into 8+ social media assets across platforms

### Agent 5 — Cross-Promotion, Growth Metrics & Experimentation
**File:** `docs/growth-viral/agent5-crosspromo-metrics.md`

- Zovo extension family cross-promotion system with "More from Zovo" settings page section, relevance-sorted recommendations, and strict anti-spam rules (never during focus sessions, never in first 3 days, max 1/day, 15% probability gate)
- Partner extension collaboration framework with outreach templates, partnership evaluation scorecard, and integration specifications for OneTab, Todoist, Notion, and other complementary extensions
- Complete upgrade path funnel design: Free to Pro (10 paywall touchpoints with conversion targets), Pro to Team (work email detection, colleague invite flow), Team to Enterprise (signal scoring system)
- Growth metrics dashboard specification covering acquisition (CPI by channel, CWS funnel), activation (6 criteria with targets), engagement (DAU/MAU stickiness), retention (D1-D90 curves), revenue (MRR waterfall, LTV:CAC), and viral metrics (K-factor, NPS)
- A/B testing framework with 20 prioritized growth experiments, ICE scoring, deterministic hash-based user assignment, statistical significance calculator, and experiment documentation template
- Cohort analysis system with retention curve calculation, aha moment identification, referral vs organic cohort comparison, and retention heatmap visualization
- Weekly/monthly/quarterly growth review templates with checklists, OKR framework, and budget allocation guidance
- Growth automation system with 13 automated alerts (critical, warning, info), referral abuse detection, weekly email digest generation, and incident response playbook

---

## Key Design Decisions

### Privacy-First Growth
- All viral features require explicit user action — no passive data sharing, no silent tracking, no address book scanning
- Free-tier users remain completely local: sharing and referral links are generated client-side with minimal server interaction only when the user clicks "Share"
- Aggregated social proof statistics (total user count, focus hours) are computed server-side from anonymous data and pushed to all clients — no individual user data exposed
- Referral attribution uses opaque referral codes, not user identifiers or email addresses

### Ethical Viral Mechanics
- Every sharing prompt includes a clear "Not Now" or "Never Show Again" option
- Referral rewards are capped to prevent abuse (max 50 referral rewards per account)
- No dark patterns: upgrade prompts always show current free-tier value before asking for payment
- Challenge invitations explain exactly what Focus Mode is before the recipient installs
- Anti-spam rules on all cross-promotion: never interrupt focus sessions, respect dismissals permanently

### Data-Driven Experimentation
- All experiments use deterministic hash-based assignment — same user always sees same variant, no cookies needed
- Statistical significance at 95% confidence level required before declaring a winner
- Guardrail metrics monitored on every experiment to prevent unintended degradation
- Experiments run for minimum 14 days regardless of early significance to account for day-of-week effects
- Full experiment documentation required before, during, and after every test

---

## Implementation Priority

| Priority | Component | Agent | Complexity |
|----------|-----------|-------|------------|
| P0 | Referral link generation and sharing UI | Agent 1 | Medium |
| P0 | Referral attribution tracking (server-side) | Agent 1 | High |
| P0 | Achievement/stats sharing (basic) | Agent 2 | Low |
| P0 | CWS ASO optimization (listing text) | Agent 3 | Low |
| P0 | Growth metrics dashboard (core KPIs) | Agent 5 | Medium |
| P0 | Weekly growth review process | Agent 5 | Low |
| P1 | Referral reward fulfillment | Agent 1 | Medium |
| P1 | ProductHunt launch execution | Agent 3 | Medium |
| P1 | Social proof on CWS listing and block page | Agent 2 | Low |
| P1 | Influencer outreach (first 10 creators) | Agent 4 | Low |
| P1 | Blog content (first 5 pillar pages) | Agent 4 | Medium |
| P1 | A/B testing framework | Agent 5 | High |
| P1 | Upgrade funnel tracking | Agent 5 | Medium |
| P2 | Challenge system (invite friends) | Agent 2 | High |
| P2 | Community seeding (Reddit, HN) | Agent 3 | Low |
| P2 | Affiliate program launch | Agent 4 | Medium |
| P2 | Partner extension outreach (Tier 1) | Agent 5 | Low |
| P2 | Cohort analysis and aha moment identification | Agent 5 | Medium |
| P2 | Automated growth alerts | Agent 5 | Medium |
| P3 | Team leaderboard sharing | Agent 2 | Medium |
| P3 | Edge/Firefox marketplace listing | Agent 3 | High |
| P3 | Creator sponsorship program | Agent 4 | Medium |
| P3 | "More from Zovo" cross-promotion section | Agent 5 | Low |
| P3 | Zovo bundle landing page | Agent 5 | Medium |
| P3 | Enterprise detection and outreach | Agent 5 | Medium |

### Priority Definitions

- **P0 — Required for launch.** Referral infrastructure, basic sharing, CWS listing optimization, and the core growth metrics dashboard must be operational before or at launch to establish baseline measurement and enable word-of-mouth growth from day one.

- **P1 — Required within first 2 months.** ProductHunt launch, initial content and influencer outreach, the A/B testing framework, and conversion funnel tracking must be in place to capitalize on the launch window and begin systematic growth optimization.

- **P2 — Required within first 6 months.** Advanced viral features (challenges), community seeding, the affiliate program, partner outreach, cohort analysis, and automated alerting build the sustainable growth engine that compounds over time.

- **P3 — Nice to have, build as resources allow.** Cross-promotion across the Zovo family, alternative marketplace distribution, enterprise features, and the full Metabase dashboard are valuable but depend on achieving sufficient scale to justify the investment.

---

## Document Map

```
docs/
├── 14-growth-viral-engine.md                      <- THIS FILE
└── growth-viral/
    ├── agent1-referral-attribution.md             <- Referral system & attribution
    ├── agent2-viral-loops-social-proof.md          <- Viral loops & social proof
    ├── agent3-organic-producthunt.md               <- Organic acquisition & PH launch
    ├── agent4-influencer-content.md                <- Influencer & content marketing
    └── agent5-crosspromo-metrics.md                <- Cross-promo, metrics & experimentation
```

---

*Phase 14 — Growth & Viral Engine — Complete*
