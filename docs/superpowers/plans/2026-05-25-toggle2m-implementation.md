# Toggle 2M Sub-Mini Switch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Dailywell 2MS1 sub-miniature SPDT toggle switch as `toggle2m` component type, add `nutShape` (hex/circle) selector to all toggles, and improve toggle rendering to be more realistic for both nut shapes.

**Architecture:** New component definition in `componentDefinitions.js`, two new schema properties (`nutShape`, `switchFunction`) passed through `projectSchema.js`, improved Canvas rendering that branches on `nutShape`, and two new `<select>` fields in the component properties sidebar.

**Tech Stack:** Vanilla JS, React (createElement, no JSX), SVG in Canvas.js. No unit test framework — verify with `npm run check:syntax` (node --check) after each change, `npm run verify` at the end.

---

## File Map

| File | Change |
|---|---|
| `src/components/library/componentDefinitions.js` | Add `toggle2m` entry after `toggleSpdt` |
| `src/projectSchema.js` | Add `nutShape` + `switchFunction` in `createFromDef()` (line ~39) and `validateAndNormalize()` (line ~192) |
| `src/componentHelpers.js` | Add `toggle2m` to `defaultTopColor` toggle condition (line 29) |
| `src/Canvas.js` | Rewrite top-hardware block (~line 612) and front-view block (~line 1400): branch on `nutShape`, hex polygon, improved circle |
| `src/RightSidebarComponentProperties.js` | Add `isToggleLike` var + `nutShape` select (all toggles) + `switchFunction` select (toggle2m only) in "Top Hardware" section |

---

### Task 1: Add toggle2m component definition

**Files:**
- Modify: `src/components/library/componentDefinitions.js:96`

- [ ] **Step 1: Open the file and locate the end of the `toggleSpdt` entry**

  The `toggleSpdt` entry ends at line 96 with `},`. Insert the new entry immediately after it.

- [ ] **Step 2: Insert the toggle2m definition**

  After the closing `},` of `toggleSpdt` (line 96), insert:

  ```js
  {
    type: "toggle2m",
    name: "Dailywell 2MS1 SPDT Sub-Mini Toggle",
    holeDiameter: 4.83,
    frontDiameter: 9.0,
    rearBodyW: 5.0,
    rearBodyH: 8.0,
    rearDepth: 8.0,
    keepoutW: 7.0,
    keepoutH: 10.0,
    minSpacing: 1.5,
    switchFunction: "on-off-on",
    nutShape: "hex",
    manufacturer: "Dailywell",
    partNumber: "2MS1T1B1M2QES / 2M Series SPDT",
    category: "switch",
    verificationStatus: "datasheet",
    verification:
      "Dailywell 2M Sub-Miniature toggle switch. 2MS1T1B1M2QES datasheet: 10/48 UNS-2A bushing thread (#10 = 0.190\" = 4.83mm), bushing hex flat-to-flat 8.13mm (0.320\"), bushing OD 6.00mm (0.236\"), epoxy-sealed IP67, rear body/depth ~8.0mm from PC mounting side view, terminal pitch 2.54mm (0.100\"), 3 terminals SPDT. Switch function: 2MS1 = ON-NONE-ON (ON-OFF-ON) per datasheet switch function table; ON-ON 2-position variant also available in same physical package. Panel hole modeled as 4.83mm nominal thread OD; verify panel thickness, nut/washer stack before production.",
  },
  ```

- [ ] **Step 3: Verify syntax**

  ```bash
  npm run check:syntax
  ```

  Expected: no errors printed, exit 0.

- [ ] **Step 4: Commit**

  ```bash
  git add src/components/library/componentDefinitions.js
  git commit -m "feat(library): add Dailywell 2MS1 toggle2m sub-mini toggle definition"
  ```

---

### Task 2: Add nutShape + switchFunction to projectSchema.js

**Files:**
- Modify: `src/projectSchema.js:39` (createFromDef)
- Modify: `src/projectSchema.js:192` (validateAndNormalize)

The schema file has two parallel places where component properties are set:
- `createFromDef()` — used when placing a new component from the library
- `validateAndNormalize()` — used when loading a saved project (deserializing)

Both need `nutShape` and `switchFunction`.

- [ ] **Step 1: In `createFromDef()`, add after `topColor: def.topColor,` (line ~39)**

  ```js
  nutShape: def.nutShape === "hex" ? "hex" : "circle",
  switchFunction:
    typeof def.switchFunction === "string" ? def.switchFunction : "on-off-on",
  ```

- [ ] **Step 2: In `validateAndNormalize()`, add after `topColor: typeof r.topColor === "string" ? r.topColor : libMatch.topColor,` (line ~192)**

  ```js
  nutShape:
    r.nutShape === "hex" || r.nutShape === "circle"
      ? r.nutShape
      : (libMatch.nutShape ?? "circle"),
  switchFunction:
    r.switchFunction === "on-on" || r.switchFunction === "on-off-on"
      ? r.switchFunction
      : (libMatch.switchFunction ?? "on-off-on"),
  ```

- [ ] **Step 3: Verify syntax**

  ```bash
  npm run check:syntax
  ```

  Expected: exit 0, no errors.

- [ ] **Step 4: Commit**

  ```bash
  git add src/projectSchema.js
  git commit -m "feat(schema): add nutShape and switchFunction passthrough properties"
  ```

---

### Task 3: Add toggle2m to componentHelpers defaultTopColor

**Files:**
- Modify: `src/componentHelpers.js:29-36`

- [ ] **Step 1: In `defaultTopColor()`, find the toggle condition (line ~29) and add `toggle2m`**

  Current:
  ```js
  if (
    c.type === "toggle" ||
    c.type === "toggleSpdt" ||
    c.type === "toggleSplash" ||
    c.type === "slideSwitchMini" ||
    c.type === "slideSwitch8pos"
  )
    return "#f3f4f6";
  ```

  Replace with:
  ```js
  if (
    c.type === "toggle" ||
    c.type === "toggleSpdt" ||
    c.type === "toggle2m" ||
    c.type === "toggleSplash" ||
    c.type === "slideSwitchMini" ||
    c.type === "slideSwitch8pos"
  )
    return "#f3f4f6";
  ```

- [ ] **Step 2: Verify syntax**

  ```bash
  npm run check:syntax
  ```

  Expected: exit 0.

- [ ] **Step 3: Commit**

  ```bash
  git add src/componentHelpers.js
  git commit -m "feat(helpers): add toggle2m to defaultTopColor toggle check"
  ```

---

### Task 4: Rewrite toggle top-hardware render block in Canvas.js

**Files:**
- Modify: `src/Canvas.js:612-639`

This block draws the lightweight hardware overlay (shown on hover/select). Currently renders a circle + lever line. Replace with a version that branches on `nutShape`.

- [ ] **Step 1: Find and replace the top-hardware toggle block**

  Current block (lines 612–639):
  ```js
  if (c.type === "toggle" || c.type === "toggleSpdt") {
    return React.createElement(
      "g",
      {
        key: c.id,
        "data-top-hardware-id": c.id,
        transform: rot,
        opacity: hwOpacity,
      },
      React.createElement("circle", {
        cx: cx,
        cy: cy,
        r: c.frontDiameter / 2,
        fill: color,
        stroke: "rgba(0,0,0,0.55)",
        strokeWidth: 0.25,
      }),
      React.createElement("line", {
        x1: cx,
        y1: cy,
        x2: cx,
        y2: cy - 8,
        stroke: color,
        strokeWidth: 1.05,
        strokeLinecap: "round",
      }),
    );
  }
  ```

  Replace with:
  ```js
  if (
    c.type === "toggle" ||
    c.type === "toggleSpdt" ||
    c.type === "toggle2m"
  ) {
    const _nutShape = c.nutShape ?? (c.type === "toggle2m" ? "hex" : "circle");
    const _R = c.frontDiameter / 2;
    const _nutEl =
      _nutShape === "hex"
        ? React.createElement("polygon", {
            points: [0, 60, 120, 180, 240, 300]
              .map((deg) => {
                const rad = (deg * Math.PI) / 180;
                return `${cx + _R * Math.cos(rad)},${cy + _R * Math.sin(rad)}`;
              })
              .join(" "),
            fill: color,
            stroke: "rgba(0,0,0,0.55)",
            strokeWidth: 0.25,
          })
        : React.createElement("circle", {
            cx: cx,
            cy: cy,
            r: _R,
            fill: color,
            stroke: "rgba(0,0,0,0.55)",
            strokeWidth: 0.25,
          });
    return React.createElement(
      "g",
      {
        key: c.id,
        "data-top-hardware-id": c.id,
        transform: rot,
        opacity: hwOpacity,
      },
      _nutEl,
      React.createElement("line", {
        x1: cx,
        y1: cy,
        x2: cx,
        y2: cy - 8,
        stroke: color,
        strokeWidth: 1.05,
        strokeLinecap: "round",
      }),
    );
  }
  ```

- [ ] **Step 2: Verify syntax**

  ```bash
  npm run check:syntax
  ```

  Expected: exit 0.

- [ ] **Step 3: Commit**

  ```bash
  git add src/Canvas.js
  git commit -m "feat(canvas): add toggle2m to top-hardware render, hex/circle nutShape branch"
  ```

---

### Task 5: Rewrite toggle front-view render block in Canvas.js

**Files:**
- Modify: `src/Canvas.js:1400-1442`

This block draws the detailed production/front-view layer. Currently: two concentric circles + angled lever + ball. Replace with improved layered rendering for both hex and circle nut shapes.

- [ ] **Step 1: Find and replace the front-view toggle block**

  Current block (lines 1400–1442):
  ```js
  if (c.type === "toggle" || c.type === "toggleSpdt") {
    return React.createElement(
      "g",
      {
        key: c.id,
        "data-top-hardware-id": c.id,
        transform: rot,
        opacity: hwOpacity,
      },
      React.createElement("circle", {
        cx: cx,
        cy: cy,
        r: c.frontDiameter / 2 + 0.45,
        fill: "#f0f0ec",
        stroke: "#0b0b0b",
        strokeWidth: 0.18,
      }),
      React.createElement("circle", {
        cx: cx,
        cy: cy,
        r: c.frontDiameter / 2 - 0.35,
        fill: "#bfc5c8",
        stroke: "#ffffff",
        strokeWidth: 0.16,
      }),
      React.createElement("line", {
        x1: cx,
        y1: cy + 1.2,
        x2: cx + 2.1,
        y2: cy - 8.2,
        stroke: "#dce2e6",
        strokeWidth: 1.15,
        strokeLinecap: "round",
      }),
      React.createElement("circle", {
        cx: cx + 2.1,
        cy: cy - 8.2,
        r: 1.05,
        fill: "#dce2e6",
        stroke: "#f8f8f4",
        strokeWidth: 0.16,
      }),
    );
  }
  ```

  Replace with:
  ```js
  if (
    c.type === "toggle" ||
    c.type === "toggleSpdt" ||
    c.type === "toggle2m"
  ) {
    const _nutShape = c.nutShape ?? (c.type === "toggle2m" ? "hex" : "circle");
    const _R = c.frontDiameter / 2;
    const _holeR = c.holeDiameter / 2 + 0.5;
    const _leverX2 = cx + 2.1;
    const _leverY2 = cy - 7.5;
    const _leverLine = React.createElement("line", {
      x1: cx,
      y1: cy + 1.0,
      x2: _leverX2,
      y2: _leverY2,
      stroke: "#242422",
      strokeWidth: 1.1,
      strokeLinecap: "round",
    });
    const _ball = React.createElement("circle", {
      cx: _leverX2,
      cy: _leverY2,
      r: 1.0,
      fill: "#343432",
      stroke: "#565654",
      strokeWidth: 0.14,
    });
    const _hexPts = (r, startDeg) =>
      [0, 60, 120, 180, 240, 300]
        .map((d) => {
          const rad = ((d + startDeg) * Math.PI) / 180;
          return `${cx + r * Math.cos(rad)},${cy + r * Math.sin(rad)}`;
        })
        .join(" ");
    const _nutEls =
      _nutShape === "hex"
        ? [
            React.createElement("polygon", {
              key: "hex-outer",
              points: _hexPts(_R + 0.45, 0),
              fill: "#dddbd6",
              stroke: "#6a6860",
              strokeWidth: 0.22,
            }),
            React.createElement("polygon", {
              key: "hex-inner",
              points: _hexPts(_R - 0.45, 30),
              fill: "#eceae4",
              stroke: "none",
            }),
            React.createElement("circle", {
              key: "bushing",
              cx: cx,
              cy: cy,
              r: _holeR,
              fill: "#b4b8bc",
              stroke: "#888a88",
              strokeWidth: 0.15,
            }),
          ]
        : [
            React.createElement("circle", {
              key: "nut-outer",
              cx: cx,
              cy: cy,
              r: _R + 0.45,
              fill: "#e8eae4",
              stroke: "#484846",
              strokeWidth: 0.2,
            }),
            React.createElement("circle", {
              key: "nut-ring",
              cx: cx,
              cy: cy,
              r: _R - 0.5,
              fill: "#c8cac4",
              stroke: "#d8dad4",
              strokeWidth: 0.14,
            }),
            React.createElement("circle", {
              key: "bushing",
              cx: cx,
              cy: cy,
              r: _holeR,
              fill: "#a8acae",
              stroke: "#8a8e8e",
              strokeWidth: 0.12,
            }),
          ];
    return React.createElement(
      "g",
      {
        key: c.id,
        "data-top-hardware-id": c.id,
        transform: rot,
        opacity: hwOpacity,
      },
      ..._nutEls,
      _leverLine,
      _ball,
    );
  }
  ```

- [ ] **Step 2: Verify syntax**

  ```bash
  npm run check:syntax
  ```

  Expected: exit 0.

- [ ] **Step 3: Commit**

  ```bash
  git add src/Canvas.js
  git commit -m "feat(canvas): rewrite toggle front-view render — hex nut + improved circle, toggle2m support"
  ```

---

### Task 6: Add nutShape and switchFunction selectors to sidebar

**Files:**
- Modify: `src/RightSidebarComponentProperties.js:73` (add `isToggleLike`)
- Modify: `src/RightSidebarComponentProperties.js:505` (insert selectors in Top Hardware section)

- [ ] **Step 1: Add `isToggleLike` variable after `showColorControls` definition (line ~84)**

  After:
  ```js
  const showColorControls =
    category === "jack" ||
    category === "switch" ||
    category === "led" ||
    category === "fader" ||
    isJackLike(c) ||
    isButtonLike(c) ||
    isLedLike(c);
  ```

  Add:
  ```js
  const isToggleLike =
    c.type === "toggle" ||
    c.type === "toggleSpdt" ||
    c.type === "toggle2m";
  ```

- [ ] **Step 2: In the "Top Hardware" section, after the `topHardwareVisible` checkbox (line ~523), insert the nut shape and switch function selectors**

  Locate the block:
  ```js
  React.createElement(
    "label",
    { style: { display: "flex", alignItems: "center", gap: 6 } },
    React.createElement("input", {
      type: "checkbox",
      checked: c.topHardwareVisible !== false,
      onChange: (e) => patch({ topHardwareVisible: e.target.checked }),
    }),
    "Show visual hardware only",
  ),
  ```

  Immediately after that closing `,`, add:
  ```js
  isToggleLike &&
    React.createElement(
      "div",
      { className: "field-row" },
      React.createElement("label", null, "Nut shape"),
      React.createElement(
        "select",
        {
          value: c.nutShape ?? (c.type === "toggle2m" ? "hex" : "circle"),
          onChange: (e) => patch({ nutShape: e.target.value }),
        },
        React.createElement("option", { value: "circle" }, "Circle"),
        React.createElement("option", { value: "hex" }, "Hex"),
      ),
    ),
  c.type === "toggle2m" &&
    React.createElement(
      "div",
      { className: "field-row" },
      React.createElement("label", null, "Switch function"),
      React.createElement(
        "select",
        {
          value: c.switchFunction ?? "on-off-on",
          onChange: (e) => patch({ switchFunction: e.target.value }),
        },
        React.createElement("option", { value: "on-on" }, "ON-ON"),
        React.createElement("option", { value: "on-off-on" }, "ON-OFF-ON"),
      ),
    ),
  ```

- [ ] **Step 3: Verify syntax**

  ```bash
  npm run check:syntax
  ```

  Expected: exit 0.

- [ ] **Step 4: Commit**

  ```bash
  git add src/RightSidebarComponentProperties.js
  git commit -m "feat(sidebar): add nutShape selector (all toggles) and switchFunction selector (toggle2m)"
  ```

---

### Task 7: Full verification

- [ ] **Step 1: Run full verify**

  ```bash
  npm run verify
  ```

  Expected: format check passes, syntax check passes, screenshot captured without errors.

- [ ] **Step 2: Start dev server and open in browser**

  ```bash
  npm run dev
  ```

  Open `http://localhost:4173`.

- [ ] **Step 3: Manual checks**

  - [ ] Add a `toggle2m` component from the library — it appears in the canvas with a hex nut + lever
  - [ ] Select the component → "Top Hardware" section in the right sidebar shows "Nut shape: Hex" and "Switch function: ON-OFF-ON"
  - [ ] Change Nut shape to "Circle" → canvas updates to circle rendering
  - [ ] Change back to "Hex" → hex rendering returns
  - [ ] Change Switch function to "ON-ON" → no crash (no visual change expected)
  - [ ] Add a `toggleSpdt` component → renders with the improved circle style (3 concentric circles + lever + ball)
  - [ ] Select `toggleSpdt` → sidebar shows "Nut shape: Circle"; change to "Hex" → renders hex nut
  - [ ] Save project as JSON, reload → `nutShape` and `switchFunction` values persist

- [ ] **Step 4: Final commit if any format fixes needed**

  ```bash
  npm run format
  git add -p
  git commit -m "style: format toggle2m sidebar and canvas changes"
  ```
