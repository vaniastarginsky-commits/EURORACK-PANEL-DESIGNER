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
| `src/core.js` | Legacy catch-all — 1378 lines after Groups 9, 16, 7 extracted. See **core.js audit** section below for the full map and proposed split plan. |
| `src/appState.js` | React context + reducer that owns all application state. Every component reads state via `useAppState()` and writes via `useAppDispatch()`. |
| `src/App.js` | Main orchestration layer. Wires together all major panels, handles pointer/keyboard events, and contains the top-level render tree. |
| `src/Canvas.js` | Owns panel rendering (SVG) and all canvas interactions — drag, resize, select, ruler, snap guides. |
| `src/components/library/componentDefinitions.js` | Raw component data — the canonical array of part definitions. Pure data, no React. |
| `src/componentLibrary.js` | Compatibility facade — assembles `COMPONENT_LIBRARY` (the global array) from `componentDefinitions.js` and any custom parts. |
| `src/components/library/PartLibraryUI.js` | React UI layer for the component picker — `PartIcon`, `PartPickerLabel`, `LibraryPartPreview`. Depends on `core.js` geometry helpers and `sanitizePart` from `projectSchema.js`; loads after both. |
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

### Re-audit after Passes 1–3 (Groups 9, 16, 7 extracted)

Current state: **1378 lines**, 14 remaining groups (renumbered A–N below).

| ID | Lines (approx) | Group | Key names | Pure? | External callers | Intra-core deps |
|----|----------------|-------|-----------|-------|-----------------|-----------------|
| A | 1–31 | Bootstrap / build metadata | `APP_VERSION`, `__EURORACK_PANEL_DESIGNER_BUILD__` | Browser, parse-time | None | None |
| B | 32–39 | Eurorack constants | `HP_TO_MM`, `PANEL_HEIGHT_MM`, `MOUNTING_HOLE_*`, `MAX_UNDO`, `STANDARD_HP` | Pure | 15+ files | None |
| C | 40–85 | App defaults | `DEFAULT_EXPORT_OPTIONS`, `defaultSnapSettings` | Pure | App.js, ExportDialog.js, kiCadExport.js, exportEngine.js, psdExport.js | None |
| D | 86–139 | DFM + layer visibility | `DFM_PROFILES`, `defaultLayerVisibility` | Pure | ExportDialog.js, projectSchema.js, App.js | Group M (makeInitialState) calls defaultLayerVisibility |
| E | 140–221 | Component taxonomy | `inferCategoryForType`, `isSamePartType`, `REF_PREFIX_BY_TYPE`, `refPrefixForType`, `nextRefForComponent`, `renumberRefs` | Pure | 13+ files | None |
| F | 222–317 | Component display helpers | `defaultAttachedLabelFor`, `verificationLabel`, `verificationColor`, `isPartVerified`, `shortPartName`, `defaultLabelForComponentDef`, `partTooltip` | Pure | 11+ files | `defaultAttachedLabelFor` → `getFrontBottomOffset` (Group I) |
| G | 318–360 | Component sorting | `COMPONENT_TYPE_SORT_ORDER`, `componentSortKey`, `sortComponentDefs` | Pure | LeftSidebarPanels.js, MobileDock.js | `componentSortKey` → `inferCategoryForType` (E), `shortPartName` (F) |
| H | 361–462 | Panel / mounting-hole geometry | `panelWidthMM`, `snapToGrid`, `mountingHoleRailY`, `mountingHoleSide`, `normalizeMountingHoleRail`, `mountingHolesForPreset`, `defaultMountingHoles`, `defaultMountingHoleConfig`, `normalizeMountingHoleConfig` | Pure | 18+ files (most widely used) | Uses B constants; called by Group M |
| I | 463–583 | Front-shape / DIP-8 geometry | `aabbOverlap`, `circleOverlap`, `getFrontShape`, `dip8Socket*`, `rotatePointLocal`, `getFrontOBB`, `getFrontExtents`, `getFrontBottomOffset`, `frontClearance` | Pure | 12+ files | `getFrontExtents` → `obbEdgeExtents` (L) |
| J | 584–949 | Warning / DFM engine | `pcbHeightWarnings`, `mergeBroadAABB`, `inflateBroadAABB`, `componentWarningBroadAABB`, `buildWarningPairCandidateMap`, `computeWarnings` | Pure | App.js, RightSidebarProductionPanels.js, ExportDialog.js | Groups I and L heavily |
| K | 950–1010 | Measurement / scale factories | `computeMaxDepth`, `distanceBetween`, `edgeClearance`, `getScaleReferenceRadius`, `makeCompactKnobScale`, `makeFaderScale` | Pure | 7 files | `edgeClearance` → `frontClearance` (I); `makeFaderScale` → `getFrontBounds` (I) |
| L | 1011–1131 | OBB collision math | `degToRad`, `obbVertices`, `obbAxes`, `projectOntoAxis`, `obbOverlap`, `obbEdgeExtents`, `makeBodyOBB`, `makeKeepoutOBB`, `makeRearBodyFootprintOBBAt`, `getRearBodyFootprintExtentsAt`, `makeHoleOBB` | Pure math | Canvas.js, canvasOverlays.js, exportHelpers.js, AppOverlays.js, App.js | **Zero** — completely self-contained within group |
| M | 1132–1278 | App state factories | `makeInitialState`, `snapshot`, `withHistory`, `layerVisibilityForViewMode` | Pure | appState.js, MobileDock.js, TemplatesDialog.js, App.js | Groups C, D, H |
| N | 1279–1378 | Runtime self-test | `runRuntimeSelfTest` | Pure | ExportDialog.js, App.js | `panelWidthMM` (H); cross-file: `COMPONENT_LIBRARY`, `validateAndNormalize`, `serializeProject` |

### Coupling constraints

- **L → I**: `getFrontExtents` (Group I) calls `obbEdgeExtents` (Group L). Extracting L first leaves I intact — `obbEdgeExtents` stays globally visible.
- **J → I + L**: `computeWarnings` calls both OBB and front-shape functions. Groups I, J, L form a cluster; J cannot move without I and L already being global.
- **G → E + F**: `componentSortKey` calls `inferCategoryForType` and `shortPartName`. If G moves after core.js, both are already global.
- **K → I**: `edgeClearance` and `makeFaderScale` call functions from Group I. If K moves after core.js, Group I globals are available.
- **M → C + D + H**: `makeInitialState` calls `defaultSnapSettings`, `defaultLayerVisibility`, `defaultMountingHoleConfig`. These must remain global before M's functions are called.

### Proposed extraction order (remaining passes)

**Next — OBB math (Group L)** ← safest remaining
- Target: `src/geometry/obbMath.js`
- Move: `degToRad`, `obbVertices`, `obbAxes`, `projectOntoAxis`, `obbOverlap`, `obbEdgeExtents`, `makeBodyOBB`, `makeKeepoutOBB`, `makeRearBodyFootprintOBBAt`, `getRearBodyFootprintExtentsAt`, `makeHoleOBB`
- **Zero intra-core.js dependencies** — purely self-contained math
- Load before `core.js` so Groups I and J can still call these as globals
- Risk: **low** — 121 lines, pure functions, no logic change

**Then — Component sorting (Group G)**
- Target: `src/components/library/componentSorting.js` or keep near PartLibraryUI
- Depends on `inferCategoryForType` and `shortPartName` (both stay in core.js, visible as globals)
- Load after `core.js`; callers are LeftSidebarPanels.js and MobileDock.js
- Risk: **low** — 43 lines, 2 callers

**Then — Runtime self-test (Group N)**
- Target: `src/diagnostics/runtimeSelfTest.js`
- Load after `projectStorage.js` (needs `serializeProject`)
- Risk: **low-medium** — 100 lines, cross-file deps all already global at runtime

**Later — Measurement/scale factories (Group K), warning engine (Group J)**
- K is extractable independently (43 lines in Group I remain in core.js as globals)
- J is the largest remaining group; extract last or with I

**Keep in core.js until last — Groups B, E, F, H, M**
These are the most widely used (10–18 external callers each) and are depended on by other remaining groups. Extracting them last avoids cascading load-order work.

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
