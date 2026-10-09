# Decisions

These are locked. The build implements them. It does not reopen them.

## Person and job

One person, working from home, planning their own lunches. They want less deciding, and a healthier mix as a second goal. They cook about three portions, often enough for dinner as well. The app still treats every planned lunch as its own cook.

They can cook some meals from memory. Some they only roughly remember. Some they will only cook with a recipe. They choose meals themselves by default, and can ask the app to fill the empty days.

## Time

Two windows, chosen per day:

| Window | Label | Comfortable when |
| --- | --- | --- |
| Evening before | Night before | Hands-on time is 60 minutes or less |
| Lunch hour | At lunch | Hands-on time is 30 minutes or less, and total time is 45 minutes or less |

Night before is the default. A meal outside the window can still be saved. The day shows a warning.

Hands-on time and total time are both stored. Oven waiting counts in total time. The warning uses both. See `docs/02-data-and-logic.md`.

## Week

- A plan is a calendar week, Monday to Sunday, in the user’s timezone.
- New weeks are created with Monday–Friday enabled and Saturday–Sunday disabled.
- Turning a day off keeps the meal on it and removes that day from the shopping list until it is turned on again.
- Servings are an integer from 1 to 12. Default is 3. The default is per day, not a global setting.

## Meals

A meal has a name, confidence, times, method, cuisine, base servings, protein options, ingredients, steps, and suggested sides.

Confidence:

| Value | Shelf | Cook view |
| --- | --- | --- |
| `KNOW` | Can cook | Keypoints only, plus ingredients |
| `PROMPT` | Can cook, with a “Roughly” chip | Keypoints |
| `RECIPE` | Similar, or Needs a recipe | Full steps |

- Starter meals begin as `RECIPE`.
- A meal the user adds begins as `KNOW`.
- Confidence is editable in one action from the library and the editor.
- After every third cook since the last dismissal, if confidence is not `KNOW`, the cook view asks to move it up one step: `RECIPE` to `PROMPT`, then `PROMPT` to `KNOW`.

Shelves are computed, not stored. Rules are in `docs/02-data-and-logic.md`.

## Ingredients

Every meal and every side can gain, lose, and edit ingredients.

Each ingredient has a name, an optional amount, a unit (`G`, `ML`, `PIECE`, `BUNCH`), and a role (`BUY` or `PANTRY`).

- An ingredient on a protein option is included only when that option is selected for the day.
- Shared ingredients are included for every option.
- New ingredients default to `BUY`.
- If the name is in the cupboard dictionary, the default role is `PANTRY` and the row says so. The user can switch it.
- Fresh onion, garlic, ginger, and basil are buy items unless the user moves them. None of them are in
  the cupboard dictionary, so a line the user types is `BUY`. The starter meals are the one exception:
  where they list garlic or ginger as `PANTRY` they mean the dried or jar measure the cook already
  keeps, which `docs/05-starter-meals.md` spells out.

Edits belong to the user. Re-seeding does not overwrite them.

## Protein options

One meal, more than one protein, one set of steps.

Bolognese, lasagne, burgers, the bean salad, and the donburi ship with two options. The day stores which option is selected. The buy list includes that option’s ingredient and hides the other.

## Sides

Sides are real records with ingredients. A meal suggests sides. Each suggestion has `defaultSelected`.

When a meal is placed on a day, the day sheet shows every suggested side. The checkboxes start from `defaultSelected`, not from the last time the user cooked it.

- A complete plate (`completePlate: true`) ships with sides unselected. They are still offered.
- A meal that needs a companion (Bolognese, burgers) ships with that companion selected.

Selected side ingredients join the shopping list and the side’s hands-on minutes join the time warning.

## Lists

- The buy list is one flat list. No aisle groups.
- Lines with the same normalized name and the same unit merge. Amounts sum, then the day scaling is already applied per line before the merge.
- Pantry items become a cupboard checklist of names, without amounts.
- The cupboard list contains only pantry ingredients used by the enabled days that have a meal.
- Checking “I have this” lasts for this week only.
- Unchecked buy lines are carried into the next week. They do not double when the new week needs the same name and unit. The line shows the new week’s amount.
- A carried line the new week does not need stays under “Still to buy”.
- Checked buy lines are not carried.
- If a rebuild increases an amount, the line becomes unchecked. If the amount stays or drops, a checked line stays checked.

## Fill empty days

One button. It fills enabled days that have no meal. It does not change a day that already has a meal.

Order of candidates: `KNOW`, then `PROMPT`, then similar `RECIPE` meals. It never places a `RECIPE` meal that is not similar.

It will not repeat a meal in the week if another candidate exists in the same tier. It prefers a meal that fits the day’s prep window, then a protein not yet used, then white meat.

If it cannot fill a day, the day stays empty and the board explains why.

## Diversity

If four or more enabled, filled days share a protein group, the board shows one dismissible sticky for that week. It never blocks confirm.

There are no calories, macros, or diet scores.

## Language and units

English. Meat, cheese, pasta, grains, and sauces in grams. Liquids in millilitres. Whole vegetables, buns, and tins-as-counts in pieces when the seed says `PIECE`.

## Out of this build

Dinner as its own plan, photos, aisle sorting, offline use, Google Keep, a pantry that remembers stock across weeks, accounts for a second person, drag and drop.

Leftover days shipped later as an opt-in per day (round-2 plan phase 4). Default remains every day its own cook.

## Stock & reality (addendum)

Locked for the Stock & reality program. Defaults for new weeks stay unchanged until the user opts in: Mon–Fri on, Sat–Sun off, `BY_DAY`, days view on, weekend collapsed, cupboard checklist week-scoped.

| ID | Decision |
| --- | --- |
| Q1 | Inventory is a separate **At home** ledger. The weekly cupboard checklist stays. |
| Q2 | Consume proteins Freezer → Fridge → Pantry. Consume dry goods Pantry → Fridge → Freezer. |
| Q3 | Undo cooked restores inventory until another decrement touches that item, or 24h, whichever comes first. |
| Q4 | Pool servings are per pool entry, default 3. |
| Q5 | Converting by-day → pool keeps meals as optional pins. |
| Q6 | Weekend expand enables Saturday and Sunday immediately. The user can turn a day off. Collapse keeps meals and disables days. |
| Q7 | Mode settings are per week, plus “use as default for new weeks”. |
| Q8 | Heating a prepared dish decrements `min(day.servings, portionsRemaining)`. Heat plans default to 1 serving. |
| Q9 | “Add purchase to inventory” is an opt-in prompt. Remember the preference. |
| Q10 | Pool target is user-set, default 5, clamped 3–7. |
| Q11 | Prepared dishes do not count toward the diversity sticky. |
| Q12 | Solo user only. All new rows are user-scoped. |
| E1 | Return-visit cook prompt after 6 hours. |
| E2 | Heat-plan confirmation increments `cookCount` only when `linkedMealId` is set. |
| E3 | Mode B is view-only until the user applies stock. |
| E4 | Portions at 0 soft-archive, with undo for 24h. |

Program rules:

- Prepared dishes are free-text names only. No dish-type taxonomy, category enum, or suggested type chips.
- One confirm pipeline: cook view, login queue, and pool cook instances call `confirmCook` / `skipCook` / `undoCook`. Never decrement stock on place, enable, week confirm, or list rebuild.
- Mode A advisories do not change `rebuildShopping`. Mode B never auto-hides `CARRIED` lines.
- Confirming a leftover does not full-decrement the source recipe again.
