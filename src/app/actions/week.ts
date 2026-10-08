"use server";

import { prisma } from "@/lib/db";
import { fillEmptyDays, type FillMeal } from "@/lib/fill";
import { rebuildWeek } from "@/lib/rebuild";
import { revalidateApp } from "@/lib/revalidate-app";
import {
  cuid,
  dayIdSchema,
  moveDayMealSchema,
  setDaySidesSchema,
  updateDayEnabledSchema,
  updateDayPrepSchema,
  updateDayServingsSchema,
  updateDayVariantSchema,
  weekStartSchema,
} from "@/lib/schemas";
import { requireUser } from "@/lib/session";
import { ensureWeek } from "@/lib/week-service";

async function ownedDay(dayId: string, userId: string) {
  const day = await prisma.dayPlan.findFirst({
    where: { id: dayId, week: { userId } },
    include: {
      week: true,
      meal: { include: { mealSides: true, variants: true } },
    },
  });
  if (!day) throw new Error("Day not found");
  return day;
}

export async function placeMealOnDay(dayId: string, mealId: string) {
  const parsedDay = dayIdSchema.parse({ dayId });
  const parsedMeal = cuid.parse(mealId);
  const user = await requireUser();
  const day = await ownedDay(parsedDay.dayId, user.id);
  const meal = await prisma.meal.findFirst({
    where: { id: parsedMeal, userId: user.id },
    include: { variants: true, mealSides: true },
  });
  if (!meal) throw new Error("Meal not found");

  const variant = meal.variants.find((v) => v.isDefault) ?? meal.variants[0];
  const defaultSides = meal.mealSides.filter((s) => s.defaultSelected);

  await prisma.$transaction(async (tx) => {
    await tx.dayPlanSide.deleteMany({ where: { dayPlanId: dayId } });
    await tx.dayPlan.update({
      where: { id: dayId },
      data: {
        mealId: meal.id,
        variantId: variant?.id ?? null,
        cookedAt: null,
        skippedAt: null,
        leftoverOfDayId: null,
        fillReason: null,
        cookKind: "RECIPE",
        preparedDishId: null,
        sides: {
          create: defaultSides.map((s) => ({ sideId: s.sideId })),
        },
      },
    });
    await tx.dayPlan.updateMany({
      where: { leftoverOfDayId: dayId },
      data: {
        mealId: null,
        variantId: null,
        leftoverOfDayId: null,
        cookedAt: null,
      },
    });
  });

  await rebuildWeek(day.weekId);
  revalidateApp();
}

export async function clearDay(dayId: string) {
  const parsed = dayIdSchema.parse({ dayId });
  const user = await requireUser();
  const day = await ownedDay(parsed.dayId, user.id);
  await prisma.$transaction(async (tx) => {
    await tx.dayPlanSide.deleteMany({ where: { dayPlanId: dayId } });
    await tx.dayPlan.update({
      where: { id: dayId },
      data: {
        mealId: null,
        variantId: null,
        cookedAt: null,
        skippedAt: null,
        leftoverOfDayId: null,
        fillReason: null,
        cookKind: "RECIPE",
        preparedDishId: null,
      },
    });
    await tx.dayPlan.updateMany({
      where: { leftoverOfDayId: dayId },
      data: {
        mealId: null,
        variantId: null,
        leftoverOfDayId: null,
        cookedAt: null,
      },
    });
  });
  await rebuildWeek(day.weekId);
  revalidateApp();
}

export async function moveDayMeal(fromDayId: string, toDayId: string) {
  const parsed = moveDayMealSchema.parse({ fromDayId, toDayId });
  if (parsed.fromDayId === parsed.toDayId) return;
  const user = await requireUser();
  const from = await ownedDay(parsed.fromDayId, user.id);
  const to = await ownedDay(parsed.toDayId, user.id);
  if (from.weekId !== to.weekId) throw new Error("Different weeks");
  if (!from.enabled || !to.enabled) return;
  if (!from.mealId || from.leftoverOfDayId) return;

  await prisma.$transaction(async (tx) => {
    const fromSides = await tx.dayPlanSide.findMany({
      where: { dayPlanId: from.id },
    });
    const toSides = await tx.dayPlanSide.findMany({
      where: { dayPlanId: to.id },
    });
    await tx.dayPlanSide.deleteMany({
      where: { dayPlanId: { in: [from.id, to.id] } },
    });

    const carried = {
      mealId: from.mealId,
      variantId: from.variantId,
      servings: from.servings,
      prepWindow: from.prepWindow,
      cookedAt: from.cookedAt,
      fillReason: from.fillReason,
      leftoverOfDayId: null,
    };

    if (!to.mealId || to.leftoverOfDayId) {
      await tx.dayPlan.update({ where: { id: to.id }, data: carried });
      await tx.dayPlan.update({
        where: { id: from.id },
        data: {
          mealId: null,
          variantId: null,
          cookedAt: null,
          fillReason: null,
          leftoverOfDayId: null,
        },
      });
      if (fromSides.length) {
        await tx.dayPlanSide.createMany({
          data: fromSides.map((side) => ({
            dayPlanId: to.id,
            sideId: side.sideId,
          })),
        });
      }
      await tx.dayPlan.updateMany({
        where: { leftoverOfDayId: from.id },
        data: { leftoverOfDayId: to.id },
      });
      return;
    }

    await tx.dayPlan.update({ where: { id: to.id }, data: carried });
    await tx.dayPlan.update({
      where: { id: from.id },
      data: {
        mealId: to.mealId,
        variantId: to.variantId,
        servings: to.servings,
        prepWindow: to.prepWindow,
        cookedAt: to.cookedAt,
        fillReason: to.fillReason,
        leftoverOfDayId: null,
      },
    });
    const sideRows = [
      ...fromSides.map((side) => ({ dayPlanId: to.id, sideId: side.sideId })),
      ...toSides.map((side) => ({ dayPlanId: from.id, sideId: side.sideId })),
    ];
    if (sideRows.length) await tx.dayPlanSide.createMany({ data: sideRows });

    const fromFollowers = await tx.dayPlan.findMany({
      where: { leftoverOfDayId: from.id },
      select: { id: true },
    });
    const toFollowers = await tx.dayPlan.findMany({
      where: { leftoverOfDayId: to.id },
      select: { id: true },
    });
    if (fromFollowers.length) {
      await tx.dayPlan.updateMany({
        where: { id: { in: fromFollowers.map((day) => day.id) } },
        data: { leftoverOfDayId: to.id },
      });
    }
    if (toFollowers.length) {
      await tx.dayPlan.updateMany({
        where: { id: { in: toFollowers.map((day) => day.id) } },
        data: { leftoverOfDayId: from.id },
      });
    }
  });

  await rebuildWeek(from.weekId);
  revalidateApp();
}

export async function updateDayEnabled(dayId: string, enabled: boolean) {
  const parsed = updateDayEnabledSchema.parse({ dayId, enabled });
  const user = await requireUser();
  const day = await ownedDay(parsed.dayId, user.id);
  await prisma.dayPlan.update({
    where: { id: dayId },
    data: { enabled: parsed.enabled },
  });
  await rebuildWeek(day.weekId);
  revalidateApp();
}

export async function updateDayServings(dayId: string, servings: number) {
  const parsed = updateDayServingsSchema.parse({ dayId, servings });
  const user = await requireUser();
  const day = await ownedDay(parsed.dayId, user.id);
  await prisma.dayPlan.update({
    where: { id: dayId },
    data: { servings: parsed.servings },
  });
  await rebuildWeek(day.weekId);
  revalidateApp();
}

export async function updateDayPrepWindow(
  dayId: string,
  prepWindow: "EVENING_BEFORE" | "SAME_DAY",
) {
  const parsed = updateDayPrepSchema.parse({ dayId, prepWindow });
  const user = await requireUser();
  await ownedDay(parsed.dayId, user.id);
  await prisma.dayPlan.update({
    where: { id: dayId },
    data: { prepWindow: parsed.prepWindow },
  });
  revalidateApp();
}

export async function updateDayVariant(dayId: string, variantId: string) {
  const parsed = updateDayVariantSchema.parse({ dayId, variantId });
  const user = await requireUser();
  const day = await ownedDay(parsed.dayId, user.id);
  if (!day.mealId) throw new Error("No meal on day");
  const variant = await prisma.proteinVariant.findFirst({
    where: { id: parsed.variantId, mealId: day.mealId },
  });
  if (!variant) throw new Error("Variant not on this meal");
  await prisma.dayPlan.update({
    where: { id: dayId },
    data: { variantId: parsed.variantId },
  });
  await rebuildWeek(day.weekId);
  revalidateApp();
}

export async function setDaySides(dayId: string, sideIds: string[]) {
  const parsed = setDaySidesSchema.parse({ dayId, sideIds });
  const user = await requireUser();
  const day = await ownedDay(parsed.dayId, user.id);
  if (parsed.sideIds.length) {
    const owned = await prisma.side.count({
      where: { id: { in: parsed.sideIds }, userId: user.id },
    });
    if (owned !== parsed.sideIds.length) throw new Error("Side not found");
  }
  await prisma.$transaction(async (tx) => {
    await tx.dayPlanSide.deleteMany({ where: { dayPlanId: dayId } });
    if (parsed.sideIds.length) {
      await tx.dayPlanSide.createMany({
        data: parsed.sideIds.map((sideId) => ({ dayPlanId: dayId, sideId })),
      });
    }
  });
  await rebuildWeek(day.weekId);
  revalidateApp();
}

export async function dismissDiversity(weekId: string) {
  const id = cuid.parse(weekId);
  const user = await requireUser();
  await prisma.week.updateMany({
    where: { id, userId: user.id },
    data: { diversityNudgeDismissed: true },
  });
  revalidateApp();
}

export async function fillWeekEmptyDays(weekStart: string) {
  const parsed = weekStartSchema.parse({ weekStart });
  const user = await requireUser();
  const week = await ensureWeek(user.id, parsed.weekStart);
  const meals = await prisma.meal.findMany({
    where: { userId: user.id },
    include: {
      variants: true,
      mealSides: { include: { side: true } },
    },
  });

  const library: FillMeal[] = meals.map((m) => {
    const def = m.variants.find((v) => v.isDefault) ?? m.variants[0];
    return {
      id: m.id,
      name: m.name,
      confidence: m.confidence,
      method: m.method,
      cuisine: m.cuisine,
      activeMinutes: m.activeMinutes,
      totalMinutes: m.totalMinutes,
      defaultProteinGroup: def?.proteinGroup ?? "OTHER",
      defaultVariantId: def?.id ?? "",
      defaultSideIds: m.mealSides
        .filter((s) => s.defaultSelected)
        .map((s) => s.sideId),
      sideActiveMinutes: m.mealSides
        .filter((s) => s.defaultSelected)
        .reduce((sum, s) => sum + (s.side.activeMinutes ?? 0), 0),
    };
  });

  const fullDays = await prisma.dayPlan.findMany({
    where: { weekId: week.id },
    orderBy: { date: "asc" },
  });

  const placements = fillEmptyDays(fullDays, library);

  for (const p of placements) {
    await prisma.$transaction(async (tx) => {
      await tx.dayPlanSide.deleteMany({ where: { dayPlanId: p.dayId } });
      await tx.dayPlan.update({
        where: { id: p.dayId },
        data: {
          mealId: p.mealId,
          variantId: p.variantId || null,
          fillReason: p.reason ?? null,
          cookedAt: null,
          leftoverOfDayId: null,
          sides: {
            create: p.sideIds.map((sideId) => ({ sideId })),
          },
        },
      });
    });
  }

  await rebuildWeek(week.id);
  revalidateApp();
  return {
    placed: placements.length,
    emptyLeft:
      fullDays.filter((d) => d.enabled && !d.mealId).length - placements.length,
  };
}

export async function setLeftoverDay(dayId: string, sourceDayId: string | null) {
  const parsed = dayIdSchema.parse({ dayId });
  const user = await requireUser();
  const day = await ownedDay(parsed.dayId, user.id);

  if (!sourceDayId) {
    await prisma.dayPlan.update({
      where: { id: day.id },
      data: {
        leftoverOfDayId: null,
        mealId: null,
        variantId: null,
        cookedAt: null,
        fillReason: null,
      },
    });
    await rebuildWeek(day.weekId);
    revalidateApp();
    return;
  }

  const sourceId = cuid.parse(sourceDayId);
  const source = await ownedDay(sourceId, user.id);
  if (source.weekId !== day.weekId) throw new Error("Different week");
  if (!source.mealId || source.leftoverOfDayId) throw new Error("Bad source");
  if (source.date >= day.date) throw new Error("Source must be earlier");

  const claimed = await prisma.dayPlan.count({
    where: {
      leftoverOfDayId: source.id,
      id: { not: day.id },
    },
  });
  const spare = source.servings - 1 - claimed;
  if (spare < 1) throw new Error("No portions left");

  await prisma.$transaction(async (tx) => {
    await tx.dayPlanSide.deleteMany({ where: { dayPlanId: day.id } });
    await tx.dayPlan.update({
      where: { id: day.id },
      data: {
        leftoverOfDayId: source.id,
        mealId: source.mealId,
        variantId: source.variantId,
        servings: 1,
        prepWindow: source.prepWindow,
        cookedAt: null,
        skippedAt: null,
        fillReason: "LEFTOVER",
        cookKind: "LEFTOVER",
        preparedDishId: null,
      },
    });
  });

  await rebuildWeek(day.weekId);
  revalidateApp();
}

import { coerceDaysViewOff, convertByDayToPool, normalizePoolTarget } from "@/lib/pool";
import { z } from "zod";

const weekModeSchema = z.object({
  weekId: z.string().cuid(),
  planningMode: z.enum(["BY_DAY", "POOL"]).optional(),
  daysView: z.boolean().optional(),
  weekendExpanded: z.boolean().optional(),
  poolTarget: z.number().int().min(3).max(7).optional(),
  useAsDefault: z.boolean().optional(),
});

export async function setWeekPlanningSettings(
  input: z.infer<typeof weekModeSchema>,
) {
  const parsed = weekModeSchema.parse(input);
  const user = await requireUser();
  const week = await prisma.week.findFirst({
    where: { id: parsed.weekId, userId: user.id },
    include: {
      days: { include: { sides: true }, orderBy: { date: "asc" } },
      poolEntries: true,
    },
  });
  if (!week) throw new Error("Week not found");

  let planningMode = parsed.planningMode ?? week.planningMode;
  let daysView = parsed.daysView ?? week.daysView;
  const coerced = coerceDaysViewOff(planningMode, daysView);
  planningMode = coerced.planningMode;
  daysView = coerced.daysView;

  const weekendExpanded =
    parsed.weekendExpanded ?? week.weekendExpanded;
  const poolTarget = normalizePoolTarget(
    parsed.poolTarget ?? week.poolTarget,
  );

  const switchingToPool =
    planningMode === "POOL" && week.planningMode !== "POOL";
  const switchingToByDay =
    planningMode === "BY_DAY" && week.planningMode === "POOL";
  const expandingWeekend =
    weekendExpanded && !week.weekendExpanded;
  const collapsingWeekend =
    !weekendExpanded && week.weekendExpanded;

  await prisma.$transaction(async (tx) => {
    await tx.week.update({
      where: { id: week.id },
      data: { planningMode, daysView, weekendExpanded, poolTarget },
    });

    if (expandingWeekend) {
      const weekend = week.days.filter((_, i) => i >= 5);
      for (const day of weekend) {
        await tx.dayPlan.update({
          where: { id: day.id },
          data: { enabled: true },
        });
      }
    }
    if (collapsingWeekend) {
      const weekend = week.days.filter((_, i) => i >= 5);
      for (const day of weekend) {
        await tx.dayPlan.update({
          where: { id: day.id },
          data: { enabled: false },
        });
      }
    }

    if (switchingToPool && week.poolEntries.length === 0) {
      const drafts = convertByDayToPool(
        week.days.map((d) => ({
          dayPlanId: d.id,
          mealId: d.mealId,
          variantId: d.variantId,
          servings: d.servings,
          prepWindow: d.prepWindow,
          preparedDishId: d.preparedDishId,
          cookKind: d.cookKind,
          sideIds: d.sides.map((s) => s.sideId),
          enabled: d.enabled,
        })),
      );
      for (const draft of drafts.slice(0, poolTarget)) {
        await tx.poolEntry.create({
          data: {
            weekId: week.id,
            sortOrder: draft.sortOrder,
            mealId: draft.mealId,
            variantId: draft.variantId,
            servings: draft.servings,
            prepWindow: draft.prepWindow,
            preparedDishId: draft.preparedDishId,
            pinnedDayPlanId: draft.pinnedDayPlanId,
            sides: {
              create: draft.sideIds.map((sideId) => ({ sideId })),
            },
          },
        });
      }
    }

    if (switchingToByDay) {
      const entries = await tx.poolEntry.findMany({
        where: { weekId: week.id },
        include: { sides: true },
        orderBy: { sortOrder: "asc" },
      });
      const emptyDays = week.days.filter(
        (d) => d.enabled && !d.mealId && !d.preparedDishId,
      );
      let dayIndex = 0;
      for (const entry of entries) {
        if (entry.pinnedDayPlanId) continue;
        if (!entry.mealId && !entry.preparedDishId) continue;
        const target = emptyDays[dayIndex++];
        if (!target) break;
        await tx.dayPlan.update({
          where: { id: target.id },
          data: {
            mealId: entry.mealId,
            variantId: entry.variantId,
            servings: entry.servings,
            prepWindow: entry.prepWindow,
            preparedDishId: entry.preparedDishId,
            cookKind: entry.preparedDishId ? "HEAT_PREPARED" : "RECIPE",
            sides: {
              create: entry.sides.map((s) => ({ sideId: s.sideId })),
            },
          },
        });
      }
    }

    if (parsed.useAsDefault) {
      await tx.user.update({
        where: { id: user.id },
        data: {
          defaultPlanningMode: planningMode,
          defaultDaysView: daysView,
          defaultWeekendExpanded: weekendExpanded,
          defaultPoolTarget: poolTarget,
        },
      });
    }
  });

  await rebuildWeek(week.id);
  revalidateApp();
}

const poolMealSchema = z.object({
  weekId: z.string().cuid(),
  mealId: z.string().cuid(),
});

export async function addMealToPool(input: z.infer<typeof poolMealSchema>) {
  const parsed = poolMealSchema.parse(input);
  const user = await requireUser();
  const week = await prisma.week.findFirst({
    where: { id: parsed.weekId, userId: user.id },
    include: { poolEntries: true },
  });
  if (!week) throw new Error("Week not found");
  if (week.poolEntries.length >= week.poolTarget) {
    throw new Error("Pool is full");
  }
  if (week.poolEntries.some((e) => e.mealId === parsed.mealId)) {
    throw new Error("Already in pool");
  }
  const meal = await prisma.meal.findFirst({
    where: { id: parsed.mealId, userId: user.id },
    include: { variants: true, mealSides: true },
  });
  if (!meal) throw new Error("Meal not found");
  const variant = meal.variants.find((v) => v.isDefault) ?? meal.variants[0];
  const defaultSides = meal.mealSides.filter((s) => s.defaultSelected);

  await prisma.poolEntry.create({
    data: {
      weekId: week.id,
      sortOrder: week.poolEntries.length,
      mealId: meal.id,
      variantId: variant?.id ?? null,
      servings: 3,
      sides: {
        create: defaultSides.map((s) => ({ sideId: s.sideId })),
      },
    },
  });
  await rebuildWeek(week.id);
  revalidateApp();
}

export async function removePoolEntry(entryId: string) {
  const parsed = z.object({ entryId: z.string().cuid() }).parse({ entryId });
  const user = await requireUser();
  const entry = await prisma.poolEntry.findFirst({
    where: { id: parsed.entryId, week: { userId: user.id } },
  });
  if (!entry) throw new Error("Not found");
  await prisma.poolEntry.delete({ where: { id: entry.id } });
  await rebuildWeek(entry.weekId);
  revalidateApp();
}

export async function pinPoolEntry(entryId: string, dayId: string | null) {
  const parsed = z
    .object({
      entryId: z.string().cuid(),
      dayId: z.string().cuid().nullable(),
    })
    .parse({ entryId, dayId });
  const user = await requireUser();
  const entry = await prisma.poolEntry.findFirst({
    where: { id: parsed.entryId, week: { userId: user.id } },
    include: { sides: true, week: true },
  });
  if (!entry) throw new Error("Not found");

  if (parsed.dayId) {
    const day = await ownedDay(parsed.dayId, user.id);
    if (day.weekId !== entry.weekId) throw new Error("Different weeks");
    await prisma.$transaction(async (tx) => {
      await tx.dayPlanSide.deleteMany({ where: { dayPlanId: day.id } });
      await tx.dayPlan.update({
        where: { id: day.id },
        data: {
          mealId: entry.mealId,
          variantId: entry.variantId,
          servings: entry.servings,
          prepWindow: entry.prepWindow,
          preparedDishId: entry.preparedDishId,
          cookKind: entry.preparedDishId ? "HEAT_PREPARED" : "RECIPE",
          cookedAt: null,
          skippedAt: null,
          leftoverOfDayId: null,
          sides: {
            create: entry.sides.map((s) => ({ sideId: s.sideId })),
          },
        },
      });
      await tx.poolEntry.update({
        where: { id: entry.id },
        data: { pinnedDayPlanId: day.id },
      });
    });
  } else {
    await prisma.poolEntry.update({
      where: { id: entry.id },
      data: { pinnedDayPlanId: null },
    });
  }

  await rebuildWeek(entry.weekId);
  revalidateApp();
}

export async function fillPoolSlots(weekId: string) {
  const parsed = z.object({ weekId: z.string().cuid() }).parse({ weekId });
  const user = await requireUser();
  const week = await prisma.week.findFirst({
    where: { id: parsed.weekId, userId: user.id },
    include: {
      poolEntries: true,
      days: true,
    },
  });
  if (!week) throw new Error("Week not found");

  const meals = await prisma.meal.findMany({
    where: { userId: user.id },
    include: {
      variants: { orderBy: { sortOrder: "asc" } },
      mealSides: true,
    },
  });

  const fillMeals: FillMeal[] = meals
    .map((m) => {
      const def = m.variants.find((v) => v.isDefault) ?? m.variants[0];
      if (!def) return null;
      return {
        id: m.id,
        name: m.name,
        confidence: m.confidence,
        method: m.method,
        cuisine: m.cuisine,
        activeMinutes: m.activeMinutes,
        totalMinutes: m.totalMinutes,
        defaultProteinGroup: def.proteinGroup,
        defaultVariantId: def.id,
        defaultSideIds: m.mealSides
          .filter((s) => s.defaultSelected)
          .map((s) => s.sideId),
      };
    })
    .filter((m): m is FillMeal => m != null);

  const usedIds = new Set(
    week.poolEntries.map((e) => e.mealId).filter(Boolean) as string[],
  );
  const slotsNeeded = Math.max(0, week.poolTarget - week.poolEntries.length);
  // Reuse fillEmptyDays against synthetic empty "days"
  const syntheticDays = Array.from({ length: slotsNeeded }, (_, i) => ({
    id: `slot-${i}`,
    date: week.weekStart,
    enabled: true,
    mealId: null as string | null,
    prepWindow: "EVENING_BEFORE",
    servings: 3,
  }));

  const alreadyUsed = [...usedIds].map((id, i) => ({
    id: `used-${i}`,
    date: week.weekStart,
    enabled: true,
    mealId: id,
    prepWindow: "EVENING_BEFORE",
    servings: 3,
  }));

  const placements = fillEmptyDays(
    [...alreadyUsed, ...syntheticDays],
    fillMeals,
  );

  let sortOrder = week.poolEntries.length;
  let filled = 0;
  for (const placement of placements) {
    if (!placement.dayId.startsWith("slot-")) continue;
    const meal = meals.find((m) => m.id === placement.mealId);
    if (!meal) continue;
    const variant =
      meal.variants.find((v) => v.isDefault) ?? meal.variants[0];
    const defaultSides = meal.mealSides.filter((s) => s.defaultSelected);
    await prisma.poolEntry.create({
      data: {
        weekId: week.id,
        sortOrder: sortOrder++,
        mealId: meal.id,
        variantId: variant?.id ?? null,
        servings: 3,
        sides: {
          create: defaultSides.map((s) => ({ sideId: s.sideId })),
        },
      },
    });
    filled += 1;
  }

  await rebuildWeek(week.id);
  revalidateApp();
  return { filled };
}

export async function logPoolCook(entryId: string, cookedDate: string) {
  const parsed = z
    .object({
      entryId: z.string().cuid(),
      cookedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    })
    .parse({ entryId, cookedDate });
  const user = await requireUser();
  const entry = await prisma.poolEntry.findFirst({
    where: { id: parsed.entryId, week: { userId: user.id } },
  });
  if (!entry) throw new Error("Not found");
  const instance = await prisma.poolCookInstance.create({
    data: {
      userId: user.id,
      poolEntryId: entry.id,
      cookedDate: parsed.cookedDate,
    },
  });
  revalidateApp();
  return instance;
}
