// Focus Mode - Blocker | Detector Content Script
// Budget: <2KB, <100ms init, zero dependencies
// Runs at: document_start on all URLs
//
// NOTE ON BLOCKING ARCHITECTURE:
// Primary blocking is handled by declarativeNetRequest (DNR) rules that the
// service worker installs/removes when sessions start/stop. DNR operates at
// the network level and redirects blocked URLs to blocked.html before the
// page even loads.
//
// This content script serves as a secondary backup for edge cases where DNR
// rules may not have been applied yet (e.g., race condition during session
// start, or if dynamic rules failed to update). It sends a CHECK_BLOCKED
// message to the service worker and redirects if needed.
//
// OPTIMIZATION: To avoid waking the service worker on every single page load
// (even when no focus session is running), we first check the focusActive
// flag in chrome.storage.session. This flag is set by the service worker
// when a focus session, nuclear mode, or scheduled blocking is active.
// chrome.storage.session is fast, synchronous-like, and does not wake the
// service worker.
(() => {
  // Skip non-blockable pages
  const p = location.protocol;
  if (p === 'chrome:' || p === 'chrome-extension:' || p === 'about:' ||
      p === 'edge:' || p === 'brave:' || p === 'devtools:' || p === 'moz-extension:') {
    return;
  }

  // Skip if already on block page
  if (location.pathname.includes('blocked.html')) {
    return;
  }

  const hostname = location.hostname;
  if (!hostname) return;

  // Normalize: strip www.
  const domain = hostname.startsWith('www.') ? hostname.slice(4) : hostname;

  // Check session flag before messaging the service worker.
  // If no focus session is active, skip the CHECK_BLOCKED message entirely
  // to avoid unnecessary service worker wake-ups on every page load.
  try {
    chrome.storage.session.get('focusActive', (result) => {
      if (chrome.runtime.lastError) {
        // storage.session unavailable — fall through to CHECK_BLOCKED
        sendCheckBlocked(domain, hostname);
        return;
      }

      if (!result.focusActive) {
        // No active session — nothing to block, exit early
        return;
      }

      // Active session detected — ask service worker for authoritative check
      sendCheckBlocked(domain, hostname);
    });
  } catch (e) {
    // chrome.storage.session not available (Chrome < 102) — fall back to
    // always checking with the service worker
    sendCheckBlocked(domain, hostname);
  }

  function sendCheckBlocked(domain, hostname) {
    try {
      chrome.runtime.sendMessage(
        {
          type: 'CHECK_BLOCKED',
          payload: { domain, hostname, url: location.href }
        },
        (response) => {
          if (chrome.runtime.lastError) return;
          if (!response || !response.blocked) return;

          // Domain is blocked — redirect to block page
          const blockPageUrl = chrome.runtime.getURL(
            'src/blocked/blocked.html?domain=' + encodeURIComponent(domain)
          );

          // Stop loading the current page
          window.stop();

          // Redirect to block page
          location.replace(blockPageUrl);
        }
      );
    } catch (e) {
      // Extension context invalidated — do nothing
    }
  }
})();
