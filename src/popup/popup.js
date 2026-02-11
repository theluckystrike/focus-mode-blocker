/**
 * Focus Mode - Blocker: Popup Entry Point
 *
 * Initializes state from the service worker, renders the correct UI state
 * (idle, active session, post-session), handles tab switching, blocklist
 * management, and keeps the timer display in sync via polling.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FREE_SITE_LIMIT = 5;
const TIMER_POLL_INTERVAL_MS = 1000;
const SCORE_COLORS = {
  red:    { max: 40, color: '#EF4444' },
  yellow: { max: 60, color: '#F59E0B' },
  green:  { max: 80, color: '#22C55E' },
  blue:   { max: 100, color: '#3B82F6' }
};

// ---------------------------------------------------------------------------
// DOM Element Cache
// ---------------------------------------------------------------------------

/** @returns {Record<string, HTMLElement>} */
function cacheElements() {
  return {
    // Toast
    toast:              document.getElementById('toast'),
    toastMessage:       document.getElementById('toast-message'),

    // Header
    proBadge:           document.getElementById('pro-badge'),
    btnSettings:        document.getElementById('btn-settings'),

    // Tabs
    tabHome:            document.getElementById('tab-home'),
    tabBlocklist:       document.getElementById('tab-blocklist'),
    tabStats:           document.getElementById('tab-stats'),
    panelHome:          document.getElementById('panel-home'),
    panelBlocklist:     document.getElementById('panel-blocklist'),
    panelStats:         document.getElementById('panel-stats'),

    // Home — idle state
    stateIdle:          document.getElementById('state-idle'),
    btnQuickFocus:      document.getElementById('btn-quick-focus'),
    statFocusTime:      document.getElementById('stat-focus-time'),
    statBlocks:         document.getElementById('stat-blocks'),
    statAttempts:       document.getElementById('stat-attempts'),
    scoreRing:          document.getElementById('score-ring'),
    scoreNumber:        document.getElementById('score-number'),
    streakCount:        document.getElementById('streak-count'),

    // Home — active state
    stateActive:        document.getElementById('state-active'),
    timerDisplay:       document.getElementById('timer-display'),
    timerRing:          document.getElementById('timer-ring'),
    btnStopSession:     document.getElementById('btn-stop-session'),
    sessionBlocks:      document.getElementById('session-blocks'),
    sessionStreak:      document.getElementById('session-streak'),

    // Home — post-session state
    statePost:          document.getElementById('state-post'),
    postDuration:       document.getElementById('post-duration'),
    postBlocks:         document.getElementById('post-blocks'),
    postScore:          document.getElementById('post-score'),
    btnStartAnother:    document.getElementById('btn-start-another'),
    btnTakeBreak:       document.getElementById('btn-take-break'),

    // Blocklist
    inputSite:          document.getElementById('input-site'),
    btnAddSite:         document.getElementById('btn-add-site'),
    siteCountUsed:      document.getElementById('site-count-used'),
    siteCountTotal:     document.getElementById('site-count-total'),
    siteCountFill:      document.getElementById('site-count-fill'),
    manualSitesList:    document.getElementById('manual-sites-list'),
    emptyBlocklistMsg:  document.getElementById('empty-blocklist-msg'),
    toggleSocialMedia:  document.getElementById('toggle-social-media'),
    toggleNews:         document.getElementById('toggle-news'),

    // Stats
    statsScoreRing:     document.getElementById('stats-score-ring'),
    statsScoreNumber:   document.getElementById('stats-score-number'),
    statsFocusTime:     document.getElementById('stats-focus-time'),
    statsTotalAttempts: document.getElementById('stats-total-attempts'),
    statsCurrentStreak: document.getElementById('stats-current-streak'),
    statsBestStreak:    document.getElementById('stats-best-streak'),
    topSitesList:       document.getElementById('top-sites-list'),
    noDistractionsMsg:  document.getElementById('no-distractions-msg'),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format total minutes into a human-readable string like "2h 14m" or "45m".
 * @param {number} totalMinutes
 * @returns {string}
 */
function formatFocusTime(totalMinutes) {
  if (totalMinutes <= 0) return '0m';
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

/**
 * Format seconds as MM:SS.
 * @param {number} totalSeconds
 * @returns {string}
 */
function formatTimer(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Update an SVG circle's stroke-dashoffset to represent progress.
 * @param {SVGCircleElement} circle
 * @param {number} progress — 0 (empty) to 1 (full)
 */
function updateProgressRing(circle, progress) {
  if (!circle) return;
  const r = circle.r.baseVal.value;
  const circumference = 2 * Math.PI * r;
  circle.style.strokeDasharray = String(circumference);
  circle.style.strokeDashoffset = String(circumference * (1 - Math.min(1, Math.max(0, progress))));
}

/**
 * Return the appropriate color for a Focus Score value.
 * @param {number} score — 0-100
 * @returns {string} hex color
 */
function scoreColor(score) {
  if (score <= SCORE_COLORS.red.max) return SCORE_COLORS.red.color;
  if (score <= SCORE_COLORS.yellow.max) return SCORE_COLORS.yellow.color;
  if (score <= SCORE_COLORS.green.max) return SCORE_COLORS.green.color;
  return SCORE_COLORS.blue.color;
}

/**
 * Extract a bare domain from a variety of user inputs.
 * Handles: "reddit.com", "https://www.reddit.com/foo", "www.reddit.com", etc.
 * @param {string} input
 * @returns {string|null} cleaned domain, or null if invalid
 */
function extractDomain(input) {
  if (!input) return null;

  let cleaned = input.trim().toLowerCase();

  // Strip leading protocol if present
  cleaned = cleaned.replace(/^https?:\/\//, '');

  // Strip leading www.
  cleaned = cleaned.replace(/^www\./, '');

  // Strip path, query, fragment
  cleaned = cleaned.split('/')[0].split('?')[0].split('#')[0];

  // Strip port
  cleaned = cleaned.split(':')[0];

  // Basic validation: must contain a dot, only valid domain characters
  if (!cleaned || !cleaned.includes('.')) return null;
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(cleaned)) return null;

  return cleaned;
}

/**
 * Send a message to the service worker and return the response.
 * @param {object} message
 * @returns {Promise<any>}
 */
async function sendMessage(message) {
  try {
    return await chrome.runtime.sendMessage(message);
  } catch (err) {
    console.error('[Popup] sendMessage failed:', err);
    return { error: err.message };
  }
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

let toastTimeout = null;

/**
 * Show a brief toast notification at the top of the popup.
 * Uses a class-based approach instead of the hidden attribute so that CSS
 * transitions work correctly (the global [hidden] { display:none !important }
 * rule would prevent the slide-in animation if we relied on the hidden attr).
 * @param {Record<string, HTMLElement>} els
 * @param {string} text
 * @param {number} durationMs
 */
function showToast(els, text, durationMs = 2500) {
  if (!els.toast || !els.toastMessage) return;
  clearTimeout(toastTimeout);
  els.toastMessage.textContent = text;
  els.toast.removeAttribute('hidden');
  // Force a reflow so the browser registers the non-hidden state before
  // adding the visible class, enabling the CSS transition.
  void els.toast.offsetWidth;
  els.toast.classList.add('toast--visible');
  toastTimeout = setTimeout(() => {
    els.toast.classList.remove('toast--visible');
    // After the slide-out transition completes, re-hide for assistive tech
    const onEnd = () => {
      els.toast.setAttribute('hidden', '');
      els.toast.removeEventListener('transitionend', onEnd);
    };
    els.toast.addEventListener('transitionend', onEnd);
    // Fallback: if transitionend never fires (e.g. reduced motion), hide after 400ms
    setTimeout(() => {
      if (!els.toast.hasAttribute('hidden')) {
        els.toast.setAttribute('hidden', '');
      }
    }, 400);
  }, durationMs);
}

// ---------------------------------------------------------------------------
// Tab Switching
// ---------------------------------------------------------------------------

/**
 * Set up tab switching with keyboard and mouse interaction.
 * @param {Record<string, HTMLElement>} els
 */
function initTabs(els) {
  const tabs = [els.tabHome, els.tabBlocklist, els.tabStats];
  const panels = [els.panelHome, els.panelBlocklist, els.panelStats];

  function activateTab(index) {
    tabs.forEach((tab, i) => {
      const isActive = i === index;
      tab.setAttribute('aria-selected', String(isActive));
      tab.setAttribute('tabindex', isActive ? '0' : '-1');
      tab.classList.toggle('tab--active', isActive);
      panels[i].hidden = !isActive;
    });
    tabs[index].focus();

    // Remember which tab was last active within this browser session
    try {
      sessionStorage.setItem('focusmode_active_tab', String(index));
    } catch {
      // sessionStorage may not be available in all contexts
    }
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => activateTab(i));
  });

  // Keyboard navigation: arrow keys cycle through tabs
  const tabBar = tabs[0].parentElement;
  tabBar.addEventListener('keydown', (e) => {
    const currentIndex = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
    let newIndex = currentIndex;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      newIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      newIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      newIndex = tabs.length - 1;
    }

    if (newIndex !== currentIndex) {
      activateTab(newIndex);
    }
  });

  // Restore last-active tab from sessionStorage
  try {
    const saved = sessionStorage.getItem('focusmode_active_tab');
    if (saved !== null) {
      const idx = parseInt(saved, 10);
      if (idx >= 0 && idx < tabs.length) {
        activateTab(idx);
      }
    }
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// State Rendering — Home Tab
// ---------------------------------------------------------------------------

/**
 * Show exactly one of the three home-tab states.
 * @param {Record<string, HTMLElement>} els
 * @param {'idle'|'active'|'post'} stateName
 */
function showHomeState(els, stateName) {
  els.stateIdle.hidden   = stateName !== 'idle';
  els.stateActive.hidden = stateName !== 'active';
  els.statePost.hidden   = stateName !== 'post';
}

/**
 * Render the idle state with today's stats and score.
 * @param {Record<string, HTMLElement>} els
 * @param {object} state — full state from GET_STATE
 */
function renderIdleState(els, state) {
  showHomeState(els, 'idle');

  const stats = state.stats || {};
  const streak = state.streak || {};

  // Today's stats
  els.statFocusTime.textContent = formatFocusTime(stats.focusMinutes || 0);
  els.statBlocks.textContent = String(stats.sessionsCompleted || 0);
  els.statAttempts.textContent = String(stats.totalAttempts || 0);

  // Focus Score ring
  const score = stats.focusScore || 0;
  els.scoreNumber.textContent = String(score);
  const color = scoreColor(score);
  els.scoreRing.style.stroke = color;
  updateProgressRing(els.scoreRing, score / 100);

  // Streak
  els.streakCount.textContent = String(streak.current || 0);
}

/**
 * Compute the remaining seconds from a timerState object, accounting for
 * elapsed time since startedAt.
 * @param {object} timerState
 * @returns {number}
 */
function computeRemaining(timerState) {
  if (!timerState || !timerState.startedAt) return 0;
  const elapsed = Math.floor((Date.now() - timerState.startedAt) / 1000);
  return Math.max(0, timerState.duration - elapsed);
}

/**
 * Render the active-session state.
 * @param {Record<string, HTMLElement>} els
 * @param {object} state — full state from GET_STATE
 */
function renderActiveState(els, state) {
  showHomeState(els, 'active');

  const timerState = state.timerState || {};
  const remaining = timerState.remaining != null ? timerState.remaining : computeRemaining(timerState);
  const total = timerState.duration || 1;

  // Timer text
  els.timerDisplay.textContent = formatTimer(remaining);

  // Timer ring: progress = elapsed fraction
  const elapsed = total - remaining;
  updateProgressRing(els.timerRing, elapsed / total);

  // Set ring color based on status
  const isFocus = timerState.status === 'focus';
  els.timerRing.style.stroke = isFocus ? '#22C55E' : '#3B82F6';

  // Update status text below timer
  const statusEl = els.stateActive.querySelector('.timer__status');
  if (statusEl) {
    if (timerState.status === 'focus') {
      statusEl.textContent = 'Focusing';
    } else if (timerState.status === 'break') {
      statusEl.textContent = 'Short Break';
    } else if (timerState.status === 'longbreak') {
      statusEl.textContent = 'Long Break';
    }
  }

  // Session metadata
  const stats = state.stats || {};
  const streak = state.streak || {};
  els.sessionBlocks.textContent = String(stats.totalAttempts || 0);
  els.sessionStreak.textContent = String(streak.current || 0);
}

/**
 * Render the post-session summary state.
 * @param {Record<string, HTMLElement>} els
 * @param {object} state
 * @param {object|null} completedSession — optional data about the just-finished session
 */
function renderPostState(els, state, completedSession) {
  showHomeState(els, 'post');

  const stats = state.stats || {};

  if (completedSession) {
    els.postDuration.textContent = formatTimer(completedSession.duration || 0);
    els.postBlocks.textContent = String(completedSession.blockedAttempts || stats.totalAttempts || 0);
    els.postScore.textContent = `+${completedSession.scoreEarned || stats.focusScore || 0}`;
  } else {
    // Fallback: use current stats
    els.postDuration.textContent = formatFocusTime(stats.focusMinutes || 0);
    els.postBlocks.textContent = String(stats.totalAttempts || 0);
    els.postScore.textContent = String(stats.focusScore || 0);
  }
}

// ---------------------------------------------------------------------------
// State Rendering — Blocklist Tab
// ---------------------------------------------------------------------------

/**
 * Render the blocklist tab with current sites and pre-built list toggles.
 * @param {Record<string, HTMLElement>} els
 * @param {object} state
 */
function renderBlocklistTab(els, state) {
  const blocklist = state.blocklist || [];
  const activePrebuiltLists = state.activePrebuiltLists || [];
  const isPro = state.isPro || false;
  const limit = isPro ? Infinity : FREE_SITE_LIMIT;

  // Site count
  els.siteCountUsed.textContent = String(blocklist.length);
  els.siteCountTotal.textContent = isPro ? 'unlimited' : String(FREE_SITE_LIMIT);
  const fillPct = isPro ? 0 : Math.min(100, (blocklist.length / FREE_SITE_LIMIT) * 100);
  els.siteCountFill.style.width = `${fillPct}%`;

  // Apply warning/full classes to the site-count container for color changes
  const siteCountEl = els.siteCountUsed.closest('.site-count');
  if (siteCountEl) {
    siteCountEl.classList.remove('site-count--warning', 'site-count--full');
    if (!isPro) {
      if (blocklist.length >= FREE_SITE_LIMIT) {
        siteCountEl.classList.add('site-count--full');
      } else if (blocklist.length >= FREE_SITE_LIMIT * 0.7) {
        siteCountEl.classList.add('site-count--warning');
      }
    }
  }

  // Manual sites list
  els.manualSitesList.innerHTML = '';
  if (blocklist.length === 0) {
    els.emptyBlocklistMsg.hidden = false;
  } else {
    els.emptyBlocklistMsg.hidden = true;
    blocklist.forEach((domain) => {
      els.manualSitesList.appendChild(createSiteListItem(domain, els, state));
    });
  }

  // Pre-built list toggles
  if (els.toggleSocialMedia) {
    els.toggleSocialMedia.checked = activePrebuiltLists.includes('social-media');
  }
  if (els.toggleNews) {
    els.toggleNews.checked = activePrebuiltLists.includes('news');
  }

  // Disable input if at limit
  if (!isPro && blocklist.length >= FREE_SITE_LIMIT) {
    els.inputSite.disabled = true;
    els.inputSite.placeholder = 'Blocklist full - Upgrade to Pro';
    els.btnAddSite.disabled = true;
  } else {
    els.inputSite.disabled = false;
    els.inputSite.placeholder = 'e.g. twitter.com';
    els.btnAddSite.disabled = false;
  }
}

/**
 * Create a <li> element for a blocked site entry.
 * @param {string} domain
 * @param {Record<string, HTMLElement>} els
 * @param {object} state
 * @returns {HTMLLIElement}
 */
function createSiteListItem(domain, els, state) {
  const li = document.createElement('li');
  li.className = 'site-list__item';
  li.dataset.domain = domain;

  const faviconSpan = document.createElement('span');
  faviconSpan.className = 'site-list__favicon';
  faviconSpan.setAttribute('aria-hidden', 'true');
  // Use Google's favicon service as a best-effort
  const faviconImg = document.createElement('img');
  faviconImg.src = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
  faviconImg.width = 16;
  faviconImg.height = 16;
  faviconImg.alt = '';
  faviconImg.loading = 'lazy';
  faviconImg.addEventListener('error', () => {
    faviconImg.style.display = 'none';
  });
  faviconSpan.appendChild(faviconImg);

  const domainSpan = document.createElement('span');
  domainSpan.className = 'site-list__domain';
  domainSpan.textContent = domain;

  const removeBtn = document.createElement('button');
  removeBtn.className = 'site-list__remove icon-btn';
  removeBtn.setAttribute('aria-label', `Remove ${domain} from blocklist`);
  removeBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

  removeBtn.addEventListener('click', async () => {
    const updatedList = (state.blocklist || []).filter(d => d !== domain);
    const response = await sendMessage({ type: 'UPDATE_BLOCKLIST', sites: updatedList });
    if (response && !response.error) {
      state.blocklist = updatedList;
      li.remove();
      renderBlocklistTab(els, state);
      showToast(els, `Removed ${domain}`);
    } else {
      showToast(els, response?.error || 'Failed to remove site');
    }
  });

  li.appendChild(faviconSpan);
  li.appendChild(domainSpan);
  li.appendChild(removeBtn);

  return li;
}

// ---------------------------------------------------------------------------
// State Rendering — Stats Tab
// ---------------------------------------------------------------------------

/**
 * Render the stats tab.
 * @param {Record<string, HTMLElement>} els
 * @param {object} state
 */
function renderStatsTab(els, state) {
  const stats = state.stats || {};
  const streak = state.streak || {};
  const score = stats.focusScore || 0;

  // Focus Score ring (large)
  els.statsScoreNumber.textContent = String(score);
  const color = scoreColor(score);
  els.statsScoreRing.style.stroke = color;
  updateProgressRing(els.statsScoreRing, score / 100);

  // Focus time
  els.statsFocusTime.textContent = formatFocusTime(stats.focusMinutes || 0);

  // Total attempts
  els.statsTotalAttempts.textContent = String(stats.totalAttempts || 0);

  // Streak
  els.statsCurrentStreak.textContent = String(streak.current || 0);
  // Best streak: we use current if that is all we have. The storage
  // layer does not track bestStreak separately right now — display current.
  els.statsBestStreak.textContent = String(streak.best || streak.current || 0);

  // Top distraction sites
  renderTopSites(els, stats.sitesBlocked || {});
}

/**
 * Render the top 3 distraction sites by attempt count.
 * @param {Record<string, HTMLElement>} els
 * @param {Object<string, number>} sitesBlocked — domain -> attempt count
 */
function renderTopSites(els, sitesBlocked) {
  const entries = Object.entries(sitesBlocked)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  els.topSitesList.innerHTML = '';

  if (entries.length === 0) {
    els.noDistractionsMsg.hidden = false;
    return;
  }

  els.noDistractionsMsg.hidden = true;

  entries.forEach(([domain, count], index) => {
    const li = document.createElement('li');
    li.className = 'top-sites__item';

    const rank = document.createElement('span');
    rank.className = 'top-sites__rank';
    rank.textContent = String(index + 1);

    const domainSpan = document.createElement('span');
    domainSpan.className = 'top-sites__domain';
    domainSpan.textContent = domain;

    const countSpan = document.createElement('span');
    countSpan.className = 'top-sites__count';
    countSpan.textContent = String(count);

    li.appendChild(rank);
    li.appendChild(domainSpan);
    li.appendChild(countSpan);
    els.topSitesList.appendChild(li);
  });
}

// ---------------------------------------------------------------------------
// Timer Polling
// ---------------------------------------------------------------------------

/** @type {number|null} */
let timerInterval = null;

/**
 * Start polling the timer state every second and updating the display.
 * @param {Record<string, HTMLElement>} els
 * @param {object} state — mutable state object; will be updated in place
 */
function startTimerPolling(els, state) {
  stopTimerPolling();

  timerInterval = setInterval(async () => {
    try {
      const timerState = state.timerState;

      // If there is no active session, stop polling and switch to idle/post state
      if (!timerState || timerState.status === 'idle') {
        stopTimerPolling();
        // Fetch fresh state to check if session completed
        const freshState = await sendMessage({ type: 'GET_STATE' });
        if (freshState && !freshState.error) {
          Object.assign(state, freshState);
          determineAndRenderHomeState(els, state);
        }
        return;
      }

      // Recompute remaining from startedAt for accuracy
      const remaining = computeRemaining(timerState);
      timerState.remaining = remaining;

      if (remaining <= 0) {
        // Session just ended — fetch fresh state from background
        stopTimerPolling();
        const freshState = await sendMessage({ type: 'GET_STATE' });
        if (freshState && !freshState.error) {
          Object.assign(state, freshState);
          determineAndRenderHomeState(els, state);
        }
        return;
      }

      // Update the timer display
      els.timerDisplay.textContent = formatTimer(remaining);

      // Update the timer progress ring
      const total = timerState.duration || 1;
      const elapsed = total - remaining;
      updateProgressRing(els.timerRing, elapsed / total);

    } catch (err) {
      console.error('[Popup] Timer polling error:', err);
    }
  }, TIMER_POLL_INTERVAL_MS);
}

/**
 * Stop the timer polling interval.
 */
function stopTimerPolling() {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// ---------------------------------------------------------------------------
// Determine Home State
// ---------------------------------------------------------------------------

/**
 * Examine the current state and render the appropriate home panel.
 * Also manages the timer polling lifecycle.
 * @param {Record<string, HTMLElement>} els
 * @param {object} state
 */
function determineAndRenderHomeState(els, state) {
  const timerState = state.timerState;

  if (!timerState || timerState.status === 'idle') {
    // Check if the timer state indicates a just-completed session
    // (idle status with a cycle > 1 or recent stats bump). For simplicity
    // we only show post state if the popup was already open when the
    // session ended, which is handled by the timer polling transition.
    // On fresh opens with idle status, show idle.
    stopTimerPolling();
    renderIdleState(els, state);
    return;
  }

  if (timerState.status === 'focus' || timerState.status === 'break' || timerState.status === 'longbreak') {
    renderActiveState(els, state);
    startTimerPolling(els, state);
    return;
  }

  // Fallback: idle
  stopTimerPolling();
  renderIdleState(els, state);
}

// ---------------------------------------------------------------------------
// Nuclear Mode Indicator
// ---------------------------------------------------------------------------

function showNuclearIndicator(els, state) {
  // Add nuclear badge next to pro badge in header
  const headerLeft = document.querySelector('.header__left');
  if (headerLeft && !document.getElementById('nuclear-badge')) {
    const badge = document.createElement('span');
    badge.id = 'nuclear-badge';
    badge.className = 'badge badge--nuclear';
    badge.textContent = 'NUCLEAR';
    badge.setAttribute('aria-label', 'Nuclear mode is active');
    headerLeft.appendChild(badge);
  }

  // Disable stop button during nuclear mode
  if (els.btnStopSession) {
    els.btnStopSession.disabled = true;
    els.btnStopSession.title = 'Cannot stop during Nuclear Mode';
  }
}

// ---------------------------------------------------------------------------
// Event Binding
// ---------------------------------------------------------------------------

/**
 * Bind all interactive event listeners.
 * @param {Record<string, HTMLElement>} els
 * @param {object} state — mutable shared state object
 */
function bindEvents(els, state) {
  // --- Settings button ---
  els.btnSettings.addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    }
  });

  // --- Duration selector buttons ---
  const durationBtns = document.querySelectorAll('.duration-btn');
  let selectedDuration = 25; // default

  durationBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const dur = btn.dataset.duration;

      // "Custom" is a Pro-only feature
      if (dur === 'custom') {
        if (!state.isPro) {
          showToast(els, 'Custom durations require Pro');
          return;
        }
        // For now, Pro custom durations are not implemented in the popup
        return;
      }

      selectedDuration = parseInt(dur, 10);

      // Update pressed states
      durationBtns.forEach((b) => {
        const isActive = b === btn;
        b.classList.toggle('duration-btn--active', isActive);
        b.setAttribute('aria-pressed', String(isActive));
      });
    });
  });

  // --- Quick Focus button ---
  els.btnQuickFocus.addEventListener('click', async () => {
    els.btnQuickFocus.disabled = true;
    const response = await sendMessage({ type: 'START_SESSION', duration: selectedDuration });

    if (response && !response.error) {
      // Fetch fresh state and switch to active view
      const freshState = await sendMessage({ type: 'GET_STATE' });
      if (freshState && !freshState.error) {
        Object.assign(state, freshState);
        determineAndRenderHomeState(els, state);
      }
    } else {
      showToast(els, response?.error || 'Failed to start session');
    }
    els.btnQuickFocus.disabled = false;
  });

  // --- Stop Session button ---
  els.btnStopSession.addEventListener('click', async () => {
    if (state.nuclearActive) {
      showToast(els, 'Cannot stop during Nuclear Mode');
      return;
    }
    els.btnStopSession.disabled = true;
    const response = await sendMessage({ type: 'STOP_SESSION' });

    if (response && !response.error) {
      stopTimerPolling();

      // Fetch fresh state for post-session summary
      const freshState = await sendMessage({ type: 'GET_STATE' });
      if (freshState && !freshState.error) {
        Object.assign(state, freshState);
        renderPostState(els, state, null);
      }
    } else {
      showToast(els, response?.error || 'Cannot stop session');
    }
    els.btnStopSession.disabled = false;
  });

  // --- Post-session: Start Another ---
  els.btnStartAnother.addEventListener('click', async () => {
    els.btnStartAnother.disabled = true;
    const response = await sendMessage({ type: 'START_SESSION', duration: selectedDuration });

    if (response && !response.error) {
      const freshState = await sendMessage({ type: 'GET_STATE' });
      if (freshState && !freshState.error) {
        Object.assign(state, freshState);
        determineAndRenderHomeState(els, state);
      }
    } else {
      showToast(els, response?.error || 'Failed to start session');
    }
    els.btnStartAnother.disabled = false;
  });

  // --- Post-session: Take a Break ---
  els.btnTakeBreak.addEventListener('click', async () => {
    els.btnTakeBreak.disabled = true;
    const response = await sendMessage({ type: 'START_BREAK', isLong: false });

    if (response && !response.error) {
      const freshState = await sendMessage({ type: 'GET_STATE' });
      if (freshState && !freshState.error) {
        Object.assign(state, freshState);
        determineAndRenderHomeState(els, state);
      }
    } else {
      showToast(els, response?.error || 'Failed to start break');
    }
    els.btnTakeBreak.disabled = false;
  });

  // --- Blocklist: Add site ---
  async function addSite() {
    const raw = els.inputSite.value;
    const domain = extractDomain(raw);

    if (!domain) {
      showToast(els, 'Enter a valid domain (e.g. twitter.com)');
      els.inputSite.focus();
      return;
    }

    // Check for duplicates
    if ((state.blocklist || []).includes(domain)) {
      showToast(els, `${domain} is already blocked`);
      els.inputSite.value = '';
      els.inputSite.focus();
      return;
    }

    // Check limit
    if (!state.isPro && (state.blocklist || []).length >= FREE_SITE_LIMIT) {
      showToast(els, 'Blocklist full - Upgrade to Pro');
      return;
    }

    const updatedList = [...(state.blocklist || []), domain];
    const response = await sendMessage({ type: 'UPDATE_BLOCKLIST', sites: updatedList });

    if (response && !response.error) {
      state.blocklist = updatedList;
      els.inputSite.value = '';
      renderBlocklistTab(els, state);
      showToast(els, `Added ${domain}`);
    } else {
      showToast(els, response?.error || 'Failed to add site');
    }
    els.inputSite.focus();
  }

  els.btnAddSite.addEventListener('click', addSite);

  els.inputSite.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSite();
    }
  });

  // --- Blocklist: Pre-built list toggles ---
  if (els.toggleSocialMedia) {
    els.toggleSocialMedia.addEventListener('change', async () => {
      const response = await sendMessage({ type: 'TOGGLE_PREBUILT_LIST', listId: 'social-media' });
      if (response && !response.error) {
        state.activePrebuiltLists = response.activePrebuiltLists || [];
      } else {
        // Revert toggle on failure
        els.toggleSocialMedia.checked = !els.toggleSocialMedia.checked;
        showToast(els, response?.error || 'Failed to toggle list');
      }
    });
  }

  if (els.toggleNews) {
    els.toggleNews.addEventListener('change', async () => {
      const response = await sendMessage({ type: 'TOGGLE_PREBUILT_LIST', listId: 'news' });
      if (response && !response.error) {
        state.activePrebuiltLists = response.activePrebuiltLists || [];
      } else {
        els.toggleNews.checked = !els.toggleNews.checked;
        showToast(els, response?.error || 'Failed to toggle list');
      }
    });
  }
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

/**
 * Main initialization function. Called once on DOMContentLoaded.
 */
async function init() {
  const els = cacheElements();

  // Request the full state from the service worker
  const state = await sendMessage({ type: 'GET_STATE' });

  if (!state || state.error) {
    console.error('[Popup] Failed to get state:', state?.error);
    // Render a fallback idle state with empty data
    const fallbackState = {
      timerState: null,
      stats: {},
      streak: {},
      settings: {},
      blocklist: [],
      activePrebuiltLists: [],
      isPro: false,
      sessionCount: 0,
      nuclearActive: false
    };
    renderIdleState(els, fallbackState);
    renderBlocklistTab(els, fallbackState);
    renderStatsTab(els, fallbackState);
    initTabs(els);
    bindEvents(els, fallbackState);
    return;
  }

  // Show or hide Pro badge
  if (state.isPro) {
    els.proBadge.hidden = false;
  }

  // Render all tab contents
  determineAndRenderHomeState(els, state);

  // Show nuclear mode indicator
  if (state.nuclearActive) {
    showNuclearIndicator(els, state);
  }
  renderBlocklistTab(els, state);
  renderStatsTab(els, state);

  // Initialize tab switching
  initTabs(els);

  // Bind all interactive events
  bindEvents(els, state);

  // Listen for storage changes to stay in sync while popup is open
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;

    let needsRerender = false;

    if (changes.timerState) {
      state.timerState = changes.timerState.newValue;
      needsRerender = true;
    }
    if (changes.todayStats) {
      state.stats = changes.todayStats.newValue;
      needsRerender = true;
    }
    if (changes.streak) {
      state.streak = changes.streak.newValue;
      needsRerender = true;
    }
    if (changes.blocklist) {
      state.blocklist = changes.blocklist.newValue;
      renderBlocklistTab(els, state);
    }
    if (changes.activePrebuiltLists) {
      state.activePrebuiltLists = changes.activePrebuiltLists.newValue;
      renderBlocklistTab(els, state);
    }

    if (needsRerender) {
      determineAndRenderHomeState(els, state);
      renderStatsTab(els, state);
    }
  });
}

// ---------------------------------------------------------------------------
// Entry Point
// ---------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', init);
