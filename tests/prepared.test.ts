import { describe, expect, it } from "vitest";
import {
  applyPortionDecrement,
  canUndoArchive,
  contributesRecipeBuyLines,
  softArchiveAtZero,
} from "@/lib/prepared";
import { heatPortionsToBurn } from "@/lib/inventory";

describe("prepared portions", () => {
  it("decrements min(day.servings, portionsRemaining)", () => {
    expect(heatPortionsToBurn(3, 2)).toBe(2);
    expect(heatPortionsToBurn(1, 6)).toBe(1);
    const { next, burned, archive } = applyPortionDecrement(4, 1);
    expect(burned).toBe(1);
    expect(next).toBe(3);
    expect(archive).toBe(false);
  });

  it("soft-archives at 0", () => {
    const { next, archive } = applyPortionDecrement(2, 3);
    expect(next).toBe(0);
    expect(archive).toBe(true);
    const now = new Date("2026-10-08T12:00:00Z");
    expect(softArchiveAtZero(0, now)).toEqual(now);
    expect(
      canUndoArchive(now, new Date("2026-10-08T20:00:00Z")),
    ).toBe(true);
    expect(
      canUndoArchive(now, new Date("2026-10-09T13:00:00Z")),
    ).toBe(false);
  });

  it("heat plans do not contribute recipe buy lines", () => {
    expect(contributesRecipeBuyLines("HEAT_PREPARED")).toBe(false);
    expect(contributesRecipeBuyLines("LEFTOVER")).toBe(false);
    expect(contributesRecipeBuyLines("RECIPE")).toBe(true);
  });
});
