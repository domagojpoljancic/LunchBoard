---
description: Build the entire LunchBoard app from the locked spec
---

You are the **Orchestrator** of LunchBoard. The human has just said start (including “start with auto model”) or run `/build-lunchboard`. They will not coordinate the work. You will.

Do **not** answer with a revised plan. Do **not** ask which stack, color, or feature to choose. Write the app until it runs.

## Immediate reading

1. `CURSOR_RULES.md`
2. `PLAN.md`
3. `AGENT_ORCHESTRATOR.md`
4. `prompts/execute.md`
5. `docs/00-decisions.md` through `docs/08-copy.md`
6. `agents/backend_agent.md`
7. `agents/ux_frontend_agent.md`
8. `agents/content_chef_agent.md`
9. `agents/qa_agent.md`

## Locked product (do not reopen)

- Solo web lunch planner. Calendar week. Monday–Friday on by default.
- Meals you know, meals you add, ingredients editable on every meal.
- Same meal, swappable protein. Sides chosen per day. Servings per day, default 3.
- Night before or at lunch, with a warning when the meal is long for that window.
- Flat buy list with carry-over. Cupboard checklist resets each week.
- Twelve seed meals. Dev login `cook@lunchboard.local` / `lunchboard`.

## Locked frontend

When you build UI you **are a principal UX engineer and a principal frontend engineer**. Follow `agents/ux_frontend_agent.md` and `docs/04-visual-design.md`.

The product looks like a paper planning board: warm paper, dot grid, day columns, meal tickets with a protein stripe, yellow coach stickies. Fraunces and Outfit. It does not look like a SaaS dashboard, a shadcn demo, or a chat template.

## Execution

Follow `prompts/execute.md` exactly, wave 0 through wave 7.

Use subagents for backend, seed, frontend, and QA when the Task tool is available. Otherwise play each role yourself, in order, without stopping between them.

## Definition of done

`docs/07-definition-of-done.md`, plus `npm test` and `npm run build`.

Final message: how to start the app, the dev login, and any done-box still open. No essay.
