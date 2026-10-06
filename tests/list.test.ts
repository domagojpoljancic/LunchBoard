import { describe, expect, it } from "vitest";
import {
  buildCarriedExisting,
  mergeLines,
  rebuildShopping,
  type DesiredLine,
  type ExistingShopping,
} from "@/lib/list";
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

describe("buildCarriedExisting", () => {
  it("carries an unchecked line from the previous week when this week has nothing for it", () => {
    const result = buildCarriedExisting([], [
      { name: "onion", nameKey: "onion", quantity: 2, unit: "PIECE" },
    ]);
    expect(result).toEqual([
      {
        name: "onion",
        nameKey: "onion",
        quantity: 2,
        unit: "PIECE",
        checked: false,
        origin: "CARRIED",
      },
    ]);
  });

  it("drops a previously-carried line once it is ticked in this week (open next week, then tick onion this week)", () => {
    const thisWeekExisting: ExistingShopping[] = [
      {
        name: "onion",
        nameKey: "onion",
        quantity: 2,
        unit: "PIECE",
        checked: false,
        origin: "CARRIED",
      },
    ];
    // Ticking onion in the current (prev) week means it is no longer unchecked there,
    // so the next week's rebuild no longer receives it as a carry candidate.
    const result = buildCarriedExisting(thisWeekExisting, []);
    expect(result).toEqual([]);
  });

  it("brings a line back as carried if it is unticked again", () => {
    const thisWeekExisting: ExistingShopping[] = [];
    const result = buildCarriedExisting(thisWeekExisting, [
      { name: "onion", nameKey: "onion", quantity: 2, unit: "PIECE" },
    ]);
    expect(result).toEqual([
      {
        name: "onion",
        nameKey: "onion",
        quantity: 2,
        unit: "PIECE",
        checked: false,
        origin: "CARRIED",
      },
    ]);
  });

  it("does not double count a carried line that this week's plan also needs", () => {
    const thisWeekExisting: ExistingShopping[] = [
      {
        name: "onion",
        nameKey: "onion",
        quantity: 1,
        unit: "PIECE",
        checked: false,
        origin: "PLAN",
      },
    ];
    const result = buildCarriedExisting(thisWeekExisting, [
      { name: "onion", nameKey: "onion", quantity: 1, unit: "PIECE" },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].origin).toBe("PLAN");
  });

  it("preserves this week's own checked state for a line that is also carried", () => {
    const thisWeekExisting: ExistingShopping[] = [
      {
        name: "onion",
        nameKey: "onion",
        quantity: 1,
        unit: "PIECE",
        checked: true,
        origin: "CARRIED",
      },
    ];
    const result = buildCarriedExisting(thisWeekExisting, [
      { name: "onion", nameKey: "onion", quantity: 1, unit: "PIECE" },
    ]);
    // Week N stores its own checked state for carried lines; ticking a carried
    // line in week N must not be clobbered by week N-1's (unchecked) state.
    expect(result).toEqual([
      {
        name: "onion",
        nameKey: "onion",
        quantity: 1,
        unit: "PIECE",
        checked: true,
        origin: "CARRIED",
      },
    ]);
  });
});
