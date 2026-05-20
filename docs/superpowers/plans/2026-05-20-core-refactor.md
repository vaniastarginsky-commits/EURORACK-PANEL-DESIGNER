# core.js Incremental Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split `src/core.js` into four focused files — `exportEngine.js`, `canvasOverlays.js`, `projectSchema.js`, `componentHelpers.js` — by moving code without changing behaviour.

**Architecture:** Global script tags, no ES modules, no build step. Each new file declares functions in the global scope exactly as core.js does now. Files are added to index.html in dependency order. One wave per commit, verified via browser + screenshots after each.

**Tech Stack:** Vanilla JS, React 18 UMD (CDN), Python http.server, Playwright screenshots.

---

## File map

| File | Action | Responsibility after refactor |
|---|---|---|
| `src/exportEngine.js` | Create | SVG/PNG/PSD/ZIP/KiCad export — lines 157–744 of current core.js |
| `src/canvasOverlays.js` | Create | ScaleLayer, TemplateGhostLayer, ComponentHoverTooltip, SnapFeedbackBadge, DFMStatusFloat |
| `src/projectSchema.js` | Create | validateAndNormalize, normalizeMountingHoleConfig, sanitizePart, project file constants |
| `src/componentHelpers.js` | Create | Type predicates, visual helpers, geometry helpers, TOP_COLOR_PRESETS, TEXT_FONT_OPTIONS |
| `src/core.js` | Modify | COMPONENT_LIBRARY, constants, React context, reducer, boot/autosave only |
| `index.html` | Modify | Add new script tags in correct load order |

---

## Task 1 — Wave 1: Extract `src/exportEngine.js`

**Files:**
- Create: `src/exportEngine.js`
- Modify: `src/core.js` (delete lines 157–end)
- Modify: `index.html`

### Background
`core.js` lines 157–744 contain all export and KiCad import functions. These are unminified, self-contained (they take `state` as a parameter), and have no dependencies on React hooks. They depend only on globals already declared earlier in core.js: `panelWidthMM`, `PANEL_HEIGHT_MM`, `HP_TO_MM`, `COMPONENT_LIBRARY`, `PANEL_HEIGHT_MM`, and helper functions like `getFrontBounds`, `isFaderLike`, `safeProjectFileName`, `downloadTextFile`, `downloadBlobFile`, `sanitizePart`, `exportSVGString`, `serializeProject`, `manufacturingReportText`, `drillTableRows`, `nextRefForComponent`, `defaultLayerVisibility`, `DEFAULT_EXPORT_OPTIONS`. All of these remain in core.js after this extraction.

- [ ] **Step 1: Confirm line range**

```bash
grep -n "^function exportLayeredSVG\b" src/core.js
tail -5 src/core.js
```

Expected: first line prints `157:function exportLayeredSVG(state, opts) {`. Tail shows the last KiCad function and migration comments.

- [ ] **Step 2: Create exportEngine.js with the extracted lines**

```bash
awk 'NR>=157' src/core.js > src/exportEngine.js
```

Open `src/exportEngine.js` in an editor and verify: it starts with `function exportLayeredSVG` and ends with the last KiCad function + migration comments.

- [ ] **Step 3: Remove those lines from core.js**

```bash
awk 'NR<157' src/core.js > /tmp/core_trimmed.js && mv /tmp/core_trimmed.js src/core.js
```

Verify: `wc -l src/core.js` prints ~156. `wc -l src/exportEngine.js` prints ~588.

- [ ] **Step 4: Add script tag to index.html**

In `index.html`, find the existing `<script src="src/core.js...">` line. Add `exportEngine.js` **after** it (export engine depends on globals from core.js):

Old:
```html
  <script src="src/core.js?v=mobile-selected-fix"></script>
```

New:
```html
  <script src="src/core.js?v=mobile-selected-fix"></script>
  <script src="src/exportEngine.js"></script>
```

- [ ] **Step 5: Start dev server**

```bash
npm run dev
```

Open `http://localhost:4173` in the browser. App must load without console errors.

- [ ] **Step 6: Manual export verification**

In the app:
1. Add at least one component to the canvas
2. Open Export dialog
3. Trigger SVG export → file should download
4. Trigger Package ZIP download → file should download and be a valid zip

Open browser DevTools console — no errors.

- [ ] **Step 7: Run screenshot suite**

```bash
npm run screenshot
```

Expected: all captures complete without errors. Compare `design-review/after/` against `design-review/current/` — no regressions.

- [ ] **Step 8: Commit**

```bash
git add src/exportEngine.js src/core.js index.html
git commit -m "refactor: extract exportEngine.js from core.js (wave 1)"
```

---

## Task 2 — Wave 2: Extract `src/canvasOverlays.js`

**Files:**
- Create: `src/canvasOverlays.js`
- Modify: `src/core.js` (remove overlay component code)
- Modify: `index.html`

### Background
After wave 1, core.js is ~156 lines of minified code. The following React components are embedded in it on long minified lines: `ScaleLayer` (line 16), `TemplateGhostLayer` + `previewTemplateComponents` + `getComponentLabelLayout` (line 16, same long line), `warningToneForIds` + `ComponentHoverTooltip` (line 24), `SnapFeedbackBadge` (line 26), `DFMStatusFloat` (line 32). `DFMStatusFloat` uses `useAppState` and `useAppDispatch` — context hooks defined in core.js — so `canvasOverlays.js` must load **after** core.js.

- [ ] **Step 1: Find the exact character ranges for each component**

```bash
grep -n "ScaleLayer\|TemplateGhostLayer\|ComponentHoverTooltip\|SnapFeedbackBadge\|DFMStatusFloat" src/core.js
```

Note which lines contain these components. They will be on a small number of very long minified lines.

- [ ] **Step 2: Extract the component lines into canvasOverlays.js**

Use Read to view core.js lines 16–40 and identify the exact minified function boundaries. The components to move are everything from `const ScaleLayer=` through the closing of `DFMStatusFloat`. Cut those lines out of core.js and paste into the new file.

Create `src/canvasOverlays.js` with header comment:

```js
// Canvas overlay React components: ScaleLayer, TemplateGhostLayer,
// ComponentHoverTooltip, SnapFeedbackBadge, DFMStatusFloat.
// Depends on: React globals (useState, useMemo), useAppState, useAppDispatch,
// isFaderLike, getFrontBounds, getFrontTopOffset, getFrontBottomOffset,
// getScaleReferenceRadius, isPartVerified, verificationLabel — all from core.js.
```

Then paste the extracted minified component code after the header.

- [ ] **Step 3: Remove those lines from core.js**

Delete the extracted lines from core.js. Verify core.js no longer contains `ScaleLayer` or `DFMStatusFloat`:

```bash
grep -c "ScaleLayer\|DFMStatusFloat" src/core.js
```

Expected: `0`

```bash
grep -c "ScaleLayer\|DFMStatusFloat" src/canvasOverlays.js
```

Expected: `2` or more.

- [ ] **Step 4: Add script tag to index.html**

`canvasOverlays.js` must load **after** core.js (needs its context hooks). Find the `src/core.js` and `src/exportEngine.js` lines and add canvasOverlays between them and the next scripts:

```html
  <script src="src/core.js?v=mobile-selected-fix"></script>
  <script src="src/exportEngine.js"></script>
  <script src="src/canvasOverlays.js"></script>
```

- [ ] **Step 5: Verify in browser**

```bash
npm run dev
```

Open `http://localhost:4173`. Check:
- App loads, no console errors
- Place a component on the canvas — ScaleLayer ring is visible in front view
- Hover over a component — ComponentHoverTooltip card appears
- DFM badge is visible in bottom-left of canvas

- [ ] **Step 6: Run screenshots**

```bash
npm run screenshot
```

No regressions vs baseline.

- [ ] **Step 7: Commit**

```bash
git add src/canvasOverlays.js src/core.js index.html
git commit -m "refactor: extract canvasOverlays.js from core.js (wave 2)"
```

---

## Task 3 — Wave 3: Extract `src/projectSchema.js`

**Files:**
- Create: `src/projectSchema.js`
- Modify: `src/core.js`
- Modify: `index.html`

### Background
After wave 2, core.js is still ~100–130 lines of minified code. The project schema / validation layer lives here: `validateAndNormalize` (line 50, very long function), `normalizeMountingHoleConfig`, `sanitizePart`, `stripIdsFromComponents`, `appTemplateSavePrompt`, and the storage key constants (`PROJECT_FILE_VERSION`, `LOCAL_PROJECTS_KEY`, `LOCAL_TEMPLATE_INDEX_KEY`, `LOCAL_TEMPLATE_PREFIX`). These depend on `COMPONENT_LIBRARY`, `isPotLike`, `isFaderLike`, `inferCategoryForType`, `refPrefixForType`, `panelWidthMM`, `PANEL_HEIGHT_MM`, `defaultLayerVisibility` — all still in core.js. So `projectSchema.js` loads **before** core.js.

Wait — projectSchema.js needs COMPONENT_LIBRARY which is in core.js. So it must load **after** core.js. Correct load order:
```
core.js → projectSchema.js → exportEngine.js → canvasOverlays.js
```

- [ ] **Step 1: Find schema function lines**

```bash
grep -n "validateAndNormalize\|normalizeMountingHoleConfig\|sanitizePart\|PROJECT_FILE_VERSION\|appTemplateSavePrompt\|stripIdsFromComponents" src/core.js
```

Note the line numbers.

- [ ] **Step 2: Create projectSchema.js**

Create `src/projectSchema.js` with:

```js
// Project file schema: validation, normalization, storage keys.
// Depends on: COMPONENT_LIBRARY, isPotLike, isFaderLike, inferCategoryForType,
// refPrefixForType, panelWidthMM, PANEL_HEIGHT_MM, defaultLayerVisibility,
// sanitizePart, normalizeMountingHoleConfig — all from core.js.
```

Then paste the extracted functions: `PROJECT_FILE_VERSION`, `LOCAL_PROJECTS_KEY`, `LOCAL_TEMPLATE_INDEX_KEY`, `LOCAL_TEMPLATE_PREFIX`, `stripIdsFromComponents`, `appTemplateSavePrompt`, `normalizeMountingHoleConfig`, `sanitizePart`, `validateAndNormalize`.

- [ ] **Step 3: Remove from core.js and verify**

Delete the extracted code from core.js. Verify:

```bash
grep -c "validateAndNormalize\|appTemplateSavePrompt" src/core.js
```

Expected: `0`

```bash
grep -c "validateAndNormalize" src/projectSchema.js
```

Expected: `1` or more.

- [ ] **Step 4: Update index.html load order**

`projectSchema.js` depends on COMPONENT_LIBRARY (in core.js), so it loads after core.js but before exportEngine.js (which uses `sanitizePart` from projectSchema.js). Update the block that currently reads `core.js → exportEngine.js → canvasOverlays.js` to:

```html
  <script src="src/core.js?v=mobile-selected-fix"></script>
  <script src="src/projectSchema.js"></script>
  <script src="src/exportEngine.js"></script>
  <script src="src/canvasOverlays.js"></script>
```

- [ ] **Step 5: Verify in browser**

```bash
npm run dev
```

Open `http://localhost:4173`. Check:
- App loads, no console errors
- Save project (File → Save JSON) — file downloads
- Open a saved `.json` project file — loads correctly
- Open Templates dialog and save a new template — works

- [ ] **Step 6: Run screenshots**

```bash
npm run screenshot
```

No regressions.

- [ ] **Step 7: Commit**

```bash
git add src/projectSchema.js src/core.js index.html
git commit -m "refactor: extract projectSchema.js from core.js (wave 3)"
```

---

## Task 4 — Wave 4: Extract `src/componentHelpers.js`

**Files:**
- Create: `src/componentHelpers.js`
- Modify: `src/core.js`
- Modify: `index.html`

### Background
After wave 3, what remains near the top of core.js (around line 12) are: the `TOP_COLOR_PRESETS`/`TEXT_FONT_OPTIONS` constants and all the component type predicate and visual geometry helpers: `isPotLike`, `isJackLike`, `isButtonLike`, `isLedLike`, `isFaderLike`, `isMiniSlideSwitch`, `isTrimPot`, `isScaleEligibleComponent`, `hasNutWasherHardware`, `defaultTopColor`, `topColor`, `topHardwareVisible`, `visualKnobDiameter`, `visualButtonRadius`, `ergonomicDiameter`.

These helpers have **no dependencies** on COMPONENT_LIBRARY or React — they only take component objects as arguments. So `componentHelpers.js` can load **before** core.js, as first in the chain.

- [ ] **Step 1: Find helper function line**

```bash
grep -n "TOP_COLOR_PRESETS\|isPotLike\|defaultTopColor\|visualKnobDiameter" src/core.js
```

Expected: all on line 12 (one very long minified line).

- [ ] **Step 2: Create componentHelpers.js**

Create `src/componentHelpers.js`:

```js
// Component type predicates and visual geometry helpers.
// No dependencies — safe to load first.
```

Then paste the extracted line(s) containing: `TOP_COLOR_PRESETS`, `TEXT_FONT_OPTIONS`, `defaultTopColor`, `topColor`, `topHardwareVisible`, `isPotLike`, `isScaleEligibleComponent`, `isJackLike`, `isButtonLike`, `isLedLike`, `isFaderLike`, `isMiniSlideSwitch`, `isTrimPot`, `hasNutWasherHardware`, `visualKnobDiameter`, `visualButtonRadius`, `ergonomicDiameter`.

- [ ] **Step 3: Remove from core.js and verify**

```bash
grep -c "isPotLike\|defaultTopColor\|TOP_COLOR_PRESETS" src/core.js
```

Expected: `0` (or low if there are references but not definitions)

```bash
grep -c "function isPotLike\|TOP_COLOR_PRESETS" src/componentHelpers.js
```

Expected: `2` or more.

- [ ] **Step 4: Update index.html — componentHelpers loads first**

`componentHelpers.js` has no dependencies, so it goes before core.js:

```html
  <script src="src/componentHelpers.js"></script>
  <script src="src/core.js?v=mobile-selected-fix"></script>
  <script src="src/projectSchema.js"></script>
  <script src="src/exportEngine.js"></script>
  <script src="src/canvasOverlays.js"></script>
```

The full new load order in context of the complete index.html (replaces the entire script block after the CDN tags):

```html
  <script src="src/startup-error.js"></script>
  <!-- React CDN tags stay here, unchanged -->
  <script src="src/canvas-browser-guards.js"></script>
  <script src="src/device-classes.js"></script>
  <script src="src/toast.js"></script>
  <script src="src/still-loading.js"></script>
  <script src="src/runtime-errors.js"></script>
  <script src="src/appCommands.js"></script>
  <script src="src/componentHelpers.js"></script>
  <script src="src/core.js?v=mobile-selected-fix"></script>
  <script src="src/projectSchema.js"></script>
  <script src="src/exportEngine.js"></script>
  <script src="src/NativeDialogs.js"></script>
  <script src="src/LeftSidebarPanels.js"></script>
  <script src="src/Canvas.js"></script>
  <script src="src/LayerManager.js"></script>
  <script src="src/RightSidebarPanels.js"></script>
  <script src="src/LeftSidebar.js"></script>
  <script src="src/RightSidebar.js"></script>
  <script src="src/MobileDock.js"></script>
  <script src="src/Topbar.js"></script>
  <script src="src/CanvasToolRail.js"></script>
  <script src="src/ExportDialog.js"></script>
  <script src="src/FactoryTemplates.js"></script>
  <script src="src/PresetLayouts.js"></script>
  <script src="src/TemplatesDialog.js"></script>
  <script src="src/AppOverlays.js"></script>
  <script src="src/canvasOverlays.js"></script>
  <script src="src/WorkspaceShell.js"></script>
  <script src="src/ViewContrast.js?v=desktop-toolbox-v2"></script>
  <script src="src/App.js?v=workspace-shell"></script>
  <script src="src/main.js"></script>
```

Key changes vs original: `componentHelpers.js` inserted before `core.js`; `projectSchema.js` and `exportEngine.js` inserted after `core.js` and before `NativeDialogs.js`; `canvasOverlays.js` inserted after `AppOverlays.js`.

- [ ] **Step 5: Full app verification**

```bash
npm run dev
```

Open `http://localhost:4173`. Verify:
- App loads, no console errors
- Canvas renders components correctly (shapes, colors)
- Sidebar shows component properties (type predicates used for UI logic)
- Export SVG works
- Save/load project works

- [ ] **Step 6: Run screenshot suite — full regression check**

```bash
npm run screenshot
```

All captures must match baseline. This is the final wave — do a thorough visual comparison across all design-review targets (desktop, mobile, templates, export, layer manager).

- [ ] **Step 7: Final commit**

```bash
git add src/componentHelpers.js src/core.js index.html
git commit -m "refactor: extract componentHelpers.js from core.js (wave 4)"
```

---

## Verification summary

After all 4 waves:

```bash
wc -l src/core.js src/exportEngine.js src/canvasOverlays.js src/projectSchema.js src/componentHelpers.js
```

`core.js` should be the smallest it has ever been (COMPONENT_LIBRARY, constants, context, reducer). The total line count across all files should match the original.

```bash
# No function should appear in both core.js and its extracted file
grep -c "function isPotLike" src/core.js src/componentHelpers.js
# Expected: core.js: 0, componentHelpers.js: 1
```
