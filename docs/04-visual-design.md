# Visual design

This is the design. Implement it. Do not theme a dashboard and tint it warm.

You are designing a paper planning board a cook keeps on the table. The reference is the user’s Freeform sketch only in spirit: a quiet grid, and meals as colored blocks under a protein. The product is tighter than a whiteboard and warmer than a SaaS app.

## Character

- Quiet, physical, specific.
- Large meal names. Small meta.
- Color means protein, and almost nothing else.
- Advice looks like a sticky note, not a toast.
- Plenty of paper showing. The grid is the background, not a decoration inside cards.

## Tokens

Put these in `globals.css` and use them everywhere.

```css
:root {
  --paper: #f3efe6;
  --ink: #1c1915;
  --muted: #5c564e;
  --line: #e4dccf;
  --dot: #ddd4c6;
  --card: #fffdf8;
  --sticky: #f6e3a1;
  --sticky-ink: #3f3420;
  --beef: #c4472a;
  --white-meat: #2f6fed;
  --fish: #1f7a72;
  --plant: #3e7c45;
  --dairy: #c48a12;
  --other: #6b645c;
  --warning: #8a3b12;
  --shadow: 0 10px 30px rgba(28, 25, 21, 0.06);
  --radius-ticket: 16px;
  --radius-sheet: 20px;
}
```

Protein map:

| Group | Token |
| --- | --- |
| BEEF | `--beef` |
| WHITE_MEAT | `--white-meat` |
| FISH | `--fish` |
| VEGETARIAN, VEGAN | `--plant` |
| DAIRY | `--dairy` |
| OTHER | `--other` |

Protein color is a stripe, a dot, or a 4px bar. It is not the fill of a giant button and it is not small text. Labels are `--ink`.

`--muted` on `--paper` must stay at WCAG AA. If a change breaks that, darken `--muted`.

## Type

Load with `next/font/google`.

- **Fraunces** for the wordmark, the week title, and meal names. Optical size default. Meal names use weight 560.
- **Outfit** for everything else: UI, lists, steps, buttons. Weights 400, 500, 600.

Do not load a third family.

| Use | Face | Size |
| --- | --- | --- |
| Week title | Fraunces | 32px / 1.1 |
| Meal name on a ticket | Fraunces | 22px / 1.15 |
| Cook meal name | Fraunces | 44px / 1.05 |
| Section label | Outfit 600 | 12px, tracking 0.08em, uppercase |
| Body, list, steps | Outfit 400 | 16px / 1.45 |
| Meta on a ticket | Outfit 500 | 13px |
| Step number | Fraunces | 28px |

Four sizes on the board is enough. Do not introduce a fifth for decoration.

## Background

The app canvas:

```css
background-color: var(--paper);
background-image: radial-gradient(var(--dot) 1px, transparent 1px);
background-size: 18px 18px;
color: var(--ink);
```

Day columns, the library, tickets, and the list paper are `--card`, so they sit on the grid like sheets. The grid stays visible in the gaps.

## Chrome

Top bar, 72px, sticky, `--card` with a bottom border `--line`. No blur, no shadow.

Left: a 16px inline SVG bowl (stroke `--ink`, 1.5px, round cap, a simple arc and a flat rim) and the word **LunchBoard** in Fraunces.

Center: previous week, the range “6–12 Oct”, next week. The range is Fraunces.

Right: text buttons **Lists** and, on a day, **Cook**. Text buttons are Outfit 600, ink, no fill. The primary action **Fill empty days** is the only filled button on the board: `--ink` background, `--paper` text, pill radius, height 44px.

## Desktop layout

From 1100px wide:

- Page padding 24px.
- Library 340px, `--card`, radius 20px, full height under the bar, padding 16px.
- Gap 16px.
- Board is a row of 7 equal columns, gap 12px.
- A day column is `--card`, radius 20px, min-height 70vh, padding 12px, shadow `--shadow`.

Below 1100px and above 800px the library can sit above the board. Below 800px:

- Days are a vertical stack of full-width day cards. The page never scrolls sideways. (This replaces
  the earlier horizontal scroll-snap row, by the call in `docs/10-next-plan.md`. The sideways scroll
  strip survives on desktop, inside the board, when the enabled columns do not fit.)
- Library is closed. A **Meals** button opens it as a full-height sheet.
- Lists stack: To buy, then Cupboard.
- Cook view is already one column.

## Day column

Top row: weekday in Outfit 600 12px uppercase muted, and the date in Fraunces 20px.

Second row: a two-segment control, full width, height 44px. **Night before** | **At lunch**. The selected segment is `--ink` on `--paper` inverted (`--ink` fill, `--card` text). The track is `--paper` with a 1px `--line` border.

Third row: **Portions** label, then minus, the number in Fraunces 20px, plus. Hit area 44px.

Then the meal well.

**Empty well:** dashed 1.5px `--line`, radius 16px, min-height 120px, centered Outfit text. Default: “Place a meal”. When a library meal is selected: “Place {name}”.

**Filled:** a `MealTicket`. Under it, side names as plain 13px lines, not tags in six colors. Then the warning sticky if needed.

**Disabled day:** the column stays, opacity 0.55. No well. A text button “Turn on”. Enabled days have “Turn off” in muted text.

## Meal ticket

- Background `--card`, radius 16px, border 1px `--line`.
- Left edge: 6px solid protein color, inset so the radius still clips. Easiest implementation: a 6px bar in a flex row, the rest padded 14px.
- Name in Fraunces 22px, ink.
- Second line, Outfit 13px muted: “35 min hands-on · Know” or “Roughly” or “Recipe”.
- If the meal has two protein options, the current one is a text button under the meta. Tapping it cycles, and also lives in the day sheet.
- Selected library meal: 2px solid `--ink` outline, offset 0. Not a glow.

Hover on a ticket moves it up 2px. Do not do this on touch. `prefers-reduced-motion: reduce` removes the move.

## Library

- Search field, full width, height 44px, `--paper` fill, 1px `--line`, radius 12px. Placeholder from the copy deck.
- Protein filters: a wrapping row of pills. Unselected: transparent, 1px line. Selected: ink fill. Each pill includes a 6px protein dot.
- Shelf label, then the meals. Compact rows, not a second card style: 6px stripe, Fraunces 18px name, muted method or time.
- **Can cook** first, then **Similar**, then **Needs a recipe**.
- Empty Can cook uses the copy deck. It is not an error.
- Bottom of the library: **Add a meal**, full width, height 44px, outline button.

A selected row stays outlined until the meal is placed or the person clicks it again to clear.

## Stickies

Coach, warning, and nudge share one component.

- Background `--sticky`, color `--sticky-ink`, radius 12px, padding 12px 14px.
- Outfit 14px / 1.35. No icon circus. No drop shadow.
- A warning can include one text action: “Keep”. It does not block.
- Dismiss is the word “Dismiss”, not a mystery ×, except where the copy deck gives the exact buttons.

## Day sheet

Desktop: a panel 400px wide, anchored to the right of the board, `--card`, radius 20px, shadow, padding 20px. It does not cover the whole week.

Mobile: a full-screen sheet with a 20px top radius and a grab area.

Contents, in order: meal name, protein options as a segmented control when there are two or more, portions, prep window, sides as checkboxes with 44px rows, **Replace meal**, **Clear day**, **Cook this**.

Replace returns to “select a meal, then confirm” rather than instantly swapping on a mis-tap. Confirm is the button **Use this meal**.

## Lists

The page is two sheets on the paper grid.

**To buy** is the primary sheet, max-width 640px.

Each row is 56px minimum: a 22px checkbox, the name in Outfit 18px, the amount aligned to the end in Fraunces 18px (“450 g”, “2”). Checked rows stay readable: ink at 50% opacity, not a deleted animation.

A carried group has the label **Still to buy** and the same row style.

**Cupboard** is a second sheet, narrower. Rows are names and checkboxes. No amounts. The intro line is in the copy deck.

## Cook

One column, max-width 680px, centered on the grid.

- Meal name Fraunces 44px.
- Meta line: protein, portions, window.
- `KNOW`: the sentence “You know this one.” Then ingredients. Then keypoints as short lines. Full steps are not in the DOM.
- `PROMPT`: “A few cues.” Then keypoints as a numbered list.
- `RECIPE`: keypoints first, then steps. Each step is a row: Fraunces number, Outfit 18px instruction, 24px between steps.
- **I cooked this** is the ink pill at the end.
- The nudge sticky sits above that button when it qualifies.

## Editor and add-meal

Same paper, one column, max-width 720px.

Add meal shows only: name (Fraunces 32px input), ingredient stack, protein, hands-on minutes, total minutes, save. Method, cuisine, and steps are on the editor after save, not on the create form.

Ingredient row, wrapping on small screens:

- Name, flex 1, min-width 140px
- Amount, width 72px
- Unit, select
- Segmented **Buy** | **Cupboard**
- **Remove**, text button

Rows are separated by `--line`, not by boxes inside boxes.

Protein option blocks, when there are two, are stacked under a label with the option name. Shared ingredients sit above them under the label **Always**.

## Login

Same paper and grid. No marketing column. No screenshot.

A single `--card` sheet, max-width 420px, centered vertically: bowl mark, LunchBoard, one sentence from the copy deck, email, password, **Sign in**. Under the button, the dev login in muted 13px type so a local build is usable.

## Motion

150ms ease-out for the sheet and the library drawer. Nothing bounces. Reduced motion: opacity only, or instant.

## Focus and hit area

`:focus-visible` is a 2px solid `--ink` outline with 2px offset. Do not remove outlines without this replacement.

Segmented controls, steppers, checkboxes, and list rows are at least 44px tall.

## What the first viewport must communicate

A desktop screenshot at 1280px shows seven day sheets on a dotted warm board, a library of real meals with red, blue, and green stripes, and one ink button. It does not show a hero, a chart, or three feature cards.
