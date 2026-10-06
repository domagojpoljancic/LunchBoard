"use client";

import Link from "next/link";
import {
  updateDayEnabled,
  updateDayServings,
  updateDayVariant,
} from "@/app/actions/week";
import { CoachSticky } from "@/components/CoachSticky";
import { MealTicket } from "@/components/MealTicket";
import { prepWindowLabel } from "@/lib/protein";
import {
  dayNumber,
  previousDate,
  weekdayLabel,
  weekdayShort,
} from "@/lib/weeks";

export type DayView = {
  id: string;
  date: string;
  enabled: boolean;
  servings: number;
  prepWindow: string;
  cookedAt?: string | null;
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
  fillReason?: string | null;
};

function cookWhen(day: DayView): string {
  if (day.prepWindow === "SAME_DAY") return "Cook at lunch";
  const eve = weekdayShort(previousDate(day.date));
  return `Cook ${eve} evening`;
}

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

  if (!day.enabled) {
    return (
      <section className="sheet flex min-h-[120px] flex-col items-center gap-2 p-2 md:min-h-[70vh] md:w-11 md:shrink-0 md:px-1 md:py-3">
        <div className="text-center md:writing-mode-vertical">
          <div className="section-label text-[10px] md:rotate-180 md:[writing-mode:vertical-rl]">
            {weekdayLabel(day.date).slice(0, 1)}
          </div>
          <div className="font-display text-lg md:rotate-180 md:[writing-mode:vertical-rl]">
            {dayNumber(day.date)}
          </div>
        </div>
        <button
          type="button"
          className="btn-text muted px-1 text-xs"
          onClick={() => updateDayEnabled(day.id, true)}
          aria-label={`Turn on ${weekdayLabel(day.date)}`}
        >
          On
        </button>
      </section>
    );
  }

  return (
    <section className="sheet flex min-h-[160px] flex-col p-3 md:min-h-[70vh]">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <div className="min-w-0">
          <div className="section-label">{weekdayLabel(day.date)}</div>
          <div className="font-display text-xl">{dayNumber(day.date)}</div>
        </div>
        <button
          type="button"
          className="btn-text muted shrink-0 text-sm"
          onClick={() => updateDayEnabled(day.id, false)}
        >
          Turn off
        </button>
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
            footer={
              <div className="mt-2 space-y-1">
                <div className="text-[12px] font-medium text-[var(--muted)]">
                  {prepWindowLabel(day.prepWindow)} · {day.servings} portions
                </div>
                <div className="text-[12px] font-semibold text-[var(--ink)]">
                  {cookWhen(day)}
                </div>
                {day.sideNames.length ? (
                  <div className="text-[12px] text-[var(--muted)]">
                    {day.sideNames.join(" · ")}
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <Link
                    href={`/cook/${day.id}`}
                    className="btn-text px-0 text-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {day.cookedAt ? "Cooked" : "Cook"}
                  </Link>
                  <div className="hidden items-center gap-1 2xl:flex">
                    <button
                      type="button"
                      className="btn-text h-9 w-9 px-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateDayServings(
                          day.id,
                          Math.max(1, day.servings - 1),
                        );
                      }}
                    >
                      −
                    </button>
                    <span className="font-display w-5 text-center text-lg">
                      {day.servings}
                    </span>
                    <button
                      type="button"
                      className="btn-text h-9 w-9 px-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateDayServings(
                          day.id,
                          Math.min(12, day.servings + 1),
                        );
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            }
          />
          {warn ? <CoachSticky>{warn}</CoachSticky> : null}
        </div>
      ) : (
        <button
          type="button"
          onClick={onEmptyClick}
          className="flex min-h-[120px] w-full flex-1 items-center justify-center rounded-2xl border border-dashed border-[var(--line)] px-3 text-center text-[var(--muted)]"
        >
          {selectedMealName ? `Place ${selectedMealName}` : "Place a meal"}
        </button>
      )}
    </section>
  );
}
