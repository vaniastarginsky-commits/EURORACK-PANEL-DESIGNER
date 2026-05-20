# Design: core.js Phase 2 refactor

## Context

After Phase 1 (waves 1–4), `core.js` is 132 lines but line 2 is a 70KB minified blob containing everything that wasn't extracted yet: constants, DFM_PROFILES, `COMPONENT_LIBRARY` data, utility functions, `appReducer`, React context/hooks, and storage helpers.

Line-based awk extraction doesn't work here because everything is on one line. Phase 2 uses a **character-offset extraction** approach: a small Node.js script reads the line, finds a target token, counts nested brackets to find its end, and splits the file.

## Approach: two more waves

### Wave 5 — `src/componentLibrary.js`

Extract `const COMPONENT_LIBRARY=[...]` from core.js line 2 into its own file. This is pure JSON-like data — no function calls, no dependencies. It's the largest single object in the line.

**Why first:** `COMPONENT_LIBRARY` is referenced by `projectSchema.js`, `exportEngine.js`, and `componentHelpers.js`. Moving it first lets us establish the data layer.

**Load order after wave 5:**
```
componentLibrary.js   (pure data, no deps)
componentHelpers.js   (no deps)
core.js               (now smaller)
projectSchema.js      (needs COMPONENT_LIBRARY from componentLibrary.js)
exportEngine.js       (needs COMPONENT_LIBRARY from componentLibrary.js)
...
```

**Extraction technique:** Node.js script that finds `const COMPONENT_LIBRARY=[` in the line, then counts `[` and `]` characters to find the matching close, handles strings to avoid counting brackets inside string values.

### Wave 6 — `src/appState.js`

Extract the React app state infrastructure from core.js line 2:
- `const AppStateContext = createContext(...)`
- `const AppDispatchContext = createContext(...)`
- `function appReducer(state, action) { ... }`
- `function AppProvider({ children }) { ... }`
- `const useAppState = () => useContext(AppStateContext)`
- `const useAppDispatch = () => useContext(AppDispatchContext)`

**Why:** These are the state layer — separating them from constants and utilities gives core.js a clear final role (utilities and boot only).

**Dependencies:** React globals (already global via CDN). The reducer references action type strings but no other modules. Context hooks are pure React.

**Load order after wave 6:**
```
componentLibrary.js  (pure data)
componentHelpers.js  (no deps)
core.js              (constants, utilities, DFM_PROFILES, storage helpers, boot)
appState.js          (needs React globals from CDN)
projectSchema.js     (needs COMPONENT_LIBRARY, core utilities)
exportEngine.js      (needs COMPONENT_LIBRARY, projectSchema, core utilities)
NativeDialogs.js
...
canvasOverlays.js    (needs appState context hooks)
...
```

## What core.js contains after both waves

- CDN guard + React destructuring
- Constants: `HP_TO_MM`, `PANEL_HEIGHT_MM`, `MOUNTING_HOLE_*`, `MAX_UNDO`, `STANDARD_HP`, `DEFAULT_EXPORT_OPTIONS`, `DFM_PROFILES`
- Utility functions: `defaultSnapSettings`, `panelWidthMM`, `snapToGrid`, `computeWarnings`, `degToRad`, `getManufacturingIssues`, `manufacturingReportText`, `loadLocalProjects`, `saveLocalProject`, `autosaveProject`, `serializeProject`, `safeProjectFileName`, `downloadTextFile`, `downloadBlobFile`, `normalizeMountingHoleConfig`, `defaultLayerVisibility`, and other helpers
- Boot/autosave initialization
- Migration trail comments

## Out of scope

- App.js (105KB, 3 minified lines, one giant function — different task)
- Topbar.js / CanvasToolRail.js cleanup (separate task)
