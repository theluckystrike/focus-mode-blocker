# Privacy Policy - Focus Mode - Blocker

*Last updated: February 2026*

## Overview

Focus Mode - Blocker is a Chrome extension developed by **Zovo** that blocks distracting websites and helps users build focused work habits through Pomodoro timers, Focus Score tracking, streaks, and gamification. We are committed to protecting your privacy.

**TL;DR: We don't collect any of your data. Everything stays on your device.**

---

## Data Collection

Focus Mode - Blocker does **not** collect any personal data. Specifically, we do **not** collect:

- Your name, email address, or any account information
- Your browsing history or browsing activity
- The content of any web pages you visit
- Analytics or usage telemetry
- Device identifiers or fingerprints
- IP addresses or location data
- Cookies or tracking pixels
- Any information that could identify you personally

We have no servers that receive your data. There is no analytics SDK, no tracking code, and no telemetry of any kind embedded in this extension.

---

## Local Storage

All data used by Focus Mode - Blocker is stored locally on your device using `chrome.storage.local`. Here is a complete list of what is stored:

| Data | Purpose | Location |
|------|---------|----------|
| Blocklist (sites) | Websites you choose to block during focus sessions | `chrome.storage.local` |
| Settings | Your preferences (timer duration, sounds, theme, notifications) | `chrome.storage.local` |
| Focus Score | Productivity score (0-100) calculated entirely on your device | `chrome.storage.local` |
| Streak Data | Daily focus streak count and history | `chrome.storage.local` |
| Session History | Focus session timestamps and durations for your review | `chrome.storage.local` |
| Timer State | Current Pomodoro timer status and remaining time | `chrome.storage.local` |
| Sound Preferences | Your selected ambient sound settings | `chrome.storage.local` |
| Schedules | Automatic blocking schedules you configure | `chrome.storage.local` |
| Pro License | License key validation status (if applicable) | `chrome.storage.local` |

### Important facts about your local data:

- **It never leaves your device.** No data is transmitted to any server, ever.
- **It is not synced** to any cloud service or across devices.
- **You can clear it at any time** through the extension settings or by clearing browser data.
- **It is automatically deleted** when you uninstall the extension.
- **You own it completely.** We never have access to it.

---

## Data Transmission

Focus Mode - Blocker does **not** transmit any data to external servers. All processing — including Focus Score calculation, streak tracking, timer management, and schedule evaluation — happens entirely on your device within the browser.

No network requests are made by the extension for data collection purposes. The only network activity the extension performs is blocking requests to websites on your blocklist, which is the core functionality you configure.

---

## Third-Party Services

### Free Tier

The free version of Focus Mode - Blocker uses **zero** third-party services. No SDKs, no APIs, no external calls.

### Pro Tier

The Pro tier uses **Stripe** for payment processing. When you purchase a Pro license:

- Stripe receives your **payment information only** (card number, billing address, email for receipt).
- Stripe does **not** receive any focus data, browsing data, blocklist data, or any information about how you use the extension.
- Stripe's handling of your payment data is governed by [Stripe's Privacy Policy](https://stripe.com/privacy).
- We do not store your payment details. Only a license validation status is stored locally.

No other third-party services are used.

---

## Permissions

Focus Mode - Blocker requests the following Chrome permissions, each for a specific and necessary purpose:

| Permission | Why It's Needed |
|------------|-----------------|
| `storage` | Store your blocklist, settings, Focus Score, streak data, session history, and preferences locally on your device using `chrome.storage.local`. |
| `alarms` | Schedule Pomodoro timer intervals, automatic blocking schedules, and streak reset checks. Runs in the background reliably even when the popup is closed. |
| `declarativeNetRequest` | Block network requests to websites on your blocklist. This is Chrome's modern, privacy-preserving API for request blocking — it uses predefined rules rather than reading page content. |
| `declarativeNetRequestWithHostAccess` | Apply blocking rules dynamically to user-specified domains. Required because your blocklist is custom and changes at runtime. |
| `host_permissions` (`<all_urls>`) | Needed for `declarativeNetRequest` to apply blocking rules to any website the user adds to their blocklist. Without this, the extension could only block a hardcoded list of sites. |
| `activeTab` | Access the currently active tab to display the blocked page overlay when a user navigates to a blocked site during a focus session. Only activates on user interaction. |
| `scripting` | Inject the blocked-page content script that shows the "This site is blocked" overlay on pages in your blocklist. Does not read or collect page content. |
| `notifications` | Send local desktop notifications for timer completion, streak milestones, and focus session reminders. All notifications are generated locally — no push notification server is involved. |
| `offscreen` | Play ambient focus sounds and timer audio in the background using an offscreen document. Required because Manifest V3 service workers cannot play audio directly. |

**No permission is used to collect, read, or transmit your personal data.**

---

## Children's Privacy

Because Focus Mode - Blocker does not collect any data from any user, it does not collect data from children under 13 (or any other age group). The extension is safe for users of all ages.

---

## Changes to This Policy

If we change our privacy practices in the future, we will update this policy and change the "Last updated" date at the top. Since Focus Mode - Blocker currently collects no data, any change would only occur if new features required it — and we would communicate those changes clearly before they take effect.

---

## Open Source

Focus Mode - Blocker is open source. You can inspect the complete source code to verify our privacy claims:

**GitHub:** [https://github.com/theluckystrike/focus-mode-blocker](https://github.com/theluckystrike/focus-mode-blocker)

We believe transparency is the strongest privacy guarantee. Every line of code is available for review.

---

## Contact

If you have questions about this privacy policy or Focus Mode - Blocker:

- **Email:** [support@zovo.one](mailto:support@zovo.one)
- **Website:** [https://zovo.one](https://zovo.one)
- **GitHub Issues:** [https://github.com/theluckystrike/focus-mode-blocker/issues](https://github.com/theluckystrike/focus-mode-blocker/issues)

---

*Focus Mode - Blocker is part of the [Zovo](https://zovo.one) extension family.*
