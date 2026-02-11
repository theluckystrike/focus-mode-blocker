# PREVENTION AUTOMATION & MONITORING: Focus Mode - Blocker
## Agent 5 — Automated CWS Compliance, Monitoring & Templates

> **Date:** February 11, 2026 | **Phase:** 13 (Review Rejection Recovery)
> **Extension:** Focus Mode - Blocker v1.0.0 (Manifest V3)
> **Agent:** 5 of 5 — Prevention & Automation

---

## Table of Contents

- [Section A: Automated CWS Compliance Checking](#section-a-automated-cws-compliance-checking)
  - [A.1 Pre-Submission Validation Script](#a1-pre-submission-validation-script)
  - [A.2 Permission Usage Audit Script](#a2-permission-usage-audit-script)
  - [A.3 Privacy Policy Validator](#a3-privacy-policy-validator)
  - [A.4 CI/CD Integration](#a4-cicd-integration)
- [Section B: Review Monitoring & Alert System](#section-b-review-monitoring--alert-system)
  - [B.1 CWS Status Monitor](#b1-cws-status-monitor)
  - [B.2 User Review Monitor](#b2-user-review-monitor)
  - [B.3 Policy Change Monitor](#b3-policy-change-monitor)
- [Section C: Documentation Templates Repository](#section-c-documentation-templates-repository)
  - [C.1 Store Listing Templates](#c1-store-listing-templates)
  - [C.2 Permission Justification Quick Reference](#c2-permission-justification-quick-reference)
  - [C.3 Rejection Response Decision Tree](#c3-rejection-response-decision-tree)

---

## Section A: Automated CWS Compliance Checking

### A.1 Pre-Submission Validation Script

**File:** `scripts/validate-cws-compliance.ts`

This script is the primary gate before any Chrome Web Store submission. It validates the entire extension package against known CWS policies, catching the most common rejection reasons before a reviewer ever sees the extension.

```typescript
#!/usr/bin/env ts-node

/**
 * validate-cws-compliance.ts
 *
 * Pre-submission compliance validator for Focus Mode - Blocker.
 * Run before every CWS upload to catch policy violations early.
 *
 * Usage: npx ts-node scripts/validate-cws-compliance.ts [--fix] [--json]
 *
 * Exit codes:
 *   0 = All checks passed
 *   1 = One or more checks failed
 *   2 = Script error (could not complete validation)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { execSync } from 'child_process';

// ─── Configuration ──────────────────────────────────────────────────────────

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');
const MANIFEST_PATH = path.join(DIST_DIR, 'manifest.json');
const SRC_DIR = path.join(PROJECT_ROOT, 'src');

// CWS policy limits
const MAX_NAME_LENGTH = 75;
const MAX_SHORT_DESC_LENGTH = 132;
const MAX_LONG_DESC_LENGTH = 16383; // CWS character limit
const MAX_CONTENT_SCRIPT_SIZE_KB = 50;
const MAX_SERVICE_WORKER_SIZE_KB = 100;
const MAX_POPUP_JS_SIZE_KB = 150;
const KEYWORD_DENSITY_THRESHOLD = 0.03; // 3% max keyword density

// Forbidden patterns (immediate rejection)
const FORBIDDEN_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\beval\s*\(/, reason: 'eval() is forbidden by MV3 CSP' },
  { pattern: /new\s+Function\s*\(/, reason: 'new Function() is forbidden by MV3 CSP' },
  { pattern: /document\.write\s*\(/, reason: 'document.write() is a CWS red flag' },
  { pattern: /chrome\.runtime\.getURL\s*\(\s*['"`]https?:/, reason: 'Remote code loading detected' },
  { pattern: /fetch\s*\(\s*['"`]https?:.*\.js/, reason: 'Remote script fetching detected' },
  { pattern: /import\s*\(\s*['"`]https?:/, reason: 'Dynamic remote import detected' },
  { pattern: /innerHTML\s*=\s*[^'"`]/, reason: 'innerHTML with non-literal value (XSS risk)' },
  { pattern: /\.innerText\s*=.*\+.*(?:location|document\.cookie|window\.)/, reason: 'Potential data exfiltration via DOM' },
  { pattern: /chrome\.webRequest/, reason: 'webRequest is not available in MV3 (use declarativeNetRequest)' },
  { pattern: /crypto\.subtle.*export/, reason: 'Crypto key export may trigger manual review' },
  { pattern: /WebSocket\s*\(/, reason: 'WebSocket connections require justification — verify this is intentional' },
];

// Required CSP directives for MV3
const REQUIRED_CSP_DIRECTIVES = [
  "script-src 'self'",
  "object-src 'self'",
];

// ─── Types ──────────────────────────────────────────────────────────────────

interface CheckResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: string[];
}

interface Manifest {
  manifest_version: number;
  name: string;
  version: string;
  description?: string;
  permissions?: string[];
  optional_permissions?: string[];
  host_permissions?: string[];
  optional_host_permissions?: string[];
  content_security_policy?: { extension_pages?: string };
  content_scripts?: Array<{ js?: string[]; css?: string[]; matches?: string[] }>;
  background?: { service_worker?: string };
  action?: { default_popup?: string };
  icons?: Record<string, string>;
  [key: string]: unknown;
}

interface ComplianceReport {
  timestamp: string;
  extension: string;
  version: string;
  checks: CheckResult[];
  summary: { pass: number; fail: number; warn: number; total: number };
  overallStatus: 'PASS' | 'FAIL';
}

// ─── Utility ────────────────────────────────────────────────────────────────

function readManifest(): Manifest {
  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error(`Manifest not found at ${MANIFEST_PATH}. Run build first.`);
  }
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
}

function getFileSizeKB(filePath: string): number {
  if (!fs.existsSync(filePath)) return 0;
  return fs.statSync(filePath).size / 1024;
}

function getAllSourceFiles(dir: string, extensions: string[] = ['.ts', '.js', '.tsx', '.jsx']): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
      results.push(...getAllSourceFiles(fullPath, extensions));
    } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

function checkUrlReturns200(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(false), 10000);
    https.get(url, (res) => {
      clearTimeout(timeout);
      resolve(res.statusCode === 200);
    }).on('error', () => {
      clearTimeout(timeout);
      resolve(false);
    });
  });
}

// ─── Check Functions ────────────────────────────────────────────────────────

function checkManifestVersion(manifest: Manifest): CheckResult {
  return {
    name: 'Manifest Version',
    status: manifest.manifest_version === 3 ? 'PASS' : 'FAIL',
    message: manifest.manifest_version === 3
      ? 'Manifest V3 confirmed'
      : `Expected manifest_version 3, got ${manifest.manifest_version}`,
  };
}

function checkExtensionName(manifest: Manifest): CheckResult {
  const name = manifest.name || '';
  const issues: string[] = [];

  if (name.length === 0) issues.push('Name is empty');
  if (name.length > MAX_NAME_LENGTH) issues.push(`Name exceeds ${MAX_NAME_LENGTH} chars (${name.length})`);
  if (/\b(best|#1|top|number one|official)\b/i.test(name)) {
    issues.push('Name contains superlative/misleading terms (CWS policy violation)');
  }
  if (/[^\w\s\-:.!&]/i.test(name)) {
    issues.push('Name contains special characters that may cause rejection');
  }

  return {
    name: 'Extension Name',
    status: issues.length === 0 ? 'PASS' : 'FAIL',
    message: issues.length === 0 ? `Name "${name}" is compliant (${name.length}/${MAX_NAME_LENGTH} chars)` : issues[0],
    details: issues.length > 1 ? issues : undefined,
  };
}

function checkDescription(manifest: Manifest): CheckResult {
  const desc = manifest.description || '';
  const issues: string[] = [];

  if (desc.length === 0) issues.push('Description is empty');
  if (desc.length > MAX_SHORT_DESC_LENGTH) {
    issues.push(`Description exceeds ${MAX_SHORT_DESC_LENGTH} chars (${desc.length})`);
  }
  if (/\b(best|#1|top rated|number one|guaranteed)\b/i.test(desc)) {
    issues.push('Description contains superlative claims (CWS policy)');
  }

  // Keyword stuffing detection
  const words = desc.toLowerCase().split(/\s+/);
  const wordFreq: Record<string, number> = {};
  words.forEach(w => { wordFreq[w] = (wordFreq[w] || 0) + 1; });
  const stuffedWords = Object.entries(wordFreq)
    .filter(([word, count]) => word.length > 3 && count / words.length > KEYWORD_DENSITY_THRESHOLD)
    .map(([word, count]) => `"${word}" appears ${count}x (${((count / words.length) * 100).toFixed(1)}%)`);
  if (stuffedWords.length > 0) {
    issues.push(`Potential keyword stuffing: ${stuffedWords.join(', ')}`);
  }

  return {
    name: 'Description',
    status: issues.length === 0 ? 'PASS' : issues.some(i => i.includes('empty')) ? 'FAIL' : 'WARN',
    message: issues.length === 0
      ? `Description compliant (${desc.length}/${MAX_SHORT_DESC_LENGTH} chars)`
      : issues[0],
    details: issues.length > 1 ? issues : undefined,
  };
}

function checkPermissionsUsed(manifest: Manifest): CheckResult {
  const declaredPermissions = [
    ...(manifest.permissions || []),
  ];

  // Map permissions to Chrome API patterns
  const permissionApiMap: Record<string, RegExp[]> = {
    'storage': [/chrome\.storage\./],
    'alarms': [/chrome\.alarms\./],
    'tabs': [/chrome\.tabs\./],
    'activeTab': [/chrome\.tabs\.(update|query|get|sendMessage)/, /chrome\.scripting\.executeScript/],
    'declarativeNetRequest': [/chrome\.declarativeNetRequest\./],
    'notifications': [/chrome\.notifications\./],
    'offscreen': [/chrome\.offscreen\./],
    'scripting': [/chrome\.scripting\./],
    'identity': [/chrome\.identity\./],
    'idle': [/chrome\.idle\./],
    'tabGroups': [/chrome\.tabGroups\./],
  };

  const sourceFiles = getAllSourceFiles(SRC_DIR);
  const allSource = sourceFiles.map(f => fs.readFileSync(f, 'utf-8')).join('\n');

  const unused: string[] = [];
  const used: string[] = [];

  for (const perm of declaredPermissions) {
    const patterns = permissionApiMap[perm];
    if (!patterns) {
      // Host permissions or unrecognized — skip
      continue;
    }
    const isUsed = patterns.some(p => p.test(allSource));
    if (isUsed) {
      used.push(perm);
    } else {
      unused.push(perm);
    }
  }

  const status = unused.length === 0 ? 'PASS' : 'FAIL';
  return {
    name: 'Permission Usage Audit',
    status,
    message: unused.length === 0
      ? `All ${used.length} API permissions are used in code`
      : `${unused.length} permission(s) declared but not used in code: ${unused.join(', ')}`,
    details: [
      `Used: ${used.join(', ') || 'none'}`,
      `Unused: ${unused.join(', ') || 'none'}`,
      `Total declared: ${declaredPermissions.length}`,
    ],
  };
}

function checkHostPermissions(manifest: Manifest): CheckResult {
  const hostPerms = manifest.host_permissions || [];
  const issues: string[] = [];

  if (hostPerms.includes('<all_urls>')) {
    // Acceptable only if justified — check for declarativeNetRequest usage
    const sourceFiles = getAllSourceFiles(SRC_DIR);
    const allSource = sourceFiles.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    const usesDNR = /chrome\.declarativeNetRequest/.test(allSource);

    if (!usesDNR) {
      issues.push('<all_urls> declared but declarativeNetRequest not found — hard to justify broad host access');
    }
    // Even if used, flag for awareness
    return {
      name: 'Host Permissions',
      status: issues.length > 0 ? 'FAIL' : 'WARN',
      message: issues.length > 0
        ? issues[0]
        : '<all_urls> declared — ensure CWS single purpose description justifies blocking any user-chosen site',
      details: [
        'Justification: User configures their own blocklist; extension must be able to redirect any domain they choose.',
        'This is the standard justification for website blocker extensions.',
        'CWS reviewers expect this permission for productivity/blocker category extensions.',
      ],
    };
  }

  return {
    name: 'Host Permissions',
    status: 'PASS',
    message: `${hostPerms.length} host permission(s) — no broad access`,
  };
}

function checkForbiddenPatterns(): CheckResult {
  const sourceFiles = getAllSourceFiles(SRC_DIR);
  const violations: string[] = [];

  for (const filePath of sourceFiles) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const relPath = path.relative(PROJECT_ROOT, filePath);

    for (const { pattern, reason } of FORBIDDEN_PATTERNS) {
      lines.forEach((line, idx) => {
        if (pattern.test(line)) {
          violations.push(`${relPath}:${idx + 1} — ${reason}`);
        }
      });
    }
  }

  return {
    name: 'Forbidden Patterns',
    status: violations.length === 0 ? 'PASS' : 'FAIL',
    message: violations.length === 0
      ? 'No forbidden patterns detected in source'
      : `${violations.length} forbidden pattern(s) found`,
    details: violations.slice(0, 20), // Cap output at 20 violations
  };
}

function checkCSP(manifest: Manifest): CheckResult {
  const csp = manifest.content_security_policy?.extension_pages;
  const issues: string[] = [];

  if (!csp) {
    // MV3 has a strict default CSP, so absence is actually fine
    return {
      name: 'Content Security Policy',
      status: 'PASS',
      message: 'No custom CSP — MV3 default CSP applies (strictest)',
    };
  }

  for (const directive of REQUIRED_CSP_DIRECTIVES) {
    if (!csp.includes(directive)) {
      issues.push(`Missing required directive: ${directive}`);
    }
  }

  if (csp.includes("'unsafe-eval'")) {
    issues.push("CSP contains 'unsafe-eval' — forbidden in MV3");
  }
  if (csp.includes("'unsafe-inline'")) {
    issues.push("CSP contains 'unsafe-inline' — forbidden in MV3");
  }
  if (/https?:\/\//.test(csp)) {
    issues.push('CSP allows remote origins — will be flagged by reviewers');
  }

  return {
    name: 'Content Security Policy',
    status: issues.length === 0 ? 'PASS' : 'FAIL',
    message: issues.length === 0 ? 'CSP is strict and compliant' : issues[0],
    details: issues.length > 1 ? issues : undefined,
  };
}

function checkBundleSizes(): CheckResult {
  const budgets: Array<{ name: string; glob: string; maxKB: number }> = [
    { name: 'Service Worker', glob: 'background/service-worker.js', maxKB: MAX_SERVICE_WORKER_SIZE_KB },
    { name: 'Popup JS', glob: 'popup/popup.js', maxKB: MAX_POPUP_JS_SIZE_KB },
    { name: 'Content Script (detector)', glob: 'content/detector.js', maxKB: MAX_CONTENT_SCRIPT_SIZE_KB },
    { name: 'Content Script (blocker)', glob: 'content/blocker.js', maxKB: MAX_CONTENT_SCRIPT_SIZE_KB },
  ];

  const issues: string[] = [];
  const details: string[] = [];

  for (const { name, glob, maxKB } of budgets) {
    const filePath = path.join(DIST_DIR, glob);
    const sizeKB = getFileSizeKB(filePath);

    if (sizeKB === 0) {
      details.push(`${name}: not found (${filePath})`);
      continue;
    }

    const pct = ((sizeKB / maxKB) * 100).toFixed(0);
    details.push(`${name}: ${sizeKB.toFixed(1)}KB / ${maxKB}KB (${pct}%)`);

    if (sizeKB > maxKB) {
      issues.push(`${name} exceeds budget: ${sizeKB.toFixed(1)}KB > ${maxKB}KB`);
    }
  }

  return {
    name: 'Bundle Size Budget',
    status: issues.length === 0 ? 'PASS' : 'FAIL',
    message: issues.length === 0
      ? 'All bundles within size budget'
      : `${issues.length} bundle(s) over budget`,
    details,
  };
}

function checkIcons(manifest: Manifest): CheckResult {
  const icons = manifest.icons || {};
  const requiredSizes = ['16', '48', '128'];
  const issues: string[] = [];

  for (const size of requiredSizes) {
    if (!icons[size]) {
      issues.push(`Missing icon size: ${size}x${size}`);
    } else {
      const iconPath = path.join(DIST_DIR, icons[size]);
      if (!fs.existsSync(iconPath)) {
        issues.push(`Icon ${size}x${size} declared but file missing: ${icons[size]}`);
      }
    }
  }

  return {
    name: 'Icons',
    status: issues.length === 0 ? 'PASS' : 'FAIL',
    message: issues.length === 0 ? 'All required icon sizes present' : issues[0],
    details: issues.length > 1 ? issues : undefined,
  };
}

async function checkPrivacyPolicyUrl(manifest: Manifest): Promise<CheckResult> {
  // CWS requires a privacy policy URL in the developer dashboard
  // We check if a known URL is reachable
  const PRIVACY_POLICY_URL = process.env.PRIVACY_POLICY_URL || '';

  if (!PRIVACY_POLICY_URL) {
    return {
      name: 'Privacy Policy URL',
      status: 'WARN',
      message: 'PRIVACY_POLICY_URL env var not set — cannot validate. Set it before submission.',
      details: [
        'Set PRIVACY_POLICY_URL environment variable to your published privacy policy URL.',
        'The URL must return HTTP 200 and be publicly accessible.',
        'CWS requires this for extensions that use host permissions or handle user data.',
      ],
    };
  }

  const isLive = await checkUrlReturns200(PRIVACY_POLICY_URL);
  return {
    name: 'Privacy Policy URL',
    status: isLive ? 'PASS' : 'FAIL',
    message: isLive
      ? `Privacy policy URL is live: ${PRIVACY_POLICY_URL}`
      : `Privacy policy URL is not reachable (non-200): ${PRIVACY_POLICY_URL}`,
  };
}

function checkSinglePurpose(manifest: Manifest): CheckResult {
  const permissions = [
    ...(manifest.permissions || []),
    ...(manifest.optional_permissions || []),
  ];
  const desc = (manifest.description || '').toLowerCase();

  // Check for permissions that don't align with a "website blocker" purpose
  const suspiciousForBlocker = ['bookmarks', 'history', 'downloads', 'management', 'pageCapture', 'topSites'];
  const found = permissions.filter(p => suspiciousForBlocker.includes(p));

  if (found.length > 0) {
    return {
      name: 'Single Purpose Policy',
      status: 'WARN',
      message: `Permissions that may not align with "website blocker" single purpose: ${found.join(', ')}`,
      details: [
        'CWS requires extensions to have a single, clear purpose.',
        'Permissions should directly support the stated purpose.',
        'Consider moving non-essential permissions to optional_permissions.',
      ],
    };
  }

  return {
    name: 'Single Purpose Policy',
    status: 'PASS',
    message: 'All permissions align with website blocker purpose',
  };
}

// ─── Main Runner ────────────────────────────────────────────────────────────

async function runAllChecks(): Promise<ComplianceReport> {
  const manifest = readManifest();

  const checks: CheckResult[] = [
    checkManifestVersion(manifest),
    checkExtensionName(manifest),
    checkDescription(manifest),
    checkPermissionsUsed(manifest),
    checkHostPermissions(manifest),
    checkForbiddenPatterns(),
    checkCSP(manifest),
    checkBundleSizes(),
    checkIcons(manifest),
    await checkPrivacyPolicyUrl(manifest),
    checkSinglePurpose(manifest),
  ];

  const summary = {
    pass: checks.filter(c => c.status === 'PASS').length,
    fail: checks.filter(c => c.status === 'FAIL').length,
    warn: checks.filter(c => c.status === 'WARN').length,
    total: checks.length,
  };

  return {
    timestamp: new Date().toISOString(),
    extension: manifest.name || 'Unknown',
    version: manifest.version || '0.0.0',
    checks,
    summary,
    overallStatus: summary.fail === 0 ? 'PASS' : 'FAIL',
  };
}

function printReport(report: ComplianceReport, asJson: boolean): void {
  if (asJson) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log('\n' + '='.repeat(70));
  console.log(' CWS COMPLIANCE REPORT — Focus Mode - Blocker');
  console.log('='.repeat(70));
  console.log(`Extension: ${report.extension} v${report.version}`);
  console.log(`Timestamp: ${report.timestamp}`);
  console.log('-'.repeat(70));

  for (const check of report.checks) {
    const icon = check.status === 'PASS' ? '[PASS]' : check.status === 'FAIL' ? '[FAIL]' : '[WARN]';
    console.log(`\n${icon} ${check.name}`);
    console.log(`       ${check.message}`);
    if (check.details) {
      check.details.forEach(d => console.log(`         - ${d}`));
    }
  }

  console.log('\n' + '-'.repeat(70));
  console.log(`SUMMARY: ${report.summary.pass} passed, ${report.summary.fail} failed, ${report.summary.warn} warnings`);
  console.log(`OVERALL: ${report.overallStatus}`);
  console.log('='.repeat(70) + '\n');
}

// ─── Entry Point ────────────────────────────────────────────────────────────

(async () => {
  const args = process.argv.slice(2);
  const asJson = args.includes('--json');

  try {
    const report = await runAllChecks();
    printReport(report, asJson);
    process.exit(report.overallStatus === 'PASS' ? 0 : 1);
  } catch (err) {
    console.error('Compliance check failed:', err);
    process.exit(2);
  }
})();
```

#### Validation Checks Summary

| # | Check | Catches | Severity |
|---|-------|---------|----------|
| 1 | Manifest Version | MV2 submitted to MV3 pipeline | FAIL |
| 2 | Extension Name | Superlatives, length, special chars | FAIL |
| 3 | Description | Length, keyword stuffing, superlatives | FAIL/WARN |
| 4 | Permission Usage | Unused permissions (removal trigger) | FAIL |
| 5 | Host Permissions | Unjustified broad access | FAIL/WARN |
| 6 | Forbidden Patterns | eval, remote code, webRequest | FAIL |
| 7 | CSP Strictness | unsafe-eval, unsafe-inline, remote origins | FAIL |
| 8 | Bundle Sizes | Content scripts over 50KB budget | FAIL |
| 9 | Icons | Missing 16/48/128 sizes | FAIL |
| 10 | Privacy Policy URL | Dead or missing URL | FAIL/WARN |
| 11 | Single Purpose | Permissions misaligned with stated purpose | WARN |

---

### A.2 Permission Usage Audit Script

**File:** `scripts/audit-permissions.ts`

Deep-scans the Focus Mode codebase to produce a complete mapping of every Chrome API call to its required permission, then cross-references with `manifest.json` declarations to find gaps in both directions.

```typescript
#!/usr/bin/env ts-node

/**
 * audit-permissions.ts
 *
 * Scans Focus Mode - Blocker source code for all chrome.* API calls,
 * maps each to its required permission, and identifies:
 *   1. Unused permissions (declared but no matching API call — should remove)
 *   2. Missing permissions (API used but not declared — would crash)
 *   3. Complete justification report for CWS submission
 *
 * Usage: npx ts-node scripts/audit-permissions.ts [--report] [--json]
 */

import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(PROJECT_ROOT, 'src');
const MANIFEST_PATH = path.join(PROJECT_ROOT, 'dist', 'manifest.json');

// ─── Chrome API → Permission Mapping ────────────────────────────────────────

const API_PERMISSION_MAP: Record<string, string> = {
  // Storage API
  'chrome.storage.local': 'storage',
  'chrome.storage.sync': 'storage',
  'chrome.storage.session': 'storage',
  'chrome.storage.onChanged': 'storage',

  // Alarms API
  'chrome.alarms.create': 'alarms',
  'chrome.alarms.get': 'alarms',
  'chrome.alarms.getAll': 'alarms',
  'chrome.alarms.clear': 'alarms',
  'chrome.alarms.clearAll': 'alarms',
  'chrome.alarms.onAlarm': 'alarms',

  // Tabs API
  'chrome.tabs.query': 'tabs',
  'chrome.tabs.get': 'tabs',
  'chrome.tabs.update': 'tabs',
  'chrome.tabs.create': 'tabs',
  'chrome.tabs.remove': 'tabs',
  'chrome.tabs.sendMessage': 'tabs',
  'chrome.tabs.onUpdated': 'tabs',
  'chrome.tabs.onRemoved': 'tabs',
  'chrome.tabs.onActivated': 'tabs',

  // DeclarativeNetRequest API
  'chrome.declarativeNetRequest.updateDynamicRules': 'declarativeNetRequest',
  'chrome.declarativeNetRequest.updateSessionRules': 'declarativeNetRequest',
  'chrome.declarativeNetRequest.getDynamicRules': 'declarativeNetRequest',
  'chrome.declarativeNetRequest.getSessionRules': 'declarativeNetRequest',
  'chrome.declarativeNetRequest.updateEnabledRulesets': 'declarativeNetRequest',
  'chrome.declarativeNetRequest.getEnabledRulesets': 'declarativeNetRequest',
  'chrome.declarativeNetRequest.isRegexSupported': 'declarativeNetRequest',

  // Notifications API
  'chrome.notifications.create': 'notifications',
  'chrome.notifications.update': 'notifications',
  'chrome.notifications.clear': 'notifications',
  'chrome.notifications.onClicked': 'notifications',
  'chrome.notifications.onClosed': 'notifications',

  // Offscreen API
  'chrome.offscreen.createDocument': 'offscreen',
  'chrome.offscreen.closeDocument': 'offscreen',
  'chrome.offscreen.hasDocument': 'offscreen',

  // Scripting API
  'chrome.scripting.executeScript': 'scripting',
  'chrome.scripting.insertCSS': 'scripting',
  'chrome.scripting.removeCSS': 'scripting',
  'chrome.scripting.registerContentScripts': 'scripting',
  'chrome.scripting.unregisterContentScripts': 'scripting',

  // Identity API (Pro)
  'chrome.identity.getAuthToken': 'identity',
  'chrome.identity.getProfileUserInfo': 'identity',
  'chrome.identity.launchWebAuthFlow': 'identity',

  // Idle API (Pro)
  'chrome.idle.queryState': 'idle',
  'chrome.idle.setDetectionInterval': 'idle',
  'chrome.idle.onStateChanged': 'idle',

  // Tab Groups API (Pro)
  'chrome.tabGroups.query': 'tabGroups',
  'chrome.tabGroups.update': 'tabGroups',
  'chrome.tabGroups.move': 'tabGroups',

  // Runtime API (no permission needed)
  'chrome.runtime.sendMessage': '__none__',
  'chrome.runtime.onMessage': '__none__',
  'chrome.runtime.onInstalled': '__none__',
  'chrome.runtime.onStartup': '__none__',
  'chrome.runtime.getURL': '__none__',
  'chrome.runtime.getManifest': '__none__',
  'chrome.runtime.connect': '__none__',
  'chrome.runtime.onConnect': '__none__',
  'chrome.runtime.id': '__none__',

  // Action API (no permission needed)
  'chrome.action.setIcon': '__none__',
  'chrome.action.setBadgeText': '__none__',
  'chrome.action.setBadgeBackgroundColor': '__none__',
  'chrome.action.setPopup': '__none__',
  'chrome.action.onClicked': '__none__',
};

// Permission → CWS Justification for Focus Mode - Blocker
const PERMISSION_JUSTIFICATIONS: Record<string, string> = {
  'storage': 'Persists user blocklist, focus session history, Focus Score, streak data, and extension settings locally on the device. No data is transmitted externally.',
  'alarms': 'Drives the Pomodoro/focus timer (tick every minute), schedules block rule activation for time-based schedules, periodic storage cleanup, and license validation checks.',
  'tabs': 'Queries the active tab to determine if the current site is on the user blocklist, sends messages to content scripts for visual blocking, and opens the block page when a blocked site is visited.',
  'activeTab': 'Allows the content script blocker to be injected into the currently active tab when the user navigates to a blocked site, without requiring persistent host access to that specific tab.',
  'declarativeNetRequest': 'Core blocking mechanism: registers DNR redirect rules that intercept navigation to user-blocked domains and redirect to the motivational block page. All rules are user-configured.',
  'notifications': 'Sends focus session start/end notifications, streak milestone celebrations, and break reminders during Pomodoro sessions.',
  'offscreen': 'Creates an offscreen document for ambient sound playback during focus sessions. Required because MV3 service workers cannot play audio directly.',
  'scripting': 'Programmatically injects the blocker content script into tabs navigating to blocked sites, providing instant visual blocking before the DNR redirect completes.',
  'identity': '(Optional/Pro) Authenticates the user for Pro license verification and cross-device sync via Chrome identity.',
  'idle': '(Optional/Pro) Detects when the user is idle to auto-pause focus sessions and accurately track active focus time.',
  'tabGroups': '(Optional/Pro) Organizes tabs into focus-related groups during active sessions to reduce visual distraction.',
  '<all_urls>': 'The user configures their own blocklist of sites to block. The extension must be able to redirect navigation to ANY domain the user chooses. This is the standard host permission for website blocker extensions.',
};

// ─── Scanner ────────────────────────────────────────────────────────────────

interface ApiUsage {
  api: string;
  permission: string;
  file: string;
  line: number;
  snippet: string;
}

function scanSourceFiles(): ApiUsage[] {
  const usages: ApiUsage[] = [];
  const sourceFiles = getAllSourceFiles(SRC_DIR);

  for (const filePath of sourceFiles) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const relPath = path.relative(PROJECT_ROOT, filePath);

    lines.forEach((line, idx) => {
      // Match chrome.* API calls
      const matches = line.matchAll(/chrome\.(\w+)\.(\w+)/g);
      for (const match of matches) {
        const fullApi = match[0];
        const permission = API_PERMISSION_MAP[fullApi];

        if (permission) {
          usages.push({
            api: fullApi,
            permission: permission === '__none__' ? '(none required)' : permission,
            file: relPath,
            line: idx + 1,
            snippet: line.trim().substring(0, 100),
          });
        } else {
          // Unknown API — flag it
          usages.push({
            api: fullApi,
            permission: '__unknown__',
            file: relPath,
            line: idx + 1,
            snippet: line.trim().substring(0, 100),
          });
        }
      }
    });
  }

  return usages;
}

function getAllSourceFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      results.push(...getAllSourceFiles(fullPath));
    } else if (entry.isFile() && /\.(ts|js|tsx|jsx)$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

interface AuditReport {
  usedPermissions: string[];
  unusedPermissions: string[];
  missingPermissions: string[];
  unknownApis: ApiUsage[];
  justifications: Record<string, string>;
  apiUsageByPermission: Record<string, ApiUsage[]>;
}

function generateReport(usages: ApiUsage[]): AuditReport {
  // Read manifest
  let declaredPerms: string[] = [];
  let declaredOptional: string[] = [];
  let declaredHost: string[] = [];

  if (fs.existsSync(MANIFEST_PATH)) {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
    declaredPerms = manifest.permissions || [];
    declaredOptional = manifest.optional_permissions || [];
    declaredHost = manifest.host_permissions || [];
  }

  const allDeclared = new Set([...declaredPerms, ...declaredOptional, ...declaredHost]);

  // Group usages by permission
  const apiUsageByPermission: Record<string, ApiUsage[]> = {};
  const usedPermSet = new Set<string>();

  for (const usage of usages) {
    if (usage.permission === '(none required)' || usage.permission === '__unknown__') continue;
    usedPermSet.add(usage.permission);
    if (!apiUsageByPermission[usage.permission]) {
      apiUsageByPermission[usage.permission] = [];
    }
    apiUsageByPermission[usage.permission].push(usage);
  }

  const usedPermissions = [...usedPermSet].sort();
  const unusedPermissions = [...allDeclared].filter(p => !usedPermSet.has(p) && p !== '<all_urls>').sort();
  const missingPermissions = usedPermissions.filter(p => !allDeclared.has(p)).sort();

  const justifications: Record<string, string> = {};
  for (const perm of [...allDeclared]) {
    justifications[perm] = PERMISSION_JUSTIFICATIONS[perm] || 'No justification template available — write one before submission.';
  }

  const unknownApis = usages.filter(u => u.permission === '__unknown__');

  return {
    usedPermissions,
    unusedPermissions,
    missingPermissions,
    unknownApis,
    justifications,
    apiUsageByPermission,
  };
}

function printAuditReport(report: AuditReport): void {
  console.log('\n' + '='.repeat(70));
  console.log(' PERMISSION USAGE AUDIT — Focus Mode - Blocker');
  console.log('='.repeat(70));

  // Used permissions with API call counts
  console.log('\n--- USED PERMISSIONS ---');
  for (const perm of report.usedPermissions) {
    const count = report.apiUsageByPermission[perm]?.length || 0;
    console.log(`  [OK] ${perm} (${count} API call sites)`);
  }

  // Unused permissions (should remove)
  if (report.unusedPermissions.length > 0) {
    console.log('\n--- UNUSED PERMISSIONS (REMOVE BEFORE SUBMISSION) ---');
    for (const perm of report.unusedPermissions) {
      console.log(`  [!!] ${perm} — declared but no matching API calls found`);
    }
  } else {
    console.log('\n--- UNUSED PERMISSIONS ---');
    console.log('  None — all declared permissions have matching API calls.');
  }

  // Missing permissions (would crash)
  if (report.missingPermissions.length > 0) {
    console.log('\n--- MISSING PERMISSIONS (ADD TO MANIFEST) ---');
    for (const perm of report.missingPermissions) {
      console.log(`  [!!] ${perm} — used in code but not declared`);
      const usages = report.apiUsageByPermission[perm] || [];
      usages.slice(0, 3).forEach(u => {
        console.log(`        ${u.file}:${u.line} — ${u.api}`);
      });
    }
  } else {
    console.log('\n--- MISSING PERMISSIONS ---');
    console.log('  None — all used APIs have matching permission declarations.');
  }

  // Unknown APIs
  if (report.unknownApis.length > 0) {
    console.log('\n--- UNKNOWN CHROME APIs (verify manually) ---');
    for (const u of report.unknownApis) {
      console.log(`  [?] ${u.api} at ${u.file}:${u.line}`);
    }
  }

  // Justification report
  console.log('\n--- PERMISSION JUSTIFICATIONS (for CWS submission form) ---');
  for (const [perm, justification] of Object.entries(report.justifications)) {
    console.log(`\n  ${perm}:`);
    console.log(`    ${justification}`);
  }

  console.log('\n' + '='.repeat(70));
}

// Entry point
const usages = scanSourceFiles();
const report = generateReport(usages);
const asJson = process.argv.includes('--json');

if (asJson) {
  console.log(JSON.stringify(report, null, 2));
} else {
  printAuditReport(report);
}

process.exit(report.missingPermissions.length > 0 ? 1 : 0);
```

#### Audit Output Categories

| Category | Meaning | Action |
|----------|---------|--------|
| Used | API call found + permission declared | No action needed |
| Unused | Permission declared but no API call found | Remove before submission |
| Missing | API call found but no permission declared | Add to manifest or code will crash |
| Unknown | chrome.* call not in known mapping | Manual review required |

---

### A.3 Privacy Policy Validator

**File:** `scripts/validate-privacy-policy.ts`

Validates that the published privacy policy meets CWS requirements before submission.

```typescript
#!/usr/bin/env ts-node

/**
 * validate-privacy-policy.ts
 *
 * Validates the Focus Mode - Blocker privacy policy URL for CWS compliance.
 * Checks: accessibility, required sections, extension name mention,
 *         recency, and contact information.
 *
 * Usage: npx ts-node scripts/validate-privacy-policy.ts <url>
 *    or: PRIVACY_POLICY_URL=<url> npx ts-node scripts/validate-privacy-policy.ts
 */

import * as https from 'https';
import * as http from 'http';

const EXTENSION_NAME = 'Focus Mode - Blocker';
const EXTENSION_NAME_VARIANTS = [
  'focus mode',
  'focus mode - blocker',
  'focus mode blocker',
  'focusmode',
];

// Required sections per CWS policy
const REQUIRED_SECTIONS = [
  {
    name: 'Data Collection',
    patterns: [
      /data\s+(we\s+)?collect/i,
      /information\s+(we\s+)?collect/i,
      /what\s+(data|information)\s+(do\s+)?we\s+collect/i,
      /collection\s+of\s+(data|information)/i,
      /personal\s+(data|information)/i,
    ],
  },
  {
    name: 'Data Sharing / Third Parties',
    patterns: [
      /shar(e|ing)\s+(your\s+)?(data|information)/i,
      /third\s+part(y|ies)/i,
      /disclose/i,
      /transfer/i,
      /we\s+do\s+not\s+(sell|share)/i,
    ],
  },
  {
    name: 'Data Retention',
    patterns: [
      /retain/i,
      /retention/i,
      /how\s+long/i,
      /delet(e|ion)/i,
      /stored\s+(locally|on\s+your\s+device)/i,
      /never\s+leaves?\s+(your\s+)?device/i,
    ],
  },
  {
    name: 'User Rights',
    patterns: [
      /your\s+rights/i,
      /user\s+rights/i,
      /right\s+to/i,
      /access.*data/i,
      /delete.*data/i,
      /export.*data/i,
      /control.*data/i,
      /uninstall/i,
    ],
  },
  {
    name: 'Contact Information',
    patterns: [
      /contact\s+us/i,
      /email/i,
      /@[\w.-]+\.\w+/,   // email pattern
      /support/i,
    ],
  },
];

// ─── Fetcher ────────────────────────────────────────────────────────────────

function fetchPage(url: string): Promise<{ status: number; body: string; headers: Record<string, string> }> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const timeout = setTimeout(() => reject(new Error('Request timed out (15s)')), 15000);

    client.get(url, { headers: { 'User-Agent': 'FocusMode-PolicyValidator/1.0' } }, (res) => {
      clearTimeout(timeout);
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({
        status: res.statusCode || 0,
        body,
        headers: res.headers as Record<string, string>,
      }));
    }).on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Checks ─────────────────────────────────────────────────────────────────

interface PolicyCheckResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
}

async function validatePrivacyPolicy(url: string): Promise<PolicyCheckResult[]> {
  const results: PolicyCheckResult[] = [];

  // Check 1: URL is reachable and returns 200
  let body = '';
  try {
    const response = await fetchPage(url);
    if (response.status === 200) {
      body = response.body;
      results.push({ name: 'URL Accessibility', status: 'PASS', message: `URL returns HTTP 200` });
    } else if (response.status >= 300 && response.status < 400) {
      results.push({ name: 'URL Accessibility', status: 'WARN', message: `URL redirects (${response.status}) — CWS may not follow redirects` });
    } else {
      results.push({ name: 'URL Accessibility', status: 'FAIL', message: `URL returns HTTP ${response.status}` });
      return results; // Cannot proceed without content
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    results.push({ name: 'URL Accessibility', status: 'FAIL', message: `URL unreachable: ${message}` });
    return results;
  }

  const plainText = stripHtml(body).toLowerCase();

  // Check 2: Policy mentions the extension name
  const mentionsExtension = EXTENSION_NAME_VARIANTS.some(v => plainText.includes(v.toLowerCase()));
  results.push({
    name: 'Extension Name Mentioned',
    status: mentionsExtension ? 'PASS' : 'FAIL',
    message: mentionsExtension
      ? `Policy mentions "${EXTENSION_NAME}" or variant`
      : `Policy does not mention "${EXTENSION_NAME}" — CWS reviewers verify this`,
  });

  // Check 3: Required sections
  for (const section of REQUIRED_SECTIONS) {
    const found = section.patterns.some(p => p.test(plainText));
    results.push({
      name: `Section: ${section.name}`,
      status: found ? 'PASS' : 'FAIL',
      message: found
        ? `"${section.name}" section detected`
        : `"${section.name}" section not found — required by CWS`,
    });
  }

  // Check 4: Last updated date within 1 year
  const datePatterns = [
    /(?:last\s+)?updated[:\s]+(\w+\s+\d{1,2},?\s+\d{4})/i,
    /(?:last\s+)?updated[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /(?:effective|last\s+modified)[:\s]+(\w+\s+\d{1,2},?\s+\d{4})/i,
    /(\d{4}-\d{2}-\d{2})/,
  ];

  let dateFound = false;
  let dateRecent = false;
  for (const pattern of datePatterns) {
    const match = body.match(pattern);
    if (match) {
      dateFound = true;
      try {
        const parsed = new Date(match[1]);
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        dateRecent = parsed > oneYearAgo;
      } catch {
        // Could not parse — warn
      }
      break;
    }
  }

  if (!dateFound) {
    results.push({ name: 'Last Updated Date', status: 'WARN', message: 'No "last updated" date found in policy' });
  } else if (!dateRecent) {
    results.push({ name: 'Last Updated Date', status: 'WARN', message: 'Policy date may be older than 1 year — consider updating' });
  } else {
    results.push({ name: 'Last Updated Date', status: 'PASS', message: 'Policy updated within the last year' });
  }

  // Check 5: Contact information (email or contact page)
  const hasEmail = /@[\w.-]+\.\w{2,}/.test(plainText);
  const hasContactLink = /contact/i.test(body) && /href/i.test(body);
  results.push({
    name: 'Contact Information',
    status: hasEmail || hasContactLink ? 'PASS' : 'FAIL',
    message: hasEmail
      ? 'Email address found in policy'
      : hasContactLink
        ? 'Contact link found in policy'
        : 'No contact information (email or contact link) found — required by CWS',
  });

  // Check 6: HTTPS
  results.push({
    name: 'HTTPS',
    status: url.startsWith('https://') ? 'PASS' : 'WARN',
    message: url.startsWith('https://') ? 'Policy served over HTTPS' : 'Policy not served over HTTPS — CWS prefers HTTPS',
  });

  return results;
}

// ─── Entry Point ────────────────────────────────────────────────────────────

(async () => {
  const url = process.argv[2] || process.env.PRIVACY_POLICY_URL;

  if (!url) {
    console.error('Usage: npx ts-node scripts/validate-privacy-policy.ts <privacy-policy-url>');
    console.error('   or: PRIVACY_POLICY_URL=<url> npx ts-node scripts/validate-privacy-policy.ts');
    process.exit(2);
  }

  console.log(`\nValidating privacy policy: ${url}\n`);

  const results = await validatePrivacyPolicy(url);
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warned = results.filter(r => r.status === 'WARN').length;

  for (const r of results) {
    const tag = r.status === 'PASS' ? '[PASS]' : r.status === 'FAIL' ? '[FAIL]' : '[WARN]';
    console.log(`${tag} ${r.name}: ${r.message}`);
  }

  console.log(`\nSummary: ${passed} passed, ${failed} failed, ${warned} warnings`);
  console.log(`Overall: ${failed === 0 ? 'PASS' : 'FAIL'}\n`);

  process.exit(failed > 0 ? 1 : 0);
})();
```

#### Privacy Policy Validation Checklist

| Check | What It Verifies | CWS Requirement |
|-------|-----------------|-----------------|
| URL Returns 200 | Policy page is publicly accessible | Mandatory |
| Extension Name | Policy explicitly names the extension | Mandatory |
| Data Collection Section | Describes what data is collected | Mandatory |
| Data Sharing Section | Describes third-party data sharing | Mandatory |
| Data Retention Section | Describes how long data is kept | Mandatory |
| User Rights Section | Describes how users control their data | Mandatory |
| Contact Info | Email or contact page for inquiries | Mandatory |
| Updated Date | Policy updated within the last year | Recommended |
| HTTPS | Policy served securely | Recommended |

---

### A.4 CI/CD Integration

**File:** `.github/workflows/cws-compliance.yml`

GitHub Actions workflow that runs compliance checks on every PR and push to `main`, blocking merges when violations are detected.

```yaml
# .github/workflows/cws-compliance.yml
#
# CWS Compliance Gate for Focus Mode - Blocker
# Runs on every PR and push to main to prevent policy violations
# from reaching Chrome Web Store submission.

name: CWS Compliance Check

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened]

permissions:
  contents: read
  pull-requests: write  # For posting compliance report as PR comment

env:
  NODE_VERSION: '20'
  PRIVACY_POLICY_URL: ${{ secrets.PRIVACY_POLICY_URL }}

jobs:
  compliance:
    name: CWS Policy Compliance
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build extension
        run: npm run build

      # ─── Compliance Checks ───────────────────────────────────────

      - name: Run CWS compliance validation
        id: compliance
        run: |
          npx ts-node scripts/validate-cws-compliance.ts --json > compliance-report.json 2>&1 || true
          # Extract overall status
          STATUS=$(cat compliance-report.json | jq -r '.overallStatus // "FAIL"')
          echo "status=$STATUS" >> $GITHUB_OUTPUT
          echo "### CWS Compliance: $STATUS" >> $GITHUB_STEP_SUMMARY

      - name: Run permission audit
        id: permissions
        run: |
          npx ts-node scripts/audit-permissions.ts --json > permission-report.json 2>&1 || true
          MISSING=$(cat permission-report.json | jq '.missingPermissions | length')
          UNUSED=$(cat permission-report.json | jq '.unusedPermissions | length')
          echo "missing=$MISSING" >> $GITHUB_OUTPUT
          echo "unused=$UNUSED" >> $GITHUB_OUTPUT
          echo "### Permission Audit: Missing=$MISSING, Unused=$UNUSED" >> $GITHUB_STEP_SUMMARY

      - name: Validate privacy policy
        id: privacy
        if: env.PRIVACY_POLICY_URL != ''
        run: |
          npx ts-node scripts/validate-privacy-policy.ts "$PRIVACY_POLICY_URL" > privacy-report.txt 2>&1 || true
          if grep -q "Overall: FAIL" privacy-report.txt; then
            echo "status=FAIL" >> $GITHUB_OUTPUT
          else
            echo "status=PASS" >> $GITHUB_OUTPUT
          fi

      - name: Check forbidden patterns
        id: forbidden
        run: |
          # Quick grep for the most critical patterns
          VIOLATIONS=0
          for pattern in "eval(" "new Function(" "document.write(" "chrome.webRequest"; do
            COUNT=$(grep -r "$pattern" src/ --include="*.ts" --include="*.js" -l 2>/dev/null | wc -l)
            VIOLATIONS=$((VIOLATIONS + COUNT))
          done
          echo "count=$VIOLATIONS" >> $GITHUB_OUTPUT
          if [ "$VIOLATIONS" -gt 0 ]; then
            echo "### Forbidden Patterns: $VIOLATIONS file(s) with violations" >> $GITHUB_STEP_SUMMARY
          fi

      - name: Check bundle sizes
        run: |
          echo "### Bundle Sizes" >> $GITHUB_STEP_SUMMARY
          echo "| Bundle | Size | Budget | Status |" >> $GITHUB_STEP_SUMMARY
          echo "|--------|------|--------|--------|" >> $GITHUB_STEP_SUMMARY

          check_size() {
            local name=$1 file=$2 budget=$3
            if [ -f "$file" ]; then
              SIZE=$(wc -c < "$file" | awk '{printf "%.1f", $1/1024}')
              if [ "$(echo "$SIZE > $budget" | bc)" -eq 1 ]; then
                echo "| $name | ${SIZE}KB | ${budget}KB | OVER |" >> $GITHUB_STEP_SUMMARY
              else
                echo "| $name | ${SIZE}KB | ${budget}KB | OK |" >> $GITHUB_STEP_SUMMARY
              fi
            else
              echo "| $name | N/A | ${budget}KB | NOT FOUND |" >> $GITHUB_STEP_SUMMARY
            fi
          }

          check_size "Service Worker" "dist/background/service-worker.js" 100
          check_size "Popup JS" "dist/popup/popup.js" 150
          check_size "Detector" "dist/content/detector.js" 50
          check_size "Blocker" "dist/content/blocker.js" 50

      # ─── Report Generation ───────────────────────────────────────

      - name: Generate PR compliance comment
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');

            let complianceReport = {};
            let permissionReport = {};
            try {
              complianceReport = JSON.parse(fs.readFileSync('compliance-report.json', 'utf-8'));
            } catch (e) { complianceReport = { overallStatus: 'ERROR', checks: [] }; }
            try {
              permissionReport = JSON.parse(fs.readFileSync('permission-report.json', 'utf-8'));
            } catch (e) { permissionReport = { unusedPermissions: [], missingPermissions: [] }; }

            const status = complianceReport.overallStatus === 'PASS' ? 'PASS' : 'FAIL';
            const statusIcon = status === 'PASS' ? ':white_check_mark:' : ':x:';

            let body = `## ${statusIcon} CWS Compliance Report\n\n`;
            body += `**Overall Status:** ${status}\n\n`;

            // Compliance checks table
            body += `### Compliance Checks\n\n`;
            body += `| Check | Status | Details |\n|-------|--------|--------|\n`;
            for (const check of complianceReport.checks || []) {
              const icon = check.status === 'PASS' ? ':white_check_mark:' : check.status === 'FAIL' ? ':x:' : ':warning:';
              body += `| ${check.name} | ${icon} ${check.status} | ${check.message} |\n`;
            }

            // Permission audit
            body += `\n### Permission Audit\n\n`;
            if (permissionReport.unusedPermissions?.length > 0) {
              body += `:x: **Unused permissions** (remove before submission): ${permissionReport.unusedPermissions.join(', ')}\n`;
            }
            if (permissionReport.missingPermissions?.length > 0) {
              body += `:x: **Missing permissions** (add to manifest): ${permissionReport.missingPermissions.join(', ')}\n`;
            }
            if (!permissionReport.unusedPermissions?.length && !permissionReport.missingPermissions?.length) {
              body += `:white_check_mark: All permissions are correctly declared and used.\n`;
            }

            body += `\n---\n*Generated by CWS Compliance CI*`;

            // Post or update comment
            const { data: comments } = await github.rest.issues.listComments({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
            });
            const existing = comments.find(c => c.body?.includes('CWS Compliance Report'));

            if (existing) {
              await github.rest.issues.updateComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                comment_id: existing.id,
                body,
              });
            } else {
              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: context.issue.number,
                body,
              });
            }

      # ─── Gate ────────────────────────────────────────────────────

      - name: Enforce compliance gate
        if: steps.compliance.outputs.status == 'FAIL' || steps.permissions.outputs.missing > 0
        run: |
          echo "::error::CWS compliance check failed. Fix violations before merging."
          echo ""
          echo "Compliance status: ${{ steps.compliance.outputs.status }}"
          echo "Missing permissions: ${{ steps.permissions.outputs.missing }}"
          echo "Unused permissions: ${{ steps.permissions.outputs.unused }}"
          echo ""
          echo "Run locally: npx ts-node scripts/validate-cws-compliance.ts"
          echo "             npx ts-node scripts/audit-permissions.ts"
          exit 1
```

#### CI Pipeline Flow

```
Push / PR to main
      |
      v
  npm ci + build
      |
      v
  +---+---+---+---+
  |   |   |   |   |
  v   v   v   v   v
 CWS  Perm  Policy  Forbidden  Bundle
 Valid Audit  URL    Patterns   Sizes
  |   |   |   |   |
  +---+---+---+---+
      |
      v
  Generate PR Comment (on PRs)
      |
      v
  Gate: FAIL if any critical check fails
      |
      v
  Merge blocked / allowed
```

#### CI Triggers and Behavior

| Event | Compliance Check | PR Comment | Merge Block |
|-------|-----------------|------------|-------------|
| Push to `main` | Yes | No | N/A (post-merge) |
| PR opened | Yes | Yes | Yes if FAIL |
| PR synchronized | Yes | Updated | Yes if FAIL |
| PR reopened | Yes | Updated | Yes if FAIL |

---

## Section B: Review Monitoring & Alert System

### B.1 CWS Status Monitor

**File:** `scripts/monitor-cws-status.ts`

Monitors the extension's Chrome Web Store status and sends alerts when status changes are detected. Designed to run as a cron job or scheduled GitHub Action.

```typescript
#!/usr/bin/env ts-node

/**
 * monitor-cws-status.ts
 *
 * Polls the Chrome Web Store API for Focus Mode - Blocker status changes.
 * Alerts via Slack, Discord, or email when status changes.
 *
 * Usage:
 *   npx ts-node scripts/monitor-cws-status.ts
 *
 * Environment variables:
 *   CWS_EXTENSION_ID    — Chrome Web Store extension ID
 *   CWS_CLIENT_ID       — OAuth2 client ID for CWS API
 *   CWS_CLIENT_SECRET   — OAuth2 client secret
 *   CWS_REFRESH_TOKEN   — OAuth2 refresh token
 *   SLACK_WEBHOOK_URL   — (optional) Slack incoming webhook
 *   DISCORD_WEBHOOK_URL — (optional) Discord webhook
 *   ALERT_EMAIL         — (optional) Email for SendGrid alerts
 *   SENDGRID_API_KEY    — (optional) SendGrid API key
 */

import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

// ─── Configuration ──────────────────────────────────────────────────────────

const EXTENSION_ID = process.env.CWS_EXTENSION_ID || '';
const STATE_FILE = path.join(__dirname, '.cws-monitor-state.json');

// CWS item status values
type CwsStatus = 'PUBLISHED' | 'PENDING_REVIEW' | 'REJECTED' | 'SUSPENDED' | 'TAKEN_DOWN' | 'UNKNOWN';

interface MonitorState {
  lastStatus: CwsStatus;
  lastChecked: string;
  lastRating: number;
  lastReviewCount: number;
  history: Array<{
    timestamp: string;
    status: CwsStatus;
    event: string;
  }>;
}

interface AlertPayload {
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  fields?: Record<string, string>;
}

// ─── CWS API Client ────────────────────────────────────────────────────────

async function getAccessToken(): Promise<string> {
  const clientId = process.env.CWS_CLIENT_ID;
  const clientSecret = process.env.CWS_CLIENT_SECRET;
  const refreshToken = process.env.CWS_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('CWS OAuth credentials not configured. Set CWS_CLIENT_ID, CWS_CLIENT_SECRET, CWS_REFRESH_TOKEN.');
  }

  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }).toString();

    const req = https.request({
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          resolve(data.access_token);
        } catch {
          reject(new Error(`Token parse failed: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function getExtensionStatus(accessToken: string): Promise<{ status: CwsStatus; rating: number; reviewCount: number }> {
  return new Promise((resolve, reject) => {
    https.get({
      hostname: 'www.googleapis.com',
      path: `/chromewebstore/v1.1/items/${EXTENSION_ID}?projection=FULL`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-goog-api-version': '2',
      },
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          resolve({
            status: (data.itemStatus || data.status || 'UNKNOWN') as CwsStatus,
            rating: data.averageRating || 0,
            reviewCount: data.reviewCount || 0,
          });
        } catch {
          reject(new Error(`CWS API parse failed: ${body.substring(0, 200)}`));
        }
      });
    }).on('error', reject);
  });
}

// ─── State Management ───────────────────────────────────────────────────────

function loadState(): MonitorState {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  }
  return {
    lastStatus: 'UNKNOWN',
    lastChecked: '',
    lastRating: 0,
    lastReviewCount: 0,
    history: [],
  };
}

function saveState(state: MonitorState): void {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ─── Alerting ───────────────────────────────────────────────────────────────

async function sendSlackAlert(payload: AlertPayload): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const color = payload.severity === 'critical' ? '#FF0000'
    : payload.severity === 'warning' ? '#FFA500' : '#36A64F';

  const slackPayload = JSON.stringify({
    attachments: [{
      color,
      title: payload.title,
      text: payload.message,
      fields: Object.entries(payload.fields || {}).map(([title, value]) => ({
        title, value, short: true,
      })),
      footer: 'Focus Mode CWS Monitor',
      ts: Math.floor(Date.now() / 1000),
    }],
  });

  const url = new URL(webhookUrl);
  return new Promise((resolve) => {
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, () => resolve());
    req.on('error', () => resolve()); // Don't fail on alert failure
    req.write(slackPayload);
    req.end();
  });
}

async function sendDiscordAlert(payload: AlertPayload): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const color = payload.severity === 'critical' ? 0xFF0000
    : payload.severity === 'warning' ? 0xFFA500 : 0x36A64F;

  const discordPayload = JSON.stringify({
    embeds: [{
      title: payload.title,
      description: payload.message,
      color,
      fields: Object.entries(payload.fields || {}).map(([name, value]) => ({
        name, value, inline: true,
      })),
      footer: { text: 'Focus Mode CWS Monitor' },
      timestamp: new Date().toISOString(),
    }],
  });

  const url = new URL(webhookUrl);
  return new Promise((resolve) => {
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, () => resolve());
    req.on('error', () => resolve());
    req.write(discordPayload);
    req.end();
  });
}

async function sendAlert(payload: AlertPayload): Promise<void> {
  console.log(`[ALERT] [${payload.severity.toUpperCase()}] ${payload.title}: ${payload.message}`);
  await Promise.all([
    sendSlackAlert(payload),
    sendDiscordAlert(payload),
  ]);
}

// ─── Main ───────────────────────────────────────────────────────────────────

(async () => {
  if (!EXTENSION_ID) {
    console.error('Set CWS_EXTENSION_ID environment variable.');
    process.exit(2);
  }

  const state = loadState();
  console.log(`Checking CWS status for extension: ${EXTENSION_ID}`);
  console.log(`Previous status: ${state.lastStatus} (checked: ${state.lastChecked || 'never'})`);

  try {
    const token = await getAccessToken();
    const current = await getExtensionStatus(token);

    console.log(`Current status: ${current.status}`);
    console.log(`Rating: ${current.rating} (${current.reviewCount} reviews)`);

    // Check for status change
    if (state.lastStatus !== 'UNKNOWN' && current.status !== state.lastStatus) {
      const severity = (['REJECTED', 'SUSPENDED', 'TAKEN_DOWN'].includes(current.status))
        ? 'critical' : 'info';

      await sendAlert({
        title: `CWS Status Changed: ${state.lastStatus} -> ${current.status}`,
        message: `Focus Mode - Blocker extension status changed on Chrome Web Store.`,
        severity,
        fields: {
          'Previous': state.lastStatus,
          'Current': current.status,
          'Extension ID': EXTENSION_ID,
        },
      });

      state.history.push({
        timestamp: new Date().toISOString(),
        status: current.status,
        event: `Status changed from ${state.lastStatus} to ${current.status}`,
      });
    }

    // Check for rating drop
    if (state.lastRating > 0 && current.rating < state.lastRating - 0.3) {
      await sendAlert({
        title: `Rating Drop Detected`,
        message: `Rating dropped from ${state.lastRating.toFixed(1)} to ${current.rating.toFixed(1)}`,
        severity: 'warning',
        fields: {
          'Previous': state.lastRating.toFixed(1),
          'Current': current.rating.toFixed(1),
          'Reviews': String(current.reviewCount),
        },
      });
    }

    // Update state
    state.lastStatus = current.status;
    state.lastChecked = new Date().toISOString();
    state.lastRating = current.rating;
    state.lastReviewCount = current.reviewCount;
    saveState(state);

    console.log('Monitor check complete. State saved.');
  } catch (err) {
    console.error('Monitor error:', err);
    await sendAlert({
      title: 'CWS Monitor Error',
      message: `Monitor script failed: ${err instanceof Error ? err.message : String(err)}`,
      severity: 'warning',
    });
    process.exit(1);
  }
})();
```

#### Scheduled Monitoring (GitHub Actions cron)

```yaml
# .github/workflows/cws-monitor.yml
name: CWS Status Monitor

on:
  schedule:
    - cron: '0 */4 * * *'  # Every 4 hours
  workflow_dispatch: # Manual trigger

jobs:
  monitor:
    name: Check CWS Status
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx ts-node scripts/monitor-cws-status.ts
        env:
          CWS_EXTENSION_ID: ${{ secrets.CWS_EXTENSION_ID }}
          CWS_CLIENT_ID: ${{ secrets.CWS_CLIENT_ID }}
          CWS_CLIENT_SECRET: ${{ secrets.CWS_CLIENT_SECRET }}
          CWS_REFRESH_TOKEN: ${{ secrets.CWS_REFRESH_TOKEN }}
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
          DISCORD_WEBHOOK_URL: ${{ secrets.DISCORD_WEBHOOK_URL }}
```

#### Alert Thresholds

| Event | Severity | Channel | Action |
|-------|----------|---------|--------|
| Status -> PUBLISHED | Info | Slack/Discord | Log |
| Status -> PENDING_REVIEW | Info | Slack/Discord | Log, track duration |
| Status -> REJECTED | Critical | All channels | Invoke emergency playbook |
| Status -> SUSPENDED | Critical | All channels | Invoke takedown response |
| Status -> TAKEN_DOWN | Critical | All channels | Invoke takedown response |
| Rating drops > 0.3 | Warning | Slack/Discord | Review recent reviews |
| Rating drops below 4.0 | Critical | All channels | Review triage |
| Monitor script error | Warning | Slack/Discord | Check credentials |

---

### B.2 User Review Monitor

Automated system for tracking and categorizing user reviews. Designed to detect policy-relevant feedback early.

#### Review Scraping Schedule

Run daily via cron. The CWS does not provide a reviews API, so we use the public-facing review page.

```typescript
/**
 * Simplified review monitoring approach.
 *
 * Since CWS does not have a public reviews API, we use the
 * Chrome Web Store detail page and parse reviews from the HTML.
 *
 * In practice, a more robust approach uses:
 *   - CWS detail page scraping (fragile, may break)
 *   - Google Play Developer API (for Android companion, if applicable)
 *   - Manual daily check as fallback
 *
 * Below is the classification logic for any review source.
 */

interface Review {
  id: string;
  author: string;
  rating: number; // 1-5
  text: string;
  date: string;
  language: string;
}

type ReviewCategory = 'bug' | 'feature_request' | 'complaint' | 'praise' | 'compliance_concern' | 'spam';

const CLASSIFICATION_RULES: Array<{ category: ReviewCategory; patterns: RegExp[] }> = [
  {
    category: 'compliance_concern',
    patterns: [
      /spy|spying|tracking|privacy|data|steal|malware|virus|suspicious/i,
      /permissions?\s+(too|excessive|unnecessary)/i,
      /why\s+does\s+it\s+need/i,
      /uninstall|removed?\s+it/i,
    ],
  },
  {
    category: 'bug',
    patterns: [
      /crash|broken|not\s+work|doesn't\s+work|bug|error|freeze/i,
      /white\s+screen|blank|stuck|loop/i,
    ],
  },
  {
    category: 'feature_request',
    patterns: [
      /wish|would\s+be\s+(nice|great)|please\s+add|feature|suggest/i,
      /can\s+you\s+add|support\s+for/i,
    ],
  },
  {
    category: 'complaint',
    patterns: [
      /terrible|awful|worst|waste|useless|horrible|garbage|trash/i,
      /pay|expensive|scam|money/i,
    ],
  },
  {
    category: 'praise',
    patterns: [
      /love|great|amazing|excellent|perfect|best|awesome|fantastic/i,
      /thank|recommend|helpful|life\s*saver/i,
    ],
  },
];

function classifyReview(review: Review): ReviewCategory {
  for (const rule of CLASSIFICATION_RULES) {
    if (rule.patterns.some(p => p.test(review.text))) {
      return rule.category;
    }
  }
  return review.rating >= 4 ? 'praise' : review.rating <= 2 ? 'complaint' : 'praise';
}

function shouldAlert(review: Review, category: ReviewCategory): boolean {
  // Alert on reviews that may signal compliance issues
  if (category === 'compliance_concern') return true;
  if (review.rating <= 2) return true;
  return false;
}
```

#### Review Alert Priority

| Rating | Category | Alert? | Response Time |
|--------|----------|--------|---------------|
| 1-2 | compliance_concern | Immediate | 2 hours |
| 1-2 | bug | Same day | 24 hours |
| 1-2 | complaint | Same day | 24 hours |
| 3 | compliance_concern | Same day | 24 hours |
| 3-5 | bug | Log | Weekly review |
| 3-5 | feature_request | Log | Weekly review |
| 4-5 | praise | Log | No response needed |

---

### B.3 Policy Change Monitor

Chrome Web Store policies change periodically. This monitor tracks the documentation pages for changes and alerts when relevant policies are updated.

#### Monitored URLs

| URL | What It Covers | Check Frequency |
|-----|---------------|-----------------|
| `developer.chrome.com/docs/webstore/program-policies` | Program policies | Daily |
| `developer.chrome.com/docs/webstore/review-process` | Review process | Weekly |
| `developer.chrome.com/docs/extensions/develop/migrate` | MV3 migration timeline | Weekly |
| `developer.chrome.com/docs/webstore/best_practices` | Best practices | Weekly |
| `developer.chrome.com/docs/extensions/reference/permissions-list` | Permission requirements | Weekly |

#### Implementation Approach

```typescript
/**
 * Policy change detection via content hashing.
 *
 * For each monitored URL:
 * 1. Fetch page content
 * 2. Strip HTML, normalize whitespace
 * 3. Compute SHA-256 hash
 * 4. Compare to stored hash
 * 5. If changed: alert + store new hash + diff
 *
 * Store hashes in: .policy-monitor-state.json
 * Run as daily cron via GitHub Actions
 */

interface PolicyState {
  url: string;
  lastHash: string;
  lastChecked: string;
  lastChanged: string;
}

// On change detected:
// 1. Send alert with URL and date
// 2. Save plain-text snapshot for diffing
// 3. Trigger full compliance re-check against new policies
// 4. Create GitHub issue for manual policy review
```

#### Policy Change Response Workflow

```
Policy change detected
        |
        v
  Alert team (Slack/Discord)
        |
        v
  Create GitHub issue: "CWS Policy Update Review"
        |
        v
  Automated compliance re-check
        |
        v
  Is extension still compliant?
       / \
     Yes   No
      |     |
      v     v
    Close  Prioritize fix
    issue  (update manifest, privacy policy, etc.)
```

---

## Section C: Documentation Templates Repository

### C.1 Store Listing Templates

Pre-written store listing content for Focus Mode - Blocker. Having variants ready means instant recovery if the primary listing text is rejected.

#### Extension Name Variants

| Priority | Name | Characters | Notes |
|----------|------|-----------|-------|
| Primary | Focus Mode - Blocker | 20 | Clear, descriptive, keyword-rich |
| Alt 1 | Focus Mode: Website Blocker | 27 | More explicit |
| Alt 2 | Focus Blocker - Block Sites & Stay Focused | 42 | Long-tail keywords |
| Alt 3 | Focus Mode - Site Blocker & Focus Timer | 39 | Includes timer keyword |
| Fallback | FocusMode | 9 | Minimal, if all descriptive names rejected |

#### Short Description (max 132 characters) — 3 Variants

**Variant A (Primary — 128 chars):**
> Block distracting websites, build focus streaks, and track your productivity with Pomodoro timer. Privacy-first. No data leaves.

**Variant B (Feature-focused — 130 chars):**
> Website blocker with Pomodoro timer, Focus Score, and streak tracking. Block any site. All data stays on your device. Free to use.

**Variant C (Benefit-focused — 126 chars):**
> Stop wasting time on distracting sites. Block them, start a focus session, and watch your productivity score climb. 100% private.

#### Long Description (Structured for CWS)

```
Focus Mode - Blocker helps you eliminate digital distractions and build lasting focus habits. Block distracting websites with one click, start Pomodoro-style focus sessions, and track your progress with Focus Score — a personalized productivity metric.

HOW IT WORKS
- Add sites to your blocklist (up to 10 free, unlimited with Pro)
- Start a focus session with customizable timer
- Blocked sites show a motivational page with your stats
- Build streaks and watch your Focus Score improve

KEY FEATURES
Block Distracting Sites — Add any website to your blocklist. When you visit a blocked site, you see a motivational page instead of the distraction.

Focus Timer — Built-in Pomodoro timer (25/5 default, customizable). Start a session and stay focused with break reminders.

Focus Score — A 0-100 score that measures your focus quality based on session completion, blocked attempts, streak consistency, and active focus time.

Streak Tracking — Build daily streaks. See your current streak, longest streak, and streak calendar.

Smart Block Page — Not just a blank wall. Your block page shows time saved, distractions blocked, your current streak, and rotating motivational quotes.

Quick Focus Presets — Pre-built blocklists for social media, news, entertainment, and shopping sites.

PRIVACY FIRST
Your data never leaves your device. Focus Mode - Blocker stores everything locally using Chrome's built-in storage. No accounts required for free tier. No tracking. No analytics. No external servers.

FREE VS PRO
Free: 10 sites, 2 lists, Pomodoro timer, daily stats, Focus Score, streaks
Pro ($4.99/mo): Unlimited sites, advanced reports, schedule-based blocking, Nuclear Mode, ambient sounds, cross-device sync, and more

PERMISSIONS EXPLAINED
Focus Mode needs access to websites you visit ONLY to check if they are on YOUR blocklist and redirect you to the block page. We never read, collect, or transmit page content. See our privacy policy for full details.

SUPPORT
Questions or issues? Email support@focusmode.app or visit our help center.
```

#### Category Justification

**Primary Category:** Productivity
**Justification:** Focus Mode - Blocker is a website blocking and focus session management tool. Its sole purpose is to help users avoid distracting websites and build productive focus habits, which places it squarely in the Productivity category alongside tools like StayFocusd, BlockSite, and Cold Turkey.

---

### C.2 Permission Justification Quick Reference

One-page cheat sheet with the exact text to paste into the CWS submission form for each permission.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│           FOCUS MODE - BLOCKER: PERMISSION JUSTIFICATIONS                  │
│                     Quick Reference for CWS Submission                     │
├──────────────────────┬──────────────────────────────────────────────────────┤
│ Permission           │ Justification (paste into CWS form)                 │
├──────────────────────┼──────────────────────────────────────────────────────┤
│ storage              │ Stores user blocklist, focus session history, Focus  │
│                      │ Score, streak data, and settings locally on device.  │
│                      │ No data transmitted externally.                      │
├──────────────────────┼──────────────────────────────────────────────────────┤
│ alarms               │ Powers the focus timer (Pomodoro ticks), schedules   │
│                      │ block rule activation, periodic storage cleanup,     │
│                      │ and license checks. Required because MV3 service     │
│                      │ workers do not support setInterval.                  │
├──────────────────────┼──────────────────────────────────────────────────────┤
│ tabs                 │ Queries active tab URL to check against user         │
│                      │ blocklist, sends messages to content scripts for     │
│                      │ visual blocking overlay, opens block page on         │
│                      │ navigation to blocked sites.                         │
├──────────────────────┼──────────────────────────────────────────────────────┤
│ activeTab            │ Enables on-demand content script injection into      │
│                      │ the current tab when user visits a blocked site,     │
│                      │ without requiring persistent host access.            │
├──────────────────────┼──────────────────────────────────────────────────────┤
│ declarativeNetRequest│ Core blocking engine. Registers redirect rules       │
│                      │ that intercept navigation to user-configured         │
│                      │ blocked domains and redirect to the motivational     │
│                      │ block page. All rules are user-configured.           │
├──────────────────────┼──────────────────────────────────────────────────────┤
│ notifications        │ Sends focus session start/end notifications,         │
│                      │ streak milestone alerts, and Pomodoro break          │
│                      │ reminders. User can disable in settings.             │
├──────────────────────┼──────────────────────────────────────────────────────┤
│ offscreen            │ Creates offscreen document for ambient sound         │
│                      │ playback during focus sessions. Required because     │
│                      │ MV3 service workers cannot play audio directly.      │
├──────────────────────┼──────────────────────────────────────────────────────┤
│ scripting            │ Programmatically injects blocker content script      │
│                      │ into tabs visiting blocked sites. Provides instant   │
│                      │ visual blocking before DNR redirect completes.       │
├──────────────────────┼──────────────────────────────────────────────────────┤
│ <all_urls>           │ Users configure their own blocklist of any website.  │
│ (host permission)    │ Extension must redirect navigation to ANY domain     │
│                      │ the user chooses to block. Standard for website      │
│                      │ blocker extensions. No page content is read.         │
├──────────────────────┼──────────────────────────────────────────────────────┤
│ identity (optional)  │ Pro feature: authenticates user for license          │
│                      │ verification and cross-device sync. Requested        │
│                      │ only when user upgrades. Not used in free tier.      │
├──────────────────────┼──────────────────────────────────────────────────────┤
│ idle (optional)      │ Pro feature: detects user idle state to auto-pause   │
│                      │ focus sessions and track active time accurately.     │
│                      │ Requested only on Pro upgrade.                       │
├──────────────────────┼──────────────────────────────────────────────────────┤
│ tabGroups (optional) │ Pro feature: organizes tabs into focus groups        │
│                      │ during sessions. Reduces visual distraction.         │
│                      │ Requested only on Pro upgrade.                       │
└──────────────────────┴──────────────────────────────────────────────────────┘
```

---

### C.3 Rejection Response Decision Tree

ASCII flowchart for handling any CWS rejection. Follow the tree from the top to determine the correct response.

```
                        ┌─────────────────────┐
                        │  REJECTION RECEIVED  │
                        └──────────┬──────────┘
                                   │
                        ┌──────────▼──────────┐
                        │  Read rejection      │
                        │  email carefully.    │
                        │  Identify specific   │
                        │  policy cited.       │
                        └──────────┬──────────┘
                                   │
                   ┌───────────────┼───────────────┐
                   │               │               │
            ┌──────▼──────┐ ┌─────▼─────┐ ┌──────▼──────┐
            │ Clear code  │ │ Ambiguous │ │ Completely  │
            │ violation   │ │ / vague   │ │ false /     │
            │ identified  │ │ reason    │ │ incorrect   │
            └──────┬──────┘ └─────┬─────┘ └──────┬──────┘
                   │              │               │
            ┌──────▼──────┐ ┌────▼─────┐  ┌──────▼──────┐
            │ FIX IT      │ │ REQUEST  │  │ APPEAL      │
            │             │ │ CLARITY  │  │             │
            │ 1. Fix code │ │          │  │ 1. Gather   │
            │ 2. Run CI   │ │ Reply to │  │    evidence │
            │    checks   │ │ rejection│  │ 2. Select   │
            │ 3. Test     │ │ asking   │  │    appeal   │
            │    locally  │ │ for the  │  │    template │
            │ 4. Resubmit │ │ specific │  │ 3. Write    │
            │             │ │ line/file│  │    detailed │
            │ Use Agent 1 │ │ or policy│  │    response │
            │ risk matrix │ │ section  │  │ 4. Submit   │
            │ to verify   │ │          │  │    appeal   │
            │ full fix    │ │ Wait 48h │  │             │
            └──────┬──────┘ └────┬─────┘  │ Use Agent 2 │
                   │              │        │ templates   │
                   │         ┌────▼─────┐  └──────┬──────┘
                   │         │ Got      │         │
                   │         │ clarity? │         │
                   │         └────┬─────┘         │
                   │           /     \            │
                   │         Yes      No          │
                   │          │        │          │
                   │    ┌─────▼──┐ ┌───▼────┐    │
                   │    │Fix or  │ │Escalate│    │
                   │    │Appeal  │ │via CWS │    │
                   │    │(loop   │ │support │    │
                   │    │back)   │ │form    │    │
                   │    └────────┘ └────────┘    │
                   │                              │
                   └──────────────┬───────────────┘
                                  │
                       ┌──────────▼──────────┐
                       │  AFTER SUBMISSION    │
                       │                      │
                       │  1. Monitor status   │
                       │     (B.1 script)     │
                       │  2. Wait 3-7 days    │
                       │  3. If approved:     │
                       │     close incident   │
                       │  4. If re-rejected:  │
                       │     escalate or      │
                       │     pivot strategy   │
                       └──────────┬──────────┘
                                  │
                      ┌───────────┼───────────┐
                      │           │           │
               ┌──────▼──────┐   │    ┌──────▼──────┐
               │ Approved    │   │    │ Re-rejected │
               │             │   │    │             │
               │ 1. Verify   │   │    │ 1. Review   │
               │    listing  │   │    │    new msg   │
               │ 2. Monitor  │   │    │ 2. Consider │
               │    reviews  │   │    │    alt dist  │
               │ 3. Document │   │    │    (Agent 4) │
               │    lesson   │   │    │ 3. Modify   │
               │             │   │    │    extension │
               └─────────────┘   │    │ 4. Resubmit │
                                 │    └─────────────┘
                          ┌──────▼──────┐
                          │ Still in    │
                          │ review      │
                          │ (>7 days)   │
                          │             │
                          │ File CWS    │
                          │ support     │
                          │ inquiry     │
                          └─────────────┘
```

#### Decision Matrix: Fix vs. Appeal

| Rejection Reason | Is violation real? | Fix difficulty | Recommended Path |
|-----------------|-------------------|----------------|-----------------|
| Unused permission | Yes | Low (remove it) | Fix and resubmit |
| Missing privacy policy | Yes | Medium (publish one) | Fix and resubmit |
| Keyword stuffing | Maybe | Low (rewrite desc) | Fix and resubmit |
| Deceptive behavior | Probably false | N/A | Appeal with evidence |
| Remote code execution | Check carefully | Medium-High | Fix if real, appeal if false |
| Single purpose violation | Maybe | Depends | Rewrite description, then appeal if needed |
| `<all_urls>` questioned | False (standard for blockers) | N/A | Appeal — cite competitor precedent |
| Content policy violation | Check block page | Low-Medium | Fix if real, appeal if false |

---

## Appendix: Script Execution Summary

### Running All Validators

```bash
# Full pre-submission check (run after `npm run build`)
npx ts-node scripts/validate-cws-compliance.ts

# Permission audit only
npx ts-node scripts/audit-permissions.ts

# Privacy policy check
npx ts-node scripts/validate-privacy-policy.ts https://focusmode.app/privacy

# JSON output (for CI pipelines)
npx ts-node scripts/validate-cws-compliance.ts --json
npx ts-node scripts/audit-permissions.ts --json
```

### Adding to package.json

```json
{
  "scripts": {
    "validate:cws": "ts-node scripts/validate-cws-compliance.ts",
    "validate:permissions": "ts-node scripts/audit-permissions.ts",
    "validate:privacy": "ts-node scripts/validate-privacy-policy.ts",
    "validate:all": "npm run validate:cws && npm run validate:permissions",
    "presubmit": "npm run build && npm run validate:all"
  }
}
```

### Required Environment Variables

| Variable | Required For | Where to Set |
|----------|-------------|--------------|
| `PRIVACY_POLICY_URL` | Privacy validator, CWS compliance check | `.env`, CI secrets |
| `CWS_EXTENSION_ID` | Status monitor | CI secrets |
| `CWS_CLIENT_ID` | Status monitor (CWS API auth) | CI secrets |
| `CWS_CLIENT_SECRET` | Status monitor (CWS API auth) | CI secrets |
| `CWS_REFRESH_TOKEN` | Status monitor (CWS API auth) | CI secrets |
| `SLACK_WEBHOOK_URL` | Slack alerts | CI secrets |
| `DISCORD_WEBHOOK_URL` | Discord alerts | CI secrets |

---

*Agent 5 — Prevention Automation & Monitoring — Complete*
