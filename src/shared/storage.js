/**
 * Storage layer for Focus Mode - Blocker
 * Centralizes all chrome.storage operations with defaults and type safety.
 */

const DEFAULTS = {
  // Blocklist
  blocklist: [],
  activePrebuiltLists: [],

  // Timer / Session
  timerState: null, // { status: 'focus'|'break'|'idle', remaining: seconds, duration: seconds, startedAt: timestamp, cycle: number }
  sessionHistory: [],

  // Stats
  todayStats: {
    date: null,
    focusMinutes: 0,
    sessionsCompleted: 0,
    totalAttempts: 0,
    sitesBlocked: {},
    focusScore: 0
  },

  // Streak
  streak: {
    current: 0,
    lastActiveDate: null
  },

  // Settings
  settings: {
    theme: 'system',
    soundEnabled: false,
    selectedSound: 'rain',
    volume: 70,
    notificationMuting: true,
    schedule: null, // { days: [0-6], startTime: 'HH:MM', endTime: 'HH:MM', enabled: false }
    nuclearMode: null // { active: false, endsAt: null }
  },

  // Pro status
  isPro: false,

  // Onboarding
  onboardingComplete: false,
  installDate: null,
  sessionCount: 0
};

/**
 * Get one or more values from storage with defaults applied.
 * @param {string|string[]} keys
 * @returns {Promise<object>}
 */
export async function getStorage(keys) {
  const keyList = Array.isArray(keys) ? keys : [keys];
  const defaults = {};
  for (const key of keyList) {
    if (key in DEFAULTS) {
      defaults[key] = DEFAULTS[key];
    }
  }
  return chrome.storage.local.get(defaults);
}

// chrome.storage.local quota is 10 MB for extensions.
// We use a conservative per-call limit to prevent any single write from
// consuming an excessive share of that quota.
const MAX_STORAGE_WRITE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Set values in storage with a size safeguard.
 * Rejects writes that would exceed the per-call size limit to prevent
 * accidentally filling up the storage quota.
 * @param {object} data
 * @returns {Promise<void>}
 */
export async function setStorage(data) {
  // Estimate the serialized size of the data being written
  let serialized;
  try {
    serialized = JSON.stringify(data);
  } catch (e) {
    throw new Error('Storage write failed: data is not serializable.');
  }

  if (serialized.length > MAX_STORAGE_WRITE_BYTES) {
    console.error('[Storage] Write rejected: data size', serialized.length, 'bytes exceeds limit of', MAX_STORAGE_WRITE_BYTES, 'bytes.');
    throw new Error('Storage write rejected: data exceeds maximum allowed size.');
  }

  return chrome.storage.local.set(data);
}

/**
 * Get today's stats, creating fresh stats if the date has changed.
 * @returns {Promise<object>}
 */
export async function getTodayStats() {
  const { todayStats } = await getStorage('todayStats');
  const today = new Date().toISOString().split('T')[0];

  if (todayStats.date !== today) {
    const fresh = {
      ...DEFAULTS.todayStats,
      date: today
    };
    await setStorage({ todayStats: fresh });
    return fresh;
  }

  return todayStats;
}

/**
 * Increment a distraction attempt for a specific domain.
 * @param {string} domain
 * @returns {Promise<object>} Updated stats
 */
export async function recordDistraction(domain) {
  const stats = await getTodayStats();
  stats.totalAttempts += 1;
  stats.sitesBlocked[domain] = (stats.sitesBlocked[domain] || 0) + 1;
  await setStorage({ todayStats: stats });
  return stats;
}

/**
 * Record a completed focus session.
 * @param {object} session - { duration, focusMinutes, completed }
 */
export async function recordSession(session) {
  const stats = await getTodayStats();
  const { sessionHistory, sessionCount, streak } = await getStorage(['sessionHistory', 'sessionCount', 'streak']);

  if (session.completed) {
    stats.sessionsCompleted += 1;
    stats.focusMinutes += session.focusMinutes;
  }

  // Update session history
  const record = {
    date: new Date().toISOString(),
    duration: session.duration,
    focusMinutes: session.focusMinutes,
    completed: session.completed,
    attemptsBlocked: stats.totalAttempts
  };

  const history = [...sessionHistory, record];
  // Free tier: keep last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const prunedHistory = history.filter(s => new Date(s.date) >= sevenDaysAgo);

  // Update streak
  const today = new Date().toISOString().split('T')[0];
  const updatedStreak = { ...streak };
  if (session.completed && updatedStreak.lastActiveDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (updatedStreak.lastActiveDate === yesterdayStr || updatedStreak.current === 0) {
      updatedStreak.current += 1;
    } else if (updatedStreak.lastActiveDate !== today) {
      updatedStreak.current = 1;
    }
    updatedStreak.lastActiveDate = today;
  }

  // Calculate Focus Score
  const focusScore = calculateFocusScore(stats, updatedStreak);
  stats.focusScore = focusScore;

  await setStorage({
    todayStats: stats,
    sessionHistory: prunedHistory,
    sessionCount: sessionCount + 1,
    streak: updatedStreak
  });

  return { stats, streak: updatedStreak, focusScore };
}

/**
 * Calculate Focus Score (0-100).
 * Formula: (completionRate * 35) + (100 - distractionRate) * 25 + (goalRate * 25) + (streakBonus * 15)
 */
function calculateFocusScore(stats, streak) {
  // Session completion rate (out of 100)
  const completionRate = stats.sessionsCompleted > 0 ? 100 : 0;

  // Distraction rate (fewer attempts = better)
  // Scale: 0 attempts = 100, 50+ attempts = 0
  const distractionScore = Math.max(0, 100 - (stats.totalAttempts * 2));

  // Goal rate (simplified: did they complete at least 1 session today?)
  const goalRate = stats.sessionsCompleted > 0 ? 100 : 0;

  // Streak bonus (capped at 100)
  const streakBonus = Math.min(100, streak.current * 10);

  const score = Math.round(
    (completionRate * 0.35) +
    (distractionScore * 0.25) +
    (goalRate * 0.25) +
    (streakBonus * 0.15)
  );

  return Math.max(0, Math.min(100, score));
}

/**
 * Get the full blocklist (manual + active prebuilt lists).
 * @returns {Promise<string[]>} Array of domains to block
 */
export async function getFullBlocklist() {
  const { blocklist, activePrebuiltLists } = await getStorage(['blocklist', 'activePrebuiltLists']);

  let allSites = [...blocklist];

  if (activePrebuiltLists.length > 0) {
    try {
      const response = await fetch(chrome.runtime.getURL('src/data/blocklists.json'));
      const lists = await response.json();

      for (const listId of activePrebuiltLists) {
        if (lists[listId] && lists[listId].sites) {
          allSites = [...allSites, ...lists[listId].sites];
        }
      }
    } catch (e) {
      console.error('Failed to load prebuilt blocklists:', e);
    }
  }

  // Deduplicate
  return [...new Set(allSites)];
}
