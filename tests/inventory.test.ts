import { describe, expect, it } from "vitest";
import {
  applyInventoryDecrement,
  applyInventoryIncrement,
  clampPoolTarget,
  heatPortionsToBurn,
  inferStockKind,
  isMutationReversible,
  locationOrder,
  normalizeInventoryUnit,
  type InventoryStockRow,
} from "@/lib/inventory";

function row(
  partial: Partial<InventoryStockRow> & { id: string; nameKey: string },
): InventoryStockRow {
  return {
    unit: "G",
    location: "PANTRY",
    quantity: 0,
    ...partial,
  };
}

describe("inventory decrement", () => {
  it("full cover decreases quantity by the recipe amount", () => {
    const stock = [
      row({ id: "1", nameKey: "pasta", location: "PANTRY", quantity: 800 }),
    ];
    const result = applyInventoryDecrement(stock, {
      name: "pasta",
      nameKey: "pasta",
      unit: "G",
      quantity: 450,
      roleHint: "BUY",
    });
    expect(result.shortfalls).toEqual([]);
    expect(result.touches).toHaveLength(1);
    expect(result.touches[0].after).toBe(350);
    expect(stock[0].quantity).toBe(350);
  });

  it("partial cover sets qty to 0 and records shortfall", () => {
    const stock = [
      row({ id: "1", nameKey: "pasta", location: "PANTRY", quantity: 200 }),
    ];
    const result = applyInventoryDecrement(stock, {
      name: "pasta",
      nameKey: "pasta",
      unit: "G",
      quantity: 450,
    });
    expect(stock[0].quantity).toBe(0);
    expect(result.shortfalls[0].amount).toBe(250);
  });

  it("missing row still yields shortfall for the full amount", () => {
    const result = applyInventoryDecrement([], {
      name: "pasta",
      nameKey: "pasta",
      unit: "G",
      quantity: 450,
    });
    expect(result.touches).toEqual([]);
    expect(result.shortfalls[0].amount).toBe(450);
  });

  it("null recipe quantity produces no numeric delta", () => {
    const stock = [
      row({ id: "1", nameKey: "salt", location: "PANTRY", quantity: 100 }),
    ];
    const result = applyInventoryDecrement(stock, {
      name: "salt",
      nameKey: "salt",
      unit: "G",
      quantity: null,
    });
    expect(result.touches).toEqual([]);
    expect(stock[0].quantity).toBe(100);
  });

  it("consumes proteins Freezer → Fridge → Pantry", () => {
    expect(inferStockKind("beef mince")).toBe("PROTEIN");
    expect(locationOrder("PROTEIN")).toEqual([
      "FREEZER",
      "FRIDGE",
      "PANTRY",
    ]);
    const stock = [
      row({
        id: "p",
        nameKey: "beef mince",
        location: "PANTRY",
        quantity: 500,
      }),
      row({
        id: "f",
        nameKey: "beef mince",
        location: "FREEZER",
        quantity: 300,
      }),
      row({
        id: "r",
        nameKey: "beef mince",
        location: "FRIDGE",
        quantity: 200,
      }),
    ];
    applyInventoryDecrement(stock, {
      name: "beef mince",
      nameKey: "beef mince",
      unit: "G",
      quantity: 450,
    });
    expect(stock.find((s) => s.id === "f")!.quantity).toBe(0);
    expect(stock.find((s) => s.id === "r")!.quantity).toBe(50);
    expect(stock.find((s) => s.id === "p")!.quantity).toBe(500);
  });

  it("consumes dry goods Pantry → Fridge → Freezer", () => {
    expect(inferStockKind("pasta", "BUY")).toBe("DRY");
    const stock = [
      row({ id: "z", nameKey: "pasta", location: "FREEZER", quantity: 500 }),
      row({ id: "p", nameKey: "pasta", location: "PANTRY", quantity: 200 }),
    ];
    applyInventoryDecrement(stock, {
      name: "pasta",
      nameKey: "pasta",
      unit: "G",
      quantity: 150,
      roleHint: "BUY",
    });
    expect(stock.find((s) => s.id === "p")!.quantity).toBe(50);
    expect(stock.find((s) => s.id === "z")!.quantity).toBe(500);
  });
});

describe("undo window Q3", () => {
  it("is reversible within 24h when no later decrement", () => {
    const createdAt = new Date("2026-10-08T10:00:00Z");
    expect(
      isMutationReversible({
        createdAt,
        reversibleUntil: new Date("2026-10-09T10:00:00Z"),
        reversedAt: null,
        now: new Date("2026-10-08T12:00:00Z"),
        laterDecrementOnItem: false,
      }),
    ).toBe(true);
  });

  it("is irreversible after another decrement touches the item", () => {
    const createdAt = new Date("2026-10-08T10:00:00Z");
    expect(
      isMutationReversible({
        createdAt,
        reversibleUntil: new Date("2026-10-09T10:00:00Z"),
        reversedAt: null,
        now: new Date("2026-10-08T12:00:00Z"),
        laterDecrementOnItem: true,
      }),
    ).toBe(false);
  });

  it("is irreversible after 24h", () => {
    const createdAt = new Date("2026-10-08T10:00:00Z");
    expect(
      isMutationReversible({
        createdAt,
        reversibleUntil: new Date("2026-10-09T10:00:00Z"),
        reversedAt: null,
        now: new Date("2026-10-09T11:00:00Z"),
        laterDecrementOnItem: false,
      }),
    ).toBe(false);
  });

  it("is irreversible once already reversed", () => {
    expect(
      isMutationReversible({
        createdAt: new Date("2026-10-08T10:00:00Z"),
        reversibleUntil: new Date("2026-10-09T10:00:00Z"),
        reversedAt: new Date("2026-10-08T11:00:00Z"),
        now: new Date("2026-10-08T12:00:00Z"),
        laterDecrementOnItem: false,
      }),
    ).toBe(false);
  });

  it("falls back to createdAt + 24h when reversibleUntil is null", () => {
    const createdAt = new Date("2026-10-08T10:00:00Z");
    expect(
      isMutationReversible({
        createdAt,
        reversibleUntil: null,
        reversedAt: null,
        now: new Date("2026-10-09T09:59:00Z"),
        laterDecrementOnItem: false,
      }),
    ).toBe(true);
    expect(
      isMutationReversible({
        createdAt,
        reversibleUntil: null,
        reversedAt: null,
        now: new Date("2026-10-09T10:01:00Z"),
        laterDecrementOnItem: false,
      }),
    ).toBe(false);
  });
});

describe("inventory edge cases", () => {
  it("treats zero and negative recipe quantities as no-ops", () => {
    const stock = [
      row({ id: "1", nameKey: "pasta", location: "PANTRY", quantity: 100 }),
    ];
    expect(
      applyInventoryDecrement(stock, {
        name: "pasta",
        nameKey: "pasta",
        unit: "G",
        quantity: 0,
      }).touches,
    ).toEqual([]);
    expect(
      applyInventoryDecrement(stock, {
        name: "pasta",
        nameKey: "pasta",
        unit: "G",
        quantity: -10,
      }).touches,
    ).toEqual([]);
    expect(stock[0].quantity).toBe(100);
  });

  it("derives nameKey from name when omitted", () => {
    const stock = [
      row({ id: "1", nameKey: "olive oil", location: "PANTRY", quantity: 50 }),
    ];
    const result = applyInventoryDecrement(stock, {
      name: "Olive Oil",
      nameKey: "",
      unit: "G",
      quantity: 20,
    });
    expect(result.touches[0].after).toBe(30);
  });

  it("skips null-quantity stock rows and keeps looking", () => {
    const stock = [
      row({
        id: "nullish",
        nameKey: "pasta",
        location: "PANTRY",
        quantity: null,
      }),
      row({ id: "ok", nameKey: "pasta", location: "PANTRY", quantity: 100 }),
    ];
    applyInventoryDecrement(stock, {
      name: "pasta",
      nameKey: "pasta",
      unit: "G",
      quantity: 40,
    });
    expect(stock.find((s) => s.id === "ok")!.quantity).toBe(60);
  });

  it("falls back to unexpected locations after ordered ones are empty", () => {
    const stock = [
      row({
        id: "odd",
        nameKey: "pasta",
        location: "COUNTER",
        quantity: 90,
      }),
    ];
    const result = applyInventoryDecrement(stock, {
      name: "pasta",
      nameKey: "pasta",
      unit: "G",
      quantity: 40,
      roleHint: "BUY",
    });
    expect(result.shortfalls).toEqual([]);
    expect(stock[0].quantity).toBe(50);
  });

  it("unit-mismatched stock does not cover the need", () => {
    const stock = [
      row({ id: "1", nameKey: "pasta", location: "PANTRY", quantity: 800, unit: "G" }),
    ];
    const result = applyInventoryDecrement(stock, {
      name: "pasta",
      nameKey: "pasta",
      unit: "PIECE",
      quantity: 2,
    });
    expect(result.touches).toEqual([]);
    expect(result.shortfalls[0].amount).toBe(2);
    expect(stock[0].quantity).toBe(800);
  });

  it("PANTRY roleHint forces DRY location order", () => {
    expect(inferStockKind("chicken breast", "PANTRY")).toBe("DRY");
    expect(normalizeInventoryUnit(null)).toBe("");
    expect(normalizeInventoryUnit("G")).toBe("G");
  });

  it("applyInventoryIncrement never goes below zero", () => {
    expect(applyInventoryIncrement(10, -3)).toBe(7);
    expect(applyInventoryIncrement(2, -10)).toBe(0);
    expect(applyInventoryIncrement(null, 5)).toBe(5);
  });

  it("heatPortionsToBurn clamps servings and remaining", () => {
    expect(heatPortionsToBurn(3, 2)).toBe(2);
    expect(heatPortionsToBurn(0, 5)).toBe(0);
    expect(heatPortionsToBurn(-1, 5)).toBe(0);
    expect(heatPortionsToBurn(2, -3)).toBe(0);
  });

  it("clampPoolTarget rounds then clamps 3–7", () => {
    expect(clampPoolTarget(2.6)).toBe(3);
    expect(clampPoolTarget(5.5)).toBe(6);
    expect(clampPoolTarget(8.1)).toBe(7);
  });
});
