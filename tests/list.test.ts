import { describe, expect, it } from "vitest";
import { mergeLines, rebuildShopping, type DesiredLine } from "@/lib/list";
import { nameKey } from "@/lib/name-key";

function buy(
  name: string,
  quantity: number | null,
  unit: string | null,
): DesiredLine {
  return {
    name,
    nameKey: nameKey(name),
    quantity,
    unit,
    role: "BUY",
  };
}

describe("mergeLines", () => {
  it("sums two onion days into 2 pieces", () => {
    const merged = mergeLines([
      buy("onion", 1, "PIECE"),
      buy("onion", 1, "PIECE"),
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0].quantity).toBe(2);
  });
});

describe("rebuildShopping", () => {
  it("absorbs carried onion into the plan amount", () => {
    const result = rebuildShopping(
      [
        {
          name: "onion",
          nameKey: "onion",
          quantity: 2,
          unit: "PIECE",
          checked: false,
          origin: "CARRIED",
        },
      ],
      [buy("onion", 2, "PIECE")],
    );
    expect(result).toEqual([
      {
        name: "onion",
        nameKey: "onion",
        quantity: 2,
        unit: "PIECE",
        checked: false,
        origin: "PLAN",
      },
    ]);
  });

  it("unchecks when the amount rises", () => {
    const result = rebuildShopping(
      [
        {
          name: "chicken",
          nameKey: "chicken",
          quantity: 450,
          unit: "G",
          checked: true,
          origin: "PLAN",
        },
      ],
      [buy("chicken", 900, "G")],
    );
    expect(result).toEqual([
      {
        name: "chicken",
        nameKey: "chicken",
        quantity: 900,
        unit: "G",
        checked: false,
        origin: "PLAN",
      },
    ]);
  });

  it("keeps unmatched carried lines", () => {
    const result = rebuildShopping(
      [
        {
          name: "bread",
          nameKey: "bread",
          quantity: 1,
          unit: "PIECE",
          checked: false,
          origin: "CARRIED",
        },
      ],
      [],
    );
    expect(result).toEqual([
      {
        name: "bread",
        nameKey: "bread",
        quantity: 1,
        unit: "PIECE",
        checked: false,
        origin: "CARRIED",
      },
    ]);
  });

  it("keeps checked when amount stays the same", () => {
    const result = rebuildShopping(
      [
        {
          name: "chicken",
          nameKey: "chicken",
          quantity: 450,
          unit: "G",
          checked: true,
          origin: "PLAN",
        },
      ],
      [buy("chicken", 450, "G")],
    );
    expect(result[0].checked).toBe(true);
    expect(result[0].quantity).toBe(450);
  });
});
