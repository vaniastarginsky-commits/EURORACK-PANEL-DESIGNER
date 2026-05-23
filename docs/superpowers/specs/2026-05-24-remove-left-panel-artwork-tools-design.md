# Design: Remove Left Panel + Artwork in Add Menu + Tools in Component Browser

**Date:** 2026-05-24  
**Branch:** ux-polish  
**Status:** Approved

---

## Goal

Remove the left sidebar from desktop (it was already removed from mobile). Migrate its two functional sections — Artwork controls and Component Library Tools — into the topbar Add menu and the component library popover respectively.

---

## Part 1: Remove Left Sidebar on Desktop

### What changes

**`src/App.js`**
- Wrap `<LeftSidebar>` in a condition: only render when `isNarrowInitial` is true (mobile).
- The headless `<ComponentLibraryPanel headless={true}>` at line 3741 already exists and handles the library popover via custom events — no change needed there.
- `leftPanelOpen` state and its associated touch-swipe handlers can remain for mobile; they are already gated on mobile paths.

**`styles.css`**
- Find the canonical desktop workspace grid rule (PROJECT_MAP: lines 44–92, `.workspace` selector with `grid-template-columns: 292px minmax(0,1fr) 312px`).
- Change it to `minmax(0,1fr) 312px` — the 292px left column is removed.
- No `!important` needed if editing the existing canonical rule directly.
- The `.sidebar-left` element will no longer be rendered on desktop, so no CSS hide rule is needed.

### What does NOT change
- Mobile: `<LeftSidebar>` still renders when `isNarrowInitial=true`, driven by `leftPanelOpen`.
- Headless `ComponentLibraryPanel` continues to power the popover on all platforms.
- Right sidebar: untouched.

---

## Part 2: Artwork Controls in Add Menu

### Location
`src/TopbarMenus.js` → `AddMenuContent` component.

### Behavior changes

1. **`handleArtworkFile` no longer calls `onClose()`** after dispatching `ADD_ARTWORK`.  
   Reason: the menu stays open so the user immediately sees the Artwork section appear with the new image listed.

2. **Large image warning state** moves into `AddMenuContent`:  
   `const [largeImageWarning, setLargeImageWarning] = useState(false)`  
   Set to `true` when `dataUrl.length > 2_000_000`, reset when `state.artworks.length === 0`.

3. **Artwork section** — rendered after the buttons grid, conditional on `state.artworks.length > 0`:

   ```
   ── divider ──────────────────────────────
   ARTWORK  (section label)
   [Large image warning — if set]
   ☑ Clip artwork to panel
   ☑ Ignore locked artwork clicks (locked images don't block selection)
   ☐ Show artwork in drill view
     [Drill artwork opacity input — only when showArtworkInDrillView]
   ☑ Show all artwork
   ── per-artwork rows ─────────────────────
   ▼ panel-symbols.png   ● 🔒 ×
   ```

   Each per-artwork row: disclosure triangle (visibility toggle renders as ●/○), lock icon button, delete (×) button — identical to the existing ArtworkPanel rows in LeftSidebarPanels.js.

4. **State wiring** — same dispatches as `ArtworkPanel`:
   - `SET_CLIP_ARTWORK`, `SET_IGNORE_LOCKED_CLICKS`, `SET_SHOW_ARTWORK_IN_DRILL`, `SET_DRILL_ARTWORK_OPACITY`, `SET_ALL_ARTWORK_VISIBLE`, `UPDATE_ARTWORK` (visible/locked), `REMOVE_ARTWORK`.

### Scope
- Only file: `src/TopbarMenus.js`
- Do not touch `src/LeftSidebarPanels.js` ArtworkPanel (it stays for mobile via LeftSidebar)

---

## Part 3: Tools Section in Component Library Popover

### Location
`src/LeftSidebarPanels.js` → inside the `popover` JSX (the `ReactDOM.createPortal(...)` block), after `.component-library-popover-controls`, before the memory-row/grid.

### Structure

```
.component-library-popover-controls  (search + category — existing)
<details class="library-tools-compact">        ← NEW
  <summary>Tools</summary>
  <label class="library-replace-compact">
    <input type="checkbox" checked={replaceMode} ...> Replace selected
  </label>
  <div class="library-action-grid compact">
    [Save selected] [Export custom]
    [Export CSV]    [Import]
    [Reset]
  </div>
  <input id="parts-import-input" type="file" ...>  ← move here from sidebar wrapper
</details>
memory-row (recent/favorites — existing, conditional)
component-icon-grid  (existing)
```

### State
All state (`replaceMode`, `resetPartsArmed`, `saveSelectedAsPart`, `exportParts`, `exportAuditCSV`, `importParts`) is already present in `ComponentLibraryPanel` — it's shared between the sidebar wrapper and the popover. No new state needed.

### Sidebar wrapper cleanup
After moving Tools into the popover, remove the `<details className="library-tools-compact library-tools-footer">` block from the non-headless sidebar wrapper section (lines ~712–784 of LeftSidebarPanels.js). This avoids duplicated Tools when the left sidebar is visible on mobile.

Wait — mobile still uses LeftSidebar. The sidebar's `ComponentLibraryPanel` (non-headless) shows the launcher button + Tools. If we move Tools into the popover, mobile gets Tools in the popover. The non-headless sidebar wrapper Tools section becomes redundant.

**Decision:** Remove the `<details>` Tools block from the sidebar wrapper section. Tools live only inside the popover from now on (accessible on all platforms via the popover).

### Affected files
- `src/LeftSidebarPanels.js` only

---

## CSS impact

| Area | Change | New `!important`? |
|---|---|---|
| Workspace grid | Remove `292px` column from desktop canonical rule | No |
| Popover | Existing `.library-tools-compact` styles already exist | No |
| Sidebar | No new rules; column simply absent | No |

---

## Files to touch

| File | Change |
|---|---|
| `src/App.js` | Conditional render of `<LeftSidebar>` (desktop skip) |
| `src/TopbarMenus.js` | Artwork section in `AddMenuContent` |
| `src/LeftSidebarPanels.js` | Tools moved into popover JSX; removed from sidebar wrapper |
| `styles.css` | Workspace grid: `292px minmax(0,1fr) 312px` → `minmax(0,1fr) 312px` for desktop |

## Files NOT to touch

- `src/LeftSidebar.js` — shell unchanged; still renders on mobile
- `src/RightSidebar.js`, `src/RightSidebarPanels.js` — untouched
- Any export dialogs, canvas, overlays

---

## Success criteria

1. Desktop: no left sidebar visible or occupying grid space; canvas fills the left area.
2. Add menu: after adding an image, menu stays open and Artwork section appears immediately below the buttons.
3. Add menu: when no artworks exist, Artwork section is absent.
4. Component library popover: "Tools" collapsible section visible above the grid on all platforms.
5. `npm run verify` passes with no new `!important`.
