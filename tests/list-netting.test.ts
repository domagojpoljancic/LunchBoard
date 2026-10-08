import { describe, expect, it } from "vitest";
import type { InventoryStockRow } from "@/lib/inventory";
import {
  adviseStock,
  shouldHideSoftNettedLine,
  softNetAgainstInventory,
} from "@/lib/list-netting";

const stock: InventoryStockRow[] = [
  {
    id: "1",
    nameKey: "pasta",
    unit: "G",
    location: "PANTRY",
    quantity: 800,
  },
  {
    id: "2",
    nameKey: "onion",
    unit: "PIECE",
    location: "FRIDGE",
    quantity: 2,
  },
];

describe("Mode A advisory", () => {
  it("matches nameKey+unit and sums multi-location", () => {
    const advice = adviseStock(
      {
        name: "pasta",
        nameKey: "pasta",
        quantity: 450,
        unit: "G",
        origin: "PLAN",
      },
      stock,
    );
    expect(advice.kind).toBe("HAVE");
    if (advice.kind === "HAVE") {
      expect(advice.have).toBe(800);
      expect(advice.message).toContain("800");
    }
  });

  it("reports different unit without a numeric claim", () => {
    const advice = adviseStock(
      {
        name: "pasta",
        nameKey: "pasta",
        quantity: 2,
        unit: "PIECE",
        origin: "PLAN",
      },
      stock,
    );
    expect(advice.kind).toBe("DIFFERENT_UNIT");
  });
});

describe("Mode B soft net", () => {
  it("full cover marks covered; view-only keeps quantity until apply", () => {
    const view = softNetAgainstInventory(
      {
        name: "pasta",
        nameKey: "pasta",
        quantity: 450,
        unit: "G",
        origin: "PLAN",
      },
      stock,
    );
    expect(view.covered).toBe(true);
    expect(view.quantity).toBe(450);
    expect(view.applied).toBe(false);

    const applied = softNetAgainstInventory(
      {
        name: "pasta",
        nameKey: "pasta",
        quantity: 450,
        unit: "G",
        origin: "PLAN",
      },
      stock,
      { apply: true },
    );
    expect(applied.quantity).toBe(0);
    expect(shouldHideSoftNettedLine(applied)).toBe(true);
  });

  it("partial cover reduces quantity on apply", () => {
    const applied = softNetAgainstInventory(
      {
        name: "pasta",
        nameKey: "pasta",
        quantity: 1000,
        unit: "G",
        origin: "PLAN",
      },
      stock,
      { apply: true },
    );
    expect(applied.quantity).toBe(200);
    expect(applied.covered).toBe(false);
  });

  it("never auto-hides CARRIED lines", () => {
    const applied = softNetAgainstInventory(
      {
        name: "pasta",
        nameKey: "pasta",
        quantity: 450,
        unit: "G",
        origin: "CARRIED",
      },
      stock,
      { apply: true },
    );
    expect(applied.forceVisible).toBe(true);
    expect(shouldHideSoftNettedLine(applied)).toBe(false);
  });
});
