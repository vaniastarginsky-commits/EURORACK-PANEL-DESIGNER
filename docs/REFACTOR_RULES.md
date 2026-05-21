# Refactor Rules

These rules apply to every refactor pass. They exist to prevent regressions
introduced by "cleanup" changes that silently break layout, behavior, or the
visual QA baseline.

## Layout invariants

- **Preserve the left vertical canvas tool rail on desktop.** `CanvasToolRail`
  renders as a left-side icon column. Do not move canvas tools into the topbar
  or collapse them into a floating button.
- **Do not move canvas tools back into the topbar.** The split between
  `Topbar` (file/view menus) and `CanvasToolRail` (drawing tools) is
  intentional.
- **Preserve the mobile dock layout.** `MobileDock` is the primary navigation
  surface on narrow screens. Its structure and z-order must not change.

## Feature invariants

- **Preserve templates and realistic previews.** `FactoryTemplates.js` and the
  realistic hardware rendering in `Canvas.js` / `App.js` must remain intact.
- **Preserve lock/unlock behavior.** The per-component lock flag and the
  `LOCK_SELECTED` dispatch path must not be removed or bypassed.
- **Preserve grid/snap behavior.** `snapToGrid`, grid-size controls, and the
  snap-guide overlay must remain functional.
- **Preserve DIP-8 socket and fader/slider components.** These component types
  have non-trivial geometry and render paths. Do not silently delete or stub
  them during cleanup.
- **Do not remove the export dialog, realistic panel preview, or drill view.**

## CSS rules

- **Do not use broad `!important` patches.** Fix layout bugs at the source
  (JS state, class logic, or targeted CSS selectors), not by overriding the
  cascade globally.
- **Do not touch `styles.css` unless the task explicitly requires a CSS
  change.** Incidental CSS edits during JS refactors introduce unpredictable
  visual side-effects.

## Verification rules

- **Run `node --check src/*.js` after every meaningful change.** Syntax errors
  in any file silently break the whole app because all scripts share one global
  scope.
- **Run `npm run screenshot` after every meaningful change.** The 10 visual
  regression captures in `design-review/after/` are the ground truth for "did
  anything visually break."
- **Do not update committed screenshots unless the task explicitly requires a
  visual change.** If screenshots diff unexpectedly, treat it as a regression
  and investigate before committing.
- **Run `npm run verify` before committing a refactor pass.** This runs
  format-check, syntax-check, and screenshot capture in sequence.

## Scope rules

- **Do not add features during a refactor pass.** New behavior belongs in a
  separate branch and commit.
- **Do not redesign the UI during a refactor pass.** Visual changes during
  structural cleanup make regressions impossible to attribute.
- **Do not modify behavior unless the change is strictly required for cleanup.**
  If extracting a function changes its observable behavior, that is a bug, not
  a refactor.
- **Keep each step small and independently verifiable.** A step that touches
  more than one concern at a time is two steps.
