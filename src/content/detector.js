// Focus Mode - Blocker | Detector Content Script
// Budget: <2KB, <100ms init, zero dependencies
// Runs at: document_start on all URLs
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

  // Ask service worker if this domain is blocked
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
})();
