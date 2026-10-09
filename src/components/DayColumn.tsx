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
  skippedAt?: string | null;
  cookKind?: string | null;
  preparedDishId?: string | null;
  preparedDishName?: string | null;
  fillReason?: string | null;
  leftoverOfDayId?: string | null;
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
  dropActive,
  beforeSelect,
}: {
  day: DayView;
  selectedMealName: string | null;
  onEmptyClick: () => void;
  onFilledClick: () => void;
  dropActive?: boolean;
  beforeSelect?: () => boolean;
}) {
  const warn =
    day.warningActive != null
      ? day.prepWindow === "SAME_DAY"
        ? `About ${day.warningActive} min hands-on. Tight for a lunch hour.`
        : `About ${day.warningActive} min hands-on. Long for a weeknight.`
      : null;

  if (!day.enabled) {
    return (
      <section className="sheet flex min-h-[120px] flex-col items-center justify-center gap-2 p-2 md:h-full md:w-11 md:shrink-0 md:justify-start md:px-0 md:py-3">
        <div className="section-label text-[10px] leading-none">
          {weekdayLabel(day.date).slice(0, 2)}
        </div>
        <div className="font-display text-lg leading-none">
          {dayNumber(day.date)}
        </div>
        <button
          type="button"
          className="btn-text muted min-h-0 px-0 py-2 text-xs md:mt-1"
          onClick={() => updateDayEnabled(day.id, true)}
          aria-label={`Turn on ${weekdayLabel(day.date)}`}
        >
          On
        </button>
      </section>
    );
  }

  return (
    <section
      data-drop-day={day.id}
      className={`sheet flex min-h-[160px] flex-col p-3 md:h-full md:min-h-0 md:overflow-y-auto ${
        dropActive ? "outline outline-2 outline-offset-[-2px] outline-[var(--ink)]" : ""
      }`}
    >
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <div className="min-w-0">
          <div className="section-label">{weekdayLabel(day.date)}</div>
          <div className="font-display text-xl">{dayNumber(day.date)}</div>
        </div>
        <button
          type="button"
          className="btn-text muted shrink-0 text-sm"
          onClick={() => updateDayEnabled(day.id, false)}
          aria-label={`Turn off ${weekdayLabel(day.date)}`}
        >
          Turn off
        </button>
      </div>

      {day.meal || day.preparedDishId ? (
        <div className={`space-y-2 ${day.leftoverOfDayId ? "opacity-70" : ""}`}>
          <MealTicket
            meal={{
              id: day.meal?.id ?? day.preparedDishId ?? day.id,
              name:
                day.cookKind === "HEAT_PREPARED" || day.preparedDishId
                  ? day.preparedDishName ?? day.meal?.name ?? "Ready to heat"
                  : day.meal!.name,
              confidence: day.meal?.confidence ?? "KNOW",
              activeMinutes: day.meal?.activeMinutes ?? null,
              proteinGroup: day.meal?.proteinGroup ?? "OTHER",
              variantLabel:
                day.cookKind === "HEAT_PREPARED" || day.preparedDishId
                  ? "Ready to heat"
                  : day.meal?.variantLabel,
              hasMultipleVariants: (day.meal?.variants.length ?? 0) > 1,
            }}
            draggable={!day.leftoverOfDayId && !day.preparedDishId}
            dragFromDayId={
              day.leftoverOfDayId || day.preparedDishId ? undefined : day.id
            }
            onSelect={() => {
              if (beforeSelect?.()) return;
              onFilledClick();
            }}
            onCycleVariant={
              day.leftoverOfDayId || day.preparedDishId || !day.meal
                ? undefined
                : () => {
                    const variants = day.meal!.variants;
                    if (variants.length < 2) return;
                    const idx = variants.findIndex(
                      (v) => v.id === day.meal!.variantId,
                    );
                    const next = variants[(idx + 1) % variants.length];
                    updateDayVariant(day.id, next.id);
                  }
            }
            footer={
              <div className="mt-2 space-y-1">
                {day.leftoverOfDayId ? (
                  <div className="text-[12px] font-semibold text-[var(--muted)]">
                    Leftovers
                  </div>
                ) : day.preparedDishId || day.cookKind === "HEAT_PREPARED" ? (
                  <>
                    <div className="text-[12px] font-semibold text-[var(--muted)]">
                      Ready to heat
                    </div>
                    <div className="text-[12px] font-medium text-[var(--muted)]">
                      {day.servings} portion{day.servings === 1 ? "" : "s"}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-[12px] font-medium text-[var(--muted)]">
                      {prepWindowLabel(day.prepWindow)} · {day.servings} portions
                    </div>
                    <div className="text-[12px] font-semibold text-[var(--ink)]">
                      {cookWhen(day)}
                    </div>
                  </>
                )}
                {day.fillReason === "TRY_NEW" ? (
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--warning)]">
                    New to you
                  </div>
                ) : null}
                {day.sideNames.length ? (
                  <div className="text-[12px] text-[var(--muted)]">
                    {day.sideNames.join(" · ")}
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-2 pt-1">
                  {!day.leftoverOfDayId ? (
                    <Link
                      href={`/cook/${day.id}`}
                      className="btn-text px-0 text-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {day.cookedAt
                        ? "Cooked"
                        : day.preparedDishId
                          ? "Heat"
                          : "Cook"}
                    </Link>
                  ) : (
                    <span />
                  )}
                  <div className="hidden items-center gap-1 2xl:flex">
                    {!day.leftoverOfDayId ? (
                      <>
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
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            }
          />
          {warn && !day.leftoverOfDayId ? <CoachSticky>{warn}</CoachSticky> : null}
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
