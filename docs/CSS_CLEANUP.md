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

---

## Current state

**Approximate `!important` count:** ~3,446 (measured after 8e81238; S2/S3/S4 removed selector lines only, no `!important`)

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

---

## Deferred — do not touch without Codex review

The following cases require selector-list surgery (live selectors mixed with dead ones in the same rule) or carry ambiguity risk. Do not edit these without a separate Codex adversarial pass.

### S1 — L2 minified base block
Remove `.inspector-rail-popover` (and `.local-projects-dialog`, `.component-picker`) from an 11-selector compound rule on the large minified line 2. 8 live selectors remain. High edit risk due to single-line minified format.

~~### S2 — button rule~~ ✅ **Done** (commit `6d9573e`)
~~### S3 — button.active rule~~ ✅ **Done** (commit `6d9573e`)
~~### S4 — label rule~~ ✅ **Done** (commit `6d9573e`)

Removed 13 dead selector lines from three rules. Live selectors preserved:
`.hardware-style-mini button`, `.compact-render-row button`, `.layer-manager-presets button`,
`.layer-toggle`, `.layer-manager-line`.

Note: `.hardware-style-mini` is also inside dead `CanvasLayerPanel` (Codex warning, non-blocking).
Kept conservatively — no other call sites exist, but the selector was not in scope for this pass.

### `.layer-panel-trigger` compound cleanup
Strips `.layer-panel-trigger` from compound rules that also target `.inspector-rail` and `.rail`. Requires resolving the `.rail` ambiguity first.

### `.inspector-rail` compound cleanup
Same compound rules as above.

### `:not(.layer-panel-trigger)` guard removal
Two `canvas-wrap` catch-all rules include `:not(.layer-panel-trigger)` in their `:not()` chains. Safe to remove but depends on `.layer-panel-trigger` being confirmed dead in compound context.

### `.rail` ambiguity
`.rail` appears as a CSS nav-container class in compound rules alongside dead selectors, but also as a class on SVG `<rect>` geometry elements in `src/Canvas.js`. CSS `position`, `background`, and `border` properties do not apply to SVG elements, but the overlap makes Scomp risky until explicitly confirmed. Defer until visual smoke coverage for the SVG safe-zones layer is in place.

### Layout-sensitive candidates
Rules touching `position`, `z-index`, `width`, `overflow`, `display` on components with existing screenshot coverage should be reviewed against the visual baseline before deletion.

### Value-different candidates
Rules that differ in property values (not just shadow/override) require manual visual diff before removal.

---

## Next recommended Codex-reviewed batch

~~**Export dialog var/hex group** (#378, #452, #463, #577)~~ ✅ Done (commit `851322f`)

**Remaining visual-only candidates (line-2 surgery):**
Candidates `#6`, `#7`, `#120`, `#155` are all on the minified line 2.
`#6`/`#7` (`.sidebar-left`/`.sidebar-right` border) are safe but require minified-line surgery.
`#120`/`#155` (`.inline-modal-title`, `.inline-modal-actions button.danger`) involve value differences — require Codex review before touching.
All four must be treated as a single L2 surgery operation (S1).

---

## Process notes

- Each deletion batch must pass `npm run verify` (15/15 screenshots) before commit.
- Only `styles.css` should appear in `git diff --name-only` after a CSS-only cleanup commit.
- Whole-rule deletion (all selectors dead) is safe. Selector-list surgery (mixed live/dead) requires Codex review.
- The `verify` screenshots in `design-review/verify-tmp/` are gitignored and serve as the visual regression check.
