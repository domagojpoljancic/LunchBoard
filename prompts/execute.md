# Execute the build

You are the Orchestrator. Do these waves in order. Do not ask the human to pick between them.

## Wave 0 — Read

Read, in order:

1. `CURSOR_RULES.md`
2. `PLAN.md`
3. `docs/00-decisions.md`
4. `docs/01-flows.md`
5. `docs/02-data-and-logic.md`
6. `docs/03-screens.md`
7. `docs/04-visual-design.md`
8. `docs/05-starter-meals.md`
9. `docs/06-build-order.md`
10. `docs/07-definition-of-done.md`
11. `docs/08-copy.md`
12. `agents/ux_frontend_agent.md`
13. `agents/backend_agent.md`

## Wave 1 — App shell

Follow `agents/backend_agent.md` and `docs/06-build-order.md`.

- Create the Next.js TypeScript app in this repo (the repo root is the app root).
- Add Tailwind, Prisma (SQLite), Auth.js credentials, Vitest, Zod, date-fns, date-fns-tz, bcryptjs.
- Commit the Prisma schema from `docs/02-data-and-logic.md` without field inventions.
- Add `middleware` so every page except `/login` requires a session.
- Write `.env` with `DATABASE_URL="file:./dev.db"` and a generated `AUTH_SECRET`. Do not commit `.env`. Commit `.env.example`.

## Wave 2 — Domain and tests

Implement `src/lib/name-key.ts`, `scaling.ts`, `list.ts`, `similar.ts`, `warnings.ts`, `fill.ts`.

Write the Vitest files listed in `docs/02-data-and-logic.md`. Make them pass. Do this before the screens depend on the math.

## Wave 3 — Seed

Follow `agents/content_chef_agent.md`. Seed the dev user and the twelve meals. Running the seed twice must not duplicate meals (`catalogKey` + user).

## Wave 4 — Actions

Server actions for: create/update/delete meal, add/update/delete ingredient, set confidence, place meal on a day, update day (enabled, servings, prep window, variant, sides), rebuild list, toggle shopping and pantry checks, create adjacent week, fill empty days, log a cook, accept or dismiss a confidence nudge.

Every mutation that changes food on a week calls the rebuild for that week.

## Wave 5 — Frontend

Follow `agents/ux_frontend_agent.md` as a principal UX engineer and principal frontend engineer.

Implement every screen in `docs/03-screens.md` with the tokens, type, and layout in `docs/04-visual-design.md`, and the words in `docs/08-copy.md`.

Include, at minimum:

- `/login`
- `/week` and `/week/[weekStart]`
- `/meals/new`
- `/meals/[id]`
- `/list/[weekStart]`
- `/cook/[dayId]`

The week board is the product. Build it before secondary pages, then do not leave those pages as unstyled forms.

## Wave 6 — QA

Follow `agents/qa_agent.md`. Write `docs/qa-report.md`. Fix blocking failures. Loop at most twice.

## Wave 7 — Prove it

```bash
npm test
npm run build
```

Both must pass. Update the README status table. Leave the WIP banner in place unless every done-box is true.

## If you get stuck

Fix the cause. Do not drop list tests, the visual spec, or ingredient editing to “finish faster.” Those are the product.
