import { prisma } from "@/lib/db";
import {
  collectDayLines,
  mergeLines,
  rebuildPantry,
  rebuildShopping,
  type DesiredLine,
} from "@/lib/list";

export async function rebuildWeek(weekId: string) {
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

  const shopping = rebuildShopping(week.shoppingItems, buyDesired);
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
