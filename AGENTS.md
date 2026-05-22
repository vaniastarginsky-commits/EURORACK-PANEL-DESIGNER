# Agent instructions

For all CSS, visual polish, redesign, frontend-design, and layout work, read and follow:

docs/CSS_DESIGN_POLICY.md

No new !important declarations unless explicitly approved by the user.
Prefer existing canonical rules.
Run npm run verify before committing.
Do not update screenshot baselines unless explicitly asked.

---

# Panel Designer Agent Notes

- Keep UI behavior changes separate from tooling-only changes.
- Use `npm run dev` to serve the single-page app locally.
- Use `npm run screenshot` for the focused visual QA set in `tests/visual-review.spec.js`.
- Save new captures to `design-review/after`; keep reviewed baselines in `design-review/approved`.
- Do not update `styles.css` or app components during tooling-only tasks.
- For any canvas-related code or layout change, place at least one component on the panel and verify it can be dragged/moved before considering the check complete.

## Original reference

`reference/panel-designer-original.html` is the original clean prototype.

Use it to understand the intended simple architecture and UX.

Do not replace the current app with it.

Preserve current features while restoring this level of simplicity and ownership.
