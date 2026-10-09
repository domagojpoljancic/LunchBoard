import { prisma } from "@/lib/db";
import { groupByShelf, type ShelfMeal } from "@/lib/similar";
import { timeWarning } from "@/lib/warnings";
import { ensureWeek } from "@/lib/week-service";
import type { BoardDay } from "@/components/WeekBoard";
import type { LibraryMeal } from "@/components/Library";

export async function loadBoard(userId: string, weekStart: string) {
  const week = await ensureWeek(userId, weekStart);

  const meals = await prisma.meal.findMany({
    where: { userId },
    include: {
      variants: { orderBy: { sortOrder: "asc" } },
      mealSides: { include: { side: true } },
    },
    orderBy: { name: "asc" },
  });

  const shelfMeals: ShelfMeal[] = meals.map((m) => {
    const def = m.variants.find((v) => v.isDefault) ?? m.variants[0];
    return {
      id: m.id,
      name: m.name,
      confidence: m.confidence,
      method: m.method,
      cuisine: m.cuisine,
      activeMinutes: m.activeMinutes,
      defaultProteinGroup: def?.proteinGroup ?? "OTHER",
    };
  });

  const grouped = groupByShelf(shelfMeals);
  const shelfMap = new Map<string, LibraryMeal["shelf"]>();
  for (const m of grouped.canCook) shelfMap.set(m.id, "CAN_COOK");
  for (const m of grouped.similar) shelfMap.set(m.id, "SIMILAR");
  for (const m of grouped.needsRecipe) shelfMap.set(m.id, "NEEDS_RECIPE");

  const library: LibraryMeal[] = meals.map((m) => {
    const def = m.variants.find((v) => v.isDefault) ?? m.variants[0];
    return {
      id: m.id,
      name: m.name,
      confidence: m.confidence,
      activeMinutes: m.activeMinutes,
      proteinGroup: def?.proteinGroup ?? "OTHER",
      method: m.method,
      shelf: shelfMap.get(m.id) ?? "NEEDS_RECIPE",
      cookCount: m.cookCount,
      nudgeDismissedAtCookCount: m.nudgeDismissedAtCookCount,
    };
  });

  const daysRaw = await prisma.dayPlan.findMany({
    where: { weekId: week.id },
    orderBy: { date: "asc" },
    include: {
      meal: {
        include: {
          variants: { orderBy: { sortOrder: "asc" } },
          mealSides: { include: { side: true } },
        },
      },
      preparedDish: true,
      variant: true,
      sides: { include: { side: true } },
    },
  });

  const poolEntries = await prisma.poolEntry.findMany({
    where: { weekId: week.id },
    include: {
      meal: { select: { name: true } },
      preparedDish: { select: { name: true } },
    },
    orderBy: { sortOrder: "asc" },
  });

  const days: BoardDay[] = daysRaw.map((day) => {
    const meal = day.meal;
    const variant =
      day.variant ??
      meal?.variants.find((v) => v.isDefault) ??
      meal?.variants[0] ??
      null;
    const selectedSideIds = new Set(day.sides.map((s) => s.sideId));
    const sideMinutes = day.sides.map((s) => s.side.activeMinutes);
    const warning =
      meal && day.cookKind !== "HEAT_PREPARED"
        ? timeWarning({
            prepWindow: day.prepWindow,
            mealActiveMinutes: meal.activeMinutes,
            mealTotalMinutes: meal.totalMinutes,
            sideActiveMinutes: sideMinutes,
          })
        : { warn: false, active: 0, total: 0 };

    return {
      id: day.id,
      date: day.date,
      enabled: day.enabled,
      servings: day.servings,
      prepWindow: day.prepWindow,
      cookedAt: day.cookedAt?.toISOString() ?? null,
      skippedAt: day.skippedAt?.toISOString() ?? null,
      cookKind: day.cookKind,
      preparedDishId: day.preparedDishId,
      preparedDishName: day.preparedDish?.name ?? null,
      fillReason: day.fillReason,
      leftoverOfDayId: day.leftoverOfDayId,
      meal: meal
        ? {
            id: meal.id,
            name: meal.name,
            confidence: meal.confidence,
            activeMinutes: meal.activeMinutes,
            proteinGroup: variant?.proteinGroup ?? "OTHER",
            variantId: variant?.id ?? null,
            variantLabel: variant?.label ?? null,
            variants: meal.variants.map((v) => ({
              id: v.id,
              label: v.label,
              proteinGroup: v.proteinGroup,
            })),
          }
        : null,
      sideNames: day.sides.map((s) => s.side.name),
      warningActive: warning.warn ? warning.active : null,
      suggestedSides:
        meal?.mealSides.map((ms) => ({
          id: ms.sideId,
          name: ms.side.name,
          selected: selectedSideIds.has(ms.sideId),
        })) ?? [],
    };
  });

  const proteinCounts = new Map<string, number>();
  for (const day of days) {
    if (!day.enabled || !day.meal) continue;
    if (day.cookKind === "HEAT_PREPARED" || day.preparedDishId) continue;
    const g = day.meal.proteinGroup;
    proteinCounts.set(g, (proteinCounts.get(g) ?? 0) + 1);
  }
  let diversityGroup: string | null = null;
  let diversityCount = 0;
  for (const [g, count] of proteinCounts) {
    if (count >= 4 && count > diversityCount) {
      diversityGroup = g;
      diversityCount = count;
    }
  }

  const preparedDishes = await prisma.preparedDish.findMany({
    where: { userId, archivedAt: null, portionsRemaining: { gt: 0 } },
    select: { id: true, name: true, portionsRemaining: true },
    orderBy: { updatedAt: "desc" },
  });

  return {
    weekId: week.id,
    weekStart: week.weekStart,
    diversityDismissed: week.diversityNudgeDismissed,
    diversityGroup,
    diversityCount,
    days,
    meals: library,
    planningMode: week.planningMode,
    daysView: week.daysView,
    weekendExpanded: week.weekendExpanded,
    poolTarget: week.poolTarget,
    poolEntries: poolEntries.map((e) => ({
      id: e.id,
      mealId: e.mealId,
      mealName: e.meal?.name ?? null,
      preparedName: e.preparedDish?.name ?? null,
      servings: e.servings,
      pinnedDayPlanId: e.pinnedDayPlanId,
    })),
    preparedDishes,
  };
}
