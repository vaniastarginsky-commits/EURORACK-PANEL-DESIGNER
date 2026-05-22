# Text Inline Editing — Design Spec

**Date:** 2026-05-22
**Branch:** ux-polish
**Status:** Approved

---

## Overview

Three connected improvements to text authoring:

1. **Text button in CanvasToolRail** — quick-add text directly from the tool sidebar
2. **Inline canvas editor for text items** — double-click a `textItem` → edit text directly on canvas
3. **Component label double-click → right panel** — double-click a component's label → open right panel with Label field focused

---

## Part 1 — Text Button in CanvasToolRail

### Behaviour
- New button `Text / T` placed after the mode group (Edit / Pan / Select / Ruler), before View
- Single click:
  1. Dispatch `ADD_TEXT` with a fresh `id = crypto.randomUUID()`, position = visible center of canvas (accounts for current pan/zoom)
  2. Immediately enter inline-edit mode for the new item (`setEditingTextId(newId)`)
- Button is NOT a mode toggle — it is a one-shot action

### Props change
`CanvasToolRail` receives new prop: `onAddText: () => void`

App.js passes: `onAddText: addTextAndEdit`

---

## Part 2 — Inline Editor for textItems

### State
In `App.js`:
```js
const [editingTextId, setEditingTextId] = useState(null);
```

### Trigger
- `onDoubleClick` handler on the SVG wrapper element in `Canvas.js` (new prop: `onSVGDoubleClick`)
- Handler in `App.js` checks `el.closest('[data-text-id]')` → extracts `id` → calls `enterTextEdit(id)`
- `enterTextEdit(id)`:
  1. `dispatch({ type: 'SELECT_TEXT', id })`
  2. `setEditingTextId(id)`
  3. `setRightPanelOpen(true)` + `setRightInspectorTopTab('inspect')` (right panel opens with text properties)

### Overlay
A `<input type="text">` rendered in `App.js` with `position: fixed` when `editingTextId` is set.

**Positioning** via `svgRef.current.getScreenCTM()`:
```
ctm = svgRef.current.getScreenCTM()
screenX = ctm.a * t.x + ctm.e
screenY = ctm.d * t.y + ctm.f
fontSize = ctm.a * t.fontSizeMm   (px)
```

- `textAnchor` maps to CSS `text-align`
- Font family matches `t.fontFamily`
- Background: semi-transparent dark (`rgba(0,0,0,0.7)`)
- Border: subtle gold accent
- Min-width: 80px, grows with content

**Keyboard**
- `Enter` → commit: `dispatch UPDATE_TEXT` + `setEditingTextId(null)`
- `Escape` → cancel: `setEditingTextId(null)` (no dispatch)
- `Blur` → commit (same as Enter)

**SVG text visibility**
`TextLayer` in `Canvas.js` receives `editingTextId` prop. When `t.id === editingTextId`, renders the SVG `<text>` with `opacity: 0` so the overlay input appears in its place.

---

## Part 3 — Component Label Double-click → Right Panel

### Canvas change
In `Canvas.js`, the component label `<text>` element (currently at `c.label` render block) gets:
```js
"data-label-component-id": c.id
```

### Handler
In `App.js` `onDoubleClick` (same handler as Part 2, checked after text-id):
```js
const labelEl = el.closest('[data-label-component-id]');
if (labelEl) {
  const componentId = labelEl.getAttribute('data-label-component-id');
  dispatch({ type: 'SELECT_COMPONENT', id: componentId });
  openComponentPropertiesPanel();
  setTimeout(() => {
    document.querySelector('[data-label-input]')?.focus();
    document.querySelector('[data-label-input]')?.select();
  }, 80);
}
```

### Right panel change
In `RightSidebarComponentProperties.js`, the label `<input>` gets `data-label-input="1"`.

---

## Files Changed

| File | Change |
|---|---|
| `src/CanvasToolRail.js` | Add `Text` button, `onAddText` prop |
| `src/Canvas.js` | Add `data-label-component-id` on label text, `onSVGDoubleClick` prop, `editingTextId` prop → hide SVG text |
| `src/App.js` | `editingTextId` state, `enterTextEdit()`, `addTextAndEdit()`, double-click handler, inline editor overlay |
| `src/RightSidebarComponentProperties.js` | `data-label-input` on label input |

---

## Out of Scope

- Multi-line text editing
- Rotation-aware input positioning (input renders upright regardless of text rotation)
- Touch / mobile inline editing (mobile uses the right panel exclusively)
