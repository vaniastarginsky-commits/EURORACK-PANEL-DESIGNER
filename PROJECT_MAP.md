# PROJECT_MAP.md — Architecture & Dependency Map

> Read-only reference. Do not change code based on this document alone.
> Generated: 2026-05-23, branch: ux-polish.

---

## 1. Entry Points

### index.html
Single-page app. Loads everything as plain `<script>` tags in order.

**Load order (relevant excerpt):**
```
vendor/react.production.min.js
vendor/react-dom.production.min.js

src/startup-error.js       — window.onerror capture
src/canvas-browser-guards.js — browser compat checks
src/device-classes.js      — applies .mobile / .desktop body class
src/toast.js               — global toast() function

src/appState.js            — AppProvider, useAppState, useAppDispatch, reducer
src/projectSchema.js       — sanitizePart(), projectSchema validation
src/componentLibrary.js    — allParts[], part lookup utilities
... (component files, dialogs, panels)
src/WorkspaceShell.js
src/App.js
src/runtime/ErrorBoundary.js
src/main.js                — ReactDOM.createRoot → mount
```

CSS: `styles.css?v=desktop-toolbox-v2` (single file, 4228 lines).

### main.js
```js
ReactDOM.createRoot(document.getElementById("root")).render(
  React.createElement(ErrorBoundary, null,
    React.createElement(AppProvider, null,
      React.createElement(App, null)
    )
  )
);
document.documentElement.dataset.panelDesignerReady = "true";
```

### App.js (4767 lines)
Top-level component. Owns all local interaction state (zoom, pan, drag,
dialogs, touch modes). Reads global panel/component state from `useAppState()`.
Renders the full component tree.

### AppProvider (src/appState.js)
```js
const [state, dispatch] = useReducer(appReducer, undefined, makeInitialState);
// Provides AppStateCtx (state) and AppDispatchCtx (dispatch)
```
Two contexts. All components consume via `useAppState()` / `useAppDispatch()`.

---

## 2. Main Render Tree

```
ErrorBoundary  (src/runtime/ErrorBoundary.js)
└── AppProvider  (src/appState.js)
    └── App  (src/App.js)
        │
        ├── Topbar  (src/Topbar.js)
        │   └── toolbar-menu-trigger buttons → toolbar-popover (fixed, z=2147483000)
        │
        ├── [overlay] CommandPalette  (src/AppOverlays.js)  — showCommandPalette
        ├── [overlay] ShortcutHelpOverlay  (src/AppOverlays.js)  — showShortcutHelp
        ├── [overlay] ProductionCheckDialog  (src/AppOverlays.js)  — showProductionCheck
        ├── [overlay] LocalProjectsDialog  (src/AppOverlays.js)  — showLocalProjectsDialog
        ├── [overlay] TemplatesDialog  (src/TemplatesDialog.js)  — showTemplatesDialog
        ├── [overlay] ExportDialog  (src/ExportDialog.js)  — showExportDialog
        ├── [input hidden]  — project file import
        ├── [input hidden]  — KiCad PCB import
        │
        └── WorkspaceShell  (src/WorkspaceShell.js — 13 lines, pure wrapper)
            └── .workspace  (CSS Grid: 292px | 1fr | 312px)
                │
                ├── [mobile] backdrop div  — leftPanelOpen && isNarrowInitial
                │
                ├── LeftSidebar  (src/LeftSidebar.js)
                │   └── LeftSidebarPanels  (src/LeftSidebarPanels.js)
                │       ├── ProjectPanel
                │       ├── PanelSettings
                │       ├── ArtworkPanel
                │       ├── TextPanel
                │       └── ComponentLibraryPanel
                │           └── component-library-popover (fixed, z=2147482500)
                │               ├── popover-head
                │               ├── popover-controls (search + category select)
                │               ├── [cond] library-memory-row (recents/favorites chips)
                │               └── popover-component-grid (grid-row:4, overflow:auto)
                │                   └── component-icon-card × N (button, aspect-ratio:1)
                │
                ├── CanvasToolRail  (src/CanvasToolRail.js)
                │   — desktop tool controls, hidden on mobile (@media max-width:900px)
                │
                ├── canvas-wrap  (CSS grid-column:2)
                │   ├── SVGCanvas  (src/Canvas.js)
                │   │   ├── GridLayer
                │   │   ├── component [data-id] groups × N
                │   │   ├── text [data-text-id] elements × N
                │   │   ├── artwork [data-artwork-id] elements × N
                │   │   ├── snap/distance/ruler guides
                │   │   ├── marquee selection rect
                │   │   └── template placement preview
                │   │
                │   ├── [cond] InlineTextEditor (fixed, editingTextId)
                │   ├── CanvasQuickAddDock / MobileDock  (src/MobileDock.js)
                │   │   — .mobile-dock, shown on mobile only
                │   ├── canvas-hud (HUD pills: autosave, coord, DFM)
                │   ├── [mobile] mode-pill, mode-switch
                │   ├── [mobile] selection-actions bar
                │   ├── [mobile] nudge-mode sheet
                │   ├── [mobile] mobile-bottom-sheet (alignment/spacing)
                │   └── [cond] component-menu (long-press context menu)
                │
                └── RightSidebar  (src/RightSidebar.js)
                    ├── right-tab-strip (Status / Inspect / Prod / Layers)
                    ├── Status tab
                    │   ├── Layout status panel
                    │   └── Warnings / DFM panel
                    ├── Inspect tab
                    │   ├── RightSidebarComponentProperties
                    │   ├── RightSidebarObjectProperties (artwork)
                    │   └── (text properties)
                    ├── Production tab
                    │   └── RightSidebarProductionPanels
                    └── Layers tab
                        └── LayerManager  (src/LayerManager.js)
```

---

## 3. UI Ownership Map

### Topbar
| Field | Value |
|---|---|
| **Owning component** | `src/Topbar.js` |
| **CSS selectors** | `.toolbar`, `.toolbar button`, `.toolbar-menu-trigger`, `.toolbar-popover`, `.toolbar .brand` |
| **CSS zones** | lines 47–48 (v423), 135–154 (v426), 161–167 (v427), line 2 (theme) |
| **State deps** | `onExportSVGClick`, `onOpenTemplates`, `onOpenLocalProjects` callbacks from App.js |
| **Files to touch** | `src/Topbar.js`, `src/TopbarMenus.js`, styles.css lines 135–167 |
| **Files NOT to touch** | `src/CanvasToolRail.js`, `src/MobileDock.js` |
| **Notes** | Topbar = global header only. Work controls belong in CanvasToolRail, not here. |

### CanvasToolRail
| Field | Value |
|---|---|
| **Owning component** | `src/CanvasToolRail.js` |
| **CSS selectors** | `.canvas-quick-dock`, `.canvas-quick-dock button`, `.workflow-rail`, `.dock-primary`, `.inspector-rail-popover` |
| **CSS zones** | lines 69–79, 128–129, 264–273, 3311–3441 (desktop-tool-rail-layout-variables), 3571–3738 (structural-ownership) |
| **State deps** | zoom, pan, snapSettings, viewMode, focusMode, leftPanelOpen, rightPanelOpen |
| **Files to touch** | `src/CanvasToolRail.js`, `src/CanvasToolMenus.js`, styles.css lines 3311–3738 |
| **Files NOT to touch** | `src/Topbar.js`, `src/MobileDock.js` |
| **Notes** | Desktop/tablet only. Hidden on mobile via `@media(max-width:900px){.canvas-quick-dock .workflow-rail{display:none!important}}`. Do NOT add mobile-only controls here. |

### MobileDock
| Field | Value |
|---|---|
| **Owning component** | `src/MobileDock.js` |
| **CSS selectors** | `.mobile-dock`, `.mobile-main-dock`, `.mobile-bottom-nav`, `.mobile-selection-actions`, `.mobile-bottom-sheet`, `.mobile-sheet-*` |
| **CSS zones** | lines 192–216 (v428), 2598–2994 (v451 mobile-canvas-dock-cleanup), 2840–2994 (ux-polish dock) |
| **State deps** | `touchMode`, `mobileProtectMode`, `mobileFineMode`, `mobileOneHandMode`, selection state |
| **Files to touch** | `src/MobileDock.js`, styles.css lines 2840–2994 |
| **Files NOT to touch** | `src/CanvasToolRail.js`, `src/Topbar.js` |
| **Notes** | Mobile only. Desktop hides via `@media(min-width:901px){.mobile-dock-restore{display:none!important}}`. Multiple legacy CSS blocks target `.mobile-dock`. The canonical block is ux-polish/v451. |

### Component Library Popover
| Field | Value |
|---|---|
| **Owning component** | `src/LeftSidebarPanels.js` → `ComponentLibraryPanel` function |
| **CSS selectors** | `.component-library-popover`, `.component-library-popover-head`, `.component-library-popover-controls`, `.popover-component-grid`, `.component-icon-card`, `.component-icon-preview`, `.component-icon-name`, `.component-icon-meta`, `.part-favorite-mini`, `.library-memory-row`, `.library-real-preview` |
| **CSS zones** | Lines 180–216 (v428, LEGACY early block), lines 3945–4120 (ux-polish canonical block) |
| **State deps** | `libraryOpen`, `partSearch`, `partCategory`, `displayedParts`, `favoriteKeys`, `recentKeys`, `replaceMode` (all local to ComponentLibraryPanel) |
| **Files to touch** | `src/LeftSidebarPanels.js`, `src/components/library/PartLibraryUI.js`, `src/components/library/componentSorting.js`, styles.css lines 3945–4120 |
| **Files NOT to touch** | `src/components/library/componentDefinitions.js` (data, not UI) |
| **Notes** | Two-layer CSS: early block (~180) provides base z-index/bg/padding, canonical block (~3945) provides layout. See knowledge.md for cascade analysis. The `grid-row:4` on `.popover-component-grid` is critical for mobile scroll. |

### LeftSidebar
| Field | Value |
|---|---|
| **Owning component** | `src/LeftSidebar.js` (shell), `src/LeftSidebarPanels.js` (content) |
| **CSS selectors** | `.sidebar-left`, `.sidebar-left.closed`, `.sidebar-left .section`, `.sidebar-left .field-row`, `.sidebar-left label`, `.sidebar-left input`, `.component-library-shell` |
| **CSS zones** | Lines 53, 55 (v423 layout), 93–133 (v424 controls), 2286–2545 (v447 compact-polish) |
| **State deps** | `leftPanelOpen`, `panelHP`, `panelName`, artwork items, text items, components |
| **Files to touch** | `src/LeftSidebar.js`, `src/LeftSidebarPanels.js`, styles.css lines 93–133, 2286–2545 |
| **Files NOT to touch** | `src/RightSidebar.js`, `src/RightSidebarPanels.js` |

### RightSidebar
| Field | Value |
|---|---|
| **Owning component** | `src/RightSidebar.js`, `src/RightSidebarPanels.js`, `src/RightSidebarFields.js`, `src/RightSidebarComponentProperties.js`, `src/RightSidebarObjectProperties.js`, `src/RightSidebarStatusPanels.js`, `src/RightSidebarProductionPanels.js`, `src/RightSidebarWorkflowPanels.js` |
| **CSS selectors** | `.sidebar-right`, `.sidebar-right.closed`, `.right-tab-strip`, `.right-tab-page`, `.right-tab-strip button.active`, `.sidebar-right .section` |
| **CSS zones** | Lines 54–55 (v423 layout), 77–92 (tab strip), 93–133 (v424 controls), 3739–3903 (v508 component inspector) |
| **State deps** | `rightPanelOpen`, `rightInspectorTopTab`, `rightStatusTab`, `rightInspectTab`, `rightProdTab`, `rightLayersTab`, selected components, warnings |
| **Files to touch** | `src/RightSidebar*.js` files, styles.css lines 77–92, 3739–3903 |
| **Files NOT to touch** | `src/LeftSidebar.js`, `src/LeftSidebarPanels.js` |

### LayerManager
| Field | Value |
|---|---|
| **Owning component** | `src/LayerManager.js` |
| **CSS selectors** | `.layer-manager`, `.layer-compact-*`, `.layer-row`, `.layer-vis-btn`, `.layer-export-btn`, `.layer-opacity-slider` |
| **CSS zones** | Lines 1365–1503 (v440), 3442–3570 (v507-layer-manager-compact) |
| **State deps** | `state.layers` (visibility, export, opacity per layer), `SET_LAYER_VISIBILITY`, `SET_LAYER_OPACITY`, `SET_LAYER_EXPORT` |
| **Files to touch** | `src/LayerManager.js`, styles.css lines 1365–1570 and 3442–3570 |
| **Files NOT to touch** | `src/RightSidebarStatusPanels.js` (DFM/warnings live there, not layers) |
| **Notes** | Two CSS blocks for layers: v440 (base layout) and v507 (compact-* classes). The v507 block was added to avoid conflicts with the base !important rules. |

### SVGCanvas
| Field | Value |
|---|---|
| **Owning component** | `src/Canvas.js` |
| **CSS selectors** | `.canvas-wrap`, `.panel-canvas-svg`, `.canvas-hud`, `.workspace-overlay`, `.canvas-hud span`, `.grid-major`, `.grid-minor`, `.selection-box`, `.snap-guide`, `.distance-guide`, `.ruler-guide` |
| **CSS zones** | Lines 57–68 (v423 canvas layout), line 2 (theme: svg selectors), 264–273 (HUD z-index) |
| **State deps** | `zoom`, `pan`, `snapGuides`, `distanceGuides`, `ruler`, `marqueeSelection`, `dragPreview`, `rotationPreview`, `pendingTemplatePlacement`, all component/artwork/text data from global state |
| **Files to touch** | `src/Canvas.js`, `src/canvasOverlays.js`, styles.css lines 57–68 |
| **Files NOT to touch** | `src/CanvasToolRail.js` (controls, not canvas content) |
| **Notes** | SVG-only rendering. No React DOM inside the SVG. All children are SVG elements. Interaction handlers are on the parent `.canvas-wrap` div in App.js. |

### TemplatesDialog
| Field | Value |
|---|---|
| **Owning component** | `src/TemplatesDialog.js` |
| **CSS selectors** | `.template-manager-backdrop`, `.template-manager-panel`, `.template-card-realistic`, `.template-card-main`, `.template-preview-realistic`, `.filter-row`, `.template-preset-note` |
| **CSS zones** | Lines 218–252 (v429), 274–431 (v432), 387–430 (v433 card grid), 540–705 (v436), 2173–2274 (v445 inline confirm) |
| **State deps** | `showTemplatesDialog` (App.js), template list from `src/templateStorage.js` + `src/FactoryTemplates.js` |
| **Files to touch** | `src/TemplatesDialog.js`, `src/FactoryTemplates.js`, `src/templateStorage.js`, styles.css lines 274–431 |
| **Files NOT to touch** | `src/ExportDialog.js` |
| **Notes** | Has inline confirm dialogs (load/replace prompt). These use `.inline-modal-layer` positioned over the templates panel. See v445 CSS zone for centering fix. |

### ExportDialog
| Field | Value |
|---|---|
| **Owning component** | `src/ExportDialog.js` |
| **CSS selectors** | `.export-dialog-backdrop`, `.export-dialog-panel`, `.export-dialog-actions`, `.export-dialog-header`, `.export-tabs`, `.export-package-card`, `.export-recommended-banner` |
| **CSS zones** | Lines 218–252 (v429), 332–376 (v432 export layout), 432–508 (v433), 706–924 (v437), 925–1364 (v439 senior-layout-pass), 1883–2172 (v444), 2047–2120 (report/kicad tabs) |
| **State deps** | `showExportDialog`, `exportOptions` (App.js local state), `state.components`, `state.artworks`, DFM warnings |
| **Files to touch** | `src/ExportDialog.js`, `src/exportEngine.js`, `src/exportHelpers.js`, styles.css lines 706–1364 (v437/v439 are canonical export CSS) |
| **Files NOT to touch** | `src/TemplatesDialog.js` |
| **Notes** | Export CSS has many historical layers (v429, v432, v433, v437, v439, v444). The canonical block is v439 (lines 925–1364). Earlier blocks are mostly overridden. |

### AppOverlays (CommandPalette, LocalProjectsDialog, ShortcutHelp, ProductionCheck)
| Field | Value |
|---|---|
| **Owning component** | `src/AppOverlays.js` |
| **CSS selectors** | `.command-palette-backdrop`, `.command-palette`, `.shortcut-help-backdrop`, `.shortcut-help`, `.shortcut-help-card`, `.app-modal-backdrop`, `.app-modal-panel`, `.app-native-modal-*` |
| **CSS zones** | Lines 169–179 (shortcut help, v428), line 2 (theme), canonical block line 4041–4103 (command palette, ux-polish) |
| **State deps** | `showCommandPalette`, `showShortcutHelp`, `showProductionCheck`, `showLocalProjectsDialog` |
| **Files to touch** | `src/AppOverlays.js`, styles.css lines 169–179 and 4041–4103 |

### WorkspaceShell
| Field | Value |
|---|---|
| **Owning component** | `src/WorkspaceShell.js` (13 lines — thin wrapper only) |
| **CSS selectors** | `.workspace`, `.app-shell`, `.designer-shell`, `.workspace-shell` |
| **CSS zones** | Lines 14–43 (v422 emergency restore), 44–92 (v423 targeted restore) |
| **State deps** | `leftPanelOpen`, `rightPanelOpen` (passed as CSS class modifiers `.closed`) |
| **Files to touch** | `src/WorkspaceShell.js`, styles.css lines 44–92 |
| **Files NOT to touch** | Any component inside the workspace — WorkspaceShell is layout only |
| **Notes** | Grid: `grid-template-columns: 292px minmax(0,1fr) 312px`. Sidebar `.closed` hides via `visibility:hidden + pointer-events:none` (not display:none, to avoid reflow). |

---

## 4. State Ownership

### Global State (src/appState.js, via useReducer)

| State Area | Shape | Key Actions | Readers | Writers |
|---|---|---|---|---|
| **Panel** | `{ panelHP, panelName, panelDepth, frontColor, rearColor, mounting, pcb, … }` | `SET_PANEL_HP`, `UPDATE_PROJECT_META` | App, LeftSidebarPanels, Canvas, ExportDialog | LeftSidebarPanels |
| **Components** | `components[]` (array of part objects) | `ADD_COMPONENT`, `UPDATE_COMPONENT`, `REMOVE_COMPONENT`, `DUPLICATE_COMPONENT`, `UPDATE_COMPONENTS_PATCH` | App, Canvas, RightSidebar, LayerManager, ExportDialog | App (drag/drop/rotate), RightSidebarComponentProperties |
| **Selection** | `selected[]` (array of IDs) | `SET_SELECTED`, `ADD_TO_SELECTED`, `CLEAR_SELECTED` | App, RightSidebar, Canvas | App (click/marquee), LeftSidebarPanels (after add) |
| **View Mode** | `viewMode` ("front"/"rear"/"drill") | `SET_VIEW_MODE` | Canvas, CanvasToolRail, ExportDialog | CanvasToolRail |
| **Grid/Snap** | `gridSize`, `snapToGrid`, `snapToComponents` | `SET_GRID_SIZE` | Canvas, CanvasToolRail | CanvasToolRail |
| **Mobile performance** | `mobilePerformanceMode` | `SET_MOBILE_PERFORMANCE_MODE` | Canvas (simplifies rendering) | MobileDock |
| **Layers** | `layers{}` (per-layer: visible, export, opacity) | `SET_LAYER_VISIBILITY`, `SET_LAYER_OPACITY`, `SET_LAYER_EXPORT`, `SET_LAYER_VISIBILITY_BULK` | Canvas, LayerManager, ExportDialog | LayerManager |
| **Artwork** | `artworks[]` | `ADD_ARTWORK`, `UPDATE_ARTWORK`, `REMOVE_ARTWORK` | Canvas, LeftSidebarPanels, RightSidebarObjectProperties | App (drag/resize), RightSidebarObjectProperties |
| **Text** | `texts[]` | `ADD_TEXT`, `UPDATE_TEXT`, `REMOVE_TEXT` | Canvas, LeftSidebarPanels | App (drag/inline edit) |
| **Custom parts** | `customParts[]` | `ADD_CUSTOM_PART`, `RESET_CUSTOM_PARTS` | ComponentLibraryPanel | LeftSidebarPanels |
| **Undo/Redo** | `history[]`, `future[]` | `UNDO`, `REDO`, `PUSH_HISTORY` | App (Cmd+Z) | Reducer (auto-snapshotted on mutations) |
| **DFM profile** | `dfmProfile` | `SET_DFM_PROFILE` | RightSidebarStatusPanels, ExportDialog | RightSidebarWorkflowPanels |

### App.js Local State (interaction/UI, NOT persisted)

| State Area | Variables | Consumers |
|---|---|---|
| **Canvas transform** | `zoom`, `pan` | Canvas, CanvasToolRail, coordinate transforms |
| **Drag interaction** | `dragging`, `dragPreview`, `dragStartPositions` | Canvas (preview), App (pointer handlers) |
| **Rotation** | `rotatingComponent`, `rotationPreview` | Canvas (preview) |
| **Text drag** | `draggingText`, `textDragPreview`, `textsDragPreview` | Canvas |
| **Artwork drag/resize** | `draggingArtwork`, `artworkDragPreview`, `resizingArtwork`, `artworkResizePreview` | Canvas |
| **Marquee** | `marqueeSelection`, `pendingMarquee` | Canvas |
| **Snap guides** | `snapGuides`, `distanceGuides` | Canvas |
| **Ruler** | `ruler`, `coordReadout` | Canvas, HUD |
| **Touch modes** | `touchMode`, `mobileProtectMode`, `mobileFineMode`, `mobileOneHandMode`, `showMobileNudge`, `showMobileSelectionMore` | MobileDock, App handlers |
| **Canvas mode** | `canvasInteractionMode` | App pointer handlers |
| **Dialogs** | `showExportDialog`, `showTemplatesDialog`, `showLocalProjectsDialog`, `showCommandPalette`, `showShortcutHelp`, `showProductionCheck` | Overlay components |
| **Panel open** | `leftPanelOpen`, `rightPanelOpen` | WorkspaceShell, CanvasToolRail |
| **Right tab** | `rightInspectorTopTab`, `rightStatusTab`, `rightInspectTab`, `rightProdTab`, `rightLayersTab` | RightSidebar |
| **Inline text** | `editingTextId` | InlineTextEditor |
| **Pending placement** | `pendingAddPart`, `pendingAddPreview`, `pendingAddRepeat`, `pendingTemplatePlacement` | Canvas, ComponentLibraryPanel |
| **Component menu** | `componentMenu` | Component context menu |
| **Export opts** | `exportOptions` | ExportDialog |
| **Autosave** | `autosaveStatus` | HUD pill |

### External Storage

| Area | Mechanism | Files |
|---|---|---|
| **Local projects** | `localStorage` (JSON, keyed by project ID) | `src/projectStorage.js` |
| **Templates** | `localStorage` (factory + user-saved) | `src/templateStorage.js`, `src/templates/templateSavePrompt.js` |
| **Recent parts** | `localStorage` (last N part keys) | `src/ux/partHistory.js` |

---

## 5. CSS Ownership Map

styles.css is 4228 lines. It has **two structural layers**:
- **Line 2**: One giant minified theme block (CSS custom properties, global resets, theme overrides). Contains ~1976 total `!important` declarations.
- **Lines 3–4228**: Versioned patches applied sequentially (v422–v508), plus ux-polish canonical blocks.

### Zone Map

| Zone | Lines | Main Selectors | Owner | !important | Safety |
|---|---|---|---|---|---|
| **CSS vars + global theme** | 2 (minified) | `:root`, `*`, `body`, `button`, `input`, `.toolbar`, `.sidebar-left/right`, `.component-library`, `.canvas-hud` | Global | Heavy | ⚠️ Broad — edits affect everything |
| **Emergency layout restore** | 4–43 (v422) | `.app-shell`, `.workspace-shell`, `.topbar`, `.sidebar-section`, `.component-card`, `@media(900)` | WorkspaceShell | All !important | ⚠️ Legacy — partially overridden by later blocks |
| **Targeted workspace** | 44–92 (v423) | `.toolbar`, `.workspace`, `.sidebar-left`, `.sidebar-right`, `.canvas-wrap`, `.canvas-hud`, `.canvas-quick-dock`, `.right-tab-strip` | WorkspaceShell + Topbar + CanvasToolRail | All !important | ✅ Canonical layout — safe within scope |
| **Sidebar controls** | 93–134 (v424) | `.sidebar-left/right input`, `.sidebar-left/right label`, `.field-row`, `.measurement-row` | LeftSidebar + RightSidebar | All !important | ✅ Safe for sidebar input/form fixes |
| **Toolbar popover** | 135–167 (v426+v427) | `.toolbar-popover`, `.toolbar-menu-trigger`, `.mobile-sidebar-backdrop` | Topbar | All !important | ✅ Scoped to topbar dropdown |
| **Bottom sheets + comp library (legacy)** | 168–216 (v428) | `.shortcut-help-*`, `.component-library-popover` (OLD), `.component-icon-grid`, `.mobile-bottom-sheet`, `.mobile-sheet-*` | Mixed | All !important | ⚠️ Legacy — component library portion overridden by ux-polish canonical (~3945). Mobile sheet portion still active. |
| **Templates + Export backdrops** | 217–252 (v429) | `.template-manager-backdrop`, `.export-dialog-backdrop`, `.local-projects-backdrop`, `.template-manager-panel`, `.export-dialog-panel` | TemplatesDialog + ExportDialog | All !important | ⚠️ Partially overridden by v432/v439 |
| **Quick-add popover** | 253–263 (v430) | `.quick-pop-grid`, `.quick-pop-title`, `.quick-pop-grid button` | CanvasToolRail (add button) | !important | ✅ Scoped |
| **HUD z-index** | 264–273 | `.canvas-hud`, `.inspector-rail-popover` | CanvasToolRail | !important | ✅ Scoped |
| **Templates layout** | 274–431 (v432) | `.template-manager-panel`, `.template-card-realistic`, `.filter-row`, `.template-card-main` | TemplatesDialog | !important | ✅ Safe for templates fixes |
| **Export layout** | 432–705 (v433+v435+v436) | `.export-dialog-panel`, `.export-dialog-actions`, `.export-tabs`, `.template-card*` | ExportDialog + TemplatesDialog | !important | ⚠️ Partially overridden by v439 |
| **Export senior pass** | 925–1364 (v439) | `.export-dialog-panel`, export tab internals | ExportDialog | !important | ✅ Canonical export CSS |
| **Layer manager layout** | 1365–1521 (v440) | `.layer-manager`, `.layer-row`, `.layer-vis-btn` | LayerManager | !important | ✅ Safe for layer fixes |
| **Nested confirm dialogs** | 1522–1644 (v441) | `.inline-confirm-*`, `.inline-modal-*` | AppOverlays + TemplatesDialog | !important | ✅ Scoped |
| **Component hover card** | 1645–1800 (v442) | `.component-hover-card`, `.hover-grid` | Canvas (component HUD) | !important | ✅ Scoped |
| **Mobile dock hide on desktop** | 1801–1873 (v443) | `.mobile-dock-restore` | MobileDock | !important | ✅ Safe |
| **Export tabs final fit** | 1883–2172 (v444) | `.export-dialog-panel` tab bodies | ExportDialog | !important | ✅ Scoped to export |
| **Inline template confirm** | 2173–2274 (v445) | `.inline-modal-layer` | TemplatesDialog | !important | ✅ Scoped |
| **Mobile dock structural** | 2275–2600 (v446+legacy v451 comment) | `.mobile-dock-restore`, `.mobile-dock` | MobileDock | !important | ⚠️ Multiple conflicting blocks — canonical is ux-polish block below |
| **Left sidebar compact** | 2286–2545 (v447) | `.sidebar-left` form controls, `.component-library-shell` | LeftSidebar | !important | ✅ Canonical left sidebar CSS |
| **Collapsed sidebars** | 2546–2597 (v448) | `.sidebar-left.closed`, `.sidebar-right.closed` | WorkspaceShell | !important | ✅ Scoped |
| **ux-polish theme** | 2840–2995 (ux-polish) | Global theme resets, `.mobile-dock button` | Global | !important | ✅ Canonical theme |
| **qa-polish mobile QA** | 2996–3310 | Mobile-specific fixes from Playwright | Mobile | !important | ⚠️ Some may overlap with v451 |
| **Desktop tool rail** | 3311–3441 | `.canvas-quick-dock`, `.workflow-rail`, tool rail layout | CanvasToolRail | Mix | ✅ Canonical desktop rail CSS |
| **Structural ownership** | 3442–3738 (v507+structural-ownership) | `.layer-compact-*`, `.canvas-quick-dock`, Topbar/Rail split | LayerManager + CanvasToolRail | Mix | ✅ Canonical — defines the Topbar/Rail ownership split |
| **Component inspector** | 3739–3903 (v508) | Right sidebar component properties | RightSidebar | Mix | ✅ Scoped |
| **Scoped layout repairs** | 3904–3944 | Post-split overrides | Mixed | !important | ⚠️ Emergency patches — prefer editing canonical rules |
| **Component library (canonical)** | 3945–4119 (ux-polish) | `.component-library-popover`, `.popover-component-grid`, `.component-icon-card`, `.component-icon-*` | ComponentLibraryPanel | Mix | ✅ Canonical — edit here for component library bugs |
| **DFM status panel** | 4120–4228 | `.dfm-status-float`, `.dfm-status-main` | RightSidebarStatusPanels | No | ✅ Scoped |

---

## 6. Known Fragile Areas

### A. Duplicate CSS layers for the same surface

**Component Library Popover** — two `.component-library-popover` blocks:
- **Early** (line 180): base z-index, bg, padding. All !important. Partially dead (width, overflow, max-height overridden by canonical).
- **Canonical** (line 3945): layout (display:grid, grid-template-rows, overflow:hidden). !important.
- **Risk**: editing the early block may affect the deployed version if the canonical block is not yet deployed to that environment.

**Template Manager** — four layers: v429 → v432 → v433 → v436. Each partially overrides the previous.

**Export Dialog** — five layers: v429 → v432 → v433 → v437 → v439. v439 is canonical but earlier blocks are not fully dead.

**Mobile Dock** — three+ layers: v433 → v443 → v446 → v451 → ux-polish. Canonical block is ux-polish (lines 2840–2994). Legacy comment at line 2598 notes the v451 block was disabled.

### B. Broad selectors that affect many components

- `button, .btn { … }` in the global theme (line 2) — covers ALL buttons everywhere, including component cards, sidebar buttons, toolbar buttons. Editing it affects everything.
- `[class*=component-card], [class*=part-card], [class*=component-tile]` — attribute substring selectors that match any class containing those strings.
- `.section, .panel-card, .card, .inspector-card` — all section containers share the same base rule.
- `*,*::before,*::after { border-radius:0!important; text-shadow:none!important }` — universal reset.

### C. !important-heavy zones

The global theme block (line 2) is one long minified string. Virtually every declaration is `!important`. Any selector in the theme that targets a class also used for layout will be hard to override without matching or exceeding specificity AND using !important.

Current count: ~1976 `!important` declarations across the file.

### D. Conditional DOM affecting grid layout

The `.component-library-popover` is a CSS Grid container with `grid-template-rows: auto auto auto minmax(0,1fr) auto`. Its children:
1. `.component-library-popover-head` — always
2. `.component-library-popover-controls` — always
3. `.library-memory-row.popover-memory-row` — conditional (recents/favorites + no search + category=all)
4. `.component-library-empty` — conditional (no matches)
5. `.popover-component-grid` — always, **pinned to row 4 via `grid-row:4`**

Without `grid-row:4` on the grid, its row assignment shifts based on how many siblings are present, breaking mobile scrolling.

### E. Inline styles competing with CSS

`ComponentLibraryPanel` renders the popover with:
```js
style: { left: popoverPos.left, top: popoverPos.top }
// initial: { left: 330, top: 80 }
```
CSS `!important` overrides these on mobile (`left:8px!important`, `top:72px!important`). On desktop, the popover is draggable and inline style wins (CSS also uses !important positioning but dragging updates the inline style). This means the popover position can get stuck if the CSS/inline interaction is changed.

### F. Mobile detection in JS vs CSS

- JS: `window.innerWidth <= 860` at init time — stored in `isNarrowInitial`. Does NOT update on resize.
- CSS: `@media(max-width:860px),(pointer:coarse)` — updates on resize.

They can disagree after a resize. The sidebar open/close state (`leftPanelOpen`) is initialized based on `isNarrowInitial`, so it won't auto-correct if the user resizes the window.

### G. Script load order dependency

All JS files are loaded as global scripts, not ES modules. Each file can reference globals from any previously loaded file. Breaking the load order in `index.html` will cause runtime errors. WorkspaceShell and App.js must load after all panel/sidebar/dialog components.

---

## 7. Bugfix Routing Guide

### Topbar issue
- **Visual (colors, spacing)**: styles.css lines 47–48, 135–167, line 2 (`.toolbar` in theme)
- **Menu content/behavior**: `src/Topbar.js`, `src/TopbarMenus.js`
- **Popover not showing**: `.toolbar-popover` CSS (line 138), z-index (line 162)
- **Do NOT touch**: `src/CanvasToolRail.js`, `src/MobileDock.js`

### CanvasToolRail issue
- **Layout/positioning**: styles.css lines 69–79, 3311–3441
- **Button behavior**: `src/CanvasToolRail.js`, `src/CanvasToolMenus.js`
- **Popover (snap/view settings)**: `.inspector-rail-popover` CSS (line 268–273)
- **Hidden on mobile**: `@media(max-width:900px){.canvas-quick-dock .workflow-rail{display:none!important}}` (line ~860)
- **Do NOT touch**: `src/Topbar.js`, `src/MobileDock.js`

### MobileDock issue
- **Layout**: styles.css ux-polish block (lines 2840–2994)
- **Hidden on desktop**: lines 1808 (v443), 2280 (v446)
- **Button behavior/modes**: `src/MobileDock.js`
- **Bottom sheets**: `.mobile-bottom-sheet`, `.mobile-sheet-*` (lines 192–216)
- **Do NOT touch**: `src/CanvasToolRail.js`

### Component Library popover issue
- **Layout/scrolling**: styles.css lines 3945–4119 (canonical block)
- **Card sizing/overlap**: `.component-icon-card` at line 3965 — check `aspect-ratio`, `position:relative`, `overflow:hidden`, `grid-row:4` on grid
- **Card content positioning**: `.component-icon-preview`, `.component-icon-name`, `.component-icon-meta` (lines 3984–4029)
- **Mobile grid scrolling**: ensure `grid-row:4` on `.popover-component-grid`, and the outer `grid-template-rows: auto auto auto minmax(0,1fr) auto`
- **Part data**: `src/components/library/componentDefinitions.js`
- **Filtering/sorting**: `src/components/library/componentSorting.js`
- **UI logic**: `src/LeftSidebarPanels.js` → `ComponentLibraryPanel`
- **Legacy CSS (do not edit for new bugs)**: lines 180–216

### TemplatesDialog issue
- **Layout**: styles.css lines 274–431 (v432 canonical for templates)
- **Card display**: lines 387–430, 540–705 (v436)
- **Inline confirm (load/replace)**: lines 2173–2274 (v445), `src/TemplatesDialog.js`
- **Template data**: `src/FactoryTemplates.js`, `src/templateStorage.js`
- **Do NOT touch**: `src/ExportDialog.js`

### ExportDialog issue
- **Layout canonical**: styles.css lines 925–1364 (v439)
- **Tab content**: specific tab ranges within v439 and v444
- **Export logic**: `src/exportEngine.js`, `src/exportHelpers.js`
- **Format-specific**: `src/export/kiCadExport.js`, `src/export/psdExport.js`, `src/export/downloadHelpers.js`
- **Do NOT touch**: `src/TemplatesDialog.js`

### LayerManager issue
- **Layout**: styles.css lines 1365–1521 (v440), 3442–3570 (v507 compact classes)
- **Logic**: `src/LayerManager.js`
- **State**: `SET_LAYER_VISIBILITY`, `SET_LAYER_OPACITY`, `SET_LAYER_EXPORT` in `src/appState.js`
- **Note**: Use `.layer-compact-*` classes (v507 block) for new styles — they avoid !important conflicts with the v440 base block

### Canvas drag/select issue
- **Pointer handlers**: `src/App.js` (onPointerDown/Move/Up, 1000+ lines)
- **SVG rendering**: `src/Canvas.js`
- **Overlays**: `src/canvasOverlays.js`
- **Snap/geometry**: `src/geometry/obbMath.js`, `src/geometry/frontShapeGeometry.js`
- **State mutations**: `UPDATE_COMPONENT`, `UPDATE_ARTWORK`, `UPDATE_TEXT` in `src/appState.js`

### Inline text editor issue
- **Editor rendering**: inline in `src/App.js` (~line 3460 area)
- **Positioning**: uses `fixed` position + transform mapped from canvas coordinates
- **State**: `editingTextId`, `UPDATE_TEXT` dispatch

---

## 8. Do-Not-Break Rules

These are architectural invariants. Violating them causes cross-surface bugs.

### Layout invariants

1. **Topbar = global header only.** Never move working controls (snap, zoom, view mode, safe zones) from CanvasToolRail back into Topbar. Topbar holds menus for project-level actions only.

2. **CanvasToolRail = desktop working rail.** It is the primary interaction surface for non-touch users. It must remain visible on desktop. Do not render it on mobile (it is hidden via CSS media query — do not add `display:none` conditionally in JS, which could affect desktop too).

3. **MobileDock = mobile bottom dock.** It must only appear on mobile/touch (≤860px or pointer:coarse). Desktop must NOT reserve space for it. The CSS guard is `@media(min-width:901px){.mobile-dock-restore{display:none!important}}`.

4. **WorkspaceShell owns layout.** The `.workspace` grid (`292px | 1fr | 312px`) is set only in WorkspaceShell's CSS. No child component should change `grid-template-columns`, `grid-column`, or `grid-row` on the `.workspace` container.

5. **Sidebar collapse = CSS class + JS state, not DOM removal.** Sidebars use `.closed` class → `visibility:hidden; pointer-events:none`. They are always in the DOM. Do not conditionally unmount them — this breaks keyboard focus, autosave indicators, and transition animations.

6. **Component library grid-row must be 4.** The `.popover-component-grid` has `grid-row:4` to always land in the `minmax(0,1fr)` track regardless of whether the memory-row sibling is present. Do not remove this.

### CSS invariants

7. **No new `!important` without explicit approval.** The CSS design policy requires user approval before adding any new `!important`. This applies even when surrounding rules already use `!important`. See CSS_DESIGN_POLICY.md.

8. **Edit canonical/final rules, not patch layers.** For each UI surface, there is a canonical CSS block (identified by version comment or "ux-polish" comment). Edits go there. Do not add new emergency sections like `final-final-fix` or `qa-polish-2`.

9. **Do not edit the minified theme block (line 2) for scoped fixes.** The line-2 block affects every surface. Scoped fixes go in the surface-specific zones.

10. **`npm run verify` before committing CSS changes.** 21 screenshots must capture without error. Inspect affected screenshots manually if the change is visual.

### State invariants

11. **Global state mutation = reducer action only.** Never write to `state` directly. All mutations go through `dispatch({type, ...})`. Direct state mutation breaks undo/redo.

12. **`isNarrowInitial` is read-once at mount.** It does not update on resize. Do not rely on it for responsive behavior that must react to window resize — use CSS media queries for visual changes, and CSS class `.is-narrow` / `.is-wide` on body for JS-driven changes.

13. **Undo/redo snapshots are automatic.** The reducer wraps mutations with `withHistory`. Do not call `PUSH_HISTORY` manually from components.
