# Cross-Extension Promotion -- Focus Mode - Blocker

## 1. Promotion Strategy

### Philosophy
- Cross-promotion is a VALUE-ADD, not an interruption
- Show relevant extensions that complement Focus Mode's workflow
- Never show during active focus sessions
- Maximum 1 recommendation per day
- Users can permanently dismiss

### Relevance Mapping
Which Zovo extensions complement Focus Mode?
| Extension | Relevance | When to Recommend |
|-----------|-----------|-------------------|
| Tab Suspender Pro | HIGH | "Focus Mode blocked distractions. Suspender keeps your working tabs fast." |
| Quick Notes | HIGH | "Capture thoughts during focus sessions without leaving your flow." |
| Clipboard History | MEDIUM | "Research faster -- your clipboard remembers everything." |
| Screenshot Annotate | MEDIUM | "Annotate screenshots during productive work sessions." |
| JSON Formatter Pro | LOW (dev-only) | Only show to users with developer sites in blocklist |
| Form Filler Pro | LOW | Contextual only |

### Recommendation Priority
1. Tab Suspender Pro (highest synergy -- both are productivity tools)
2. Quick Notes (captures ideas during focus sessions)
3. Clipboard History (research workflow)

## 2. "More from Zovo" Panel

### Settings Page Integration
In the options/settings page, add a "More from Zovo" section:

```
+-----------------------------------------------------+
|  More from Zovo                                      |
|                                                      |
|  +----------------------------------------------+   |
|  | * ZOVO MEMBERSHIP                             |   |
|  |                                               |   |
|  | Get all Zovo extensions with one membership   |   |
|  | $99 lifetime - 50 founding spots left         |   |
|  |                                               |   |
|  |        [Learn More ->]                        |   |
|  +----------------------------------------------+   |
|                                                      |
|  Recommended for you:                                |
|                                                      |
|  +--------+ Tab Suspender Pro                        |
|  | [icon] | Save memory, suspend inactive tabs       |
|  |        | ***** 4.7 - 3,200+ users                 |
|  +--------+ [Install ->]                             |
|                                                      |
|  +--------+ Quick Notes                              |
|  | [icon] | Capture thoughts instantly               |
|  |        | **** 4.5 - 1,800+ users                  |
|  +--------+ [Install ->]                             |
|                                                      |
|  +--------+ Clipboard History                        |
|  | [icon] | Never lose copied text again             |
|  |        | ***** 4.6 - 2,500+ users                 |
|  +--------+ [Install ->]                             |
|                                                      |
|  See all Zovo extensions ->                          |
+-----------------------------------------------------+
```

### Extension Catalog Data Structure
```javascript
const ZOVO_CATALOG = [
  {
    id: 'tab-suspender-pro',
    name: 'Tab Suspender Pro',
    tagline: 'Save memory, suspend inactive tabs',
    icon: 'https://zovo.one/icons/tab-suspender.png',
    storeUrl: 'https://chrome.google.com/webstore/detail/...',
    category: 'productivity',
    relevanceToFocusMode: 'high',
    rating: 4.7,
    users: 3200,
    featured: true
  },
  {
    id: 'quick-notes',
    name: 'Quick Notes',
    tagline: 'Capture thoughts instantly',
    icon: 'https://zovo.one/icons/quick-notes.png',
    storeUrl: 'https://chrome.google.com/webstore/detail/...',
    category: 'productivity',
    relevanceToFocusMode: 'high',
    rating: 4.5,
    users: 1800,
    featured: true
  },
  {
    id: 'clipboard-history',
    name: 'Clipboard History',
    tagline: 'Never lose copied text again',
    icon: 'https://zovo.one/icons/clipboard-history.png',
    storeUrl: 'https://chrome.google.com/webstore/detail/...',
    category: 'productivity',
    relevanceToFocusMode: 'medium',
    rating: 4.6,
    users: 2500,
    featured: true
  },
  {
    id: 'screenshot-annotate',
    name: 'Screenshot Annotate',
    tagline: 'Capture and annotate your screen',
    icon: 'https://zovo.one/icons/screenshot-annotate.png',
    storeUrl: 'https://chrome.google.com/webstore/detail/...',
    category: 'productivity',
    relevanceToFocusMode: 'medium',
    rating: 4.4,
    users: 1500,
    featured: false
  },
  {
    id: 'json-formatter-pro',
    name: 'JSON Formatter Pro',
    tagline: 'Format, validate, and explore JSON',
    icon: 'https://zovo.one/icons/json-formatter.png',
    storeUrl: 'https://chrome.google.com/webstore/detail/...',
    category: 'developer',
    relevanceToFocusMode: 'low',
    rating: 4.8,
    users: 4100,
    featured: false
  },
  {
    id: 'form-filler-pro',
    name: 'Form Filler Pro',
    tagline: 'Auto-fill forms in one click',
    icon: 'https://zovo.one/icons/form-filler.png',
    storeUrl: 'https://chrome.google.com/webstore/detail/...',
    category: 'productivity',
    relevanceToFocusMode: 'low',
    rating: 4.3,
    users: 1200,
    featured: false
  }
];
```

## 3. Contextual Recommendation System

### When to Show Recommendations
| Context | Recommendation | Rationale |
|---------|---------------|-----------|
| After completing a focus session | Tab Suspender Pro | "Keep your browser fast while focusing" |
| After copying text from block page | Clipboard History | "Never lose what you copy" |
| Settings page visit | All recommendations | Natural discovery moment |
| 7 days after install | Most relevant | User is established, open to discovery |
| After upgrading to Pro | Other Zovo extensions | User trusts the brand, willing to invest |

### Smart Recommendation Logic
```javascript
/**
 * getRecommendation()
 * Returns a single Zovo extension recommendation or null.
 * Respects anti-spam rules: max 1/day, 15% chance per eligible trigger,
 * honors dismissals, and never fires during focus sessions.
 */
async function getRecommendation() {
  // 1. Check if currently in a focus session -- never interrupt
  const { focusSession } = await chrome.storage.local.get('focusSession');
  if (focusSession && focusSession.active) return null;

  // 2. Check install age -- no promotions in first 3 days
  const { installedAt } = await chrome.storage.local.get('installedAt');
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
  if (installedAt && Date.now() - installedAt < threeDaysMs) return null;

  // 3. Check daily rate limit -- max 1 recommendation per 24 hours
  const { lastRecommendation, dismissedExtensions = [], monthlyShownExtensions = [] } =
    await chrome.storage.local.get([
      'lastRecommendation',
      'dismissedExtensions',
      'monthlyShownExtensions'
    ]);

  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  if (lastRecommendation && lastRecommendation > dayAgo) return null;

  // 4. Probabilistic gate -- 15% chance per eligible trigger
  if (Math.random() > 0.15) return null;

  // 5. Check monthly cap -- no more than 3 unique extensions shown per month
  const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentUniqueShown = monthlyShownExtensions
    .filter(entry => entry.timestamp > monthAgo)
    .map(entry => entry.id);
  const uniqueThisMonth = [...new Set(recentUniqueShown)];

  // 6. Filter available extensions
  const relevanceOrder = { high: 3, medium: 2, low: 1 };
  const available = ZOVO_CATALOG
    .filter(ext => ext.id !== 'focus-mode-blocker')
    .filter(ext => !dismissedExtensions.includes(ext.id))
    .filter(ext => ext.relevanceToFocusMode !== 'low')
    .filter(ext => {
      // If already shown this month, allow. If not, check monthly cap.
      if (uniqueThisMonth.includes(ext.id)) return true;
      return uniqueThisMonth.length < 3;
    })
    .sort((a, b) => {
      // Sort by relevance (descending) then rating (descending)
      const relDiff = (relevanceOrder[b.relevanceToFocusMode] || 0)
                    - (relevanceOrder[a.relevanceToFocusMode] || 0);
      if (relDiff !== 0) return relDiff;
      return b.rating - a.rating;
    });

  if (available.length === 0) return null;

  const chosen = available[0];

  // 7. Update tracking state
  await chrome.storage.local.set({
    lastRecommendation: Date.now(),
    monthlyShownExtensions: [
      ...monthlyShownExtensions.filter(e => e.timestamp > monthAgo),
      { id: chosen.id, timestamp: Date.now() }
    ]
  });

  return chosen;
}
```

### Dismissal Handler
```javascript
/**
 * dismissExtensionRecommendation()
 * Permanently hides a specific extension from future recommendations.
 */
async function dismissExtensionRecommendation(extensionId) {
  const { dismissedExtensions = [] } = await chrome.storage.local.get('dismissedExtensions');
  if (!dismissedExtensions.includes(extensionId)) {
    dismissedExtensions.push(extensionId);
    await chrome.storage.local.set({ dismissedExtensions });
  }
}
```

### Recommendation UI Component
```javascript
/**
 * Renders a non-intrusive recommendation card.
 * Appears as a subtle banner at the bottom of popup or end-of-session view.
 */
function renderRecommendation(extension) {
  const card = document.createElement('div');
  card.className = 'zovo-recommendation';
  card.innerHTML = `
    <div class="zovo-recommendation__header">
      <span class="zovo-recommendation__label">From Zovo</span>
      <button class="zovo-recommendation__dismiss" data-ext-id="${extension.id}"
              aria-label="Dismiss recommendation">&times;</button>
    </div>
    <div class="zovo-recommendation__body">
      <img src="${extension.icon}" alt="" width="24" height="24"
           class="zovo-recommendation__icon">
      <div class="zovo-recommendation__info">
        <strong>${extension.name}</strong>
        <p>${extension.tagline}</p>
      </div>
    </div>
    <a href="${extension.storeUrl}?ref=focus-mode-blocker&source=recommendation"
       target="_blank" class="zovo-recommendation__cta">
      Try it free &rarr;
    </a>
  `;

  card.querySelector('.zovo-recommendation__dismiss').addEventListener('click', () => {
    dismissExtensionRecommendation(extension.id);
    card.remove();
  });

  return card;
}
```

### Recommendation Styles
```css
.zovo-recommendation {
  background: var(--surface-secondary, #f8f7ff);
  border: 1px solid var(--border-default, #e5e7eb);
  border-radius: 12px;
  padding: 12px;
  margin-top: 12px;
  animation: slideUp 0.3s ease-out;
}

.zovo-recommendation__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.zovo-recommendation__label {
  font-size: 11px;
  color: var(--text-tertiary, #9ca3af);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.zovo-recommendation__dismiss {
  background: none;
  border: none;
  color: var(--text-tertiary, #9ca3af);
  font-size: 18px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}

.zovo-recommendation__dismiss:hover {
  color: var(--text-primary, #111827);
}

.zovo-recommendation__body {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.zovo-recommendation__icon {
  border-radius: 6px;
  flex-shrink: 0;
}

.zovo-recommendation__info strong {
  display: block;
  font-size: 13px;
  color: var(--text-primary, #111827);
}

.zovo-recommendation__info p {
  font-size: 12px;
  color: var(--text-secondary, #6b7280);
  margin: 2px 0 0;
}

.zovo-recommendation__cta {
  display: block;
  text-align: center;
  background: var(--brand-primary, #6366f1);
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 8px;
  text-decoration: none;
  transition: background 0.15s ease;
}

.zovo-recommendation__cta:hover {
  background: var(--brand-primary-hover, #4f46e5);
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

## 4. Footer Branding

### Standard Footer
Every page (popup, options, block page, onboarding) includes:
```html
<footer class="zovo-footer">
  <a href="https://zovo.one?ref=focus-mode-blocker&source=footer" target="_blank"
     class="zovo-footer__brand">
    <img src="assets/zovo-logo.svg" alt="Zovo" width="16" height="16">
    <span>Part of <strong>Zovo</strong></span>
  </a>
  <span class="zovo-footer__privacy">Your data stays local</span>
</footer>
```

### Footer Styles
```css
.zovo-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-top: 1px solid var(--border-default, #e5e7eb);
  background: var(--surface-primary, #ffffff);
  font-size: 11px;
}

.zovo-footer__brand {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary, #6b7280);
  text-decoration: none;
  transition: color 0.15s ease;
}

.zovo-footer__brand:hover {
  color: var(--brand-primary, #6366f1);
}

.zovo-footer__brand img {
  border-radius: 3px;
}

.zovo-footer__brand strong {
  color: var(--brand-primary, #6366f1);
  font-weight: 600;
}

.zovo-footer__privacy {
  color: var(--text-tertiary, #9ca3af);
  font-size: 10px;
}
```

### Block Page Footer (Special)
Block page gets enhanced footer with GitHub link:
```html
<footer class="zovo-footer zovo-footer--block-page">
  <div class="zovo-footer__row">
    <a href="https://zovo.one?ref=focus-mode-blocker&source=block_page" target="_blank"
       class="zovo-footer__brand">
      <img src="assets/zovo-logo.svg" alt="Zovo" width="16" height="16">
      <span>Built by <strong>Zovo</strong></span>
    </a>
    <span class="zovo-footer__separator">|</span>
    <span class="zovo-footer__privacy">Your data stays on your device</span>
    <span class="zovo-footer__separator">|</span>
    <a href="https://github.com/theluckystrike/focus-mode-blocker" target="_blank"
       class="zovo-footer__link">GitHub</a>
  </div>
</footer>
```

### Block Page Footer Styles
```css
.zovo-footer--block-page {
  justify-content: center;
  padding: 16px;
  background: transparent;
  border-top: none;
}

.zovo-footer__row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.zovo-footer__separator {
  color: var(--border-default, #e5e7eb);
  font-size: 10px;
}

.zovo-footer__link {
  color: var(--text-tertiary, #9ca3af);
  text-decoration: none;
  font-size: 11px;
  transition: color 0.15s ease;
}

.zovo-footer__link:hover {
  color: var(--brand-primary, #6366f1);
}
```

## 5. Ref Tracking System

All external links include tracking params:
```
https://zovo.one?ref=focus-mode-blocker&source=[SOURCE]
```

| Source | Where | Purpose |
|--------|-------|---------|
| footer | All pages footer | Brand awareness |
| onboarding | Onboarding Slide 5 | New user conversion |
| settings | Settings "More from Zovo" | Discovery |
| recommendation | Contextual popup | Cross-sell |
| upgrade | Pro upgrade flow | Revenue |
| block_page | Block page footer | High-frequency touchpoint |
| review | Post-review "thank you" | Loyalty |

### Ref Link Builder Utility
```javascript
/**
 * buildZovoLink()
 * Builds a properly attributed Zovo link with ref tracking.
 */
function buildZovoLink(path = '', source = 'footer') {
  const base = 'https://zovo.one';
  const url = new URL(path, base);
  url.searchParams.set('ref', 'focus-mode-blocker');
  url.searchParams.set('source', source);
  return url.toString();
}

// Usage:
// buildZovoLink('', 'footer')         => https://zovo.one/?ref=focus-mode-blocker&source=footer
// buildZovoLink('/membership', 'upgrade') => https://zovo.one/membership?ref=focus-mode-blocker&source=upgrade
```

### Store Link Builder
```javascript
/**
 * buildStoreLink()
 * Builds a Chrome Web Store link for a Zovo extension with attribution.
 */
function buildStoreLink(extension, source = 'recommendation') {
  const url = new URL(extension.storeUrl);
  // CWS doesn't support custom params, so we track via local analytics
  trackEvent('cross_promo_click', {
    extensionId: extension.id,
    source: source,
    timestamp: Date.now()
  });
  return extension.storeUrl;
}
```

## 6. Anti-Spam Rules for Cross-Promotion

| Rule | Implementation |
|------|---------------|
| Max 1 recommendation per day | Check `lastRecommendation` timestamp |
| Never during focus session | Check `focusSession.active` before showing |
| Never in first 3 days | Check `installedAt` timestamp |
| Permanently dismissible per extension | Track `dismissedExtensions[]` array |
| No more than 3 unique extensions shown per month | Rolling count in `monthlyShownExtensions[]` |
| Settings page is always available | Not counted as "promotion" |
| Block page never shows recommendations | Focus context, not sales context |

### Anti-Spam Validation Function
```javascript
/**
 * canShowPromotion()
 * Central gate that validates ALL anti-spam rules before any promotion.
 * Returns { allowed: boolean, reason: string }
 */
async function canShowPromotion(context = 'popup') {
  // Rule: Block page never shows recommendations
  if (context === 'block_page') {
    return { allowed: false, reason: 'block_page_excluded' };
  }

  const data = await chrome.storage.local.get([
    'focusSession',
    'installedAt',
    'lastRecommendation',
    'monthlyShownExtensions'
  ]);

  // Rule: Never during focus session
  if (data.focusSession && data.focusSession.active) {
    return { allowed: false, reason: 'focus_session_active' };
  }

  // Rule: Never in first 3 days
  const threeDays = 3 * 24 * 60 * 60 * 1000;
  if (data.installedAt && Date.now() - data.installedAt < threeDays) {
    return { allowed: false, reason: 'too_early_after_install' };
  }

  // Rule: Max 1 recommendation per day
  const oneDay = 24 * 60 * 60 * 1000;
  if (data.lastRecommendation && Date.now() - data.lastRecommendation < oneDay) {
    return { allowed: false, reason: 'daily_limit_reached' };
  }

  // Rule: No more than 3 unique extensions shown per month
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const recentShown = (data.monthlyShownExtensions || [])
    .filter(e => e.timestamp > Date.now() - thirtyDays);
  const uniqueIds = [...new Set(recentShown.map(e => e.id))];
  if (uniqueIds.length >= 3) {
    return { allowed: false, reason: 'monthly_unique_limit_reached' };
  }

  return { allowed: true, reason: 'ok' };
}
```

## 7. "More from Zovo" Settings Panel Implementation

### HTML Template
```html
<section id="more-from-zovo" class="settings-section">
  <h2 class="settings-section__title">More from Zovo</h2>

  <!-- Membership Card -->
  <div class="zovo-membership-card">
    <div class="zovo-membership-card__badge">FOUNDING MEMBER</div>
    <h3 class="zovo-membership-card__title">Zovo Membership</h3>
    <p class="zovo-membership-card__desc">
      Get all Zovo extensions with one membership.
      Unlimited access, lifetime updates.
    </p>
    <div class="zovo-membership-card__pricing">
      <span class="zovo-membership-card__price">$99</span>
      <span class="zovo-membership-card__term">lifetime</span>
      <span class="zovo-membership-card__spots">50 founding spots left</span>
    </div>
    <a href="https://zovo.one/membership?ref=focus-mode-blocker&source=settings"
       target="_blank" class="btn btn--primary btn--sm">
      Learn More &rarr;
    </a>
  </div>

  <!-- Recommended Extensions -->
  <h3 class="settings-subsection__title">Recommended for you</h3>
  <div id="zovo-extension-list" class="zovo-extension-list">
    <!-- Dynamically populated by renderZovoCatalog() -->
  </div>

  <a href="https://zovo.one/extensions?ref=focus-mode-blocker&source=settings"
     target="_blank" class="zovo-see-all">
    See all Zovo extensions &rarr;
  </a>
</section>
```

### Render Function
```javascript
/**
 * renderZovoCatalog()
 * Populates the "More from Zovo" panel in settings with extension cards.
 * This is a settings page feature -- not subject to anti-spam rules.
 */
function renderZovoCatalog() {
  const container = document.getElementById('zovo-extension-list');
  if (!container) return;

  const displayExtensions = ZOVO_CATALOG
    .filter(ext => ext.id !== 'focus-mode-blocker')
    .filter(ext => ext.featured || ext.relevanceToFocusMode !== 'low')
    .sort((a, b) => {
      const order = { high: 3, medium: 2, low: 1 };
      return (order[b.relevanceToFocusMode] || 0) - (order[a.relevanceToFocusMode] || 0);
    });

  container.innerHTML = displayExtensions.map(ext => `
    <div class="zovo-ext-card">
      <img src="${ext.icon}" alt="" width="40" height="40"
           class="zovo-ext-card__icon" loading="lazy">
      <div class="zovo-ext-card__info">
        <strong class="zovo-ext-card__name">${ext.name}</strong>
        <p class="zovo-ext-card__tagline">${ext.tagline}</p>
        <div class="zovo-ext-card__meta">
          <span class="zovo-ext-card__rating">${renderStars(ext.rating)} ${ext.rating}</span>
          <span class="zovo-ext-card__users">${formatUsers(ext.users)}+ users</span>
        </div>
      </div>
      <a href="${ext.storeUrl}?ref=focus-mode-blocker&source=settings" target="_blank"
         class="btn btn--outline btn--xs">Install &rarr;</a>
    </div>
  `).join('');
}

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.3 ? 1 : 0;
  const empty = 5 - full - half;
  return '&#9733;'.repeat(full) + (half ? '&#9734;' : '') + '&#9734;'.repeat(empty);
}

function formatUsers(count) {
  if (count >= 1000) return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return count.toString();
}
```

### Settings Panel Styles
```css
.zovo-membership-card {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #ffffff;
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 20px;
}

.zovo-membership-card__badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.2);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 3px 8px;
  border-radius: 4px;
  margin-bottom: 10px;
}

.zovo-membership-card__title {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 6px;
}

.zovo-membership-card__desc {
  font-size: 13px;
  opacity: 0.9;
  margin: 0 0 12px;
  line-height: 1.4;
}

.zovo-membership-card__pricing {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 14px;
}

.zovo-membership-card__price {
  font-size: 28px;
  font-weight: 800;
}

.zovo-membership-card__term {
  font-size: 14px;
  opacity: 0.8;
}

.zovo-membership-card__spots {
  font-size: 11px;
  background: rgba(255, 255, 255, 0.15);
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: auto;
}

.zovo-ext-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--border-default, #e5e7eb);
  border-radius: 12px;
  margin-bottom: 8px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.zovo-ext-card:hover {
  border-color: var(--brand-primary, #6366f1);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
}

.zovo-ext-card__icon {
  border-radius: 10px;
  flex-shrink: 0;
}

.zovo-ext-card__info {
  flex: 1;
  min-width: 0;
}

.zovo-ext-card__name {
  font-size: 13px;
  color: var(--text-primary, #111827);
  display: block;
}

.zovo-ext-card__tagline {
  font-size: 12px;
  color: var(--text-secondary, #6b7280);
  margin: 2px 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.zovo-ext-card__meta {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: var(--text-tertiary, #9ca3af);
}

.zovo-ext-card__rating {
  color: #f59e0b;
}

.zovo-see-all {
  display: block;
  text-align: center;
  color: var(--brand-primary, #6366f1);
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  padding: 12px;
  margin-top: 8px;
  transition: opacity 0.15s ease;
}

.zovo-see-all:hover {
  opacity: 0.8;
}
```

## 8. Measurement

### Cross-Promotion Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Recommendation impression rate | 5-10% of sessions | Shown / Total sessions |
| Recommendation click rate | 5-15% of shown | Clicks / Impressions |
| Recommendation dismiss rate | <30% of shown | Dismissals / Impressions |
| Install attribution | Track installs from Focus Mode refs | CWS + ref tracking |
| Membership conversion from Focus Mode | 0.5-1% | Zovo.one ref tracking |
| Settings "More from Zovo" view rate | 15-25% of settings visits | Page view tracking |
| Settings extension click rate | 3-8% of panel views | Clicks / Panel views |

### Local Analytics Events
```javascript
// Cross-promotion events tracked locally (no external requests)
const CROSS_PROMO_EVENTS = {
  RECOMMENDATION_SHOWN:     'cross_promo_shown',
  RECOMMENDATION_CLICKED:   'cross_promo_clicked',
  RECOMMENDATION_DISMISSED: 'cross_promo_dismissed',
  SETTINGS_PANEL_VIEWED:    'cross_promo_settings_viewed',
  SETTINGS_EXT_CLICKED:     'cross_promo_settings_clicked',
  MEMBERSHIP_CLICKED:       'cross_promo_membership_clicked',
  FOOTER_CLICKED:           'cross_promo_footer_clicked'
};

/**
 * trackCrossPromoEvent()
 * Records cross-promotion events in the local analytics rolling window.
 * No data leaves the device.
 */
async function trackCrossPromoEvent(eventName, metadata = {}) {
  const { analyticsEvents = [] } = await chrome.storage.local.get('analyticsEvents');

  analyticsEvents.push({
    event: eventName,
    ...metadata,
    timestamp: Date.now()
  });

  // Keep rolling window of 500 events (shared with main analytics)
  const trimmed = analyticsEvents.slice(-500);
  await chrome.storage.local.set({ analyticsEvents: trimmed });
}
```

---

*Agent 5 -- Cross-Extension Promotion -- Complete*
