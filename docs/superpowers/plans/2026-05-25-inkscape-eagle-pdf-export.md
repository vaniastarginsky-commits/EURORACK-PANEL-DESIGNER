# Inkscape SVG, Eagle SCR, PDF Export — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Inkscape-compatible layered SVG, Eagle SCR mechanical script, and two PDF print exports to the export dialog.

**Architecture:** All generation is client-side in `src/exportHelpers.js`. `ExportDialog.js` gains new prop handlers and two new tabs (Eagle, PDF) plus one new button on the SVG tab. `App.js` wires the handlers. No new vendor dependencies.

**Tech Stack:** Vanilla JS (no bundler), React via global `React.createElement`, browser Print API for PDF.

---

## Files changed

| File | Change |
|---|---|
| `src/exportHelpers.js` | Fix `exportLayeredSVGString` SVG root tag; add `exportInkscapeSVG`, `exportEagleSCR`, `exportPrintTemplatePDF`, `exportDocumentationPDF` |
| `src/ExportDialog.js` | Add 4 prop handlers; Inkscape button on SVG tab; Eagle tab; PDF tab |
| `src/App.js` | Wire 4 new handlers to `ExportDialog` |

---

## Task 1 — Fix exportLayeredSVGString + add exportInkscapeSVG

**Files:**
- Modify: `src/exportHelpers.js` lines 681–684
- Modify: `src/ExportDialog.js` lines 119–135 (props), 453–467 (SVG tab actions)
- Modify: `src/App.js` around line 3628 (ExportDialog props)

### Background

`exportLayeredSVGString` line 684 is malformed — the SVG root tag reads `<svg xmlns="http:` and then immediately jumps to `${groups.join("\n")}`. The full namespace URL and `viewBox`/`width`/`height` attributes are missing. The groups already carry `inkscape:groupmode` and `inkscape:label` attributes (line 679) but `xmlns:inkscape` is absent from the root. This task fixes the root tag and adds the Inkscape export button.

- [ ] **Step 1: Fix the SVG root tag in `exportLayeredSVGString`**

In `src/exportHelpers.js`, replace lines 681–684 (the broken `return` template literal):

```js
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Eurorack Panel Designer layered SVG export -->
<!-- Panel: ${state.panel.widthHP}HP = ${widthMM.toFixed(2)}mm x ${heightMM}mm -->
<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
  viewBox="0 0 ${widthMM.toFixed(3)} ${heightMM.toFixed(3)}"
  width="${widthMM.toFixed(3)}mm" height="${heightMM.toFixed(3)}mm">
${groups.join("\n")}
</svg>`;
```

- [ ] **Step 2: Add `exportInkscapeSVG` after `exportLayeredSVGPackage` in `src/exportHelpers.js`**

Find `exportLayeredSVGPackage` (around line 99), then directly after its closing `}` add:

```js
function exportInkscapeSVG(state, opts) {
  const selected = [
    opts.svgLayeredPanelBase,
    opts.svgLayeredArtwork,
    opts.svgLayeredHoles,
    opts.svgLayeredComponents,
    opts.svgLayeredText,
  ].some(Boolean);
  if (!selected) {
    alert("Select at least one layered SVG layer.");
    return;
  }
  const base = safeProjectFileName(
    state.projectMeta?.name || "panel-layout",
  ).replace(/\.json$/i, "");
  downloadTextFile(
    `${base}__inkscape.svg`,
    exportLayeredSVGString(state, opts),
    "image/svg+xml",
  );
}
```

- [ ] **Step 3: Add `onExportInkscape` prop to `ExportDialog`**

In `src/ExportDialog.js`, in the `ExportDialog` function signature (around line 119), add `onExportInkscape` to the destructured props after `onExportLayeredSVGPackage`:

```js
function ExportDialog({
  options,
  onChange,
  onExport,
  onExportPNG,
  onExportPSD,
  onExportLayeredSVG,
  onExportLayeredSVGPackage,
  onExportInkscape,
  onExportMode,
  onExportPackage,
  onExportCSV,
  onExportKiCad,
  onExportPrintTemplate,
  onExportDXF,
  onExportReport,
  onExportEagle,
  onExportPrintTemplatePDF,
  onExportDocumentationPDF,
  onCancel,
}) {
```

(Add all four new handlers now so the next tasks don't require re-editing this block.)

- [ ] **Step 4: Add Inkscape button in the SVG tab layered actions (ExportDialog.js)**

Find the `export-dialog-actions` div that contains "Export layered SVG" and "Export layered SVG ZIP" (around line 453). Add the Inkscape button between Cancel and "Export layered SVG":

```js
React.createElement(
  "div",
  { className: "export-dialog-actions" },
  React.createElement("button", { onClick: onCancel }, "Cancel"),
  React.createElement(
    "button",
    { onClick: onExportLayeredSVG },
    "Export layered SVG",
  ),
  React.createElement(
    "button",
    { onClick: onExportInkscape },
    "Export Inkscape SVG",
  ),
  React.createElement(
    "button",
    { className: "primary", onClick: onExportLayeredSVGPackage },
    "Export layered SVG ZIP",
  ),
),
```

- [ ] **Step 5: Wire `onExportInkscape` in `src/App.js`**

In `src/App.js`, find the `React.createElement(ExportDialog, {` block (around line 3628). After the `onExportLayeredSVGPackage` handler, add:

```js
onExportInkscape: () => {
  exportInkscapeSVG(state, exportOptions);
  setShowExportDialog(false);
},
```

- [ ] **Step 6: Syntax-check the three files**

```bash
node --check src/exportHelpers.js && node --check src/ExportDialog.js && node --check src/App.js
```

Expected: no output (no errors).

- [ ] **Step 7: Commit**

```bash
git add src/exportHelpers.js src/ExportDialog.js src/App.js
git commit -m "feat(export): fix layered SVG root tag, add Inkscape SVG export button"
```

---

## Task 2 — Eagle SCR export

**Files:**
- Modify: `src/exportHelpers.js` (add `exportEagleSCR` after `exportDXF`)
- Modify: `src/ExportDialog.js` (Eagle tab button + body)
- Modify: `src/App.js` (wire handler)

### Coordinate system note

Panel designer origin: top-left, Y increases downward.
Eagle SCR origin: bottom-left, Y increases upward.
Y-flip: `y_eagle = PANEL_HEIGHT_MM - y_designer`.

### Slot geometry note

A slot with `holeDiameter` (width) and `slotLength` (length) at rotation `rot`:
- end-cap offset from center: `off = Math.max(0, (slotLength - holeDiameter) / 2)`
- end cap 1 center: `[cx - off*sin(rot), cy + off*cos(rot)]`
- end cap 2 center: `[cx + off*sin(rot), cy - off*cos(rot)]`
- milling rectangle corners (same rotation formula as `dxfRect`):
  ```
  hw = holeDiameter/2, hl = slotLength/2
  [dx,dy] in [[-hw,-hl],[hw,-hl],[hw,hl],[-hw,hl]]
  x_world = cx + dx*cos(rot) - dy*sin(rot)
  y_world = cy + dx*sin(rot) + dy*cos(rot)
  ```

- [ ] **Step 1: Add `exportEagleSCR` to `src/exportHelpers.js`**

Add after `exportDXF` (around line 438):

```js
function exportEagleSCR(state) {
  const W = panelWidthMM(state.panel);
  const H = PANEL_HEIGHT_MM;
  function ex(x) { return x.toFixed(3); }
  function ey(y) { return (H - y).toFixed(3); }
  function eagleCorners(cx, cy, hw, hh, rot) {
    const a = degToRad(rot || 0), co = Math.cos(a), si = Math.sin(a);
    return [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(
      ([dx, dy]) => [cx + dx * co - dy * si, cy + dx * si + dy * co],
    );
  }
  function wireRect(corners) {
    const pts = [...corners, corners[0]];
    return "WIRE " + pts.map(([x, y]) => `(${ex(x)} ${ey(y)})`).join(" ") + ";";
  }
  const out = [];
  out.push("GRID MM;");
  out.push("SET WIRE_BEND 2;");
  out.push("");
  // Panel outline
  out.push("LAYER 20 Dimension;");
  out.push(
    `WIRE (0.000 0.000) (${ex(W)} 0.000) (${ex(W)} ${ex(H)}) (0.000 ${ex(H)}) (0.000 0.000);`,
  );
  out.push("");
  // Mounting holes
  if (state.mountingHoles.enabled) {
    for (const mh of state.mountingHoles.holes) {
      if (state.mountingHoles.holeShape === "oval") {
        const ow = Math.max(
          state.mountingHoles.ovalLength ?? 4.8,
          MOUNTING_HOLE_DIAMETER_MM,
        );
        const off = Math.max(0, (ow - MOUNTING_HOLE_DIAMETER_MM) / 2);
        out.push(
          `HOLE ${MOUNTING_HOLE_DIAMETER_MM.toFixed(3)} (${ex(mh.x)} ${(H - mh.y - off).toFixed(3)});`,
        );
        out.push(
          `HOLE ${MOUNTING_HOLE_DIAMETER_MM.toFixed(3)} (${ex(mh.x)} ${(H - mh.y + off).toFixed(3)});`,
        );
        out.push("LAYER 46 Milling;");
        out.push(
          wireRect(
            eagleCorners(mh.x, mh.y, MOUNTING_HOLE_DIAMETER_MM / 2, ow / 2, 0),
          ),
        );
      } else {
        out.push(
          `HOLE ${MOUNTING_HOLE_DIAMETER_MM.toFixed(3)} (${ex(mh.x)} ${ey(mh.y)});`,
        );
      }
    }
    out.push("");
  }
  // Component holes
  for (const c of state.components) {
    if (isDip8Socket(c)) {
      for (const p of dip8SocketHoleCenters(c)) {
        out.push(`HOLE ${c.holeDiameter.toFixed(3)} (${ex(p.x)} ${ey(p.y)});`);
      }
    } else if (c.holeType === "slot") {
      const sl = c.slotLength ?? c.holeDiameter;
      const a = degToRad(c.rotation || 0);
      const off = Math.max(0, (sl - c.holeDiameter) / 2);
      const p1x = c.x - off * Math.sin(a);
      const p1y = c.y + off * Math.cos(a);
      const p2x = c.x + off * Math.sin(a);
      const p2y = c.y - off * Math.cos(a);
      out.push(`HOLE ${c.holeDiameter.toFixed(3)} (${ex(p1x)} ${ey(p1y)});`);
      out.push(`HOLE ${c.holeDiameter.toFixed(3)} (${ex(p2x)} ${ey(p2y)});`);
      out.push("LAYER 46 Milling;");
      out.push(wireRect(eagleCorners(c.x, c.y, c.holeDiameter / 2, sl / 2, c.rotation || 0)));
    } else if (c.holeType === "rect") {
      const rw = c.holeW ?? c.frontW ?? c.holeDiameter;
      const rh = c.holeH ?? c.frontH ?? c.holeDiameter;
      out.push("LAYER 46 Milling;");
      out.push(wireRect(eagleCorners(c.x, c.y, rw / 2, rh / 2, c.rotation || 0)));
    } else {
      out.push(`HOLE ${c.holeDiameter.toFixed(3)} (${ex(c.x)} ${ey(c.y)});`);
    }
  }
  out.push("");
  const base = safeProjectFileName(state.projectMeta?.name || "panel-layout").replace(
    /\.json$/i,
    "",
  );
  downloadTextFile(`${base}__eagle.scr`, out.join("\n"), "text/plain");
}
```

- [ ] **Step 2: Add Eagle tab button in `src/ExportDialog.js`**

Find the tab buttons row (around line 304). Add the Eagle button after the KiCad button:

```js
React.createElement(
  "button",
  {
    className: tab === "kicad" ? "active" : "",
    onClick: () => setTab("kicad"),
  },
  "KiCad",
),
React.createElement(
  "button",
  {
    className: tab === "eagle" ? "active" : "",
    onClick: () => setTab("eagle"),
  },
  "Eagle",
),
```

- [ ] **Step 3: Add Eagle tab body in `src/ExportDialog.js`**

Find where `tab === "package"` tab body starts (around line 819). Add the Eagle tab body immediately before it:

```js
tab === "eagle" &&
  React.createElement(
    "div",
    { className: "export-tab-body" },
    React.createElement(
      "div",
      { className: "section-title" },
      "Eagle board script",
    ),
    React.createElement(
      "div",
      {
        className: "warning-item warn",
        style: { fontSize: 10, marginBottom: 10 },
      },
      "Generates a .scr script with panel outline (Layer 20 Dimension) and all drill/cut holes (HOLE + Layer 46 Milling). Execute in Eagle via File → Execute Script.",
    ),
    React.createElement(
      "div",
      { className: "export-dialog-actions" },
      React.createElement("button", { onClick: onCancel }, "Cancel"),
      React.createElement(
        "button",
        { className: "primary", onClick: onExportEagle },
        "Export Eagle SCR",
      ),
    ),
  ),
```

- [ ] **Step 4: Wire `onExportEagle` in `src/App.js`**

In the `React.createElement(ExportDialog, {...})` block, add after the `onExportKiCad` handler:

```js
onExportEagle: () => {
  exportEagleSCR(state);
  setShowExportDialog(false);
},
```

- [ ] **Step 5: Syntax-check**

```bash
node --check src/exportHelpers.js && node --check src/ExportDialog.js && node --check src/App.js
```

Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/exportHelpers.js src/ExportDialog.js src/App.js
git commit -m "feat(export): add Eagle SCR mechanical export"
```

---

## Task 3 — PDF exports (print template + documentation)

**Files:**
- Modify: `src/exportHelpers.js` (add `exportPrintTemplatePDF` and `exportDocumentationPDF`)
- Modify: `src/ExportDialog.js` (PDF tab button + body)
- Modify: `src/App.js` (wire two handlers)

### How browser Print API is used

Both functions build an HTML string, open it in a new tab via a Blob URL, and inject `<script>window.print();</script>` which fires the browser's print dialog. The user selects "Save as PDF" as destination. If the popup is blocked, the function falls back silently — the user can manually open the Blob URL.

- [ ] **Step 1: Add `exportPrintTemplatePDF` to `src/exportHelpers.js`**

Add after `exportPrintableTemplate` (around line 254):

```js
function exportPrintTemplatePDF(state) {
  const widthMM = panelWidthMM(state.panel);
  const H = PANEL_HEIGHT_MM;
  const svgContent = exportSVGString(state, {
    drillOnly: false,
    labels: true,
    includeArtwork: true,
    centerMarks: true,
    mountingKeepouts: false,
    rearKeepout: false,
    rearBody: false,
  });
  const pageW = (widthMM + 20).toFixed(1);
  const pageH = (H + 30).toFixed(1);
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { size: ${pageW}mm ${pageH}mm; margin: 8mm; }
  body { margin: 0; font: 8pt sans-serif; }
  .note { margin-bottom: 3mm; color: #555; }
  svg { width: ${widthMM.toFixed(1)}mm; height: ${H.toFixed(1)}mm; display: block; }
  .ruler { margin-top: 4mm; border-top: 0.4pt solid black; width: 100mm; }
  .ruler-label { font: 7pt sans-serif; color: #555; margin-top: 1mm; }
</style>
</head>
<body>
<p class="note">1:1 Eurorack panel template &mdash; ${widthMM.toFixed(2)}&nbsp;&times;&nbsp;${H}&nbsp;mm &mdash; verify scale with ruler</p>
${svgContent}
<div class="ruler"></div>
<p class="ruler-label">100&nbsp;mm calibration ruler above &mdash; measure before printing</p>
<script>window.print();</script>
</body>
</html>`;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  window.open(url);
}
```

- [ ] **Step 2: Add `exportDocumentationPDF` to `src/exportHelpers.js`**

Add immediately after `exportPrintTemplatePDF`:

```js
function exportDocumentationPDF(state, warnings) {
  const widthMM = panelWidthMM(state.panel);
  const H = PANEL_HEIGHT_MM;
  const projectName = state.projectMeta?.name || "Eurorack Panel";
  const panelSVG = exportSVGString(state, {
    drillOnly: false,
    labels: true,
    includeArtwork: true,
    centerMarks: false,
    mountingKeepouts: false,
    rearKeepout: false,
    rearBody: false,
  });
  const rows = drillTableRows(state, warnings);
  const tableHeaders = [
    "Ref", "Label", "Type", "Name", "X mm", "Y mm",
    "Rot°", "Hole type", "Ø/W mm", "H mm", "Status", "Warn",
  ];
  // drillTableRows columns: 0=ref,1=label,2=type,3=name,6=verification,
  // 7=x,8=y,9=rot,10=holeType,11=holeW,12=holeH,20=warnCount
  function escHtml(v) {
    return String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  const tableRows = rows
    .map(
      (r) =>
        `<tr>${[r[0], r[1], r[2], r[3], r[7], r[8], r[9], r[10], r[11], r[12], r[6], r[20]]
          .map((v) => `<td>${escHtml(v)}</td>`)
          .join("")}</tr>`,
    )
    .join("\n");
  const hard = warnings.filter((w) => w.severity === "error").length;
  const warn = warnings.filter((w) => w.severity !== "error").length;
  const warningRows = warnings
    .map(
      (w) =>
        `<tr class="${w.severity}"><td>${escHtml(w.severity)}</td><td>${escHtml(w.message)}</td></tr>`,
    )
    .join("\n");
  const warningsSection =
    warnings.length > 0
      ? `<div class="section page-break">
<h2>DFM status &mdash; ${hard} errors, ${warn} warnings</h2>
<table><thead><tr><th>Level</th><th>Message</th></tr></thead>
<tbody>${warningRows}</tbody></table>
</div>`
      : "";
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${escHtml(projectName)}</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  body { margin: 0; font: 9pt sans-serif; }
  h1 { font-size: 13pt; margin: 0 0 3mm; }
  h2 { font-size: 11pt; margin: 0 0 3mm; }
  .panel-section { text-align: center; page-break-after: always; }
  .panel-section svg { max-width: 100%; height: auto; }
  .page-break { page-break-before: always; }
  table { border-collapse: collapse; width: 100%; font-size: 8pt; }
  th, td { border: 1px solid #ccc; padding: 1.5pt 3pt; text-align: left; }
  th { background: #f0f0f0; font-weight: bold; }
  tr.error td { color: #c00; }
  tr.warn td { color: #a60; }
  .meta { color: #555; font-size: 8pt; margin-bottom: 4mm; }
</style>
</head>
<body>
<div class="panel-section">
  <h1>${escHtml(projectName)}</h1>
  <p class="meta">${state.panel.widthHP}HP &mdash; ${widthMM.toFixed(2)}&times;${H}&nbsp;mm &mdash; ${state.components.length} components</p>
  ${panelSVG}
</div>
<div class="page-break">
  <h2>Component table</h2>
  <table>
    <thead><tr>${tableHeaders.map((h) => `<th>${escHtml(h)}</th>`).join("")}</tr></thead>
    <tbody>${tableRows}</tbody>
  </table>
</div>
${warningsSection}
<script>window.print();</script>
</body>
</html>`;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  window.open(url);
}
```

- [ ] **Step 3: Add PDF tab button in `src/ExportDialog.js`**

In the tab buttons row, add the PDF button after the Package button:

```js
React.createElement(
  "button",
  {
    className: tab === "package" ? "active" : "",
    onClick: () => setTab("package"),
  },
  "Package",
),
React.createElement(
  "button",
  {
    className: tab === "pdf" ? "active" : "",
    onClick: () => setTab("pdf"),
  },
  "PDF",
),
```

- [ ] **Step 4: Add PDF tab body in `src/ExportDialog.js`**

Add the PDF tab body before the Report tab body (find `tab === "report"`):

```js
tab === "pdf" &&
  React.createElement(
    "div",
    { className: "export-tab-body" },
    React.createElement(
      "div",
      { className: "section-title" },
      "PDF export",
    ),
    React.createElement(
      "div",
      {
        className: "warning-item warn",
        style: { fontSize: 10, marginBottom: 10 },
      },
      "Opens browser print dialog — select “Save as PDF” as destination.",
    ),
    React.createElement(
      "div",
      { className: "export-action-grid" },
      React.createElement(
        "button",
        { onClick: onExportPrintTemplatePDF },
        "1:1 Print Template",
      ),
      React.createElement(
        "button",
        { onClick: onExportDocumentationPDF },
        "Documentation PDF",
      ),
    ),
  ),
```

- [ ] **Step 5: Wire PDF handlers in `src/App.js`**

In the `React.createElement(ExportDialog, {...})` block, add after the `onExportPackage` handler:

```js
onExportPrintTemplatePDF: () => {
  exportPrintTemplatePDF(state);
  setShowExportDialog(false);
},
onExportDocumentationPDF: () => {
  exportDocumentationPDF(state, warnings);
  setShowExportDialog(false);
},
```

- [ ] **Step 6: Syntax-check all three files**

```bash
node --check src/exportHelpers.js && node --check src/ExportDialog.js && node --check src/App.js
```

Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add src/exportHelpers.js src/ExportDialog.js src/App.js
git commit -m "feat(export): add PDF print template and documentation PDF export"
```

---

## Task 4 — Smoke test + final verify

- [ ] **Step 1: Open the app**

```bash
npm run dev
```

Open `http://localhost:4173` in a browser. Add a few components.

- [ ] **Step 2: Test each new export**

Open Export dialog and verify:

| Tab | Action | Expected |
|---|---|---|
| SVG | "Export Inkscape SVG" | Downloads `__inkscape.svg`; open in Inkscape and check that layers appear as Inkscape layers in the Layers panel |
| SVG | "Export layered SVG" | Still works; SVG opens without malformed root |
| Eagle | "Export Eagle SCR" | Downloads `.scr`; open as text and verify `GRID MM`, `LAYER 20`, `HOLE`, `LAYER 46` present with correct coordinates |
| PDF | "1:1 Print Template" | Opens new browser tab → print dialog fires |
| PDF | "Documentation PDF" | Opens new tab → print dialog fires; page 1 = panel, page 2 = table |

- [ ] **Step 3: Run verify**

```bash
npm run verify
```

Expected: format check passes, screenshot captured.

- [ ] **Step 4: Final commit if verify passes**

```bash
git add .
git commit -m "chore: post-export-features verify pass"
```
