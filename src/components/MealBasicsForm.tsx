"use client";

import { useState, useTransition } from "react";
import { setConfidence, updateMealBasics } from "@/app/actions/meals";
import {
  confidenceActionLabel,
  methodLabel,
} from "@/lib/protein";
import { updateMealBasicsSchema } from "@/lib/schemas";

const METHODS = ["ASSEMBLE", "PAN", "ONE_POT", "TRAY", "BAKE", "OTHER"] as const;
const CONFIDENCE = ["KNOW", "PROMPT", "RECIPE"] as const;

export function MealBasicsForm({
  meal,
}: {
  meal: {
    id: string;
    name: string;
    confidence: string;
    method: string;
    cuisine: string | null;
    activeMinutes: number | null;
    totalMinutes: number | null;
    completePlate: boolean;
  };
}) {
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confidence, setLocalConfidence] = useState(meal.confidence);

  return (
    <form
      className="sheet space-y-4 p-5"
      noValidate
      action={(formData) => {
        const activeRaw = String(formData.get("activeMinutes") || "");
        const totalRaw = String(formData.get("totalMinutes") || "");
        const parsed = updateMealBasicsSchema.safeParse({
          mealId: meal.id,
          name: String(formData.get("name") || ""),
          method: String(formData.get("method") || ""),
          cuisine: String(formData.get("cuisine") || "") || null,
          activeMinutes: activeRaw === "" ? Number.NaN : Number(activeRaw),
          totalMinutes: totalRaw === "" ? Number.NaN : Number(totalRaw),
          completePlate: formData.get("completePlate") === "on",
        });
        if (!parsed.success) {
          const issue = parsed.error.issues[0];
          const key = issue?.path[0];
          setSaved(false);
          setError(
            key === "name"
              ? "Give the meal a name."
              : key === "activeMinutes"
                ? "Add the hands-on minutes."
                : key === "totalMinutes"
                  ? issue?.message || "Add the total minutes."
                  : "Check the fields and try again.",
          );
          return;
        }
        setError(null);
        start(async () => {
          setSaved(false);
          await updateMealBasics(meal.id, parsed.data);
          setSaved(true);
        });
      }}
    >
      <label className="block">
        <span className="section-label">Meal name</span>
        <input
          name="name"
          required
          defaultValue={meal.name}
          className="field font-display text-xl"
        />
      </label>

      <div>
        <div className="section-label mb-2">How well you know it</div>
        <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-[var(--line)] sm:grid-cols-3">
          {CONFIDENCE.map((value) => {
            const active = confidence === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                className={`min-h-11 px-3 text-sm font-semibold ${
                  active ? "seg-active" : "seg-idle"
                }`}
                disabled={pending}
                onClick={() => {
                  setLocalConfidence(value);
                  start(async () => {
                    await setConfidence(meal.id, value);
                    setSaved(true);
                  });
                }}
              >
                {confidenceActionLabel(value)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label>
          <span className="section-label">Hands-on minutes</span>
          <input
            name="activeMinutes"
            type="number"
            required
            min={1}
            max={600}
            inputMode="numeric"
            defaultValue={meal.activeMinutes ?? ""}
            className="field"
          />
        </label>
        <label>
          <span className="section-label">Total minutes</span>
          <input
            name="totalMinutes"
            type="number"
            required
            min={1}
            max={1440}
            inputMode="numeric"
            defaultValue={meal.totalMinutes ?? ""}
            className="field"
          />
        </label>
      </div>
      <label>
        <span className="section-label">Method</span>
        <select
          name="method"
          defaultValue={meal.method}
          className="field"
        >
          {METHODS.map((m) => (
            <option key={m} value={m}>
              {methodLabel(m)}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="section-label">Cuisine</span>
        <input
          name="cuisine"
          defaultValue={meal.cuisine ?? ""}
          className="field"
        />
      </label>
      <label className="flex min-h-11 items-center gap-3">
        <input
          type="checkbox"
          name="completePlate"
          defaultChecked={meal.completePlate}
        />
        Complete plate (one-pot / bowl)
      </label>
      {error ? (
        <p role="alert" className="text-sm text-[var(--warning)]">
          {error}
        </p>
      ) : null}
      <div className="flex items-center gap-3">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save meal"}
        </button>
        {saved && !pending ? (
          <span className="text-sm text-[var(--muted)]">Saved</span>
        ) : null}
      </div>
    </form>
  );
}
