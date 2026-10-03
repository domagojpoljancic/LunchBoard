# Architecture

LunchBoard is one Next.js app at the repo root.

## Stack

| Piece | Choice |
| --- | --- |
| App | Next.js App Router, TypeScript strict |
| UI | React, Tailwind, CSS variables from `docs/04-visual-design.md` |
| Fonts | `next/font/google`: Fraunces, Outfit |
| Data | Prisma, SQLite file `prisma/dev.db` |
| Auth | Auth.js credentials, JWT session, bcrypt |
| Validation | Zod on server actions |
| Dates | date-fns and date-fns-tz, week starts Monday |
| Tests | Vitest for `src/lib` |

No Docker. No component library theme. Radix is allowed only as a headless behavior (dialog, switch) if the visual result still matches the spec. Copy the tokens; do not import a preset theme.

## Runtime shape

```text
Browser
  week board, library, editor, lists, cook
        │ server actions
        ▼
src/lib          pure functions (tested)
        │
        ▼
Prisma           User, Meal, Week, lists
```

The UI does not add quantities itself. It calls an action. The action loads the week, calls `rebuildWeek`, and saves.

## Routes

| Route | Page |
| --- | --- |
| `/login` | Sign in |
| `/week` | Redirect to the week that contains today |
| `/week/[weekStart]` | Board. `weekStart` is the Monday `YYYY-MM-DD` |
| `/meals/new` | Add a meal |
| `/meals/[id]` | Editor |
| `/list/[weekStart]` | Buy list and cupboard |
| `/cook/[dayId]` | Cook view for one day |

## File tree to create

```text
src/app/layout.tsx
src/app/globals.css
src/app/login/page.tsx
src/app/week/page.tsx
src/app/week/[weekStart]/page.tsx
src/app/meals/new/page.tsx
src/app/meals/[id]/page.tsx
src/app/list/[weekStart]/page.tsx
src/app/cook/[dayId]/page.tsx
src/app/actions/meals.ts
src/app/actions/week.ts
src/app/actions/list.ts
src/app/actions/cook.ts
src/components/WeekBoard.tsx
src/components/DayColumn.tsx
src/components/MealTicket.tsx
src/components/Library.tsx
src/components/DaySheet.tsx
src/components/IngredientEditor.tsx
src/components/TopBar.tsx
src/components/CoachSticky.tsx
src/components/BuyList.tsx
src/components/CookView.tsx
src/lib/name-key.ts
src/lib/scaling.ts
src/lib/list.ts
src/lib/similar.ts
src/lib/warnings.ts
src/lib/fill.ts
src/lib/weeks.ts
src/lib/auth.ts
src/lib/pantry-dictionary.ts
prisma/schema.prisma
prisma/seed.ts
prisma/seed-meals.ts
tests/scaling.test.ts
tests/list.test.ts
tests/similar.test.ts
tests/warnings.test.ts
tests/fill.test.ts
.env.example
```

## Week lifecycle

1. On `/week`, compute Monday of today in the user timezone.
2. If that week row is missing, create it and seven day rows. Monday–Friday `enabled: true`. Prep window `EVENING_BEFORE`. Servings 3.
3. Import unchecked buy lines from the previous week as `CARRIED`, then rebuild so lines the new week already needs are absorbed.
4. Pantry rows for a new week start unchecked.

## Auth

- One dev user seeded.
- Login form posts email and password.
- `middleware.ts` protects everything except `/login` and auth routes.
- After login, if `timezone` is `UTC`, set it from the browser timezone once.

## What the client stores

Nothing about meals. Session cookie only. Checked lines live in the database so a refresh keeps them.
