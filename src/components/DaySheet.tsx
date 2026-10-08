"use client";

import Link from "next/link";
import { placeHeatPlan } from "@/app/actions/prepared";
import {
  clearDay,
  placeMealOnDay,
  setDaySides,
  setLeftoverDay,
  updateDayPrepWindow,
  updateDayServings,
  updateDayVariant,
} from "@/app/actions/week";
import type { DayView } from "@/components/DayColumn";
import { useActionBusy } from "@/lib/use-action-busy";

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
  leftoverSources,
  preparedDishes,
  onClose,
  onStartReplace,
  onCancelReplace,
}: {
  day: DayView;
  sides: SideOption[];
  replacing: boolean;
  selectedMealId: string | null;
  leftoverSources?: Array<{ id: string; label: string }>;
  preparedDishes?: Array<{ id: string; name: string; portionsRemaining: number }>;
  onClose: () => void;
  onStartReplace: () => void;
  onCancelReplace: () => void;
}) {
  const { pending, run } = useActionBusy();

  if (
    !day.meal &&
    !day.preparedDishId &&
    !replacing &&
    !(leftoverSources && leftoverSources.length) &&
    !(preparedDishes && preparedDishes.length)
  ) {
    return null;
  }

  return (
    <div className="sheet fixed inset-x-0 bottom-0 z-40 max-h-[85vh] overflow-y-auto p-5 md:static md:z-auto md:h-full md:max-h-none md:w-[320px] md:shrink-0 md:overflow-y-auto">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className="font-display text-3xl leading-tight">
          {day.preparedDishName ?? day.meal?.name ?? "Pick a meal"}
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
            disabled={!selectedMealId || pending}
            onClick={() => {
              if (!selectedMealId) return;
              run(async () => {
                await placeMealOnDay(day.id, selectedMealId);
                onCancelReplace();
                onClose();
              });
            }}
          >
            Use this meal
          </button>
          <button type="button" className="btn-text" onClick={onCancelReplace}>
            Cancel
          </button>
        </div>
      ) : day.meal || day.preparedDishId ? (
        <div className="space-y-5">
          {day.preparedDishId ? (
            <p className="text-[var(--muted)]">Ready to heat · {day.servings} portion{day.servings === 1 ? "" : "s"}</p>
          ) : null}
          {day.meal && day.meal.variants.length > 1 && !day.preparedDishId ? (
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

          <div className="sticky bottom-0 flex flex-col gap-2 bg-[var(--card)] pt-3">
            {!day.leftoverOfDayId ? (
              <Link href={`/cook/${day.id}`} className="btn-primary text-center">
                {day.preparedDishId ? "Heat this" : "Cook this"}
              </Link>
            ) : null}
            <button type="button" className="btn-outline" onClick={onStartReplace}>
              Replace meal
            </button>
            {day.leftoverOfDayId ? (
              <button
                type="button"
                className="btn-text"
                disabled={pending}
                onClick={() => {
                  run(async () => {
                    await setLeftoverDay(day.id, null);
                    onClose();
                  });
                }}
              >
                Clear leftovers
              </button>
            ) : (
              <button
                type="button"
                className="btn-text"
                disabled={pending}
                onClick={() => {
                  run(async () => {
                    await clearDay(day.id);
                    onClose();
                  });
                }}
              >
                Clear day
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {preparedDishes && preparedDishes.length ? (
            <>
              <p className="text-[var(--muted)]">Heat a prepared dish.</p>
              {preparedDishes.map((dish) => (
                <button
                  key={dish.id}
                  type="button"
                  className="btn-outline w-full"
                  disabled={pending}
                  onClick={() => {
                    run(async () => {
                      await placeHeatPlan({
                        dayId: day.id,
                        preparedDishId: dish.id,
                      });
                      onClose();
                    });
                  }}
                >
                  Heat {dish.name} ({dish.portionsRemaining} left)
                </button>
              ))}
            </>
          ) : null}
          {leftoverSources && leftoverSources.length ? (
            <>
              <p className="text-[var(--muted)]">
                Or eat leftovers from an earlier cook.
              </p>
              {leftoverSources.map((source) => (
                <button
                  key={source.id}
                  type="button"
                  className="btn-outline w-full"
                  disabled={pending}
                  onClick={() => {
                    run(async () => {
                      await setLeftoverDay(day.id, source.id);
                      onClose();
                    });
                  }}
                >
                  Eat leftovers from {source.label}
                </button>
              ))}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
