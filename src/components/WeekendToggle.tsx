"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setWeekPlanningSettings } from "@/app/actions/week";

export function WeekendToggle({
  weekId,
  weekendExpanded,
}: {
  weekId: string;
  weekendExpanded: boolean;
}) {
  const router = useRouter();
  const [busy, start] = useTransition();

  return (
    <label className="flex min-h-11 items-center gap-2 text-sm">
      <input
        type="checkbox"
        className="h-[22px] w-[22px]"
        checked={weekendExpanded}
        disabled={busy}
        onChange={(e) =>
          start(async () => {
            await setWeekPlanningSettings({
              weekId,
              weekendExpanded: e.target.checked,
            });
            router.refresh();
          })
        }
      />
      <span>Show weekend</span>
    </label>
  );
}
