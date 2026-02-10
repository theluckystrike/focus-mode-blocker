# Icon Design Specification — Focus Mode - Blocker

## Icon Concept

The icon should represent **"focus"** and **"blocking"** — a shield with a focus/crosshair symbol that communicates both protection from distractions and intentional concentration.

**Recommended symbol:** A shield shape (protection/blocking) with a simplified focus target/crosshair in the center. The shield communicates "blocking distractions" while the crosshair communicates "focusing." Together they form a clear, memorable mark.

**Alternative concepts:**

1. **Shield + checkmark** — Protection combined with achievement/completion. Communicates safety and success. Slightly more generic but universally understood.
2. **Circle with diagonal line** — Universal "blocked" symbol overlaid on a distraction icon (e.g., a phone or chat bubble). Very literal but may look negative.
3. **Stylized eye + shield** — An eye (focus/attention) enclosed in a shield outline. Communicates watchful protection. Slightly more complex at small sizes.

**Chosen direction:** Option 1 (shield + crosshair) is recommended for its balance of clarity, simplicity, and scalability.

---

## Color Specification

| Element | Value | Notes |
|---------|-------|-------|
| Background gradient start | `#6366f1` | Zovo primary purple (top-left) |
| Background gradient end | `#4f46e5` | Zovo hover purple (bottom-right) |
| Gradient direction | 135 degrees | Top-left to bottom-right diagonal |
| Foreground symbol | `#ffffff` | Pure white for maximum contrast |
| Corner radius | 20-25% of icon size | Rounded square (iOS/modern app style) |

### Color Accessibility

- White (#ffffff) on #6366f1 provides a contrast ratio of approximately 4.6:1, meeting WCAG AA standards.
- The gradient should be subtle enough that the symbol remains fully legible at all points.

---

## Required Sizes

| Size | Use | Notes |
|------|-----|-------|
| **16x16** | Browser toolbar icon | Must be recognizable at tiny size — simplify to basic shield silhouette only, no inner crosshair detail |
| **32x32** | Browser toolbar @2x (Retina) | Slightly more detail than 16px — shield shape with minimal crosshair hint |
| **48x48** | Chrome extensions management page (`chrome://extensions`) | Can show shield + inner crosshair symbol clearly |
| **128x128** | Chrome Web Store listing, install dialog | Full detail, gradient clearly visible, all symbol elements rendered |
| **440px tile** | Chrome Web Store promotional tile icon | Used in store promotional materials and featured sections |
| **512x512** | Source / master design file | Design at this size first, then scale down. All detail and precision defined here |

### manifest.json Icon References

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

---

## AI Image Generation Prompt

Use the following prompt with AI image generation tools (Midjourney, DALL-E, Stable Diffusion, Ideogram, or similar):

> Generate a minimal app icon for a Chrome extension called Focus Mode - Blocker. Style: Modern, flat design with subtle gradient. Shape: Rounded square (iOS-style). Background: Purple gradient from #6366f1 to #4f46e5. Symbol: A white shield with a small crosshair/target in the center, representing focus and protection from distractions. Vibe: Professional, clean, developer-friendly. Output: 512x512 PNG with transparency. Do NOT include: text, letters, complex details, shadows, 3D effects, borders.

### Prompt Variations

**For a simpler result (if the above is too detailed):**

> Flat minimal app icon. Rounded purple square (#6366f1). White shield silhouette centered. Clean, modern, no text. 512x512 PNG.

**For a more detailed result:**

> Professional Chrome extension icon. Rounded square with purple gradient (#6366f1 to #4f46e5, 135deg). White shield outline with a crosshair reticle in the center. Flat design, no shadows, no text, no 3D effects. Transparent background outside the rounded square. 512x512 PNG.

---

## 16px Simplification Notes

At 16x16 pixels, fine details become indistinguishable. The icon must be aggressively simplified:

- **Remove** the inner crosshair/target detail entirely.
- **Keep** only the shield silhouette as a solid white shape on the purple background.
- The shield shape alone should be recognizable and distinct from other extension icons.
- Use pixel-aligned edges — no sub-pixel rendering at this size.
- Consider hand-tuning the 16px version rather than just scaling down the 512px master.
- Test the 16px icon at actual size on both light and dark browser chrome.

### Size Progression

| Size | Detail Level |
|------|-------------|
| 16px | Shield silhouette only (solid white shape) |
| 32px | Shield silhouette with subtle crosshair hint (2px lines) |
| 48px | Shield outline with clear crosshair symbol |
| 128px | Full detail — shield with gradient, crosshair with dot center, refined edges |
| 512px | Master — all detail, anti-aliased, export-ready |

---

## Design Grid & Spacing

### 512px Master Grid

- **Canvas:** 512x512 pixels
- **Safe zone:** 48px padding on all sides (icon content within 416x416 centered area)
- **Corner radius:** 102-128px (20-25% of 512)
- **Shield height:** ~260px (roughly 50% of canvas)
- **Shield width:** ~220px (slightly narrower than height for proper shield proportions)
- **Crosshair diameter:** ~80px (centered within shield)
- **Crosshair line weight:** 8-10px
- **Shield stroke weight:** If outlined style, 16-20px. If filled, solid white fill.

### Shield Shape Guidelines

The shield should be a classic heraldic shield shape — flat top with rounded/pointed bottom:

```
    ___________
   /           \
  |             |
  |             |
  |             |
   \           /
    \         /
     \       /
      \_____/
```

Keep the shape symmetrical and geometrically clean. Avoid overly ornate or medieval-looking shield shapes.

---

## Quality Checklist

- [ ] 16px version is recognizable at actual size in the browser toolbar
- [ ] 32px version is crisp on Retina/HiDPI displays
- [ ] No anti-aliasing artifacts or blurry edges at small sizes
- [ ] Colors match Zovo brand (`#6366f1` primary, `#4f46e5` secondary)
- [ ] Works on light browser themes (light gray toolbar background)
- [ ] Works on dark browser themes (dark gray/black toolbar background)
- [ ] PNG exports have transparency (no white/colored background outside rounded square)
- [ ] All 4 required sizes provided: 16, 32, 48, 128
- [ ] SVG source file created for scalability
- [ ] 512px master file archived for future edits
- [ ] Consistent with Zovo brand identity (purple gradient + white symbol)
- [ ] Icon does not contain any text or letters
- [ ] Icon is distinguishable from common browser/extension icons at a glance
- [ ] Tested in both Chrome stable and Chrome dark mode

---

## File Locations in Project

```
src/assets/icons/
├── icon-16.png      # 16x16 toolbar icon (simplified shield only)
├── icon-32.png      # 32x32 toolbar icon @2x
├── icon-48.png      # 48x48 extensions page icon
├── icon-128.png     # 128x128 store/install icon
└── icon.svg         # Scalable vector source
```

### Additional Export Files (for store assets)

```
docs/store-assets/icons/
├── icon-440.png     # 440px promotional tile
├── icon-512.png     # 512px master raster
└── icon.svg         # Copy of source SVG
```

---

## Brand Consistency Notes

- The icon is part of the **Zovo extension family**. Future Zovo extensions should use the same rounded-square shape, the same purple gradient, and a unique white symbol for each product.
- The purple gradient (`#6366f1` to `#4f46e5`) is the Zovo signature. Do not alter these colors.
- The light purple `#e0e7ff` is used in the extension UI but should **not** appear in the icon itself.
- If Zovo releases additional extensions, each icon should be immediately distinguishable by its white symbol while sharing the purple background, creating a recognizable family of icons in the toolbar.
