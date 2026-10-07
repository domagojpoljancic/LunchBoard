# LunchBoard

> **WIP — working name.** The round-2 fix plan is merged on `main`: visual bugs, live carry-over,
> onboarding, leftovers, cook logging, and CI/E2E. A standards audit then closed a critical Auth.js
> advisory, two tap-target bugs, and some doc drift.
>
> Still open: the meal editor cannot attach sides or edit steps, there is no
> hosted preview (needs Postgres secrets), and `next@15` carries two build-time `postcss` advisories
> that only a `next@16` major upgrade clears. Eight boxes in
> [docs/07-definition-of-done.md](docs/07-definition-of-done.md) are still unticked, so the banner stays.

Weekday lunch planning on a board. You keep the meals you know, add your own, place them on the days you are actually home, and get a buy list plus a pantry check.

**LunchBoard** is a working title: the week is a board, and each column is a lunch.

## One-click build

Open this repo in Cursor and say:

```
start with auto model
```

Or run **`/build-lunchboard`**. Spec: [CURSOR_ONE_CLICK.md](CURSOR_ONE_CLICK.md).

## Next plan

Say **"start next plan"**, or run **`/build-next`**. Spec: [docs/10-next-plan.md](docs/10-next-plan.md), review: [docs/09-review.md](docs/09-review.md).

## What works / stubbed / TBD

| Piece | Status | Notes |
| --- | --- | --- |
| Build + fix specs | **Works** | `docs/`, `/build-lunchboard`, `/build-next` |
| Web app shell | **Works** | Next.js 15, Prisma SQLite, Auth.js |
| Meal library | **Works** | Shelves, protein filter, circular know check, pencil edit |
| Ingredient editing | **Works** | Add/remove/edit; Buy/Cupboard readable |
| Week board | **Works** | Meals on top, days fill the screen, zoom, day card on the left |
| Buy list and pantry | **Works** | Live carry-over, copy list, weekly pantry reset |
| Cook view | **Works** | Grouped ingredients; one cook log per day + undo |
| Fill empty days | **Works** | Known → similar → repeat last; TRY_NEW tag |
| Onboarding | **Works** | First-run “what can you cook?” |
| Leftover days | **Works** | Opt-in from the day sheet |
| E2E + CI | **Works** | 11 Playwright tests, typecheck and lint in CI, screenshot artifacts |
| Meal editor: proteins/sides/steps edit | **Partial** | Basics + ingredients; attach/create side and step edit still light |
| Drag to place | **Works** | Drag onto a day, or select and click. Keys 1–7 still place |
| Hosted preview URL | **TBD** | Needs Postgres `DATABASE_URL` + `AUTH_SECRET` (+ Vercel) |
| Google Keep / aisles / photos | **TBD** | Copy list is the bridge for now |
| `next@16` upgrade | **TBD** | Clears the last two `npm audit` advisories (build-time `postcss`) |

## Quick start

Node 22 or newer.

```bash
git clone https://github.com/domagojpoljancic/LunchBoard.git
cd LunchBoard
npm install
cp .env.example .env
npx prisma migrate dev   # creates prisma/dev.db and seeds the 12 starter meals
npm run dev
```

Then open <http://localhost:3000>. Sign in with:

- Email: `cook@lunchboard.local`
- Password: `lunchboard`

Both fields come prefilled. `.env.example` ships a placeholder `AUTH_SECRET` that works for local use;
replace it with a long random string anywhere the app is reachable by someone else. Re-seeding is safe,
and `npx prisma db seed` on its own will top up the starter meals without touching your edits.

## Tests

```bash
npm test        # 52 unit and DB tests against prisma/test.db
npm run build
npm run e2e     # Playwright, production build on port 3100, wipes prisma/e2e.db
```

`npm run e2e` builds and starts the app itself; do not point it at `npm run dev`. Results and the
open items are written up in [docs/qa-report.md](docs/qa-report.md).

## Hosted preview

SQLite will not persist on Vercel. To get a URL:

1. Create a Postgres database (Supabase or Neon).
2. Set secrets: `DATABASE_URL`, `DIRECT_URL` (migrations), `AUTH_SECRET`.
3. Import the repo in Vercel (or set `VERCEL_TOKEN` for the agent).
4. Switch Prisma `provider` to `postgresql` and redeploy.

Until then, open any pull request on GitHub — CI uploads board screenshots as artifacts.

## Document map

| File | What it decides |
| --- | --- |
| [PLAN.md](PLAN.md) | Map of the locked docs |
| [docs/](docs/) | Product, data, screens, visual, seed, done |
| [docs/09-review.md](docs/09-review.md) | Round-2 review findings |
| [docs/10-next-plan.md](docs/10-next-plan.md) | Phased fix plan |
| [agents/](agents/) | Build roles, including principal UX/frontend |
