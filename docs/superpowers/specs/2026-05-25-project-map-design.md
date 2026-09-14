# Spec — 2026-05-25 — PROJECT_MAP

## Purpose

Give Claude Code and Codex agents a single file to read before fixing a bug:
which UI surface owns the symptom, which files to touch, which to avoid.

Primary readers: Claude Code, Codex. Not a human onboarding doc.

---

## Deliverables

| File | Format | Purpose |
|---|---|---|
| `PROJECT_MAP.md` | Markdown, H2 per surface | Agent-readable; grep by surface name |
| `PROJECT_MAP.json` | JSON array | Machine-readable; jq/tooling |

Both files live at repo root. Both are always kept in sync.

---

## Surface list (16 active + 1 dead section)

| id | Description |
|---|---|
| `canvas` | SVG panel render — grid, components, text, artwork, rulers, zoom/pan, selection, drag |
| `canvas-overlays` | Canvas overlay React components: scale layer, tooltip, snap badge, DFM float |
| `canvas-tool-rail` | Left tool rail — desktop controls + mobile nudge/edit/delete (.canvas-tool-mobile-only) + component library picker |
| `topbar` | Header bar: brand, project/panel/text dropdown menus, templates, file, help |
| `right-sidebar` | Inspector tabs: component properties, object properties, production, workflow, status |
| `mobile-dock` | Mobile bottom bar: mode switch, sheet triggers (edit/properties). Nudge/edit controls are in canvas-tool-rail (.canvas-tool-mobile-only). |
| `layer-manager` | Layer visibility panel (inside right sidebar tab) |
| `export` | SVG / DXF / PSD / ZIP / KiCad export engine, dialog, and format helpers |
| `templates` | Factory templates, user template storage, templates dialog |
| `theme` | Appearance presets, accent hue, view contrast — ThemeEngine owns CSS vars |
| `app-state` | React context, reducer, core constants and pure utilities (shared by all surfaces) |
| `component-library` | Built-in part definitions, sort order, predicates, visual geometry helpers |
| `geometry` | Pure math: OBB collision, front shapes, measurements — no React, no state |
| `storage` | localStorage project I/O, schema validation/normalization, app command bridge |
| `workspace-shell` | CSS grid wrapper — sets --left-col / --right-col; do not set grid-column manually |
| `bootstrap` | Page init, CDN error handling, device classification, toast, ErrorBoundary, self-test |

---

## Schema — one surface entry

### Markdown block (in PROJECT_MAP.md)

```
## <surface-id>

**Description:** <one sentence>

**Owns:**
- `src/File.js`

**CSS section:** §N Section Name  (or "none")

**Shared:** false  (true only for app-state and component-library)

**Do not touch:**
- `src/OtherFile.js` — reason
```

### JSON object (in PROJECT_MAP.json)

```json
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
}
```

---

## Full file-to-surface mapping

| File | Surface | Notes |
|---|---|---|
| `src/App.js` | `app-state` | shared; also wires canvas events — do not touch from canvas surface |
| `src/appCommands.js` | `storage` | window-event bridge |
| `src/AppearanceModal.js` | `theme` | |
| `src/AppOverlays.js` | `app-state` | app-level overlays rendered by App |
| `src/appState.js` | `app-state` | reducer + context |
| `src/canvas-browser-guards.js` | `bootstrap` | |
| `src/Canvas.js` | `canvas` | |
| `src/canvasOverlays.js` | `canvas-overlays` | |
| `src/CanvasToolMenus.js` | `canvas-tool-rail` | |
| `src/CanvasToolRail.js` | `canvas-tool-rail` | |
| `src/componentHelpers.js` | `component-library` | |
| `src/componentLibrary.js` | `component-library` | compatibility facade; COMPONENT_LIBRARY defined in componentDefinitions.js |
| `src/components/library/componentDefinitions.js` | `component-library` | pure data |
| `src/components/library/componentSorting.js` | `component-library` | |
| `src/components/library/PartLibraryUI.js` | `canvas-tool-rail` | headless component picker; triggered by Add button |
| `src/core.js` | `app-state` | shared constants + pure utilities |
| `src/device-classes.js` | `bootstrap` | |
| `src/diagnostics/runtimeSelfTest.js` | `bootstrap` | |
| `src/ExportDialog.js` | `export` | |
| `src/export/downloadHelpers.js` | `export` | |
| `src/export/kiCadExport.js` | `export` | |
| `src/export/kiCadImport.js` | `export` | |
| `src/export/psdExport.js` | `export` | |
| `src/export/zipUtils.js` | `export` | |
| `src/exportEngine.js` | `export` | |
| `src/exportHelpers.js` | `export` | |
| `src/FactoryTemplates.js` | `templates` | compatibility facade |
| `src/geometry/frontShapeGeometry.js` | `geometry` | |
| `src/geometry/measurementHelpers.js` | `geometry` | |
| `src/geometry/obbMath.js` | `geometry` | |
| `src/LayerManager.js` | `layer-manager` | |
| `src/LeftSidebar.js` | **dead** | left sidebar removed; file not rendered anywhere |
| `src/LeftSidebarPanels.js` | `topbar` | ProjectPanel, PanelSettings, TextPanel now render as topbar dropdowns |
| `src/main.js` | `bootstrap` | root render entrypoint |
| `src/MobileDock.js` | `mobile-dock` | |
| `src/NativeDialogs.js` | `app-state` | appConfirm/appAlert DOM primitives used app-wide |
| `src/PresetLayouts.js` | `app-state` | starter layout presets |
| `src/projectSchema.js` | `storage` | |
| `src/projectStorage.js` | `storage` | |
| `src/RightSidebar.js` | `right-sidebar` | |
| `src/RightSidebarComponentProperties.js` | `right-sidebar` | |
| `src/RightSidebarFields.js` | `right-sidebar` | shared field helpers |
| `src/RightSidebarObjectProperties.js` | `right-sidebar` | |
| `src/RightSidebarPanels.js` | `right-sidebar` | ownership marker; concrete panels in sibling files |
| `src/RightSidebarProductionPanels.js` | `right-sidebar` | |
| `src/RightSidebarStatusPanels.js` | `right-sidebar` | |
| `src/RightSidebarWorkflowPanels.js` | `right-sidebar` | |
| `src/runtime/ErrorBoundary.js` | `bootstrap` | |
| `src/runtime-errors.js` | `bootstrap` | |
| `src/startup-error.js` | `bootstrap` | |
| `src/still-loading.js` | `bootstrap` | |
| `src/templateStorage.js` | `templates` | |
| `src/templates/factoryTemplateData.js` | `templates` | pure data |
| `src/templates/templateDefaults.js` | `templates` | |
| `src/templates/templateSavePrompt.js` | `templates` | |
| `src/TemplatesDialog.js` | `templates` | |
| `src/ThemeEngine.js` | `theme` | owns all CSS custom property vars |
| `src/toast.js` | `bootstrap` | |
| `src/Topbar.js` | `topbar` | |
| `src/TopbarMenus.js` | `topbar` | |
| `src/ux/partHistory.js` | `canvas-tool-rail` | recent/favourite parts UX |
| `src/ViewContrast.js` | `theme` | |
| `src/WorkspaceShell.js` | `workspace-shell` | |
| `styles.css` | all surfaces | 11-section domain file; ThemeEngine owns vars |
| `index.html` | `bootstrap` | script load order is the dependency graph |

---

## CSS section index

| § | Name | Surfaces |
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

## Do-not-touch rules (cross-surface)

- `src/App.js` — shared orchestrator; only edit from `app-state` surface. Never edit from canvas, sidebar, or topbar surfaces.
- `src/core.js` — shared constants; changes affect every surface. Always read before editing.
- `src/ThemeEngine.js` — owns all CSS vars. Never set CSS custom properties manually outside ThemeEngine.
- `styles.css` — do not add `!important`. Do not hardcode hex values; use semantic tokens.
- `src/LeftSidebar.js` — dead code. Do not edit, do not delete without explicit instruction.
- `index.html` — script load order is the dependency graph. Do not reorder without understanding load deps.

---

## Maintenance

Update both `PROJECT_MAP.md` and `PROJECT_MAP.json` together whenever:
- a new file is added to `src/`
- a surface is renamed, split, or merged
- a file changes ownership
