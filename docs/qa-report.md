# QA report

Date: 2026-10-06 (after next-plan execution)

## Automated

| Check | Result |
| --- | --- |
| `npm test` (26 tests) | Pass |
| `npm run build` | Pass |
| `npm run e2e` (4 Playwright tests) | Pass |
| Seed twice → 1 user, 12 meals | Pass (unchanged) |

## E2E coverage

| Spec | Result |
| --- | --- |
| Login → current Monday | Pass |
| Place Bolognese → list shows beef mince | Pass |
| Selected `.seg-active` contrast; 390 px no sideways scroll | Pass |
| Screenshots at 1440 / 390 | Pass (`e2e-artifacts/screens/`) |

## Round-2 findings

| Finding | Status |
| --- | --- |
| U1 invisible selected text | Fixed (`@layer base`) |
| U2 narrow columns / weekend width | Fixed (rails + wider enabled days) |
| U3 mobile header overflow | Fixed (two-row header + day stack) |
| U4 library clutter | Fixed (circular know + pencil) |
| U5 editor enums | Fixed (MealBasicsForm labels) |
| U6 empty-day prep noise | Fixed |
| C1 stale carry-over | Fixed (live rebuild) |
| C2 cook spam | Fixed (`cookedAt`) |
| C3 first-run shelves | Fixed (onboarding) |
| C4 Fill repeats too early | Fixed |
| C5 leftover over-buy | Fixed (opt-in leftover days) |
| C6 cook schedule hidden | Fixed (ticket meta) |
| C7 editor completeness | Partial (basics + ingredients; protein/side/step editors still light) |
| C8 copy list | Fixed |
| C9 bunch unit | Fixed |
| B1–B3 ownership / Zod / timezone | Fixed |
| D1–D3 see the app | CI screenshots; hosted URL still needs secrets |
| U9 drag to place | Deferred (click + keyboard remain) |

## Blocking open

None for merging this plan. Hosted preview waits on Postgres secrets.
