# CSS Design Policy

## Status

CSS cleanup phase is complete.

Current meaning:
- wholeRuleCandidates: 0
- selectorListItemCandidates: 0
- remaining !important declarations are active architectural/theme/layout declarations, not known dead/shadowed cleanup candidates
- future design work must improve CSS health gradually and must not create new cascade debt

## Core principle

Design work must not add new cascade debt.

Every visual/design pass should:
- improve the target UI state
- avoid new !important
- prefer existing canonical/final rules
- reduce local CSS debt when safe
- keep changes scoped to one UI area
- run visual verification

## No new !important

Default rule:
- Do not add new !important declarations.

Allowed only if:
- there is no safe alternative
- the reason is documented in the commit/report
- the change is scoped
- npm run verify passes
- the user explicitly approves the new !important

If a task appears to require a new !important:
1. stop
2. identify which existing rule is winning
3. propose editing the canonical/final rule instead
4. ask before proceeding

## Opportunistic !important reduction

When touching an existing selector/declaration:
- check whether the existing !important is still required
- if removing it preserves computed styles in covered screenshots, remove it
- if uncertain, keep it and report why
- do not remove unrelated !important declarations

Rule:
Design first. Important reduction is scoped, opportunistic, and verified.

## Edit canonical rules, not patch layers

Prefer editing the current/final rule for the UI area.

Do not append new emergency sections such as:
- final-final-fix
- qa-polish-2
- override-fix
- emergency-layout-fix

Before editing:
- identify the UI area
- identify the current canonical/final rule
- identify older rules only if relevant

## Scope discipline

One pass should target one UI area:
- export dialog
- templates dialog
- inline modal
- topbar/popover
- sidebars
- layer manager
- canvas/HUD
- mobile layout

Avoid mixed-area commits unless the changes are purely mechanical.

## Visual QA requirements

Every CSS/design pass must run:

npm run verify

Expected:
- screenshots pass
- no tracked screenshot baselines change
- git diff is limited to intended files

If a visual state is not covered:
- add a screenshot scenario first
- or mark the issue as uncovered and stop before risky CSS edits

## Claude / Codex role split

Claude role:
- classify visual issues
- group batches
- identify likely selectors
- produce Codex-ready implementation prompts
- review reports

Codex role:
- implement one scoped batch
- run npm run verify
- commit
- report exact changes

Codex implementation prompts must include:
- allowed files
- disallowed files
- no new !important policy
- exact visual issue
- expected screenshot coverage
- expected diff scope
- commit message

## Design pass checklist

Before editing:
- git status is clean
- target UI area identified
- screenshot coverage confirmed
- likely selectors identified
- canonical/final rule identified
- no new !important planned

During editing:
- modify existing rules when possible
- do not reformat styles.css globally
- do not touch unrelated selectors
- do not update screenshot baselines

After editing:
- npm run verify
- confirm screenshot count/pass
- confirm no new !important
- report any removed !important
- inspect affected screenshot manually if the change is visual
- commit with focused message

## Stop conditions

Stop and ask before editing if:
- fix requires layout architecture change
- fix requires new !important
- selector is shared across multiple UI areas
- state lacks screenshot coverage
- proposed change touches z-index, overflow, position, grid-template, or global shell layout
- change would create a new override layer

## Commit report template

Each CSS/design commit report must include:
- commit hash
- UI area
- visual issue fixed
- files changed
- no new !important confirmation
- removed !important count if any
- npm run verify result
- screenshots inspected
- final git status
