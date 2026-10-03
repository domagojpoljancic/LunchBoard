"use client";

import Link from "next/link";
import {
  updateDayEnabled,
  updateDayPrepWindow,
  updateDayServings,
  updateDayVariant,
} from "@/app/actions/week";
import { CoachSticky } from "@/components/CoachSticky";
import { MealTicket } from "@/components/MealTicket";
import { dayNumber, weekdayLabel } from "@/lib/weeks";

export type DayView = {
  id: string;
  date: string;
  enabled: boolean;
  servings: number;
  prepWindow: string;
  meal: null | {
    id: string;
    name: string;
    confidence: string;
    activeMinutes: number | null;
    proteinGroup: string;
    variantId: string | null;
    variantLabel: string | null;
    variants: Array<{ id: string; label: string; proteinGroup: string }>;
  };
  sideNames: string[];
  warningActive: number | null;
};

export function DayColumn({
  day,
  selectedMealName,
  onEmptyClick,
  onFilledClick,
}: {
  day: DayView;
  selectedMealName: string | null;
  onEmptyClick: () => void;
  onFilledClick: () => void;
}) {
  const warn =
    day.warningActive != null
      ? day.prepWindow === "SAME_DAY"
        ? `About ${day.warningActive} min hands-on. Tight for a lunch hour.`
        : `About ${day.warningActive} min hands-on. Long for a weeknight.`
      : null;

  return (
    <section
      className={`sheet flex min-h-[70vh] flex-col p-3 ${
        day.enabled ? "" : "opacity-55"
      }`}
    >
      <div className="mb-2 flex items-baseline justify-between">
        <div>
          <div className="section-label">{weekdayLabel(day.date)}</div>
          <div className="font-display text-xl">{dayNumber(day.date)}</div>
        </div>
        <button
          type="button"
          className="btn-text muted text-sm"
          onClick={() => updateDayEnabled(day.id, !day.enabled)}
        >
          {day.enabled ? "Turn off" : "Turn on"}
        </button>
      </div>

      {day.enabled ? (
        <>
          <div className="mb-2 grid h-11 grid-cols-2 overflow-hidden rounded-full border border-[var(--line)] bg-[var(--paper)]">
            {(
              [
                ["EVENING_BEFORE", "Night before"],
                ["SAME_DAY", "At lunch"],
              ] as const
            ).map(([value, label]) => {
              const active = day.prepWindow === value;
              return (
                <button
                  key={value}
                  type="button"
                  className={`text-sm font-semibold ${
                    active
                      ? "bg-[var(--ink)] text-[var(--card)]"
                      : "text-[var(--ink)]"
                  }`}
                  onClick={() => updateDayPrepWindow(day.id, value)}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-sm text-[var(--muted)]">Portions</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="btn-text h-11 w-11"
                onClick={() =>
                  updateDayServings(day.id, Math.max(1, day.servings - 1))
                }
              >
                −
              </button>
              <span className="font-display w-6 text-center text-xl">
                {day.servings}
              </span>
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

          {day.meal ? (
            <div className="space-y-2">
              <MealTicket
                meal={{
                  id: day.meal.id,
                  name: day.meal.name,
                  confidence: day.meal.confidence,
                  activeMinutes: day.meal.activeMinutes,
                  proteinGroup: day.meal.proteinGroup,
                  variantLabel: day.meal.variantLabel,
                  hasMultipleVariants: day.meal.variants.length > 1,
                }}
                onSelect={onFilledClick}
                onCycleVariant={() => {
                  const variants = day.meal!.variants;
                  if (variants.length < 2) return;
                  const idx = variants.findIndex(
                    (v) => v.id === day.meal!.variantId,
                  );
                  const next = variants[(idx + 1) % variants.length];
                  updateDayVariant(day.id, next.id);
                }}
              />
              {day.sideNames.map((name) => (
                <div key={name} className="text-[13px] text-[var(--muted)]">
                  {name}
                </div>
              ))}
              {warn ? <CoachSticky>{warn}</CoachSticky> : null}
              <Link href={`/cook/${day.id}`} className="btn-text text-sm">
                Cook
              </Link>
            </div>
          ) : (
            <button
              type="button"
              onClick={onEmptyClick}
              className="flex min-h-[120px] w-full items-center justify-center rounded-2xl border border-dashed border-[var(--line)] px-3 text-center text-[var(--muted)]"
            >
              {selectedMealName
                ? `Place ${selectedMealName}`
                : "Place a meal"}
            </button>
          )}
        </>
      ) : null}
    </section>
  );
}
