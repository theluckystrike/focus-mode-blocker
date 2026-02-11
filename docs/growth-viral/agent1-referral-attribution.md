# Referral System Architecture & Attribution -- Focus Mode - Blocker
## Phase 14, Section 1 -- Growth & Viral Engine

> **Date:** February 11, 2026 | **Status:** Complete
> **Input:** Phases 01-13
> **Extension:** Focus Mode - Blocker v1.0.0 (Manifest V3)
> **Publisher:** Zovo
> **Agent:** 1 of 5 (Referral System Architecture & Attribution)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [In-Extension Referral System](#3-in-extension-referral-system)
4. [Reward Structure](#4-reward-structure)
5. [Referral Link Generation](#5-referral-link-generation)
6. [Attribution & Tracking System](#6-attribution--tracking-system)
7. [Referral Qualification & Anti-Fraud](#7-referral-qualification--anti-fraud)
8. [Referral Dashboard UI](#8-referral-dashboard-ui)
9. [Service Worker Integration](#9-service-worker-integration)
10. [Implementation Code](#10-implementation-code)
11. [Storage Schema & Migration](#11-storage-schema--migration)
12. [Landing Page Attribution Capture](#12-landing-page-attribution-capture)
13. [Testing & Validation](#13-testing--validation)
14. [Privacy & Compliance](#14-privacy--compliance)
15. [Metrics & Success Criteria](#15-metrics--success-criteria)

---

## 1. Executive Summary

### Purpose

This document specifies the complete referral system for Focus Mode - Blocker, enabling users to invite friends and earn Pro time as a reward. The system is designed around three core constraints that define Focus Mode - Blocker's identity:

1. **Privacy-first:** Free-tier users have zero external network requests. The referral system must work with anonymous instance IDs -- no email collection required for free users.
2. **Offline-capable:** Referral codes are generated locally and work without an active internet connection. Attribution is captured opportunistically when connectivity is available.
3. **Chrome Web Store compatible:** CWS does not pass URL parameters through to installed extensions. The attribution chain must bridge the gap between a referral link click and the subsequent CWS install.

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Pro time as primary reward currency | Natural fit -- users want Pro features, Pro time has zero marginal cost, creates upgrade path |
| Anonymous instance ID (not email) | Privacy-first principle; free users never need to provide PII |
| Landing page as attribution bridge | CWS strips URL params; landing page stores ref code in cookie before redirecting to CWS |
| Last-touch attribution default | Simpler to implement, fairer for individual referrers, avoids multi-touch complexity |
| 30-day attribution window | Balances referrer credit with realistic install timelines |
| 7-day retention qualification | Ensures referrals are genuine users, not disposable installs |
| Local-first with server sync | Referral stats viewable offline; server validates and prevents fraud |

### Target Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Referral participation rate | 8-15% of active users share at least once | Share button clicks / DAU |
| Referral conversion rate | 15-25% of referred visitors install | Installs with attribution / Landing page visits with ref param |
| Referral qualification rate | 60-75% of referred installs become qualified | Qualified referrals / Total referred installs |
| K-factor contribution | 0.1-0.3 additional installs per user | Qualified referrals / Total active users |
| Pro time redeemed via referral | 5-10% of total Pro subscriptions originated from referral | Referral-originated Pro / Total Pro |
| Referral-to-paid conversion | 8-15% of users who receive referral Pro time convert to paid | Paid conversions from referral users / Total referral Pro recipients |

---

## 2. System Architecture Overview

### High-Level Architecture

```
+------------------------------------------------------------------+
|                    REFERRAL SYSTEM ARCHITECTURE                    |
+------------------------------------------------------------------+

  REFERRER (existing user)          REFERRED (new user)
  ========================          ====================

  +---------------------+          +---------------------+
  | Focus Mode Extension|          | Landing Page        |
  | (Installed)         |          | focusmodeblocker.com|
  |                     |          | /r/{code}           |
  | 1. Generate code    |          |                     |
  | 2. Share link       |          | 4. Capture ref code |
  | 3. Track stats      |          | 5. Store in cookie  |
  +--------+------------+          | 6. Redirect to CWS  |
           |                       +--------+------------+
           |                                |
           |   +-----------+                |
           +-->| Zovo      |                |
               | Backend   |<---------------+
               | (Supabase)|
               |           |     +---------------------+
               | 7. Store  |     | Chrome Web Store     |
               |    ref    |     | (No URL params)      |
               |    data   |     |                      |
               |           |     | 8. User installs     |
               | 9. Match  |     |    extension         |
               |    attribution  +--------+------------+
               | 10. Credit|              |
               |    rewards|     +--------v------------+
               +-----------+     | Focus Mode Extension|
                    ^            | (New Install)        |
                    |            |                      |
                    +------------+ 11. Check for        |
                                 |     attribution      |
                                 |     cookie           |
                                 | 12. Register as      |
                                 |     referred user    |
                                 | 13. Credit Pro days  |
                                 +---------------------+
```

### Component Inventory

```
EXTENSION SIDE (src/background/)
================================
referral-manager.js          -- Core referral logic (code gen, stats, rewards)
                                Integrates as 19th service worker module

EXTENSION SIDE (src/popup/)
================================
components/referral-panel.js -- "Invite Friends" tab in popup
                                Share buttons, stats display, tier progress

EXTENSION SIDE (src/options/)
================================
sections/referral-section.js -- Full referral dashboard in options page
                                History, leaderboard, detailed stats

LANDING PAGE (focusmodeblocker.com)
====================================
/r/{code}                    -- Referral landing page
attribution.js               -- Captures ref param, stores cookie, redirects
                                Communicates with extension via externally_connectable

BACKEND (Zovo Supabase)
========================
referral-register             -- Edge function: register referral code
referral-attribute            -- Edge function: attribute install to referrer
referral-qualify              -- Edge function: qualify referral after retention
referral-stats                -- Edge function: get referral stats for user

DATABASE
========
referrals table               -- Referral relationships (referrer -> referred)
referral_codes table          -- Code registry with owner instance IDs
referral_rewards table        -- Reward ledger (Pro days credited)
referral_events table         -- Event log for analytics
```

### Data Flow Diagram

```
REFERRER JOURNEY
================

Step 1: User opens "Invite Friends" tab
  popup.js --> message: GET_REFERRAL_CODE --> service-worker.js
  service-worker.js --> referral-manager.js --> generates code from instance ID
  referral-manager.js --> chrome.storage.local (cache code)
  referral-manager.js --> Zovo backend: POST /referral-register (register code)
  service-worker.js --> popup.js: { code: "FM-A7X9K2", link: "https://..." }

Step 2: User shares referral link
  popup.js --> navigator.clipboard.writeText() OR window.open() for social
  popup.js --> message: TRACK_REFERRAL_SHARE --> service-worker.js
  referral-manager.js --> chrome.storage.local (increment share count)
  referral-manager.js --> Zovo backend: POST /collect-analytics (share event)

Step 3: Referrer checks stats
  popup.js --> message: GET_REFERRAL_STATS --> service-worker.js
  referral-manager.js --> chrome.storage.local (read cached stats)
  referral-manager.js --> Zovo backend: GET /referral-stats (fresh data, if online)
  service-worker.js --> popup.js: { total: 12, qualified: 8, proDays: 56, tier: "silver" }


REFERRED USER JOURNEY
=====================

Step 4: Referred user clicks link
  Browser --> focusmodeblocker.com/r/FM-A7X9K2
  attribution.js --> extract ref code from URL path
  attribution.js --> document.cookie = "fm_ref=FM-A7X9K2; max-age=2592000; path=/"
  attribution.js --> localStorage.setItem("fm_ref", "FM-A7X9K2")
  attribution.js --> Zovo backend: POST /referral-click (log click event)
  attribution.js --> redirect to CWS listing (after 3-second landing page)

Step 5: User installs from CWS
  Chrome Web Store --> installs Focus Mode - Blocker
  service-worker.js --> chrome.runtime.onInstalled (reason: "install")
  onboarding-manager.js --> opens onboarding page

Step 6: Extension checks for attribution
  onboarding page loads --> checks for fm_ref cookie on focusmodeblocker.com
  Method A: externally_connectable message from landing page (if still open)
  Method B: fetch("https://focusmodeblocker.com/api/check-ref") with credentials
  Method C: User manually enters referral code on onboarding slide 5
  referral-manager.js --> captures attribution code
  referral-manager.js --> Zovo backend: POST /referral-attribute
    { referral_code: "FM-A7X9K2", referred_instance_id: "inst_xxx", timestamp: ... }

Step 7: Immediate rewards applied
  Zovo backend --> validates referral, creates referral record
  Zovo backend --> returns reward: { referrer_days: 7, referred_days: 3 }
  referral-manager.js --> applies Pro days to referred user
  referral-manager.js --> notifies referrer (via next stats sync)

Step 8: Qualification (7 days later)
  service-worker.js --> chrome.alarms: "referral-qualify-check" fires daily
  referral-manager.js --> checks if referred user meets criteria:
    - Completed at least 3 focus sessions
    - Active on at least 3 different days
    - Installed for 7+ days
  referral-manager.js --> Zovo backend: POST /referral-qualify
  Zovo backend --> upgrades referral status: pending -> qualified
  Zovo backend --> credits milestone bonuses if applicable
```

### Integration with Existing Architecture

The referral system integrates with the existing 18 service worker modules as the 19th module:

```
src/background/service-worker.js (updated import order)
=======================================================

// ... existing Phase 0-7 imports (unchanged) ...

// -- Phase 8: Licensing & Monetization (existing) --
import { licenseManager } from './license-manager.js';
import { analyticsManager } from './analytics-manager.js';
startupTiming.mark('licensing_loaded');

// -- Phase 9: Referral System (NEW -- Phase 14 addition) --
import { referralManager } from './referral-manager.js';
startupTiming.mark('referral_loaded');

// ... existing Phase 10 initialization ...
```

The module depends on:
- `storageManager` -- for persisting referral data locally
- `licenseManager` -- for applying Pro time rewards
- `analyticsManager` -- for tracking referral events
- `messageRouter` -- for handling referral-related messages from popup/options

---

## 3. In-Extension Referral System

### 3.1 Referral Flow Overview

The referral flow has been designed specifically for the Chrome extension context, where several unique constraints apply:

1. **No app store deep linking:** Chrome Web Store does not support passing URL parameters through to installed extensions.
2. **No guaranteed user identity:** Free-tier users have no email or account -- only an anonymous instance ID.
3. **Privacy-first data model:** Free-tier users make zero external requests by default.
4. **Service worker lifecycle:** The referral module must survive service worker termination and restart.

```
COMPLETE REFERRAL FLOW (Happy Path)
====================================

  REFERRER                    LANDING PAGE              CWS              NEW USER
  ========                    ============              ===              ========
     |                             |                     |                  |
     | 1. Click "Invite Friends"   |                     |                  |
     |                             |                     |                  |
     | 2. Code generated:          |                     |                  |
     |    FM-A7X9K2                |                     |                  |
     |                             |                     |                  |
     | 3. Share link via           |                     |                  |
     |    Twitter/email/copy       |                     |                  |
     |                             |                     |                  |
     |    - - - - - - - - - - - - >|                     |                  |
     |    Link clicked by friend   |                     |                  |
     |                             |                     |                  |
     |                             | 4. Landing page     |                  |
     |                             |    captures ref     |                  |
     |                             |    code in cookie   |                  |
     |                             |                     |                  |
     |                             | 5. Shows "Your      |                  |
     |                             |    friend uses      |                  |
     |                             |    Focus Mode"      |                  |
     |                             |    + 3-day Pro      |                  |
     |                             |    offer            |                  |
     |                             |                     |                  |
     |                             | 6. Redirect ------->|                  |
     |                             |    to CWS listing   |                  |
     |                             |                     |                  |
     |                             |                     | 7. User clicks   |
     |                             |                     |    "Add to       |
     |                             |                     |    Chrome"       |
     |                             |                     |                  |
     |                             |                     |    - - - - - - ->|
     |                             |                     |                  |
     |                             |                     |          8. Extension
     |                             |                     |             installed
     |                             |                     |                  |
     |                             |                     |          9. Onboarding
     |                             |                     |             opens
     |                             |                     |                  |
     |                             |                     |         10. Attribution
     |                             |                     |             check runs:
     |                             |                     |             - cookie?
     |                             |                     |             - external msg?
     |                             |                     |             - manual entry?
     |                             |                     |                  |
     |                             |                     |         11. Ref code
     |                             |                     |             found:
     |                             |                     |             FM-A7X9K2
     |                             |                     |                  |
     |                             |                     |         12. +3 days Pro
     |                             |                     |             applied
     |                             |                     |             immediately
     |                             |                     |                  |
     | 13. Stats update:           |                     |                  |
     |     +1 referral             |                     |                  |
     |     +7 days Pro             |                     |                  |
     |     (on next sync)          |                     |                  |
     |                             |                     |                  |
     |            --- 7 days pass, referred user is active ---              |
     |                             |                     |                  |
     | 14. Referral qualified      |                     |         15. Qualification
     |     Milestone check:        |                     |             criteria met:
     |     total=5 -> Silver!      |                     |             3+ sessions,
     |     +badge unlocked         |                     |             3+ active days
     |                             |                     |                  |
```

### 3.2 Referral Code Generation

Referral codes are deterministically derived from the user's anonymous instance ID, ensuring:
- The same user always gets the same code (no duplicate codes per user)
- Codes are short and human-readable (6 alphanumeric characters)
- Codes are prefixed with "FM-" for Focus Mode brand recognition
- No PII is embedded in or derivable from the code

```
CODE FORMAT:  FM-{6 alphanumeric characters}
EXAMPLES:     FM-A7X9K2, FM-B3M8P1, FM-Z2N5Q7
CHARACTER SET: A-Z (uppercase) + 0-9 (no ambiguous chars: 0/O, 1/I/L removed)
TOTAL SPACE:  30^6 = 729,000,000 unique codes (sufficient for any scale)
```

#### Code Generation Algorithm

```javascript
/**
 * Generate a deterministic referral code from an instance ID.
 *
 * The code is derived by hashing the instance ID with a salt,
 * then encoding the first 6 bytes using a custom alphabet
 * that excludes ambiguous characters (0, O, 1, I, L).
 *
 * @param {string} instanceId - The anonymous instance ID (UUID v4)
 * @returns {string} Referral code in format "FM-XXXXXX"
 */
function generateReferralCode(instanceId) {
  // Safe alphabet: A-Z + 2-9, minus ambiguous chars O, I, L
  // Total: 23 letters + 8 digits = 31 characters
  // Using 30 to keep math clean (drop Q as least common)
  const ALPHABET = 'ABCDEFGHJKMNPRSTUVWXYZ23456789';
  const SALT = 'focusmode-referral-v1';

  // Create a numeric hash from instanceId + salt
  const input = `${SALT}:${instanceId}`;
  let hash = 0;

  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0; // Simple hash
    hash = Math.abs(hash);
  }

  // Also incorporate more bits using a second pass
  let hash2 = 1;
  for (let i = 0; i < input.length; i++) {
    hash2 = (hash2 * 31 + input.charCodeAt(i)) | 0;
    hash2 = Math.abs(hash2);
  }

  // Combine both hashes for 6 characters
  const combined = hash * 1000000 + hash2;
  let code = '';

  let remaining = Math.abs(combined);
  for (let i = 0; i < 6; i++) {
    code += ALPHABET[remaining % ALPHABET.length];
    remaining = Math.floor(remaining / ALPHABET.length);
  }

  return `FM-${code}`;
}
```

#### Server-Side Collision Resolution

While the 729M code space makes collisions extremely unlikely, the backend handles them:

```sql
-- When registering a new referral code
-- If collision detected, append a digit suffix: FM-A7X9K2 -> FM-A7X9K21
INSERT INTO referral_codes (code, instance_id, created_at)
VALUES ($1, $2, NOW())
ON CONFLICT (code) DO NOTHING
RETURNING code;

-- If insert fails (collision), try with suffix
-- FM-A7X9K2 -> FM-A7X9K21 -> FM-A7X9K22 -> ...
```

### 3.3 Instance ID and Privacy Model

Focus Mode - Blocker uses an anonymous instance ID for all referral operations. This ID:
- Is generated on first install as a UUID v4
- Is stored in `chrome.storage.local` under `settings.sync_device_id`
- Contains zero PII -- it cannot be traced back to a real identity
- Is the same ID already used for anonymous analytics (Phase 11)

```
PRIVACY MODEL FOR REFERRALS
============================

FREE TIER USER (no account, no email):
  Identity:        Anonymous instance ID (UUID v4)
  Referral code:   Derived from instance ID
  Reward tracking: Local storage only (chrome.storage.local)
  Server calls:    ONLY when user explicitly shares (opt-in action)
                   register code, log share, attribute install
  PII collected:   NONE

PRO TIER USER (has Zovo account):
  Identity:        Anonymous instance ID + Zovo license key
  Referral code:   Same as free tier (derived from instance ID)
  Reward tracking: Local storage + server sync
  Server calls:    Same as free tier + periodic stats sync
  PII collected:   Email (already collected for Pro purchase)
                   Referral rewards linked to license for billing

DATA NEVER COLLECTED:
  - Browsing history
  - Blocked site lists
  - Focus session content
  - IP addresses (beyond standard HTTPS)
  - Device fingerprints
  - Social graph (who referred whom is stored by code, not identity)
```

### 3.4 Chrome Web Store Attribution Gap

The single biggest technical challenge for Chrome extension referrals is the **CWS attribution gap**: when a user clicks a referral link and installs from the Chrome Web Store, the CWS does not pass any URL parameters through to the installed extension. The extension has no way to know, on its own, that the user arrived via a referral.

Focus Mode - Blocker bridges this gap with a three-layer attribution strategy:

```
ATTRIBUTION STRATEGY LAYERS
============================

Layer 1: Landing Page Cookie (Primary -- ~70% attribution rate)
---------------------------------------------------------------
  1. User clicks referral link: focusmodeblocker.com/r/FM-A7X9K2
  2. Landing page sets cookie: fm_ref=FM-A7X9K2 (30-day expiry)
  3. Landing page also sets: localStorage fm_ref=FM-A7X9K2
  4. Landing page redirects to Chrome Web Store
  5. User installs extension from CWS
  6. On first run, extension fetches attribution from landing page API:
     GET https://focusmodeblocker.com/api/check-ref
     (Sends cookie automatically if same-origin, or uses a fingerprint-free
      session token stored in the landing page that the extension can query)

  WHY ~70%: Some users clear cookies, use incognito, or install days later.

Layer 2: externally_connectable Messaging (Secondary -- ~15% attribution rate)
--------------------------------------------------------------------------------
  1. If the landing page tab is still open when the extension installs,
     the landing page can send a message directly to the extension.
  2. manifest.json declares:
     "externally_connectable": {
       "matches": ["https://focusmodeblocker.com/*"]
     }
  3. Landing page sends:
     chrome.runtime.sendMessage(EXTENSION_ID, { type: 'REFERRAL_ATTRIBUTION', code: 'FM-A7X9K2' })
  4. Extension receives in service worker via chrome.runtime.onMessageExternal

  WHY ~15%: Only works if landing page tab is still open at install time.
  Combined with Layer 1, this covers the case where cookie failed but tab is open.

Layer 3: Manual Code Entry (Fallback -- ~10% attribution rate)
----------------------------------------------------------------
  1. Onboarding slide 5 (or post-onboarding prompt) shows:
     "Were you referred by a friend? Enter their code:"
     [FM-______] [Apply]
  2. User types the code they received
  3. Extension validates and applies attribution

  WHY ~10%: Friction of manual entry means only motivated users do this.
  But it catches cases where both cookie and messaging fail.

COMBINED ATTRIBUTION RATE: ~85-95% of referred installs are captured.
```

#### Layer 1 Implementation: Landing Page Cookie

```
LANDING PAGE FLOW (focusmodeblocker.com/r/{code})
=================================================

URL: https://focusmodeblocker.com/r/FM-A7X9K2

+----------------------------------------------------------+
|  [Focus Mode Logo]                                        |
|                                                           |
|  Your friend uses Focus Mode - Blocker                    |
|  to stay focused and productive.                          |
|                                                           |
|  +----------------------------------------------------+  |
|  |  WHAT YOU GET:                                      |  |
|  |                                                     |  |
|  |  [Shield Icon] Block distracting websites           |  |
|  |  [Timer Icon]  Built-in Pomodoro timer              |  |
|  |  [Chart Icon]  Track your Focus Score               |  |
|  |  [Star Icon]   +3 days of Pro features FREE         |  |
|  |                (from your friend's referral)         |  |
|  +----------------------------------------------------+  |
|                                                           |
|  [====== Add to Chrome (Free) ======]                     |
|                                                           |
|  Already installed? Enter code: FM-A7X9K2 [Copy]          |
|                                                           |
|  4.8 stars | 10,000+ users | Privacy-first                |
+----------------------------------------------------------+

BEHIND THE SCENES:
  1. Page loads -> extract code from URL path
  2. Set cookie:
     document.cookie = "fm_ref=FM-A7X9K2; max-age=2592000; path=/;
                         SameSite=Lax; Secure"
  3. Set localStorage backup:
     localStorage.setItem('fm_ref', JSON.stringify({
       code: 'FM-A7X9K2',
       timestamp: Date.now(),
       source: 'landing_page'
     }))
  4. Log click event to backend:
     POST /referral-click { code: 'FM-A7X9K2', source: 'direct' }
  5. "Add to Chrome" button links to:
     https://chromewebstore.google.com/detail/focus-mode-blocker/{EXTENSION_ID}
```

#### Layer 2 Implementation: externally_connectable

```json
// manifest.json addition
{
  "externally_connectable": {
    "matches": [
      "https://focusmodeblocker.com/*",
      "https://www.focusmodeblocker.com/*"
    ]
  }
}
```

```javascript
// Landing page script (attribution.js on focusmodeblocker.com)
// Attempts to message the extension after install

const FOCUS_MODE_EXTENSION_ID = 'abcdefghijklmnopqrstuvwxyz123456'; // Actual CWS ID

function attemptExtensionMessage(refCode) {
  // Try to send message to extension
  // This only works if:
  //   1. The extension is installed
  //   2. The manifest declares externally_connectable for this domain
  //   3. This tab is still open

  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
    try {
      chrome.runtime.sendMessage(
        FOCUS_MODE_EXTENSION_ID,
        {
          type: 'REFERRAL_ATTRIBUTION',
          code: refCode,
          timestamp: Date.now(),
          source: 'external_message'
        },
        (response) => {
          if (chrome.runtime.lastError) {
            // Extension not installed yet -- this is expected
            // Will retry via polling
            console.log('Extension not yet installed, will retry...');
            return;
          }
          if (response && response.success) {
            // Attribution captured!
            showSuccessMessage('Your referral bonus has been applied!');
          }
        }
      );
    } catch (e) {
      // Extension not available
    }
  }
}

// Poll every 5 seconds for 10 minutes after CWS redirect
// In case user installs and this tab is still open
let pollCount = 0;
const MAX_POLLS = 120; // 10 minutes at 5-second intervals

function startExtensionPoll(refCode) {
  const pollInterval = setInterval(() => {
    pollCount++;
    if (pollCount >= MAX_POLLS) {
      clearInterval(pollInterval);
      return;
    }
    attemptExtensionMessage(refCode);
  }, 5000);
}
```

#### Layer 3 Implementation: Manual Code Entry

```
ONBOARDING SLIDE 5 (or Post-Onboarding Prompt)
================================================

Existing onboarding flow (Phase 08, Agent 3) has 5 slides:
  Slide 1: Welcome + trust badges
  Slide 2: Quick setup (block first sites)
  Slide 3: Focus style selection
  Slide 4: Focus Score introduction
  Slide 5: Start first session CTA

OPTION A: Add referral input to Slide 5 (recommended)
------------------------------------------------------
  +--------------------------------------------------+
  |  [Slide 5 of 5]                                   |
  |                                                    |
  |  Ready to Focus!                                   |
  |                                                    |
  |  [======= Start Your First Session =======]        |
  |                                                    |
  |  - - - - - - - - - - - - - - - - - - - - -        |
  |                                                    |
  |  Referred by a friend?                             |
  |  [FM-______] [Apply]                               |
  |                                                    |
  |  Enter their referral code to unlock               |
  |  3 free days of Pro features.                      |
  +--------------------------------------------------+

OPTION B: Post-onboarding popup (first popup open after onboarding)
--------------------------------------------------------------------
  If no attribution was captured during install:
  Show a subtle banner at the top of the popup:

  +--------------------------------------------------+
  |  [i] Referred by a friend? [Enter Code] [Dismiss] |
  +--------------------------------------------------+
  |                                                    |
  |  [Normal popup content below]                      |

  Banner shown max 3 times, then auto-dismissed.
```

### 3.5 Referral Capture During Onboarding

The onboarding flow (Phase 08, Agent 3) is updated to include attribution capture as a non-blocking step:

```javascript
// src/onboarding/onboarding.js (updated)

class OnboardingFlow {
  constructor() {
    this.slides = [
      'welcome',
      'quick-setup',
      'focus-style',
      'focus-score',
      'first-session' // Slide 5 -- now includes referral input
    ];
    this.currentSlide = 0;
    this.attributionCaptured = false;
  }

  async init() {
    // Check for automatic attribution (Layer 1 or 2) before showing slides
    await this.checkAutomaticAttribution();

    // Render slides
    this.render();
  }

  async checkAutomaticAttribution() {
    try {
      // Ask service worker if attribution was already captured
      // (from externally_connectable message received during install)
      const response = await chrome.runtime.sendMessage({
        type: 'CHECK_REFERRAL_ATTRIBUTION'
      });

      if (response && response.attributed) {
        this.attributionCaptured = true;
        this.referralCode = response.code;
        this.referralReward = response.reward; // e.g., { days: 3 }
        return;
      }

      // Try cookie-based attribution via landing page API
      const apiResponse = await fetch(
        'https://focusmodeblocker.com/api/check-ref',
        { credentials: 'include' } // Send cookies
      ).catch(() => null);

      if (apiResponse && apiResponse.ok) {
        const data = await apiResponse.json();
        if (data.code) {
          // Found attribution cookie!
          await chrome.runtime.sendMessage({
            type: 'APPLY_REFERRAL_ATTRIBUTION',
            code: data.code,
            source: 'cookie'
          });
          this.attributionCaptured = true;
          this.referralCode = data.code;
          this.referralReward = data.reward;
        }
      }
    } catch (e) {
      // Attribution check failed -- not critical, user can enter manually
      console.warn('Attribution check failed:', e.message);
    }
  }

  renderSlide5() {
    const container = document.getElementById('onboarding-content');

    let referralSection = '';
    if (this.attributionCaptured) {
      // Show success message -- attribution already captured
      referralSection = `
        <div class="referral-success">
          <div class="referral-success-icon">&#10003;</div>
          <p>Your friend's referral code <strong>${this.referralCode}</strong> has been applied!</p>
          <p class="referral-reward">+${this.referralReward.days} days of Pro features unlocked</p>
        </div>
      `;
    } else {
      // Show manual entry field
      referralSection = `
        <div class="referral-entry">
          <p class="referral-prompt">Referred by a friend?</p>
          <div class="referral-input-group">
            <span class="referral-prefix">FM-</span>
            <input
              type="text"
              id="referral-code-input"
              class="referral-input"
              placeholder="Enter code"
              maxlength="6"
              pattern="[A-Z0-9]{6}"
              autocomplete="off"
              spellcheck="false"
            />
            <button id="referral-apply-btn" class="btn btn-secondary btn-sm">
              Apply
            </button>
          </div>
          <p class="referral-hint">Enter their referral code for 3 free days of Pro</p>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="slide slide-5">
        <h2>Ready to Focus!</h2>
        <p>Your blocklist is set up. Start your first focus session now.</p>

        <button id="start-first-session" class="btn btn-primary btn-lg">
          Start Your First Session
        </button>

        <div class="referral-divider">
          <span>or</span>
        </div>

        ${referralSection}
      </div>
    `;

    // Bind events
    if (!this.attributionCaptured) {
      document.getElementById('referral-apply-btn')
        .addEventListener('click', () => this.handleManualReferral());

      document.getElementById('referral-code-input')
        .addEventListener('input', (e) => {
          // Auto-uppercase and filter to valid characters
          e.target.value = e.target.value
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .slice(0, 6);
        });
    }
  }

  async handleManualReferral() {
    const input = document.getElementById('referral-code-input');
    const code = `FM-${input.value.trim()}`;
    const btn = document.getElementById('referral-apply-btn');

    if (input.value.trim().length !== 6) {
      this.showError('Please enter a 6-character code');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Checking...';

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'APPLY_REFERRAL_ATTRIBUTION',
        code: code,
        source: 'manual_entry'
      });

      if (response.success) {
        this.attributionCaptured = true;
        this.referralCode = code;
        this.referralReward = response.reward;
        this.renderSlide5(); // Re-render with success state
      } else {
        this.showError(response.error || 'Invalid referral code');
        btn.disabled = false;
        btn.textContent = 'Apply';
      }
    } catch (e) {
      this.showError('Could not verify code. Please try again.');
      btn.disabled = false;
      btn.textContent = 'Apply';
    }
  }

  showError(message) {
    const existing = document.querySelector('.referral-error');
    if (existing) existing.remove();

    const error = document.createElement('p');
    error.className = 'referral-error';
    error.textContent = message;

    const inputGroup = document.querySelector('.referral-input-group');
    inputGroup.parentNode.insertBefore(error, inputGroup.nextSibling);

    setTimeout(() => error.remove(), 5000);
  }
}
```

### 3.6 Referral CSS for Onboarding

```css
/* src/onboarding/onboarding.css (additions for referral section) */

.referral-divider {
  display: flex;
  align-items: center;
  margin: 24px 0 16px;
  gap: 12px;
}

.referral-divider::before,
.referral-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border, #e2e8f0);
}

.referral-divider span {
  font-size: 13px;
  color: var(--color-text-secondary, #64748b);
  text-transform: lowercase;
}

.referral-entry {
  text-align: center;
}

.referral-prompt {
  font-size: 14px;
  color: var(--color-text-secondary, #64748b);
  margin-bottom: 8px;
}

.referral-input-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.referral-prefix {
  font-family: 'JetBrains Mono', monospace;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-primary, #6366f1);
  padding: 8px 4px 8px 12px;
  background: var(--color-surface, #f8fafc);
  border: 1px solid var(--color-border, #e2e8f0);
  border-right: none;
  border-radius: 8px 0 0 8px;
  line-height: 1;
}

.referral-input {
  font-family: 'JetBrains Mono', monospace;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 2px;
  width: 100px;
  padding: 8px 8px;
  border: 1px solid var(--color-border, #e2e8f0);
  border-left: none;
  border-right: none;
  border-radius: 0;
  outline: none;
  text-transform: uppercase;
  background: var(--color-surface, #f8fafc);
}

.referral-input:focus {
  border-color: var(--color-primary, #6366f1);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
}

.referral-input-group .btn-sm {
  border-radius: 0 8px 8px 0;
  padding: 8px 16px;
  font-size: 14px;
  height: auto;
}

.referral-hint {
  font-size: 12px;
  color: var(--color-text-tertiary, #94a3b8);
  margin-top: 6px;
}

.referral-error {
  font-size: 12px;
  color: var(--color-error, #ef4444);
  margin-top: 6px;
  animation: fadeIn 200ms ease;
}

.referral-success {
  background: var(--color-success-bg, #f0fdf4);
  border: 1px solid var(--color-success-border, #bbf7d0);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}

.referral-success-icon {
  font-size: 24px;
  color: var(--color-success, #22c55e);
  margin-bottom: 4px;
}

.referral-success p {
  margin: 0;
  font-size: 14px;
  color: var(--color-text, #1e293b);
}

.referral-reward {
  font-weight: 600;
  color: var(--color-primary, #6366f1) !important;
  margin-top: 4px !important;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## 4. Reward Structure

### 4.1 Tiered Reward System

The reward structure uses **Pro time** as the primary currency. Pro time has zero marginal cost to the publisher while providing genuine value to users. The tiered system incentivizes ongoing referral activity.

```
REWARD TIERS
=============

STARTER TIER (0-4 qualified referrals)
---------------------------------------
  Referrer reward:  +7 days Pro per qualified referral
  Referred reward:  +3 days Pro (applied on install)
  Badge:            None
  Extras:           None

  Example: User refers 3 friends -> earns 21 days Pro
  Cost to publisher: $0 (Pro time is free to give)
  Value to user: ~$5 worth of Pro features

SILVER TIER (5-19 qualified referrals)
--------------------------------------
  Referrer reward:  +7 days Pro per qualified referral
  Referred reward:  +5 days Pro (applied on install)
  Badge:            "Silver Referrer" badge on Focus Score display
  Extras:           Exclusive "Silver Focus" ambient sound unlocked

  Upgrade notification:
  "You've reached Silver tier! Your friends now get 5 days of Pro
   instead of 3. You've also unlocked the exclusive Silver Focus
   ambient sound."

GOLD TIER (20-49 qualified referrals)
-------------------------------------
  Referrer reward:  +10 days Pro per qualified referral
  Referred reward:  +7 days Pro (applied on install)
  Badge:            "Gold Referrer" badge on Focus Score display
  Extras:           Priority support, exclusive "Gold Focus" theme
                    All Silver rewards included

  Upgrade notification:
  "Gold tier achieved! You now earn 10 days of Pro per referral,
   and your friends get a full week. Gold Focus theme unlocked."

PLATINUM TIER (50+ qualified referrals)
---------------------------------------
  Referrer reward:  +14 days Pro per qualified referral
  Referred reward:  +7 days Pro (applied on install)
  Badge:            "Platinum Referrer" badge on Focus Score display
  Extras:           Lifetime Pro consideration (manual review at 100+),
                    all exclusive sounds + themes, beta features access,
                    all Gold/Silver rewards included

  Upgrade notification:
  "Platinum! You're in the top 0.1% of Focus Mode advocates.
   14 Pro days per referral. Lifetime Pro under consideration."
```

#### Tier Progression Visualization

```
TIER PROGRESS BAR (shown in referral dashboard)
=================================================

  STARTER          SILVER           GOLD            PLATINUM
  [0--------4]     [5--------19]    [20-------49]   [50+-------]
  ████████░░       ░░░░░░░░░░       ░░░░░░░░░░      ░░░░░░░░░░
  3/5 to Silver

  Current: 3 qualified referrals (Starter)
  Next tier: Silver (need 2 more)
  ━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░ 60% to Silver

  +------------------------------------------------------+
  |  STARTER    |     SILVER     |    GOLD    | PLATINUM  |
  |  +7d/ref    |     +7d/ref   |  +10d/ref  |  +14d/ref |
  |  (current)  |     +badge    |  +theme    |  +lifetime|
  +------------------------------------------------------+
```

### 4.2 Milestone Bonuses

On top of per-referral rewards, milestone bonuses give big payoffs at key thresholds:

```
MILESTONE BONUSES
==================

  10 qualified referrals  ->  +1 month Pro (30 days) bonus
  25 qualified referrals  ->  +3 months Pro (90 days) bonus
  50 qualified referrals  ->  +6 months Pro (180 days) bonus
  100 qualified referrals ->  Lifetime Pro granted (manual review + approval)

  IMPORTANT: Milestone bonuses are ADDITIONAL to per-referral rewards.

  Example calculation for reaching 25 qualified referrals:
  --------------------------------------------------------
  Referrals 1-4 (Starter):    4 x 7 days  = 28 days
  Referrals 5-19 (Silver):   15 x 7 days  = 105 days
  Referrals 20-25 (Gold):     6 x 10 days = 60 days
  Milestone bonus (10):       30 days
  Milestone bonus (25):       90 days
  ────────────────────────────────────────────────
  TOTAL:                      313 days of Pro (~10.4 months)

  This user has earned nearly a year of Pro from referrals alone.
  At $4.99/mo, that is ~$52 in value -- but costs the publisher $0
  since the user is actively promoting the product.
```

### 4.3 Milestone Celebration UI

```
MILESTONE NOTIFICATION (shown as modal overlay)
=================================================

+----------------------------------------------------------+
|                                                            |
|                    [Party Emoji/Confetti]                   |
|                                                            |
|              MILESTONE REACHED!                            |
|                                                            |
|         10 Friends Joined Focus Mode                       |
|                                                            |
|   +--------------------------------------------------+    |
|   |                                                    |   |
|   |   BONUS: +1 Month of Pro Features                 |   |
|   |                                                    |   |
|   |   That is 30 extra days of unlimited sites,        |   |
|   |   custom timers, full analytics, and more.         |   |
|   |                                                    |   |
|   +--------------------------------------------------+    |
|                                                            |
|   Your referral stats:                                     |
|   Total referred: 12 | Qualified: 10 | Pro days: 100      |
|                                                            |
|   [===== Keep Sharing to Reach 25! =====]                  |
|   [           Dismiss            ]                         |
|                                                            |
+----------------------------------------------------------+
```

### 4.4 Reward Integration with Pro/License System

Referral rewards (Pro days) integrate with the existing Zovo license system (Phase 09):

```
REWARD APPLICATION FLOW
========================

Referral reward earned (e.g., +7 days Pro)
  |
  v
referral-manager.js: applyReward(days)
  |
  +--> Check current license status via licenseManager
  |
  +--> CASE 1: User has NO Pro license
  |    |
  |    +--> Create a "referral_pro" temporary license
  |    |    Stored in chrome.storage.local under license.referral_pro
  |    |    {
  |    |      type: "referral_pro",
  |    |      expires_at: "2026-03-03T...", // now + 7 days
  |    |      features: [...all Pro features...],
  |    |      source: "referral",
  |    |      days_remaining: 7
  |    |    }
  |    |
  |    +--> feature-gate.js recognizes referral_pro as valid Pro license
  |    +--> All Pro features unlocked until expiry
  |    +--> Popup shows: "Pro (Referral) - 7 days remaining"
  |
  +--> CASE 2: User has ACTIVE referral_pro license
  |    |
  |    +--> Extend expiry: expires_at += 7 days
  |    +--> days_remaining += 7
  |    +--> Popup shows: "Pro (Referral) - 14 days remaining"
  |
  +--> CASE 3: User has ACTIVE paid Pro subscription
  |    |
  |    +--> Pro days are banked as credit
  |    |    Stored in: license.referral_credit_days
  |    |    If subscription lapses, credit days activate automatically
  |    +--> Popup shows: "Pro | 7 referral days banked"
  |
  +--> CASE 4: User has EXPIRED Pro subscription
       |
       +--> Apply referral days starting from now
       +--> Same as CASE 1
       +--> Popup shows: "Pro (Referral) - 7 days remaining"


STORAGE INTEGRATION
====================

// Existing license storage (Phase 09):
chrome.storage.local: {
  license: {
    key: "ZOVO-XXXX-XXXX-XXXX-XXXX",  // Paid license key
    tier: "pro",
    features: [...],
    verified_at: "2026-02-10T...",
    expires_at: "2026-03-10T...",

    // NEW fields for referral integration:
    referral_pro: {                     // Referral-granted Pro access
      active: true,
      expires_at: "2026-02-24T...",
      days_remaining: 14,
      source_codes: ["FM-A7X9K2", "FM-B3M8P1"], // Which referrals granted this
      total_days_earned: 21
    },
    referral_credit_days: 0            // Banked days for paid subscribers
  }
}
```

### 4.5 Focus Mode-Specific Alternative Rewards

Beyond Pro time, referrers earn exclusive content that cannot be purchased:

```
EXCLUSIVE REFERRAL REWARDS
===========================

SILVER TIER (5+ referrals):
  "Silver Focus" ambient sound
  - A unique binaural beats track mixed with gentle rain
  - Only available through Silver referral tier
  - Appears in sound selector with "Silver" badge
  - Sound file: src/assets/sounds/silver-focus.mp3

GOLD TIER (20+ referrals):
  "Gold Focus" custom theme
  - Exclusive warm-gold color scheme for the popup
  - Gold-tinted Focus Score ring
  - Only available through Gold referral tier
  - Theme: { primary: '#f59e0b', accent: '#d97706', ring: '#fbbf24' }

  "Deep Focus" ambient sound
  - Premium 432Hz tuning ambient track
  - Sound file: src/assets/sounds/deep-focus.mp3

PLATINUM TIER (50+ referrals):
  All Silver + Gold rewards, plus:

  "Zenith" custom theme
  - Exclusive dark theme with aurora-like gradient accents
  - Theme: { primary: '#8b5cf6', accent: '#a78bfa', gradient: 'aurora' }

  "Beta Tester" badge + beta features access
  - Early access to new features before general release
  - Enrolled in beta channel for updates

  Priority support
  - Support tickets from Platinum referrers are flagged for faster response
  - (Implemented via referral tier check in support form)
```

---

## 5. Referral Link Generation

### 5.1 Link Formats

Focus Mode - Blocker supports multiple referral link formats optimized for different sharing contexts:

```
LINK FORMATS
=============

1. STANDARD LINK (landing page with full context):
   https://focusmodeblocker.com/r/FM-A7X9K2

   Best for: Email, messaging apps, forums
   Features: Full landing page with social proof, feature highlights,
             3-day Pro offer, CWS redirect

2. CWS DIRECT LINK (bypasses landing page):
   https://chromewebstore.google.com/detail/focus-mode-blocker/{EXT_ID}?ref=FM-A7X9K2

   Best for: Users who prefer direct CWS links
   NOTE: CWS strips the ?ref param before install, so attribution
         relies on the user having previously visited the landing page
         or manually entering the code. This format is provided for
         completeness but the standard link is preferred.

   IMPORTANT: This format has LOWER attribution rate (~40%) because
   it skips the landing page cookie. Use standard link when possible.

3. CAMPAIGN-SPECIFIC LINKS:
   https://focusmodeblocker.com/r/FM-A7X9K2?src=twitter
   https://focusmodeblocker.com/r/FM-A7X9K2?src=linkedin
   https://focusmodeblocker.com/r/FM-A7X9K2?src=reddit
   https://focusmodeblocker.com/r/FM-A7X9K2?src=email
   https://focusmodeblocker.com/r/FM-A7X9K2?src=whatsapp

   The ?src param tracks which platform the referral came from.
   Landing page logs this alongside the referral code.

4. SHORT LINK (for character-limited platforms):
   https://fmblk.co/FM-A7X9K2

   Redirects to the standard landing page link.
   Total: 28 characters (fits in tweets, bios, etc.)
   Implemented via Cloudflare Workers redirect.

5. QR CODE (for offline/in-person sharing):
   Generated client-side using a lightweight QR library.
   Encodes the standard landing page link.
   Displayed in the referral dashboard with download option.
```

### 5.2 Link Generation Implementation

```javascript
// src/background/referral-manager.js (link generation methods)

/**
 * Generate all referral link variants for the current user.
 *
 * @returns {Object} All link formats with the user's referral code
 */
function generateReferralLinks(code) {
  const BASE_URL = 'https://focusmodeblocker.com';
  const SHORT_URL = 'https://fmblk.co';
  const CWS_URL = 'https://chromewebstore.google.com/detail/focus-mode-blocker';
  const EXTENSION_ID = chrome.runtime.id; // Actual CWS extension ID

  return {
    standard: `${BASE_URL}/r/${code}`,
    cws_direct: `${CWS_URL}/${EXTENSION_ID}`,
    short: `${SHORT_URL}/${code}`,

    // Campaign-specific
    twitter: `${BASE_URL}/r/${code}?src=twitter`,
    linkedin: `${BASE_URL}/r/${code}?src=linkedin`,
    reddit: `${BASE_URL}/r/${code}?src=reddit`,
    email: `${BASE_URL}/r/${code}?src=email`,
    whatsapp: `${BASE_URL}/r/${code}?src=whatsapp`,

    // QR code data URL (generated on demand in popup)
    qr_data: `${BASE_URL}/r/${code}`
  };
}

/**
 * Generate pre-formatted share messages for each platform.
 *
 * @param {string} code - The user's referral code
 * @returns {Object} Share messages keyed by platform
 */
function generateShareMessages(code) {
  const link = `https://focusmodeblocker.com/r/${code}`;
  const shortLink = `https://fmblk.co/${code}`;

  return {
    twitter: {
      text: `I use Focus Mode to block distracting sites and actually get work done. Try it free -- you'll get 3 days of Pro features: ${shortLink}`,
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`I use Focus Mode to block distracting sites and actually get work done. Try it free -- you'll get 3 days of Pro features: ${shortLink}`)}`
    },

    linkedin: {
      text: `Focus Mode - Blocker has genuinely improved my productivity. It blocks distracting websites and tracks your focus score. Highly recommend for anyone who struggles with internet distractions.\n\nTry it free (you'll get 3 days of Pro): ${link}`,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`
    },

    reddit: {
      title: 'Focus Mode - Blocker: The distraction blocker that actually works',
      text: `Been using Focus Mode - Blocker for a while and it has genuinely helped me focus. Key features:\n\n- Blocks distracting sites (10 free, unlimited Pro)\n- Pomodoro timer built in\n- Focus Score tracks how focused you are\n- Streak system for habit building\n\nHere is my referral link if you want 3 free days of Pro: ${link}`,
      // Reddit doesn't have a universal share URL -- user copies text
      copyText: true
    },

    email: {
      subject: 'This Chrome extension actually helped me focus',
      body: `Hey,\n\nI wanted to share this Chrome extension I have been using called Focus Mode - Blocker. It blocks distracting websites and has a built-in Pomodoro timer and focus score.\n\nThe free version is genuinely useful (10 blocked sites, timer, daily stats), but if you use my referral link you will get 3 free days of all the Pro features:\n\n${link}\n\nI have found it really helps with staying on task during work hours.\n\nCheers`,
      url: `mailto:?subject=${encodeURIComponent('This Chrome extension actually helped me focus')}&body=${encodeURIComponent(`Hey,\n\nI wanted to share this Chrome extension I have been using called Focus Mode - Blocker. It blocks distracting websites and has a built-in Pomodoro timer and focus score.\n\nThe free version is genuinely useful (10 blocked sites, timer, daily stats), but if you use my referral link you will get 3 free days of all the Pro features:\n\n${link}\n\nCheers`)}`
    },

    whatsapp: {
      text: `I use Focus Mode to block distracting sites during work. Try it free -- you get 3 days of Pro: ${shortLink}`,
      url: `https://wa.me/?text=${encodeURIComponent(`I use Focus Mode to block distracting sites during work. Try it free -- you get 3 days of Pro: ${shortLink}`)}`
    },

    copy: {
      text: link,
      // Displayed in clipboard copy UI
      label: 'Referral link copied!'
    }
  };
}
```

### 5.3 QR Code Generation

```javascript
// src/popup/components/qr-generator.js
// Lightweight QR code generator for referral links
// Uses a minimal QR library (~3KB) bundled with the extension

/**
 * Generate a QR code as a data URL for the referral link.
 * Used in the referral dashboard for offline/in-person sharing.
 *
 * @param {string} url - The referral URL to encode
 * @param {Object} options - QR code options
 * @returns {string} Data URL of the QR code image (PNG)
 */
function generateQRCode(url, options = {}) {
  const {
    size = 200,        // QR code size in pixels
    margin = 2,        // Quiet zone margin (in modules)
    darkColor = '#1e293b',   // Dark module color (matches Focus Mode text)
    lightColor = '#ffffff',  // Light module color
    logoUrl = null     // Optional center logo (Focus Mode shield icon)
  } = options;

  // Use qr-creator library (lightweight, no dependencies)
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  // QR code generation (using bundled micro-library)
  QRCreator.render({
    text: url,
    radius: 0.4,       // Rounded module corners
    ecLevel: 'M',      // Medium error correction (allows logo overlay)
    fill: darkColor,
    background: lightColor,
    size: size
  }, canvas);

  // Optionally overlay the Focus Mode shield icon in center
  if (logoUrl) {
    const ctx = canvas.getContext('2d');
    const logoSize = size * 0.2; // Logo is 20% of QR code
    const logoX = (size - logoSize) / 2;
    const logoY = (size - logoSize) / 2;

    const logo = new Image();
    logo.src = logoUrl;
    logo.onload = () => {
      // White background behind logo
      ctx.fillStyle = lightColor;
      ctx.fillRect(logoX - 4, logoY - 4, logoSize + 8, logoSize + 8);
      ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
    };
  }

  return canvas.toDataURL('image/png');
}

/**
 * Render the QR code section in the referral dashboard.
 *
 * @param {HTMLElement} container - The container element
 * @param {string} referralUrl - The referral URL to encode
 */
function renderQRSection(container, referralUrl) {
  const qrDataUrl = generateQRCode(referralUrl, {
    size: 200,
    darkColor: '#1e293b',
    lightColor: '#ffffff'
  });

  container.innerHTML = `
    <div class="qr-section">
      <h4>Share in Person</h4>
      <div class="qr-code-wrapper">
        <img src="${qrDataUrl}" alt="Referral QR Code" class="qr-code-img" />
      </div>
      <p class="qr-hint">Scan to install Focus Mode with your referral</p>
      <button class="btn btn-secondary btn-sm qr-download-btn">
        Download QR Code
      </button>
    </div>
  `;

  container.querySelector('.qr-download-btn').addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = 'focus-mode-referral-qr.png';
    a.click();
  });
}
```

### 5.4 Deep Link Handling

The deep link flow bridges the landing page, CWS, and extension:

```
DEEP LINK FLOW
===============

1. User clicks: focusmodeblocker.com/r/FM-A7X9K2
   |
   v
2. Landing page (server-side rendered):
   - Extracts code from URL: FM-A7X9K2
   - Sets cookie: fm_ref=FM-A7X9K2 (30 days, SameSite=Lax, Secure)
   - Sets localStorage: fm_ref = { code, timestamp, source }
   - Logs click: POST /referral-click
   - Renders landing page with referral context
   |
   v
3. User clicks "Add to Chrome" button:
   - Opens CWS listing in same tab (or new tab)
   - Landing page tab remains in history (user can navigate back)
   - Landing page starts polling for extension install (Layer 2)
   |
   v
4. User installs from CWS:
   - Extension service worker fires chrome.runtime.onInstalled
   - Onboarding page opens
   |
   v
5. Attribution check runs (automatic, in background):
   |
   +--> 5a. Check externally_connectable message
   |    Landing page (if still open) sends message to extension
   |    chrome.runtime.onMessageExternal captures it
   |    Result: code = FM-A7X9K2, source = external_message
   |
   +--> 5b. Check landing page API (cookie-based)
   |    Extension makes fetch to focusmodeblocker.com/api/check-ref
   |    Server reads fm_ref cookie and returns code
   |    Result: code = FM-A7X9K2, source = cookie
   |
   +--> 5c. Check URL params on onboarding page
   |    If user was redirected with ?ref=FM-A7X9K2 somehow
   |    (e.g., from a direct link to the onboarding page)
   |    Result: code = FM-A7X9K2, source = url_param
   |
   +--> 5d. Manual entry (Slide 5 of onboarding)
        User types FM-A7X9K2 into the input field
        Result: code = FM-A7X9K2, source = manual_entry
   |
   v
6. First successful attribution is used (priority: 5a > 5b > 5c > 5d)
   |
   v
7. Extension sends attribution to backend:
   POST /referral-attribute {
     referral_code: "FM-A7X9K2",
     referred_instance_id: "inst_new_user_xxx",
     source: "cookie",
     timestamp: 1707600000000
   }
   |
   v
8. Backend validates and credits rewards:
   - Checks code exists and is active
   - Checks referred user is new (not already attributed)
   - Checks not a self-referral (different instance IDs)
   - Creates referral record
   - Returns reward details
   |
   v
9. Extension applies rewards to referred user:
   - +3 days Pro (Starter tier) applied immediately
   - Notification: "Welcome! Your friend's referral gave you 3 days of Pro."
   |
   v
10. Referrer is notified on next stats sync:
    - Stats updated: +1 referral (pending qualification)
    - +7 days Pro credited (Starter tier)
    - Notification: "Someone installed Focus Mode with your link! +7 Pro days"
```

---

## 6. Attribution & Tracking System

### 6.1 Multi-Touch Attribution Model

Focus Mode - Blocker uses **last-touch attribution** as the default model. This means the most recent referral code encountered before install gets credit. This is the simplest, most transparent model for individual referrers.

```
ATTRIBUTION MODELS (configurable server-side)
===============================================

LAST-TOUCH (default):
  The last referral code the user encountered before installing gets 100% credit.

  Example:
    Day 1: User clicks FM-A7X9K2 (from Alice's tweet)
    Day 3: User clicks FM-B3M8P1 (from Bob's email)
    Day 5: User installs

    Credit: FM-B3M8P1 (Bob) gets 100% credit
    Reason: Bob's link was the last touch before install

FIRST-TOUCH (available for future A/B testing):
  The first referral code the user encountered gets 100% credit.

  Same example:
    Credit: FM-A7X9K2 (Alice) gets 100% credit
    Reason: Alice introduced the user to Focus Mode first

TIME-DECAY (available for future A/B testing):
  Credit is distributed based on recency, with more recent touches
  getting more credit. Uses a 7-day half-life.

  Same example:
    FM-A7X9K2 (Day 1, 4 days before install): 25% credit
    FM-B3M8P1 (Day 3, 2 days before install): 75% credit

  Fractional credit is rounded to whole Pro days for reward calculation.

CURRENT IMPLEMENTATION:
  Only last-touch is implemented in v1.
  First-touch and time-decay are defined for future experimentation.
  The attribution model is stored server-side and can be changed
  without an extension update.
```

### 6.2 Attribution Capture on Landing Page

```javascript
// focusmodeblocker.com/js/attribution.js
// Runs on the referral landing page

(function() {
  'use strict';

  const COOKIE_NAME = 'fm_ref';
  const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds
  const LS_KEY = 'fm_ref';
  const API_BASE = 'https://xggdjlurppfcytxqoozs.supabase.co/functions/v1';

  /**
   * Extract referral code from URL path.
   * URL format: /r/FM-A7X9K2
   */
  function extractRefCode() {
    const pathMatch = window.location.pathname.match(/^\/r\/(FM-[A-Z0-9]{6,8})$/i);
    if (pathMatch) {
      return pathMatch[1].toUpperCase();
    }

    // Also check query param as fallback
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get('ref');
    if (refParam && /^FM-[A-Z0-9]{6,8}$/i.test(refParam)) {
      return refParam.toUpperCase();
    }

    return null;
  }

  /**
   * Extract campaign source from URL params.
   */
  function extractSource() {
    const params = new URLSearchParams(window.location.search);
    return params.get('src') || 'direct';
  }

  /**
   * Store referral code in cookie (primary) and localStorage (backup).
   */
  function storeAttribution(code, source) {
    // Cookie (accessible cross-origin via credentials: 'include')
    document.cookie = [
      `${COOKIE_NAME}=${code}`,
      `max-age=${COOKIE_MAX_AGE}`,
      'path=/',
      'SameSite=Lax',
      'Secure'
    ].join('; ');

    // localStorage backup
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        code: code,
        source: source,
        timestamp: Date.now(),
        url: window.location.href
      }));
    } catch (e) {
      // localStorage may be unavailable in some contexts
    }
  }

  /**
   * Log the referral click to the backend for analytics.
   */
  async function logClick(code, source) {
    try {
      await fetch(`${API_BASE}/referral-click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code,
          source: source,
          timestamp: Date.now(),
          user_agent: navigator.userAgent,
          referrer: document.referrer || null
        })
      });
    } catch (e) {
      // Non-critical -- analytics can be lost
    }
  }

  /**
   * Check if a previous referral code exists and apply last-touch logic.
   */
  function checkExistingAttribution(newCode) {
    try {
      const existing = localStorage.getItem(LS_KEY);
      if (existing) {
        const data = JSON.parse(existing);
        if (data.code === newCode) {
          // Same code -- just update timestamp
          return 'same_code';
        }
        // Different code -- last-touch wins, overwrite
        return 'overwritten';
      }
    } catch (e) {
      // No existing attribution
    }
    return 'new';
  }

  // Main execution
  const code = extractRefCode();
  if (code) {
    const source = extractSource();
    const status = checkExistingAttribution(code);

    storeAttribution(code, source);
    logClick(code, source);

    // Expose for the landing page UI
    window.__FM_REFERRAL = {
      code: code,
      source: source,
      status: status
    };
  }
})();
```

### 6.3 Attribution API Endpoint (Check-Ref)

```javascript
// focusmodeblocker.com/api/check-ref (Cloudflare Worker or Express route)
// Called by the extension on first install to check for cookie-based attribution

/**
 * GET /api/check-ref
 *
 * The extension calls this with credentials: 'include' to send cookies.
 * If the fm_ref cookie exists, returns the referral code.
 *
 * Response:
 *   200: { code: "FM-A7X9K2", source: "cookie", timestamp: 1707600000 }
 *   204: No referral attribution found
 *   429: Rate limited
 */
export async function handleCheckRef(request) {
  // Parse cookies from request
  const cookies = parseCookies(request.headers.get('Cookie') || '');
  const refCode = cookies['fm_ref'];

  if (!refCode) {
    return new Response(null, { status: 204 });
  }

  // Validate code format
  if (!/^FM-[A-Z0-9]{6,8}$/.test(refCode)) {
    return new Response(null, { status: 204 });
  }

  return new Response(JSON.stringify({
    code: refCode,
    source: 'cookie',
    timestamp: Date.now()
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': `chrome-extension://${EXTENSION_ID}`,
      'Access-Control-Allow-Credentials': 'true',
      'Cache-Control': 'no-store'
    }
  });
}

function parseCookies(cookieString) {
  const cookies = {};
  cookieString.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=');
    if (name) {
      cookies[name] = rest.join('=');
    }
  });
  return cookies;
}
```

### 6.4 Handling the CWS Attribution Gap

The Chrome Web Store strips all URL parameters when a user installs an extension. This creates a gap between the referral click and the actual install. Here is how each layer addresses this:

```
CWS ATTRIBUTION GAP ANALYSIS
==============================

The Problem:
  User clicks: chromewebstore.google.com/detail/focus-mode-blocker/XYZ?ref=FM-A7X9K2
  CWS strips ?ref=FM-A7X9K2
  Extension installs with ZERO knowledge of the referral

The Solutions (by reliability):

SOLUTION 1: Landing Page Cookie (most reliable)
  - User visits focusmodeblocker.com/r/FM-A7X9K2 FIRST
  - Cookie is set on focusmodeblocker.com domain
  - User then goes to CWS and installs
  - On first run, extension calls focusmodeblocker.com/api/check-ref
  - Cookie is sent with the request -> attribution captured

  Failure modes:
  - User clears cookies between click and install (~5%)
  - User installs in a different browser profile (~3%)
  - User installs days later and cookie expired (~2% within 30 days)
  - Third-party cookies blocked by browser settings (~5%)
    Mitigation: Cookie is first-party (set by focusmodeblocker.com,
    read by focusmodeblocker.com/api), so third-party cookie blocking
    does NOT affect this. The extension fetches from the same origin.

  Success rate: ~85%

SOLUTION 2: externally_connectable (supplement)
  - Landing page tab is still open when extension installs
  - Landing page JavaScript detects extension installation
  - Sends chrome.runtime.sendMessage to extension with ref code
  - Extension receives via chrome.runtime.onMessageExternal

  Failure modes:
  - User closed the landing page tab before installing (~60%)
  - User takes too long (polling times out after 10 minutes)

  Success rate: ~35% standalone, but catches ~10% of cookie failures

SOLUTION 3: Manual entry (fallback)
  - Onboarding slide 5 shows "Referred by a friend?" input
  - User types the code

  Success rate: ~10% of remaining unattributed installs

COMBINED: 85% + (15% * 35%) + (remaining * 10%) = ~92% attribution rate
```

### 6.5 Referral Analytics Dashboard (Options Page)

The referral dashboard is accessible from the options page under the "Invite Friends" tab. It provides detailed stats on referral activity.

```
REFERRAL ANALYTICS DATA MODEL
================================

// Data returned by GET_REFERRAL_STATS message

interface ReferralStats {
  // Summary
  code: string;                    // User's referral code (e.g., "FM-A7X9K2")
  tier: 'starter' | 'silver' | 'gold' | 'platinum';
  tier_progress: number;           // 0-100, progress to next tier

  // Counts
  total_referred: number;          // Total installs attributed to this code
  qualified_referrals: number;     // Installs that met qualification criteria
  pending_referrals: number;       // Installs in qualification window
  failed_referrals: number;        // Installs that did not qualify

  // Rewards
  total_pro_days_earned: number;   // All Pro days earned from referrals
  pro_days_used: number;           // Pro days already consumed
  pro_days_remaining: number;      // Pro days still available
  milestone_bonuses_earned: number; // Total milestone bonus days

  // Activity
  total_shares: number;            // Times the share button was clicked
  total_clicks: number;            // Times the referral link was clicked
  conversion_rate: number;         // clicks -> installs percentage
  shares_by_platform: {            // Breakdown by sharing platform
    copy: number;
    twitter: number;
    linkedin: number;
    email: number;
    whatsapp: number;
    reddit: number;
    qr: number;
  };

  // History
  referral_history: ReferralRecord[];  // Individual referral records
  next_milestone: {                    // Next milestone target
    target: number;                    // e.g., 10
    current: number;                   // e.g., 8
    reward: string;                    // e.g., "+1 month Pro"
  };

  // Leaderboard (opt-in, anonymous)
  leaderboard_rank: number | null;     // User's rank if opted in
  leaderboard_total: number;           // Total leaderboard participants
}

interface ReferralRecord {
  id: string;                      // Referral record ID
  status: 'pending' | 'qualified' | 'rewarded' | 'failed';
  referred_at: string;            // ISO 8601 timestamp
  qualified_at: string | null;    // When qualification criteria were met
  reward_days: number;            // Pro days earned from this referral
  source: string;                 // How attribution was captured
}
```

### 6.6 Privacy-Compliant Tracking

All referral tracking follows Focus Mode - Blocker's privacy-first principles:

```
PRIVACY MEASURES FOR REFERRAL TRACKING
========================================

1. HASHED INSTANCE IDs:
   - Backend stores SHA-256 hash of instance IDs, not raw UUIDs
   - Even if database is breached, instance IDs cannot be reversed
   - Hash includes a per-environment salt

   Server-side:
   hashed_id = SHA256(instance_id + ENVIRONMENT_SALT)

2. NO PII REQUIRED:
   - Free users: referral code derived from anonymous instance ID
   - No email, name, or identity required to participate
   - Pro users: email already collected for purchase, not additionally for referral

3. NO BROWSING DATA:
   - Referral system never accesses blocked sites, focus sessions, or scores
   - Only tracks: code, click timestamp, install confirmation, qualification status

4. MINIMAL DATA COLLECTION:
   - Landing page: code, source, timestamp, user_agent (for device type analytics)
   - Extension: code, instance_id (hashed), source
   - Backend: referral relationship (hashed referrer -> hashed referred)

5. DATA RETENTION:
   - Click logs: 90 days (then aggregated into counts)
   - Referral records: retained while either party has an active install
   - Reward records: retained indefinitely (needed for Pro time accounting)

6. USER CONTROL:
   - User can delete their referral code and history from the options page
   - Deleting referral data does NOT revoke already-granted Pro time
   - Users can opt out of the leaderboard at any time

7. GDPR/CCPA COMPLIANCE:
   - Referral data included in data export requests
   - Referral data deleted on account deletion requests
   - No cross-site tracking (no third-party cookies, no fingerprinting)
   - Cookie on landing page is first-party only
```

---

## 7. Referral Qualification & Anti-Fraud

### 7.1 Qualification Criteria

A referral progresses through three states: **pending**, **qualified**, and **rewarded**. The qualification step ensures that referred users are genuine, active users -- not throwaway installs created to game the system.

```
REFERRAL STATUS FLOW
=====================

  PENDING                QUALIFIED               REWARDED
  (immediate on         (7+ days, meets          (rewards applied
   install)              criteria)                to both parties)

  +--------+            +----------+             +---------+
  | Install|            | Active   |             | Rewards |
  | from   +----------->| for 7+   +------------>| applied |
  | ref    |   7 days   | days     |  automatic  | to both |
  | link   |            |          |             | users   |
  +--------+            +----------+             +---------+
       |                                              |
       |                                              |
       |   +--------+                                 |
       +-->| FAILED  |  (did not meet criteria        |
           | (no     |   within 30-day window)        |
           | reward) |                                |
           +--------+                                 |
                                                      v
                                              MILESTONE CHECK
                                              (10, 25, 50, 100)
                                              bonus applied if
                                              threshold reached


QUALIFICATION CRITERIA (all must be met within 30 days of install):
===================================================================

1. INSTALLED (immediate):
   - Extension successfully installed
   - Onboarding page opened (proves install is functional)
   - Attribution captured via any layer

2. ACTIVATED (within 7 days):
   - Completed at least 1 focus session (any duration)
   - This proves the user actually used the extension
   - Checked by referral-qualify-check alarm

3. RETAINED (within 30 days):
   - Active on at least 3 different calendar days
   - Completed at least 3 total focus sessions
   - Extension still installed (not uninstalled)
   - Checked by referral-qualify-check alarm

GRACE PERIOD:
  The 30-day window gives referred users time to become active.
  Qualification is checked daily via the referral-qualify-check alarm.
  If criteria are not met after 30 days, the referral status becomes FAILED.

IMPORTANT: The referrer gets their per-referral Pro days immediately on
install (pending status). If the referral later FAILS qualification,
the Pro days are NOT revoked. This avoids frustrating referrers and
keeps the system feeling generous. The qualification gate prevents
milestone bonuses from being awarded for low-quality referrals.
```

### 7.2 Anti-Fraud Measures

```
ANTI-FRAUD SYSTEM
==================

MEASURE 1: SELF-REFERRAL PREVENTION
-------------------------------------
  Detection: Compare instance ID of referrer with instance ID of referred user.
  If they match, the referral is rejected.

  Server-side check:
  IF hashed_referrer_id == hashed_referred_id THEN reject

  Additional check: Same device detection.
  If the extension detects that the same chrome.storage.sync data exists
  (meaning same Google account signed in), the referral is flagged.

  Edge case: User has two Chrome profiles on same machine.
  Resolution: Allowed -- different profiles are genuinely different users.
  However, if the same Google account is signed into both, it is flagged.

MEASURE 2: RATE LIMITING
--------------------------
  Per referral code:
  - Max 10 attributed installs per day
  - Max 50 attributed installs per week
  - Max 200 attributed installs per month

  If limits are exceeded, additional referrals are queued (not rejected)
  and processed the following day. This prevents bots from mass-installing
  but does not penalize genuinely viral referrers.

  Server-side implementation:
  ```sql
  -- Check rate limit before accepting attribution
  SELECT COUNT(*) FROM referrals
  WHERE referrer_code = $1
    AND referred_at > NOW() - INTERVAL '24 hours';
  -- If count >= 10, queue instead of process
  ```

MEASURE 3: IP-BASED DUPLICATE DETECTION (server-side, Pro users only)
----------------------------------------------------------------------
  For Pro users who have server interaction, the backend can detect
  multiple installs from the same IP address.

  Rules:
  - Max 3 referral installs from the same IP per 24 hours
  - Max 5 referral installs from the same IP per 7 days
  - Exceeding these limits flags the referral for manual review

  IMPORTANT: IP detection is ONLY used for Pro users who already make
  server requests. Free-tier users' IP addresses are NEVER logged
  for referral purposes (privacy-first principle).

  Implementation:
  - IP is hashed (SHA-256 + salt) before comparison
  - Raw IP is never stored in the referral tables
  - Hash is stored for 7 days, then deleted

MEASURE 4: DEVICE FINGERPRINT DETECTION (lightweight, no PII)
---------------------------------------------------------------
  On install, the extension collects minimal device signals:
  - Chrome version
  - OS platform
  - Screen resolution
  - Number of installed extensions (count only, not names)

  These are hashed together to create a device fingerprint.
  If two referral installs have the same fingerprint within 24 hours,
  the second is flagged for review.

  IMPORTANT: This fingerprint is:
  - Hashed before transmission (cannot identify the device)
  - Only used for anti-fraud comparison
  - Never stored long-term (deleted after 30 days)
  - Never shared with third parties

MEASURE 5: BEHAVIORAL ANALYSIS (post-install)
-----------------------------------------------
  Referrals are flagged if the referred user shows bot-like behavior:
  - Installs and immediately uninstalls (within 1 hour)
  - Never opens the popup after install
  - No focus sessions started within 7 days
  - Same browsing pattern as other flagged referrals from same code

  These signals feed into the qualification criteria -- bot installs
  naturally fail qualification and never generate milestone bonuses.

MEASURE 6: REFERRAL CODE SUSPENSION
-------------------------------------
  A referral code is automatically suspended if:
  - More than 50% of referrals from that code fail qualification
  - More than 10 referrals are flagged for fraud in 30 days
  - The referrer's own account shows suspicious behavior

  Suspension process:
  1. Code is marked as suspended in the database
  2. New attributions are queued, not processed
  3. Existing pending referrals continue qualification normally
  4. Email notification sent to referrer (if Pro user with email)
  5. Manual review within 48 hours
  6. Code is either reinstated or permanently disabled
```

### 7.3 Qualification Check Implementation

```javascript
// src/background/referral-manager.js (qualification logic)

/**
 * Check if a pending referral has met qualification criteria.
 * Called by the referral-qualify-check alarm (daily).
 *
 * @param {string} referredInstanceId - The referred user's instance ID
 * @returns {Object} Qualification result
 */
async function checkQualification(referredInstanceId) {
  // Only runs on the REFERRED user's extension
  // The referred user's extension checks its own activity

  const storage = await chrome.storage.local.get([
    'sessions',
    'stats',
    'settings'
  ]);

  const installDate = new Date(storage.settings?.install_date);
  const now = new Date();
  const daysSinceInstall = Math.floor((now - installDate) / (1000 * 60 * 60 * 24));

  // Check if within qualification window (30 days)
  if (daysSinceInstall > 30) {
    return { qualified: false, reason: 'window_expired', daysSinceInstall };
  }

  // Criterion 1: At least 1 completed focus session
  const totalSessions = storage.stats?.all_time?.total_sessions || 0;
  const hasActivated = totalSessions >= 1;

  // Criterion 2: Active on 3+ different calendar days
  const dailyHistory = storage.stats?.daily_history || [];
  const activeDays = dailyHistory.filter(day =>
    day.sessions_completed > 0 || day.total_focus_minutes > 0
  ).length;
  // Also count today if there is activity
  const todayActive = (storage.stats?.today?.sessions_completed || 0) > 0;
  const totalActiveDays = activeDays + (todayActive ? 1 : 0);
  const hasRetention = totalActiveDays >= 3;

  // Criterion 3: At least 3 total focus sessions
  const hasSessions = totalSessions >= 3;

  // Criterion 4: Extension still installed (implicit -- this code is running)

  const qualified = hasActivated && hasRetention && hasSessions;

  return {
    qualified,
    daysSinceInstall,
    criteria: {
      activated: hasActivated,
      retention: hasRetention,
      sessions: hasSessions,
      totalSessions,
      totalActiveDays
    },
    reason: qualified ? 'all_criteria_met' : 'criteria_not_met'
  };
}
```

---

## 8. Referral Dashboard UI

### 8.1 Options Page "Invite Friends" Tab

The referral dashboard lives in the options page as a new navigation tab. It provides full visibility into referral activity, rewards, and sharing tools.

```
OPTIONS PAGE NAVIGATION (updated)
===================================

[General] [Blocklist] [Timer] [Focus Score] [Sounds]
[Appearance] [Invite Friends] [Account] [About]
                ^^^^^^^^^^^^^
                NEW TAB (Phase 14)
```

### 8.2 Dashboard Layout

```
INVITE FRIENDS TAB -- FULL LAYOUT
===================================

+------------------------------------------------------------------+
|  Invite Friends                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  +--------------------------------------------------------------+ |
|  |  YOUR REFERRAL LINK                                           | |
|  |                                                               | |
|  |  [https://focusmodeblocker.com/r/FM-A7X9K2        ] [Copy]   | |
|  |                                                               | |
|  |  Share via:                                                   | |
|  |  [Twitter] [LinkedIn] [Email] [WhatsApp] [Reddit] [QR Code]  | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +-------------------------------+  +----------------------------+ |
|  |  REFERRAL STATS               |  |  TIER PROGRESS             | |
|  |                               |  |                            | |
|  |  Total Referred    12         |  |  SILVER TIER               | |
|  |  Qualified          8         |  |  [=========>    ] 8/20     | |
|  |  Pending            3         |  |                            | |
|  |  Failed             1         |  |  Current: +7 days/ref     | |
|  |                               |  |  Next: Gold (+10 days/ref)| |
|  |  Total Shares      45         |  |  Need 12 more qualified   | |
|  |  Link Clicks       67         |  |  referrals for Gold.      | |
|  |  Install Rate     18%         |  |                            | |
|  +-------------------------------+  +----------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  |  PRO DAYS EARNED                                              | |
|  |                                                               | |
|  |  Total earned:     86 days                                    | |
|  |  From referrals:   56 days (8 x 7 days)                      | |
|  |  From milestones:  30 days (10-referral bonus)                | |
|  |  Used:             42 days                                    | |
|  |  Remaining:        44 days                                    | |
|  |                                                               | |
|  |  [=============================>            ] 44 days left    | |
|  |                                                               | |
|  |  Next milestone: 25 referrals (+3 months Pro bonus)           | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  |  REFERRAL HISTORY                                             | |
|  |                                                               | |
|  |  [Qualified]  Feb 10, 2026  +7 days  via Twitter              | |
|  |  [Qualified]  Feb 8, 2026   +7 days  via Email                | |
|  |  [Pending]    Feb 7, 2026   --       via Copy Link            | |
|  |  [Qualified]  Feb 5, 2026   +7 days  via LinkedIn             | |
|  |  [Failed]     Jan 28, 2026  --       via Twitter              | |
|  |  [Qualified]  Jan 25, 2026  +7 days  via Email                | |
|  |  ...                                                          | |
|  |  [Show more]                                                  | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  |  LEADERBOARD (optional, anonymous)                [Opt In]    | |
|  |                                                               | |
|  |  Your rank: #47 of 1,234 referrers                            | |
|  |                                                               | |
|  |  #1   Anonymous    142 qualified referrals  Platinum          | |
|  |  #2   Anonymous     98 qualified referrals  Platinum          | |
|  |  #3   Anonymous     73 qualified referrals  Platinum          | |
|  |  ...                                                          | |
|  |  #47  You           8 qualified referrals   Silver            | |
|  |  ...                                                          | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  |  HOW IT WORKS                                                 | |
|  |                                                               | |
|  |  1. Share your referral link with friends                     | |
|  |  2. They install Focus Mode and get 3 days of Pro free        | |
|  |  3. You earn 7+ days of Pro for each friend who stays active  | |
|  |  4. Reach higher tiers for bigger rewards                     | |
|  |                                                               | |
|  |  TIER          REFERRALS    YOU EARN      FRIEND GETS         | |
|  |  Starter       0-4          +7 days       +3 days             | |
|  |  Silver        5-19         +7 days       +5 days (+ badge)   | |
|  |  Gold          20-49        +10 days      +7 days (+ theme)   | |
|  |  Platinum      50+          +14 days      +7 days (+ beta)    | |
|  |                                                               | |
|  |  MILESTONES                                                   | |
|  |  10 referrals  ->  +1 month Pro bonus                         | |
|  |  25 referrals  ->  +3 months Pro bonus                        | |
|  |  50 referrals  ->  +6 months Pro bonus                        | |
|  |  100 referrals ->  Lifetime Pro                                | |
|  +--------------------------------------------------------------+ |
+------------------------------------------------------------------+
```

### 8.3 Popup "Invite Friends" Quick Access

In addition to the full dashboard in options, the popup has a compact referral section:

```
POPUP -- REFERRAL SECTION (compact)
=====================================

When user scrolls down in popup or switches to "More" tab:

+------------------------------------------+
|  Invite Friends & Earn Pro Days           |
|                                           |
|  Your code: FM-A7X9K2                     |
|  [Copy Link] [Share]                      |
|                                           |
|  8 referrals | 56 Pro days earned         |
|  [See full dashboard ->]                  |
+------------------------------------------+

The [See full dashboard ->] link opens the options page
to the "Invite Friends" tab.
```

### 8.4 Share Button Implementations

```javascript
// src/popup/components/referral-panel.js

class ReferralPanel {
  constructor(container, referralData) {
    this.container = container;
    this.data = referralData;
  }

  render() {
    const { code, links, stats } = this.data;

    this.container.innerHTML = `
      <div class="referral-panel">
        <h3 class="referral-title">Invite Friends & Earn Pro Days</h3>

        <!-- Referral Link -->
        <div class="referral-link-group">
          <input
            type="text"
            class="referral-link-input"
            value="${links.standard}"
            readonly
          />
          <button class="btn btn-primary btn-sm copy-link-btn" data-link="${links.standard}">
            Copy
          </button>
        </div>

        <!-- Share Buttons -->
        <div class="share-buttons">
          <button class="share-btn share-twitter" data-platform="twitter" title="Share on Twitter">
            <svg class="share-icon" viewBox="0 0 24 24" width="18" height="18">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <span>Twitter</span>
          </button>

          <button class="share-btn share-linkedin" data-platform="linkedin" title="Share on LinkedIn">
            <svg class="share-icon" viewBox="0 0 24 24" width="18" height="18">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            <span>LinkedIn</span>
          </button>

          <button class="share-btn share-email" data-platform="email" title="Share via Email">
            <svg class="share-icon" viewBox="0 0 24 24" width="18" height="18">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            <span>Email</span>
          </button>

          <button class="share-btn share-whatsapp" data-platform="whatsapp" title="Share on WhatsApp">
            <svg class="share-icon" viewBox="0 0 24 24" width="18" height="18">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            </svg>
            <span>WhatsApp</span>
          </button>

          <button class="share-btn share-qr" data-platform="qr" title="Show QR Code">
            <svg class="share-icon" viewBox="0 0 24 24" width="18" height="18">
              <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM13 13h2v2h-2zM15 15h2v2h-2zM13 17h2v2h-2zM17 13h2v2h-2zM19 15h2v2h-2zM17 17h2v2h-2zM15 19h2v2h-2zM19 19h2v2h-2z"/>
            </svg>
            <span>QR</span>
          </button>
        </div>

        <!-- Quick Stats -->
        <div class="referral-quick-stats">
          <div class="stat-item">
            <span class="stat-value">${stats.qualified_referrals}</span>
            <span class="stat-label">Referrals</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${stats.total_pro_days_earned}</span>
            <span class="stat-label">Pro Days</span>
          </div>
          <div class="stat-item">
            <span class="stat-value tier-badge tier-${stats.tier}">${this.capitalize(stats.tier)}</span>
            <span class="stat-label">Tier</span>
          </div>
        </div>

        <!-- Dashboard Link -->
        <a href="#" class="dashboard-link" id="open-referral-dashboard">
          See full referral dashboard &rarr;
        </a>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    // Copy link button
    this.container.querySelector('.copy-link-btn').addEventListener('click', async (e) => {
      const link = e.target.dataset.link;
      await navigator.clipboard.writeText(link);
      e.target.textContent = 'Copied!';
      setTimeout(() => { e.target.textContent = 'Copy'; }, 2000);
      this.trackShare('copy');
    });

    // Share buttons
    this.container.querySelectorAll('.share-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const platform = e.currentTarget.dataset.platform;
        this.handleShare(platform);
      });
    });

    // Dashboard link
    this.container.querySelector('#open-referral-dashboard').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.openOptionsPage();
      // Options page will detect hash #invite-friends and switch to that tab
      chrome.runtime.sendMessage({
        type: 'OPEN_OPTIONS_TAB',
        tab: 'invite-friends'
      });
    });
  }

  async handleShare(platform) {
    const messages = await chrome.runtime.sendMessage({
      type: 'GET_SHARE_MESSAGES'
    });

    const msg = messages[platform];

    switch (platform) {
      case 'twitter':
      case 'linkedin':
      case 'whatsapp':
        window.open(msg.url, '_blank', 'width=600,height=400');
        break;
      case 'email':
        window.location.href = msg.url;
        break;
      case 'qr':
        this.showQRModal();
        break;
      case 'reddit':
        await navigator.clipboard.writeText(msg.text);
        this.showToast('Post text copied! Paste it on Reddit.');
        break;
    }

    this.trackShare(platform);
  }

  async trackShare(platform) {
    await chrome.runtime.sendMessage({
      type: 'TRACK_REFERRAL_SHARE',
      platform: platform
    });
  }

  showQRModal() {
    // Render QR code in a modal overlay
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal qr-modal">
        <button class="modal-close">&times;</button>
        <h3>Scan to Install</h3>
        <div id="qr-container"></div>
        <p class="qr-code-text">Code: ${this.data.code}</p>
        <button class="btn btn-secondary btn-sm" id="download-qr">Download QR</button>
      </div>
    `;
    document.body.appendChild(modal);

    // Generate QR code
    renderQRSection(
      modal.querySelector('#qr-container'),
      this.data.links.standard
    );

    // Close handlers
    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast toast-success';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
```

### 8.5 Referral Dashboard CSS

```css
/* src/options/sections/referral-section.css */

.referral-panel {
  max-width: 720px;
  margin: 0 auto;
}

.referral-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text, #1e293b);
  margin-bottom: 20px;
}

/* Referral link input group */
.referral-link-group {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.referral-link-input {
  flex: 1;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  padding: 10px 12px;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 8px;
  background: var(--color-surface, #f8fafc);
  color: var(--color-text, #1e293b);
  cursor: text;
  user-select: all;
}

.referral-link-input:focus {
  outline: none;
  border-color: var(--color-primary, #6366f1);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
}

/* Share buttons row */
.share-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.share-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 8px;
  background: var(--color-bg, #ffffff);
  color: var(--color-text-secondary, #64748b);
  font-size: 13px;
  cursor: pointer;
  transition: all 150ms ease;
}

.share-btn:hover {
  border-color: var(--color-primary, #6366f1);
  color: var(--color-primary, #6366f1);
  background: var(--color-primary-bg, #eef2ff);
}

.share-icon {
  fill: currentColor;
}

.share-twitter:hover {
  border-color: #1da1f2;
  color: #1da1f2;
  background: #e8f5fd;
}

.share-linkedin:hover {
  border-color: #0077b5;
  color: #0077b5;
  background: #e8f4fa;
}

.share-email:hover {
  border-color: #ea4335;
  color: #ea4335;
  background: #fce8e6;
}

.share-whatsapp:hover {
  border-color: #25d366;
  color: #25d366;
  background: #e8f8ef;
}

/* Quick stats row */
.referral-quick-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  padding: 16px;
  background: var(--color-surface, #f8fafc);
  border-radius: 12px;
  border: 1px solid var(--color-border, #e2e8f0);
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text, #1e293b);
  line-height: 1.2;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: var(--color-text-tertiary, #94a3b8);
  margin-top: 2px;
}

/* Tier badges */
.tier-badge {
  font-size: 14px !important;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
}

.tier-starter { color: #64748b; background: #f1f5f9; }
.tier-silver { color: #6b7280; background: #e5e7eb; }
.tier-gold { color: #b45309; background: #fef3c7; }
.tier-platinum { color: #7c3aed; background: #ede9fe; }

/* Tier progress */
.tier-progress {
  margin-bottom: 24px;
  padding: 20px;
  background: var(--color-surface, #f8fafc);
  border-radius: 12px;
  border: 1px solid var(--color-border, #e2e8f0);
}

.tier-progress-bar {
  width: 100%;
  height: 8px;
  background: var(--color-border, #e2e8f0);
  border-radius: 4px;
  overflow: hidden;
  margin: 12px 0;
}

.tier-progress-fill {
  height: 100%;
  background: var(--color-primary, #6366f1);
  border-radius: 4px;
  transition: width 500ms ease;
}

/* Referral history list */
.referral-history {
  margin-top: 24px;
}

.referral-history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
}

.referral-history-item:last-child {
  border-bottom: none;
}

.referral-status-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.status-qualified {
  color: #16a34a;
  background: #f0fdf4;
}

.status-pending {
  color: #d97706;
  background: #fffbeb;
}

.status-failed {
  color: #dc2626;
  background: #fef2f2;
}

.status-rewarded {
  color: #6366f1;
  background: #eef2ff;
}

.referral-date {
  font-size: 13px;
  color: var(--color-text-secondary, #64748b);
  min-width: 100px;
}

.referral-reward-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary, #6366f1);
}

.referral-source {
  font-size: 12px;
  color: var(--color-text-tertiary, #94a3b8);
  margin-left: auto;
}

/* Dashboard link */
.dashboard-link {
  display: block;
  text-align: center;
  font-size: 13px;
  color: var(--color-primary, #6366f1);
  text-decoration: none;
  margin-top: 12px;
  padding: 8px;
}

.dashboard-link:hover {
  text-decoration: underline;
}

/* QR Modal */
.qr-modal {
  max-width: 320px;
  text-align: center;
  padding: 24px;
}

.qr-modal h3 {
  margin-bottom: 16px;
}

.qr-code-wrapper {
  display: inline-block;
  padding: 12px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.qr-code-img {
  display: block;
  width: 200px;
  height: 200px;
}

.qr-code-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: var(--color-text-secondary, #64748b);
  margin: 12px 0;
}

/* Leaderboard */
.leaderboard-section {
  margin-top: 24px;
  padding: 20px;
  background: var(--color-surface, #f8fafc);
  border-radius: 12px;
  border: 1px solid var(--color-border, #e2e8f0);
}

.leaderboard-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  font-size: 13px;
}

.leaderboard-rank {
  font-weight: 700;
  color: var(--color-text, #1e293b);
  min-width: 32px;
}

.leaderboard-name {
  flex: 1;
  color: var(--color-text-secondary, #64748b);
}

.leaderboard-count {
  font-weight: 600;
  color: var(--color-text, #1e293b);
}

.leaderboard-row.is-you {
  background: var(--color-primary-bg, #eef2ff);
  border-radius: 8px;
  padding: 8px 12px;
  margin: 0 -12px;
}

.leaderboard-row.is-you .leaderboard-name {
  color: var(--color-primary, #6366f1);
  font-weight: 600;
}

/* How it works section */
.how-it-works {
  margin-top: 24px;
  padding: 20px;
  background: var(--color-surface, #f8fafc);
  border-radius: 12px;
  border: 1px solid var(--color-border, #e2e8f0);
}

.how-it-works h4 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}

.how-it-works ol {
  padding-left: 20px;
  margin: 0;
}

.how-it-works li {
  font-size: 14px;
  color: var(--color-text-secondary, #64748b);
  margin-bottom: 8px;
  line-height: 1.5;
}

.tier-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
  font-size: 13px;
}

.tier-table th {
  text-align: left;
  font-weight: 600;
  color: var(--color-text, #1e293b);
  padding: 8px 12px;
  border-bottom: 2px solid var(--color-border, #e2e8f0);
}

.tier-table td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
  color: var(--color-text-secondary, #64748b);
}

.tier-table tr.current-tier td {
  background: var(--color-primary-bg, #eef2ff);
  color: var(--color-primary, #6366f1);
  font-weight: 600;
}

/* Dark mode overrides */
@media (prefers-color-scheme: dark) {
  .referral-link-input {
    background: var(--color-surface-dark, #1e293b);
    border-color: var(--color-border-dark, #334155);
    color: var(--color-text-dark, #e2e8f0);
  }

  .share-btn {
    background: var(--color-bg-dark, #0f172a);
    border-color: var(--color-border-dark, #334155);
    color: var(--color-text-secondary-dark, #94a3b8);
  }

  .referral-quick-stats,
  .tier-progress,
  .leaderboard-section,
  .how-it-works {
    background: var(--color-surface-dark, #1e293b);
    border-color: var(--color-border-dark, #334155);
  }

  .qr-code-wrapper {
    background: #ffffff; /* QR codes must stay on white */
  }
}

---

## 9. Service Worker Integration

### 9.1 New Message Types

The referral system adds 8 new message types to the existing 22+ message types handled by the message router:

```
NEW MESSAGE TYPES (Phase 14 additions)
========================================

Message Type                  Direction            Description
────────────────────────────  ──────────────────   ──────────────────────────────────────
GENERATE_REFERRAL_CODE        popup -> SW           Generate or retrieve user's referral code
GET_REFERRAL_STATS            popup/options -> SW   Get full referral stats
GET_SHARE_MESSAGES            popup -> SW           Get pre-formatted share messages
TRACK_REFERRAL_SHARE          popup -> SW           Log a share button click
APPLY_REFERRAL_ATTRIBUTION    onboarding -> SW      Apply a referral code (manual or auto)
CHECK_REFERRAL_ATTRIBUTION    onboarding -> SW      Check if attribution exists
REFERRAL_ATTRIBUTION          external -> SW        External message from landing page
QUALIFY_REFERRAL              alarm -> SW           Internal: daily qualification check

EXISTING MESSAGES MODIFIED:
────────────────────────────────────────────────────────────────────────────────────
SESSION_COMPLETED             (existing)            Now also triggers referral qualification check
GET_LICENSE_STATUS            (existing)            Now includes referral_pro data in response
```

### 9.2 Message Router Integration

```javascript
// src/background/message-router.js (additions for referral system)

// Add to existing message handler switch statement:

case 'GENERATE_REFERRAL_CODE': {
  const result = await referralManager.getOrCreateCode();
  sendResponse({
    success: true,
    code: result.code,
    links: referralManager.generateLinks(result.code)
  });
  break;
}

case 'GET_REFERRAL_STATS': {
  const stats = await referralManager.getStats();
  sendResponse({ success: true, stats });
  break;
}

case 'GET_SHARE_MESSAGES': {
  const code = await referralManager.getCode();
  const messages = referralManager.getShareMessages(code);
  sendResponse({ success: true, messages });
  break;
}

case 'TRACK_REFERRAL_SHARE': {
  const { platform } = request;
  await referralManager.trackShare(platform);
  sendResponse({ success: true });
  break;
}

case 'APPLY_REFERRAL_ATTRIBUTION': {
  const { code, source } = request;
  const result = await referralManager.applyAttribution(code, source);
  sendResponse(result);
  break;
}

case 'CHECK_REFERRAL_ATTRIBUTION': {
  const attribution = await referralManager.checkAttribution();
  sendResponse({
    attributed: attribution !== null,
    code: attribution?.code || null,
    reward: attribution?.reward || null
  });
  break;
}
```

### 9.3 External Message Handler

```javascript
// src/background/service-worker.js (additions)
// Handle messages from the landing page via externally_connectable

chrome.runtime.onMessageExternal.addListener(
  (message, sender, sendResponse) => {
    // Validate sender origin
    const allowedOrigins = [
      'https://focusmodeblocker.com',
      'https://www.focusmodeblocker.com'
    ];

    if (!sender.url || !allowedOrigins.some(origin => sender.url.startsWith(origin))) {
      sendResponse({ success: false, error: 'unauthorized_origin' });
      return;
    }

    if (message.type === 'REFERRAL_ATTRIBUTION') {
      // Attribution from landing page
      const { code, timestamp, source } = message;

      if (!code || !/^FM-[A-Z0-9]{6,8}$/.test(code)) {
        sendResponse({ success: false, error: 'invalid_code_format' });
        return;
      }

      referralManager.applyAttribution(code, source || 'external_message')
        .then(result => sendResponse(result))
        .catch(err => sendResponse({ success: false, error: err.message }));

      return true; // Indicates async response
    }

    sendResponse({ success: false, error: 'unknown_message_type' });
  }
);
```

### 9.4 Alarm Registration

```javascript
// src/background/service-worker.js (alarm additions)
// Add to existing alarm setup in chrome.runtime.onInstalled

chrome.runtime.onInstalled.addListener((details) => {
  // ... existing alarm setup ...

  // Referral qualification check -- runs daily
  chrome.alarms.create('referral-qualify-check', {
    delayInMinutes: 60 * 24,       // First check after 24 hours
    periodInMinutes: 60 * 24       // Then every 24 hours
  });

  // Referral stats sync -- runs every 6 hours (for online users)
  chrome.alarms.create('referral-stats-sync', {
    delayInMinutes: 60 * 6,
    periodInMinutes: 60 * 6
  });
});

// Add to existing alarm handler
chrome.alarms.onAlarm.addListener(async (alarm) => {
  switch (alarm.name) {
    // ... existing alarm handlers ...

    case 'referral-qualify-check':
      await referralManager.runQualificationCheck();
      break;

    case 'referral-stats-sync':
      await referralManager.syncStats();
      break;
  }
});
```

### 9.5 Session Completion Integration

```javascript
// src/background/session-manager.js (modification)
// After a focus session completes, notify the referral system

async function completeSession(session) {
  // ... existing session completion logic ...
  // (update stats, calculate focus score, check streak, etc.)

  // NEW: Notify referral manager for qualification tracking
  // This is called on the REFERRED user's extension
  try {
    await referralManager.onSessionCompleted({
      sessionId: session.id,
      duration: session.duration_minutes,
      type: session.type,
      completed: true
    });
  } catch (e) {
    // Non-critical -- referral tracking should never break sessions
    errorHandler.log('referral_session_notify_failed', e);
  }
}
```

### 9.6 Storage Schema for Referral Data

```javascript
// Addition to STORAGE_SCHEMA (src/shared/storage-schema.ts)
// New top-level key: "referral"

const REFERRAL_STORAGE_SCHEMA = {

  "referral": {
    // ─── User's own referral code ───────────────────────────────────
    "code": null,                    // string | null: "FM-A7X9K2"
    "code_registered": false,        // boolean: has code been registered with server

    // ─── Attribution (if this user was referred) ────────────────────
    "attributed_to": null,           // string | null: referral code that brought this user
    "attribution_source": null,      // string | null: "cookie" | "external_message" | "manual_entry" | "url_param"
    "attribution_date": null,        // string | null: ISO 8601 timestamp
    "attribution_reward": null,      // object | null: { days: 3, applied: true }

    // ─── Referral stats (cached from server) ────────────────────────
    "stats": {
      "total_referred": 0,           // integer
      "qualified_referrals": 0,      // integer
      "pending_referrals": 0,        // integer
      "failed_referrals": 0,         // integer
      "total_shares": 0,             // integer
      "total_clicks": 0,             // integer
      "total_pro_days_earned": 0,    // integer
      "pro_days_used": 0,            // integer
      "milestone_bonuses_earned": 0, // integer
      "shares_by_platform": {
        "copy": 0,
        "twitter": 0,
        "linkedin": 0,
        "email": 0,
        "whatsapp": 0,
        "reddit": 0,
        "qr": 0
      },
      "last_synced": null            // string | null: ISO 8601
    },

    // ─── Tier status ────────────────────────────────────────────────
    "tier": "starter",               // string: "starter" | "silver" | "gold" | "platinum"
    "tier_progress": 0,              // number: 0-100 progress to next tier

    // ─── Referral history (last 50 entries cached locally) ──────────
    "history": [
      // {
      //   "id": "ref_xxx",
      //   "status": "qualified",    // "pending" | "qualified" | "rewarded" | "failed"
      //   "referred_at": "2026-02-10T...",
      //   "qualified_at": "2026-02-17T...",
      //   "reward_days": 7,
      //   "source": "twitter"       // sharing platform
      // }
    ],

    // ─── Qualification tracking (for referred users) ────────────────
    "qualification": {
      "sessions_completed": 0,       // integer: focus sessions since install
      "active_days": [],             // string[]: dates active (YYYY-MM-DD)
      "last_checked": null,          // string | null: ISO 8601
      "status": null                 // string | null: "pending" | "qualified" | "failed"
    },

    // ─── Leaderboard ────────────────────────────────────────────────
    "leaderboard": {
      "opted_in": false,             // boolean
      "rank": null,                  // integer | null
      "total_participants": null     // integer | null
    },

    // ─── UI state ───────────────────────────────────────────────────
    "ui": {
      "banner_dismissed": false,     // boolean: post-onboarding referral banner
      "banner_show_count": 0,        // integer: times banner has been shown (max 3)
      "last_milestone_shown": 0,     // integer: last milestone number shown in UI
      "dashboard_opened_count": 0    // integer: times dashboard has been opened
    }
  }
};
```

### 9.7 Storage Migration

```javascript
// src/background/migration-manager.js (addition)
// Migration to add referral storage schema

const MIGRATIONS = {
  // ... existing migrations ...

  // Migration 2: Add referral storage (Phase 14)
  2: async function migrateToV2(data) {
    // Add referral namespace with defaults
    if (!data.referral) {
      data.referral = {
        code: null,
        code_registered: false,
        attributed_to: null,
        attribution_source: null,
        attribution_date: null,
        attribution_reward: null,
        stats: {
          total_referred: 0,
          qualified_referrals: 0,
          pending_referrals: 0,
          failed_referrals: 0,
          total_shares: 0,
          total_clicks: 0,
          total_pro_days_earned: 0,
          pro_days_used: 0,
          milestone_bonuses_earned: 0,
          shares_by_platform: {
            copy: 0, twitter: 0, linkedin: 0,
            email: 0, whatsapp: 0, reddit: 0, qr: 0
          },
          last_synced: null
        },
        tier: 'starter',
        tier_progress: 0,
        history: [],
        qualification: {
          sessions_completed: 0,
          active_days: [],
          last_checked: null,
          status: null
        },
        leaderboard: {
          opted_in: false,
          rank: null,
          total_participants: null
        },
        ui: {
          banner_dismissed: false,
          banner_show_count: 0,
          last_milestone_shown: 0,
          dashboard_opened_count: 0
        }
      };
    }

    // Add referral_pro fields to license storage
    if (data.license && !data.license.referral_pro) {
      data.license.referral_pro = {
        active: false,
        expires_at: null,
        days_remaining: 0,
        source_codes: [],
        total_days_earned: 0
      };
      data.license.referral_credit_days = 0;
    }

    data.schema_version = 2;
    return data;
  }
};
```

---

## 10. Implementation Code

### 10.1 Complete ReferralManager Class

```javascript
// src/background/referral-manager.js
// Phase 14 -- Referral System Module (19th service worker module)

import { storageManager } from './storage-manager.js';
import { licenseManager } from './license-manager.js';
import { errorHandler } from './error-handler.js';

/**
 * ReferralManager -- Core referral system logic for Focus Mode - Blocker.
 *
 * Responsibilities:
 * - Generate and manage referral codes
 * - Track referral sharing activity
 * - Handle attribution for referred users
 * - Manage referral rewards (Pro days)
 * - Run qualification checks for pending referrals
 * - Sync stats with the Zovo backend
 *
 * Privacy model:
 * - Free users: all data local except explicit share/attribution actions
 * - Pro users: stats synced with server for cross-device visibility
 * - No PII collected -- only anonymous instance IDs and referral codes
 */
class ReferralManager {
  static instance = null;

  // Referral code alphabet (excludes ambiguous: 0, O, 1, I, L, Q)
  static ALPHABET = 'ABCDEFGHJKMNPRSTUVWXYZ23456789';
  static CODE_PREFIX = 'FM-';
  static CODE_LENGTH = 6;

  // API endpoints
  static API_BASE = 'https://xggdjlurppfcytxqoozs.supabase.co/functions/v1';
  static LANDING_BASE = 'https://focusmodeblocker.com';
  static SHORT_BASE = 'https://fmblk.co';

  // Tier thresholds
  static TIERS = {
    starter:  { min: 0,  max: 4,   referrerDays: 7,  referredDays: 3  },
    silver:   { min: 5,  max: 19,  referrerDays: 7,  referredDays: 5  },
    gold:     { min: 20, max: 49,  referrerDays: 10, referredDays: 7  },
    platinum: { min: 50, max: Infinity, referrerDays: 14, referredDays: 7 }
  };

  // Milestone bonuses (cumulative qualified referrals -> bonus days)
  static MILESTONES = [
    { threshold: 10,  bonusDays: 30,  label: '+1 month Pro' },
    { threshold: 25,  bonusDays: 90,  label: '+3 months Pro' },
    { threshold: 50,  bonusDays: 180, label: '+6 months Pro' },
    { threshold: 100, bonusDays: 0,   label: 'Lifetime Pro', lifetime: true }
  ];

  // Rate limits
  static MAX_DAILY_ATTRIBUTIONS = 10;
  static MAX_WEEKLY_ATTRIBUTIONS = 50;
  static QUALIFICATION_WINDOW_DAYS = 30;
  static QUALIFICATION_MIN_SESSIONS = 3;
  static QUALIFICATION_MIN_ACTIVE_DAYS = 3;

  constructor() {
    this._code = null; // In-memory cache
    this._stats = null; // In-memory cache
  }

  static getInstance() {
    if (!ReferralManager.instance) {
      ReferralManager.instance = new ReferralManager();
    }
    return ReferralManager.instance;
  }

  // ═══════════════════════════════════════════════════════════════════
  // CODE GENERATION
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Get existing referral code or generate a new one.
   * Code is deterministic -- same instance ID always produces same code.
   *
   * @returns {Promise<{code: string, isNew: boolean}>}
   */
  async getOrCreateCode() {
    // Check cache first
    if (this._code) {
      return { code: this._code, isNew: false };
    }

    // Check storage
    const data = await storageManager.get('referral');
    if (data?.code) {
      this._code = data.code;
      return { code: data.code, isNew: false };
    }

    // Generate new code from instance ID
    const settings = await storageManager.get('settings');
    const instanceId = settings?.sync_device_id;

    if (!instanceId) {
      throw new Error('Instance ID not available -- cannot generate referral code');
    }

    const code = this._generateCode(instanceId);
    this._code = code;

    // Save to storage
    await storageManager.update('referral', {
      code: code,
      code_registered: false
    });

    // Register with server (non-blocking)
    this._registerCode(code, instanceId).catch(err => {
      errorHandler.log('referral_code_register_failed', err);
    });

    return { code, isNew: true };
  }

  /**
   * Get the current referral code (without generating).
   * @returns {Promise<string|null>}
   */
  async getCode() {
    if (this._code) return this._code;
    const data = await storageManager.get('referral');
    this._code = data?.code || null;
    return this._code;
  }

  /**
   * Generate a deterministic referral code from an instance ID.
   * @private
   */
  _generateCode(instanceId) {
    const SALT = 'focusmode-referral-v1';
    const input = `${SALT}:${instanceId}`;

    let hash1 = 0;
    let hash2 = 1;

    for (let i = 0; i < input.length; i++) {
      const ch = input.charCodeAt(i);
      hash1 = ((hash1 << 5) - hash1 + ch) | 0;
      hash2 = (hash2 * 31 + ch) | 0;
    }

    hash1 = Math.abs(hash1);
    hash2 = Math.abs(hash2);

    const combined = hash1 * 1000000 + hash2;
    let code = '';
    let remaining = Math.abs(combined);

    for (let i = 0; i < ReferralManager.CODE_LENGTH; i++) {
      code += ReferralManager.ALPHABET[remaining % ReferralManager.ALPHABET.length];
      remaining = Math.floor(remaining / ReferralManager.ALPHABET.length);
    }

    return `${ReferralManager.CODE_PREFIX}${code}`;
  }

  /**
   * Register the referral code with the backend.
   * @private
   */
  async _registerCode(code, instanceId) {
    try {
      const response = await fetch(`${ReferralManager.API_BASE}/referral-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          instance_id_hash: await this._hashId(instanceId),
          timestamp: Date.now()
        })
      });

      if (response.ok) {
        await storageManager.update('referral', { code_registered: true });
      } else if (response.status === 409) {
        // Code collision -- server will provide alternative
        const data = await response.json();
        if (data.alternative_code) {
          this._code = data.alternative_code;
          await storageManager.update('referral', {
            code: data.alternative_code,
            code_registered: true
          });
        }
      }
    } catch (e) {
      // Will retry on next stats sync
      throw e;
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // LINK & MESSAGE GENERATION
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Generate all referral link variants.
   */
  generateLinks(code) {
    return {
      standard: `${ReferralManager.LANDING_BASE}/r/${code}`,
      short: `${ReferralManager.SHORT_BASE}/${code}`,
      twitter: `${ReferralManager.LANDING_BASE}/r/${code}?src=twitter`,
      linkedin: `${ReferralManager.LANDING_BASE}/r/${code}?src=linkedin`,
      reddit: `${ReferralManager.LANDING_BASE}/r/${code}?src=reddit`,
      email: `${ReferralManager.LANDING_BASE}/r/${code}?src=email`,
      whatsapp: `${ReferralManager.LANDING_BASE}/r/${code}?src=whatsapp`,
      qr_data: `${ReferralManager.LANDING_BASE}/r/${code}`
    };
  }

  /**
   * Generate pre-formatted share messages.
   */
  getShareMessages(code) {
    const link = `${ReferralManager.LANDING_BASE}/r/${code}`;
    const short = `${ReferralManager.SHORT_BASE}/${code}`;

    return {
      twitter: {
        text: `I use Focus Mode to block distracting sites and actually get work done. Try it free -- you get 3 days of Pro: ${short}`,
        url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`I use Focus Mode to block distracting sites and actually get work done. Try it free -- you get 3 days of Pro: ${short}`)}`
      },
      linkedin: {
        text: `Focus Mode - Blocker has genuinely improved my productivity. Try it free with 3 days of Pro: ${link}`,
        url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`
      },
      email: {
        subject: 'This Chrome extension actually helped me focus',
        body: `Hey,\n\nI have been using Focus Mode - Blocker to block distracting websites and it actually works. Try it -- you get 3 free days of Pro features:\n\n${link}\n\nCheers`,
        url: `mailto:?subject=${encodeURIComponent('This Chrome extension actually helped me focus')}&body=${encodeURIComponent(`Hey,\n\nI have been using Focus Mode - Blocker and it actually works. Try it with 3 free days of Pro:\n\n${link}\n\nCheers`)}`
      },
      whatsapp: {
        text: `I use Focus Mode to block distracting sites. Try it free with 3 days of Pro: ${short}`,
        url: `https://wa.me/?text=${encodeURIComponent(`I use Focus Mode to block distracting sites. Try it free with 3 days of Pro: ${short}`)}`
      },
      reddit: {
        title: 'Focus Mode - Blocker',
        text: `Been using Focus Mode - Blocker and it genuinely helps. Referral link for 3 free Pro days: ${link}`,
        copyText: true
      },
      copy: {
        text: link,
        label: 'Referral link copied!'
      }
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  // SHARING TRACKING
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Track a share button click.
   */
  async trackShare(platform) {
    const referral = await storageManager.get('referral');

    // Update local stats
    const stats = referral?.stats || {};
    stats.total_shares = (stats.total_shares || 0) + 1;
    if (stats.shares_by_platform) {
      stats.shares_by_platform[platform] = (stats.shares_by_platform[platform] || 0) + 1;
    }

    await storageManager.update('referral', { stats });

    // Log to analytics (non-blocking)
    this._logEvent('referral_share', { platform, code: referral?.code }).catch(() => {});
  }

  // ═══════════════════════════════════════════════════════════════════
  // ATTRIBUTION
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Apply referral attribution to this user (as the referred user).
   *
   * @param {string} code - The referrer's code
   * @param {string} source - How attribution was captured
   * @returns {Promise<{success: boolean, reward?: object, error?: string}>}
   */
  async applyAttribution(code, source) {
    // Validate code format
    if (!code || !/^FM-[A-Z0-9]{6,8}$/.test(code)) {
      return { success: false, error: 'Invalid referral code format' };
    }

    // Check if already attributed
    const referral = await storageManager.get('referral');
    if (referral?.attributed_to) {
      if (referral.attributed_to === code) {
        return { success: true, reward: referral.attribution_reward, already_applied: true };
      }
      return { success: false, error: 'Already attributed to a different referral' };
    }

    // Check not self-referral
    if (referral?.code === code) {
      return { success: false, error: 'Cannot use your own referral code' };
    }

    // Validate with server
    try {
      const settings = await storageManager.get('settings');
      const instanceId = settings?.sync_device_id;

      const response = await fetch(`${ReferralManager.API_BASE}/referral-attribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referral_code: code,
          referred_instance_id_hash: await this._hashId(instanceId),
          source,
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return { success: false, error: error.message || 'Server validation failed' };
      }

      const result = await response.json();
      const reward = {
        days: result.referred_days || 3,
        applied: false
      };

      // Save attribution
      await storageManager.update('referral', {
        attributed_to: code,
        attribution_source: source,
        attribution_date: new Date().toISOString(),
        attribution_reward: reward,
        qualification: {
          sessions_completed: 0,
          active_days: [],
          last_checked: null,
          status: 'pending'
        }
      });

      // Apply Pro days reward
      await this._applyProDays(reward.days, code, 'referred');
      reward.applied = true;

      await storageManager.update('referral', {
        attribution_reward: reward
      });

      return { success: true, reward };
    } catch (e) {
      // Offline -- save attribution locally, will validate on next sync
      const reward = { days: 3, applied: false, pending_validation: true };

      await storageManager.update('referral', {
        attributed_to: code,
        attribution_source: source,
        attribution_date: new Date().toISOString(),
        attribution_reward: reward,
        qualification: {
          sessions_completed: 0,
          active_days: [],
          last_checked: null,
          status: 'pending'
        }
      });

      // Apply Pro days optimistically
      await this._applyProDays(reward.days, code, 'referred');
      reward.applied = true;

      await storageManager.update('referral', {
        attribution_reward: reward
      });

      return { success: true, reward, offline: true };
    }
  }

  /**
   * Check if attribution has already been captured.
   */
  async checkAttribution() {
    const referral = await storageManager.get('referral');
    if (referral?.attributed_to) {
      return {
        code: referral.attributed_to,
        reward: referral.attribution_reward,
        source: referral.attribution_source
      };
    }
    return null;
  }

  // ═══════════════════════════════════════════════════════════════════
  // REWARDS
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Apply Pro days reward to the current user.
   * @private
   */
  async _applyProDays(days, sourceCode, role) {
    const license = await storageManager.get('license') || {};

    // Check if user has an active paid subscription
    const hasPaidPro = license.key && license.tier === 'pro' &&
      new Date(license.expires_at) > new Date();

    if (hasPaidPro) {
      // Bank the days as credit
      license.referral_credit_days = (license.referral_credit_days || 0) + days;
      await storageManager.set('license', license);
      return;
    }

    // Apply referral Pro directly
    const referralPro = license.referral_pro || {
      active: false,
      expires_at: null,
      days_remaining: 0,
      source_codes: [],
      total_days_earned: 0
    };

    const now = new Date();
    const currentExpiry = referralPro.active && referralPro.expires_at
      ? new Date(referralPro.expires_at)
      : now;

    const baseDate = currentExpiry > now ? currentExpiry : now;
    const newExpiry = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);

    referralPro.active = true;
    referralPro.expires_at = newExpiry.toISOString();
    referralPro.days_remaining = Math.ceil((newExpiry - now) / (1000 * 60 * 60 * 24));
    referralPro.total_days_earned += days;

    if (sourceCode && !referralPro.source_codes.includes(sourceCode)) {
      referralPro.source_codes.push(sourceCode);
    }

    license.referral_pro = referralPro;
    await storageManager.set('license', license);

    // Notify the license manager to refresh feature gates
    await licenseManager.refreshLicenseStatus();
  }

  /**
   * Calculate the user's current tier based on qualified referrals.
   */
  _calculateTier(qualifiedCount) {
    if (qualifiedCount >= 50) return 'platinum';
    if (qualifiedCount >= 20) return 'gold';
    if (qualifiedCount >= 5) return 'silver';
    return 'starter';
  }

  /**
   * Calculate tier progress percentage.
   */
  _calculateTierProgress(qualifiedCount) {
    const tier = this._calculateTier(qualifiedCount);
    const tierConfig = ReferralManager.TIERS[tier];

    if (tier === 'platinum') return 100;

    const nextTierName = tier === 'starter' ? 'silver' : tier === 'silver' ? 'gold' : 'platinum';
    const nextTierMin = ReferralManager.TIERS[nextTierName].min;
    const currentTierMin = tierConfig.min;
    const range = nextTierMin - currentTierMin;
    const progress = qualifiedCount - currentTierMin;

    return Math.round((progress / range) * 100);
  }

  /**
   * Check and apply milestone bonuses.
   */
  async _checkMilestones(qualifiedCount) {
    const referral = await storageManager.get('referral');
    const lastMilestone = referral?.ui?.last_milestone_shown || 0;

    for (const milestone of ReferralManager.MILESTONES) {
      if (qualifiedCount >= milestone.threshold && lastMilestone < milestone.threshold) {
        // New milestone reached
        if (milestone.lifetime) {
          // Lifetime Pro -- flag for manual review
          await this._logEvent('referral_milestone_lifetime', {
            code: referral?.code,
            qualified_count: qualifiedCount
          });
        } else {
          // Apply bonus days
          await this._applyProDays(milestone.bonusDays, 'milestone', 'referrer');
        }

        // Update milestone tracking
        await storageManager.update('referral.ui', {
          last_milestone_shown: milestone.threshold
        });

        // Return milestone info for UI notification
        return {
          reached: true,
          milestone: milestone
        };
      }
    }

    return { reached: false };
  }

  // ═══════════════════════════════════════════════════════════════════
  // QUALIFICATION
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Called when a focus session completes (on referred user's extension).
   * Updates qualification tracking data.
   */
  async onSessionCompleted(sessionData) {
    const referral = await storageManager.get('referral');

    // Only track if this user was referred and is pending qualification
    if (!referral?.attributed_to || referral?.qualification?.status !== 'pending') {
      return;
    }

    const qual = referral.qualification || {};
    qual.sessions_completed = (qual.sessions_completed || 0) + 1;

    // Track active days
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    if (!qual.active_days) qual.active_days = [];
    if (!qual.active_days.includes(today)) {
      qual.active_days.push(today);
    }

    await storageManager.update('referral', { qualification: qual });
  }

  /**
   * Run the daily qualification check.
   * Called by the referral-qualify-check alarm.
   */
  async runQualificationCheck() {
    const referral = await storageManager.get('referral');

    if (!referral?.attributed_to || referral?.qualification?.status !== 'pending') {
      return;
    }

    const qual = referral.qualification;
    const installDate = new Date(referral.attribution_date);
    const now = new Date();
    const daysSinceInstall = Math.floor((now - installDate) / (1000 * 60 * 60 * 24));

    // Check if qualification window has expired
    if (daysSinceInstall > ReferralManager.QUALIFICATION_WINDOW_DAYS) {
      qual.status = 'failed';
      qual.last_checked = now.toISOString();
      await storageManager.update('referral', { qualification: qual });

      // Notify server
      await this._notifyQualification(referral.attributed_to, 'failed').catch(() => {});
      return;
    }

    // Check qualification criteria
    const sessionsOk = qual.sessions_completed >= ReferralManager.QUALIFICATION_MIN_SESSIONS;
    const activeDaysOk = (qual.active_days?.length || 0) >= ReferralManager.QUALIFICATION_MIN_ACTIVE_DAYS;

    if (sessionsOk && activeDaysOk && daysSinceInstall >= 7) {
      // Qualified!
      qual.status = 'qualified';
      qual.last_checked = now.toISOString();
      await storageManager.update('referral', { qualification: qual });

      // Notify server
      await this._notifyQualification(referral.attributed_to, 'qualified').catch(() => {});
    } else {
      qual.last_checked = now.toISOString();
      await storageManager.update('referral', { qualification: qual });
    }
  }

  /**
   * Notify the server about a qualification status change.
   * @private
   */
  async _notifyQualification(referralCode, status) {
    const settings = await storageManager.get('settings');
    const instanceId = settings?.sync_device_id;

    await fetch(`${ReferralManager.API_BASE}/referral-qualify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referral_code: referralCode,
        referred_instance_id_hash: await this._hashId(instanceId),
        status,
        timestamp: Date.now()
      })
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // STATS
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Get full referral stats (from cache or server).
   */
  async getStats() {
    // Return cached stats first
    const referral = await storageManager.get('referral');
    const cachedStats = referral?.stats || {};

    // Build response from local data
    const code = referral?.code || null;
    const tier = referral?.tier || 'starter';
    const tierProgress = referral?.tier_progress || 0;

    const stats = {
      code,
      tier,
      tier_progress: tierProgress,
      ...cachedStats,
      referral_history: referral?.history || [],
      next_milestone: this._getNextMilestone(cachedStats.qualified_referrals || 0),
      leaderboard_rank: referral?.leaderboard?.rank || null,
      leaderboard_total: referral?.leaderboard?.total_participants || null
    };

    // Try to fetch fresh stats from server (non-blocking)
    this.syncStats().catch(() => {});

    return stats;
  }

  /**
   * Get the next milestone target.
   * @private
   */
  _getNextMilestone(currentQualified) {
    for (const milestone of ReferralManager.MILESTONES) {
      if (currentQualified < milestone.threshold) {
        return {
          target: milestone.threshold,
          current: currentQualified,
          reward: milestone.label,
          remaining: milestone.threshold - currentQualified
        };
      }
    }
    return { target: null, current: currentQualified, reward: 'All milestones reached!', remaining: 0 };
  }

  /**
   * Sync referral stats with the server.
   */
  async syncStats() {
    const referral = await storageManager.get('referral');
    if (!referral?.code) return;

    try {
      const settings = await storageManager.get('settings');
      const instanceId = settings?.sync_device_id;

      const response = await fetch(`${ReferralManager.API_BASE}/referral-stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: referral.code,
          instance_id_hash: await this._hashId(instanceId)
        })
      });

      if (!response.ok) return;

      const serverStats = await response.json();

      // Update local stats with server data
      const newTier = this._calculateTier(serverStats.qualified_referrals || 0);
      const newTierProgress = this._calculateTierProgress(serverStats.qualified_referrals || 0);

      await storageManager.update('referral', {
        stats: {
          ...referral.stats,
          total_referred: serverStats.total_referred || 0,
          qualified_referrals: serverStats.qualified_referrals || 0,
          pending_referrals: serverStats.pending_referrals || 0,
          failed_referrals: serverStats.failed_referrals || 0,
          total_clicks: serverStats.total_clicks || 0,
          total_pro_days_earned: serverStats.total_pro_days_earned || 0,
          last_synced: new Date().toISOString()
        },
        tier: newTier,
        tier_progress: newTierProgress,
        history: serverStats.history || referral.history || [],
        leaderboard: serverStats.leaderboard || referral.leaderboard || {}
      });

      // Check for new milestones
      const milestoneResult = await this._checkMilestones(serverStats.qualified_referrals || 0);

      // Check for tier upgrade
      if (newTier !== referral.tier) {
        // Tier changed -- show notification
        await this._showTierUpgradeNotification(newTier);
      }

      this._stats = null; // Clear cache
    } catch (e) {
      // Offline -- use cached stats
      errorHandler.log('referral_stats_sync_failed', e);
    }
  }

  /**
   * Show a notification when the user's tier upgrades.
   * @private
   */
  async _showTierUpgradeNotification(newTier) {
    const tierConfig = ReferralManager.TIERS[newTier];
    const tierNames = { starter: 'Starter', silver: 'Silver', gold: 'Gold', platinum: 'Platinum' };

    chrome.notifications.create('referral-tier-upgrade', {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('src/assets/icons/icon-128.png'),
      title: `${tierNames[newTier]} Tier Reached!`,
      message: `You now earn +${tierConfig.referrerDays} Pro days per referral. Your friends get +${tierConfig.referredDays} Pro days.`,
      priority: 2
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // UTILITY
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Hash an instance ID for privacy-safe server communication.
   * @private
   */
  async _hashId(instanceId) {
    const encoder = new TextEncoder();
    const data = encoder.encode(`referral-salt-v1:${instanceId}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Log an event to the analytics backend.
   * @private
   */
  async _logEvent(eventName, eventData) {
    try {
      await fetch(`${ReferralManager.API_BASE}/collect-analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: eventName,
          data: eventData,
          timestamp: Date.now()
        })
      });
    } catch (e) {
      // Non-critical
    }
  }
}

// Export singleton
export const referralManager = ReferralManager.getInstance();
```

### 10.2 AttributionCapture Class (Landing Page)

```javascript
// focusmodeblocker.com/js/attribution-capture.js
// Complete attribution capture system for the referral landing page

class AttributionCapture {
  static COOKIE_NAME = 'fm_ref';
  static COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days
  static LS_KEY = 'fm_ref';
  static EXTENSION_ID = 'YOUR_CHROME_WEB_STORE_EXTENSION_ID';
  static POLL_INTERVAL = 5000;  // 5 seconds
  static POLL_MAX_DURATION = 10 * 60 * 1000; // 10 minutes

  constructor() {
    this.refCode = null;
    this.source = null;
    this.pollTimer = null;
    this.pollStartTime = null;
  }

  /**
   * Initialize attribution capture.
   * Call this when the landing page loads.
   */
  init() {
    this.refCode = this._extractCode();
    this.source = this._extractSource();

    if (!this.refCode) {
      console.warn('No referral code found in URL');
      return;
    }

    // Store attribution
    this._setCookie(this.refCode);
    this._setLocalStorage(this.refCode, this.source);

    // Log click to backend
    this._logClick(this.refCode, this.source);

    // Expose to page for UI rendering
    window.__FM_REFERRAL = {
      code: this.refCode,
      source: this.source
    };

    // Start polling for extension install
    this._startInstallPoll();
  }

  /**
   * Extract referral code from URL.
   * Supports both path format (/r/FM-XXXXX) and query param (?ref=FM-XXXXX).
   */
  _extractCode() {
    // Path format: /r/FM-A7X9K2
    const pathMatch = window.location.pathname.match(/^\/r\/(FM-[A-Z0-9]{6,8})$/i);
    if (pathMatch) return pathMatch[1].toUpperCase();

    // Query param format: ?ref=FM-A7X9K2
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref && /^FM-[A-Z0-9]{6,8}$/i.test(ref)) return ref.toUpperCase();

    return null;
  }

  /**
   * Extract campaign source from URL params.
   */
  _extractSource() {
    const params = new URLSearchParams(window.location.search);
    return params.get('src') || 'direct';
  }

  /**
   * Set the attribution cookie.
   */
  _setCookie(code) {
    const parts = [
      `${AttributionCapture.COOKIE_NAME}=${code}`,
      `max-age=${AttributionCapture.COOKIE_MAX_AGE}`,
      'path=/',
      'SameSite=Lax',
      'Secure'
    ];
    document.cookie = parts.join('; ');
  }

  /**
   * Store attribution in localStorage as backup.
   */
  _setLocalStorage(code, source) {
    try {
      localStorage.setItem(AttributionCapture.LS_KEY, JSON.stringify({
        code,
        source,
        timestamp: Date.now(),
        url: window.location.href
      }));
    } catch (e) {
      // localStorage unavailable
    }
  }

  /**
   * Log the referral click to the analytics backend.
   */
  async _logClick(code, source) {
    try {
      const API_BASE = 'https://xggdjlurppfcytxqoozs.supabase.co/functions/v1';
      await fetch(`${API_BASE}/referral-click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          source,
          timestamp: Date.now(),
          user_agent: navigator.userAgent,
          referrer: document.referrer || null
        })
      });
    } catch (e) {
      // Non-critical
    }
  }

  /**
   * Poll for extension installation.
   * If the extension gets installed while this tab is open,
   * send attribution directly via externally_connectable.
   */
  _startInstallPoll() {
    this.pollStartTime = Date.now();

    this.pollTimer = setInterval(() => {
      const elapsed = Date.now() - this.pollStartTime;

      if (elapsed >= AttributionCapture.POLL_MAX_DURATION) {
        clearInterval(this.pollTimer);
        return;
      }

      this._tryExtensionMessage();
    }, AttributionCapture.POLL_INTERVAL);
  }

  /**
   * Attempt to send attribution message to the installed extension.
   */
  _tryExtensionMessage() {
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
      return;
    }

    try {
      chrome.runtime.sendMessage(
        AttributionCapture.EXTENSION_ID,
        {
          type: 'REFERRAL_ATTRIBUTION',
          code: this.refCode,
          source: 'external_message',
          timestamp: Date.now()
        },
        (response) => {
          if (chrome.runtime.lastError) {
            // Extension not installed yet -- continue polling
            return;
          }
          if (response && response.success) {
            // Attribution captured!
            clearInterval(this.pollTimer);
            this._showSuccessUI(response.reward);
          }
        }
      );
    } catch (e) {
      // Extension API not available
    }
  }

  /**
   * Show success message when attribution is captured.
   */
  _showSuccessUI(reward) {
    const banner = document.createElement('div');
    banner.className = 'attribution-success-banner';
    banner.innerHTML = `
      <div class="success-content">
        <span class="success-icon">&#10003;</span>
        <span>Referral applied! You got <strong>+${reward?.days || 3} days of Pro</strong>.</span>
      </div>
    `;
    document.body.prepend(banner);
  }

  /**
   * Clean up polling on page unload.
   */
  destroy() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }
  }
}

// Auto-initialize on page load
const attributionCapture = new AttributionCapture();
document.addEventListener('DOMContentLoaded', () => attributionCapture.init());
window.addEventListener('beforeunload', () => attributionCapture.destroy());
```

---

## 11. Storage Schema & Migration

### 11.1 Complete Storage Schema Addition

The referral system adds one new top-level key (`referral`) and modifies one existing key (`license`) in `chrome.storage.local`.

```
STORAGE IMPACT ANALYSIS
========================

NEW KEY: referral
  Estimated size: 2-5 KB (depending on history length)
  Growth pattern: History capped at 50 entries
  Cleanup: Old failed referrals pruned after 90 days

MODIFIED KEY: license
  New fields: referral_pro (object), referral_credit_days (integer)
  Estimated additional size: 200-500 bytes

TOTAL STORAGE IMPACT: ~3-6 KB
  (Well within chrome.storage.local's 10 MB quota)

STORAGE QUOTA MONITORING:
  The existing storage-manager.js monitors total usage.
  Referral data is included in the quota monitoring.
  If storage exceeds 80% of quota, referral history is pruned first
  (keep only last 20 entries instead of 50).
```

### 11.2 Database Schema (Backend)

```sql
-- ═══════════════════════════════════════════════════════════════
-- REFERRAL SYSTEM DATABASE SCHEMA
-- Supabase PostgreSQL
-- ═══════════════════════════════════════════════════════════════

-- Referral codes registry
CREATE TABLE referral_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,           -- "FM-A7X9K2"
  instance_id_hash VARCHAR(64) NOT NULL,      -- SHA-256 of instance ID
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  is_suspended BOOLEAN DEFAULT FALSE,
  suspended_reason TEXT,
  suspended_at TIMESTAMPTZ,

  -- Denormalized stats for fast lookups
  total_referred INTEGER DEFAULT 0,
  qualified_referrals INTEGER DEFAULT 0,
  pending_referrals INTEGER DEFAULT 0,
  failed_referrals INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  total_pro_days_earned INTEGER DEFAULT 0,
  tier VARCHAR(10) DEFAULT 'starter',

  CONSTRAINT valid_code CHECK (code ~ '^FM-[A-Z0-9]{6,8}$'),
  CONSTRAINT valid_tier CHECK (tier IN ('starter', 'silver', 'gold', 'platinum'))
);

CREATE INDEX idx_referral_codes_instance ON referral_codes(instance_id_hash);
CREATE INDEX idx_referral_codes_code ON referral_codes(code);

-- Individual referral records
CREATE TABLE referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_code VARCHAR(10) NOT NULL REFERENCES referral_codes(code),
  referred_instance_id_hash VARCHAR(64) NOT NULL,
  status VARCHAR(10) DEFAULT 'pending',
  source VARCHAR(20),                        -- "cookie", "external_message", "manual_entry"
  referred_at TIMESTAMPTZ DEFAULT NOW(),
  qualified_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  rewarded_at TIMESTAMPTZ,
  referrer_reward_days INTEGER DEFAULT 0,
  referred_reward_days INTEGER DEFAULT 0,

  -- Anti-fraud signals
  ip_hash VARCHAR(64),                       -- Hashed IP for duplicate detection
  device_fingerprint_hash VARCHAR(64),       -- Hashed device fingerprint
  fraud_flags JSONB DEFAULT '[]'::JSONB,

  CONSTRAINT valid_status CHECK (status IN ('pending', 'qualified', 'rewarded', 'failed')),
  CONSTRAINT unique_referred UNIQUE (referred_instance_id_hash)
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_code);
CREATE INDEX idx_referrals_status ON referrals(status);
CREATE INDEX idx_referrals_referred_at ON referrals(referred_at);

-- Reward ledger
CREATE TABLE referral_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instance_id_hash VARCHAR(64) NOT NULL,
  reward_type VARCHAR(20) NOT NULL,          -- "per_referral", "milestone", "tier_upgrade"
  days_awarded INTEGER NOT NULL,
  source_referral_id UUID REFERENCES referrals(id),
  milestone_threshold INTEGER,               -- For milestone bonuses (10, 25, 50, 100)
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_reward_type CHECK (
    reward_type IN ('per_referral', 'milestone', 'tier_upgrade', 'referred_bonus')
  )
);

CREATE INDEX idx_referral_rewards_instance ON referral_rewards(instance_id_hash);

-- Click tracking (for analytics)
CREATE TABLE referral_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code VARCHAR(10) NOT NULL,
  source VARCHAR(20),                        -- "twitter", "linkedin", "email", etc.
  ip_hash VARCHAR(64),
  user_agent TEXT,
  referrer_url TEXT,
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_referral_clicks_code ON referral_clicks(referral_code);
CREATE INDEX idx_referral_clicks_date ON referral_clicks(clicked_at);

-- Partitioning for click logs (high volume)
-- Partition by month for efficient cleanup
-- Retention: 90 days, then aggregated

-- Event log (for debugging and analytics)
CREATE TABLE referral_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  referral_code VARCHAR(10),
  instance_id_hash VARCHAR(64),
  event_data JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_referral_events_type ON referral_events(event_type);
CREATE INDEX idx_referral_events_date ON referral_events(created_at);

-- ═══════════════════════════════════════════════════════════════
-- EDGE FUNCTIONS (Supabase)
-- ═══════════════════════════════════════════════════════════════

-- referral-register: Register a new referral code
-- referral-click: Log a referral link click
-- referral-attribute: Attribute an install to a referrer
-- referral-qualify: Update qualification status
-- referral-stats: Get stats for a referral code
```

### 11.3 Edge Functions

```typescript
// supabase/functions/referral-register/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { code, instance_id_hash, timestamp } = await req.json();

  // Validate code format
  if (!code || !/^FM-[A-Z0-9]{6,8}$/.test(code)) {
    return new Response(JSON.stringify({ error: 'Invalid code format' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Try to insert the code
  const { data, error } = await supabase
    .from('referral_codes')
    .insert({ code, instance_id_hash })
    .select('code')
    .single();

  if (error) {
    if (error.code === '23505') {
      // Unique constraint violation -- code already exists
      // Check if it belongs to this instance
      const { data: existing } = await supabase
        .from('referral_codes')
        .select('instance_id_hash')
        .eq('code', code)
        .single();

      if (existing?.instance_id_hash === instance_id_hash) {
        // Same user re-registering -- idempotent success
        return new Response(JSON.stringify({ code, status: 'existing' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Different user -- collision, generate alternative
      const altCode = await generateAlternativeCode(supabase, code);
      return new Response(JSON.stringify({
        error: 'Code collision',
        alternative_code: altCode
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Log event
  await supabase.from('referral_events').insert({
    event_type: 'code_registered',
    referral_code: code,
    instance_id_hash,
    event_data: { timestamp }
  });

  return new Response(JSON.stringify({ code, status: 'created' }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' }
  });
});

async function generateAlternativeCode(supabase: any, originalCode: string) {
  // Try appending digits 1-9
  for (let i = 1; i <= 9; i++) {
    const altCode = `${originalCode}${i}`;
    const { error } = await supabase
      .from('referral_codes')
      .insert({ code: altCode, instance_id_hash: 'placeholder' })
      .select('code')
      .single();

    if (!error) {
      return altCode;
    }
  }
  // Extremely unlikely to reach here
  return `FM-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}
```

```typescript
// supabase/functions/referral-attribute/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { referral_code, referred_instance_id_hash, source, timestamp } = await req.json();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Validate referral code exists
  const { data: codeRecord } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('code', referral_code)
    .eq('is_active', true)
    .single();

  if (!codeRecord) {
    return new Response(JSON.stringify({ error: 'Invalid or inactive referral code' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Check suspended
  if (codeRecord.is_suspended) {
    return new Response(JSON.stringify({ error: 'Referral code is suspended' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Self-referral check
  if (codeRecord.instance_id_hash === referred_instance_id_hash) {
    return new Response(JSON.stringify({ error: 'Self-referral not allowed' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Check if already attributed
  const { data: existing } = await supabase
    .from('referrals')
    .select('id, referrer_code')
    .eq('referred_instance_id_hash', referred_instance_id_hash)
    .single();

  if (existing) {
    return new Response(JSON.stringify({
      error: 'Already attributed',
      existing_code: existing.referrer_code
    }), {
      status: 409,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Rate limit check
  const { count: dailyCount } = await supabase
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_code', referral_code)
    .gte('referred_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  if ((dailyCount || 0) >= 10) {
    return new Response(JSON.stringify({ error: 'Daily attribution limit reached' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Determine reward based on tier
  const tier = codeRecord.tier || 'starter';
  const TIERS: Record<string, { referrerDays: number; referredDays: number }> = {
    starter: { referrerDays: 7, referredDays: 3 },
    silver: { referrerDays: 7, referredDays: 5 },
    gold: { referrerDays: 10, referredDays: 7 },
    platinum: { referrerDays: 14, referredDays: 7 }
  };

  const tierConfig = TIERS[tier] || TIERS.starter;

  // Create referral record
  const { data: referral, error } = await supabase
    .from('referrals')
    .insert({
      referrer_code: referral_code,
      referred_instance_id_hash,
      source,
      referrer_reward_days: tierConfig.referrerDays,
      referred_reward_days: tierConfig.referredDays,
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Update denormalized stats on referral_codes
  await supabase
    .from('referral_codes')
    .update({
      total_referred: codeRecord.total_referred + 1,
      pending_referrals: codeRecord.pending_referrals + 1,
      total_pro_days_earned: codeRecord.total_pro_days_earned + tierConfig.referrerDays
    })
    .eq('code', referral_code);

  // Create reward records
  await supabase.from('referral_rewards').insert([
    {
      instance_id_hash: codeRecord.instance_id_hash, // Referrer
      reward_type: 'per_referral',
      days_awarded: tierConfig.referrerDays,
      source_referral_id: referral.id
    },
    {
      instance_id_hash: referred_instance_id_hash, // Referred
      reward_type: 'referred_bonus',
      days_awarded: tierConfig.referredDays,
      source_referral_id: referral.id
    }
  ]);

  // Log event
  await supabase.from('referral_events').insert({
    event_type: 'referral_attributed',
    referral_code: referral_code,
    instance_id_hash: referred_instance_id_hash,
    event_data: { source, tier, referrer_days: tierConfig.referrerDays, referred_days: tierConfig.referredDays }
  });

  return new Response(JSON.stringify({
    success: true,
    referral_id: referral.id,
    referrer_days: tierConfig.referrerDays,
    referred_days: tierConfig.referredDays,
    tier
  }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' }
  });
});
```

---

## 12. Landing Page Attribution Capture

### 12.1 Landing Page Architecture

```
LANDING PAGE STRUCTURE
=======================

URL: https://focusmodeblocker.com/r/{code}

Server-Side Rendering:
  - Code is extracted from URL on the server
  - Page is pre-rendered with referral context
  - Open Graph meta tags include referral messaging
  - Code validation happens server-side (invalid codes show generic page)

Page Sections:
  1. Hero: "Your friend uses Focus Mode - Blocker"
  2. Social proof: star rating, user count, privacy badges
  3. Feature highlights: 4 key features with icons
  4. Referral bonus: "+3 days of Pro features FREE"
  5. CTA: "Add to Chrome (Free)" button
  6. Already installed? Manual code entry
  7. Footer: Privacy policy, Zovo branding

Technical:
  - Static HTML/CSS (fast loading, good SEO)
  - attribution.js handles cookie/localStorage/polling
  - No framework dependencies
  - < 50KB total page weight
  - < 1 second load time
  - Mobile-responsive (in case user shares to mobile, shows "Open on desktop" message)
```

### 12.2 Open Graph Meta Tags

```html
<!-- Landing page meta tags for social sharing -->
<meta property="og:title" content="Focus Mode - Blocker: Block Distractions, Build Focus">
<meta property="og:description" content="Your friend uses Focus Mode to stay productive. Install free and get 3 days of Pro features.">
<meta property="og:image" content="https://focusmodeblocker.com/images/og-referral.png">
<meta property="og:url" content="https://focusmodeblocker.com/r/FM-A7X9K2">
<meta property="og:type" content="website">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Focus Mode - Blocker">
<meta name="twitter:description" content="Block distracting websites and build focus habits. Get 3 free days of Pro.">
<meta name="twitter:image" content="https://focusmodeblocker.com/images/twitter-referral.png">
```

### 12.3 Landing Page HTML Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Focus Mode - Blocker | Your Friend's Recommendation</title>

  <!-- OG tags rendered server-side with referral code -->
  <meta property="og:title" content="Focus Mode - Blocker: Block Distractions">
  <meta property="og:description" content="Your friend uses Focus Mode. Install free & get 3 days of Pro.">
  <meta property="og:image" content="https://focusmodeblocker.com/images/og-referral.png">

  <link rel="stylesheet" href="/css/landing.css">
</head>
<body>
  <div class="landing-container">
    <!-- Hero Section -->
    <header class="hero">
      <img src="/images/focus-mode-icon.svg" alt="Focus Mode" class="hero-icon" width="64" height="64">
      <h1>Your friend uses<br>Focus Mode - Blocker</h1>
      <p class="hero-subtitle">
        to block distracting websites and stay productive.
      </p>
    </header>

    <!-- Referral Bonus -->
    <div class="bonus-card">
      <div class="bonus-badge">REFERRAL BONUS</div>
      <h2>Get <span class="highlight">3 free days</span> of Pro features</h2>
      <p>Unlimited blocked sites, custom timers, full analytics, and more.</p>
    </div>

    <!-- Feature Highlights -->
    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon">&#128737;</div>
        <h3>Block Distractions</h3>
        <p>Block any website with one click. 10 sites free, unlimited with Pro.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">&#9201;</div>
        <h3>Pomodoro Timer</h3>
        <p>Built-in 25/5 focus timer. Stay on track with structured sessions.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">&#128200;</div>
        <h3>Focus Score</h3>
        <p>Track your focus quality with a 0-100 score. See your progress.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">&#128293;</div>
        <h3>Streaks</h3>
        <p>Build a focus streak. Stay consistent and earn achievements.</p>
      </div>
    </div>

    <!-- CTA -->
    <div class="cta-section">
      <a href="https://chromewebstore.google.com/detail/focus-mode-blocker/EXTENSION_ID"
         class="cta-button"
         id="install-cta">
        Add to Chrome (Free)
      </a>
      <p class="cta-note">
        <span class="rating-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
        4.8 stars &middot; 10,000+ users &middot; Privacy-first
      </p>
    </div>

    <!-- Already Installed -->
    <div class="already-installed">
      <p>Already have Focus Mode installed?</p>
      <div class="manual-code-group">
        <span class="code-display" id="ref-code-display"><!-- Rendered server-side --></span>
        <button class="copy-code-btn" id="copy-code-btn">Copy Code</button>
      </div>
      <p class="code-hint">Open Focus Mode and paste this code in Settings &gt; Invite Friends</p>
    </div>

    <!-- Footer -->
    <footer class="landing-footer">
      <p>
        <a href="https://focusmodeblocker.com/privacy">Privacy Policy</a> &middot;
        <a href="https://zovo.one">Part of Zovo</a>
      </p>
      <p class="footer-privacy">
        Focus Mode never collects your browsing data. All focus data stays on your device.
      </p>
    </footer>
  </div>

  <script src="/js/attribution-capture.js"></script>
  <script>
    // Copy code button
    document.getElementById('copy-code-btn')?.addEventListener('click', function() {
      const code = document.getElementById('ref-code-display')?.textContent;
      if (code) {
        navigator.clipboard.writeText(code);
        this.textContent = 'Copied!';
        setTimeout(() => { this.textContent = 'Copy Code'; }, 2000);
      }
    });

    // Track CTA click
    document.getElementById('install-cta')?.addEventListener('click', function() {
      // Log CTA click (non-blocking)
      if (window.__FM_REFERRAL) {
        fetch('https://xggdjlurppfcytxqoozs.supabase.co/functions/v1/collect-analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'referral_cta_click',
            data: {
              code: window.__FM_REFERRAL.code,
              source: window.__FM_REFERRAL.source
            },
            timestamp: Date.now()
          })
        }).catch(() => {});
      }
    });
  </script>
</body>
</html>
```

### 12.4 Short Link Redirect (Cloudflare Worker)

```javascript
// Cloudflare Worker for fmblk.co short link redirects

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname.slice(1); // Remove leading /

    // Check if path matches a referral code
    if (/^FM-[A-Z0-9]{6,8}$/i.test(path)) {
      const code = path.toUpperCase();
      const redirectUrl = `https://focusmodeblocker.com/r/${code}`;

      return Response.redirect(redirectUrl, 302);
    }

    // Default: redirect to main site
    return Response.redirect('https://focusmodeblocker.com', 302);
  }
};
```

---

## 13. Testing & Validation

### 13.1 Unit Tests

```javascript
// tests/referral-manager.test.js

describe('ReferralManager', () => {

  describe('Code Generation', () => {
    test('generates deterministic code from instance ID', () => {
      const code1 = referralManager._generateCode('test-uuid-123');
      const code2 = referralManager._generateCode('test-uuid-123');
      expect(code1).toBe(code2);
    });

    test('generates different codes for different IDs', () => {
      const code1 = referralManager._generateCode('test-uuid-123');
      const code2 = referralManager._generateCode('test-uuid-456');
      expect(code1).not.toBe(code2);
    });

    test('code matches expected format', () => {
      const code = referralManager._generateCode('test-uuid-123');
      expect(code).toMatch(/^FM-[A-Z0-9]{6}$/);
    });

    test('code does not contain ambiguous characters', () => {
      const code = referralManager._generateCode('test-uuid-123');
      expect(code).not.toMatch(/[0OIL1Q]/);
    });
  });

  describe('Tier Calculation', () => {
    test('returns starter for 0-4 referrals', () => {
      expect(referralManager._calculateTier(0)).toBe('starter');
      expect(referralManager._calculateTier(4)).toBe('starter');
    });

    test('returns silver for 5-19 referrals', () => {
      expect(referralManager._calculateTier(5)).toBe('silver');
      expect(referralManager._calculateTier(19)).toBe('silver');
    });

    test('returns gold for 20-49 referrals', () => {
      expect(referralManager._calculateTier(20)).toBe('gold');
      expect(referralManager._calculateTier(49)).toBe('gold');
    });

    test('returns platinum for 50+ referrals', () => {
      expect(referralManager._calculateTier(50)).toBe('platinum');
      expect(referralManager._calculateTier(1000)).toBe('platinum');
    });
  });

  describe('Tier Progress', () => {
    test('returns 0% at start of tier', () => {
      expect(referralManager._calculateTierProgress(0)).toBe(0);
      expect(referralManager._calculateTierProgress(5)).toBe(0);
      expect(referralManager._calculateTierProgress(20)).toBe(0);
    });

    test('returns 100% for platinum', () => {
      expect(referralManager._calculateTierProgress(50)).toBe(100);
      expect(referralManager._calculateTierProgress(100)).toBe(100);
    });

    test('returns correct mid-tier progress', () => {
      // Starter: 0-4, Silver starts at 5
      expect(referralManager._calculateTierProgress(2)).toBe(40); // 2/5
      expect(referralManager._calculateTierProgress(3)).toBe(60); // 3/5
    });
  });

  describe('Attribution', () => {
    test('rejects invalid code format', async () => {
      const result = await referralManager.applyAttribution('INVALID', 'manual');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid');
    });

    test('prevents self-referral', async () => {
      // Set up: user has code FM-A7X9K2
      await storageManager.update('referral', { code: 'FM-A7X9K2' });
      const result = await referralManager.applyAttribution('FM-A7X9K2', 'manual');
      expect(result.success).toBe(false);
      expect(result.error).toContain('own referral');
    });

    test('prevents duplicate attribution', async () => {
      await storageManager.update('referral', { attributed_to: 'FM-B3M8P1' });
      const result = await referralManager.applyAttribution('FM-A7X9K2', 'manual');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Already attributed');
    });

    test('returns success for same code re-application', async () => {
      await storageManager.update('referral', {
        attributed_to: 'FM-A7X9K2',
        attribution_reward: { days: 3, applied: true }
      });
      const result = await referralManager.applyAttribution('FM-A7X9K2', 'manual');
      expect(result.success).toBe(true);
      expect(result.already_applied).toBe(true);
    });
  });

  describe('Milestone Check', () => {
    test('detects 10-referral milestone', async () => {
      await storageManager.update('referral.ui', { last_milestone_shown: 0 });
      const result = await referralManager._checkMilestones(10);
      expect(result.reached).toBe(true);
      expect(result.milestone.threshold).toBe(10);
      expect(result.milestone.bonusDays).toBe(30);
    });

    test('does not re-trigger already shown milestone', async () => {
      await storageManager.update('referral.ui', { last_milestone_shown: 10 });
      const result = await referralManager._checkMilestones(10);
      expect(result.reached).toBe(false);
    });
  });

  describe('Qualification', () => {
    test('qualifies with 3+ sessions and 3+ active days after 7+ days', async () => {
      const installDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      await storageManager.set('settings', { install_date: installDate.toISOString() });
      await storageManager.set('stats', {
        all_time: { total_sessions: 5 },
        daily_history: [
          { date: '2026-02-03', sessions_completed: 2, total_focus_minutes: 50 },
          { date: '2026-02-05', sessions_completed: 1, total_focus_minutes: 25 },
          { date: '2026-02-07', sessions_completed: 2, total_focus_minutes: 50 }
        ],
        today: { sessions_completed: 0 }
      });

      const result = await checkQualification('test-instance');
      expect(result.qualified).toBe(true);
    });

    test('fails with insufficient sessions', async () => {
      const installDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      await storageManager.set('settings', { install_date: installDate.toISOString() });
      await storageManager.set('stats', {
        all_time: { total_sessions: 1 },
        daily_history: [
          { date: '2026-02-03', sessions_completed: 1, total_focus_minutes: 25 }
        ],
        today: { sessions_completed: 0 }
      });

      const result = await checkQualification('test-instance');
      expect(result.qualified).toBe(false);
    });

    test('fails after 30-day window', async () => {
      const installDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
      await storageManager.set('settings', { install_date: installDate.toISOString() });

      const result = await checkQualification('test-instance');
      expect(result.qualified).toBe(false);
      expect(result.reason).toBe('window_expired');
    });
  });
});
```

### 13.2 Integration Tests

```javascript
// tests/referral-integration.test.js

describe('Referral System Integration', () => {

  test('complete referral flow: share -> install -> attribute -> qualify', async () => {
    // 1. Referrer generates code
    const { code } = await referralManager.getOrCreateCode();
    expect(code).toMatch(/^FM-[A-Z0-9]{6}$/);

    // 2. Referrer shares link
    await referralManager.trackShare('twitter');
    const stats = await referralManager.getStats();
    expect(stats.total_shares).toBe(1);
    expect(stats.shares_by_platform.twitter).toBe(1);

    // 3. New user applies attribution
    // (Simulating on a different instance)
    const result = await referralManager.applyAttribution(code, 'cookie');
    expect(result.success).toBe(true);
    expect(result.reward.days).toBeGreaterThan(0);

    // 4. Pro days applied
    const license = await storageManager.get('license');
    expect(license.referral_pro.active).toBe(true);
    expect(license.referral_pro.days_remaining).toBeGreaterThan(0);
  });

  test('referral Pro integrates with feature gates', async () => {
    // Apply referral Pro days
    await referralManager._applyProDays(7, 'FM-TEST', 'referred');

    // Check feature gate recognizes referral Pro
    const hasAccess = await licenseManager.hasFeature('unlimited_sites');
    expect(hasAccess).toBe(true);
  });

  test('referral Pro expires correctly', async () => {
    // Apply referral Pro with past expiry
    const license = await storageManager.get('license') || {};
    license.referral_pro = {
      active: true,
      expires_at: new Date(Date.now() - 1000).toISOString(), // Expired
      days_remaining: 0,
      source_codes: ['FM-TEST'],
      total_days_earned: 3
    };
    await storageManager.set('license', license);

    // Feature gate should deny access
    await licenseManager.refreshLicenseStatus();
    const hasAccess = await licenseManager.hasFeature('unlimited_sites');
    expect(hasAccess).toBe(false);
  });
});
```

### 13.3 Manual Test Cases

```
MANUAL TEST CASES
==================

TC-REF-01: Code Generation
  1. Install extension fresh
  2. Open popup -> Invite Friends section
  3. Verify code is generated in FM-XXXXXX format
  4. Close popup, reopen -> verify same code appears
  5. Clear extension data, reinstall -> verify new code generated
  Expected: Deterministic code per instance ID

TC-REF-02: Share Link Copy
  1. Open Invite Friends tab
  2. Click "Copy" button next to referral link
  3. Verify link is in clipboard
  4. Verify link format: https://focusmodeblocker.com/r/FM-XXXXXX
  5. Verify button text changes to "Copied!" temporarily
  Expected: Link copied, visual feedback shown

TC-REF-03: Social Share Buttons
  1. Click Twitter share -> verify tweet composer opens with correct text
  2. Click LinkedIn share -> verify share dialog opens
  3. Click Email share -> verify mailto: link with subject and body
  4. Click WhatsApp share -> verify wa.me link opens
  5. Click QR Code -> verify QR modal appears, download works
  Expected: All share methods work correctly

TC-REF-04: Landing Page Attribution (Cookie)
  1. Open referral link in browser: focusmodeblocker.com/r/FM-TEST01
  2. Verify landing page loads with referral context
  3. Check cookies: fm_ref should be set to FM-TEST01
  4. Click "Add to Chrome" -> install extension
  5. Complete onboarding
  6. Verify referral attribution is captured automatically
  7. Verify +3 Pro days applied
  Expected: Seamless attribution via cookie

TC-REF-05: Manual Code Entry
  1. Install extension WITHOUT visiting referral link
  2. Complete onboarding to slide 5
  3. Enter referral code: FM-TEST01
  4. Click "Apply"
  5. Verify code validation (try invalid codes first)
  6. Verify +3 Pro days applied on valid code
  Expected: Manual entry works as fallback

TC-REF-06: Self-Referral Prevention
  1. Generate your own referral code (e.g., FM-MYCODE)
  2. Try to enter FM-MYCODE as a referral
  3. Verify error: "Cannot use your own referral code"
  Expected: Self-referral blocked

TC-REF-07: Referral Stats Dashboard
  1. Share referral link
  2. Have another user install via the link
  3. Open Invite Friends dashboard
  4. Verify stats update: total referred, pending count
  5. Wait for qualification (7 days) or simulate
  6. Verify qualified count and Pro days earned update
  Expected: Accurate stats display

TC-REF-08: Tier Progression
  1. Reach 5 qualified referrals
  2. Verify tier upgrade notification (Silver)
  3. Verify badge appears on Focus Score display
  4. Verify referred users now get 5 Pro days (not 3)
  5. Verify Silver Focus ambient sound unlocked
  Expected: Tier upgrades work and rewards are applied

TC-REF-09: Milestone Bonus
  1. Reach 10 qualified referrals
  2. Verify milestone celebration modal appears
  3. Verify +30 days Pro bonus applied
  4. Verify milestone is not re-triggered
  Expected: One-time milestone bonus

TC-REF-10: Offline Referral Code
  1. Disconnect from internet
  2. Open Invite Friends tab
  3. Verify code is still displayed (from cache)
  4. Share link (copy to clipboard)
  5. Reconnect to internet
  6. Verify code registers with server on next sync
  Expected: Offline-capable code generation
```

---

## 14. Privacy & Compliance

### 14.1 GDPR Compliance

```
GDPR COMPLIANCE FOR REFERRAL SYSTEM
=====================================

LAWFUL BASIS: Legitimate Interest (Article 6(1)(f))
  The referral system processes minimal anonymous data for the
  legitimate purpose of enabling users to recommend the extension
  to others and receive rewards.

DATA PROCESSING REGISTER ENTRY:
  Purpose: User referral program
  Data categories: Anonymous instance IDs (hashed), referral codes,
                   click timestamps, attribution source
  Data subjects: Extension users who participate in referrals
  Recipients: Zovo backend (Supabase, EU-based option available)
  Retention: Referral records retained while parties have active installs;
             click logs aggregated after 90 days
  Cross-border: If US Supabase: Standard Contractual Clauses apply

RIGHT TO ERASURE (Article 17):
  - User can delete their referral code and history
  - Already-granted Pro time is NOT revoked (fairness principle)
  - Server records are anonymized (instance_id_hash set to 'deleted')

RIGHT TO DATA PORTABILITY (Article 20):
  - Referral data included in data export functionality
  - Format: JSON with all referral records, stats, and history

DATA MINIMIZATION (Article 5(1)(c)):
  - Only hashed instance IDs stored on server
  - No email required for participation
  - No browsing data collected
  - No social graph stored (referral relationships use hashed IDs)
  - IP addresses hashed and deleted after 7 days

PRIVACY BY DESIGN (Article 25):
  - Free-tier users: zero server requests until explicit referral action
  - Referral codes derived from existing anonymous instance IDs
  - Cookie is first-party only (no cross-site tracking)
  - All identifiers hashed with salts before server storage
```

### 14.2 CCPA Compliance

```
CCPA COMPLIANCE
================

NOTICE AT COLLECTION:
  Referral participation involves:
  - Generating an anonymous referral code (from existing instance ID)
  - Sharing a link (no data sent until user shares)
  - Tracking clicks, installs, and qualification (anonymous)

RIGHT TO KNOW:
  Users can view all referral data in the Invite Friends dashboard.

RIGHT TO DELETE:
  Users can delete referral data from Settings > Privacy > Delete Referral Data.

RIGHT TO OPT-OUT:
  Users who never open the Invite Friends tab generate zero referral data.
  The system is entirely opt-in by user action.

DO NOT SELL:
  Referral data is never sold, shared for advertising, or used
  for any purpose beyond the referral program itself.
```

### 14.3 Chrome Web Store Policy Compliance

```
CWS POLICY COMPLIANCE
=======================

SINGLE PURPOSE (CWS Policy):
  The referral system is a supporting feature of the extension's
  productivity purpose. It does not change the extension's core
  functionality. The "Invite Friends" tab is one of many tabs
  in the options page.

PERMISSIONS:
  The referral system requires NO additional permissions beyond
  what the extension already requests. It uses:
  - storage (already required for core functionality)
  - externally_connectable (new manifest key, not a permission)

USER DATA POLICY:
  - No user data is collected for referral purposes beyond
    the existing anonymous instance ID
  - The referral cookie is set on the publisher's landing page,
    not injected into third-party sites
  - No content scripts are modified for referral purposes

PROHIBITED BEHAVIORS:
  - No incentivized reviews (referral rewards are for installs, not reviews)
  - No deceptive referral links (landing page clearly identifies the extension)
  - No automatic sharing (user must explicitly click share buttons)
  - No spam or aggressive promotion (share buttons are in dedicated tabs only)
```

---

## 15. Metrics & Success Criteria

### 15.1 Key Performance Indicators

```
REFERRAL SYSTEM KPIs
=====================

ACQUISITION METRICS:
  Referral share rate:     8-15% of WAU click a share button at least once
  Click-through rate:      5-10% of people who see a shared link click it
  Landing-to-CWS rate:     60-80% of landing page visitors click "Add to Chrome"
  CWS-to-install rate:     30-50% of CWS visitors install (standard CWS conversion)
  Overall referral funnel:  1-4% of shared links result in an install
  Attribution capture rate: 85-95% of referred installs are attributed

QUALITY METRICS:
  Referral qualification rate:  60-75% of attributed installs qualify (7-day retention)
  Referred user D7 retention:   40-55% (should be higher than organic -- social proof)
  Referred user D30 retention:  25-40% (should be higher than organic)
  Self-referral rate:            < 2% (anti-fraud effectiveness)
  Fraud flag rate:               < 5% of all referrals

REWARD METRICS:
  Avg Pro days earned per referrer:  21-50 days over lifetime
  Referral-to-paid conversion:       8-15% of referred users convert to paid
  Pro days cost per acquired user:   $0 (vs $2-5 CAC for paid acquisition)
  Referral LTV vs organic LTV:      1.2-1.5x (referred users are higher quality)

ENGAGEMENT METRICS:
  Dashboard open rate:    30-50% of referrers check stats at least monthly
  Share button usage:     copy (60%), Twitter (15%), email (10%), WhatsApp (8%), LinkedIn (5%), QR (2%)
  Leaderboard opt-in:    5-10% of active referrers
  Tier distribution:      Starter 85%, Silver 10%, Gold 4%, Platinum 1%

VIRAL METRICS:
  K-factor:               0.1-0.3 (each user brings 0.1-0.3 new users)
  Viral cycle time:       7-14 days (time from share to qualified install)
  Referral revenue attribution: 5-10% of total revenue originated from referrals
```

### 15.2 Monitoring Dashboard

```
SERVER-SIDE MONITORING QUERIES
===============================

-- Daily referral funnel
SELECT
  date_trunc('day', created_at) AS day,
  COUNT(*) FILTER (WHERE event_type = 'referral_share') AS shares,
  COUNT(*) FILTER (WHERE event_type = 'referral_click') AS clicks,
  COUNT(*) FILTER (WHERE event_type = 'referral_cta_click') AS cta_clicks,
  COUNT(*) FILTER (WHERE event_type = 'referral_attributed') AS installs,
  COUNT(*) FILTER (WHERE event_type = 'referral_qualified') AS qualified
FROM referral_events
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY 1
ORDER BY 1 DESC;

-- Tier distribution
SELECT tier, COUNT(*) AS count
FROM referral_codes
WHERE is_active = TRUE
GROUP BY tier
ORDER BY
  CASE tier
    WHEN 'starter' THEN 1
    WHEN 'silver' THEN 2
    WHEN 'gold' THEN 3
    WHEN 'platinum' THEN 4
  END;

-- Top referrers
SELECT code, qualified_referrals, total_pro_days_earned, tier
FROM referral_codes
WHERE is_active = TRUE
ORDER BY qualified_referrals DESC
LIMIT 25;

-- Attribution source distribution
SELECT source, COUNT(*) AS count,
  COUNT(*) FILTER (WHERE status = 'qualified') AS qualified
FROM referrals
WHERE referred_at > NOW() - INTERVAL '30 days'
GROUP BY source
ORDER BY count DESC;

-- Fraud detection
SELECT referrer_code, COUNT(*) AS daily_referrals,
  COUNT(DISTINCT ip_hash) AS unique_ips,
  COUNT(*) FILTER (WHERE fraud_flags != '[]') AS flagged
FROM referrals
WHERE referred_at > NOW() - INTERVAL '24 hours'
GROUP BY referrer_code
HAVING COUNT(*) > 5
ORDER BY daily_referrals DESC;

-- Qualification rate by cohort
SELECT
  date_trunc('week', referred_at) AS cohort_week,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE status = 'qualified') AS qualified,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed,
  COUNT(*) FILTER (WHERE status = 'pending') AS pending,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'qualified') / NULLIF(COUNT(*), 0), 1) AS qual_rate
FROM referrals
WHERE referred_at > NOW() - INTERVAL '90 days'
GROUP BY 1
ORDER BY 1 DESC;
```

### 15.3 A/B Tests

```
PLANNED A/B TESTS FOR REFERRAL SYSTEM
=======================================

TEST 1: Referral Prompt Placement
  Hypothesis: Showing referral prompt in popup (instead of only options page)
              increases share rate by 25%+
  Variant A: Referral section only in options page
  Variant B: Compact referral card in popup "More" tab
  Metric: Share rate (% of WAU who share)
  Sample size: 2,000 users per variant
  Duration: 4 weeks

TEST 2: Referred User Pro Days
  Hypothesis: Giving 7 Pro days (instead of 3) increases install conversion
              by 15%+ without significantly impacting paid conversion
  Variant A: +3 days Pro for referred users
  Variant B: +7 days Pro for referred users
  Metric: Landing page -> install conversion rate AND 30-day paid conversion
  Sample size: 1,000 referred users per variant
  Duration: 6 weeks

TEST 3: Landing Page Design
  Hypothesis: A video demo on the landing page increases CWS click-through by 20%+
  Variant A: Static feature grid (current)
  Variant B: 30-second auto-playing demo video
  Metric: Landing page -> CWS click rate
  Sample size: 5,000 landing page visitors per variant
  Duration: 3 weeks

TEST 4: Milestone Thresholds
  Hypothesis: Lower milestone thresholds (5, 15, 30, 50 instead of 10, 25, 50, 100)
              increase referral activity by 20%+
  Variant A: Current thresholds (10, 25, 50, 100)
  Variant B: Lower thresholds (5, 15, 30, 50)
  Metric: Avg referrals per active referrer
  Sample size: 1,000 active referrers per variant
  Duration: 8 weeks

TEST 5: Share Message Copy
  Hypothesis: Shorter, punchier share messages increase click-through by 15%+
  Variant A: Current messages (descriptive, ~150 chars)
  Variant B: Short messages (punchy, ~80 chars)
  Metric: Share -> click conversion rate
  Sample size: 2,000 shares per variant
  Duration: 4 weeks
```

### 15.4 Health Indicators

```
REFERRAL SYSTEM HEALTH INDICATORS
===================================

| Metric                    | Green        | Yellow       | Red           | Response |
|---------------------------|-------------|-------------|---------------|----------|
| Attribution capture rate  | > 85%       | 70-85%      | < 70%         | Debug cookie/messaging chain |
| Qualification rate        | > 60%       | 40-60%      | < 40%         | Adjust criteria, check fraud |
| Self-referral rate        | < 2%        | 2-5%        | > 5%          | Strengthen anti-fraud |
| Fraud flag rate           | < 5%        | 5-10%       | > 10%         | Manual review, suspend codes |
| API error rate            | < 1%        | 1-5%        | > 5%          | Check backend health |
| Share button click rate   | > 8%        | 4-8%        | < 4%          | Improve CTA visibility |
| Landing page load time    | < 1s        | 1-3s        | > 3s          | Optimize page assets |
| Code registration failures| < 1%        | 1-3%        | > 3%          | Check server capacity |
```

---

## Implementation Priority

| Priority | Component | Complexity | Dependencies |
|----------|-----------|------------|-------------|
| P0 | ReferralManager class (code gen, attribution) | High | storageManager, licenseManager |
| P0 | Storage schema + migration | Medium | migration-manager.js |
| P0 | Message router additions (8 new types) | Medium | message-router.js |
| P1 | Landing page + attribution.js | High | Domain + hosting setup |
| P1 | Referral panel in popup | Medium | ReferralManager |
| P1 | Onboarding slide 5 update | Medium | onboarding-manager.js |
| P1 | externally_connectable manifest addition | Low | manifest.json |
| P2 | Full referral dashboard in options | High | ReferralManager, stats API |
| P2 | Backend edge functions (5 endpoints) | High | Supabase setup |
| P2 | Anti-fraud measures | Medium | Backend |
| P2 | QR code generation | Low | QR library |
| P3 | Leaderboard (opt-in, anonymous) | Medium | Backend |
| P3 | Short link redirect (fmblk.co) | Low | Cloudflare Workers |
| P3 | A/B test infrastructure | Medium | Analytics system |
| P3 | Exclusive referral rewards (sounds, themes) | Medium | Asset creation |

**Recommended implementation order:**
1. **Foundation:** ReferralManager + storage schema + migration + message router
2. **Attribution chain:** Landing page + cookie + externally_connectable + manual entry
3. **User-facing:** Popup panel + onboarding update + options dashboard
4. **Backend:** Edge functions + database schema + anti-fraud
5. **Polish:** QR codes, short links, leaderboard, exclusive rewards

---

## Document Map

```
docs/
├── 14-growth-viral-engine.md                <- Phase 14 overview (if created)
└── growth-viral/
    ├── agent1-referral-attribution.md       <- THIS FILE
    ├── agent2-*.md                          <- Agent 2 output
    ├── agent3-*.md                          <- Agent 3 output
    ├── agent4-*.md                          <- Agent 4 output
    └── agent5-*.md                          <- Agent 5 output
```

---

*Phase 14 -- Growth & Viral Engine -- Agent 1 (Referral System Architecture & Attribution) -- Complete*
```
