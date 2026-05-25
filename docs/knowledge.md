# Knowledge Base — Eurorack Panel Designer

> Dated findings from non-trivial bugfixes. Each entry captures WHY the bug existed,
> not just what was changed (that's in git).

---

## 2026-05-25 — JS inline style overrides CSS drawer positioning

**Bug:** On mobile, right panel opened by double-tap (or toolbar button) had its left
edge overlapping the left CanvasToolRail.

**Root cause:** `resetRightDrawerPosition()` in `App.js` set:
```js
right.style.left = "auto";
right.style.right = "0px";
```
Inline styles have higher cascade priority than any CSS class rule. This overrode:
```css
@media (max-width: 900px) {
  .sidebar-right.open {
    left: calc(3px + var(--pd-rail-button, 54px) + 8px); /* = 65px */
    right: 8px;
  }
}
```
With `left: auto` removed, the panel's left edge was determined by `width: min(86vw, 360px)`
(from §10 Mobile base rule) + `right: 0`, which on narrow phones (≤375px) landed inside
the rail's footprint (3–53px).

**Fix:** Clear the inline styles instead of setting values:
```js
right.style.left = "";
right.style.right = "";
```
Empty string removes the inline property, returning control to the CSS class rule.

**Pattern to watch:** Any `element.style.left/right/top/bottom = "..."` call that runs
after CSS is applied will silently override positioning classes. Prefer clearing (`""`)
over setting values whenever CSS already owns the layout.

**Commit:** `e8da050` on `ux-polish`.
