# Synthwave Full Neon — Design Spec

**Date:** 2026-05-24

## Goal

Make the Synthwave preset in the ThemeEngine look dramatically different from the default Industrial preset: deep purple radial gradient on the canvas, scanlines overlay, neon brand glow, active-button glow, panel drop-shadow — matching the reference screenshot the user showed.

## What Changes

### ThemeEngine.js

`apply(presetKey, style, overrides)` currently sets `root.dataset.style` but not `root.dataset.preset`. Add:

```js
root.dataset.preset = presetKey;
root.dataset.glow = glow ? 'on' : 'off';
```

`glow` is a new boolean stored alongside `preset` and `style` in localStorage. Default: preset's `defaultGlow` (Synthwave → `true`, all others → `false`).

Add `defaultGlow` to each preset definition. Add `glow` to `load()`, `save()`, and expose `PRESETS[key].defaultGlow`.

### AppearanceModal.js

Add a "Glow effects" segmented control (On / Off) that only renders when the selected preset has `defaultGlow: true` (i.e. Synthwave). It calls `ThemeEngine.save(preset, style, overrides, glow)`.

### styles.css — !important reductions (2 removals)

1. Line 2 `*,*::before,*::after{...text-shadow:none!important}` → `text-shadow:none` (no !important)
   - Reason: allows `[data-preset="synthwave"] .app-title { text-shadow: ... }` to work without specificity hacks
   - Risk: any pre-existing text-shadow from legacy CSS re-surfaces; caught by `npm run verify`

2. Lines 1830-1831 inside `@media(min-width:901px)`:
   `display:none!important; content:none!important` → `display:none; content:none`
   - Reason: `[data-preset="synthwave"] .canvas-wrap::after` has higher specificity (attr + class > class alone) and can override without !important
   - Non-synthwave presets on desktop: rule still applies (display:none wins by specificity)

### styles.css — new Synthwave section (end of file)

```css
/* === Synthwave preset atmosphere === */
[data-preset="synthwave"] .canvas-wrap {
  background: var(--ui-bg);
}
[data-preset="synthwave"] .canvas-wrap::after {
  content: '';
  display: block;
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,.10) 3px, rgba(0,0,0,.10) 4px),
    radial-gradient(ellipse at 50% 55%, rgba(160,40,220,.75) 0%, rgba(100,10,180,.50) 25%, rgba(40,5,80,.28) 55%, transparent 75%);
}
[data-preset="synthwave"] .canvas-wrap > div:first-child {
  z-index: 1;
  filter: drop-shadow(0 0 18px rgba(120,30,200,.45));
}
/* Glow effects — togglable via Appearance modal */
[data-preset="synthwave"][data-glow="on"] .app-title {
  text-shadow: 0 0 14px rgba(200,60,220,.9), 0 0 28px rgba(160,40,220,.5);
}
[data-preset="synthwave"][data-glow="on"] button.active,
[data-preset="synthwave"][data-glow="on"] .canvas-tool-btn.active {
  box-shadow: 0 0 10px rgba(var(--ui-gold-rgb),.55), 0 0 20px rgba(var(--ui-gold-rgb),.25);
}
```

## CSS Policy Compliance

- No new `!important`
- Removes 2 existing `!important` (both within canvas/global-reset surface, both justified)
- `[data-preset][data-glow]` compound attribute selector beats existing class rules by specificity
- `canvas-wrap::after` pseudo-element is free on mobile; desktop block loses `!important` but wins by specificity for non-synthwave presets
