# CSS Rewrite: styles.css → Domain-Organized, Zero !important

**Date:** 2026-05-24  
**Branch:** ux-polish  
**Status:** Approved

## Problem

`styles.css` grew to 4905 lines through 26 patch sessions (v376–v508). Each session added a new block using `!important` to override previous `!important` declarations. This created an unreadable cascade arms race that blocked further design work.

We removed all 1984 lines containing `!important`, leaving 2921 lines. The app is mostly functional (ThemeEngine.js handles CSS variables dynamically), but three critical layout properties are now missing:
- `grid-template-rows: auto 1fr` on app-shell (topbar + content layout)
- `grid-template-columns: 280px 1fr 280px` on workspace (sidebar + canvas layout)  
- `overflow: auto` on sidebars (scroll broken)

## Approach

**Hybrid rewrite**: use the stripped file (2921 lines) as a reference skeleton, write a new clean CSS organized by domain. One pass, no incremental verification — run `npm run verify` once at the end.

**Not restoring the backup.** The backup had the !important problem by design.

## File Structure

11 sections in order:

```
/* ===== 1. Reset & Base ===== */
html, body, #root, *, button, input, label, canvas, svg

/* ===== 2. App Shell ===== */
.app-shell → display: grid; grid-template-rows: auto 1fr   ← CRITICAL

/* ===== 3. Workspace Layout ===== */
.workspace → display: grid; grid-template-columns: 280px 1fr 280px   ← CRITICAL
Collapsed sidebar state via --left-col / --right-col vars (v448 pattern)

/* ===== 4. Topbar ===== */
.topbar, .brand, topbar buttons, history group, inspect button

/* ===== 5. Sidebars ===== */
.sidebar-left, .sidebar-right + overflow: auto   ← CRITICAL
Sidebar sections, inputs, form rows within sidebars

/* ===== 6. Canvas Area ===== */
.canvas-wrap, overflow: hidden, grid overlay, zoom controls

/* ===== 7. Canvas Rails & HUD ===== */
.canvas-tool-rail, .component-info-hud card

/* ===== 8. Modals & Dialogs ===== */
Generic modal → Export modal (v439 layout preserved) → Templates modal → Confirm dialog

/* ===== 9. Components ===== */
Cards, tabs/segmented controls, form rows, popovers, dropdowns, layer manager (v440)

/* ===== 10. Mobile ===== */
@media (max-width: 900px) — all mobile rules in one place
Mobile dock, collapsed columns, mobile topbar

/* ===== 11. Utilities ===== */
Scrollbars, animations, .sr-only, misc
```

## What Comes From Where

**Kept from stripped file (2921 lines):**
- Base reset (html, *, button, input) — lines 4–16
- Export modal layout — v439 section (well-written, ~200 lines)
- Layer manager layout — v440 section
- Modal centering — v441 section
- Component HUD card — v442 section
- Most component-level CSS (cards, tabs, form rows)
- Scrollbars and utilities

**Added back from backup (what was only in !important lines):**
- App shell `grid-template-rows: auto 1fr`
- Workspace `grid-template-columns: 280px 1fr 280px`
- Sidebars `overflow: auto`
- Sidebar collapsed state (--left-col / --right-col pattern from v448)
- Mobile dock position and layout
- Topbar consolidated flexbox

## Constraints

- Zero `!important` declarations
- Zero version-block comments (v422, v448, etc.)
- No new cascade debt
- Must pass `npm run verify` (21 screenshots)
- ThemeEngine.js owns all CSS variable values — CSS file has no `:root` block

## Expected Outcome

| Metric | Before | After |
|--------|--------|-------|
| Lines | 4905 | ~1200 |
| !important | 2700 | 0 |
| Patch blocks | 26 | 0 |
| Domains | mixed | 11 sections |
