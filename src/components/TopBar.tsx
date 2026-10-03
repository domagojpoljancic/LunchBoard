import Link from "next/link";
import { BowlMark } from "@/components/BowlMark";
import { formatWeekRange, shiftWeek } from "@/lib/weeks";

export function TopBar({
  weekStart,
  right,
}: {
  weekStart: string;
  right?: React.ReactNode;
}) {
  const prev = shiftWeek(weekStart, -1);
  const next = shiftWeek(weekStart, 1);

  return (
    <header
      className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-4 border-b border-[var(--line)] bg-[var(--card)] px-4 md:px-6"
    >
      <Link href={`/week/${weekStart}`} className="flex items-center gap-2">
        <BowlMark />
        <span className="font-display text-xl tracking-tight">LunchBoard</span>
      </Link>

      <div className="flex items-center gap-2 md:gap-4">
        <Link href={`/week/${prev}`} className="btn-text muted">
          Previous
        </Link>
        <span className="font-display text-lg md:text-[22px]">
          {formatWeekRange(weekStart)}
        </span>
        <Link href={`/week/${next}`} className="btn-text muted">
          Next
        </Link>
      </div>

      <div className="flex items-center gap-2">{right}</div>
    </header>
  );
}
