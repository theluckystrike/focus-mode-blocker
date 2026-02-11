# MANIFEST V3 ARCHITECTURE: Focus Mode - Blocker
## Phase 12 Output — Complete MV3 Architecture & Implementation Guide

> **Date:** February 11, 2026 | **Status:** Complete
> **Input:** Phases 01-11
> **Extension:** Focus Mode - Blocker v1.0.0 (Manifest V3)

---

## Overview

Phase 12 delivers the complete Manifest V3 architecture for Focus Mode - Blocker, translating all product decisions from Phases 01-11 into a concrete technical blueprint ready for implementation. Five specialized agents produced comprehensive documentation covering the full extension stack: service worker lifecycle and message passing, declarativeNetRequest blocking engine with storage architecture, content scripts with security hardening, build system with MV3-native tooling, and UI page architecture for all five extension surfaces.

The architecture is built for MV3 from day one with zero migration debt. Every design decision accounts for MV3's defining constraints — ephemeral service workers that can terminate at any time, declarativeNetRequest as the sole blocking mechanism (no webRequest interception), strict Content Security Policy with no eval or remote code, and the offscreen document requirement for audio playback. The result is an extension that is battery-efficient, privacy-respecting, and Chrome Web Store compliant, with clear performance budgets enforced at build time and a modular codebase that supports the Free/Pro tier split across all components.

---

## Agent Deliverables

### Agent 1 — Service Worker Lifecycle & Message Passing
**File:** `docs/mv3-architecture/agent1-service-worker-lifecycle.md`

- Service worker entry point architecture with 18 imported modules organized by responsibility (lifecycle, blocking, sessions, scoring, storage, messaging, licensing, monitoring)
- Lifecycle management: install, activate, startup, idle termination, and crash recovery patterns with state persistence across service worker restarts
- Chrome alarm system for all periodic tasks (timer ticks, storage cleanup, license checks, telemetry batches) since `setInterval` does not survive termination
- Message router handling 22+ message types from popup, options, content scripts, block page, onboarding, and offscreen document
- Port-based streaming connections for real-time timer updates to the popup while it is open
- Keep-alive strategies for long-running operations that approach the 30-second idle timeout
- Error boundaries around every chrome.* API call with graceful degradation on failure

### Agent 2 — DNR Blocking Engine & Storage Architecture
**File:** `docs/mv3-architecture/agent2-blocking-storage.md`

- declarativeNetRequest rule engine: static ruleset (bundled defaults), session rules (active blocklist), dynamic rules (schedule-based, Pro wildcards, Nuclear Mode)
- Rule generation pipeline converting user-friendly domain entries to DNR rule objects with redirect actions pointing to the block page
- Nuclear Mode implementation with 6 tamper-resistance layers: DNR rules protected from removal, alarm-based rule integrity checks, content script reinforcement, options page lockout, uninstall friction, and service worker self-healing
- Storage schema design: chrome.storage.local for persistence (settings, blocklist, stats, scores, streaks), chrome.storage.session for ephemeral state (active session, timer state, temporary UI flags), chrome.storage.sync for Pro cross-device sync
- Data migration system for schema version upgrades across extension updates
- Storage manager with read/write abstraction, batch operations, quota monitoring, and automatic cleanup of stale data

### Agent 3 — Content Scripts & Security
**File:** `docs/mv3-architecture/agent3-content-scripts-security.md`

- Two content scripts: detector (lightweight, runs on all pages, identifies blocked domains and reports to background) and blocker (injected on-demand via chrome.scripting.executeScript to enforce visual blocking before DNR redirect completes)
- Content script injection strategy: static declaration for the detector, programmatic injection for the blocker to minimize per-page overhead
- Security hardening: strict Content Security Policy (no inline scripts, no eval, no remote code), DOM sanitization pipeline for any user-generated content displayed on extension pages, input validation at every boundary
- Communication security: content scripts validate message origin via chrome.runtime.id, background validates sender tab ID and URL before processing content script messages
- Permission minimization: only activeTab and declarativeNetRequest required for core functionality, optional permissions requested progressively for Pro features
- XSS prevention in the block page: no innerHTML for user content, all dynamic text set via textContent, custom quotes sanitized before storage

### Agent 4 — Build System & MV3 Migration
**File:** `docs/mv3-architecture/agent4-build-migration.md`

- Vite build configuration with multiple entry points: service worker, popup, options, block page, onboarding, offscreen document, content scripts (detector and blocker)
- TypeScript configuration with strict mode, path aliases, and Chrome extension type definitions
- Bundle size budgets enforced at build time: service worker <100KB, popup <150KB JS + <30KB CSS, content scripts <50KB each, block page <50KB total
- Development workflow: Vite dev server with HMR for UI pages, manual reload for service worker changes, Chrome extension reload shortcut
- Cross-browser manifest transformation: Chrome MV3 (primary) → Edge MV3 (minimal changes) → Firefox MV2 (future, significant adaptation required)
- Production build pipeline: TypeScript compilation, tree shaking, minification, source map generation (separate from dist), ZIP packaging for Chrome Web Store upload
- ESLint and Prettier configuration tuned for Chrome extension patterns, pre-commit hooks for code quality

### Agent 5 — UI Page Architecture
**File:** `docs/mv3-architecture/agent5-ui-architecture.md`

- Popup architecture (380x500-580px): vanilla JS with 6 distinct states (idle, active session, post-session, blocklist, stats, Pro upgrade), port-based real-time timer updates, <500ms load target
- Options page (8 sections): General, Blocklist, Timer, Focus Score, Sounds, Appearance, Account, About — with hash-based navigation, debounced save-on-change, Pro lock indicators on gated features
- Block page: full-viewport motivational page with 50+ curated quotes, stats grid (time saved, distractions blocked, streak, Focus Score), <200ms render, zero external requests, XSS-safe content rendering
- Onboarding flow (5 slides): Welcome, Quick Setup (magic moment — first site blocked), Focus Style selection, Focus Score explanation, First Session CTA — with slide state machine, resume capability, and A/B test hooks
- Offscreen document for ambient sound playback: on-demand creation/destruction, message-based audio control, support for Pro sound layering (up to 3 simultaneous sounds)
- Shared UI utilities: DOM helpers with sanitization, theme manager (light/dark/auto via CSS custom properties), i18n wrapper with pluralization, animation utilities respecting reduced motion, accessibility helpers (ARIA, focus trapping, keyboard navigation)

---

## Key Design Decisions

### MV3-Native Architecture

- Built for Manifest V3 from day one — no migration debt from MV2 patterns
- Service worker with 18 modules, all state persisted to chrome.storage so it survives termination and restart
- declarativeNetRequest for all site blocking — rules execute at the network layer before page load, independent of service worker state, battery-efficient
- chrome.storage.session for ephemeral state (active session, timer), chrome.storage.local for persistent data (settings, blocklist, stats, scores), chrome.storage.sync for Pro cross-device sync
- Chrome alarms API for all periodic operations — no reliance on setInterval which does not survive service worker termination

### Performance Architecture

- All performance budgets enforced at build time via Vite bundle analysis plugin
- Content scripts optimized for minimal per-page footprint: detector script <50KB, injected only where needed
- Popup loads in <500ms with lazy-loaded Stats tab data to avoid blocking initial render
- Block page renders in <200ms with zero external network requests — all assets bundled
- Service worker startup time tracked and optimized, cold start target <500ms
- DNR rule updates complete in <100ms to prevent any gap in blocking coverage

### Security-First Design

- Strict Content Security Policy: `script-src 'self'`, no eval, no inline scripts, no remote code loading
- Block page content sanitized against XSS — user-generated quotes use textContent only, domain names validated before display
- Nuclear Mode tamper-resistant with 6 independent defense layers
- Permission minimization: core functionality requires only activeTab and declarativeNetRequest, Pro features use optional permissions requested at point of need
- All cross-context messages validated at both sender and receiver with origin and tab URL checks

### UI Architecture

- Vanilla JS across all UI pages — no framework dependency keeps bundle sizes small and popup load times fast
- Consistent design system: #6366f1 indigo primary, Inter + JetBrains Mono fonts, CSS custom properties for theming, dark mode support via ThemeManager
- Pro feature gating visible throughout UI: lock icons, "Pro" badges, hover tooltips, click-to-upgrade modals with 10 distinct paywall triggers (T1-T10)
- Accessibility: WCAG 2.1 AA compliance, keyboard navigation, screen reader support, reduced motion respect, 44px minimum touch targets

---

## Implementation Priority

| Priority | Component | Agent | Complexity |
|----------|-----------|-------|------------|
| P0 | Service worker entry + lifecycle management | Agent 1 | High |
| P0 | DNR rule engine + block page redirect | Agent 2 | High |
| P0 | Storage schema + storage manager | Agent 2 | Medium |
| P0 | Content scripts (detector + blocker) | Agent 3 | Medium |
| P0 | Vite build config + TypeScript setup | Agent 4 | Medium |
| P1 | Message router (22+ message types) | Agent 1 | Medium |
| P1 | Popup UI (6 states + port connection) | Agent 5 | High |
| P1 | Block page (quotes, stats, navigation) | Agent 5 | Medium |
| P1 | Nuclear Mode + tamper resistance (6 layers) | Agent 2 | High |
| P1 | CSP + security hardening | Agent 3 | Medium |
| P2 | Options page (8 sections, settings persistence) | Agent 5 | High |
| P2 | Onboarding (5 slides, state machine, first block) | Agent 5 | Medium |
| P2 | Schedule-based DNR rules | Agent 2 | Medium |
| P2 | Data migration system (schema versioning) | Agent 2 | Medium |
| P3 | Cross-browser manifest transform (Edge, Firefox) | Agent 4 | Medium |
| P3 | Offscreen audio document + sound layering | Agent 5 | Low |
| P3 | Sync architecture (Pro, chrome.storage.sync) | Agent 2 | High |

**Recommended implementation order:**
1. **Foundation (P0):** Build system, service worker skeleton, storage manager, DNR blocking engine, content scripts — the extension can block sites
2. **Core Experience (P1):** Popup with session management, block page, message router, Nuclear Mode, security layer — the extension is usable
3. **Full Product (P2):** Options page, onboarding, schedule rules, data migration — the extension is complete
4. **Polish & Expansion (P3):** Cross-browser support, ambient sounds, Pro sync — the extension scales

---

## Document Map

```
docs/
├── 12-manifest-v3-architecture.md          <-- THIS FILE (consolidated overview)
└── mv3-architecture/
    ├── agent1-service-worker-lifecycle.md   Service worker lifecycle, alarms, message router, ports
    ├── agent2-blocking-storage.md           DNR engine, storage schema, Nuclear Mode, migration
    ├── agent3-content-scripts-security.md   Content scripts, CSP, XSS prevention, permissions
    ├── agent4-build-migration.md            Vite build, TypeScript, bundle budgets, cross-browser
    └── agent5-ui-architecture.md            Popup, options, block page, onboarding, offscreen, shared utils
```

---

*Phase 12 — Manifest V3 Architecture — Complete*
