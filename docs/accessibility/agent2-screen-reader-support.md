# Agent 2 — Screen Reader Support
## Phase 21: Accessibility Compliance — Focus Mode - Blocker

> **Date:** February 11, 2026 | **Agent:** 2 of 5
> **Scope:** ARIA labels, roles, live regions, button/link semantics, form accessibility, screen reader testing
> **Dependencies:** Phase 12 (MV3 Architecture — UI structure), Phase 08 (Branding — onboarding), Phase 09 (Payment — paywall)
> **Extension:** Focus Mode - Blocker v1.0.0 by Zovo

---

## Table of Contents

1. [Overview](#1-overview)
2. [ARIA Labels and Roles](#2-aria-labels-and-roles)
   - [2.1 Popup Header](#21-popup-header)
   - [2.2 Tab Bar](#22-tab-bar)
   - [2.3 Timer Display](#23-timer-display)
   - [2.4 Focus Score Ring](#24-focus-score-ring)
   - [2.5 Streak Display](#25-streak-display)
   - [2.6 Blocklist Management](#26-blocklist-management)
   - [2.7 Block Page](#27-block-page)
   - [2.8 Paywall Modal](#28-paywall-modal)
   - [2.9 Onboarding Page](#29-onboarding-page)
3. [Live Regions for Dynamic Content](#3-live-regions-for-dynamic-content)
   - [3.1 LiveRegion Utility Class](#31-liveregion-utility-class)
   - [3.2 StateAnnouncer Class](#32-stateannouncer-class)
   - [3.3 Integration with Popup Lifecycle](#33-integration-with-popup-lifecycle)
4. [Button vs Link Semantics](#4-button-vs-link-semantics)
5. [Form Accessibility](#5-form-accessibility)
   - [5.1 Blocklist Input](#51-blocklist-input)
   - [5.2 Custom Time Input](#52-custom-time-input)
   - [5.3 Options Page Settings](#53-options-page-settings)
   - [5.4 Onboarding Form](#54-onboarding-form)
6. [Screen Reader Testing Checklist](#6-screen-reader-testing-checklist)
   - [6.1 NVDA (Windows)](#61-nvda-windows)
   - [6.2 VoiceOver (Mac)](#62-voiceover-mac)
   - [6.3 Verification Matrix](#63-verification-matrix)

---

## 1. Overview

Focus Mode - Blocker has significant dynamic content: a countdown timer that ticks every second, a circular SVG focus score that animates, streak counters that update, blocklist mutations, modal dialogs, and state transitions between six distinct popup views. Without deliberate screen reader support, these updates are either invisible to assistive technology users or create an overwhelming stream of announcements.

This document provides complete, implementation-ready ARIA markup and JavaScript utilities for every UI surface in the extension. The guiding principles:

1. **Announce state changes, not ticks.** The timer updates every second, but screen readers should only hear minute-mark announcements. Continuous aria-live updates at 1-second intervals would make the extension unusable.
2. **Every interactive element has a name.** Buttons, links, inputs, tabs, and custom controls all have accessible names via visible labels, `aria-label`, or `aria-labelledby`.
3. **Semantic HTML first.** Use native `<button>`, `<a>`, `<input>`, `<fieldset>`, and `<legend>` before reaching for ARIA roles. ARIA is a supplement, not a replacement.
4. **Modal traps focus.** The paywall dialog and any confirmation modals must trap keyboard focus and announce their presence.
5. **Consistent patterns across surfaces.** The popup, block page, options page, and onboarding page all use the same `LiveRegion` and `StateAnnouncer` utilities.

**Files created/modified by this specification:**

| File | Purpose |
|------|---------|
| `src/popup/popup.html` | ARIA attributes on popup shell HTML |
| `src/popup/components/header.js` | Accessible header rendering |
| `src/popup/components/tab-bar.js` | ARIA tab pattern |
| `src/popup/components/timer-display.js` | Timer live region |
| `src/popup/components/focus-score-ring.js` | Progressbar role |
| `src/popup/components/streak-display.js` | Accessible text |
| `src/popup/components/blocklist-tab.js` | List roles, remove labels |
| `src/content/block-page/block-page.html` | Landmark regions, timer, buttons |
| `src/components/paywall/paywall-modal.js` | Dialog role, focus trap |
| `src/onboarding/onboarding.html` | Step indicators, progress |
| `src/shared/accessibility/live-region.js` | LiveRegion utility (new file) |
| `src/shared/accessibility/state-announcer.js` | StateAnnouncer wrapper (new file) |

---

## 2. ARIA Labels and Roles

### 2.1 Popup Header

The popup header contains the extension icon (decorative), the extension name (heading), and a settings gear button. The icon is purely decorative and must be hidden from assistive technology.

**HTML in `src/popup/popup.html`:**

```html
<header class="popup-header" role="banner">
  <img
    src="../icons/icon-32.png"
    alt=""
    aria-hidden="true"
    class="popup-header__icon"
    width="24"
    height="24"
  />
  <h1 class="popup-header__title">Focus Mode</h1>
  <button
    class="popup-header__settings-btn"
    aria-label="Open settings"
    title="Settings"
  >
    <svg aria-hidden="true" class="icon-gear" width="20" height="20">
      <use href="#icon-gear"></use>
    </svg>
  </button>
</header>
```

**Rendering in `src/popup/components/header.js`:**

```javascript
// src/popup/components/header.js

export function renderHeader(container) {
  const header = document.createElement('header');
  header.className = 'popup-header';
  header.setAttribute('role', 'banner');

  // Decorative icon — hidden from screen readers
  const icon = document.createElement('img');
  icon.src = '../icons/icon-32.png';
  icon.alt = '';
  icon.setAttribute('aria-hidden', 'true');
  icon.className = 'popup-header__icon';
  icon.width = 24;
  icon.height = 24;

  // Heading — primary landmark for screen readers
  const title = document.createElement('h1');
  title.className = 'popup-header__title';
  title.textContent = 'Focus Mode';

  // Settings button — opens options.html in new tab
  const settingsBtn = document.createElement('button');
  settingsBtn.className = 'popup-header__settings-btn';
  settingsBtn.setAttribute('aria-label', 'Open settings');
  settingsBtn.title = 'Settings';

  const gearSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  gearSvg.setAttribute('aria-hidden', 'true');
  gearSvg.classList.add('icon-gear');
  gearSvg.setAttribute('width', '20');
  gearSvg.setAttribute('height', '20');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#icon-gear');
  gearSvg.appendChild(use);
  settingsBtn.appendChild(gearSvg);

  header.append(icon, title, settingsBtn);
  container.appendChild(header);

  return { settingsBtn };
}
```

**Key decisions:**
- `alt=""` on the icon, not `alt="Focus Mode icon"`. The heading already provides the name; repeating it via the image is redundant.
- `aria-hidden="true"` on the SVG gear icon inside the button. The button's accessible name comes from `aria-label`, not the SVG content.
- `role="banner"` on the header serves as the page's banner landmark, allowing screen reader users to jump directly to it.

---

### 2.2 Tab Bar

The popup uses a three-tab interface (Home, Blocklist, Stats). This must follow the WAI-ARIA Tabs pattern with `role="tablist"`, `role="tab"`, and `role="tabpanel"`.

**HTML structure in `src/popup/popup.html`:**

```html
<nav class="tab-bar" role="tablist" aria-label="Popup navigation">
  <button
    id="tab-home"
    class="tab-bar__tab tab-bar__tab--active"
    role="tab"
    aria-selected="true"
    aria-controls="panel-home"
    tabindex="0"
  >
    Home
  </button>
  <button
    id="tab-blocklist"
    class="tab-bar__tab"
    role="tab"
    aria-selected="false"
    aria-controls="panel-blocklist"
    tabindex="-1"
  >
    Blocklist
  </button>
  <button
    id="tab-stats"
    class="tab-bar__tab"
    role="tab"
    aria-selected="false"
    aria-controls="panel-stats"
    tabindex="-1"
  >
    Stats
  </button>
</nav>

<!-- Tab panels -->
<div
  id="panel-home"
  class="tab-panel"
  role="tabpanel"
  aria-labelledby="tab-home"
  tabindex="0"
>
  <!-- Home tab content rendered here -->
</div>

<div
  id="panel-blocklist"
  class="tab-panel tab-panel--hidden"
  role="tabpanel"
  aria-labelledby="tab-blocklist"
  tabindex="0"
  hidden
>
  <!-- Blocklist tab content rendered here -->
</div>

<div
  id="panel-stats"
  class="tab-panel tab-panel--hidden"
  role="tabpanel"
  aria-labelledby="tab-stats"
  tabindex="0"
  hidden
>
  <!-- Stats tab content rendered here -->
</div>
```

**JavaScript in `src/popup/components/tab-bar.js`:**

```javascript
// src/popup/components/tab-bar.js

const TAB_IDS = ['tab-home', 'tab-blocklist', 'tab-stats'];
const PANEL_IDS = ['panel-home', 'panel-blocklist', 'panel-stats'];

export function initTabBar() {
  const tabs = TAB_IDS.map(id => document.getElementById(id));
  const panels = PANEL_IDS.map(id => document.getElementById(id));

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateTab(index, tabs, panels));
    tab.addEventListener('keydown', (e) => handleTabKeydown(e, index, tabs, panels));
  });
}

function activateTab(index, tabs, panels) {
  // Deactivate all tabs
  tabs.forEach((tab, i) => {
    tab.setAttribute('aria-selected', 'false');
    tab.setAttribute('tabindex', '-1');
    tab.classList.remove('tab-bar__tab--active');
    panels[i].hidden = true;
    panels[i].classList.add('tab-panel--hidden');
  });

  // Activate selected tab
  const selectedTab = tabs[index];
  const selectedPanel = panels[index];

  selectedTab.setAttribute('aria-selected', 'true');
  selectedTab.setAttribute('tabindex', '0');
  selectedTab.classList.add('tab-bar__tab--active');
  selectedTab.focus();

  selectedPanel.hidden = false;
  selectedPanel.classList.remove('tab-panel--hidden');
}

function handleTabKeydown(event, currentIndex, tabs, panels) {
  let newIndex = currentIndex;

  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      newIndex = (currentIndex + 1) % tabs.length;
      break;
    case 'ArrowLeft':
    case 'ArrowUp':
      newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      break;
    case 'Home':
      newIndex = 0;
      break;
    case 'End':
      newIndex = tabs.length - 1;
      break;
    default:
      return; // Do not prevent default for unhandled keys
  }

  event.preventDefault();
  activateTab(newIndex, tabs, panels);
}
```

**Key decisions:**
- Arrow keys move between tabs (WAI-ARIA Tabs pattern). Only the active tab is in the tab order (`tabindex="0"`); inactive tabs have `tabindex="-1"`.
- `Home` and `End` keys jump to first and last tab respectively.
- Tab panels use `hidden` attribute (not just `display: none`) so screen readers correctly ignore inactive panels.
- `aria-label="Popup navigation"` on the tablist distinguishes it from other navigation if present.

---

### 2.3 Timer Display

The timer is the most challenging accessibility element in Focus Mode - Blocker. It updates every second, but announcing every second would make the extension unusable with a screen reader. The solution: use `role="timer"` with `aria-live="off"` by default, and temporarily switch to `aria-live="polite"` only at key moments.

**HTML in `src/popup/popup.html` (inside Home panel):**

```html
<div
  id="timer-display"
  class="timer-display"
  role="timer"
  aria-live="off"
  aria-atomic="true"
  aria-label="Focus session timer"
>
  <span class="timer-display__time" aria-hidden="true">25:00</span>
  <span class="timer-display__sr-text sr-only" id="timer-sr-text">
    25 minutes remaining
  </span>
</div>
```

**CSS for screen-reader-only text:**

```css
/* src/popup/popup.css — utility class used throughout */
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

**JavaScript in `src/popup/components/timer-display.js`:**

```javascript
// src/popup/components/timer-display.js

const ANNOUNCEMENT_MINUTES = [25, 20, 15, 10, 5, 3, 2, 1];

let lastAnnouncedMinute = null;

export function updateTimerDisplay(remainingSeconds, totalSeconds) {
  const timerEl = document.getElementById('timer-display');
  const timeText = timerEl.querySelector('.timer-display__time');
  const srText = timerEl.querySelector('.timer-display__sr-text');

  if (!timerEl || !timeText || !srText) return;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Update the visual display every second (hidden from SR)
  timeText.textContent = formatted;

  // Announce only at key minute marks
  if (shouldAnnounce(minutes, seconds)) {
    announceTime(timerEl, srText, minutes);
  }
}

function shouldAnnounce(minutes, seconds) {
  // Only announce when seconds tick to 0 and we are on an announcement minute
  if (seconds !== 0) return false;
  if (minutes === lastAnnouncedMinute) return false;
  return ANNOUNCEMENT_MINUTES.includes(minutes);
}

function announceTime(timerEl, srText, minutes) {
  lastAnnouncedMinute = minutes;

  // Build human-readable announcement
  let message;
  if (minutes === 0) {
    message = 'Less than one minute remaining';
  } else if (minutes === 1) {
    message = '1 minute remaining in your focus session';
  } else {
    message = `${minutes} minutes remaining in your focus session`;
  }

  // Temporarily enable live region for the announcement
  timerEl.setAttribute('aria-live', 'polite');
  srText.textContent = message;

  // Disable live region after the announcement is queued
  // 1000ms gives the screen reader time to pick up the change
  setTimeout(() => {
    timerEl.setAttribute('aria-live', 'off');
  }, 1000);
}

export function announceSessionStart(duration) {
  const timerEl = document.getElementById('timer-display');
  const srText = timerEl?.querySelector('.timer-display__sr-text');
  if (!timerEl || !srText) return;

  lastAnnouncedMinute = null;

  timerEl.setAttribute('aria-live', 'assertive');
  srText.textContent = `Focus session started. ${duration} minutes remaining.`;

  setTimeout(() => {
    timerEl.setAttribute('aria-live', 'off');
  }, 1000);
}

export function announceSessionEnd() {
  // Session end is handled by StateAnnouncer (Section 3.2)
  // to include the score in the announcement
  lastAnnouncedMinute = null;
}

export function resetTimerDisplay() {
  lastAnnouncedMinute = null;
  const timerEl = document.getElementById('timer-display');
  if (timerEl) {
    timerEl.setAttribute('aria-live', 'off');
  }
}
```

**Key decisions:**
- The visual MM:SS text uses `aria-hidden="true"` because "25:00" is not a useful screen reader announcement. The SR-only span provides human-readable text like "25 minutes remaining."
- `role="timer"` tells assistive technology that this element represents a timer, but does NOT imply automatic announcement. Live region behavior is controlled separately via `aria-live`.
- Announcements happen at session start, at the 20/15/10/5/3/2/1 minute marks, and at session end. This prevents the 1-per-second announcement flood.
- `aria-atomic="true"` ensures the entire timer region is announced as a single unit, not just the changed text fragment.
- Session start uses `aria-live="assertive"` because the user just pressed "Start" and expects immediate confirmation. Minute marks use `polite` to avoid interrupting other screen reader activity.

---

### 2.4 Focus Score Ring

The SVG circular progress indicator displays a score from 0 to 100. Screen readers cannot interpret SVG paths, so the element needs explicit ARIA progressbar semantics.

**HTML in `src/popup/popup.html` (inside Stats tab or Home tab):**

```html
<div
  id="focus-score-ring"
  class="focus-score-ring"
  role="progressbar"
  aria-valuenow="0"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-label="Focus Score"
>
  <svg
    class="focus-score-ring__svg"
    viewBox="0 0 120 120"
    aria-hidden="true"
  >
    <circle class="focus-score-ring__track" cx="60" cy="60" r="54" />
    <circle
      class="focus-score-ring__progress"
      cx="60" cy="60" r="54"
      stroke-dasharray="339.292"
      stroke-dashoffset="339.292"
    />
  </svg>
  <span class="focus-score-ring__value" aria-hidden="true">0</span>
  <span class="sr-only" id="focus-score-sr-text">Focus Score: 0 out of 100</span>
</div>
```

**JavaScript in `src/popup/components/focus-score-ring.js`:**

```javascript
// src/popup/components/focus-score-ring.js

const CIRCUMFERENCE = 2 * Math.PI * 54; // 339.292

export function updateFocusScoreRing(score) {
  const ring = document.getElementById('focus-score-ring');
  if (!ring) return;

  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));

  // Update ARIA value
  ring.setAttribute('aria-valuenow', String(clampedScore));

  // Update visual number (hidden from SR)
  const valueEl = ring.querySelector('.focus-score-ring__value');
  if (valueEl) {
    valueEl.textContent = String(clampedScore);
  }

  // Update SR-only description
  const srText = document.getElementById('focus-score-sr-text');
  if (srText) {
    srText.textContent = `Focus Score: ${clampedScore} out of 100`;
  }

  // Update SVG ring progress
  const progressCircle = ring.querySelector('.focus-score-ring__progress');
  if (progressCircle) {
    const offset = CIRCUMFERENCE - (clampedScore / 100) * CIRCUMFERENCE;
    progressCircle.style.strokeDashoffset = String(offset);
  }
}
```

**Key decisions:**
- The entire SVG is `aria-hidden="true"`. The `role="progressbar"` on the wrapper div handles the semantic meaning.
- `aria-valuenow` is updated every time the score changes, allowing screen readers to query the current value.
- The visual number displayed inside the ring also uses `aria-hidden="true"` because the progressbar role already communicates the value; reading both would be redundant.
- Score is clamped to 0-100 and rounded to prevent fractional aria-valuenow values that some screen readers handle poorly.

---

### 2.5 Streak Display

The streak counter is simpler than the timer or score ring. It is static text that updates infrequently (once per session at most).

**HTML:**

```html
<div class="streak-display" id="streak-display">
  <span class="streak-display__icon" aria-hidden="true">&#x1F525;</span>
  <span
    class="streak-display__text"
    aria-label="Current streak: 0 days"
    id="streak-text"
  >
    0 day streak
  </span>
</div>
```

**JavaScript in `src/popup/components/streak-display.js`:**

```javascript
// src/popup/components/streak-display.js

export function updateStreakDisplay(days) {
  const streakText = document.getElementById('streak-text');
  if (!streakText) return;

  const plural = days === 1 ? 'day' : 'days';
  const visibleText = `${days} ${plural} streak`;
  const ariaLabel = `Current streak: ${days} ${plural}`;

  streakText.textContent = visibleText;
  streakText.setAttribute('aria-label', ariaLabel);
}
```

**Key decisions:**
- The fire emoji icon is `aria-hidden="true"`. Screen readers would announce "fire" which adds no meaning.
- `aria-label` provides a more descriptive reading than the terse visual text. The screen reader says "Current streak: 7 days" instead of "7 days streak."
- Streak updates are announced via the `StateAnnouncer` (Section 3.2) rather than a live region on this element, because streak changes always coincide with session-end announcements.

---

### 2.6 Blocklist Management

The Blocklist tab contains an input field for adding sites and a list of currently blocked sites, each with a remove button.

**HTML in `src/popup/popup.html` (inside Blocklist panel):**

```html
<div class="blocklist-tab" role="region" aria-label="Manage blocked websites">
  <!-- Add site form -->
  <form class="blocklist-add" id="blocklist-add-form" aria-label="Add website to blocklist">
    <div class="blocklist-add__field">
      <label for="blocklist-input" class="sr-only">Website to block</label>
      <input
        type="text"
        id="blocklist-input"
        class="blocklist-add__input"
        placeholder="e.g., reddit.com"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        aria-describedby="blocklist-input-hint blocklist-input-error"
      />
      <span id="blocklist-input-hint" class="sr-only">
        Enter a domain name like reddit.com or youtube.com
      </span>
      <span
        id="blocklist-input-error"
        class="blocklist-add__error"
        role="alert"
        aria-live="assertive"
        hidden
      ></span>
    </div>
    <button type="submit" class="blocklist-add__btn" aria-label="Add website to blocklist">
      <svg aria-hidden="true" width="16" height="16"><use href="#icon-plus"></use></svg>
      <span class="sr-only">Add</span>
    </button>
  </form>

  <!-- Site count -->
  <p class="blocklist-count" id="blocklist-count" aria-live="polite">
    3 sites blocked
  </p>

  <!-- Blocked sites list -->
  <ul class="blocklist-list" id="blocklist-list" role="list" aria-label="Blocked websites">
    <!-- Items rendered by JavaScript -->
  </ul>
</div>
```

**JavaScript for list item rendering in `src/popup/components/blocklist-tab.js`:**

```javascript
// src/popup/components/blocklist-tab.js

export function renderBlocklistItem(site, listEl) {
  const li = document.createElement('li');
  li.className = 'blocklist-list__item';
  li.setAttribute('role', 'listitem');
  li.dataset.site = site;

  const siteNameEl = document.createElement('span');
  siteNameEl.className = 'blocklist-list__site-name';
  siteNameEl.textContent = site;

  const removeBtn = document.createElement('button');
  removeBtn.className = 'blocklist-list__remove-btn';
  removeBtn.setAttribute('aria-label', `Remove ${site} from blocklist`);
  removeBtn.title = `Remove ${site}`;

  const removeSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  removeSvg.setAttribute('aria-hidden', 'true');
  removeSvg.setAttribute('width', '14');
  removeSvg.setAttribute('height', '14');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#icon-x');
  removeSvg.appendChild(use);
  removeBtn.appendChild(removeSvg);

  li.append(siteNameEl, removeBtn);
  listEl.appendChild(li);
}

export function updateBlocklistCount(count) {
  const countEl = document.getElementById('blocklist-count');
  if (!countEl) return;

  const plural = count === 1 ? 'site' : 'sites';
  countEl.textContent = `${count} ${plural} blocked`;
}

export function showBlocklistError(message) {
  const errorEl = document.getElementById('blocklist-input-error');
  const inputEl = document.getElementById('blocklist-input');
  if (!errorEl || !inputEl) return;

  errorEl.textContent = message;
  errorEl.hidden = false;
  inputEl.setAttribute('aria-invalid', 'true');
}

export function clearBlocklistError() {
  const errorEl = document.getElementById('blocklist-input-error');
  const inputEl = document.getElementById('blocklist-input');
  if (!errorEl || !inputEl) return;

  errorEl.textContent = '';
  errorEl.hidden = true;
  inputEl.removeAttribute('aria-invalid');
}
```

**Key decisions:**
- Each remove button has `aria-label="Remove reddit.com from blocklist"`, not just "Remove." Without the site name in the label, a screen reader user tabbing through the list would hear "Remove, button, Remove, button" with no context.
- The error message container uses `role="alert"` with `aria-live="assertive"` so validation errors ("Invalid URL", "This site is already in your blocklist") are announced immediately.
- The blocklist count uses `aria-live="polite"` so that adding or removing a site triggers a "3 sites blocked" announcement without interrupting current speech.
- The input uses `aria-describedby` pointing to both the hint and the error. When there is no error, the error span is `hidden`, so screen readers skip it and only announce the hint.

---

### 2.7 Block Page

The block page (`src/content/block-page/`) appears when a user visits a blocked site during an active focus session. It replaces the page content with a motivational message, a countdown timer showing remaining session time, and two action buttons.

**HTML in `src/content/block-page/block-page.html`:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Site Blocked — Focus Mode</title>
  <link rel="stylesheet" href="block-page.css" />
</head>
<body>
  <main class="block-page" role="main" aria-label="Blocked site page">

    <!-- Header region -->
    <header class="block-page__header" role="banner">
      <img
        src="../../icons/icon-48.png"
        alt=""
        aria-hidden="true"
        class="block-page__icon"
        width="48"
        height="48"
      />
      <h1 class="block-page__title">Stay Focused</h1>
      <p class="block-page__subtitle" id="block-reason">
        <span class="block-page__site-name" id="blocked-site-name">reddit.com</span>
        is blocked during your focus session.
      </p>
    </header>

    <!-- Timer region -->
    <section class="block-page__timer-section" aria-label="Session timer">
      <div
        id="block-page-timer"
        class="block-page__timer"
        role="timer"
        aria-live="off"
        aria-atomic="true"
        aria-label="Time remaining in focus session"
      >
        <span class="block-page__timer-value" aria-hidden="true">24:32</span>
        <span class="sr-only" id="block-timer-sr-text">
          24 minutes remaining in your focus session
        </span>
      </div>
      <p class="block-page__timer-label">remaining in your focus session</p>
    </section>

    <!-- Motivational quote -->
    <section class="block-page__quote-section" aria-label="Motivational quote">
      <blockquote class="block-page__quote" id="motivational-quote">
        <p>"The secret of getting ahead is getting started."</p>
        <footer>
          <cite>Mark Twain</cite>
        </footer>
      </blockquote>
    </section>

    <!-- Actions -->
    <nav class="block-page__actions" aria-label="Page actions">
      <button
        class="block-page__btn block-page__btn--primary"
        id="stay-focused-btn"
        autofocus
      >
        Stay Focused
      </button>
      <button
        class="block-page__btn block-page__btn--secondary"
        id="override-btn"
        aria-describedby="override-warning"
      >
        Override Block
      </button>
      <p class="block-page__override-warning sr-only" id="override-warning">
        Overriding will reduce your Focus Score for this session
      </p>
    </nav>

  </main>

  <!-- Live region for block page announcements -->
  <div
    id="block-page-announcer"
    class="sr-only"
    aria-live="assertive"
    aria-atomic="true"
    role="status"
  ></div>

  <script src="block-page.js"></script>
</body>
</html>
```

**Key decisions:**
- The block page uses semantic landmarks: `<header>` with `role="banner"`, `<main>` with `role="main"`, `<section>` elements with `aria-label`, and `<nav>` for actions.
- The "Stay Focused" button has `autofocus` so it receives focus when the page loads. This means the user lands on the positive action, not the override.
- The "Override Block" button uses `aria-describedby="override-warning"` so the screen reader announces the score penalty consequence when the user focuses this button.
- The block page timer follows the same pattern as the popup timer (Section 2.3): visual text is `aria-hidden`, SR-only text provides human-readable time, and `aria-live` toggles at minute marks.
- The motivational quote uses proper `<blockquote>` + `<cite>` semantics. Screen readers will announce it as a quotation with attribution.

---

### 2.8 Paywall Modal

The paywall modal (from Phase 09) must follow the WAI-ARIA Dialog pattern: `role="dialog"`, focus trapping, and keyboard dismissal.

**JavaScript in `src/components/paywall/paywall-modal.js`:**

```javascript
// src/components/paywall/paywall-modal.js (accessibility additions)

export function createPaywallModal(triggerContent) {
  const overlay = document.createElement('div');
  overlay.className = 'paywall-overlay';
  overlay.id = 'paywall-overlay';

  const dialog = document.createElement('div');
  dialog.className = 'paywall-modal';
  dialog.id = 'paywall-modal';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'paywall-title');
  dialog.setAttribute('aria-describedby', 'paywall-description');

  // Title
  const title = document.createElement('h2');
  title.id = 'paywall-title';
  title.className = 'paywall-modal__title';
  title.textContent = triggerContent.headline;

  // Description
  const description = document.createElement('p');
  description.id = 'paywall-description';
  description.className = 'paywall-modal__description';
  description.textContent = triggerContent.subheadline;

  // Feature list
  const featureList = document.createElement('ul');
  featureList.className = 'paywall-modal__features';
  featureList.setAttribute('aria-label', 'Pro features included');
  triggerContent.benefits.forEach(benefit => {
    const li = document.createElement('li');
    li.textContent = benefit;
    featureList.appendChild(li);
  });

  // CTA button (triggers checkout — this is a button, not a link)
  const ctaBtn = document.createElement('button');
  ctaBtn.className = 'paywall-modal__cta';
  ctaBtn.id = 'paywall-cta';
  ctaBtn.textContent = triggerContent.ctaText || 'Upgrade to Pro';

  // Dismiss button
  const dismissBtn = document.createElement('button');
  dismissBtn.className = 'paywall-modal__dismiss';
  dismissBtn.id = 'paywall-dismiss';
  dismissBtn.setAttribute('aria-label', 'Dismiss upgrade dialog');
  dismissBtn.textContent = 'Not now';

  // Close X button (top-right)
  const closeBtn = document.createElement('button');
  closeBtn.className = 'paywall-modal__close';
  closeBtn.setAttribute('aria-label', 'Close dialog');
  closeBtn.innerHTML = '<svg aria-hidden="true" width="16" height="16"><use href="#icon-x"></use></svg>';

  dialog.append(closeBtn, title, description, featureList, ctaBtn, dismissBtn);
  overlay.appendChild(dialog);

  return { overlay, dialog, ctaBtn, dismissBtn, closeBtn };
}

let previouslyFocusedElement = null;

export function showPaywall(triggerContent) {
  // Store current focus to restore when modal closes
  previouslyFocusedElement = document.activeElement;

  const { overlay, dialog, ctaBtn, dismissBtn, closeBtn } =
    createPaywallModal(triggerContent);
  document.body.appendChild(overlay);

  // Set inert on content behind modal (prevents SR from reading background)
  const mainContent = document.querySelector('.popup-content, main');
  if (mainContent) {
    mainContent.setAttribute('inert', '');
    mainContent.setAttribute('aria-hidden', 'true');
  }

  // Focus the dialog title or first focusable element
  requestAnimationFrame(() => {
    ctaBtn.focus();
  });

  // Trap focus within modal
  dialog.addEventListener('keydown', (e) => handleModalKeydown(e, dialog));

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) dismissPaywall();
  });

  // Close on Escape
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      dismissPaywall();
    }
  });

  // Close buttons
  dismissBtn.addEventListener('click', dismissPaywall);
  closeBtn.addEventListener('click', dismissPaywall);

  // Announce to screen reader
  const announcer = document.getElementById('sr-announcer');
  if (announcer) {
    announcer.textContent = 'Upgrade to Pro dialog opened';
  }
}

export function dismissPaywall() {
  const overlay = document.getElementById('paywall-overlay');
  if (overlay) {
    overlay.remove();
  }

  // Remove inert from main content
  const mainContent = document.querySelector('.popup-content, main');
  if (mainContent) {
    mainContent.removeAttribute('inert');
    mainContent.removeAttribute('aria-hidden');
  }

  // Restore focus to the element that was focused before modal opened
  if (previouslyFocusedElement && previouslyFocusedElement.focus) {
    previouslyFocusedElement.focus();
  }

  previouslyFocusedElement = null;
}

function handleModalKeydown(event, dialog) {
  if (event.key !== 'Tab') return;

  const focusableSelectors = [
    'button:not([disabled]):not([tabindex="-1"])',
    'a[href]:not([tabindex="-1"])',
    'input:not([disabled]):not([tabindex="-1"])',
    '[tabindex="0"]'
  ].join(', ');

  const focusableElements = Array.from(dialog.querySelectorAll(focusableSelectors));
  if (focusableElements.length === 0) return;

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  if (event.shiftKey) {
    // Shift+Tab: wrap from first to last
    if (document.activeElement === firstFocusable) {
      event.preventDefault();
      lastFocusable.focus();
    }
  } else {
    // Tab: wrap from last to first
    if (document.activeElement === lastFocusable) {
      event.preventDefault();
      firstFocusable.focus();
    }
  }
}
```

**Key decisions:**
- `aria-modal="true"` tells screen readers that content behind the dialog is not interactable. Combined with `inert` on the main content, this provides a double layer of protection.
- Focus is restored to `previouslyFocusedElement` when the modal closes. Without this, focus would jump to `<body>` and the user loses their place.
- The CTA button receives initial focus (not the close button) because the dialog's primary purpose is to present the upgrade offer. The user can dismiss with Escape.
- Focus trapping wraps from last to first and first to last, as required by the Dialog pattern.
- The `inert` attribute is the modern way to make background content unreachable. For browsers that do not support `inert`, the `aria-hidden="true"` fallback ensures screen readers at least cannot read the background.

---

### 2.9 Onboarding Page

The onboarding page (`src/onboarding/onboarding.html`, from Phase 08) has multi-step flow with step indicators.

**HTML for step indicator:**

```html
<nav class="onboarding-steps" aria-label="Onboarding progress">
  <ol class="onboarding-steps__list">
    <li class="onboarding-steps__step onboarding-steps__step--current" aria-current="step">
      <span class="onboarding-steps__number" aria-hidden="true">1</span>
      <span class="sr-only">Step 1 of 4: Choose sites to block (current step)</span>
    </li>
    <li class="onboarding-steps__step">
      <span class="onboarding-steps__number" aria-hidden="true">2</span>
      <span class="sr-only">Step 2 of 4: Set focus duration</span>
    </li>
    <li class="onboarding-steps__step">
      <span class="onboarding-steps__number" aria-hidden="true">3</span>
      <span class="sr-only">Step 3 of 4: Customize your experience</span>
    </li>
    <li class="onboarding-steps__step">
      <span class="onboarding-steps__number" aria-hidden="true">4</span>
      <span class="sr-only">Step 4 of 4: Start your first session</span>
    </li>
  </ol>
</nav>
```

**JavaScript for step transitions in `src/onboarding/onboarding.js`:**

```javascript
// src/onboarding/onboarding.js (accessibility additions)

function updateStepIndicator(currentStep, totalSteps) {
  const steps = document.querySelectorAll('.onboarding-steps__step');

  steps.forEach((stepEl, index) => {
    const stepNumber = index + 1;
    const srText = stepEl.querySelector('.sr-only');

    if (stepNumber === currentStep) {
      stepEl.classList.add('onboarding-steps__step--current');
      stepEl.setAttribute('aria-current', 'step');
      if (srText) {
        srText.textContent = `Step ${stepNumber} of ${totalSteps}: ${getStepName(stepNumber)} (current step)`;
      }
    } else if (stepNumber < currentStep) {
      stepEl.classList.add('onboarding-steps__step--complete');
      stepEl.classList.remove('onboarding-steps__step--current');
      stepEl.removeAttribute('aria-current');
      if (srText) {
        srText.textContent = `Step ${stepNumber} of ${totalSteps}: ${getStepName(stepNumber)} (completed)`;
      }
    } else {
      stepEl.classList.remove('onboarding-steps__step--current', 'onboarding-steps__step--complete');
      stepEl.removeAttribute('aria-current');
      if (srText) {
        srText.textContent = `Step ${stepNumber} of ${totalSteps}: ${getStepName(stepNumber)}`;
      }
    }
  });

  // Announce step transition
  announceStepChange(currentStep, totalSteps);
}

function getStepName(step) {
  const names = {
    1: 'Choose sites to block',
    2: 'Set focus duration',
    3: 'Customize your experience',
    4: 'Start your first session'
  };
  return names[step] || `Step ${step}`;
}

function announceStepChange(currentStep, totalSteps) {
  const announcer = document.getElementById('onboarding-announcer');
  if (!announcer) return;

  announcer.textContent = `Step ${currentStep} of ${totalSteps}: ${getStepName(currentStep)}`;
}
```

**Onboarding announcer element (in `src/onboarding/onboarding.html`):**

```html
<div
  id="onboarding-announcer"
  class="sr-only"
  aria-live="polite"
  aria-atomic="true"
  role="status"
></div>
```

**Key decisions:**
- `aria-current="step"` is the semantic way to indicate the active step in a multi-step flow. Screen readers announce "current step" when the user encounters this element.
- Step names are explicit ("Choose sites to block") rather than generic ("Step 1"). This gives screen reader users context about what each step involves.
- An ordered list (`<ol>`) is used because the steps have a sequential order. Screen readers announce "list, 4 items" giving the user the total count.
- Step transition announcements are handled via a dedicated live region rather than relying on `aria-current` changes, because some screen readers do not automatically announce `aria-current` changes.

---

## 3. Live Regions for Dynamic Content

Focus Mode - Blocker has many dynamic state changes that must be communicated to screen readers. Rather than scattering `aria-live` attributes across the DOM, this section defines two utility classes: a low-level `LiveRegion` and a high-level `StateAnnouncer`.

### 3.1 LiveRegion Utility Class

**File: `src/shared/accessibility/live-region.js`**

```javascript
// src/shared/accessibility/live-region.js
//
// Low-level utility for creating and managing ARIA live regions.
// A live region is a DOM element with aria-live that screen readers
// monitor for text content changes and announce automatically.

export class LiveRegion {
  /**
   * @param {Object} options
   * @param {string} options.id - Unique ID for the live region element
   * @param {'polite'|'assertive'} [options.politeness='polite'] - aria-live value
   * @param {'status'|'alert'|'log'} [options.role='status'] - ARIA role
   * @param {boolean} [options.atomic=true] - Whether to announce full content or just changes
   * @param {HTMLElement} [options.container=document.body] - Where to append the element
   */
  constructor({
    id,
    politeness = 'polite',
    role = 'status',
    atomic = true,
    container = document.body
  }) {
    this.id = id;
    this.politeness = politeness;
    this.element = null;
    this.container = container;
    this.debounceTimer = null;

    this._create(role, atomic);
  }

  /**
   * Create the live region DOM element with sr-only styling.
   * @private
   */
  _create(role, atomic) {
    // Avoid duplicates if called multiple times
    const existing = document.getElementById(this.id);
    if (existing) {
      this.element = existing;
      return;
    }

    const el = document.createElement('div');
    el.id = this.id;
    el.setAttribute('aria-live', this.politeness);
    el.setAttribute('aria-atomic', String(atomic));
    el.setAttribute('role', role);

    // Screen-reader-only positioning
    el.style.position = 'absolute';
    el.style.width = '1px';
    el.style.height = '1px';
    el.style.padding = '0';
    el.style.margin = '-1px';
    el.style.overflow = 'hidden';
    el.style.clip = 'rect(0, 0, 0, 0)';
    el.style.whiteSpace = 'nowrap';
    el.style.border = '0';

    this.element = el;
    this.container.appendChild(el);
  }

  /**
   * Announce a message. The screen reader will speak this text.
   *
   * Uses a clear-then-set pattern to ensure repeated identical messages
   * are still announced. Without clearing first, setting the same text
   * twice would not trigger a new announcement because the DOM did not change.
   *
   * @param {string} message - Text to announce
   * @param {number} [debounceMs=0] - Debounce rapid announcements (ms)
   */
  announce(message, debounceMs = 0) {
    if (!this.element) return;

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    if (debounceMs > 0) {
      this.debounceTimer = setTimeout(() => {
        this._setMessage(message);
      }, debounceMs);
    } else {
      this._setMessage(message);
    }
  }

  /**
   * @private
   */
  _setMessage(message) {
    if (!this.element) return;

    // Clear first to ensure screen reader detects the change
    this.element.textContent = '';

    // Use requestAnimationFrame to ensure the clear is processed first
    requestAnimationFrame(() => {
      if (this.element) {
        this.element.textContent = message;
      }
    });
  }

  /**
   * Clear the live region content.
   */
  clear() {
    if (this.element) {
      this.element.textContent = '';
    }
  }

  /**
   * Remove the live region from the DOM.
   */
  destroy() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
  }
}
```

**Why `clear + requestAnimationFrame + set`?**

Screen readers detect live region changes by monitoring DOM mutations. If you set the same text twice (e.g., announcing "Site added" twice in a row), the screen reader sees no change and stays silent. Clearing the text first, then setting it in the next animation frame, guarantees the mutation is detected as a change, even for repeated messages.

---

### 3.2 StateAnnouncer Class

**File: `src/shared/accessibility/state-announcer.js`**

This is the high-level wrapper that all Focus Mode - Blocker components use to communicate state changes. It encapsulates the announcement messages, tone (encouraging, never shame-based), and politeness levels.

```javascript
// src/shared/accessibility/state-announcer.js
//
// High-level screen reader announcement utility for Focus Mode - Blocker.
// Every dynamic state change in the extension flows through this class.

import { LiveRegion } from './live-region.js';

export class StateAnnouncer {
  constructor(container = document.body) {
    // Polite region for routine updates (score, streak, site list changes)
    this.politeRegion = new LiveRegion({
      id: 'sr-announcer',
      politeness: 'polite',
      role: 'status',
      atomic: true,
      container
    });

    // Assertive region for critical updates (errors, session start/end)
    this.assertiveRegion = new LiveRegion({
      id: 'sr-announcer-assertive',
      politeness: 'assertive',
      role: 'alert',
      atomic: true,
      container
    });
  }

  // ─── Session Lifecycle ────────────────────────────────────────────

  /**
   * Announce the start of a focus session.
   * Uses assertive because the user just initiated the action and expects confirmation.
   *
   * @param {number} durationMinutes - Session duration in minutes
   */
  announceSessionStart(durationMinutes) {
    const plural = durationMinutes === 1 ? 'minute' : 'minutes';
    this.assertiveRegion.announce(
      `Focus session started. ${durationMinutes} ${plural} remaining.`
    );
  }

  /**
   * Announce the end of a focus session with the earned score.
   * Uses assertive because this is a significant milestone.
   *
   * @param {number} score - Focus Score earned (0-100)
   */
  announceSessionEnd(score) {
    let encouragement;
    if (score >= 90) {
      encouragement = 'Outstanding work!';
    } else if (score >= 70) {
      encouragement = 'Great job!';
    } else if (score >= 50) {
      encouragement = 'Good effort!';
    } else {
      encouragement = 'Keep building your focus habit!';
    }

    this.assertiveRegion.announce(
      `Focus session complete! You earned ${score} points. ${encouragement}`
    );
  }

  /**
   * Announce time remaining at key minute marks.
   * Uses polite because this is informational, not urgent.
   *
   * @param {number} minutes - Minutes remaining
   */
  announceTimeRemaining(minutes) {
    const plural = minutes === 1 ? 'minute' : 'minutes';
    this.politeRegion.announce(
      `${minutes} ${plural} remaining in your focus session`
    );
  }

  // ─── Blocking ─────────────────────────────────────────────────────

  /**
   * Announce when a blocked site is encountered (block page shown).
   * Uses polite because the user is already seeing the block page visually.
   *
   * @param {string} siteName - Domain name of the blocked site
   */
  announceSiteBlocked(siteName) {
    this.politeRegion.announce(
      `${siteName} is blocked during your focus session`
    );
  }

  // ─── Blocklist Management ─────────────────────────────────────────

  /**
   * Announce when a site is added to the blocklist.
   *
   * @param {string} siteName - Domain name added
   */
  announceSiteAdded(siteName) {
    this.politeRegion.announce(`Added ${siteName} to your blocklist`);
  }

  /**
   * Announce when a site is removed from the blocklist.
   *
   * @param {string} siteName - Domain name removed
   */
  announceSiteRemoved(siteName) {
    this.politeRegion.announce(`Removed ${siteName} from your blocklist`);
  }

  // ─── Nuclear Mode ─────────────────────────────────────────────────

  /**
   * Announce Nuclear Mode state change.
   * Uses assertive because this is a major, intentional action.
   *
   * @param {boolean} isEnabled - Whether Nuclear Mode is now enabled
   * @param {number} [hours=24] - Duration if enabled
   */
  announceNuclearMode(isEnabled, hours = 24) {
    if (isEnabled) {
      this.assertiveRegion.announce(
        `Nuclear mode enabled. All distracting sites are now blocked for ${hours} hours. This cannot be undone.`
      );
    } else {
      this.assertiveRegion.announce('Nuclear mode disabled.');
    }
  }

  // ─── Stats ────────────────────────────────────────────────────────

  /**
   * Announce streak updates.
   * Uses polite because this is supplementary info at session end.
   *
   * @param {number} days - Current streak in days
   */
  announceStreakUpdate(days) {
    const plural = days === 1 ? 'day' : 'days';
    this.politeRegion.announce(`Streak updated: ${days} ${plural}!`);
  }

  /**
   * Announce significant Focus Score changes (typically at session end).
   * Do NOT call this on every minor score fluctuation.
   *
   * @param {number} score - New Focus Score (0-100)
   */
  announceScoreUpdate(score) {
    this.politeRegion.announce(
      `Your Focus Score is now ${score} out of 100`,
      300 // 300ms debounce to prevent rapid-fire announcements
    );
  }

  // ─── Errors ───────────────────────────────────────────────────────

  /**
   * Announce an error. Always assertive because errors require attention.
   *
   * @param {string} message - Human-readable error message
   */
  announceError(message) {
    this.assertiveRegion.announce(message);
  }

  // ─── Paywall ──────────────────────────────────────────────────────

  /**
   * Announce that the paywall modal has appeared.
   * Uses polite because the modal itself will receive focus.
   */
  announcePaywallShown() {
    this.politeRegion.announce('Upgrade to Pro dialog opened');
  }

  /**
   * Announce paywall dismissal.
   */
  announcePaywallDismissed() {
    this.politeRegion.announce('Upgrade dialog closed');
  }

  // ─── Schedule ─────────────────────────────────────────────────────

  /**
   * Announce schedule-based auto-blocking status changes.
   *
   * @param {boolean} isActive - Whether scheduled blocking is now active
   * @param {string} [scheduleName] - Optional schedule name
   */
  announceScheduleChange(isActive, scheduleName) {
    if (isActive) {
      const name = scheduleName ? ` "${scheduleName}"` : '';
      this.politeRegion.announce(
        `Scheduled focus mode${name} is now active. Distracting sites are blocked.`
      );
    } else {
      this.politeRegion.announce('Scheduled focus mode has ended.');
    }
  }

  // ─── Lifecycle ────────────────────────────────────────────────────

  /**
   * Clean up both live regions. Call when the UI surface is being destroyed
   * (e.g., popup closing).
   */
  destroy() {
    this.politeRegion.destroy();
    this.assertiveRegion.destroy();
  }
}
```

---

### 3.3 Integration with Popup Lifecycle

The popup is destroyed on close and recreated on open. The `StateAnnouncer` must be initialized fresh each time.

**Integration in `src/popup/popup.js`:**

```javascript
// src/popup/popup.js (relevant accessibility integration)

import { StateAnnouncer } from '../shared/accessibility/state-announcer.js';
import { initTabBar } from './components/tab-bar.js';
import { updateTimerDisplay, announceSessionStart } from './components/timer-display.js';
import { updateFocusScoreRing } from './components/focus-score-ring.js';
import { updateStreakDisplay } from './components/streak-display.js';

let announcer = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize the announcer — creates live region elements in the DOM
  announcer = new StateAnnouncer(document.body);

  // Initialize tab bar with keyboard navigation
  initTabBar();

  // Load initial state from storage
  const state = await loadPopupState();
  renderCurrentState(state);

  // Listen for real-time updates from the background service worker
  const port = chrome.runtime.connect({ name: 'popup' });

  port.onMessage.addListener((message) => {
    switch (message.type) {
      case 'TIMER_TICK':
        updateTimerDisplay(message.remainingSeconds, message.totalSeconds);
        break;

      case 'SESSION_START':
        announcer.announceSessionStart(message.durationMinutes);
        break;

      case 'SESSION_END':
        announcer.announceSessionEnd(message.score);
        // Delay streak announcement to avoid overlapping with session end
        if (message.streakDays !== undefined) {
          setTimeout(() => {
            announcer.announceStreakUpdate(message.streakDays);
          }, 2000);
        }
        break;

      case 'SCORE_UPDATE':
        updateFocusScoreRing(message.score);
        // Only announce at session end (handled by SESSION_END), not every update
        break;

      case 'STREAK_UPDATE':
        updateStreakDisplay(message.days);
        break;

      case 'SITE_ADDED':
        announcer.announceSiteAdded(message.site);
        break;

      case 'SITE_REMOVED':
        announcer.announceSiteRemoved(message.site);
        break;

      case 'NUCLEAR_MODE_CHANGED':
        announcer.announceNuclearMode(message.isEnabled, message.hours);
        break;

      case 'ERROR':
        announcer.announceError(message.errorMessage);
        break;

      case 'SCHEDULE_CHANGED':
        announcer.announceScheduleChange(message.isActive, message.scheduleName);
        break;
    }
  });
});
```

**Announcement timing for session lifecycle:**

The following diagram shows what is announced and when during a 25-minute focus session:

```
Time   Event               Announcement                              Politeness
─────  ──────────────────  ────────────────────────────────────────   ──────────
00:00  Session starts      "Focus session started. 25 minutes        assertive
                            remaining."
05:00  20 min remaining    "20 minutes remaining in your focus       polite
                            session"
10:00  15 min remaining    "15 minutes remaining in your focus       polite
                            session"
15:00  10 min remaining    "10 minutes remaining in your focus       polite
                            session"
20:00  5 min remaining     "5 minutes remaining in your focus        polite
                            session"
22:00  3 min remaining     "3 minutes remaining in your focus        polite
                            session"
23:00  2 min remaining     "2 minutes remaining in your focus        polite
                            session"
24:00  1 min remaining     "1 minute remaining in your focus         polite
                            session"
25:00  Session ends         "Focus session complete! You earned       assertive
                            85 points. Great job!"
25:02  Streak update       "Streak updated: 7 days!"                 polite
```

Between these announcements, the timer ticks silently. A screen reader user can still query the timer value at any time by navigating to the timer element, because `role="timer"` and the SR-only text are always up to date. The key principle is that the extension should never announce every second — that would be 1,500 announcements in a 25-minute session.

---

## 4. Button vs Link Semantics

Using the correct element (`<button>` vs `<a>`) is a first-principle accessibility decision. Buttons perform actions within the current context. Links navigate to a different page or URL.

### Elements That Must Be `<button>`

| Element | Location | Rationale |
|---------|----------|-----------|
| Start Session | Home tab | Triggers session start action |
| Stop Session | Active session view | Triggers session stop action |
| Add Site | Blocklist tab | Adds a site to the blocklist |
| Remove Site (per item) | Blocklist tab | Removes a site from the blocklist |
| Nuclear Mode toggle | Home tab / Options | Toggles blocking state |
| Settings gear | Popup header | Opens options page (but via `chrome.runtime.openOptionsPage()`, not href) |
| Tab buttons (Home/Blocklist/Stats) | Popup tab bar | Switch views in-page |
| Override Block | Block page | Bypasses the block |
| Stay Focused | Block page | Closes the block page / goes back |
| Dismiss paywall | Paywall modal | Closes the modal |
| Upgrade to Pro CTA | Paywall modal | Triggers checkout flow |
| Quick Focus options (25min/45min) | Home tab | Starts session with preset duration |

**Implementation note for the Settings gear:** Even though it opens a new tab (the options page), it uses `chrome.runtime.openOptionsPage()` which is an API call, not a URL navigation. This means it should be a `<button>`, not an `<a>`. The button handler:

```javascript
settingsBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});
```

### Elements That Must Be `<a>` (Links)

| Element | Location | `href` | Rationale |
|---------|----------|--------|-----------|
| "Zovo" branding | Popup footer | `https://zovo.dev` | Navigates to external site |
| Privacy Policy | Options page footer | `https://zovo.dev/privacy` | Navigates to external page |
| Help/Support | Options page | `https://zovo.dev/support` | Navigates to external page |
| "Learn more" | Paywall modal | `https://zovo.dev/pro` | Opens external info page |

All external links must include `target="_blank"` and `rel="noopener noreferrer"` for security:

```html
<a
  href="https://zovo.dev/pro"
  target="_blank"
  rel="noopener noreferrer"
  class="paywall-modal__learn-more"
>
  Learn more about Pro
  <span class="sr-only">(opens in new tab)</span>
</a>
```

The `<span class="sr-only">(opens in new tab)</span>` warns screen reader users that the link will open a new browser tab. This is important because new tabs can be disorienting for screen reader users who may not realize their context has changed.

### Anti-Pattern: `<div>` or `<span>` with `onclick`

Never do this:

```html
<!-- BAD: not focusable, no keyboard support, no role -->
<div class="start-btn" onclick="startSession()">Start Session</div>
```

If existing code in the extension uses this pattern, refactor to:

```html
<!-- GOOD: focusable, keyboard-accessible, semantically correct -->
<button class="start-btn" type="button">Start Session</button>
```

Every interactive element must be either a `<button>` or an `<a>`. No exceptions.

---

## 5. Form Accessibility

### 5.1 Blocklist Input

The blocklist input field in the Blocklist tab needs a label, hint text, and error handling. The full markup was shown in Section 2.6. Here is the validation flow with accessibility:

```javascript
// src/popup/components/blocklist-tab.js (form handling)

const DOMAIN_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;

function handleBlocklistSubmit(event, announcer) {
  event.preventDefault();

  const input = document.getElementById('blocklist-input');
  const rawValue = input.value.trim().toLowerCase();

  // Clear previous errors
  clearBlocklistError();

  // Validation 1: empty input
  if (!rawValue) {
    showBlocklistError('Please enter a website address');
    announcer.announceError('Please enter a website address');
    input.focus();
    return;
  }

  // Strip protocol and path if user entered a full URL
  const domain = extractDomain(rawValue);

  // Validation 2: invalid domain format
  if (!DOMAIN_REGEX.test(domain)) {
    showBlocklistError('Enter a valid domain like reddit.com');
    announcer.announceError('Invalid URL. Enter a domain like reddit.com');
    input.focus();
    return;
  }

  // Validation 3: duplicate
  if (isAlreadyBlocked(domain)) {
    showBlocklistError(`${domain} is already in your blocklist`);
    announcer.announceError(`${domain} is already in your blocklist`);
    input.focus();
    return;
  }

  // Success: add the site
  addSiteToBlocklist(domain);
  announcer.announceSiteAdded(domain);

  // Clear input and return focus to it for quick subsequent adds
  input.value = '';
  input.focus();
}
```

**Key decisions:**
- On error, focus moves to the input so the user can immediately correct. The error message is both visible (for sighted users) and announced via `role="alert"` (for screen reader users).
- On success, the input is cleared and re-focused, enabling rapid entry of multiple sites.
- The `StateAnnouncer.announceError()` is called in addition to the `role="alert"` error element. This provides redundancy: the alert element handles the case where a screen reader is in forms mode (where it listens for alerts), while the announcer handles browse mode.

### 5.2 Custom Time Input

The custom focus duration input appears in the Home tab (Pro feature) and in the onboarding flow.

```html
<div class="custom-time" role="group" aria-labelledby="custom-time-label">
  <label id="custom-time-label" for="custom-time-input" class="custom-time__label">
    Custom focus duration
  </label>
  <div class="custom-time__input-group">
    <input
      type="number"
      id="custom-time-input"
      class="custom-time__input"
      min="5"
      max="180"
      step="5"
      value="25"
      aria-describedby="custom-time-hint"
    />
    <span class="custom-time__unit" id="custom-time-unit" aria-hidden="true">
      min
    </span>
    <span class="sr-only" id="custom-time-hint">
      Enter a duration between 5 and 180 minutes, in 5-minute increments
    </span>
  </div>
</div>
```

**JavaScript validation:**

```javascript
// src/popup/components/home-tab.js (custom time validation)

function validateCustomTime(input, announcer) {
  const value = parseInt(input.value, 10);

  if (isNaN(value) || value < 5) {
    input.setAttribute('aria-invalid', 'true');
    announcer.announceError('Minimum focus duration is 5 minutes');
    input.value = '5';
    return 5;
  }

  if (value > 180) {
    input.setAttribute('aria-invalid', 'true');
    announcer.announceError('Maximum focus duration is 180 minutes');
    input.value = '180';
    return 180;
  }

  input.removeAttribute('aria-invalid');
  return value;
}
```

**Key decisions:**
- The unit label "min" is `aria-hidden="true"` because the `<label>` already says "Custom focus duration" and the hint specifies "minutes." The visual abbreviation adds no value for screen readers.
- `type="number"` provides native spinner controls and mobile numeric keyboards.
- `aria-describedby` links to the hint text that explains the constraints. Screen readers announce: "Custom focus duration, edit text, Enter a duration between 5 and 180 minutes, in 5-minute increments, 25."

### 5.3 Options Page Settings

The options page (`src/options/options.html`) contains grouped settings. Each group must use `<fieldset>` and `<legend>`.

```html
<!-- src/options/options.html -->

<main class="options-page" role="main">
  <h1 class="options-page__title">Focus Mode Settings</h1>

  <!-- Theme settings -->
  <fieldset class="options-group" id="theme-settings">
    <legend class="options-group__legend">Appearance</legend>

    <div class="options-field">
      <label for="theme-select" class="options-field__label">Theme</label>
      <select id="theme-select" class="options-field__select">
        <option value="system">System default</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>
  </fieldset>

  <!-- Schedule settings -->
  <fieldset class="options-group" id="schedule-settings">
    <legend class="options-group__legend">Focus Schedule</legend>

    <div class="options-field">
      <label class="options-field__label" id="schedule-toggle-label">
        Enable scheduled focus sessions
      </label>
      <button
        id="schedule-toggle"
        role="switch"
        aria-checked="false"
        aria-labelledby="schedule-toggle-label"
        class="options-toggle"
      >
        <span class="options-toggle__track" aria-hidden="true">
          <span class="options-toggle__thumb"></span>
        </span>
      </button>
    </div>

    <div class="options-field" id="schedule-days-field" hidden>
      <fieldset class="options-subgroup">
        <legend class="options-subgroup__legend">Active days</legend>
        <div class="options-checkboxes">
          <label class="options-checkbox">
            <input type="checkbox" name="schedule-day" value="mon" />
            <span>Monday</span>
          </label>
          <label class="options-checkbox">
            <input type="checkbox" name="schedule-day" value="tue" />
            <span>Tuesday</span>
          </label>
          <label class="options-checkbox">
            <input type="checkbox" name="schedule-day" value="wed" />
            <span>Wednesday</span>
          </label>
          <label class="options-checkbox">
            <input type="checkbox" name="schedule-day" value="thu" />
            <span>Thursday</span>
          </label>
          <label class="options-checkbox">
            <input type="checkbox" name="schedule-day" value="fri" />
            <span>Friday</span>
          </label>
          <label class="options-checkbox">
            <input type="checkbox" name="schedule-day" value="sat" />
            <span>Saturday</span>
          </label>
          <label class="options-checkbox">
            <input type="checkbox" name="schedule-day" value="sun" />
            <span>Sunday</span>
          </label>
        </div>
      </fieldset>
    </div>

    <div class="options-field" id="schedule-time-field" hidden>
      <label for="schedule-start-time" class="options-field__label">
        Start time
      </label>
      <input
        type="time"
        id="schedule-start-time"
        class="options-field__input"
        value="09:00"
      />

      <label for="schedule-end-time" class="options-field__label">
        End time
      </label>
      <input
        type="time"
        id="schedule-end-time"
        class="options-field__input"
        value="17:00"
      />
    </div>
  </fieldset>

  <!-- Nuclear Mode settings -->
  <fieldset class="options-group" id="nuclear-settings">
    <legend class="options-group__legend">Nuclear Mode</legend>

    <div class="options-field">
      <label for="nuclear-duration" class="options-field__label">
        Nuclear mode duration
      </label>
      <select id="nuclear-duration" class="options-field__select"
        aria-describedby="nuclear-duration-hint"
      >
        <option value="1">1 hour</option>
        <option value="2">2 hours</option>
        <option value="4">4 hours</option>
        <option value="8">8 hours</option>
        <option value="24" selected>24 hours</option>
      </select>
      <p class="options-field__hint" id="nuclear-duration-hint">
        Nuclear mode blocks all distracting sites and cannot be disabled until the timer expires
      </p>
    </div>
  </fieldset>

  <!-- Notification preferences -->
  <fieldset class="options-group" id="notification-settings">
    <legend class="options-group__legend">Notifications</legend>

    <div class="options-field">
      <label class="options-field__label" id="notify-session-end-label">
        Notify when session ends
      </label>
      <button
        id="notify-session-end"
        role="switch"
        aria-checked="true"
        aria-labelledby="notify-session-end-label"
        class="options-toggle"
      >
        <span class="options-toggle__track" aria-hidden="true">
          <span class="options-toggle__thumb"></span>
        </span>
      </button>
    </div>

    <div class="options-field">
      <label class="options-field__label" id="notify-streak-label">
        Streak reminders
      </label>
      <button
        id="notify-streak"
        role="switch"
        aria-checked="true"
        aria-labelledby="notify-streak-label"
        class="options-toggle"
      >
        <span class="options-toggle__track" aria-hidden="true">
          <span class="options-toggle__thumb"></span>
        </span>
      </button>
    </div>
  </fieldset>
</main>
```

**Toggle switch JavaScript (`role="switch"` pattern):**

```javascript
// src/options/options.js (toggle switch handler)

function initToggles() {
  const toggles = document.querySelectorAll('[role="switch"]');

  toggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const isChecked = toggle.getAttribute('aria-checked') === 'true';
      toggle.setAttribute('aria-checked', String(!isChecked));
      handleToggleChange(toggle.id, !isChecked);
    });

    toggle.addEventListener('keydown', (e) => {
      // Space and Enter toggle the switch
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        toggle.click();
      }
    });
  });
}
```

**Key decisions:**
- Custom toggle switches use `role="switch"` with `aria-checked`, not `role="checkbox"`. The switch role better communicates that the control has an on/off state that takes immediate effect.
- Each fieldset groups related settings under a `<legend>`. Screen readers announce the legend when entering the group (e.g., "Focus Schedule, group").
- The schedule day checkboxes are wrapped in a nested `<fieldset>` with `<legend>` "Active days." This is critical because without the fieldset, a screen reader user hearing "Monday, checkbox" has no context about what Monday refers to.
- Time inputs use `type="time"` for native time picker support. Screen readers handle these natively.
- The Nuclear Mode hint uses `aria-describedby` to ensure the warning about irreversibility is read when the user focuses the duration selector.

### 5.4 Onboarding Form

The onboarding flow (Phase 08) includes site selection checkboxes and focus duration radio buttons.

```html
<!-- Step 1: Site selection (src/onboarding/onboarding.html) -->
<fieldset class="onboarding-step" id="step-1">
  <legend class="onboarding-step__legend">Choose sites to block</legend>
  <p class="onboarding-step__description" id="step-1-desc">
    Select the sites that distract you the most. You can always change these later.
  </p>

  <div class="site-selection" role="group" aria-describedby="step-1-desc">
    <label class="site-selection__option">
      <input type="checkbox" name="site" value="reddit.com" />
      <span class="site-selection__icon" aria-hidden="true">
        <img src="../icons/sites/reddit.svg" alt="" width="24" height="24" />
      </span>
      <span class="site-selection__name">reddit.com</span>
    </label>

    <label class="site-selection__option">
      <input type="checkbox" name="site" value="twitter.com" />
      <span class="site-selection__icon" aria-hidden="true">
        <img src="../icons/sites/twitter.svg" alt="" width="24" height="24" />
      </span>
      <span class="site-selection__name">twitter.com</span>
    </label>

    <label class="site-selection__option">
      <input type="checkbox" name="site" value="youtube.com" />
      <span class="site-selection__icon" aria-hidden="true">
        <img src="../icons/sites/youtube.svg" alt="" width="24" height="24" />
      </span>
      <span class="site-selection__name">youtube.com</span>
    </label>

    <label class="site-selection__option">
      <input type="checkbox" name="site" value="facebook.com" />
      <span class="site-selection__icon" aria-hidden="true">
        <img src="../icons/sites/facebook.svg" alt="" width="24" height="24" />
      </span>
      <span class="site-selection__name">facebook.com</span>
    </label>

    <label class="site-selection__option">
      <input type="checkbox" name="site" value="instagram.com" />
      <span class="site-selection__icon" aria-hidden="true">
        <img src="../icons/sites/instagram.svg" alt="" width="24" height="24" />
      </span>
      <span class="site-selection__name">instagram.com</span>
    </label>

    <label class="site-selection__option">
      <input type="checkbox" name="site" value="tiktok.com" />
      <span class="site-selection__icon" aria-hidden="true">
        <img src="../icons/sites/tiktok.svg" alt="" width="24" height="24" />
      </span>
      <span class="site-selection__name">tiktok.com</span>
    </label>
  </div>
</fieldset>

<!-- Step 2: Duration selection -->
<fieldset class="onboarding-step" id="step-2" hidden>
  <legend class="onboarding-step__legend">Set your focus duration</legend>
  <p class="onboarding-step__description" id="step-2-desc">
    How long do you want to focus? We recommend starting with 25 minutes.
  </p>

  <div class="duration-selection" role="radiogroup" aria-describedby="step-2-desc"
    aria-label="Focus session duration"
  >
    <label class="duration-selection__option">
      <input type="radio" name="duration" value="15" />
      <span class="duration-selection__value">15 min</span>
      <span class="sr-only">15 minutes</span>
    </label>

    <label class="duration-selection__option">
      <input type="radio" name="duration" value="25" checked />
      <span class="duration-selection__value">25 min</span>
      <span class="sr-only">25 minutes, recommended</span>
    </label>

    <label class="duration-selection__option">
      <input type="radio" name="duration" value="45" />
      <span class="duration-selection__value">45 min</span>
      <span class="sr-only">45 minutes</span>
    </label>

    <label class="duration-selection__option">
      <input type="radio" name="duration" value="60" />
      <span class="duration-selection__value">60 min</span>
      <span class="sr-only">60 minutes</span>
    </label>
  </div>
</fieldset>
```

**Key decisions:**
- Site icons are decorative (`alt=""`, `aria-hidden="true"` on the wrapper). The checkbox label text "reddit.com" provides the accessible name.
- Duration radio buttons have SR-only text that expands "min" to "minutes" and notes which option is recommended.
- Each step is a `<fieldset>` with a `<legend>` that serves as both the visual heading and the group label for screen readers.

---

## 6. Screen Reader Testing Checklist

### 6.1 NVDA (Windows)

Test using NVDA (free, open source) with Chrome on Windows. NVDA is the most widely used screen reader among Chrome extension users.

**Setup:**
1. Install NVDA from nvaccess.org
2. Load Focus Mode - Blocker as an unpacked extension in Chrome
3. Open the popup by clicking the extension icon (or Ctrl+Shift+F shortcut if configured)

**Test Steps — Popup:**

| # | Action | Expected NVDA Output | Pass? |
|---|--------|---------------------|-------|
| 1 | Open popup | "Focus Mode, heading level 1" | |
| 2 | Tab to settings gear | "Open settings, button" | |
| 3 | Tab to tab bar | "Popup navigation, tab list, Home tab, selected, 1 of 3" | |
| 4 | Arrow right in tab bar | "Blocklist tab, 2 of 3" (panel switches) | |
| 5 | Arrow right again | "Stats tab, 3 of 3" | |
| 6 | Arrow right again (wraps) | "Home tab, 1 of 3" | |
| 7 | Tab into Home panel | Focus lands on "Start Focus Session, button" | |
| 8 | Press Enter on Start | "Focus session started. 25 minutes remaining." (assertive) | |
| 9 | Wait 5 minutes | "20 minutes remaining in your focus session" (polite) | |
| 10 | Navigate to timer | "Focus session timer, timer, 19 minutes remaining" | |
| 11 | Navigate to score ring | "Focus Score, progress bar, 0 of 100" | |
| 12 | Navigate to streak | "Current streak: 3 days" | |
| 13 | Tab to Stop Session button | "Stop Session, button" | |
| 14 | Press Enter on Stop | "Focus session complete! You earned 85 points. Great job!" | |

**Test Steps — Blocklist Tab:**

| # | Action | Expected NVDA Output | Pass? |
|---|--------|---------------------|-------|
| 1 | Switch to Blocklist tab | "Blocklist tab, selected, 2 of 3" | |
| 2 | Tab to input | "Website to block, edit, Enter a domain name like reddit.com..." | |
| 3 | Type "reddit.com" and submit | "Added reddit.com to your blocklist" | |
| 4 | Submit empty input | "Please enter a website address" (alert) | |
| 5 | Submit invalid input "xyz" | "Invalid URL. Enter a domain like reddit.com" (alert) | |
| 6 | Navigate blocklist | "Blocked websites, list, 3 items" | |
| 7 | Tab to remove button | "Remove reddit.com from blocklist, button" | |
| 8 | Press Enter on remove | "Removed reddit.com from your blocklist" | |
| 9 | Check count update | "2 sites blocked" (polite) | |

**Test Steps — Block Page:**

| # | Action | Expected NVDA Output | Pass? |
|---|--------|---------------------|-------|
| 1 | Visit blocked site | Block page loads, focus on "Stay Focused, button" | |
| 2 | Read heading | "Stay Focused, heading level 1" | |
| 3 | Read block reason | "reddit.com is blocked during your focus session." | |
| 4 | Navigate to timer | "Time remaining in focus session, timer, 23 minutes remaining" | |
| 5 | Navigate to quote | "blockquote, The secret of getting ahead is getting started, Mark Twain" | |
| 6 | Tab to Override | "Override Block, button, Overriding will reduce your Focus Score..." | |

**Test Steps — Paywall Modal:**

| # | Action | Expected NVDA Output | Pass? |
|---|--------|---------------------|-------|
| 1 | Trigger paywall | "Upgrade to Pro dialog opened" then focus moves to CTA | |
| 2 | Read dialog title | "[Trigger headline], heading level 2" | |
| 3 | Tab through dialog | Focus cycles within dialog (CTA, Not now, Close) | |
| 4 | Tab past last element | Focus wraps to first focusable in dialog | |
| 5 | Press Escape | Dialog closes, "Upgrade dialog closed," focus returns to trigger | |
| 6 | Try to read background | Background content is not accessible (inert) | |

---

### 6.2 VoiceOver (Mac)

Test using VoiceOver (built into macOS) with Chrome.

**Setup:**
1. Enable VoiceOver: System Settings > Accessibility > VoiceOver, or press Cmd+F5
2. Open Chrome with Focus Mode - Blocker loaded
3. Open the popup

**Test Steps — Popup:**

| # | Action | VO Command | Expected Output | Pass? |
|---|--------|-----------|----------------|-------|
| 1 | Open popup | — | "Focus Mode, heading level 1" | |
| 2 | Next element | VO+Right Arrow | "Open settings, button" | |
| 3 | Navigate to tab bar | VO+Right Arrow | "Popup navigation, tab list" | |
| 4 | Enter tab list | VO+Down Arrow | "Home, selected tab, 1 of 3" | |
| 5 | Next tab | Right Arrow | "Blocklist, tab, 2 of 3" | |
| 6 | Activate tab | VO+Space | Blocklist panel shows | |
| 7 | Navigate to input | VO+Right Arrow | "Website to block, text field" | |
| 8 | Interact with input | VO+Space | Enters input editing mode | |
| 9 | Type and submit | Type + Return | "Added twitter.com to your blocklist" | |
| 10 | Navigate to list | VO+Right Arrow | "Blocked websites, list, 3 items" | |
| 11 | Read list item | VO+Right Arrow | "twitter.com" | |
| 12 | Next element | VO+Right Arrow | "Remove twitter.com from blocklist, button" | |

**Test Steps — Timer (Active Session):**

| # | Action | VO Command | Expected Output | Pass? |
|---|--------|-----------|----------------|-------|
| 1 | Start session | VO+Space on Start | "Focus session started. 25 minutes remaining." | |
| 2 | Navigate to timer | VO+Right Arrow | "Focus session timer, timer, 25 minutes remaining" | |
| 3 | Wait for minute mark | — | Polite announcement: "24 minutes remaining..." | |
| 4 | Check score | VO+Right Arrow | "Focus Score, 0%, progress indicator" | |

**Test Steps — Options Page:**

| # | Action | VO Command | Expected Output | Pass? |
|---|--------|-----------|----------------|-------|
| 1 | Open options | Activate settings gear | Options page opens in new tab | |
| 2 | Navigate by headings | VO+Cmd+H | "Focus Mode Settings, heading level 1" | |
| 3 | Navigate by groups | VO+Right Arrow | "Appearance, group" | |
| 4 | Enter group | VO+Down Arrow | "Theme, popup button, System default" | |
| 5 | Navigate to toggle | VO+Right Arrow | "Enable scheduled focus sessions, switch, off" | |
| 6 | Toggle switch | VO+Space | "on" (switch state changes) | |
| 7 | Navigate to checkboxes | VO+Right Arrow | "Active days, group, Monday, checkbox, not checked" | |

---

### 6.3 Verification Matrix

This matrix summarizes every accessibility checkpoint for Focus Mode - Blocker. Use it as a final sign-off checklist.

**ARIA Attributes:**

| Element | Attribute | Value | Verified? |
|---------|-----------|-------|-----------|
| Popup header icon | `aria-hidden` | `"true"` | |
| Popup header title | `<h1>` | "Focus Mode" | |
| Settings gear button | `aria-label` | "Open settings" | |
| Tab bar container | `role` | `"tablist"` | |
| Tab bar container | `aria-label` | "Popup navigation" | |
| Each tab button | `role` | `"tab"` | |
| Each tab button | `aria-selected` | `"true"` / `"false"` | |
| Each tab button | `aria-controls` | Panel ID | |
| Each tab panel | `role` | `"tabpanel"` | |
| Each tab panel | `aria-labelledby` | Tab ID | |
| Timer container | `role` | `"timer"` | |
| Timer container | `aria-live` | `"off"` (toggles to `"polite"`) | |
| Timer container | `aria-atomic` | `"true"` | |
| Timer container | `aria-label` | "Focus session timer" | |
| Focus Score ring | `role` | `"progressbar"` | |
| Focus Score ring | `aria-valuenow` | Current score | |
| Focus Score ring | `aria-valuemin` | `"0"` | |
| Focus Score ring | `aria-valuemax` | `"100"` | |
| Focus Score ring | `aria-label` | "Focus Score" | |
| Streak text | `aria-label` | "Current streak: X days" | |
| Blocklist list | `role` | `"list"` | |
| Blocklist list | `aria-label` | "Blocked websites" | |
| Each list item | `role` | `"listitem"` | |
| Each remove button | `aria-label` | "Remove [site] from blocklist" | |
| Blocklist input | `aria-describedby` | Hint + error IDs | |
| Blocklist input (on error) | `aria-invalid` | `"true"` | |
| Blocklist error | `role` | `"alert"` | |
| Paywall dialog | `role` | `"dialog"` | |
| Paywall dialog | `aria-modal` | `"true"` | |
| Paywall dialog | `aria-labelledby` | Title ID | |
| Paywall dialog | `aria-describedby` | Description ID | |
| Onboarding step | `aria-current` | `"step"` (on active) | |
| Block page override btn | `aria-describedby` | Warning text ID | |
| Options toggles | `role` | `"switch"` | |
| Options toggles | `aria-checked` | `"true"` / `"false"` | |

**Live Region Announcements:**

| Event | Message | Politeness | Verified? |
|-------|---------|------------|-----------|
| Session starts | "Focus session started. 25 minutes remaining." | assertive | |
| Minute mark (20/15/10/5/3/2/1) | "X minutes remaining in your focus session" | polite | |
| Session ends | "Focus session complete! You earned X points. [Encouragement]" | assertive | |
| Site added | "Added [site] to your blocklist" | polite | |
| Site removed | "Removed [site] from your blocklist" | polite | |
| Nuclear mode on | "Nuclear mode enabled. All distracting sites are now blocked..." | assertive | |
| Nuclear mode off | "Nuclear mode disabled." | assertive | |
| Streak update | "Streak updated: X days!" | polite | |
| Score update | "Your Focus Score is now X out of 100" | polite | |
| Error | Error message text | assertive | |
| Paywall shown | "Upgrade to Pro dialog opened" | polite | |
| Paywall dismissed | "Upgrade dialog closed" | polite | |
| Schedule activated | "Scheduled focus mode is now active..." | polite | |
| Schedule deactivated | "Scheduled focus mode has ended." | polite | |
| Onboarding step change | "Step X of 4: [Step name]" | polite | |

**Keyboard Navigation:**

| Interaction | Keys | Behavior | Verified? |
|-------------|------|----------|-----------|
| Tab bar: switch tabs | Left/Right Arrow | Moves between tabs, activates | |
| Tab bar: first/last | Home/End | Jumps to first/last tab | |
| Tab bar: enter panel | Tab | Moves focus into active panel | |
| Start/Stop session | Enter or Space | Triggers session action | |
| Add site | Enter (in input) | Submits form | |
| Remove site | Enter or Space | Removes site from list | |
| Paywall: dismiss | Escape | Closes modal, restores focus | |
| Paywall: focus trap | Tab/Shift+Tab | Cycles within dialog | |
| Options: toggle switch | Space or Enter | Toggles on/off | |
| Block page: override | Tab to button, Enter | Triggers override | |

---

## Appendix A: Utility File Locations

New files introduced by this specification:

```
src/shared/
├── accessibility/
│   ├── live-region.js        # LiveRegion class (Section 3.1)
│   └── state-announcer.js    # StateAnnouncer class (Section 3.2)
```

These files are imported by:
- `src/popup/popup.js` (popup announcements)
- `src/content/block-page/block-page.js` (block page announcements)
- `src/options/options.js` (options page announcements)
- `src/onboarding/onboarding.js` (onboarding announcements)

## Appendix B: CSS Utility

The `.sr-only` class must be available in every UI surface's stylesheet:

```css
/* Include in popup.css, block-page.css, options.css, onboarding.css */
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

This is preferred over `display: none` or `visibility: hidden` because those remove elements from the accessibility tree entirely. The `.sr-only` class keeps elements in the accessibility tree while making them visually invisible.

## Appendix C: Cross-References

| Dependency | Phase | Relevant Detail |
|------------|-------|----------------|
| UI component structure | Phase 12 (MV3 Architecture, Agent 5) | Popup file tree, component organization, six states |
| Onboarding flow | Phase 08 (Branding & Retention, Agent 3) | Step count, step content, progression logic |
| Paywall modal | Phase 09 (Payment Integration, Agent 3) | Trigger content, modal lifecycle, CTA behavior |
| Blocklist storage | Phase 12 (MV3 Architecture, Agent 2) | DNR rules, storage schema, site add/remove API |
| Timer system | Phase 12 (MV3 Architecture, Agent 1) | Alarm-based ticks, port-based streaming to popup |
| Service worker messaging | Phase 12 (MV3 Architecture, Agent 1) | Message types, port connections, real-time updates |
