"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { defaultRole } from "@/lib/pantry-dictionary";
import { rebuildWeeksForMeal } from "@/lib/rebuild";
import { requireUser } from "@/lib/session";

export async function setConfidence(mealId: string, confidence: string) {
  const user = await requireUser();
  if (!["KNOW", "PROMPT", "RECIPE"].includes(confidence)) {
    throw new Error("Invalid confidence");
  }
  await prisma.meal.updateMany({
    where: { id: mealId, userId: user.id },
    data: { confidence },
  });
  revalidatePath("/week");
  revalidatePath(`/meals/${mealId}`);
}

export async function createMeal(input: {
  name: string;
  ingredients: Array<{
    name: string;
    quantity?: number | null;
    unit?: "G" | "ML" | "PIECE" | null;
    role?: "BUY" | "PANTRY";
  }>;
  proteinGroup?: string | null;
  activeMinutes?: number | null;
  totalMinutes?: number | null;
}) {
  const user = await requireUser();
  const name = input.name.trim();
  if (!name) throw new Error("Name required");
  if (!input.ingredients.length) throw new Error("Add at least one ingredient");

  const group = input.proteinGroup || "OTHER";
  const label =
    group === "OTHER"
      ? "No specific protein"
      : group
          .toLowerCase()
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());

  const meal = await prisma.meal.create({
    data: {
      userId: user.id,
      name,
      confidence: "KNOW",
      method: "OTHER",
      baseServings: 3,
      completePlate: false,
      activeMinutes: input.activeMinutes ?? null,
      totalMinutes: input.totalMinutes ?? null,
      variants: {
        create: {
          label,
          proteinGroup: group,
          isDefault: true,
          sortOrder: 0,
        },
      },
      ingredients: {
        create: input.ingredients.map((ing, sortOrder) => ({
          name: ing.name.trim(),
          quantity: ing.quantity ?? null,
          unit: ing.unit ?? null,
          role: ing.role ?? defaultRole(ing.name),
          sortOrder,
        })),
      },
    },
  });

  revalidatePath("/week");
  redirect(`/meals/${meal.id}`);
}

export async function updateMealBasics(
  mealId: string,
  data: {
    name?: string;
    method?: string;
    cuisine?: string | null;
    activeMinutes?: number | null;
    totalMinutes?: number | null;
    completePlate?: boolean;
    baseServings?: number;
  },
) {
  const user = await requireUser();
  await prisma.meal.updateMany({
    where: { id: mealId, userId: user.id },
    data: {
      name: data.name?.trim(),
      method: data.method,
      cuisine: data.cuisine,
      activeMinutes: data.activeMinutes,
      totalMinutes: data.totalMinutes,
      completePlate: data.completePlate,
      baseServings: data.baseServings,
    },
  });
  await rebuildWeeksForMeal(mealId);
  revalidatePath(`/meals/${mealId}`);
  revalidatePath("/week");
  revalidatePath("/list", "layout");
}

export async function addIngredient(
  mealId: string,
  input: {
    name: string;
    quantity?: number | null;
    unit?: string | null;
    role?: "BUY" | "PANTRY";
    variantId?: string | null;
  },
) {
  const user = await requireUser();
  const meal = await prisma.meal.findFirst({
    where: { id: mealId, userId: user.id },
  });
  if (!meal) throw new Error("Meal not found");

  const count = await prisma.ingredient.count({
    where: { mealId, variantId: input.variantId ?? null },
  });

  await prisma.ingredient.create({
    data: {
      mealId,
      variantId: input.variantId ?? null,
      name: input.name.trim(),
      quantity: input.quantity ?? null,
      unit: input.unit ?? null,
      role: input.role ?? defaultRole(input.name),
      sortOrder: count,
    },
  });
  await rebuildWeeksForMeal(mealId);
  revalidatePath(`/meals/${mealId}`);
  revalidatePath("/list", "layout");
  revalidatePath("/week");
}

export async function updateIngredient(
  ingredientId: string,
  data: {
    name?: string;
    quantity?: number | null;
    unit?: string | null;
    role?: "BUY" | "PANTRY";
  },
) {
  const user = await requireUser();
  const ing = await prisma.ingredient.findFirst({
    where: { id: ingredientId },
    include: { meal: true, side: true },
  });
  if (!ing) throw new Error("Not found");
  if (ing.meal && ing.meal.userId !== user.id) throw new Error("Unauthorized");
  if (ing.side && ing.side.userId !== user.id) throw new Error("Unauthorized");

  await prisma.ingredient.update({
    where: { id: ingredientId },
    data: {
      name: data.name?.trim(),
      quantity: data.quantity,
      unit: data.unit,
      role: data.role,
    },
  });

  if (ing.mealId) await rebuildWeeksForMeal(ing.mealId);
  revalidatePath("/week");
  revalidatePath("/list", "layout");
  if (ing.mealId) revalidatePath(`/meals/${ing.mealId}`);
}

export async function deleteIngredient(ingredientId: string) {
  const user = await requireUser();
  const ing = await prisma.ingredient.findFirst({
    where: { id: ingredientId },
    include: { meal: true, side: true },
  });
  if (!ing) throw new Error("Not found");
  if (ing.meal && ing.meal.userId !== user.id) throw new Error("Unauthorized");
  if (ing.side && ing.side.userId !== user.id) throw new Error("Unauthorized");

  await prisma.ingredient.delete({ where: { id: ingredientId } });
  if (ing.mealId) await rebuildWeeksForMeal(ing.mealId);
  revalidatePath("/week");
  revalidatePath("/list", "layout");
  if (ing.mealId) revalidatePath(`/meals/${ing.mealId}`);
}

export async function deleteMeal(mealId: string) {
  const user = await requireUser();
  const meal = await prisma.meal.findFirst({
    where: { id: mealId, userId: user.id },
  });
  if (!meal) throw new Error("Not found");

  const days = await prisma.dayPlan.findMany({
    where: { mealId },
    select: { weekId: true },
  });
  const weekIds = [...new Set(days.map((d) => d.weekId))];

  const dayIds = (
    await prisma.dayPlan.findMany({
      where: { mealId },
      select: { id: true },
    })
  ).map((d) => d.id);
  if (dayIds.length) {
    await prisma.dayPlanSide.deleteMany({
      where: { dayPlanId: { in: dayIds } },
    });
  }
  await prisma.dayPlan.updateMany({
    where: { mealId },
    data: { mealId: null, variantId: null },
  });
  await prisma.meal.delete({ where: { id: mealId } });

  for (const weekId of weekIds) {
    const { rebuildWeek } = await import("@/lib/rebuild");
    await rebuildWeek(weekId);
  }

  revalidatePath("/week");
  redirect("/week");
}
