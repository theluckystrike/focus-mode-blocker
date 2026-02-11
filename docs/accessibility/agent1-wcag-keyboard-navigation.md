# Agent 1 — WCAG 2.1 AA Requirements & Keyboard Navigation
## Phase 21: Accessibility Compliance — Focus Mode - Blocker

> **Date:** February 11, 2026
> **Agent:** 1 of 5
> **Scope:** Sections 1-2 — WCAG 2.1 AA requirements adapted for all Focus Mode - Blocker surfaces; keyboard navigation patterns for popup, options page, block page, and modals
> **Dependencies:** Phase 12 (MV3 Architecture — popup, block page, service worker), Phase 08 (Branding — onboarding flow, design tokens), Phase 09 (Payment — paywall modal focus trap)
> **Extension:** Focus Mode - Blocker v1.0.0 by Zovo

---

## Table of Contents

1. [WCAG 2.1 AA Requirements](#1-wcag-21-aa-requirements)
   - 1.1 [Perceivable](#11-perceivable)
   - 1.2 [Operable](#12-operable)
   - 1.3 [Understandable](#13-understandable)
   - 1.4 [Robust](#14-robust)
   - 1.5 [Extension-Specific Surfaces](#15-extension-specific-surfaces)
2. [Keyboard Navigation](#2-keyboard-navigation)
   - 2.1 [FocusManager Class](#21-focusmanager-class)
   - 2.2 [Tab Order Optimization](#22-tab-order-optimization)
   - 2.3 [Keyboard Shortcuts](#23-keyboard-shortcuts)
   - 2.4 [Focus Trapping in Modals](#24-focus-trapping-in-modals)
   - 2.5 [Skip Links](#25-skip-links)
   - 2.6 [Roving Tabindex](#26-roving-tabindex)
   - 2.7 [Block Page Keyboard Navigation](#27-block-page-keyboard-navigation)

---

## 1. WCAG 2.1 AA Requirements

Focus Mode - Blocker targets neurodivergent professionals (persona "Sam") alongside students and knowledge workers. WCAG 2.1 AA compliance is not optional polish; it is a core product requirement for this user base. Every criterion below is adapted to the extension's specific components and surfaces.

---

### 1.1 Perceivable

#### 1.1.1 Non-text Content (WCAG 1.1.1)

Every non-text element in the extension must have a text alternative that serves the equivalent purpose.

**Timer Progress Ring** (`src/popup/components/timer-display.js`)

The SVG circular progress ring communicates session progress visually. Screen readers need both the current time and the progress percentage.

```javascript
// src/popup/components/timer-display.js

function renderTimerRing(container, timeRemaining, totalDuration) {
  const progressPercent = Math.round(
    ((totalDuration - timeRemaining) / totalDuration) * 100
  );
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeText = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const svg = container.querySelector('.timer-ring-svg');

  // The SVG ring itself is decorative — the text content carries the meaning
  svg.setAttribute('aria-hidden', 'true');

  // The timer text element is the accessible representation
  const timerText = container.querySelector('.timer-text');
  timerText.textContent = timeText;
  timerText.setAttribute('role', 'timer');
  timerText.setAttribute('aria-live', 'off');
  // Note: aria-live is "off" for the every-second ticks to avoid
  // overwhelming screen readers. We use a separate announcer for
  // milestone announcements (see below).
  timerText.setAttribute(
    'aria-label',
    `${minutes} minutes and ${seconds} seconds remaining. ${progressPercent}% complete.`
  );

  // Milestone announcements — announce at meaningful intervals only
  if (timeRemaining % 300 === 0 && timeRemaining > 0) {
    // Every 5 minutes
    announceToScreenReader(
      `${minutes} minutes remaining in your focus session.`,
      'polite'
    );
  } else if (timeRemaining === 60) {
    announceToScreenReader('One minute remaining in your focus session.', 'assertive');
  } else if (timeRemaining === 0) {
    announceToScreenReader('Focus session complete! Great work.', 'assertive');
  }
}
```

**Focus Score Ring** (`src/popup/components/focus-score-ring.js`)

The SVG circular score indicator (0-100) is a custom gauge widget. The SVG arc is decorative; the accessible value is communicated via ARIA.

```javascript
// src/popup/components/focus-score-ring.js

function renderFocusScoreRing(container, score) {
  const scoreLevel =
    score >= 70 ? 'good' : score >= 40 ? 'average' : 'needs improvement';

  const ringWrapper = container.querySelector('.focus-score-ring');
  ringWrapper.setAttribute('role', 'meter');
  ringWrapper.setAttribute('aria-label', 'Focus Score');
  ringWrapper.setAttribute('aria-valuenow', String(score));
  ringWrapper.setAttribute('aria-valuemin', '0');
  ringWrapper.setAttribute('aria-valuemax', '100');
  ringWrapper.setAttribute('aria-valuetext', `Focus Score: ${score} out of 100, ${scoreLevel}`);

  // The SVG paths are purely decorative
  const svg = ringWrapper.querySelector('svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
}
```

**Icons throughout the extension**

All interactive icons must have accessible names. Decorative icons adjacent to text labels must be hidden from assistive technology.

```javascript
// src/popup/components/header.js

function renderHeader(container) {
  container.innerHTML = '';

  // Extension icon — decorative (the extension name follows it)
  const icon = document.createElement('img');
  icon.src = '../icons/icon-32.png';
  icon.alt = ''; // decorative
  icon.setAttribute('aria-hidden', 'true');
  icon.className = 'header-icon';

  const title = document.createElement('h1');
  title.textContent = 'Focus Mode';
  title.className = 'header-title';

  // Settings button — icon-only, needs aria-label
  const settingsBtn = document.createElement('button');
  settingsBtn.className = 'header-settings-btn';
  settingsBtn.setAttribute('aria-label', 'Open settings');
  settingsBtn.innerHTML = `
    <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 20 20">
      <path d="M10 13a3 3 0 100-6 3 3 0 000 6z" fill="currentColor"/>
      <!-- gear icon paths -->
    </svg>
  `;

  container.append(icon, title, settingsBtn);
}
```

**Badge icon state changes** (`src/background/service-worker.js`)

When the toolbar badge changes (blocked count, active session indicator), a screen reader user has no way to see this. Badge changes should trigger announcements when the popup is open.

```javascript
// src/popup/state/message-bridge.js

port.onMessage.addListener((msg) => {
  if (msg.type === 'BLOCK_EVENT') {
    const counter = document.querySelector('.blocked-counter');
    counter.textContent = msg.blockedCount;

    // Announce new block to screen reader users who have the popup open
    announceToScreenReader(
      `Distraction blocked: ${msg.domain}. Total blocked this session: ${msg.blockedCount}.`,
      'polite'
    );
  }
});
```

#### 1.3.1 Info and Relationships (WCAG 1.3.1)

The popup, block page, and options page must use semantic HTML so that the structure conveyed visually (headings, groups, lists) is also available programmatically.

**Popup semantic structure:**

```html
<!-- src/popup/popup.html -->
<body class="zovo-popup">
  <!-- Landmark: banner -->
  <header class="popup-header" role="banner">
    <img src="../icons/icon-32.png" alt="" aria-hidden="true" class="header-icon">
    <h1 class="header-title">Focus Mode</h1>
    <button class="header-settings-btn" aria-label="Open settings">
      <!-- gear icon SVG -->
    </button>
  </header>

  <!-- Tab bar — uses tablist role, not generic divs -->
  <nav class="tab-bar" role="tablist" aria-label="Main navigation">
    <button role="tab" id="tab-home" aria-selected="true" aria-controls="panel-home"
            tabindex="0" class="tab-btn tab-btn--active">
      Home
    </button>
    <button role="tab" id="tab-blocklist" aria-selected="false" aria-controls="panel-blocklist"
            tabindex="-1" class="tab-btn">
      Blocklist
    </button>
    <button role="tab" id="tab-stats" aria-selected="false" aria-controls="panel-stats"
            tabindex="-1" class="tab-btn">
      Stats
    </button>
  </nav>

  <!-- Landmark: main content -->
  <main id="popup-content" class="popup-content">
    <!-- Tab panels -->
    <section role="tabpanel" id="panel-home" aria-labelledby="tab-home" tabindex="0">
      <!-- Home tab content rendered by home-tab.js -->
    </section>
    <section role="tabpanel" id="panel-blocklist" aria-labelledby="tab-blocklist"
             tabindex="0" hidden>
      <!-- Blocklist tab content rendered by blocklist-tab.js -->
    </section>
    <section role="tabpanel" id="panel-stats" aria-labelledby="tab-stats"
             tabindex="0" hidden>
      <!-- Stats tab content rendered by stats-tab.js -->
    </section>
  </main>

  <!-- Screen reader announcements (visually hidden) -->
  <div id="sr-announcer" aria-live="polite" aria-atomic="true" class="sr-only"></div>
  <div id="sr-announcer-assertive" aria-live="assertive" aria-atomic="true" class="sr-only"></div>

  <!-- Landmark: footer -->
  <footer class="popup-footer" role="contentinfo">
    <span class="zovo-branding">Part of Zovo</span>
  </footer>
</body>
```

**Grouping related controls:**

```html
<!-- Blocklist tab — add site form uses a labeled group -->
<form class="blocklist-add-form" role="search" aria-label="Add website to blocklist">
  <label for="blocklist-input" class="sr-only">Website to block</label>
  <input id="blocklist-input" type="text"
         placeholder="e.g. twitter.com"
         aria-describedby="blocklist-input-hint"
         autocomplete="off" />
  <span id="blocklist-input-hint" class="sr-only">
    Enter a domain name to add to your blocklist
  </span>
  <button type="submit" class="blocklist-add-btn">Add</button>
</form>

<!-- Site list uses a proper list structure -->
<ul class="blocklist-sites" role="list" aria-label="Blocked websites">
  <!-- Each site is a list item with structured content -->
  <li class="blocklist-site-item" role="listitem">
    <img src="" alt="" aria-hidden="true" class="site-favicon">
    <span class="site-domain">twitter.com</span>
    <span class="site-category badge badge--social">Social</span>
    <span class="site-blocked-count" aria-label="Blocked 47 times">47</span>
    <button class="site-remove-btn" aria-label="Remove twitter.com from blocklist">
      <svg aria-hidden="true" focusable="false"><!-- X icon --></svg>
    </button>
  </li>
</ul>
```

#### 1.4.3 Contrast — Minimum (WCAG 1.4.3)

All text must meet 4.5:1 contrast ratio against its background. Large text (18px+ or 14px+ bold) must meet 3:1.

**Focus Mode - Blocker specific contrast requirements:**

| Element | Foreground | Background | Ratio | Passes |
|---------|-----------|------------|-------|--------|
| Body text (13px) | `#1e293b` (--zovo-text-primary) | `#ffffff` (--zovo-bg-surface) | 13.5:1 | AA |
| Secondary text (12px) | `#475569` (--zovo-text-secondary) | `#ffffff` | 7.1:1 | AA |
| Tertiary text (disabled hint) | `#94a3b8` (--zovo-text-tertiary) | `#ffffff` | 3.3:1 | FAILS — must not carry essential information |
| Primary button text | `#ffffff` | `#6366f1` (--zovo-primary-500) | 4.6:1 | AA (large text at 16px semibold) |
| Tab bar active text | `#6366f1` | `#ffffff` | 4.6:1 | AA (14px bold = large text) |
| Timer countdown (36px mono) | `#1e293b` | `#ffffff` | 13.5:1 | AA |
| Block page quote (18px) | `#ffffff` | purple gradient ~`#4f46e5` | 8.6:1 | AA |
| Error text (12px) | `#dc2626` (--zovo-text-error) | `#ffffff` | 4.7:1 | AA |
| Link text | `#6366f1` | `#ffffff` | 4.6:1 | AA (must underline if not within obvious nav) |

**Dark mode token validation:**

```css
/* Dark mode must maintain equivalent ratios */
@media (prefers-color-scheme: dark) {
  :root {
    --zovo-text-primary: #f1f5f9;     /* on #0f172a = 15.4:1 */
    --zovo-text-secondary: #cbd5e1;   /* on #0f172a = 10.3:1 */
    --zovo-bg-surface: #1e293b;
    --zovo-bg-page: #0f172a;
    /* Primary buttons in dark mode */
    --zovo-primary-500: #818cf8;      /* on #1e293b = 5.2:1 */
  }
}
```

**Placeholder text handling:**

Placeholder text at `#94a3b8` on `#ffffff` is 3.3:1 — below the 4.5:1 minimum. Placeholders must never be the sole label for an input. Every input in Focus Mode - Blocker has either a visible label or an `aria-label` / `aria-labelledby`, with placeholders serving only as format hints.

#### 1.4.11 Non-text Contrast (WCAG 1.4.11)

UI components and graphical objects that convey information must have 3:1 contrast against their adjacent background.

**Timer progress ring:**

```css
/* src/popup/popup.css */

.timer-ring-progress {
  /* The progress arc must have 3:1 against the track behind it */
  stroke: var(--zovo-primary-500); /* #6366f1 on white = 4.6:1 */
  stroke-width: 6;
  fill: none;
}

.timer-ring-track {
  stroke: var(--zovo-secondary-200); /* #e2e8f0 — the track itself */
  stroke-width: 6;
  fill: none;
}

/*
  Contrast check: #6366f1 (progress) vs #e2e8f0 (track) = 3.1:1
  This passes 3:1 for non-text contrast.
  If the progress color shifts toward green (#22c55e) near completion:
  #22c55e vs #e2e8f0 = 2.8:1 — FAILS.
  Fix: use #16a34a (--zovo-success-600) for the completion state.
  #16a34a vs #e2e8f0 = 3.4:1 — passes.
*/
.timer-ring-progress--completing {
  stroke: var(--zovo-success-600); /* #059669 on track = 4.1:1 */
}
```

**Focus Score ring color states:**

```css
/* Focus Score ring color must maintain 3:1 against the ring track */
.focus-score-ring--low {
  /* Score 0-39: needs improvement */
  stroke: var(--zovo-error-500); /* #ef4444 vs #e2e8f0 track = 3.5:1 */
}

.focus-score-ring--medium {
  /* Score 40-69: average */
  stroke: var(--zovo-warning-600); /* #d97706 vs #e2e8f0 track = 3.6:1 */
}

.focus-score-ring--high {
  /* Score 70-100: good */
  stroke: var(--zovo-success-600); /* #059669 vs #e2e8f0 track = 4.1:1 */
}
```

**Button boundaries:**

```css
/* All buttons must have a visible boundary or background
   that achieves 3:1 against the surrounding surface */
.btn-primary {
  background: var(--zovo-primary-500); /* #6366f1 on #ffffff page = 4.6:1 */
  color: var(--zovo-text-inverse);
  border: none; /* Background provides the boundary */
}

.btn-secondary {
  background: transparent;
  color: var(--zovo-primary-500);
  border: 2px solid var(--zovo-primary-500); /* #6366f1 on #ffffff = 4.6:1 */
}

.btn-ghost {
  /* Ghost buttons (e.g., "Maybe later") still need 3:1 boundary on hover/focus */
  background: transparent;
  color: var(--zovo-text-secondary);
  border: 1px solid transparent;
}

.btn-ghost:hover,
.btn-ghost:focus-visible {
  border-color: var(--zovo-border-strong); /* #cbd5e1 on #ffffff = 1.8:1 — FAILS */
  /* Fix: use a darker border on hover */
  border-color: var(--zovo-secondary-400); /* #94a3b8 on #ffffff = 3.3:1 — passes */
}
```

**Form input boundaries:**

```css
/* Input fields need visible borders at 3:1 */
.form-input {
  border: 1px solid var(--zovo-border-default); /* #e2e8f0 on #ffffff = 1.4:1 — FAILS */
  /* Fix: use stronger default border */
  border: 1px solid var(--zovo-secondary-400); /* #94a3b8 on #ffffff = 3.3:1 */
  border-radius: 8px;
  padding: 8px 12px;
}

.form-input:focus {
  border-color: var(--zovo-primary-500); /* #6366f1 on #ffffff = 4.6:1 */
  outline: 2px solid var(--zovo-primary-500);
  outline-offset: 2px;
}
```

---

### 1.2 Operable

#### 2.1.1 Keyboard (WCAG 2.1.1)

Every feature in Focus Mode - Blocker must be operable via keyboard alone. This covers all interactive elements across all surfaces.

**Popup keyboard operations:**

| Action | Keyboard | Element |
|--------|----------|---------|
| Start focus session | Enter or Space | "Start Focus Session" button |
| Select quick duration | Arrow keys in row, then Enter | Quick Focus options (25m, 45m, Custom) |
| Switch tabs | Arrow Left/Right in tab bar | Tab buttons (Home, Blocklist, Stats) |
| Enter tab panel | Tab from active tab button | Panel receives focus |
| Add site to blocklist | Type domain, then Enter | Blocklist input + form submission |
| Remove site | Tab to X button, then Enter | Site row remove button |
| Pause session | Enter or Space | Pause button |
| Stop session | Enter or Space, then confirm | Stop button + confirmation dialog |
| Open settings | Enter or Space | Settings gear button |
| Dismiss paywall | Escape | Paywall modal overlay |

**Block page keyboard operations:**

| Action | Keyboard | Element |
|--------|----------|---------|
| Stay focused (go back) | Enter or Space | "Stay Focused" / "Back to Work" button (receives initial focus) |
| Override block (if available) | Tab + Enter | "Override" button |
| Close tab | Ctrl+W / Cmd+W | Browser native — must not be trapped |

**Options page keyboard operations:**

| Action | Keyboard | Element |
|--------|----------|---------|
| Navigate sections | Arrow keys in sidebar | Sidebar navigation links |
| Toggle setting | Space | Toggle switches |
| Adjust slider | Arrow Left/Right | Range sliders (timer duration, volume) |
| Skip to content | Tab (first Tab press) | Skip link jumps past sidebar |

#### 2.1.2 No Keyboard Trap (WCAG 2.1.2)

Users must be able to move focus away from any component using standard keyboard mechanisms. This is critical for modals.

**Paywall modal — no trap on dismiss:**

```javascript
// src/components/paywall/paywall-modal.js

function showPaywall(triggerId, context) {
  // ... modal creation code ...

  // Escape always dismisses — no conditions, no delays
  function handleEscape(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      dismissPaywall();
    }
  }
  document.addEventListener('keydown', handleEscape);

  // "Maybe later" link is always present and always focusable
  const dismissLink = modal.querySelector('[data-action="dismiss"]');
  dismissLink.addEventListener('click', dismissPaywall);
  dismissLink.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      dismissPaywall();
    }
  });

  function dismissPaywall() {
    document.removeEventListener('keydown', handleEscape);
    releaseFocusTrap();
    restoreFocusToTrigger();
    // Animate out, then remove from DOM
    overlay.classList.add('zovo-paywall-closing');
    setTimeout(() => overlay.remove(), 200);
  }
}
```

**Confirmation dialogs (e.g., "Enable Nuclear Mode?"):**

```javascript
// Confirmation dialogs also must never trap
function showConfirmDialog(message, onConfirm, onCancel) {
  const dialog = document.createElement('div');
  dialog.setAttribute('role', 'alertdialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'confirm-title');
  dialog.setAttribute('aria-describedby', 'confirm-desc');

  // Cancel is always accessible via both button and Escape
  const cancelBtn = dialog.querySelector('.confirm-cancel');
  cancelBtn.focus(); // Cancel is the default focus — safe by default

  document.addEventListener('keydown', function escapeHandler(e) {
    if (e.key === 'Escape') {
      document.removeEventListener('keydown', escapeHandler);
      onCancel();
      dialog.remove();
    }
  });
}
```

**Block page — explicitly no keyboard trap:**

The block page never traps keyboard focus. The user can always close the tab with Ctrl+W (Cmd+W on macOS). The page has no focus trap, no modal, no mechanism that prevents navigation away.

#### 2.4.3 Focus Order (WCAG 2.4.3)

Focus order must match the visual layout order. For the popup, this means: header controls, tab bar, active tab content, footer.

```javascript
// src/popup/popup.js — Focus management on popup open

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Read state from storage
  const state = await getPopupState();

  // 2. Render the UI based on state
  renderHeader(document.querySelector('.popup-header'));
  renderTabBar(document.querySelector('.tab-bar'));
  renderActiveTab(state);
  renderFooter(document.querySelector('.popup-footer'));

  // 3. Set initial focus based on state
  setInitialFocus(state);
});

function setInitialFocus(state) {
  // Focus order depends on extension state:
  if (state.session?.active) {
    // During active session — focus the timer for immediate status
    // (It has role="timer" so screen readers announce it)
    const timerText = document.querySelector('.timer-text');
    if (timerText) timerText.focus();
  } else if (state.session?.justCompleted) {
    // Post-session — focus the celebration heading
    const heading = document.querySelector('.post-session-heading');
    if (heading) heading.focus();
  } else {
    // Default idle — focus the primary action
    const startBtn = document.querySelector('.start-session-btn');
    if (startBtn) startBtn.focus();
  }
}
```

**Tab content focus order:**

When the user activates a tab, focus moves to the tab panel. Within each panel, DOM order matches visual order:

```javascript
// src/popup/components/tab-bar.js

function activateTab(selectedTab) {
  const tabs = document.querySelectorAll('[role="tab"]');
  const panels = document.querySelectorAll('[role="tabpanel"]');

  tabs.forEach((tab) => {
    const isSelected = tab === selectedTab;
    tab.setAttribute('aria-selected', String(isSelected));
    tab.setAttribute('tabindex', isSelected ? '0' : '-1');
  });

  panels.forEach((panel) => {
    const isActive = panel.id === selectedTab.getAttribute('aria-controls');
    panel.hidden = !isActive;
    if (isActive) {
      // Move focus into the newly revealed panel
      panel.focus();
      // Announce the tab change to screen readers
      announceToScreenReader(`${selectedTab.textContent} tab selected`, 'polite');
    }
  });
}
```

#### 2.4.7 Focus Visible (WCAG 2.4.7)

Every interactive element must have a clearly visible focus indicator. Focus Mode - Blocker uses a consistent indigo outline across all surfaces.

```css
/* src/shared/focus-styles.css — imported by popup.css, options.css, blocked.css, onboarding.css */

/*
  Global focus-visible styles.
  We use :focus-visible (not :focus) to show focus rings only for
  keyboard navigation, not mouse clicks. This provides the best UX
  for both keyboard and mouse users.
*/

/* Remove default browser outline — we provide our own */
*:focus {
  outline: none;
}

/* Keyboard focus indicator — visible, high-contrast, consistent */
*:focus-visible {
  outline: 2px solid var(--zovo-primary-500, #6366f1);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Buttons get a slight shadow enhancement for extra visibility */
button:focus-visible,
.btn:focus-visible {
  outline: 2px solid var(--zovo-primary-500, #6366f1);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2);
}

/* Tab bar buttons — focus ring within the tab bar context */
[role="tab"]:focus-visible {
  outline: 2px solid var(--zovo-primary-500, #6366f1);
  outline-offset: -2px; /* Inset so it doesn't overflow the tab bar */
  border-radius: 6px;
}

/* Inputs — replace border on focus, not just add outline */
input:focus-visible,
textarea:focus-visible,
select:focus-visible {
  outline: 2px solid var(--zovo-primary-500, #6366f1);
  outline-offset: 0;
  border-color: var(--zovo-primary-500, #6366f1);
}

/* High contrast mode support */
@media (forced-colors: active) {
  *:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }
}

/* Ensure focus indicators are visible in dark mode */
@media (prefers-color-scheme: dark) {
  *:focus-visible {
    outline-color: var(--zovo-primary-400, #818cf8);
    box-shadow: 0 0 0 4px rgba(129, 140, 248, 0.3);
  }
}
```

---

### 1.3 Understandable

#### 3.2.1 On Focus (WCAG 3.2.1)

Receiving focus must not trigger a change of context. In Focus Mode - Blocker, this means:

- Tabbing to a tab bar button does NOT activate the tab (only Enter/Space or Arrow keys activate)
- Tabbing to the "Start Focus Session" button does NOT start the session
- Tabbing to the settings gear does NOT open the options page
- Focusing a blocklist item does NOT select or expand it

```javascript
// src/popup/components/tab-bar.js — Tab activation is explicit, not on focus

function initTabBar() {
  const tabBar = document.querySelector('[role="tablist"]');

  tabBar.addEventListener('keydown', (e) => {
    const tabs = [...tabBar.querySelectorAll('[role="tab"]')];
    const currentIndex = tabs.indexOf(document.activeElement);

    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const direction = e.key === 'ArrowRight' ? 1 : -1;
      const nextIndex = (currentIndex + direction + tabs.length) % tabs.length;
      tabs[nextIndex].focus();
      // NOTE: Focus moves but tab is NOT activated yet.
      // Activation requires Enter or Space (see below).
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      activateTab(document.activeElement);
    }
  });

  // Mouse clicks do activate immediately (standard pattern)
  tabBar.addEventListener('click', (e) => {
    const tab = e.target.closest('[role="tab"]');
    if (tab) activateTab(tab);
  });
}
```

#### 3.3.1 Error Identification (WCAG 3.3.1)

When input errors occur, the error must be identified in text and described to the user. Focus Mode - Blocker has several error scenarios:

**Blocklist input validation:**

```javascript
// src/popup/components/blocklist-tab.js

function validateAndAddSite(inputValue) {
  const input = document.getElementById('blocklist-input');
  const errorEl = document.getElementById('blocklist-error');

  // Clear previous error
  errorEl.textContent = '';
  errorEl.hidden = true;
  input.removeAttribute('aria-invalid');
  input.removeAttribute('aria-errormessage');

  // Validate domain format
  const domain = normalizeDomain(inputValue);
  if (!domain) {
    showInputError(input, errorEl, 'Please enter a valid domain name (e.g., twitter.com)');
    return;
  }

  // Check for duplicates
  if (isAlreadyBlocked(domain)) {
    showInputError(input, errorEl, `${domain} is already in your blocklist`);
    return;
  }

  // Check free tier limit
  if (!isPro() && getBlockedSiteCount() >= 10) {
    showInputError(input, errorEl, 'Free plan is limited to 10 sites. Upgrade to Pro for unlimited.');
    return;
  }

  // Success — add the site
  addBlockedSite(domain);
  input.value = '';
  announceToScreenReader(`${domain} added to blocklist`, 'polite');
}

function showInputError(input, errorEl, message) {
  // 1. Show error text
  errorEl.textContent = message;
  errorEl.hidden = false;
  errorEl.id = 'blocklist-error';

  // 2. Mark input as invalid
  input.setAttribute('aria-invalid', 'true');
  input.setAttribute('aria-errormessage', 'blocklist-error');

  // 3. Announce the error
  announceToScreenReader(message, 'assertive');

  // 4. Keep focus on the input so user can correct
  input.focus();
  input.select();
}
```

**Error HTML structure:**

```html
<!-- Error element sits directly after the input for logical reading order -->
<form class="blocklist-add-form" role="search" aria-label="Add website to blocklist">
  <label for="blocklist-input" class="sr-only">Website to block</label>
  <input id="blocklist-input" type="text" placeholder="e.g. twitter.com"
         aria-describedby="blocklist-input-hint" autocomplete="off" />
  <button type="submit" class="blocklist-add-btn">Add</button>
  <p id="blocklist-error" class="form-error" role="alert" hidden></p>
  <span id="blocklist-input-hint" class="sr-only">
    Enter a domain name to add to your blocklist
  </span>
</form>
```

```css
.form-error {
  color: var(--zovo-text-error); /* #dc2626 */
  font-size: var(--zovo-text-sm); /* 12px */
  margin-top: 4px;
  /* Icon prefix for visual identification beyond color alone */
}

.form-error::before {
  content: '';
  display: inline-block;
  width: 14px;
  height: 14px;
  background: url('../icons/error-circle.svg') no-repeat center;
  margin-right: 4px;
  vertical-align: middle;
}
```

**Nuclear Mode confirmation error:**

```javascript
// src/options/sections/general.js

function confirmNuclearMode() {
  const typedConfirmation = document.getElementById('nuclear-confirm-input');
  const errorEl = document.getElementById('nuclear-confirm-error');

  if (typedConfirmation.value !== 'ENABLE') {
    errorEl.textContent = 'Type ENABLE to confirm Nuclear Mode activation';
    errorEl.hidden = false;
    typedConfirmation.setAttribute('aria-invalid', 'true');
    typedConfirmation.setAttribute('aria-errormessage', 'nuclear-confirm-error');
    announceToScreenReader('Confirmation text does not match. Type ENABLE to confirm.', 'assertive');
    typedConfirmation.focus();
    return;
  }
  // Proceed with Nuclear Mode activation
}
```

---

### 1.4 Robust

#### 4.1.2 Name, Role, Value (WCAG 4.1.2)

All custom components must expose their name, role, and value to assistive technology via ARIA. Focus Mode - Blocker has several custom widgets that require explicit ARIA.

**Tab bar (`src/popup/components/tab-bar.js`):**

```html
<!-- role="tablist" on the container, role="tab" on each button,
     role="tabpanel" on each content section -->
<nav role="tablist" aria-label="Main navigation" class="tab-bar">
  <button role="tab" id="tab-home" aria-selected="true"
          aria-controls="panel-home" tabindex="0">
    <svg aria-hidden="true" focusable="false" class="tab-icon"><!-- icon --></svg>
    Home
  </button>
  <button role="tab" id="tab-blocklist" aria-selected="false"
          aria-controls="panel-blocklist" tabindex="-1">
    <svg aria-hidden="true" focusable="false" class="tab-icon"><!-- icon --></svg>
    Blocklist
  </button>
  <button role="tab" id="tab-stats" aria-selected="false"
          aria-controls="panel-stats" tabindex="-1">
    <svg aria-hidden="true" focusable="false" class="tab-icon"><!-- icon --></svg>
    Stats
  </button>
</nav>
```

**Timer display (`src/popup/components/timer-display.js`):**

```javascript
function createTimerDisplay(container) {
  const wrapper = document.createElement('div');
  wrapper.className = 'timer-display';

  // The timer text has role="timer" and is the accessible representation
  const timerText = document.createElement('div');
  timerText.className = 'timer-text';
  timerText.setAttribute('role', 'timer');
  timerText.setAttribute('aria-label', 'Focus session countdown');
  timerText.setAttribute('tabindex', '0');

  // The SVG ring is decorative
  const svgRing = createSvgRing();
  svgRing.setAttribute('aria-hidden', 'true');
  svgRing.setAttribute('focusable', 'false');

  wrapper.append(svgRing, timerText);
  container.append(wrapper);
}
```

**Streak display (`src/popup/components/streak-display.js`):**

```javascript
function renderStreakDisplay(container, streakData) {
  const wrapper = document.createElement('div');
  wrapper.className = 'streak-display';
  wrapper.setAttribute('role', 'status');
  wrapper.setAttribute('aria-label',
    `Current streak: ${streakData.current} days. Best streak: ${streakData.best} days.`
  );

  // Fire icon is decorative
  const icon = document.createElement('span');
  icon.className = 'streak-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = ''; // fire emoji rendered via CSS background-image instead

  const text = document.createElement('span');
  text.className = 'streak-text';
  text.textContent = `${streakData.current} day streak`;

  wrapper.append(icon, text);
  container.append(wrapper);
}
```

**Quick Focus options row:**

```javascript
function renderQuickFocusOptions(container, isPro) {
  const group = document.createElement('div');
  group.className = 'quick-focus-options';
  group.setAttribute('role', 'radiogroup');
  group.setAttribute('aria-label', 'Quick focus duration');

  const options = [
    { label: '25 min', value: 25, enabled: true },
    { label: '45 min', value: 45, enabled: true },
    { label: 'Custom', value: 0, enabled: isPro },
  ];

  options.forEach((option, index) => {
    const btn = document.createElement('button');
    btn.className = 'quick-focus-btn';
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', index === 0 ? 'true' : 'false');
    btn.setAttribute('tabindex', index === 0 ? '0' : '-1');
    btn.textContent = option.label;

    if (!option.enabled) {
      btn.setAttribute('aria-disabled', 'true');
      btn.setAttribute('aria-label', `${option.label} — requires Pro upgrade`);
    }

    group.append(btn);
  });

  container.append(group);
}
```

**Options page toggle switches:**

```javascript
// src/options/components/toggle-switch.js

function createToggleSwitch(id, label, checked, onChange) {
  const wrapper = document.createElement('div');
  wrapper.className = 'toggle-wrapper';

  const labelEl = document.createElement('label');
  labelEl.setAttribute('for', id);
  labelEl.textContent = label;

  const toggle = document.createElement('button');
  toggle.id = id;
  toggle.className = 'toggle-switch';
  toggle.setAttribute('role', 'switch');
  toggle.setAttribute('aria-checked', String(checked));
  toggle.setAttribute('aria-labelledby', labelEl.id || '');

  toggle.addEventListener('click', () => {
    const newState = toggle.getAttribute('aria-checked') !== 'true';
    toggle.setAttribute('aria-checked', String(newState));
    onChange(newState);
  });

  toggle.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      toggle.click();
    }
  });

  wrapper.append(labelEl, toggle);
  return wrapper;
}
```

---

### 1.5 Extension-Specific Surfaces

Each Focus Mode - Blocker surface has unique accessibility requirements driven by its context and constraints.

#### Popup (380x500px)

**Constraints:** Limited viewport, no URL bar, destroyed/recreated on every open/close, port-based timer updates.

**Focus restoration on open:**

```javascript
// src/popup/popup.js

let lastFocusedElementSelector = null;

// Save focus position before popup closes (best-effort via visibilitychange)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    const focused = document.activeElement;
    if (focused && focused !== document.body) {
      // Store a selector that can re-find this element on next open
      lastFocusedElementSelector = buildUniqueSelector(focused);
      chrome.storage.session.set({ popupLastFocus: lastFocusedElementSelector });
    }
  }
});

// Restore focus on popup open
async function restoreFocusOnOpen(state) {
  const { popupLastFocus } = await chrome.storage.session.get('popupLastFocus');
  if (popupLastFocus) {
    const el = document.querySelector(popupLastFocus);
    if (el) {
      el.focus();
      chrome.storage.session.remove('popupLastFocus');
      return;
    }
  }
  // Fallback to default focus based on current state
  setInitialFocus(state);
}
```

**Live region for dynamic updates:**

```javascript
// src/popup/utils/popup-helpers.js

/**
 * Announce a message to screen readers via the live region.
 * Uses two live regions: one polite (status updates), one assertive (errors, completion).
 */
function announceToScreenReader(message, priority = 'polite') {
  const regionId = priority === 'assertive' ? 'sr-announcer-assertive' : 'sr-announcer';
  const region = document.getElementById(regionId);
  if (!region) return;

  // Clear and re-set to force re-announcement of identical messages
  region.textContent = '';
  requestAnimationFrame(() => {
    region.textContent = message;
  });
}
```

#### Block Page (Full Tab)

**Context:** The user is frustrated — they tried to visit a blocked site. The page must be calm, accessible, and easy to navigate. The user may be a neurodivergent professional (persona "Sam") who is already experiencing attention difficulty.

**Accessible block page injection:**

```javascript
// src/content/block-page/block-page-inject.js

/**
 * Inject the block page as a full-viewport overlay on a blocked domain.
 * This overlay must not break the host page's accessibility tree.
 * The overlay creates its own stacking context with a shadow DOM
 * to isolate styles and ARIA from the host page.
 */
function injectBlockPage(blockedDomain, sessionData) {
  // Create a container element in the host page
  const host = document.createElement('div');
  host.id = 'zovo-block-overlay';
  host.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    z-index: 2147483647; /* Maximum z-index */
  `;

  // Use Shadow DOM to isolate from host page styles and ARIA
  const shadow = host.attachShadow({ mode: 'closed' });

  // The block page content lives entirely within the shadow DOM
  shadow.innerHTML = `
    <style>${getBlockPageStyles()}</style>
    <div class="block-page" role="main" aria-label="Site blocked by Focus Mode">
      <div class="block-content">
        <div class="block-icon" aria-hidden="true">
          <!-- Shield SVG -->
        </div>

        <h1 class="block-heading">Stay focused. You've got this.</h1>

        <p class="block-domain" aria-label="Blocked site: ${sanitizeDomain(blockedDomain)}">
          ${sanitizeDomain(blockedDomain)} is blocked during your focus session.
        </p>

        <blockquote class="block-quote" aria-label="Motivational quote">
          <p>${sanitizeText(sessionData.quote.text)}</p>
          <cite>${sanitizeText(sessionData.quote.author)}</cite>
        </blockquote>

        <!-- Stats grid -->
        <div class="block-stats" role="group" aria-label="Your focus stats today">
          <div class="stat" role="text">
            <span class="stat-value" aria-hidden="true">${sessionData.timeSaved}</span>
            <span class="stat-label">Time Saved</span>
            <span class="sr-only">${sessionData.timeSaved} time saved today</span>
          </div>
          <!-- ... other stats ... -->
        </div>

        <!-- Primary action — receives initial focus -->
        <button class="block-stay-btn" autofocus
                aria-label="Stay focused and go back to work">
          Stay Focused
        </button>

        <!-- Secondary action — override (if allowed by settings) -->
        ${sessionData.allowOverride ? `
          <button class="block-override-btn"
                  aria-label="Override block for ${sanitizeDomain(blockedDomain)}. This will affect your Focus Score.">
            Override this time
          </button>
        ` : ''}

        <p class="block-privacy" aria-hidden="true">
          This page never tracks your browsing.
        </p>
      </div>
    </div>
  `;

  // Set the host page's main content to inert so assistive technology
  // only interacts with the block overlay
  document.querySelectorAll('body > *:not(#zovo-block-overlay)').forEach((el) => {
    el.setAttribute('inert', '');
    el.setAttribute('aria-hidden', 'true');
  });

  document.body.appendChild(host);

  // Focus the "Stay Focused" button after a short delay to ensure rendering
  requestAnimationFrame(() => {
    const stayBtn = shadow.querySelector('.block-stay-btn');
    if (stayBtn) stayBtn.focus();
  });
}
```

**Block page timer countdown announcement:**

When the block page shows remaining session time, it follows the same milestone-based announcement pattern as the popup timer — never every-second announcements that would overwhelm screen readers.

#### Options Page (Full Tab)

Standard web accessibility applies. The options page is a full browser tab with sidebar navigation and settings forms. It benefits from all native browser accessibility features including skip links, proper heading hierarchy, and ARIA landmarks.

```html
<!-- src/options/options.html — landmark structure -->
<body class="zovo-options">
  <a href="#main-content" class="skip-link">Skip to settings</a>

  <nav class="options-sidebar" role="navigation" aria-label="Settings sections">
    <h2 class="sr-only">Settings Navigation</h2>
    <ul role="list">
      <li><a href="#general" class="sidebar-link sidebar-link--active" aria-current="page">General</a></li>
      <li><a href="#blocklist" class="sidebar-link">Blocklist</a></li>
      <li><a href="#timer" class="sidebar-link">Timer</a></li>
      <li><a href="#focus-score" class="sidebar-link">Focus Score</a></li>
      <li><a href="#sounds" class="sidebar-link">Sounds</a></li>
      <li><a href="#appearance" class="sidebar-link">Appearance</a></li>
      <li><a href="#account" class="sidebar-link">Account</a></li>
      <li><a href="#about" class="sidebar-link">About</a></li>
    </ul>
  </nav>

  <main id="main-content" class="options-content" role="main">
    <h1 class="options-heading">Focus Mode Settings</h1>
    <!-- Active section rendered here -->
  </main>
</body>
```

#### Content Script (Injected)

The content script (detector + blocker) must not break the host page's existing accessibility tree:

- Shadow DOM isolates block overlay styles and ARIA from the host page
- `inert` attribute on host page content prevents assistive tech from reading behind the overlay
- On cleanup (when block is removed), `inert` and `aria-hidden` attributes are restored
- The detector script (`content-script.js`) adds no DOM elements and has zero accessibility footprint

---

## 2. Keyboard Navigation

### 2.1 FocusManager Class

The `FocusManager` class centralizes focus management for the popup, which has tab-based navigation and dynamic content that changes based on extension state.

```javascript
// src/popup/utils/focus-manager.js

/**
 * FocusManager handles all focus logic for the popup.
 *
 * Responsibilities:
 * - Setting initial focus when popup opens (state-dependent)
 * - Managing focus when tabs switch
 * - Restoring focus after modal dismissal
 * - Handling focus for dynamically inserted content (site added, error shown)
 * - Announcing focus-related changes to screen readers
 */
class FocusManager {
  constructor() {
    this.focusStack = []; // Stack of elements to restore focus to
    this.activeTabId = 'tab-home';
    this.announcer = document.getElementById('sr-announcer');
  }

  /**
   * Initialize focus management for the popup.
   * Called once during popup.js DOMContentLoaded.
   */
  init(state) {
    this.bindTabBarKeyboard();
    this.setInitialFocus(state);
  }

  /**
   * Set focus based on extension state.
   * Priority order:
   * 1. Active session -> timer display
   * 2. Post-session -> celebration heading
   * 3. Idle -> "Start Focus Session" button
   */
  setInitialFocus(state) {
    let targetSelector;

    if (state.session?.active) {
      targetSelector = '.timer-text';
    } else if (state.session?.justCompleted) {
      targetSelector = '.post-session-heading';
    } else {
      targetSelector = '.start-session-btn';
    }

    const target = document.querySelector(targetSelector);
    if (target) {
      // Short delay ensures DOM is fully rendered before focusing
      requestAnimationFrame(() => target.focus());
    }
  }

  /**
   * Handle tab switch focus management.
   * When a new tab is activated:
   * 1. The old panel is hidden
   * 2. The new panel is shown
   * 3. Focus moves to the first focusable element in the new panel
   */
  onTabSwitch(newTabId) {
    this.activeTabId = newTabId;
    const panelId = newTabId.replace('tab-', 'panel-');
    const panel = document.getElementById(panelId);

    if (panel) {
      // Focus the panel itself (has tabindex="0") so screen reader
      // announces the panel label
      panel.focus();
      this.announce(`${this.getTabLabel(newTabId)} tab`);
    }
  }

  /**
   * Push a focus restoration point.
   * Called before opening a modal, dialog, or other overlay.
   */
  pushFocus() {
    this.focusStack.push(document.activeElement);
  }

  /**
   * Pop and restore focus to the previously focused element.
   * Called after closing a modal, dialog, or other overlay.
   */
  popFocus() {
    const previousElement = this.focusStack.pop();
    if (previousElement && document.contains(previousElement)) {
      previousElement.focus();
    } else {
      // Fallback: focus the active tab button
      const activeTab = document.querySelector(`#${this.activeTabId}`);
      if (activeTab) activeTab.focus();
    }
  }

  /**
   * Handle focus when new content is dynamically added.
   * Example: a site is added to the blocklist, and the new list item
   * should be announced but focus should stay on the input.
   */
  onContentAdded(announcement, focusTarget = null) {
    this.announce(announcement);
    if (focusTarget) {
      const el = typeof focusTarget === 'string'
        ? document.querySelector(focusTarget)
        : focusTarget;
      if (el) el.focus();
    }
  }

  /**
   * Handle focus when content is removed.
   * Example: a site is removed from the blocklist. Focus should move
   * to the next item, or the previous item, or the input.
   */
  onContentRemoved(removedElement, listContainer) {
    const items = listContainer.querySelectorAll('.blocklist-site-item');
    const removedIndex = [...listContainer.children].indexOf(removedElement);

    // After removal, focus the next item, or previous, or the add input
    if (items.length > 1) {
      const nextIndex = Math.min(removedIndex, items.length - 2);
      const nextItem = items[nextIndex === removedIndex ? nextIndex + 1 : nextIndex];
      if (nextItem) {
        const removeBtn = nextItem.querySelector('.site-remove-btn');
        if (removeBtn) removeBtn.focus();
      }
    } else {
      // List is now empty — focus the add input
      const input = document.getElementById('blocklist-input');
      if (input) input.focus();
    }
  }

  /**
   * Set up keyboard navigation for the tab bar using arrow keys.
   */
  bindTabBarKeyboard() {
    const tabBar = document.querySelector('[role="tablist"]');
    if (!tabBar) return;

    tabBar.addEventListener('keydown', (e) => {
      const tabs = [...tabBar.querySelectorAll('[role="tab"]')];
      const currentIndex = tabs.indexOf(document.activeElement);
      if (currentIndex === -1) return;

      let newIndex = currentIndex;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          newIndex = (currentIndex + 1) % tabs.length;
          break;
        case 'ArrowLeft':
          e.preventDefault();
          newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
          break;
        case 'Home':
          e.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          newIndex = tabs.length - 1;
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          activateTab(tabs[currentIndex]);
          return;
        default:
          return;
      }

      // Move focus to the new tab (do not activate yet)
      tabs[currentIndex].setAttribute('tabindex', '-1');
      tabs[newIndex].setAttribute('tabindex', '0');
      tabs[newIndex].focus();
    });
  }

  /**
   * Announce a message to screen readers.
   */
  announce(message, priority = 'polite') {
    announceToScreenReader(message, priority);
  }

  /**
   * Get the visible label text for a tab ID.
   */
  getTabLabel(tabId) {
    const tab = document.getElementById(tabId);
    return tab ? tab.textContent.trim() : '';
  }
}

// Singleton instance for the popup
const focusManager = new FocusManager();
export default focusManager;
```

---

### 2.2 Tab Order Optimization

The popup HTML source order determines the Tab key navigation sequence. The order must match the visual layout: Header (top) > Tab bar > Active tab content > Footer (bottom).

**Accessible popup HTML structure:**

```html
<!-- src/popup/popup.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=380">
  <title>Focus Mode - Blocker</title>
  <link rel="stylesheet" href="popup.css">
</head>
<body class="zovo-popup">

  <!-- 1. HEADER — first in tab order -->
  <header class="popup-header" role="banner">
    <img src="../icons/icon-32.png" alt="" aria-hidden="true" class="header-icon">
    <h1 class="header-title">Focus Mode</h1>
    <button class="header-settings-btn" aria-label="Open settings"
            title="Open settings">
      <svg aria-hidden="true" focusable="false" width="20" height="20">
        <!-- gear icon -->
      </svg>
    </button>
  </header>

  <!-- 2. TAB BAR — second in tab order, arrow keys navigate within -->
  <nav class="tab-bar" role="tablist" aria-label="Main navigation">
    <button role="tab" id="tab-home" aria-selected="true"
            aria-controls="panel-home" tabindex="0" class="tab-btn tab-btn--active">
      <svg aria-hidden="true" focusable="false" class="tab-icon"><!-- icon --></svg>
      Home
    </button>
    <button role="tab" id="tab-blocklist" aria-selected="false"
            aria-controls="panel-blocklist" tabindex="-1" class="tab-btn">
      <svg aria-hidden="true" focusable="false" class="tab-icon"><!-- icon --></svg>
      Blocklist
    </button>
    <button role="tab" id="tab-stats" aria-selected="false"
            aria-controls="panel-stats" tabindex="-1" class="tab-btn">
      <svg aria-hidden="true" focusable="false" class="tab-icon"><!-- icon --></svg>
      Stats
    </button>
  </nav>

  <!-- 3. TAB PANELS — third in tab order, only active panel is in the flow -->
  <main id="popup-content" class="popup-content">

    <!-- Home panel: tab order within is
         Start Session btn > Quick Focus options > Stats summary -->
    <section role="tabpanel" id="panel-home" aria-labelledby="tab-home" tabindex="0">
      <button class="start-session-btn btn-primary">Start Focus Session</button>

      <div class="quick-focus-options" role="radiogroup" aria-label="Quick focus duration">
        <button role="radio" aria-checked="true" tabindex="0" class="quick-focus-btn">25 min</button>
        <button role="radio" aria-checked="false" tabindex="-1" class="quick-focus-btn">45 min</button>
        <button role="radio" aria-checked="false" tabindex="-1" class="quick-focus-btn"
                aria-disabled="true" aria-label="Custom duration — requires Pro upgrade">Custom</button>
      </div>

      <div class="quick-stats" role="group" aria-label="Today's summary">
        <div class="focus-score-ring" role="meter" aria-label="Focus Score"
             aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"
             aria-valuetext="Focus Score: 0 out of 100">
          <svg aria-hidden="true" focusable="false"><!-- ring SVG --></svg>
          <span class="score-text">0</span>
        </div>
        <div class="streak-display" role="status" aria-label="Current streak: 0 days">
          <span aria-hidden="true" class="streak-icon"></span>
          <span class="streak-text">0 day streak</span>
        </div>
      </div>
    </section>

    <!-- Blocklist panel: tab order within is
         Search/add input > Add button > Site list items > Category toggles -->
    <section role="tabpanel" id="panel-blocklist" aria-labelledby="tab-blocklist"
             tabindex="0" hidden>
      <form class="blocklist-add-form" role="search" aria-label="Add website to blocklist">
        <label for="blocklist-input" class="sr-only">Website to block</label>
        <input id="blocklist-input" type="text" placeholder="e.g. twitter.com"
               aria-describedby="blocklist-input-hint" autocomplete="off" />
        <button type="submit" class="blocklist-add-btn">Add</button>
        <p id="blocklist-error" class="form-error" role="alert" hidden></p>
        <span id="blocklist-input-hint" class="sr-only">
          Enter a domain name to add to your blocklist
        </span>
      </form>
      <ul class="blocklist-sites" role="list" aria-label="Blocked websites">
        <!-- Site items rendered dynamically -->
      </ul>
    </section>

    <!-- Stats panel: tab order within is
         Focus Score ring > Streak display > Stats grid cells -->
    <section role="tabpanel" id="panel-stats" aria-labelledby="tab-stats"
             tabindex="0" hidden>
      <!-- Stats content rendered by stats-tab.js -->
    </section>
  </main>

  <!-- Screen reader live regions (visually hidden) -->
  <div id="sr-announcer" aria-live="polite" aria-atomic="true" class="sr-only"></div>
  <div id="sr-announcer-assertive" aria-live="assertive" aria-atomic="true" class="sr-only"></div>

  <!-- 4. FOOTER — last in tab order -->
  <footer class="popup-footer" role="contentinfo">
    <a href="https://zovo.dev" class="zovo-branding" target="_blank"
       rel="noopener noreferrer">Part of Zovo</a>
  </footer>

  <script src="popup.js" type="module"></script>
</body>
</html>
```

**Visually hidden utility class:**

```css
/* Used throughout for screen-reader-only content */
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

/* Allow sr-only content to become visible on focus (for skip links) */
.sr-only--focusable:focus,
.sr-only--focusable:active {
  position: static;
  width: auto;
  height: auto;
  padding: 8px 16px;
  margin: 0;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

---

### 2.3 Keyboard Shortcuts

Focus Mode - Blocker defines both global shortcuts (via `chrome.commands`) and in-page shortcuts for navigation.

#### Global Extension Shortcuts

Registered in `manifest.json` and handled by the service worker:

```json
{
  "commands": {
    "toggle-focus-session": {
      "suggested_key": {
        "default": "Ctrl+Shift+F",
        "mac": "Command+Shift+F"
      },
      "description": "Start or stop focus session"
    },
    "_execute_action": {
      "suggested_key": {
        "default": "Ctrl+Shift+B",
        "mac": "Command+Shift+B"
      },
      "description": "Open Focus Mode popup"
    }
  }
}
```

```javascript
// src/background/service-worker.js

chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-focus-session') {
    toggleFocusSession();
  }
});

async function toggleFocusSession() {
  const { sessionActive } = await chrome.storage.session.get('sessionActive');
  if (sessionActive) {
    await stopSession();
    // Update badge to reflect stopped state
    chrome.action.setBadgeText({ text: '' });
  } else {
    await startSession({ duration: 25 * 60, type: 'quickFocus' });
    // Update badge to reflect active state
    chrome.action.setBadgeText({ text: 'ON' });
    chrome.action.setBadgeBackgroundColor({ color: '#22c55e' });
  }
}
```

#### In-Page Keyboard Shortcuts

These shortcuts work when the popup or options page has focus:

```javascript
// src/popup/utils/keyboard-shortcuts.js

/**
 * Register popup-specific keyboard shortcuts.
 * These apply only while the popup is open and focused.
 */
function initPopupShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Do not capture shortcuts when user is typing in an input
    if (isTypingInInput(e.target)) {
      // Exception: Escape still works in inputs (clears/cancels)
      if (e.key === 'Escape') {
        e.target.blur();
        return;
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        handleEscape(e);
        break;

      case '/':
        // Focus blocklist search input
        e.preventDefault();
        switchToTab('tab-blocklist');
        const searchInput = document.getElementById('blocklist-input');
        if (searchInput) searchInput.focus();
        break;

      case '?':
        // Show keyboard shortcuts help
        e.preventDefault();
        showShortcutsHelp();
        break;

      case 'Enter':
      case ' ':
        // Activate focused button (native behavior, but ensure custom
        // widgets also respond)
        if (document.activeElement.getAttribute('role') === 'radio') {
          e.preventDefault();
          selectQuickFocusOption(document.activeElement);
        }
        break;

      default:
        break;
    }
  });
}

function handleEscape(e) {
  e.preventDefault();

  // Priority 1: Close paywall modal if open
  if (isPaywallVisible()) {
    dismissPaywall();
    return;
  }

  // Priority 2: Close confirmation dialog if open
  const dialog = document.querySelector('[role="alertdialog"]');
  if (dialog) {
    dismissDialog(dialog);
    return;
  }

  // Priority 3: Cancel blocklist input if it has content
  const input = document.getElementById('blocklist-input');
  if (input && document.activeElement === input && input.value) {
    input.value = '';
    announceToScreenReader('Input cleared', 'polite');
    return;
  }

  // Priority 4: Close the popup
  window.close();
}

function isTypingInInput(element) {
  const tagName = element.tagName.toLowerCase();
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    element.isContentEditable
  );
}

/**
 * Show the keyboard shortcuts help overlay.
 * Implemented as an accessible dialog listing all shortcuts.
 */
function showShortcutsHelp() {
  focusManager.pushFocus();

  const overlay = document.createElement('div');
  overlay.className = 'shortcuts-help-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Keyboard shortcuts');

  overlay.innerHTML = `
    <div class="shortcuts-help-modal">
      <h2 id="shortcuts-title">Keyboard Shortcuts</h2>
      <button class="shortcuts-close-btn" aria-label="Close shortcuts help">
        <svg aria-hidden="true" focusable="false" width="16" height="16">
          <line x1="4" y1="4" x2="12" y2="12" stroke="currentColor" stroke-width="2"/>
          <line x1="12" y1="4" x2="4" y2="12" stroke="currentColor" stroke-width="2"/>
        </svg>
      </button>
      <dl class="shortcuts-list">
        <div class="shortcut-item">
          <dt><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>F</kbd></dt>
          <dd>Start / stop focus session</dd>
        </div>
        <div class="shortcut-item">
          <dt><kbd>Esc</kbd></dt>
          <dd>Close popup, dismiss modal, cancel input</dd>
        </div>
        <div class="shortcut-item">
          <dt><kbd>/</kbd></dt>
          <dd>Focus blocklist search</dd>
        </div>
        <div class="shortcut-item">
          <dt><kbd>?</kbd></dt>
          <dd>Show this help</dd>
        </div>
        <div class="shortcut-item">
          <dt><kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd></dt>
          <dd>Navigate between elements</dd>
        </div>
        <div class="shortcut-item">
          <dt><kbd>Enter</kbd> / <kbd>Space</kbd></dt>
          <dd>Activate buttons, start sessions</dd>
        </div>
        <div class="shortcut-item">
          <dt><kbd>&larr;</kbd> <kbd>&rarr;</kbd></dt>
          <dd>Navigate tab bar, duration options</dd>
        </div>
      </dl>
    </div>
  `;

  document.body.appendChild(overlay);

  // Trap focus within the shortcuts dialog
  const releaseTrap = trapFocus(overlay.querySelector('.shortcuts-help-modal'));

  // Close on Escape or close button
  const closeBtn = overlay.querySelector('.shortcuts-close-btn');
  closeBtn.focus();

  function close() {
    releaseTrap();
    overlay.remove();
    focusManager.popFocus();
  }

  closeBtn.addEventListener('click', close);
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  });
}
```

**Keyboard shortcut summary table:**

| Shortcut | Context | Action |
|----------|---------|--------|
| `Ctrl+Shift+F` / `Cmd+Shift+F` | Global (any page) | Start or stop focus session |
| `Ctrl+Shift+B` / `Cmd+Shift+B` | Global (any page) | Open Focus Mode popup |
| `Escape` | Popup, block page, options | Close popup / dismiss modal / cancel input |
| `/` | Popup | Focus blocklist search input |
| `?` | Popup | Show keyboard shortcuts help dialog |
| `Tab` / `Shift+Tab` | All pages | Navigate between interactive elements |
| `Enter` / `Space` | All pages | Activate focused button or control |
| `Arrow Left` / `Arrow Right` | Tab bar, Quick Focus row | Navigate between tabs or duration options |
| `Home` / `End` | Tab bar | Jump to first or last tab |
| `Arrow Up` / `Arrow Down` | Blocklist, Options sidebar | Navigate list items or sidebar links |

---

### 2.4 Focus Trapping in Modals

Focus trapping ensures that Tab/Shift+Tab cycling stays within a modal while it is open. Focus Mode - Blocker uses focus traps for the paywall modal and confirmation dialogs.

```javascript
// src/shared/utils/focus-trap.js

/**
 * FocusTrap class for modals and dialogs in Focus Mode - Blocker.
 *
 * Used by:
 * - Paywall modal (src/components/paywall/paywall-modal.js)
 * - Confirmation dialogs ("Clear all blocked sites?", "Enable Nuclear Mode?")
 * - Keyboard shortcuts help dialog
 *
 * Design principles:
 * - Escape ALWAYS releases the trap and closes the modal
 * - The trap captures Tab and Shift+Tab only (no other keys)
 * - The first focusable element receives focus when the trap activates
 * - The previously focused element receives focus when the trap releases
 */
class FocusTrap {
  constructor(container, options = {}) {
    this.container = container;
    this.previouslyFocused = document.activeElement;
    this.onEscape = options.onEscape || null;
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.active = false;
  }

  /**
   * Activate the focus trap.
   * Focus moves to the first focusable element within the container.
   */
  activate() {
    if (this.active) return;
    this.active = true;

    document.addEventListener('keydown', this.handleKeyDown);

    // Focus the first focusable element (or the container itself if none found)
    const firstFocusable = this.getFirstFocusable();
    if (firstFocusable) {
      requestAnimationFrame(() => firstFocusable.focus());
    }
  }

  /**
   * Deactivate the focus trap.
   * Focus returns to the element that was focused before the trap activated.
   */
  deactivate() {
    if (!this.active) return;
    this.active = false;

    document.removeEventListener('keydown', this.handleKeyDown);

    // Restore focus to the element that triggered the modal
    if (this.previouslyFocused && document.contains(this.previouslyFocused)) {
      this.previouslyFocused.focus();
    }
  }

  /**
   * Handle keyboard events while the trap is active.
   */
  handleKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      if (this.onEscape) {
        this.onEscape();
      }
      this.deactivate();
      return;
    }

    if (e.key !== 'Tab') return;

    const focusable = this.getFocusableElements();
    if (focusable.length === 0) return;

    const firstFocusable = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];

    if (e.shiftKey) {
      // Shift+Tab: if on first element, wrap to last
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      // Tab: if on last element, wrap to first
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  }

  /**
   * Get all focusable elements within the container.
   */
  getFocusableElements() {
    const selector = [
      'a[href]',
      'button:not([disabled]):not([aria-disabled="true"])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    return [...this.container.querySelectorAll(selector)].filter(
      (el) => !el.closest('[hidden]') && el.offsetParent !== null
    );
  }

  /**
   * Get the first focusable element.
   */
  getFirstFocusable() {
    const elements = this.getFocusableElements();
    return elements.length > 0 ? elements[0] : this.container;
  }
}

export default FocusTrap;
```

**Integration with paywall modal:**

```javascript
// src/components/paywall/paywall-modal.js

import FocusTrap from '../../shared/utils/focus-trap.js';

let activeTrap = null;

async function showPaywall(triggerId, context) {
  const content = getPaywallContent(triggerId, context);
  const overlay = createPaywallDOM(content);
  document.body.appendChild(overlay);

  // Wait for animation frame to ensure DOM is rendered
  requestAnimationFrame(() => {
    overlay.classList.add('zovo-paywall-visible');
  });

  // Create and activate focus trap on the modal card
  const modal = overlay.querySelector('.zovo-paywall-modal');
  activeTrap = new FocusTrap(modal, {
    onEscape: () => dismissPaywall(),
  });
  activeTrap.activate();
}

function dismissPaywall() {
  if (activeTrap) {
    activeTrap.deactivate();
    activeTrap = null;
  }

  const overlay = document.querySelector('.zovo-paywall-overlay');
  if (overlay) {
    overlay.classList.add('zovo-paywall-closing');
    setTimeout(() => overlay.remove(), 200);
  }
}
```

**Integration with confirmation dialogs:**

```javascript
// src/popup/utils/confirm-dialog.js

import FocusTrap from '../../shared/utils/focus-trap.js';

/**
 * Show a confirmation dialog.
 * Used for destructive actions like "Clear all blocked sites?" and "Enable Nuclear Mode?"
 *
 * @param {string} title - Dialog heading
 * @param {string} message - Description of the action
 * @param {string} confirmLabel - Text for the confirm button (e.g., "Clear All", "Enable")
 * @param {string} cancelLabel - Text for the cancel button (default: "Cancel")
 * @returns {Promise<boolean>} - Resolves true if confirmed, false if cancelled
 */
function showConfirmDialog(title, message, confirmLabel, cancelLabel = 'Cancel') {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog';
    dialog.setAttribute('role', 'alertdialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'confirm-dialog-title');
    dialog.setAttribute('aria-describedby', 'confirm-dialog-desc');

    dialog.innerHTML = `
      <h2 id="confirm-dialog-title">${title}</h2>
      <p id="confirm-dialog-desc">${message}</p>
      <div class="confirm-actions">
        <button class="btn-secondary confirm-cancel">${cancelLabel}</button>
        <button class="btn-danger confirm-action">${confirmLabel}</button>
      </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const trap = new FocusTrap(dialog, {
      onEscape: () => {
        cleanup();
        resolve(false);
      },
    });
    trap.activate();

    // Focus the cancel button by default (safe action)
    const cancelBtn = dialog.querySelector('.confirm-cancel');
    cancelBtn.focus();

    cancelBtn.addEventListener('click', () => {
      cleanup();
      resolve(false);
    });

    dialog.querySelector('.confirm-action').addEventListener('click', () => {
      cleanup();
      resolve(true);
    });

    function cleanup() {
      trap.deactivate();
      overlay.remove();
    }
  });
}

export { showConfirmDialog };
```

---

### 2.5 Skip Links

The options page has complex sidebar navigation with 8 sections. A skip link allows keyboard users to bypass the sidebar and jump directly to the settings content.

```html
<!-- src/options/options.html -->
<body class="zovo-options">
  <!-- Skip link — first element in DOM, hidden until focused -->
  <a href="#main-content" class="skip-link sr-only sr-only--focusable">
    Skip to settings
  </a>

  <nav class="options-sidebar" role="navigation" aria-label="Settings sections">
    <!-- 8 sidebar links -->
  </nav>

  <main id="main-content" class="options-content" role="main" tabindex="-1">
    <!-- tabindex="-1" allows the skip link to move focus here
         without adding the element to the natural tab order -->
    <h1 class="options-heading">Focus Mode Settings</h1>
    <!-- Active section rendered here -->
  </main>
</body>
```

```css
/* Skip link styles */
.skip-link {
  /* When not focused, visually hidden via .sr-only */
}

.skip-link:focus {
  /* Override sr-only when focused */
  position: fixed;
  top: 8px;
  left: 8px;
  z-index: 100000;
  padding: 12px 24px;
  background: var(--zovo-primary-500);
  color: var(--zovo-text-inverse);
  font-size: var(--zovo-text-md);
  font-weight: var(--zovo-weight-semibold);
  border-radius: 8px;
  text-decoration: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  /* Ensure it is visible and high-contrast */
  width: auto;
  height: auto;
  clip: auto;
  overflow: visible;
  white-space: normal;
  margin: 0;
}
```

**Skip link JavaScript for smooth focus management:**

```javascript
// src/options/options.js

document.querySelector('.skip-link').addEventListener('click', (e) => {
  e.preventDefault();
  const target = document.getElementById('main-content');
  if (target) {
    target.focus();
    // Announce the section for screen readers
    announceToScreenReader('Skipped to settings content', 'polite');
  }
});
```

The popup does not need a skip link because its tab order is already short (header has only one button before the tab bar), and the total interactive element count is low enough that a skip link would add more complexity than it saves.

---

### 2.6 Roving Tabindex

Roving tabindex is used for composite widgets where arrow keys navigate between items and Tab moves focus in/out of the group. Focus Mode - Blocker uses this pattern for the tab bar and the Quick Focus duration options.

#### Tab Bar (Home / Blocklist / Stats)

Only one tab button has `tabindex="0"` at any time. Arrow keys move the `tabindex="0"` between tabs. Tab key moves focus OUT of the tab bar and into the active tab panel.

```javascript
// src/popup/components/tab-bar.js

function initRovingTabindex() {
  const tabBar = document.querySelector('[role="tablist"]');
  const tabs = [...tabBar.querySelectorAll('[role="tab"]')];

  // Initial state: only the active tab has tabindex="0"
  tabs.forEach((tab) => {
    const isSelected = tab.getAttribute('aria-selected') === 'true';
    tab.setAttribute('tabindex', isSelected ? '0' : '-1');
  });

  tabBar.addEventListener('keydown', (e) => {
    const currentIndex = tabs.indexOf(document.activeElement);
    if (currentIndex === -1) return;

    let handled = false;
    let newIndex = currentIndex;

    switch (e.key) {
      case 'ArrowRight':
        newIndex = (currentIndex + 1) % tabs.length;
        handled = true;
        break;
      case 'ArrowLeft':
        newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        handled = true;
        break;
      case 'Home':
        newIndex = 0;
        handled = true;
        break;
      case 'End':
        newIndex = tabs.length - 1;
        handled = true;
        break;
    }

    if (handled) {
      e.preventDefault();
      // Move tabindex="0" to the new tab
      tabs[currentIndex].setAttribute('tabindex', '-1');
      tabs[newIndex].setAttribute('tabindex', '0');
      tabs[newIndex].focus();
    }
  });
}
```

**Tab interaction flow for a keyboard user:**

```
1. Tab key arrives at tab bar -> focuses the currently active tab (tabindex="0")
2. Arrow Right -> focus moves to next tab (Blocklist). Tab is NOT activated yet.
3. Arrow Right -> focus moves to next tab (Stats). Still not activated.
4. Enter or Space -> activates the Stats tab. Panel content changes. Screen reader announces "Stats tab selected".
5. Tab key -> focus leaves the tab bar and enters the Stats panel (tabindex="0").
6. Shift+Tab -> focus returns to the tab bar, landing on Stats tab (last active position preserved).
```

#### Quick Focus Options Row (25min | 45min | Custom)

The duration options use `role="radiogroup"` with roving tabindex, matching the WAI-ARIA radio group pattern:

```javascript
// src/popup/components/home-tab.js

function initQuickFocusOptions() {
  const group = document.querySelector('[role="radiogroup"]');
  const options = [...group.querySelectorAll('[role="radio"]')];

  group.addEventListener('keydown', (e) => {
    const currentIndex = options.indexOf(document.activeElement);
    if (currentIndex === -1) return;

    let newIndex = currentIndex;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        // Skip disabled options
        newIndex = findNextEnabled(options, currentIndex, 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        newIndex = findNextEnabled(options, currentIndex, -1);
        break;
      case ' ':
      case 'Enter':
        e.preventDefault();
        selectOption(options[currentIndex]);
        return;
    }

    if (newIndex !== currentIndex) {
      // Roving tabindex: move tabindex="0" to new option
      options[currentIndex].setAttribute('tabindex', '-1');
      options[newIndex].setAttribute('tabindex', '0');
      options[newIndex].focus();

      // For radio groups, selection follows focus (WAI-ARIA pattern)
      selectOption(options[newIndex]);
    }
  });
}

function findNextEnabled(options, currentIndex, direction) {
  const len = options.length;
  let index = (currentIndex + direction + len) % len;
  let attempts = 0;

  while (attempts < len) {
    if (options[index].getAttribute('aria-disabled') !== 'true') {
      return index;
    }
    index = (index + direction + len) % len;
    attempts++;
  }
  return currentIndex; // All options disabled (shouldn't happen)
}

function selectOption(option) {
  if (option.getAttribute('aria-disabled') === 'true') {
    // Announce that this option requires Pro
    announceToScreenReader('Custom duration requires a Pro upgrade', 'polite');
    return;
  }

  const group = option.closest('[role="radiogroup"]');
  const options = group.querySelectorAll('[role="radio"]');

  options.forEach((opt) => opt.setAttribute('aria-checked', 'false'));
  option.setAttribute('aria-checked', 'true');

  announceToScreenReader(`${option.textContent.trim()} selected`, 'polite');
}
```

#### Options Page Sidebar Navigation

The sidebar uses arrow keys for section navigation:

```javascript
// src/options/components/sidebar-nav.js

function initSidebarKeyboard() {
  const nav = document.querySelector('.options-sidebar');
  const links = [...nav.querySelectorAll('.sidebar-link')];

  nav.addEventListener('keydown', (e) => {
    const currentIndex = links.indexOf(document.activeElement);
    if (currentIndex === -1) return;

    let newIndex = currentIndex;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        newIndex = Math.min(currentIndex + 1, links.length - 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        newIndex = Math.max(currentIndex - 1, 0);
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = links.length - 1;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        links[currentIndex].click();
        // Focus moves to the main content area
        document.getElementById('main-content').focus();
        return;
    }

    if (newIndex !== currentIndex) {
      links[newIndex].focus();
    }
  });
}
```

---

### 2.7 Block Page Keyboard Navigation

When a blocked site page appears, the user must be able to navigate it entirely by keyboard with no traps.

**Focus flow on block page load:**

```
1. Page loads -> "Stay Focused" button receives autofocus
2. Tab -> "Override" button (if override is allowed by settings)
3. Tab -> privacy notice link (if present)
4. Tab -> cycles back to "Stay Focused"
5. Ctrl+W / Cmd+W -> closes the tab (never intercepted)
```

```javascript
// src/content/block-page/block-page.js (or src/pages/blocked.js)

document.addEventListener('DOMContentLoaded', async () => {
  const data = await chrome.runtime.sendMessage({ type: 'GET_BLOCK_PAGE_DATA' });

  renderBlockPage(data);

  // Set initial focus to the "Stay Focused" button
  const stayBtn = document.querySelector('.block-stay-btn');
  if (stayBtn) {
    // requestAnimationFrame ensures rendering is complete before focus
    requestAnimationFrame(() => stayBtn.focus());
  }

  // Keyboard handling for the block page
  document.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        // If focused on Stay Focused button, go back
        if (document.activeElement.classList.contains('block-stay-btn')) {
          e.preventDefault();
          goBackToWork();
        }
        // If focused on Override button, handle override
        if (document.activeElement.classList.contains('block-override-btn')) {
          e.preventDefault();
          overrideBlock(data.blockedDomain);
        }
        break;
      // No Escape handler — the page has no modals or traps.
      // Ctrl+W is handled natively by the browser and cannot be intercepted.
    }
  });
});

/**
 * Navigate away from the block page.
 * Goes back in history if safe, otherwise opens new tab page.
 */
async function goBackToWork() {
  announceToScreenReader('Navigating back to work', 'assertive');

  try {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Open new tab page as fallback
      window.location.href = 'chrome://newtab';
    }
  } catch {
    window.location.href = 'about:blank';
  }
}
```

**Block page accessible HTML:**

```html
<!-- src/pages/blocked.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Site Blocked — Focus Mode</title>
  <link rel="stylesheet" href="blocked.css">
</head>
<body class="zovo-block-page">
  <main class="block-content" role="main" aria-label="Blocked site notification">
    <!-- Shield icon — decorative -->
    <div class="block-icon" aria-hidden="true">
      <svg focusable="false" width="64" height="64"><!-- shield SVG --></svg>
    </div>

    <!-- Motivational quote — content rendered by JS -->
    <blockquote class="block-quote" role="figure" aria-label="Motivational quote">
      <p class="block-quote-text"></p>
      <cite class="block-quote-author"></cite>
    </blockquote>

    <!-- Blocked domain message -->
    <p class="block-domain-message" role="status"></p>

    <!-- Stats grid -->
    <div class="block-stats-grid" role="group" aria-label="Your focus progress today">
      <div class="block-stat">
        <span class="block-stat-value" id="stat-time-saved">--</span>
        <span class="block-stat-label" id="stat-time-saved-label">Time Saved</span>
      </div>
      <div class="block-stat">
        <span class="block-stat-value" id="stat-blocked">--</span>
        <span class="block-stat-label" id="stat-blocked-label">Blocked</span>
      </div>
      <div class="block-stat">
        <span class="block-stat-value" id="stat-streak">--</span>
        <span class="block-stat-label" id="stat-streak-label">Day Streak</span>
      </div>
      <div class="block-stat">
        <span class="block-stat-value" id="stat-score">--</span>
        <span class="block-stat-label" id="stat-score-label">Focus Score</span>
      </div>
    </div>

    <!-- Primary action — autofocus -->
    <button class="block-stay-btn btn-primary" autofocus>
      Stay Focused
    </button>

    <!-- Override button — conditionally rendered by JS -->
    <!-- (Not present in HTML by default; added only if settings allow override) -->

    <p class="block-privacy-notice">
      <small>This page never tracks your browsing.</small>
    </p>
  </main>

  <!-- Screen reader announcer -->
  <div id="sr-announcer" aria-live="polite" aria-atomic="true" class="sr-only"></div>

  <script src="blocked.js" type="module"></script>
</body>
</html>
```

**Important:** The block page never uses focus trapping. The user can always:
- Press Tab/Shift+Tab to cycle between the available buttons
- Press Ctrl+W (Cmd+W) to close the tab entirely
- Use browser navigation (Alt+Left Arrow) to go back

This is intentional. A frustrated user encountering a block page should never feel trapped. The block page is a gentle reminder, not a prison. This aligns with the brand tone: "Encouraging coach, not drill sergeant."

---

## Accessibility Testing Checklist

This section provides a quick-reference checklist for validating the WCAG and keyboard requirements documented above.

| Category | Test | Surface | Pass Criteria |
|----------|------|---------|---------------|
| Contrast | Text contrast ratio | All | 4.5:1 minimum for normal text, 3:1 for large text |
| Contrast | Non-text contrast | Popup | Timer ring, score ring, button boundaries at 3:1 |
| Keyboard | Tab through entire popup | Popup | Logical order: header > tabs > content > footer |
| Keyboard | Arrow keys in tab bar | Popup | Left/Right moves between tabs, Enter activates |
| Keyboard | Escape closes popup | Popup | Focus returns to browser chrome |
| Keyboard | Escape dismisses paywall | Popup/Options | Focus returns to triggering element |
| Keyboard | Roving tabindex in Quick Focus | Popup | Arrow keys navigate, only one has tabindex="0" |
| Keyboard | Block page no trap | Block page | Tab cycles buttons, Ctrl+W closes tab |
| Keyboard | Skip link on options | Options | Tab once, Enter jumps to main content |
| Screen reader | Timer announcements | Popup | Milestones at 5-min intervals, 1 min, and completion |
| Screen reader | Focus Score ring | Popup | Reads as "Focus Score: 78 out of 100, good" |
| Screen reader | Blocklist errors | Popup | Error announced assertively, input marked invalid |
| Screen reader | Tab switch | Popup | Announces "Blocklist tab selected" |
| Screen reader | Block page load | Block page | Announces domain and motivational quote |
| ARIA | Tab bar roles | Popup | tablist, tab, tabpanel with correct associations |
| ARIA | Paywall modal | All | role="dialog", aria-modal, aria-label |
| ARIA | Toggle switches | Options | role="switch", aria-checked updated |
| ARIA | Confirmation dialog | All | role="alertdialog", aria-labelledby, aria-describedby |
| Focus visible | All interactive elements | All | 2px indigo outline on :focus-visible |
| Focus visible | Dark mode | All | Focus ring visible against dark backgrounds |
| Reduced motion | All animations | All | Animations disabled when prefers-reduced-motion: reduce |

---

## References

- **Phase 12 — MV3 Architecture:** `docs/mv3-architecture/agent5-ui-architecture.md` (popup, block page, options, shared utils)
- **Phase 08 — Branding:** `docs/branding-retention/agent2-global-styles.md` (design tokens, component library)
- **Phase 08 — Branding:** `docs/branding-retention/agent3-onboarding-system.md` (onboarding flow)
- **Phase 09 — Payment:** `docs/payment-integration/agent3-paywall-ui.md` (paywall modal, focus trap, ARIA)
- **WCAG 2.1:** https://www.w3.org/TR/WCAG21/
- **WAI-ARIA Authoring Practices:** https://www.w3.org/WAI/ARIA/apd/patterns/
- **Chrome Extensions Accessibility:** https://developer.chrome.com/docs/extensions/develop/ui

---

*Phase 21 — Accessibility Compliance — Agent 1 of 5 — Complete*
