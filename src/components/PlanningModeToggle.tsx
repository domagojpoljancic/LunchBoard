"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setWeekPlanningSettings } from "@/app/actions/week";

/**
 * Primary control: plan by weekday columns, or pick meals for the week
 * without assigning days.
 */
export function PlanningModeToggle({
  weekId,
  planningMode,
}: {
  weekId: string;
  planningMode: string;
}) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const byDay = planningMode !== "POOL";

  return (
    <div
      className="inline-grid grid-cols-2 overflow-hidden rounded-full border border-[var(--line)]"
      role="group"
      aria-label="How you plan this week"
    >
      <button
        type="button"
        disabled={busy}
        aria-pressed={byDay}
        className={`min-h-11 px-3 text-sm font-semibold sm:px-4 ${
          byDay ? "seg-active" : "seg-idle"
        }`}
        onClick={() => {
          if (byDay) return;
          start(async () => {
            await setWeekPlanningSettings({
              weekId,
              planningMode: "BY_DAY",
              daysView: true,
            });
            router.refresh();
          });
        }}
      >
        By day
      </button>
      <button
        type="button"
        disabled={busy}
        aria-pressed={!byDay}
        className={`min-h-11 px-3 text-sm font-semibold sm:px-4 ${
          !byDay ? "seg-active" : "seg-idle"
        }`}
        onClick={() => {
          if (!byDay) return;
          start(async () => {
            await setWeekPlanningSettings({
              weekId,
              planningMode: "POOL",
              daysView: false,
            });
            router.refresh();
          });
        }}
      >
        Week’s meals
      </button>
    </div>
  );
}
