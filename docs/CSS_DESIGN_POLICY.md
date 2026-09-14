# CSS Design Policy

> Read this before touching `styles.css` or adding any CSS to this project.

---

## Core rules

1. **No `!important`** — `styles.css` has zero `!important` declarations. Do not add any. If a rule is losing the cascade, fix specificity or move the rule; never use `!important` as a shortcut.

2. **No hardcoded hex/rgba** — Use semantic tokens: `var(--ui-gold)`, `var(--ui-btn-bg)`, `rgba(var(--ui-line-rgb), 0.2)` etc. Hardcoded values like `#f1e4cd` break appearance presets.

3. **ThemeEngine owns CSS vars** — Never call `element.style.setProperty('--ui-*', ...)` outside `src/ThemeEngine.js`. All CSS custom properties are set there at runtime.

4. **Bugfixes only** — Do not refactor, restructure, or rename selectors unless explicitly asked. CSS debt is tracked; don't introduce new debt.

---

## File structure: styles.css sections

The file has 15 named sections. Each section maps to one or more surfaces (see PROJECT_MAP.md).

| § | Name | Owner surface(s) |
|---|---|---|
| §1 | Reset & Base | `bootstrap` |
| §2 | App Shell | `workspace-shell`, `app-state` |
| §3 | Workspace Layout | `workspace-shell` |
| §4 | Topbar | `topbar` |
| §5 | Sidebars | `right-sidebar`, `layer-manager` |
| §6 | Canvas Area | `canvas`, `canvas-overlays` |
| §7 | Canvas Rails & HUD | `canvas-tool-rail`, `mobile-dock` |
| §8 | Modals & Dialogs | `app-state`, `templates`, `export` |
| §9 | Components | `right-sidebar` (sidebar field/input styles) |
| §10 | Mobile | `mobile-dock` |
| §11 | Utilities & Scrollbars | `bootstrap` |
| §12–§13 | v452 polish / readability | various (not yet integrated into domain sections) |
| §14 | v452 Layers panel | `layer-manager` |
| §15 | v452 Export dialog | `export` |

**Rule:** When fixing a bug in surface X, only edit its owner section(s). Do not add rules to unrelated sections.

---

## Token system

Two layers, both defined/set at runtime by ThemeEngine.js:

**Layer 1 — Primitives** (preset-specific):
```
--ui-bg, --ui-bg-2, --ui-panel, --ui-panel-2
--ui-surface, --ui-surface-hover
--ui-text, --ui-text-soft, --ui-muted
--ui-gold, --ui-gold-2, --ui-gold-rgb, --ui-gold-alt-rgb, --ui-gold-soft
--ui-line-rgb, --ui-danger, --ui-danger-rgb
--theme-radius, --theme-font, --theme-tracking, --theme-btn-height
```

**Layer 2 — Semantic tokens** (computed from Layer 1, in `:root`):
```
--ui-btn-bg, --ui-btn-text, --ui-btn-active-bg, --ui-btn-active-text
--ui-btn-active-border, --ui-btn-disabled-bg, --ui-btn-disabled-text
--ui-btn-danger-bg, --ui-btn-danger-text, --ui-btn-hover-bg
--ui-input-bg, --ui-input-text, --ui-input-focus-border
--ui-sidebar-bg, --ui-sidebar-text, --ui-sidebar-label
--ui-section-header-bg, --ui-topbar-bg, --ui-topbar-text
```

**Always use Layer 2 tokens for new UI rules.** Only use Layer 1 primitives when no Layer 2 token fits.

---

## How to navigate styles.css

```bash
# Jump to a section
grep -n "^/\* ===== " styles.css

# Find rules for a selector
grep -n "\.selector-name" styles.css

# Count !important (should always be 0)
python3 -c "
import re, sys
css = open('styles.css').read()
hits = re.findall(r'[^/]!important', css)
print(len(hits), 'occurrences')
"
```

---

## What NOT to do

- Do not add a new `/* ===== N. ... ===== */` section without updating PROJECT_MAP.md/.json and this file.
- Do not use `element.style.setProperty` for `--ui-*` vars outside ThemeEngine.js.
- Do not copy hex values from existing rules — extract the token instead.
- Do not use `!important` to fix z-index, specificity, or cascade issues.
- Do not edit `styles.css` §3 (Workspace Layout) or `WorkspaceShell.js` grid-column rules without reading `docs/memory/project_v448_grid_system.md` first — the grid system uses CSS vars to collapse columns.
