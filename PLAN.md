# LunchBoard plan

This file is the map. It is not the whole specification.

The app is specified across `docs/`, `agents/`, and `prompts/execute.md`. A one-click build follows those files and does not invent a simpler product.

## How to read this

| Question | Document that wins |
| --- | --- |
| What did we decide? | `docs/00-decisions.md` |
| What does the person do? | `docs/01-flows.md` |
| How does the data and the shopping list work? | `docs/02-data-and-logic.md` |
| What is on each screen? | `docs/03-screens.md` |
| How must it look and feel? | `docs/04-visual-design.md` |
| Which meals ship in the seed? | `docs/05-starter-meals.md` |
| What gets built, in what order? | `docs/06-build-order.md` |
| When is it finished? | `docs/07-definition-of-done.md` |
| What words appear in the UI? | `docs/08-copy.md` |
| Who builds which part? | `agents/` |
| What is wrong with the current build? | `docs/09-review.md` |
| What gets fixed next, in what order? | `docs/10-next-plan.md` |

If two documents disagree, the more specific one wins. Fix the other document in the same change.

## What LunchBoard is

A solo web app. You plan lunches for a calendar week on a board, from meals you know and meals you are willing to learn. Confirming the week produces a flat buy list and a cupboard checklist.

The interface is a paper planning board: a dot grid, day columns, meal tickets colored by protein, coach notes on yellow stickies. It is specified so a principal frontend engineer can build it without falling back to a generic admin template.

## Rules that do not get reopened during the build

- Lunch only. One person. English. Grams for meat and dry goods. Counts for things like onions.
- Calendar week, Monday start. Monday–Friday on. Saturday and Sunday off. Any day can be toggled.
- Each planned day is its own cook. Servings default to 3, changed per day, range 1–12.
- Prep on each day is **Night before** or **At lunch**. Night before is the default. A meal that is long for that window still saves, with a warning.
- Shelves are derived: **Can cook** (you know it, or you roughly know it), **Similar**, **Needs a recipe**.
- You can mark any meal as one you know. You can add a meal. You can add and remove ingredients on every meal, including starters and sides.
- The same meal can have two proteins. Beef mince and vegan mince share steps. The list follows the protein chosen on that day.
- Sides are chosen every time you place a meal. Defaults come from the meal, not from last week.
- Buy list is flat. Unchecked lines carry into the next week and do not double-count when the new week needs the same thing. Pantry ticks reset each week.
- **Fill empty days** fills only empty, enabled days. It uses meals you know, then similar meals. It leaves a day empty rather than assigning a meal that needs a recipe and is not similar.
- No photos, aisles, leftover-day linking, offline mode, Google Keep, or a remembered pantry in this build. Round 2 (`docs/10-next-plan.md`, phase 4) adds leftover days as an opt-in once the user agrees.
- Local database is SQLite so the app runs without Docker. The schema stays ordinary SQL.

## Done

`docs/07-definition-of-done.md` is the checklist. The build is not done when the pages exist. It is done when the list math tests pass, the week can be planned, ingredients edit through to the list, and the board matches the visual spec.
