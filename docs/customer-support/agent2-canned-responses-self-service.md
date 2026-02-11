# Agent 2 — Canned Response Library & Self-Service Resources
## Phase 19: Customer Support Automation — Focus Mode - Blocker

> **Date:** February 11, 2026 | **Agent:** 2 of 5
> **Scope:** Sections 3–4 — Canned Response Library, Self-Service Resources
> **Depends on:** Phase 02 (Monetization — Pro tier details), Phase 05 (Pomodoro), Phase 06 (Focus Score), Phase 08 (Nuclear Mode), Phase 10 (Block Page), Phase 15 (i18n), Phase 18 (Security — permissions)

---

## 3. Canned Response Library

### 3.1 Response Template System

```javascript
// server/support/response-templates.js
const FocusModeResponseTemplates = {

  // ═══════════════════════════════════════════
  // INSTALLATION ISSUES (1-10)
  // ═══════════════════════════════════════════
  installation: {
    'install-basic': {
      subject: 'How to Install Focus Mode - Blocker',
      body: `Hi {customer_name},

Thank you for your interest in Focus Mode - Blocker!

Here's how to install it:

1. Visit our Chrome Web Store page: https://chrome.google.com/webstore/detail/focus-mode-blocker/{extension_id}
2. Click "Add to Chrome"
3. Click "Add extension" in the popup
4. You'll see the Focus Mode icon appear in your toolbar

If you don't see the icon, click the puzzle piece icon in Chrome's toolbar and pin Focus Mode - Blocker.

**Quick Start:**
- Click the icon to open the popup
- Add your first distracting site to your blocklist
- Start a focus session with the Pomodoro timer
- Watch your Focus Score grow!

Need more help? Reply to this email or check our quick start guide: https://zovo.one/docs/getting-started

Best regards,
{agent_name}
Zovo Support Team`
    },

    'install-permissions': {
      subject: 'Re: Permission Questions',
      body: `Hi {customer_name},

Great question about our permissions! We take privacy seriously and only request what's essential:

**"Storage"**: Saves your blocklist, Focus Score, streaks, and settings locally on your device. Nothing leaves your browser.

**"Alarms"**: Powers the Pomodoro timer countdown and session notifications.

**"Active Tab"**: Checks the current tab's URL to determine if it should be blocked. We never read page content.

**"Notifications"**: Sends Pomodoro break/work reminders and streak notifications.

**"Declarative Net Request"**: The core blocking engine — redirects blocked sites to your Focus Mode block page. This is a privacy-preserving API that doesn't read your browsing history.

**Optional permissions** (only requested when needed):
- **"Tabs"**: Enables blocking across all tabs (Pro feature)
- **"Context Menus"**: Right-click "Block this site" (Pro feature)

We NEVER collect browsing history, personal data, or sell any information. Our full privacy policy: https://zovo.one/privacy

Let me know if you have other questions!

{agent_name}
Zovo Support Team`
    },

    'install-not-appearing': {
      subject: 'Re: Focus Mode Icon Not Showing',
      body: `Hi {customer_name},

Let's get Focus Mode visible! Try these steps:

1. **Check if it's hidden**: Click the puzzle piece icon (Extensions) in Chrome's toolbar. Look for "Focus Mode - Blocker" and click the pin icon.

2. **Verify installation**: Go to chrome://extensions and ensure Focus Mode - Blocker is listed and enabled (toggle should be blue).

3. **Restart Chrome**: Close all Chrome windows completely and reopen.

4. **Clear and reinstall**: If still not working, remove the extension and reinstall from the Chrome Web Store.

**Important**: After reinstalling, your Focus Score and streaks will reset unless you're a Pro user with cloud sync enabled.

Still having trouble? Let me know what you see at each step.

{agent_name}
Zovo Support Team`
    },

    'install-conflict': {
      subject: 'Re: Extension Conflict',
      body: `Hi {customer_name},

It sounds like there might be a conflict with another extension. Let's identify it:

1. Go to chrome://extensions
2. Disable all other extensions except Focus Mode - Blocker
3. Test if blocking works correctly
4. Re-enable other extensions one by one, testing after each

**Common conflicts with Focus Mode:**
- **Other site blockers** (StayFocusd, LeechBlock, etc.) — they compete for the same blocking rules. We recommend using only one blocker.
- **Ad blockers** (uBlock Origin, AdBlock) — usually fine, but may interfere with our block page. Try adding our extension pages to their whitelist.
- **VPN extensions** — can interfere with declarativeNetRequest blocking rules.

Once you identify the conflicting extension, let me know and I'll help you configure both to work together.

{agent_name}
Zovo Support Team`
    },

    'install-enterprise': {
      subject: 'Re: Enterprise/Team Installation',
      body: `Hi {customer_name},

For team or enterprise deployment of Focus Mode - Blocker:

**Option 1: Chrome Enterprise Policy**
Add to your group policy:
\`\`\`
ExtensionInstallForcelist: {extension_id};https://clients2.google.com/service/update2/crx
\`\`\`

**Option 2: Google Admin Console**
1. Go to admin.google.com
2. Devices > Chrome > Apps & extensions
3. Add Focus Mode - Blocker extension ID: {extension_id}

**Option 3: Team Pro Plan**
We offer volume licensing with centralized blocklist management. Contact us at enterprise@zovo.one.

**Team features** (Pro):
- Shared team blocklists
- Admin dashboard for team Focus Score
- Centralized settings management
- Usage analytics (privacy-respecting)

Would you like to schedule a call to discuss your team's needs?

{agent_name}
Zovo Support Team`
    }
  },

  // ═══════════════════════════════════════════
  // BUG REPORTS (11-25)
  // ═══════════════════════════════════════════
  bugs: {
    'bug-acknowledged': {
      subject: 'Re: Bug Report Received',
      body: `Hi {customer_name},

Thank you for reporting this bug! We've logged it as #{ticket_id}.

**What you reported**: {issue_summary}
**Status**: Under investigation
**Priority**: {priority}

We'll update you as soon as we have more information. In the meantime, you might try this workaround: {workaround}

**Quick debug info** (if you haven't already):
- Go to Focus Mode popup > Settings > About > "Copy Debug Info"
- Paste it in your reply — this helps us investigate faster

Your reports help us improve Focus Mode for everyone — thank you!

{agent_name}
Zovo Support Team`
    },

    'bug-need-info': {
      subject: 'Re: Need More Information About Your Bug',
      body: `Hi {customer_name},

Thanks for the bug report! To help us investigate, could you provide:

1. **Steps to reproduce**: What exactly were you doing when this happened?
2. **Expected behavior**: What should have happened?
3. **Actual behavior**: What happened instead?
4. **Frequency**: Does this happen every time or occasionally?
5. **Browser version**: (Go to chrome://version)
6. **Extension version**: (Check in Focus Mode popup footer or chrome://extensions)
7. **Screenshots/recordings**: If possible

**Fastest way to get debug info:**
Focus Mode popup > Settings > About > "Copy Debug Info" — paste it here!

Thanks for helping us squash this bug!

{agent_name}
Zovo Support Team`
    },

    'bug-known-issue': {
      subject: 'Re: Known Issue — Fix Coming',
      body: `Hi {customer_name},

Thanks for reaching out! This is a known issue that we're actively working on.

**Issue**: {issue_description}
**Cause**: {cause}
**Status**: Fix in progress
**ETA**: {eta}

**Workaround for now**:
{workaround_steps}

We'll notify you when the fix is released. Sorry for the inconvenience — we know how important your focus sessions are!

{agent_name}
Zovo Support Team`
    },

    'bug-fixed': {
      subject: 'Bug Fixed in Focus Mode v{version}!',
      body: `Hi {customer_name},

Great news! The bug you reported has been fixed in version {version}.

**What was fixed**: {fix_description}

To get the update:
1. Go to chrome://extensions
2. Enable "Developer mode" (top right)
3. Click "Update"

Or wait for Chrome's automatic update (usually within 24-48 hours).

Your Focus Score and streaks are unaffected by this update.

Thank you for helping us improve Focus Mode - Blocker!

{agent_name}
Zovo Support Team`
    },

    'bug-cannot-reproduce': {
      subject: 'Re: Unable to Reproduce Your Issue',
      body: `Hi {customer_name},

We've been trying to reproduce the issue you reported, but haven't been able to see it on our end yet.

Could you help us with a few more details?

1. Does this happen on all websites or specific ones? Which ones?
2. Are you using any other extensions that might interact with site blocking?
3. Is your Chrome fully updated? (chrome://settings/help)
4. Have you tried in an Incognito window with only Focus Mode enabled?
5. Is this during a Pomodoro session, Nuclear Mode, or regular blocking?

If you can capture a screen recording of the issue, that would be incredibly helpful! You can use Chrome's built-in screen recorder (Ctrl+Shift+I > More tools > Recorder) or tools like Loom.

{agent_name}
Zovo Support Team`
    },

    'bug-sites-not-blocked': {
      subject: 'Re: Sites Not Being Blocked',
      body: `Hi {customer_name},

Let's troubleshoot why sites aren't being blocked:

1. **Check your blocklist**: Open Focus Mode popup > Blocklist. Is the site listed?
2. **Check the URL format**: Ensure you added the domain (e.g., "youtube.com") not a full URL.
3. **Are you in a focus session?** Some blocking modes only activate during Pomodoro sessions.
4. **Check blocking mode**: Settings > Blocking > "Always block" vs "Block during sessions only".
5. **Try refreshing**: After adding a site, refresh any open tabs of that site.
6. **Check for subdomains**: "youtube.com" blocks "www.youtube.com" but not "m.youtube.com" — add both if needed.

**If using Nuclear Mode**: Sites should be blocked without exception. If Nuclear Mode shows as active but sites aren't blocked, this is a critical bug — please reply with your debug info.

{agent_name}
Zovo Support Team`
    },

    'bug-timer-issue': {
      subject: 'Re: Pomodoro Timer Issue',
      body: `Hi {customer_name},

Sorry about the timer trouble! Here's what to check:

1. **Timer stops in background**: Chrome may suspend background tabs. Focus Mode's service worker handles this, but try keeping the popup open during sessions.
2. **Timer shows wrong time**: Try Settings > Pomodoro > Reset Timer.
3. **Notifications not appearing**: Check Chrome's notification settings (chrome://settings/content/notifications) and ensure Focus Mode is allowed.
4. **Break timer skipping**: This can happen if your system clock changes. Restart Chrome.
5. **Custom intervals not saving**: Ensure you click "Save" after changing Pomodoro settings. Custom intervals are a Pro feature.

Current Pomodoro defaults:
- Work: 25 minutes
- Short break: 5 minutes
- Long break: 15 minutes (after 4 work sessions)

If none of these help, please share your debug info (popup > Settings > About > Copy Debug Info).

{agent_name}
Zovo Support Team`
    }
  },

  // ═══════════════════════════════════════════
  // BILLING & LICENSE (26-40)
  // ═══════════════════════════════════════════
  billing: {
    'refund-approved': {
      subject: 'Refund Processed — Focus Mode Pro',
      body: `Hi {customer_name},

Your refund has been processed.

**Amount**: {amount}
**Transaction ID**: {transaction_id}
**Expected arrival**: 5-10 business days (depending on your bank)

Your Pro features will remain active until {end_date}. After that, you'll still have access to all Free features including:
- Up to 5 blocked sites
- Basic Pomodoro timer
- Focus Score tracking
- Daily streaks

We're sorry Focus Mode Pro didn't meet your needs. If you'd like to share what we could improve, we'd genuinely appreciate it.

You're always welcome back — your Focus Score and settings will be preserved!

{agent_name}
Zovo Support Team`
    },

    'refund-denied': {
      subject: 'Re: Refund Request — Focus Mode Pro',
      body: `Hi {customer_name},

Thank you for reaching out about a refund.

After reviewing your account:
- Purchase date: {purchase_date}
- Our refund window: 14 days (no questions asked)
- Days since purchase: {days_since}

This falls outside our standard refund window. However, I'd love to help resolve whatever issue you're experiencing.

**What I can offer**:
- Extended support to fix any problems you're having
- 1 month extension on your subscription for free
- Downgrade to monthly billing if you're on annual

Could you tell me more about what's not working for you? Often we can resolve the underlying issue.

{agent_name}
Zovo Support Team`
    },

    'license-activation': {
      subject: 'Re: Pro License Activation',
      body: `Hi {customer_name},

Let's get your Focus Mode Pro license activated!

1. Click the Focus Mode icon in your toolbar
2. Go to Settings > Pro
3. Enter your license key: (check your email from Stripe/Zovo)
4. Click "Activate"

**License format**: FOCUS-XXXX-XXXX-XXXX

**Troubleshooting**:
- Make sure there are no extra spaces when copying the key
- Check you're signed into Chrome (Pro syncs via Chrome identity)
- Try disabling VPN if you have one (it can affect license validation)

Your license allows activation on up to {device_count} devices. Currently active on {active_count}.

Need to deactivate a device? Go to Settings > Pro > Manage Devices.

{agent_name}
Zovo Support Team`
    },

    'payment-failed': {
      subject: 'Payment Issue — Focus Mode Pro',
      body: `Hi {customer_name},

We had trouble processing your Focus Mode Pro payment.

**Amount**: {amount}
**Card ending**: {card_last4}
**Error**: {error_message}

**To fix this**:
1. Visit your Stripe customer portal: {portal_link}
2. Update your payment method
3. Or retry the charge

Your Pro features will remain active for 7 days while you update your payment (grace period). After that, you'll revert to the Free tier but your settings and Focus Score will be preserved.

Need help? Just reply to this email.

{agent_name}
Zovo Support Team`
    },

    'subscription-cancel': {
      subject: 'Subscription Cancelled — We\'re Sorry to See You Go',
      body: `Hi {customer_name},

Your Focus Mode Pro subscription has been cancelled as requested.

**What happens now**:
- Pro features active until: {end_date}
- After that, Free tier access (5 blocked sites, basic Pomodoro)
- Your Focus Score, streaks, and settings are preserved
- Your blocklist will be trimmed to 5 sites (you choose which to keep)

**Changed your mind?** Resubscribe anytime at: Settings > Pro > Resubscribe
(Your Focus Score history and streaks will be fully restored)

If you have a moment, we'd love to know why: {survey_link}

Thank you for supporting Focus Mode! You're always welcome back.

{agent_name}
Zovo Support Team`
    },

    'upgrade-benefits': {
      subject: 'Re: Focus Mode Pro Features',
      body: `Hi {customer_name},

Great question about Focus Mode Pro! Here's what you get:

**Pro Features**:
- Unlimited blocked sites (Free: 5 max)
- Custom Pomodoro intervals (Free: fixed 25/5/15)
- Nuclear Mode — unbypassable blocking for deep focus
- Advanced Focus Score analytics & history
- Custom block page themes & motivational quotes
- Schedule-based blocking (block sites during work hours only)
- Site categories (block "social media" with one click)
- Priority support
- Cloud sync across devices

**Pricing**:
- Monthly: $4.99/month
- Lifetime: $49.99 (one-time, best value!)

Try it risk-free with our 14-day money-back guarantee.

Ready to upgrade? Click the ⭐ icon in the Focus Mode popup or visit Settings > Pro.

{agent_name}
Zovo Support Team`
    },

    'lifetime-vs-monthly': {
      subject: 'Re: Lifetime vs Monthly Plan',
      body: `Hi {customer_name},

Great question! Here's the comparison:

**Monthly Plan ($4.99/mo)**:
- All Pro features
- Cancel anytime
- Best for: trying Pro, short-term needs

**Lifetime Plan ($49.99 one-time)**:
- All Pro features forever
- All future updates included
- Pays for itself in ~10 months
- Best for: committed focusers, best long-term value

Both plans include the same features. The lifetime plan is our most popular choice — it's like paying for 10 months and getting Pro forever!

{agent_name}
Zovo Support Team`
    }
  },

  // ═══════════════════════════════════════════
  // NUCLEAR MODE (41-48)
  // ═══════════════════════════════════════════
  nuclearMode: {
    'nuclear-explanation': {
      subject: 'Re: What is Nuclear Mode?',
      body: `Hi {customer_name},

Nuclear Mode is Focus Mode's most powerful feature — it makes blocking completely unbypassable for a set duration.

**How it works**:
1. You choose which sites to block and set a timer (15 min to 24 hours)
2. Once activated, those sites CANNOT be unblocked until the timer expires
3. You can't disable it, uninstall the extension, or use workarounds
4. It's designed for deep focus sessions when you need zero distractions

**Important**: Nuclear Mode is intentionally impossible to bypass. Please set realistic durations!

**Tips**:
- Start with 30-60 minute sessions
- Don't block sites you might urgently need (email, work tools)
- Use "Panic Pause" (Pro) for a 5-minute emergency override (limited to 1 per session)

This is a Pro feature. Upgrade at Settings > Pro.

{agent_name}
Zovo Support Team`
    },

    'nuclear-locked-out': {
      subject: 'Re: Locked Out by Nuclear Mode',
      body: `Hi {customer_name},

I understand the frustration of being locked out — but this is actually Nuclear Mode working as designed!

**Nuclear Mode is intentionally unbypassable.** This is its core purpose: to remove the temptation to "just check" blocked sites.

**Your options right now**:
1. **Wait it out**: Your timer expires at {expiry_time}. Use this time productively!
2. **Use a different browser**: Nuclear Mode only affects Chrome. Try Firefox/Safari temporarily for urgent needs.
3. **Use your phone**: If you need to access a blocked site urgently.

**For next time**:
- Set shorter durations to start (30-60 minutes)
- Don't block sites you might need urgently
- Pro users: enable "Panic Pause" for a limited 5-minute emergency override

Nuclear Mode can't be turned off early — even by us. This is a deliberate safety feature that makes Focus Mode the strongest blocker available.

Hang in there! Your Focus Score will thank you. 💪

{agent_name}
Zovo Support Team`
    },

    'nuclear-not-activating': {
      subject: 'Re: Nuclear Mode Not Working',
      body: `Hi {customer_name},

Let's troubleshoot Nuclear Mode:

1. **Minimum duration**: Nuclear Mode requires at least 15 minutes.
2. **Pro required**: Nuclear Mode is a Pro feature. Check Settings > Pro.
3. **Already active**: You can't start a new Nuclear session while one is running.
4. **Sites required**: You must select at least 1 site to block.
5. **Chrome restart**: After activating, make sure you haven't restarted Chrome. The service worker needs to be running.

**To verify Nuclear Mode is active**:
- The Focus Mode icon should show a red lock overlay
- The popup should display the remaining time
- Blocked sites should redirect to the Nuclear Mode block page (distinct from normal block page)

If Nuclear Mode appears active but sites aren't blocked, please share your debug info — this is a critical bug.

{agent_name}
Zovo Support Team`
    }
  },

  // ═══════════════════════════════════════════
  // FOCUS SCORE & STREAKS (49-55)
  // ═══════════════════════════════════════════
  focusScore: {
    'score-explanation': {
      subject: 'Re: How Focus Score Works',
      body: `Hi {customer_name},

Focus Score (0-100) measures your focus consistency. Here's how it works:

**Score increases when you**:
- Complete Pomodoro sessions without visiting blocked sites (+5-10)
- Maintain daily streaks (+2 per consecutive day)
- Use Nuclear Mode for deep focus sessions (+10-15)
- Avoid overriding blocks (+3 per resisted temptation)

**Score decreases when you**:
- Visit blocked sites during focus sessions (-5 per visit)
- Skip scheduled focus sessions (-3)
- Override blocks frequently (-5 per override)
- Break your daily streak (-10 on streak break)

**Score is calculated daily** and shown as a rolling 7-day average.

**Levels**:
- 0-20: Getting Started
- 21-40: Building Habits
- 41-60: Focused
- 61-80: Highly Focused
- 81-100: Focus Master

Your current Focus Score: visible in the popup and dashboard.

{agent_name}
Zovo Support Team`
    },

    'score-wrong': {
      subject: 'Re: Focus Score Seems Wrong',
      body: `Hi {customer_name},

Let me help investigate your Focus Score. A few things to check:

1. **7-day rolling average**: Your score reflects the last 7 days, not just today. A single great day won't immediately jump your score.
2. **Blocked site visits count**: Even brief visits to blocked sites (before the block page loads) count against your score.
3. **Streak breaks are costly**: Breaking a streak has a -10 penalty. Did your streak recently break?
4. **Timezone**: Focus Score resets at midnight in your local timezone. Check Settings > General > Timezone.
5. **Multiple devices**: If using Focus Mode on multiple devices, scores may differ if not synced (Pro feature).

**To see your score breakdown**: Popup > Focus Score > "View Details" (Pro feature shows full history).

If you believe there's a calculation error, please share:
- Your current score
- What you expected
- Your recent session history (popup > History)

{agent_name}
Zovo Support Team`
    },

    'streak-lost': {
      subject: 'Re: Lost My Streak',
      body: `Hi {customer_name},

I understand losing a streak is frustrating — especially a long one!

**How streaks work**:
- You need at least 1 completed focus session (any duration) per calendar day
- The day resets at midnight in your timezone (Settings > General > Timezone)
- If you miss a day, your streak resets to 0

**Common reasons for streak loss**:
- Forgot to start a session on a busy day
- Timezone setting was wrong (e.g., traveling)
- Chrome wasn't open that day
- Extension was temporarily disabled

**Unfortunately, we can't restore streaks manually** — this would undermine the integrity of the system for all users.

**But here's the good news**: Your Focus Score remembers your history, and your longest streak is always recorded in your stats. Start building again — many users find their second streak is even longer!

**Pro tip**: Enable "Streak Reminder" notifications (Settings > Notifications) to get a reminder at 8 PM if you haven't had a session that day.

{agent_name}
Zovo Support Team`
    }
  },

  // ═══════════════════════════════════════════
  // FEATURE REQUESTS (56-62)
  // ═══════════════════════════════════════════
  features: {
    'feature-logged': {
      subject: 'Feature Request Received — Focus Mode',
      body: `Hi {customer_name},

Thank you for the feature suggestion!

**Your request**: {feature_summary}

I've added this to our feature tracking system. Here's what happens next:

1. Our product team reviews all requests weekly
2. Popular requests get prioritized (you can vote at zovo.one/roadmap)
3. We'll notify you if/when we implement this

Your feedback directly shapes Focus Mode's roadmap — thank you!

{agent_name}
Zovo Support Team`
    },

    'feature-planned': {
      subject: 'Great News — Your Feature Request is Planned!',
      body: `Hi {customer_name},

You'll be happy to hear that the feature you requested is on our roadmap!

**Feature**: {feature_name}
**Status**: Planned
**Estimated release**: {eta}

Want to be a beta tester? Reply "Yes" and we'll add you to our early access list.

Thank you for helping shape Focus Mode - Blocker!

{agent_name}
Zovo Support Team`
    },

    'feature-exists-pro': {
      subject: 'Re: Feature Request — Already Available in Pro!',
      body: `Hi {customer_name},

Great news — the feature you're asking about is already available in Focus Mode Pro!

**Feature**: {feature_name}
**How to access**: {access_instructions}

Focus Mode Pro ($4.99/mo or $49.99 lifetime) includes this and many more features:
- Unlimited blocked sites
- Nuclear Mode
- Custom Pomodoro intervals
- Advanced Focus Score analytics
- Schedule-based blocking
- And more

Upgrade at Settings > Pro. 14-day money-back guarantee!

{agent_name}
Zovo Support Team`
    },

    'feature-declined': {
      subject: 'Re: Feature Request Update',
      body: `Hi {customer_name},

Thank you for your feature suggestion. After careful consideration, we've decided not to implement this at this time.

**Reason**: {reason}

However, you might achieve something similar by:
{alternative_solution}

We genuinely appreciate you taking the time to share your ideas. Please keep the suggestions coming — they really do influence our direction!

{agent_name}
Zovo Support Team`
    }
  },

  // ═══════════════════════════════════════════
  // HOW-TO & QUESTIONS (63-72)
  // ═══════════════════════════════════════════
  howto: {
    'howto-add-site': {
      subject: 'Re: How to Block a Website',
      body: `Hi {customer_name},

Here's how to add a site to your blocklist:

**Method 1 — Popup**:
1. Click the Focus Mode icon in your toolbar
2. Click "+ Add Site" in the Blocklist section
3. Type the domain (e.g., "youtube.com")
4. Press Enter or click Add

**Method 2 — While browsing** (Pro):
1. Visit the site you want to block
2. Right-click anywhere on the page
3. Select "Focus Mode > Block this site"

**Method 3 — Settings**:
1. Focus Mode popup > Settings > Blocklist
2. Add sites manually, import a list, or use preset categories

**Tips**:
- Use domains, not full URLs: "youtube.com" not "https://www.youtube.com/watch?v=..."
- Block subdomains too: add both "youtube.com" and "m.youtube.com"
- Pro users: use categories like "Social Media" to block entire groups

{agent_name}
Zovo Support Team`
    },

    'howto-pomodoro': {
      subject: 'Re: How to Use the Pomodoro Timer',
      body: `Hi {customer_name},

The Pomodoro timer helps you work in focused intervals:

**Getting started**:
1. Click the Focus Mode icon
2. Click "Start Focus Session" (or the play button)
3. Work for 25 minutes (default)
4. Take a 5-minute break when the timer rings
5. After 4 sessions, take a 15-minute long break

**Customizing** (Pro):
- Settings > Pomodoro > Work Duration (10-90 minutes)
- Settings > Pomodoro > Short Break (1-30 minutes)
- Settings > Pomodoro > Long Break (5-60 minutes)
- Settings > Pomodoro > Sessions Before Long Break (2-8)

**Pro tip**: Enable "Auto-start breaks" in settings so the timer continues automatically.

Your Focus Score increases with every completed Pomodoro session!

{agent_name}
Zovo Support Team`
    },

    'howto-settings': {
      subject: 'Re: Focus Mode Settings',
      body: `Hi {customer_name},

Here's how to access and customize your settings:

1. Click the Focus Mode icon in your toolbar
2. Click the gear icon (Settings)
3. You'll see these sections:
   - **General**: Timezone, language, theme
   - **Blocklist**: Manage blocked sites, import/export
   - **Pomodoro**: Timer intervals, auto-start, sound
   - **Blocking**: Block mode (always vs sessions only), schedule
   - **Focus Score**: Visibility, notifications, goals
   - **Notifications**: Streak reminders, session alerts
   - **Pro**: License, cloud sync, advanced features

**Reset to defaults**: Settings > Advanced > Reset All Settings

**Export/Import settings**: Settings > Advanced > Export Settings (good for backup or new device)

{agent_name}
Zovo Support Team`
    },

    'howto-keyboard': {
      subject: 'Re: Keyboard Shortcuts',
      body: `Hi {customer_name},

Here are the keyboard shortcuts for Focus Mode - Blocker:

**Default shortcuts**:
- Alt+Shift+F: Toggle Focus Mode popup
- Alt+Shift+S: Start/stop Pomodoro session
- Alt+Shift+B: Quick-block current site (Pro)

**Customize shortcuts**:
1. Go to chrome://extensions/shortcuts
2. Find "Focus Mode - Blocker"
3. Click the text box next to any command
4. Press your desired key combination

**Note**: Some shortcuts may conflict with website shortcuts. You can set them to work "In Chrome" or "Global" (works even when Chrome isn't focused).

{agent_name}
Zovo Support Team`
    }
  },

  // ═══════════════════════════════════════════
  // GENERAL SUPPORT (73-80)
  // ═══════════════════════════════════════════
  general: {
    'first-response': {
      subject: 'Re: {original_subject}',
      body: `Hi {customer_name},

Thank you for reaching out! I'm {agent_name}, and I'll be helping you today.

I've received your message about {issue_summary}. I'm looking into this now and will get back to you with a solution shortly.

**Ticket number**: #{ticket_id}
**Expected response**: Within {sla_hours} hours

In the meantime, you might find these resources helpful:
- FAQ: https://zovo.one/faq
- Knowledge Base: https://zovo.one/docs
- Status page: https://status.zovo.one

Talk soon!

{agent_name}
Zovo Support Team`
    },

    'follow-up': {
      subject: 'Re: Following Up — Focus Mode Support',
      body: `Hi {customer_name},

I wanted to follow up on our conversation about {issue_summary}.

Were you able to resolve the issue with the steps I provided? If you're still experiencing problems, please let me know and we'll dig deeper.

If everything is working, I'll close this ticket in 3 days. You can always reopen it by replying to this email.

Is there anything else I can help you with?

{agent_name}
Zovo Support Team`
    },

    'closing': {
      subject: 'Re: Issue Resolved — Focus Mode',
      body: `Hi {customer_name},

Great to hear your issue is resolved!

**Quick summary**:
- Issue: {issue_summary}
- Solution: {solution_summary}

If you have a moment, we'd really appreciate a review on the Chrome Web Store:
https://chrome.google.com/webstore/detail/focus-mode-blocker/{extension_id}/reviews

Your feedback helps other users discover Focus Mode and lets us know we're doing a good job.

Keep focusing! 🎯

{agent_name}
Zovo Support Team`
    },

    'survey-request': {
      subject: 'How Was Your Focus Mode Support Experience?',
      body: `Hi {customer_name},

We recently helped you with {issue_summary}.

**How was your support experience?**
- [Excellent]({survey_link}?rating=5) | [Good]({survey_link}?rating=4) | [Okay]({survey_link}?rating=3) | [Poor]({survey_link}?rating=2)

Your feedback helps us improve. It only takes 10 seconds!

Thank you for being a valued Focus Mode user.

{agent_name}
Zovo Support Team`
    }
  }
};

// Template Engine
class FocusTemplateEngine {
  static render(template, variables) {
    let result = typeof template === 'object' ? template.body : template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return result;
  }

  static getTemplate(category, name) {
    return FocusModeResponseTemplates[category]?.[name] || null;
  }

  static listTemplates() {
    const list = {};
    for (const [category, templates] of Object.entries(FocusModeResponseTemplates)) {
      list[category] = Object.keys(templates);
    }
    return list;
  }
}

module.exports = { FocusModeResponseTemplates, FocusTemplateEngine };
```

### 3.2 Template Count Summary

| Category | Count | Key Templates |
|----------|-------|---------------|
| Installation | 5 | Basic install, permissions, icon missing, conflicts, enterprise |
| Bugs | 7 | Acknowledged, need info, known issue, fixed, can't reproduce, sites not blocked, timer |
| Billing/License | 7 | Refund approved/denied, license activation, payment failed, cancel, upgrade, lifetime vs monthly |
| Nuclear Mode | 3 | Explanation, locked out, not activating |
| Focus Score/Streaks | 3 | Score explanation, score wrong, streak lost |
| Features | 4 | Logged, planned, exists in Pro, declined |
| How-to | 4 | Add site, Pomodoro, settings, keyboard shortcuts |
| General | 4 | First response, follow-up, closing, survey |
| **Total** | **37** | |

---

## 4. Self-Service Resources

### 4.1 FAQ Structure — Focus Mode - Blocker

```markdown
# Focus Mode - Blocker FAQ

## Installation & Setup

### How do I install Focus Mode - Blocker?
1. Visit our Chrome Web Store page
2. Click "Add to Chrome"
3. Click "Add extension" in the confirmation popup
4. You'll see the Focus Mode icon in your browser toolbar
5. Click it to set up your first blocklist!

### Why does Focus Mode need certain permissions?
We only request permissions that are essential:
- **"Storage"**: Saves your blocklist, Focus Score, and settings locally
- **"Alarms"**: Powers the Pomodoro timer and notifications
- **"Active Tab"**: Checks the current URL to determine if it should be blocked
- **"Notifications"**: Sends Pomodoro and streak reminders
- **"Declarative Net Request"**: The blocking engine itself (privacy-preserving)

### The Focus Mode icon isn't showing up
Click the puzzle piece icon in Chrome's toolbar, find "Focus Mode - Blocker", and click the pin icon.

### Does Focus Mode work in Incognito?
By default, no. To enable:
1. Go to chrome://extensions
2. Click "Details" on Focus Mode - Blocker
3. Toggle "Allow in Incognito"

Note: Focus Score and streak tracking don't work in Incognito.

## Blocking & Blocklist

### How do I block a website?
Click the Focus Mode icon > "+" button > Type the domain > Enter.
Example: Type "youtube.com" to block YouTube.

### How do I unblock a website?
Click the Focus Mode icon > Find the site in your list > Click the X button.
Note: You cannot unblock sites during Nuclear Mode.

### Can I block specific pages, not the whole site?
Free: Blocks entire domains only.
Pro: Supports URL path blocking (e.g., "reddit.com/r/funny" while allowing "reddit.com/r/programming").

### Why is a site still accessible after I blocked it?
1. Refresh the page after adding to blocklist
2. Check the exact domain (www.site.com vs site.com)
3. Check if blocking is set to "During sessions only" (Settings > Blocking)

### What's the block page?
When you visit a blocked site, you see a Focus Mode block page with your Focus Score, a motivational quote, and a timer showing how long until your session ends.

## Pomodoro Timer

### How does the Pomodoro timer work?
Work 25 minutes → Short break 5 minutes → Repeat. After 4 work sessions, take a 15-minute long break. The timer runs in the background — you'll get a notification when each interval ends.

### Can I customize the timer intervals?
Free: Fixed at 25/5/15 minutes.
Pro: Fully customizable from 10-90 minute work sessions.

### Does the timer keep running if I close Chrome?
The timer continues via the service worker. If Chrome is completely closed, the timer pauses and resumes when you reopen Chrome.

## Focus Score

### What is Focus Score?
A 0-100 score that measures your focus consistency. It increases when you complete sessions, maintain streaks, and resist distractions. It decreases when you visit blocked sites or break streaks.

### How is Focus Score calculated?
Focus Score is a rolling 7-day average based on:
- Completed Pomodoro sessions (+5-10 each)
- Streak maintenance (+2 per day)
- Nuclear Mode sessions (+10-15 each)
- Blocked site visit attempts (-5 each)

### Can I reset my Focus Score?
Settings > Advanced > Reset Focus Score. This cannot be undone.

## Nuclear Mode

### What is Nuclear Mode?
The ultimate focus tool. Nuclear Mode makes blocking completely unbypassable for a set duration. You literally cannot access blocked sites until the timer expires — not by disabling the extension, not by clearing data, not by any workaround.

### I'm locked out by Nuclear Mode — help!
Nuclear Mode is working as designed! Wait for the timer to expire, use a different browser, or use your phone for urgent needs. See our detailed guide at zovo.one/docs/nuclear-mode.

### Is Nuclear Mode available in the Free version?
No, Nuclear Mode is a Pro-exclusive feature.

## Streaks

### How do streaks work?
Complete at least one focus session per day to maintain your streak. The day resets at midnight in your timezone.

### I lost my streak! Can you restore it?
Unfortunately, streaks cannot be manually restored. Enable "Streak Reminder" notifications to avoid missing days.

## Billing & Pro

### How much does Pro cost?
Monthly: $4.99/month. Lifetime: $49.99 one-time payment.

### How do I upgrade to Pro?
Click the Focus Mode icon > Settings > Pro > Choose your plan.

### How do I cancel my subscription?
Settings > Pro > Manage Subscription > Cancel. Your Pro features remain active until the end of the billing period.

### What happens to my data when I cancel Pro?
Your Focus Score, streaks, and settings are preserved. Your blocklist is trimmed to 5 sites (you choose which to keep). Pro-only settings revert to defaults.

### How do I get a refund?
Email billing@zovo.one within 14 days of purchase for a no-questions-asked refund.

## Troubleshooting

### Focus Mode stopped working
1. Check it's enabled at chrome://extensions
2. Disable and re-enable the extension
3. Clear browser cache
4. Reinstall (your cloud-synced data is preserved for Pro users)

### Focus Mode is using too much memory
1. Update to the latest version
2. Reduce your blocklist size if it's very large (100+ sites)
3. Disable Focus Score animations in Settings > Appearance

### It conflicts with another extension
Disable other extensions one by one to identify the conflict. Common conflicts: other site blockers, some ad blockers, VPN extensions.
```

### 4.2 Knowledge Base Architecture

```
knowledge-base/
├── getting-started/
│   ├── installation.md
│   ├── first-focus-session.md
│   ├── interface-tour.md
│   └── quick-start-guide.md
├── features/
│   ├── blocklist/
│   │   ├── adding-sites.md
│   │   ├── removing-sites.md
│   │   ├── categories.md          (Pro)
│   │   ├── url-path-blocking.md   (Pro)
│   │   ├── import-export.md
│   │   └── wildcard-patterns.md   (Pro)
│   ├── pomodoro/
│   │   ├── how-it-works.md
│   │   ├── custom-intervals.md    (Pro)
│   │   ├── auto-start.md
│   │   └── notifications.md
│   ├── focus-score/
│   │   ├── how-its-calculated.md
│   │   ├── improving-score.md
│   │   ├── score-history.md       (Pro)
│   │   └── levels-milestones.md
│   ├── nuclear-mode/
│   │   ├── what-is-nuclear-mode.md  (Pro)
│   │   ├── how-to-activate.md      (Pro)
│   │   ├── locked-out-guide.md
│   │   └── best-practices.md
│   ├── streaks/
│   │   ├── how-streaks-work.md
│   │   ├── streak-reminders.md
│   │   └── longest-streak.md
│   └── block-page/
│       ├── default-block-page.md
│       ├── custom-themes.md       (Pro)
│       └── motivational-quotes.md
├── troubleshooting/
│   ├── common-issues.md
│   ├── sites-not-blocked.md
│   ├── timer-issues.md
│   ├── performance.md
│   ├── extension-conflicts.md
│   └── error-messages.md
├── billing/
│   ├── plans-pricing.md
│   ├── upgrade-to-pro.md
│   ├── manage-subscription.md
│   ├── refunds.md
│   └── license-activation.md
├── privacy-security/
│   ├── privacy-policy.md
│   ├── data-handling.md
│   ├── permissions-explained.md
│   └── security-practices.md
└── release-notes/
    ├── changelog.md
    └── whats-new.md
```

### 4.3 Video Tutorial Plan

```markdown
# Focus Mode - Blocker Video Tutorials

## Technical Specs
- Resolution: 1920x1080 (1080p)
- Frame rate: 30fps
- Format: MP4 (H.264)
- Audio: Clear voiceover, 44.1kHz
- Length: 2-5 minutes ideal
- Branding: Zovo logo intro (3 sec), consistent color scheme

## Recording Checklist
- [ ] Clean Chrome profile (no personal bookmarks)
- [ ] Close unnecessary tabs
- [ ] Disable system notifications
- [ ] Focus Mode in default state (fresh install look)
- [ ] Zoom browser to 110% for visibility
- [ ] Screen recording tool ready (OBS or Loom)

## Video Series

1. **Getting Started with Focus Mode** (3 min)
   - Install from Chrome Web Store
   - Pin the icon
   - Add your first blocked site
   - Start your first Pomodoro session

2. **Managing Your Blocklist** (3 min)
   - Adding and removing sites
   - Domain vs URL blocking
   - Import/export (Pro)
   - Category blocking (Pro)

3. **Mastering the Pomodoro Timer** (4 min)
   - Starting a session
   - Break management
   - Custom intervals (Pro)
   - Notifications setup

4. **Understanding Focus Score** (3 min)
   - What it measures
   - How to improve it
   - Score breakdown
   - Setting goals

5. **Nuclear Mode Deep Dive** (4 min) (Pro)
   - What it is and why it's different
   - Activating Nuclear Mode
   - What to do if locked out
   - Best practices

6. **Streaks and Milestones** (3 min)
   - How streaks work
   - Streak reminders
   - Milestone celebrations
   - Sharing achievements

7. **Pro Features Tour** (5 min)
   - All Pro features walkthrough
   - Upgrade process
   - License management

8. **Troubleshooting Common Issues** (4 min)
   - Sites not blocked
   - Timer problems
   - Extension conflicts
   - Getting help
```

### 4.4 Interactive Troubleshooter (Focus Mode-Specific)

```html
<!-- src/pages/troubleshooter.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Focus Mode Troubleshooter</title>
  <style>
    .troubleshooter { max-width: 600px; margin: 0 auto; font-family: system-ui, sans-serif; }
    .step { display: none; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; }
    .step.active { display: block; }
    .options { display: flex; flex-direction: column; gap: 10px; margin-top: 20px; }
    .option { padding: 15px; border: 2px solid #6C63FF; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
    .option:hover { background: #6C63FF; color: white; }
    .solution { background: #E8F5E9; padding: 20px; border-radius: 8px; }
    .back-btn { margin-top: 20px; padding: 10px 20px; cursor: pointer; border: 1px solid #ccc; border-radius: 6px; background: white; }
    h1 { color: #6C63FF; }
  </style>
</head>
<body>
  <div class="troubleshooter">
    <h1>Focus Mode Troubleshooter</h1>
    <div id="steps"></div>
  </div>

  <script>
    const troubleshooterData = {
      start: {
        question: "What issue are you experiencing?",
        options: [
          { text: "Sites aren't being blocked", next: "not-blocking" },
          { text: "Pomodoro timer issues", next: "timer-issues" },
          { text: "Focus Score seems wrong", next: "score-issue" },
          { text: "Nuclear Mode problem", next: "nuclear-issue" },
          { text: "Lost my streak", next: "streak-lost" },
          { text: "Pro/billing issue", next: "billing-issue" },
          { text: "Extension not working at all", next: "not-working" },
          { text: "Other issue", next: "other" }
        ]
      },
      "not-blocking": {
        question: "Which scenario matches yours?",
        options: [
          { text: "No sites are being blocked", next: "no-blocking-at-all" },
          { text: "Some sites blocked, some not", next: "partial-blocking" },
          { text: "Sites blocked on wrong pages", next: "overblocking" }
        ]
      },
      "no-blocking-at-all": {
        question: "Check: Is your blocklist empty?",
        options: [
          { text: "Yes, it's empty", next: "sol-add-sites" },
          { text: "No, I have sites listed", next: "blocking-mode-check" }
        ]
      },
      "sol-add-sites": {
        solution: "<h3>Add Sites to Your Blocklist</h3><ol><li>Click the Focus Mode icon</li><li>Click '+ Add Site'</li><li>Type a domain (e.g., youtube.com)</li><li>Press Enter</li><li>Refresh any open tabs of that site</li></ol>"
      },
      "blocking-mode-check": {
        solution: "<h3>Check Your Blocking Mode</h3><ol><li>Go to Settings > Blocking</li><li>Check if set to 'Block during sessions only'</li><li>If so, start a Pomodoro session first</li><li>Or change to 'Always block'</li></ol><p>Also try: disable and re-enable the extension at chrome://extensions</p>"
      },
      "timer-issues": {
        question: "What's happening with the timer?",
        options: [
          { text: "Timer stops/pauses unexpectedly", next: "sol-timer-stops" },
          { text: "Notifications aren't working", next: "sol-notifications" },
          { text: "Timer shows wrong time", next: "sol-timer-wrong" }
        ]
      },
      "sol-timer-stops": {
        solution: "<h3>Timer Stopping</h3><p>Chrome may suspend the service worker. Try:</p><ol><li>Keep the Focus Mode popup open (or pinned)</li><li>Ensure Chrome isn't in power-saving mode</li><li>Check that no other extensions are interfering</li></ol><p>The timer should resume automatically when the service worker wakes up.</p>"
      },
      "sol-notifications": {
        solution: "<h3>Fix Notifications</h3><ol><li>Go to chrome://settings/content/notifications</li><li>Ensure Focus Mode is in the 'Allow' list</li><li>Check your system notification settings (not just Chrome)</li><li>On macOS: System Preferences > Notifications > Google Chrome</li></ol>"
      },
      "sol-timer-wrong": {
        solution: "<h3>Timer Showing Wrong Time</h3><ol><li>Check Settings > General > Timezone</li><li>Try Settings > Pomodoro > Reset Timer</li><li>If you changed your system clock recently, restart Chrome</li></ol>"
      },
      "nuclear-issue": {
        question: "What's your Nuclear Mode situation?",
        options: [
          { text: "I'm locked out and need access to a site", next: "sol-nuclear-locked" },
          { text: "Nuclear Mode won't activate", next: "sol-nuclear-activate" },
          { text: "Nuclear Mode shows active but sites aren't blocked", next: "sol-nuclear-bug" }
        ]
      },
      "sol-nuclear-locked": {
        solution: "<h3>Nuclear Mode Lockout</h3><p><strong>By design, Nuclear Mode cannot be bypassed.</strong> Your options:</p><ol><li>Wait for the timer to expire</li><li>Use a different browser (Firefox, Safari, Edge)</li><li>Use your phone for urgent access</li></ol><p><strong>For next time:</strong> Start with shorter durations (30-60 min) and don't block sites you might urgently need.</p>"
      },
      "sol-nuclear-activate": {
        solution: "<h3>Nuclear Mode Won't Activate</h3><ol><li>Confirm you have a Pro subscription (Settings > Pro)</li><li>Set duration to at least 15 minutes</li><li>Select at least 1 site to block</li><li>Ensure no other Nuclear session is already active</li></ol>"
      },
      "sol-nuclear-bug": {
        solution: "<h3>Nuclear Mode Bug</h3><p>This is a critical issue. Please:</p><ol><li>Copy your debug info: Settings > About > Copy Debug Info</li><li>Email support@zovo.one with the subject 'Nuclear Mode Bug'</li><li>Include: your debug info, which sites aren't blocked, and the Nuclear Mode timer status</li></ol><p>We'll prioritize this as urgent.</p>"
      },
      "streak-lost": {
        solution: "<h3>Lost Streak</h3><p>Streaks require at least 1 focus session per calendar day (midnight in your timezone).</p><p><strong>Common causes:</strong></p><ul><li>Forgot to start a session on a busy day</li><li>Wrong timezone (Settings > General > Timezone)</li><li>Chrome wasn't open that day</li></ul><p><strong>Unfortunately, streaks cannot be restored manually.</strong></p><p><strong>Prevent future losses:</strong> Enable 'Streak Reminder' in Settings > Notifications for an 8 PM daily reminder.</p>"
      },
      "not-working": {
        question: "Can you see the Focus Mode icon in your toolbar?",
        options: [
          { text: "No, I can't find the icon", next: "sol-icon-missing" },
          { text: "Yes, but nothing happens when I click", next: "sol-icon-broken" },
          { text: "Yes, but it shows an error", next: "other" }
        ]
      },
      "sol-icon-missing": {
        solution: "<h3>Icon Not Visible</h3><ol><li>Click the puzzle piece icon in Chrome's toolbar</li><li>Find 'Focus Mode - Blocker'</li><li>Click the pin icon to show it</li></ol><p>Not in the list? Go to chrome://extensions and check if it's installed and enabled.</p>"
      },
      "sol-icon-broken": {
        solution: "<h3>Icon Not Responding</h3><ol><li>Refresh the current page</li><li>Close and reopen Chrome completely</li><li>Go to chrome://extensions > Focus Mode > disable and re-enable</li><li>If still broken: remove and reinstall from Chrome Web Store</li></ol><p><strong>Note:</strong> Reinstalling resets local data. Pro users with cloud sync will recover automatically.</p>"
      },
      "other": {
        solution: "<h3>Contact Support</h3><p>We're here to help! Please email <a href='mailto:support@zovo.one'>support@zovo.one</a> with:</p><ul><li>Description of the issue</li><li>Steps to reproduce</li><li>Debug info: Settings > About > Copy Debug Info</li><li>Screenshots if possible</li></ul><p>Or use the feedback widget: Settings > Help & Feedback.</p>"
      }
    };

    // ... (same renderStep/selectOption/goBack/history logic as generic)
    let history = [];

    function renderStep(stepId) {
      const step = troubleshooterData[stepId];
      const container = document.getElementById('steps');
      let html = '<div class="step active" data-step="' + stepId + '">';
      if (step.solution) {
        html += '<div class="solution">' + step.solution + '</div>';
        html += '<button class="back-btn" onclick="goBack()">Start Over</button>';
      } else {
        html += '<h2>' + step.question + '</h2><div class="options">';
        step.options.forEach(function(opt) {
          html += '<div class="option" onclick="selectOption(\'' + opt.next + '\')">' + opt.text + '</div>';
        });
        html += '</div>';
        if (history.length > 0) {
          html += '<button class="back-btn" onclick="goBack()">Back</button>';
        }
      }
      html += '</div>';
      container.innerHTML = html;
    }

    function selectOption(nextStep) {
      history.push(document.querySelector('.step.active').dataset.step);
      renderStep(nextStep);
    }

    function goBack() {
      if (history.length > 0) renderStep(history.pop());
      else renderStep('start');
    }

    renderStep('start');
  </script>
</body>
</html>
```

---

## Key Design Decisions

### Focus Mode-Specific Templates
- **37 canned responses** covering all Focus Mode features (Nuclear Mode, Focus Score, Pomodoro, streaks, blocklist)
- Every template uses "Zovo Support Team" sign-off for brand consistency
- Nuclear Mode templates are empathetic but firm — the lockout is by design
- Streak loss templates acknowledge emotional impact but explain why restoration isn't possible

### Self-Service First
- Interactive troubleshooter covers the 8 most common issue categories
- FAQ addresses Focus Mode-specific questions (not generic extension FAQ)
- Knowledge base mirrors the extension's feature hierarchy
- Video tutorials planned for all major features (8 videos)

### Pro Upsell in Support
- "feature-exists-pro" template lets agents redirect feature requests to existing Pro features
- FAQ clearly labels Pro-only features
- Never pushy — informational only, always offering the Free alternative

---

*Agent 2 — Canned Response Library & Self-Service Resources — Complete*
