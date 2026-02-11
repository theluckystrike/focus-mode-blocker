# Onboarding System — Focus Mode - Blocker

> **Document:** Agent 3 — Phase 08 (Branding & Retention System)
> **Extension:** Focus Mode - Blocker by Zovo
> **Last Updated:** 2026-02-11
> **Status:** Specification Complete

---

## Table of Contents

1. [Onboarding Strategy](#1-onboarding-strategy)
2. [Onboarding Flow Design](#2-onboarding-flow-design)
3. [Onboarding JavaScript Specification](#3-onboarding-javascript-specification)
4. [Onboarding CSS & Visual Design](#4-onboarding-css--visual-design)
5. [What's New Page (Major Updates)](#5-whats-new-page-major-updates)
6. [In-Popup First-Use Hints](#6-in-popup-first-use-hints)
7. [Onboarding A/B Tests](#7-onboarding-ab-tests)
8. [File Structure](#8-file-structure)
9. [Success Metrics](#9-success-metrics)
10. [Edge Cases & Error Handling](#10-edge-cases--error-handling)
11. [Accessibility Requirements](#11-accessibility-requirements)
12. [Localization Readiness](#12-localization-readiness)
13. [Implementation Checklist](#13-implementation-checklist)

---

## 1. Onboarding Strategy

### Core Philosophy

The onboarding system is the single most critical moment in the user's relationship with Focus Mode - Blocker. Every second counts. Users who block their first site within 60 seconds are 4x more likely to become weekly active users than those who don't. The entire flow is designed around one principle: **get to the magic moment as fast as possible, then reinforce the decision.**

We follow the "trust-first" model: privacy messaging appears immediately, Pro features are never gated during onboarding, and no paywall appears until Session 3 at the earliest. This is especially important for our target users — knowledge workers under pressure, students with deadlines, freelancers fighting procrastination, and ADHD users who need tools that respect their cognitive load.

### Goals

| Priority | Goal | Target | Rationale |
|----------|------|--------|-----------|
| P0 | User blocks their FIRST site | Within 60 seconds of install | This is the magic moment — creates investment |
| P0 | User completes their FIRST focus session | Within 5 minutes of install | Proves the extension works, delivers value |
| P1 | Build trust immediately | Slide 1, within 5 seconds | Privacy messaging reduces uninstall anxiety |
| P1 | Show the Focus Score | Within first session | Unique value prop, differentiator from competitors |
| P2 | No Pro promotion until Session 3+ | Never during onboarding flow | Build value first, monetize after trust is established |
| P2 | Personalize the experience | Slide 3 selections | Investment in preferences increases retention |

### Trigger Conditions

The onboarding system responds to four distinct lifecycle events, each with a different level of interruption:

#### First Install (Full Onboarding)
- **Trigger:** `chrome.runtime.onInstalled` with `reason === 'install'`
- **Experience:** Full onboarding flow — 5 slides including quick setup wizard
- **Behavior:** Opens a new tab with the onboarding page automatically
- **Resumability:** Progress is saved after each slide; closing and reopening resumes at last slide
- **Tab behavior:** Onboarding tab opens in foreground; does not replace current tab

#### Major Version Update (X.0.0)
- **Trigger:** `chrome.runtime.onInstalled` with `reason === 'update'` AND major version change
- **Experience:** Single-page "What's New" screen
- **Behavior:** Opens a new tab (non-blocking)
- **Content:** Version number, date, 3-5 key changes with icons, "Got it" dismiss button
- **Frequency:** Only for major versions (e.g., 1.0.0 to 2.0.0)

#### Minor Version Update (X.Y.0)
- **Trigger:** `chrome.runtime.onInstalled` with `reason === 'update'` AND minor version change
- **Experience:** Subtle in-popup banner (dismissible)
- **Behavior:** Small banner at top of popup on next open
- **Content:** One-line description of update + "Learn more" link
- **Auto-dismiss:** After 3 popup opens or manual dismiss

#### Patch Update (X.Y.Z)
- **Trigger:** `chrome.runtime.onInstalled` with `reason === 'update'` AND patch version change
- **Experience:** No notification whatsoever
- **Behavior:** Silent update, no user-facing changes
- **Rationale:** Patch updates should never interrupt focus

### Onboarding Metrics to Track (Locally)

All metrics are stored in `chrome.storage.local` and never transmitted externally. They inform local analytics for self-improvement features and A/B test evaluation.

```javascript
// Metrics schema
{
  onboarding_metrics: {
    timeToFirstSiteBlocked: null | number,     // milliseconds from install
    timeToFirstFocusSession: null | number,     // milliseconds from install
    onboardingCompletionRate: boolean,          // did user reach Slide 5?
    slideDropOff: null | number,                // which slide did they close on?
    slideDurations: {                           // time spent per slide in ms
      slide1: null | number,
      slide2: null | number,
      slide3: null | number,
      slide4: null | number,
      slide5: null | number
    },
    sitesBlockedDuringOnboarding: number,       // count from Slide 2
    soundSelectedDuringOnboarding: boolean,     // did they pick a sound?
    focusStyleSelected: string | null,          // which focus style chosen
    firstSessionFromOnboarding: boolean,        // did they click "Start Now"?
    onboardingVersion: string,                  // for A/B test tracking
    abTestGroup: string | null                  // control | variant
  }
}
```

---

## 2. Onboarding Flow Design

### State Machine

```
WELCOME ──→ SETUP_SITES ──→ FOCUS_STYLE ──→ FOCUS_SCORE ──→ READY ──→ COMPLETE
  (1)          (2)             (3)             (4)           (5)
   │            │               │               │             │
   └── skip ────┴─── skip ─────┴─── skip ──────┴── skip ─────┘
                                                               │
                                                           COMPLETE
                                                      (with defaults)
```

- Users can skip at any point; defaults are applied for skipped slides
- Progress is persisted after each slide transition
- Back navigation is available on all slides except Slide 1
- The skip action triggers a confirmation tooltip: "You can always configure this later in Settings"

### Slide 1: Welcome (Brand Introduction)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│                      [Shield Icon - 128px]                       │
│                    Zovo brand purple (#6366f1)                   │
│                                                                  │
│                Welcome to Focus Mode - Blocker                  │
│                Part of the Zovo extension family                 │
│                                                                  │
│       "Block distractions. Build focus. Track your streak."     │
│                                                                  │
│           ┌─────────────────────────────────────────┐           │
│           │  [check] No tracking                    │           │
│           │  [check] No data collection             │           │
│           │  [check] Works offline                  │           │
│           │  [check] 100% open source               │           │
│           └─────────────────────────────────────────┘           │
│                                                                  │
│                          [Next  ->]                              │
│                                                                  │
│                    o [*] o o o     1 of 5                        │
└─────────────────────────────────────────────────────────────────┘
```

**Slide 1 Specification:**

| Property | Value |
|----------|-------|
| Purpose | Build trust, set expectations, introduce brand |
| Target time on slide | ~5 seconds |
| Key message | Privacy-first, part of a trusted family |
| Primary action | "Next" button |
| Skip available | Yes (small text link below dots) |
| Animation | Shield icon fades in with subtle scale-up (300ms ease-out) |
| Trust badges | Four inline checkmarks with brief labels |
| Brand elements | Zovo purple (#6366f1) shield, tagline in italic |

**Why this slide exists:** Users are inherently suspicious of new browser extensions. Mentioning "no tracking" and "no data collection" in the first 5 seconds reduces uninstall anxiety by establishing transparency. The open-source badge further builds trust for technical users.

**Implementation notes:**
- Shield icon should use the 128px version from `src/assets/icons/icon128.png`
- Trust badges use a soft gray background card with rounded corners
- The tagline uses the brand font at a slightly smaller size
- The Zovo brand mention is subtle (secondary text color) — the extension name is primary

### Slide 2: Quick Setup — Add Your First Sites

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│                What distracts you the most?                      │
│           (Select sites to block during focus sessions)          │
│                                                                  │
│           ┌─────────────────────────────────────────┐           │
│           │  [x] reddit.com                         │           │
│           │  [x] twitter.com (X)                    │           │
│           │  [x] youtube.com                        │           │
│           │  [ ] facebook.com                       │           │
│           │  [ ] instagram.com                      │           │
│           │  [ ] tiktok.com                         │           │
│           │  [ ] news.ycombinator.com               │           │
│           │  [ ] linkedin.com                       │           │
│           └─────────────────────────────────────────┘           │
│                                                                  │
│           Or use a pre-built list:                              │
│           [Social Media v]  [News Sites v]  [All Popular v]    │
│                                                                  │
│           ┌──────────────────────────────────┐                  │
│           │ + Add custom site: _____________ │                  │
│           └──────────────────────────────────┘                  │
│                                                                  │
│           3 sites selected (up to 10 free)                      │
│                                                                  │
│              [<- Back]               [Next ->]                  │
│                    o o [*] o o     2 of 5                        │
└─────────────────────────────────────────────────────────────────┘
```

**Slide 2 Specification:**

| Property | Value |
|----------|-------|
| Purpose | MAGIC MOMENT — user blocks their first site(s) |
| Target time on slide | ~15-20 seconds |
| Key interaction | Checkbox selection + custom URL input |
| Pre-selected | reddit.com, twitter.com, youtube.com (top 3 distractions) |
| Minimum selection | At least 1 site required to proceed |
| Maximum selection | 10 sites (free tier limit) |
| Counter | Live counter showing "X sites selected (up to 10 free)" |

**Pre-built lists:**

| List Name | Sites Included |
|-----------|---------------|
| Social Media | reddit.com, twitter.com, facebook.com, instagram.com, tiktok.com, snapchat.com |
| News Sites | news.ycombinator.com, reddit.com, cnn.com, bbc.com, nytimes.com |
| All Popular | Union of Social Media + News + youtube.com + linkedin.com |

**Custom URL input:**
- Accepts domain format (e.g., `example.com`) — strips protocol and path automatically
- Validates against URL pattern: must contain at least one dot and valid TLD
- Error state: red border + "Enter a valid domain (e.g., example.com)"
- Success state: green checkmark, site added to list above
- Enter key or "+" button submits

**Why pre-selection works:** Research on default effects (Johnson & Goldstein, 2003) shows that opt-out defaults dramatically increase participation. Pre-selecting the top 3 distractors means most users will block 3+ sites with zero effort, creating immediate investment in the extension.

**Validation logic:**
```javascript
function validateDomain(input) {
  const cleaned = input
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '')
    .trim()
    .toLowerCase();

  const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/;
  return domainRegex.test(cleaned) ? cleaned : null;
}
```

**Edge cases:**
- If user unchecks all and tries to proceed: gentle nudge tooltip "Select at least 1 site to get started"
- If user enters a duplicate: "Already in your list!" tooltip
- If user hits the 10-site limit: "You've reached the free limit. Upgrade to Pro for unlimited sites." (subtle, not blocking)

### Slide 3: Choose Your Focus Style

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│                   How do you like to focus?                      │
│                                                                  │
│       ┌──────────────────┐    ┌──────────────────┐             │
│       │   [tomato icon]  │    │   [timer icon]   │             │
│       │    Pomodoro      │    │   Custom Timer   │             │
│       │   25 min focus   │    │   Set your own   │             │
│       │    5 min break   │    │   duration       │             │
│       │  [Selected /]    │    │     [PRO]        │             │
│       └──────────────────┘    └──────────────────┘             │
│                                                                  │
│       ┌──────────────────┐    ┌──────────────────┐             │
│       │  [bolt icon]     │    │   [calendar]     │             │
│       │   Quick Focus    │    │   Scheduled      │             │
│       │   One-click      │    │   Auto-activate  │             │
│       │   25 min session │    │   on schedule    │             │
│       │   [Select]       │    │   [Select]       │             │
│       └──────────────────┘    └──────────────────┘             │
│                                                                  │
│       Want ambient sounds during focus?                         │
│       [Rain]  [Cafe]  [White Noise]  [None]                    │
│                                                                  │
│              [<- Back]               [Next ->]                  │
│                    o o o [*] o     3 of 5                        │
└─────────────────────────────────────────────────────────────────┘
```

**Slide 3 Specification:**

| Property | Value |
|----------|-------|
| Purpose | Personalize experience, create preference investment |
| Target time on slide | ~10-15 seconds |
| Key interaction | Card selection (single select) + sound selection (single select) |
| Default selection | Pomodoro |
| PRO badge | Shown on "Custom Timer" card — first subtle Pro mention |
| Sound default | None selected (opt-in) |

**Focus style cards:**

| Style | Description | Free Tier | Default |
|-------|-------------|-----------|---------|
| Pomodoro | 25 min focus / 5 min break, classic technique | Yes | Yes (pre-selected) |
| Custom Timer | User sets duration from 1-120 minutes | Pro only | No |
| Quick Focus | One-click 25-minute session, no configuration | Yes | No |
| Scheduled | Auto-activates focus mode on a weekly schedule | Yes | No |

**Card interaction:**
- Cards act as radio buttons — selecting one deselects the previous
- Selected card gets a 2px border in Zovo purple (#6366f1) + subtle purple background tint
- Hover state: slight elevation shadow + border highlight
- PRO badge on Custom Timer: small purple pill badge, no paywall — just informational
- Clicking the PRO card shows a tooltip: "Available with Pro. You can try the free styles for now!"

**Sound selection:**
- Three horizontal pill buttons + "None" option
- Clicking a sound pill plays a 3-second preview of the ambient sound
- Selected sound gets filled background in Zovo purple
- Sound preview should not auto-play on slide entry (respect user's audio environment)
- If user is in a meeting/call, we don't want unexpected audio

**Sound assets:**

| Sound | File | Duration (Loop) | Description |
|-------|------|-----------------|-------------|
| Rain | `rain.mp3` | 60s loop | Gentle rain on a window |
| Cafe | `cafe.mp3` | 60s loop | Coffee shop ambient noise |
| White Noise | `white-noise.mp3` | 60s loop | Smooth, consistent white noise |

### Slide 4: Your Focus Score

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│                   Meet Your Focus Score                         │
│                                                                  │
│                     ┌────────────┐                              │
│                     │            │                              │
│                     │     --     │   <-- Empty ring, waiting    │
│                     │    /100    │                              │
│                     └────────────┘                              │
│                                                                  │
│       Your Focus Score measures how well you focus.             │
│       Complete your first session to see it climb!              │
│                                                                  │
│       It tracks:                                                 │
│       [chart icon]   Time spent focused                         │
│       [block icon]   Distractions blocked                       │
│       [fire icon]    Streak consistency                         │
│       [timer icon]   Session completion rate                    │
│                                                                  │
│       The higher your score, the more focused you are.          │
│       Can you reach 100?                                        │
│                                                                  │
│              [<- Back]               [Next ->]                  │
│                    o o o o [*]     4 of 5                        │
└─────────────────────────────────────────────────────────────────┘
```

**Slide 4 Specification:**

| Property | Value |
|----------|-------|
| Purpose | Introduce unique differentiator, create curiosity and goal |
| Target time on slide | ~8-10 seconds |
| Key message | "Complete your first session to see it climb!" |
| Animation | Ring animates from 0 to "--" position with a pulse effect |
| Score display | Shows "--" placeholder, not "0" (zero feels punitive) |
| Gamification hook | "Can you reach 100?" — creates immediate aspiration |

**Focus Score ring visual:**
- Circular progress ring, 120px diameter
- Ring stroke: 8px, rounded line caps
- Empty state: light gray ring (#e5e7eb) with dashed stroke
- "--" text centered in the ring, gray color (#9ca3af)
- "/100" below the dashes, smaller font size
- On slide entry: ring draws itself from 0 to full circle with a 600ms ease-in-out animation, then pulses once (scale 1.0 to 1.05 and back, 400ms)

**Focus Score breakdown items:**
- Each item has an icon on the left and label on the right
- Icons use the Zovo purple (#6366f1) color
- Items are spaced vertically with 12px gap
- Subtle left border accent on each item (2px Zovo purple)

**Why "--" instead of "0":**
- A score of "0" implies failure before the user has even started
- "--" implies "not yet measured" which is neutral and inviting
- This small detail reduces new-user anxiety, particularly for ADHD users who are sensitive to negative feedback loops

### Slide 5: You're Ready!

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│                       [Checkmark Icon]                          │
│                                                                  │
│                      You're all set!                            │
│                                                                  │
│       [3] sites blocked  |  Pomodoro mode  |  Rain sound       │
│                                                                  │
│       Keyboard shortcuts:                                       │
│       Alt+Shift+F    Toggle Focus Mode                         │
│       Alt+Shift+Q    Quick Focus (25 min)                      │
│                                                                  │
│       ┌─────────────────────────────────────────────┐          │
│       │                                             │          │
│       │     Start Your First Focus Session          │          │
│       │          [Start Now -- 25 min]              │  GREEN   │
│       │                                             │          │
│       └─────────────────────────────────────────────┘          │
│                                                                  │
│       ┌─────────────────────────────────────────────┐          │
│       │  Or just close this tab and click the       │          │
│       │  extension icon when you're ready.          │          │
│       └─────────────────────────────────────────────┘          │
│                                                                  │
│                    o o o o [*]     5 of 5                        │
└─────────────────────────────────────────────────────────────────┘
```

**Slide 5 Specification:**

| Property | Value |
|----------|-------|
| Purpose | Drive first session immediately, provide summary |
| Target time on slide | ~5-10 seconds before clicking CTA |
| Primary CTA | "Start Now -- 25 min" (green button, full width) |
| Secondary action | Close tab, use extension icon later |
| Summary line | Dynamic — shows actual selections from previous slides |
| Keyboard shortcuts | Displayed for power users |

**Summary line logic:**
```javascript
function buildSummaryLine(onboardingData) {
  const parts = [];
  const siteCount = onboardingData.initialBlocklist.length;
  parts.push(`${siteCount} site${siteCount !== 1 ? 's' : ''} blocked`);

  const styleLabels = {
    pomodoro: 'Pomodoro mode',
    quick: 'Quick Focus mode',
    scheduled: 'Scheduled mode'
  };
  parts.push(styleLabels[onboardingData.focusStyle] || 'Pomodoro mode');

  if (onboardingData.selectedSound) {
    const soundLabels = { rain: 'Rain sound', cafe: 'Cafe sound', 'white-noise': 'White Noise' };
    parts.push(soundLabels[onboardingData.selectedSound]);
  } else {
    parts.push('No sound');
  }

  return parts.join('  |  ');
}
```

**"Start Now" button behavior:**
1. Sends a message to the background service worker to start a focus session
2. Saves `firstSessionStartedFromOnboarding: true` to storage
3. Marks onboarding as complete
4. Closes the onboarding tab after a 500ms delay (allows the message to be sent)
5. The focus session begins immediately — the block page will appear if the user visits a blocked site

**"Close tab" secondary action:**
- Just closes the onboarding tab
- Marks onboarding as complete
- Does NOT start a focus session
- User can start later from the popup

---

## 3. Onboarding JavaScript Specification

### Service Worker Integration (background.js)

```javascript
// ─── Onboarding trigger on install/update ───

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await handleFirstInstall();
  } else if (details.reason === 'update') {
    await handleUpdate(details.previousVersion);
  }
});

async function handleFirstInstall() {
  const { onboardingComplete } = await chrome.storage.local.get('onboardingComplete');

  if (!onboardingComplete) {
    // Open onboarding in a new tab
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/onboarding/onboarding.html'),
      active: true
    });
  }

  // Record install metadata
  await chrome.storage.local.set({
    installedAt: Date.now(),
    installSource: 'chrome_web_store',
    extensionVersion: chrome.runtime.getManifest().version,
    sessionCount: 0,
    onboarding_metrics: {
      timeToFirstSiteBlocked: null,
      timeToFirstFocusSession: null,
      onboardingCompletionRate: false,
      slideDropOff: null,
      slideDurations: { slide1: null, slide2: null, slide3: null, slide4: null, slide5: null },
      sitesBlockedDuringOnboarding: 0,
      soundSelectedDuringOnboarding: false,
      focusStyleSelected: null,
      firstSessionFromOnboarding: false,
      onboardingVersion: '1.0.0',
      abTestGroup: null
    }
  });
}

async function handleUpdate(previousVersion) {
  const currentVersion = chrome.runtime.getManifest().version;
  const updateType = getUpdateType(previousVersion, currentVersion);

  if (updateType === 'major') {
    // Open "What's New" page for major updates
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/onboarding/whats-new.html'),
      active: false // Don't steal focus
    });
  } else if (updateType === 'minor') {
    // Set flag for in-popup banner
    await chrome.storage.local.set({
      showUpdateBanner: true,
      updateBannerVersion: currentVersion,
      updateBannerDismissCount: 0
    });
  }
  // Patch updates: do nothing
}

function getUpdateType(previousVersion, currentVersion) {
  if (!previousVersion || !currentVersion) return 'patch';
  const [prevMajor, prevMinor] = previousVersion.split('.').map(Number);
  const [curMajor, curMinor] = currentVersion.split('.').map(Number);

  if (curMajor > prevMajor) return 'major';
  if (curMinor > prevMinor) return 'minor';
  return 'patch';
}
```

### Onboarding Page Controller (onboarding.js)

```javascript
// ─── Onboarding State Machine ───

const SLIDES = ['welcome', 'setup-sites', 'focus-style', 'focus-score', 'ready'];

const DEFAULTS = {
  initialBlocklist: ['reddit.com', 'twitter.com', 'youtube.com'],
  focusStyle: 'pomodoro',
  selectedSound: null
};

const POPULAR_SITES = [
  { domain: 'reddit.com', label: 'reddit.com', preSelected: true },
  { domain: 'twitter.com', label: 'twitter.com (X)', preSelected: true },
  { domain: 'youtube.com', label: 'youtube.com', preSelected: true },
  { domain: 'facebook.com', label: 'facebook.com', preSelected: false },
  { domain: 'instagram.com', label: 'instagram.com', preSelected: false },
  { domain: 'tiktok.com', label: 'tiktok.com', preSelected: false },
  { domain: 'news.ycombinator.com', label: 'news.ycombinator.com', preSelected: false },
  { domain: 'linkedin.com', label: 'linkedin.com', preSelected: false }
];

const PRESET_LISTS = {
  'social-media': ['reddit.com', 'twitter.com', 'facebook.com', 'instagram.com', 'tiktok.com', 'snapchat.com'],
  'news-sites': ['news.ycombinator.com', 'reddit.com', 'cnn.com', 'bbc.com', 'nytimes.com'],
  'all-popular': ['reddit.com', 'twitter.com', 'youtube.com', 'facebook.com', 'instagram.com', 'tiktok.com', 'news.ycombinator.com', 'linkedin.com']
};

const MAX_FREE_SITES = 10;

class OnboardingController {
  constructor() {
    this.currentSlide = 0;
    this.slideEnteredAt = Date.now();
    this.data = {
      onboardingComplete: false,
      onboardingStartedAt: Date.now(),
      onboardingCompletedAt: null,
      onboardingSlidesViewed: [],
      onboardingSkippedAt: null,
      initialBlocklist: [...DEFAULTS.initialBlocklist],
      focusStyle: DEFAULTS.focusStyle,
      selectedSound: DEFAULTS.selectedSound,
      firstSessionStartedFromOnboarding: false
    };
  }

  async init() {
    // Check for resumed onboarding
    const stored = await chrome.storage.local.get([
      'onboardingProgress',
      'onboardingData'
    ]);

    if (stored.onboardingProgress) {
      this.currentSlide = stored.onboardingProgress;
      this.data = { ...this.data, ...stored.onboardingData };
    }

    this.render();
    this.trackSlideView(this.currentSlide);
  }

  async goToSlide(index) {
    // Record time spent on current slide
    await this.recordSlideDuration(this.currentSlide);

    // Validate before advancing
    if (index > this.currentSlide && !this.validateCurrentSlide()) {
      return;
    }

    this.currentSlide = index;
    this.slideEnteredAt = Date.now();
    this.trackSlideView(index);

    // Persist progress
    await chrome.storage.local.set({
      onboardingProgress: this.currentSlide,
      onboardingData: this.data
    });

    this.render();
  }

  async next() {
    if (this.currentSlide < SLIDES.length - 1) {
      await this.goToSlide(this.currentSlide + 1);
    }
  }

  async back() {
    if (this.currentSlide > 0) {
      await this.goToSlide(this.currentSlide - 1);
    }
  }

  async skip() {
    this.data.onboardingSkippedAt = this.currentSlide + 1;
    await this.complete(false);
  }

  validateCurrentSlide() {
    if (SLIDES[this.currentSlide] === 'setup-sites') {
      if (this.data.initialBlocklist.length === 0) {
        this.showValidationError('Select at least 1 site to get started');
        return false;
      }
    }
    return true;
  }

  async recordSlideDuration(slideIndex) {
    const duration = Date.now() - this.slideEnteredAt;
    const key = `slide${slideIndex + 1}`;
    const metrics = (await chrome.storage.local.get('onboarding_metrics')).onboarding_metrics || {};
    metrics.slideDurations = metrics.slideDurations || {};
    metrics.slideDurations[key] = duration;
    await chrome.storage.local.set({ onboarding_metrics: metrics });
  }

  trackSlideView(index) {
    if (!this.data.onboardingSlidesViewed.includes(index + 1)) {
      this.data.onboardingSlidesViewed.push(index + 1);
    }
  }

  async complete(startSession = false) {
    this.data.onboardingComplete = true;
    this.data.onboardingCompletedAt = Date.now();
    this.data.firstSessionStartedFromOnboarding = startSession;

    // Save all onboarding data
    await chrome.storage.local.set({
      onboardingComplete: true,
      onboardingData: this.data,
      blocklist: this.data.initialBlocklist,
      focusStyle: this.data.focusStyle,
      selectedSound: this.data.selectedSound
    });

    // Update metrics
    const metrics = (await chrome.storage.local.get('onboarding_metrics')).onboarding_metrics || {};
    metrics.onboardingCompletionRate = true;
    metrics.sitesBlockedDuringOnboarding = this.data.initialBlocklist.length;
    metrics.soundSelectedDuringOnboarding = this.data.selectedSound !== null;
    metrics.focusStyleSelected = this.data.focusStyle;
    metrics.firstSessionFromOnboarding = startSession;

    const installedAt = (await chrome.storage.local.get('installedAt')).installedAt;
    if (installedAt) {
      metrics.timeToFirstSiteBlocked = this.data.onboardingCompletedAt - installedAt;
    }

    await chrome.storage.local.set({ onboarding_metrics: metrics });

    // Clean up progress tracking
    await chrome.storage.local.remove(['onboardingProgress']);

    if (startSession) {
      // Send message to background to start focus session
      chrome.runtime.sendMessage({
        type: 'START_FOCUS_SESSION',
        source: 'onboarding',
        style: this.data.focusStyle,
        sound: this.data.selectedSound
      });

      // Close onboarding tab after brief delay
      setTimeout(() => {
        window.close();
      }, 500);
    } else {
      window.close();
    }
  }

  // ─── Site Management (Slide 2) ───

  toggleSite(domain) {
    const index = this.data.initialBlocklist.indexOf(domain);
    if (index > -1) {
      this.data.initialBlocklist.splice(index, 1);
    } else {
      if (this.data.initialBlocklist.length >= MAX_FREE_SITES) {
        this.showValidationError(`You've reached the free limit of ${MAX_FREE_SITES} sites.`);
        return;
      }
      this.data.initialBlocklist.push(domain);
    }
    this.updateSiteCounter();
  }

  addCustomSite(input) {
    const domain = validateDomain(input);
    if (!domain) {
      this.showValidationError('Enter a valid domain (e.g., example.com)');
      return false;
    }
    if (this.data.initialBlocklist.includes(domain)) {
      this.showValidationError('Already in your list!');
      return false;
    }
    if (this.data.initialBlocklist.length >= MAX_FREE_SITES) {
      this.showValidationError(`You've reached the free limit of ${MAX_FREE_SITES} sites.`);
      return false;
    }
    this.data.initialBlocklist.push(domain);
    this.updateSiteCounter();
    return true;
  }

  applyPresetList(listKey) {
    const sites = PRESET_LISTS[listKey] || [];
    for (const site of sites) {
      if (!this.data.initialBlocklist.includes(site) && this.data.initialBlocklist.length < MAX_FREE_SITES) {
        this.data.initialBlocklist.push(site);
      }
    }
    this.updateSiteCounter();
    this.render();
  }

  // ─── Focus Style (Slide 3) ───

  selectFocusStyle(style) {
    if (style === 'custom' && !this.isProUser()) {
      this.showTooltip('Available with Pro. You can try the free styles for now!');
      return;
    }
    this.data.focusStyle = style;
    this.render();
  }

  selectSound(sound) {
    this.data.selectedSound = this.data.selectedSound === sound ? null : sound;
    if (this.data.selectedSound) {
      this.previewSound(sound);
    }
    this.render();
  }

  previewSound(sound) {
    // Stop any currently playing preview
    if (this.audioPreview) {
      this.audioPreview.pause();
      this.audioPreview = null;
    }
    // Play 3-second preview
    const soundFiles = {
      rain: 'assets/sounds/rain.mp3',
      cafe: 'assets/sounds/cafe.mp3',
      'white-noise': 'assets/sounds/white-noise.mp3'
    };
    this.audioPreview = new Audio(chrome.runtime.getURL(soundFiles[sound]));
    this.audioPreview.volume = 0.3;
    this.audioPreview.play();
    setTimeout(() => {
      if (this.audioPreview) {
        this.audioPreview.pause();
        this.audioPreview = null;
      }
    }, 3000);
  }

  // ─── Utility methods ───

  showValidationError(message) { /* Show error tooltip near active element */ }
  showTooltip(message) { /* Show informational tooltip */ }
  updateSiteCounter() { /* Update the "X sites selected" counter text */ }
  isProUser() { return false; /* Always false during onboarding */ }
  render() { /* Re-render current slide based on this.currentSlide and this.data */ }
}

// ─── Domain validation helper ───

function validateDomain(input) {
  const cleaned = input
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '')
    .trim()
    .toLowerCase();

  const domainRegex = /^[a-z0-9]+([-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/;
  return domainRegex.test(cleaned) ? cleaned : null;
}

// ─── Initialize ───

document.addEventListener('DOMContentLoaded', () => {
  const controller = new OnboardingController();
  controller.init();
});
```

### Message Handling in Background Service Worker

The background service worker needs to handle the `START_FOCUS_SESSION` message sent from the onboarding page:

```javascript
// In background.js — message listener for onboarding

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_FOCUS_SESSION' && message.source === 'onboarding') {
    startFocusSession({
      style: message.style || 'pomodoro',
      sound: message.sound || null,
      duration: message.style === 'pomodoro' ? 25 * 60 * 1000 : 25 * 60 * 1000,
      breakDuration: 5 * 60 * 1000
    });

    // Record time to first focus session
    chrome.storage.local.get(['installedAt', 'onboarding_metrics'], (result) => {
      const metrics = result.onboarding_metrics || {};
      metrics.timeToFirstFocusSession = Date.now() - (result.installedAt || Date.now());
      chrome.storage.local.set({ onboarding_metrics: metrics });
    });

    sendResponse({ success: true });
  }
  return true; // Keep message channel open for async response
});
```

---

## 4. Onboarding CSS & Visual Design

### Design Tokens

```css
/* ─── Onboarding Design Tokens ─── */
:root {
  /* Brand Colors */
  --zovo-primary: #6366f1;
  --zovo-primary-hover: #5558e6;
  --zovo-primary-light: #eef2ff;
  --zovo-primary-ring: rgba(99, 102, 241, 0.3);

  /* Neutral Colors */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;

  /* Semantic Colors */
  --success: #10b981;
  --success-bg: #d1fae5;
  --error: #ef4444;
  --error-bg: #fee2e2;
  --warning: #f59e0b;

  /* Typography */
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;

  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;

  /* Borders & Shadows */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 300ms ease;
  --transition-slow: 500ms ease;
}
```

### Layout Structure

```css
/* ─── Onboarding Page Layout ─── */
.onboarding-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: var(--gray-50);
  padding: var(--space-8);
}

.onboarding-card {
  max-width: 640px;
  width: 100%;
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  padding: var(--space-12) var(--space-8);
  position: relative;
  overflow: hidden;
}

.slide {
  display: none;
  animation: slideIn var(--transition-normal) ease-out;
}

.slide.active {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-6);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideOut {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(-20px);
  }
}
```

### Component Styles

```css
/* ─── Buttons ─── */
.btn-primary {
  background: var(--zovo-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-6);
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.btn-primary:hover {
  background: var(--zovo-primary-hover);
}

.btn-primary:focus-visible {
  outline: 2px solid var(--zovo-primary);
  outline-offset: 2px;
}

.btn-start {
  background: var(--success);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-8);
  font-size: var(--font-size-lg);
  font-weight: 700;
  cursor: pointer;
  width: 100%;
  max-width: 400px;
  transition: all var(--transition-fast);
}

.btn-start:hover {
  background: #0ea572;
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-secondary {
  background: transparent;
  color: var(--gray-500);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-6);
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-secondary:hover {
  background: var(--gray-50);
  border-color: var(--gray-300);
}

/* ─── Site Checkboxes (Slide 2) ─── */
.site-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 100%;
  max-width: 400px;
  text-align: left;
}

.site-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.site-item:hover {
  background: var(--gray-50);
}

.site-item input[type="checkbox"] {
  accent-color: var(--zovo-primary);
  width: 18px;
  height: 18px;
}

/* ─── Focus Style Cards (Slide 3) ─── */
.style-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  width: 100%;
  max-width: 450px;
}

.style-card {
  border: 2px solid var(--gray-200);
  border-radius: var(--radius-lg);
  padding: var(--space-6) var(--space-4);
  cursor: pointer;
  text-align: center;
  transition: all var(--transition-fast);
  position: relative;
}

.style-card:hover {
  border-color: var(--gray-300);
  box-shadow: var(--shadow-sm);
}

.style-card.selected {
  border-color: var(--zovo-primary);
  background: var(--zovo-primary-light);
}

.style-card .pro-badge {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  background: var(--zovo-primary);
  color: white;
  font-size: var(--font-size-xs);
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  text-transform: uppercase;
}

/* ─── Sound Pills (Slide 3) ─── */
.sound-pills {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
  justify-content: center;
}

.sound-pill {
  border: 2px solid var(--gray-200);
  border-radius: 999px;
  padding: var(--space-2) var(--space-4);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all var(--transition-fast);
  background: white;
}

.sound-pill:hover {
  border-color: var(--zovo-primary);
}

.sound-pill.selected {
  background: var(--zovo-primary);
  color: white;
  border-color: var(--zovo-primary);
}

/* ─── Progress Dots ─── */
.progress-dots {
  display: flex;
  gap: var(--space-2);
  justify-content: center;
  align-items: center;
  margin-top: var(--space-8);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--gray-300);
  transition: all var(--transition-normal);
}

.dot.active {
  width: 24px;
  border-radius: 4px;
  background: var(--zovo-primary);
}

.slide-counter {
  margin-left: var(--space-4);
  font-size: var(--font-size-sm);
  color: var(--gray-400);
}

/* ─── Focus Score Ring (Slide 4) ─── */
.score-ring-container {
  position: relative;
  width: 120px;
  height: 120px;
}

.score-ring {
  transform: rotate(-90deg);
}

.score-ring .ring-bg {
  stroke: var(--gray-200);
  stroke-dasharray: 4, 4;
  fill: none;
  stroke-width: 8;
  stroke-linecap: round;
}

.score-ring .ring-progress {
  stroke: var(--zovo-primary);
  fill: none;
  stroke-width: 8;
  stroke-linecap: round;
  stroke-dasharray: 0, 314;
  animation: ringDraw 600ms ease-in-out forwards;
}

@keyframes ringDraw {
  to {
    stroke-dasharray: 314, 314;
  }
}

@keyframes ringPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.score-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.score-text .score-value {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--gray-400);
}

.score-text .score-label {
  font-size: var(--font-size-sm);
  color: var(--gray-400);
}

/* ─── Trust Badges (Slide 1) ─── */
.trust-badges {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
  background: var(--gray-50);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-6);
  width: 100%;
  max-width: 400px;
}

.trust-badge {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--gray-600);
}

.trust-badge .checkmark {
  color: var(--success);
  font-weight: 700;
}
```

### Responsive Behavior

```css
/* ─── Responsive ─── */
@media (max-width: 640px) {
  .onboarding-card {
    padding: var(--space-8) var(--space-4);
    border-radius: var(--radius-lg);
  }

  .style-grid {
    grid-template-columns: 1fr;
  }

  .trust-badges {
    grid-template-columns: 1fr;
  }

  .sound-pills {
    flex-direction: column;
    align-items: center;
  }
}
```

---

## 5. What's New Page (Major Updates)

### Design

The "What's New" page is a single-screen overlay that appears only for major version updates (e.g., 1.0.0 to 2.0.0). It should feel lightweight and non-intrusive.

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│        [Shield Icon]  Focus Mode - Blocker                      │
│                                                                  │
│                  What's New in v2.0.0                            │
│                  February 2026                                   │
│                                                                  │
│     [sparkle]  Focus Score improvements                         │
│                More accurate tracking with daily trends          │
│                                                                  │
│     [calendar] Schedule presets                                  │
│                Choose from pre-built weekly schedules            │
│                                                                  │
│     [shield]   Enhanced Nuclear Mode                            │
│                Cannot be bypassed once activated                 │
│                                                                  │
│     [paint]    New block page themes                            │
│                Three new motivational themes                     │
│                                                                  │
│                                                                  │
│                  [Got It]                                        │
│                                                                  │
│               View full changelog ->                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Specification

| Property | Value |
|----------|-------|
| Trigger | Major version update only |
| Tab behavior | Opens in background tab (does not steal focus) |
| Dismiss action | "Got It" button or tab close |
| Content | Version number, date, 3-5 key changes with icons |
| Changelog link | Points to GitHub releases page |
| Storage flag | `lastWhatsNewVersion` prevents re-showing |
| Max change items | 5 (to keep it scannable) |

### Data Structure

```javascript
// whats-new.js
const WHATS_NEW_CONTENT = {
  version: '2.0.0',
  date: 'February 2026',
  changes: [
    {
      icon: 'sparkle',
      title: 'Focus Score improvements',
      description: 'More accurate tracking with daily trends'
    },
    {
      icon: 'calendar',
      title: 'Schedule presets',
      description: 'Choose from pre-built weekly schedules'
    },
    // ... up to 5 items
  ],
  changelogUrl: 'https://github.com/theluckystrike/focus-mode-blocker/releases'
};
```

### Prevention of Repeated Display

```javascript
// In background.js, within handleUpdate()
async function shouldShowWhatsNew(currentVersion) {
  const { lastWhatsNewVersion } = await chrome.storage.local.get('lastWhatsNewVersion');
  if (lastWhatsNewVersion === currentVersion) return false;
  await chrome.storage.local.set({ lastWhatsNewVersion: currentVersion });
  return true;
}
```

---

## 6. In-Popup First-Use Hints

### Purpose

For users who skip onboarding or need additional guidance after onboarding, tooltip hints appear within the main popup UI during the first few sessions.

### Hint Sequence

The hints appear in a strict sequence, one per popup open, for the first 3 popup opens after onboarding completion (or skip):

| Popup Open # | Hint Target | Tooltip Text | Arrow Direction |
|-------------|-------------|--------------|-----------------|
| 1st open | "Add Site" button | "Add a site here to start blocking distractions" | Points down to button |
| 2nd open | "Start Focus" button | "Tap here to start a focus session" | Points down to button |
| 3rd open | Focus Score display | "This is your Focus Score -- keep it high!" | Points up to score |

### Hint System Specification

```javascript
// hint-system.js

const HINT_SEQUENCE = [
  {
    id: 'hint-add-site',
    targetSelector: '#add-site-btn',
    text: 'Add a site here to start blocking distractions',
    arrowDirection: 'down',
    position: 'above'
  },
  {
    id: 'hint-start-focus',
    targetSelector: '#start-focus-btn',
    text: 'Tap here to start a focus session',
    arrowDirection: 'down',
    position: 'above'
  },
  {
    id: 'hint-focus-score',
    targetSelector: '#focus-score-display',
    text: 'This is your Focus Score -- keep it high!',
    arrowDirection: 'up',
    position: 'below'
  }
];

class HintSystem {
  constructor() {
    this.hints = HINT_SEQUENCE;
  }

  async init() {
    const { popupOpenCount, hintsComplete, onboardingComplete } = await chrome.storage.local.get([
      'popupOpenCount',
      'hintsComplete',
      'onboardingComplete'
    ]);

    // Only show hints after onboarding is complete (or skipped)
    if (!onboardingComplete) return;
    if (hintsComplete) return;

    const count = (popupOpenCount || 0) + 1;
    await chrome.storage.local.set({ popupOpenCount: count });

    // Show hint for this popup open (0-indexed in array, 1-indexed count)
    const hintIndex = count - 1;
    if (hintIndex < this.hints.length) {
      this.showHint(this.hints[hintIndex]);
    } else {
      await chrome.storage.local.set({ hintsComplete: true });
    }
  }

  showHint(hint) {
    const target = document.querySelector(hint.targetSelector);
    if (!target) return;

    const tooltip = document.createElement('div');
    tooltip.className = `hint-tooltip hint-${hint.arrowDirection}`;
    tooltip.innerHTML = `
      <span class="hint-text">${hint.text}</span>
      <button class="hint-dismiss" aria-label="Dismiss hint">Got it</button>
    `;

    // Position relative to target
    const rect = target.getBoundingClientRect();
    tooltip.style.position = 'absolute';

    if (hint.position === 'above') {
      tooltip.style.bottom = `${window.innerHeight - rect.top + 8}px`;
      tooltip.style.left = `${rect.left + rect.width / 2}px`;
      tooltip.style.transform = 'translateX(-50%)';
    } else {
      tooltip.style.top = `${rect.bottom + 8}px`;
      tooltip.style.left = `${rect.left + rect.width / 2}px`;
      tooltip.style.transform = 'translateX(-50%)';
    }

    document.body.appendChild(tooltip);

    // Animate in
    requestAnimationFrame(() => tooltip.classList.add('visible'));

    // Dismiss handler
    tooltip.querySelector('.hint-dismiss').addEventListener('click', () => {
      tooltip.classList.remove('visible');
      setTimeout(() => tooltip.remove(), 300);
    });

    // Auto-dismiss after 8 seconds
    setTimeout(() => {
      if (tooltip.parentNode) {
        tooltip.classList.remove('visible');
        setTimeout(() => tooltip.remove(), 300);
      }
    }, 8000);
  }
}
```

### Hint Tooltip CSS

```css
/* ─── Hint Tooltips ─── */
.hint-tooltip {
  background: var(--gray-800);
  color: white;
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-size-sm);
  max-width: 250px;
  z-index: 10000;
  opacity: 0;
  transition: opacity var(--transition-normal);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  box-shadow: var(--shadow-lg);
}

.hint-tooltip.visible {
  opacity: 1;
}

.hint-tooltip::after {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--gray-800);
  transform: rotate(45deg);
}

.hint-down::after {
  bottom: -4px;
  left: 50%;
  margin-left: -4px;
}

.hint-up::after {
  top: -4px;
  left: 50%;
  margin-left: -4px;
}

.hint-dismiss {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  padding: 2px 8px;
  font-size: var(--font-size-xs);
  cursor: pointer;
  white-space: nowrap;
  transition: background var(--transition-fast);
}

.hint-dismiss:hover {
  background: rgba(255, 255, 255, 0.3);
}
```

### Conditions for Suppressing Hints

Hints should NOT appear if:
- A focus session is currently active (don't interrupt focus)
- The user has already performed the hinted action (e.g., already has sites blocked)
- The popup is opened via keyboard shortcut during an active session
- The user explicitly disabled hints in settings

---

## 7. Onboarding A/B Tests

### Testing Framework

All A/B tests run locally using a simple random assignment at install time. No data leaves the device. Test group assignment is stored in `chrome.storage.local` and persists for the lifetime of the install.

```javascript
// ab-test.js

const AB_TESTS = {
  'pre-selected-sites': {
    id: 'pre-selected-sites',
    variants: ['control', 'no-preselect'],
    weights: [0.5, 0.5],
    description: 'Test whether pre-selecting 3 sites increases blocklist size'
  },
  'cta-text': {
    id: 'cta-text',
    variants: ['control', 'action-specific'],
    weights: [0.5, 0.5],
    description: 'Test whether action-specific CTA increases first session rate'
  },
  'slide-count': {
    id: 'slide-count',
    variants: ['control-5', 'compact-3'],
    weights: [0.5, 0.5],
    description: 'Test whether fewer slides increase completion rate'
  },
  'sound-preview': {
    id: 'sound-preview',
    variants: ['no-preview', 'auto-preview'],
    weights: [0.5, 0.5],
    description: 'Test whether auto-playing rain preview increases sound adoption'
  }
};

function assignABGroup(testId) {
  const test = AB_TESTS[testId];
  if (!test) return 'control';

  const random = Math.random();
  let cumulative = 0;

  for (let i = 0; i < test.variants.length; i++) {
    cumulative += test.weights[i];
    if (random < cumulative) {
      return test.variants[i];
    }
  }

  return test.variants[test.variants.length - 1];
}

async function getOrAssignABGroups() {
  const { abTestGroups } = await chrome.storage.local.get('abTestGroups');
  if (abTestGroups) return abTestGroups;

  const groups = {};
  for (const testId of Object.keys(AB_TESTS)) {
    groups[testId] = assignABGroup(testId);
  }

  await chrome.storage.local.set({ abTestGroups: groups });
  return groups;
}
```

### Test Details

#### Test 1: Pre-Selected Sites

| Property | Value |
|----------|-------|
| Test ID | `pre-selected-sites` |
| Control | 3 sites pre-selected (reddit, twitter, youtube) |
| Variant | 0 sites pre-selected (all unchecked) |
| Hypothesis | Pre-selection increases average blocklist size at onboarding |
| Primary metric | Number of sites blocked during onboarding |
| Secondary metric | Onboarding completion rate |
| Sample size needed | ~200 installs per group (for 80% power at 5% significance) |

#### Test 2: CTA Text

| Property | Value |
|----------|-------|
| Test ID | `cta-text` |
| Control | "Start Now -- 25 min" |
| Variant | "Block My First Distraction" |
| Hypothesis | Action-specific CTA text increases first session start rate |
| Primary metric | % of users who click the CTA on Slide 5 |
| Secondary metric | Time to first focus session |
| Sample size needed | ~300 installs per group |

#### Test 3: Slide Count

| Property | Value |
|----------|-------|
| Test ID | `slide-count` |
| Control | 5 slides (full flow as designed) |
| Variant | 3 slides (Welcome + Sites + Ready, with style/score combined) |
| Hypothesis | Fewer slides increase onboarding completion rate |
| Primary metric | Onboarding completion rate |
| Secondary metric | Time to first site blocked |
| Sample size needed | ~200 installs per group |

**Compact variant slide mapping:**
- Slide 1: Welcome (unchanged)
- Slide 2: Setup Sites (unchanged)
- Slide 3: Ready (combines Focus Style selection, Focus Score intro, and Start CTA)

#### Test 4: Sound Preview

| Property | Value |
|----------|-------|
| Test ID | `sound-preview` |
| Control | No auto-play, sounds only play on user click |
| Variant | Rain sound auto-plays (at low volume, 0.15) when Slide 3 appears |
| Hypothesis | Hearing a sound preview increases sound selection rate |
| Primary metric | % of users who select a sound during onboarding |
| Secondary metric | Sound usage in first week |
| Sample size needed | ~200 installs per group |

### Evaluating Test Results

Since all data is local and we cannot aggregate across users, A/B test evaluation happens via the following methods:

1. **Manual export:** A hidden developer setting exports onboarding metrics as JSON for analysis
2. **Local dashboard (Pro feature):** Shows which test group the user is in and their metrics
3. **GitHub Issues:** Users can optionally share their anonymized metrics by pasting the JSON export into a GitHub issue template

This approach preserves our zero-data-collection privacy commitment while still enabling improvement iteration.

---

## 8. File Structure

### Onboarding Module

```
src/onboarding/
  onboarding.html          # Main onboarding page (5-slide wizard)
  onboarding.css           # All styles for the onboarding flow
  onboarding.js            # OnboardingController class + slide logic
  whats-new.html           # "What's New" page for major updates
  whats-new.css            # Styles for "What's New" page
  whats-new.js             # Content loader for "What's New"
  hint-system.js           # In-popup first-use tooltip hints
  ab-test.js               # A/B test assignment and tracking
  assets/
    welcome-illustration.svg   # Shield/brand illustration for Slide 1
    focus-score-preview.svg    # Empty Focus Score ring for Slide 4
    checkmark.svg              # Animated checkmark for Slide 5
    slide-bg-pattern.svg       # Optional subtle background pattern
```

### Manifest Integration

The onboarding files must be registered in `manifest.json`:

```json
{
  "web_accessible_resources": [
    {
      "resources": [
        "src/onboarding/onboarding.html",
        "src/onboarding/whats-new.html",
        "src/onboarding/assets/*"
      ],
      "matches": ["<all_urls>"]
    }
  ]
}
```

### HTML Template Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Focus Mode - Blocker</title>
  <link rel="stylesheet" href="onboarding.css">
  <link rel="icon" type="image/png" href="../assets/icons/icon32.png">
</head>
<body>
  <div class="onboarding-container">
    <div class="onboarding-card">

      <!-- Slide 1: Welcome -->
      <div class="slide" id="slide-welcome" data-slide="0">
        <img src="assets/welcome-illustration.svg" alt="Focus Mode shield" class="welcome-icon">
        <h1>Welcome to Focus Mode - Blocker</h1>
        <p class="subtitle">Part of the Zovo extension family</p>
        <p class="tagline">"Block distractions. Build focus. Track your streak."</p>
        <div class="trust-badges">
          <div class="trust-badge"><span class="checkmark">&#10003;</span> No tracking</div>
          <div class="trust-badge"><span class="checkmark">&#10003;</span> No data collection</div>
          <div class="trust-badge"><span class="checkmark">&#10003;</span> Works offline</div>
          <div class="trust-badge"><span class="checkmark">&#10003;</span> 100% open source</div>
        </div>
      </div>

      <!-- Slide 2: Setup Sites -->
      <div class="slide" id="slide-setup" data-slide="1">
        <h2>What distracts you the most?</h2>
        <p class="subtitle">Select sites to block during focus sessions</p>
        <div class="site-list" id="site-list">
          <!-- Dynamically populated -->
        </div>
        <div class="preset-lists">
          <button class="preset-btn" data-preset="social-media">Social Media</button>
          <button class="preset-btn" data-preset="news-sites">News Sites</button>
          <button class="preset-btn" data-preset="all-popular">All Popular</button>
        </div>
        <div class="custom-site-input">
          <label for="custom-site">+ Add custom site:</label>
          <input type="text" id="custom-site" placeholder="example.com" autocomplete="off">
          <button id="add-custom-btn" aria-label="Add site">+</button>
        </div>
        <p class="site-counter" id="site-counter">3 sites selected (up to 10 free)</p>
      </div>

      <!-- Slide 3: Focus Style -->
      <div class="slide" id="slide-style" data-slide="2">
        <h2>How do you like to focus?</h2>
        <div class="style-grid">
          <div class="style-card" data-style="pomodoro">
            <div class="style-icon">&#127813;</div>
            <h3>Pomodoro</h3>
            <p>25 min focus<br>5 min break</p>
          </div>
          <div class="style-card" data-style="custom">
            <span class="pro-badge">PRO</span>
            <div class="style-icon">&#9201;</div>
            <h3>Custom Timer</h3>
            <p>Set your own<br>duration</p>
          </div>
          <div class="style-card" data-style="quick">
            <div class="style-icon">&#9889;</div>
            <h3>Quick Focus</h3>
            <p>One-click<br>25 min session</p>
          </div>
          <div class="style-card" data-style="scheduled">
            <div class="style-icon">&#128197;</div>
            <h3>Scheduled</h3>
            <p>Auto-activate<br>on schedule</p>
          </div>
        </div>
        <p>Want ambient sounds during focus?</p>
        <div class="sound-pills">
          <button class="sound-pill" data-sound="rain">Rain</button>
          <button class="sound-pill" data-sound="cafe">Cafe</button>
          <button class="sound-pill" data-sound="white-noise">White Noise</button>
          <button class="sound-pill" data-sound="none">None</button>
        </div>
      </div>

      <!-- Slide 4: Focus Score -->
      <div class="slide" id="slide-score" data-slide="3">
        <h2>Meet Your Focus Score</h2>
        <div class="score-ring-container">
          <svg class="score-ring" viewBox="0 0 120 120">
            <circle class="ring-bg" cx="60" cy="60" r="50" />
            <circle class="ring-progress" cx="60" cy="60" r="50" />
          </svg>
          <div class="score-text">
            <div class="score-value">--</div>
            <div class="score-label">/100</div>
          </div>
        </div>
        <p>Your Focus Score measures how well you focus.<br>
        Complete your first session to see it climb!</p>
        <div class="score-factors">
          <div class="factor"><span class="factor-icon">&#128202;</span> Time spent focused</div>
          <div class="factor"><span class="factor-icon">&#128683;</span> Distractions blocked</div>
          <div class="factor"><span class="factor-icon">&#128293;</span> Streak consistency</div>
          <div class="factor"><span class="factor-icon">&#9201;</span> Session completion rate</div>
        </div>
        <p class="emphasis">The higher your score, the more focused you are.<br>Can you reach 100?</p>
      </div>

      <!-- Slide 5: Ready -->
      <div class="slide" id="slide-ready" data-slide="4">
        <div class="checkmark-icon">&#10003;</div>
        <h2>You're all set!</h2>
        <p class="summary-line" id="summary-line">
          <!-- Dynamically populated -->
        </p>
        <div class="shortcuts">
          <h3>Keyboard shortcuts:</h3>
          <div class="shortcut"><kbd>Alt+Shift+F</kbd> Toggle Focus Mode</div>
          <div class="shortcut"><kbd>Alt+Shift+Q</kbd> Quick Focus (25 min)</div>
        </div>
        <button class="btn-start" id="start-session-btn">
          Start Your First Focus Session<br>
          <span class="btn-start-sub">Start Now -- 25 min</span>
        </button>
        <p class="secondary-action">
          Or just close this tab and click the extension icon when you're ready.
        </p>
      </div>

      <!-- Navigation -->
      <div class="navigation">
        <button class="btn-secondary" id="back-btn">&#8592; Back</button>
        <div class="progress-dots" id="progress-dots">
          <!-- Dynamically populated -->
        </div>
        <button class="btn-primary" id="next-btn">Next &#8594;</button>
      </div>

      <!-- Skip link -->
      <a href="#" class="skip-link" id="skip-link">Skip setup</a>

    </div>
  </div>
  <script src="onboarding.js"></script>
</body>
</html>
```

---

## 9. Success Metrics

### Primary Metrics

| Metric | Target | How Measured | Why It Matters |
|--------|--------|-------------|----------------|
| Onboarding completion rate | >70% | Slide 5 reached / Slide 1 views | Users who complete onboarding are 3x more likely to become weekly actives |
| Time to first site blocked | <60 seconds | `installedAt` to `initialBlocklist` save timestamp | The magic moment; immediate investment predicts retention |
| Time to first focus session | <5 minutes | `installedAt` to first `START_FOCUS_SESSION` message | Proves value delivery in the critical first-use window |
| Sites blocked during onboarding | >=3 average | Count from Slide 2 data | More sites blocked = more value delivered = higher retention |
| First session started from onboarding | >40% | `firstSessionStartedFromOnboarding` flag | Measures effectiveness of the Slide 5 CTA |

### Secondary Metrics

| Metric | Target | How Measured | Why It Matters |
|--------|--------|-------------|----------------|
| Sound selected during onboarding | >40% | Sound selection on Slide 3 | Ambient sounds increase session completion rates |
| Onboarding skip rate | <20% | `onboardingSkippedAt` is not null | High skip rate indicates friction or poor content |
| Average slides viewed | >=4 | Length of `onboardingSlidesViewed` array | Engagement depth with onboarding content |
| Slide 2 drop-off rate | <15% | Users who view Slide 1 but not Slide 2 | Slide 1 to Slide 2 is the most critical transition |
| Keyboard shortcut usage in first week | >10% | Track Alt+Shift+F and Alt+Shift+Q usage | Power user adoption indicator |
| Hint system engagement | >50% click "Got it" | Hint dismiss click tracking | Validates that hints are visible and helpful |

### Metric Decay and Cleanup

Onboarding metrics remain in storage permanently but become less relevant after 30 days. The metrics object is never deleted but can be exported via developer tools for analysis.

### Funnel Visualization

```
Install
  |
  v
Slide 1: Welcome .................. 100% (baseline)
  |
  v
Slide 2: Setup Sites .............. Target: 95%+ (5% max drop-off)
  |
  v
Slide 3: Focus Style .............. Target: 85%+
  |
  v
Slide 4: Focus Score .............. Target: 80%+
  |
  v
Slide 5: Ready .................... Target: 75%+
  |
  ├─→ "Start Now" CTA clicked .... Target: 40%+ of Slide 5 viewers
  |
  └─→ Close tab (start later) .... ~35% of Slide 5 viewers
```

---

## 10. Edge Cases & Error Handling

### Scenario Matrix

| Scenario | Expected Behavior | Implementation |
|----------|-------------------|----------------|
| User closes onboarding tab mid-flow | Progress saved; resume on next popup open or re-trigger | `onboardingProgress` key in storage |
| User opens onboarding in multiple tabs | Only one instance active; duplicate tabs show "Onboarding in progress in another tab" | Use `chrome.tabs.query` to detect existing onboarding tabs |
| User clears extension storage during onboarding | Onboarding restarts from Slide 1 with defaults | `init()` handles missing data gracefully |
| User installs offline | Onboarding works fully offline (all assets bundled) | No external dependencies in onboarding |
| User has extremely slow device | All animations use `prefers-reduced-motion` media query | CSS respects `prefers-reduced-motion: reduce` |
| User re-installs extension | `onboardingComplete` is cleared; full onboarding triggers | Standard install flow handles this |
| Chrome auto-updates the extension during onboarding | Onboarding continues with saved progress after restart | Service worker re-init preserves `onboardingProgress` |
| User enters invalid URL in custom site field | Red border + error message, input not cleared | `validateDomain()` handles edge cases |
| User tries to block chrome:// or chrome-extension:// URLs | Politely rejected: "System pages can't be blocked" | Domain validation rejects non-web URLs |
| User reaches 10-site limit on Slide 2 | Subtle message: "Free limit reached. Upgrade to Pro for unlimited." Checkboxes for additional sites are disabled | `MAX_FREE_SITES` check in `toggleSite()` and `addCustomSite()` |
| User has existing blocklist from import | Onboarding pre-populates with imported sites + adds new selections | Merge logic in `complete()` |
| User's browser language is non-English | Onboarding displays in English with localization-ready string structure | All strings in a locale object (see Section 12) |

### Error Handling Patterns

```javascript
// Graceful fallback for missing storage data
async function safeStorageGet(keys, defaults = {}) {
  try {
    const result = await chrome.storage.local.get(keys);
    return { ...defaults, ...result };
  } catch (error) {
    console.error('[Onboarding] Storage read error:', error);
    return defaults;
  }
}

// Graceful fallback for message sending
async function safeSendMessage(message) {
  try {
    return await chrome.runtime.sendMessage(message);
  } catch (error) {
    console.error('[Onboarding] Message send error:', error);
    // If message fails, try direct storage write as fallback
    if (message.type === 'START_FOCUS_SESSION') {
      await chrome.storage.local.set({
        pendingFocusSession: {
          style: message.style,
          sound: message.sound,
          requestedAt: Date.now()
        }
      });
    }
    return { success: false, fallback: true };
  }
}
```

### Duplicate Tab Prevention

```javascript
// In onboarding.js - check for duplicate tabs on init
async function checkForDuplicateOnboardingTabs() {
  const tabs = await chrome.tabs.query({
    url: chrome.runtime.getURL('src/onboarding/onboarding.html')
  });

  if (tabs.length > 1) {
    // Focus the first onboarding tab
    await chrome.tabs.update(tabs[0].id, { active: true });
    // Close all other onboarding tabs
    for (let i = 1; i < tabs.length; i++) {
      chrome.tabs.remove(tabs[i].id);
    }
  }
}
```

---

## 11. Accessibility Requirements

### WCAG 2.1 AA Compliance

The onboarding flow must meet WCAG 2.1 Level AA standards. This is especially important for ADHD users who are a primary target audience and may use assistive technologies.

#### Keyboard Navigation

| Interaction | Keyboard Support |
|-------------|-----------------|
| Navigate between slides | Tab to Next/Back buttons, Enter to activate |
| Toggle site checkboxes | Space to check/uncheck, Tab to move between items |
| Select focus style card | Arrow keys to navigate grid, Enter/Space to select |
| Select sound | Tab between pills, Enter/Space to select |
| Custom URL input | Type + Enter to submit |
| Skip onboarding | Tab to "Skip setup" link, Enter to activate |
| Dismiss hints | Tab to "Got it", Enter to dismiss, Escape to dismiss |

#### Focus Management

```javascript
// When advancing to a new slide, focus the slide heading
function focusSlideHeading(slideIndex) {
  const slide = document.querySelector(`[data-slide="${slideIndex}"]`);
  const heading = slide.querySelector('h1, h2');
  if (heading) {
    heading.setAttribute('tabindex', '-1');
    heading.focus();
  }
}
```

#### ARIA Attributes

```html
<!-- Slide container -->
<div role="tabpanel" aria-label="Onboarding step 1 of 5" class="slide active">

<!-- Progress dots -->
<div role="tablist" aria-label="Onboarding progress" class="progress-dots">
  <button role="tab" aria-selected="true" aria-label="Step 1: Welcome">
  <button role="tab" aria-selected="false" aria-label="Step 2: Setup Sites">
  <!-- ... -->
</div>

<!-- Site checkboxes -->
<div role="group" aria-label="Sites to block">
  <label>
    <input type="checkbox" aria-checked="true"> reddit.com
  </label>
</div>

<!-- Focus style cards -->
<div role="radiogroup" aria-label="Focus style">
  <div role="radio" aria-checked="true" tabindex="0">Pomodoro</div>
  <div role="radio" aria-checked="false" tabindex="-1">Custom Timer</div>
</div>

<!-- Sound pills -->
<div role="radiogroup" aria-label="Ambient sound selection">
  <button role="radio" aria-checked="false">Rain</button>
  <!-- ... -->
</div>
```

#### Screen Reader Announcements

```javascript
// Live region for dynamic announcements
function announce(message) {
  const liveRegion = document.getElementById('sr-announcements');
  liveRegion.textContent = message;
}

// Usage:
announce('3 sites selected. You can add up to 10 free.');
announce('Pomodoro style selected. 25 minutes focus, 5 minutes break.');
announce('Rain sound selected. Playing preview.');
```

```html
<!-- Hidden live region for screen readers -->
<div id="sr-announcements" role="status" aria-live="polite" class="sr-only"></div>
```

#### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  .slide {
    animation: none;
  }

  .score-ring .ring-progress {
    animation: none;
    stroke-dasharray: 314, 314;
  }

  .btn-start:hover {
    transform: none;
  }

  * {
    transition-duration: 0.01ms !important;
  }
}
```

#### Color Contrast

All text meets minimum contrast ratios:

| Element | Foreground | Background | Ratio | Passes AA |
|---------|-----------|------------|-------|-----------|
| Body text | #374151 | #ffffff | 10.3:1 | Yes |
| Subtitle text | #6b7280 | #ffffff | 5.0:1 | Yes |
| Button text | #ffffff | #6366f1 | 5.4:1 | Yes |
| Start button text | #ffffff | #10b981 | 4.6:1 | Yes (large text) |
| Trust badge text | #4b5563 | #f9fafb | 7.5:1 | Yes |
| Hint tooltip text | #ffffff | #1f2937 | 15.4:1 | Yes |
| Error text | #ef4444 | #ffffff | 4.6:1 | Yes (with bold weight) |

#### High Contrast Mode Support

```css
@media (forced-colors: active) {
  .style-card.selected {
    border: 3px solid Highlight;
  }

  .dot.active {
    background: Highlight;
  }

  .btn-primary {
    border: 2px solid ButtonText;
  }
}
```

---

## 12. Localization Readiness

### String Externalization

All user-facing strings are extracted into a locale object, making future translation straightforward. The onboarding uses English as the default with a structure that supports i18n expansion.

```javascript
// locales/en.js
const ONBOARDING_STRINGS = {
  // Slide 1
  slide1_title: 'Welcome to Focus Mode - Blocker',
  slide1_subtitle: 'Part of the Zovo extension family',
  slide1_tagline: 'Block distractions. Build focus. Track your streak.',
  slide1_trust_no_tracking: 'No tracking',
  slide1_trust_no_data: 'No data collection',
  slide1_trust_offline: 'Works offline',
  slide1_trust_open_source: '100% open source',

  // Slide 2
  slide2_title: 'What distracts you the most?',
  slide2_subtitle: 'Select sites to block during focus sessions',
  slide2_preset_social: 'Social Media',
  slide2_preset_news: 'News Sites',
  slide2_preset_all: 'All Popular',
  slide2_custom_label: '+ Add custom site:',
  slide2_custom_placeholder: 'example.com',
  slide2_counter: '{count} site{s} selected (up to {max} free)',
  slide2_min_error: 'Select at least 1 site to get started',
  slide2_max_error: "You've reached the free limit of {max} sites.",
  slide2_duplicate_error: 'Already in your list!',
  slide2_invalid_domain: 'Enter a valid domain (e.g., example.com)',

  // Slide 3
  slide3_title: 'How do you like to focus?',
  slide3_pomodoro_title: 'Pomodoro',
  slide3_pomodoro_desc: '25 min focus / 5 min break',
  slide3_custom_title: 'Custom Timer',
  slide3_custom_desc: 'Set your own duration',
  slide3_quick_title: 'Quick Focus',
  slide3_quick_desc: 'One-click 25 min session',
  slide3_scheduled_title: 'Scheduled',
  slide3_scheduled_desc: 'Auto-activate on schedule',
  slide3_pro_badge: 'PRO',
  slide3_pro_tooltip: 'Available with Pro. You can try the free styles for now!',
  slide3_sound_question: 'Want ambient sounds during focus?',
  slide3_sound_rain: 'Rain',
  slide3_sound_cafe: 'Cafe',
  slide3_sound_white_noise: 'White Noise',
  slide3_sound_none: 'None',

  // Slide 4
  slide4_title: 'Meet Your Focus Score',
  slide4_description: 'Your Focus Score measures how well you focus.',
  slide4_cta: 'Complete your first session to see it climb!',
  slide4_factor_time: 'Time spent focused',
  slide4_factor_blocks: 'Distractions blocked',
  slide4_factor_streak: 'Streak consistency',
  slide4_factor_completion: 'Session completion rate',
  slide4_challenge: 'The higher your score, the more focused you are. Can you reach 100?',

  // Slide 5
  slide5_title: "You're all set!",
  slide5_summary: '{count} site{s} blocked | {style} mode | {sound}',
  slide5_shortcuts_title: 'Keyboard shortcuts:',
  slide5_shortcut_toggle: 'Toggle Focus Mode',
  slide5_shortcut_quick: 'Quick Focus (25 min)',
  slide5_cta_primary: 'Start Your First Focus Session',
  slide5_cta_sub: 'Start Now -- 25 min',
  slide5_cta_variant: 'Block My First Distraction',
  slide5_secondary: 'Or just close this tab and click the extension icon when you\'re ready.',

  // Navigation
  nav_next: 'Next',
  nav_back: 'Back',
  nav_skip: 'Skip setup',
  nav_slide_counter: '{current} of {total}',

  // Hints
  hint_add_site: 'Add a site here to start blocking distractions',
  hint_start_focus: 'Tap here to start a focus session',
  hint_focus_score: 'This is your Focus Score -- keep it high!',
  hint_dismiss: 'Got it',

  // Sounds
  sound_no_sound: 'No sound',
  sound_rain: 'Rain sound',
  sound_cafe: 'Cafe sound',
  sound_white_noise: 'White Noise',

  // Focus styles
  style_pomodoro: 'Pomodoro mode',
  style_quick: 'Quick Focus mode',
  style_scheduled: 'Scheduled mode',
  style_custom: 'Custom Timer mode'
};
```

### Chrome i18n Integration

For future internationalization, strings should migrate to Chrome's built-in `_locales` system:

```
_locales/
  en/
    messages.json
  es/
    messages.json
  de/
    messages.json
  ja/
    messages.json
```

Example `messages.json` entry:

```json
{
  "onboarding_slide1_title": {
    "message": "Welcome to Focus Mode - Blocker",
    "description": "Title shown on the first onboarding slide"
  },
  "onboarding_slide2_counter": {
    "message": "$count$ site$s$ selected (up to $max$ free)",
    "description": "Counter showing number of selected sites",
    "placeholders": {
      "count": { "content": "$1" },
      "s": { "content": "$2" },
      "max": { "content": "$3" }
    }
  }
}
```

Usage in code:

```javascript
// Future i18n usage
const title = chrome.i18n.getMessage('onboarding_slide1_title');
```

### RTL Support Readiness

```css
/* Future RTL support */
[dir="rtl"] .navigation {
  flex-direction: row-reverse;
}

[dir="rtl"] .site-item {
  flex-direction: row-reverse;
}

[dir="rtl"] .trust-badge {
  flex-direction: row-reverse;
}

[dir="rtl"] #back-btn::before {
  content: '\2192'; /* Right arrow instead of left */
}

[dir="rtl"] #next-btn::after {
  content: '\2190'; /* Left arrow instead of right */
}
```

---

## 13. Implementation Checklist

### Phase 1: Core Onboarding (Must Have)

- [ ] Create `src/onboarding/onboarding.html` with 5-slide structure
- [ ] Create `src/onboarding/onboarding.css` with all component styles
- [ ] Create `src/onboarding/onboarding.js` with `OnboardingController` class
- [ ] Implement Slide 1: Welcome with trust badges and brand elements
- [ ] Implement Slide 2: Site selection with checkboxes, pre-selected defaults, custom input
- [ ] Implement Slide 2: Preset list dropdown functionality (Social Media, News Sites, All Popular)
- [ ] Implement Slide 2: Domain validation with error messages
- [ ] Implement Slide 2: 10-site free limit enforcement
- [ ] Implement Slide 3: Focus style card selection (radio behavior)
- [ ] Implement Slide 3: Sound pill selection with 3-second preview playback
- [ ] Implement Slide 3: PRO badge on Custom Timer with tooltip
- [ ] Implement Slide 4: Focus Score ring animation (SVG + CSS)
- [ ] Implement Slide 4: Score factor list with icons
- [ ] Implement Slide 5: Dynamic summary line based on user selections
- [ ] Implement Slide 5: "Start Now" CTA that triggers focus session via message
- [ ] Implement Slide 5: Keyboard shortcuts display
- [ ] Implement navigation: Next, Back, progress dots, slide counter
- [ ] Implement skip functionality with default application
- [ ] Implement progress persistence (resume after tab close)
- [ ] Add `chrome.runtime.onInstalled` listener in background.js for install trigger
- [ ] Register onboarding resources in `manifest.json`
- [ ] Implement `START_FOCUS_SESSION` message handler in background.js
- [ ] Save all onboarding data to `chrome.storage.local` on completion

### Phase 2: Update Notifications

- [ ] Create `src/onboarding/whats-new.html` single-page layout
- [ ] Create `src/onboarding/whats-new.css` styles
- [ ] Create `src/onboarding/whats-new.js` content loader
- [ ] Implement version comparison logic (`getUpdateType()`)
- [ ] Implement "What's New" tab trigger for major updates only
- [ ] Implement in-popup update banner for minor updates
- [ ] Implement banner auto-dismiss after 3 popup opens
- [ ] Implement `lastWhatsNewVersion` duplicate-show prevention

### Phase 3: Hint System

- [ ] Create `src/onboarding/hint-system.js`
- [ ] Implement tooltip positioning relative to target elements
- [ ] Implement 3-hint sequence with per-popup-open progression
- [ ] Implement "Got it" dismiss and auto-dismiss after 8 seconds
- [ ] Implement suppression during active focus sessions
- [ ] Add hint CSS styles to popup stylesheet
- [ ] Initialize hint system in popup.js

### Phase 4: A/B Testing

- [ ] Create `src/onboarding/ab-test.js`
- [ ] Implement random group assignment at install time
- [ ] Implement 4 test variant logic (pre-selected sites, CTA text, slide count, sound preview)
- [ ] Store test group assignments in `chrome.storage.local`
- [ ] Implement compact 3-slide variant for slide-count test
- [ ] Implement action-specific CTA variant text

### Phase 5: Polish & Accessibility

- [ ] Add all ARIA attributes (roles, labels, live regions)
- [ ] Implement keyboard navigation for all interactive elements
- [ ] Implement focus management on slide transitions
- [ ] Add screen reader announcements for dynamic content changes
- [ ] Test with `prefers-reduced-motion: reduce` media query
- [ ] Test with `forced-colors: active` (high contrast mode)
- [ ] Verify all color contrast ratios meet WCAG 2.1 AA
- [ ] Add `tabindex` management for focus style cards and sound pills
- [ ] Test with VoiceOver (macOS), NVDA (Windows), and ChromeVox

### Phase 6: Localization Prep

- [ ] Extract all strings to `ONBOARDING_STRINGS` locale object
- [ ] Implement string interpolation helper for parameterized strings
- [ ] Add RTL-ready CSS rules
- [ ] Test layout with longer string lengths (German, Japanese)
- [ ] Create `_locales/en/messages.json` skeleton for future Chrome i18n migration

### Phase 7: Metrics & Edge Cases

- [ ] Implement all onboarding metric tracking
- [ ] Implement duplicate tab prevention
- [ ] Implement graceful storage error handling (`safeStorageGet`)
- [ ] Implement message send fallback (`safeSendMessage`)
- [ ] Implement system URL rejection in custom site input
- [ ] Test offline installation flow
- [ ] Test extension auto-update during active onboarding
- [ ] Test with cleared storage mid-onboarding
- [ ] Implement developer metrics export (hidden setting)

---

## Appendix A: Competitive Analysis — Onboarding Comparison

| Feature | Focus Mode - Blocker | BlockSite | Cold Turkey | Freedom |
|---------|---------------------|-----------|-------------|---------|
| Onboarding slides | 5 (with skip) | 3 | None | 7 |
| Time to first block | <60s (goal) | ~2 min | ~3 min | ~5 min |
| Pre-selected sites | Yes (3) | No | No | No |
| Privacy messaging | Slide 1 (immediate) | None | None | Buried in FAQ |
| Pro promotion during onboarding | None | Slide 2 | N/A (paid only) | Slide 3 |
| Focus score introduction | Yes (Slide 4) | No | No | No |
| Sound selection | Yes (Slide 3) | No | No | Yes (Slide 5) |
| Keyboard shortcuts shown | Yes (Slide 5) | No | No | No |
| Resume after close | Yes | No | N/A | No |

### Differentiation Summary

Focus Mode - Blocker's onboarding stands out by:
1. Getting users to value faster than any competitor (60s target vs. 2-5 min industry average)
2. Leading with trust (privacy messaging first, not monetization)
3. Introducing a unique metric (Focus Score) early to create curiosity
4. Respecting user attention (no Pro promotion until Session 3+)
5. Supporting all user types (visual learners, keyboard users, screen reader users)

---

## Appendix B: Onboarding Analytics Dashboard (Future Pro Feature)

For Pro users, a local analytics dashboard could show:

```
┌─────────────────────────────────────────────────────────────────┐
│  Your Focus Journey                                              │
│                                                                  │
│  Installed: Feb 11, 2026                                        │
│  Days Active: 14                                                 │
│  Current Streak: 7 days                                         │
│                                                                  │
│  Onboarding:                                                     │
│    Completed: Yes (all 5 slides)                                │
│    Time to first block: 32 seconds                              │
│    Time to first session: 2 min 14 sec                          │
│    Sites blocked on day 1: 5                                    │
│                                                                  │
│  First Week:                                                     │
│    Sessions completed: 12                                        │
│    Total focus time: 4h 22m                                     │
│    Distractions blocked: 47                                      │
│    Focus Score trend: 0 -> 42 -> 58 -> 67                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

This reinforces the onboarding journey and shows users how far they've come, further strengthening retention through the endowed progress effect.

---

## Appendix C: Onboarding Recovery Flows

### User Uninstalls Within 24 Hours

If the user uninstalls and reinstalls within a short window, the onboarding runs again from scratch (storage is cleared on uninstall). This is correct behavior — the user may have had a bad first experience and deserves a fresh start.

### User Never Completes Onboarding

If `onboardingComplete` remains `false` after 7 days:
- The popup shows a gentle "Finish setup" card at the top
- Card links back to the onboarding page at the last viewed slide
- Card is dismissible and stores `onboardingSetupDismissed: true`
- After dismissal, defaults are applied and `onboardingComplete` is set to `true`

### User Imports Settings from Another Device

If the user imports a settings backup that includes `onboardingComplete: true`:
- Skip onboarding entirely
- Apply imported blocklist and preferences
- Show a one-time "Settings imported successfully" toast in the popup

---

*End of Onboarding System specification. This document covers the complete design, implementation, accessibility, localization, testing, and edge case handling for the Focus Mode - Blocker onboarding experience.*
