"use server";

import { prisma } from "@/lib/db";
import { nameKey } from "@/lib/name-key";
import {
  applyPortionDecrement,
  canUndoArchive,
  prepareDishNameKey,
} from "@/lib/prepared";
import { rebuildWeek } from "@/lib/rebuild";
import { revalidateApp } from "@/lib/revalidate-app";
import { requireUser } from "@/lib/session";
import { z } from "zod";

const locationSchema = z.enum(["PANTRY", "FREEZER", "FRIDGE"]);

const upsertSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().trim().min(1).max(80),
  portionsRemaining: z.number().int().min(0).max(99),
  location: locationSchema,
  linkedMealId: z.string().cuid().nullable().optional(),
  madeOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  eatBy: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  notes: z.string().max(200).nullable().optional(),
});

export async function upsertPreparedDish(input: z.infer<typeof upsertSchema>) {
  const parsed = upsertSchema.parse(input);
  const user = await requireUser();
  const key = prepareDishNameKey(parsed.name);

  if (parsed.linkedMealId) {
    const meal = await prisma.meal.findFirst({
      where: { id: parsed.linkedMealId, userId: user.id },
    });
    if (!meal) throw new Error("Meal not found");
  }

  if (parsed.id) {
    const existing = await prisma.preparedDish.findFirst({
      where: { id: parsed.id, userId: user.id },
    });
    if (!existing) throw new Error("Not found");
    const archivedAt =
      parsed.portionsRemaining <= 0 ? existing.archivedAt ?? new Date() : null;
    const updated = await prisma.preparedDish.update({
      where: { id: existing.id },
      data: {
        name: parsed.name,
        nameKey: key,
        portionsRemaining: parsed.portionsRemaining,
        location: parsed.location,
        linkedMealId: parsed.linkedMealId ?? null,
        madeOn: parsed.madeOn ?? null,
        eatBy: parsed.eatBy ?? null,
        notes: parsed.notes ?? null,
        archivedAt,
      },
    });
    revalidateApp();
    return updated;
  }

  const created = await prisma.preparedDish.create({
    data: {
      userId: user.id,
      name: parsed.name,
      nameKey: key,
      portionsRemaining: parsed.portionsRemaining,
      location: parsed.location,
      linkedMealId: parsed.linkedMealId ?? null,
      madeOn: parsed.madeOn ?? null,
      eatBy: parsed.eatBy ?? null,
      notes: parsed.notes ?? null,
      archivedAt: parsed.portionsRemaining <= 0 ? new Date() : null,
    },
  });
  revalidateApp();
  return created;
}

export async function deletePreparedDish(id: string) {
  const parsed = z.object({ id: z.string().cuid() }).parse({ id });
  const user = await requireUser();
  const dish = await prisma.preparedDish.findFirst({
    where: { id: parsed.id, userId: user.id },
  });
  if (!dish) throw new Error("Not found");
  await prisma.preparedDish.delete({ where: { id: dish.id } });
  revalidateApp();
}

export async function decrementPreparedPortion(id: string, amount = 1) {
  const parsed = z
    .object({ id: z.string().cuid(), amount: z.number().int().min(1).max(12) })
    .parse({ id, amount });
  const user = await requireUser();
  const dish = await prisma.preparedDish.findFirst({
    where: { id: parsed.id, userId: user.id },
  });
  if (!dish) throw new Error("Not found");
  const { next, burned, archive } = applyPortionDecrement(
    dish.portionsRemaining,
    parsed.amount,
  );
  await prisma.preparedDish.update({
    where: { id: dish.id },
    data: {
      portionsRemaining: next,
      archivedAt: archive ? new Date() : dish.archivedAt,
    },
  });
  if (burned > 0) {
    await prisma.preparedMutation.create({
      data: {
        preparedDishId: dish.id,
        delta: -burned,
        reason: "MANUAL",
      },
    });
  }
  revalidateApp();
}

export async function undoArchivePreparedDish(id: string) {
  const parsed = z.object({ id: z.string().cuid() }).parse({ id });
  const user = await requireUser();
  const dish = await prisma.preparedDish.findFirst({
    where: { id: parsed.id, userId: user.id },
  });
  if (!dish?.archivedAt) return;
  if (!canUndoArchive(dish.archivedAt, new Date())) {
    throw new Error("Archive undo window closed");
  }
  await prisma.preparedDish.update({
    where: { id: dish.id },
    data: {
      archivedAt: null,
      portionsRemaining: Math.max(1, dish.portionsRemaining),
    },
  });
  revalidateApp();
}

const placeHeatSchema = z.object({
  dayId: z.string().cuid(),
  preparedDishId: z.string().cuid(),
});

export async function placeHeatPlan(input: z.infer<typeof placeHeatSchema>) {
  const parsed = placeHeatSchema.parse(input);
  const user = await requireUser();
  const day = await prisma.dayPlan.findFirst({
    where: { id: parsed.dayId, week: { userId: user.id } },
    include: { week: true },
  });
  if (!day) throw new Error("Day not found");
  const dish = await prisma.preparedDish.findFirst({
    where: {
      id: parsed.preparedDishId,
      userId: user.id,
      archivedAt: null,
    },
  });
  if (!dish) throw new Error("Prepared dish not found");

  await prisma.dayPlan.update({
    where: { id: day.id },
    data: {
      mealId: dish.linkedMealId,
      variantId: null,
      preparedDishId: dish.id,
      cookKind: "HEAT_PREPARED",
      servings: 1,
      leftoverOfDayId: null,
      cookedAt: null,
      skippedAt: null,
      fillReason: null,
    },
  });
  await prisma.dayPlanSide.deleteMany({ where: { dayPlanId: day.id } });
  await rebuildWeek(day.weekId);
  revalidateApp();
}

export async function listPreparedNameSuggestions(query: string) {
  const user = await requireUser();
  const q = nameKey(query);
  if (!q) return [];
  const rows = await prisma.preparedDish.findMany({
    where: { userId: user.id, nameKey: { contains: q } },
    select: { name: true },
    distinct: ["name"],
    take: 8,
    orderBy: { updatedAt: "desc" },
  });
  return rows.map((r) => r.name);
}
