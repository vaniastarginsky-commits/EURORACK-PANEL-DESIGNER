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

---

## 2026-05-26 — Fixed-position popup not scrollable when content overflows viewport but fits within CSS max-height

**Bug:** On mobile, `.canvas-tool-popover` menus (View, Snap) couldn't be scrolled — bottom content was inaccessible.

**Root cause:** `popoverStyle` in `CanvasToolRail.js` set only `top` dynamically. CSS owned `max-height: calc(100dvh - 92px)` — a large value tuned for desktop where the popup always starts near the top (~66px). On mobile, when the button sits lower (e.g. `top: 407px` on a 667px screen), the popup bottom = 407 + 320px content = 727px — 60px below the viewport edge. Since content height (320px) < CSS `max-height` (575px), `overflow: auto` never created a scrollbar. The overflowing portion was simply clipped by the viewport with no way to reach it.

**Fix:** Compute `maxHeight` inline alongside `top`:
```js
const _popoverTop = Math.max(58, Math.min(menuTop, window.innerHeight - 260));
const popoverStyle = {
  top: _popoverTop,
  maxHeight: window.innerHeight - _popoverTop - 8,
};
```
Inline styles beat CSS rules, so this always overrides the class-level `max-height`. Now, if content exceeds the available space below the popup, `overflow: auto` activates and touch-scrolling works.

**Pattern to watch:** Any `position: fixed` popup whose `top` is set dynamically (JS) while `max-height` is static (CSS) will silently clip content without a scrollbar whenever `content_height < css_max_height` but `top + content_height > viewport_height`. Always pair dynamic `top` with a computed `maxHeight = viewport_height - top - padding`.

**Commit:** `ux-polish`.
