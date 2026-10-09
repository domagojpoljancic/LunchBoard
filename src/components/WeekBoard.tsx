"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  acceptConfidenceNudge,
  dismissConfidenceNudge,
} from "@/app/actions/cook";
import {
  addMealToPool,
  dismissDiversity,
  fillPoolSlots,
  fillWeekEmptyDays,
  moveDayMeal,
  placeMealOnDay,
  removePoolEntry,
} from "@/app/actions/week";
import { CoachSticky } from "@/components/CoachSticky";
import { DayColumn, type DayView } from "@/components/DayColumn";
import { DaySheet, type SideOption } from "@/components/DaySheet";
import { Library, type LibraryMeal } from "@/components/Library";
import { PlanningModeToggle } from "@/components/PlanningModeToggle";
import { TopBar } from "@/components/TopBar";
import { WeekendToggle } from "@/components/WeekendToggle";
import { useBoardDrag } from "@/components/use-board-drag";
import { proteinLabel } from "@/lib/protein";
import { weekdayLabel, weekdayShort } from "@/lib/weeks";

export type BoardDay = DayView & {
  suggestedSides: SideOption[];
};

export function WeekBoard({
  weekStart,
  weekId,
  days,
  meals,
  diversityGroup,
  diversityCount,
  diversityDismissed,
  nudgeMealId,
  planningMode = "BY_DAY",
  daysView = true,
  weekendExpanded = false,
  poolTarget = 5,
  poolEntries = [],
  preparedDishes = [],
}: {
  weekStart: string;
  weekId: string;
  days: BoardDay[];
  meals: LibraryMeal[];
  diversityGroup: string | null;
  diversityCount: number;
  diversityDismissed: boolean;
  nudgeMealId?: string | null;
  planningMode?: string;
  daysView?: boolean;
  weekendExpanded?: boolean;
  poolTarget?: number;
  poolEntries?: Array<{
    id: string;
    mealId: string | null;
    mealName: string | null;
    preparedName: string | null;
    servings: number;
    pinnedDayPlanId: string | null;
  }>;
  preparedDishes?: Array<{
    id: string;
    name: string;
    portionsRemaining: number;
  }>;
}) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openDayId, setOpenDayId] = useState<string | null>(null);
  const [replacing, setReplacing] = useState(false);
  const [fillNote, setFillNote] = useState<string | null>(null);
  const [nudgeHidden, setNudgeHidden] = useState(false);
  const [status, setStatus] = useState("");
  const [pending, startTransition] = useTransition();

  const isPool = planningMode === "POOL";
  const showDays = !isPool || daysView;
  const selectedMeal = meals.find((m) => m.id === selectedId) ?? null;
  const openDay = days.find((d) => d.id === openDayId) ?? null;

  function leftoverSourcesFor(day: BoardDay) {
    if (day.meal && !day.leftoverOfDayId) return [];
    return days
      .filter((d) => {
        if (!d.enabled || !d.meal || d.leftoverOfDayId) return false;
        if (d.date >= day.date) return false;
        const claimed = days.filter(
          (x) => x.leftoverOfDayId === d.id && x.id !== day.id,
        ).length;
        return d.servings - 1 - claimed >= 1;
      })
      .map((d) => ({
        id: d.id,
        label: weekdayShort(d.date),
      }));
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!selectedId || isPool) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }
      const n = Number(e.key);
      if (n < 1 || n > 7) return;
      const day = days[n - 1];
      if (!day?.enabled) return;
      e.preventDefault();
      if (day.meal) {
        setOpenDayId(day.id);
        setReplacing(false);
      } else {
        startTransition(() => {
          placeMealOnDay(day.id, selectedId).then(() => {
            setOpenDayId(day.id);
            setSelectedId(null);
          });
        });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [days, selectedId, isPool]);

  const showDiversity =
    !diversityDismissed && diversityGroup && diversityCount >= 4;

  const nudgeMeal = meals.find((meal) => meal.id === nudgeMealId) ?? null;
  const showCookNudge =
    !nudgeHidden &&
    nudgeMeal != null &&
    nudgeMeal.confidence !== "KNOW" &&
    (nudgeMeal.cookCount ?? 0) >=
      (nudgeMeal.nudgeDismissedAtCookCount ?? 0) + 3;

  const dayViews = useMemo(() => days, [days]);

  const { drag, didDrag } = useBoardDrag(rootRef, ({ mealId, fromDayId, toDayId }) => {
    if (isPool && !showDays) return;
    const day = days.find((item) => item.id === toDayId);
    if (!day?.enabled) return;
    startTransition(async () => {
      if (fromDayId) {
        await moveDayMeal(fromDayId, toDayId);
        setStatus(`Moved to ${weekdayLabel(day.date)}.`);
      } else {
        await placeMealOnDay(toDayId, mealId);
        setOpenDayId(toDayId);
        setSelectedId(null);
        setReplacing(false);
        setStatus(`Placed on ${weekdayLabel(day.date)}.`);
      }
    });
  });

  function swallowDragClick() {
    if (!didDrag.current) return false;
    didDrag.current = false;
    return true;
  }

  const listsLink = (
    <>
      <Link href="/home" className="btn-text px-2 text-sm md:px-4">
        At home
      </Link>
      <Link href={`/list/${weekStart}`} className="btn-text px-2 text-sm md:px-4">
        Lists
      </Link>
    </>
  );

  const fillButton = (
    <button
      type="button"
      className="btn-primary px-3 text-sm md:px-4"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          if (isPool) {
            await fillPoolSlots(weekId);
            setFillNote(null);
            router.refresh();
            return;
          }
          const result = await fillWeekEmptyDays(weekStart);
          if (result.placed === 0 || result.emptyLeft > 0) {
            setFillNote(
              "Mark a meal you know how to cook, or add one. Then I can fill the empty days.",
            );
          } else {
            setFillNote(null);
          }
        });
      }}
    >
      <span className="md:hidden">Fill</span>
      <span className="hidden md:inline">
        {isPool ? "Fill week’s meals" : "Fill empty days"}
      </span>
    </button>
  );

  return (
    <div
      ref={rootRef}
      className={`flex min-h-dvh flex-col md:h-dvh md:overflow-hidden ${
        drag ? "cursor-grabbing" : ""
      }`}
    >
      <TopBar
        weekStart={weekStart}
        right={
          <>
            {listsLink}
            {fillButton}
          </>
        }
      />

      <div className="flex shrink-0 flex-wrap items-center gap-3 px-3 pt-3 md:px-4">
        <PlanningModeToggle weekId={weekId} planningMode={planningMode} />
        {!isPool ? (
          <WeekendToggle weekId={weekId} weekendExpanded={weekendExpanded} />
        ) : null}
        <p className="basis-full text-sm text-[var(--muted)] sm:basis-auto">
          {isPool
            ? "Pick lunches for the week — no day assignment required."
            : weekendExpanded
              ? "Assign a lunch to each day, including the weekend."
              : "Assign a lunch to each weekday."}
        </p>
      </div>

      <div className="shrink-0 px-3 pt-3 md:px-4">
        <Library
          meals={meals}
          selectedId={selectedId}
          onSelect={setSelectedId}
          beforeSelect={swallowDragClick}
          planningMode={planningMode}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 px-3 py-3 md:overflow-hidden md:px-4">
        <div className="flex min-w-0 flex-1 flex-col gap-3 md:overflow-auto">
          {showDiversity ? (
            <CoachSticky
              actions={
                <button
                  type="button"
                  className="btn-text"
                  onClick={() => dismissDiversity(weekId)}
                >
                  Dismiss
                </button>
              }
            >
              {diversityCount} {proteinLabel(diversityGroup)} lunches this week.
              Swap one if you want more variety.
            </CoachSticky>
          ) : null}
          {fillNote ? <CoachSticky>{fillNote}</CoachSticky> : null}
          {showCookNudge && nudgeMeal ? (
            <CoachSticky
              actions={
                <>
                  <button
                    type="button"
                    className="btn-text"
                    onClick={() => {
                      setNudgeHidden(true);
                      startTransition(async () => {
                        await acceptConfidenceNudge(nudgeMeal.id);
                        router.replace(`/week/${weekStart}`);
                      });
                    }}
                  >
                    Yes, update
                  </button>
                  <button
                    type="button"
                    className="btn-text muted"
                    onClick={() => {
                      setNudgeHidden(true);
                      startTransition(async () => {
                        await dismissConfidenceNudge(nudgeMeal.id);
                        router.replace(`/week/${weekStart}`);
                      });
                    }}
                  >
                    Not now
                  </button>
                </>
              }
            >
              {nudgeMeal.confidence === "RECIPE"
                ? `You have cooked this ${nudgeMeal.cookCount} times. Move it to roughly know?`
                : `You have cooked this ${nudgeMeal.cookCount} times. Mark it as a meal you know?`}
            </CoachSticky>
          ) : null}

          {isPool ? (
            <section className="sheet space-y-3 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-2xl">This week’s meals</h2>
                <span className="text-sm text-[var(--muted)]">
                  {poolEntries.length} of {poolTarget}
                </span>
              </div>
              {selectedMeal ? (
                <button
                  type="button"
                  className="btn-primary"
                  disabled={
                    pending ||
                    poolEntries.length >= poolTarget ||
                    poolEntries.some((e) => e.mealId === selectedMeal.id)
                  }
                  onClick={() =>
                    startTransition(async () => {
                      await addMealToPool({
                        weekId,
                        mealId: selectedMeal.id,
                      });
                      setSelectedId(null);
                      setStatus(`Added ${selectedMeal.name}.`);
                      router.refresh();
                    })
                  }
                >
                  Add {selectedMeal.name} to this week
                </button>
              ) : (
                <p className="text-sm text-[var(--muted)]">
                  Select a meal above to add it here.
                </p>
              )}
              {poolEntries.length === 0 ? (
                <p className="text-[var(--muted)]">
                  No meals yet. Add a few you might cook this week.
                </p>
              ) : (
                <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {poolEntries.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-center justify-between gap-2 rounded-[var(--radius-ticket)] border border-[var(--line)] bg-[var(--paper)] px-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="font-display text-lg leading-tight">
                          {entry.preparedName
                            ? entry.preparedName
                            : entry.mealName ?? "Meal"}
                        </p>
                        <p className="text-sm text-[var(--muted)]">
                          {entry.servings} portions
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn-text text-[var(--warning)]"
                        onClick={() =>
                          startTransition(async () => {
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
              )}
            </section>
          ) : null}

          {showDays ? (
            <div className="min-h-0 flex-1 md:overflow-auto">
              <div className="flex flex-col gap-3 md:h-full md:flex-row md:gap-2">
                {dayViews.map((day) => (
                  <div
                    key={day.id}
                    className={
                      day.enabled
                        ? "w-full md:h-full md:min-w-0 md:flex-1"
                        : "w-full md:h-full md:w-11 md:shrink-0"
                    }
                  >
                    <DayColumn
                      day={day}
                      selectedMealName={selectedMeal?.name ?? null}
                      dropActive={drag?.overDayId === day.id}
                      beforeSelect={swallowDragClick}
                      onEmptyClick={() => {
                        if (swallowDragClick()) return;
                        if (selectedId) {
                          startTransition(async () => {
                            await placeMealOnDay(day.id, selectedId);
                            setOpenDayId(day.id);
                            setSelectedId(null);
                            setReplacing(false);
                          });
                          return;
                        }
                        if (
                          leftoverSourcesFor(day).length ||
                          preparedDishes.length
                        ) {
                          setOpenDayId(day.id);
                          setReplacing(false);
                        }
                      }}
                      onFilledClick={() => {
                        setOpenDayId(day.id);
                        setReplacing(false);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {openDay && showDays ? (
        <DaySheet
          day={openDay}
          sides={openDay.suggestedSides}
          replacing={replacing}
          selectedMealId={selectedId}
          leftoverSources={leftoverSourcesFor(openDay)}
          preparedDishes={preparedDishes}
          onClose={() => {
            setOpenDayId(null);
            setReplacing(false);
          }}
          onStartReplace={() => setReplacing(true)}
          onCancelReplace={() => setReplacing(false)}
        />
      ) : null}

      <p className="sr-only" aria-live="polite">
        {status}
      </p>
      {drag ? (
        <div
          className="pointer-events-none fixed z-50 rounded-2xl border border-[var(--ink)] bg-[var(--card)] px-3 py-2 font-display shadow-[var(--shadow)]"
          style={{ left: drag.x + 12, top: drag.y + 12 }}
        >
          {drag.name}
        </div>
      ) : null}
    </div>
  );
}
