import Link from "next/link";
import { BowlMark } from "@/components/BowlMark";
import { formatWeekRange, shiftWeek } from "@/lib/weeks";

export function TopBar({
  weekStart,
  right,
  mobileExtras,
}: {
  weekStart: string;
  right?: React.ReactNode;
  /** Shown in row 1 on small screens (Meals / Lists). */
  mobileExtras?: React.ReactNode;
}) {
  const prev = shiftWeek(weekStart, -1);
  const next = shiftWeek(weekStart, 1);
  const range = formatWeekRange(weekStart);

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--card)] px-3 md:px-6">
      <div className="flex h-14 items-center justify-between gap-2 md:h-[72px] md:gap-4">
        <Link
          href={`/week/${weekStart}`}
          className="flex min-w-0 items-center gap-2"
        >
          <BowlMark />
          <span className="font-display text-lg tracking-tight md:text-xl">
            LunchBoard
          </span>
        </Link>

        <div className="hidden items-center gap-2 md:flex md:gap-4">
          <Link href={`/week/${prev}`} className="btn-text muted">
            Previous
          </Link>
          <span className="font-display whitespace-nowrap text-lg md:text-[22px]">
            {range}
          </span>
          <Link href={`/week/${next}`} className="btn-text muted">
            Next
          </Link>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <div className="flex items-center gap-1 md:hidden">{mobileExtras}</div>
          <div className="hidden items-center gap-2 md:flex">{right}</div>
          <div className="flex items-center gap-1 md:hidden">
            {right}
          </div>
        </div>
      </div>

      <div className="flex h-12 items-center justify-between gap-2 pb-2 md:hidden">
        <Link href={`/week/${prev}`} className="btn-text muted px-2 text-sm">
          Previous
        </Link>
        <span className="font-display whitespace-nowrap text-base">{range}</span>
        <Link href={`/week/${next}`} className="btn-text muted px-2 text-sm">
          Next
        </Link>
      </div>
    </header>
  );
}
