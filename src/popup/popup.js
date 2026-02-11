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

const DEFAULT_FREE_SITE_LIMIT = 10;
const DEFAULT_FREE_PREBUILT_LIMIT = 2;
const TIMER_POLL_INTERVAL_MS = 1000;

// ---------------------------------------------------------------------------
// Focus Tips (Tip-of-the-Day)
// ---------------------------------------------------------------------------

const FOCUS_TIPS = [
  'Try the Pomodoro technique: 25 min focus, 5 min break.',
  'Block social media during your peak productivity hours.',
  'Start your day with the hardest task first.',
  'Set a specific goal before each focus session.',
  'Take real breaks: step away from the screen, stretch, hydrate.',
  'Close unnecessary tabs before starting a session.',
  'Use your streak to build a daily focus habit.',
  'Put your phone in another room during focus time.',
  'Schedule your most important work for your highest-energy hours.',
  'Batch similar tasks together for deeper focus.',
  'Review your distraction stats weekly to spot patterns.',
  'A 5-minute focus session is better than no session at all.',
  'Tell a colleague when you are in focus mode to avoid interruptions.',
];

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
    onboardingWelcome:  document.getElementById('onboarding-welcome'),
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

    // Tip of the Day
    tipOfTheDay:        document.getElementById('tip-of-the-day'),
    tipText:            document.getElementById('tip-text'),
    tipDismiss:         document.getElementById('tip-dismiss'),

    // Share Progress
    btnShareProgress:   document.getElementById('btn-share-progress'),

    // Usage Counter
    usageCounter:       document.getElementById('usage-counter'),
    usageCount:         document.getElementById('usage-count'),
    usageBarFill:       document.getElementById('usage-bar-fill'),
    usageSubText:       document.getElementById('usage-sub-text'),

    // Milestone Toast
    milestoneToast:     document.getElementById('milestone-toast'),
    milestoneIcon:      document.getElementById('milestone-icon'),
    milestoneTitle:     document.getElementById('milestone-title'),
    milestoneMessage:   document.getElementById('milestone-message'),
    milestoneDismiss:   document.getElementById('milestone-dismiss'),

    // Rating Card
    ratingCard:         document.getElementById('rating-card'),
    btnRateStore:       document.getElementById('btn-rate-store'),
    btnRateDismiss:     document.getElementById('btn-rate-dismiss'),

    // Stats
    statsScoreRing:     document.getElementById('stats-score-ring'),
    statsScoreNumber:   document.getElementById('stats-score-number'),
    statsFocusTime:     document.getElementById('stats-focus-time'),
    statsTotalAttempts: document.getElementById('stats-total-attempts'),
    statsCurrentStreak: document.getElementById('stats-current-streak'),
    statsBestStreak:    document.getElementById('stats-best-streak'),
    topSitesList:       document.getElementById('top-sites-list'),
    noDistractionsMsg:  document.getElementById('no-distractions-msg'),
    statsEmptyMsg:      document.getElementById('stats-empty-msg'),
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

  // Clean up celebration animation when leaving post state
  if (stateName !== 'post') {
    els.statePost.classList.remove('state--celebrate');
  }
}

/**
 * Render the idle state with today's stats and score.
 * @param {Record<string, HTMLElement>} els
 * @param {object} state — full state from GET_STATE
 */
function renderIdleState(els, state) {
  showHomeState(els, 'idle');

  // Show onboarding welcome for first-time users
  const isNewUser = !state.onboardingComplete && (state.sessionCount || 0) === 0;
  if (els.onboardingWelcome) {
    els.onboardingWelcome.hidden = !isNewUser;
  }

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

  // Auto-focus the Quick Focus button for keyboard users
  if (els.btnQuickFocus && !els.btnQuickFocus.disabled) {
    els.btnQuickFocus.focus();
  }
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

  // Trigger celebration animation by removing and re-adding the class
  els.statePost.classList.remove('state--celebrate');
  void els.statePost.offsetWidth; // force reflow to restart animation
  els.statePost.classList.add('state--celebrate');

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
  const proStatus = state.isPro || false;
  const siteLimit = proStatus ? Infinity : ((state.proLimits && state.proLimits.maxSites) || DEFAULT_FREE_SITE_LIMIT);
  const prebuiltLimit = proStatus ? Infinity : ((state.proLimits && state.proLimits.maxPrebuiltLists) || DEFAULT_FREE_PREBUILT_LIMIT);

  // Site count
  els.siteCountUsed.textContent = String(blocklist.length);
  els.siteCountTotal.textContent = proStatus ? 'unlimited' : String(siteLimit);
  const fillPct = proStatus ? 0 : Math.min(100, (blocklist.length / siteLimit) * 100);
  els.siteCountFill.style.width = `${fillPct}%`;

  // Apply warning/full classes to the site-count container for color changes
  const siteCountEl = els.siteCountUsed.closest('.site-count');
  if (siteCountEl) {
    siteCountEl.classList.remove('site-count--warning', 'site-count--full');
    if (!proStatus) {
      if (blocklist.length >= siteLimit) {
        siteCountEl.classList.add('site-count--full');
      } else if (blocklist.length >= siteLimit * 0.7) {
        siteCountEl.classList.add('site-count--warning');
      }
    }
  }

  // Manual sites list
  els.manualSitesList.replaceChildren();
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
  if (!proStatus && blocklist.length >= siteLimit) {
    els.inputSite.disabled = true;
    els.inputSite.placeholder = 'Upgrade to Pro for unlimited sites';
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
  // Use safe DOM APIs instead of innerHTML for SVG
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  const line1 = document.createElementNS(svgNS, 'line');
  line1.setAttribute('x1', '18'); line1.setAttribute('y1', '6');
  line1.setAttribute('x2', '6'); line1.setAttribute('y2', '18');
  const line2 = document.createElementNS(svgNS, 'line');
  line2.setAttribute('x1', '6'); line2.setAttribute('y1', '6');
  line2.setAttribute('x2', '18'); line2.setAttribute('y2', '18');
  svg.appendChild(line1);
  svg.appendChild(line2);
  removeBtn.appendChild(svg);

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

  // Show motivational empty state when no sessions completed today
  const hasActivity = (stats.sessionsCompleted || 0) > 0 || (stats.focusMinutes || 0) > 0;
  if (els.statsEmptyMsg) {
    els.statsEmptyMsg.hidden = hasActivity;
  }

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

  els.topSitesList.replaceChildren();

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
// Tip of the Day
// ---------------------------------------------------------------------------

/**
 * Show a daily focus tip based on a date hash. The tip changes once per day.
 * Dismissing hides it for the rest of the day.
 * @param {Record<string, HTMLElement>} els
 */
function initTipOfTheDay(els) {
  if (!els.tipOfTheDay || !els.tipText) return;

  const today = new Date().toISOString().split('T')[0];

  // Check if user dismissed the tip today
  try {
    if (sessionStorage.getItem('focusmode_tip_dismissed') === today) return;
  } catch {
    // sessionStorage may not be available
  }

  // Pick a tip based on the date (deterministic per day)
  const dateHash = today.split('-').reduce((sum, part) => sum + parseInt(part, 10), 0);
  const tipIndex = dateHash % FOCUS_TIPS.length;
  els.tipText.textContent = FOCUS_TIPS[tipIndex];
  els.tipOfTheDay.hidden = false;

  if (els.tipDismiss) {
    els.tipDismiss.addEventListener('click', () => {
      els.tipOfTheDay.hidden = true;
      try {
        sessionStorage.setItem('focusmode_tip_dismissed', today);
      } catch {
        // ignore
      }
    });
  }
}

// ---------------------------------------------------------------------------
// Share Your Progress
// ---------------------------------------------------------------------------

/**
 * Initialize the share progress button on the Stats tab.
 * Copies a shareable text to the clipboard.
 * @param {Record<string, HTMLElement>} els
 * @param {object} state
 */
function initShareProgress(els, state) {
  if (!els.btnShareProgress) return;

  els.btnShareProgress.addEventListener('click', async () => {
    const stats = state.stats || {};
    const streak = state.streak || {};
    const sessions = stats.sessionsCompleted || 0;
    const focusTime = stats.focusMinutes || 0;
    const currentStreak = streak.current || 0;

    let shareText = 'I\'ve stayed focused';
    if (sessions > 0) {
      shareText += ` for ${sessions} session${sessions !== 1 ? 's' : ''}`;
    }
    if (focusTime > 0) {
      const hours = Math.floor(focusTime / 60);
      const mins = focusTime % 60;
      let timeStr = '';
      if (hours > 0 && mins > 0) timeStr = `${hours}h ${mins}m`;
      else if (hours > 0) timeStr = `${hours}h`;
      else timeStr = `${mins}m`;
      shareText += ` (${timeStr} of focus time)`;
    }
    if (currentStreak > 1) {
      shareText += ` with a ${currentStreak}-day streak`;
    }
    shareText += ' with Focus Mode! \uD83C\uDFAF';

    try {
      await navigator.clipboard.writeText(shareText);
      showToast(els, 'Copied!');
    } catch (err) {
      showToast(els, 'Could not copy to clipboard');
    }
  });
}

// ---------------------------------------------------------------------------
// Usage Counter
// ---------------------------------------------------------------------------

/** Milestone thresholds for weekly sessions */
const USAGE_MILESTONES = [
  { count: 5,  title: 'Getting started!', message: '5 sessions this week -- nice!', icon: '\u2605' },
  { count: 10, title: 'On a roll!',       message: '10 sessions this week -- keep it up!', icon: '\uD83D\uDD25' },
  { count: 25, title: 'Power user!',      message: '25 sessions this week -- you are crushing it!', icon: '\uD83C\uDFC6' },
  { count: 50, title: 'Incredible!',      message: '50 sessions this week -- you are a focus champion!', icon: '\u26A1' }
];

/**
 * Animate a number counting up in an element.
 * @param {HTMLElement} el
 * @param {number} from
 * @param {number} to
 * @param {number} duration — in ms
 */
function animateCounter(el, from, to, duration) {
  if (!el) return;
  const start = performance.now();
  const diff = to - from;

  function frame(time) {
    const elapsed = time - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = String(Math.round(from + diff * eased));

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      // Bump animation on finish
      el.classList.add('bump');
      setTimeout(() => el.classList.remove('bump'), 300);
    }
  }

  requestAnimationFrame(frame);
}

/**
 * Initialize the usage counter display.
 * Fetches weekly session count from the service worker and renders it.
 * @param {Record<string, HTMLElement>} els
 */
async function initUsageCounter(els) {
  try {
    const status = await sendMessage({ type: 'GET_USAGE_STATS' });
    if (!status || status.error) return;

    const count = status.weeklyCount || 0;

    // Animate the counter value
    animateCounter(els.usageCount, 0, count, 600);

    // Update the progress bar toward the next milestone
    const nextMilestone = USAGE_MILESTONES.find(m => m.count > count);
    const barTarget = nextMilestone
      ? Math.min(100, (count / nextMilestone.count) * 100)
      : 100;

    setTimeout(() => {
      if (els.usageBarFill) els.usageBarFill.style.width = barTarget + '%';
    }, 100);

    // Update the sub-text
    if (els.usageSubText) {
      if (nextMilestone) {
        const remaining = nextMilestone.count - count;
        els.usageSubText.textContent = remaining + ' more to reach ' + nextMilestone.count + '!';
      } else {
        els.usageSubText.textContent = 'You are a power user!';
      }
    }

    // Check for milestone celebrations
    checkUsageMilestone(els, count, status.lastCelebratedMilestone || 0);

  } catch (error) {
    console.error('[Popup] Failed to load usage stats:', error);
  }
}

/**
 * Show a milestone celebration toast if the user hit a new milestone.
 * @param {Record<string, HTMLElement>} els
 * @param {number} count — current weekly session count
 * @param {number} lastCelebrated — highest milestone already celebrated
 */
async function checkUsageMilestone(els, count, lastCelebrated) {
  const milestone = USAGE_MILESTONES.slice().reverse().find(m => count >= m.count);
  if (!milestone) return;
  if (lastCelebrated >= milestone.count) return; // Already celebrated

  if (!els.milestoneToast) return;

  if (els.milestoneIcon) els.milestoneIcon.textContent = milestone.icon;
  if (els.milestoneTitle) els.milestoneTitle.textContent = milestone.title;
  if (els.milestoneMessage) els.milestoneMessage.textContent = milestone.message;
  els.milestoneToast.removeAttribute('hidden');

  // Mark this milestone as celebrated
  await sendMessage({ type: 'SET_LAST_CELEBRATED_MILESTONE', milestone: milestone.count });

  if (els.milestoneDismiss) {
    els.milestoneDismiss.addEventListener('click', () => {
      els.milestoneToast.setAttribute('hidden', '');
    }, { once: true });
  }

  // Auto-dismiss after 8 seconds
  setTimeout(() => {
    if (els.milestoneToast && !els.milestoneToast.hasAttribute('hidden')) {
      els.milestoneToast.setAttribute('hidden', '');
    }
  }, 8000);
}

// ---------------------------------------------------------------------------
// Smart Rating Prompt
// ---------------------------------------------------------------------------

/** Rating prompt configuration */
const RATING_CONFIG = {
  minSessions: 10,           // Minimum completed sessions before showing
  minDaysInstalled: 7,       // Minimum days since install
  maxPrompts: 3,             // Maximum number of prompts ever
  cooldownMs: 30 * 24 * 60 * 60 * 1000, // 30 days between prompts
  reviewUrl: '' // Will be dynamically built with extension ID
};

/**
 * Initialize the smart rating prompt.
 * Shows a subtle rating card in the popup if eligibility criteria are met.
 * @param {Record<string, HTMLElement>} els
 */
async function initRatingPrompt(els) {
  if (!els.ratingCard || !els.btnRateStore || !els.btnRateDismiss) return;

  try {
    const result = await sendMessage({ type: 'GET_RATING_STATE' });
    if (!result || result.error) return;

    const ratingState = result.ratingState || {
      prompted: false,
      dismissed: false,
      lastPromptDate: null,
      promptCount: 0
    };

    const sessionCount = result.sessionCount || 0;
    const installDate = result.installDate;

    // Check eligibility
    if (!shouldShowRating(ratingState, sessionCount, installDate)) return;

    // Populate stars using DOM API (no innerHTML with user data)
    const starsEl = els.ratingCard.querySelector('.rating-card__stars');
    if (starsEl) {
      starsEl.textContent = '';
      for (let i = 0; i < 5; i++) {
        const star = document.createElement('span');
        star.textContent = '\u2605';
        star.style.color = '#F59E0B';
        starsEl.appendChild(star);
      }
    }

    // Show the card
    els.ratingCard.removeAttribute('hidden');

    // Update the rating state to record this prompt
    ratingState.prompted = true;
    ratingState.promptCount = (ratingState.promptCount || 0) + 1;
    ratingState.lastPromptDate = new Date().toISOString();
    await sendMessage({ type: 'UPDATE_RATING_STATE', ratingState: ratingState });

    // "Rate on Chrome Store" button
    els.btnRateStore.addEventListener('click', async () => {
      // Build the Chrome Web Store review URL using the extension's own ID
      const extId = chrome.runtime.id;
      const reviewUrl = 'https://chromewebstore.google.com/detail/' + extId + '/reviews';
      chrome.tabs.create({ url: reviewUrl });

      // Mark as rated so we never show again
      ratingState.dismissed = true;
      await sendMessage({ type: 'UPDATE_RATING_STATE', ratingState: ratingState });
      els.ratingCard.setAttribute('hidden', '');
    }, { once: true });

    // "Not now" button
    els.btnRateDismiss.addEventListener('click', async () => {
      ratingState.dismissed = false; // Not permanent — just this time
      ratingState.lastPromptDate = new Date().toISOString();
      await sendMessage({ type: 'UPDATE_RATING_STATE', ratingState: ratingState });
      els.ratingCard.setAttribute('hidden', '');
    }, { once: true });

  } catch (error) {
    console.error('[Popup] Rating prompt error:', error);
  }
}

/**
 * Determine if the rating prompt should be shown.
 * @param {object} ratingState
 * @param {number} sessionCount
 * @param {string|null} installDate
 * @returns {boolean}
 */
function shouldShowRating(ratingState, sessionCount, installDate) {
  // Already dismissed permanently (clicked "Rate")
  if (ratingState.dismissed === true) return false;

  // Max prompts reached
  if ((ratingState.promptCount || 0) >= RATING_CONFIG.maxPrompts) return false;

  // Not enough sessions
  if (sessionCount < RATING_CONFIG.minSessions) return false;

  // Not enough days since install
  if (installDate) {
    const daysSinceInstall = (Date.now() - new Date(installDate).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceInstall < RATING_CONFIG.minDaysInstalled) return false;
  }

  // Cooldown after last prompt
  if (ratingState.lastPromptDate) {
    const msSinceLastPrompt = Date.now() - new Date(ratingState.lastPromptDate).getTime();
    if (msSinceLastPrompt < RATING_CONFIG.cooldownMs) return false;
  }

  return true;
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
    const siteMax = (state.proLimits && state.proLimits.maxSites) || DEFAULT_FREE_SITE_LIMIT;
    if (!state.isPro && (state.blocklist || []).length >= siteMax) {
      showToast(els, 'Upgrade to Pro for unlimited sites', 3000);
      return;
    }

    const updatedList = [...(state.blocklist || []), domain];
    const response = await sendMessage({ type: 'UPDATE_BLOCKLIST', sites: updatedList });

    if (response && !response.error) {
      state.blocklist = updatedList;
      els.inputSite.value = '';
      renderBlocklistTab(els, state);
      showToast(els, `Added ${domain}`);
    } else if (response && response.limitReached) {
      showToast(els, 'Upgrade to Pro for unlimited sites', 3000);
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
        if (response && response.limitReached) {
          showToast(els, 'Upgrade to Pro for unlimited prebuilt lists', 3000);
        } else {
          showToast(els, response?.error || 'Failed to toggle list');
        }
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
        if (response && response.limitReached) {
          showToast(els, 'Upgrade to Pro for unlimited prebuilt lists', 3000);
        } else {
          showToast(els, response?.error || 'Failed to toggle list');
        }
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
  // Translate static strings from _locales via data-i18n attributes
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const msg = chrome.i18n.getMessage(el.dataset.i18n);
    if (msg) el.textContent = msg;
  });

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
      proLimits: { maxSites: DEFAULT_FREE_SITE_LIMIT, maxPrebuiltLists: DEFAULT_FREE_PREBUILT_LIMIT, maxSchedules: 1, nuclearMaxMinutes: 60, historyDays: 7 },
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

  // Initialize growth features
  initTipOfTheDay(els);
  initShareProgress(els, state);

  // Initialize conversion optimization features
  initUsageCounter(els);
  initRatingPrompt(els);

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

// Close the popup when Escape is pressed (unless focus is in an input)
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    window.close();
  }
});

// ---------------------------------------------------------------------------
// Error Logging — send popup errors to service worker
// ---------------------------------------------------------------------------

window.onerror = function (message, source, lineno, colno, error) {
  try {
    chrome.runtime.sendMessage({
      type: 'LOG_ERROR',
      source: 'popup',
      error: String(message),
      context: { file: source, lineno, colno, stack: error?.stack?.slice(0, 500) || '' },
    });
  } catch (_) {
    // Silently ignore if service worker is unavailable
  }
};

window.addEventListener('unhandledrejection', (event) => {
  try {
    const reason = event.reason;
    chrome.runtime.sendMessage({
      type: 'LOG_ERROR',
      source: 'popup',
      error: reason instanceof Error ? reason.message : String(reason),
      context: { handler: 'unhandledRejection', stack: reason?.stack?.slice(0, 500) || '' },
    });
  } catch (_) {
    // Silently ignore
  }
});
