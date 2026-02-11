# Agent 1 — Content Security Policy & XSS Prevention
## Focus Mode - Blocker: Security Hardening

> **Date:** February 11, 2026 | **Phase:** 18 — Security Hardening Audit
> **Scope:** CSP configuration, XSS prevention patterns, DOM safety, input validation, template sanitization

---

## 1. Content Security Policy (CSP)

### 1.1 MV3 CSP Requirements

Manifest V3 enforces stricter CSP than MV2, eliminating remote code execution vulnerabilities. Focus Mode - Blocker must comply with MV3's built-in restrictions while adding additional hardening.

**Default MV3 CSP (Applied Automatically):**
```
script-src 'self';
object-src 'self';
```

**Prohibited in MV3:**
- `eval()` and `new Function()`
- Inline scripts (`<script>code</script>`)
- Remote scripts (`script-src https://cdn.example.com`)
- `unsafe-eval` and `unsafe-inline` directives

### 1.2 Focus Mode - Blocker CSP Configuration

```json
// manifest.json - Maximum Security CSP for Focus Mode - Blocker
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'; upgrade-insecure-requests;",
    "sandbox": "sandbox allow-scripts allow-forms; script-src 'self' 'unsafe-inline' 'unsafe-eval'; child-src 'self';"
  }
}
```

**CSP Directive Breakdown for Focus Mode - Blocker:**

```javascript
// src/security/csp-config.js
// Documented CSP Configuration for Focus Mode - Blocker

const FOCUS_CSP_DIRECTIVES = {
  // Only allow scripts from extension package
  'script-src': "'self'",

  // Block all plugins (Flash, Java, etc.)
  'object-src': "'none'",

  // Prevent base tag hijacking
  'base-uri': "'none'",

  // Prevent clickjacking on extension pages
  'frame-ancestors': "'none'",

  // Restrict form submissions to extension and Zovo API
  'form-action': "'self'",

  // Allow images from extension, data URIs (for Focus Score badges), and HTTPS
  'img-src': "'self' data: https:",

  // Restrict styles — unsafe-inline needed for dynamic theme application
  'style-src': "'self' 'unsafe-inline'",

  // Only connect to Zovo API endpoints and Stripe
  'connect-src': "'self' https://api.zovo.one https://api.stripe.com",

  // Upgrade HTTP to HTTPS
  'upgrade-insecure-requests': ''
};

/**
 * Build CSP string from directive map
 */
function buildCSP(directives) {
  return Object.entries(directives)
    .map(([key, value]) => `${key} ${value}`.trim())
    .join('; ');
}

/**
 * CSP for Focus Mode block pages (content scripts inject into web pages)
 * More restrictive since it runs in untrusted page context
 */
const BLOCK_PAGE_CSP = {
  'script-src': "'self'",
  'style-src': "'self' 'unsafe-inline'",  // Needed for Shadow DOM styles
  'img-src': "'self' data:",
  'connect-src': "'none'",               // Block page should never make network requests
  'frame-src': "'none'",
  'object-src': "'none'"
};

export { FOCUS_CSP_DIRECTIVES, BLOCK_PAGE_CSP, buildCSP };
```

### 1.3 Inline Script Alternatives

Focus Mode - Blocker uses multiple UI surfaces (popup, options page, block page, celebration overlays) that must all comply with CSP.

**Problem: Inline Event Handlers Don't Work**
```html
<!-- BLOCKED by CSP — DO NOT USE in Focus Mode - Blocker -->
<button onclick="startFocusSession()">Start Focus</button>
<script>console.log('Inline script');</script>
```

**Solution 1: External Script Files (Used Everywhere)**
```html
<!-- popup.html — Focus Mode - Blocker popup -->
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="styles/popup.css">
</head>
<body>
  <button id="startFocusBtn">Start Focus Session</button>
  <button id="nuclearModeBtn" class="pro-feature">Nuclear Mode</button>
  <div id="focusTimer"></div>
  <div id="focusScore"></div>
  <script src="js/popup.js"></script>
</body>
</html>
```

```javascript
// js/popup.js — All JavaScript in external files
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('startFocusBtn')
    .addEventListener('click', handleStartFocus);
  document.getElementById('nuclearModeBtn')
    .addEventListener('click', handleNuclearMode);
});

async function handleStartFocus() {
  await chrome.runtime.sendMessage({ type: 'START_FOCUS_SESSION' });
}

async function handleNuclearMode() {
  await chrome.runtime.sendMessage({ type: 'START_NUCLEAR_MODE' });
}
```

**Solution 2: Event Delegation Pattern (For Dynamic UI)**

```javascript
// src/ui/focus-event-delegator.js
// Used for dynamically generated elements (blocklist items, milestone celebrations)

class FocusEventDelegator {
  constructor(rootElement) {
    this.root = rootElement;
    this.handlers = new Map();
    this.init();
  }

  init() {
    // Single listener handles all events via delegation
    this.root.addEventListener('click', this.handleEvent.bind(this));
    this.root.addEventListener('input', this.handleEvent.bind(this));
    this.root.addEventListener('change', this.handleEvent.bind(this));
  }

  handleEvent(event) {
    const target = event.target;
    const action = target.dataset.action;

    if (action && this.handlers.has(action)) {
      this.handlers.get(action)(event, target);
    }
  }

  register(action, handler) {
    this.handlers.set(action, handler);
  }
}

// Usage in blocklist management
const delegator = new FocusEventDelegator(document.getElementById('blocklist'));

delegator.register('remove-site', (event, target) => {
  const siteUrl = target.dataset.siteUrl;
  chrome.runtime.sendMessage({ type: 'REMOVE_BLOCKED_SITE', url: siteUrl });
});

delegator.register('toggle-site', (event, target) => {
  const siteUrl = target.dataset.siteUrl;
  const enabled = target.checked;
  chrome.runtime.sendMessage({ type: 'TOGGLE_BLOCKED_SITE', url: siteUrl, enabled });
});

delegator.register('edit-schedule', (event, target) => {
  const siteUrl = target.dataset.siteUrl;
  openScheduleEditor(siteUrl);
});
```

```html
<!-- HTML with data attributes instead of inline handlers -->
<ul id="blocklist">
  <li>
    <span>facebook.com</span>
    <input type="checkbox" data-action="toggle-site" data-site-url="facebook.com" checked>
    <button data-action="edit-schedule" data-site-url="facebook.com">Schedule</button>
    <button data-action="remove-site" data-site-url="facebook.com">Remove</button>
  </li>
</ul>
```

### 1.4 Dynamic Module Loading (CSP-Compliant)

```javascript
// src/security/secure-module-loader.js
// Load Focus Mode feature modules dynamically (Pro features, themes, etc.)

class SecureModuleLoader {
  static async load(modulePath) {
    // Validate module path is within extension
    if (!this.isValidPath(modulePath)) {
      throw new Error(`Invalid module path: ${modulePath}`);
    }

    try {
      const module = await import(chrome.runtime.getURL(modulePath));
      return module;
    } catch (error) {
      console.error(`Failed to load module: ${modulePath}`, error);
      throw error;
    }
  }

  static isValidPath(path) {
    // Only allow loading from specific Focus Mode directories
    const allowedPrefixes = [
      'modules/',
      'lib/',
      'components/',
      'features/',
      'themes/'
    ];
    return allowedPrefixes.some(prefix => path.startsWith(prefix));
  }

  /**
   * Load Pro-only feature modules on demand
   */
  static async loadProFeature(featureName) {
    const proModules = {
      'nuclear-mode': 'features/nuclear-mode.js',
      'advanced-stats': 'features/advanced-stats.js',
      'custom-themes': 'features/custom-themes.js',
      'unlimited-blocklist': 'features/unlimited-blocklist.js',
      'focus-score-insights': 'features/focus-score-insights.js'
    };

    const modulePath = proModules[featureName];
    if (!modulePath) {
      throw new Error(`Unknown Pro feature: ${featureName}`);
    }

    return this.load(modulePath);
  }
}

// Usage
const nuclearMode = await SecureModuleLoader.loadProFeature('nuclear-mode');
```

### 1.5 Nonce-Based Script Loading (Sandbox Pages Only)

```javascript
// src/security/nonce-manager.js
// Used ONLY for sandboxed pages (e.g., custom block page sandbox)

class NonceManager {
  static generate() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  }

  static injectScript(scriptContent, container = document.body) {
    const nonce = this.generate();
    const script = document.createElement('script');
    script.nonce = nonce;
    script.textContent = scriptContent;
    container.appendChild(script);
    return nonce;
  }
}

// IMPORTANT: Only for sandboxed pages, never extension pages
// sandbox.html CSP allows 'unsafe-inline' with nonce
```

---

## 2. XSS Prevention

### 2.1 DOM Manipulation Safety

Focus Mode - Blocker renders user-provided data in multiple contexts: blocklist URLs, custom block page messages, Focus Score displays, milestone celebrations, and settings. All DOM manipulation must follow XSS-safe patterns.

**The Golden Rules for Focus Mode - Blocker:**
1. Never use `innerHTML` with untrusted data (blocklist URLs, user messages)
2. Always validate and sanitize user input (site URLs, custom messages)
3. Use `textContent` for text, DOM APIs for structure
4. Encode data for the context it's used in

```javascript
// src/security/safe-dom.js
// Safe DOM manipulation utilities for Focus Mode - Blocker

class SafeDOM {
  /**
   * Safely set text content (XSS-safe)
   * Used for: Focus Score display, timer text, blocklist site names, streak counts
   */
  static setText(element, text) {
    if (typeof text !== 'string') {
      text = String(text);
    }
    element.textContent = text;
  }

  /**
   * Safely create an element with attributes
   * Used for: building popup UI, options page, block page, celebrations
   */
  static createElement(tag, attributes = {}, textContent = '') {
    const allowedTags = new Set([
      'div', 'span', 'p', 'a', 'button', 'input', 'label',
      'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'thead', 'tbody',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'form', 'select', 'option',
      'section', 'header', 'footer', 'nav', 'main', 'article',
      'progress', 'meter', 'time', 'details', 'summary'
    ]);

    if (!allowedTags.has(tag.toLowerCase())) {
      throw new Error(`Tag not allowed: ${tag}`);
    }

    const element = document.createElement(tag);

    // Set safe attributes
    for (const [key, value] of Object.entries(attributes)) {
      this.setAttributeSafe(element, key, value);
    }

    if (textContent) {
      element.textContent = textContent;
    }

    return element;
  }

  /**
   * Safely set an attribute — blocks event handlers and javascript: URLs
   */
  static setAttributeSafe(element, name, value) {
    const dangerousAttributes = new Set([
      'onclick', 'onerror', 'onload', 'onmouseover', 'onfocus',
      'onblur', 'onsubmit', 'onreset', 'onchange', 'oninput',
      'onkeydown', 'onkeyup', 'onkeypress', 'ondrag', 'ondrop',
      'onmousedown', 'onmouseup', 'ontouchstart', 'ontouchend'
    ]);

    // Block event handlers
    if (dangerousAttributes.has(name.toLowerCase())) {
      console.warn(`[Focus Mode Security] Blocked dangerous attribute: ${name}`);
      return;
    }

    // Sanitize href/src for javascript: URLs
    if (['href', 'src', 'action'].includes(name.toLowerCase())) {
      if (this.isDangerousURL(value)) {
        console.warn(`[Focus Mode Security] Blocked dangerous URL in ${name}: ${value}`);
        return;
      }
    }

    element.setAttribute(name, value);
  }

  /**
   * Check for dangerous URL schemes
   */
  static isDangerousURL(url) {
    const normalized = url.toLowerCase().trim();
    const dangerousSchemes = [
      'javascript:',
      'data:text/html',
      'vbscript:',
      'file:'
    ];
    return dangerousSchemes.some(scheme => normalized.startsWith(scheme));
  }

  /**
   * Safely create a link element
   * Used for: blocklist site links, "Learn More" links, Pro upgrade links
   */
  static createLink(href, text, newTab = false) {
    if (this.isDangerousURL(href)) {
      throw new Error('[Focus Mode Security] Dangerous URL blocked');
    }

    const link = document.createElement('a');
    link.href = href;
    link.textContent = text;

    if (newTab) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer'; // Prevent tab-nabbing
    }

    return link;
  }

  /**
   * Build Focus Score display safely
   */
  static renderFocusScore(score, container) {
    container.textContent = ''; // Clear safely

    const scoreValue = SafeDOM.createElement('span', { class: 'focus-score-value' }, String(Math.round(score)));
    const scoreLabel = SafeDOM.createElement('span', { class: 'focus-score-label' }, 'Focus Score');

    const scoreCircle = SafeDOM.createElement('div', { class: 'focus-score-circle' });
    scoreCircle.style.setProperty('--score-progress', `${score}%`);
    scoreCircle.appendChild(scoreValue);

    container.appendChild(scoreCircle);
    container.appendChild(scoreLabel);
  }

  /**
   * Build blocklist item safely
   */
  static renderBlocklistItem(site) {
    const li = SafeDOM.createElement('li', { class: 'blocklist-item' });

    const siteIcon = SafeDOM.createElement('img', {
      src: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(site.url)}&sz=16`,
      alt: '',
      class: 'site-favicon'
    });

    const siteName = SafeDOM.createElement('span', { class: 'site-name' }, site.url);
    const toggleBtn = SafeDOM.createElement('button', {
      class: 'site-toggle',
      'data-action': 'toggle-site',
      'data-site-url': site.url
    }, site.enabled ? 'Enabled' : 'Disabled');

    const removeBtn = SafeDOM.createElement('button', {
      class: 'site-remove',
      'data-action': 'remove-site',
      'data-site-url': site.url
    }, 'Remove');

    li.appendChild(siteIcon);
    li.appendChild(siteName);
    li.appendChild(toggleBtn);
    li.appendChild(removeBtn);

    return li;
  }

  /**
   * Build milestone celebration safely
   */
  static renderMilestoneCelebration(milestone, container) {
    container.textContent = '';

    const overlay = SafeDOM.createElement('div', { class: 'milestone-overlay' });
    const card = SafeDOM.createElement('div', { class: 'milestone-card' });

    const icon = SafeDOM.createElement('div', { class: 'milestone-icon' }, milestone.icon);
    const title = SafeDOM.createElement('h2', { class: 'milestone-title' }, milestone.title);
    const description = SafeDOM.createElement('p', { class: 'milestone-description' }, milestone.description);
    const dismissBtn = SafeDOM.createElement('button', {
      class: 'milestone-dismiss',
      'data-action': 'dismiss-milestone'
    }, 'Continue Focusing');

    card.appendChild(icon);
    card.appendChild(title);
    card.appendChild(description);
    card.appendChild(dismissBtn);
    overlay.appendChild(card);
    container.appendChild(overlay);
  }
}

export { SafeDOM };
```

### 2.2 HTML Sanitization with DOMPurify

For cases where HTML rendering is necessary (e.g., rich text in block page custom messages, Pro user custom block page content):

```javascript
// src/security/html-sanitizer.js
import DOMPurify from 'dompurify';

class FocusHTMLSanitizer {
  static defaultConfig = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span'],
    ALLOWED_ATTR: ['href', 'class', 'id', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'object', 'embed', 'link'],
    FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onfocus', 'onblur'],
  };

  /**
   * Block page custom message config — very restrictive
   */
  static blockPageConfig = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'span'],
    ALLOWED_ATTR: ['class'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'a', 'img'],
    FORBID_ATTR: ['onerror', 'onclick', 'onload', 'href', 'src'],
  };

  static sanitize(dirty, config = {}) {
    const mergedConfig = { ...this.defaultConfig, ...config };

    // Add hooks for extra security
    DOMPurify.addHook('afterSanitizeAttributes', (node) => {
      // Force all links to open safely
      if (node.tagName === 'A') {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      }

      // Remove any javascript: URLs that slipped through
      if (node.hasAttribute('href')) {
        const href = node.getAttribute('href');
        if (href.toLowerCase().startsWith('javascript:')) {
          node.removeAttribute('href');
        }
      }
    });

    return DOMPurify.sanitize(dirty, mergedConfig);
  }

  /**
   * Sanitize custom block page message (Pro feature)
   */
  static sanitizeBlockPageMessage(message) {
    return this.sanitize(message, this.blockPageConfig);
  }

  static sanitizeToFragment(dirty, config = {}) {
    const mergedConfig = {
      ...this.defaultConfig,
      ...config,
      RETURN_DOM_FRAGMENT: true
    };
    return DOMPurify.sanitize(dirty, mergedConfig);
  }

  // Strip all HTML, return plain text
  static stripHTML(dirty) {
    return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
  }
}

// Usage examples
const userMessage = '<script>alert("xss")</script><p onclick="evil()">Stay focused! <b>You can do it!</b></p>';
const safe = FocusHTMLSanitizer.sanitizeBlockPageMessage(userMessage);
// Result: <p>Stay focused! <b>You can do it!</b></p>

export { FocusHTMLSanitizer };
```

### 2.3 Safe Template Literals

```javascript
// src/security/safe-template.js
// Tagged template literal for HTML escaping in Focus Mode - Blocker

class SafeTemplate {
  /**
   * Tagged template literal for HTML escaping
   * Used for: building HTML strings that will be sanitized before insertion
   */
  static html(strings, ...values) {
    const escaped = values.map(val => this.escapeHTML(String(val)));
    return strings.reduce((result, str, i) => {
      return result + str + (escaped[i] || '');
    }, '');
  }

  /**
   * Escape HTML special characters
   */
  static escapeHTML(str) {
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;'
    };
    return str.replace(/[&<>"'`=/]/g, char => escapeMap[char]);
  }

  /**
   * Safe URL encoding for blocklist URLs
   */
  static escapeURL(str) {
    return encodeURIComponent(str);
  }

  /**
   * Safe JavaScript string encoding
   */
  static escapeJS(str) {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  }
}

// Usage with tagged template — blocklist display
const siteUrl = '<script>alert("xss")</script>';
const safeHTML = SafeTemplate.html`<div class="blocked-site">${siteUrl}</div>`;
// Result: <div class="blocked-site">&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;</div>

export { SafeTemplate };
```

### 2.4 User Input Validation

```javascript
// src/security/input-validator.js
// Input validation for Focus Mode - Blocker user inputs

class FocusInputValidator {
  static patterns = {
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    url: /^https?:\/\/[^\s<>'"]+$/,
    domain: /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
    alphanumeric: /^[a-zA-Z0-9]+$/,
    hexColor: /^#[0-9a-fA-F]{6}$/,
    focusSessionMinutes: /^[1-9]\d{0,2}$/  // 1-999 minutes
  };

  static validate(value, rules) {
    const errors = [];

    for (const rule of rules) {
      const error = this.applyRule(value, rule);
      if (error) {
        errors.push(error);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  static applyRule(value, rule) {
    switch (rule.type) {
      case 'required':
        if (!value || value.trim() === '') {
          return rule.message || 'This field is required';
        }
        break;

      case 'minLength':
        if (value.length < rule.value) {
          return rule.message || `Minimum length is ${rule.value}`;
        }
        break;

      case 'maxLength':
        if (value.length > rule.value) {
          return rule.message || `Maximum length is ${rule.value}`;
        }
        break;

      case 'pattern':
        const pattern = this.patterns[rule.value] || rule.value;
        if (!pattern.test(value)) {
          return rule.message || 'Invalid format';
        }
        break;

      case 'custom':
        if (!rule.validator(value)) {
          return rule.message || 'Validation failed';
        }
        break;

      case 'noHTML':
        if (/<[^>]*>/.test(value)) {
          return rule.message || 'HTML is not allowed';
        }
        break;

      case 'noScriptKeywords':
        const scriptKeywords = /javascript:|on\w+\s*=|<script|eval\(|Function\(/i;
        if (scriptKeywords.test(value)) {
          return rule.message || 'Invalid characters detected';
        }
        break;
    }

    return null;
  }

  /**
   * Validate blocklist URL input
   * Used when user adds a site to the blocklist
   */
  static validateBlocklistEntry(input) {
    // Clean the input
    let cleaned = input.trim().toLowerCase();

    // Strip protocol if present
    cleaned = cleaned.replace(/^https?:\/\//, '');

    // Strip trailing slash
    cleaned = cleaned.replace(/\/$/, '');

    // Strip www. prefix
    cleaned = cleaned.replace(/^www\./, '');

    // Validate as domain
    const result = this.validate(cleaned, [
      { type: 'required', message: 'Please enter a website URL' },
      { type: 'maxLength', value: 253, message: 'URL is too long' },
      { type: 'pattern', value: 'domain', message: 'Please enter a valid domain (e.g., facebook.com)' },
      { type: 'noScriptKeywords' }
    ]);

    return {
      ...result,
      cleanedUrl: result.valid ? cleaned : null
    };
  }

  /**
   * Validate custom block page message (Pro feature)
   */
  static validateBlockPageMessage(message) {
    return this.validate(message, [
      { type: 'maxLength', value: 500, message: 'Message must be 500 characters or less' },
      { type: 'noScriptKeywords', message: 'Message contains invalid content' }
    ]);
  }

  /**
   * Validate Focus session duration
   */
  static validateSessionDuration(minutes) {
    const numMinutes = parseInt(minutes, 10);

    if (isNaN(numMinutes) || numMinutes < 1) {
      return { valid: false, errors: ['Duration must be at least 1 minute'] };
    }

    if (numMinutes > 480) {
      return { valid: false, errors: ['Duration cannot exceed 8 hours (480 minutes)'] };
    }

    return { valid: true, errors: [], value: numMinutes };
  }

  /**
   * Validate Pomodoro settings
   */
  static validatePomodoroSettings(settings) {
    const errors = [];

    if (settings.workMinutes < 1 || settings.workMinutes > 120) {
      errors.push('Work period must be 1-120 minutes');
    }

    if (settings.breakMinutes < 1 || settings.breakMinutes > 60) {
      errors.push('Break period must be 1-60 minutes');
    }

    if (settings.longBreakMinutes < 1 || settings.longBreakMinutes > 120) {
      errors.push('Long break must be 1-120 minutes');
    }

    if (settings.sessionsBeforeLongBreak < 1 || settings.sessionsBeforeLongBreak > 10) {
      errors.push('Sessions before long break must be 1-10');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate Nuclear Mode settings
   */
  static validateNuclearModeSettings(settings) {
    const errors = [];

    if (settings.durationMinutes < 15) {
      errors.push('Nuclear Mode must be at least 15 minutes');
    }

    if (settings.durationMinutes > 1440) {
      errors.push('Nuclear Mode cannot exceed 24 hours');
    }

    if (!Array.isArray(settings.blockedSites) || settings.blockedSites.length === 0) {
      errors.push('At least one site must be blocked');
    }

    return { valid: errors.length === 0, errors };
  }

  static sanitizeSearchQuery(query) {
    return query
      .substring(0, 500)
      .replace(/<[^>]*>/g, '')
      .trim();
  }
}

export { FocusInputValidator };
```

### 2.5 Safe innerHTML Alternatives

```javascript
// src/security/safe-renderer.js
// Safe rendering utilities for Focus Mode - Blocker UI components

class FocusSafeRenderer {
  /**
   * Build Focus session card without innerHTML
   */
  static renderSessionCard(session) {
    const card = document.createElement('div');
    card.className = 'session-card';

    const duration = document.createElement('span');
    duration.className = 'session-duration';
    duration.textContent = `${session.durationMinutes} min`;

    const score = document.createElement('span');
    score.className = 'session-score';
    score.textContent = `Score: ${session.focusScore}`;

    const date = document.createElement('time');
    date.className = 'session-date';
    date.textContent = new Date(session.startTime).toLocaleDateString();
    date.dateTime = new Date(session.startTime).toISOString();

    const sitesBlocked = document.createElement('span');
    sitesBlocked.className = 'session-blocks';
    sitesBlocked.textContent = `${session.blockedAttempts} blocks`;

    card.appendChild(duration);
    card.appendChild(score);
    card.appendChild(date);
    card.appendChild(sitesBlocked);

    return card;
  }

  /**
   * Build streak display without innerHTML
   */
  static renderStreakDisplay(streakDays, container) {
    container.textContent = '';

    const streakNumber = document.createElement('span');
    streakNumber.className = 'streak-number';
    streakNumber.textContent = String(streakDays);

    const streakLabel = document.createElement('span');
    streakLabel.className = 'streak-label';
    streakLabel.textContent = streakDays === 1 ? 'day streak' : 'day streak';

    const streakFire = document.createElement('span');
    streakFire.className = 'streak-fire';
    streakFire.textContent = streakDays > 0 ? '\uD83D\uDD25' : '';

    container.appendChild(streakFire);
    container.appendChild(streakNumber);
    container.appendChild(streakLabel);
  }

  /**
   * Build Pomodoro timer display without innerHTML
   */
  static renderPomodoroTimer(timeRemaining, totalTime, sessionNumber, container) {
    container.textContent = '';

    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;

    const timerDisplay = document.createElement('div');
    timerDisplay.className = 'pomodoro-timer';
    timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    const progress = document.createElement('progress');
    progress.className = 'pomodoro-progress';
    progress.max = totalTime;
    progress.value = totalTime - timeRemaining;

    const sessionLabel = document.createElement('span');
    sessionLabel.className = 'pomodoro-session';
    sessionLabel.textContent = `Session ${sessionNumber}`;

    container.appendChild(timerDisplay);
    container.appendChild(progress);
    container.appendChild(sessionLabel);
  }

  /**
   * Render a list safely (for blocklist, session history, etc.)
   */
  static renderList(items, container, renderItem) {
    const fragment = document.createDocumentFragment();
    const ul = document.createElement('ul');

    for (const item of items) {
      const li = document.createElement('li');
      const rendered = renderItem(item);

      if (typeof rendered === 'string') {
        li.textContent = rendered; // Safe: textContent
      } else if (rendered instanceof HTMLElement) {
        li.appendChild(rendered);
      }

      ul.appendChild(li);
    }

    fragment.appendChild(ul);
    container.textContent = '';
    container.appendChild(fragment);
  }

  /**
   * Update element content safely
   */
  static updateContent(elementId, content, isHTML = false) {
    const element = document.getElementById(elementId);
    if (!element) return;

    if (isHTML) {
      // Use DOMPurify for HTML content
      element.innerHTML = DOMPurify.sanitize(content, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'],
        ALLOWED_ATTR: []
      });
    } else {
      element.textContent = content;
    }
  }

  /**
   * Sanitize image URL before rendering
   */
  static sanitizeImageURL(url) {
    try {
      const parsed = new URL(url);
      if (['http:', 'https:', 'data:'].includes(parsed.protocol)) {
        if (parsed.protocol === 'data:' && !url.startsWith('data:image/')) {
          return chrome.runtime.getURL('images/default-icon.png');
        }
        return url;
      }
    } catch {
      // Invalid URL
    }
    return chrome.runtime.getURL('images/default-icon.png');
  }

  /**
   * Sanitize URL before using in href
   */
  static sanitizeURL(url) {
    try {
      const parsed = new URL(url);
      if (['http:', 'https:'].includes(parsed.protocol)) {
        return url;
      }
    } catch {
      // Invalid URL
    }
    return '#';
  }
}

export { FocusSafeRenderer };
```

### 2.6 Content Script XSS Protection

Focus Mode - Blocker injects content scripts into web pages to display the block page. These scripts run in the context of potentially hostile pages.

```javascript
// src/content/secure-block-page.js
// Secure block page injection using Shadow DOM

class SecureBlockPage {
  constructor() {
    this.shadowHost = null;
    this.shadowRoot = null;
  }

  /**
   * Inject block page using Shadow DOM for isolation
   * Shadow DOM prevents the host page from accessing or modifying block page content
   */
  inject(blockPageData) {
    // Create isolated container
    this.shadowHost = document.createElement('div');
    this.shadowHost.id = 'focus-mode-block-page';
    this.shadowHost.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: 2147483647 !important;
    `;

    // Closed shadow root — host page cannot access shadowRoot
    this.shadowRoot = this.shadowHost.attachShadow({ mode: 'closed' });

    // Build block page content safely (no innerHTML with user data)
    this.buildBlockPage(blockPageData);

    // Inject into page
    document.documentElement.appendChild(this.shadowHost);

    // Prevent removal by hostile pages
    this.protectFromRemoval();
  }

  buildBlockPage(data) {
    // Load styles from extension bundle (not inline)
    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = chrome.runtime.getURL('styles/block-page.css');
    this.shadowRoot.appendChild(styleLink);

    // Build all content with safe DOM APIs
    const container = document.createElement('div');
    container.className = 'focus-block-container';

    const logo = document.createElement('img');
    logo.src = chrome.runtime.getURL('images/focus-mode-logo.svg');
    logo.alt = 'Focus Mode';
    logo.className = 'block-logo';

    const title = document.createElement('h1');
    title.textContent = 'Site Blocked';

    const siteUrl = document.createElement('p');
    siteUrl.className = 'blocked-url';
    siteUrl.textContent = data.blockedUrl; // Safe: textContent

    const message = document.createElement('p');
    message.className = 'block-message';
    // Custom messages are sanitized before storage, but double-sanitize here
    message.textContent = data.customMessage || 'Stay focused! You\'ve got this.';

    const focusScoreDisplay = document.createElement('div');
    focusScoreDisplay.className = 'block-focus-score';
    focusScoreDisplay.textContent = `Focus Score: ${Math.round(data.focusScore)}`;

    const streakDisplay = document.createElement('div');
    streakDisplay.className = 'block-streak';
    streakDisplay.textContent = data.streakDays > 0
      ? `${data.streakDays} day streak`
      : '';

    container.appendChild(logo);
    container.appendChild(title);
    container.appendChild(siteUrl);
    container.appendChild(message);
    container.appendChild(focusScoreDisplay);
    container.appendChild(streakDisplay);

    this.shadowRoot.appendChild(container);
  }

  /**
   * Protect block page from removal by hostile page scripts
   */
  protectFromRemoval() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const removed of mutation.removedNodes) {
          if (removed === this.shadowHost) {
            // Re-inject if removed
            document.documentElement.appendChild(this.shadowHost);
          }
        }
      }
    });

    observer.observe(document.documentElement, { childList: true });
  }
}

export { SecureBlockPage };
```

---

## 3. Focus Mode - Blocker Specific Security Contexts

### 3.1 Block Page Security Matrix

| Context | Risk Level | XSS Vector | Mitigation |
|---------|-----------|-------------|------------|
| Blocked URL display | Medium | User-controlled URL | `textContent` only |
| Custom block message (Pro) | High | Rich text input | DOMPurify sanitization + `textContent` fallback |
| Focus Score display | Low | Numeric value | `textContent` + parseInt validation |
| Streak counter | Low | Numeric value | `textContent` + parseInt validation |
| Timer display | Low | Calculated value | `textContent` only |
| Blocklist management | Medium | User-entered domains | Input validation + `textContent` |
| Celebration overlays | Low | Extension-controlled | SafeDOM helpers |
| Settings page | Medium | User preferences | Input validation + type checking |
| Nuclear Mode UI | Low | Extension-controlled | SafeDOM helpers |
| Pomodoro timer | Low | Calculated values | `textContent` only |

### 3.2 Security Event Logging

```javascript
// src/security/security-logger.js
// Log security-relevant events for Focus Mode - Blocker

class FocusSecurityLogger {
  static LOG_KEY = 'focus_security_log';
  static MAX_LOG_ENTRIES = 500;

  static async log(event) {
    const logEntry = {
      timestamp: Date.now(),
      type: event.type,
      details: event.details,
      context: event.context || 'unknown'
    };

    const result = await chrome.storage.local.get(this.LOG_KEY);
    const logs = result[this.LOG_KEY] || [];

    logs.push(logEntry);

    // Keep only recent entries
    if (logs.length > this.MAX_LOG_ENTRIES) {
      logs.splice(0, logs.length - this.MAX_LOG_ENTRIES);
    }

    await chrome.storage.local.set({ [this.LOG_KEY]: logs });
  }

  static async logBlockedXSS(context, blockedContent) {
    await this.log({
      type: 'xss_blocked',
      details: `Blocked XSS attempt: ${blockedContent.substring(0, 100)}`,
      context
    });
  }

  static async logDangerousURL(context, url) {
    await this.log({
      type: 'dangerous_url_blocked',
      details: `Blocked dangerous URL: ${url.substring(0, 100)}`,
      context
    });
  }

  static async logInvalidInput(context, inputType, value) {
    await this.log({
      type: 'invalid_input',
      details: `Invalid ${inputType} input rejected`,
      context
    });
  }

  static async logCSPViolation(violationDetails) {
    await this.log({
      type: 'csp_violation',
      details: violationDetails,
      context: 'csp'
    });
  }
}

export { FocusSecurityLogger };
```

---

## 4. Implementation Priority

| Priority | Component | Complexity |
|----------|-----------|------------|
| P0 | CSP manifest configuration | Low |
| P0 | SafeDOM class | Medium |
| P0 | FocusInputValidator | Medium |
| P0 | SecureBlockPage (Shadow DOM) | Medium |
| P1 | FocusHTMLSanitizer (DOMPurify) | Low |
| P1 | SafeTemplate tagged literals | Low |
| P1 | FocusEventDelegator | Low |
| P1 | FocusSafeRenderer | Medium |
| P2 | SecureModuleLoader | Low |
| P2 | FocusSecurityLogger | Low |
| P2 | NonceManager (sandbox only) | Low |

---

## 5. Dependencies

- **DOMPurify** (^3.x): Only production dependency for HTML sanitization. ~15KB minified+gzipped. Used in FocusHTMLSanitizer.
- All other security utilities are zero-dependency, using only browser-native APIs (`crypto`, `DOM`, `URL`).

---

*Agent 1 — CSP & XSS Prevention — Complete*
