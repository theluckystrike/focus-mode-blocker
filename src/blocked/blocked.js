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
  currentDomain = domain;

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

  // Fetch block info and record distraction in parallel
  const [blockInfo] = await Promise.all([
    sendMessage({ type: 'GET_BLOCK_INFO', domain }),
    sendMessage({ type: 'RECORD_DISTRACTION', domain })
  ]);

  if (blockInfo) {
    populateStats(blockInfo);
    populateTimer(blockInfo.timerState);
    populateOverride(blockInfo.settings);
    populateQuote(blockInfo.quote);

    // If the RECORD_DISTRACTION updated the attempt count, use fresh data
    if (blockInfo.todayStats?.sitesBlocked?.[domain]) {
      const domainAttempts = blockInfo.todayStats.sitesBlocked[domain];
      attemptCountEl.textContent = `#${domainAttempts}`;
      attemptMessage.hidden = false;
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

  // Streak
  if (streak) {
    streakCountEl.textContent = streak.current || 0;
  }

  // Focus minutes / time saved
  if (todayStats) {
    const minutes = todayStats.focusMinutes || 0;
    savedTimeEl.innerHTML = `${minutes}<small>min</small>`;

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
  // Try to go back; if there's no history, open new tab page
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = 'chrome://newtab';
  }
}

function handleOverrideClick() {
  // Replace the override button with a confirmation dialog
  const confirmEl = document.createElement('div');
  confirmEl.className = 'override-confirm';
  confirmEl.setAttribute('role', 'alertdialog');
  confirmEl.setAttribute('aria-label', 'Override confirmation');

  confirmEl.innerHTML = `
    <p>Are you sure? This will be recorded and may affect your Focus Score.</p>
    <div class="override-confirm-actions">
      <button class="btn-confirm-cancel" type="button">Cancel</button>
      <button class="btn-confirm-yes" type="button">Continue to site</button>
    </div>
  `;

  overrideBtn.hidden = true;
  overrideBtn.parentElement.appendChild(confirmEl);

  const cancelBtn = confirmEl.querySelector('.btn-confirm-cancel');
  const yesBtn = confirmEl.querySelector('.btn-confirm-yes');

  cancelBtn.addEventListener('click', () => {
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
