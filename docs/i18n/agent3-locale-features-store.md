# Locale-Specific Features & Store Listing Localization -- Focus Mode - Blocker

> **Document Version:** 1.0
> **Date:** 2026-02-11
> **Agent:** Phase 15 / Agent 3 -- Locale-Specific Features & Store Listing Localization
> **Extension:** Focus Mode - Blocker (Chrome Web Store)
> **Brand:** Zovo (zovo.one)
> **Category:** Productivity

---

## Table of Contents

1. [Date/Time/Number Formatting for Focus Mode](#1-datetimenumber-formatting-for-focus-mode)
   1.1 [LocaleFormatter Class](#11-localeformatter-class)
   1.2 [Timer Display Formatting](#12-timer-display-formatting)
   1.3 [Session Duration Formatting](#13-session-duration-formatting)
   1.4 [Relative Time Formatting](#14-relative-time-formatting)
   1.5 [Focus Score Display](#15-focus-score-display)
   1.6 [Streak Display & Pluralization](#16-streak-display--pluralization)
   1.7 [Weekly Report Date Formatting](#17-weekly-report-date-formatting)
   1.8 [Session History Time Formatting](#18-session-history-time-formatting)
   1.9 [Statistics Number Formatting](#19-statistics-number-formatting)
   1.10 [Intl API Reference](#110-intl-api-reference)
   1.11 [Pluralization Rules by Language](#111-pluralization-rules-by-language)
2. [Regional Pricing (PPP Adjustments)](#2-regional-pricing-ppp-adjustments)
   2.1 [Base Pricing Matrix](#21-base-pricing-matrix)
   2.2 [PPP-Adjusted Pricing by Market](#22-ppp-adjusted-pricing-by-market)
   2.3 [Stripe Regional Pricing Configuration](#23-stripe-regional-pricing-configuration)
   2.4 [Currency Display Implementation](#24-currency-display-implementation)
   2.5 [Regional Pricing Strategy](#25-regional-pricing-strategy)
   2.6 [Student Discount Considerations per Market](#26-student-discount-considerations-per-market)
3. [Locale-Specific Blocklist Suggestions](#3-locale-specific-blocklist-suggestions)
4. [Locale-Specific Motivational Quotes](#4-locale-specific-motivational-quotes)
5. [Chrome Web Store Listing Localization](#5-chrome-web-store-listing-localization)
   5.1 [Localized CWS Descriptions](#51-localized-cws-descriptions)
   5.2 [Localized Screenshots Strategy](#52-localized-screenshots-strategy)
   5.3 [Regional Keyword Optimization](#53-regional-keyword-optimization)
6. [Store Assets Organization](#6-store-assets-organization)

---

## 1. Date/Time/Number Formatting for Focus Mode

Focus Mode - Blocker displays dates, times, numbers, and durations across the popup UI, block page, weekly reports, session history, statistics panels, and onboarding flow. Every user-facing numeric or temporal value must be locale-aware, meaning it adapts automatically to the user's browser locale (`navigator.language`) or their explicitly selected language in extension settings.

This section specifies the `LocaleFormatter` utility class, its methods, and the Intl API primitives it relies on. All formatting code lives in `src/shared/locale-formatter.js` and is imported by popup, content scripts, and the background service worker.

---

### 1.1 LocaleFormatter Class

The `LocaleFormatter` class is the single entry point for all locale-sensitive formatting in Focus Mode - Blocker. It is instantiated once per context (popup, content script, service worker) and caches its `Intl` formatter instances for performance.

```javascript
/**
 * LocaleFormatter -- Locale-aware formatting for Focus Mode - Blocker
 *
 * Usage:
 *   import { LocaleFormatter } from './locale-formatter.js';
 *   const fmt = new LocaleFormatter('ja-JP'); // or auto-detect
 *   fmt.formatDuration(1500);        // "25 minutes" or "25分"
 *   fmt.formatRelativeTime(-2, 'hour'); // "2 hours ago" or "2時間前"
 *   fmt.formatFocusScore(85);        // "85/100" or "85%"
 *   fmt.formatNumber(1234);          // "1,234" or "1.234"
 */

export class LocaleFormatter {
  /**
   * @param {string} [locale] - BCP 47 locale tag. Defaults to navigator.language.
   * @param {object} [options]
   * @param {boolean} [options.use24Hour] - Override 12h/24h detection. Null = auto.
   * @param {string} [options.scoreFormat] - 'fraction' | 'percent'. Default: 'fraction'.
   */
  constructor(locale, options = {}) {
    this.locale = locale || navigator.language || 'en-US';
    this.options = {
      use24Hour: options.use24Hour ?? null,
      scoreFormat: options.scoreFormat ?? 'fraction',
    };

    // Pre-create formatters (cached by the engine, but we hold references)
    this._numberFmt = new Intl.NumberFormat(this.locale);
    this._percentFmt = new Intl.NumberFormat(this.locale, {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    this._dateFmt = new Intl.DateTimeFormat(this.locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    this._weekFmt = new Intl.DateTimeFormat(this.locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    this._timeFmt = this._createTimeFmt();
    this._relTimeFmt = new Intl.RelativeTimeFormat(this.locale, {
      numeric: 'auto',
      style: 'long',
    });
    this._pluralRules = new Intl.PluralRules(this.locale);
    this._listFmt = new Intl.ListFormat(this.locale, {
      style: 'long',
      type: 'conjunction',
    });

    // Detect 12h/24h preference
    this._is24Hour = this._detect24Hour();
  }

  /**
   * Detect whether the locale conventionally uses 24-hour time.
   * If the user overrode via options.use24Hour, use that instead.
   */
  _detect24Hour() {
    if (this.options.use24Hour !== null) {
      return this.options.use24Hour;
    }
    // Use Intl.DateTimeFormat resolvedOptions to detect
    const resolved = new Intl.DateTimeFormat(this.locale, {
      hour: 'numeric',
    }).resolvedOptions();
    return resolved.hourCycle === 'h23' || resolved.hourCycle === 'h24';
  }

  /**
   * Create the time formatter based on 12h/24h detection.
   */
  _createTimeFmt() {
    return new Intl.DateTimeFormat(this.locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: this.options.use24Hour !== null
        ? !this.options.use24Hour
        : undefined, // let locale decide if no override
    });
  }

  // -------------------------------------------------------
  // Public Formatting Methods (see sections below)
  // -------------------------------------------------------
}
```

**Design decisions:**

| Decision | Rationale |
|----------|-----------|
| Locale auto-detected from `navigator.language` | Zero-config for most users; aligns with browser setting |
| User can override locale in extension settings | Power users may prefer a different language than their OS |
| Formatter instances cached as class properties | `Intl` constructors are expensive; reuse across calls |
| 12h/24h auto-detected from `Intl.DateTimeFormat` | More reliable than manual locale lists |
| Timer display always uses `MM:SS` (no locale variation) | Timers are universal -- "25:00" reads the same in every culture |

---

### 1.2 Timer Display Formatting

The Pomodoro timer in the popup and the ambient focus timer on the block page always display time in `MM:SS` format. This is **not locale-dependent** -- the colon-separated countdown format is universal across cultures for timer displays (sports, cooking, music, meditation apps all use this convention globally).

```javascript
/**
 * Format seconds into MM:SS timer display.
 * Always uses fixed format regardless of locale.
 *
 * @param {number} totalSeconds - Remaining or elapsed seconds.
 * @returns {string} Formatted timer string, e.g. "25:00", "04:32", "1:30:00"
 */
formatTimer(totalSeconds) {
  const absSeconds = Math.abs(Math.floor(totalSeconds));
  const hours = Math.floor(absSeconds / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);
  const seconds = absSeconds % 60;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}
```

**Timer display examples across locales (all identical):**

| Locale | 25 min timer | 5 min break | 90 min session |
|--------|-------------|-------------|----------------|
| en-US  | `25:00`     | `05:00`     | `1:30:00`      |
| ja-JP  | `25:00`     | `05:00`     | `1:30:00`      |
| de-DE  | `25:00`     | `05:00`     | `1:30:00`      |
| ar-SA  | `25:00`     | `05:00`     | `1:30:00`      |
| pt-BR  | `25:00`     | `05:00`     | `1:30:00`      |
| ru-RU  | `25:00`     | `05:00`     | `1:30:00`      |

**Note on RTL locales (Arabic, Hebrew):** The timer string itself is LTR numeric content. In RTL layouts, it must be wrapped in a `<bdi>` tag or given `dir="ltr"` to prevent the colon from appearing on the wrong side.

```html
<!-- In RTL block page / popup -->
<span class="timer" dir="ltr">25:00</span>
```

---

### 1.3 Session Duration Formatting

When displaying how long a focus session lasted (in session history, weekly reports, or achievement notifications), we use human-readable locale-aware duration strings. Unlike the timer, these are fully localized.

```javascript
/**
 * Format a duration in seconds into a human-readable locale-aware string.
 *
 * @param {number} totalSeconds - Duration in seconds.
 * @param {object} [opts]
 * @param {boolean} [opts.compact] - Use compact form ("1h 30m" vs "1 hour 30 minutes")
 * @returns {string} Locale-aware duration string.
 *
 * Examples:
 *   en-US: "25 minutes", "1 hour 30 minutes", "2 hours 15 minutes"
 *   ja-JP: "25分", "1時間30分", "2時間15分"
 *   de-DE: "25 Minuten", "1 Stunde 30 Minuten", "2 Stunden 15 Minuten"
 *   es-ES: "25 minutos", "1 hora 30 minutos", "2 horas 15 minutos"
 *   ar-SA: "25 دقيقة", "ساعة و30 دقيقة", "ساعتان و15 دقيقة"
 *   pt-BR: "25 minutos", "1 hora e 30 minutos", "2 horas e 15 minutos"
 *   ru-RU: "25 минут", "1 час 30 минут", "2 часа 15 минут"
 *   ko-KR: "25분", "1시간 30분", "2시간 15분"
 *   fr-FR: "25 minutes", "1 heure 30 minutes", "2 heures 15 minutes"
 */
formatDuration(totalSeconds, opts = {}) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const parts = [];

  if (hours > 0) {
    parts.push(this._formatDurationUnit(hours, 'hour', opts.compact));
  }
  if (minutes > 0 || parts.length === 0) {
    parts.push(this._formatDurationUnit(minutes, 'minute', opts.compact));
  }

  // Use ListFormat to join parts with locale-aware conjunction
  // e.g., "1 hour and 30 minutes" in English, "1 hora e 30 minutos" in Portuguese
  return this._listFmt.format(parts);
}

/**
 * Format a single duration unit with correct pluralization.
 * @private
 */
_formatDurationUnit(value, unit, compact) {
  if (compact) {
    // Compact form uses abbreviated units
    const compactUnits = this._getCompactUnits();
    return `${this._numberFmt.format(value)}${compactUnits[unit]}`;
  }

  // Full form uses Intl.PluralRules for correct pluralization
  const pluralCategory = this._pluralRules.select(value);
  const unitStrings = this._getDurationUnitStrings(unit);
  const unitLabel = unitStrings[pluralCategory] || unitStrings.other;

  return `${this._numberFmt.format(value)} ${unitLabel}`;
}
```

**Duration unit strings loaded from message catalogs:**

```json
// _locales/en/messages.json (excerpt)
{
  "duration_hour_one": { "message": "hour" },
  "duration_hour_other": { "message": "hours" },
  "duration_minute_one": { "message": "minute" },
  "duration_minute_other": { "message": "minutes" }
}

// _locales/ru/messages.json (excerpt)
{
  "duration_hour_one": { "message": "час" },
  "duration_hour_few": { "message": "часа" },
  "duration_hour_many": { "message": "часов" },
  "duration_hour_other": { "message": "часов" },
  "duration_minute_one": { "message": "минута" },
  "duration_minute_few": { "message": "минуты" },
  "duration_minute_many": { "message": "минут" },
  "duration_minute_other": { "message": "минут" }
}

// _locales/ar/messages.json (excerpt)
{
  "duration_hour_zero": { "message": "ساعات" },
  "duration_hour_one": { "message": "ساعة" },
  "duration_hour_two": { "message": "ساعتان" },
  "duration_hour_few": { "message": "ساعات" },
  "duration_hour_many": { "message": "ساعة" },
  "duration_hour_other": { "message": "ساعة" },
  "duration_minute_zero": { "message": "دقائق" },
  "duration_minute_one": { "message": "دقيقة" },
  "duration_minute_two": { "message": "دقيقتان" },
  "duration_minute_few": { "message": "دقائق" },
  "duration_minute_many": { "message": "دقيقة" },
  "duration_minute_other": { "message": "دقيقة" }
}

// _locales/ja/messages.json (excerpt)
{
  "duration_hour_other": { "message": "時間" },
  "duration_minute_other": { "message": "分" }
}

// _locales/de/messages.json (excerpt)
{
  "duration_hour_one": { "message": "Stunde" },
  "duration_hour_other": { "message": "Stunden" },
  "duration_minute_one": { "message": "Minute" },
  "duration_minute_other": { "message": "Minuten" }
}

// _locales/ko/messages.json (excerpt)
{
  "duration_hour_other": { "message": "시간" },
  "duration_minute_other": { "message": "분" }
}

// _locales/fr/messages.json (excerpt)
{
  "duration_hour_one": { "message": "heure" },
  "duration_hour_other": { "message": "heures" },
  "duration_minute_one": { "message": "minute" },
  "duration_minute_other": { "message": "minutes" }
}

// _locales/es/messages.json (excerpt)
{
  "duration_hour_one": { "message": "hora" },
  "duration_hour_other": { "message": "horas" },
  "duration_minute_one": { "message": "minuto" },
  "duration_minute_other": { "message": "minutos" }
}

// _locales/pt_BR/messages.json (excerpt)
{
  "duration_hour_one": { "message": "hora" },
  "duration_hour_other": { "message": "horas" },
  "duration_minute_one": { "message": "minuto" },
  "duration_minute_other": { "message": "minutos" }
}
```

**Compact duration units (for space-constrained UI like popup header):**

| Locale | Hour | Minute |
|--------|------|--------|
| en     | h    | m      |
| ja     | 時間  | 分     |
| de     | Std  | Min    |
| fr     | h    | min    |
| es     | h    | min    |
| pt-BR  | h    | min    |
| ru     | ч    | мин    |
| ar     | س    | د      |
| ko     | 시간  | 분     |
| zh     | 小时  | 分     |

---

### 1.4 Relative Time Formatting

Relative time expressions ("2 hours ago", "yesterday", "3 days ago") appear in session history, the activity feed, and notification badges. The `Intl.RelativeTimeFormat` API handles this natively.

```javascript
/**
 * Format a timestamp as a relative time string.
 *
 * @param {number|Date} timestamp - The past timestamp (ms or Date object).
 * @returns {string} Locale-aware relative time string.
 *
 * Examples:
 *   en-US: "2 hours ago", "yesterday", "3 days ago", "last week"
 *   ja-JP: "2時間前", "昨日", "3日前", "先週"
 *   de-DE: "vor 2 Stunden", "gestern", "vor 3 Tagen", "letzte Woche"
 *   fr-FR: "il y a 2 heures", "hier", "il y a 3 jours", "la semaine dernière"
 *   es-ES: "hace 2 horas", "ayer", "hace 3 días", "la semana pasada"
 *   pt-BR: "há 2 horas", "ontem", "há 3 dias", "semana passada"
 *   ru-RU: "2 часа назад", "вчера", "3 дня назад", "на прошлой неделе"
 *   ar-SA: "قبل ساعتين", "أمس", "قبل 3 أيام", "الأسبوع الماضي"
 *   ko-KR: "2시간 전", "어제", "3일 전", "지난주"
 */
formatRelativeTime(timestamp) {
  const now = Date.now();
  const ts = timestamp instanceof Date ? timestamp.getTime() : timestamp;
  const diffMs = ts - now;
  const absDiffMs = Math.abs(diffMs);

  // Choose the best unit
  const MINUTE = 60 * 1000;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;
  const WEEK = 7 * DAY;
  const MONTH = 30 * DAY;
  const YEAR = 365 * DAY;

  let value, unit;

  if (absDiffMs < MINUTE) {
    return this._getMessageString('time_just_now'); // "just now"
  } else if (absDiffMs < HOUR) {
    value = Math.round(diffMs / MINUTE);
    unit = 'minute';
  } else if (absDiffMs < DAY) {
    value = Math.round(diffMs / HOUR);
    unit = 'hour';
  } else if (absDiffMs < WEEK) {
    value = Math.round(diffMs / DAY);
    unit = 'day';
  } else if (absDiffMs < MONTH) {
    value = Math.round(diffMs / WEEK);
    unit = 'week';
  } else if (absDiffMs < YEAR) {
    value = Math.round(diffMs / MONTH);
    unit = 'month';
  } else {
    value = Math.round(diffMs / YEAR);
    unit = 'year';
  }

  return this._relTimeFmt.format(value, unit);
}
```

**Output examples for a session that ended 2 hours ago:**

| Locale | Output |
|--------|--------|
| en-US  | "2 hours ago" |
| ja-JP  | "2時間前" |
| de-DE  | "vor 2 Stunden" |
| fr-FR  | "il y a 2 heures" |
| es-ES  | "hace 2 horas" |
| pt-BR  | "há 2 horas" |
| ru-RU  | "2 часа назад" |
| ar-SA  | "قبل ساعتين" |
| ko-KR  | "2시간 전" |
| zh-CN  | "2小时前" |
| pl-PL  | "2 godziny temu" |
| hi-IN  | "2 घंटे पहले" |
| tr-TR  | "2 saat once" |
| nl-NL  | "2 uur geleden" |
| it-IT  | "2 ore fa" |

**Edge cases handled:**

1. **"Just now"** -- Less than 60 seconds ago, displays a static string from the message catalog rather than "0 minutes ago."
2. **Negative values** -- `Intl.RelativeTimeFormat` naturally handles past (negative) and future (positive) values. Future values appear in Nuclear Mode countdown: "Nuclear Mode ends in 2 hours."
3. **Cross-midnight** -- When a session started "yesterday" at 11:55 PM and it is now 12:05 AM, the relative formatter correctly says "yesterday" (via the `numeric: 'auto'` option) rather than "10 minutes ago," because we use day-level granularity for periods exceeding 20 hours.

---

### 1.5 Focus Score Display

The Focus Score (0-100) is a gamified productivity metric displayed prominently in the popup, weekly report, and block page motivation card. Its display format varies by locale and user preference.

```javascript
/**
 * Format the Focus Score for display.
 *
 * @param {number} score - Focus Score value (0-100).
 * @param {object} [opts]
 * @param {string} [opts.format] - 'fraction' | 'percent'. Default from constructor.
 * @returns {string} Formatted score string.
 *
 * Examples (format: 'fraction'):
 *   en-US: "85/100"
 *   de-DE: "85/100"
 *   ja-JP: "85/100"
 *   ar-SA: "85/100" (with dir="ltr" wrapper in RTL context)
 *
 * Examples (format: 'percent'):
 *   en-US: "85%"
 *   de-DE: "85 %"  (German uses space before %)
 *   fr-FR: "85 %"  (French uses non-breaking space before %)
 *   tr-TR: "%85"   (Turkish puts % before the number)
 *   ar-SA: "85٪"   (Arabic percent sign, or "٨٥٪" with Arabic-Indic numerals)
 */
formatFocusScore(score, opts = {}) {
  const format = opts.format || this.options.scoreFormat;

  if (format === 'percent') {
    return this._percentFmt.format(score / 100);
  }

  // Fraction format: "{score}/100"
  // Use locale-aware number formatting for the score part
  const formattedScore = this._numberFmt.format(Math.round(score));
  return `${formattedScore}/100`;
}

/**
 * Format the Focus Score with a label for accessibility and screen readers.
 *
 * @param {number} score
 * @returns {string} E.g., "Focus Score: 85 out of 100"
 */
formatFocusScoreAccessible(score) {
  const formattedScore = this._numberFmt.format(Math.round(score));
  // Uses message catalog: "Focus Score: $SCORE$ out of 100"
  return chrome.i18n.getMessage('focus_score_accessible', [formattedScore]);
}
```

**Focus Score display by locale and format:**

| Locale | Fraction | Percent | Accessible Label |
|--------|----------|---------|-----------------|
| en-US  | 85/100   | 85%     | "Focus Score: 85 out of 100" |
| de-DE  | 85/100   | 85 %    | "Fokus-Punktzahl: 85 von 100" |
| fr-FR  | 85/100   | 85 %    | "Score de concentration : 85 sur 100" |
| es-ES  | 85/100   | 85 %    | "Puntuacion de enfoque: 85 de 100" |
| ja-JP  | 85/100   | 85%     | "集中スコア: 100点中85点" |
| pt-BR  | 85/100   | 85%     | "Pontuacao de Foco: 85 de 100" |
| ru-RU  | 85/100   | 85 %    | "Оценка фокуса: 85 из 100" |
| ar-SA  | 85/100   | 85٪     | "درجة التركيز: 85 من 100" |
| ko-KR  | 85/100   | 85%     | "집중 점수: 100점 중 85점" |
| zh-CN  | 85/100   | 85%     | "专注分数: 85/100" |
| hi-IN  | 85/100   | 85%     | "फोकस स्कोर: 100 में से 85" |

**Implementation note:** The fraction format ("85/100") is used as the default because it is visually unambiguous across all locales and avoids the percentage symbol positioning variations. The percent format is offered as a user preference for locales where it reads more naturally (e.g., Turkish, where "%85" is conventional).

---

### 1.6 Streak Display & Pluralization

Streak counts ("7-day streak", "30-day streak") appear in the popup badge, weekly report, and achievement notifications. Pluralization is the primary challenge here -- different languages have radically different plural rules.

```javascript
/**
 * Format a streak count for display.
 *
 * @param {number} days - Number of consecutive days.
 * @returns {string} Locale-aware streak string.
 *
 * Examples:
 *   en-US: "1 day" / "7 days" / "30 days"
 *   ja-JP: "1日" / "7日" / "30日" (no plural distinction)
 *   de-DE: "1 Tag" / "7 Tage" / "30 Tage"
 *   ru-RU: "1 день" / "7 дней" / "21 день" / "2 дня" / "30 дней"
 *   ar-SA: "يوم واحد" / "يومان" / "3 أيام" / "11 يومًا" / "30 يومًا"
 *   fr-FR: "1 jour" / "7 jours" / "30 jours"
 *   ko-KR: "1일" / "7일" / "30일" (no plural distinction)
 *   pl-PL: "1 dzien" / "2 dni" / "5 dni" / "22 dni" / "30 dni"
 */
formatStreak(days) {
  const pluralCategory = this._pluralRules.select(days);
  const formattedNumber = this._numberFmt.format(days);

  // Look up the correct plural form from the message catalog
  const messageKey = `streak_days_${pluralCategory}`;
  const template = chrome.i18n.getMessage(messageKey) ||
                   chrome.i18n.getMessage('streak_days_other');

  return template.replace('$COUNT$', formattedNumber);
}

/**
 * Format a streak label for the popup badge.
 * Compact form for small UI elements.
 *
 * @param {number} days
 * @returns {string} E.g., "7d" or "7日"
 */
formatStreakBadge(days) {
  const formattedNumber = this._numberFmt.format(days);
  const suffix = chrome.i18n.getMessage('streak_badge_suffix'); // "d" or "日" etc.
  return `${formattedNumber}${suffix}`;
}
```

**Streak message catalog entries by locale:**

```json
// English (en)
{
  "streak_days_one": { "message": "$COUNT$ day", "placeholders": { "count": { "content": "$1" } } },
  "streak_days_other": { "message": "$COUNT$ days", "placeholders": { "count": { "content": "$1" } } },
  "streak_badge_suffix": { "message": "d" },
  "streak_label": { "message": "Streak" },
  "streak_record": { "message": "Best: $COUNT$ days" }
}

// Russian (ru) -- 4 plural forms
{
  "streak_days_one": { "message": "$COUNT$ день" },
  "streak_days_few": { "message": "$COUNT$ дня" },
  "streak_days_many": { "message": "$COUNT$ дней" },
  "streak_days_other": { "message": "$COUNT$ дней" },
  "streak_badge_suffix": { "message": "д" },
  "streak_label": { "message": "Серия" },
  "streak_record": { "message": "Рекорд: $COUNT$ дней" }
}

// Arabic (ar) -- 6 plural forms
{
  "streak_days_zero": { "message": "لا أيام" },
  "streak_days_one": { "message": "يوم واحد" },
  "streak_days_two": { "message": "يومان" },
  "streak_days_few": { "message": "$COUNT$ أيام" },
  "streak_days_many": { "message": "$COUNT$ يومًا" },
  "streak_days_other": { "message": "$COUNT$ يوم" },
  "streak_badge_suffix": { "message": "ي" },
  "streak_label": { "message": "سلسلة" }
}

// Japanese (ja) -- 1 plural form (classifier system)
{
  "streak_days_other": { "message": "$COUNT$日" },
  "streak_badge_suffix": { "message": "日" },
  "streak_label": { "message": "連続記録" },
  "streak_record": { "message": "最高: $COUNT$日" }
}

// German (de)
{
  "streak_days_one": { "message": "$COUNT$ Tag" },
  "streak_days_other": { "message": "$COUNT$ Tage" },
  "streak_badge_suffix": { "message": "T" },
  "streak_label": { "message": "Serie" },
  "streak_record": { "message": "Rekord: $COUNT$ Tage" }
}

// French (fr)
{
  "streak_days_one": { "message": "$COUNT$ jour" },
  "streak_days_other": { "message": "$COUNT$ jours" },
  "streak_badge_suffix": { "message": "j" },
  "streak_label": { "message": "Serie" },
  "streak_record": { "message": "Record : $COUNT$ jours" }
}

// Spanish (es)
{
  "streak_days_one": { "message": "$COUNT$ dia" },
  "streak_days_other": { "message": "$COUNT$ dias" },
  "streak_badge_suffix": { "message": "d" },
  "streak_label": { "message": "Racha" },
  "streak_record": { "message": "Record: $COUNT$ dias" }
}

// Portuguese-BR (pt_BR)
{
  "streak_days_one": { "message": "$COUNT$ dia" },
  "streak_days_other": { "message": "$COUNT$ dias" },
  "streak_badge_suffix": { "message": "d" },
  "streak_label": { "message": "Sequencia" },
  "streak_record": { "message": "Recorde: $COUNT$ dias" }
}

// Korean (ko)
{
  "streak_days_other": { "message": "$COUNT$일" },
  "streak_badge_suffix": { "message": "일" },
  "streak_label": { "message": "연속" },
  "streak_record": { "message": "최고: $COUNT$일" }
}

// Polish (pl) -- 4 plural forms (similar complexity to Russian)
{
  "streak_days_one": { "message": "$COUNT$ dzien" },
  "streak_days_few": { "message": "$COUNT$ dni" },
  "streak_days_many": { "message": "$COUNT$ dni" },
  "streak_days_other": { "message": "$COUNT$ dni" },
  "streak_badge_suffix": { "message": "d" },
  "streak_label": { "message": "Seria" }
}
```

**Pluralization verification matrix (critical test cases):**

| Count | English | Russian | Arabic | Japanese | Polish |
|-------|---------|---------|--------|----------|--------|
| 0     | 0 days  | 0 дней  | لا أيام | 0日     | 0 dni  |
| 1     | 1 day   | 1 день  | يوم واحد | 1日    | 1 dzien |
| 2     | 2 days  | 2 дня   | يومان  | 2日     | 2 dni  |
| 3     | 3 days  | 3 дня   | 3 أيام | 3日     | 3 dni  |
| 5     | 5 days  | 5 дней  | 5 أيام | 5日     | 5 dni  |
| 11    | 11 days | 11 дней | 11 يومًا | 11日   | 11 dni |
| 21    | 21 days | 21 день | 21 يومًا | 21日   | 21 dni |
| 22    | 22 days | 22 дня  | 22 يومًا | 22日   | 22 dni |
| 100   | 100 days| 100 дней| 100 يوم | 100日  | 100 dni|
| 101   | 101 days| 101 день| 101 يوم | 101日  | 101 dni|

---

### 1.7 Weekly Report Date Formatting

The weekly Focus Report email and in-extension report header display the week's date range. This must be locale-aware in both date format and word order.

```javascript
/**
 * Format a weekly report header date.
 *
 * @param {Date} weekStart - The Monday of the week.
 * @returns {string} Locale-aware week header.
 *
 * Examples:
 *   en-US: "Week of January 13, 2026"
 *   de-DE: "Woche vom 13. Januar 2026"
 *   ja-JP: "2026年1月13日の週"
 *   fr-FR: "Semaine du 13 janvier 2026"
 *   es-ES: "Semana del 13 de enero de 2026"
 *   pt-BR: "Semana de 13 de janeiro de 2026"
 *   ru-RU: "Неделя от 13 января 2026 г."
 *   ar-SA: "أسبوع 13 يناير 2026"
 *   ko-KR: "2026년 1월 13일 주"
 *   zh-CN: "2026年1月13日 当周"
 */
formatWeekHeader(weekStart) {
  const formattedDate = this._dateFmt.format(weekStart);
  const template = chrome.i18n.getMessage('weekly_report_header');
  return template.replace('$DATE$', formattedDate);
}

/**
 * Format a date range for the weekly report.
 *
 * @param {Date} start - Week start (Monday).
 * @param {Date} end - Week end (Sunday).
 * @returns {string} Locale-aware date range.
 *
 * Examples:
 *   en-US: "January 13 - 19, 2026"
 *   de-DE: "13. - 19. Januar 2026"
 *   ja-JP: "2026年1月13日 - 19日"
 *   fr-FR: "13 - 19 janvier 2026"
 */
formatWeekRange(start, end) {
  // Use Intl.DateTimeFormat.formatRange() if available (Chrome 76+)
  if (typeof this._dateFmt.formatRange === 'function') {
    return this._dateFmt.formatRange(start, end);
  }
  // Fallback: manual formatting
  const startStr = this._dateFmt.format(start);
  const endStr = this._dateFmt.format(end);
  return `${startStr} - ${endStr}`;
}
```

**Message catalog entries:**

```json
// en: "Week of $DATE$"
{ "weekly_report_header": { "message": "Week of $DATE$" } }

// de: "Woche vom $DATE$"
{ "weekly_report_header": { "message": "Woche vom $DATE$" } }

// ja: "$DATE$の週"
{ "weekly_report_header": { "message": "$DATE$の週" } }

// fr: "Semaine du $DATE$"
{ "weekly_report_header": { "message": "Semaine du $DATE$" } }

// es: "Semana del $DATE$"
{ "weekly_report_header": { "message": "Semana del $DATE$" } }

// pt_BR: "Semana de $DATE$"
{ "weekly_report_header": { "message": "Semana de $DATE$" } }

// ru: "Неделя от $DATE$"
{ "weekly_report_header": { "message": "Неделя от $DATE$" } }

// ar: "أسبوع $DATE$"
{ "weekly_report_header": { "message": "أسبوع $DATE$" } }

// ko: "$DATE$ 주"
{ "weekly_report_header": { "message": "$DATE$ 주" } }

// zh-CN: "$DATE$ 当周"
{ "weekly_report_header": { "message": "$DATE$ 当周" } }
```

---

### 1.8 Session History Time Formatting

Session history entries show start time, end time, and duration. The time display must respect the locale's 12h/24h convention.

```javascript
/**
 * Format a time of day for session history display.
 *
 * @param {Date} date - The date/time to format.
 * @returns {string} Locale-aware time string.
 *
 * Examples:
 *   en-US: "9:00 AM", "2:30 PM"    (12-hour with AM/PM)
 *   en-GB: "09:00", "14:30"         (24-hour)
 *   de-DE: "09:00", "14:30"         (24-hour)
 *   ja-JP: "午前9:00", "午後2:30"   (12-hour with period prefix)
 *   fr-FR: "09:00", "14:30"         (24-hour, h as separator in some contexts)
 *   es-ES: "9:00", "14:30"          (24-hour in most countries)
 *   pt-BR: "09:00", "14:30"         (24-hour)
 *   ru-RU: "09:00", "14:30"         (24-hour)
 *   ar-SA: "9:00 ص", "2:30 م"      (12-hour with Arabic AM/PM)
 *   ko-KR: "오전 9:00", "오후 2:30" (12-hour with period prefix)
 *   zh-CN: "上午9:00", "下午2:30"   (12-hour with period prefix)
 */
formatTime(date) {
  return this._timeFmt.format(date);
}

/**
 * Format a session history entry.
 *
 * @param {object} session
 * @param {number} session.startTime - Start timestamp (ms).
 * @param {number} session.endTime - End timestamp (ms).
 * @param {number} session.durationSeconds - Duration in seconds.
 * @param {string} session.type - 'focus' | 'break'.
 * @returns {object} Formatted session display strings.
 */
formatSessionEntry(session) {
  const start = new Date(session.startTime);
  const end = session.endTime ? new Date(session.endTime) : null;

  return {
    startTime: this.formatTime(start),
    endTime: end ? this.formatTime(end) : chrome.i18n.getMessage('session_in_progress'),
    duration: this.formatDuration(session.durationSeconds),
    relativeStart: this.formatRelativeTime(session.startTime),
    date: this._dateFmt.format(start),
    typeLabel: chrome.i18n.getMessage(`session_type_${session.type}`),
  };
}
```

**Session entry display format by locale:**

| Locale | Start | End | Duration | Relative |
|--------|-------|-----|----------|----------|
| en-US  | Started at 9:00 AM | Ended at 9:25 AM | 25 minutes | 2 hours ago |
| de-DE  | Begonnen um 09:00 | Beendet um 09:25 | 25 Minuten | vor 2 Stunden |
| ja-JP  | 午前9:00に開始 | 午前9:25に終了 | 25分 | 2時間前 |
| fr-FR  | Commence a 09:00 | Termine a 09:25 | 25 minutes | il y a 2 heures |
| ar-SA  | بدأت في 9:00 ص | انتهت في 9:25 ص | 25 دقيقة | قبل ساعتين |
| ru-RU  | Начало в 09:00 | Конец в 09:25 | 25 минут | 2 часа назад |
| pt-BR  | Inicio as 09:00 | Fim as 09:25 | 25 minutos | ha 2 horas |
| ko-KR  | 오전 9:00에 시작 | 오전 9:25에 종료 | 25분 | 2시간 전 |

---

### 1.9 Statistics Number Formatting

Statistics like "1,234 distractions blocked" or "56.7 hours focused" use locale-aware number formatting for digit grouping separators and decimal separators.

```javascript
/**
 * Format a large number with locale-aware digit grouping.
 *
 * @param {number} value - The number to format.
 * @returns {string} Formatted number string.
 *
 * Examples for 1234567:
 *   en-US: "1,234,567"
 *   de-DE: "1.234.567"
 *   fr-FR: "1 234 567" (thin space separator)
 *   ja-JP: "1,234,567" (same as English)
 *   ar-SA: "1,234,567" or "١٬٢٣٤٬٥٦٧" (Arabic-Indic numerals)
 *   pt-BR: "1.234.567"
 *   ru-RU: "1 234 567" (space separator)
 *   hi-IN: "12,34,567" (Indian numbering system -- groups of 2 after initial 3)
 */
formatNumber(value) {
  return this._numberFmt.format(value);
}

/**
 * Format a statistic with its label.
 *
 * @param {number} value - The numeric value.
 * @param {string} statKey - Message catalog key for the stat label.
 * @returns {string} Formatted statistic.
 *
 * Examples:
 *   en-US: "1,234 distractions blocked"
 *   de-DE: "1.234 Ablenkungen blockiert"
 *   ja-JP: "1,234件のブロック"
 *   fr-FR: "1 234 distractions bloquees"
 *   hi-IN: "1,234 विकर्षण अवरुद्ध"
 */
formatStat(value, statKey) {
  const formattedValue = this.formatNumber(value);
  const pluralCategory = this._pluralRules.select(value);
  const messageKey = `${statKey}_${pluralCategory}`;

  const template = chrome.i18n.getMessage(messageKey) ||
                   chrome.i18n.getMessage(`${statKey}_other`);
  return template.replace('$COUNT$', formattedValue);
}

/**
 * Format a decimal number (e.g., hours focused).
 *
 * @param {number} value - The number to format.
 * @param {number} [fractionDigits=1] - Decimal places.
 * @returns {string} Formatted decimal number.
 *
 * Examples for 56.7:
 *   en-US: "56.7"
 *   de-DE: "56,7"
 *   fr-FR: "56,7"
 *   ar-SA: "56.7" or "٥٦٫٧"
 */
formatDecimal(value, fractionDigits = 1) {
  const fmt = new Intl.NumberFormat(this.locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
  return fmt.format(value);
}
```

**Statistics message catalog entries (selected stat keys):**

```json
// English (en)
{
  "stat_distractions_blocked_one": { "message": "$COUNT$ distraction blocked" },
  "stat_distractions_blocked_other": { "message": "$COUNT$ distractions blocked" },
  "stat_hours_focused_one": { "message": "$COUNT$ hour focused" },
  "stat_hours_focused_other": { "message": "$COUNT$ hours focused" },
  "stat_sessions_completed_one": { "message": "$COUNT$ session completed" },
  "stat_sessions_completed_other": { "message": "$COUNT$ sessions completed" },
  "stat_sites_blocked_one": { "message": "$COUNT$ site on blocklist" },
  "stat_sites_blocked_other": { "message": "$COUNT$ sites on blocklist" }
}

// German (de)
{
  "stat_distractions_blocked_one": { "message": "$COUNT$ Ablenkung blockiert" },
  "stat_distractions_blocked_other": { "message": "$COUNT$ Ablenkungen blockiert" },
  "stat_hours_focused_one": { "message": "$COUNT$ Stunde konzentriert" },
  "stat_hours_focused_other": { "message": "$COUNT$ Stunden konzentriert" },
  "stat_sessions_completed_one": { "message": "$COUNT$ Sitzung abgeschlossen" },
  "stat_sessions_completed_other": { "message": "$COUNT$ Sitzungen abgeschlossen" }
}

// Japanese (ja) -- no plural distinction
{
  "stat_distractions_blocked_other": { "message": "$COUNT$件のブロック" },
  "stat_hours_focused_other": { "message": "$COUNT$時間の集中" },
  "stat_sessions_completed_other": { "message": "$COUNT$セッション完了" }
}

// Russian (ru)
{
  "stat_distractions_blocked_one": { "message": "$COUNT$ отвлечение заблокировано" },
  "stat_distractions_blocked_few": { "message": "$COUNT$ отвлечения заблокировано" },
  "stat_distractions_blocked_many": { "message": "$COUNT$ отвлечений заблокировано" },
  "stat_distractions_blocked_other": { "message": "$COUNT$ отвлечений заблокировано" }
}

// Arabic (ar)
{
  "stat_distractions_blocked_zero": { "message": "لم يتم حظر أي تشتيت" },
  "stat_distractions_blocked_one": { "message": "تم حظر تشتيت واحد" },
  "stat_distractions_blocked_two": { "message": "تم حظر تشتيتان" },
  "stat_distractions_blocked_few": { "message": "تم حظر $COUNT$ تشتيتات" },
  "stat_distractions_blocked_many": { "message": "تم حظر $COUNT$ تشتيتًا" },
  "stat_distractions_blocked_other": { "message": "تم حظر $COUNT$ تشتيت" }
}
```

**Number formatting comparison table (for value 1,234,567.89):**

| Locale | Grouping | Decimal | Formatted |
|--------|----------|---------|-----------|
| en-US  | comma    | period  | 1,234,567.89 |
| de-DE  | period   | comma   | 1.234.567,89 |
| fr-FR  | thin space | comma | 1 234 567,89 |
| es-ES  | period   | comma   | 1.234.567,89 |
| pt-BR  | period   | comma   | 1.234.567,89 |
| ja-JP  | comma    | period  | 1,234,567.89 |
| ru-RU  | space    | comma   | 1 234 567,89 |
| ar-SA  | comma    | period  | 1,234,567.89 |
| ko-KR  | comma    | period  | 1,234,567.89 |
| hi-IN  | Indian   | period  | 12,34,567.89 |
| zh-CN  | comma    | period  | 1,234,567.89 |
| pl-PL  | space    | comma   | 1 234 567,89 |
| nl-NL  | period   | comma   | 1.234.567,89 |
| it-IT  | period   | comma   | 1.234.567,89 |
| tr-TR  | period   | comma   | 1.234.567,89 |

---

### 1.10 Intl API Reference

Complete reference of Intl APIs used in Focus Mode - Blocker, with browser support notes.

| API | Chrome Support | Usage in Focus Mode | Notes |
|-----|---------------|---------------------|-------|
| `Intl.DateTimeFormat` | Chrome 24+ | Date display, time display, week headers | Core API; fully supported |
| `Intl.DateTimeFormat.formatRange()` | Chrome 76+ | Weekly report date ranges | Graceful fallback for older Chrome |
| `Intl.NumberFormat` | Chrome 24+ | Statistics, Focus Score, pricing | Core API; fully supported |
| `Intl.NumberFormat` (currency) | Chrome 24+ | Pricing display | Symbol position varies by locale |
| `Intl.RelativeTimeFormat` | Chrome 71+ | Session history, activity feed | Minimum Chrome version: 71 |
| `Intl.PluralRules` | Chrome 63+ | All pluralized strings | Minimum Chrome version: 63 |
| `Intl.ListFormat` | Chrome 72+ | Duration parts joining, feature lists | Minimum Chrome version: 72 |
| `Intl.Segmenter` | Chrome 87+ | Text segmentation for CJK | Optional; for advanced CJK support |
| `Intl.DisplayNames` | Chrome 81+ | Language name display in settings | For locale picker UI |

**Minimum Chrome version for full i18n support:** Chrome 76 (covers all required Intl APIs including `formatRange`). Since MV3 extensions require Chrome 88+, all APIs are guaranteed available.

---

### 1.11 Pluralization Rules by Language

Focus Mode - Blocker must handle pluralization correctly for every supported locale. The following table documents the plural categories used by each P1 and P2 language, per CLDR rules (as implemented by `Intl.PluralRules`).

**CLDR Plural Categories:**

- **zero** -- Used for the number 0 in some languages
- **one** -- Singular form (but rules vary: in French, 0 is also "one")
- **two** -- Dual form (Arabic, Hebrew, Slovenian)
- **few** -- Paucal form (Slavic languages: 2-4 in Russian, Czech, Polish)
- **many** -- Greater plural (Arabic 11-99, Russian 5-20)
- **other** -- Default fallback; always required

| Language | Categories Used | Rule Summary | Example: "N day(s)" |
|----------|----------------|--------------|---------------------|
| English (en) | one, other | 1 = one; else other | 1 day, 2 days, 0 days |
| German (de) | one, other | 1 = one; else other | 1 Tag, 2 Tage |
| French (fr) | one, other | 0-1 = one; else other | 0 jour, 1 jour, 2 jours |
| Spanish (es) | one, many, other | 1 = one; 1M+ = many; else other | 1 dia, 2 dias |
| Portuguese (pt) | one, many, other | 0-1 = one; 1M+ = many; else other | 0 dia, 1 dia, 2 dias |
| Italian (it) | one, many, other | 1 = one; else other | 1 giorno, 2 giorni |
| Dutch (nl) | one, other | 1 = one; else other | 1 dag, 2 dagen |
| Russian (ru) | one, few, many, other | Modular rules (see below) | 1 день, 2 дня, 5 дней, 21 день |
| Ukrainian (uk) | one, few, many, other | Same structure as Russian | 1 день, 2 днi, 5 днiв |
| Polish (pl) | one, few, many, other | 1 = one; 2-4 (not 12-14) = few; else many | 1 dzien, 2 dni, 5 dni |
| Czech (cs) | one, few, many, other | 1 = one; 2-4 = few; else other | 1 den, 2 dny, 5 dnu |
| Arabic (ar) | zero, one, two, few, many, other | 0 = zero; 1 = one; 2 = two; 3-10 = few; 11-99 = many; 100+ = other | Complex; see below |
| Japanese (ja) | other | No plural distinction | 1日, 2日, 100日 |
| Korean (ko) | other | No plural distinction | 1일, 2일, 100일 |
| Chinese (zh) | other | No plural distinction | 1天, 2天, 100天 |
| Turkish (tr) | one, other | 1 = one; else other | 1 gun, 2 gun |
| Hindi (hi) | one, other | 0-1 = one; else other | 1 दिन, 2 दिन |
| Vietnamese (vi) | other | No plural distinction | 1 ngay, 2 ngay |
| Thai (th) | other | No plural distinction | 1 วัน, 2 วัน |

**Russian plural rules in detail:**

```
one:   n % 10 == 1 AND n % 100 != 11
       Examples: 1, 21, 31, 41, 51, 61, 71, 81, 101, 121...
       "день" (den')

few:   n % 10 in [2,3,4] AND n % 100 not in [12,13,14]
       Examples: 2, 3, 4, 22, 23, 24, 32, 33, 34...
       "дня" (dnya)

many:  n % 10 == 0 OR n % 10 in [5,6,7,8,9] OR n % 100 in [11,12,13,14]
       Examples: 0, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20...
       "дней" (dney)
```

**Arabic plural rules in detail:**

```
zero:  n == 0                           "لا أيام" (la ayyam)
one:   n == 1                           "يوم واحد" (yawm wahid)
two:   n == 2                           "يومان" (yawman)
few:   n % 100 in [3..10]              "أيام" (ayyam) -- e.g., 3 أيام
many:  n % 100 in [11..99]             "يومًا" (yawman) -- e.g., 11 يومًا
other: everything else (0, 100, 200..) "يوم" (yawm) -- e.g., 100 يوم
```

**Implementation pattern for plural-safe message lookups:**

```javascript
/**
 * Get a pluralized message from the catalog.
 *
 * @param {string} baseKey - Base message key (e.g., 'streak_days').
 * @param {number} count - The count to pluralize for.
 * @param {string[]} [substitutions] - Additional substitutions.
 * @returns {string} The pluralized, formatted message.
 */
function getPluralMessage(baseKey, count, substitutions = []) {
  const rules = new Intl.PluralRules(navigator.language);
  const category = rules.select(count);
  const fmt = new Intl.NumberFormat(navigator.language);
  const formattedCount = fmt.format(count);

  // Try exact category first, then fall back to 'other'
  const key = `${baseKey}_${category}`;
  const fallbackKey = `${baseKey}_other`;

  let message = chrome.i18n.getMessage(key, [formattedCount, ...substitutions]);
  if (!message) {
    message = chrome.i18n.getMessage(fallbackKey, [formattedCount, ...substitutions]);
  }

  return message || `${formattedCount} ${baseKey}`;
}
```

---

## 2. Regional Pricing (PPP Adjustments)

Focus Mode - Blocker uses a purchasing power parity (PPP) adjusted pricing strategy to maximize global adoption. Users in lower-PPP countries see lower prices that represent equivalent purchasing effort, while users in higher-PPP countries see prices near or at the US base rate. This approach has been proven by companies like Spotify, Netflix, and JetBrains to dramatically increase conversion rates in price-sensitive markets.

---

### 2.1 Base Pricing Matrix

The following are the US-base prices, as established in Phase 03 (Feature Value Matrix) and Phase 09 (Payment Integration):

| Plan | US Price | Billing | Notes |
|------|----------|---------|-------|
| Free | $0.00 | -- | 10 sites, basic timer, 7-day stats |
| Pro Monthly | $4.99/mo | Monthly | Unlimited sites, Focus Score, Nuclear Mode, ambient sounds |
| Pro Annual | $2.99/mo ($35.88/yr) | Annual | Same as Pro Monthly; 40% savings |
| Lifetime | $49.99 | One-time | Permanent Pro access; no recurring billing |
| Team Monthly | $3.99/user/mo | Monthly | Per-seat; admin dashboard, shared blocklists |
| Team Annual | $2.49/user/mo ($29.88/user/yr) | Annual | Same as Team Monthly; 38% savings |

**Pricing philosophy:**
- Monthly price is the "anchor" that makes annual look like a deal
- Annual is the target conversion plan (higher LTV, lower churn)
- Lifetime is a high-margin accelerator (payback in 10 months vs. annual)
- Team pricing is per-seat with volume discounts at 10+ and 50+ seats

---

### 2.2 PPP-Adjusted Pricing by Market

Prices are adjusted using World Bank PPP conversion factors (2025 data), rounded to psychologically appealing price points per local convention. The "PPP multiplier" column shows the ratio of local purchasing power to the US.

#### Tier 1: Base Price Markets (PPP multiplier 0.85-1.15)

These markets have purchasing power close to the US. Prices are converted to local currency at near-market exchange rates with minor rounding.

| Market | Currency | Pro Monthly | Pro Annual | Lifetime | Team Monthly | PPP Mult. | Notes |
|--------|----------|------------|------------|----------|-------------|-----------|-------|
| US | USD | $4.99 | $2.99/mo ($35.88/yr) | $49.99 | $3.99/user/mo | 1.00 | Base price |
| Canada | CAD | C$6.49 | C$3.99/mo (C$47.88/yr) | C$64.99 | C$4.99/user/mo | 0.95 | Slightly below USD conversion |
| Australia | AUD | A$7.49 | A$4.49/mo (A$53.88/yr) | A$74.99 | A$5.99/user/mo | 0.92 | AUD typically trades below USD |
| UK | GBP | 3.99 | 2.49/mo (29.88/yr) | 39.99 | 2.99/user/mo | 1.02 | Premium market; GBP strength |
| Switzerland | CHF | CHF 4.90 | CHF 2.90/mo (CHF 34.80/yr) | CHF 49.90 | CHF 3.90/user/mo | 1.10 | Very high PPP; hold near base |
| Norway | NOK | 49 kr | 29 kr/mo (348 kr/yr) | 499 kr | 39 kr/user/mo | 1.05 | Round to conventional NOK prices |
| Sweden | SEK | 49 kr | 29 kr/mo (348 kr/yr) | 499 kr | 39 kr/user/mo | 0.98 | Similar to Norway |
| Denmark | DKK | 34 kr | 19 kr/mo (228 kr/yr) | 349 kr | 29 kr/user/mo | 1.03 | DKK-specific rounding |
| Singapore | SGD | S$6.49 | S$3.99/mo (S$47.88/yr) | S$64.99 | S$4.99/user/mo | 0.90 | High-income, tech-savvy market |

#### Tier 2: Moderate Discount Markets (PPP multiplier 0.55-0.84)

These markets have moderately lower purchasing power. Prices are discounted 15-35% from the USD-equivalent.

| Market | Currency | Pro Monthly | Pro Annual | Lifetime | Team Monthly | PPP Mult. | Discount |
|--------|----------|------------|------------|----------|-------------|-----------|----------|
| EU Core (DE/FR/IT/NL/AT/BE) | EUR | 4.49 | 2.69/mo (32.28/yr) | 44.99 | 3.49/user/mo | 0.82 | ~10% |
| Spain | EUR | 3.99 | 2.49/mo (29.88/yr) | 39.99 | 2.99/user/mo | 0.72 | ~20% |
| Portugal | EUR | 3.49 | 2.19/mo (26.28/yr) | 34.99 | 2.69/user/mo | 0.62 | ~30% |
| Japan | JPY | 700 | 440/mo (5,280/yr) | 6,980 | 540/user/mo | 0.78 | ~15% |
| South Korea | KRW | 5,900 | 3,500/mo (42,000/yr) | 59,000 | 4,500/user/mo | 0.73 | ~20% |
| Israel | ILS | 16.90 | 9.90/mo (118.80/yr) | 179.90 | 12.90/user/mo | 0.75 | ~18% |
| Taiwan | TWD | 149 | 89/mo (1,068/yr) | 1,490 | 119/user/mo | 0.70 | ~22% |
| Czech Republic | CZK | 99 | 59/mo (708/yr) | 990 | 79/user/mo | 0.60 | ~30% |
| Poland | PLN | 19.99 | 11.99/mo (143.88/yr) | 199.90 | 14.99/user/mo | 0.58 | ~32% |

#### Tier 3: Significant Discount Markets (PPP multiplier 0.25-0.54)

These markets require aggressive PPP adjustment to achieve meaningful penetration.

| Market | Currency | Pro Monthly | Pro Annual | Lifetime | Team Monthly | PPP Mult. | Discount |
|--------|----------|------------|------------|----------|-------------|-----------|----------|
| Brazil | BRL | R$14.90 | R$8.90/mo (R$106.80/yr) | R$149.90 | R$11.90/user/mo | 0.38 | ~45% |
| Russia | RUB | 249 | 149/mo (1,788/yr) | 2,490 | 199/user/mo | 0.32 | ~50% |
| Mexico | MXN | 49.90 | 29.90/mo (358.80/yr) | 499 | 39.90/user/mo | 0.40 | ~42% |
| Turkey | TRY | 49.90 | 29.90/mo (358.80/yr) | 499 | 39.90/user/mo | 0.30 | ~52% |
| Thailand | THB | 99 | 59/mo (708/yr) | 990 | 79/user/mo | 0.35 | ~48% |
| Colombia | COP | 14,900 | 8,900/mo (106,800/yr) | 149,900 | 11,900/user/mo | 0.33 | ~50% |
| Chile | CLP | 2,990 | 1,790/mo (21,480/yr) | 29,900 | 2,290/user/mo | 0.42 | ~40% |
| Argentina | ARS | 1,490 | 890/mo (10,680/yr) | 14,900 | 1,190/user/mo | 0.25 | ~60% |
| South Africa | ZAR | 49.90 | 29.90/mo (358.80/yr) | 499 | 39.90/user/mo | 0.35 | ~48% |
| Romania | RON | 19.90 | 11.90/mo (142.80/yr) | 199 | 14.90/user/mo | 0.45 | ~38% |
| Hungary | HUF | 1,490 | 890/mo (10,680/yr) | 14,900 | 1,190/user/mo | 0.48 | ~35% |

#### Tier 4: Deep Discount Markets (PPP multiplier < 0.25)

These markets require the steepest discounts. Revenue per user is low but volume potential is high, and these users contribute to social proof, reviews, and word-of-mouth.

| Market | Currency | Pro Monthly | Pro Annual | Lifetime | Team Monthly | PPP Mult. | Discount |
|--------|----------|------------|------------|----------|-------------|-----------|----------|
| India | INR | 149 | 89/mo (1,068/yr) | 1,490 | 119/user/mo | 0.18 | ~70% |
| Indonesia | IDR | 29,900 | 17,900/mo (214,800/yr) | 299,000 | 22,900/user/mo | 0.20 | ~65% |
| Vietnam | VND | 49,000 | 29,000/mo (348,000/yr) | 490,000 | 39,000/user/mo | 0.15 | ~75% |
| Philippines | PHP | 149 | 89/mo (1,068/yr) | 1,490 | 119/user/mo | 0.19 | ~68% |
| Egypt | EGP | 79 | 49/mo (588/yr) | 790 | 59/user/mo | 0.14 | ~78% |
| Pakistan | PKR | 490 | 290/mo (3,480/yr) | 4,900 | 390/user/mo | 0.10 | ~82% |
| Nigeria | NGN | 1,990 | 1,190/mo (14,280/yr) | 19,900 | 1,490/user/mo | 0.12 | ~80% |
| Bangladesh | BDT | 249 | 149/mo (1,788/yr) | 2,490 | 199/user/mo | 0.11 | ~81% |

#### Arabic-Speaking Markets (Mixed PPP)

Arabic markets span a wide PPP range, from wealthy Gulf states to lower-income North African countries:

| Market | Currency | Pro Monthly | Pro Annual | Lifetime | PPP Mult. | Tier |
|--------|----------|------------|------------|----------|-----------|------|
| UAE | AED | 17.90 | 10.90/mo (130.80/yr) | 179.90 | 0.85 | T1 |
| Saudi Arabia | SAR | 17.90 | 10.90/mo (130.80/yr) | 179.90 | 0.80 | T2 |
| Qatar | QAR | 17.90 | 10.90/mo (130.80/yr) | 179.90 | 1.05 | T1 |
| Kuwait | KWD | 1.49 | 0.89/mo (10.68/yr) | 14.90 | 0.95 | T1 |
| Bahrain | BHD | 1.89 | 1.09/mo (13.08/yr) | 18.90 | 0.82 | T2 |
| Oman | OMR | 1.89 | 1.09/mo (13.08/yr) | 18.90 | 0.70 | T2 |
| Jordan | JOD | 1.49 | 0.89/mo (10.68/yr) | 14.90 | 0.40 | T3 |
| Lebanon | USD | $2.99 | $1.79/mo ($21.48/yr) | $29.99 | 0.28 | T3 |
| Egypt | EGP | 79 | 49/mo (588/yr) | 790 | 0.14 | T4 |
| Morocco | MAD | 29.90 | 17.90/mo (214.80/yr) | 299 | 0.30 | T3 |
| Tunisia | TND | 6.90 | 3.90/mo (46.80/yr) | 69 | 0.28 | T3 |
| Algeria | DZD | 490 | 290/mo (3,480/yr) | 4,900 | 0.20 | T4 |
| Iraq | IQD | 4,900 | 2,900/mo (34,800/yr) | 49,000 | 0.22 | T4 |

---

### 2.3 Stripe Regional Pricing Configuration

Focus Mode - Blocker uses Stripe for payment processing via the Zovo unified payment platform. Regional pricing is configured through Stripe's Price objects with per-currency amounts.

**Stripe product and price architecture:**

```
Product: "Focus Mode - Blocker Pro"
  |
  +-- Price: pro_monthly_usd (USD $4.99/mo, recurring)
  +-- Price: pro_monthly_eur (EUR 4.49/mo, recurring)
  +-- Price: pro_monthly_gbp (GBP 3.99/mo, recurring)
  +-- Price: pro_monthly_jpy (JPY 700/mo, recurring)
  +-- Price: pro_monthly_brl (BRL 14.90/mo, recurring)
  +-- Price: pro_monthly_inr (INR 149/mo, recurring)
  +-- ... (one Price object per currency per billing interval)
  |
  +-- Price: pro_annual_usd (USD $35.88/yr, recurring)
  +-- Price: pro_annual_eur (EUR 32.28/yr, recurring)
  +-- ... (same pattern)
  |
  +-- Price: pro_lifetime_usd (USD $49.99, one_time)
  +-- Price: pro_lifetime_eur (EUR 44.99, one_time)
  +-- ... (same pattern)
```

**Stripe Checkout session configuration:**

```javascript
/**
 * Create a Stripe Checkout session with locale-aware pricing.
 *
 * @param {string} userLocale - BCP 47 locale tag from the extension.
 * @param {string} plan - 'monthly' | 'annual' | 'lifetime'.
 * @param {string} [coupon] - Optional Stripe coupon ID (e.g., student discount).
 * @returns {object} Stripe Checkout session configuration.
 */
function createCheckoutConfig(userLocale, plan, coupon) {
  const currency = getCurrencyForLocale(userLocale);
  const priceId = getPriceId(plan, currency);

  return {
    mode: plan === 'lifetime' ? 'payment' : 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    currency: currency.toLowerCase(),
    locale: mapToStripeLocale(userLocale),
    allow_promotion_codes: true,
    discounts: coupon ? [{ coupon }] : undefined,
    // Stripe handles tax calculation based on customer location
    automatic_tax: { enabled: true },
    // Customer portal for plan management
    customer_creation: 'always',
    billing_address_collection: 'auto',
    // Success and cancel URLs
    success_url: `https://zovo.one/focus-mode/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `https://zovo.one/focus-mode/pricing`,
    // Metadata for license key generation
    metadata: {
      extension_id: 'focus_mode_blocker',
      plan: plan,
      source_locale: userLocale,
    },
  };
}

/**
 * Map user locale to a Stripe-supported locale for the Checkout UI.
 * Stripe supports a subset of locales for its hosted checkout page.
 *
 * @param {string} locale - BCP 47 locale tag.
 * @returns {string} Stripe locale code.
 */
function mapToStripeLocale(locale) {
  const stripeLocales = {
    'en': 'en', 'en-US': 'en', 'en-GB': 'en',
    'de': 'de', 'de-DE': 'de', 'de-AT': 'de', 'de-CH': 'de',
    'fr': 'fr', 'fr-FR': 'fr', 'fr-CA': 'fr',
    'es': 'es', 'es-ES': 'es', 'es-MX': 'es',
    'pt': 'pt', 'pt-BR': 'pt-BR', 'pt-PT': 'pt',
    'ja': 'ja', 'ja-JP': 'ja',
    'ko': 'ko', 'ko-KR': 'ko',
    'zh': 'zh', 'zh-CN': 'zh', 'zh-TW': 'zh-TW',
    'ru': 'ru', 'ru-RU': 'ru',
    'ar': 'ar', 'ar-SA': 'ar',
    'it': 'it', 'it-IT': 'it',
    'nl': 'nl', 'nl-NL': 'nl',
    'pl': 'pl', 'pl-PL': 'pl',
    'tr': 'tr', 'tr-TR': 'tr',
    'th': 'th', 'th-TH': 'th',
    'vi': 'vi', 'vi-VN': 'vi',
    'hi': 'hi', 'hi-IN': 'hi',
  };

  // Try exact match, then language prefix, then default to 'auto'
  return stripeLocales[locale] ||
         stripeLocales[locale.split('-')[0]] ||
         'auto';
}

/**
 * Map user locale to the correct currency for pricing.
 *
 * @param {string} locale - BCP 47 locale tag.
 * @returns {string} ISO 4217 currency code.
 */
function getCurrencyForLocale(locale) {
  const localeCurrencyMap = {
    // Tier 1
    'en-US': 'USD', 'en-CA': 'CAD', 'en-AU': 'AUD', 'en-GB': 'GBP',
    'en-NZ': 'NZD', 'en-SG': 'SGD',
    'de-CH': 'CHF', 'fr-CH': 'CHF', 'it-CH': 'CHF',
    'nb-NO': 'NOK', 'nn-NO': 'NOK',
    'sv-SE': 'SEK', 'da-DK': 'DKK',
    // Tier 2
    'de-DE': 'EUR', 'de-AT': 'EUR',
    'fr-FR': 'EUR', 'fr-BE': 'EUR',
    'es-ES': 'EUR', 'it-IT': 'EUR',
    'nl-NL': 'EUR', 'nl-BE': 'EUR',
    'pt-PT': 'EUR', 'fi-FI': 'EUR',
    'el-GR': 'EUR', 'et-EE': 'EUR',
    'lv-LV': 'EUR', 'lt-LT': 'EUR',
    'sk-SK': 'EUR', 'sl-SI': 'EUR',
    'ja-JP': 'JPY', 'ko-KR': 'KRW',
    'he-IL': 'ILS', 'zh-TW': 'TWD',
    'cs-CZ': 'CZK', 'pl-PL': 'PLN',
    // Tier 3
    'pt-BR': 'BRL', 'ru-RU': 'RUB',
    'es-MX': 'MXN', 'tr-TR': 'TRY',
    'th-TH': 'THB', 'es-CO': 'COP',
    'es-CL': 'CLP', 'es-AR': 'ARS',
    'en-ZA': 'ZAR', 'ro-RO': 'RON',
    'hu-HU': 'HUF',
    // Tier 4
    'hi-IN': 'INR', 'bn-IN': 'INR', 'ta-IN': 'INR',
    'te-IN': 'INR', 'mr-IN': 'INR', 'gu-IN': 'INR',
    'id-ID': 'IDR', 'vi-VN': 'VND',
    'tl-PH': 'PHP', 'fil-PH': 'PHP',
    'ar-EG': 'EGP', 'ur-PK': 'PKR',
    'en-NG': 'NGN', 'bn-BD': 'BDT',
    // Arabic markets
    'ar-AE': 'AED', 'ar-SA': 'SAR',
    'ar-QA': 'QAR', 'ar-KW': 'KWD',
    'ar-BH': 'BHD', 'ar-OM': 'OMR',
    'ar-JO': 'JOD', 'ar-LB': 'USD',
    'ar-MA': 'MAD', 'ar-TN': 'TND',
    'ar-DZ': 'DZD', 'ar-IQ': 'IQD',
  };

  // Try exact match, then fall back to USD
  const currency = localeCurrencyMap[locale];
  if (currency) return currency;

  // Try matching just the language part for generic fallbacks
  const lang = locale.split('-')[0];
  if (lang === 'en') return 'USD';
  if (lang === 'de' || lang === 'fr' || lang === 'it' || lang === 'nl' ||
      lang === 'es' || lang === 'pt') return 'EUR';
  if (lang === 'ar') return 'USD'; // Generic Arabic defaults to USD

  return 'USD'; // Global fallback
}
```

**Stripe Price creation script (run once during setup):**

```javascript
// scripts/create-stripe-prices.js
// Run: node scripts/create-stripe-prices.js

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PRODUCT_ID = 'prod_focusmode_pro';

const PRICE_CONFIGS = [
  // Tier 1: Base price
  { currency: 'usd', monthly: 499, annual: 3588, lifetime: 4999 },
  { currency: 'cad', monthly: 649, annual: 4788, lifetime: 6499 },
  { currency: 'aud', monthly: 749, annual: 5388, lifetime: 7499 },
  { currency: 'gbp', monthly: 399, annual: 2988, lifetime: 3999 },
  { currency: 'chf', monthly: 490, annual: 3480, lifetime: 4990 },
  { currency: 'nok', monthly: 4900, annual: 34800, lifetime: 49900 },
  { currency: 'sek', monthly: 4900, annual: 34800, lifetime: 49900 },
  { currency: 'dkk', monthly: 3400, annual: 22800, lifetime: 34900 },
  { currency: 'sgd', monthly: 649, annual: 4788, lifetime: 6499 },

  // Tier 2: Moderate discount
  { currency: 'eur', monthly: 449, annual: 3228, lifetime: 4499 },
  { currency: 'jpy', monthly: 700, annual: 5280, lifetime: 6980 },
  { currency: 'krw', monthly: 5900, annual: 42000, lifetime: 59000 },
  { currency: 'ils', monthly: 1690, annual: 11880, lifetime: 17990 },
  { currency: 'twd', monthly: 14900, annual: 106800, lifetime: 149000 },
  { currency: 'czk', monthly: 9900, annual: 70800, lifetime: 99000 },
  { currency: 'pln', monthly: 1999, annual: 14388, lifetime: 19990 },

  // Tier 3: Significant discount
  { currency: 'brl', monthly: 1490, annual: 10680, lifetime: 14990 },
  { currency: 'rub', monthly: 24900, annual: 178800, lifetime: 249000 },
  { currency: 'mxn', monthly: 4990, annual: 35880, lifetime: 49900 },
  { currency: 'try', monthly: 4990, annual: 35880, lifetime: 49900 },
  { currency: 'thb', monthly: 9900, annual: 70800, lifetime: 99000 },
  { currency: 'cop', monthly: 1490000, annual: 10680000, lifetime: 14990000 },
  { currency: 'clp', monthly: 299000, annual: 2148000, lifetime: 2990000 },
  { currency: 'ars', monthly: 149000, annual: 1068000, lifetime: 1490000 },
  { currency: 'zar', monthly: 4990, annual: 35880, lifetime: 49900 },
  { currency: 'ron', monthly: 1990, annual: 14280, lifetime: 19900 },
  { currency: 'huf', monthly: 149000, annual: 1068000, lifetime: 1490000 },

  // Tier 4: Deep discount
  { currency: 'inr', monthly: 14900, annual: 106800, lifetime: 149000 },
  { currency: 'idr', monthly: 2990000, annual: 21480000, lifetime: 29900000 },
  { currency: 'vnd', monthly: 4900000, annual: 34800000, lifetime: 49000000 },
  { currency: 'php', monthly: 14900, annual: 106800, lifetime: 149000 },
  { currency: 'egp', monthly: 7900, annual: 58800, lifetime: 79000 },
  { currency: 'pkr', monthly: 49000, annual: 348000, lifetime: 490000 },

  // Arabic markets
  { currency: 'aed', monthly: 1790, annual: 13080, lifetime: 17990 },
  { currency: 'sar', monthly: 1790, annual: 13080, lifetime: 17990 },
  { currency: 'qar', monthly: 1790, annual: 13080, lifetime: 17990 },
  { currency: 'kwd', monthly: 149, annual: 1068, lifetime: 1490 },
  { currency: 'bhd', monthly: 189, annual: 1308, lifetime: 1890 },
  { currency: 'omr', monthly: 189, annual: 1308, lifetime: 1890 },
  { currency: 'jod', monthly: 149, annual: 1068, lifetime: 1490 },
  { currency: 'mad', monthly: 2990, annual: 21480, lifetime: 29900 },
  { currency: 'tnd', monthly: 690, annual: 4680, lifetime: 6900 },
];

async function createPrices() {
  for (const config of PRICE_CONFIGS) {
    // Monthly subscription
    await stripe.prices.create({
      product: PRODUCT_ID,
      unit_amount: config.monthly,
      currency: config.currency,
      recurring: { interval: 'month' },
      lookup_key: `pro_monthly_${config.currency}`,
      metadata: { plan: 'monthly', tier: getTier(config.currency) },
    });

    // Annual subscription
    await stripe.prices.create({
      product: PRODUCT_ID,
      unit_amount: config.annual,
      currency: config.currency,
      recurring: { interval: 'year' },
      lookup_key: `pro_annual_${config.currency}`,
      metadata: { plan: 'annual', tier: getTier(config.currency) },
    });

    // Lifetime one-time
    await stripe.prices.create({
      product: PRODUCT_ID,
      unit_amount: config.lifetime,
      currency: config.currency,
      lookup_key: `pro_lifetime_${config.currency}`,
      metadata: { plan: 'lifetime', tier: getTier(config.currency) },
    });

    console.log(`Created prices for ${config.currency.toUpperCase()}`);
  }
}

createPrices().catch(console.error);
```

---

### 2.4 Currency Display Implementation

Currency formatting in the extension UI (pricing page, paywall modals, upgrade prompts) uses `Intl.NumberFormat` with the `currency` style.

```javascript
/**
 * Format a price for display in the user's local currency.
 *
 * @param {number} amount - Amount in the smallest currency unit (cents, yen, etc.).
 * @param {string} currency - ISO 4217 currency code.
 * @param {string} locale - BCP 47 locale tag.
 * @returns {string} Formatted price string.
 *
 * Examples:
 *   (499, 'USD', 'en-US')    -> "$4.99"
 *   (449, 'EUR', 'de-DE')    -> "4,49 €"
 *   (449, 'EUR', 'fr-FR')    -> "4,49 €"
 *   (700, 'JPY', 'ja-JP')    -> "¥700"
 *   (1490, 'BRL', 'pt-BR')   -> "R$ 14,90"
 *   (14900, 'INR', 'hi-IN')  -> "₹149.00" or "₹149"
 *   (24900, 'RUB', 'ru-RU')  -> "249,00 ₽" or "249 ₽"
 *   (5900, 'KRW', 'ko-KR')   -> "₩5,900"
 *   (1999, 'PLN', 'pl-PL')   -> "19,99 zł"
 *   (1790, 'SAR', 'ar-SA')   -> "17.90 ر.س."
 */
function formatPrice(amount, currency, locale) {
  // Zero-decimal currencies (JPY, KRW, VND, etc.)
  const zeroDecimalCurrencies = [
    'JPY', 'KRW', 'VND', 'CLP', 'IDR', 'HUF',
    'BIF', 'DJF', 'GNF', 'KMF', 'MGA', 'PYG',
    'RWF', 'UGX', 'VUV', 'XAF', 'XOF', 'XPF',
  ];

  const isZeroDecimal = zeroDecimalCurrencies.includes(currency.toUpperCase());
  const displayAmount = isZeroDecimal ? amount : amount / 100;

  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    // Minimize fraction digits for zero-decimal currencies
    minimumFractionDigits: isZeroDecimal ? 0 : undefined,
    maximumFractionDigits: isZeroDecimal ? 0 : undefined,
  });

  return formatter.format(displayAmount);
}

/**
 * Format a price with period label (e.g., "$4.99/mo").
 *
 * @param {number} amount - Amount in smallest currency unit.
 * @param {string} currency - ISO 4217 currency code.
 * @param {string} locale - BCP 47 locale tag.
 * @param {string} period - 'month' | 'year' | 'one_time'.
 * @returns {string} Price with period suffix.
 */
function formatPriceWithPeriod(amount, currency, locale, period) {
  const price = formatPrice(amount, currency, locale);

  if (period === 'one_time') {
    return price; // No period suffix for lifetime
  }

  const periodLabel = chrome.i18n.getMessage(`price_period_${period}`);
  // e.g., en: "$4.99/mo", de: "4,49 €/Monat", ja: "¥700/月"
  return chrome.i18n.getMessage('price_with_period', [price, periodLabel]);
}
```

**Currency symbol position by locale:**

| Locale | Symbol Position | Example (4.99 EUR) | Notes |
|--------|----------------|---------------------|-------|
| en-US (USD) | Before, no space | $4.99 | Standard US format |
| en-GB (GBP) | Before, no space | £3.99 | Standard UK format |
| de-DE (EUR) | After, with space | 4,49 € | German convention |
| fr-FR (EUR) | After, with non-breaking space | 4,49 € | French convention |
| es-ES (EUR) | After, with space | 3,99 € | Spanish convention |
| pt-BR (BRL) | Before, with space | R$ 14,90 | Brazilian convention |
| ja-JP (JPY) | Before, no space | ¥700 | No decimals for JPY |
| ko-KR (KRW) | Before, no space | ₩5,900 | No decimals for KRW |
| ru-RU (RUB) | After, with space | 249 ₽ | Ruble sign after |
| ar-SA (SAR) | After, with space | 17.90 ر.س. | Arabic convention |
| pl-PL (PLN) | After, with space | 19,99 zl | Zloty after |
| hi-IN (INR) | Before, no space | ₹149 | Rupee sign before |
| tr-TR (TRY) | Before, no space | ₺49,90 | Lira sign before |
| zh-CN (CNY) | Before, no space | ¥4.99 | Same symbol as JPY |

---

### 2.5 Regional Pricing Strategy

**Revenue optimization principles:**

1. **Do not leave money on the table in Tier 1 markets.** Users in the US, UK, Canada, Australia, and Scandinavia have high willingness to pay and are accustomed to SaaS pricing. Keep prices at or near the base rate.

2. **Moderate discounts in Tier 2 drive volume.** EU core, Japan, and Korea have large, tech-savvy user bases but slightly lower willingness to pay for browser extensions. A 10-20% PPP adjustment increases conversion without significant revenue loss per user.

3. **Aggressive discounts in Tier 3-4 are a growth investment.** Users in Brazil, India, Russia, and Southeast Asia would never pay $4.99/month for a Chrome extension but will pay the local equivalent of $1-2/month. These users provide:
   - Higher install counts (social proof on CWS listing)
   - More reviews (users in these markets are prolific reviewers)
   - Word-of-mouth in untapped markets
   - Team plan seeds (one user at a company leads to team adoption)

4. **VPN/proxy price-hopping mitigation.** While some users may use VPNs to access lower prices, the risk is low for a $5/month product. Stripe's billing address verification provides sufficient protection. Do not over-engineer this.

5. **Annual plan emphasis in price-sensitive markets.** In Tier 3-4 markets, the annual plan discount is even more compelling. Marketing in these markets should lead with the annual price, not the monthly price. For example, in India, lead with "₹89/month (billed annually)" rather than "₹149/month."

**Regional pricing A/B testing plan:**

| Test | Hypothesis | Metric | Duration |
|------|-----------|--------|----------|
| India: 149 vs 99 INR/mo | Lower price increases conversion > revenue loss | Revenue/1000 installs | 4 weeks |
| Brazil: 14.90 vs 9.90 BRL/mo | Same as above | Revenue/1000 installs | 4 weeks |
| EU: 4.49 vs 3.99 EUR/mo | Moderate cut increases conversion | Revenue/1000 installs | 4 weeks |
| Japan: Annual emphasis | Leading with annual price increases annual plan share | Annual plan % | 4 weeks |
| Global: Lifetime vs no-lifetime | Removing lifetime option increases subscription LTV | 12-month LTV | 8 weeks |

---

### 2.6 Student Discount Considerations per Market

Students are a primary target persona for Focus Mode - Blocker. Student discounts vary by market based on verification infrastructure and cultural expectations.

| Market | Student Discount | Verification Method | Rationale |
|--------|-----------------|--------------------|-----------|
| US/Canada | 50% off (Pro Monthly: $2.49) | SheerID verification | .edu email is unreliable; SheerID provides proper verification |
| UK | 50% off (Pro Monthly: £1.99) | SheerID or UNiDAYS | UNiDAYS is widely used by UK students |
| EU (DE/FR/ES/IT) | 40% off | SheerID | Lower base discount because PPP price is already reduced |
| Japan | 40% off (Pro Monthly: ¥420) | Email domain verification (.ac.jp) | Japanese university email domains are consistent |
| Korea | 40% off (Pro Monthly: ₩3,540) | Email domain verification (.ac.kr) | Same as Japan |
| Brazil | 30% off (Pro Monthly: R$10.43) | Self-declaration + email | SheerID coverage is limited; price is already deeply discounted |
| India | No additional discount | N/A | Price is already at ₹149/mo (T4 deep discount); further discounts are unsustainable |
| Russia | 30% off (Pro Monthly: 174 RUB) | Email domain verification (.edu.ru) | Russian university domains are identifiable |
| Mexico | 30% off | Self-declaration + email | Similar to Brazil |
| Turkey | 30% off | Email domain verification (.edu.tr) | Turkish university domains are consistent |
| Arab markets (T1-T2) | 40% off | SheerID where available | Gulf state students have moderate purchasing power |
| Arab markets (T3-T4) | No additional discount | N/A | Prices are already deeply discounted |

**Student discount implementation notes:**

1. **Discount coupon codes** are generated in Stripe as percentage-off coupons per region. The extension detects the user's locale and applies the correct coupon at checkout.

2. **Verification flow:** User clicks "Student Discount" on the upgrade page, is redirected to the verification partner (SheerID), and upon verification receives a unique single-use coupon code that is auto-applied at Stripe Checkout.

3. **Re-verification:** Student status is re-verified annually. 30 days before the annual re-verification date, the user receives an email prompting re-verification. If re-verification fails, the subscription reverts to the standard regional price.

4. **Student plan limitations:** Student discount applies only to the Pro Monthly and Pro Annual plans (not Lifetime or Team). This prevents students from locking in a lifetime purchase at a steep discount.

---

## 3. Locale-Specific Blocklist Suggestions

When a user first installs Focus Mode - Blocker, onboarding slide 2 presents a curated list of suggested sites to block. The user can toggle each site on/off and add custom sites. The default suggestions must be relevant to the user's locale -- a user in Japan should see Yahoo Japan and Niconico alongside global sites like YouTube, not just the English-centric defaults.

---

### 3.1 Design Principles

1. **Global + Regional:** Every user sees a base set of globally distracting sites (YouTube, Twitter/X, Instagram, TikTok, Facebook, Reddit) plus region-specific sites.
2. **Category-balanced:** Each list includes social media, news, entertainment, shopping, and messaging to demonstrate the breadth of the blocker.
3. **Pre-checked vs. unchecked:** The top 5 globally popular sites are pre-checked (toggled on). Regional sites are shown but unchecked by default, letting the user opt in.
4. **Data-driven refinement:** After launch, anonymized analytics (which sites users actually add in the first 7 days) will refine the regional defaults.
5. **No offensive or politically sensitive sites:** Avoid listing government sites, political news outlets, or sites that could be perceived as censorship in certain regions.

---

### 3.2 Global Default Sites (All Locales)

These sites appear for every user regardless of locale. They represent the most universally distracting sites based on Chrome extension market research (Phase 01).

| Site | Category | Pre-checked | Rationale |
|------|----------|-------------|-----------|
| youtube.com | Video | Yes | #1 time sink globally |
| twitter.com (x.com) | Social | Yes | High-frequency distraction |
| reddit.com | Forum | Yes | "Rabbit hole" browsing |
| instagram.com | Social | Yes | Visual dopamine loop |
| facebook.com | Social | Yes | Still massive global usage |
| tiktok.com | Video | No | Huge but primarily mobile |
| twitch.tv | Streaming | No | Significant for gaming demographic |
| netflix.com | Streaming | No | Session-killing entertainment |
| linkedin.com | Professional Social | No | Surprisingly distracting for knowledge workers |
| pinterest.com | Visual | No | Common distraction for creative users |
| news.ycombinator.com | Tech News | No | Programmer-specific time sink |
| discord.com | Messaging | No | Community chat distraction |

---

### 3.3 Regional Blocklist Suggestions

#### Japan (ja, ja-JP)

Japanese internet culture has distinct platforms that dominate over Western equivalents. Yahoo Japan is the most-visited site in Japan (ahead of Google for many use cases). Niconico is Japan's YouTube. LINE is the dominant messaging platform.

| Site | Category | Pre-checked | Monthly Visits (JP) | Notes |
|------|----------|-------------|---------------------|-------|
| yahoo.co.jp | Portal/News | Yes | 3.2B | Japan's #1 portal; email, news, auctions |
| nicovideo.jp | Video | Yes | 520M | Japanese video sharing; anime, gaming |
| line.me | Messaging | No | 780M | LINE messaging web interface |
| ameblo.jp | Blog | No | 340M | Ameba blog platform; celebrity blogs |
| 5ch.net (2ch) | Forum | No | 280M | Japanese anonymous forum (like Reddit) |
| pixiv.net | Art | No | 210M | Illustration community |
| kakaku.com | Shopping/Reviews | No | 180M | Price comparison; product reviews |
| abema.tv | Streaming | No | 150M | Japanese streaming service |
| note.com | Blog | No | 120M | Japanese writing/blogging platform |
| mercari.com | Shopping | No | 160M | Japanese marketplace (Mercari) |
| livedoor.com | News | No | 130M | News aggregator |
| fc2.com | Various | No | 200M | Blogs, video, web hosting |

**Onboarding display (ja):**

```
集中を妨げるサイトを選んでください:

[x] youtube.com      - 動画
[x] twitter.com      - SNS
[x] yahoo.co.jp      - ニュース・ポータル
[x] nicovideo.jp     - 動画
[x] instagram.com    - SNS
[ ] reddit.com       - フォーラム
[ ] line.me          - メッセージ
[ ] ameblo.jp        - ブログ
[ ] 5ch.net          - 掲示板
[ ] tiktok.com       - 動画
[ ] facebook.com     - SNS
[ ] pixiv.net        - イラスト

+ カスタムサイトを追加
```

---

#### Russia (ru, ru-RU)

Russia has a distinct internet ecosystem with VK (VKontakte) and OK (Odnoklassniki) as dominant social networks, Yandex services replacing many Google services, and Mail.ru as the primary email and portal provider.

| Site | Category | Pre-checked | Monthly Visits (RU) | Notes |
|------|----------|-------------|---------------------|-------|
| vk.com | Social | Yes | 4.5B | Russia's dominant social network |
| ok.ru | Social | Yes | 1.8B | Odnoklassniki; older demographic social |
| yandex.ru | Portal/Search | No | 3.8B | Portal, but also legitimate work tool |
| mail.ru | Portal/Email | No | 2.1B | Email + news portal |
| dzen.ru | News/Content | Yes | 1.2B | Yandex Zen content platform |
| pikabu.ru | Forum | No | 450M | Russian Reddit equivalent |
| habr.com | Tech | No | 380M | Russian Hacker News |
| kinopoisk.ru | Entertainment | No | 320M | Movie reviews and streaming |
| avito.ru | Shopping | No | 1.5B | Classifieds marketplace |
| 2gis.ru | Maps | No | 280M | Maps and business directory |
| sports.ru | Sports | No | 350M | Sports news |
| lenta.ru | News | No | 420M | News portal |
| wildberries.ru | Shopping | No | 900M | Russia's largest online retailer |

**Onboarding display (ru):**

```
Выберите сайты, которые вас отвлекают:

[x] youtube.com      - Видео
[x] vk.com           - Соцсети
[x] ok.ru            - Соцсети
[x] twitter.com      - Соцсети
[x] dzen.ru          - Новости/контент
[ ] instagram.com    - Соцсети
[ ] reddit.com       - Форумы
[ ] pikabu.ru        - Форумы
[ ] mail.ru          - Почта/портал
[ ] habr.com         - Технологии
[ ] kinopoisk.ru     - Развлечения
[ ] tiktok.com       - Видео

+ Добавить свой сайт
```

---

#### Brazil (pt-BR)

Brazil has a strong digital culture with high social media usage. While global platforms dominate, local sites like Globo.com (news) and Mercado Livre (shopping) are significant distractions.

| Site | Category | Pre-checked | Monthly Visits (BR) | Notes |
|------|----------|-------------|---------------------|-------|
| globo.com | News/Portal | Yes | 2.8B | Brazil's #1 news portal (G1, GE, etc.) |
| uol.com.br | News/Portal | Yes | 1.5B | Major portal and news |
| mercadolivre.com.br | Shopping | No | 1.2B | Latin America's largest marketplace |
| terra.com.br | Portal | No | 380M | News and entertainment portal |
| r7.com | News | No | 450M | RecordTV news portal |
| ig.com.br | Portal | No | 280M | Internet Group portal |
| olx.com.br | Classifieds | No | 340M | Classifieds marketplace |
| ifood.com.br | Food | No | 220M | Food delivery (browsing time sink) |
| letras.mus.br | Music | No | 180M | Song lyrics site |
| ge.globo.com | Sports | No | 520M | Globo sports news |
| techtudo.com.br | Tech | No | 200M | Tech news and reviews |
| americanas.com.br | Shopping | No | 280M | Online retailer |

**Onboarding display (pt-BR):**

```
Escolha os sites que mais te distraem:

[x] youtube.com           - Video
[x] twitter.com           - Redes sociais
[x] instagram.com         - Redes sociais
[x] globo.com             - Noticias
[x] facebook.com          - Redes sociais
[ ] reddit.com            - Foruns
[ ] uol.com.br            - Portal/Noticias
[ ] mercadolivre.com.br   - Compras
[ ] tiktok.com            - Video
[ ] ge.globo.com          - Esportes
[ ] terra.com.br          - Portal
[ ] twitch.tv             - Streaming

+ Adicionar site personalizado
```

---

#### South Korea (ko, ko-KR)

South Korea has one of the most distinct internet ecosystems in the world. Naver dominates search and content, KakaoTalk dominates messaging, and Daum is a major portal.

| Site | Category | Pre-checked | Monthly Visits (KR) | Notes |
|------|----------|-------------|---------------------|-------|
| naver.com | Portal/Search | Yes | 4.8B | Korea's Google equivalent; webtoons, news, mail |
| daum.net | Portal | Yes | 1.6B | Second-largest portal; Daum Cafe community |
| kakao.com | Messaging/Services | No | 1.2B | KakaoTalk web, KakaoPay, etc. |
| namu.wiki | Wiki | No | 680M | Korean wiki (more engaging than Wikipedia for KR users) |
| fmkorea.com | Forum | No | 450M | Major Korean community forum |
| dcinside.com | Forum | No | 520M | Korean image board / forum |
| ppomppu.co.kr | Deals/Shopping | No | 280M | Deal sharing community |
| mlbpark.donga.com | Sports | No | 220M | Baseball/sports forum |
| inven.co.kr | Gaming | No | 380M | Gaming community and news |
| theqoo.net | Entertainment | No | 320M | K-pop and entertainment forum |
| coupang.com | Shopping | No | 800M | Korea's Amazon |
| tistory.com | Blog | No | 480M | Kakao blog platform |

**Onboarding display (ko):**

```
집중을 방해하는 사이트를 선택하세요:

[x] youtube.com      - 동영상
[x] naver.com        - 포털/검색
[x] twitter.com      - 소셜 미디어
[x] instagram.com    - 소셜 미디어
[x] daum.net         - 포털
[ ] facebook.com     - 소셜 미디어
[ ] reddit.com       - 포럼
[ ] namu.wiki        - 위키
[ ] fmkorea.com      - 커뮤니티
[ ] dcinside.com     - 커뮤니티
[ ] tiktok.com       - 동영상
[ ] coupang.com      - 쇼핑

+ 사이트 직접 추가
```

---

#### China (zh, zh-CN)

While Chrome usage in mainland China requires VPN, there is a significant Chinese-speaking user base in Taiwan, Hong Kong, Singapore, and among VPN users in mainland China. Chinese internet has entirely unique platforms.

| Site | Category | Pre-checked | Notes |
|------|----------|-------------|-------|
| weibo.com | Social | Yes | Chinese Twitter equivalent |
| bilibili.com | Video | Yes | Chinese YouTube/Niconico for Gen Z |
| zhihu.com | Q&A/Forum | Yes | Chinese Quora; deep rabbit holes |
| douyin.com | Video | No | TikTok's Chinese version (web) |
| xiaohongshu.com | Social/Shopping | No | "Little Red Book"; lifestyle platform |
| douban.com | Reviews/Community | No | Movie, book, music reviews; groups |
| baidu.com | Search/Portal | No | Search + Tieba forum |
| tieba.baidu.com | Forum | No | Baidu's community forums |
| taobao.com | Shopping | No | Alibaba marketplace |
| jd.com | Shopping | No | JD.com; electronics and general retail |
| acfun.cn | Video | No | Another video platform |
| huya.com | Streaming | No | Game streaming |

---

#### India (hi, hi-IN, en-IN, and other Indian locales)

India is predominantly English-language online, but with distinct platforms for cricket, e-commerce, and entertainment.

| Site | Category | Pre-checked | Monthly Visits (IN) | Notes |
|------|----------|-------------|---------------------|-------|
| flipkart.com | Shopping | Yes | 1.5B | India's top e-commerce platform |
| hotstar.com | Streaming | Yes | 680M | Disney+ Hotstar; cricket, Bollywood |
| cricbuzz.com | Sports | No | 520M | Cricket scores and news |
| espncricinfo.com | Sports | No | 380M | Cricket (ESPN's cricket site) |
| ndtv.com | News | No | 420M | Major news portal |
| timesofindia.com | News | No | 680M | India's largest English newspaper |
| indianexpress.com | News | No | 280M | News outlet |
| myntra.com | Shopping | No | 340M | Fashion e-commerce |
| amazon.in | Shopping | No | 1.8B | Amazon India |
| quora.com | Q&A | No | 320M | Popular Q&A platform in India |
| sharechat.com | Social | No | 180M | Indian-language social platform |
| scroll.in | News | No | 120M | News and long-form journalism |

---

#### Germany (de, de-DE)

Germany has high internet penetration with a mix of global and local sites.

| Site | Category | Pre-checked | Monthly Visits (DE) | Notes |
|------|----------|-------------|---------------------|-------|
| web.de | Email/Portal | Yes | 1.2B | Major email and news portal |
| gmx.de | Email/Portal | Yes | 980M | Email and news portal |
| bild.de | News | No | 680M | Germany's most-read tabloid |
| spiegel.de | News | No | 520M | Der Spiegel news |
| heise.de | Tech | No | 340M | Tech news (like Ars Technica for DE) |
| t-online.de | Portal | No | 480M | Telekom portal and news |
| chip.de | Tech | No | 280M | Tech reviews and downloads |
| ebay-kleinanzeigen.de | Classifieds | No | 620M | Germany's Craigslist |
| otto.de | Shopping | No | 220M | Major online retailer |
| sport1.de | Sports | No | 180M | Sports news |
| gutefrage.net | Q&A | No | 280M | German Q&A site |
| mydealz.de | Deals | No | 320M | Deal sharing community |

---

#### France (fr, fr-FR)

| Site | Category | Pre-checked | Monthly Visits (FR) | Notes |
|------|----------|-------------|---------------------|-------|
| leboncoin.fr | Classifieds | Yes | 1.8B | France's #1 classifieds; massive usage |
| orange.fr | Portal/Email | Yes | 980M | Orange telecom portal |
| lemonde.fr | News | No | 520M | Le Monde newspaper |
| lefigaro.fr | News | No | 380M | Le Figaro newspaper |
| bfmtv.com | News | No | 420M | 24-hour news channel |
| cdiscount.com | Shopping | No | 340M | E-commerce platform |
| sfr.fr | Portal | No | 280M | SFR telecom portal |
| allocine.fr | Entertainment | No | 220M | Movie reviews and showtimes |
| marmiton.org | Recipes | No | 180M | Recipe site (time sink during work) |
| jeuxvideo.com | Gaming | No | 320M | Gaming news and forums |
| fnac.com | Shopping | No | 200M | Electronics and culture retailer |
| lequipe.fr | Sports | No | 380M | Sports news |

---

#### Spanish-Speaking Markets (es)

The Spanish-speaking world spans multiple countries with varying local sites. The base Spanish list covers common distractions across all Spanish-speaking markets, with country-specific additions.

**Common Spanish-speaking sites:**

| Site | Category | Markets | Notes |
|------|----------|---------|-------|
| marca.com | Sports | ES | Spain's top sports newspaper |
| elpais.com | News | ES, LATAM | Major Spanish-language newspaper |
| as.com | Sports | ES, LATAM | Sports news |
| xataka.com | Tech | ES, LATAM | Tech news in Spanish |
| mercadolibre.com | Shopping | LATAM | Latin America's Amazon |
| clarin.com | News | AR | Argentina's top newspaper |
| infobae.com | News | AR, LATAM | Major Latin American news |
| eluniversal.com.mx | News | MX | Mexico's major newspaper |
| milanuncios.com | Classifieds | ES | Spanish classifieds |
| wallapop.com | Classifieds | ES | Mobile classifieds app with web |

---

### 3.4 Blocklist Suggestion Implementation

```javascript
/**
 * Get locale-specific blocklist suggestions for onboarding.
 *
 * @param {string} locale - BCP 47 locale tag.
 * @returns {Array<{url: string, category: string, prechecked: boolean}>}
 */
function getBlocklistSuggestions(locale) {
  const lang = locale.split('-')[0];
  const region = locale.split('-')[1] || '';

  // Always start with global defaults
  const suggestions = [...GLOBAL_DEFAULTS];

  // Add regional suggestions
  const regionalKey = getRegionalKey(lang, region);
  const regional = REGIONAL_SUGGESTIONS[regionalKey] || [];
  suggestions.push(...regional);

  // Sort: pre-checked first, then by category diversity
  suggestions.sort((a, b) => {
    if (a.prechecked && !b.prechecked) return -1;
    if (!a.prechecked && b.prechecked) return 1;
    return 0;
  });

  // Limit to 12 suggestions for onboarding UI
  return suggestions.slice(0, 12);
}

/**
 * Determine the regional key based on locale.
 */
function getRegionalKey(lang, region) {
  const mapping = {
    'ja': 'japan',
    'ko': 'korea',
    'zh': region === 'TW' ? 'taiwan' : 'china',
    'ru': 'russia',
    'hi': 'india', 'bn': 'india', 'ta': 'india',
    'te': 'india', 'mr': 'india', 'gu': 'india',
    'de': 'germany',
    'fr': region === 'CA' ? 'france' : 'france', // FR-CA uses France list
    'pt': region === 'BR' ? 'brazil' : 'portugal',
    'es': ['MX', 'AR', 'CO', 'CL', 'PE'].includes(region) ? 'latam' : 'spain',
    'ar': 'arabic',
    'tr': 'turkey',
    'pl': 'poland',
    'nl': 'netherlands',
    'it': 'italy',
    'vi': 'vietnam',
    'th': 'thailand',
    'id': 'indonesia',
  };

  return mapping[lang] || 'global';
}

const GLOBAL_DEFAULTS = [
  { url: 'youtube.com', category: 'video', prechecked: true },
  { url: 'twitter.com', category: 'social', prechecked: true },
  { url: 'reddit.com', category: 'forum', prechecked: true },
  { url: 'instagram.com', category: 'social', prechecked: true },
  { url: 'facebook.com', category: 'social', prechecked: true },
  { url: 'tiktok.com', category: 'video', prechecked: false },
  { url: 'twitch.tv', category: 'streaming', prechecked: false },
  { url: 'netflix.com', category: 'streaming', prechecked: false },
];

const REGIONAL_SUGGESTIONS = {
  japan: [
    { url: 'yahoo.co.jp', category: 'portal', prechecked: true },
    { url: 'nicovideo.jp', category: 'video', prechecked: true },
    { url: 'line.me', category: 'messaging', prechecked: false },
    { url: 'ameblo.jp', category: 'blog', prechecked: false },
    { url: '5ch.net', category: 'forum', prechecked: false },
    { url: 'pixiv.net', category: 'art', prechecked: false },
  ],
  korea: [
    { url: 'naver.com', category: 'portal', prechecked: true },
    { url: 'daum.net', category: 'portal', prechecked: true },
    { url: 'kakao.com', category: 'messaging', prechecked: false },
    { url: 'namu.wiki', category: 'wiki', prechecked: false },
    { url: 'fmkorea.com', category: 'forum', prechecked: false },
    { url: 'dcinside.com', category: 'forum', prechecked: false },
  ],
  russia: [
    { url: 'vk.com', category: 'social', prechecked: true },
    { url: 'ok.ru', category: 'social', prechecked: true },
    { url: 'dzen.ru', category: 'news', prechecked: true },
    { url: 'pikabu.ru', category: 'forum', prechecked: false },
    { url: 'habr.com', category: 'tech', prechecked: false },
    { url: 'kinopoisk.ru', category: 'entertainment', prechecked: false },
  ],
  brazil: [
    { url: 'globo.com', category: 'news', prechecked: true },
    { url: 'uol.com.br', category: 'portal', prechecked: true },
    { url: 'mercadolivre.com.br', category: 'shopping', prechecked: false },
    { url: 'ge.globo.com', category: 'sports', prechecked: false },
    { url: 'terra.com.br', category: 'portal', prechecked: false },
    { url: 'r7.com', category: 'news', prechecked: false },
  ],
  india: [
    { url: 'flipkart.com', category: 'shopping', prechecked: true },
    { url: 'hotstar.com', category: 'streaming', prechecked: true },
    { url: 'cricbuzz.com', category: 'sports', prechecked: false },
    { url: 'timesofindia.com', category: 'news', prechecked: false },
    { url: 'ndtv.com', category: 'news', prechecked: false },
    { url: 'amazon.in', category: 'shopping', prechecked: false },
  ],
  germany: [
    { url: 'web.de', category: 'portal', prechecked: true },
    { url: 'gmx.de', category: 'portal', prechecked: true },
    { url: 'bild.de', category: 'news', prechecked: false },
    { url: 'spiegel.de', category: 'news', prechecked: false },
    { url: 'heise.de', category: 'tech', prechecked: false },
    { url: 'ebay-kleinanzeigen.de', category: 'classifieds', prechecked: false },
  ],
  france: [
    { url: 'leboncoin.fr', category: 'classifieds', prechecked: true },
    { url: 'orange.fr', category: 'portal', prechecked: true },
    { url: 'lemonde.fr', category: 'news', prechecked: false },
    { url: 'bfmtv.com', category: 'news', prechecked: false },
    { url: 'allocine.fr', category: 'entertainment', prechecked: false },
    { url: 'jeuxvideo.com', category: 'gaming', prechecked: false },
  ],
  spain: [
    { url: 'marca.com', category: 'sports', prechecked: true },
    { url: 'elpais.com', category: 'news', prechecked: true },
    { url: 'milanuncios.com', category: 'classifieds', prechecked: false },
    { url: 'wallapop.com', category: 'classifieds', prechecked: false },
    { url: 'as.com', category: 'sports', prechecked: false },
    { url: 'xataka.com', category: 'tech', prechecked: false },
  ],
  latam: [
    { url: 'mercadolibre.com', category: 'shopping', prechecked: true },
    { url: 'infobae.com', category: 'news', prechecked: true },
    { url: 'elpais.com', category: 'news', prechecked: false },
    { url: 'clarin.com', category: 'news', prechecked: false },
    { url: 'xataka.com', category: 'tech', prechecked: false },
    { url: 'as.com', category: 'sports', prechecked: false },
  ],
  china: [
    { url: 'weibo.com', category: 'social', prechecked: true },
    { url: 'bilibili.com', category: 'video', prechecked: true },
    { url: 'zhihu.com', category: 'forum', prechecked: true },
    { url: 'douyin.com', category: 'video', prechecked: false },
    { url: 'xiaohongshu.com', category: 'social', prechecked: false },
    { url: 'douban.com', category: 'community', prechecked: false },
  ],
  arabic: [
    { url: 'alarabiya.net', category: 'news', prechecked: true },
    { url: 'aljazeera.net', category: 'news', prechecked: false },
    { url: 'kooora.com', category: 'sports', prechecked: false },
    { url: 'mbc.net', category: 'entertainment', prechecked: false },
    { url: 'souq.com', category: 'shopping', prechecked: false },
    { url: 'shahid.mbc.net', category: 'streaming', prechecked: false },
  ],
  turkey: [
    { url: 'hurriyet.com.tr', category: 'news', prechecked: true },
    { url: 'milliyet.com.tr', category: 'news', prechecked: false },
    { url: 'eksisozluk.com', category: 'forum', prechecked: true },
    { url: 'trendyol.com', category: 'shopping', prechecked: false },
    { url: 'hepsiburada.com', category: 'shopping', prechecked: false },
    { url: 'donanimhaber.com', category: 'tech', prechecked: false },
  ],
  poland: [
    { url: 'wp.pl', category: 'portal', prechecked: true },
    { url: 'onet.pl', category: 'portal', prechecked: true },
    { url: 'wykop.pl', category: 'forum', prechecked: false },
    { url: 'allegro.pl', category: 'shopping', prechecked: false },
    { url: 'gazeta.pl', category: 'news', prechecked: false },
    { url: 'interia.pl', category: 'portal', prechecked: false },
  ],
  netherlands: [
    { url: 'nu.nl', category: 'news', prechecked: true },
    { url: 'tweakers.net', category: 'tech', prechecked: false },
    { url: 'marktplaats.nl', category: 'classifieds', prechecked: true },
    { url: 'nos.nl', category: 'news', prechecked: false },
    { url: 'bol.com', category: 'shopping', prechecked: false },
    { url: 'dumpert.nl', category: 'entertainment', prechecked: false },
  ],
  italy: [
    { url: 'repubblica.it', category: 'news', prechecked: true },
    { url: 'corriere.it', category: 'news', prechecked: false },
    { url: 'gazzetta.it', category: 'sports', prechecked: true },
    { url: 'subito.it', category: 'classifieds', prechecked: false },
    { url: 'ilfattoquotidiano.it', category: 'news', prechecked: false },
    { url: 'fanpage.it', category: 'news', prechecked: false },
  ],
};
```

---

### 3.5 Analytics-Driven Refinement

After launch, the following anonymized metrics will refine the default blocklist per locale:

| Metric | Collection Method | Frequency | Action |
|--------|------------------|-----------|--------|
| Top 20 blocked sites per locale | Aggregated domain counts from `chrome.storage.local` | Weekly | Update `REGIONAL_SUGGESTIONS` quarterly |
| Onboarding toggle-on rate per site | Event tracking on onboarding slide 2 | Weekly | Pre-check sites with >40% toggle-on rate |
| Sites added manually in first 7 days | Aggregated from session data | Monthly | Add popular manual additions to suggestions |
| Sites removed within 24 hours | Aggregated removal events | Monthly | Remove sites with >20% quick-removal rate |

**Privacy guarantee:** Only domain names are collected in aggregate (never full URLs). Data is stored as aggregate counts per locale, never per-user. Users can opt out of analytics entirely.

---

## 4. Locale-Specific Motivational Quotes

The block page (displayed when a user tries to visit a blocked site) shows a rotating motivational quote alongside the "You're in Focus Mode" message. These quotes must be culturally appropriate, resonant, and avoid being cheesy translations of English idioms that do not carry the same weight in other cultures.

---

### 4.1 Design Principles for Motivational Quotes

1. **Cultural authenticity:** Each locale gets quotes from its own philosophical and literary tradition, not translations of English motivational quotes.
2. **Brevity:** Quotes must fit on a single line at 14px font size on a 1280px-wide block page. Maximum 120 characters (80 characters for CJK where characters are wider).
3. **Tone:** Professional and empowering, not preachy. Avoid religious content (even in cultures with strong religious traditions -- keep it secular or proverbial).
4. **Attribution:** Include the author/source when it is a known figure. For traditional proverbs, attribute to the cultural tradition.
5. **Rotation:** Quotes rotate every page load (random selection from the pool). No quote appears twice in a row.
6. **10+ quotes per locale** to prevent repetition fatigue.
7. **User customization (Pro):** Pro users can add their own quotes or disable the default ones.

---

### 4.2 English Quotes (en)

Western productivity philosophy, with emphasis on deep work, intentionality, and the compound effect of focus.

| # | Quote | Attribution |
|---|-------|-------------|
| 1 | "The successful warrior is the average man, with laser-like focus." | Bruce Lee |
| 2 | "Concentrate all your thoughts upon the work at hand. The sun's rays do not burn until brought to a focus." | Alexander Graham Bell |
| 3 | "It is during our darkest moments that we must focus to see the light." | Aristotle |
| 4 | "The main thing is to keep the main thing the main thing." | Stephen Covey |
| 5 | "You will never reach your destination if you stop and throw stones at every dog that barks." | Winston Churchill |
| 6 | "Lack of direction, not lack of time, is the problem. We all have 24-hour days." | Zig Ziglar |
| 7 | "What you stay focused on will grow." | Roy T. Bennett |
| 8 | "A clear vision, backed by definite plans, gives you a tremendous feeling of confidence and personal power." | Brian Tracy |
| 9 | "Focus on being productive instead of busy." | Tim Ferriss |
| 10 | "The secret of change is to focus all your energy not on fighting the old, but on building the new." | Socrates (via Dan Millman) |
| 11 | "Deep work is the ability to focus without distraction on a cognitively demanding task." | Cal Newport |
| 12 | "Your future is created by what you do today, not tomorrow." | Robert Kiyosaki |
| 13 | "Starve your distractions, feed your focus." | Anonymous |
| 14 | "Small daily improvements over time lead to stunning results." | Robin Sharma |
| 15 | "Where focus goes, energy flows." | Tony Robbins |

---

### 4.3 Japanese Quotes (ja)

Japanese motivational quotes draw from kaizen (continuous improvement), bushido (warrior discipline), and traditional proverbs that emphasize perseverance, diligence, and the beauty of sustained effort.

| # | Quote | Attribution | Translation Note |
|---|-------|-------------|-----------------|
| 1 | "一期一会 -- この瞬間に全力を注ごう" | 茶道の教え | "One chance, one encounter -- pour everything into this moment" |
| 2 | "千里の道も一歩から" | 老子 | "A journey of a thousand miles begins with a single step" |
| 3 | "七転び八起き -- 諦めない心が道を開く" | 日本の諺 | "Fall seven times, stand up eight" |
| 4 | "今日の一針、明日の十針" | 日本の諺 | "A stitch in time saves nine" (Japanese equivalent) |
| 5 | "石の上にも三年" | 日本の諺 | "Sit on a stone for three years" (persistence pays off) |
| 6 | "改善は小さな一歩から始まる" | トヨタ生産方式 | "Kaizen begins with a small step" |
| 7 | "継続は力なり" | 日本の諺 | "Continuity is power" |
| 8 | "急がば回れ" | 日本の諺 | "If in a hurry, take the roundabout path" (do things properly) |
| 9 | "為せば成る、為さねば成らぬ" | 上杉鷹山 | "If you try, you can; if you don't try, you can't" |
| 10 | "初心忘るべからず" | 世阿弥 | "Never forget the beginner's spirit" |
| 11 | "今を生きる。集中こそ最高の贈り物" | 現代の教え | "Live now. Focus is the greatest gift" |
| 12 | "雨垂れ石を穿つ" | 日本の諺 | "Dripping water hollows stone" (consistent effort wins) |
| 13 | "塵も積もれば山となる" | 日本の諺 | "Even dust, piled up, becomes a mountain" |
| 14 | "一心不乱に取り組もう" | 禅の教え | "Devote yourself with single-minded concentration" |
| 15 | "今日できることを明日に延ばすな" | ベンジャミン・フランクリン | "Don't put off until tomorrow what you can do today" |

---

### 4.4 German Quotes (de)

German motivational quotes emphasize precision, efficiency, Ordnung (order), and the satisfaction of disciplined work. Germans tend to prefer practical, no-nonsense motivation over inspirational platitudes.

| # | Quote | Attribution | Translation Note |
|---|-------|-------------|-----------------|
| 1 | "Ordnung ist das halbe Leben." | Deutsches Sprichwort | "Order is half of life" |
| 2 | "Was du heute kannst besorgen, das verschiebe nicht auf morgen." | Deutsches Sprichwort | "Don't put off until tomorrow what you can do today" |
| 3 | "Der Weg ist das Ziel." | Konfuzius | "The journey is the destination" |
| 4 | "Ohne Fleiss, kein Preis." | Deutsches Sprichwort | "No pain, no gain" (lit: "without diligence, no prize") |
| 5 | "Wer rastet, der rostet." | Deutsches Sprichwort | "He who rests, rusts" |
| 6 | "Genialitat ist 1% Inspiration und 99% Transpiration." | Thomas Edison | "Genius is 1% inspiration and 99% perspiration" |
| 7 | "Es ist nicht genug zu wissen, man muss auch anwenden." | Johann Wolfgang von Goethe | "It is not enough to know, one must also apply" |
| 8 | "In der Beschrankung zeigt sich erst der Meister." | Goethe | "Mastery shows itself in limitation" |
| 9 | "Arbeit macht das Leben suss." | Deutsches Sprichwort | "Work makes life sweet" |
| 10 | "Jede Minute, die man lacht, verlangert das Leben um eine Stunde." | Chinesisches Sprichwort (popular in DE) | Common in German culture |
| 11 | "Konzentration ist der Schlussel zu jedem Erfolg." | Moderne Weisheit | "Concentration is the key to every success" |
| 12 | "Steter Tropfen hohlt den Stein." | Deutsches Sprichwort | "Constant dripping wears the stone" |
| 13 | "Qualitat kommt von Qual." | Nicht zugeordnet | "Quality comes from struggle" (German wordplay) |
| 14 | "Wer den Hafen nicht kennt, fur den ist kein Wind gunstig." | Seneca | "If you don't know the harbor, no wind is favorable" |
| 15 | "Mut steht am Anfang des Handelns, Gluck am Ende." | Demokrit | "Courage stands at the beginning of action, happiness at the end" |

---

### 4.5 Spanish Quotes (es)

Spanish motivational quotes emphasize determination, warmth, community, and the passionate pursuit of goals. The Spanish-speaking world has a rich literary tradition that values emotional expression and collective resilience.

| # | Quote | Attribution | Notes |
|---|-------|-------------|-------|
| 1 | "No dejes para manana lo que puedas hacer hoy." | Refran espanol | Classic Spanish proverb |
| 2 | "El que la sigue, la consigue." | Refran espanol | "He who persists, achieves" |
| 3 | "La disciplina es el puente entre las metas y los logros." | Jim Rohn | Popular in Spanish-speaking world |
| 4 | "Caminante, no hay camino, se hace camino al andar." | Antonio Machado | Iconic Spanish poem; deeply resonant |
| 5 | "Solo los que se atreven a tener grandes fracasos terminan consiguiendo grandes exitos." | Robert F. Kennedy | Popular translated quote |
| 6 | "Hoy es un buen dia para empezar." | Anonimo | "Today is a good day to start" |
| 7 | "La constancia es la virtud por la que todas las demas dan su fruto." | Arturo Graf | Persistence as master virtue |
| 8 | "Poco a poco se llega lejos." | Refran espanol | "Little by little, you go far" |
| 9 | "No hay atajos para cualquier lugar que valga la pena." | Beverly Sills | "No shortcuts to anywhere worth going" |
| 10 | "Tu enfoque determina tu realidad." | Qui-Gon Jinn / George Lucas | Popular culture reference |
| 11 | "El exito es la suma de pequenos esfuerzos repetidos dia tras dia." | Robert Collier | Compound effect |
| 12 | "Donde hay una voluntad, hay un camino." | Refran | "Where there's a will, there's a way" |
| 13 | "La concentracion es la raiz de todas las capacidades del ser humano." | Bruce Lee | Focus as root of capability |
| 14 | "Cada momento es un nuevo comienzo." | T.S. Eliot | "Every moment is a fresh beginning" |
| 15 | "Trabaja en silencio, deja que tu exito haga el ruido." | Frank Ocean | Popular modern quote in LATAM |

---

### 4.6 Arabic Quotes (ar)

Arabic motivational quotes draw from the rich tradition of Arabic proverbs, scholarly wisdom, and poetry. The Arabic intellectual tradition deeply values knowledge, perseverance, and self-discipline. These quotes are kept secular but echo the scholarly tradition respected across all Arabic-speaking countries.

| # | Quote | Attribution | Translation Note |
|---|-------|-------------|-----------------|
| 1 | "من جد وجد، ومن زرع حصد" | مثل عربي | "He who strives, finds; he who plants, harvests" |
| 2 | "العلم نور والجهل ظلام" | مثل عربي | "Knowledge is light and ignorance is darkness" |
| 3 | "الصبر مفتاح الفرج" | مثل عربي | "Patience is the key to relief" |
| 4 | "اطلبوا العلم من المهد إلى اللحد" | حكمة عربية | "Seek knowledge from the cradle to the grave" |
| 5 | "رحلة الألف ميل تبدأ بخطوة واحدة" | لاو تزو | "A journey of a thousand miles begins with a single step" |
| 6 | "التركيز هو سر النجاح" | حكمة حديثة | "Focus is the secret of success" |
| 7 | "لا تؤجل عمل اليوم إلى الغد" | مثل عربي | "Do not postpone today's work until tomorrow" |
| 8 | "النجاح ليس نهائيًا والفشل ليس قاتلًا" | ونستون تشرشل | "Success is not final, failure is not fatal" |
| 9 | "إذا هبّت رياحك فاغتنمها" | شعر عربي | "When your winds blow, seize them" (seize opportunity) |
| 10 | "قطرة فوق قطرة تصنع نهرًا" | مثل عربي | "Drop upon drop makes a river" |
| 11 | "كل يوم هو فرصة جديدة للتغيير" | حكمة حديثة | "Every day is a new opportunity for change" |
| 12 | "من لم يتعلم من الماضي لن يصنع المستقبل" | حكمة عربية | "He who does not learn from the past will not build the future" |
| 13 | "الإرادة القوية تصنع المستحيل" | حكمة عربية | "Strong will makes the impossible possible" |
| 14 | "اليوم هو أول يوم من بقية حياتك" | حكمة حديثة | "Today is the first day of the rest of your life" |
| 15 | "النظام أساس النجاح" | حكمة عربية | "Order is the foundation of success" |

---

### 4.7 Portuguese-BR Quotes (pt-BR)

Brazilian Portuguese quotes reflect the Brazilian spirit of optimism, resilience, and jeitinho (creative problem-solving). Brazilians respond well to motivational content that is warm, positive, and action-oriented.

| # | Quote | Attribution | Notes |
|---|-------|-------------|-------|
| 1 | "Foco, forca e fe." | Expressao popular brasileira | Brazil's unofficial motto; universally recognized |
| 2 | "Nao deixe para amanha o que voce pode fazer hoje." | Proverbio | Classic; deeply ingrained |
| 3 | "O sucesso nasce do querer. Sempre que o homem aplicar a determinacao, encontrara o caminho." | Jose de Alencar | Brazilian literary figure |
| 4 | "Disciplina e liberdade." | Renato Russo | Iconic Brazilian musician; resonates deeply |
| 5 | "A persistencia e o caminho do exito." | Charles Chaplin | Popular in Brazil |
| 6 | "Quem nao arrisca, nao petisca." | Proverbio brasileiro | "Who doesn't risk, doesn't snack" (nothing ventured, nothing gained) |
| 7 | "Cada dia e uma nova chance de mudar sua vida." | Anonimo | "Every day is a new chance to change your life" |
| 8 | "O impossivel e apenas o possivel que alguem ainda nao realizou." | Anonimo | "The impossible is just the possible no one has achieved yet" |
| 9 | "A concentracao e a chave para a excelencia." | Sabedoria moderna | "Focus is the key to excellence" |
| 10 | "O segredo do sucesso e a constancia do proposito." | Benjamin Disraeli | Popular translated quote in BR |
| 11 | "Nao espere por oportunidades, crie-as." | George Bernard Shaw | Action-oriented |
| 12 | "Vai dar certo. Continue focado." | Expressao popular | "It will work out. Stay focused." (very Brazilian) |
| 13 | "Acredite em voce e todo o resto vira." | Anonimo | "Believe in yourself and everything else will follow" |
| 14 | "Pequenos passos todos os dias levam a grandes conquistas." | Anonimo | Small steps, big results |
| 15 | "O tempo e o seu bem mais precioso. Use-o com sabedoria." | Anonimo | "Time is your most precious asset. Use it wisely" |

---

### 4.8 Korean Quotes (ko)

Korean motivational culture is characterized by "fighting spirit" (a culture of perseverance), collective determination, and the concept of jeong (deep emotional bonds). Koreans respond well to quotes about hard work, resilience, and personal growth.

| # | Quote | Attribution | Translation Note |
|---|-------|-------------|-----------------|
| 1 | "화이팅! 오늘도 집중하는 당신이 멋집니다." | 현대 격언 | "Fighting! You who focus today are wonderful" |
| 2 | "시작이 반이다." | 한국 속담 | "Starting is half the battle" |
| 3 | "천리길도 한 걸음부터." | 한국 속담 | "A journey of a thousand li begins with a single step" |
| 4 | "고생 끝에 낙이 온다." | 한국 속담 | "After hardship comes happiness" |
| 5 | "하면 된다." | 한국 격언 | "If you do it, it will be done" (just do it) |
| 6 | "오늘 하루도 최선을 다하자." | 현대 격언 | "Let's do our best today as well" |
| 7 | "포기하지 마. 시작은 언제나 가장 어렵다." | 현대 격언 | "Don't give up. The beginning is always the hardest" |
| 8 | "작은 노력이 모여 큰 변화를 만든다." | 현대 격언 | "Small efforts gathered make big changes" |
| 9 | "집중하는 시간이 당신의 미래를 만든다." | 현대 격언 | "Focused time creates your future" |
| 10 | "꾸준함이 천재를 이긴다." | 현대 격언 | "Consistency beats genius" |
| 11 | "남과 비교하지 말고, 어제의 나와 비교하라." | 현대 격언 | "Don't compare with others; compare with yesterday's self" |
| 12 | "될 때까지 해봐." | 현대 격언 | "Try until it works" |
| 13 | "흐르는 물은 썩지 않는다." | 한국 속담 | "Running water does not decay" (keep moving) |
| 14 | "인내는 쓰지만 열매는 달다." | 한국 속담 | "Patience is bitter but its fruit is sweet" |
| 15 | "오늘의 노력이 내일의 나를 만든다." | 현대 격언 | "Today's effort makes tomorrow's me" |

---

### 4.9 French Quotes (fr)

French motivational quotes value intellectual elegance, philosophical depth, and the balance between effort and the art of living. French users respond to quotes that are thoughtful rather than aggressive.

| # | Quote | Attribution | Notes |
|---|-------|-------------|-------|
| 1 | "La concentration est la cle de la reussite." | Sagesse moderne | "Focus is the key to success" |
| 2 | "Ce n'est pas parce que les choses sont difficiles que nous n'osons pas, c'est parce que nous n'osons pas qu'elles sont difficiles." | Seneque | Seneca quote, beloved in French culture |
| 3 | "Le succes, c'est d'aller d'echec en echec sans perdre son enthousiasme." | Winston Churchill | Popular in France |
| 4 | "Chaque jour est une nouvelle chance de changer votre vie." | Anonyme | "Every day is a new chance" |
| 5 | "La discipline est le pont entre les objectifs et les accomplissements." | Jim Rohn | Discipline bridge |
| 6 | "Petit a petit, l'oiseau fait son nid." | Proverbe francais | "Little by little, the bird builds its nest" |
| 7 | "Il n'y a pas de raccourci vers un endroit qui en vaut la peine." | Beverly Sills | No shortcuts |
| 8 | "Vouloir, c'est pouvoir." | Proverbe francais | "To want is to be able" (where there's a will...) |
| 9 | "L'avenir appartient a ceux qui se levent tot." | Proverbe francais | "The future belongs to those who rise early" |
| 10 | "La perseverance n'est pas une longue course ; c'est plusieurs courtes courses l'une apres l'autre." | Walter Elliot | Perseverance |
| 11 | "L'important, c'est de commencer." | Sagesse moderne | "The important thing is to start" |
| 12 | "On ne peut pas batir une reputation sur ce qu'on a l'intention de faire." | Henry Ford | Reputation through action |
| 13 | "La simplicite est la sophistication supreme." | Leonard de Vinci | Simplicity is the ultimate sophistication |
| 14 | "N'attendez pas le moment parfait. Prenez un moment et rendez-le parfait." | Anonyme | Don't wait for the perfect moment |
| 15 | "Ce qui est important est rarement urgent, et ce qui est urgent est rarement important." | Dwight Eisenhower | Eisenhower matrix principle |

---

### 4.10 Quote Rotation Implementation

```javascript
/**
 * Get a random motivational quote for the block page.
 *
 * @param {string} locale - BCP 47 locale tag.
 * @param {string|null} lastQuoteId - ID of the last displayed quote (to avoid repeats).
 * @returns {{ text: string, attribution: string, id: string }}
 */
async function getBlockPageQuote(locale) {
  const lang = locale.split('-')[0];

  // Load quotes for the locale
  const quotes = await loadQuotes(lang);
  if (!quotes || quotes.length === 0) {
    // Fallback to English
    return loadQuotes('en').then(enQuotes => pickRandom(enQuotes));
  }

  // Get the last shown quote ID from storage to avoid repeats
  const { lastQuoteId } = await chrome.storage.session.get('lastQuoteId');

  // Filter out the last shown quote
  const available = quotes.filter(q => q.id !== lastQuoteId);
  const selected = available.length > 0
    ? pickRandom(available)
    : pickRandom(quotes); // If only one quote, allow repeat

  // Store the selected quote ID
  await chrome.storage.session.set({ lastQuoteId: selected.id });

  return selected;
}

/**
 * Load quotes from the _locales directory or bundled data.
 *
 * @param {string} lang - Language code ('en', 'ja', 'de', etc.).
 * @returns {Promise<Array<{id: string, text: string, attribution: string}>>}
 */
async function loadQuotes(lang) {
  // Quotes are stored in _locales/{lang}/quotes.json
  const url = chrome.runtime.getURL(`_locales/${lang}/quotes.json`);
  try {
    const response = await fetch(url);
    return await response.json();
  } catch {
    // Fallback: quotes may be embedded in messages.json as quote_1_text, quote_1_attr, etc.
    return loadQuotesFromMessages(lang);
  }
}

/**
 * Fallback: load quotes from chrome.i18n messages.
 */
function loadQuotesFromMessages(lang) {
  const quotes = [];
  for (let i = 1; i <= 20; i++) {
    const text = chrome.i18n.getMessage(`quote_${i}_text`);
    if (!text) break;
    const attribution = chrome.i18n.getMessage(`quote_${i}_attr`) || '';
    quotes.push({ id: `${lang}_${i}`, text, attribution });
  }
  return quotes;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
```

**Quote file structure:**

```
_locales/
  en/
    messages.json
    quotes.json       # 15 English quotes
  ja/
    messages.json
    quotes.json       # 15 Japanese quotes
  de/
    messages.json
    quotes.json       # 15 German quotes
  es/
    messages.json
    quotes.json       # 15 Spanish quotes
  fr/
    messages.json
    quotes.json       # 15 French quotes
  pt_BR/
    messages.json
    quotes.json       # 15 Brazilian Portuguese quotes
  ar/
    messages.json
    quotes.json       # 15 Arabic quotes
  ko/
    messages.json
    quotes.json       # 15 Korean quotes
  ru/
    messages.json
    quotes.json       # 15 Russian quotes
  zh_CN/
    messages.json
    quotes.json       # 15 Chinese quotes
```

**Example quotes.json (ja):**

```json
[
  {
    "id": "ja_1",
    "text": "一期一会 — この瞬間に全力を注ごう",
    "attribution": "茶道の教え"
  },
  {
    "id": "ja_2",
    "text": "千里の道も一歩から",
    "attribution": "老子"
  },
  {
    "id": "ja_3",
    "text": "七転び八起き — 諦めない心が道を開く",
    "attribution": "日本の諺"
  }
]
```

---

### 4.11 Pro User Custom Quotes

Pro users can add, edit, and delete custom quotes through the extension settings. Custom quotes are stored in `chrome.storage.sync` and appear in the rotation alongside the default locale quotes.

```javascript
/**
 * Manage custom quotes for Pro users.
 */
const CustomQuotes = {
  /**
   * Add a custom quote.
   * @param {string} text - The quote text.
   * @param {string} [attribution] - Optional attribution.
   */
  async add(text, attribution = '') {
    const { customQuotes = [] } = await chrome.storage.sync.get('customQuotes');
    const id = `custom_${Date.now()}`;
    customQuotes.push({ id, text, attribution, enabled: true });
    await chrome.storage.sync.set({ customQuotes });
    return id;
  },

  /**
   * Remove a custom quote.
   * @param {string} id - The quote ID.
   */
  async remove(id) {
    const { customQuotes = [] } = await chrome.storage.sync.get('customQuotes');
    const filtered = customQuotes.filter(q => q.id !== id);
    await chrome.storage.sync.set({ customQuotes: filtered });
  },

  /**
   * Toggle default quotes on/off (Pro feature).
   * When disabled, only custom quotes appear.
   * @param {boolean} enabled
   */
  async setDefaultsEnabled(enabled) {
    await chrome.storage.sync.set({ defaultQuotesEnabled: enabled });
  },

  /**
   * Get all active quotes (defaults + custom) for the block page.
   * @param {string} locale
   * @returns {Promise<Array>}
   */
  async getActiveQuotes(locale) {
    const { customQuotes = [], defaultQuotesEnabled = true } =
      await chrome.storage.sync.get(['customQuotes', 'defaultQuotesEnabled']);

    let quotes = [];

    if (defaultQuotesEnabled) {
      const lang = locale.split('-')[0];
      const defaults = await loadQuotes(lang);
      quotes.push(...defaults);
    }

    const enabledCustom = customQuotes.filter(q => q.enabled);
    quotes.push(...enabledCustom);

    return quotes;
  },
};
```

---

## 5. Chrome Web Store Listing Localization

The Chrome Web Store listing is the primary conversion surface for Focus Mode - Blocker. A fully localized listing -- including description, screenshots, and keyword-optimized metadata -- dramatically increases discoverability and conversion in non-English markets. Most competitors (BlockSite, Cold Turkey, Freedom, LeechBlock, StayFocusd) have English-only listings, creating a massive opportunity.

---

### 5.1 Localized CWS Descriptions

Each P1 locale receives a complete, culturally adapted Chrome Web Store description. These are not machine translations of the English listing -- they are rewritten for each market with locale-specific keywords, cultural references, regional pricing, and appropriate formatting conventions.

**CWS Description Structure (all locales):**

1. **Hook** (first 2-3 lines, visible before "Read more") -- Most critical for conversion
2. **Key Features** -- Bullet list of core free features
3. **Pro Features** -- What upgrading unlocks
4. **Privacy & Trust** -- No data collection, open-source block page
5. **Support & Community** -- How to get help

---

#### 5.1.1 English (en) -- Full CWS Description

**Short Description (132 chars max):**

```
Block distracting websites, boost focus with Pomodoro timer, track your Focus Score & streaks. Free forever. Pro unlocks more power.
```

**Full Description:**

```
Losing hours to YouTube, Reddit, and social media when you should be working? You're not alone — the average knowledge worker loses 2.1 hours per day to digital distractions.

Focus Mode - Blocker puts you back in control. Block distracting websites with one click, stay focused with a built-in Pomodoro timer, and watch your productivity grow with Focus Score tracking and daily streaks.

Whether you're a developer shipping code, a student preparing for exams, a freelancer billing hours, or anyone who struggles with online distractions — Focus Mode gives you the structure you need to do your best work.

━━━━━━━━━━━━━━━━━━━━
KEY FEATURES (FREE)
━━━━━━━━━━━━━━━━━━━━

BLOCK DISTRACTING WEBSITES
Add up to 10 websites to your blocklist. When you try to visit a blocked site during a focus session, you'll see a beautiful, motivational block page instead of your distraction. Supports wildcard blocking (block all of reddit.com, not just specific pages).

POMODORO TIMER
Built-in 25/5 Pomodoro timer with automatic break reminders. Start a focus session with one click from the popup. Customize session and break lengths to match your workflow.

FOCUS SCORE
Your personal productivity metric (0-100) that tracks how well you resist distractions during focus sessions. Watch your score climb as you build better habits.

DAILY STREAKS
Stay motivated with consecutive-day tracking. Build streaks by completing at least one focus session per day. Share your streak achievements with friends.

SESSION HISTORY
See exactly when you focused, for how long, and how many distractions were blocked. Review your productivity patterns over the past 7 days.

MOTIVATIONAL BLOCK PAGE
When you try to visit a blocked site, see a beautiful page with rotating motivational quotes, your current streak count, and a timer showing how long until your session ends.

━━━━━━━━━━━━━━━━━━━━
PRO FEATURES ($4.99/mo)
━━━━━━━━━━━━━━━━━━━━

UNLIMITED BLOCKLIST
Remove the 10-site limit. Block as many websites as you need — social media, news sites, shopping, gaming — everything that pulls you away from your work.

NUCLEAR MODE
When willpower isn't enough: lock your blocklist for a set period. Once Nuclear Mode is activated, sites CANNOT be unblocked until the timer expires. Not by you, not by anyone. True commitment.

AMBIENT SOUNDS
Three built-in ambient soundscapes (rain, coffee shop, white noise) to help you enter and maintain flow state during focus sessions.

ADVANCED STATISTICS
Full weekly and monthly reports with detailed breakdowns: focus hours by day, most-blocked sites, Focus Score trends, session completion rate, and more. Export your data as CSV.

SCHEDULE BLOCKING
Set automatic blocking schedules: block distracting sites during work hours (Mon-Fri, 9 AM - 5 PM) and let them through on evenings and weekends.

SYNC ACROSS DEVICES
Your blocklist, settings, and stats sync across all your Chrome browsers via your account.

━━━━━━━━━━━━━━━━━━━━
PRICING
━━━━━━━━━━━━━━━━━━━━

Free: Full-featured with 10-site blocklist limit
Pro Monthly: $4.99/month
Pro Annual: $2.99/month (billed annually — save 40%)
Lifetime: $49.99 one-time payment

Student discount available (50% off with valid student verification).

━━━━━━━━━━━━━━━━━━━━
PRIVACY FIRST
━━━━━━━━━━━━━━━━━━━━

Focus Mode - Blocker does NOT collect your browsing data. Ever. Your blocklist and settings are stored locally on your device (or synced via your Chrome profile if you choose). We don't track which sites you visit. We don't sell data. We don't have analytics on your browsing behavior.

Permissions explained:
• "Read and change all your data on all websites" — Required to detect when you visit a blocked site and show the block page. We ONLY check against your personal blocklist.
• "Storage" — To save your settings and session data locally.
• "Alarms" — For the Pomodoro timer and schedule blocking.

━━━━━━━━━━━━━━━━━━━━
SUPPORT
━━━━━━━━━━━━━━━━━━━━

Questions? Feature requests? Bug reports?
• Email: support@zovo.one
• Twitter/X: @focusmodeext
• GitHub: github.com/zovo/focus-mode-blocker (report issues)
• FAQ: zovo.one/focus-mode/faq

We read every message and typically respond within 24 hours.

━━━━━━━━━━━━━━━━━━━━

Built by Zovo — tools that help you do your best work.

Tags: website blocker, site blocker, distraction blocker, pomodoro timer, focus mode, productivity extension, block social media, block youtube, focus timer, website blocker free, pomodoro chrome extension, study timer, ADHD focus tool, nuclear mode blocker, ambient sounds focus
```

---

#### 5.1.2 Spanish (es) -- Full CWS Description

**Short Description (132 chars max):**

```
Bloquea sitios web que distraen, temporizador Pomodoro integrado, Focus Score y rachas diarias. Gratis para siempre. Pro desbloquea mas.
```

**Full Description:**

```
Pierdes horas en YouTube, Twitter y redes sociales cuando deberias estar trabajando? No estas solo: el trabajador promedio pierde 2,1 horas al dia por distracciones digitales.

Focus Mode - Blocker te devuelve el control. Bloquea sitios web que distraen con un solo clic, mantente concentrado con el temporizador Pomodoro integrado y observa como crece tu productividad con el seguimiento de Focus Score y rachas diarias.

Ya seas un desarrollador escribiendo codigo, un estudiante preparando examenes, un freelancer facturando horas o cualquier persona que lucha contra las distracciones en linea: Focus Mode te da la estructura que necesitas para hacer tu mejor trabajo.

━━━━━━━━━━━━━━━━━━━━
FUNCIONES PRINCIPALES (GRATIS)
━━━━━━━━━━━━━━━━━━━━

BLOQUEA SITIOS WEB QUE DISTRAEN
Agrega hasta 10 sitios web a tu lista de bloqueo. Cuando intentes visitar un sitio bloqueado durante una sesion de enfoque, veras una pagina motivacional en lugar de tu distraccion. Compatible con bloqueo por comodines (bloquea todo reddit.com, no solo paginas especificas).

TEMPORIZADOR POMODORO
Temporizador Pomodoro 25/5 integrado con recordatorios automaticos de descanso. Inicia una sesion de enfoque con un solo clic desde el popup. Personaliza la duracion de las sesiones y los descansos segun tu flujo de trabajo.

FOCUS SCORE (PUNTUACION DE ENFOQUE)
Tu metrica personal de productividad (0-100) que rastrea lo bien que resistes las distracciones durante las sesiones de enfoque. Observa como sube tu puntuacion a medida que construyes mejores habitos.

RACHAS DIARIAS
Mantente motivado con el seguimiento de dias consecutivos. Construye rachas completando al menos una sesion de enfoque por dia. Comparte tus logros con amigos.

HISTORIAL DE SESIONES
Ve exactamente cuando te concentraste, por cuanto tiempo y cuantas distracciones fueron bloqueadas. Revisa tus patrones de productividad de los ultimos 7 dias.

PAGINA DE BLOQUEO MOTIVACIONAL
Cuando intentes visitar un sitio bloqueado, veras una pagina con citas motivacionales rotativas, tu cuenta de racha actual y un temporizador mostrando cuanto falta para que termine tu sesion.

━━━━━━━━━━━━━━━━━━━━
FUNCIONES PRO (desde 3,99 EUR/mes)
━━━━━━━━━━━━━━━━━━━━

LISTA DE BLOQUEO ILIMITADA
Elimina el limite de 10 sitios. Bloquea todos los sitios web que necesites: redes sociales, noticias, compras, juegos, todo lo que te aleja de tu trabajo.

MODO NUCLEAR
Cuando la fuerza de voluntad no es suficiente: bloquea tu lista por un periodo determinado. Una vez activado el Modo Nuclear, los sitios NO pueden desbloquearse hasta que expire el temporizador. Ni por ti, ni por nadie. Compromiso verdadero.

SONIDOS AMBIENTALES
Tres paisajes sonoros ambientales integrados (lluvia, cafeteria, ruido blanco) para ayudarte a entrar y mantener el estado de flujo durante las sesiones de enfoque.

ESTADISTICAS AVANZADAS
Informes semanales y mensuales completos con desgloses detallados: horas de enfoque por dia, sitios mas bloqueados, tendencias de Focus Score, tasa de finalizacion de sesiones y mas. Exporta tus datos como CSV.

BLOQUEO PROGRAMADO
Establece horarios de bloqueo automatico: bloquea sitios que distraen durante horas laborales (Lun-Vie, 9:00-17:00) y liberalos por las noches y fines de semana.

SINCRONIZACION ENTRE DISPOSITIVOS
Tu lista de bloqueo, configuracion y estadisticas se sincronizan en todos tus navegadores Chrome a traves de tu cuenta.

━━━━━━━━━━━━━━━━━━━━
PRECIOS
━━━━━━━━━━━━━━━━━━━━

Gratis: Todas las funciones con limite de 10 sitios
Pro Mensual: 3,99 EUR/mes (Espana) | $4,99 USD/mes
Pro Anual: 2,49 EUR/mes (facturado anualmente — ahorra 38%)
De por vida: 39,99 EUR — pago unico

Descuento para estudiantes disponible (40% de descuento con verificacion estudiantil valida).

━━━━━━━━━━━━━━━━━━━━
PRIVACIDAD PRIMERO
━━━━━━━━━━━━━━━━━━━━

Focus Mode - Blocker NO recopila tus datos de navegacion. Nunca. Tu lista de bloqueo y configuracion se almacenan localmente en tu dispositivo (o se sincronizan a traves de tu perfil de Chrome si lo eliges). No rastreamos que sitios visitas. No vendemos datos. No tenemos analisis de tu comportamiento de navegacion.

Permisos explicados:
• "Leer y modificar todos tus datos en todos los sitios web" — Necesario para detectar cuando visitas un sitio bloqueado y mostrar la pagina de bloqueo. SOLO verificamos contra tu lista de bloqueo personal.
• "Almacenamiento" — Para guardar tu configuracion y datos de sesion localmente.
• "Alarmas" — Para el temporizador Pomodoro y el bloqueo programado.

━━━━━━━━━━━━━━━━━━━━
SOPORTE
━━━━━━━━━━━━━━━━━━━━

Preguntas? Solicitudes de funciones? Reportes de errores?
• Email: support@zovo.one
• Twitter/X: @focusmodeext
• GitHub: github.com/zovo/focus-mode-blocker
• FAQ: zovo.one/focus-mode/faq

Leemos cada mensaje y normalmente respondemos en menos de 24 horas.

━━━━━━━━━━━━━━━━━━━━

Creado por Zovo — herramientas que te ayudan a hacer tu mejor trabajo.

Etiquetas: bloqueador de sitios web, bloqueador de distracciones, temporizador pomodoro, modo de enfoque, extension de productividad, bloquear redes sociales, bloquear youtube, temporizador de concentracion, bloqueador web gratis, extension pomodoro chrome, temporizador de estudio, herramienta de enfoque TDAH, modo nuclear bloqueador, sonidos ambientales enfoque
```

---

#### 5.1.3 German (de) -- Full CWS Description

**Short Description (132 chars max):**

```
Ablenkende Webseiten blockieren, Pomodoro-Timer, Focus Score & Serien. Kostenlos fur immer. Pro schaltet mehr Funktionen frei.
```

**Full Description:**

```
Verlierst du Stunden auf YouTube, Reddit und sozialen Medien, obwohl du arbeiten solltest? Du bist nicht allein — der durchschnittliche Wissensarbeiter verliert 2,1 Stunden pro Tag durch digitale Ablenkungen.

Focus Mode - Blocker gibt dir die Kontrolle zuruck. Blockiere ablenkende Webseiten mit einem Klick, bleib fokussiert mit dem integrierten Pomodoro-Timer und beobachte, wie deine Produktivitat durch Focus Score und tagliche Serien wachst.

Ob du Entwickler bist, der Code schreibt, Student, der fur Prufungen lernt, Freelancer, der Stunden abrechnet, oder einfach jemand, der mit Online-Ablenkungen kampft — Focus Mode gibt dir die Struktur, die du brauchst, um deine beste Arbeit zu leisten.

━━━━━━━━━━━━━━━━━━━━
HAUPTFUNKTIONEN (KOSTENLOS)
━━━━━━━━━━━━━━━━━━━━

ABLENKENDE WEBSEITEN BLOCKIEREN
Fuge bis zu 10 Webseiten zu deiner Blockliste hinzu. Wenn du wahrend einer Fokus-Sitzung versuchst, eine blockierte Seite zu besuchen, siehst du stattdessen eine motivierende Blockseite. Unterstutzt Wildcard-Blocking (blockiere ganz reddit.com, nicht nur einzelne Seiten).

POMODORO-TIMER
Integrierter 25/5 Pomodoro-Timer mit automatischen Pausenerinnerungen. Starte eine Fokus-Sitzung mit einem Klick aus dem Popup. Passe Sitzungs- und Pausenlangen an deinen Arbeitsablauf an.

FOCUS SCORE
Deine personliche Produktivitatsmetrik (0-100), die verfolgt, wie gut du Ablenkungen wahrend Fokus-Sitzungen widerstehst. Beobachte, wie dein Score steigt, wahrend du bessere Gewohnheiten aufbaust.

TAGLICHE SERIEN
Bleib motiviert mit der Verfolgung aufeinanderfolgender Tage. Baue Serien auf, indem du mindestens eine Fokus-Sitzung pro Tag abschliesst. Teile deine Erfolge mit Freunden.

SITZUNGSVERLAUF
Sieh genau, wann du dich konzentriert hast, wie lange und wie viele Ablenkungen blockiert wurden. Uberprufe deine Produktivitatsmuster der letzten 7 Tage.

MOTIVIERENDE BLOCKSEITE
Wenn du versuchst, eine blockierte Seite zu besuchen, siehst du eine Seite mit wechselnden motivierenden Zitaten, deinem aktuellen Serienstand und einem Timer, der anzeigt, wie lange deine Sitzung noch dauert.

━━━━━━━━━━━━━━━━━━━━
PRO-FUNKTIONEN (ab 4,49 EUR/Monat)
━━━━━━━━━━━━━━━━━━━━

UNBEGRENZTE BLOCKLISTE
Entferne das 10-Seiten-Limit. Blockiere so viele Webseiten wie notig — soziale Medien, Nachrichtenseiten, Shopping, Gaming — alles, was dich von deiner Arbeit ablenkt.

NUKLEAR-MODUS
Wenn Willenskraft nicht reicht: Sperre deine Blockliste fur einen festgelegten Zeitraum. Sobald der Nuklear-Modus aktiviert ist, konnen Seiten NICHT entsperrt werden, bis der Timer ablauft. Nicht von dir, nicht von niemandem. Echtes Engagement.

AMBIENT-SOUNDS
Drei integrierte Klanglandschaften (Regen, Cafe, weisses Rauschen), die dir helfen, wahrend der Fokus-Sitzungen in den Flow-Zustand zu gelangen und ihn beizubehalten.

ERWEITERTE STATISTIKEN
Vollstandige woechentliche und monatliche Berichte mit detaillierten Aufschlusselungen: Fokus-Stunden nach Tag, am haufigsten blockierte Seiten, Focus Score Trends, Sitzungsabschlussrate und mehr. Exportiere deine Daten als CSV.

GEPLANTES BLOCKIEREN
Richte automatische Blockierungszeitplane ein: Blockiere ablenkende Seiten wahrend der Arbeitszeiten (Mo-Fr, 9:00-17:00) und gib sie abends und am Wochenende frei.

SYNCHRONISIERUNG UBER GERATE
Deine Blockliste, Einstellungen und Statistiken synchronisieren sich uber alle deine Chrome-Browser uber dein Konto.

━━━━━━━━━━━━━━━━━━━━
PREISE
━━━━━━━━━━━━━━━━━━━━

Kostenlos: Voller Funktionsumfang mit 10-Seiten-Blocklimit
Pro Monatlich: 4,49 EUR/Monat
Pro Jahrlich: 2,69 EUR/Monat (jahrlich abgerechnet — spare 40%)
Lebenszeit: 44,99 EUR — einmalige Zahlung

Studentenrabatt verfugbar (40% Rabatt mit gultiger Studentenverifizierung).

━━━━━━━━━━━━━━━━━━━━
DATENSCHUTZ ZUERST
━━━━━━━━━━━━━━━━━━━━

Focus Mode - Blocker sammelt KEINE Browserdaten. Niemals. Deine Blockliste und Einstellungen werden lokal auf deinem Gerat gespeichert (oder uber dein Chrome-Profil synchronisiert, wenn du das mochtest). Wir verfolgen nicht, welche Seiten du besuchst. Wir verkaufen keine Daten. Wir haben keine Analysen uber dein Surfverhalten.

Berechtigungen erklart:
• "Alle Daten auf allen Webseiten lesen und andern" — Erforderlich, um zu erkennen, wenn du eine blockierte Seite besuchst, und die Blockseite anzuzeigen. Wir prufen NUR gegen deine personliche Blockliste.
• "Speicher" — Um deine Einstellungen und Sitzungsdaten lokal zu speichern.
• "Alarme" — Fur den Pomodoro-Timer und geplantes Blockieren.

━━━━━━━━━━━━━━━━━━━━
SUPPORT
━━━━━━━━━━━━━━━━━━━━

Fragen? Funktionswunsche? Fehlerberichte?
• E-Mail: support@zovo.one
• Twitter/X: @focusmodeext
• GitHub: github.com/zovo/focus-mode-blocker
• FAQ: zovo.one/focus-mode/faq

Wir lesen jede Nachricht und antworten in der Regel innerhalb von 24 Stunden.

━━━━━━━━━━━━━━━━━━━━

Entwickelt von Zovo — Werkzeuge, die dir helfen, deine beste Arbeit zu leisten.

Tags: Webseiten-Blocker, Ablenkungen blockieren, Fokus-Modus Chrome, Pomodoro-Timer, Produktivitats-Erweiterung, Webseiten blockieren, ablenkende Seiten sperren, Fokus-Timer, kostenloser Webseiten-Blocker, Pomodoro Chrome Erweiterung, Lern-Timer, ADHS Fokus-Werkzeug, Nuklear-Modus Blocker, Ambient Sounds Fokus, Website-Sperre Chrome, Konzentration steigern
```

---

#### 5.1.4 French (fr) -- Full CWS Description

**Short Description (132 chars max):**

```
Bloquez les sites web distrayants, minuteur Pomodoro integre, Focus Score et series. Gratuit pour toujours. Pro pour plus de puissance.
```

**Full Description:**

```
Vous perdez des heures sur YouTube, Twitter et les reseaux sociaux au lieu de travailler ? Vous n'etes pas seul : le travailleur moyen perd 2,1 heures par jour a cause des distractions numeriques.

Focus Mode - Blocker vous redonne le controle. Bloquez les sites web distrayants en un clic, restez concentre grace au minuteur Pomodoro integre et observez votre productivite croitre avec le suivi du Focus Score et des series quotidiennes.

Que vous soyez developpeur, etudiant preparant ses examens, freelance facturant ses heures ou simplement quelqu'un qui lutte contre les distractions en ligne — Focus Mode vous donne la structure dont vous avez besoin pour donner le meilleur de vous-meme.

━━━━━━━━━━━━━━━━━━━━
FONCTIONNALITES PRINCIPALES (GRATUITES)
━━━━━━━━━━━━━━━━━━━━

BLOQUER LES SITES WEB DISTRAYANTS
Ajoutez jusqu'a 10 sites web a votre liste de blocage. Lorsque vous tentez de visiter un site bloque pendant une session de concentration, vous verrez une page de motivation au lieu de votre distraction. Compatible avec le blocage par caracteres generiques (bloquez tout reddit.com, pas seulement des pages specifiques).

MINUTEUR POMODORO
Minuteur Pomodoro 25/5 integre avec rappels de pause automatiques. Lancez une session de concentration en un clic depuis le popup. Personnalisez la duree des sessions et des pauses selon votre rythme de travail.

FOCUS SCORE (SCORE DE CONCENTRATION)
Votre metrique personnelle de productivite (0-100) qui suit votre capacite a resister aux distractions pendant les sessions de concentration. Regardez votre score grimper a mesure que vous construisez de meilleures habitudes.

SERIES QUOTIDIENNES
Restez motive grace au suivi des jours consecutifs. Construisez des series en completant au moins une session de concentration par jour. Partagez vos realisations avec vos amis.

HISTORIQUE DES SESSIONS
Voyez exactement quand vous vous etes concentre, pendant combien de temps et combien de distractions ont ete bloquees. Analysez vos habitudes de productivite sur les 7 derniers jours.

PAGE DE BLOCAGE MOTIVANTE
Lorsque vous tentez de visiter un site bloque, decouvrez une belle page avec des citations motivantes rotatives, votre compte de serie actuel et un minuteur indiquant le temps restant de votre session.

━━━━━━━━━━━━━━━━━━━━
FONCTIONNALITES PRO (a partir de 4,49 EUR/mois)
━━━━━━━━━━━━━━━━━━━━

LISTE DE BLOCAGE ILLIMITEE
Supprimez la limite de 10 sites. Bloquez autant de sites web que necessaire — reseaux sociaux, actualites, shopping, jeux — tout ce qui vous eloigne de votre travail.

MODE NUCLEAIRE
Quand la volonte ne suffit pas : verrouillez votre liste de blocage pour une periode determinee. Une fois le Mode Nucleaire active, les sites NE PEUVENT PAS etre debloques avant l'expiration du minuteur. Ni par vous, ni par personne. Un engagement veritable.

SONS AMBIANTS
Trois paysages sonores integres (pluie, cafe, bruit blanc) pour vous aider a entrer et maintenir l'etat de flow pendant vos sessions de concentration.

STATISTIQUES AVANCEES
Rapports hebdomadaires et mensuels complets avec ventilations detaillees : heures de concentration par jour, sites les plus bloques, tendances du Focus Score, taux de completion des sessions et plus encore. Exportez vos donnees en CSV.

BLOCAGE PROGRAMME
Definissez des horaires de blocage automatique : bloquez les sites distrayants pendant les heures de travail (Lun-Ven, 9h-17h) et liberez-les le soir et le week-end.

SYNCHRONISATION MULTI-APPAREILS
Votre liste de blocage, vos parametres et vos statistiques se synchronisent sur tous vos navigateurs Chrome via votre compte.

━━━━━━━━━━━━━━━━━━━━
TARIFS
━━━━━━━━━━━━━━━━━━━━

Gratuit : Toutes les fonctionnalites avec limite de 10 sites
Pro Mensuel : 4,49 EUR/mois
Pro Annuel : 2,69 EUR/mois (facture annuellement — economisez 40 %)
A vie : 44,99 EUR — paiement unique

Reduction etudiante disponible (40 % de reduction avec verification etudiante valide).

━━━━━━━━━━━━━━━━━━━━
CONFIDENTIALITE D'ABORD
━━━━━━━━━━━━━━━━━━━━

Focus Mode - Blocker ne collecte PAS vos donnees de navigation. Jamais. Votre liste de blocage et vos parametres sont stockes localement sur votre appareil (ou synchronises via votre profil Chrome si vous le souhaitez). Nous ne suivons pas les sites que vous visitez. Nous ne vendons pas de donnees. Nous n'analysons pas votre comportement de navigation.

Permissions expliquees :
• "Lire et modifier toutes vos donnees sur tous les sites web" — Necessaire pour detecter votre visite d'un site bloque et afficher la page de blocage. Nous verifions UNIQUEMENT votre liste de blocage personnelle.
• "Stockage" — Pour sauvegarder vos parametres et donnees de session localement.
• "Alarmes" — Pour le minuteur Pomodoro et le blocage programme.

━━━━━━━━━━━━━━━━━━━━
SUPPORT
━━━━━━━━━━━━━━━━━━━━

Questions ? Demandes de fonctionnalites ? Rapports de bugs ?
• Email : support@zovo.one
• Twitter/X : @focusmodeext
• GitHub : github.com/zovo/focus-mode-blocker
• FAQ : zovo.one/focus-mode/faq

Nous lisons chaque message et repondons generalement sous 24 heures.

━━━━━━━━━━━━━━━━━━━━

Cree par Zovo — des outils qui vous aident a donner le meilleur de vous-meme.

Tags : bloqueur de sites web, bloquer les distractions, extension de concentration, minuteur pomodoro, mode focus chrome, extension productivite, bloquer reseaux sociaux, bloquer youtube, minuteur de concentration, bloqueur web gratuit, extension pomodoro chrome, minuteur d'etude, outil de concentration TDAH, mode nucleaire bloqueur, sons ambiants concentration, bloqueur de sites Chrome
```

---

#### 5.1.5 Portuguese-BR (pt_BR) -- Full CWS Description

**Short Description (132 chars max):**

```
Bloqueie sites que distraem, timer Pomodoro integrado, Focus Score e sequencias diarias. Gratis para sempre. Pro libera mais poder.
```

**Full Description:**

```
Perdendo horas no YouTube, Twitter e redes sociais quando deveria estar trabalhando? Voce nao esta sozinho — o trabalhador medio perde 2,1 horas por dia com distracoes digitais.

Focus Mode - Blocker te devolve o controle. Bloqueie sites que distraem com um clique, mantenha o foco com o timer Pomodoro integrado e acompanhe sua produtividade crescer com o Focus Score e sequencias diarias.

Seja voce um desenvolvedor escrevendo codigo, um estudante se preparando para provas, um freelancer faturando horas ou qualquer pessoa que luta contra distracoes online — Focus Mode te da a estrutura que voce precisa para fazer seu melhor trabalho.

━━━━━━━━━━━━━━━━━━━━
FUNCIONALIDADES PRINCIPAIS (GRATIS)
━━━━━━━━━━━━━━━━━━━━

BLOQUEIE SITES QUE DISTRAEM
Adicione ate 10 sites a sua lista de bloqueio. Quando tentar visitar um site bloqueado durante uma sessao de foco, voce vera uma pagina motivacional em vez da sua distracao. Suporta bloqueio por curinga (bloqueie todo o reddit.com, nao apenas paginas especificas).

TIMER POMODORO
Timer Pomodoro 25/5 integrado com lembretes automaticos de pausa. Inicie uma sessao de foco com um clique no popup. Personalize a duracao das sessoes e pausas de acordo com seu fluxo de trabalho.

FOCUS SCORE (PONTUACAO DE FOCO)
Sua metrica pessoal de produtividade (0-100) que acompanha o quao bem voce resiste as distracoes durante as sessoes de foco. Veja sua pontuacao subir conforme voce constroi melhores habitos.

SEQUENCIAS DIARIAS
Mantenha-se motivado com o acompanhamento de dias consecutivos. Construa sequencias completando pelo menos uma sessao de foco por dia. Compartilhe suas conquistas com amigos.

HISTORICO DE SESSOES
Veja exatamente quando voce se concentrou, por quanto tempo e quantas distracoes foram bloqueadas. Revise seus padroes de produtividade dos ultimos 7 dias.

PAGINA DE BLOQUEIO MOTIVACIONAL
Quando tentar visitar um site bloqueado, veja uma pagina com citacoes motivacionais rotativas, sua contagem de sequencia atual e um timer mostrando quanto tempo falta para sua sessao terminar.

━━━━━━━━━━━━━━━━━━━━
FUNCIONALIDADES PRO (a partir de R$ 14,90/mes)
━━━━━━━━━━━━━━━━━━━━

LISTA DE BLOQUEIO ILIMITADA
Remova o limite de 10 sites. Bloqueie quantos sites precisar — redes sociais, noticias, compras, jogos — tudo que te afasta do seu trabalho.

MODO NUCLEAR
Quando a forca de vontade nao e suficiente: bloqueie sua lista por um periodo determinado. Uma vez ativado o Modo Nuclear, os sites NAO podem ser desbloqueados ate o timer expirar. Nem por voce, nem por ninguem. Compromisso de verdade.

SONS AMBIENTES
Tres paisagens sonoras integradas (chuva, cafeteria, ruido branco) para ajudar voce a entrar e manter o estado de flow durante as sessoes de foco.

ESTATISTICAS AVANCADAS
Relatorios semanais e mensais completos com detalhamentos: horas de foco por dia, sites mais bloqueados, tendencias do Focus Score, taxa de conclusao de sessoes e mais. Exporte seus dados como CSV.

BLOQUEIO PROGRAMADO
Configure horarios de bloqueio automatico: bloqueie sites que distraem durante o horario de trabalho (Seg-Sex, 9h-17h) e libere-os a noite e nos fins de semana.

SINCRONIZACAO ENTRE DISPOSITIVOS
Sua lista de bloqueio, configuracoes e estatisticas sincronizam em todos os seus navegadores Chrome atraves da sua conta.

━━━━━━━━━━━━━━━━━━━━
PRECOS
━━━━━━━━━━━━━━━━━━━━

Gratis: Todas as funcionalidades com limite de 10 sites
Pro Mensal: R$ 14,90/mes
Pro Anual: R$ 8,90/mes (cobrado anualmente — economize 40%)
Vitalicio: R$ 149,90 — pagamento unico

Desconto para estudantes disponivel (30% de desconto com verificacao estudantil).

━━━━━━━━━━━━━━━━━━━━
PRIVACIDADE EM PRIMEIRO LUGAR
━━━━━━━━━━━━━━━━━━━━

Focus Mode - Blocker NAO coleta seus dados de navegacao. Nunca. Sua lista de bloqueio e configuracoes sao armazenadas localmente no seu dispositivo (ou sincronizadas via seu perfil Chrome, se voce escolher). Nao rastreamos quais sites voce visita. Nao vendemos dados. Nao temos analises do seu comportamento de navegacao.

Permissoes explicadas:
• "Ler e alterar todos os seus dados em todos os sites" — Necessario para detectar quando voce visita um site bloqueado e mostrar a pagina de bloqueio. Nos APENAS verificamos contra sua lista de bloqueio pessoal.
• "Armazenamento" — Para salvar suas configuracoes e dados de sessao localmente.
• "Alarmes" — Para o timer Pomodoro e o bloqueio programado.

━━━━━━━━━━━━━━━━━━━━
SUPORTE
━━━━━━━━━━━━━━━━━━━━

Duvidas? Sugestoes de funcionalidades? Relatorios de bugs?
• Email: support@zovo.one
• Twitter/X: @focusmodeext
• GitHub: github.com/zovo/focus-mode-blocker
• FAQ: zovo.one/focus-mode/faq

Lemos todas as mensagens e normalmente respondemos em ate 24 horas.

━━━━━━━━━━━━━━━━━━━━

Criado por Zovo — ferramentas que ajudam voce a fazer seu melhor trabalho.

Tags: bloqueador de sites, bloquear distracoes, extensao para focar, timer pomodoro, modo foco chrome, extensao de produtividade, bloquear redes sociais, bloquear youtube, timer de concentracao, bloqueador web gratis, extensao pomodoro chrome, timer de estudo, ferramenta de foco TDAH, modo nuclear bloqueador, sons ambientes foco, bloqueador de sites Chrome, bloquear sites no Chrome
```

---

#### 5.1.6 Japanese (ja) -- Full CWS Description

**Short Description (132 chars max):**

Note: Japanese characters are wider, so the effective character limit is lower. CWS counts bytes differently for CJK.

```
集中を妨げるサイトをブロック。ポモドーロタイマー、集中スコア、連続記録を搭載。無料で使えます。Proでさらにパワーアップ。
```

**Full Description:**

```
YouTube、Twitter、SNSで何時間も無駄にしていませんか？あなただけではありません。平均的なナレッジワーカーは1日2.1時間をデジタルの気が散る原因に費やしています。

Focus Mode - Blockerでコントロールを取り戻しましょう。ワンクリックで集中を妨げるサイトをブロックし、内蔵のポモドーロタイマーで集中を維持し、集中スコアと連続記録であなたの生産性の成長を実感できます。

コードを書く開発者、試験勉強中の学生、時間単位で請求するフリーランサー、またはオンラインの誘惑と戦うすべての方へ — Focus Modeは最高の仕事をするために必要な仕組みを提供します。

━━━━━━━━━━━━━━━━━━━━
主な機能（無料）
━━━━━━━━━━━━━━━━━━━━

【サイトブロック機能】
ブロックリストに最大10サイトを追加できます。集中セッション中にブロックされたサイトにアクセスしようとすると、気が散るコンテンツの代わりにモチベーションを高めるブロックページが表示されます。ワイルドカードブロッキングに対応（reddit.com全体をブロック可能）。

【ポモドーロタイマー】
25分/5分のポモドーロタイマーを内蔵。自動休憩リマインダー付き。ポップアップからワンクリックで集中セッションを開始。セッションと休憩の長さをワークフローに合わせてカスタマイズできます。

【集中スコア】
あなた専用の生産性指標（0〜100点）。集中セッション中にどれだけ誘惑に抵抗できたかを追跡します。より良い習慣を身につけるにつれ、スコアが上昇していくのを実感できます。

【連続記録（ストリーク）】
毎日の連続達成記録でモチベーションを維持。1日1回以上の集中セッションを完了して連続記録を伸ばしましょう。達成を友人とシェアできます。

【セッション履歴】
いつ集中したか、どのくらいの時間か、何件の気が散る要素がブロックされたかを正確に確認。過去7日間の生産性パターンを振り返れます。

【モチベーションブロックページ】
ブロックされたサイトにアクセスしようとすると、ローテーションする名言、現在の連続記録、セッション終了までの残り時間を表示する美しいページが表示されます。

━━━━━━━━━━━━━━━━━━━━
Pro機能（月額¥700から）
━━━━━━━━━━━━━━━━━━━━

【無制限ブロックリスト】
10サイトの制限を解除。SNS、ニュースサイト、ショッピング、ゲーム — 仕事から離れさせるすべてのサイトをブロックできます。

【ニュークリアモード】
意志力だけでは足りないとき：ブロックリストを一定期間ロック。ニュークリアモードが有効になると、タイマーが切れるまでサイトのブロックを解除することは不可能です。あなた自身でも、誰でも。真のコミットメント。

【アンビエントサウンド】
3種類の環境音（雨音、カフェ、ホワイトノイズ）を内蔵。集中セッション中にフロー状態に入り、維持するのを助けます。

【詳細な統計】
週次・月次の完全なレポート：日別の集中時間、最もブロックされたサイト、集中スコアの推移、セッション完了率など。データをCSVでエクスポート可能。

【スケジュールブロック】
自動ブロックスケジュールを設定：仕事時間（月〜金、9:00〜17:00）に集中を妨げるサイトをブロックし、夜間や週末は解除。

【デバイス間同期】
ブロックリスト、設定、統計がアカウントを通じてすべてのChromeブラウザ間で同期されます。

━━━━━━━━━━━━━━━━━━━━
料金
━━━━━━━━━━━━━━━━━━━━

無料：全機能搭載、10サイトのブロック制限あり
Pro月額：¥700/月
Pro年額：¥440/月（年額¥5,280で請求 — 37%お得）
買い切り：¥6,980 — 一回限りのお支払い

学割あり（学生証認証で40%割引）。

━━━━━━━━━━━━━━━━━━━━
プライバシー最優先
━━━━━━━━━━━━━━━━━━━━

Focus Mode - Blockerはあなたの閲覧データを収集しません。一切。ブロックリストと設定はデバイスにローカル保存されます（希望すればChromeプロフィール経由で同期可能）。どのサイトを訪問したか追跡しません。データを販売しません。閲覧行動の分析を行いません。

権限の説明：
•「すべてのウェブサイトのすべてのデータの読み取りと変更」 — ブロックされたサイトへのアクセスを検知し、ブロックページを表示するために必要です。個人のブロックリストとの照合のみ行います。
•「ストレージ」 — 設定とセッションデータをローカルに保存するため。
•「アラーム」 — ポモドーロタイマーとスケジュールブロックのため。

━━━━━━━━━━━━━━━━━━━━
サポート
━━━━━━━━━━━━━━━━━━━━

ご質問・機能リクエスト・バグ報告：
• メール: support@zovo.one
• Twitter/X: @focusmodeext
• GitHub: github.com/zovo/focus-mode-blocker
• よくある質問: zovo.one/focus-mode/faq

すべてのメッセージを読み、通常24時間以内に返信いたします。

━━━━━━━━━━━━━━━━━━━━

Zovo製 — 最高の仕事を支えるツール。

タグ: サイトブロッカー, ウェブサイトブロック, 集中モード, ポモドーロタイマー, Chrome拡張機能, 生産性向上, SNSブロック, YouTubeブロック, 集中タイマー, 無料サイトブロッカー, ポモドーロ Chrome拡張, 勉強タイマー, ADHD 集中ツール, ニュークリアモード, 環境音 集中, サイトブロック Chrome, 集中力アップ, ウェブサイト制限
```

---

### 5.2 Localized Screenshots Strategy

Chrome Web Store allows up to 5 screenshots (1280x800 or 640x400). Screenshots are the second most impactful conversion element after the icon. Localizing screenshots -- especially text overlays -- dramatically improves conversion in non-English markets.

---

#### 5.2.1 Screenshot Sequence (Applies to All Locales)

The 5-screenshot conversion sequence follows the same psychology across all locales (established in Phase 07):

| # | Name | Purpose | Text-Heavy? | Needs Localization? |
|---|------|---------|------------|-------------------|
| 1 | Hero / Hook | Show the popup with timer running and blocked site count | Medium | YES -- popup UI text, overlay headline |
| 2 | Block Page | Show the beautiful block page with motivational quote | High | YES -- quote text, "You're in Focus Mode" text |
| 3 | Statistics Dashboard | Show Focus Score, streak, weekly chart | Medium | YES -- chart labels, score labels, "Focus Score" text |
| 4 | Nuclear Mode | Show Nuclear Mode activation with countdown timer | Medium | YES -- "Nuclear Mode Active" text, warning text |
| 5 | Pro Upgrade / Social Proof | Show Pro features with pricing and star rating | High | YES -- feature list text, pricing, testimonial |

**Verdict:** All 5 screenshots require localization for P1 locales. The effort is primarily in the text overlay layer, not the underlying UI (which is automatically localized by the extension).

---

#### 5.2.2 Screenshots That Can Share a Base Layer

To reduce design effort, screenshots can be structured as:
- **Base layer:** The actual extension UI screenshot (taken with the extension running in the target locale)
- **Overlay layer:** Marketing text, arrows, annotations, badges
- **Background layer:** Gradient or pattern background

The base layer changes automatically when the extension runs in a different locale. The overlay layer must be manually translated and repositioned. The background layer is shared across all locales.

**Localization effort per screenshot:**

| Screenshot | Base Layer | Overlay Layer | Total Effort |
|-----------|-----------|--------------|-------------|
| 1. Hero / Hook | Re-capture in target locale (5 min) | Translate 1 headline + 1 subhead (10 min) | 15 min |
| 2. Block Page | Re-capture in target locale (5 min) | Translate quote + status text (10 min) | 15 min |
| 3. Statistics | Re-capture in target locale (5 min) | Translate chart labels + score labels (15 min) | 20 min |
| 4. Nuclear Mode | Re-capture in target locale (5 min) | Translate warning text + CTA (10 min) | 15 min |
| 5. Pro Upgrade | Re-capture in target locale (5 min) | Translate feature list + pricing + testimonial (20 min) | 25 min |
| **Total per locale** | | | **~90 min** |

**Total for 6 P1 locales (en + 5 others):** ~7.5 hours of design work.

---

#### 5.2.3 Screenshot Text Overlay Translations

**Screenshot 1: Hero / Hook**

| Locale | Headline | Subhead |
|--------|----------|---------|
| en | "Take Back Your Focus" | "Block distracting sites with one click" |
| es | "Recupera Tu Concentracion" | "Bloquea sitios que distraen con un clic" |
| de | "Hol Dir Deinen Fokus Zuruck" | "Ablenkende Seiten mit einem Klick blockieren" |
| fr | "Reprenez Le Controle" | "Bloquez les sites distrayants en un clic" |
| pt-BR | "Recupere Seu Foco" | "Bloqueie sites que distraem com um clique" |
| ja | "集中力を取り戻そう" | "ワンクリックで気が散るサイトをブロック" |

**Screenshot 2: Block Page**

| Locale | Status Text | Quote Example |
|--------|------------|---------------|
| en | "You're in Focus Mode" | "The main thing is to keep the main thing the main thing." |
| es | "Estas en Modo Enfoque" | "El que la sigue, la consigue." |
| de | "Du bist im Fokus-Modus" | "Ordnung ist das halbe Leben." |
| fr | "Vous etes en Mode Concentration" | "Petit a petit, l'oiseau fait son nid." |
| pt-BR | "Voce esta no Modo Foco" | "Foco, forca e fe." |
| ja | "集中モード中です" | "継続は力なり" |

**Screenshot 3: Statistics Dashboard**

| Locale | Focus Score Label | Streak Label | Chart Title |
|--------|------------------|-------------|-------------|
| en | "Focus Score: 85/100" | "7-day streak" | "This Week" |
| es | "Puntuacion: 85/100" | "Racha de 7 dias" | "Esta Semana" |
| de | "Fokus-Score: 85/100" | "7-Tage-Serie" | "Diese Woche" |
| fr | "Score: 85/100" | "Serie de 7 jours" | "Cette Semaine" |
| pt-BR | "Pontuacao: 85/100" | "Sequencia de 7 dias" | "Esta Semana" |
| ja | "集中スコア: 85/100" | "7日連続" | "今週" |

**Screenshot 4: Nuclear Mode**

| Locale | Headline | Warning Text |
|--------|----------|-------------|
| en | "Nuclear Mode Active" | "Sites locked for 2 hours. No turning back." |
| es | "Modo Nuclear Activo" | "Sitios bloqueados por 2 horas. Sin vuelta atras." |
| de | "Nuklear-Modus Aktiv" | "Seiten fur 2 Stunden gesperrt. Kein Zurück." |
| fr | "Mode Nucleaire Actif" | "Sites verrouilles pendant 2 heures. Pas de retour en arriere." |
| pt-BR | "Modo Nuclear Ativo" | "Sites bloqueados por 2 horas. Sem volta." |
| ja | "ニュークリアモード起動中" | "2時間サイトがロックされました。解除不可。" |

**Screenshot 5: Pro Upgrade**

| Locale | Headline | CTA Button | Price Shown |
|--------|----------|-----------|-------------|
| en | "Unlock Your Full Potential" | "Upgrade to Pro" | "$4.99/mo" |
| es | "Libera Todo Tu Potencial" | "Mejorar a Pro" | "3,99 EUR/mes" |
| de | "Entfalte Dein Volles Potenzial" | "Auf Pro upgraden" | "4,49 EUR/Monat" |
| fr | "Liberez Votre Plein Potentiel" | "Passer a Pro" | "4,49 EUR/mois" |
| pt-BR | "Libere Todo Seu Potencial" | "Assinar Pro" | "R$ 14,90/mes" |
| ja | "あなたの可能性を解き放とう" | "Proにアップグレード" | "¥700/月" |

---

#### 5.2.4 Screenshot Production Workflow

**Tools:**
- **Figma:** Primary design tool. Create a master template with layer groups for base, overlay, and background.
- **Screenshot capture:** Use Chrome DevTools device mode (1280x800 viewport) with the extension running in the target locale.
- **Text replacement:** Figma components with text overrides per locale.

**Figma template structure:**

```
Screenshot_Template.fig
  |
  +-- Page: "Screenshot 1 - Hero"
  |     +-- Frame: "en" (1280x800)
  |     |     +-- Layer: Background (gradient)
  |     |     +-- Layer: Base (popup screenshot)
  |     |     +-- Layer: Overlay-en (headline, subhead)
  |     +-- Frame: "es" (1280x800)
  |     +-- Frame: "de" (1280x800)
  |     +-- Frame: "fr" (1280x800)
  |     +-- Frame: "pt-BR" (1280x800)
  |     +-- Frame: "ja" (1280x800)
  |
  +-- Page: "Screenshot 2 - Block Page"
  |     +-- (same structure)
  |
  ... (5 pages total)
```

**Production workflow per locale:**

1. Set Chrome language to target locale
2. Load Focus Mode - Blocker with test data
3. Capture 5 base screenshots at 1280x800
4. Import screenshots into Figma template
5. Replace overlay text with translated versions
6. Export all 5 frames as PNG
7. Upload to CWS Developer Dashboard under the correct locale

**CWS screenshot specifications:**

| Property | Requirement |
|----------|-------------|
| Dimensions | 1280x800 or 640x400 (recommended: 1280x800) |
| Format | PNG or JPEG (PNG preferred for text clarity) |
| File size | Maximum 2 MB per image |
| Count | 1-5 screenshots (recommended: 5) |
| Locales | Can be different per CWS locale |

---

### 5.3 Regional Keyword Optimization

Effective CWS ASO requires locale-specific keywords that reflect how users in each market actually search -- not direct translations of English keywords. This section provides researched keywords for each P1 locale.

---

#### 5.3.1 Spanish (es) Keywords

**Primary keywords (high intent, solution-aware):**

| Keyword (Spanish) | English Equivalent | Est. Monthly Searches | Priority |
|--------------------|-------------------|----------------------|----------|
| bloqueador de sitios web | website blocker | 4,200 | Critical |
| bloquear paginas web | block web pages | 3,800 | Critical |
| bloqueador de distracciones | distraction blocker | 2,100 | Critical |
| extension para concentrarse | extension to concentrate | 1,400 | Critical |
| temporizador pomodoro chrome | pomodoro timer chrome | 1,800 | Critical |
| bloquear redes sociales | block social media | 2,600 | High |
| bloquear youtube chrome | block youtube chrome | 1,200 | High |
| modo enfoque chrome | focus mode chrome | 800 | Critical (brand) |
| bloqueador web gratis | free web blocker | 1,600 | High |
| extension productividad chrome | productivity extension chrome | 900 | Medium |
| bloquear paginas en el navegador | block pages in browser | 1,100 | Medium |
| extension para estudiar | extension for studying | 1,500 | High |

**Long-tail keywords:**

| Keyword | Est. Monthly Searches | Notes |
|---------|----------------------|-------|
| como bloquear paginas web en chrome | 2,200 | How-to intent; content marketing |
| extension para bloquear youtube | 1,400 | Specific platform |
| temporizador pomodoro con bloqueador | 600 | Multi-feature query = exact match |
| bloqueador de sitios web con temporizador | 400 | Multi-feature query = exact match |
| como dejar de procrastinar | 5,800 | Problem-aware; blog content |
| extension para no distraerse | 800 | Colloquial phrasing |
| bloquear instagram en el ordenador | 600 | Platform-specific |
| bloqueador de sitios web para estudiar | 500 | Student segment |
| alternativa a blocksite | 300 | Competitor keyword |
| extension para concentrarse estudiando | 400 | Student + focus |

**Competitor keywords (es):**

| Keyword | Competitor | Notes |
|---------|-----------|-------|
| alternativa a blocksite | BlockSite | BlockSite has some Spanish presence |
| blocksite en espanol | BlockSite | Users looking for Spanish version |
| mejor bloqueador de sitios web | General | "best website blocker" |
| bloqueador como cold turkey | Cold Turkey | Cold Turkey is English-only |
| alternativa gratuita a freedom | Freedom | Freedom pricing is prohibitive in LATAM |

---

#### 5.3.2 German (de) Keywords

**Primary keywords:**

| Keyword (German) | English Equivalent | Est. Monthly Searches | Priority |
|-------------------|-------------------|----------------------|----------|
| Webseiten-Blocker | website blocker | 3,600 | Critical |
| Webseiten blockieren Chrome | block websites chrome | 2,800 | Critical |
| Ablenkungen blockieren | block distractions | 1,800 | Critical |
| Fokus-Modus Chrome | focus mode chrome | 600 | Critical (brand) |
| Pomodoro-Timer Chrome | pomodoro timer chrome | 1,400 | Critical |
| Webseiten sperren | block/lock websites | 2,200 | High |
| Seiten blockieren Erweiterung | block sites extension | 1,200 | High |
| Produktivitats-Erweiterung | productivity extension | 800 | Medium |
| Ablenkende Seiten sperren | lock distracting sites | 900 | High |
| Konzentration steigern | improve concentration | 1,600 | Medium |
| Website-Sperre Chrome | website lock chrome | 1,000 | High |
| kostenloser Webseiten-Blocker | free website blocker | 1,100 | High |

**Long-tail keywords:**

| Keyword | Est. Monthly Searches | Notes |
|---------|----------------------|-------|
| wie kann ich Webseiten blockieren Chrome | 1,800 | How-to; very high intent |
| Pomodoro-Technik Chrome Erweiterung | 500 | Technique-specific |
| YouTube blockieren wahrend der Arbeit | 600 | Use-case specific |
| Erweiterung zum Konzentrieren | 400 | "Extension for concentrating" |
| soziale Medien blockieren Chrome | 700 | Social media specific |
| Webseiten-Blocker fur Studenten | 300 | Student segment |
| Alternative zu BlockSite | 200 | Competitor |
| Webseiten zeitweise sperren | 400 | Schedule blocking intent |
| Ablenkung vermeiden Chrome | 500 | "Avoid distraction Chrome" |
| ADHS Fokus-Werkzeug Chrome | 200 | ADHD segment |

**Competitor keywords (de):**

| Keyword | Competitor | Notes |
|---------|-----------|-------|
| BlockSite Alternative | BlockSite | BlockSite has German presence |
| StayFocusd Alternative | StayFocusd | English-only competitor |
| Cold Turkey auf Deutsch | Cold Turkey | Users wanting German version |
| besserer Webseiten-Blocker | General | "better website blocker" |
| LeechBlock Alternative | LeechBlock | Niche but loyal following |

---

#### 5.3.3 French (fr) Keywords

**Primary keywords:**

| Keyword (French) | English Equivalent | Est. Monthly Searches | Priority |
|-------------------|-------------------|----------------------|----------|
| bloqueur de sites web | website blocker | 3,200 | Critical |
| bloquer sites web Chrome | block websites chrome | 2,400 | Critical |
| extension de concentration | focus extension | 1,200 | Critical |
| bloquer les distractions | block distractions | 1,600 | Critical |
| minuteur pomodoro Chrome | pomodoro timer chrome | 1,000 | Critical |
| bloqueur de distractions | distraction blocker | 1,400 | High |
| mode focus Chrome | focus mode chrome | 500 | Critical (brand) |
| bloquer reseaux sociaux | block social media | 1,800 | High |
| extension productivite Chrome | productivity extension chrome | 700 | Medium |
| bloqueur web gratuit | free web blocker | 900 | High |
| bloquer YouTube Chrome | block youtube chrome | 800 | High |
| aide a la concentration | focus aid | 600 | Medium |

**Long-tail keywords:**

| Keyword | Est. Monthly Searches | Notes |
|---------|----------------------|-------|
| comment bloquer des sites web sur Chrome | 2,000 | How-to; high intent |
| extension pour se concentrer | 600 | "extension to focus" |
| bloqueur de sites web avec minuteur | 300 | Multi-feature query |
| bloquer les reseaux sociaux pendant le travail | 400 | Use-case specific |
| minuteur Pomodoro avec bloqueur de sites | 200 | Multi-feature match |
| extension Chrome pour etudier | 500 | Student segment |
| comment arreter de procrastiner | 3,200 | Problem-aware |
| alternative a BlockSite | 200 | Competitor |
| bloquer Instagram sur ordinateur | 400 | Platform-specific |
| TDAH outil de concentration | 300 | ADHD segment (TDAH = French for ADHD) |

---

#### 5.3.4 Portuguese-BR (pt_BR) Keywords

**Primary keywords:**

| Keyword (Portuguese-BR) | English Equivalent | Est. Monthly Searches | Priority |
|--------------------------|-------------------|----------------------|----------|
| bloqueador de sites | site blocker | 5,800 | Critical |
| bloquear sites no Chrome | block sites on chrome | 3,200 | Critical |
| extensao para focar | extension to focus | 1,800 | Critical |
| bloquear distracoes | block distractions | 1,400 | Critical |
| timer pomodoro Chrome | pomodoro timer chrome | 1,600 | Critical |
| bloqueador de sites gratis | free site blocker | 2,200 | High |
| modo foco Chrome | focus mode chrome | 700 | Critical (brand) |
| bloquear redes sociais | block social media | 2,000 | High |
| extensao de produtividade | productivity extension | 900 | Medium |
| bloquear YouTube Chrome | block youtube chrome | 1,200 | High |
| extensao para estudar | extension for studying | 1,400 | High |
| bloqueador web Chrome | web blocker chrome | 1,000 | High |

**Long-tail keywords:**

| Keyword | Est. Monthly Searches | Notes |
|---------|----------------------|-------|
| como bloquear sites no Chrome | 4,200 | How-to; very high search volume |
| extensao para bloquear sites no Chrome | 1,600 | Direct solution search |
| timer pomodoro com bloqueador de sites | 400 | Multi-feature query |
| como parar de procrastinar | 6,800 | Problem-aware; huge volume |
| extensao para concentrar nos estudos | 600 | Student segment |
| bloquear Instagram no computador | 800 | Platform-specific |
| alternativa ao BlockSite | 300 | Competitor |
| bloqueador de sites para estudar | 500 | Student segment |
| como bloquear YouTube no Chrome | 1,400 | Platform-specific |
| extensao TDAH foco | 200 | ADHD segment (TDAH = Portuguese for ADHD) |

---

#### 5.3.5 Japanese (ja) Keywords

**Primary keywords:**

| Keyword (Japanese) | English Equivalent | Est. Monthly Searches | Priority |
|---------------------|-------------------|----------------------|----------|
| サイトブロッカー | site blocker | 2,800 | Critical |
| ウェブサイトブロック | website block | 2,200 | Critical |
| 集中モード Chrome拡張 | focus mode chrome extension | 800 | Critical (brand) |
| ポモドーロタイマー Chrome | pomodoro timer chrome | 1,400 | Critical |
| サイトブロック Chrome | site block chrome | 1,800 | Critical |
| 集中 拡張機能 | focus extension | 1,000 | High |
| SNSブロック Chrome | SNS block chrome | 600 | High |
| ウェブサイト制限 | website restriction | 900 | High |
| 生産性向上 Chrome | productivity improvement chrome | 500 | Medium |
| 集中力アップ ツール | focus improvement tool | 700 | Medium |
| YouTubeブロック Chrome | youtube block chrome | 800 | High |
| 無料 サイトブロッカー | free site blocker | 600 | High |

**Long-tail keywords:**

| Keyword | Est. Monthly Searches | Notes |
|---------|----------------------|-------|
| Chromeでサイトをブロックする方法 | 1,600 | How-to |
| 集中できない 対策 Chrome | 400 | Problem-aware |
| ポモドーロテクニック Chrome拡張機能 | 300 | Technique-specific |
| 仕事中 YouTube ブロック | 500 | Use-case specific |
| 勉強 集中 Chrome拡張 | 600 | Student segment |
| SNS 時間制限 Chrome | 400 | Screen time intent |
| BlockSite 代替 | 200 | Competitor (in Japanese) |
| ADHD 集中ツール | 200 | ADHD segment |
| 気が散る サイト ブロック | 300 | Problem statement |
| Chrome 拡張 サイトブロッカー おすすめ | 400 | "Recommended" search |

---

#### 5.3.6 CWS Search Volume Estimates by Locale

| Locale | Total CWS Searches (est. monthly) | Website Blocker Category | Our Keyword Coverage | Competition Level |
|--------|-----------------------------------|------------------------|---------------------|------------------|
| en (global) | 2,800,000 | 180,000 | 92% | Very High |
| es | 420,000 | 28,000 | 85% | Low |
| de | 380,000 | 22,000 | 88% | Low-Medium |
| fr | 340,000 | 19,000 | 82% | Low |
| pt-BR | 520,000 | 35,000 | 86% | Low |
| ja | 280,000 | 15,000 | 78% | Medium |
| ko | 190,000 | 10,000 | 70% | Low |
| ru | 310,000 | 20,000 | 75% | Low |
| zh-CN/TW | 160,000 | 8,000 | 65% | Medium |
| ar | 120,000 | 6,000 | 60% | Very Low |
| pl | 80,000 | 5,000 | 72% | Very Low |
| hi | 110,000 | 7,000 | 68% | Very Low |

**Key insight:** The English market has the highest search volume but also the highest competition. Non-English markets have collectively more volume than English alone, with dramatically lower competition. A localized listing in Spanish, Portuguese-BR, German, French, and Japanese captures an estimated 119,000 monthly category searches with minimal competition.

---

## 6. Store Assets Organization

This section defines the complete folder structure for localized store assets, the production workflow, and cost/time estimates.

---

### 6.1 Complete Folder Structure

```
store-assets/
  |
  +-- icons/
  |     +-- icon-16.png
  |     +-- icon-32.png
  |     +-- icon-48.png
  |     +-- icon-128.png
  |     +-- icon-store.png (128x128, CWS requirement)
  |     (Icons are NOT localized -- same across all locales)
  |
  +-- screenshots/
  |     +-- en/
  |     |     +-- screenshot-1-hero.png        (1280x800)
  |     |     +-- screenshot-2-blockpage.png   (1280x800)
  |     |     +-- screenshot-3-stats.png       (1280x800)
  |     |     +-- screenshot-4-nuclear.png     (1280x800)
  |     |     +-- screenshot-5-pro.png         (1280x800)
  |     +-- es/
  |     |     +-- screenshot-1-hero.png
  |     |     +-- screenshot-2-blockpage.png
  |     |     +-- screenshot-3-stats.png
  |     |     +-- screenshot-4-nuclear.png
  |     |     +-- screenshot-5-pro.png
  |     +-- de/
  |     |     +-- (same 5 files)
  |     +-- fr/
  |     |     +-- (same 5 files)
  |     +-- pt_BR/
  |     |     +-- (same 5 files)
  |     +-- ja/
  |     |     +-- (same 5 files)
  |     +-- ko/            (P2 -- when ready)
  |     +-- ru/            (P2 -- when ready)
  |     +-- ar/            (P2 -- when ready)
  |     +-- zh_CN/         (P2 -- when ready)
  |
  +-- promo-images/
  |     +-- en/
  |     |     +-- small-promo-440x280.png      (CWS small promo tile)
  |     |     +-- large-promo-920x680.png      (CWS marquee promo)
  |     +-- es/
  |     |     +-- small-promo-440x280.png
  |     |     +-- large-promo-920x680.png
  |     +-- de/
  |     |     +-- (same 2 files)
  |     +-- fr/
  |     |     +-- (same 2 files)
  |     +-- pt_BR/
  |     |     +-- (same 2 files)
  |     +-- ja/
  |     |     +-- (same 2 files)
  |
  +-- video/
  |     +-- en/
  |     |     +-- demo-video.mp4               (30 sec, YouTube hosted)
  |     |     +-- demo-video-thumbnail.png     (1280x720)
  |     +-- (Video localization is P3 -- English-only initially)
  |
  +-- descriptions/
  |     +-- en.txt          (Full CWS description, plain text)
  |     +-- en-short.txt    (Short description, 132 chars)
  |     +-- es.txt
  |     +-- es-short.txt
  |     +-- de.txt
  |     +-- de-short.txt
  |     +-- fr.txt
  |     +-- fr-short.txt
  |     +-- pt_BR.txt
  |     +-- pt_BR-short.txt
  |     +-- ja.txt
  |     +-- ja-short.txt
  |
  +-- figma/
  |     +-- screenshot-templates.fig    (Master Figma file)
  |     +-- promo-templates.fig         (Master promo image file)
  |     +-- DESIGN-GUIDELINES.md        (Typography, colors, spacing rules)
  |
  +-- _raw/
        +-- base-screenshots/           (Raw extension screenshots per locale)
        +-- mockups/                    (Work-in-progress designs)
```

---

### 6.2 Localized Promotional Images

CWS offers two promotional image slots:

**Small Promotional Tile (440x280):**
- Shown in CWS category pages and search results
- Must include the extension icon, name, and a one-line value proposition
- Text must be localized

| Locale | Value Proposition Text | Font Size |
|--------|----------------------|-----------|
| en | "Block Distractions. Stay Focused." | 24px Bold |
| es | "Bloquea Distracciones. Mantente Enfocado." | 22px Bold |
| de | "Ablenkungen Blockieren. Fokussiert Bleiben." | 22px Bold |
| fr | "Bloquez les Distractions. Restez Concentre." | 22px Bold |
| pt-BR | "Bloqueie Distracoes. Mantenha o Foco." | 22px Bold |
| ja | "集中を妨げるサイトをブロック" | 20px Bold |

**Large Promotional / Marquee Image (920x680):**
- Shown when featured by CWS editors or on the extension's detail page
- Should show the extension in action (popup + block page)
- Includes headline, 3 feature bullets, and a CTA

| Locale | Headline | Feature Bullets |
|--------|----------|----------------|
| en | "Your Focus, Protected" | "Block Sites / Pomodoro Timer / Focus Score" |
| es | "Tu Concentracion, Protegida" | "Bloquea Sitios / Timer Pomodoro / Puntuacion" |
| de | "Dein Fokus, Geschutzt" | "Seiten Blockieren / Pomodoro-Timer / Fokus-Score" |
| fr | "Votre Concentration, Protegee" | "Bloquer Sites / Minuteur Pomodoro / Score Focus" |
| pt-BR | "Seu Foco, Protegido" | "Bloquear Sites / Timer Pomodoro / Pontuacao" |
| ja | "あなたの集中力を守る" | "サイトブロック / ポモドーロ / 集中スコア" |

---

### 6.3 Localization Workflow

The overall localization workflow for store assets follows a phased approach:

**Phase A: P1 Locales (Launch + 2 weeks)**

| Week | Task | Output | Owner |
|------|------|--------|-------|
| 1 | Write English CWS description | en.txt, en-short.txt | Marketing |
| 1 | Create English screenshots (5) | screenshots/en/*.png | Design |
| 1 | Create English promo images (2) | promo-images/en/*.png | Design |
| 1 | Record English demo video (30 sec) | video/en/demo-video.mp4 | Marketing |
| 2 | Translate + adapt CWS descriptions for es, de, fr, pt_BR, ja | *.txt files | Localizers |
| 2 | Capture base screenshots in each P1 locale | _raw/base-screenshots/ | QA |
| 2 | Create screenshot overlays per locale | screenshots/{locale}/*.png | Design |
| 2 | Create promo images per locale | promo-images/{locale}/*.png | Design |
| 2 | Upload all assets to CWS Developer Dashboard | -- | DevOps |
| 2 | QA review: verify all text fits, no truncation, correct pricing | -- | QA |

**Phase B: P2 Locales (Launch + 4-6 weeks)**

| Week | Task | Output |
|------|------|--------|
| 4 | Translate descriptions for ko, ru, ar, zh-CN, pl, nl, it, tr | *.txt files |
| 5 | Create screenshots for ko, ru, ar, zh-CN | screenshots/{locale}/*.png |
| 5 | Create promo images for P2 locales | promo-images/{locale}/*.png |
| 6 | Upload P2 assets to CWS | -- |

**Phase C: P3 Locales (Launch + 8-12 weeks)**

| Week | Task | Output |
|------|------|--------|
| 8-10 | Translate descriptions for hi, th, vi, id, cs, hu, ro, uk | *.txt files |
| 10-12 | Create screenshots for high-traffic P3 locales | screenshots/{locale}/*.png |
| 12 | Localize demo video (subtitles or voiceover) for top 3 non-EN | video/{locale}/*.mp4 |

---

### 6.4 Cost and Time Estimates

**Per-locale localization costs:**

| Item | Internal Cost | Outsourced Cost | Time (Internal) | Time (Outsourced) |
|------|--------------|----------------|----------------|-------------------|
| CWS description (translate + adapt) | $0 (if team speaks language) | $80-150 per locale | 3-4 hours | 1-2 days turnaround |
| Short description (132 chars) | $0 | $15-25 per locale | 15 min | Same day |
| Screenshots (5) -- base capture | $0 | $0 (automated) | 30 min | N/A |
| Screenshots (5) -- overlay design | $0 (if designer on team) | $100-200 per locale | 90 min | 2-3 days |
| Small promo image (440x280) | $0 | $30-50 per locale | 30 min | 1-2 days |
| Large promo image (920x680) | $0 | $50-80 per locale | 45 min | 1-2 days |
| QA review (text fit, truncation) | $0 | $20-30 per locale | 30 min | Same day |
| **Total per locale** | **$0 (internal)** | **$295-535** | **~6-7 hours** | **~3-5 days** |

**Total P1 rollout (5 non-English locales):**

| Approach | Cost | Time |
|----------|------|------|
| Fully internal (team speaks all P1 languages) | $0 | 30-35 hours |
| Fully outsourced (professional localizers + designer) | $1,475-2,675 | 5-7 business days |
| Hybrid (internal descriptions, outsource design) | $500-1,000 | 2-3 weeks |

**Total P2 rollout (8 additional locales):**

| Approach | Cost | Time |
|----------|------|------|
| Fully internal | $0 | 48-56 hours |
| Fully outsourced | $2,360-4,280 | 7-10 business days |
| Hybrid | $800-1,600 | 3-4 weeks |

**Recommended approach:** Hybrid. Write descriptions internally (or use AI-assisted translation with native speaker review), outsource screenshot overlay design and promo images to a freelance designer on Fiverr/Upwork who specializes in Chrome Web Store assets.

---

### 6.5 Localization Quality Checklist

Before uploading localized assets to CWS, verify each item:

**Description quality:**
- [ ] Grammar and spelling checked by native speaker
- [ ] Keywords naturally integrated (not keyword-stuffed)
- [ ] Pricing matches the locale's PPP-adjusted price
- [ ] No English text remaining (except brand names: "Focus Mode", "Zovo", "Pro")
- [ ] Emoji usage matches local conventions (fewer for ja/de, more for es/pt-BR)
- [ ] Short description is under 132 characters
- [ ] All URLs are correct (support@zovo.one, etc.)
- [ ] Tags/keywords are locale-specific (not translations)

**Screenshot quality:**
- [ ] All UI text in screenshots matches the target locale
- [ ] Overlay text fits within the safe area (no truncation or overflow)
- [ ] Font rendering is correct for CJK (ja/ko/zh) and RTL (ar) scripts
- [ ] Numbers and pricing displayed in local format
- [ ] No text is cut off at 1280x800 resolution
- [ ] File size under 2 MB per image
- [ ] File format is PNG (preferred) or JPEG

**Promotional image quality:**
- [ ] Value proposition text is readable at thumbnail size
- [ ] Extension icon is clearly visible
- [ ] Text does not overlap with important UI elements
- [ ] Small promo is 440x280, large promo is 920x680
- [ ] Colors and branding match across all locales

**CWS Dashboard verification:**
- [ ] Correct locale selected in the dropdown
- [ ] Description uploaded under the correct locale tab
- [ ] Screenshots uploaded in the correct order (1-5)
- [ ] Promotional images uploaded to the correct slots
- [ ] Preview mode checked before publishing

---

### 6.6 Post-Launch Optimization

After initial localized listing publication, monitor these metrics per locale:

| Metric | Target | Measurement | Action if Below Target |
|--------|--------|-------------|----------------------|
| Impressions | +30% vs English-only | CWS Analytics | Review keyword targeting |
| Click-through rate | >3% | CWS Analytics | Improve screenshots/short description |
| Install rate (click to install) | >25% | CWS Analytics | Improve description/screenshots |
| Uninstall within 24h | <15% | CWS Analytics + internal | Review onboarding localization |
| Rating per locale | >4.3 stars | CWS Reviews | Investigate locale-specific issues |
| Pro conversion per locale | >2% | Stripe + internal | Adjust regional pricing |

**A/B testing per locale (quarterly):**

| Test | Locales | What to Vary | Duration |
|------|---------|-------------|----------|
| Short description | All P1 | Two variants per locale | 4 weeks |
| Screenshot 1 (hero) | es, pt-BR | Hook text variant | 4 weeks |
| Screenshot 5 (Pro) | de, fr | Price emphasis vs feature emphasis | 4 weeks |
| Promo image headline | All P1 | Two headline variants | 4 weeks |

---

### 6.7 Maintenance and Update Schedule

| Activity | Frequency | Trigger | Owner |
|----------|-----------|---------|-------|
| Update regional pricing | Quarterly | Currency fluctuations >10%, PPP data updates | Finance |
| Refresh CWS descriptions | Quarterly | New features, seasonal keywords, pricing changes | Marketing |
| Update screenshots | Per major release | UI changes that affect screenshot accuracy | Design |
| Add new P2/P3 locales | Monthly (during expansion) | User demand data, market opportunity | Marketing |
| Review keyword rankings | Monthly | CWS Analytics data | Marketing |
| Translate new features | Per release | Feature additions to Pro or Free tier | Localization |
| Update motivational quotes | Semi-annually | User feedback, seasonal relevance | Content |

---

## Appendix A: CWS Locale Codes Reference

Chrome Web Store uses its own locale code format (based on Chrome's locale codes). The following maps BCP 47 codes to CWS locale codes:

| Language | BCP 47 | CWS Locale Code | Notes |
|----------|--------|-----------------|-------|
| English | en | en | Default |
| English (US) | en-US | en_US | |
| English (UK) | en-GB | en_GB | |
| Spanish | es | es | Latin America default |
| Spanish (Spain) | es-ES | es | CWS uses generic 'es' |
| Spanish (Latin America) | es-419 | es_419 | Separate CWS locale |
| German | de | de | |
| French | fr | fr | |
| Portuguese (Brazil) | pt-BR | pt_BR | |
| Portuguese (Portugal) | pt-PT | pt_PT | |
| Japanese | ja | ja | |
| Korean | ko | ko | |
| Russian | ru | ru | |
| Arabic | ar | ar | |
| Chinese (Simplified) | zh-CN | zh_CN | |
| Chinese (Traditional) | zh-TW | zh_TW | |
| Polish | pl | pl | |
| Dutch | nl | nl | |
| Italian | it | it | |
| Turkish | tr | tr | |
| Thai | th | th | |
| Vietnamese | vi | vi | |
| Hindi | hi | hi | |
| Indonesian | id | id | |
| Czech | cs | cs | |
| Hungarian | hu | hu | |
| Romanian | ro | ro | |
| Ukrainian | uk | uk | |
| Hebrew | he | he | |

---

## Appendix B: Quick Reference -- Locale Priority Tiers

| Tier | Locales | Deadline | Full Description | Screenshots | Promo Images | Keywords |
|------|---------|----------|-----------------|-------------|-------------|----------|
| P1 | en, es, de, fr, pt_BR, ja | Launch | Yes | Yes (5 each) | Yes (2 each) | Yes |
| P2 | ko, ru, ar, zh_CN, pl, nl, it, tr | Launch + 4-6 weeks | Yes | Yes (5 each) | Yes (2 each) | Yes |
| P3 | hi, th, vi, id, cs, hu, ro, uk | Launch + 8-12 weeks | Yes | Top 3 only | Top 3 only | Yes |
| P4 | All other CWS locales | Launch + 6 months | Short desc only | No | No | Basic |

---

*End of document. Generated for Phase 15 (Internationalization System), Agent 3.*
