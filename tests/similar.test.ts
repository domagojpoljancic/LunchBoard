import { describe, expect, it } from "vitest";
import {
  bestKnownScore,
  shelfForMeal,
  type ShelfMeal,
} from "@/lib/similar";

const bolognese: ShelfMeal = {
  id: "bol",
  name: "Bolognese",
  confidence: "KNOW",
  method: "PAN",
  cuisine: "italian",
  activeMinutes: 35,
  defaultProteinGroup: "BEEF",
};

const lasagne: ShelfMeal = {
  id: "las",
  name: "Lasagne",
  confidence: "RECIPE",
  method: "BAKE",
  cuisine: "italian",
  activeMinutes: 40,
  defaultProteinGroup: "BEEF",
};

const burger: ShelfMeal = {
  id: "bur",
  name: "Mince burger",
  confidence: "RECIPE",
  method: "PAN",
  cuisine: "american",
  activeMinutes: 25,
  defaultProteinGroup: "BEEF",
};

const goulash: ShelfMeal = {
  id: "gou",
  name: "Goulash",
  confidence: "RECIPE",
  method: "ONE_POT",
  cuisine: "hungarian",
  activeMinutes: 25,
  defaultProteinGroup: "BEEF",
};

describe("similar shelves", () => {
  const library = [bolognese, lasagne, burger, goulash];

  it("scores the worked examples", () => {
    expect(bestKnownScore(burger, library)).toBe(7);
    expect(bestKnownScore(goulash, library)).toBe(4);
    expect(bestKnownScore(lasagne, library)).toBe(5);
  });

  it("puts scored recipes on Similar", () => {
    expect(shelfForMeal(burger, library)).toBe("SIMILAR");
    expect(shelfForMeal(goulash, library)).toBe("SIMILAR");
    expect(shelfForMeal(lasagne, library)).toBe("SIMILAR");
    expect(shelfForMeal(bolognese, library)).toBe("CAN_COOK");
  });

  it("puts everything under Needs a recipe when nothing is known", () => {
    const noneKnown = library.map((m) =>
      m.id === "bol" ? { ...m, confidence: "RECIPE" } : m,
    );
    expect(shelfForMeal(burger, noneKnown)).toBe("NEEDS_RECIPE");
  });
});
