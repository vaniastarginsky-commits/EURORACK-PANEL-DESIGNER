# Appearance Settings — Design Spec

**Date:** 2026-05-24  
**Branch:** ux-polish  
**Status:** Approved

---

## Goal

Add a UI appearance settings modal that lets users radically change the look of the interface — not just colors. Settings persist across sessions.

---

## Dimensions of control

Four independent axes, each with discrete options:

| Axis | Options |
|------|---------|
| Shape | Sharp (0px) / Soft (3px) / Rounded (8px) / Pill (20px) |
| Font | Inter / Monospace / System |
| Density | Compact / Default / Comfortable |
| Visual Style | Flat / Bordered / Glass |

---

## Architecture: CSS Custom Properties Override

All theme dimensions are expressed as CSS custom properties on `:root`. JavaScript writes values directly to `document.documentElement.style`. No React state involved — pure CSS, instant, no re-renders.

### New CSS variables added to `:root`

```css
:root {
  --theme-radius: 0px;
  --theme-font: Inter, "SF Pro Text", system-ui, sans-serif;
  --theme-tracking: 0.14em;
  --theme-weight-brand: 850;
  --theme-btn-height: 32px;
  --theme-section-gap: 8px;
  --theme-sidebar-pad: 10px;
  --theme-surface-blur: 0px;
  --theme-surface-sat: 1;
}
```

### Breaking change to existing CSS

The global `*,*::before,*::after { border-radius: 0!important }` rule is replaced with:

```css
*,*::before,*::after { border-radius: var(--theme-radius)!important }
```

This is the only structural change to existing CSS. All other rules remain.

Visual style modes use two vars:

- **Flat** (default): `--theme-surface-blur: 0px`, `--theme-border-opacity: 0.13`
- **Bordered**: `--theme-surface-blur: 0px`, `--theme-border-opacity: 0.30` — stronger visible borders on sidebars and panels
- **Glass**: `--theme-surface-blur: 6px`, `--theme-surface-sat: 0.70`, `--theme-border-opacity: 0.18` — backdrop-filter blur on sidebars/popovers

`--theme-border-opacity` is added to `:root` and replaces the hardcoded `.13` opacity in the main sidebar/panel border rule.

---

## Presets

Five named presets. Each preset is a complete JS object with CSS variable values.

| Preset | Accent | Radius | Font | Notes |
|--------|--------|--------|------|-------|
| Industrial | Gold `214,170,88` | 0px | Inter | Current default |
| Minimal | Neutral `180,180,180` | 3px | Inter | Less tracking, quieter |
| Retro | Green `80,230,100` | 0px | Monospace | Terminal feel |
| Light | Warm brown `160,100,30` | 3px | Inter | Light background |
| Synthwave | Purple `200,60,220` | 4px | Inter | Dark + glass |

---

## ThemeEngine.js

New standalone IIFE file (`src/ThemeEngine.js`), modelled after `ViewContrast.js`.

**Responsibilities:**
- Read persisted state from `localStorage` on boot, apply immediately
- `apply(presetKey, overrides)` — write CSS vars to `document.documentElement.style`
- `save(presetKey, overrides)` — serialize to `localStorage` as JSON
- `reset()` — restore Industrial defaults, clear overrides
- Listen for `panel-designer:open-appearance` custom event to open the modal

**localStorage key:** `panel-designer:appearance`

**Stored shape:**
```json
{ "preset": "industrial", "overrides": { "--theme-radius": "4px" } }
```

Overrides are applied on top of the preset. Selecting a new preset clears overrides.

---

## Appearance Modal

### Entry point

New button in the topbar (palette/sliders icon), adjacent to existing topbar buttons. On mobile: accessible via the Help popover menu (existing menu already has a button row at the bottom).

### Layout

```
┌─────────────────────────────────────────────────┐
│  APPEARANCE                               [✕]   │
├─────────────────────────────────────────────────┤
│  PRESET                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │▓▓▓▓▓▓▓▓▓│ │░░░░░░░░░│ │▒▒▒▒▒▒▒▒▒│        │
│  │Industrial│ │ Minimal  │ │  Retro   │        │
│  │ [active] │ │          │ │          │        │
│  └──────────┘ └──────────┘ └──────────┘        │
│  ┌──────────┐ ┌──────────┐                     │
│  │░░░░░░░░░│ │▓░▓░▓░▓░▓│                     │
│  │  Light   │ │Synthwave │                     │
│  └──────────┘ └──────────┘                     │
│                                                 │
│  SHAPE                                          │
│  [Sharp ●] [Soft] [Rounded] [Pill]             │
│                                                 │
│  FONT                                           │
│  [Inter ●] [Monospace] [System]                │
│                                                 │
│  DENSITY                                        │
│  [Compact] [Default ●] [Comfortable]           │
│                                                 │
│  VISUAL STYLE                                   │
│  [Flat ●] [Bordered] [Glass]                   │
│                                                 │
│                          [Reset to default]     │
└─────────────────────────────────────────────────┘
```

### Behavior

- Preset cards: top 60% = solid color swatch (using the preset's `--ui-bg` + `--ui-gold-rgb` accent strip), bottom 40% = label text
- Modal uses existing `.app-native-modal-backdrop` + `.app-native-modal-card` pattern
- Modal is semi-transparent so real UI is visible behind it
- Clicking a preset: applies immediately, clears overrides, saves
- Clicking a tweak: applies immediately over current preset, saves
- If tweaks differ from any preset, no preset is highlighted
- Reset: restores Industrial + default tweaks, saves
- No confirm/cancel — all changes are live

### Implementation file

`src/AppearanceModal.js` — standalone IIFE, appended to DOM on first open (lazy). Does not use React.

---

## Files

| File | Action |
|------|--------|
| `src/ThemeEngine.js` | New — theme state, apply/save/reset |
| `src/AppearanceModal.js` | New — modal DOM + interaction |
| `styles.css` | Edit — add `--theme-*` vars to `:root`; replace border-radius rule |
| `index.html` | Edit — add `<script>` tags for ThemeEngine and AppearanceModal |
| `src/Topbar.js` | Edit — add appearance button |
| `src/appCommands.js` | Edit — add `openAppearance()` command |

---

## Constraints

- No new `!important` beyond what replaces the existing border-radius rule
- No React state — both new files are plain JS IIFEs
- No new CSS cascade debt — `--theme-*` vars consumed only in `:root` defaults and targeted overrides
- `npm run verify` must pass after implementation
