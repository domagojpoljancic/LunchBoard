import { describe, expect, it } from "vitest";
import {
  collectPoolLines,
  convertByDayToPool,
  dayShouldCollectRecipe,
  mergeDayAndPoolDesired,
  normalizePoolTarget,
} from "@/lib/pool";

describe("pool collect", () => {
  it("collects N pool entries × servings and merges", () => {
    const lines = collectPoolLines([
      {
        id: "a",
        servings: 3,
        mealId: "m1",
        preparedDishId: null,
        pinnedDayPlanId: null,
        baseServings: 3,
        selectedVariantId: null,
        defaultVariantId: null,
        shared: [
          {
            name: "onion",
            quantity: 1,
            unit: "PIECE",
            role: "BUY",
          },
        ],
        variantIngredients: [],
        sideIngredients: [],
      },
      {
        id: "b",
        servings: 3,
        mealId: "m2",
        preparedDishId: null,
        pinnedDayPlanId: null,
        baseServings: 3,
        selectedVariantId: null,
        defaultVariantId: null,
        shared: [
          {
            name: "onion",
            quantity: 1,
            unit: "PIECE",
            role: "BUY",
          },
        ],
        variantIngredients: [],
        sideIngredients: [],
      },
    ]);
    expect(lines).toHaveLength(1);
    expect(lines[0].quantity).toBe(2);
  });

  it("pin replaces synthetic — pinned entry contributes 0", () => {
    const lines = collectPoolLines([
      {
        id: "a",
        servings: 3,
        mealId: "m1",
        preparedDishId: null,
        pinnedDayPlanId: "day1",
        baseServings: 3,
        selectedVariantId: null,
        defaultVariantId: null,
        shared: [
          {
            name: "pasta",
            quantity: 450,
            unit: "G",
            role: "BUY",
          },
        ],
        variantIngredients: [],
        sideIngredients: [],
      },
    ]);
    expect(lines).toEqual([]);
  });

  it("heat/leftover-style prepared entries contribute 0 recipe lines", () => {
    const lines = collectPoolLines([
      {
        id: "a",
        servings: 1,
        mealId: null,
        preparedDishId: "prep1",
        pinnedDayPlanId: null,
        baseServings: 3,
        selectedVariantId: null,
        defaultVariantId: null,
        shared: [
          {
            name: "pasta",
            quantity: 450,
            unit: "G",
            role: "BUY",
          },
        ],
        variantIngredients: [],
        sideIngredients: [],
      },
    ]);
    expect(lines).toEqual([]);
  });
});

describe("pool helpers", () => {
  it("clamps pool target 3–7", () => {
    expect(normalizePoolTarget(2)).toBe(3);
    expect(normalizePoolTarget(5)).toBe(5);
    expect(normalizePoolTarget(9)).toBe(7);
  });

  it("by-day → pool keeps optional pins", () => {
    const drafts = convertByDayToPool([
      {
        dayPlanId: "d1",
        mealId: "m1",
        variantId: "v1",
        servings: 3,
        prepWindow: "EVENING_BEFORE",
        preparedDishId: null,
        cookKind: "RECIPE",
        sideIds: ["s1"],
        enabled: true,
      },
    ]);
    expect(drafts[0].pinnedDayPlanId).toBe("d1");
    expect(drafts[0].mealId).toBe("m1");
  });

  it("dayShouldCollectRecipe skips heat and leftovers", () => {
    expect(
      dayShouldCollectRecipe({
        enabled: true,
        mealId: "m",
        leftoverOfDayId: null,
        cookKind: "RECIPE",
      }),
    ).toBe(true);
    expect(
      dayShouldCollectRecipe({
        enabled: true,
        mealId: "m",
        leftoverOfDayId: null,
        cookKind: "HEAT_PREPARED",
        preparedDishId: "p",
      }),
    ).toBe(false);
    expect(
      dayShouldCollectRecipe({
        enabled: true,
        mealId: "m",
        leftoverOfDayId: "other",
      }),
    ).toBe(false);
  });

  it("dayShouldCollectRecipe rejects disabled days and LEFTOVER cookKind", () => {
    expect(
      dayShouldCollectRecipe({
        enabled: false,
        mealId: "m",
        leftoverOfDayId: null,
        cookKind: "RECIPE",
      }),
    ).toBe(false);
    expect(
      dayShouldCollectRecipe({
        enabled: true,
        mealId: "m",
        leftoverOfDayId: null,
        cookKind: "LEFTOVER",
      }),
    ).toBe(false);
    expect(
      dayShouldCollectRecipe({
        enabled: true,
        mealId: null,
        leftoverOfDayId: null,
        cookKind: "RECIPE",
      }),
    ).toBe(false);
  });

  it("mergeDayAndPoolDesired merges duplicate nameKey+unit lines", () => {
    const merged = mergeDayAndPoolDesired(
      [
        {
          name: "onion",
          nameKey: "onion",
          quantity: 1,
          unit: "PIECE",
          role: "BUY",
        },
      ],
      [
        {
          name: "onion",
          nameKey: "onion",
          quantity: 2,
          unit: "PIECE",
          role: "BUY",
        },
      ],
    );
    expect(merged).toHaveLength(1);
    expect(merged[0].quantity).toBe(3);
  });

  it("collectPoolLines skips entries with no mealId even without preparedDish", () => {
    expect(
      collectPoolLines([
        {
          id: "empty",
          servings: 3,
          mealId: null,
          preparedDishId: null,
          pinnedDayPlanId: null,
          baseServings: 3,
          selectedVariantId: null,
          defaultVariantId: null,
          shared: [
            {
              name: "onion",
              quantity: 1,
              unit: "PIECE",
              role: "BUY",
            },
          ],
          variantIngredients: [],
          sideIngredients: [],
        },
      ]),
    ).toEqual([]);
  });
});
