"use client";

import Link from "next/link";
import {
  acceptConfidenceNudge,
  dismissConfidenceNudge,
  logCook,
} from "@/app/actions/cook";
import { CoachSticky } from "@/components/CoachSticky";
import { formatAmount } from "@/lib/protein";

export function CookView({
  dayId,
  weekStart,
  meal,
  servings,
  prepWindow,
  variantLabel,
  ingredients,
  keypoints,
  steps,
}: {
  dayId: string;
  weekStart: string;
  meal: {
    id: string;
    name: string;
    confidence: string;
    cookCount: number;
    nudgeDismissedAtCookCount: number;
  } | null;
  servings: number;
  prepWindow: string;
  variantLabel: string | null;
  ingredients: Array<{
    name: string;
    quantity: number | null;
    unit: string | null;
  }>;
  keypoints: string[];
  steps: string[];
}) {
  if (!meal) {
    return (
      <main className="mx-auto max-w-[680px] p-6">
        <p className="text-[var(--muted)]">Place a meal</p>
        <Link href={`/week/${weekStart}`} className="btn-text">
          Back to board
        </Link>
      </main>
    );
  }

  const showNudge =
    meal.confidence !== "KNOW" &&
    meal.cookCount >= meal.nudgeDismissedAtCookCount + 3;

  return (
    <main className="mx-auto max-w-[680px] space-y-6 p-6">
      <Link href={`/week/${weekStart}`} className="btn-text muted">
        Board
      </Link>
      <h1 className="font-display text-[44px] leading-tight">{meal.name}</h1>
      <p className="text-[var(--muted)]">
        {variantLabel ? `${variantLabel} · ` : ""}
        {servings} portions ·{" "}
        {prepWindow === "SAME_DAY" ? "At lunch" : "Night before"}
      </p>

      {meal.confidence === "KNOW" ? (
        <p>You know this one.</p>
      ) : meal.confidence === "PROMPT" ? (
        <p>A few cues.</p>
      ) : null}

      <section>
        <h2 className="section-label mb-2">Ingredients</h2>
        <ul className="space-y-1">
          {ingredients.map((ing) => (
            <li key={ing.name} className="flex justify-between gap-4">
              <span>{ing.name}</span>
              <span className="font-display">
                {formatAmount(ing.quantity, ing.unit)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {meal.confidence !== "RECIPE" && keypoints.length > 0 ? (
        <section>
          <h2 className="section-label mb-2">Keypoints</h2>
          <ol className="space-y-3">
            {keypoints.map((body, i) => (
              <li key={body} className="flex gap-3">
                <span className="font-display text-[28px] leading-none">
                  {i + 1}
                </span>
                <span className="text-lg">{body}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {meal.confidence === "RECIPE" ? (
        <>
          {keypoints.length > 0 ? (
            <section>
              <h2 className="section-label mb-2">Keypoints</h2>
              <ul className="space-y-2">
                {keypoints.map((body) => (
                  <li key={body}>{body}</li>
                ))}
              </ul>
            </section>
          ) : null}
          <section>
            <h2 className="section-label mb-2">Steps</h2>
            <ol className="space-y-6">
              {steps.map((body, i) => (
                <li key={body} className="flex gap-4">
                  <span className="font-display text-[28px] leading-none">
                    {i + 1}
                  </span>
                  <span className="text-lg">{body}</span>
                </li>
              ))}
            </ol>
          </section>
        </>
      ) : null}

      {showNudge ? (
        <CoachSticky
          actions={
            <>
              <button
                type="button"
                className="btn-text"
                onClick={() => acceptConfidenceNudge(meal.id)}
              >
                Yes, update
              </button>
              <button
                type="button"
                className="btn-text muted"
                onClick={() => dismissConfidenceNudge(meal.id)}
              >
                Not now
              </button>
            </>
          }
        >
          {meal.confidence === "RECIPE"
            ? `You have cooked this ${meal.cookCount} times. Move it to roughly know?`
            : `You have cooked this ${meal.cookCount} times. Mark it as a meal you know?`}
        </CoachSticky>
      ) : null}

      <button
        type="button"
        className="btn-primary"
        onClick={() => logCook(dayId)}
      >
        I cooked this
      </button>
    </main>
  );
}
