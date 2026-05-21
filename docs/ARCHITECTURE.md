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
| `src/core.js` | Legacy catch-all — ~1054 lines after 7 extraction passes. See **core.js audit** section below for the current group map and remaining plan. |
| `src/appState.js` | React context + reducer that owns all application state. Every component reads state via `useAppState()` and writes via `useAppDispatch()`. |
| `src/App.js` | Main orchestration layer. Wires together all major panels, handles pointer/keyboard events, and contains the top-level render tree. |
| `src/Canvas.js` | Owns panel rendering (SVG) and all canvas interactions — drag, resize, select, ruler, snap guides. |
| `src/components/library/componentDefinitions.js` | Raw component data — the canonical array of part definitions. Pure data, no React. |
| `src/components/library/componentSorting.js` | Sort-order constants and helpers — `COMPONENT_TYPE_SORT_ORDER`, `componentSortKey`, `sortComponentDefs`. Pure; calls `inferCategoryForType` and `shortPartName` from `core.js`. Extracted from core.js Group G. |
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
| `src/geometry/obbMath.js` | Pure OBB/SAT collision math (121 lines) — `degToRad`, `obbVertices`, `obbAxes`, `projectOntoAxis`, `obbOverlap`, `obbEdgeExtents`, plus component OBB adapter helpers `makeBodyOBB`, `makeKeepoutOBB`, `makeRearBodyFootprintOBBAt`, `getRearBodyFootprintExtentsAt`, `makeHoleOBB`. Extracted from core.js Group L. Called by Canvas.js, canvasOverlays.js, exportHelpers.js, AppOverlays.js, App.js, and core.js Groups I and J. |
| `src/geometry/measurementHelpers.js` | Pure measurement and scale factories (61 lines) — `computeMaxDepth`, `distanceBetween`, `edgeClearance`, `getScaleReferenceRadius`, `makeCompactKnobScale`, `makeFaderScale`. Extracted from core.js Group K. Calls `frontClearance` and `getFrontBounds` from core.js as globals. |
| `src/diagnostics/runtimeSelfTest.js` | Post-load self-test (96 lines) — `runRuntimeSelfTest`. Validates panel state, warnings, serialization round-trip, and component library integrity. Pure at call-time; depends on `panelWidthMM`, `COMPONENT_LIBRARY`, `validateAndNormalize`, `serializeProject` as globals. Extracted from core.js Group N. |
| `src/ux/partHistory.js` | localStorage-backed UX state (33 lines) — `UX_RECENT_PARTS_KEY`, `UX_FAVORITE_PARTS_KEY`, `partStableKey`, `readStringListStorage`, `writeStringListStorage`, `rememberRecentPart`, `sendPartPlacementEvent`. Browser (localStorage + CustomEvent). Extracted from core.js Group 9. |
| `src/runtime/ErrorBoundary.js` | React error boundary (60 lines) — `ErrorBoundary` class component. Catches render errors and shows a fallback UI. Mounted exclusively from `main.js`. Extracted from core.js Group 16. |
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

`appTemplateSavePrompt` has been extracted to `src/templates/templateSavePrompt.js` and is called by `makeTemplateFromState` in `templateStorage.js`.

### projectStorage.js — what it actually contains

| Group | Functions | Nature |
|-------|-----------|--------|
| File naming | `safeProjectFileName` | Pure string formatter |
| Serialization | `serializeProject` | Pure — JSON.stringify + version stamp |
| Browser download | `isIOSLike`, `saveTextFile`, `downloadTextFile`, `downloadBlobFile` | Browser API — must stay in storage/download layer |
| Project persistence | `safeStorageAvailable`, `loadLocalProjects`, `storeLocalProjects`, `saveProjectToBrowser`, `deleteLocalProject` | localStorage |
| User-facing actions | `exportJSON` | Thin orchestration — serializes + downloads |
| **KiCad export** | `exportKiCadPCB` + `kicadNum`, `kicadStr`, `kicadRefPrefix`, `kicadSafeName`, `kicadEdgeLine`, `kicadRectLines`, `kicadCircle`, `kicadGrText`, `kicadNPTHFootprint`, `rotatePointAround` | **Misplaced** — these are a self-contained KiCad DSL and exporter with no storage logic. Future target: `src/export/kiCadExport.js`. |

The KiCad helpers (`kicad*` functions and `rotatePointAround`) have been extracted to `src/export/kiCadExport.js`. Only `exportKiCadPCB` touches `saveTextFile`; all helpers are pure.

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

### Storage split plan

**Pass A — ✅ done** — KiCad export extracted to `src/export/kiCadExport.js`.

**Pass B — ✅ done** — `appTemplateSavePrompt` extracted to `src/templates/templateSavePrompt.js` (rather than merged into `templateStorage.js` as originally planned; the dedicated file is cleaner).

**Pass C — relocate legacy storage key constants** *(not yet executed)*
- Move `LOCAL_PROJECTS_KEY` to `projectStorage.js` (already has `LOCAL_PROJECTS_INDEX_KEY`)
- Move `LOCAL_TEMPLATE_INDEX_KEY` and `LOCAL_TEMPLATE_PREFIX` to `templateStorage.js`
- `PROJECT_FILE_VERSION` stays in `projectSchema.js` (referenced by `serializeProject` in `projectStorage.js` which loads after)
- Risk: low — purely editorial, no logic change; verify via `node --check` after

Do not execute Pass C until explicitly directed.

## core.js audit

`src/core.js` started at 1988 lines; it is currently ~1054 lines after 7 extraction passes. It is a legacy catch-all with incremental extraction in progress. The original group map below is preserved for reference; see **Re-audit (current state)** for the up-to-date picture.

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

### Re-audit — current state (7 extraction passes complete)

Current state: **~1054 lines**. Groups G, K, L, N, 7, 9, and 16 extracted; 9 functional groups remain in core.js plus tombstone comments.

| ID | Lines | Group | Key names | Pure? | External callers | Intra-core deps |
|----|-------|-------|-----------|-------|-----------------|-----------------|
| A | 1–31 | Bootstrap / build metadata | `APP_VERSION`, `__EURORACK_PANEL_DESIGNER_BUILD__` | Browser, parse-time | None | None |
| B | 32–39 | Eurorack constants | `HP_TO_MM`, `PANEL_HEIGHT_MM`, `MOUNTING_HOLE_*`, `MAX_UNDO`, `STANDARD_HP` | Pure | 15+ files | None |
| C | 40–85 | App defaults | `DEFAULT_EXPORT_OPTIONS`, `defaultSnapSettings` | Pure | App.js, ExportDialog.js, kiCadExport.js, exportEngine.js, psdExport.js | None |
| D | 86–139 | DFM + layer visibility | `DFM_PROFILES`, `defaultLayerVisibility` | Pure | ExportDialog.js, projectSchema.js, App.js | M calls `defaultLayerVisibility` |
| E | 140–221 | Component taxonomy | `inferCategoryForType`, `isSamePartType`, `REF_PREFIX_BY_TYPE`, `refPrefixForType`, `nextRefForComponent`, `renumberRefs` | Pure | 13+ files | None |
| F | 222–317 | Component display helpers | `defaultAttachedLabelFor`, `verificationLabel`, `verificationColor`, `isPartVerified`, `shortPartName`, `defaultLabelForComponentDef`, `partTooltip` | Pure | 11+ files | `defaultAttachedLabelFor` → `getFrontBottomOffset` (I) |
| H | 318–419 | Panel / mounting-hole geometry | `panelWidthMM`, `snapToGrid`, `mountingHoleRailY`, `mountingHoleSide`, `normalizeMountingHoleRail`, `mountingHolesForPreset`, `defaultMountingHoles`, `defaultMountingHoleConfig`, `normalizeMountingHoleConfig` | Pure | 18+ files | Uses B constants; M calls `panelWidthMM` and `defaultMountingHoleConfig` |
| I | 420–540 | Front-shape / DIP-8 geometry | `aabbOverlap`, `circleOverlap`, `getFrontShape`, `dip8Socket*`, `rotatePointLocal`, `getFrontOBB`, `getFrontExtents`, `getFrontBottomOffset`, `frontClearance` | Pure | 12+ files | **Zero remaining intra-core deps** — `degToRad` and `obbEdgeExtents` now globals from `obbMath.js`; F calls `getFrontBottomOffset`; J calls front-shape fns |
| J | 541–906 | Warning / DFM engine | `pcbHeightWarnings`, `mergeBroadAABB`, `inflateBroadAABB`, `componentWarningBroadAABB`, `buildWarningPairCandidateMap`, `computeWarnings` | Pure | App.js, RightSidebarProductionPanels.js, ExportDialog.js | I (front-shape fns); `obbMath.js` globals (`makeHoleOBB`, `makeBodyOBB`, `makeKeepoutOBB`, `obbOverlap`, `obbEdgeExtents`); `ergonomicDiameter` from `componentHelpers.js` |
| M | 907–1014 | App state factories | `makeInitialState`, `snapshot`, `withHistory`, `layerVisibilityForViewMode` | Pure | appState.js, MobileDock.js, TemplatesDialog.js, App.js | C (`defaultSnapSettings`), D (`defaultLayerVisibility`), H (`panelWidthMM`, `defaultMountingHoleConfig`), B (`MAX_UNDO`) |
| — | 1015–1054 | Tombstone comments | *(moved-code markers from prior extractions)* | — | — | — |

**Extracted groups (reference)**

| Group | Extracted to | Lines |
|-------|-------------|-------|
| G — Component sorting | `src/components/library/componentSorting.js` | 43 |
| K — Measurement / scale factories | `src/geometry/measurementHelpers.js` | 61 |
| L — OBB collision math | `src/geometry/obbMath.js` | 121 |
| N — Runtime self-test | `src/diagnostics/runtimeSelfTest.js` | 96 |
| 7 — React part library UI | `src/components/library/PartLibraryUI.js` | 517 |
| 9 — UX part history | `src/ux/partHistory.js` | 33 |
| 16 — ErrorBoundary | `src/runtime/ErrorBoundary.js` | 60 |

### Coupling constraints (current)

- **I is self-contained**: `rotatePointLocal`, `getFrontExtents`, and `getFrontBottomOffset` call `degToRad` / `obbEdgeExtents`, which are now globals from `obbMath.js`. Group I has zero remaining intra-core.js dependencies.
- **F → I**: `defaultAttachedLabelFor` calls `getFrontBottomOffset` (I). Once I is extracted and loads before `core.js`, F's call resolves via the global. F becomes zero-dep after I is extracted.
- **J → I**: `computeWarnings` and `componentWarningBroadAABB` call `getFrontExtents`, `getFrontShape`, `frontClearance`, `getFrontOBB`. J cannot move until I is globally available.
- **M → C + D + H**: `makeInitialState` calls `defaultSnapSettings`, `defaultLayerVisibility`, `defaultMountingHoleConfig`. All three must remain globally visible before M is called.

### Proposed extraction order (remaining passes)

**Next — Front-shape / DIP-8 geometry (Group I)** ← safest remaining
- Target: `src/geometry/frontShapeGeometry.js`
- Move: `aabbOverlap`, `circleOverlap`, `getFrontShape`, `dip8SocketBodyBounds`, `getFrontBounds`, `isDip8Socket`, `dip8SocketPinOffsets`, `rotatePointLocal`, `dip8SocketPinHoles`, `dip8SocketHoleCenters`, `getFrontOBB`, `getFrontExtents`, `getFrontBottomOffset`, `frontClearance`
- Load order: after `obbMath.js`, before `core.js` — F and J continue calling these as globals
- **Zero intra-core.js dependencies** — all callees (`degToRad`, `obbEdgeExtents`) already extracted
- Risk: **low** — 121 lines, pure functions, no logic change

**Then — Component display helpers (Group F)**
- Becomes zero-dep once I is extracted (`defaultAttachedLabelFor` → `getFrontBottomOffset` resolves via global)
- Target: `src/components/componentDisplayHelpers.js`
- Risk: **low** — 96 lines, but 11+ external callers require careful load-order verification

**Defer — Warning / DFM engine (Group J)**
- Largest remaining block (366 lines); most entangled cross-file caller set
- Extractable only after I is globally available; do not extract until explicitly directed

**Keep in core.js long-term — Groups A, B, C, D, E, H, M**
These groups are the most widely used (10–18 external callers each) or self-executing at parse time. Extracting them individually adds load-order complexity with diminishing benefit. If ever extracted, do so as a coordinated batch in a dedicated pass.

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
