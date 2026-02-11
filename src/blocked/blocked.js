/**
 * Focus Mode - Blocker: Block Page Script
 *
 * Populates the block page with data from URL params and extension storage,
 * manages the countdown timer, and handles user interactions.
 */

// --- DOM References ---
const domainNameEl = document.getElementById('domain-name');
const timerSection = document.getElementById('timer-section');
const timerDisplay = document.getElementById('timer-display');
const streakCountEl = document.getElementById('streak-count');
const savedTimeEl = document.getElementById('saved-time');
const blockedCountEl = document.getElementById('blocked-count');
const attemptMessage = document.getElementById('attempt-message');
const attemptCountEl = document.getElementById('attempt-count');
const attemptDomainEl = document.getElementById('attempt-domain');
const quoteTextEl = document.getElementById('quote-text');
const returnBtn = document.getElementById('return-btn');
const overrideBtn = document.getElementById('override-btn');

// --- State ---
let timerInterval = null;
let currentDomain = '';

// --- URL Params ---
const params = new URLSearchParams(window.location.search);
const domain = params.get('domain') || '';
const attemptParam = params.get('attempt') || '';

// --- Initialize ---
init();

async function init() {
  // Translate static strings from _locales via data-i18n attributes
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const msg = chrome.i18n.getMessage(el.dataset.i18n);
    if (msg) el.textContent = msg;
  });

  currentDomain = domain;

  // Set dynamic page title and favicon
  if (domain) {
    document.title = `Blocked - ${domain}`;
  }
  const faviconEl = document.getElementById('favicon');
  if (faviconEl) {
    try {
      faviconEl.href = chrome.runtime.getURL('src/assets/icons/icon-32.png');
    } catch (e) {
      // Extension context may not be available; ignore
    }
  }

  // Populate domain name immediately (no async needed)
  if (domain) {
    domainNameEl.textContent = domain;
    attemptDomainEl.textContent = domain;
  }

  // Show attempt count if available from URL param
  if (attemptParam && parseInt(attemptParam, 10) > 0) {
    attemptCountEl.textContent = `#${attemptParam}`;
    attemptMessage.hidden = false;
  }

  // Record the distraction first, then fetch block info so stats are fresh
  await sendMessage({ type: 'RECORD_DISTRACTION', domain });
  const blockInfo = await sendMessage({ type: 'GET_BLOCK_INFO', domain });

  if (blockInfo) {
    populateStats(blockInfo);
    populateTimer(blockInfo.timerState);
    populateOverride(blockInfo.settings);
    populateQuote(blockInfo.quote);

    // Nuclear mode visual indicator
    if (blockInfo.settings?.nuclearMode?.active && Date.now() < blockInfo.settings.nuclearMode.endsAt) {
      const banner = document.createElement('div');
      banner.className = 'nuclear-banner';
      banner.textContent = 'NUCLEAR MODE ACTIVE \u2014 Cannot bypass';
      document.body.prepend(banner);
    }
  } else {
    // Fallback: load quote locally if service worker isn't ready
    loadQuoteFallback();
  }

  // Set up button handlers
  setupActions();
}

// --- Data Population ---

function populateStats(info) {
  const { streak, todayStats } = info;

  // Streak — streak is a plain number from the service worker response
  if (typeof streak === 'number') {
    streakCountEl.textContent = streak;
  } else if (streak && typeof streak === 'object') {
    // Defensive fallback in case streak is still an object with .current
    streakCountEl.textContent = streak.current || 0;
  }

  // Focus minutes / time saved
  if (todayStats) {
    const minutes = todayStats.focusMinutes || 0;
    // Use safe DOM APIs instead of innerHTML to prevent XSS
    savedTimeEl.textContent = '';
    savedTimeEl.appendChild(document.createTextNode(String(minutes)));
    const smallEl = document.createElement('small');
    smallEl.textContent = 'min';
    savedTimeEl.appendChild(smallEl);

    // Total blocks today
    blockedCountEl.textContent = todayStats.totalAttempts || 0;

    // Domain-specific attempt count (more accurate than URL param)
    const domainAttempts = todayStats.sitesBlocked?.[domain];
    if (domainAttempts && domainAttempts > 0) {
      attemptCountEl.textContent = `#${domainAttempts}`;
      attemptMessage.hidden = false;
    }
  }
}

function populateTimer(timerState) {
  if (!timerState || timerState.status === 'idle' || !timerState.remaining) {
    timerSection.hidden = true;
    return;
  }

  timerSection.hidden = false;

  // Calculate remaining time based on when the timer started
  updateTimerDisplay(timerState);

  // Update every second
  timerInterval = setInterval(() => {
    updateTimerDisplay(timerState);
  }, 1000);
}

function updateTimerDisplay(timerState) {
  let remaining;

  if (timerState.startedAt && timerState.duration) {
    // Calculate remaining from startedAt + duration
    const elapsed = Math.floor((Date.now() - timerState.startedAt) / 1000);
    remaining = Math.max(0, timerState.duration - elapsed);
  } else {
    // Use the remaining value directly
    remaining = Math.max(0, timerState.remaining);
  }

  if (remaining <= 0) {
    timerDisplay.textContent = '00:00';
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    return;
  }

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function populateOverride(settings) {
  if (!settings) {
    // Default: show override
    overrideBtn.hidden = false;
    return;
  }

  const nuclear = settings.nuclearMode;
  if (nuclear && nuclear.active) {
    // Check if nuclear mode hasn't expired
    if (!nuclear.endsAt || Date.now() < nuclear.endsAt) {
      overrideBtn.hidden = true;
      return;
    }
  }

  overrideBtn.hidden = false;
}

function populateQuote(quote) {
  if (quote) {
    quoteTextEl.textContent = `"${quote}"`;
    return;
  }
  // Fallback if no quote from service worker
  loadQuoteFallback();
}

async function loadQuoteFallback() {
  try {
    const url = chrome.runtime.getURL('src/data/quotes.json');
    const response = await fetch(url);
    const quotes = await response.json();
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    quoteTextEl.textContent = `"${randomQuote}"`;
  } catch (err) {
    // Hardcoded fallback if everything fails
    quoteTextEl.textContent = '"The secret of getting ahead is getting started."';
  }
}

// --- Actions ---

function setupActions() {
  // Return to Work
  returnBtn.addEventListener('click', handleReturn);

  // Override
  overrideBtn.addEventListener('click', handleOverrideClick);
}

function handleReturn() {
  // Try to go back; if there's no history, open a new tab page.
  // Note: chrome:// URLs cannot be navigated to from extension pages via
  // window.location, so we use the chrome.tabs API as a fallback.
  if (window.history.length > 1) {
    window.history.back();
  } else {
    try {
      chrome.tabs.update({ url: 'chrome://newtab' });
    } catch (e) {
      // Last resort: close the tab
      window.close();
    }
  }
}

function handleOverrideClick() {
  // Replace the override button with a confirmation dialog
  const confirmEl = document.createElement('div');
  confirmEl.className = 'override-confirm';
  confirmEl.setAttribute('role', 'alertdialog');
  confirmEl.setAttribute('aria-label', 'Override confirmation');

  // Build confirmation UI with safe DOM APIs instead of innerHTML
  const confirmMsg = document.createElement('p');
  confirmMsg.textContent = 'Are you sure? This will be recorded and may affect your Focus Score.';

  const confirmActions = document.createElement('div');
  confirmActions.className = 'override-confirm-actions';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn-confirm-cancel';
  cancelBtn.type = 'button';
  cancelBtn.textContent = 'Cancel';

  const yesBtn = document.createElement('button');
  yesBtn.className = 'btn-confirm-yes';
  yesBtn.type = 'button';
  yesBtn.textContent = 'Continue to site';

  confirmActions.appendChild(cancelBtn);
  confirmActions.appendChild(yesBtn);
  confirmEl.appendChild(confirmMsg);
  confirmEl.appendChild(confirmActions);

  overrideBtn.hidden = true;
  overrideBtn.parentElement.appendChild(confirmEl);

  cancelBtn.addEventListener('click', () => {
    confirmEl.removeEventListener('keydown', trapFocus);
    confirmEl.remove();
    overrideBtn.hidden = false;
    overrideBtn.focus();
  });

  yesBtn.addEventListener('click', async () => {
    // Notify background about the override
    await sendMessage({ type: 'OVERRIDE_BLOCK', domain: currentDomain });

    // Navigate to the site
    const targetUrl = `https://${currentDomain}`;
    window.location.href = targetUrl;
  });

  // Focus trap: Tab key cycles only within the confirmation dialog
  function trapFocus(e) {
    if (e.key !== 'Tab') return;
    const focusable = confirmEl.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
  confirmEl.addEventListener('keydown', trapFocus);

  // Escape key dismisses the confirmation dialog
  confirmEl.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      confirmEl.removeEventListener('keydown', trapFocus);
      confirmEl.remove();
      overrideBtn.hidden = false;
      overrideBtn.focus();
    }
  });

  // Focus the cancel button for accessibility
  cancelBtn.focus();
}

// --- Messaging ---

function sendMessage(message) {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('Message send error:', chrome.runtime.lastError.message);
          resolve(null);
          return;
        }
        resolve(response || null);
      });
    } catch (err) {
      console.warn('Failed to send message:', err);
      resolve(null);
    }
  });
}

// --- Cleanup ---
window.addEventListener('beforeunload', () => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
});
