# CSS Cleanup Log

Tracks dead CSS removal on the `ux-polish` branch. Target file: `styles.css`.

---

## Completed commits

| Commit | Description |
|--------|-------------|
| `e957d30` | style: remove redundant !important from :root custom properties |
| `6f97d15` | style: remove shadowed export/template CSS rules |
| `37f88f5` | style: remove shadowed rail active-state CSS rules |
| `013f6ea` | style: remove shadowed rail checkbox CSS rules |
| `0cf0b95` | style: remove dead quick-add popover CSS |
| `a8969af` | style: remove dead rail popover CSS |
| `851322f` | style: remove shadowed export accent CSS rules |
| `7731dc9` | style: remove shadowed template card text CSS rule |
| `8e81238` | style: remove shadowed export dialog visual CSS |
| `6d9573e` | style: remove dead selectors from layer manager CSS lists |
| `2f7c7be` | style: remove dead layer selector entries (Group B surgery) |
| `23a609f` | test: add safe-zones visual coverage |
| `39505af` | style: remove dead rail exclusions from CSS guards (Group C) |
| `e9f955c` | style: remove dead rail compound CSS (Group A) |

---

## Current state

**Approximate `!important` count:** 3,367 (measured after e9f955c)

**Cascade audit (fresh after e9f955c):**
- Total lines: 4,445
- Raw rules parsed: 968
- !important count: 3,367
- Whole-rule deletion candidates: 72
- Selector-list item removal candidates: 40

---

## Dead CSS removed

### `.canvas-quick-add-popover` (commit `0cf0b95`)
4 solo rule blocks, 26 `!important` removed.
No JS implementation anywhere in `src/`. `showQuickAdd` state in `App.js` is declared but never read or rendered.

### `.inspector-rail-popover` / `.rail-popover` / `.layer-panel-body` whole-rule dead blocks (commit `a8969af`)
26 whole-rule blocks, 237 lines, 156 `!important` removed.
All three selectors have zero JS matches across `src/`.

**Key finding — CanvasLayerPanel:**
`CanvasLayerPanel()` is defined in `src/Canvas.js` and renders `.layer-panel-body` and `.layer-panel-trigger`, but the component is **never instantiated** anywhere (zero `React.createElement(CanvasLayerPanel, …)` calls in `src/`). Selectors inside a dead function body do not make CSS rules live. Confirmed by exhaustive grep.

### Safe-zones visual coverage (commit `23a609f`)
Added `desktop-safe-zones` screenshot to `tests/visual-review.spec.js`, capturing the two `rect.rail` SVG elements rendered by `MobileSafeZonesLayer` in `src/Canvas.js`. This unblocked Group A cleanup.

### Group C — `:not()` guard cleanup (commit `39505af`)
Removed `:not(.inspector-rail):not(.rail):not(.layer-panel-trigger)` from two `canvas-wrap` catch-all max-width guard rules (formerly L3182 and L3671). No whole-rule deletions; only dead exclusion terms stripped. 0 `!important` affected.

Rationale: `.inspector-rail` is not rendered; `.layer-panel-trigger` is only inside uninstantiated `CanvasLayerPanel`; `.rail` exists only on SVG `<rect>` elements which do not match HTML catch-all chains.

### Group A — `.inspector-rail` / `.rail` / `.layer-panel-trigger` compound rules (commit `e9f955c`)
13 whole-rule deletions, −63 lines, approximately −70 `!important`.

Rules spanned: top-level (2 pairs), two `@media(max-width:900px)` blocks (2 pairs each), and `@media(max-width:0px)` block (1 pair — dead media query). Selectors covered: base, `button`, `button:last-child`, `button:hover`, `button.active`.

**Key finding — pointer-events correction:**
`styles.css` rule at the former L301 applied `pointer-events:auto!important` to `.rail`, which **overrode** the parent `<g style={{ pointerEvents: "none" }}>` declared in `MobileSafeZonesLayer` (Canvas.js:2554). Deleting this rule restored the intended non-interactive behavior of the visual-only safe-zone rect overlays. This was a corrective deletion, not a neutral one.

Also confirmed: `@media(max-width:0px)` at former L2928 is a permanently dead media query. All rules inside it (including the L3011–L3027 rail block) could never apply to any real viewport.

---

## Deferred — do not touch without Codex review

The following cases require selector-list surgery (live selectors mixed with dead ones in the same rule) or carry ambiguity risk. Do not edit these without a separate Codex adversarial pass.

### S1 — L2 minified base block
Remove `.inspector-rail-popover` (and `.local-projects-dialog`, `.component-picker`) from an 11-selector compound rule on the large minified line 2. 8 live selectors remain. High edit risk due to single-line minified format.

~~### S2 — button rule~~ ✅ **Done** (commit `6d9573e`)
~~### S3 — button.active rule~~ ✅ **Done** (commit `6d9573e`)
~~### S4 — label rule~~ ✅ **Done** (commit `6d9573e`)
~~### Group B — .hardware-style-mini / .rail-segment-grid / .rail-preset-row / .rail-layer-grid / .layer-toggle-grid~~ ✅ **Done** (commit `2f7c7be`)

Group B removed 16 dead selector entries from 9 rules (27 lines net, −9 `!important`).
Whole-rule deletes: `.rail-layer-grid,.layer-toggle-grid` rules ×2.
Selector-list surgery: stripped dead entries from 7 mixed rules.
Live selectors preserved: `.compact-render-row`, `.layer-manager-presets`, `.layer-toggle`,
`.layer-manager-line`, `.layer-manager-name`, `.layer-toggle span`.

~~### `.layer-panel-trigger` compound cleanup~~ ✅ **Done** (commit `e9f955c`)
~~### `.inspector-rail` compound cleanup~~ ✅ **Done** (commit `e9f955c`)
~~### `:not(.layer-panel-trigger)` guard removal~~ ✅ **Done** (commit `39505af`)
~~### `.rail` ambiguity~~ ✅ **Resolved** — `desktop-safe-zones` screenshot (commit `23a609f`) confirmed visual coverage; Group A cleanup proceeded (commit `e9f955c`).

### Layout-sensitive candidates
Rules touching `position`, `z-index`, `width`, `overflow`, `display` on components with existing screenshot coverage should be reviewed against the visual baseline before deletion.

### Value-different candidates
Rules that differ in property values (not just shadow/override) require manual visual diff before removal.

---

## Next recommended Codex-reviewed batch

~~**Export dialog var/hex group** (#378, #452, #463, #577)~~ ✅ Done (commit `851322f`)
~~**Group A — .inspector-rail / .rail / .layer-panel-trigger compound rules**~~ ✅ Done (commit `e9f955c`)
~~**Group C — :not() guards**~~ ✅ Done (commit `39505af`)

**Remaining visual-only candidates (line-2 surgery):**
Candidates rule #6/7/120/155 are all on the minified line 2 (S1).
`#6`/`#7` (`.sidebar-left`/`.sidebar-right` border) are safe but require minified-line surgery.
`#120`/`#155` (`.inline-modal-title`, `.inline-modal-actions button.danger`) involve value differences — require Codex review.
All four must be treated as a single L2 surgery operation.

**Fresh audit top candidates (whole-rule, non-line-2):**
72 whole-rule candidates and 40 selector-list item candidates remain per `design-review/css-cascade-audit.json`.
Top concentrated areas: `.export-dialog-panel` family (v429–v444 patches), `.sidebar-left` input controls (v424/v447 patches), `.template-manager-panel` / `.export-dialog-backdrop`.
Next recommended Codex batch: export dialog cascade consolidation (high shadow count, clearly superseded earlier blocks).

---

## Process notes

- Each deletion batch must pass `npm run verify` (16/16 screenshots) before commit.
- Only `styles.css` should appear in `git diff --name-only` after a CSS-only cleanup commit.
- Whole-rule deletion (all selectors dead) is safe. Selector-list surgery (mixed live/dead) requires Codex review.
- The `verify` screenshots in `design-review/verify-tmp/` are gitignored and serve as the visual regression check.
