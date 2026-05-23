# Remove Left Panel + Artwork in Add Menu + Tools in Popover — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the left sidebar from desktop, migrate Artwork controls into the Add menu, and move the Tools section into the component library floating popover.

**Architecture:** Three isolated changes in four files. CSS grid updated first (safest to revert), then JS render removed, then the two new feature sections added. The headless `ComponentLibraryPanel` at App.js:3741 already drives the popover on all platforms — no new event wiring needed.

**Tech Stack:** Vanilla React (createElement), minified CSS, no build step required. `npm run verify` = prettier + syntax check + 22 Playwright screenshots.

---

## File Map

| File | Change |
|---|---|
| `styles.css` lines 52, 54, 57 | Workspace grid: 3→2 columns; fix sidebar-right and canvas-wrap grid-column |
| `src/App.js` line ~3674 | Don't render `<LeftSidebar>` on desktop (`isNarrowInitial` guard) |
| `src/TopbarMenus.js` | Add Artwork section to `AddMenuContent` |
| `src/LeftSidebarPanels.js` | Move Tools into popover JSX; remove from sidebar wrapper |

---

## Task 1: CSS — Collapse workspace to 2-column grid

**Files:**
- Modify: `styles.css` (lines 52, 54, 57 — minified)

**Context:** The desktop `.workspace` grid currently has three explicit columns: `292px minmax(0,1fr) 312px`. With the left sidebar removed from the DOM, that 292px column becomes dead space. Three rules need updating: the grid itself, `.sidebar-right` (was col 3, now col 2), and `.canvas-wrap` (was col 2, now col 1). Mobile sidebars use `position:fixed`, so their `grid-column` values are irrelevant on mobile.

- [ ] **Step 1: Change workspace grid-template-columns**

In `styles.css`, find and replace (these strings appear exactly once each):

```
FIND:    grid-template-columns:292px minmax(0,1fr)312px!important
REPLACE: grid-template-columns:minmax(0,1fr)312px!important
```

- [ ] **Step 2: Fix sidebar-right grid-column (3→2)**

```
FIND:    .sidebar-right{grid-column:3!important;
REPLACE: .sidebar-right{grid-column:2!important;
```

- [ ] **Step 3: Fix canvas-wrap grid-column (2→1)**

```
FIND:    .canvas-wrap{grid-column:2!important;
REPLACE: .canvas-wrap{grid-column:1!important;
```

- [ ] **Step 4: Verify**

```bash
npm run verify
```

Expected: exits 0, no output beyond "Captured 22 screenshots". No new `!important` added (you removed the 292px column, existing `!important` on the changed values were already there).

- [ ] **Step 5: Commit**

```bash
git commit -am "fix: collapse workspace to 2-column grid — remove 292px left sidebar column"
```

---

## Task 2: App.js — Skip LeftSidebar render on desktop

**Files:**
- Modify: `src/App.js` (~line 3674)

**Context:** `isNarrowInitial` is computed once at startup: `window.innerWidth <= 860`. On desktop it is `false`. Wrapping the LeftSidebar render with this flag means desktop never renders the sidebar DOM element; mobile keeps its existing closed/hidden behavior unchanged. The headless `ComponentLibraryPanel` at line 3741 already powers the popover on all platforms independently.

- [ ] **Step 1: Wrap LeftSidebar render**

Find this exact block in `src/App.js`:

```javascript
      React.createElement(LeftSidebar, {
        open: leftPanelOpen,
        onTouchStart: onDrawerSwipeStart,
        onTouchMove: onDrawerSwipeMove,
        onTouchEnd: onDrawerSwipeEnd,
        onStartPartPlacement: startPartPlacement,
      }),
```

Replace with:

```javascript
      isNarrowInitial &&
        React.createElement(LeftSidebar, {
          open: leftPanelOpen,
          onTouchStart: onDrawerSwipeStart,
          onTouchMove: onDrawerSwipeMove,
          onTouchEnd: onDrawerSwipeEnd,
          onStartPartPlacement: startPartPlacement,
        }),
```

- [ ] **Step 2: Verify**

```bash
npm run verify
```

Expected: exits 0. Desktop screenshots show canvas filling the full width left of the right sidebar, no 292px dead space.

- [ ] **Step 3: Commit**

```bash
git commit -am "feat: skip LeftSidebar render on desktop — headless ComponentLibraryPanel handles popover"
```

---

## Task 3: TopbarMenus.js — Artwork section in Add menu

**Files:**
- Modify: `src/TopbarMenus.js` — `AddMenuContent` function (lines 9–108)

**Context:** After adding an image the menu currently calls `onClose()`, hiding itself before the user can see the artwork controls. We remove that close call so the menu stays open and the Artwork section immediately appears. The section is conditional on `state.artworks.length > 0` so it's invisible when there are no images (matching the screenshot requirement). All dispatch types match what `ArtworkPanel` already uses.

- [ ] **Step 1: Replace AddMenuContent with the updated version**

Replace the entire `AddMenuContent` function (lines 9–108) with:

```javascript
function AddMenuContent({ onClose }) {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const widthMM = panelWidthMM(state.panel);
  const [largeImageWarning, setLargeImageWarning] = useState(false);
  useEffect(() => {
    if (state.artworks.length === 0) setLargeImageWarning(false);
  }, [state.artworks.length]);

  function addText() {
    dispatch({
      type: "ADD_TEXT",
      item: {
        id: crypto.randomUUID(),
        text: "TEXT",
        x: snapToGrid(widthMM / 2, state.grid.size),
        y: snapToGrid(PANEL_HEIGHT_MM / 2, state.grid.size),
        rotation: 0,
        fontSizeMm: 3,
        align: "center",
        layer: "foreground",
        locked: false,
        visible: true,
        opacity: 1,
        fontFamily: TEXT_FONT_OPTIONS[0].value,
      },
    });
    onClose();
  }

  function handleArtworkFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setLargeImageWarning(dataUrl.length > 2_000_000);
      const img = new window.Image();
      img.onload = () => {
        dispatch({
          type: "ADD_ARTWORK",
          item: {
            id: crypto.randomUUID(),
            name: file.name,
            imageDataUrl: dataUrl,
            x: snapToGrid(widthMM / 2, state.grid.size),
            y: snapToGrid(PANEL_HEIGHT_MM / 2, state.grid.size),
            width: widthMM,
            height: PANEL_HEIGHT_MM,
            naturalW: img.naturalWidth || 100,
            naturalH: img.naturalHeight || 100,
            rotation: 0,
            opacity: 1,
            locked: false,
            visible: true,
            layer: "background",
            preserveAspectRatio: false,
            notes: "Auto-fit to panel on import",
          },
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  const allVisible =
    state.artworks.length > 0 && state.artworks.every((a) => a.visible);

  return React.createElement(
    React.Fragment,
    null,
    React.createElement("div", { className: "menu-title" }, "Add"),
    React.createElement(
      "div",
      { className: "menu-grid" },
      React.createElement(
        "button",
        {
          className: "primary",
          onClick: () => {
            onClose();
            AppCommands.openComponentLibraryPicker();
          },
        },
        "Component picker",
      ),
      React.createElement(
        "button",
        {
          onClick: () =>
            document.getElementById("topbar-artwork-import-input")?.click(),
        },
        "+ Add Image",
      ),
      React.createElement("button", { onClick: addText }, "+ Add Text"),
    ),
    React.createElement("input", {
      id: "topbar-artwork-import-input",
      type: "file",
      accept: ".png,.jpg,.jpeg,.svg,.webp",
      style: { display: "none" },
      onChange: handleArtworkFile,
    }),
    state.artworks.length > 0 &&
      React.createElement(
        React.Fragment,
        null,
        React.createElement(
          "div",
          {
            style: {
              borderTop: "1px solid rgba(215,196,155,0.13)",
              margin: "8px 0 4px",
            },
          },
        ),
        React.createElement(
          "div",
          {
            className: "menu-title",
            style: { paddingTop: 4 },
          },
          "Artwork",
        ),
        largeImageWarning &&
          React.createElement(
            "div",
            {
              className: "warning-item warn",
              style: { marginBottom: 6, fontSize: 11 },
            },
            "Large image — JSON/SVG export may be slow.",
          ),
        React.createElement(
          "div",
          { className: "field-row" },
          React.createElement(
            "label",
            null,
            React.createElement("input", {
              type: "checkbox",
              checked: state.clipArtworkToPanel,
              onChange: (e) =>
                dispatch({
                  type: "SET_CLIP_ARTWORK",
                  value: e.target.checked,
                }),
            }),
            " Clip artwork to panel",
          ),
        ),
        React.createElement(
          "div",
          { className: "field-row" },
          React.createElement(
            "label",
            null,
            React.createElement("input", {
              type: "checkbox",
              checked: state.ignoreLockedArtworkClicks,
              onChange: (e) =>
                dispatch({
                  type: "SET_IGNORE_LOCKED_CLICKS",
                  value: e.target.checked,
                }),
            }),
            " Ignore locked artwork clicks",
          ),
        ),
        React.createElement(
          "div",
          { className: "field-row" },
          React.createElement(
            "label",
            null,
            React.createElement("input", {
              type: "checkbox",
              checked: state.showArtworkInDrillView,
              onChange: (e) =>
                dispatch({
                  type: "SET_SHOW_ARTWORK_IN_DRILL",
                  value: e.target.checked,
                }),
            }),
            " Show artwork in drill view",
          ),
        ),
        state.showArtworkInDrillView &&
          React.createElement(
            "div",
            { className: "field-row" },
            React.createElement("label", null, "Drill artwork opacity"),
            React.createElement("input", {
              type: "number",
              step: 0.05,
              min: 0,
              max: 1,
              value: state.drillArtworkOpacity,
              onChange: (e) =>
                dispatch({
                  type: "SET_DRILL_ARTWORK_OPACITY",
                  value: Math.max(0, Math.min(1, +e.target.value)),
                }),
            }),
          ),
        React.createElement(
          "div",
          { className: "field-row" },
          React.createElement(
            "label",
            null,
            React.createElement("input", {
              type: "checkbox",
              checked: allVisible,
              onChange: () =>
                dispatch({
                  type: "SET_ALL_ARTWORK_VISIBLE",
                  visible: !allVisible,
                }),
            }),
            " Show all artwork",
          ),
        ),
        state.artworks.map((a) =>
          React.createElement(
            "div",
            {
              key: a.id,
              style: {
                display: "flex",
                alignItems: "center",
                gap: 3,
                padding: "3px 4px",
                borderBottom: "1px solid #222",
                fontSize: 10,
              },
            },
            React.createElement(
              "span",
              {
                style: {
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  color: "#aaa",
                },
              },
              a.name,
            ),
            React.createElement(
              "button",
              {
                title: a.visible ? "Hide" : "Show",
                style: {
                  padding: "1px 3px",
                  fontSize: 9,
                  background: "transparent",
                  border: "1px solid #333",
                  color: a.visible ? "#aaa" : "#555",
                },
                onClick: () =>
                  dispatch({
                    type: "UPDATE_ARTWORK",
                    id: a.id,
                    patch: { visible: !a.visible },
                  }),
              },
              a.visible ? "●" : "○",
            ),
            React.createElement(
              "button",
              {
                title: a.locked ? "Unlock" : "Lock",
                style: {
                  padding: "1px 3px",
                  fontSize: 9,
                  background: "transparent",
                  border: "1px solid #333",
                  color: a.locked ? "#ffa000" : "#555",
                },
                onClick: () =>
                  dispatch({
                    type: "UPDATE_ARTWORK",
                    id: a.id,
                    patch: { locked: !a.locked },
                  }),
              },
              a.locked ? "🔒" : "🔓",
            ),
            React.createElement(
              "button",
              {
                title: "Delete",
                style: {
                  padding: "1px 3px",
                  fontSize: 9,
                  background: "transparent",
                  border: "1px solid #333",
                  color: "#f55",
                },
                onClick: () =>
                  dispatch({ type: "DELETE_ARTWORK", id: a.id }),
              },
              "✕",
            ),
          ),
        ),
      ),
  );
}
```

- [ ] **Step 2: Verify syntax**

```bash
npm run verify
```

Expected: exits 0. Open the Add menu in the browser — no artworks yet, so no Artwork section visible. Add an image → menu stays open → Artwork section appears with checkboxes and one artwork row.

- [ ] **Step 3: Commit**

```bash
git commit -am "feat: artwork controls in Add menu — stays open after image import, shows settings when artworks present"
```

---

## Task 4: LeftSidebarPanels.js — Tools inside popover, remove from sidebar wrapper

**Files:**
- Modify: `src/LeftSidebarPanels.js`

**Context:** The `ComponentLibraryPanel` function renders two things: a sidebar wrapper (non-headless path, lines ~663–787) and a floating popover (portal, lines ~457–661). The Tools `<details>` currently lives only in the sidebar wrapper. We move it into the popover (above the grid, below the controls row) and delete it from the wrapper. The `parts-import-input` hidden file input moves into the popover too. All state (`replaceMode`, `resetPartsArmed`, etc.) is shared — no new state needed.

- [ ] **Step 1: Add Tools section inside the popover JSX**

Find the existing popover controls block (unique string):

```javascript
          React.createElement(
            "div",
            { className: "component-library-popover-controls" },
```

After the closing of that div (after the closing `),` of the entire controls div), and before the memory-row conditional, add the Tools details. The exact insertion point is after this block ends:

```javascript
            ),
          ),
          (recentKeys.length > 0 || favoriteKeys.length > 0) &&
```

Replace that transition with:

```javascript
            ),
          ),
          React.createElement(
            "details",
            { className: "library-tools-compact" },
            React.createElement("summary", null, "Tools"),
            React.createElement(
              "label",
              {
                className: "library-replace-compact",
                title:
                  "When enabled, clicking a part replaces the selected components while keeping their ref/label/position/rotation.",
              },
              React.createElement("input", {
                type: "checkbox",
                checked: replaceMode,
                disabled: state.selected.length === 0,
                onChange: (e) => setReplaceMode(e.target.checked),
              }),
              "Replace selected",
            ),
            React.createElement(
              "div",
              { className: "library-action-grid compact" },
              React.createElement(
                "button",
                { onClick: saveSelectedAsPart },
                "Save selected",
              ),
              React.createElement(
                "button",
                {
                  onClick: exportParts,
                  disabled: state.customParts.length === 0,
                },
                "Export custom",
              ),
              React.createElement(
                "button",
                { onClick: exportAuditCSV },
                "Export CSV",
              ),
              React.createElement(
                "button",
                {
                  onClick: () =>
                    document
                      .getElementById("popover-parts-import-input")
                      ?.click(),
                },
                "Import",
              ),
              React.createElement(
                "button",
                {
                  className: `danger inline-confirm-button ${resetPartsArmed ? "armed" : ""}`,
                  disabled: state.customParts.length === 0,
                  title: resetPartsArmed
                    ? "Click again to reset custom parts"
                    : "First click arms this action",
                  onClick: () => {
                    if (!resetPartsArmed) {
                      setResetPartsArmed(true);
                      return;
                    }
                    dispatch({ type: "RESET_CUSTOM_PARTS" });
                    setResetPartsArmed(false);
                  },
                },
                resetPartsArmed ? "Confirm reset" : "Reset",
              ),
              React.createElement("input", {
                id: "popover-parts-import-input",
                type: "file",
                accept: ".json",
                style: { display: "none" },
                onChange: importParts,
              }),
            ),
          ),
          (recentKeys.length > 0 || favoriteKeys.length > 0) &&
```

Note: the import input id changed from `"parts-import-input"` to `"popover-parts-import-input"` to avoid ID collision with the sidebar wrapper version (which we remove in the next step).

- [ ] **Step 2: Remove Tools section from sidebar wrapper**

Find and delete this block from the non-headless return path (sidebar wrapper, after the launcher button):

```javascript
    React.createElement(
      "details",
      { className: "library-tools-compact library-tools-footer" },
      React.createElement("summary", null, "Tools"),
      React.createElement(
        "label",
        {
          className: "library-replace-compact",
          title:
            "When enabled, clicking a part replaces the selected components while keeping their ref/label/position/rotation.",
        },
        React.createElement("input", {
          type: "checkbox",
          checked: replaceMode,
          disabled: state.selected.length === 0,
          onChange: (e) => setReplaceMode(e.target.checked),
        }),
        "Replace selected",
      ),
      React.createElement(
        "div",
        { className: "library-action-grid compact" },
        React.createElement(
          "button",
          { onClick: saveSelectedAsPart },
          "Save selected",
        ),
        React.createElement(
          "button",
          { onClick: exportParts, disabled: state.customParts.length === 0 },
          "Export custom",
        ),
        React.createElement(
          "button",
          { onClick: exportAuditCSV },
          "Export CSV",
        ),
        React.createElement(
          "button",
          {
            onClick: () =>
              document.getElementById("parts-import-input").click(),
          },
          "Import",
        ),
        React.createElement(
          "button",
          {
            className: `danger inline-confirm-button ${resetPartsArmed ? "armed" : ""}`,
            disabled: state.customParts.length === 0,
            title: resetPartsArmed
              ? "Click again to reset custom parts"
              : "First click arms this action",
            onClick: () => {
              if (!resetPartsArmed) {
                setResetPartsArmed(true);
                return;
              }
              dispatch({ type: "RESET_CUSTOM_PARTS" });
              setResetPartsArmed(false);
            },
          },
          resetPartsArmed ? "Confirm reset" : "Reset",
        ),
        React.createElement("input", {
          id: "parts-import-input",
          type: "file",
          accept: ".json",
          style: { display: "none" },
          onChange: importParts,
        }),
      ),
    ),
```

After deletion, the sidebar wrapper should end with the launcher button closing then `popover,` then the outer div's closing paren.

- [ ] **Step 3: Verify**

```bash
npm run verify
```

Expected: exits 0. Open component library popover → collapsible "Tools" section visible above the component grid (below search+category). Expanding it shows Replace selected checkbox and action buttons.

- [ ] **Step 4: Commit**

```bash
git commit -am "feat: move component library Tools into popover; remove from sidebar wrapper"
```

---

## Spec Coverage Check

| Spec requirement | Task |
|---|---|
| Remove left sidebar from desktop (DOM + grid) | Task 1 (CSS) + Task 2 (App.js) |
| Artwork controls appear in Add menu when artworks exist | Task 3 |
| Artwork section absent when no artworks | Task 3 (conditional on `state.artworks.length > 0`) |
| Menu stays open after adding image | Task 3 (removed `onClose()` from file handler) |
| Large image warning in Add menu | Task 3 |
| Tools section in component library popover | Task 4 |
| Tools above grid, after filters | Task 4 (insertion point after controls div) |
| Tools removed from sidebar wrapper | Task 4 (Step 2) |
| No new `!important` | CSS change narrows selector scope only; Tasks 2-4 are JS |
| `npm run verify` passes | Verified after each task |
