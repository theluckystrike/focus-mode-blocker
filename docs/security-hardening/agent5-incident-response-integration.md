# Agent 5 — Incident Response & Integration Architecture
## Focus Mode - Blocker: Security Hardening

> **Date:** February 11, 2026 | **Phase:** 18 — Security Hardening Audit
> **Scope:** Security breach playbook, user notification templates, patch deployment strategy, post-mortem process, security controls matrix, system integration architecture

---

## 1. Incident Response

### 1.1 Security Breach Playbook

```markdown
## Focus Mode - Blocker Security Incident Response Playbook

### Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| P1 — Critical | Active exploitation, data breach, Pro bypass at scale | Immediate | License system compromised, user tokens exposed, malicious code in published extension |
| P2 — High | Vulnerability with imminent risk | 4 hours | XSS in block page, storage injection allowing Pro bypass, API key exposure |
| P3 — Medium | Significant vulnerability, not actively exploited | 24 hours | CSP misconfiguration, weak input validation, unused permission |
| P4 — Low | Minor issue, no immediate risk | 1 week | Information disclosure in error messages, missing security headers |

### Phase 1: Detection & Initial Response (0-1 hour)

#### 1. Confirm the Incident
- Verify the report/alert is legitimate (not a false positive)
- Check CWS developer dashboard for anomalies
- Review Zovo API logs for unusual patterns
- Check Stripe dashboard for unauthorized transactions
- Document initial findings with timestamps

#### 2. Activate Response Team
- **Security Lead**: Coordinate response, make containment decisions
- **Extension Lead**: Diagnose extension-side issues, prepare patches
- **Backend Lead**: Diagnose server-side issues, check API/database
- **Communications Lead**: Draft user notifications, CWS listing updates
- **Legal (if needed)**: Data breach notification requirements

#### 3. Initial Containment
Based on severity and type:

| Scenario | Containment Action |
|----------|-------------------|
| Compromised extension version on CWS | Request emergency unpublish via CWS support |
| Pro license system bypassed | Disable license validation endpoint, switch to offline-only validation |
| API key/token exposed | Rotate all API keys immediately, invalidate all user tokens |
| XSS vulnerability in block page | Push CSP-only update (no code change needed), prepare full fix |
| Malicious dependency | Lock npm registry access, audit all build artifacts |
| User data exposed | Disable affected API endpoints, begin data impact assessment |

### Phase 2: Analysis & Containment (1-24 hours)

#### 1. Impact Assessment
- **Users affected**: Check CWS install count + active user telemetry
- **Data exposed**: Map what data the vulnerability provides access to
- **Attack vector**: Document exactly how the vulnerability is exploited
- **Timeline**: When was vulnerability introduced? When was it first exploited?
- **Scope**: Is the exploit automated or targeted?

#### 2. Containment Actions
```javascript
// Emergency containment: Force all Pro users to re-authenticate
async function emergencyTokenRevocation() {
  // Server-side: invalidate all refresh tokens
  await ZovoAPI.post('/admin/security/revoke-all-tokens');

  // Extension-side: clear cached credentials
  await FocusSecureStorage.removeSecure('pro_auth_token');
  await FocusSecureStorage.removeSecure('pro_refresh_token');
  await FocusSecureStorage.removeSecure('license_cache');

  // Force re-authentication on next Pro feature use
  await chrome.storage.local.set({ force_reauth: true });
}

// Emergency containment: Disable vulnerable feature
async function emergencyFeatureDisable(featureName) {
  const disabledFeatures = await chrome.storage.local.get('disabled_features');
  const features = disabledFeatures.disabled_features || [];
  features.push(featureName);
  await chrome.storage.local.set({ disabled_features: features });

  // Notify user
  chrome.notifications.create('feature-disabled', {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('images/security-icon.png'),
    title: 'Focus Mode - Security Update',
    message: `${featureName} has been temporarily disabled for security. An update is on the way.`,
    priority: 2
  });
}
```

#### 3. Evidence Collection
- Server access logs (Zovo API, Stripe webhooks)
- Chrome Web Store developer console activity
- GitHub commit and deployment history
- npm publish history
- User reports and support tickets
- Extension telemetry data (if opt-in enabled)

### Phase 3: Eradication & Recovery (24-72 hours)

#### 1. Remove the Threat
- Deploy security patch to CWS (see Patch Deployment Strategy)
- Remove malicious code / fix vulnerability
- Update security controls (CSP, input validation, etc.)
- Rotate all credentials that may have been exposed

#### 2. Recovery
- Restore from known-good build artifacts (if needed)
- Verify extension integrity via reproducible build
- Re-enable disabled features after patch deployment
- Monitor for re-exploitation attempts

#### 3. Testing
- Run full security scan (`npm run security:full`)
- Run automated test suite
- Manual penetration testing of the fixed area
- Verify CSP compliance
- Test on all supported browsers (Chrome, Firefox, Edge)

### Phase 4: Communication & Notification

#### 1. Internal Communication
- All-hands briefing with timeline and impact
- Status updates to stakeholders every 4 hours during P1/P2

#### 2. External Communication (see User Notification Templates)
- User notification via extension update notes
- Email notification to opt-in users (if data breach)
- CWS listing update with security advisory
- Blog post at zovo.one/blog (for significant incidents)
- Regulatory notification (GDPR/CCPA if applicable)

### Phase 5: Post-Incident (1-2 weeks)

#### 1. Post-Mortem (see Post-Mortem Template)
- Timeline of events
- Root cause analysis
- What worked / what didn't
- Action items with owners and deadlines

#### 2. Improvements
- Update this playbook based on lessons learned
- Improve monitoring/alerting
- Add new security scanner rules
- Update security audit checklist
- Team security training
```

### 1.2 User Notification Templates

```javascript
// src/security/notification-templates.js
// Templates for security-related user communications

const FocusSecurityNotifications = {
  /**
   * Data breach notification
   * Trigger: User data may have been exposed
   */
  dataBreach: {
    subject: 'Important Security Notice - Focus Mode - Blocker',
    body: `
Dear Focus Mode user,

We are writing to inform you of a security incident that may have affected your account.

**What Happened**
On [DATE], we discovered that [BRIEF DESCRIPTION]. We immediately took action to secure our systems and began an investigation.

**What Information Was Involved**
The following types of information may have been accessed:
[LIST OF DATA TYPES — e.g., "email address associated with your Pro subscription", "Focus session statistics"]

**What We Are Doing**
- We have fixed the vulnerability that allowed this incident
- We have rotated all security credentials
- We have engaged third-party security experts to review our systems
- We have notified relevant authorities as required

**What You Can Do**
1. Update Focus Mode - Blocker to the latest version
2. If you use Pro, your subscription has been re-secured (no action needed)
3. Be cautious of phishing emails claiming to be from Zovo
4. [Additional user-specific actions if needed]

**For More Information**
Visit: zovo.one/security
Email: security@zovo.one

We sincerely apologize for any concern this may cause.

— Zovo Security Team
    `
  },

  /**
   * Pro credential reset notification
   * Trigger: Pro license tokens were potentially compromised
   */
  credentialReset: {
    subject: 'Your Focus Mode Pro session has been reset',
    body: `
Dear Focus Mode Pro user,

As a precautionary security measure, we have reset your Pro authentication session.

**What You Need To Do**
1. Open Focus Mode - Blocker
2. Go to Settings > Pro
3. Click "Reactivate Pro" — your subscription is still active
4. Your Focus Score, streak, and all data are preserved

**Why This Happened**
We performed a routine security rotation of authentication tokens. This is a preventive measure, not a response to any known compromise of your account.

If you have concerns, contact us at support@zovo.one.

— Zovo Team
    `
  },

  /**
   * Security update notification
   * Trigger: Critical security patch released
   */
  securityUpdate: {
    subject: 'Security Update for Focus Mode - Blocker',
    body: `
Dear Focus Mode user,

We have released an important security update for Focus Mode - Blocker.

**What Happened**
A security vulnerability was discovered that could [IMPACT DESCRIPTION]. This issue has been fixed in version [VERSION].

**What You Need To Do**
Your extension should update automatically. To verify:
1. Open chrome://extensions
2. Find "Focus Mode - Blocker"
3. Check that the version is [VERSION] or higher
4. If not updated, click "Update" or enable auto-updates

**Your Data Is Safe**
[CONFIRMATION that user data was not accessed, if applicable]

Thank you for using Focus Mode.

— Zovo Security Team
    `
  },

  /**
   * In-extension security notification
   * Shown via chrome.notifications API
   */
  inExtensionSecurityAlert: {
    critical: {
      title: 'Focus Mode - Critical Security Update',
      message: 'A critical security update has been applied. Please restart your browser to complete the update.',
      iconUrl: 'images/security-critical.png'
    },
    warning: {
      title: 'Focus Mode - Security Notice',
      message: 'A security update is available. Focus Mode will update automatically.',
      iconUrl: 'images/security-warning.png'
    },
    info: {
      title: 'Focus Mode - Security Update Applied',
      message: 'Your extension has been updated with the latest security improvements.',
      iconUrl: 'images/security-info.png'
    }
  }
};

export { FocusSecurityNotifications };
```

### 1.3 Patch Deployment Strategy

```javascript
// src/security/patch-deployment.js
// Staged deployment strategy for Focus Mode - Blocker security patches

class FocusPatchDeployment {
  static DEPLOYMENT_STAGES = ['canary', 'beta', 'stable'];

  /**
   * Deploy security patch with appropriate urgency
   */
  static async deploySecurityPatch(version, severity) {
    const deploymentPlan = {
      version,
      severity,
      timestamp: new Date().toISOString(),
      extension: 'Focus Mode - Blocker',
      stages: []
    };

    switch (severity) {
      case 'critical':
        // Direct to 100% immediately
        deploymentPlan.stages = [
          { stage: 'all', percentage: 100, delay: 0, monitoring: '1h' }
        ];
        break;

      case 'high':
        // Fast staged rollout
        deploymentPlan.stages = [
          { stage: 'canary', percentage: 5, delay: 0, monitoring: '2h' },
          { stage: 'beta', percentage: 25, delay: 7200000, monitoring: '4h' },    // 2 hours
          { stage: 'stable', percentage: 100, delay: 21600000, monitoring: '24h' } // 6 hours
        ];
        break;

      case 'medium':
      case 'low':
        // Standard staged rollout
        deploymentPlan.stages = [
          { stage: 'canary', percentage: 1, delay: 0, monitoring: '6h' },
          { stage: 'beta', percentage: 10, delay: 21600000, monitoring: '12h' },    // 6 hours
          { stage: 'stable', percentage: 50, delay: 86400000, monitoring: '24h' },  // 24 hours
          { stage: 'full', percentage: 100, delay: 172800000, monitoring: '48h' }   // 48 hours
        ];
        break;
    }

    console.log('[Focus Mode] Security patch deployment plan:', deploymentPlan);
    return deploymentPlan;
  }

  /**
   * Execute deployment stage
   * Uses Chrome Web Store API for staged rollout
   */
  static async deployToStage(version, stage) {
    console.log(`[Focus Mode] Deploying v${version} to ${stage.stage} (${stage.percentage}%)`);

    // Chrome Web Store API deployment
    // Implementation requires CWS API credentials (WEBSTORE_CLIENT_ID, etc.)
    /*
    const webstoreAPI = new ChromeWebstoreAPI({
      clientId: process.env.WEBSTORE_CLIENT_ID,
      clientSecret: process.env.WEBSTORE_CLIENT_SECRET,
      refreshToken: process.env.WEBSTORE_REFRESH_TOKEN
    });

    await webstoreAPI.uploadPackage('./dist/focus-mode-blocker.zip');
    await webstoreAPI.publish({
      deployPercentage: stage.percentage,
      target: stage.stage === 'all' ? 'default' : stage.stage
    });
    */
  }

  /**
   * Monitor deployment health after each stage
   */
  static async monitorDeployment(version, duration) {
    const startTime = Date.now();
    const checkInterval = 60000; // Check every minute

    while (Date.now() - startTime < duration) {
      const health = await this.checkDeploymentHealth(version);

      // Auto-rollback thresholds
      if (health.errorRate > 0.01) {  // >1% error rate
        console.error('[Focus Mode] Error rate exceeded threshold — rolling back');
        await this.rollback(version);
        throw new Error('Deployment rolled back due to error rate');
      }

      if (health.uninstallRate > 0.005) {  // >0.5% uninstall spike
        console.error('[Focus Mode] Uninstall rate spike — pausing rollout');
        await this.pauseRollout(version);
        throw new Error('Deployment paused due to uninstall spike');
      }

      await new Promise(r => setTimeout(r, checkInterval));
    }
  }

  /**
   * Check deployment health metrics
   */
  static async checkDeploymentHealth(version) {
    // Fetch from Zovo telemetry service
    try {
      const response = await FocusSecureNetwork.authenticatedGet('/admin/deployment-health', {
        version
      });
      return response;
    } catch {
      return {
        version,
        activeInstalls: 0,
        errorRate: 0,
        crashRate: 0,
        uninstallRate: 0
      };
    }
  }

  /**
   * Rollback: unpublish current version, revert to previous
   */
  static async rollback(version) {
    console.log(`[Focus Mode] Rolling back from v${version}`);

    // 1. Unpublish current version from CWS
    // 2. The previous version automatically becomes active
    // 3. Log rollback event

    await FocusSecureNetwork.authenticatedPost('/admin/deployment-rollback', {
      version,
      reason: 'automated-health-check-failure',
      timestamp: Date.now()
    });
  }

  /**
   * Pause rollout at current percentage
   */
  static async pauseRollout(version) {
    console.log(`[Focus Mode] Pausing rollout of v${version}`);

    await FocusSecureNetwork.authenticatedPost('/admin/deployment-pause', {
      version,
      timestamp: Date.now()
    });
  }
}

export { FocusPatchDeployment };
```

### 1.4 Post-Mortem Template

```markdown
## Focus Mode - Blocker Post-Mortem Template

### Incident Summary

**Incident ID:** FM-INC-YYYY-MM-###
**Date:** [DATE]
**Duration:** [START TIME] - [END TIME] ([TOTAL DURATION])
**Severity:** P1/P2/P3/P4
**Author:** [NAME]
**Reviewers:** [NAMES]

### Executive Summary
[2-3 sentence summary: what happened, who was affected, what was the impact]

### Timeline

| Time (UTC) | Event |
|------------|-------|
| HH:MM | First indication of incident (e.g., user report, monitoring alert) |
| HH:MM | Alert/report triaged and confirmed |
| HH:MM | Incident response team assembled |
| HH:MM | Root cause identified |
| HH:MM | Containment action taken |
| HH:MM | Fix developed and tested |
| HH:MM | Patch deployed to CWS |
| HH:MM | Rollout to 100% complete |
| HH:MM | Incident declared resolved |

### Impact

**Users Affected:** [NUMBER / PERCENTAGE of active users]
**Data Exposed:** [YES/NO — if yes, what types of data]
**Pro Subscriptions Affected:** [NUMBER]
**Financial Impact:** [Revenue loss, bounty paid, etc.]
**Reputation Impact:** [CWS rating change, social media, press coverage]

### Root Cause

[Detailed technical explanation]

Example: "A missing input validation check in the blocklist import function allowed a crafted JSON file to inject HTML into the block page custom message field. When the block page was displayed, the injected HTML was rendered via innerHTML instead of textContent, creating an XSS vulnerability."

### Contributing Factors

1. [Factor 1 — e.g., "Block page renderer used innerHTML for custom messages"]
2. [Factor 2 — e.g., "Import function did not validate field types"]
3. [Factor 3 — e.g., "Security scanner did not check JSON import paths"]

### Resolution

[What was done to fix the immediate issue]

Example: "Replaced innerHTML with textContent for all user-provided content in block page. Added DOMPurify sanitization as defense-in-depth. Updated FocusInputValidator to validate imported JSON schema."

### What Went Well

1. [e.g., "Shadow DOM isolation prevented XSS from accessing extension context"]
2. [e.g., "Incident was reported within 2 hours via responsible disclosure"]
3. [e.g., "Patch was deployed within 6 hours of confirmation"]

### What Went Poorly

1. [e.g., "Security scanner did not have a rule for innerHTML in content scripts"]
2. [e.g., "Import function was not included in the penetration testing scope"]

### Action Items

| # | Action | Owner | Priority | Due Date | Status |
|---|--------|-------|----------|----------|--------|
| 1 | Add security scanner rule for content script innerHTML | [Name] | P1 | [Date] | [ ] |
| 2 | Add import/export to penetration testing scope | [Name] | P2 | [Date] | [ ] |
| 3 | Add JSON schema validation for all import functions | [Name] | P1 | [Date] | [ ] |
| 4 | Update security audit checklist | [Name] | P2 | [Date] | [ ] |

### Lessons Learned

1. [e.g., "Every code path that renders user-provided data must be reviewed for XSS"]
2. [e.g., "Import/export functions are high-risk attack vectors that need dedicated testing"]
```

---

## 2. Security Controls Matrix

Complete security controls reference for Focus Mode - Blocker:

| Control Category | Control | Implementation | Module | Priority |
|-----------------|---------|----------------|--------|----------|
| **CSP** | Strict extension pages policy | manifest.json | Config | Critical |
| **CSP** | Block page Shadow DOM isolation | SecureBlockPage | Agent 1 | Critical |
| **XSS** | Input sanitization | FocusInputValidator | Agent 1 | Critical |
| **XSS** | Safe DOM APIs | SafeDOM, FocusSafeRenderer | Agent 1 | Critical |
| **XSS** | HTML sanitization | FocusHTMLSanitizer (DOMPurify) | Agent 1 | Critical |
| **XSS** | Template escaping | SafeTemplate | Agent 1 | High |
| **Permissions** | Minimum required set | manifest.json | Agent 2 | Critical |
| **Permissions** | Optional permissions | FocusPermissionManager | Agent 2 | High |
| **Permissions** | Permission auditing | FocusPermissionAuditor | Agent 2 | Medium |
| **Network** | HTTPS enforcement | FocusSecureNetwork | Agent 2 | Critical |
| **Network** | Domain allowlist | FocusSecureNetwork.validateDomain | Agent 2 | Critical |
| **Network** | Response validation | FocusResponseValidator | Agent 2 | High |
| **Network** | Transit encryption | FocusTransitEncryption | Agent 2 | Medium |
| **Messages** | Type allowlisting | FocusSecureMessaging | Agent 2 | Critical |
| **Messages** | Origin validation | FocusSecureMessaging | Agent 2 | Critical |
| **Messages** | Size limits | FocusSecureMessaging | Agent 2 | High |
| **Storage** | Encryption at rest | FocusSecureStorage | Agent 3 | High |
| **Storage** | Session-scoped keys | FocusSecureStorage | Agent 3 | High |
| **Storage** | Password-derived encryption | FocusDataEncryption | Agent 3 | Medium |
| **Auth** | Token security | FocusCredentialManager | Agent 3 | Critical |
| **Auth** | Token expiration + refresh | FocusCredentialManager | Agent 3 | High |
| **Auth** | License validation | FocusLicenseManager | Agent 4 | High |
| **Privacy** | PII detection + redaction | FocusPIIHandler | Agent 3 | High |
| **Privacy** | Blocklist anonymization | FocusPIIHandler | Agent 3 | High |
| **Privacy** | Data minimization | FocusPIIHandler | Agent 3 | Medium |
| **Supply Chain** | npm audit | FocusDependencyAuditor | Agent 3 | High |
| **Supply Chain** | Lock file integrity | FocusLockfileVerifier | Agent 3 | Medium |
| **Supply Chain** | Vendor review | FocusVendorReviewer | Agent 3 | Medium |
| **Supply Chain** | Reproducible builds | webpack config | Agent 3 | Medium |
| **Code** | Obfuscation | webpack-obfuscator | Agent 4 | Low |
| **Code** | Anti-tampering | FocusIntegrityChecker | Agent 4 | Medium |
| **Code** | Environment checks | FocusEnvironmentChecker | Agent 4 | Low |
| **Scanning** | Static analysis | FocusSecurityScanner | Agent 4 | High |
| **Scanning** | CI/CD integration | GitHub Actions | Agent 4 | High |
| **Response** | Incident playbook | Documented | Agent 5 | High |
| **Response** | Patch deployment | FocusPatchDeployment | Agent 5 | High |
| **Response** | User notifications | FocusSecurityNotifications | Agent 5 | Medium |
| **Response** | Post-mortem process | Template | Agent 5 | Medium |
| **Response** | Vulnerability disclosure | Policy | Agent 4 | Medium |

---

## 3. System Integration Architecture

### 3.1 Security Module Map

```
Focus Mode - Blocker Security Architecture
============================================

Extension (Client-Side)
├── src/security/
│   ├── csp-config.js                    [CSP directive configuration]
│   ├── safe-dom.js                      [XSS-safe DOM manipulation]
│   ├── html-sanitizer.js                [DOMPurify wrapper]
│   ├── safe-template.js                 [Tagged template literals]
│   ├── input-validator.js               [User input validation]
│   ├── safe-renderer.js                 [Safe UI rendering]
│   ├── secure-block-page.js             [Shadow DOM block page]
│   ├── secure-module-loader.js          [CSP-compliant module loading]
│   ├── nonce-manager.js                 [Sandbox page nonces]
│   ├── security-logger.js               [Security event logging]
│   ├── permission-manager.js            [Optional permission handling]
│   ├── permission-auditor.js            [Permission audit reports]
│   ├── secure-network.js                [HTTPS enforcement + domain validation]
│   ├── response-validator.js            [API response signature checking]
│   ├── secure-messaging.js              [Message type validation]
│   ├── transit-encryption.js            [Hybrid RSA+AES for API calls]
│   ├── secure-storage.js                [AES-256-GCM encrypted storage]
│   ├── data-encryption.js               [PBKDF2 password-derived encryption]
│   ├── credential-manager.js            [Pro token lifecycle]
│   ├── pii-handler.js                   [PII detection + redaction]
│   ├── integrity-checker.js             [Runtime anti-tampering]
│   ├── environment-checker.js           [DevTools + context detection]
│   ├── license-manager.js               [Pro license validation]
│   ├── anti-debug.js                    [Reverse engineering deterrents]
│   ├── notification-templates.js        [Security communication templates]
│   └── patch-deployment.js              [Staged deployment strategy]
│
├── scripts/ (Build-Time)
│   ├── security-scan.js                 [Static analysis scanner]
│   ├── security-audit.js                [npm audit wrapper]
│   ├── verify-lockfile.js               [Lock file integrity]
│   └── vendor-review.js                 [Dependency code review]
│
└── .github/workflows/
    └── security.yml                     [CI/CD security pipeline]

Server-Side (Zovo API)
├── /api/license/validate                [License validation endpoint]
├── /auth/refresh                        [Token refresh endpoint]
├── /admin/security/revoke-all-tokens    [Emergency token revocation]
├── /admin/deployment-health             [Deployment health metrics]
├── /admin/deployment-rollback           [Automated rollback trigger]
└── /admin/deployment-pause              [Pause staged rollout]
```

### 3.2 Security Event Flow

**Normal Operation:**
```
User action → FocusInputValidator → SafeDOM/SafeRenderer → UI
                                 ↓
                        FocusSecureMessaging (validated)
                                 ↓
                         Service Worker handler
                                 ↓
                    FocusSecureNetwork (HTTPS only)
                                 ↓
                    FocusResponseValidator (signature check)
                                 ↓
                    FocusSecureStorage (encrypted at rest)
```

**Pro License Validation:**
```
User clicks "Activate Pro" → FocusInputValidator (license format)
                                        ↓
                              FocusLicenseManager.validateOnline()
                                        ↓
                              FocusSecureNetwork.post('/api/license/validate')
                                        ↓ (HTTPS + domain validation)
                              FocusResponseValidator (signature check)
                                        ↓
                              FocusSecureStorage.setSecure('license_cache')
                                        ↓
                              FocusCredentialManager.storeTokens()
```

**Security Incident Detection:**
```
Anomaly detected (tampering, invalid signature, etc.)
                    ↓
          FocusSecurityLogger.log()
                    ↓
          FocusIntegrityChecker.handleTampering()
                    ↓
    ┌───────────────┼───────────────┐
    ↓               ↓               ↓
Disable Pro    Show Warning    Log Event
features       notification    for audit
```

**Patch Deployment:**
```
Security vulnerability reported
            ↓
    Incident Response Playbook activated
            ↓
    Fix developed + FocusSecurityScanner passes
            ↓
    FocusPatchDeployment.deploySecurityPatch()
            ↓
    Staged rollout: canary → beta → stable
            ↓ (monitoring at each stage)
    monitorDeployment() — error rate, uninstall rate
            ↓ (if thresholds exceeded)
    Auto-rollback or pause
```

### 3.3 New Security Modules Summary

| Module | Location | Size Estimate | Dependencies |
|--------|----------|---------------|--------------|
| csp-config.js | src/security/ | ~1KB | None |
| safe-dom.js | src/security/ | ~4KB | None |
| html-sanitizer.js | src/security/ | ~2KB | DOMPurify |
| safe-template.js | src/security/ | ~2KB | None |
| input-validator.js | src/security/ | ~4KB | None |
| safe-renderer.js | src/security/ | ~5KB | None |
| secure-block-page.js | src/security/ | ~3KB | None |
| secure-module-loader.js | src/security/ | ~1KB | None |
| nonce-manager.js | src/security/ | ~1KB | None |
| security-logger.js | src/security/ | ~2KB | None |
| permission-manager.js | src/security/ | ~4KB | None |
| permission-auditor.js | src/security/ | ~3KB | None |
| secure-network.js | src/security/ | ~4KB | None |
| response-validator.js | src/security/ | ~3KB | None |
| secure-messaging.js | src/security/ | ~6KB | None |
| transit-encryption.js | src/security/ | ~3KB | None |
| secure-storage.js | src/security/ | ~4KB | None |
| data-encryption.js | src/security/ | ~3KB | None |
| credential-manager.js | src/security/ | ~3KB | None |
| pii-handler.js | src/security/ | ~4KB | None |
| integrity-checker.js | src/security/ | ~3KB | None |
| environment-checker.js | src/security/ | ~1KB | None |
| license-manager.js | src/security/ | ~5KB | None |
| anti-debug.js | src/security/ | ~2KB | None |
| notification-templates.js | src/security/ | ~3KB | None |
| patch-deployment.js | src/security/ | ~4KB | None |
| **Total** | | **~79KB** | **DOMPurify only** |

Build-time scripts:

| Script | Location | Purpose |
|--------|----------|---------|
| security-scan.js | scripts/ | Static analysis of source code |
| security-audit.js | scripts/ | npm audit wrapper with CI/CD integration |
| verify-lockfile.js | scripts/ | Lock file tamper detection |
| vendor-review.js | scripts/ | Dependency code scanning |

---

## 4. Implementation Roadmap

### Phase A — Foundation (Week 1-2)
- CSP configuration in manifest.json
- SafeDOM, SafeTemplate, FocusInputValidator
- FocusSecureNetwork (HTTPS + domain validation)
- FocusSecureMessaging (message type validation)
- FocusSecureStorage (encrypted storage)
- FocusSecurityScanner + CI/CD integration

### Phase B — Authentication Security (Week 2-3)
- FocusCredentialManager (token lifecycle)
- FocusLicenseManager (Pro license protection)
- FocusResponseValidator (API signature checking)
- SecureBlockPage (Shadow DOM isolation)

### Phase C — Defense in Depth (Week 3-4)
- FocusHTMLSanitizer (DOMPurify integration)
- FocusPIIHandler (PII detection + redaction)
- FocusPermissionManager (optional permissions)
- FocusPermissionAuditor
- FocusSafeRenderer (all UI components)

### Phase D — Code Protection (Week 4-5)
- Obfuscation configuration (webpack-obfuscator)
- FocusIntegrityChecker (anti-tampering)
- FocusTransitEncryption
- FocusDataEncryption (password-derived)
- Reproducible build verification

### Phase E — Operational Security (Week 5-6)
- Incident response playbook finalized
- FocusPatchDeployment (staged rollout)
- Vulnerability disclosure program published
- Security audit checklist completed
- Post-mortem template and process documented
- Full penetration test executed

---

## 5. Key Design Decisions

### Defense in Depth
- No single security control is relied upon alone
- CSP prevents code injection, but SafeDOM prevents XSS even if CSP is misconfigured
- Encrypted storage protects data, but PII handler prevents sensitive data from being stored unnecessarily
- License validation runs online + offline with different trust levels

### Security vs. User Experience
- Anti-debug measures are soft (logging, not blocking) — legitimate users shouldn't be punished
- Permission requests include clear explanations — users understand what they're granting
- Integrity check failures disable Pro features (paid) but never disable Free features
- Patch deployment includes auto-rollback — a bad security patch shouldn't brick the extension

### Zero-Trust Internal Messaging
- Even internal messages (popup → service worker) are validated against an allowlist
- Message handlers never trust payload types — they validate before processing
- This prevents compromised content scripts from sending arbitrary commands to the service worker

---

*Agent 5 — Incident Response & Integration Architecture — Complete*
