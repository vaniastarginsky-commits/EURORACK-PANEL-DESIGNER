# CSS Token Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all hardcoded `rgba(215,196,155,…)`, `rgba(214,170,88,…)`, `rgba(201,154,74,…)`, `rgba(138,48,42,…)`, `rgba(238,231,218,…)` values in `styles.css` with CSS channel variables so a future theme menu can change all border/shadow colors by overriding a single variable.

**Architecture:** Add 5 RGB channel custom properties to `:root` (values are comma-separated `r, g, b` tuples — no `rgba()` wrapper). All existing declarations switch from `rgba(215,196,155,.16)` to `rgba(var(--ui-line-rgb),.16)`. CSS performs text substitution; computed values are identical. No visual change.

**Tech Stack:** Vanilla CSS, Python 3 (for mechanical replacement), `npm run verify` (prettier + syntax check + Playwright screenshots)

---

## File Map

- **Modify:** `styles.css` — add channel vars to `:root`, replace 185 hardcoded rgba occurrences
- **Backup:** `styles.css.bak` — created before any edits, deleted after verify passes

---

### Task 1: Backup and baseline

**Files:**
- Create: `styles.css.bak` (copy of styles.css before changes)

- [ ] **Step 1: Create backup**

```bash
cp styles.css styles.css.bak
```

Expected: `styles.css.bak` appears in project root.

- [ ] **Step 2: Confirm occurrence counts before touching anything**

```bash
python3 - <<'EOF'
import re
with open("styles.css") as f:
    content = f.read()
targets = [
    ('rgba(215,196,155,', '--ui-line-rgb'),
    ('rgba(214,170,88,',  '--ui-gold-rgb'),
    ('rgba(201,154,74,',  '--ui-gold-alt-rgb'),
    ('rgba(138,48,42,',   '--ui-danger-rgb'),
    ('rgba(238,231,218,', '--ui-hi-rgb'),
]
for raw, var in targets:
    count = content.count(raw)
    print(f"{count:4d}  {raw}  →  var({var})")
EOF
```

Expected output:
```
 129  rgba(215,196,155,  →  var(--ui-line-rgb)
  32  rgba(214,170,88,   →  var(--ui-gold-rgb)
   5  rgba(201,154,74,   →  var(--ui-gold-alt-rgb)
  15  rgba(138,48,42,    →  var(--ui-danger-rgb)
   4  rgba(238,231,218,  →  var(--ui-hi-rgb)
```

If counts differ, stop and investigate before proceeding.

---

### Task 2: Add channel variables to `:root`

**Files:**
- Modify: `styles.css` — `:root` block at top of file

The existing `:root` block starts with:
```css
:root{--ui-bg:#020202;--ui-bg-2:#050505; …
```

- [ ] **Step 1: Add channel variables after existing tokens**

Open `styles.css` and find the `:root{` block. Append these 5 variables **before the closing `}`** of the `:root` rule. The existing variables must not change.

Add exactly:
```css
--ui-line-rgb:215,196,155;--ui-gold-rgb:214,170,88;--ui-gold-alt-rgb:201,154,74;--ui-danger-rgb:138,48,42;--ui-hi-rgb:238,231,218;
```

After the edit, the `:root` block must contain all existing variables plus these 5 new ones.

- [ ] **Step 2: Verify the variables are present**

```bash
grep -o '\-\-ui-line-rgb:[^;]*' styles.css
```

Expected:
```
--ui-line-rgb:215,196,155
```

---

### Task 3: Replace hardcoded rgba values (mechanical)

**Files:**
- Modify: `styles.css`

Run this Python script from the project root. It replaces only the 5 targeted base colors and writes back in place:

- [ ] **Step 1: Run replacement script**

```bash
python3 - <<'EOF'
with open("styles.css") as f:
    content = f.read()

replacements = [
    ('rgba(215,196,155,', 'rgba(var(--ui-line-rgb),'),
    ('rgba(214,170,88,',  'rgba(var(--ui-gold-rgb),'),
    ('rgba(201,154,74,',  'rgba(var(--ui-gold-alt-rgb),'),
    ('rgba(138,48,42,',   'rgba(var(--ui-danger-rgb),'),
    ('rgba(238,231,218,', 'rgba(var(--ui-hi-rgb),'),
]

for old, new in replacements:
    before = content.count(old)
    content = content.replace(old, new)
    after = content.count(old)
    print(f"Replaced {before - after} of {before} occurrences: {old} → {new}")

with open("styles.css", "w") as f:
    f.write(content)

print("Done.")
EOF
```

Expected output:
```
Replaced 129 of 129 occurrences: rgba(215,196,155, → rgba(var(--ui-line-rgb),
Replaced 32 of 32 occurrences: rgba(214,170,88, → rgba(var(--ui-gold-rgb),
Replaced 5 of 5 occurrences: rgba(201,154,74, → rgba(var(--ui-gold-alt-rgb),
Replaced 15 of 15 occurrences: rgba(138,48,42, → rgba(var(--ui-danger-rgb),
Replaced 4 of 4 occurrences: rgba(238,231,218, → rgba(var(--ui-hi-rgb),
Done.
```

- [ ] **Step 2: Confirm zero remaining hardcoded values**

```bash
python3 - <<'EOF'
with open("styles.css") as f:
    content = f.read()
targets = ['rgba(215,196,155,', 'rgba(214,170,88,', 'rgba(201,154,74,', 'rgba(138,48,42,', 'rgba(238,231,218,']
all_clear = True
for t in targets:
    count = content.count(t)
    if count > 0:
        print(f"REMAINING: {count} × {t}")
        all_clear = False
if all_clear:
    print("All clear — 0 hardcoded rgba values remaining.")
EOF
```

Expected: `All clear — 0 hardcoded rgba values remaining.`

If any remain, check for spacing variants (e.g. `rgba(215, 196, 155,` with spaces) and add them to the replacement list.

---

### Task 4: Verify — no visual change

**Files:**
- Read: screenshots in `design-review/`

- [ ] **Step 1: Run full verify suite**

```bash
npm run verify
```

Expected: all format checks pass, all screenshots match baselines. If screenshots differ, compare the diff — if it's a legitimate visual regression (not just antialiasing noise), restore from backup and investigate.

- [ ] **Step 2: If verify fails — restore from backup**

```bash
cp styles.css.bak styles.css
```

Then re-read the script output to find remaining/missed patterns.

---

### Task 5: Commit and clean up

- [ ] **Step 1: Remove backup file**

```bash
rm styles.css.bak
```

- [ ] **Step 2: Commit**

```bash
git add styles.css
git commit -m "css: replace hardcoded rgba with channel vars (--ui-line-rgb, --ui-gold-rgb, --ui-danger-rgb) for theme-readiness"
```

- [ ] **Step 3: Confirm no new !important added**

```bash
python3 - <<'EOF'
import re
with open("styles.css") as f:
    content = f.read()
count = len(re.findall(r'!important', content))
print(f"Total !important: {count}")
print("Was: 2691 — delta should be 0")
EOF
```

Expected: `Total !important: 2691` (unchanged).

---

## Self-Review

**Spec coverage:**
- ✅ Add 5 channel variables to `:root`
- ✅ Replace all 185 rgba occurrences
- ✅ `npm run verify` passes
- ✅ Zero hardcoded rgba remaining for the 5 base colors
- ✅ No new `!important` added
- ✅ `styles.css` only file touched
- ✅ Backup before edits

**Placeholder scan:** No TBD, no "handle edge cases", all steps have exact commands and expected output.

**Type consistency:** N/A — no function types, pure CSS/shell.
