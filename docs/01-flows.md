# Flows

## Plan a week

1. The person opens the app and lands on this week’s board.
2. The library sits beside the board, grouped into Can cook, Similar, and Needs a recipe.
3. They select a meal. Empty enabled days read “Place {meal}”.
4. They click an empty day. The meal is placed with 3 servings, the day’s prep window, the default protein option, and the meal’s default sides.
5. The day sheet opens so they can change servings, protein, prep window, and sides, then close it.
6. They repeat for the days they want. Disabled days stay quiet.
7. They open Lists. The buy list and the cupboard check match the enabled days.

Clicking a day that already has a meal opens the sheet. It does not replace the meal. Replace is a control inside the sheet.

## Add a meal they already make

Example: Burrata pasta.

1. They choose Add a meal.
2. They type the name `Burrata pasta`.
3. They add lines: pasta, burrata, cherry tomatoes, basil, Grana Padano.
4. Each line starts as To buy. Basil stays To buy. If they add salt, that line starts as Cupboard.
5. They can set a protein and a time. They can skip both.
6. Save. Confidence is `KNOW`. The meal appears under Can cook.
7. They can place it the same way as a starter meal.

## Mark a starter as known

1. They find Bolognese under Needs a recipe (until something they know makes it Similar).
2. They choose “I know how to cook this”.
3. Confidence becomes `KNOW`. The meal moves to Can cook. Steps remain stored.
4. Similar meals are recomputed from the meals they know.

## Edit ingredients

1. They open any meal, starter or theirs.
2. They change a name, amount, or unit, switch Buy and Cupboard, or remove a line.
3. They add a line.
4. On save, every week that contains this meal is rebuilt.
5. The open list shows the new amounts. Checked lines follow the carry rules.

Removing the carrot from Bolognese removes carrot from future lists. It does not delete the recipe steps.

## Swap protein

1. On a day with Bolognese, they switch Beef mince to Vegan mince.
2. The list drops beef mince and adds vegan mince.
3. Onion, passata, and pasta stay.
4. The cook view steps stay the same.

## Change the prep window

1. On the day, they switch Night before to At lunch.
2. If the hands-on or total time is outside the lunch window, a sticky appears on that day.
3. The meal stays.

## Fill empty days

1. They have marked at least one meal as known, and some enabled days are empty.
2. They choose Fill empty days.
3. Filled days stay as they are.
4. Empty enabled days receive meals from the rules in `docs/00-decisions.md`.
5. If nothing qualifies, a sticky says to mark or add a meal they know.

## Cook

1. From a day, they open Cook.
2. `KNOW` shows ingredients and keypoints.
3. `PROMPT` shows keypoints.
4. `RECIPE` shows keypoints and full steps.
5. “I cooked this” adds one to `cookCount`.
6. On the 3rd, 6th, 9th cook since they last dismissed the nudge, a sticky offers the next confidence. “Not now” hides it until three more cooks. “Yes” updates confidence.

## Next week

1. They go to the next week.
2. The new week is created if needed.
3. Last week’s unchecked buy lines are imported.
4. Lines the new week also needs show a single amount, the new week’s amount.
5. Lines the new week does not need sit under Still to buy.
6. Cupboard ticks from last week are gone.

## Empty states

| Situation | What they see |
| --- | --- |
| No meal marked known, and none added | Can cook is empty. Fill explains that it needs a meal they know. |
| Day turned off | The column is quiet. Its meal is not on the list. |
| Day on, no meal | A dashed well: Place a meal, or Place {name} if one is selected. |
| Week with no meals | Lists explain that the board is empty. |
| Search with no match | The library says no meal has that name. |
