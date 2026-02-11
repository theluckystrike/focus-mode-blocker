/**
 * Focus Mode - Blocker: Background Service Worker
 * Handles site blocking, focus timer, nuclear mode, and message routing.
 */

import {
  getStorage,
  setStorage,
  getTodayStats,
  recordDistraction,
  recordSession,
  getFullBlocklist
} from '../shared/storage.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALARM_TICK = 'focus-tick';
const ALARM_SCHEDULE_CHECK = 'schedule-check';
const ALARM_NUCLEAR_END = 'nuclear-end';

const DEFAULTS_TIMER = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  cyclesToLongBreak: 4
};

const BADGE_COLORS = {
  focus: '#22c55e',
  break: '#3b82f6',
  nuclear: '#ef4444'
};

const BLOCK_PAGE_PATH = 'src/blocked/blocked.html';

// Maximum number of sites allowed in the blocklist (safety limit)
const MAX_BLOCKLIST_SIZE = 500;

// Domain validation regex: bare domain like "example.com" or "sub.example.co.uk"
const DOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

// Allowed prebuilt list IDs
const ALLOWED_PREBUILT_LIST_IDS = ['social-media', 'news', 'entertainment', 'gaming', 'shopping'];

/**
 * Sanitize and validate a domain string.
 * Strips protocols, www prefix, paths, query strings, fragments, and ports.
 * Returns the cleaned domain or null if invalid.
 * @param {string} input
 * @returns {string|null}
 */
function sanitizeDomain(input) {
  if (!input || typeof input !== 'string') return null;
  let cleaned = input.trim().toLowerCase();
  cleaned = cleaned.replace(/^https?:\/\//, '');
  cleaned = cleaned.replace(/^www\./, '');
  cleaned = cleaned.split('/')[0].split('?')[0].split('#')[0];
  cleaned = cleaned.split(':')[0];
  if (!cleaned || cleaned.length > 253 || !cleaned.includes('.')) return null;
  if (!DOMAIN_REGEX.test(cleaned)) return null;
  return cleaned;
}

// ---------------------------------------------------------------------------
// Alarm Deduplication Helper
// ---------------------------------------------------------------------------
// Before creating an alarm, check if one with the same name already exists.
// This avoids unnecessarily recreating periodic alarms (e.g., schedule-check)
// on every service worker restart, which resets the alarm's period timer.

async function ensureAlarm(name, options) {
  try {
    const existing = await chrome.alarms.get(name);
    if (existing) {
      return; // Alarm already exists; no need to recreate
    }
    await chrome.alarms.create(name, options);
  } catch (err) {
    console.error('[SW] ensureAlarm failed for', name, ':', err);
  }
}

// ---------------------------------------------------------------------------
// Session Flag (chrome.storage.session)
// ---------------------------------------------------------------------------
// The content script (detector.js) checks this flag to avoid sending
// CHECK_BLOCKED messages on every page load when no session is running.
// chrome.storage.session is ephemeral (cleared when the browser closes)
// and fast to read, making it ideal for this hot-path check.

async function setSessionFlag(active) {
  try {
    await chrome.storage.session.set({ focusActive: active });
  } catch (e) {
    // chrome.storage.session requires Chrome 102+; log but don't break
    console.warn('[SW] Failed to set session flag:', e);
  }
}

// ---------------------------------------------------------------------------
// Blocking Rules (declarativeNetRequest)
// ---------------------------------------------------------------------------

async function updateBlockingRules(domains) {
  try {
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const existingIds = existingRules.map(r => r.id);

    if (existingIds.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existingIds
      });
    }

    if (!domains || domains.length === 0) {
      return;
    }

    const rules = [];
    let ruleId = 1;

    for (const domain of domains) {
      const cleanDomain = domain.replace(/^www\./, '').replace(/\/.*$/, '');

      rules.push({
        id: ruleId++,
        priority: 1,
        action: {
          type: 'redirect',
          redirect: {
            extensionPath: '/src/blocked/blocked.html?domain=' + encodeURIComponent(cleanDomain)
          }
        },
        condition: {
          urlFilter: '||' + cleanDomain,
          resourceTypes: ['main_frame']
        }
      });
    }

    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: rules
    });
  } catch (err) {
    console.error('[SW] updateBlockingRules failed:', err);
  }
}

async function clearBlockingRules() {
  try {
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const existingIds = existingRules.map(r => r.id);

    if (existingIds.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existingIds
      });
    }
  } catch (err) {
    console.error('[SW] clearBlockingRules failed:', err);
  }
}

// ---------------------------------------------------------------------------
// Timer State Helpers
// ---------------------------------------------------------------------------

async function getTimerState() {
  const { timerState } = await getStorage('timerState');
  return timerState;
}

async function setTimerState(state) {
  await setStorage({ timerState: state });
}

// ---------------------------------------------------------------------------
// Focus Timer
// ---------------------------------------------------------------------------

async function startFocusSession(durationMinutes) {
  const { settings } = await getStorage('settings');

  if (settings.nuclearMode && settings.nuclearMode.active && Date.now() < settings.nuclearMode.endsAt) {
    // Nuclear mode is active; blocking is already locked in. Just start the timer.
  }

  const duration = (durationMinutes || DEFAULTS_TIMER.focusDuration) * 60;
  const currentState = await getTimerState();
  const cycle = (currentState && currentState.cycle) ? currentState.cycle : 1;

  const timerState = {
    status: 'focus',
    remaining: duration,
    duration: duration,
    startedAt: Date.now(),
    cycle: cycle
  };

  await setTimerState(timerState);
  await setSessionFlag(true);

  const domains = await getFullBlocklist();
  await updateBlockingRules(domains);

  await updateBadge('focus', Math.ceil(duration / 60));

  await chrome.alarms.create(ALARM_TICK, { periodInMinutes: 1 });
}

async function stopSession() {
  const { settings } = await getStorage('settings');

  if (settings.nuclearMode && settings.nuclearMode.active && Date.now() < settings.nuclearMode.endsAt) {
    return { error: 'Cannot stop session during nuclear mode.' };
  }

  const timerState = await getTimerState();

  if (timerState && timerState.status === 'focus') {
    const elapsed = Math.floor((Date.now() - timerState.startedAt) / 1000);
    const focusMinutes = Math.floor(elapsed / 60);

    await recordSession({
      duration: timerState.duration,
      focusMinutes: focusMinutes,
      completed: false
    });
  }

  await setTimerState(null);
  await chrome.alarms.clear(ALARM_TICK);

  const scheduleActive = await isScheduleActive();
  if (!scheduleActive) {
    await clearBlockingRules();
    await setSessionFlag(false);
  }

  await clearBadge();
  return { success: true };
}

async function startBreak(isLong) {
  const breakDuration = isLong
    ? DEFAULTS_TIMER.longBreakDuration * 60
    : DEFAULTS_TIMER.shortBreakDuration * 60;

  const currentState = await getTimerState();
  const cycle = currentState ? currentState.cycle : 1;

  const timerState = {
    status: isLong ? 'longbreak' : 'break',
    remaining: breakDuration,
    duration: breakDuration,
    startedAt: Date.now(),
    cycle: cycle
  };

  await setTimerState(timerState);

  const scheduleActive = await isScheduleActive();
  if (!scheduleActive) {
    await clearBlockingRules();
  }

  await updateBadge('break');

  await chrome.alarms.create(ALARM_TICK, { periodInMinutes: 1 });
}

async function onAlarmTick() {
  const timerState = await getTimerState();
  if (!timerState || timerState.status === 'idle') {
    await chrome.alarms.clear(ALARM_TICK);
    return;
  }

  const elapsed = Math.floor((Date.now() - timerState.startedAt) / 1000);
  const remaining = Math.max(0, timerState.duration - elapsed);
  timerState.remaining = remaining;

  if (remaining <= 0) {
    await chrome.alarms.clear(ALARM_TICK);

    if (timerState.status === 'focus') {
      await onFocusComplete(timerState);
    } else {
      await onBreakComplete(timerState);
    }
    return;
  }

  await setTimerState(timerState);

  if (timerState.status === 'focus') {
    const minutesLeft = Math.ceil(remaining / 60);
    await updateBadge('focus', minutesLeft);
  }
}

async function onFocusComplete(timerState) {
  const stats = await getTodayStats();

  await recordSession({
    duration: timerState.duration,
    focusMinutes: Math.floor(timerState.duration / 60),
    completed: true
  });

  const distractions = stats.totalAttempts;
  const durationMin = Math.floor(timerState.duration / 60);

  await chrome.notifications.create('session-complete', {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('src/assets/icons/icon-128.png'),
    title: 'Focus Session Complete!',
    message: `You blocked ${distractions} distractions in ${durationMin} minutes.`,
    priority: 2
  });

  const isLongBreak = timerState.cycle >= DEFAULTS_TIMER.cyclesToLongBreak;
  const nextCycle = isLongBreak ? 1 : timerState.cycle + 1;

  const breakState = {
    status: isLongBreak ? 'longbreak' : 'break',
    remaining: (isLongBreak ? DEFAULTS_TIMER.longBreakDuration : DEFAULTS_TIMER.shortBreakDuration) * 60,
    duration: (isLongBreak ? DEFAULTS_TIMER.longBreakDuration : DEFAULTS_TIMER.shortBreakDuration) * 60,
    startedAt: Date.now(),
    cycle: nextCycle
  };

  await setTimerState(breakState);

  const { settings } = await getStorage('settings');
  const nuclearActive = settings.nuclearMode && settings.nuclearMode.active && Date.now() < settings.nuclearMode.endsAt;
  const scheduleActive = await isScheduleActive();

  if (!nuclearActive && !scheduleActive) {
    await clearBlockingRules();
  }

  await updateBadge('break');

  await chrome.alarms.create(ALARM_TICK, { periodInMinutes: 1 });
}

async function onBreakComplete(timerState) {
  await chrome.notifications.create('break-complete', {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('src/assets/icons/icon-128.png'),
    title: 'Break Over!',
    message: 'Ready for another focus session?',
    priority: 2
  });

  const idleState = {
    status: 'idle',
    remaining: 0,
    duration: 0,
    startedAt: null,
    cycle: timerState.cycle
  };

  await setTimerState(idleState);
  await clearBadge();

  // Clear the session flag unless schedule or nuclear keeps blocking active
  const scheduleActive = await isScheduleActive();
  const nuclearActive = await isNuclearActive();
  if (!scheduleActive && !nuclearActive) {
    await setSessionFlag(false);
  }
}

// ---------------------------------------------------------------------------
// Badge Updates
// ---------------------------------------------------------------------------

async function updateBadge(mode, minutes) {
  try {
    switch (mode) {
      case 'focus':
        await chrome.action.setBadgeText({ text: `${minutes}m` });
        await chrome.action.setBadgeBackgroundColor({ color: BADGE_COLORS.focus });
        break;
      case 'break':
        await chrome.action.setBadgeText({ text: 'BRK' });
        await chrome.action.setBadgeBackgroundColor({ color: BADGE_COLORS.break });
        break;
      case 'nuclear':
        await chrome.action.setBadgeText({ text: 'NUC' });
        await chrome.action.setBadgeBackgroundColor({ color: BADGE_COLORS.nuclear });
        break;
    }
  } catch (err) {
    console.error('[SW] updateBadge failed:', err);
  }
}

async function clearBadge() {
  try {
    await chrome.action.setBadgeText({ text: '' });
  } catch (err) {
    console.error('[SW] clearBadge failed:', err);
  }
}

// ---------------------------------------------------------------------------
// Nuclear Mode
// ---------------------------------------------------------------------------

async function activateNuclear(durationMinutes) {
  try {
    const endsAt = Date.now() + durationMinutes * 60 * 1000;

    const { settings } = await getStorage('settings');
    settings.nuclearMode = { active: true, endsAt: endsAt };
    await setStorage({ settings });

    const domains = await getFullBlocklist();
    await updateBlockingRules(domains);
    await setSessionFlag(true);

    await updateBadge('nuclear');

    const alarmTime = durationMinutes;
    await chrome.alarms.create(ALARM_NUCLEAR_END, { delayInMinutes: alarmTime });
  } catch (err) {
    console.error('[SW] activateNuclear failed:', err);
  }
}

async function onNuclearEnd() {
  const { settings } = await getStorage('settings');
  settings.nuclearMode = { active: false, endsAt: null };
  await setStorage({ settings });

  await chrome.notifications.create('nuclear-ended', {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('src/assets/icons/icon-128.png'),
    title: 'Nuclear Mode Ended',
    message: 'Nuclear mode has ended. Blocking rules are back to normal.',
    priority: 2
  });

  const timerState = await getTimerState();
  if (timerState && timerState.status === 'focus') {
    const minutesLeft = Math.ceil(timerState.remaining / 60);
    await updateBadge('focus', minutesLeft);
  } else if (timerState && (timerState.status === 'break' || timerState.status === 'longbreak')) {
    await updateBadge('break');
  } else {
    const scheduleActive = await isScheduleActive();
    if (!scheduleActive) {
      await clearBlockingRules();
      await setSessionFlag(false);
    }
    await clearBadge();
  }
}

async function isNuclearActive() {
  const { settings } = await getStorage('settings');
  if (!settings.nuclearMode || !settings.nuclearMode.active) {
    return false;
  }
  if (Date.now() >= settings.nuclearMode.endsAt) {
    settings.nuclearMode = { active: false, endsAt: null };
    await setStorage({ settings });
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Schedule Checking
// ---------------------------------------------------------------------------

async function isScheduleActive() {
  const { settings } = await getStorage('settings');
  const schedule = settings.schedule;

  if (!schedule || !schedule.enabled) {
    return false;
  }

  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  if (!schedule.days.includes(currentDay)) {
    return false;
  }

  return currentTime >= schedule.startTime && currentTime <= schedule.endTime;
}

async function checkSchedule() {
  const active = await isScheduleActive();
  const timerState = await getTimerState();
  const nuclearActive = await isNuclearActive();

  if (nuclearActive) {
    return;
  }

  if (active && (!timerState || timerState.status === 'idle')) {
    const domains = await getFullBlocklist();
    await updateBlockingRules(domains);
    await setSessionFlag(true);
  } else if (!active && (!timerState || timerState.status === 'idle' || timerState.status === 'break' || timerState.status === 'longbreak')) {
    if (!timerState || timerState.status === 'idle') {
      await clearBlockingRules();
      await setSessionFlag(false);
    }
  }
}

// ---------------------------------------------------------------------------
// Message Handling
// ---------------------------------------------------------------------------

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse).catch(err => {
    console.error('Message handler error:', err);
    sendResponse({ error: err.message });
  });
  return true;
});

async function handleMessage(message, sender) {
  // --- Message validation: reject malformed messages ---
  if (!message || typeof message !== 'object' || typeof message.type !== 'string') {
    return { error: 'Invalid message format.' };
  }

  switch (message.type) {
    case 'START_SESSION': {
      // Validate duration: must be a positive number, max 480 minutes (8 hours)
      const dur = Number(message.duration);
      if (message.duration != null && (!Number.isFinite(dur) || dur <= 0 || dur > 480)) {
        return { error: 'Invalid duration. Must be 1-480 minutes.' };
      }
      await startFocusSession(dur || DEFAULTS_TIMER.focusDuration);
      return { success: true };
    }

    case 'STOP_SESSION':
      return await stopSession();

    case 'GET_STATE':
      return await getFullState();

    case 'UPDATE_BLOCKLIST':
      return await handleUpdateBlocklist(message.sites);

    case 'TOGGLE_PREBUILT_LIST': {
      // Validate listId against allowed values
      if (typeof message.listId !== 'string' || !ALLOWED_PREBUILT_LIST_IDS.includes(message.listId)) {
        return { error: 'Invalid list ID.' };
      }
      return await handleTogglePrebuiltList(message.listId);
    }

    case 'ACTIVATE_NUCLEAR': {
      // Validate duration: must be a positive number, max 1440 minutes (24 hours)
      const nucDur = Number(message.duration);
      if (!Number.isFinite(nucDur) || nucDur <= 0 || nucDur > 1440) {
        return { error: 'Invalid nuclear duration. Must be 1-1440 minutes.' };
      }
      await activateNuclear(nucDur);
      return { success: true };
    }

    case 'CHECK_BLOCKED': {
      // Validate payload
      if (!message.payload || typeof message.payload !== 'object' || typeof message.payload.domain !== 'string') {
        return { blocked: false };
      }
      return await handleCheckBlocked(message.payload);
    }

    case 'GET_BLOCK_INFO': {
      // Validate domain
      if (typeof message.domain !== 'string' || !message.domain) {
        return { error: 'Invalid domain.' };
      }
      const cleanedDomain = sanitizeDomain(message.domain);
      return await getBlockInfo(cleanedDomain || message.domain);
    }

    case 'RECORD_DISTRACTION': {
      // Validate domain
      if (typeof message.domain !== 'string' || !message.domain) {
        return { error: 'Invalid domain.' };
      }
      return await recordDistraction(message.domain);
    }

    case 'START_BREAK': {
      await startBreak(message.isLong === true);
      return { success: true };
    }

    case 'SKIP_BREAK': {
      const skipDur = Number(message.duration);
      if (message.duration != null && (!Number.isFinite(skipDur) || skipDur <= 0 || skipDur > 480)) {
        return { error: 'Invalid duration.' };
      }
      await startFocusSession(skipDur || DEFAULTS_TIMER.focusDuration);
      return { success: true };
    }

    case 'OVERRIDE_BLOCK': {
      // Validate domain
      if (typeof message.domain !== 'string' || !message.domain) {
        return { error: 'Invalid domain.' };
      }
      return await handleOverrideBlock(message.domain);
    }

    case 'UPDATE_SCHEDULE': {
      // Validate schedule object structure
      if (message.schedule != null && typeof message.schedule !== 'object') {
        return { error: 'Invalid schedule format.' };
      }
      return await handleUpdateSchedule(message.schedule);
    }

    default:
      return { error: 'Unknown message type.' };
  }
}

async function getFullState() {
  const timerState = await getTimerState();
  const stats = await getTodayStats();
  const { streak, settings, blocklist, activePrebuiltLists, sessionCount, onboardingComplete } = await getStorage([
    'streak', 'settings', 'blocklist', 'activePrebuiltLists', 'sessionCount', 'onboardingComplete'
  ]);

  let adjustedTimer = timerState;
  if (timerState && timerState.startedAt && timerState.status !== 'idle') {
    const elapsed = Math.floor((Date.now() - timerState.startedAt) / 1000);
    adjustedTimer = {
      ...timerState,
      remaining: Math.max(0, timerState.duration - elapsed)
    };
  }

  const nuclearActive = await isNuclearActive();

  return {
    timerState: adjustedTimer,
    stats,
    streak,
    settings,
    blocklist,
    activePrebuiltLists,
    sessionCount,
    onboardingComplete,
    nuclearActive
  };
}

async function handleUpdateBlocklist(sites) {
  const nuclearActive = await isNuclearActive();
  if (nuclearActive) {
    return { error: 'Cannot modify blocklist during nuclear mode.' };
  }

  // Validate input: must be an array
  if (!Array.isArray(sites)) {
    return { error: 'Invalid blocklist format. Expected an array.' };
  }

  // Enforce size limit
  if (sites.length > MAX_BLOCKLIST_SIZE) {
    return { error: `Blocklist cannot exceed ${MAX_BLOCKLIST_SIZE} sites.` };
  }

  // Sanitize and validate each domain; reject invalid entries
  const sanitized = [];
  for (const site of sites) {
    const clean = sanitizeDomain(site);
    if (!clean) {
      return { error: `Invalid domain: ${typeof site === 'string' ? site.slice(0, 100) : 'invalid'}` };
    }
    if (!sanitized.includes(clean)) {
      sanitized.push(clean);
    }
  }

  await setStorage({ blocklist: sanitized });

  const timerState = await getTimerState();
  const scheduleActive = await isScheduleActive();

  if ((timerState && timerState.status === 'focus') || scheduleActive) {
    const domains = await getFullBlocklist();
    await updateBlockingRules(domains);
  }

  return { success: true };
}

async function handleTogglePrebuiltList(listId) {
  const nuclearActive = await isNuclearActive();
  if (nuclearActive) {
    return { error: 'Cannot modify lists during nuclear mode.' };
  }

  const { activePrebuiltLists } = await getStorage('activePrebuiltLists');
  let updated;

  if (activePrebuiltLists.includes(listId)) {
    updated = activePrebuiltLists.filter(id => id !== listId);
  } else {
    updated = [...activePrebuiltLists, listId];
  }

  await setStorage({ activePrebuiltLists: updated });

  const timerState = await getTimerState();
  const scheduleActive = await isScheduleActive();

  if ((timerState && timerState.status === 'focus') || scheduleActive) {
    const domains = await getFullBlocklist();
    await updateBlockingRules(domains);
  }

  return { success: true, activePrebuiltLists: updated };
}

async function handleCheckBlocked(payload) {
  const domains = await getFullBlocklist();
  const cleanDomain = payload.domain.replace(/^www\./, '').replace(/\/.*$/, '');
  const inBlocklist = domains.some(d => {
    const clean = d.replace(/^www\./, '').replace(/\/.*$/, '');
    return clean === cleanDomain;
  });

  if (!inBlocklist) {
    return { blocked: false };
  }

  const nuclearActive = await isNuclearActive();
  if (nuclearActive) {
    return { blocked: true, reason: 'nuclear' };
  }

  const scheduleActive = await isScheduleActive();
  if (scheduleActive) {
    return { blocked: true, reason: 'schedule' };
  }

  const timerState = await getTimerState();
  if (timerState && timerState.status === 'focus') {
    return { blocked: true, reason: 'blocklist' };
  }

  return { blocked: false };
}

async function getBlockInfo(domain) {
  const stats = await getTodayStats();
  const { streak, settings } = await getStorage(['streak', 'settings']);
  const timerState = await getTimerState();

  let quotes;
  try {
    const response = await fetch(chrome.runtime.getURL('src/data/quotes.json'));
    quotes = await response.json();
  } catch (e) {
    quotes = ['Stay focused. You got this.'];
  }

  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  const domainAttempts = stats.sitesBlocked[domain] || 0;

  // Adjust timer remaining based on current time
  let adjustedTimer = timerState;
  if (timerState && timerState.startedAt && timerState.status !== 'idle') {
    const elapsed = Math.floor((Date.now() - timerState.startedAt) / 1000);
    adjustedTimer = {
      ...timerState,
      remaining: Math.max(0, timerState.duration - elapsed)
    };
  }

  return {
    domain,
    attempts: domainAttempts,
    totalAttempts: stats.totalAttempts,
    streak: streak,
    focusScore: stats.focusScore,
    quote: randomQuote,
    timerState: adjustedTimer,
    settings: settings,
    todayStats: stats
  };
}

async function handleOverrideBlock(domain) {
  const nuclearActive = await isNuclearActive();
  if (nuclearActive) {
    return { error: 'Cannot override blocks during nuclear mode.' };
  }

  // Record the override as a distraction and temporarily remove
  // the blocking rule for this domain so navigation can proceed.
  await recordDistraction(domain);

  const cleanDomain = domain.replace(/^www\./, '').replace(/\/.*$/, '');

  // Remove only the rule matching this domain
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const idsToRemove = existingRules
    .filter(r => {
      const filter = r.condition && r.condition.urlFilter;
      if (!filter) return false;
      return filter === '||' + cleanDomain;
    })
    .map(r => r.id);

  if (idsToRemove.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: idsToRemove
    });
  }

  // Set a 5-minute alarm to re-add the blocking rule
  await chrome.alarms.create('override-' + cleanDomain, { delayInMinutes: 5 });

  return { success: true };
}

async function handleUpdateSchedule(schedule) {
  const { settings } = await getStorage('settings');
  settings.schedule = schedule;
  await setStorage({ settings });

  // Immediately check if the schedule should activate or deactivate blocking
  await checkSchedule();

  return { success: true };
}

// ---------------------------------------------------------------------------
// Override Expiry
// ---------------------------------------------------------------------------

async function onOverrideExpiry(domain) {
  const timerState = await getTimerState();
  const scheduleActive = await isScheduleActive();
  const nuclearActive = await isNuclearActive();

  // Re-add blocking rules if a focus session, schedule, or nuclear mode is still active
  if (nuclearActive || scheduleActive || (timerState && timerState.status === 'focus')) {
    const domains = await getFullBlocklist();
    await updateBlockingRules(domains);
  }
}

// ---------------------------------------------------------------------------
// Alarm Listener
// ---------------------------------------------------------------------------

chrome.alarms.onAlarm.addListener(async (alarm) => {
  try {
    switch (true) {
      case alarm.name === ALARM_TICK:
        await onAlarmTick();
        break;
      case alarm.name === ALARM_SCHEDULE_CHECK:
        await checkSchedule();
        break;
      case alarm.name === ALARM_NUCLEAR_END:
        await onNuclearEnd();
        break;
      case alarm.name.startsWith('override-'):
        await onOverrideExpiry(alarm.name.replace('override-', ''));
        break;
    }
  } catch (err) {
    console.error('[SW] Alarm handler error for', alarm.name, ':', err);
  }
});

// ---------------------------------------------------------------------------
// Install & Startup
// ---------------------------------------------------------------------------

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await setStorage({
      blocklist: [],
      activePrebuiltLists: [],
      timerState: null,
      sessionHistory: [],
      todayStats: {
        date: new Date().toISOString().split('T')[0],
        focusMinutes: 0,
        sessionsCompleted: 0,
        totalAttempts: 0,
        sitesBlocked: {},
        focusScore: 0
      },
      streak: { current: 0, lastActiveDate: null },
      settings: {
        theme: 'system',
        soundEnabled: false,
        selectedSound: 'rain',
        volume: 70,
        notificationMuting: true,
        schedule: null,
        nuclearMode: null
      },
      isPro: false,
      onboardingComplete: false,
      installDate: new Date().toISOString(),
      sessionCount: 0
    });

    await ensureAlarm(ALARM_SCHEDULE_CHECK, { periodInMinutes: 1 });
  }

  if (details.reason === 'update') {
    await ensureAlarm(ALARM_SCHEDULE_CHECK, { periodInMinutes: 1 });
    await restoreState();
  }
});

chrome.runtime.onStartup.addListener(async () => {
  await ensureAlarm(ALARM_SCHEDULE_CHECK, { periodInMinutes: 1 });
  await restoreState();
});

async function restoreState() {
  try {
    const timerState = await getTimerState();
    const nuclearActive = await isNuclearActive();

    if (nuclearActive) {
      const { settings } = await getStorage('settings');
      const remainingMs = settings.nuclearMode.endsAt - Date.now();
      if (remainingMs > 0) {
        const domains = await getFullBlocklist();
        await updateBlockingRules(domains);
        await setSessionFlag(true);
        await updateBadge('nuclear');
        await chrome.alarms.create(ALARM_NUCLEAR_END, { delayInMinutes: remainingMs / 60000 });
      } else {
        await onNuclearEnd();
      }
      return;
    }

    if (timerState && timerState.startedAt && timerState.status !== 'idle') {
      const elapsed = Math.floor((Date.now() - timerState.startedAt) / 1000);
      const remaining = timerState.duration - elapsed;

      if (remaining <= 0) {
        if (timerState.status === 'focus') {
          await onFocusComplete(timerState);
        } else {
          await onBreakComplete(timerState);
        }
      } else {
        timerState.remaining = remaining;
        await setTimerState(timerState);

        if (timerState.status === 'focus') {
          const domains = await getFullBlocklist();
          await updateBlockingRules(domains);
          await setSessionFlag(true);
          await updateBadge('focus', Math.ceil(remaining / 60));
        } else {
          await updateBadge('break');
        }

        await chrome.alarms.create(ALARM_TICK, { periodInMinutes: 1 });
      }
    } else {
      // No active timer; checkSchedule will set the session flag appropriately
      await checkSchedule();
    }
  } catch (err) {
    console.error('[SW] restoreState failed:', err);
  }
}

// ---------------------------------------------------------------------------
// Keyboard Shortcuts
// ---------------------------------------------------------------------------

chrome.commands.onCommand.addListener(async (command) => {
  try {
    switch (command) {
      case 'quick-focus': {
        const timerState = await getTimerState();
        if (timerState && (timerState.status === 'focus' || timerState.status === 'break' || timerState.status === 'longbreak')) {
          await stopSession();
        } else {
          await startFocusSession(DEFAULTS_TIMER.focusDuration);
        }
        break;
      }
      case 'nuclear-mode': {
        const nuclearActive = await isNuclearActive();
        if (!nuclearActive) {
          await activateNuclear(60);
        }
        break;
      }
    }
  } catch (err) {
    console.error('[SW] Command handler error for', command, ':', err);
  }
});
