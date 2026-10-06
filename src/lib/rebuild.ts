import { prisma } from "@/lib/db";
import {
  buildCarriedExisting,
  collectDayLines,
  mergeLines,
  rebuildPantry,
  rebuildShopping,
  type DesiredLine,
} from "@/lib/list";
import { nameKey } from "@/lib/name-key";
import { shiftWeek } from "@/lib/weeks";

export async function rebuildWeek(
  weekId: string,
  options?: { forwardDepth?: number },
) {
  const forwardDepth = options?.forwardDepth ?? 4;

  const week = await prisma.week.findUniqueOrThrow({
    where: { id: weekId },
    include: {
      shoppingItems: true,
      pantryItems: true,
      days: {
        include: {
          meal: {
            include: {
              ingredients: true,
              variants: { include: { ingredients: true } },
              mealSides: true,
            },
          },
          variant: true,
          sides: { include: { side: { include: { ingredients: true } } } },
        },
      },
    },
  });

  const desired: DesiredLine[] = [];

  for (const day of week.days) {
    if (!day.enabled || !day.meal) continue;
    if (day.leftoverOfDayId) continue;
    const meal = day.meal;
    const defaultVariant =
      meal.variants.find((v) => v.isDefault) ?? meal.variants[0] ?? null;
    const selectedVariantId = day.variantId ?? defaultVariant?.id ?? null;

    const shared = meal.ingredients.filter((i) => !i.variantId);
    const variantIngredients = meal.ingredients.filter((i) => i.variantId);
    const sideIngredients = day.sides.flatMap((s) => s.side.ingredients);

    desired.push(
      ...collectDayLines({
        baseServings: meal.baseServings,
        dayServings: day.servings,
        selectedVariantId,
        defaultVariantId: defaultVariant?.id ?? null,
        shared,
        variantIngredients,
        sideIngredients,
      }),
    );
  }

  const merged = mergeLines(desired);
  const buyDesired = merged.filter((d) => d.role === "BUY");
  const pantryDesired = merged.filter((d) => d.role === "PANTRY");

  const prevStart = shiftWeek(week.weekStart, -1);
  const prev = await prisma.week.findUnique({
    where: {
      userId_weekStart: { userId: week.userId, weekStart: prevStart },
    },
    include: { shoppingItems: true },
  });

  const prevUnchecked = (prev?.shoppingItems ?? [])
    .filter((i) => !i.checked)
    .map((item) => ({
      name: item.name,
      nameKey: item.nameKey || nameKey(item.name),
      quantity: item.quantity,
      unit: item.unit,
    }));

  const existingForRebuild = buildCarriedExisting(
    week.shoppingItems.map((i) => ({
      name: i.name,
      nameKey: i.nameKey,
      quantity: i.quantity,
      unit: i.unit,
      checked: i.checked,
      origin: i.origin,
    })),
    prevUnchecked,
  );

  const shopping = rebuildShopping(existingForRebuild, buyDesired);
  const pantry = rebuildPantry(week.pantryItems, pantryDesired);

  await prisma.$transaction(async (tx) => {
    await tx.shoppingItem.deleteMany({ where: { weekId } });
    await tx.pantryItem.deleteMany({ where: { weekId } });

    if (shopping.length) {
      await tx.shoppingItem.createMany({
        data: shopping.map((item, sortOrder) => ({
          weekId,
          name: item.name,
          nameKey: item.nameKey,
          quantity: item.quantity,
          unit: item.unit,
          checked: item.checked,
          origin: item.origin,
          sortOrder,
        })),
      });
    }

    if (pantry.length) {
      await tx.pantryItem.createMany({
        data: pantry.map((item) => ({
          weekId,
          name: item.name,
          nameKey: item.nameKey,
          checked: item.checked,
        })),
      });
    }
  });

  if (forwardDepth > 0) {
    const nextStart = shiftWeek(week.weekStart, 1);
    const next = await prisma.week.findUnique({
      where: {
        userId_weekStart: { userId: week.userId, weekStart: nextStart },
      },
      select: { id: true },
    });
    if (next) {
      await rebuildWeek(next.id, { forwardDepth: forwardDepth - 1 });
    }
  }
}

export async function rebuildWeeksForMeal(mealId: string) {
  await rebuildWeeks({ mealId });
}

/** Rebuild every week that places this meal or selects this side. */
export async function rebuildWeeks(target: {
  mealId?: string | null;
  sideId?: string | null;
}) {
  const weekIds = new Set<string>();

  if (target.mealId) {
    const days = await prisma.dayPlan.findMany({
      where: { mealId: target.mealId },
      select: { weekId: true },
    });
    for (const day of days) weekIds.add(day.weekId);
  }

  if (target.sideId) {
    const links = await prisma.dayPlanSide.findMany({
      where: { sideId: target.sideId },
      select: { dayPlan: { select: { weekId: true } } },
    });
    for (const link of links) weekIds.add(link.dayPlan.weekId);
  }

  for (const weekId of weekIds) {
    await rebuildWeek(weekId);
  }
}
