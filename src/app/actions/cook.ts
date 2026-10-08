"use server";

import {
  confirmCook,
  skipCook,
  undoCookConfirm,
} from "@/lib/cook-confirm";
import { prisma } from "@/lib/db";
import { listPendingCookDays, todayInTimezone } from "@/lib/pending-cooks";
import { revalidateApp } from "@/lib/revalidate-app";
import { dayIdSchema, mealIdSchema, timezoneSchema } from "@/lib/schemas";
import { requireUser } from "@/lib/session";
import { z } from "zod";

/** Thin wrapper — same pipeline as login confirmation. */
export async function logCook(dayId: string) {
  const parsed = dayIdSchema.parse({ dayId });
  const user = await requireUser();
  const result = await confirmCook(user.id, {
    kind: "day",
    dayPlanId: parsed.dayId,
  });
  revalidateApp();
  return result;
}

export async function undoCook(dayId: string) {
  const parsed = dayIdSchema.parse({ dayId });
  const user = await requireUser();
  const result = await undoCookConfirm(user.id, {
    kind: "day",
    dayPlanId: parsed.dayId,
  });
  revalidateApp();
  return result;
}

export async function confirmCookAction(dayId: string) {
  return logCook(dayId);
}

export async function skipCookAction(dayId: string) {
  const parsed = dayIdSchema.parse({ dayId });
  const user = await requireUser();
  const result = await skipCook(user.id, {
    kind: "day",
    dayPlanId: parsed.dayId,
  });
  revalidateApp();
  return result;
}

export async function dismissCookPrompt() {
  const user = await requireUser();
  await prisma.user.update({
    where: { id: user.id },
    data: { lastCookPromptAt: new Date() },
  });
  revalidateApp();
}

export async function listPendingCookConfirmations() {
  const user = await requireUser();
  const fresh = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
  });
  const today = todayInTimezone(new Date(), fresh.timezone || "UTC");
  const days = await prisma.dayPlan.findMany({
    where: {
      week: { userId: user.id },
      date: { lt: today },
      enabled: true,
      cookedAt: null,
      skippedAt: null,
      OR: [{ mealId: { not: null } }, { preparedDishId: { not: null } }],
    },
    include: {
      meal: { select: { name: true } },
      preparedDish: { select: { name: true } },
    },
    orderBy: { date: "asc" },
  });

  return listPendingCookDays(
    days.map((d) => ({
      id: d.id,
      date: d.date,
      enabled: d.enabled,
      mealId: d.mealId,
      preparedDishId: d.preparedDishId,
      cookedAt: d.cookedAt,
      skippedAt: d.skippedAt,
      leftoverOfDayId: d.leftoverOfDayId,
      mealName: d.meal?.name ?? null,
      preparedName: d.preparedDish?.name ?? null,
    })),
    today,
  );
}

const poolCookSchema = z.object({ poolCookId: z.string().cuid() });

export async function confirmPoolCookAction(poolCookId: string) {
  const parsed = poolCookSchema.parse({ poolCookId });
  const user = await requireUser();
  const result = await confirmCook(user.id, {
    kind: "poolCook",
    poolCookId: parsed.poolCookId,
  });
  revalidateApp();
  return result;
}

export async function skipPoolCookAction(poolCookId: string) {
  const parsed = poolCookSchema.parse({ poolCookId });
  const user = await requireUser();
  const result = await skipCook(user.id, {
    kind: "poolCook",
    poolCookId: parsed.poolCookId,
  });
  revalidateApp();
  return result;
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
  const { auth } = await import("@/auth");
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.timezone !== "UTC") return;
  await prisma.user.update({
    where: { id: user.id },
    data: { timezone: parsed.timezone },
  });
}
