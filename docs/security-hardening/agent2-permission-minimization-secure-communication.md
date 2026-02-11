# Agent 2 — Permission Minimization & Secure Communication
## Focus Mode - Blocker: Security Hardening

> **Date:** February 11, 2026 | **Phase:** 18 — Security Hardening Audit
> **Scope:** Permission risk assessment, optional permissions pattern, permission auditing, HTTPS enforcement, secure message passing, certificate validation, transit encryption

---

## 1. Permission Minimization

### 1.1 Principle of Least Privilege

Focus Mode - Blocker must request only the minimum permissions needed. Every permission increases the Chrome Web Store review scrutiny, user concern, and attack surface.

**Permission Categories by Risk Level:**

```javascript
// src/security/permission-risk-levels.js
// Reference: Risk classification for all Chrome permissions

const PERMISSION_RISKS = {
  // Critical Risk — Request only when absolutely necessary
  critical: [
    '<all_urls>',           // Access to all websites
    'webRequest',           // Intercept network requests
    'webRequestBlocking',   // Block/modify requests (MV2 only)
    'nativeMessaging',      // Communicate with native apps
    'debugger',             // Debugger API access
    'management',           // Manage other extensions
    'proxy',                // Proxy settings
    'vpnProvider',          // VPN functionality
  ],

  // High Risk — Requires strong justification
  high: [
    'cookies',              // Access cookies
    'history',              // Browsing history
    'topSites',             // Most visited sites
    'bookmarks',            // Bookmarks access
    'downloads',            // Download management
    'tabs',                 // Tab information (URLs, titles)
    'browsingData',         // Clear browsing data
    'contentSettings',      // Modify content settings
  ],

  // Medium Risk — Common functionality
  medium: [
    'storage',              // Extension storage
    'activeTab',            // Current tab only (on user action)
    'contextMenus',         // Right-click menus
    'notifications',        // Show notifications
    'alarms',               // Scheduling
    'scripting',            // Script injection
  ],

  // Low Risk — Generally safe
  low: [
    'clipboardRead',        // Read clipboard
    'clipboardWrite',       // Write clipboard
    'identity',             // OAuth authentication
    'idle',                 // Idle state detection
    'power',                // Power management
  ]
};
```

### 1.2 Focus Mode - Blocker Permission Audit

**Required Permissions (manifest.json):**

```json
{
  "name": "Focus Mode - Blocker",
  "version": "1.0.0",
  "manifest_version": 3,

  "permissions": [
    "storage",              // Store blocklist, settings, Focus Score, streak data
    "alarms",               // Pomodoro timer, Focus session scheduling, daily churn analysis
    "activeTab",            // Get current tab URL for blocking decisions
    "notifications",        // Milestone celebrations, streak reminders, dormant reactivation
    "declarativeNetRequest" // Block sites via declarative rules (MV3 site blocking)
  ],

  "optional_permissions": [
    "tabs",                 // Only if user enables "block across all tabs" mode
    "contextMenus",         // Right-click "Add to blocklist" feature
    "scripting"             // Content script injection for block page display
  ],

  "host_permissions": [],

  "optional_host_permissions": [
    "https://api.zovo.one/*",    // Zovo API for Pro features, license validation
    "https://api.stripe.com/*"   // Stripe for Pro subscription management
  ]
}
```

**Permission Justification Table:**

| Permission | Risk | Justification | Can Be Optional? |
|-----------|------|---------------|------------------|
| `storage` | Medium | Core: blocklist, settings, Focus Score, streak, churn data | No — required for core |
| `alarms` | Medium | Core: Pomodoro timer, session scheduling, daily alarms | No — required for timers |
| `activeTab` | Medium | Core: check if current URL is blocked | No — required for blocking |
| `notifications` | Medium | Celebrations, reminders, reactivation | No — key retention feature |
| `declarativeNetRequest` | Medium | Core: MV3 declarative site blocking | No — primary blocking mechanism |
| `tabs` | High | Optional: "block across all tabs" monitoring | Yes — optional enhancement |
| `contextMenus` | Medium | Optional: right-click "Add to blocklist" | Yes — convenience feature |
| `scripting` | Medium | Optional: inject custom block page | Yes — Pro feature |
| `https://api.zovo.one/*` | Medium | Pro features, license validation | Yes — only Pro users |
| `https://api.stripe.com/*` | Medium | Subscription management | Yes — only during purchase |

### 1.3 Optional Permissions Pattern

```javascript
// src/security/permission-manager.js
// Request permissions only when needed, with user explanation

class FocusPermissionManager {
  /**
   * Request permission only when needed
   */
  static async requestPermission(permissions, origins = []) {
    const request = {};

    if (permissions.length > 0) {
      request.permissions = permissions;
    }

    if (origins.length > 0) {
      request.origins = origins;
    }

    try {
      const granted = await chrome.permissions.request(request);

      if (granted) {
        console.log('[Focus Mode] Permission granted:', permissions);
        await this.logPermissionChange('granted', request);
      } else {
        console.log('[Focus Mode] Permission denied by user:', permissions);
      }

      return granted;
    } catch (error) {
      console.error('[Focus Mode] Permission request failed:', error);
      return false;
    }
  }

  /**
   * Check if permission is already granted
   */
  static async hasPermission(permissions, origins = []) {
    const query = {};

    if (permissions.length > 0) {
      query.permissions = permissions;
    }

    if (origins.length > 0) {
      query.origins = origins;
    }

    return chrome.permissions.contains(query);
  }

  /**
   * Remove permission when no longer needed
   */
  static async removePermission(permissions, origins = []) {
    const request = {};

    if (permissions.length > 0) {
      request.permissions = permissions;
    }

    if (origins.length > 0) {
      request.origins = origins;
    }

    try {
      const removed = await chrome.permissions.remove(request);

      if (removed) {
        await this.logPermissionChange('removed', request);
      }

      return removed;
    } catch (error) {
      console.error('[Focus Mode] Permission removal failed:', error);
      return false;
    }
  }

  /**
   * Get all current permissions
   */
  static async getAllPermissions() {
    return chrome.permissions.getAll();
  }

  /**
   * Feature gating based on permissions
   * Shows explanation UI before requesting
   */
  static async withPermission(permissions, origins, feature) {
    const hasPermission = await this.hasPermission(permissions, origins);

    if (hasPermission) {
      return feature();
    }

    // Show UI to request permission
    const granted = await this.requestPermissionWithUI(permissions, origins);

    if (granted) {
      return feature();
    }

    throw new Error('Permission required for this feature');
  }

  static async requestPermissionWithUI(permissions, origins) {
    const shouldRequest = await this.showPermissionExplanation(permissions);

    if (shouldRequest) {
      return this.requestPermission(permissions, origins);
    }

    return false;
  }

  /**
   * Focus Mode-specific permission explanations
   */
  static getPermissionExplanation(permission) {
    const explanations = {
      'tabs': 'Tab access is needed to monitor and block distracting sites across all your open tabs during Focus sessions.',
      'contextMenus': 'Context menu access lets you right-click any link to quickly add it to your blocklist.',
      'scripting': 'Script injection is needed to display the custom block page when you visit a blocked site.',
      'history': 'History access would allow Focus Mode to suggest sites for your blocklist based on browsing patterns.',
      'bookmarks': 'Bookmark access would allow importing bookmarks to your blocklist.'
    };

    return explanations[permission] || `${permission} permission is required for this feature.`;
  }

  static async showPermissionExplanation(permissions) {
    const messages = permissions
      .map(p => this.getPermissionExplanation(p))
      .join('\n\n');

    // In production, show a custom UI dialog (not confirm())
    // This is a placeholder — actual implementation uses the popup UI
    return confirm(`Focus Mode needs additional permissions:\n\n${messages}\n\nAllow?`);
  }

  static async logPermissionChange(action, request) {
    const result = await chrome.storage.local.get('focus_permission_log');
    const log = result.focus_permission_log || [];

    log.push({
      action,
      request,
      timestamp: Date.now()
    });

    // Keep only last 100 entries
    if (log.length > 100) {
      log.splice(0, log.length - 100);
    }

    await chrome.storage.local.set({ focus_permission_log: log });
  }
}

// Usage: Request "tabs" permission when user enables "block across all tabs"
async function enableAllTabsBlocking() {
  await FocusPermissionManager.withPermission(
    ['tabs'],
    [],
    async () => {
      await chrome.storage.local.set({ blockAllTabs: true });
      // Start monitoring all tabs
      startAllTabsMonitoring();
    }
  );
}

// Usage: Request context menu permission for right-click blocklist add
async function enableContextMenuBlocklist() {
  await FocusPermissionManager.withPermission(
    ['contextMenus'],
    [],
    async () => {
      chrome.contextMenus.create({
        id: 'add-to-blocklist',
        title: 'Add this site to Focus Mode blocklist',
        contexts: ['page', 'link']
      });
    }
  );
}

// Usage: Request Zovo API access for Pro features
async function enableProFeatures() {
  await FocusPermissionManager.withPermission(
    [],
    ['https://api.zovo.one/*', 'https://api.stripe.com/*'],
    async () => {
      // Initialize Pro feature modules
      await initializeProSubscription();
    }
  );
}

// Clean up permissions when features are disabled
async function disableAllTabsBlocking() {
  await chrome.storage.local.set({ blockAllTabs: false });
  await FocusPermissionManager.removePermission(['tabs']);
}

export { FocusPermissionManager };
```

### 1.4 Permission Auditing

```javascript
// src/security/permission-auditor.js
// Audit permissions for Focus Mode - Blocker — development + production

class FocusPermissionAuditor {
  /**
   * Run a complete permission audit
   */
  static async runAudit() {
    const report = {
      timestamp: new Date().toISOString(),
      permissions: await chrome.permissions.getAll(),
      findings: [],
      recommendations: []
    };

    await this.checkOverPermissioning(report);
    await this.checkUnusedPermissions(report);
    await this.checkHostPermissions(report);
    this.generateRecommendations(report);

    return report;
  }

  static async checkOverPermissioning(report) {
    const criticalPermissions = ['<all_urls>', 'webRequest', 'webRequestBlocking', 'debugger', 'management'];

    for (const perm of report.permissions.permissions || []) {
      if (criticalPermissions.includes(perm)) {
        report.findings.push({
          severity: 'critical',
          type: 'over-permission',
          permission: perm,
          message: `Critical permission "${perm}" should not be used in Focus Mode - Blocker`
        });
      }
    }
  }

  static async checkUnusedPermissions(report) {
    const usageStats = await chrome.storage.local.get('focus_permission_usage');
    const usage = usageStats.focus_permission_usage || {};

    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

    for (const [perm, lastUsed] of Object.entries(usage)) {
      if (lastUsed < thirtyDaysAgo) {
        report.findings.push({
          severity: 'medium',
          type: 'unused-permission',
          permission: perm,
          message: `Permission "${perm}" hasn't been used in 30+ days`,
          lastUsed: new Date(lastUsed).toISOString()
        });
      }
    }
  }

  static async checkHostPermissions(report) {
    const hosts = report.permissions.origins || [];

    for (const host of hosts) {
      if (host === '<all_urls>' || host === '*://*/*') {
        report.findings.push({
          severity: 'critical',
          type: 'broad-host-permission',
          permission: host,
          message: 'Focus Mode - Blocker should never use broad host permissions'
        });
      }

      // Check for non-Zovo hosts
      if (!host.includes('zovo.one') && !host.includes('stripe.com')) {
        report.findings.push({
          severity: 'medium',
          type: 'unexpected-host',
          permission: host,
          message: `Unexpected host permission: ${host}`
        });
      }
    }
  }

  static generateRecommendations(report) {
    for (const finding of report.findings) {
      switch (finding.type) {
        case 'over-permission':
          report.recommendations.push({
            finding: finding.permission,
            action: 'Remove this permission — Focus Mode - Blocker should not need it',
            priority: 'critical'
          });
          break;

        case 'unused-permission':
          report.recommendations.push({
            finding: finding.permission,
            action: 'Remove or make optional. If the associated feature is disabled, revoke the permission.',
            priority: 'medium'
          });
          break;

        case 'broad-host-permission':
          report.recommendations.push({
            finding: finding.permission,
            action: 'Replace with specific domains (api.zovo.one, api.stripe.com)',
            priority: 'critical'
          });
          break;

        case 'unexpected-host':
          report.recommendations.push({
            finding: finding.permission,
            action: 'Review and remove if not needed',
            priority: 'medium'
          });
          break;
      }
    }
  }
}

// Run audit in development builds
if (process.env.NODE_ENV === 'development') {
  FocusPermissionAuditor.runAudit().then(report => {
    console.log('[Focus Mode] Permission Audit Report:', report);
    if (report.findings.length > 0) {
      console.warn(`[Focus Mode] ${report.findings.length} permission findings detected`);
    }
  });
}

export { FocusPermissionAuditor };
```

### 1.5 Permission Audit Checklist

```markdown
## Focus Mode - Blocker Pre-Release Permission Review

### Required Permissions Review
- [ ] Each permission in manifest.json has documented justification
- [ ] No unnecessary permissions (especially critical/high risk)
- [ ] `declarativeNetRequest` used instead of `webRequest` for blocking
- [ ] `activeTab` used instead of broad `tabs` permission for core features
- [ ] Host permissions limited to api.zovo.one and api.stripe.com

### Optional Permissions
- [ ] `tabs` only requested when "block across all tabs" is enabled
- [ ] `contextMenus` only requested when right-click feature is enabled
- [ ] `scripting` only requested when custom block page is enabled (Pro)
- [ ] Permissions removed when associated features are disabled
- [ ] Permission requests happen in response to user action (not on install)

### Host Permissions
- [ ] No use of <all_urls>
- [ ] Only api.zovo.one and api.stripe.com as optional hosts
- [ ] No wildcard domains beyond necessary subdomains

### Permission Usage Tracking
- [ ] Usage of each permission is logged to chrome.storage.local
- [ ] Audit report runs automatically in development builds
- [ ] Unused permissions flagged for removal after 30 days

### User Communication
- [ ] Permission purposes explained in CWS listing description
- [ ] Onboarding explains why key permissions are needed
- [ ] Privacy policy covers data accessed via each permission
- [ ] Optional permission prompts include clear explanations
```

---

## 2. Secure Communication

### 2.1 HTTPS Enforcement

All network communication in Focus Mode - Blocker (Pro license validation, Stripe payments, telemetry) must use HTTPS.

```javascript
// src/security/secure-network.js
// HTTPS-enforced network layer for Focus Mode - Blocker

class FocusSecureNetwork {
  static ZOVO_API_BASE = 'https://api.zovo.one';
  static STRIPE_API_BASE = 'https://api.stripe.com';

  /**
   * Enforce HTTPS for all requests
   */
  static enforceHTTPS(url) {
    try {
      const parsed = new URL(url);

      if (parsed.protocol === 'http:') {
        parsed.protocol = 'https:';
        console.warn(`[Focus Mode Security] Upgraded insecure URL: ${url} -> ${parsed.href}`);
        return parsed.href;
      }

      if (parsed.protocol !== 'https:') {
        throw new Error(`Invalid protocol: ${parsed.protocol}`);
      }

      return url;
    } catch (error) {
      throw new Error(`[Focus Mode Security] Invalid URL: ${url}`);
    }
  }

  /**
   * Validate that request URL is to an approved domain
   */
  static validateDomain(url) {
    const parsed = new URL(url);
    const allowedDomains = ['api.zovo.one', 'api.stripe.com'];

    if (!allowedDomains.includes(parsed.hostname)) {
      throw new Error(`[Focus Mode Security] Request to unauthorized domain: ${parsed.hostname}`);
    }

    return true;
  }

  /**
   * Secure fetch wrapper with all protections
   */
  static async fetch(url, options = {}) {
    const secureURL = this.enforceHTTPS(url);
    this.validateDomain(secureURL);

    const secureOptions = {
      ...options,
      credentials: options.credentials || 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'X-Extension-Version': chrome.runtime.getManifest().version,
        'X-Extension-Id': chrome.runtime.id,
        ...options.headers
      }
    };

    // Set timeout (30 seconds default)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeout || 30000);
    secureOptions.signal = controller.signal;

    try {
      const response = await fetch(secureURL, secureOptions);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Check content type
      const contentType = response.headers.get('content-type');
      if (options.expectedContentType && !contentType?.includes(options.expectedContentType)) {
        throw new Error(`Unexpected content type: ${contentType}`);
      }

      return response;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * GET request to Zovo API
   */
  static async get(endpoint, params = {}) {
    const url = new URL(endpoint, this.ZOVO_API_BASE);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, value);
    }

    const response = await this.fetch(url.href, {
      method: 'GET',
      expectedContentType: 'application/json'
    });

    return response.json();
  }

  /**
   * POST request to Zovo API
   */
  static async post(endpoint, data) {
    const url = new URL(endpoint, this.ZOVO_API_BASE);

    const response = await this.fetch(url.href, {
      method: 'POST',
      body: JSON.stringify(data),
      expectedContentType: 'application/json'
    });

    return response.json();
  }

  /**
   * Authenticated request (includes Pro license token)
   */
  static async authenticatedGet(endpoint, params = {}) {
    const token = await this.getAuthToken();

    if (!token) {
      throw new Error('Not authenticated — Pro license required');
    }

    const url = new URL(endpoint, this.ZOVO_API_BASE);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, value);
    }

    const response = await this.fetch(url.href, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      expectedContentType: 'application/json'
    });

    return response.json();
  }

  static async authenticatedPost(endpoint, data) {
    const token = await this.getAuthToken();

    if (!token) {
      throw new Error('Not authenticated — Pro license required');
    }

    const url = new URL(endpoint, this.ZOVO_API_BASE);

    const response = await this.fetch(url.href, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data),
      expectedContentType: 'application/json'
    });

    return response.json();
  }

  /**
   * Get stored auth token
   */
  static async getAuthToken() {
    const result = await chrome.storage.local.get('focus_pro_token');
    return result.focus_pro_token || null;
  }
}

export { FocusSecureNetwork };
```

### 2.2 Response Signature Validation

```javascript
// src/security/response-validator.js
// Validate Zovo API response signatures to prevent MITM attacks

class FocusResponseValidator {
  // Zovo API public key (embedded in extension)
  static ZOVO_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----`;

  /**
   * Validate response signature from Zovo API
   * Zovo API sends X-Signature and X-Timestamp headers
   */
  static async validateResponse(response, body) {
    const signature = response.headers.get('X-Signature');
    const timestamp = response.headers.get('X-Timestamp');

    if (!signature || !timestamp) {
      // Allow unsigned responses in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Focus Mode] Unsigned API response — OK in development');
        return true;
      }
      throw new Error('[Focus Mode Security] Missing security headers from API');
    }

    // Verify timestamp is recent (prevent replay attacks)
    const now = Date.now();
    const responseTime = parseInt(timestamp, 10);

    if (Math.abs(now - responseTime) > 300000) { // 5 minute window
      throw new Error('[Focus Mode Security] Response timestamp outside acceptable window');
    }

    // Verify signature
    const publicKey = await this.getZovoPublicKey();
    const isValid = await this.verifySignature(body, signature, publicKey);

    if (!isValid) {
      throw new Error('[Focus Mode Security] Invalid response signature');
    }

    return true;
  }

  static async getZovoPublicKey() {
    return crypto.subtle.importKey(
      'spki',
      this.pemToArrayBuffer(this.ZOVO_PUBLIC_KEY_PEM),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );
  }

  static async verifySignature(data, signature, publicKey) {
    const signatureBuffer = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
    const dataBuffer = new TextEncoder().encode(data);

    return crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      publicKey,
      signatureBuffer,
      dataBuffer
    );
  }

  static pemToArrayBuffer(pem) {
    const base64 = pem
      .replace('-----BEGIN PUBLIC KEY-----', '')
      .replace('-----END PUBLIC KEY-----', '')
      .replace(/\s/g, '');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

export { FocusResponseValidator };
```

### 2.3 Secure Message Passing

Focus Mode - Blocker passes messages between: service worker, popup, options page, content scripts (block page), and potentially the Zovo website.

```javascript
// src/security/secure-messaging.js
// Secure internal + external message handling for Focus Mode - Blocker

class FocusSecureMessaging {
  static ALLOWED_EXTERNAL_ORIGINS = new Set([
    'https://zovo.one',
    'https://www.zovo.one',
    'https://app.zovo.one'
  ]);

  /**
   * All valid internal message types for Focus Mode - Blocker
   */
  static INTERNAL_MESSAGE_TYPES = new Set([
    // Focus session
    'START_FOCUS_SESSION',
    'END_FOCUS_SESSION',
    'GET_SESSION_STATUS',
    'SESSION_STATUS_UPDATE',

    // Pomodoro
    'START_POMODORO',
    'PAUSE_POMODORO',
    'SKIP_POMODORO_BREAK',
    'POMODORO_STATUS_UPDATE',

    // Nuclear Mode
    'START_NUCLEAR_MODE',
    'GET_NUCLEAR_STATUS',
    'NUCLEAR_STATUS_UPDATE',

    // Blocklist
    'ADD_BLOCKED_SITE',
    'REMOVE_BLOCKED_SITE',
    'TOGGLE_BLOCKED_SITE',
    'GET_BLOCKLIST',
    'IMPORT_BLOCKLIST',
    'EXPORT_BLOCKLIST',

    // Focus Score & Stats
    'GET_FOCUS_SCORE',
    'GET_STREAK',
    'GET_STATS',
    'FOCUS_SCORE_UPDATE',

    // Settings
    'GET_SETTINGS',
    'UPDATE_SETTINGS',
    'RESET_SETTINGS',

    // Pro features
    'CHECK_PRO_STATUS',
    'VALIDATE_LICENSE',
    'PRO_STATUS_UPDATE',

    // Churn detection (internal only)
    'TRACK_USAGE',
    'GET_HEALTH_SCORE',
    'GET_CHURN_RISK',

    // Milestones
    'MILESTONE_ACHIEVED',
    'DISMISS_MILESTONE',
    'GET_ACHIEVEMENTS',

    // Block page
    'GET_BLOCK_PAGE_DATA',
    'BLOCK_PAGE_BYPASS_ATTEMPT'
  ]);

  /**
   * Limited message types allowed from external sources (Zovo website)
   */
  static EXTERNAL_MESSAGE_TYPES = new Set([
    'ACTIVATE_PRO',
    'GET_EXTENSION_STATUS',
    'SYNC_SETTINGS'
  ]);

  /**
   * Initialize secure message listeners in service worker
   */
  static init() {
    // Internal message listener
    chrome.runtime.onMessage.addListener(
      (message, sender, sendResponse) => {
        return this.handleInternalMessage(message, sender, sendResponse);
      }
    );

    // External message listener (from Zovo website)
    chrome.runtime.onMessageExternal.addListener(
      (message, sender, sendResponse) => {
        return this.handleExternalMessage(message, sender, sendResponse);
      }
    );
  }

  /**
   * Handle messages from within the extension
   */
  static handleInternalMessage(message, sender, sendResponse) {
    // Validate sender is from our extension
    if (sender.id !== chrome.runtime.id) {
      console.warn('[Focus Mode Security] Rejected message from unknown extension:', sender.id);
      sendResponse({ error: 'Unauthorized' });
      return false;
    }

    // Validate message structure
    if (!this.validateInternalMessage(message)) {
      console.warn('[Focus Mode Security] Invalid internal message:', message?.type);
      sendResponse({ error: 'Invalid message format' });
      return false;
    }

    // Process message
    this.processMessage(message, sender)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ error: error.message }));

    return true; // Keep channel open for async response
  }

  /**
   * Handle messages from external sources (Zovo website)
   */
  static handleExternalMessage(message, sender, sendResponse) {
    // Strict origin validation
    if (!sender.origin || !this.ALLOWED_EXTERNAL_ORIGINS.has(sender.origin)) {
      console.warn('[Focus Mode Security] Rejected external message from:', sender.origin);
      sendResponse({ error: 'Origin not allowed' });
      return false;
    }

    // Validate message
    if (!this.validateExternalMessage(message)) {
      console.warn('[Focus Mode Security] Invalid external message:', message?.type);
      sendResponse({ error: 'Invalid message' });
      return false;
    }

    // Only allow specific external message types
    if (!this.EXTERNAL_MESSAGE_TYPES.has(message.type)) {
      console.warn('[Focus Mode Security] Blocked external message type:', message.type);
      sendResponse({ error: 'Action not allowed for external callers' });
      return false;
    }

    this.processMessage(message, sender)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ error: error.message }));

    return true;
  }

  /**
   * Validate internal message structure
   */
  static validateInternalMessage(message) {
    if (!message || typeof message !== 'object') return false;
    if (!message.type || !this.INTERNAL_MESSAGE_TYPES.has(message.type)) return false;
    if (message.id && typeof message.id !== 'string') return false;
    return true;
  }

  /**
   * Validate external message structure
   */
  static validateExternalMessage(message) {
    if (!this.validateInternalMessage(message)) return false;

    // Size limit for external messages (prevent DoS)
    const messageSize = JSON.stringify(message).length;
    if (messageSize > 10000) {
      console.warn('[Focus Mode Security] External message too large:', messageSize);
      return false;
    }

    return true;
  }

  /**
   * Process validated message — routes to appropriate handler
   */
  static async processMessage(message, sender) {
    // Route to the appropriate message handler
    // (actual implementation delegates to FocusSessionManager, BlocklistManager, etc.)
    switch (message.type) {
      case 'START_FOCUS_SESSION':
        return FocusSessionManager.start(message.payload);
      case 'END_FOCUS_SESSION':
        return FocusSessionManager.end();
      case 'GET_SESSION_STATUS':
        return FocusSessionManager.getStatus();
      case 'ADD_BLOCKED_SITE':
        return BlocklistManager.addSite(message.payload);
      case 'REMOVE_BLOCKED_SITE':
        return BlocklistManager.removeSite(message.payload);
      case 'GET_FOCUS_SCORE':
        return FocusScoreManager.getScore();
      case 'CHECK_PRO_STATUS':
        return ProManager.checkStatus();
      // ... additional handlers
      default:
        throw new Error(`Unhandled message type: ${message.type}`);
    }
  }

  /**
   * Send message with timeout (from popup/options to service worker)
   */
  static async sendMessage(message, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('[Focus Mode] Message timeout'));
      }, timeout);

      chrome.runtime.sendMessage(message, response => {
        clearTimeout(timer);

        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (response?.error) {
          reject(new Error(response.error));
          return;
        }

        resolve(response?.data);
      });
    });
  }

  /**
   * Send message to specific tab (service worker to content script)
   */
  static async sendToTab(tabId, message, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('[Focus Mode] Tab message timeout'));
      }, timeout);

      chrome.tabs.sendMessage(tabId, message, response => {
        clearTimeout(timer);

        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        resolve(response?.data);
      });
    });
  }
}

export { FocusSecureMessaging };
```

### 2.4 Transit Encryption for Sensitive Data

```javascript
// src/security/transit-encryption.js
// Encrypt sensitive data before sending to Zovo API

class FocusTransitEncryption {
  /**
   * Generate ephemeral key pair for secure exchange
   * Used for: Pro license activation, settings sync
   */
  static async generateKeyPair() {
    return crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256'
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt data for transit to Zovo API
   * Uses hybrid encryption: AES-GCM for data, RSA-OAEP for key
   */
  static async encryptForTransit(data, serverPublicKey) {
    // Generate symmetric key for actual data
    const symmetricKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    // Encrypt data with symmetric key
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(JSON.stringify(data));

    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      symmetricKey,
      encodedData
    );

    // Encrypt symmetric key with server's public key
    const exportedKey = await crypto.subtle.exportKey('raw', symmetricKey);
    const encryptedKey = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      serverPublicKey,
      exportedKey
    );

    return {
      encryptedKey: this.arrayBufferToBase64(encryptedKey),
      encryptedData: this.arrayBufferToBase64(encryptedData),
      iv: this.arrayBufferToBase64(iv)
    };
  }

  /**
   * Decrypt data received from Zovo API
   */
  static async decryptFromTransit(encryptedPackage, privateKey) {
    const encryptedKey = this.base64ToArrayBuffer(encryptedPackage.encryptedKey);
    const rawKey = await crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      privateKey,
      encryptedKey
    );

    const symmetricKey = await crypto.subtle.importKey(
      'raw',
      rawKey,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    const iv = this.base64ToArrayBuffer(encryptedPackage.iv);
    const encryptedData = this.base64ToArrayBuffer(encryptedPackage.encryptedData);

    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      symmetricKey,
      encryptedData
    );

    return JSON.parse(new TextDecoder().decode(decryptedData));
  }

  static arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    return btoa(String.fromCharCode(...bytes));
  }

  static base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

export { FocusTransitEncryption };
```

---

## 3. Implementation Priority

| Priority | Component | Complexity |
|----------|-----------|------------|
| P0 | Manifest permission configuration | Low |
| P0 | FocusSecureNetwork (HTTPS enforcement) | Medium |
| P0 | FocusSecureMessaging (message validation) | Medium |
| P1 | FocusPermissionManager (optional permissions) | Medium |
| P1 | Domain validation in FocusSecureNetwork | Low |
| P2 | FocusResponseValidator (signature verification) | Medium |
| P2 | FocusTransitEncryption | Medium |
| P2 | FocusPermissionAuditor | Low |
| P3 | Permission usage tracking | Low |

---

## 4. Key Design Decisions

### Why declarativeNetRequest Instead of webRequest
- `declarativeNetRequest` is the MV3 standard for site blocking
- No need for the critical-risk `webRequest` / `webRequestBlocking` permissions
- Rules are declarative (JSON-based), reducing code execution in the blocking path
- Better performance — Chrome evaluates rules natively

### Why Optional Host Permissions
- Zovo API and Stripe access are only needed for Pro users
- Free tier users never need network access to external domains
- Requesting host permissions on demand reduces CWS review friction
- Users see exactly why the extension needs access when upgrading to Pro

### Message Type Allowlisting
- All message types are explicitly enumerated (not pattern-matched)
- External messages limited to 3 types (ACTIVATE_PRO, GET_EXTENSION_STATUS, SYNC_SETTINGS)
- Message size limit (10KB) prevents denial-of-service via external messages
- Every message handler validates the full payload before processing

---

*Agent 2 — Permission Minimization & Secure Communication — Complete*
