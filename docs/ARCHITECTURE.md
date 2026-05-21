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
| `src/core.js` | Core model constants, geometry helpers, and shared utilities. Still a catch-all; future splitting should extract well-defined domains from here. |
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
