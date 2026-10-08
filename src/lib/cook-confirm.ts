import { prisma } from "@/lib/db";
import {
  applyInventoryDecrement,
  isMutationReversible,
  normalizeInventoryUnit,
  UNDO_WINDOW_MS,
  type InventoryLocation,
  type InventoryStockRow,
} from "@/lib/inventory";
import { collectDayLines, type IngredientLine } from "@/lib/list";
import { applyPortionDecrement, applyPortionRestore } from "@/lib/prepared";

export type ConfirmTarget =
  | { kind: "day"; dayPlanId: string }
  | { kind: "poolCook"; poolCookId: string };

async function loadDayTarget(dayPlanId: string, userId: string) {
  return prisma.dayPlan.findFirst({
    where: { id: dayPlanId, week: { userId } },
    include: {
      week: true,
      meal: {
        include: {
          ingredients: true,
          variants: { include: { ingredients: true } },
        },
      },
      variant: true,
      sides: { include: { side: { include: { ingredients: true } } } },
      preparedDish: true,
      cookConfirmation: true,
    },
  });
}

function recipeLinesForDay(day: NonNullable<Awaited<ReturnType<typeof loadDayTarget>>>) {
  if (!day.meal) return [];
  if (day.leftoverOfDayId) return [];
  if (day.cookKind === "HEAT_PREPARED" || day.preparedDishId) return [];

  const meal = day.meal;
  const defaultVariant =
    meal.variants.find((v) => v.isDefault) ?? meal.variants[0] ?? null;
  const selectedVariantId = day.variantId ?? defaultVariant?.id ?? null;
  const shared = meal.ingredients.filter((i) => !i.variantId) as IngredientLine[];
  const variantIngredients = meal.ingredients.filter(
    (i) => i.variantId,
  ) as IngredientLine[];
  const sideIngredients = day.sides.flatMap(
    (s) => s.side.ingredients,
  ) as IngredientLine[];

  return collectDayLines({
    baseServings: meal.baseServings,
    dayServings: day.servings,
    selectedVariantId,
    defaultVariantId: defaultVariant?.id ?? null,
    shared,
    variantIngredients,
    sideIngredients,
  });
}

export type ConfirmCookResult = {
  status: "COOKED" | "ALREADY" | "SKIPPED";
  shortfalls: Array<{ nameKey: string; unit: string; amount: number }>;
  portionsBurned?: number;
};

export async function confirmCook(
  userId: string,
  target: ConfirmTarget,
): Promise<ConfirmCookResult> {
  if (target.kind === "poolCook") {
    return confirmPoolCook(userId, target.poolCookId);
  }

  const day = await loadDayTarget(target.dayPlanId, userId);
  if (!day) throw new Error("Not found");
  if (!day.mealId && !day.preparedDishId) throw new Error("No meal");

  if (day.cookedAt || day.cookConfirmation?.status === "COOKED") {
    return { status: "ALREADY", shortfalls: [] };
  }

  const now = new Date();
  const reversibleUntil = new Date(now.getTime() + UNDO_WINDOW_MS);
  const shortfalls: Array<{ nameKey: string; unit: string; amount: number }> =
    [];
  let portionsBurned = 0;

  await prisma.$transaction(async (tx) => {
    const confirmation = await tx.cookConfirmation.upsert({
      where: { dayPlanId: day.id },
      create: {
        userId,
        dayPlanId: day.id,
        status: "COOKED",
        confirmedAt: now,
      },
      update: {
        status: "COOKED",
        confirmedAt: now,
        undoneAt: null,
      },
    });

    await tx.dayPlan.update({
      where: { id: day.id },
      data: { cookedAt: now, skippedAt: null },
    });

    const isHeat =
      day.cookKind === "HEAT_PREPARED" || Boolean(day.preparedDishId);
    const isLeftover = Boolean(day.leftoverOfDayId) || day.cookKind === "LEFTOVER";

    if (isHeat && day.preparedDishId) {
      const dish = await tx.preparedDish.findFirst({
        where: { id: day.preparedDishId, userId },
      });
      if (dish) {
        const { next, burned, archive } = applyPortionDecrement(
          dish.portionsRemaining,
          day.servings,
        );
        portionsBurned = burned;
        await tx.preparedDish.update({
          where: { id: dish.id },
          data: {
            portionsRemaining: next,
            archivedAt: archive ? now : dish.archivedAt,
          },
        });
        if (burned > 0) {
          await tx.preparedMutation.create({
            data: {
              preparedDishId: dish.id,
              delta: -burned,
              reason: "COOK_DECREMENT",
              cookConfirmationId: confirmation.id,
              reversibleUntil,
            },
          });
        }
        if (dish.linkedMealId) {
          await tx.meal.update({
            where: { id: dish.linkedMealId },
            data: { cookCount: { increment: 1 } },
          });
        }
      }
    } else if (isLeftover) {
      // No full recipe inventory decrement on leftover confirm.
    } else if (day.mealId) {
      await tx.meal.update({
        where: { id: day.mealId },
        data: { cookCount: { increment: 1 } },
      });

      const lines = recipeLinesForDay(day);
      const items = await tx.inventoryItem.findMany({ where: { userId } });
      const stock: InventoryStockRow[] = items.map((i) => ({
        id: i.id,
        nameKey: i.nameKey,
        unit: i.unit,
        location: i.location,
        quantity: i.quantity,
      }));

      for (const line of lines) {
        const result = applyInventoryDecrement(stock, {
          name: line.name,
          nameKey: line.nameKey,
          unit: line.unit,
          quantity: line.quantity,
          roleHint: line.role,
        });
        for (const s of result.shortfalls) shortfalls.push(s);
        for (const touch of result.touches) {
          if (touch.delta === 0) continue;
          await tx.inventoryItem.update({
            where: { id: touch.inventoryItemId },
            data: { quantity: touch.after },
          });
          await tx.inventoryMutation.create({
            data: {
              userId,
              inventoryItemId: touch.inventoryItemId,
              delta: touch.delta,
              reason: "COOK_DECREMENT",
              cookConfirmationId: confirmation.id,
              shortfall: touch.shortfall || null,
              reversibleUntil,
            },
          });
        }
        // Missing stock shortfall with no touches
        for (const s of result.shortfalls) {
          if (result.touches.length === 0) {
            // recorded in shortfalls array already
            void s;
          }
        }
      }
    }
  });

  return {
    status: "COOKED",
    shortfalls,
    portionsBurned: portionsBurned || undefined,
  };
}

async function confirmPoolCook(
  userId: string,
  poolCookId: string,
): Promise<ConfirmCookResult> {
  const instance = await prisma.poolCookInstance.findFirst({
    where: { id: poolCookId, userId },
    include: {
      cookConfirmation: true,
      poolEntry: {
        include: {
          meal: {
            include: {
              ingredients: true,
              variants: { include: { ingredients: true } },
            },
          },
          variant: true,
          sides: { include: { side: { include: { ingredients: true } } } },
          preparedDish: true,
        },
      },
    },
  });
  if (!instance) throw new Error("Not found");
  if (instance.cookedAt || instance.cookConfirmation?.status === "COOKED") {
    return { status: "ALREADY", shortfalls: [] };
  }

  const entry = instance.poolEntry;
  const now = new Date();
  const reversibleUntil = new Date(now.getTime() + UNDO_WINDOW_MS);
  const shortfalls: Array<{ nameKey: string; unit: string; amount: number }> =
    [];
  let portionsBurned = 0;

  await prisma.$transaction(async (tx) => {
    const confirmation = await tx.cookConfirmation.upsert({
      where: { poolCookId: instance.id },
      create: {
        userId,
        poolCookId: instance.id,
        status: "COOKED",
        confirmedAt: now,
      },
      update: {
        status: "COOKED",
        confirmedAt: now,
        undoneAt: null,
      },
    });

    await tx.poolCookInstance.update({
      where: { id: instance.id },
      data: { cookedAt: now, skippedAt: null },
    });

    if (entry.preparedDishId) {
      const dish = await tx.preparedDish.findFirst({
        where: { id: entry.preparedDishId, userId },
      });
      if (dish) {
        const { next, burned, archive } = applyPortionDecrement(
          dish.portionsRemaining,
          entry.servings,
        );
        portionsBurned = burned;
        await tx.preparedDish.update({
          where: { id: dish.id },
          data: {
            portionsRemaining: next,
            archivedAt: archive ? now : dish.archivedAt,
          },
        });
        if (burned > 0) {
          await tx.preparedMutation.create({
            data: {
              preparedDishId: dish.id,
              delta: -burned,
              reason: "COOK_DECREMENT",
              cookConfirmationId: confirmation.id,
              reversibleUntil,
            },
          });
        }
        if (dish.linkedMealId) {
          await tx.meal.update({
            where: { id: dish.linkedMealId },
            data: { cookCount: { increment: 1 } },
          });
        }
      }
    } else if (entry.mealId && entry.meal) {
      await tx.meal.update({
        where: { id: entry.mealId },
        data: { cookCount: { increment: 1 } },
      });

      const meal = entry.meal;
      const defaultVariant =
        meal.variants.find((v) => v.isDefault) ?? meal.variants[0] ?? null;
      const lines = collectDayLines({
        baseServings: meal.baseServings,
        dayServings: entry.servings,
        selectedVariantId: entry.variantId ?? defaultVariant?.id ?? null,
        defaultVariantId: defaultVariant?.id ?? null,
        shared: meal.ingredients.filter((i) => !i.variantId) as IngredientLine[],
        variantIngredients: meal.ingredients.filter(
          (i) => i.variantId,
        ) as IngredientLine[],
        sideIngredients: entry.sides.flatMap(
          (s) => s.side.ingredients,
        ) as IngredientLine[],
      });

      const items = await tx.inventoryItem.findMany({ where: { userId } });
      const stock: InventoryStockRow[] = items.map((i) => ({
        id: i.id,
        nameKey: i.nameKey,
        unit: i.unit,
        location: i.location,
        quantity: i.quantity,
      }));

      for (const line of lines) {
        const result = applyInventoryDecrement(stock, {
          name: line.name,
          nameKey: line.nameKey,
          unit: line.unit,
          quantity: line.quantity,
          roleHint: line.role,
        });
        for (const s of result.shortfalls) shortfalls.push(s);
        for (const touch of result.touches) {
          if (touch.delta === 0) continue;
          await tx.inventoryItem.update({
            where: { id: touch.inventoryItemId },
            data: { quantity: touch.after },
          });
          await tx.inventoryMutation.create({
            data: {
              userId,
              inventoryItemId: touch.inventoryItemId,
              delta: touch.delta,
              reason: "COOK_DECREMENT",
              cookConfirmationId: confirmation.id,
              shortfall: touch.shortfall || null,
              reversibleUntil,
            },
          });
        }
      }
    }
  });

  return {
    status: "COOKED",
    shortfalls,
    portionsBurned: portionsBurned || undefined,
  };
}

export async function skipCook(
  userId: string,
  target: ConfirmTarget,
): Promise<{ status: "SKIPPED" | "ALREADY" }> {
  if (target.kind === "poolCook") {
    const instance = await prisma.poolCookInstance.findFirst({
      where: { id: target.poolCookId, userId },
      include: { cookConfirmation: true },
    });
    if (!instance) throw new Error("Not found");
    if (instance.cookedAt || instance.skippedAt) return { status: "ALREADY" };
    const now = new Date();
    await prisma.$transaction([
      prisma.poolCookInstance.update({
        where: { id: instance.id },
        data: { skippedAt: now },
      }),
      prisma.cookConfirmation.upsert({
        where: { poolCookId: instance.id },
        create: {
          userId,
          poolCookId: instance.id,
          status: "SKIPPED",
          confirmedAt: now,
        },
        update: { status: "SKIPPED", confirmedAt: now, undoneAt: null },
      }),
    ]);
    return { status: "SKIPPED" };
  }

  const day = await prisma.dayPlan.findFirst({
    where: { id: target.dayPlanId, week: { userId } },
    include: { cookConfirmation: true },
  });
  if (!day) throw new Error("Not found");
  if (day.cookedAt || day.skippedAt) return { status: "ALREADY" };
  const now = new Date();
  await prisma.$transaction([
    prisma.dayPlan.update({
      where: { id: day.id },
      data: { skippedAt: now },
    }),
    prisma.cookConfirmation.upsert({
      where: { dayPlanId: day.id },
      create: {
        userId,
        dayPlanId: day.id,
        status: "SKIPPED",
        confirmedAt: now,
      },
      update: { status: "SKIPPED", confirmedAt: now, undoneAt: null },
    }),
  ]);
  return { status: "SKIPPED" };
}

export async function undoCookConfirm(
  userId: string,
  target: ConfirmTarget,
): Promise<{ status: "UNDONE" | "IRREVERSIBLE" | "NONE" }> {
  if (target.kind === "poolCook") {
    return undoPoolCook(userId, target.poolCookId);
  }

  const day = await prisma.dayPlan.findFirst({
    where: { id: target.dayPlanId, week: { userId } },
    include: {
      cookConfirmation: { include: { mutations: true } },
      preparedDish: true,
      meal: true,
    },
  });
  if (!day?.cookedAt || !day.cookConfirmation) return { status: "NONE" };
  if (day.cookConfirmation.status !== "COOKED") return { status: "NONE" };

  const now = new Date();
  const confirmation = day.cookConfirmation;

  // Check inventory mutations reversibility (Q3)
  const mutations = await prisma.inventoryMutation.findMany({
    where: { cookConfirmationId: confirmation.id, reversedAt: null },
  });

  for (const m of mutations) {
    const later = await prisma.inventoryMutation.findFirst({
      where: {
        inventoryItemId: m.inventoryItemId,
        reason: "COOK_DECREMENT",
        createdAt: { gt: m.createdAt },
        reversedAt: null,
        id: { not: m.id },
      },
    });
    if (
      !isMutationReversible({
        createdAt: m.createdAt,
        reversibleUntil: m.reversibleUntil,
        reversedAt: m.reversedAt,
        now,
        laterDecrementOnItem: Boolean(later),
      })
    ) {
      return { status: "IRREVERSIBLE" };
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const m of mutations) {
      const item = await tx.inventoryItem.findUnique({
        where: { id: m.inventoryItemId },
      });
      if (item) {
        const nextQty =
          item.quantity == null ? Math.abs(m.delta) : item.quantity - m.delta;
        await tx.inventoryItem.update({
          where: { id: item.id },
          data: { quantity: Math.max(0, nextQty) },
        });
      }
      await tx.inventoryMutation.update({
        where: { id: m.id },
        data: { reversedAt: now },
      });
      await tx.inventoryMutation.create({
        data: {
          userId,
          inventoryItemId: m.inventoryItemId,
          delta: -m.delta,
          reason: "UNDO",
          cookConfirmationId: confirmation.id,
        },
      });
    }

    const prepMuts = await tx.preparedMutation.findMany({
      where: { cookConfirmationId: confirmation.id, reversedAt: null },
    });
    for (const pm of prepMuts) {
      const dish = await tx.preparedDish.findUnique({
        where: { id: pm.preparedDishId },
      });
      if (dish) {
        const next = applyPortionRestore(dish.portionsRemaining, -pm.delta);
        await tx.preparedDish.update({
          where: { id: dish.id },
          data: {
            portionsRemaining: next,
            archivedAt: next > 0 ? null : dish.archivedAt,
          },
        });
      }
      await tx.preparedMutation.update({
        where: { id: pm.id },
        data: { reversedAt: now },
      });
    }

    await tx.dayPlan.update({
      where: { id: day.id },
      data: { cookedAt: null },
    });
    await tx.cookConfirmation.update({
      where: { id: confirmation.id },
      data: { status: "UNDONE", undoneAt: now },
    });

    const isHeat =
      day.cookKind === "HEAT_PREPARED" || Boolean(day.preparedDishId);
    if (isHeat && day.preparedDish?.linkedMealId) {
      await tx.meal.update({
        where: { id: day.preparedDish.linkedMealId },
        data: { cookCount: { decrement: 1 } },
      });
      await tx.meal.updateMany({
        where: { id: day.preparedDish.linkedMealId, cookCount: { lt: 0 } },
        data: { cookCount: 0 },
      });
    } else if (day.mealId && !day.leftoverOfDayId && !isHeat) {
      await tx.meal.update({
        where: { id: day.mealId },
        data: { cookCount: { decrement: 1 } },
      });
      await tx.meal.updateMany({
        where: { id: day.mealId, cookCount: { lt: 0 } },
        data: { cookCount: 0 },
      });
    }
  });

  return { status: "UNDONE" };
}

async function undoPoolCook(userId: string, poolCookId: string) {
  const instance = await prisma.poolCookInstance.findFirst({
    where: { id: poolCookId, userId },
    include: {
      cookConfirmation: { include: { mutations: true } },
      poolEntry: { include: { preparedDish: true } },
    },
  });
  if (!instance?.cookedAt || !instance.cookConfirmation) {
    return { status: "NONE" as const };
  }
  if (instance.cookConfirmation.status !== "COOKED") {
    return { status: "NONE" as const };
  }

  const now = new Date();
  const confirmation = instance.cookConfirmation;
  const mutations = await prisma.inventoryMutation.findMany({
    where: { cookConfirmationId: confirmation.id, reversedAt: null },
  });

  for (const m of mutations) {
    const later = await prisma.inventoryMutation.findFirst({
      where: {
        inventoryItemId: m.inventoryItemId,
        reason: "COOK_DECREMENT",
        createdAt: { gt: m.createdAt },
        reversedAt: null,
        id: { not: m.id },
      },
    });
    if (
      !isMutationReversible({
        createdAt: m.createdAt,
        reversibleUntil: m.reversibleUntil,
        reversedAt: m.reversedAt,
        now,
        laterDecrementOnItem: Boolean(later),
      })
    ) {
      return { status: "IRREVERSIBLE" as const };
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const m of mutations) {
      const item = await tx.inventoryItem.findUnique({
        where: { id: m.inventoryItemId },
      });
      if (item) {
        const nextQty =
          item.quantity == null ? Math.abs(m.delta) : item.quantity - m.delta;
        await tx.inventoryItem.update({
          where: { id: item.id },
          data: { quantity: Math.max(0, nextQty) },
        });
      }
      await tx.inventoryMutation.update({
        where: { id: m.id },
        data: { reversedAt: now },
      });
    }

    const prepMuts = await tx.preparedMutation.findMany({
      where: { cookConfirmationId: confirmation.id, reversedAt: null },
    });
    for (const pm of prepMuts) {
      const dish = await tx.preparedDish.findUnique({
        where: { id: pm.preparedDishId },
      });
      if (dish) {
        const next = applyPortionRestore(dish.portionsRemaining, -pm.delta);
        await tx.preparedDish.update({
          where: { id: dish.id },
          data: {
            portionsRemaining: next,
            archivedAt: next > 0 ? null : dish.archivedAt,
          },
        });
      }
      await tx.preparedMutation.update({
        where: { id: pm.id },
        data: { reversedAt: now },
      });
    }

    await tx.poolCookInstance.update({
      where: { id: instance.id },
      data: { cookedAt: null },
    });
    await tx.cookConfirmation.update({
      where: { id: confirmation.id },
      data: { status: "UNDONE", undoneAt: now },
    });

    const entry = instance.poolEntry;
    if (entry.preparedDish?.linkedMealId) {
      await tx.meal.update({
        where: { id: entry.preparedDish.linkedMealId },
        data: { cookCount: { decrement: 1 } },
      });
    } else if (entry.mealId) {
      await tx.meal.update({
        where: { id: entry.mealId },
        data: { cookCount: { decrement: 1 } },
      });
    }
  });

  return { status: "UNDONE" as const };
}

export function inventoryUnitKey(unit: string | null | undefined): string {
  return normalizeInventoryUnit(unit);
}

export type { InventoryLocation };
