# LunchBoard

> **WIP — working name.** The build spec is locked. The app is not built yet. Nothing here runs until you start the one-click build.

Weekday lunch planning on a board. You keep the meals you know, add your own, place them on the days you are actually home, and get a buy list plus a pantry check.

**LunchBoard** is a working title: the week is a board, and each column is a lunch.

## One-click build

Open this repo in Cursor and say:

```
start with auto model
```

Or run the command **`/build-lunchboard`**.

That starts the orchestrator. It reads the spec and builds the whole app: data, shopping-list logic, seed meals, and the interface. You do not assign roles and you do not paste prompts. The frontend role is a principal UX engineer, specified in `agents/ux_frontend_agent.md` and `docs/04-visual-design.md`.

Details: [CURSOR_ONE_CLICK.md](CURSOR_ONE_CLICK.md).

## What works / stubbed / TBD

| Piece | Status | Notes |
| --- | --- | --- |
| Build spec | **Locked** | `docs/`, `agents/`, `PLAN.md` |
| One-click command | **Ready** | `/build-lunchboard` or “start with auto model” |
| Web app | **TBD** | Created by the one-click build |
| Meal library | **TBD** | Spec in `docs/03-screens.md` |
| Week board | **TBD** | Spec in `docs/04-visual-design.md` |
| Buy list and pantry check | **TBD** | Rules in `docs/02-data-and-logic.md` |
| Cook view, similar meals, fill empty days | **TBD** | Included in the one-click build, not a later idea |

After a build, the orchestrator updates this table to match what actually runs.

## Quick start

Before the build, there is nothing to install.

After the build, from the repo root:

```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Local sign-in (created by the seed):

- Email: `cook@lunchboard.local`
- Password: `lunchboard`

## Document map

| File | What it decides |
| --- | --- |
| [PLAN.md](PLAN.md) | How the documents fit together, and the rules that do not get reopened |
| [docs/00-decisions.md](docs/00-decisions.md) | Product rules in full |
| [docs/01-flows.md](docs/01-flows.md) | Week planning, editing meals, lists, cooking |
| [docs/02-data-and-logic.md](docs/02-data-and-logic.md) | Schema, scaling, merge, carry-over, similar, fill |
| [docs/03-screens.md](docs/03-screens.md) | Every screen, state, and action |
| [docs/04-visual-design.md](docs/04-visual-design.md) | Visual system the frontend must implement |
| [docs/05-starter-meals.md](docs/05-starter-meals.md) | The twelve seed meals |
| [docs/06-build-order.md](docs/06-build-order.md) | Waves, files, commands |
| [docs/07-definition-of-done.md](docs/07-definition-of-done.md) | Acceptance tests |
| [docs/08-copy.md](docs/08-copy.md) | Interface language |
| [agents/](agents/) | Roles the orchestrator adopts, including principal UX/frontend |
