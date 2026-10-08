import {
  collectDayLines,
  mergeLines,
  type DesiredLine,
  type IngredientLine,
} from "./list";
import { clampPoolTarget } from "./inventory";
import { contributesRecipeBuyLines } from "./prepared";

export type PoolCollectEntry = {
  id: string;
  servings: number;
  mealId: string | null;
  preparedDishId: string | null;
  pinnedDayPlanId: string | null;
  /** When pinned, the day already collects — skip synthetic. */
  baseServings: number;
  selectedVariantId: string | null;
  defaultVariantId: string | null;
  shared: IngredientLine[];
  variantIngredients: IngredientLine[];
  sideIngredients: IngredientLine[];
};

/**
 * Collect buy/pantry lines from pool entries.
 * Pinned entries are skipped (day collect owns them).
 * Heat-plan entries (preparedDishId set) contribute 0 recipe lines.
 */
export function collectPoolLines(entries: PoolCollectEntry[]): DesiredLine[] {
  const lines: DesiredLine[] = [];
  for (const entry of entries) {
    if (entry.pinnedDayPlanId) continue;
    if (entry.preparedDishId) continue;
    if (!entry.mealId) continue;
    lines.push(
      ...collectDayLines({
        baseServings: entry.baseServings,
        dayServings: entry.servings,
        selectedVariantId: entry.selectedVariantId,
        defaultVariantId: entry.defaultVariantId,
        shared: entry.shared,
        variantIngredients: entry.variantIngredients,
        sideIngredients: entry.sideIngredients,
      }),
    );
  }
  return mergeLines(lines);
}

export function mergeDayAndPoolDesired(
  dayLines: DesiredLine[],
  poolLines: DesiredLine[],
): DesiredLine[] {
  return mergeLines([...dayLines, ...poolLines]);
}

export type DayToPoolSource = {
  dayPlanId: string;
  mealId: string | null;
  variantId: string | null;
  servings: number;
  prepWindow: string;
  preparedDishId: string | null;
  cookKind: string;
  sideIds: string[];
  enabled: boolean;
};

export type PoolEntryDraft = {
  mealId: string | null;
  variantId: string | null;
  servings: number;
  prepWindow: string;
  preparedDishId: string | null;
  pinnedDayPlanId: string | null;
  sideIds: string[];
  sortOrder: number;
};

/** Q5: by-day → pool keeps meals as optional pins. */
export function convertByDayToPool(days: DayToPoolSource[]): PoolEntryDraft[] {
  const filled = days.filter(
    (d) => d.mealId || d.preparedDishId,
  );
  return filled.map((d, index) => ({
    mealId: d.mealId,
    variantId: d.variantId,
    servings: d.servings,
    prepWindow: d.prepWindow,
    preparedDishId: d.preparedDishId,
    pinnedDayPlanId: d.dayPlanId,
    sideIds: d.sideIds,
    sortOrder: index,
  }));
}

export function normalizePoolTarget(n: number): number {
  return clampPoolTarget(n);
}

export function coerceDaysViewOff(
  planningMode: string,
  daysView: boolean,
): { planningMode: string; daysView: boolean } {
  if (!daysView) {
    return { planningMode: "POOL", daysView: false };
  }
  return { planningMode, daysView };
}

export function dayShouldCollectRecipe(
  day: {
    enabled: boolean;
    mealId: string | null;
    leftoverOfDayId: string | null;
    cookKind?: string | null;
    preparedDishId?: string | null;
  },
): boolean {
  if (!day.enabled) return false;
  if (day.leftoverOfDayId) return false;
  if (day.preparedDishId || day.cookKind === "HEAT_PREPARED") return false;
  if (!contributesRecipeBuyLines(day.cookKind)) return false;
  return Boolean(day.mealId);
}
