# Mobile Tool Rail — Design Spec
**Date:** 2026-05-23
**Branch:** ux-polish

---

## Summary

Replace the mobile bottom dock (`CanvasQuickAddDock`) with a collapsible left-side vertical rail that is visually identical to the desktop `CanvasToolRail`. The rail collapses to a small `›` chevron anchored top-left (variant C).

---

## Goals

- Mobile toolbar looks and feels identical to desktop (same icon+label style, same dark rail)
- All essential tools reachable from the rail in one screen, no scrolling
- Rail can be dismissed to maximise canvas space, restored with one tap
- Bottom dock removed — no duplicate toolbars

---

## Button Set (top → bottom)

| Button | Action | Note |
|--------|--------|------|
| **Add** | Opens component library picker | NEW — was in bottom dock |
| **Right** | Toggle right sidebar | kept from desktop |
| *(separator)* | | |
| **Undo** | Undo | |
| **Redo** | Redo | |
| *(separator)* | | |
| **Edit** | touchMode = edit | |
| **Multi** | touchMode = select | NEW — was in bottom dock |
| **Ruler** | touchMode = ruler | |
| *(separator)* | | |
| **Text** | Add text item | |
| **View** | Open view popover | |
| **Snap** | Open snap popover | |
| **Fit** | Fit panel to viewport | |
| **Tone** | Toggle view contrast | |
| **Safe** | Toggle safe zones | |
| **Clr** | Toggle clearance mode | |
| **Help** | Open shortcuts overlay | |
| *(spacer — pushes Hide to bottom)* | | |
| **‹ Hide** | Collapse the rail | at bottom of rail |

**Removed:** `Left` panel toggle (not useful on mobile — left sidebar takes full screen on mobile anyway).

---

## Collapsed State

- The rail disappears completely
- A `›` chevron tab (10px wide × 28px tall) stays anchored at top-left, same position as the rail top
- Tapping it re-expands the rail
- Collapsed state is local component state (`useState`), not persisted

---

## Visual Spec

### Mobile rail dimensions (new CSS under `@media (max-width: 900px)`)

| Property | Mobile value | Desktop value |
|----------|-------------|---------------|
| Rail width | `32px` | `64px` (via `--pd-rail-button`) |
| Button height | `20px` | `42px` |
| Icon size | `10px × 10px` | `18px × 18px` |
| Label font-size | `4.5px` | `8.5px` |
| Rail left offset | `3px` | `calc(var(--pd-rail-left, 300px) + 7px)` |
| Rail top | `var(--pd-topbar-h, 42px)` | `var(--pd-rail-top, 66px)` |

### Popover position on mobile
The `.canvas-tool-popover` left position must be updated for the narrower rail:
- Mobile: `left: calc(32px + 8px)` = `40px` from viewport left

---

## Affected Files

### `src/CanvasToolRail.js`
1. Add `const [collapsed, setCollapsed] = useState(false)` local state
2. **Left button**: hide on mobile via CSS (`canvas-tool-left-btn` class + `display:none` in mobile media query). Do NOT remove from JS — desktop still uses it.
3. Add `Add` button — calls `onOpenComponentLibrary?.()` (new prop)
4. Add `Multi` button — calls `onSetTouchMode(touchMode === "select" ? "edit" : "select")`; active when `touchMode === "select"`
5. Add `‹ Hide` button at bottom (inside the rail, pushed down by a flex spacer)
6. When `collapsed === true`, render only the `›` chevron restore button instead of the full rail

### `src/App.js`
1. Pass `onOpenComponentLibrary` prop to `CanvasToolRail` — calls `AppCommands.openComponentLibraryPicker()`
2. Keep `CanvasQuickAddDock` render but it self-hides via the `isMobileDockViewport` internal guard being overridden — see MobileDock change below

### `src/MobileDock.js` (`CanvasQuickAddDock`)
- Add a `disabled` prop (or rename `hidden` → works already). Simplest: in `CanvasQuickAddDock`, when on mobile viewport, return `null` always (the rail replaces it).
- Implementation: change the `isMobileDockViewport` guard to return `null` unconditionally on mobile — the new rail takes over.

### `styles.css`

**New rules under `@media (max-width: 900px)`:**
```css
/* Remove the existing display:none for .canvas-tool-rail */
/* Add compact sizing */
.canvas-tool-rail {
  left: 3px;
  top: var(--pd-topbar-h, 42px);
  width: 32px;
}
.canvas-tool-button {
  height: 20px;
  min-height: 20px;
  grid-template-rows: 12px 8px;
}
.canvas-tool-icon svg { width: 10px; height: 10px; }
.canvas-tool-label { font-size: 4.5px; }
.canvas-tool-popover {
  left: 44px;
}
```

**Bottom dock**: hidden by JS (`CanvasQuickAddDock` returns `null` on mobile). No extra CSS needed — no new `!important`.

---

## What Does NOT Change

- Desktop `CanvasToolRail` layout, widths, button heights — untouched
- `CanvasQuickAddDock` sheets (Part inspector, View, More) — these become inaccessible on mobile in this pass; a follow-up can add them elsewhere
- No new `!important` except the `.mobile-main-dock` hide (which overrides the existing `display:flex !important` from the mobile reset block at line 41 of styles.css)

---

## Out of Scope

- Mobile Part inspector sheet, View sheet, More tools — deferred
- Persisting collapsed state across sessions
- One-hand mode adjustments

---

## Verification

- `npm run verify` must pass (no screenshot regressions on desktop)
- Manual mobile check: rail shows on ≤900px viewport, collapses, re-expands
- Desktop: no visual change
