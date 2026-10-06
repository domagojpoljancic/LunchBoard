"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { defaultRole } from "@/lib/pantry-dictionary";
import { revalidateApp } from "@/lib/revalidate-app";
import { rebuildWeeks, rebuildWeeksForMeal } from "@/lib/rebuild";
import {
  addIngredientSchema,
  createMealSchema,
  cuid,
  setConfidenceSchema,
  updateIngredientSchema,
  updateMealBasicsSchema,
} from "@/lib/schemas";
import { requireUser } from "@/lib/session";

export async function setConfidence(mealId: string, confidence: string) {
  const parsed = setConfidenceSchema.parse({ mealId, confidence });
  const user = await requireUser();
  await prisma.meal.updateMany({
    where: { id: parsed.mealId, userId: user.id },
    data: { confidence: parsed.confidence },
  });
  revalidateApp();
}

export async function createMeal(input: {
  name: string;
  ingredients: Array<{
    name: string;
    quantity?: number | null;
    unit?: "G" | "ML" | "PIECE" | "BUNCH" | null;
    role?: "BUY" | "PANTRY";
  }>;
  proteinGroup?: string | null;
  activeMinutes?: number | null;
  totalMinutes?: number | null;
}) {
  const user = await requireUser();
  const parsed = createMealSchema.parse({
    name: input.name,
    proteinGroup: (input.proteinGroup as
      | "BEEF"
      | "WHITE_MEAT"
      | "FISH"
      | "VEGETARIAN"
      | "VEGAN"
      | "DAIRY"
      | "OTHER"
      | null
      | undefined) || undefined,
    activeMinutes: input.activeMinutes ?? null,
    totalMinutes: input.totalMinutes ?? null,
    ingredients: input.ingredients.map((ing) => ({
      name: ing.name,
      quantity: ing.quantity ?? null,
      unit: ing.unit ?? null,
      role: ing.role,
    })),
  });
  const name = parsed.name;

  const group = parsed.proteinGroup || "OTHER";
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
      activeMinutes: parsed.activeMinutes ?? null,
      totalMinutes: parsed.totalMinutes ?? null,
      variants: {
        create: {
          label,
          proteinGroup: group,
          isDefault: true,
          sortOrder: 0,
        },
      },
      ingredients: {
        create: parsed.ingredients.map((ing, sortOrder) => ({
          name: ing.name,
          quantity: ing.quantity ?? null,
          unit: ing.unit ?? null,
          role: ing.role ?? defaultRole(ing.name),
          sortOrder,
        })),
      },
    },
  });

  revalidateApp();
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
  const parsed = updateMealBasicsSchema.parse({
    mealId,
    name: data.name ?? "Meal",
    method: data.method ?? "OTHER",
    cuisine: data.cuisine ?? null,
    activeMinutes: data.activeMinutes ?? null,
    totalMinutes: data.totalMinutes ?? null,
    completePlate: data.completePlate ?? false,
    baseServings: data.baseServings,
  });
  const user = await requireUser();
  await prisma.meal.updateMany({
    where: { id: parsed.mealId, userId: user.id },
    data: {
      name: parsed.name,
      method: parsed.method,
      cuisine: parsed.cuisine,
      activeMinutes: parsed.activeMinutes,
      totalMinutes: parsed.totalMinutes,
      completePlate: parsed.completePlate,
      baseServings: parsed.baseServings,
    },
  });
  await rebuildWeeksForMeal(parsed.mealId);
  revalidateApp();
}

export async function addIngredient(input: {
  mealId?: string | null;
  sideId?: string | null;
  name: string;
  quantity?: number | null;
  unit?: string | null;
  role?: "BUY" | "PANTRY";
  variantId?: string | null;
}) {
  const parsed = addIngredientSchema.parse({
    mealId: input.mealId ?? null,
    sideId: input.sideId ?? null,
    name: input.name,
    quantity: input.quantity ?? null,
    unit: (input.unit as "G" | "ML" | "PIECE" | "BUNCH" | null) ?? null,
    role: input.role ?? defaultRole(input.name),
    variantId: input.variantId ?? null,
  });
  const user = await requireUser();

  if (parsed.mealId) {
    const meal = await prisma.meal.findFirst({
      where: { id: parsed.mealId, userId: user.id },
    });
    if (!meal) throw new Error("Meal not found");

    if (parsed.variantId) {
      const variant = await prisma.proteinVariant.findFirst({
        where: { id: parsed.variantId, mealId: meal.id },
      });
      if (!variant) throw new Error("Variant not on this meal");
    }

    const count = await prisma.ingredient.count({
      where: { mealId: meal.id, variantId: parsed.variantId ?? null },
    });

    await prisma.ingredient.create({
      data: {
        mealId: meal.id,
        variantId: parsed.variantId ?? null,
        name: parsed.name,
        quantity: parsed.quantity,
        unit: parsed.unit,
        role: parsed.role,
        sortOrder: count,
      },
    });
    await rebuildWeeksForMeal(meal.id);
  } else if (parsed.sideId) {
    const side = await prisma.side.findFirst({
      where: { id: parsed.sideId, userId: user.id },
    });
    if (!side) throw new Error("Side not found");

    const count = await prisma.ingredient.count({
      where: { sideId: side.id },
    });

    await prisma.ingredient.create({
      data: {
        sideId: side.id,
        name: parsed.name,
        quantity: parsed.quantity,
        unit: parsed.unit,
        role: parsed.role,
        sortOrder: count,
      },
    });
    await rebuildWeeks({ sideId: side.id });
  }

  revalidateApp();
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
  const parsed = updateIngredientSchema.parse({
    ingredientId,
    ...data,
    unit: data.unit as "G" | "ML" | "PIECE" | "BUNCH" | null | undefined,
  });
  const user = await requireUser();
  const ing = await prisma.ingredient.findFirst({
    where: { id: parsed.ingredientId },
    include: { meal: true, side: true },
  });
  if (!ing) throw new Error("Not found");
  if (!ing.meal && !ing.side) throw new Error("Unauthorized");
  if (ing.meal && ing.meal.userId !== user.id) throw new Error("Unauthorized");
  if (ing.side && ing.side.userId !== user.id) throw new Error("Unauthorized");

  await prisma.ingredient.update({
    where: { id: parsed.ingredientId },
    data: {
      name: parsed.name,
      quantity: parsed.quantity,
      unit: parsed.unit,
      role: parsed.role,
    },
  });

  await rebuildWeeks({ mealId: ing.mealId, sideId: ing.sideId });
  revalidateApp();
}

export async function deleteIngredient(ingredientId: string) {
  const id = cuid.parse(ingredientId);
  const user = await requireUser();
  const ing = await prisma.ingredient.findFirst({
    where: { id },
    include: { meal: true, side: true },
  });
  if (!ing) throw new Error("Not found");
  if (!ing.meal && !ing.side) throw new Error("Unauthorized");
  if (ing.meal && ing.meal.userId !== user.id) throw new Error("Unauthorized");
  if (ing.side && ing.side.userId !== user.id) throw new Error("Unauthorized");

  await prisma.ingredient.delete({ where: { id } });
  await rebuildWeeks({ mealId: ing.mealId, sideId: ing.sideId });
  revalidateApp();
}

export async function deleteMeal(mealId: string) {
  const id = cuid.parse(mealId);
  const user = await requireUser();
  const meal = await prisma.meal.findFirst({
    where: { id, userId: user.id },
  });
  if (!meal) throw new Error("Not found");

  const days = await prisma.dayPlan.findMany({
    where: { mealId: id },
    select: { weekId: true },
  });
  const weekIds = [...new Set(days.map((d) => d.weekId))];

  const dayIds = (
    await prisma.dayPlan.findMany({
      where: { mealId: id },
      select: { id: true },
    })
  ).map((d) => d.id);
  if (dayIds.length) {
    await prisma.dayPlanSide.deleteMany({
      where: { dayPlanId: { in: dayIds } },
    });
  }
  await prisma.dayPlan.updateMany({
    where: { mealId: id },
    data: { mealId: null, variantId: null, cookedAt: null, leftoverOfDayId: null },
  });
  await prisma.meal.delete({ where: { id } });

  for (const weekId of weekIds) {
    await rebuildWeek(weekId);
  }

  revalidateApp();
  redirect("/week");
}

async function rebuildWeek(weekId: string) {
  const { rebuildWeek: rebuild } = await import("@/lib/rebuild");
  await rebuild(weekId);
}

export async function completeOnboarding(knownMealIds: string[]) {
  const user = await requireUser();
  const ids = knownMealIds.map((id) => cuid.parse(id));
  if (ids.length) {
    await prisma.meal.updateMany({
      where: { userId: user.id, id: { in: ids } },
      data: { confidence: "KNOW" },
    });
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { onboardedAt: new Date() },
  });
  revalidateApp();
}

export async function skipOnboarding() {
  const user = await requireUser();
  await prisma.user.update({
    where: { id: user.id },
    data: { onboardedAt: new Date() },
  });
  revalidateApp();
}
