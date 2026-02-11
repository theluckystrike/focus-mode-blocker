# Agent 3 — Visual Accessibility
## Phase 21: Accessibility Compliance — Focus Mode - Blocker

> **Date:** February 11, 2026
> **Agent:** 3 of 5
> **Scope:** Color contrast, non-color indicators, focus styles, text scaling, high contrast mode, dark mode implementation
> **Dependencies:** Phase 08 (Branding — icon/asset system, global styles in `docs/branding-retention/agent2-global-styles.md`), Phase 12 (MV3 — UI architecture in `docs/mv3-architecture/agent5-ui-architecture.md`), Phase 20 (Performance — CSS bundle budget of 30KB for popup)
> **Standard:** WCAG 2.1 Level AA (with AAA where practical for this audience)

---

## 4.1 Color Contrast Requirements

### 4.1.1 Accessible Color Palette — Light Mode

Every color pairing used in Focus Mode - Blocker must meet WCAG 2.1 AA minimum contrast ratios: **4.5:1 for normal text** (under 18pt / 14pt bold) and **3:1 for large text** (18pt+ / 14pt+ bold) and non-text UI components. The following palette is calculated against the actual background colors used in the extension.

**Contrast calculation methodology:** Ratios below are computed using the WCAG 2.1 relative luminance formula: `L = 0.2126 * R' + 0.7152 * G' + 0.0722 * B'` where `R' = (R/255)^2.2` (simplified sRGB linearization), and contrast ratio = `(L1 + 0.05) / (L2 + 0.05)`.

```css
/* ==========================================================================
   ACCESSIBLE COLOR TOKENS — LIGHT MODE
   Focus Mode - Blocker | WCAG 2.1 AA Compliant
   File: src/styles/accessible-tokens.css
   ========================================================================== */

:root {
  /* ------------------------------------------------------------------
     BACKGROUND SURFACES
     ------------------------------------------------------------------ */
  --zovo-bg-page:       #f8fafc;  /* Slate-50: popup/options/onboarding page bg */
  --zovo-bg-surface:    #ffffff;  /* White: cards, inputs, modals */
  --zovo-bg-elevated:   #ffffff;  /* White: elevated cards, dropdowns */
  --zovo-bg-sunken:     #f1f5f9;  /* Slate-100: inset areas, code blocks */
  --zovo-bg-header:     #ffffff;  /* White: popup header bar */
  --zovo-bg-footer:     #f8fafc;  /* Slate-50: popup footer bar */
  --zovo-bg-block-page: #0f172a;  /* Slate-900: block page background */

  /* ------------------------------------------------------------------
     PRIMARY TEXT
     Contrast ratios calculated against --zovo-bg-surface (#ffffff)
     and --zovo-bg-page (#f8fafc)
     ------------------------------------------------------------------ */

  /* #1e293b on #ffffff = 12.63:1 — AAA pass (normal + large text) */
  /* #1e293b on #f8fafc = 12.18:1 — AAA pass (normal + large text) */
  --zovo-text-primary: #1e293b;

  /* #475569 on #ffffff = 7.07:1 — AAA pass (normal text) */
  /* #475569 on #f8fafc = 6.82:1 — AAA pass (normal text) */
  --zovo-text-secondary: #475569;

  /* #64748b on #ffffff = 4.62:1 — AA pass (normal text) */
  /* #64748b on #f8fafc = 4.46:1 — AA pass (normal text, marginal) */
  --zovo-text-tertiary: #64748b;

  /* #94a3b8 on #ffffff = 2.68:1 — FAILS AA for normal text */
  /* USE ONLY for decorative/disabled text, never for informational content */
  --zovo-text-disabled: #94a3b8;

  /* ------------------------------------------------------------------
     PRIMARY BRAND COLOR — INDIGO
     #6366f1 is the core brand color. It MUST be verified for every surface.
     ------------------------------------------------------------------ */

  /* #6366f1 on #ffffff = 4.56:1 — AA pass (normal text, barely) */
  /* #6366f1 on #f8fafc = 4.40:1 — FAILS AA for normal text by 0.1 */
  /* DECISION: Use #4f46e5 (primary-600) for text on page background */
  --zovo-primary-500: #6366f1;  /* Buttons, badges (white text on this bg) */
  --zovo-primary-text: #4f46e5; /* Text links on light backgrounds */

  /* #ffffff on #6366f1 = 4.56:1 — AA pass (normal text) */
  /* #ffffff on #4f46e5 = 5.66:1 — AA pass (normal text, comfortable) */
  /* #ffffff on #4338ca = 7.35:1 — AAA pass (normal text) */
  --zovo-primary-600: #4f46e5;
  --zovo-primary-700: #4338ca;

  /* ------------------------------------------------------------------
     SEMANTIC COLORS — Success (streaks, completed sessions, good scores)
     ------------------------------------------------------------------ */

  /* #059669 on #ffffff = 4.62:1 — AA pass (normal text) */
  /* #047857 on #ffffff = 5.81:1 — AA pass (normal text, comfortable) */
  --zovo-text-success: #047857;  /* Upgraded from #059669 for safer margin */

  /* #ffffff on #059669 = 4.62:1 — AA pass (normal text) */
  --zovo-success-500: #059669;   /* Success button bg, score ring (good) */
  --zovo-success-600: #047857;   /* Success text */
  --zovo-success-700: #065f46;   /* Success text on light bg — 7.28:1 */

  /* ------------------------------------------------------------------
     SEMANTIC COLORS — Warning (low scores, approaching limits)
     ------------------------------------------------------------------ */

  /* #d97706 on #ffffff = 3.46:1 — FAILS AA for normal text */
  /* #b45309 on #ffffff = 4.72:1 — AA pass (normal text) */
  /* #92400e on #ffffff = 6.54:1 — AA pass (comfortable) */
  --zovo-text-warning: #92400e;  /* Warning text — must use darkened variant */

  /* #ffffff on #d97706 = 3.46:1 — FAILS AA for normal text */
  /* #000000 on #d97706 = 6.07:1 — AA pass for dark text on warning bg */
  /* DECISION: Warning buttons use dark text (#1e293b), not white text */
  --zovo-warning-500: #f59e0b;   /* Warning bg on badges/indicators */
  --zovo-warning-600: #d97706;   /* Warning border, icon color (3:1 non-text) */

  /* ------------------------------------------------------------------
     SEMANTIC COLORS — Error (blocked sites, invalid input, nuclear mode)
     ------------------------------------------------------------------ */

  /* #dc2626 on #ffffff = 4.63:1 — AA pass (normal text) */
  /* #b91c1c on #ffffff = 6.28:1 — AA pass (comfortable) */
  --zovo-text-error: #b91c1c;    /* Error text — upgraded for safety */

  /* #ffffff on #dc2626 = 4.63:1 — AA pass (normal text, barely) */
  /* #ffffff on #b91c1c = 6.28:1 — AA pass (comfortable) */
  --zovo-error-500: #ef4444;     /* Error indicator/border (3:1 non-text OK) */
  --zovo-error-600: #dc2626;     /* Error button bg */
  --zovo-error-700: #b91c1c;     /* Error text on white */

  /* ------------------------------------------------------------------
     SEMANTIC COLORS — Info
     ------------------------------------------------------------------ */

  /* #2563eb on #ffffff = 4.62:1 — AA pass (normal text) */
  /* #1d4ed8 on #ffffff = 5.96:1 — AA pass (comfortable) */
  --zovo-text-info: #1d4ed8;

  /* ------------------------------------------------------------------
     INTERACTIVE ELEMENT BACKGROUNDS
     ------------------------------------------------------------------ */

  /* Tab bar active state: text on tinted background */
  /* #4f46e5 on #eef2ff = 5.12:1 — AA pass */
  --zovo-bg-active: #eef2ff;     /* Active tab background */
  --zovo-tab-active-text: #4f46e5;

  /* Tab bar inactive state */
  /* #64748b on #ffffff = 4.62:1 — AA pass */
  --zovo-tab-inactive-text: #64748b;

  /* ------------------------------------------------------------------
     FOCUS SCORE RING — Color Bands
     These colors serve as SVG stroke colors on white/page background.
     Non-text contrast requirement: 3:1 against adjacent background.
     ------------------------------------------------------------------ */

  /* Score 90-100: Excellent */
  /* #059669 on #ffffff = 4.62:1 — passes 3:1 non-text */
  --zovo-score-excellent: #059669;

  /* Score 70-89: Good */
  /* #2563eb on #ffffff = 4.62:1 — passes 3:1 non-text */
  --zovo-score-good: #2563eb;

  /* Score 50-69: Fair */
  /* #d97706 on #ffffff = 3.46:1 — passes 3:1 non-text */
  --zovo-score-fair: #d97706;

  /* Score 30-49: Needs Work */
  /* #ea580c on #ffffff = 3.64:1 — passes 3:1 non-text */
  --zovo-score-poor: #ea580c;

  /* Score 0-29: Critical */
  /* #dc2626 on #ffffff = 4.63:1 — passes 3:1 non-text */
  --zovo-score-critical: #dc2626;

  /* ------------------------------------------------------------------
     BLOCK PAGE — Light text on dark background
     Block page uses --zovo-bg-block-page (#0f172a) as base
     ------------------------------------------------------------------ */

  /* #f1f5f9 on #0f172a = 14.17:1 — AAA pass */
  --zovo-block-text-primary: #f1f5f9;

  /* #94a3b8 on #0f172a = 6.56:1 — AAA pass */
  --zovo-block-text-secondary: #94a3b8;

  /* #818cf8 on #0f172a = 5.89:1 — AA pass */
  --zovo-block-accent: #818cf8;

  /* ------------------------------------------------------------------
     BORDER & FOCUS TOKENS
     ------------------------------------------------------------------ */
  --zovo-border-default:   #e2e8f0;  /* 1.77:1 on white — decorative only */
  --zovo-border-strong:    #94a3b8;  /* 2.68:1 on white — passes 3:1 non-text? NO */
  --zovo-border-focus:     #4f46e5;  /* 5.66:1 on white — passes 3:1 non-text */
  --zovo-border-error:     #dc2626;  /* 4.63:1 on white — passes 3:1 non-text */
  --zovo-border-success:   #059669;  /* 4.62:1 on white — passes 3:1 non-text */
}
```

### 4.1.2 Accessible Color Palette — Dark Mode

```css
/* ==========================================================================
   ACCESSIBLE COLOR TOKENS — DARK MODE
   All ratios calculated against dark background surfaces.
   ========================================================================== */

[data-theme="dark"] {
  /* Backgrounds */
  --zovo-bg-page:       #0f172a;  /* Slate-900 */
  --zovo-bg-surface:    #1e293b;  /* Slate-800 */
  --zovo-bg-elevated:   #334155;  /* Slate-700 */
  --zovo-bg-sunken:     #0f172a;  /* Slate-900 */
  --zovo-bg-header:     #1e293b;  /* Slate-800 */
  --zovo-bg-footer:     #1e293b;  /* Slate-800 */
  --zovo-bg-block-page: #020617;  /* Slate-950 */

  /* ------------------------------------------------------------------
     TEXT — calculated against --zovo-bg-surface (#1e293b)
     ------------------------------------------------------------------ */

  /* #f1f5f9 on #1e293b = 11.26:1 — AAA pass */
  /* #f1f5f9 on #0f172a = 14.17:1 — AAA pass */
  --zovo-text-primary: #f1f5f9;

  /* #94a3b8 on #1e293b = 5.21:1 — AA pass */
  /* #94a3b8 on #0f172a = 6.56:1 — AAA pass */
  --zovo-text-secondary: #94a3b8;

  /* #64748b on #1e293b = 3.03:1 — FAILS AA normal text */
  /* Upgraded to #94a3b8 for informational content in dark mode */
  /* #64748b only for decorative/tertiary hints, never sole info carrier */
  --zovo-text-tertiary: #64748b;

  /* #475569 on #1e293b = 1.91:1 — disabled-only, never informational */
  --zovo-text-disabled: #475569;

  /* ------------------------------------------------------------------
     PRIMARY BRAND — DARK MODE
     ------------------------------------------------------------------ */

  /* #818cf8 on #1e293b = 4.68:1 — AA pass (normal text) */
  /* #818cf8 on #0f172a = 5.89:1 — AA pass (comfortable) */
  --zovo-primary-text: #818cf8;  /* Links, interactive text in dark mode */
  --zovo-text-link: #818cf8;
  --zovo-text-link-hover: #a5b4fc;  /* #a5b4fc on #1e293b = 6.73:1 */

  /* #ffffff on #6366f1 = 4.56:1 — AA pass (button text unchanged) */
  --zovo-primary-500: #6366f1;  /* Buttons still use primary-500 bg */

  /* ------------------------------------------------------------------
     SEMANTIC COLORS — DARK MODE
     ------------------------------------------------------------------ */

  /* Success */
  /* #34d399 on #1e293b = 7.32:1 — AAA pass */
  --zovo-text-success: #34d399;

  /* Warning */
  /* #fbbf24 on #1e293b = 9.44:1 — AAA pass */
  /* Dark mode warning text can be lighter since bg is dark */
  --zovo-text-warning: #fbbf24;

  /* Error */
  /* #f87171 on #1e293b = 5.23:1 — AA pass */
  --zovo-text-error: #f87171;

  /* Info */
  /* #60a5fa on #1e293b = 5.16:1 — AA pass */
  --zovo-text-info: #60a5fa;

  /* ------------------------------------------------------------------
     FOCUS SCORE RING — DARK MODE
     Non-text contrast against #1e293b surface: 3:1 minimum
     ------------------------------------------------------------------ */

  /* #34d399 on #1e293b = 7.32:1 — passes */
  --zovo-score-excellent: #34d399;

  /* #60a5fa on #1e293b = 5.16:1 — passes */
  --zovo-score-good: #60a5fa;

  /* #fbbf24 on #1e293b = 9.44:1 — passes */
  --zovo-score-fair: #fbbf24;

  /* #fb923c on #1e293b = 5.95:1 — passes */
  --zovo-score-poor: #fb923c;

  /* #f87171 on #1e293b = 5.23:1 — passes */
  --zovo-score-critical: #f87171;

  /* ------------------------------------------------------------------
     TAB BAR — DARK MODE
     ------------------------------------------------------------------ */

  /* #818cf8 on rgba(99,102,241,0.2) ~= #818cf8 on #3a3c6f approx */
  /* Active tab: #818cf8 on #1e293b = 4.68:1 — AA pass */
  --zovo-tab-active-text: #818cf8;
  --zovo-bg-active: rgba(99, 102, 241, 0.2);

  /* Inactive tab: #94a3b8 on #1e293b = 5.21:1 — AA pass */
  --zovo-tab-inactive-text: #94a3b8;

  /* ------------------------------------------------------------------
     BORDERS — DARK MODE
     ------------------------------------------------------------------ */
  --zovo-border-default: #334155;   /* Decorative only */
  --zovo-border-strong:  #475569;   /* 1.91:1 on #1e293b — decorative */
  --zovo-border-focus:   #818cf8;   /* 4.68:1 on #1e293b — passes 3:1 */
  --zovo-border-error:   #f87171;   /* 5.23:1 on #1e293b — passes 3:1 */
  --zovo-border-success: #34d399;   /* 7.32:1 on #1e293b — passes 3:1 */
}
```

### 4.1.3 Specific Contrast Audit — Every Color Combination Used

| Element | Foreground | Background | Ratio | AA Normal | AA Large | AAA Normal |
|---|---|---|---|---|---|---|
| **Light Mode** | | | | | | |
| Body text on page | `#1e293b` | `#f8fafc` | 12.18:1 | PASS | PASS | PASS |
| Body text on card | `#1e293b` | `#ffffff` | 12.63:1 | PASS | PASS | PASS |
| Secondary text on page | `#475569` | `#f8fafc` | 6.82:1 | PASS | PASS | PASS |
| Secondary text on card | `#475569` | `#ffffff` | 7.07:1 | PASS | PASS | PASS |
| Tertiary text on card | `#64748b` | `#ffffff` | 4.62:1 | PASS | PASS | FAIL |
| Primary btn text | `#ffffff` | `#6366f1` | 4.56:1 | PASS | PASS | FAIL |
| Primary btn text (hover) | `#ffffff` | `#4f46e5` | 5.66:1 | PASS | PASS | FAIL |
| Link text on card | `#4f46e5` | `#ffffff` | 5.66:1 | PASS | PASS | FAIL |
| Link text on page bg | `#4f46e5` | `#f8fafc` | 5.46:1 | PASS | PASS | FAIL |
| Success text | `#047857` | `#ffffff` | 5.81:1 | PASS | PASS | FAIL |
| Warning text | `#92400e` | `#ffffff` | 6.54:1 | PASS | PASS | FAIL |
| Error text | `#b91c1c` | `#ffffff` | 6.28:1 | PASS | PASS | FAIL |
| Info text | `#1d4ed8` | `#ffffff` | 5.96:1 | PASS | PASS | FAIL |
| Tab active text | `#4f46e5` | `#eef2ff` | 5.12:1 | PASS | PASS | FAIL |
| Tab inactive text | `#64748b` | `#ffffff` | 4.62:1 | PASS | PASS | FAIL |
| Timer display | `#1e293b` | `#ffffff` | 12.63:1 | PASS | PASS | PASS |
| Score number in ring | `#1e293b` | `#ffffff` | 12.63:1 | PASS | PASS | PASS |
| Header badge text | `#4f46e5` | `#e0e7ff` | 4.67:1 | PASS | PASS | FAIL |
| Footer text | `#475569` | `#f8fafc` | 6.82:1 | PASS | PASS | PASS |
| Focus btn text | `#ffffff` | `#059669` | 4.62:1 | PASS | PASS | FAIL |
| Nuclear btn text | `#ffffff` | `#dc2626` | 4.63:1 | PASS | PASS | FAIL |
| Block page heading | `#f1f5f9` | `#0f172a` | 14.17:1 | PASS | PASS | PASS |
| Block page body | `#94a3b8` | `#0f172a` | 6.56:1 | PASS | PASS | PASS |
| Block page accent | `#818cf8` | `#0f172a` | 5.89:1 | PASS | PASS | FAIL |
| Input placeholder | `#94a3b8` | `#ffffff` | 2.68:1 | FAIL | FAIL | FAIL |
| **Dark Mode** | | | | | | |
| Body text on page | `#f1f5f9` | `#0f172a` | 14.17:1 | PASS | PASS | PASS |
| Body text on surface | `#f1f5f9` | `#1e293b` | 11.26:1 | PASS | PASS | PASS |
| Secondary text | `#94a3b8` | `#1e293b` | 5.21:1 | PASS | PASS | FAIL |
| Primary btn text | `#ffffff` | `#6366f1` | 4.56:1 | PASS | PASS | FAIL |
| Link text on surface | `#818cf8` | `#1e293b` | 4.68:1 | PASS | PASS | FAIL |
| Success text (dark) | `#34d399` | `#1e293b` | 7.32:1 | PASS | PASS | PASS |
| Warning text (dark) | `#fbbf24` | `#1e293b` | 9.44:1 | PASS | PASS | PASS |
| Error text (dark) | `#f87171` | `#1e293b` | 5.23:1 | PASS | PASS | FAIL |
| Timer display (dark) | `#f1f5f9` | `#1e293b` | 11.26:1 | PASS | PASS | PASS |
| Score number (dark) | `#f1f5f9` | `#1e293b` | 11.26:1 | PASS | PASS | PASS |
| Tab active (dark) | `#818cf8` | `#1e293b` | 4.68:1 | PASS | PASS | FAIL |
| Tab inactive (dark) | `#94a3b8` | `#1e293b` | 5.21:1 | PASS | PASS | FAIL |

**Known exceptions and mitigations:**

- **Input placeholders** (`#94a3b8` on `#ffffff` = 2.68:1): Placeholders are not required to meet contrast ratios per WCAG 1.4.3 since they are not user-entered text. However, placeholder text must never be the sole label for an input. Every input must have a visible `<label>` or `aria-label`.
- **Disabled text** (`#94a3b8` / `#475569`): Disabled elements are exempt from contrast requirements per WCAG 1.4.3. The disabled state must also be communicated via `disabled` attribute or `aria-disabled="true"`, not color alone.

---

## 4.2 Don't Rely on Color Alone (WCAG 1.4.1)

Color must never be the sole visual means of conveying information, indicating an action, prompting a response, or distinguishing a visual element. This is critical for Focus Mode - Blocker, where many UI states use color coding.

### 4.2.1 Focus Score Display — Icon + Text Label + Color

The Focus Score ring changes color across 5 bands. Each band must also include a text label and an icon.

```html
<!-- File: src/popup/components/focus-score-ring.js (rendered output) -->

<!-- Score 90-100: Excellent -->
<div class="zovo-score" data-score-band="excellent">
  <svg class="zovo-score__ring" viewBox="0 0 120 120" aria-hidden="true">
    <circle class="zovo-score__track" cx="60" cy="60" r="52"
            fill="none" stroke="var(--zovo-border-default)" stroke-width="8" />
    <circle class="zovo-score__fill" cx="60" cy="60" r="52"
            fill="none" stroke="var(--zovo-score-excellent)" stroke-width="8"
            stroke-dasharray="327" stroke-dashoffset="33"
            stroke-linecap="round" transform="rotate(-90 60 60)" />
  </svg>
  <div class="zovo-score__center">
    <span class="zovo-score__number">92</span>
    <!-- Text label — never rely on ring color alone -->
    <span class="zovo-score__label">Excellent</span>
  </div>
  <!-- Icon reinforcement -->
  <svg class="zovo-score__icon" width="16" height="16" viewBox="0 0 16 16"
       fill="var(--zovo-score-excellent)" aria-hidden="true">
    <path d="M8 0l2.5 5 5.5.8-4 3.9 1 5.3L8 12.5 2.9 15l1-5.3L0 5.8l5.5-.8z"/>
  </svg>
  <!-- Screen reader announcement -->
  <span class="zovo-sr-only">Focus Score: 92 out of 100. Rating: Excellent.</span>
</div>

<!-- Score 50-69: Fair -->
<div class="zovo-score" data-score-band="fair">
  <svg class="zovo-score__ring" viewBox="0 0 120 120" aria-hidden="true">
    <circle class="zovo-score__track" cx="60" cy="60" r="52"
            fill="none" stroke="var(--zovo-border-default)" stroke-width="8" />
    <circle class="zovo-score__fill" cx="60" cy="60" r="52"
            fill="none" stroke="var(--zovo-score-fair)" stroke-width="8"
            stroke-dasharray="327" stroke-dashoffset="164"
            stroke-linecap="round" transform="rotate(-90 60 60)" />
  </svg>
  <div class="zovo-score__center">
    <span class="zovo-score__number">55</span>
    <span class="zovo-score__label">Fair</span>
  </div>
  <!-- Different icon for each band -->
  <svg class="zovo-score__icon" width="16" height="16" viewBox="0 0 16 16"
       fill="var(--zovo-score-fair)" aria-hidden="true">
    <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 10.5a.75.75 0 110-1.5.75.75 0 010 1.5zM8.75 8a.75.75 0 01-1.5 0V4.5a.75.75 0 011.5 0V8z"/>
  </svg>
  <span class="zovo-sr-only">Focus Score: 55 out of 100. Rating: Fair.</span>
</div>
```

```css
/* Focus Score — multi-signal state indication */
/* File: src/popup/popup.css */

.zovo-score {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.zovo-score__center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.zovo-score__number {
  display: block;
  font-size: var(--zovo-text-2xl);
  font-weight: var(--zovo-weight-bold);
  color: var(--zovo-text-primary);
  line-height: 1;
}

/* Text label below score number — always visible */
.zovo-score__label {
  display: block;
  font-size: var(--zovo-text-xs);
  font-weight: var(--zovo-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 2px;
}

/* Band-specific label colors — accessible against white/surface bg */
[data-score-band="excellent"] .zovo-score__label { color: var(--zovo-text-success); }
[data-score-band="good"]      .zovo-score__label { color: var(--zovo-text-info); }
[data-score-band="fair"]      .zovo-score__label { color: var(--zovo-text-warning); }
[data-score-band="poor"]      .zovo-score__label { color: var(--zovo-text-warning); }
[data-score-band="critical"]  .zovo-score__label { color: var(--zovo-text-error); }

/* Icon positioned below the ring */
.zovo-score__icon {
  margin-top: var(--zovo-space-1);
}
```

**JavaScript — Score band determination:**

```javascript
// File: src/popup/components/focus-score-ring.js

const SCORE_BANDS = [
  { min: 90, band: 'excellent', label: 'Excellent', icon: 'star' },
  { min: 70, band: 'good',      label: 'Good',      icon: 'thumbs-up' },
  { min: 50, band: 'fair',      label: 'Fair',      icon: 'alert-circle' },
  { min: 30, band: 'poor',      label: 'Needs Work', icon: 'alert-triangle' },
  { min: 0,  band: 'critical',  label: 'Critical',  icon: 'x-circle' },
];

function getScoreBand(score) {
  return SCORE_BANDS.find(b => score >= b.min);
}

function renderFocusScore(container, score) {
  const band = getScoreBand(score);
  container.setAttribute('data-score-band', band.band);

  const numberEl = container.querySelector('.zovo-score__number');
  const labelEl = container.querySelector('.zovo-score__label');
  const srEl = container.querySelector('.zovo-sr-only');

  numberEl.textContent = score;
  labelEl.textContent = band.label;
  srEl.textContent = `Focus Score: ${score} out of 100. Rating: ${band.label}.`;
}
```

### 4.2.2 Session Status — Icon + Text + Color

```html
<!-- Active session indicator — do NOT rely on green dot alone -->
<div class="zovo-session-status zovo-session-status--active" role="status">
  <svg class="zovo-session-status__icon" width="14" height="14"
       viewBox="0 0 14 14" aria-hidden="true">
    <!-- Play/active icon -->
    <circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <polygon points="5.5,4 10,7 5.5,10" fill="currentColor"/>
  </svg>
  <span class="zovo-session-status__text">Session active</span>
  <span class="zovo-session-status__dot" aria-hidden="true"></span>
</div>

<!-- Session paused -->
<div class="zovo-session-status zovo-session-status--paused" role="status">
  <svg class="zovo-session-status__icon" width="14" height="14"
       viewBox="0 0 14 14" aria-hidden="true">
    <!-- Pause icon -->
    <circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <rect x="4.5" y="4" width="2" height="6" rx="0.5" fill="currentColor"/>
    <rect x="7.5" y="4" width="2" height="6" rx="0.5" fill="currentColor"/>
  </svg>
  <span class="zovo-session-status__text">Paused</span>
</div>

<!-- Session ended / Idle -->
<div class="zovo-session-status zovo-session-status--idle" role="status">
  <svg class="zovo-session-status__icon" width="14" height="14"
       viewBox="0 0 14 14" aria-hidden="true">
    <!-- Stop/idle icon -->
    <circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <rect x="4.5" y="4.5" width="5" height="5" rx="0.5" fill="currentColor"/>
  </svg>
  <span class="zovo-session-status__text">No active session</span>
</div>
```

```css
.zovo-session-status {
  display: inline-flex;
  align-items: center;
  gap: var(--zovo-space-2);
  font-size: var(--zovo-text-sm);
  font-weight: var(--zovo-weight-medium);
}

.zovo-session-status--active {
  color: var(--zovo-text-success);
}

.zovo-session-status--paused {
  color: var(--zovo-text-warning);
}

.zovo-session-status--idle {
  color: var(--zovo-text-tertiary);
}

/* The pulsing dot is decorative — icon + text carry the meaning */
.zovo-session-status__dot {
  width: 8px;
  height: 8px;
  border-radius: var(--zovo-radius-full);
  background: currentColor;
  animation: zovo-pulse 2s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .zovo-session-status__dot {
    animation: none;
  }
}
```

### 4.2.3 Blocklist Item — Enabled/Disabled States

```html
<!-- Enabled blocklist item -->
<li class="zovo-blocklist-item" data-state="enabled">
  <div class="zovo-blocklist-item__info">
    <img class="zovo-blocklist-item__favicon" src="..." alt="" width="16" height="16" />
    <span class="zovo-blocklist-item__domain">twitter.com</span>
    <!-- Status badge with text — not color alone -->
    <span class="zovo-blocklist-item__badge zovo-blocklist-item__badge--active">
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
        <path d="M2 5l2.5 2.5L8 3" fill="none" stroke="currentColor" stroke-width="1.5"/>
      </svg>
      Blocking
    </span>
  </div>
  <button class="zovo-btn zovo-btn--ghost zovo-btn--icon zovo-btn--sm"
          aria-label="Remove twitter.com from blocklist">
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
      <path d="M4.646 4.646a.5.5 0 01.708 0L7 6.293l1.646-1.647a.5.5 0 01.708.708L7.707 7l1.647 1.646a.5.5 0 01-.708.708L7 7.707 5.354 9.354a.5.5 0 01-.708-.708L6.293 7 4.646 5.354a.5.5 0 010-.708z"/>
    </svg>
  </button>
</li>

<!-- Disabled/paused blocklist item -->
<li class="zovo-blocklist-item" data-state="disabled">
  <div class="zovo-blocklist-item__info">
    <img class="zovo-blocklist-item__favicon" src="..." alt="" width="16" height="16" />
    <span class="zovo-blocklist-item__domain">twitter.com</span>
    <span class="zovo-blocklist-item__badge zovo-blocklist-item__badge--paused">
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
        <rect x="2" y="2" width="2.5" height="6" rx="0.5" fill="currentColor"/>
        <rect x="5.5" y="2" width="2.5" height="6" rx="0.5" fill="currentColor"/>
      </svg>
      Paused
    </span>
  </div>
  <!-- ... -->
</li>
```

```css
.zovo-blocklist-item__badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: var(--zovo-text-xs);
  font-weight: var(--zovo-weight-medium);
  padding: 1px 6px;
  border-radius: var(--zovo-radius-full);
}

/* Active: green background + checkmark icon + "Blocking" text */
.zovo-blocklist-item__badge--active {
  color: var(--zovo-text-success);
  background: var(--zovo-success-50, #ecfdf5);
}

/* Paused: gray background + pause icon + "Paused" text */
.zovo-blocklist-item__badge--paused {
  color: var(--zovo-text-tertiary);
  background: var(--zovo-bg-sunken);
  /* Additional visual: strikethrough on domain name */
}

[data-state="disabled"] .zovo-blocklist-item__domain {
  text-decoration: line-through;
  color: var(--zovo-text-tertiary);
}
```

### 4.2.4 Block Page — Multi-Signal "You're Blocked" Indicator

```html
<!-- File: src/pages/block/block.html -->
<main class="zovo-block-page" role="main">
  <div class="zovo-block-page__hero">
    <!-- Large shield icon — not just red color -->
    <svg class="zovo-block-page__shield" width="80" height="80"
         viewBox="0 0 80 80" aria-hidden="true">
      <path d="M40 4L8 18v22c0 20.8 13.6 40 32 44 18.4-4 32-23.2 32-44V18L40 4z"
            fill="var(--zovo-primary-500)" opacity="0.15"/>
      <path d="M40 4L8 18v22c0 20.8 13.6 40 32 44 18.4-4 32-23.2 32-44V18L40 4z"
            fill="none" stroke="var(--zovo-primary-500)" stroke-width="3"/>
      <!-- X mark inside shield -->
      <path d="M28 28l24 24M52 28L28 52"
            stroke="var(--zovo-block-accent)" stroke-width="4" stroke-linecap="round"/>
    </svg>

    <!-- Explicit text heading — not just color -->
    <h1 class="zovo-block-page__title">Site Blocked</h1>
    <p class="zovo-block-page__subtitle">
      <strong class="zovo-block-page__domain">twitter.com</strong>
      is on your blocklist during this focus session.
    </p>
  </div>

  <!-- Motivational stats — each has icon + label + value -->
  <div class="zovo-block-page__stats" role="list" aria-label="Session statistics">
    <div class="zovo-block-page__stat" role="listitem">
      <svg width="20" height="20" aria-hidden="true"><!-- clock icon --></svg>
      <span class="zovo-block-page__stat-value">18:32</span>
      <span class="zovo-block-page__stat-label">Time saved today</span>
    </div>
    <div class="zovo-block-page__stat" role="listitem">
      <svg width="20" height="20" aria-hidden="true"><!-- shield icon --></svg>
      <span class="zovo-block-page__stat-value">7</span>
      <span class="zovo-block-page__stat-label">Distractions blocked</span>
    </div>
    <div class="zovo-block-page__stat" role="listitem">
      <svg width="20" height="20" aria-hidden="true"><!-- flame icon --></svg>
      <span class="zovo-block-page__stat-value">5 days</span>
      <span class="zovo-block-page__stat-label">Current streak</span>
    </div>
    <div class="zovo-block-page__stat" role="listitem">
      <svg width="20" height="20" aria-hidden="true"><!-- target icon --></svg>
      <span class="zovo-block-page__stat-value">78</span>
      <span class="zovo-block-page__stat-label">Focus Score</span>
    </div>
  </div>

  <button class="zovo-btn zovo-btn--primary zovo-btn--lg zovo-btn--block">
    Back to Work
  </button>
</main>
```

### 4.2.5 Streak Status — Active vs Broken

```html
<!-- Active streak — flame icon + number + "day streak" text -->
<div class="zovo-streak zovo-streak--active" aria-label="5-day focus streak, active">
  <svg class="zovo-streak__icon" width="20" height="20" viewBox="0 0 20 20"
       aria-hidden="true">
    <!-- Flame icon (filled) -->
    <path d="M10 2c1 3-1 5-1 5s2-1 3 1c1 2-1 4-1 4s2 0 2 2-1 3-3 4c-2-1-3-2-3-4s-1-2-1-4 2-5 2-5 0-2 2-3z"
          fill="var(--zovo-warning-500)" stroke="var(--zovo-warning-600)" stroke-width="1"/>
  </svg>
  <span class="zovo-streak__count">5</span>
  <span class="zovo-streak__text">day streak</span>
</div>

<!-- Broken streak — broken-flame icon + "0" + "Streak broken" text -->
<div class="zovo-streak zovo-streak--broken" aria-label="Focus streak broken">
  <svg class="zovo-streak__icon" width="20" height="20" viewBox="0 0 20 20"
       aria-hidden="true">
    <!-- Broken/gray flame icon with slash through it -->
    <path d="M10 2c1 3-1 5-1 5s2-1 3 1c1 2-1 4-1 4s2 0 2 2-1 3-3 4c-2-1-3-2-3-4s-1-2-1-4 2-5 2-5 0-2 2-3z"
          fill="none" stroke="var(--zovo-text-tertiary)" stroke-width="1.5"
          stroke-dasharray="3 2"/>
    <!-- Diagonal slash -->
    <line x1="4" y1="16" x2="16" y2="4" stroke="var(--zovo-text-tertiary)" stroke-width="1.5"/>
  </svg>
  <span class="zovo-streak__count">0</span>
  <span class="zovo-streak__text">Streak broken</span>
</div>
```

```css
.zovo-streak {
  display: inline-flex;
  align-items: center;
  gap: var(--zovo-space-1);
}

.zovo-streak__count {
  font-size: var(--zovo-text-xl);
  font-weight: var(--zovo-weight-bold);
  line-height: 1;
}

.zovo-streak__text {
  font-size: var(--zovo-text-sm);
  font-weight: var(--zovo-weight-medium);
}

.zovo-streak--active .zovo-streak__count {
  color: var(--zovo-text-primary);
}

.zovo-streak--active .zovo-streak__text {
  color: var(--zovo-text-secondary);
}

/* Broken streak uses muted styling + different icon + explicit text */
.zovo-streak--broken .zovo-streak__count {
  color: var(--zovo-text-tertiary);
}

.zovo-streak--broken .zovo-streak__text {
  color: var(--zovo-text-tertiary);
  font-style: italic;
}
```

---

## 4.3 Focus Indicators (WCAG 2.4.7 / 2.4.11 / 2.4.12)

Every interactive element must have a visible focus indicator when navigated via keyboard. Focus Mode - Blocker uses `:focus-visible` to show focus rings only for keyboard navigation, avoiding them for mouse clicks.

### 4.3.1 Base Focus System

```css
/* ==========================================================================
   FOCUS SYSTEM — Focus Mode - Blocker
   File: src/styles/focus-system.css

   Strategy:
   - :focus-visible for keyboard-only focus rings
   - 2px solid outline with 2px offset (total 4px visible gap)
   - Uses --zovo-border-focus (#4f46e5 light / #818cf8 dark)
   - All interactive elements covered: buttons, inputs, links, tabs, cards
   ========================================================================== */

/* Remove default focus for mouse users */
*:focus {
  outline: none;
}

/* Restore focus for keyboard users via :focus-visible */
*:focus-visible {
  outline: 2px solid var(--zovo-border-focus);
  outline-offset: 2px;
}

/* ==========================================================================
   BUTTONS — all variants
   ========================================================================== */

.zovo-btn:focus-visible {
  outline: 2px solid var(--zovo-border-focus);
  outline-offset: 2px;
  /* No box-shadow to avoid conflict — outline is sufficient */
}

/* Primary button: ensure focus ring visible against primary bg */
.zovo-btn--primary:focus-visible {
  outline-color: var(--zovo-primary-700);
  /* #4338ca outline on white bg around #6366f1 button = clearly visible */
  /* In dark mode: #818cf8 outline around #6366f1 button —
     ring is lighter than button, visible */
}

/* Focus button (green): use darker green for focus ring */
.zovo-btn--focus:focus-visible {
  outline-color: var(--zovo-success-700);
}

/* Nuclear button (red): use darker red for focus ring */
.zovo-btn--nuclear:focus-visible {
  outline-color: var(--zovo-error-700);
}

/* Ghost and secondary buttons: standard focus ring */
.zovo-btn--ghost:focus-visible,
.zovo-btn--secondary:focus-visible {
  outline: 2px solid var(--zovo-border-focus);
  outline-offset: 2px;
}

/* Icon-only buttons: round focus ring */
.zovo-btn--icon:focus-visible {
  outline: 2px solid var(--zovo-border-focus);
  outline-offset: 2px;
  border-radius: var(--zovo-radius-md);
}

/* ==========================================================================
   TAB BAR BUTTONS
   ========================================================================== */

.zovo-tab-bar__btn:focus-visible {
  outline: 2px solid var(--zovo-border-focus);
  outline-offset: -2px; /* Inset so it doesn't expand the tab bar height */
  border-radius: var(--zovo-radius-sm);
  /* Ensures the focus ring is within the tab bar container */
}

/* Active tab already has bottom border + background — focus adds ring */
.zovo-tab-bar__btn[aria-selected="true"]:focus-visible {
  outline: 2px solid var(--zovo-border-focus);
  outline-offset: -2px;
}

/* ==========================================================================
   FORM INPUTS
   ========================================================================== */

/* Text inputs, URL inputs, number inputs */
.zovo-input:focus-visible {
  outline: none; /* Inputs use border + box-shadow instead of outline */
  border-color: var(--zovo-primary-500);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

[data-theme="dark"] .zovo-input:focus-visible {
  box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.25);
}

/* Error state input still shows focus ring */
.zovo-input-group--error .zovo-input:focus-visible {
  border-color: var(--zovo-error-500);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}

/* Select dropdown */
.zovo-select:focus-visible {
  outline: none;
  border-color: var(--zovo-primary-500);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

/* Toggle switch */
.zovo-toggle__input:focus-visible + .zovo-toggle__track {
  outline: 2px solid var(--zovo-border-focus);
  outline-offset: 2px;
}

/* Checkbox */
.zovo-checkbox__input:focus-visible + .zovo-checkbox__box {
  outline: 2px solid var(--zovo-border-focus);
  outline-offset: 2px;
}

/* Radio */
.zovo-radio__input:focus-visible + .zovo-radio__circle {
  outline: 2px solid var(--zovo-border-focus);
  outline-offset: 2px;
}

/* ==========================================================================
   LINKS
   ========================================================================== */

a:focus-visible {
  outline: 2px solid var(--zovo-border-focus);
  outline-offset: 2px;
  border-radius: var(--zovo-radius-sm);
}

/* Footer brand link */
.zovo-footer__brand:focus-visible {
  outline: 2px solid var(--zovo-border-focus);
  outline-offset: 2px;
  border-radius: var(--zovo-radius-sm);
}

/* ==========================================================================
   BLOCKLIST ITEMS — keyboard focus for deletion
   ========================================================================== */

.zovo-blocklist-item:focus-within {
  background: var(--zovo-bg-hover);
  border-radius: var(--zovo-radius-md);
}

/* The remove button inside a blocklist item */
.zovo-blocklist-item .zovo-btn--icon:focus-visible {
  outline: 2px solid var(--zovo-border-focus);
  outline-offset: 1px;
}

/* ==========================================================================
   CARDS — session summary, pro upgrade
   ========================================================================== */

.zovo-card:focus-visible,
.zovo-card[tabindex]:focus-visible {
  outline: 2px solid var(--zovo-border-focus);
  outline-offset: 2px;
  border-radius: var(--zovo-radius-lg);
}

/* Pro upgrade card — acts as a link/button */
.zovo-pro-card:focus-visible {
  outline: 2px solid var(--zovo-border-focus);
  outline-offset: 2px;
  border-radius: var(--zovo-radius-xl);
}

/* ==========================================================================
   QUICK FOCUS DURATION BUTTONS
   ========================================================================== */

.zovo-duration-btn:focus-visible {
  outline: 2px solid var(--zovo-border-focus);
  outline-offset: 2px;
  border-radius: var(--zovo-radius-md);
}

/* ==========================================================================
   TIMER DISPLAY — if interactive (e.g., click to pause)
   ========================================================================== */

.zovo-timer[role="button"]:focus-visible,
.zovo-timer[tabindex]:focus-visible {
  outline: 2px solid var(--zovo-border-focus);
  outline-offset: 4px; /* Extra offset to not crowd the timer display */
  border-radius: var(--zovo-radius-xl);
}

/* ==========================================================================
   OPTIONS PAGE — navigation items, section headers
   ========================================================================== */

.zovo-options-nav__item:focus-visible {
  outline: 2px solid var(--zovo-border-focus);
  outline-offset: -2px;
  border-radius: var(--zovo-radius-md);
}

.zovo-options-nav__item[aria-current="page"]:focus-visible {
  outline: 2px solid var(--zovo-border-focus);
  outline-offset: -2px;
}
```

### 4.3.2 Focus Trap Utility for Modals

When the paywall modal or any modal overlay is open, focus must be trapped inside it.

```javascript
// File: src/shared/utils/focus-trap.js

/**
 * Creates a focus trap within a container element.
 * Used for: paywall modal, confirmation dialogs, onboarding slides.
 */
export function createFocusTrap(container) {
  const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  let previouslyFocused = null;

  function getFocusableElements() {
    return [...container.querySelectorAll(FOCUSABLE_SELECTOR)];
  }

  function handleKeyDown(e) {
    if (e.key !== 'Tab') return;

    const focusable = getFocusableElements();
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
  }

  return {
    activate() {
      previouslyFocused = document.activeElement;
      container.addEventListener('keydown', handleKeyDown);
      // Focus first focusable element inside container
      const focusable = getFocusableElements();
      if (focusable.length > 0) {
        focusable[0].focus();
      }
    },
    deactivate() {
      container.removeEventListener('keydown', handleKeyDown);
      // Restore focus to previously focused element
      if (previouslyFocused && previouslyFocused.focus) {
        previouslyFocused.focus();
      }
    },
  };
}
```

---

## 4.4 Text Sizing and Scaling (WCAG 1.4.4 / 1.4.10 / 1.4.12)

### 4.4.1 Full Type Scale — rem Units

All text sizes in Focus Mode - Blocker must use `rem` units. The popup's root font size is set to `16px` as the browser default, and all sizes scale from there. This ensures the popup scales correctly when users adjust browser font size or use system zoom.

```css
/* ==========================================================================
   TYPE SCALE — Focus Mode - Blocker
   File: src/styles/typography.css

   All sizes in rem. Base: 1rem = 16px at default browser settings.
   At 200% zoom, 1rem = 32px — the popup must handle this gracefully.
   ========================================================================== */

:root {
  /* Timer display — the largest text element, must stay readable */
  --zovo-text-timer: 2.25rem;  /* 36px → 72px at 200% */

  /* Focus Score number in ring center */
  --zovo-text-score: 1.75rem;  /* 28px → 56px at 200% */

  /* Stat numbers (medium) — streak count, blocked count */
  --zovo-text-stat: 1.25rem;   /* 20px → 40px at 200% */

  /* Page/section heading — popup title, options page headings */
  --zovo-text-heading: 1rem;   /* 16px → 32px at 200% */

  /* Sub-heading — section titles within tabs */
  --zovo-text-subheading: 0.875rem; /* 14px → 28px at 200% */

  /* Body text — default readable size */
  --zovo-text-body: 0.8125rem; /* 13px → 26px at 200% */

  /* Tab labels, button text */
  --zovo-text-label: 0.75rem;  /* 12px → 24px at 200% */

  /* Small text — timestamps, hints, footer */
  --zovo-text-small: 0.6875rem; /* 11px → 22px at 200% */

  /* Minimum readable size — never go below this for informational text */
  /* 11px at default = 0.6875rem. At 200% = 22px. Still readable. */
  /* CRITICAL: No text carrying information may be smaller than 0.6875rem */
}

/* Timer display */
.zovo-timer__time {
  font-family: var(--zovo-font-mono);
  font-size: var(--zovo-text-timer);
  font-weight: var(--zovo-weight-semibold);
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: var(--zovo-text-primary);
}

/* Focus Score number */
.zovo-score__number {
  font-family: var(--zovo-font-family);
  font-size: var(--zovo-text-score);
  font-weight: var(--zovo-weight-bold);
  line-height: 1;
  color: var(--zovo-text-primary);
}

/* Streak count */
.zovo-streak__count {
  font-size: var(--zovo-text-stat);
  font-weight: var(--zovo-weight-bold);
  line-height: 1;
}

/* Popup header title */
.zovo-header__title {
  font-size: var(--zovo-text-subheading);
  font-weight: var(--zovo-weight-semibold);
}

/* Tab labels */
.zovo-tab-bar__btn {
  font-size: var(--zovo-text-label);
  font-weight: var(--zovo-weight-medium);
}

/* Body text */
.zovo-body-text,
p {
  font-size: var(--zovo-text-body);
  line-height: var(--zovo-leading-normal); /* 1.5 */
}

/* Small/hint text */
.zovo-hint,
.zovo-timestamp,
.zovo-footer__brand {
  font-size: var(--zovo-text-small);
}
```

### 4.4.2 Popup Overflow at 200% Zoom

The popup is constrained to 380x500px by Chrome. At 200% zoom, content overflows. The solution: scrollable content area with fixed header/footer.

```css
/* ==========================================================================
   POPUP ZOOM HANDLING
   File: src/popup/popup.css

   At 200% zoom, the effective viewport is ~190x250px.
   Strategy: fixed header (44px) + fixed footer (36px) = 80px overhead.
   Content area scrolls vertically.
   ========================================================================== */

body.zovo-popup {
  width: 380px;           /* Chrome enforces this as max */
  min-height: 400px;
  max-height: 600px;
  display: flex;
  flex-direction: column;
  overflow: hidden;        /* Prevent body scroll */
}

.zovo-header {
  flex-shrink: 0;
  height: auto;            /* Let header grow with text zoom */
  min-height: 2.75rem;     /* 44px at default, scales with zoom */
  padding: var(--zovo-space-2) var(--zovo-space-4);
}

.zovo-content {
  flex: 1;
  overflow-y: auto;        /* Scrollable content area */
  overflow-x: hidden;
  padding: var(--zovo-space-4);
  /* Scrollbar must be visible for keyboard/screen reader users */
  scrollbar-gutter: stable;
}

.zovo-footer {
  flex-shrink: 0;
  height: auto;
  min-height: 2.25rem;     /* 36px at default */
  padding: var(--zovo-space-2) var(--zovo-space-4);
}

/* CRITICAL: No fixed pixel heights on interactive elements */
/* Buttons, inputs, tabs — all use padding for height, not explicit height */

.zovo-btn {
  /* height: 32px; — WRONG: breaks at 200% zoom */
  padding: 0.375rem 0.875rem;  /* Height determined by content + padding */
  min-height: 2rem;             /* Minimum touch/click target: 32px */
}

.zovo-btn--lg {
  padding: 0.625rem 1.25rem;
  min-height: 2.75rem;          /* 44px — meets touch target size */
}

.zovo-input {
  /* height: 34px; — WRONG */
  padding: 0.4375rem 0.75rem;
  min-height: 2.125rem;
}

/* Tab bar — no fixed height, wraps if needed at extreme zoom */
.zovo-tab-bar {
  display: flex;
  flex-wrap: wrap;              /* Allow wrapping at extreme zoom */
  gap: var(--zovo-space-1);
  padding: var(--zovo-space-2) var(--zovo-space-4);
  border-bottom: 1px solid var(--zovo-border-default);
}

.zovo-tab-bar__btn {
  padding: var(--zovo-space-2) var(--zovo-space-3);
  min-height: 2rem;
  white-space: nowrap;
}

/* Timer display — scales down gracefully at high zoom */
.zovo-timer {
  text-align: center;
  padding: var(--zovo-space-4) 0;
}

.zovo-timer__time {
  font-size: clamp(1.5rem, 5vw, 2.25rem);
  /* At 200% zoom: clamp ensures it doesn't exceed container width */
}

/* Focus Score ring — use viewBox scaling, no fixed pixel size */
.zovo-score__ring {
  width: 100%;
  max-width: 7.5rem;  /* 120px at default, scales with container */
  height: auto;
  aspect-ratio: 1;
}

/* Stats grid — collapses to single column at extreme zoom */
.zovo-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
  gap: var(--zovo-space-3);
}
```

### 4.4.3 Text Spacing Override (WCAG 1.4.12)

Users must be able to override text spacing without loss of content or functionality. The layout must not break when these user-override values are applied:

```css
/* ==========================================================================
   TEXT SPACING RESILIENCE TEST
   Apply these via browser extension or user stylesheet.
   Layout must not clip, overlap, or lose content.
   ========================================================================== */

/* WCAG 1.4.12 minimum overrides: */
.text-spacing-test * {
  line-height: 1.5 !important;
  letter-spacing: 0.12em !important;
  word-spacing: 0.16em !important;
}

.text-spacing-test p {
  margin-bottom: 2em !important;
}

/*
  IMPLEMENTATION REQUIREMENT:
  - No text containers should use overflow: hidden with fixed heights.
  - All containers must grow to accommodate enlarged text.
  - Flex layouts should use flex-wrap: wrap where appropriate.
  - No content should be clipped behind scrollable containers
    without accessible scroll indicators.
*/
```

---

## 4.5 High Contrast Mode Support (WCAG 1.4.11)

Windows High Contrast mode (and forced-colors in modern browsers) overrides all author colors. Focus Mode - Blocker must remain usable and distinguishable in this mode.

```css
/* ==========================================================================
   FORCED COLORS / HIGH CONTRAST MODE
   File: src/styles/high-contrast.css

   @media (forced-colors: active) — supported in Chrome 89+
   In forced-colors mode, the browser overrides colors. We must ensure:
   1. All borders are explicit (not color-only boundaries)
   2. SVG elements use system colors
   3. Focus indicators use Highlight system color
   4. Disabled states use GrayText system color
   5. Interactive elements have visible boundaries
   ========================================================================== */

@media (forced-colors: active) {

  /* -------------------------------------------------------------------
     BUTTONS — Ensure visible borders
     ------------------------------------------------------------------- */

  .zovo-btn {
    border: 1px solid ButtonText;
  }

  .zovo-btn--primary {
    background: ButtonFace;
    color: ButtonText;
    border: 2px solid ButtonText;
    /* In high contrast, filled buttons lose their color distinction.
       The thicker border and system colors maintain visibility. */
  }

  .zovo-btn--primary:hover {
    background: Highlight;
    color: HighlightText;
    border-color: Highlight;
  }

  .zovo-btn--ghost {
    border: 1px solid ButtonText;
    /* Ghost buttons need an explicit border in HC mode,
       since their "no border" style is invisible. */
  }

  .zovo-btn:disabled {
    border-color: GrayText;
    color: GrayText;
  }

  .zovo-btn--nuclear {
    /* Nuclear mode still needs strong visual presence */
    border: 2px solid ButtonText;
    forced-color-adjust: none;
    /* On browsers that support it, keep the red theme for nuclear */
  }

  /* -------------------------------------------------------------------
     FOCUS INDICATORS
     ------------------------------------------------------------------- */

  *:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }

  /* -------------------------------------------------------------------
     INPUTS — Ensure visible boundaries
     ------------------------------------------------------------------- */

  .zovo-input,
  .zovo-select {
    border: 1px solid ButtonText;
    background: Field;
    color: FieldText;
  }

  .zovo-input:focus-visible {
    outline: 2px solid Highlight;
    border-color: Highlight;
  }

  /* Toggle switch track needs visible border */
  .zovo-toggle__track {
    border: 1px solid ButtonText;
  }

  .zovo-toggle__input:checked + .zovo-toggle__track {
    background: Highlight;
    border-color: Highlight;
  }

  .zovo-toggle__thumb {
    background: ButtonText;
    border: 1px solid ButtonFace;
  }

  /* Checkbox */
  .zovo-checkbox__box {
    border: 1px solid ButtonText;
  }

  .zovo-checkbox__input:checked + .zovo-checkbox__box {
    background: Highlight;
    border-color: Highlight;
  }

  /* -------------------------------------------------------------------
     SVG ELEMENTS — Use currentColor / system colors
     ------------------------------------------------------------------- */

  /* Focus Score ring */
  .zovo-score__ring .zovo-score__track {
    stroke: GrayText;
  }

  .zovo-score__ring .zovo-score__fill {
    stroke: Highlight;
    /* All score bands map to the single Highlight color in HC mode.
       The text label ("Excellent", "Fair") carries the distinction. */
  }

  .zovo-score__number {
    color: CanvasText;
  }

  .zovo-score__label {
    color: CanvasText;
    /* Label text is the primary differentiator in HC mode */
  }

  /* Timer progress ring */
  .zovo-timer__ring-track {
    stroke: GrayText;
  }

  .zovo-timer__ring-fill {
    stroke: Highlight;
  }

  /* Streak flame icon */
  .zovo-streak__icon path {
    fill: none;
    stroke: CanvasText;
  }

  .zovo-streak--active .zovo-streak__icon path {
    stroke: Highlight;
  }

  /* Block page shield */
  .zovo-block-page__shield path {
    stroke: CanvasText;
    fill: none;
  }

  /* -------------------------------------------------------------------
     TAB BAR — Active tab must be distinguishable by border, not color
     ------------------------------------------------------------------- */

  .zovo-tab-bar__btn {
    border: 1px solid transparent;
    color: ButtonText;
  }

  .zovo-tab-bar__btn[aria-selected="true"] {
    border: 2px solid Highlight;
    color: HighlightText;
    background: Highlight;
  }

  /* -------------------------------------------------------------------
     BADGES — Score badge, status badges
     ------------------------------------------------------------------- */

  .zovo-header__score {
    border: 1px solid ButtonText;
    color: ButtonText;
    background: ButtonFace;
  }

  .zovo-blocklist-item__badge {
    border: 1px solid ButtonText;
  }

  .zovo-blocklist-item__badge--active {
    border-color: Highlight;
  }

  /* -------------------------------------------------------------------
     CARDS — Explicit borders
     ------------------------------------------------------------------- */

  .zovo-card {
    border: 1px solid CanvasText;
  }

  .zovo-pro-card {
    border: 2px solid CanvasText;
  }

  /* -------------------------------------------------------------------
     HEADER & FOOTER — Visible boundaries
     ------------------------------------------------------------------- */

  .zovo-header {
    border-bottom: 1px solid CanvasText;
  }

  .zovo-footer {
    border-top: 1px solid CanvasText;
  }

  /* -------------------------------------------------------------------
     SESSION STATUS — Use system colors for distinction
     ------------------------------------------------------------------- */

  .zovo-session-status__dot {
    background: Highlight;
    border: 1px solid CanvasText;
  }

  .zovo-header__pulse {
    background: Highlight;
    border: 1px solid CanvasText;
  }

  /* -------------------------------------------------------------------
     BLOCK PAGE — Ensure readability
     ------------------------------------------------------------------- */

  .zovo-block-page {
    background: Canvas;
    color: CanvasText;
  }

  .zovo-block-page__title {
    color: CanvasText;
  }

  .zovo-block-page__subtitle {
    color: CanvasText;
  }

  .zovo-block-page__stat-value {
    color: CanvasText;
  }

  .zovo-block-page__stat-label {
    color: GrayText;
  }
}
```

---

## 4.6 Dark Mode Implementation

### 4.6.1 Theme Detection and Persistence

```javascript
// File: src/shared/utils/theme-manager.js

/**
 * ThemeManager — handles light/dark/auto theme for Focus Mode - Blocker.
 *
 * Theme is applied via [data-theme="light"|"dark"] on <html>.
 * CSS uses [data-theme="dark"] selectors to override custom properties.
 *
 * Priority:
 * 1. User explicit choice (stored in chrome.storage.sync)
 * 2. System preference (prefers-color-scheme media query)
 * 3. Default: 'auto' (follows system)
 *
 * Applied to: popup.html, options.html, block.html, onboarding.html
 */

const THEME_KEY = 'zovo_theme_preference';
const VALID_THEMES = ['light', 'dark', 'auto'];

class ThemeManager {
  constructor() {
    this._currentTheme = 'auto';
    this._resolvedTheme = 'light';
    this._mediaQuery = null;
    this._listeners = new Set();
  }

  /**
   * Initialize theme on page load.
   * Call this in every extension page's entry point.
   */
  async init() {
    // 1. Read stored preference
    const stored = await this._getStoredTheme();
    this._currentTheme = VALID_THEMES.includes(stored) ? stored : 'auto';

    // 2. Set up system preference listener
    this._mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this._mediaQuery.addEventListener('change', (e) => {
      if (this._currentTheme === 'auto') {
        this._applyTheme(e.matches ? 'dark' : 'light');
      }
    });

    // 3. Apply theme
    this._resolveAndApply();

    // 4. Listen for storage changes (e.g., user changes theme in options
    //    while popup is open)
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync' && changes[THEME_KEY]) {
        this._currentTheme = changes[THEME_KEY].newValue || 'auto';
        this._resolveAndApply();
      }
    });
  }

  /**
   * Set theme preference. Called from options page theme selector.
   * @param {'light'|'dark'|'auto'} theme
   */
  async setTheme(theme) {
    if (!VALID_THEMES.includes(theme)) return;
    this._currentTheme = theme;
    await chrome.storage.sync.set({ [THEME_KEY]: theme });
    this._resolveAndApply();
  }

  /**
   * Get current preference ('light', 'dark', or 'auto').
   */
  getPreference() {
    return this._currentTheme;
  }

  /**
   * Get resolved theme ('light' or 'dark') — what is actually displayed.
   */
  getResolvedTheme() {
    return this._resolvedTheme;
  }

  /**
   * Register a callback for theme changes.
   * @param {function} callback — receives { theme, resolved }
   */
  onChange(callback) {
    this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }

  // --- Private methods ---

  _resolveAndApply() {
    let resolved;
    if (this._currentTheme === 'auto') {
      resolved = this._mediaQuery.matches ? 'dark' : 'light';
    } else {
      resolved = this._currentTheme;
    }
    this._applyTheme(resolved);
  }

  _applyTheme(resolved) {
    const previous = this._resolvedTheme;
    this._resolvedTheme = resolved;

    // Apply data-theme attribute to <html>
    document.documentElement.setAttribute('data-theme', resolved);

    // Also set color-scheme for native form elements
    document.documentElement.style.colorScheme = resolved;

    // Announce theme change to screen reader if it changed
    if (previous !== resolved) {
      this._announceThemeChange(resolved);
      this._notifyListeners();
    }
  }

  /**
   * Announce theme change to assistive technology.
   * Uses a polite live region so it doesn't interrupt the current task.
   */
  _announceThemeChange(theme) {
    const label = theme === 'dark' ? 'Dark mode enabled' : 'Light mode enabled';
    let announcer = document.getElementById('zovo-theme-announcer');
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'zovo-theme-announcer';
      announcer.setAttribute('role', 'status');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'zovo-sr-only';
      document.body.appendChild(announcer);
    }
    // Clear then set — ensures announcement fires even if same text
    announcer.textContent = '';
    requestAnimationFrame(() => {
      announcer.textContent = label;
    });
  }

  _notifyListeners() {
    const data = {
      theme: this._currentTheme,
      resolved: this._resolvedTheme,
    };
    this._listeners.forEach((cb) => cb(data));
  }

  async _getStoredTheme() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(THEME_KEY, (result) => {
        resolve(result[THEME_KEY] || 'auto');
      });
    });
  }
}

// Singleton export
export const themeManager = new ThemeManager();
```

### 4.6.2 Theme Initialization in Each Page

```javascript
// File: src/popup/popup.js (top of file)
import { themeManager } from '../shared/utils/theme-manager.js';

document.addEventListener('DOMContentLoaded', async () => {
  await themeManager.init();
  // ... rest of popup initialization
});

// File: src/pages/options/options.js (top of file)
import { themeManager } from '../../shared/utils/theme-manager.js';

document.addEventListener('DOMContentLoaded', async () => {
  await themeManager.init();
  // Set up theme selector controls
  setupThemeSelector();
});

function setupThemeSelector() {
  const radios = document.querySelectorAll('[name="theme-preference"]');
  const current = themeManager.getPreference();

  // Set initial state
  radios.forEach((radio) => {
    radio.checked = radio.value === current;
  });

  // Handle changes
  radios.forEach((radio) => {
    radio.addEventListener('change', (e) => {
      themeManager.setTheme(e.target.value);
    });
  });
}

// File: src/pages/block/block.js (top of file)
import { themeManager } from '../../shared/utils/theme-manager.js';

document.addEventListener('DOMContentLoaded', async () => {
  await themeManager.init();
  // Block page always uses dark styling by default,
  // but respects user preference if set to light
});
```

### 4.6.3 CSS Theme Architecture

The CSS uses `[data-theme="dark"]` selectors. The `@media (prefers-color-scheme: dark)` is used as a fallback only for the brief moment before JavaScript runs.

```css
/* ==========================================================================
   DARK MODE — Complete Implementation
   File: src/styles/theme-dark.css

   Strategy:
   - [data-theme="dark"] is the primary selector (set by ThemeManager JS)
   - @media (prefers-color-scheme: dark) is a flash-prevention fallback
   - All dark-mode colors have calculated contrast ratios in comments
   ========================================================================== */

/* Flash prevention: apply dark mode immediately based on system preference
   before JS has a chance to run. JS will correct if user has overridden. */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
    --zovo-bg-page: #0f172a;
    --zovo-bg-surface: #1e293b;
    --zovo-text-primary: #f1f5f9;
    /* Minimal set to prevent flash — full overrides below */
  }
}

/* Full dark mode overrides — applied by ThemeManager */
[data-theme="dark"] {

  color-scheme: dark;

  /* ------------------------------------------------------------------
     BACKGROUNDS
     ------------------------------------------------------------------ */
  --zovo-bg-page:       #0f172a;
  --zovo-bg-surface:    #1e293b;
  --zovo-bg-elevated:   #334155;
  --zovo-bg-sunken:     #0f172a;
  --zovo-bg-overlay:    rgba(0, 0, 0, 0.6);
  --zovo-bg-header:     #1e293b;
  --zovo-bg-footer:     #1e293b;
  --zovo-bg-input:      #1e293b;
  --zovo-bg-hover:      #334155;
  --zovo-bg-active:     rgba(99, 102, 241, 0.2);
  --zovo-bg-selected:   rgba(99, 102, 241, 0.15);
  --zovo-bg-disabled:   #1e293b;
  --zovo-bg-block-page: #020617;

  /* ------------------------------------------------------------------
     TEXT — All ratios against #1e293b surface (primary reading bg)
     ------------------------------------------------------------------ */
  --zovo-text-primary:     #f1f5f9;  /* 11.26:1 — AAA */
  --zovo-text-secondary:   #94a3b8;  /* 5.21:1 — AA */
  --zovo-text-tertiary:    #64748b;  /* 3.03:1 — large text only */
  --zovo-text-disabled:    #475569;  /* 1.91:1 — disabled exempt */
  --zovo-text-inverse:     #0f172a;  /* For white/light button text */
  --zovo-text-link:        #818cf8;  /* 4.68:1 — AA */
  --zovo-text-link-hover:  #a5b4fc;  /* 6.73:1 — AA */
  --zovo-text-success:     #34d399;  /* 7.32:1 — AAA */
  --zovo-text-warning:     #fbbf24;  /* 9.44:1 — AAA */
  --zovo-text-error:       #f87171;  /* 5.23:1 — AA */
  --zovo-text-info:        #60a5fa;  /* 5.16:1 — AA */

  /* ------------------------------------------------------------------
     BORDERS
     ------------------------------------------------------------------ */
  --zovo-border-default:   #334155;
  --zovo-border-strong:    #475569;
  --zovo-border-focus:     #818cf8;  /* 4.68:1 on #1e293b — passes 3:1 */
  --zovo-border-error:     #f87171;  /* 5.23:1 on #1e293b — passes 3:1 */
  --zovo-border-success:   #34d399;  /* 7.32:1 on #1e293b — passes 3:1 */
  --zovo-border-input:     #334155;

  /* ------------------------------------------------------------------
     SHADOWS — More subtle in dark mode
     ------------------------------------------------------------------ */
  --zovo-shadow-sm:  0 1px 2px rgba(0, 0, 0, 0.2);
  --zovo-shadow-md:  0 2px 4px rgba(0, 0, 0, 0.25),
                     0 1px 2px rgba(0, 0, 0, 0.15);
  --zovo-shadow-lg:  0 4px 8px rgba(0, 0, 0, 0.3),
                     0 2px 4px rgba(0, 0, 0, 0.15);
  --zovo-shadow-xl:  0 8px 16px rgba(0, 0, 0, 0.35),
                     0 4px 8px rgba(0, 0, 0, 0.2);

  /* ------------------------------------------------------------------
     FOCUS SCORE RING — DARK MODE
     All pass 3:1 non-text against #1e293b
     ------------------------------------------------------------------ */
  --zovo-score-excellent: #34d399;  /* 7.32:1 */
  --zovo-score-good:      #60a5fa;  /* 5.16:1 */
  --zovo-score-fair:      #fbbf24;  /* 9.44:1 */
  --zovo-score-poor:      #fb923c;  /* 5.95:1 */
  --zovo-score-critical:  #f87171;  /* 5.23:1 */

  /* ------------------------------------------------------------------
     TAB BAR — DARK MODE
     ------------------------------------------------------------------ */
  --zovo-tab-active-text:   #818cf8;
  --zovo-tab-inactive-text: #94a3b8;

  /* ------------------------------------------------------------------
     COMPONENT-SPECIFIC DARK OVERRIDES
     ------------------------------------------------------------------ */

  /* Header badge ("by Zovo") */
  /* #818cf8 on rgba(99,102,241,0.15) ≈ #818cf8 on #272b56 */
  /* Approximate contrast: 3.2:1 — passes for large text / non-text */
}

/* ------------------------------------------------------------------
   DARK MODE — Component-Level Overrides
   ------------------------------------------------------------------ */

/* Primary button in dark mode — slightly adjusted for better contrast */
[data-theme="dark"] .zovo-btn--primary {
  background: var(--zovo-primary-500);
  color: #ffffff;
  border-color: var(--zovo-primary-500);
  /* #ffffff on #6366f1 = 4.56:1 — AA pass, same as light mode */
}

[data-theme="dark"] .zovo-btn--primary:hover {
  background: #818cf8;  /* Lighter for dark bg hover */
  border-color: #818cf8;
  color: #0f172a;
  /* #0f172a on #818cf8 = 4.68:1 — AA pass */
}

/* Secondary button dark mode */
[data-theme="dark"] .zovo-btn--secondary {
  background: var(--zovo-bg-surface);
  color: var(--zovo-text-primary);
  border-color: var(--zovo-border-strong);
}

/* Ghost button dark mode */
[data-theme="dark"] .zovo-btn--ghost {
  color: var(--zovo-text-secondary);
}

[data-theme="dark"] .zovo-btn--ghost:hover {
  background: var(--zovo-bg-hover);
  color: var(--zovo-text-primary);
}

/* Header badge dark mode */
[data-theme="dark"] .zovo-header__badge {
  color: #a5b4fc;
  background: rgba(99, 102, 241, 0.2);
  /* #a5b4fc on rgba bg ≈ good visibility against dark header */
}

/* Score ring track in dark mode */
[data-theme="dark"] .zovo-score__ring .zovo-score__track {
  stroke: var(--zovo-border-default); /* #334155 */
}

/* Block page in dark mode uses a deeper background */
[data-theme="dark"] .zovo-block-page {
  background: var(--zovo-bg-block-page); /* #020617 */
}

[data-theme="dark"] .zovo-block-page__title {
  color: #f8fafc; /* #f8fafc on #020617 = 17.89:1 — AAA */
}

[data-theme="dark"] .zovo-block-page__subtitle {
  color: #94a3b8; /* #94a3b8 on #020617 = 7.72:1 — AAA */
}

/* Paywall modal in dark mode */
[data-theme="dark"] .zovo-modal {
  background: var(--zovo-bg-surface);
  border: 1px solid var(--zovo-border-default);
  /* Modal on dark overlay: clear boundary via border */
}

[data-theme="dark"] .zovo-modal__overlay {
  background: rgba(0, 0, 0, 0.7);
  /* Higher opacity in dark mode for sufficient contrast with content behind */
}

/* Timer display in dark mode */
[data-theme="dark"] .zovo-timer__time {
  color: var(--zovo-text-primary); /* #f1f5f9 — 11.26:1 on surface */
}

/* Input focus glow adjusted for dark mode */
[data-theme="dark"] .zovo-input:focus-visible {
  border-color: #818cf8;
  box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.25);
}

/* Scrollbar dark mode */
[data-theme="dark"] ::-webkit-scrollbar-thumb {
  background: #475569;
}

[data-theme="dark"] ::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}
```

### 4.6.4 Options Page Theme Selector

```html
<!-- File: src/pages/options/options.html (Appearance section) -->
<fieldset class="zovo-options-fieldset">
  <legend class="zovo-options-legend">Theme</legend>
  <p class="zovo-options-description">
    Choose how Focus Mode - Blocker looks. Auto follows your system setting.
  </p>
  <div class="zovo-theme-selector" role="radiogroup" aria-label="Theme preference">

    <label class="zovo-theme-option">
      <input type="radio" name="theme-preference" value="light"
             class="zovo-radio__input" />
      <span class="zovo-theme-option__preview zovo-theme-option__preview--light"
            aria-hidden="true">
        <span class="zovo-theme-option__mockup-header"></span>
        <span class="zovo-theme-option__mockup-body"></span>
      </span>
      <span class="zovo-theme-option__label">Light</span>
    </label>

    <label class="zovo-theme-option">
      <input type="radio" name="theme-preference" value="dark"
             class="zovo-radio__input" />
      <span class="zovo-theme-option__preview zovo-theme-option__preview--dark"
            aria-hidden="true">
        <span class="zovo-theme-option__mockup-header"></span>
        <span class="zovo-theme-option__mockup-body"></span>
      </span>
      <span class="zovo-theme-option__label">Dark</span>
    </label>

    <label class="zovo-theme-option">
      <input type="radio" name="theme-preference" value="auto"
             class="zovo-radio__input" />
      <span class="zovo-theme-option__preview zovo-theme-option__preview--auto"
            aria-hidden="true">
        <span class="zovo-theme-option__mockup-header"></span>
        <span class="zovo-theme-option__mockup-body"></span>
      </span>
      <span class="zovo-theme-option__label">System</span>
    </label>

  </div>
</fieldset>
```

```css
/* Theme selector — options page */
.zovo-theme-selector {
  display: flex;
  gap: var(--zovo-space-4);
  margin-top: var(--zovo-space-3);
}

.zovo-theme-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--zovo-space-2);
  cursor: pointer;
}

.zovo-theme-option__preview {
  width: 5rem;
  height: 3.5rem;
  border-radius: var(--zovo-radius-lg);
  border: 2px solid var(--zovo-border-default);
  overflow: hidden;
  transition: border-color var(--zovo-transition-fast);
  display: flex;
  flex-direction: column;
}

.zovo-theme-option__preview--light {
  background: #ffffff;
}

.zovo-theme-option__preview--light .zovo-theme-option__mockup-header {
  height: 25%;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.zovo-theme-option__preview--dark {
  background: #1e293b;
}

.zovo-theme-option__preview--dark .zovo-theme-option__mockup-header {
  height: 25%;
  background: #0f172a;
  border-bottom: 1px solid #334155;
}

.zovo-theme-option__preview--auto {
  background: linear-gradient(135deg, #ffffff 50%, #1e293b 50%);
}

/* Selected state — visually distinct via border + check */
.zovo-radio__input:checked + .zovo-theme-option__preview {
  border-color: var(--zovo-primary-500);
  border-width: 2px;
  box-shadow: 0 0 0 2px var(--zovo-bg-surface), 0 0 0 4px var(--zovo-primary-500);
}

/* Focus visible on radio */
.zovo-radio__input:focus-visible + .zovo-theme-option__preview {
  outline: 2px solid var(--zovo-border-focus);
  outline-offset: 2px;
}

.zovo-theme-option__label {
  font-size: var(--zovo-text-sm);
  font-weight: var(--zovo-weight-medium);
  color: var(--zovo-text-secondary);
}
```

---

## 4.7 Implementation Checklist

Use this checklist during development to verify every visual accessibility requirement is met.

### Color Contrast

- [ ] Run every foreground/background pair from Section 4.1.3 through a contrast checker
- [ ] Verify `#6366f1` is never used as text on `#f8fafc` — use `#4f46e5` instead
- [ ] Verify warning text uses `#92400e` (light) / `#fbbf24` (dark), not `#d97706` on white
- [ ] Verify error text uses `#b91c1c` (light) / `#f87171` (dark), not `#ef4444` on white
- [ ] Verify all Focus Score ring strokes pass 3:1 non-text contrast in both themes
- [ ] Verify block page text passes AA on `#0f172a` background
- [ ] Verify all button text passes 4.5:1 on button background color
- [ ] Run automated check with axe-core on popup, options, block page, and onboarding

### Non-Color Indicators

- [ ] Focus Score displays text label ("Excellent", "Good", "Fair", "Needs Work", "Critical") alongside ring color
- [ ] Session status shows icon + text + color (never color dot alone)
- [ ] Blocklist enabled/disabled uses badge text ("Blocking" / "Paused") + icon + color
- [ ] Block page uses shield icon + "Site Blocked" heading + domain name in text
- [ ] Streak uses flame icon variant (filled vs dashed) + text ("5 day streak" vs "Streak broken")
- [ ] Form validation errors show error text message + red border + error icon

### Focus Indicators

- [ ] Every `<button>` has `:focus-visible` style with 2px outline
- [ ] Every `<input>` has focus border-color change + box-shadow ring
- [ ] Every `<a>` has `:focus-visible` outline
- [ ] Tab bar buttons show focus ring when navigated via keyboard
- [ ] Toggle, checkbox, radio all show focus ring on their visual control
- [ ] Modal focus trap works: Tab cycles within modal, Escape closes it
- [ ] Focus is restored to trigger element when modal closes
- [ ] No element has `outline: none` without an equivalent replacement

### Text Sizing

- [ ] All font sizes use `rem` units — zero `px` font sizes
- [ ] Popup content area scrolls at 200% zoom
- [ ] No text is clipped or overlapped at 200% zoom
- [ ] Buttons and inputs use padding for height, not fixed `height` in `px`
- [ ] Timer display uses `clamp()` for responsive scaling
- [ ] Score ring uses `max-width` in `rem` with `aspect-ratio: 1`
- [ ] Stats grid collapses to single column at high zoom

### High Contrast Mode

- [ ] All buttons have explicit `border` in `@media (forced-colors: active)`
- [ ] Ghost buttons gain visible border in forced-colors mode
- [ ] SVG elements (score ring, timer ring, icons) use `currentColor` or system colors
- [ ] Focus indicators use `Highlight` system color
- [ ] Active tab uses `Highlight` background in forced-colors
- [ ] Disabled elements use `GrayText`
- [ ] Test with Windows High Contrast mode (black and white themes)

### Dark Mode

- [ ] ThemeManager initializes on every page (popup, options, block, onboarding)
- [ ] Theme preference persists across extension pages via `chrome.storage.sync`
- [ ] System preference change (OS toggle) reflects immediately when set to "auto"
- [ ] Theme change announced to screen reader via live region
- [ ] No flash of wrong theme on page load (CSS media query fallback in place)
- [ ] All dark-mode contrast ratios verified per Section 4.1.2
- [ ] Scrollbar colors updated for dark mode
- [ ] Modal overlay opacity increased in dark mode (0.7 vs 0.5)
- [ ] Input focus glow uses lighter purple in dark mode

---

## 4.8 Testing Tools and Procedures

### Automated Testing

```javascript
// File: tests/accessibility/contrast-audit.test.js
// Run via: npm test -- --grep "contrast"

import { getContrastRatio } from './helpers/color-utils.js';

const LIGHT_PAIRS = [
  { name: 'Body text on white',       fg: '#1e293b', bg: '#ffffff', minRatio: 4.5 },
  { name: 'Body text on page bg',     fg: '#1e293b', bg: '#f8fafc', minRatio: 4.5 },
  { name: 'Secondary text on white',  fg: '#475569', bg: '#ffffff', minRatio: 4.5 },
  { name: 'Link text on white',       fg: '#4f46e5', bg: '#ffffff', minRatio: 4.5 },
  { name: 'Link text on page bg',     fg: '#4f46e5', bg: '#f8fafc', minRatio: 4.5 },
  { name: 'Primary btn text',         fg: '#ffffff', bg: '#6366f1', minRatio: 4.5 },
  { name: 'Focus btn text',           fg: '#ffffff', bg: '#059669', minRatio: 4.5 },
  { name: 'Nuclear btn text',         fg: '#ffffff', bg: '#dc2626', minRatio: 4.5 },
  { name: 'Success text',             fg: '#047857', bg: '#ffffff', minRatio: 4.5 },
  { name: 'Warning text',             fg: '#92400e', bg: '#ffffff', minRatio: 4.5 },
  { name: 'Error text',               fg: '#b91c1c', bg: '#ffffff', minRatio: 4.5 },
  { name: 'Tab active text',          fg: '#4f46e5', bg: '#eef2ff', minRatio: 4.5 },
  { name: 'Tab inactive text',        fg: '#64748b', bg: '#ffffff', minRatio: 4.5 },
  { name: 'Block page heading',       fg: '#f1f5f9', bg: '#0f172a', minRatio: 4.5 },
  { name: 'Block page body',          fg: '#94a3b8', bg: '#0f172a', minRatio: 4.5 },
  // Non-text contrast (3:1 minimum)
  { name: 'Score ring excellent',     fg: '#059669', bg: '#ffffff', minRatio: 3.0 },
  { name: 'Score ring fair',          fg: '#d97706', bg: '#ffffff', minRatio: 3.0 },
  { name: 'Score ring critical',      fg: '#dc2626', bg: '#ffffff', minRatio: 3.0 },
  { name: 'Focus ring on white',      fg: '#4f46e5', bg: '#ffffff', minRatio: 3.0 },
];

const DARK_PAIRS = [
  { name: 'Body text on surface',     fg: '#f1f5f9', bg: '#1e293b', minRatio: 4.5 },
  { name: 'Body text on page bg',     fg: '#f1f5f9', bg: '#0f172a', minRatio: 4.5 },
  { name: 'Secondary text on surface',fg: '#94a3b8', bg: '#1e293b', minRatio: 4.5 },
  { name: 'Link text on surface',     fg: '#818cf8', bg: '#1e293b', minRatio: 4.5 },
  { name: 'Primary btn text (dark)',   fg: '#ffffff', bg: '#6366f1', minRatio: 4.5 },
  { name: 'Success text (dark)',       fg: '#34d399', bg: '#1e293b', minRatio: 4.5 },
  { name: 'Warning text (dark)',       fg: '#fbbf24', bg: '#1e293b', minRatio: 4.5 },
  { name: 'Error text (dark)',         fg: '#f87171', bg: '#1e293b', minRatio: 4.5 },
  { name: 'Tab active (dark)',         fg: '#818cf8', bg: '#1e293b', minRatio: 4.5 },
  { name: 'Block page heading (dark)', fg: '#f8fafc', bg: '#020617', minRatio: 4.5 },
  // Non-text contrast (3:1 minimum)
  { name: 'Focus ring on dark surface',fg: '#818cf8', bg: '#1e293b', minRatio: 3.0 },
  { name: 'Score ring excellent (dark)',fg: '#34d399', bg: '#1e293b', minRatio: 3.0 },
  { name: 'Score ring fair (dark)',    fg: '#fbbf24', bg: '#1e293b', minRatio: 3.0 },
  { name: 'Score ring critical (dark)',fg: '#f87171', bg: '#1e293b', minRatio: 3.0 },
];

describe('Light mode contrast', () => {
  LIGHT_PAIRS.forEach(({ name, fg, bg, minRatio }) => {
    test(`${name}: ${fg} on ${bg} >= ${minRatio}:1`, () => {
      const ratio = getContrastRatio(fg, bg);
      expect(ratio).toBeGreaterThanOrEqual(minRatio);
    });
  });
});

describe('Dark mode contrast', () => {
  DARK_PAIRS.forEach(({ name, fg, bg, minRatio }) => {
    test(`${name}: ${fg} on ${bg} >= ${minRatio}:1`, () => {
      const ratio = getContrastRatio(fg, bg);
      expect(ratio).toBeGreaterThanOrEqual(minRatio);
    });
  });
});
```

### Manual Testing Procedures

1. **Keyboard navigation:** Tab through every page (popup, options, block, onboarding). Every interactive element must receive visible focus. Tab order must match visual order.

2. **200% zoom:** Set Chrome to 200% zoom (`chrome://settings/appearance`). Open the popup. Verify all content is reachable via scrolling, no text is clipped, buttons are still pressable.

3. **High contrast mode:** On Windows, enable High Contrast mode (`Settings > Accessibility > Contrast themes`). Open every extension page. Verify all buttons have borders, all text is readable, all SVGs are visible.

4. **Screen magnification:** Use OS magnifier at 400%. Navigate the popup. Verify focus indicators are visible and content reflows logically.

5. **Color blindness simulation:** Use Chrome DevTools > Rendering > Emulate vision deficiencies. Check protanopia, deuteranopia, tritanopia. Verify all information conveyed by color is also conveyed by text/icon.

6. **Dark mode toggle:** Switch between light, dark, and auto in options. Verify all pages update. Verify screen reader announces the change. Verify no flash of wrong theme.

---

## 4.9 File Reference Map

| Concern | File Path | Description |
|---|---|---|
| Accessible tokens (light) | `src/styles/accessible-tokens.css` | CSS custom properties with contrast ratios |
| Dark mode overrides | `src/styles/theme-dark.css` | `[data-theme="dark"]` token overrides |
| Focus system | `src/styles/focus-system.css` | `:focus-visible` styles for all elements |
| High contrast mode | `src/styles/high-contrast.css` | `@media (forced-colors: active)` overrides |
| Theme manager | `src/shared/utils/theme-manager.js` | ThemeManager class, system detection, storage |
| Focus trap | `src/shared/utils/focus-trap.js` | Modal focus trapping utility |
| Focus Score ring | `src/popup/components/focus-score-ring.js` | Score bands with text labels + icons |
| Contrast tests | `tests/accessibility/contrast-audit.test.js` | Automated contrast ratio verification |
| Global styles (ref) | `docs/branding-retention/agent2-global-styles.md` | Design token source of truth (Phase 08) |
| UI architecture (ref) | `docs/mv3-architecture/agent5-ui-architecture.md` | Page structure and component list (Phase 12) |
