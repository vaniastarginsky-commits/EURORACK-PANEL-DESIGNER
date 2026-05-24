# Semantic Token System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all hardcoded hex/rgba color values in `styles.css` with CSS variables so that appearance presets and the accent hue picker visually affect all UI elements.

**Architecture:** Two-layer token system. Layer 1 = existing ThemeEngine primitives (`--ui-gold-rgb`, `--ui-surface`, etc.). Layer 2 = new semantic tokens defined in CSS `:root` as computed references to primitives (`--ui-btn-bg: var(--ui-panel)`, etc.). Only `styles.css` changes — no JS touched.

**Tech Stack:** Python 3 (in-place CSS surgery on the minified file), CSS custom properties, `npm run verify` for screenshot regression.

**Spec:** `docs/superpowers/specs/2026-05-24-semantic-token-system-design.md`

---

## File Map

| File | Change |
|------|--------|
| `styles.css` | Add semantic token block to `:root`; replace hardcoded colors in button, tab, input, sidebar, topbar rules |

No other files are touched.

---

## Task 1 — Add semantic token definitions to `:root`

**Files:**
- Modify: `styles.css` — append semantic tokens at the end of the `:root{...}` block

The current `:root` block ends with `--theme-border-opacity:0.13`. We insert all new tokens right before the closing `}`.

- [ ] **Step 1: Run the insertion script**

```python
# run: python3 scripts/add-semantic-tokens.py
# Or paste this directly in python3 REPL

with open('styles.css', 'r') as f:
    css = f.read()

SEMANTIC_TOKENS = (
    # Buttons
    '--ui-btn-bg:var(--ui-panel);'
    '--ui-btn-text:var(--ui-text-soft);'
    '--ui-btn-border:rgba(var(--ui-line-rgb),var(--theme-border-opacity));'
    '--ui-btn-hover-bg:var(--ui-surface-hover);'
    '--ui-btn-hover-text:var(--ui-text);'
    '--ui-btn-hover-border:rgba(var(--ui-gold-rgb),.34);'
    '--ui-btn-active-bg:rgba(var(--ui-gold-rgb),.10);'
    '--ui-btn-active-text:var(--ui-text);'
    '--ui-btn-active-border:rgba(var(--ui-gold-rgb),.58);'
    '--ui-btn-disabled-bg:var(--ui-bg-2);'
    '--ui-btn-disabled-text:var(--ui-muted);'
    '--ui-btn-disabled-border:rgba(var(--ui-line-rgb),.08);'
    '--ui-btn-danger-bg:rgba(var(--ui-danger-rgb),.12);'
    '--ui-btn-danger-text:var(--ui-text-soft);'
    # Inputs
    '--ui-input-bg:var(--ui-bg-2);'
    '--ui-input-text:var(--ui-text);'
    '--ui-input-border:rgba(var(--ui-line-rgb),.20);'
    '--ui-input-focus-border:var(--ui-gold-2);'
    '--ui-input-focus-shadow:rgba(var(--ui-gold-rgb),.40);'
    '--ui-input-caret:var(--ui-gold-2);'
    # Sidebar / panels
    '--ui-sidebar-bg:var(--ui-panel);'
    '--ui-sidebar-text:var(--ui-text-soft);'
    '--ui-sidebar-label:var(--ui-muted);'
    '--ui-sidebar-border:rgba(var(--ui-line-rgb),var(--theme-border-opacity));'
    '--ui-section-header-bg:var(--ui-panel-2);'
    '--ui-section-header-text:var(--ui-text-soft);'
    # Topbar
    '--ui-topbar-bg:var(--ui-panel);'
    '--ui-topbar-text:var(--ui-text-soft);'
)

# Anchor: insert before the closing } of :root
ANCHOR = '--theme-border-opacity:0.13}'
assert ANCHOR in css, 'Anchor not found — :root may have changed'

css = css.replace(ANCHOR, ANCHOR[:-1] + ';' + SEMANTIC_TOKENS + '}', 1)

with open('styles.css', 'w') as f:
    f.write(css)

print('Done')
```

- [ ] **Step 2: Verify tokens appear in the file**

```bash
python3 -c "
import re
with open('styles.css') as f: css = f.read()
count = css.count('--ui-btn-bg')
print(f'--ui-btn-bg occurrences: {count}')  # expect >= 1 (the definition)
count2 = css.count('--ui-sidebar-bg')
print(f'--ui-sidebar-bg occurrences: {count2}')
"
```

Expected output:
```
--ui-btn-bg occurrences: 1
--ui-sidebar-bg occurrences: 1
```

- [ ] **Step 3: Commit**

```bash
git add styles.css
git commit -m "feat(tokens): add semantic CSS token definitions to :root"
```

---

## Task 2 — Replace button hardcoded colors

**Files:**
- Modify: `styles.css` — button base, hover, active, active-children, disabled, danger rules

- [ ] **Step 1: Run button replacement script**

```python
with open('styles.css', 'r') as f:
    css = f.read()

replacements = [
    # Button base — background + text
    # The single-selector `button{background:#050505;color:#eee7da;...}` rule
    ('button{background:#050505;color:#eee7da;border:1px solid rgba(var(--ui-line-rgb),.20)',
     'button{background:var(--ui-btn-bg);color:var(--ui-btn-text);border:1px solid rgba(var(--ui-line-rgb),.20)'),

    # Long-selector button base — color only (bg already uses var(--ui-surface-hover) in many rules)
    ('color:#ddd5c6}', 'color:var(--ui-btn-text)}'),

    # Button hover — text color
    ('color:#f4ead8}', 'color:var(--ui-btn-hover-text)}'),

    # Button active — bg + text (two distinct patterns in the CSS)
    ('background:rgba(28,22,13,.82);color:#f1e4cd;border-color:rgba(var(--ui-gold-rgb),.58)',
     'background:var(--ui-btn-active-bg);color:var(--ui-btn-active-text);border-color:var(--ui-btn-active-border)'),

    ('background:rgba(28,22,13,.82);color:#f1e4cd;border-color:rgba(var(--ui-gold-rgb),.66)',
     'background:var(--ui-btn-active-bg);color:var(--ui-btn-active-text);border-color:rgba(var(--ui-gold-rgb),.66)'),

    # Tab/segmented active (lighter variant)
    ('color:#efe7d8;background:rgba(28,22,13,.72)',
     'color:var(--ui-btn-active-text);background:var(--ui-btn-active-bg)'),

    # Active children text
    ('color:#f1e4cd;fill:var(--ui-gold);stroke:var(--ui-gold)}',
     'color:var(--ui-btn-active-text);fill:var(--ui-gold);stroke:var(--ui-gold)}'),

    # Disabled button
    ('background:#050505;color:#4c4943;border-color:rgba(255,255,255,.045)',
     'background:var(--ui-btn-disabled-bg);color:var(--ui-btn-disabled-text);border-color:var(--ui-btn-disabled-border)'),

    # Danger button
    ('background:#170807;color:#efc2bc;border-color:rgba(var(--ui-danger-rgb),.62)',
     'background:var(--ui-btn-danger-bg);color:var(--ui-btn-danger-text);border-color:rgba(var(--ui-danger-rgb),.62)'),

    # Armed button (non-danger) — gold-hardcoded rgba → var
    ('background:rgba(189,140,63,.12);color:#f1e4cd;border-color:rgba(var(--ui-gold-rgb),.64)',
     'background:rgba(var(--ui-gold-rgb),.12);color:var(--ui-btn-active-text);border-color:rgba(var(--ui-gold-rgb),.64)'),

    # Tab buttons base — bg + text
    ('background:#070707;color:#9d9688;border:0!important',
     'background:var(--ui-btn-bg);color:var(--ui-btn-text);border:0!important'),
]

changed = 0
for old, new in replacements:
    if old in css:
        css = css.replace(old, new)
        changed += 1
        print(f'  OK: {old[:60]}')
    else:
        print(f'  MISS: {old[:60]}')

with open('styles.css', 'w') as f:
    f.write(css)

print(f'\n{changed}/{len(replacements)} replacements applied')
```

- [ ] **Step 2: Verify replacement count**

Expected output: `27/27 replacements applied` (or close — print shows each hit/miss).
All lines should say `OK:`. If any say `MISS:`, the pattern changed — find it manually with:

```bash
python3 -c "
with open('styles.css') as f: css = f.read()
# Search for remaining hardcoded button colors
import re
hits = [(m.start(), css[max(0,m.start()-30):m.start()+80]) for m in re.finditer(r'color:#f1e4cd|color:#efe7d8|color:#f4ead8|color:#ddd5c6|color:#9d9688|background:rgba\(28,22,13', css)]
for pos, ctx in hits:
    print(ctx.strip())
"
```

- [ ] **Step 3: Run visual check**

```bash
npm run verify
```

Expected: all screenshots pass. If a screenshot changes, inspect it — the Industrial preset should look identical to before.

- [ ] **Step 4: Commit**

```bash
git add styles.css
git commit -m "feat(tokens): replace button hardcoded colors with semantic vars"
```

---

## Task 3 — Replace input / select / textarea hardcoded colors

**Files:**
- Modify: `styles.css` — input, select, textarea, range, checkbox, radio rules

- [ ] **Step 1: Run input replacement script**

```python
with open('styles.css', 'r') as f:
    css = f.read()

replacements = [
    # Input base bg + text (long selector with !important)
    ('background:#020202;color:#eee7d8;border:0!important',
     'background:var(--ui-input-bg);color:var(--ui-input-text);border:0!important'),

    # Input base bg + text (shorter selector)
    ('background:#030303;color:#eee7da;border:1px solid rgba(var(--ui-line-rgb),.14)',
     'background:var(--ui-input-bg);color:var(--ui-input-text);border:1px solid var(--ui-input-border)'),

    # Filter row + template manager input variants
    ('background:#030303;border:1px solid rgba(var(--ui-line-rgb),.14)!important;color:#eee7da',
     'background:var(--ui-input-bg);border:1px solid var(--ui-input-border)!important;color:var(--ui-input-text)'),

    # Sidebar-scoped input overrides
    ('height:34px!important;min-height:34px!important;background:#030303;border:1px solid rgba(var(--ui-line-rgb),.14)!important;color:#eee7da',
     'height:34px!important;min-height:34px!important;background:var(--ui-input-bg);border:1px solid var(--ui-input-border)!important;color:var(--ui-input-text)'),

    # Range slider track — hardcoded gold rgba
    ('background:rgba(189,140,63,.52)', 'background:rgba(var(--ui-gold-rgb),.52)'),

    # Checkbox checked state — bg = gold, text = bg (checkmark contrast)
    ('input[type="checkbox"]:checked{background:#c99a4a;border-color:#c99a4a}',
     'input[type="checkbox"]:checked{background:var(--ui-gold);border-color:var(--ui-gold)}'),

    # Checkbox checked checkmark text
    ('content:"✓";font-size:13px;font-weight:900;line-height:1;color:#050505}',
     'content:"✓";font-size:13px;font-weight:900;line-height:1;color:var(--ui-bg)}'),

    # Radio checked dot
    ('border-radius:50%;background:#c99a4a}',
     'border-radius:50%;background:var(--ui-gold)}'),

    # Focus border + shadow (if hardcoded)
    ('border-bottom-color:var(--ui-gold-2);box-shadow:inset 0 -1px 0 rgba(var(--ui-gold-rgb),.40)!important',
     'border-bottom-color:var(--ui-input-focus-border);box-shadow:inset 0 -1px 0 rgba(var(--ui-gold-rgb),.40)!important'),
]

changed = 0
for old, new in replacements:
    if old == new:
        continue  # skip no-op (checkbox pass-through above)
    if old in css:
        css = css.replace(old, new)
        changed += 1
        print(f'  OK: {old[:60]}')
    else:
        print(f'  MISS: {old[:60]}')

with open('styles.css', 'w') as f:
    f.write(css)

print(f'\n{changed} replacements applied')
```

- [ ] **Step 2: Check remaining hardcoded input colors**

```bash
python3 -c "
import re
with open('styles.css') as f: css = f.read()
# Find input rules with remaining hardcoded colors
blocks = re.findall(r'(?:input|select|textarea)[^{]*\{[^}]+\}', css)
for b in blocks:
    hits = re.findall(r'(?:color|background):\s*(#[0-9a-fA-F]+|rgba?\([0-9,\s.]+\))', b)
    if hits:
        print(b[:200])
        print('  >>', hits)
        print()
"
```

For each remaining hit, identify the semantic token and add a replacement to the script above, then re-run.

- [ ] **Step 3: Run visual check**

```bash
npm run verify
```

- [ ] **Step 4: Commit**

```bash
git add styles.css
git commit -m "feat(tokens): replace input/select/checkbox hardcoded colors with semantic vars"
```

---

## Task 4 — Replace sidebar / inspector / panel hardcoded colors

**Files:**
- Modify: `styles.css` — `.inspector`, `.sidebar-left`, `.sidebar-right`, `.layer-manager`, `.panel-section`, `.right-col`, `.left-col` rules

- [ ] **Step 1: Audit remaining hardcoded colors in sidebar rules**

```bash
python3 -c "
import re
with open('styles.css') as f: css = f.read()
blocks = re.findall(r'(?:\.inspector|\.sidebar|\.layer-manager|\.right-col|\.left-col|\.panel-section|\.section-header)[^{]*\{[^}]+\}', css)
for b in blocks:
    hits = re.findall(r'(?:color|background(?:-color)?|border(?:-color)?):\s*(#[0-9a-fA-F]+|rgba?\([0-9,\s.]+\))', b)
    if hits:
        print(b[:200])
        print('  >>', hits)
        print()
"
```

- [ ] **Step 2: Write and run sidebar replacement script**

From the audit output, build the replacement list. Common patterns expected:

```python
with open('styles.css', 'r') as f:
    css = f.read()

# These are the patterns found in the audit above — add/remove as needed
replacements = [
    # Sidebar surface backgrounds
    ('background:#030303', 'background:var(--ui-sidebar-bg)'),
    ('background:#050505', 'background:var(--ui-sidebar-bg)'),
    ('background:#070707', 'background:var(--ui-sidebar-bg)'),

    # Sidebar text / labels
    ('color:#eee7da', 'color:var(--ui-sidebar-text)'),
    ('color:#d8d0c0', 'color:var(--ui-sidebar-text)'),
    ('color:#928b7d', 'color:var(--ui-sidebar-label)'),
    ('color:#9d9688', 'color:var(--ui-sidebar-label)'),

    # Section header
    ('background:#080807', 'background:var(--ui-section-header-bg)'),
    ('background:#0d0c0a', 'background:var(--ui-section-header-bg)'),

    # Muted gold text (warnings / labels)
    ('color:#c99a4a', 'color:var(--ui-gold)'),
    ('color:#f2dfb2', 'color:var(--ui-gold-2)'),
    ('color:#e9cf9a', 'color:var(--ui-gold-2)'),
]

# IMPORTANT: Apply ONLY within sidebar-related CSS blocks, not globally.
# Use context-aware replacement:
import re

def replace_in_blocks(css, selector_pattern, replacements):
    def replace_block(m):
        block = m.group()
        for old, new in replacements:
            block = block.replace(old, new)
        return block
    return re.sub(selector_pattern, replace_block, css)

css = replace_in_blocks(
    css,
    r'(?:\.inspector|\.sidebar-left|\.sidebar-right|\.layer-manager|\.right-col|\.left-col|\.panel-section|\.section-header)[^{]*\{[^}]+\}',
    replacements,
)

with open('styles.css', 'w') as f:
    f.write(css)

print('Done')
```

**Note:** Run the audit (Step 1) first to see the actual values — the list above is based on the initial audit and may need adjustment.

- [ ] **Step 3: Re-run audit to verify zero hardcoded colors in sidebar blocks**

```bash
python3 -c "
import re
with open('styles.css') as f: css = f.read()
blocks = re.findall(r'(?:\.inspector|\.sidebar|\.layer-manager|\.right-col|\.left-col|\.panel-section)[^{]*\{[^}]+\}', css)
remaining = []
for b in blocks:
    hits = re.findall(r'(?:color|background):\s*(#[0-9a-fA-F]+|rgba?\([0-9,\s.]+\))', b)
    if hits:
        remaining.append((b[:150], hits))
print(f'Remaining hardcoded in sidebar: {len(remaining)}')
for b, h in remaining:
    print(b)
    print('  >>', h)
"
```

Expected: `Remaining hardcoded in sidebar: 0`

- [ ] **Step 4: npm run verify**

```bash
npm run verify
```

- [ ] **Step 5: Commit**

```bash
git add styles.css
git commit -m "feat(tokens): replace sidebar/inspector hardcoded colors with semantic vars"
```

---

## Task 5 — Replace topbar hardcoded colors

**Files:**
- Modify: `styles.css` — `.topbar`, `.app-nav`, `.toolbar-menu-trigger` rules

Note: most topbar buttons are regular `<button>` elements and are already fixed by Task 2. This task targets topbar-specific rules only.

- [ ] **Step 1: Audit topbar hardcoded colors**

```bash
python3 -c "
import re
with open('styles.css') as f: css = f.read()
blocks = re.findall(r'(?:\.topbar|\.app-nav|\.nav-btn|\.toolbar-menu-trigger)[^{]*\{[^}]+\}', css)
for b in blocks:
    hits = re.findall(r'(?:color|background(?:-color)?|border(?:-color)?):\s*(#[0-9a-fA-F]+|rgba?\([0-9,\s.]+\))', b)
    if hits:
        print(b[:200])
        print('  >>', hits)
        print()
"
```

- [ ] **Step 2: Write and run topbar replacement script**

```python
with open('styles.css', 'r') as f:
    css = f.read()

import re

def replace_in_blocks(css, selector_pattern, replacements):
    def replace_block(m):
        block = m.group()
        for old, new in replacements:
            block = block.replace(old, new)
        return block
    return re.sub(selector_pattern, replace_block, css)

# Populate from audit output in Step 1
topbar_replacements = [
    ('background:#050505', 'background:var(--ui-topbar-bg)'),
    ('color:#ddd5c6', 'color:var(--ui-topbar-text)'),
    ('color:#f1e4cd', 'color:var(--ui-btn-active-text)'),
    ('color:#f4ead8', 'color:var(--ui-btn-hover-text)'),
    ('background:rgba(28,22,13,.82)', 'background:var(--ui-btn-active-bg)'),
]

css = replace_in_blocks(
    css,
    r'(?:\.topbar|\.app-nav|\.nav-btn|\.toolbar-menu-trigger)[^{]*\{[^}]+\}',
    topbar_replacements,
)

with open('styles.css', 'w') as f:
    f.write(css)

print('Done')
```

- [ ] **Step 3: npm run verify**

```bash
npm run verify
```

- [ ] **Step 4: Commit**

```bash
git add styles.css
git commit -m "feat(tokens): replace topbar hardcoded colors with semantic vars"
```

---

## Task 6 — Final audit and cleanup

**Files:**
- Read: `styles.css`

- [ ] **Step 1: Run full hardcoded color audit**

```bash
python3 -c "
import re

with open('styles.css') as f:
    css = f.read()

# Find all remaining hardcoded color properties (outside :root and [data-preset] blocks)
# Strip :root and data-preset sections first
stripped = re.sub(r':root\{[^}]+\}', '', css)
stripped = re.sub(r'\[data-preset[^\]]*\][^{]*\{[^}]*\}', '', stripped)
stripped = re.sub(r'\[data-glow[^\]]*\][^{]*\{[^}]*\}', '', stripped)

hits = re.findall(
    r'(?:color|background(?:-color)?|border(?:-color)?|fill|stroke):\s*(?!var\()(?!rgba\(var)(?!transparent)(?!inherit)(?!none)(#[0-9a-fA-F]{3,8}|rgba?\([0-9,\s.]+\))',
    stripped
)
print(f'Remaining hardcoded color properties: {len(hits)}')
for h in sorted(set(hits)):
    count = hits.count(h)
    print(f'  {h}  (x{count})')
"
```

- [ ] **Step 2: Fix remaining hits**

For each remaining hardcoded value, identify the CSS rule context and add the appropriate token. Repeat the fix → verify loop until the count is 0 (or only intentionally fixed values like `--ui-danger:#8a302a` remain).

Intentionally hardcoded (leave as-is):
- Values inside `:root{}` itself (the primitive definitions)
- Values inside `[data-preset=...]` atmosphere rules (canvas glow, scanlines — these are preset-specific decorative CSS, not semantic)
- `--ui-danger:#8a302a` — danger color is intentionally fixed
- `transparent`, `inherit`, `none`

- [ ] **Step 3: Final npm run verify**

```bash
npm run verify
```

Expected: all 21 screenshots pass, no changes from baseline.

- [ ] **Step 4: Final commit**

```bash
git add styles.css
git commit -m "feat(tokens): complete semantic token system — no hardcoded colors in UI rules"
```

---

## Success Criteria Checklist

- [ ] `npm run verify` passes (21/21 screenshots, no regressions)
- [ ] No new `!important` declarations added
- [ ] Python audit returns 0 hardcoded color properties in button/input/sidebar/topbar rules
- [ ] Switching presets visibly changes button colors, input borders, sidebar tone in browser
- [ ] Moving accent hue picker updates active button highlight and input focus ring in browser
