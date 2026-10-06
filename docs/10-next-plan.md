# Next development plan

This plan fixes everything in [09-review.md](09-review.md). Finding ids (U1, C1, B1, D1, …) point back to that review.

Run it with `/build-next`, or say "start next plan", and follow [prompts/execute-next.md](../prompts/execute-next.md). Phases run in order. Every phase ends with `npm test`, `npm run build`, and (from phase 2 on) `npm run e2e`, all passing, then a commit.

The locked decisions in [00-decisions.md](00-decisions.md) still hold. This plan does not reopen them. The one new behaviour that needs the user's OK (leftover days, phase 4) is opt-in and leaves the default alone.

## Phase overview

| Phase | Goal | Findings | Needs from the user |
| --- | --- | --- | --- |
| 0 | The app looks right at every width | U1, U2, U3, U4, U5, U6, U10 | Nothing |
| 1 | Data and actions can be trusted | C1, C2, B1, B2, B3, B4, U7 | Nothing |
| 2 | The user can see the app without a laptop | D1, D2, D3 | Secrets for a hosted URL (optional) |
| 3 | First run, Fill, editor, and the cook plan match the concept | C3, C4, C6, C7, C8, C9, U8, U9 | Nothing |
| 4 | Leftover days | C5 | A yes (default: build it, opt-in per day) |

---

## Phase 0 — Visual correctness

Role: principal UX engineer and principal frontend engineer (`agents/ux_frontend_agent.md`). Tokens and type stay as in `docs/04-visual-design.md`.

### 0.1 Fix the CSS cascade (U1)

- In `src/app/globals.css`, wrap every element rule (`*`, `html`, `body`, `a`, `button, input, select, textarea`, headings, focus rings) in `@layer base { … }`. Keep `:root` variables and `@theme inline` where they are.
- Search the components for any inline workaround that sets text colour twice, and remove it.

Accept when every selected state shows its label in the app's colours: the prep toggle, Buy/Cupboard, the protein filter All pill, the protein option, and the confidence buttons. Screenshots of the board, editor, and library at 1440 show it.

### 0.2 Board layout (U2, U6)

Goal: at 1280 px with the library open, a placed ticket shows the full meal name for names up to 22 characters, on at most two lines.

- **Off days collapse into a 44 px rail.** The rail shows the weekday letter and date and a Turn on button. Only enabled days get full columns.
- **Enabled columns** use `minmax(180px, 1fr)` and scroll sideways inside the board when they do not fit. The page itself never scrolls sideways.
- **Library width** is 300 px at `xl`, and 280 px from `lg` to `xl`. Below `lg` it becomes the existing sheet opened by the Meals button.
- **Empty day:** show only the weekday, the date, a dashed "Place a meal" drop target, and Turn off. Hide the prep toggle and portions until a meal is placed.
- **Planned day:** the ticket holds the name (Fraunces, wraps, no clipping), the protein chip, and a compact meta row: `Night before · 3 portions`. The prep toggle and portion stepper move into the day sheet, which already opens on click. Keep a small portion stepper on the ticket only at `2xl` and above.
- Put the Cook link and the sides chip inside the ticket footer, not loose under the column.

Accept when the 1440 and 1280 screenshots show five readable columns and two rails, with no text clipped by `overflow: hidden`.

### 0.3 Header and mobile (U3)

- Below `md`, the header has two rows. Row 1: logo, then Meals and Lists as icon buttons with labels for screen readers. Row 2: Previous, the date range on one line ("5–11 Oct"), Next, and Fill as an icon button with a label.
- Use the short date format when the month is the same ("5–11 Oct"). Use the long one across months ("29 Sep – 5 Oct").
- At 390 px, `document.documentElement.scrollWidth` equals the viewport width on every page. Phase 2 makes this an E2E assertion.
- On a phone the day columns become a vertical stack of day cards, each full width, instead of a sideways scroll strip.

### 0.4 Library tickets (U4)

- The ticket is one card. The name and meta row are on the left. On the right is a 28 px circular check: filled means "I can cook this" (KNOW or PROMPT), empty means RECIPE. Clicking it toggles between KNOW and RECIPE. The full three-level choice stays in the editor.
- Edit becomes a pencil icon button with `aria-label="Edit {meal}"`, shown on hover and focus on desktop and always on touch.
- Remove the loose text links under each ticket.

### 0.5 Editor polish (U5)

- Map enums to words from `docs/08-copy.md`: confidence (I know it / I roughly know it / I need the recipe), method (Assemble, Stovetop, Oven, Slow, Other), role (Buy, Cupboard).
- The three confidence buttons are a segmented control with `aria-pressed`, and the current one is visibly selected.
- Add a visible "Meal name" label. Put the save state ("Saved" / "Saving…") next to the Save button.

### 0.6 Dev badge (U10)

- Screenshots and E2E run against `npm run build && npm start`, never `npm run dev`, so the dev overlay is never in artifacts.

### Phase 0 done

- [ ] U1–U6 fixed, with screenshots at 1440, 1280, 1024, and 390 committed under `docs/screens/` (PNG, under 300 KB each).
- [ ] `npm test` and `npm run build` pass.

---

## Phase 1 — Data and trust

Role: `agents/backend_agent.md`, with `agents/product_guardian.md` checking that no locked rule changes.

### 1.1 Live carry-over (C1)

New rule, replacing "New week carry" in `docs/02-data-and-logic.md`:

> The carried set for week N is every **unchecked** shopping line in week N−1 at the moment week N is rebuilt, from both origins. Week N stores its own `checked` state for carried lines. When anything changes week N−1's list (a rebuild or a check toggle), week N is rebuilt if it exists.

Implementation:

- In `rebuildWeek(weekId)`, load week N−1's unchecked lines and pass them as the `CARRIED` input to `rebuildShopping`. Keep `checked` for each carried row in N by matching on `(nameKey, unit)`.
- Remove the snapshot copy from `ensureWeek`.
- In `toggleShoppingItem`, after flipping `checked`, call `rebuildWeek(nextWeekId)` if the next week exists. Rebuilding week N also rebuilds N+1 if it exists. Stop after 4 weeks forward.
- Pure tests in `tests/list.test.ts`:
  - Open next week, then tick onion in this week. Onion disappears from next week.
  - Untick it again. Onion comes back as carried.
  - A carried line that the new plan also needs merges by the existing rules and is not counted twice.
  - Ticking a carried line in week N does not change week N−1.

### 1.2 Cook logging per day (C2)

- Add `DayPlan.cookedAt DateTime?`, as a migration.
- `logCook(dayId)` sets `cookedAt` and increments `cookCount` only if `cookedAt` was null. `undoCook(dayId)` clears it and decrements, never below 0.
- The ticket shows a small "Cooked" tick when `cookedAt` is set. The cook view's button reads "I cooked this", then "Cooked · Undo".
- Placing a different meal on the day clears `cookedAt`, and so does clearing the day.
- Test: three `logCook` calls on one day count once.

### 1.3 Validate and authorise every action (B1, B2)

- Add `src/lib/schemas.ts` with Zod schemas for every server action input: ids are `cuid()`, servings 1–12, enums, quantity ≥ 0, names 1–80 characters.
- Every action in `src/app/actions/*` parses its input first.
- Ownership:
  - `updateDayVariant` checks that `variantId` belongs to `day.mealId`.
  - `setDaySides` checks that every side belongs to the user.
  - `addIngredient` checks that `variantId` belongs to the meal and `sideId` belongs to the user.
  - `updateIngredient` and `deleteIngredient` keep their current checks.
- Add `tests/ownership.test.ts`, using a test SQLite database (`DATABASE_URL=file:./test.db`, reset per run) and two seeded users. User B cannot change user A's day, variant, side, or ingredient.

### 1.4 Timezone (B3)

- A client component in the root layout calls `setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)` once per session if the stored value is UTC. Cache the result in `sessionStorage`.

### 1.5 Pending and error states (U7)

- Every control that calls an action uses `useTransition`. While the action is pending the control is disabled, and a small spinner appears on buttons.
- Add one `ActionToast` (bottom center, paper-coloured, ink text) that shows "Couldn't save. Try again." with a Retry button on failure.
- Toggles that only flip state (shopping checks, pantry ticks, the library check) update optimistically with `useOptimistic` and roll back on error.

### 1.6 Seed and doc consistency (B4)

- Update `docs/05-starter-meals.md` so lemon and lime are BUY wherever the seed says BUY.
- Add `tests/seed.test.ts`. It parses `prisma/seed-meals.ts` data (export the arrays) and checks:
  - every meal has 1–2 variants with exactly one default;
  - every side key a meal uses exists;
  - every PANTRY ingredient name is in `pantry-dictionary`, or the test lists it as an allowed exception.

### Phase 1 done

- [ ] All of 1.1–1.6 done, with tests.
- [ ] `docs/02-data-and-logic.md` and `docs/07-definition-of-done.md` updated with the new carry and cook rules.

---

## Phase 2 — See it without a laptop

Role: `agents/qa_agent.md` for the tests, and `agents/backend_agent.md` for the database and deploy.

### 2.1 Playwright E2E (D3)

- Add `@playwright/test` as a dev dependency, plus `playwright.config.ts` and `npm run e2e`. The web server is `npm run build && npm start` on port 3100 against a fresh SQLite database, migrated and seeded.
- Specs under `e2e/`:
  - `login.spec.ts`: sign in, land on the current Monday.
  - `plan.spec.ts`: mark Bolognese as known, place it on Monday, set 6 portions, and switch to vegan mince. The list shows vegan mince 720 g and no beef mince.
  - `fill.spec.ts`: Fill does not overwrite Monday and does not repeat a meal while unused known meals remain.
  - `carry.spec.ts`: open next week, return, tick onion, and check next week has no onion.
  - `cook.spec.ts`: "I cooked this" twice counts once, and Undo works.
  - `layout.spec.ts`: at 390, 1024, 1280, and 1440, the page does not scroll sideways, and selected toggles have a computed text colour different from their background colour.
  - `screens.spec.ts`: full-page screenshots of the board (empty and filled), the day sheet, the library, the list, the cook view, the new meal page, and the editor, at 1440 and 390, saved to `e2e-artifacts/`.

### 2.2 CI with screenshots on every pull request

- Add `.github/workflows/ci.yml`. It runs on push and pull request: `npm ci`, `npx prisma migrate deploy`, `npm test`, `npm run build`, `npx playwright install --with-deps chromium`, then `npm run e2e`.
- Upload `e2e-artifacts/` with `actions/upload-artifact`.
- On pull requests, post or update one comment linking to the artifact. This uses only the default `GITHUB_TOKEN`, with no extra secrets.

This alone answers D1. The user opens the pull request on GitHub, phone included, and sees every screen.

### 2.3 Hosted preview (D1, D2), only if secrets exist

- Switch Prisma to `provider = "postgresql"`. Keep SQLite for tests by generating the test schema from the same file with `prisma/schema.sqlite.prisma`, made by a small script, **or** run E2E against Postgres in CI with a `postgres:16` service container. Prefer the service container; it is one schema and less magic.
- Regenerate migrations for Postgres in a fresh `migrations/` folder. The app has no production data, so a reset is fine.
- Add `vercel.json` only if needed. The build command is `prisma migrate deploy && next build`. Seed runs once with `npm run db:seed`, which is safe to repeat.
- Secrets (Cursor Dashboard → Cloud Agents → Secrets, and the same names in Vercel):

| Name | What |
| --- | --- |
| `DATABASE_URL` | Postgres URL (Supabase or Neon), pooled |
| `DIRECT_URL` | Direct Postgres URL for migrations |
| `AUTH_SECRET` | Long random string |
| `VERCEL_TOKEN` | Only if the agent deploys; not needed if the user imports the repo in Vercel |

- If the secrets are missing, skip 2.3. Write the steps into the README under "Hosted preview", and carry on with phase 3. Do not stop.

### Phase 2 done

- [ ] `npm run e2e` passes locally and in CI.
- [ ] CI uploads screenshots on the PR.
- [ ] Hosted URL in the README, or README steps for adding secrets.

---

## Phase 3 — Concept fixes

Role: principal UX/FE for the screens, `agents/content_chef_agent.md` for words and seed, and the backend agent for the logic.

### 3.1 First-run "What can you already cook?" (C3)

- Add `User.onboardedAt DateTime?`. On `/week`, if it is null, show a full-screen board overlay, not a modal: the twelve seed meals as tickets in a grid, each with the same circular check as the library. The heading is "Which of these can you already cook?" Below the grid is "You can change this any time."
- Buttons: "Done" sets `onboardedAt` and saves the checks as KNOW. "Skip" sets `onboardedAt` only.
- After Done, a coach sticky on the board says "Fill your week from the {n} meals you know?" with Fill and Not now.

### 3.2 Fill that respects "fewer decisions" (C4)

Change `fillEmptyDays`:

1. Tiers stay KNOW, then PROMPT, then Similar.
2. No repeats within a week until every meal in **all** tiers that fits the day is used. Repeats are the last resort, never ahead of an unused Similar meal.
3. A Similar pick gets `reason: "TRY_NEW"`. Its ticket shows a small "New to you" tag, and the cook view opens at full recipe depth.
4. Return a `reason` for each placement (`KNOWN`, `ROUGHLY_KNOWN`, `TRY_NEW`, `REPEAT`). The board shows it on hover and focus.

Tests in `tests/fill.test.ts`:

- With 2 known meals and 5 days, there is no repeat while Similar meals exist.
- With 1 known meal, no Similar meals, and 3 days, it repeats and marks the repeats.
- Placed days are never overwritten (existing test).

### 3.3 Cook schedule on the board (C6)

- Each planned day's ticket meta row says when you cook: "Cook Sun evening" for Night before, "Cook at lunch" for At lunch. The time warning keeps its current rule.
- The board header gets a quiet one-line summary: "Cooking: Sun, Mon, Wed evenings · Thu at lunch". Clicking a name scrolls to that day.
- Off days that come before a Night-before day still show "cook evening" in their rail, because the evening is real even if lunch is off.

### 3.4 Meal editor completeness (C7)

On `/meals/[id]`, add:

- **Protein options:** add an option (label + protein group), rename it, set the default, and remove it (not the last one). Each option keeps its own ingredient list, as now.
- **Sides:** attach an existing side, create a new side (name, hands-on minutes, ingredients), toggle "on by default", and detach. Side ingredient edits rebuild affected weeks (existing `rebuildWeeks({ sideId })`).
- **Base servings** (1–12). Changing it rescales nothing that is stored. Scaling already reads `baseServings`.
- **Steps and keypoints:** add, edit inline, reorder with up and down buttons, and delete.
- `/meals/new` gains a protein select that creates the first variant, and an optional "Add a second protein" row. Example: Burrata pasta with "No specific protein".

Server actions get Zod schemas and ownership checks from phase 1.

### 3.5 Cook view grouping (U8)

- Three groups: "For the meal", "For {side}" (one group per side), and "From the cupboard" (a single deduplicated list with no amounts).
- Amounts use the scaling rules already in `scaling.ts`.

### 3.6 Copy the list (C8)

- On `/list/[weekStart]`, a "Copy list" button copies plain text: one unchecked buy line per row ("beef mince — 900 g"), then a blank line, then "Check the cupboard:" and the unticked pantry names. It shows "Copied" for 2 seconds.
- This is the Google Keep bridge until a real integration.

### 3.7 Bunch unit (C9)

- Add `BUNCH` to the unit type, the scaling rules (round up like `PIECE`), the editor unit select, and copy ("bunch").
- Seed: parsley, basil, and coriander use `1 BUNCH`. The seed upsert updates these on existing rows.

### 3.8 Drag to place on desktop (U9)

- Add `@dnd-kit/core`. On pointer devices, tickets in the library drag onto day columns, and planned tickets drag between days (a move, or a swap if the target day is full).
- Click-to-place stays and is the only path on touch and for keyboard users. Keyboard: select a ticket, then press Enter on a day.
- The drop target highlights with the protein colour at 15% opacity.

### Phase 3 done

- [ ] 3.1–3.8 done, with tests for Fill, the copy text format, and bunch scaling.
- [ ] E2E covers onboarding, editor protein add, side attach, and copy list.
- [ ] `docs/01-flows.md`, `docs/03-screens.md`, and `docs/08-copy.md` updated.

---

## Phase 4 — Leftover days (opt-in, needs a yes)

The default stays: every day is its own cook. This adds a per-day choice.

- Add `DayPlan.leftoverOfDayId String?`, a self relation.
- In the day sheet, an empty day after a planned day offers "Eat leftovers from {Mon}". It is offered only if that cook has portions to spare. Portions spare = servings − 1 − portions already claimed by other leftover days.
- A leftover day shows the source meal as a faded ticket with "Leftovers from Mon", has no prep window, and adds **nothing** to the buy list.
- Clearing or changing the source day clears its leftover days, and the coach sticky says so.
- Fill never creates leftover days by itself. It can suggest one in a sticky ("Mon makes 3 portions — use one on Tue?").
- `rebuildWeek` skips leftover days when it builds desired lines. Tests:
  - Mon Bolognese for 3, Tue leftovers: the list equals Mon alone.
  - Clear Mon: Tue becomes empty.

If the user says no, skip this phase and record "Leftover days — declined" in `docs/00-decisions.md`.

---

## Definition of done for this plan

- Every finding in `09-review.md` is fixed, or explicitly deferred with a reason in that file.
- `npm test`, `npm run build`, and `npm run e2e` pass locally and in CI.
- Screenshots of every screen at 1440 and 390 are attached to the final PR by CI.
- The README status table and WIP banner match reality.
- `docs/qa-report.md` is rewritten from the E2E results and screenshots, not from reading code.
