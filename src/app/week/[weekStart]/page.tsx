import { WeekBoard } from "@/components/WeekBoard";
import { loadBoard } from "@/lib/board-data";
import { requireUser } from "@/lib/session";

export default async function WeekPage({
  params,
}: {
  params: Promise<{ weekStart: string }>;
}) {
  const { weekStart } = await params;
  const user = await requireUser();
  const board = await loadBoard(user.id, weekStart);

  return (
    <WeekBoard
      weekStart={board.weekStart}
      weekId={board.weekId}
      days={board.days}
      meals={board.meals}
      diversityGroup={board.diversityGroup}
      diversityCount={board.diversityCount}
      diversityDismissed={board.diversityDismissed}
    />
  );
}
