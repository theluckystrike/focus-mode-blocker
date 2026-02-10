# FOCUS MODE - BLOCKER: COMPLETE EXTENSION SPECIFICATION
## Codename: "BLUEPRINT ARCHITECT" — Phase 02 Output

> **Document Version:** 1.0
> **Date:** February 10, 2026
> **Status:** Specification Complete — Ready for Development
> **Input:** `docs/01-competitive-intel-report.md` (Phase 01 — Competitive Intelligence)
> **Extension:** Focus Mode - Blocker
> **Pricing:** Free / Pro $4.99/mo ($35.88/yr at $2.99/mo) / Lifetime $49.99 / Team $3.99/user/mo

---

## EXECUTIVE SUMMARY

This specification transforms the competitive intelligence from Phase 01 into a complete, buildable Chrome extension spec. It covers 9 sections across 5 detailed documents, totaling 480+ KB of implementation-ready requirements.

**Core Identity:** "Block distractions. Build focus. Track your streak."

**Position:** "Honest Freemium" — a genuinely useful free tier (10 sites, Pomodoro, daily stats) paired with a compelling Pro tier ($4.99/mo). More generous than BlockSite. More monetizable than StayFocusd. Better UX than LeechBlock.

**Key Differentiators:**
1. Honest freemium (10 free sites vs BlockSite's 3)
2. Gamification + strong blocking (unoccupied niche — Forest has gamification but weak blocking; Cold Turkey has strong blocking but no gamification)
3. Smart motivational block page (streaks, time saved, quotes — seen 100+ times/day)
4. Privacy-first architecture (data never leaves device for free tier)
5. Grammarly-style blurred analytics (new to focus tools — proven 22% upgrade lift)
6. Focus Score (0-100) — quantified focus quality nobody else has
7. Manifest V3 native build (no V2 migration issues)

---

## SPECIFICATION SECTIONS

The complete spec is organized into 9 sections across 5 detailed documents:

### Section 1: Product Overview
**File:** `docs/spec/sections-1-2-product-features.md`

- **Extension Identity:** Name, tagline, category, brand tone
- **Target Users:** 4 detailed personas — Alex (overwhelmed knowledge worker), Jordan (struggling student), Sam (neurodivergent professional), Morgan (freelancer/entrepreneur)
- **Problem Statement:** $608/week lost to distractions per worker, 23-minute recovery per interruption, 121x ROI at $4.99/mo
- **Success Metrics:** 500-2,000 installs at 30d → 15,000-75,000 at 12mo; 2.5-5% conversion; $6,700-$52,000 Year 1 revenue; 4.7+ star target

### Section 2: Feature Specification
**File:** `docs/spec/sections-1-2-product-features.md`

- **Complete Feature Matrix:** 30+ features across 6 categories (Core Blocking, Focus Timer, Stats & Analytics, Smart Features, Social & Accountability, Integrations)
- **Free Tier:** 13 features with exact limits — 10 sites, 2 lists, 25/5 Pomodoro, daily stats, Focus Score (number only), current streak, 1 schedule, 1hr nuclear, 3 sounds, 1 buddy
- **Pro Tier:** 24 features — unlimited everything, reports, analytics, AI, calendar, sync, custom pages, sound library, profiles, streak recovery
- **MVP Priorities:**
  - P0 (launch, 5-7 weeks): Blocklist, block page, Quick Focus, Pomodoro, daily stats, Focus Score, streaks, pre-built lists, popup UI, Pro licensing
  - P1 (2 weeks post-launch): Schedule, nuclear, notification muting, sounds, core Pro unlocks
  - P2 (months 2-9+): Wildcard blocking, whitelist, sync, calendar, AI, team tier

### Section 3: Paywall Specification
**File:** `docs/spec/section-3-paywall.md`

- **10 Trigger Points:** T1 Weekly Report (primary, 8-12% conversion), T2 11th Site (secondary, 5-8%), T3 Nuclear Extension (tertiary, 6-10%), T4-T10 supporting triggers
- **Full UI Specs:** ASCII mockups, exact copy, animation specs, dismissal behavior, frequency caps for all 10 triggers
- **Trigger Precedence:** One paywall per session max, T1 always takes priority, user-initiated triggers don't count against limit
- **Upgrade Flow:** 8-step journey from trigger → plan selection → Stripe checkout → instant feature unlock
- **Post-Upgrade Experience:** Icon change, lock→checkmark transitions, welcome celebration, 7-day feature discovery prompts
- **Timing Cadence:** Sessions 1-2 (zero paywalls) → Session 3 (PRO badges appear) → Session 5 (primary trigger) → Day 7+ (weekly alerts) → Day 14+ (respect their choice)
- **12 Anti-Patterns:** Things we NEVER do (interrupt focus sessions, shame users, degrade free features, etc.)
- **Copy Tone Guide:** 6 principles for paywall messaging

### Section 4: User Interface Specification
**File:** `docs/spec/section-4-ui-ux.md`

- **Design System:** 38 color tokens (hex codes), 12 text styles (Inter + JetBrains Mono), spacing scale, shadows, Lucide Icons
- **Extension Popup (380x500-580px):** 6 detailed states — default, active session, post-session, blocklist tab, stats tab, free vs Pro differences
- **Block Page:** Full-page motivational design — shield icon, rotating quotes (50+), 2x2 stats, "Back to Work" button, privacy footer, Pro customization spec
- **Settings/Options Page:** 8 navigation sections, complete settings table, Pro lock indicators
- **Pro Feature Indicators:** Lock icon (4 sizes), PRO badge (small/large), blur effect (CSS spec), hover tooltips, 3 upgrade messaging levels
- **Usage Counter:** 4 color states (green→yellow→orange→red), animations, disabled state
- **Focus Score:** SVG circular ring, 5 score color bands, 4 weighted factors
- **Notifications:** 7 notification types with designs
- **Dark Mode:** Complete dark palette, element adaptations
- **Appendices:** 23 unique screens (~68 states), 24 animations, WCAG 2.1 AA accessibility, responsive breakpoints

### Section 5: Technical Architecture
**File:** `docs/spec/sections-5-6-tech-monetization.md`

- **Permissions:** 8 always-required, 3 optional, 2 Pro-only, 8 deliberately avoided — minimal for trust
- **Manifest V3 Structure:** Complete manifest.json, 18 service worker modules, 12 popup components
- **Storage Schema:** Every field defined with type, default, and tier access — 9 top-level categories, data migration strategy
- **Service Worker:** 18 modules, 12 alarms, wake strategy, 22 message types
- **Content Scripts:** 3 scripts, <2KB detector budget, block page injection, performance budgets
- **Blocking Mechanism:** declarativeNetRequest rules, dynamic rule management, 30,000 rule budget, nuclear option with 6 tamper-resistance layers, whitelist mode, schedule activation
- **Sync Architecture (Pro):** 7 data categories, push/pull protocol, 7 triggers, last-write-wins conflict resolution
- **API Requirements:** 25+ endpoints across 6 categories (auth, sync, AI, analytics, team, payments)
- **Dependencies:** 3 NPM packages, 8 external services with cost estimates, 8 build tools
- **Security:** CSP, encryption, XSS prevention, tamper resistance, license validation

### Section 6: Monetization Integration
**File:** `docs/spec/sections-5-6-tech-monetization.md`

- **Pricing Table:** Free / Pro $4.99/mo / $35.88/yr / $49.99 lifetime / Team $3.99/user/mo — 20-row feature comparison
- **Payment Integration:** Stripe (with 4-provider comparison), 10-step checkout flow, license key format, subscription management
- **License Verification:** Decision tree, server vs client checks, 7-day offline grace, caching, 6 anti-piracy measures
- **Trial Strategy:** 7-day full Pro, 4-step smart onboarding, 12-row messaging cadence, graceful degradation
- **Launch Pricing Ladder:** Beta ($0) → Founding ($2.99/mo) → Ramp ($3.99/mo) → Steady ($4.99/mo)
- **Cross-Extension Integration:** 4-extension ecosystem vision, shared auth, bundle pricing

### Section 7: Analytics & Tracking
**File:** `docs/spec/sections-7-9-analytics-launch.md`

- **Analytics Provider:** Mixpanel (primary, 20M free events/mo) + PostHog (self-hosted backup) — privacy proxy architecture
- **63 Events:** 10 onboarding, 20 feature usage, 10 session, 13 paywall/conversion, 10 engagement, 7 error/performance
- **Conversion Funnel:** 9-stage funnel (Install → Retained 30d) with conversion % targets and optimization levers
- **Dashboards:** Real-time, daily digest, weekly analysis, monthly review
- **A/B Testing:** 8 prioritized tests with hypotheses, sample sizes, success criteria
- **Privacy & Compliance:** GDPR (mapped to specific Articles), CCPA, data deletion flow, retention policy

### Section 8: Launch Checklist
**File:** `docs/spec/sections-7-9-analytics-launch.md`

- **150+ Checkbox Items** across 6 phases: Pre-Development (17), Development (34 + 7 quality gates), Testing (20 manual test cases, 7 browser combos, 10 perf benchmarks), Pre-Launch (store listing, screenshots, privacy policy), Launch Day (submission, monitoring, support), Post-Launch Week 1 (monitoring, feedback, bug triage)

### Section 9: Success Criteria
**File:** `docs/spec/sections-7-9-analytics-launch.md`

- **Week 1:** 100-2,000 installs, 60% activation, 0 critical bugs
- **Month 1:** DAU/MAU 20-22%, D30 retention targets, first MRR ($34-$201)
- **Month 3:** NPS 30-50+, churn <5-8%, trial-to-paid 25-40%
- **Month 6:** ARR run-rate $6,864-$47,760, Team tier launched
- **Year 1:** 15,000-75,000 installs, $12,276-$99,630 ARR
- **Health Metrics:** 20 metrics with Green/Yellow/Red thresholds and response protocols

---

## DOCUMENT MAP

```
docs/
├── 01-competitive-intel-report.md          ← Phase 01 output (competitive intelligence)
├── 02-extension-spec.md                    ← THIS FILE (consolidated spec overview)
├── research/                               ← Phase 01 supporting research
│   ├── tier1-direct-competitors.md
│   ├── tier2-productivity-patterns.md
│   ├── tier3-paywall-patterns.md
│   ├── pricing-strategy.md
│   ├── feature-matrix-priorities.md
│   └── [supplementary research files]
└── spec/                                   ← Phase 02 detailed specifications
    ├── sections-1-2-product-features.md    ← Product Overview + Feature Specification
    ├── section-3-paywall.md                ← Paywall Specification
    ├── section-4-ui-ux.md                  ← User Interface Specification
    ├── sections-5-6-tech-monetization.md   ← Technical Architecture + Monetization
    └── sections-7-9-analytics-launch.md    ← Analytics + Launch Checklist + Success Criteria
```

---

## NEXT STEPS

This specification is complete and ready for development. Feed this document to **Phase 03** for the next stage of the build process.

**Key development sequence (from Section 2.4 priorities):**
1. Core blocking engine (10 sites + block page)
2. Quick Focus one-click button
3. Pomodoro timer + session tracking
4. Daily stats dashboard
5. Pre-built block lists
6. Streaks + gamification
7. Schedule blocking + nuclear option
8. Pro tier + payment integration
9. Notification muting
10. Ambient sounds

---

*Specification generated by 5 parallel agents*
*Phase 02 — Extension Spec Generator (Blueprint Architect) — Complete*
*Feed this spec to Phase 03 for implementation*
