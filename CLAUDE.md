# Project instructions

For all CSS, visual polish, redesign, frontend-design, and layout work, read and follow:

@docs/CSS_DESIGN_POLICY.md

CSS cleanup phase is complete. Do not reintroduce cascade debt.
## No-important preservation policy

`styles.css` currently has zero `!important` declarations. Keep it that way.

Rules:

- do not add `!important` to any new or existing declaration unless explicitly approved by the user;

- preserve the tokenized/semantic CSS structure (ThemeEngine vars, channel vars, 11-section domain layout);

- bugfixes only — do not refactor, restructure, or expand scope unless the user asks.

Before fixing a bug, read PROJECT_MAP.md / PROJECT_MAP.json for the affected surface.
Use the `owns` list to identify files to touch and `do_not_touch` to avoid unrelated files.
Do not edit unrelated owners.
Run `npm run verify` after any CSS or metadata change.
