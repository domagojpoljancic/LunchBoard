import { prisma } from "@/lib/db";
import { nameKey } from "@/lib/name-key";
import { rebuildWeek } from "@/lib/rebuild";
import { mondayOf, shiftWeek, weekDates } from "@/lib/weeks";

export async function ensureWeek(userId: string, weekStart: string) {
  const existing = await prisma.week.findUnique({
    where: { userId_weekStart: { userId, weekStart } },
    include: {
      days: { orderBy: { date: "asc" } },
      shoppingItems: { orderBy: { sortOrder: "asc" } },
      pantryItems: true,
    },
  });
  if (existing) return existing;

  const dates = weekDates(weekStart);
  const week = await prisma.week.create({
    data: {
      userId,
      weekStart,
      days: {
        create: dates.map((date, index) => ({
          date,
          enabled: index < 5,
          servings: 3,
          prepWindow: "EVENING_BEFORE",
        })),
      },
    },
  });

  const prevStart = shiftWeek(weekStart, -1);
  const prev = await prisma.week.findUnique({
    where: { userId_weekStart: { userId, weekStart: prevStart } },
    include: { shoppingItems: true },
  });

  if (prev) {
    const carried = prev.shoppingItems.filter((i) => !i.checked);
    if (carried.length) {
      await prisma.shoppingItem.createMany({
        data: carried.map((item, sortOrder) => ({
          weekId: week.id,
          name: item.name,
          nameKey: item.nameKey || nameKey(item.name),
          quantity: item.quantity,
          unit: item.unit,
          checked: false,
          origin: "CARRIED",
          sortOrder,
        })),
      });
    }
  }

  await rebuildWeek(week.id);

  return prisma.week.findUniqueOrThrow({
    where: { id: week.id },
    include: {
      days: { orderBy: { date: "asc" } },
      shoppingItems: { orderBy: { sortOrder: "asc" } },
      pantryItems: true,
    },
  });
}

export async function ensureCurrentWeek(userId: string, timeZone: string) {
  const weekStart = mondayOf(new Date(), timeZone || "UTC");
  return ensureWeek(userId, weekStart);
}
