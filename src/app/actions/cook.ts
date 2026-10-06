"use server";

import { prisma } from "@/lib/db";
import { revalidateApp } from "@/lib/revalidate-app";
import { dayIdSchema, mealIdSchema, timezoneSchema } from "@/lib/schemas";
import { requireUser } from "@/lib/session";

export async function logCook(dayId: string) {
  const parsed = dayIdSchema.parse({ dayId });
  const user = await requireUser();
  const day = await prisma.dayPlan.findFirst({
    where: {
      id: parsed.dayId,
      week: { userId: user.id },
      mealId: { not: null },
    },
  });
  if (!day?.mealId) throw new Error("No meal");
  if (day.cookedAt) {
    revalidateApp();
    return;
  }

  await prisma.$transaction([
    prisma.dayPlan.update({
      where: { id: day.id },
      data: { cookedAt: new Date() },
    }),
    prisma.meal.update({
      where: { id: day.mealId },
      data: { cookCount: { increment: 1 } },
    }),
  ]);

  revalidateApp();
}

export async function undoCook(dayId: string) {
  const parsed = dayIdSchema.parse({ dayId });
  const user = await requireUser();
  const day = await prisma.dayPlan.findFirst({
    where: {
      id: parsed.dayId,
      week: { userId: user.id },
      mealId: { not: null },
    },
  });
  if (!day?.mealId || !day.cookedAt) return;

  await prisma.$transaction([
    prisma.dayPlan.update({
      where: { id: day.id },
      data: { cookedAt: null },
    }),
    prisma.meal.update({
      where: { id: day.mealId },
      data: { cookCount: { decrement: 1 } },
    }),
  ]);

  // Clamp cookCount at 0
  await prisma.meal.updateMany({
    where: { id: day.mealId, cookCount: { lt: 0 } },
    data: { cookCount: 0 },
  });

  revalidateApp();
}

export async function acceptConfidenceNudge(mealId: string) {
  const parsed = mealIdSchema.parse({ mealId });
  const user = await requireUser();
  const meal = await prisma.meal.findFirst({
    where: { id: parsed.mealId, userId: user.id },
  });
  if (!meal) throw new Error("Not found");

  let next = meal.confidence;
  if (meal.confidence === "RECIPE") next = "PROMPT";
  else if (meal.confidence === "PROMPT") next = "KNOW";

  await prisma.meal.update({
    where: { id: mealId },
    data: {
      confidence: next,
      nudgeDismissedAtCookCount: meal.cookCount,
    },
  });
  revalidateApp();
}

export async function dismissConfidenceNudge(mealId: string) {
  const parsed = mealIdSchema.parse({ mealId });
  const user = await requireUser();
  const meal = await prisma.meal.findFirst({
    where: { id: parsed.mealId, userId: user.id },
  });
  if (!meal) throw new Error("Not found");
  await prisma.meal.update({
    where: { id: mealId },
    data: { nudgeDismissedAtCookCount: meal.cookCount },
  });
  revalidateApp();
}

export async function setTimezone(timezone: string) {
  const parsed = timezoneSchema.parse({ timezone });
  const user = await requireUser();
  if (user.timezone === "UTC") {
    await prisma.user.update({
      where: { id: user.id },
      data: { timezone: parsed.timezone },
    });
  }
}
