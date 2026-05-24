# MINIMAL Preset — Match Reference Design

**Date:** 2026-05-24  
**Scope:** `src/ThemeEngine.js` — `minimal` preset vars only

## Goal

Update the MINIMAL appearance preset to match the visual color hierarchy of `reference/panel-designer.html`. The reference uses clearly separated dark gray levels for bg/panel/surface, which gives more visual depth than the current near-black palette.

## What changes

Only the `minimal` preset object in ThemeEngine.js. No CSS edits, no AppearanceModal changes.

### Color mapping (reference → vars)

| ThemeEngine var | Current | New | Source in reference |
|---|---|---|---|
| `swatchBg` | `#0a0a0a` | `#111111` | `body { background: #111 }` |
| `--ui-bg` | `#0a0a0a` | `#111111` | body bg |
| `--ui-bg-2` | `#0e0e0e` | `#0d0d0d` | `.canvas-wrap { background: #0d0d0d }` |
| `--ui-panel` | `#111111` | `#1a1a1a` | `.sidebar-left/right { background: #1a1a1a }` |
| `--ui-panel-2` | `#151515` | `#222222` | `.toolbar { background: #222 }` |
| `--ui-surface` | `#1a1a1a` | `#2a2a2a` | `button { background: #2a2a2a }` |
| `--ui-surface-hover` | `#1f1f1f` | `#333333` | `button:hover { background: #333 }` |
| `--ui-text-soft` | `#c0c0c0` | `#cccccc` | `button { color: #ccc }` |
| `--ui-muted` | `#808080` | `#888888` | `label { color: #888 }` |

### What stays the same

- Accent: `--ui-gold: #b0b0b0` (gray, intentionally NOT cyan from reference)
- `--ui-gold-rgb`, `--ui-gold-alt-rgb`, `--ui-line-rgb`
- `--theme-radius: 3px`, `--theme-tracking: 0.08em`, `--theme-font`
- `--theme-border-opacity: 0.13` (CSS uses own hardcoded opacities)
- `--theme-btn-height: 30px`, `--theme-section-gap: 6px`
- `swatchAccent: rgb(180,180,180)` (gray swatch preview)

## Verification

After change: switch to MINIMAL preset and confirm sidebars/panels are visibly lighter than bg, surface (buttons) are clearly visible above panel.
