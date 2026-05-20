# Design: Incremental core.js refactor

## Context

`core.js` (744 lines) is a monolith containing component helpers, React overlay components, project schema validation, and the entire export engine — all mixed together. `App.js` is similarly oversized (~37K tokens). The goal is to split these incrementally with no changes to behaviour, no build tooling changes, and a verifiable state after each wave.

Architecture stays as global scripts loaded via `<script>` tags. No ES modules, no bundler.

## Approach

Four independent waves, each its own commit. Each wave moves a self-contained slice out of `core.js` into a new file. After each wave: run `npm run dev`, open in browser, run `npm run screenshot`, compare to baseline.

## Wave 1 — `src/exportEngine.js`

**What moves:** Everything from `core.js` line 157 to end (~588 lines):
- SVG export: `exportSVG`, `exportSVGString`, `exportLayeredSVGString`, `exportLayeredSVG`, `exportLayeredSVGPackage`, `layeredSVGSeparateFiles`
- PNG export: `exportPNGSVGString`, `buildPNGExportPlan`
- PSD export: `makeLayeredPSD` + all `psdPush*` helpers
- ZIP utilities: `ZIP_CRC_TABLE`, `crc32`, `dosDateTime`, `writeU16`, `writeU32`, `createZipBlob`
- Package helpers: `exportPackageFiles`, `downloadExportPackage`, `downloadExportPackageZip`, `downloadExportPackageLooseFiles`, `drillTableCSVString`, `disabledExportLayers`
- KiCad import: `parseAt`, `parseKiCadProperty`, `parseFpText`, `parseFpReference`, `parseFpValue`, `parseFpDescription`, `parseKiCadGraphicPrimitives` and all downstream KiCad parsing functions

**Dependencies:** `panelWidthMM`, `PANEL_HEIGHT_MM`, `COMPONENT_LIBRARY`, helper functions (`getFrontBounds`, `isFaderLike`, etc.) — all still in `core.js` at this point, already global.

**index.html change:** `exportEngine.js` loads before `core.js`. No other changes.

**Verification:** Open Export dialog, trigger SVG export, PNG export, package ZIP download. All must produce valid files.

## Wave 2 — `src/canvasOverlays.js`

**What moves:** React overlay components from `core.js` lines ~16–50:
- `ScaleLayer`
- `TemplateGhostLayer` + `previewTemplateComponents`
- `ComponentHoverTooltip` + `warningToneForIds`
- `SnapFeedbackBadge`
- `DFMStatusFloat`

**Dependencies:** React (global), `isFaderLike`, `getFrontBounds`, `getFrontBottomOffset`, `getFrontTopOffset`, `getScaleReferenceRadius`, `useAppState`, `useAppDispatch`, `isPartVerified`, `verificationLabel` — all still in `core.js`.

**index.html change:** `canvasOverlays.js` loads after `core.js` (needs context hooks).

**Verification:** Canvas renders overlays correctly. DFM badge shows. Hover tooltip appears on component hover. Scale rings visible.

## Wave 3 — `src/projectSchema.js`

**What moves:** Project validation from `core.js` lines ~50–156:
- `validateAndNormalize`
- `normalizeMountingHoleConfig`
- `sanitizePart`
- `PROJECT_FILE_VERSION`, `LOCAL_PROJECTS_KEY`, `LOCAL_TEMPLATE_INDEX_KEY`, `LOCAL_TEMPLATE_PREFIX`
- `stripIdsFromComponents`
- `appTemplateSavePrompt`

**Dependencies:** `COMPONENT_LIBRARY`, `isPotLike`, `isFaderLike`, `inferCategoryForType`, `refPrefixForType`, `panelWidthMM`, `PANEL_HEIGHT_MM`, `defaultLayerVisibility` — all still in `core.js`.

**index.html change:** `projectSchema.js` loads before `core.js`.

**Verification:** Open/save project file. Load a `.json` project. Template save dialog opens.

## Wave 4 — `src/componentHelpers.js`

**What moves:** Pure component helper functions from top of `core.js`:
- Type predicates: `isPotLike`, `isJackLike`, `isButtonLike`, `isLedLike`, `isFaderLike`, `isMiniSlideSwitch`, `isTrimPot`, `isScaleEligibleComponent`, `hasNutWasherHardware`
- Visual helpers: `defaultTopColor`, `topColor`, `topHardwareVisible`, `visualKnobDiameter`, `visualButtonRadius`, `ergonomicDiameter`
- Geometry: `getFrontBounds`, `getFrontBottomOffset`, `getFrontTopOffset`, `getScaleReferenceRadius`, `getComponentLabelLayout`
- Constants: `TOP_COLOR_PRESETS`, `TEXT_FONT_OPTIONS`

**Dependencies:** `COMPONENT_LIBRARY` constants, `PANEL_HEIGHT_MM` — these stay in `core.js` since they're the root of the dependency tree.

**index.html change:** `componentHelpers.js` loads before everything else that uses component data.

**Verification:** Full app renders. Sidebar shows component properties. Canvas renders component shapes correctly.

## Final script load order in index.html

```html
<script src="src/componentHelpers.js"></script>   <!-- no deps -->
<script src="src/projectSchema.js"></script>       <!-- needs componentHelpers -->
<script src="src/exportEngine.js"></script>        <!-- needs componentHelpers -->
<script src="src/core.js"></script>                <!-- context, reducer, COMPONENT_LIBRARY -->
<script src="src/canvasOverlays.js"></script>      <!-- needs core.js context hooks + componentHelpers -->
```

All other existing script tags stay in their current positions relative to each other.

## After all waves

`core.js` contains only:
- `COMPONENT_LIBRARY` array
- Core constants (`PANEL_HEIGHT_MM`, `panelWidthMM`, etc.)
- React context + `useAppState` / `useAppDispatch`
- The app reducer
- Boot/autosave logic

## Out of scope (next phase)

- `App.js` split (separate design)
- `Topbar.js` split
- ES modules migration
