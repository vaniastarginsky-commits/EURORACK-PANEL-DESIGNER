# Text Inline Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Text button to CanvasToolRail, enable double-click inline editing of text items directly on the canvas, and open the right panel with label focused on double-click of a component label.

**Architecture:** `editingTextId` state in App.js drives an absolutely-positioned `<input>` overlay that is positioned via `svgRef.current.getScreenCTM()`. `TextLayer` hides the SVG `<text>` when its item is being edited. Double-click on the SVG is routed through a new `onSVGDoubleClick` prop. Component labels get `data-label-component-id` so the double-click handler can focus the Label field in the right panel.

**Tech Stack:** React (createElement), plain JS, SVG DOM API (`getScreenCTM()`), existing project patterns (no new dependencies).

---

## File Map

| File | Change |
|---|---|
| `src/CanvasToolRail.js` | Add `onAddText` prop + `Text` button after Ruler |
| `src/Canvas.js` | Add `data-label-component-id` on component label `<text>`; add `editingTextId` prop to `TextLayer` (hides SVG text while editing); add `onDoubleClick: onSVGDoubleClick` on SVG element; add `onSVGDoubleClick` to `SVGCanvas` prop list |
| `src/App.js` | Add `editingTextId` state; `enterTextEdit(id)`, `addTextAndEdit()`, `onSVGDoubleClick` handler; inline editor overlay render; wire new props to `SVGCanvas` and `CanvasToolRail` |
| `src/RightSidebarComponentProperties.js` | Add `data-label-input="1"` to Label `<input>` |

---

## Task 1 — Component label data attribute + right panel label focus

Gives double-clicking a component label its own data attribute and hooks the existing `e.detail >= 2` branch to focus the Label field.

**Files:**
- Modify: `src/Canvas.js` ~line 1825
- Modify: `src/RightSidebarComponentProperties.js` ~line 127
- Modify: `src/App.js` ~line 1583

- [ ] **Step 1: Add `data-label-component-id` to the component label `<text>` element**

In `src/Canvas.js`, the component label is rendered starting around line 1819:
```js
c.label &&
(() => {
  const label = getComponentLabelLayout(
    { ...c, x: cx, y: cy },
    panelWidthMM,
  );
  return React.createElement(
    "text",
    {
      x: label.x,
      y: label.y,
      textAnchor: label.anchor,
      dominantBaseline:
        label.baseline === "middle" ? "middle" : undefined,
      fontSize: label.fontSize,
      fill: isErr ? "#ff9a9a" : "#d6d9dc",
      stroke: "rgba(0,0,0,0.55)",
      strokeWidth: 0.35,
      paintOrder: "stroke fill",
    },
    c.label,
  );
})(),
```

Add `"data-label-component-id": c.id` to the props object:
```js
return React.createElement(
  "text",
  {
    "data-label-component-id": c.id,
    x: label.x,
    y: label.y,
    textAnchor: label.anchor,
    dominantBaseline:
      label.baseline === "middle" ? "middle" : undefined,
    fontSize: label.fontSize,
    fill: isErr ? "#ff9a9a" : "#d6d9dc",
    stroke: "rgba(0,0,0,0.55)",
    strokeWidth: 0.35,
    paintOrder: "stroke fill",
    style: { cursor: "text" },
  },
  c.label,
);
```

- [ ] **Step 2: Add `data-label-input` to the Label field in RightSidebarComponentProperties**

In `src/RightSidebarComponentProperties.js` around line 127:
```js
React.createElement("input", {
  type: "text",
  "data-label-input": "1",
  value: c.label,
  onChange: (e) => patch({ label: e.target.value }),
}),
```

- [ ] **Step 3: In `onSVGMouseDown`, after the existing `e.detail >= 2` → `openComponentPropertiesPanel()` call, add label focus**

In `src/App.js` around line 1583, the existing branch is:
```js
if (e.detail >= 2) {
  e.preventDefault();
  dispatch({ type: "SELECT", ids: selectionIds, additive: false });
  if (isTouchSynthetic) AppCommands.openMobileQuickLabelEdit();
  else openComponentPropertiesPanel();
  setDragging(null);
  setDragPreview(null);
  setDragStartPositions(null);
  return;
}
```

Replace the `else openComponentPropertiesPanel()` line with:
```js
else {
  openComponentPropertiesPanel();
  if (e.target.closest("[data-label-component-id]")) {
    window.setTimeout(() => {
      const inp = document.querySelector("[data-label-input]");
      if (inp) { inp.focus(); inp.select(); }
    }, 80);
  }
}
```

- [ ] **Step 4: Verify syntax**

```bash
node --check src/Canvas.js && node --check src/RightSidebarComponentProperties.js && node --check src/App.js && echo "OK"
```
Expected: `OK`

- [ ] **Step 5: Commit**

```bash
git add src/Canvas.js src/RightSidebarComponentProperties.js src/App.js
git commit -m "feat: component label double-click opens right panel with label focused"
```

---

## Task 2 — Text button in CanvasToolRail

Adds a one-shot action button `Text / T` to the tool rail.

**Files:**
- Modify: `src/CanvasToolRail.js`
- Modify: `src/App.js` (wire the prop)

- [ ] **Step 1: Add `onAddText` prop to `CanvasToolRail`**

In `src/CanvasToolRail.js`, extend the destructured props at line 2:
```js
function CanvasToolRail({
  leftPanelOpen,
  rightPanelOpen,
  onToggleLeftPanel,
  onToggleRightPanel,
  touchMode,
  onSetTouchMode,
  onFitView,
  onResetView,
  snapSettings,
  onSnapSettingsChange,
  clearanceMode,
  onToggleClearanceMode,
  showSafeZones,
  onToggleSafeZones,
  onOpenProductionCheck,
  onOpenShortcuts,
  onAddText,
}) {
```

- [ ] **Step 2: Add the Text button after the Ruler button**

In `src/CanvasToolRail.js` around line 135, after the `command("Ruler", ...)` call and before `command("View", ...)`, insert:
```js
command("Text", "T", {
  onClick: () => {
    setOpenMenu(null);
    onAddText?.();
  },
}),
```

- [ ] **Step 3: Wire `onAddText` in App.js**

In `src/App.js`, find the `React.createElement(CanvasToolRail, {` block (around line 3494) and add after the existing props:
```js
onAddText: () => {
  const id = crypto.randomUUID();
  dispatch({
    type: "ADD_TEXT",
    item: {
      id,
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
  setEditingTextId(id);
},
```

Note: `setEditingTextId` is defined in Task 3. Add this prop after Task 3 is done, or add a temporary stub: `onAddText: () => {}` for now and update after Task 3.

- [ ] **Step 4: Verify syntax**

```bash
node --check src/CanvasToolRail.js && node --check src/App.js && echo "OK"
```
Expected: `OK`

- [ ] **Step 5: Commit**

```bash
git add src/CanvasToolRail.js src/App.js
git commit -m "feat: add Text button to CanvasToolRail"
```

---

## Task 3 — `editingTextId` state + TextLayer overlay hiding

Adds the state and makes TextLayer hide the SVG text element while it is being edited inline.

**Files:**
- Modify: `src/App.js`
- Modify: `src/Canvas.js`

- [ ] **Step 1: Add `editingTextId` state in App.js**

In `src/App.js`, after the `ruler` state (around line 43):
```js
const [editingTextId, setEditingTextId] = useState(null);
```

- [ ] **Step 2: Add `editingTextId` prop to `TextLayer` in Canvas.js**

In `src/Canvas.js`, the `TextLayer` component signature (line 1468):
```js
const TextLayer = React.memo(function TextLayer({
  items,
  layer,
  selectedText,
  textDragPreview,
  viewMode,
  editingTextId,
}) {
```

- [ ] **Step 3: Use `editingTextId` to hide the SVG text element while editing**

In `TextLayer`, the `<text>` element (around line 1498) currently renders `t.text` without any editing-aware logic. Update the `<g>` element's style to hide when actively editing:

```js
return React.createElement(
  "g",
  {
    key: t.id,
    "data-text-id": t.id,
    transform: `rotate(${t.rotation}, ${x}, ${y})`,
    style: {
      cursor: t.locked ? "default" : "move",
      opacity: editingTextId === t.id ? 0 : 1,
    },
  },
  // ... rest unchanged
```

- [ ] **Step 4: Pass `editingTextId` to both `TextLayer` calls in SVGCanvas**

There are two `TextLayer` instantiations in `SVGCanvas`, around lines 3045 and 3228 (background and foreground layers). First, add `editingTextId` to `SVGCanvas` props (around line 2694):

```js
function SVGCanvas({
  svgRef,
  zoom,
  pan,
  // ... existing props ...
  showSafeZones = false,
  editingTextId,
  onSVGDoubleClick,
}) {
```

Then update both `React.createElement(TextLayer, { ... })` calls to pass the prop:
```js
React.createElement(TextLayer, {
  items: state.textItems,
  layer: "background",
  selectedText: state.selectedText,
  textDragPreview: textDragPreview,
  viewMode: state.viewMode,
  editingTextId: editingTextId,
}),
```
(Same for the foreground `TextLayer` call.)

- [ ] **Step 5: Pass `editingTextId` from App.js to SVGCanvas**

In `src/App.js`, in the `React.createElement(SVGCanvas, { ... })` block (around line 3540), add:
```js
editingTextId: editingTextId,
```

- [ ] **Step 6: Verify syntax**

```bash
node --check src/Canvas.js && node --check src/App.js && echo "OK"
```
Expected: `OK`

- [ ] **Step 7: Commit**

```bash
git add src/Canvas.js src/App.js
git commit -m "feat: add editingTextId state, TextLayer hides SVG text while inline editing"
```

---

## Task 4 — `onDoubleClick` wiring on SVG canvas

Adds the double-click handler that triggers `enterTextEdit` on text items.

**Files:**
- Modify: `src/Canvas.js`
- Modify: `src/App.js`

- [ ] **Step 1: Add `onDoubleClick` to the SVG element in Canvas.js**

In `src/Canvas.js`, the `<svg>` element is created around line 2868. Its existing events are `onMouseDown`, `onMouseUp`, etc. Add `onDoubleClick`:

```js
React.createElement(
  "svg",
  {
    ref: svgRef,
    className: "panel-canvas-svg",
    viewBox: `${-PAD} ${-PAD} ${widthMM + PAD * 2} ${heightMM + PAD * 2}`,
    style: { /* unchanged */ },
    onMouseMove: handleSVGMouseMove,
    onMouseLeave: handleSVGMouseLeave,
    onMouseDown: onSVGMouseDown,
    onMouseUp: onSVGMouseUp,
    onDoubleClick: onSVGDoubleClick,
    onTouchStart: onSVGTouchStart,
    onTouchMove: onSVGTouchMove,
    onTouchEnd: onSVGTouchEnd,
    onTouchCancel: onSVGTouchEnd,
    onContextMenu: onSVGContextMenu,
  },
  // ...
)
```

`onSVGDoubleClick` is already declared in the `SVGCanvas` props from Task 3 Step 4.

- [ ] **Step 2: Add `enterTextEdit` function and `onSVGDoubleClick` handler in App.js**

In `src/App.js`, add these two functions near the other canvas event handlers (around line 1380, near `openComponentPropertiesPanel`):

```js
function openTextPropertiesPanel() {
  setRightPanelOpen(true);
  setRightInspectorTopTab("inspect");
  setRightInspectTab("properties");
}

function enterTextEdit(id) {
  dispatch({ type: "SELECT_TEXT", id });
  setEditingTextId(id);
  openTextPropertiesPanel();
}

function onSVGDoubleClick(e) {
  const el = e.target;
  const textGroup = el.closest("[data-text-id]");
  if (textGroup) {
    const id = textGroup.getAttribute("data-text-id");
    const t = state.textItems.find((tt) => tt.id === id);
    if (t && !t.locked) {
      enterTextEdit(id);
    }
    return;
  }
}
```

- [ ] **Step 3: Pass `onSVGDoubleClick` from App.js to SVGCanvas**

In the `React.createElement(SVGCanvas, { ... })` block (around line 3540), add:
```js
onSVGDoubleClick: onSVGDoubleClick,
```

- [ ] **Step 4: Verify syntax**

```bash
node --check src/Canvas.js && node --check src/App.js && echo "OK"
```
Expected: `OK`

- [ ] **Step 5: Commit**

```bash
git add src/Canvas.js src/App.js
git commit -m "feat: wire onDoubleClick on SVG canvas, enterTextEdit triggers inline edit"
```

---

## Task 5 — Inline editor overlay

Renders the `<input>` overlay positioned over the canvas using `getScreenCTM()`, handles commit/cancel.

**Files:**
- Modify: `src/App.js`

- [ ] **Step 1: Add the inline editor component as a local function in App.js**

Add this function in `src/App.js` at the top level (outside `function App()`), near the other component definitions. It is a small function component:

```js
function InlineTextEditor({ textItem, svgRef, onCommit, onCancel }) {
  const [value, setValueState] = React.useState(textItem.text);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const getPosition = () => {
    if (!svgRef.current) return null;
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return null;
    const fontSizeMm = Math.min(Math.max(textItem.fontSizeMm || 3, 0.4), 18);
    const screenX = ctm.a * textItem.x + ctm.c * textItem.y + ctm.e;
    const screenY = ctm.b * textItem.x + ctm.d * textItem.y + ctm.f;
    const fontSizePx = ctm.a * fontSizeMm;
    return { screenX, screenY, fontSizePx };
  };

  const pos = getPosition();
  if (!pos) return null;

  const { screenX, screenY, fontSizePx } = pos;
  const align = textItem.align || "center";
  const translateX =
    align === "center" ? "-50%" : align === "right" ? "-100%" : "0%";

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onCommit(value);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  }

  return React.createElement("input", {
    ref: inputRef,
    type: "text",
    value: value,
    onChange: (e) => setValueState(e.target.value),
    onKeyDown: handleKeyDown,
    onBlur: () => onCommit(value),
    style: {
      position: "fixed",
      left: screenX + "px",
      top: screenY - fontSizePx + "px",
      transform: `translateX(${translateX})`,
      minWidth: "80px",
      height: fontSizePx * 1.4 + "px",
      padding: "0 4px",
      fontSize: fontSizePx + "px",
      fontFamily: textItem.fontFamily || "sans-serif",
      textAlign: align,
      background: "rgba(0,0,0,0.75)",
      color: "#f0e8d8",
      border: "1px solid rgba(214,170,88,0.7)",
      outline: "none",
      zIndex: 9999,
      boxSizing: "border-box",
    },
  });
}
```

- [ ] **Step 2: Render the overlay in App.js's return**

In the `App` component return (around line 3283), find a high-level wrapper element and add the overlay as a sibling to `SVGCanvas`. A good place is just after the `SVGCanvas` element (around line 3582):

```js
editingTextId &&
  (() => {
    const t = state.textItems.find((tt) => tt.id === editingTextId);
    if (!t) return null;
    return React.createElement(InlineTextEditor, {
      key: editingTextId,
      textItem: t,
      svgRef: svgRef,
      onCommit: (value) => {
        if (value.trim()) {
          dispatch({
            type: "UPDATE_TEXT",
            id: editingTextId,
            patch: { text: value },
          });
        }
        setEditingTextId(null);
      },
      onCancel: () => setEditingTextId(null),
    });
  })(),
```

- [ ] **Step 3: Update `onAddText` in CanvasToolRail wiring to use `setEditingTextId`**

In `src/App.js`, find the `onAddText` prop added in Task 2 Step 3. The `setEditingTextId` call is now available (defined in Task 3). Verify it reads:
```js
onAddText: () => {
  const id = crypto.randomUUID();
  dispatch({
    type: "ADD_TEXT",
    item: {
      id,
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
  setEditingTextId(id);
},
```

- [ ] **Step 4: Clear `editingTextId` when Escape pressed globally**

In `src/App.js`, find the existing keyboard handler (around line 2340, inside a `useEffect`). Add a guard:
```js
if (editingTextId) return; // let InlineTextEditor handle Escape
```
at the very top of the keydown handler body, so Escape in the inline editor doesn't also trigger a deselect.

- [ ] **Step 5: Verify syntax**

```bash
node --check src/App.js && echo "OK"
```
Expected: `OK`

- [ ] **Step 6: Run full verify**

```bash
npm run verify 2>&1 | tail -5
```
Expected: 21 screenshots captured, no errors.

- [ ] **Step 7: Commit**

```bash
git add src/App.js
git commit -m "feat: inline text editor overlay on canvas double-click"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Text button in toolbar → Task 2
- ✅ Double-click text → inline editor → Tasks 3, 4, 5
- ✅ Inline editor positioned via getScreenCTM → Task 5
- ✅ SVG text hidden during edit → Task 3
- ✅ Enter/Escape/blur handling → Task 5
- ✅ Right panel opens on text double-click → Task 4 (`openTextPropertiesPanel`)
- ✅ Component label double-click → right panel label focused → Task 1
- ✅ data-label-component-id attribute → Task 1
- ✅ data-label-input attribute → Task 1

**Placeholder scan:** None found. All steps have concrete code.

**Type consistency:**
- `editingTextId: string | null` — defined Task 3, used Tasks 4, 5 ✅
- `enterTextEdit(id: string)` — defined Task 4, called Task 4 (double-click) and Task 5 (Add button) ✅
- `onSVGDoubleClick` — defined Task 4, wired Task 4 ✅
- `InlineTextEditor` — defined Task 5 Step 1, rendered Task 5 Step 2 ✅
- `dispatch ADD_TEXT item` shape matches `addText()` in TopbarMenus.js ✅
