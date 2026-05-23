# Knowledge capture rule

Use this file for reusable project knowledge discovered during debugging and bugfixes.

`PROJECT_MAP.md` explains where things live and who owns what.
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
- information already covered by `PROJECT_MAP.md`

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

## Finding — 2026-05-23 — placement-status-pill help text классы без CSS

### Status
Confirmed

### Symptom
«Shift+click for more» отображался на мобиле (там нет Shift).

### Root cause
Классы `desktop-placement-help` и `mobile-placement-help` существовали в `Canvas.js` но не имели CSS правил — оба элемента отображались везде.

### Fix
Добавлены правила в конец `styles.css`: `.mobile-placement-help { display: none }` по умолчанию; внутри `@media (max-width:860px),(pointer:coarse)` — скрыть `.desktop-placement-help`, показать `.mobile-placement-help`.
- `popoverPos` начальное значение: `{ left: 330, top: 80 }` — это десктопные координаты
