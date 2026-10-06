"use server";

import { prisma } from "@/lib/db";
import { fillEmptyDays, type FillMeal } from "@/lib/fill";
import { rebuildWeek } from "@/lib/rebuild";
import { revalidateApp } from "@/lib/revalidate-app";
import {
  cuid,
  dayIdSchema,
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
        leftoverOfDayId: null,
        fillReason: null,
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
        leftoverOfDayId: null,
        fillReason: null,
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
        fillReason: "LEFTOVER",
      },
    });
  });

  await rebuildWeek(day.weekId);
  revalidateApp();
}
