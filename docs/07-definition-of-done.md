# Definition of done

The build is done when every box below is true. QA writes the result in `docs/qa-report.md`.

A ticked box means it is covered by an automated check (`npm test`, `npm run e2e`) or by a
committed screenshot. Boxes that are still open are listed with their reason in the QA report.

## Runs

- [x] `npm test` passes, including every worked example in `docs/02-data-and-logic.md`
- [x] `npm run build` passes
- [x] `npm run dev` serves the app
- [x] Seed creates `cook@lunchboard.local` / `lunchboard` and the twelve meals once, even if run twice

## Planning

- [x] This week opens with Monday–Friday on and Saturday–Sunday off
- [x] Turning a day off removes its ingredients from the list and keeps the meal on the day
- [x] Selecting Bolognese and clicking an empty day places it at 3 portions with pasta on and green salad off
- [x] Clicking a filled day opens the sheet and does not replace the meal
- [x] Portions 6 on beef Bolognese makes beef mince 900 g
- [x] Switching that day to vegan mince removes beef mince and adds vegan mince 720 g (360 scaled by 6/3)
- [x] Lasagne on At lunch shows the lunch warning and stays on the day
- [x] Fill empty days does not change a day that already has a meal
- [x] With no known meals, fill leaves days empty and shows the coach line from the copy deck
- [x] Marking Bolognese as known moves it to Can cook, and lasagne, the burger, and goulash appear under Similar

## Ingredients

- [ ] Removing carrot from Bolognese removes carrot from the list
- [ ] Adding an ingredient adds it, scaled, for every day that uses the meal
- [x] A new line named salt defaults to Cupboard
- [x] A new line named basil defaults to Buy
- [ ] Add meal “Burrata pasta” with pasta, burrata, cherry tomatoes, basil, and Grana Padano saves as a meal the user knows, and those lines are Buy

## Lists

- [x] Two days that each need 1 onion produce one line, 2 onions
- [x] An unchecked buy line appears on the next week
- [x] If the next week also needs that item, there is one line, at the new week’s amount
- [x] A checked buy line is not copied into the next week
- [x] Raising an amount on a checked line unchecks it
- [ ] A cupboard tick does not appear on the next week
- [x] The buy list is a single list, with Still to buy only when a carried line remains
- [x] The cupboard list has names and no amounts
- [x] Carry-over is live: ticking or unticking a line in week N re-runs the carry into week N+1 (and up to four weeks further forward) immediately, not only when week N+1 is first opened
- [x] A carried line that the new plan also needs merges by the existing rules and is not counted twice

## Cook

- [x] A recipe meal shows the full steps
- [x] After it is marked known, the cook view shows keypoints and hides the full steps
- [ ] I cooked this, three times, shows the nudge
- [ ] Not now hides it until three more cooks
- [ ] Yes updates confidence
- [x] Tapping I cooked this three times on the same day still only counts once; the button then reads Cooked · Undo
- [x] Changing or clearing the meal on a cooked day resets that day so it can be cooked again

## Interface

- [x] The week is day columns on a warm dotted paper background, not a data table and not a card grid from a dashboard kit
- [x] Meal names are Fraunces. UI text is Outfit
- [x] Tickets show a protein stripe in the spec colors
- [x] Warnings and coach lines use the yellow sticky
- [x] Copy matches `docs/08-copy.md` for the strings in that file
- [x] At 390px wide, days are a full-width vertical stack, the page never scrolls sideways, Meals opens the library, and cook view is one column
- [ ] Focus is visible on the prep control, the portion stepper, and list checkboxes
- [x] Login shows the local sign-in hint

Earlier drafts of this file and `docs/04-visual-design.md` asked for a sideways scroll strip on a
phone. `docs/10-next-plan.md` replaced that with a vertical stack of full-width day cards, because a
sideways strip on a 390px screen hid days behind a gesture and made the page scroll sideways. The
sideways scroll strip survives on desktop, inside the board, when the enabled columns do not fit.

## README

- [x] The status table matches what runs
- [x] The quick start commands work
- [x] The WIP banner stays if any box above is open
