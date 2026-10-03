# Definition of done

The build is done when every box below is true. QA writes the result in `docs/qa-report.md`.

## Runs

- [ ] `npm test` passes, including every worked example in `docs/02-data-and-logic.md`
- [ ] `npm run build` passes
- [ ] `npm run dev` serves the app
- [ ] Seed creates `cook@lunchboard.local` / `lunchboard` and the twelve meals once, even if run twice

## Planning

- [ ] This week opens with Monday–Friday on and Saturday–Sunday off
- [ ] Turning a day off removes its ingredients from the list and keeps the meal on the day
- [ ] Selecting Bolognese and clicking an empty day places it at 3 portions with pasta on and green salad off
- [ ] Clicking a filled day opens the sheet and does not replace the meal
- [ ] Portions 6 on beef Bolognese makes beef mince 900 g
- [ ] Switching that day to vegan mince removes beef mince and adds vegan mince 720 g (360 scaled by 6/3)
- [ ] Lasagne on At lunch shows the lunch warning and stays on the day
- [ ] Fill empty days does not change a day that already has a meal
- [ ] With no known meals, fill leaves days empty and shows the coach line from the copy deck
- [ ] Marking Bolognese as known moves it to Can cook, and lasagne, the burger, and goulash appear under Similar

## Ingredients

- [ ] Removing carrot from Bolognese removes carrot from the list
- [ ] Adding an ingredient adds it, scaled, for every day that uses the meal
- [ ] A new line named salt defaults to Cupboard
- [ ] A new line named basil defaults to Buy
- [ ] Add meal “Burrata pasta” with pasta, burrata, cherry tomatoes, basil, and Grana Padano saves as a meal the user knows, and those lines are Buy

## Lists

- [ ] Two days that each need 1 onion produce one line, 2 onions
- [ ] An unchecked buy line appears on the next week
- [ ] If the next week also needs that item, there is one line, at the new week’s amount
- [ ] A checked buy line is not copied into the next week
- [ ] Raising an amount on a checked line unchecks it
- [ ] A cupboard tick does not appear on the next week
- [ ] The buy list is a single list, with Still to buy only when a carried line remains
- [ ] The cupboard list has names and no amounts

## Cook

- [ ] A recipe meal shows the full steps
- [ ] After it is marked known, the cook view shows keypoints and hides the full steps
- [ ] I cooked this, three times, shows the nudge
- [ ] Not now hides it until three more cooks
- [ ] Yes updates confidence

## Interface

- [ ] The week is day columns on a warm dotted paper background, not a data table and not a card grid from a dashboard kit
- [ ] Meal names are Fraunces. UI text is Outfit
- [ ] Tickets show a protein stripe in the spec colors
- [ ] Warnings and coach lines use the yellow sticky
- [ ] Copy matches `docs/08-copy.md` for the strings in that file
- [ ] At 390px wide, days scroll horizontally, Meals opens the library, and cook view is one column
- [ ] Focus is visible on the prep control, the portion stepper, and list checkboxes
- [ ] Login shows the local sign-in hint

## README

- [ ] The status table matches what runs
- [ ] The quick start commands work
- [ ] The WIP banner stays if any box above is open
