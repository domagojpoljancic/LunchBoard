import { describe, expect, it } from "vitest";
import {
  addIngredientSchema,
  setDaySidesSchema,
  updateDayVariantSchema,
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

  it("requires cuid ids", () => {
    expect(() =>
      updateDayVariantSchema.parse({ dayId: "nope", variantId: "nope" }),
    ).toThrow();
    expect(() =>
      setDaySidesSchema.parse({ dayId: "clxxxxxxxxxxxxxxxxxxxxxxxxx", sideIds: ["bad"] }),
    ).toThrow();
  });
});
