"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  dismissDiversity,
  fillWeekEmptyDays,
  placeMealOnDay,
} from "@/app/actions/week";
import { CoachSticky } from "@/components/CoachSticky";
import { DayColumn, type DayView } from "@/components/DayColumn";
import { DaySheet, type SideOption } from "@/components/DaySheet";
import { Library, type LibraryMeal } from "@/components/Library";
import { TopBar } from "@/components/TopBar";
import { proteinLabel } from "@/lib/protein";

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
}: {
  weekStart: string;
  weekId: string;
  days: BoardDay[];
  meals: LibraryMeal[];
  diversityGroup: string | null;
  diversityCount: number;
  diversityDismissed: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openDayId, setOpenDayId] = useState<string | null>(null);
  const [replacing, setReplacing] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [fillNote, setFillNote] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selectedMeal = meals.find((m) => m.id === selectedId) ?? null;
  const openDay = days.find((d) => d.id === openDayId) ?? null;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!selectedId) return;
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
  }, [days, selectedId]);

  const showDiversity =
    !diversityDismissed && diversityGroup && diversityCount >= 4;

  const dayViews = useMemo(() => days, [days]);

  const mealsButton = (
    <button
      type="button"
      className="btn-text px-2 text-sm lg:hidden"
      onClick={() => setLibraryOpen(true)}
    >
      Meals
    </button>
  );

  const listsLink = (
    <Link href={`/list/${weekStart}`} className="btn-text px-2 text-sm md:px-4">
      Lists
    </Link>
  );

  const fillButton = (
    <button
      type="button"
      className="btn-primary px-3 text-sm md:px-4"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
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
      <span className="hidden md:inline">Fill empty days</span>
    </button>
  );

  return (
    <div className="min-h-screen overflow-x-hidden">
      <TopBar
        weekStart={weekStart}
        mobileExtras={
          <>
            {mealsButton}
            {listsLink}
          </>
        }
        right={
          <>
            <span className="hidden lg:inline">{mealsButton}</span>
            <span className="hidden md:inline">{listsLink}</span>
            {fillButton}
          </>
        }
      />

      <div className="relative mx-auto grid max-w-[1600px] gap-4 p-3 md:p-6 lg:grid-cols-[280px_1fr] xl:grid-cols-[300px_1fr]">
        <div className="hidden min-h-[calc(100vh-120px)] lg:block">
          <Library
            meals={meals}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>

        <div className="min-w-0 space-y-4">
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

          <div className="flex flex-col gap-3 md:flex-row md:gap-2 md:overflow-x-auto md:pb-2">
            {dayViews.map((day) => (
              <div
                key={day.id}
                className={
                  day.enabled
                    ? "w-full shrink-0 md:w-[min(220px,40vw)] md:min-w-[180px] md:flex-1"
                    : "w-full shrink-0 md:w-11"
                }
              >
                <DayColumn
                  day={day}
                  selectedMealName={selectedMeal?.name ?? null}
                  onEmptyClick={() => {
                    if (!selectedId) return;
                    startTransition(async () => {
                      await placeMealOnDay(day.id, selectedId);
                      setOpenDayId(day.id);
                      setSelectedId(null);
                      setReplacing(false);
                    });
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

        {openDay ? (
          <DaySheet
            day={openDay}
            sides={openDay.suggestedSides}
            replacing={replacing}
            selectedMealId={selectedId}
            onClose={() => {
              setOpenDayId(null);
              setReplacing(false);
            }}
            onStartReplace={() => setReplacing(true)}
            onCancelReplace={() => setReplacing(false)}
          />
        ) : null}
      </div>

      {libraryOpen ? (
        <div className="fixed inset-0 z-50 bg-[rgba(28,25,21,0.35)] lg:hidden">
          <div className="absolute inset-x-0 bottom-0 top-10 overflow-hidden rounded-t-[20px] bg-[var(--card)] p-2">
            <div className="flex justify-end px-2">
              <button
                type="button"
                className="btn-text"
                onClick={() => setLibraryOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="h-[calc(100%-48px)]">
              <Library
                meals={meals}
                selectedId={selectedId}
                onSelect={(id) => {
                  setSelectedId(id);
                  setLibraryOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
