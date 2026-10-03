import { describe, expect, it } from "vitest";
import { fillEmptyDays, type FillDay, type FillMeal } from "@/lib/fill";

const bolognese: FillMeal = {
  id: "bol",
  name: "Bolognese",
  confidence: "KNOW",
  method: "PAN",
  cuisine: "italian",
  activeMinutes: 35,
  totalMinutes: 70,
  defaultProteinGroup: "BEEF",
  defaultVariantId: "bol-beef",
  defaultSideIds: ["pasta"],
};

const chicken: FillMeal = {
  id: "chick",
  name: "Chicken grain bowl",
  confidence: "KNOW",
  method: "TRAY",
  cuisine: "mediterranean",
  activeMinutes: 25,
  totalMinutes: 45,
  defaultProteinGroup: "WHITE_MEAT",
  defaultVariantId: "chick-v",
  defaultSideIds: [],
};

function days(partial: Partial<FillDay>[]): FillDay[] {
  const base = ["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08"];
  return base.map((date, i) => ({
    id: `d${i}`,
    date,
    enabled: true,
    mealId: null,
    prepWindow: "EVENING_BEFORE",
    servings: 3,
    ...partial[i],
  }));
}

describe("fillEmptyDays", () => {
  it("does not change a filled Wednesday", () => {
    const week = days([
      {},
      {},
      { mealId: "bol" }, // Wednesday
      {},
    ]);
    const placements = fillEmptyDays(week, [bolognese, chicken]);
    expect(placements.find((p) => p.dayId === "d2")).toBeUndefined();
    expect(placements.every((p) => p.mealId !== "bol" || p.dayId !== "d2")).toBe(
      true,
    );
  });

  it("places nothing when there are no known or similar meals", () => {
    const recipeOnly: FillMeal = {
      ...chicken,
      confidence: "RECIPE",
      id: "unknown",
      name: "Unknown stew",
      defaultProteinGroup: "OTHER",
      method: "OTHER",
      cuisine: null,
    };
    const placements = fillEmptyDays(days([{}, {}, {}, {}]), [recipeOnly]);
    expect(placements).toHaveLength(0);
  });

  it("prefers another known meal over repeating Bolognese", () => {
    const week = days([{ mealId: "bol" }, {}, {}, {}]);
    const placements = fillEmptyDays(week, [bolognese, chicken]);
    expect(placements[0]?.mealId).toBe("chick");
  });
});
