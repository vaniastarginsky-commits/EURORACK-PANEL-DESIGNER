# Appearance Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an Appearance settings modal that lets users switch between 5 preset themes (Industrial, Minimal, Retro, Light, Synthwave) and independently tweak Shape, Font, Density, and Visual Style. All settings persist in localStorage and apply instantly via CSS custom properties.

**Architecture:** ThemeEngine.js (IIFE, global) manages state and applies CSS vars to `document.documentElement.style`. AppearanceModal.js (IIFE, lazy DOM) renders the picker UI. Both follow the ViewContrast.js pattern already in the project.

**Tech Stack:** Vanilla JS (no React), CSS custom properties, localStorage, `window.dispatchEvent` for decoupled wiring.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `styles.css` | Modify | Add `--theme-*` vars to `:root`; swap border-radius and font rules; add glass CSS block |
| `src/ThemeEngine.js` | Create | PRESETS data, `apply()`, `save()`, `load()`, `reset()`, boot on load |
| `src/AppearanceModal.js` | Create | Modal DOM, preset cards, segmented controls, wired to ThemeEngine |
| `src/appCommands.js` | Modify | Add `openAppearance()` command |
| `src/Topbar.js` | Modify | Add Appearance button (desktop only) |
| `src/TopbarMenus.js` | Modify | Add Appearance button in HelpMenuContent |
| `index.html` | Modify | Add `<script>` tags for ThemeEngine and AppearanceModal |

---

## Task 1: CSS Foundation

**Files:**
- Modify: `styles.css`

### Context

`styles.css` is a minified single-line file. Edit with Python string replacement — do NOT use sed line-numbers.

Current `:root` ends with: `--ui-hi-rgb:238,231,218}`

Current border-radius rule: `*,*::before,*::after{border-radius:0!important;text-shadow:none!important}`

Current body font rule (in the minified block starting line 2): `body{font-family:Inter,"SF Pro Text",system-ui,-apple-system,BlinkMacSystemFont,sans-serif!important}`

- [ ] **Step 1: Add `--theme-*` vars to `:root` and fix border-radius + font rules**

Run this Python script from the project root:

```python
with open('styles.css', 'r') as f:
    css = f.read()

# 1. Add --theme-* vars to end of :root block
css = css.replace(
    '--ui-hi-rgb:238,231,218}',
    '--ui-hi-rgb:238,231,218;'
    '--theme-radius:0px;'
    '--theme-font:Inter,"SF Pro Text",system-ui,sans-serif;'
    '--theme-tracking:0.14em;'
    '--theme-weight-brand:850;'
    '--theme-btn-height:32px;'
    '--theme-section-gap:8px;'
    '--theme-surface-blur:0px;'
    '--theme-surface-sat:1;'
    '--theme-border-opacity:0.13}'
)

# 2. Make border-radius theme-controlled
css = css.replace(
    '*,*::before,*::after{border-radius:0!important;',
    '*,*::before,*::after{border-radius:var(--theme-radius)!important;'
)

# 3. Make body font theme-controlled
css = css.replace(
    'body{font-family:Inter,"SF Pro Text",system-ui,-apple-system,BlinkMacSystemFont,sans-serif!important}',
    'body{font-family:var(--theme-font)!important}'
)

with open('styles.css', 'w') as f:
    f.write(css)

print("Done. Verify the replacements:")
import re
# Check :root has --theme-radius
assert '--theme-radius:0px' in css, "FAIL: --theme-radius missing from :root"
# Check border-radius uses var
assert 'border-radius:var(--theme-radius)!important' in css, "FAIL: border-radius not updated"
# Check body font uses var
assert 'body{font-family:var(--theme-font)!important}' in css, "FAIL: body font not updated"
print("All assertions passed.")
```

Run: `python3 fix_css.py` (save script first, then delete it after)

Expected output: `All assertions passed.`

- [ ] **Step 2: Append Glass style CSS block at end of styles.css**

Append this CSS to the END of `styles.css` (new lines after the last `}`):

```css
html[data-style="glass"] .sidebar-left,
html[data-style="glass"] .sidebar-right {
  background: rgba(8,8,6,.60);
  backdrop-filter: blur(var(--theme-surface-blur)) saturate(var(--theme-surface-sat));
  -webkit-backdrop-filter: blur(var(--theme-surface-blur)) saturate(var(--theme-surface-sat));
}
html[data-style="glass"] .toolbar,
html[data-style="glass"] .top-toolbar,
html[data-style="glass"] .mobile-topbar {
  background: rgba(4,4,3,.72);
  backdrop-filter: blur(var(--theme-surface-blur)) saturate(var(--theme-surface-sat));
  -webkit-backdrop-filter: blur(var(--theme-surface-blur)) saturate(var(--theme-surface-sat));
}
.appearance-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100001;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0,0,0,.50);
  backdrop-filter: blur(6px) saturate(.72) brightness(.72);
  -webkit-backdrop-filter: blur(6px) saturate(.72) brightness(.72);
}
.appearance-modal-card {
  width: min(540px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  background: linear-gradient(135deg,rgba(11,11,10,.97),rgba(4,4,4,.97));
  border: 1px solid rgba(var(--ui-line-rgb),.20);
  box-shadow: 0 20px 58px rgba(0,0,0,.62);
  padding: 0;
}
.appearance-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 15px;
  border-bottom: 1px solid rgba(var(--ui-line-rgb),.12);
  background: rgba(12,12,10,.70);
}
.appearance-modal-title {
  color: #e8ddc9;
  font-size: 13px;
  font-weight: 850;
  letter-spacing: .16em;
  text-transform: uppercase;
}
.appearance-modal-body {
  padding: 14px 15px;
  display: grid;
  gap: 16px;
}
.appearance-section-label {
  display: block;
  color: rgba(var(--ui-gold-rgb),.85);
  font-size: 10px;
  font-weight: 760;
  letter-spacing: .18em;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.appearance-preset-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}
.appearance-preset-btn {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 0;
  overflow: hidden;
  border: 1px solid rgba(var(--ui-line-rgb),.14) !important;
  background: transparent !important;
  cursor: pointer;
  min-height: unset !important;
}
.appearance-preset-btn.active {
  border-color: rgba(var(--ui-gold-rgb),.70) !important;
  box-shadow: 0 0 0 1px rgba(var(--ui-gold-rgb),.30) !important;
}
.appearance-preset-swatch {
  height: 40px;
  display: flex;
  align-items: flex-end;
  padding: 4px;
}
.appearance-preset-swatch-accent {
  width: 100%;
  height: 3px;
}
.appearance-preset-label {
  padding: 5px 6px;
  font-size: 10px;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: #b0a898;
  border-top: 1px solid rgba(var(--ui-line-rgb),.10);
  background: rgba(10,10,9,.60);
  text-align: center;
}
.appearance-preset-btn.active .appearance-preset-label {
  color: #e8ddc9;
}
.appearance-seg {
  display: flex;
  gap: 0;
  border: 1px solid rgba(var(--ui-line-rgb),.14);
  background: rgba(4,4,3,.60);
}
.appearance-seg button {
  flex: 1;
  padding: 6px 4px;
  font-size: 11px;
  letter-spacing: .06em;
  color: #928b7d;
  background: transparent !important;
  border: 0 !important;
  border-right: 1px solid rgba(var(--ui-line-rgb),.12) !important;
  min-height: unset !important;
}
.appearance-seg button:last-child {
  border-right: 0 !important;
}
.appearance-seg button.active {
  background: rgba(28,22,13,.82) !important;
  color: #f1e4cd;
  border-bottom: 0 !important;
  box-shadow: none !important;
}
.appearance-modal-footer {
  padding: 10px 15px;
  border-top: 1px solid rgba(var(--ui-line-rgb),.10);
  display: flex;
  justify-content: flex-end;
}
@media (max-width: 560px) {
  .appearance-preset-grid { grid-template-columns: repeat(3, 1fr); }
  .appearance-modal-card { width: 100%; max-height: calc(100vh - 20px); }
}
```

- [ ] **Step 3: Verify syntax**

```bash
npm run format:check && npm run check:syntax
```

Expected: no errors. (Format check may flag the appended unminified CSS — if so, that is OK since styles.css is not in the prettier scope. If it fails on styles.css, check `prettier --write styles.css` is not needed — styles.css is minified by design and excluded from formatting.)

- [ ] **Step 4: Commit**

```bash
git add styles.css
git commit -m "css: add --theme-* vars, glass style block, appearance modal CSS"
```

---

## Task 2: ThemeEngine.js

**Files:**
- Create: `src/ThemeEngine.js`

- [ ] **Step 1: Create ThemeEngine.js**

Create `src/ThemeEngine.js` with this exact content:

```js
(function () {
  "use strict";

  const KEY = "panel-designer:appearance";
  const DEFAULT_PRESET = "industrial";
  const root = document.documentElement;

  const PRESETS = {
    industrial: {
      label: "Industrial",
      swatchBg: "#020202",
      swatchAccent: "rgb(214,170,88)",
      defaultStyle: "flat",
      vars: {
        "--ui-bg": "#020202",
        "--ui-bg-2": "#050505",
        "--ui-panel": "#080807",
        "--ui-panel-2": "#0d0c0a",
        "--ui-surface": "#11100e",
        "--ui-surface-hover": "#15130f",
        "--ui-text": "#eee7da",
        "--ui-text-soft": "#d8d0c0",
        "--ui-muted": "#928b7d",
        "--ui-gold": "#bd8c3f",
        "--ui-gold-2": "#d6aa58",
        "--ui-gold-rgb": "214,170,88",
        "--ui-gold-alt-rgb": "201,154,74",
        "--ui-line-rgb": "215,196,155",
        "--theme-radius": "0px",
        "--theme-font": 'Inter,"SF Pro Text",system-ui,sans-serif',
        "--theme-tracking": "0.14em",
        "--theme-weight-brand": "850",
        "--theme-btn-height": "32px",
        "--theme-section-gap": "8px",
        "--theme-surface-blur": "0px",
        "--theme-surface-sat": "1",
        "--theme-border-opacity": "0.13",
      },
    },
    minimal: {
      label: "Minimal",
      swatchBg: "#0a0a0a",
      swatchAccent: "rgb(180,180,180)",
      defaultStyle: "flat",
      vars: {
        "--ui-bg": "#0a0a0a",
        "--ui-bg-2": "#0e0e0e",
        "--ui-panel": "#111111",
        "--ui-panel-2": "#151515",
        "--ui-surface": "#1a1a1a",
        "--ui-surface-hover": "#1f1f1f",
        "--ui-text": "#e0e0e0",
        "--ui-text-soft": "#c0c0c0",
        "--ui-muted": "#808080",
        "--ui-gold": "#b0b0b0",
        "--ui-gold-2": "#c8c8c8",
        "--ui-gold-rgb": "180,180,180",
        "--ui-gold-alt-rgb": "160,160,160",
        "--ui-line-rgb": "180,180,180",
        "--theme-radius": "3px",
        "--theme-font": 'Inter,"SF Pro Text",system-ui,sans-serif',
        "--theme-tracking": "0.08em",
        "--theme-weight-brand": "700",
        "--theme-btn-height": "30px",
        "--theme-section-gap": "6px",
        "--theme-surface-blur": "0px",
        "--theme-surface-sat": "1",
        "--theme-border-opacity": "0.13",
      },
    },
    retro: {
      label: "Retro",
      swatchBg: "#050800",
      swatchAccent: "rgb(80,230,100)",
      defaultStyle: "flat",
      vars: {
        "--ui-bg": "#050800",
        "--ui-bg-2": "#080b00",
        "--ui-panel": "#0b0f01",
        "--ui-panel-2": "#0e1302",
        "--ui-surface": "#121802",
        "--ui-surface-hover": "#161d03",
        "--ui-text": "#c8f0a0",
        "--ui-text-soft": "#a0c880",
        "--ui-muted": "#608040",
        "--ui-gold": "#50e664",
        "--ui-gold-2": "#70f080",
        "--ui-gold-rgb": "80,230,100",
        "--ui-gold-alt-rgb": "60,200,80",
        "--ui-line-rgb": "80,200,80",
        "--theme-radius": "0px",
        "--theme-font": 'ui-monospace,"Fira Code","Cascadia Code",monospace',
        "--theme-tracking": "0.04em",
        "--theme-weight-brand": "700",
        "--theme-btn-height": "32px",
        "--theme-section-gap": "8px",
        "--theme-surface-blur": "0px",
        "--theme-surface-sat": "1",
        "--theme-border-opacity": "0.20",
      },
    },
    light: {
      label: "Light",
      swatchBg: "#f2f0ec",
      swatchAccent: "rgb(160,100,30)",
      defaultStyle: "flat",
      vars: {
        "--ui-bg": "#f2f0ec",
        "--ui-bg-2": "#ede9e3",
        "--ui-panel": "#e8e4dc",
        "--ui-panel-2": "#e2ddd5",
        "--ui-surface": "#dddad2",
        "--ui-surface-hover": "#d8d4cc",
        "--ui-text": "#1a1916",
        "--ui-text-soft": "#3a3730",
        "--ui-muted": "#7a7368",
        "--ui-gold": "#a0641e",
        "--ui-gold-2": "#b87828",
        "--ui-gold-rgb": "160,100,30",
        "--ui-gold-alt-rgb": "140,80,20",
        "--ui-line-rgb": "80,70,55",
        "--theme-radius": "3px",
        "--theme-font": 'Inter,"SF Pro Text",system-ui,sans-serif',
        "--theme-tracking": "0.12em",
        "--theme-weight-brand": "800",
        "--theme-btn-height": "32px",
        "--theme-section-gap": "8px",
        "--theme-surface-blur": "0px",
        "--theme-surface-sat": "1",
        "--theme-border-opacity": "0.16",
      },
    },
    synthwave: {
      label: "Synthwave",
      swatchBg: "#08010f",
      swatchAccent: "rgb(200,60,220)",
      defaultStyle: "glass",
      vars: {
        "--ui-bg": "#08010f",
        "--ui-bg-2": "#0d0218",
        "--ui-panel": "#120220",
        "--ui-panel-2": "#180328",
        "--ui-surface": "#1e0430",
        "--ui-surface-hover": "#240538",
        "--ui-text": "#f0d8ff",
        "--ui-text-soft": "#d0b8e8",
        "--ui-muted": "#9070a8",
        "--ui-gold": "#c83cdc",
        "--ui-gold-2": "#e060f8",
        "--ui-gold-rgb": "200,60,220",
        "--ui-gold-alt-rgb": "160,40,180",
        "--ui-line-rgb": "180,80,220",
        "--theme-radius": "4px",
        "--theme-font": 'Inter,"SF Pro Text",system-ui,sans-serif',
        "--theme-tracking": "0.14em",
        "--theme-weight-brand": "850",
        "--theme-btn-height": "32px",
        "--theme-section-gap": "8px",
        "--theme-surface-blur": "6px",
        "--theme-surface-sat": "0.85",
        "--theme-border-opacity": "0.18",
      },
    },
  };

  const SHAPE_OPTIONS = [
    { label: "Sharp", value: "0px" },
    { label: "Soft", value: "3px" },
    { label: "Rounded", value: "8px" },
    { label: "Pill", value: "20px" },
  ];

  const FONT_OPTIONS = [
    { label: "Inter", value: 'Inter,"SF Pro Text",system-ui,sans-serif' },
    { label: "Mono", value: 'ui-monospace,"Fira Code","Cascadia Code",monospace' },
    { label: "System", value: "system-ui,-apple-system,BlinkMacSystemFont,sans-serif" },
  ];

  const DENSITY_OPTIONS = [
    { label: "Compact", value: "28px" },
    { label: "Default", value: "32px" },
    { label: "Comfortable", value: "38px" },
  ];

  const STYLE_OPTIONS = [
    { label: "Flat", value: "flat" },
    { label: "Bordered", value: "bordered" },
    { label: "Glass", value: "glass" },
  ];

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { preset: DEFAULT_PRESET, style: null, overrides: {} };
      const p = JSON.parse(raw);
      if (!p.preset || !PRESETS[p.preset])
        return { preset: DEFAULT_PRESET, style: null, overrides: {} };
      return {
        preset: p.preset,
        style: p.style || null,
        overrides: p.overrides || {},
      };
    } catch {
      return { preset: DEFAULT_PRESET, style: null, overrides: {} };
    }
  }

  function apply(presetKey, style, overrides) {
    const preset = PRESETS[presetKey] || PRESETS[DEFAULT_PRESET];
    const resolvedStyle = style || preset.defaultStyle || "flat";

    const merged = Object.assign({}, preset.vars, overrides);

    if (resolvedStyle === "bordered") {
      merged["--ui-line"] =
        "rgba(var(--ui-line-rgb)," + (Number(merged["--theme-border-opacity"] || 0.13) * 2).toFixed(2) + ")";
      merged["--ui-line-soft"] =
        "rgba(var(--ui-line-rgb)," + (Number(merged["--theme-border-opacity"] || 0.13) * 1.4).toFixed(2) + ")";
      merged["--ui-line-strong"] =
        "rgba(var(--ui-line-rgb)," + (Number(merged["--theme-border-opacity"] || 0.13) * 3).toFixed(2) + ")";
    }

    for (const [k, v] of Object.entries(merged)) {
      root.style.setProperty(k, v);
    }

    root.dataset.style = resolvedStyle;
  }

  function save(presetKey, style, overrides) {
    apply(presetKey, style, overrides);
    localStorage.setItem(
      KEY,
      JSON.stringify({ preset: presetKey, style, overrides }),
    );
  }

  function reset() {
    save(DEFAULT_PRESET, null, {});
  }

  window.ThemeEngine = {
    PRESETS,
    SHAPE_OPTIONS,
    FONT_OPTIONS,
    DENSITY_OPTIONS,
    STYLE_OPTIONS,
    DEFAULT_PRESET,
    load,
    apply,
    save,
    reset,
  };

  window.addEventListener("panel-designer:open-appearance", () => {
    window.AppearanceModal?.open();
  });

  const initial = load();
  apply(initial.preset, initial.style, initial.overrides);
})();
```

- [ ] **Step 2: Verify syntax**

```bash
node --check src/ThemeEngine.js
```

Expected: no output (means syntax OK).

- [ ] **Step 3: Commit**

```bash
git add src/ThemeEngine.js
git commit -m "feat: ThemeEngine — PRESETS, apply/save/load/reset, CSS var injection"
```

---

## Task 3: AppearanceModal.js

**Files:**
- Create: `src/AppearanceModal.js`

- [ ] **Step 1: Create AppearanceModal.js**

Create `src/AppearanceModal.js`:

```js
(function () {
  "use strict";

  let backdrop = null;
  let state = null; // { preset, style, overrides }

  function getActiveShape() {
    const v = state.overrides["--theme-radius"];
    if (v != null) return v;
    return window.ThemeEngine.PRESETS[state.preset]?.vars["--theme-radius"] ?? "0px";
  }

  function getActiveFont() {
    const v = state.overrides["--theme-font"];
    if (v != null) return v;
    return window.ThemeEngine.PRESETS[state.preset]?.vars["--theme-font"] ?? window.ThemeEngine.FONT_OPTIONS[0].value;
  }

  function getActiveDensity() {
    const v = state.overrides["--theme-btn-height"];
    if (v != null) return v;
    return window.ThemeEngine.PRESETS[state.preset]?.vars["--theme-btn-height"] ?? "32px";
  }

  function getActiveStyle() {
    if (state.style != null) return state.style;
    return window.ThemeEngine.PRESETS[state.preset]?.defaultStyle ?? "flat";
  }

  function applyAndSave() {
    window.ThemeEngine.save(state.preset, state.style, state.overrides);
  }

  function buildPresetCards() {
    const grid = document.createElement("div");
    grid.className = "appearance-preset-grid";

    Object.entries(window.ThemeEngine.PRESETS).forEach(([key, preset]) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "appearance-preset-btn" + (state.preset === key ? " active" : "");
      btn.dataset.presetKey = key;

      const swatch = document.createElement("div");
      swatch.className = "appearance-preset-swatch";
      swatch.style.background = preset.swatchBg;

      const accentBar = document.createElement("div");
      accentBar.className = "appearance-preset-swatch-accent";
      accentBar.style.background = preset.swatchAccent;
      swatch.appendChild(accentBar);

      const label = document.createElement("div");
      label.className = "appearance-preset-label";
      label.textContent = preset.label;

      btn.appendChild(swatch);
      btn.appendChild(label);

      btn.addEventListener("click", () => {
        state.preset = key;
        state.style = null;
        state.overrides = {};
        applyAndSave();
        refreshUI();
      });

      grid.appendChild(btn);
    });

    return grid;
  }

  function buildSegControl(options, getValue, onSelect) {
    const seg = document.createElement("div");
    seg.className = "appearance-seg";

    options.forEach(({ label, value }) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = label;
      btn.className = getValue() === value ? "active" : "";
      btn.addEventListener("click", () => {
        onSelect(value);
        applyAndSave();
        refreshUI();
      });
      seg.appendChild(btn);
    });

    return seg;
  }

  function buildBody() {
    const body = document.createElement("div");
    body.className = "appearance-modal-body";

    // Presets section
    const presetsSection = document.createElement("div");
    const presetsLabel = document.createElement("span");
    presetsLabel.className = "appearance-section-label";
    presetsLabel.textContent = "Preset";
    presetsSection.appendChild(presetsLabel);
    presetsSection.appendChild(buildPresetCards());
    body.appendChild(presetsSection);

    // Shape
    const shapeSection = document.createElement("div");
    const shapeLabel = document.createElement("span");
    shapeLabel.className = "appearance-section-label";
    shapeLabel.textContent = "Shape";
    shapeSection.appendChild(shapeLabel);
    shapeSection.appendChild(
      buildSegControl(
        window.ThemeEngine.SHAPE_OPTIONS,
        getActiveShape,
        (v) => {
          state.overrides["--theme-radius"] = v;
        },
      ),
    );
    body.appendChild(shapeSection);

    // Font
    const fontSection = document.createElement("div");
    const fontLabel = document.createElement("span");
    fontLabel.className = "appearance-section-label";
    fontLabel.textContent = "Font";
    fontSection.appendChild(fontLabel);
    fontSection.appendChild(
      buildSegControl(window.ThemeEngine.FONT_OPTIONS, getActiveFont, (v) => {
        state.overrides["--theme-font"] = v;
      }),
    );
    body.appendChild(fontSection);

    // Density
    const densitySection = document.createElement("div");
    const densityLabel = document.createElement("span");
    densityLabel.className = "appearance-section-label";
    densityLabel.textContent = "Density";
    densitySection.appendChild(densityLabel);
    densitySection.appendChild(
      buildSegControl(
        window.ThemeEngine.DENSITY_OPTIONS,
        getActiveDensity,
        (v) => {
          state.overrides["--theme-btn-height"] = v;
        },
      ),
    );
    body.appendChild(densitySection);

    // Visual style
    const styleSection = document.createElement("div");
    const styleLabel = document.createElement("span");
    styleLabel.className = "appearance-section-label";
    styleLabel.textContent = "Visual Style";
    styleSection.appendChild(styleLabel);
    styleSection.appendChild(
      buildSegControl(
        window.ThemeEngine.STYLE_OPTIONS,
        getActiveStyle,
        (v) => {
          state.style = v;
        },
      ),
    );
    body.appendChild(styleSection);

    return body;
  }

  function refreshUI() {
    if (!backdrop) return;
    const oldBody = backdrop.querySelector(".appearance-modal-body");
    if (oldBody) oldBody.replaceWith(buildBody());
    backdrop.querySelectorAll(".appearance-preset-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.presetKey === state.preset);
    });
  }

  function ensureBackdrop() {
    if (backdrop) return backdrop;

    backdrop = document.createElement("div");
    backdrop.className = "appearance-modal-backdrop";
    backdrop.hidden = true;

    const card = document.createElement("div");
    card.className = "appearance-modal-card";

    // Header
    const header = document.createElement("div");
    header.className = "appearance-modal-header";

    const title = document.createElement("div");
    title.className = "appearance-modal-title";
    title.textContent = "Appearance";

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "toolbar-menu-trigger";
    closeBtn.style.cssText = "padding:4px 8px;font-size:16px;min-height:unset";
    closeBtn.textContent = "✕";
    closeBtn.addEventListener("click", close);

    header.appendChild(title);
    header.appendChild(closeBtn);
    card.appendChild(header);
    card.appendChild(buildBody());

    // Footer
    const footer = document.createElement("div");
    footer.className = "appearance-modal-footer";
    const resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.className = "toolbar-menu-trigger";
    resetBtn.style.cssText = "font-size:11px;color:#928b7d;min-height:unset";
    resetBtn.textContent = "Reset to default";
    resetBtn.addEventListener("click", () => {
      window.ThemeEngine.reset();
      state = window.ThemeEngine.load();
      refreshUI();
    });
    footer.appendChild(resetBtn);
    card.appendChild(footer);

    backdrop.appendChild(card);

    backdrop.addEventListener("pointerdown", (e) => {
      if (!card.contains(e.target)) close();
    });

    document.body.appendChild(backdrop);
    return backdrop;
  }

  function open() {
    state = window.ThemeEngine.load();
    const b = ensureBackdrop();
    // Rebuild body with fresh state
    const oldBody = b.querySelector(".appearance-modal-body");
    if (oldBody) oldBody.replaceWith(buildBody());
    b.hidden = false;
  }

  function close() {
    if (backdrop) backdrop.hidden = true;
  }

  window.AppearanceModal = { open, close };
})();
```

- [ ] **Step 2: Verify syntax**

```bash
node --check src/AppearanceModal.js
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/AppearanceModal.js
git commit -m "feat: AppearanceModal — preset cards, segmented controls, live apply"
```

---

## Task 4: Wire up entry points

**Files:**
- Modify: `src/appCommands.js` (line 26 — before closing `}`  of the object)
- Modify: `src/Topbar.js` (lines 177–217 — before the help button block)
- Modify: `src/TopbarMenus.js` (lines 644–667 — inside HelpMenuContent)
- Modify: `index.html` (line 77 — after ViewContrast script tag)

### 4a: appCommands.js

- [ ] **Step 1: Add `openAppearance()` to AppCommands**

In `src/appCommands.js`, find:

```js
  openMobileQuickLabelEdit() {
    window.dispatchEvent(new Event("mobile-quick-label-edit"));
  },
});
```

Replace with:

```js
  openMobileQuickLabelEdit() {
    window.dispatchEvent(new Event("mobile-quick-label-edit"));
  },

  openAppearance() {
    window.dispatchEvent(new Event("panel-designer:open-appearance"));
  },
});
```

### 4b: Topbar.js

- [ ] **Step 2: Add appearance button in Topbar (desktop only)**

In `src/Topbar.js`, find:

```js
        isNarrow
          ? React.createElement(
              "button",
              {
                className: "toolbar-menu-trigger topbar-icon-btn",
                onClick: () => onOpenShortcuts?.(),
                title: "Help & shortcuts",
              },
```

Insert BEFORE that block (i.e., before the `isNarrow ? React.createElement(...)` that handles help):

```js
        !isNarrow &&
          React.createElement(
            "button",
            {
              className: "toolbar-menu-trigger toolbar-appearance-trigger",
              onClick: () => AppCommands.openAppearance(),
              title: "Appearance settings",
            },
            React.createElement(
              "svg",
              {
                width: 14,
                height: 14,
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: 1.7,
                strokeLinecap: "round",
                strokeLinejoin: "round",
                "aria-hidden": "true",
              },
              React.createElement("circle", { cx: "12", cy: "12", r: "3" }),
              React.createElement("path", {
                d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
              }),
            ),
          ),
        isNarrow
          ? React.createElement(
              "button",
              {
                className: "toolbar-menu-trigger topbar-icon-btn",
                onClick: () => onOpenShortcuts?.(),
                title: "Help & shortcuts",
              },
```

### 4c: TopbarMenus.js

- [ ] **Step 3: Add Appearance button to HelpMenuContent**

In `src/TopbarMenus.js`, find the `menu-grid two` div inside `HelpMenuContent` (around line 644):

```js
    React.createElement(
      "div",
      { className: "menu-grid two", style: { marginTop: 10 } },
      React.createElement(
        "button",
        {
          onClick: () => {
            onOpenShortcuts();
            onClose();
          },
        },
        "Open shortcuts",
      ),
      React.createElement(
        "button",
        {
          onClick: () => {
            onOpenProductionCheck();
            onClose();
          },
        },
        "Production check",
      ),
    ),
```

Replace with:

```js
    React.createElement(
      "div",
      { className: "menu-grid two", style: { marginTop: 10 } },
      React.createElement(
        "button",
        {
          onClick: () => {
            onOpenShortcuts();
            onClose();
          },
        },
        "Open shortcuts",
      ),
      React.createElement(
        "button",
        {
          onClick: () => {
            onOpenProductionCheck();
            onClose();
          },
        },
        "Production check",
      ),
      React.createElement(
        "button",
        {
          onClick: () => {
            AppCommands.openAppearance();
            onClose();
          },
        },
        "Appearance",
      ),
    ),
```

### 4d: index.html

- [ ] **Step 4: Add script tags to index.html**

In `index.html`, find:

```html
  <script src="src/ViewContrast.js?v=desktop-toolbox-v2"></script>
```

Replace with:

```html
  <script src="src/ViewContrast.js?v=desktop-toolbox-v2"></script>
  <script src="src/ThemeEngine.js"></script>
  <script src="src/AppearanceModal.js"></script>
```

- [ ] **Step 5: Verify syntax on all modified JS files**

```bash
npm run check:syntax
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/appCommands.js src/Topbar.js src/TopbarMenus.js index.html
git commit -m "feat: wire up Appearance button in topbar, help menu, and appCommands"
```

---

## Task 5: Final Verification

**Files:** None — verification only.

- [ ] **Step 1: Run full verify suite**

```bash
npm run verify
```

Expected:
- Format check: PASS
- Syntax check: PASS  
- Screenshots: all pass, no baseline changes

- [ ] **Step 2: Manual smoke test**

Start the dev server:

```bash
npm run dev
```

Open `http://localhost:4173`. Check:

1. App loads normally (Industrial theme — no change from default)
2. Click the settings icon in the topbar — Appearance modal opens
3. Click **Minimal** preset — UI shifts to neutral grey palette, slightly rounded corners, less tracking
4. Click **Retro** preset — green accent, monospace font, sharp corners
5. Click **Light** preset — light background appears
6. Click **Synthwave** preset — purple accent, glass effect on sidebars/topbar
7. Click **Shape → Rounded** — all corners become 8px
8. Click **Font → Mono** — body font switches to monospace
9. Click **Density → Compact** — buttons shrink
10. Click **Visual Style → Bordered** — divider lines become more prominent
11. Close modal, reload page — last theme is restored from localStorage
12. Click **Reset to default** — returns to Industrial
13. On mobile viewport: open Help menu → "Appearance" button visible

- [ ] **Step 3: Commit if any fixes were needed**

If any issues were found and fixed:

```bash
git add -p
git commit -m "fix: appearance settings smoke test corrections"
```

- [ ] **Step 4: Final verify after fixes**

```bash
npm run verify
```

Expected: all pass.
