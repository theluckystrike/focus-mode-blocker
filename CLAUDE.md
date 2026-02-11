# Focus Mode Blocker — Build Rules

## CRITICAL: This project builds a WORKING Chrome extension.

Every task, phase, or prompt MUST result in actual source code written to `src/`.

- Write `.js`, `.html`, `.css`, `.json` files — NEVER create `.md` documentation files
- Always check existing code in `src/` before writing new code
- Every change must leave the extension loadable in `chrome://extensions`
- `manifest.json` must exist at project root and be valid MV3
- Code goes in `src/`, NOT in `docs/`

See `../BUILD-RULES.md` for full build rules.

## Project Structure

```
manifest.json
src/
├── background/service-worker.js
├── popup/popup.html, popup.js, popup.css
├── content/content.js
├── options/options.html, options.js
└── assets/icons/
```

## What This Extension Does

Focus Mode Blocker — blocks distracting websites during focus sessions. Core features:
- Block list of distracting sites
- Focus timer / session management
- Popup UI to start/stop focus mode
- Content script to intercept and block pages
- Options page for managing blocked sites
