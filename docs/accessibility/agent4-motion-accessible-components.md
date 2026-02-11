# Agent 4 — Motion & Animation + Accessible Components
## Phase 21: Accessibility Compliance — Focus Mode - Blocker

> **Date:** February 11, 2026 | **Agent:** 4 of 5 | **Status:** Complete
> **Scope:** Section 5 (Motion and Animation) + Section 6 (Accessible Components)
> **Dependencies:** Phase 08 (Branding — onboarding, visual system), Phase 09 (Payment — paywall modal), Phase 12 (MV3 — UI architecture, popup states), Phase 20 (Performance — animation performance budget)
> **Extension:** Focus Mode - Blocker v1.0.0 by Zovo
> **Tech:** Vanilla JavaScript, HTML, CSS — no frameworks — Manifest V3

---

## Table of Contents

1. [Section 5: Motion and Animation](#section-5-motion-and-animation)
   - [5.1 prefers-reduced-motion Foundation](#51-prefers-reduced-motion-foundation)
   - [5.2 Animation Inventory and Reduced-Motion Alternatives](#52-animation-inventory-and-reduced-motion-alternatives)
   - [5.3 AnimationController Class](#53-animationcontroller-class)
   - [5.4 Safe Animation Patterns and Motion Budget](#54-safe-animation-patterns-and-motion-budget)
   - [5.5 Block Page Motion Design](#55-block-page-motion-design)
2. [Section 6: Accessible Components](#section-6-accessible-components)
   - [6.1 Accessible Toggle Button (Nuclear Mode)](#61-accessible-toggle-button-nuclear-mode)
   - [6.2 Accessible Tab Bar (Home / Blocklist / Stats)](#62-accessible-tab-bar-home--blocklist--stats)
   - [6.3 Accessible Blocklist Manager](#63-accessible-blocklist-manager)
   - [6.4 Accessible Timer Display](#64-accessible-timer-display)
   - [6.5 Accessible Modal (Paywall + Confirmations)](#65-accessible-modal-paywall--confirmations)
   - [6.6 Accessible Toast Notifications](#66-accessible-toast-notifications)
   - [6.7 Accessible Dropdown/Select](#67-accessible-dropdownselect)
   - [6.8 Accessible Tooltip](#68-accessible-tooltip)
   - [6.9 Accessible Onboarding Wizard](#69-accessible-onboarding-wizard)

---

## Section 5: Motion and Animation

### 5.1 prefers-reduced-motion Foundation

Every animation in Focus Mode - Blocker must respect the user's system-level motion preference. The extension also provides its own manual override stored in `chrome.storage.sync` so users who prefer reduced motion in the extension alone (without changing their OS setting) can opt in.

#### Global Reduced-Motion Stylesheet

Add this to every extension surface (`popup.css`, `options.css`, `block.css`, `onboarding.css`):

```css
/* ============================================================
   File: src/styles/reduced-motion.css
   Imported by all extension page stylesheets.
   ============================================================ */

/*
  1. System-level preference via media query.
  2. Extension-level preference via [data-reduce-motion="true"] on <html>.
     The AnimationController class (Section 5.3) sets this attribute.
*/

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

html[data-reduce-motion="true"] *,
html[data-reduce-motion="true"] *::before,
html[data-reduce-motion="true"] *::after {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
  scroll-behavior: auto !important;
}
```

> **Why 0.01ms instead of 0s?** Setting duration to exactly `0s` can prevent `animationend` and `transitionend` events from firing, breaking JavaScript listeners that depend on those events. A near-zero duration fires the events immediately while still producing no visible motion.

---

### 5.2 Animation Inventory and Reduced-Motion Alternatives

Below is every animation in Focus Mode - Blocker with its default behavior and the corresponding reduced-motion alternative.

#### 5.2.1 Timer Countdown Ring (Popup — Home Tab)

The primary animation: an SVG circle whose `stroke-dashoffset` decreases over the session duration (e.g., 25 minutes for Pomodoro).

```css
/* --- Default: animated ring --- */
.timer-ring__circle--progress {
  stroke: var(--color-primary, #6366f1);
  stroke-width: 6;
  stroke-linecap: round;
  fill: none;
  /* circumference = 2 * PI * r; for r=54: ~339.29 */
  stroke-dasharray: 339.29;
  stroke-dashoffset: 339.29; /* starts full (empty ring) */
  transition: stroke-dashoffset 1s linear;
  transform: rotate(-90deg);
  transform-origin: center;
}

/* JavaScript updates stroke-dashoffset every second. */

/* --- Reduced motion: static progress bar --- */
@media (prefers-reduced-motion: reduce) {
  .timer-ring {
    display: none;
  }
  .timer-progress-bar {
    display: block;
  }
}

html[data-reduce-motion="true"] .timer-ring {
  display: none;
}
html[data-reduce-motion="true"] .timer-progress-bar {
  display: block;
}

.timer-progress-bar {
  display: none; /* hidden by default, shown in reduced motion */
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background-color: var(--color-surface-alt, #e2e8f0);
  overflow: hidden;
}

.timer-progress-bar__fill {
  height: 100%;
  border-radius: 4px;
  background-color: var(--color-primary, #6366f1);
  /* No transition — updated instantly via JS width change */
  width: 0%;
}
```

```html
<!-- Both variants live in popup.html; CSS toggles visibility -->
<div class="timer-ring" aria-hidden="true">
  <svg viewBox="0 0 120 120" width="120" height="120">
    <circle class="timer-ring__circle--track" cx="60" cy="60" r="54" />
    <circle class="timer-ring__circle--progress" cx="60" cy="60" r="54" />
  </svg>
</div>
<div class="timer-progress-bar" role="progressbar"
     aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"
     aria-label="Session progress">
  <div class="timer-progress-bar__fill"></div>
</div>
<!-- Large countdown number always visible -->
<div class="timer-display" role="timer" aria-live="off" aria-label="Time remaining">
  <span class="timer-display__time">25:00</span>
</div>
```

#### 5.2.2 Focus Score Ring (Popup — Stats Tab / Block Page)

Animated sweep fill that shows the user's current Focus Score (0-100).

```css
/* --- Default: animated fill over 800ms --- */
.score-ring__circle--fill {
  stroke: var(--color-success, #22c55e);
  stroke-dasharray: 339.29;
  stroke-dashoffset: 339.29;
  transition: stroke-dashoffset 800ms ease-out;
  transform: rotate(-90deg);
  transform-origin: center;
}

/* --- Reduced motion: instant fill --- */
@media (prefers-reduced-motion: reduce) {
  .score-ring__circle--fill {
    transition: none;
  }
}

html[data-reduce-motion="true"] .score-ring__circle--fill {
  transition: none;
}
```

#### 5.2.3 Streak Flame (Popup — Home Tab)

A subtle pulse/glow on the flame icon when the user has an active streak.

```css
/* --- Default: subtle pulse --- */
@keyframes streak-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.08); opacity: 0.85; }
}

.streak-flame--active {
  animation: streak-pulse 2s ease-in-out infinite;
}

/* --- Reduced motion: static icon, no pulse --- */
@media (prefers-reduced-motion: reduce) {
  .streak-flame--active {
    animation: none;
    transform: scale(1);
    opacity: 1;
  }
}

html[data-reduce-motion="true"] .streak-flame--active {
  animation: none;
  transform: scale(1);
  opacity: 1;
}
```

#### 5.2.4 Tab Switching Transitions (Popup — Home / Blocklist / Stats)

Content panels fade in/out when the user switches tabs.

```css
/* --- Default: cross-fade --- */
.tab-panel {
  opacity: 0;
  transition: opacity 200ms ease-in-out;
  display: none;
}

.tab-panel[aria-hidden="false"] {
  display: block;
  opacity: 1;
}

/* --- Reduced motion: instant switch --- */
@media (prefers-reduced-motion: reduce) {
  .tab-panel {
    transition: none;
    opacity: 1;
  }
}

html[data-reduce-motion="true"] .tab-panel {
  transition: none;
  opacity: 1;
}
```

#### 5.2.5 Blocklist Item Add/Remove (Popup — Blocklist Tab)

Items slide in from the left on add, slide out to the right on remove.

```css
/* --- Default: slide in/out --- */
@keyframes blocklist-item-enter {
  from { transform: translateX(-16px); opacity: 0; }
  to   { transform: translateX(0);     opacity: 1; }
}

@keyframes blocklist-item-exit {
  from { transform: translateX(0);     opacity: 1; }
  to   { transform: translateX(16px);  opacity: 0; }
}

.blocklist-item--entering {
  animation: blocklist-item-enter 200ms ease-out forwards;
}

.blocklist-item--exiting {
  animation: blocklist-item-exit 200ms ease-in forwards;
}

/* --- Reduced motion: instant appear/disappear --- */
@media (prefers-reduced-motion: reduce) {
  .blocklist-item--entering,
  .blocklist-item--exiting {
    animation: none;
    opacity: 1;
    transform: none;
  }
}

html[data-reduce-motion="true"] .blocklist-item--entering,
html[data-reduce-motion="true"] .blocklist-item--exiting {
  animation: none;
  opacity: 1;
  transform: none;
}
```

#### 5.2.6 Paywall Modal Enter/Exit (Popup / Options)

Slides up from the bottom with a backdrop fade.

```css
/* --- Default: slide up + backdrop fade --- */
.modal-backdrop {
  opacity: 0;
  transition: opacity 300ms ease-out;
}

.modal-backdrop--visible {
  opacity: 1;
}

.modal-dialog--paywall {
  transform: translateY(100%);
  transition: transform 300ms ease-out;
}

.modal-dialog--paywall.modal-dialog--open {
  transform: translateY(0);
}

/* Exit is faster than enter */
.modal-dialog--paywall.modal-dialog--closing {
  transition-duration: 200ms;
  transition-timing-function: ease-in;
  transform: translateY(100%);
}

/* --- Reduced motion: instant show/hide --- */
@media (prefers-reduced-motion: reduce) {
  .modal-backdrop {
    transition: none;
  }
  .modal-dialog--paywall {
    transition: none;
    transform: none;
  }
}

html[data-reduce-motion="true"] .modal-backdrop {
  transition: none;
}
html[data-reduce-motion="true"] .modal-dialog--paywall {
  transition: none;
  transform: none;
}
```

#### 5.2.7 Block Page Appearance

When a user visits a blocked site, the block page replaces the content. See Section 5.5 for full block page motion design.

#### 5.2.8 Session Start/End Transitions (Popup)

State change animations when the user starts or completes a focus session.

```css
/* --- Default: fade + scale pulse --- */
@keyframes session-start {
  0%   { opacity: 0; transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes session-end-celebrate {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.session-active-view--entering {
  animation: session-start 300ms ease-out forwards;
}

.session-complete-badge {
  animation: session-end-celebrate 400ms ease-in-out;
}

/* --- Reduced motion: instant --- */
@media (prefers-reduced-motion: reduce) {
  .session-active-view--entering {
    animation: none;
    opacity: 1;
    transform: none;
  }
  .session-complete-badge {
    animation: none;
    transform: none;
  }
}

html[data-reduce-motion="true"] .session-active-view--entering {
  animation: none;
  opacity: 1;
  transform: none;
}
html[data-reduce-motion="true"] .session-complete-badge {
  animation: none;
  transform: none;
}
```

#### 5.2.9 Onboarding Slide Transitions

Steps transition with a horizontal slide.

```css
/* --- Default: horizontal slide between steps --- */
.onboarding-step {
  position: absolute;
  inset: 0;
  opacity: 0;
  transform: translateX(100%);
  transition: transform 400ms ease-in-out, opacity 400ms ease-in-out;
}

.onboarding-step--active {
  opacity: 1;
  transform: translateX(0);
}

.onboarding-step--exiting-left {
  opacity: 0;
  transform: translateX(-100%);
}

/* --- Reduced motion: instant step change --- */
@media (prefers-reduced-motion: reduce) {
  .onboarding-step {
    transition: none;
    transform: none;
  }
  .onboarding-step--active {
    opacity: 1;
  }
  .onboarding-step:not(.onboarding-step--active) {
    opacity: 0;
  }
}

html[data-reduce-motion="true"] .onboarding-step {
  transition: none;
  transform: none;
}
html[data-reduce-motion="true"] .onboarding-step--active {
  opacity: 1;
}
html[data-reduce-motion="true"] .onboarding-step:not(.onboarding-step--active) {
  opacity: 0;
}
```

#### 5.2.10 Toast/Notification Animations

Toasts slide in from the top-right and slide out on dismiss.

```css
/* --- Default: slide in from right --- */
@keyframes toast-enter {
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}

@keyframes toast-exit {
  from { transform: translateX(0);    opacity: 1; }
  to   { transform: translateX(100%); opacity: 0; }
}

.toast--entering {
  animation: toast-enter 300ms ease-out forwards;
}

.toast--exiting {
  animation: toast-exit 200ms ease-in forwards;
}

/* --- Reduced motion: instant --- */
@media (prefers-reduced-motion: reduce) {
  .toast--entering,
  .toast--exiting {
    animation: none;
  }
  .toast--entering { opacity: 1; transform: none; }
  .toast--exiting  { opacity: 0; transform: none; }
}

html[data-reduce-motion="true"] .toast--entering,
html[data-reduce-motion="true"] .toast--exiting {
  animation: none;
}
html[data-reduce-motion="true"] .toast--entering { opacity: 1; transform: none; }
html[data-reduce-motion="true"] .toast--exiting  { opacity: 0; transform: none; }
```

#### 5.2.11 Button Press Feedback

Subtle scale on press to provide tactile feedback.

```css
/* --- Default: scale on active --- */
.btn {
  transition: transform 100ms ease-out, box-shadow 100ms ease-out;
}

.btn:active {
  transform: scale(0.97);
}

/* --- Reduced motion: opacity change instead of scale --- */
@media (prefers-reduced-motion: reduce) {
  .btn {
    transition: none;
  }
  .btn:active {
    transform: none;
    opacity: 0.8;
  }
}

html[data-reduce-motion="true"] .btn {
  transition: none;
}
html[data-reduce-motion="true"] .btn:active {
  transform: none;
  opacity: 0.8;
}
```

#### 5.2.12 Nuclear Mode Activation

A dramatic but accessible visual feedback when Nuclear Mode is activated.

```css
/* --- Default: brief flash + border pulse --- */
@keyframes nuclear-activate {
  0%   { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
  50%  { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
  100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}

.popup--nuclear-active {
  border: 2px solid var(--color-danger, #ef4444);
  animation: nuclear-activate 600ms ease-out;
}

/* --- Reduced motion: static border only, no animation --- */
@media (prefers-reduced-motion: reduce) {
  .popup--nuclear-active {
    animation: none;
    border: 2px solid var(--color-danger, #ef4444);
  }
}

html[data-reduce-motion="true"] .popup--nuclear-active {
  animation: none;
  border: 2px solid var(--color-danger, #ef4444);
}
```

---

### 5.3 AnimationController Class

A singleton that manages all animation preferences across Focus Mode - Blocker. Lives in `src/shared/animation-controller.js` and is imported by every extension page.

```js
/* ============================================================
   File: src/shared/animation-controller.js
   Manages motion preferences for Focus Mode - Blocker.
   ============================================================ */

class AnimationController {
  /** @type {AnimationController|null} */
  static #instance = null;

  /** @type {boolean} */
  #reducedMotion = false;

  /** @type {MediaQueryList|null} */
  #mediaQuery = null;

  /** @type {Map<string, { element: HTMLElement, pauseCallback: Function, resumeCallback: Function }>} */
  #registeredAnimations = new Map();

  /** @type {boolean} */
  #manualOverride = false;

  constructor() {
    if (AnimationController.#instance) {
      return AnimationController.#instance;
    }
    AnimationController.#instance = this;
  }

  /**
   * Initialize the controller. Call once per page on DOMContentLoaded.
   * @returns {Promise<void>}
   */
  async init() {
    // 1. Check system-level preference
    this.#mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const systemPrefers = this.#mediaQuery.matches;

    // 2. Check extension-level manual override from storage
    try {
      const stored = await chrome.storage.sync.get('reduceAnimations');
      this.#manualOverride = stored.reduceAnimations === true;
    } catch {
      this.#manualOverride = false;
    }

    // 3. Resolve: manual override OR system preference
    this.#reducedMotion = this.#manualOverride || systemPrefers;
    this.#applyToDocument();

    // 4. Listen for system preference changes
    this.#mediaQuery.addEventListener('change', (e) => {
      if (!this.#manualOverride) {
        this.#reducedMotion = e.matches;
        this.#applyToDocument();
        this.#notifyRegistered();
      }
    });

    // 5. Listen for storage changes (manual toggle from Options page)
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync' && changes.reduceAnimations) {
        this.#manualOverride = changes.reduceAnimations.newValue === true;
        this.#reducedMotion = this.#manualOverride || this.#mediaQuery.matches;
        this.#applyToDocument();
        this.#notifyRegistered();
      }
    });
  }

  /**
   * Set the data attribute on <html> so CSS rules activate.
   */
  #applyToDocument() {
    document.documentElement.setAttribute(
      'data-reduce-motion',
      String(this.#reducedMotion)
    );
  }

  /**
   * Notify all registered animations of the preference change.
   */
  #notifyRegistered() {
    for (const [, entry] of this.#registeredAnimations) {
      if (this.#reducedMotion) {
        entry.pauseCallback();
      } else {
        entry.resumeCallback();
      }
    }
  }

  /**
   * Whether reduced motion is currently active.
   * @returns {boolean}
   */
  get isReducedMotion() {
    return this.#reducedMotion;
  }

  /**
   * Programmatically set the manual override. Persists to chrome.storage.sync.
   * Used by the "Reduce animations" toggle on the Options page.
   * @param {boolean} enabled
   * @returns {Promise<void>}
   */
  async setManualOverride(enabled) {
    this.#manualOverride = enabled;
    this.#reducedMotion = enabled || this.#mediaQuery.matches;
    this.#applyToDocument();
    this.#notifyRegistered();
    await chrome.storage.sync.set({ reduceAnimations: enabled });
  }

  /**
   * Register an animation so it can be paused/resumed when preference changes.
   * @param {string} id - Unique identifier for this animation.
   * @param {HTMLElement} element - The animated element.
   * @param {Function} pauseCallback - Called when reduced motion activates.
   * @param {Function} resumeCallback - Called when reduced motion deactivates.
   */
  register(id, element, pauseCallback, resumeCallback) {
    this.#registeredAnimations.set(id, { element, pauseCallback, resumeCallback });
    // Immediately apply current state
    if (this.#reducedMotion) {
      pauseCallback();
    }
  }

  /**
   * Unregister an animation (e.g., when the element is removed from the DOM).
   * @param {string} id
   */
  unregister(id) {
    this.#registeredAnimations.delete(id);
  }

  /**
   * Create and insert an accessible pause button for pages with significant
   * animation (onboarding, block page). Pauses ALL registered animations.
   * @param {HTMLElement} container - Where to insert the pause button.
   * @returns {HTMLButtonElement}
   */
  createPauseButton(container) {
    const btn = document.createElement('button');
    btn.className = 'animation-pause-btn';
    btn.setAttribute('aria-label', 'Pause animations');
    btn.setAttribute('aria-pressed', 'false');
    btn.textContent = 'Pause animations';

    let paused = false;

    btn.addEventListener('click', () => {
      paused = !paused;
      btn.setAttribute('aria-pressed', String(paused));
      btn.textContent = paused ? 'Resume animations' : 'Pause animations';
      btn.setAttribute(
        'aria-label',
        paused ? 'Resume animations' : 'Pause animations'
      );

      for (const [, entry] of this.#registeredAnimations) {
        if (paused) {
          entry.pauseCallback();
        } else if (!this.#reducedMotion) {
          entry.resumeCallback();
        }
      }
    });

    container.appendChild(btn);
    return btn;
  }
}

// Export singleton
const animationController = new AnimationController();
export default animationController;
```

#### Pause Button Styles

```css
/* File: src/styles/animation-pause-btn.css */

.animation-pause-btn {
  position: fixed;
  bottom: 12px;
  right: 12px;
  z-index: 1000;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text, #1e293b);
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #cbd5e1);
  border-radius: 6px;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.animation-pause-btn:hover {
  background: var(--color-surface-alt, #f1f5f9);
}

.animation-pause-btn:focus-visible {
  outline: 2px solid var(--color-primary, #6366f1);
  outline-offset: 2px;
}

/* Hide the pause button when reduced motion is already active */
@media (prefers-reduced-motion: reduce) {
  .animation-pause-btn {
    display: none;
  }
}

html[data-reduce-motion="true"] .animation-pause-btn {
  display: none;
}
```

#### Usage on the Onboarding Page

```js
// File: src/pages/onboarding/onboarding.js (excerpt)
import animationController from '../../shared/animation-controller.js';

document.addEventListener('DOMContentLoaded', async () => {
  await animationController.init();

  const pageContainer = document.querySelector('.onboarding');
  animationController.createPauseButton(pageContainer);

  // Register the slide transition animation
  const stepContainer = document.querySelector('.onboarding-steps');
  animationController.register(
    'onboarding-slides',
    stepContainer,
    () => stepContainer.classList.add('no-animation'),
    () => stepContainer.classList.remove('no-animation')
  );
});
```

---

### 5.4 Safe Animation Patterns and Motion Budget

These constraints ensure animations stay performant (see Phase 20) and comfortable for all users, including those with vestibular disorders.

#### Motion Budget Table

| Animation | Max Duration | Max Distance | Easing | Layer |
|-----------|-------------|-------------|--------|-------|
| Timer ring tick | 1s (per tick) | N/A (stroke offset) | linear | Composited (transform) |
| Score ring fill | 800ms | N/A (stroke offset) | ease-out | Composited (transform) |
| Streak flame pulse | 2s (loop) | scale 1 to 1.08 | ease-in-out | Composited (transform) |
| Tab panel fade | 200ms | 0px (opacity only) | ease-in-out | Composited (opacity) |
| Blocklist item slide | 200ms | 16px | ease-out / ease-in | Composited (transform + opacity) |
| Modal enter | 300ms | Full height slide | ease-out | Composited (transform) |
| Modal exit | 200ms | Full height slide | ease-in | Composited (transform) |
| Toast enter | 300ms | Width of toast | ease-out | Composited (transform) |
| Toast exit | 200ms | Width of toast | ease-in | Composited (transform) |
| Session start | 300ms | scale 0.95 to 1 | ease-out | Composited (transform + opacity) |
| Button press | 100ms | scale to 0.97 | ease-out | Composited (transform) |
| Nuclear activate | 600ms | box-shadow 0-8px | ease-out | Paint (box-shadow) |
| Onboarding slide | 400ms | 100% width | ease-in-out | Composited (transform + opacity) |

#### Rules

1. **Prefer `transform` and `opacity` only.** These properties are composited on the GPU and do not trigger layout or paint. The Nuclear Mode box-shadow is the one exception (it fires once, not repeatedly).
2. **No animation longer than 800ms** for one-shot effects. Only continuous/looping animations (timer ring, streak pulse) may exceed this.
3. **No distance greater than 16px** for list-item motion. Modal and onboarding slides are exceptions because they represent full-view transitions.
4. **All looping animations must be pausable** via AnimationController or the pause button.
5. **Never animate `width`, `height`, `top`, `left`, `margin`, or `padding`** — these trigger expensive layout recalculations.
6. **Frame budget: maintain 60fps.** Animations should be GPU-composited. Test in Chrome DevTools Performance panel with 4x CPU throttling.

#### Safe Easing Curves

```css
:root {
  --ease-out:    cubic-bezier(0.33, 1, 0.68, 1);   /* Enter animations */
  --ease-in:     cubic-bezier(0.32, 0, 0.67, 0);   /* Exit animations */
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);   /* Symmetric transitions */
  --ease-linear: linear;                             /* Timer ring only */
}
```

---

### 5.5 Block Page Motion Design

The block page is the most emotionally significant surface in Focus Mode - Blocker. When a user visits a blocked site, they may be frustrated or tempted. The brand tone is "encouraging coach" — calm, supportive, never shaming.

#### Default Motion: Subtle Breathing Animation

```css
/* File: src/pages/block/block.css (excerpt) */

/* A calming "breathing" animation on the main icon.
   Mimics a 4-7-8 breathing rhythm: slow expansion, hold, slow contraction.
   Helps the user pause and refocus. */
@keyframes block-page-breathe {
  0%   { transform: scale(1);    opacity: 0.9; }
  30%  { transform: scale(1.04); opacity: 1; }
  55%  { transform: scale(1.04); opacity: 1; }
  100% { transform: scale(1);    opacity: 0.9; }
}

.block-page__icon {
  animation: block-page-breathe 6s ease-in-out infinite;
  will-change: transform, opacity;
}

/* The page itself fades in gently — not aggressively */
@keyframes block-page-enter {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.block-page {
  animation: block-page-enter 400ms ease-out forwards;
}

/* Timer on the block page uses the same ring as popup but larger */
.block-page .timer-ring__circle--progress {
  transition: stroke-dashoffset 1s linear;
}
```

#### Reduced Motion: Completely Static

```css
@media (prefers-reduced-motion: reduce) {
  .block-page__icon {
    animation: none;
    transform: none;
    opacity: 1;
  }
  .block-page {
    animation: none;
    opacity: 1;
  }
}

html[data-reduce-motion="true"] .block-page__icon {
  animation: none;
  transform: none;
  opacity: 1;
}
html[data-reduce-motion="true"] .block-page {
  animation: none;
  opacity: 1;
}
```

#### Block Page Animation Registration

```js
// File: src/pages/block/block.js (excerpt)
import animationController from '../../shared/animation-controller.js';

document.addEventListener('DOMContentLoaded', async () => {
  await animationController.init();

  const icon = document.querySelector('.block-page__icon');
  const blockPage = document.querySelector('.block-page');

  // Pause button for the block page
  animationController.createPauseButton(blockPage);

  // Register the breathing animation
  animationController.register(
    'block-page-breathe',
    icon,
    () => {
      icon.style.animation = 'none';
      icon.style.transform = 'none';
      icon.style.opacity = '1';
    },
    () => {
      icon.style.animation = '';
      icon.style.transform = '';
      icon.style.opacity = '';
    }
  );
});
```

**Design rationale:** The breathing animation is intentionally slow (6s cycle) and uses minimal scale (1.04x). It is not punishing or alarming. If the user finds even this distracting, the pause button or reduced-motion setting removes it entirely. The block page remains fully functional and readable with all animations disabled — it is text-first by design.

---

## Section 6: Accessible Components

Every component below is production-ready for Focus Mode - Blocker. Each provides complete HTML, CSS, and JavaScript with full ARIA semantics, keyboard navigation, and screen reader support.

---

### 6.1 Accessible Toggle Button (Nuclear Mode)

Nuclear Mode blocks all distracting sites immediately with tamper resistance. Enabling it is a significant action that requires confirmation.

#### HTML

```html
<!-- File: src/pages/popup/popup.html (excerpt) -->
<div class="nuclear-toggle-wrapper">
  <button
    id="nuclear-toggle"
    class="toggle-btn toggle-btn--nuclear"
    role="switch"
    aria-checked="false"
    aria-label="Nuclear Mode"
  >
    <span class="toggle-btn__icon" aria-hidden="true">
      <svg class="toggle-btn__icon--off" width="16" height="16" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5" fill="none"/>
      </svg>
      <svg class="toggle-btn__icon--on" width="16" height="16" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="6" fill="currentColor"/>
      </svg>
    </span>
    <span class="toggle-btn__track">
      <span class="toggle-btn__thumb"></span>
    </span>
    <span class="toggle-btn__label">Nuclear Mode</span>
    <span class="toggle-btn__status" aria-hidden="true">OFF</span>
  </button>
  <!-- Live region for state change announcements -->
  <div id="nuclear-status-live" class="sr-only" aria-live="assertive" aria-atomic="true"></div>
</div>
```

#### CSS

```css
/* File: src/styles/components/toggle-btn.css */

.toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: 2px solid var(--color-border, #cbd5e1);
  border-radius: 8px;
  background: var(--color-surface, #ffffff);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text, #1e293b);
  transition: border-color 150ms ease-out, background-color 150ms ease-out;
}

.toggle-btn:hover {
  border-color: var(--color-text-secondary, #64748b);
}

.toggle-btn:focus-visible {
  outline: 2px solid var(--color-primary, #6366f1);
  outline-offset: 2px;
}

/* Track */
.toggle-btn__track {
  position: relative;
  width: 36px;
  height: 20px;
  border-radius: 10px;
  background: var(--color-text-tertiary, #94a3b8);
  transition: background-color 150ms ease-out;
  flex-shrink: 0;
}

.toggle-btn[aria-checked="true"] .toggle-btn__track {
  background: var(--color-danger, #ef4444);
}

/* Thumb */
.toggle-btn__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ffffff;
  transition: transform 150ms ease-out;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.toggle-btn[aria-checked="true"] .toggle-btn__thumb {
  transform: translateX(16px);
}

/* Icons: show the correct one based on state */
.toggle-btn__icon--on  { display: none; }
.toggle-btn__icon--off { display: block; }

.toggle-btn[aria-checked="true"] .toggle-btn__icon--on  { display: block; }
.toggle-btn[aria-checked="true"] .toggle-btn__icon--off { display: none; }

/* Status text (visual only, not read by SR — live region handles that) */
.toggle-btn__status {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--color-text-secondary, #64748b);
  min-width: 24px;
}

.toggle-btn[aria-checked="true"] .toggle-btn__status {
  color: var(--color-danger, #ef4444);
}

/* Nuclear-specific styling when active */
.toggle-btn--nuclear[aria-checked="true"] {
  border-color: var(--color-danger, #ef4444);
  background: var(--color-danger-surface, #fef2f2);
}

/* Screen-reader-only utility */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

#### JavaScript

```js
// File: src/pages/popup/components/nuclear-toggle.js

/**
 * Accessible Nuclear Mode toggle with confirmation dialog.
 */
export function initNuclearToggle() {
  const toggle = document.getElementById('nuclear-toggle');
  const liveRegion = document.getElementById('nuclear-status-live');
  const statusText = toggle.querySelector('.toggle-btn__status');

  toggle.addEventListener('click', async () => {
    const isCurrentlyOn = toggle.getAttribute('aria-checked') === 'true';

    if (!isCurrentlyOn) {
      // Enabling Nuclear Mode — requires confirmation (see Section 6.5 for modal)
      const confirmed = await showConfirmationModal({
        title: 'Enable Nuclear Mode?',
        message:
          'All distracting sites will be blocked immediately. You will not be able to disable this until the timer expires.',
        confirmLabel: 'Enable Nuclear Mode',
        confirmDestructive: true,
        cancelLabel: 'Cancel',
      });

      if (!confirmed) return;
    }

    const newState = !isCurrentlyOn;
    toggle.setAttribute('aria-checked', String(newState));
    statusText.textContent = newState ? 'ON' : 'OFF';

    // Announce to screen readers
    liveRegion.textContent = newState
      ? 'Nuclear mode enabled. All distracting sites blocked.'
      : 'Nuclear mode disabled.';

    // Clear the live region after announcement completes
    setTimeout(() => { liveRegion.textContent = ''; }, 1000);

    // Persist state via message to service worker
    chrome.runtime.sendMessage({
      type: 'NUCLEAR_MODE_SET',
      enabled: newState,
    });
  });

  // Keyboard: Space and Enter are handled natively by <button>

  // Load initial state
  chrome.runtime.sendMessage({ type: 'NUCLEAR_MODE_GET' }, (response) => {
    if (response && response.enabled) {
      toggle.setAttribute('aria-checked', 'true');
      statusText.textContent = 'ON';
    }
  });
}
```

---

### 6.2 Accessible Tab Bar (Home / Blocklist / Stats)

The popup's primary navigation. Three tabs control which panel is visible.

#### HTML

```html
<!-- File: src/pages/popup/popup.html (excerpt) -->
<nav class="tab-bar" aria-label="Main navigation">
  <div role="tablist" aria-label="Popup sections" class="tab-bar__list">
    <button
      id="tab-home"
      role="tab"
      aria-selected="true"
      aria-controls="panel-home"
      tabindex="0"
      class="tab-bar__tab tab-bar__tab--active"
    >
      <svg class="tab-bar__icon" aria-hidden="true" width="16" height="16"><!-- home icon --></svg>
      <span>Home</span>
    </button>
    <button
      id="tab-blocklist"
      role="tab"
      aria-selected="false"
      aria-controls="panel-blocklist"
      tabindex="-1"
      class="tab-bar__tab"
    >
      <svg class="tab-bar__icon" aria-hidden="true" width="16" height="16"><!-- list icon --></svg>
      <span>Blocklist</span>
    </button>
    <button
      id="tab-stats"
      role="tab"
      aria-selected="false"
      aria-controls="panel-stats"
      tabindex="-1"
      class="tab-bar__tab"
    >
      <svg class="tab-bar__icon" aria-hidden="true" width="16" height="16"><!-- chart icon --></svg>
      <span>Stats</span>
    </button>
  </div>
</nav>

<main class="tab-panels">
  <section id="panel-home" role="tabpanel" aria-labelledby="tab-home" aria-hidden="false" class="tab-panel">
    <!-- Home content -->
  </section>
  <section id="panel-blocklist" role="tabpanel" aria-labelledby="tab-blocklist" aria-hidden="true" class="tab-panel" hidden>
    <!-- Blocklist content -->
  </section>
  <section id="panel-stats" role="tabpanel" aria-labelledby="tab-stats" aria-hidden="true" class="tab-panel" hidden>
    <!-- Stats content -->
  </section>
</main>
```

#### CSS

```css
/* File: src/styles/components/tab-bar.css */

.tab-bar__list {
  display: flex;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
  padding: 0 4px;
  gap: 0;
}

.tab-bar__tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary, #64748b);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: color 150ms, border-color 150ms;
}

.tab-bar__tab:hover {
  color: var(--color-text, #1e293b);
}

.tab-bar__tab:focus-visible {
  outline: 2px solid var(--color-primary, #6366f1);
  outline-offset: -2px;
  border-radius: 4px 4px 0 0;
}

/* Active tab: underline + bold color (not just color) */
.tab-bar__tab--active,
.tab-bar__tab[aria-selected="true"] {
  color: var(--color-primary, #6366f1);
  border-bottom-color: var(--color-primary, #6366f1);
  font-weight: 600;
}

.tab-bar__icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* Tab panels */
.tab-panel[hidden] {
  display: none;
}
```

#### JavaScript

```js
// File: src/pages/popup/components/tab-bar.js

/**
 * Accessible tab bar with arrow-key navigation.
 * Conforms to WAI-ARIA Tabs pattern.
 */
export function initTabBar() {
  const tablist = document.querySelector('[role="tablist"]');
  const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
  const panels = tabs.map((tab) =>
    document.getElementById(tab.getAttribute('aria-controls'))
  );

  function activateTab(tab) {
    // Deactivate all
    tabs.forEach((t, i) => {
      t.setAttribute('aria-selected', 'false');
      t.setAttribute('tabindex', '-1');
      t.classList.remove('tab-bar__tab--active');
      panels[i].setAttribute('aria-hidden', 'true');
      panels[i].hidden = true;
    });

    // Activate selected
    const index = tabs.indexOf(tab);
    tab.setAttribute('aria-selected', 'true');
    tab.setAttribute('tabindex', '0');
    tab.classList.add('tab-bar__tab--active');
    tab.focus();
    panels[index].setAttribute('aria-hidden', 'false');
    panels[index].hidden = false;
  }

  // Click handler
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => activateTab(tab));
  });

  // Keyboard navigation: Left/Right arrows, Home, End
  tablist.addEventListener('keydown', (e) => {
    const currentIndex = tabs.indexOf(document.activeElement);
    if (currentIndex === -1) return;

    let newIndex;
    switch (e.key) {
      case 'ArrowRight':
        newIndex = (currentIndex + 1) % tabs.length;
        break;
      case 'ArrowLeft':
        newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = tabs.length - 1;
        break;
      default:
        return; // Do not prevent default for other keys
    }

    e.preventDefault();
    activateTab(tabs[newIndex]);
  });
}
```

---

### 6.3 Accessible Blocklist Manager

The Blocklist tab lets users add domains to block and remove existing ones.

#### HTML

```html
<!-- File: src/pages/popup/popup.html — inside panel-blocklist -->
<div class="blocklist-manager">
  <div class="blocklist-manager__input-group" role="search">
    <label for="blocklist-input" class="sr-only">Add site to blocklist</label>
    <input
      id="blocklist-input"
      type="text"
      class="blocklist-manager__input"
      placeholder="e.g., twitter.com"
      aria-describedby="blocklist-input-hint blocklist-input-error"
      autocomplete="off"
    />
    <span id="blocklist-input-hint" class="sr-only">
      Enter a domain name and press Enter or click Add to block it.
    </span>
    <span id="blocklist-input-error" class="blocklist-manager__error" role="alert" aria-live="assertive"></span>
    <button
      id="blocklist-add-btn"
      class="btn btn--primary btn--sm"
      aria-label="Add site to blocklist"
    >
      Add
    </button>
  </div>

  <ul id="blocklist" class="blocklist" role="list" aria-label="Blocked sites">
    <!-- Items rendered dynamically -->
  </ul>

  <p id="blocklist-empty" class="blocklist-manager__empty" hidden>
    No sites blocked yet. Add a site above to get started.
  </p>

  <!-- Live region for announcing additions/removals -->
  <div id="blocklist-live" class="sr-only" aria-live="polite" aria-atomic="true"></div>
</div>
```

#### CSS

```css
/* File: src/styles/components/blocklist.css */

.blocklist-manager__input-group {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
}

.blocklist-manager__input {
  flex: 1;
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid var(--color-border, #cbd5e1);
  border-radius: 6px;
  background: var(--color-surface, #ffffff);
  color: var(--color-text, #1e293b);
}

.blocklist-manager__input:focus {
  outline: 2px solid var(--color-primary, #6366f1);
  outline-offset: -1px;
  border-color: var(--color-primary, #6366f1);
}

.blocklist-manager__input[aria-invalid="true"] {
  border-color: var(--color-danger, #ef4444);
}

.blocklist-manager__error {
  display: block;
  font-size: 12px;
  color: var(--color-danger, #ef4444);
  min-height: 16px;
  padding: 2px 0 0 12px;
}

.blocklist-manager__error:empty {
  display: none;
}

.blocklist {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 280px;
  overflow-y: auto;
}

.blocklist__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid var(--color-border-light, #f1f5f9);
  font-size: 14px;
  color: var(--color-text, #1e293b);
}

.blocklist__item:focus-within {
  background: var(--color-surface-alt, #f8fafc);
}

.blocklist__item-domain {
  display: flex;
  align-items: center;
  gap: 8px;
}

.blocklist__item-favicon {
  width: 16px;
  height: 16px;
  border-radius: 2px;
}

.blocklist__item-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 4px;
  color: var(--color-text-tertiary, #94a3b8);
  cursor: pointer;
}

.blocklist__item-remove:hover {
  background: var(--color-danger-surface, #fef2f2);
  color: var(--color-danger, #ef4444);
}

.blocklist__item-remove:focus-visible {
  outline: 2px solid var(--color-primary, #6366f1);
  outline-offset: 2px;
}

.blocklist-manager__empty {
  text-align: center;
  padding: 32px 16px;
  color: var(--color-text-secondary, #64748b);
  font-size: 14px;
}
```

#### JavaScript

```js
// File: src/pages/popup/components/blocklist-manager.js

/**
 * Accessible Blocklist Manager with keyboard support and
 * screen reader announcements.
 */
export function initBlocklistManager() {
  const input = document.getElementById('blocklist-input');
  const addBtn = document.getElementById('blocklist-add-btn');
  const list = document.getElementById('blocklist');
  const errorEl = document.getElementById('blocklist-input-error');
  const emptyEl = document.getElementById('blocklist-empty');
  const liveRegion = document.getElementById('blocklist-live');

  let sites = [];

  // Load initial blocklist
  chrome.runtime.sendMessage({ type: 'BLOCKLIST_GET' }, (response) => {
    if (response && response.sites) {
      sites = response.sites;
      renderList();
    }
  });

  function validateDomain(value) {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return { valid: false, error: 'Please enter a domain.' };
    // Basic domain pattern
    const domainPattern = /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/;
    // Strip protocol if user pasted a full URL
    const cleaned = trimmed.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!domainPattern.test(cleaned)) {
      return { valid: false, error: 'Enter a valid domain like "twitter.com".' };
    }
    if (sites.includes(cleaned)) {
      return { valid: false, error: `${cleaned} is already blocked.` };
    }
    return { valid: true, domain: cleaned };
  }

  function showError(message) {
    errorEl.textContent = message;
    input.setAttribute('aria-invalid', 'true');
  }

  function clearError() {
    errorEl.textContent = '';
    input.removeAttribute('aria-invalid');
  }

  function addSite() {
    const result = validateDomain(input.value);
    if (!result.valid) {
      showError(result.error);
      input.focus();
      return;
    }

    clearError();
    sites.push(result.domain);
    input.value = '';
    input.focus();

    chrome.runtime.sendMessage({
      type: 'BLOCKLIST_ADD',
      domain: result.domain,
    });

    renderList();
    announce(`${result.domain} added to blocklist.`);
  }

  function removeSite(domain) {
    sites = sites.filter((s) => s !== domain);

    chrome.runtime.sendMessage({
      type: 'BLOCKLIST_REMOVE',
      domain,
    });

    renderList();
    announce(`${domain} removed from blocklist.`);

    // Move focus to the input after removal
    input.focus();
  }

  function announce(message) {
    liveRegion.textContent = message;
    setTimeout(() => { liveRegion.textContent = ''; }, 1500);
  }

  function renderList() {
    list.innerHTML = '';
    emptyEl.hidden = sites.length > 0;

    sites.forEach((domain) => {
      const li = document.createElement('li');
      li.className = 'blocklist__item blocklist-item--entering';
      li.setAttribute('role', 'listitem');

      li.innerHTML = `
        <span class="blocklist__item-domain">
          <img class="blocklist__item-favicon"
               src="https://www.google.com/s2/favicons?domain=${domain}&sz=32"
               alt="" width="16" height="16" loading="lazy" />
          <span>${domain}</span>
        </span>
      `;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'blocklist__item-remove';
      removeBtn.setAttribute('aria-label', `Remove ${domain} from blocklist`);
      removeBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
        <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>`;
      removeBtn.addEventListener('click', () => removeSite(domain));

      li.appendChild(removeBtn);

      // Keyboard: Delete key on the list item removes it
      li.setAttribute('tabindex', '0');
      li.addEventListener('keydown', (e) => {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          removeSite(domain);
        }
      });

      list.appendChild(li);
    });
  }

  // Event listeners
  addBtn.addEventListener('click', addSite);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSite();
    }
  });

  // Clear error on typing
  input.addEventListener('input', clearError);
}
```

---

### 6.4 Accessible Timer Display

The timer is the core UI element during a focus session.

#### HTML

```html
<!-- File: src/pages/popup/popup.html — inside panel-home (session active state) -->
<div class="timer-container" aria-label="Focus session timer">
  <!-- SVG ring (hidden in reduced motion) -->
  <div class="timer-ring" aria-hidden="true">
    <svg viewBox="0 0 120 120" width="120" height="120">
      <circle class="timer-ring__circle--track"
              cx="60" cy="60" r="54"
              stroke="var(--color-border-light, #e2e8f0)"
              stroke-width="6" fill="none" />
      <circle class="timer-ring__circle--progress"
              id="timer-ring-progress"
              cx="60" cy="60" r="54"
              stroke="var(--color-primary, #6366f1)"
              stroke-width="6" fill="none"
              stroke-linecap="round"
              stroke-dasharray="339.29"
              stroke-dashoffset="339.29"
              style="transform: rotate(-90deg); transform-origin: center;" />
    </svg>
  </div>

  <!-- Progress bar (shown in reduced motion) -->
  <div class="timer-progress-bar"
       role="progressbar"
       aria-valuenow="0"
       aria-valuemin="0"
       aria-valuemax="100"
       aria-label="Session progress">
    <div class="timer-progress-bar__fill" id="timer-progress-fill"></div>
  </div>

  <!-- Countdown number — always visible and the primary time display -->
  <div class="timer-display"
       role="timer"
       aria-live="off"
       aria-label="Time remaining in focus session">
    <span class="timer-display__time" id="timer-time">25:00</span>
  </div>

  <!-- Milestone live region: announces 10 min, 5 min, 1 min remaining -->
  <div id="timer-milestone-live" class="sr-only" aria-live="assertive" aria-atomic="true"></div>
</div>
```

#### CSS

```css
/* File: src/styles/components/timer.css */

.timer-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 0;
  position: relative;
}

.timer-ring {
  position: relative;
}

.timer-display {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

/* When reduced motion is active, timer sits in normal flow */
@media (prefers-reduced-motion: reduce) {
  .timer-display {
    position: static;
    transform: none;
  }
}
html[data-reduce-motion="true"] .timer-display {
  position: static;
  transform: none;
}

.timer-display__time {
  font-size: 36px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--color-text, #1e293b);
  letter-spacing: -0.5px;
}
```

#### JavaScript

```js
// File: src/pages/popup/components/timer-display.js

import animationController from '../../../shared/animation-controller.js';

const CIRCUMFERENCE = 2 * Math.PI * 54; // ~339.29
const MILESTONES = [10 * 60, 5 * 60, 60]; // 10 min, 5 min, 1 min in seconds

/**
 * Accessible timer display with milestone announcements.
 */
export function initTimerDisplay() {
  const timeEl = document.getElementById('timer-time');
  const ringProgress = document.getElementById('timer-ring-progress');
  const progressFill = document.getElementById('timer-progress-fill');
  const progressBar = document.querySelector('.timer-progress-bar');
  const milestoneLive = document.getElementById('timer-milestone-live');

  const announcedMilestones = new Set();
  let totalSeconds = 0;

  /**
   * Update the timer with the current remaining seconds.
   * Called every second via the service worker port connection.
   * @param {number} remaining - Seconds remaining
   * @param {number} total - Total session seconds
   */
  function updateTimer(remaining, total) {
    totalSeconds = total;
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    timeEl.textContent = timeString;

    // Update progress visuals
    const progress = 1 - remaining / total;
    const percentage = Math.round(progress * 100);

    // SVG ring (for full motion users)
    if (ringProgress) {
      const offset = CIRCUMFERENCE * (1 - progress);
      ringProgress.style.strokeDashoffset = offset;
    }

    // Progress bar (for reduced motion users)
    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
    }
    if (progressBar) {
      progressBar.setAttribute('aria-valuenow', String(percentage));
    }

    // Milestone announcements
    for (const milestone of MILESTONES) {
      if (remaining === milestone && !announcedMilestones.has(milestone)) {
        announcedMilestones.add(milestone);
        const minsLeft = milestone / 60;
        const label =
          minsLeft >= 1
            ? `${minsLeft} minute${minsLeft > 1 ? 's' : ''} remaining.`
            : '1 minute remaining.';
        milestoneLive.textContent = label;
        setTimeout(() => { milestoneLive.textContent = ''; }, 2000);
      }
    }
  }

  /**
   * Reset announced milestones for a new session.
   */
  function resetMilestones() {
    announcedMilestones.clear();
  }

  return { updateTimer, resetMilestones };
}
```

---

### 6.5 Accessible Modal (Paywall + Confirmations)

A reusable modal system used for the paywall (Phase 09) and confirmation dialogs (Nuclear Mode, clear stats, etc.).

#### HTML (template)

```html
<!-- File: src/pages/popup/popup.html — modal container at end of body -->
<div id="modal-container" class="modal-backdrop" aria-hidden="true">
  <div
    id="modal-dialog"
    class="modal-dialog"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    aria-describedby="modal-body"
  >
    <div class="modal-dialog__header">
      <h2 id="modal-title" class="modal-dialog__title"></h2>
      <button
        id="modal-close-btn"
        class="modal-dialog__close"
        aria-label="Close dialog"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
    <div id="modal-body" class="modal-dialog__body"></div>
    <div id="modal-footer" class="modal-dialog__footer"></div>
  </div>
</div>
```

#### CSS

```css
/* File: src/styles/components/modal.css */

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 900;
  display: flex;
  align-items: flex-end; /* slide up from bottom */
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  pointer-events: none;
  transition: opacity 300ms ease-out;
}

.modal-backdrop[aria-hidden="false"] {
  opacity: 1;
  pointer-events: auto;
}

.modal-dialog {
  width: 100%;
  max-width: 380px;
  max-height: 85vh;
  overflow-y: auto;
  background: var(--color-surface, #ffffff);
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.15);
  transform: translateY(100%);
  transition: transform 300ms ease-out;
}

.modal-backdrop[aria-hidden="false"] .modal-dialog {
  transform: translateY(0);
}

/* Reduced motion: instant */
@media (prefers-reduced-motion: reduce) {
  .modal-backdrop { transition: none; }
  .modal-dialog  { transition: none; transform: none; }
}
html[data-reduce-motion="true"] .modal-backdrop { transition: none; }
html[data-reduce-motion="true"] .modal-dialog  { transition: none; transform: none; }

.modal-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 0;
}

.modal-dialog__title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text, #1e293b);
  margin: 0;
}

.modal-dialog__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: var(--color-text-secondary, #64748b);
  cursor: pointer;
}

.modal-dialog__close:hover {
  background: var(--color-surface-alt, #f1f5f9);
}

.modal-dialog__close:focus-visible {
  outline: 2px solid var(--color-primary, #6366f1);
  outline-offset: 2px;
}

.modal-dialog__body {
  padding: 16px 20px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-text, #1e293b);
}

.modal-dialog__footer {
  display: flex;
  gap: 8px;
  padding: 0 20px 20px;
  justify-content: flex-end;
}

/* Destructive confirm button */
.btn--danger {
  background: var(--color-danger, #ef4444);
  color: #ffffff;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.btn--danger:hover {
  background: #dc2626;
}

.btn--danger:focus-visible {
  outline: 2px solid var(--color-danger, #ef4444);
  outline-offset: 2px;
}
```

#### JavaScript

```js
// File: src/shared/modal.js

/**
 * Accessible modal manager with focus trap and restoration.
 * Used for paywall, confirmations, and Nuclear Mode prompts.
 */

let previouslyFocusedElement = null;
let isOpen = false;
let closeResolve = null;

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function initModal() {
  const backdrop = document.getElementById('modal-container');
  const dialog = document.getElementById('modal-dialog');
  const closeBtn = document.getElementById('modal-close-btn');

  // Close on backdrop click (not for critical confirmations — handled per invocation)
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop && isOpen) {
      closeModal(false);
    }
  });

  closeBtn.addEventListener('click', () => closeModal(false));

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      closeModal(false);
    }
  });

  // Focus trap
  dialog.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || !isOpen) return;

    const focusable = Array.from(dialog.querySelectorAll(FOCUSABLE_SELECTOR));
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}

/**
 * Show a confirmation modal. Returns a promise that resolves
 * to true (confirmed) or false (cancelled/dismissed).
 *
 * @param {Object} options
 * @param {string} options.title
 * @param {string} options.message
 * @param {string} [options.confirmLabel='Confirm']
 * @param {string} [options.cancelLabel='Cancel']
 * @param {boolean} [options.confirmDestructive=false]
 * @param {boolean} [options.allowBackdropClose=true]
 * @returns {Promise<boolean>}
 */
export function showConfirmationModal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmDestructive = false,
  allowBackdropClose = true,
}) {
  return new Promise((resolve) => {
    closeResolve = resolve;

    const backdrop = document.getElementById('modal-container');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    const footerEl = document.getElementById('modal-footer');

    titleEl.textContent = title;
    bodyEl.textContent = message;

    // Build footer buttons
    footerEl.innerHTML = '';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn--secondary';
    cancelBtn.textContent = cancelLabel;
    cancelBtn.addEventListener('click', () => closeModal(false));

    const confirmBtn = document.createElement('button');
    confirmBtn.className = confirmDestructive ? 'btn btn--danger' : 'btn btn--primary';
    confirmBtn.textContent = confirmLabel;
    confirmBtn.addEventListener('click', () => closeModal(true));

    footerEl.appendChild(cancelBtn);
    footerEl.appendChild(confirmBtn);

    // Override backdrop close for critical confirmations
    if (!allowBackdropClose) {
      backdrop.dataset.preventBackdropClose = 'true';
    } else {
      delete backdrop.dataset.preventBackdropClose;
    }

    openModal();
  });
}

/**
 * Show the paywall modal with feature comparison.
 * Content structure follows Phase 09 paywall spec.
 *
 * @param {string} trigger - The paywall trigger ID (e.g., 'T1', 'T5')
 */
export function showPaywallModal(trigger) {
  const backdrop = document.getElementById('modal-container');
  const titleEl = document.getElementById('modal-title');
  const bodyEl = document.getElementById('modal-body');
  const footerEl = document.getElementById('modal-footer');

  titleEl.textContent = 'Upgrade to Pro';

  bodyEl.innerHTML = `
    <p>Unlock the full power of Focus Mode to supercharge your productivity.</p>
    <table class="paywall-table" aria-label="Free vs Pro feature comparison">
      <thead>
        <tr>
          <th scope="col">Feature</th>
          <th scope="col">Free</th>
          <th scope="col">Pro</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">Blocked sites</th>
          <td>5</td>
          <td>Unlimited</td>
        </tr>
        <tr>
          <th scope="row">Schedules</th>
          <td>1</td>
          <td>Unlimited</td>
        </tr>
        <tr>
          <th scope="row">Stats history</th>
          <td>7 days</td>
          <td>Forever</td>
        </tr>
        <tr>
          <th scope="row">Nuclear Mode</th>
          <td aria-label="Not available">&#x2014;</td>
          <td aria-label="Available">&#x2713;</td>
        </tr>
        <tr>
          <th scope="row">Custom block page</th>
          <td aria-label="Not available">&#x2014;</td>
          <td aria-label="Available">&#x2713;</td>
        </tr>
      </tbody>
    </table>
  `;

  footerEl.innerHTML = '';
  const upgradeBtn = document.createElement('button');
  upgradeBtn.className = 'btn btn--primary btn--full';
  upgradeBtn.textContent = 'Upgrade Now';
  upgradeBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'PAYWALL_UPGRADE', trigger });
    closeModal(true);
  });
  footerEl.appendChild(upgradeBtn);

  openModal();
}

function openModal() {
  const backdrop = document.getElementById('modal-container');
  const dialog = document.getElementById('modal-dialog');

  previouslyFocusedElement = document.activeElement;
  isOpen = true;

  backdrop.setAttribute('aria-hidden', 'false');

  // Move focus into the dialog
  requestAnimationFrame(() => {
    const firstFocusable = dialog.querySelector(FOCUSABLE_SELECTOR);
    if (firstFocusable) firstFocusable.focus();
  });
}

function closeModal(result) {
  const backdrop = document.getElementById('modal-container');

  if (backdrop.dataset.preventBackdropClose === 'true' && result === false) {
    // For non-dismissable modals, only close button and explicit cancel work
    // (backdrop click is prevented in this case)
    if (event && event.target === backdrop) return;
  }

  isOpen = false;
  backdrop.setAttribute('aria-hidden', 'true');

  // Restore focus
  if (previouslyFocusedElement && previouslyFocusedElement.isConnected) {
    previouslyFocusedElement.focus();
  }
  previouslyFocusedElement = null;

  // Resolve the confirmation promise
  if (closeResolve) {
    closeResolve(result);
    closeResolve = null;
  }
}
```

#### Paywall Table Styles

```css
/* File: src/styles/components/paywall-table.css */

.paywall-table {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
  font-size: 13px;
}

.paywall-table th,
.paywall-table td {
  padding: 8px 10px;
  text-align: left;
  border-bottom: 1px solid var(--color-border-light, #f1f5f9);
}

.paywall-table thead th {
  font-weight: 600;
  color: var(--color-text-secondary, #64748b);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.paywall-table tbody th {
  font-weight: 500;
  color: var(--color-text, #1e293b);
}

.paywall-table tbody td:last-child {
  color: var(--color-primary, #6366f1);
  font-weight: 600;
}
```

---

### 6.6 Accessible Toast Notifications

Toasts surface feedback for actions: session complete, site blocked, errors, etc.

#### HTML

```html
<!-- File: src/pages/popup/popup.html — toast container at end of body -->
<div id="toast-container" class="toast-container" aria-label="Notifications"></div>
```

#### CSS

```css
/* File: src/styles/components/toast.css */

.toast-container {
  position: fixed;
  top: 8px;
  right: 8px;
  z-index: 950;
  display: flex;
  flex-direction: column;
  gap: 6px;
  pointer-events: none;
  max-width: 340px;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e2e8f0);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  font-size: 13px;
  line-height: 1.5;
  color: var(--color-text, #1e293b);
  pointer-events: auto;
  position: relative;
  overflow: hidden;
}

.toast--success {
  border-left: 3px solid var(--color-success, #22c55e);
}

.toast--error {
  border-left: 3px solid var(--color-danger, #ef4444);
}

.toast--info {
  border-left: 3px solid var(--color-primary, #6366f1);
}

.toast__icon {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  margin-top: 1px;
}

.toast__content {
  flex: 1;
  min-width: 0;
}

.toast__close {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 4px;
  color: var(--color-text-tertiary, #94a3b8);
  cursor: pointer;
}

.toast__close:hover {
  background: var(--color-surface-alt, #f1f5f9);
}

.toast__close:focus-visible {
  outline: 2px solid var(--color-primary, #6366f1);
  outline-offset: 1px;
}

/* Auto-dismiss progress bar */
.toast__progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: var(--color-primary, #6366f1);
  border-radius: 0 0 0 8px;
  transition: width linear;
}

.toast--success .toast__progress { background: var(--color-success, #22c55e); }
.toast--error .toast__progress   { background: var(--color-danger, #ef4444); }

/* Reduced motion: no slide animation */
@media (prefers-reduced-motion: reduce) {
  .toast__progress { transition: none; }
}
html[data-reduce-motion="true"] .toast__progress { transition: none; }
```

#### JavaScript

```js
// File: src/shared/toast.js

/**
 * Accessible toast notification system for Focus Mode - Blocker.
 * - role="alert" for errors, role="status" for success/info
 * - Auto-dismiss with visual progress bar (except errors)
 * - Max 3 visible toasts
 * - Close button with aria-label
 */

const MAX_TOASTS = 3;
const AUTO_DISMISS_MS = 4000;
let activeToasts = [];

/**
 * Show a toast notification.
 * @param {Object} options
 * @param {'success'|'error'|'info'} options.type
 * @param {string} options.message
 * @param {number} [options.duration=4000] - Auto-dismiss in ms. Ignored for error toasts.
 */
export function showToast({ type = 'info', message, duration = AUTO_DISMISS_MS }) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  // Enforce max toast limit
  while (activeToasts.length >= MAX_TOASTS) {
    dismissToast(activeToasts[0]);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast--${type} toast--entering`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
  toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
  toast.setAttribute('aria-atomic', 'true');

  const iconSvg = getIconSvg(type);

  toast.innerHTML = `
    <span class="toast__icon" aria-hidden="true">${iconSvg}</span>
    <span class="toast__content">${escapeHtml(message)}</span>
  `;

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'toast__close';
  closeBtn.setAttribute('aria-label', 'Dismiss notification');
  closeBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`;
  closeBtn.addEventListener('click', () => dismissToast(toast));
  toast.appendChild(closeBtn);

  // Auto-dismiss progress bar (errors do NOT auto-dismiss)
  if (type !== 'error') {
    const progress = document.createElement('div');
    progress.className = 'toast__progress';
    progress.style.width = '100%';
    toast.appendChild(progress);

    // Animate progress bar
    requestAnimationFrame(() => {
      progress.style.transitionDuration = `${duration}ms`;
      progress.style.width = '0%';
    });

    toast._dismissTimer = setTimeout(() => dismissToast(toast), duration);
  }

  container.appendChild(toast);
  activeToasts.push(toast);
}

function dismissToast(toast) {
  if (!toast || !toast.parentNode) return;

  if (toast._dismissTimer) {
    clearTimeout(toast._dismissTimer);
  }

  toast.classList.remove('toast--entering');
  toast.classList.add('toast--exiting');

  const onEnd = () => {
    toast.remove();
    activeToasts = activeToasts.filter((t) => t !== toast);
  };

  // If reduced motion, remove immediately
  if (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.getAttribute('data-reduce-motion') === 'true'
  ) {
    onEnd();
  } else {
    toast.addEventListener('animationend', onEnd, { once: true });
    // Safety timeout in case animationend does not fire
    setTimeout(onEnd, 300);
  }
}

function getIconSvg(type) {
  switch (type) {
    case 'success':
      return `<svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="8" stroke="#22c55e" stroke-width="1.5"/>
        <path d="M5.5 9l2.5 2.5L12.5 6" stroke="#22c55e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    case 'error':
      return `<svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="8" stroke="#ef4444" stroke-width="1.5"/>
        <path d="M9 5.5v4M9 12.5v.01" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/>
      </svg>`;
    default:
      return `<svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="8" stroke="#6366f1" stroke-width="1.5"/>
        <path d="M9 8v4.5M9 5.5v.01" stroke="#6366f1" stroke-width="1.5" stroke-linecap="round"/>
      </svg>`;
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
```

---

### 6.7 Accessible Dropdown/Select

Used for the theme selector on the Options page and schedule time pickers.

#### HTML

```html
<!-- File: src/pages/options/options.html (excerpt) -->
<div class="dropdown" id="theme-dropdown">
  <label id="theme-label" class="dropdown__label">Theme</label>
  <button
    id="theme-trigger"
    class="dropdown__trigger"
    role="combobox"
    aria-expanded="false"
    aria-haspopup="listbox"
    aria-labelledby="theme-label"
    aria-controls="theme-listbox"
    aria-activedescendant=""
  >
    <span class="dropdown__value">System default</span>
    <svg class="dropdown__chevron" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M3 5l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>
  </button>
  <ul
    id="theme-listbox"
    class="dropdown__listbox"
    role="listbox"
    aria-labelledby="theme-label"
    hidden
  >
    <li id="theme-system" role="option" aria-selected="true" class="dropdown__option dropdown__option--selected">
      System default
    </li>
    <li id="theme-light" role="option" aria-selected="false" class="dropdown__option">
      Light
    </li>
    <li id="theme-dark" role="option" aria-selected="false" class="dropdown__option">
      Dark
    </li>
  </ul>
</div>
```

#### CSS

```css
/* File: src/styles/components/dropdown.css */

.dropdown {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dropdown__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary, #64748b);
}

.dropdown__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  font-size: 14px;
  color: var(--color-text, #1e293b);
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #cbd5e1);
  border-radius: 6px;
  cursor: pointer;
  min-width: 160px;
}

.dropdown__trigger:hover {
  border-color: var(--color-text-secondary, #64748b);
}

.dropdown__trigger:focus-visible {
  outline: 2px solid var(--color-primary, #6366f1);
  outline-offset: 2px;
}

.dropdown__trigger[aria-expanded="true"] .dropdown__chevron {
  transform: rotate(180deg);
}

.dropdown__listbox {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 100;
  margin-top: 4px;
  padding: 4px;
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #cbd5e1);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  list-style: none;
}

.dropdown__option {
  padding: 8px 12px;
  font-size: 14px;
  color: var(--color-text, #1e293b);
  border-radius: 4px;
  cursor: pointer;
}

.dropdown__option:hover,
.dropdown__option--focused {
  background: var(--color-surface-alt, #f1f5f9);
}

.dropdown__option--selected {
  font-weight: 600;
  color: var(--color-primary, #6366f1);
}

.dropdown__option--selected::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-primary, #6366f1);
  margin-right: 8px;
  vertical-align: middle;
}
```

#### JavaScript

```js
// File: src/shared/dropdown.js

/**
 * Accessible dropdown/select with keyboard navigation and type-ahead.
 * WAI-ARIA Combobox pattern (select-only).
 *
 * @param {string} containerId - ID of the .dropdown container element.
 * @param {Function} onChange - Called with the selected option's id.
 */
export function initDropdown(containerId, onChange) {
  const container = document.getElementById(containerId);
  const trigger = container.querySelector('.dropdown__trigger');
  const listbox = container.querySelector('[role="listbox"]');
  const options = Array.from(listbox.querySelectorAll('[role="option"]'));
  const valueDisplay = trigger.querySelector('.dropdown__value');

  let focusedIndex = options.findIndex(
    (o) => o.getAttribute('aria-selected') === 'true'
  );
  let typeAheadBuffer = '';
  let typeAheadTimer = null;

  function openDropdown() {
    listbox.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    if (focusedIndex >= 0) {
      setFocusedOption(focusedIndex);
    }
  }

  function closeDropdown() {
    listbox.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    trigger.removeAttribute('aria-activedescendant');
    clearFocused();
    trigger.focus();
  }

  function selectOption(index) {
    options.forEach((o) => {
      o.setAttribute('aria-selected', 'false');
      o.classList.remove('dropdown__option--selected');
    });

    const option = options[index];
    option.setAttribute('aria-selected', 'true');
    option.classList.add('dropdown__option--selected');
    valueDisplay.textContent = option.textContent.trim();
    focusedIndex = index;

    if (onChange) onChange(option.id);

    closeDropdown();
  }

  function setFocusedOption(index) {
    clearFocused();
    const option = options[index];
    option.classList.add('dropdown__option--focused');
    trigger.setAttribute('aria-activedescendant', option.id);
    option.scrollIntoView({ block: 'nearest' });
    focusedIndex = index;
  }

  function clearFocused() {
    options.forEach((o) => o.classList.remove('dropdown__option--focused'));
  }

  // Type-ahead: typing characters jumps to matching option
  function handleTypeAhead(char) {
    typeAheadBuffer += char.toLowerCase();
    clearTimeout(typeAheadTimer);
    typeAheadTimer = setTimeout(() => { typeAheadBuffer = ''; }, 500);

    const matchIndex = options.findIndex((o) =>
      o.textContent.trim().toLowerCase().startsWith(typeAheadBuffer)
    );
    if (matchIndex >= 0) {
      setFocusedOption(matchIndex);
    }
  }

  // Toggle on click
  trigger.addEventListener('click', () => {
    const isOpen = trigger.getAttribute('aria-expanded') === 'true';
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  });

  // Keyboard navigation
  trigger.addEventListener('keydown', (e) => {
    const isOpen = trigger.getAttribute('aria-expanded') === 'true';

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          openDropdown();
        } else {
          const next = Math.min(focusedIndex + 1, options.length - 1);
          setFocusedOption(next);
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          openDropdown();
        } else {
          const prev = Math.max(focusedIndex - 1, 0);
          setFocusedOption(prev);
        }
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && focusedIndex >= 0) {
          selectOption(focusedIndex);
        } else {
          openDropdown();
        }
        break;

      case 'Escape':
        if (isOpen) {
          e.preventDefault();
          closeDropdown();
        }
        break;

      case 'Home':
        if (isOpen) {
          e.preventDefault();
          setFocusedOption(0);
        }
        break;

      case 'End':
        if (isOpen) {
          e.preventDefault();
          setFocusedOption(options.length - 1);
        }
        break;

      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          if (!isOpen) openDropdown();
          handleTypeAhead(e.key);
        }
        break;
    }
  });

  // Click on an option
  options.forEach((option, index) => {
    option.addEventListener('click', () => selectOption(index));
    option.addEventListener('mouseenter', () => setFocusedOption(index));
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      closeDropdown();
    }
  });
}
```

---

### 6.8 Accessible Tooltip

Used on icon-only buttons (settings gear, remove site, info icons) and on stats displays.

#### HTML

```html
<!-- Example: Settings icon button with tooltip -->
<div class="tooltip-wrapper">
  <button
    class="icon-btn"
    aria-label="Settings"
    aria-describedby="tooltip-settings"
  >
    <svg width="18" height="18" aria-hidden="true"><!-- gear icon --></svg>
  </button>
  <div id="tooltip-settings" class="tooltip" role="tooltip" aria-hidden="true">
    Settings
  </div>
</div>

<!-- Example: Focus Score info tooltip -->
<div class="tooltip-wrapper">
  <span class="stats-label">
    Focus Score
    <button
      class="info-btn"
      aria-label="What is Focus Score?"
      aria-describedby="tooltip-score-info"
    >
      <svg width="14" height="14" aria-hidden="true"><!-- question mark icon --></svg>
    </button>
  </span>
  <div id="tooltip-score-info" class="tooltip tooltip--wide" role="tooltip" aria-hidden="true">
    Your Focus Score (0-100) measures how consistently you stay focused during sessions.
    Higher scores mean fewer blocked-site visits.
  </div>
</div>
```

#### CSS

```css
/* File: src/styles/components/tooltip.css */

.tooltip-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
  padding: 6px 10px;
  font-size: 12px;
  line-height: 1.4;
  color: #ffffff;
  background: var(--color-text, #1e293b);
  border-radius: 6px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 150ms ease-out;
}

.tooltip--wide {
  white-space: normal;
  max-width: 220px;
  text-align: center;
}

/* Arrow */
.tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: var(--color-text, #1e293b);
}

/* Visible state */
.tooltip[aria-hidden="false"] {
  opacity: 1;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .tooltip { transition: none; }
}
html[data-reduce-motion="true"] .tooltip { transition: none; }

/* Icon button base */
.icon-btn,
.info-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  padding: 4px;
  border-radius: 4px;
  color: var(--color-text-secondary, #64748b);
  cursor: pointer;
}

.icon-btn:hover,
.info-btn:hover {
  background: var(--color-surface-alt, #f1f5f9);
}

.icon-btn:focus-visible,
.info-btn:focus-visible {
  outline: 2px solid var(--color-primary, #6366f1);
  outline-offset: 2px;
}
```

#### JavaScript

```js
// File: src/shared/tooltip.js

/**
 * Accessible tooltips that show on hover AND focus, dismiss on Escape.
 * Uses aria-describedby pattern.
 * Call once on DOMContentLoaded to initialize all tooltips on the page.
 */
export function initTooltips() {
  const wrappers = document.querySelectorAll('.tooltip-wrapper');

  wrappers.forEach((wrapper) => {
    const trigger = wrapper.querySelector('[aria-describedby]');
    const tooltipId = trigger.getAttribute('aria-describedby');
    const tooltip = document.getElementById(tooltipId);

    if (!trigger || !tooltip) return;

    function show() {
      tooltip.setAttribute('aria-hidden', 'false');
    }

    function hide() {
      tooltip.setAttribute('aria-hidden', 'true');
    }

    // Show on hover
    wrapper.addEventListener('mouseenter', show);
    wrapper.addEventListener('mouseleave', hide);

    // Show on focus (keyboard users)
    trigger.addEventListener('focus', show);
    trigger.addEventListener('blur', hide);

    // Dismiss on Escape
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        hide();
      }
    });
  });
}
```

---

### 6.9 Accessible Onboarding Wizard

A multi-step wizard shown on first install. Follows the 5-slide structure from Phase 08: Welcome, Quick Setup, Focus Style, Focus Score, First Session.

#### HTML

```html
<!-- File: src/pages/onboarding/onboarding.html (excerpt) -->
<div class="onboarding" role="main">
  <!-- Step indicator -->
  <nav class="onboarding__progress" aria-label="Onboarding progress">
    <ol class="onboarding__steps-list" role="list">
      <li class="onboarding__step-indicator"
          aria-current="step"
          data-step="1">
        <span class="onboarding__step-dot onboarding__step-dot--active"></span>
        <span class="sr-only">Step 1 of 5: Welcome (current step)</span>
      </li>
      <li class="onboarding__step-indicator" data-step="2">
        <span class="onboarding__step-dot"></span>
        <span class="sr-only">Step 2 of 5: Quick setup</span>
      </li>
      <li class="onboarding__step-indicator" data-step="3">
        <span class="onboarding__step-dot"></span>
        <span class="sr-only">Step 3 of 5: Focus style</span>
      </li>
      <li class="onboarding__step-indicator" data-step="4">
        <span class="onboarding__step-dot"></span>
        <span class="sr-only">Step 4 of 5: Focus Score</span>
      </li>
      <li class="onboarding__step-indicator" data-step="5">
        <span class="onboarding__step-dot"></span>
        <span class="sr-only">Step 5 of 5: Start first session</span>
      </li>
    </ol>
  </nav>

  <!-- Step content container -->
  <div class="onboarding__content" aria-live="polite">
    <!-- Step 1: Welcome -->
    <section
      class="onboarding-step onboarding-step--active"
      id="onboarding-step-1"
      role="group"
      aria-label="Step 1 of 5: Welcome"
    >
      <h1 class="onboarding-step__title">Welcome to Focus Mode</h1>
      <p class="onboarding-step__desc">
        Block distractions. Build focus. Track your streak.
      </p>
      <p class="onboarding-step__desc">
        Let's get you set up in under 60 seconds.
      </p>
    </section>

    <!-- Step 2: Quick setup (add first blocked sites) -->
    <section
      class="onboarding-step"
      id="onboarding-step-2"
      role="group"
      aria-label="Step 2 of 5: Choose your blocked sites"
      hidden
    >
      <h2 class="onboarding-step__title">What distracts you most?</h2>
      <p class="onboarding-step__desc">Select sites to block during focus sessions.</p>
      <fieldset class="onboarding-site-picker">
        <legend class="sr-only">Popular sites to block</legend>
        <!-- Checkboxes for common sites -->
        <label class="onboarding-site-option">
          <input type="checkbox" name="sites" value="twitter.com" />
          <span class="onboarding-site-option__label">Twitter / X</span>
        </label>
        <label class="onboarding-site-option">
          <input type="checkbox" name="sites" value="reddit.com" />
          <span class="onboarding-site-option__label">Reddit</span>
        </label>
        <label class="onboarding-site-option">
          <input type="checkbox" name="sites" value="youtube.com" />
          <span class="onboarding-site-option__label">YouTube</span>
        </label>
        <label class="onboarding-site-option">
          <input type="checkbox" name="sites" value="instagram.com" />
          <span class="onboarding-site-option__label">Instagram</span>
        </label>
        <label class="onboarding-site-option">
          <input type="checkbox" name="sites" value="tiktok.com" />
          <span class="onboarding-site-option__label">TikTok</span>
        </label>
      </fieldset>
      <p id="onboarding-step2-error" class="onboarding-step__error" role="alert" hidden>
        Please select at least one site to block.
      </p>
    </section>

    <!-- Steps 3-5 follow same pattern, omitted for brevity but structured identically -->
    <section class="onboarding-step" id="onboarding-step-3" role="group"
             aria-label="Step 3 of 5: Choose your focus style" hidden>
      <!-- Focus style selection: Pomodoro / Quick / Scheduled -->
    </section>
    <section class="onboarding-step" id="onboarding-step-4" role="group"
             aria-label="Step 4 of 5: Your Focus Score" hidden>
      <!-- Focus Score introduction -->
    </section>
    <section class="onboarding-step" id="onboarding-step-5" role="group"
             aria-label="Step 5 of 5: Start your first session" hidden>
      <!-- CTA to begin first session -->
    </section>
  </div>

  <!-- Navigation buttons -->
  <footer class="onboarding__nav">
    <button
      id="onboarding-back"
      class="btn btn--secondary"
      aria-label="Go to previous step"
      disabled
    >
      Back
    </button>
    <button
      id="onboarding-next"
      class="btn btn--primary"
      aria-label="Go to next step"
    >
      Next
    </button>
  </footer>

  <!-- Step change live announcement -->
  <div id="onboarding-live" class="sr-only" aria-live="assertive" aria-atomic="true"></div>
</div>
```

#### CSS

```css
/* File: src/pages/onboarding/onboarding.css (excerpt) */

.onboarding {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 24px;
  background: var(--color-bg, #f8fafc);
}

/* Step indicator dots */
.onboarding__steps-list {
  display: flex;
  justify-content: center;
  gap: 12px;
  list-style: none;
  padding: 0;
  margin: 0 0 24px;
}

.onboarding__step-dot {
  display: block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-border, #cbd5e1);
  transition: background-color 200ms, transform 200ms;
}

.onboarding__step-dot--active {
  background: var(--color-primary, #6366f1);
  transform: scale(1.2);
}

/* Completed step: different visual (not just color) */
.onboarding__step-dot--completed {
  background: var(--color-primary, #6366f1);
  position: relative;
}
.onboarding__step-dot--completed::after {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: 50%;
  background: #ffffff;
}

/* Reduced motion on step dots */
@media (prefers-reduced-motion: reduce) {
  .onboarding__step-dot {
    transition: none;
  }
}
html[data-reduce-motion="true"] .onboarding__step-dot {
  transition: none;
}

/* Content area */
.onboarding__content {
  flex: 1;
  position: relative;
  overflow: hidden;
}

/* Step titles and descriptions */
.onboarding-step__title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text, #1e293b);
  margin: 0 0 8px;
}

.onboarding-step__desc {
  font-size: 15px;
  line-height: 1.6;
  color: var(--color-text-secondary, #64748b);
  margin: 0 0 16px;
}

.onboarding-step__error {
  color: var(--color-danger, #ef4444);
  font-size: 13px;
  margin-top: 8px;
}

/* Site picker checkboxes */
.onboarding-site-picker {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: none;
  padding: 0;
  margin: 16px 0;
}

.onboarding-site-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: 1px solid var(--color-border, #cbd5e1);
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: border-color 150ms, background-color 150ms;
}

.onboarding-site-option:has(input:checked) {
  border-color: var(--color-primary, #6366f1);
  background: var(--color-primary-surface, #eef2ff);
}

.onboarding-site-option:focus-within {
  outline: 2px solid var(--color-primary, #6366f1);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .onboarding-site-option { transition: none; }
}
html[data-reduce-motion="true"] .onboarding-site-option { transition: none; }

/* Navigation footer */
.onboarding__nav {
  display: flex;
  justify-content: space-between;
  padding: 16px 0 0;
  gap: 12px;
}

.onboarding__nav .btn {
  flex: 1;
}

.onboarding__nav .btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

#### JavaScript

```js
// File: src/pages/onboarding/onboarding.js

import animationController from '../../shared/animation-controller.js';

const STEP_LABELS = [
  'Welcome',
  'Choose your blocked sites',
  'Choose your focus style',
  'Your Focus Score',
  'Start your first session',
];

const TOTAL_STEPS = STEP_LABELS.length;

/**
 * Accessible onboarding wizard with step validation,
 * keyboard navigation, and screen reader announcements.
 */
export function initOnboarding() {
  let currentStep = 1;

  const backBtn = document.getElementById('onboarding-back');
  const nextBtn = document.getElementById('onboarding-next');
  const liveRegion = document.getElementById('onboarding-live');
  const indicators = document.querySelectorAll('.onboarding__step-indicator');

  function goToStep(step) {
    if (step < 1 || step > TOTAL_STEPS) return;

    // Validate current step before advancing
    if (step > currentStep && !validateStep(currentStep)) {
      return;
    }

    const oldStepEl = document.getElementById(`onboarding-step-${currentStep}`);
    const newStepEl = document.getElementById(`onboarding-step-${step}`);

    // Hide old step
    oldStepEl.classList.remove('onboarding-step--active');
    oldStepEl.hidden = true;

    // Show new step
    newStepEl.hidden = false;
    // Use requestAnimationFrame to allow the DOM to update before adding the class
    requestAnimationFrame(() => {
      newStepEl.classList.add('onboarding-step--active');
    });

    // Update step indicators
    indicators.forEach((ind) => {
      const s = parseInt(ind.dataset.step, 10);
      const dot = ind.querySelector('.onboarding__step-dot');

      dot.classList.remove('onboarding__step-dot--active', 'onboarding__step-dot--completed');
      ind.removeAttribute('aria-current');

      if (s === step) {
        dot.classList.add('onboarding__step-dot--active');
        ind.setAttribute('aria-current', 'step');
      } else if (s < step) {
        dot.classList.add('onboarding__step-dot--completed');
      }
    });

    currentStep = step;

    // Update button states
    backBtn.disabled = currentStep === 1;
    backBtn.setAttribute('aria-label',
      currentStep === 1 ? 'Go to previous step (disabled)' : 'Go to previous step');

    if (currentStep === TOTAL_STEPS) {
      nextBtn.textContent = 'Get Started';
      nextBtn.setAttribute('aria-label', 'Start using Focus Mode');
    } else {
      nextBtn.textContent = 'Next';
      nextBtn.setAttribute('aria-label', 'Go to next step');
    }

    // Announce step change to screen readers
    liveRegion.textContent = `Step ${step} of ${TOTAL_STEPS}: ${STEP_LABELS[step - 1]}`;
    setTimeout(() => { liveRegion.textContent = ''; }, 2000);

    // Focus the step heading for screen readers
    const heading = newStepEl.querySelector('h1, h2');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus();
    }
  }

  function validateStep(step) {
    switch (step) {
      case 2: {
        // At least one site must be selected
        const checked = document.querySelectorAll(
          '#onboarding-step-2 input[name="sites"]:checked'
        );
        const errorEl = document.getElementById('onboarding-step2-error');
        if (checked.length === 0) {
          errorEl.hidden = false;
          return false;
        }
        errorEl.hidden = true;
        return true;
      }
      default:
        return true;
    }
  }

  nextBtn.addEventListener('click', () => {
    if (currentStep === TOTAL_STEPS) {
      // Final step: complete onboarding
      completeOnboarding();
    } else {
      goToStep(currentStep + 1);
    }
  });

  backBtn.addEventListener('click', () => {
    goToStep(currentStep - 1);
  });

  function completeOnboarding() {
    // Collect selections and send to service worker
    const selectedSites = Array.from(
      document.querySelectorAll('#onboarding-step-2 input[name="sites"]:checked')
    ).map((input) => input.value);

    chrome.runtime.sendMessage({
      type: 'ONBOARDING_COMPLETE',
      sites: selectedSites,
    });

    // Close the onboarding tab
    window.close();
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await animationController.init();

  const pageContainer = document.querySelector('.onboarding');
  animationController.createPauseButton(pageContainer);

  initOnboarding();
});
```

---

## Cross-Cutting Concerns

### Options Page: Reduce Animations Toggle

The Options page provides a manual toggle for users who want reduced motion only within Focus Mode - Blocker, without changing their OS-level setting.

```html
<!-- File: src/pages/options/options.html (excerpt) -->
<div class="setting-row">
  <div class="setting-row__text">
    <label for="reduce-animations-toggle" class="setting-row__label">Reduce animations</label>
    <p class="setting-row__desc">
      Disable motion effects throughout the extension. Useful if animations are distracting or cause discomfort.
    </p>
  </div>
  <button
    id="reduce-animations-toggle"
    class="toggle-btn"
    role="switch"
    aria-checked="false"
  >
    <span class="toggle-btn__track">
      <span class="toggle-btn__thumb"></span>
    </span>
  </button>
  <div id="reduce-animations-live" class="sr-only" aria-live="polite" aria-atomic="true"></div>
</div>
```

```js
// File: src/pages/options/options.js (excerpt)
import animationController from '../../shared/animation-controller.js';

document.addEventListener('DOMContentLoaded', async () => {
  await animationController.init();

  const toggle = document.getElementById('reduce-animations-toggle');
  const liveRegion = document.getElementById('reduce-animations-live');

  // Set initial state
  toggle.setAttribute('aria-checked', String(animationController.isReducedMotion));

  toggle.addEventListener('click', async () => {
    const newState = toggle.getAttribute('aria-checked') !== 'true';
    toggle.setAttribute('aria-checked', String(newState));
    await animationController.setManualOverride(newState);
    liveRegion.textContent = newState
      ? 'Animations reduced.'
      : 'Animations enabled.';
    setTimeout(() => { liveRegion.textContent = ''; }, 1000);
  });
});
```

### File Reference Summary

| File Path | Contents |
|-----------|----------|
| `src/styles/reduced-motion.css` | Global prefers-reduced-motion reset, `[data-reduce-motion]` rules |
| `src/shared/animation-controller.js` | AnimationController class (singleton, storage, media query, pause button) |
| `src/styles/animation-pause-btn.css` | Styles for the animation pause button |
| `src/styles/components/toggle-btn.css` | Toggle button (Nuclear Mode and settings) |
| `src/pages/popup/components/nuclear-toggle.js` | Nuclear Mode toggle logic with confirmation |
| `src/styles/components/tab-bar.css` | Tab bar styles |
| `src/pages/popup/components/tab-bar.js` | Tab bar keyboard navigation |
| `src/styles/components/blocklist.css` | Blocklist manager styles |
| `src/pages/popup/components/blocklist-manager.js` | Blocklist add/remove with announcements |
| `src/styles/components/timer.css` | Timer display + ring + progress bar |
| `src/pages/popup/components/timer-display.js` | Timer updates with milestone announcements |
| `src/styles/components/modal.css` | Modal backdrop and dialog |
| `src/shared/modal.js` | Modal open/close, focus trap, paywall content |
| `src/styles/components/paywall-table.css` | Paywall feature comparison table |
| `src/styles/components/toast.css` | Toast notification styles |
| `src/shared/toast.js` | Toast system (max 3, auto-dismiss, error persistence) |
| `src/styles/components/dropdown.css` | Dropdown/select styles |
| `src/shared/dropdown.js` | Dropdown keyboard navigation and type-ahead |
| `src/styles/components/tooltip.css` | Tooltip styles |
| `src/shared/tooltip.js` | Tooltip hover/focus/escape behavior |
| `src/pages/onboarding/onboarding.css` | Onboarding wizard layout and step styles |
| `src/pages/onboarding/onboarding.js` | Onboarding step navigation with validation |
| `src/pages/block/block.css` | Block page breathing animation |
| `src/pages/block/block.js` | Block page animation registration |
| `src/pages/options/options.js` | Reduce Animations toggle integration |

---

## Testing Checklist

- [ ] All 12 animations respect `prefers-reduced-motion: reduce` (system-level)
- [ ] All 12 animations respect `[data-reduce-motion="true"]` (extension-level)
- [ ] AnimationController persists preference to `chrome.storage.sync`
- [ ] Pause button appears on onboarding and block page, hidden when reduced motion is active
- [ ] Nuclear Mode toggle reads state change via screen reader
- [ ] Nuclear Mode toggle shows confirmation dialog before enabling
- [ ] Tab bar navigable with arrow keys, Home, End
- [ ] Blocklist items addable with Enter, removable with Delete/Backspace
- [ ] Blocklist additions/removals announced to screen readers
- [ ] Timer displays milestone announcements at 10 min, 5 min, 1 min
- [ ] Timer does NOT spam screen reader every second (aria-live="off")
- [ ] Modal traps focus, restores focus on close, closes on Escape
- [ ] Paywall table has proper `<th scope>` headers
- [ ] Toasts: errors persist until manually dismissed; success/info auto-dismiss
- [ ] Toast progress bar visible and animated (or instant in reduced motion)
- [ ] Max 3 toasts visible at once
- [ ] Dropdown navigable with arrow keys, Enter, Escape, type-ahead
- [ ] Tooltips show on both hover and focus, dismiss on Escape
- [ ] Onboarding announces step changes to screen readers
- [ ] Onboarding validates each step before advancing
- [ ] Onboarding Back button disabled on step 1
- [ ] All focus indicators use 2px solid outline with offset (WCAG 2.4.7)
- [ ] No animation exceeds the motion budget durations in Section 5.4
- [ ] All animations use `transform` and `opacity` only (except Nuclear Mode box-shadow)
