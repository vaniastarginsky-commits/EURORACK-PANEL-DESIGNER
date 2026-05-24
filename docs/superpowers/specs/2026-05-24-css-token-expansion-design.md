# CSS Token Expansion — Design Spec
**Date:** 2026-05-24  
**Branch:** ux-polish  
**Goal:** Make `border` and `box-shadow` declarations theme-ready by replacing hardcoded `rgba()` values with CSS channel variables, enabling a future visual settings menu.

---

## Problem

`styles.css` has ~119 `border` and `box-shadow` declarations with `!important`. Most use hardcoded `rgba(215,196,155,…)` (warm white) and `rgba(214,170,88,…)` (gold) with 14+ different opacity variants. Only 2 of 33 unique color values are covered by existing tokens (`--ui-line`, `--ui-line-strong`).

A theme menu cannot work if colors are hardcoded — changing `--ui-line` has no effect on `rgba(215,196,155,.16)`.

## Approach: CSS Channel Variables

Instead of creating a token per opacity level (33+ tokens), define base RGB channel variables and use them inline with any opacity:

```css
:root {
  --ui-line-rgb: 215, 196, 155;    /* warm white — borders, lines */
  --ui-gold-rgb: 214, 170, 88;     /* gold — active states, accents */
  --ui-gold-alt-rgb: 201, 154, 74; /* slightly darker gold — focus rings */
  --ui-danger-rgb: 138, 48, 42;    /* red — delete, error states */
  --ui-hi-rgb: 238, 231, 218;      /* bright highlight — pressed/strong borders */
}
```

Usage: `rgba(var(--ui-line-rgb), .16)` — CSS does text substitution, this resolves correctly in all modern browsers.

Shadow blacks (`rgba(0,0,0,…)`) stay hardcoded — black is theme-invariant.

## Scope

**Phase 1 — Add channel variables to `:root`** (additive, zero visual change)  
Add 5 new `--*-rgb` variables alongside existing tokens.

**Phase 2 — Replace hardcoded rgba in border/box-shadow**  
Mechanical find-replace across `styles.css`:
- `rgba(215,196,155,` → `rgba(var(--ui-line-rgb),`
- `rgba(214,170,88,` → `rgba(var(--ui-gold-rgb),`
- `rgba(201,154,74,` → `rgba(var(--ui-gold-alt-rgb),`
- `rgba(138,48,42,` → `rgba(var(--ui-danger-rgb),`
- `rgba(238,231,218,` → `rgba(var(--ui-hi-rgb),`

`rgba(0,0,0,…)` and `rgba(255,255,255,…)` — leave as-is.

**Phase 3 — `npm run verify`**  
Screenshots must pass. Zero visual change expected (same computed values).

**Out of scope for this pass:**
- Removing `!important` from border/box-shadow (separate pass, needs visual verification per rule)
- Color properties (already zero !important)
- A theme settings UI component (future)

## Files

- **Touch:** `styles.css` only
- **Do not touch:** any `.js`, `.jsx` files

## Success criteria

- `npm run verify` passes, all 21 screenshots match
- `grep 'rgba(215,196,155' styles.css` returns 0 results (fully converted)
- `grep 'rgba(214,170,88' styles.css` returns 0 results (fully converted)
- No new `!important` added
- `--ui-line-rgb` defined in `:root` and resolves to `215, 196, 155`
