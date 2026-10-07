"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  acceptConfidenceNudge,
  dismissConfidenceNudge,
  logCook,
  undoCook,
} from "@/app/actions/cook";
import { CoachSticky } from "@/components/CoachSticky";
import { formatAmount } from "@/lib/protein";

type Ing = {
  name: string;
  quantity: number | null;
  unit: string | null;
};

export function CookView({
  dayId,
  weekStart,
  cookedAt,
  meal,
  servings,
  prepWindow,
  variantLabel,
  mealIngredients,
  sideGroups,
  cupboard,
  keypoints,
  steps,
}: {
  dayId: string;
  weekStart: string;
  cookedAt: string | null;
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
  mealIngredients: Ing[];
  sideGroups: Array<{ name: string; ingredients: Ing[] }>;
  cupboard: string[];
  keypoints: string[];
  steps: string[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

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
        <h2 className="section-label mb-2">For the meal</h2>
        <ul className="space-y-1">
          {mealIngredients.map((ing) => (
            <li key={ing.name} className="flex justify-between gap-4">
              <span>{ing.name}</span>
              <span className="font-display">
                {formatAmount(ing.quantity, ing.unit)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {sideGroups.map((group) =>
        group.ingredients.length ? (
          <section key={group.name}>
            <h2 className="section-label mb-2">For {group.name}</h2>
            <ul className="space-y-1">
              {group.ingredients.map((ing) => (
                <li key={ing.name} className="flex justify-between gap-4">
                  <span>{ing.name}</span>
                  <span className="font-display">
                    {formatAmount(ing.quantity, ing.unit)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null,
      )}

      {cupboard.length ? (
        <section>
          <h2 className="section-label mb-2">From the cupboard</h2>
          <ul className="space-y-1">
            {cupboard.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </section>
      ) : null}

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
                onClick={() => start(() => acceptConfidenceNudge(meal.id))}
              >
                Yes, update
              </button>
              <button
                type="button"
                className="btn-text muted"
                onClick={() => start(() => dismissConfidenceNudge(meal.id))}
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

      {cookedAt ? (
        <button
          type="button"
          className="btn-outline"
          disabled={pending}
          onClick={() => start(() => undoCook(dayId))}
        >
          Cooked · Undo
        </button>
      ) : (
        <button
          type="button"
          className="btn-primary"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const willNudge =
                meal.confidence !== "KNOW" &&
                meal.cookCount + 1 >= meal.nudgeDismissedAtCookCount + 3;
              await logCook(dayId);
              router.push(
                willNudge
                  ? `/week/${weekStart}?nudge=${meal.id}`
                  : `/week/${weekStart}`,
              );
            })
          }
        >
          I cooked this
        </button>
      )}
    </main>
  );
}
