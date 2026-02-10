# AGENT 3: EXTREME DEBUGGING AND EDGE CASES SPECIFICATION
## Focus Mode - Blocker Chrome Extension

> **Version:** 1.0 | **Date:** February 10, 2026 | **Status:** Specification Complete

---

## 1. CODE REVIEW CHECKLIST

### 1.1 Security Scan

| # | Check | Target Areas | Severity |
|---|-------|-------------|:--------:|
| S-01 | No `innerHTML` usage | Popup, block page, options page | Critical |
| S-02 | No `eval()` or `new Function()` | All JS files | Critical |
| S-03 | No `document.write()` | All contexts | Critical |
| S-04 | All user text rendered via `textContent` | Blocklist URLs, custom quotes, settings | Critical |
| S-05 | URL validation on blocklist input | Popup blocklist input | High |
| S-06 | No hardcoded API keys or secrets | All files | Critical |
| S-07 | Message passing validates sender | Service worker message handler | High |
| S-08 | Content script isolation (no page access to extension) | Content scripts | High |
| S-09 | CSP blocks inline scripts | manifest.json CSP | High |
| S-10 | No `externally_connectable` unless required | manifest.json | Medium |
| S-11 | Storage keys sanitized before use | All storage operations | Medium |
| S-12 | Import data validated and sanitized | Settings import feature | High |

### 1.2 Stability Scan

| # | Check | Risk Area | Severity |
|---|-------|-----------|:--------:|
| R-01 | All `chrome.storage` reads handle undefined | Every `.get()` call | High |
| R-02 | All async functions have try/catch | Every `async` function | High |
| R-03 | Service worker state restored on wake | Timer, nuclear, session state | Critical |
| R-04 | Alarms re-registered on service worker install | All `chrome.alarms.create` | Critical |
| R-05 | Race condition: popup opens before SW ready | Popup ↔ SW message channel | High |
| R-06 | Race condition: multiple storage writes | Concurrent timer tick + stats update | Medium |
| R-07 | Race condition: nuclear option + timer + blocking | Simultaneous state changes | High |
| R-08 | Promise rejection handler on all Chrome API calls | All `chrome.*` async calls | Medium |
| R-09 | Graceful handling of chrome.storage quota exceeded | Storage write operations | Medium |
| R-10 | Tab close during content script execution | Block page injector | Medium |
| R-11 | Popup close during async operation | Settings save, blocklist add | Medium |
| R-12 | Service worker termination during long operation | Stats calculation, score computation | High |

---

## 2. FUNCTIONAL TEST MATRIX

### 2.1 Core Blocking (16 tests)

| Test ID | Scenario | Steps | Expected Result | Priority |
|---------|----------|-------|----------------|:--------:|
| CB-01 | Add site to blocklist | Open popup → Blocklist tab → Type "reddit.com" → Click Add | Site appears in list, declarativeNetRequest rule created | P0 |
| CB-02 | Block a site | Add reddit.com → Navigate to reddit.com | Block page appears instead of Reddit | P0 |
| CB-03 | Block via address bar | Add site → Type URL directly in address bar | Block page appears | P0 |
| CB-04 | Block via bookmark | Add site → Click bookmark to blocked site | Block page appears | P0 |
| CB-05 | Block via history | Add site → Open history → Click blocked site | Block page appears | P1 |
| CB-06 | Block subdomain | Add "reddit.com" → Navigate to old.reddit.com | Block page appears (subdomains blocked) | P0 |
| CB-07 | Remove site from blocklist | Blocklist → Click X on a site → Navigate to it | Site loads normally | P0 |
| CB-08 | Pre-built list: Social | Enable "Social Media" list → Navigate to facebook.com | Block page appears | P0 |
| CB-09 | Pre-built list: News | Enable "News" list → Navigate to cnn.com | Block page appears | P0 |
| CB-10 | 10-site free limit | Add 10 sites → Try to add 11th | "Upgrade to Pro" message, add button disabled | P0 |
| CB-11 | Block page content | Navigate to blocked site | Shows streak, time saved, quote, timer (if active), back button | P0 |
| CB-12 | Block page "Back to Work" | On block page → Click "Back to Work" | Navigates to new tab or previous non-blocked page | P1 |
| CB-13 | HTTPS and HTTP both blocked | Add "example.com" → Try http:// and https:// | Both blocked | P0 |
| CB-14 | Blocking persists across restart | Add sites → Close/reopen Chrome | Sites still blocked | P0 |
| CB-15 | Empty blocklist start session | No sites added → Start Quick Focus | Session starts, no blocking active (just timer) | P1 |
| CB-16 | Duplicate site prevention | Add "reddit.com" → Try adding "reddit.com" again | Error message, duplicate not added | P1 |

### 2.2 Focus Timer (12 tests)

| Test ID | Scenario | Steps | Expected Result | Priority |
|---------|----------|-------|----------------|:--------:|
| FT-01 | Start Pomodoro | Click Quick Focus | 25:00 timer starts, badge shows countdown | P0 |
| FT-02 | Timer counts down | Start session → Wait 10s | Timer shows 24:50, badge updates | P0 |
| FT-03 | Timer completion | Start → Wait for completion (or mock) | Notification fires, break starts (5:00) | P0 |
| FT-04 | Break completion | After focus → Wait for break | Notification fires, ready for next session | P0 |
| FT-05 | Pause timer | Start session → Click pause | Timer pauses, blocking remains active | P1 |
| FT-06 | Resume timer | Pause → Click resume | Timer continues from paused time | P1 |
| FT-07 | End session early | Start → Click End | Post-session summary shown, stats recorded | P0 |
| FT-08 | Timer with popup closed | Start session → Close popup → Reopen | Timer still running, shows correct remaining time | P0 |
| FT-09 | Timer survives SW restart | Start → Wait for SW termination → Reopen popup | Timer shows correct time (alarm-based) | P0 |
| FT-10 | Multiple windows | Start session → Open new window → Open popup | Same timer state shown in both windows | P1 |
| FT-11 | Timer + blocking active | Start session with blocklist → Visit blocked site | Block page shows timer countdown | P0 |
| FT-12 | Session recorded in history | Complete session → Check stats tab | Session appears in history with duration, score | P0 |

### 2.3 Nuclear Option (10 tests)

| Test ID | Scenario | Steps | Expected Result | Priority |
|---------|----------|-------|----------------|:--------:|
| NC-01 | Start nuclear (free) | Nuclear tab → Set 1hr → Activate | All blocked sites unbypassable for 1 hour | P0 |
| NC-02 | Cannot disable during nuclear | Start nuclear → Try to remove a blocked site | Remove button disabled, "Nuclear active" message | P0 |
| NC-03 | Cannot uninstall during nuclear | Start nuclear → Go to chrome://extensions | Extension removal blocked or warning (if possible) | P1 |
| NC-04 | Nuclear countdown | Start nuclear → Check timer | Countdown visible in popup and badge | P0 |
| NC-05 | Nuclear completion | Start 1hr → Wait for expiry | Nuclear ends, normal blocking resumes, notification | P0 |
| NC-06 | Nuclear survives restart | Start nuclear → Restart Chrome | Nuclear still active with correct remaining time | P0 |
| NC-07 | Free user 1hr max | Free user → Try to set >1hr | Slider stops at 1hr, Pro upgrade prompt | P0 |
| NC-08 | Nuclear + timer combo | Start Pomodoro → Then start nuclear | Both run simultaneously, nuclear outlasts timer | P1 |
| NC-09 | Nuclear incognito | Start nuclear → Open incognito window → Visit blocked site | Still blocked in incognito | P0 |
| NC-10 | Post-nuclear T3 trigger | Complete nuclear → Within 5min try to start another | T3 paywall trigger (Pro upgrade for 24hr) | P1 |

### 2.4 Stats & Analytics (10 tests)

| Test ID | Scenario | Steps | Expected Result | Priority |
|---------|----------|-------|----------------|:--------:|
| ST-01 | Daily focus time | Complete 2 sessions → Check stats | Total focus time = sum of session durations | P0 |
| ST-02 | Distraction counter | Visit 5 blocked sites → Check stats | Counter shows 5 attempts | P0 |
| ST-03 | Focus Score calculated | Complete session → Check score | Score 0-100 displayed, breakdown for Pro | P0 |
| ST-04 | Stats reset at midnight | Check stats → Wait past midnight (or mock) | New day shows 0 stats, yesterday preserved | P1 |
| ST-05 | Streak incremented | Complete session on consecutive days | Streak count increases by 1 each day | P0 |
| ST-06 | Streak broken | Miss a day → Check streak | Streak resets to 0 (or 1 on return) | P0 |
| ST-07 | Weekly report (free) | After session 5+ → Check reports | Blurred report visible, Pro upgrade prompt | P0 |
| ST-08 | Session history (free) | Complete 10 sessions → Check history | Shows last 7 days only (free limit) | P1 |
| ST-09 | Stats persist across restart | Record stats → Restart Chrome → Check | All stats intact | P0 |
| ST-10 | Block page attempt tracking | Visit blocked site 3x → Check counter | Shows 3 blocked attempts for that site | P1 |

### 2.5 Streaks & Gamification (8 tests)

| Test ID | Scenario | Steps | Expected Result | Priority |
|---------|----------|-------|----------------|:--------:|
| GM-01 | Streak flame icon | Active streak → Check popup | Flame icon with streak count visible | P0 |
| GM-02 | Streak milestone | Reach 7-day streak | Celebration notification, milestone badge | P1 |
| GM-03 | Focus Score range | Various session qualities | Score always 0-100, never negative or >100 | P0 |
| GM-04 | Score updates after session | Complete session → Check score | Score updated based on session performance | P0 |
| GM-05 | Badge on extension icon | Active session → Check toolbar icon | Badge shows timer or focus indicator | P1 |
| GM-06 | Pro: Streak recovery | Pro user → Miss a day → Check | "Recover streak?" option available | P1 |
| GM-07 | Achievement unlock | Hit first milestone (3-day streak) | Achievement notification, visible in popup | P2 |
| GM-08 | Focus Score breakdown (Pro) | Pro user → Click score → Check breakdown | Shows 4 weighted factors with individual scores | P1 |

### 2.6 Paywall & Pro Features (12 tests)

| Test ID | Scenario | Steps | Expected Result | Priority |
|---------|----------|-------|----------------|:--------:|
| PW-01 | Sessions 1-2: no Pro mentions | Install → Complete 2 sessions | ZERO Pro badges, locks, or upgrade prompts | P0 |
| PW-02 | Session 3: PRO badges appear | Complete 3rd session → Check settings | PRO badges visible on locked features | P0 |
| PW-03 | Session 5: T1 trigger | Complete 5th session → Check popup | Blurred weekly report notification/banner | P0 |
| PW-04 | T2: 11th site | Add 10 sites → Try 11th | Slide-down upgrade panel | P0 |
| PW-05 | T3: Nuclear extension | Complete 1hr nuclear → Try another within 5min | Nuclear extension upgrade modal | P0 |
| PW-06 | Pro feature lock click | Free user → Click locked feature in settings | Slide-up panel explaining feature + upgrade CTA | P1 |
| PW-07 | Paywall dismiss tracking | Dismiss T1 → Reopen popup | Paywall not shown again this session | P0 |
| PW-08 | One paywall per session | Trigger T2 → Same session trigger T5 | Only T2 shown, T5 logged silently | P1 |
| PW-09 | Pro upgrade unlocks features | Activate Pro license → Check all features | All locks removed, full access, PRO badge on icon | P0 |
| PW-10 | Pro → Free downgrade | Cancel Pro → License expires | Features re-lock, data preserved, gentle messaging | P0 |
| PW-11 | License offline grace | Pro user → Go offline for 3 days | Pro features still work (7-day grace) | P1 |
| PW-12 | License grace expired | Pro user → Offline >7 days | Graceful downgrade to free with notification | P1 |

### 2.7 Settings/Options Page (8 tests)

| Test ID | Scenario | Steps | Expected Result | Priority |
|---------|----------|-------|----------------|:--------:|
| OPT-01 | Open settings | Click gear icon → Settings page opens | Full settings page in new tab | P0 |
| OPT-02 | Change setting | Toggle a setting → Close → Reopen | Setting persisted | P0 |
| OPT-03 | Pro settings locked | Free user → View Pro settings | Lock icons visible, controls disabled | P0 |
| OPT-04 | Import settings | Export → Modify → Import | Settings restored from file | P2 |
| OPT-05 | Export settings | Click export | JSON file downloaded | P2 |
| OPT-06 | Reset to defaults | Settings → Reset → Confirm | All settings return to defaults | P1 |
| OPT-07 | Schedule configuration | Set M-F 9-5 schedule → Wait for active time | Blocking activates per schedule | P1 |
| OPT-08 | Dark mode toggle | Toggle dark mode | All UI switches to dark palette | P1 |

### 2.8 Ambient Sounds (5 tests)

| Test ID | Scenario | Steps | Expected Result | Priority |
|---------|----------|-------|----------------|:--------:|
| SN-01 | Play sound | Click rain icon | Rain sound plays, icon highlighted | P1 |
| SN-02 | Stop sound | Playing sound → Click icon again | Sound stops | P1 |
| SN-03 | Sound with popup closed | Start sound → Close popup → Wait | Sound continues playing (offscreen doc) | P1 |
| SN-04 | Pro sounds locked | Free user → Click 4th sound | Lock icon, Pro upgrade prompt | P1 |
| SN-05 | Sound during session | Start focus session → Start sound | Both work simultaneously | P1 |

### 2.9 Notifications (5 tests)

| Test ID | Scenario | Steps | Expected Result | Priority |
|---------|----------|-------|----------------|:--------:|
| NT-01 | Session start notification | Start focus session | "Focus session started" notification | P1 |
| NT-02 | Session end notification | Complete session | "Session complete!" notification with stats | P1 |
| NT-03 | Break reminder | Break timer ends | "Break's over — ready for another round?" | P1 |
| NT-04 | Streak milestone | Hit 7-day streak | Celebration notification | P2 |
| NT-05 | Notification muting | Enable muting → Start session | Browser notifications silenced during session | P1 |

---

## 3. STATE MANAGEMENT TESTS

| Test ID | State | Setup | Verification | Priority |
|---------|-------|-------|-------------|:--------:|
| SM-01 | Fresh install | Install extension | Defaults loaded, onboarding ready, no Pro badges, session count = 0 | P0 |
| SM-02 | Session 3 transition | Complete 3 sessions | PRO badges appear, Focus Score shows, T4/T5/T10 armed | P0 |
| SM-03 | Session 5 transition | Complete 5 sessions | T1 (weekly report) fires, T2/T3 armed | P0 |
| SM-04 | Pro user state | Activate Pro license | All locks removed, PRO badge, no paywalls, full features | P0 |
| SM-05 | Pro → Free downgrade | Expire Pro license | Features re-lock, data preserved, limits re-applied | P0 |
| SM-06 | Corrupted storage | Manually corrupt chrome.storage values | Extension recovers with defaults, no crash | P0 |
| SM-07 | Missing storage keys | Delete individual keys from storage | Extension recreates missing keys with defaults | P1 |
| SM-08 | Browser restart | Close Chrome during active session → Reopen | Timer resumes from correct point, stats intact | P0 |
| SM-09 | Service worker restart | Force-terminate SW → Trigger wake | Alarms re-registered, blocking intact, state correct | P0 |
| SM-10 | Multiple windows | Open 2+ browser windows → Interact in each | Consistent state across all popup instances | P1 |
| SM-11 | Multiple Chrome profiles | Install on 2 profiles | Independent instances, no data leaking between profiles | P1 |
| SM-12 | Extension update | Simulate version update (new install) | Data preserved, migration runs, new features available | P1 |

---

## 4. EDGE CASE TESTS

### 4.1 User Behavior Edge Cases

| Test ID | Scenario | Steps | Expected | Priority |
|---------|----------|-------|----------|:--------:|
| EC-01 | Rapid Quick Focus clicks | Click Quick Focus 10 times in 1 second | Only 1 session starts, button debounced | P0 |
| EC-02 | Rapid add/remove site | Add and remove same site rapidly | Consistent state, no orphan rules | P1 |
| EC-03 | Invalid URL input | Type "not a url" in blocklist input | Validation error, not added | P0 |
| EC-04 | Empty URL input | Click Add with empty input | Nothing happens, no error | P1 |
| EC-05 | Very long URL | Paste 2000-character URL | Truncated or rejected with message | P1 |
| EC-06 | Unicode domain | Add "例え.jp" or emoji domain | Handled correctly (Punycode) or rejected | P1 |
| EC-07 | Special characters | Add "site.com/path?q=<script>" | Sanitized, no XSS | P0 |
| EC-08 | Keyboard-only navigation | Tab through entire popup | All elements reachable, focus visible | P1 |
| EC-09 | Screen reader | Navigate with VoiceOver/NVDA | All elements have labels, state announced | P2 |
| EC-10 | Copy-paste into URL input | Paste "https://reddit.com" | Protocol stripped, "reddit.com" added | P1 |
| EC-11 | Drag tab during session | Drag tab to new window during focus | Session continues, blocking works in new window | P1 |

### 4.2 System Edge Cases

| Test ID | Scenario | Steps | Expected | Priority |
|---------|----------|-------|----------|:--------:|
| EC-20 | Offline | Disconnect network → Use extension | All local features work, sync gracefully fails | P0 |
| EC-21 | System sleep/wake | Start session → Sleep computer → Wake | Timer adjusts to actual elapsed time | P0 |
| EC-22 | System time change | Start session → Change system clock forward 1hr | Timer detects anomaly, uses alarm-based time | P1 |
| EC-23 | Timezone change | Start session → Change timezone | Timer unaffected (uses relative time, not wall clock) | P2 |
| EC-24 | Low memory | Simulate low memory (many tabs) | Extension degrades gracefully, no crash | P1 |
| EC-25 | Chrome update | Mid-session Chrome auto-updates | Session state preserved post-update | P1 |
| EC-26 | Incognito mode | Open incognito → Visit blocked site | Blocked if "Allow in incognito" enabled | P1 |
| EC-27 | Guest profile | Open guest profile → Install extension | Fresh instance, no data from main profile | P2 |
| EC-28 | 100+ tabs | Open 100 tabs with extension enabled | Memory under 150MB total, no slowdown | P1 |
| EC-29 | Close all windows during session | Close every Chrome window → Reopen Chrome | Session ended gracefully, stats saved | P1 |

### 4.3 Data Edge Cases

| Test ID | Scenario | Steps | Expected | Priority |
|---------|----------|-------|----------|:--------:|
| EC-40 | Empty blocklist + Quick Focus | No sites blocked → Quick Focus | Timer starts, no blocking (just focus timer) | P1 |
| EC-41 | Storage near limit | Fill storage to ~9MB → Add more data | Warning message, auto-prune old data | P1 |
| EC-42 | Streak at 999 | Mock streak to 999 → Increment | Displays 1000 correctly, no overflow | P2 |
| EC-43 | Focus Score exactly 0 | Mock all-distracted session | Score shows 0, no negative, no crash | P1 |
| EC-44 | Focus Score exactly 100 | Mock perfect session | Score shows 100, celebration animation | P1 |
| EC-45 | 10,000 session history entries | Mock large history | Virtual scroll works, no hang | P2 |
| EC-46 | Midnight during session | Start session at 11:50 PM → Run past midnight | Session counts for start day, stats roll over | P1 |
| EC-47 | Corrupted JSON in storage | Replace storage value with invalid JSON | Extension recovers, resets affected key | P0 |

---

## 5. EXTENSION CONFLICT TESTS

| Extension | Potential Conflict | Test | Expected | Mitigation |
|-----------|-------------------|------|----------|-----------|
| uBlock Origin | Both modify network requests | Block same site with both → Load site | Both block pages may compete; ours should take priority or coexist | Use higher priority in declarativeNetRequest |
| AdBlock Plus | Similar to uBlock | Same as above | Same as above | Same mitigation |
| Dark Reader | CSS injection on block page | Visit blocked site with Dark Reader enabled | Block page readable, not distorted | Use `!important` on critical block page styles |
| Grammarly | Content script injection | Block page has text input? | No conflict expected (block page has no inputs) | Verify no unexpected behavior |
| LastPass/1Password | Autofill injection | Options page form fields | No conflict expected, password managers may inject on settings page | Verify settings save correctly |
| Momentum | New tab override | Block page on new tab? | No conflict — our block page is an overlay, not new tab | Document for users |
| BlockSite | Competing blocking rules | Both block same site | Both block pages may fight; user should choose one | Document incompatibility |
| StayFocusd | Competing blocking rules | Same as BlockSite | Same | Document incompatibility |

---

## 6. BUG REPORT TEMPLATE

```
ID: BUG-[XXX]
Severity: [Critical / High / Medium / Low]
Category: [Functional / Performance / Security / UX / Accessibility]

Summary: [One-line description]

Steps to Reproduce:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Expected Behavior:
[What should happen]

Actual Behavior:
[What actually happens]

Environment:
- Chrome Version: [e.g., 122.0.6261.69]
- OS: [e.g., macOS 15.2, Windows 11]
- Extension Version: [e.g., 1.0.0]
- User Tier: [Free / Pro]
- Other Extensions: [List if relevant]

Frequency: [Always / Intermittent / One-time]
Screenshot/Recording: [Attach if applicable]

Suggested Fix:
[Proposed solution or investigation direction]

Code Location:
[File:line if known]
```

---

## 7. SMOKE TEST SUITE (5 Minutes)

Run before EVERY release:

| # | Test | Pass Criteria | Time |
|---|------|--------------|:----:|
| 1 | Extension loads | Popup opens without error | 10s |
| 2 | Add a site to blocklist | Site added, appears in list | 15s |
| 3 | Site is blocked | Navigate to blocked site → Block page shown | 15s |
| 4 | Start Quick Focus | Timer starts, countdown visible | 10s |
| 5 | Timer runs with popup closed | Close popup → Reopen → Timer still running | 15s |
| 6 | Stats update | Check daily stats → Focus time > 0 | 10s |
| 7 | Nuclear option starts | Activate nuclear → Sites unremovable | 20s |
| 8 | Settings page opens | Click gear → Options page loads | 10s |
| 9 | Pro badges visible (session 3+) | Check for lock icons on Pro features | 15s |
| 10 | No console errors | Open DevTools → Check console | 10s |
| **Total** | | | **~2 min** |

---

## 8. FULL REGRESSION SUITE

**Total: 86 test cases organized by feature area**

| Area | Test IDs | Count | Time Estimate |
|------|----------|:-----:|:------------:|
| Core Blocking | CB-01 to CB-16 | 16 | 8 min |
| Focus Timer | FT-01 to FT-12 | 12 | 6 min |
| Nuclear Option | NC-01 to NC-10 | 10 | 5 min |
| Stats & Analytics | ST-01 to ST-10 | 10 | 5 min |
| Gamification | GM-01 to GM-08 | 8 | 4 min |
| Paywall & Pro | PW-01 to PW-12 | 12 | 6 min |
| Settings | OPT-01 to OPT-08 | 8 | 4 min |
| Sounds | SN-01 to SN-05 | 5 | 3 min |
| Notifications | NT-01 to NT-05 | 5 | 3 min |
| **Total** | | **86** | **~44 min** |

**Execution order:** Core Blocking → Focus Timer → Nuclear → Stats → Gamification → Paywall → Settings → Sounds → Notifications

---

## 9. RELEASE CANDIDATE CHECKLIST

### Before Chrome Web Store Submission

**Code Quality:**
- [ ] All smoke tests pass
- [ ] Full regression suite pass (>95% of tests)
- [ ] Zero Critical or High severity bugs open
- [ ] No console errors or warnings
- [ ] All `TODO` comments resolved or documented

**Performance:**
- [ ] Popup load < 200ms (critical threshold)
- [ ] Bundle size < 1MB (critical threshold)
- [ ] Memory idle < 50MB
- [ ] No memory leaks in 30-minute active session test

**Security:**
- [ ] No innerHTML usage (grep verification)
- [ ] No eval usage (grep verification)
- [ ] CSP properly configured
- [ ] All inputs sanitized
- [ ] Message passing validated

**Functionality:**
- [ ] Fresh install onboarding works
- [ ] All free features functional
- [ ] All Pro features functional (with test license)
- [ ] Paywall triggers fire at correct times
- [ ] License verification works (online + offline)
- [ ] Data persists across Chrome restart

**Store Listing:**
- [ ] Screenshots current and accurate
- [ ] Description matches actual features
- [ ] Privacy policy URL valid
- [ ] Permission justifications written
- [ ] Version number incremented

**Edge Cases:**
- [ ] Incognito mode tested
- [ ] Offline mode tested
- [ ] System sleep/wake tested
- [ ] Multiple windows tested
- [ ] Extension conflict (uBlock Origin) tested

---

*QA specification generated for Phase 04 — Deployment System*
*86 test cases covering every feature, state, and edge case*
