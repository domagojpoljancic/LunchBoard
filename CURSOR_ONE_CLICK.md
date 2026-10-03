# One-click build

The human performs **one action**. Cursor builds LunchBoard.

## The action

In Cursor, with this repo open, either:

- say **start with auto model**
- say **start** or **build LunchBoard**
- run **`/build-lunchboard`**

The command file is `.cursor/commands/build-lunchboard.md`.

The human does not pick agents, paste prompts, choose a stack, or design the screens. Those are already specified.

## What the orchestrator does

The active agent **becomes the Orchestrator** and follows `prompts/execute.md`.

1. Read `CURSOR_RULES.md`, `PLAN.md`, `ARCHITECTURE.md`, `AGENT_ORCHESTRATOR.md`, and every file in `docs/` and `agents/`.
2. Scaffold the Next.js app, Prisma schema, and auth exactly as specified.
3. Seed the twelve meals from `docs/05-starter-meals.md`.
4. Implement list, scaling, similar, and fill logic, with the tests named in `docs/02-data-and-logic.md`, before building screens on top of guesses.
5. Adopt the **principal UX / frontend** role in `agents/ux_frontend_agent.md` and implement every screen in `docs/03-screens.md` to the visual spec in `docs/04-visual-design.md`.
6. Run QA against `docs/07-definition-of-done.md`. Fix failures. At most two QA fix loops, then stop with a written report.
7. Update the status table in `README.md` so it matches what actually runs.

Do not stop to ask the human which library, color, or feature to cut. The spec already chose.

## While you build

- Shopping-list correctness outranks visual polish. Both are required.
- A page that looks like a default dashboard is a failed frontend, even if the data is right.
- Do not add dinner planning, photos, aisles, nutrition numbers, or Google Keep.

## After it runs

```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Sign in with `cook@lunchboard.local` / `lunchboard`.

## Success

Every box in `docs/07-definition-of-done.md` is true, `npm test` passes, and `npm run build` passes.
