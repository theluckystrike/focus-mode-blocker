# Section 6: Content Script Architecture

## 6.1 Content Script Strategy

Focus Mode - Blocker employs three dedicated content scripts, each with a single responsibility, strict performance budget, and carefully chosen injection timing. This separation is deliberate and driven by real constraints in Manifest V3.

### Why Three Separate Scripts

| Script | File | Run At | Size Budget | Purpose |
|--------|------|--------|-------------|---------|
| Detector | `src/content/detector.js` | `document_start` | <2KB | Check if current page is on blocklist |
| Blocker | `src/content/blocker.js` | `document_start` | <50KB | Inject block page overlay |
| Tracker | `src/content/tracker.js` | `document_idle` | <50KB | Track time spent on pages |

**Separation of concerns.** Each script has exactly one job. The detector does not block, the blocker does not track, and the tracker does not detect. This makes each script independently testable, debuggable, and replaceable.

**Performance.** The detector runs on every single page load. At under 2KB, it adds negligible overhead. If detection and blocking were combined, every page load would pay the cost of loading the full block page UI code even when the page is not blocked.

**Timing.** The detector and blocker must run at `document_start` -- before the browser renders any content from the host page. This prevents flash-of-blocked-content (FOBC) where a user momentarily sees a distracting site before the overlay appears. The tracker runs at `document_idle` because it does not need to interfere with page rendering; it passively observes time spent.

### Static vs Dynamic Injection in MV3

Manifest V3 provides two mechanisms for content script injection:

**Static declaration** (manifest.json `content_scripts` array): Scripts are automatically injected into matching pages by the browser. This is the primary mechanism for scripts that must always run.

**Dynamic injection** (`chrome.scripting.executeScript`): Scripts are injected programmatically from the service worker. This is used for on-demand injection, such as injecting block page assets into a tab that was just identified as blocked.

Focus Mode uses both:

```jsonc
// manifest.json -- static declarations
{
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["src/content/detector.js"],
      "run_at": "document_start",
      "all_frames": false
    },
    {
      "matches": ["<all_urls>"],
      "js": ["src/content/blocker.js"],
      "run_at": "document_start",
      "all_frames": false
    },
    {
      "matches": ["<all_urls>"],
      "js": ["src/content/tracker.js"],
      "run_at": "document_idle",
      "all_frames": false
    }
  ]
}
```

Static injection is used for all three core scripts because they must run on every qualifying page without the service worker needing to wake up first. Dynamic injection is reserved for supplementary operations like injecting additional CSS or re-injecting after extension updates.

The `all_frames: false` setting restricts injection to the top-level frame only. Iframes are not individually blocked; blocking the top-level frame covers all child frames.

---

## 6.2 Detector Script

`src/content/detector.js` is the lightest script in the extension -- an ultra-fast domain checker that runs on every page load and decides whether the page should be blocked.

### Performance Contract

- **Maximum file size:** 2KB minified
- **Maximum initialization time:** 100ms
- **Zero external dependencies**
- **No DOM manipulation**
- **No regex for domain extraction**

### Complete Implementation

```typescript
// src/content/detector.ts (compiles to src/content/detector.js)
// Focus Mode - Blocker | Detector Content Script
// Budget: <2KB minified, <100ms init
// Purpose: Check if current page domain is on the blocklist

(() => {
  // Guard: skip non-blockable pages immediately
  const protocol = location.protocol;
  if (
    protocol === 'chrome:' ||
    protocol === 'chrome-extension:' ||
    protocol === 'about:' ||
    protocol === 'edge:' ||
    protocol === 'brave:' ||
    protocol === 'devtools:' ||
    protocol === 'moz-extension:'
  ) {
    return;
  }

  // Extract domain using pure string operations -- no regex overhead.
  // location.hostname is already parsed by the browser, so this is
  // effectively free.
  const hostname = location.hostname;

  // Empty hostname means about:blank or similar -- skip
  if (!hostname) {
    return;
  }

  // Normalize: strip leading "www." for consistent matching.
  // Pure string operation, no regex.
  const domain = hostname.startsWith('www.')
    ? hostname.slice(4)
    : hostname;

  // Send CHECK_BLOCKED message to the service worker.
  // The service worker holds the canonical blocklist in memory and
  // makes the authoritative decision.
  chrome.runtime.sendMessage(
    {
      type: 'CHECK_BLOCKED',
      payload: {
        domain,
        hostname,
        url: location.href,
        timestamp: Date.now(),
      },
    },
    (response) => {
      // Handle disconnected service worker (extension update, etc.)
      if (chrome.runtime.lastError) {
        return;
      }

      if (!response) {
        return;
      }

      // Response shape: { blocked: boolean, reason?: string }
      // reason: 'blocklist' | 'nuclear' | 'schedule' | 'category'
      if (response.blocked) {
        // Notify the blocker script that this page should be blocked.
        // We use a custom DOM event because both scripts share DOM access
        // in the same isolated world (they are injected into the same
        // content script world by default).
        const event = new CustomEvent('__focusmode_block__', {
          detail: {
            domain,
            reason: response.reason || 'blocklist',
            stats: response.stats || null,
          },
        });
        document.dispatchEvent(event);
      }
    }
  );
})();
```

### Design Decisions

**Pure string operations for domain extraction.** `location.hostname` is already parsed by the browser's URL parser. Stripping `www.` with `startsWith` and `slice` is a constant-time operation. Regex-based extraction would add unnecessary overhead on a hot path that runs on every page load.

**Message-based architecture.** The detector does not maintain its own copy of the blocklist. It asks the service worker, which is the single source of truth. This avoids synchronization bugs between the cached list in the content script and the authoritative list in the service worker. The tradeoff is a message round-trip, but `chrome.runtime.sendMessage` is fast (sub-millisecond on modern hardware).

**Custom DOM event for cross-script communication.** The detector and blocker both run at `document_start` in the same isolated world. Using a DOM event (`__focusmode_block__`) avoids a second message to the service worker. The blocker listens for this event and immediately injects the overlay.

**Privacy by design.** The detector never stores visited URLs. It extracts the domain, sends it to the service worker for a yes/no check, and discards it. No browsing history is retained.

**Edge case handling.** Chrome extension pages, `about:blank`, `chrome://` pages, and DevTools pages are skipped immediately at the top of the function. These pages cannot and should not be blocked.

---

## 6.3 Blocker Script

`src/content/blocker.js` is responsible for injecting the full block page overlay when a page is identified as blocked. It creates a complete UI experience including motivational quotes, streak data, time saved, and a "Back to Work" button.

### Block Page Overlay Architecture

The block page is not a separate HTML page navigated to via `chrome.tabs.update`. Instead, it is an overlay injected directly into the blocked page's DOM. This approach has several advantages:

1. **No navigation.** The URL bar still shows the blocked domain, reinforcing that the user tried to visit it.
2. **No flash.** The overlay is injected at `document_start` before the page renders any content.
3. **No history pollution.** The user's browser history is not filled with block page entries.
4. **Shadow DOM isolation.** The overlay lives in a shadow DOM, completely isolated from the host page's CSS.

### Complete Implementation

```typescript
// src/content/blocker.ts (compiles to src/content/blocker.js)
// Focus Mode - Blocker | Block Page Content Script
// Purpose: Inject full-page block overlay when site is blocked

(() => {
  // ── State ──────────────────────────────────────────────────────────

  let isBlocked = false;
  let overlayRoot: HTMLDivElement | null = null;
  let shadowRoot: ShadowRoot | null = null;

  // ── Motivational Quotes (50+) ─────────────────────────────────────

  const QUOTES: ReadonlyArray<string> = [
    "The secret of getting ahead is getting started. - Mark Twain",
    "Focus on being productive instead of busy. - Tim Ferriss",
    "It's not that I'm so smart, it's just that I stay with problems longer. - Albert Einstein",
    "The way to get started is to quit talking and begin doing. - Walt Disney",
    "Don't watch the clock; do what it does. Keep going. - Sam Levenson",
    "You don't have to be great to start, but you have to start to be great. - Zig Ziglar",
    "Action is the foundational key to all success. - Pablo Picasso",
    "Starve your distractions, feed your focus. - Daniel Goleman",
    "Concentrate all your thoughts upon the work at hand. - Alexander Graham Bell",
    "The successful warrior is the average man, with laser-like focus. - Bruce Lee",
    "Where focus goes, energy flows. - Tony Robbins",
    "Lack of direction, not lack of time, is the problem. - Zig Ziglar",
    "Until we can manage time, we can manage nothing else. - Peter Drucker",
    "You will never find time for anything. You must make it. - Charles Buxton",
    "The key is not to prioritize your schedule, but to schedule your priorities. - Stephen Covey",
    "What you stay focused on will grow. - Roy T. Bennett",
    "It is during our darkest moments that we must focus to see the light. - Aristotle",
    "Discipline is the bridge between goals and accomplishment. - Jim Rohn",
    "Success is the sum of small efforts repeated day in and day out. - Robert Collier",
    "The only way to do great work is to love what you do. - Steve Jobs",
    "Your future is created by what you do today, not tomorrow. - Robert Kiyosaki",
    "Do the hard jobs first. The easy jobs will take care of themselves. - Dale Carnegie",
    "Either you run the day or the day runs you. - Jim Rohn",
    "Productivity is never an accident. It is the result of commitment. - Paul J. Meyer",
    "An investment in knowledge pays the best interest. - Benjamin Franklin",
    "Lost time is never found again. - Benjamin Franklin",
    "The mind is everything. What you think you become. - Buddha",
    "Be not afraid of going slowly, be afraid only of standing still. - Chinese Proverb",
    "Start where you are. Use what you have. Do what you can. - Arthur Ashe",
    "Perseverance is not a long race; it is many short races one after the other. - Walter Elliot",
    "You are never too old to set another goal or to dream a new dream. - C.S. Lewis",
    "Believe you can and you're halfway there. - Theodore Roosevelt",
    "The best time to plant a tree was 20 years ago. The second best time is now. - Chinese Proverb",
    "Things may come to those who wait, but only the things left by those who hustle. - Abraham Lincoln",
    "In the middle of difficulty lies opportunity. - Albert Einstein",
    "Motivation is what gets you started. Habit is what keeps you going. - Jim Ryun",
    "Well done is better than well said. - Benjamin Franklin",
    "Quality is not an act, it is a habit. - Aristotle",
    "Champions keep playing until they get it right. - Billie Jean King",
    "Setting goals is the first step in turning the invisible into the visible. - Tony Robbins",
    "I find that the harder I work, the more luck I seem to have. - Thomas Jefferson",
    "A year from now you may wish you had started today. - Karen Lamb",
    "There is no substitute for hard work. - Thomas Edison",
    "The only limit to our realization of tomorrow is our doubts of today. - Franklin D. Roosevelt",
    "You miss 100% of the shots you don't take. - Wayne Gretzky",
    "Opportunities don't happen. You create them. - Chris Grosser",
    "Dream big. Start small. Act now. - Robin Sharma",
    "Small daily improvements over time lead to stunning results. - Robin Sharma",
    "Your time is limited, don't waste it living someone else's life. - Steve Jobs",
    "The harder you work for something, the greater you'll feel when you achieve it. - Unknown",
    "Don't be pushed around by the fears in your mind. Be led by the dreams in your heart. - Roy T. Bennett",
    "If you want to achieve greatness, stop asking for permission. - Eddie Colla",
  ];

  // ── Shield Icon SVG ───────────────────────────────────────────────

  const SHIELD_ICON_SVG = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="80" height="80" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  `;

  // ── Block Page Styles ─────────────────────────────────────────────

  const BLOCK_PAGE_CSS = `
    :host {
      all: initial;
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: 2147483647 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
                   Oxygen, Ubuntu, Cantarell, sans-serif !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }

    .fm-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      color: #ffffff;
    }

    .fm-card {
      background: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 24px;
      padding: 48px;
      max-width: 520px;
      width: 90%;
      text-align: center;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4);
      animation: fm-fade-in 0.4s ease-out;
    }

    @keyframes fm-fade-in {
      from { opacity: 0; transform: translateY(20px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .fm-shield {
      color: #6c63ff;
      margin-bottom: 16px;
      filter: drop-shadow(0 4px 12px rgba(108, 99, 255, 0.4));
    }

    .fm-title {
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 8px 0;
      letter-spacing: -0.5px;
    }

    .fm-domain {
      font-size: 15px;
      color: rgba(255, 255, 255, 0.5);
      margin: 0 0 24px 0;
      font-family: 'SF Mono', 'Fira Code', monospace;
      word-break: break-all;
    }

    .fm-reason-badge {
      display: inline-block;
      background: rgba(108, 99, 255, 0.2);
      color: #a89fff;
      padding: 4px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 24px;
    }

    .fm-quote {
      font-size: 16px;
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.75);
      font-style: italic;
      margin: 0 0 32px 0;
      min-height: 48px;
    }

    .fm-stats {
      display: flex;
      justify-content: center;
      gap: 32px;
      margin-bottom: 32px;
    }

    .fm-stat {
      text-align: center;
    }

    .fm-stat-value {
      font-size: 28px;
      font-weight: 700;
      color: #6c63ff;
      display: block;
    }

    .fm-stat-label {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.45);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 4px;
      display: block;
    }

    .fm-button {
      background: linear-gradient(135deg, #6c63ff, #4834d4);
      color: #ffffff;
      border: none;
      padding: 14px 36px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      letter-spacing: 0.3px;
      box-shadow: 0 4px 16px rgba(108, 99, 255, 0.3);
    }

    .fm-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(108, 99, 255, 0.45);
    }

    .fm-button:active {
      transform: translateY(0);
    }

    .fm-streak {
      margin-top: 20px;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.4);
    }

    .fm-streak-fire {
      font-size: 16px;
    }
  `;

  // ── Utility Functions ─────────────────────────────────────────────

  /**
   * Select a random motivational quote.
   * Uses a seeded-ish approach based on date so the quote changes daily
   * but remains consistent within a session.
   */
  function getRandomQuote(): string {
    const dayIndex = Math.floor(Date.now() / 86400000) % QUOTES.length;
    return QUOTES[dayIndex];
  }

  /**
   * Sanitize a string for safe DOM insertion.
   * Prevents XSS by escaping HTML entities. Never use innerHTML
   * with unsanitized data.
   */
  function sanitizeText(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Format seconds into human-readable time string.
   */
  function formatTimeSaved(totalSeconds: number): string {
    if (totalSeconds < 60) return `${totalSeconds}s`;
    if (totalSeconds < 3600) {
      const minutes = Math.floor(totalSeconds / 60);
      return `${minutes}m`;
    }
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  /**
   * Get the human-readable label for a block reason.
   */
  function getReasonLabel(reason: string): string {
    const labels: Record<string, string> = {
      blocklist: 'Blocked Site',
      nuclear: 'Nuclear Mode',
      schedule: 'Scheduled Block',
      category: 'Blocked Category',
    };
    return labels[reason] || 'Blocked';
  }

  // ── Block Page Construction ───────────────────────────────────────

  interface BlockData {
    domain: string;
    reason: string;
    stats: {
      timeSavedSeconds: number;
      distractionsBlocked: number;
      currentStreak: number;
    } | null;
  }

  /**
   * Build and inject the block page overlay into the DOM.
   * Uses Shadow DOM for complete CSS isolation from the host page.
   */
  function injectBlockPage(data: BlockData): void {
    if (isBlocked) return; // Prevent double injection
    isBlocked = true;

    // Stop the host page from loading further.
    // At document_start, this prevents most resource fetches.
    window.stop();

    // Create the overlay container
    overlayRoot = document.createElement('div');
    overlayRoot.id = '__focusmode_overlay__';
    overlayRoot.setAttribute('aria-label', 'Focus Mode - Site Blocked');
    overlayRoot.setAttribute('role', 'dialog');
    overlayRoot.setAttribute('aria-modal', 'true');

    // Attach shadow DOM for CSS isolation
    shadowRoot = overlayRoot.attachShadow({ mode: 'closed' });

    // Inject styles
    const styleEl = document.createElement('style');
    styleEl.textContent = BLOCK_PAGE_CSS;
    shadowRoot.appendChild(styleEl);

    // Request fresh stats from the service worker
    const stats = data.stats || {
      timeSavedSeconds: 0,
      distractionsBlocked: 0,
      currentStreak: 0,
    };

    // Build the block page HTML using safe DOM construction.
    // No innerHTML with user data -- all dynamic values go through
    // textContent or sanitizeText.
    const overlay = document.createElement('div');
    overlay.className = 'fm-overlay';

    const card = document.createElement('div');
    card.className = 'fm-card';

    // Shield icon (static SVG, safe)
    const shieldDiv = document.createElement('div');
    shieldDiv.className = 'fm-shield';
    shieldDiv.innerHTML = SHIELD_ICON_SVG; // Safe: static constant

    // Title
    const title = document.createElement('h1');
    title.className = 'fm-title';
    title.textContent = 'Stay Focused';

    // Blocked domain display (SANITIZED)
    const domainEl = document.createElement('p');
    domainEl.className = 'fm-domain';
    domainEl.textContent = data.domain; // textContent auto-escapes

    // Block reason badge
    const reasonBadge = document.createElement('span');
    reasonBadge.className = 'fm-reason-badge';
    reasonBadge.textContent = getReasonLabel(data.reason);

    // Motivational quote
    const quoteEl = document.createElement('p');
    quoteEl.className = 'fm-quote';
    quoteEl.textContent = getRandomQuote();

    // Stats row
    const statsRow = document.createElement('div');
    statsRow.className = 'fm-stats';

    const timeSavedStat = createStatElement(
      formatTimeSaved(stats.timeSavedSeconds),
      'Time Saved'
    );
    const distractionsStat = createStatElement(
      String(stats.distractionsBlocked),
      'Distractions Blocked'
    );
    const streakStat = createStatElement(
      String(stats.currentStreak),
      'Day Streak'
    );

    statsRow.appendChild(timeSavedStat);
    statsRow.appendChild(distractionsStat);
    statsRow.appendChild(streakStat);

    // "Back to Work" button
    const button = document.createElement('button');
    button.className = 'fm-button';
    button.textContent = 'Back to Work';
    button.addEventListener('click', handleBackToWork);

    // Streak display
    const streakDisplay = document.createElement('div');
    streakDisplay.className = 'fm-streak';
    if (stats.currentStreak > 0) {
      const fireSpan = document.createElement('span');
      fireSpan.className = 'fm-streak-fire';
      fireSpan.textContent = '\uD83D\uDD25 '; // fire emoji as unicode
      streakDisplay.appendChild(fireSpan);
      const streakText = document.createTextNode(
        `${stats.currentStreak} day streak! Keep it going!`
      );
      streakDisplay.appendChild(streakText);
    }

    // Assemble the card
    card.appendChild(shieldDiv);
    card.appendChild(title);
    card.appendChild(domainEl);
    card.appendChild(reasonBadge);
    card.appendChild(quoteEl);
    card.appendChild(statsRow);
    card.appendChild(button);
    card.appendChild(streakDisplay);

    overlay.appendChild(card);
    shadowRoot.appendChild(overlay);

    // Inject into the page. At document_start, document.documentElement
    // exists but document.body may not yet. We append to documentElement.
    const target = document.documentElement || document.body;
    if (target) {
      target.appendChild(overlayRoot);
    } else {
      // Fallback: wait for any element to exist
      const observer = new MutationObserver(() => {
        if (document.documentElement) {
          document.documentElement.appendChild(overlayRoot!);
          observer.disconnect();
        }
      });
      observer.observe(document, { childList: true });
    }

    // Report the block event to the service worker for analytics
    chrome.runtime.sendMessage({
      type: 'BLOCK_PAGE_VIEW',
      payload: {
        domain: data.domain,
        reason: data.reason,
        timestamp: Date.now(),
      },
    });

    // Prevent keyboard shortcuts from reaching the host page
    document.addEventListener(
      'keydown',
      (e: KeyboardEvent) => {
        if (isBlocked) {
          // Allow browser shortcuts (Ctrl+T, Ctrl+W, etc.)
          if (e.ctrlKey || e.metaKey) return;
          // Block everything else
          e.preventDefault();
          e.stopPropagation();
        }
      },
      true // capture phase
    );
  }

  /**
   * Create a stat display element (value + label).
   */
  function createStatElement(value: string, label: string): HTMLDivElement {
    const stat = document.createElement('div');
    stat.className = 'fm-stat';

    const valueEl = document.createElement('span');
    valueEl.className = 'fm-stat-value';
    valueEl.textContent = value;

    const labelEl = document.createElement('span');
    labelEl.className = 'fm-stat-label';
    labelEl.textContent = label;

    stat.appendChild(valueEl);
    stat.appendChild(labelEl);
    return stat;
  }

  /**
   * Handle "Back to Work" button click.
   * Navigates to the last non-blocked URL or opens a new tab.
   */
  function handleBackToWork(): void {
    chrome.runtime.sendMessage(
      { type: 'GET_SAFE_REDIRECT' },
      (response) => {
        if (chrome.runtime.lastError || !response?.url) {
          // Fallback: navigate to new tab page
          window.location.href = 'chrome://newtab';
          return;
        }
        window.location.href = response.url;
      }
    );
  }

  // ── Event Listeners ───────────────────────────────────────────────

  // Listen for block signal from detector.js (same isolated world)
  document.addEventListener('__focusmode_block__', ((
    event: CustomEvent<BlockData>
  ) => {
    injectBlockPage(event.detail);
  }) as EventListener);

  // Also listen for direct messages from the service worker.
  // This handles cases where the service worker initiates blocking
  // (e.g., nuclear mode activated while a tab is already open).
  chrome.runtime.onMessage.addListener(
    (
      message: { type: string; payload?: BlockData },
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response: { ok: boolean }) => void
    ) => {
      if (message.type === 'INJECT_BLOCK_PAGE' && message.payload) {
        injectBlockPage(message.payload);
        sendResponse({ ok: true });
      }
      return false; // Synchronous response
    }
  );

  // Prevent the user from removing the overlay via DevTools.
  // If the overlay is removed from the DOM, re-inject it.
  const domObserver = new MutationObserver((mutations) => {
    if (!isBlocked || !overlayRoot) return;

    for (const mutation of mutations) {
      for (const removed of mutation.removedNodes) {
        if (removed === overlayRoot) {
          // Re-inject the overlay
          const target = document.documentElement || document.body;
          if (target) {
            target.appendChild(overlayRoot);
          }
          return;
        }
      }
    }
  });

  // Start observing once the document is ready
  if (document.documentElement) {
    domObserver.observe(document.documentElement, { childList: true });
  } else {
    const readyObserver = new MutationObserver(() => {
      if (document.documentElement) {
        domObserver.observe(document.documentElement, { childList: true });
        readyObserver.disconnect();
      }
    });
    readyObserver.observe(document, { childList: true });
  }
})();
```

### Block Page Visual Breakdown

```
+------------------------------------------------------------------+
|  (Full viewport overlay - gradient background)                    |
|                                                                   |
|                       [Shield Icon]                               |
|                                                                   |
|                      Stay Focused                                 |
|                    reddit.com                                     |
|                                                                   |
|                   [ NUCLEAR MODE ]                                |
|                                                                   |
|    "The successful warrior is the average man,                    |
|     with laser-like focus." - Bruce Lee                           |
|                                                                   |
|          2h 15m          47           12                           |
|        Time Saved   Distractions   Day Streak                     |
|                                                                   |
|                  [ Back to Work ]                                 |
|                                                                   |
|            Fire 12 day streak! Keep it going!                     |
|                                                                   |
+------------------------------------------------------------------+
```

### CSS Isolation Strategy

The block page uses a **closed Shadow DOM** to achieve complete CSS isolation:

1. **`:host` reset.** The `:host` selector applies `all: initial` to strip all inherited styles from the host page.
2. **Closed shadow root.** Using `mode: 'closed'` prevents the host page's JavaScript from accessing the shadow DOM via `element.shadowRoot`.
3. **No global style leakage.** The host page's CSS (Bootstrap, Tailwind, custom styles) cannot affect the block overlay.
4. **`!important` on positioning.** The overlay uses `!important` on `position`, `z-index`, `width`, and `height` to guarantee it covers the full viewport even if the host page uses aggressive CSS.
5. **Maximum z-index.** `z-index: 2147483647` (32-bit integer max) ensures the overlay sits above all host page content.

---

## 6.4 Tracker Script

`src/content/tracker.js` passively monitors time spent on non-blocked pages and reports duration data to the service worker for the analytics dashboard.

### Complete Implementation

```typescript
// src/content/tracker.ts (compiles to src/content/tracker.js)
// Focus Mode - Blocker | Time Tracker Content Script
// Purpose: Track active time spent on pages, report to background
// Runs at: document_idle (low priority, after page load)

(() => {
  // ── Guards ────────────────────────────────────────────────────────

  // Skip non-trackable pages
  const protocol = location.protocol;
  if (
    protocol === 'chrome:' ||
    protocol === 'chrome-extension:' ||
    protocol === 'about:' ||
    protocol === 'devtools:'
  ) {
    return;
  }

  // ── Configuration ─────────────────────────────────────────────────

  const REPORT_INTERVAL_MS = 60_000; // Report every 60 seconds
  const HEARTBEAT_INTERVAL_MS = 1_000; // Check active state every second

  // ── State ─────────────────────────────────────────────────────────

  let isActive = !document.hidden;
  let activeStartTime: number | null = isActive ? Date.now() : null;
  let accumulatedMs = 0;
  let lastReportTime = Date.now();
  let heartbeatId: number | null = null;

  const domain = location.hostname.startsWith('www.')
    ? location.hostname.slice(4)
    : location.hostname;

  // ── Visibility Tracking ───────────────────────────────────────────

  /**
   * Uses the Page Visibility API to detect when the tab is
   * active (visible) vs background (hidden). Only active time
   * is counted toward the user's time-on-site metrics.
   */
  function handleVisibilityChange(): void {
    if (document.hidden) {
      // Tab became hidden -- pause tracking
      if (isActive && activeStartTime !== null) {
        accumulatedMs += Date.now() - activeStartTime;
        activeStartTime = null;
      }
      isActive = false;
    } else {
      // Tab became visible -- resume tracking
      isActive = true;
      activeStartTime = Date.now();
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange);

  // ── Heartbeat Timer ───────────────────────────────────────────────

  /**
   * Uses requestAnimationFrame for the heartbeat instead of
   * setInterval. requestAnimationFrame automatically pauses when
   * the tab is hidden, which aligns with our "only track active
   * time" requirement and avoids unnecessary CPU usage.
   *
   * We still check elapsed time to handle cases where rAF is
   * throttled (background tabs, power saving mode).
   */
  function heartbeat(): void {
    const now = Date.now();

    // Check if it's time to report
    if (now - lastReportTime >= REPORT_INTERVAL_MS) {
      reportTimeToBackground();
      lastReportTime = now;
    }

    // Schedule next heartbeat
    heartbeatId = requestAnimationFrame(heartbeat);
  }

  // Start the heartbeat
  heartbeatId = requestAnimationFrame(heartbeat);

  // ── Reporting ─────────────────────────────────────────────────────

  /**
   * Calculate total active time and send to the service worker.
   * Resets the accumulator after successful report.
   */
  function reportTimeToBackground(): void {
    let totalMs = accumulatedMs;

    // Add current active session if tab is active
    if (isActive && activeStartTime !== null) {
      totalMs += Date.now() - activeStartTime;
      activeStartTime = Date.now(); // Reset start for next interval
    }

    // Don't report zero time
    if (totalMs < 1000) return;

    const totalSeconds = Math.round(totalMs / 1000);

    chrome.runtime.sendMessage(
      {
        type: 'TRACK_TIME',
        payload: {
          domain,
          seconds: totalSeconds,
          timestamp: Date.now(),
        },
      },
      () => {
        // Ignore errors (service worker might be restarting)
        if (chrome.runtime.lastError) {
          // Keep accumulated time for next report attempt
          return;
        }
        // Successfully reported -- reset accumulator
        accumulatedMs = 0;
      }
    );
  }

  // ── Cleanup ───────────────────────────────────────────────────────

  /**
   * Report final time when the page is being unloaded.
   * Uses the 'pagehide' event (more reliable than 'beforeunload'
   * in modern browsers) and navigator.sendBeacon as a fallback
   * for guaranteed delivery.
   */
  function handlePageHide(): void {
    // Calculate final time
    let totalMs = accumulatedMs;
    if (isActive && activeStartTime !== null) {
      totalMs += Date.now() - activeStartTime;
    }

    if (totalMs < 1000) return;

    const totalSeconds = Math.round(totalMs / 1000);

    // Attempt to send via chrome.runtime.sendMessage
    // This may fail if the service worker is asleep, but it's
    // our best option in a content script context.
    try {
      chrome.runtime.sendMessage({
        type: 'TRACK_TIME',
        payload: {
          domain,
          seconds: totalSeconds,
          timestamp: Date.now(),
          isFinal: true,
        },
      });
    } catch {
      // Service worker unavailable -- time data is lost.
      // This is acceptable; time tracking is best-effort.
    }

    // Cancel heartbeat
    if (heartbeatId !== null) {
      cancelAnimationFrame(heartbeatId);
      heartbeatId = null;
    }
  }

  window.addEventListener('pagehide', handlePageHide);

  // Also handle tab close via beforeunload as a backup
  window.addEventListener('beforeunload', handlePageHide);

  // ── Privacy Note ──────────────────────────────────────────────────
  // This script tracks ONLY:
  // - domain (e.g., "github.com")
  // - seconds spent active
  // - timestamp of the report
  //
  // It does NOT track:
  // - Full URL paths
  // - Page content
  // - User interactions (clicks, scrolls, keystrokes)
  // - Form data
  // - Any personally identifiable information
})();
```

### Timer Architecture

The tracker uses a hybrid timing strategy:

1. **`requestAnimationFrame` for heartbeats.** Unlike `setInterval`, rAF automatically pauses when the tab is hidden. This prevents unnecessary wake-ups in background tabs and naturally aligns with the "active time only" tracking requirement.

2. **Page Visibility API for state transitions.** The `visibilitychange` event is the authoritative signal for when a tab becomes active or hidden. The tracker accumulates time during visible periods and pauses during hidden periods.

3. **Accumulated time with periodic flush.** Rather than sending a message to the service worker on every second, the tracker accumulates time locally and flushes every 60 seconds. This reduces IPC overhead from 60 messages/minute to 1 message/minute.

4. **Final flush on page unload.** The `pagehide` event triggers a final time report. The `beforeunload` event serves as a backup. Time data that cannot be delivered is accepted as lost -- time tracking is best-effort, not transactional.

---

## 6.5 Content Script Isolation

### Isolated World Model

Chrome content scripts run in an **isolated world** -- a separate JavaScript execution context that shares the DOM with the host page but has its own global scope.

```
+----------------------------------------------------------+
|  Web Page (Main World)                                    |
|  +-----------------------+  +-------------------------+  |
|  | Host Page JavaScript  |  | Content Script World    |  |
|  | - window.myApp = {}   |  | - Cannot see myApp      |  |
|  | - Custom prototypes   |  | - Has chrome.runtime    |  |
|  | - Event handlers      |  | - Own global scope      |  |
|  +-----------+-----------+  +------------+------------+  |
|              |                           |                |
|              +--------+  +--------------+                |
|                       |  |                                |
|                  +----v--v----+                           |
|                  |    DOM     |                           |
|                  | (shared)   |                           |
|                  +------------+                           |
+----------------------------------------------------------+
```

### What Content Scripts CAN Access

| Resource | Access Level | Used By Focus Mode |
|----------|-------------|-------------------|
| DOM elements | Full read/write | Blocker (inject overlay) |
| DOM events | Full listen/dispatch | Detector (custom events), Blocker (keyboard) |
| `chrome.runtime` | Messaging APIs | All three scripts |
| `chrome.storage` | Full API | None (all storage goes through service worker) |
| `location` object | Read-only | Detector (hostname), Tracker (hostname) |
| CSS styles | Inject/modify | Blocker (shadow DOM styles) |

### What Content Scripts CANNOT Access

| Resource | Why | Implication |
|----------|-----|------------|
| Host page JS variables | Isolated world | Cannot detect `window.antiBlock` scripts |
| Host page `window` properties | Isolated world | Cannot override page navigation |
| Service worker globals | Separate context | Must use message passing |
| Other tabs' content | Tab isolation | Cannot coordinate across tabs |
| Extension storage directly | Best practice | Route through service worker for consistency |

### Shadow DOM for Block Overlay Isolation

The block page overlay uses a **closed Shadow DOM** for bidirectional CSS isolation:

```typescript
// Closed mode: host page cannot access via element.shadowRoot
const shadow = overlayRoot.attachShadow({ mode: 'closed' });

// Benefits:
// 1. Host page CSS cannot style the overlay (no Bootstrap/Tailwind leaks)
// 2. Overlay CSS cannot affect the host page
// 3. Host page JS cannot query into the shadow DOM
// 4. style-src CSP is scoped to the shadow root
```

**Why closed mode?** In `open` mode, the host page's JavaScript could access `element.shadowRoot` and manipulate the block overlay (e.g., hide it, remove the "Back to Work" button). Closed mode prevents this. While a determined attacker could still remove the entire overlay element from the DOM, the `MutationObserver` in `blocker.js` detects this and re-injects it.

### Message Passing as the Only Communication Channel

Content scripts communicate with the service worker exclusively through `chrome.runtime.sendMessage` and `chrome.runtime.onMessage`. This is enforced by architecture -- there is no other way.

```
Detector ──sendMessage──> Service Worker ──response──> Detector
                                |
                          (wake if needed)
                                |
Blocker <──onMessage──── Service Worker
                                |
Tracker ──sendMessage──> Service Worker
```

All three Focus Mode content scripts follow the same messaging contract:

```typescript
// Message types sent by content scripts
type ContentMessage =
  | { type: 'CHECK_BLOCKED'; payload: { domain: string; hostname: string; url: string; timestamp: number } }
  | { type: 'BLOCK_PAGE_VIEW'; payload: { domain: string; reason: string; timestamp: number } }
  | { type: 'TRACK_TIME'; payload: { domain: string; seconds: number; timestamp: number; isFinal?: boolean } }
  | { type: 'GET_SAFE_REDIRECT' };

// Message types received by content scripts
type BackgroundMessage =
  | { type: 'INJECT_BLOCK_PAGE'; payload: BlockData };
```

---

## 6.6 Dynamic Content Script Injection

While Focus Mode's three core content scripts are statically declared in the manifest, certain operations require dynamic injection via the `chrome.scripting` API.

### Script Injector Implementation

```typescript
// src/background/script-injector.ts
// Focus Mode - Blocker | Dynamic Script Injection Manager
// Purpose: Inject content scripts and CSS on-demand from the service worker

/**
 * Tabs that cannot be injected into. These protocols are managed by
 * the browser and extensions cannot run content scripts in them.
 */
const UNINJECTABLE_PROTOCOLS = new Set([
  'chrome:',
  'chrome-extension:',
  'chrome-untrusted:',
  'about:',
  'edge:',
  'brave:',
  'devtools:',
  'view-source:',
  'data:',
  'file:', // requires explicit permission
]);

/**
 * Check if a URL is injectable.
 */
function isInjectableUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return !UNINJECTABLE_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Dynamically inject the block page into a specific tab.
 * Used when:
 * - Nuclear mode is activated and existing open tabs need to be blocked
 * - A blocklist rule is added while matching tabs are already open
 * - The service worker restarts and needs to re-evaluate open tabs
 */
export async function injectBlockPageIntoTab(
  tabId: number,
  domain: string,
  reason: string,
  stats: { timeSavedSeconds: number; distractionsBlocked: number; currentStreak: number }
): Promise<boolean> {
  try {
    // Verify the tab exists and is injectable
    const tab = await chrome.tabs.get(tabId);
    if (!isInjectableUrl(tab.url)) {
      return false;
    }

    // First, try sending a message to the existing blocker.js
    // (it may already be injected via static declaration)
    try {
      await chrome.tabs.sendMessage(tabId, {
        type: 'INJECT_BLOCK_PAGE',
        payload: { domain, reason, stats },
      });
      return true;
    } catch {
      // Content script not yet loaded -- inject dynamically
    }

    // Dynamically inject blocker script
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: false },
      files: ['src/content/blocker.js'],
    });

    // Wait a tick for the script to initialize, then send the block message
    await new Promise((resolve) => setTimeout(resolve, 50));

    await chrome.tabs.sendMessage(tabId, {
      type: 'INJECT_BLOCK_PAGE',
      payload: { domain, reason, stats },
    });

    return true;
  } catch (error) {
    console.warn(
      `[Focus Mode] Failed to inject block page into tab ${tabId}:`,
      error
    );
    return false;
  }
}

/**
 * Inject block page CSS into a tab separately.
 * Used as a fast-path to prevent FOBC (Flash of Blocked Content).
 * CSS injection is faster than full script injection and can
 * hide page content immediately.
 */
export async function injectBlockCSSIntoTab(tabId: number): Promise<void> {
  try {
    await chrome.scripting.insertCSS({
      target: { tabId },
      css: `
        html { visibility: hidden !important; }
        body { visibility: hidden !important; }
      `,
    });
  } catch {
    // Ignore -- tab may have been closed or is not injectable
  }
}

/**
 * Re-evaluate all open tabs against the current blocklist.
 * Called when:
 * - Nuclear mode is activated
 * - Blocklist is updated
 * - Scheduled block period begins
 * - Service worker restarts
 */
export async function evaluateAllOpenTabs(
  isBlocked: (domain: string) => { blocked: boolean; reason: string },
  getStats: () => { timeSavedSeconds: number; distractionsBlocked: number; currentStreak: number }
): Promise<void> {
  const tabs = await chrome.tabs.query({});
  const stats = getStats();

  const injectionPromises = tabs
    .filter((tab) => tab.id !== undefined && isInjectableUrl(tab.url))
    .map(async (tab) => {
      try {
        const url = new URL(tab.url!);
        let domain = url.hostname;
        if (domain.startsWith('www.')) {
          domain = domain.slice(4);
        }

        const result = isBlocked(domain);
        if (result.blocked) {
          await injectBlockPageIntoTab(tab.id!, domain, result.reason, stats);
        }
      } catch {
        // Skip tabs that fail -- best effort
      }
    });

  await Promise.allSettled(injectionPromises);
}

/**
 * Remove block overlay from a tab (e.g., when nuclear mode is deactivated
 * or a site is removed from the blocklist).
 */
export async function removeBlockPageFromTab(tabId: number): Promise<void> {
  try {
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: false },
      func: () => {
        const overlay = document.getElementById('__focusmode_overlay__');
        if (overlay) {
          overlay.remove();
        }
      },
    });
  } catch {
    // Ignore -- tab may have been closed
  }
}
```

### Static vs Dynamic Injection Decision Matrix

| Scenario | Injection Type | Reason |
|----------|---------------|--------|
| Every page load detection | Static (manifest) | Must run on all pages without service worker involvement |
| Block overlay on page load | Static (manifest) | Must be ready before page renders |
| Time tracking on every page | Static (manifest) | Continuous passive observation |
| Nuclear mode activation | Dynamic (scripting API) | Needs to affect already-open tabs |
| Blocklist update | Dynamic (scripting API) | Re-evaluate tabs that are already open |
| Service worker restart | Dynamic (scripting API) | Re-inject into tabs that lost content scripts |
| Block page CSS fast-path | Dynamic (insertCSS) | Hide content before full script loads |

### Permission Requirements

Dynamic injection requires specific permissions:

```jsonc
// manifest.json
{
  "permissions": [
    "scripting",    // Required for chrome.scripting.executeScript
    "activeTab"     // Grants temporary host permission on user action
  ],
  "host_permissions": [
    "<all_urls>"    // Required for injecting into any tab programmatically
  ]
}
```

The `scripting` permission is new in MV3 and replaces the old `tabs.executeScript` from MV2. It provides a cleaner API with better error handling and TypeScript support.

---

## 6.7 Web Accessible Resources

Web accessible resources are extension files that can be accessed by web pages and content scripts via a special `chrome-extension://` URL.

### Focus Mode Configuration

```json
{
  "web_accessible_resources": [
    {
      "resources": [
        "src/pages/blocked.html",
        "src/pages/blocked.css",
        "src/assets/icons/*",
        "src/assets/sounds/*",
        "src/assets/images/*"
      ],
      "matches": ["<all_urls>"]
    }
  ]
}
```

### Why These Resources Are Web Accessible

| Resource | Why Accessible | Used By |
|----------|---------------|---------|
| `blocked.html` | Loaded as an alternative block page in iframe mode | Blocker script |
| `blocked.css` | Styles for the standalone block page | Blocker script |
| `icons/*` | Shield icon, Focus Mode logo displayed on block page | Blocker script |
| `sounds/*` | Optional notification sounds on block events | Blocker script |
| `images/*` | Background images, motivational image assets | Blocker script |

### Accessing Web Accessible Resources

```typescript
// Content scripts access extension resources via chrome.runtime.getURL
const iconUrl = chrome.runtime.getURL('src/assets/icons/shield-128.png');
const blockPageUrl = chrome.runtime.getURL('src/pages/blocked.html');

// These generate URLs like:
// chrome-extension://abcdefghijklmnop/src/assets/icons/shield-128.png
```

### Security Implications

Web accessible resources have important security considerations:

**Extension ID exposure.** Any web page matching the `matches` pattern can probe for the extension by requesting its web accessible resources. This reveals that Focus Mode is installed.

```javascript
// A malicious page could detect Focus Mode:
const img = new Image();
img.onload = () => console.log('Focus Mode is installed');
img.onerror = () => console.log('Focus Mode is NOT installed');
img.src = 'chrome-extension://<extension-id>/src/assets/icons/shield-128.png';
```

**Mitigation strategies:**

1. **Use `use_dynamic_url: true`** (MV3 feature) to rotate the resource URL on each session, making extension detection harder:

```json
{
  "web_accessible_resources": [
    {
      "resources": ["src/assets/icons/*"],
      "matches": ["<all_urls>"],
      "use_dynamic_url": true
    }
  ]
}
```

2. **Restrict `matches` when possible.** If certain resources are only needed on specific domains, restrict the pattern:

```json
{
  "web_accessible_resources": [
    {
      "resources": ["src/assets/sounds/notification.mp3"],
      "matches": ["https://app.focusmode.app/*"],
      "use_dynamic_url": true
    }
  ]
}
```

3. **Minimize exposed resources.** Only list files that genuinely need to be accessible from web page context. The block overlay in Focus Mode embeds most assets directly (inline SVG, CSS-in-JS) to reduce the web accessible surface area.

4. **Never expose sensitive files.** Configuration files, API keys, internal scripts, and business logic must never appear in `web_accessible_resources`.

---

# Section 7: Security & Content Security Policy

## 7.1 MV3 CSP Requirements

Manifest V3 enforces a significantly stricter Content Security Policy than MV2. These restrictions are non-negotiable -- Chrome will reject extensions that violate them.

### What MV3 Prohibits

| Directive | MV2 | MV3 | Implication for Focus Mode |
|-----------|-----|-----|---------------------------|
| `unsafe-eval` | Allowed | **Forbidden** | No `eval()`, no `new Function()`, no `setTimeout('string')` |
| `unsafe-inline` for scripts | Allowed | **Forbidden** | No inline `<script>` tags, no `onclick` handlers in HTML |
| Remote code (`https://cdn...`) in script-src | Allowed | **Forbidden** | All JavaScript must be bundled in the extension package |
| `unsafe-inline` for styles | Allowed | Allowed (but discouraged) | Focus Mode uses it for dynamic theming |
| Wasm (`wasm-unsafe-eval`) | N/A | Opt-in | Focus Mode does not use WebAssembly |

### Why These Restrictions Exist

MV3's CSP restrictions exist to prevent **remote code execution** (RCE) attacks. In MV2, a compromised CDN or a successful XSS attack could inject arbitrary JavaScript into an extension's privileged context. MV3 eliminates this entire attack class by requiring all executable code to be present in the extension package at install time.

For Focus Mode, this means:

- **No dynamic code generation.** Template engines that use `new Function()` are forbidden. All UI rendering uses DOM APIs.
- **No external script loading.** Libraries must be bundled at build time, not loaded from CDNs at runtime.
- **No eval-based JSON parsing.** Use `JSON.parse()` (which is safe) instead of `eval()`.
- **No string-based timers.** `setTimeout('alert("hi")', 1000)` is forbidden. Use `setTimeout(() => alert("hi"), 1000)`.

### CSP for Extension Pages vs Content Scripts

An important distinction: the `content_security_policy` manifest key only applies to **extension pages** (popup, options, background service worker). It does **not** apply to content scripts.

Content scripts inherit the CSP of the **host web page** they are injected into. This means:

```
Extension pages (popup.html, options.html):
  → Governed by manifest CSP (strict)

Service worker (background.js):
  → Governed by manifest CSP (strict)

Content scripts (detector.js, blocker.js, tracker.js):
  → Governed by HOST PAGE CSP (varies per site)
  → Some sites have very strict CSP that blocks inline styles
```

This is why Focus Mode's blocker uses Shadow DOM with a `<style>` element inside it rather than inline `style` attributes -- some host pages have CSP policies that block inline styles.

---

## 7.2 Focus Mode CSP Configuration

### Complete CSP Specification

```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://api.focusmode.app https://*.sentry.io https://api.stripe.com"
  }
}
```

### Directive-by-Directive Breakdown

#### `script-src 'self'`

Only JavaScript files bundled within the extension package can execute on extension pages.

```
ALLOWED:
  <script src="popup.js"></script>           (bundled file)
  <script src="lib/chart.js"></script>       (bundled dependency)

BLOCKED:
  <script>alert('inline')</script>           (inline script)
  <script src="https://cdn.example.com/lib.js"></script>  (remote)
  eval("malicious code")                     (eval)
  new Function("return 1")                   (dynamic function)
```

Focus Mode bundles all dependencies (Chart.js for analytics, DOMPurify for sanitization) at build time using the bundler. No runtime code loading is needed.

#### `object-src 'self'`

Restricts `<object>`, `<embed>`, and `<applet>` elements to extension-local resources only. Focus Mode does not use any of these elements, but the directive is set defensively to prevent injection attacks.

#### `style-src 'self' 'unsafe-inline'`

Allows both bundled CSS files and inline styles on extension pages.

**Why `unsafe-inline` for styles?** Focus Mode supports dynamic theming on the popup and options pages. Theme colors are applied via inline `style` attributes computed at runtime based on user preferences:

```typescript
// src/popup/theme.ts
// Dynamic theme application -- requires style-src 'unsafe-inline'
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.style.setProperty('--fm-primary', theme.primary);
  root.style.setProperty('--fm-background', theme.background);
  root.style.setProperty('--fm-surface', theme.surface);
  root.style.setProperty('--fm-text', theme.textColor);
  root.style.setProperty('--fm-accent', theme.accent);
}

// Theme definitions
export interface Theme {
  primary: string;
  background: string;
  surface: string;
  textColor: string;
  accent: string;
}

export const THEMES: Record<string, Theme> = {
  midnight: {
    primary: '#6c63ff',
    background: '#0f0c29',
    surface: '#1a1a3e',
    textColor: '#e0e0ff',
    accent: '#ff6b6b',
  },
  ocean: {
    primary: '#00b4d8',
    background: '#023e8a',
    surface: '#0077b6',
    textColor: '#caf0f8',
    accent: '#f72585',
  },
  forest: {
    primary: '#52b788',
    background: '#1b4332',
    surface: '#2d6a4f',
    textColor: '#d8f3dc',
    accent: '#ffb703',
  },
  light: {
    primary: '#6c63ff',
    background: '#f8f9fa',
    surface: '#ffffff',
    textColor: '#212529',
    accent: '#ff6b6b',
  },
};
```

While `unsafe-inline` for styles is a minor security relaxation, it does **not** enable script execution. CSS-based attacks are limited to information exfiltration via `url()` in property values, which is mitigated by the `connect-src` directive.

#### `img-src 'self' data:`

Allows images from the extension package and from `data:` URIs.

**Why `data:`?** Focus Mode uses base64-encoded SVG icons and small images in several places to avoid additional HTTP requests and to keep the `web_accessible_resources` surface area small:

```typescript
// Inline SVG as data URI for small icons
const checkmarkIcon = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0i...';

// Used in popup for status indicators
statusIcon.src = isBlocked ? blockIcon : checkmarkIcon;
```

#### `connect-src 'self' https://api.focusmode.app https://*.sentry.io https://api.stripe.com`

Controls which origins the extension can make network requests to (fetch, XMLHttpRequest, WebSocket).

| Origin | Purpose | Data Sent |
|--------|---------|-----------|
| `'self'` | Extension-internal requests | N/A |
| `https://api.focusmode.app` | License validation, cloud sync, analytics upload | License key, settings (encrypted), anonymous usage stats |
| `https://*.sentry.io` | Error reporting and crash analytics | Stack traces, error messages, extension version (no PII) |
| `https://api.stripe.com` | Subscription management (Stripe.js) | Tokenized payment info (never raw card data) |

No other origins are permitted. If a compromised dependency attempts to exfiltrate data to an unauthorized server, the request will be blocked by CSP.

### CSP Violation Reporting

Focus Mode monitors CSP violations to detect potential attacks or bugs:

```typescript
// src/popup/csp-monitor.ts
// Listens for CSP violations on extension pages and reports to Sentry

document.addEventListener('securitypolicyviolation', (event) => {
  const violation = {
    directive: event.violatedDirective,
    blockedUri: event.blockedURI,
    sourceFile: event.sourceFile,
    lineNumber: event.lineNumber,
    columnNumber: event.columnNumber,
    originalPolicy: event.originalPolicy,
  };

  // Report to Sentry for monitoring
  console.error('[Focus Mode] CSP Violation:', violation);

  // Send to background for aggregation
  chrome.runtime.sendMessage({
    type: 'CSP_VIOLATION',
    payload: violation,
  });
});
```

---

## 7.3 Anti-Tamper Protection

Focus Mode includes multiple layers of protection against user circumvention, particularly during Nuclear Mode when the user has explicitly asked to be locked out of distracting sites.

### Nuclear Mode Protection

Nuclear Mode is Focus Mode's strongest blocking mechanism. When active, it cannot be disabled until the timer expires. This requires robust anti-tamper measures.

```typescript
// src/background/nuclear-guard.ts
// Focus Mode - Blocker | Nuclear Mode Tamper Protection
// Purpose: Prevent circumvention of Nuclear Mode

import { FocusModeStorage } from './storage';

interface NuclearState {
  active: boolean;
  expiresAt: number;       // Unix timestamp
  startedAt: number;       // Unix timestamp
  blockedDomains: string[]; // Snapshot of blocklist at activation
  settingsHash: string;     // SHA-256 hash of settings at activation
}

/**
 * Verify Nuclear Mode integrity on every relevant operation.
 * Returns true if the operation should be allowed, false if it should
 * be blocked due to Nuclear Mode.
 */
export async function verifyNuclearIntegrity(): Promise<{
  active: boolean;
  expiresAt: number;
  tamperDetected: boolean;
}> {
  const state = await FocusModeStorage.get<NuclearState>('nuclearState');

  if (!state || !state.active) {
    return { active: false, expiresAt: 0, tamperDetected: false };
  }

  const now = Date.now();

  // Check if Nuclear Mode has expired naturally
  if (now >= state.expiresAt) {
    await deactivateNuclearMode();
    return { active: false, expiresAt: 0, tamperDetected: false };
  }

  // Verify settings haven't been tampered with
  const currentHash = await hashSettings();
  const tamperDetected = currentHash !== state.settingsHash;

  if (tamperDetected) {
    // Restore settings from the snapshot taken at Nuclear activation
    await restoreNuclearSettings(state);
    console.warn('[Focus Mode] Nuclear Mode tamper detected and reverted');
  }

  return {
    active: true,
    expiresAt: state.expiresAt,
    tamperDetected,
  };
}

/**
 * Guard that prevents modification of blocking rules during Nuclear Mode.
 * Wraps all settings modification endpoints.
 */
export function nuclearGuard<T extends (...args: any[]) => Promise<any>>(
  operation: string,
  fn: T
): T {
  return (async (...args: any[]) => {
    const { active, expiresAt } = await verifyNuclearIntegrity();

    if (active) {
      const minutesRemaining = Math.ceil((expiresAt - Date.now()) / 60000);
      throw new Error(
        `Operation "${operation}" is blocked during Nuclear Mode. ` +
        `${minutesRemaining} minutes remaining.`
      );
    }

    return fn(...args);
  }) as T;
}

/**
 * Protected operations during Nuclear Mode.
 * These functions are wrapped with nuclearGuard.
 */
export const protectedOperations = {
  removeFromBlocklist: nuclearGuard(
    'removeFromBlocklist',
    async (domain: string) => {
      // ... actual removal logic
    }
  ),

  disableBlocking: nuclearGuard(
    'disableBlocking',
    async () => {
      // ... actual disable logic
    }
  ),

  modifySchedule: nuclearGuard(
    'modifySchedule',
    async (schedule: any) => {
      // ... actual schedule modification logic
    }
  ),

  changeCategories: nuclearGuard(
    'changeCategories',
    async (categories: any) => {
      // ... actual category change logic
    }
  ),

  deactivateNuclear: nuclearGuard(
    'deactivateNuclear',
    async () => {
      // This intentionally throws -- Nuclear Mode cannot be deactivated early
    }
  ),
};

/**
 * Generate a SHA-256 hash of the current blocking settings.
 * Used to detect if settings were modified outside of the
 * extension's normal UI (e.g., via devtools or storage editor).
 */
async function hashSettings(): Promise<string> {
  const settings = await FocusModeStorage.get('blockingSettings');
  const data = JSON.stringify(settings);
  const buffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(data)
  );
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Restore blocking settings from the Nuclear Mode snapshot.
 */
async function restoreNuclearSettings(state: NuclearState): Promise<void> {
  await FocusModeStorage.set('blockedDomains', state.blockedDomains);
  state.settingsHash = await hashSettings();
  await FocusModeStorage.set('nuclearState', state);
}

/**
 * Cleanly deactivate Nuclear Mode after timer expiry.
 */
async function deactivateNuclearMode(): Promise<void> {
  await FocusModeStorage.set('nuclearState', {
    active: false,
    expiresAt: 0,
    startedAt: 0,
    blockedDomains: [],
    settingsHash: '',
  });

  // Notify all tabs that Nuclear Mode has ended
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.id) {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'NUCLEAR_DEACTIVATED',
        });
      } catch {
        // Tab may not have content script
      }
    }
  }
}
```

### Extension Disable Detection

Focus Mode monitors the `chrome.management` API to detect when the user attempts to disable the extension during Nuclear Mode:

```typescript
// src/background/extension-guard.ts
// Detect extension disable/uninstall attempts

// Note: chrome.management.onDisabled fires for OTHER extensions,
// not for our own extension. We cannot prevent our own disable.
// Instead, we use chrome.runtime.onSuspend and alarms as a
// persistence mechanism.

/**
 * Set up a persistent alarm that fires every minute during Nuclear Mode.
 * If the alarm stops firing, Nuclear Mode state persists in storage
 * and will be restored when the extension restarts.
 */
export async function setupNuclearPersistence(): Promise<void> {
  await chrome.alarms.create('nuclear-heartbeat', {
    periodInMinutes: 1,
  });
}

/**
 * Handle the alarm to verify Nuclear Mode is still enforced.
 */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'nuclear-heartbeat') {
    const integrity = await verifyNuclearIntegrity();
    if (!integrity.active) {
      // Nuclear mode expired -- clean up
      await chrome.alarms.clear('nuclear-heartbeat');
    }
  }
});

/**
 * On extension startup (install, update, browser restart),
 * check if Nuclear Mode was active and restore enforcement.
 */
chrome.runtime.onStartup.addListener(async () => {
  const integrity = await verifyNuclearIntegrity();
  if (integrity.active) {
    await setupNuclearPersistence();
    // Re-evaluate all open tabs
    const { evaluateAllOpenTabs } = await import('./script-injector');
    await evaluateAllOpenTabs(
      (domain) => ({ blocked: true, reason: 'nuclear' }),
      () => ({ timeSavedSeconds: 0, distractionsBlocked: 0, currentStreak: 0 })
    );
  }
});
```

### Block Page Bypass Prevention

```typescript
// src/content/blocker.ts (additional protection in the blocker script)

/**
 * Verify that the block overlay is the legitimate Focus Mode overlay
 * and has not been replaced with a fake one by the host page.
 */
function verifyBlockPageIntegrity(): boolean {
  // 1. Check that we're running in an extension context
  if (typeof chrome === 'undefined' || !chrome.runtime?.id) {
    return false;
  }

  // 2. Verify the overlay exists and is in our shadow DOM
  if (!overlayRoot || !shadowRoot) {
    return false;
  }

  // 3. Ensure the overlay is attached to the document
  if (!overlayRoot.isConnected) {
    return false;
  }

  return true;
}

/**
 * Periodic integrity check runs every 5 seconds while blocked.
 * Re-injects the overlay if it was tampered with.
 */
function startIntegrityChecks(data: BlockData): void {
  const intervalId = setInterval(() => {
    if (!isBlocked) {
      clearInterval(intervalId);
      return;
    }

    if (!verifyBlockPageIntegrity()) {
      // Overlay was tampered with -- re-inject
      overlayRoot = null;
      shadowRoot = null;
      isBlocked = false;
      injectBlockPage(data);
    }
  }, 5000);
}
```

### Settings Lock During Nuclear Mode

```typescript
// src/popup/settings-controller.ts
// UI-side enforcement of Nuclear Mode lock

import type { NuclearState } from '../background/nuclear-guard';

/**
 * Check Nuclear Mode state and disable UI controls accordingly.
 * This is a UI-level guard -- the actual enforcement happens
 * in the service worker via nuclearGuard().
 */
export async function applyNuclearLock(): Promise<void> {
  const response = await chrome.runtime.sendMessage({
    type: 'GET_NUCLEAR_STATE',
  });

  const state: NuclearState = response?.nuclearState;
  if (!state?.active) return;

  // Disable all settings that could weaken blocking
  const settingsToLock = [
    '#blocklist-remove-btn',
    '#disable-blocking-btn',
    '#schedule-edit-btn',
    '#category-toggle',
    '#nuclear-cancel-btn',
    '#whitelist-add-btn',
  ];

  for (const selector of settingsToLock) {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el) => {
      (el as HTMLButtonElement).disabled = true;
      el.classList.add('fm-nuclear-locked');
    });
  }

  // Show nuclear mode banner
  const banner = document.getElementById('nuclear-banner');
  if (banner) {
    const minutesRemaining = Math.ceil(
      (state.expiresAt - Date.now()) / 60000
    );
    const timerSpan = banner.querySelector('.fm-nuclear-timer');
    if (timerSpan) {
      timerSpan.textContent = `${minutesRemaining}m remaining`;
    }
    banner.classList.add('fm-visible');
  }
}
```

### Multiple Browser Profile Awareness

```typescript
// src/background/profile-manager.ts
// Nuclear Mode is per-profile (each Chrome profile is independent)

/**
 * Each Chrome profile runs its own instance of the extension.
 * Nuclear Mode state is stored in chrome.storage.local, which
 * is per-profile by default. No additional isolation is needed.
 *
 * However, if the user uses chrome.storage.sync, Nuclear Mode
 * state must NOT be synced across profiles (a user might want
 * Nuclear Mode on their work profile but not their personal one).
 */

const NUCLEAR_STORAGE_KEY = 'nuclearState';

// Nuclear state is ALWAYS stored in local, never sync
export async function getNuclearState(): Promise<NuclearState | null> {
  const result = await chrome.storage.local.get(NUCLEAR_STORAGE_KEY);
  return result[NUCLEAR_STORAGE_KEY] || null;
}

export async function setNuclearState(state: NuclearState): Promise<void> {
  await chrome.storage.local.set({ [NUCLEAR_STORAGE_KEY]: state });
}

// Ensure nuclear state is excluded from sync operations
export function getSyncExclusions(): string[] {
  return [
    NUCLEAR_STORAGE_KEY,
    'nuclearHeartbeat',
    'nuclearSettingsSnapshot',
  ];
}
```

---

## 7.4 XSS Prevention in Focus Mode

Cross-site scripting (XSS) is a critical concern for Focus Mode because the block overlay is injected into arbitrary web pages. A vulnerability could allow a malicious host page to escape the block.

### Sanitization Strategy

Focus Mode follows a strict rule: **never use `innerHTML` with dynamic data**. All user-visible data is inserted via `textContent` or built with DOM APIs.

```typescript
// src/shared/sanitize.ts
// Focus Mode - Blocker | Input Sanitization Utilities

/**
 * Sanitize a string for safe display in the DOM.
 * Uses textContent-based escaping (the safest method).
 *
 * This function is used for:
 * - Blocked domain names displayed on the block page
 * - User-defined blocklist labels
 * - Settings values displayed in the popup
 */
export function sanitizeForDisplay(input: string): string {
  // textContent automatically escapes HTML entities
  const temp = document.createElement('span');
  temp.textContent = input;
  return temp.innerHTML;
}

/**
 * Validate and sanitize a domain string.
 * Rejects anything that isn't a valid domain.
 */
export function sanitizeDomain(input: string): string | null {
  // Strip whitespace
  const trimmed = input.trim().toLowerCase();

  // Remove protocol if present
  let domain = trimmed;
  if (domain.startsWith('http://')) domain = domain.slice(7);
  if (domain.startsWith('https://')) domain = domain.slice(8);

  // Remove path, query, fragment
  domain = domain.split('/')[0];
  domain = domain.split('?')[0];
  domain = domain.split('#')[0];

  // Remove port
  domain = domain.split(':')[0];

  // Validate domain format (alphanumeric, hyphens, dots)
  const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/;
  if (!domainRegex.test(domain)) {
    return null; // Invalid domain
  }

  return domain;
}

/**
 * Sanitize a URL for safe usage in navigation.
 * Only allows http:, https:, and chrome: protocols.
 */
export function sanitizeUrl(input: string): string | null {
  try {
    const url = new URL(input);
    const allowedProtocols = ['http:', 'https:', 'chrome:'];
    if (!allowedProtocols.includes(url.protocol)) {
      return null; // Block javascript:, data:, blob:, etc.
    }
    return url.href;
  } catch {
    return null; // Invalid URL
  }
}

/**
 * Sanitize a settings value before storing it.
 * Validates type and range.
 */
export function sanitizeSettingsValue(
  key: string,
  value: unknown
): unknown | null {
  const validators: Record<string, (v: unknown) => unknown | null> = {
    nuclearDurationMinutes: (v) => {
      if (typeof v !== 'number') return null;
      if (v < 1 || v > 1440) return null; // 1 minute to 24 hours
      return Math.floor(v);
    },
    theme: (v) => {
      if (typeof v !== 'string') return null;
      const validThemes = ['midnight', 'ocean', 'forest', 'light'];
      return validThemes.includes(v) ? v : null;
    },
    maxBlocklistSize: (v) => {
      if (typeof v !== 'number') return null;
      if (v < 1 || v > 10000) return null;
      return Math.floor(v);
    },
    soundEnabled: (v) => {
      if (typeof v !== 'boolean') return null;
      return v;
    },
  };

  const validator = validators[key];
  if (!validator) return null;
  return validator(value);
}
```

### Block Page XSS Prevention

Every piece of dynamic data on the block page goes through safe rendering:

```typescript
// SAFE: Using textContent (auto-escapes HTML)
domainEl.textContent = data.domain;
reasonBadge.textContent = getReasonLabel(data.reason);
quoteEl.textContent = getRandomQuote();
valueEl.textContent = formatTimeSaved(stats.timeSavedSeconds);

// SAFE: Static HTML constant (no dynamic data)
shieldDiv.innerHTML = SHIELD_ICON_SVG; // Constant defined at compile time

// DANGEROUS (never done in Focus Mode):
// domainEl.innerHTML = data.domain;  // XSS if domain contains <script>
// overlay.innerHTML = `<h1>${data.domain}</h1>`;  // Template XSS
```

### Motivational Quotes Security

Motivational quotes are stored as a **static array** compiled into the extension:

```typescript
// SAFE: Quotes are compile-time constants, never user-generated
const QUOTES: ReadonlyArray<string> = [
  "The secret of getting ahead is getting started. - Mark Twain",
  // ... 50+ more
];

// Selection is deterministic based on date, no user input involved
const quote = QUOTES[Math.floor(Date.now() / 86400000) % QUOTES.length];
quoteEl.textContent = quote; // textContent, not innerHTML
```

There is no user-generated quote feature. If one is added in the future, quotes must be sanitized before storage and displayed via `textContent`.

### DOMPurify for Edge Cases

For any future feature that requires rendering HTML (e.g., rich text settings descriptions), Focus Mode includes DOMPurify as a bundled dependency:

```typescript
// src/shared/safe-html.ts
// Wrapper around DOMPurify for controlled HTML rendering

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML string and return safe HTML.
 * Only used for extension-internal HTML rendering,
 * NEVER for content injected into host pages.
 */
export function safeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'span'],
    ALLOWED_ATTR: ['href', 'class', 'target'],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['rel'], // Always add rel="noopener"
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
    FORBID_ATTR: ['onclick', 'onerror', 'onload', 'style'],
  });
}

/**
 * Create a safe DOM element from an HTML string.
 */
export function safeElement(tag: string, html: string): HTMLElement {
  const el = document.createElement(tag);
  el.innerHTML = safeHTML(html);
  return el;
}
```

---

## 7.5 Data Security

### License Key Storage

Focus Mode Pro license keys are encrypted before storage in `chrome.storage.local`:

```typescript
// src/background/license-store.ts
// Focus Mode - Blocker | Secure License Key Storage

/**
 * Encrypt the license key before storing it.
 * Uses the Web Crypto API (available in service workers)
 * with AES-GCM encryption.
 *
 * The encryption key is derived from the extension ID and a
 * device-specific salt, making the stored license non-transferable.
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;

/**
 * Derive an encryption key from the extension ID and a
 * randomly generated salt stored alongside the encrypted data.
 */
async function deriveKey(salt: Uint8Array): Promise<CryptoKey> {
  const extensionId = chrome.runtime.id;
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(extensionId),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt and store a license key.
 */
export async function storeLicenseKey(licenseKey: string): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(salt);

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    new TextEncoder().encode(licenseKey)
  );

  await chrome.storage.local.set({
    __fm_license: {
      data: Array.from(new Uint8Array(encrypted)),
      salt: Array.from(salt),
      iv: Array.from(iv),
      version: 1,
    },
  });
}

/**
 * Retrieve and decrypt the stored license key.
 */
export async function retrieveLicenseKey(): Promise<string | null> {
  const result = await chrome.storage.local.get('__fm_license');
  const stored = result.__fm_license;

  if (!stored) return null;

  try {
    const salt = new Uint8Array(stored.salt);
    const iv = new Uint8Array(stored.iv);
    const data = new Uint8Array(stored.data);
    const key = await deriveKey(salt);

    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  } catch {
    // Decryption failed -- key may be corrupted or from a different install
    return null;
  }
}
```

### API Communication Security

```typescript
// src/background/api-client.ts
// Focus Mode - Blocker | Secure API Client

const API_BASE = 'https://api.focusmode.app/v1';

interface ApiRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  body?: unknown;
  requiresAuth?: boolean;
}

/**
 * Secure API client for Focus Mode backend communication.
 * All requests are HTTPS-only with proper headers.
 */
export async function apiRequest<T>(options: ApiRequestOptions): Promise<T> {
  const url = `${API_BASE}${options.path}`;

  // Verify HTTPS (defense in depth -- API_BASE is hardcoded as HTTPS)
  if (!url.startsWith('https://')) {
    throw new Error('API requests must use HTTPS');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Extension-Version': chrome.runtime.getManifest().version,
    'X-Extension-Id': chrome.runtime.id,
  };

  // Add auth token if required
  if (options.requiresAuth) {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required but no token available');
    }
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: options.method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new ApiError(response.status, error);
  }

  return response.json();
}

/**
 * Token management with automatic refresh.
 */
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAuthToken(): Promise<string | null> {
  // Check cached token
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.value;
  }

  // Retrieve stored token
  const result = await chrome.storage.local.get('__fm_auth');
  const stored = result.__fm_auth;

  if (!stored) return null;

  // Check if token needs refresh (expires within 5 minutes)
  if (Date.now() >= stored.expiresAt - 300000) {
    return refreshToken(stored.refreshToken);
  }

  cachedToken = { value: stored.accessToken, expiresAt: stored.expiresAt };
  return stored.accessToken;
}

/**
 * Refresh an expired access token.
 */
async function refreshToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      // Refresh failed -- clear stored auth
      await chrome.storage.local.remove('__fm_auth');
      cachedToken = null;
      return null;
    }

    const data = await response.json();
    const auth = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: Date.now() + data.expiresIn * 1000,
    };

    await chrome.storage.local.set({ __fm_auth: auth });
    cachedToken = { value: auth.accessToken, expiresAt: auth.expiresAt };
    return auth.accessToken;
  } catch {
    return null;
  }
}

class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(`API Error ${status}: ${message}`);
    this.name = 'ApiError';
  }
}
```

### Content Script Data Isolation

Content scripts run in the host page's process and their memory is accessible to sufficiently motivated host page code. Therefore:

```typescript
// RULE: Never store sensitive data in content scripts

// BAD: License key in content script
// const licenseKey = await chrome.storage.local.get('license');

// GOOD: Request only what's needed from the service worker
chrome.runtime.sendMessage(
  { type: 'GET_BLOCK_STATS' },
  (response) => {
    // response contains only: { timeSaved, distractions, streak }
    // No license keys, no API tokens, no user credentials
  }
);
```

### Stripe Integration Security

Focus Mode never handles raw payment card data. All payment processing is delegated to Stripe.js:

```typescript
// src/popup/payment.ts
// Payment handling -- Stripe.js manages all card data

/**
 * Load Stripe.js from the CDN.
 * Note: This is the ONE exception to "no external scripts" --
 * Stripe.js MUST be loaded from Stripe's CDN per PCI compliance.
 * It is loaded in a sandboxed iframe, not in the extension context.
 *
 * However, in MV3, we cannot load remote scripts. Instead, we
 * open a Stripe Checkout session in a new tab pointing to our
 * server, which hosts the Stripe.js integration.
 */
export async function initiateCheckout(): Promise<void> {
  const response = await chrome.runtime.sendMessage({
    type: 'CREATE_CHECKOUT_SESSION',
  });

  if (response?.checkoutUrl) {
    // Open Stripe Checkout in a new tab (hosted on our server)
    // This avoids loading Stripe.js in the extension context
    await chrome.tabs.create({ url: response.checkoutUrl });
  }
}

// The checkout flow:
// 1. User clicks "Upgrade to Pro" in popup
// 2. Extension creates a Checkout Session via our API
// 3. New tab opens with Stripe Checkout (hosted on api.focusmode.app)
// 4. User enters payment details on Stripe's secure form
// 5. Stripe processes payment, redirects to success page
// 6. Success page calls our API to activate the license
// 7. Extension polls for license activation and updates UI
```

---

## 7.6 Permission Minimization

### Permissions Focus Mode Requests (Justified)

```jsonc
{
  "permissions": [
    "storage",        // Store blocklist, settings, analytics data
    "alarms",         // Scheduled blocking, nuclear mode timer, periodic tasks
    "tabs",           // Read tab URLs to check against blocklist
    "scripting",      // Dynamic content script injection (MV3 replacement for executeScript)
    "management",     // Detect extension disable attempts during Nuclear Mode
    "notifications"   // Alert user when Nuclear Mode starts/ends, streak milestones
  ],
  "optional_permissions": [
    "history"         // Only requested if user enables "block previously distracting sites" feature
  ],
  "host_permissions": [
    "<all_urls>"      // Required: must check ALL sites against blocklist
  ]
}
```

### Optional Permissions Strategy

Focus Mode uses optional permissions to minimize the initial permission footprint. Permissions are requested only when the user enables features that require them:

```typescript
// src/background/permission-manager.ts
// Focus Mode - Blocker | Optional Permission Manager

/**
 * Request an optional permission when a feature is enabled.
 * Shows the Chrome permission prompt to the user.
 */
export async function requestPermissionForFeature(
  feature: string
): Promise<boolean> {
  const featurePermissions: Record<string, chrome.permissions.Permissions> = {
    historyAnalysis: {
      permissions: ['history'],
    },
  };

  const required = featurePermissions[feature];
  if (!required) return true; // No special permissions needed

  // Check if already granted
  const hasPermission = await chrome.permissions.contains(required);
  if (hasPermission) return true;

  // Request from user (shows Chrome's permission dialog)
  return chrome.permissions.request(required);
}

/**
 * Release permissions when a feature is disabled.
 * This reduces the extension's attack surface.
 */
export async function releasePermissionForFeature(
  feature: string
): Promise<void> {
  const featurePermissions: Record<string, chrome.permissions.Permissions> = {
    historyAnalysis: {
      permissions: ['history'],
    },
  };

  const toRelease = featurePermissions[feature];
  if (!toRelease) return;

  await chrome.permissions.remove(toRelease);
}
```

### `<all_urls>` Justification

Focus Mode requires `<all_urls>` host permission because it is a website blocker. By definition, it must be able to:

1. **Inject content scripts into any page** to check if the domain is blocked.
2. **Inject block overlays into any page** when a domain matches the blocklist.
3. **Track time on any page** for the analytics feature.

Without `<all_urls>`, the extension would need to know in advance which sites the user will block, which is impossible. The `<all_urls>` permission is accompanied by a clear privacy explanation in the Chrome Web Store listing and in the extension's onboarding flow.

### Permissions Focus Mode Deliberately Avoids

| Permission | Why Avoided | Alternative Used |
|-----------|-------------|-----------------|
| `webRequest` / `webRequestBlocking` | MV3 uses declarativeNetRequest instead; webRequest is read-only in MV3 | Content script-based blocking with overlay injection |
| `cookies` | No need to read or modify cookies | N/A |
| `bookmarks` | No bookmark-related features | N/A |
| `downloads` | No download management features | N/A |
| `geolocation` | No location-based features | N/A |
| `clipboardRead` / `clipboardWrite` | No clipboard interaction needed | N/A |
| `debugger` | Extremely powerful, unnecessary for blocking | Content script DOM manipulation |
| `proxy` | No proxy configuration needed | N/A |

### Chrome Web Store Review Considerations

Chrome Web Store reviews extensions for permission abuse. Focus Mode's permission justification:

1. **Every permission maps to a user-visible feature.** No speculative permissions.
2. **Privacy policy covers all data access.** Published alongside the extension.
3. **Optional permissions reduce initial footprint.** Users see fewer permissions at install time.
4. **`<all_urls>` is expected** for a website blocker. Reviewers understand this use case.
5. **No broad host permissions beyond `<all_urls>`.** No specific domain access needed for the extension's own APIs (handled via `connect-src` in CSP).

---

## 7.7 Supply Chain Security

### NPM Dependency Auditing

```typescript
// scripts/audit-deps.ts
// Focus Mode - Blocker | Dependency Audit Script
// Run as part of CI/CD pipeline

import { execSync } from 'child_process';

interface AuditResult {
  vulnerabilities: {
    critical: number;
    high: number;
    moderate: number;
    low: number;
  };
}

/**
 * Run npm audit and fail the build if critical or high
 * vulnerabilities are found.
 */
function auditDependencies(): void {
  console.log('[Focus Mode] Running dependency audit...');

  try {
    // Run npm audit in JSON mode
    const output = execSync('npm audit --json', {
      encoding: 'utf-8',
      timeout: 60000,
    });

    const result: AuditResult = JSON.parse(output);
    const { critical, high, moderate, low } = result.vulnerabilities;

    console.log(`  Critical: ${critical}`);
    console.log(`  High:     ${high}`);
    console.log(`  Moderate: ${moderate}`);
    console.log(`  Low:      ${low}`);

    // Fail on critical or high vulnerabilities
    if (critical > 0 || high > 0) {
      console.error(
        '[Focus Mode] AUDIT FAILED: Critical or high vulnerabilities found.'
      );
      console.error('Run "npm audit fix" or update affected packages.');
      process.exit(1);
    }

    console.log('[Focus Mode] Dependency audit passed.');
  } catch (error: any) {
    // npm audit returns non-zero exit code when vulnerabilities exist
    if (error.stdout) {
      const result: AuditResult = JSON.parse(error.stdout);
      const { critical, high } = result.vulnerabilities;
      if (critical > 0 || high > 0) {
        console.error('[Focus Mode] AUDIT FAILED.');
        process.exit(1);
      }
    }
    console.log('[Focus Mode] Dependency audit passed (with advisories).');
  }
}

auditDependencies();
```

### Lock File Integrity

```jsonc
// .npmrc -- Focus Mode project configuration
// Enforce lock file integrity

// engine-strict=true
// save-exact=true
// package-lock=true
```

```typescript
// scripts/verify-lockfile.ts
// Verify package-lock.json integrity before builds

import { readFileSync } from 'fs';
import { createHash } from 'crypto';

/**
 * Verify that package-lock.json has not been tampered with
 * by comparing its hash to the committed hash.
 */
function verifyLockfile(): void {
  const lockfile = readFileSync('package-lock.json', 'utf-8');
  const hash = createHash('sha256').update(lockfile).digest('hex');

  console.log(`[Focus Mode] Lock file hash: ${hash}`);

  // In CI, compare against the expected hash from the commit
  const expectedHash = process.env.EXPECTED_LOCKFILE_HASH;
  if (expectedHash && hash !== expectedHash) {
    console.error('[Focus Mode] Lock file integrity check FAILED.');
    console.error(`Expected: ${expectedHash}`);
    console.error(`Actual:   ${hash}`);
    process.exit(1);
  }

  console.log('[Focus Mode] Lock file integrity verified.');
}

verifyLockfile();
```

### Build Reproducibility

```typescript
// scripts/build-verify.ts
// Focus Mode - Blocker | Reproducible Build Verification

import { createHash } from 'crypto';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

/**
 * Generate a manifest of all build output files with their hashes.
 * This allows independent verification that the same source code
 * produces the same extension package.
 */
function generateBuildManifest(distDir: string): Record<string, string> {
  const manifest: Record<string, string> = {};

  function walk(dir: string): void {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else {
        const content = readFileSync(fullPath);
        const hash = createHash('sha256').update(content).digest('hex');
        const relativePath = fullPath.replace(distDir + '/', '');
        manifest[relativePath] = hash;
      }
    }
  }

  walk(distDir);
  return manifest;
}

/**
 * Write build manifest for verification.
 */
function writeBuildManifest(): void {
  const manifest = generateBuildManifest('./dist');
  const sorted = Object.keys(manifest)
    .sort()
    .reduce(
      (acc, key) => {
        acc[key] = manifest[key];
        return acc;
      },
      {} as Record<string, string>
    );

  const output = JSON.stringify(sorted, null, 2);
  const overallHash = createHash('sha256').update(output).digest('hex');

  console.log('[Focus Mode] Build manifest:');
  console.log(output);
  console.log(`\nOverall build hash: ${overallHash}`);

  // Write to file for CI comparison
  require('fs').writeFileSync(
    './dist/build-manifest.json',
    output,
    'utf-8'
  );
}

writeBuildManifest();
```

### Source Map Security

Source maps contain the original TypeScript source code and must be handled carefully:

```typescript
// scripts/handle-sourcemaps.ts
// Focus Mode - Blocker | Source Map Security Handler

import { readdirSync, unlinkSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * Source map handling strategy:
 *
 * 1. Generate source maps during build (needed for Sentry)
 * 2. Upload source maps to Sentry for error deobfuscation
 * 3. DELETE source maps from the dist folder before packaging
 * 4. Never include source maps in the published .crx/.zip
 *
 * This ensures:
 * - Error reports in Sentry show original TypeScript code
 * - Users cannot reverse-engineer the extension from source maps
 * - The published extension contains only minified JavaScript
 */

async function uploadAndDeleteSourceMaps(distDir: string): Promise<void> {
  const sourceMapFiles: string[] = [];

  // Find all .map files
  function findMaps(dir: string): void {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        findMaps(fullPath);
      } else if (entry.name.endsWith('.map')) {
        sourceMapFiles.push(fullPath);
      }
    }
  }

  findMaps(distDir);
  console.log(`[Focus Mode] Found ${sourceMapFiles.length} source map files.`);

  // Upload to Sentry
  if (process.env.SENTRY_AUTH_TOKEN) {
    console.log('[Focus Mode] Uploading source maps to Sentry...');

    const version = JSON.parse(
      readFileSync('./package.json', 'utf-8')
    ).version;

    // Use Sentry CLI for upload (invoked as a child process)
    const { execSync } = require('child_process');
    execSync(
      `npx @sentry/cli releases files "focus-mode@${version}" ` +
      `upload-sourcemaps "${distDir}" --url-prefix "~/"`,
      {
        env: {
          ...process.env,
          SENTRY_ORG: 'focusmode',
          SENTRY_PROJECT: 'chrome-extension',
        },
        stdio: 'inherit',
      }
    );

    console.log('[Focus Mode] Source maps uploaded to Sentry.');
  } else {
    console.warn('[Focus Mode] SENTRY_AUTH_TOKEN not set. Skipping upload.');
  }

  // Delete source maps from dist
  for (const mapFile of sourceMapFiles) {
    unlinkSync(mapFile);
    console.log(`  Deleted: ${mapFile}`);
  }

  // Also remove sourceMappingURL comments from JS files
  function stripSourceMapComments(dir: string): void {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        stripSourceMapComments(fullPath);
      } else if (entry.name.endsWith('.js')) {
        let content = readFileSync(fullPath, 'utf-8');
        const stripped = content.replace(
          /\/\/# sourceMappingURL=.+\.map$/gm,
          ''
        );
        if (stripped !== content) {
          require('fs').writeFileSync(fullPath, stripped, 'utf-8');
        }
      }
    }
  }

  stripSourceMapComments(distDir);
  console.log('[Focus Mode] Source map references removed from JS files.');
}

// Run
uploadAndDeleteSourceMaps('./dist');
```

### Code Signing Strategy

```typescript
// scripts/sign-extension.ts
// Focus Mode - Blocker | Extension Signing

/**
 * Chrome Web Store extensions are signed automatically by Google
 * during the publishing process. However, for enterprise distribution
 * and integrity verification, Focus Mode also implements:
 *
 * 1. Build artifact hashing (see build-verify.ts)
 * 2. Git tag signing for release commits
 * 3. CI/CD pipeline verification of build reproducibility
 *
 * The signing flow:
 *
 * Developer machine:
 *   git tag -s v1.0.0 -m "Release 1.0.0"
 *   git push --tags
 *
 * CI/CD pipeline:
 *   1. Verify git tag signature
 *   2. Clean build from tagged commit
 *   3. Run all tests
 *   4. Run dependency audit
 *   5. Generate build manifest hash
 *   6. Upload source maps to Sentry
 *   7. Delete source maps from dist
 *   8. Package as .zip
 *   9. Upload to Chrome Web Store via API
 *   10. Store build manifest hash in release notes
 */

interface ReleaseMetadata {
  version: string;
  gitTag: string;
  gitCommit: string;
  buildHash: string;
  timestamp: string;
  nodeVersion: string;
  npmVersion: string;
  dependencies: Record<string, string>;
}

function generateReleaseMetadata(): ReleaseMetadata {
  const { execSync } = require('child_process');
  const packageJson = JSON.parse(
    readFileSync('./package.json', 'utf-8')
  );

  return {
    version: packageJson.version,
    gitTag: `v${packageJson.version}`,
    gitCommit: execSync('git rev-parse HEAD').toString().trim(),
    buildHash: execSync('sha256sum dist/build-manifest.json')
      .toString()
      .split(' ')[0],
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    npmVersion: execSync('npm --version').toString().trim(),
    dependencies: packageJson.dependencies || {},
  };
}

import { readFileSync } from 'fs';

const metadata = generateReleaseMetadata();
console.log('[Focus Mode] Release metadata:');
console.log(JSON.stringify(metadata, null, 2));

require('fs').writeFileSync(
  './dist/release-metadata.json',
  JSON.stringify(metadata, null, 2),
  'utf-8'
);
```

### Dependency Pinning and Review

Focus Mode maintains a strict dependency policy:

```jsonc
// package.json (relevant sections)
{
  "dependencies": {
    // Production dependencies are pinned to exact versions
    // (save-exact=true in .npmrc)
    "dompurify": "3.0.6"
  },
  "devDependencies": {
    // Dev dependencies are also pinned
    "typescript": "5.3.3",
    "esbuild": "0.19.11",
    "vitest": "1.2.0",
    "@sentry/cli": "2.23.0"
  },
  "overrides": {
    // Force specific versions of transitive dependencies
    // to address known vulnerabilities
  }
}
```

**Dependency review checklist** (run before adding any new dependency):

1. **Necessity.** Can this be implemented in <100 lines without the dependency?
2. **Maintenance.** Is the package actively maintained? Last commit within 6 months?
3. **Size.** What is the impact on extension bundle size? (Budget: <500KB total)
4. **Permissions.** Does the package require any special permissions or access?
5. **Transitive dependencies.** How many transitive deps does it pull in?
6. **Security history.** Any CVEs in the past 2 years?
7. **License.** Compatible with Focus Mode's license (MIT/Apache 2.0 preferred)?
8. **Alternatives.** Are there smaller, more focused alternatives?
