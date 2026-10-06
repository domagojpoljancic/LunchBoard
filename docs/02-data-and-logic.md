# Data and logic

This file is the source of truth for schema and list math. Tests must cover every worked example.

## Prisma schema

Use SQLite. Copy this shape. Enums are strings so the schema stays simple.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  timezone     String   @default("UTC")
  createdAt    DateTime @default(now())
  meals        Meal[]
  sides        Side[]
  weeks        Week[]
}

model Meal {
  id                        String   @id @default(cuid())
  userId                    String
  user                      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  catalogKey                String?
  name                      String
  confidence                String   @default("RECIPE")
  activeMinutes             Int?
  totalMinutes              Int?
  method                    String   @default("OTHER")
  cuisine                   String?
  baseServings              Int      @default(3)
  completePlate             Boolean  @default(false)
  cookCount                 Int      @default(0)
  nudgeDismissedAtCookCount Int      @default(0)
  createdAt                 DateTime @default(now())
  updatedAt                 DateTime @updatedAt
  variants                  ProteinVariant[]
  ingredients               Ingredient[]
  steps                     Step[]
  mealSides                 MealSide[]
  dayPlans                  DayPlan[]

  @@unique([userId, catalogKey])
}

model ProteinVariant {
  id           String       @id @default(cuid())
  mealId       String
  meal         Meal         @relation(fields: [mealId], references: [id], onDelete: Cascade)
  label        String
  proteinGroup String
  isDefault    Boolean      @default(false)
  sortOrder    Int          @default(0)
  ingredients  Ingredient[]
  dayPlans     DayPlan[]
}

model Ingredient {
  id        String          @id @default(cuid())
  mealId    String?
  meal      Meal?           @relation(fields: [mealId], references: [id], onDelete: Cascade)
  variantId String?
  variant   ProteinVariant? @relation(fields: [variantId], references: [id], onDelete: Cascade)
  sideId    String?
  side      Side?           @relation(fields: [sideId], references: [id], onDelete: Cascade)
  name      String
  quantity  Float?
  unit      String?
  role      String
  sortOrder Int             @default(0)
}

model Side {
  id            String        @id @default(cuid())
  userId        String
  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  catalogKey    String?
  name          String
  activeMinutes Int?
  ingredients   Ingredient[]
  mealSides     MealSide[]
  dayPlanSides  DayPlanSide[]

  @@unique([userId, catalogKey])
}

model MealSide {
  mealId          String
  sideId          String
  meal            Meal    @relation(fields: [mealId], references: [id], onDelete: Cascade)
  side            Side    @relation(fields: [sideId], references: [id], onDelete: Cascade)
  defaultSelected Boolean @default(false)

  @@id([mealId, sideId])
}

model Week {
  id                      String         @id @default(cuid())
  userId                  String
  user                    User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  weekStart               String
  diversityNudgeDismissed Boolean        @default(false)
  days                    DayPlan[]
  shoppingItems           ShoppingItem[]
  pantryItems             PantryItem[]

  @@unique([userId, weekStart])
}

model DayPlan {
  id         String           @id @default(cuid())
  weekId     String
  week       Week             @relation(fields: [weekId], references: [id], onDelete: Cascade)
  date       String
  enabled    Boolean          @default(true)
  mealId     String?
  meal       Meal?            @relation(fields: [mealId], references: [id], onDelete: SetNull)
  variantId  String?
  variant    ProteinVariant?  @relation(fields: [variantId], references: [id], onDelete: SetNull)
  servings   Int              @default(3)
  prepWindow String           @default("EVENING_BEFORE")
  sides      DayPlanSide[]

  @@unique([weekId, date])
}

model DayPlanSide {
  dayPlanId String
  sideId    String
  dayPlan   DayPlan @relation(fields: [dayPlanId], references: [id], onDelete: Cascade)
  side      Side    @relation(fields: [sideId], references: [id], onDelete: Cascade)

  @@id([dayPlanId, sideId])
}

model ShoppingItem {
  id        String  @id @default(cuid())
  weekId    String
  week      Week    @relation(fields: [weekId], references: [id], onDelete: Cascade)
  name      String
  nameKey   String
  quantity  Float?
  unit      String?
  checked   Boolean @default(false)
  origin    String
  sortOrder Int     @default(0)
}

model PantryItem {
  id      String  @id @default(cuid())
  weekId  String
  week    Week    @relation(fields: [weekId], references: [id], onDelete: Cascade)
  name    String
  nameKey String
  checked Boolean @default(false)
}

model Step {
  id        String @id @default(cuid())
  mealId    String
  meal      Meal   @relation(fields: [mealId], references: [id], onDelete: Cascade)
  kind      String
  body      String
  sortOrder Int    @default(0)
}
```

`catalogKey` is set for seed rows and null for meals the user adds. SQLite allows many nulls under the unique pair.

Allowed strings:

- confidence: `KNOW` | `PROMPT` | `RECIPE`
- method: `ONE_POT` | `TRAY` | `PAN` | `BAKE` | `ASSEMBLE` | `OTHER`
- proteinGroup: `BEEF` | `WHITE_MEAT` | `FISH` | `VEGETARIAN` | `VEGAN` | `DAIRY` | `OTHER`
- unit: `G` | `ML` | `PIECE`
- role: `BUY` | `PANTRY`
- prepWindow: `EVENING_BEFORE` | `SAME_DAY`
- origin: `PLAN` | `CARRIED`
- step kind: `KEYPOINT` | `STEP`
- dates: `YYYY-MM-DD`

A variant ingredient has both `variantId` and `mealId`. A shared ingredient has `mealId` and a null `variantId`. A side ingredient has only `sideId`.

## Name key

```text
trim, lowercase, collapse internal whitespace
```

` Olive  Oil ` and `olive oil` merge. `Cherry tomatoes` and `tomatoes` do not. Do not stem words.

## Cupboard dictionary

Exact `nameKey` match. These default to `PANTRY` when a person adds a line:

salt, black pepper, pepper, olive oil, oil, vegetable oil, soy sauce, sugar, cumin, oregano, dried oregano, paprika, sweet paprika, chili flakes, garlic powder, vinegar, miso, sesame oil, sesame, nutmeg, caraway

Onion, garlic, ginger, basil, and flour are not in this list.

## Scaling

Side amounts are stored for the meal’s `baseServings` and scale with the day.

```text
raw = quantity * dayServings / baseServings
PIECE: round half up, then if raw > 0 and the result is 0, use 1
G and ML: if raw >= 20, round half up to the nearest 5; otherwise round half up to the nearest 1
null quantity stays null
```

Half up means 1.5 becomes 2.

| Quantity | Unit | Base | Day | Result |
| --- | --- | --- | --- | --- |
| 450 | G | 3 | 3 | 450 |
| 450 | G | 3 | 6 | 900 |
| 450 | G | 3 | 2 | 300 |
| 100 | G | 3 | 4 | 135 |
| 1 | PIECE | 3 | 4 | 1 |
| 2 | PIECE | 3 | 4 | 3 |
| 1 | PIECE | 3 | 1 | 1 |

Tests live in `tests/scaling.test.ts` and must include this table.

## Collecting lines for a week

For each enabled day that has a meal:

1. Take shared ingredients (`variantId` null).
2. Take ingredients whose `variantId` is the day’s selected variant. If the day has no variant, use the default variant.
3. Take ingredients of each selected side.
4. Scale each line.
5. Keep role, name, and unit.

Ignore disabled days and days with no meal.

## Merge

Group by `nameKey + unit + role`. Sum quantities. If every quantity in the group is null, the merged quantity is null. Display name is the first name encountered.

Buy groups become shopping lines. Pantry groups become cupboard lines. Pantry lines ignore quantities in the UI.

`Cherry tomatoes` in grams and `cherry tomatoes` in pieces stay two lines.

## Rebuild shopping

`rebuildShopping(existing, desiredBuyLines)`:

1. Keep existing `CARRIED` lines in a working set. Drop existing `PLAN` lines that will be recreated.
2. For each desired line, find a working line with the same `nameKey` and unit.
3. If none exists, append `origin: PLAN`, unchecked, with the desired amount.
4. If one exists:
   - desired amount greater than the old amount: set the amount, set unchecked, set `origin: PLAN`
   - desired amount equal or lower: set the amount, keep `checked`, set `origin: PLAN`
   - null amounts: treat as equal
5. `CARRIED` lines that were not matched stay `CARRIED`.

Worked example:

- Existing carried: onion, 2 pieces, unchecked.
- Desired: onion, 2 pieces.
- Result: one onion line, 2 pieces, unchecked, origin `PLAN`.

Second example:

- Existing plan: chicken, 450 g, checked.
- Desired: chicken, 900 g.
- Result: chicken 900 g, unchecked, origin `PLAN`.

Third example:

- Existing carried: bread, 1 piece, unchecked.
- Desired: no bread.
- Result: bread stays, origin `CARRIED`.

Tests in `tests/list.test.ts` must cover these three, plus two days of onion 1 piece merging to 2 pieces.

## Rebuild pantry

Within the same week, recreate pantry rows from the desired names. If a `nameKey` was checked and is still desired, keep it checked. A new week does not import pantry rows. All ticks start false.

## New week carry

The carried set for week N is every **unchecked** shopping line in week N−1 at the moment week N is rebuilt, from both origins. Week N stores its own `checked` state for carried lines. When anything changes week N−1's list (a rebuild or a check toggle), week N is rebuilt if it exists (and up to four weeks forward). Do not snapshot carry-over only at week creation. Do not import checked lines. Do not import pantry ticks.

## Shelves

```text
protein overlap with a known meal's default variant: +3
same method: +3
same cuisine: +1
both active times known and abs(diff) <= 15: +1
```

A meal is “known” for this score when its confidence is `KNOW` (not merely `PROMPT`).

| Confidence | Shelf |
| --- | --- |
| `KNOW` or `PROMPT` | Can cook |
| `RECIPE` and best score >= 4 | Similar |
| `RECIPE` otherwise | Needs a recipe |

If the user has no `KNOW` meals, every `RECIPE` meal is Needs a recipe.

Worked scores against Bolognese (beef, pan, italian, 35 min), once Bolognese is `KNOW`:

| Meal | Score | Shelf |
| --- | --- | --- |
| Lasagne (beef, bake, italian, 40) | 5 | Similar |
| Burger (beef, pan, american, 25) | 7 | Similar |
| Goulash (beef, one pot, hungarian, 25) | 4 | Similar |

Burger: protein 3, method 3, time within 15 (1) = 7. Goulash: protein 3, time within 15 (1) = 4. Lasagne: protein 3, cuisine 1, time within 15 (1) = 5.

Tests in `tests/similar.test.ts`.

## Time warning

```text
active = meal.activeMinutes or 0, plus each selected side's activeMinutes or 0
total = meal.totalMinutes or active, plus each selected side's activeMinutes or 0
if the meal has neither time and no selected side has time: no warning
SAME_DAY warns when active > 30 or total > 45
EVENING_BEFORE warns when active > 60
```

| Window | Active | Total | Warning |
| --- | --- | --- | --- |
| SAME_DAY | 40 | 40 | yes |
| SAME_DAY | 20 | 50 | yes |
| SAME_DAY | 25 | 30 | no |
| EVENING_BEFORE | 70 | 70 | yes |
| EVENING_BEFORE | 40 | 90 | no |
| either | null | null | no |

Copy uses the hands-on number. Tests in `tests/warnings.test.ts`.

## Fill empty days

Input: enabled days in date order, the meal library, meals already on enabled days.

Tiers, in order: confidence `KNOW`, then `PROMPT`, then `RECIPE` meals whose shelf is Similar. Never a non-similar `RECIPE` meal.

For each empty enabled day, walk the tiers in order. In a tier, ignore meals already used on an enabled day this week. Score the rest:

```text
fits the day window (no warning): +3
times unknown: +1
protein group not yet on an enabled filled day: +2
protein group is WHITE_MEAT: +1
```

Use the first tier that still has an unused meal. Pick the highest score. Ties break by meal name, ascending.

If every tier’s meals are already on the week, walk the tiers again and allow a repeat. A second Bolognese is allowed only when no unused known, roughly-known, or similar meal is left.

Place it with the day’s current prep window and servings, the default variant, and the meal’s `defaultSelected` sides.

Do not change days that already have a meal. Do not enable a disabled day.

If a day has no candidate, leave it empty.

Tests in `tests/fill.test.ts`:

- A filled Wednesday is unchanged.
- With no `KNOW` or `PROMPT` meals and no similar meals, nothing is placed.
- With Bolognese known and Wednesday filled with Bolognese, an empty Monday prefers another tier candidate over a second Bolognese when one exists.

## Diversity sticky

Count protein groups on enabled days that have a meal. If any group has count >= 4 and `diversityNudgeDismissed` is false, show the sticky. Dismissing sets the flag on that week.

## Confidence nudge

Show when `cookCount >= nudgeDismissedAtCookCount + 3` and confidence is not `KNOW`.

- `RECIPE` offers `PROMPT`
- `PROMPT` offers `KNOW`

“Not now” sets `nudgeDismissedAtCookCount = cookCount`. “Yes” changes confidence and sets `nudgeDismissedAtCookCount = cookCount`.
