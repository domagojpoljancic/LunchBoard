export type Confidence = "KNOW" | "PROMPT" | "RECIPE";

export type ShelfMeal = {
  id: string;
  name: string;
  confidence: Confidence | string;
  method: string;
  cuisine: string | null;
  activeMinutes: number | null;
  defaultProteinGroup: string;
};

export type Shelf = "CAN_COOK" | "SIMILAR" | "NEEDS_RECIPE";

export function similarityScore(candidate: ShelfMeal, known: ShelfMeal): number {
  let score = 0;
  if (candidate.defaultProteinGroup === known.defaultProteinGroup) score += 3;
  if (candidate.method === known.method) score += 3;
  if (
    candidate.cuisine &&
    known.cuisine &&
    candidate.cuisine === known.cuisine
  ) {
    score += 1;
  }
  if (
    candidate.activeMinutes != null &&
    known.activeMinutes != null &&
    Math.abs(candidate.activeMinutes - known.activeMinutes) <= 15
  ) {
    score += 1;
  }
  return score;
}

export function bestKnownScore(
  candidate: ShelfMeal,
  library: ShelfMeal[],
): number {
  const known = library.filter((m) => m.confidence === "KNOW");
  if (known.length === 0) return 0;
  return Math.max(...known.map((k) => similarityScore(candidate, k)));
}

export function shelfForMeal(
  meal: ShelfMeal,
  library: ShelfMeal[],
): Shelf {
  if (meal.confidence === "KNOW" || meal.confidence === "PROMPT") {
    return "CAN_COOK";
  }
  const known = library.filter((m) => m.confidence === "KNOW");
  if (known.length === 0) return "NEEDS_RECIPE";
  return bestKnownScore(meal, library) >= 4 ? "SIMILAR" : "NEEDS_RECIPE";
}

export function groupByShelf(library: ShelfMeal[]): {
  canCook: ShelfMeal[];
  similar: ShelfMeal[];
  needsRecipe: ShelfMeal[];
} {
  const canCook: ShelfMeal[] = [];
  const similar: ShelfMeal[] = [];
  const needsRecipe: ShelfMeal[] = [];
  for (const meal of library) {
    const shelf = shelfForMeal(meal, library);
    if (shelf === "CAN_COOK") canCook.push(meal);
    else if (shelf === "SIMILAR") similar.push(meal);
    else needsRecipe.push(meal);
  }
  return { canCook, similar, needsRecipe };
}
