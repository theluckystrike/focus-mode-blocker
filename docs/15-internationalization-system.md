# INTERNATIONALIZATION SYSTEM: Focus Mode - Blocker
## Phase 15 Output — i18n Architecture, Translation Workflow, Locale Features, Testing Strategy & Sample Translations

> **Date:** February 11, 2026 | **Status:** Complete
> **Input:** Phases 01-14

---

## Overview

Phase 15 delivers a complete internationalization (i18n) system for Focus Mode - Blocker, produced by five specialized agents. The output spans the full localization lifecycle: a Chrome-native i18n architecture built on `chrome.i18n.getMessage()` with a 500+ entry master English messages.json, an I18nManager class for DOM localization, and service worker + content script integration patterns; a translation workflow powered by DeepL API for initial drafts and Crowdin for community review, with full RTL support for Arabic and Hebrew including CSS logical property migration and bidirectional text handling; locale-specific features including `Intl`-based date/time/number formatting, purchasing-power-parity pricing for 6 tiers, regional blocklist presets, and Chrome Web Store descriptions in 6 languages with localized keyword strategies; a testing framework combining pseudo-localization for string coverage, Playwright-based visual regression for layout validation, and 50+ i18n-specific test cases, backed by market analysis and a phased rollout strategy projecting 35-45% international user growth; and complete, production-ready translations for 5 P1 locales (Spanish, German, Japanese, French, Brazilian Portuguese) with 210+ entries each, plus integration architecture showing how i18n connects to every existing module and a step-by-step migration guide. Brand terms (Focus Mode, Focus Score, Nuclear Mode, Zovo, Pro) are never translated across all locales, preserving brand recognition while making every other string accessible to non-English speakers.

---

## Agent Deliverables

### Agent 1 — i18n Architecture & Implementation Patterns
**File:** `docs/i18n/agent1-architecture-patterns.md`

- Complete `_locales/en/messages.json` master file with 500+ entries covering all 6 UI surfaces (popup, options, block page, onboarding, notifications, paywall) plus errors, achievements, streaks, and common UI strings
- Message key naming convention: `{context}_{section}_{element}` in snake_case with consistent prefixes for each UI surface
- `I18nManager` class specification: DOM-based localization via `data-i18n`, `data-i18n-placeholder`, `data-i18n-title`, and `data-i18n-aria` attributes with automatic document direction setting
- `Strings` helper module: thin wrapper around `chrome.i18n.getMessage()` with development fallback that renders missing keys as `[key_name]` for easy identification
- Service worker i18n patterns: notification text localization, badge text for non-numeric states, error message dispatch
- Content script i18n: block page rendering with localized text inside shadow DOM, motivational quote rotation system using indexed message keys, `@@bidi_dir` integration for direction-aware layouts
- Placeholder system design: positional (`$1`, `$2`) and named (`$PLACEHOLDER$`) substitutions with JSON-defined examples for translator context

### Agent 2 — Translation Workflow & RTL Support
**File:** `docs/i18n/agent2-translation-rtl.md`

- String extraction pipeline: AST-based scanner for JavaScript source files that identifies `textContent`, `innerHTML`, template literals, and notification text, outputting a categorized string inventory with suggested message keys
- DeepL API integration for initial machine translation drafts with glossary support to protect brand terms from translation
- Crowdin project configuration for community translation management with approval workflows, translation memory, and context screenshots
- RTL support architecture: CSS migration from physical properties (`margin-left`, `padding-right`) to logical properties (`margin-inline-start`, `padding-inline-end`) for seamless LTR/RTL switching
- Bidirectional text handling: Unicode bidi control characters for mixed-direction content, `dir="auto"` for user-generated content (URLs in RTL context)
- Build pipeline integration: locale file copying to dist, translation completeness validation during CI, automated JSON syntax checking

### Agent 3 — Locale Features & Store Listing
**File:** `docs/i18n/agent3-locale-features-store.md`

- `LocaleFormatter` class: `Intl.DateTimeFormat`, `Intl.NumberFormat`, `Intl.RelativeTimeFormat` wrappers for locale-aware date, time, number, and currency display
- Purchasing-power-parity (PPP) pricing: 6 pricing tiers mapped to country groups, with Pro monthly ranging from $1.99 (Tier 6, lowest GDP) to $4.99 (Tier 1, US/EU/Japan) and lifetime from $19.99 to $49.99, all served via server-side geo-lookup
- Regional blocklist presets: locale-specific default blocked sites (e.g., VK for Russian locales, LINE for Japanese, Globo for Brazilian Portuguese) supplementing the universal presets (Facebook, YouTube, Twitter, Reddit)
- Chrome Web Store descriptions in 6 languages: full 16,000-character detailed descriptions, 132-character short descriptions, and 45-character titles optimized for each locale's CWS search behavior
- Regional keyword strategies: locale-specific ASO keywords targeting local search terms (e.g., "Webseiten Blocker" for German, "bloqueur de sites" for French, "ウェブサイトブロッカー" for Japanese)
- First-day-of-week configuration: Monday default for European locales, Sunday for US/Japan, Saturday for Middle Eastern locales

### Agent 4 — Testing & Language Priority
**File:** `docs/i18n/agent4-testing-priority.md`

- Pseudo-localization testing framework: auto-generated pseudo-locale that wraps all strings in accent characters and extends length by 40%, revealing untranslated strings, truncation issues, and concatenation bugs
- Playwright-based visual regression testing: automated screenshot comparison across all 6 locales for popup (6 states), options (8 sections), block page, onboarding (5 slides), and paywall, with configurable pixel-diff thresholds
- 50+ i18n-specific test cases covering placeholder substitution, RTL layout, date/time formatting, currency display, empty-state messages, notification text, and edge cases (zero counts, singular/plural, maximum-length strings)
- Market analysis: Chrome extension user demographics by language, productivity extension install rates per market, revenue potential by locale factoring in PPP pricing
- Phased rollout strategy: P0 (English only at launch), P1 (es, de, ja, fr, pt_BR within 2 months), P2 (ko, zh_CN, it, ru within 6 months), P3 (ar, he, hi, th, additional locales as data warrants)
- ROI projections: estimated 35-45% increase in international installs within 6 months of P1 locale launch, with 25-30% of new installs converting to Pro at PPP-adjusted pricing

### Agent 5 — Sample Translations & Integration Architecture
**File:** `docs/i18n/agent5-translations-integration.md`

- Complete production-ready `messages.json` for Spanish (es): 210+ entries, formal-friendly register, region-neutral vocabulary, 10 culturally appropriate motivational quotes
- Complete production-ready `messages.json` for German (de): 210+ entries, Sie-form politeness, natural compound nouns (Fokus-Sitzung, Sperrliste), German-standard abbreviations to manage 20-30% text expansion
- Complete production-ready `messages.json` for Japanese (ja): 210+ entries, desu/masu polite form, appropriate kanji/hiragana/katakana mix, Japanese-specific proverbs (七転び八起き, 継続は力なり), correct counter words
- Complete production-ready `messages.json` for French (fr): 210+ entries, vous-form, French typographic conventions, one French-specific proverb (Petit a petit, l'oiseau fait son nid)
- Complete production-ready `messages.json` for Brazilian Portuguese (pt_BR): 210+ entries, voce-form, Brazilian vocabulary preferences, Brazilian proverb (Agua mole em pedra dura)
- Integration architecture: how i18n connects to service worker (notifications, badge), content scripts (block page shadow DOM), popup (6 states), options (8 sections), onboarding (5 slides), and block page (quotes, timer, stats)
- Four new shared modules: `I18nManager` (DOM localization), `LocaleFormatter` (Intl-based formatting), `Strings` (externalization helper), `RTLManager` (direction detection/application)
- Build integration: Vite/Webpack locale file copying, string extraction linting
- Storage design: `settings.language` override with auto-detect default
- Step-by-step migration guide with 7 phases and effort estimates (2-3 days initial migration, 1 day per additional locale)

---

## Key Design Decisions

### Brand Terms Kept in English
- Focus Mode, Focus Score, Nuclear Mode, Zovo, and Pro are never translated in any locale
- These terms are treated as proper nouns and product names, ensuring global brand consistency
- Translators receive a glossary with these terms marked as "do not translate" in all translation management systems
- In CJK locales (Japanese, future Korean/Chinese), brand terms appear in their English form naturally alongside native script

### Privacy-First Localization
- No user data is collected for locale detection — `chrome.i18n.getUILanguage()` reads the browser's existing language setting
- Translation analytics (which locales are active) use anonymous aggregate counts, not per-user tracking
- PPP pricing geo-lookup happens server-side via Stripe/payment processor IP detection, not via any client-side geolocation API
- Free-tier users generate zero additional network requests for i18n — all translations are bundled in the extension package

### Purchasing-Power-Parity Pricing
- 6 pricing tiers based on World Bank income classifications, not arbitrary regional discounts
- Pro monthly ranges from $1.99 (Tier 6) to $4.99 (Tier 1), maintaining perceived value relative to local purchasing power
- Lifetime pricing follows the same ratio (10x monthly), from $19.99 to $49.99
- Currency display uses `Intl.NumberFormat` for locale-correct formatting (1.234,56 in Germany vs 1,234.56 in US)
- Price tiers are server-determined to prevent VPN-based tier shopping

### Pseudo-Localization Testing
- Every string is tested before real translation begins using an auto-generated pseudo-locale
- Pseudo strings are 40% longer than English to stress-test UI layouts for languages like German (20-30% expansion) and French (15-20%)
- Accented characters replace ASCII letters to visually confirm that every visible string passes through the i18n pipeline
- Bracket wrapping ([...]) makes string boundaries visible, revealing concatenation bugs where strings are improperly assembled from fragments
- Pseudo-locale is excluded from production builds but available in development and CI

---

## Implementation Priority

| Priority | Component | Agent | Complexity |
|----------|-----------|-------|------------|
| P0 | en/messages.json master file (500+ entries) | Agent 1 | Medium |
| P0 | I18nManager class + Strings helper | Agent 1 | Low |
| P0 | data-i18n HTML attribute migration | Agent 1 | Medium |
| P0 | Service worker notification i18n | Agent 1 | Low |
| P0 | String extraction script | Agent 2 | Medium |
| P0 | Build pipeline locale file copying | Agent 2 | Low |
| P0 | Pseudo-localization framework | Agent 4 | Medium |
| P1 | Spanish (es) messages.json | Agent 5 | Low |
| P1 | German (de) messages.json | Agent 5 | Low |
| P1 | Japanese (ja) messages.json | Agent 5 | Low |
| P1 | French (fr) messages.json | Agent 5 | Low |
| P1 | Brazilian Portuguese (pt_BR) messages.json | Agent 5 | Low |
| P1 | LocaleFormatter (Intl wrappers) | Agent 3 | Medium |
| P1 | CWS store descriptions (6 locales) | Agent 3 | Medium |
| P1 | Visual regression testing setup | Agent 4 | High |
| P1 | DeepL API integration | Agent 2 | Medium |
| P1 | PPP pricing tiers | Agent 3 | Medium |
| P2 | RTL CSS logical property migration | Agent 2 | High |
| P2 | Crowdin community translation | Agent 2 | Medium |
| P2 | Korean, Chinese, Italian, Russian locales | Agent 4 | Medium |
| P2 | Regional blocklist presets | Agent 3 | Low |
| P2 | i18n test suite (50+ cases) | Agent 4 | Medium |
| P3 | Arabic + Hebrew (RTL locales) | Agent 2 | High |
| P3 | Additional P3 locales (hi, th, etc.) | Agent 4 | Medium |
| P3 | RTLManager shadow DOM integration | Agent 5 | Low |

### Priority Definitions

- **P0 — Required for i18n launch.** The English master file, I18nManager, string extraction, build pipeline integration, and pseudo-locale testing must be complete before any real translations begin. This is the infrastructure phase.

- **P1 — Required within first 2 months.** The 5 P1 locale translations (es, de, ja, fr, pt_BR), locale-aware formatting, CWS store descriptions, visual regression testing, DeepL integration, and PPP pricing enable the first international launch wave targeting 70% of non-English Chrome users.

- **P2 — Required within first 6 months.** RTL CSS migration, Crowdin community translation, P2 locales (ko, zh_CN, it, ru), regional blocklists, and the full i18n test suite extend coverage and prepare for RTL languages.

- **P3 — Nice to have, build as resources allow.** Full RTL locale support (Arabic, Hebrew), additional Asian and South Asian locales, and advanced shadow DOM RTL integration depend on demonstrated international user demand from P1/P2 launches.

---

## Document Map

```
docs/
├── 15-internationalization-system.md               <- THIS FILE
└── i18n/
    ├── agent1-architecture-patterns.md              <- i18n architecture & en/messages.json
    ├── agent2-translation-rtl.md                    <- Translation workflow & RTL support
    ├── agent3-locale-features-store.md              <- Locale features & CWS descriptions
    ├── agent4-testing-priority.md                   <- Testing strategy & rollout priority
    └── agent5-translations-integration.md           <- Sample translations & integration
```

---

*Phase 15 — Internationalization System — Complete*
