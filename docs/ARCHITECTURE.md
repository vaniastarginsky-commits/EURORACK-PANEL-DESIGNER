# Architecture

## Entry point

`index.html` bootstraps the app. It loads vendored React 18.3.1 UMD builds from
`vendor/` (no CDN dependency), then loads all `src/` scripts as plain `<script>`
tags in dependency order. There is no bundler — every file runs in the global
browser scope and communicates through globally-assigned variables and the React
context defined in `appState.js`.

## Core source files

| File | Role |
|------|------|
| `src/core.js` | Legacy catch-all — 1988 lines, ~91 top-level definitions across 17 distinct logical groups. See **core.js audit** section below for the full map and proposed split plan. |
| `src/appState.js` | React context + reducer that owns all application state. Every component reads state via `useAppState()` and writes via `useAppDispatch()`. |
| `src/App.js` | Main orchestration layer. Wires together all major panels, handles pointer/keyboard events, and contains the top-level render tree. |
| `src/Canvas.js` | Owns panel rendering (SVG) and all canvas interactions — drag, resize, select, ruler, snap guides. |
| `src/componentLibrary.js` | Built-in component definitions (jacks, pots, LEDs, switches, faders, DIP-8 socket, etc.). Pure data — no React. |
| `src/FactoryTemplates.js` | Built-in factory templates and their preview/thumbnail helpers. |
| `src/exportEngine.js` | SVG, PNG, PDF, and drill-file export logic. |
| `src/projectStorage.js` | Browser localStorage persistence for projects (save, load, list, delete). |
| `src/templateStorage.js` | Browser localStorage persistence for user-defined templates. |
| `src/exportHelpers.js` | Shared helpers used by the export pipeline (fonts, clip paths, etc.). |

## UI panels

| File | Role |
|------|------|
| `src/Topbar.js` | Top bar shell — hosts the File / Add / View / Export menus. |
| `src/TopbarMenus.js` | Dropdown menu content components rendered inside the topbar. |
| `src/CanvasToolRail.js` | **Left vertical icon rail** — the primary canvas tool switcher on desktop. Must not be moved to the topbar. |
| `src/CanvasToolMenus.js` | Flyout/popover menus anchored to the canvas tool rail. |
| `src/LeftSidebar.js` / `src/LeftSidebarPanels.js` | Left panel shell + its content panes. |
| `src/RightSidebar.js` / `src/RightSidebar*.js` | Right panel shell + component properties, object properties, production panels, workflow, and status panes. |
| `src/MobileDock.js` | Mobile bottom dock — replaces the desktop sidebar layout on narrow screens. |
| `src/ExportDialog.js` | Export dialog overlay. |
| `src/TemplatesDialog.js` | Templates manager overlay. |
| `src/AppOverlays.js` | Toast notifications, error overlays, and other top-level overlays. |
| `src/canvasOverlays.js` | In-canvas overlays (selection toolbar, layer panel, minimap). |
| `src/LayerManager.js` | Layer visibility and ordering controls. |
| `src/WorkspaceShell.js` | Workspace layout shell — controls left/right panel open state and desktop vs mobile split. |
| `src/ViewContrast.js` | View mode switcher (front / rear / drill / combined). |

## Supporting files

| File | Role |
|------|------|
| `src/NativeDialogs.js` | Thin wrappers around `window.confirm` / `window.alert` for destructive-action guards. |
| `src/projectSchema.js` | JSON schema validation and migration for saved project files. |
| `src/PresetLayouts.js` | Built-in preset panel size/layout options. |
| `src/appCommands.js` | Keyboard shortcut definitions and command dispatch. |
| `src/componentHelpers.js` | Geometry helpers specific to component shapes (hole extents, label placement, etc.). |
| `src/device-classes.js` | Sets CSS classes on `<html>` for device/feature detection (touch, pointer, etc.). |
| `src/canvas-browser-guards.js` | Suppresses browser-default behaviors that interfere with canvas interaction (context menu, drag, scroll). |
| `src/toast.js` | Toast notification imperative API. |
| `src/runtime-errors.js` | Global error boundary — catches unhandled errors and renders a fallback UI. |
| `src/startup-error.js` | CDN/load failure handler (now only relevant if `vendor/` files are missing). |
| `src/still-loading.js` | Loading screen shown while scripts are initializing. |
| `src/main.js` | Final script — calls `ReactDOM.createRoot` and mounts `App`. |

## Storage and schema layer

### localStorage keys

| Key | Defined in | Purpose |
|-----|-----------|---------|
| `eurorack-panel-local-projects-v1` | `projectSchema.js` | **Legacy** project list (v1). Read-only migration path in `loadLocalProjects`. Do not write new data here. |
| `eurorack-panel-local-project-index-v2` | `projectStorage.js` | **Current** project index — list of `{id, name, updatedAt, sizeBytes}` objects. |
| `eurorack-panel-local-project-record-v2:<id>` | `projectStorage.js` | **Current** per-project record `{id, name, updatedAt, sizeBytes, data}`. |
| `eurorack-panel-templates-index-v1` | `projectSchema.js` | Template index — array of template IDs. |
| `eurorack-panel-template:<id>` | `projectSchema.js` | Per-template JSON blob. |
| `eurorack_panel_designer_hidden_template_ids_v1` | `templateStorage.js` | Set of factory/local template IDs hidden by the user. |

**Note:** `LOCAL_PROJECTS_KEY`, `LOCAL_TEMPLATE_INDEX_KEY`, and `LOCAL_TEMPLATE_PREFIX` are defined in `projectSchema.js` but are consumed by `projectStorage.js` and `templateStorage.js`. This is a historical coupling that should be untangled in a future pass (move each constant to the file that owns it).

### projectSchema.js — what it actually contains

Despite its name, `projectSchema.js` is currently a mixed file:

| Group | Functions | Nature |
|-------|-----------|--------|
| Validation/normalization | `validateAndNormalize`, `sanitizePart` | Pure — take raw JSON, return clean app state |
| Template I/O helpers | `stripIdsFromComponents` | Pure — tiny utility |
| Storage key constants | `PROJECT_FILE_VERSION`, `LOCAL_PROJECTS_KEY`, `LOCAL_TEMPLATE_INDEX_KEY`, `LOCAL_TEMPLATE_PREFIX` | Constants — should migrate to the files that use them |
| UI modal | `appTemplateSavePrompt` | **Browser DOM** — builds a dialog, attaches event listeners, returns a Promise |

`appTemplateSavePrompt` is the only browser-touching function in projectSchema.js and is called exclusively by `makeTemplateFromState` in `templateStorage.js`. It is a candidate for moving to `templateStorage.js` in a future pass.

### projectStorage.js — what it actually contains

| Group | Functions | Nature |
|-------|-----------|--------|
| File naming | `safeProjectFileName` | Pure string formatter |
| Serialization | `serializeProject` | Pure — JSON.stringify + version stamp |
| Browser download | `isIOSLike`, `saveTextFile`, `downloadTextFile`, `downloadBlobFile` | Browser API — must stay in storage/download layer |
| Project persistence | `safeStorageAvailable`, `loadLocalProjects`, `storeLocalProjects`, `saveProjectToBrowser`, `deleteLocalProject` | localStorage |
| User-facing actions | `exportJSON` | Thin orchestration — serializes + downloads |
| **KiCad export** | `exportKiCadPCB` + `kicadNum`, `kicadStr`, `kicadRefPrefix`, `kicadSafeName`, `kicadEdgeLine`, `kicadRectLines`, `kicadCircle`, `kicadGrText`, `kicadNPTHFootprint`, `rotatePointAround` | **Misplaced** — these are a self-contained KiCad DSL and exporter with no storage logic. Future target: `src/export/kiCadExport.js`. |

The KiCad helpers (`kicad*` functions and `rotatePointAround`) are pure and have no localStorage dependency. Only `exportKiCadPCB` touches `saveTextFile`, so extracting the group to `src/export/kiCadExport.js` is safe and mechanical.

### templateStorage.js — what it actually contains

| Group | Functions | Nature |
|-------|-----------|--------|
| Template normalization | `normalizeTemplate` | Pure — validates raw template JSON into canonical shape |
| Template construction | `makeTemplateFromState`, `replaceTemplateContentFromState`, `updateTemplateMetadata`, `templateRecordFromTemplate` | Mixed — data transforms that call `appTemplateSavePrompt` (browser) |
| localStorage CRUD | `loadLocalTemplates`, `saveTemplateToBrowser`, `deleteLocalTemplate` | localStorage |
| Hidden-IDs management | `hiddenTemplateIds`, `saveHiddenTemplateIds`, `hideTemplateEverywhere`, `unhideTemplate` | localStorage |
| Catalog assembly | `editableTemplateRecords` | Pure — merges factory + local templates, filters hidden |
| File I/O | `exportTemplatesLibrary`, `importTemplatesLibraryFile` | Browser API — download + FileReader |

`normalizeTemplate` is also called directly by `FactoryTemplates.js`, so it must remain a global.

### Proposed next split plan (not yet executed)

**Pass A — move KiCad export out of projectStorage.js**
- Create `src/export/kiCadExport.js`
- Move: `kicadNum`, `kicadStr`, `kicadRefPrefix`, `kicadSafeName`, `rotatePointAround`, `kicadEdgeLine`, `kicadRectLines`, `kicadCircle`, `kicadGrText`, `kicadNPTHFootprint`, `exportKiCadPCB`
- Add script tag in `index.html` after `src/export/zipUtils.js` and before `src/exportEngine.js`
- All globals remain available; `exportKiCadPCB` is called only from `App.js`
- Risk: low — purely mechanical extraction, no shared state

**Pass B — move `appTemplateSavePrompt` to templateStorage.js**
- Move `appTemplateSavePrompt` from `projectSchema.js` to `templateStorage.js`
- No script-tag change needed (`templateStorage.js` is already loaded after `projectSchema.js`)
- Risk: low — only one caller (`makeTemplateFromState` in `templateStorage.js`)

**Pass C — relocate legacy storage key constants**
- Move `LOCAL_PROJECTS_KEY` to `projectStorage.js` (already has `LOCAL_PROJECTS_INDEX_KEY`)
- Move `LOCAL_TEMPLATE_INDEX_KEY` and `LOCAL_TEMPLATE_PREFIX` to `templateStorage.js`
- `PROJECT_FILE_VERSION` stays in `projectSchema.js` (referenced by `serializeProject` in `projectStorage.js` which loads after)
- Risk: low — purely editorial, no logic change; verify via `node --check` after

Do not execute these passes until explicitly directed.

## core.js audit

`src/core.js` is 1988 lines, loaded by ~23 source files. It is a legacy catch-all pending incremental extraction. The groups below are in file order.

### Group map

| # | Lines | Group | Functions / constants | Pure? | External callers (outside core.js) |
|---|-------|-------|-----------------------|-------|-------------------------------------|
| 1 | 1–31 | **Bootstrap / build metadata** | React version guard, `APP_VERSION`, `window.__EURORACK_PANEL_DESIGNER_BUILD__`, html attribute stamp | Browser (runs at parse time) | None — self-executing |
| 2 | 32–39 | **Eurorack model constants** | `HP_TO_MM`, `PANEL_HEIGHT_MM`, `MOUNTING_HOLE_*`, `MAX_UNDO`, `STANDARD_HP` | Pure constants | 15+ files — nearly everything |
| 3 | 40–85 | **App-wide defaults** | `DEFAULT_EXPORT_OPTIONS`, `defaultSnapSettings` | Pure data | App.js, ExportDialog.js, kiCadExport.js, exportEngine.js, psdExport.js |
| 4 | 86–139 | **DFM profiles + layer visibility** | `DFM_PROFILES`, `defaultLayerVisibility` | Pure data | ExportDialog.js, projectSchema.js, App.js |
| 5 | 140–221 | **Component type taxonomy** | `inferCategoryForType`, `isSamePartType`, `REF_PREFIX_BY_TYPE`, `refPrefixForType`, `nextRefForComponent`, `renumberRefs` | Pure | appState.js, projectSchema.js, exportEngine.js, App.js, TopbarMenus.js |
| 6 | 222–317 | **Component display helpers** | `defaultAttachedLabelFor`, `verificationLabel`, `verificationColor`, `isPartVerified`, `shortPartName`, `defaultLabelForComponentDef`, `partTooltip` | Pure | LeftSidebarPanels.js, RightSidebarComponentProperties.js, kiCadExport.js, App.js |
| 7 | 318–833 | **React part library UI** | `PartIcon`, `PartPickerLabel`, `LibraryPartPreview` | React (browser) | Only `LibraryPartPreview` — called from LeftSidebarPanels.js:617. `PartIcon`/`PartPickerLabel` used only within core.js. |
| 8 | 835–876 | **Component sorting / catalog order** | `COMPONENT_TYPE_SORT_ORDER`, `componentSortKey`, `sortComponentDefs` | Pure | LeftSidebarPanels.js, AppOverlays.js |
| 9 | 878–910 | **UX part history (localStorage)** | `UX_RECENT_PARTS_KEY`, `UX_FAVORITE_PARTS_KEY`, `partStableKey`, `readStringListStorage`, `writeStringListStorage`, `rememberRecentPart`, `sendPartPlacementEvent` | Browser (localStorage + CustomEvent) | LeftSidebarPanels.js (heavily), App.js |
| 10 | 911–1012 | **Panel / mounting-hole geometry** | `panelWidthMM`, `snapToGrid`, `mountingHoleRailY`, `mountingHoleSide`, `normalizeMountingHoleRail`, `mountingHolesForPreset`, `defaultMountingHoles`, `defaultMountingHoleConfig`, `normalizeMountingHoleConfig` | Pure | appState.js, projectSchema.js, kiCadExport.js, Canvas.js, TemplatesDialog.js, templateDefaults.js, App.js, RightSidebarProductionPanels.js |
| 11 | 1013–1133 | **Front-shape / DIP-8 geometry** | `aabbOverlap`, `circleOverlap`, `getFrontShape`, `dip8SocketBodyBounds`, `getFrontBounds`, `isDip8Socket`, `dip8SocketPinOffsets`, `rotatePointLocal`, `dip8SocketPinHoles`, `dip8SocketHoleCenters`, `getFrontOBB`, `getFrontExtents`, `getFrontBottomOffset`, `frontClearance` | Pure | Canvas.js, canvasOverlays.js, exportHelpers.js, kiCadExport.js, componentHelpers.js, appState.js, App.js |
| 12 | 1134–1499 | **Warning / DFM engine** | `pcbHeightWarnings`, `mergeBroadAABB`, `inflateBroadAABB`, `componentWarningBroadAABB`, `buildWarningPairCandidateMap`, `computeWarnings` | Pure | App.js, RightSidebarProductionPanels.js, ExportDialog.js |
| 13 | 1500–1560 | **Measurement / scale factories** | `computeMaxDepth`, `distanceBetween`, `edgeClearance`, `getScaleReferenceRadius`, `makeCompactKnobScale`, `makeFaderScale` | Pure | App.js, canvasOverlays.js, Canvas.js |
| 14 | 1561–1681 | **OBB collision math** | `degToRad`, `obbVertices`, `obbAxes`, `projectOntoAxis`, `obbOverlap`, `obbEdgeExtents`, `makeBodyOBB`, `makeKeepoutOBB`, `makeRearBodyFootprintOBBAt`, `getRearBodyFootprintExtentsAt`, `makeHoleOBB` | Pure math | Canvas.js, canvasOverlays.js, exportHelpers.js, AppOverlays.js, App.js; also used by Group 12 internally |
| 15 | 1682–1789 | **App state factories** | `makeInitialState`, `snapshot`, `withHistory`, `layerVisibilityForViewMode` | Pure (makeInitialState uses crypto.randomUUID) | appState.js, App.js |
| 16 | 1790–1849 | **ErrorBoundary React component** | `ErrorBoundary` | React (browser) | main.js only |
| 17 | 1889–1987 | **Runtime self-test** | `runRuntimeSelfTest` | Pure (calls validateAndNormalize, serializeProject, COMPONENT_LIBRARY) | ExportDialog.js, App.js |

### Dependency notes

- Groups 12 (warning engine) and 14 (OBB math) are tightly coupled — the warning engine uses OBB math internally. They must be extracted together or left together.
- Groups 5 and 6 (taxonomy + display helpers) are referenced by Groups 7 and 8 inside core.js. Extracting 7 or 8 requires these to already be defined (they are, since all are in the same file today).
- Group 10 (panel geometry) is the most widely depended-on group outside core.js — 8+ files. Keep in place until last.

### Proposed extraction plan (not yet executed)

**Pass 1 — UX part history (Group 9)** ← safest first
- Target: `src/ux/partHistory.js`
- Move: `UX_RECENT_PARTS_KEY`, `UX_FAVORITE_PARTS_KEY`, `partStableKey`, `readStringListStorage`, `writeStringListStorage`, `rememberRecentPart`, `sendPartPlacementEvent`
- **Zero intra-core.js dependencies** — completely self-contained
- Add script tag before `core.js` (or after `componentHelpers.js` — either works)
- Risk: **low** — 33 lines, no logic change, no load-order issue

**Pass 2 — ErrorBoundary (Group 16)**
- Target: append to `src/runtime-errors.js` (already a browser-error handler; ErrorBoundary is the React-tree equivalent)
- Move: `ErrorBoundary` class
- Caller: main.js only; main.js loads last, after runtime-errors.js
- Risk: **low** — ~60 lines, self-contained React class, one caller

**Pass 3 — React part library UI (Group 7)**
- Target: `src/components/library/PartLibraryUI.js`
- Move: `PartIcon`, `PartPickerLabel`, `LibraryPartPreview`
- Depends on: componentHelpers.js globals (`isFaderLike` etc.) and core.js globals (`getFrontBounds`, `dip8SocketHoleCenters`) — must load after both
- Only `LibraryPartPreview` is called externally (LeftSidebarPanels.js)
- Risk: **medium** — ~515 lines, React components with many indirect deps

**Pass 4 — OBB math + warning engine (Groups 12 + 14, joint)**
- Target: `src/geometry/obbMath.js` (Group 14) + `src/warningEngine.js` (Group 12)
- Groups are coupled: warning engine uses OBB internally; extract both at once
- Callers span Canvas.js, App.js, ExportDialog.js, canvasOverlays.js, AppOverlays.js, exportHelpers.js
- Risk: **medium-high** — large extraction, many callers, needs careful load ordering

Later passes (Groups 2–6, 8, 10, 11, 13, 15, 17) depend on each other heavily and are best addressed after the above passes reduce core.js size and make the remaining boundaries clearer.

## Styles

`styles.css` is the single legacy global stylesheet. It covers layout, theming,
component shapes, and responsive breakpoints. Changes should be conservative —
no broad `!important` patches, and only touch it when a task explicitly requires
a CSS change.

## Tests and visual QA

`tests/visual-review.spec.js` is the visual regression safety net. It launches
Chromium via Playwright, captures 10 screenshots (desktop and mobile states), and
writes them to `design-review/after/`. Run it with `npm run screenshot` or
`npm run verify`. Screenshots must not change unless a task explicitly requires a
visual change.
