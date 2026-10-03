"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { fillEmptyDays, type FillMeal } from "@/lib/fill";
import { rebuildWeek } from "@/lib/rebuild";
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
  const user = await requireUser();
  const day = await ownedDay(dayId, user.id);
  const meal = await prisma.meal.findFirst({
    where: { id: mealId, userId: user.id },
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
        sides: {
          create: defaultSides.map((s) => ({ sideId: s.sideId })),
        },
      },
    });
  });

  await rebuildWeek(day.weekId);
  revalidatePath(`/week/${day.week.weekStart}`);
  revalidatePath(`/list/${day.week.weekStart}`);
}

export async function clearDay(dayId: string) {
  const user = await requireUser();
  const day = await ownedDay(dayId, user.id);
  await prisma.$transaction(async (tx) => {
    await tx.dayPlanSide.deleteMany({ where: { dayPlanId: dayId } });
    await tx.dayPlan.update({
      where: { id: dayId },
      data: { mealId: null, variantId: null },
    });
  });
  await rebuildWeek(day.weekId);
  revalidatePath(`/week/${day.week.weekStart}`);
  revalidatePath(`/list/${day.week.weekStart}`);
}

export async function updateDayEnabled(dayId: string, enabled: boolean) {
  const user = await requireUser();
  const day = await ownedDay(dayId, user.id);
  await prisma.dayPlan.update({ where: { id: dayId }, data: { enabled } });
  await rebuildWeek(day.weekId);
  revalidatePath(`/week/${day.week.weekStart}`);
  revalidatePath(`/list/${day.week.weekStart}`);
}

export async function updateDayServings(dayId: string, servings: number) {
  const user = await requireUser();
  const day = await ownedDay(dayId, user.id);
  const next = Math.min(12, Math.max(1, servings));
  await prisma.dayPlan.update({
    where: { id: dayId },
    data: { servings: next },
  });
  await rebuildWeek(day.weekId);
  revalidatePath(`/week/${day.week.weekStart}`);
  revalidatePath(`/list/${day.week.weekStart}`);
}

export async function updateDayPrepWindow(
  dayId: string,
  prepWindow: "EVENING_BEFORE" | "SAME_DAY",
) {
  const user = await requireUser();
  const day = await ownedDay(dayId, user.id);
  await prisma.dayPlan.update({ where: { id: dayId }, data: { prepWindow } });
  revalidatePath(`/week/${day.week.weekStart}`);
}

export async function updateDayVariant(dayId: string, variantId: string) {
  const user = await requireUser();
  const day = await ownedDay(dayId, user.id);
  await prisma.dayPlan.update({ where: { id: dayId }, data: { variantId } });
  await rebuildWeek(day.weekId);
  revalidatePath(`/week/${day.week.weekStart}`);
  revalidatePath(`/list/${day.week.weekStart}`);
}

export async function setDaySides(dayId: string, sideIds: string[]) {
  const user = await requireUser();
  const day = await ownedDay(dayId, user.id);
  await prisma.$transaction(async (tx) => {
    await tx.dayPlanSide.deleteMany({ where: { dayPlanId: dayId } });
    if (sideIds.length) {
      await tx.dayPlanSide.createMany({
        data: sideIds.map((sideId) => ({ dayPlanId: dayId, sideId })),
      });
    }
  });
  await rebuildWeek(day.weekId);
  revalidatePath(`/week/${day.week.weekStart}`);
  revalidatePath(`/list/${day.week.weekStart}`);
}

export async function dismissDiversity(weekId: string) {
  const user = await requireUser();
  await prisma.week.updateMany({
    where: { id: weekId, userId: user.id },
    data: { diversityNudgeDismissed: true },
  });
  revalidatePath("/week");
}

export async function fillWeekEmptyDays(weekStart: string) {
  const user = await requireUser();
  const week = await ensureWeek(user.id, weekStart);
  const meals = await prisma.meal.findMany({
    where: { userId: user.id },
    include: {
      variants: true,
      mealSides: true,
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
          sides: {
            create: p.sideIds.map((sideId) => ({ sideId })),
          },
        },
      });
    });
  }

  await rebuildWeek(week.id);
  revalidatePath(`/week/${weekStart}`);
  revalidatePath(`/list/${weekStart}`);
  return { placed: placements.length, emptyLeft: fullDays.filter((d) => d.enabled && !d.mealId).length - placements.length };
}
