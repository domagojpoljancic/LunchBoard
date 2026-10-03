import { PrismaClient } from "@prisma/client";
import { ensureWeek } from "../src/lib/week-service";
import { rebuildWeek } from "../src/lib/rebuild";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: "cook@lunchboard.local" },
  });
  const week = await ensureWeek(user.id, "2026-10-05");
  const meal = await prisma.meal.findFirstOrThrow({
    where: { userId: user.id, catalogKey: "bolognese" },
    include: { variants: true, mealSides: true },
  });
  const beef = meal.variants.find((v) => v.proteinGroup === "BEEF");
  const vegan = meal.variants.find((v) => v.proteinGroup === "VEGAN");
  const pasta = meal.mealSides.find((s) => s.defaultSelected);
  if (!beef || !vegan || !pasta) throw new Error("seed incomplete");
  const monday = week.days.find((d) => d.date === "2026-10-05");
  if (!monday) throw new Error("no monday");

  await prisma.dayPlanSide.deleteMany({ where: { dayPlanId: monday.id } });
  await prisma.dayPlan.update({
    where: { id: monday.id },
    data: {
      mealId: meal.id,
      variantId: beef.id,
      servings: 6,
      enabled: true,
      sides: { create: [{ sideId: pasta.sideId }] },
    },
  });
  await rebuildWeek(week.id);

  let items = await prisma.shoppingItem.findMany({ where: { weekId: week.id } });
  const beefLine = items.find((i) => i.nameKey === "beef mince");
  console.log("beef at 6 portions", beefLine?.quantity);

  await prisma.dayPlan.update({
    where: { id: monday.id },
    data: { variantId: vegan.id },
  });
  await rebuildWeek(week.id);
  items = await prisma.shoppingItem.findMany({ where: { weekId: week.id } });
  console.log(
    "after vegan",
    items.find((i) => i.nameKey === "beef mince")?.quantity ?? "gone",
    items.find((i) => i.nameKey === "vegan mince")?.quantity,
  );

  await prisma.meal.update({
    where: { id: meal.id },
    data: { confidence: "KNOW" },
  });
  console.log("ok");
}

main().finally(() => prisma.$disconnect());
