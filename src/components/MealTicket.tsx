"use client";

import Link from "next/link";
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
  footer,
  knowToggle,
  editHref,
}: {
  meal: TicketMeal;
  selected?: boolean;
  onSelect?: () => void;
  onCycleVariant?: () => void;
  compact?: boolean;
  footer?: React.ReactNode;
  /** Library: circular know check. */
  knowToggle?: {
    known: boolean;
    onToggle: () => void;
    pending?: boolean;
  };
  editHref?: string;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={
        meal.variantLabel ? `${meal.name}, ${meal.variantLabel}` : meal.name
      }
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.();
        }
      }}
      className={`group relative flex w-full overflow-hidden rounded-[16px] border bg-[var(--card)] text-left transition-transform ${
        selected ? "border-2 border-[var(--ink)]" : "border-[var(--line)]"
      } ${compact ? "" : "hover:-translate-y-0.5"}`}
    >
      <span
        className="w-1.5 shrink-0"
        style={{ background: proteinColor(meal.proteinGroup) }}
        aria-hidden
      />
      <span className={`min-w-0 flex-1 ${compact ? "p-2.5" : "p-3.5"}`}>
        <span className="flex items-start gap-2">
          <span className="min-w-0 flex-1">
            <span
              className={`font-display block leading-snug break-words ${
                compact ? "text-base" : "text-[20px]"
              }`}
            >
              {meal.name}
            </span>
            <span className="mt-1 block text-[12px] font-medium text-[var(--muted)]">
              {meal.activeMinutes != null
                ? `${meal.activeMinutes} min hands-on · `
                : ""}
              {confidenceLabel(meal.confidence)}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1">
            {knowToggle ? (
              <button
                type="button"
                disabled={knowToggle.pending}
                aria-label={
                  knowToggle.known
                    ? `${meal.name}: marked as known`
                    : `Mark ${meal.name} as known`
                }
                aria-pressed={knowToggle.known}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                  knowToggle.known
                    ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]"
                    : "border-[var(--line)] bg-transparent text-transparent"
                } ${knowToggle.pending ? "opacity-50" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  knowToggle.onToggle();
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                  <path
                    d="M2.5 6.2 5 8.5 9.5 3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            ) : null}
            {editHref ? (
              <Link
                href={editHref}
                aria-label={`Edit ${meal.name}`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--card)] text-[var(--muted)] opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                  <path
                    d="M8.2 2.4 11.6 5.8 5 12.4H1.6V9Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            ) : null}
          </span>
        </span>
        {meal.hasMultipleVariants && meal.variantLabel ? (
          onCycleVariant ? (
            <button
              type="button"
              className="mt-1 inline-block min-h-9 text-left text-[13px] font-semibold underline-offset-2 hover:underline"
              onClick={(event) => {
                event.stopPropagation();
                onCycleVariant();
              }}
            >
              {meal.variantLabel}
            </button>
          ) : (
            <span className="mt-1 inline-block text-[13px] font-semibold">
              {meal.variantLabel}
            </span>
          )
        ) : null}
        {footer}
      </span>
    </div>
  );
}
