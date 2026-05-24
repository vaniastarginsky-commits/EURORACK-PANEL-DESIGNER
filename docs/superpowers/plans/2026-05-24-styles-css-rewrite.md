# CSS Rewrite: Domain-Organized styles.css Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 4905-line patch-based styles.css (26 version blocks, 2700 !important) with a clean ~1200-line domain-organized file with zero !important.

**Architecture:** `styles.css` is currently 2921 lines (all !important lines already stripped — this is our component reference). `styles.css.backup_before_no_important` is the original 4905-line file (used only for structural values that were !important-only). ThemeEngine.js owns all CSS variable values — no `:root` block is needed in the CSS file.

**Tech Stack:** Vanilla CSS, CSS custom properties, CSS Grid. No preprocessor. Verification: `npm run verify` (Playwright screenshot tests, 21 scenarios).

---

## Pre-flight

- [ ] **Save the stripped file as component reference before anything overwrites it**

```bash
cp styles.css styles.css.stripped_reference
echo "Saved $(wc -l < styles.css.stripped_reference) lines to styles.css.stripped_reference"
# Expected: ~2921 lines
```

- [ ] **Run baseline verify to record current state**

```bash
npm run verify 2>&1 | tail -30
```

Note which screenshots pass/fail — this is the regression baseline after Task 5.

- [ ] **Confirm backup exists**

```bash
wc -l styles.css.backup_before_no_important
# Expected: 4905
```

---

## Task 1: Write sections 1–6 (structural foundation)

These rules only existed with `!important` in the old file — they must be written fresh. This step **replaces** `styles.css` completely. The stripped reference is already saved in `styles.css.stripped_reference`.

**Files:**
- Write: `styles.css` (full replacement)
- Reference (read-only): `styles.css.backup_before_no_important`

- [ ] **Write the complete sections 1–6 to styles.css**

```css
/* ===== 1. Reset & Base ===== */

html, body, #root {
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;
  background: var(--ui-bg);
  color: var(--ui-text);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* { box-sizing: border-box; }

button, input, select, textarea { font: inherit; }

button {
  background: var(--ui-btn-bg);
  color: var(--ui-btn-text);
  border: 1px solid rgba(var(--ui-line-rgb), .20);
  min-height: 28px;
  padding: 5px 10px;
  cursor: pointer;
}
button:hover {
  border-color: rgba(var(--ui-gold-rgb), .55);
  background: var(--ui-btn-hover-bg);
}
button:disabled { opacity: .38; cursor: not-allowed; }

input, select, textarea {
  background: var(--ui-input-bg);
  color: var(--ui-input-text);
  border: 1px solid var(--ui-input-border);
  padding: 5px 8px;
  min-height: 28px;
}
textarea { resize: vertical; }
label { display: block; color: #928b7d; }
canvas, svg { max-width: none; }

.form-row label { min-width: 90px; }
.tabs button, .tab-row button, .segmented button { flex: 1; }


/* ===== 2. App Shell ===== */

.app-shell,
.designer-shell,
.workspace-shell,
.main-shell,
.layout-shell {
  height: 100%;
  min-height: 0;
}

.app-shell,
.designer-shell,
.workspace-shell {
  display: grid;
  grid-template-rows: auto 1fr;
  background: var(--ui-bg);
}


/* ===== 3. Workspace Layout ===== */

.main,
.editor-layout,
.panel-designer-layout,
.workspace {
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-rows: 1fr;
  overflow: hidden;
}

@media (min-width: 901px) {
  .workspace {
    --left-col: 292px;
    --right-col: 312px;
    grid-template-columns: var(--left-col) minmax(0, 1fr) var(--right-col);
    transition: grid-template-columns 0.16s ease;
  }

  .workspace[data-left-open="false"] { --left-col: 0px; }
  .workspace[data-right-open="false"] { --right-col: 0px; }

  .sidebar-left.closed,
  .sidebar-right.closed {
    display: block;
    visibility: hidden;
    pointer-events: none;
    padding: 0;
    border: 0;
    min-width: 0;
    width: 0;
    max-width: 0;
    overflow: hidden;
  }

  .canvas-wrap {
    grid-column: 2;
    min-width: 0;
    width: 100%;
  }
  .canvas-wrap > div:first-child {
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .workspace[data-left-open="false"] .canvas-hud,
  .workspace[data-left-open="false"] .hud-bottom-left { left: 10px; }
  .workspace[data-right-open="false"] .hud-bottom-right { right: 10px; }
}


/* ===== 4. Topbar ===== */

.topbar,
.top-bar,
.app-topbar,
.toolbar-main {
  height: auto;
  min-height: 42px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-bottom: 1px solid rgba(var(--ui-line-rgb), .12);
  background: var(--ui-topbar-bg);
  white-space: nowrap;
  overflow: hidden;
}

.topbar .brand,
.brand,
.logo-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 900;
  letter-spacing: .16em;
  text-transform: uppercase;
}

.topbar-history-group,
.topbar-inspect-btn {
  display: flex;
  align-items: center;
  gap: 4px;
}

@media (min-width: 901px) {
  .topbar .mobile-only,
  .topbar [data-mobile-only="true"] { display: none; }
}


/* ===== 5. Sidebars ===== */

.left-sidebar,
.sidebar-left,
.left-panel,
.drawer-left {
  min-width: 0;
  height: 100%;
  overflow: auto;
  border-right: 1px solid rgba(var(--ui-line-rgb), .12);
  background: #030303;
  padding: 8px;
}

.right-sidebar,
.sidebar-right,
.right-panel,
.drawer-right {
  min-width: 0;
  height: 100%;
  overflow: auto;
  border-left: 1px solid rgba(var(--ui-line-rgb), .12);
  background: #030303;
  padding: 8px;
}

.sidebar-section,
.panel-section,
details {
  border: 1px solid rgba(var(--ui-line-rgb), .09);
  background: var(--ui-sidebar-bg);
  margin: 0 0 8px;
  padding: 8px;
}

.section-title,
.sidebar-title,
summary,
h3, h4 {
  margin: 0 0 8px;
  color: var(--ui-sidebar-text);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: .22em;
  text-transform: uppercase;
}

.row,
.form-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 4px 0;
}

.kv,
.status-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  border-bottom: 1px solid rgba(var(--ui-line-rgb), .08);
  padding: 3px 0;
}

.tabs,
.tab-row,
.segmented {
  display: flex;
  gap: 0;
  margin-bottom: 8px;
}

.modal,
.dialog,
.sheet,
.popover {
  background: var(--ui-panel);
  border: 1px solid rgba(var(--ui-line-rgb), .22);
  color: var(--ui-text);
}

.component-card,
.template-card,
.project-card {
  border: 1px solid rgba(var(--ui-line-rgb), .13);
  background: var(--ui-panel);
  padding: 10px;
}


/* ===== 6. Canvas Area ===== */

.center,
.canvas-area,
.editor-center,
.stage-wrap,
.canvas-wrap {
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  position: relative;
  background: var(--ui-bg);
}

.canvas-toolbar,
.stage-toolbar,
.floating-toolbar {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  background: rgba(5, 5, 5, .86);
  border: 1px solid rgba(var(--ui-line-rgb), .16);
  padding: 6px;
}

.status-strip,
.bottom-status,
.mobile-status {
  position: absolute;
  left: 10px;
  bottom: 10px;
  z-index: 10;
  background: rgba(5, 5, 5, .86);
  border: 1px solid rgba(var(--ui-line-rgb), .13);
  padding: 4px 8px;
  color: #d8d0c0;
}

@media (min-width: 901px) {
  .canvas-wrap::after,
  .canvas-area::after,
  .editor-center::after,
  .stage-wrap::after {
    display: none;
    content: none;
  }
}
```

- [ ] **Verify sections 1–6 written correctly**

```bash
wc -l styles.css
# Expected: ~175–200 lines
grep -c 'important' styles.css
# Expected: 0
```

---

## Task 2: Extract and append component CSS (sections 7–9)

Use `styles.css.stripped_reference` (saved in pre-flight) as the source. It already has all !important lines removed — extract only non-empty blocks from the component sections.

**Files:**
- Read: `styles.css.stripped_reference`
- Modify: `styles.css` (append)

- [ ] **Run extraction script**

```bash
python3 - <<'PYEOF'
import re

with open('styles.css.stripped_reference', 'r') as f:
    lines = f.readlines()

# Find the start of component content — skip the structural sections (lines 1–26)
# which are already rewritten in sections 1–6. Start from v424 (L27).
component_lines = lines[26:]  # 0-indexed, so line 27 onward

# Join, then remove empty CSS blocks (blocks with only whitespace between { })
content = ''.join(component_lines)

# Remove empty blocks — iteratively until none remain
# Matches: any selector block where { } contains only whitespace/newlines
prev = None
while prev != content:
    prev = content
    content = re.sub(r'[^{}]*\{\s*\}', '', content)

# Remove version comment headers (e.g. /* v439-export-senior-layout-pass */)
content = re.sub(r'/\* v\d+[-\w]*[^\n]*\n', '', content)
content = re.sub(r'/\* v\d+[-\w][^*]*\*/', '', content, flags=re.DOTALL)

# Collapse 3+ consecutive blank lines to 1
content = re.sub(r'\n{3,}', '\n\n', content)

# Skip the all-empty v508 block (component inspector — was 100% !important)
# It's already removed by empty-block cleanup above

with open('/tmp/component-extracted.css', 'w') as f:
    f.write(content.strip() + '\n')

lc = content.count('\n')
ic = content.count('!important')
print(f'Extracted ~{lc} lines, {ic} !important')
print('Output: /tmp/component-extracted.css')
PYEOF
```

Expected: ~900–1400 lines, 0 !important.

- [ ] **Spot-check extracted CSS**

```bash
head -40 /tmp/component-extracted.css
grep -c 'important' /tmp/component-extracted.css
# Expected: 0

# Verify key sections are present
grep -l 'export-dialog-panel\|layer-manager\|component-info-tooltip\|dfm-status\|appearance-modal' /tmp/component-extracted.css 2>/dev/null || \
grep -c 'export-dialog-panel\|layer-manager\|component-info-tooltip\|dfm-status\|appearance' /tmp/component-extracted.css
# Expected: multiple matches
```

- [ ] **Append component CSS to styles.css**

```bash
printf '\n\n/* ===== 7. Canvas Rails & HUD ===== */\n/* ===== 8. Modals & Dialogs ===== */\n/* ===== 9. Components ===== */\n\n' >> styles.css
cat /tmp/component-extracted.css >> styles.css
```

- [ ] **Verify append**

```bash
wc -l styles.css
grep -c 'important' styles.css
# Expected: 0
```

---

## Task 3: Append sections 10–11 (mobile + utilities)

- [ ] **Append mobile and utility CSS**

Write the following to the end of `styles.css`:

```css
/* ===== 10. Mobile ===== */

@media (max-width: 900px) {
  html, body, #root { overflow: hidden; }

  .main,
  .workspace,
  .editor-layout,
  .panel-designer-layout {
    grid-template-columns: 1fr;
  }

  .left-sidebar,
  .sidebar-left,
  .left-panel,
  .drawer-left,
  .right-sidebar,
  .sidebar-right,
  .right-panel,
  .drawer-right {
    position: fixed;
    top: 42px;
    bottom: 56px;
    width: min(86vw, 360px);
    z-index: 50;
    box-shadow: 0 0 40px rgba(0, 0, 0, .65);
    overflow: auto;
  }

  .left-sidebar,
  .sidebar-left,
  .left-panel,
  .drawer-left { left: 0; }

  .right-sidebar,
  .sidebar-right,
  .right-panel,
  .drawer-right { right: 0; }

  .center,
  .canvas-wrap,
  .canvas-area,
  .editor-center,
  .stage-wrap {
    height: calc(100vh - 98px);
  }

  .mobile-dock,
  .bottom-dock,
  .mobile-toolbar,
  .mobile-main-dock {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 80;
    display: flex;
    gap: 4px;
    overflow: auto;
    background: #050505;
    border-top: 1px solid rgba(var(--ui-line-rgb), .16);
    padding: 6px;
  }
}

@media (min-width: 901px) {
  .canvas-quick-dock,
  .mobile-bottom-sheet,
  .mobile-sheet-backdrop,
  .mobile-dock-restore,
  .mobile-main-dock { display: none; }
}


/* ===== 11. Utilities & Scrollbars ===== */

* {
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--ui-line-rgb), .25) transparent;
}
*::-webkit-scrollbar { width: 6px; height: 6px; }
*::-webkit-scrollbar-track { background: transparent; }
*::-webkit-scrollbar-thumb {
  background: rgba(var(--ui-line-rgb), .22);
  border-radius: 3px;
}
*::-webkit-scrollbar-thumb:hover { background: rgba(var(--ui-line-rgb), .4); }

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

- [ ] **Final count before verify**

```bash
wc -l styles.css
grep -c 'important' styles.css
# Both must be reasonable: lines ~1100–1600, important = 0
```

---

## Task 4: Verify and fix regressions

- [ ] **Run full screenshot verification**

```bash
npm run verify 2>&1 | tail -40
```

- [ ] **If a screenshot fails**, identify the broken selector:

```bash
# Find original value in backup (non-!important version)
grep -n "FAILING_SELECTOR" styles.css.backup_before_no_important | grep -v '!important'
# Add the missing rule to the appropriate section in styles.css
```

- [ ] **Repeat verify until all 21 screenshots pass**

```bash
npm run verify 2>&1 | grep -E 'passed|failed|screenshot'
# Expected: 21 passed, 0 failed
```

---

## Task 5: Commit

- [ ] **Final checks**

```bash
grep -c 'important' styles.css   # must be 0
wc -l styles.css                  # informational
git diff --stat                    # should show only styles.css modified
```

- [ ] **Commit**

```bash
git add styles.css
git commit -m "$(cat <<'EOF'
refactor(css): rewrite styles.css as domain-organized file, zero !important

Replaced 4905-line patch-based CSS (26 version blocks, 2700 !important)
with clean domain-organized file (11 sections, 0 !important, ~1200 lines).

Structural rules (app-shell grid, workspace columns, sidebar overflow)
written fresh without !important. Component rules extracted from stripped
reference with empty blocks removed. ThemeEngine.js owns CSS variables.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Cleanup temp files (optional)**

```bash
rm -f styles.css.stripped_reference /tmp/component-extracted.css
```

---

## Reference

| What | Where in backup | Section |
|------|----------------|---------|
| App shell `grid-template-rows: auto 1fr` | v422 block (was !important) | 2 |
| Workspace `grid-template-columns` via CSS vars | v448 block (was !important) | 3 |
| Sidebar `overflow: auto` | v422 block (was !important) | 5 |
| Sidebar `.closed` visibility/width | v448 block (was !important) | 3 |
| Export modal layout | v439 (survived in stripped) | 8 |
| Layer manager | v440 (survived in stripped) | 9 |
| DFM status float | ~L2433 in stripped | 9 |
| Appearance modal | ~L2790 in stripped | 9 |
| Synthwave preset | ~L2885 in stripped | 9 |
| Mobile dock `position: fixed` | v422 block (was !important) | 10 |

**Sections that were 100% !important (all-empty after stripping, skip them):**
- `v508-component-inspector-layout` — empty block cleanup removes it
- `v446-structural-mobile-dock-desktop-unmount` — empty media query, removed
- `v444-export-tabs-final-fit` — all empty, removed
- `v451-mobile-canvas-dock-cleanup` — disabled block (media: 0px), removed
