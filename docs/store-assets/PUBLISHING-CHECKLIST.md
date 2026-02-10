# Chrome Web Store Publishing Checklist — Focus Mode - Blocker

> **Extension:** Focus Mode - Blocker v1.0.0
> **Manifest:** V3 | **Category:** Productivity | **Price:** Free (with in-app purchases)
> **Brand:** Zovo (#6366f1 primary purple)

---

## Pre-Submission

### Code Quality
- [ ] Extension loads without console errors
- [ ] All features work as documented
- [ ] Manifest version is 3
- [ ] `minimum_chrome_version` set to "116"
- [ ] All icons are custom (NOT default puzzle-piece!)
- [ ] Permissions are minimal and justified
- [ ] No inline scripts or eval()
- [ ] CSP enforced: `script-src 'self'; object-src 'none'`
- [ ] All content scripts tested on 10+ websites
- [ ] Service worker starts and recovers correctly
- [ ] No console.log statements in production
- [ ] Version number matches manifest.json (1.0.0)

### Store Listing Assets
- [ ] Description written (2000-4000 chars) — `docs/store-assets/text/description.txt`
- [ ] Short description under 132 chars — `docs/store-assets/text/short-description.txt`
- [ ] Store metadata complete — `docs/store-assets/text/store-metadata.txt`
- [ ] All 5 screenshots created (1280x800 PNG) — see `docs/store-assets/specs/screenshot-specs.md`
- [ ] Small promo tile (440x280 PNG) — see `docs/store-assets/specs/promo-image-specs.md`
- [ ] Marquee promo tile (1400x560 PNG) — see `docs/store-assets/specs/promo-image-specs.md`
- [ ] Category: Productivity
- [ ] Language: English

### Icons
- [ ] icon-16.png — crisp at actual toolbar size
- [ ] icon-32.png — toolbar @2x
- [ ] icon-48.png — extensions page
- [ ] icon-128.png — Chrome Web Store / install dialog
- [ ] icon.svg — source vector file
- [ ] All icons use Zovo purple gradient (#6366f1 to #4f46e5)
- [ ] White shield symbol on all icons
- [ ] Works on light AND dark browser themes
- [ ] PNGs have transparency (no white background)
- [ ] 16px version is recognizable (test at actual size!)

### Privacy Compliance
- [ ] Single purpose description — `docs/store-assets/privacy/privacy-single-purpose.txt`
- [ ] All permissions justified individually — `docs/store-assets/privacy/privacy-permissions.txt`
- [ ] "No remote code" declaration — `docs/store-assets/privacy/privacy-remote-code.txt`
- [ ] All 9 data type categories marked NOT COLLECTED — `docs/store-assets/privacy/privacy-data-usage.txt`
- [ ] All three CWS certifications checked (no selling data, no unrelated transfers, no creditworthiness)
- [ ] Privacy policy URL works: https://zovo.one/privacy/focus-mode-blocker
- [ ] Privacy policy mentions "Focus Mode - Blocker" by name
- [ ] Privacy policy page written — `docs/store-assets/privacy/privacy-policy-page.md`

### Links
- [ ] Homepage URL: https://zovo.one/tools/focus-mode-blocker
- [ ] Support URL: https://zovo.one/support
- [ ] Privacy Policy URL: https://zovo.one/privacy/focus-mode-blocker

### Branding
- [ ] Icons match Zovo brand colors (#6366f1 purple)
- [ ] Screenshots include small Zovo logo (bottom-right, 60-80% opacity)
- [ ] Description includes "Built by Zovo" section
- [ ] Consistent with Zovo visual identity throughout

---

## Submission

### Upload Steps
1. Go to https://chrome.google.com/webstore/devconsole
2. Click "New Item"
3. Upload ZIP file of extension (exclude: node_modules, .git, docs, tests)
4. Fill in store listing from `description.txt`
5. Set short description from `short-description.txt`
6. Upload all 5 screenshots in order (hero first)
7. Upload small promo tile and marquee tile
8. Select category: Productivity
9. Set language: English
10. Fill in Homepage, Support, and Privacy Policy URLs
11. Complete Privacy Practices section (use prepared files)
12. Set pricing: Free (with in-app purchases)
13. Set visibility: Public
14. Submit for review

### ZIP File Contents (what to include)
```
focus-mode-blocker/
├── manifest.json
├── src/
│   ├── background/
│   ├── content/
│   ├── popup/
│   ├── options/
│   └── assets/
│       ├── icons/
│       └── sounds/
└── _locales/ (if applicable)
```

### ZIP File Exclusions
- `node_modules/`
- `.git/`
- `docs/`
- `tests/`
- `*.map` files
- `.env` files
- `README.md`
- Build config files

### Creating the ZIP
```bash
# From the project root directory
zip -r focus-mode-blocker-v1.0.0.zip \
  manifest.json \
  src/ \
  _locales/ \
  -x "*.map" \
  -x "*.DS_Store" \
  -x "__MACOSX/*"
```

Verify ZIP contents before uploading:
```bash
unzip -l focus-mode-blocker-v1.0.0.zip
```

---

## Post-Submission
- [ ] Save submission confirmation / screenshot
- [ ] Note expected review time (1-3 business days, sometimes up to 7)
- [ ] Monitor developer email for rejection notices
- [ ] Do NOT make changes during review (resets the queue)

---

## After Approval
- [ ] Test extension from the Chrome Web Store (install fresh)
- [ ] Verify all store links work (homepage, support, privacy)
- [ ] Check extension appears in search for "focus blocker", "website blocker", "pomodoro"
- [ ] Verify screenshots display correctly on store page
- [ ] Test install/uninstall cycle
- [ ] Monitor reviews and respond within 24 hours
- [ ] Check for first-day crash reports
- [ ] Announce launch on relevant channels

---

## If Rejected

### Recovery Steps
1. Read rejection reason carefully (email from CWS team)
2. Check `docs/debugging/agent5-final-qa-report.md` for common rejection fixes
3. Reference `13-REVIEW-REJECTION-RECOVERY.md` playbook
4. Fix ALL issues mentioned (not just the first — CWS only reports one at a time)
5. Increment version number in manifest.json
6. Resubmit with detailed appeal if the rejection was incorrect
7. Allow 1-3 business days for re-review

### Common Rejection Reasons for Focus/Blocker Extensions

**"Broad host permissions"**
- Justification: `<all_urls>` is required because users must be able to block ANY website they choose. The extension cannot predict which sites a user will add to their block list. Without broad host access, the core blocking functionality would not work.
- Mitigation: The privacy documentation explicitly states no data is collected from visited sites. The host permission is used solely for declarativeNetRequest URL interception.

**"Single purpose violation"**
- Justification: All features (blocking, focus timer, streak tracking, Focus Score) serve a single purpose: helping users maintain focus and productivity. Each feature directly supports distraction-free work.
- Mitigation: Ensure the description clearly ties every feature back to "focus and productivity" as the unified purpose.

**"Missing privacy policy"**
- Requirement: The privacy policy must be at a live, publicly accessible URL before submission.
- URL: https://zovo.one/privacy/focus-mode-blocker
- Action: Deploy the privacy policy page from `docs/store-assets/privacy/privacy-policy-page.md` to this URL before submitting.

**"Deceptive behavior"**
- Requirement: The block page must clearly identify the extension by name and provide a visible way to unblock or disable.
- Action: Ensure the block page shows "Blocked by Focus Mode - Blocker" and includes an option to return to settings or temporarily unblock.

**"Excessive permissions"**
- Requirement: Each permission must map to a user-visible feature.
- Action: Reference `docs/store-assets/privacy/privacy-permissions.txt` which maps all 11 permissions to specific features.

---

## Version Update Checklist (for future releases)

When publishing updates after the initial release:

- [ ] Update version in `manifest.json`
- [ ] Update changelog
- [ ] Test all existing features still work (regression)
- [ ] Test new features specifically
- [ ] Update screenshots if UI changed
- [ ] Update description if features added
- [ ] Create new ZIP (exclude same files as above)
- [ ] Upload to developer console as update
- [ ] Monitor for update-specific issues (migration, data loss)

---

## Key Dates and URLs

| Item | Value |
|------|-------|
| Extension Name | Focus Mode - Blocker |
| Version | 1.0.0 |
| Manifest Version | 3 |
| Minimum Chrome | 116 |
| Category | Productivity |
| Pricing | Free (Pro: $4.99/mo, $35.88/yr, $49.99 lifetime) |
| Developer Console | https://chrome.google.com/webstore/devconsole |
| Homepage | https://zovo.one/tools/focus-mode-blocker |
| Support | https://zovo.one/support |
| Privacy Policy | https://zovo.one/privacy/focus-mode-blocker |
| GitHub | https://github.com/theluckystrike/focus-mode-blocker |

---

*Publishing Checklist — Focus Mode - Blocker v1.0.0 — Phase 06, Agent 5*
