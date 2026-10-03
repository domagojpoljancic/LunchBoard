# QA report

Date: 2026-10-03

## Automated

| Check | Result |
| --- | --- |
| `npm test` (21 tests) | Pass |
| `npm run build` | Pass |
| Seed twice → 1 user, 12 meals | Pass |
| Smoke: Bolognese ×6 → beef mince 900 g | Pass |
| Smoke: switch to vegan mince → 720 g, beef gone | Pass |
| `/login` HTTP 200 | Pass |

## Definition of done (manual / code-path)

| Box | Result | Notes |
| --- | --- | --- |
| Runs scripts and seed | Pass | |
| Week Mon–Fri on, weekend off | Pass | `ensureWeek` |
| Place meal, servings, protein swap, list rebuild | Pass | smoke + actions |
| Ingredient add/remove rebuilds lists | Pass | actions call `rebuildWeeksForMeal` |
| Carry-over / pantry reset rules | Pass | unit tests + `ensureWeek` |
| Cook view by confidence | Pass | implemented |
| Fill empty days does not overwrite | Pass | unit tests + action |
| Visual system (paper, Fraunces, stripes) | Pass | globals + components |
| Copy deck strings used | Pass | major strings from `docs/08-copy.md` |

## Non-blocking

- Meal editor confidence controls are separate form actions; polish later if needed.
- No browser E2E (Playwright) in this pass — list math covered by Vitest + smoke script.
- Diversity sticky and cook nudge are implemented; not click-tested in a browser here.

## Blocking open

None for the first usable loop.
