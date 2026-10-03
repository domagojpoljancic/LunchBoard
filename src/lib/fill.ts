import { shelfForMeal, type ShelfMeal } from "./similar";
import { timeWarning } from "./warnings";

export type FillDay = {
  id: string;
  date: string;
  enabled: boolean;
  mealId: string | null;
  prepWindow: "EVENING_BEFORE" | "SAME_DAY" | string;
  servings: number;
};

export type FillMeal = ShelfMeal & {
  activeMinutes: number | null;
  totalMinutes: number | null;
  defaultVariantId: string;
  defaultSideIds: string[];
  /** Hands-on minutes of sides that start selected. */
  sideActiveMinutes?: number;
};

export type FillPlacement = {
  dayId: string;
  mealId: string;
  variantId: string;
  sideIds: string[];
};

function fitsWindow(meal: FillMeal, prepWindow: string): boolean {
  return !timeWarning({
    prepWindow,
    mealActiveMinutes: meal.activeMinutes,
    mealTotalMinutes: meal.totalMinutes,
    sideActiveMinutes: meal.sideActiveMinutes ? [meal.sideActiveMinutes] : [],
  }).warn;
}

function scoreMeal(
  meal: FillMeal,
  day: FillDay,
  usedProteinGroups: Set<string>,
): number {
  let score = 0;
  if (meal.activeMinutes == null && meal.totalMinutes == null) score += 1;
  else if (fitsWindow(meal, day.prepWindow)) score += 3;
  if (!usedProteinGroups.has(meal.defaultProteinGroup)) score += 2;
  if (meal.defaultProteinGroup === "WHITE_MEAT") score += 1;
  return score;
}

function pickFromTier(
  candidates: FillMeal[],
  day: FillDay,
  usedMealIds: Set<string>,
  usedProteinGroups: Set<string>,
  allowRepeat: boolean,
): FillMeal | null {
  const pool = allowRepeat
    ? candidates
    : candidates.filter((m) => !usedMealIds.has(m.id));
  if (pool.length === 0) return null;
  pool.sort((a, b) => {
    const diff = scoreMeal(b, day, usedProteinGroups) - scoreMeal(a, day, usedProteinGroups);
    if (diff !== 0) return diff;
    return a.name.localeCompare(b.name);
  });
  return pool[0] ?? null;
}

export function fillEmptyDays(
  days: FillDay[],
  library: FillMeal[],
): FillPlacement[] {
  const enabled = [...days]
    .filter((d) => d.enabled)
    .sort((a, b) => a.date.localeCompare(b.date));

  const usedMealIds = new Set(
    enabled.filter((d) => d.mealId).map((d) => d.mealId as string),
  );
  const usedProteinGroups = new Set(
    enabled
      .filter((d) => d.mealId)
      .map((d) => library.find((m) => m.id === d.mealId)?.defaultProteinGroup)
      .filter((g): g is string => Boolean(g)),
  );

  const know = library.filter((m) => m.confidence === "KNOW");
  const prompt = library.filter((m) => m.confidence === "PROMPT");
  const similar = library.filter(
    (m) =>
      m.confidence === "RECIPE" && shelfForMeal(m, library) === "SIMILAR",
  );
  const tiers = [know, prompt, similar];

  const placements: FillPlacement[] = [];

  for (const day of enabled) {
    if (day.mealId) continue;

    let picked: FillMeal | null = null;
    for (const tier of tiers) {
      picked = pickFromTier(tier, day, usedMealIds, usedProteinGroups, false);
      if (picked) break;
    }
    if (!picked) {
      for (const tier of tiers) {
        picked = pickFromTier(tier, day, usedMealIds, usedProteinGroups, true);
        if (picked) break;
      }
    }
    if (!picked) continue;

    usedMealIds.add(picked.id);
    usedProteinGroups.add(picked.defaultProteinGroup);
    placements.push({
      dayId: day.id,
      mealId: picked.id,
      variantId: picked.defaultVariantId,
      sideIds: picked.defaultSideIds,
    });
  }

  return placements;
}
