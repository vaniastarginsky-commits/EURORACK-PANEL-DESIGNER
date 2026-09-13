# Eagle .brd Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Eagle 6+ XML `.brd` file import that reads element positions and maps them to panel components, mirroring the existing KiCad PCB import flow.

**Architecture:** New `src/export/eagleImport.js` exposes `parseEagleBrdToPanel()` returning the same `{components, panelWidthMM, boardOutline, warnings}` shape as `parseKiCadPcbToPanel()`. App.js reuses the existing `LOAD_KICAD_IMPORT` reducer action. UI is a hidden `<input type="file">` triggered by a new "Import Eagle .brd..." button in the File menu.

**Tech Stack:** Vanilla JS, React (createElement), DOMParser (browser built-in), global script tags (no bundler).

---

## File Map

| Action | File |
|---|---|
| **Create** | `src/export/eagleImport.js` |
| **Modify** | `index.html` (add `<script>` tag) |
| **Modify** | `src/App.js` (ref + handlers + hidden input + command + Topbar prop) |
| **Modify** | `src/Topbar.js` (destructure + pass-through) |
| **Modify** | `src/TopbarMenus.js` (destructure + button) |

---

## Task 1: Create `src/export/eagleImport.js`

**Files:**
- Create: `src/export/eagleImport.js`

- [ ] **Step 1: Create the file**

```js
// Eagle 6+ XML .brd import parser.
// Parses Eagle board files and converts elements to panel components.
// Depends on: HP_TO_MM, PANEL_HEIGHT_MM, sanitizePart (core.js),
//             COMPONENT_LIBRARY (components/library/componentDefinitions.js).
// Public API: parseEagleBrdToPanel(xmlSrc, currentPanelWidthMM).
function parseEagleBrdOutline(doc) {
  const pts = [];
  const wires = doc.querySelectorAll(
    'plain > wire[layer="20"], board > plain > wire[layer="20"]',
  );
  for (const w of wires) {
    const x1 = parseFloat(w.getAttribute("x1"));
    const y1 = parseFloat(w.getAttribute("y1"));
    const x2 = parseFloat(w.getAttribute("x2"));
    const y2 = parseFloat(w.getAttribute("y2"));
    if (!isNaN(x1)) pts.push({ x: x1, y: y1 });
    if (!isNaN(x2)) pts.push({ x: x2, y: y2 });
  }
  if (pts.length < 2) return null;
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const xMin = Math.min(...xs),
    xMax = Math.max(...xs);
  const yMin = Math.min(...ys),
    yMax = Math.max(...ys);
  if (!(xMax > xMin) || !(yMax > yMin)) return null;
  return { x: xMin, y: yMin, width: xMax - xMin, height: yMax - yMin, maxY: yMax };
}
function parseEagleRotation(rotStr) {
  if (!rotStr) return 0;
  const m = rotStr.match(/M?R(\d+(?:\.\d+)?)/i);
  return m ? parseFloat(m[1]) : 0;
}
function roundEaglePanelWidthToHP(widthMM) {
  const sourceHp = widthMM / HP_TO_MM;
  const hp = Math.max(2, Math.ceil(sourceHp - 1e-6));
  const roundedWidthMM = hp * HP_TO_MM;
  return {
    widthMM: roundedWidthMM,
    hp,
    rounded: Math.abs(roundedWidthMM - widthMM) > 0.01,
    sourceHp,
  };
}
function bestLibraryPartForEagle(name, pkg) {
  const hay = `${name} ${pkg}`.toLowerCase();
  const find = (type) =>
    COMPONENT_LIBRARY.find((p) => p.type === type) || COMPONENT_LIBRARY[0];
  if (/thonkiconn|pj398sm|wqp-pj398sm|3\.5mm-jack|jack.*3\.5|3\.5.*jack/.test(hay))
    return find("jack");
  if (/slim.*jack|cliff.*fc68|rean.*nys|jack.*6\.35|6\.35.*jack/.test(hay))
    return find("slimjack");
  if (/alpha-16mm|rd901f.*16|16mm.*pot|rv16/.test(hay)) return find("pot16mm");
  if (/alpha-9mm|rd901f|9mm.*pot|rv09/.test(hay)) return find("pot9mm");
  if (/ec12|pec11|encoder.*12|rotary.*enc/.test(hay)) return find("encoder");
  if (/fader.*45|ra.*slide.*45/.test(hay)) return find("fader45");
  if (/fader.*35|ra.*slide.*35/.test(hay)) return find("fader35");
  if (/fader.*20.*led/.test(hay)) return find("fader20led");
  if (/fader.*20|slide.*pot/.test(hay)) return find("fader20");
  if (/led.*5mm|5mm.*led|tact.*led|thonk.*sw.*lp.*led/.test(hay))
    return find("tactled");
  if (/led.*3mm|3mm.*led/.test(hay)) return find("led3mm");
  if (/momentary.*12|sw.*push.*12|d6.*switch/.test(hay))
    return find("momentary12");
  if (/tact.*6mm|6mm.*tact|fsm.*switch|sw.*push.*6/.test(hay))
    return find("tact6mm");
  if (/sub.*mini/.test(hay)) return find("subMiniSwitch");
  if (/toggle|spdt|dpdt/.test(hay)) return find("toggle");
  if (/rotary.*8|rotary.*12|wafer/.test(hay)) return find("rotary8pos");
  if (/dip-8|socket.*8|diode.*socket/.test(hay)) return find("dip8socket");
  if (/trimmer|trim.*6/.test(hay)) return find("trimmer6mm");
  const n = name.toLowerCase();
  if (/^j/.test(n)) return find("jack");
  if (/^rv|^pot/.test(n)) return find("pot9mm");
  if (/^d\d|^led/.test(n)) return find("led3mm");
  if (/^sw|^s\d/.test(n)) return find("tact6mm");
  if (/^enc/.test(n)) return find("encoder");
  return sanitizePart({
    type: "custom",
    name: `Eagle ${name || pkg}`,
    holeDiameter: 6.0,
    frontDiameter: 8.0,
    rearBodyW: 10.0,
    rearBodyH: 10.0,
    rearDepth: 8,
    keepoutW: 12.0,
    keepoutH: 12.0,
    minSpacing: 1,
    category: "custom",
    verificationStatus: "approximate",
  });
}
function parseEagleBrdToPanel(xmlSrc, currentPanelWidthMM) {
  const warnings = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlSrc, "text/xml");
  if (doc.querySelector("parsererror")) {
    return {
      components: [],
      boardOutline: null,
      warnings: [
        "Eagle .brd file could not be parsed. Is this a valid Eagle 6+ XML file?",
      ],
    };
  }
  const outline = parseEagleBrdOutline(doc);
  const elements = [...doc.querySelectorAll("elements > element")];
  if (!elements.length) {
    return {
      components: [],
      boardOutline: outline,
      warnings: ["No <elements> found in Eagle .brd file."],
    };
  }
  const allX = elements.map((el) => parseFloat(el.getAttribute("x") || "0"));
  const allY = elements.map((el) => parseFloat(el.getAttribute("y") || "0"));
  const boardMinX = outline ? outline.x : Math.min(...allX);
  const boardMaxY = outline
    ? outline.y + outline.height
    : Math.max(...allY);
  const boardWidth = outline
    ? outline.width
    : Math.max(10, Math.max(...allX) - Math.min(...allX) + 20);
  const boardHeight = outline
    ? outline.height
    : Math.max(10, Math.max(...allY) - Math.min(...allY) + 20);
  if (!outline) {
    warnings.push(
      "No Dimension (Layer 20) outline found. Components were centered on the current panel; verify origin manually.",
    );
  }
  if (boardHeight > PANEL_HEIGHT_MM + 0.5) {
    warnings.push(
      `Board outline height ${boardHeight.toFixed(2)} mm exceeds Eurorack 3U panel height ${PANEL_HEIGHT_MM} mm.`,
    );
  }
  const roundedPanel =
    outline && outline.width > 5
      ? roundEaglePanelWidthToHP(outline.width)
      : {
          widthMM: currentPanelWidthMM,
          hp: currentPanelWidthMM / HP_TO_MM,
          rounded: false,
          sourceHp: currentPanelWidthMM / HP_TO_MM,
        };
  if (roundedPanel.rounded) {
    warnings.push(
      `Board width ${boardWidth.toFixed(2)} mm = ${roundedPanel.sourceHp.toFixed(2)} HP; rounded to ${roundedPanel.hp} HP.`,
    );
  }
  const targetWidth = roundedPanel.widthMM;
  const xOffset = (targetWidth - boardWidth) / 2;
  const yOffset = outline
    ? Math.max(0, (PANEL_HEIGHT_MM - boardHeight) / 2)
    : (PANEL_HEIGHT_MM - boardHeight) / 2;
  const usedRefs = new Set();
  const components = elements.map((el, idx) => {
    const name = el.getAttribute("name") || "";
    const pkg = el.getAttribute("package") || "";
    const lib = el.getAttribute("library") || "";
    const ex = parseFloat(el.getAttribute("x") || "0");
    const ey = parseFloat(el.getAttribute("y") || "0");
    const rotStr = el.getAttribute("rot") || "";
    const rotation = parseEagleRotation(rotStr);
    const def = bestLibraryPartForEagle(name, pkg);
    const sanitized = sanitizePart({
      ...def,
      verificationStatus: def.verificationStatus ?? "approximate",
    });
    let ref = name || `C${idx + 1}`;
    if (usedRefs.has(ref)) ref = `${ref}_${idx + 1}`;
    usedRefs.add(ref);
    const panelX = ex - boardMinX + xOffset;
    const panelY = boardMaxY - ey + yOffset;
    const noteLines = [
      `Imported from Eagle package: ${pkg}`,
      lib ? `Library: ${lib}` : "",
      `Eagle rotation: ${rotStr || "R0"}`,
    ].filter(Boolean);
    return {
      ...sanitized,
      id: crypto.randomUUID(),
      ref,
      label: name,
      x: Math.round(panelX * 1000) / 1000,
      y: Math.round(panelY * 1000) / 1000,
      rotation,
      notes: noteLines.join("\n"),
      locked: false,
    };
  });
  return {
    components,
    panelWidthMM: targetWidth,
    boardOutline: outline
      ? { x: outline.x, y: outline.y, width: outline.width, height: outline.height }
      : null,
    warnings,
  };
}
```

- [ ] **Step 2: Check syntax**

```bash
node --check src/export/eagleImport.js
```

Expected: no output (clean).

- [ ] **Step 3: Commit**

```bash
git add src/export/eagleImport.js
git commit -m "feat(import): add Eagle 6+ XML .brd parser (eagleImport.js)"
```

---

## Task 2: Register the script in `index.html`

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add `<script>` tag after `kiCadImport.js`**

Find this line in `index.html` (around line 51):
```html
  <script src="src/export/kiCadImport.js"></script>
```

Add immediately after it:
```html
  <script src="src/export/eagleImport.js"></script>
```

- [ ] **Step 2: Verify the app loads**

```bash
npm run check:syntax
```

Expected: no errors. (The script tag change doesn't affect JS syntax.)

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(import): load eagleImport.js in index.html"
```

---

## Task 3: Wire `src/App.js`

**Files:**
- Modify: `src/App.js`

Four insertions in one task — do them in order.

- [ ] **Step 1: Add ref declaration**

Find this block (around line 139):
```js
  const projectFileInputRef = useRef(null);
  const kicadPcbInputRef = useRef(null);
```

Add one line after `kicadPcbInputRef`:
```js
  const projectFileInputRef = useRef(null);
  const kicadPcbInputRef = useRef(null);
  const eagleBrdInputRef = useRef(null);
```

- [ ] **Step 2: Add `requestEagleBrdImport` function**

Find `function requestKiCadPcbImport()` and the closing `}` of that function. Add the new function **after** the closing brace:

```js
  function requestEagleBrdImport() {
    const input =
      eagleBrdInputRef.current ||
      document.getElementById("eagle-brd-file-input");
    if (!input) {
      setAutosaveStatus("Eagle .brd file input unavailable");
      return;
    }
    input.value = "";
    input.click();
  }
```

- [ ] **Step 3: Add `onEagleBrdImport` handler**

Find `function onKiCadPcbImport(e)` and its closing `}`. Add the new handler **after** it:

```js
  function onEagleBrdImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const src = String(ev.target?.result || "");
      const hasProjectData =
        state.components.length > 0 ||
        state.artworks.length > 0 ||
        state.textItems.length > 0 ||
        state.scaleItems.length > 0;
      if (hasProjectData) {
        const ok = await appConfirm({
          title: "Import Eagle .brd",
          message:
            "Replace the current project layout with the Eagle .brd import? This clears old text, scales and artwork.",
          confirmText: "Import Eagle",
        });
        if (!ok) return;
      }
      const result = parseEagleBrdToPanel(src, panelWidthMM(state.panel));
      if (!result.components.length) {
        alert(
          `Eagle import found no components.\n${result.warnings.join("\n")}`,
        );
        return;
      }
      dispatch({
        type: "LOAD_KICAD_IMPORT",
        components: result.components,
        panelWidthMM: result.panelWidthMM,
        boardOutline: result.boardOutline,
      });
      dispatch({ type: "SET_VIEW_MODE", mode: "front" });
      setAutosaveStatus(
        `Imported Eagle .brd · ${result.components.length} parts`,
      );
      const msg = [
        `Imported ${result.components.length} parts from Eagle .brd.`,
      ];
      if (result.boardOutline)
        msg.push(
          `Board outline: ${result.boardOutline.width.toFixed(2)} × ${result.boardOutline.height.toFixed(2)} mm.`,
        );
      if (result.warnings.length) msg.push("", ...result.warnings);
      window.appNotify(msg.join("\n"), { timeout: 12000 });
    };
    reader.readAsText(file);
    e.target.value = "";
  }
```

- [ ] **Step 4: Add app command**

Find:
```js
      {
        id: "import-kicad-pcb",
        label: "Import KiCad PCB…",
        hint: "Read .kicad_pcb footprint positions into the front-panel layout",
        run: () => requestKiCadPcbImport(),
      },
```

Add immediately after it:
```js
      {
        id: "import-eagle-brd",
        label: "Import Eagle .brd…",
        hint: "Read Eagle 6+ board element positions into the front-panel layout",
        run: () => requestEagleBrdImport(),
      },
```

- [ ] **Step 5: Add hidden file input in render**

Find:
```js
    React.createElement("input", {
      id: "kicad-pcb-file-input",
      ref: kicadPcbInputRef,
      type: "file",
      accept: ".kicad_pcb,text/plain",
      tabIndex: -1,
      style: {
        position: "fixed",
        left: -10000,
        top: 0,
        width: 1,
        height: 1,
        opacity: 0,
      },
      onChange: onKiCadPcbImport,
    }),
```

Add immediately after it:
```js
    React.createElement("input", {
      id: "eagle-brd-file-input",
      ref: eagleBrdInputRef,
      type: "file",
      accept: ".brd",
      tabIndex: -1,
      style: {
        position: "fixed",
        left: -10000,
        top: 0,
        width: 1,
        height: 1,
        opacity: 0,
      },
      onChange: onEagleBrdImport,
    }),
```

- [ ] **Step 6: Pass prop to Topbar**

Find:
```js
      onRequestKiCadPcbImport: requestKiCadPcbImport,
```

Add on the next line:
```js
      onRequestEagleBrdImport: requestEagleBrdImport,
```

- [ ] **Step 7: Check syntax**

```bash
node --check src/App.js
```

Expected: no output (clean).

- [ ] **Step 8: Commit**

```bash
git add src/App.js
git commit -m "feat(import): wire Eagle .brd import handler and command in App.js"
```

---

## Task 4: Wire `src/Topbar.js`

**Files:**
- Modify: `src/Topbar.js`

- [ ] **Step 1: Add prop to Topbar destructuring**

Find:
```js
function Topbar({
  onExportSVGClick,
  onRequestProjectFileImport,
  onRequestKiCadPcbImport,
```

Add `onRequestEagleBrdImport` after `onRequestKiCadPcbImport`:
```js
function Topbar({
  onExportSVGClick,
  onRequestProjectFileImport,
  onRequestKiCadPcbImport,
  onRequestEagleBrdImport,
```

- [ ] **Step 2: Pass prop to FileMenuContent**

Find:
```js
            React.createElement(FileMenuContent, {
              onClose: () => setOpenMenu(null),
              onExportSVGClick,
              onRequestProjectFileImport,
              onRequestKiCadPcbImport,
              onOpenLocalProjects,
            }),
```

Add `onRequestEagleBrdImport` to the props object:
```js
            React.createElement(FileMenuContent, {
              onClose: () => setOpenMenu(null),
              onExportSVGClick,
              onRequestProjectFileImport,
              onRequestKiCadPcbImport,
              onRequestEagleBrdImport,
              onOpenLocalProjects,
            }),
```

- [ ] **Step 3: Check syntax**

```bash
node --check src/Topbar.js
```

Expected: no output (clean).

- [ ] **Step 4: Commit**

```bash
git add src/Topbar.js
git commit -m "feat(import): pass onRequestEagleBrdImport through Topbar"
```

---

## Task 5: Add button in `src/TopbarMenus.js`

**Files:**
- Modify: `src/TopbarMenus.js`

- [ ] **Step 1: Add prop to FileMenuContent destructuring**

Find:
```js
function FileMenuContent({
  onClose,
  onExportSVGClick,
  onRequestProjectFileImport,
  onRequestKiCadPcbImport,
  onOpenLocalProjects,
}) {
```

Add `onRequestEagleBrdImport`:
```js
function FileMenuContent({
  onClose,
  onExportSVGClick,
  onRequestProjectFileImport,
  onRequestKiCadPcbImport,
  onRequestEagleBrdImport,
  onOpenLocalProjects,
}) {
```

- [ ] **Step 2: Add Import Eagle button**

Find the "Import KiCad PCB..." button:
```js
      React.createElement(
        "button",
        {
          onClick: () => {
            onClose();
            onRequestKiCadPcbImport();
          },
        },
        "Import KiCad PCB...",
      ),
```

Add the Eagle button immediately after it:
```js
      React.createElement(
        "button",
        {
          onClick: () => {
            onClose();
            onRequestEagleBrdImport();
          },
        },
        "Import Eagle .brd...",
      ),
```

- [ ] **Step 3: Check syntax**

```bash
node --check src/TopbarMenus.js
```

Expected: no output (clean).

- [ ] **Step 4: Commit**

```bash
git add src/TopbarMenus.js
git commit -m "feat(import): add Import Eagle .brd button to File menu"
```

---

## Task 6: Full verification

- [ ] **Step 1: Run format check and syntax check**

```bash
npm run format:check && npm run check:syntax
```

Expected: `All matched files use Prettier code style!` and no JS syntax errors.

- [ ] **Step 2: Fix formatting if needed**

If prettier complains about `eagleImport.js`:
```bash
npm run format
git add src/export/eagleImport.js
git commit -m "style: format eagleImport.js"
```

- [ ] **Step 3: Run visual verification**

```bash
npm run verify
```

Expected: exits 0, screenshots land in `design-review/verify-tmp/`.

- [ ] **Step 4: Open in browser and smoke-test**

```bash
npm run dev
```

Open `http://localhost:4173` in browser.

1. Click **File** menu → confirm "Import Eagle .brd..." button appears after "Import KiCad PCB..."
2. Click "Import Eagle .brd..." → file picker opens, accepting `.brd` files
3. Cancel picker → nothing happens (no crash)
4. If you have a real `.brd` file: import it and confirm components appear on the panel with a success toast

- [ ] **Step 5: Final commit (if anything changed)**

If no changes needed, skip. Otherwise:
```bash
git add -p
git commit -m "fix(import): address eagle import smoke-test findings"
```
