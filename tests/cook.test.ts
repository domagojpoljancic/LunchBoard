import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { logCook, undoCook } from "@/app/actions/cook";

const mockedAuth = vi.mocked(auth);

describe("cook logging", () => {
  let userId: string;
  let mealId: string;
  let dayId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: { email: `cook-${Date.now()}@test.local`, passwordHash: "x" },
    });
    userId = user.id;

    const meal = await prisma.meal.create({
      data: { userId, name: "Cook test meal" },
    });
    mealId = meal.id;

    const week = await prisma.week.create({
      data: { userId, weekStart: "2026-02-02" },
    });
    const day = await prisma.dayPlan.create({
      data: { weekId: week.id, date: "2026-02-02", mealId },
    });
    dayId = day.id;

    mockedAuth.mockResolvedValue({
      user: { id: userId, email: user.email },
    } as never);
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  });

  it("three logCook calls on one day count as one", async () => {
    await logCook(dayId);
    await logCook(dayId);
    await logCook(dayId);

    const meal = await prisma.meal.findUniqueOrThrow({ where: { id: mealId } });
    expect(meal.cookCount).toBe(1);

    const day = await prisma.dayPlan.findUniqueOrThrow({ where: { id: dayId } });
    expect(day.cookedAt).not.toBeNull();
  });

  it("undoCook clears cookedAt and decrements the count", async () => {
    await undoCook(dayId);

    const meal = await prisma.meal.findUniqueOrThrow({ where: { id: mealId } });
    expect(meal.cookCount).toBe(0);

    const day = await prisma.dayPlan.findUniqueOrThrow({ where: { id: dayId } });
    expect(day.cookedAt).toBeNull();
  });

  it("undoCook on an already-uncooked day is a no-op and never goes negative", async () => {
    await undoCook(dayId);
    const meal = await prisma.meal.findUniqueOrThrow({ where: { id: mealId } });
    expect(meal.cookCount).toBe(0);
  });

  it("logging cook again after undo increments once more", async () => {
    await logCook(dayId);
    const meal = await prisma.meal.findUniqueOrThrow({ where: { id: mealId } });
    expect(meal.cookCount).toBe(1);
  });
});
