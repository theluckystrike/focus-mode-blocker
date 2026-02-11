# CRASH ANALYTICS & MONITORING: Focus Mode - Blocker
## Phase 11 Output — Error Tracking, Performance Monitoring & Debug Systems

> **Date:** February 11, 2026 | **Status:** Complete
> **Input:** Phases 01-10
> **Extension:** Focus Mode - Blocker v1.0.0 (Manifest V3)

---

## Overview

Phase 11 establishes a comprehensive crash analytics and monitoring infrastructure for the Focus Mode - Blocker extension, designed around a strict privacy-first principle: all monitoring data stays local on the free tier, with optional anonymous telemetry available only for Pro users who explicitly opt in. Five specialized agents produced deliverables covering error tracking with Sentry integration, custom analytics with performance monitoring, session replay with alerting pipelines, debug tooling with best practices, and a unifying integration architecture that maps how all monitoring components connect across the extension's service worker, content scripts, popup, options page, block page, and onboarding flow.

The system is architected to have negligible impact on Focus Mode's core functionality. Total monitoring overhead is budgeted at less than 5ms per user action, less than 500KB of storage, and zero impact on site blocking latency (since declarativeNetRequest operates independently at the network layer). Error recovery strategies ensure that service worker crashes, storage quota limits, rule failures, and lost alarms are all handled gracefully with automatic recovery and no data loss for the user's active focus session.

---

## Agent Deliverables

### Agent 1 — Error Tracking & Sentry Integration
**File:** `docs/monitoring/agent1-error-tracking-sentry.md`

- Central `ErrorTracker` module for the service worker that captures, deduplicates, fingerprints, and classifies all errors from every execution context
- Error fingerprinting via SHA-256 hash of error message and top stack frame, with configurable dedup window (5-minute default)
- Severity classification system: Critical (blocking broken, data loss), High (feature degraded), Medium (non-critical failure), Low (cosmetic/expected)
- Content script error capture via `REPORT_ERROR` message type with automatic PII scrubbing
- UI page error capture via `UIErrorHandler` class (window.onerror, unhandledrejection) with batched `REPORT_ERRORS_BATCH` messaging
- Sentry SDK integration for Pro + opt-in users: lazy-loaded SDK, sanitized payloads, custom fingerprinting, environment tagging
- Batch sending via chrome.alarms with retry queue (max 100 pending, 3 retry cycles before discard)

### Agent 2 — Custom Analytics & Performance Monitoring
**File:** `docs/monitoring/agent2-analytics-performance.md`

- Local analytics engine with 500-event rolling window stored in chrome.storage.local
- `MemoryMonitor` module: 60-second sampling interval, 1-hour sliding window (60 samples), monotonic increase leak detection (10+ consecutive rises triggers warning)
- `CPUMonitor` module: `performance.now()` wrapping for all chrome.* API calls, per-operation aggregate stats (count, min, max, p50, p95, p99), slow operation detection (>100ms threshold)
- `StartupTiming` module: service worker boot measurement from install through activate to first message, cold vs warm start classification, 50-startup history for trending
- Pro telemetry sender: anonymous usage events (session counts, average scores, feature flags) with hashed instance ID, batched every 5 minutes
- Performance event pipeline feeding both local analytics and optional remote telemetry

### Agent 3 — Session Replay & Alerting System
**File:** `docs/monitoring/agent3-session-replay-alerting.md`

- Session replay system for extension UI pages only (popup, options, block page, onboarding) — never records user web pages
- DOM mutation observer with throttled snapshots, action annotations (clicks, inputs, navigation), and compressed replay storage
- Replay viewer for support diagnostics: timeline scrubbing, event filtering, export to support ticket
- Alerting pipeline: error spike detection (>5x baseline in 5-minute window), new critical error alerts, memory leak warnings, storage quota warnings
- Slack and Discord webhook integration with structured alert payloads, severity-based channel routing, and 30-minute cooldown per alert fingerprint
- Grafana dashboard specifications: error rate time series, error breakdown by module/severity, performance percentiles, memory trending, startup duration histogram, active user estimate

### Agent 4 — Debug Mode & Best Practices
**File:** `docs/monitoring/agent4-debug-bestpractices.md`

- `DebugLogger` module: 1000-entry circular buffer (in-memory), four log levels (debug, info, warn, error), per-module filtering, structured data attachments
- Debug mode toggle: options page switch, keyboard shortcut (Ctrl+Shift+D in popup), `TOGGLE_DEBUG_MODE` message type
- Log export: JSON download with metadata (version, instance ID, timestamp range), clipboard copy for quick sharing, filtered export by module/level/time range
- Error classification taxonomy mapping common Focus Mode failures to categories, suggested fixes, and knowledge base articles
- Remote debug manager (Pro only): real-time log streaming to telemetry server, support-initiated debug sessions with time-limited tokens
- Best practices guide: error handling patterns for each module type (sync, async, event listener), testing strategies for error paths, monitoring code review checklist

### Agent 5 — Integration Architecture
**File:** `docs/monitoring/agent5-integration-architecture.md`

- End-to-end architecture diagram showing data flow from all 4 execution contexts (service worker, content scripts, UI pages, onboarding) through ErrorTracker to local analytics and optional remote delivery
- Module-by-module integration map for all 18 service worker modules: monitored events, severity levels, capture patterns
- 6 new message types (REPORT_ERROR, REPORT_ERRORS_BATCH, REPORT_PERFORMANCE, GET_DEBUG_LOGS, TOGGLE_DEBUG_MODE, GET_HEALTH_STATUS) integrated with existing 22 types
- Storage schema: 10 new chrome.storage.local keys under `monitoring.*` namespace with size budgets, eviction policies, and migration logic
- Privacy architecture: data classification matrix, PII scrubbing pipeline (5-stage), consent flow, detailed breakdown of Sentry and telemetry payloads
- Error recovery strategies for 6 failure scenarios: SW crash during session, storage quota exceeded, rule failure, lost alarm, network failure, content script injection failure
- Performance budget: per-operation limits, aggregate limits, critical path protection rules, self-monitoring circuit breaker

---

## Key Design Decisions

### Privacy-First Monitoring

The monitoring system enforces a hard boundary between local-only and remote data:

- **Free tier:** ALL monitoring data stays on device. No network requests to Sentry, telemetry servers, or any external endpoint. Error logs, performance metrics, debug output, Focus Score history, streak data, and session history are stored exclusively in chrome.storage.local and in-memory buffers.
- **Pro tier:** Optional anonymous telemetry requires explicit user opt-in during Pro onboarding or via the options page. The `monitoring.telemetryOptIn` flag is never auto-enabled. Session replay requires a separate consent toggle (`monitoring.sessionReplayConsent`) and only records extension UI pages.
- **Error reports scrub all PII:** A 5-stage pipeline removes domains, URLs, email addresses, IP addresses, license keys, and file:// paths before any data leaves the extension. Blocked domains are never included in any remote payload.
- **Session replay scope:** Replay is restricted to extension-owned pages (popup, options, block page, onboarding). The system never records, observes, or captures any content on user web pages.

### Performance Impact Budget

Monitoring is designed to be invisible to the user:

- **Total monitoring overhead:** <5ms per user action (error capture <1ms, analytics recording <2ms, debug logging <0.5ms)
- **Monitoring storage footprint:** <500KB total (~168KB persisted + ~200KB in-memory debug buffer)
- **Zero impact on blocking latency:** declarativeNetRequest operates at the network layer independently of the service worker. Even if monitoring code is executing, site blocking is unaffected.
- **Non-blocking remote sends:** Telemetry batch sends use fire-and-forget fetch() with 5-second timeouts. Failed sends are queued and retried without blocking any user-facing operation.
- **Self-monitoring circuit breaker:** If error rate exceeds 100 errors in 5 minutes, the system automatically enables 10% sampling to prevent runaway resource consumption.

### Monitoring Layers

The system is organized into four layers that can operate independently:

1. **Client-side (always active):** ErrorTracker captures and classifies errors. DebugLogger records structured log entries. MemoryMonitor samples heap usage. CPUMonitor tracks API call latency. StartupTiming measures boot performance. All data stays local in chrome.storage.local and in-memory buffers.

2. **Transport (Pro + opt-in):** Batched sends via chrome.alarms every 5 minutes. Failed sends re-queued with 15-minute retry interval. Maximum 3 retry cycles per error before discard. All payloads pass through the PII scrubbing pipeline before transmission.

3. **Server-side (Pro + opt-in):** Sentry receives sanitized error reports with fingerprinting and severity tags. Custom telemetry server receives anonymous usage events (session counts, score averages, feature flags). Both endpoints are configured in manifest.json host_permissions for Pro builds only.

4. **Alerting (server-side):** Slack and Discord webhooks with spike detection (>5x baseline in 5-minute window). Per-fingerprint cooldown (30 minutes) to prevent alert fatigue. Severity-based channel routing (critical to #alerts-critical, others to #alerts-general). Grafana dashboards for real-time visualization of error rates, performance percentiles, memory trends, and startup timing.

---

## Implementation Priority

| Priority | Component | Agent | Complexity | Est. Effort |
|----------|-----------|-------|------------|-------------|
| P0 | Service worker error handler (ErrorTracker) | Agent 1 | Medium | 1-2 days |
| P0 | Content script error capture (REPORT_ERROR) | Agent 1 | Low | 0.5 day |
| P0 | UI error handling — popup, block page, options (UIErrorHandler) | Agent 1 | Medium | 1 day |
| P0 | Local analytics engine (500-event rolling window) | Agent 2 | Medium | 1-2 days |
| P1 | Debug logger + debug mode toggle | Agent 4 | Medium | 1 day |
| P1 | Memory and CPU monitoring (MemoryMonitor, CPUMonitor) | Agent 2 | Medium | 1-2 days |
| P1 | Startup timing measurement (StartupTiming) | Agent 2 | Low | 0.5 day |
| P1 | Error classification system and taxonomy | Agent 4 | Low | 0.5 day |
| P2 | Sentry integration (Pro, opt-in) | Agent 1 | Medium | 1-2 days |
| P2 | Slack/Discord alerting pipeline | Agent 3 | Medium | 1 day |
| P2 | Grafana dashboard configuration | Agent 3 | High | 2-3 days |
| P2 | Support tools + log export (JSON download, clipboard) | Agent 4 | Medium | 1 day |
| P3 | Session replay (Pro, opt-in, extension UI only) | Agent 3 | High | 2-3 days |
| P3 | Remote debug manager (Pro, support-initiated) | Agent 4 | Medium | 1-2 days |
| P3 | Pro telemetry sender (anonymous usage events) | Agent 2 | Medium | 1 day |

**Total estimated effort:** 14-20 days for a single developer, or 5-7 days with parallel agent workstreams.

**Recommended rollout order:**
1. **Week 1 (P0):** Ship local-only error tracking and analytics — immediate crash visibility with zero privacy risk
2. **Week 2 (P1):** Add debug tooling and performance monitoring — enables proactive issue detection
3. **Week 3 (P2):** Integrate Sentry, alerting, and Grafana — remote visibility for Pro users who opt in
4. **Week 4 (P3):** Session replay, remote debug, and telemetry — advanced diagnostics for support escalations

---

## Document Map

```
docs/
├── 11-crash-analytics-monitoring.md         <-- THIS FILE (consolidated overview)
└── monitoring/
    ├── agent1-error-tracking-sentry.md      Error tracking, Sentry integration, PII scrubbing
    ├── agent2-analytics-performance.md      Local analytics, memory/CPU/startup monitoring
    ├── agent3-session-replay-alerting.md    Session replay, alerting pipeline, Grafana dashboards
    ├── agent4-debug-bestpractices.md        Debug logger, debug mode, error taxonomy, support tools
    └── agent5-integration-architecture.md   Architecture diagrams, storage schema, privacy, recovery
```

---

*Phase 11 — Crash Analytics & Monitoring — Complete*
