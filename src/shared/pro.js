/**
 * Pro Feature Gating Module
 *
 * Provides helpers to check Pro status and retrieve feature limits.
 * No actual payment processing — just reads the `isPro` flag from
 * chrome.storage.local and returns the appropriate limits.
 */

/**
 * All Pro features with human-readable descriptions.
 * Used by the upgrade card in the options page and for upsell messages.
 */
export const PRO_FEATURES = [
  {
    id: 'unlimited_sites',
    title: 'Unlimited blocked sites',
    description: 'Block as many distracting sites as you need (free: 10)',
  },
  {
    id: 'unlimited_prebuilt_lists',
    title: 'All pre-built blocklists',
    description: 'Access Entertainment, Gaming, Shopping lists and more (free: 2)',
  },
  {
    id: 'extended_nuclear',
    title: 'Extended Nuclear Mode',
    description: 'Lock your blocklist for up to 24 hours (free: 60 min max)',
  },
  {
    id: 'unlimited_schedules',
    title: 'Unlimited schedules',
    description: 'Create multiple blocking schedules (free: 1)',
  },
  {
    id: 'extended_history',
    title: '90-day history',
    description: 'Review your focus history for up to 90 days (free: 7 days)',
  },
  {
    id: 'weekly_reports',
    title: 'Weekly focus reports',
    description: 'Get detailed weekly breakdowns of your focus habits',
  },
  {
    id: 'custom_durations',
    title: 'Custom session durations',
    description: 'Set any focus session length you want',
  },
];

/**
 * Check whether the current user has Pro status.
 * Reads the `isPro` boolean from chrome.storage.local.
 *
 * @returns {Promise<boolean>}
 */
export async function isPro() {
  try {
    const result = await chrome.storage.local.get({ isPro: false });
    return result.isPro === true;
  } catch (e) {
    console.warn('[Pro] Failed to read Pro status:', e);
    return false;
  }
}

/**
 * Return feature limits based on the current Pro status.
 *
 * @param {boolean} proStatus — pass true for Pro, false for free tier
 * @returns {{ maxSites: number, maxPrebuiltLists: number, maxSchedules: number, nuclearMaxMinutes: number, historyDays: number }}
 */
export function getProLimits(proStatus) {
  return {
    maxSites:          proStatus ? Infinity : 10,
    maxPrebuiltLists:  proStatus ? Infinity : 2,
    maxSchedules:      proStatus ? Infinity : 1,
    nuclearMaxMinutes: proStatus ? 1440 : 60,
    historyDays:       proStatus ? 90 : 7,
  };
}
