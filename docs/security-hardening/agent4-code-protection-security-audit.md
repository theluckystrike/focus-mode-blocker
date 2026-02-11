# Agent 4 — Code Protection & Security Audit Checklist
## Focus Mode - Blocker: Security Hardening

> **Date:** February 11, 2026 | **Phase:** 18 — Security Hardening Audit
> **Scope:** Code obfuscation, anti-tampering, license protection, reverse engineering deterrents, automated security scanning, penetration testing, vulnerability disclosure

---

## 1. Code Protection

### 1.1 Obfuscation Strategy

Focus Mode - Blocker uses obfuscation as a deterrent for casual reverse engineering, not as a security mechanism. Obfuscation protects Pro feature logic from trivial extraction.

**Important Caveats:**
- Obfuscation is NOT encryption — determined attackers can reverse it
- It increases bundle size (typically 2-3x) and may impact performance
- Use primarily as a deterrent, not as a security measure
- Never rely on obfuscation to hide secrets (tokens, API keys)

```javascript
// webpack.config.js - Code protection configuration for Focus Mode - Blocker
const JavaScriptObfuscator = require('webpack-obfuscator');

module.exports = {
  plugins: [
    new JavaScriptObfuscator({
      // Rename identifiers
      identifierNamesGenerator: 'hexadecimal',

      // Keep false — renaming globals breaks Chrome extension APIs
      renameGlobals: false,

      // String array encoding
      stringArray: true,
      stringArrayEncoding: ['base64'],
      stringArrayThreshold: 0.75,

      // Control flow flattening (makes logic harder to follow)
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 0.5,

      // Dead code injection (adds fake code paths)
      deadCodeInjection: true,
      deadCodeInjectionThreshold: 0.2,

      // Split strings into chunks
      splitStrings: true,
      splitStringsChunkLength: 5,

      // Transform object keys
      transformObjectKeys: true,

      // Disable console output in production
      disableConsoleOutput: true,

      // Self-defending (anti-formatting/beautifying)
      selfDefending: true,

      // Debug protection (makes debugger harder to use)
      debugProtection: true,
      debugProtectionInterval: 2000
    }, [
      // Exclude files that shouldn't be obfuscated
      'service-worker.js',   // Keep readable for Chrome debugging
      'content-script.js'    // Keep readable for CSP compliance
    ])
  ]
};
```

**Obfuscation Tiers for Focus Mode - Blocker:**

| File Category | Obfuscation Level | Reason |
|---------------|-------------------|--------|
| Pro feature modules | Maximum | Protect paid feature logic |
| License validation | Maximum | Prevent bypass |
| Focus Score algorithm | High | Protect gamification logic |
| Nuclear Mode logic | High | Prevent bypass |
| Block page content script | None | Must be CSP-compliant, runs in page |
| Service worker | Minimal | Needs Chrome DevTools debugging |
| Popup/Options UI | Medium | Standard protection |
| Utility libraries | Low | Generic code, low value |

### 1.2 Anti-Tampering Measures

```javascript
// src/security/integrity-checker.js
// Verify that critical Focus Mode functions haven't been modified at runtime

class FocusIntegrityChecker {
  static CRITICAL_FUNCTIONS = [
    'validateProLicense',
    'checkSubscriptionStatus',
    'isNuclearModeActive',
    'calculateFocusScore',
    'enforceBlocklist',
    'checkProFeatureAccess'
  ];

  /**
   * Generate hash of function source code
   */
  static hashFunction(fn) {
    const code = fn.toString();
    return this.simpleHash(code);
  }

  /**
   * Fast non-cryptographic hash for runtime checks
   */
  static simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Verify function hasn't been modified since build
   */
  static verifyIntegrity(functionName, fn, expectedHash) {
    const currentHash = this.hashFunction(fn);

    if (currentHash !== expectedHash) {
      console.error(`[Focus Mode Security] Integrity check failed for: ${functionName}`);
      this.handleTampering(functionName);
      return false;
    }

    return true;
  }

  /**
   * Handle detected tampering
   */
  static handleTampering(functionName) {
    console.error('[Focus Mode Security] Tampering detected!', {
      functionName,
      timestamp: Date.now()
    });

    // Response strategy — graduated:
    // 1. Log the incident
    this.logTamperingEvent(functionName);

    // 2. Disable Pro features (prevent free access to paid features)
    this.disableProFeatures();

    // 3. Show user-facing warning
    this.showTamperingWarning();
  }

  static async logTamperingEvent(functionName) {
    const result = await chrome.storage.local.get('focus_tampering_log');
    const log = result.focus_tampering_log || [];

    log.push({
      function: functionName,
      timestamp: Date.now(),
      version: chrome.runtime.getManifest().version
    });

    await chrome.storage.local.set({ focus_tampering_log: log });
  }

  static disableProFeatures() {
    // Set flag that triggers Pro feature lockout
    chrome.storage.local.set({ focus_pro_integrity_failed: true });
  }

  static showTamperingWarning() {
    chrome.notifications.create('tampering-warning', {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('images/warning-icon.png'),
      title: 'Focus Mode - Security Alert',
      message: 'Extension integrity check failed. Pro features have been temporarily disabled. Please reinstall the extension from the Chrome Web Store.',
      priority: 2
    });
  }

  /**
   * Run periodic integrity checks on critical functions
   */
  static startPeriodicChecks(functionMap) {
    // Check every 30 seconds
    setInterval(() => {
      for (const [name, { fn, hash }] of Object.entries(functionMap)) {
        this.verifyIntegrity(name, fn, hash);
      }
    }, 30000);
  }

  /**
   * Build-time: generate function hash map
   * Run during build to generate expected hashes
   */
  static generateHashMap(functions) {
    const hashMap = {};
    for (const [name, fn] of Object.entries(functions)) {
      hashMap[name] = this.hashFunction(fn);
    }
    return hashMap;
  }
}

export { FocusIntegrityChecker };
```

### 1.3 Environment Detection

```javascript
// src/security/environment-checker.js
// Detect potentially hostile runtime environments

class FocusEnvironmentChecker {
  /**
   * Detect if Chrome DevTools are open
   * Used to: disable debug logging, enable extra protection
   */
  static isDevToolsOpen() {
    const threshold = 160;
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;

    return widthThreshold || heightThreshold;
  }

  /**
   * Detect if running under debugger
   */
  static detectDebugger() {
    const start = performance.now();
    debugger;
    const end = performance.now();

    // If debugger paused execution, significant time passed
    return (end - start) > 100;
  }

  /**
   * Verify extension is running from Chrome Web Store
   * Sideloaded extensions may be tampered versions
   */
  static isFromWebStore() {
    const installType = chrome.management?.getSelf?.();
    // 'normal' = from CWS, 'development' = sideloaded
    return installType?.installType === 'normal';
  }

  /**
   * Check if extension context is valid
   */
  static isValidContext() {
    try {
      // Verify chrome.runtime is accessible
      if (!chrome.runtime?.id) return false;

      // Verify manifest is intact
      const manifest = chrome.runtime.getManifest();
      if (!manifest?.name || manifest.name !== 'Focus Mode - Blocker') return false;

      return true;
    } catch {
      return false;
    }
  }
}

export { FocusEnvironmentChecker };
```

### 1.4 Pro License Protection

```javascript
// src/security/license-manager.js
// Secure Pro license validation for Focus Mode - Blocker

class FocusLicenseManager {
  // Zovo API public key (embedded in extension at build time)
  static ZOVO_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...
-----END PUBLIC KEY-----`;

  /**
   * Validate license key format
   * Format: FOCUS-XXXX-XXXX-XXXX
   */
  static validateFormat(licenseKey) {
    const pattern = /^FOCUS-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    return pattern.test(licenseKey);
  }

  /**
   * Verify license signature (offline validation)
   */
  static async verifyLicense(license) {
    try {
      const { key, signature, metadata } = license;

      // Validate format
      if (!this.validateFormat(key)) {
        return { valid: false, error: 'Invalid license format' };
      }

      // Verify cryptographic signature
      const publicKey = await this.importPublicKey();
      const dataToVerify = `${key}:${JSON.stringify(metadata)}`;
      const isValid = await this.verifySignature(dataToVerify, signature, publicKey);

      if (!isValid) {
        return { valid: false, error: 'Invalid license signature' };
      }

      // Check expiration
      if (metadata.expiresAt && Date.now() > metadata.expiresAt) {
        return { valid: false, error: 'License expired' };
      }

      // Check extension ID binding
      if (metadata.extensionId && metadata.extensionId !== chrome.runtime.id) {
        return { valid: false, error: 'License not valid for this extension' };
      }

      return { valid: true, metadata };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Online license validation (primary method)
   * Validates against Zovo API with machine fingerprint
   */
  static async validateOnline(licenseKey) {
    const machineId = await this.getMachineId();

    try {
      const response = await FocusSecureNetwork.post('/api/license/validate', {
        key: licenseKey,
        machineId,
        extensionVersion: chrome.runtime.getManifest().version
      });

      if (response.valid) {
        // Cache the validation result
        await FocusSecureStorage.setSecure('license_cache', {
          key: licenseKey,
          validatedAt: Date.now(),
          expiresAt: response.expiresAt,
          tier: response.tier  // 'monthly', 'annual', 'lifetime'
        }, {
          expiresIn: 24 * 60 * 60 * 1000  // 24 hour cache
        });
      }

      return response;
    } catch (error) {
      // Fallback to cached validation (grace period for offline use)
      const cache = await FocusSecureStorage.getSecure('license_cache');

      if (cache && cache.key === licenseKey) {
        // Allow up to 7 days of offline use
        const offlineDays = (Date.now() - cache.validatedAt) / 86400000;
        if (offlineDays <= 7) {
          return { valid: true, cached: true, offlineDays: Math.floor(offlineDays) };
        }
      }

      throw error;
    }
  }

  /**
   * Generate machine identifier for license binding
   * Non-identifying: combines extension + browser factors
   */
  static async getMachineId() {
    const factors = [
      chrome.runtime.id,           // Extension ID (unique per install)
      navigator.userAgent,         // Browser version
      navigator.language,          // Locale
      screen.colorDepth,           // Display
      new Date().getTimezoneOffset(), // Timezone
      navigator.hardwareConcurrency  // CPU cores
    ];

    const fingerprint = factors.join('|');
    return FocusDataEncryption.hash(fingerprint);
  }

  static async importPublicKey() {
    const pemContents = this.ZOVO_PUBLIC_KEY
      .replace('-----BEGIN PUBLIC KEY-----', '')
      .replace('-----END PUBLIC KEY-----', '')
      .replace(/\s/g, '');

    const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

    return crypto.subtle.importKey(
      'spki',
      binaryKey,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );
  }

  static async verifySignature(data, signature, publicKey) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const signatureBuffer = Uint8Array.from(atob(signature), c => c.charCodeAt(0));

    return crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      publicKey,
      signatureBuffer,
      dataBuffer
    );
  }
}

export { FocusLicenseManager };
```

### 1.5 Anti-Debug (Production Only)

```javascript
// src/security/anti-debug.js
// Reverse engineering deterrents — production builds only

class FocusAntiDebug {
  static init() {
    // Only enable in production builds
    if (process.env.NODE_ENV !== 'production') return;

    this.detectDevTools();
    this.preventSourceViewing();
  }

  /**
   * Detect DevTools opening and respond
   */
  static detectDevTools() {
    // Method 1: Window size delta
    const checkWindowSize = () => {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;

      if (widthDiff > threshold || heightDiff > threshold) {
        this.handleDebugDetected('devtools-size');
      }
    };

    // Check periodically (not too frequently — avoid perf impact)
    setInterval(checkWindowSize, 5000);
  }

  /**
   * Disable common source viewing shortcuts in extension pages
   */
  static preventSourceViewing() {
    document.addEventListener('keydown', e => {
      // F12 (DevTools)
      if (e.keyCode === 123) e.preventDefault();
      // Ctrl+Shift+I/J/C (DevTools panels)
      if (e.ctrlKey && e.shiftKey && [73, 74, 67].includes(e.keyCode)) {
        e.preventDefault();
      }
      // Ctrl+U (View Source)
      if (e.ctrlKey && e.keyCode === 85) e.preventDefault();
    });
  }

  /**
   * Handle debug detection — soft response
   * We don't want to break the extension for legitimate users with DevTools open
   */
  static handleDebugDetected(method) {
    // Soft response: just suppress sensitive console output
    // Don't break functionality — that hurts legitimate users
    console.warn('[Focus Mode] Debug tools detected');
  }
}

export { FocusAntiDebug };
```

---

## 2. Security Audit Checklist

### 2.1 Pre-Release Security Review

```markdown
## Focus Mode - Blocker Security Audit Checklist

### Manifest Security
- [ ] Using Manifest V3
- [ ] Minimum required permissions (storage, alarms, activeTab, notifications, declarativeNetRequest)
- [ ] No `<all_urls>` host permission
- [ ] Optional permissions for non-core features (tabs, contextMenus, scripting)
- [ ] Strict CSP configured in manifest.json
- [ ] No remote code loading
- [ ] Extension version incremented

### Code Security
- [ ] No `eval()` or `new Function()` anywhere in extension code
- [ ] No `innerHTML` with user input (all use textContent or DOMPurify)
- [ ] All user input validated (FocusInputValidator)
- [ ] XSS protections verified (SafeDOM, SafeTemplate)
- [ ] Block page uses Shadow DOM for isolation
- [ ] Content scripts don't trust page DOM data
- [ ] Secure random number generation (crypto.getRandomValues)

### Data Security
- [ ] Pro tokens encrypted at rest (FocusSecureStorage)
- [ ] No credentials in source code
- [ ] PII minimization in telemetry (FocusPIIHandler)
- [ ] Blocklist URLs categorized, not sent raw
- [ ] Storage limits enforced (90 days session history)
- [ ] Encryption key rotates per browser session

### Network Security
- [ ] All connections use HTTPS (FocusSecureNetwork.enforceHTTPS)
- [ ] Only approved domains (api.zovo.one, api.stripe.com)
- [ ] API response validation enabled
- [ ] Request timeout configured (30s)
- [ ] Error messages don't leak sensitive info

### Authentication
- [ ] Pro tokens stored encrypted
- [ ] Token expiration handled with auto-refresh
- [ ] License cache expires after 24 hours
- [ ] Offline grace period limited to 7 days
- [ ] Full logout clears all tokens and license data

### Message Passing
- [ ] All message types explicitly allowlisted
- [ ] External messages limited to 3 types
- [ ] Origin validation for external messages (zovo.one only)
- [ ] Message size limits (10KB external)
- [ ] Sender ID validation for internal messages

### Third-Party Code
- [ ] npm audit shows no critical/high vulnerabilities
- [ ] All dependencies reviewed (vendor-review.js)
- [ ] Lock file integrity verified
- [ ] Build is reproducible
- [ ] Only approved dependencies (DOMPurify, Stripe)

### Privacy
- [ ] Privacy policy updated for current data practices
- [ ] All data collection disclosed in CWS listing
- [ ] Telemetry is opt-in
- [ ] Data export available (Settings > Export)
- [ ] Data deletion supported (Settings > Reset)
- [ ] No browsing history collected
```

### 2.2 Automated Security Scanner

```javascript
// scripts/security-scan.js
// Static analysis security scanner for Focus Mode - Blocker

const fs = require('fs');
const path = require('path');

class FocusSecurityScanner {
  static VULNERABILITY_PATTERNS = [
    {
      name: 'eval-usage',
      pattern: /eval\s*\(/g,
      severity: 'critical',
      message: 'Use of eval() detected — prohibited in MV3'
    },
    {
      name: 'new-function',
      pattern: /new\s+Function\s*\(/g,
      severity: 'critical',
      message: 'new Function() detected — prohibited in MV3'
    },
    {
      name: 'innerHTML-usage',
      pattern: /\.innerHTML\s*=/g,
      severity: 'high',
      message: 'Direct innerHTML assignment — use textContent or DOMPurify'
    },
    {
      name: 'document-write',
      pattern: /document\.write/g,
      severity: 'high',
      message: 'document.write() detected — use DOM APIs'
    },
    {
      name: 'hardcoded-secrets',
      pattern: /(api[_-]?key|password|secret|token)\s*[:=]\s*['"][^'"]{8,}['"]/gi,
      severity: 'critical',
      message: 'Possible hardcoded secret — use FocusSecureStorage'
    },
    {
      name: 'http-url',
      pattern: /['"]http:\/\/[^"'\s]+['"]/g,
      severity: 'medium',
      message: 'Insecure HTTP URL — use HTTPS'
    },
    {
      name: 'unsafe-regex',
      pattern: /new\s+RegExp\s*\([^)]*\+/g,
      severity: 'medium',
      message: 'Dynamic regex construction — potential ReDoS'
    },
    {
      name: 'localstorage-sensitive',
      pattern: /localStorage\.(set|get)Item\s*\([^)]*(?:password|token|key|secret)/gi,
      severity: 'high',
      message: 'Sensitive data in localStorage — use FocusSecureStorage'
    },
    {
      name: 'outerhtml-usage',
      pattern: /\.outerHTML\s*=/g,
      severity: 'high',
      message: 'outerHTML assignment — use DOM APIs'
    },
    {
      name: 'insertadjacenthtml',
      pattern: /\.insertAdjacentHTML\s*\(/g,
      severity: 'medium',
      message: 'insertAdjacentHTML — verify input is sanitized'
    },
    {
      name: 'all-urls-permission',
      pattern: /<all_urls>/g,
      severity: 'critical',
      message: '<all_urls> detected — use specific host permissions'
    },
    {
      name: 'console-log-sensitive',
      pattern: /console\.(log|info|debug)\s*\([^)]*(?:token|password|secret|key)/gi,
      severity: 'medium',
      message: 'Possible sensitive data in console output'
    }
  ];

  static async scan(directory) {
    const results = {
      timestamp: new Date().toISOString(),
      extension: 'Focus Mode - Blocker',
      scannedFiles: 0,
      findings: [],
      summary: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      }
    };

    await this.scanDirectory(directory, results);

    for (const finding of results.findings) {
      results.summary[finding.severity]++;
    }

    return results;
  }

  static async scanDirectory(dir, results) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') {
        continue;
      }

      if (entry.isDirectory()) {
        await this.scanDirectory(fullPath, results);
      } else if (this.shouldScan(entry.name)) {
        await this.scanFile(fullPath, results);
      }
    }
  }

  static shouldScan(filename) {
    const scanExtensions = ['.js', '.ts', '.jsx', '.tsx', '.html', '.json'];
    return scanExtensions.some(ext => filename.endsWith(ext));
  }

  static async scanFile(filePath, results) {
    results.scannedFiles++;
    const content = fs.readFileSync(filePath, 'utf8');

    for (const vuln of this.VULNERABILITY_PATTERNS) {
      let match;
      const regex = new RegExp(vuln.pattern.source, vuln.pattern.flags);

      while ((match = regex.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;

        results.findings.push({
          file: filePath,
          line: lineNumber,
          severity: vuln.severity,
          rule: vuln.name,
          message: vuln.message,
          match: match[0].substring(0, 100)
        });
      }
    }
  }

  static generateReport(results) {
    console.log('\n=== Focus Mode - Blocker Security Scan ===\n');
    console.log(`Scanned: ${results.scannedFiles} files`);
    console.log(`Findings: ${results.findings.length} total`);
    console.log(`  Critical: ${results.summary.critical}`);
    console.log(`  High:     ${results.summary.high}`);
    console.log(`  Medium:   ${results.summary.medium}`);
    console.log(`  Low:      ${results.summary.low}`);

    if (results.findings.length > 0) {
      console.log('\n--- Findings ---\n');

      const bySeverity = { critical: [], high: [], medium: [], low: [] };

      for (const finding of results.findings) {
        bySeverity[finding.severity].push(finding);
      }

      for (const severity of ['critical', 'high', 'medium', 'low']) {
        if (bySeverity[severity].length > 0) {
          console.log(`\n[${severity.toUpperCase()}]`);
          for (const finding of bySeverity[severity]) {
            console.log(`  ${finding.file}:${finding.line}`);
            console.log(`    ${finding.message}`);
            console.log(`    Match: ${finding.match}`);
          }
        }
      }
    }

    // Exit with failure if critical or high findings
    const exitCode = (results.summary.critical > 0 || results.summary.high > 0) ? 1 : 0;
    if (exitCode === 0) {
      console.log('\n[PASS] No critical or high severity issues found');
    } else {
      console.log('\n[FAIL] Critical or high severity issues must be resolved');
    }

    return exitCode;
  }
}

// Run scanner
const srcDir = process.argv[2] || './src';
FocusSecurityScanner.scan(srcDir).then(results => {
  const exitCode = FocusSecurityScanner.generateReport(results);
  fs.writeFileSync('security-scan-results.json', JSON.stringify(results, null, 2));
  process.exit(exitCode);
});
```

### 2.3 Penetration Testing Guide

```markdown
## Focus Mode - Blocker Penetration Testing Guide

### 1. Reconnaissance
- Extract and analyze manifest.json permissions
- List all extension pages (popup, options, block page)
- Map all message types (INTERNAL_MESSAGE_TYPES, EXTERNAL_MESSAGE_TYPES)
- Identify content script injection points
- Review declarativeNetRequest rules

### 2. Static Analysis
- Deobfuscate production bundle (if obfuscated)
- Search for hardcoded API keys, tokens, secrets
- Identify all API endpoints (api.zovo.one, api.stripe.com)
- Review CSP configuration
- Check for vulnerable npm dependencies

### 3. Dynamic Analysis
- Monitor network traffic during Pro license validation
- Intercept chrome.runtime.sendMessage calls
- Test input validation on blocklist URL field
- Analyze chrome.storage contents
- Debug service worker lifecycle

### 4. Attack Vectors to Test

#### 4a. Message Passing Attacks
- Send crafted messages from web page to extension
- Test all EXTERNAL_MESSAGE_TYPES with malicious payloads
- Attempt to send INTERNAL_MESSAGE_TYPES from external origin
- Test oversized messages (>10KB)

#### 4b. Storage Manipulation
- Modify chrome.storage.local to bypass Pro checks
- Tamper with Focus Score, streak data
- Inject false license_cache
- Modify churn detection data

#### 4c. Block Page Bypass
- Attempt to remove Shadow DOM host element
- Modify declarativeNetRequest rules
- Disable service worker
- Navigate during Nuclear Mode

#### 4d. XSS via Blocklist
- Add blocklist entry with XSS payload
- Test custom block page message with script injection
- Test import/export with crafted JSON

#### 4e. Pro Feature Bypass
- Modify isProUser flag in storage
- Replay old license validation responses
- Manipulate Stripe checkout flow

### 5. Reporting Template
For each finding:
- Vulnerability description
- Steps to reproduce
- Impact assessment (What can an attacker do?)
- CVSS score
- Recommended remediation
- Proof of concept (screenshot/code)
```

### 2.4 Vulnerability Disclosure Program

```markdown
## Focus Mode - Blocker Security Vulnerability Disclosure Policy

### Scope
This policy applies to security vulnerabilities in:
- Focus Mode - Blocker Chrome/Firefox/Edge extensions
- Zovo API (api.zovo.one)
- Zovo website (zovo.one)
- Related web services

### Out of Scope
- Social engineering attacks against Zovo team
- Physical security issues
- Third-party services (Stripe, Chrome Web Store)
- Issues already reported or being fixed
- Denial of service attacks

### Reporting Process

1. **Submit Report**
   Email: security@zovo.one
   PGP Key: Available at zovo.one/security/pgp-key.txt

2. **Include in Report**
   - Detailed description of vulnerability
   - Affected extension version
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
   - Your contact information

3. **Response Timeline**
   - Initial acknowledgment: 48 hours
   - Triage and assessment: 7 days
   - Resolution target: 30 days (critical), 90 days (medium/low)

### Safe Harbor
Zovo will not pursue legal action against researchers who:
- Act in good faith
- Avoid accessing user data
- Don't disrupt Focus Mode service
- Report vulnerabilities through proper channels
- Allow reasonable time for remediation

### Recognition
- Hall of Fame at zovo.one/security/hall-of-fame
- Bounty program for qualifying reports

| Severity | Bounty Range |
|----------|--------------|
| Critical | $500-$2000 |
| High     | $200-$500  |
| Medium   | $50-$200   |
| Low      | Credit only |
```

---

## 3. CI/CD Security Integration

```yaml
# .github/workflows/security.yml
name: Security Checks

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: npm audit
        run: npm audit --audit-level=high

      - name: Lock file integrity
        run: node scripts/verify-lockfile.js

      - name: Security scan
        run: node scripts/security-scan.js ./src

      - name: Vendor review
        run: node scripts/vendor-review.js

      - name: Build
        run: npm run build

      - name: Verify reproducible build
        run: |
          cp -r dist dist-first
          rm -rf dist
          npm run build
          diff <(find dist-first -type f -exec sha256sum {} \; | sort) \
               <(find dist -type f -exec sha256sum {} \; | sort) || \
               (echo "Build not reproducible!" && exit 1)

      - name: Upload scan results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: security-scan-results
          path: security-scan-results.json
```

---

## 4. Implementation Priority

| Priority | Component | Complexity |
|----------|-----------|------------|
| P0 | FocusSecurityScanner (static analysis) | Medium |
| P0 | Security audit checklist | Low |
| P0 | CI/CD security workflow | Low |
| P1 | FocusIntegrityChecker (anti-tampering) | Medium |
| P1 | FocusLicenseManager (Pro protection) | Medium |
| P1 | Vulnerability disclosure policy | Low |
| P2 | Code obfuscation config | Low |
| P2 | FocusAntiDebug (production) | Low |
| P2 | Penetration testing guide | Low |
| P3 | FocusEnvironmentChecker | Low |

---

*Agent 4 — Code Protection & Security Audit Checklist — Complete*
