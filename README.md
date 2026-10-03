# LunchBoard

> **WIP — working name.** First usable app loop is running locally. Polish and broader browser QA can still improve.

Weekday lunch planning on a board. You keep the meals you know, add your own, place them on the days you are actually home, and get a buy list plus a pantry check.

**LunchBoard** is a working title: the week is a board, and each column is a lunch.

## One-click build

Open this repo in Cursor and say:

```
start with auto model
```

Or run **`/build-lunchboard`**. Spec: [CURSOR_ONE_CLICK.md](CURSOR_ONE_CLICK.md).

## What works / stubbed / TBD

| Piece | Status | Notes |
| --- | --- | --- |
| Build spec | **Works** | `docs/`, `agents/`, `PLAN.md` |
| Web app shell | **Works** | Next.js 15, Prisma SQLite, Auth.js |
| Meal library | **Works** | Shelves, protein filter, mark known |
| Ingredient editing | **Works** | Add/remove/edit on every meal |
| Week board | **Works** | Days, servings, protein, prep window, sides |
| Buy list and pantry check | **Works** | Flat list, carry-over, weekly pantry reset |
| Cook view | **Works** | Depth follows confidence; cook count + nudge |
| Similar meals and fill empty days | **Works** | Unit tested; fill button on the board |
| Starter meals | **Works** | Twelve seeded lunches |
| Google Keep / aisles / photos | **TBD** | Out of this version |

## Quick start

```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

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
| [agents/](agents/) | Build roles, including principal UX/frontend |
