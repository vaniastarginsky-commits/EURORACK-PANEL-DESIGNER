# PROJECT_MAP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `PROJECT_MAP.md` and `PROJECT_MAP.json` at repo root; update `AGENTS.md` and `CLAUDE.md` to reference them.

**Architecture:** Two files always kept in sync — `.md` for agent grep-reading (one H2 per surface), `.json` for machine/tooling use. 16 active surfaces + 1 dead-code entry. After creation, restore the "read PROJECT_MAP before fixing a bug" instruction in both agent config files.

**Tech Stack:** Plain markdown, plain JSON, bash for validation.

---

## Files touched

| Action | Path |
|---|---|
| Create | `PROJECT_MAP.md` |
| Create | `PROJECT_MAP.json` |
| Modify | `AGENTS.md` |
| Modify | `CLAUDE.md` |

---

### Task 1: Create PROJECT_MAP.md

**Files:**
- Create: `PROJECT_MAP.md`

- [ ] **Step 1: Write PROJECT_MAP.md**

Create the file at repo root with this exact content:

```markdown
# PROJECT_MAP

> Before fixing a bug: find the surface that matches the symptom, read its `owns` list, respect its `do_not_touch` list.
> Update this file (and PROJECT_MAP.json) whenever a file is added, removed, or changes ownership.

---

## canvas

**Description:** SVG panel render — grid, components, text, artwork, rulers, zoom/pan, selection, drag.

**Owns:**
- `src/Canvas.js`

**CSS section:** §6 Canvas

**Shared:** false

**Do not touch:**
- `src/App.js` — owns canvas event wiring and clientToMM; edit via app-state surface
- `src/canvasOverlays.js` — separate surface

---

## canvas-overlays

**Description:** Canvas overlay React components: scale layer, component hover tooltip, snap feedback badge, DFM status float.

**Owns:**
- `src/canvasOverlays.js`

**CSS section:** §6 Canvas

**Shared:** false

**Do not touch:**
- `src/Canvas.js` — separate surface
- `src/App.js` — shared orchestrator

---

## canvas-tool-rail

**Description:** Left tool rail — desktop controls, mobile nudge/edit/delete (`.canvas-tool-mobile-only`), component library picker (Add button). Renders on both desktop and mobile.

**Owns:**
- `src/CanvasToolRail.js`
- `src/CanvasToolMenus.js`
- `src/components/library/PartLibraryUI.js`
- `src/ux/partHistory.js`

**CSS section:** §8 Canvas Tool Rail

**Shared:** false

**Do not touch:**
- `src/App.js` — shared orchestrator
- `src/MobileDock.js` — separate mobile surface

---

## topbar

**Description:** Header bar — brand, project/panel/text dropdown menus (ProjectPanel, PanelSettings, TextPanel), Templates, File, Help.

**Owns:**
- `src/Topbar.js`
- `src/TopbarMenus.js`
- `src/LeftSidebarPanels.js`

**CSS section:** §5 Topbar

**Shared:** false

**Do not touch:**
- `src/App.js` — shared orchestrator
- `src/appCommands.js` — storage surface

---

## right-sidebar

**Description:** Right panel — inspector tabs for component properties, object properties, production, workflow, status, warnings.

**Owns:**
- `src/RightSidebar.js`
- `src/RightSidebarPanels.js`
- `src/RightSidebarFields.js`
- `src/RightSidebarComponentProperties.js`
- `src/RightSidebarObjectProperties.js`
- `src/RightSidebarProductionPanels.js`
- `src/RightSidebarWorkflowPanels.js`
- `src/RightSidebarStatusPanels.js`

**CSS section:** §4 Right Sidebar

**Shared:** false

**Do not touch:**
- `src/App.js` — shared orchestrator
- `src/LayerManager.js` — separate surface

---

## mobile-dock

**Description:** Mobile bottom bar — mode switch, sheet triggers (edit/properties). Nudge/edit controls live in canvas-tool-rail (`.canvas-tool-mobile-only`).

**Owns:**
- `src/MobileDock.js`

**CSS section:** §7 Mobile

**Shared:** false

**Do not touch:**
- `src/CanvasToolRail.js` — owns mobile nudge/edit controls
- `src/App.js` — shared orchestrator

---

## layer-manager

**Description:** Layer visibility panel rendered inside a right sidebar tab.

**Owns:**
- `src/LayerManager.js`

**CSS section:** §4 Right Sidebar

**Shared:** false

**Do not touch:**
- `src/RightSidebar.js` — right-sidebar surface
- `src/App.js` — shared orchestrator

---

## export

**Description:** SVG / DXF / PSD / ZIP / KiCad export engine, dialog, and format helpers.

**Owns:**
- `src/exportEngine.js`
- `src/exportHelpers.js`
- `src/ExportDialog.js`
- `src/export/kiCadExport.js`
- `src/export/kiCadImport.js`
- `src/export/psdExport.js`
- `src/export/zipUtils.js`
- `src/export/downloadHelpers.js`

**CSS section:** §11 Export Dialog

**Shared:** false

**Do not touch:**
- `src/App.js` — shared orchestrator
- `src/projectStorage.js` — storage surface

---

## templates

**Description:** Factory templates, user template storage, templates dialog.

**Owns:**
- `src/TemplatesDialog.js`
- `src/FactoryTemplates.js`
- `src/templateStorage.js`
- `src/templates/factoryTemplateData.js`
- `src/templates/templateDefaults.js`
- `src/templates/templateSavePrompt.js`

**CSS section:** §10 Dialogs

**Shared:** false

**Do not touch:**
- `src/App.js` — shared orchestrator
- `src/projectStorage.js` — storage surface

---

## theme

**Description:** Appearance presets, accent hue, view contrast. ThemeEngine is the sole owner of CSS custom property vars — never set vars manually outside this surface.

**Owns:**
- `src/ThemeEngine.js`
- `src/AppearanceModal.js`
- `src/ViewContrast.js`

**CSS section:** §2 Theme tokens

**Shared:** false

**Do not touch:**
- `styles.css` §2 directly — read ThemeEngine.js first; vars are set at runtime
- `src/App.js` — shared orchestrator

---

## app-state

**Description:** React context, reducer, app-wide constants and pure utilities. Shared by all surfaces — edit with care and read core.js before touching.

**Owns:**
- `src/appState.js`
- `src/core.js`
- `src/App.js`
- `src/AppOverlays.js`
- `src/NativeDialogs.js`
- `src/PresetLayouts.js`

**CSS section:** §9 Overlays / Modals

**Shared:** true

**Do not touch:**
- (this surface is the shared foundation — all surfaces depend on it; changes here are high blast-radius)

---

## component-library

**Description:** Built-in part definitions, sort order, type predicates, visual geometry helpers. Pure data and pure functions — no React, no state.

**Owns:**
- `src/components/library/componentDefinitions.js`
- `src/components/library/componentSorting.js`
- `src/componentLibrary.js`
- `src/componentHelpers.js`

**CSS section:** none

**Shared:** true

**Do not touch:**
- `src/appState.js` — state is app-state surface
- `src/core.js` — app-state surface

---

## geometry

**Description:** Pure math — OBB collision detection, front shape geometry, measurement helpers. No React, no state, no DOM.

**Owns:**
- `src/geometry/obbMath.js`
- `src/geometry/frontShapeGeometry.js`
- `src/geometry/measurementHelpers.js`

**CSS section:** none

**Shared:** false

**Do not touch:**
- (pure functions only — no side effects; safe to call from any surface)

---

## storage

**Description:** localStorage project I/O, schema validation/normalization, app command bridge (window events).

**Owns:**
- `src/projectStorage.js`
- `src/projectSchema.js`
- `src/appCommands.js`

**CSS section:** none

**Shared:** false

**Do not touch:**
- `src/appState.js` — state is app-state surface
- `src/templateStorage.js` — templates surface

---

## workspace-shell

**Description:** CSS grid layout wrapper. Sets `--left-col` / `--right-col` vars. Never set `grid-column` manually on `.sidebar-right` or `.canvas-wrap` — go through this surface.

**Owns:**
- `src/WorkspaceShell.js`

**CSS section:** §1 Workspace / Layout

**Shared:** false

**Do not touch:**
- `styles.css` §1 directly without reading WorkspaceShell.js first

---

## bootstrap

**Description:** Page initialization, CDN error handling, device classification, toast, React error boundary, runtime self-test. All files load before React is used.

**Owns:**
- `src/main.js`
- `src/startup-error.js`
- `src/still-loading.js`
- `src/runtime-errors.js`
- `src/device-classes.js`
- `src/toast.js`
- `src/canvas-browser-guards.js`
- `src/runtime/ErrorBoundary.js`
- `src/diagnostics/runtimeSelfTest.js`

**CSS section:** §11 Bootstrap

**Shared:** false

**Do not touch:**
- `index.html` script load order — the load order IS the dependency graph; do not reorder without tracing deps

---

## dead

**Description:** Files that exist in the repo but are not rendered or called anywhere in the current build. Do not edit. Do not delete without explicit instruction.

**Files:**
- `src/LeftSidebar.js` — left sidebar removed from all layouts (desktop and mobile); file not rendered anywhere

---

## Cross-surface rules

- `src/App.js` — shared orchestrator; only edit from `app-state` surface. Never touch from canvas, sidebar, topbar, or export surfaces.
- `src/core.js` — shared constants; changes affect every surface. Always read before editing.
- `src/ThemeEngine.js` — sole owner of CSS vars. Never set CSS custom properties manually outside ThemeEngine.
- `styles.css` — do not add `!important`. Do not hardcode hex values; use semantic tokens (`var(--ui-*)`).
- `index.html` — script load order is the dependency graph. Do not reorder without understanding load deps.
- `src/LeftSidebar.js` — dead code. Do not edit, do not delete without explicit instruction.

---

## CSS section index

| § | Section name | Surfaces |
|---|---|---|
| §1 | Workspace / Layout | `workspace-shell` |
| §2 | Theme tokens | `theme` |
| §3 | Left Sidebar | dead — keep for reference only |
| §4 | Right Sidebar | `right-sidebar`, `layer-manager` |
| §5 | Topbar | `topbar` |
| §6 | Canvas | `canvas`, `canvas-overlays` |
| §7 | Mobile | `mobile-dock` |
| §8 | Canvas Tool Rail | `canvas-tool-rail` |
| §9 | Overlays / Modals | `app-state` |
| §10 | Dialogs | `templates` |
| §11 | Export Dialog / Bootstrap | `export`, `bootstrap` |

---

## Full file → surface index

| File | Surface |
|---|---|
| `src/App.js` | `app-state` (shared) |
| `src/appCommands.js` | `storage` |
| `src/AppearanceModal.js` | `theme` |
| `src/AppOverlays.js` | `app-state` |
| `src/appState.js` | `app-state` |
| `src/canvas-browser-guards.js` | `bootstrap` |
| `src/Canvas.js` | `canvas` |
| `src/canvasOverlays.js` | `canvas-overlays` |
| `src/CanvasToolMenus.js` | `canvas-tool-rail` |
| `src/CanvasToolRail.js` | `canvas-tool-rail` |
| `src/componentHelpers.js` | `component-library` |
| `src/componentLibrary.js` | `component-library` |
| `src/components/library/componentDefinitions.js` | `component-library` |
| `src/components/library/componentSorting.js` | `component-library` |
| `src/components/library/PartLibraryUI.js` | `canvas-tool-rail` |
| `src/core.js` | `app-state` (shared) |
| `src/device-classes.js` | `bootstrap` |
| `src/diagnostics/runtimeSelfTest.js` | `bootstrap` |
| `src/ExportDialog.js` | `export` |
| `src/export/downloadHelpers.js` | `export` |
| `src/export/kiCadExport.js` | `export` |
| `src/export/kiCadImport.js` | `export` |
| `src/export/psdExport.js` | `export` |
| `src/export/zipUtils.js` | `export` |
| `src/exportEngine.js` | `export` |
| `src/exportHelpers.js` | `export` |
| `src/FactoryTemplates.js` | `templates` |
| `src/geometry/frontShapeGeometry.js` | `geometry` |
| `src/geometry/measurementHelpers.js` | `geometry` |
| `src/geometry/obbMath.js` | `geometry` |
| `src/LayerManager.js` | `layer-manager` |
| `src/LeftSidebar.js` | **dead** |
| `src/LeftSidebarPanels.js` | `topbar` |
| `src/main.js` | `bootstrap` |
| `src/MobileDock.js` | `mobile-dock` |
| `src/NativeDialogs.js` | `app-state` |
| `src/PresetLayouts.js` | `app-state` |
| `src/projectSchema.js` | `storage` |
| `src/projectStorage.js` | `storage` |
| `src/RightSidebar.js` | `right-sidebar` |
| `src/RightSidebarComponentProperties.js` | `right-sidebar` |
| `src/RightSidebarFields.js` | `right-sidebar` |
| `src/RightSidebarObjectProperties.js` | `right-sidebar` |
| `src/RightSidebarPanels.js` | `right-sidebar` |
| `src/RightSidebarProductionPanels.js` | `right-sidebar` |
| `src/RightSidebarStatusPanels.js` | `right-sidebar` |
| `src/RightSidebarWorkflowPanels.js` | `right-sidebar` |
| `src/runtime/ErrorBoundary.js` | `bootstrap` |
| `src/runtime-errors.js` | `bootstrap` |
| `src/startup-error.js` | `bootstrap` |
| `src/still-loading.js` | `bootstrap` |
| `src/templateStorage.js` | `templates` |
| `src/templates/factoryTemplateData.js` | `templates` |
| `src/templates/templateDefaults.js` | `templates` |
| `src/templates/templateSavePrompt.js` | `templates` |
| `src/TemplatesDialog.js` | `templates` |
| `src/ThemeEngine.js` | `theme` |
| `src/toast.js` | `bootstrap` |
| `src/Topbar.js` | `topbar` |
| `src/TopbarMenus.js` | `topbar` |
| `src/ux/partHistory.js` | `canvas-tool-rail` |
| `src/ViewContrast.js` | `theme` |
| `src/WorkspaceShell.js` | `workspace-shell` |
| `styles.css` | all surfaces |
| `index.html` | `bootstrap` |
```

- [ ] **Step 2: Verify file was created and has content**

Run:
```bash
wc -l PROJECT_MAP.md && grep "^## " PROJECT_MAP.md
```

Expected output: line count > 200, and 18 H2 headers listed (16 surfaces + `dead` + `Cross-surface rules` + `CSS section index` + `Full file → surface index`).

- [ ] **Step 3: Commit**

```bash
git add PROJECT_MAP.md
git commit -m "docs: add PROJECT_MAP.md — 16 surfaces, file-to-surface index"
```

---

### Task 2: Create PROJECT_MAP.json

**Files:**
- Create: `PROJECT_MAP.json`

- [ ] **Step 1: Write PROJECT_MAP.json**

Create the file at repo root with this exact content:

```json
{
  "version": "1.0.0",
  "updated": "2026-05-25",
  "surfaces": [
    {
      "surface": "canvas",
      "description": "SVG panel render — grid, components, text, artwork, rulers, zoom/pan, selection, drag.",
      "owns": ["src/Canvas.js"],
      "css_section": "§6 Canvas",
      "shared": false,
      "do_not_touch": [
        { "file": "src/App.js", "reason": "owns canvas event wiring and clientToMM — edit via app-state surface" },
        { "file": "src/canvasOverlays.js", "reason": "separate surface" }
      ]
    },
    {
      "surface": "canvas-overlays",
      "description": "Canvas overlay React components: scale layer, component hover tooltip, snap feedback badge, DFM status float.",
      "owns": ["src/canvasOverlays.js"],
      "css_section": "§6 Canvas",
      "shared": false,
      "do_not_touch": [
        { "file": "src/Canvas.js", "reason": "separate surface" },
        { "file": "src/App.js", "reason": "shared orchestrator" }
      ]
    },
    {
      "surface": "canvas-tool-rail",
      "description": "Left tool rail — desktop controls, mobile nudge/edit/delete (.canvas-tool-mobile-only), component library picker (Add button). Renders on both desktop and mobile.",
      "owns": [
        "src/CanvasToolRail.js",
        "src/CanvasToolMenus.js",
        "src/components/library/PartLibraryUI.js",
        "src/ux/partHistory.js"
      ],
      "css_section": "§8 Canvas Tool Rail",
      "shared": false,
      "do_not_touch": [
        { "file": "src/App.js", "reason": "shared orchestrator" },
        { "file": "src/MobileDock.js", "reason": "separate mobile surface" }
      ]
    },
    {
      "surface": "topbar",
      "description": "Header bar — brand, project/panel/text dropdown menus (ProjectPanel, PanelSettings, TextPanel), Templates, File, Help.",
      "owns": [
        "src/Topbar.js",
        "src/TopbarMenus.js",
        "src/LeftSidebarPanels.js"
      ],
      "css_section": "§5 Topbar",
      "shared": false,
      "do_not_touch": [
        { "file": "src/App.js", "reason": "shared orchestrator" },
        { "file": "src/appCommands.js", "reason": "storage surface" }
      ]
    },
    {
      "surface": "right-sidebar",
      "description": "Right panel — inspector tabs for component properties, object properties, production, workflow, status, warnings.",
      "owns": [
        "src/RightSidebar.js",
        "src/RightSidebarPanels.js",
        "src/RightSidebarFields.js",
        "src/RightSidebarComponentProperties.js",
        "src/RightSidebarObjectProperties.js",
        "src/RightSidebarProductionPanels.js",
        "src/RightSidebarWorkflowPanels.js",
        "src/RightSidebarStatusPanels.js"
      ],
      "css_section": "§4 Right Sidebar",
      "shared": false,
      "do_not_touch": [
        { "file": "src/App.js", "reason": "shared orchestrator" },
        { "file": "src/LayerManager.js", "reason": "separate surface" }
      ]
    },
    {
      "surface": "mobile-dock",
      "description": "Mobile bottom bar — mode switch, sheet triggers (edit/properties). Nudge/edit controls live in canvas-tool-rail (.canvas-tool-mobile-only).",
      "owns": ["src/MobileDock.js"],
      "css_section": "§7 Mobile",
      "shared": false,
      "do_not_touch": [
        { "file": "src/CanvasToolRail.js", "reason": "owns mobile nudge/edit controls" },
        { "file": "src/App.js", "reason": "shared orchestrator" }
      ]
    },
    {
      "surface": "layer-manager",
      "description": "Layer visibility panel rendered inside a right sidebar tab.",
      "owns": ["src/LayerManager.js"],
      "css_section": "§4 Right Sidebar",
      "shared": false,
      "do_not_touch": [
        { "file": "src/RightSidebar.js", "reason": "right-sidebar surface" },
        { "file": "src/App.js", "reason": "shared orchestrator" }
      ]
    },
    {
      "surface": "export",
      "description": "SVG / DXF / PSD / ZIP / KiCad export engine, dialog, and format helpers.",
      "owns": [
        "src/exportEngine.js",
        "src/exportHelpers.js",
        "src/ExportDialog.js",
        "src/export/kiCadExport.js",
        "src/export/kiCadImport.js",
        "src/export/psdExport.js",
        "src/export/zipUtils.js",
        "src/export/downloadHelpers.js"
      ],
      "css_section": "§11 Export Dialog",
      "shared": false,
      "do_not_touch": [
        { "file": "src/App.js", "reason": "shared orchestrator" },
        { "file": "src/projectStorage.js", "reason": "storage surface" }
      ]
    },
    {
      "surface": "templates",
      "description": "Factory templates, user template storage, templates dialog.",
      "owns": [
        "src/TemplatesDialog.js",
        "src/FactoryTemplates.js",
        "src/templateStorage.js",
        "src/templates/factoryTemplateData.js",
        "src/templates/templateDefaults.js",
        "src/templates/templateSavePrompt.js"
      ],
      "css_section": "§10 Dialogs",
      "shared": false,
      "do_not_touch": [
        { "file": "src/App.js", "reason": "shared orchestrator" },
        { "file": "src/projectStorage.js", "reason": "storage surface" }
      ]
    },
    {
      "surface": "theme",
      "description": "Appearance presets, accent hue, view contrast. ThemeEngine is the sole owner of CSS custom property vars.",
      "owns": [
        "src/ThemeEngine.js",
        "src/AppearanceModal.js",
        "src/ViewContrast.js"
      ],
      "css_section": "§2 Theme tokens",
      "shared": false,
      "do_not_touch": [
        { "file": "styles.css §2", "reason": "vars are set at runtime by ThemeEngine — read ThemeEngine.js before touching" },
        { "file": "src/App.js", "reason": "shared orchestrator" }
      ]
    },
    {
      "surface": "app-state",
      "description": "React context, reducer, app-wide constants and pure utilities. Shared by all surfaces — edit with care.",
      "owns": [
        "src/appState.js",
        "src/core.js",
        "src/App.js",
        "src/AppOverlays.js",
        "src/NativeDialogs.js",
        "src/PresetLayouts.js"
      ],
      "css_section": "§9 Overlays / Modals",
      "shared": true,
      "do_not_touch": []
    },
    {
      "surface": "component-library",
      "description": "Built-in part definitions, sort order, type predicates, visual geometry helpers. Pure data and pure functions — no React, no state.",
      "owns": [
        "src/components/library/componentDefinitions.js",
        "src/components/library/componentSorting.js",
        "src/componentLibrary.js",
        "src/componentHelpers.js"
      ],
      "css_section": "none",
      "shared": true,
      "do_not_touch": [
        { "file": "src/appState.js", "reason": "state is app-state surface" },
        { "file": "src/core.js", "reason": "app-state surface" }
      ]
    },
    {
      "surface": "geometry",
      "description": "Pure math — OBB collision detection, front shape geometry, measurement helpers. No React, no state, no DOM.",
      "owns": [
        "src/geometry/obbMath.js",
        "src/geometry/frontShapeGeometry.js",
        "src/geometry/measurementHelpers.js"
      ],
      "css_section": "none",
      "shared": false,
      "do_not_touch": []
    },
    {
      "surface": "storage",
      "description": "localStorage project I/O, schema validation/normalization, app command bridge (window events).",
      "owns": [
        "src/projectStorage.js",
        "src/projectSchema.js",
        "src/appCommands.js"
      ],
      "css_section": "none",
      "shared": false,
      "do_not_touch": [
        { "file": "src/appState.js", "reason": "state is app-state surface" },
        { "file": "src/templateStorage.js", "reason": "templates surface" }
      ]
    },
    {
      "surface": "workspace-shell",
      "description": "CSS grid layout wrapper. Sets --left-col / --right-col vars. Never set grid-column manually on .sidebar-right or .canvas-wrap.",
      "owns": ["src/WorkspaceShell.js"],
      "css_section": "§1 Workspace / Layout",
      "shared": false,
      "do_not_touch": [
        { "file": "styles.css §1", "reason": "read WorkspaceShell.js first; grid vars are set here" }
      ]
    },
    {
      "surface": "bootstrap",
      "description": "Page initialization, CDN error handling, device classification, toast, React error boundary, runtime self-test. All files load before React is used.",
      "owns": [
        "src/main.js",
        "src/startup-error.js",
        "src/still-loading.js",
        "src/runtime-errors.js",
        "src/device-classes.js",
        "src/toast.js",
        "src/canvas-browser-guards.js",
        "src/runtime/ErrorBoundary.js",
        "src/diagnostics/runtimeSelfTest.js"
      ],
      "css_section": "§11 Bootstrap",
      "shared": false,
      "do_not_touch": [
        { "file": "index.html script order", "reason": "load order IS the dependency graph — do not reorder without tracing deps" }
      ]
    }
  ],
  "dead_files": [
    {
      "file": "src/LeftSidebar.js",
      "reason": "Left sidebar removed from all layouts (desktop and mobile). File not rendered anywhere. Do not edit. Do not delete without explicit instruction."
    }
  ],
  "cross_surface_rules": [
    "src/App.js — only edit from app-state surface. Never touch from canvas, sidebar, topbar, or export surfaces.",
    "src/core.js — shared constants; changes affect every surface. Always read before editing.",
    "src/ThemeEngine.js — sole owner of CSS vars. Never set CSS custom properties manually outside ThemeEngine.",
    "styles.css — do not add !important. Do not hardcode hex values; use semantic tokens (var(--ui-*)).",
    "index.html — script load order is the dependency graph. Do not reorder without understanding load deps.",
    "src/LeftSidebar.js — dead code. Do not edit, do not delete without explicit instruction."
  ]
}
```

- [ ] **Step 2: Validate JSON**

Run:
```bash
node -e "const d = JSON.parse(require('fs').readFileSync('PROJECT_MAP.json','utf8')); console.log('surfaces:', d.surfaces.length, '| dead_files:', d.dead_files.length)"
```

Expected output:
```
surfaces: 16 | dead_files: 1
```

- [ ] **Step 3: Commit**

```bash
git add PROJECT_MAP.json
git commit -m "docs: add PROJECT_MAP.json — 16 surfaces, machine-readable"
```

---

### Task 3: Update AGENTS.md and CLAUDE.md

**Files:**
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update AGENTS.md**

In `AGENTS.md`, find this block (around line 32):

```
Before fixing a bug, identify the affected surface and touch only its owner file/section.
Do not edit unrelated owners.
```

Replace it with:

```
Before fixing a bug, read PROJECT_MAP.md / PROJECT_MAP.json for the affected surface.
Use the `owns` list to identify files to touch and `do_not_touch` to avoid unrelated files.
Do not edit unrelated owners.
```

- [ ] **Step 2: Update CLAUDE.md**

In `CLAUDE.md`, find this block (in the No-important preservation policy section):

```
Before fixing a bug, identify the affected surface and touch only its owner file/section.
Do not edit unrelated owners.
```

Replace it with:

```
Before fixing a bug, read PROJECT_MAP.md / PROJECT_MAP.json for the affected surface.
Use the `owns` list to identify files to touch and `do_not_touch` to avoid unrelated files.
Do not edit unrelated owners.
```

- [ ] **Step 3: Verify both files reference PROJECT_MAP**

Run:
```bash
grep "PROJECT_MAP" AGENTS.md CLAUDE.md
```

Expected output — both files should show a matching line:
```
AGENTS.md:Before fixing a bug, read PROJECT_MAP.md / PROJECT_MAP.json for the affected surface.
CLAUDE.md:Before fixing a bug, read PROJECT_MAP.md / PROJECT_MAP.json for the affected surface.
```

- [ ] **Step 4: Commit**

```bash
git add AGENTS.md CLAUDE.md
git commit -m "docs: restore PROJECT_MAP reference in AGENTS.md and CLAUDE.md"
```

---

## Self-review

**Spec coverage:**
- ✅ 16 active surfaces defined in both files
- ✅ Dead code section present
- ✅ Cross-surface rules present
- ✅ CSS section index in .md
- ✅ Full file→surface index in .md
- ✅ AGENTS.md and CLAUDE.md updated
- ✅ JSON validated with node

**Placeholder scan:** No TBD/TODO. All file paths explicit. All JSON content complete.

**Type consistency:** Surface IDs are identical between .md H2 anchors and .json `surface` fields. `do_not_touch` uses same file paths as `owns` elsewhere.
