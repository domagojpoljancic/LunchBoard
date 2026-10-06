import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
// revalidatePath requires a live Next.js request context; actions call it
// after their ownership checks, so stub it out for these unit tests.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { addIngredient } from "@/app/actions/meals";
import { setDaySides, updateDayVariant } from "@/app/actions/week";

type Session = { user: { id: string; email: string } } | null;

function sessionFor(userId: string, email: string): Session {
  return { user: { id: userId, email } };
}

const mockedAuth = vi.mocked(auth);

describe("ownership checks (two users)", () => {
  let ownerId: string;
  let attackerId: string;
  let mealId: string;
  let variantId: string;
  let attackerVariantId: string;
  let sideId: string;
  let attackerSideId: string;
  let dayId: string;

  beforeAll(async () => {
    const owner = await prisma.user.create({
      data: {
        email: `owner-${Date.now()}@test.local`,
        passwordHash: "x",
      },
    });
    const attacker = await prisma.user.create({
      data: {
        email: `attacker-${Date.now()}@test.local`,
        passwordHash: "x",
      },
    });
    ownerId = owner.id;
    attackerId = attacker.id;

    const meal = await prisma.meal.create({
      data: {
        userId: ownerId,
        name: "Owner meal",
        variants: {
          create: [{ label: "Default", proteinGroup: "OTHER", isDefault: true }],
        },
      },
      include: { variants: true },
    });
    mealId = meal.id;
    variantId = meal.variants[0].id;

    const attackerMeal = await prisma.meal.create({
      data: {
        userId: attackerId,
        name: "Attacker meal",
        variants: {
          create: [{ label: "Default", proteinGroup: "OTHER", isDefault: true }],
        },
      },
      include: { variants: true },
    });
    attackerVariantId = attackerMeal.variants[0].id;

    const side = await prisma.side.create({
      data: { userId: ownerId, name: "Owner side" },
    });
    sideId = side.id;

    const attackerSide = await prisma.side.create({
      data: { userId: attackerId, name: "Attacker side" },
    });
    attackerSideId = attackerSide.id;

    const week = await prisma.week.create({
      data: { userId: ownerId, weekStart: "2026-01-05" },
    });
    const day = await prisma.dayPlan.create({
      data: {
        weekId: week.id,
        date: "2026-01-05",
        mealId,
        variantId,
      },
    });
    dayId = day.id;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: ownerId } }).catch(() => {});
    await prisma.user.delete({ where: { id: attackerId } }).catch(() => {});
  });

  it("stops another user from retargeting a day to their own protein variant", async () => {
    mockedAuth.mockResolvedValue(sessionFor(attackerId, "attacker") as never);
    await expect(
      updateDayVariant(dayId, attackerVariantId),
    ).rejects.toThrow();
  });

  it("allows the owner to retarget their own day to a variant on the same meal", async () => {
    const otherVariant = await prisma.proteinVariant.create({
      data: { mealId, label: "Spicy", proteinGroup: "OTHER" },
    });
    mockedAuth.mockResolvedValue(sessionFor(ownerId, "owner") as never);
    await expect(
      updateDayVariant(dayId, otherVariant.id),
    ).resolves.not.toThrow();
  });

  it("stops another user from assigning their own sides to someone else's day", async () => {
    mockedAuth.mockResolvedValue(sessionFor(attackerId, "attacker") as never);
    await expect(setDaySides(dayId, [attackerSideId])).rejects.toThrow();
  });

  it("allows the owner to assign their own sides to their own day", async () => {
    mockedAuth.mockResolvedValue(sessionFor(ownerId, "owner") as never);
    await expect(setDaySides(dayId, [sideId])).resolves.not.toThrow();
  });

  it("stops another user from adding an ingredient to someone else's meal", async () => {
    mockedAuth.mockResolvedValue(sessionFor(attackerId, "attacker") as never);
    await expect(
      addIngredient({ mealId, name: "sneaky", role: "BUY" }),
    ).rejects.toThrow();
  });

  it("stops another user from adding an ingredient to someone else's side", async () => {
    mockedAuth.mockResolvedValue(sessionFor(attackerId, "attacker") as never);
    await expect(
      addIngredient({ sideId, name: "sneaky", role: "BUY" }),
    ).rejects.toThrow();
  });

  it("stops a variantId that belongs to a different meal, even one the user owns", async () => {
    mockedAuth.mockResolvedValue(sessionFor(ownerId, "owner") as never);
    await expect(
      addIngredient({
        mealId,
        name: "mismatched variant",
        role: "BUY",
        variantId: attackerVariantId,
      }),
    ).rejects.toThrow();
  });

  it("allows the owner to add an ingredient to their own meal", async () => {
    mockedAuth.mockResolvedValue(sessionFor(ownerId, "owner") as never);
    await expect(
      addIngredient({ mealId, name: "owner ingredient", role: "BUY" }),
    ).resolves.not.toThrow();
  });
});
