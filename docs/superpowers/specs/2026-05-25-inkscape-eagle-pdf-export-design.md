# Export: Inkscape SVG, Eagle SCR, PDF

**Date:** 2026-05-25  
**Status:** Approved

---

## Scope

Three new export formats added to `ExportDialog`:

1. **Inkscape SVG** — layered SVG with Inkscape-native layer attributes
2. **Eagle SCR** — minimal Eagle script (panel outline + holes/cutouts)
3. **PDF** — two types: 1:1 print template and documentation sheet

No new vendor dependencies. All generation is client-side.

---

## 1. Inkscape SVG

### What

An SVG file identical in structure to «Export layered SVG» but with Inkscape-specific namespace and layer attributes so that layers open as actual Inkscape layers rather than generic `<g>` groups.

### Changes to `exportLayeredSVGString(state, opts)`

Add optional third argument `cfg = {}`:

- When `cfg.inkscape === true`:
  - Add `xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"` to `<svg>` root
  - Add `inkscape:label="<human name>"` and `inkscape:groupmode="layer"` to each layer `<g>`

Layer names (same five as existing layered SVG):

| id | inkscape:label |
|---|---|
| `layer-panel-base` | Panel base |
| `layer-artwork` | Artwork |
| `layer-holes` | Holes |
| `layer-components` | Components |
| `layer-text` | Text |

### New function

```js
function exportInkscapeSVG(state, opts)
```

Calls `exportLayeredSVGString(state, opts, { inkscape: true })` and downloads as `<name>__inkscape.svg`.

### UI

SVG tab, in the «Layered SVG export» action row: new button **«Export Inkscape SVG»** next to existing «Export layered SVG» and «Export layered SVG ZIP».

---

## 2. Eagle SCR

### What

A minimal Eagle script (`.scr`) that, when executed via `File → Execute Script` in Eagle, draws:

- Panel outline on **Layer 20 Dimension**
- All mounting holes and circular/DIP component holes via `HOLE` command
- Rectangular cutouts and slot outlines on **Layer 46 Milling** using `WIRE`

### Eagle SCR format

```
GRID MM;
SET WIRE_BEND 2;

# Panel outline
LAYER 20 Dimension;
WIRE (0.000 0.000) (128.500 0.000) (128.500 128.500) (0.000 128.500) (0.000 0.000);

# Mounting holes
HOLE 3.200 (7.500 3.000);
HOLE 3.200 (7.500 125.500);

# Component holes
HOLE 6.350 (25.000 64.000);

# Rectangular cutout (layer 46)
LAYER 46 Milling;
WIRE (x1 y1) (x2 y1) (x2 y2) (x1 y2) (x1 y1);

# Slot (two holes + milling outline)
HOLE <diameter> (<cx> <y-start>);
HOLE <diameter> (<cx> <y-end>);
LAYER 46 Milling;
WIRE ...;
```

### Coordinate system

Eagle origin is bottom-left; panel designer origin is top-left. Y axis must be flipped: `y_eagle = PANEL_HEIGHT_MM - y_designer`.

### New function

`exportEagleSCR(state)` added to `src/exportHelpers.js`. Downloads as `<name>__eagle.scr`.

### Slot handling

A slot hole (width `w`, length `l`, rotation `r`) becomes:
- Two `HOLE w` at the two end-cap centres (adjusted for rotation)
- A `WIRE` rectangle on layer 46 for the slot body outline

DIP-8 socket: each individual hole centre becomes one `HOLE` command.

### UI

New tab **«Eagle»** in `ExportDialog`, between «KiCad» and «Package». Body:

- One-line description: *«Eagle board script — panel outline + drill/cut holes. Execute via File → Execute Script in Eagle.»*
- Single primary button: **«Export Eagle SCR»**

---

## 3. PDF

### Approach

Browser Print API — generate an HTML document, open in a new tab, call `window.print()`. The browser handles PDF rendering with physical `mm` dimensions. No library dependencies.

### 3a. 1:1 Print Template PDF

Generates an HTML page with:

- `@page` rule: `size: <widthMM>mm 128.5mm; margin: 0`
- The panel SVG at `width: <widthMM>mm; height: 128.5mm` (exact physical size)
- A thin cross-mark border (1mm tick marks at corners) for scale verification
- A footer line outside the panel area: *«Scale 1:1 — verify with ruler before ordering»*

No component labels, no drill table — purely the panel geometry (holes, outlines, artwork).

New function `exportPrintTemplatePDF(state)` in `src/exportHelpers.js`. Uses `exportSVGString` with `{ drillOnly: false, labels: false, includeArtwork: true }` for panel content.

### 3b. Documentation PDF

Generates a multi-section HTML page, A4 landscape:

**Page 1 — Panel overview**
- Panel SVG (scaled to fit page width, with labels visible)
- Header: project name, HP, dimensions

**Page 2 — Component table**  
Columns: Ref, Label, Type, X (mm), Y (mm), Hole type, Hole Ø/W (mm), Hole H (mm), Verification status

**Page 3 — DFM status** (only if warnings exist)
- Hard errors and warnings list from `computeWarnings`
- Manufacturing status string

Print styles: `@page { size: A4 landscape; margin: 12mm }`, table with borders, page-break-before on each section.

New function `exportDocumentationPDF(state, warnings)` in `src/exportHelpers.js`.

### UI

New tab **«PDF»** in `ExportDialog`, after «Package». Body:

- Button: **«1:1 Print Template»** — opens print dialog for physical scale check
- Button: **«Documentation PDF»** — opens print dialog for full doc sheet
- Info note: *«Opens browser print dialog — choose "Save as PDF" as destination»*

---

## Files changed

| File | Change |
|---|---|
| `src/exportHelpers.js` | Add `exportInkscapeSVG`, `exportEagleSCR`, `exportPrintTemplatePDF`, `exportDocumentationPDF`; extend `exportLayeredSVGString` with `cfg` param |
| `src/exportEngine.js` | Add `exportLayeredSVGPackage` Inkscape variant if needed |
| `src/ExportDialog.js` | New Eagle tab, new PDF tab, Inkscape button on SVG tab |
| `src/App.js` | Wire new handlers: `onExportInkscape`, `onExportEagle`, `onExportPrintTemplatePDF`, `onExportDocumentationPDF` |

`styles.css` — no changes needed (existing export dialog styles cover new tabs/buttons).

---

## Out of scope

- Eagle board XML (.brd)
- PDF with embedded vector via jsPDF
- DXF improvements
- Eagle component placement CSV
