# QA report

Date: 2026-10-07 (board layout, drag, and form checks)

## This pass

| Check | Result |
| --- | --- |
| Drag a library card onto a day, then drag that card to the next day | `e2e/drag.spec.ts` |
| New meal refuses a save until name, ingredients, protein, and both times are filled, and total time is at least the hands-on time | `e2e/meal.spec.ts` plus `tests/schemas.test.ts` |
| The same time rules on the meal editor | `updateMealBasicsSchema` |
| Ingredient amount that is not a number is refused; an empty amount is still allowed, because cupboard lines have none | `IngredientEditor` |
| I cooked this closes the cook view | `e2e/cook.spec.ts` returns to the week. A cook that crosses the nudge threshold leaves the nudge on the board |
| Days fit a 900px-tall desktop | `e2e/layout.spec.ts` |
| Fields share one style: 44px, one radius, ink focus, ink checkboxes and sliders | `globals.css` `.field` |

Still partial, and still called out above the status table: the editor cannot attach a side or edit steps. Cuisine stays optional. A meal does not have to name one.

## Automated

The table below is the standards audit from 2026-10-06. This pass adds two schema tests and two Playwright specs; the commands were re-run after the changes.

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | Pass |
| `npx next lint` | Pass, no warnings |
| `npm test` (52 tests, 10 files) | Pass |
| `npm run build` | Pass |
| `npm run e2e` (11 Playwright tests) | Pass |
| `npm audit --omit=dev` | 2 open: high + moderate, both build-time `postcss` inside `next` |
| Seed twice → 1 user, 12 meals | Pass (`tests/seed.test.ts`) |

## E2E coverage

| Spec | What it proves |
| --- | --- |
| `login` | Sign in lands on the current Monday |
| `plan` | Place Bolognese → the list shows beef mince |
| `board` | 3 portions with pasta on and green salad off; a library selection does not replace a filled day; portions 6 → beef mince 900 g; vegan mince → 720 g and beef mince gone; At lunch warns and keeps the meal; day off drops its ingredients and keeps the meal |
| `carry` | Ticking a line in week N removes it from week N+1 live |
| `cook` | One cook per day closes the cook view; reopening offers Cooked · Undo. A recipe meal shows Steps, a meal the cook knows shows Keypoints and no Steps |
| `drag` | Drag Bolognese onto Monday, then drag that card onto Tuesday |
| `meal` | Save is refused until name, ingredients, protein, and both times are valid |
| `fill` | Marking two meals known, then Fill, keeps the placed day and fills the rest |
| `layout` | Selected `.seg-active` contrast; 390 px never scrolls sideways |
| `screens` | Screenshots at 1440 / 390 under `e2e-artifacts/screens/`, copied to `docs/screens/audit-2026-10-06/` |

## Fixed in this audit

| Finding | Fix |
| --- | --- |
| Critical Auth.js advisories (GHSA-x445-f3h2-j279 provider-unbound OAuth cookies, GHSA-8fpg-xm3f-6cx3 auth fails open, GHSA-5jpx-9hw9-2fx4, GHSA-7rqj-j65f-68wh, GHSA-xmf8-cvqr-rfgj) | `next-auth` 5.0.0-beta.25 → beta.32, `@auth/core` 0.41.3 |
| Desktop weekend rails rendered rotated, unreadable text | Plain stacked letter, date, and On button |
| The library ticket's edit pencil sat on top of the know toggle, so marking a meal known could not be tapped | Both affordances now share one row in the ticket header |
| A meal ticket's accessible name swallowed every control inside it | The ticket carries an explicit `aria-label` of the meal (and variant) |
| Turn off had five identical accessible names, one per day | `aria-label` names the day |
| `npm run e2e` could fail prerendering `/login` from a warm `.next` | The E2E server builds cold into its own `.next-e2e`, via `distDir` in `next.config.ts`, so it cannot pick up stale chunks or fight a dev server for the shared tree |
| `docs/00-decisions.md` listed three units, and read as if garlic contradicted the seed | Lists `BUNCH`; spells out the dried/jar exception |
| `docs/04-visual-design.md` still asked for a sideways day strip on a phone | Records the vertical stack and where the call was made |

## Round-2 findings

| Finding | Status |
| --- | --- |
| U1 invisible selected text | Fixed (`@layer base`) |
| U2 narrow columns / weekend width | Fixed (rails + wider enabled days) |
| U3 mobile header overflow | Fixed (two-row header + day stack) |
| U4 library clutter | Fixed (circular know + pencil) |
| U5 editor enums | Fixed (MealBasicsForm labels) |
| U6 empty-day prep noise | Fixed |
| C1 stale carry-over | Fixed (live rebuild) |
| C2 cook spam | Fixed (`cookedAt`) |
| C3 first-run shelves | Fixed (onboarding) |
| C4 Fill repeats too early | Fixed |
| C5 leftover over-buy | Fixed (opt-in leftover days) |
| C6 cook schedule hidden | Fixed (ticket meta) |
| C7 editor completeness | Partial (basics + ingredients; protein/side/step editors still light) |
| C8 copy list | Fixed |
| C9 bunch unit | Fixed |
| B1–B3 ownership / Zod / timezone | Fixed |
| D1–D3 see the app | CI screenshots; hosted URL still needs secrets |
| U9 drag to place | Deferred (click + keyboard remain) |

## Open

| Item | Why it is open |
| --- | --- |
| `npm audit --omit=dev`: high `postcss` (GHSA-qx2v-qp2m-jg93, GHSA-6g55-p6wh-862q, GHSA-fxqj-rqcc-2cmp, GHSA-r28c-9q8g-f849) and the moderate `next` that depends on it | Only `next@16.3.8` clears them, which is a breaking major. The reachable surface is build-time CSS stringify and `sourceMappingURL` handling, over CSS this repo authors itself, so there is no request-time exposure. Upgrading is its own change with its own test pass. |
| Removing or adding an ingredient on a meal and seeing the list change | The create flow is now tested (`e2e/meal.spec.ts`). Editing a line through to the buy list is still not. The editor is `Partial` anyway. |
| A cupboard tick not appearing on the next week | `rebuildWeek` writes pantry rows fresh each week and never carries `checked`, but there is no test pinning it. |
| The three-cook nudge, Not now, and Yes | `CookView` branches on `cookCount >= nudgeDismissedAtCookCount + 3`, and `tests/cook.test.ts` covers the counting, but reaching the nudge needs three cooks on three different days, which no test drives yet. |
| Visible focus on the prep control, the portion stepper, and list checkboxes | There is one `:focus-visible` rule in `@layer base`, so it applies, but no test asserts the outline. |

`docs/07-definition-of-done.md` ticks only what one of these checks or a committed screenshot covers.
Eight boxes are open, so the README keeps its WIP banner.

## Notes on how two boxes were read

- The lunch warning is checked end to end with Bolognese (35 min hands-on), not lasagne. Lasagne's own
  numbers are in `tests/warnings.test.ts`, which walks the worked table in `docs/02-data-and-logic.md`.
- "Fill with no known meals shows the coach line" is checked as two halves: `tests/fill.test.ts` proves
  fill places nothing, and the string in `WeekBoard` matches the copy deck line for it exactly.
