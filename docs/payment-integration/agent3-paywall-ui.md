# Paywall UI Implementation — Focus Mode - Blocker

> **Agent 3 — Phase 09: Extension Payment Integration**
> Covers paywall modal architecture, trigger-specific content for all 10 triggers, JavaScript implementation, CSS specifications, analytics tracking, and integration points with the existing extension UI.

---

## Table of Contents

1. [Paywall Architecture](#1-paywall-architecture)
2. [Paywall Modal Design](#2-paywall-modal-design)
3. [Modal CSS Specification](#3-modal-css-specification)
4. [Trigger-Specific Content (All 10 Triggers)](#4-trigger-specific-content-all-10-triggers)
5. [Paywall JavaScript Implementation](#5-paywall-javascript-implementation)
6. [Paywall Tracking & Analytics](#6-paywall-tracking--analytics)
7. [Integration with Existing UI](#7-integration-with-existing-ui)
8. [Accessibility & Edge Cases](#8-accessibility--edge-cases)
9. [Testing Checklist](#9-testing-checklist)

---

## 1. Paywall Architecture

### 1.1 Component Structure

```
src/components/
├── paywall/
│   ├── paywall-modal.js          ← Main modal component (show/hide/render)
│   ├── paywall-modal.css         ← All paywall styles
│   ├── paywall-triggers.js       ← Trigger detection & eligibility logic
│   ├── paywall-content.js        ← Per-trigger headlines, copy, benefits, CTAs
│   └── paywall-analytics.js      ← Event tracking for paywall interactions
```

Each file has a single responsibility:

| File | Responsibility | Exported API |
|------|---------------|-------------|
| `paywall-modal.js` | DOM creation, mounting, animation, lifecycle | `showPaywall()`, `dismissPaywall()`, `isPaywallVisible()` |
| `paywall-modal.css` | Visual styling, responsive layout, animations | CSS classes only |
| `paywall-triggers.js` | Determines when to show paywalls, enforces rules | `canShowPaywall()`, `checkTrigger()`, `registerTrigger()` |
| `paywall-content.js` | Returns content objects for each trigger ID | `getPaywallContent(triggerId, context)` |
| `paywall-analytics.js` | Sends tracking events to storage/background | `trackPaywallEvent()`, `getPaywallStats()` |

### 1.2 Paywall State Machine

```
DORMANT ──► CHECK_ELIGIBLE ──► SHOW_PAYWALL ──► USER_ACTION ──► OUTCOME
  ▲                │ (fail)                          │              │
  │                ▼                                  │              │
  │            SUPPRESS                               │              │
  │               (no paywall shown)                  │              │
  │                                                   ▼              │
  │                                            ┌─────────────┐      │
  │                                            │  upgrade     │      │
  │                                            │  trial       │──────┘
  │                                            │  license     │
  │                                            │  dismiss     │
  │                                            └─────────────┘
  │                                                                  │
  └──────────────────────────────────────────────────────────────────┘
                        (cooldown expires, new trigger)
```

**State Descriptions:**

| State | Description | Duration |
|-------|-------------|----------|
| `DORMANT` | No paywall activity. Default state. | Until trigger fires |
| `CHECK_ELIGIBLE` | Validates all eligibility rules before displaying. | Synchronous check (~5ms) |
| `SUPPRESS` | Eligibility failed; trigger is silently ignored. | Instant transition back to DORMANT |
| `SHOW_PAYWALL` | Modal is visible, user is reading content. | Until user acts |
| `USER_ACTION` | User has clicked a button or dismissed. | Instant |
| `OUTCOME` | Result is tracked, cooldown timer begins. | 30-minute cooldown |

### 1.3 Eligibility Rules

These rules are enforced **before ANY paywall can display**. All five conditions must pass.

```javascript
// paywall-triggers.js

const PAYWALL_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes
const MIN_SESSIONS_BEFORE_PAYWALL = 3;       // No paywalls in sessions 1-2

/**
 * Master eligibility check. Every trigger calls this before displaying.
 * Returns { eligible: boolean, reason?: string }
 */
async function canShowPaywall() {
  // Rule 1: Session count must be >= 3 (no paywalls in first 2 sessions)
  const { sessionCount = 0 } = await chrome.storage.local.get('sessionCount');
  if (sessionCount < MIN_SESSIONS_BEFORE_PAYWALL) {
    return { eligible: false, reason: 'too_few_sessions' };
  }

  // Rule 2: Cooldown — at least 30 minutes since last paywall
  const { lastPaywallAt = 0 } = await chrome.storage.local.get('lastPaywallAt');
  if (lastPaywallAt && (Date.now() - lastPaywallAt) < PAYWALL_COOLDOWN_MS) {
    return { eligible: false, reason: 'cooldown_active' };
  }

  // Rule 3: NEVER during an active focus session
  const { focusSessionActive = false } = await chrome.storage.local.get('focusSessionActive');
  if (focusSessionActive) {
    return { eligible: false, reason: 'focus_session_active' };
  }

  // Rule 4: Pro users never see paywalls
  const { zovoLicense } = await chrome.storage.local.get('zovoLicense');
  if (zovoLicense && zovoLicense.isPro) {
    return { eligible: false, reason: 'already_pro' };
  }

  // Rule 5: Maximum 1 paywall per session (tracked via sessionPaywallShown flag)
  const { sessionPaywallShown = false } = await chrome.storage.local.get('sessionPaywallShown');
  if (sessionPaywallShown) {
    return { eligible: false, reason: 'session_limit_reached' };
  }

  return { eligible: true };
}
```

### 1.4 Trigger Registration System

Each feature area registers its trigger with the paywall system. This decouples feature code from paywall logic.

```javascript
// paywall-triggers.js

const registeredTriggers = new Map();

/**
 * Register a trigger that a feature area can fire.
 * @param {string} triggerId - e.g., 'T1', 'T2'
 * @param {object} config - { priority: number, featureName: string }
 */
function registerTrigger(triggerId, config) {
  registeredTriggers.set(triggerId, {
    ...config,
    fireCount: 0,
    lastFired: null,
  });
}

/**
 * Attempt to fire a trigger. Checks eligibility, then shows paywall if allowed.
 * @param {string} triggerId - Which trigger is firing
 * @param {object} context - Trigger-specific data (e.g., streak count, site name)
 * @returns {boolean} - Whether paywall was actually shown
 */
async function checkTrigger(triggerId, context = {}) {
  const eligibility = await canShowPaywall();
  if (!eligibility.eligible) {
    console.log(`[Paywall] Suppressed ${triggerId}: ${eligibility.reason}`);
    return false;
  }

  const trigger = registeredTriggers.get(triggerId);
  if (!trigger) {
    console.warn(`[Paywall] Unknown trigger: ${triggerId}`);
    return false;
  }

  // Update trigger stats
  trigger.fireCount++;
  trigger.lastFired = Date.now();

  // Show the paywall
  const { showPaywall } = await import('./paywall-modal.js');
  await showPaywall(triggerId, context);
  return true;
}
```

---

## 2. Paywall Modal Design

### 2.1 Base Modal Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [x]                                                         │
│                                                              │
│                    ┌─────────┐                              │
│                    │   PRO   │  ← Purple pill badge          │
│                    └─────────┘                              │
│                                                              │
│              [TRIGGER-SPECIFIC HEADLINE]                     │
│            [Trigger-specific subtext line]                   │
│                                                              │
│    ┌──────────────────────────────────────────────────┐     │
│    │                                                  │     │
│    │         [TRIGGER-SPECIFIC CONTENT AREA]          │     │
│    │     (blurred preview, comparison, slider, etc.)  │     │
│    │                                                  │     │
│    └──────────────────────────────────────────────────┘     │
│                                                              │
│    What you get with Pro:                                   │
│    ✓ [Benefit 1 — specific to the trigger]                  │
│    ✓ [Benefit 2 — related Pro capability]                   │
│    ✓ [Benefit 3 — broader Pro value]                        │
│                                                              │
│    ┌──────────────────────────────────────────────────┐     │
│    │                                                  │     │
│    │    [Trigger-Specific CTA — $4.99/mo]             │     │
│    │              ← Primary (purple)                  │     │
│    └──────────────────────────────────────────────────┘     │
│                                                              │
│    ┌──────────────────────────────────────────────────┐     │
│    │    [Start 7-Day Free Trial]                      │     │
│    │              ← Secondary (outlined)              │     │
│    └──────────────────────────────────────────────────┘     │
│                                                              │
│    Or save 40%: $2.99/mo billed annually                    │
│                                                              │
│    Already have a license? Enter key →                      │
│                                                              │
│    [Maybe later]  ← Ghost/text-only dismiss link            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Visual Hierarchy

The modal follows a deliberate visual hierarchy to maximize conversion:

1. **PRO Badge** — Immediately signals premium content
2. **Headline** — Trigger-specific, benefit-focused (not feature-focused)
3. **Content Area** — Shows the user what they are missing (blurred content, locked sliders, etc.)
4. **Benefits List** — Three checkmark items reinforcing value
5. **Primary CTA** — Prominent purple button, trigger-specific text
6. **Secondary CTA** — Trial option reduces commitment anxiety
7. **Annual Upsell** — "Save 40%" creates price anchoring
8. **License Entry** — For users who already purchased elsewhere
9. **Dismiss Link** — Always available, never hidden, low-emphasis

### 2.3 Animation Specifications

| Animation | Property | Duration | Easing | Trigger |
|-----------|----------|----------|--------|---------|
| Overlay fade in | opacity 0 to 1 | 200ms | ease-out | On show |
| Modal scale in | transform scale(0.95) to scale(1), opacity 0 to 1 | 300ms | cubic-bezier(0.16, 1, 0.3, 1) | On show, 50ms delay |
| Overlay fade out | opacity 1 to 0 | 150ms | ease-in | On dismiss |
| Modal scale out | transform scale(1) to scale(0.95), opacity 1 to 0 | 200ms | ease-in | On dismiss |
| Benefit checkmarks | opacity + translateY(8px) to translateY(0) | 200ms each | ease-out | Staggered, 50ms apart, after modal appears |
| CTA button pulse | box-shadow pulse with brand purple | 2s infinite | ease-in-out | 3 seconds after modal appears |

---

## 3. Modal CSS Specification

### 3.1 Complete Paywall CSS

```css
/* paywall-modal.css */

/* ============================================
   OVERLAY
   ============================================ */
.zovo-paywall-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 200ms ease-out;
  padding: 16px;
}

.zovo-paywall-overlay.zovo-paywall-visible {
  opacity: 1;
}

.zovo-paywall-overlay.zovo-paywall-closing {
  opacity: 0;
  transition: opacity 150ms ease-in;
}

/* ============================================
   MODAL CARD
   ============================================ */
.zovo-paywall-modal {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25),
              0 0 0 1px rgba(0, 0, 0, 0.05);
  max-width: 400px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 32px 24px 24px;
  position: relative;
  transform: scale(0.95);
  opacity: 0;
  transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1),
              opacity 300ms cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: 50ms;
}

.zovo-paywall-visible .zovo-paywall-modal {
  transform: scale(1);
  opacity: 1;
}

.zovo-paywall-closing .zovo-paywall-modal {
  transform: scale(0.95);
  opacity: 0;
  transition: transform 200ms ease-in, opacity 200ms ease-in;
  transition-delay: 0ms;
}

/* Scrollbar styling */
.zovo-paywall-modal::-webkit-scrollbar {
  width: 4px;
}

.zovo-paywall-modal::-webkit-scrollbar-track {
  background: transparent;
}

.zovo-paywall-modal::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 2px;
}

/* ============================================
   CLOSE BUTTON
   ============================================ */
.zovo-paywall-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 18px;
  line-height: 1;
  transition: background 150ms ease, color 150ms ease;
  padding: 0;
}

.zovo-paywall-close:hover {
  background: #f3f4f6;
  color: #4b5563;
}

.zovo-paywall-close:focus-visible {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
}

/* ============================================
   PRO BADGE
   ============================================ */
.zovo-paywall-badge {
  display: inline-block;
  background: #6366f1;
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  padding: 4px 14px;
  border-radius: 999px;
  margin: 0 auto 16px;
}

.zovo-paywall-badge-wrap {
  text-align: center;
}

/* ============================================
   HEADLINE & SUBTEXT
   ============================================ */
.zovo-paywall-headline {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  text-align: center;
  margin: 0 0 6px;
  line-height: 1.3;
}

.zovo-paywall-subtext {
  font-size: 14px;
  color: #6b7280;
  text-align: center;
  margin: 0 0 20px;
  line-height: 1.5;
}

/* ============================================
   CONTENT AREA (trigger-specific)
   ============================================ */
.zovo-paywall-content {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

/* Blurred content variant (T1, T4) */
.zovo-paywall-content--blurred {
  position: relative;
  overflow: hidden;
}

.zovo-paywall-content--blurred .zovo-paywall-content-inner {
  filter: blur(6px);
  user-select: none;
  pointer-events: none;
}

.zovo-paywall-content--blurred::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    180deg,
    rgba(249, 250, 251, 0) 0%,
    rgba(249, 250, 251, 0.8) 100%
  );
  pointer-events: none;
}

/* Locked item variant (T9, T10) */
.zovo-paywall-content-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.zovo-paywall-content-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  font-size: 14px;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
}

.zovo-paywall-content-list li:last-child {
  border-bottom: none;
}

.zovo-paywall-content-list li.zovo-locked {
  color: #9ca3af;
}

.zovo-paywall-content-list li .zovo-icon-check {
  color: #10b981;
  font-size: 16px;
  flex-shrink: 0;
}

.zovo-paywall-content-list li .zovo-icon-lock {
  color: #d1d5db;
  font-size: 16px;
  flex-shrink: 0;
}

/* Slider variant (T3, T7) */
.zovo-paywall-slider-track {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  position: relative;
  margin: 20px 0;
}

.zovo-paywall-slider-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1 0%, #a5b4fc 100%);
  border-radius: 4px;
  transition: width 300ms ease;
}

.zovo-paywall-slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.zovo-paywall-slider-labels .zovo-current {
  color: #6366f1;
  font-weight: 600;
}

.zovo-paywall-slider-labels .zovo-pro-max {
  color: #4f46e5;
  font-weight: 700;
}

/* Site list variant (T2) */
.zovo-paywall-site-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.zovo-paywall-site-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 13px;
  color: #374151;
}

.zovo-paywall-site-list li.zovo-blocked-new {
  color: #9ca3af;
  opacity: 0.6;
}

.zovo-paywall-site-list li .zovo-site-number {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #e0e7ff;
  color: #6366f1;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.zovo-paywall-site-list li.zovo-blocked-new .zovo-site-number {
  background: #f3f4f6;
  color: #9ca3af;
}

/* Streak variant (T6) */
.zovo-paywall-streak {
  text-align: center;
  padding: 16px 0;
}

.zovo-paywall-streak-count {
  font-size: 48px;
  font-weight: 800;
  color: #ef4444;
  line-height: 1;
  margin-bottom: 4px;
}

.zovo-paywall-streak-label {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 12px;
}

.zovo-paywall-streak-recover-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #fee2e2;
  border: 1px solid #fca5a5;
  border-radius: 8px;
  color: #dc2626;
  font-size: 13px;
  font-weight: 600;
  cursor: not-allowed;
  opacity: 0.7;
}

/* Sync variant (T8) */
.zovo-paywall-sync-graphic {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 20px 0;
}

.zovo-paywall-sync-device {
  width: 48px;
  height: 48px;
  background: #e0e7ff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.zovo-paywall-sync-arrows {
  color: #6366f1;
  font-size: 20px;
  animation: zovo-sync-pulse 2s infinite ease-in-out;
}

@keyframes zovo-sync-pulse {
  0%, 100% { opacity: 0.4; transform: scaleX(1); }
  50% { opacity: 1; transform: scaleX(1.1); }
}

/* ============================================
   BENEFITS LIST
   ============================================ */
.zovo-paywall-benefits-title {
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 10px;
}

.zovo-paywall-benefits {
  list-style: none;
  padding: 0;
  margin: 0 0 20px;
}

.zovo-paywall-benefits li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 4px 0;
  font-size: 14px;
  color: #374151;
  line-height: 1.4;
  opacity: 0;
  transform: translateY(8px);
  animation: zovo-benefit-appear 200ms ease-out forwards;
}

.zovo-paywall-benefits li:nth-child(1) { animation-delay: 400ms; }
.zovo-paywall-benefits li:nth-child(2) { animation-delay: 450ms; }
.zovo-paywall-benefits li:nth-child(3) { animation-delay: 500ms; }

@keyframes zovo-benefit-appear {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.zovo-paywall-benefits li::before {
  content: '✓';
  color: #6366f1;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
  margin-top: 1px;
}

/* ============================================
   CTA BUTTONS
   ============================================ */
.zovo-paywall-cta-primary {
  display: block;
  width: 100%;
  padding: 14px 20px;
  background: #6366f1;
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  text-align: center;
  transition: background 150ms ease, box-shadow 150ms ease, transform 100ms ease;
  margin-bottom: 10px;
  line-height: 1.3;
}

.zovo-paywall-cta-primary:hover {
  background: #4f46e5;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.zovo-paywall-cta-primary:active {
  transform: scale(0.98);
}

.zovo-paywall-cta-primary:focus-visible {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
}

/* CTA pulse animation — begins 3s after modal opens */
.zovo-paywall-cta-primary.zovo-pulse {
  animation: zovo-cta-pulse 2s infinite ease-in-out;
}

@keyframes zovo-cta-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(99, 102, 241, 0); }
}

.zovo-paywall-cta-secondary {
  display: block;
  width: 100%;
  padding: 12px 20px;
  background: transparent;
  color: #6366f1;
  border: 2px solid #e0e7ff;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
  transition: background 150ms ease, border-color 150ms ease;
  margin-bottom: 16px;
}

.zovo-paywall-cta-secondary:hover {
  background: #e0e7ff;
  border-color: #c7d2fe;
}

.zovo-paywall-cta-secondary:focus-visible {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
}

/* ============================================
   ANNUAL UPSELL
   ============================================ */
.zovo-paywall-annual {
  text-align: center;
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 12px;
}

.zovo-paywall-annual strong {
  color: #4f46e5;
  font-weight: 700;
}

/* ============================================
   LICENSE ENTRY LINK
   ============================================ */
.zovo-paywall-license-link {
  text-align: center;
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 8px;
}

.zovo-paywall-license-link a {
  color: #6366f1;
  text-decoration: none;
  cursor: pointer;
  font-weight: 500;
}

.zovo-paywall-license-link a:hover {
  text-decoration: underline;
}

/* License input (hidden until "Enter key" clicked) */
.zovo-paywall-license-input-wrap {
  display: none;
  margin-top: 8px;
}

.zovo-paywall-license-input-wrap.zovo-visible {
  display: flex;
  gap: 8px;
}

.zovo-paywall-license-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 13px;
  color: #374151;
  outline: none;
  transition: border-color 150ms ease;
}

.zovo-paywall-license-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.zovo-paywall-license-submit {
  padding: 8px 14px;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.zovo-paywall-license-submit:hover {
  background: #4f46e5;
}

/* ============================================
   DISMISS LINK
   ============================================ */
.zovo-paywall-dismiss {
  display: block;
  text-align: center;
  font-size: 13px;
  color: #9ca3af;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  width: 100%;
  transition: color 150ms ease;
}

.zovo-paywall-dismiss:hover {
  color: #6b7280;
}

/* ============================================
   URGENCY BANNER (T6 Streak Recovery)
   ============================================ */
.zovo-paywall-urgency {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  color: #dc2626;
  text-align: center;
  margin-bottom: 16px;
  font-weight: 500;
}

/* ============================================
   POPUP-SPECIFIC OVERRIDES
   Popups are 380px wide, so modal needs adjustments.
   ============================================ */
.zovo-paywall-overlay--popup {
  padding: 0;
  position: absolute;
}

.zovo-paywall-overlay--popup .zovo-paywall-modal {
  max-width: 100%;
  border-radius: 0;
  max-height: 100%;
  box-shadow: none;
  padding: 24px 16px 16px;
}

.zovo-paywall-overlay--popup .zovo-paywall-headline {
  font-size: 19px;
}

/* ============================================
   DARK MODE SUPPORT (if user has system dark mode)
   ============================================ */
@media (prefers-color-scheme: dark) {
  .zovo-paywall-modal {
    background: #1f2937;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }

  .zovo-paywall-headline { color: #f9fafb; }
  .zovo-paywall-subtext { color: #9ca3af; }

  .zovo-paywall-content {
    background: #111827;
    border-color: #374151;
  }

  .zovo-paywall-benefits li { color: #d1d5db; }

  .zovo-paywall-close:hover { background: #374151; color: #d1d5db; }

  .zovo-paywall-cta-secondary {
    border-color: #4338ca;
    color: #a5b4fc;
  }

  .zovo-paywall-cta-secondary:hover {
    background: rgba(99, 102, 241, 0.15);
  }

  .zovo-paywall-dismiss { color: #6b7280; }
  .zovo-paywall-dismiss:hover { color: #9ca3af; }
}
```

---

## 4. Trigger-Specific Content (All 10 Triggers)

### 4.1 Content Data Structure

Each trigger returns a content object consumed by the modal renderer:

```javascript
// paywall-content.js

/**
 * @typedef {Object} PaywallContent
 * @property {string} triggerId      - Trigger identifier (T1-T10)
 * @property {string} headline       - Main headline text
 * @property {string} subtext        - Supporting subtext
 * @property {string} contentHTML    - Trigger-specific HTML for the content area
 * @property {string} contentClass  - Additional CSS class for content area
 * @property {string[]} benefits     - Array of 3 benefit strings
 * @property {string} ctaText        - Primary CTA button text
 * @property {string} ctaSecondary  - Secondary CTA text (default: "Start 7-Day Free Trial")
 * @property {string|null} urgency  - Optional urgency text (red banner)
 * @property {number} conversionMin - Expected min conversion rate (%)
 * @property {number} conversionMax - Expected max conversion rate (%)
 */
```

### 4.2 T1: Weekly Report (Blurred) — PRIMARY TRIGGER

| Field | Value |
|-------|-------|
| **Trigger ID** | `T1` |
| **When** | User opens the weekly report tab/section |
| **Expected Conversion** | 8-12% |
| **Priority** | Highest |

```javascript
// T1 content generator
function getT1Content(context) {
  const { totalFocusTime = '0h', totalBlocks = 0 } = context;

  return {
    triggerId: 'T1',
    headline: 'See Where Your Time Really Goes',
    subtext: 'Your full weekly report is ready. Unlock the breakdown.',
    contentClass: 'zovo-paywall-content--blurred',
    contentHTML: `
      <div class="zovo-paywall-content-inner">
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <div style="text-align:center;">
            <div style="font-size:24px;font-weight:800;color:#6366f1;">${totalFocusTime}</div>
            <div style="font-size:11px;color:#6b7280;">Focus Time</div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:24px;font-weight:800;color:#6366f1;">${totalBlocks}</div>
            <div style="font-size:11px;color:#6b7280;">Sites Blocked</div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:24px;font-weight:800;color:#6366f1;">73</div>
            <div style="font-size:11px;color:#6b7280;">Focus Score</div>
          </div>
        </div>
        <div style="height:80px;background:linear-gradient(90deg,#e0e7ff,#c7d2fe,#a5b4fc,#818cf8);border-radius:8px;margin-bottom:8px;"></div>
        <div style="display:flex;gap:4px;">
          <div style="flex:1;height:24px;background:#e0e7ff;border-radius:4px;"></div>
          <div style="flex:1;height:24px;background:#c7d2fe;border-radius:4px;"></div>
          <div style="flex:1;height:24px;background:#a5b4fc;border-radius:4px;"></div>
        </div>
      </div>
    `,
    benefits: [
      'Full weekly & monthly reports',
      'Time-per-site breakdown',
      'Focus trend analysis & recommendations',
    ],
    ctaText: 'Unblur My Report \u2014 $4.99/mo',
    ctaSecondary: 'Start 7-Day Free Trial',
    urgency: null,
    conversionMin: 8,
    conversionMax: 12,
  };
}
```

**UX Notes for T1:**
- The summary stats (Focus Time, Sites Blocked, Focus Score) are shown **unblurred** to give the user a taste of value.
- The detailed chart, daily breakdown, and recommendations are **blurred** with a gradient fade overlay.
- This trigger fires on every report view for free users, making it the highest-exposure paywall.

### 4.3 T2: 11th Site Added

| Field | Value |
|-------|-------|
| **Trigger ID** | `T2` |
| **When** | User attempts to add an 11th site to their blocklist |
| **Expected Conversion** | 5-8% |
| **Priority** | High |

```javascript
function getT2Content(context) {
  const { currentSites = [], newSite = 'example.com' } = context;

  const siteListHTML = currentSites.slice(0, 10).map((site, i) => `
    <li>
      <span class="zovo-site-number">${i + 1}</span>
      <span>${site}</span>
    </li>
  `).join('');

  return {
    triggerId: 'T2',
    headline: 'Your Blocklist Is Full',
    subtext: "You've used all 10 free slots. Most power users block 15\u201325 sites.",
    contentClass: '',
    contentHTML: `
      <ul class="zovo-paywall-site-list">
        ${siteListHTML}
        <li class="zovo-blocked-new">
          <span class="zovo-site-number">11</span>
          <span>${newSite}</span>
          <span class="zovo-icon-lock" style="margin-left:auto;">&#x1f512;</span>
        </li>
      </ul>
    `,
    benefits: [
      'Unlimited blocked sites',
      'Wildcard & regex patterns',
      'Category-based blocking',
    ],
    ctaText: 'Unlock Unlimited Sites',
    ctaSecondary: 'Start 7-Day Free Trial',
    urgency: null,
    conversionMin: 5,
    conversionMax: 8,
  };
}
```

**UX Notes for T2:**
- Show all 10 existing sites with numbered purple circles.
- The 11th site appears grayed out with a lock icon, making the limit feel tangible.
- The subtext uses social proof ("most power users") to normalize upgrading.

### 4.4 T3: Nuclear Extension Beyond 1 Hour

| Field | Value |
|-------|-------|
| **Trigger ID** | `T3` |
| **When** | User tries to set nuclear timer beyond the 1-hour free limit |
| **Expected Conversion** | 6-10% |
| **Priority** | High |

```javascript
function getT3Content(context) {
  const { requestedDuration = 2 } = context; // hours

  const fillPercent = Math.round((1 / 24) * 100);

  return {
    triggerId: 'T3',
    headline: 'Need Longer Focus Lock?',
    subtext: 'Free nuclear mode maxes at 1 hour. Pro goes up to 24 hours.',
    contentClass: '',
    contentHTML: `
      <div style="text-align:center;margin-bottom:8px;">
        <span style="font-size:32px;font-weight:800;color:#6366f1;">1hr</span>
        <span style="font-size:16px;color:#9ca3af;margin:0 8px;">\u2192</span>
        <span style="font-size:32px;font-weight:800;color:#4f46e5;">24hr</span>
      </div>
      <div class="zovo-paywall-slider-track">
        <div class="zovo-paywall-slider-fill" style="width:${fillPercent}%;"></div>
      </div>
      <div class="zovo-paywall-slider-labels">
        <span class="zovo-current">1hr (Free max)</span>
        <span class="zovo-pro-max">24hr (Pro)</span>
      </div>
    `,
    benefits: [
      'Nuclear mode up to 24 hours',
      'Password protection for nuclear',
      'Scheduled blocking windows',
    ],
    ctaText: 'Unlock 24-Hour Nuclear',
    ctaSecondary: 'Start 7-Day Free Trial',
    urgency: null,
    conversionMin: 6,
    conversionMax: 10,
  };
}
```

**UX Notes for T3:**
- The visual slider makes the limitation concrete: the tiny filled portion vs. the full bar.
- "1hr to 24hr" shown as large numbers for quick scanning.
- This trigger fires at a moment of high intent (user wants MORE focus), so conversion is strong.

### 4.5 T4: Focus Score Breakdown

| Field | Value |
|-------|-------|
| **Trigger ID** | `T4` |
| **When** | User taps on their Focus Score to see the detailed breakdown |
| **Expected Conversion** | 3-5% |
| **Priority** | Medium |

```javascript
function getT4Content(context) {
  const { focusScore = 72 } = context;

  return {
    triggerId: 'T4',
    headline: 'Understand Your Focus',
    subtext: `Your score is ${focusScore}. See exactly what\u2019s helping and hurting.`,
    contentClass: 'zovo-paywall-content--blurred',
    contentHTML: `
      <div class="zovo-paywall-content-inner">
        <div style="text-align:center;margin-bottom:12px;">
          <div style="font-size:48px;font-weight:800;color:#6366f1;">${focusScore}</div>
          <div style="font-size:12px;color:#6b7280;">Focus Score</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <div style="background:#e0e7ff;border-radius:8px;padding:10px;text-align:center;">
            <div style="font-size:16px;font-weight:700;color:#4f46e5;">85</div>
            <div style="font-size:10px;color:#6b7280;">Consistency</div>
          </div>
          <div style="background:#e0e7ff;border-radius:8px;padding:10px;text-align:center;">
            <div style="font-size:16px;font-weight:700;color:#4f46e5;">62</div>
            <div style="font-size:10px;color:#6b7280;">Duration</div>
          </div>
          <div style="background:#e0e7ff;border-radius:8px;padding:10px;text-align:center;">
            <div style="font-size:16px;font-weight:700;color:#4f46e5;">91</div>
            <div style="font-size:10px;color:#6b7280;">Blocks Resisted</div>
          </div>
          <div style="background:#e0e7ff;border-radius:8px;padding:10px;text-align:center;">
            <div style="font-size:16px;font-weight:700;color:#4f46e5;">48</div>
            <div style="font-size:10px;color:#6b7280;">Streak</div>
          </div>
        </div>
      </div>
    `,
    benefits: [
      'Full 4-factor score breakdown',
      'AI-powered focus recommendations',
      'Historical score trends',
    ],
    ctaText: 'See My Score Breakdown',
    ctaSecondary: 'Start 7-Day Free Trial',
    urgency: null,
    conversionMin: 3,
    conversionMax: 5,
  };
}
```

**UX Notes for T4:**
- The overall score number is shown unblurred (free value), but the 4-factor breakdown is blurred.
- The 4 quadrant cards give a teasing glimpse of what analysis looks like.
- Subtext dynamically includes the user's actual score for personalization.

### 4.6 T5: Custom Block Page

| Field | Value |
|-------|-------|
| **Trigger ID** | `T5` |
| **When** | User navigates to block page customization settings |
| **Expected Conversion** | 2-4% |
| **Priority** | Low |

```javascript
function getT5Content(context) {
  return {
    triggerId: 'T5',
    headline: 'Make It Yours',
    subtext: 'Customize the block page with your own quotes, images, and colors.',
    contentClass: '',
    contentHTML: `
      <div style="display:flex;flex-direction:column;gap:10px;">
        <div style="display:flex;align-items:center;gap:10px;padding:8px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;opacity:0.5;">
          <span style="font-size:18px;">&#x1f3a8;</span>
          <div>
            <div style="font-size:13px;font-weight:600;color:#374151;">Theme</div>
            <div style="font-size:11px;color:#9ca3af;">Minimal, Dark, Gradient, Nature</div>
          </div>
          <span style="margin-left:auto;font-size:14px;color:#d1d5db;">&#x1f512;</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;padding:8px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;opacity:0.5;">
          <span style="font-size:18px;">&#x1f4ac;</span>
          <div>
            <div style="font-size:13px;font-weight:600;color:#374151;">Custom Quote</div>
            <div style="font-size:11px;color:#9ca3af;">Add your own motivational text</div>
          </div>
          <span style="margin-left:auto;font-size:14px;color:#d1d5db;">&#x1f512;</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;padding:8px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;opacity:0.5;">
          <span style="font-size:18px;">&#x1f5bc;&#xfe0f;</span>
          <div>
            <div style="font-size:13px;font-weight:600;color:#374151;">Background Image</div>
            <div style="font-size:11px;color:#9ca3af;">Upload or choose from gallery</div>
          </div>
          <span style="margin-left:auto;font-size:14px;color:#d1d5db;">&#x1f512;</span>
        </div>
      </div>
    `,
    benefits: [
      'Custom block page themes',
      'Personal motivational quotes',
      'Custom background images',
    ],
    ctaText: 'Customize My Block Page',
    ctaSecondary: 'Start 7-Day Free Trial',
    urgency: null,
    conversionMin: 2,
    conversionMax: 4,
  };
}
```

### 4.7 T6: Streak Recovery

| Field | Value |
|-------|-------|
| **Trigger ID** | `T6` |
| **When** | User's streak breaks and they try to recover it |
| **Expected Conversion** | 4-7% |
| **Priority** | High (time-sensitive) |

```javascript
function getT6Content(context) {
  const { streakDays = 7 } = context;

  return {
    triggerId: 'T6',
    headline: `Don\u2019t Lose Your ${streakDays}-Day Streak!`,
    subtext: 'Pro users can recover a broken streak once per week.',
    contentClass: '',
    contentHTML: `
      <div class="zovo-paywall-streak">
        <div class="zovo-paywall-streak-count">${streakDays}</div>
        <div class="zovo-paywall-streak-label">day streak \u2014 broken</div>
        <div class="zovo-paywall-streak-recover-btn">
          &#x1f512; Recover Streak
        </div>
      </div>
    `,
    benefits: [
      'Streak recovery (1x per week)',
      'Streak freeze (earned through consistency)',
      'Full streak history & milestones',
    ],
    ctaText: 'Save My Streak \u2014 Upgrade to Pro',
    ctaSecondary: 'Start 7-Day Free Trial',
    urgency: 'Recover within 24 hours or it resets permanently',
    conversionMin: 4,
    conversionMax: 7,
  };
}
```

**UX Notes for T6:**
- This is the most emotionally charged trigger. The user has invested days of effort into their streak.
- The urgency banner ("Recover within 24 hours") creates FOMO without being manipulative.
- The large streak number in red makes the loss feel real.
- This trigger has a natural 24-hour window, so we allow it to bypass the normal session limit if the streak is at risk.

### 4.8 T7: Custom Timer Duration

| Field | Value |
|-------|-------|
| **Trigger ID** | `T7` |
| **When** | User tries to set focus/break timer to anything other than 25/5 |
| **Expected Conversion** | 2-3% |
| **Priority** | Low |

```javascript
function getT7Content(context) {
  const { requestedMinutes = 45 } = context;

  return {
    triggerId: 'T7',
    headline: 'Set Your Perfect Focus Duration',
    subtext: 'Pro users can set timers from 1 to 240 minutes.',
    contentClass: '',
    contentHTML: `
      <div style="text-align:center;margin-bottom:12px;">
        <div style="font-size:14px;color:#6b7280;margin-bottom:4px;">You selected</div>
        <div style="font-size:36px;font-weight:800;color:#6366f1;">${requestedMinutes} min</div>
        <div style="font-size:12px;color:#9ca3af;">Free users are limited to 25 min focus / 5 min break</div>
      </div>
      <div class="zovo-paywall-slider-track">
        <div class="zovo-paywall-slider-fill" style="width:${Math.round((requestedMinutes / 240) * 100)}%;"></div>
      </div>
      <div class="zovo-paywall-slider-labels">
        <span>1 min</span>
        <span class="zovo-current">${requestedMinutes} min</span>
        <span class="zovo-pro-max">240 min</span>
      </div>
    `,
    benefits: [
      'Custom focus durations (1\u2013240 min)',
      'Custom break durations',
      'Auto-start next session',
    ],
    ctaText: 'Unlock Custom Timers',
    ctaSecondary: 'Start 7-Day Free Trial',
    urgency: null,
    conversionMin: 2,
    conversionMax: 3,
  };
}
```

### 4.9 T8: Cross-Device Sync

| Field | Value |
|-------|-------|
| **Trigger ID** | `T8` |
| **When** | User looks for or clicks on sync option in settings |
| **Expected Conversion** | 5-8% |
| **Priority** | Medium |

```javascript
function getT8Content(context) {
  return {
    triggerId: 'T8',
    headline: 'Focus Everywhere',
    subtext: 'Sync your blocklist, settings, and stats across all your devices.',
    contentClass: '',
    contentHTML: `
      <div class="zovo-paywall-sync-graphic">
        <div class="zovo-paywall-sync-device">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2">
            <rect x="2" y="3" width="20" height="14" rx="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        </div>
        <div class="zovo-paywall-sync-arrows">
          <svg width="32" height="24" viewBox="0 0 32 24" fill="none" stroke="#6366f1" stroke-width="2">
            <path d="M4 8h20l-4-4"/>
            <path d="M28 16H8l4 4"/>
          </svg>
        </div>
        <div class="zovo-paywall-sync-device">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="9" y1="1" x2="15" y2="1"/>
          </svg>
        </div>
      </div>
      <div style="text-align:center;font-size:12px;color:#6b7280;">
        Your blocklist, settings, and stats \u2014 everywhere
      </div>
    `,
    benefits: [
      'Real-time cross-device sync',
      'Automatic cloud backup',
      'Settings portability across browsers',
    ],
    ctaText: 'Enable Cross-Device Sync',
    ctaSecondary: 'Start 7-Day Free Trial',
    urgency: null,
    conversionMin: 5,
    conversionMax: 8,
  };
}
```

### 4.10 T9: 3rd Pre-Built List

| Field | Value |
|-------|-------|
| **Trigger ID** | `T9` |
| **When** | User tries to enable a 3rd pre-built block list |
| **Expected Conversion** | 3-5% |
| **Priority** | Medium |

```javascript
function getT9Content(context) {
  const { attemptedCategory = 'Shopping' } = context;

  const categories = [
    { name: 'Social Media', free: true },
    { name: 'News', free: true },
    { name: 'Shopping', free: false },
    { name: 'Gaming', free: false },
    { name: 'Entertainment', free: false },
    { name: 'Adult', free: false },
  ];

  const listHTML = categories.map(cat => `
    <li class="${cat.free ? '' : 'zovo-locked'}">
      <span class="${cat.free ? 'zovo-icon-check' : 'zovo-icon-lock'}">
        ${cat.free ? '\u2713' : '\ud83d\udd12'}
      </span>
      <span>${cat.name}</span>
      ${cat.name === attemptedCategory ? '<span style="margin-left:auto;font-size:11px;color:#6366f1;font-weight:600;">Selected</span>' : ''}
    </li>
  `).join('');

  return {
    triggerId: 'T9',
    headline: 'Block Even More Distractions',
    subtext: 'Free includes Social Media and News. Pro unlocks all 6+ categories.',
    contentClass: '',
    contentHTML: `<ul class="zovo-paywall-content-list">${listHTML}</ul>`,
    benefits: [
      'All block categories (6+)',
      'Unlimited custom lists',
      'Category-level blocking',
    ],
    ctaText: 'Unlock All Categories',
    ctaSecondary: 'Start 7-Day Free Trial',
    urgency: null,
    conversionMin: 3,
    conversionMax: 5,
  };
}
```

### 4.11 T10: Sound Library (4th+ Sound)

| Field | Value |
|-------|-------|
| **Trigger ID** | `T10` |
| **When** | User tries to play a 4th or later ambient sound |
| **Expected Conversion** | 2-3% |
| **Priority** | Low |

```javascript
function getT10Content(context) {
  const { attemptedSound = 'Ocean Waves' } = context;

  const sounds = [
    { name: 'White Noise', free: true },
    { name: 'Rain', free: true },
    { name: 'Coffee Shop', free: true },
    { name: 'Ocean Waves', free: false },
    { name: 'Forest Birds', free: false },
    { name: 'Fireplace', free: false },
    { name: 'Thunderstorm', free: false },
    { name: 'Wind', free: false },
    { name: 'Piano', free: false },
    { name: 'Lo-Fi Beats', free: false },
    { name: 'Library', free: false },
    { name: 'Night Crickets', free: false },
    { name: 'River Stream', free: false },
    { name: 'City Ambience', free: false },
    { name: 'Temple Bells', free: false },
  ];

  const gridHTML = sounds.map(s => `
    <div style="display:flex;align-items:center;gap:6px;padding:6px 8px;background:${s.free ? '#e0e7ff' : '#f9fafb'};border-radius:6px;font-size:12px;color:${s.free ? '#4f46e5' : '#9ca3af'};">
      <span>${s.free ? '\u2713' : '\ud83d\udd12'}</span>
      <span style="font-weight:${s.name === attemptedSound ? '700' : '400'};">${s.name}</span>
    </div>
  `).join('');

  return {
    triggerId: 'T10',
    headline: 'More Focus Sounds',
    subtext: 'Pro unlocks 15+ ambient sounds and sound mixing.',
    contentClass: '',
    contentHTML: `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
        ${gridHTML}
      </div>
    `,
    benefits: [
      '15+ ambient focus sounds',
      'Sound mixing (layer multiple)',
      'Custom sound uploads',
    ],
    ctaText: 'Unlock Sound Library',
    ctaSecondary: 'Start 7-Day Free Trial',
    urgency: null,
    conversionMin: 2,
    conversionMax: 3,
  };
}
```

### 4.12 Content Dispatcher

```javascript
// paywall-content.js — main export

const CONTENT_GENERATORS = {
  T1: getT1Content,
  T2: getT2Content,
  T3: getT3Content,
  T4: getT4Content,
  T5: getT5Content,
  T6: getT6Content,
  T7: getT7Content,
  T8: getT8Content,
  T9: getT9Content,
  T10: getT10Content,
};

/**
 * Get paywall content for a specific trigger.
 * @param {string} triggerId - e.g., 'T1'
 * @param {object} context - Trigger-specific data
 * @returns {PaywallContent}
 */
export function getPaywallContent(triggerId, context = {}) {
  const generator = CONTENT_GENERATORS[triggerId];
  if (!generator) {
    throw new Error(`Unknown paywall trigger: ${triggerId}`);
  }
  return generator(context);
}
```

---

## 5. Paywall JavaScript Implementation

### 5.1 Main Modal Component (`paywall-modal.js`)

```javascript
// paywall-modal.js

import { getPaywallContent } from './paywall-content.js';
import { trackPaywallEvent } from './paywall-analytics.js';

let currentModal = null;
let pulseTimeout = null;

/**
 * Show a paywall modal for the given trigger.
 * @param {string} triggerId - Which trigger fired (T1-T10)
 * @param {object} context - Trigger-specific data
 * @returns {Promise<string>} - Outcome: 'upgrade', 'trial', 'license', 'dismiss'
 */
export function showPaywall(triggerId, context = {}) {
  return new Promise(async (resolve) => {
    // Prevent double-showing
    if (currentModal) {
      resolve('already_visible');
      return;
    }

    const content = getPaywallContent(triggerId, context);
    const overlay = createModalDOM(content);

    // Mount to DOM
    document.body.appendChild(overlay);

    // Force reflow for animation
    overlay.offsetHeight;

    // Trigger entrance animation
    requestAnimationFrame(() => {
      overlay.classList.add('zovo-paywall-visible');
    });

    // Start CTA pulse after 3 seconds
    pulseTimeout = setTimeout(() => {
      const primaryBtn = overlay.querySelector('.zovo-paywall-cta-primary');
      if (primaryBtn) primaryBtn.classList.add('zovo-pulse');
    }, 3000);

    // Track paywall shown
    await trackPaywallEvent('paywall_shown', {
      trigger_id: triggerId,
      feature: content.headline,
      session_count: (await chrome.storage.local.get('sessionCount')).sessionCount || 0,
    });

    // Set session paywall flag and last shown timestamp
    await chrome.storage.local.set({
      lastPaywallAt: Date.now(),
      lastPaywallTrigger: triggerId,
      sessionPaywallShown: true,
      paywallCount: ((await chrome.storage.local.get('paywallCount')).paywallCount || 0) + 1,
    });

    // Store reference and resolve callback
    currentModal = {
      overlay,
      triggerId,
      resolve,
    };

    // Attach all event listeners
    attachEventListeners(overlay, triggerId, resolve);
  });
}

/**
 * Check if a paywall modal is currently visible.
 * @returns {boolean}
 */
export function isPaywallVisible() {
  return currentModal !== null;
}

/**
 * Create the full modal DOM structure.
 * @param {PaywallContent} content
 * @returns {HTMLElement} - The overlay element
 */
function createModalDOM(content) {
  const overlay = document.createElement('div');
  overlay.className = 'zovo-paywall-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', `Upgrade to Pro: ${content.headline}`);

  // Detect if we are inside the popup (380px width)
  const isPopup = document.body.classList.contains('zovo-popup') ||
                  window.innerWidth <= 400;
  if (isPopup) {
    overlay.classList.add('zovo-paywall-overlay--popup');
  }

  overlay.innerHTML = `
    <div class="zovo-paywall-modal" role="document">
      <!-- Close button -->
      <button class="zovo-paywall-close" aria-label="Close" data-action="dismiss">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="4" y1="4" x2="12" y2="12"/>
          <line x1="12" y1="4" x2="4" y2="12"/>
        </svg>
      </button>

      <!-- PRO Badge -->
      <div class="zovo-paywall-badge-wrap">
        <span class="zovo-paywall-badge">PRO</span>
      </div>

      <!-- Headline & Subtext -->
      <h2 class="zovo-paywall-headline">${escapeHTML(content.headline)}</h2>
      <p class="zovo-paywall-subtext">${escapeHTML(content.subtext)}</p>

      <!-- Trigger-specific content area -->
      <div class="zovo-paywall-content ${content.contentClass || ''}">
        ${content.contentHTML}
      </div>

      ${content.urgency ? `
        <div class="zovo-paywall-urgency">${escapeHTML(content.urgency)}</div>
      ` : ''}

      <!-- Benefits -->
      <p class="zovo-paywall-benefits-title">What you get with Pro:</p>
      <ul class="zovo-paywall-benefits">
        ${content.benefits.map(b => `<li>${escapeHTML(b)}</li>`).join('')}
      </ul>

      <!-- Primary CTA -->
      <button class="zovo-paywall-cta-primary" data-action="upgrade">
        ${escapeHTML(content.ctaText)}
      </button>

      <!-- Secondary CTA (Trial) -->
      <button class="zovo-paywall-cta-secondary" data-action="trial">
        ${escapeHTML(content.ctaSecondary || 'Start 7-Day Free Trial')}
      </button>

      <!-- Annual upsell -->
      <div class="zovo-paywall-annual">
        Or <strong>save 40%</strong>: $2.99/mo billed annually
      </div>

      <!-- License entry -->
      <div class="zovo-paywall-license-link">
        Already have a license?
        <a href="#" data-action="show-license">Enter key \u2192</a>
      </div>
      <div class="zovo-paywall-license-input-wrap" id="zovo-license-input-wrap">
        <input type="text"
               class="zovo-paywall-license-input"
               placeholder="XXXX-XXXX-XXXX-XXXX"
               aria-label="License key"
               maxlength="19" />
        <button class="zovo-paywall-license-submit" data-action="submit-license">
          Activate
        </button>
      </div>

      <!-- Dismiss link -->
      <button class="zovo-paywall-dismiss" data-action="dismiss">
        Maybe later
      </button>
    </div>
  `;

  return overlay;
}

/**
 * Attach event listeners to the modal.
 */
function attachEventListeners(overlay, triggerId, resolve) {
  // Handle all button clicks via delegation
  overlay.addEventListener('click', async (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    const action = target.dataset.action;

    switch (action) {
      case 'upgrade':
        await handleUpgradeClick(triggerId);
        await dismissPaywall(overlay, triggerId, 'upgrade');
        resolve('upgrade');
        break;

      case 'trial':
        await handleTrialClick(triggerId);
        await dismissPaywall(overlay, triggerId, 'trial');
        resolve('trial');
        break;

      case 'show-license':
        e.preventDefault();
        handleLicenseClick(overlay);
        break;

      case 'submit-license':
        await handleLicenseSubmit(overlay, triggerId);
        resolve('license');
        break;

      case 'dismiss':
        await dismissPaywall(overlay, triggerId, 'dismiss_button');
        resolve('dismiss');
        break;
    }
  });

  // Close on overlay click (outside modal)
  overlay.addEventListener('click', async (e) => {
    if (e.target === overlay) {
      await dismissPaywall(overlay, triggerId, 'dismiss_overlay');
      resolve('dismiss');
    }
  });

  // Close on Escape key
  const escHandler = async (e) => {
    if (e.key === 'Escape') {
      document.removeEventListener('keydown', escHandler);
      await dismissPaywall(overlay, triggerId, 'dismiss_escape');
      resolve('dismiss');
    }
  };
  document.addEventListener('keydown', escHandler);

  // Trap focus within modal for accessibility
  const modal = overlay.querySelector('.zovo-paywall-modal');
  const focusableElements = modal.querySelectorAll(
    'button, a[href], input, [tabindex]:not([tabindex="-1"])'
  );
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  // Focus first element
  firstFocusable?.focus();

  modal.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable?.focus();
      }
    }
  });
}

/**
 * Dismiss the paywall with exit animation.
 */
async function dismissPaywall(overlay, triggerId, method) {
  if (pulseTimeout) {
    clearTimeout(pulseTimeout);
    pulseTimeout = null;
  }

  // Track dismissal
  await trackPaywallEvent('paywall_dismissed', {
    trigger_id: triggerId,
    dismiss_method: method,
  });

  // Exit animation
  overlay.classList.remove('zovo-paywall-visible');
  overlay.classList.add('zovo-paywall-closing');

  // Wait for animation, then remove from DOM
  await new Promise(r => setTimeout(r, 250));
  overlay.remove();
  currentModal = null;
}

/**
 * Handle upgrade button click.
 */
async function handleUpgradeClick(triggerId) {
  await trackPaywallEvent('paywall_upgrade_clicked', {
    trigger_id: triggerId,
    plan_type: 'monthly',
  });

  // Open the upgrade page in a new tab
  // The URL will be configured in the payment integration module
  const upgradeURL = await getUpgradeURL(triggerId, 'monthly');
  chrome.tabs.create({ url: upgradeURL });
}

/**
 * Handle trial button click.
 */
async function handleTrialClick(triggerId) {
  await trackPaywallEvent('paywall_trial_clicked', {
    trigger_id: triggerId,
  });

  const trialURL = await getUpgradeURL(triggerId, 'trial');
  chrome.tabs.create({ url: trialURL });
}

/**
 * Show the license key input field.
 */
function handleLicenseClick(overlay) {
  const wrap = overlay.querySelector('#zovo-license-input-wrap');
  wrap.classList.add('zovo-visible');

  const input = wrap.querySelector('.zovo-paywall-license-input');
  input.focus();

  trackPaywallEvent('paywall_license_clicked', {
    trigger_id: currentModal?.triggerId,
  });
}

/**
 * Handle license key submission.
 */
async function handleLicenseSubmit(overlay, triggerId) {
  const input = overlay.querySelector('.zovo-paywall-license-input');
  const key = input.value.trim();

  if (!key) {
    input.style.borderColor = '#ef4444';
    return;
  }

  const submitBtn = overlay.querySelector('.zovo-paywall-license-submit');
  submitBtn.textContent = 'Verifying...';
  submitBtn.disabled = true;

  try {
    // Send license key to background script for validation
    const result = await chrome.runtime.sendMessage({
      type: 'VALIDATE_LICENSE_KEY',
      key,
    });

    if (result.valid) {
      await trackPaywallEvent('license_activated', {
        trigger_id: triggerId,
        key_prefix: key.substring(0, 4),
      });
      await dismissPaywall(overlay, triggerId, 'license_activated');
    } else {
      submitBtn.textContent = 'Invalid Key';
      submitBtn.disabled = false;
      input.style.borderColor = '#ef4444';
      setTimeout(() => {
        submitBtn.textContent = 'Activate';
        input.style.borderColor = '';
      }, 2000);
    }
  } catch (err) {
    submitBtn.textContent = 'Error';
    submitBtn.disabled = false;
    setTimeout(() => {
      submitBtn.textContent = 'Activate';
    }, 2000);
  }
}

/**
 * Build the upgrade URL with attribution parameters.
 */
async function getUpgradeURL(triggerId, planType) {
  const { installId } = await chrome.storage.local.get('installId');
  const baseURL = 'https://zovo.dev/focus-mode-blocker/upgrade';

  const params = new URLSearchParams({
    trigger: triggerId,
    plan: planType,
    source: 'extension_paywall',
    install_id: installId || 'unknown',
    v: chrome.runtime.getManifest().version,
  });

  return `${baseURL}?${params.toString()}`;
}

/**
 * Escape HTML to prevent XSS in dynamic content.
 */
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
```

### 5.2 Auto-Format License Key Input

```javascript
// In paywall-modal.js — add to attachEventListeners

// Auto-format license key (XXXX-XXXX-XXXX-XXXX)
const licenseInput = overlay.querySelector('.zovo-paywall-license-input');
if (licenseInput) {
  licenseInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    let formatted = '';
    for (let i = 0; i < value.length && i < 16; i++) {
      if (i > 0 && i % 4 === 0) formatted += '-';
      formatted += value[i];
    }
    e.target.value = formatted;
  });
}
```

---

## 6. Paywall Tracking & Analytics

### 6.1 Analytics Module (`paywall-analytics.js`)

```javascript
// paywall-analytics.js

/**
 * Track a paywall-related event.
 * Events are stored locally and can be synced to analytics backend.
 *
 * @param {string} eventName - Event name (see table below)
 * @param {object} properties - Event properties
 */
export async function trackPaywallEvent(eventName, properties = {}) {
  const timestamp = Date.now();
  const event = {
    event: eventName,
    properties: {
      ...properties,
      timestamp,
      extension_version: chrome.runtime.getManifest().version,
    },
  };

  // Store event locally
  const { paywallEvents = [] } = await chrome.storage.local.get('paywallEvents');

  // Keep only last 200 events to avoid storage bloat
  const trimmedEvents = paywallEvents.slice(-199);
  trimmedEvents.push(event);

  await chrome.storage.local.set({ paywallEvents: trimmedEvents });

  // Also send to background script for optional server-side analytics
  try {
    await chrome.runtime.sendMessage({
      type: 'ANALYTICS_EVENT',
      payload: event,
    });
  } catch (err) {
    // Background script may not be listening; fail silently
    console.debug('[Paywall Analytics] Could not send to background:', err.message);
  }

  console.log(`[Paywall Analytics] ${eventName}`, properties);
}

/**
 * Get aggregate paywall statistics for the dashboard or debugging.
 * @returns {object} - Summary stats
 */
export async function getPaywallStats() {
  const { paywallEvents = [] } = await chrome.storage.local.get('paywallEvents');

  const stats = {
    totalShown: 0,
    totalDismissed: 0,
    totalUpgradeClicked: 0,
    totalTrialClicked: 0,
    totalLicenseClicked: 0,
    byTrigger: {},
    conversionRate: 0,
  };

  for (const event of paywallEvents) {
    const triggerId = event.properties?.trigger_id;

    if (!stats.byTrigger[triggerId]) {
      stats.byTrigger[triggerId] = {
        shown: 0,
        dismissed: 0,
        upgradeClicked: 0,
        trialClicked: 0,
      };
    }

    switch (event.event) {
      case 'paywall_shown':
        stats.totalShown++;
        stats.byTrigger[triggerId].shown++;
        break;
      case 'paywall_dismissed':
        stats.totalDismissed++;
        stats.byTrigger[triggerId].dismissed++;
        break;
      case 'paywall_upgrade_clicked':
        stats.totalUpgradeClicked++;
        stats.byTrigger[triggerId].upgradeClicked++;
        break;
      case 'paywall_trial_clicked':
        stats.totalTrialClicked++;
        stats.byTrigger[triggerId].trialClicked++;
        break;
      case 'paywall_license_clicked':
        stats.totalLicenseClicked++;
        break;
    }
  }

  if (stats.totalShown > 0) {
    stats.conversionRate = (
      ((stats.totalUpgradeClicked + stats.totalTrialClicked) / stats.totalShown) * 100
    ).toFixed(1);
  }

  return stats;
}
```

### 6.2 Events Reference

| Event | Properties | Purpose |
|-------|-----------|---------|
| `paywall_shown` | `trigger_id`, `feature`, `session_count` | Track every paywall impression |
| `paywall_dismissed` | `trigger_id`, `dismiss_method` | Track how users dismiss (button, overlay, escape) |
| `paywall_upgrade_clicked` | `trigger_id`, `plan_type` | Track upgrade intent (monthly/annual) |
| `paywall_trial_clicked` | `trigger_id` | Track trial starts separately from purchases |
| `paywall_license_clicked` | `trigger_id` | Track existing customers activating keys |
| `license_activated` | `trigger_id`, `key_prefix` | Track successful license activations |

### 6.3 Dismiss Method Values

| Value | Meaning |
|-------|---------|
| `dismiss_button` | Clicked "Maybe later" text link |
| `dismiss_overlay` | Clicked the dark overlay area outside the modal |
| `dismiss_escape` | Pressed the Escape key |
| `dismiss_close` | Clicked the X close button (same data-action as dismiss_button) |
| `upgrade` | Dismissed because user clicked upgrade (positive outcome) |
| `trial` | Dismissed because user clicked trial (positive outcome) |
| `license_activated` | Dismissed because license was successfully validated |

### 6.4 Cooldown Management

```javascript
// paywall-triggers.js — cooldown helpers

/**
 * After showing a paywall, update all cooldown-related storage.
 * This is called from paywall-modal.js after the modal appears.
 */
export async function setPaywallCooldown(triggerId) {
  const { paywallCount = 0 } = await chrome.storage.local.get('paywallCount');

  await chrome.storage.local.set({
    lastPaywallAt: Date.now(),
    lastPaywallTrigger: triggerId,
    sessionPaywallShown: true,
    paywallCount: paywallCount + 1,
  });
}

/**
 * Reset the session paywall flag. Called at the start of each new session.
 * A "session" is defined as the popup being opened after being fully closed
 * (not just navigating tabs within the popup).
 */
export async function resetSessionPaywall() {
  await chrome.storage.local.set({ sessionPaywallShown: false });
}

/**
 * Get the total number of paywalls a user has seen.
 * Useful for adjusting aggressiveness over time.
 */
export async function getPaywallCount() {
  const { paywallCount = 0 } = await chrome.storage.local.get('paywallCount');
  return paywallCount;
}

/**
 * Check if user has seen too many paywalls (fatigue prevention).
 * If they have dismissed 10+ paywalls, reduce frequency to 1 per day.
 */
export async function isPaywallFatigued() {
  const { paywallCount = 0 } = await chrome.storage.local.get('paywallCount');
  if (paywallCount < 10) return false;

  // After 10 paywalls, enforce 24-hour cooldown instead of 30 minutes
  const { lastPaywallAt = 0 } = await chrome.storage.local.get('lastPaywallAt');
  const twentyFourHours = 24 * 60 * 60 * 1000;
  return (Date.now() - lastPaywallAt) < twentyFourHours;
}
```

---

## 7. Integration with Existing UI

### 7.1 Popup Integration

The popup is the primary surface where most triggers fire. Integration requires modifying the popup's existing code to call trigger checks at the right moments.

**File:** `src/popup/popup.js`

```javascript
// At the top of popup.js
import { checkTrigger, registerTrigger, resetSessionPaywall } from '../components/paywall/paywall-triggers.js';

// Register all triggers on popup load
registerTrigger('T1', { priority: 1, featureName: 'Weekly Report' });
registerTrigger('T2', { priority: 2, featureName: 'Site Limit' });
registerTrigger('T4', { priority: 4, featureName: 'Focus Score' });
registerTrigger('T6', { priority: 3, featureName: 'Streak Recovery' });
registerTrigger('T7', { priority: 6, featureName: 'Custom Timer' });
registerTrigger('T10', { priority: 7, featureName: 'Sound Library' });

// Reset session flag on popup open
resetSessionPaywall();
```

**Trigger Integration Points in Popup:**

| Popup Location | Trigger | Code Hook |
|---------------|---------|-----------|
| Stats/Reports tab | T1 | When `renderWeeklyReport()` is called, check trigger and blur if needed |
| Add Site button | T2 | Before adding 11th site, intercept and call `checkTrigger('T2', { currentSites, newSite })` |
| Focus Score click | T4 | On score element click handler, call `checkTrigger('T4', { focusScore })` |
| Streak display | T6 | When streak is broken, on recovery button click call `checkTrigger('T6', { streakDays })` |
| Timer settings | T7 | When user changes timer to non-default value, call `checkTrigger('T7', { requestedMinutes })` |
| Sound selector | T10 | When user clicks a locked sound, call `checkTrigger('T10', { attemptedSound })` |

**Example: T1 Integration in Reports Tab**

```javascript
// Inside the reports tab render function
async function renderWeeklyReport() {
  const reportData = await getWeeklyReportData();

  // Check if user is Pro
  const { zovoLicense } = await chrome.storage.local.get('zovoLicense');
  const isPro = zovoLicense?.isPro;

  if (!isPro) {
    // Show blurred report and trigger paywall
    renderBlurredReport(reportData);
    await checkTrigger('T1', {
      totalFocusTime: reportData.totalFocusTime,
      totalBlocks: reportData.totalBlocks,
    });
  } else {
    renderFullReport(reportData);
  }
}
```

**Example: T2 Integration in Blocklist**

```javascript
// Inside the "add site" handler
async function handleAddSite(site) {
  const { blockedSites = [] } = await chrome.storage.local.get('blockedSites');

  if (blockedSites.length >= 10) {
    const { zovoLicense } = await chrome.storage.local.get('zovoLicense');
    if (!zovoLicense?.isPro) {
      const shown = await checkTrigger('T2', {
        currentSites: blockedSites,
        newSite: site,
      });
      if (shown) return; // Don't add the site; paywall is showing
    }
  }

  // Proceed with adding the site
  blockedSites.push(site);
  await chrome.storage.local.set({ blockedSites });
  renderBlocklist();
}
```

### 7.2 Options Page Integration

The options/settings page hosts triggers T3, T5, T8, and T9.

**File:** `src/options/options.js`

```javascript
import { checkTrigger, registerTrigger } from '../components/paywall/paywall-triggers.js';

registerTrigger('T3', { priority: 2, featureName: 'Nuclear Extension' });
registerTrigger('T5', { priority: 5, featureName: 'Custom Block Page' });
registerTrigger('T8', { priority: 4, featureName: 'Cross-Device Sync' });
registerTrigger('T9', { priority: 4, featureName: 'Pre-Built Lists' });
```

**PRO Lock Icon Pattern for Settings:**

Settings that require Pro should show a lock icon next to them. Clicking anywhere on the locked setting row triggers the relevant paywall.

```javascript
/**
 * Render a settings row with PRO lock.
 * @param {string} label - Setting label
 * @param {string} triggerId - Which paywall to show when clicked
 * @param {object} context - Trigger context data
 */
function renderProSetting(label, description, triggerId, context = {}) {
  return `
    <div class="zovo-setting-row zovo-setting-locked" data-trigger="${triggerId}">
      <div class="zovo-setting-info">
        <span class="zovo-setting-label">${label}</span>
        <span class="zovo-setting-description">${description}</span>
      </div>
      <span class="zovo-pro-lock-badge">
        <span class="zovo-pro-lock-icon">&#x1f512;</span>
        PRO
      </span>
    </div>
  `;
}

// Global click handler for locked settings
document.addEventListener('click', async (e) => {
  const lockedRow = e.target.closest('.zovo-setting-locked');
  if (!lockedRow) return;

  const triggerId = lockedRow.dataset.trigger;
  await checkTrigger(triggerId, getContextForTrigger(triggerId));
});
```

**CSS for PRO Lock Badge in Settings:**

```css
.zovo-setting-locked {
  cursor: pointer;
  opacity: 0.75;
  transition: opacity 150ms ease;
}

.zovo-setting-locked:hover {
  opacity: 1;
}

.zovo-pro-lock-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #e0e7ff;
  color: #6366f1;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.zovo-pro-lock-icon {
  font-size: 10px;
}
```

### 7.3 Block Page Integration

The block page (shown when a user visits a blocked site) does **NOT** show paywall modals. This is critical: the block page appears during focus sessions, and our rule is to **never interrupt focus**.

**Allowed on block page:**
- A subtle "PRO" badge next to the customization gear icon (if visible)
- Clicking the PRO badge does nothing during a focus session
- After a focus session ends, clicking it opens the options page where T5 can trigger

**Not allowed on block page:**
- No modal overlays
- No upgrade banners
- No paywall triggers of any kind
- No CTAs or prompts to upgrade

```javascript
// block-page.js — PRO badge only, no paywall

function renderCustomizeButton() {
  const { zovoLicense } = await chrome.storage.local.get('zovoLicense');
  const isPro = zovoLicense?.isPro;

  if (isPro) {
    return '<button class="zovo-customize-btn">Customize</button>';
  } else {
    return `
      <button class="zovo-customize-btn zovo-customize-locked" disabled title="Available with Pro">
        Customize
        <span class="zovo-pro-lock-badge-small">PRO</span>
      </button>
    `;
  }
}
```

### 7.4 Background Script Integration

The background script handles session counting, which is critical for paywall eligibility.

```javascript
// background.js — session tracking for paywall eligibility

chrome.runtime.onStartup.addListener(async () => {
  // Increment session count on browser startup
  const { sessionCount = 0 } = await chrome.storage.local.get('sessionCount');
  await chrome.storage.local.set({ sessionCount: sessionCount + 1 });

  // Reset per-session paywall flag
  await chrome.storage.local.set({ sessionPaywallShown: false });
});

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Initialize session count at 1
    await chrome.storage.local.set({
      sessionCount: 1,
      paywallCount: 0,
      sessionPaywallShown: false,
    });
  }
});

// Handle messages from paywall components
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'VALIDATE_LICENSE_KEY') {
    validateLicenseKey(message.key).then(sendResponse);
    return true; // async response
  }

  if (message.type === 'ANALYTICS_EVENT') {
    // Forward to analytics backend if configured
    forwardAnalyticsEvent(message.payload);
    sendResponse({ success: true });
  }
});
```

---

## 8. Accessibility & Edge Cases

### 8.1 Accessibility Requirements

| Requirement | Implementation |
|-------------|---------------|
| Screen reader support | `role="dialog"`, `aria-modal="true"`, `aria-label` on overlay |
| Focus trapping | Tab/Shift+Tab cycle within modal; focus first element on open |
| Keyboard dismiss | Escape key closes the modal |
| Color contrast | All text meets WCAG AA (4.5:1 for body, 3:1 for large text) |
| Reduced motion | Respect `prefers-reduced-motion` media query |
| Touch targets | All buttons are at least 44x44px tap targets |

**Reduced Motion Support:**

```css
@media (prefers-reduced-motion: reduce) {
  .zovo-paywall-overlay,
  .zovo-paywall-modal,
  .zovo-paywall-benefits li {
    transition: none !important;
    animation: none !important;
  }

  .zovo-paywall-visible .zovo-paywall-modal {
    transform: scale(1);
    opacity: 1;
  }

  .zovo-paywall-cta-primary.zovo-pulse {
    animation: none !important;
  }
}
```

### 8.2 Edge Cases

| Scenario | Handling |
|----------|---------|
| User opens popup while paywall is pending | Only one paywall at a time (`currentModal` guard) |
| Extension updates mid-session | Session paywall flag persists across reload |
| Storage quota exceeded | Trim `paywallEvents` to last 200 entries |
| User is offline | Paywall modal still shows; upgrade URL will load when online |
| License key validation fails (network) | Show "Error" briefly, then reset to "Activate" |
| User has multiple Chrome profiles | Session/paywall state is per-profile (chrome.storage.local) |
| Pro status expires | `zovoLicense.isPro` is re-checked each time `canShowPaywall()` runs |
| Multiple rapid trigger fires | `canShowPaywall()` checks `sessionPaywallShown` flag, only first trigger wins |
| Popup closes while paywall is shown | Modal is destroyed with popup; no dangling state |
| User clicks upgrade then navigates back | Paywall auto-dismissed on upgrade click; new tab opened |

### 8.3 Error Boundaries

```javascript
/**
 * Safe wrapper for showing paywalls. Never throws to caller.
 */
export async function safeCheckTrigger(triggerId, context = {}) {
  try {
    return await checkTrigger(triggerId, context);
  } catch (err) {
    console.error(`[Paywall] Error in trigger ${triggerId}:`, err);
    // Paywall errors should never break the main extension functionality
    return false;
  }
}
```

---

## 9. Testing Checklist

### 9.1 Manual Testing Matrix

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Paywall appears for T1 | Open extension > Stats tab > Weekly report | Blurred report + paywall modal |
| Paywall respects session 1-2 rule | Fresh install > trigger T1 | No paywall shown |
| Paywall respects 30-min cooldown | Dismiss paywall > trigger again within 30 min | No paywall shown |
| Paywall respects focus session | Start focus > trigger T2 | No paywall shown |
| Pro users never see paywall | Set `zovoLicense.isPro = true` > trigger any | No paywall shown |
| Only 1 paywall per session | Trigger T1, dismiss > trigger T2 in same session | Only T1 shown |
| Modal entrance animation | Trigger any paywall | Fade in + scale up (300ms) |
| Modal exit animation | Dismiss paywall | Scale down + fade out (200ms) |
| Close via X button | Click X | Modal closes, `paywall_dismissed` tracked |
| Close via overlay | Click dark overlay | Modal closes, `paywall_dismissed` tracked |
| Close via Escape | Press Escape | Modal closes, `paywall_dismissed` tracked |
| Close via "Maybe later" | Click "Maybe later" | Modal closes, `paywall_dismissed` tracked |
| Upgrade button | Click primary CTA | New tab opens with upgrade URL, modal closes |
| Trial button | Click "Start 7-Day Free Trial" | New tab opens with trial URL, modal closes |
| License entry | Click "Enter key" link | Input field appears and focuses |
| License validation | Enter valid key, click Activate | License activates, modal closes |
| License error | Enter invalid key | "Invalid Key" shown briefly |
| CTA pulse animation | Wait 3 seconds after paywall shows | Primary button starts pulsing |
| Focus trap | Tab through modal elements | Focus stays within modal |
| Keyboard accessibility | Navigate entirely with keyboard | All actions accessible |
| Dark mode | Set system dark mode | Modal uses dark theme |
| Popup layout | Open in popup (380px) | Modal fits without scroll issues |
| Annual upsell visible | Check modal content | "Save 40%: $2.99/mo" text present |

### 9.2 Analytics Verification

| Test | Expected Storage |
|------|-----------------|
| Paywall shown | `paywallEvents` contains `paywall_shown` with correct trigger_id |
| Paywall dismissed | `paywallEvents` contains `paywall_dismissed` with `dismiss_method` |
| Cooldown set | `lastPaywallAt` is updated to current timestamp |
| Session flag set | `sessionPaywallShown` is `true` after any paywall |
| Counter incremented | `paywallCount` increases by 1 |
| Events trimmed | After 200+ events, only most recent 200 remain |

### 9.3 Trigger Content Verification

For each trigger T1-T10, verify:

- [ ] Headline text matches specification
- [ ] Subtext is contextual (includes dynamic values where specified)
- [ ] Content area renders correctly (blurred, locked, slider, etc.)
- [ ] Three benefits are listed with checkmarks
- [ ] Primary CTA text matches specification
- [ ] Secondary CTA says "Start 7-Day Free Trial"
- [ ] Annual upsell text is present
- [ ] License entry link is present
- [ ] "Maybe later" dismiss link is present
- [ ] Urgency banner appears only for T6

### 9.4 Paywall Fatigue Prevention Verification

| Scenario | Expected |
|----------|----------|
| User has seen < 10 paywalls total | 30-minute cooldown between paywalls |
| User has seen 10+ paywalls total | 24-hour cooldown between paywalls |
| User upgrades to Pro | No more paywalls ever |
| User enters valid license key | No more paywalls ever |

---

## Appendix A: Storage Keys Used by Paywall System

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `sessionCount` | number | 0 | Incremented on each browser startup |
| `lastPaywallAt` | number | 0 | Timestamp of last paywall shown |
| `lastPaywallTrigger` | string | null | Trigger ID of last paywall shown |
| `sessionPaywallShown` | boolean | false | Whether a paywall has been shown this session |
| `paywallCount` | number | 0 | Total lifetime paywall impressions |
| `focusSessionActive` | boolean | false | Whether a focus session is currently active |
| `zovoLicense` | object | null | License state: `{ isPro, key, expiresAt, plan }` |
| `paywallEvents` | array | [] | Array of tracked paywall events (max 200) |
| `installId` | string | null | Unique installation identifier for attribution |

## Appendix B: URL Parameter Reference

When opening the upgrade page, the following query parameters are appended for attribution:

| Parameter | Example | Purpose |
|-----------|---------|---------|
| `trigger` | `T1` | Which paywall triggered the upgrade |
| `plan` | `monthly`, `annual`, `trial` | Which plan was selected |
| `source` | `extension_paywall` | Where the click originated |
| `install_id` | `abc123` | Unique install for attribution |
| `v` | `1.2.0` | Extension version |

## Appendix C: Conversion Rate Targets

| Trigger | Min % | Max % | Primary Lever |
|---------|-------|-------|---------------|
| T1: Weekly Report | 8 | 12 | Data curiosity (blurred content) |
| T2: 11th Site | 5 | 8 | Usage limit (power user signal) |
| T3: Nuclear Extension | 6 | 10 | High intent (wants more focus) |
| T4: Focus Score | 3 | 5 | Analytical curiosity |
| T5: Custom Block Page | 2 | 4 | Personalization desire |
| T6: Streak Recovery | 4 | 7 | Loss aversion (time-sensitive) |
| T7: Custom Timer | 2 | 3 | Customization preference |
| T8: Cross-Device Sync | 5 | 8 | Multi-device need |
| T9: 3rd Pre-Built List | 3 | 5 | Convenience |
| T10: Sound Library | 2 | 3 | Content discovery |

**Blended target:** 4-6% overall paywall-to-upgrade conversion across all triggers.
