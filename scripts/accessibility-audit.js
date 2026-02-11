#!/usr/bin/env node
/**
 * Accessibility Audit Script — Focus Mode - Blocker
 * Phase 21: Accessibility Compliance
 *
 * Runs 25 automated checks against the project to verify
 * accessibility implementation completeness.
 *
 * Usage: node scripts/accessibility-audit.js
 * Exit code 0 if score >= 70, exit code 1 otherwise
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');
const A11Y_DOCS = path.join(DOCS, 'accessibility');

// ── Helpers ──────────────────────────────────────────────
function fileExists(filePath) {
  return fs.existsSync(path.join(ROOT, filePath));
}

function dirExists(dirPath) {
  const full = path.join(ROOT, dirPath);
  return fs.existsSync(full) && fs.statSync(full).isDirectory();
}

function fileContains(filePath, pattern) {
  const full = path.join(ROOT, filePath);
  if (!fs.existsSync(full)) return false;
  const content = fs.readFileSync(full, 'utf8');
  if (typeof pattern === 'string') return content.includes(pattern);
  return pattern.test(content);
}

function anyFileContains(dir, ext, pattern) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return false;
  const files = fs.readdirSync(full).filter(f => f.endsWith(ext));
  return files.some(f => {
    const content = fs.readFileSync(path.join(full, f), 'utf8');
    if (typeof pattern === 'string') return content.includes(pattern);
    return pattern.test(content);
  });
}

function countLines(filePath) {
  const full = path.join(ROOT, filePath);
  if (!fs.existsSync(full)) return 0;
  return fs.readFileSync(full, 'utf8').split('\n').length;
}

// ── Results tracking ─────────────────────────────────────
const results = [];
let passCount = 0;
let warnCount = 0;
let failCount = 0;

function check(name, status, detail = '') {
  results.push({ name, status, detail });
  if (status === 'PASS') passCount++;
  else if (status === 'WARN') warnCount++;
  else failCount++;
}

// ── CHECKS ───────────────────────────────────────────────

// 1. Accessibility docs directory exists
check(
  'Accessibility docs directory',
  dirExists('docs/accessibility') ? 'PASS' : 'FAIL',
  'docs/accessibility/'
);

// 2. Agent 1 — WCAG & Keyboard Navigation doc
check(
  'WCAG & Keyboard Navigation doc',
  fileExists('docs/accessibility/agent1-wcag-keyboard-navigation.md') ? 'PASS' : 'FAIL',
  'agent1-wcag-keyboard-navigation.md'
);

// 3. Agent 2 — Screen Reader Support doc
check(
  'Screen Reader Support doc',
  fileExists('docs/accessibility/agent2-screen-reader-support.md') ? 'PASS' : 'FAIL',
  'agent2-screen-reader-support.md'
);

// 4. Agent 3 — Visual Accessibility doc
const agent3Exists = fileExists('docs/accessibility/agent3-visual-accessibility.md') ||
                     fileExists('docs/accessibility/agent3-visual-accessibility-motion.md');
check(
  'Visual Accessibility doc',
  agent3Exists ? 'PASS' : 'FAIL',
  'agent3-visual-accessibility*.md'
);

// 5. Agent 4 — Accessible Components doc
const agent4Exists = fileExists('docs/accessibility/agent4-accessible-components.md') ||
                     fileExists('docs/accessibility/agent4-motion-accessible-components.md');
check(
  'Accessible Components doc',
  agent4Exists ? 'PASS' : 'FAIL',
  'agent4-*components*.md'
);

// 6. Agent 5 — Testing & Enterprise doc
const agent5Exists = fileExists('docs/accessibility/agent5-testing-validation-enterprise.md') ||
                     fileExists('docs/accessibility/agent5-testing-enterprise-legal.md');
check(
  'Testing & Enterprise doc',
  agent5Exists ? 'PASS' : 'FAIL',
  'agent5-testing-*.md'
);

// 7. Total accessibility docs line count >= 5000
const a11yFiles = fs.existsSync(A11Y_DOCS)
  ? fs.readdirSync(A11Y_DOCS).filter(f => f.endsWith('.md'))
  : [];
const totalLines = a11yFiles.reduce((sum, f) => {
  return sum + fs.readFileSync(path.join(A11Y_DOCS, f), 'utf8').split('\n').length;
}, 0);
check(
  'Docs line count >= 5000',
  totalLines >= 5000 ? 'PASS' : (totalLines >= 3000 ? 'WARN' : 'FAIL'),
  `${totalLines} lines across ${a11yFiles.length} files`
);

// 8. FocusManager class documented
check(
  'FocusManager class documented',
  anyFileContains('docs/accessibility', '.md', /FocusManager|FocusFocusManager/) ? 'PASS' : 'WARN',
  'Keyboard focus management'
);

// 9. FocusTrap class documented
check(
  'FocusTrap class documented',
  anyFileContains('docs/accessibility', '.md', /FocusTrap/) ? 'PASS' : 'WARN',
  'Modal focus trapping'
);

// 10. KeyboardShortcuts class documented
check(
  'KeyboardShortcuts class documented',
  anyFileContains('docs/accessibility', '.md', /KeyboardShortcuts|FocusKeyboardShortcuts/) ? 'PASS' : 'WARN',
  'Extension keyboard shortcuts'
);

// 11. LiveRegion class documented
check(
  'LiveRegion class documented',
  anyFileContains('docs/accessibility', '.md', /LiveRegion|FocusLiveRegion/) ? 'PASS' : 'WARN',
  'ARIA live region management'
);

// 12. ARIA roles documented (role="meter", role="timer", role="alertdialog")
const hasAriaRoles = anyFileContains('docs/accessibility', '.md', /role="meter"/) &&
                     anyFileContains('docs/accessibility', '.md', /role="timer"/) &&
                     anyFileContains('docs/accessibility', '.md', /role="alertdialog"/);
check(
  'ARIA roles documented (meter, timer, alertdialog)',
  hasAriaRoles ? 'PASS' : 'WARN',
  'Focus Score, Timer, Block Page roles'
);

// 13. aria-live regions documented
check(
  'aria-live regions documented',
  anyFileContains('docs/accessibility', '.md', /aria-live/) ? 'PASS' : 'WARN',
  'Dynamic content announcements'
);

// 14. Focus indicators CSS documented
check(
  'Focus indicators documented',
  anyFileContains('docs/accessibility', '.md', /focus-visible|:focus-visible/) ? 'PASS' : 'WARN',
  'CSS :focus-visible usage'
);

// 15. prefers-reduced-motion documented
check(
  'prefers-reduced-motion documented',
  anyFileContains('docs/accessibility', '.md', /prefers-reduced-motion/) ? 'PASS' : 'WARN',
  'Motion accessibility'
);

// 16. Color contrast ratios documented
check(
  'Color contrast documented',
  anyFileContains('docs/accessibility', '.md', /4\.5:1|contrast ratio/) ? 'PASS' : 'WARN',
  'WCAG contrast requirements'
);

// 17. High contrast mode documented
check(
  'High contrast mode documented',
  anyFileContains('docs/accessibility', '.md', /forced-colors|High Contrast/) ? 'PASS' : 'WARN',
  'Windows High Contrast Mode support'
);

// 18. Dark mode accessibility documented
check(
  'Dark mode accessibility documented',
  anyFileContains('docs/accessibility', '.md', /dark.*mode|prefers-color-scheme/i) ? 'PASS' : 'WARN',
  'Dark mode theme support'
);

// 19. Screen reader testing checklist
check(
  'Screen reader testing checklist',
  anyFileContains('docs/accessibility', '.md', /NVDA.*test|VoiceOver.*test/i) ? 'PASS' : 'WARN',
  'NVDA and VoiceOver testing procedures'
);

// 20. Nuclear Mode accessibility documented
check(
  'Nuclear Mode accessibility',
  anyFileContains('docs/accessibility', '.md', /Nuclear Mode/) ? 'PASS' : 'WARN',
  'Nuclear Mode modal, warnings, screen reader support'
);

// 21. Blocklist accessibility documented
check(
  'Blocklist accessibility',
  anyFileContains('docs/accessibility', '.md', /blocklist|Blocklist/i) ? 'PASS' : 'WARN',
  'Blocklist ARIA, keyboard management'
);

// 22. VPAT template documented
check(
  'VPAT documentation',
  anyFileContains('docs/accessibility', '.md', /VPAT/) ? 'PASS' : 'WARN',
  'Voluntary Product Accessibility Template'
);

// 23. Section 508 documented
check(
  'Section 508 compliance',
  anyFileContains('docs/accessibility', '.md', /Section 508/) ? 'PASS' : 'WARN',
  'US government accessibility standard'
);

// 24. WCAG 2.1 AA conformance documented
check(
  'WCAG 2.1 AA conformance',
  anyFileContains('docs/accessibility', '.md', /WCAG 2\.1.*AA|Level AA/) ? 'PASS' : 'WARN',
  'Target conformance level'
);

// 25. Phase 21 summary doc exists
check(
  'Phase 21 summary document',
  fileExists('docs/21-accessibility-compliance.md') ? 'PASS' : 'WARN',
  'docs/21-accessibility-compliance.md'
);

// ── Scoring ──────────────────────────────────────────────
const totalChecks = results.length;
const score = Math.round(((passCount * 4 + warnCount * 2) / (totalChecks * 4)) * 100);

function getGrade(score) {
  if (score >= 97) return 'A+';
  if (score >= 93) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  if (score >= 80) return 'B-';
  if (score >= 77) return 'C+';
  if (score >= 73) return 'C';
  if (score >= 70) return 'C-';
  if (score >= 67) return 'D+';
  if (score >= 63) return 'D';
  if (score >= 60) return 'D-';
  return 'F';
}

// ── Report ───────────────────────────────────────────────
console.log('');
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║        ACCESSIBILITY AUDIT — Focus Mode - Blocker          ║');
console.log('║                     Phase 21                               ║');
console.log('╚══════════════════════════════════════════════════════════════╝');
console.log('');

const maxNameLen = Math.max(...results.map(r => r.name.length));

results.forEach(r => {
  const icon = r.status === 'PASS' ? '✅' : r.status === 'WARN' ? '⚠️ ' : '❌';
  const padded = r.name.padEnd(maxNameLen + 2);
  const detail = r.detail ? ` (${r.detail})` : '';
  console.log(`  ${icon} ${padded} ${r.status}${detail}`);
});

console.log('');
console.log('─'.repeat(64));
console.log(`  Checks: ${totalChecks} | Pass: ${passCount} | Warn: ${warnCount} | Fail: ${failCount}`);
console.log(`  Score:  ${score}/100  Grade: ${getGrade(score)}`);
console.log('─'.repeat(64));
console.log('');

if (score >= 70) {
  console.log('  ✅ AUDIT PASSED');
} else {
  console.log('  ❌ AUDIT FAILED — Score below 70');
}

console.log('');
process.exit(score >= 70 ? 0 : 1);
