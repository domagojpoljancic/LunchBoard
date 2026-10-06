import { redirect } from "next/navigation";
import { Onboarding } from "@/components/Onboarding";
import { WeekBoard } from "@/components/WeekBoard";
import { loadBoard } from "@/lib/board-data";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { normalizeWeekStart } from "@/lib/weeks";

export default async function WeekPage({
  params,
}: {
  params: Promise<{ weekStart: string }>;
}) {
  const { weekStart } = await params;
  const normalized = normalizeWeekStart(weekStart);
  if (!normalized) redirect("/week");
  if (normalized !== weekStart) redirect(`/week/${normalized}`);

  const user = await requireUser();
  const board = await loadBoard(user.id, normalized);
  const freshUser = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { onboardedAt: true },
  });

  return (
    <>
      {!freshUser.onboardedAt ? (
        <Onboarding meals={board.meals} />
      ) : null}
      <WeekBoard
        weekStart={board.weekStart}
        weekId={board.weekId}
        days={board.days}
        meals={board.meals}
        diversityGroup={board.diversityGroup}
        diversityCount={board.diversityCount}
        diversityDismissed={board.diversityDismissed}
      />
    </>
  );
}
