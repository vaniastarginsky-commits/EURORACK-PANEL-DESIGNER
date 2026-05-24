# Accent Color Strip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a rainbow hue gradient strip to the Appearance modal that lets users pick a custom accent color, overriding the preset's default gold/accent.

**Architecture:** ThemeEngine gains `accentHue` state (null = preset default, 0-359 = custom). A new `hslToRgb()` helper derives all four gold CSS vars from the chosen hue. AppearanceModal renders the strip with a draggable cursor. CSS adds two new classes scoped to `.appearance-accent-*`.

**Tech Stack:** Vanilla JS (IIFE pattern), CSS custom properties, no new dependencies.

---

## File Map

| File | Change |
|---|---|
| `src/ThemeEngine.js` | Add `hslToRgb()`, extend `apply/load/save/reset` to carry `accentHue`, derive `--ui-gold-soft` dynamically |
| `src/AppearanceModal.js` | Add `buildAccentStrip()`, add Accent section to `buildBody()`, thread `accentHue` through `state` and `applyAndSave()` |
| `styles.css` | Add `.appearance-accent-row`, `.appearance-accent-strip`, `.appearance-accent-cursor` after the existing `@media` appearance block |

---

## Task 1: ThemeEngine — hslToRgb helper + accentHue derivation in apply()

**Files:**
- Modify: `src/ThemeEngine.js` (inside the IIFE, before `apply()`)

- [ ] **Step 1: Add hslToRgb() function** — insert right before the `function load()` line:

```js
  function hslToRgb(h, s, l) {
    s /= 100;
    l /= 100;
    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) =>
      l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [
      Math.round(f(0) * 255),
      Math.round(f(8) * 255),
      Math.round(f(4) * 255),
    ];
  }
```

- [ ] **Step 2: Extend apply() signature** — change the function signature from:

```js
  function apply(presetKey, style, overrides, glow) {
```

to:

```js
  function apply(presetKey, style, overrides, glow, accentHue) {
```

- [ ] **Step 3: Add accentHue derivation + ui-gold-soft fix** — inside `apply()`, after the `if (resolvedStyle === "bordered")` block and before the `for (const [k, v] of Object.entries(merged))` loop, add:

```js
    if (accentHue != null) {
      const isLight = presetKey === "light";
      const [s1, l1] = isLight ? [60, 38] : [78, 58];
      const [s2, l2] = isLight ? [65, 48] : [83, 67];
      const [s3, l3] = isLight ? [50, 28] : [68, 45];
      const [r, g, b] = hslToRgb(accentHue, s1, l1);
      const [r2, g2, b2] = hslToRgb(accentHue, s2, l2);
      const [ra, ga, ba] = hslToRgb(accentHue, s3, l3);
      merged["--ui-gold"] = `rgb(${r},${g},${b})`;
      merged["--ui-gold-2"] = `rgb(${r2},${g2},${b2})`;
      merged["--ui-gold-rgb"] = `${r},${g},${b}`;
      merged["--ui-gold-alt-rgb"] = `${ra},${ga},${ba}`;
    }

    const goldRgb = merged["--ui-gold-rgb"];
    if (goldRgb) {
      merged["--ui-gold-soft"] = `rgba(${goldRgb},.13)`;
    }
```

- [ ] **Step 4: Verify apply() structure** — read `src/ThemeEngine.js` lines 237–270 and confirm the new code sits between the bordered block and the `for` loop. The full apply() should look like:

```js
  function apply(presetKey, style, overrides, glow, accentHue) {
    const preset = PRESETS[presetKey] || PRESETS[DEFAULT_PRESET];
    const resolvedStyle = style || preset.defaultStyle || "flat";
    const resolvedGlow = glow != null ? glow : (preset.defaultGlow ?? false);
    const merged = Object.assign({}, preset.vars, overrides);

    if (resolvedStyle === "bordered") {
      // ... existing bordered block ...
    }

    if (accentHue != null) {
      // ... new accentHue block ...
    }

    const goldRgb = merged["--ui-gold-rgb"];
    if (goldRgb) {
      merged["--ui-gold-soft"] = `rgba(${goldRgb},.13)`;
    }

    for (const [k, v] of Object.entries(merged)) {
      root.style.setProperty(k, v);
    }

    root.dataset.style = resolvedStyle;
    root.dataset.preset = presetKey;
    root.dataset.glow = resolvedGlow ? "on" : "off";
  }
```

- [ ] **Step 5: Quick console smoke-test** — open the app in browser, open DevTools console, run:

```js
const [r,g,b] = window.ThemeEngine ? (() => {
  // Test hslToRgb indirectly: switch to industrial, pick hue=210 and check gold
  console.log('ThemeEngine exists:', !!window.ThemeEngine);
})() : ['no ThemeEngine'];
```

Expected: "ThemeEngine exists: true" (no errors).

---

## Task 2: ThemeEngine — accentHue in load / save / reset + startup apply()

**Files:**
- Modify: `src/ThemeEngine.js`

- [ ] **Step 1: Extend load()** — in the `load()` function, both return paths need `accentHue`. Change the three `return` statements:

The first fallback return (when `!raw`):
```js
      return { preset: DEFAULT_PRESET, style: null, overrides: {}, glow: false, accentHue: null };
```

The second fallback return (when `!p.preset`):
```js
      return { preset: DEFAULT_PRESET, style: null, overrides: {}, glow: false, accentHue: null };
```

The main return:
```js
      return {
        preset: p.preset,
        style: p.style || null,
        overrides: p.overrides || {},
        glow: p.glow != null ? p.glow : defaultGlow,
        accentHue: p.accentHue != null ? p.accentHue : null,
      };
```

The catch return:
```js
      return { preset: DEFAULT_PRESET, style: null, overrides: {}, glow: false, accentHue: null };
```

- [ ] **Step 2: Extend save()** — change signature and body:

```js
  function save(presetKey, style, overrides, glow, accentHue) {
    apply(presetKey, style, overrides, glow, accentHue);
    localStorage.setItem(
      KEY,
      JSON.stringify({ preset: presetKey, style, overrides, glow, accentHue }),
    );
  }
```

- [ ] **Step 3: Extend reset()** — add `null` accentHue:

```js
  function reset() {
    save(DEFAULT_PRESET, null, {}, false, null);
  }
```

- [ ] **Step 4: Fix startup apply() call** — near the bottom of the IIFE, the `apply(initial.preset, ...)` call must pass `initial.accentHue`:

```js
  apply(initial.preset, initial.style, initial.overrides, initial.glow, initial.accentHue);
```

- [ ] **Step 5: Run prettier** — format only ThemeEngine.js:

```bash
npx prettier --write src/ThemeEngine.js
```

- [ ] **Step 6: Commit Task 1+2**

```bash
git add src/ThemeEngine.js
git commit -m "feat(theme): add accentHue support — hslToRgb, derive gold vars, persist in load/save"
```

---

## Task 3: AppearanceModal — buildAccentStrip()

**Files:**
- Modify: `src/AppearanceModal.js`

- [ ] **Step 1: Update applyAndSave()** — add `state.accentHue` as 5th arg:

```js
  function applyAndSave() {
    window.ThemeEngine.save(
      state.preset,
      state.style,
      state.overrides,
      state.glow,
      state.accentHue ?? null,
    );
  }
```

- [ ] **Step 2: Add buildAccentStrip() function** — insert the complete function between `buildSegControl()` and `buildBody()`:

```js
  function buildAccentStrip() {
    const section = document.createElement("div");

    const label = document.createElement("span");
    label.className = "appearance-section-label";
    label.textContent = "Accent";
    section.appendChild(label);

    const row = document.createElement("div");
    row.className = "appearance-accent-row";

    const strip = document.createElement("div");
    strip.className = "appearance-accent-strip";

    const cursor = document.createElement("div");
    cursor.className = "appearance-accent-cursor";
    if (state.accentHue != null) {
      cursor.style.left = `${(state.accentHue / 360) * 100}%`;
    } else {
      cursor.style.display = "none";
    }
    strip.appendChild(cursor);

    function pickHue(e) {
      const rect = strip.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      state.accentHue = Math.round((x / rect.width) * 360) % 360;
      applyAndSave();
      refreshUI();
    }

    strip.addEventListener("mousedown", (e) => {
      e.preventDefault();
      pickHue(e);
      const onMove = (ev) => pickHue(ev);
      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    });

    const defaultBtn = document.createElement("button");
    defaultBtn.type = "button";
    defaultBtn.className =
      "toolbar-menu-trigger" + (state.accentHue == null ? " active" : "");
    defaultBtn.style.cssText = "font-size:11px;min-height:unset;padding:3px 8px";
    defaultBtn.textContent = "Default";
    defaultBtn.addEventListener("click", () => {
      state.accentHue = null;
      applyAndSave();
      refreshUI();
    });

    row.appendChild(strip);
    row.appendChild(defaultBtn);
    section.appendChild(row);

    return section;
  }
```

- [ ] **Step 3: Add Accent section to buildBody()** — inside `buildBody()`, after the presets section and before the Shape section, add:

```js
    // Accent
    body.appendChild(buildAccentStrip());
```

The body order should be: Preset → Accent → Shape → Font → Density → Visual Style → Glow.

- [ ] **Step 4: Run prettier** — format AppearanceModal.js:

```bash
npx prettier --write src/AppearanceModal.js
```

- [ ] **Step 5: Smoke-test in browser** — open app, open Appearance modal (gear icon → Appearance). Confirm:
  - Accent section appears between Presets and Shape
  - Default button shows as active (no cursor on strip)
  - Clicking strip moves cursor to click position
  - Dragging along strip smoothly changes accent color in real time
  - Default button returns accent to preset default
  - Reloading page preserves selected accent hue

- [ ] **Step 6: Commit**

```bash
git add src/AppearanceModal.js
git commit -m "feat(appearance): add accent color strip with hue picker"
```

---

## Task 4: CSS — appearance-accent-* classes

**Files:**
- Modify: `styles.css`

- [ ] **Step 1: Inject CSS before the Synthwave comment** — use Python to insert the new rules at the right position:

```python
content = open('styles.css').read()
new_css = """
.appearance-accent-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.appearance-accent-strip {
  flex: 1;
  height: 14px;
  border-radius: 7px;
  background: linear-gradient(to right,
    hsl(0,78%,58%),hsl(20,78%,58%),hsl(40,78%,58%),hsl(60,78%,58%),
    hsl(80,78%,58%),hsl(100,78%,58%),hsl(120,78%,58%),hsl(140,78%,58%),
    hsl(160,78%,58%),hsl(180,78%,58%),hsl(200,78%,58%),hsl(220,78%,58%),
    hsl(240,78%,58%),hsl(260,78%,58%),hsl(280,78%,58%),hsl(300,78%,58%),
    hsl(320,78%,58%),hsl(340,78%,58%),hsl(360,78%,58%)
  );
  position: relative;
  cursor: crosshair;
}
.appearance-accent-cursor {
  position: absolute;
  top: 50%;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,.9);
  transform: translate(-50%, -50%);
  box-shadow: 0 1px 4px rgba(0,0,0,.7);
  pointer-events: none;
}

"""
target = '/* === Synthwave preset atmosphere'
content = content.replace(target, new_css + target, 1)
open('styles.css', 'w').write(content)
print('Done')
```

Run from project root:
```bash
python3 -c "
content = open('styles.css').read()
new_css = '''
.appearance-accent-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.appearance-accent-strip {
  flex: 1;
  height: 14px;
  border-radius: 7px;
  background: linear-gradient(to right,
    hsl(0,78%,58%),hsl(20,78%,58%),hsl(40,78%,58%),hsl(60,78%,58%),
    hsl(80,78%,58%),hsl(100,78%,58%),hsl(120,78%,58%),hsl(140,78%,58%),
    hsl(160,78%,58%),hsl(180,78%,58%),hsl(200,78%,58%),hsl(220,78%,58%),
    hsl(240,78%,58%),hsl(260,78%,58%),hsl(280,78%,58%),hsl(300,78%,58%),
    hsl(320,78%,58%),hsl(340,78%,58%),hsl(360,78%,58%)
  );
  position: relative;
  cursor: crosshair;
}
.appearance-accent-cursor {
  position: absolute;
  top: 50%;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,.9);
  transform: translate(-50%, -50%);
  box-shadow: 0 1px 4px rgba(0,0,0,.7);
  pointer-events: none;
}

'''
target = '/* === Synthwave preset atmosphere'
content = content.replace(target, new_css + target, 1)
open('styles.css', 'w').write(content)
print('Done')
"
```

- [ ] **Step 2: Verify no new !important** — check the added lines:

```bash
python3 -c "
import re
content = open('styles.css').read()
idx = content.find('.appearance-accent-row')
chunk = content[idx:idx+700]
print('Has !important:', '!important' in chunk)
print(chunk)
"
```

Expected: `Has !important: False`

- [ ] **Step 3: Run npm run verify** — confirm prettier and syntax checks pass (screenshot test timeout is pre-existing, ignore):

```bash
npm run verify 2>&1 | grep -E "(prettier|syntax|All matched)" | head -10
```

Expected output includes: `All matched files use Prettier code style!`

- [ ] **Step 4: Commit**

```bash
git add styles.css
git commit -m "css: add appearance-accent-strip and cursor styles"
```

---

## Self-Review

**Spec coverage:**
- [x] Rainbow gradient strip in AppearanceModal → Task 3 + Task 4
- [x] Drag/click to pick hue → Task 3 step 2 (pickHue + mousedown+mousemove)
- [x] ThemeEngine derives gold vars from hue → Task 1 step 3
- [x] Light preset uses different sat/lit formula → Task 1 step 3 (`isLight` branch)
- [x] `accentHue` persists across reload → Task 2 (load/save with localStorage)
- [x] Default button resets accent → Task 3 step 2 (defaultBtn click handler)
- [x] `--ui-gold-soft` fixed (no longer hardcoded industrial gold) → Task 1 step 3

**Placeholder scan:** No TBDs found. All code blocks are complete.

**Type consistency:**
- `accentHue: null | number` — consistent across Task 1/2/3
- `hslToRgb(h, s, l)` defined in Task 1 step 1, used in Task 1 step 3 — consistent
- `buildAccentStrip()` defined and called — consistent
- `applyAndSave()` updated in Task 3 step 1, called inside buildAccentStrip — consistent
- `state.accentHue` read in buildAccentStrip (Task 3), state loaded from ThemeEngine.load() which returns `accentHue` (Task 2) — consistent
