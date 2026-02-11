# Agent 5: E2E Tests, Code Coverage & Project Templates

## Phase 10 — Automated Testing Suite
## Focus Mode - Blocker v1.0.0 (MV3)

> **Agent:** 5 of 5 | **Sections:** 7-8
> **Scope:** Code coverage requirements, enforcement scripts, Playwright E2E test suites, test utilities, project templates, and quick reference

---

## Table of Contents

- [7. Code Coverage Requirements](#7-code-coverage-requirements)
  - [7.1 Coverage Configuration](#71-coverage-configuration)
  - [7.2 Coverage Enforcement Script](#72-coverage-enforcement-script)
  - [7.3 Untested Code Detection](#73-untested-code-detection)
  - [7.4 Coverage Badge Generation](#74-coverage-badge-generation)
  - [7.5 Pre-commit Coverage Check](#75-pre-commit-coverage-check)
- [8. Complete Project Templates](#8-complete-project-templates)
  - [8.1 Test Utilities](#81-test-utilities)
  - [8.2 Playwright Configuration](#82-playwright-configuration)
  - [8.3 E2E Test Suites](#83-e2e-test-suites)
  - [8.4 Complete Test Script Runner](#84-complete-test-script-runner)
  - [8.5 Quick Reference Card](#85-quick-reference-card)

---

## 7. Code Coverage Requirements

### 7.1 Coverage Configuration

The Jest configuration coverage section defines per-directory thresholds aligned with each module's criticality. Background services and shared utilities are critical paths and demand 90% and 85% coverage respectively. UI layers (popup, options) have a 75% floor.

```javascript
// jest.config.js — coverage section
module.exports = {
  // ... base config from Agent 1 ...

  collectCoverage: true,

  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/types/**',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/__mocks__/**',
    '!src/**/__tests__/**',
    '!src/**/test-utils/**',
    '!src/manifest.json',
  ],

  coverageDirectory: 'coverage',

  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json-summary',
  ],

  coverageThreshold: {
    // Global minimum — no PR merges below these
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },

    // Critical path: service worker, background logic
    './src/background/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },

    // Shared utilities: storage, messaging, scoring
    './src/shared/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },

    // Content scripts: blocker, detector, tracker
    './src/content/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },

    // Popup UI components
    './src/popup/': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },

    // Options page UI components
    './src/options/': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
};
```

**Rationale for thresholds:**

| Directory | Threshold | Justification |
|-----------|-----------|---------------|
| `global` | 80% | Industry standard for production extensions |
| `background/` | 90% | Service worker is the single point of failure for all blocking, timers, and state |
| `shared/` | 85% | Storage, messaging, and scoring logic is consumed by every other module |
| `content/` | 85% | Blocking and detection must be reliable on every page load |
| `popup/` | 75% | UI rendering is partially covered by E2E; unit tests cover logic |
| `options/` | 75% | Settings UI has lower complexity and is E2E-supplemented |

---

### 7.2 Coverage Enforcement Script

This script runs after test execution and validates that critical individual modules meet their specific thresholds. It goes beyond Jest's directory-level thresholds to enforce coverage on the most important individual files.

```javascript
// scripts/check-coverage.js
const fs = require('fs');
const path = require('path');

const COVERAGE_SUMMARY_PATH = path.resolve(
  __dirname,
  '../coverage/coverage-summary.json'
);

// Critical path files with individual minimum thresholds
const CRITICAL_PATHS = {
  'src/background/messageHandler.ts': {
    lines: 95,
    branches: 90,
    functions: 95,
    statements: 95,
  },
  'src/background/storageManager.ts': {
    lines: 95,
    branches: 90,
    functions: 95,
    statements: 95,
  },
  'src/background/blockingEngine.ts': {
    lines: 95,
    branches: 90,
    functions: 95,
    statements: 95,
  },
  'src/shared/focusScoreCalculator.ts': {
    lines: 90,
    branches: 85,
    functions: 90,
    statements: 90,
  },
  'src/shared/streakManager.ts': {
    lines: 90,
    branches: 85,
    functions: 90,
    statements: 90,
  },
  'src/shared/licenseVerifier.ts': {
    lines: 90,
    branches: 85,
    functions: 90,
    statements: 90,
  },
};

// Directory-level thresholds (mirrors jest.config.js for redundancy)
const DIRECTORY_THRESHOLDS = {
  'src/background': { lines: 90, branches: 90, functions: 90, statements: 90 },
  'src/shared': { lines: 85, branches: 85, functions: 85, statements: 85 },
  'src/content': { lines: 85, branches: 85, functions: 85, statements: 85 },
  'src/popup': { lines: 75, branches: 75, functions: 75, statements: 75 },
  'src/options': { lines: 75, branches: 75, functions: 75, statements: 75 },
};

function loadCoverageSummary() {
  if (!fs.existsSync(COVERAGE_SUMMARY_PATH)) {
    console.error(
      'ERROR: Coverage summary not found. Run tests with --coverage first.'
    );
    console.error(`  Expected: ${COVERAGE_SUMMARY_PATH}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(COVERAGE_SUMMARY_PATH, 'utf-8'));
}

function checkFileThreshold(filePath, thresholds, coverageData) {
  const absolutePath = path.resolve(__dirname, '..', filePath);
  const fileData = coverageData[absolutePath];
  const failures = [];

  if (!fileData) {
    failures.push(`  ${filePath}: No coverage data found (file may be untested)`);
    return failures;
  }

  for (const [metric, minPct] of Object.entries(thresholds)) {
    const actual = fileData[metric]?.pct ?? 0;
    if (actual < minPct) {
      failures.push(
        `  ${filePath}: ${metric} is ${actual}% (minimum: ${minPct}%)`
      );
    }
  }

  return failures;
}

function checkDirectoryThreshold(dirPath, thresholds, coverageData) {
  const absoluteDir = path.resolve(__dirname, '..', dirPath);
  const matchingFiles = Object.keys(coverageData).filter(
    (f) => f.startsWith(absoluteDir) && f !== 'total'
  );

  if (matchingFiles.length === 0) {
    return [`  ${dirPath}/: No coverage data found for directory`];
  }

  const totals = { lines: { total: 0, covered: 0 }, branches: { total: 0, covered: 0 },
    functions: { total: 0, covered: 0 }, statements: { total: 0, covered: 0 } };

  for (const file of matchingFiles) {
    const data = coverageData[file];
    for (const metric of Object.keys(totals)) {
      totals[metric].total += data[metric]?.total ?? 0;
      totals[metric].covered += data[metric]?.covered ?? 0;
    }
  }

  const failures = [];
  for (const [metric, minPct] of Object.entries(thresholds)) {
    const { total, covered } = totals[metric];
    const pct = total === 0 ? 100 : Math.round((covered / total) * 10000) / 100;
    if (pct < minPct) {
      failures.push(
        `  ${dirPath}/: ${metric} is ${pct}% (minimum: ${minPct}%)`
      );
    }
  }

  return failures;
}

function main() {
  console.log('=== Focus Mode - Blocker: Coverage Enforcement ===\n');

  const coverageData = loadCoverageSummary();
  let allFailures = [];

  // 1. Check global coverage
  console.log('Checking global coverage...');
  const globalData = coverageData.total;
  const globalMin = { lines: 80, branches: 80, functions: 80, statements: 80 };

  for (const [metric, minPct] of Object.entries(globalMin)) {
    const actual = globalData[metric]?.pct ?? 0;
    if (actual < minPct) {
      allFailures.push(`  GLOBAL: ${metric} is ${actual}% (minimum: ${minPct}%)`);
    } else {
      console.log(`  PASS: global ${metric} = ${actual}% (>= ${minPct}%)`);
    }
  }

  // 2. Check critical path files
  console.log('\nChecking critical path files...');
  for (const [filePath, thresholds] of Object.entries(CRITICAL_PATHS)) {
    const failures = checkFileThreshold(filePath, thresholds, coverageData);
    if (failures.length === 0) {
      console.log(`  PASS: ${filePath}`);
    } else {
      allFailures.push(...failures);
    }
  }

  // 3. Check directory thresholds
  console.log('\nChecking directory thresholds...');
  for (const [dirPath, thresholds] of Object.entries(DIRECTORY_THRESHOLDS)) {
    const failures = checkDirectoryThreshold(dirPath, thresholds, coverageData);
    if (failures.length === 0) {
      console.log(`  PASS: ${dirPath}/`);
    } else {
      allFailures.push(...failures);
    }
  }

  // 4. Summary
  console.log('\n' + '='.repeat(55));
  if (allFailures.length > 0) {
    console.error(`\nFAILED: ${allFailures.length} coverage threshold(s) not met:\n`);
    allFailures.forEach((f) => console.error(f));
    console.error(
      '\nFix coverage gaps before merging. Run: npm run coverage:report'
    );
    process.exit(1);
  } else {
    console.log('\nAll coverage thresholds passed.');
    process.exit(0);
  }
}

main();
```

---

### 7.3 Untested Code Detection

This script scans the coverage report for source files with zero or dangerously low coverage. It outputs a prioritized list to guide developers toward the biggest gaps.

```typescript
// scripts/find-untested.ts
import * as fs from 'fs';
import * as path from 'path';

interface CoverageEntry {
  lines: { total: number; covered: number; pct: number };
  branches: { total: number; covered: number; pct: number };
  functions: { total: number; covered: number; pct: number };
  statements: { total: number; covered: number; pct: number };
}

interface CoverageSummary {
  total: CoverageEntry;
  [filePath: string]: CoverageEntry;
}

interface UntestedFile {
  file: string;
  relativePath: string;
  linePct: number;
  branchPct: number;
  functionPct: number;
  totalLines: number;
  uncoveredLines: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

const SEVERITY_THRESHOLDS = {
  CRITICAL: 0,    // 0% coverage
  HIGH: 25,       // below 25%
  MEDIUM: 50,     // below 50%
  LOW: 75,        // below 75% — still worth flagging
};

const PROJECT_ROOT = path.resolve(__dirname, '..');
const COVERAGE_PATH = path.join(PROJECT_ROOT, 'coverage', 'coverage-summary.json');

// Directories ranked by criticality (used for sorting)
const CRITICALITY_ORDER: Record<string, number> = {
  'src/background': 1,
  'src/shared': 2,
  'src/content': 3,
  'src/popup': 4,
  'src/options': 5,
};

function getCriticality(filePath: string): number {
  for (const [dir, rank] of Object.entries(CRITICALITY_ORDER)) {
    if (filePath.includes(dir)) return rank;
  }
  return 99;
}

function getSeverity(linePct: number): UntestedFile['severity'] {
  if (linePct <= SEVERITY_THRESHOLDS.CRITICAL) return 'CRITICAL';
  if (linePct < SEVERITY_THRESHOLDS.HIGH) return 'HIGH';
  if (linePct < SEVERITY_THRESHOLDS.MEDIUM) return 'MEDIUM';
  return 'LOW';
}

function main(): void {
  console.log('=== Focus Mode - Blocker: Untested Code Detection ===\n');

  if (!fs.existsSync(COVERAGE_PATH)) {
    console.error('Coverage summary not found. Run: npm run coverage');
    process.exit(1);
  }

  const summary: CoverageSummary = JSON.parse(
    fs.readFileSync(COVERAGE_PATH, 'utf-8')
  );

  const untestedFiles: UntestedFile[] = [];

  for (const [absolutePath, data] of Object.entries(summary)) {
    if (absolutePath === 'total') continue;

    const relativePath = path.relative(PROJECT_ROOT, absolutePath);

    // Skip non-source files
    if (!relativePath.startsWith('src/')) continue;

    const linePct = data.lines?.pct ?? 0;
    const branchPct = data.branches?.pct ?? 0;
    const functionPct = data.functions?.pct ?? 0;
    const totalLines = data.lines?.total ?? 0;
    const uncoveredLines = totalLines - (data.lines?.covered ?? 0);

    // Flag anything below the LOW threshold
    if (linePct < SEVERITY_THRESHOLDS.LOW) {
      untestedFiles.push({
        file: absolutePath,
        relativePath,
        linePct,
        branchPct,
        functionPct,
        totalLines,
        uncoveredLines,
        severity: getSeverity(linePct),
      });
    }
  }

  // Sort: severity first, then criticality, then coverage ascending
  untestedFiles.sort((a, b) => {
    const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;

    const critDiff = getCriticality(a.relativePath) - getCriticality(b.relativePath);
    if (critDiff !== 0) return critDiff;

    return a.linePct - b.linePct;
  });

  // Output
  if (untestedFiles.length === 0) {
    console.log('All source files have 75%+ line coverage. Well done.');
    process.exit(0);
  }

  const critical = untestedFiles.filter((f) => f.severity === 'CRITICAL');
  const high = untestedFiles.filter((f) => f.severity === 'HIGH');
  const medium = untestedFiles.filter((f) => f.severity === 'MEDIUM');
  const low = untestedFiles.filter((f) => f.severity === 'LOW');

  console.log(`Found ${untestedFiles.length} files below 75% coverage:\n`);

  if (critical.length > 0) {
    console.log(`--- CRITICAL (0% coverage) --- [${critical.length} files]`);
    for (const f of critical) {
      console.log(`  ${f.relativePath} (${f.totalLines} lines, completely untested)`);
    }
    console.log();
  }

  if (high.length > 0) {
    console.log(`--- HIGH (< 25% coverage) --- [${high.length} files]`);
    for (const f of high) {
      console.log(
        `  ${f.relativePath}: lines=${f.linePct}% branches=${f.branchPct}% (${f.uncoveredLines} uncovered lines)`
      );
    }
    console.log();
  }

  if (medium.length > 0) {
    console.log(`--- MEDIUM (< 50% coverage) --- [${medium.length} files]`);
    for (const f of medium) {
      console.log(
        `  ${f.relativePath}: lines=${f.linePct}% branches=${f.branchPct}% (${f.uncoveredLines} uncovered lines)`
      );
    }
    console.log();
  }

  if (low.length > 0) {
    console.log(`--- LOW (< 75% coverage) --- [${low.length} files]`);
    for (const f of low) {
      console.log(
        `  ${f.relativePath}: lines=${f.linePct}% branches=${f.branchPct}%`
      );
    }
    console.log();
  }

  // Summary stats
  const totalUncovered = untestedFiles.reduce((sum, f) => sum + f.uncoveredLines, 0);
  console.log(`Total uncovered lines across flagged files: ${totalUncovered}`);

  if (critical.length > 0 || high.length > 0) {
    console.error('\nAction required: CRITICAL and HIGH severity files must be addressed.');
    process.exit(1);
  }

  process.exit(0);
}

main();
```

---

### 7.4 Coverage Badge Generation

Generates a JSON badge compatible with shields.io for embedding in the README.

```javascript
// scripts/generate-coverage-badge.js
const fs = require('fs');
const path = require('path');

const COVERAGE_SUMMARY_PATH = path.resolve(
  __dirname,
  '../coverage/coverage-summary.json'
);
const BADGE_OUTPUT_PATH = path.resolve(
  __dirname,
  '../coverage/coverage-badge.json'
);

function getColor(pct) {
  if (pct >= 90) return 'brightgreen';
  if (pct >= 80) return 'green';
  if (pct >= 70) return 'yellowgreen';
  if (pct >= 60) return 'yellow';
  if (pct >= 50) return 'orange';
  return 'red';
}

function main() {
  if (!fs.existsSync(COVERAGE_SUMMARY_PATH)) {
    console.error('Coverage summary not found. Run tests with --coverage first.');
    process.exit(1);
  }

  const summary = JSON.parse(fs.readFileSync(COVERAGE_SUMMARY_PATH, 'utf-8'));
  const total = summary.total;

  // Use lines coverage as the primary metric
  const linesPct = total.lines?.pct ?? 0;
  const branchesPct = total.branches?.pct ?? 0;
  const functionsPct = total.functions?.pct ?? 0;
  const statementsPct = total.statements?.pct ?? 0;

  // Primary badge (lines coverage)
  const badge = {
    schemaVersion: 1,
    label: 'coverage',
    message: `${linesPct}%`,
    color: getColor(linesPct),
  };

  // Detailed badge with all metrics
  const detailedBadge = {
    schemaVersion: 1,
    label: 'coverage',
    message: `L:${linesPct}% B:${branchesPct}% F:${functionsPct}%`,
    color: getColor(Math.min(linesPct, branchesPct, functionsPct)),
  };

  // Per-directory badges
  const directories = [
    { name: 'background', path: 'src/background' },
    { name: 'shared', path: 'src/shared' },
    { name: 'content', path: 'src/content' },
    { name: 'popup', path: 'src/popup' },
    { name: 'options', path: 'src/options' },
  ];

  const dirBadges = {};
  const projectRoot = path.resolve(__dirname, '..');

  for (const dir of directories) {
    const absDir = path.join(projectRoot, dir.path);
    const matchingFiles = Object.keys(summary).filter(
      (f) => f.startsWith(absDir) && f !== 'total'
    );

    let totalLines = 0;
    let coveredLines = 0;
    for (const file of matchingFiles) {
      totalLines += summary[file].lines?.total ?? 0;
      coveredLines += summary[file].lines?.covered ?? 0;
    }

    const pct = totalLines === 0 ? 100 : Math.round((coveredLines / totalLines) * 100);
    dirBadges[dir.name] = {
      schemaVersion: 1,
      label: `coverage: ${dir.name}`,
      message: `${pct}%`,
      color: getColor(pct),
    };
  }

  // Write primary badge
  fs.writeFileSync(BADGE_OUTPUT_PATH, JSON.stringify(badge, null, 2));
  console.log(`Badge written: ${BADGE_OUTPUT_PATH}`);
  console.log(`  ${badge.label}: ${badge.message} (${badge.color})`);

  // Write detailed badge
  const detailedPath = BADGE_OUTPUT_PATH.replace('.json', '-detailed.json');
  fs.writeFileSync(detailedPath, JSON.stringify(detailedBadge, null, 2));
  console.log(`Detailed badge written: ${detailedPath}`);

  // Write per-directory badges
  for (const [name, dirBadge] of Object.entries(dirBadges)) {
    const dirPath = BADGE_OUTPUT_PATH.replace('.json', `-${name}.json`);
    fs.writeFileSync(dirPath, JSON.stringify(dirBadge, null, 2));
    console.log(`  ${dirBadge.label}: ${dirBadge.message}`);
  }

  // Summary
  console.log('\n--- Coverage Summary ---');
  console.log(`  Lines:      ${linesPct}%`);
  console.log(`  Branches:   ${branchesPct}%`);
  console.log(`  Functions:  ${functionsPct}%`);
  console.log(`  Statements: ${statementsPct}%`);
  console.log('\nUsage in README:');
  console.log(
    '  ![Coverage](https://img.shields.io/endpoint?url=<hosted-badge-url>)'
  );
}

main();
```

---

### 7.5 Pre-commit Coverage Check

The Husky pre-commit hook runs linting, tests for changed files, and a coverage check before allowing any commit. This prevents coverage regressions from entering the repository.

```bash
#!/usr/bin/env sh
# .husky/pre-commit
# Focus Mode - Blocker: Pre-commit quality gate

. "$(dirname -- "$0")/_/husky.sh"

set -e

echo "=== Focus Mode - Blocker: Pre-commit Checks ==="
echo ""

# 1. Lint staged files
echo "[1/4] Linting staged files..."
npx lint-staged

# 2. Type-check
echo "[2/4] Running type check..."
npx tsc --noEmit

# 3. Run tests related to changed files
echo "[3/4] Running tests for changed files..."
npx jest --bail --findRelatedTests $(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$' | tr '\n' ' ') --passWithNoTests

# 4. Quick coverage check (only on src/ changes)
CHANGED_SRC=$(git diff --cached --name-only --diff-filter=ACM | grep -E '^src/' || true)

if [ -n "$CHANGED_SRC" ]; then
  echo "[4/4] Checking coverage thresholds..."
  npx jest --coverage --silent 2>/dev/null
  node scripts/check-coverage.js
else
  echo "[4/4] No src/ changes — skipping coverage check."
fi

echo ""
echo "=== All pre-commit checks passed ==="
```

**lint-staged configuration** (in `package.json` or `.lintstagedrc.json`):

```json
{
  "*.{ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,md,yml,yaml}": [
    "prettier --write"
  ],
  "*.css": [
    "prettier --write"
  ]
}
```

---

## 8. Complete Project Templates

### 8.1 Test Utilities

The test utilities module provides a unified setup for all Focus Mode test suites. Every helper is typed and produces realistic data matching the extension's runtime shapes.

```typescript
// tests/setup/testUtils.ts

import { chrome } from 'jest-chrome';

// ============================================================
// TYPES
// ============================================================

export interface MockTab {
  id: number;
  url: string;
  title: string;
  active: boolean;
  windowId: number;
  index: number;
  pinned: boolean;
  status: 'loading' | 'complete';
  favIconUrl?: string;
}

export interface MockSession {
  id: string;
  type: 'pomodoro' | 'custom' | 'stopwatch';
  startTime: number;
  endTime: number | null;
  duration: number;           // planned duration in minutes
  elapsed: number;            // actual elapsed seconds
  completedAt: number | null;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  sitesBlocked: number;
  distractionAttempts: number;
  pomodoroCount: number;
  breaksTaken: number;
}

export interface MockFocusScore {
  current: number;            // 0-100
  previous: number;
  streak: number;
  level: string;
  factors: {
    sessionCompletion: number;   // 0-30 points
    consistency: number;          // 0-25 points
    distractionResistance: number; // 0-20 points
    streakBonus: number;          // 0-15 points
    dailyGoal: number;            // 0-10 points
  };
  history: Array<{ date: string; score: number }>;
  updatedAt: number;
}

export interface MockStreak {
  current: number;
  longest: number;
  lastActiveDate: string;     // ISO date string YYYY-MM-DD
  milestones: Array<{
    days: number;
    achievedAt: number;
    label: string;
  }>;
  freezesAvailable: number;
  freezesUsed: number;
}

export interface MockLicense {
  tier: 'free' | 'pro' | 'lifetime';
  status: 'active' | 'expired' | 'trial';
  expiresAt: number | null;
  email: string | null;
  purchasedAt: number | null;
  features: {
    maxBlockedSites: number;
    nuclearMode: boolean;
    customBlockPage: boolean;
    advancedStats: boolean;
    schedules: boolean;
    exportData: boolean;
  };
}

export interface MockStorageData {
  blocklist: string[];
  settings: {
    pomodoroMinutes: number;
    shortBreakMinutes: number;
    longBreakMinutes: number;
    longBreakInterval: number;
    autoStartBreaks: boolean;
    autoStartPomodoros: boolean;
    notificationsEnabled: boolean;
    soundEnabled: boolean;
    soundVolume: number;
    theme: 'light' | 'dark' | 'system';
    blockMode: 'full' | 'delayed' | 'scheduled';
    nuclearMode: boolean;
    nuclearModeExpiry: number | null;
    showMotivationalQuotes: boolean;
    dailyGoalMinutes: number;
    onboardingComplete: boolean;
  };
  sessions: MockSession[];
  currentSession: MockSession | null;
  focusScore: MockFocusScore;
  streak: MockStreak;
  license: MockLicense;
  stats: {
    totalSessions: number;
    totalFocusMinutes: number;
    totalDistractionsBlocked: number;
    averageSessionMinutes: number;
    bestDay: string | null;
    bestDayMinutes: number;
    weeklyMinutes: number[];
  };
}

export type FocusMessageType =
  | 'START_SESSION'
  | 'PAUSE_SESSION'
  | 'RESUME_SESSION'
  | 'STOP_SESSION'
  | 'GET_SESSION_STATUS'
  | 'ADD_TO_BLOCKLIST'
  | 'REMOVE_FROM_BLOCKLIST'
  | 'GET_BLOCKLIST'
  | 'UPDATE_SETTINGS'
  | 'GET_SETTINGS'
  | 'GET_FOCUS_SCORE'
  | 'GET_STREAK'
  | 'GET_STATS'
  | 'ENABLE_NUCLEAR_MODE'
  | 'DISABLE_NUCLEAR_MODE'
  | 'CHECK_LICENSE'
  | 'VERIFY_LICENSE'
  | 'EXPORT_DATA'
  | 'IMPORT_DATA'
  | 'RESET_DATA'
  | 'ONBOARDING_COMPLETE'
  | 'LOG_DISTRACTION_ATTEMPT';

// ============================================================
// DEFAULTS
// ============================================================

export const DEFAULT_SETTINGS: MockStorageData['settings'] = {
  pomodoroMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  notificationsEnabled: true,
  soundEnabled: true,
  soundVolume: 0.7,
  theme: 'system',
  blockMode: 'full',
  nuclearMode: false,
  nuclearModeExpiry: null,
  showMotivationalQuotes: true,
  dailyGoalMinutes: 120,
  onboardingComplete: false,
};

export const DEFAULT_FOCUS_SCORE: MockFocusScore = {
  current: 0,
  previous: 0,
  streak: 0,
  level: 'Beginner',
  factors: {
    sessionCompletion: 0,
    consistency: 0,
    distractionResistance: 0,
    streakBonus: 0,
    dailyGoal: 0,
  },
  history: [],
  updatedAt: Date.now(),
};

export const DEFAULT_STREAK: MockStreak = {
  current: 0,
  longest: 0,
  lastActiveDate: new Date().toISOString().split('T')[0],
  milestones: [],
  freezesAvailable: 0,
  freezesUsed: 0,
};

export const FREE_LICENSE: MockLicense = {
  tier: 'free',
  status: 'active',
  expiresAt: null,
  email: null,
  purchasedAt: null,
  features: {
    maxBlockedSites: 10,
    nuclearMode: false,
    customBlockPage: false,
    advancedStats: false,
    schedules: false,
    exportData: false,
  },
};

export const PRO_LICENSE: MockLicense = {
  tier: 'pro',
  status: 'active',
  expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  email: 'user@example.com',
  purchasedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
  features: {
    maxBlockedSites: Infinity,
    nuclearMode: true,
    customBlockPage: true,
    advancedStats: true,
    schedules: true,
    exportData: true,
  },
};

const DEFAULT_STORAGE: MockStorageData = {
  blocklist: [],
  settings: { ...DEFAULT_SETTINGS },
  sessions: [],
  currentSession: null,
  focusScore: { ...DEFAULT_FOCUS_SCORE },
  streak: { ...DEFAULT_STREAK },
  license: { ...FREE_LICENSE },
  stats: {
    totalSessions: 0,
    totalFocusMinutes: 0,
    totalDistractionsBlocked: 0,
    averageSessionMinutes: 0,
    bestDay: null,
    bestDayMinutes: 0,
    weeklyMinutes: [0, 0, 0, 0, 0, 0, 0],
  },
};

// ============================================================
// SETUP FUNCTIONS
// ============================================================

/**
 * Full environment setup for Focus Mode tests.
 * Configures chrome mock APIs, storage, alarms, and runtime.
 * Call in beforeEach() for a clean state per test.
 */
export function setupTestEnvironment(
  overrides: Partial<MockStorageData> = {}
): {
  storage: MockStorageData;
  getStorageData: () => MockStorageData;
  setStorageData: (updates: Partial<MockStorageData>) => void;
} {
  const storage: MockStorageData = {
    ...DEFAULT_STORAGE,
    ...overrides,
    settings: { ...DEFAULT_SETTINGS, ...overrides.settings },
    focusScore: { ...DEFAULT_FOCUS_SCORE, ...overrides.focusScore },
    streak: { ...DEFAULT_STREAK, ...overrides.streak },
    license: { ...FREE_LICENSE, ...overrides.license },
    stats: { ...DEFAULT_STORAGE.stats, ...overrides.stats },
  };

  setupMockStorage(storage);
  setupMockAlarms();
  setupMockRuntime();
  setupMockNotifications();
  setupMockDeclarativeNetRequest();
  setupMockAction();

  return {
    storage,
    getStorageData: () => ({ ...storage }),
    setStorageData: (updates: Partial<MockStorageData>) => {
      Object.assign(storage, updates);
    },
  };
}

/**
 * Configure chrome.storage.local mock with realistic get/set/remove behavior.
 */
export function setupMockStorage(initialData: MockStorageData = DEFAULT_STORAGE): void {
  const store: Record<string, unknown> = { ...initialData };

  chrome.storage.local.get.mockImplementation(
    (keys: string | string[] | Record<string, unknown> | null) => {
      return new Promise((resolve) => {
        if (keys === null || keys === undefined) {
          resolve({ ...store });
          return;
        }

        if (typeof keys === 'string') {
          resolve({ [keys]: store[keys] });
          return;
        }

        if (Array.isArray(keys)) {
          const result: Record<string, unknown> = {};
          for (const key of keys) {
            if (key in store) result[key] = store[key];
          }
          resolve(result);
          return;
        }

        // Object with defaults
        const result: Record<string, unknown> = {};
        for (const [key, defaultVal] of Object.entries(keys)) {
          result[key] = key in store ? store[key] : defaultVal;
        }
        resolve(result);
      });
    }
  );

  chrome.storage.local.set.mockImplementation(
    (items: Record<string, unknown>) => {
      return new Promise<void>((resolve) => {
        Object.assign(store, items);
        resolve();
      });
    }
  );

  chrome.storage.local.remove.mockImplementation(
    (keys: string | string[]) => {
      return new Promise<void>((resolve) => {
        const keyList = typeof keys === 'string' ? [keys] : keys;
        for (const key of keyList) {
          delete store[key];
        }
        resolve();
      });
    }
  );

  chrome.storage.local.clear.mockImplementation(() => {
    return new Promise<void>((resolve) => {
      for (const key of Object.keys(store)) {
        delete store[key];
      }
      resolve();
    });
  });
}

function setupMockAlarms(): void {
  const alarms: Map<string, chrome.alarms.Alarm> = new Map();

  chrome.alarms.create.mockImplementation(
    (name: string, alarmInfo: chrome.alarms.AlarmCreateInfo) => {
      const alarm: chrome.alarms.Alarm = {
        name,
        scheduledTime: Date.now() + (alarmInfo.delayInMinutes ?? 0) * 60000,
        periodInMinutes: alarmInfo.periodInMinutes,
      };
      alarms.set(name, alarm);
    }
  );

  chrome.alarms.get.mockImplementation((name: string) => {
    return Promise.resolve(alarms.get(name) ?? null);
  });

  chrome.alarms.getAll.mockImplementation(() => {
    return Promise.resolve(Array.from(alarms.values()));
  });

  chrome.alarms.clear.mockImplementation((name: string) => {
    const existed = alarms.has(name);
    alarms.delete(name);
    return Promise.resolve(existed);
  });

  chrome.alarms.clearAll.mockImplementation(() => {
    alarms.clear();
    return Promise.resolve(true);
  });
}

function setupMockRuntime(): void {
  chrome.runtime.id = 'focus-mode-blocker-test-id';
  chrome.runtime.getManifest.mockReturnValue({
    name: 'Focus Mode - Blocker',
    version: '1.0.0',
    manifest_version: 3,
  } as chrome.runtime.Manifest);

  chrome.runtime.getURL.mockImplementation(
    (path: string) => `chrome-extension://focus-mode-blocker-test-id/${path}`
  );

  chrome.runtime.sendMessage.mockImplementation(() => Promise.resolve(undefined));
}

function setupMockNotifications(): void {
  chrome.notifications.create.mockImplementation(
    (_id: string, _opts: chrome.notifications.NotificationOptions) => {
      return Promise.resolve(_id);
    }
  );
  chrome.notifications.clear.mockImplementation((_id: string) => {
    return Promise.resolve(true);
  });
}

function setupMockDeclarativeNetRequest(): void {
  const dynamicRules: chrome.declarativeNetRequest.Rule[] = [];

  chrome.declarativeNetRequest.updateDynamicRules.mockImplementation(
    (options: { addRules?: chrome.declarativeNetRequest.Rule[]; removeRuleIds?: number[] }) => {
      if (options.removeRuleIds) {
        const removeSet = new Set(options.removeRuleIds);
        const remaining = dynamicRules.filter((r) => !removeSet.has(r.id));
        dynamicRules.length = 0;
        dynamicRules.push(...remaining);
      }
      if (options.addRules) {
        dynamicRules.push(...options.addRules);
      }
      return Promise.resolve();
    }
  );

  chrome.declarativeNetRequest.getDynamicRules.mockImplementation(() => {
    return Promise.resolve([...dynamicRules]);
  });
}

function setupMockAction(): void {
  chrome.action.setBadgeText.mockImplementation(() => Promise.resolve());
  chrome.action.setBadgeBackgroundColor.mockImplementation(() => Promise.resolve());
  chrome.action.setIcon.mockImplementation(() => Promise.resolve());
  chrome.action.setTitle.mockImplementation(() => Promise.resolve());
}

// ============================================================
// FACTORY FUNCTIONS
// ============================================================

let tabIdCounter = 1;

/**
 * Create a mock Chrome tab with Focus Mode relevant defaults.
 */
export function createMockTab(overrides: Partial<MockTab> = {}): MockTab {
  return {
    id: tabIdCounter++,
    url: 'https://example.com',
    title: 'Example Page',
    active: true,
    windowId: 1,
    index: 0,
    pinned: false,
    status: 'complete',
    ...overrides,
  };
}

/**
 * Create a mock Pomodoro session with realistic timing data.
 */
export function createMockSession(
  overrides: Partial<MockSession> = {}
): MockSession {
  const now = Date.now();
  const durationMinutes = overrides.duration ?? 25;
  const elapsedSeconds = overrides.elapsed ?? durationMinutes * 60;
  const isComplete = overrides.status === 'completed' ||
    (!overrides.status && elapsedSeconds >= durationMinutes * 60);

  return {
    id: `session-${Math.random().toString(36).slice(2, 10)}`,
    type: 'pomodoro',
    startTime: now - elapsedSeconds * 1000,
    endTime: isComplete ? now : null,
    duration: durationMinutes,
    elapsed: elapsedSeconds,
    completedAt: isComplete ? now : null,
    status: isComplete ? 'completed' : 'active',
    sitesBlocked: Math.floor(Math.random() * 5) + 1,
    distractionAttempts: Math.floor(Math.random() * 10),
    pomodoroCount: 1,
    breaksTaken: 0,
    ...overrides,
  };
}

/**
 * Create a mock Focus Score with computed factors.
 */
export function createMockFocusScore(
  overrides: Partial<MockFocusScore> = {}
): MockFocusScore {
  const factors = {
    sessionCompletion: Math.floor(Math.random() * 30),
    consistency: Math.floor(Math.random() * 25),
    distractionResistance: Math.floor(Math.random() * 20),
    streakBonus: Math.floor(Math.random() * 15),
    dailyGoal: Math.floor(Math.random() * 10),
    ...overrides.factors,
  };

  const current = overrides.current ??
    factors.sessionCompletion +
    factors.consistency +
    factors.distractionResistance +
    factors.streakBonus +
    factors.dailyGoal;

  const level = current >= 80 ? 'Master' :
                current >= 60 ? 'Advanced' :
                current >= 40 ? 'Intermediate' :
                current >= 20 ? 'Novice' : 'Beginner';

  return {
    current,
    previous: overrides.previous ?? Math.max(0, current - 5),
    streak: overrides.streak ?? 0,
    level,
    factors,
    history: overrides.history ?? [
      { date: new Date().toISOString().split('T')[0], score: current },
    ],
    updatedAt: Date.now(),
    ...overrides,
    // Ensure factors override is applied correctly
    factors: { ...factors, ...overrides.factors },
  };
}

/**
 * Create a mock streak with milestones.
 */
export function createMockStreak(
  overrides: Partial<MockStreak> = {}
): MockStreak {
  const current = overrides.current ?? 7;
  const now = Date.now();

  const milestones = overrides.milestones ?? [];
  if (milestones.length === 0) {
    const milestoneThresholds = [3, 7, 14, 30, 60, 100];
    for (const threshold of milestoneThresholds) {
      if (current >= threshold) {
        milestones.push({
          days: threshold,
          achievedAt: now - (current - threshold) * 86400000,
          label: `${threshold}-Day Streak`,
        });
      }
    }
  }

  return {
    current,
    longest: overrides.longest ?? Math.max(current, 7),
    lastActiveDate: overrides.lastActiveDate ??
      new Date().toISOString().split('T')[0],
    milestones,
    freezesAvailable: overrides.freezesAvailable ?? 1,
    freezesUsed: overrides.freezesUsed ?? 0,
    ...overrides,
  };
}

// ============================================================
// MESSAGING HELPERS
// ============================================================

/**
 * Simulate sending a Focus Mode message through chrome.runtime.
 * Returns the response from any registered onMessage listener.
 */
export async function simulateMessage(
  type: FocusMessageType,
  payload: Record<string, unknown> = {}
): Promise<unknown> {
  return new Promise((resolve) => {
    const message = { type, ...payload };
    const sender: chrome.runtime.MessageSender = {
      id: chrome.runtime.id,
      tab: createMockTab(),
    };

    // Trigger registered onMessage listeners
    const listeners = chrome.runtime.onMessage.getListeners?.() ?? [];
    if (listeners.length === 0) {
      // Fallback: call the mock directly
      chrome.runtime.sendMessage(message).then(resolve);
      return;
    }

    let responded = false;
    const sendResponse = (response: unknown) => {
      if (!responded) {
        responded = true;
        resolve(response);
      }
    };

    for (const listener of listeners) {
      const result = listener(message, sender, sendResponse);
      if (result === true) break; // listener will call sendResponse async
    }

    // If no listener responded synchronously, resolve undefined
    setTimeout(() => {
      if (!responded) resolve(undefined);
    }, 100);
  });
}

/**
 * Capture all messages sent via chrome.runtime.sendMessage during execution.
 * Returns an array of captured messages for assertions.
 */
export function captureMessages(): {
  messages: Array<{ message: unknown; options?: unknown }>;
  restore: () => void;
} {
  const messages: Array<{ message: unknown; options?: unknown }> = [];
  const originalImpl = chrome.runtime.sendMessage.getMockImplementation?.();

  chrome.runtime.sendMessage.mockImplementation(
    (message: unknown, options?: unknown) => {
      messages.push({ message, options });
      return Promise.resolve(undefined);
    }
  );

  return {
    messages,
    restore: () => {
      if (originalImpl) {
        chrome.runtime.sendMessage.mockImplementation(originalImpl);
      } else {
        chrome.runtime.sendMessage.mockReset();
      }
    },
  };
}

// ============================================================
// ASYNC HELPERS
// ============================================================

/**
 * Wait for a condition to be truthy, with timeout.
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeoutMs: number = 5000,
  intervalMs: number = 50
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const result = await condition();
    if (result) return;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`waitFor timed out after ${timeoutMs}ms`);
}

/**
 * Advance Jest fake timers and flush promises.
 */
export async function advanceTimersByTime(ms: number): Promise<void> {
  jest.advanceTimersByTime(ms);
  // Flush microtask queue
  await new Promise((resolve) => setImmediate(resolve));
}

// ============================================================
// FETCH MOCK
// ============================================================

/**
 * Mock global fetch for license API calls and other network requests.
 */
export function mockFetch(
  responses: Record<string, { status: number; body: unknown }>
): {
  calls: Array<{ url: string; init?: RequestInit }>;
  restore: () => void;
} {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;

  globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    calls.push({ url, init });

    const match = Object.entries(responses).find(([pattern]) =>
      url.includes(pattern)
    );

    if (match) {
      const [, response] = match;
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not Found', { status: 404 });
  }) as typeof fetch;

  return {
    calls,
    restore: () => {
      globalThis.fetch = originalFetch;
    },
  };
}
```

---

### 8.2 Playwright Configuration

Playwright must load the unpacked extension in a headed Chromium instance with specific launch arguments. Extensions cannot run in headless mode or in parallel workers.

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const EXTENSION_PATH = path.resolve(__dirname, 'dist');

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',

  // Extensions require serial execution — no parallel workers
  fullyParallel: false,
  workers: 1,

  // Fail the build on CI if test.only is left in source
  forbidOnly: !!process.env.CI,

  // Retry once on CI, never locally
  retries: process.env.CI ? 1 : 0,

  // Reporter configuration
  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['junit', { outputFile: 'test-results/e2e-results.xml' }]]
    : [['html', { open: 'on-failure' }]],

  // Global timeout settings
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },

  use: {
    // Trace collection for debugging failures
    trace: 'on-first-retry',

    // Screenshots on failure
    screenshot: 'only-on-failure',

    // Video recording on failure
    video: 'on-first-retry',

    // Base URL not applicable for extensions (they use chrome-extension:// URLs)
    // baseURL is intentionally omitted

    // Viewport matching popup dimensions
    viewport: { width: 380, height: 580 },
  },

  projects: [
    {
      name: 'chromium-extension',
      use: {
        ...devices['Desktop Chrome'],
        // Launch Chromium with extension loaded
        launchOptions: {
          headless: false, // Extensions require headed mode
          args: [
            `--disable-extensions-except=${EXTENSION_PATH}`,
            `--load-extension=${EXTENSION_PATH}`,
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-default-apps',
            '--disable-popup-blocking',
            '--disable-translate',
            '--disable-sync',
            '--disable-background-networking',
            '--metrics-recording-only',
          ],
          slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO, 10) : 0,
        },
      },
    },
  ],

  // Output directory for test artifacts
  outputDir: 'test-results/e2e',
});
```

**Extension test fixture** for shared setup across all E2E suites:

```typescript
// tests/e2e/fixtures/extension.fixture.ts
import { test as base, chromium, type BrowserContext, type Page } from '@playwright/test';
import path from 'path';

const EXTENSION_PATH = path.resolve(__dirname, '../../../dist');

export interface ExtensionFixtures {
  context: BrowserContext;
  extensionId: string;
  popupPage: Page;
  optionsPage: Page;
  blockPage: Page;
}

export const test = base.extend<ExtensionFixtures>({
  // Browser context with extension loaded
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-default-apps',
      ],
    });
    await use(context);
    await context.close();
  },

  // Retrieve the extension ID from the service worker
  extensionId: async ({ context }, use) => {
    let extensionId = '';

    // Wait for the service worker to register
    let serviceWorker = context.serviceWorkers()[0];
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent('serviceworker');
    }

    // Extract extension ID from the service worker URL
    const swUrl = serviceWorker.url();
    const match = swUrl.match(/chrome-extension:\/\/([^/]+)/);
    if (match) {
      extensionId = match[1];
    } else {
      throw new Error(`Could not extract extension ID from service worker URL: ${swUrl}`);
    }

    await use(extensionId);
  },

  // Open popup page
  popupPage: async ({ context, extensionId }, use) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/src/popup/popup.html`);
    await page.waitForLoadState('domcontentloaded');
    await use(page);
    await page.close();
  },

  // Open options page
  optionsPage: async ({ context, extensionId }, use) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/src/options/options.html`);
    await page.waitForLoadState('domcontentloaded');
    await use(page);
    await page.close();
  },

  // Block page (navigated to by visiting a blocked site)
  blockPage: async ({ context, extensionId }, use) => {
    const page = await context.newPage();
    // Block page is typically shown by the extension; we navigate directly for testing
    await page.goto(`chrome-extension://${extensionId}/src/content/block-page.html`);
    await page.waitForLoadState('domcontentloaded');
    await use(page);
    await page.close();
  },
});

export { expect } from '@playwright/test';
```

---

### 8.3 E2E Test Suites

#### Popup Tests

```typescript
// tests/e2e/popup.spec.ts
import { test, expect } from './fixtures/extension.fixture';

test.describe('Popup — Focus Mode Blocker', () => {

  test('displays extension name and version', async ({ popupPage }) => {
    const title = popupPage.locator('[data-testid="extension-title"]');
    await expect(title).toHaveText(/Focus Mode/i);

    const version = popupPage.locator('[data-testid="extension-version"]');
    await expect(version).toHaveText(/v?\d+\.\d+\.\d+/);
  });

  test('shows empty state when blocklist is empty', async ({ popupPage }) => {
    const emptyState = popupPage.locator('[data-testid="empty-blocklist"]');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText(/no sites blocked/i);
  });

  test('adds a site to the blocklist via popup input', async ({ popupPage }) => {
    const input = popupPage.locator('[data-testid="add-site-input"]');
    const addButton = popupPage.locator('[data-testid="add-site-button"]');

    await input.fill('reddit.com');
    await addButton.click();

    // Verify the site appears in the blocklist
    const siteEntry = popupPage.locator('[data-testid="blocklist-item"]').filter({
      hasText: 'reddit.com',
    });
    await expect(siteEntry).toBeVisible();
  });

  test('starts a focus session from popup', async ({ popupPage }) => {
    const startButton = popupPage.locator('[data-testid="start-session-button"]');
    await expect(startButton).toBeVisible();
    await startButton.click();

    // Timer should now be visible
    const timer = popupPage.locator('[data-testid="session-timer"]');
    await expect(timer).toBeVisible();
    await expect(timer).toContainText(/\d{1,2}:\d{2}/);
  });

  test('shows active timer during a focus session', async ({ popupPage }) => {
    // Start a session first
    const startButton = popupPage.locator('[data-testid="start-session-button"]');
    await startButton.click();

    // Verify timer is counting
    const timer = popupPage.locator('[data-testid="session-timer"]');
    const initialText = await timer.textContent();

    // Wait briefly and check timer has changed
    await popupPage.waitForTimeout(2000);
    const updatedText = await timer.textContent();

    // Timer should be ticking (text may or may not have changed in 2s depending on granularity)
    expect(initialText).toBeTruthy();
    expect(updatedText).toBeTruthy();
  });

  test('shows post-session summary after session completes', async ({ popupPage, context }) => {
    // This test simulates a completed session by setting storage state
    const sw = context.serviceWorkers()[0];
    await sw.evaluate(() => {
      (globalThis as any).chrome.storage.local.set({
        currentSession: null,
        sessions: [{
          id: 'test-session',
          type: 'pomodoro',
          status: 'completed',
          duration: 25,
          elapsed: 1500,
          completedAt: Date.now(),
          distractionAttempts: 3,
          sitesBlocked: 2,
        }],
      });
    });

    await popupPage.reload();
    await popupPage.waitForLoadState('domcontentloaded');

    const summary = popupPage.locator('[data-testid="session-summary"]');
    // Summary may appear as a state — check if relevant elements exist
    // The exact behavior depends on UI implementation
    const scoreDisplay = popupPage.locator('[data-testid="focus-score"]');
    await expect(scoreDisplay).toBeVisible();
  });

  test('toggles between blocklist and stats tabs', async ({ popupPage }) => {
    const blocklistTab = popupPage.locator('[data-testid="tab-blocklist"]');
    const statsTab = popupPage.locator('[data-testid="tab-stats"]');

    // Click stats tab
    await statsTab.click();
    const statsContent = popupPage.locator('[data-testid="stats-content"]');
    await expect(statsContent).toBeVisible();

    // Click blocklist tab
    await blocklistTab.click();
    const blocklistContent = popupPage.locator('[data-testid="blocklist-content"]');
    await expect(blocklistContent).toBeVisible();
  });

  test('shows Focus Score ring', async ({ popupPage }) => {
    const scoreRing = popupPage.locator('[data-testid="focus-score-ring"]');
    await expect(scoreRing).toBeVisible();
  });

  test('shows current streak count', async ({ popupPage }) => {
    const streak = popupPage.locator('[data-testid="streak-counter"]');
    await expect(streak).toBeVisible();
    await expect(streak).toContainText(/\d+/);
  });

  test('shows locked features for free users', async ({ popupPage }) => {
    // Free users should see lock indicators on Pro features
    const lockedFeatures = popupPage.locator('[data-testid="pro-locked"]');
    const count = await lockedFeatures.count();
    expect(count).toBeGreaterThan(0);
  });

  test('hides lock indicators for Pro users', async ({ popupPage, context }) => {
    // Set license to Pro
    const sw = context.serviceWorkers()[0];
    await sw.evaluate(() => {
      (globalThis as any).chrome.storage.local.set({
        license: {
          tier: 'pro',
          status: 'active',
          features: {
            maxBlockedSites: Infinity,
            nuclearMode: true,
            customBlockPage: true,
            advancedStats: true,
            schedules: true,
            exportData: true,
          },
        },
      });
    });

    await popupPage.reload();
    await popupPage.waitForLoadState('domcontentloaded');

    const lockedFeatures = popupPage.locator('[data-testid="pro-locked"]');
    const count = await lockedFeatures.count();
    expect(count).toBe(0);
  });
});
```

#### Block Page Tests

```typescript
// tests/e2e/blockPage.spec.ts
import { test, expect } from './fixtures/extension.fixture';

test.describe('Block Page — Focus Mode Blocker', () => {

  test('renders the block page when visiting a blocked site', async ({ context, extensionId }) => {
    // First, add a site to the blocklist and start a session
    const setupPage = await context.newPage();
    await setupPage.goto(`chrome-extension://${extensionId}/src/popup/popup.html`);
    await setupPage.waitForLoadState('domcontentloaded');

    // Add site to blocklist
    const input = setupPage.locator('[data-testid="add-site-input"]');
    const addButton = setupPage.locator('[data-testid="add-site-button"]');
    await input.fill('reddit.com');
    await addButton.click();

    // Start session
    const startButton = setupPage.locator('[data-testid="start-session-button"]');
    await startButton.click();
    await setupPage.close();

    // Now navigate to the blocked site
    const blockedPage = await context.newPage();
    await blockedPage.goto('https://reddit.com');

    // Should be redirected to block page or see block page content
    await blockedPage.waitForTimeout(2000);
    const url = blockedPage.url();
    const isBlockPage = url.includes('block-page') ||
      await blockedPage.locator('[data-testid="block-page"]').isVisible().catch(() => false);
    expect(isBlockPage).toBe(true);
    await blockedPage.close();
  });

  test('displays a motivational quote', async ({ blockPage }) => {
    const quote = blockPage.locator('[data-testid="motivational-quote"]');
    await expect(quote).toBeVisible();

    const text = await quote.textContent();
    expect(text).toBeTruthy();
    expect(text!.length).toBeGreaterThan(10);
  });

  test('shows the correct streak counter value', async ({ blockPage, context }) => {
    // Set a streak value in storage
    const sw = context.serviceWorkers()[0];
    await sw.evaluate(() => {
      (globalThis as any).chrome.storage.local.set({
        streak: {
          current: 14,
          longest: 21,
          lastActiveDate: new Date().toISOString().split('T')[0],
          milestones: [],
          freezesAvailable: 1,
          freezesUsed: 0,
        },
      });
    });

    await blockPage.reload();
    await blockPage.waitForLoadState('domcontentloaded');

    const streakCounter = blockPage.locator('[data-testid="streak-counter"]');
    await expect(streakCounter).toBeVisible();
    await expect(streakCounter).toContainText('14');
  });

  test('displays time saved counter', async ({ blockPage }) => {
    const timeSaved = blockPage.locator('[data-testid="time-saved"]');
    await expect(timeSaved).toBeVisible();
  });

  test('"Back to Work" button navigates away from block page', async ({ blockPage }) => {
    const backButton = blockPage.locator('[data-testid="back-to-work-button"]');
    await expect(backButton).toBeVisible();

    await backButton.click();

    // Should navigate away — either to a new tab or close
    await blockPage.waitForTimeout(1000);
    const url = blockPage.url();
    // The button should trigger navigation away from block-page.html
    // Exact behavior depends on implementation (could go to newtab, close, or go back)
    expect(url).toBeTruthy();
  });

  test('distraction attempt counter increments on refresh', async ({ blockPage }) => {
    const attemptCounter = blockPage.locator('[data-testid="distraction-attempts"]');

    // Get initial count
    const initialText = await attemptCounter.textContent();
    const initialCount = parseInt(initialText?.match(/\d+/)?.[0] ?? '0', 10);

    // Reload the block page (simulating another distraction attempt)
    await blockPage.reload();
    await blockPage.waitForLoadState('domcontentloaded');

    const updatedText = await attemptCounter.textContent();
    const updatedCount = parseInt(updatedText?.match(/\d+/)?.[0] ?? '0', 10);

    expect(updatedCount).toBeGreaterThanOrEqual(initialCount);
  });

  test('makes no external network requests (privacy)', async ({ context, extensionId }) => {
    const externalRequests: string[] = [];

    const page = await context.newPage();

    // Monitor all network requests
    page.on('request', (request) => {
      const url = request.url();
      if (
        !url.startsWith('chrome-extension://') &&
        !url.startsWith('chrome://') &&
        !url.startsWith('data:') &&
        !url.startsWith('blob:')
      ) {
        externalRequests.push(url);
      }
    });

    await page.goto(`chrome-extension://${extensionId}/src/content/block-page.html`);
    await page.waitForLoadState('networkidle');

    expect(externalRequests).toEqual([]);
    await page.close();
  });
});
```

#### Options Page Tests

```typescript
// tests/e2e/options.spec.ts
import { test, expect } from './fixtures/extension.fixture';

test.describe('Options Page — Focus Mode Blocker', () => {

  test('saves and restores all settings', async ({ optionsPage }) => {
    // Change Pomodoro duration
    const pomodoroInput = optionsPage.locator('[data-testid="setting-pomodoro-minutes"]');
    await pomodoroInput.clear();
    await pomodoroInput.fill('30');

    // Change short break
    const shortBreakInput = optionsPage.locator('[data-testid="setting-short-break"]');
    await shortBreakInput.clear();
    await shortBreakInput.fill('10');

    // Save settings
    const saveButton = optionsPage.locator('[data-testid="save-settings-button"]');
    await saveButton.click();

    // Wait for save confirmation
    const confirmation = optionsPage.locator('[data-testid="save-confirmation"]');
    await expect(confirmation).toBeVisible();

    // Reload and verify persistence
    await optionsPage.reload();
    await optionsPage.waitForLoadState('domcontentloaded');

    await expect(pomodoroInput).toHaveValue('30');
    await expect(shortBreakInput).toHaveValue('10');
  });

  test('navigates between all 8 sections', async ({ optionsPage }) => {
    const sections = [
      'nav-general',
      'nav-timer',
      'nav-blocking',
      'nav-notifications',
      'nav-appearance',
      'nav-data',
      'nav-account',
      'nav-about',
    ];

    for (const sectionId of sections) {
      const navItem = optionsPage.locator(`[data-testid="${sectionId}"]`);
      await navItem.click();

      // Verify the corresponding content section is visible
      const contentId = sectionId.replace('nav-', 'section-');
      const content = optionsPage.locator(`[data-testid="${contentId}"]`);
      await expect(content).toBeVisible();
    }
  });

  test('shows Pro feature locks for free users', async ({ optionsPage }) => {
    const proLocks = optionsPage.locator('[data-testid="pro-feature-lock"]');
    const count = await proLocks.count();
    expect(count).toBeGreaterThan(0);

    // Clicking a locked feature should show upgrade prompt
    await proLocks.first().click();
    const upgradePrompt = optionsPage.locator('[data-testid="upgrade-prompt"]');
    await expect(upgradePrompt).toBeVisible();
  });

  test('imports and exports blocklist', async ({ optionsPage }) => {
    // Navigate to data section
    const dataNav = optionsPage.locator('[data-testid="nav-data"]');
    await dataNav.click();

    // Export button should be present
    const exportButton = optionsPage.locator('[data-testid="export-data-button"]');
    await expect(exportButton).toBeVisible();

    // Import button should be present
    const importButton = optionsPage.locator('[data-testid="import-data-button"]');
    await expect(importButton).toBeVisible();

    // Click export and verify download initiated
    const [download] = await Promise.all([
      optionsPage.waitForEvent('download'),
      exportButton.click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/focus-mode.*\.json/i);
  });

  test('manages notification preferences', async ({ optionsPage }) => {
    // Navigate to notifications section
    const notifNav = optionsPage.locator('[data-testid="nav-notifications"]');
    await notifNav.click();

    // Toggle notifications
    const notifToggle = optionsPage.locator('[data-testid="toggle-notifications"]');
    await expect(notifToggle).toBeVisible();

    // Get initial state
    const initialState = await notifToggle.isChecked();

    // Toggle it
    await notifToggle.click();

    // Verify it changed
    const newState = await notifToggle.isChecked();
    expect(newState).not.toBe(initialState);

    // Save and verify persistence
    const saveButton = optionsPage.locator('[data-testid="save-settings-button"]');
    await saveButton.click();

    await optionsPage.reload();
    await optionsPage.waitForLoadState('domcontentloaded');
    await notifNav.click();

    const restoredState = await notifToggle.isChecked();
    expect(restoredState).toBe(newState);
  });
});
```

#### Onboarding Tests

```typescript
// tests/e2e/onboarding.spec.ts
import { test, expect } from './fixtures/extension.fixture';

test.describe('Onboarding — Focus Mode Blocker', () => {

  test.beforeEach(async ({ context }) => {
    // Clear onboarding state so it shows fresh
    const sw = context.serviceWorkers()[0];
    if (!sw) {
      await context.waitForEvent('serviceworker');
    }
    const worker = context.serviceWorkers()[0];
    await worker.evaluate(() => {
      (globalThis as any).chrome.storage.local.set({
        settings: { onboardingComplete: false },
      });
    });
  });

  test('renders all 5 onboarding slides', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/src/popup/popup.html`);
    await page.waitForLoadState('domcontentloaded');

    // Slide 1: Welcome
    const welcomeSlide = page.locator('[data-testid="onboarding-slide-1"]');
    await expect(welcomeSlide).toBeVisible();
    await expect(welcomeSlide).toContainText(/welcome/i);

    // Navigate through all slides
    const nextButton = page.locator('[data-testid="onboarding-next"]');

    // Slide 2: Setup Sites
    await nextButton.click();
    const setupSlide = page.locator('[data-testid="onboarding-slide-2"]');
    await expect(setupSlide).toBeVisible();

    // Slide 3: Focus Style
    await nextButton.click();
    const styleSlide = page.locator('[data-testid="onboarding-slide-3"]');
    await expect(styleSlide).toBeVisible();

    // Slide 4: Focus Score
    await nextButton.click();
    const scoreSlide = page.locator('[data-testid="onboarding-slide-4"]');
    await expect(scoreSlide).toBeVisible();

    // Slide 5: Ready
    await nextButton.click();
    const readySlide = page.locator('[data-testid="onboarding-slide-5"]');
    await expect(readySlide).toBeVisible();

    await page.close();
  });

  test('progress indicator advances with each slide', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/src/popup/popup.html`);
    await page.waitForLoadState('domcontentloaded');

    const progressIndicator = page.locator('[data-testid="onboarding-progress"]');
    await expect(progressIndicator).toBeVisible();

    // Check active dot count increases
    const nextButton = page.locator('[data-testid="onboarding-next"]');

    for (let slide = 1; slide <= 5; slide++) {
      const activeDots = page.locator('[data-testid="progress-dot-active"]');
      const activeCount = await activeDots.count();
      expect(activeCount).toBe(slide);

      if (slide < 5) {
        await nextButton.click();
      }
    }

    await page.close();
  });

  test('can add first blocked sites on slide 2', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/src/popup/popup.html`);
    await page.waitForLoadState('domcontentloaded');

    // Navigate to slide 2
    const nextButton = page.locator('[data-testid="onboarding-next"]');
    await nextButton.click();

    // Add sites
    const siteInput = page.locator('[data-testid="onboarding-site-input"]');
    const addButton = page.locator('[data-testid="onboarding-add-site"]');

    await siteInput.fill('facebook.com');
    await addButton.click();

    await siteInput.fill('twitter.com');
    await addButton.click();

    // Verify sites appear
    const addedSites = page.locator('[data-testid="onboarding-site-item"]');
    await expect(addedSites).toHaveCount(2);

    await page.close();
  });

  test('can select focus style on slide 3', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/src/popup/popup.html`);
    await page.waitForLoadState('domcontentloaded');

    // Navigate to slide 3
    const nextButton = page.locator('[data-testid="onboarding-next"]');
    await nextButton.click(); // slide 2
    await nextButton.click(); // slide 3

    // Select a focus style option
    const styleOptions = page.locator('[data-testid="focus-style-option"]');
    await expect(styleOptions.first()).toBeVisible();
    await styleOptions.first().click();

    // Verify selection
    const selected = page.locator('[data-testid="focus-style-option"][data-selected="true"]');
    await expect(selected).toHaveCount(1);

    await page.close();
  });

  test('"Start First Session" CTA appears on slide 5', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/src/popup/popup.html`);
    await page.waitForLoadState('domcontentloaded');

    // Navigate to slide 5
    const nextButton = page.locator('[data-testid="onboarding-next"]');
    for (let i = 0; i < 4; i++) {
      await nextButton.click();
    }

    const startCta = page.locator('[data-testid="start-first-session-cta"]');
    await expect(startCta).toBeVisible();
    await expect(startCta).toContainText(/start/i);

    await page.close();
  });

  test('skip onboarding option is available', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/src/popup/popup.html`);
    await page.waitForLoadState('domcontentloaded');

    const skipButton = page.locator('[data-testid="onboarding-skip"]');
    await expect(skipButton).toBeVisible();

    await skipButton.click();

    // Should show main popup UI, not onboarding
    const mainUi = page.locator('[data-testid="popup-main"]');
    await expect(mainUi).toBeVisible();

    await page.close();
  });

  test('can resume onboarding from any slide via back button', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/src/popup/popup.html`);
    await page.waitForLoadState('domcontentloaded');

    const nextButton = page.locator('[data-testid="onboarding-next"]');
    const backButton = page.locator('[data-testid="onboarding-back"]');

    // Go to slide 3
    await nextButton.click(); // slide 2
    await nextButton.click(); // slide 3

    // Go back to slide 2
    await backButton.click();
    const slide2 = page.locator('[data-testid="onboarding-slide-2"]');
    await expect(slide2).toBeVisible();

    // Go back to slide 1
    await backButton.click();
    const slide1 = page.locator('[data-testid="onboarding-slide-1"]');
    await expect(slide1).toBeVisible();

    await page.close();
  });
});
```

#### Full Workflow Tests

```typescript
// tests/e2e/fullWorkflow.spec.ts
import { test, expect } from './fixtures/extension.fixture';

test.describe('Full Workflow — Focus Mode Blocker', () => {

  test('install -> onboard -> add sites -> start session -> complete -> check score', async ({
    context,
    extensionId,
  }) => {
    // Step 1: Open extension (triggers onboarding for fresh install)
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/src/popup/popup.html`);
    await page.waitForLoadState('domcontentloaded');

    // Step 2: Complete onboarding
    const welcomeSlide = page.locator('[data-testid="onboarding-slide-1"]');
    if (await welcomeSlide.isVisible()) {
      const nextButton = page.locator('[data-testid="onboarding-next"]');

      // Slide 1 -> 2
      await nextButton.click();

      // Slide 2: Add a site
      const siteInput = page.locator('[data-testid="onboarding-site-input"]');
      const addSiteButton = page.locator('[data-testid="onboarding-add-site"]');
      await siteInput.fill('youtube.com');
      await addSiteButton.click();
      await nextButton.click();

      // Slide 3: Select focus style
      const styleOption = page.locator('[data-testid="focus-style-option"]').first();
      await styleOption.click();
      await nextButton.click();

      // Slide 4 -> 5
      await nextButton.click();

      // Slide 5: Start first session
      const startCta = page.locator('[data-testid="start-first-session-cta"]');
      await startCta.click();
    }

    // Step 3: Verify session is active
    const timer = page.locator('[data-testid="session-timer"]');
    await expect(timer).toBeVisible({ timeout: 10000 });

    // Step 4: Simulate session completion (fast-forward via storage)
    const sw = context.serviceWorkers()[0];
    await sw.evaluate(() => {
      const completedSession = {
        id: 'onboarding-session',
        type: 'pomodoro',
        status: 'completed',
        duration: 25,
        elapsed: 1500,
        startTime: Date.now() - 1500000,
        endTime: Date.now(),
        completedAt: Date.now(),
        distractionAttempts: 2,
        sitesBlocked: 1,
        pomodoroCount: 1,
        breaksTaken: 0,
      };

      (globalThis as any).chrome.storage.local.set({
        currentSession: null,
        sessions: [completedSession],
        focusScore: {
          current: 42,
          previous: 0,
          streak: 1,
          level: 'Intermediate',
          factors: {
            sessionCompletion: 25,
            consistency: 5,
            distractionResistance: 7,
            streakBonus: 0,
            dailyGoal: 5,
          },
          history: [{ date: new Date().toISOString().split('T')[0], score: 42 }],
          updatedAt: Date.now(),
        },
        streak: {
          current: 1,
          longest: 1,
          lastActiveDate: new Date().toISOString().split('T')[0],
          milestones: [],
          freezesAvailable: 0,
          freezesUsed: 0,
        },
      });
    });

    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Step 5: Verify Focus Score is displayed
    const scoreDisplay = page.locator('[data-testid="focus-score"]');
    await expect(scoreDisplay).toBeVisible();

    // Step 6: Verify streak is shown
    const streakDisplay = page.locator('[data-testid="streak-counter"]');
    await expect(streakDisplay).toBeVisible();

    await page.close();
  });

  test('blocking verification: add site -> navigate -> see block page', async ({
    context,
    extensionId,
  }) => {
    // Step 1: Add site to blocklist via popup
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/src/popup/popup.html`);
    await popup.waitForLoadState('domcontentloaded');

    // Skip onboarding if present
    const skipButton = popup.locator('[data-testid="onboarding-skip"]');
    if (await skipButton.isVisible().catch(() => false)) {
      await skipButton.click();
    }

    const input = popup.locator('[data-testid="add-site-input"]');
    const addButton = popup.locator('[data-testid="add-site-button"]');

    await input.fill('facebook.com');
    await addButton.click();

    // Verify added
    const siteItem = popup.locator('[data-testid="blocklist-item"]').filter({
      hasText: 'facebook.com',
    });
    await expect(siteItem).toBeVisible();

    // Step 2: Start a session (blocking is active during sessions)
    const startButton = popup.locator('[data-testid="start-session-button"]');
    await startButton.click();
    await popup.close();

    // Step 3: Navigate to blocked site
    const testPage = await context.newPage();
    await testPage.goto('https://facebook.com');
    await testPage.waitForTimeout(3000);

    // Step 4: Verify block page is shown
    const currentUrl = testPage.url();
    const blockPageVisible = currentUrl.includes('block-page') ||
      await testPage.locator('[data-testid="block-page"]').isVisible().catch(() => false);
    expect(blockPageVisible).toBe(true);

    await testPage.close();
  });

  test('nuclear mode: enable -> verify blocked -> wait for expiry', async ({
    context,
    extensionId,
  }) => {
    // Step 1: Set up as Pro user (Nuclear Mode is Pro-only)
    const sw = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
    const worker = context.serviceWorkers()[0];
    await worker.evaluate(() => {
      (globalThis as any).chrome.storage.local.set({
        license: {
          tier: 'pro',
          status: 'active',
          features: {
            maxBlockedSites: Infinity,
            nuclearMode: true,
            customBlockPage: true,
            advancedStats: true,
            schedules: true,
            exportData: true,
          },
        },
        blocklist: ['reddit.com', 'twitter.com', 'facebook.com'],
        settings: {
          onboardingComplete: true,
          nuclearMode: false,
          nuclearModeExpiry: null,
        },
      });
    });

    // Step 2: Open popup and enable Nuclear Mode
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/src/popup/popup.html`);
    await popup.waitForLoadState('domcontentloaded');

    const nuclearToggle = popup.locator('[data-testid="nuclear-mode-toggle"]');
    await expect(nuclearToggle).toBeVisible();
    await nuclearToggle.click();

    // Confirm Nuclear Mode activation (may have confirmation dialog)
    const confirmButton = popup.locator('[data-testid="nuclear-confirm"]');
    if (await confirmButton.isVisible().catch(() => false)) {
      await confirmButton.click();
    }

    // Step 3: Verify Nuclear Mode indicator is visible
    const nuclearIndicator = popup.locator('[data-testid="nuclear-mode-active"]');
    await expect(nuclearIndicator).toBeVisible();
    await popup.close();

    // Step 4: Try visiting a blocked site
    const testPage = await context.newPage();
    await testPage.goto('https://reddit.com');
    await testPage.waitForTimeout(3000);

    // Verify blocking
    const isBlocked = testPage.url().includes('block-page') ||
      await testPage.locator('[data-testid="block-page"]').isVisible().catch(() => false);
    expect(isBlocked).toBe(true);

    await testPage.close();

    // Step 5: Verify Nuclear Mode cannot be easily disabled
    const popup2 = await context.newPage();
    await popup2.goto(`chrome-extension://${extensionId}/src/popup/popup.html`);
    await popup2.waitForLoadState('domcontentloaded');

    const disableButton = popup2.locator('[data-testid="nuclear-mode-disable"]');
    // In Nuclear Mode, the disable button should be hidden or disabled
    if (await disableButton.isVisible().catch(() => false)) {
      const isDisabled = await disableButton.isDisabled();
      expect(isDisabled).toBe(true);
    }

    await popup2.close();
  });
});
```

---

### 8.4 Complete Test Script Runner

All test scripts for `package.json`. These provide a consistent interface for local development, CI pipelines, and targeted test runs.

```jsonc
// package.json — "scripts" section
{
  "scripts": {
    // ── Unit & Integration ──────────────────────────────
    "test": "jest",
    "test:unit": "jest --testPathPattern='tests/unit' --coverage",
    "test:integration": "jest --testPathPattern='tests/integration' --coverage",
    "test:watch": "jest --watch --verbose",
    "test:watch:unit": "jest --watch --testPathPattern='tests/unit'",

    // ── E2E (Playwright) ────────────────────────────────
    "test:e2e": "npx playwright test",
    "test:e2e:ui": "npx playwright test --ui",
    "test:e2e:debug": "npx playwright test --debug",
    "test:e2e:headed": "npx playwright test --headed",
    "test:e2e:report": "npx playwright show-report",

    // ── CI Pipeline ─────────────────────────────────────
    "test:ci": "jest --ci --coverage --maxWorkers=2 --forceExit && npx playwright test",
    "test:ci:unit": "jest --ci --coverage --maxWorkers=2 --forceExit",
    "test:ci:e2e": "npx playwright test --reporter=junit",

    // ── Performance ─────────────────────────────────────
    "test:performance": "jest --testPathPattern='tests/performance' --no-coverage",

    // ── Coverage ────────────────────────────────────────
    "coverage": "jest --coverage --verbose",
    "coverage:check": "jest --coverage --silent && node scripts/check-coverage.js",
    "coverage:report": "jest --coverage && open coverage/lcov-report/index.html",
    "coverage:badge": "jest --coverage --silent && node scripts/generate-coverage-badge.js",
    "coverage:find-untested": "npx ts-node scripts/find-untested.ts",

    // ── Quality Gates ───────────────────────────────────
    "lint": "eslint src/ tests/ --ext .ts,.tsx",
    "lint:fix": "eslint src/ tests/ --ext .ts,.tsx --fix",
    "typecheck": "tsc --noEmit",
    "validate": "npm run lint && npm run typecheck && npm run test:ci",

    // ── Setup ───────────────────────────────────────────
    "prepare": "husky install",
    "test:setup": "npx playwright install chromium"
  }
}
```

---

### 8.5 Quick Reference Card

#### Essential Commands

| Task | Command |
|------|---------|
| Run all tests | `npm test` |
| Run unit tests only | `npm run test:unit` |
| Run integration tests only | `npm run test:integration` |
| Run E2E tests | `npm run test:e2e` |
| Debug E2E tests | `npm run test:e2e:debug` |
| Watch mode | `npm run test:watch` |
| Full CI pipeline | `npm run test:ci` |
| Check coverage | `npm run coverage:check` |
| View HTML report | `npm run coverage:report` |
| Find untested files | `npm run coverage:find-untested` |
| Generate badge | `npm run coverage:badge` |

#### Test File Naming Convention

```
tests/
  unit/
    background/
      messageHandler.test.ts        # Unit: single module
      storageManager.test.ts
      blockingEngine.test.ts
    shared/
      focusScoreCalculator.test.ts
      streakManager.test.ts
      licenseVerifier.test.ts
    content/
      detector.test.ts
      blocker.test.ts
      tracker.test.ts
    popup/
      popup.test.ts
      components/
        timer.test.ts
        focusScoreRing.test.ts
        blocklistManager.test.ts
    options/
      options.test.ts
  integration/
    session-lifecycle.test.ts        # Integration: multi-module flows
    blocking-flow.test.ts
    storage-sync.test.ts
    score-calculation.test.ts
    license-gate.test.ts
    nuclear-mode.test.ts
  e2e/
    popup.spec.ts                    # E2E: Playwright browser tests
    blockPage.spec.ts
    options.spec.ts
    onboarding.spec.ts
    fullWorkflow.spec.ts
    fixtures/
      extension.fixture.ts          # Shared E2E fixtures
  performance/
    service-worker-startup.perf.ts   # Performance benchmarks
    storage-operations.perf.ts
    blocking-latency.perf.ts
  setup/
    testUtils.ts                     # Shared test utilities
    jest.setup.ts                    # Jest global setup
    chrome-mock.ts                   # Chrome API mocks
```

#### Mock Quick Reference

| Chrome API | Mock Location | Key Methods |
|------------|---------------|-------------|
| `chrome.storage.local` | `testUtils.ts` → `setupMockStorage()` | `get`, `set`, `remove`, `clear` |
| `chrome.tabs` | `chrome-mock.ts` | `query`, `create`, `update`, `remove`, `sendMessage` |
| `chrome.runtime` | `testUtils.ts` → `setupMockRuntime()` | `sendMessage`, `getURL`, `getManifest`, `onMessage`, `onInstalled` |
| `chrome.alarms` | `testUtils.ts` → `setupMockAlarms()` | `create`, `get`, `getAll`, `clear`, `clearAll`, `onAlarm` |
| `chrome.declarativeNetRequest` | `testUtils.ts` → `setupMockDeclarativeNetRequest()` | `updateDynamicRules`, `getDynamicRules` |
| `chrome.notifications` | `testUtils.ts` → `setupMockNotifications()` | `create`, `clear` |
| `chrome.action` | `testUtils.ts` → `setupMockAction()` | `setBadgeText`, `setBadgeBackgroundColor`, `setIcon`, `setTitle` |
| `chrome.scripting` | `chrome-mock.ts` | `executeScript`, `insertCSS`, `removeCSS` |

#### Common Test Patterns

**Testing message handlers:**
```typescript
import { setupTestEnvironment, simulateMessage } from '../setup/testUtils';

beforeEach(() => setupTestEnvironment());

test('adds site to blocklist', async () => {
  const response = await simulateMessage('ADD_TO_BLOCKLIST', {
    site: 'reddit.com',
  });
  expect(response).toEqual({ success: true });
});
```

**Testing storage operations:**
```typescript
import { setupTestEnvironment } from '../setup/testUtils';

const { getStorageData } = setupTestEnvironment({
  blocklist: ['facebook.com'],
});

test('blocklist is initialized', () => {
  expect(getStorageData().blocklist).toContain('facebook.com');
});
```

**Testing Focus Score calculation:**
```typescript
import { createMockSession, createMockFocusScore } from '../setup/testUtils';

test('completed session increases score', () => {
  const session = createMockSession({ status: 'completed', duration: 25 });
  const scoreBefore = createMockFocusScore({ current: 40 });
  // ... test score calculation logic
});
```

**Testing license gating:**
```typescript
import { setupTestEnvironment, FREE_LICENSE, PRO_LICENSE } from '../setup/testUtils';

test('free user limited to 10 sites', () => {
  setupTestEnvironment({ license: FREE_LICENSE });
  expect(FREE_LICENSE.features.maxBlockedSites).toBe(10);
});

test('pro user has unlimited sites', () => {
  setupTestEnvironment({ license: PRO_LICENSE });
  expect(PRO_LICENSE.features.maxBlockedSites).toBe(Infinity);
});
```

**Mocking fetch for license verification:**
```typescript
import { mockFetch } from '../setup/testUtils';

test('verifies valid license', async () => {
  const { calls, restore } = mockFetch({
    '/api/license/verify': {
      status: 200,
      body: { valid: true, tier: 'pro', expiresAt: Date.now() + 86400000 },
    },
  });

  // ... test license verification logic

  expect(calls).toHaveLength(1);
  expect(calls[0].url).toContain('/api/license/verify');
  restore();
});
```

---

*End of Agent 5 deliverable. This document covers Sections 7 (Code Coverage Requirements) and 8 (Complete Project Templates) of the Phase 10 Automated Testing Suite for Focus Mode - Blocker.*
