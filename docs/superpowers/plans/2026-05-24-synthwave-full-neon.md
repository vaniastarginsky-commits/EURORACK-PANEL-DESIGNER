# Synthwave Full Neon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Synthwave preset look dramatically distinct — purple radial canvas gradient, scanlines overlay, neon brand glow, panel drop-shadow, active-button glow — all controllable via a new Glow toggle in the Appearance modal.

**Architecture:** `ThemeEngine.apply()` sets `root.dataset.preset` and `root.dataset.glow` alongside the existing `root.dataset.style`. CSS uses `[data-preset="synthwave"]` and `[data-preset="synthwave"][data-glow="on"]` compound selectors to scope effects. Three existing `!important` declarations are removed to allow clean override without adding new ones.

**Tech Stack:** Vanilla JS (ThemeEngine, AppearanceModal), minified CSS (styles.css). No build step — files are served directly via `npm run dev` (`python3 -m http.server 4173`).

---

## Files

- Modify: `src/ThemeEngine.js` — add `defaultGlow` to presets, thread `glow` through `load/apply/save/reset`
- Modify: `src/AppearanceModal.js` — add `glow` to state, add Glow segmented control to `buildBody()`
- Modify: `styles.css` — remove 3 `!important` declarations, add Synthwave section at end

---

### Task 1: ThemeEngine — `defaultGlow` field + `data-preset` / `data-glow` attributes

**Files:**
- Modify: `src/ThemeEngine.js`

- [ ] **Step 1: Add `defaultGlow` to every preset**

In `src/ThemeEngine.js`, add `defaultGlow: false` to `industrial`, `minimal`, `retro`, `light` and `defaultGlow: true` to `synthwave`. Each preset block already has `label`, `swatchBg`, `swatchAccent`, `defaultStyle`, `vars`. Add directly after `defaultStyle`:

```js
// industrial:
defaultGlow: false,

// minimal:
defaultGlow: false,

// retro:
defaultGlow: false,

// light:
defaultGlow: false,

// synthwave:
defaultGlow: true,
```

- [ ] **Step 2: Update `load()` to return `glow`**

Current `load()` returns `{ preset, style, overrides }`. Change to:

```js
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { preset: DEFAULT_PRESET, style: null, overrides: {}, glow: false };
    const p = JSON.parse(raw);
    if (!p.preset || !PRESETS[p.preset])
      return { preset: DEFAULT_PRESET, style: null, overrides: {}, glow: false };
    const defaultGlow = PRESETS[p.preset].defaultGlow ?? false;
    return {
      preset: p.preset,
      style: p.style || null,
      overrides: p.overrides || {},
      glow: p.glow != null ? p.glow : defaultGlow,
    };
  } catch {
    return { preset: DEFAULT_PRESET, style: null, overrides: {}, glow: false };
  }
}
```

- [ ] **Step 3: Update `apply()` to set `data-preset` and `data-glow`**

Current signature: `apply(presetKey, style, overrides)`. New signature adds `glow`:

```js
function apply(presetKey, style, overrides, glow) {
  const preset = PRESETS[presetKey] || PRESETS[DEFAULT_PRESET];
  const resolvedStyle = style || preset.defaultStyle || "flat";
  const resolvedGlow = glow != null ? glow : (preset.defaultGlow ?? false);

  const merged = Object.assign({}, preset.vars, overrides);

  if (resolvedStyle === "bordered") {
    const base = Number(merged["--theme-border-opacity"] || 0.13);
    merged["--ui-line"] =
      "rgba(var(--ui-line-rgb)," + (base * 2).toFixed(2) + ")";
    merged["--ui-line-soft"] =
      "rgba(var(--ui-line-rgb)," + (base * 1.4).toFixed(2) + ")";
    merged["--ui-line-strong"] =
      "rgba(var(--ui-line-rgb)," + (base * 3).toFixed(2) + ")";
  }

  for (const [k, v] of Object.entries(merged)) {
    root.style.setProperty(k, v);
  }

  root.dataset.style = resolvedStyle;
  root.dataset.preset = presetKey;
  root.dataset.glow = resolvedGlow ? "on" : "off";
}
```

- [ ] **Step 4: Update `save()` to accept and persist `glow`**

```js
function save(presetKey, style, overrides, glow) {
  apply(presetKey, style, overrides, glow);
  localStorage.setItem(
    KEY,
    JSON.stringify({ preset: presetKey, style, overrides, glow }),
  );
}
```

- [ ] **Step 5: Update `reset()` to clear glow**

```js
function reset() {
  save(DEFAULT_PRESET, null, {}, false);
}
```

- [ ] **Step 6: Update `window.ThemeEngine` export and initial apply**

The initial `apply` call at the bottom reads from `load()`. Update it:

```js
const initial = load();
apply(initial.preset, initial.style, initial.overrides, initial.glow);
```

The export already lists `load`, `apply`, `save`, `reset` — no change needed to the export object itself, but verify it includes all five names.

- [ ] **Step 7: Check syntax**

```bash
node --check src/ThemeEngine.js
```

Expected: no output (no errors).

- [ ] **Step 8: Commit**

```bash
git add src/ThemeEngine.js
git commit -m "feat: ThemeEngine — data-preset/data-glow attrs, defaultGlow per preset, glow in load/save/apply/reset"
```

---

### Task 2: AppearanceModal — Glow toggle

**Files:**
- Modify: `src/AppearanceModal.js`

- [ ] **Step 1: Add `glow` to modal state**

The `state` variable is declared as `let state = null; // { preset, style, overrides }`. Update the comment and every place `state` is initialised:

In `open()`:
```js
function open() {
  state = window.ThemeEngine.load(); // now returns { preset, style, overrides, glow }
  const b = ensureBackdrop();
  const oldBody = b.querySelector(".appearance-modal-body");
  if (oldBody) oldBody.replaceWith(buildBody());
  b.style.display = "";
}
```
(No code change needed here — `ThemeEngine.load()` already returns `glow` after Task 1.)

In the preset card click handler (inside `buildPresetCards()`), reset glow to preset default when switching presets:

```js
btn.addEventListener("click", () => {
  state.preset = key;
  state.style = null;
  state.overrides = {};
  state.glow = window.ThemeEngine.PRESETS[key].defaultGlow ?? false;
  applyAndSave();
  refreshUI();
});
```

- [ ] **Step 2: Update `applyAndSave()` to pass `glow`**

```js
function applyAndSave() {
  window.ThemeEngine.save(state.preset, state.style, state.overrides, state.glow);
}
```

- [ ] **Step 3: Add `getActiveGlow()` getter**

Add after `getActiveStyle()`:

```js
function getActiveGlow() {
  return state.glow ?? (window.ThemeEngine.PRESETS[state.preset]?.defaultGlow ?? false);
}
```

- [ ] **Step 4: Add Glow section to `buildBody()`**

Add at the end of `buildBody()`, just before `return body`, only when the current preset has `defaultGlow: true`:

```js
const preset = window.ThemeEngine.PRESETS[state.preset];
if (preset && preset.defaultGlow) {
  const glowSection = document.createElement("div");
  const glowLabel = document.createElement("span");
  glowLabel.className = "appearance-section-label";
  glowLabel.textContent = "Glow Effects";
  glowSection.appendChild(glowLabel);
  glowSection.appendChild(
    buildSegControl(
      [{ label: "Off", value: false }, { label: "On", value: true }],
      () => getActiveGlow(),
      (v) => { state.glow = v; },
    ),
  );
  body.appendChild(glowSection);
}
```

Note: `buildSegControl` compares `getValue() === value`. Since `false === false` and `true === true`, boolean values work correctly here.

- [ ] **Step 5: Update reset handler to clear glow**

In `ensureBackdrop()`, the reset button handler:

```js
resetBtn.addEventListener("click", () => {
  window.ThemeEngine.reset();
  state = window.ThemeEngine.load();
  refreshUI();
});
```

This already works — `ThemeEngine.reset()` resets to industrial with `glow: false`, and `load()` returns the reset state. No change needed.

- [ ] **Step 6: Check syntax**

```bash
node --check src/AppearanceModal.js
```

Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add src/AppearanceModal.js
git commit -m "feat: AppearanceModal — glow state, Glow Effects toggle for presets with defaultGlow"
```

---

### Task 3: styles.css — remove `!important` from `text-shadow:none`

**Files:**
- Modify: `styles.css`

Context: Line 2 contains a giant minified block. Near its start is `*,*::before,*::after{border-radius:var(--theme-radius)!important;text-shadow:none!important}`. The `text-shadow:none!important` prevents `[data-preset="synthwave"] .app-title { text-shadow: ... }` from working.

- [ ] **Step 1: Remove the `!important` from `text-shadow:none` in the `*` rule**

Use Python to make the targeted replacement on line 2:

```python
import re

with open("styles.css", "r") as f:
    css = f.read()

# Target: text-shadow:none!important inside *,*::before,*::after{...}
# Replace only this one occurrence
old = "text-shadow:none!important"
new = "text-shadow:none"

count = css.count(old)
print(f"Found {count} occurrence(s) of '{old}'")

if count == 1:
    css = css.replace(old, new, 1)
    with open("styles.css", "w") as f:
        f.write(css)
    print("Done.")
elif count == 0:
    print("Not found — check manually.")
else:
    print(f"Multiple occurrences — check manually before editing.")
```

Run: `python3 -c "<paste above>"`

Expected output: `Found 1 occurrence(s)` then `Done.`

- [ ] **Step 2: Verify syntax**

```bash
npm run format:check && npm run check:syntax
```

Expected: passes (or only formatting warnings, not errors).

- [ ] **Step 3: Commit**

```bash
git add styles.css
git commit -m "css: remove !important from text-shadow:none in * reset rule — enables synthwave brand glow"
```

---

### Task 4: styles.css — remove `!important` from `canvas-wrap::after` block

**Files:**
- Modify: `styles.css`

Context: Lines 1826-1832 inside `@media(min-width:901px)`:
```css
.canvas-wrap::after,
.canvas-area::after,
.editor-center::after,
.stage-wrap::after{
  display:none!important;
  content:none!important;
}
```
Without `!important`, `[data-preset="synthwave"] .canvas-wrap::after` (higher specificity) can set `display:block; content:''` cleanly.

- [ ] **Step 1: Read the exact current content of lines 1826–1832**

```bash
sed -n '1826,1832p' styles.css
```

Expected:
```
  .canvas-wrap::after,
  .canvas-area::after,
  .editor-center::after,
  .stage-wrap::after{
    display:none!important;
    content:none!important;
  }
```

- [ ] **Step 2: Remove the `!important` from both declarations**

```python
with open("styles.css", "r") as f:
    lines = f.readlines()

# Lines are 1-indexed; Python list is 0-indexed
for i in [1829, 1830]:  # lines 1830 and 1831
    lines[i] = lines[i].replace("!important", "")

with open("styles.css", "w") as f:
    f.writelines(lines)

print("Done.")
```

Run: `python3 -c "<paste above>"`

Then verify:
```bash
sed -n '1826,1832p' styles.css
```

Expected (no `!important`):
```
  .canvas-wrap::after,
  .canvas-area::after,
  .editor-center::after,
  .stage-wrap::after{
    display:none;
    content:none;
  }
```

- [ ] **Step 3: Commit**

```bash
git add styles.css
git commit -m "css: remove !important from canvas-wrap::after display/content — enables synthwave gradient overlay"
```

---

### Task 5: styles.css — remove `!important` from `button.active` box-shadow

**Files:**
- Modify: `styles.css`

Context: In the minified line 2 block, `button.active,...{...box-shadow:inset 0 -1px 0 rgba(var(--ui-gold-rgb),.36)!important}`. This prevents the synthwave `[data-preset="synthwave"][data-glow="on"] button.active { box-shadow: ... }` from working.

- [ ] **Step 1: Count occurrences and remove the target `!important`**

```python
import re

with open("styles.css", "r") as f:
    css = f.read()

# The specific declaration to de-!important
old = "box-shadow:inset 0 -1px 0 rgba(var(--ui-gold-rgb),.36)!important"
new = "box-shadow:inset 0 -1px 0 rgba(var(--ui-gold-rgb),.36)"

count = css.count(old)
print(f"Found {count} occurrence(s)")

if count == 1:
    css = css.replace(old, new, 1)
    with open("styles.css", "w") as f:
        f.write(css)
    print("Done.")
else:
    print("Unexpected count — inspect manually.")
```

Run: `python3 -c "<paste above>"`

Expected: `Found 1 occurrence(s)` → `Done.`

- [ ] **Step 2: Commit**

```bash
git add styles.css
git commit -m "css: remove !important from button.active box-shadow — enables synthwave active-button glow"
```

---

### Task 6: styles.css — add Synthwave section

**Files:**
- Modify: `styles.css`

- [ ] **Step 1: Append the Synthwave CSS block to the end of `styles.css`**

```python
synthwave_css = """
/* === Synthwave preset atmosphere ========================================= */

[data-preset="synthwave"] .canvas-wrap {
  background: var(--ui-bg);
}

[data-preset="synthwave"] .canvas-wrap::after {
  content: '';
  display: block;
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,.10) 3px, rgba(0,0,0,.10) 4px),
    radial-gradient(ellipse at 50% 55%, rgba(160,40,220,.75) 0%, rgba(100,10,180,.50) 25%, rgba(40,5,80,.28) 55%, transparent 75%);
}

[data-preset="synthwave"] .canvas-wrap > div:first-child {
  z-index: 1;
  filter: drop-shadow(0 0 18px rgba(120,30,200,.45));
}

[data-preset="synthwave"][data-glow="on"] .app-title {
  text-shadow: 0 0 14px rgba(200,60,220,.9), 0 0 28px rgba(160,40,220,.5);
}

[data-preset="synthwave"][data-glow="on"] button.active,
[data-preset="synthwave"][data-glow="on"] .canvas-tool-btn.active {
  box-shadow: 0 0 10px rgba(var(--ui-gold-rgb),.55), 0 0 20px rgba(var(--ui-gold-rgb),.25);
}
"""

with open("styles.css", "a") as f:
    f.write(synthwave_css)

print("Done.")
```

Run: `python3 -c "<paste above>"`

- [ ] **Step 2: Verify the block was appended**

```bash
tail -30 styles.css
```

Expected: see the `/* === Synthwave preset atmosphere */` block.

- [ ] **Step 3: Commit**

```bash
git add styles.css
git commit -m "css: add [data-preset=synthwave] atmosphere rules — canvas gradient, scanlines, brand glow, active-button glow"
```

---

### Task 7: Verify

**Files:** none (read-only verification)

- [ ] **Step 1: Run `npm run verify`**

```bash
npm run verify
```

Expected:
- Prettier format check: passes
- Syntax check: passes
- Screenshots: all pass (Industrial preset screenshots unchanged)

If screenshots fail for non-Synthwave presets: check that the `!important` removals didn't change existing computed styles. The three removed `!important` declarations should not alter non-Synthwave rendering since:
- `text-shadow:none` (without `!important`) still wins over any `*` baseline since no legacy text-shadow rules exist in the codebase for those elements
- `canvas-wrap::after { display:none }` still wins for non-Synthwave presets (no competing rule)
- `button.active { box-shadow: inset ... }` still wins for non-Synthwave presets (no competing rule)

- [ ] **Step 2: Visual check in browser**

```bash
npm run dev
# Open http://localhost:4173
```

1. Open Appearance modal (topbar → Appearance button or Help menu → Appearance)
2. Select Synthwave preset
3. Verify: canvas shows purple radial gradient + scanlines behind the panel
4. Verify: brand name has pink/purple glow
5. Verify: canvas panel has subtle purple drop-shadow
6. Toggle Glow Effects → Off: glow on brand and buttons disappears; gradient stays
7. Toggle Glow Effects → On: glow returns
8. Switch to Industrial preset: canvas is black (#000 → var(--ui-bg) is now used, but --ui-bg for Industrial is #020202 ≈ same); no gradient; no glow
9. Reset to default: Industrial, no glow

- [ ] **Step 3: Final commit if any fixes needed**

If visual check requires CSS tweaks, edit `styles.css` Synthwave section, re-run `npm run verify`, commit fixes.

- [ ] **Step 4: Update UX polish memory**

In `/Users/weedhash/.claude/projects/-Users-weedhash-Documents-EURORACK-PANEL-DESIGNER/memory/project_ux_polish.md`, add session 18 entry:

```
**Session 18 (2026-05-24) — Synthwave Full Neon:**
73. Synthwave preset: canvas radial gradient + scanlines via canvas-wrap::after; panel drop-shadow; brand glow (text-shadow); active-button glow (box-shadow). Glow toggle in Appearance modal. 3 !important removed (text-shadow in *, canvas-wrap::after display/content, button.active box-shadow). data-preset + data-glow attrs on root. (ThemeEngine.js, AppearanceModal.js, styles.css)
```
