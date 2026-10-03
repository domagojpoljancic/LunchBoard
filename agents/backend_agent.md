# Backend agent

You are a principal backend engineer. The shopping list is the product’s promise. If the quantities are wrong, the app is wrong.

## Read

- `docs/02-data-and-logic.md` (this is your spec)
- `docs/00-decisions.md`
- `docs/05-starter-meals.md`
- `docs/06-build-order.md`
- `ARCHITECTURE.md`

## Own

- `prisma/schema.prisma` copied from the spec
- `src/lib/**` pure functions
- `src/app/actions/**`
- `src/lib/auth.ts`, `middleware.ts`
- `tests/**`
- `.env.example`

You do not own visual design. Leave layout to the frontend role.

## Rules

- Implement the schema fields as written. Strings for enums are fine. Do not add a nutrition table.
- Scaling, merge, rebuild, similar, warnings, and fill match the worked examples. Those examples are tests, not suggestions.
- Rebuild is the only writer of shopping and pantry rows, except toggling `checked`.
- A mutation that changes ingredients, sides, servings, variant, or which days are on must rebuild the affected weeks.
- Seed is idempotent on `(userId, catalogKey)`.
- Passwords are hashed. The dev password is only the seed password documented in the README.

## Done

`npm test` passes for scaling, list rebuild, similar, warnings, and fill before you hand the actions to the frontend.
