import { describe, expect, it } from "vitest";
import { scaleQuantity } from "@/lib/scaling";

describe("scaleQuantity", () => {
  it("matches the worked table", () => {
    expect(scaleQuantity(450, "G", 3, 3)).toBe(450);
    expect(scaleQuantity(450, "G", 3, 6)).toBe(900);
    expect(scaleQuantity(450, "G", 3, 2)).toBe(300);
    expect(scaleQuantity(100, "G", 3, 4)).toBe(135);
    expect(scaleQuantity(1, "PIECE", 3, 4)).toBe(1);
    expect(scaleQuantity(2, "PIECE", 3, 4)).toBe(3);
    expect(scaleQuantity(1, "PIECE", 3, 1)).toBe(1);
  });

  it("keeps null quantities null", () => {
    expect(scaleQuantity(null, "G", 3, 6)).toBeNull();
  });

  it("rounds G under 20 to nearest 1", () => {
    expect(scaleQuantity(10, "G", 3, 4)).toBe(13);
  });

  it("scales bunches like pieces", () => {
    expect(scaleQuantity(1, "BUNCH", 3, 4)).toBe(1);
    expect(scaleQuantity(2, "BUNCH", 3, 4)).toBe(3);
  });
});
