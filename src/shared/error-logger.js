/**
 * Lightweight error logger for Focus Mode - Blocker.
 * Stores the last 50 errors in chrome.storage.local under 'errorLog'.
 * Auto-prunes entries older than 7 days.
 */

const MAX_ENTRIES = 50;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Log an error with context to chrome.storage.local.
 * @param {string} source - Where the error originated (e.g. 'service-worker', 'popup')
 * @param {Error|string} error - The error object or message
 * @param {object} [context] - Optional additional context
 */
export async function logError(source, error, context) {
  try {
    const entry = {
      ts: Date.now(),
      src: source,
      msg: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? (error.stack || '').slice(0, 500) : '',
    };
    if (context) entry.ctx = context;

    const { errorLog = [] } = await chrome.storage.local.get('errorLog');
    const now = Date.now();
    const pruned = errorLog.filter(e => (now - e.ts) < MAX_AGE_MS);
    pruned.push(entry);

    // Keep only the last MAX_ENTRIES
    const trimmed = pruned.length > MAX_ENTRIES
      ? pruned.slice(pruned.length - MAX_ENTRIES)
      : pruned;

    await chrome.storage.local.set({ errorLog: trimmed });
  } catch (_) {
    // Silently fail - don't let the logger itself cause issues
  }
}

/**
 * Retrieve the stored error log.
 * @returns {Promise<Array>} Array of error entries
 */
export async function getErrorLog() {
  try {
    const { errorLog = [] } = await chrome.storage.local.get('errorLog');
    const now = Date.now();
    return errorLog.filter(e => (now - e.ts) < MAX_AGE_MS);
  } catch (_) {
    return [];
  }
}
