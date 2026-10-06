"use client";

import { useState, useTransition } from "react";
import { completeOnboarding, skipOnboarding } from "@/app/actions/meals";
import { MealTicket, type TicketMeal } from "@/components/MealTicket";

export function Onboarding({ meals }: { meals: TicketMeal[] }) {
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-[var(--paper)]">
      <div
        className="min-h-full bg-[radial-gradient(var(--dot)_1px,transparent_1px)] bg-size-[18px_18px] px-4 py-10 md:px-8"
      >
        <div className="mx-auto max-w-4xl space-y-6">
          <h1 className="font-display text-4xl leading-tight md:text-5xl">
            Which of these can you already cook?
          </h1>
          <p className="text-[var(--muted)]">You can change this any time.</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {meals.map((meal) => {
              const isKnown = known.has(meal.id);
              return (
                <MealTicket
                  key={meal.id}
                  meal={meal}
                  compact
                  selected={isKnown}
                  onSelect={() => {
                    setKnown((prev) => {
                      const next = new Set(prev);
                      if (next.has(meal.id)) next.delete(meal.id);
                      else next.add(meal.id);
                      return next;
                    });
                  }}
                  knowToggle={{
                    known: isKnown,
                    onToggle: () => {
                      setKnown((prev) => {
                        const next = new Set(prev);
                        if (next.has(meal.id)) next.delete(meal.id);
                        else next.add(meal.id);
                        return next;
                      });
                    },
                  }}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 pt-4">
            <button
              type="button"
              className="btn-primary"
              disabled={pending}
              onClick={() =>
                start(() => completeOnboarding([...known]))
              }
            >
              Done
            </button>
            <button
              type="button"
              className="btn-text muted"
              disabled={pending}
              onClick={() => start(() => skipOnboarding())}
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
