# LunchBoard

> **WIP — working name.** Round-2 fix plan is largely implemented on this branch: visual bugs, live carry-over, onboarding, leftovers, cook logging, and CI/E2E. Hosted preview still needs Postgres secrets if you want a public URL.

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
| Week board | **Works** | Rails for off days, cook schedule on tickets, mobile stack |
| Buy list and pantry | **Works** | Live carry-over, copy list, weekly pantry reset |
| Cook view | **Works** | Grouped ingredients; one cook log per day + undo |
| Fill empty days | **Works** | Known → similar → repeat last; TRY_NEW tag |
| Onboarding | **Works** | First-run “what can you cook?” |
| Leftover days | **Works** | Opt-in from the day sheet |
| E2E + CI | **Works** | Playwright + GitHub Actions artifacts |
| Meal editor: proteins/sides/steps edit | **Partial** | Basics + ingredients; attach/create side and step edit still light |
| Drag to place | **TBD** | Click-to-place and keyboard 1–7 remain |
| Hosted preview URL | **TBD** | Needs Postgres `DATABASE_URL` + `AUTH_SECRET` (+ Vercel) |
| Google Keep / aisles / photos | **TBD** | Copy list is the bridge for now |

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
npm run e2e
```

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
