# Agent 3 — Data Protection & Supply Chain Security
## Focus Mode - Blocker: Security Hardening

> **Date:** February 11, 2026 | **Phase:** 18 — Security Hardening Audit
> **Scope:** Secure storage, encryption at rest, credential handling, PII minimization, dependency auditing, lock file integrity, vendor code review, build reproducibility

---

## 1. Data Protection

### 1.1 Secure Storage Patterns

Focus Mode - Blocker stores sensitive data in chrome.storage (Pro license tokens, encrypted settings, Focus Score history). This data must be encrypted at rest.

```javascript
// src/security/secure-storage.js
// Encrypted storage layer for Focus Mode - Blocker

class FocusSecureStorage {
  static ENCRYPTION_KEY_NAME = 'focus_storage_encryption_key';

  /**
   * Initialize encrypted storage on extension load
   */
  static async init() {
    const existingKey = await this.getEncryptionKey();

    if (!existingKey) {
      await this.generateEncryptionKey();
    }
  }

  /**
   * Generate and store encryption key
   * Key is stored in chrome.storage.session (cleared when browser closes)
   * This means encrypted data becomes inaccessible after browser restart
   * unless re-derived from user credentials
   */
  static async generateEncryptionKey() {
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    const exportedKey = await crypto.subtle.exportKey('jwk', key);

    // Store in session storage — cleared when browser closes
    await chrome.storage.session.set({
      [this.ENCRYPTION_KEY_NAME]: exportedKey
    });

    return key;
  }

  /**
   * Retrieve encryption key from session storage
   */
  static async getEncryptionKey() {
    const result = await chrome.storage.session.get(this.ENCRYPTION_KEY_NAME);
    const jwk = result[this.ENCRYPTION_KEY_NAME];

    if (!jwk) return null;

    return crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Store encrypted data
   * Used for: Pro license tokens, API keys, sensitive user preferences
   */
  static async setSecure(key, value, options = {}) {
    const encryptionKey = await this.getEncryptionKey();

    if (!encryptionKey) {
      throw new Error('[Focus Mode Security] Encryption not initialized');
    }

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(JSON.stringify(value));

    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      encryptionKey,
      encodedData
    );

    const storageValue = {
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encryptedData)),
      timestamp: Date.now(),
      version: 1
    };

    // Add expiration if specified
    if (options.expiresIn) {
      storageValue.expiresAt = Date.now() + options.expiresIn;
    }

    const storageArea = options.sync ? chrome.storage.sync : chrome.storage.local;
    await storageArea.set({ [`secure_${key}`]: storageValue });
  }

  /**
   * Retrieve and decrypt data
   */
  static async getSecure(key, options = {}) {
    const storageArea = options.sync ? chrome.storage.sync : chrome.storage.local;
    const result = await storageArea.get(`secure_${key}`);
    const storageValue = result[`secure_${key}`];

    if (!storageValue) return null;

    // Check expiration
    if (storageValue.expiresAt && Date.now() > storageValue.expiresAt) {
      await this.removeSecure(key, options);
      return null;
    }

    const encryptionKey = await this.getEncryptionKey();

    if (!encryptionKey) {
      throw new Error('[Focus Mode Security] Encryption not initialized — key may have expired with session');
    }

    const iv = new Uint8Array(storageValue.iv);
    const encryptedData = new Uint8Array(storageValue.data);

    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      encryptionKey,
      encryptedData
    );

    return JSON.parse(new TextDecoder().decode(decryptedData));
  }

  /**
   * Remove stored encrypted data
   */
  static async removeSecure(key, options = {}) {
    const storageArea = options.sync ? chrome.storage.sync : chrome.storage.local;
    await storageArea.remove(`secure_${key}`);
  }

  /**
   * Clear all encrypted data (used during full reset or security incident)
   */
  static async clearAll() {
    await chrome.storage.local.clear();
    await chrome.storage.sync.clear();
    await chrome.storage.session.clear();
  }
}

// Initialize on service worker load
FocusSecureStorage.init();

export { FocusSecureStorage };
```

### 1.2 Encryption for Sensitive Data at Rest

```javascript
// src/security/data-encryption.js
// Password-derived encryption for Focus Mode - Blocker sensitive data

class FocusDataEncryption {
  /**
   * Derive encryption key from password/passphrase
   * Used for: Nuclear Mode password protection (Pro feature),
   *           export/import encryption
   */
  static async deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,  // OWASP recommended minimum
        hash: 'SHA-256'
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt data with password
   * Used for: encrypted blocklist export, Nuclear Mode password vault
   */
  static async encryptWithPassword(data, password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await this.deriveKey(password, salt);

    const encodedData = new TextEncoder().encode(JSON.stringify(data));

    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedData
    );

    return {
      salt: Array.from(salt),
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encryptedData)),
      version: 1
    };
  }

  /**
   * Decrypt data with password
   */
  static async decryptWithPassword(encryptedPackage, password) {
    const salt = new Uint8Array(encryptedPackage.salt);
    const iv = new Uint8Array(encryptedPackage.iv);
    const encryptedData = new Uint8Array(encryptedPackage.data);

    const key = await this.deriveKey(password, salt);

    try {
      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encryptedData
      );

      return JSON.parse(new TextDecoder().decode(decryptedData));
    } catch (error) {
      throw new Error('Decryption failed — incorrect password or corrupted data');
    }
  }

  /**
   * Hash sensitive data (one-way) — used for anonymous telemetry IDs
   */
  static async hash(data) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Constant-time comparison (prevents timing attacks)
   */
  static secureCompare(a, b) {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }
}

export { FocusDataEncryption };
```

### 1.3 Credential Handling

```javascript
// src/security/credential-manager.js
// Secure management of Pro license tokens and API keys

class FocusCredentialManager {
  static TOKEN_KEY = 'pro_auth_token';
  static REFRESH_KEY = 'pro_refresh_token';
  static LICENSE_KEY = 'pro_license_key';

  /**
   * Store Pro authentication tokens securely
   */
  static async storeTokens(accessToken, refreshToken, expiresIn) {
    // Store access token with expiration
    await FocusSecureStorage.setSecure(this.TOKEN_KEY, {
      token: accessToken,
      storedAt: Date.now()
    }, {
      expiresIn: expiresIn * 1000
    });

    // Store refresh token separately (longer lived)
    if (refreshToken) {
      await FocusSecureStorage.setSecure(this.REFRESH_KEY, {
        token: refreshToken,
        storedAt: Date.now()
      });
    }
  }

  /**
   * Retrieve valid access token, refreshing if needed
   */
  static async getAccessToken() {
    const tokenData = await FocusSecureStorage.getSecure(this.TOKEN_KEY);

    if (!tokenData) {
      return this.refreshAccessToken();
    }

    return tokenData.token;
  }

  /**
   * Refresh expired access token
   */
  static async refreshAccessToken() {
    const refreshData = await FocusSecureStorage.getSecure(this.REFRESH_KEY);

    if (!refreshData) {
      throw new Error('No refresh token — Pro re-authentication required');
    }

    try {
      const response = await FocusSecureNetwork.post('/auth/refresh', {
        refresh_token: refreshData.token
      });

      await this.storeTokens(
        response.access_token,
        response.refresh_token,
        response.expires_in
      );

      return response.access_token;
    } catch (error) {
      // Clear invalid tokens
      await this.clearTokens();
      throw new Error('Token refresh failed — Pro re-authentication required');
    }
  }

  /**
   * Store Pro license key
   */
  static async storeLicenseKey(licenseKey) {
    const keyHash = await FocusDataEncryption.hash(licenseKey);

    await FocusSecureStorage.setSecure(this.LICENSE_KEY, {
      key: licenseKey,
      hash: keyHash,
      activatedAt: Date.now()
    });
  }

  /**
   * Get stored license key
   */
  static async getLicenseKey() {
    const data = await FocusSecureStorage.getSecure(this.LICENSE_KEY);
    return data?.key;
  }

  /**
   * Clear all tokens (logout / downgrade to free)
   */
  static async clearTokens() {
    await FocusSecureStorage.removeSecure(this.TOKEN_KEY);
    await FocusSecureStorage.removeSecure(this.REFRESH_KEY);
  }

  /**
   * Check if user has valid Pro authentication
   */
  static async isProAuthenticated() {
    try {
      const token = await this.getAccessToken();
      return !!token;
    } catch {
      return false;
    }
  }

  /**
   * Full Pro logout — clears tokens and license
   */
  static async fullLogout() {
    await this.clearTokens();
    await FocusSecureStorage.removeSecure(this.LICENSE_KEY);
  }
}

export { FocusCredentialManager };
```

### 1.4 PII Minimization

Focus Mode - Blocker collects minimal user data. This handler ensures no PII leaks into logs, telemetry, or storage.

```javascript
// src/security/pii-handler.js
// PII detection and minimization for Focus Mode - Blocker

class FocusPIIHandler {
  static PII_PATTERNS = {
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    ssn: /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g,
    creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    ipAddress: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g
  };

  /**
   * Detect PII in text (for auditing/logging)
   */
  static detectPII(text) {
    const findings = [];

    for (const [type, pattern] of Object.entries(this.PII_PATTERNS)) {
      const matches = text.match(pattern);
      if (matches) {
        findings.push({
          type,
          count: matches.length,
          samples: matches.slice(0, 3).map(m => this.mask(m, type))
        });
      }
    }

    return findings;
  }

  /**
   * Redact PII from text before logging/telemetry
   */
  static redact(text, typesToRedact = Object.keys(this.PII_PATTERNS)) {
    let redacted = text;

    for (const type of typesToRedact) {
      const pattern = this.PII_PATTERNS[type];
      if (pattern) {
        redacted = redacted.replace(pattern, `[REDACTED_${type.toUpperCase()}]`);
      }
    }

    return redacted;
  }

  /**
   * Mask PII (show partial)
   */
  static mask(value, type) {
    switch (type) {
      case 'email':
        const [local, domain] = value.split('@');
        return `${local[0]}***@${domain}`;
      case 'phone':
        return `***-***-${value.slice(-4)}`;
      case 'ssn':
        return `***-**-${value.slice(-4)}`;
      case 'creditCard':
        return `****-****-****-${value.slice(-4)}`;
      default:
        return '***';
    }
  }

  /**
   * Data minimization — keep only necessary fields
   * Used before sending any data to Zovo API
   */
  static minimize(data, allowedFields) {
    if (Array.isArray(data)) {
      return data.map(item => this.minimize(item, allowedFields));
    }

    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const minimized = {};

    for (const field of allowedFields) {
      if (field in data) {
        minimized[field] = data[field];
      }
    }

    return minimized;
  }

  /**
   * Sanitize data before logging — removes sensitive keys
   */
  static sanitizeForLogging(data) {
    if (typeof data === 'string') {
      return this.redact(data);
    }

    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sensitiveKeys = new Set([
      'password', 'token', 'secret', 'apikey', 'api_key',
      'authorization', 'cookie', 'session', 'credit_card',
      'ssn', 'social_security', 'license_key', 'refresh_token',
      'access_token', 'stripe_key'
    ]);

    const sanitized = Array.isArray(data) ? [] : {};

    for (const [key, value] of Object.entries(data)) {
      if (sensitiveKeys.has(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitizeForLogging(value);
      } else if (typeof value === 'string') {
        sanitized[key] = this.redact(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Focus Mode-specific: sanitize blocklist URLs before telemetry
   * URLs could contain PII (e.g., user-specific subdomains)
   */
  static sanitizeBlocklistForTelemetry(blocklist) {
    return blocklist.map(entry => {
      // Only send domain, not full URL
      try {
        const domain = new URL(`https://${entry.url}`).hostname;
        // Categorize instead of sending actual domain
        return {
          category: this.categorizeDomain(domain),
          enabled: entry.enabled,
          addedDaysAgo: Math.floor((Date.now() - entry.addedAt) / 86400000)
        };
      } catch {
        return { category: 'unknown', enabled: entry.enabled };
      }
    });
  }

  /**
   * Categorize domain for anonymous telemetry
   */
  static categorizeDomain(domain) {
    const categories = {
      social: ['facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com', 'reddit.com', 'linkedin.com', 'x.com'],
      video: ['youtube.com', 'netflix.com', 'twitch.tv', 'hulu.com', 'disneyplus.com'],
      news: ['cnn.com', 'bbc.com', 'nytimes.com', 'news.google.com'],
      shopping: ['amazon.com', 'ebay.com', 'etsy.com', 'shopify.com'],
      gaming: ['store.steampowered.com', 'twitch.tv', 'discord.com'],
      messaging: ['messenger.com', 'web.whatsapp.com', 'slack.com', 'discord.com']
    };

    for (const [category, domains] of Object.entries(categories)) {
      if (domains.some(d => domain.includes(d))) {
        return category;
      }
    }

    return 'other';
  }
}

export { FocusPIIHandler };
```

### 1.5 Data Storage Security Map

| Data Type | Storage Location | Encrypted? | Expiration | PII Risk |
|-----------|-----------------|------------|------------|----------|
| Blocklist | chrome.storage.local | No (not sensitive) | None | Low (domains only) |
| Focus Score | chrome.storage.local | No | None | None |
| Streak data | chrome.storage.local | No | None | None |
| Session history | chrome.storage.local | No | 90 days | None |
| Pro license token | chrome.storage.local (encrypted) | Yes (AES-256-GCM) | Token TTL | Low |
| Refresh token | chrome.storage.local (encrypted) | Yes (AES-256-GCM) | 30 days | Low |
| License key | chrome.storage.local (encrypted) | Yes (AES-256-GCM) | None | Low |
| Encryption key | chrome.storage.session | N/A (is the key) | Browser session | None |
| Settings | chrome.storage.sync | No | None | None |
| Churn data | chrome.storage.local | No | 90 days | None |
| Telemetry ID | chrome.storage.local | SHA-256 hashed | None | None (hashed) |
| Nuclear Mode password | chrome.storage.local (encrypted) | Yes (PBKDF2 + AES) | None | Medium |
| Permission log | chrome.storage.local | No | 100 entries | None |
| Security log | chrome.storage.local | No | 500 entries | None |

---

## 2. Supply Chain Security

### 2.1 Dependency Auditing

Focus Mode - Blocker minimizes dependencies to reduce attack surface. Every dependency must be justified and audited.

**Approved Dependencies:**

| Package | Purpose | Risk | Justification |
|---------|---------|------|---------------|
| DOMPurify | HTML sanitization | Low | Industry standard, actively maintained, small footprint |
| Stripe.js | Payment processing | Low | Official Stripe SDK, loaded from Stripe CDN |

**package.json Security Scripts:**

```json
{
  "scripts": {
    "audit": "npm audit",
    "audit:fix": "npm audit fix",
    "audit:report": "npm audit --json > audit-report.json",
    "deps:check": "npm outdated",
    "deps:security": "npx better-npm-audit audit",
    "deps:licenses": "npx license-checker --summary",
    "deps:vulnerabilities": "npx snyk test",
    "security:scan": "node scripts/security-scan.js ./src",
    "security:vendor-review": "node scripts/vendor-review.js",
    "security:full": "npm run audit && npm run deps:security && npm run security:scan"
  }
}
```

**Automated Dependency Checking:**

```javascript
// scripts/security-audit.js
// Run as part of CI/CD and pre-release checks

const { execSync } = require('child_process');
const fs = require('fs');

class FocusDependencyAuditor {
  static run() {
    const report = {
      timestamp: new Date().toISOString(),
      extension: 'Focus Mode - Blocker',
      vulnerabilities: [],
      outdated: [],
      licenses: [],
      passed: true
    };

    // Run npm audit
    try {
      const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
      const audit = JSON.parse(auditResult);

      if (audit.vulnerabilities) {
        for (const [name, vuln] of Object.entries(audit.vulnerabilities)) {
          report.vulnerabilities.push({
            package: name,
            severity: vuln.severity,
            via: vuln.via,
            fixAvailable: vuln.fixAvailable
          });
        }
      }
    } catch (error) {
      if (error.stdout) {
        try {
          const audit = JSON.parse(error.stdout);
          if (audit.vulnerabilities) {
            for (const [name, vuln] of Object.entries(audit.vulnerabilities)) {
              report.vulnerabilities.push({
                package: name,
                severity: vuln.severity,
                via: vuln.via,
                fixAvailable: vuln.fixAvailable
              });
            }
          }
        } catch (parseError) {
          report.vulnerabilities.push({
            package: 'audit-error',
            severity: 'unknown',
            message: 'Failed to parse npm audit output'
          });
        }
      }
    }

    // Check for outdated packages
    try {
      const outdatedResult = execSync('npm outdated --json', { encoding: 'utf8' });
      report.outdated = JSON.parse(outdatedResult);
    } catch (error) {
      if (error.stdout) {
        try {
          report.outdated = JSON.parse(error.stdout);
        } catch {
          // No outdated packages
        }
      }
    }

    // Generate report
    fs.writeFileSync(
      'security-audit-report.json',
      JSON.stringify(report, null, 2)
    );

    // Fail if critical or high vulnerabilities
    const critical = report.vulnerabilities.filter(v =>
      v.severity === 'critical' || v.severity === 'high'
    );

    if (critical.length > 0) {
      console.error(`\n[FAIL] Found ${critical.length} critical/high vulnerabilities!`);
      critical.forEach(v => console.error(`  - ${v.package}: ${v.severity}`));
      report.passed = false;
      process.exit(1);
    }

    console.log('[PASS] Security audit complete — no critical vulnerabilities');
    return report;
  }
}

FocusDependencyAuditor.run();
```

### 2.2 Lock File Integrity

```javascript
// scripts/verify-lockfile.js
// Verify package-lock.json hasn't been tampered with

const crypto = require('crypto');
const fs = require('fs');

class FocusLockfileVerifier {
  static INTEGRITY_FILE = '.lockfile-integrity';

  static generateHash(filePath) {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  static verify() {
    const lockfilePath = 'package-lock.json';

    if (!fs.existsSync(lockfilePath)) {
      console.error('[Focus Mode] package-lock.json not found');
      process.exit(1);
    }

    const currentHash = this.generateHash(lockfilePath);

    if (fs.existsSync(this.INTEGRITY_FILE)) {
      const storedHash = fs.readFileSync(this.INTEGRITY_FILE, 'utf8').trim();

      if (currentHash !== storedHash) {
        console.warn('[Focus Mode] WARNING: package-lock.json has changed!');
        console.warn('Review changes before proceeding.');

        // In CI, fail the build
        if (process.env.CI) {
          console.error('[FAIL] Lock file integrity check failed in CI');
          process.exit(1);
        }
      } else {
        console.log('[PASS] Lock file integrity verified');
      }
    } else {
      console.log('[INFO] No integrity hash found — creating initial hash');
      this.update();
    }

    return currentHash;
  }

  static update() {
    const lockfilePath = 'package-lock.json';
    const hash = this.generateHash(lockfilePath);
    fs.writeFileSync(this.INTEGRITY_FILE, hash);
    console.log('[Focus Mode] Lock file integrity hash updated');
  }

  static validatePackageIntegrity() {
    const lockfile = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
    const issues = [];

    const checkPackage = (name, pkg) => {
      if (!pkg.integrity) {
        issues.push(`Missing integrity hash for: ${name}`);
      }

      // Check for git/file dependencies (security risk)
      if (pkg.resolved && (
        pkg.resolved.startsWith('git') ||
        pkg.resolved.startsWith('file')
      )) {
        issues.push(`Non-registry dependency: ${name} -> ${pkg.resolved}`);
      }
    };

    if (lockfile.packages) {
      for (const [name, pkg] of Object.entries(lockfile.packages)) {
        if (name && name !== '') {
          checkPackage(name, pkg);
        }
      }
    }

    if (issues.length > 0) {
      console.warn('[Focus Mode] Package integrity issues:');
      issues.forEach(issue => console.warn(`  - ${issue}`));
    } else {
      console.log('[PASS] All packages have integrity hashes');
    }

    return issues;
  }
}

// Run verification
FocusLockfileVerifier.verify();
FocusLockfileVerifier.validatePackageIntegrity();
```

### 2.3 Vendor Code Review

```javascript
// scripts/vendor-review.js
// Scan vendor dependencies for suspicious patterns

const fs = require('fs');
const path = require('path');

class FocusVendorReviewer {
  static SUSPICIOUS_PATTERNS = [
    { pattern: /eval\s*\(/, name: 'eval-usage', severity: 'critical' },
    { pattern: /new\s+Function\s*\(/, name: 'function-constructor', severity: 'critical' },
    { pattern: /child_process/, name: 'child-process', severity: 'high' },
    { pattern: /exec\s*\(/, name: 'exec-usage', severity: 'high' },
    { pattern: /execSync\s*\(/, name: 'exec-sync-usage', severity: 'high' },
    { pattern: /spawn\s*\(/, name: 'spawn-usage', severity: 'high' },
    { pattern: /require\s*\(\s*['"]https?:/, name: 'remote-require', severity: 'critical' },
    { pattern: /\.env/, name: 'env-access', severity: 'medium' },
    { pattern: /process\.env/, name: 'process-env', severity: 'medium' },
    { pattern: /fs\.(write|unlink|rm|chmod)/, name: 'fs-write', severity: 'high' },
    { pattern: /Buffer\.from.*base64/, name: 'base64-buffer', severity: 'low' },
    { pattern: /crypto\.createDecipher/, name: 'weak-crypto', severity: 'high' }
  ];

  static async reviewPackage(packageName) {
    const packagePath = path.join('node_modules', packageName);

    if (!fs.existsSync(packagePath)) {
      console.error(`Package not found: ${packageName}`);
      return null;
    }

    const findings = [];

    // Review package.json
    const pkgJson = JSON.parse(
      fs.readFileSync(path.join(packagePath, 'package.json'), 'utf8')
    );

    // Check for install scripts (common attack vector)
    const dangerousScripts = ['preinstall', 'postinstall', 'install'];
    for (const script of dangerousScripts) {
      if (pkgJson.scripts?.[script]) {
        findings.push({
          type: 'script',
          severity: 'high',
          message: `Package has ${script} script: ${pkgJson.scripts[script]}`
        });
      }
    }

    // Scan source files
    await this.scanDirectory(packagePath, findings);

    const report = {
      package: packageName,
      version: pkgJson.version,
      license: pkgJson.license,
      findings,
      riskLevel: this.calculateRiskLevel(findings)
    };

    return report;
  }

  static async reviewAllDependencies() {
    const pkgJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const dependencies = {
      ...pkgJson.dependencies,
      ...pkgJson.devDependencies
    };

    const reports = [];
    for (const packageName of Object.keys(dependencies)) {
      const report = await this.reviewPackage(packageName);
      if (report) {
        reports.push(report);
      }
    }

    // Summary
    const highRisk = reports.filter(r => r.riskLevel === 'high' || r.riskLevel === 'critical');
    if (highRisk.length > 0) {
      console.error(`\n[WARN] ${highRisk.length} high-risk packages found:`);
      highRisk.forEach(r => {
        console.error(`  - ${r.package}@${r.version}: ${r.riskLevel} (${r.findings.length} findings)`);
      });
    }

    return reports;
  }

  static async scanDirectory(dir, findings) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await this.scanDirectory(fullPath, findings);
        }
      } else if (entry.isFile() && this.isCodeFile(entry.name)) {
        this.scanFile(fullPath, findings);
      }
    }
  }

  static isCodeFile(filename) {
    const codeExtensions = ['.js', '.mjs', '.cjs', '.ts', '.jsx', '.tsx'];
    return codeExtensions.some(ext => filename.endsWith(ext));
  }

  static scanFile(filePath, findings) {
    const content = fs.readFileSync(filePath, 'utf8');

    for (const { pattern, name, severity } of this.SUSPICIOUS_PATTERNS) {
      if (pattern.test(content)) {
        findings.push({
          type: 'code',
          severity,
          file: filePath,
          rule: name,
          message: `Suspicious pattern: ${name}`
        });
      }
    }
  }

  static calculateRiskLevel(findings) {
    if (findings.some(f => f.severity === 'critical')) return 'critical';
    if (findings.some(f => f.severity === 'high')) return 'high';
    if (findings.some(f => f.severity === 'medium')) return 'medium';
    if (findings.length > 0) return 'low';
    return 'clean';
  }
}

// CLI usage: node scripts/vendor-review.js [packageName]
const packageName = process.argv[2];
if (packageName) {
  FocusVendorReviewer.reviewPackage(packageName).then(report => {
    console.log(JSON.stringify(report, null, 2));
  });
} else {
  FocusVendorReviewer.reviewAllDependencies().then(reports => {
    fs.writeFileSync('vendor-review-report.json', JSON.stringify(reports, null, 2));
    console.log(`\nReviewed ${reports.length} packages. Report saved to vendor-review-report.json`);
  });
}
```

### 2.4 Build Reproducibility

```javascript
// webpack.config.js - Reproducible build configuration for Focus Mode - Blocker
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',

  output: {
    filename: '[name].js',  // No content hash for extension (manifest references fixed names)
    chunkFilename: '[name].chunk.js'
  },

  optimization: {
    // Deterministic module IDs for reproducible builds
    moduleIds: 'deterministic',
    chunkIds: 'deterministic',

    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          output: {
            comments: false  // Remove comments for reproducibility
          }
        },
        extractComments: false
      })
    ]
  },

  plugins: [
    // Remove timestamps and build-specific info
    new webpack.BannerPlugin({
      banner: `Focus Mode - Blocker | Build: ${process.env.BUILD_HASH || 'dev'}`,
      raw: false
    }),

    // Environment normalization — no dynamic values
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'production',
      BUILD_DATE: ''  // Explicitly empty to avoid non-deterministic dates
    })
  ],

  resolve: {
    symlinks: false  // Consistent resolution
  }
};
```

**GitHub Actions Reproducible Build Verification:**

```yaml
# .github/workflows/reproducible-build.yml
name: Reproducible Build

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build-and-verify:
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

      - name: Security audit
        run: npm audit --audit-level=high

      - name: First build
        run: npm run build

      - name: Calculate hash
        run: |
          find dist -type f -exec sha256sum {} \; | sort > build1.hash

      - name: Clean
        run: rm -rf dist

      - name: Second build
        run: npm run build

      - name: Verify reproducibility
        run: |
          find dist -type f -exec sha256sum {} \; | sort > build2.hash
          diff build1.hash build2.hash || (echo "Build is not reproducible!" && exit 1)
          echo "Build is reproducible!"
```

---

## 3. Implementation Priority

| Priority | Component | Complexity |
|----------|-----------|------------|
| P0 | FocusSecureStorage (encrypted storage) | Medium |
| P0 | FocusCredentialManager (token handling) | Medium |
| P0 | FocusDependencyAuditor (npm audit) | Low |
| P1 | FocusDataEncryption (password-derived) | Medium |
| P1 | FocusLockfileVerifier | Low |
| P1 | FocusPIIHandler (redaction) | Medium |
| P2 | FocusVendorReviewer | Medium |
| P2 | Reproducible build config | Low |
| P2 | Telemetry data sanitization | Low |

---

## 4. Key Design Decisions

### Encryption Key Lifecycle
- Encryption key is generated per browser session and stored in `chrome.storage.session`
- When the browser closes, the key is lost — encrypted data becomes inaccessible until a new key is generated
- For Pro license tokens, this means a brief re-validation on browser restart (cached license response covers offline periods)
- This design ensures that if the extension's storage is extracted (e.g., disk image), encrypted data remains protected

### Minimal Dependencies
- Only 2 production dependencies (DOMPurify, Stripe.js)
- All security utilities use browser-native Web Crypto API
- No server-side frameworks bundled in the extension
- Every dependency must pass the vendor review checklist before addition

### PII in Telemetry
- Blocklist domains are categorized, not sent raw (social/video/news/shopping/gaming/messaging/other)
- All telemetry IDs are SHA-256 hashed
- No browsing history, no page content, no personal data in any telemetry
- Users must opt-in to anonymous telemetry

---

*Agent 3 — Data Protection & Supply Chain Security — Complete*
