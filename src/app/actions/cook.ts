"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function logCook(dayId: string) {
  const user = await requireUser();
  const day = await prisma.dayPlan.findFirst({
    where: { id: dayId, week: { userId: user.id }, mealId: { not: null } },
  });
  if (!day?.mealId) throw new Error("No meal");

  await prisma.meal.update({
    where: { id: day.mealId },
    data: { cookCount: { increment: 1 } },
  });

  revalidatePath(`/cook/${dayId}`);
  revalidatePath("/week");
}

export async function acceptConfidenceNudge(mealId: string) {
  const user = await requireUser();
  const meal = await prisma.meal.findFirst({
    where: { id: mealId, userId: user.id },
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
  revalidatePath("/week");
  revalidatePath(`/meals/${mealId}`);
}

export async function dismissConfidenceNudge(mealId: string) {
  const user = await requireUser();
  const meal = await prisma.meal.findFirst({
    where: { id: mealId, userId: user.id },
  });
  if (!meal) throw new Error("Not found");
  await prisma.meal.update({
    where: { id: mealId },
    data: { nudgeDismissedAtCookCount: meal.cookCount },
  });
  revalidatePath(`/meals/${mealId}`);
}

export async function setTimezone(timezone: string) {
  const user = await requireUser();
  if (!timezone) return;
  if (user.timezone === "UTC") {
    await prisma.user.update({
      where: { id: user.id },
      data: { timezone },
    });
  }
}
