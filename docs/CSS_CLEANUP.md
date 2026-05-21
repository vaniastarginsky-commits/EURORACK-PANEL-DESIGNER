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
| `ecab357` | style: remove shadowed export dialog cascade rules (batch #1, 10 rules) |
| `3785f06` | test: add export dialog visual coverage (PNG, Package, Report tabs) |
| `b831864` | style: remove shadowed export dialog layout CSS (batch #2, 15 rules) |
| `281b507` | style: remove remaining shadowed export dialog CSS (batch #3A, 15 rules) |
| `e893194` | style: remove shadowed KiCad export CSS (3 rules) |

---

## Current state

**Approximate `!important` count:** 3,150 (measured after e893194)

**Cascade audit (fresh after e893194):**
- Total lines: 4,236
- Raw rules parsed: 925
- !important count: 3,150
- Whole-rule deletion candidates: 29
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

### Export dialog visual coverage expansion (commit `3785f06`)
Added three new export tab screenshots to `tests/visual-review.spec.js`:
- `desktop-export-png` — PNG tab; `export-dialog-actions` footer visible in viewport
- `desktop-export-package` — Package tab; `export-recommended-banner`, `export-package-card`, `export-action-grid`
- `desktop-export-report` — Report tab; `runtime-diagnostics-card`, diagnostics list

Total visual coverage: 19 screenshots. Export dialog now has all 5 tabs covered (SVG, KiCad, PNG, Package, Report).

### Export dialog cascade batch #1 — shadowed early patches (commit `ecab357`)
10 whole-rule deletions from sections v429–v439, −33 lines, −48 `!important`.

Selectors removed: `.export-tabs` (3 versions), `.export-tabs button` (1 version), `.export-dialog-backdrop`, `.export-dialog-header` (2 versions), `.export-dialog-title`, `.export-dialog-subtitle`, `.kicad-export-grid` (overflow-only version).

All shadows verified by `design-review/css-cascade-audit.json`. Winners in v439-export-senior-layout-pass and v444-export-tabs-final-fit.

### Export dialog cascade batch #2 — layout and option rules (commit `b831864`)
15 whole-rule deletions from sections v429–v437, −44 lines, −81 `!important`. Verify: 19/19.

Selectors removed: `.export-dialog-actions`, `.export-tab-body` (×2), `.export-preview-card` (×2), `.export-preview-stats`, `.export-options-grid,.kicad-export-grid,.export-action-grid` (×2), `.export-option-row label`, `.export-dialog-panel input[type="checkbox"]` (×2), `.export-tabs button` (×2), `.export-option-row,.checklist-row`, `.export-option-row label,.checklist-row label`, `.export-preview-card svg`.

Now-covered unlock: `.export-dialog-actions` deferred in batch #1 (actions footer not in screenshots) — unblocked by `desktop-export-png`.

### Export dialog cascade batch #3A — v437–v439 layout and sub-component rules (commit `281b507`)
15 whole-rule deletions from sections v437–v439, −117 lines, −75 `!important`. Verify: 19/19.

Selectors removed: `.export-preview-stats` (v437), `.export-tabs button` (v437), `.export-tab-body` (v437 third occurrence, incl. `> div` and `h3/h4/section-title`), compound span selector (4 selectors), `.export-dialog-panel input[type="checkbox"]` (v437 third), `.export-tab-body select/input:not([type="checkbox"])`, `.export-tab-body .field-row`, `.export-tab-body .btn-row button / .export-action-grid button`, `.export-tab-body .svg-quick-actions` + button, `.export-tab-body .individual-package-files / .loose-package-files`, `.runtime-diagnostics-card` + `.checklist-row / > div`.

Note: ruleIndex numbers for this batch were re-derived from the fresh post-batch-#2 audit because batch #2 deletions shifted all subsequent ruleIndexes. The 15 candidates were matched by selector string, not original ruleIndex.

### KiCad export CSS cleanup (commit `e893194`)
3 whole-rule deletions, −14 lines, −13 `!important`. Verify: 19/19.

Rules removed: `.kicad-preset-row` (v432 occurrence, `gap:8px` single-line), `.kicad-origin-row` (v437, multi-line `grid-template-columns:90px minmax(180px,300px)`), `.kicad-preset-row` (v437 occurrence, `gap:7px` multi-line).

**Preservation note:** A non-candidate `.kicad-origin-row` at former L378 with `grid-template-columns:auto minmax(0,240px)` was correctly retained — it was not shadowed by the same winner and remains live.

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
~~**Export dialog cascade batch #1** (10 rules)~~ ✅ Done (commit `ecab357`)
~~**Export dialog cascade batch #2** (15 rules)~~ ✅ Done (commit `b831864`)
~~**Export dialog cascade batch #3A** (15 rules)~~ ✅ Done (commit `281b507`)
~~**KiCad export CSS cleanup** (3 rules)~~ ✅ Done (commit `e893194`)

**Export dialog remaining deferred:**
- `.export-dialog-panel` dimensions — two occurrences (v429 + v437); width, height, grid-template-rows; high structural risk.
- `.export-tab-body > *` — z-index:2 + pointer-events:auto; stacking context concern.

**Fresh audit (post-KiCad cleanup) — 29 whole-rule candidates, 40 selectorListItem candidates:**

Top categories:
- **v376-clean-style (10 rules):** `.sidebar-left`, `.sidebar-right`, `.app-brand`, `.component-hover-card`, `.template-manager-backdrop`, `.local-projects-panel`, `.inline-modal-card`, `.inline-modal-title`, `.inline-modal-actions`, `.inline-modal-actions button.danger` — majority on line 2 (S1 surgery required).
- **v433-desktop-dock-grid-export-templates-fix (8 rules):** `.template-manager-panel .template-card-realistic/main/actions`, `.export-tab-body > *` (deferred), `.layer-manager-presets`, `.layer-manager-name`, `.compact-render-row`, `.perf-toggle`.
- **v429-templates-export-modal-css-fix (4 rules):** `.template-card-grid,.preset-card-grid`, `.template-preview-realistic,.library-real-preview`, `.template-card-main h3/strong`, `.export-dialog-panel` (deferred).
- **v427-canvas-rail-overlap-fix (2 rules):** `.canvas-hud`, `.canvas-quick-dock`.
- **Singletons (5 rules):** `.sidebar-left .component-library-shell`, `.quick-pop-grid`, `.layer-manager-presets` (v430), `.export-dialog-panel` (v437, deferred), `.toolbar-popover.topbar-section-popover`.

**Next recommended Codex batch:**
Template manager card cascade (v433, 3–4 rules), canvas HUD/dock (v427, 2 rules), layer manager (v430/v433, 2–3 rules) — all covered by existing screenshots. Excludes S1 line-2 surgery (requires separate operation).

**Remaining visual-only candidates (line-2 surgery):**
Candidates are all on the minified line 2 (S1).
`.sidebar-left`/`.sidebar-right` border: safe but require minified-line surgery.
`.inline-modal-title`, `.inline-modal-actions button.danger`: value differences — require Codex review.
All must be treated as a single L2 surgery operation.

---

## Process notes

- Each deletion batch must pass `npm run verify` (19/19 screenshots) before commit.
- Only `styles.css` should appear in `git diff --name-only` after a CSS-only cleanup commit.
- Whole-rule deletion (all selectors dead) is safe. Selector-list surgery (mixed live/dead) requires Codex review.
- The `verify` screenshots in `design-review/verify-tmp/` are gitignored and serve as the visual regression check.
