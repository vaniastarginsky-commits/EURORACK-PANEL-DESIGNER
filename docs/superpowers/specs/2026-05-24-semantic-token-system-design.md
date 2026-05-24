# Semantic Token System — Design Spec
**Date:** 2026-05-24  
**Branch:** ux-polish  
**Status:** Approved

## Problem

`styles.css` contains hundreds of hardcoded hex values (e.g. `#f1e4cd`, `#050505`, `rgba(28,22,13,.82)`) that are copies of the Industrial preset palette. When a user switches presets or moves the accent hue picker, these hardcoded values do not update — so buttons, tabs, inputs, sidebar, and topbar look identical across all presets.

## Goal

Every color in the UI must come from a CSS variable. No hardcoded hex or rgb() values anywhere in `styles.css` except for truly fixed values (e.g. `--ui-danger` red, transparent, white/black at 0 or 100%).

## Approach: Two-Layer Token System

### Layer 1 — Primitives (ThemeEngine, already exists, no changes needed)

ThemeEngine sets these per preset on `document.documentElement`:

```
--ui-bg / --ui-bg-2
--ui-panel / --ui-panel-2
--ui-surface / --ui-surface-hover
--ui-text / --ui-text-soft / --ui-muted
--ui-gold / --ui-gold-2 / --ui-gold-rgb / --ui-gold-alt-rgb / --ui-gold-soft
--ui-line-rgb / --ui-line / --ui-line-soft / --ui-line-strong
--ui-danger / --ui-danger-rgb
--theme-radius / --theme-font / --theme-tracking / --theme-weight-brand
--theme-btn-height / --theme-section-gap / --theme-surface-blur
--theme-surface-sat / --theme-border-opacity
```

Accent hue picker already overrides `--ui-gold`, `--ui-gold-2`, `--ui-gold-rgb`, `--ui-gold-alt-rgb` at runtime.

### Layer 2 — Semantic Tokens (new, added to CSS `:root`)

Semantic tokens are pure CSS — computed references to primitives. ThemeEngine does not set them. When a primitive changes, all semantic tokens cascade automatically.

#### Buttons
```css
--ui-btn-bg:              var(--ui-surface);
--ui-btn-text:            var(--ui-text-soft);
--ui-btn-border:          rgba(var(--ui-line-rgb), var(--theme-border-opacity));
--ui-btn-hover-bg:        var(--ui-surface-hover);
--ui-btn-hover-text:      var(--ui-text);
--ui-btn-hover-border:    rgba(var(--ui-gold-rgb), .34);
--ui-btn-active-bg:       rgba(var(--ui-gold-rgb), .10);
--ui-btn-active-text:     var(--ui-text);
--ui-btn-active-border:   rgba(var(--ui-gold-rgb), .58);
--ui-btn-disabled-bg:     var(--ui-bg-2);
--ui-btn-disabled-text:   var(--ui-muted);
--ui-btn-danger-bg:       rgba(var(--ui-danger-rgb), .12);
--ui-btn-danger-text:     var(--ui-text-soft);
```

#### Inputs / Select
```css
--ui-input-bg:            var(--ui-panel);
--ui-input-text:          var(--ui-text);
--ui-input-border:        rgba(var(--ui-line-rgb), .20);
--ui-input-focus-border:  var(--ui-gold-2);
--ui-input-focus-shadow:  rgba(var(--ui-gold-rgb), .40);
--ui-input-caret:         var(--ui-gold-2);
```

#### Sidebar / Panels
```css
--ui-sidebar-bg:          var(--ui-panel);
--ui-sidebar-text:        var(--ui-text-soft);
--ui-sidebar-label:       var(--ui-muted);
--ui-sidebar-border:      rgba(var(--ui-line-rgb), var(--theme-border-opacity));
--ui-section-header-bg:   var(--ui-panel-2);
--ui-section-header-text: var(--ui-text-soft);
```

#### Topbar
```css
--ui-topbar-bg:           var(--ui-panel);
--ui-topbar-text:         var(--ui-text-soft);
```

## Hardcoded → Token Mapping

### Buttons

| Hardcoded value | Semantic token |
|---|---|
| `#050505`, `#070707` (btn bg) | `var(--ui-btn-bg)` |
| `#ddd5c6`, `#9d9688` (btn text) | `var(--ui-btn-text)` |
| `#11100e` (hover bg) | `var(--ui-btn-hover-bg)` |
| `#f4ead8` (hover text) | `var(--ui-btn-hover-text)` |
| `rgba(28,22,13,.82)` (active bg) | `var(--ui-btn-active-bg)` |
| `#f1e4cd`, `#efe7d8`, `#eee7da` (active text) | `var(--ui-btn-active-text)` |
| `#050505` (disabled bg) | `var(--ui-btn-disabled-bg)` |
| `#4c4943` (disabled text) | `var(--ui-btn-disabled-text)` |
| `#170807` (danger bg) | `var(--ui-btn-danger-bg)` |
| `#efc2bc` (danger text) | `var(--ui-btn-danger-text)` |
| `#e9cf9a` (warning text) | `var(--ui-gold-2)` |

### Inputs

| Hardcoded value | Semantic token |
|---|---|
| Hardcoded input backgrounds | `var(--ui-input-bg)` |
| Hardcoded input text | `var(--ui-input-text)` |
| Hardcoded focus colors | `var(--ui-input-focus-border)` / `var(--ui-input-focus-shadow)` |

### Sidebar / Topbar

All hardcoded surface colors in `.inspector`, `.sidebar`, `.layer-manager`, topbar mapped to `--ui-sidebar-*` and `--ui-topbar-*`.

## What Does NOT Change

- `ThemeEngine.js` — no changes
- PRESET definitions — no changes
- Accent hue logic — already correct, will work automatically once CSS uses vars
- `--ui-danger` family — danger colors are intentionally fixed (not theme-dependent)
- `data-preset=synthwave` atmosphere CSS (canvas glow, scanlines) — already using vars

## Files Touched

- `styles.css` — only file changed

## Files NOT Touched

- `ThemeEngine.js`
- `AppearanceModal.js`
- Any JS/React files

## Success Criteria

1. `npm run verify` passes — all 21 screenshots match (Industrial preset is default, visual output unchanged)
2. No new `!important` introduced
3. Python grep for `color:#[0-9a-fA-F]` and `background:#[0-9a-fA-F]` in button/input/sidebar/topbar rules returns 0 hardcoded hits in targeted areas
4. Switching presets visibly changes button colors, tab colors, input borders, sidebar tone
5. Moving accent hue picker updates active button highlight, input focus color, active tab indicator

## Constraints

- No new `!important` (CSS Design Policy)
- Do not reformat `styles.css` globally (minified, leave structure intact)
- Do not touch unrelated selectors
- Run `npm run verify` after changes
