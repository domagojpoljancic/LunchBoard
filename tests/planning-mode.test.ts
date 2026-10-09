import { describe, expect, it } from "vitest";
import { clampPoolTarget } from "@/lib/inventory";
import {
  coerceDaysViewOff,
  convertByDayToPool,
  normalizePoolTarget,
} from "@/lib/pool";

describe("coerceDaysViewOff", () => {
  it("forces POOL when daysView is off", () => {
    expect(coerceDaysViewOff("BY_DAY", false)).toEqual({
      planningMode: "POOL",
      daysView: false,
    });
    expect(coerceDaysViewOff("POOL", false)).toEqual({
      planningMode: "POOL",
      daysView: false,
    });
  });

  it("keeps planningMode when daysView stays on", () => {
    expect(coerceDaysViewOff("BY_DAY", true)).toEqual({
      planningMode: "BY_DAY",
      daysView: true,
    });
    expect(coerceDaysViewOff("POOL", true)).toEqual({
      planningMode: "POOL",
      daysView: true,
    });
  });
});

describe("convertByDayToPool", () => {
  it("skips empty days and pins filled ones", () => {
    const drafts = convertByDayToPool([
      {
        dayPlanId: "empty",
        mealId: null,
        variantId: null,
        servings: 3,
        prepWindow: "EVENING_BEFORE",
        preparedDishId: null,
        cookKind: "RECIPE",
        sideIds: [],
        enabled: true,
      },
      {
        dayPlanId: "d2",
        mealId: "m1",
        variantId: "v1",
        servings: 4,
        prepWindow: "AT_LUNCH",
        preparedDishId: null,
        cookKind: "RECIPE",
        sideIds: ["s1", "s2"],
        enabled: true,
      },
      {
        dayPlanId: "d3",
        mealId: null,
        variantId: null,
        servings: 1,
        prepWindow: "EVENING_BEFORE",
        preparedDishId: "prep1",
        cookKind: "HEAT_PREPARED",
        sideIds: [],
        enabled: true,
      },
    ]);
    expect(drafts).toHaveLength(2);
    expect(drafts[0]).toMatchObject({
      mealId: "m1",
      pinnedDayPlanId: "d2",
      servings: 4,
      sideIds: ["s1", "s2"],
      sortOrder: 0,
    });
    expect(drafts[1]).toMatchObject({
      preparedDishId: "prep1",
      pinnedDayPlanId: "d3",
      sortOrder: 1,
    });
  });

  it("returns empty when no meals or prepared dishes", () => {
    expect(
      convertByDayToPool([
        {
          dayPlanId: "d1",
          mealId: null,
          variantId: null,
          servings: 3,
          prepWindow: "EVENING_BEFORE",
          preparedDishId: null,
          cookKind: "RECIPE",
          sideIds: [],
          enabled: false,
        },
      ]),
    ).toEqual([]);
  });
});

describe("clamp / normalize pool target", () => {
  it("clamps to 3–7 inclusive", () => {
    expect(clampPoolTarget(0)).toBe(3);
    expect(clampPoolTarget(2.4)).toBe(3);
    expect(clampPoolTarget(3)).toBe(3);
    expect(clampPoolTarget(5.4)).toBe(5);
    expect(clampPoolTarget(7)).toBe(7);
    expect(clampPoolTarget(99)).toBe(7);
    expect(normalizePoolTarget(1)).toBe(3);
    expect(normalizePoolTarget(6)).toBe(6);
  });
});
