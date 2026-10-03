# Build order

The repo root is the app. Do not create a nested `app/` package.

## Commands the repo must have

| Script | Behavior |
| --- | --- |
| `dev` | Next.js dev server |
| `build` | Production build |
| `test` | Vitest, once |
| `db:seed` | `prisma db seed` |

`package.json` prisma seed points at `tsx prisma/seed.ts` or `ts-node`. Pick one and make it work.

## Wave 1 — shell

- `npx create-next-app` with TypeScript, Tailwind, App Router, no src dir only if you then match `ARCHITECTURE.md`. The architecture uses `src/`. Use `src/`.
- ESLint. No example API routes left over from the starter.
- Dependencies: `next`, `react`, `react-dom`, `@prisma/client`, `next-auth` (v5), `bcryptjs`, `zod`, `date-fns`, `date-fns-tz`.
- Dev: `prisma`, `typescript`, `tailwindcss`, `vitest`, `tsx`, `@types/bcryptjs`, `@types/node`.
- `.env.example`:

```text
DATABASE_URL="file:./dev.db"
AUTH_SECRET="replace-me"
```

- Generate a real `AUTH_SECRET` in `.env` locally. Do not commit `.env`.

## Wave 2 — logic

Implement the functions in `docs/02-data-and-logic.md` as pure functions. They take plain objects, not Prisma rows, so tests do not need a database.

Required test files and the cases they contain are listed in that doc. All of them pass before Wave 5.

## Wave 3 — database

- Migration from the schema.
- `prisma/seed.ts` creates the user `cook@lunchboard.local` with password `lunchboard` if missing.
- `prisma/seed-meals.ts` upserts catalog meals and sides for that user.
- Second seed run: still one user, still twelve meals.

## Wave 4 — actions

Zod-parse every input. Actions call `rebuildWeek` after:

- placing, clearing, or replacing a meal
- changing servings, variant, sides, enabled, or prep window
- saving ingredients or deleting a meal that appears on a week
- fill empty days

`rebuildWeek` loads days, computes desired lines, runs `rebuildShopping` and the pantry rebuild, and writes the rows.

Toggling a checkbox only flips `checked`.

## Wave 5 — UI

Follow `agents/ux_frontend_agent.md`. Order:

1. Tokens, fonts, layout shell, top bar
2. Week board with library and real seed meals
3. Day sheet
4. Lists page
5. Meal editor and add meal
6. Cook view
7. Login

## Wave 6 — prove

`npm test` and `npm run build`. Then QA.

## README after the build

Update the status table. The quick start must be the commands above. Keep the WIP banner if any done-box is open.
