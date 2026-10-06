# LunchBoard

> **WIP — working name.** The app loop runs locally, but it is not ready to hand over. The round-2 review ([docs/09-review.md](docs/09-review.md)) found visual bugs (selected toggles show no text, clipped day columns, phone layout scrolls sideways) and a few data-trust gaps. The fix plan is [docs/10-next-plan.md](docs/10-next-plan.md). There is no hosted preview yet.

Weekday lunch planning on a board. You keep the meals you know, add your own, place them on the days you are actually home, and get a buy list plus a pantry check.

**LunchBoard** is a working title: the week is a board, and each column is a lunch.

## One-click build

Open this repo in Cursor and say:

```
start with auto model
```

Or run **`/build-lunchboard`**. Spec: [CURSOR_ONE_CLICK.md](CURSOR_ONE_CLICK.md).

## Next: fix plan (round 2)

Say **"start next plan"**, or run **`/build-next`**. This runs [prompts/execute-next.md](prompts/execute-next.md) through five phases:

| Phase | Goal | Needs from you |
| --- | --- | --- |
| 0 | Visual correctness at every width | Nothing |
| 1 | Live carry-over, cook logging per day, validation and ownership, timezone, pending and error states | Nothing |
| 2 | Playwright E2E, CI screenshots on every PR, optional hosted preview | Postgres and auth secrets, only for the hosted URL |
| 3 | First-run "what can you cook", better Fill, cook schedule, full meal editor, copy list, drag to place | Nothing |
| 4 | Opt-in leftover days | A yes (default: build it) |

## What works / stubbed / TBD

| Piece | Status | Notes |
| --- | --- | --- |
| Build spec | **Works** | `docs/`, `agents/`, `PLAN.md` |
| Fix plan | **Works** | `docs/09-review.md`, `docs/10-next-plan.md`, `/build-next` |
| Web app shell | **Works** | Next.js 15, Prisma SQLite, Auth.js |
| Meal library | **Partial** | Shelves, filter, and mark-known work; the selected filter pill is unreadable and tickets are cluttered (phase 0) |
| Ingredient editing | **Partial** | Add, remove, and edit work; Buy/Cupboard selection is unreadable (phase 0); no protein-option, side, or step editing (phase 3) |
| Week board | **Partial** | Placing, servings, protein, prep window, and sides work; columns clip at 1280–1440 and the phone layout overflows (phase 0) |
| Buy list and pantry check | **Partial** | Flat list and weekly pantry reset work; carry-over is a one-time snapshot, not live (phase 1) |
| Cook view | **Works** | Depth follows confidence; "I cooked this" can be counted more than once (phase 1) |
| Similar meals and fill empty days | **Partial** | Unit tested; Fill can repeat a meal before using others (phase 3) |
| Starter meals | **Works** | Twelve seeded lunches; all start under Needs a recipe until onboarding exists (phase 3) |
| Input validation | **Stubbed** | Zod installed, not used; two actions skip ownership checks (phase 1) |
| E2E tests / CI / preview URL | **TBD** | Phase 2 |
| Leftover days | **TBD** | Phase 4, opt-in |
| Google Keep / aisles / photos | **TBD** | Copy-list bridge in phase 3; integration later |

## Quick start

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Set `AUTH_SECRET` in `.env` to any long random string before you sign in.

Local sign-in:

- Email: `cook@lunchboard.local`
- Password: `lunchboard`

## Tests

```bash
npm test
npm run build
```

## Document map

| File | What it decides |
| --- | --- |
| [PLAN.md](PLAN.md) | Map of the locked docs |
| [docs/](docs/) | Product, data, screens, visual, seed, done |
| [docs/09-review.md](docs/09-review.md) | Round-2 review findings with ids |
| [docs/10-next-plan.md](docs/10-next-plan.md) | Phased fix plan with acceptance checks |
| [agents/](agents/) | Build roles, including principal UX/frontend |
