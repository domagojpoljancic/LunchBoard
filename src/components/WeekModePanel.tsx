"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  addMealToPool,
  fillPoolSlots,
  removePoolEntry,
  setWeekPlanningSettings,
} from "@/app/actions/week";

export type PoolEntryView = {
  id: string;
  mealId: string | null;
  mealName: string | null;
  preparedName: string | null;
  servings: number;
  pinnedDayPlanId: string | null;
};

export function WeekModePanel({
  weekId,
  planningMode,
  daysView,
  weekendExpanded,
  poolTarget,
  poolEntries,
  libraryMeals,
}: {
  weekId: string;
  planningMode: string;
  daysView: boolean;
  weekendExpanded: boolean;
  poolTarget: number;
  poolEntries: PoolEntryView[];
  libraryMeals: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, start] = useTransition();
  const [useAsDefault, setUseAsDefault] = useState(false);
  const [addMealId, setAddMealId] = useState("");

  if (!open) {
    return (
      <button
        type="button"
        className="btn-text muted px-2 text-sm"
        onClick={() => setOpen(true)}
      >
        Week settings
      </button>
    );
  }

  return (
    <div className="sheet absolute right-3 top-16 z-40 w-[min(100vw-1.5rem,22rem)] space-y-4 p-4 shadow-[var(--shadow)] md:right-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-xl">This week</h2>
        <button type="button" className="btn-text" onClick={() => setOpen(false)}>
          Close
        </button>
      </div>

      <label className="block space-y-1">
        <span className="section-label">Planning</span>
        <select
          className="field"
          value={planningMode}
          disabled={busy}
          onChange={(e) =>
            start(async () => {
              await setWeekPlanningSettings({
                weekId,
                planningMode: e.target.value as "BY_DAY" | "POOL",
                useAsDefault,
              });
              router.refresh();
            })
          }
        >
          <option value="BY_DAY">Day by day</option>
          <option value="POOL">Lunch pool</option>
        </select>
      </label>

      <label className="flex min-h-11 items-center gap-3">
        <input
          type="checkbox"
          className="h-[22px] w-[22px]"
          checked={daysView}
          disabled={busy}
          onChange={(e) =>
            start(async () => {
              await setWeekPlanningSettings({
                weekId,
                daysView: e.target.checked,
                useAsDefault,
              });
              router.refresh();
            })
          }
        />
        <span>Show days of the week</span>
      </label>

      <label className="flex min-h-11 items-center gap-3">
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
                useAsDefault,
              });
              router.refresh();
            })
          }
        />
        <span>Show weekend days</span>
      </label>

      {planningMode === "POOL" ? (
        <label className="block space-y-1">
          <span className="section-label">Pool size</span>
          <input
            className="field"
            type="number"
            min={3}
            max={7}
            defaultValue={poolTarget}
            disabled={busy}
            onBlur={(e) =>
              start(async () => {
                await setWeekPlanningSettings({
                  weekId,
                  poolTarget: Number(e.target.value),
                  useAsDefault,
                });
                router.refresh();
              })
            }
          />
        </label>
      ) : null}

      <label className="flex min-h-11 items-center gap-3">
        <input
          type="checkbox"
          className="h-[22px] w-[22px]"
          checked={useAsDefault}
          onChange={(e) => setUseAsDefault(e.target.checked)}
        />
        <span>Use as default for new weeks</span>
      </label>

      {planningMode === "POOL" ? (
        <div className="space-y-3 border-t border-[var(--line)] pt-3">
          <h3 className="font-display text-lg">
            Pool ({poolEntries.length}/{poolTarget})
          </h3>
          <ul className="space-y-2">
            {poolEntries.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span>
                  {entry.preparedName
                    ? `Heat: ${entry.preparedName}`
                    : entry.mealName ?? "Empty"}
                  {entry.pinnedDayPlanId ? " · pinned" : ""}
                </span>
                <button
                  type="button"
                  className="btn-text text-[var(--warning)]"
                  onClick={() =>
                    start(async () => {
                      await removePoolEntry(entry.id);
                      router.refresh();
                    })
                  }
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <select
              className="field"
              value={addMealId}
              onChange={(e) => setAddMealId(e.target.value)}
            >
              <option value="">Add a meal…</option>
              {libraryMeals
                .filter((m) => !poolEntries.some((e) => e.mealId === m.id))
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </select>
            <button
              type="button"
              className="btn-outline shrink-0"
              disabled={!addMealId || busy}
              onClick={() =>
                start(async () => {
                  await addMealToPool({ weekId, mealId: addMealId });
                  setAddMealId("");
                  router.refresh();
                })
              }
            >
              Add
            </button>
          </div>
          <button
            type="button"
            className="btn-primary w-full"
            disabled={busy || poolEntries.length >= poolTarget}
            onClick={() =>
              start(async () => {
                await fillPoolSlots(weekId);
                router.refresh();
              })
            }
          >
            Fill pool
          </button>
        </div>
      ) : null}
    </div>
  );
}
