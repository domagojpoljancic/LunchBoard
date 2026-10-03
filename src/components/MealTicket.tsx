"use client";

import { confidenceLabel, proteinColor } from "@/lib/protein";

export type TicketMeal = {
  id: string;
  name: string;
  confidence: string;
  activeMinutes: number | null;
  proteinGroup: string;
  variantLabel?: string | null;
  hasMultipleVariants?: boolean;
};

export function MealTicket({
  meal,
  selected,
  onSelect,
  onCycleVariant,
  compact,
}: {
  meal: TicketMeal;
  selected?: boolean;
  onSelect?: () => void;
  onCycleVariant?: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full overflow-hidden rounded-[16px] border bg-[var(--card)] text-left transition-transform ${
        selected ? "border-[var(--ink)] border-2" : "border-[var(--line)]"
      } ${compact ? "" : "hover:-translate-y-0.5"}`}
      style={{ borderColor: selected ? "var(--ink)" : undefined }}
    >
      <span
        className="w-1.5 shrink-0"
        style={{ background: proteinColor(meal.proteinGroup) }}
        aria-hidden
      />
      <span className={`min-w-0 flex-1 ${compact ? "p-2.5" : "p-3.5"}`}>
        <span
          className={`font-display block leading-tight ${
            compact ? "text-lg" : "text-[22px]"
          }`}
        >
          {meal.name}
        </span>
        <span className="mt-1 block text-[13px] font-medium text-[var(--muted)]">
          {meal.activeMinutes != null
            ? `${meal.activeMinutes} min hands-on · `
            : ""}
          {confidenceLabel(meal.confidence)}
        </span>
        {meal.hasMultipleVariants && meal.variantLabel ? (
          <span
            className="mt-1 inline-block text-[13px] font-semibold underline-offset-2 hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              onCycleVariant?.();
            }}
            role={onCycleVariant ? "button" : undefined}
          >
            {meal.variantLabel}
          </span>
        ) : null}
      </span>
    </button>
  );
}
