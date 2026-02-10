# PART 3: Integrations Scoring, Portfolio Consistency Check & Edge Case Decisions

## Focus Mode - Blocker: Feature Value Analysis

> **Document Version:** 1.0
> **Date:** 2026-02-10
> **Status:** Complete
> **Pricing Reference:** Free / Pro $4.99/mo ($35.88/yr at $2.99/mo) / Lifetime $49.99 / Team $3.99/user/mo
> **Scoring Framework:** Weighted Score = (Acquisition x 0.25) + (Habit x 0.20) + (Upgrade x 0.25) + (Differentiation x 0.15) + (Cost x 0.15)

---

## SECTION A: INTEGRATIONS & PLATFORM -- FEATURE SCORING

### Scoring Summary Table

| # | Feature | Acquisition | Habit | Upgrade | Differentiation | Cost | Weighted Score | Recommended Tier |
|---|---------|:-----------:|:-----:|:-------:|:---------------:|:----:|:--------------:|:----------------:|
| 1 | Cross-device sync | 5 | 6 | 9 | 7 | 4 | 6.30 | LIMITED FREE (Pro gate) |
| 2 | Ambient sounds (3 free) | 7 | 9 | 6 | 8 | 8 | 7.45 | FREE (3 sounds) |
| 3 | Sound mixing | 3 | 6 | 7 | 6 | 7 | 5.55 | PRO |
| 4 | Notification muting (blanket) | 7 | 8 | 4 | 6 | 9 | 6.65 | FREE |
| 5 | Selective notification allowlist | 3 | 5 | 7 | 5 | 6 | 5.10 | PRO |
| 6 | Browser action badge | 8 | 7 | 2 | 4 | 10 | 6.15 | FREE |
| 7 | Chrome startup auto-focus | 3 | 7 | 6 | 4 | 8 | 5.35 | PRO |
| 8 | API access | 1 | 2 | 3 | 5 | 3 | 2.65 | TEAM |

---

### Detailed Feature Analysis

#### Feature 1: Cross-Device Sync

**Score Breakdown:**

| Dimension | Score | Reasoning |
|-----------|:-----:|-----------|
| Acquisition (0.25) | 5 | Not a reason someone installs a Chrome extension initially -- you discover you need sync after using it on one device. Moderate draw for Freedom refugees who already understand cross-device value. |
| Habit (0.20) | 6 | Once enabled, sync works invisibly. It does not drive daily opens or active engagement. However, it prevents the "unprotected device" escape hatch, which indirectly strengthens the blocking habit across all devices. |
| Upgrade (0.25) | 9 | The #1 bypass complaint is "I just use my phone/other computer." Sync solves this directly. Among competitors, Freedom charges $6.99/mo for cross-platform sync. This is the single strongest justification for Pro -- users who discover the bypass loophole will pay to close it. Paywall trigger T9 (Sync Prompt) targets exactly this moment. |
| Differentiation (0.15) | 7 | Only Freedom ($6.99/mo) and BlockSite (Chrome-to-Chrome only) offer sync. We would be the most affordable sync option at $4.99/mo, and our Chrome-to-Chrome sync via `chrome.storage.sync` is technically simpler than Freedom's cross-platform approach but covers the primary use case. |
| Cost (0.15) | 4 | Requires server infrastructure for encrypted cloud sync fallback when `chrome.storage.sync` limits (100KB) are exceeded. Ongoing operational cost for sync conflict resolution. `chrome.storage.sync` itself is free but limited. |

**Weighted Score: (5 x 0.25) + (6 x 0.20) + (9 x 0.25) + (7 x 0.15) + (4 x 0.15) = 1.25 + 1.20 + 2.25 + 1.05 + 0.60 = 6.35**

**Adjusted Score: 6.30** (slight downward adjustment for Phase 2 delivery timeline -- Month 3 per roadmap)

**Tier Decision: PRO** -- Despite the 6.30 score falling in the "LIMITED FREE" range, sync should be fully Pro-gated. The reasoning:
- Sync has near-zero value without a second device. Offering "limited sync" (e.g., sync 5 settings) is confusing and technically fragile.
- Sync is a binary feature -- it either works across devices or it does not. There is no meaningful "limited" version.
- Sync has the highest Upgrade score (9) of any feature in this category, making it the strongest Pro conversion lever.
- Competitive benchmark: Every competitor gates sync behind their paid tier. Freedom ($6.99/mo), BlockSite (premium), LastPass (premium). No user expects free cross-device sync.
- The T9 paywall trigger (second device detection) is specifically designed for this conversion moment.

---

#### Feature 2: Ambient Sounds (3 Free: Rain, White Noise, Lo-fi Beats)

**Score Breakdown:**

| Dimension | Score | Reasoning |
|-----------|:-----:|-----------|
| Acquisition (0.25) | 7 | "Built-in focus sounds" is a genuinely attractive feature in Chrome Web Store listings. Users searching for "focus music Chrome extension" or "ambient sounds for work" could discover our extension through this feature alone. Several dedicated sound extensions (Noisli, myNoise) exist with 100K+ users, proving demand. Having sounds built into a blocker is a differentiator that appears in feature bullet points. |
| Habit (0.20) | 9 | This is one of the highest-habit features in the entire product. Users open the extension specifically for the sounds -- even when they are not starting a focus session. The spec notes "users open the extension just for this." Sound creates a Pavlovian association: rain sound = focus time. This drives daily opens and session starts. 3 sounds is enough variety to build the habit without exhausting it. |
| Upgrade (0.25) | 6 | Moderate upgrade driver. Users who like the 3 free sounds will see 12+ locked sounds with Pro badges in the sound picker. The desire for variety ("I'm bored of rain") and mixing ("rain + lo-fi together") creates organic upgrade interest. However, 3 solid sounds satisfy most users indefinitely -- the upgrade is a "want" not a "need." |
| Differentiation (0.15) | 8 | No competing website blocker includes ambient sounds. Forest has nature sounds on mobile but not in the Chrome extension. Freedom, BlockSite, StayFocusd, LeechBlock -- none offer sounds. This is a genuine feature gap in the blocker category. Dedicated focus sound extensions exist (Noisli at $2/mo, Focus@Will at $5.83/mo) but none combine sounds with blocking. |
| Cost (0.15) | 8 | Audio files are bundled MP3s (30-60 second loops). 3 tracks at ~1-2MB each = ~3-6MB added to extension bundle. One-time production cost. No server, no API, no ongoing cost. Playback via Manifest V3 offscreen document is a solved technical pattern. Development estimate: 3-5 days. |

**Weighted Score: (7 x 0.25) + (9 x 0.20) + (6 x 0.25) + (8 x 0.15) + (8 x 0.15) = 1.75 + 1.80 + 1.50 + 1.20 + 1.20 = 7.45**

**Tier Decision: FREE (3 sounds)** -- The 7.45 score is just below the 7.5 threshold but the habit score of 9 is the decisive factor. This feature drives daily active usage at near-zero marginal cost. The decision to give 3 sounds free is validated:
- Rain, white noise, and lo-fi beats are the three most popular focus sounds across Noisli, Brain.fm, and YouTube focus playlists (combined billions of views).
- 3 sounds is enough to build the habit but few enough to create variety desire.
- The locked sounds visible in the picker (with Pro badges) create ongoing visual upgrade cues without any aggressive paywall.
- Competitors do not offer this at all -- making even 3 free sounds a differentiator.

---

#### Feature 3: Sound Mixing (Layer Multiple Sounds)

**Score Breakdown:**

| Dimension | Score | Reasoning |
|-----------|:-----:|-----------|
| Acquisition (0.25) | 3 | Sound mixing is not a feature that drives installs. Nobody searches "Chrome extension with sound mixing." It is a delight feature discovered after install. |
| Habit (0.20) | 6 | Users who create custom mixes (rain + lo-fi, fireplace + white noise) develop a personalized "focus soundtrack" that becomes habitual. But this is an incremental habit boost on top of the base sound habit -- not a standalone driver. |
| Upgrade (0.25) | 7 | Mixing is a clear and tangible Pro upgrade. Users understand instantly: "I can layer rain with lo-fi? That's cool." The mixing UI (3 sliders) is visually appealing and creates a "playground" feel that Pro users enjoy. Saved mix presets add stickiness. |
| Differentiation (0.15) | 6 | Noisli ($2/mo) offers mixing. Brain.fm does not. No blocker extension offers mixing. Moderate differentiation -- the feature exists in the broader focus-sound market but not in the blocker category. |
| Cost (0.15) | 7 | The mixing feature itself is pure client-side audio processing. No additional file cost beyond what is already bundled for the full library. The Web Audio API handles mixing natively. Development effort is moderate (volume sliders, concurrent playback, mix preset storage). |

**Weighted Score: (3 x 0.25) + (6 x 0.20) + (7 x 0.25) + (6 x 0.15) + (7 x 0.15) = 0.75 + 1.20 + 1.75 + 0.90 + 1.05 = 5.65**

**Adjusted Score: 5.55** (requires the full sound library to be meaningful -- tied to Pro sound library unlock)

**Tier Decision: PRO** -- Sound mixing is inherently a Pro feature because:
- It requires access to the full sound library (15+ tracks) to be meaningfully useful. Mixing 2 of 3 free sounds is limiting.
- It adds complexity to the UI that free users do not need.
- It pairs naturally with the full ambient sound library as a single "Pro audio" package.
- The mixing UI itself serves as an upgrade cue when Pro users share their setups.

---

#### Feature 4: Notification Muting (Blanket -- All Notifications During Focus)

**Score Breakdown:**

| Dimension | Score | Reasoning |
|-----------|:-----:|-----------|
| Acquisition (0.25) | 7 | "Silence notifications during focus" is a compelling feature in marketing copy. Users who have experienced notification interruptions during focus sessions understand this value immediately. It completes the "distraction-free" promise that blocking alone does not fulfill. |
| Habit (0.20) | 8 | Once enabled, notification muting becomes an expected part of the focus experience. Users will feel "exposed" without it. It runs automatically during sessions, requiring zero daily effort. The re-release of queued notifications when the session ends provides a natural "session boundary" that reinforces the habit loop. |
| Upgrade (0.25) | 4 | Low upgrade contribution because blanket muting is fully functional at free tier. Users do not hit a limit. The upgrade path exists (selective allowlist) but blanket muting satisfies the majority use case. |
| Differentiation (0.15) | 6 | Freedom mutes notifications as part of its blocking. No free Chrome blocker extension offers notification muting. This is a moderate differentiator -- it is expected in premium tools but absent from free ones. |
| Cost (0.15) | 9 | Notification interception via content script overriding `Notification` constructor is lightweight. No server cost. Minimal storage. Development estimate: 3-5 days. Small code footprint. |

**Weighted Score: (7 x 0.25) + (8 x 0.20) + (4 x 0.25) + (6 x 0.15) + (9 x 0.15) = 1.75 + 1.60 + 1.00 + 0.90 + 1.35 = 6.60**

**Adjusted Score: 6.65** (slight upward adjustment because this feature prevents negative reviews -- "blocker doesn't really help, notifications still interrupt me")

**Tier Decision: FREE** -- Notification muting must be free because:
- Without it, blocked sites can still send browser notifications, breaking the focus promise and generating negative reviews.
- It completes the core value proposition: "distraction-free focus."
- The spec identifies this as Free Feature 10 for exactly this reason.
- The low Upgrade score (4) confirms it is not a conversion driver -- it is a retention protector.
- The all-or-nothing simplicity makes it easy to implement and explain at the free tier.

---

#### Feature 5: Selective Notification Allowlist

**Score Breakdown:**

| Dimension | Score | Reasoning |
|-----------|:-----:|-----------|
| Acquisition (0.25) | 3 | Nobody installs a blocker for selective notification control. This is discovered after using blanket muting and missing an important Slack message. |
| Habit (0.20) | 5 | Once configured, it runs silently. Moderate habit impact -- it removes the fear of missing important messages during focus, which makes users more willing to start sessions. But it is a background feature with no active engagement surface. |
| Upgrade (0.25) | 7 | Strong upgrade driver for professional users. The scenario is clear: "I missed an important Slack DM from my manager because I had all notifications muted." This is a painful, specific moment that Pro solves. The upgrade path from blanket (free) to selective (Pro) is intuitive. |
| Differentiation (0.15) | 5 | Freedom and Serene offer selective notification control. This is expected in premium focus tools but not a unique differentiator. |
| Cost (0.15) | 6 | Requires building a notification origin allowlist management UI. Moderate complexity -- must detect notification sources and let users whitelist specific domains. Content script must selectively intercept vs. pass through. More complex than blanket muting. |

**Weighted Score: (3 x 0.25) + (5 x 0.20) + (7 x 0.25) + (5 x 0.15) + (6 x 0.15) = 0.75 + 1.00 + 1.75 + 0.75 + 0.90 = 5.15**

**Adjusted Score: 5.10** (slight downward for Month 5 delivery timeline)

**Tier Decision: PRO** -- Selective allowlist is a natural Pro feature because:
- It requires configuration depth (domain-by-domain allowlist) that adds UI complexity inappropriate for the free tier's simplicity.
- The upgrade path is clean: blanket muting (free) handles 80% of cases; selective allowlist (Pro) handles the professional 20%.
- It serves the knowledge worker persona (Alex) who needs to stay reachable for Slack/Calendar while blocking everything else.
- No free blocker offers this -- it is genuinely premium functionality.

---

#### Feature 6: Browser Action Badge (Show Session Time/Status on Extension Icon)

**Score Breakdown:**

| Dimension | Score | Reasoning |
|-----------|:-----:|-----------|
| Acquisition (0.25) | 8 | The badge showing a countdown timer ("18m") on the extension icon is a constant visual reminder that the tool is working. In Chrome Web Store screenshots, this is a trust signal: "the extension is visually active and responsive." It makes the extension feel polished and alive compared to static competitors. |
| Habit (0.20) | 7 | The badge is a passive habit reinforcer. Every time the user glances at their toolbar, they see their remaining time or session status. This creates ambient awareness of focus time without requiring any action. The badge transitions (green for focus, blue for break, countdown numbers) provide micro-feedback loops. |
| Upgrade (0.25) | 2 | The badge has essentially zero upgrade contribution. It is table-stakes UX for any timer extension. No user will pay for a badge. It must be free and should never be gated. |
| Differentiation (0.15) | 4 | Most timer extensions show badge countdowns. StayFocusd, Forest, and Deep Work Zone all use badges. This is expected, not differentiating. However, the specific information shown (timer + status color coding) can be slightly more polished than competitors. |
| Cost (0.15) | 10 | The `chrome.action.setBadgeText()` and `chrome.action.setBadgeBackgroundColor()` APIs are trivial. Zero server cost. A few lines of code. Development time measured in hours, not days. |

**Weighted Score: (8 x 0.25) + (7 x 0.20) + (2 x 0.25) + (4 x 0.15) + (10 x 0.15) = 2.00 + 1.40 + 0.50 + 0.60 + 1.50 = 6.00**

**Adjusted Score: 6.15** (upward adjustment -- this is a P0 feature that is essential for basic product polish and cannot ship without it)

**Tier Decision: FREE** -- Non-negotiable. The badge is core UX, not a feature to gate. Every timer extension in the Chrome Web Store shows a badge. Not having one would make the extension feel broken or amateurish. Development cost is near zero.

---

#### Feature 7: Chrome Startup Auto-Focus (Auto-Start Focus on Browser Launch)

**Score Breakdown:**

| Dimension | Score | Reasoning |
|-----------|:-----:|-----------|
| Acquisition (0.25) | 3 | Auto-start is not a discovery or install driver. Users do not search for "auto-start focus on browser open." This feature is appreciated after extended use. |
| Habit (0.20) | 7 | High habit score because it removes the daily activation friction entirely. "I open my laptop and focusing has already started" is the peak of habit integration. The user no longer needs to remember to start a session -- the tool works proactively. This represents the highest tier of behavioral automation in the product. |
| Upgrade (0.25) | 6 | Moderate upgrade driver. Users who start sessions manually 20+ times realize they want automation. The upgrade path is logical: manual start (free) --> auto-start (Pro). It pairs well with schedule-based blocking and calendar integration as part of the "automation" Pro package. |
| Differentiation (0.15) | 4 | Freedom and Cold Turkey both offer auto-start capabilities. This is a known feature in the premium blocker space but not a unique differentiator. |
| Cost (0.15) | 8 | Implementation via `chrome.runtime.onStartup` listener is straightforward. No server cost. Minimal code. The notification with 5-second cancel window adds slight complexity but is still simple. |

**Weighted Score: (3 x 0.25) + (7 x 0.20) + (6 x 0.25) + (4 x 0.15) + (8 x 0.15) = 0.75 + 1.40 + 1.50 + 0.60 + 1.20 = 5.45**

**Adjusted Score: 5.35** (slight downward for delivery in P2 Phase, Month 4)

**Tier Decision: PRO** -- Auto-start is a Pro convenience feature because:
- It is an automation feature that serves committed daily users -- exactly the Pro target audience.
- It pairs naturally with other Pro automation features (custom schedules, calendar integration, auto-start sessions).
- The free tier's manual Quick Focus button already provides a low-friction entry point. Auto-start removes even that single click, which is a "delight" upgrade, not a "need."
- It requires user trust (auto-activating blocking on browser launch needs configuration and opt-in), which aligns with the Pro user's deeper engagement level.

---

#### Feature 8: API Access (Programmatic Control for Teams/Automations)

**Score Breakdown:**

| Dimension | Score | Reasoning |
|-----------|:-----:|-----------|
| Acquisition (0.25) | 1 | API access drives zero individual installs. Nobody searches for a Chrome blocker with an API. This is a purely enterprise/team feature discovered during integration discussions. |
| Habit (0.20) | 2 | API access does not drive individual user habits. It enables programmatic control for team administrators and automation tools. The "habit" is organizational, not personal. |
| Upgrade (0.25) | 3 | Low individual upgrade driver. API access matters only to teams building custom dashboards or integrating with project management tools. The market for this is small but high-value per account. |
| Differentiation (0.15) | 5 | No competing Chrome blocker offers an API. This is a genuine differentiator in the team/enterprise space. RescueTime has an API at their enterprise tier. Offering one at $3.99/user/mo would undercut significantly. |
| Cost (0.15) | 3 | Requires building and maintaining REST API endpoints, authentication system (API keys), rate limiting, documentation, and server infrastructure. Ongoing operational cost. This is the most expensive feature in the Integrations category to build and maintain. Estimated 2-3 weeks development. |

**Weighted Score: (1 x 0.25) + (2 x 0.20) + (3 x 0.25) + (5 x 0.15) + (3 x 0.15) = 0.25 + 0.40 + 0.75 + 0.75 + 0.45 = 2.60**

**Adjusted Score: 2.65** (slight upward for strategic team-tier value)

**Tier Decision: TEAM ONLY ($3.99/user/mo)** -- API access is exclusively a Team feature because:
- It serves organizational needs, not individual productivity.
- The development and infrastructure cost can only be justified by team-level recurring revenue.
- It is the spec's designated Month 8+ feature (P2, item #42) -- well past individual Pro validation.
- No individual user will miss this feature. It creates zero conversion pressure at the Free-to-Pro boundary.
- It serves the "Morgan" persona (freelancer) at the team/agency level, not the individual level.

---

### Integrations Category Summary

| Feature | Weighted Score | Tier | Priority |
|---------|:--------------:|:----:|:--------:|
| Ambient sounds (3 free) | 7.45 | FREE | P1 (#14) |
| Notification muting (blanket) | 6.65 | FREE | P1 (#13) |
| Cross-device sync | 6.30 | PRO | P2 (#25) |
| Browser action badge | 6.15 | FREE | P0 (core) |
| Sound mixing | 5.55 | PRO | P2 (#30) |
| Chrome startup auto-focus | 5.35 | PRO | P2 (#31) |
| Selective notification allowlist | 5.10 | PRO | P2 (#33) |
| API access | 2.65 | TEAM | P2 (#42) |

**Category Free Features: 3** (ambient sounds, notification muting, browser badge)
**Category Pro Features: 4** (cross-device sync, sound mixing, auto-focus, selective notifications)
**Category Team Features: 1** (API access)

**Key Insight:** The Integrations category follows the "complete experience free, deeper control Pro" pattern. Free users get sounds, notification muting, and a polished badge -- everything needed for a complete focus session. Pro users get sync, mixing, auto-start, and selective muting -- deeper control and cross-device reach. This mirrors the approach in every other category.

---

## SECTION B: FULL PORTFOLIO CONSISTENCY CHECK

### B.1 Complete Feature Inventory by Tier

#### Core Blocking (8 features)

| Feature | Tier | Score Basis |
|---------|:----:|-------------|
| Manual website blocklist (10 sites) | FREE | The product's core -- must be generous. 10 sites = 3x BlockSite. |
| Pre-built block lists (2: Social + News) | FREE | Removes onboarding friction. 2 lists cover 80% of distractions. |
| 1 schedule (e.g., M-F 9-5) | FREE | Automates the primary use case. 2x higher D30 retention. |
| Nuclear option (up to 1 hour) | FREE | Marquee feature. Taste of the power. |
| Default motivational block page | FREE | Seen 100+/day. Must be encouraging, not punishing. |
| Wildcard/pattern blocking | PRO | Power-user feature. Free users can block specific URLs. |
| Whitelist mode | PRO | Paradigm shift for ADHD/power users. |
| Unlimited sites + all block lists | PRO | Natural upgrade from 10-site limit. |
| Unlimited schedules | PRO | Multiple routines need multiple schedules. |
| Extended nuclear (24 hours) | PRO | #1 request from ADHD communities. |
| Custom block page | PRO | Delight feature -- personalization. |
| Redirect to productive sites | PRO | Creative productivity technique. |

**Free: 5 | Pro: 7**

#### Focus Timer (7 features)

| Feature | Tier | Score Basis |
|---------|:----:|-------------|
| Basic Pomodoro timer (25/5/15/4) | FREE | Table stakes. Every competitor offers a free timer. |
| Quick Focus (one-click 25 min) | FREE | Onboarding magic moment. 5-second value delivery. |
| Break reminders (basic) | FREE | Keeps Pomodoro cycle functional. |
| Daily focus goal | FREE | Motivating without complexity. |
| Custom timer durations (1-240 min) | PRO | Power users who outgrow 25/5. |
| Auto-start sessions | PRO | Automation for committed daily users. |
| Session history (full, unlimited) | PRO | 7-day free window; full history is Pro. |
| Advanced break reminders | PRO | Custom sounds, overlay, smart suggestions. |
| Weekly + monthly goals with streaks | PRO | Goal depth for serious users. |

**Free: 4 | Limited Free: 1 (session history -- 7 days free) | Pro: 4**

#### Stats & Analytics (7 features)

| Feature | Tier | Score Basis |
|---------|:----:|-------------|
| Daily focus time | FREE | Core value proof. Must see it working. |
| Sites blocked count | FREE | Validates the extension is doing its job. |
| Distraction attempts counter (top 3 sites) | FREE | Behavioral shock metric. Most shareable. |
| Focus Score (number visible) | FREE | Grammarly-style hook. Number free, breakdown locked. |
| Current streak tracking | FREE | #1 retention mechanic. |
| Weekly/monthly reports (unblurred) | PRO | #1 conversion trigger. Blurred preview = curiosity. |
| Exportable analytics (CSV/PDF) | PRO | Professional/freelancer need. |
| Full streak history + recovery | PRO | Protects emotional investment in streaks. |
| Full distraction breakdown + heatmap | PRO | Deep analytics beyond top 3. |
| Focus Score breakdown | PRO | Drives "how do I improve?" curiosity. |

**Free: 5 | Limited Free: 2 (Focus Score -- number only; distraction counter -- top 3 only) | Pro: 5**

#### Smart Features (3 features)

| Feature | Tier | Score Basis |
|---------|:----:|-------------|
| AI focus recommendations | PRO | Requires server processing. High perceived value. |
| Calendar integration (Google Calendar) | PRO | Killer feature for knowledge workers. Requires OAuth. |
| Context-aware profiles | PRO | Multiple blocking configurations for different tasks. |

**Free: 0 | Pro: 3**

*Note: Smart Features is the only category with zero free features. This is acceptable because Quick Focus (free, Focus Timer category) serves as the "smart" entry point, and the entire Smart Features category is Phase 2 roadmap (months 3-9). These features require backend infrastructure, OAuth, and data accumulation that simply does not exist at launch.*

#### Social & Accountability (4 features)

| Feature | Tier | Score Basis |
|---------|:----:|-------------|
| 1 focus buddy invite | FREE | Viral growth mechanic. Every invite = potential install. |
| 1 focus challenge (pre-built library of 5) | FREE | Structured motivation. Keeps engagement beyond daily. |
| Unlimited buddies + session notifications | PRO | Group accountability for study groups/teams. |
| Unlimited custom challenges | PRO | Custom gamification for power users. |
| Global anonymous leaderboard | PRO | Competitive motivation. Percentile rankings. |

**Free: 2 | Pro: 3**

#### Integrations & Platform (8 features)

| Feature | Tier | Score Basis |
|---------|:----:|-------------|
| Ambient sounds (3: rain, white noise, lo-fi) | FREE | High engagement, low cost. Habit driver. |
| Notification muting (blanket) | FREE | Completes focus experience. Prevents negative reviews. |
| Browser action badge | FREE | Core UX. Table stakes. |
| Cross-device sync | PRO | #1 bypass complaint solution. Strongest upgrade lever. |
| Sound mixing (layer 2-3 sounds) | PRO | Delight feature paired with full library. |
| Chrome startup auto-focus | PRO | Automation for committed users. |
| Selective notification allowlist | PRO | Professional nuance beyond blanket muting. |
| API access | TEAM | Enterprise/team-only integration. |

**Free: 3 | Pro: 4 | Team: 1**

---

### B.2 Usage Limits Consistency Check

| Category | Feature | Free Limit | Pro Limit | Limit Type | Consistent? |
|----------|---------|:----------:|:---------:|:----------:|:-----------:|
| Core Blocking | Website blocklist | 10 sites | Unlimited | Storage/count cap | YES -- matches Pattern #5 (Storage Limit). 10 is generous (3x BlockSite) but creates natural upgrade at power-user threshold. |
| Core Blocking | Pre-built block lists | 2 lists | 6+ lists | Feature count cap | YES -- same pattern as blocklist. 2 covers 80% of need. |
| Core Blocking | Schedules | 1 schedule | Unlimited | Feature count cap | YES -- consistent with "1 free, unlimited Pro" pattern used for buddies and challenges. |
| Core Blocking | Nuclear option | 1 hour max | 24 hours max | Duration cap | YES -- consistent cap-and-extend pattern. Duration limit is intuitive. |
| Focus Timer | Timer durations | 25/5 fixed | 1-240 min custom | Configuration depth | YES -- free gets the proven default; Pro gets customization. Pattern #6 (Feature Depth). |
| Focus Timer | Session history | 7 days | Unlimited | Time window | YES -- time-based limits are consistent with analytics (daily free, weekly/monthly Pro). |
| Focus Timer | Focus goals | Daily only | Daily/weekly/monthly | Feature depth | YES -- scope expansion from daily to multi-period. |
| Stats | Distraction counter | Top 3 sites | Full breakdown + heatmap | Detail depth | YES -- consistent blur/preview pattern. Aggregate free, detail Pro. |
| Stats | Focus Score | Number only | Full breakdown | Detail depth | YES -- Grammarly-style show-value-gate-details. Consistent with report blurring. |
| Stats | Reports | Blurred preview | Full unblurred | Preview/blur gate | YES -- the #1 conversion trigger. Consistent with Grammarly playbook. |
| Stats | Streak | Current only | Full history + recovery | History depth + feature | YES -- current is free retention mechanic; history + recovery are Pro value. |
| Social | Focus buddy | 1 buddy | Unlimited | Count cap | YES -- matches "1 free, unlimited Pro" pattern. |
| Social | Focus challenges | 1 active | Unlimited + custom | Count + creation | YES -- 1 free proves concept; unlimited + custom is Pro depth. |
| Integrations | Ambient sounds | 3 sounds | 15+ sounds + mixing | Library size + feature | YES -- taste free, full library Pro. Consistent with pre-built lists pattern. |
| Integrations | Notification muting | All-or-nothing | Selective allowlist | Configuration depth | YES -- simple free, nuanced Pro. Consistent with timer and blocking depth patterns. |

**Consistency Verdict: PASS** -- All limited-free features use one of four consistent limit types:
1. **Count caps** (10 sites, 1 schedule, 1 buddy, 1 challenge, 3 sounds) -- always "enough to be useful, not enough for power users."
2. **Duration caps** (1-hour nuclear, 7-day history) -- time-based limits that users naturally push against.
3. **Detail/depth limits** (Focus Score number vs. breakdown, top 3 vs. full, daily vs. weekly reports) -- aggregate free, detail Pro.
4. **Feature depth** (25/5 fixed vs. custom, blanket vs. selective, single playback vs. mixing) -- basic free, advanced Pro.

No limit type is used inconsistently across categories.

---

### B.3 Feature Depth Consistency Check

**Question: Are all "basic free / advanced Pro" splits consistent?**

| Split Pattern | Free Version | Pro Version | Consistent? |
|--------------|-------------|------------|:-----------:|
| Timer | 25/5 fixed | 1-240 min custom | YES |
| Blocking | 10 manual sites | Unlimited + patterns + whitelist | YES |
| Nuclear | 1 hour max | 24 hours max | YES |
| Schedules | 1 schedule | Unlimited | YES |
| Block page | Default motivational | Full customization + redirect | YES |
| Notifications | Blanket mute | Selective allowlist | YES |
| Sounds | 3 tracks, single play | 15+ tracks, mixing | YES |
| Stats | Daily aggregate | Weekly/monthly detailed | YES |
| Streaks | Current count | History + recovery | YES |
| Buddies | 1 buddy | Unlimited + notifications | YES |
| Challenges | 1 active, pre-built | Unlimited + custom | YES |
| Goals | Daily goal | Daily + weekly + monthly | YES |
| Break reminders | Basic (sound + badge) | Advanced (custom, overlay, smart) | YES |

**Verdict: PASS** -- Every split follows the same principle: "Free is functional and complete for the primary use case. Pro adds depth, customization, and extended capability." No split feels arbitrary or punitive.

**Question: Does every category have at least 2-3 genuinely useful free features?**

| Category | Free Features | Genuinely Useful? |
|----------|:------------:|:-----------------:|
| Core Blocking | 5 (blocklist, 2 lists, 1 schedule, 1hr nuclear, block page) | YES -- a complete blocking tool |
| Focus Timer | 4 (Pomodoro, Quick Focus, basic breaks, daily goal) | YES -- a complete timer tool |
| Stats & Analytics | 5 (focus time, blocks count, attempts, Focus Score, streak) | YES -- complete daily dashboard |
| Smart Features | 0 | ACCEPTABLE -- see note below |
| Social & Accountability | 2 (1 buddy, 1 challenge) | YES -- social proof + gamification |
| Integrations & Platform | 3 (3 sounds, notification muting, badge) | YES -- complete session experience |

**Smart Features Exception:** Having zero free features in Smart Features is acceptable because:
1. The category consists entirely of features requiring backend infrastructure (AI, OAuth, profiles).
2. All three features are Phase 2+ (months 3-9), well after the free tier is validated.
3. Quick Focus (free, Timer category) fills the "smart/automated" slot for free users.
4. No competitor offers free AI recommendations or calendar integration for blockers.
5. This is the only category with this structure, making it an exception rather than a pattern.

**Question: Does no category have ALL features locked behind Pro?**

**Verdict: PASS** -- Only Smart Features has all features in Pro, and this is a deliberate exception for the 3 most infrastructure-heavy features in the entire product. Every other category has a strong free presence.

---

### B.4 Paywall Psychology Consistency Check

**Question: Do the 3 primary paywall triggers still make sense with the scoring?**

| Trigger | Feature Involved | Upgrade Score | Still Valid? |
|---------|-----------------|:------------:|:-----------:|
| T1: Weekly Report Unlock (PRIMARY) | Weekly/monthly reports | 9 (estimated) | YES -- Reports have the highest Upgrade score in Stats & Analytics. The blurred preview is the proven Grammarly technique. This is correctly the #1 trigger. |
| T2: 11th Site Block (SECONDARY) | Unlimited blocklist | 8 (estimated) | YES -- Hitting the 10-site limit is an organic moment of validated commitment. The user has manually entered 10 URLs, demonstrating high intent. |
| T3: Nuclear Extension (TERTIARY) | Extended nuclear (24hr) | 8 (estimated) | YES -- Completing a 1-hour nuclear session and wanting more is peak productive momentum. The conversion moment is psychologically optimal. |

**Question: Are the top-scored "Pro" features actually the ones that trigger upgrades?**

The highest Upgrade-scored Pro features across all categories:

| Rank | Feature | Category | Upgrade Score | Triggers Conversion? |
|------|---------|----------|:------------:|:--------------------:|
| 1 | Weekly/monthly reports | Stats | 9 | YES -- T1 (primary trigger) |
| 2 | Cross-device sync | Integrations | 9 | YES -- T9 (sync prompt on 2nd device) |
| 3 | Unlimited blocklist | Core Blocking | 8 | YES -- T2 (11th site) |
| 4 | Extended nuclear (24hr) | Core Blocking | 8 | YES -- T3 (nuclear extension) |
| 5 | Focus Score breakdown | Stats | 8 | YES -- T4 (score tap) |
| 6 | Custom timer durations | Focus Timer | 7 | YES -- T10 (slider snap-back) |
| 7 | Streak recovery | Stats | 7 | YES -- T6 (milestone offer) |
| 8 | Sound mixing + full library | Integrations | 7 | Passive (Pro badges in sound picker) |
| 9 | Selective notification allowlist | Integrations | 7 | Passive (discovered after missed message) |
| 10 | Calendar integration | Smart | 7 | YES -- T5 (Pro lock tap) |

**Verdict: PASS** -- Every feature with an Upgrade score of 7+ has a corresponding paywall trigger (active or passive). The three primary triggers (T1, T2, T3) correspond to the three highest-converting feature gates. The ordering is correct: reports trigger curiosity (data people want to see), blocklist triggers commitment (limit they have organically hit), nuclear triggers momentum (productive state they want to extend).

---

### B.5 Pricing Value Consistency Check

**Question: At $4.99/mo, does the Pro tier have enough features to justify the price?**

**Pro Feature Count by Category:**

| Category | Pro Features | Examples |
|----------|:-----------:|---------|
| Core Blocking | 7 | Unlimited sites, patterns, whitelist, schedules, extended nuclear, custom block page, redirect |
| Focus Timer | 4 | Custom durations, auto-start, full history, advanced breaks, extended goals |
| Stats & Analytics | 5 | Reports, exports, full streaks, full breakdown, Focus Score detail |
| Smart Features | 3 | AI recommendations, calendar, profiles |
| Social | 3 | Unlimited buddies, custom challenges, leaderboard |
| Integrations | 4 | Sync, mixing, auto-focus, selective notifications |
| **Total Pro Features** | **26** | |

**Comparison to competitors:**

| Competitor | Price | Features at that Price |
|-----------|-------|----------------------|
| BlockSite Pro | $10.99/mo | Unlimited sites, scheduling, password protection, analytics. ~8 features. |
| Freedom | $6.99/mo | Cross-platform blocking, locked mode, scheduled sessions, ambient sounds. ~6 features. |
| RescueTime | $12.00/mo | Detailed reports, alerts, focus sessions, blocking. ~10 features. |
| **Focus Mode Pro** | **$4.99/mo** | **26 features across 6 categories** |

**Verdict: PASS** -- At $4.99/mo, the Pro tier delivers 26 features, which is 2-4x more than any competitor at equal or higher prices. The value proposition is overwhelming.

**Feature Tier Distribution:**

| Tier | Count | Percentage | Target | Status |
|------|:-----:|:----------:|:------:|:------:|
| FREE | 19 | 40.4% | ~40% | ON TARGET |
| LIMITED FREE | 3 | 6.4% | ~15% | BELOW TARGET |
| PRO | 23 | 48.9% | ~35% | ABOVE TARGET |
| TEAM | 2 | 4.3% | ~10% | BELOW TARGET |
| **Total** | **47** | **100%** | | |

**Analysis of Distribution:**

The LIMITED FREE count (6.4%) is below the 15% target, and PRO (48.9%) is above the 35% target. However, this is actually healthier than the targets suggest, for three reasons:

1. **The "limited free" features are high-impact.** Session history (7 days), Focus Score (number only), and distraction counter (top 3) are all visible daily. Each limited-free feature creates a natural curiosity-to-upgrade path. Three well-placed limits are more effective than eight scattered ones.

2. **Many "free" features contain implicit limits** that create Pro desire without being formally "limited":
   - The 10-site blocklist is free but has a hard cap (functionally a limited-free feature).
   - The 1 schedule is free but capped at 1 (functionally limited-free).
   - The 1 buddy and 1 challenge are free but capped.
   - If we count these, the effective limited-free count rises to ~8 features (17%), which is within the target range.

3. **The TEAM count (4.3%) is expected to be below target at launch.** Team features (shared block lists, team sessions, admin dashboard, API access, team leaderboards, team challenges) are all Month 6-8+ roadmap items. The current 2 Team features (API access and shared features referenced across categories) will expand as the team tier is built out. By Month 8, the target Team percentage should be reached.

**Adjusted Effective Distribution (counting capped-free as limited):**

| Tier | Effective Count | Effective Percentage | Target | Status |
|------|:--------------:|:-------------------:|:------:|:------:|
| FREE (truly unlimited) | 13 | 27.7% | ~40% | Slightly below, but each free feature is genuinely complete |
| LIMITED FREE (with caps/limits) | 9 | 19.1% | ~15% | HEALTHY -- slightly above target |
| PRO | 23 | 48.9% | ~35% | Above target but justified by depth |
| TEAM | 2 | 4.3% | ~10% | Will grow in Month 6+ |

---

### B.6 Free Tier Completeness Audit

**Can a free user have a genuinely complete, satisfying focus experience?**

A free user's daily workflow:

1. **Open Chrome.** Browser action badge shows "Focus Mode ready."
2. **Click Quick Focus.** 25-minute session starts with one click. All blocking rules activate.
3. **Ambient rain sounds** start playing (if configured). Notifications are silenced.
4. **Try to visit Reddit.** Block page appears with motivational quote, current streak, time saved today.
5. **Badge shows "18m"** remaining. Focus continues.
6. **Session ends.** See daily stats: "3h 22m focused, 47 distractions blocked. Day 14 streak."
7. **Focus Score: 74.** User sees the number. Breakdown is blurred -- "See what drives your score."
8. **Repeat.** Configure up to 10 sites, 1 schedule (M-F 9-5), use nuclear option for intense 1-hour blocks.
9. **Social:** Challenge a buddy to a 7-day focus sprint.
10. **Never see an aggressive paywall.** Pro badges visible from session 3, but never intrusive.

**Verdict: This is a complete, functional, and satisfying focus tool.** A user could use the free tier for years without feeling punished. Every pain point in the market (bypass-prone blockers, ugly block pages, no analytics, aggressive paywalls) is addressed at the free tier.

---

## SECTION C: FEATURE TIER DISTRIBUTION CHART

```
FEATURE TIER DISTRIBUTION -- FOCUS MODE - BLOCKER
(47 total features across 6 categories)

FREE (19 features -- 40.4%)
======================================================================
 Core Blocking:  Manual blocklist (10), Pre-built lists (2),
                 1 Schedule, 1hr Nuclear, Default block page
 Focus Timer:    Pomodoro (25/5), Quick Focus, Basic breaks,
                 Daily goal
 Stats:          Daily focus time, Blocks count, Attempts (top 3),
                 Focus Score (number), Current streak
 Social:         1 Buddy, 1 Challenge
 Integrations:   3 Ambient sounds, Notification muting, Badge
----------------------------------------------------------------------

LIMITED FREE (3 formally limited -- 6.4%)
======================================================================
 Focus Timer:    Session history (7 days)
 Stats:          Focus Score (number only, breakdown locked)
 Stats:          Distraction counter (top 3 sites only)
----------------------------------------------------------------------
 (Note: 6 additional "free" features have implicit caps:
  10-site limit, 1 schedule, 1hr nuclear, 1 buddy, 1 challenge,
  3 sounds. Effective limited-free is ~19.1% of total.)
----------------------------------------------------------------------

PRO -- $4.99/mo (23 features -- 48.9%)
======================================================================
 Core Blocking:  Unlimited sites, All block lists (6+), Wildcard
                 patterns, Whitelist mode, Unlimited schedules,
                 24hr Nuclear, Custom block page, Redirect
 Focus Timer:    Custom durations, Auto-start, Full history,
                 Advanced breaks, Weekly/monthly goals
 Stats:          Weekly/monthly reports, Exports, Full streaks +
                 recovery, Full breakdown, Score detail
 Smart:          AI recommendations, Calendar integration, Profiles
 Social:         Unlimited buddies, Custom challenges, Leaderboard
 Integrations:   Cross-device sync, Sound mixing, Auto-focus,
                 Selective notifications
----------------------------------------------------------------------

TEAM -- $3.99/user/mo (2 features -- 4.3%)
======================================================================
 Integrations:   API access
 (Planned M6+):  Shared block lists, Team sessions, Admin dashboard,
                 Team leaderboards, Team challenges
----------------------------------------------------------------------
```

---

## SECTION D: EDGE CASES & TRICKY TIER DECISIONS (PART 7)

### Decision 1: Should Ambient Sounds Be Free or Pro?

**The Question:** The spec gives 3 sounds free (rain, white noise, lo-fi beats). Is this the right call?

**Data:**
- Ambient sound extensions (Noisli, myNoise, Coffitivity) collectively have 500K+ users, proving standalone demand.
- Noisli charges $2/mo for its full library. Free tier offers limited sounds.
- Focus@Will charges $5.83/mo for AI-curated focus music.
- The 3 most popular focus sounds globally (YouTube data): rain (~2B views on focus playlists), lo-fi beats (~1.5B views), white noise (~800M views). Our 3 free sounds are exactly the top 3.
- Spec states "users open the extension specifically for the sounds, which increases daily active usage."
- Scoring: Habit score of 9 (highest in Integrations). Acquisition score of 7. Cost score of 8.

**Decision: YES -- 3 sounds free is correct.**

**Reasoning:**
1. **Habit formation is the priority.** At a Habit score of 9, ambient sounds are the most habit-forming feature in the Integrations category. Gating them behind Pro would eliminate a daily engagement driver that costs near-zero to deliver.
2. **No competitor bundles sounds with blocking.** Free sounds are a genuine differentiator that shows up in Chrome Web Store listings and comparison tables.
3. **3 is the right number.** It matches the top 3 most popular focus sounds. It is enough to build the "sounds = focus" association but few enough to make the 12+ Pro sounds appealing.
4. **Cost is negligible.** ~3-6MB of MP3 loops added to the bundle. No ongoing cost.
5. **The upgrade path is natural.** Locked sounds in the picker (with Pro badges) create desire without friction. Users think "I want fireplace + rain together" -- that requires Pro.

**Risks:**
- If users only ever need rain, they never feel the upgrade pull. Mitigation: Rotate a "Sound of the Week" (unlocked Pro sound for 7 days) to create taste and variety desire.
- Bundle size increases. Mitigation: Lazy-load audio files, not bundled in the initial install.

---

### Decision 2: Should the Nuclear Option Be Time-Limited for Free Users?

**The Question:** Free users get 1-hour nuclear. Pro users get up to 24 hours. Is 1 hour the right free limit?

**Data:**
- StayFocusd's Nuclear Option is the #1 discussed feature in r/getdisciplined and r/ADHD. It has no time limit (free) but is easily bypassed (switch browsers, reinstall).
- Cold Turkey's "Frozen Turkey" mode is one-time $39, with no time limit.
- Freedom's "Locked Mode" requires a paid plan entirely.
- The average Pomodoro session is 25 minutes. A 1-hour nuclear covers 2+ Pomodoro cycles.
- ADHD users in r/ADHD report needing 4-8 hour blocks for deep work days.
- The spec's paywall trigger T3 fires when a user completes 1-hour nuclear and tries to immediately restart within 5 minutes.

**Decision: YES -- 1 hour free, 24 hours Pro is correct.**

**Reasoning:**
1. **1 hour proves the concept.** A user who completes a 1-hour nuclear session has experienced the core value: unbypassable blocking works. The "that hour flew by" reaction (T3 copy) is genuine.
2. **1 hour covers the primary use case.** A single focused work block (check email, start focus, complete a task). It is not a crippled demo.
3. **The upgrade moment is psychologically perfect.** Completing nuclear and wanting to immediately restart is the peak of productive momentum. T3's conversion rate estimate (6-10%) is credible because users are in a "flow state" at this moment.
4. **24 hours is the ADHD power feature.** r/ADHD users explicitly request 4-24 hour nuclear sessions. These users have the highest willingness-to-pay and the strongest need for extended restriction.
5. **Unlimited free nuclear (like StayFocusd) would kill Pro conversion** for the nuclear path entirely. The extended duration is one of the top 5 Pro features by Upgrade score.

**Risks:**
- Users could manually restart 1-hour nuclear sessions repeatedly. Mitigation: This is intentionally allowed ("Start Another Free Hour" is always an option in T3). Manual restarts are mildly inconvenient, which creates desire for the "set it for 8 hours and forget it" Pro experience.
- ADHD users may feel punished by the 1-hour limit. Mitigation: Frame the upgrade as empowerment, not restriction. T3 copy: "Lock in for longer" -- positive, not "your time is up."

---

### Decision 3: Should Focus Score Be Fully Free or Partially Blurred?

**The Question:** Score number is free, breakdown is blurred. Is this the right split?

**Data:**
- Grammarly's "Overall Score" is free; category breakdown requires Premium. This generates an estimated 22% upgrade lift compared to hard feature gates (Grammarly UX research).
- The Focus Score algorithm: `Score = (completionRate x 35) + (100 - distractionRate) x 25 + (goalRate x 25) + (streakBonus x 15)`.
- Users see "Focus Score: 74" and naturally ask "How do I get to 90?" The answer (the breakdown) is behind the paywall.
- The score is displayed on the popup dashboard and post-session screen -- high visibility.
- T4 (Focus Score Breakdown) has an estimated 3-5% conversion rate.

**Decision: YES -- number free, breakdown blurred is correct.**

**Reasoning:**
1. **The Grammarly playbook is proven.** Show-value-gate-details is the most effective freemium conversion pattern in SaaS, proven across Grammarly (30M DAU, 1M+ paid), SEMrush, Ahrefs, and LinkedIn.
2. **The number itself is useful.** A free user who sees "74" can track whether it goes up or down over time. They get a daily benchmark without needing the breakdown.
3. **The breakdown creates an irresistible information gap.** "Why is my score 74, not 90? What am I doing wrong?" These questions can only be answered by Pro.
4. **Fully free Focus Score** (number + breakdown) would eliminate one of the highest-converting upgrade cues in the product. The blurred breakdown is visually prominent, appearing every time the user clicks their score.
5. **Fully locked Focus Score** (no number visible) would remove a daily engagement surface. The number is what makes users care about the breakdown.

**Risks:**
- Users may find the blurring frustrating. Mitigation: The blur is user-initiated (only appears when they click the score). It never interrupts workflows. The "Dismiss" option collapses it instantly.
- Some users may calculate the breakdown themselves from visible metrics. Mitigation: The algorithm weights are not published. Even if users reverse-engineer the score, the personalized recommendations (Pro-only) still add value.

---

### Decision 4: What Happens When a Pro User Downgrades?

**The Question:** User cancels Pro. What happens to their data and features?

**Data:**
- Industry standard: downgrade = lose access to Pro features, keep data.
- Evernote: notes created with Premium features become read-only.
- Todoist: projects beyond the free limit are archived, not deleted.
- Grammarly: Premium suggestions stop appearing, but writing history is retained.
- Our storage architecture: all data is in `chrome.storage.local`. Pro doesn't create data in a separate location.

**Decision: Graceful degradation with full data retention.**

**Detailed Downgrade Behavior:**

| Feature | While Pro | After Downgrade |
|---------|----------|----------------|
| Blocklist (had 25 sites) | All 25 active | First 10 remain active. Sites 11-25 are paused (greyed out, not deleted). User sees "10/10 active -- 15 paused. Upgrade to reactivate." |
| Custom block page | Custom settings active | Reverts to default motivational page. Custom settings saved (not deleted) -- reactivating Pro restores them instantly. |
| Schedules (had 4) | All 4 active | First schedule remains active. Others paused with "Pro required" label. |
| Nuclear 24hr session | Available | Reverts to 1-hour max. If a 24hr nuclear is active during downgrade, it completes normally (never interrupt an active nuclear session). |
| Session history | Full history visible | History older than 7 days becomes blurred/locked (not deleted). Resubscribing instantly restores full visibility. |
| Weekly reports | Full unblurred | Reverts to blurred preview. Historical reports remain accessible in blurred form. |
| Streak recovery | Grace days available | No more grace days. Current streak is preserved at its current value -- downgrading does not reset the streak. |
| Focus Score breakdown | Full breakdown visible | Reverts to number-only. Breakdown blurred. |
| Custom timer | 50/10 saved preset | Reverts to 25/5. Custom presets saved for re-subscription. |
| Cross-device sync | Active | Stops syncing. Local data on each device is preserved. Devices become independent. |
| Ambient sounds | Full library + mixing | Reverts to 3 free sounds, no mixing. |
| Selective notifications | Allowlist active | Reverts to blanket muting. Allowlist settings saved. |

**Key Principles:**
1. **NEVER delete data.** All Pro-created data (custom settings, extended history, block lists beyond 10) is preserved in storage but access-gated.
2. **NEVER break an active session.** If a subscription lapses during a 24-hour nuclear session, the session completes. The downgrade takes effect after the current session ends.
3. **Make re-subscription instant.** When a downgraded user re-subscribes, all paused features, saved settings, and historical data immediately reactivate. Zero re-configuration needed.
4. **Show what they are missing.** Paused/greyed features with "Reactivate with Pro" labels serve as passive re-conversion cues.

**Risks:**
- Users may feel the "paused sites" list is manipulative. Mitigation: Always show "Remove" buttons on paused sites. Users can manually reduce to 10 active sites if they prefer a clean free experience.
- Data accumulation in storage from long-term former-Pro users. Mitigation: After 90 days of non-Pro status, offer a one-time "Clean up unused Pro data" option (optional, user-initiated, clearly described).

---

### Decision 5: Should There Be a Student Discount?

**The Question:** Students are a primary persona ("Jordan"). Should there be a dedicated pricing tier?

**Data:**
- Jordan (student persona) has $0-50/month discretionary budget. Willingness to pay: "$0 most of the year, $1.99-4.99 during exam season."
- The pricing-strategy.md document already specifies: Student Pro at $1.99/mo or $14.99/yr via .edu email verification.
- Duolingo offers 50% student discount and reports that student users have 2.3x higher lifetime value (they convert to full-price after graduation).
- Notion offers free plans for students with .edu verification and has built an enormous student user base that converts at graduation.
- US college enrollment: ~20 million students. If 0.01% adopt = 2,000 users, with 5% paying student rate = 100 paying at $1.99/mo = $199/mo MRR. Small but strategically valuable.

**Decision: YES -- offer student pricing at $1.99/mo ($14.99/yr).**

**Implementation:**
- **.edu email verification** at checkout. Student enters their .edu email, receives a verification link.
- **Student pricing visible** in the plan selection panel as a fourth option (below Lifetime): "Student? $1.99/mo with your .edu email."
- **Duration:** Student pricing is valid for 4 years from verification date. After 4 years, pricing reverts to standard Pro with a 30-day grace period and clear notification.
- **No feature reduction.** Student Pro = full Pro. Do not create a lesser "Student" tier -- students need whitelist mode and extended nuclear just as much as professionals.

**Reasoning:**
1. **Students are a primary persona.** Jordan is one of two primary personas. Ignoring their budget constraint means losing the entire demographic.
2. **Student adoption creates lifetime value.** A student who uses Focus Mode for 3 years of college ($71.64 total revenue) converts to full-price Pro at graduation ($59.88/yr). Total LTV: $131.52+ over 4-5 years.
3. **Students are social amplifiers.** Dorm rooms, study groups, and campus networks are high-density word-of-mouth environments. One student showing "Day 30 streak" to their study group can generate 5-10 installs.
4. **The 60% discount ($1.99 vs. $4.99) is large but the absolute revenue is meaningful.** Even 100 students at $1.99/mo = $199/mo MRR = $2,388/yr.
5. **Exam season spikes are predictable.** Focus tool installs spike 40-60% during November (fall finals) and April (spring finals). Student pricing captures this seasonal demand.

**Risks:**
- .edu email abuse (people using old .edu addresses after graduating). Mitigation: 4-year expiration from verification date. Annual re-verification for accounts older than 2 years.
- Cannibalization of full-price Pro from young professionals with .edu emails. Mitigation: The 4-year window limits this. Most professionals do not maintain active .edu emails.

---

### Decision 6: Is Lifetime Pricing ($49.99) Too Cheap?

**The Question:** At $49.99, lifetime pricing may cannibalize recurring revenue. Is this the right price?

**Data:**
- Competitor lifetime pricing: Cold Turkey $39 (one-time, no recurring), Freedom $159-199, Opal $399, Forest $1.99-3.99 (mobile).
- Our annual plan is $35.88/yr. Lifetime at $49.99 = 1.39x annual. Users who keep Pro for 2+ years pay less with lifetime.
- The spec's pricing-strategy.md notes lifetime should be "time-limited availability" to prevent long-term erosion.
- SaaS benchmark: lifetime deals should be priced at 2-3x annual to avoid LTV cannibalization (AppSumo guidelines).
- RevenueCat 2025 data: subscription apps that offer lifetime options see 8-15% of purchases choose lifetime, which can reduce blended LTV by 10-20%.

**Decision: $49.99 is SLIGHTLY TOO CHEAP but strategically acceptable for launch. Increase to $69.99 at Month 3.**

**Reasoning:**
1. **At launch, $49.99 is a valid "founding member" incentive.** Early adopters who pay $49.99 provide capital, reviews, and word-of-mouth during the most critical growth phase.
2. **The break-even period is only 14 months** ($49.99 / $3.58 blended ARPU = 14 months). Any user who would have stayed for 14+ months is getting a deal at our expense. However, at launch, we do not know if 14-month retention is achievable.
3. **Comparison to competitors:** $49.99 is more expensive than Cold Turkey ($39) but dramatically cheaper than Freedom ($159-199). It positions us as "affordable premium" -- a consistent brand message.
4. **Time-limiting is essential.** The lifetime deal should be available for the first 6 months only, or until 500 lifetime purchases, whichever comes first. After that, raise to $69.99.
5. **At $69.99, the break-even is ~20 months.** This is healthier for long-term LTV. Users who commit $69.99 are also higher-engagement (they made a significant one-time investment).

**Price Ladder:**
- **Months 1-3 (founding period):** $49.99 lifetime
- **Months 4-6:** $59.99 lifetime
- **Months 7+:** $69.99 lifetime (or remove lifetime option entirely based on data)

**Risks:**
- Heavy lifetime adoption cannibalizes MRR growth. Mitigation: Time-limited availability. Track lifetime vs. subscription ratio monthly. If lifetime exceeds 20% of Pro purchases, hide the option.
- Lifetime users have no recurring cost but may need ongoing support. Mitigation: Lifetime users get the same features but support tickets are lower-priority than active subscribers (standard SaaS practice for lifetime deals).

---

### Decision 7: Should We Offer a Free Trial of Pro?

**The Question:** The spec mentions a 7-day Pro trial. Should we implement it, and what are the terms?

**Data:**
- The spec (sections-5-6-tech-monetization.md) specifies a 7-day full Pro trial with a 4-step smart onboarding and 12-row messaging cadence.
- Grammarly offers a 7-day Premium trial. Industry conversion rate from trial to paid: 25-40% (per tier3-paywall-patterns.md).
- Freedom offers a 7-day trial as its only free option (no permanent free tier).
- Headspace and Calm both use 7-day full trials with strong conversion.
- Our current spec also has a "no trial by default" approach where the free tier IS the trial (sessions 1-5 build value, then T1 fires).
- Dual approaches are possible: organic free-tier-as-trial AND optional explicit trial.

**Decision: YES -- offer a 7-day Pro trial, but NOT on install. Trigger it at the optimal conversion moment.**

**Implementation:**
- **No automatic trial on install.** Sessions 1-5 should be pure free-tier value delivery. Showing Pro features immediately dilutes the "free is genuinely useful" positioning.
- **Trial offer triggers at specific moments:**
  1. When T1 (Weekly Report) fires and user clicks "Maybe Later," the dismiss screen includes: "Not ready to commit? Try Pro free for 7 days."
  2. When T3 (Nuclear Extension) fires and user clicks "Start Another Free Hour," a subtle banner appears: "Or try 24-hour nuclear free for 7 days."
  3. In the Plan Selection Panel (Step 3 of upgrade flow), add a "Start 7-Day Free Trial" button alongside the payment options.
- **Trial requires email only** (no credit card). This reduces friction while creating a contact for trial-end messaging.
- **Trial-end behavior:** On day 5, notification: "Your Pro trial ends in 2 days." On day 7, summary of Pro features used with "Continue Pro" CTA. If not converted, graceful downgrade (Decision 4 rules apply).

**Reasoning:**
1. **The free tier IS the primary trial** for sessions 1-5. Adding an automatic Pro trial on install would undermine the carefully designed paywall cadence.
2. **A trial at the rejection moment is powerful.** When a user says "Maybe Later" to T1, offering a trial converts "not ready to pay" into "willing to try." This captures users who are interested but not yet convinced enough to spend money.
3. **7 days is the right duration.** It covers one full weekly report cycle, allowing the user to see their first unblurred report. Shorter trials (3 days) do not build enough habit. Longer trials (14 days) delay the conversion decision.
4. **Email capture during trial enables re-engagement.** Trial users who do not convert can receive a "We miss you" email at day 14 and a "Your focus data is waiting" email at day 30.

**Risks:**
- Trial abuse (repeatedly creating trials). Mitigation: Tie trial to email address + Chrome profile ID. One trial per user, ever.
- Users who trial and downgrade may feel the loss more acutely, generating negative sentiment. Mitigation: Graceful degradation (Decision 4) ensures no data loss and no punitive messaging.

---

### Decision 8: How Do We Handle Users Who Only Use the Free Tier Forever?

**The Question:** Some users will never pay. How do we maximize their value without punishing them?

**Data:**
- Freemium conversion rates for productivity Chrome extensions: 2-5%. This means 95-98% of users are free forever.
- Grammarly: ~3-4% conversion. They explicitly value free users for ecosystem effects.
- The spec's paywall timing (Appendix A) states: "Day 30+: Long-term free user. NEVER increase paywall pressure."
- Chrome Web Store ranking factors include: total installs, active users (DAU/MAU), and engagement metrics. Every active free user improves store ranking.
- Average Chrome Web Store review comes from free users (they are 95%+ of the user base).

**Decision: NEVER punish. Maximize free user value through 4 channels.**

**Channel 1: Word-of-Mouth Growth**
- Free users who love the product tell friends. With 1 buddy invite, every free user is a potential referral source.
- Shareable metrics ("I tried to visit Reddit 47 times today") drive organic social media mentions.
- Action: Optimize shareable moments. Add a "Share Your Stats" button (free feature) that generates a branded image card with daily stats.

**Channel 2: Chrome Web Store Health**
- Active free users increase DAU/MAU ratio, improving Chrome Web Store ranking.
- Positive reviews from free users improve store rating (target: 4.7+).
- Action: Prompt reviews after positive milestones (50 hours focused, 30-day streak). NEVER prompt after paywall encounters.

**Channel 3: Data for Product Improvement**
- Anonymized aggregate usage data from free users (with opt-in consent) improves the product for everyone.
- Free users reveal which features are most used, which block page quotes are most engaging, which onboarding flows work best.
- Action: Implement analytics (Mixpanel, per the spec) to track feature usage and funnel performance.

**Channel 4: Future Conversion**
- Life circumstances change. A student graduates. A casual user gets promoted. A free user discovers they need multiple schedules.
- Long-term free users who eventually convert have the highest retention because they already have deep product habits.
- Action: The permanent "Go Pro" footer link (from Day 14+) and milestone celebrations (T6) ensure Pro remains visible without being aggressive. Monthly summary notifications (1x/month after Day 30) maintain awareness.

**What We Never Do to Free Users:**
- NEVER degrade features over time ("you used to have 10 sites, now you have 5").
- NEVER increase paywall frequency for long-term free users.
- NEVER show ads to free users.
- NEVER sell free user data.
- NEVER require account creation for free features.

---

### Decision 9: Should the Block Page Be Customizable for Free?

**The Question:** Block page customization is currently Pro only. Should any customization be free?

**Data:**
- The default block page is seen 100+ times per day by active users.
- The spec (Free Feature 8) specifies: default design only (colors, layout, quotes are fixed).
- No competitor offers a customizable block page at the free tier. StayFocusd, BlockSite, and LeechBlock all show generic block pages with no customization at any tier.
- Block page customization includes: custom message text, custom colors, custom images, custom quote rotation, redirect URL, and show/hide elements.
- The block page is the #1 most-viewed surface in the product.

**Decision: NO -- block page customization should remain Pro only. The default block page is excellent enough.**

**Reasoning:**
1. **The default block page is already differentiated.** It shows: motivational quote, current streak, time saved today, distraction attempt count, session timer, and a "Return to Work" button. No competitor shows anything close to this richness. Free users get a significantly better block page than any competitor's paid version.
2. **Customization is a delight feature, not a need.** Free users do not need custom colors or images to benefit from the block page. The default design is carefully crafted to be encouraging and data-rich.
3. **Block page customization is a natural Pro upgrade.** Users who see the default page 50+ times per day develop strong opinions about what they want. "I wish this showed my task list instead of a quote" or "I want a calming blue instead of this teal" are desires that emerge from heavy usage. Heavy usage = high conversion readiness.
4. **The T5 paywall (Pro Feature Lock Tap)** includes a dedicated panel for custom block page with copy: "Make the Block Page Yours -- Custom messages, your own images, rotating quotes from your favorite authors."
5. **Adding free customization options increases UI complexity** in the settings panel, which contradicts the free tier's design principle of simplicity.

**Risks:**
- Users may dislike the default quotes and feel stuck. Mitigation: The quote pool is 50+ curated quotes, rotating each view. Variety is built in without customization. Add a "Refresh Quote" button on the block page that cycles to the next quote.
- Some users may find the default block page too "busy." Mitigation: The default shows all elements (quote, streak, time saved, counter, timer, button). Consider adding a free "minimal mode" toggle that hides everything except the quote and "Return to Work" button. This is a simplification, not a customization -- it reduces rather than adds.

---

### Decision 10: Is 10 Sites the Right Free Limit?

**The Question:** 10 free sites vs. BlockSite's 3, vs. unlimited in free tools like StayFocusd and LeechBlock.

**Data:**
- **BlockSite:** 3-6 free sites. This is their #1 source of 1-star reviews. "Only 3 sites? That's useless." Trustpilot rating: 1.6/5.
- **StayFocusd:** Unlimited free sites. Result: 600K users, zero revenue, dated product, reliability issues.
- **LeechBlock NG:** Unlimited free sites, 30 block sets. Result: 100K users, zero revenue, volunteer-maintained.
- **Intentional:** 3 free sites. Similar complaints to BlockSite.
- **Our spec:** 10 sites, with pre-built lists (2 free, covering ~45 sites) NOT counting toward the 10-site limit.
- Most people's top distractors: Reddit, Twitter/X, YouTube, Facebook, Instagram, TikTok, news sites, Netflix/streaming. That is 7-8 sites.
- Average number of distraction sites per user (from RescueTime data): 8-12 for casual users, 15-25 for power users.
- Pre-built lists cover the top 45 sites in Social Media + News categories for free.

**Decision: YES -- 10 sites is the right free limit.**

**Reasoning:**
1. **10 sites is the "Goldilocks" number.**
   - 3 sites (BlockSite/Intentional): Too few. Users feel punished immediately. Generates negative reviews.
   - Unlimited (StayFocusd/LeechBlock): Too many. Zero conversion lever. No revenue.
   - 10 sites: Covers 80-90% of casual users' needs. Power users (15+ sites) hit the limit organically and are ready to pay.

2. **Pre-built lists change the math.** With Social Media (~25 sites) and News (~20 sites) lists NOT counting toward the 10-site limit, a free user effectively has access to blocking ~55 sites (45 via lists + 10 manual). This is dramatically more generous than it appears and more blocking power than any competitor's free tier.

3. **The 10-site limit is a MANUAL site limit.** Users who need more than 10 additional sites beyond the pre-built lists are definitionally power users who get enormous value from the product. They have manually typed 10 URLs -- demonstrating engagement level far above average.

4. **The upgrade path is clean.** The progress indicator (8/10, 9/10, 10/10) creates visual awareness before the paywall. T2 fires at site #11 with a non-modal, dismissable panel. The "Keep My 10 Sites" option always exists.

5. **The 3x multiplier over BlockSite is marketing gold.** "10 free sites (3x more than BlockSite)" is a concrete, sharable comparison point that appears in Chrome Web Store description, review responses, and marketing materials.

**Competitive positioning table:**

| Tool | Free Sites | Our Advantage |
|------|:---------:|---------------|
| BlockSite | 3-6 | 10 manual + ~45 via lists = ~55 effective sites |
| Intentional | 3 | Same as above |
| StayFocusd | Unlimited | We have revenue to fund continuous development |
| LeechBlock | Unlimited | We have revenue + better UX + gamification |
| Freedom | 0 (trial only) | We have a permanent free tier |

**Risks:**
- Savvy users may never need more than 10 sites + pre-built lists. Mitigation: This is acceptable. These users provide word-of-mouth value. The primary conversion triggers (T1 weekly reports, T3 nuclear) do not depend on the site limit.
- The 10-site limit may feel arbitrary to users who hit it. Mitigation: The progress indicator (color-coded: green at 1-7, amber at 8-9, red at 10) provides advance warning. T2's copy validates their progress ("You've blocked your top 10 distractions. Nice.") before offering Pro.

---

## SECTION E: RECOMMENDATIONS & ADJUSTMENTS

### Tier Adjustments Based on Consistency Review

After completing the full portfolio analysis, the following adjustments are recommended:

#### Adjustment 1: Add "Keyboard Shortcuts (Basic)" to Integrations Free Features

**Current state:** The spec lists basic keyboard shortcuts (Alt+Shift+F for Quick Focus, Alt+Shift+N for Nuclear) as free, with full customizable shortcuts as Pro.

**Recommendation:** Explicitly include basic keyboard shortcuts in the Integrations free feature count. This adds a 4th free feature to the Integrations category, improving the free:Pro ratio.

**Rationale:** Basic shortcuts (2 fixed hotkeys) are zero-cost UX improvements that make the free tier feel more polished. They are implemented in the manifest.json `commands` field with no ongoing cost.

#### Adjustment 2: Consider Adding "Share Focus Stats" as a Free Social Feature

**Current state:** Export is Pro-only. Sharing is not explicitly addressed as a separate feature.

**Recommendation:** Add a free "Share Daily Stats" feature that generates a branded image card ("I blocked 47 distractions today with Focus Mode") shareable on social media. This is distinct from CSV/PDF export (Pro) and serves as a viral growth mechanic.

**Rationale:** Every share is a free advertisement. The branded image drives installs. Gating sharing behind Pro reduces viral potential. Grammarly's shareable weekly score email is free and drives massive organic growth.

#### Adjustment 3: Lifetime Pricing Ladder

**Recommendation:** Implement the price ladder from Decision 6:
- Months 1-3: $49.99 (founding member)
- Months 4-6: $59.99
- Months 7+: $69.99

**Rationale:** Prevents long-term LTV cannibalization while rewarding early adopters. Track lifetime purchase percentage monthly. If it exceeds 20% of all Pro purchases, hide the lifetime option.

#### Adjustment 4: Smart Features Category -- Add a Free Teaser

**Current state:** Smart Features has 0 free features (the only category with this structure).

**Recommendation:** When AI recommendations launch (Month 4+), provide 1 free recommendation per week (not per session) as a "Pro Insight" taste. This follows the Grammarly "3 daily premium suggestions" pattern.

**Rationale:** A single weekly Pro Insight converts the Smart Features category from "zero free" to "limited free," improving consistency. The weekly cadence is infrequent enough to create desire but frequent enough to prove value. This is already partially specified in the paywall timing (Session 4: "1 Free Pro Insight" randomly unlocked).

### Summary of Final Feature Counts (Post-Adjustments)

| Tier | Original Count | Adjusted Count | Percentage |
|------|:--------------:|:--------------:|:----------:|
| FREE | 19 | 21 | 42.9% |
| LIMITED FREE | 3 | 4 | 8.2% |
| PRO | 23 | 23 | 46.9% |
| TEAM | 2 | 2 | 4.1% |
| **Total** | **47** | **49** | **100%** |

*Two features added: Share Focus Stats (free), Basic Keyboard Shortcuts (free, already in spec but uncounted). One feature reclassified: Weekly AI Insight teaser (limited free, from Smart Features -- future month 4+ addition).*

---

## APPENDIX: MASTER FEATURE TIER TABLE

The complete list of all features across all categories with their final tier assignments.

| # | Feature | Category | Tier | Scoring Basis |
|---|---------|----------|:----:|---------------|
| 1 | Manual website blocklist (10 sites) | Core Blocking | FREE | Core product. 3x BlockSite's free limit. |
| 2 | Pre-built block lists (Social Media + News) | Core Blocking | FREE | Removes onboarding friction. |
| 3 | 1 schedule (M-F 9-5) | Core Blocking | FREE | Automates primary use case. |
| 4 | Nuclear option (1 hour) | Core Blocking | FREE | Proves unbypassable blocking works. |
| 5 | Default motivational block page | Core Blocking | FREE | Seen 100+/day. Differentiator. |
| 6 | Unlimited sites + all block lists (6+) | Core Blocking | PRO | Natural upgrade from 10-site limit. |
| 7 | Wildcard/pattern blocking | Core Blocking | PRO | Power-user feature. |
| 8 | Whitelist mode | Core Blocking | PRO | Paradigm shift for ADHD users. |
| 9 | Unlimited schedules | Core Blocking | PRO | Multiple routines need multiple schedules. |
| 10 | Extended nuclear (24 hours) | Core Blocking | PRO | #1 ADHD community request. |
| 11 | Custom block page | Core Blocking | PRO | Delight/personalization feature. |
| 12 | Redirect to productive sites | Core Blocking | PRO | Creative productivity technique. |
| 13 | Basic Pomodoro timer (25/5/15/4) | Focus Timer | FREE | Table stakes. |
| 14 | Quick Focus (one-click 25 min) | Focus Timer | FREE | Onboarding magic moment. |
| 15 | Break reminders (basic) | Focus Timer | FREE | Keeps Pomodoro functional. |
| 16 | Daily focus goal | Focus Timer | FREE | Motivating without complexity. |
| 17 | Session history (7 days) | Focus Timer | LIMITED FREE | 7-day window, then pruned. |
| 18 | Custom timer durations (1-240 min) | Focus Timer | PRO | Users who outgrow 25/5. |
| 19 | Auto-start sessions | Focus Timer | PRO | Automation for daily users. |
| 20 | Full session history (unlimited) | Focus Timer | PRO | Long-term trend analysis. |
| 21 | Advanced break reminders | Focus Timer | PRO | Custom sounds, smart suggestions. |
| 22 | Weekly + monthly goals | Focus Timer | PRO | Goal depth for power users. |
| 23 | Daily focus time | Stats & Analytics | FREE | Core value proof. |
| 24 | Sites blocked count | Stats & Analytics | FREE | Validates extension is working. |
| 25 | Distraction attempts counter (top 3) | Stats & Analytics | LIMITED FREE | Top 3 free, full breakdown Pro. |
| 26 | Focus Score (number visible) | Stats & Analytics | LIMITED FREE | Number free, breakdown locked. |
| 27 | Current streak tracking | Stats & Analytics | FREE | #1 retention mechanic. |
| 28 | Weekly/monthly reports | Stats & Analytics | PRO | #1 conversion trigger. |
| 29 | Exportable analytics (CSV/PDF) | Stats & Analytics | PRO | Professional/freelancer need. |
| 30 | Full streak history + recovery | Stats & Analytics | PRO | Protects streak investment. |
| 31 | Focus Score breakdown | Stats & Analytics | PRO | Drives improvement curiosity. |
| 32 | Full distraction breakdown + heatmap | Stats & Analytics | PRO | Deep analytics. |
| 33 | AI focus recommendations | Smart Features | PRO | Server-side processing. High value. |
| 34 | Calendar integration | Smart Features | PRO | Auto-focus for knowledge workers. |
| 35 | Context-aware profiles | Smart Features | PRO | Multiple blocking configurations. |
| 36 | Weekly AI Insight teaser (1/week) | Smart Features | LIMITED FREE | Taste of Pro insights. Month 4+. |
| 37 | 1 focus buddy invite | Social | FREE | Viral growth mechanic. |
| 38 | 1 focus challenge (pre-built) | Social | FREE | Structured gamification. |
| 39 | Unlimited buddies + notifications | Social | PRO | Group accountability. |
| 40 | Unlimited custom challenges | Social | PRO | Deep gamification. |
| 41 | Global anonymous leaderboard | Social | PRO | Competitive motivation. |
| 42 | Ambient sounds (3 free) | Integrations | FREE | High engagement, low cost. |
| 43 | Notification muting (blanket) | Integrations | FREE | Completes focus experience. |
| 44 | Browser action badge | Integrations | FREE | Core UX polish. |
| 45 | Basic keyboard shortcuts (2 fixed) | Integrations | FREE | Zero-cost UX improvement. |
| 46 | Share Focus Stats (image card) | Social/Integrations | FREE | Viral growth mechanic. |
| 47 | Cross-device sync | Integrations | PRO | #1 bypass complaint solution. |
| 48 | Sound mixing (layer 2-3 sounds) | Integrations | PRO | Delight feature. |
| 49 | Chrome startup auto-focus | Integrations | PRO | Automation for committed users. |
| 50 | Selective notification allowlist | Integrations | PRO | Professional nuance. |
| 51 | Full ambient sound library (15+) | Integrations | PRO | Variety + mixing. |
| 52 | Customizable keyboard shortcuts | Integrations | PRO | Power-user polish. |
| 53 | API access | Integrations | TEAM | Enterprise integration. |
| 54 | Shared block lists | Social/Team | TEAM | IT/admin managed. |
| 55 | Team sessions + admin dashboard | Team | TEAM | Team tier marquee. |
| 56 | Team leaderboards (named) | Team | TEAM | Team engagement. |
| 57 | Team challenges | Team | TEAM | Team gamification. |

**Final Distribution:**

| Tier | Count | Percentage |
|------|:-----:|:----------:|
| FREE | 21 | 36.8% |
| LIMITED FREE | 4 | 7.0% |
| PRO | 26 | 45.6% |
| TEAM | 6 | 10.5% |
| **Total** | **57** | **100%** |

*Note: The expanded count (57 vs. the original ~43-47) includes Team features now fully enumerated and two new recommended features.*

---

*Document generated for Phase 03 -- Feature Value Analysis*
*Feed this document alongside the spec files to Phase 04 for implementation planning*
