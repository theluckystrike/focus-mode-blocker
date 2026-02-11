# TRANSLATION WORKFLOW & RTL SUPPORT: Focus Mode - Blocker
## Agent 2 — String Extraction, DeepL API, Crowdin Integration, RTL Architecture, Bidi Text & Build Pipeline

> **Date:** February 11, 2026 | **Status:** Complete
> **Phase:** 15 — Internationalization System
> **Extension:** Focus Mode - Blocker (Chrome Web Store)
> **Brand:** Zovo (zovo.one)

---

## Table of Contents

1. [String Extraction Pipeline](#1-string-extraction-pipeline)
   1.1 [JavaScript Scanner](#11-javascript-scanner)
   1.2 [HTML Attribute Scanner](#12-html-attribute-scanner)
   1.3 [Manifest Scanner](#13-manifest-scanner)
   1.4 [Report Generation](#14-report-generation)
2. [DeepL API Integration](#2-deepl-api-integration)
   2.1 [Translation Script](#21-translation-script)
   2.2 [Brand Term Glossary](#22-brand-term-glossary)
   2.3 [Placeholder Preservation](#23-placeholder-preservation)
   2.4 [Translation Memory Cache](#24-translation-memory-cache)
   2.5 [Cost Estimation](#25-cost-estimation)
3. [Crowdin Integration](#3-crowdin-integration)
   3.1 [Project Configuration](#31-project-configuration)
   3.2 [Locale Code Mapping](#32-locale-code-mapping)
   3.3 [Approval Workflows](#33-approval-workflows)
   3.4 [Sync Automation](#34-sync-automation)
4. [RTL Support Architecture](#4-rtl-support-architecture)
   4.1 [CSS Logical Properties Migration](#41-css-logical-properties-migration)
   4.2 [RTLManager Class](#42-rtlmanager-class)
   4.3 [Icon Mirroring Rules](#43-icon-mirroring-rules)
   4.4 [Flexbox and Grid RTL](#44-flexbox-and-grid-rtl)
   4.5 [Popup RTL Layout](#45-popup-rtl-layout)
   4.6 [Options Page RTL Layout](#46-options-page-rtl-layout)
   4.7 [Block Page RTL Layout](#47-block-page-rtl-layout)
5. [Bidirectional Text Handling](#5-bidirectional-text-handling)
   5.1 [Unicode Control Characters](#51-unicode-control-characters)
   5.2 [Mixed Direction Content](#52-mixed-direction-content)
   5.3 [User-Generated Content](#53-user-generated-content)
   5.4 [HTML and CSS Bidi](#54-html-and-css-bidi)
6. [Build Pipeline Integration](#6-build-pipeline-integration)
   6.1 [Webpack Locale Copying](#61-webpack-locale-copying)
   6.2 [CI Validation](#62-ci-validation)
   6.3 [Development Locale Switching](#63-development-locale-switching)
7. [Translation QA Checklist](#7-translation-qa-checklist)

---

## 1. String Extraction Pipeline

### 1.1 JavaScript Scanner

The extraction script scans all source files to identify hardcoded user-facing strings and outputs an inventory with suggested message keys.

```javascript
// scripts/extract-strings.js
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.resolve(__dirname, '../src');
const MANIFEST_PATH = path.resolve(__dirname, '../public/manifest.json');
const MESSAGES_PATH = path.resolve(__dirname, '../public/_locales/en/messages.json');

const PATTERNS = {
  // chrome.i18n.getMessage('key') — already externalized
  getMessage: /chrome\.i18n\.getMessage\(['"]([^'"]+)['"](?:\s*,\s*\[([^\]]*)\])?\)/g,

  // textContent assignments: el.textContent = 'string'
  textContent: /\.textContent\s*=\s*['"]([^'"]{2,})['"]/g,

  // innerHTML assignments: el.innerHTML = 'string'
  innerHTML: /\.innerHTML\s*=\s*['"`]([^'"`]{2,})['"`]/g,

  // Template literals with user-visible text
  templateLiteral: /`([^`]*\$\{[^}]+\}[^`]*)`/g,

  // chrome.notifications.create
  notification: /chrome\.notifications\.create\([^{]*\{[^}]*(?:title|message)\s*:\s*['"]([^'"]+)['"]/g,

  // chrome.action.setBadgeText
  badgeText: /setBadgeText\(\s*\{\s*text\s*:\s*['"]([^'"]+)['"]/g,

  // alert() calls
  alert: /alert\(\s*['"]([^'"]+)['"]\s*\)/g,

  // placeholder attribute: placeholder="text"
  placeholder: /placeholder\s*=\s*['"]([^'"]{2,})['"]/g,

  // title attribute: title="text"
  titleAttr: /title\s*=\s*['"]([^'"]{2,})['"]/g,
};

const CATEGORIES = {
  popup: { pattern: /src\/popup/, prefix: 'popup_' },
  options: { pattern: /src\/options/, prefix: 'options_' },
  background: { pattern: /src\/background/, prefix: 'bg_' },
  content: { pattern: /src\/content/, prefix: 'block_' },
  shared: { pattern: /src\/shared/, prefix: 'common_' },
};

function getCategory(filePath) {
  for (const [name, config] of Object.entries(CATEGORIES)) {
    if (config.pattern.test(filePath)) return name;
  }
  return 'unknown';
}

function suggestKey(category, text) {
  const prefix = CATEGORIES[category]?.prefix || 'misc_';
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .substring(0, 40);
  return `${prefix}${slug}`;
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const results = [];
  const category = getCategory(filePath);

  for (const [type, pattern] of Object.entries(PATTERNS)) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(content)) !== null) {
      const text = match[1];
      const lineNumber = content.substring(0, match.index).split('\n').length;

      results.push({
        file: path.relative(SRC_DIR, filePath),
        line: lineNumber,
        type,
        text,
        category,
        suggestedKey: type === 'getMessage' ? text : suggestKey(category, text),
        externalized: type === 'getMessage',
      });
    }
  }

  return results;
}

function scanDirectory(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      results.push(...scanDirectory(fullPath));
    } else if (entry.isFile() && /\.(js|ts|jsx|tsx)$/.test(entry.name)) {
      results.push(...scanFile(fullPath));
    }
  }

  return results;
}

function loadExistingMessages() {
  if (!fs.existsSync(MESSAGES_PATH)) return {};
  return JSON.parse(fs.readFileSync(MESSAGES_PATH, 'utf8'));
}

function generateReport(results) {
  const existing = loadExistingMessages();
  const externalized = results.filter(r => r.externalized);
  const hardcoded = results.filter(r => !r.externalized);
  const missingKeys = externalized.filter(r => !existing[r.text]);

  const report = {
    summary: {
      totalStrings: results.length,
      externalized: externalized.length,
      hardcoded: hardcoded.length,
      missingInMessages: missingKeys.length,
      existingMessages: Object.keys(existing).length,
    },
    byCategory: {},
    byType: {},
    hardcodedStrings: hardcoded.map(r => ({
      file: r.file,
      line: r.line,
      text: r.text,
      suggestedKey: r.suggestedKey,
      type: r.type,
    })),
    missingKeys: missingKeys.map(r => r.text),
  };

  // Group by category
  for (const r of results) {
    if (!report.byCategory[r.category]) {
      report.byCategory[r.category] = { total: 0, externalized: 0, hardcoded: 0 };
    }
    report.byCategory[r.category].total++;
    report.byCategory[r.category][r.externalized ? 'externalized' : 'hardcoded']++;
  }

  // Group by type
  for (const r of results) {
    report.byType[r.type] = (report.byType[r.type] || 0) + 1;
  }

  return report;
}

// Main execution
const results = scanDirectory(SRC_DIR);
const report = generateReport(results);

console.log('\n=== String Extraction Report ===\n');
console.log(`Total strings found: ${report.summary.totalStrings}`);
console.log(`Already externalized: ${report.summary.externalized}`);
console.log(`Hardcoded (need extraction): ${report.summary.hardcoded}`);
console.log(`Keys missing from messages.json: ${report.summary.missingInMessages}`);
console.log(`Existing message entries: ${report.summary.existingMessages}`);

console.log('\n--- By Category ---');
for (const [cat, data] of Object.entries(report.byCategory)) {
  console.log(`  ${cat}: ${data.total} total (${data.externalized} ext, ${data.hardcoded} hardcoded)`);
}

console.log('\n--- By Type ---');
for (const [type, count] of Object.entries(report.byType)) {
  console.log(`  ${type}: ${count}`);
}

if (report.hardcodedStrings.length > 0) {
  console.log(`\n--- Hardcoded Strings (${report.hardcodedStrings.length}) ---`);
  for (const s of report.hardcodedStrings.slice(0, 20)) {
    console.log(`  ${s.file}:${s.line} [${s.type}] "${s.text}" → ${s.suggestedKey}`);
  }
  if (report.hardcodedStrings.length > 20) {
    console.log(`  ... and ${report.hardcodedStrings.length - 20} more`);
  }
}

// Write full report to JSON
const reportPath = path.resolve(__dirname, '../reports/string-extraction.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\nFull report saved to: ${reportPath}`);
```

### 1.2 HTML Attribute Scanner

```javascript
// Integrated into extract-strings.js — HTML file scanning

const HTML_PATTERNS = {
  dataI18n: /data-i18n(?:-\w+)?=['"]([^'"]+)['"]/g,
  placeholder: /placeholder=['"]([^'"]{2,})['"]/g,
  title: /title=['"]([^'"]{2,})['"]/g,
  ariaLabel: /aria-label=['"]([^'"]{2,})['"]/g,
  altText: /alt=['"]([^'"]{2,})['"]/g,
};

function scanHTMLFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const results = [];

  for (const [type, pattern] of Object.entries(HTML_PATTERNS)) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(content)) !== null) {
      const text = match[1];
      const lineNumber = content.substring(0, match.index).split('\n').length;
      results.push({
        file: path.relative(SRC_DIR, filePath),
        line: lineNumber,
        type: `html_${type}`,
        text,
        externalized: type === 'dataI18n',
      });
    }
  }

  return results;
}
```

### 1.3 Manifest Scanner

```javascript
// Scan manifest.json for __MSG_ patterns

function scanManifest() {
  const content = fs.readFileSync(MANIFEST_PATH, 'utf8');
  const results = [];
  const pattern = /__MSG_(\w+)__/g;
  let match;

  while ((match = pattern.exec(content)) !== null) {
    results.push({
      file: 'manifest.json',
      line: content.substring(0, match.index).split('\n').length,
      type: 'manifest_msg',
      text: match[1],
      externalized: true,
    });
  }

  return results;
}
```

### 1.4 Report Generation

The report outputs:

| Field | Description |
|-------|-------------|
| `totalStrings` | All user-visible strings found in source |
| `externalized` | Strings already using `chrome.i18n.getMessage()` |
| `hardcoded` | Strings that need extraction to messages.json |
| `missingInMessages` | Keys referenced in code but not in messages.json |
| `byCategory` | Breakdown by UI surface (popup, options, etc.) |
| `byType` | Breakdown by detection pattern type |
| `hardcodedStrings` | Full list with file, line, suggested key |

Run with: `node scripts/extract-strings.js`

---

## 2. DeepL API Integration

### 2.1 Translation Script

```javascript
// scripts/translate.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const LOCALES_DIR = path.resolve(__dirname, '../public/_locales');
const CACHE_DIR = path.resolve(__dirname, '../.translation-cache');
const GLOSSARY_PATH = path.resolve(__dirname, 'glossary.json');

// Brand terms that must never be translated
const BRAND_TERMS = ['Focus Mode', 'Focus Score', 'Nuclear Mode', 'Zovo', 'Pro'];

// DeepL language code mapping (Chrome locale → DeepL target)
const DEEPL_LANG_MAP = {
  'es': 'ES',
  'de': 'DE',
  'fr': 'FR',
  'ja': 'JA',
  'pt_BR': 'PT-BR',
  'ko': 'KO',
  'zh_CN': 'ZH',
  'it': 'IT',
  'ru': 'RU',
  'nl': 'NL',
  'pl': 'PL',
  'ar': 'AR',
};

class DeepLTranslator {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api-free.deepl.com/v2';
    this.glossaryId = null;
    this.requestCount = 0;
    this.charCount = 0;
  }

  async translate(text, targetLang) {
    const response = await fetch(`${this.baseURL}/translate`, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: [text],
        source_lang: 'EN',
        target_lang: DEEPL_LANG_MAP[targetLang] || targetLang.toUpperCase(),
        preserve_formatting: true,
        glossary_id: this.glossaryId || undefined,
        tag_handling: 'xml',
        ignore_tags: ['x'],
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepL API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    this.requestCount++;
    this.charCount += text.length;
    return data.translations[0].text;
  }

  async createGlossary(targetLang) {
    const entries = BRAND_TERMS.map(term => `${term}\t${term}`).join('\n');

    const response = await fetch(`${this.baseURL}/glossaries`, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `focus-mode-${targetLang}`,
        source_lang: 'EN',
        target_lang: DEEPL_LANG_MAP[targetLang] || targetLang.toUpperCase(),
        entries,
        entries_format: 'tsv',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      this.glossaryId = data.glossary_id;
      console.log(`Glossary created: ${data.glossary_id} for ${targetLang}`);
    }
  }
}

// Placeholder protection
function protectPlaceholders(text) {
  const protected_ = [];
  let index = 0;

  // Protect named placeholders: $WORD$
  let result = text.replace(/\$[A-Z_]+\$/g, (match) => {
    protected_.push(match);
    return `<x id="${index++}"/>`;
  });

  // Protect positional placeholders: $1, $2
  result = result.replace(/\$\d+/g, (match) => {
    protected_.push(match);
    return `<x id="${index++}"/>`;
  });

  return { text: result, placeholders: protected_ };
}

function restorePlaceholders(text, placeholders) {
  let result = text;
  placeholders.forEach((ph, i) => {
    result = result.replace(`<x id="${i}"/>`, ph);
    // Also handle cases where DeepL modifies the XML slightly
    result = result.replace(`<x id="${i}" />`, ph);
    result = result.replace(`<x id="${i}">`, ph);
  });
  return result;
}

// Translation memory cache
function getCacheKey(text, targetLang) {
  const hash = crypto.createHash('md5').update(`${text}:${targetLang}`).digest('hex');
  return hash;
}

function getFromCache(text, targetLang) {
  const key = getCacheKey(text, targetLang);
  const cachePath = path.join(CACHE_DIR, targetLang, `${key}.json`);
  if (fs.existsSync(cachePath)) {
    const cached = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    if (cached.source === text) return cached.translation;
  }
  return null;
}

function saveToCache(text, targetLang, translation) {
  const key = getCacheKey(text, targetLang);
  const cacheDir = path.join(CACHE_DIR, targetLang);
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(
    path.join(cacheDir, `${key}.json`),
    JSON.stringify({ source: text, translation, timestamp: Date.now() })
  );
}

// Main translation function
async function translateMessages(sourceLang, targetLang) {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) {
    console.error('Error: DEEPL_API_KEY environment variable not set');
    process.exit(1);
  }

  const translator = new DeepLTranslator(apiKey);

  // Create glossary for brand term protection
  await translator.createGlossary(targetLang);

  // Load source messages
  const sourcePath = path.join(LOCALES_DIR, sourceLang, 'messages.json');
  const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

  // Load existing target (if any)
  const targetPath = path.join(LOCALES_DIR, targetLang, 'messages.json');
  let target = {};
  if (fs.existsSync(targetPath)) {
    target = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
  }

  let translated = 0;
  let cached = 0;
  let skipped = 0;

  for (const [key, value] of Object.entries(source)) {
    // Skip metadata keys
    if (key.startsWith('_')) continue;

    // Skip if already translated
    if (target[key]?.message && target[key].message !== value.message) {
      skipped++;
      continue;
    }

    const sourceText = value.message;

    // Check cache first
    const cachedTranslation = getFromCache(sourceText, targetLang);
    if (cachedTranslation) {
      target[key] = { ...value, message: cachedTranslation };
      cached++;
      continue;
    }

    // Protect placeholders before translation
    const { text: protectedText, placeholders } = protectPlaceholders(sourceText);

    try {
      const translatedText = await translator.translate(protectedText, targetLang);
      const finalText = restorePlaceholders(translatedText, placeholders);

      target[key] = {
        message: finalText,
        description: value.description,
      };

      // Preserve placeholder definitions
      if (value.placeholders) {
        target[key].placeholders = value.placeholders;
      }

      // Cache the translation
      saveToCache(sourceText, targetLang, finalText);
      translated++;

      // Rate limiting: 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (err) {
      console.error(`Error translating ${key}: ${err.message}`);
      target[key] = { ...value }; // Keep English as fallback
    }
  }

  // Write output
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, JSON.stringify(target, null, 2));

  console.log(`\n=== Translation Complete: ${sourceLang} → ${targetLang} ===`);
  console.log(`Translated: ${translated}`);
  console.log(`From cache: ${cached}`);
  console.log(`Skipped (existing): ${skipped}`);
  console.log(`Total API requests: ${translator.requestCount}`);
  console.log(`Total characters: ${translator.charCount}`);
  console.log(`Estimated cost: $${(translator.charCount / 1000000 * 20).toFixed(2)}`);
  console.log(`Output: ${targetPath}`);
}

// CLI
const [,, source = 'en', target, engine = 'deepl'] = process.argv;

if (!target) {
  console.log('Usage: node scripts/translate.js <source> <target> [engine]');
  console.log('Example: node scripts/translate.js en es deepl');
  console.log('\nAvailable targets:', Object.keys(DEEPL_LANG_MAP).join(', '));
  process.exit(0);
}

translateMessages(source, target);
```

### 2.2 Brand Term Glossary

```json
// scripts/glossary.json
{
  "terms": [
    { "source": "Focus Mode", "target": "Focus Mode", "note": "Product name — never translate" },
    { "source": "Focus Score", "target": "Focus Score", "note": "Gamification metric — never translate" },
    { "source": "Nuclear Mode", "target": "Nuclear Mode", "note": "Feature name — never translate" },
    { "source": "Zovo", "target": "Zovo", "note": "Company name — never translate" },
    { "source": "Pro", "target": "Pro", "note": "Tier name — never translate" }
  ]
}
```

### 2.3 Placeholder Preservation

The translation script uses XML tag wrapping to protect placeholders:

1. **Before translation:** `"$COUNT$ sites blocked"` → `"<x id="0"/> sites blocked"`
2. **DeepL translates** with `tag_handling: 'xml'` and `ignore_tags: ['x']`
3. **After translation:** `"<x id="0"/> sitios bloqueados"` → `"$COUNT$ sitios bloqueados"`

This preserves both named (`$WORD$`) and positional (`$1`) placeholders.

### 2.4 Translation Memory Cache

The cache uses MD5 hashes of `text:targetLang` as filenames:

```
.translation-cache/
├── es/
│   ├── a1b2c3d4e5.json    ← { source, translation, timestamp }
│   └── f6g7h8i9j0.json
├── de/
│   └── ...
└── ja/
    └── ...
```

Benefits:
- Avoids re-translating unchanged strings across runs
- Reduces API costs during iterative development
- Can be committed to git for team sharing

### 2.5 Cost Estimation

DeepL API Free: 500,000 chars/month
DeepL API Pro: $20/million chars

| Locale | Est. Characters | Est. Cost (Pro) |
|--------|----------------|-----------------|
| Spanish | ~12,000 | $0.24 |
| German | ~12,000 | $0.24 |
| Japanese | ~12,000 | $0.24 |
| French | ~12,000 | $0.24 |
| Portuguese-BR | ~12,000 | $0.24 |
| **All P1 locales** | **~60,000** | **$1.20** |
| All P2 locales (4) | ~48,000 | $0.96 |
| **Total (9 locales)** | **~108,000** | **$2.16** |

The entire extension can be machine-translated to all 9 initial locales for under $3.

---

## 3. Crowdin Integration

### 3.1 Project Configuration

```yaml
# crowdin.yml
project_id_env: CROWDIN_PROJECT_ID
api_token_env: CROWDIN_API_TOKEN
preserve_hierarchy: true
base_path: "."

files:
  - source: /public/_locales/en/messages.json
    translation: /public/_locales/%osx_locale%/messages.json
    type: chrome_extension_json
    update_option: update_as_unapproved
    cleanup_mode: true

    # Context for translators
    labels:
      - chrome-extension
      - focus-mode

# Locale mapping (Chrome codes ↔ Crowdin codes)
languages_mapping:
  osx_locale:
    zh-CN: zh_CN
    zh-TW: zh_TW
    pt-BR: pt_BR
    es-419: es_419
```

### 3.2 Locale Code Mapping

| Chrome Code | Crowdin Code | Language |
|-------------|-------------|----------|
| en | en | English (base) |
| es | es-ES | Spanish |
| de | de | German |
| fr | fr | French |
| ja | ja | Japanese |
| pt_BR | pt-BR | Brazilian Portuguese |
| ko | ko | Korean |
| zh_CN | zh-CN | Chinese Simplified |
| it | it | Italian |
| ru | ru | Russian |
| ar | ar | Arabic |
| he | he | Hebrew |
| hi | hi | Hindi |
| th | th | Thai |

### 3.3 Approval Workflows

```
1. Source strings uploaded from en/messages.json
   ↓
2. Machine translation (DeepL) creates initial drafts
   ↓
3. Community translators review and correct
   ↓
4. Proofreaders (native speakers) approve
   ↓
5. Maintainer final review
   ↓
6. Download approved translations → PR → merge
```

**Roles:**
- **Translator**: Can suggest translations, vote on alternatives
- **Proofreader**: Native speaker who approves final translations
- **Manager**: Reviews and triggers downloads, manages glossary

**Rules:**
- Minimum 2 votes on a translation before proofreader review
- Brand terms in glossary are auto-blocked from translation
- Context screenshots attached to string groups (popup, options, etc.)
- `"description"` field from messages.json shown as translator context

### 3.4 Sync Automation

```javascript
// scripts/crowdin-sync.js
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function uploadSources() {
  console.log('Uploading source strings to Crowdin...');
  const { stdout, stderr } = await execAsync('crowdin upload sources --config crowdin.yml');
  console.log(stdout);
  if (stderr) console.error(stderr);
}

async function downloadTranslations() {
  console.log('Downloading approved translations...');
  const { stdout, stderr } = await execAsync('crowdin download --config crowdin.yml');
  console.log(stdout);
  if (stderr) console.error(stderr);
}

async function getProgress() {
  console.log('Fetching translation progress...');
  const { stdout } = await execAsync('crowdin status --config crowdin.yml');
  console.log(stdout);
}

async function uploadGlossary() {
  console.log('Uploading glossary...');
  const { stdout } = await execAsync(
    'crowdin glossary upload scripts/glossary.csv --config crowdin.yml'
  );
  console.log(stdout);
}

// CLI
const command = process.argv[2] || 'status';
const commands = {
  upload: uploadSources,
  download: downloadTranslations,
  status: getProgress,
  glossary: uploadGlossary,
  sync: async () => { await uploadSources(); await downloadTranslations(); },
};

if (commands[command]) {
  commands[command]().catch(console.error);
} else {
  console.log('Usage: node scripts/crowdin-sync.js [upload|download|status|glossary|sync]');
}
```

---

## 4. RTL Support Architecture

### 4.1 CSS Logical Properties Migration

Every physical directional property must be replaced with its logical equivalent:

#### Full Migration Table

| Physical (LTR-only) | Logical (LTR + RTL) | Notes |
|---------------------|---------------------|-------|
| `margin-left: 1rem` | `margin-inline-start: 1rem` | Start edge |
| `margin-right: 1rem` | `margin-inline-end: 1rem` | End edge |
| `padding-left: 1rem` | `padding-inline-start: 1rem` | Start edge |
| `padding-right: 1rem` | `padding-inline-end: 1rem` | End edge |
| `text-align: left` | `text-align: start` | Content alignment |
| `text-align: right` | `text-align: end` | Content alignment |
| `float: left` | `float: inline-start` | Float direction |
| `float: right` | `float: inline-end` | Float direction |
| `left: 0` | `inset-inline-start: 0` | Positioning |
| `right: 0` | `inset-inline-end: 0` | Positioning |
| `border-left: 2px solid` | `border-inline-start: 2px solid` | Border |
| `border-right: 2px solid` | `border-inline-end: 2px solid` | Border |
| `border-radius: 4px 0 0 4px` | `border-start-start-radius: 4px; border-end-start-radius: 4px` | Corners |
| `width` | `inline-size` | Inline axis size |
| `height` | `block-size` | Block axis size |
| `min-width` | `min-inline-size` | Min inline |
| `max-width` | `max-inline-size` | Max inline |
| `top` | `inset-block-start` | Block start |
| `bottom` | `inset-block-end` | Block end |

#### Before and After Examples

```css
/* BEFORE — Physical properties (LTR only) */
.sidebar {
  position: absolute;
  left: 0;
  width: 240px;
  padding-left: 16px;
  padding-right: 8px;
  border-right: 1px solid #333;
  text-align: left;
}

.sidebar .icon {
  margin-right: 8px;
  float: left;
}

/* AFTER — Logical properties (LTR + RTL) */
.sidebar {
  position: absolute;
  inset-inline-start: 0;
  inline-size: 240px;
  padding-inline-start: 16px;
  padding-inline-end: 8px;
  border-inline-end: 1px solid #333;
  text-align: start;
}

.sidebar .icon {
  margin-inline-end: 8px;
  float: inline-start;
}
```

### 4.2 RTLManager Class

```javascript
/**
 * RTLManager — Direction detection and application for Focus Mode - Blocker
 *
 * Works with both main document and shadow DOM roots.
 */
class RTLManager {
  constructor() {
    this.isRTL = chrome.i18n.getMessage('@@bidi_dir') === 'rtl';
    this.dir = this.isRTL ? 'rtl' : 'ltr';
    this.startEdge = this.isRTL ? 'right' : 'left';
    this.endEdge = this.isRTL ? 'left' : 'right';
  }

  /**
   * Apply direction to a root element (document or shadow root)
   */
  apply(root = document) {
    if (root === document) {
      document.documentElement.dir = this.dir;
      document.documentElement.lang = chrome.i18n.getUILanguage();
      document.body.classList.toggle('rtl', this.isRTL);
      document.body.classList.toggle('ltr', !this.isRTL);
    } else {
      // Shadow DOM host
      const host = root.host || root;
      host.setAttribute('dir', this.dir);
      host.classList?.toggle('rtl', this.isRTL);
    }
  }

  /**
   * Get transform for directional icons
   */
  getIconTransform(shouldFlip) {
    if (!shouldFlip || !this.isRTL) return 'none';
    return 'scaleX(-1)';
  }

  /**
   * Get CSS custom properties for RTL-aware styles
   */
  getCSSProperties() {
    return {
      '--dir': this.dir,
      '--start': this.startEdge,
      '--end': this.endEdge,
      '--dir-multiplier': this.isRTL ? '-1' : '1',
    };
  }
}

export { RTLManager };
```

### 4.3 Icon Mirroring Rules

| Icon Type | Mirror in RTL? | Examples |
|-----------|---------------|----------|
| **Directional arrows** | ✅ Yes | Back arrow, forward arrow, expand/collapse |
| **Progress indicators** | ✅ Yes | Progress bars, step indicators |
| **Text alignment** | ✅ Yes | Align left/right icons |
| **Navigation** | ✅ Yes | Sidebar toggle, menu hamburger with arrow |
| **Checkmarks** | ❌ No | Universal symbol |
| **Plus/minus** | ❌ No | Universal symbol |
| **Close (X)** | ❌ No | Universal symbol |
| **Search magnifier** | ❌ No | Universal symbol |
| **Clock/timer** | ❌ No | Universal display |
| **Shield** | ❌ No | Security icon |
| **Star/heart** | ❌ No | Universal symbol |
| **Settings gear** | ❌ No | Universal symbol |
| **Lock** | ❌ No | Universal symbol |
| **Sound/volume** | ❌ No | Universal symbol |
| **Fire/streak** | ❌ No | Universal symbol |

```css
/* Icons that flip in RTL */
[dir="rtl"] .icon-arrow-back,
[dir="rtl"] .icon-arrow-forward,
[dir="rtl"] .icon-chevron-right,
[dir="rtl"] .icon-chevron-left,
[dir="rtl"] .icon-expand,
[dir="rtl"] .icon-progress {
  transform: scaleX(-1);
}

/* Icons that NEVER flip (explicitly kept for clarity) */
.icon-check,
.icon-close,
.icon-search,
.icon-clock,
.icon-shield,
.icon-star,
.icon-settings,
.icon-lock,
.icon-sound,
.icon-fire {
  /* No transform — universal symbols */
}
```

### 4.4 Flexbox and Grid RTL

Flexbox `row` direction automatically reverses in RTL contexts:

```css
/* Flexbox automatically respects dir attribute */
.row {
  display: flex;
  flex-direction: row; /* Reverses in RTL */
  gap: 8px;
}

/* Grid also respects direction */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  /* Grid items flow right-to-left in RTL */
}

/* row-reverse keeps its meaning relative to direction */
.row-reverse {
  flex-direction: row-reverse; /* Also reverses relative to dir */
}
```

### 4.5 Popup RTL Layout

```css
/* popup.css — RTL adaptations */

/* Header */
.popup-header {
  display: flex;
  align-items: center;
  gap: 8px;
  /* Flexbox auto-reverses in RTL */
}

/* Timer display — centered, no RTL changes needed */
.timer-display {
  text-align: center;
  font-variant-numeric: tabular-nums; /* Consistent number width */
  direction: ltr; /* Numbers always LTR */
}

/* Blocklist items */
.blocklist-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-inline: 12px;
  border-inline-start: 3px solid var(--accent);
}

.blocklist-item .remove-btn {
  margin-inline-start: auto; /* Push to end in both directions */
}

/* Stats grid */
.stats-grid .stat-value {
  font-variant-numeric: tabular-nums;
  direction: ltr; /* Numbers always LTR */
}
```

### 4.6 Options Page RTL Layout

```css
/* options.css — RTL adaptations */

/* Sidebar navigation */
.options-nav {
  inset-inline-start: 0;
  border-inline-end: 1px solid var(--border);
  padding-inline: 16px;
}

.options-nav .nav-item {
  text-align: start;
  padding-inline-start: 12px;
}

.options-nav .nav-item .icon {
  margin-inline-end: 8px;
}

/* Settings rows */
.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-inline: 16px;
}

.setting-row .label {
  text-align: start;
}

.setting-row .toggle {
  margin-inline-start: auto;
}

/* Form inputs */
.input-group {
  text-align: start;
}

.input-group .input-addon-start {
  border-inline-end: 1px solid var(--border);
  border-start-start-radius: 4px;
  border-end-start-radius: 4px;
}

.input-group .input-addon-end {
  border-inline-start: 1px solid var(--border);
  border-start-end-radius: 4px;
  border-end-end-radius: 4px;
}
```

### 4.7 Block Page RTL Layout

```css
/* block-page.css — RTL adaptations */

/* Block page is centered, minimal RTL changes needed */
.block-page {
  text-align: center;
  /* Most content is centered — RTL doesn't affect centering */
}

/* Stats row */
.block-stats {
  display: flex;
  justify-content: center;
  gap: 24px;
  /* Flexbox auto-reverses order in RTL */
}

/* Emergency unlock section */
.emergency-section {
  text-align: start;
  padding-inline: 16px;
  border-inline-start: 3px solid var(--warning);
}

/* Quote display */
.quote-text {
  text-align: center;
  font-style: italic;
  direction: auto; /* Let browser determine based on content */
}
```

---

## 5. Bidirectional Text Handling

### 5.1 Unicode Control Characters

| Character | Code | Name | Usage |
|-----------|------|------|-------|
| LRM | `\u200E` | Left-to-Right Mark | Force LTR for mixed content |
| RLM | `\u200F` | Right-to-Left Mark | Force RTL for mixed content |
| LRE | `\u202A` | Left-to-Right Embedding | Start LTR block |
| RLE | `\u202B` | Right-to-Left Embedding | Start RTL block |
| PDF | `\u202C` | Pop Directional Formatting | End embedding |
| LRI | `\u2066` | Left-to-Right Isolate | Isolate LTR content (preferred) |
| RLI | `\u2067` | Right-to-Left Isolate | Isolate RTL content (preferred) |
| FSI | `\u2068` | First Strong Isolate | Auto-detect direction |
| PDI | `\u2069` | Pop Directional Isolate | End isolation |

**Best practice**: Use isolates (LRI/RLI/FSI + PDI) over embeddings (LRE/RLE + PDF).

### 5.2 Mixed Direction Content

```javascript
// bidi-utils.js

/**
 * Wrap text that may have opposite-direction content
 */
function isolateText(text) {
  return `\u2068${text}\u2069`; // FSI + PDI
}

/**
 * Force LTR for URLs, emails, code, numbers
 */
function forceLTR(text) {
  return `\u2066${text}\u2069`; // LRI + PDI
}

/**
 * Format a blocked site URL in RTL context
 * URLs are always LTR, even in RTL interfaces
 */
function formatBlockedSite(site) {
  return forceLTR(site);
}

// Usage in RTL context:
// "facebook.com تم حظره" (facebook.com is blocked)
// Without isolation: "مت حظره facebook.com" (wrong direction mixing)
// With isolation: "facebook.com تم حظره" (correct)
```

### 5.3 User-Generated Content

```javascript
// For user-entered URLs in the blocklist input
function formatUserInput(input) {
  // URLs, emails, and technical strings are always LTR
  if (/^https?:\/\/|^\S+\.\S+|^\S+@\S+/.test(input)) {
    return forceLTR(input);
  }
  // Let browser auto-detect for other content
  return isolateText(input);
}
```

### 5.4 HTML and CSS Bidi

```html
<!-- Use <bdi> for user content in RTL context -->
<p>
  <span data-i18n="block_page_subtitle"></span>
  <bdi class="blocked-domain">facebook.com</bdi>
</p>

<!-- Use dir="auto" for mixed-content containers -->
<input type="text" dir="auto" data-i18n-placeholder="popup_blocklist_add_site">

<!-- Force LTR for technical values -->
<span dir="ltr" class="timer">24:37</span>
<span dir="ltr" class="url">facebook.com</span>
<span dir="ltr" class="version">v1.0.0</span>
```

```css
/* CSS bidi property for inline elements */
.blocked-domain {
  unicode-bidi: isolate;
}

/* Technical values always LTR */
.timer-value,
.url-value,
.version-value,
.numeric-value {
  direction: ltr;
  unicode-bidi: isolate;
}
```

---

## 6. Build Pipeline Integration

### 6.1 Webpack Locale Copying

```javascript
// webpack.config.js additions
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
  // ... existing config
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: 'public/_locales',
          to: '_locales',
          globOptions: {
            ignore: ['**/qps/**'], // Exclude pseudo-locale from production
          },
        },
      ],
    }),
  ],
};
```

### 6.2 CI Validation

```javascript
// scripts/validate-locales.js
const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.resolve(__dirname, '../public/_locales');
const BASE_LOCALE = 'en';

function validate() {
  const errors = [];
  const warnings = [];

  // Load base messages
  const basePath = path.join(LOCALES_DIR, BASE_LOCALE, 'messages.json');
  const baseMessages = JSON.parse(fs.readFileSync(basePath, 'utf8'));
  const baseKeys = Object.keys(baseMessages);

  // Get all locale directories
  const locales = fs.readdirSync(LOCALES_DIR)
    .filter(f => f !== BASE_LOCALE && f !== 'qps')
    .filter(f => fs.statSync(path.join(LOCALES_DIR, f)).isDirectory());

  for (const locale of locales) {
    const localePath = path.join(LOCALES_DIR, locale, 'messages.json');

    // 1. JSON syntax check
    let messages;
    try {
      const content = fs.readFileSync(localePath, 'utf8');
      messages = JSON.parse(content);
    } catch (e) {
      errors.push(`${locale}: Invalid JSON — ${e.message}`);
      continue;
    }

    const localeKeys = Object.keys(messages);

    // 2. Missing keys
    const missing = baseKeys.filter(k => !messages[k]);
    if (missing.length > 0) {
      warnings.push(`${locale}: ${missing.length} missing keys — ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '...' : ''}`);
    }

    // 3. Extra keys (not in base)
    const extra = localeKeys.filter(k => !baseMessages[k]);
    if (extra.length > 0) {
      warnings.push(`${locale}: ${extra.length} extra keys — ${extra.slice(0, 3).join(', ')}`);
    }

    // 4. Empty messages
    const empty = localeKeys.filter(k => messages[k] && !messages[k].message);
    if (empty.length > 0) {
      errors.push(`${locale}: ${empty.length} empty messages — ${empty.join(', ')}`);
    }

    // 5. Placeholder integrity
    for (const key of baseKeys) {
      if (!messages[key]) continue;
      const basePlaceholders = (baseMessages[key].message.match(/\$[A-Z_]+\$|\$\d+/g) || []).sort();
      const localePlaceholders = (messages[key].message.match(/\$[A-Z_]+\$|\$\d+/g) || []).sort();

      if (JSON.stringify(basePlaceholders) !== JSON.stringify(localePlaceholders)) {
        errors.push(`${locale}/${key}: Placeholder mismatch — base: [${basePlaceholders}], locale: [${localePlaceholders}]`);
      }
    }

    // 6. String length warnings (>200% of English)
    for (const key of baseKeys) {
      if (!messages[key]) continue;
      const ratio = messages[key].message.length / baseMessages[key].message.length;
      if (ratio > 2.0 && baseMessages[key].message.length > 10) {
        warnings.push(`${locale}/${key}: Translation is ${Math.round(ratio * 100)}% of English length`);
      }
    }

    // 7. Coverage percentage
    const coverage = Math.round(((baseKeys.length - missing.length) / baseKeys.length) * 100);
    console.log(`  ${locale}: ${coverage}% coverage (${baseKeys.length - missing.length}/${baseKeys.length})`);
  }

  // Report
  console.log('\n=== Validation Results ===');
  if (errors.length > 0) {
    console.error(`\n❌ ${errors.length} ERRORS:`);
    errors.forEach(e => console.error(`  ${e}`));
  }
  if (warnings.length > 0) {
    console.warn(`\n⚠️  ${warnings.length} WARNINGS:`);
    warnings.forEach(w => console.warn(`  ${w}`));
  }
  if (errors.length === 0 && warnings.length === 0) {
    console.log('\n✅ All locales valid!');
  }

  // Exit with error code if any errors
  process.exit(errors.length > 0 ? 1 : 0);
}

validate();
```

**GitHub Actions integration:**

```yaml
# .github/workflows/i18n-validate.yml
name: Validate Translations
on:
  push:
    paths: ['public/_locales/**']
  pull_request:
    paths: ['public/_locales/**']

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: node scripts/validate-locales.js
```

### 6.3 Development Locale Switching

```javascript
// For development: test different locales without changing browser language
// This overrides chrome.i18n.getMessage in dev builds

if (process.env.NODE_ENV === 'development') {
  const DEV_LOCALE = localStorage.getItem('dev-locale');

  if (DEV_LOCALE && DEV_LOCALE !== 'en') {
    const originalGetMessage = chrome.i18n.getMessage;
    let devMessages = null;

    // Load dev locale messages
    fetch(chrome.runtime.getURL(`_locales/${DEV_LOCALE}/messages.json`))
      .then(r => r.json())
      .then(messages => { devMessages = messages; })
      .catch(() => { /* Fall back to original */ });

    chrome.i18n.getMessage = (key, substitutions) => {
      if (devMessages && devMessages[key]) {
        let msg = devMessages[key].message;
        if (substitutions) {
          const subs = Array.isArray(substitutions) ? substitutions : [substitutions];
          subs.forEach((sub, i) => {
            msg = msg.replace(`$${i + 1}`, sub);
            // Also replace named placeholders if defined
            if (devMessages[key].placeholders) {
              for (const [name, def] of Object.entries(devMessages[key].placeholders)) {
                if (def.content === `$${i + 1}`) {
                  msg = msg.replace(`$${name.toUpperCase()}$`, sub);
                }
              }
            }
          });
        }
        return msg;
      }
      return originalGetMessage(key, substitutions);
    };
  }
}

// Toggle dev locale from console:
// localStorage.setItem('dev-locale', 'ja'); location.reload();
// localStorage.removeItem('dev-locale'); location.reload();
```

---

## 7. Translation QA Checklist

### Pre-Translation Checklist (before sending to translators)

- [ ] All strings extracted to en/messages.json
- [ ] Every key has a `"description"` field explaining context
- [ ] Placeholders have `"example"` values
- [ ] Brand terms documented in glossary (Focus Mode, Focus Score, Nuclear Mode, Zovo, Pro)
- [ ] Context screenshots uploaded for each UI surface
- [ ] String freeze announced (no more English changes during translation)
- [ ] Character limits documented for constrained UI elements
- [ ] Plural forms identified and documented
- [ ] Date/number formatting uses Intl API (not hardcoded formats)

### Per-Locale Review Checklist

- [ ] JSON syntax valid (no trailing commas, correct escaping)
- [ ] All base locale keys present (no missing translations)
- [ ] No empty message values
- [ ] All placeholders preserved exactly ($COUNT$, $1, etc.)
- [ ] Placeholder order may differ but all present
- [ ] Brand terms not translated (Focus Mode, Focus Score, Nuclear Mode, Zovo, Pro)
- [ ] Register/formality appropriate (Sie vs du, vous vs tu, etc.)
- [ ] No machine translation artifacts ("translation unavailable", garbled text)
- [ ] Numbers formatted per locale convention (1,000 vs 1.000)
- [ ] Currency symbols in correct position ($9.99 vs 9,99 €)
- [ ] Date formats natural for locale (MM/DD vs DD/MM vs YYYY年MM月DD日)
- [ ] Text length within UI constraints (popup width, button width)
- [ ] Quotation marks use locale convention («» for French, „" for German, 「」for Japanese)
- [ ] Ellipsis uses proper character (… not ...)
- [ ] Abbreviations natural for the locale
- [ ] Motivational quotes culturally appropriate
- [ ] No offensive or insensitive translations
- [ ] Gender-neutral where applicable
- [ ] Technical terms consistent throughout (same term for "blocklist" everywhere)

### RTL-Specific Checklist (Arabic, Hebrew)

- [ ] Document direction set correctly (dir="rtl")
- [ ] CSS uses logical properties (no physical left/right)
- [ ] Icons that should mirror are flipped
- [ ] Icons that should NOT mirror are preserved
- [ ] Numbers display LTR within RTL context
- [ ] URLs display LTR within RTL context
- [ ] Timer display is LTR
- [ ] Progress bars flow right-to-left
- [ ] Navigation flows right-to-left
- [ ] Form labels align to the start edge
- [ ] Input fields respect text direction
- [ ] Scrollbars appear on correct side
- [ ] Popup layout doesn't break
- [ ] Options page sidebar on correct side
- [ ] Block page renders correctly

### Post-Translation Validation

- [ ] `node scripts/validate-locales.js` passes with zero errors
- [ ] Pseudo-locale test reveals no untranslated strings
- [ ] Visual regression tests pass for all locales
- [ ] Manual smoke test of each locale (popup, options, block page)
- [ ] Notification text reads naturally
- [ ] Chrome Web Store description reviewed by native speaker

---

*Phase 15, Agent 2 — Translation Workflow & RTL Support — Complete*
