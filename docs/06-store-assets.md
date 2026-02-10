# STORE ASSETS GENERATOR: Focus Mode - Blocker
## Phase 06 Output — Chrome Web Store Publishing Assets

> **Date:** February 10, 2026 | **Status:** Complete
> **Input:** Phases 01-05
> **Extension:** Focus Mode - Blocker

---

## Overview

Five agents produced Chrome Web Store publishing-ready assets including store listing content, privacy documentation, icon design specifications, visual asset specifications, and a comprehensive publishing checklist.

All assets target Chrome Web Store requirements for a Manifest V3 productivity extension with the following profile:

- **Name:** Focus Mode - Blocker
- **Tagline:** "Block distractions. Build focus. Track your streak."
- **Version:** 1.0.0
- **Category:** Productivity
- **Pricing:** Free with Pro tier ($4.99/mo | $35.88/yr | $49.99 lifetime)
- **Brand:** Zovo (#6366f1 primary purple)
- **Privacy:** No data collection, all local storage

---

## Agent Deliverables

### Agent 1 — Store Listing Content
**Files:** `docs/store-assets/text/`
- `description.txt` — Full CWS description (2000-4000 chars), benefit-focused, with features, use cases, permissions explained, and "Built by Zovo" branding section
- `short-description.txt` — Under 132 characters, action-verb format for the CWS tile
- `store-metadata.txt` — Extension name, category, language, homepage URL, support URL, privacy policy URL, and pricing details

### Agent 2 — Privacy Section Content
**Files:** `docs/store-assets/privacy/`
- `privacy-single-purpose.txt` — CWS single purpose declaration tying all features (blocking, timer, streaks, Focus Score) to the unified purpose of focus and productivity
- `privacy-permissions.txt` — Individual justification for all 11 permissions: 8 required (`storage`, `alarms`, `declarativeNetRequest`, `declarativeNetRequestWithHostAccess`, `activeTab`, `scripting`, `notifications`, `offscreen`) + host permission (`<all_urls>`) + 3 optional (`identity`, `idle`, `tabGroups`)
- `privacy-remote-code.txt` — No remote code declaration confirming all code is bundled within the extension package
- `privacy-data-usage.txt` — All 9 Chrome Web Store data categories marked as NOT COLLECTED, with all three CWS certifications checked (no selling, no unrelated transfers, no creditworthiness use)

### Agent 3 — Privacy Policy + Icon Specs
**Files:** `docs/store-assets/privacy/` + `docs/store-assets/specs/`
- `privacy-policy-page.md` — Complete privacy policy for deployment at https://zovo.one/privacy/focus-mode-blocker, covering data handling, local storage, permissions, third-party services, children's privacy, and contact information
- `icon-specs.md` — Icon design specification for all sizes (16, 32, 48, 128 PNG + SVG source), Zovo purple gradient (#6366f1 to #4f46e5), white shield symbol, AI generation prompts, and quality checklist for light/dark theme compatibility

### Agent 4 — Visual Asset Specifications
**Files:** `docs/store-assets/specs/`
- `screenshot-specs.md` — 5 screenshot specifications at 1280x800 PNG: (1) Hero/popup overview, (2) Focus Score dashboard, (3) Block page in action, (4) Settings and customization, (5) Pro features showcase. Each spec includes exact content, layout, typography, color scheme, and Zovo branding placement
- `promo-image-specs.md` — Small promotional tile (440x280), marquee promotional tile (1400x560), and social share image specifications with AI generation prompts, brand guidelines, and composition details

### Agent 5 — Publishing Checklist + Consolidated Report
**Files:** `docs/store-assets/` + `docs/`
- `PUBLISHING-CHECKLIST.md` — 60+ item checklist covering: pre-submission code quality (12 items), store listing assets (8 items), icon verification (10 items), privacy compliance (8 items), links (3 items), branding (4 items), submission upload steps (13 steps), ZIP packaging, post-submission monitoring, post-approval verification, rejection recovery with specific guidance for blocker extensions
- `06-store-assets.md` — This consolidated overview document

---

## Document Map

```
docs/
├── 06-store-assets.md                          <- THIS FILE
└── store-assets/
    ├── text/
    │   ├── description.txt                     <- Full CWS description
    │   ├── short-description.txt               <- 132-char short description
    │   └── store-metadata.txt                  <- Extension metadata
    ├── privacy/
    │   ├── privacy-single-purpose.txt          <- Single purpose declaration
    │   ├── privacy-permissions.txt             <- Permission justifications
    │   ├── privacy-remote-code.txt             <- No remote code declaration
    │   ├── privacy-data-usage.txt              <- Data usage declaration
    │   └── privacy-policy-page.md              <- Full privacy policy
    ├── specs/
    │   ├── icon-specs.md                       <- Icon design specification
    │   ├── screenshot-specs.md                 <- 5 screenshot specifications
    │   └── promo-image-specs.md                <- Promo tile specifications
    └── PUBLISHING-CHECKLIST.md                 <- 60+ item publishing checklist
```

---

## Permissions Summary

| Permission | Type | Feature |
|-----------|------|---------|
| `storage` | Required | Save block lists, settings, streaks, Focus Score |
| `alarms` | Required | Focus timer, session scheduling, streak resets |
| `declarativeNetRequest` | Required | Block websites via URL rules |
| `declarativeNetRequestWithHostAccess` | Required | Dynamic rule updates for user-added sites |
| `activeTab` | Required | Detect current tab for quick-block actions |
| `scripting` | Required | Inject block page and content scripts |
| `notifications` | Required | Timer complete, streak milestones, session reminders |
| `offscreen` | Required | Play notification sounds, background audio |
| `<all_urls>` | Host | Block any user-specified website |
| `identity` | Optional | Pro account sync (future) |
| `idle` | Optional | Auto-pause timer when away |
| `tabGroups` | Optional | Organize focus-related tabs |

---

## Publishing Quick Reference

| Item | Value |
|------|-------|
| Developer Console | https://chrome.google.com/webstore/devconsole |
| Homepage | https://zovo.one/tools/focus-mode-blocker |
| Support | https://zovo.one/support |
| Privacy Policy | https://zovo.one/privacy/focus-mode-blocker |
| GitHub | https://github.com/theluckystrike/focus-mode-blocker |
| Category | Productivity |
| Pricing | Free (Pro: $4.99/mo, $35.88/yr, $49.99 lifetime) |
| Review Time | 1-3 business days (up to 7) |

---

## Next Steps

1. **Generate visual assets** — Use the specs in `docs/store-assets/specs/` to create actual PNG files for icons, screenshots, and promo tiles
2. **Deploy privacy policy** — Publish `privacy-policy-page.md` content to https://zovo.one/privacy/focus-mode-blocker
3. **Final QA pass** — Walk through `PUBLISHING-CHECKLIST.md` item by item
4. **Create ZIP package** — Follow the ZIP packaging instructions in the checklist
5. **Submit to Chrome Web Store** — Follow the 13-step submission process in the checklist

---

*Phase 06 — Store Assets Generator — Complete*
