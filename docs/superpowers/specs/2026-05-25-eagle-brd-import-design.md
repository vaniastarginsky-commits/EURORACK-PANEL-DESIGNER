# Eagle .brd Import — Design Spec
**Date:** 2026-05-25

## Summary

Add Eagle 6+ XML `.brd` import to the Eurorack Panel Designer, mirroring the existing KiCad PCB import feature. The user selects a `.brd` file; all current components/text/artwork are replaced by the positions and types extracted from the Eagle board file.

---

## Scope

- **In:** Eagle 6+ XML `.brd` files (the standard format since Eagle 6.0 and Autodesk Fusion 360 Electronics)
- **Out:** Eagle 5 legacy binary format, `.sch` schematics, `.lbr` libraries, Altium, OrCAD, Gerber

---

## File Format Notes

Eagle 6+ `.brd` files are well-formed XML:

```xml
<eagle version="9.x">
 <drawing>
  <board>
   <plain>
    <!-- Layer 20 = Dimension (board outline) -->
    <wire x1="0" y1="0" x2="100.33" y2="0" width="0" layer="20"/>
    ...
   </plain>
   <elements>
    <element name="J1" library="eurorack" package="THONKICONN"
             x="10.5" y="60.0" rot="R0"/>
    <element name="RV1" library="eurorack" package="ALPHA-9MM"
             x="25.0" y="40.0" rot="R270"/>
   </elements>
  </board>
 </drawing>
</eagle>
```

Key fields per `<element>`:
- `name` — reference designator (J1, RV1, SW3, …)
- `package` — footprint name (used for component type matching)
- `library` — source library name (secondary matching hint)
- `x`, `y` — position in mm; **Eagle origin is bottom-left, Y increases upward**
- `rot` — rotation string: `R0`, `R90`, `R180`, `R270`; mirrored variants `MR0` … `MR270` (mirror flag ignored for front-panel purposes)

Board outline: Layer 20 `<wire>` elements inside `<plain>`. Build bounding box from all endpoint coordinates.

---

## Architecture

### New file: `src/export/eagleImport.js`

Public API:
```js
parseEagleBrdToPanel(xmlSrc, currentPanelWidthMM)
// → { components[], panelWidthMM, boardOutline, warnings[] }
```

Return shape is **identical** to `parseKiCadPcbToPanel` so App.js dispatch path reuses `LOAD_KICAD_IMPORT` action (same reducer, same semantics).

Internal functions:

| Function | Purpose |
|---|---|
| `parseBoardOutline(doc)` | Query all `wire[layer="20"]` → bounding box `{x,y,width,height}` |
| `parseEagleRotation(rotStr)` | `"R270"` → `270`, `"MR90"` → `90`, `""` → `0` |
| `bestLibraryPartForEagle(name, pkg, lib)` | Package/name → COMPONENT_LIBRARY entry (see table below) |
| `parseEagleBrdToPanel(xmlSrc, widthMM)` | Top-level orchestrator |

**Coordinate transform:**
```
panelX = (elementX - boardMinX) + xOffset
panelY = (boardMaxY - elementY) + yOffset
```
Y is flipped because Eagle Y increases upward, panel Y increases downward. `boardMaxY - elementY` gives distance from the top of the board, regardless of board origin. `boardMinX`/`boardMaxY` come from the Layer-20 bounding box (or from element positions if no outline).

Same HP-rounding and centering logic as KiCad import (`roundKiCadPanelWidthToEurorackHP` is defined in `kiCadImport.js` — duplicate the small function or inline it in `eagleImport.js`; no shared module needed).

### Package → component library mapping

| Package pattern (case-insensitive) | Mapped type |
|---|---|
| `THONKICONN`, `PJ398SM`, `3.5MM-JACK`, `WQP-PJ398SM`, `JACK.*3.5` | `jack` |
| `SLIM.*JACK`, `CLIFF.*FC68`, `REAN.*NYS`, `.*JACK.*6.35` | `slimjack` |
| `ALPHA-9MM`, `RD901F`, `9MM.*POT`, `RV09` | `pot9mm` |
| `ALPHA-16MM`, `RD901F.*16`, `16MM.*POT`, `RV16` | `pot16mm` |
| `EC12`, `PEC11`, `ENCODER.*12`, `ROTARY.*ENC` | `encoder` |
| `LED.*3MM`, `3MM.*LED` | `led3mm` |
| `LED.*5MM`, `5MM.*LED`, `TACT.*LED`, `THONK.*SW.*LP.*LED` | `tactled` |
| `TACT.*6MM`, `6MM.*TACT`, `FSM.*SWITCH`, `SW.*PUSH.*6` | `tact6mm` |
| `MOMENTARY.*12`, `SW.*PUSH.*12`, `D6.*SWITCH` | `momentary12` |
| `TOGGLE`, `SPDT`, `DPDT`, `SUB.*MINI` | `toggle` (or `subMiniSwitch`) |
| `ROTARY.*8`, `ROTARY.*12`, `WAFER` | `rotary8pos` |
| `DIP-8`, `SOCKET.*8`, `DIODE.*SOCKET` | `dip8socket` |
| `FADER.*45`, `RA.*SLIDE.*45` | `fader45` |
| `FADER.*35`, `RA.*SLIDE.*35` | `fader35` |
| `FADER.*20.*LED` | `fader20led` |
| `FADER.*20`, `SLIDE.*POT` | `fader20` |
| `TRIMMER`, `TRIM.*6` | `trimmer6mm` |
| fallback | custom component with hole diameter estimated from name/ref prefix |

Name/ref prefix fallbacks (same as KiCad): `^J` → jack, `^RV/^POT` → pot9mm, `^D/^LED` → led3mm, `^SW/^S` → tact6mm, `^ENC` → encoder.

### Changes to `src/App.js`

```js
const eagleBrdInputRef = useRef(null);

function requestEagleBrdImport() {
  const input = eagleBrdInputRef.current || document.getElementById("eagle-brd-file-input");
  if (!input) { setAutosaveStatus("Eagle .brd file input unavailable"); return; }
  input.value = "";
  input.click();
}

function onEagleBrdImport(e) {
  // identical flow to onKiCadPcbImport:
  // read file → parseEagleBrdToPanel → confirm if project has data
  // → dispatch LOAD_KICAD_IMPORT (same action) → toast
  // Confirm dialog title: "Import Eagle .brd"
  // Confirm text: "Import Eagle"
}
```

Hidden input in render:
```js
React.createElement("input", {
  ref: eagleBrdInputRef,
  id: "eagle-brd-file-input",
  type: "file",
  accept: ".brd",
  style: { display: "none" },
  onChange: onEagleBrdImport,
})
```

App command:
```js
{ id: "import-eagle-brd", label: "Import Eagle .brd…", run: () => requestEagleBrdImport() }
```

Pass `onRequestEagleBrdImport: requestEagleBrdImport` into Topbar props (alongside existing `onRequestKiCadPcbImport`).

### Changes to `src/Topbar.js`

Add `onRequestEagleBrdImport` to the props destructured from `topbarProps` and pass it through to `TopbarMenus`.

### Changes to `src/TopbarMenus.js`

Add `onRequestEagleBrdImport` prop. In the File menu, add button **after** "Import KiCad PCB...":

```js
React.createElement(
  "button",
  { onClick: () => { onClose(); onRequestEagleBrdImport(); } },
  "Import Eagle .brd..."
)
```

---

## Warnings & error handling

| Condition | Warning / behaviour |
|---|---|
| No `<elements>` found or all filtered | `alert("Eagle import found no components.\n…")` |
| No Layer-20 outline | Warning: "No Dimension (Layer 20) outline found. Components were centered on the current panel." |
| Board height > 128.5 mm | Warning: "Board outline height X mm exceeds Eurorack 3U panel height." |
| Width rounded to HP | Warning: "Board width X mm = Y HP; rounded to Z HP." |
| Unknown package (fell to custom) | Per-component note in `comp.notes` |
| XML parse failure (DOMParser returns error doc) | `alert("Eagle .brd file could not be parsed. Is this a valid Eagle 6+ XML file?")` |

---

## Reducer

No new reducer action needed. `LOAD_KICAD_IMPORT` already accepts `{components, panelWidthMM, boardOutline}` and replaces the layout. Eagle import produces the same shape.

---

## Not in scope

- Mirror/flip support for `MRx` rotation variants (panel parts are symmetric or user-adjustable after import)
- Parsing Eagle schematics (`.sch`) or libraries (`.lbr`)
- SMD-only footprints without panel relevance
- Undo history across import (same limitation as KiCad import)
