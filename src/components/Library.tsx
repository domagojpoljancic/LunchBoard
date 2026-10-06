"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { setConfidence } from "@/app/actions/meals";
import { MealTicket, type TicketMeal } from "@/components/MealTicket";
import { proteinColor } from "@/lib/protein";

const FILTERS = [
  { key: "ALL", label: "All" },
  { key: "BEEF", label: "Beef" },
  { key: "WHITE_MEAT", label: "White meat" },
  { key: "FISH", label: "Fish" },
  { key: "VEGETARIAN", label: "Vegetarian" },
  { key: "VEGAN", label: "Vegan" },
] as const;

export type LibraryMeal = TicketMeal & {
  method: string;
  shelf: "CAN_COOK" | "SIMILAR" | "NEEDS_RECIPE";
};

export function Library({
  meals,
  selectedId,
  onSelect,
}: {
  meals: LibraryMeal[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [protein, setProtein] = useState<string>("ALL");
  const [pending, startTransition] = useTransition();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return meals.filter((m) => {
      if (protein !== "ALL" && m.proteinGroup !== protein) return false;
      if (!query.trim()) return true;
      return m.name.toLowerCase().includes(query.trim().toLowerCase());
    });
  }, [meals, protein, query]);

  const shelves = [
    {
      key: "CAN_COOK" as const,
      title: "Can cook",
      items: filtered.filter((m) => m.shelf === "CAN_COOK"),
    },
    {
      key: "SIMILAR" as const,
      title: "Similar",
      items: filtered.filter((m) => m.shelf === "SIMILAR"),
    },
    {
      key: "NEEDS_RECIPE" as const,
      title: "Needs a recipe",
      items: filtered.filter((m) => m.shelf === "NEEDS_RECIPE"),
    },
  ];

  return (
    <aside className="sheet flex h-full flex-col p-4">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search meals"
        className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const selected = protein === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setProtein(f.key)}
              className={`inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm font-semibold ${
                selected ? "seg-active" : "border border-[var(--line)] seg-idle"
              }`}
            >
              {f.key !== "ALL" ? (
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: proteinColor(f.key) }}
                />
              ) : null}
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 min-h-0 flex-1 space-y-5 overflow-y-auto">
        {shelves.map((shelf) => (
          <section key={shelf.key}>
            <h2 className="section-label mb-2">{shelf.title}</h2>
            {shelf.key === "CAN_COOK" && shelf.items.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                Meals you know will land here. Mark one, or add your own.
              </p>
            ) : null}
            {query &&
            shelf.items.length === 0 &&
            shelf.key === "NEEDS_RECIPE" &&
            filtered.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No meal matches that.</p>
            ) : null}
            <div className="space-y-2">
              {shelf.items.map((meal) => {
                const known =
                  meal.confidence === "KNOW" || meal.confidence === "PROMPT";
                return (
                  <MealTicket
                    key={meal.id}
                    meal={meal}
                    compact
                    selected={selectedId === meal.id}
                    onSelect={() =>
                      onSelect(selectedId === meal.id ? null : meal.id)
                    }
                    knowToggle={{
                      known,
                      pending: pending && togglingId === meal.id,
                      onToggle: () => {
                        setTogglingId(meal.id);
                        startTransition(async () => {
                          await setConfidence(meal.id, known ? "RECIPE" : "KNOW");
                          setTogglingId(null);
                        });
                      },
                    }}
                    editHref={`/meals/${meal.id}`}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <Link href="/meals/new" className="btn-outline mt-4 w-full">
        Add a meal
      </Link>
    </aside>
  );
}
