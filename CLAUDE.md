# Project instructions

For all CSS, visual polish, redesign, frontend-design, and layout work, read and follow:

@docs/CSS_DESIGN_POLICY.md

CSS cleanup phase is complete. Do not reintroduce cascade debt.
## !important reduction policy

Before fixing a bug, read PROJECT_MAP.md / PROJECT_MAP.json for the affected surface.
Use the “Files to touch / Files NOT to touch” section to scope the fix.
Do not edit unrelated owners.

Allowed:

- remove dead `!important` declarations when a later canonical rule fully overrides them;

- remove redundant `!important` declarations that set the same value as the winning rule;

- remove `!important` only within the UI surface being fixed;

- report before/after count and run `npm run verify`.

Not allowed:

- global `!important` purge;

- removing unrelated declarations only to improve the count;

- replacing old `!important` with new broader selectors;

- adding new `!important` without explicit approval.
