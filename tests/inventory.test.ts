import { describe, expect, it } from "vitest";
import {
  applyInventoryDecrement,
  inferStockKind,
  isMutationReversible,
  locationOrder,
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
});
