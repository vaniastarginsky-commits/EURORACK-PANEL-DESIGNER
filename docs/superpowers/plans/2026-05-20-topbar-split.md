# Topbar.js Split — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the four inline dropdown menu bodies from `src/Topbar.js` into `src/TopbarMenus.js`, reducing Topbar from 538 lines to ~175 lines.

**Architecture:** Global scripts, no bundler. `TopbarMenus.js` declares four component functions (`AddMenuContent`, `TemplatesMenuContent`, `FileMenuContent`, `HelpMenuContent`) in the global scope. Each uses hooks directly (`useAppState`, `useAppDispatch`) so they need no prop threading for state/dispatch. `TopbarMenus.js` loads after `appState.js` (needs hooks) and before `Topbar.js` (needs the components). No changes to behaviour — pure structural extraction.

**Tech Stack:** Vanilla JS, React 18 UMD (CDN). Verification via `npm run screenshot` (Playwright).

---

## File map

| File | Action | Responsibility |
|---|---|---|
| `src/TopbarMenus.js` | Create | `AddMenuContent`, `TemplatesMenuContent`, `FileMenuContent`, `HelpMenuContent` |
| `src/Topbar.js` | Modify | Shell only: state (openMenu, menuPos), topbar bar, portal container with component refs |
| `index.html` | Modify | Add `TopbarMenus.js` script tag before `Topbar.js` |

---

## Task 1 — Create `src/TopbarMenus.js`

**Files:**
- Create: `src/TopbarMenus.js`

- [ ] **Step 1: Create the file with all four menu content components**

Write `src/TopbarMenus.js` with this exact content:

```js
// Topbar dropdown menu content components.
// Depends on: useAppState, useAppDispatch (appState.js), panelWidthMM, snapToGrid,
// PANEL_HEIGHT_MM, TEXT_FONT_OPTIONS, APP_VERSION (core.js), appConfirm (NativeDialogs.js),
// validateAndNormalize (projectSchema.js), AppCommands (appCommands.js),
// loadLocalProjects, exportJSON, saveProjectToBrowser, copyTable (exportEngine.js/core.js),
// makeTemplateFromState, saveTemplateToBrowser, exportTemplatesLibrary,
// importTemplatesLibraryFile (FactoryTemplates.js — called at runtime only).

function AddMenuContent({ onClose }) {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const widthMM = panelWidthMM(state.panel);

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
        onClose();
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

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
        { onClick: () => document.getElementById("topbar-artwork-import-input")?.click() },
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
  );
}

function TemplatesMenuContent({ onClose }) {
  const state = useAppState();

  return React.createElement(
    React.Fragment,
    null,
    React.createElement("div", { className: "menu-title" }, "Templates"),
    React.createElement(
      "div",
      { className: "menu-grid" },
      React.createElement(
        "button",
        {
          onClick: async () => {
            const t = await makeTemplateFromState(state, "panel");
            if (t) {
              saveTemplateToBrowser(t);
              alert(`Saved template "${t.name}".`);
            }
            onClose();
          },
        },
        "Save current panel",
      ),
      React.createElement(
        "button",
        {
          disabled: state.selected.length === 0,
          onClick: async () => {
            const t = await makeTemplateFromState(state, "block", state.selected);
            if (t) {
              saveTemplateToBrowser(t);
              alert(`Saved block template "${t.name}".`);
            }
            onClose();
          },
        },
        "Save selected block",
      ),
      React.createElement(
        "button",
        {
          className: "primary",
          onClick: () => {
            onClose();
            AppCommands.openTemplatesDialog();
          },
        },
        "Load / Manage templates",
      ),
      React.createElement(
        "button",
        {
          onClick: () => {
            exportTemplatesLibrary();
            onClose();
          },
        },
        "Export templates",
      ),
      React.createElement(
        "button",
        {
          onClick: () => {
            importTemplatesLibraryFile();
            onClose();
          },
        },
        "Import templates",
      ),
    ),
    React.createElement(
      "div",
      { className: "menu-note" },
      "Default templates are baked into this HTML. Browser templates can still be saved, imported and exported.",
    ),
  );
}

function FileMenuContent({ onClose, onExportSVGClick, onRequestProjectFileImport, onRequestKiCadPcbImport, onOpenLocalProjects }) {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const [fileRecentOpen, setFileRecentOpen] = useState(true);
  const recentFileProjects = loadLocalProjects().slice(0, 7);

  async function loadRecentProject(record) {
    let raw;
    try {
      raw = JSON.parse(record.data);
    } catch {
      alert("Saved project is corrupted and could not be parsed.");
      return;
    }
    const result = validateAndNormalize(raw);
    if (!result.ok) {
      alert(`Load failed: ${result.error}`);
      return;
    }
    const hasContent =
      state.components.length > 0 ||
      state.artworks.length > 0 ||
      state.textItems.length > 0 ||
      state.scaleItems.length > 0;
    if (hasContent) {
      const ok = await appConfirm({
        title: "Load recent project",
        message: `Replace the current project with "${record.name}"?`,
        confirmText: "Load project",
      });
      if (!ok) return;
    }
    dispatch({ type: "LOAD_STATE", state: result.state });
    onClose();
  }

  return React.createElement(
    React.Fragment,
    null,
    React.createElement("div", { className: "menu-title" }, "File / Export"),
    React.createElement(
      "div",
      { className: "menu-grid" },
      React.createElement(
        "button",
        {
          onClick: () => {
            onExportSVGClick();
            onClose();
          },
        },
        "Export...",
      ),
      React.createElement(
        "button",
        {
          onClick: () => {
            onExportSVGClick();
            onClose();
          },
        },
        "Export KiCad PCB...",
      ),
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
      React.createElement(
        "button",
        {
          onClick: () => {
            exportJSON(state);
            onClose();
          },
        },
        "Save Project File",
      ),
      React.createElement(
        "button",
        {
          onClick: () => {
            onClose();
            onRequestProjectFileImport();
          },
        },
        "Load Project File",
      ),
      React.createElement(
        "button",
        {
          onClick: () => {
            saveProjectToBrowser(state);
            setFileRecentOpen(true);
          },
        },
        "Save to Browser",
      ),
      React.createElement(
        "button",
        {
          className: `recent-projects-toggle ${fileRecentOpen ? "active" : ""}`,
          onClick: () => setFileRecentOpen((v) => !v),
        },
        "Recent Projects ",
        recentFileProjects.length ? `(${recentFileProjects.length})` : "",
        " ",
        fileRecentOpen ? "▴" : "▾",
      ),
      fileRecentOpen &&
        React.createElement(
          "div",
          { className: "recent-projects-menu-list" },
          recentFileProjects.length
            ? recentFileProjects.map((p) =>
                React.createElement(
                  "button",
                  {
                    key: p.id,
                    className: "recent-project-menu-item",
                    onClick: () => loadRecentProject(p),
                    title: `${p.name} - ${new Date(p.updatedAt).toLocaleString()} - ${(p.sizeBytes / 1024).toFixed(0)} KB`,
                  },
                  React.createElement("strong", null, p.name),
                  React.createElement(
                    "small",
                    null,
                    new Date(p.updatedAt).toLocaleString(),
                    " - ",
                    (p.sizeBytes / 1024).toFixed(0),
                    " KB",
                  ),
                ),
              )
            : React.createElement(
                "div",
                { className: "recent-projects-empty" },
                "No recent browser projects yet. Use Save to Browser first.",
              ),
          React.createElement(
            "button",
            {
              className: "recent-projects-manager",
              onClick: () => {
                onClose();
                onOpenLocalProjects();
              },
            },
            "Manage all local projects...",
          ),
        ),
      React.createElement(
        "button",
        {
          onClick: () => {
            copyTable(state.components);
            onClose();
          },
        },
        "Copy component table",
      ),
    ),
  );
}

function HelpMenuContent({ onClose, onOpenShortcuts, onOpenProductionCheck }) {
  return React.createElement(
    React.Fragment,
    null,
    React.createElement("div", { className: "menu-title" }, "Help / quick reference"),
    React.createElement("div", { className: "menu-note" }, "Build: ", APP_VERSION),
    React.createElement(
      "div",
      { className: "help-popover-grid" },
      React.createElement(
        "div",
        { className: "help-card warn" },
        React.createElement("strong", null, "Manufacturing"),
        React.createElement(
          "span",
          null,
          "Dimensions are planning estimates. Verify parts with datasheets or calipers before production.",
        ),
      ),
      React.createElement(
        "div",
        { className: "help-card" },
        React.createElement("strong", null, "Mobile"),
        React.createElement("span", null, "Use Add / Select / Part / View / More. Pinch to zoom."),
      ),
      React.createElement(
        "div",
        { className: "help-card" },
        React.createElement("strong", null, "Part / text editing"),
        React.createElement(
          "span",
          null,
          "Select a component for Part properties. Text labels can be edited inline in Text / Labels.",
        ),
      ),
      React.createElement(
        "div",
        { className: "help-card" },
        React.createElement("strong", null, "Snap / placement"),
        React.createElement(
          "span",
          null,
          "Normal drag is cursor anchored. Hold Shift for smart snap. Placement uses Multiple/Done.",
        ),
      ),
      React.createElement(
        "div",
        { className: "help-card" },
        React.createElement("strong", null, "KiCad export"),
        React.createElement(
          "span",
          null,
          "Use File / Export KiCad PCB for mechanical .kicad_pcb output and origin options.",
        ),
      ),
    ),
    React.createElement(
      "div",
      { className: "menu-grid two", style: { marginTop: 10 } },
      React.createElement(
        "button",
        {
          onClick: () => {
            onOpenShortcuts();
            onClose();
          },
        },
        "Open shortcuts",
      ),
      React.createElement(
        "button",
        {
          onClick: () => {
            onOpenProductionCheck();
            onClose();
          },
        },
        "Production check",
      ),
    ),
  );
}
```

- [ ] **Step 2: Verify the file was written**

```bash
wc -l src/TopbarMenus.js
grep -c "^function " src/TopbarMenus.js
```

Expected: ~260 lines, 4 functions (`AddMenuContent`, `TemplatesMenuContent`, `FileMenuContent`, `HelpMenuContent`).

---

## Task 2 — Edit `src/Topbar.js`

**Files:**
- Modify: `src/Topbar.js`

Remove the extracted code from Topbar and replace inline portal JSX with component references.

- [ ] **Step 1: Remove state and functions that moved to menu components**

In `src/Topbar.js`, delete these items (they moved to TopbarMenus.js):

1. Line 10: `const state = useAppState();` — no longer used in Topbar after extraction
2. Line 11: `const dispatch = useAppDispatch();` — no longer used in Topbar
3. Line 14: `const [fileRecentOpen, setFileRecentOpen] = useState(true);`
4. Line 15: `const widthMM = panelWidthMM(state.panel);` — now computed inside AddMenuContent
5. Line 16: `const recentFileProjects = openMenu === "file" ? loadLocalProjects().slice(0, 7) : [];`
6. Lines 19–47: the `async function loadRecentProject(record) { ... }` block
7. Lines 81–100: the `function addTopbarText() { ... }` block
8. Lines 102–137: the `function handleTopbarArtworkFile(e) { ... }` block

After deletion, the function body should start like:

```js
function Topbar({
  onExportSVGClick,
  onRequestProjectFileImport,
  onRequestKiCadPcbImport,
  onOpenLocalProjects,
  onOpenProductionCheck,
  onOpenShortcuts,
}) {
  const [openMenu, setOpenMenu] = useState(null);
  const [menuPos, setMenuPos] = useState({ left: 8, top: 48 });
  const sectionMenus = ["project", "panel", "add", "text"];

  useEffect(() => {
    // ... (unchanged)
  }, [openMenu]);

  function toggleMenu(name, e) {
    // ... (unchanged)
  }

  function menuButton(name, label) {
    // ... (unchanged)
  }
  // ... rest of render
```

- [ ] **Step 2: Replace the four inline menu bodies in the portal**

Find the portal JSX (starting around what was line 193 — now shifted up). Replace the four big inline blocks with component references.

Replace:

```js
          openMenu === "add" &&
            React.createElement(
              React.Fragment,
              null,
              React.createElement("div", { className: "menu-title" }, "Add"),
              // ... (all 30 lines of the Add menu)
            ),
          openMenu === "text" && React.createElement(TextPanel, null),
          openMenu === "templates" &&
            React.createElement(
              React.Fragment,
              null,
              // ... (all 75 lines of the Templates menu)
            ),
          openMenu === "file" &&
            React.createElement(
              React.Fragment,
              null,
              // ... (all 130 lines of the File menu)
            ),
          openMenu === "help" &&
            React.createElement(
              React.Fragment,
              null,
              // ... (all 80 lines of the Help menu)
            ),
```

With:

```js
          openMenu === "add" && React.createElement(AddMenuContent, { onClose: () => setOpenMenu(null) }),
          openMenu === "text" && React.createElement(TextPanel, null),
          openMenu === "templates" && React.createElement(TemplatesMenuContent, { onClose: () => setOpenMenu(null) }),
          openMenu === "file" &&
            React.createElement(FileMenuContent, {
              onClose: () => setOpenMenu(null),
              onExportSVGClick,
              onRequestProjectFileImport,
              onRequestKiCadPcbImport,
              onOpenLocalProjects,
            }),
          openMenu === "help" &&
            React.createElement(HelpMenuContent, {
              onClose: () => setOpenMenu(null),
              onOpenShortcuts,
              onOpenProductionCheck,
            }),
```

- [ ] **Step 3: Verify Topbar.js is clean**

```bash
wc -l src/Topbar.js
# Expected: ~175 lines (down from 538)

grep -c "loadRecentProject\|addTopbarText\|handleTopbarArtworkFile\|fileRecentOpen\|recentFileProjects" src/Topbar.js
# Expected: 0 — these are all moved to TopbarMenus.js
```

---

## Task 3 — Update `index.html`

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add `TopbarMenus.js` script tag before `Topbar.js`**

Current lines 42–43 in `index.html`:
```html
  <script src="src/MobileDock.js"></script>
  <script src="src/Topbar.js"></script>
```

Replace with:
```html
  <script src="src/MobileDock.js"></script>
  <script src="src/TopbarMenus.js"></script>
  <script src="src/Topbar.js"></script>
```

- [ ] **Step 2: Verify the order**

```bash
grep -n "TopbarMenus\|Topbar\|MobileDock" index.html
```

Expected output (lines may shift slightly):
```
42:  <script src="src/MobileDock.js"></script>
43:  <script src="src/TopbarMenus.js"></script>
44:  <script src="src/Topbar.js"></script>
```

---

## Task 4 — Verify and commit

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

Open `http://localhost:4173` in the browser. App must load without console errors.

- [ ] **Step 2: Smoke test every menu**

In the browser, click each topbar menu button and confirm the dropdown renders:
- **Project** — opens ProjectPanel (properties panel)
- **Panel** — opens PanelSettings panel
- **Add** — shows "Component picker", "+ Add Image", "+ Add Text" buttons
- **Text** — opens TextPanel
- **Templates** — shows "Save current panel", "Save selected block", "Load / Manage templates", "Export/Import" buttons
- **File** — shows all export/save/load buttons plus Recent Projects list
- **Help** — shows 5 help cards + "Open shortcuts" and "Production check" buttons

Dismiss each menu (click outside or press Escape) — all close cleanly.

- [ ] **Step 3: Test Add menu actions**

In the app:
1. Open Add → click "+ Add Text" → a TEXT item appears on the canvas. Menu closes.
2. Open Add → click "+ Add Image" → file picker opens.

- [ ] **Step 4: Run screenshot suite**

```bash
npm run screenshot
```

All captures must complete without errors. No visual regressions vs baseline.

- [ ] **Step 5: Commit**

```bash
git add src/TopbarMenus.js src/Topbar.js index.html
git commit -m "refactor: extract TopbarMenus.js from Topbar.js"
```

---

## Verification summary

After the commit:

```bash
wc -l src/TopbarMenus.js src/Topbar.js
# TopbarMenus.js: ~260 lines
# Topbar.js: ~175 lines
# Total: ~435 — within expected range vs original 538 (some comment lines added)

grep -c "^function " src/TopbarMenus.js
# Expected: 4

grep "AddMenuContent\|TemplatesMenuContent\|FileMenuContent\|HelpMenuContent" src/Topbar.js
# Expected: 4 lines — one React.createElement call per component
```
