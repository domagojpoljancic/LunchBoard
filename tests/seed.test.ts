import { describe, expect, it } from "vitest";
import { MEALS, SIDES } from "../prisma/seed-meals";
import { isPantryDefault } from "@/lib/pantry-dictionary";

// Fresh onion, garlic, ginger, and basil are not in the cupboard dictionary,
// but docs/05-starter-meals.md's "Seed rules" section calls out that the
// starter meals treat garlic/ginger as the dried-or-jar pantry measure
// unless a recipe's shared BUY list names the fresh ingredient. These two
// are the only sanctioned PANTRY-role exceptions in the seed data.
const PANTRY_ROLE_EXCEPTIONS = new Set(["garlic", "ginger"]);

const sideKeys = new Set(SIDES.map((s) => s.catalogKey));

describe("seed meals", () => {
  it("has at least one meal and one side", () => {
    expect(MEALS.length).toBeGreaterThan(0);
    expect(SIDES.length).toBeGreaterThan(0);
  });

  it("every meal has 1-2 variants with exactly one default", () => {
    for (const meal of MEALS) {
      expect(meal.variants.length).toBeGreaterThanOrEqual(1);
      expect(meal.variants.length).toBeLessThanOrEqual(2);
      const defaults = meal.variants.filter((v) => v.isDefault);
      expect(defaults, `meal "${meal.name}" should have exactly one default variant`).toHaveLength(1);
    }
  });

  it("every side catalogKey a meal references exists in SIDES", () => {
    for (const meal of MEALS) {
      for (const s of meal.sides) {
        expect(
          sideKeys.has(s.catalogKey),
          `meal "${meal.name}" references unknown side "${s.catalogKey}"`,
        ).toBe(true);
      }
    }
  });

  it("meal catalogKeys are unique", () => {
    const keys = MEALS.map((m) => m.catalogKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("side catalogKeys are unique", () => {
    const keys = SIDES.map((s) => s.catalogKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("every PANTRY-role ingredient is in the cupboard dictionary or a sanctioned exception", () => {
    const offenders: string[] = [];
    const allIngredients = [
      ...MEALS.flatMap((m) => [
        ...m.shared,
        ...m.variants.flatMap((v) => v.ingredients),
      ]),
      ...SIDES.flatMap((s) => s.ingredients),
    ];
    for (const ing of allIngredients) {
      if (ing.role !== "PANTRY") continue;
      if (isPantryDefault(ing.name)) continue;
      if (PANTRY_ROLE_EXCEPTIONS.has(ing.name.toLowerCase())) continue;
      offenders.push(ing.name);
    }
    expect(offenders).toEqual([]);
  });

  it("lemon and lime are BUY, not PANTRY, everywhere in the seed", () => {
    const offenders: string[] = [];
    const allIngredients = [
      ...MEALS.flatMap((m) => [
        ...m.shared,
        ...m.variants.flatMap((v) => v.ingredients),
      ]),
      ...SIDES.flatMap((s) => s.ingredients),
    ];
    for (const ing of allIngredients) {
      const lower = ing.name.toLowerCase();
      if ((lower === "lemon" || lower === "lime") && ing.role !== "BUY") {
        offenders.push(`${ing.name}: ${ing.role}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
