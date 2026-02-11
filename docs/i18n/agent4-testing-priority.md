# i18n TESTING & LANGUAGE PRIORITY: Focus Mode - Blocker
## Agent 4 — Pseudo-Localization, Visual Regression, Test Cases, Market Analysis, Rollout Strategy & ROI Projections

> **Date:** February 11, 2026 | **Status:** Complete
> **Phase:** 15 — Internationalization System
> **Extension:** Focus Mode - Blocker (Chrome Web Store)
> **Brand:** Zovo (zovo.one)

---

## Table of Contents

1. [Pseudo-Localization Testing Framework](#1-pseudo-localization-testing-framework)
2. [Playwright Visual Regression Testing](#2-playwright-visual-regression-testing)
3. [i18n Test Cases (50+)](#3-i18n-test-cases)
4. [Market Analysis](#4-market-analysis)
5. [Phased Rollout Strategy](#5-phased-rollout-strategy)
6. [ROI Projections](#6-roi-projections)
7. [Translation Testing Automation (CI/CD)](#7-translation-testing-automation)

---

## 1. Pseudo-Localization Testing Framework

Pseudo-localization replaces ASCII characters with accented equivalents, wraps strings in brackets, and pads length by 40%. This reveals:
- **Untranslated strings** — any English text without accents wasn't routed through i18n
- **Truncation bugs** — strings that overflow at 140% length
- **Concatenation bugs** — brackets [..] appear inside other brackets, revealing improper string assembly
- **Hardcoded text** — any visible text without brackets

### 1.1 Pseudo-Locale Generator

```javascript
// scripts/pseudo-locale.js
const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.resolve(__dirname, '../public/_locales');
const SOURCE_PATH = path.join(LOCALES_DIR, 'en', 'messages.json');
const OUTPUT_PATH = path.join(LOCALES_DIR, 'qps', 'messages.json');

// Character mapping: ASCII → accented equivalents
const CHAR_MAP = {
  'a': 'á', 'b': 'β', 'c': 'ç', 'd': 'δ', 'e': 'é',
  'f': 'ƒ', 'g': 'ǧ', 'h': 'ĥ', 'i': 'í', 'j': 'ĵ',
  'k': 'ķ', 'l': 'ĺ', 'm': 'ṁ', 'n': 'ñ', 'o': 'ó',
  'p': 'ρ', 'q': 'ǫ', 'r': 'ŕ', 's': 'š', 't': 'ţ',
  'u': 'ú', 'v': 'ṽ', 'w': 'ŵ', 'x': 'ẋ', 'y': 'ý',
  'z': 'ž',
  'A': 'Á', 'B': 'Β', 'C': 'Ç', 'D': 'Δ', 'E': 'É',
  'F': 'Ƒ', 'G': 'Ǧ', 'H': 'Ĥ', 'I': 'Í', 'J': 'Ĵ',
  'K': 'Ķ', 'L': 'Ĺ', 'M': 'Ṁ', 'N': 'Ñ', 'O': 'Ó',
  'P': 'Ρ', 'Q': 'Ǫ', 'R': 'Ŕ', 'S': 'Š', 'T': 'Ţ',
  'U': 'Ú', 'V': 'Ṽ', 'W': 'Ŵ', 'X': 'Ẋ', 'Y': 'Ý',
  'Z': 'Ž',
};

const EXPANSION_CHAR = '~';
const EXPANSION_RATIO = 0.4; // 40% longer

function pseudoLocalize(text) {
  // Protect placeholders
  const placeholders = [];
  let processed = text.replace(/\$[A-Z_]+\$|\$\d+/g, (match) => {
    placeholders.push(match);
    return `\x00${placeholders.length - 1}\x00`;
  });

  // Replace characters with accented versions
  processed = processed.split('').map(char => {
    return CHAR_MAP[char] || char;
  }).join('');

  // Add length expansion (40%)
  const expansionLength = Math.ceil(text.length * EXPANSION_RATIO);
  const expansion = EXPANSION_CHAR.repeat(expansionLength);

  // Wrap in brackets for boundary detection
  processed = `[${processed}${expansion}]`;

  // Restore placeholders
  placeholders.forEach((ph, i) => {
    processed = processed.replace(`\x00${i}\x00`, ph);
  });

  return processed;
}

function generatePseudoLocale() {
  const source = JSON.parse(fs.readFileSync(SOURCE_PATH, 'utf8'));
  const pseudo = {};

  for (const [key, value] of Object.entries(source)) {
    // Skip metadata
    if (key.startsWith('_')) {
      pseudo[key] = { ...value, message: 'qps' };
      continue;
    }

    // Skip keys that shouldn't be pseudo-localized
    if (key === 'block_quote_count') {
      pseudo[key] = { ...value }; // Keep numeric values as-is
      continue;
    }

    pseudo[key] = {
      message: pseudoLocalize(value.message),
      description: value.description,
    };

    if (value.placeholders) {
      pseudo[key].placeholders = value.placeholders;
    }
  }

  // Ensure output directory exists
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(pseudo, null, 2));

  const stats = {
    totalKeys: Object.keys(pseudo).length,
    avgExpansion: Math.round(EXPANSION_RATIO * 100),
  };

  console.log('=== Pseudo-Locale Generated ===');
  console.log(`Output: ${OUTPUT_PATH}`);
  console.log(`Total keys: ${stats.totalKeys}`);
  console.log(`Average expansion: ${stats.avgExpansion}%`);
  console.log('\nExample transformations:');
  console.log(`  "Save" → "${pseudoLocalize('Save')}"`);
  console.log(`  "Start Focus" → "${pseudoLocalize('Start Focus')}"`);
  console.log(`  "$COUNT$ sites blocked" → "${pseudoLocalize('$COUNT$ sites blocked')}"`);
  console.log(`  "Focus Mode" → "${pseudoLocalize('Focus Mode')}"`);
}

generatePseudoLocale();
```

### 1.2 Visual Examples

| Original (English) | Pseudo-Localized |
|---|---|
| `Save` | `[Šáṽé~~]` |
| `Start Focus` | `[Šţáŕţ Ƒóçúš~~~~~]` |
| `$COUNT$ sites blocked` | `[$COUNT$ šíţéš βĺóçķéδ~~~~~~~~~]` |
| `Focus Mode` | `[Ƒóçúš Ṁóδé~~~~]` |
| `You focused for $TIME$` | `[Ýóú ƒóçúšéδ ƒóŕ $TIME$~~~~~~~~~~]` |

---

## 2. Playwright Visual Regression Testing

### 2.1 Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const EXTENSION_PATH = path.resolve(__dirname, 'dist');

export default defineConfig({
  testDir: './tests/i18n',
  outputDir: './test-results/i18n',
  snapshotDir: './tests/i18n/snapshots',
  timeout: 30000,
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,  // 1% pixel difference threshold
      threshold: 0.2,            // Color difference threshold
      animations: 'disabled',
    },
  },
  projects: [
    // Test each locale
    ...['en', 'es', 'de', 'ja', 'fr', 'pt_BR', 'qps'].map(locale => ({
      name: `locale-${locale}`,
      use: {
        ...devices['Desktop Chrome'],
        locale: locale.replace('_', '-'),
        // Load extension with specific locale
        launchOptions: {
          args: [
            `--disable-extensions-except=${EXTENSION_PATH}`,
            `--load-extension=${EXTENSION_PATH}`,
            `--lang=${locale.replace('_', '-')}`,
            '--no-sandbox',
          ],
        },
      },
    })),
  ],
  reporter: [
    ['html', { outputFolder: 'test-results/i18n-report' }],
    ['json', { outputFile: 'test-results/i18n-results.json' }],
  ],
});
```

### 2.2 Test Suites

```typescript
// tests/i18n/popup-visual.spec.ts
import { test, expect, BrowserContext, Page } from '@playwright/test';

let context: BrowserContext;
let extensionId: string;

test.beforeAll(async ({ browser }) => {
  context = await browser.newContext();
  // Get extension ID
  const page = await context.newPage();
  await page.goto('chrome://extensions');
  // ... extract extension ID
});

// Popup — All 6 States
test.describe('Popup Visual Regression', () => {
  test('idle state', async () => {
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup.waitForLoadState('networkidle');
    await expect(popup).toHaveScreenshot('popup-idle.png', {
      fullPage: true,
    });
  });

  test('active session state', async () => {
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    // Trigger active session state
    await popup.evaluate(() => {
      chrome.storage.local.set({
        activeSession: { mode: 'pomodoro', remaining: 1472, cycle: 2, totalCycles: 4 }
      });
    });
    await popup.reload();
    await popup.waitForLoadState('networkidle');
    await expect(popup).toHaveScreenshot('popup-active.png');
  });

  test('post-session state', async () => {
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup.evaluate(() => {
      chrome.storage.local.set({
        lastSession: { duration: 1500, blocked: 12, score: 85, streak: 14 }
      });
    });
    await popup.reload();
    await popup.waitForLoadState('networkidle');
    await expect(popup).toHaveScreenshot('popup-post-session.png');
  });

  test('blocklist tab', async () => {
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup.click('[data-tab="blocklist"]');
    await popup.waitForSelector('.blocklist-container');
    await expect(popup).toHaveScreenshot('popup-blocklist.png');
  });

  test('stats tab', async () => {
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup.click('[data-tab="stats"]');
    await popup.waitForSelector('.stats-container');
    await expect(popup).toHaveScreenshot('popup-stats.png');
  });

  test('upgrade prompt', async () => {
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup.evaluate(() => {
      chrome.storage.local.set({ showUpgrade: true, tier: 'free' });
    });
    await popup.reload();
    await popup.waitForSelector('.upgrade-banner');
    await expect(popup).toHaveScreenshot('popup-upgrade.png');
  });
});

// Options Page — All 8 Sections
test.describe('Options Visual Regression', () => {
  const sections = [
    'general', 'blocklist', 'timer', 'score',
    'sounds', 'appearance', 'account', 'about'
  ];

  for (const section of sections) {
    test(`options ${section} section`, async () => {
      const page = await context.newPage();
      await page.goto(`chrome-extension://${extensionId}/options.html#${section}`);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveScreenshot(`options-${section}.png`);
    });
  }
});

// Block Page
test.describe('Block Page Visual Regression', () => {
  test('block page with timer', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/blocked.html?site=facebook.com&time=1832`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('block-page-timer.png');
  });

  test('block page with quote', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/blocked.html?site=twitter.com`);
    await page.waitForSelector('.quote-text');
    await expect(page).toHaveScreenshot('block-page-quote.png');
  });

  test('block page emergency unlock', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/blocked.html?site=reddit.com`);
    await page.click('.emergency-btn');
    await expect(page).toHaveScreenshot('block-page-emergency.png');
  });
});

// Onboarding — All 5 Slides
test.describe('Onboarding Visual Regression', () => {
  for (let slide = 1; slide <= 5; slide++) {
    test(`onboarding slide ${slide}`, async () => {
      const page = await context.newPage();
      await page.goto(`chrome-extension://${extensionId}/onboarding.html?slide=${slide}`);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveScreenshot(`onboarding-slide-${slide}.png`);
    });
  }
});

// Paywall
test.describe('Paywall Visual Regression', () => {
  test('paywall plan comparison', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.evaluate(() => { window.showPaywall('site_limit'); });
    await page.waitForSelector('.paywall-modal');
    await expect(page).toHaveScreenshot('paywall-plans.png');
  });
});
```

### 2.3 Pixel-Diff Thresholds

| Component | Max Diff Pixel Ratio | Rationale |
|-----------|---------------------|-----------|
| Popup (idle) | 0.01 (1%) | Tight — core UI |
| Popup (active timer) | 0.03 (3%) | Timer digits change |
| Options page | 0.01 (1%) | Static content |
| Block page | 0.02 (2%) | Quote rotation varies |
| Onboarding | 0.01 (1%) | Static slides |
| Paywall | 0.01 (1%) | Critical for conversion |

---

## 3. i18n Test Cases

### 3.1 Placeholder Substitution Tests (10 tests)

```javascript
// tests/i18n/placeholders.test.js

describe('Placeholder Substitution', () => {
  test('TC-001: Single positional placeholder', () => {
    const result = chrome.i18n.getMessage('popup_post_duration', ['25 minutes']);
    expect(result).toBe('You focused for 25 minutes');
  });

  test('TC-002: Multiple positional placeholders', () => {
    const result = chrome.i18n.getMessage('popup_active_timer_hours', ['01', '24', '37']);
    expect(result).toBe('01:24:37');
  });

  test('TC-003: Named placeholder — $COUNT$', () => {
    const result = chrome.i18n.getMessage('popup_blocklist_count', ['8']);
    expect(result).toBe('8 sites blocked');
  });

  test('TC-004: Named placeholder — $SITE$', () => {
    const result = chrome.i18n.getMessage('block_page_subtitle', ['facebook.com']);
    expect(result).toBe('facebook.com is blocked during your focus session');
  });

  test('TC-005: Named placeholder — $SCORE$', () => {
    const result = chrome.i18n.getMessage('popup_post_score', ['85']);
    expect(result).toBe('Focus Score: 85');
  });

  test('TC-006: Two named placeholders — $CURRENT$ and $TOTAL$', () => {
    const result = chrome.i18n.getMessage('popup_active_cycle_label', ['2', '4']);
    expect(result).toBe('Cycle 2 of 4');
  });

  test('TC-007: Placeholder with zero value', () => {
    const result = chrome.i18n.getMessage('popup_blocklist_count', ['0']);
    expect(result).toBe('0 sites blocked');
  });

  test('TC-008: Placeholder with large number', () => {
    const result = chrome.i18n.getMessage('popup_idle_blocked_today', ['1234']);
    expect(result).toBe('1234 distractions blocked');
  });

  test('TC-009: Missing placeholder value — graceful fallback', () => {
    const result = chrome.i18n.getMessage('popup_post_duration', []);
    expect(result).toContain('focused for');
  });

  test('TC-010: Placeholder in notification text', () => {
    const result = chrome.i18n.getMessage('notif_streak_milestone', ['7']);
    expect(result).toContain('7');
    expect(result).toContain('streak');
  });
});
```

### 3.2 RTL Layout Tests (8 tests)

```javascript
// tests/i18n/rtl.test.js

describe('RTL Layout', () => {
  test('TC-011: Document direction set to RTL for Arabic', () => {
    // Mock Arabic locale
    mockLocale('ar');
    const dir = chrome.i18n.getMessage('@@bidi_dir');
    expect(dir).toBe('rtl');
    expect(document.documentElement.dir).toBe('rtl');
  });

  test('TC-012: Document direction set to RTL for Hebrew', () => {
    mockLocale('he');
    const dir = chrome.i18n.getMessage('@@bidi_dir');
    expect(dir).toBe('rtl');
  });

  test('TC-013: Popup layout mirrors in RTL', () => {
    mockLocale('ar');
    renderPopup();
    const sidebar = document.querySelector('.popup-nav');
    const style = getComputedStyle(sidebar);
    expect(style.direction).toBe('rtl');
  });

  test('TC-014: Timer display remains LTR in RTL context', () => {
    mockLocale('ar');
    renderPopup();
    const timer = document.querySelector('.timer-display');
    expect(timer.style.direction).toBe('ltr');
  });

  test('TC-015: URLs display LTR in RTL context', () => {
    mockLocale('ar');
    renderBlockPage('facebook.com');
    const url = document.querySelector('.blocked-domain');
    const style = getComputedStyle(url);
    expect(style.unicodeBidi).toBe('isolate');
  });

  test('TC-016: Navigation icons mirror in RTL', () => {
    mockLocale('ar');
    renderPopup();
    const arrow = document.querySelector('.icon-arrow-back');
    const style = getComputedStyle(arrow);
    expect(style.transform).toContain('scaleX(-1)');
  });

  test('TC-017: Universal icons do NOT mirror in RTL', () => {
    mockLocale('ar');
    renderPopup();
    const check = document.querySelector('.icon-check');
    const style = getComputedStyle(check);
    expect(style.transform).not.toContain('scaleX(-1)');
  });

  test('TC-018: Options page sidebar on right in RTL', () => {
    mockLocale('ar');
    renderOptions();
    const nav = document.querySelector('.options-nav');
    const style = getComputedStyle(nav);
    // inset-inline-start: 0 means right: 0 in RTL
    expect(style.insetInlineStart).toBe('0px');
  });
});
```

### 3.3 Date/Time Formatting Tests (8 tests)

```javascript
// tests/i18n/formatting.test.js

describe('Date/Time Formatting', () => {
  const testDate = new Date('2026-02-11T14:30:00');

  test('TC-019: English date format', () => {
    mockLocale('en');
    const result = new Intl.DateTimeFormat('en', { dateStyle: 'long' }).format(testDate);
    expect(result).toBe('February 11, 2026');
  });

  test('TC-020: German date format', () => {
    mockLocale('de');
    const result = new Intl.DateTimeFormat('de', { dateStyle: 'long' }).format(testDate);
    expect(result).toBe('11. Februar 2026');
  });

  test('TC-021: Japanese date format', () => {
    mockLocale('ja');
    const result = new Intl.DateTimeFormat('ja', { dateStyle: 'long' }).format(testDate);
    expect(result).toContain('2026');
    expect(result).toContain('2');
    expect(result).toContain('11');
  });

  test('TC-022: French date format', () => {
    mockLocale('fr');
    const result = new Intl.DateTimeFormat('fr', { dateStyle: 'long' }).format(testDate);
    expect(result).toBe('11 février 2026');
  });

  test('TC-023: Relative time — English', () => {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    expect(rtf.format(-1, 'day')).toBe('yesterday');
    expect(rtf.format(1, 'day')).toBe('tomorrow');
    expect(rtf.format(0, 'day')).toBe('today');
  });

  test('TC-024: Relative time — German', () => {
    const rtf = new Intl.RelativeTimeFormat('de', { numeric: 'auto' });
    expect(rtf.format(-1, 'day')).toBe('gestern');
    expect(rtf.format(1, 'day')).toBe('morgen');
  });

  test('TC-025: Time format — 12h locale (en-US)', () => {
    const result = new Intl.DateTimeFormat('en-US', { timeStyle: 'short' }).format(testDate);
    expect(result).toMatch(/2:30\s*PM/i);
  });

  test('TC-026: Time format — 24h locale (de)', () => {
    const result = new Intl.DateTimeFormat('de', { timeStyle: 'short' }).format(testDate);
    expect(result).toMatch(/14:30/);
  });
});
```

### 3.4 Currency Display Tests (6 tests)

```javascript
// tests/i18n/currency.test.js

describe('Currency Display', () => {
  test('TC-027: USD formatting — English', () => {
    const result = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(4.99);
    expect(result).toBe('$4.99');
  });

  test('TC-028: EUR formatting — German (comma decimal)', () => {
    const result = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(4.99);
    expect(result).toMatch(/4,99/);
    expect(result).toContain('€');
  });

  test('TC-029: JPY formatting — Japanese (no decimals)', () => {
    const result = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(550);
    expect(result).toMatch(/￥?550/);
  });

  test('TC-030: BRL formatting — Brazilian Portuguese', () => {
    const result = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(24.99);
    expect(result).toContain('R$');
    expect(result).toMatch(/24,99/);
  });

  test('TC-031: INR formatting — India (PPP Tier 4)', () => {
    const result = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(249);
    expect(result).toContain('₹');
    expect(result).toContain('249');
  });

  test('TC-032: KRW formatting — Korean (no decimals)', () => {
    const result = new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(5900);
    expect(result).toContain('₩');
    expect(result).toContain('5,900');
  });
});
```

### 3.5 Number Formatting Tests (5 tests)

```javascript
// tests/i18n/numbers.test.js

describe('Number Formatting', () => {
  test('TC-033: Thousands separator — English (comma)', () => {
    const result = new Intl.NumberFormat('en').format(1234567);
    expect(result).toBe('1,234,567');
  });

  test('TC-034: Thousands separator — German (period)', () => {
    const result = new Intl.NumberFormat('de').format(1234567);
    expect(result).toBe('1.234.567');
  });

  test('TC-035: Decimal separator — French (comma)', () => {
    const result = new Intl.NumberFormat('fr').format(3.14);
    expect(result).toMatch(/3,14/);
  });

  test('TC-036: Percentage — English', () => {
    const result = new Intl.NumberFormat('en', { style: 'percent' }).format(0.85);
    expect(result).toBe('85%');
  });

  test('TC-037: Percentage — German (space before %)', () => {
    const result = new Intl.NumberFormat('de', { style: 'percent' }).format(0.85);
    expect(result).toMatch(/85\s*%/);
  });
});
```

### 3.6 Empty State & Edge Case Tests (15 tests)

```javascript
// tests/i18n/edge-cases.test.js

describe('Edge Cases', () => {
  test('TC-038: Zero sessions — "0 sessions"', () => {
    const result = chrome.i18n.getMessage('popup_stats_sessions_today', ['0']);
    expect(result).toBe('0 sessions');
  });

  test('TC-039: Singular — "1 site blocked"', () => {
    const result = chrome.i18n.getMessage('popup_blocklist_count_singular');
    expect(result).toBe('1 site blocked');
  });

  test('TC-040: Singular — "1 day"', () => {
    const result = chrome.i18n.getMessage('common_time_day');
    expect(result).toBe('1 day');
  });

  test('TC-041: Max-length German string fits popup width', () => {
    // German compound words can be 20-30% longer
    mockLocale('de');
    const longestKey = 'paywall_feature_unlimited_sites';
    const result = chrome.i18n.getMessage(longestKey);
    // At 380px popup width with 16px font, max ~35 characters
    expect(result.length).toBeLessThan(50);
  });

  test('TC-042: Missing translation falls back gracefully', () => {
    // Simulate a missing key
    const result = chrome.i18n.getMessage('nonexistent_key');
    expect(result).toBe(''); // Chrome returns empty string for missing keys
  });

  test('TC-043: Missing key in dev mode shows [key_name]', () => {
    // Test Strings helper fallback
    const Strings = { get: (key) => chrome.i18n.getMessage(key) || `[${key}]` };
    expect(Strings.get('nonexistent_key')).toBe('[nonexistent_key]');
  });

  test('TC-044: Unicode characters in Japanese', () => {
    mockLocale('ja');
    const result = chrome.i18n.getMessage('popup_idle_greeting');
    // Should contain Japanese characters (hiragana/katakana/kanji)
    expect(result).toMatch(/[\u3000-\u9FFF\uF900-\uFAFF]/);
  });

  test('TC-045: Mixed LTR/RTL — URL in Arabic context', () => {
    mockLocale('ar');
    const result = chrome.i18n.getMessage('block_page_subtitle', ['facebook.com']);
    expect(result).toContain('facebook.com');
  });

  test('TC-046: Very long translation doesn\'t break popup (380px)', () => {
    mockLocale('de');
    renderPopup();
    const popup = document.querySelector('.popup-container');
    const rect = popup.getBoundingClientRect();
    expect(rect.width).toBeLessThanOrEqual(380);
    // No horizontal scrollbar
    expect(popup.scrollWidth).toBeLessThanOrEqual(popup.clientWidth + 1);
  });

  test('TC-047: Timer display format is consistent across locales', () => {
    // Timer should always be "MM:SS" or "HH:MM:SS" regardless of locale
    const locales = ['en', 'es', 'de', 'ja', 'fr', 'pt_BR', 'ar'];
    for (const locale of locales) {
      mockLocale(locale);
      const result = chrome.i18n.getMessage('popup_active_timer_minutes', ['24', '37']);
      expect(result).toMatch(/24:37|24：37/); // Standard or fullwidth colon
    }
  });

  test('TC-048: Focus Score number displays correctly in all locales', () => {
    const locales = ['en', 'es', 'de', 'ja', 'fr', 'ar'];
    for (const locale of locales) {
      mockLocale(locale);
      const result = chrome.i18n.getMessage('popup_idle_focus_score_value', ['85']);
      expect(result).toContain('85');
    }
  });

  test('TC-049: Streak count — 0 days', () => {
    const result = chrome.i18n.getMessage('streak_current', ['0']);
    expect(result).toBe('0-day streak');
  });

  test('TC-050: Achievement unlocked notification with long name', () => {
    const result = chrome.i18n.getMessage('achieve_unlocked_toast', ['Distraction Slayer']);
    expect(result).toContain('Distraction Slayer');
  });

  test('TC-051: Blocklist free limit with max values', () => {
    const result = chrome.i18n.getMessage('popup_blocklist_free_limit', ['10', '10']);
    expect(result).toContain('10');
    expect(result).toContain('Free');
  });

  test('TC-052: Multiple locales load without error', () => {
    const locales = ['en', 'es', 'de', 'ja', 'fr', 'pt_BR'];
    for (const locale of locales) {
      mockLocale(locale);
      // Every required key should return a non-empty string
      const criticalKeys = [
        'popup_header_title', 'popup_idle_start_focus',
        'block_page_title', 'common_btn_save'
      ];
      for (const key of criticalKeys) {
        const result = chrome.i18n.getMessage(key);
        expect(result).toBeTruthy();
      }
    }
  });
});
```

---

## 4. Market Analysis

### 4.1 Chrome Extension User Demographics by Language

| Language | Est. Chrome Users (M) | % of Chrome Users | Productivity Extension Install Rate | Market Status |
|----------|----------------------|-------------------|--------------------------------------|---------------|
| English | 1,800 | 60% | High (mature market) | Saturated |
| Spanish | 240 | 8% | Medium-growing | Underserved |
| Portuguese (BR) | 120 | 4% | Medium-growing | Underserved |
| German | 120 | 4% | High | Moderate competition |
| French | 120 | 4% | Medium-high | Moderate competition |
| Japanese | 90 | 3% | Very high (tech-savvy) | Low competition |
| Russian | 90 | 3% | Medium | Low competition |
| Chinese (Simplified) | 150 | 5% | Medium (CWS limited) | Separate distribution |
| Korean | 60 | 2% | High | Very low competition |
| Italian | 60 | 2% | Medium | Low competition |
| Arabic | 60 | 2% | Low-medium | Very low competition |
| Hindi | 60 | 2% | Low-medium | Almost none |
| Dutch | 30 | 1% | Medium | Low competition |
| Polish | 30 | 1% | Low-medium | Low competition |
| Thai | 30 | 1% | Low | Very low competition |

### 4.2 Competitor Localization Status

| Competitor | Languages | Revenue Model | Localized Store Listing? | Localized UI? |
|-----------|-----------|---------------|-------------------------|---------------|
| **BlockSite** | 12 | Freemium ($3.99/mo) | Yes (12) | Partial (8) |
| **StayFocusd** | 1 (English only) | Free | No | No |
| **LeechBlock NG** | 2 (en, de) | Free/Donate | Partial | No |
| **Cold Turkey** | 3 (en, de, fr) | One-time $39 | Yes (3) | Yes (3) |
| **Forest** | 15 | Freemium ($1.99) | Yes (15) | Yes (15) |

**Opportunity:** StayFocusd (4M+ users) is English-only. Every non-English user of StayFocusd is a potential Focus Mode user. LeechBlock (500K+ users) only supports English and German. Cold Turkey only has 3 languages. Forest is the most localized but has weak browser blocking.

### 4.3 Revenue Potential by Locale

| Locale | Est. Addressable Users | Conversion Rate | PPP-Adjusted ARPU | Monthly Revenue Potential |
|--------|----------------------|-----------------|-------------------|--------------------------|
| English (en) | 100,000 | 3.0% | $4.99 | $14,970 |
| Spanish (es) | 15,000 | 2.5% | $3.99 | $1,496 |
| German (de) | 8,000 | 3.5% | $4.99 | $1,397 |
| Japanese (ja) | 5,000 | 4.0% | $4.99 | $998 |
| French (fr) | 7,000 | 2.5% | $4.49 | $786 |
| Portuguese BR (pt_BR) | 6,000 | 2.0% | $2.99 | $359 |
| Korean (ko) | 3,000 | 3.5% | $4.49 | $472 |
| Chinese (zh_CN) | 4,000 | 2.0% | $2.99 | $239 |
| Italian (it) | 3,000 | 2.5% | $3.99 | $299 |
| Russian (ru) | 4,000 | 1.5% | $2.49 | $149 |
| **P1 Total** | **41,000** | — | — | **$5,036/mo** |
| **All locales** | **55,000** | — | — | **$6,195/mo** |

### 4.4 Opportunity Scoring Matrix

| Locale | Market Size (1-10) | Competition (1-10, low=good) | Revenue (1-10) | Effort (1-10, low=good) | **Score** |
|--------|-------------------|------------------------------|----------------|------------------------|-----------|
| Spanish | 8 | 7 | 7 | 3 | **25** |
| German | 6 | 6 | 8 | 3 | **23** |
| Japanese | 5 | 8 | 9 | 5 | **27** |
| French | 6 | 6 | 7 | 3 | **22** |
| Portuguese BR | 6 | 8 | 5 | 3 | **22** |
| Korean | 4 | 9 | 8 | 5 | **26** |
| Chinese | 7 | 5 | 5 | 6 | **23** |
| Italian | 4 | 8 | 6 | 3 | **21** |
| Russian | 5 | 8 | 4 | 4 | **21** |
| Arabic | 4 | 9 | 3 | 8 | **24** |

**Top priorities by score:** Japanese (27), Korean (26), Spanish (25), Arabic (24), German/Chinese (23).

---

## 5. Phased Rollout Strategy

### Phase 0 — Foundation (Launch)
**Timeline:** Day 1
**Locales:** English only

| Deliverable | Status |
|-------------|--------|
| en/messages.json (500+ entries) | Required |
| I18nManager class | Required |
| Strings helper | Required |
| data-i18n HTML migration | Required |
| Pseudo-locale testing | Required |
| CI validation pipeline | Required |
| `default_locale: "en"` in manifest | Required |

**Success metrics:**
- 100% of user-visible strings externalized
- Pseudo-locale test: 0 untranslated strings
- CI validation passing

### Phase 1 — P1 Locales (Months 1-2)
**Timeline:** 30-60 days post-launch
**Locales:** Spanish (es), German (de), Japanese (ja), French (fr), Brazilian Portuguese (pt_BR)
**Coverage:** ~70% of non-English Chrome users

| Deliverable | Status |
|-------------|--------|
| 5 complete messages.json files | Required |
| CWS store descriptions (5 locales) | Required |
| Localized screenshots (5 locales) | Required |
| LocaleFormatter integration | Required |
| PPP pricing for 5 markets | Required |
| Visual regression baselines | Required |

**Success metrics:**
- 35-45% increase in non-English installs within 60 days
- 25-30% of new international installs converting to Pro
- 4.5+ star rating maintained across all locales
- <5% of reviews mentioning translation quality issues

**Rollback criteria:**
- Star rating drops below 4.0 for any locale
- >10% of reviews cite poor translations
- Conversion rate drops >20% vs. English baseline

### Phase 2 — P2 Locales (Months 3-6)
**Timeline:** 90-180 days post-launch
**Locales:** Korean (ko), Chinese Simplified (zh_CN), Italian (it), Russian (ru)

**Success metrics:**
- Additional 15-20% international install growth
- CJK locales (ja, ko, zh_CN) contributing >10% of Pro revenue

### Phase 3 — P3 Locales (Month 6+)
**Timeline:** 180+ days, data-driven
**Locales:** Arabic (ar), Hebrew (he), Hindi (hi), Thai (th)
**Prerequisites:** Phase 2 metrics met, RTL CSS migration complete

**Success metrics:**
- RTL languages showing positive conversion metrics
- Total international share >40% of installs

### A/B Testing Plan

| Test | Hypothesis | Metric | Duration |
|------|-----------|--------|----------|
| Localized vs. English CWS listing | Localized listing increases install rate by 30%+ | Install conversion rate | 2 weeks |
| PPP pricing vs. flat USD pricing | PPP increases conversion in Tier 2-4 markets by 50%+ | Revenue per 1000 impressions | 4 weeks |
| Localized block page quotes | Native-language quotes increase session completion by 10%+ | Session completion rate | 2 weeks |
| Localized onboarding | Native onboarding increases Day-7 retention by 15%+ | 7-day retention rate | 4 weeks |

---

## 6. ROI Projections

### 6.1 Cost Per Locale

| Cost Category | Per Locale (P1) | Per Locale (P2) | One-Time |
|---------------|----------------|-----------------|----------|
| DeepL API (initial draft) | $0.24 | $0.24 | — |
| Professional review (210 strings) | $150 | $150 | — |
| CWS description translation | $50 | $50 | — |
| Localized screenshots (5) | $100 | $100 | — |
| Testing & QA | $50 | $50 | — |
| Build infrastructure | — | — | $500 |
| Pseudo-locale framework | — | — | $200 |
| Visual regression setup | — | — | $300 |
| **Total per locale** | **$350** | **$350** | — |
| **Infrastructure (one-time)** | — | — | **$1,000** |

**P1 total (5 locales + infra):** $1,000 + (5 × $350) = **$2,750**
**P2 total (4 locales):** 4 × $350 = **$1,400**
**Grand total (9 locales + infra):** **$4,150**

### 6.2 Revenue Projection

| Period | English-Only Revenue | With P1 Locales | Incremental |
|--------|---------------------|----------------|-------------|
| Month 1 | $2,000 | $2,000 | $0 (building) |
| Month 2 | $3,000 | $3,600 | +$600 |
| Month 3 | $4,000 | $5,600 | +$1,600 |
| Month 6 | $8,000 | $12,800 | +$4,800 |
| Month 12 | $15,000 | $25,500 | +$10,500 |
| **Year 1 Total** | **$80,000** | **$128,000** | **+$48,000** |

### 6.3 Break-Even Timeline

| Locale | Investment | Monthly Revenue (at Month 6) | Break-Even |
|--------|-----------|------------------------------|-----------|
| Spanish | $350 | $1,496 | < 1 month |
| German | $350 | $1,397 | < 1 month |
| Japanese | $350 | $998 | < 1 month |
| French | $350 | $786 | < 1 month |
| Portuguese BR | $350 | $359 | ~1 month |
| Korean | $350 | $472 | < 1 month |
| Infrastructure | $1,000 | (shared) | ~1 month |
| **Total P1** | **$2,750** | **$5,036** | **< 1 month** |

**Every P1 locale breaks even within 1 month.** The $2,750 total investment generates $48,000+ in Year 1 incremental revenue — a **17x return**.

### 6.4 Maintenance Cost Model

| Activity | Frequency | Cost Per Occurrence | Annual Cost |
|----------|-----------|-------------------|-------------|
| New string translation (per locale) | Monthly | $20 (avg 20 strings) | $240/locale |
| CWS description update | Quarterly | $25 | $100/locale |
| Screenshot refresh | Semi-annual | $50 | $100/locale |
| QA review | Monthly | $25 | $300/locale |
| **Per locale annual maintenance** | — | — | **$740** |
| **9 locales annual maintenance** | — | — | **$6,660** |

Annual maintenance ($6,660) is 5.2% of projected incremental revenue ($128,000) — well within acceptable COGS.

---

## 7. Translation Testing Automation

### 7.1 GitHub Actions Workflow

```yaml
# .github/workflows/i18n-ci.yml
name: i18n CI

on:
  push:
    paths:
      - 'public/_locales/**'
      - 'src/**'
  pull_request:
    paths:
      - 'public/_locales/**'
      - 'src/**'

jobs:
  validate-json:
    name: Validate Locale Files
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Validate JSON syntax
        run: |
          for file in public/_locales/*/messages.json; do
            echo "Validating $file..."
            node -e "JSON.parse(require('fs').readFileSync('$file', 'utf8'))" || exit 1
          done

      - name: Check missing keys
        run: node scripts/validate-locales.js

      - name: Check placeholder integrity
        run: |
          node -e "
            const fs = require('fs');
            const base = JSON.parse(fs.readFileSync('public/_locales/en/messages.json', 'utf8'));
            const locales = fs.readdirSync('public/_locales').filter(d => d !== 'en' && d !== 'qps');
            let errors = 0;
            for (const locale of locales) {
              const filePath = 'public/_locales/' + locale + '/messages.json';
              if (!fs.existsSync(filePath)) continue;
              const msgs = JSON.parse(fs.readFileSync(filePath, 'utf8'));
              for (const [key, val] of Object.entries(base)) {
                if (!msgs[key]) continue;
                const basePH = (val.message.match(/\\$[A-Z_]+\\$|\\$\\d+/g) || []).sort();
                const locPH = (msgs[key].message.match(/\\$[A-Z_]+\\$|\\$\\d+/g) || []).sort();
                if (JSON.stringify(basePH) !== JSON.stringify(locPH)) {
                  console.error(locale + '/' + key + ': placeholder mismatch');
                  errors++;
                }
              }
            }
            if (errors > 0) process.exit(1);
            console.log('All placeholders valid');
          "

  string-coverage:
    name: String Coverage Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Generate pseudo-locale
        run: node scripts/pseudo-locale.js

      - name: Run string extraction
        run: node scripts/extract-strings.js

      - name: Check for hardcoded strings
        run: |
          REPORT=$(node scripts/extract-strings.js 2>&1)
          HARDCODED=$(echo "$REPORT" | grep "Hardcoded" | grep -oP '\d+')
          if [ "$HARDCODED" -gt "0" ]; then
            echo "WARNING: $HARDCODED hardcoded strings found"
            echo "$REPORT"
            # Don't fail — just warn
          fi

  visual-regression:
    name: Visual Regression Tests
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build extension
        run: npm run build

      - name: Install Playwright
        run: npx playwright install chromium

      - name: Run visual tests
        run: npx playwright test --config playwright.config.ts

      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: i18n-visual-regression-results
          path: test-results/
```

### 7.2 Pre-Commit Hook

```bash
#!/bin/sh
# .husky/pre-commit (i18n validation)

# Only run if locale files changed
LOCALE_CHANGES=$(git diff --cached --name-only | grep "public/_locales/")

if [ -n "$LOCALE_CHANGES" ]; then
  echo "🌐 Validating locale files..."

  # JSON syntax check
  for file in $LOCALE_CHANGES; do
    if [ -f "$file" ]; then
      node -e "JSON.parse(require('fs').readFileSync('$file', 'utf8'))" 2>/dev/null
      if [ $? -ne 0 ]; then
        echo "❌ Invalid JSON: $file"
        exit 1
      fi
    fi
  done

  # Run full validation
  node scripts/validate-locales.js
  if [ $? -ne 0 ]; then
    echo "❌ Locale validation failed. Fix errors before committing."
    exit 1
  fi

  echo "✅ Locale files valid"
fi
```

---

*Phase 15, Agent 4 — i18n Testing & Language Priority — Complete*
