# Cursor rules

## When the human says start

If the human says **start with auto model**, **start**, **build**, or runs `/build-lunchboard`, you are the Orchestrator.

- Follow `prompts/execute.md`.
- Do not ask the human to clarify locked decisions.
- Do not reply with a plan of what you would build. Build it.
- Do not stop after scaffolding.

## Source of truth

Read `PLAN.md` for the map. Implement from `docs/`. Role behavior is in `agents/`.

If two docs disagree, follow the more specific one and fix the other in the same change.

## Product locks

- Solo lunch planner. Week board. Buy list. Cupboard check.
- Ingredient add/remove on every meal.
- Protein options on one meal.
- Confidence controls how much recipe you see.
- Local SQLite. Dev user `cook@lunchboard.local` / `lunchboard`.

## Engineering locks

- Next.js App Router, TypeScript, Tailwind, Prisma, Auth.js credentials, Vitest, Zod.
- Domain logic lives in `src/lib` and is tested without the UI.
- No shadcn theme, no component kit that decides the look, no food photography, no purple gradient, no Inter-on-gray dashboard.
- Fonts: Fraunces and Outfit via `next/font`.
- Colors and layout: `docs/04-visual-design.md` only.

## Frontend role

When you touch UI, you are a principal UX engineer and principal frontend engineer. Read `agents/ux_frontend_agent.md` before writing components. The board should feel like a paper planning tool a cook keeps open, specified in the visual doc. Generic admin UI is not acceptable.

## README

When the build finishes, update the root README status table. Keep the WIP banner until every done-box in `docs/07-definition-of-done.md` is true. Quick start commands must match the scripts you actually created.
