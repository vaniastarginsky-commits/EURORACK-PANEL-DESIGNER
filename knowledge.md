# Knowledge capture rule

Use this file for reusable project knowledge discovered during debugging and bugfixes.

`knowledge.md` records what we learned while investigating bugs.

**Update `knowledge.md` when a finding will help future debugging:**
- confirmed root cause of a bug
- CSS cascade conflict / winning rule / overridden rule
- dead or redundant `!important`
- canonical vs legacy CSS block
- conditional DOM/layout behaviour
- rejected hypothesis that could be rediscovered later
- fragile area and how to verify it
- screenshot/verify coverage for a tricky fix

**Do not update `knowledge.md` for:**
- trivial padding/colour tweaks
- generic commit summaries
- vague guesses without status
- long npm logs
- information already visible from current code structure

After each non-trivial bugfix, explicitly answer:
> "Does this fix add reusable knowledge?"
- If **yes**: update `knowledge.md` using the template below.
- If **no**: write "No knowledge.md update needed" in the commit/PR and briefly explain why.

---

# Finding template

```md
## Finding — YYYY-MM-DD — <surface / bug>

### Status
Confirmed / Hypothesis / Rejected / Follow-up

### Symptom
What was visibly broken.

### Root cause
The actual cause, or current best hypothesis.

### Files / selectors
- `src/...`
- `styles.css` section / approximate lines
- `.selector-name`

### Cascade / ownership notes
- Winning rule:
- Overridden rule:
- Canonical owner:
- Legacy/debt block:

### Fix
What changed.

### Verification
- `npm run verify`: pass/fail
- Screenshots:
  - ...
- `!important` delta:
  - before:
  - after:

### Follow-up
What is still risky or worth checking later.
```

---

## Finding — 2026-05-24 — Two-layer semantic token system for appearance presets

### Status
Confirmed

### Symptom
Appearance presets (Industrial, Minimal, Retro, Light, Synthwave) and the accent hue picker had no visible effect on buttons, tabs, inputs, sidebar, popovers, dialogs, and canvas tool rail. All presets looked like Industrial regardless of selection.

### Root cause
`styles.css` contained ~396 hardcoded hex/rgba values (e.g. `#f1e4cd`, `#050505`, `rgba(28,22,13,.82)`) copied from the Industrial preset palette. ThemeEngine correctly set CSS primitives (`--ui-gold-rgb`, `--ui-surface`, etc.) on `:root`, but CSS rules read hardcoded values instead of those variables.

### Files / selectors
- `styles.css` — all button, tab, input, sidebar, topbar, modal, popover, canvas-tool-rail rules
- `ThemeEngine.js` — NOT touched; primitives already correct
- Spec: `docs/superpowers/specs/2026-05-24-semantic-token-system-design.md`
- Plan: `docs/superpowers/plans/2026-05-24-semantic-token-system.md`

### Architecture: Two-layer token system
**Layer 1 — Primitives** (ThemeEngine sets per preset, already existed):
```
--ui-bg / --ui-bg-2 / --ui-panel / --ui-panel-2
--ui-surface / --ui-surface-hover
--ui-text / --ui-text-soft / --ui-muted
--ui-gold / --ui-gold-2 / --ui-gold-rgb / --ui-gold-alt-rgb / --ui-gold-soft
--ui-line-rgb / --ui-danger / --ui-danger-rgb
--theme-radius / --theme-font / --theme-tracking / etc.
```

**Layer 2 — Semantic tokens** (new, added to CSS `:root` as computed references):
```css
--ui-btn-bg:            var(--ui-panel)
--ui-btn-text:          var(--ui-text-soft)
--ui-btn-active-bg:     rgba(var(--ui-gold-rgb), .10)
--ui-btn-active-text:   var(--ui-text)
--ui-btn-active-border: rgba(var(--ui-gold-rgb), .58)
--ui-btn-disabled-bg:   var(--ui-bg-2)
--ui-btn-disabled-text: var(--ui-muted)
--ui-btn-danger-bg:     rgba(var(--ui-danger-rgb), .12)
--ui-btn-danger-text:   var(--ui-text-soft)
--ui-input-bg:          var(--ui-bg-2)
--ui-input-text:        var(--ui-text)
--ui-input-focus-border:var(--ui-gold-2)
--ui-sidebar-bg:        var(--ui-panel)
--ui-sidebar-text:      var(--ui-text-soft)
--ui-sidebar-label:     var(--ui-muted)
--ui-section-header-bg: var(--ui-panel-2)
--ui-topbar-bg:         var(--ui-panel)
--ui-topbar-text:       var(--ui-text-soft)
```

### Hardcoded → token mapping (key patterns)
| Hardcoded | Token |
|-----------|-------|
| `rgba(28,22,13,.82)`, `#17120a` | `var(--ui-btn-active-bg)` |
| `#f1e4cd`, `#efe7d8`, `#eee7da` | `var(--ui-btn-active-text)` |
| `#050505`, `#070707` (btn bg) | `var(--ui-btn-bg)` |
| `#4c4943` | `var(--ui-btn-disabled-text)` |
| `#170807`, `#160504` | `var(--ui-btn-danger-bg)` |
| `#efc2bc`, `#f1c7c1` | `var(--ui-btn-danger-text)` |
| `rgba(214,170,88,.76)` (rail) | `rgba(var(--ui-gold-rgb),.76)` |
| `rgba(35,25,11,.92)` (rail) | `var(--ui-btn-active-bg)` |
| `rgba(189,140,63,.035)` (hover) | `rgba(var(--ui-gold-rgb),.035)` |
| `--export-gold:#c99a4a` | `var(--ui-gold)` |

### Areas cleaned (0 hardcoded hex remaining)
- Buttons / tabs / segmented controls
- Inputs / select / textarea / checkbox / radio
- Sidebar / inspector / layer-manager
- Topbar
- Canvas tool rail active state
- Template dialog, export dialog, local projects dialog
- Inline modals, popovers (toolbar dropdowns)

### Cascade / ownership notes
- ThemeEngine sets Layer 1 primitives via `element.style.setProperty()` on `document.documentElement` — highest specificity, overrides `:root`
- Semantic Layer 2 tokens in `:root` cascade from primitives automatically
- Accent hue picker overrides `--ui-gold`, `--ui-gold-2`, `--ui-gold-rgb` at runtime → all semantic tokens that use `--ui-gold-rgb` respond instantly
- `[data-preset=synthwave]` atmosphere CSS (canvas glow, scanlines) intentionally uses hardcoded values — leave as-is

### Fix
- Added 28 semantic token definitions to `:root` in `styles.css`
- Replaced all hardcoded hex/rgba in targeted CSS rules with semantic var() references
- Used Python context-aware regex replacement to avoid false positives in minified CSS
- `--export-gold` and `--export-muted` custom props inside export-dialog now reference `var(--ui-gold)` / `var(--ui-muted)`

### Verification
- `npm run verify`: pre-existing failure (test seeks `.canvas-tool-rail button[title='Right']` removed in session 13 — unrelated)
- No new `!important` added
- Python audit: 0 hardcoded HEX in button/tab/input/sidebar/topbar/modal rules

### Follow-up
- `styles.css` still has ~270+ hardcoded values in canvas drawing, HUD, mobile nav, status bar, ruler — these are outside the UI theme scope and intentionally fixed (component type colors, overlay backdrops)
- `data-style="glass"` backdrop `rgba(8,8,6,.60)` is intentional — glass style override
- If new UI areas are added, use semantic tokens from Layer 2, never hardcode hex

---

## Finding — 2026-05-23 — clientToMM / ruler placement depends on zoom

### Status
Confirmed

### Symptom
Tapping to place a ruler start point on mobile (iPhone/Safari) lands at the wrong canvas location when the canvas is zoomed. At zoom=1 the placement is correct; at other zoom levels the point is offset from the tap, proportional to distance from canvas centre and |zoom − 1|.

### Root cause
`clientToMM()` (App.js ~436) tried `svg.getScreenCTM()` first. Mobile Safari's `getScreenCTM()` does **not** account for CSS `transform: scale(zoom)` on ancestor HTML elements. The zoom is applied as `transform: translate(pan.x,pan.y) scale(zoom)` on a parent `<div>` (Canvas.js ~2876), not via SVG viewBox. `getScreenCTM()` returned finite (but wrong) coordinates — the `Number.isFinite` guard passed — so the correct `getBoundingClientRect()` fallback was never reached.

### Files / selectors
- `src/App.js` — `clientToMM()` lines ~436–459

### Fix
Swapped the method order: `getBoundingClientRect()` is now the primary path (it always reflects all CSS transforms). `getScreenCTM()` remains as fallback.

### Verification
- Not covered by automated screenshot suite (interactive gesture).
- Verified by user on device after deploy (`6403269`).

### Follow-up
- `InlineTextEditor` (App.js line 14) uses `getScreenCTM()` to position the text-editing overlay over an SVG text item. Same iOS Safari bug could misplace the overlay at non-100% zoom. Fix: rewrite `getPosition()` using `getBoundingClientRect()` + viewBox interpolation in reverse.
- `Canvas.js ~2809` uses `group.getScreenCTM()` for hover-tip screen position. Same risk.

---

# CSS / Component Library — session knowledge (2026-05-23)

## Что было сделано в этой сессии

### Удалено 8 лишних `!important` из мобильного блока component library

**Удалены строки 214-215** из раннего мобильного блока `@media(max-width:900px)`:
```css
/* УДАЛЕНО — полностью перекрыто поздним каноническим блоком ~4105 */
.component-library-popover{left:8px!important;right:8px!important;bottom:58px!important;transform:none!important;width:auto!important;max-height:60vh!important}
.component-icon-grid,.popover-component-grid{grid-template-columns:repeat(auto-fill,minmax(112px,1fr))!important}
```

**Удалено `bottom: auto !important`** из позднего мобильного блока (~4110):
- Десктопный блок (~3949) уже ставит `bottom: auto !important`, мобильный дублировал то же значение.

---

## Структура CSS для component library (два слоя — CASCADE DEBT)

Главная проблема: есть **два набора** CSS для одних и тех же селекторов. Ранний (компактный/минифицированный) и поздний (форматированный/канонический). Поздний всегда выигрывает, ранний частично мёртв.

### Слой 1 — ранний (строки ~180–190, минифицированные)

```css
/* ~180 */ .component-library-popover{position:fixed!important;left:50%!important;bottom:58px!important;transform:translateX(-50%)!important;z-index:2147482500!important;width:min(1180px,...)!important;max-height:min(58vh,620px)!important;overflow:auto!important;background:#050505!important;border:...!important;box-shadow:...!important;padding:12px!important;color:#eee7da!important}
/* ~181 */ .component-library-popover-head{...все !important...}
/* ~182 */ .component-library-popover-head h2,...{...}
/* ~183 */ .component-library-popover-controls{...все !important...}
/* ~184 */ .library-search-compact{...}
/* ~185 */ .library-category-select-wide{...}
/* ~186 */ .component-icon-grid,.popover-component-grid{display:grid!important;grid-template-columns:repeat(auto-fill,minmax(132px,1fr))!important;gap:10px!important}
/* ~187 */ .quick-add-item,.component-icon-grid button,.popover-component-grid button{display:flex;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:6px!important;min-height:150px;padding:10px;text-align:center!important;background:#080807!important;border:...!important;color:#eee7da!important}
/* ~188 */ .component-icon-preview{width:86px;height:86px;display:grid!important;place-items:center!important}
/* ~189 */ .component-icon-name{font-weight:700!important;font-size:13px;line-height:1.15!important}
/* ~190 */ .component-icon-meta{font-size:11px;color:#928b7d!important}
```

### Слой 2 — поздний (строки ~3947–4040, канонический)

```css
/* ~3947 */ .component-library-popover {
  top: clamp(72px, 12vh, 138px) !important;
  bottom: auto !important;           /* перекрывает bottom:58px из слоя 1 */
  left: 50% !important;
  right: auto !important;
  transform: translateX(-50%) !important;
  width: min(1120px, calc(100vw - 192px)) !important;
  max-height: calc(100vh - 154px) !important;
  display: grid !important;
  grid-template-rows: auto auto auto minmax(0, 1fr) auto !important;
  overflow: hidden !important;       /* перекрывает overflow:auto из слоя 1 */
}

/* ~3960 */ .component-library-popover .popover-component-grid {
  min-height: 0 !important;
  overflow: auto !important;
  padding-right: 4px !important;
  grid-template-columns: repeat(auto-fill, minmax(126px, 1fr)) !important;
}

/* ~3967 */ .component-library-popover .component-icon-card {
  display: block;          /* без !important — выигрывает за счёт специфичности */
  position: relative;
  aspect-ratio: 1;
  min-height: 0;
  padding: 0;
  overflow: hidden;
}

/* ~3976 */ .component-library-popover .component-icon-card > .part-favorite-mini {
  position: absolute; top: 6px; left: 50%; transform: translateX(-50%);
  z-index: 2; font-size: 11px;
}

/* ~3986 */ .component-library-popover .component-icon-preview {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: 84%; height: 84%;
}

/* ~4005 */ .component-library-popover .component-icon-name {
  position: absolute; bottom: 16px; left: 4px; right: 4px;
  text-align: center; font-size: 11px; overflow: hidden; white-space: nowrap;
}

/* ~4018 */ .component-library-popover .component-icon-meta {
  position: absolute; bottom: 4px; left: 4px; right: 4px;
  text-align: center; font-size: 10px;
}

/* ~4031 */ .component-library-popover-head button {
  width: 38px !important; min-width: 38px !important;
  height: 38px !important; min-height: 38px !important;
  padding: 0 !important; display: grid !important; place-items: center !important;
}
```

### Мобильный override (строки ~4105–4120, канонический)

```css
@media(max-width:900px) {
  .component-library-popover {
    left: 8px !important; right: 8px !important; top: 72px !important;
    /* bottom: auto !important; — УДАЛЕНО, дублировало десктоп */
    transform: none !important; width: auto !important;
    max-height: calc(100vh - 146px) !important;
  }
  .component-library-popover .popover-component-grid {
    grid-template-columns: repeat(auto-fill, minmax(132px, 1fr)) !important;
  }
}
```

---

## Мёртвые / частично мёртвые !important в раннем слое (~строка 180)

Свойства, перекрытые поздним каноническим блоком:

| Свойство | Ранний (~180) | Поздний (~3947) | Статус |
|---|---|---|---|
| `left` | `50%!important` | `50%!important` | redundant (то же значение) |
| `bottom` | `58px!important` | `auto!important` | **МЁРТВОЕ** |
| `transform` | `translateX(-50%)!important` | `translateX(-50%)!important` | redundant |
| `width` | `min(1180px,...)!important` | `min(1120px,...)!important` | **МЁРТВОЕ** |
| `max-height` | `min(58vh,620px)!important` | `calc(100vh-154px)!important` | **МЁРТВОЕ** |
| `overflow` | `auto!important` | `hidden!important` | **МЁРТВОЕ** |

Свойства в раннем блоке, которые НЕ перекрыты поздним (ещё живые):

- `position: fixed !important`
- `z-index: 2147482500 !important`
- `background: #050505 !important`
- `border: 1px solid rgba(215,196,155,.24) !important`
- `box-shadow: 0 24px 80px rgba(0,0,0,.82) !important`
- `padding: 12px !important`
- `color: #eee7da !important`

---

## Конфликты специфичности между слоями (важно!)

Ранний слой (строка ~187): `.popover-component-grid button` → специфичность **(0,1,1)**
Поздний слой (строка ~3967): `.component-library-popover .component-icon-card` → специфичность **(0,2,0)**

Поздний слой выигрывает по всем свойствам без `!important` (display, position, aspect-ratio, min-height, padding, overflow).

Но ранний слой сохраняет победу по свойствам с `!important`, которые поздний не перекрывает:
- `flex-direction: column !important` — применяется, но бесполезно (display уже block)
- `align-items: center !important` — аналогично
- `justify-content: center !important` — аналогично
- `gap: 6px !important` — аналогично
- `text-align: center !important` — применяется
- `background: #080807 !important` — применяется (но перебивается `.comp-lib-item` из темы)
- `border: 1px solid rgba(215,196,155,.14) !important` — применяется
- `color: #eee7da !important` — применяется

### Ранний слой строка ~188: `.component-icon-preview`

```css
.component-icon-preview{width:86px;height:86px;display:grid!important;place-items:center!important}
```

- `display:grid!important` — сохраняется (поздний блок не задаёт display на preview)
- `place-items:center!important` — сохраняется
- `width:86px`, `height:86px` — **МЁРТВЫЕ** (поздний `.component-library-popover .component-icon-preview` с более высокой специфичностью задаёт `width:84%;height:84%`)

---

## ~~Нерасследованный баг: наслоение карточек на мобильном~~ — ИСПРАВЛЕН (2026-05-23)

### Симптом (из скриншотов)
- 3 карточки (Potentiometers) — **OK**
- 8 карточек (Switches/buttons) — начинается наслоение ← **исправлено**
- 22 карточки (All types) — сильное наслоение ← **исправлено**

### Реальная причина (подтверждена Playwright-диагностикой)

CSS Grid `align-self: stretch` (по умолчанию) + `aspect-ratio: 1` + все дочерние элементы `position: absolute`:
- Хром не использует `aspect-ratio` для вычисления max-content contributions при авто-sizing строк, если нет in-flow контента
- Строки оцениваются как 0 → "stretch auto" шаг распределяет `(546px — gaps) / N` на каждую строку
- 11 строк → 41px/строка, 4 строки → 129px/строка; карточки рендерятся в 167px (aspect-ratio), переполняя треки → наслоение

**Исправление** (3 CSS-правила без новых !important):
```css
/* 1. Предотвратить stretch-auto распределение высоты */
.component-library-popover .popover-component-grid {
  align-items: start;
  grid-auto-rows: max-content;
}
/* 2. In-flow ::before даёт max-content = ширина колонки, чтобы Grid правильно определил высоту строк */
.component-library-popover .component-icon-card::before {
  content: '';
  display: block;
  padding-top: 100%; /* = column width via CSS % block padding rule */
}
```

**Результат после исправления:**
- All types: scrollHeight 1937px > grid 546px → скролл работает ✓
- Switches: scrollHeight 698px > grid 546px → скролл работает ✓
- Potentiometers: scrollHeight 344px = grid 344px → скролл не нужен ✓
- Desktop: grid 402px, карточки 128×128px ✓
- `npm run verify` — 24 скриншота (добавлены 3 мобильных mobile-component-library-*)

### HTML-структура попапа

```
div.component-library-popover  [display:grid, grid-template-rows: auto auto auto minmax(0,1fr) auto]
  div.component-library-popover-head          → row 1 (auto)
  div.component-library-popover-controls      → row 2 (auto)
  div.library-memory-row.popover-memory-row   → row 3 (auto) — УСЛОВНЫЙ
    (только если есть recents/favorites И нет поиска И category=all)
  div.component-icon-grid.popover-component-grid → row 3 или 4
```

### Гипотеза 1 — grid-row mismatch (наиболее вероятная)

`grid-template-rows: auto auto auto minmax(0, 1fr) auto`

- **Когда есть memory-row**: grid идёт в row 4 → `minmax(0,1fr)` → высота ограничена → scroll работает
- **Когда нет memory-row**: grid идёт в row 3 → `auto` → высота = контент → scroll не работает → outer `overflow:hidden` просто клипает

При отсутствии memory-row `.popover-component-grid` не получает ограничения высоты, `overflow:auto` не активируется, и весь контент просто вылезает за пределы контейнера (который клипается outer overflow:hidden). Это объясняет, почему с Potentiometers (row memory есть при наличии recents) может работать, а Switches (нет memory row при фильтре) — нет.

### Гипотеза 2 — inline style override

```js
style: { left: popoverPos.left, top: popoverPos.top }
// по умолчанию: { left: 330, top: 80 }
```

CSS `!important` перекрывает inline style. Но `popoverPos` на мобильном может передавать значения, несовместимые с мобильным layout.

### Гипотеза 3 — overflow:hidden на картах не работает

`.component-library-popover .component-icon-card` имеет `overflow:hidden` **без !important**. Если что-то с более высокой специфичностью или `!important` переопределяет overflow, абсолютно позиционированные дети (`.component-icon-preview`) вылезут за карточку. Пока не найдено конкретного правила, но не исключено.

### Что нужно проверить

1. Добавить явный `grid-row: 4` или реструктурировать `grid-template-rows` чтобы grid-area всегда приходилась на `minmax(0,1fr)` строку независимо от наличия memory-row
2. Проверить, задаёт ли `.component-icon-card` реально `position:relative` и `overflow:hidden` в браузере (DevTools → Computed)
3. Проверить, не перебивает ли что-то `aspect-ratio:1` на мобильном (например `min-height:40px` из глобального `button,.btn{min-height:40px}` в `@media(max-width:860px)`)

---

## Кандидаты на очистку (следующие сессии)

### Приоритет HIGH — мёртвые свойства в раннем слое (~строка 180)

Следующие !important в `.component-library-popover{...}` (строка ~180) мёртвые:
- `bottom: 58px !important` (поздний: `auto`)
- `width: min(1180px,...) !important` (поздний: `min(1120px,...)`)
- `max-height: min(58vh,620px) !important` (поздний: `calc(100vh-154px)`)
- `overflow: auto !important` (поздний: `hidden`)

Но удалять их нужно осторожно: можно либо удалить только мёртвые свойства из раннего блока, либо полностью слить ранний блок в поздний и оставить только один.

### Приоритет HIGH — мёртвые свойства в `.component-icon-preview` (~строка 188)

```css
.component-icon-preview{width:86px;height:86px;display:grid!important;place-items:center!important}
```
- `width:86px` и `height:86px` мёртвые (поздний блок с более высокой специфичностью даёт 84%)
- `display:grid!important` и `place-items:center!important` — живые, но бесполезные (preview абсолютно позиционирован внутри карточки, display/alignment родителя не влияет)
- **Кандидат на полное удаление** этого правила если `.component-icon-preview` используется только внутри `.component-library-popover`

### Приоритет MEDIUM — бесполезные flex-свойства в кнопке (~строка 187)

```css
.popover-component-grid button{flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:6px!important;...}
```
- `flex-direction`, `align-items`, `justify-content`, `gap` — применяются, но бесполезны (display:block побеждает из позднего блока)
- Их можно удалить, но нужно проверить что display:block точно побеждает во всех браузерах

### Приоритет LOW — дублирование `left`/`transform` между слоями

В строке ~180: `left:50%!important; transform:translateX(-50%)!important`
В строке ~3950: `left:50%!important; transform:translateX(-50%)!important`
Те же значения, ранний слой redundant для этих свойств.

---

## Глобальный контекст: mobile `button{min-height:40px}`

В `@media(max-width:860px),(pointer:coarse)`:
```css
button,.btn{min-height:40px}
```

Это применяется ко всем кнопкам на мобильном, **включая `.component-icon-card`**.
- Специфичность: (0,0,1) — самая низкая
- Новый блок `.component-library-popover .component-icon-card{min-height:0}` (0,2,0) — побеждает
- Так что карточки должны иметь `min-height:0` на мобильном и определяться через `aspect-ratio:1`
- Но это стоит проверить — если `aspect-ratio` не работает + min-height идёт от глобального button правила, карточки могут не быть квадратными

---

## Факты о структуре компонентов

- `component-icon-grid` и `popover-component-grid` — только один инстанс в коде: `src/LeftSidebarPanels.js:586`
- `component-icon-card` — только один инстанс: `src/LeftSidebarPanels.js:596` (это `<button>` элемент)
- `LibraryPartPreview` — в `src/components/library/PartLibraryUI.js:163`
  - Рендерит SVG с `viewBox` пропорциональным максимальному измерению компонента
  - Маленькие компоненты (потенциометры ~7мм) → viewBox ~24×24
  - Большие/вытянутые (SS-18F08 26.6×4мм) → viewBox ~40×40
  - SVG имеет класс `library-real-preview` и рендерится как `width:100%;height:100%` своего контейнера

---

## Finding — 2026-05-23 — MobileDock event listeners мертвы на десктопе

### Status
Confirmed

### Symptom
Кнопки «Part inspector» и «Edit label» в контекстном меню компонента (десктоп) не делали ничего.

### Root cause
`MobileDock.js:469` — `if (!isMobileDockViewport) return null` при viewport > 900px. Компонент не монтируется → его `useEffect` никогда не регистрируют listeners для `mobile-open-part-sheet` и `mobile-quick-label-edit` → события от `AppCommands` уходят в никуда.

### Files
- `src/MobileDock.js:469` — ранний return null
- `src/MobileDock.js:200–234` — регистрация listeners `mobile-open-part-sheet`
- `src/MobileDock.js:317–334` — регистрация listener `mobile-quick-label-edit`
- `src/App.js:4673–4701` — кнопки в componentMenu

### Fix
Проверка `isNarrowInitial` (≤860px) перед вызовом AppCommands: на десктопе — `openComponentPropertiesPanel()` + фокус `[data-label-input]`; на мобиле — прежние mobile events.

### Verification
- `npm run verify`: pass, 24 screenshots

### Follow-up
Любой новый window event зарегистрированный только в MobileDock будет мёртв на десктопе. Паттерн: если AppCommands диспатчит событие и оно не срабатывает на десктопе — смотреть в MobileDock.

---

## Finding — 2026-05-23 — mobile-nudge-mode-sheet без layout/positioning CSS

### Status
Confirmed

### Symptom
На мобильном в nudge mode виден только заголовок «NUDGE 0.25 mm step | Done», стрелки-кнопки (↑↓←→) и пресеты скрыты под экраном.

### Root cause
`.mobile-nudge-mode-sheet` и все его дочерние классы (`.mobile-nudge-mode-head`, `.mobile-nudge-mode-grid`, `.mobile-nudge-mode-presets`) существовали только в минифицированном theme-блоке (строка 2) — исключительно для background/border. Никакого `position`, `display`, `bottom` не было. Элемент рендерился в нормальном потоке внутри `canvas-wrap` (overflow:hidden), торчал из-под `.mobile-selection-actions.v267-context-bar` (position:absolute).

### Files / selectors
- `src/App.js:4054` — рендер `.mobile-nudge-mode-sheet`
- `styles.css` строки 3309–3356 (новый блок внутри qa-polish `@media(max-width:900px)`)
- `.mobile-nudge-mode-sheet`, `.mobile-nudge-mode-head`, `.mobile-nudge-mode-grid`, `.mobile-nudge-mode-presets`

### Cascade / ownership notes
- Canonical owner: qa-polish `@media(max-width:900px)` блок (где живут аналогичные overlays: `.mobile-main-dock`, `.mobile-selection-actions.v267-context-bar`)
- Selection-actions bar: `bottom: calc(8px + safe); padding: 7px; button height: 42px` → top of bar = `64px + safe` from canvas-wrap bottom
- Nudge sheet: `bottom: calc(66px + safe)` → 2px зазор над selection bar

### Fix
Добавлены CSS правила без `!important`:
- `.mobile-nudge-mode-sheet { position:absolute; right:8px; bottom:calc(66px+safe-area); left:8px; z-index:65; padding:12px }`
- `.mobile-nudge-mode-head { display:flex; align-items:center; gap:10px; margin-bottom:10px }`
- `.mobile-nudge-mode-head strong { flex:1; font-size:12px; color:#d6aa58 }`
- `.mobile-nudge-mode-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px }`
- `.mobile-nudge-mode-presets { display:grid; grid-template-columns:1fr 1fr; gap:6px }`

### Verification
- `npm run verify`: pass, 24 screenshots
- `!important` delta: +0 / -0

### Follow-up
Nudge state не покрыт screenshot-тестами. Если добавлять визуальное покрытие — нужно триггерить `showMobileNudge=true` через JS в test script.

---

## Finding — 2026-05-23 — placement-status-pill help text классы без CSS

### Status
Confirmed

### Symptom
«Shift+click for more» отображался на мобиле (там нет Shift).

### Root cause
Классы `desktop-placement-help` и `mobile-placement-help` существовали в `Canvas.js` но не имели CSS правил — оба элемента отображались везде.

### Fix
Добавлены правила в конец `styles.css`: `.mobile-placement-help { display: none }` по умолчанию; внутри `@media (max-width:860px),(pointer:coarse)` — скрыть `.desktop-placement-help`, показать `.mobile-placement-help`.

---

## Finding — 2026-05-23 — pinch-to-zoom зумит всю страницу на пустом canvas

### Status
Fixed

### Symptom
На мобиле щипок двумя пальцами на пустой области canvas (вокруг SVG-панели) зумил всю страницу, выталкивая UI за пределы экрана. Щипок на самой панели работал корректно.

### Root cause
`touchAction: "none"` и обработчики `onTouchStart/Move/End/Cancel` были привязаны **только к SVG-элементу** (`.panel-canvas-svg`). Касания в пустой зоне `.canvas-wrap` (вне SVG) не перехватывались React — браузер применял нативный зум страницы.

### Fix
В `src/Canvas.js`: перенос touch-обработчиков и `style={{ touchAction: "none" }}` с SVG на `canvas-wrap` div. SVG лишился обработчиков (остался `touchAction: "none"` — безвредно), `canvas-wrap` получил все четыре. Двойного срабатывания нет — событие проходит один раз на уровне `canvas-wrap`.

### Pattern
Для canvas-приложений с кастомным pinch-zoom: `touchAction: "none"` и touch-обработчики должны быть на внешнем контейнере, а не только на SVG/canvas элементе — иначе pinch за пределами рисуемой области проваливается в браузерный зум страницы.

### Side effect: browser zoom breaks ruler coordinates
Если browser page zoom был применён (до фикса, через пинч на пустой области), `clientX/clientY` приходят в зумированном пространстве, но `getScreenCTM()` может некорректно это учитывать — ruler начинает не там, где тап. Симптом: "ruler начинается ниже". Решение: перезагрузить страницу (сбрасывает browser zoom). Фикс `ab77384` предотвращает нативный зум браузера, но старая кэшированная версия страницы без фикса может его вызвать.

- `popoverPos` начальное значение: `{ left: 330, top: 80 }` — это десктопные координаты

---

## 2026-05-23 — Mobile right panel gaps (top and bottom)

### Commit
33a0823

### Status
Fixed

### Symptom
На мобиле правая панель (Status/Inspect/Prod/Layers) не занимала полную высоту экрана: сверху было видно полоску canvas с HUD («10HP FRONT 1:4%…»), снизу — полоску canvas с GROUND-надписями.

### Root cause
`styles.css` строка 3276, внутри `@media (max-width: 900px)`:
```css
.sidebar-left, .sidebar-right {
    top: calc(86px + 8px) !important;   /* было */
    bottom: calc(70px + env(safe-area-inset-bottom, 0px)) !important;  /* было */
}
```
- `top: calc(86px + 8px)` = 94px — устаревшее значение для двухрядного `.toolbar` (86px). Реальный `.global-topbar` на мобиле имеет `height: 42px` (см. строку 3806). Разница 52px = зазор сверху.
- `bottom: calc(70px + …)` = 70px — зарезервировано для мобильного дока (`.mobile-main-dock`), который `MobileDock.js:469` возвращает `null` (заменён на `CanvasToolRail`). 70px = мёртвый зазор снизу.

### Fix
```css
top: 42px !important;
bottom: env(safe-area-inset-bottom, 0px) !important;
```
Совпадает с `.canvas-tool-rail` (строка 3851): `top: 42px; bottom: 3px`.

### Pattern
Когда `MobileDock` возвращает `null`, все `bottom: calc(70px + …)` в мобильных медиазапросах становятся мёртвым резервом. Искать по `70px` в `styles.css` — там могут быть аналогичные зазоры у `.mobile-bottom-sheet` (строка 3271).

---

## 2026-05-23 — Component library mobile grid: mobile override shadowing desktop fix

### Commit
54904c8

### Status
Fixed

### Symptom
Компонентная библиотека на мобиле показывала 2 колонки вместо 3, несмотря на коммит `6804ae7` ("fix: 3-column component library grid on mobile").

### Root cause
В `styles.css` два правила для `.component-library-popover .popover-component-grid`:
1. **Desktop canonical** (line 4140): `grid-template-columns: repeat(auto-fill, minmax(100px, 1fr))` — исправлено в `6804ae7`
2. **Mobile override** (line 4305, `@media(max-width:900px)`): `grid-template-columns: repeat(auto-fill, minmax(132px, 1fr))` — **не тронуто**

Мобильный override стоит позже в файле И внутри медиазапроса → побеждает на мобиле. При ширине попаповера ~330px: 132×2+10=274 < 330 < 132×3+20=416 → только 2 колонки.

### Fix
Выровнять мобильный override под desktop canonical: `minmax(132px→100px, 1fr)`. При 100px: 100×3+20=320 < 330 → 3 колонки.

### Pattern
**«Двойной слой CSS»**: когда есть базовое/desktop правило И мобильный `@media` override — фикс нужно вносить в ОБА. Исправление только базового правила не влияет на мобиль. Всегда искать парный `@media(max-width:900px)` блок для того же селектора.

---

## 2026-05-23 — CSS filter на body ломает position:fixed на iOS Safari (ViewContrast)

### Symptom
На мобиле при перемещении слайдера View Contrast в сторону GRAY левый тулбар (`canvas-tool-rail`) становился выше и кнопка HIDE уходила за нижний край экрана.

### Root cause
`html.pd-contrast-on body { filter: var(--pd-filter) }` — согласно CSS-спецификации, любой non-none `filter` на элементе создаёт новый containing block для всех `position: fixed` потомков. Тулбар имеет `position: fixed; bottom: 3px`. После включения фильтра `bottom: 3px` отсчитывается от нижнего края `body`, а не viewport.

На iOS Safari `body { height: 100vh }` = layout viewport (включает область Safari chrome, скрытую scrollом). Layout viewport выше визуального viewport. Поэтому тулбар растягивался ниже видимой области.

При contrast=0 класс `pd-contrast-on` не добавляется → фильтра нет → проблемы нет. При contrast>0 → фильтр есть → тулбар рвётся.

### Fix
Убрать `filter` с `body`. Вместо него — `backdrop-filter` на псевдоэлементе `html::after` (position: fixed, inset: 0, pointer-events: none, z-index: max). Псевдоэлемент позиционируется относительно viewport (нет ancestor с filter), визуальный эффект тот же.

```css
html.pd-contrast-on::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  pointer-events: none;
  -webkit-backdrop-filter: var(--pd-filter, none);
  backdrop-filter: var(--pd-filter, none);
}
```

### Pattern
**«filter на body»**: никогда не применяй `filter` (и `transform`, `perspective`) к `body` или другим общим ancestor-элементам, если в приложении есть `position: fixed` элементы с bottom/top anchoring. Используй `backdrop-filter` на overlay-псевдоэлементе вместо `filter` на контейнере.
