# Icon & Asset System — Focus Mode - Blocker

## 1. Master Icon Design System

### Brand Icon Identity
Focus Mode - Blocker's icon is part of the Zovo extension family. All Zovo icons share:
- **Base shape:** Rounded square (iOS-style) with 20-25% corner radius
- **Background:** Linear gradient #6366f1 to #4f46e5 (top-left to bottom-right)
- **Foreground:** White (#ffffff) functional symbol
- **No text, no borders, no shadows, no 3D effects**

### Focus Mode - Blocker Specific Icon
- **Symbol:** Shield with inner crosshair/target — communicates "blocking" (shield) and "focus" (crosshair)
- **Shield shape:** Simplified, geometric, with pointed bottom
- **Crosshair:** Simple circle + cross, centered within shield
- **At 16px:** Reduce to just shield silhouette (no inner detail)
- **At 32px:** Shield with minimal inner dot
- **At 48px:** Shield with simplified crosshair
- **At 128px:** Full detail — shield + crosshair + subtle gradient

### Size-Specific Specifications

| Size | Canvas | Safe Area | Symbol Size | Detail Level | Use |
|------|--------|-----------|-------------|--------------|-----|
| 16x16 | 16px | 14px | 10px | Shield silhouette only | Toolbar |
| 32x32 | 32px | 28px | 20px | Shield + center dot | Toolbar @2x |
| 48x48 | 48px | 42px | 30px | Shield + simplified crosshair | Extensions page |
| 128x128 | 128px | 112px | 80px | Full shield + crosshair + gradient | CWS, install dialog |
| 512x512 | 512px | 448px | 320px | Master source, maximum detail | Design master |

### Pixel Grid Alignment

**At 16px**, every element must land on pixel boundaries:
- Shield outer: 3px from edge (10px wide, 12px tall)
- Shield fill: Solid #6366f1 (no gradient at this size — gradients look muddy at 16px)
- Background: Transparent (no square background at 16px for toolbar)
- All strokes: 1px minimum, no sub-pixel rendering
- Shield point at bottom: Single pixel wide termination

**At 32px**:
- Shield outer: 6px from edge (20px wide, 24px tall)
- Center dot: 4px diameter, centered vertically and horizontally within shield
- Background: Transparent for toolbar use
- Gradient permitted but optional — solid #6366f1 also acceptable

**At 48px**:
- Shield outer: 9px from edge (30px wide, 36px tall)
- Crosshair simplified: Circle 12px diameter + 1px cross lines
- Background: Rounded square with gradient
- Anti-aliased edges begin at this size

**At 128px and above**:
- Full gradient background with rounded square container
- Anti-aliased edges throughout
- Subtle inner shadow on shield for depth (1px blur, 0.1 opacity black, offset 0,1)
- Crosshair full detail: Circle 32px diameter, 2px stroke, cross lines extending 8px beyond circle

### Color States

| State | Background | Symbol | Use |
|-------|-----------|--------|-----|
| Default | #6366f1 to #4f46e5 gradient | White #ffffff | Normal toolbar |
| Active (focus session running) | #10b981 to #059669 gradient | White #ffffff | During active focus |
| Disabled/Paused | #94a3b8 to #64748b gradient | White #ffffff | Extension disabled |
| Badge overlay | N/A | N/A | Chrome badge API for blocked count |

### Badge Usage

```javascript
// Show blocked count on toolbar icon
chrome.action.setBadgeText({ text: '12' });
chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });

// During active focus session — dot indicator
chrome.action.setBadgeText({ text: '\u25CF' });
chrome.action.setBadgeBackgroundColor({ color: '#10b981' });

// Clear badge
chrome.action.setBadgeText({ text: '' });
```

Badge rules:
- Badge text must never exceed 4 characters (Chrome truncates beyond that)
- Use abbreviated numbers for large counts: 1K, 2K, etc.
- Red badge (#ef4444) for blocked count — draws attention to protection activity
- Green badge (#10b981) for active session — reinforces "you are focused" state
- Never show badge text "0" — clear the badge instead

---

## 2. Icon State Management

### Dynamic Icon Switching

```javascript
// Icon path configuration for all states
const ICON_STATES = {
  default: {
    16: 'src/assets/icons/icon-16.png',
    32: 'src/assets/icons/icon-32.png',
    48: 'src/assets/icons/icon-48.png',
    128: 'src/assets/icons/icon-128.png'
  },
  active: {
    16: 'src/assets/icons/icon-active-16.png',
    32: 'src/assets/icons/icon-active-32.png',
    48: 'src/assets/icons/icon-active-48.png',
    128: 'src/assets/icons/icon-active-128.png'
  },
  disabled: {
    16: 'src/assets/icons/icon-disabled-16.png',
    32: 'src/assets/icons/icon-disabled-32.png',
    48: 'src/assets/icons/icon-disabled-48.png',
    128: 'src/assets/icons/icon-disabled-128.png'
  }
};

/**
 * Set the toolbar icon to match the current extension state.
 * @param {'default' | 'active' | 'disabled'} state
 */
function setIconState(state) {
  if (!ICON_STATES[state]) {
    console.warn(`Unknown icon state: ${state}`);
    return;
  }
  chrome.action.setIcon({ path: ICON_STATES[state] });
}
```

### State Transition Logic

```javascript
/**
 * Update icon and badge to reflect extension state.
 * Call this whenever the extension state changes.
 */
function updateIconForState(extensionState) {
  const { isEnabled, isSessionActive, blockedCount } = extensionState;

  if (!isEnabled) {
    // Extension is disabled by the user
    setIconState('disabled');
    chrome.action.setBadgeText({ text: '' });
    chrome.action.setTitle({ title: 'Focus Mode - Blocker (Disabled)' });
    return;
  }

  if (isSessionActive) {
    // Active focus session in progress
    setIconState('active');
    chrome.action.setBadgeText({ text: '\u25CF' });
    chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
    chrome.action.setTitle({ title: 'Focus Mode - Blocker (Session Active)' });
    return;
  }

  // Default state — show blocked count if any
  setIconState('default');
  if (blockedCount > 0) {
    const badgeText = blockedCount > 999 ? `${Math.floor(blockedCount / 1000)}K` : String(blockedCount);
    chrome.action.setBadgeText({ text: badgeText });
    chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
  chrome.action.setTitle({ title: 'Focus Mode - Blocker' });
}
```

### Icon Preloading

To avoid flicker during state transitions, preload icon images on service worker startup:

```javascript
// Preload all icon variants into the browser cache
async function preloadIcons() {
  const allPaths = Object.values(ICON_STATES).flatMap(state => Object.values(state));
  await Promise.all(
    allPaths.map(path => fetch(chrome.runtime.getURL(path)))
  );
}

// Call during service worker initialization
chrome.runtime.onInstalled.addListener(() => {
  preloadIcons();
});
```

---

## 3. Additional Asset Specifications

### Store Promo Assets

| Asset | Size | Content | Notes |
|-------|------|---------|-------|
| Small promo tile | 440x280 | Purple gradient bg, white shield icon at 128px centered, "Focus Mode - Blocker" in Inter 600 24px below, tagline "Block distractions. Stay focused." in Inter 400 16px below that | Text vertically centered in lower 40% |
| Marquee promo tile | 1400x560 | Purple gradient bg, left side: icon 192px + name Inter 700 48px + tagline Inter 400 24px + 3 bullet features. Right side: Popup screenshot at 380px wide with drop shadow | Left content at 10% margin, right content at 60% margin |
| Social share | 1200x630 | Purple gradient bg, centered vertically: icon 160px, name Inter 700 40px, tagline Inter 400 20px | OG image for social sharing when extension URL is shared |

### Store Promo Design Rules
- All promo images use the same gradient: #6366f1 to #4f46e5 at 135 degrees
- Text is always white (#ffffff) with Inter font
- Maintain 40px minimum margin from all edges
- PNG format, no transparency (solid gradient background)
- No device mockups — Chrome Web Store discourages them

### Block Page Assets

| Asset | Size | Purpose | Format |
|-------|------|---------|--------|
| Shield icon | 64px display size | Block page header icon, indicates protection is active | SVG, inline or `<img>` |
| Zovo logo | 80px wide | Block page footer "Built by Zovo" branding | SVG, 80x24 aspect ratio |
| Success checkmark | 24px | "Back to Work" button inline icon | SVG, single path |
| Warning triangle | 24px | "You tried to visit a blocked site" indicator | SVG, single path |

### Block Page Shield SVG

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
  <!-- Gradient background circle -->
  <defs>
    <linearGradient id="shield-grad" x1="0" y1="0" x2="64" y2="64">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#4f46e5"/>
    </linearGradient>
  </defs>
  <!-- Shield body -->
  <path d="M32 4L8 16v16c0 14.4 10.24 27.84 24 32 13.76-4.16 24-17.6 24-32V16L32 4z"
        fill="url(#shield-grad)"/>
  <!-- Crosshair circle -->
  <circle cx="32" cy="30" r="8" stroke="white" stroke-width="2" fill="none"/>
  <!-- Crosshair lines -->
  <line x1="32" y1="18" x2="32" y2="24" stroke="white" stroke-width="2"/>
  <line x1="32" y1="36" x2="32" y2="42" stroke="white" stroke-width="2"/>
  <line x1="20" y1="30" x2="26" y2="30" stroke="white" stroke-width="2"/>
  <line x1="38" y1="30" x2="44" y2="30" stroke="white" stroke-width="2"/>
  <!-- Center dot -->
  <circle cx="32" cy="30" r="2" fill="white"/>
</svg>
```

### Zovo Logo SVG

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="24" viewBox="0 0 80 24" fill="none">
  <text x="0" y="18" font-family="Inter, sans-serif" font-weight="700"
        font-size="20" fill="#6366f1" letter-spacing="-0.5">Zovo</text>
</svg>
```

Note: The production Zovo logo should be converted from text to outlined paths to avoid font dependency issues.

### Onboarding Assets

| Asset | Size | Purpose | Content Description |
|-------|------|---------|---------------------|
| Welcome illustration | 200x200 | Onboarding slide 1 — Welcome | Purple gradient bg, large white shield icon centered, subtle radiating lines suggesting protection |
| Feature demo screenshot | 300x200 | Onboarding slide 2 — Features | Cropped popup screenshot showing blocklist and focus timer, overlaid on purple-tinted background |
| Pro features graphic | 300x200 | Onboarding slide 3 — Upgrade | Split layout: left side shows free features (3 items), right side shows Pro features (5 items) with gold accent #f59e0b |

### Onboarding Design Rules
- All onboarding images have 16px rounded corners
- Background uses light brand color #e0e7ff (Zovo light)
- Accent elements use primary #6366f1
- Text within images uses Inter font, minimum 14px
- PNG format with transparency for rounded corners

---

## 4. File Structure

```
src/assets/
├── icons/
│   ├── icon-16.png               ← Toolbar (shield silhouette, no bg)
│   ├── icon-32.png               ← Toolbar @2x (shield + center dot)
│   ├── icon-48.png               ← Extensions page (shield + crosshair)
│   ├── icon-128.png              ← CWS listing (full detail)
│   ├── icon-active-16.png        ← Green variant, toolbar
│   ├── icon-active-32.png        ← Green variant, toolbar @2x
│   ├── icon-active-48.png        ← Green variant, extensions page
│   ├── icon-active-128.png       ← Green variant, CWS
│   ├── icon-disabled-16.png      ← Gray variant, toolbar
│   ├── icon-disabled-32.png      ← Gray variant, toolbar @2x
│   ├── icon-disabled-48.png      ← Gray variant, extensions page
│   ├── icon-disabled-128.png     ← Gray variant, CWS
│   └── icon.svg                  ← Master vector source (512x512 artboard)
├── images/
│   ├── shield-large.svg          ← Block page shield icon (64px display)
│   ├── zovo-logo.svg             ← Zovo wordmark for footers (80x24)
│   ├── checkmark.svg             ← Success checkmark (24px)
│   ├── warning.svg               ← Warning triangle (24px)
│   ├── onboarding-welcome.png    ← Onboarding slide 1 (200x200)
│   ├── onboarding-feature.png    ← Onboarding slide 2 (300x200)
│   └── onboarding-pro.png        ← Onboarding slide 3 (300x200)
├── promo/
│   ├── promo-small-440x280.png   ← CWS small promo tile
│   ├── promo-marquee-1400x560.png ← CWS marquee promo tile
│   └── social-share-1200x630.png  ← OG/social share image
└── sounds/
    ├── rain.ogg                  ← Ambient sound: rain
    ├── cafe.ogg                  ← Ambient sound: cafe
    └── white-noise.ogg           ← Ambient sound: white noise
```

### File Size Guidelines

| File | Target Size | Maximum |
|------|-------------|---------|
| icon-16.png | < 1 KB | 2 KB |
| icon-32.png | < 2 KB | 4 KB |
| icon-48.png | < 3 KB | 6 KB |
| icon-128.png | < 8 KB | 15 KB |
| icon.svg (master) | < 5 KB | 10 KB |
| shield-large.svg | < 2 KB | 4 KB |
| zovo-logo.svg | < 1 KB | 2 KB |
| Promo PNGs | < 200 KB each | 500 KB |
| Onboarding PNGs | < 50 KB each | 100 KB |
| Sound files (.ogg) | < 500 KB each | 1 MB |

### Image Optimization Pipeline

1. **SVG source** created in Figma or Illustrator at 512x512
2. **Export PNGs** at each required size (do not downscale from 512 — export at native size)
3. **Optimize PNGs** with `pngquant --quality=80-95 --strip` for lossy compression
4. **Verify** each PNG at actual display size in Chrome toolbar
5. **SVG cleanup** with SVGO: remove metadata, editor artifacts, unnecessary attributes

```bash
# Optimization commands
pngquant --quality=80-95 --strip --output icon-16.png icon-16-source.png
pngquant --quality=80-95 --strip --output icon-32.png icon-32-source.png
pngquant --quality=80-95 --strip --output icon-48.png icon-48-source.png
pngquant --quality=80-95 --strip --output icon-128.png icon-128-source.png

# SVG optimization
npx svgo icon.svg --multipass --pretty
npx svgo shield-large.svg --multipass --pretty
```

---

## 5. Manifest.json Icon Configuration

### Icons Section

```json
{
  "icons": {
    "16": "src/assets/icons/icon-16.png",
    "32": "src/assets/icons/icon-32.png",
    "48": "src/assets/icons/icon-48.png",
    "128": "src/assets/icons/icon-128.png"
  }
}
```

### Action Section

```json
{
  "action": {
    "default_icon": {
      "16": "src/assets/icons/icon-16.png",
      "32": "src/assets/icons/icon-32.png",
      "48": "src/assets/icons/icon-48.png",
      "128": "src/assets/icons/icon-128.png"
    },
    "default_title": "Focus Mode - Blocker",
    "default_popup": "src/popup/popup.html"
  }
}
```

### Web Accessible Resources (for block page and content scripts)

```json
{
  "web_accessible_resources": [
    {
      "resources": [
        "src/assets/images/shield-large.svg",
        "src/assets/images/zovo-logo.svg",
        "src/assets/images/checkmark.svg",
        "src/assets/images/warning.svg"
      ],
      "matches": ["<all_urls>"]
    }
  ]
}
```

### Chrome Web Store Listing Requirements
- `icons.128` is required for CWS submission
- `icons.48` is displayed on the extensions management page (`chrome://extensions`)
- `icons.16` and `icons.32` are used for the toolbar action icon
- All icon paths are relative to the extension root directory
- Icons must be PNG format (not SVG, not JPEG, not WebP)
- PNGs must be square with exact pixel dimensions matching the key

---

## 6. AI Generation Prompts

Use these prompts with image generation tools (Midjourney, DALL-E, Stable Diffusion) or vector design tools to create consistent icon assets.

### Default Icon (Purple — All Sizes)

```
A minimal, flat-design shield icon on a purple gradient background.
The shield is white, geometric, with a pointed bottom.
Inside the shield is a simple crosshair/target: a circle with four short
lines extending from it (top, bottom, left, right) and a small dot in the center.
Background is a rounded square with gradient from #6366f1 (top-left) to #4f46e5
(bottom-right). The shield is centered. No text, no borders, no shadows, no 3D
effects. Clean vector style, suitable for a browser extension toolbar icon.
Style: flat design, minimal, geometric. Colors: purple gradient background,
white symbol only.
```

### Active Icon (Green Variant)

```
Same shield + crosshair icon as above, but the background gradient changes
from #10b981 (top-left) to #059669 (bottom-right). The white shield and
crosshair remain identical. This variant indicates an "active" or "on" state.
Everything else remains the same: rounded square background, centered shield,
no text, no borders, no shadows, flat vector style.
```

### Disabled Icon (Gray Variant)

```
Same shield + crosshair icon as above, but the background gradient changes
from #94a3b8 (top-left) to #64748b (bottom-right). The white shield and
crosshair remain identical. This variant indicates a "disabled" or "paused"
state. Everything else remains the same: rounded square background, centered
shield, no text, no borders, no shadows, flat vector style.
```

### 16px Simplified Version

```
A tiny 16x16 pixel icon. White shield silhouette on transparent background.
The shield is a simple geometric shape with pointed bottom, no inner detail.
Pixel-perfect alignment, every edge lands on a pixel boundary. No anti-aliasing
at edges. Solid white fill (#ffffff). No background shape.
```

### Block Page Shield (Large SVG)

```
A 64x64 SVG shield icon with crosshair. Purple gradient fill (#6366f1 to
#4f46e5). White crosshair overlay: circle with four extending lines and
center dot. Clean vector paths, no raster elements. Suitable for display
on a webpage at 64px.
```

### Prompt Tips
- Always specify "no text" to prevent AI from adding labels
- Always specify "no 3D, no shadows, no borders" for flat design
- Include exact hex color codes in prompts
- Request "vector style" or "flat design" for clean results
- Generate at 1024x1024 minimum, then crop and resize manually
- AI-generated icons will need manual cleanup in a vector editor

---

## 7. Inline SVG for Popup & Content Scripts

For icons used within the popup HTML or injected via content scripts, use inline SVG rather than external files to avoid additional network requests.

### Shield Icon (Small, for Popup Headers)

```html
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6L12 2z"
        fill="#6366f1"/>
  <circle cx="12" cy="11" r="3" stroke="white" stroke-width="1.5" fill="none"/>
  <circle cx="12" cy="11" r="0.75" fill="white"/>
</svg>
```

### Checkmark Icon (for Success States)

```html
<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3 8l3.5 3.5L13 5" stroke="#10b981" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

### Block Icon (for Blocked Site Indicator)

```html
<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="8" cy="8" r="6" stroke="#ef4444" stroke-width="2" fill="none"/>
  <line x1="4" y1="12" x2="12" y2="4" stroke="#ef4444" stroke-width="2"/>
</svg>
```

---

## 8. Dark Mode & Theme Considerations

### Chrome Toolbar Themes
Chrome toolbars can be light (default) or dark (system dark mode or custom theme). Icons must be visible on both.

**Solution:** Use transparent backgrounds for toolbar icons (16px, 32px). The white shield symbol works on both light and dark toolbar backgrounds.

| Toolbar Background | Icon Appearance | Notes |
|-------------------|-----------------|-------|
| Light (#f1f3f4) | White shield on purple rounded square | Clearly visible |
| Dark (#292b2e) | White shield on purple rounded square | Clearly visible |
| Custom dark theme | White shield on purple rounded square | Clearly visible |

The purple (#6366f1) background on the rounded square provides sufficient contrast against any Chrome theme color.

### Block Page Theme
The block page should detect system preference and adapt:

```css
/* Default (light) block page */
.block-page {
  background: #f8fafc;
}

/* Dark mode block page */
@media (prefers-color-scheme: dark) {
  .block-page {
    background: #0f172a;
  }
  .block-page .shield-icon path {
    /* Shield keeps gradient fill — works on dark backgrounds */
  }
}
```

---

## 9. Quality Checklist

### Icon Rendering Verification
- [ ] 16px icon is recognizable at actual toolbar size (test on both macOS and Windows)
- [ ] 32px icon is crisp on retina/HiDPI displays
- [ ] 48px icon looks good on `chrome://extensions` management page
- [ ] 128px icon is detailed and professional for CWS listing page
- [ ] All sizes use exact Zovo brand colors (#6366f1, #4f46e5)
- [ ] Active (green) variant is visually distinct from default (purple) at a glance
- [ ] Disabled (gray) variant clearly indicates "off" state
- [ ] Icons work on both light and dark browser themes
- [ ] All PNGs have transparent backgrounds (verified with checkerboard preview)
- [ ] SVG master source file is clean and well-structured (no editor cruft)

### Badge Verification
- [ ] Badge text renders correctly for 1-digit, 2-digit, 3-digit, and "1K+" values
- [ ] Badge colors do not clash with icon background colors
- [ ] Badge clears properly when count reaches zero
- [ ] Green dot badge is visible during active sessions

### State Transition Verification
- [ ] `setIconState('default')` displays purple icon immediately
- [ ] `setIconState('active')` displays green icon immediately
- [ ] `setIconState('disabled')` displays gray icon immediately
- [ ] Icon state transitions do not cause flicker
- [ ] Service worker correctly updates icon on extension enable/disable
- [ ] Service worker correctly updates icon on focus session start/stop
- [ ] Icon state persists correctly after Chrome restart

### Asset Completeness
- [ ] All 12 PNG icons present (4 sizes x 3 states)
- [ ] Master SVG source file present
- [ ] Block page SVG assets present (shield, logo, checkmark, warning)
- [ ] Onboarding images present (3 slides)
- [ ] Promo images present (small, marquee, social)
- [ ] All file sizes within target limits
- [ ] All PNGs optimized with pngquant
- [ ] All SVGs optimized with SVGO

### Manifest Verification
- [ ] `manifest.json` "icons" section references correct paths
- [ ] `manifest.json` "action.default_icon" references correct paths
- [ ] `web_accessible_resources` includes block page assets
- [ ] All referenced files actually exist at the specified paths
- [ ] Extension loads without icon-related errors in `chrome://extensions`
