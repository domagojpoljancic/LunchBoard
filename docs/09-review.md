# Product and build review — round 2

Date: 2026-10-06. Reviewed `main` at `8c8ce91` running locally, at 1440, 1280, 1024, and 390 px wide, signed in as the dev user. Evidence came from screenshots, saved in [screens/review-2026-10-06/](screens/review-2026-10-06/), and from reading the code.

The work to fix what is listed here is in [10-next-plan.md](10-next-plan.md).

## Verdict

The core loop works end to end: pick meals, place them on days, get the buy list, open the cook view. The domain logic is unit tested, and the list math is correct: Bolognese for 6 gives 900 g beef mince, and switching to vegan mince removes the beef.

The app is not ready to hand to the user yet, for three reasons:

1. **It looks broken in the places people click most.** Every selected toggle renders as a solid black pill with no label, because of one CSS rule. This covers Night before, Buy/Cupboard, the All filter, and confidence. Day columns clip meal names. On a phone the page scrolls sideways.
2. **A few rules the user relies on are only partly true.** Carry-over is copied once when the next week is first opened, so it goes stale. "I cooked this" can be pressed any number of times. Two actions accept ids that the user does not own.
3. **The first five minutes tell the user nothing.** All twelve starter meals sit under Needs a recipe, so Fill picks recipe meals and Similar has nothing to anchor to.

The earlier QA report passed the visual system by reading code, not by looking at screens. From now on, visual QA needs screenshots.

## What is good and stays

- One server-side writer for lists (`rebuildWeek`). Toggling a check only flips `checked`. This is the right shape and makes fixes local.
- Week dates are computed in the user's timezone, and week URLs normalise to the Monday.
- The seed is idempotent per `(userId, catalogKey)`.
- The visual language when it renders correctly: the paper and dot grid, Fraunces with Outfit, the protein stripe on tickets, and the yellow coach sticky.
- The buy list page (`/list/[weekStart]`) and the cook view (`/cook/[dayId]`) read well at 1440.

## Findings

Severity: **P0** means the app looks or behaves broken. **P1** means data or trust is wrong. **P2** means the concept is weaker than intended. **P3** means nice to have.

### UI and visual

| # | Sev | Finding | Evidence |
| --- | --- | --- | --- |
| U1 | P0 | Selected segments and pills show no text. In `globals.css`, `button, input, select, textarea { color: inherit }` and `a { color: inherit }` sit outside any `@layer`. Tailwind v4 utilities live in `@layer utilities`, and unlayered CSS beats every layer, so `text-[var(--card)]` on a dark pill loses and the text matches the background. | `1440-board-filled`, `1440-editor`, `390-library` |
| U2 | P0 | Seven equal day columns next to a 340 px library are too narrow at 1280–1440. Meal names clip ("Bolognes"), "At lunch" wraps to two lines, the portion number is cut off, and the off weekend days still take full width. | `1440-board-filled`, `1280-board-empty` |
| U3 | P0 | At 390 px the header is about 546 px wide. The date range wraps to three lines, Fill empty days drops offscreen, and the whole page scrolls sideways. | `390-board` |
| U4 | P1 | Library tickets carry two loose text links each ("I know how to cook this", "Edit"). Twelve meals make a long list of the same words, and they do not look like part of the ticket. | `1440-board-filled`, `390-library` |
| U5 | P1 | The editor shows raw enum values ("Confidence now: KNOW", method "ASSEMBLE"). The meal name field has no label. The three confidence buttons do not show which one is current. | `1440-editor` |
| U6 | P1 | Empty days already show the prep toggle and the portion stepper before any meal is placed. That is noise. These settings belong to the day once it has a meal. | `1440-board-empty` |
| U7 | P1 | No pending or error states. Server actions run with no feedback, a failure is silent, and a double click can send the action twice. | Code: components call actions directly |
| U8 | P2 | The cook view puts cupboard items (salt, oil) in the same list as things to buy and prints "salt" twice when a side also uses it. It does not say which lines belong to the side. | `1440-cook` |
| U9 | P2 | The board is click-to-place only. The brief asked for a Miro-like board, and desktop users will try to drag. | Brief |
| U10 | P3 | The Next.js dev "1 Issue" badge in screenshots comes from the screenshot tool injecting `caret-color`, not from the app. It does not appear in production builds. | Console |

### Product and concept

| # | Sev | Finding |
| --- | --- | --- |
| C1 | P1 | **Carry-over is a stale snapshot.** `ensureWeek` copies last week's unchecked lines only when the next week row is first created. If you open next week on Thursday and then shop on Friday, next week still lists what you already bought. The spec ("unchecked lines carry into the next week") needs a live rule. |
| C2 | P1 | **Cook logging can be spammed.** `logCook` increments `cookCount` with no link to a day. Three taps on one Monday count as three cooks and trigger the confidence nudge falsely. |
| C3 | P2 | **First run has no anchor.** Every seed meal starts at `RECIPE`, so all twelve land under Needs a recipe and Similar is empty. The shelves drive Fill and the cook view, so the first screen must ask "Which of these can you already cook?" |
| C4 | P2 | **Fill does not match "less decisions, known meals first."** With few known meals it repeats a meal in the same week (Bean and tuna salad on Tue and Fri) and fills the rest with never-cooked Similar meals, each needing a recipe. Repeats should come last, and Similar meals should be marked as a try-something-new pick. |
| C5 | P2 | **Over-buying from "every day is its own cook."** Five days at 3 portions plans and buys 15 portions for 5 lunches. The user said 3 portions are for "leftovers for dinner or next day". The planner cannot yet say "Tuesday is Monday's leftovers", which adds nothing to the list. The locked default stays; this becomes an opt-in. It needs the user's OK. |
| C6 | P2 | **The night-before schedule is hidden.** The success goal is flexibility between cooking the day before and on the day, but the board never says "cook Sunday evening for Monday". A small cook-schedule line per day turns the prep setting into a plan. |
| C7 | P2 | **The meal editor misses spec features.** You cannot add, rename, or remove a protein option. You cannot attach a side, create one, or set its default. You cannot edit base servings, steps, or keypoints. The Burrata-pasta flow works only for name and ingredients. |
| C8 | P2 | **The list cannot leave the app.** There is no "Copy list" button. Copying plain text is the cheapest bridge to Google Keep before a real integration. |
| C9 | P3 | Herbs use `1 piece` for parsley and basil. A `bunch` unit reads better and scales like pieces. |

### Backend and data

| # | Sev | Finding |
| --- | --- | --- |
| B1 | P1 | `updateDayVariant` saves any `variantId` without checking it belongs to the day's meal. `setDaySides` saves any `sideIds` without checking that the user owns them. `addIngredient` accepts a `variantId` without checking it belongs to the meal. |
| B2 | P1 | Zod is installed but no action parses its input. `docs/06-build-order.md` requires it. |
| B3 | P1 | `setTimezone` exists but nothing calls it, so every user stays on UTC. Week boundaries are right only by luck of the server. |
| B4 | P2 | Seed data and `docs/05-starter-meals.md` disagree on roles. Lemon and lime are BUY in the seed but listed under Pantry in the doc (Chicken grain bowl, Bean and tuna salad, Chicken burrito bowl, Chickpea tray). Fresh citrus is bought weekly, so the seed is right and the doc changes. Garlic and ginger match in both. |
| B5 | P2 | `ensureWeek` runs on page load and writes rows. Opening far-future weeks creates empty week rows. This is acceptable, but carry-over should not depend on it (see C1). |

### Delivery

| # | Sev | Finding |
| --- | --- | --- |
| D1 | P0 | **The user cannot see the app.** It only runs on a local machine. There is no preview URL, no CI, and no screenshot artifacts on pull requests. |
| D2 | P1 | SQLite will not persist on Vercel or similar hosts. A hosted preview needs Postgres. |
| D3 | P1 | No end-to-end tests. Every UI bug in this review would have been caught by a Playwright run with screenshots. |

## Questions for the user

Only two things block parts of the plan. Everything else uses the default.

1. **Leftover days (C5).** Should a day be able to say "eat Monday's leftovers" and add nothing to the buy list? Default: yes, as an option per day. "Every day is its own cook" stays the default.
2. **Hosted preview (D1, D2).** To get a URL you can open on your phone, add these in Cursor Dashboard → Cloud Agents → Secrets: `DATABASE_URL` (a Postgres URL, e.g. from Supabase or Neon), `AUTH_SECRET`, and `VERCEL_TOKEN`. You can also import the repo in Vercel yourself and set the first two there. Without them, the plan still ships CI screenshots on every pull request, so you can see the UI on GitHub.
