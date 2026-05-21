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
| `931592c` | test: add topbar popover visual coverage |
| `5a29a5d` | style: remove shadowed topbar popover CSS |
| `defec3e` | style: remove shadowed template card title CSS (ri359 line-sharing resolved) |
| `39ceb7c` | style: remove shadowed export structural CSS (panel dimensions + tab stacking) |
| `d3d6976` | style: remove shadowed sidebar selector entries (slic commit 1, 6 entries) |
| `fe15054` | style: remove shadowed export card selector entries (slic commit 2, 4 entries) |
| `a3b7b12` | style: remove shadowed layer manager selector entry (slic commit 3, 1 entry) |
| `6cba7e9` | style: remove shadowed backdrop and export grid selectors (slic commit 4, 6 entries) |
| `d3549d2` | style: remove shadowed template preview selectors (slic commit 5, 2 entries) |
| `dbe8e1a` | style: remove shadowed template export selector entries (slic commit 6, 7 entries) |
| `55b6f68` | style: remove shadowed v422 alias selectors (slic commit 7, 7 entries) |
| `2ca3f45` | style: remove shadowed S1 non-important CSS (Batch A, 5 substrings) |
| `3b738fb` | style: remove shadowed S1 var-equivalent CSS (Batch B, 2 rules + ri2 selector shrink) |

---

## Current state

**`!important` count:** 3,082 (−2 from Batch B whole-rule deletes)

**Cascade audit (fresh after 3b738fb):**
- Total lines: 4,160
- Raw rules parsed: 899
- !important count: 3,082
- Whole-rule deletion candidates: 3 (all on line 2 — Batch C)
- Selector-list item removal candidates: 4 (all on line 2 — Batch D)
- Visual QA coverage: 20/20 screenshots

**All non-line-2 selector-list surgery is complete. Remaining cleanup is line 2 / S1 only.**

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

### Topbar section popover visual coverage (commit `931592c`)
Added `desktop-topbar-section-popover` to `tests/visual-review.spec.js`. The scenario opens the `Panel ▾` topbar section control and waits for `.toolbar-popover.topbar-section-popover`.

Verify: 20/20.

### Topbar section popover CSS cleanup (commit `5a29a5d`)
1 whole-rule deletion, −4 lines, 0 `!important` removed. Verify: 20/20.

Rule removed: `.toolbar-popover.topbar-section-popover { width: min(360px, calc(100vw - 16px)); }`.

Rationale: the early non-important `width` rule was fully shadowed by the later scoped topbar popover repair rule, which sets the same `width` plus `max-width` and `overflow-x` with `!important`. Coverage was unblocked by `desktop-topbar-section-popover`.

### Template card title CSS — deferred ri359 resolved (commit `defec3e`)
1 shadowed rule removed via substring extraction from minified L241, −3 `!important`. Verify: 20/20.

Rule removed: `.template-card-main h3,.template-card-main strong{font-size:14px!important;color:#f2dfb2!important;margin:0 0 4px!important}` — this rule was deferred in the non-line-2 mixed batch because it shared the same minified source line with the live `.template-card-actions{...}` rule. Resolution: the dead rule prefix was stripped, leaving the live rule intact on that line.

### Export structural CSS cleanup — panel dimensions and tab stacking (commit `39ceb7c`)
3 whole-rule deletions, −8 lines, −8 `!important`. Verify: 20/20.

Rules removed:
- `.export-dialog-panel{grid-template-rows:auto auto minmax(0,1fr) auto!important;width:min(1080px,calc(100vw - 44px))!important}` — v429 panel dimensions (shadowed by v444 winner)
- `.export-tab-body > *{position:relative!important;z-index:2!important;pointer-events:auto!important}` — stacking context override (deferred due to z-index/pointer-events concern; winner confirmed present)
- `.export-dialog-panel{width:min(1180px,calc(100vw - 44px))!important;height:min(790px,calc(100vh - 44px))!important;grid-template-rows:auto minmax(300px,40vh) auto minmax(250px,1fr)!important;}` — v437 panel dimensions (shadowed by v444 winner)

Note: `desktop-export-report` visual output confirmed unchanged before/after (before/after PNG hashes identical). The removal of `.export-tab-body > *` stacking did not affect any screenshot.

### Selector-list surgery — slic commits 1–7

Seven commits, 33 selector entries removed. `!important` count unchanged (selector strings carry no `!important`). All 20/20 screenshots passed for each commit.

**Commit 1 — `d3d6976` — sidebar/shell (6 entries):**
- `ri211` L56: stripped `.component-library-shell` from `[style],.component-library-shell{display:none}` — winner: ri681|L2432 (`display:block`)
- `ri246` L94: stripped `.sidebar-left` from `.sidebar-left,.sidebar-right{font-size;line-height}` — winner: ri665|L2297
- `ri252` L108: stripped `.sidebar-left input[type="checkbox"]:checked` — winner: ri672|L2364
- `ri253` L110: stripped `.sidebar-left input[type="checkbox"]:checked::after` — winner: ri673|L2369
- `ri254` L112: stripped `.sidebar-left input[type="radio"]` — winner: ri674|L2377
- `ri255` L113: stripped `.sidebar-left input[type="radio"]:checked::after` — winner: ri675|L2381

**Commit 2 — `fe15054` — export cards (4 entries):**
- `ri356` L237: stripped `.export-package-card`, `.export-recommended-banner`, `.runtime-diagnostics-card` from 4-selector card rule — `.export-preview-card` is the sole survivor
- `ri475` L730: stripped `.export-sanity` from 4-selector padding/margin/line-height rule — live: `.export-package-card`, `.export-recommended-banner`, `.runtime-diagnostics-card`

**Commit 3 — `a3b7b12` — layer manager (1 entry):**
- `ri496` L856: stripped `.layer-manager-presets` from `.compact-render-row,.layer-manager-presets{display:grid;...}` — `.compact-render-row` is the sole survivor

**Commit 4 — `6cba7e9` — backdrop + export grids (6 entries):**
- `ri289` L154: stripped `.template-manager-backdrop`, `.local-projects-backdrop`, `.export-dialog-backdrop`, `.command-palette-backdrop` from 5-selector backdrop z-index rule — `.app-modal-backdrop` is the sole survivor
- `ri479` L758: stripped `.export-options-grid` and `.kicad-export-grid` from 3-selector export grids rule — `.export-action-grid` is the sole survivor

**Commit 5 — `d3549d2` — template preview (2 entries):**
- `ri424` L410: stripped `.template-manager-panel .template-preview-realistic` from 3-selector preview container rule — live: `.library-real-preview`, `.template-preview-empty`; winner: ri458|L589 v436 solo rule
- `ri425` L420: stripped `.template-manager-panel .template-preview-realistic svg` from 2-selector SVG rule (becomes single-selector) — `.library-real-preview svg` is the sole survivor; winner: ri459|L602 v436 solo rule

**Commit 6 — `dbe8e1a` — v429 templates/export complex compounds (7 entries):**
- `ri343` L223: stripped `.template-manager-panel>div:first-child` and `.export-dialog-header` — sole survivor: `.local-projects-toolbar`
- `ri344` L224: stripped `.template-manager-panel h2` and `.export-dialog-title` — sole survivor: `.local-projects-panel h2`
- `ri345` L225: stripped `.export-dialog-subtitle` and `.template-manager-panel p` — sole survivor: `.template-preset-note`
- `ri350` L230: stripped `.template-card-realistic` — live: `.template-card-main`, `.preset-card-button`

**Commit 7 — `55b6f68` — v422 alias selectors (7 entries):**
- `ri177` L18: stripped `.workspace` from `.main,.workspace,.editor-layout,.panel-designer-layout` — winner: ri207|L52 v423 solo rule
- `ri178` L19: stripped `.sidebar-left` from `.left-sidebar,.sidebar-left,.left-panel,.drawer-left` — winner: ri208|L53 v423 solo rule
- `ri179` L20: stripped `.sidebar-right` from `.right-sidebar,.sidebar-right,.right-panel,.drawer-right` — winner: ri209|L54 v423 solo rule
- `ri180` L21: stripped `.canvas-wrap` from `.center,.canvas-wrap,.canvas-area,.editor-center,.stage-wrap` — winner: ri212|L57 v423 solo rule
- `ri183` L24: stripped `.section` from `.section,.sidebar-section,.panel-section,details` (details preserved) — winner: ri226|L70 v423 solo rule
- `ri185` L26: stripped `.field-row` from `.row,.field-row,.form-row` — winner: ri228|L72 v423 solo rule
- `ri186` L27: stripped `.field-row label` from `.field-row label,.form-row label` (sole survivor: `.form-row label`) — winner: ri229|L73 v423 solo rule

### S1 Batch A — non-important whole-rule deletes from line 2 (commit `2ca3f45`)
5 substrings removed from the minified line 2. 0 `!important` delta (all deleted declarations were non-important). Braces balanced before and after. Verify: 20/20.

Rules removed (all on line 2, section v376-clean-style): `.template-manager-backdrop` (z-index:6500), `.local-projects-panel` (width:min(92vw,620px)), `.inline-modal-card` (5 non-important declarations), `.inline-modal-title` (5 non-important declarations), `.inline-modal-actions` (4 non-important declarations).

### S1 Batch B — var-equivalent important-to-important cleanup (commit `3b738fb`)
2 whole-rule deletes + 1 selector-list shrink on line 2. −2 `!important`. Braces balanced (172→170 pairs). Verify: 20/20.

- Deleted `.sidebar-left{border-right:1px solid var(--ui-line)!important}` — var resolves to same value as later winner (rgba(215,196,155,.13))
- Deleted `.sidebar-right{border-left:1px solid var(--ui-line)!important}` — same rationale
- Shrunk ri2 selector list: `html,body,#root,.app` → `.app` — `html`/`body`/`#root` all shadowed by v423 winner; `var(--ui-bg)` resolves to #020202, `var(--ui-text)` resolves to #eee7da

Post-Batch-B fresh audit: 3 whole-rule candidates, 4 slic candidates (all line 2).

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
~~**Topbar section popover shadowed rule** (`.toolbar-popover.topbar-section-popover`)~~ ✅ Done (coverage `931592c`, cleanup `5a29a5d`)
~~**Template card title CSS** (ri359 line-sharing resolved)~~ ✅ Done (commit `defec3e`)
~~**Export structural CSS** (panel dimensions ×2 + tab stacking)~~ ✅ Done (commit `39ceb7c`)
~~**Selector-list surgery commits 1–3** (11 entries)~~ ✅ Done (`d3d6976`, `fe15054`, `a3b7b12`)
~~**Selector-list surgery commits 4–5** (8 entries)~~ ✅ Done (`6cba7e9`, `d3549d2`)
~~**Selector-list surgery commit 6** (7 entries — v429 templates/export)~~ ✅ Done (`dbe8e1a`)
~~**Selector-list surgery commit 7** (7 entries — v422 aliases)~~ ✅ Done (`55b6f68`)
~~**S1 Batch A** (5 non-important substrings)~~ ✅ Done (`2ca3f45`)
~~**S1 Batch B** (2 whole-rule deletes + ri2 selector shrink)~~ ✅ Done (`3b738fb`)

**Fresh audit (post-3b738fb) — 3 whole-rule candidates (all L2), 4 slic candidates (all L2):**

**All non-line-2 cleanup is complete.**

**Whole-rule (3, all line 2 / S1 — Batch C):**
`.app-brand`, `.component-hover-card`, `.inline-modal-actions button.danger` (ri155 — blocked until danger-state screenshot exists).

**Selector-list item candidates (4, all line 2 / S1 — Batch D):**

| Group | Count | Area | Key dead selectors |
|-------|-------|------|--------------------|
| L2/S1 | 4 | Line 2 | `.section-title`, `.sidebar-title`, `.sidebar-left .section-title`, `.toolbar-popover button` |

**Remaining cleanup: line 2 / S1 surgery only.**
- Batch C: value-different whole-rule deletes (`.app-brand`, `.component-hover-card`); ri155 (`.inline-modal-actions button.danger`) blocked until danger-state screenshot coverage exists.
- Batch D: value-different selector-list surgery (4 entries across 3 rules).
- ri155 blocked: danger button background/color/border-color differ between shadowed and winner values — visual coverage of the delete-confirmation danger state required before removal.

---

## Process notes

- Each deletion batch must pass `npm run verify` (20/20 screenshots) before commit.
- Only `styles.css` should appear in `git diff --name-only` after a CSS-only cleanup commit.
- Whole-rule deletion (all selectors dead) is safe. Selector-list surgery (mixed live/dead) requires Codex review.
- The `verify` screenshots in `design-review/verify-tmp/` are gitignored and serve as the visual regression check.
