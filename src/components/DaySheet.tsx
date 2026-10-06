"use client";

import Link from "next/link";
import {
  clearDay,
  placeMealOnDay,
  setDaySides,
  updateDayPrepWindow,
  updateDayServings,
  updateDayVariant,
} from "@/app/actions/week";
import type { DayView } from "@/components/DayColumn";

export type SideOption = {
  id: string;
  name: string;
  selected: boolean;
};

export function DaySheet({
  day,
  sides,
  replacing,
  selectedMealId,
  onClose,
  onStartReplace,
  onCancelReplace,
}: {
  day: DayView;
  sides: SideOption[];
  replacing: boolean;
  selectedMealId: string | null;
  onClose: () => void;
  onStartReplace: () => void;
  onCancelReplace: () => void;
}) {
  if (!day.meal && !replacing) return null;

  return (
    <div className="sheet fixed inset-x-0 bottom-0 z-40 max-h-[85vh] overflow-y-auto p-5 md:absolute md:inset-auto md:right-0 md:top-24 md:bottom-6 md:w-[400px]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className="font-display text-3xl leading-tight">
          {day.meal?.name ?? "Pick a meal"}
        </h2>
        <button type="button" className="btn-text muted" onClick={onClose}>
          Close
        </button>
      </div>

      {replacing ? (
        <div className="space-y-3">
          <p className="text-[var(--muted)]">
            Select a meal in the library, then confirm.
          </p>
          <button
            type="button"
            className="btn-primary w-full"
            disabled={!selectedMealId}
            onClick={async () => {
              if (!selectedMealId) return;
              await placeMealOnDay(day.id, selectedMealId);
              onCancelReplace();
              onClose();
            }}
          >
            Use this meal
          </button>
          <button type="button" className="btn-text" onClick={onCancelReplace}>
            Cancel
          </button>
        </div>
      ) : day.meal ? (
        <div className="space-y-5">
          {day.meal.variants.length > 1 ? (
            <div>
              <div className="section-label mb-2">Protein</div>
              <div className="grid grid-cols-2 overflow-hidden rounded-full border border-[var(--line)]">
                {day.meal.variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    className={`min-h-11 px-2 text-sm font-semibold ${
                      day.meal?.variantId === v.id ? "seg-active" : "seg-idle"
                    }`}
                    onClick={() => updateDayVariant(day.id, v.id)}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <span>Portions</span>
            <div className="flex items-center">
              <button
                type="button"
                className="btn-text h-11 w-11"
                onClick={() =>
                  updateDayServings(day.id, Math.max(1, day.servings - 1))
                }
              >
                −
              </button>
              <span className="font-display text-xl">{day.servings}</span>
              <button
                type="button"
                className="btn-text h-11 w-11"
                onClick={() =>
                  updateDayServings(day.id, Math.min(12, day.servings + 1))
                }
              >
                +
              </button>
            </div>
          </div>

          <div className="grid h-11 grid-cols-2 overflow-hidden rounded-full border border-[var(--line)]">
            {(
              [
                ["EVENING_BEFORE", "Night before"],
                ["SAME_DAY", "At lunch"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`text-sm font-semibold ${
                  day.prepWindow === value ? "seg-active" : "seg-idle"
                }`}
                onClick={() => updateDayPrepWindow(day.id, value)}
              >
                {label}
              </button>
            ))}
          </div>

          <div>
            <div className="section-label mb-2">Sides</div>
            {sides.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                No sides on this meal. You can add some in the editor.
              </p>
            ) : (
              <div className="space-y-1">
                {sides.map((side) => (
                  <label
                    key={side.id}
                    className="flex min-h-11 items-center gap-3"
                  >
                    <input
                      type="checkbox"
                      className="h-[22px] w-[22px]"
                      checked={side.selected}
                      onChange={(e) => {
                        const next = sides
                          .filter((s) =>
                            s.id === side.id ? e.target.checked : s.selected,
                          )
                          .map((s) => s.id);
                        setDaySides(day.id, next);
                      }}
                    />
                    <span>{side.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Link href={`/cook/${day.id}`} className="btn-primary text-center">
              Cook this
            </Link>
            <button type="button" className="btn-outline" onClick={onStartReplace}>
              Replace meal
            </button>
            <button
              type="button"
              className="btn-text"
              onClick={async () => {
                await clearDay(day.id);
                onClose();
              }}
            >
              Clear day
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
