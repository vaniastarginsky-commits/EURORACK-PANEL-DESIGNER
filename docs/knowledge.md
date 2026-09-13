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

**Commit:** `5e3579a` on `ux-polish`.

---

## 2026-05-26 — IIFE модуль без публичного API: паттерн экспорта через window

**Контекст:** `ViewContrast.js` — самодостаточный IIFE (immediately-invoked function expression) без `window.ViewContrast`. Единственный внешний интерфейс — кастомное событие `panel-designer:toggle-view-contrast`. `AppearanceModal.js` нужен был прямой доступ (read/save) без toggle-only API.

**Решение:** В конце IIFE, перед блоком `if (document.readyState === "loading")`, добавить одну строку:
```js
window.ViewContrast = { read, save };
```
Функции `read` и `save` уже определены внутри IIFE — экспорт не меняет их поведение, только даёт внешний доступ.

**Паттерн:** Когда IIFE нужно открыть для другого модуля — не переписывать в ES-модуль, достаточно добавить `window.MyModule = { publicFn1, publicFn2 }` в самом конце тела IIFE. Существующий код остаётся нетронутым.

---

## 2026-05-26 — user-select: none на mobile не ломает ввод текста

**Факт:** `user-select: none` на `body` (или `html`) в `@media (max-width: 900px)` предотвращает нежелательное выделение текста и SVG при long-press на мобильном. При этом `input`, `select`, `textarea` **не теряют** возможность редактирования — браузер принудительно включает `user-select: text` внутри полей ввода независимо от родительского значения.

**Дополнение:** `-webkit-touch-callout: none` убирает iOS-попап («Копировать», «Выбрать всё», «Поделиться») при long-press на SVG/canvas. Не влияет на ввод текста.

**Место в коде:** §10 Mobile (`styles.css`), блок `html, body, #root`.

**Commit:** `b4fd3ec` on `ux-polish`.

---

## 2026-05-26 — Top hardware потенциометров не вращалась при изменении `rotation`

**Симптом:** При изменении угла поворота (`rotation`) у потенциометра/триммера крутился только корпус (фронтальный слой), а top hardware (ручка с индикаторной линией) оставалась на месте.

**Root cause:** В `Canvas.js`, функция рендера top hardware (`TopHardwareLayer`), все три ветки `isPotLike(c)` — нереалистичная (classic), реалистичный триммер и реалистичный обычный пот — не передавали `transform: rot` в группу `<g>`. Все остальные типы (fader, toggle, dip8socket) передавали `rot` корректно.

**Фикс:** Добавить `transform: rot` в `{ key: c.id, "data-top-hardware-id": c.id, opacity: hwOpacity }` для всех трёх групп (строки ~452, ~975, ~1014).

**Применимость:** Круговая симметрия делает вращение визуально незаметным на circle-shaped элементах (jack, button, led) — поэтому для них `rot` намеренно не применяется. Потенциометр — особый случай: индикаторная линия несимметрична.

---

## 2026-05-26 — Добавление нового типа компонента с несколькими отверстиями

**Паттерн:** Чтобы добавить компонент с несколькими отверстиями (как dip8socket или joystick), нужно затронуть 6 мест:
1. `componentDefinitions.js` — запись с размерами
2. `frontShapeGeometry.js` — `isXxx()` type check + `xxxHoles(c, cx, cy)` хелпер для позиций отверстий
3. `Canvas.js` top hardware — рендер в ветках `!realistic` и realistic
4. `Canvas.js` front shape — special case в ternary (~строка 1846)
5. `Canvas.js` componentHoles — special case в ternary (~строка 1915)
6. `exportHelpers.js` + `exportEngine.js` — export DXF/Eagle/SVG
7. `componentSorting.js` — порядок в библиотеке

**Joystick-специфика:** `holeDiameter: 30` = центральное вырезанное отверстие (под резиновый чехол); 4 крепёжных M3 отверстия (3.2mm) на радиусе 17.5mm под углами 45°/135°/225°/315°; `frontDiameter: 40` = внешний обод (для collision/selection).
