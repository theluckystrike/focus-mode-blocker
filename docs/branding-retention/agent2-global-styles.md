# Global Styles & Component Library -- Focus Mode - Blocker

> **Brand:** Zovo | **Extension:** Focus Mode - Blocker | **Version:** 1.0
> This document defines every design token, base style, and reusable component for the Focus Mode - Blocker Chrome extension. All UI must reference these tokens -- no hardcoded values.

---

## 1. Design Token System

### 1.1 Complete CSS Custom Properties (`zovo-brand.css`)

```css
/* ==========================================================================
   ZOVO DESIGN TOKENS -- Focus Mode - Blocker
   Version: 1.0
   All UI components MUST use these tokens. No hardcoded values.
   ========================================================================== */

:root {
  /* ------------------------------------------------------------------
     COLOR TOKENS -- LIGHT MODE (default)
     ------------------------------------------------------------------ */

  /* Primary (Indigo/Purple) */
  --zovo-primary-50:  #eef2ff;
  --zovo-primary-100: #e0e7ff;
  --zovo-primary-200: #c7d2fe;
  --zovo-primary-300: #a5b4fc;
  --zovo-primary-400: #818cf8;
  --zovo-primary-500: #6366f1;
  --zovo-primary-600: #4f46e5;
  --zovo-primary-700: #4338ca;
  --zovo-primary-800: #3730a3;
  --zovo-primary-900: #312e81;

  /* Secondary (Slate) */
  --zovo-secondary-50:  #f8fafc;
  --zovo-secondary-100: #f1f5f9;
  --zovo-secondary-200: #e2e8f0;
  --zovo-secondary-300: #cbd5e1;
  --zovo-secondary-400: #94a3b8;
  --zovo-secondary-500: #64748b;
  --zovo-secondary-600: #475569;
  --zovo-secondary-700: #334155;
  --zovo-secondary-800: #1e293b;
  --zovo-secondary-900: #0f172a;

  /* Accent (Cyan -- used sparingly for highlights) */
  --zovo-accent-400: #22d3ee;
  --zovo-accent-500: #06b6d4;
  --zovo-accent-600: #0891b2;

  /* Semantic -- Success */
  --zovo-success-50:  #ecfdf5;
  --zovo-success-100: #d1fae5;
  --zovo-success-200: #a7f3d0;
  --zovo-success-400: #34d399;
  --zovo-success-500: #10b981;
  --zovo-success-600: #059669;
  --zovo-success-700: #047857;

  /* Semantic -- Warning */
  --zovo-warning-50:  #fffbeb;
  --zovo-warning-100: #fef3c7;
  --zovo-warning-200: #fde68a;
  --zovo-warning-400: #fbbf24;
  --zovo-warning-500: #f59e0b;
  --zovo-warning-600: #d97706;
  --zovo-warning-700: #b45309;

  /* Semantic -- Error */
  --zovo-error-50:  #fef2f2;
  --zovo-error-100: #fee2e2;
  --zovo-error-200: #fecaca;
  --zovo-error-400: #f87171;
  --zovo-error-500: #ef4444;
  --zovo-error-600: #dc2626;
  --zovo-error-700: #b91c1c;

  /* Semantic -- Info */
  --zovo-info-50:  #eff6ff;
  --zovo-info-100: #dbeafe;
  --zovo-info-200: #bfdbfe;
  --zovo-info-400: #60a5fa;
  --zovo-info-500: #3b82f6;
  --zovo-info-600: #2563eb;
  --zovo-info-700: #1d4ed8;

  /* ------------------------------------------------------------------
     BACKGROUND TOKENS
     ------------------------------------------------------------------ */
  --zovo-bg-page:       #f8fafc;
  --zovo-bg-surface:    #ffffff;
  --zovo-bg-elevated:   #ffffff;
  --zovo-bg-sunken:     #f1f5f9;
  --zovo-bg-overlay:    rgba(15, 23, 42, 0.5);
  --zovo-bg-header:     #ffffff;
  --zovo-bg-footer:     #f8fafc;
  --zovo-bg-input:      #ffffff;
  --zovo-bg-hover:      #f1f5f9;
  --zovo-bg-active:     #e0e7ff;
  --zovo-bg-selected:   #eef2ff;
  --zovo-bg-disabled:   #f1f5f9;

  /* ------------------------------------------------------------------
     TEXT TOKENS
     ------------------------------------------------------------------ */
  --zovo-text-primary:     #1e293b;
  --zovo-text-secondary:   #475569;
  --zovo-text-tertiary:    #94a3b8;
  --zovo-text-disabled:    #cbd5e1;
  --zovo-text-inverse:     #ffffff;
  --zovo-text-link:        #6366f1;
  --zovo-text-link-hover:  #4f46e5;
  --zovo-text-success:     #059669;
  --zovo-text-warning:     #d97706;
  --zovo-text-error:       #dc2626;
  --zovo-text-info:        #2563eb;

  /* ------------------------------------------------------------------
     BORDER TOKENS
     ------------------------------------------------------------------ */
  --zovo-border-default:   #e2e8f0;
  --zovo-border-strong:    #cbd5e1;
  --zovo-border-focus:     #6366f1;
  --zovo-border-error:     #ef4444;
  --zovo-border-success:   #10b981;
  --zovo-border-input:     #e2e8f0;

  /* ------------------------------------------------------------------
     TYPOGRAPHY TOKENS
     ------------------------------------------------------------------ */

  /* Font Family */
  --zovo-font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --zovo-font-mono:   'JetBrains Mono', 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;

  /* Font Sizes -- 7-step scale */
  --zovo-text-xs:   0.6875rem;  /* 11px */
  --zovo-text-sm:   0.75rem;    /* 12px */
  --zovo-text-base: 0.8125rem;  /* 13px */
  --zovo-text-md:   0.875rem;   /* 14px */
  --zovo-text-lg:   1rem;       /* 16px */
  --zovo-text-xl:   1.25rem;    /* 20px */
  --zovo-text-2xl:  1.5rem;     /* 24px */

  /* Font Weights */
  --zovo-weight-regular:  400;
  --zovo-weight-medium:   500;
  --zovo-weight-semibold: 600;
  --zovo-weight-bold:     700;

  /* Line Heights */
  --zovo-leading-tight:  1.25;
  --zovo-leading-normal: 1.5;
  --zovo-leading-loose:  1.75;

  /* ------------------------------------------------------------------
     SPACING TOKENS -- 8-step scale
     ------------------------------------------------------------------ */
  --zovo-space-1:  4px;
  --zovo-space-2:  8px;
  --zovo-space-3:  12px;
  --zovo-space-4:  16px;
  --zovo-space-5:  20px;
  --zovo-space-6:  24px;
  --zovo-space-7:  28px;
  --zovo-space-8:  32px;

  /* ------------------------------------------------------------------
     RADIUS TOKENS -- 5 levels
     ------------------------------------------------------------------ */
  --zovo-radius-sm:   4px;
  --zovo-radius-md:   6px;
  --zovo-radius-lg:   8px;
  --zovo-radius-xl:   12px;
  --zovo-radius-full: 9999px;

  /* ------------------------------------------------------------------
     SHADOW TOKENS -- 4 levels
     ------------------------------------------------------------------ */
  --zovo-shadow-sm:  0 1px 2px rgba(15, 23, 42, 0.05);
  --zovo-shadow-md:  0 2px 4px rgba(15, 23, 42, 0.06),
                     0 1px 2px rgba(15, 23, 42, 0.04);
  --zovo-shadow-lg:  0 4px 8px rgba(15, 23, 42, 0.08),
                     0 2px 4px rgba(15, 23, 42, 0.04);
  --zovo-shadow-xl:  0 8px 16px rgba(15, 23, 42, 0.1),
                     0 4px 8px rgba(15, 23, 42, 0.05);

  /* ------------------------------------------------------------------
     TRANSITION TOKENS -- 3 speeds
     ------------------------------------------------------------------ */
  --zovo-transition-fast: 150ms ease;
  --zovo-transition-base: 200ms ease;
  --zovo-transition-slow: 300ms ease-out;

  /* ------------------------------------------------------------------
     POPUP DIMENSION TOKENS
     ------------------------------------------------------------------ */
  --zovo-popup-width:      380px;
  --zovo-popup-min-height: 400px;
  --zovo-popup-max-height: 600px;

  /* ------------------------------------------------------------------
     Z-INDEX SCALE
     ------------------------------------------------------------------ */
  --zovo-z-base:    1;
  --zovo-z-dropdown: 10;
  --zovo-z-sticky:  20;
  --zovo-z-overlay: 30;
  --zovo-z-modal:   40;
  --zovo-z-toast:   50;
}
```

### 1.2 Dark Mode Overrides

```css
@media (prefers-color-scheme: dark) {
  :root {
    /* Backgrounds */
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

    /* Text */
    --zovo-text-primary:     #f1f5f9;
    --zovo-text-secondary:   #94a3b8;
    --zovo-text-tertiary:    #64748b;
    --zovo-text-disabled:    #475569;
    --zovo-text-inverse:     #0f172a;
    --zovo-text-link:        #818cf8;
    --zovo-text-link-hover:  #a5b4fc;
    --zovo-text-success:     #34d399;
    --zovo-text-warning:     #fbbf24;
    --zovo-text-error:       #f87171;
    --zovo-text-info:        #60a5fa;

    /* Borders */
    --zovo-border-default:   #334155;
    --zovo-border-strong:    #475569;
    --zovo-border-focus:     #818cf8;
    --zovo-border-error:     #f87171;
    --zovo-border-success:   #34d399;
    --zovo-border-input:     #334155;

    /* Shadows (more subtle in dark mode) */
    --zovo-shadow-sm:  0 1px 2px rgba(0, 0, 0, 0.2);
    --zovo-shadow-md:  0 2px 4px rgba(0, 0, 0, 0.25),
                       0 1px 2px rgba(0, 0, 0, 0.15);
    --zovo-shadow-lg:  0 4px 8px rgba(0, 0, 0, 0.3),
                       0 2px 4px rgba(0, 0, 0, 0.15);
    --zovo-shadow-xl:  0 8px 16px rgba(0, 0, 0, 0.35),
                       0 4px 8px rgba(0, 0, 0, 0.2);
  }
}
```

---

## 2. Base Reset & Typography

```css
/* ==========================================================================
   BASE RESET & TYPOGRAPHY
   ========================================================================== */

/* Box-sizing reset */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* Body defaults */
body {
  font-family: var(--zovo-font-family);
  font-size: var(--zovo-text-base);
  font-weight: var(--zovo-weight-regular);
  line-height: var(--zovo-leading-normal);
  color: var(--zovo-text-primary);
  background-color: var(--zovo-bg-page);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

/* Popup body */
body.zovo-popup {
  width: var(--zovo-popup-width);
  min-height: var(--zovo-popup-min-height);
  max-height: var(--zovo-popup-max-height);
  overflow: hidden;
}

/* Headings */
h1, h2, h3, h4 {
  font-weight: var(--zovo-weight-semibold);
  line-height: var(--zovo-leading-tight);
  color: var(--zovo-text-primary);
}

h1 {
  font-size: var(--zovo-text-2xl);
  letter-spacing: -0.025em;
}

h2 {
  font-size: var(--zovo-text-xl);
  letter-spacing: -0.02em;
}

h3 {
  font-size: var(--zovo-text-lg);
}

h4 {
  font-size: var(--zovo-text-md);
  font-weight: var(--zovo-weight-medium);
}

/* Paragraph */
p {
  font-size: var(--zovo-text-base);
  line-height: var(--zovo-leading-normal);
  color: var(--zovo-text-secondary);
  margin-bottom: var(--zovo-space-3);
}

p:last-child {
  margin-bottom: 0;
}

/* Links */
a {
  color: var(--zovo-text-link);
  text-decoration: none;
  transition: color var(--zovo-transition-fast);
}

a:hover {
  color: var(--zovo-text-link-hover);
  text-decoration: underline;
}

a:focus-visible {
  outline: 2px solid var(--zovo-border-focus);
  outline-offset: 2px;
  border-radius: var(--zovo-radius-sm);
}

/* Lists */
ul, ol {
  padding-left: var(--zovo-space-5);
  margin-bottom: var(--zovo-space-3);
}

li {
  font-size: var(--zovo-text-base);
  line-height: var(--zovo-leading-normal);
  color: var(--zovo-text-secondary);
  margin-bottom: var(--zovo-space-1);
}

/* Utility: visually hidden (for screen readers) */
.zovo-sr-only {
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

/* Scrollbar styling (Chrome-specific) */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--zovo-secondary-300);
  border-radius: var(--zovo-radius-full);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--zovo-secondary-400);
}
```

---

## 3. Component Specifications

### 3.1 Header Component

**Layout:** Flex row, space-between alignment. Contains the Zovo logo mark (24px), extension title at 14px semibold, "by Zovo" micro-badge, and a settings gear icon button.

**Focus Mode specific:** Shows a mini Focus Score badge (color-coded circle with number) and an active session pulse indicator when a focus session is running.

#### HTML Template

```html
<header class="zovo-header" role="banner">
  <div class="zovo-header__left">
    <img
      src="assets/icons/zovo-logo-24.svg"
      alt=""
      class="zovo-header__logo"
      width="24"
      height="24"
      aria-hidden="true"
    />
    <span class="zovo-header__title">Focus Mode</span>
    <span class="zovo-header__badge">by Zovo</span>
  </div>
  <div class="zovo-header__right">
    <!-- Mini Focus Score badge (visible when score > 0) -->
    <span class="zovo-header__score zovo-header__score--green" aria-label="Focus Score: 74">
      74
    </span>
    <!-- Active session pulse (visible when session is running) -->
    <span class="zovo-header__pulse" aria-label="Focus session active"></span>
    <button
      class="zovo-btn zovo-btn--ghost zovo-btn--icon"
      aria-label="Open settings"
      title="Settings"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M8 10a2 2 0 100-4 2 2 0 000 4zm6.32-1.906l..."/>
      </svg>
    </button>
  </div>
</header>
```

#### CSS

```css
/* Header Component */
.zovo-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 var(--zovo-space-4);
  background: var(--zovo-bg-header);
  border-bottom: 1px solid var(--zovo-border-default);
  flex-shrink: 0;
}

.zovo-header__left {
  display: flex;
  align-items: center;
  gap: var(--zovo-space-2);
}

.zovo-header__logo {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.zovo-header__title {
  font-size: var(--zovo-text-md);
  font-weight: var(--zovo-weight-semibold);
  color: var(--zovo-text-primary);
  letter-spacing: -0.01em;
}

.zovo-header__badge {
  font-size: var(--zovo-text-xs);
  font-weight: var(--zovo-weight-medium);
  color: var(--zovo-primary-500);
  background: var(--zovo-primary-100);
  padding: 1px 6px;
  border-radius: var(--zovo-radius-full);
  line-height: var(--zovo-leading-tight);
}

.zovo-header__right {
  display: flex;
  align-items: center;
  gap: var(--zovo-space-2);
}

/* Mini Focus Score badge in header */
.zovo-header__score {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--zovo-radius-full);
  font-size: var(--zovo-text-xs);
  font-weight: var(--zovo-weight-bold);
  color: var(--zovo-text-inverse);
  line-height: 1;
}

.zovo-header__score--red    { background: var(--zovo-error-500); }
.zovo-header__score--orange { background: var(--zovo-warning-500); }
.zovo-header__score--yellow { background: #eab308; }
.zovo-header__score--green  { background: var(--zovo-success-500); }
.zovo-header__score--blue   { background: var(--zovo-info-500); }

/* Active session pulse indicator */
.zovo-header__pulse {
  width: 8px;
  height: 8px;
  border-radius: var(--zovo-radius-full);
  background: var(--zovo-success-500);
  animation: zovo-pulse 2s ease-in-out infinite;
}

@keyframes zovo-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.5; transform: scale(0.85); }
}

@media (prefers-reduced-motion: reduce) {
  .zovo-header__pulse {
    animation: none;
  }
}
```

---

### 3.2 Footer Component

**Layout:** Centered content row, top border, secondary background. Contains "Built by Zovo" link with external-link icon and a privacy shield badge.

#### HTML Template

```html
<footer class="zovo-footer" role="contentinfo">
  <a
    href="https://zovo.dev"
    target="_blank"
    rel="noopener noreferrer"
    class="zovo-footer__brand"
  >
    Built by Zovo
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
      <path d="M8.5 5.5v3a1 1 0 01-1 1h-6a1 1 0 01-1-1v-6a1 1 0 011-1h3m2-2h3v3m-6 3L9 .5"/>
    </svg>
  </a>
  <span class="zovo-footer__divider" aria-hidden="true">|</span>
  <span class="zovo-footer__privacy">
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
      <path d="M5 0L1 2v3c0 2.8 1.7 5.4 4 6 2.3-.6 4-3.2 4-6V2L5 0z"/>
    </svg>
    Your data stays local
  </span>
</footer>
```

#### CSS

```css
/* Footer Component */
.zovo-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  padding: 0 var(--zovo-space-4);
  background: var(--zovo-bg-footer);
  border-top: 1px solid var(--zovo-border-default);
  gap: var(--zovo-space-2);
  flex-shrink: 0;
}

.zovo-footer__brand {
  display: inline-flex;
  align-items: center;
  gap: var(--zovo-space-1);
  font-size: var(--zovo-text-xs);
  font-weight: var(--zovo-weight-medium);
  color: var(--zovo-text-secondary);
  text-decoration: none;
  transition: color var(--zovo-transition-fast);
}

.zovo-footer__brand:hover {
  color: var(--zovo-primary-500);
  text-decoration: none;
}

.zovo-footer__divider {
  color: var(--zovo-border-default);
  font-size: var(--zovo-text-xs);
}

.zovo-footer__privacy {
  display: inline-flex;
  align-items: center;
  gap: var(--zovo-space-1);
  font-size: var(--zovo-text-xs);
  color: var(--zovo-text-tertiary);
}

.zovo-footer__privacy svg {
  color: var(--zovo-success-500);
}
```

---

### 3.3 Button System

Three variants (primary, secondary, ghost), three sizes (sm, default, lg), plus block modifier, disabled state, loading spinner state, and icon-only variant. Focus Mode adds "Quick Focus" (green/large) and "Nuclear" (red/warning) specialty buttons.

#### HTML Templates

```html
<!-- Primary Button -->
<button class="zovo-btn zovo-btn--primary">Start Focus</button>

<!-- Secondary Button -->
<button class="zovo-btn zovo-btn--secondary">Cancel</button>

<!-- Ghost Button -->
<button class="zovo-btn zovo-btn--ghost">Skip</button>

<!-- Size Variants -->
<button class="zovo-btn zovo-btn--primary zovo-btn--sm">Small</button>
<button class="zovo-btn zovo-btn--primary">Default</button>
<button class="zovo-btn zovo-btn--primary zovo-btn--lg">Large</button>

<!-- Block (Full-Width) -->
<button class="zovo-btn zovo-btn--primary zovo-btn--block">Full Width Action</button>

<!-- Disabled -->
<button class="zovo-btn zovo-btn--primary" disabled>Unavailable</button>

<!-- Loading -->
<button class="zovo-btn zovo-btn--primary zovo-btn--loading" disabled>
  <span class="zovo-btn__spinner" aria-hidden="true"></span>
  Saving...
</button>

<!-- Icon Button -->
<button class="zovo-btn zovo-btn--ghost zovo-btn--icon" aria-label="Close">
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z"/>
  </svg>
</button>

<!-- Quick Focus (Focus Mode specialty) -->
<button class="zovo-btn zovo-btn--focus zovo-btn--lg zovo-btn--block">
  Quick Focus -- 25 min
</button>

<!-- Nuclear Button (Focus Mode specialty) -->
<button class="zovo-btn zovo-btn--nuclear zovo-btn--block">
  Nuclear Mode
</button>
```

#### CSS

```css
/* Button Base */
.zovo-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--zovo-space-2);
  padding: 6px 14px;
  font-family: var(--zovo-font-family);
  font-size: var(--zovo-text-sm);
  font-weight: var(--zovo-weight-medium);
  line-height: var(--zovo-leading-tight);
  border: 1px solid transparent;
  border-radius: var(--zovo-radius-md);
  cursor: pointer;
  transition: all var(--zovo-transition-fast);
  white-space: nowrap;
  user-select: none;
  -webkit-user-select: none;
  position: relative;
}

.zovo-btn:focus-visible {
  outline: 2px solid var(--zovo-border-focus);
  outline-offset: 2px;
}

/* Primary Variant */
.zovo-btn--primary {
  background: var(--zovo-primary-500);
  color: var(--zovo-text-inverse);
  border-color: var(--zovo-primary-500);
}

.zovo-btn--primary:hover {
  background: var(--zovo-primary-600);
  border-color: var(--zovo-primary-600);
}

.zovo-btn--primary:active {
  background: var(--zovo-primary-700);
  border-color: var(--zovo-primary-700);
}

/* Secondary Variant */
.zovo-btn--secondary {
  background: var(--zovo-bg-surface);
  color: var(--zovo-text-primary);
  border-color: var(--zovo-border-default);
}

.zovo-btn--secondary:hover {
  background: var(--zovo-bg-hover);
  border-color: var(--zovo-border-strong);
}

.zovo-btn--secondary:active {
  background: var(--zovo-bg-active);
}

/* Ghost Variant */
.zovo-btn--ghost {
  background: transparent;
  color: var(--zovo-text-secondary);
  border-color: transparent;
}

.zovo-btn--ghost:hover {
  background: var(--zovo-bg-hover);
  color: var(--zovo-text-primary);
}

.zovo-btn--ghost:active {
  background: var(--zovo-bg-active);
}

/* Size: Small */
.zovo-btn--sm {
  padding: 4px 10px;
  font-size: var(--zovo-text-xs);
  border-radius: var(--zovo-radius-sm);
}

/* Size: Large */
.zovo-btn--lg {
  padding: 10px 20px;
  font-size: var(--zovo-text-md);
  border-radius: var(--zovo-radius-lg);
}

/* Block Modifier */
.zovo-btn--block {
  display: flex;
  width: 100%;
}

/* Disabled State */
.zovo-btn:disabled,
.zovo-btn[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* Loading State */
.zovo-btn--loading {
  cursor: wait;
}

.zovo-btn__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: var(--zovo-radius-full);
  animation: zovo-spin 0.6s linear infinite;
}

@keyframes zovo-spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .zovo-btn__spinner {
    animation-duration: 1.5s;
  }
}

/* Icon Button */
.zovo-btn--icon {
  padding: 6px;
  border-radius: var(--zovo-radius-md);
}

.zovo-btn--icon.zovo-btn--sm { padding: 4px; }
.zovo-btn--icon.zovo-btn--lg { padding: 10px; }

/* Quick Focus Button (Focus Mode specialty) */
.zovo-btn--focus {
  background: var(--zovo-success-500);
  color: var(--zovo-text-inverse);
  border-color: var(--zovo-success-500);
  font-weight: var(--zovo-weight-semibold);
}

.zovo-btn--focus:hover {
  background: var(--zovo-success-600);
  border-color: var(--zovo-success-600);
}

.zovo-btn--focus:active {
  background: var(--zovo-success-700);
  border-color: var(--zovo-success-700);
}

/* Nuclear Button (Focus Mode specialty) */
.zovo-btn--nuclear {
  background: var(--zovo-error-500);
  color: var(--zovo-text-inverse);
  border-color: var(--zovo-error-500);
  font-weight: var(--zovo-weight-semibold);
}

.zovo-btn--nuclear:hover {
  background: var(--zovo-error-600);
  border-color: var(--zovo-error-600);
}

.zovo-btn--nuclear:active {
  background: var(--zovo-error-700);
  border-color: var(--zovo-error-700);
}
```

---

### 3.4 Input System

Covers text input, search input with icon, toggle switch, checkbox, radio, select dropdown, URL input for adding sites, and timer duration input.

#### HTML Templates

```html
<!-- Text Input -->
<div class="zovo-input-group">
  <label class="zovo-label" for="site-name">Site Name</label>
  <input
    type="text"
    id="site-name"
    class="zovo-input"
    placeholder="e.g., twitter.com"
  />
</div>

<!-- Text Input with Error -->
<div class="zovo-input-group zovo-input-group--error">
  <label class="zovo-label" for="site-url">Site URL</label>
  <input type="text" id="site-url" class="zovo-input" value="not-a-url" aria-invalid="true" />
  <span class="zovo-input-error" role="alert">Please enter a valid domain</span>
</div>

<!-- Search Input -->
<div class="zovo-input-search">
  <svg class="zovo-input-search__icon" width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
    <path d="M6 1a5 5 0 013.7 8.3l3.5 3.5a.5.5 0 01-.7.7l-3.5-3.5A5 5 0 116 1z"/>
  </svg>
  <input type="search" class="zovo-input" placeholder="Search blocked sites..." aria-label="Search blocked sites" />
</div>

<!-- Toggle Switch -->
<label class="zovo-toggle">
  <input type="checkbox" class="zovo-toggle__input" />
  <span class="zovo-toggle__track" aria-hidden="true">
    <span class="zovo-toggle__thumb"></span>
  </span>
  <span class="zovo-toggle__label">Enable notifications</span>
</label>

<!-- Checkbox -->
<label class="zovo-checkbox">
  <input type="checkbox" class="zovo-checkbox__input" />
  <span class="zovo-checkbox__box" aria-hidden="true">
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M2 5l2.5 2.5L8 3"/>
    </svg>
  </span>
  <span class="zovo-checkbox__label">Block social media</span>
</label>

<!-- Radio -->
<label class="zovo-radio">
  <input type="radio" name="duration" class="zovo-radio__input" />
  <span class="zovo-radio__circle" aria-hidden="true"></span>
  <span class="zovo-radio__label">25 minutes</span>
</label>

<!-- Select Dropdown -->
<div class="zovo-input-group">
  <label class="zovo-label" for="category">Category</label>
  <div class="zovo-select-wrap">
    <select id="category" class="zovo-select">
      <option value="">Select category...</option>
      <option value="social">Social Media</option>
      <option value="news">News</option>
      <option value="entertainment">Entertainment</option>
      <option value="shopping">Shopping</option>
    </select>
    <svg class="zovo-select__arrow" width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
      <path d="M3 4.5l3 3 3-3"/>
    </svg>
  </div>
</div>

<!-- URL Input for Adding Sites (Focus Mode specific) -->
<div class="zovo-url-input">
  <input type="text" class="zovo-input" placeholder="Add website to block..." aria-label="Add website URL" />
  <button class="zovo-btn zovo-btn--primary zovo-btn--sm" aria-label="Add site">
    Add
  </button>
</div>

<!-- Timer Duration Input (Focus Mode specific) -->
<div class="zovo-timer-input">
  <button class="zovo-btn zovo-btn--ghost zovo-btn--icon" aria-label="Decrease duration">
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M3 7h8"/></svg>
  </button>
  <input type="number" class="zovo-input zovo-timer-input__field" value="25" min="1" max="120" aria-label="Focus duration in minutes" />
  <span class="zovo-timer-input__unit">min</span>
  <button class="zovo-btn zovo-btn--ghost zovo-btn--icon" aria-label="Increase duration">
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M7 3v8M3 7h8"/></svg>
  </button>
</div>
```

#### CSS

```css
/* Label */
.zovo-label {
  display: block;
  font-size: var(--zovo-text-sm);
  font-weight: var(--zovo-weight-medium);
  color: var(--zovo-text-primary);
  margin-bottom: var(--zovo-space-1);
}

/* Input Group */
.zovo-input-group {
  margin-bottom: var(--zovo-space-4);
}

/* Base Input */
.zovo-input {
  display: block;
  width: 100%;
  padding: 7px 12px;
  font-family: var(--zovo-font-family);
  font-size: var(--zovo-text-sm);
  color: var(--zovo-text-primary);
  background: var(--zovo-bg-input);
  border: 1px solid var(--zovo-border-input);
  border-radius: var(--zovo-radius-md);
  transition: border-color var(--zovo-transition-fast),
              box-shadow var(--zovo-transition-fast);
  outline: none;
}

.zovo-input::placeholder {
  color: var(--zovo-text-tertiary);
}

.zovo-input:hover {
  border-color: var(--zovo-border-strong);
}

.zovo-input:focus {
  border-color: var(--zovo-primary-500);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

/* Error State */
.zovo-input-group--error .zovo-input {
  border-color: var(--zovo-error-500);
}

.zovo-input-group--error .zovo-input:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}

.zovo-input-error {
  display: block;
  font-size: var(--zovo-text-xs);
  color: var(--zovo-text-error);
  margin-top: var(--zovo-space-1);
}

/* Search Input */
.zovo-input-search {
  position: relative;
}

.zovo-input-search__icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--zovo-text-tertiary);
  pointer-events: none;
}

.zovo-input-search .zovo-input {
  padding-left: 32px;
}

/* Toggle Switch */
.zovo-toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--zovo-space-2);
  cursor: pointer;
  user-select: none;
}

.zovo-toggle__input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.zovo-toggle__track {
  position: relative;
  width: 36px;
  height: 20px;
  background: var(--zovo-secondary-300);
  border-radius: var(--zovo-radius-full);
  transition: background var(--zovo-transition-fast);
  flex-shrink: 0;
}

.zovo-toggle__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: var(--zovo-radius-full);
  box-shadow: var(--zovo-shadow-sm);
  transition: transform var(--zovo-transition-fast);
}

.zovo-toggle__input:checked + .zovo-toggle__track {
  background: var(--zovo-primary-500);
}

.zovo-toggle__input:checked + .zovo-toggle__track .zovo-toggle__thumb {
  transform: translateX(16px);
}

.zovo-toggle__input:focus-visible + .zovo-toggle__track {
  outline: 2px solid var(--zovo-border-focus);
  outline-offset: 2px;
}

.zovo-toggle__label {
  font-size: var(--zovo-text-sm);
  color: var(--zovo-text-primary);
}

/* Checkbox */
.zovo-checkbox {
  display: inline-flex;
  align-items: center;
  gap: var(--zovo-space-2);
  cursor: pointer;
  user-select: none;
}

.zovo-checkbox__input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.zovo-checkbox__box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: 1.5px solid var(--zovo-border-strong);
  border-radius: var(--zovo-radius-sm);
  background: var(--zovo-bg-input);
  color: transparent;
  transition: all var(--zovo-transition-fast);
  flex-shrink: 0;
}

.zovo-checkbox__input:checked + .zovo-checkbox__box {
  background: var(--zovo-primary-500);
  border-color: var(--zovo-primary-500);
  color: white;
}

.zovo-checkbox__input:focus-visible + .zovo-checkbox__box {
  outline: 2px solid var(--zovo-border-focus);
  outline-offset: 2px;
}

.zovo-checkbox__label {
  font-size: var(--zovo-text-sm);
  color: var(--zovo-text-primary);
}

/* Radio */
.zovo-radio {
  display: inline-flex;
  align-items: center;
  gap: var(--zovo-space-2);
  cursor: pointer;
  user-select: none;
}

.zovo-radio__input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.zovo-radio__circle {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 1.5px solid var(--zovo-border-strong);
  border-radius: var(--zovo-radius-full);
  background: var(--zovo-bg-input);
  transition: all var(--zovo-transition-fast);
  flex-shrink: 0;
  position: relative;
}

.zovo-radio__circle::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 8px;
  height: 8px;
  border-radius: var(--zovo-radius-full);
  background: var(--zovo-primary-500);
  transform: scale(0);
  transition: transform var(--zovo-transition-fast);
}

.zovo-radio__input:checked + .zovo-radio__circle {
  border-color: var(--zovo-primary-500);
}

.zovo-radio__input:checked + .zovo-radio__circle::after {
  transform: scale(1);
}

.zovo-radio__input:focus-visible + .zovo-radio__circle {
  outline: 2px solid var(--zovo-border-focus);
  outline-offset: 2px;
}

.zovo-radio__label {
  font-size: var(--zovo-text-sm);
  color: var(--zovo-text-primary);
}

/* Select */
.zovo-select-wrap {
  position: relative;
}

.zovo-select {
  display: block;
  width: 100%;
  padding: 7px 32px 7px 12px;
  font-family: var(--zovo-font-family);
  font-size: var(--zovo-text-sm);
  color: var(--zovo-text-primary);
  background: var(--zovo-bg-input);
  border: 1px solid var(--zovo-border-input);
  border-radius: var(--zovo-radius-md);
  appearance: none;
  -webkit-appearance: none;
  outline: none;
  cursor: pointer;
  transition: border-color var(--zovo-transition-fast),
              box-shadow var(--zovo-transition-fast);
}

.zovo-select:hover {
  border-color: var(--zovo-border-strong);
}

.zovo-select:focus {
  border-color: var(--zovo-primary-500);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.zovo-select__arrow {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--zovo-text-tertiary);
  pointer-events: none;
}

/* URL Input (Focus Mode) */
.zovo-url-input {
  display: flex;
  gap: var(--zovo-space-2);
}

.zovo-url-input .zovo-input {
  flex: 1;
}

/* Timer Duration Input (Focus Mode) */
.zovo-timer-input {
  display: inline-flex;
  align-items: center;
  gap: var(--zovo-space-1);
  background: var(--zovo-bg-sunken);
  border-radius: var(--zovo-radius-lg);
  padding: var(--zovo-space-1);
}

.zovo-timer-input__field {
  width: 48px;
  text-align: center;
  font-weight: var(--zovo-weight-semibold);
  font-size: var(--zovo-text-lg);
  border: none;
  background: transparent;
  -moz-appearance: textfield;
}

.zovo-timer-input__field::-webkit-inner-spin-button,
.zovo-timer-input__field::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.zovo-timer-input__unit {
  font-size: var(--zovo-text-sm);
  color: var(--zovo-text-tertiary);
  font-weight: var(--zovo-weight-medium);
}
```

---

### 3.5 Card Component

Default card with border and padding, hover variant, stat card (for Focus Score, streak, time), and feature card (for Pro comparison). Focus Mode adds Session card, Streak card, and Sound card.

#### HTML Templates

```html
<!-- Default Card -->
<div class="zovo-card">
  <p>Basic card content</p>
</div>

<!-- Hover Card -->
<div class="zovo-card zovo-card--hover">
  <p>Card with hover effect</p>
</div>

<!-- Stat Card -->
<div class="zovo-card zovo-card--stat">
  <span class="zovo-card__stat-label">Focus Score</span>
  <span class="zovo-card__stat-value">74</span>
  <span class="zovo-card__stat-change zovo-card__stat-change--up">+5 today</span>
</div>

<!-- Feature Card (Pro comparison) -->
<div class="zovo-card zovo-card--feature">
  <div class="zovo-card__feature-icon">
    <svg width="20" height="20" fill="currentColor">...</svg>
  </div>
  <h4 class="zovo-card__feature-title">Ambient Sounds</h4>
  <p class="zovo-card__feature-desc">Play focus-enhancing soundscapes during sessions.</p>
  <span class="zovo-badge zovo-badge--pro">PRO</span>
</div>

<!-- Session Card (Focus Mode specific) -->
<div class="zovo-card zovo-card--session">
  <div class="zovo-card__session-header">
    <span class="zovo-card__session-type">Focus Session</span>
    <span class="zovo-card__session-time">25:00</span>
  </div>
  <div class="zovo-card__session-sites">
    <span class="zovo-tag">twitter.com</span>
    <span class="zovo-tag">reddit.com</span>
    <span class="zovo-tag">+3 more</span>
  </div>
  <div class="zovo-progress" role="progressbar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100">
    <div class="zovo-progress__bar" style="width: 60%"></div>
  </div>
</div>

<!-- Streak Card (Focus Mode specific) -->
<div class="zovo-card zovo-card--streak">
  <div class="zovo-card__streak-header">
    <span class="zovo-card__streak-icon" aria-hidden="true">&#128293;</span>
    <span class="zovo-card__streak-count">7</span>
    <span class="zovo-card__streak-label">day streak</span>
  </div>
  <div class="zovo-card__streak-dots" aria-label="Weekly activity: Mon active, Tue active, Wed active, Thu active, Fri active, Sat active, Sun active">
    <span class="zovo-card__streak-dot zovo-card__streak-dot--filled" aria-hidden="true"></span>
    <span class="zovo-card__streak-dot zovo-card__streak-dot--filled" aria-hidden="true"></span>
    <span class="zovo-card__streak-dot zovo-card__streak-dot--filled" aria-hidden="true"></span>
    <span class="zovo-card__streak-dot zovo-card__streak-dot--filled" aria-hidden="true"></span>
    <span class="zovo-card__streak-dot zovo-card__streak-dot--filled" aria-hidden="true"></span>
    <span class="zovo-card__streak-dot zovo-card__streak-dot--filled" aria-hidden="true"></span>
    <span class="zovo-card__streak-dot zovo-card__streak-dot--filled" aria-hidden="true"></span>
  </div>
  <span class="zovo-card__streak-best">Best: 14 days</span>
</div>

<!-- Sound Card (Focus Mode specific) -->
<div class="zovo-card zovo-card--sound">
  <div class="zovo-card__sound-info">
    <svg width="16" height="16" fill="currentColor" aria-hidden="true">...</svg>
    <span class="zovo-card__sound-name">Rain & Thunder</span>
  </div>
  <div class="zovo-card__sound-controls">
    <button class="zovo-btn zovo-btn--ghost zovo-btn--icon zovo-btn--sm" aria-label="Play Rain & Thunder">
      <svg width="12" height="12" fill="currentColor"><path d="M3 2l8 5-8 5z"/></svg>
    </button>
    <input type="range" class="zovo-slider" min="0" max="100" value="70" aria-label="Volume" />
  </div>
  <!-- Optional PRO lock overlay -->
  <div class="zovo-card__sound-lock" aria-label="Pro feature">
    <svg width="14" height="14" fill="currentColor"><path d="M7 0a4 4 0 00-4 4v2H2a1 1 0 00-1 1v6a1 1 0 001 1h10a1 1 0 001-1V7a1 1 0 00-1-1h-1V4a4 4 0 00-4-4zm2 6V4a2 2 0 10-4 0v2h4z"/></svg>
    <span>PRO</span>
  </div>
</div>
```

#### CSS

```css
/* Card Base */
.zovo-card {
  background: var(--zovo-bg-surface);
  border: 1px solid var(--zovo-border-default);
  border-radius: var(--zovo-radius-lg);
  padding: var(--zovo-space-4);
}

/* Hover Card */
.zovo-card--hover {
  cursor: pointer;
  transition: border-color var(--zovo-transition-fast),
              box-shadow var(--zovo-transition-fast);
}

.zovo-card--hover:hover {
  border-color: var(--zovo-primary-300);
  box-shadow: var(--zovo-shadow-md);
}

/* Stat Card */
.zovo-card--stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--zovo-space-3);
}

.zovo-card__stat-label {
  font-size: var(--zovo-text-xs);
  font-weight: var(--zovo-weight-medium);
  color: var(--zovo-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--zovo-space-1);
}

.zovo-card__stat-value {
  font-size: var(--zovo-text-2xl);
  font-weight: var(--zovo-weight-bold);
  color: var(--zovo-text-primary);
  line-height: 1;
}

.zovo-card__stat-change {
  font-size: var(--zovo-text-xs);
  margin-top: var(--zovo-space-1);
}

.zovo-card__stat-change--up   { color: var(--zovo-text-success); }
.zovo-card__stat-change--down { color: var(--zovo-text-error); }

/* Feature Card */
.zovo-card--feature {
  position: relative;
  text-align: center;
  padding: var(--zovo-space-5) var(--zovo-space-4);
}

.zovo-card__feature-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--zovo-radius-lg);
  background: var(--zovo-primary-100);
  color: var(--zovo-primary-500);
  margin-bottom: var(--zovo-space-3);
}

.zovo-card__feature-title {
  font-size: var(--zovo-text-md);
  font-weight: var(--zovo-weight-semibold);
  color: var(--zovo-text-primary);
  margin-bottom: var(--zovo-space-1);
}

.zovo-card__feature-desc {
  font-size: var(--zovo-text-sm);
  color: var(--zovo-text-secondary);
}

/* Session Card */
.zovo-card--session {
  padding: var(--zovo-space-3);
}

.zovo-card__session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--zovo-space-2);
}

.zovo-card__session-type {
  font-size: var(--zovo-text-sm);
  font-weight: var(--zovo-weight-semibold);
  color: var(--zovo-text-primary);
}

.zovo-card__session-time {
  font-family: var(--zovo-font-mono);
  font-size: var(--zovo-text-md);
  font-weight: var(--zovo-weight-bold);
  color: var(--zovo-primary-500);
}

.zovo-card__session-sites {
  display: flex;
  flex-wrap: wrap;
  gap: var(--zovo-space-1);
  margin-bottom: var(--zovo-space-3);
}

/* Streak Card */
.zovo-card--streak {
  text-align: center;
  padding: var(--zovo-space-4);
}

.zovo-card__streak-header {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: var(--zovo-space-1);
  margin-bottom: var(--zovo-space-3);
}

.zovo-card__streak-icon {
  font-size: var(--zovo-text-xl);
}

.zovo-card__streak-count {
  font-size: var(--zovo-text-2xl);
  font-weight: var(--zovo-weight-bold);
  color: var(--zovo-text-primary);
  line-height: 1;
}

.zovo-card__streak-label {
  font-size: var(--zovo-text-sm);
  color: var(--zovo-text-secondary);
}

.zovo-card__streak-dots {
  display: flex;
  justify-content: center;
  gap: var(--zovo-space-2);
  margin-bottom: var(--zovo-space-2);
}

.zovo-card__streak-dot {
  width: 10px;
  height: 10px;
  border-radius: var(--zovo-radius-full);
  background: var(--zovo-secondary-200);
}

.zovo-card__streak-dot--filled {
  background: var(--zovo-success-500);
}

.zovo-card__streak-best {
  font-size: var(--zovo-text-xs);
  color: var(--zovo-text-tertiary);
}

/* Sound Card */
.zovo-card--sound {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--zovo-space-3);
  position: relative;
  overflow: hidden;
}

.zovo-card__sound-info {
  display: flex;
  align-items: center;
  gap: var(--zovo-space-2);
}

.zovo-card__sound-name {
  font-size: var(--zovo-text-sm);
  font-weight: var(--zovo-weight-medium);
  color: var(--zovo-text-primary);
}

.zovo-card__sound-controls {
  display: flex;
  align-items: center;
  gap: var(--zovo-space-2);
}

/* Slider (Volume) */
.zovo-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 64px;
  height: 4px;
  background: var(--zovo-secondary-200);
  border-radius: var(--zovo-radius-full);
  outline: none;
}

.zovo-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: var(--zovo-radius-full);
  background: var(--zovo-primary-500);
  cursor: pointer;
  transition: transform var(--zovo-transition-fast);
}

.zovo-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.zovo-slider:focus-visible::-webkit-slider-thumb {
  outline: 2px solid var(--zovo-border-focus);
  outline-offset: 2px;
}

/* Sound Card PRO Lock Overlay */
.zovo-card__sound-lock {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--zovo-space-1);
  background: rgba(255, 255, 255, 0.8);
  color: var(--zovo-primary-500);
  font-size: var(--zovo-text-xs);
  font-weight: var(--zovo-weight-bold);
  cursor: pointer;
  transition: background var(--zovo-transition-fast);
}

@media (prefers-color-scheme: dark) {
  .zovo-card__sound-lock {
    background: rgba(30, 41, 59, 0.85);
  }
}

.zovo-card__sound-lock:hover {
  background: rgba(255, 255, 255, 0.9);
}
```

---

### 3.6 Modal/Dialog

Overlay with centered card. Includes header with close button, scrollable body, and action footer. Focus Mode uses this for paywall, nuclear confirmation, and streak recovery dialogs.

#### HTML Template

```html
<!-- Modal Overlay -->
<div class="zovo-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <div class="zovo-modal">
    <div class="zovo-modal__header">
      <h3 id="modal-title" class="zovo-modal__title">Confirm Nuclear Mode</h3>
      <button class="zovo-btn zovo-btn--ghost zovo-btn--icon" aria-label="Close dialog">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z"/>
        </svg>
      </button>
    </div>
    <div class="zovo-modal__body">
      <p>Nuclear Mode blocks ALL distracting sites with no way to undo for the selected duration. Are you sure?</p>
    </div>
    <div class="zovo-modal__footer">
      <button class="zovo-btn zovo-btn--secondary">Cancel</button>
      <button class="zovo-btn zovo-btn--nuclear">Activate Nuclear Mode</button>
    </div>
  </div>
</div>
```

#### CSS

```css
/* Modal Overlay */
.zovo-modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--zovo-bg-overlay);
  z-index: var(--zovo-z-modal);
  padding: var(--zovo-space-4);
  animation: zovo-fade-in 200ms ease;
}

@keyframes zovo-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* Modal Card */
.zovo-modal {
  background: var(--zovo-bg-surface);
  border-radius: var(--zovo-radius-xl);
  box-shadow: var(--zovo-shadow-xl);
  width: 100%;
  max-width: 340px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  animation: zovo-modal-enter 300ms ease-out;
}

@keyframes zovo-modal-enter {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .zovo-modal-overlay { animation: none; }
  .zovo-modal { animation: none; }
}

.zovo-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--zovo-space-4) var(--zovo-space-4) var(--zovo-space-3);
}

.zovo-modal__title {
  font-size: var(--zovo-text-md);
  font-weight: var(--zovo-weight-semibold);
  color: var(--zovo-text-primary);
}

.zovo-modal__body {
  padding: 0 var(--zovo-space-4) var(--zovo-space-4);
  overflow-y: auto;
  flex: 1;
}

.zovo-modal__body p {
  font-size: var(--zovo-text-sm);
}

.zovo-modal__footer {
  display: flex;
  gap: var(--zovo-space-2);
  justify-content: flex-end;
  padding: var(--zovo-space-3) var(--zovo-space-4);
  border-top: 1px solid var(--zovo-border-default);
}
```

---

### 3.7 Toast/Notification

Slides in from top. Four semantic variants (success, warning, error, info). Auto-dismisses after 3 seconds with manual close option.

#### HTML Template

```html
<!-- Toast Container (fixed at top) -->
<div class="zovo-toast-container" aria-live="polite" aria-atomic="true">
  <!-- Success Toast -->
  <div class="zovo-toast zovo-toast--success" role="alert">
    <svg class="zovo-toast__icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1a7 7 0 110 14A7 7 0 018 1zm2.854 4.646a.5.5 0 00-.708 0L7 8.793 5.854 7.646a.5.5 0 10-.708.708l1.5 1.5a.5.5 0 00.708 0l3.5-3.5a.5.5 0 000-.708z"/>
    </svg>
    <span class="zovo-toast__message">Session complete! Great focus.</span>
    <button class="zovo-toast__close" aria-label="Dismiss notification">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
        <path d="M3.354 3.354a.5.5 0 01.707 0L6 5.293l1.94-1.94a.5.5 0 01.707.708L6.707 6l1.94 1.94a.5.5 0 01-.707.707L6 6.707l-1.94 1.94a.5.5 0 01-.707-.707L5.293 6 3.354 4.06a.5.5 0 010-.707z"/>
      </svg>
    </button>
  </div>
</div>
```

#### CSS

```css
/* Toast Container */
.zovo-toast-container {
  position: fixed;
  top: var(--zovo-space-3);
  left: 50%;
  transform: translateX(-50%);
  z-index: var(--zovo-z-toast);
  display: flex;
  flex-direction: column;
  gap: var(--zovo-space-2);
  width: calc(var(--zovo-popup-width) - var(--zovo-space-6));
  pointer-events: none;
}

/* Toast Base */
.zovo-toast {
  display: flex;
  align-items: center;
  gap: var(--zovo-space-2);
  padding: var(--zovo-space-3);
  border-radius: var(--zovo-radius-lg);
  box-shadow: var(--zovo-shadow-lg);
  pointer-events: auto;
  animation: zovo-toast-in 300ms ease-out;
}

.zovo-toast--exiting {
  animation: zovo-toast-out 200ms ease-in forwards;
}

@keyframes zovo-toast-in {
  from {
    opacity: 0;
    transform: translateY(-100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes zovo-toast-out {
  to {
    opacity: 0;
    transform: translateY(-100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .zovo-toast,
  .zovo-toast--exiting {
    animation: none;
  }
}

/* Toast Variants */
.zovo-toast--success {
  background: var(--zovo-success-50);
  border: 1px solid var(--zovo-success-200);
  color: var(--zovo-success-700);
}

.zovo-toast--warning {
  background: var(--zovo-warning-50);
  border: 1px solid var(--zovo-warning-200);
  color: var(--zovo-warning-700);
}

.zovo-toast--error {
  background: var(--zovo-error-50);
  border: 1px solid var(--zovo-error-200);
  color: var(--zovo-error-700);
}

.zovo-toast--info {
  background: var(--zovo-info-50);
  border: 1px solid var(--zovo-info-200);
  color: var(--zovo-info-700);
}

.zovo-toast__icon {
  flex-shrink: 0;
}

.zovo-toast__message {
  flex: 1;
  font-size: var(--zovo-text-sm);
  font-weight: var(--zovo-weight-medium);
  line-height: var(--zovo-leading-tight);
}

.zovo-toast__close {
  flex-shrink: 0;
  background: none;
  border: none;
  color: inherit;
  opacity: 0.6;
  cursor: pointer;
  padding: 2px;
  border-radius: var(--zovo-radius-sm);
  transition: opacity var(--zovo-transition-fast);
}

.zovo-toast__close:hover {
  opacity: 1;
}
```

---

### 3.8 Progress Components

Linear progress bar (for timer), circular progress ring (for Focus Score), and step indicator (for onboarding).

#### HTML Templates

```html
<!-- Linear Progress Bar -->
<div class="zovo-progress" role="progressbar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100" aria-label="Focus session progress">
  <div class="zovo-progress__bar" style="width: 60%"></div>
</div>

<!-- Circular Progress Ring (Focus Score) -->
<div class="zovo-score-ring zovo-score-ring--standard" aria-label="Focus Score: 74 out of 100">
  <svg viewBox="0 0 120 120" class="zovo-score-ring__svg">
    <circle class="zovo-score-ring__track" cx="60" cy="60" r="52" />
    <circle class="zovo-score-ring__fill" cx="60" cy="60" r="52"
      stroke-dasharray="326.73"
      stroke-dashoffset="84.95"
      style="--ring-color: var(--zovo-success-500)"
    />
  </svg>
  <div class="zovo-score-ring__value">
    <span class="zovo-score-ring__number">74</span>
    <span class="zovo-score-ring__label">Focus Score</span>
  </div>
</div>

<!-- Step Indicator (Onboarding) -->
<div class="zovo-steps" role="navigation" aria-label="Onboarding progress">
  <div class="zovo-steps__item zovo-steps__item--completed" aria-label="Step 1: Complete">
    <span class="zovo-steps__dot"></span>
  </div>
  <div class="zovo-steps__connector zovo-steps__connector--filled"></div>
  <div class="zovo-steps__item zovo-steps__item--active" aria-label="Step 2: Current" aria-current="step">
    <span class="zovo-steps__dot"></span>
  </div>
  <div class="zovo-steps__connector"></div>
  <div class="zovo-steps__item" aria-label="Step 3: Upcoming">
    <span class="zovo-steps__dot"></span>
  </div>
</div>
```

#### CSS

```css
/* Linear Progress Bar */
.zovo-progress {
  width: 100%;
  height: 4px;
  background: var(--zovo-secondary-200);
  border-radius: var(--zovo-radius-full);
  overflow: hidden;
}

.zovo-progress--lg {
  height: 8px;
}

.zovo-progress__bar {
  height: 100%;
  background: var(--zovo-primary-500);
  border-radius: var(--zovo-radius-full);
  transition: width var(--zovo-transition-base);
}

/* Circular Progress Ring (Focus Score) */
.zovo-score-ring {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.zovo-score-ring--mini    { width: 40px;  height: 40px; }
.zovo-score-ring--standard { width: 120px; height: 120px; }
.zovo-score-ring--large   { width: 200px; height: 200px; }

.zovo-score-ring__svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.zovo-score-ring__track {
  fill: none;
  stroke: var(--zovo-secondary-200);
  stroke-width: 8;
}

.zovo-score-ring__fill {
  fill: none;
  stroke: var(--ring-color, var(--zovo-primary-500));
  stroke-width: 8;
  stroke-linecap: round;
  animation: zovo-ring-fill 800ms ease-in-out forwards;
}

@keyframes zovo-ring-fill {
  from { stroke-dashoffset: 326.73; }
  /* 'to' value set inline via style attribute */
}

@media (prefers-reduced-motion: reduce) {
  .zovo-score-ring__fill {
    animation: none;
  }
}

.zovo-score-ring__value {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.zovo-score-ring__number {
  font-weight: var(--zovo-weight-bold);
  color: var(--zovo-text-primary);
  line-height: 1;
}

.zovo-score-ring--mini .zovo-score-ring__number    { font-size: var(--zovo-text-xs); }
.zovo-score-ring--standard .zovo-score-ring__number { font-size: var(--zovo-text-2xl); }
.zovo-score-ring--large .zovo-score-ring__number   { font-size: 2.5rem; }

.zovo-score-ring__label {
  font-size: var(--zovo-text-xs);
  color: var(--zovo-text-tertiary);
  font-weight: var(--zovo-weight-medium);
}

.zovo-score-ring--mini .zovo-score-ring__label { display: none; }

/* Score color bands */
/* Apply via JS: set --ring-color based on score */
/* 0-20:  var(--zovo-error-500)   red    */
/* 21-40: var(--zovo-warning-500) orange */
/* 41-60: #eab308               yellow */
/* 61-80: var(--zovo-success-500) green  */
/* 81-100: var(--zovo-info-500)  blue   */

/* Step Indicator */
.zovo-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
}

.zovo-steps__item {
  display: flex;
  align-items: center;
  justify-content: center;
}

.zovo-steps__dot {
  width: 10px;
  height: 10px;
  border-radius: var(--zovo-radius-full);
  background: var(--zovo-secondary-300);
  transition: all var(--zovo-transition-fast);
}

.zovo-steps__item--active .zovo-steps__dot {
  background: var(--zovo-primary-500);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.zovo-steps__item--completed .zovo-steps__dot {
  background: var(--zovo-primary-500);
}

.zovo-steps__connector {
  width: 24px;
  height: 2px;
  background: var(--zovo-secondary-300);
}

.zovo-steps__connector--filled {
  background: var(--zovo-primary-500);
}
```

---

### 3.9 Tabs

Horizontal tab bar with active state indicated by bottom purple border. Focus Mode uses "Block", "Timer", "Stats" tabs.

#### HTML Template

```html
<div class="zovo-tabs" role="tablist" aria-label="Main navigation">
  <button class="zovo-tab zovo-tab--active" role="tab" aria-selected="true" aria-controls="panel-block" id="tab-block">
    Block
  </button>
  <button class="zovo-tab" role="tab" aria-selected="false" aria-controls="panel-timer" id="tab-timer">
    Timer
  </button>
  <button class="zovo-tab" role="tab" aria-selected="false" aria-controls="panel-stats" id="tab-stats">
    Stats
  </button>
</div>

<div class="zovo-tab-panel" role="tabpanel" id="panel-block" aria-labelledby="tab-block">
  <!-- Block tab content -->
</div>
```

#### CSS

```css
/* Tabs */
.zovo-tabs {
  display: flex;
  height: 36px;
  border-bottom: 1px solid var(--zovo-border-default);
  background: var(--zovo-bg-surface);
  flex-shrink: 0;
}

.zovo-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--zovo-space-3);
  font-family: var(--zovo-font-family);
  font-size: var(--zovo-text-sm);
  font-weight: var(--zovo-weight-medium);
  color: var(--zovo-text-secondary);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: color var(--zovo-transition-fast),
              border-color var(--zovo-transition-fast);
  margin-bottom: -1px;
}

.zovo-tab:hover {
  color: var(--zovo-text-primary);
}

.zovo-tab--active {
  color: var(--zovo-primary-500);
  border-bottom-color: var(--zovo-primary-500);
  font-weight: var(--zovo-weight-semibold);
}

.zovo-tab:focus-visible {
  outline: 2px solid var(--zovo-border-focus);
  outline-offset: -2px;
}

/* Tab Panel */
.zovo-tab-panel {
  flex: 1;
  overflow-y: auto;
  padding: var(--zovo-space-4);
}

.zovo-tab-panel[hidden] {
  display: none;
}
```

---

### 3.10 Badge/Tag

PRO badge, FREE badge, status tags (active, paused, completed), and counter badge.

#### HTML Templates

```html
<!-- PRO Badge -->
<span class="zovo-badge zovo-badge--pro">PRO</span>

<!-- FREE Badge -->
<span class="zovo-badge zovo-badge--free">FREE</span>

<!-- Status Tags -->
<span class="zovo-tag zovo-tag--active">Active</span>
<span class="zovo-tag zovo-tag--paused">Paused</span>
<span class="zovo-tag zovo-tag--completed">Completed</span>

<!-- Counter Badge -->
<span class="zovo-counter">12</span>

<!-- Domain Tag -->
<span class="zovo-tag">twitter.com</span>
```

#### CSS

```css
/* Badge */
.zovo-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  font-size: 9px;
  font-weight: var(--zovo-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: var(--zovo-radius-sm);
  line-height: 1.6;
}

.zovo-badge--pro {
  background: var(--zovo-primary-500);
  color: var(--zovo-text-inverse);
}

.zovo-badge--free {
  background: var(--zovo-success-100);
  color: var(--zovo-success-700);
}

/* Tag */
.zovo-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-size: var(--zovo-text-xs);
  font-weight: var(--zovo-weight-medium);
  border-radius: var(--zovo-radius-full);
  background: var(--zovo-secondary-100);
  color: var(--zovo-text-secondary);
  line-height: var(--zovo-leading-normal);
}

.zovo-tag--active {
  background: var(--zovo-success-100);
  color: var(--zovo-success-700);
}

.zovo-tag--paused {
  background: var(--zovo-warning-100);
  color: var(--zovo-warning-700);
}

.zovo-tag--completed {
  background: var(--zovo-secondary-100);
  color: var(--zovo-secondary-600);
}

/* Counter Badge */
.zovo-counter {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  font-size: 10px;
  font-weight: var(--zovo-weight-bold);
  color: var(--zovo-text-inverse);
  background: var(--zovo-error-500);
  border-radius: var(--zovo-radius-full);
  line-height: 1;
}
```

---

### 3.11 List Component

Site list item (favicon + domain + remove), settings list item (label + control), and feature list item (check/lock + name + Pro badge).

#### HTML Templates

```html
<!-- Site List Item -->
<div class="zovo-list-item zovo-list-item--site">
  <span class="zovo-list-item__drag" aria-hidden="true">&#8942;&#8942;</span>
  <img src="https://www.google.com/s2/favicons?domain=twitter.com&sz=16" alt="" class="zovo-list-item__favicon" width="16" height="16" />
  <span class="zovo-list-item__text">twitter.com</span>
  <span class="zovo-tag">Social</span>
  <button class="zovo-btn zovo-btn--ghost zovo-btn--icon zovo-btn--sm zovo-list-item__remove" aria-label="Remove twitter.com from blocklist">
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <path d="M3.354 3.354a.5.5 0 01.707 0L6 5.293l1.94-1.94a.5.5 0 01.707.708L6.707 6l1.94 1.94a.5.5 0 01-.707.707L6 6.707l-1.94 1.94a.5.5 0 01-.707-.707L5.293 6 3.354 4.06a.5.5 0 010-.707z"/>
    </svg>
  </button>
</div>

<!-- Blocklist at capacity (Pro upsell) -->
<div class="zovo-list-item zovo-list-item--site zovo-list-item--locked">
  <img src="" alt="" class="zovo-list-item__favicon" width="16" height="16" />
  <span class="zovo-list-item__text zovo-list-item__text--muted">Add more sites...</span>
  <span class="zovo-badge zovo-badge--pro">PRO</span>
</div>

<!-- Settings List Item -->
<div class="zovo-list-item zovo-list-item--setting">
  <div class="zovo-list-item__info">
    <span class="zovo-list-item__text">Dark mode</span>
    <span class="zovo-list-item__desc">Match system preference</span>
  </div>
  <label class="zovo-toggle">
    <input type="checkbox" class="zovo-toggle__input" />
    <span class="zovo-toggle__track"><span class="zovo-toggle__thumb"></span></span>
  </label>
</div>

<!-- Feature List Item -->
<div class="zovo-list-item zovo-list-item--feature">
  <svg class="zovo-list-item__check" width="14" height="14" fill="currentColor">
    <path d="M5.5 9.793L2.854 7.146a.5.5 0 10-.708.708l3 3a.5.5 0 00.708 0l7-7a.5.5 0 00-.708-.708L5.5 9.793z"/>
  </svg>
  <span class="zovo-list-item__text">Unlimited blocked sites</span>
  <span class="zovo-badge zovo-badge--pro">PRO</span>
</div>

<!-- Feature List Item (Free, included) -->
<div class="zovo-list-item zovo-list-item--feature">
  <svg class="zovo-list-item__check zovo-list-item__check--included" width="14" height="14" fill="currentColor">
    <path d="M5.5 9.793L2.854 7.146a.5.5 0 10-.708.708l3 3a.5.5 0 00.708 0l7-7a.5.5 0 00-.708-.708L5.5 9.793z"/>
  </svg>
  <span class="zovo-list-item__text">Basic site blocking</span>
  <span class="zovo-badge zovo-badge--free">FREE</span>
</div>
```

#### CSS

```css
/* List Item Base */
.zovo-list-item {
  display: flex;
  align-items: center;
  gap: var(--zovo-space-2);
  padding: var(--zovo-space-2) var(--zovo-space-3);
  border-radius: var(--zovo-radius-md);
  transition: background var(--zovo-transition-fast);
}

/* Site List Item */
.zovo-list-item--site:hover {
  background: var(--zovo-bg-hover);
}

.zovo-list-item__drag {
  color: var(--zovo-text-tertiary);
  font-size: var(--zovo-text-sm);
  cursor: grab;
  opacity: 0;
  transition: opacity var(--zovo-transition-fast);
  line-height: 1;
  letter-spacing: -2px;
}

.zovo-list-item--site:hover .zovo-list-item__drag {
  opacity: 1;
}

.zovo-list-item__favicon {
  width: 16px;
  height: 16px;
  border-radius: var(--zovo-radius-sm);
  flex-shrink: 0;
}

.zovo-list-item__text {
  flex: 1;
  font-size: var(--zovo-text-sm);
  color: var(--zovo-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.zovo-list-item__text--muted {
  color: var(--zovo-text-tertiary);
  font-style: italic;
}

.zovo-list-item__remove {
  opacity: 0;
  transition: opacity var(--zovo-transition-fast);
}

.zovo-list-item--site:hover .zovo-list-item__remove {
  opacity: 1;
}

/* Locked state */
.zovo-list-item--locked {
  opacity: 0.6;
  cursor: pointer;
}

.zovo-list-item--locked:hover {
  opacity: 0.8;
}

/* Settings List Item */
.zovo-list-item--setting {
  padding: var(--zovo-space-3);
  justify-content: space-between;
}

.zovo-list-item--setting + .zovo-list-item--setting {
  border-top: 1px solid var(--zovo-border-default);
  border-radius: 0;
}

.zovo-list-item__info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.zovo-list-item__desc {
  font-size: var(--zovo-text-xs);
  color: var(--zovo-text-tertiary);
}

/* Feature List Item */
.zovo-list-item--feature {
  padding: var(--zovo-space-2) 0;
}

.zovo-list-item__check {
  flex-shrink: 0;
  color: var(--zovo-primary-500);
}

.zovo-list-item__check--included {
  color: var(--zovo-success-500);
}
```

---

## 4. Focus Mode Specific Components

### 4.1 Focus Score Ring

SVG-based circular progress ring with 5 color bands that change based on score value. Animated fill on load, with three size variants.

**Color Bands (applied via JavaScript):**
| Score Range | Color Token | Visual |
|---|---|---|
| 0-20 | `--zovo-error-500` (#ef4444) | Red |
| 21-40 | `--zovo-warning-500` (#f59e0b) | Orange |
| 41-60 | `#eab308` | Yellow |
| 61-80 | `--zovo-success-500` (#10b981) | Green |
| 81-100 | `--zovo-info-500` (#3b82f6) | Blue |

**SVG Math:**
- Circle radius: 52 (for 120x120 viewBox)
- Circumference: 2 * PI * 52 = 326.73
- stroke-dashoffset = circumference - (circumference * score / 100)

**JavaScript Helper:**

```javascript
function updateFocusScore(element, score) {
  const circumference = 326.73;
  const offset = circumference - (circumference * Math.min(100, Math.max(0, score)) / 100);
  const fill = element.querySelector('.zovo-score-ring__fill');
  const number = element.querySelector('.zovo-score-ring__number');

  // Determine color band
  let color;
  if (score <= 20)      color = 'var(--zovo-error-500)';
  else if (score <= 40) color = 'var(--zovo-warning-500)';
  else if (score <= 60) color = '#eab308';
  else if (score <= 80) color = 'var(--zovo-success-500)';
  else                  color = 'var(--zovo-info-500)';

  fill.style.setProperty('--ring-color', color);
  fill.style.strokeDashoffset = offset;
  number.textContent = score;
}
```

Full CSS is specified in Section 3.8 under "Circular Progress Ring."

---

### 4.2 Timer Display

Large digit timer for popup (32px) and block page (64px). Pulsing colon separator, session type label, session count, and control buttons.

#### HTML Template

```html
<!-- Timer Display (Popup) -->
<div class="zovo-timer" aria-live="polite" aria-atomic="true">
  <div class="zovo-timer__display">
    <span class="zovo-timer__digits" aria-label="25 minutes remaining">
      <span class="zovo-timer__digit">2</span>
      <span class="zovo-timer__digit">5</span>
      <span class="zovo-timer__colon" aria-hidden="true">:</span>
      <span class="zovo-timer__digit">0</span>
      <span class="zovo-timer__digit">0</span>
    </span>
  </div>
  <div class="zovo-timer__meta">
    <span class="zovo-timer__session-type">Focus</span>
    <span class="zovo-timer__session-count">Session 1 of 4</span>
  </div>
  <div class="zovo-timer__controls">
    <button class="zovo-btn zovo-btn--secondary zovo-btn--icon" aria-label="Reset timer">
      <svg width="16" height="16" fill="currentColor"><path d="M8 2a6 6 0 00-6 6h1.5A4.5 4.5 0 018 3.5V1l3 2.5L8 6V3.5z"/></svg>
    </button>
    <button class="zovo-btn zovo-btn--focus zovo-btn--lg" aria-label="Start focus session">
      Start
    </button>
    <button class="zovo-btn zovo-btn--secondary zovo-btn--icon" aria-label="Skip to next session">
      <svg width="16" height="16" fill="currentColor"><path d="M4 3l6 5-6 5V3zm7 0v10h1.5V3H11z"/></svg>
    </button>
  </div>
</div>
```

#### CSS

```css
/* Timer Display */
.zovo-timer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--zovo-space-3);
  padding: var(--zovo-space-4) 0;
}

.zovo-timer__display {
  display: flex;
  align-items: center;
  justify-content: center;
}

.zovo-timer__digits {
  display: flex;
  align-items: center;
  font-family: var(--zovo-font-mono);
  letter-spacing: 0.02em;
}

/* Popup size */
.zovo-timer__digit {
  font-size: 32px;
  font-weight: var(--zovo-weight-bold);
  color: var(--zovo-text-primary);
  width: 22px;
  text-align: center;
  line-height: 1;
}

/* Block page size */
.zovo-timer--large .zovo-timer__digit {
  font-size: 64px;
  width: 44px;
}

/* Pulsing colon */
.zovo-timer__colon {
  font-size: 28px;
  font-weight: var(--zovo-weight-bold);
  color: var(--zovo-text-primary);
  width: 12px;
  text-align: center;
  animation: zovo-colon-pulse 1s step-start infinite;
}

.zovo-timer--large .zovo-timer__colon {
  font-size: 56px;
  width: 20px;
}

@keyframes zovo-colon-pulse {
  50% { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .zovo-timer__colon {
    animation: none;
  }
}

.zovo-timer__meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.zovo-timer__session-type {
  font-size: var(--zovo-text-sm);
  font-weight: var(--zovo-weight-semibold);
  color: var(--zovo-primary-500);
}

.zovo-timer__session-count {
  font-size: var(--zovo-text-xs);
  color: var(--zovo-text-tertiary);
}

.zovo-timer__controls {
  display: flex;
  align-items: center;
  gap: var(--zovo-space-3);
}

/* Digit flip animation */
.zovo-timer__digit--changing {
  animation: zovo-digit-flip 100ms ease-in-out;
}

@keyframes zovo-digit-flip {
  0%   { transform: translateY(0); opacity: 1; }
  50%  { transform: translateY(-4px); opacity: 0.3; }
  100% { transform: translateY(0); opacity: 1; }
}
```

---

### 4.3 Streak Display

Fire icon with days counter, weekly calendar dots, and best streak comparison. Fully specified in Section 3.5 under "Streak Card." Additional animation for the flame icon:

```css
/* Streak flame animation */
.zovo-card__streak-icon {
  display: inline-block;
  animation: zovo-flame-pulse 2s ease-in-out infinite;
}

@keyframes zovo-flame-pulse {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.1); }
}

@media (prefers-reduced-motion: reduce) {
  .zovo-card__streak-icon {
    animation: none;
  }
}
```

---

### 4.4 Blocklist Item

Fully specified in Section 3.11 under "Site List Item." Additional notes:
- Drag handle uses a 6-dot grip pattern (`&#8942;&#8942;`) that appears on hover
- Remove button fades in on hover for a clean default appearance
- When the free-tier blocklist is at capacity, the last slot shows a locked state with PRO badge prompting upgrade
- Category tags (Social, News, Entertainment, Shopping) use the `.zovo-tag` component

---

### 4.5 Sound Card

Fully specified in Section 3.5 under "Sound Card." The PRO lock overlay uses a semi-transparent backdrop with a lock icon and "PRO" text. The overlay is clickable and should trigger the paywall modal when clicked.

---

## 5. Layout Patterns

### 5.1 Popup Layout

```
┌──────────────────────────────────────┐
│ HEADER (logo + title + score + gear) │ 44px fixed
├──────────────────────────────────────┤
│ HERO SECTION                         │ variable
│ (Focus Score ring + Quick Focus btn) │
├──────────────────────────────────────┤
│ TAB BAR (Block | Timer | Stats)      │ 36px fixed
├──────────────────────────────────────┤
│ TAB CONTENT (scrollable)             │ flex: 1
│                                      │
│   - Block: URL input + site list     │
│   - Timer: timer display + controls  │
│   - Stats: score ring + streak + ... │
│                                      │
├──────────────────────────────────────┤
│ FOOTER (Zovo branding + privacy)     │ 36px fixed
└──────────────────────────────────────┘
```

#### CSS

```css
/* Popup Layout */
.zovo-popup-layout {
  display: flex;
  flex-direction: column;
  width: var(--zovo-popup-width);
  min-height: var(--zovo-popup-min-height);
  max-height: var(--zovo-popup-max-height);
  background: var(--zovo-bg-page);
  overflow: hidden;
}

.zovo-popup-layout__hero {
  padding: var(--zovo-space-4);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--zovo-space-3);
  background: var(--zovo-bg-surface);
  border-bottom: 1px solid var(--zovo-border-default);
}

.zovo-popup-layout__content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}
```

### 5.2 Options Page Layout

Full-page layout with max-width constraint, centered, and sidebar navigation on wider screens.

```css
/* Options Page Layout */
.zovo-options-layout {
  display: flex;
  min-height: 100vh;
  background: var(--zovo-bg-page);
}

.zovo-options-layout__sidebar {
  width: 220px;
  background: var(--zovo-bg-surface);
  border-right: 1px solid var(--zovo-border-default);
  padding: var(--zovo-space-4);
  flex-shrink: 0;
}

.zovo-options-layout__main {
  flex: 1;
  max-width: 800px;
  margin: 0 auto;
  padding: var(--zovo-space-6);
}

/* Sidebar navigation items */
.zovo-options-nav__item {
  display: flex;
  align-items: center;
  gap: var(--zovo-space-2);
  padding: var(--zovo-space-2) var(--zovo-space-3);
  font-size: var(--zovo-text-sm);
  font-weight: var(--zovo-weight-medium);
  color: var(--zovo-text-secondary);
  border-radius: var(--zovo-radius-md);
  cursor: pointer;
  transition: all var(--zovo-transition-fast);
  border: none;
  background: none;
  width: 100%;
  text-align: left;
}

.zovo-options-nav__item:hover {
  background: var(--zovo-bg-hover);
  color: var(--zovo-text-primary);
}

.zovo-options-nav__item--active {
  background: var(--zovo-bg-active);
  color: var(--zovo-primary-500);
  font-weight: var(--zovo-weight-semibold);
}
```

### 5.3 Block Page Layout

Full viewport with centered content and fixed footer. Used when a blocked site is accessed during a focus session.

```css
/* Block Page Layout */
.zovo-block-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--zovo-bg-page);
  padding: var(--zovo-space-6);
  text-align: center;
}

.zovo-block-layout__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--zovo-space-5);
  max-width: 480px;
}

.zovo-block-layout__title {
  font-size: var(--zovo-text-2xl);
  font-weight: var(--zovo-weight-bold);
  color: var(--zovo-text-primary);
}

.zovo-block-layout__message {
  font-size: var(--zovo-text-md);
  color: var(--zovo-text-secondary);
  max-width: 360px;
}

.zovo-block-layout__footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--zovo-space-4);
  text-align: center;
}
```

---

## 6. Animation & Transition Specs

| Animation | Duration | Easing | Description |
|---|---|---|---|
| Page transition | 200ms | ease | Tab content fade/slide |
| Button hover | 150ms | ease | Background and border color shift |
| Modal open | 300ms | ease-out | Scale 0.95 to 1, opacity 0 to 1 |
| Modal close | 200ms | ease-in | Reverse of open |
| Toast slide in | 300ms | ease-out | translateY(-100%) to translateY(0) |
| Toast slide out | 200ms | ease-in | Reverse of slide in |
| Focus Score ring fill | 800ms | ease-in-out | stroke-dashoffset animate from full to target |
| Timer digit change | 100ms | ease-in-out | Subtle vertical flip |
| Streak flame | 2s | ease-in-out | Scale pulse 1.0 to 1.1 (infinite) |
| Active session pulse | 2s | ease-in-out | Opacity and scale pulse (infinite) |
| Toggle switch | 150ms | ease | Thumb translate |
| Spinner rotation | 600ms | linear | 360deg rotation (infinite) |
| Colon pulse | 1s | step-start | Opacity toggle at 50% (infinite) |

### Global Reduced Motion Override

```css
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
```

---

## 7. Accessibility (WCAG 2.1 AA)

### 7.1 Focus Indicators

All interactive elements display a visible focus ring when navigated via keyboard:

```css
/* Global focus-visible style */
:focus-visible {
  outline: 2px solid var(--zovo-border-focus);
  outline-offset: 2px;
}

/* Remove default outline for mouse users */
:focus:not(:focus-visible) {
  outline: none;
}
```

### 7.2 Color Contrast

| Element | Foreground | Background | Ratio | Pass |
|---|---|---|---|---|
| Primary text on page bg | #1e293b | #f8fafc | 14.5:1 | AA |
| Secondary text on page bg | #475569 | #f8fafc | 7.1:1 | AA |
| Tertiary text on page bg | #94a3b8 | #f8fafc | 3.4:1 | AA (large) |
| Primary button text | #ffffff | #6366f1 | 4.6:1 | AA |
| Error text on error bg | #b91c1c | #fef2f2 | 7.2:1 | AA |
| Success text on success bg | #047857 | #ecfdf5 | 5.8:1 | AA |
| Link text on page bg | #6366f1 | #f8fafc | 4.8:1 | AA |
| Dark mode primary text | #f1f5f9 | #0f172a | 15.3:1 | AAA |
| Dark mode secondary text | #94a3b8 | #0f172a | 5.8:1 | AA |

### 7.3 ARIA Patterns

- **Tabs:** `role="tablist"`, `role="tab"`, `role="tabpanel"` with `aria-selected`, `aria-controls`, `aria-labelledby`
- **Modals:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to title ID
- **Toasts:** `aria-live="polite"`, `role="alert"` on individual toasts
- **Timer:** `aria-live="polite"`, `aria-atomic="true"` for screen reader announcements
- **Progress:** `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- **Toggle switches:** Underlying checkbox input provides semantics; visual track is `aria-hidden="true"`
- **Icon buttons:** Always include `aria-label` describing the action
- **Decorative icons:** Always include `aria-hidden="true"`

### 7.4 Keyboard Navigation

| Component | Keys | Behavior |
|---|---|---|
| Tabs | Left/Right Arrow | Move between tabs |
| Tabs | Enter/Space | Activate focused tab |
| Modal | Escape | Close modal |
| Modal | Tab | Trap focus within modal |
| Toast | Escape | Dismiss toast |
| Buttons | Enter/Space | Activate button |
| Toggle | Space | Toggle on/off |
| Checkbox | Space | Check/uncheck |
| Radio | Arrow keys | Move between options |
| Select | Arrow keys | Navigate options |
| Slider | Arrow keys | Adjust value |

### 7.5 Screen Reader Announcements

```javascript
// Utility for announcing changes to screen readers
function announce(message, priority = 'polite') {
  const el = document.createElement('div');
  el.setAttribute('role', priority === 'assertive' ? 'alert' : 'status');
  el.setAttribute('aria-live', priority);
  el.className = 'zovo-sr-only';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

// Usage examples:
// announce('Focus session started. 25 minutes remaining.');
// announce('Site blocked! twitter.com added to blocklist.');
// announce('Streak milestone! 7 day streak achieved!', 'assertive');
// announce('Session complete. Time for a break.');
```

---

## 8. Implementation Checklist

- [ ] All CSS custom properties defined in `:root` (colors, typography, spacing, radius, shadows, transitions, dimensions, z-index)
- [ ] Dark mode overrides in `@media (prefers-color-scheme: dark)` for all background, text, border, and shadow tokens
- [ ] All components use only design tokens (zero hardcoded color, spacing, or font values)
- [ ] Responsive within popup constraints (380px width, 400-600px height)
- [ ] Header component: logo, title, "by Zovo" badge, mini Focus Score, active session pulse, settings gear
- [ ] Footer component: "Built by Zovo" link, external icon, privacy badge
- [ ] Button system: primary, secondary, ghost, sm/default/lg, block, disabled, loading, icon, focus (green), nuclear (red)
- [ ] Input system: text, search, toggle, checkbox, radio, select, URL input, timer duration input
- [ ] Card system: default, hover, stat, feature, session, streak, sound
- [ ] Modal/dialog: overlay, centered card, header/body/footer, close button, enter/exit animations
- [ ] Toast notifications: 4 variants (success/warning/error/info), slide animation, auto-dismiss, dismissible
- [ ] Progress components: linear bar, circular ring (Focus Score with 5 color bands), step indicator
- [ ] Tabs: horizontal bar, active state with bottom border, keyboard navigation
- [ ] Badge/tag: PRO (purple), FREE (green), status tags, counter badge
- [ ] List items: site (favicon + domain + remove), settings (label + control), feature (check/lock + Pro badge)
- [ ] Focus Score ring: SVG-based, 3 sizes (mini/standard/large), animated fill, JS color band helper
- [ ] Timer display: monospace digits (32px popup / 64px block page), pulsing colon, session meta, controls
- [ ] Streak display: flame icon with pulse, day counter, weekly dots, best streak
- [ ] Layout patterns: popup (flex column), options page (sidebar + content), block page (centered)
- [ ] Accessibility: visible focus indicators on all interactive elements
- [ ] Accessibility: color contrast meets WCAG 2.1 AA (4.5:1 text, 3:1 UI)
- [ ] Accessibility: all icons have `aria-labels` or `aria-hidden="true"`
- [ ] Accessibility: full keyboard navigation for tabs, modals, forms, and all interactive elements
- [ ] Accessibility: screen reader announcements for timer changes, score updates, session events
- [ ] Accessibility: `@media (prefers-reduced-motion: reduce)` disables all animations
- [ ] Animation: all durations match spec table (150ms-800ms range)
- [ ] Cross-browser: tested in Chrome 116+ (primary target for Chrome extension)
- [ ] Performance: combined CSS file under 15KB minified
- [ ] Font loading: Inter loaded via Google Fonts or bundled woff2 subset

---

*Document version 1.0 -- Focus Mode - Blocker Global Styles & Component Library*
*Brand: Zovo | Generated for Phase 08: Branding & Retention System*
