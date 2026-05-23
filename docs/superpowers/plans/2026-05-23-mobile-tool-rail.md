# Mobile Tool Rail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mobile bottom dock with a collapsible left-side vertical rail identical in style to the desktop `CanvasToolRail`.

**Architecture:** Make `CanvasToolRail` visible and compact on mobile by removing its CSS `display:none` and adding mobile-specific sizing rules. Add `Add` and `Multi` buttons to the rail, add collapse/restore logic (variant C — small chevron). Hide `CanvasQuickAddDock` unconditionally by changing its early-return guard to always return null.

**Tech Stack:** React (createElement), plain CSS media queries, existing `AppCommands` global.

---

## Files

| File | Change |
|------|--------|
| `src/CanvasToolRail.js` | Add icons, props, collapse state, new buttons |
| `styles.css` | Remove mobile `display:none`; add compact sizing + restore button CSS |
| `src/MobileDock.js` | Change guard so `CanvasQuickAddDock` returns null on mobile |
| `src/App.js` | Add `onOpenComponentLibrary` prop to `CanvasToolRail` |

---

## Task 1: Add icons + new buttons + collapse to CanvasToolRail

**Files:**
- Modify: `src/CanvasToolRail.js`

### Step 1 — Add `add`, `multi`, `hide` to the ICON object

In `src/CanvasToolRail.js`, the `ICON` object ends with `help:` and then `};`. Add three new icons **before** the closing `};`:

```js
  // existing last entry:
  help: toolIcon([
    "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",
    React.createElement("circle", {
      key: "dot",
      cx: "12",
      cy: "17",
      r: "0.5",
      fill: "currentColor",
    }),
  ]),
  // ADD THESE:
  add: toolIcon("M12 8v8M8 12h8", {
    extra: React.createElement("circle", {
      key: "c",
      cx: "12",
      cy: "12",
      r: "9",
    }),
  }),
  multi: toolIcon([
    "M3 3h7v7H3z",
    "M14 3h7v7h-7z",
    "M3 14h7v7H3z",
    "M14 17h7M17 14v7",
  ]),
  hide: toolIcon("M15 18l-6-6 6-6"),
};
```

- [ ] Apply the edit above.

### Step 2 — Add `onOpenComponentLibrary` to function signature

The current signature ends with `onAddText,`. Add the new prop:

```js
function CanvasToolRail({
  leftPanelOpen,
  rightPanelOpen,
  onToggleLeftPanel,
  onToggleRightPanel,
  touchMode,
  onSetTouchMode,
  onFitView,
  snapSettings,
  onSnapSettingsChange,
  clearanceMode,
  onToggleClearanceMode,
  showSafeZones,
  onToggleSafeZones,
  onOpenShortcuts,
  onAddText,
  onOpenComponentLibrary,   // ← ADD THIS
}) {
```

- [ ] Apply the edit above.

### Step 3 — Add `collapsed` state

After the existing `const [menuTop, setMenuTop] = useState(0);` line, add:

```js
  const [collapsed, setCollapsed] = useState(false);
```

- [ ] Apply the edit above.

### Step 4 — Add collapsed early return

Add this block **just before** the `return React.createElement(React.Fragment, ...)` at the end of the function (after all hooks and helper function definitions):

```js
  if (collapsed) {
    return React.createElement(
      "button",
      {
        className: "canvas-tool-rail-restore",
        onClick: () => setCollapsed(false),
        onMouseDown: (e) => e.stopPropagation(),
        onTouchStart: (e) => e.stopPropagation(),
        title: "Show tools",
      },
      "›",
    );
  }
```

- [ ] Apply the edit above.

### Step 5 — Modify the `<nav>` children: add Add, Multi, Hide; add class to Left

The nav currently starts with `command("Left", ...)`. Replace the entire nav children block with the updated version below. Key changes:
- `Add` button at the top
- CSS class `canvas-tool-left-btn` added to `Left` (hidden on mobile via CSS)
- `Multi` button inserted between `Edit` and `Ruler`
- Spacer div + `Hide` button at the bottom

Replace from `command("Left", ICON.left,` through `command("Help", ICON.help,` including the closing paren and comma, with:

```js
      command("Add", ICON.add, {
        onClick: () => {
          setOpenMenu(null);
          onOpenComponentLibrary?.();
        },
      }),
      command("Left", ICON.left, {
        className: `canvas-tool-left-btn${leftPanelOpen ? " active" : ""}`,
        onClick: () => {
          setOpenMenu(null);
          onToggleLeftPanel();
        },
      }),
      command("Right", ICON.right, {
        className: rightPanelOpen ? "active" : "",
        onClick: () => {
          setOpenMenu(null);
          onToggleRightPanel();
        },
      }),
      React.createElement("div", { className: "canvas-tool-separator" }),
      command("Undo", ICON.undo, {
        disabled: state.history.length === 0,
        onClick: () => {
          setOpenMenu(null);
          dispatch({ type: "UNDO" });
        },
      }),
      command("Redo", ICON.redo, {
        disabled: state.future.length === 0,
        onClick: () => {
          setOpenMenu(null);
          dispatch({ type: "REDO" });
        },
      }),
      React.createElement("div", { className: "canvas-tool-separator" }),
      command("Edit", ICON.edit, {
        className: touchMode === "edit" ? "active" : "",
        onClick: () => setMode("edit"),
      }),
      command("Multi", ICON.multi, {
        className: touchMode === "select" ? "active" : "",
        onClick: () => setMode(touchMode === "select" ? "edit" : "select"),
      }),
      command("Ruler", ICON.ruler, {
        className: touchMode === "ruler" ? "active" : "",
        onClick: () => setMode("ruler"),
      }),
      React.createElement("div", { className: "canvas-tool-separator" }),
      command("Text", ICON.text, {
        onClick: () => {
          setOpenMenu(null);
          onAddText?.();
        },
      }),
      command("View", ICON.view, {
        className: openMenu === "view" ? "active" : "",
        onClick: (e) => toggleMenu("view", e),
      }),
      command("Snap", ICON.snap, {
        className: openMenu === "snap" ? "active" : "",
        onClick: (e) => toggleMenu("snap", e),
      }),
      command("Fit", ICON.fit, {
        onClick: () => {
          setOpenMenu(null);
          onFitView();
        },
      }),
      command("Tone", ICON.tone, {
        onClick: () => AppCommands.toggleViewContrast(),
      }),
      command("Safe", ICON.safe, {
        className: showSafeZones ? "active" : "",
        onClick: () => {
          setOpenMenu(null);
          onToggleSafeZones();
        },
      }),
      command("Clr", ICON.clr, {
        className: clearanceMode ? "active" : "",
        onClick: () => {
          setOpenMenu(null);
          onToggleClearanceMode();
        },
      }),
      command("Help", ICON.help, {
        onClick: () => {
          setOpenMenu(null);
          onOpenShortcuts();
        },
      }),
      React.createElement("div", { className: "canvas-tool-spacer" }),
      command("Hide", ICON.hide, {
        className: "canvas-tool-hide-btn",
        onClick: () => setCollapsed(true),
      }),
```

- [ ] Apply the edit above.

- [ ] **Commit**

```bash
git add src/CanvasToolRail.js
git commit -m "feat: add Add/Multi/Hide buttons and collapse state to CanvasToolRail"
```

---

## Task 2: Mobile CSS — compact rail + restore chevron

**Files:**
- Modify: `styles.css`

### Step 1 — Remove `display: none` from mobile media query

At lines 3776-3779, the `@media (max-width: 900px)` block contains:

```css
  .canvas-tool-rail,
  .canvas-tool-popover {
    display: none !important;
  }
```

Replace it with nothing (delete those 4 lines entirely). The rail and popover will now be visible on mobile; the next step adds compact sizing.

- [ ] Apply the deletion above.

### Step 2 — Add compact mobile CSS immediately after the `@media (max-width: 900px)` closing `}` (around line 3780)

Append a new rule block right after the `}` that closes the 900px media query:

```css
/* v-mobile-tool-rail: compact rail on mobile, restore chevron */
@media (max-width: 900px) {
  .canvas-tool-rail {
    left: 3px;
    top: 42px;
    bottom: 3px;
    width: 32px;
  }

  .canvas-tool-button {
    width: 28px !important;
    height: 20px !important;
    min-height: 20px !important;
    grid-template-rows: 12px 7px !important;
    padding: 1px 0 1px !important;
  }

  .canvas-tool-icon svg {
    width: 10px !important;
    height: 10px !important;
  }

  .canvas-tool-label {
    font-size: 4.5px !important;
  }

  .canvas-tool-popover {
    left: 40px !important;
    width: min(340px, calc(100vw - 50px)) !important;
  }

  .canvas-tool-left-btn {
    display: none !important;
  }

  .canvas-tool-spacer {
    flex: 1;
    min-height: 4px;
  }

  .canvas-tool-rail-restore {
    position: fixed;
    left: 3px;
    top: 42px;
    z-index: 1210;
    width: 12px;
    height: 30px;
    background: linear-gradient(180deg, rgba(20, 16, 9, .93), rgba(4, 4, 4, .97));
    border: 1px solid rgba(215, 196, 155, .22);
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    color: rgba(215, 196, 155, .8);
    cursor: pointer;
    padding: 0;
    line-height: 1;
  }
}

@media (min-width: 901px) {
  .canvas-tool-hide-btn,
  .canvas-tool-rail-restore,
  .canvas-tool-spacer {
    display: none !important;
  }
}
```

- [ ] Apply the addition above.

- [ ] **Commit**

```bash
git add styles.css
git commit -m "feat: mobile compact canvas-tool-rail CSS"
```

---

## Task 3: Hide CanvasQuickAddDock on mobile

**Files:**
- Modify: `src/MobileDock.js:469`

### Step 1 — Change the viewport guard

At line 469, the current guard is:

```js
  if (!isMobileDockViewport) return null;
```

Change it to:

```js
  return null; // replaced by CanvasToolRail on mobile
```

- [ ] Apply the edit above.

- [ ] **Commit**

```bash
git add src/MobileDock.js
git commit -m "feat: hide CanvasQuickAddDock — replaced by CanvasToolRail on mobile"
```

---

## Task 4: Wire onOpenComponentLibrary in App.js

**Files:**
- Modify: `src/App.js` (around line 3735 — the closing `},` of the CanvasToolRail props object)

### Step 1 — Add the prop

In the `React.createElement(CanvasToolRail, { ... })` call, add after the `onAddText` prop (before the closing `}`):

```js
        onOpenComponentLibrary: () =>
          AppCommands.openComponentLibraryPicker(),
```

The `onAddText` prop block ends with `},` followed by `}),`. Insert before the final `}),`:

```js
        onAddText: () => {
          // ... existing onAddText code ...
        },
        onOpenComponentLibrary: () =>
          AppCommands.openComponentLibraryPicker(),   // ← ADD THIS
      }),
```

- [ ] Apply the edit above.

- [ ] **Commit**

```bash
git add src/App.js
git commit -m "feat: pass onOpenComponentLibrary to CanvasToolRail"
```

---

## Task 5: Verify

- [ ] Run verify:

```bash
npm run verify
```

Expected: all screenshots pass, no new failures. The mobile canvas area (if covered) should show no bottom dock. Desktop screenshots should be unchanged.

- [ ] If any desktop screenshot fails due to the new Add/Multi/Hide buttons appearing on desktop, check that `@media (min-width: 901px) { .canvas-tool-hide-btn, .canvas-tool-spacer { display: none !important; } }` is present and that the desktop rail width/layout is unaffected.

- [ ] Manual mobile check (resize browser to ≤900px or use DevTools device mode):
  - Rail appears on left side, compact
  - All 16 buttons visible without scrolling
  - `Left` button absent on mobile
  - `Add` opens component library picker
  - `Multi` toggles touchMode between edit and select
  - `‹ Hide` collapses rail to `›` chevron
  - `›` chevron restores rail
  - Bottom dock is gone
  - View and Snap popovers open to the right of the rail
