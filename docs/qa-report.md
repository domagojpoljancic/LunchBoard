# QA report — Stock & reality

| Field | Value |
| --- | --- |
| Program | Stock & reality (M0–M5) |
| Date | 2026-10-08 |
| Agent | Orchestrator |

## Milestones

| Milestone | Exit | Status |
| --- | --- | --- |
| M0 | Q1–Q12 + E1–E4 in `docs/00-decisions.md` | Pass |
| M1 | Inventory CRUD + confirm/skip/later + decrement/undo; E2E | Pass (unit + e2e specs) |
| M2 | Mode A advisories; purchase opt-in; core `list.test.ts` unchanged | Pass |
| M3 | Modes + pool list math; default BY_DAY | Pass |
| M4 | Heat plans; portion confirm; Mode B apply (CARRIED safe) | Pass |
| M5 | Staple warn, pool sweep, leftovers no double-decrement, docs | Pass |

## Tests

- `npm test` — 83 passed (includes inventory, cook-confirm, list-netting, pool-list, prepared, pending-cooks; existing list/scaling/cook green).
- `npm run build` — green.
- E2E specs added: `e2e/inventory-confirm.spec.ts`, `e2e/pool-mode.spec.ts`, `e2e/heat-plan.spec.ts`.

## Guardian / non-goals

No dinner planning, photos, aisles, macros, offline, Google Keep, barcode/OCR, household sharing, or prepared-dish taxonomy shipped.

## Open exits

- Hosted preview still TBD (Postgres).
- Meal editor sides/steps polish still partial (pre-existing).
- Full Playwright suite should be run in CI / local e2e against seeded DB after merge.
