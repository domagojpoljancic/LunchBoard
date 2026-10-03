# LunchBoard — development plan

Working name for a solo web app. Plan the lunches you will actually cook, then get a buy list and a pantry check.

The first usable version is the whole loop: library, week board, lists. Similar meals, filling empty days, and the confidence nudge come immediately after that loop works.

## Decisions

- English interface. Meat and dry goods in grams. Vegetables can be counts ("2 onions").
- One person, in the browser, including a phone while cooking.
- Calendar week. Monday–Friday start on. Any day can be turned off.
- Each planned day is its own cook. Extra portions are bought as extra food. Tomorrow is not modeled as leftovers.
- Servings default to 3 and can be changed on that day.
- Each day is **evening before** or **at lunch**. Evening before is the default. A long meal can still be chosen, with a time warning.
- Library shelves: **Can cook**, **Similar**, **Needs a recipe**.
- A starter meal stays under **Needs a recipe** until you mark **I know how to cook this**.
- A meal you add starts as **I know how to cook this**. Confidence is editable in one tap.
- Similar means the same kind of protein and the same kind of cooking.
- Every meal can gain or lose ingredients, including starter meals and sides. Each ingredient is **buy** or **pantry**. Edits are yours. The next list uses them.
- A protein option (beef mince / vegan mince) changes the shopping line and keeps one recipe.
- Sides are offered every time you place a meal. Suggested sides start selected. A one-pot starts with sides unselected.
- Buy list is flat. No aisle groups in this version. Unchecked items carry over. Checked items stay checked when the week is rebuilt. If an amount goes up, that line becomes unchecked.
- Pantry is one checklist of the seasonings used that week. Ticks reset next week.
- Recipe depth follows confidence: memory cues, a short prompt, or full steps. After three cooks, the app asks if confidence should move up.
- **Fill empty days** uses meals you know, then similar ones. It leaves a day empty rather than assigning a meal you have never cooked. It does not replace a day you already filled.
- Suggestions lean toward white meat, allow vegetarian meals, and mix proteins across the week.
- No photos. Cards are colored by protein. The board is structured, with a coach voice.
- Out of this version: aisle groups, leftover days, photos, offline mode, Google Keep, a remembered pantry.

## Screens

1. **Week board.** Days as columns. Library on the side. Empty days, time warnings, and **Fill empty days**.
2. **Meal library.** Three shelves, plus a protein filter.
3. **Meal editor.** Name, confidence, times, method, protein options, ingredients, sides, and steps.
4. **Add meal.** Name, ingredients, protein, and time.
5. **Day card.** Meal, protein option, servings, prep window, sides.
6. **Lists.** Buy list and pantry check for the open week.
7. **Cook.** The chosen day, at the recipe depth you need.

Tap to place a meal on a day. Dragging can follow once tap works on a phone browser.

## Data

- **Meal:** name, confidence, active minutes, total minutes, method, base servings, cook count.
- **Protein option:** label and protein group. One option is the default.
- **Ingredient:** name, amount, unit, buy or pantry. It belongs to the meal, to one protein option, or to a side.
- **Side:** name, time, ingredients, and which meals suggest it.
- **Week and day:** date, on or off, meal, protein option, servings, prep window, chosen sides.
- **Buy line:** name, amount, unit, checked, and whether it came from this plan or was carried over.
- **Pantry line:** name and checked, for this week only.
- **Steps:** short prompts and full steps, in order.

## List logic

For each turned-on day with a meal, take that meal’s ingredients, keep only the selected protein option, add the chosen sides, and scale amounts from the meal’s base servings. Combine lines with the same name and unit. Buy lines go to the shopping list. Pantry lines go to the weekly check.

## Build order

1. **App shell and data.** Sign-in, database, and a starter set of about twelve lunches, including Bolognese, goulash, and lasagne with a vegan mince option, plus lighter chicken, fish, bean, and grain lunches.
2. **Library and editor.** Browse, add a meal, mark confidence, and add or remove ingredients on any meal.
3. **Week board.** Turn days on and off, place a meal, set servings, protein, prep window, and sides.
4. **Lists.** Generate, check off, carry over, and rebuild after a meal or day changes. Reset the pantry check on a new week.
5. **Cook view and nudge.** Show the right recipe depth and count cooks.
6. **Similar meals and fill empty days.** Rank from the meals you know, then fill only empty days.
7. **Polish.** Protein colors, coach wording, empty states, and a cook layout readable on a phone.

Steps 1–4 are the first usable app. Steps 5–7 are what make it feel smart.

## Done when

- You can mark Bolognese as a meal you know, and add Burrata pasta yourself.
- You can remove or add an ingredient on either meal and see the buy list change.
- You can plan an uneven week, mix evening-before and lunch-hour cooking, and set portions per day.
- A beef or vegan mince choice changes the shopping line and keeps one recipe.
- Unchecked buy items survive into the next week. Pantry ticks do not.
- Fill empty days never overwrites your choices.

## Stack

Next.js, TypeScript, Postgres, email sign-in, Tailwind. Chosen for a small solo web app that still has to keep a week, a personal cookbook, and a list in sync.

## Repo reality

This repository currently contains the plan only. No application code, no database, no deploy.
