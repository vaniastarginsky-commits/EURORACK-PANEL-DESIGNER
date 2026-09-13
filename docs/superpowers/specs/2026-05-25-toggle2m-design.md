# Design: Dailywell 2MS1 Sub-Mini Toggle + Improved Toggle Rendering

Date: 2026-05-25  
Rev: 2 (expanded scope — hex/circle nut selector + realistic render for all toggles)

## Summary

1. Add `toggle2m` component type (Dailywell 2MS1T1B1M2QES sub-miniature SPDT toggle).
2. Add `nutShape: "hex" | "circle"` per-instance property to all toggle types.
3. Rewrite the toggle render in `Canvas.js` to use the nutShape property — more realistic visuals for both variants.

Existing `toggle` and `toggleSpdt` get improved rendering and the new nutShape selector. `toggle2m` defaults to hex; existing types default to circle (backward-compatible).

---

## 1. Component Definition (`componentDefinitions.js`)

New entry:

```js
{
  type: "toggle2m",
  name: "Dailywell 2MS1 SPDT Sub-Mini Toggle",
  holeDiameter: 4.83,        // 10/48 UNS-2A thread (#10 = 0.190" = 4.83mm nominal OD)
  frontDiameter: 9.0,        // hex nut: 8.13mm flats → circumradius 4.7mm → ~9.4mm corners
  rearBodyW: 5.0,
  rearBodyH: 8.0,
  rearDepth: 8.0,
  keepoutW: 7.0,
  keepoutH: 10.0,
  minSpacing: 1.5,
  switchFunction: "on-off-on",  // default; user-overridable in sidebar
  nutShape: "hex",              // default for 2M series (visible hex nut from front)
  manufacturer: "Dailywell",
  partNumber: "2MS1T1B1M2QES / 2M Series SPDT",
  category: "switch",
  verificationStatus: "datasheet",
  verification:
    "Dailywell 2M Sub-Miniature toggle switch. 2MS1T1B1M2QES datasheet: 10/48 UNS-2A bushing thread (#10 = 0.190\" = 4.83mm), bushing hex flat-to-flat 8.13mm (0.320\"), bushing OD 6.00mm (0.236\"), epoxy-sealed IP67, rear body/depth ~8.0mm from PC mounting side view, terminal pitch 2.54mm (0.100\"), 3 terminals SPDT. Switch function: 2MS1 = ON-NONE-ON (ON-OFF-ON) per datasheet switch function table; ON-ON 2-position variant also available in same physical package. Panel hole modeled as 4.83mm nominal thread OD; verify panel thickness, nut/washer stack before production.",
}
```

---

## 2. nutShape Property

**Schema (`projectSchema.js`)** — add in both `createFromDef()` and `validateAndNormalize()`:

```js
// createFromDef:
nutShape: def.nutShape ?? "circle",
switchFunction: def.switchFunction ?? "on-off-on",

// validateAndNormalize:
nutShape: typeof r.nutShape === "string" ? r.nutShape : libMatch.nutShape ?? "circle",
switchFunction: typeof r.switchFunction === "string"
  ? r.switchFunction
  : libMatch.switchFunction ?? "on-off-on",
```

Valid `nutShape` values: `"hex"` | `"circle"`.
Valid `switchFunction` values: `"on-on"` | `"on-off-on"`.

Defaults:
- `toggle2m`: nutShape `"hex"`, switchFunction `"on-off-on"`
- `toggle` / `toggleSpdt`: nutShape `"circle"` (backward-compatible)

---

## 3. Rendering (`Canvas.js`)

### Toggle type helper

Both render blocks (top-hardware ~line 612, front-view ~line 1400) currently check:
```js
c.type === "toggle" || c.type === "toggleSpdt"
```

Change to a shared helper check (or inline):
```js
c.type === "toggle" || c.type === "toggleSpdt" || c.type === "toggle2m"
```

Then branch on `c.nutShape` inside the block.

### Hex nut visual (`nutShape === "hex"`)

Geometry: circumradius `R = c.frontDiameter / 2` (= 4.5 for toggle2m's 9.0mm), flat-top orientation (angles 0°, 60°, 120°, 180°, 240°, 300°).

Layers (back to front):
1. **Outer hex polygon** — the nut body  
   fill `"#dddbd6"`, stroke `"#6a6860"`, strokeWidth `0.22`
2. **Inner hex polygon** at `R - 0.9` — highlight facet, flat-bottom variant (rotated 30°, angles 30°, 90°, 150°, 210°, 270°, 330°) to create a subtle inner shadow/bevel effect  
   fill `"#eceae4"`, stroke `"none"`
3. **Center bushing circle** radius `c.holeDiameter / 2 + 0.5` (≈3.0mm for toggle2m)  
   fill `"#b4b8bc"`, stroke `"#888a88"`, strokeWidth `0.15`
4. **Lever line** from `(cx, cy+1.0)` to `(cx+2.1, cy-7.5)`  
   stroke `"#242422"`, strokeWidth `1.1`, strokeLinecap `"round"`
5. **Ball tip** circle at lever end, radius `1.0`  
   fill `"#343432"`, stroke `"#565654"`, strokeWidth `0.14`

### Circle nut visual (`nutShape === "circle"`)  ← improved version for all existing toggles

Layers:
1. **Outer circle** radius `c.frontDiameter / 2 + 0.4`  
   fill `"#e8eae4"`, stroke `"#484846"`, strokeWidth `0.2`
2. **Nut ring** radius `c.frontDiameter / 2 - 0.5`  
   fill `"#c8cac4"`, stroke `"#d8dad4"`, strokeWidth `0.14`
3. **Bushing hole circle** radius `c.holeDiameter / 2 + 0.5`  
   fill `"#a8acae"`, stroke `"#8a8e8e"`, strokeWidth `0.12`
4. **Lever line** and **ball tip** — same as hex variant

### Top hardware layer (line ~612)

Same toggle type check. Simplified version (hitbox + lighter visualization):
- Hex: polygon outline only, fill `color` with opacity 0.6
- Circle: circle, fill `color`, same as before  
- Lever line (same as current `cy - 8`)

---

## 4. Sidebar (`RightSidebarComponentProperties.js`)

Two new selectors shown for toggle types (`c.category === "switch"` AND toggle type):

**Nut shape selector** (shown for `toggle`, `toggleSpdt`, `toggle2m`):
```
Nut shape:  [ Circle ▾ ]  /  [ Hex ▾ ]
              Circle
              Hex
```

**Switch function selector** (shown only for `toggle2m`):
```
Switch function:  [ ON-OFF-ON ▾ ]
                    ON-ON
                    ON-OFF-ON
```

Both patch the component instance via the existing `patch()` mechanism.

---

## 5. Type Helper (`componentHelpers.js`)

Add `"toggle2m"` to the existing `isToggle`-style check at line ~30.

---

## Files Changed

| File | Change |
|---|---|
| `src/components/library/componentDefinitions.js` | Add `toggle2m` entry |
| `src/Canvas.js` | Rewrite both toggle render blocks: hex/circle branch, improved visuals |
| `src/componentHelpers.js` | Add `toggle2m` to toggle type check |
| `src/projectSchema.js` | Add `nutShape` + `switchFunction` passthrough in 2 places each |
| `src/RightSidebarComponentProperties.js` | Add nutShape select (all toggles) + switchFunction select (toggle2m only) |

---

## Out of Scope

- No change to `toggle`/`toggleSpdt` physical dimensions (holeDiameter, frontDiameter etc.)
- No visual distinction in rendering between ON-ON and ON-OFF-ON states
- No SVG `<defs>`/`<linearGradient>` — shading via layered flat shapes only
