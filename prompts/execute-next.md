# Execute the next plan

You are the Orchestrator. The app already exists and works. You are fixing it, not rebuilding it. Do not ask the human to choose between phases.

## Read first

1. `CURSOR_RULES.md`
2. `docs/00-decisions.md` (locked; do not reopen)
3. `docs/09-review.md` (what is wrong, with ids)
4. `docs/10-next-plan.md` (what to do, phase by phase)
5. `docs/02-data-and-logic.md`, `docs/03-screens.md`, `docs/04-visual-design.md`, `docs/08-copy.md`
6. `agents/ux_frontend_agent.md`, `agents/backend_agent.md`, `agents/qa_agent.md`, `agents/product_guardian.md`

## Setup

```bash
npm install
cp -n .env.example .env   # then set AUTH_SECRET to a long random string
npx prisma migrate dev
npx prisma db seed
npm test
```

## Phases

Do phases 0 to 4 of `docs/10-next-plan.md` in order. For each phase:

1. Use the role named in the phase. For UI work you **are a principal UX engineer and a principal frontend engineer**. The board must look like a paper planning board, not a dashboard.
2. Make the change, with tests where the phase lists them.
3. Update the spec docs the phase names in the same commit. If code and docs disagree, fix the docs.
4. Run `npm test` and `npm run build`. From phase 2 on, also run `npm run e2e`.
5. Look at the screenshots in `e2e-artifacts/` (from phase 2 on) or take them yourself with Playwright for phase 0. Fix what looks wrong before moving on. Reading code is not visual QA.
6. Commit, with one commit per phase or per numbered step.

## Rules that apply

- Phase 2.3 (hosted preview) runs only if `DATABASE_URL` points at Postgres and `AUTH_SECRET` is set in the environment. Otherwise write the steps into the README and continue.
- Phase 4 (leftover days) runs unless `docs/00-decisions.md` says "Leftover days — declined".
- `rebuildWeek` stays the only writer of shopping and pantry rows.
- Never drop a failing test to finish. Fix the cause.

## Finish

- Rewrite `docs/qa-report.md` from the E2E run and screenshots.
- Update the README status table and WIP banner.
- Final message: what changed by phase, what was skipped and why, and the preview URL or the secrets still needed. No essay.
