# Screens

Layout, color, and type are in `docs/04-visual-design.md`. Words are in `docs/08-copy.md`. This file is structure and behavior.

## Week board

Route: `/week/[weekStart]`.

Regions: top bar, library, seven day columns, optional coach sticky above the columns.

### Library behavior

- Shelves come from `docs/02-data-and-logic.md`.
- Protein pills filter within shelves. “All” is the default.
- Search filters by name, case-insensitive, and keeps the shelf groups.
- Click a meal to select it. Click it again to clear the selection.
- “I know how to cook this” is on the row for `RECIPE` and `PROMPT` meals, and in the editor. One click sets `KNOW`.
- Add a meal goes to `/meals/new`.

### Placing

- Click an empty enabled day while a meal is selected: assign it, set the default variant, set servings to the day’s current servings (default 3), set sides from `defaultSelected`, open the day sheet.
- Click an empty day with nothing selected: no assignment. The well stays.
- Click a filled day: open the day sheet. Do not change the meal.
- Keys `1`–`7`, while a meal is selected and focus is not in a field, place it on Monday–Sunday if that day is enabled and empty. If the day is filled, open the sheet instead of replacing.

### Day controls that save immediately

- Turn on / turn off
- Portions stepper
- Night before / At lunch
- Protein cycle, when shown on the ticket

Each of these rebuilds the week list.

### Sticky

Show the diversity sticky when the rule in the data doc says so. Show the fill explanation when the last fill left at least one enabled day empty because there was no candidate.

## Day sheet

Opened from a day. Contains the controls in the visual spec.

Side checkboxes are the suggested sides for this meal. Changing them updates `DayPlanSide` and rebuilds.

**Clear day** removes the meal, variant, and sides from the day. Servings and prep window stay.

**Replace meal** waits for a library selection, then **Use this meal** swaps it and resets sides to that meal’s defaults.

**Cook this** goes to `/cook/[dayId]`.

## Add meal

Fields: name, at least one ingredient, protein, hands-on minutes, and total minutes are all required. Total minutes cannot be shorter than the hands-on time. The meal is not saved until every one of them is filled.

Save creates confidence `KNOW`, method `OTHER`, base servings 3, `completePlate` false, one protein variant if a protein was chosen (label from the group, default true), otherwise one `OTHER` variant labeled “No specific protein”.

Then redirect to the editor.

## Meal editor

Route: `/meals/[id]`.

Shows name, confidence actions, times, method, cuisine, complete-plate checkbox, variants, shared ingredients, variant ingredients, sides, keypoints, steps.

- Add, edit, remove ingredients as in the visual spec.
- Add a protein option: label and group. Its ingredient list starts empty.
- Remove a protein option only if another remains. Days pointing at it fall back to the default.
- Add a side: name plus ingredients, or attach an existing side by name.
- `defaultSelected` is a checkbox on each suggested side: “Selected when I place this”.
- Delete meal asks for confirmation, nulls day assignments, rebuilds those weeks, returns to the board.

Saving ingredients rebuilds every week that references the meal.

## Lists

Route: `/list/[weekStart]`.

Two groups: plan lines that are origin `PLAN`, then origin `CARRIED` under the Still to buy label. Hide the carried label when there are none.

Checking a row sets `checked`. It does not rebuild. When inventory matches `nameKey+unit`, show an advisory under the line. Optional “Add to inventory?” after a buy check (opt-in; remember preference). **Apply stock to list** is Mode B view-only until tapped; carried lines stay visible.

The top bar still has the week switcher. Changing week shows that week’s list.

## At home

Route: `/home`.

Tabs: Inventory (grouped by location) and Prepared (free-text names, portions, location). Paper sheet language — not a warehouse table. Nav from the board: **At home**.

## Cook confirmation sheet

On week landing after login or return ≥6h, if past enabled meal days are unconfirmed: sheet with **Cooked** · **Skipped** · **Later**. Later never hard-blocks the app.

## Week planning control

Primary segmented control on the board: **By day** (weekday columns) or **Week’s meals** (day-independent lunch shortlist). Optional **Show weekend** when by day. Day details open in a modal dialog over the board — never a left column.

## Cook

Route: `/cook/[dayId]`.

If the day has no meal and is not a heat plan, show the empty-well sentence and a link back to the board.

Render steps by confidence, as in the visual spec. Keypoints are `kind: KEYPOINT`, ordered. Steps are `kind: STEP`, ordered.

Heat plans show “Heat and serve” and **I heated this**.

**I cooked this** / **I heated this** run `confirmCook` (inventory or portions) and then evaluate the nudge for recipe cooks.

The nudge’s Yes and Not now behave as in the data doc.

## Login

Email and password. Failed sign-in: “That email or password does not match.” Success goes to `/week?login=1` so the confirmation sheet can run.

## Loading and errors

A failed action leaves the board as it was and shows a sticky: “That did not save. Try again.” Do not clear the week on an error.
