import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { auth } from "@/auth";
import {
  logCook,
  skipCookAction,
  undoCook,
} from "@/app/actions/cook";
import { confirmCook, skipCook } from "@/lib/cook-confirm";
import { prisma } from "@/lib/db";
import { nameKey } from "@/lib/name-key";

const mockedAuth = vi.mocked(auth);

describe("confirmCook inventory pipeline", () => {
  let userId: string;
  let mealId: string;
  let dayId: string;
  let pastaId: string;
  let minceId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `confirm-${Date.now()}@test.local`,
        passwordHash: "x",
      },
    });
    userId = user.id;
    mockedAuth.mockResolvedValue({
      user: { id: userId, email: user.email },
    } as never);

    const meal = await prisma.meal.create({
      data: {
        userId,
        name: "Test Bolognese",
        baseServings: 3,
        ingredients: {
          create: [
            {
              name: "pasta",
              quantity: 450,
              unit: "G",
              role: "BUY",
              sortOrder: 0,
            },
            {
              name: "beef mince",
              quantity: 450,
              unit: "G",
              role: "BUY",
              sortOrder: 1,
            },
            {
              name: "salt",
              quantity: null,
              unit: null,
              role: "PANTRY",
              sortOrder: 2,
            },
          ],
        },
        variants: {
          create: {
            label: "Beef",
            proteinGroup: "BEEF",
            isDefault: true,
          },
        },
      },
    });
    mealId = meal.id;

    const pasta = await prisma.inventoryItem.create({
      data: {
        userId,
        name: "pasta",
        nameKey: nameKey("pasta"),
        location: "PANTRY",
        quantity: 800,
        unit: "G",
      },
    });
    pastaId = pasta.id;

    const mince = await prisma.inventoryItem.create({
      data: {
        userId,
        name: "beef mince",
        nameKey: nameKey("beef mince"),
        location: "FREEZER",
        quantity: 200,
        unit: "G",
      },
    });
    minceId = mince.id;

    const week = await prisma.week.create({
      data: { userId, weekStart: "2026-03-02" },
    });
    const day = await prisma.dayPlan.create({
      data: {
        weekId: week.id,
        date: "2026-03-02",
        mealId,
        servings: 3,
      },
    });
    dayId = day.id;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  });

  it("decrements inventory once; double confirm is idempotent", async () => {
    await logCook(dayId);
    await logCook(dayId);

    const pasta = await prisma.inventoryItem.findUniqueOrThrow({
      where: { id: pastaId },
    });
    const mince = await prisma.inventoryItem.findUniqueOrThrow({
      where: { id: minceId },
    });
    const meal = await prisma.meal.findUniqueOrThrow({ where: { id: mealId } });

    expect(pasta.quantity).toBe(350);
    expect(mince.quantity).toBe(0);
    expect(meal.cookCount).toBe(1);

    const muts = await prisma.inventoryMutation.findMany({
      where: { userId, reason: "COOK_DECREMENT", reversedAt: null },
    });
    expect(muts.length).toBeGreaterThanOrEqual(2);
  });

  it("undo restores inventory within the window", async () => {
    await undoCook(dayId);

    const pasta = await prisma.inventoryItem.findUniqueOrThrow({
      where: { id: pastaId },
    });
    const mince = await prisma.inventoryItem.findUniqueOrThrow({
      where: { id: minceId },
    });
    const meal = await prisma.meal.findUniqueOrThrow({ where: { id: mealId } });
    const day = await prisma.dayPlan.findUniqueOrThrow({ where: { id: dayId } });

    expect(pasta.quantity).toBe(800);
    expect(mince.quantity).toBe(200);
    expect(meal.cookCount).toBe(0);
    expect(day.cookedAt).toBeNull();
  });
});

describe("heat plan confirm", () => {
  let userId: string;
  let dayId: string;
  let dishId: string;
  let mealId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `heat-${Date.now()}@test.local`,
        passwordHash: "x",
      },
    });
    userId = user.id;
    mockedAuth.mockResolvedValue({
      user: { id: userId, email: user.email },
    } as never);

    const meal = await prisma.meal.create({
      data: { userId, name: "Linked chili" },
    });
    mealId = meal.id;

    const dish = await prisma.preparedDish.create({
      data: {
        userId,
        name: "Batch chili",
        nameKey: "batch chili",
        portionsRemaining: 4,
        location: "FREEZER",
        linkedMealId: mealId,
      },
    });
    dishId = dish.id;

    const week = await prisma.week.create({
      data: { userId, weekStart: "2026-03-09" },
    });
    const day = await prisma.dayPlan.create({
      data: {
        weekId: week.id,
        date: "2026-03-09",
        cookKind: "HEAT_PREPARED",
        preparedDishId: dishId,
        mealId,
        servings: 1,
      },
    });
    dayId = day.id;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  });

  it("decrements portions once and increments cookCount when linked", async () => {
    await logCook(dayId);
    await logCook(dayId);

    const dish = await prisma.preparedDish.findUniqueOrThrow({
      where: { id: dishId },
    });
    const meal = await prisma.meal.findUniqueOrThrow({ where: { id: mealId } });
    expect(dish.portionsRemaining).toBe(3);
    expect(meal.cookCount).toBe(1);

    const invMuts = await prisma.inventoryMutation.findMany({
      where: { userId, reason: "COOK_DECREMENT" },
    });
    expect(invMuts).toHaveLength(0);
  });
});

describe("leftover confirm does not double-decrement inventory", () => {
  let userId: string;
  let mealId: string;
  let leftoverDayId: string;
  let pastaId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `leftover-${Date.now()}@test.local`,
        passwordHash: "x",
      },
    });
    userId = user.id;
    mockedAuth.mockResolvedValue({
      user: { id: userId, email: user.email },
    } as never);

    const meal = await prisma.meal.create({
      data: {
        userId,
        name: "Leftover source chili",
        baseServings: 3,
        ingredients: {
          create: [
            {
              name: "pasta",
              quantity: 450,
              unit: "G",
              role: "BUY",
              sortOrder: 0,
            },
          ],
        },
      },
    });
    mealId = meal.id;

    const pasta = await prisma.inventoryItem.create({
      data: {
        userId,
        name: "pasta",
        nameKey: nameKey("pasta"),
        location: "PANTRY",
        quantity: 900,
        unit: "G",
      },
    });
    pastaId = pasta.id;

    const week = await prisma.week.create({
      data: { userId, weekStart: "2026-03-16" },
    });
    const source = await prisma.dayPlan.create({
      data: {
        weekId: week.id,
        date: "2026-03-16",
        mealId,
        servings: 3,
      },
    });
    const leftover = await prisma.dayPlan.create({
      data: {
        weekId: week.id,
        date: "2026-03-17",
        mealId,
        servings: 3,
        cookKind: "LEFTOVER",
        leftoverOfDayId: source.id,
      },
    });
    leftoverDayId = leftover.id;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  });

  it("confirms leftover without touching inventory or cookCount", async () => {
    const first = await confirmCook(userId, {
      kind: "day",
      dayPlanId: leftoverDayId,
    });
    const second = await confirmCook(userId, {
      kind: "day",
      dayPlanId: leftoverDayId,
    });

    expect(first.status).toBe("COOKED");
    expect(second.status).toBe("ALREADY");

    const pasta = await prisma.inventoryItem.findUniqueOrThrow({
      where: { id: pastaId },
    });
    const meal = await prisma.meal.findUniqueOrThrow({ where: { id: mealId } });
    const muts = await prisma.inventoryMutation.findMany({
      where: { userId, reason: "COOK_DECREMENT" },
    });

    expect(pasta.quantity).toBe(900);
    expect(meal.cookCount).toBe(0);
    expect(muts).toHaveLength(0);
  });
});

describe("skip cook paths", () => {
  let userId: string;
  let dayId: string;
  let mealId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `skip-${Date.now()}@test.local`,
        passwordHash: "x",
      },
    });
    userId = user.id;
    mockedAuth.mockResolvedValue({
      user: { id: userId, email: user.email },
    } as never);

    const meal = await prisma.meal.create({
      data: { userId, name: "Skip meal" },
    });
    mealId = meal.id;

    const week = await prisma.week.create({
      data: { userId, weekStart: "2026-03-23" },
    });
    const day = await prisma.dayPlan.create({
      data: {
        weekId: week.id,
        date: "2026-03-23",
        mealId,
        servings: 3,
      },
    });
    dayId = day.id;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  });

  it("skip marks skipped and is idempotent; does not bump cookCount", async () => {
    const first = await skipCookAction(dayId);
    const second = await skipCook(userId, { kind: "day", dayPlanId: dayId });

    expect(first.status).toBe("SKIPPED");
    expect(second.status).toBe("ALREADY");

    const day = await prisma.dayPlan.findUniqueOrThrow({ where: { id: dayId } });
    const meal = await prisma.meal.findUniqueOrThrow({ where: { id: mealId } });
    const confirmation = await prisma.cookConfirmation.findUnique({
      where: { dayPlanId: dayId },
    });

    expect(day.skippedAt).not.toBeNull();
    expect(day.cookedAt).toBeNull();
    expect(meal.cookCount).toBe(0);
    expect(confirmation?.status).toBe("SKIPPED");
  });
});
