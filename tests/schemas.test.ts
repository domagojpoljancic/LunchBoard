import { describe, expect, it } from "vitest";
import {
  addIngredientSchema,
  createMealSchema,
  setDaySidesSchema,
  updateDayVariantSchema,
  updateMealBasicsSchema,
} from "@/lib/schemas";

describe("schemas", () => {
  it("rejects empty names", () => {
    expect(() =>
      addIngredientSchema.parse({
        mealId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
        name: "  ",
        quantity: 1,
        unit: "G",
        role: "BUY",
      }),
    ).toThrow();
  });

  it("requires every field on a new meal", () => {
    const meal = {
      name: "Burrata pasta",
      proteinGroup: "VEGETARIAN",
      activeMinutes: 15,
      totalMinutes: 20,
      ingredients: [{ name: "burrata", quantity: 200, unit: "G", role: "BUY" }],
    };
    expect(createMealSchema.parse(meal).name).toBe("Burrata pasta");
    expect(() => createMealSchema.parse({ ...meal, name: "  " })).toThrow();
    expect(() => createMealSchema.parse({ ...meal, proteinGroup: "" })).toThrow();
    expect(() =>
      createMealSchema.parse({ ...meal, activeMinutes: null }),
    ).toThrow();
    expect(() => createMealSchema.parse({ ...meal, ingredients: [] })).toThrow();
    expect(() =>
      createMealSchema.parse({ ...meal, totalMinutes: 10 }),
    ).toThrow();
  });

  it("requires times when saving meal basics", () => {
    const basics = {
      mealId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
      name: "Bolognese",
      method: "PAN",
      cuisine: "italian",
      activeMinutes: 35,
      totalMinutes: 70,
      completePlate: false,
    };
    expect(updateMealBasicsSchema.parse(basics).activeMinutes).toBe(35);
    expect(() =>
      updateMealBasicsSchema.parse({ ...basics, activeMinutes: null }),
    ).toThrow();
    expect(() =>
      updateMealBasicsSchema.parse({ ...basics, totalMinutes: 20 }),
    ).toThrow();
  });

  it("requires cuid ids", () => {
    expect(() =>
      updateDayVariantSchema.parse({ dayId: "nope", variantId: "nope" }),
    ).toThrow();
    expect(() =>
      setDaySidesSchema.parse({ dayId: "clxxxxxxxxxxxxxxxxxxxxxxxxx", sideIds: ["bad"] }),
    ).toThrow();
  });
});
