import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { rebuildWeek } from "@/lib/rebuild";
import { mondayOf, weekDates } from "@/lib/weeks";

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
  if (dates.length !== 7) {
    throw new Error("Week start must be a YYYY-MM-DD date");
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      defaultPlanningMode: true,
      defaultDaysView: true,
      defaultWeekendExpanded: true,
      defaultPoolTarget: true,
    },
  });

  const weekendExpanded = user.defaultWeekendExpanded;
  let week;
  try {
    week = await prisma.week.create({
      data: {
        userId,
        weekStart,
        planningMode: user.defaultPlanningMode || "BY_DAY",
        daysView: user.defaultDaysView ?? true,
        weekendExpanded,
        poolTarget: user.defaultPoolTarget ?? 5,
        days: {
          create: dates.map((date, index) => ({
            date,
            enabled: weekendExpanded ? true : index < 5,
            servings: 3,
            prepWindow: "EVENING_BEFORE",
          })),
        },
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return prisma.week.findUniqueOrThrow({
        where: { userId_weekStart: { userId, weekStart } },
        include: {
          days: { orderBy: { date: "asc" } },
          shoppingItems: { orderBy: { sortOrder: "asc" } },
          pantryItems: true,
        },
      });
    }
    throw error;
  }

  // Live carry-over is applied inside rebuildWeek from the previous week.
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
