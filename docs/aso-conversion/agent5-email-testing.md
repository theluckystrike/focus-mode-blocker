# Email Sequences & Testing Framework — Focus Mode - Blocker

> **Agent 5 — Phase 07 Output**
> **Date:** February 10, 2026

---

## Part A: Email & Drip Sequences

**IMPORTANT NOTE:** Focus Mode - Blocker is privacy-first. Free users do NOT provide email. Email sequences apply ONLY to:

1. **Website opt-in users** — visitors who subscribe to the newsletter on the marketing site
2. **Pro trial users** — email collected at Stripe checkout when starting a 7-day trial
3. **Pro subscribers** — email from Stripe payment processing

No email is collected from free extension users. No tracking pixels are placed inside the extension. All email communication follows CAN-SPAM and GDPR requirements with one-click unsubscribe in every message.

---

### 1. Pro Trial Onboarding Sequence (Days 0-7)

This is the highest-value sequence. Trial users have already shown strong intent. The goal is to deliver value fast enough that losing Pro features feels unacceptable by Day 6.

**Sequence goal:** >25% trial-to-paid conversion rate
**Send time:** 9:00 AM in user's local timezone (default UTC if unknown)
**From name:** "Mike from Focus Mode"

---

#### Email 1 — Day 0 (Immediate after trial start)

**Subject Line:** Welcome to Focus Mode Pro! Here's your quick start guide
**A/B Variant Subject:** Your Pro trial is live — set up in 90 seconds
**Preview Text:** Unlimited sites, full reports, and more

**Body Outline:**

Paragraph 1 — Congratulations and confirmation. "Your 7-day Pro trial is now active. You've unlocked everything Focus Mode has to offer — unlimited site blocking, full Focus Score breakdowns, sound mixing, schedule profiles, and more."

Paragraph 2 — Quick-start checklist. Frame as "3 things to do in your first 5 minutes": (1) Add your top distraction sites beyond the free 10 — suggest common ones like Reddit, Twitter/X, YouTube, Instagram, TikTok. (2) Set your first Pomodoro session. (3) Check your Focus Score baseline so you can track improvement.

Paragraph 3 — What to expect this week. "Over the next 7 days, we'll send you short tips to help you get the most out of Pro. You'll also get your first full weekly report on Day 3."

Paragraph 4 — Support line. "Hit reply anytime — I read every message."

**Primary CTA:** "Open Focus Mode" (deep link to extension popup)
**Secondary CTA:** "See all Pro features" (link to features page)

---

#### Email 2 — Day 1

**Subject Line:** Your Focus Score is unlocked — here's what the breakdown means
**A/B Variant Subject:** What does a Focus Score of [X] actually mean?
**Preview Text:** Pro unlocks the full breakdown

**Body Outline:**

Paragraph 1 — Introduce Focus Score as their personal productivity metric. "Your Focus Score is a 0-100 rating that measures how focused your browsing sessions are. Free users see just the number — but with Pro, you get the full breakdown."

Paragraph 2 — Explain the breakdown components. Detail how the score is calculated: time in focused sessions, blocked distraction attempts, session completion rate, and streak consistency. Use a visual example: "Focus Score: 67 = Sessions (18/25) + Blocks (22/25) + Completion (15/25) + Streak (12/25)."

Paragraph 3 — How to improve. Give 3 actionable tips: (1) Complete full Pomodoro sessions without ending early. (2) Add sites you find yourself visiting during sessions. (3) Build a 3-day streak to get the streak multiplier.

Paragraph 4 — Benchmark. "Most users start between 40-55. Power users consistently hit 80+. Where will you be by the end of the week?"

**Primary CTA:** "Check Your Score" (deep link to Focus Score view)
**Secondary CTA:** "How Focus Score is calculated" (help article)

---

#### Email 3 — Day 3

**Subject Line:** You've blocked [X] distractions in 3 days — here's what's next
**A/B Variant Subject:** 3 days in: your Focus Mode stats are impressive
**Preview Text:** Your personalized progress report

**Body Outline:**

Paragraph 1 — Personalized stats lead. Pull from user data if available: number of blocked attempts, sessions completed, current Focus Score, current streak. If data unavailable, use averages: "Most Pro trial users block 40+ distractions in their first 3 days."

Paragraph 2 — Highlight one feature they haven't tried. Check usage data and surface the most relevant untried Pro feature. Priority order: (1) Schedule profiles if they only use manual mode, (2) Sound mixing if they haven't enabled focus sounds, (3) Custom block page if still on default, (4) AI recommendations if they haven't viewed them.

Paragraph 3 — Social proof. "Users who try all Pro features during trial are 3x more likely to say Focus Mode is 'essential' to their workflow."

Paragraph 4 — Midpoint framing. "You're halfway through your trial. The next 4 days are when most users see their Focus Score jump the most."

**Primary CTA:** "Try [Feature Name]" (dynamic based on unused feature)
**Secondary CTA:** "View your full report" (deep link to reports)

---

#### Email 4 — Day 5

**Subject Line:** 3 Pro features most users miss
**A/B Variant Subject:** You're not using these 3 features (yet)
**Preview Text:** Hidden productivity multipliers inside Pro

**Body Outline:**

Paragraph 1 — Frame as insider knowledge. "After watching thousands of users go through Pro trials, we've noticed three features that are consistently underused — but that power users swear by."

Paragraph 2 — Feature 1: Sound mixing. "Combine brown noise with rain sounds at custom volumes. Users who enable focus sounds complete 23% more sessions. Try it: click the sound icon in your Pomodoro timer."

Paragraph 3 — Feature 2: AI recommendations. "Based on your blocking patterns and Focus Score, Pro suggests which sites to add, optimal session lengths, and the best times to schedule focus blocks. Check the 'Insights' tab in your weekly report."

Paragraph 4 — Feature 3: Schedule profiles. "Create different blocking profiles for different work modes. 'Deep Work' blocks everything. 'Email Hour' allows Gmail but blocks social media. 'Research' allows Wikipedia and Stack Overflow. Set them to activate automatically."

**Primary CTA:** "Explore Pro Features" (link to Pro features page)
**Secondary CTA:** "Set up your first schedule" (deep link to schedules)

---

#### Email 5 — Day 6 (Critical conversion email)

**Subject Line:** Your trial ends tomorrow — here's what you'll lose
**A/B Variant Subject:** Tomorrow your Focus Score breakdown goes dark
**Preview Text:** Your Pro features revert in 24 hours

**Body Outline:**

Paragraph 1 — Direct and honest. "Your 7-day Pro trial ends tomorrow. I want to make sure you know exactly what changes so there are no surprises."

Paragraph 2 — What reverts to free tier. Present as a clear list with loss framing: "- Your [X] blocked sites drop back to 10 (you'll keep your first 10, others pause). - Focus Score shows just the number — no breakdown, no trends. - Weekly reports become blurred after the summary. - Sound mixing, schedule profiles, and AI recommendations lock. - Your streak continues but streak insights go Pro-only."

Paragraph 3 — What you keep. Reassure: "Your data stays safe. Your blocked site list is preserved. If you upgrade later, everything unlocks exactly where you left it."

Paragraph 4 — Value summary. "This week, Focus Mode Pro helped you block [X] distractions, complete [Y] focused sessions, and reach a Focus Score of [Z]. That's [estimated hours] of productive time protected."

Paragraph 5 — Pricing with annual highlight. "Keep everything for $4.99/mo — or save 40% with the annual plan at $2.99/mo ($35.88/year)."

**Primary CTA:** "Keep Pro — $4.99/mo" (link to upgrade page)
**Secondary CTA:** "Save 40% — Go Annual" (link to annual plan)

---

#### Email 6 — Day 7 (Final trial email)

**Subject Line:** Last chance: Keep your Pro features
**A/B Variant Subject:** Your Pro trial expires today
**Preview Text:** One click to keep everything unlocked

**Body Outline:**

Paragraph 1 — Urgency without manipulation. "Your Pro trial expires at end of day. After that, your extension reverts to the free tier."

Paragraph 2 — Social proof. "87% of users who try Pro for a full week say it meaningfully improved their focus. Here's what one user told us: 'I didn't think I needed Pro until I lost it. The Focus Score breakdown alone changed how I work.' — Sarah K., freelance designer"

Paragraph 3 — Annual discount emphasis. "Most users choose the annual plan — it's $2.99/mo ($35.88/year), which works out to $0.10/day. That's less than the cost of a single distraction-induced context switch."

Paragraph 4 — Lifetime option mention. "Want to pay once and never think about it? Our Lifetime plan is $49.99 — yours forever, including all future features."

**Primary CTA:** "Upgrade Now (Save 40% Annual)" (link to annual plan)
**Secondary CTA:** "See all plans" (link to pricing page)

---

### 2. Post-Purchase Welcome Sequence (Days 0-14)

**Sequence goal:** Reduce buyer's remorse, drive feature adoption, generate reviews
**Send time:** 9:00 AM local timezone

---

#### Email 1 — Day 0 (Immediate after purchase)

**Subject Line:** You're in! Welcome to Focus Mode Pro
**A/B Variant Subject:** Pro is live — everything is unlocked
**Preview Text:** Your receipt + what's unlocked now

**Body Outline:**

Paragraph 1 — Warm welcome and receipt confirmation. "Welcome to Focus Mode Pro! Your payment has been processed and all Pro features are now active. Your receipt is attached below."

Paragraph 2 — What's now unlocked. Quick visual list: unlimited site blocking, full Focus Score breakdown with trends, unblurred weekly reports, sound mixing (3 sounds with volume control), schedule profiles, AI recommendations, Nuclear Mode extended options.

Paragraph 3 — Quick win suggestion. "If you haven't already, try adding all the sites that distract you — there's no limit now. Most Pro users block 15-25 sites."

Paragraph 4 — Support and community. "Questions? Hit reply. I personally read every message from Pro members."

**Primary CTA:** "Open Focus Mode" (deep link to extension)
**Secondary CTA:** "Explore Pro features guide" (help article)

---

#### Email 2 — Day 3

**Subject Line:** Your first week report is ready
**A/B Variant Subject:** See your full Focus Score breakdown (Pro exclusive)
**Preview Text:** Detailed stats from your first Pro week

**Body Outline:**

Paragraph 1 — Report ready notification. "Your first full weekly report as a Pro member is ready. Unlike the free blurred version, you can see every detail — Focus Score trends, per-site blocking data, session completion rates, and personalized recommendations."

Paragraph 2 — How to read the report. Walk through each section briefly so the user knows what to look for: overall score trend, most-blocked sites, session patterns by day/time, and AI recommendations.

Paragraph 3 — Goal setting. "Now that you have a baseline, set a Focus Score target for next week. Users who set explicit goals improve their score 2x faster."

**Primary CTA:** "View Full Report" (deep link to reports)
**Secondary CTA:** "Set a Focus Score goal" (deep link to settings)

---

#### Email 3 — Day 7

**Subject Line:** How's Pro going? Quick 2-question check
**A/B Variant Subject:** 1 week of Pro — quick question for you
**Preview Text:** Takes 10 seconds, helps us improve

**Body Outline:**

Paragraph 1 — Frame as caring about their experience. "You've been a Pro member for a week now. I'd love to know how it's going."

Paragraph 2 — Two questions. Keep it extremely simple: "Question 1: On a scale of 1-10, how likely are you to recommend Focus Mode to a friend? Question 2: What's one thing we could do better?"

Paragraph 3 — Conditional branch logic (automated):
- If score >= 8: Follow up with "Glad you're loving it! If you have 30 seconds, a Chrome Web Store review helps more than you know." + direct review link
- If score 5-7: Follow up with "Thanks for the honest feedback. What would make it a 9 or 10 for you?" + reply prompt
- If score <= 4: Follow up with personal outreach from founder offering help

**Primary CTA:** "Take 10-Second Survey" (link to simple survey)
**Secondary CTA:** "Reply with feedback" (mailto link)

---

#### Email 4 — Day 14

**Subject Line:** Love Focus Mode? Give a friend 7 days free
**A/B Variant Subject:** Your friends could use some focus too
**Preview Text:** Share your referral link for mutual rewards

**Body Outline:**

Paragraph 1 — Referral introduction. "You've been using Pro for two weeks now. If it's made a difference in your workflow, chances are someone you know could benefit too."

Paragraph 2 — Referral offer. "Share your unique link and give any friend a 7-day Pro trial — no credit card required. For every friend who converts to a paid plan, you get a free month of Pro."

Paragraph 3 — Easy sharing. Provide pre-written share text for email, Twitter/X, and Slack. Make the referral link prominent and easy to copy.

Paragraph 4 — Current impact stats. "In 14 days, you've blocked [X] distractions and completed [Y] focused sessions. Imagine if your whole team did that."

**Primary CTA:** "Copy Your Referral Link" (unique referral URL)
**Secondary CTA:** "Share on Twitter/X" (pre-filled tweet)

---

### 3. Behavior-Triggered Emails (for opted-in users only)

These emails fire based on specific in-extension events. They apply ONLY to users who have provided email through Pro sign-up or explicit website opt-in.

---

#### Trigger 1: Hit Paywall (Didn't Convert)

**Condition:** User viewed a paywall trigger (T1-T10) and dismissed without converting. Fires once per paywall trigger, max 1 per week.

**Subject Line:** You almost unlocked [feature name] — here's why it matters
**A/B Variant Subject:** [Feature name] is behind the Pro wall — but not for long
**Preview Text:** See what you're missing + how to unlock it

**Body Outline:**

Paragraph 1 — Acknowledge the moment. "You bumped into the Pro wall when trying to access [specific feature]. I get it — paywalls are annoying. But let me explain why this one exists."

Paragraph 2 — Feature value explanation. Tailor to the specific trigger. For T1 (blurred report): "Your weekly report shows exactly where your time goes — which sites pull you off track, when you're most focused, and how your Focus Score trends over time. It's the single feature Pro users cite most when explaining why they stay subscribed."

Paragraph 3 — ROI framing. "The average knowledge worker loses 2.1 hours per day to digital distractions. At an average wage of $35/hour, that's $608/week. Focus Mode Pro costs $0.16/day."

Paragraph 4 — Low-commitment CTA. "Try it free for 7 days. If it's not worth it, cancel with one click."

**Primary CTA:** "Start Free Trial" (link to trial start)
**Secondary CTA:** "See all Pro features" (link to features page)

**Cooldown:** Do not send this email more than 3 times total per user across all triggers.

---

#### Trigger 2: High Usage Free Tier (Top 10% of Active Users)

**Condition:** User is in the top 10% by sessions completed or blocks triggered in the past 14 days. Fires once.

**Subject Line:** You're in the top 10% of Focus Mode users
**A/B Variant Subject:** Only 10% of users are as focused as you
**Preview Text:** Impressive — here's how Pro takes it further

**Body Outline:**

Paragraph 1 — Genuine congratulations. "This isn't a marketing gimmick. Based on your usage over the past two weeks, you're in the top 10% of all Focus Mode users by session count. That's genuinely impressive."

Paragraph 2 — Current stats. Show their actual numbers: sessions completed, distractions blocked, current streak, Focus Score.

Paragraph 3 — What Pro adds for power users. Frame specifically for high-usage users: "At your usage level, Pro's biggest value isn't the unlimited sites — it's the data. Full Focus Score breakdowns show you exactly where to optimize. Schedule profiles let you set different block lists for different work modes. And the weekly report gives you trends over time, not just snapshots."

Paragraph 4 — Exclusive framing. "Pro is built for users like you — people who take their focus seriously."

**Primary CTA:** "See Pro Features" (link to features page)
**Secondary CTA:** "Start 7-day free trial" (link to trial start)

---

#### Trigger 3: Inactive 14+ Days

**Condition:** User has not started a session or triggered a block in 14+ days. Fires once at Day 14.

**Subject Line:** Your focus streak misses you (currently: 0 days)
**A/B Variant Subject:** It's been 2 weeks — everything okay?
**Preview Text:** Quick way to get back on track

**Body Outline:**

Paragraph 1 — Gentle re-engagement. "We noticed you haven't used Focus Mode in a couple of weeks. No judgment — everyone falls off the wagon sometimes."

Paragraph 2 — Low-friction restart. "Here's the easiest way to get back: click the button below, start a single 25-minute Pomodoro session, and rebuild your streak from Day 1. That's it."

Paragraph 3 — What's new. Mention any features or updates shipped since they were last active. Even minor updates work: "Since you've been away, we've added [feature/improvement]."

Paragraph 4 — Social proof. "Users who restart after a break typically reach their previous Focus Score within 5 days."

**Primary CTA:** "Start a Session" (deep link to start Pomodoro)
**Secondary CTA:** "What's new in Focus Mode" (changelog link)

**Follow-up:** If no activity after another 14 days, send one final email: "We'll stop emailing, but Focus Mode is always here when you're ready." Then suppress from all automated sequences.

---

#### Trigger 4: New Feature Launched

**Condition:** A new feature is released. Sent to all opted-in users.

**Subject Line:** [Feature Name] just landed — check it out
**A/B Variant Subject:** New in Focus Mode: [Feature Name]
**Preview Text:** [One-sentence feature description]

**Body Outline:**

Paragraph 1 — Announcement. "[Feature Name] is live in Focus Mode. Here's what it does and why we built it."

Paragraph 2 — How it works. Brief, clear explanation with one visual or GIF if possible.

Paragraph 3 — How to use it. Step-by-step (3 steps max).

Paragraph 4 — Pro differentiation (if applicable). If the feature has Pro-only aspects, mention them naturally without being pushy.

**Primary CTA:** "Try It Now" (deep link to feature)
**Secondary CTA:** "Learn more" (help article)

---

#### Trigger 5: Annual Renewal Approaching

**Condition:** Annual plan renews in 7 days. Informational only.

**Subject Line:** Your annual plan renews in 7 days
**A/B Variant Subject:** Focus Mode Pro renewal reminder — February [X], 2026
**Preview Text:** Your $35.88 annual plan renews soon

**Body Outline:**

Paragraph 1 — Straightforward reminder. "Your Focus Mode Pro annual plan renews on [date] for $35.88 (next 12 months). No action needed if you'd like to continue."

Paragraph 2 — Year in review. "Over the past year, you've blocked [X] distractions, completed [Y] focused sessions, and maintained an average Focus Score of [Z]. Your longest streak was [N] days."

Paragraph 3 — Management link. "If you need to update your payment method or have questions, visit your account settings or reply to this email."

**Primary CTA:** None (informational email)
**Secondary CTA:** "Manage your subscription" (link to account settings)

---

### 4. Objection-Handling Email Series

These emails target specific psychological barriers to conversion. They are sent as part of a nurture sequence to trial users who did not convert, spaced 3-4 days apart starting 3 days after trial expiration.

---

#### Objection 1: "Too Expensive"

**Subject Line:** Focus Mode costs less than your daily coffee
**A/B Variant Subject:** $0.16/day for unlimited focus? Here's the math
**Preview Text:** The ROI calculation might surprise you

**Body Outline:**

Paragraph 1 — Reframe the price. "At $4.99/month, Focus Mode Pro costs $0.16/day. That's less than a single gumball. On the annual plan ($2.99/mo), it drops to $0.10/day."

Paragraph 2 — ROI calculation. "The average knowledge worker loses 2.1 hours per day to digital distractions (University of California, Irvine). At $35/hour, that's $73.50/day in lost productivity. Even if Focus Mode saves you just 15 minutes a day, that's $8.75 in recaptured time — a 55x return on your $0.16 investment."

Paragraph 3 — Comparison anchoring. "For context, $4.99/month is less than: one fancy coffee, one month of ad-free YouTube, one lunch, or 10 minutes of a therapist's time."

Paragraph 4 — Annual savings highlight. "The annual plan saves you 40% — that's $24 back in your pocket over 12 months."

**Primary CTA:** "Get Pro for $0.10/day (Annual)" (link to annual plan)
**Secondary CTA:** "Start with monthly ($4.99)" (link to monthly plan)

---

#### Objection 2: "Not Using Enough"

**Subject Line:** You blocked [X] distractions last month (without even trying)
**A/B Variant Subject:** Your Focus Mode stats say otherwise
**Preview Text:** You're using it more than you think

**Body Outline:**

Paragraph 1 — Data-driven rebuttal. "You might feel like you don't use Focus Mode enough to justify Pro. But the numbers tell a different story."

Paragraph 2 — Personalized usage. "In the past 30 days, you: started [X] focus sessions, blocked [Y] distraction attempts, maintained a [Z]-day streak. That's [estimated hours] of protected focus time."

Paragraph 3 — Hidden value framing. "The best productivity tools are the ones you don't think about. Every time Focus Mode blocked a distraction you didn't even notice, it was doing its job."

Paragraph 4 — Pro makes passive usage smarter. "With Pro, those blocks aren't just blocked — they're tracked, analyzed, and turned into insights. You'll know exactly which sites steal the most time and when you're most vulnerable."

**Primary CTA:** "See what Pro reveals about your habits" (link to upgrade page)
**Secondary CTA:** "Start free trial" (link to trial start)

---

#### Objection 3: "Will Do It Later"

**Subject Line:** Special offer: Annual plan at founding member price ($2.99/mo)
**A/B Variant Subject:** This price won't last — lock in $2.99/mo today
**Preview Text:** Founding member pricing for early supporters

**Body Outline:**

Paragraph 1 — Legitimate time-limited offer. "As one of our early users, you're eligible for founding member pricing: the annual plan at $2.99/month ($35.88/year). This rate is locked in for as long as you're subscribed — even when we raise prices later."

Paragraph 2 — Why now matters. "We're keeping this price available for our first [X] subscribers. After that, the annual plan moves to its standard rate. This isn't a fake countdown — it's a genuine early adopter benefit."

Paragraph 3 — Procrastination paradox. "Here's the irony: you're using a distraction blocker because you know procrastination costs you. Putting off the upgrade is the same pattern. Break the cycle today."

Paragraph 4 — Zero-risk framing. "Try it for 30 days. If you don't see the value, email me and I'll refund you — no questions asked."

**Primary CTA:** "Lock In Founding Member Price" (link to annual plan)
**Secondary CTA:** "Remind me in a week" (snooze link)

---

#### Objection 4: "Not Sure It's Worth It"

**Subject Line:** "My Focus Score went from 45 to 82 in 3 weeks" — Sarah K.
**A/B Variant Subject:** Real users, real results: Focus Mode Pro stories
**Preview Text:** See how others improved their focus

**Body Outline:**

Paragraph 1 — Lead with testimonial. "'I was skeptical about paying for a website blocker. I'd used free ones before. But Focus Mode Pro's weekly reports changed how I understand my own productivity. My Focus Score went from 45 to 82 in three weeks, and I can actually see why.' — Sarah K., freelance designer, Portland"

Paragraph 2 — Second testimonial, different persona. "'As a PhD student with ADHD, I've tried every blocker out there. Focus Mode is the first one where the data actually helped me build better habits. The Focus Score gamifies productivity in a way that works with my brain, not against it.' — James R., PhD candidate, Boston"

Paragraph 3 — Third testimonial, ROI focus. "'I calculated it: Focus Mode saves me about 45 minutes a day. At my billing rate, that's $1,500/month in recaptured productivity. For $5/month. It's absurd how underpriced this is.' — Maria L., attorney, Chicago"

Paragraph 4 — Your turn. "These are real people who started exactly where you are — unsure if it was worth it. They all decided to try it. None of them regret it."

**Primary CTA:** "Start Your Free Trial" (link to trial start)
**Secondary CTA:** "Read more user stories" (link to testimonials page)

---

### 5. Win-Back Campaigns

#### 5A. Trial Expired (No Conversion)

**Timing:** Begins 1 day after trial expiration. Max 3 emails over 30 days, then stop.

---

**Day 1 Post-Trial:**

**Subject Line:** Your Pro features are paused — but your data is safe
**A/B Variant Subject:** Trial over, but nothing is lost
**Preview Text:** Pick up where you left off anytime

**Body Outline:**

Paragraph 1 — Reassurance. "Your 7-day Pro trial has ended and your extension has reverted to the free tier. But nothing is lost — your blocked site list, session history, and Focus Score data are all safely stored."

Paragraph 2 — What changed. Clear, honest list of what's now limited again.

Paragraph 3 — No pressure. "There's no rush. The free tier is genuinely useful, and we're glad you're using Focus Mode either way."

Paragraph 4 — When ready. "If you decide Pro is worth it, you can upgrade anytime and everything unlocks instantly — right where you left off."

**Primary CTA:** "Upgrade to Pro" (link to upgrade page)
**Secondary CTA:** None

---

**Day 7 Post-Trial:**

**Subject Line:** We noticed your Focus Score dropped since trial ended
**A/B Variant Subject:** Your focus data this week vs. last week
**Preview Text:** Here's what changed when Pro locked

**Body Outline:**

Paragraph 1 — Data comparison. "During your Pro trial, your average Focus Score was [X]. This week, it's [Y]. That's a [Z]-point drop." (If data unavailable, use averages: "Most users see a 15-20 point Focus Score drop after losing Pro features.")

Paragraph 2 — Why it dropped. "Without Pro's detailed breakdowns and AI recommendations, it's harder to know what to improve. The score is still there — but the roadmap to improving it is locked."

Paragraph 3 — Simple upgrade path. "One click brings it all back."

**Primary CTA:** "Restore Pro Features" (link to upgrade page)
**Secondary CTA:** "See pricing options" (link to pricing page)

---

**Day 30 Post-Trial:**

**Subject Line:** Last chance: 30% off your first month of Pro
**A/B Variant Subject:** A thank-you offer: 30% off Focus Mode Pro
**Preview Text:** One-time discount for trial alumni

**Body Outline:**

Paragraph 1 — Final offer. "It's been a month since your trial ended. We'd love to have you back, so here's a one-time offer: 30% off your first month of Pro. That's $3.49 instead of $4.99."

Paragraph 2 — What's new. Mention any features or improvements shipped in the past month.

Paragraph 3 — Last email notice. "This is the last promotional email we'll send about your trial. After this, you'll only hear from us about major updates (if you stay subscribed to our newsletter)."

**Primary CTA:** "Get 30% Off First Month" (link with discount code)
**Secondary CTA:** "Unsubscribe from promotional emails" (unsubscribe link)

---

#### 5B. Cancelled Subscriber

**Timing:** Begins immediately after cancellation. Max 3 emails over 30 days, then stop.

---

**Day 1 Post-Cancellation:**

**Subject Line:** We're sorry to see you go. Your data is safe.
**Preview Text:** Your account and data are preserved

**Body Outline:**

Paragraph 1 — Acknowledge and respect the decision. "Your Focus Mode Pro subscription has been cancelled. Your Pro features remain active until [end of billing period]. After that, you'll revert to the free tier."

Paragraph 2 — Data safety. "All your data — blocked sites, session history, Focus Score trends — is safely stored. If you ever resubscribe, everything picks up exactly where you left off."

Paragraph 3 — Quick feedback ask. "If you have 10 seconds, would you mind telling us why you cancelled? [Too expensive / Not using enough / Missing features / Found alternative / Other]. This directly helps us improve."

**Primary CTA:** "Tell us why (1-click)" (link to cancellation survey)
**Secondary CTA:** None

---

**Day 14 Post-Cancellation:**

**Subject Line:** Things have changed — here's what's new in Focus Mode Pro
**Preview Text:** Updates since you left

**Body Outline:**

Paragraph 1 — What's new. Highlight 2-3 specific features or improvements shipped since cancellation.

Paragraph 2 — If they cancelled for a specific reason (from survey), address it directly: "You mentioned [reason]. We've [addressed/are working on] that."

Paragraph 3 — Easy return path. "Reactivating takes one click. Your data and settings are exactly as you left them."

**Primary CTA:** "See What's New" (link to changelog)
**Secondary CTA:** "Reactivate Pro" (link to upgrade page)

---

**Day 30 Post-Cancellation:**

**Subject Line:** Come back for 50% off your first month (one-time offer)
**Preview Text:** Your biggest discount ever on Focus Mode Pro

**Body Outline:**

Paragraph 1 — Transparent win-back offer. "We miss having you as a Pro member. Here's our best offer: 50% off your first month back — $2.49 instead of $4.99. This is a one-time offer we extend to former subscribers."

Paragraph 2 — Quick value reminder. Pull their historical stats: "During your time as a Pro member, you blocked [X] distractions and maintained an average Focus Score of [Y]."

Paragraph 3 — Last outreach. "This is the last promotional email we'll send. We respect your inbox."

**Primary CTA:** "Get 50% Off — Come Back to Pro" (link with discount code)
**Secondary CTA:** "No thanks, unsubscribe" (unsubscribe link)

---

#### 5C. Churned Active User (Uninstalled Extension)

**Timing:** Detected via Chrome Web Store uninstall signal. Max 2 emails, then permanent removal.

---

**Day 3 Post-Uninstall:**

**Subject Line:** We noticed Focus Mode was uninstalled. Can we help?
**Preview Text:** Quick question + easy reinstall

**Body Outline:**

Paragraph 1 — Gentle and non-pushy. "It looks like Focus Mode was uninstalled from your browser. If it was intentional, no worries — we respect that. If it was accidental (it happens more than you'd think), here's a quick reinstall link."

Paragraph 2 — Feedback request. "If you uninstalled on purpose, we'd genuinely love to know why. Was it: [Not useful enough / Too aggressive / Performance issues / Found something better / Other reason]?"

Paragraph 3 — Data assurance. "If you were a Pro subscriber, your subscription and data are unaffected by uninstalling. You can reinstall anytime and pick up where you left off."

**Primary CTA:** "Reinstall Focus Mode" (Chrome Web Store link)
**Secondary CTA:** "Tell us what went wrong (1-click)" (feedback link)

---

**Day 14 Post-Uninstall:**

**Subject Line:** One last note from Focus Mode
**Preview Text:** We're removing you from our email list

**Body Outline:**

Paragraph 1 — Final, respectful farewell. "This is the last email we'll send. We're removing you from our marketing list."

Paragraph 2 — Door always open. "If you ever want to try Focus Mode again, it's free to reinstall. And if you had Pro, your data will be waiting."

Paragraph 3 — One last ask. "If you have a moment, a brief note about why you left would help us build a better product for everyone."

**Primary CTA:** "Share quick feedback" (feedback link)
**Secondary CTA:** None

**Post-action:** Remove from all automated email sequences permanently. Only transactional emails (receipts, subscription changes) if they have an active paid account.

---

### 6. Email Performance Targets

| Metric | Target | Measurement Method | Action if Below Target |
|--------|--------|--------------------|----------------------|
| Open rate | >30% | ESP analytics (Postmark/Resend) | A/B test subject lines, check deliverability |
| Click-through rate | >5% | ESP analytics | A/B test CTAs, adjust copy and design |
| Unsubscribe rate | <0.5% per email | ESP analytics | Reduce frequency, review content relevance |
| Bounce rate | <2% | ESP analytics | Clean list, verify emails at collection |
| Spam complaint rate | <0.1% | ESP analytics | Review content, add clearer unsubscribe |
| Trial-to-paid (email-assisted) | >25% | Attribution: paid within 24hr of email click | Optimize Day 5-6 emails, test offers |
| Win-back conversion | >5% | Resubscribe within 30 days of campaign | Test discount amounts, timing |
| Revenue per email | Track monthly | Total email-attributed revenue / emails sent | Focus on high-performing sequences |

**Email tech stack recommendation:** Resend or Postmark for transactional reliability. Both offer excellent deliverability, simple APIs, and reasonable pricing for early-stage products. Avoid Mailchimp/Sendgrid for transactional email — they're built for marketing blasts.

---

## Part B: Testing & Optimization Framework

### 1. Metric Definitions

#### Primary KPIs

| KPI | Definition | Target | Measurement | Frequency |
|-----|-----------|--------|-------------|-----------|
| Free-to-paid conversion rate | (Paid users / Total active users) x 100 | 2.5-4% | Stripe subscriber count / CWS active users | Weekly |
| MRR (Monthly Recurring Revenue) | Sum of all monthly subscription revenue | $1,000+ by month 6 | Stripe dashboard | Daily |
| ARPU (Avg Revenue Per User) | Total revenue / Total active users | Track and grow monthly | Stripe revenue / CWS active users | Monthly |
| LTV (Lifetime Value) | ARPU x Average subscriber lifespan (months) | $20-60 | Calculated from churn rate | Quarterly |
| CAC (Customer Acquisition Cost) | Total marketing spend / New paid users acquired | <$10 | Marketing budget / Stripe new subscribers | Monthly |
| Churn rate | (Cancelled subscribers / Total subscribers) x 100 | <5% monthly | Stripe cancellations / total subs | Monthly |
| Install-to-active rate | (Active users at Day 7 / Total installs) x 100 | >40% | CWS analytics | Weekly |
| Net revenue retention | (Revenue from existing customers, period end) / (Revenue from same customers, period start) x 100 | >95% | Stripe cohort analysis | Monthly |

#### Secondary KPIs

| KPI | Definition | Target | Frequency |
|-----|-----------|--------|-----------|
| Paywall view rate | % of active users who see a paywall per week | 30-50% | Weekly |
| Upgrade page CTR | Clicks on "Upgrade" / Total paywall views | >15% | Weekly |
| Email open rate | Unique opens / Delivered emails | >30% | Per send |
| Email click rate | Unique clicks / Delivered emails | >5% | Per send |
| Review velocity | New reviews per week on CWS | 2-5 per week | Weekly |
| NPS (Net Promoter Score) | % Promoters - % Detractors | >50 | Monthly |
| Support ticket volume | New tickets per 1,000 active users | <5 | Weekly |
| Time to first response | Median time to first support reply | <4 hours | Daily |

#### Micro-Conversions (Leading Indicators)

| Indicator | Definition | Why It Matters | Target |
|-----------|-----------|---------------|--------|
| Feature engagement rate | % of users who use each feature in first 7 days | Predicts retention and conversion | >60% for core features |
| Time-to-first-value | Minutes from install to first completed session | Faster = higher retention | <5 minutes |
| Session completion rate | Completed sessions / Started sessions | Indicates product-market fit | >70% |
| Streak length (avg) | Average consecutive days with at least 1 session | Predicts long-term retention | >5 days |
| Focus Score average | Mean Focus Score across active users | Indicates engagement depth | >55 |
| Block list size | Average number of sites in block list | Predicts switching cost | >8 sites |
| Settings customization | % of users who change at least 1 default setting | Indicates investment in product | >40% |
| Return visit rate | % of users who open extension on consecutive days | Predicts DAU/MAU ratio | >50% |

---

### 2. A/B Test Roadmap (12 Weeks)

All tests run sequentially to avoid interaction effects. Each test uses a 50/50 split with random assignment. Tests are evaluated at 95% confidence interval with 80% statistical power minimum.

---

#### Weeks 1-2: Extension Title Test

| Parameter | Detail |
|-----------|--------|
| **Test ID** | ASO-001 |
| **Element** | Chrome Web Store extension name |
| **Control** | "Focus Mode - Blocker" |
| **Variant** | "Focus Mode - Free Website Blocker" |
| **Hypothesis** | Adding "Free" to the title increases install rate by 10% because cost is the #1 concern for new users evaluating extensions |
| **Primary metric** | Install rate (installs / detail page views) |
| **Secondary metrics** | Detail page view rate, uninstall rate at Day 1 (quality check) |
| **Min sample** | 5,000 impressions per variant |
| **Estimated duration** | 14 days |
| **Implementation** | CWS A/B testing (if available) or sequential test with 7 days each |
| **Risk** | "Free" may attract lower-quality users who never convert to Pro |
| **Rollback criteria** | If Day-1 uninstall rate increases by >20%, roll back immediately |

---

#### Weeks 3-4: Short Description Test

| Parameter | Detail |
|-----------|--------|
| **Test ID** | ASO-002 |
| **Element** | Chrome Web Store short description (132 chars) |
| **Control** | Current short description |
| **Variant** | Lead with "Free" — "Free website blocker with Focus Score, Pomodoro timer, and streak tracking. Block distractions and build better focus habits." |
| **Hypothesis** | Leading with "Free" in the short description increases detail page CTR by 8% because it removes price uncertainty before users click |
| **Primary metric** | Click-through rate (detail page views / impressions) |
| **Secondary metrics** | Install rate, bounce rate from detail page |
| **Min sample** | 5,000 impressions per variant |
| **Estimated duration** | 14 days |
| **Implementation** | Sequential test: 7 days control, 7 days variant, normalized for day-of-week |
| **Risk** | Minimal — short description is low-risk to change |

---

#### Weeks 5-6: Icon Variant Test

| Parameter | Detail |
|-----------|--------|
| **Test ID** | ASO-003 |
| **Element** | Extension icon |
| **Control** | Shield with crosshair (blocking metaphor) |
| **Variant** | Shield with checkmark (protection/success metaphor) |
| **Hypothesis** | A checkmark icon increases detail page views by 12% because it conveys positive outcome (success) rather than negative action (blocking), which resonates better emotionally |
| **Primary metric** | Detail page view rate (views / impressions) |
| **Secondary metrics** | Install rate, perceived trustworthiness (survey sample if possible) |
| **Min sample** | 2,000 detail page views per variant |
| **Estimated duration** | 14 days |
| **Implementation** | Sequential test with icon swap at midpoint |
| **Risk** | Icon changes can temporarily confuse existing users — communicate change in notes |

---

#### Weeks 7-8: Paywall Headline Test

| Parameter | Detail |
|-----------|--------|
| **Test ID** | CONV-001 |
| **Element** | Paywall modal headline |
| **Control** | "Upgrade to Pro" |
| **Variant** | "See Where Your Time Goes" |
| **Hypothesis** | A benefit-oriented headline converts 15% better than a generic upgrade prompt because it frames the paywall as a value revelation rather than a purchase request |
| **Primary metric** | Paywall-to-upgrade-page conversion rate |
| **Secondary metrics** | Paywall dismiss rate, time spent on paywall modal, upgrade page conversion |
| **Min sample** | 500 paywall views per variant |
| **Estimated duration** | 14 days (depending on traffic) |
| **Implementation** | In-extension A/B test with random assignment stored in chrome.storage.local |
| **Risk** | Low — copy change only, no functional impact |

---

#### Weeks 9-10: Pricing Display Test

| Parameter | Detail |
|-----------|--------|
| **Test ID** | CONV-002 |
| **Element** | Pricing page plan order and emphasis |
| **Control** | Monthly plan displayed first ($4.99/mo) |
| **Variant** | Annual plan displayed first with "SAVE 40%" badge ($2.99/mo billed annually) |
| **Hypothesis** | Displaying annual plan first increases ARPU by 20% because anchoring on the lower monthly rate with a savings badge creates stronger value perception |
| **Primary metric** | ARPU of new subscribers during test period |
| **Secondary metrics** | Plan selection distribution, overall conversion rate, churn rate at 30 days |
| **Min sample** | 300 upgrade page views per variant |
| **Estimated duration** | 14 days |
| **Implementation** | In-extension A/B test with random assignment |
| **Risk** | Could reduce overall conversion if annual commitment scares off some users |
| **Rollback criteria** | If overall conversion drops >15%, roll back |

---

#### Weeks 11-12: CTA Button Text Test

| Parameter | Detail |
|-----------|--------|
| **Test ID** | CONV-003 |
| **Element** | Primary CTA button on paywall and upgrade page |
| **Control** | "Upgrade to Pro" |
| **Variant** | "Start Free Trial" |
| **Hypothesis** | A trial-focused CTA converts 25% better than an upgrade CTA because it reduces perceived commitment and risk — "try" feels safer than "buy" |
| **Primary metric** | CTA click-through rate |
| **Secondary metrics** | Trial start rate, trial-to-paid conversion, overall revenue impact |
| **Min sample** | 500 paywall views per variant |
| **Estimated duration** | 14 days |
| **Implementation** | In-extension A/B test; both variants lead to the same trial flow |
| **Risk** | "Free Trial" might attract lower-intent users, reducing trial-to-paid rate |

---

### 3. Test Documentation Template

Every test must be documented before launch using this template. Results are recorded after the test concludes.

```
TEST ID: [ASO-XXX or CONV-XXX]
NAME: [Descriptive name]
DATE STARTED: [YYYY-MM-DD]
DATE ENDED: [YYYY-MM-DD]
OWNER: [Person responsible]

HYPOTHESIS:
If we [change X], then [metric Y] will [increase/decrease] by [Z%]
because [reason].

CONTROL:
[Detailed description of current state]

VARIANT:
[Detailed description of changed state]

PRIMARY METRIC:
[Metric name] — [How it's measured] — [Current baseline]

SECONDARY METRICS:
- [Metric 1] — [How measured]
- [Metric 2] — [How measured]

SAMPLE SIZE NEEDED:
[Number] per variant (calculated for 95% confidence, 80% power)
Calculator used: [e.g., Evan Miller's sample size calculator]

SEGMENTS:
[Any user segments being analyzed separately, e.g., new vs. returning]

ESTIMATED DURATION:
[X days] based on [daily traffic estimate]

GUARDRAIL METRICS:
[Metrics that must not degrade — e.g., uninstall rate, support tickets]

IMPLEMENTATION NOTES:
[Technical details — where the split happens, how assignment is stored]

--- POST-TEST ---

RESULT: [Win / Loss / Inconclusive]

STATISTICAL SIGNIFICANCE: [p-value or confidence interval]

CONTROL PERFORMANCE: [Metric = X]
VARIANT PERFORMANCE: [Metric = Y]
LIFT: [+/- Z%]

SECONDARY METRIC RESULTS:
- [Metric 1]: Control [X] vs. Variant [Y]
- [Metric 2]: Control [X] vs. Variant [Y]

GUARDRAIL CHECK:
[All guardrail metrics within acceptable range? Yes/No — details]

LEARNING:
[What we learned from this test, including unexpected findings]

NEXT ACTION:
[ ] Roll out variant to 100%
[ ] Iterate with new variant
[ ] Keep control
[ ] Run follow-up test: [description]

IMPACT ESTIMATE:
[Projected annual impact if rolled out — revenue, installs, etc.]
```

---

### 4. Analytics Event Tracking Requirements

All events use a consistent schema. No PII is collected. User identification uses anonymous Chrome extension installation ID only.

#### Event Schema

```json
{
  "event": "event_name",
  "timestamp": "ISO 8601",
  "user_id": "anonymous_installation_id",
  "session_id": "random_uuid_per_browser_session",
  "properties": {
    "key": "value"
  },
  "context": {
    "extension_version": "1.0.0",
    "browser": "chrome",
    "os": "macos|windows|linux|chromeos",
    "plan": "free|trial|pro_monthly|pro_annual|pro_lifetime",
    "ab_tests": {
      "test_id": "control|variant"
    }
  }
}
```

#### ASO Events

| Event Name | Properties | Purpose | Trigger |
|-----------|-----------|---------|---------|
| `extension_installed` | `source`, `referrer`, `campaign` | Track acquisition source | Extension first run |
| `extension_uninstalled` | `days_active`, `features_used`, `was_pro`, `sessions_completed`, `focus_score` | Understand churn | Uninstall survey (CWS) |
| `extension_updated` | `from_version`, `to_version` | Track update adoption | Extension auto-update |
| `onboarding_started` | `step` | Track onboarding funnel | First extension open |
| `onboarding_completed` | `time_to_complete`, `sites_added`, `skipped_steps` | Track onboarding success | Onboarding finished |
| `onboarding_abandoned` | `last_step`, `time_spent` | Identify onboarding friction | 24hr without completing |

#### Conversion Events

| Event Name | Properties | Purpose | Trigger |
|-----------|-----------|---------|---------|
| `paywall_view` | `trigger_id` (T1-T10), `feature`, `session_count`, `days_since_install` | Track paywall exposure | Any paywall trigger fires |
| `paywall_dismiss` | `trigger_id`, `dismiss_type` (close/back/escape), `time_on_paywall` | Track rejection patterns | User closes paywall without action |
| `paywall_cta_click` | `trigger_id`, `cta_text`, `cta_position` | Track paywall engagement | User clicks CTA on paywall |
| `upgrade_page_view` | `source` (popup/options/paywall/email), `current_plan` | Track upgrade interest | Upgrade page loaded |
| `plan_select` | `plan_type` (monthly/annual/lifetime), `displayed_price`, `source` | Track plan preference | User selects a plan |
| `checkout_start` | `plan_type`, `price`, `coupon_code` | Track checkout initiation | Stripe checkout opens |
| `checkout_complete` | `plan_type`, `price`, `is_trial`, `coupon_code`, `payment_method` | Track conversion | Stripe webhook: payment success |
| `checkout_abandon` | `plan_type`, `step` (plan_select/payment_info/confirmation), `time_in_checkout` | Track drop-off | Stripe checkout closed without payment |
| `trial_started` | `plan_type`, `source` | Track trial adoption | Trial activated |
| `trial_ended` | `converted` (boolean), `days_active`, `features_used` | Track trial outcomes | Trial period expires |
| `subscription_cancelled` | `plan_type`, `months_subscribed`, `reason` | Track churn | Stripe webhook: subscription cancelled |
| `subscription_renewed` | `plan_type`, `months_subscribed` | Track retention | Stripe webhook: renewal success |

#### Engagement Events

| Event Name | Properties | Purpose | Trigger |
|-----------|-----------|---------|---------|
| `session_start` | `timer_duration`, `mode` (pomodoro/custom), `sites_blocked_count` | Track usage | User starts focus session |
| `session_complete` | `duration`, `mode`, `blocks_during_session`, `completed` (boolean) | Track session quality | Timer ends or user stops |
| `session_abandon` | `duration_remaining`, `reason` (manual/navigation/close) | Track abandonment | Session ended early |
| `block_attempt` | `domain`, `trigger_type` (navigation/tab), `session_active` (boolean) | Track blocking behavior | Blocked site visited |
| `block_page_view` | `domain`, `time_on_page`, `action` (wait/back/override) | Track block page behavior | Block page displayed |
| `focus_score_view` | `score`, `plan`, `breakdown_visible` (boolean) | Track score engagement | User views Focus Score |
| `streak_milestone` | `streak_days`, `milestone_type` (3/7/14/30/60/90) | Track streaks | Streak hits milestone |
| `feature_discovery` | `feature_name`, `discovery_source` (organic/nudge/email) | Track feature adoption | First use of a feature |
| `settings_changed` | `setting_name`, `old_value`, `new_value` | Track customization | Settings modified |
| `sound_enabled` | `sound_type`, `volume` | Track sound feature usage | Sound toggled on |
| `nuclear_mode_activated` | `duration` (1hr/24hr), `sites_count` | Track Nuclear Mode usage | Nuclear Mode started |
| `schedule_created` | `profile_name`, `days_active`, `sites_count` | Track schedule adoption | New schedule saved |

#### Implementation Notes

- **Analytics provider:** Use a privacy-friendly option: Plausible, Umami, or custom endpoint. Avoid Google Analytics for extension events.
- **Event batching:** Batch events and send every 60 seconds or on extension close (whichever comes first) to minimize network requests.
- **Offline support:** Queue events in `chrome.storage.local` when offline and flush when connection returns.
- **Data retention:** Raw events retained for 12 months. Aggregated data retained indefinitely.
- **Privacy:** No PII in events. Domain names in `block_attempt` are hashed before sending. User can opt out of analytics entirely in settings.
- **Size limits:** Keep event payload under 1KB each. Batch payloads under 50KB.

---

### 5. Iteration Framework

#### Weekly Cadence (Quick Wins)

**Every Monday morning — 30-minute review:**

| Check | Data Source | Action If Below Target |
|-------|-----------|----------------------|
| Email open rates (last 7 days) | ESP dashboard | A/B test next subject line; check sender reputation |
| Email click rates (last 7 days) | ESP dashboard | Revise CTA copy; test button color/size |
| Paywall view-to-conversion rate | Analytics dashboard | If <2%, revise paywall copy; check trigger timing |
| Uninstall rate and reasons | CWS analytics + survey | If top reason is fixable, prioritize for sprint |
| Support ticket themes | Help desk | If >3 tickets on same issue, file bug or add FAQ |
| Review velocity | CWS dashboard | If <2 reviews/week, increase review prompt frequency |
| New negative reviews | CWS dashboard | Respond within 24 hours using review protocol |

**Weekly output:** 1-2 copy or configuration changes shipped by Wednesday.

---

#### Monthly Cadence (Strategic Adjustments)

**First Monday of the month — 2-hour deep dive:**

| Analysis | Method | Action |
|----------|--------|--------|
| Full funnel analysis | Map install > active > paywall > upgrade > paid | Identify biggest drop-off point; focus next month's efforts there |
| A/B test review | Evaluate completed tests; plan next tests | Roll out winners to 100%; archive learnings |
| Cohort retention | Compare Day-7, Day-14, Day-30 retention by install cohort | If retention drops for recent cohorts, investigate product changes |
| Competitive landscape | Check competitor CWS listings, pricing, features | Update competitive positioning if needed |
| Content performance | Review blog posts, landing pages by traffic and conversion | Double down on top performers; retire underperformers |
| Email sequence review | Analyze full sequence performance, not just individual emails | Adjust timing, add/remove emails based on data |
| Revenue analysis | MRR, ARPU, churn, LTV trends | Adjust pricing or packaging if ARPU declining |

**Monthly output:** 1 strategic decision (pricing, feature gate, positioning, or channel) plus updated dashboard.

---

#### Quarterly Cadence (Major Decisions)

**First week of quarter — half-day strategy session:**

| Review Area | Key Questions | Potential Actions |
|------------|--------------|-------------------|
| Pricing strategy | Is ARPU growing? Is churn acceptable? How does pricing compare to competitors? | Adjust pricing tiers, introduce new plan, change trial length |
| Feature gate review | Is the free/Pro split optimal? Are free users getting enough value to stay? Are Pro users getting enough differentiation? | Move features between tiers based on conversion data |
| Content ROI | Which content channels drive the most installs and conversions? What's the CAC by channel? | Reallocate content budget; shut down underperforming channels |
| Product-market fit | What's the NPS? What's the Day-30 retention rate? What feature requests keep recurring? | Major feature planning, pivot decisions |
| Team and process | Are we shipping fast enough? Where are bottlenecks? | Process improvements, tool changes, hiring decisions |
| Annual plan analysis | What % of subscribers are annual vs. monthly? What's the annual renewal rate? | Adjust annual discount, add annual-only perks |

**Quarterly output:** Updated 90-day plan, revised targets if needed, strategy document.

---

### 6. Dashboard Requirements

#### Dashboard 1: Daily Operations Dashboard

**Purpose:** Quick morning check. Are things on fire? Is anything trending in the wrong direction?

**Refresh rate:** Real-time (5-minute lag max)

**Metrics displayed:**

| Section | Metrics | Visualization |
|---------|---------|---------------|
| **Headline Numbers** | Today's installs, uninstalls, net new users, active users (24hr) | Large number cards with day-over-day delta |
| **Revenue** | Today's revenue, MRR (current), new subscribers today, cancellations today | Number cards + sparkline (7-day trend) |
| **Health** | Error rate, API latency, CWS status, support tickets opened today | Traffic light indicators (green/yellow/red) |
| **Engagement** | Sessions started today, session completion rate, avg Focus Score today | Number cards with 7-day trend line |
| **Alerts** | Automated alerts for: uninstall spike (>2x daily avg), error spike, negative review, payment failures | Alert feed with severity levels |

**Layout:** Single screen, no scrolling. Designed for a quick 60-second scan.

**Tool recommendation:** Grafana (self-hosted) or Datadog for real-time metrics. Alternatively, a simple custom dashboard using Chart.js with data from Supabase/Postgres.

---

#### Dashboard 2: Conversion Dashboard

**Purpose:** Understand the full conversion funnel. Identify where users drop off and what's working.

**Refresh rate:** Daily (overnight aggregation)

**Metrics displayed:**

| Section | Metrics | Visualization |
|---------|---------|---------------|
| **Funnel** | Impression > Detail Page > Install > Active (Day 7) > Paywall View > Upgrade Page > Checkout Start > Checkout Complete | Horizontal funnel chart with conversion rates between each step |
| **Paywall Performance** | Views, CTR, conversion rate — broken down by trigger (T1-T10) | Table with sparklines; highlight top and bottom performers |
| **Trigger Heatmap** | Which triggers fire most, which convert best | Heatmap matrix (trigger x day-of-week) |
| **Plan Mix** | Distribution of monthly vs. annual vs. lifetime | Pie chart + trend over time |
| **Email Attribution** | Conversions attributed to email sequences (by sequence) | Bar chart with revenue attribution |
| **A/B Test Status** | Active tests, current sample size, preliminary results | Table with progress bars and statistical significance indicators |
| **Upgrade Page Analytics** | Page views, time on page, plan selection rate, checkout start rate | Mini-funnel specific to upgrade page |

**Filters:** Date range, user segment (new/returning), plan type, acquisition source, A/B test group.

**Tool recommendation:** Metabase (open source) connected to analytics database. Excellent for SQL-based dashboards with minimal setup.

---

#### Dashboard 3: Growth Dashboard

**Purpose:** Long-term strategic view. Monthly and quarterly trends for leadership and strategy decisions.

**Refresh rate:** Weekly (Monday morning aggregation)

**Metrics displayed:**

| Section | Metrics | Visualization |
|---------|---------|---------------|
| **MRR Trend** | MRR, MRR growth rate, MRR by plan type, new MRR, churned MRR, net new MRR | Line chart (12-month view) with MRR waterfall chart |
| **Cohort Retention** | Day-1, Day-7, Day-14, Day-30, Day-60, Day-90 retention by install week | Cohort retention heatmap (rows = install week, columns = day) |
| **LTV Analysis** | LTV by acquisition channel, LTV by plan type, LTV trend | Bar chart + trend line |
| **CAC & Payback** | CAC by channel, LTV:CAC ratio, payback period in months | Scatter plot (CAC vs. LTV by channel) |
| **Content Attribution** | Installs and conversions by content piece/channel | Table ranked by conversion-attributed revenue |
| **Competitive Position** | Install rank, rating comparison, review count comparison (vs. top 5 competitors) | Competitive scorecard table with trend arrows |
| **Forecasting** | Projected MRR (3-month), projected installs (3-month), projected churn | Line chart with confidence intervals |
| **User Segments** | Distribution by plan, by engagement level, by tenure | Stacked area chart over time |

**Filters:** Date range (weekly/monthly/quarterly view), acquisition source, geography (if available).

**Tool recommendation:** Mode Analytics or Looker for complex SQL-based dashboards with scheduling. For budget-conscious: Metabase with scheduled email reports.

---

### 7. Measurement Infrastructure Recommendations

#### Analytics Stack

| Component | Recommended Tool | Alternative | Purpose |
|-----------|-----------------|-------------|---------|
| Event collection | Custom endpoint (Cloudflare Worker) | Segment | Privacy-first event ingestion |
| Event storage | Supabase (Postgres) | ClickHouse | Event storage and querying |
| Operational dashboard | Grafana | Datadog | Real-time monitoring |
| Analytical dashboard | Metabase | Mode Analytics | Business intelligence |
| Email analytics | Resend dashboard | Postmark | Email performance |
| CWS analytics | Chrome Web Store Developer Dashboard | — | Store-level metrics |
| A/B test analysis | Custom (Python/SQL) | GrowthBook | Statistical analysis |
| Error tracking | Sentry | Bugsnag | Extension error monitoring |

#### Data Flow

```
Extension Events → Cloudflare Worker (validation + enrichment)
    → Supabase/Postgres (raw events table)
    → Materialized views (aggregated metrics)
    → Metabase/Grafana (dashboards)

Stripe Webhooks → Cloudflare Worker (validation)
    → Supabase/Postgres (revenue events)
    → Revenue dashboards

Email Events → Resend webhooks → Supabase/Postgres
    → Email performance dashboards

CWS Data → Manual weekly export or API (if available)
    → Supabase/Postgres → Growth dashboards
```

#### Privacy Compliance Checklist

- [ ] No PII in analytics events
- [ ] Anonymous installation ID (not linked to email or identity)
- [ ] Domain names hashed before transmission
- [ ] User opt-out available in extension settings
- [ ] Data retention policy documented and enforced (12 months raw, aggregated indefinitely)
- [ ] GDPR data deletion endpoint available
- [ ] Privacy policy updated to reflect analytics collection
- [ ] No third-party tracking scripts in extension
- [ ] Analytics endpoint is first-party domain (not third-party analytics service)
- [ ] Event batching to minimize network fingerprinting surface

---

*Agent 5 — Phase 07 — Email Sequences & Testing Framework — Complete*
