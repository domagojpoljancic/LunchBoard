import { redirect } from "next/navigation";
import { CookConfirmSheet } from "@/components/CookConfirmSheet";
import { Onboarding } from "@/components/Onboarding";
import { PoolSweepSheet } from "@/components/PoolSweepSheet";
import { WeekBoard } from "@/components/WeekBoard";
import { WeekModePanel } from "@/components/WeekModePanel";
import { loadBoard } from "@/lib/board-data";
import { prisma } from "@/lib/db";
import {
  listPendingCookDays,
  shouldShowCookPrompt,
  todayInTimezone,
} from "@/lib/pending-cooks";
import { requireUser } from "@/lib/session";
import { normalizeWeekStart, shiftWeek } from "@/lib/weeks";

export default async function WeekPage({
  params,
  searchParams,
}: {
  params: Promise<{ weekStart: string }>;
  searchParams: Promise<{ nudge?: string; login?: string }>;
}) {
  const { weekStart } = await params;
  const { nudge, login } = await searchParams;
  const normalized = normalizeWeekStart(weekStart);
  if (!normalized) redirect("/week");
  if (normalized !== weekStart) redirect(`/week/${normalized}`);

  const user = await requireUser();
  const board = await loadBoard(user.id, normalized);
  const freshUser = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: {
      onboardedAt: true,
      timezone: true,
      lastCookPromptAt: true,
    },
  });

  const today = todayInTimezone(new Date(), freshUser.timezone || "UTC");
  const pendingDays = await prisma.dayPlan.findMany({
    where: {
      week: { userId: user.id },
      date: { lt: today },
      enabled: true,
      cookedAt: null,
      skippedAt: null,
      OR: [{ mealId: { not: null } }, { preparedDishId: { not: null } }],
    },
    include: {
      meal: { select: { name: true } },
      preparedDish: { select: { name: true } },
    },
    orderBy: { date: "asc" },
  });
  const pending = listPendingCookDays(
    pendingDays.map((d) => ({
      id: d.id,
      date: d.date,
      enabled: d.enabled,
      mealId: d.mealId,
      preparedDishId: d.preparedDishId,
      cookedAt: d.cookedAt,
      skippedAt: d.skippedAt,
      leftoverOfDayId: d.leftoverOfDayId,
      mealName: d.meal?.name ?? null,
      preparedName: d.preparedDish?.name ?? null,
    })),
    today,
  );
  const showPrompt = shouldShowCookPrompt({
    pendingCount: pending.length,
    lastPromptAt: freshUser.lastCookPromptAt,
    now: new Date(),
    sessionDismissed: false,
    isFreshLogin: login === "1",
  });

  return (
    <>
      {!freshUser.onboardedAt ? (
        <Onboarding meals={board.meals} />
      ) : null}
      <div className="relative">
        <WeekModePanel
          weekId={board.weekId}
          planningMode={board.planningMode}
          daysView={board.daysView}
          weekendExpanded={board.weekendExpanded}
          poolTarget={board.poolTarget}
          poolEntries={board.poolEntries}
          libraryMeals={board.meals.map((m) => ({ id: m.id, name: m.name }))}
        />
        <WeekBoard
          weekStart={board.weekStart}
          weekId={board.weekId}
          days={board.days}
          meals={board.meals}
          diversityGroup={board.diversityGroup}
          diversityCount={board.diversityCount}
          diversityDismissed={board.diversityDismissed}
          nudgeMealId={nudge ?? null}
          planningMode={board.planningMode}
          daysView={board.daysView}
          poolEntries={board.poolEntries}
          preparedDishes={board.preparedDishes}
        />
      </div>
      <CookConfirmSheet
        pending={pending.map((p) => ({
          id: p.id,
          date: p.date,
          mealName: p.mealName,
          preparedName: p.preparedName,
        }))}
        show={showPrompt}
      />
      {board.planningMode === "POOL" &&
      shiftWeek(board.weekStart, 1) <= today ? (
        <PoolSweepSheet
          weekEnded
          today={today}
          entries={board.poolEntries
            .filter((e) => e.mealName || e.preparedName)
            .map((e) => ({
              id: e.id,
              label: e.preparedName
                ? `Heat ${e.preparedName}`
                : e.mealName ?? "Lunch",
            }))}
        />
      ) : null}
    </>
  );
}
