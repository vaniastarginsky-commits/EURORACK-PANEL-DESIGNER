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
